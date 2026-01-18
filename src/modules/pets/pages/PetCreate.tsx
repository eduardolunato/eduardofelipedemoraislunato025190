import { useState, type FormEvent } from "react";
import { createPet } from "@/api/pets.service";
import type { PetRequestDto } from "@/modules/pets/types";
import axios from "axios";

type ApiErrorPayload = { message?: string; error?: string };

export default function PetCreate() {
  const [form, setForm] = useState<PetRequestDto>({
    nome: "",
    raca: "",
    idade: 0,
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof PetRequestDto>(key: K, value: PetRequestDto[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function validate() {
    if (!form.nome.trim()) return "Informe o nome.";
    if (form.nome.length > 100) return "Nome deve ter no máximo 100 caracteres.";
    if (!form.raca.trim()) return "Informe a raça.";
    if (form.raca.length > 100) return "Raça deve ter no máximo 100 caracteres.";
    if (!Number.isInteger(form.idade) || form.idade < 0) return "Idade deve ser um inteiro >= 0.";
    return null;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSuccess(null);
    setError(null);

    const v = validate();
    if (v) return setError(v);

    try {
      setLoading(true);
      const created = await createPet(form);
      setSuccess(`Pet cadastrado com sucesso! (ID: ${created.id})`);
      setForm({ nome: "", raca: "", idade: 0 });
    } catch (err: unknown) {
      let msg = "Erro ao cadastrar pet.";

      if (axios.isAxiosError<ApiErrorPayload>(err)) {
        msg = err.response?.data?.message || err.response?.data?.error || msg;
      }

      setError(msg);
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-xl rounded-xl bg-white p-6 shadow">
        <h1 className="mb-4 text-2xl font-bold">Cadastrar Pet</h1>

        {success && <div className="mb-4 rounded bg-green-50 p-3 text-green-700">{success}</div>}
        {error && <div className="mb-4 rounded bg-red-50 p-3 text-red-700">{error}</div>}

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Nome</label>
            <input
              className="w-full rounded border p-2"
              value={form.nome}
              onChange={(e) => update("nome", e.target.value)}
              maxLength={100}
              placeholder="Ex.: Rex"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Raça</label>
            <input
              className="w-full rounded border p-2"
              value={form.raca}
              onChange={(e) => update("raca", e.target.value)}
              maxLength={100}
              placeholder="Ex.: Labrador Retriever"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Idade</label>
            <input
              className="w-full rounded border p-2"
              type="number"
              value={form.idade}
              onChange={(e) => update("idade", Number(e.target.value))}
              min={0}
              step={1}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded bg-blue-600 py-2 font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {loading ? "Salvando..." : "Cadastrar"}
          </button>
        </form>
      </div>
    </div>
  );
}
