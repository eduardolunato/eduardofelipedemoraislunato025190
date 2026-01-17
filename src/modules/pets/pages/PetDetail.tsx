import { useParams } from "react-router-dom";

export default function PetDetail() {
  const { id } = useParams();

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Detalhe do Pet</h1>
      <p className="mt-2 text-gray-600">
        ID do pet: <strong>{id}</strong>
      </p>
    </div>
  );
}
