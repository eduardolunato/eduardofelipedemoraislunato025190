import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Save, Trash2, Upload, AlertTriangle, X } from "lucide-react";

import {
  getTutorById,
  updateTutor,
  addTutorFoto,
  deleteTutorFoto,
  deleteTutor,
  type TutorResponseDto,
  type TutorRequestDto,
} from "@/api/tutores.service";

import { maskCpfInput , maskPhone } from "@/utils/mask";

function onlyDigits(v: string) {
  return v.replace(/\D/g, "");
}
function clampDigits(v: string, max: number) {
  const d = onlyDigits(v);
  return d.length > max ? d.slice(0, max) : d;
}
function cpfDigitsToNumber(cpfDigits: string): number | undefined {
  const d = onlyDigits(cpfDigits);
  if (!d) return undefined;
  if (d.length !== 11) return undefined;

  // Se quiser bloquear CPF 000...000, descomente:
  // if (/^0{11}$/.test(d)) return undefined;

  // importante: Number("000...") vira 0, mas aqui tudo bem pro backend
  // se o backend aceitar. Se não quiser permitir, bloqueie acima.
  return Number(d);
}

export default function TutorEdit() {
  const { id } = useParams();
  const tutorId = useMemo(() => Number(id), [id]);
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [tutor, setTutor] = useState<TutorResponseDto | null>(null);

  // ✅ estados guardam SOMENTE DÍGITOS (evita bug dos zeros)
  const [cpfDigits, setCpfDigits] = useState("");
  const [phoneDigits, setPhoneDigits] = useState("");

  // form “texto”
  const [form, setForm] = useState({
    nome: "",
    email: "",
    endereco: "",
  });

  // ---------- FOTO ----------
  const [fotoUploading, setFotoUploading] = useState(false);
  const fotoUrl = tutor?.foto?.url ?? "";

  // ---------- MODAL EXCLUIR ----------
  const [deleteOpen, setDeleteOpen] = useState(false);

  const refreshTutor = useCallback(async () => {
    const data = await getTutorById(tutorId);
    setTutor(data);

    setForm({
      nome: data.nome ?? "",
      email: data.email ?? "",
      endereco: data.endereco ?? "",
    });

    // CPF vindo como number (sem zeros à esquerda). A gente guarda como dígitos.
    // Se vier undefined, fica vazio.
    const cpf = typeof data.cpf === "number" && Number.isFinite(data.cpf) ? String(data.cpf) : "";
    const cpfNormalized = cpf ? cpf.padStart(11, "0") : "";
    setCpfDigits(cpfNormalized === "00000000000" ? "" : cpfNormalized);

    const tel = (data.telefone ?? "").toString();
    setPhoneDigits(clampDigits(tel, 11));
  }, [tutorId]);

  useEffect(() => {
    let alive = true;

    async function load() {
      setLoading(true);
      setError(null);
      setSuccess(null);

      if (!Number.isFinite(tutorId) || tutorId <= 0) {
        setError("ID inválido.");
        setLoading(false);
        return;
      }

      try {
        await refreshTutor();
      } catch (e) {
        if (!alive) return;
        setError("Não foi possível carregar o tutor para edição.");
        console.error(e);
      } finally {
        if (alive) setLoading(false);
      }
    }

    load();
    return () => {
      alive = false;
    };
  }, [tutorId, refreshTutor]);

  function validate() {
    if (!form.nome.trim()) return "Informe o nome completo.";
    if (form.nome.trim().length > 120) return "Nome deve ter no máximo 120 caracteres.";

    const cpf = onlyDigits(cpfDigits);
    if (cpf && cpf.length !== 11) return "CPF deve conter 11 dígitos.";

    const tel = onlyDigits(phoneDigits);
    if (tel && !(tel.length === 10 || tel.length === 11)) return "Telefone deve conter 10 ou 11 dígitos.";

    if (form.email.trim()) {
      const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim());
      if (!ok) return "E-mail inválido.";
    }

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

    const payload: TutorRequestDto = {
      nome: form.nome.trim(),
      email: form.email.trim() || undefined,
      endereco: form.endereco.trim() || undefined,
      telefone: phoneDigits ? phoneDigits : undefined,
      cpf: cpfDigitsToNumber(cpfDigits),
    };

    try {
      setSaving(true);
      await updateTutor(tutorId, payload);
      setSuccess("Tutor atualizado com sucesso!");
      window.setTimeout(() => navigate(`/tutores/${tutorId}`), 500);
    } catch (e) {
      setError("Erro ao salvar alterações.");
      console.error(e);
    } finally {
      setSaving(false);
    }
  }

  async function onPickFoto(file: File | null) {
    if (!file) return;
    setError(null);
    setSuccess(null);

    try {
      setFotoUploading(true);

      // ✅ se já existe foto, remove antes (igual PetEdit)
      if (tutor?.foto?.id) {
        await deleteTutorFoto(tutorId, tutor.foto.id);
      }

      await addTutorFoto(tutorId, file);
      await refreshTutor();
      setSuccess("Foto atualizada com sucesso!");
    } catch (e) {
      setError("Não foi possível enviar a foto.");
      console.error(e);
    } finally {
      setFotoUploading(false);
    }
  }

  async function onRemoveFoto() {
    if (!tutor?.foto?.id) return;
    setError(null);
    setSuccess(null);

    try {
      setFotoUploading(true);
      await deleteTutorFoto(tutorId, tutor.foto.id);
      await refreshTutor();
      setSuccess("Foto removida com sucesso!");
    } catch (e) {
      setError("Não foi possível remover a foto.");
      console.error(e);
    } finally {
      setFotoUploading(false);
    }
  }

  async function confirmDeleteTutor() {
    setDeleteOpen(false);
    setError(null);
    setSuccess(null);

    try {
      await deleteTutor(tutorId);
      navigate("/tutores");
    } catch (e) {
      setError("Não foi possível excluir o tutor.");
      console.error(e);
    }
  }

  if (loading) {
    return (
      <div className="rounded-lg bg-white border border-gray-200 p-4 text-gray-700">
        Carregando...
      </div>
    );
  }

  if (!tutor && error) {
    return (
      <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-red-700">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Top actions */}
      <div className="flex items-center justify-between">
        <Link
          to={`/tutores/${tutorId}`}
          className="inline-flex items-center gap-2 rounded-lg border bg-white px-4 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Link>

        <div className="flex items-center gap-3">
          <div className="text-sm text-gray-600">
            Editando ID: <span className="font-medium">{tutorId}</span>
          </div>

          <button
            type="button"
            onClick={() => setDeleteOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" />
            Excluir
          </button>
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
                alt={form.nome || "Foto do tutor"}
                className="h-20 w-20 rounded-full object-cover bg-gray-100 border"
              />
            ) : (
              <div className="h-20 w-20 rounded-full bg-gray-100 border flex items-center justify-center text-gray-400 text-xs">
                Sem foto
              </div>
            )}

            {/* Upload overlay (azul) */}
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

            {/* Remove overlay (igual PetEdit) */}
            {tutor?.foto?.id ? (
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
            <h1 className="text-2xl font-bold text-gray-900">Editar Tutor</h1>
            <p className="mt-1 text-sm text-gray-600">
              Atualize os dados do tutor e clique em salvar. (Foto: usar o botão azul)
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

        {/* FORM */}
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Nome completo <span className="text-red-500">*</span>
            </label>
            <input
              className="mt-1 w-full rounded-lg border border-gray-300 bg-white p-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              value={form.nome}
              onChange={(e) => setForm((p) => ({ ...p, nome: e.target.value }))}
              maxLength={120}
              placeholder="Ex.: Maria do Carmo Silva"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                E-mail
              </label>
              <input
                className="mt-1 w-full rounded-lg border border-gray-300 bg-white p-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                value={form.email}
                onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                placeholder="Ex.: maria@email.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Telefone
              </label>
              <input
                className="mt-1 w-full rounded-lg border border-gray-300 bg-white p-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                value={maskPhone(phoneDigits)}
                onChange={(e) => setPhoneDigits(clampDigits(e.target.value, 11))}
                inputMode="numeric"
                placeholder="(65) 99999-9999"
              />
              <p className="mt-1 text-xs text-gray-500">10 ou 11 dígitos.</p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Endereço
              </label>
              <input
                className="mt-1 w-full rounded-lg border border-gray-300 bg-white p-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                value={form.endereco}
                onChange={(e) => setForm((p) => ({ ...p, endereco: e.target.value }))}
                placeholder="Ex.: Rua X, Nº 123, Bairro..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                CPF
              </label>
              <input
                className="mt-1 w-full rounded-lg border border-gray-300 bg-white p-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                value={maskCpfInput(cpfDigits)}
                onChange={(e) => setCpfDigits(clampDigits(e.target.value, 11))}
                inputMode="numeric"
                placeholder="000.000.000-00"
              />
              <p className="mt-1 text-xs text-gray-500">11 dígitos.</p>
            </div>
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

      {/* MODAL EXCLUIR (custom, igual ideia do PetEdit) */}
      {deleteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-lg border border-gray-200">
            <div className="flex items-start gap-3 p-6">
              <div className="mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-full bg-red-50 border border-red-200">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>

              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900">Confirmar exclusão</h3>
                <p className="mt-1 text-sm text-gray-600">
                  Tem certeza que deseja excluir este tutor? Essa ação não pode ser desfeita.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setDeleteOpen(false)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full hover:bg-gray-50"
                title="Fechar"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            <div className="flex items-center justify-end gap-2 px-6 pb-6">
              <button
                type="button"
                onClick={() => setDeleteOpen(false)}
                className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={confirmDeleteTutor}
                className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
              >
                <Trash2 className="h-4 w-4" />
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
