import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Pencil } from "lucide-react";

import { getTutorById, type TutorResponseDto } from "@/api/tutores.service";
import { maskCpf, maskPhone } from "@/utils/mask";

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

export default function TutorDetail() {
  const { id } = useParams();
  const tutorId = useMemo(() => Number(id), [id]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tutor, setTutor] = useState<TutorResponseDto | null>(null);

  useEffect(() => {
    let alive = true;

    async function load() {
      setLoading(true);
      setError(null);

      if (!Number.isFinite(tutorId) || tutorId <= 0) {
        setError("ID inválido.");
        setLoading(false);
        return;
      }

      try {
        const data = await getTutorById(tutorId);
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

  if (loading) {
    return (
      <div className="rounded-lg bg-white border border-gray-200 p-4 text-gray-700">
        Carregando...
      </div>
    );
  }

  if (error) {
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

      {/* Card */}
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
                <span className="text-gray-900">
                  {tutor.cpf ? maskCpf(tutor.cpf) : "—"}
                </span>
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
      </div>

      {/* Pets vinculados (placeholder) */}
      <div className="rounded-xl bg-white border border-gray-200 p-6 shadow-sm">
        <h2 className="text-lg font-bold text-gray-900">Pets vinculados</h2>
        <p className="mt-1 text-sm text-gray-600">
          listar/vincular/desvincular pets aqui.
        </p>

        <div className="mt-4 rounded-lg border border-dashed p-4 text-sm text-gray-600">
          (Placeholder) — Em construcao
        </div>
      </div>
    </div>
  );
}
