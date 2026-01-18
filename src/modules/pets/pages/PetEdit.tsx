import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Save } from "lucide-react";
import { getPetById, updatePet } from "@/api/pets.service";
import type { PetRequestDto } from "@/modules/pets/types";

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function toString(v: unknown) {
  return typeof v === "string" ? v : "";
}

function toNumber(v: unknown) {
  return typeof v === "number" && Number.isFinite(v) ? v : 0;
}

export default function PetEdit() {
  const { id } = useParams();
  const petId = useMemo(() => Number(id), [id]);

  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [form, setForm] = useState<PetRequestDto>({
    nome: "",
    raca: "",
    idade: 0,
  });

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
        const data = await getPetById(petId);

        if (!alive) return;

        if (!isObject(data)) throw new Error("Resposta inválida.");

        // Preenche com segurança (sem any)
        const nome = toString(data.nome);
        const raca = toString(data.raca);
        const idade = toNumber(data.idade);

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
        idade: form.idade,
      });

      setSuccess("Pet atualizado com sucesso!");
      // opcional: voltar pro detalhe depois de salvar
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

      <div className="rounded-xl bg-white border border-gray-200 p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900">Editar Pet</h1>
        <p className="mt-1 text-sm text-gray-600">
          Atualize os dados do pet e clique em salvar.
        </p>

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
            <label className="block text-sm font-medium text-gray-700">
              Nome
            </label>
            <input
              className="mt-1 w-full rounded-lg border border-gray-300 bg-white p-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              value={form.nome}
              onChange={(e) => updateField("nome", e.target.value)}
              maxLength={100}
              placeholder="Ex.: Rex"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Raça
            </label>
            <input
              className="mt-1 w-full rounded-lg border border-gray-300 bg-white p-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              value={form.raca}
              onChange={(e) => updateField("raca", e.target.value)}
              maxLength={100}
              placeholder="Ex.: Labrador"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Idade
            </label>
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
    </div>
  );
}
