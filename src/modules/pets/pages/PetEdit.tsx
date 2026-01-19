import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Save, Trash2, Upload, UserPlus, X } from "lucide-react";

import {
  getPetByIdCompleto,
  updatePet,
  addPetFoto,
  removePetFoto,
  type PetResponseCompletoDto,
  type TutorMiniDto,
} from "@/api/pets.service";

import {
  listTutores,
  vincularPetAoTutor,
  desvincularPetDoTutor,
  type TutorResponseDto,
} from "@/api/tutores.service";

import type { PetRequestDto } from "@/modules/pets/types";

const PAGE_SIZE_TUTORES = 8;

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}
function toString(v: unknown) {
  return typeof v === "string" ? v : "";
}
function toNumber(v: unknown) {
  return typeof v === "number" && Number.isFinite(v) ? v : 0;
}
function clampInt(n: number, min: number, max: number) {
  const x = Number.isFinite(n) ? Math.trunc(n) : min;
  return Math.min(max, Math.max(min, x));
}

/** debounce simples */
function useDebouncedValue<T>(value: T, delay = 350) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

export default function PetEdit() {
  const { id } = useParams();
  const petId = useMemo(() => Number(id), [id]);

  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [pet, setPet] = useState<PetResponseCompletoDto | null>(null);

  const [form, setForm] = useState<PetRequestDto>({
    nome: "",
    raca: "",
    idade: 0,
  });

  // ---------- FOTO ----------
  const [fotoUploading, setFotoUploading] = useState(false);
  const fotoUrl = pet?.foto?.url ?? "";

  async function refreshPet() {
    const data = await getPetByIdCompleto(petId);
    setPet(data);
  }

  async function onPickFoto(file: File | null) {
  if (!file) return;
  setError(null);
  setSuccess(null);

  try {
    setFotoUploading(true);

    // ✅ se já existe foto, remove antes para "trocar" de verdade
    if (pet?.foto?.id) {
      await removePetFoto(petId, pet.foto.id);
    }

    await addPetFoto(petId, file);
    await refreshPet();
    setSuccess("Foto atualizada com sucesso!");
  } catch (e) {
    setError("Não foi possível enviar a foto.");
    console.error(e);
  } finally {
    setFotoUploading(false);
  }
}


  async function onRemoveFoto() {
    if (!pet?.foto?.id) return;
    setError(null);
    setSuccess(null);

    try {
      setFotoUploading(true);
      await removePetFoto(petId, pet.foto.id);
      await refreshPet();
      setSuccess("Foto removida com sucesso!");
    } catch (e) {
      setError("Não foi possível remover a foto.");
      console.error(e);
    } finally {
      setFotoUploading(false);
    }
  }

  // ---------- TUTORES (BUSCA + VINCULAR) ----------
  const [tutorQuery, setTutorQuery] = useState("");
  const debouncedTutorQuery = useDebouncedValue(tutorQuery, 350);

  const [tutoresLoading, setTutoresLoading] = useState(false);
  const [tutoresSugestoes, setTutoresSugestoes] = useState<TutorResponseDto[]>(
    []
  );
  const [selectedTutor, setSelectedTutor] = useState<TutorResponseDto | null>(
    null
  );

  useEffect(() => {
  let alive = true;

  async function loadSugestoes() {
    const q = debouncedTutorQuery.trim();
    

    if (!q) {
      setTutoresSugestoes([]);
      return;
    }

    try {
      setTutoresLoading(true);

      // Busca no backend (mesmo que ele ignore filtro)
      const data = await listTutores({
        page: 0,
        size: 50, // pega mais para filtrar no front
        nome: q,   // mantém, caso o backend filtre
      });

      if (!alive) return;

      const raw = data.content ?? [];
      const lower = q.toLowerCase();

      // ✅ filtro sempre no front (nome OU id)
      const filtered = raw.filter((t) => {
        const nome = (t.nome ?? "").toLowerCase();
        const id = String(t.id ?? "");
        return nome.includes(lower) || id.includes(lower);
      });

      // ✅ limita para não poluir
      setTutoresSugestoes(filtered.slice(0, PAGE_SIZE_TUTORES));
    } catch (e) {
      if (!alive) return;
      console.error(e);
      setTutoresSugestoes([]);
    } finally {
      if (alive) setTutoresLoading(false);
    }
  }

  loadSugestoes();
  return () => {
    alive = false;
  };
}, [debouncedTutorQuery]);

  const currentTutores: TutorMiniDto[] = pet?.tutores ?? [];

  async function onVincularTutor() {
    setError(null);
    setSuccess(null);

    // aceita: selecionar da lista; ou digitar um ID
    const typed = tutorQuery.trim();

    // 1) se vier "qualquer coisa #123", captura o 123
    const hashMatch = typed.match(/#\s*(\d+)\s*$/);
    const hashId = hashMatch ? Number.parseInt(hashMatch[1], 10) : null;

    // 2) se vier só número
    const pureId = /^\d+$/.test(typed) ? Number.parseInt(typed, 10) : null;

    const typedId = hashId ?? pureId;

    const tutorId = selectedTutor?.id ?? typedId;

    if (!tutorId || !Number.isFinite(tutorId) || tutorId <= 0) {
      setError("Informe um tutor (nome) ou digite um ID válido.");
      return;
    }

    try {
      await vincularPetAoTutor(tutorId, petId);
      await refreshPet();
      setTutorQuery("");
      setSelectedTutor(null);
      setTutoresSugestoes([]);
      setSuccess("Tutor vinculado com sucesso!");
    } catch (e) {
      setError("Não foi possível vincular o tutor. Verifique o ID e tente novamente.");
      console.error(e);
    }
  }

  async function onDesvincularTutor(tutorId: number) {
    setError(null);
    setSuccess(null);

    try {
      await desvincularPetDoTutor(tutorId, petId);
      await refreshPet();
      setSuccess("Tutor desvinculado com sucesso!");
    } catch (e) {
      setError("Não foi possível desvincular o tutor.");
      console.error(e);
    }
  }

  // ---------- LOAD INICIAL ----------
  useEffect(() => {
    let alive = true;

    async function load() {
      setLoading(true);
      setError(null);
      setSuccess(null);

      if (!Number.isFinite(petId) || petId <= 0) {
        setError("ID inválido.");
        setLoading(false);
        return;
      }

      try {
        const data = await getPetByIdCompleto(petId);
        if (!alive) return;

        setPet(data);

        // Preenche form
        const nome = toString((data as unknown as Record<string, unknown>).nome);
        const raca = toString((data as unknown as Record<string, unknown>).raca);
        const idade = toNumber((data as unknown as Record<string, unknown>).idade);

        setForm({
          nome,
          raca,
          idade,
        });
      } catch (e) {
        if (!alive) return;
        setError("Não foi possível carregar o pet para edição.");
        console.error(e);
      } finally {
        if (alive) setLoading(false);
      }
    }

    load();
    return () => {
      alive = false;
    };
  }, [petId]);

  function updateField<K extends keyof PetRequestDto>(
    key: K,
    value: PetRequestDto[K]
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function validate() {
    if (!form.nome.trim()) return "Informe o nome.";
    if (form.nome.length > 100) return "Nome deve ter no máximo 100 caracteres.";
    if (!form.raca.trim()) return "Informe a raça.";
    if (form.raca.length > 100) return "Raça deve ter no máximo 100 caracteres.";
    if (!Number.isInteger(form.idade) || form.idade < 0)
      return "Idade deve ser um inteiro >= 0.";
    return null;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const v = validate();
    if (v) {
      setError(v);
      return;
    }

    try {
      setSaving(true);
      await updatePet(petId, {
        nome: form.nome.trim(),
        raca: form.raca.trim(),
        idade: clampInt(form.idade, 0, 200),
      });

      setSuccess("Pet atualizado com sucesso!");
      window.setTimeout(() => navigate(`/pets/${petId}`), 600);
    } catch (err: unknown) {
      let msg = "Erro ao atualizar pet.";
      if (isObject(err) && "response" in err) {
        const r = (err as { response?: { data?: unknown } }).response;
        if (isObject(r?.data)) {
          const m = (r.data as Record<string, unknown>).message;
          const e2 = (r.data as Record<string, unknown>).error;
          if (typeof m === "string") msg = m;
          else if (typeof e2 === "string") msg = e2;
        }
      }
      setError(msg);
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="rounded-lg bg-white border border-gray-200 p-4 text-gray-700">
        Carregando...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Top actions */}
      <div className="flex items-center justify-between">
        <Link
          to={`/pets/${petId}`}
          className="inline-flex items-center gap-2 rounded-lg border bg-white px-4 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Link>

        <div className="text-sm text-gray-600">
          Editando ID: <span className="font-medium">{petId}</span>
        </div>
      </div>

      {/* Card principal */}
      <div className="rounded-xl bg-white border border-gray-200 p-6 shadow-sm">
        {/* Header com foto redonda + título */}
        <div className="flex items-start gap-4">
          <div className="relative">
            {/* Avatar */}
            {fotoUrl ? (
              <img
                src={fotoUrl}
                alt={form.nome || "Foto do pet"}
                className="h-20 w-20 rounded-full object-cover bg-gray-100 border"
              />
            ) : (
              <div className="h-20 w-20 rounded-full bg-gray-100 border flex items-center justify-center text-gray-400 text-xs">
                Sem foto
              </div>
            )}

            {/* Upload overlay */}
            <label className="absolute -bottom-2 -right-2 cursor-pointer">
              <div className="inline-flex items-center justify-center h-9 w-9 rounded-full bg-blue-600 text-white shadow hover:bg-blue-700">
                <Upload className="h-4 w-4" />
              </div>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                disabled={fotoUploading}
                onChange={(e) => onPickFoto(e.target.files?.[0] ?? null)}
              />
            </label>

            {/* Remove overlay */}
            {pet?.foto?.id ? (
              <button
                type="button"
                onClick={onRemoveFoto}
                disabled={fotoUploading}
                className="absolute -top-2 -right-2 inline-flex items-center justify-center h-8 w-8 rounded-full bg-white border shadow hover:bg-gray-50 disabled:opacity-60"
                title="Remover foto"
              >
                <Trash2 className="h-4 w-4 text-red-600" />
              </button>
            ) : null}
          </div>

          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">Editar Pet</h1>
            <p className="mt-1 text-sm text-gray-600">
              Atualize os dados do pet e clique em salvar. (Foto: usar o botão azul)
            </p>
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

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Nome</label>
            <input
              className="mt-1 w-full rounded-lg border border-gray-300 bg-white p-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              value={form.nome}
              onChange={(e) => updateField("nome", e.target.value)}
              maxLength={100}
              placeholder="Ex.: Rex"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Raça</label>
            <input
              className="mt-1 w-full rounded-lg border border-gray-300 bg-white p-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              value={form.raca}
              onChange={(e) => updateField("raca", e.target.value)}
              maxLength={100}
              placeholder="Ex.: Labrador"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Idade</label>
            <input
              type="number"
              className="mt-1 w-full rounded-lg border border-gray-300 bg-white p-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              value={form.idade}
              onChange={(e) => updateField("idade", Number(e.target.value))}
              min={0}
              step={1}
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
          >
            <Save className="h-4 w-4" />
            {saving ? "Salvando..." : "Salvar alterações"}
          </button>
        </form>
      </div>

      {/* Card: Tutores */}
      <div className="rounded-xl bg-white border border-gray-200 p-6 shadow-sm">
        <h2 className="text-lg font-bold text-gray-900">Tutores</h2>
        <p className="text-sm text-gray-600 mt-1">
          Busque por nome (ou digite o ID) e clique em vincular.
        </p>

        {/* Lista de tutores vinculados */}
        <div className="mt-4 space-y-2">
          {currentTutores.length === 0 ? (
            <div className="text-sm text-gray-600">Nenhum tutor vinculado.</div>
          ) : (
            currentTutores.map((t) => (
              <div
                key={t.id}
                className="flex items-center justify-between rounded-lg border border-gray-200 p-3"
              >
                <div className="min-w-0">
                  <div className="font-medium text-gray-900">
                    {t.nome} <span className="text-gray-500">#{t.id}</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    {t.email ? t.email : ""}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onDesvincularTutor(t.id)}
                  className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                  title="Desvincular"
                >
                  <X className="h-4 w-4 text-red-600" />
                  Remover vínculo
                </button>
              </div>
            ))
          )}
        </div>

        {/* Busca + sugestões */}
        <div className="mt-5">
          <label className="block text-sm font-medium text-gray-700">
            Buscar tutor (nome ou ID)
          </label>

          <div className="mt-1 flex gap-2">
            <div className="relative flex-1">
              <input
                value={tutorQuery}
                onChange={(e) => {
                  setTutorQuery(e.target.value);
                  setSelectedTutor(null); // ✅ se digitou, não está mais selecionado
                }}
                placeholder="Ex.: Maria (ou 12)"
                className="w-full rounded-lg border border-gray-300 bg-white p-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              />

              {/* dropdown */}
              {tutorQuery.trim() && tutoresSugestoes.length > 0 && (
                <div className="absolute z-10 mt-2 w-full rounded-lg border bg-white shadow">
                  {tutoresSugestoes.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => {
                        setSelectedTutor(t);
                        setTutorQuery(`${t.nome} #${t.id}`); // ✅ visual, mas mantém o id no selectedTutor
                        setTutoresSugestoes([]);
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-gray-50"
                    >
                      <div className="font-medium text-gray-900">
                        {t.nome} <span className="text-gray-500">#{t.id}</span>
                      </div>
                      <div className="text-xs text-gray-600">
                        {t.email ?? ""}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {tutorQuery.trim() && tutoresLoading && (
                <div className="mt-2 text-xs text-gray-500">Buscando...</div>
              )}
            </div>

            <button
              type="button"
              onClick={onVincularTutor}
              className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
            >
              <UserPlus className="h-4 w-4" />
              Vincular
            </button>
          </div>

          <p className="mt-2 text-xs text-gray-500">
            Dica: se você digitar apenas números, ele tenta usar como ID direto.
          </p>
        </div>
      </div>
    </div>
  );
}
