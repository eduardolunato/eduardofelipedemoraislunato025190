import { Link } from "react-router-dom";
import type { PetResponseDto } from "@/modules/pets/types";


type Props = {
  pet: PetResponseDto;
};

export default function PetCard({ pet }: Props) {
  const fotoUrl = pet.foto?.url;

  return (
    <Link
      to={`/pets/${pet.id}`}
      className="block overflow-hidden rounded-xl border bg-white shadow-sm transition hover:shadow-md"
    >
      <div className="h-36 w-full bg-gray-100">
        {fotoUrl ? (
          <img
            src={fotoUrl}
            alt={pet.nome}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-gray-500">
            Sem foto
          </div>
        )}
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-lg font-semibold leading-tight">{pet.nome}</h2>
          <span className="rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">
            {pet.idade} anos
          </span>
        </div>

        <p className="mt-2 text-sm text-gray-600">
          <span className="font-medium">Raça:</span> {pet.raca}
        </p>
      </div>
    </Link>
  );
}
