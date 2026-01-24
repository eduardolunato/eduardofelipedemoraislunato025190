import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Pencil, X, UserPlus } from "lucide-react";
import { listPets, getPetByIdCompleto } from "@/api/pets.service";
import type { PetResponseDto } from "@/modules/pets/types";

import {
  getTutorByIdCompleto,
  vincularPetAoTutor,
  desvincularPetDoTutor,
  type TutorResponseCompletoDto,
  type PetMiniDto,
} from "@/api/tutores.service";

import { maskCpf, maskPhone } from "@/utils/mask";

// ----------------- helpers -----------------
function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function normalizeText(s: string) {
  return (s ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function onlyDigits(v: string) {
  return (v ?? "").replace(/\D/g, "");
}

/** Debounce simples */
function useDebouncedValue<T>(value: T, delay = 350) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

function petPhotoUrl(pet: PetMiniDto | PetResponseDto) {
  if (!isObject(pet)) return "";

  const foto = (pet as unknown as Record<string, unknown>).foto;
  if (isObject(foto) && typeof (foto as Record<string, unknown>).url === "string") {
    return (foto as Record<string, unknown>).url as string;
  }

  const fotoUrl = (pet as unknown as Record<string, unknown>).fotoUrl;
  if (typeof fotoUrl === "string") return fotoUrl;

  const photoUrl = (pet as unknown as Record<string, unknown>).photoUrl;
  if (typeof photoUrl === "string") return photoUrl;

  return "";
}

/** tenta extrair status e message do erro do axios, sem quebrar */
function getAxiosErrorInfo(e: unknown): { status?: number; message?: string } {
  if (!isObject(e)) return {};
  const resp = (e as Record<string, unknown>).response;
  if (!isObject(resp)) return {};

  const status = typeof resp.status === "number" ? resp.status : undefined;

  const data = resp.data;
  let message: string | undefined;

  if (typeof data === "string") message = data;
  else if (isObject(data)) {
    const m = (data as Record<string, unknown>).message;
    const err = (data as Record<string, unknown>).error;
    if (typeof m === "string") message = m;
    else if (typeof err === "string") message = err;
  }

  return { status, message };
}

// ----------------- component -----------------
export default function TutorDetail() {
  const { id } = useParams();
  const tutorId = useMemo(() => Number(id), [id]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [tutor, setTutor] = useState<TutorResponseCompletoDto | null>(null);

  // ---------- PETS (BUSCA + VINCULAR) ----------
  const [petQuery, setPetQuery] = useState("");
  const debouncedPetQuery = useDebouncedValue(petQuery, 350);

  const [petsLoading, setPetsLoading] = useState(false);
  const [petsSugestoes, setPetsSugestoes] = useState<PetResponseDto[]>([]);
  const [selectedPet, setSelectedPet] = useState<PetResponseDto | null>(null);

  const [linking, setLinking] = useState(false);

  async function refreshTutor() {
    const data = await getTutorByIdCompleto(tutorId);
    setTutor(data);
  }

  useEffect(() => {
    let alive = true;

    async function load() {
      setSuccess(null);
      setLoading(true);
      setError(null);

      if (!Number.isFinite(tutorId) || tutorId <= 0) {
        setError("ID inválido.");
        setLoading(false);
        return;
      }

      try {
        const data = await getTutorByIdCompleto(tutorId);
        if (!alive) return;
        setTutor(data);
      } catch (e) {
        if (!alive) return;
        console.error(e);
        setError("Não foi possível carregar o tutor.");
      } finally {
        if (alive) setLoading(false);
      }
    }

    load();
    return () => {
      alive = false;
    };
  }, [tutorId]);

  // Sugestões de pets conforme busca
  useEffect(() => {
    let alive = true;

    async function loadSugestoes() {
      const q = debouncedPetQuery.trim();
      setSelectedPet(null);

      if (!q) {
        setPetsSugestoes([]);
        return;
      }

      try {
        setPetsLoading(true);
        const data = await listPets({ page: 0, size: 500, nome: q || undefined });
        if (!alive) return;

        const raw = (data as unknown as { content?: PetResponseDto[] }).content ?? [];
        const lower = normalizeText(q);

        const filtered = raw.filter((p) => {
          const nome = normalizeText(p.nome ?? "");
          const pid = String(p.id ?? "");
          return nome.includes(lower) || pid.includes(lower);
        });

        setPetsSugestoes(filtered.slice(0, 8));
      } catch (e) {
        if (!alive) return;
        console.error(e);
        setPetsSugestoes([]);
      } finally {
        if (alive) setPetsLoading(false);
      }
    }

    loadSugestoes();
    return () => {
      alive = false;
    };
  }, [debouncedPetQuery]);

  // util: ids de pets vinculados a este tutor
  const linkedPetIds = useMemo(() => {
    return new Set((tutor?.pets ?? []).map((p) => p.id));
  }, [tutor?.pets]);

  const currentPets = tutor?.pets ?? [];

  // resolve id do pet escolhido (selecionado ou digitado)
  function resolvePetIdFromInput(): number | null {
    const typed = petQuery.trim();
    const typedDigits = onlyDigits(typed);
    const typedId =
      typedDigits && /^\d+$/.test(typedDigits) ? Number.parseInt(typedDigits, 10) : null;

    const petId = selectedPet?.id ?? typedId;
    if (!petId || !Number.isFinite(petId) || petId <= 0) return null;
    return petId;
  }

  const resolvedPetId = resolvePetIdFromInput();
  const petAlreadyLinkedHere = resolvedPetId ? linkedPetIds.has(resolvedPetId) : false;

  // ✅ validação: impede vincular pet que já pertence a OUTRO tutor
  async function validatePetNotLinkedToOtherTutor(petId: number): Promise<boolean> {
    try {
      const petFull = await getPetByIdCompleto(petId);
      const tutores = petFull.tutores ?? [];

      // sem tutores => pode vincular
      if (tutores.length === 0) return true;

      // já vinculado a este tutor => bloqueia com msg específica
      const hasThisTutor = tutores.some((t) => t.id === tutorId);
      if (hasThisTutor) {
        setError("Este pet já está vinculado a este tutor.");
        return false;
      }

      // vinculado a outro tutor => bloqueia
      const other = tutores[0];
      setError(
        `Este pet já está vinculado a outro tutor (${other.nome ?? "Tutor"} #${other.id}).`
      );
      return false;
    } catch (e) {
      console.error(e);
      setError("Não foi possível validar o vínculo do pet. Tente novamente.");
      return false;
    }
  }

  async function onVincularPet() {
    setError(null);
    setSuccess(null);

    const petId = resolvePetIdFromInput();
    if (!petId) {
      setError("Selecione um pet na lista ou digite um ID válido.");
      return;
    }

    // ✅ bloqueio rápido (mesmo tutor)
    if (linkedPetIds.has(petId)) {
      setError("Este pet já está vinculado a este tutor.");
      return;
    }

    try {
      setLinking(true);

      // ✅ valida antes (outro tutor)
      const okToLink = await validatePetNotLinkedToOtherTutor(petId);
      if (!okToLink) return;

      await vincularPetAoTutor(tutorId, petId);

      await refreshTutor();
      setPetQuery("");
      setSelectedPet(null);
      setPetsSugestoes([]);
      setSuccess("Pet vinculado com sucesso!");
    } catch (e: unknown) {
      console.error(e);

      // fallback: se backend bloquear, mostramos msg
      const info = getAxiosErrorInfo(e);

      if (info.status === 409) {
        setError(info.message || "Este pet já está vinculado a outro tutor.");
        return;
      }

      if (info.status && info.status >= 400 && info.status < 500) {
        setError(info.message || "Não foi possível vincular o pet. Verifique e tente novamente.");
        return;
      }

      setError("Não foi possível vincular o pet. Tente novamente.");
    } finally {
      setLinking(false);
    }
  }

  async function onDesvincularPet(petId: number) {
    setError(null);
    setSuccess(null);

    try {
      await desvincularPetDoTutor(tutorId, petId);
      await refreshTutor();
      setSuccess("Vínculo removido com sucesso!");
    } catch (e) {
      console.error(e);
      setError("Não foi possível remover o vínculo.");
    }
  }

  // ----------------- render -----------------
  if (loading) {
    return (
      <div className="rounded-lg bg-white border border-gray-200 p-4 text-gray-700">
        Carregando...
      </div>
    );
  }

  if (error && !tutor) {
    return (
      <div className="space-y-4">
        <Link
          to="/tutores"
          className="inline-flex items-center gap-2 rounded-lg border bg-white px-4 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Link>

        <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-red-700">
          {error}
        </div>
      </div>
    );
  }

  if (!tutor || !isObject(tutor)) {
    return (
      <div className="space-y-4">
        <Link
          to="/tutores"
          className="inline-flex items-center gap-2 rounded-lg border bg-white px-4 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Link>

        <div className="rounded-lg bg-white border border-gray-200 p-6 text-gray-700">
          Tutor não encontrado.
        </div>
      </div>
    );
  }

  const fotoUrl = tutor.foto?.url ?? "";

  return (
    <div className="space-y-4">
      {/* Top actions */}
      <div className="flex items-center justify-between">
        <Link
          to="/tutores"
          className="inline-flex items-center gap-2 rounded-lg border bg-white px-4 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Link>

        <Link
          to={`/tutores/${tutorId}/editar`}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          <Pencil className="h-4 w-4" />
          Editar
        </Link>
      </div>

      {/* Card tutor */}
      <div className="rounded-xl bg-white border border-gray-200 p-6 shadow-sm">
        <div className="flex items-start gap-4">
          {fotoUrl ? (
            <img
              src={fotoUrl}
              alt={tutor.nome}
              className="h-20 w-20 rounded-full object-cover bg-gray-100 border"
            />
          ) : (
            <div className="h-20 w-20 rounded-full bg-gray-100 border flex items-center justify-center text-gray-400 text-xs">
              Sem foto
            </div>
          )}

          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">
              {tutor.nome} <span className="text-gray-400">#{tutor.id}</span>
            </h1>

            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              <div className="text-sm">
                <span className="font-medium text-gray-700">CPF: </span>
                <span className="text-gray-900">{tutor.cpf ? maskCpf(tutor.cpf) : "—"}</span>
              </div>

              <div className="text-sm">
                <span className="font-medium text-gray-700">Telefone: </span>
                <span className="text-gray-900">
                  {tutor.telefone ? maskPhone(tutor.telefone) : "—"}
                </span>
              </div>

              <div className="text-sm">
                <span className="font-medium text-gray-700">E-mail: </span>
                <span className="text-gray-900">{tutor.email ?? "—"}</span>
              </div>

              <div className="text-sm">
                <span className="font-medium text-gray-700">Endereço: </span>
                <span className="text-gray-900">{tutor.endereco ?? "—"}</span>
              </div>
            </div>
          </div>
        </div>

        {success && (
          <div className="mt-4 rounded-lg bg-green-50 border border-green-200 p-3 text-green-700">
            {success}
          </div>
        )}
        {error && (
          <div className="mt-4 rounded-lg bg-red-50 border border-red-200 p-3 text-red-700">
            {error}
          </div>
        )}
      </div>

      {/* Pets vinculados */}
      <div className="rounded-xl bg-white border border-gray-200 p-6 shadow-sm">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Pets vinculados</h2>
            <p className="mt-1 text-sm text-gray-600">
              Liste, vincule ou remova o vínculo de pets para este tutor.
            </p>
          </div>
          <div className="text-sm text-gray-600">
            Total: <span className="font-medium">{currentPets.length}</span>
          </div>
        </div>

        {/* Lista */}
        <div className="mt-4 space-y-3">
          {currentPets.length === 0 ? (
            <div className="rounded-lg bg-white border border-gray-200 p-4 text-gray-700">
              Nenhum pet vinculado.
            </div>
          ) : (
            currentPets.map((p) => {
              const photo = petPhotoUrl(p);

              return (
                <div
                  key={p.id}
                  className="bg-white rounded-lg border border-gray-200 p-4 flex items-center gap-4 hover:shadow-md transition-shadow"
                >
                  {photo ? (
                    <img
                      src={photo}
                      alt={p.nome}
                      className="w-14 h-14 rounded-full bg-gray-100 object-cover"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 text-xs">
                      Sem foto
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="text-base font-semibold text-gray-800 truncate">
                      {p.nome} <span className="text-gray-400">#{p.id}</span>
                    </div>
                    <div className="text-sm text-gray-600">
                      {typeof p.idade === "number" ? `${p.idade} anos` : ""}
                      {p.raca ? ` • ${p.raca}` : ""}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      to={`/pets/${p.id}`}
                      className="px-4 py-2 text-sm font-medium text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                    >
                      Ver
                    </Link>

                    <button
                      type="button"
                      onClick={() => onDesvincularPet(p.id)}
                      className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                      title="Remover vínculo"
                    >
                      <X className="h-4 w-4 text-red-600" />
                      Desvincular
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Vincular */}
        <div className="mt-6 border-t pt-5">
          <h3 className="text-sm font-semibold text-gray-900">Vincular novo pet</h3>
          <p className="mt-1 text-sm text-gray-600">
            Busque por <span className="font-medium">nome</span> ou digite o{" "}
            <span className="font-medium">ID</span> do pet.
          </p>

          <div className="mt-3 flex gap-2">
            <div className="relative flex-1">
              <input
                value={petQuery}
                onChange={(e) => {
                  setPetQuery(e.target.value);
                  setSelectedPet(null);
                }}
                placeholder="Ex.: Rex (ou 12)"
                className="w-full rounded-lg border border-gray-300 bg-white p-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              />

              {/* dropdown */}
              {petQuery.trim() && petsSugestoes.length > 0 && (
                <div className="absolute z-10 mt-2 w-full rounded-lg border bg-white shadow">
                  {petsSugestoes.map((p) => {
                    const already = linkedPetIds.has(p.id);
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          setSelectedPet(p);
                          setPetQuery(`${p.nome} #${p.id}`);
                          setPetsSugestoes([]);
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-gray-50"
                      >
                        <div className="font-medium text-gray-900">
                          {p.nome} <span className="text-gray-500">#{p.id}</span>
                          {already ? (
                            <span className="ml-2 text-xs font-semibold text-gray-500">
                              (já vinculado)
                            </span>
                          ) : null}
                        </div>
                        <div className="text-xs text-gray-600">
                          {typeof p.idade === "number" ? `${p.idade} anos` : ""}
                          {p.raca ? ` • ${p.raca}` : ""}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {petQuery.trim() && petsLoading && (
                <div className="mt-2 text-xs text-gray-500">Buscando...</div>
              )}
            </div>

            <button
              type="button"
              onClick={onVincularPet}
              disabled={linking || petAlreadyLinkedHere}
              className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-60"
              title={petAlreadyLinkedHere ? "Este pet já está vinculado a este tutor" : undefined}
            >
              <UserPlus className="h-4 w-4" />
              {linking ? "Vinculando..." : "Vincular"}
            </button>
          </div>

          {petAlreadyLinkedHere && (
            <p className="mt-2 text-xs text-gray-600">
              Este pet já está vinculado a este tutor.
            </p>
          )}

          <p className="mt-2 text-xs text-gray-500">
            Dica: se você digitar apenas números, ele tenta usar como ID direto.
          </p>
        </div>
      </div>
    </div>
  );
}
