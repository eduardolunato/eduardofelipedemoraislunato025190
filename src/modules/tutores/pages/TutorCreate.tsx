import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Save } from "lucide-react";

import { createTutor } from "@/api/tutores.service";
import { maskCpfInput, maskPhoneInput, onlyDigits } from "@/utils/mask";


type TutorRequestDto = {
  nome: string;
  email?: string;
  telefone?: string;
  endereco?: string;
  cpf?: number;
};

function clampCpf(input: string): number | undefined {
  const cleaned = input.replace(/\D/g, "").trim();
  if (!cleaned) return undefined;

  const n = Number(cleaned);
  return Number.isFinite(n) ? n : undefined;
}

export default function TutorCreate() {
  const navigate = useNavigate();

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    nome: "",
    email: "",
    telefone: "",
    endereco: "",
    cpf: "", // manter como string no input
  });

  function validate(): string | null {
    if (!form.nome.trim()) return "Informe o nome completo.";
    if (form.nome.trim().length > 120) return "Nome deve ter no máximo 120 caracteres.";

    if (form.email.trim()) {
      // validação simples
      const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim());
      if (!ok) return "E-mail inválido.";
    }

    // telefone/endereco sem obrigatoriedade por enquanto
    // cpf: se preencheu, precisa ter 11 dígitos (validação básica)
    const cpfDigits = form.cpf.replace(/\D/g, "");
    if (cpfDigits) {
      if (cpfDigits.length !== 11) return "CPF deve ter 11 dígitos (apenas números).";
      if (/^0{11}$/.test(cpfDigits)) return "CPF inválido.";
    }

    return null;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const v = validate();
    if (v) {
      setError(v);
      return;
    }

    const payload: TutorRequestDto = {
      nome: form.nome.trim(),
      email: form.email.trim() || undefined,
      telefone: onlyDigits(form.telefone) || undefined,
      endereco: form.endereco.trim() || undefined,
      cpf: clampCpf(form.cpf),
    };

    try {
      setSaving(true);
      const created = await createTutor(payload);
      // navega para detalhe do tutor
      navigate(`/tutores/${created.id}`);
    } catch (err) {
      console.error(err);
      setError("Não foi possível cadastrar o tutor.");
    } finally {
      setSaving(false);
    }
  }

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
      </div>

      <div className="rounded-xl bg-white border border-gray-200 p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900">Cadastrar Tutor</h1>
        <p className="mt-1 text-sm text-gray-600">
          Preencha os dados e clique em salvar.
        </p>

        {error && (
          <div className="mt-4 rounded-lg bg-red-50 border border-red-200 p-3 text-red-700">
            {error}
          </div>
        )}

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
                value={form.telefone}
                onChange={(e) => 
                  setForm((p) => ({ ...p, telefone: maskPhoneInput(e.target.value) }))}
                placeholder="Ex.: (65) 99999-9999"
                maxLength={15}
              />
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
                value={form.cpf}
                onChange={(e) => 
                  setForm((p) => ({ ...p, cpf: maskCpfInput(e.target.value) }))}
                placeholder="000.000.000-00"
                maxLength={14}
              />
              <p className="mt-1 text-xs text-gray-500">
                Se preencher, use 11 dígitos. (Validação simples)
              </p>
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
          >
            <Save className="h-4 w-4" />
            {saving ? "Salvando..." : "Salvar tutor"}
          </button>
        </form>
      </div>
    </div>
  );
}
