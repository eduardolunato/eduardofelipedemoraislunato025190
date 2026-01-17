import { useEffect, useMemo, useState } from "react";
import PetCard from "@/components/PetCard";
import { listPets } from "@/api/pets.service";
import type { PetResponseDto } from "@/modules/pets/types";


const PAGE_SIZE = 10;

export default function PetsList() {
  const [nome, setNome] = useState("");
  const [page, setPage] = useState(0);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [items, setItems] = useState<PetResponseDto[]>([]);
  const [pageCount, setPageCount] = useState(0);
  const [total, setTotal] = useState(0);

  const canPrev = page > 0;
  const canNext = page + 1 < pageCount;

  // debounce simples da busca
  const debouncedNome = useMemo(() => nome.trim(), [nome]);

  useEffect(() => {
    let alive = true;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const data = await listPets({
          page,
          size: PAGE_SIZE,
          nome: debouncedNome || undefined,
        });

        if (!alive) return;
        setItems(data.content);
        setPageCount(data.pageCount);
        setTotal(data.total);
      } catch (e) {
        if (!alive) return;
        setError("Não foi possível carregar a lista de pets.");
        console.error(e);
      } finally {
        if (alive) setLoading(false);
      }
    }

    load();
    return () => {
      alive = false;
    };
  }, [page, debouncedNome]);

  function onSearchChange(value: string) {
    setNome(value);
    setPage(0); // sempre volta pra primeira página quando muda filtro
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-5xl">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Pets</h1>
            <p className="text-sm text-gray-600">
              Total: <span className="font-medium">{total}</span>
            </p>
          </div>

          <div className="w-full sm:w-80">
            <label className="block text-sm font-medium text-gray-700">
              Buscar por nome
            </label>
            <input
              className="mt-1 w-full rounded-lg border bg-white p-2 outline-none focus:ring-2 focus:ring-blue-200"
              placeholder="Ex.: Rex"
              value={nome}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 p-3 text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="rounded-lg bg-white p-6 shadow-sm">Carregando...</div>
        ) : (
          <>
            {items.length === 0 ? (
              <div className="rounded-lg bg-white p-6 shadow-sm">
                Nenhum pet encontrado.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((pet) => (
                  <PetCard key={pet.id} pet={pet} />
                ))}
              </div>
            )}

            <div className="mt-6 flex items-center justify-between">
              <button
                className="rounded-lg border bg-white px-4 py-2 text-sm font-medium disabled:opacity-50"
                disabled={!canPrev || loading}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
              >
                Anterior
              </button>

              <div className="text-sm text-gray-700">
                Página <span className="font-medium">{page + 1}</span>{" "}
                {pageCount > 0 ? (
                  <>
                    de <span className="font-medium">{pageCount}</span>
                  </>
                ) : null}
              </div>

              <button
                className="rounded-lg border bg-white px-4 py-2 text-sm font-medium disabled:opacity-50"
                disabled={!canNext || loading}
                onClick={() => setPage((p) => p + 1)}
              >
                Próxima
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
