import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, User } from "lucide-react";
import { getPetById } from "@/api/pets.service";
import { getTutorById, type TutorResponseDto } from "@/api/tutores.service";
import type { PetResponseDto } from "@/modules/pets/types";

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function petPhotoUrl(pet: PetResponseDto) {
  const foto = (pet as unknown as Record<string, unknown>).foto;
  if (isObject(foto) && typeof foto.url === "string") return foto.url;
  return "";
}

type PetResponseCompleto = PetResponseDto & {
  tutores?: Array<{ id: number }>;
};

export default function PetDetail() {
  const params = useParams();
  const id = useMemo(() => Number(params.id), [params.id]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [pet, setPet] = useState<PetResponseCompleto | null>(null);
  const [tutor, setTutor] = useState<TutorResponseDto | null>(null);

  useEffect(() => {
    let alive = true;

    async function load() {
      setLoading(true);
      setError(null);
      setPet(null);
      setTutor(null);

      if (!Number.isFinite(id) || id <= 0) {
        setError("ID inválido.");
        setLoading(false);
        return;
      }

      try {
        const data = await getPetById(id);
        if (!alive) return;

        if (!isObject(data)) {
          throw new Error("Resposta inválida do servidor.");
        }

        const petData = data as PetResponseCompleto;
        setPet(petData);

        const tutorId = petData.tutores?.[0]?.id;
        if (typeof tutorId === "number") {
          const t = await getTutorById(tutorId);
          if (!alive) return;
          setTutor(t);
        }
      } catch (e) {
        if (!alive) return;
        setError("Não foi possível carregar os detalhes do pet.");
        console.error(e);
      } finally {
        if (alive) setLoading(false);
      }
    }

    load();
    return () => {
      alive = false;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="rounded-lg bg-white border border-gray-200 p-4 text-gray-700">
        Carregando...
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-3">
        <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-red-700">
          {error}
        </div>
        <Link
          to="/pets"
          className="inline-flex items-center gap-2 rounded-lg border bg-white px-4 py-2 text-sm font-semibold"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Link>
      </div>
    );
  }

  if (!pet) return null;

  const photo = petPhotoUrl(pet);

  return (
    <div className="space-y-4">
      <Link
        to="/pets"
        className="inline-flex items-center gap-2 rounded-lg border bg-white px-4 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar para lista
      </Link>

      <div className="rounded-xl bg-white border border-gray-200 p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          {photo ? (
            <img
              src={photo}
              alt={pet.nome}
              className="h-24 w-24 rounded-full object-cover bg-gray-100"
            />
          ) : (
            <div className="h-24 w-24 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 text-sm">
              Sem foto
            </div>
          )}

          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900">{pet.nome}</h1>
            <p className="mt-1 text-sm text-gray-600">
              {pet.idade} anos{pet.raca ? ` • ${pet.raca}` : ""}
            </p>
          </div>

          <Link
            to={`/pets/${pet.id}/editar`}
            className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Editar
          </Link>
        </div>
      </div>

      <div className="rounded-xl bg-white border border-gray-200 p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <User className="h-5 w-5 text-gray-700" />
          <h2 className="text-lg font-semibold text-gray-900">Tutor</h2>
        </div>

        {!tutor ? (
          <p className="text-sm text-gray-600">Nenhum tutor vinculado.</p>
        ) : (
          <div className="flex flex-col gap-2 text-sm text-gray-700">
            <div>
              <span className="font-medium">Nome:</span> {tutor.nome}
            </div>
            {tutor.telefone && (
              <div>
                <span className="font-medium">Telefone:</span> {tutor.telefone}
              </div>
            )}
            {tutor.email && (
              <div>
                <span className="font-medium">E-mail:</span> {tutor.email}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
