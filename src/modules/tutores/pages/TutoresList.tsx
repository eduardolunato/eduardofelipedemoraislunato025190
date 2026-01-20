import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { listTutores, type TutorResponseDto } from "@/api/tutores.service";
import { maskCpf, maskPhone } from "@/utils/mask";


const PAGE_SIZE = 10;

/** Type guard helpers (sem any) */
function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
function toNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}
function toArray<T>(value: unknown): T[] | undefined {
  return Array.isArray(value) ? (value as T[]) : undefined;
}

/** Normaliza resposta paginada (API pode variar nomes) */
function normalizePaged<T>(data: unknown): { content: T[]; total: number } {
  if (!isObject(data)) return { content: [], total: 0 };

  const content = toArray<T>(data.content) ?? [];

  const total =
    toNumber(data.total) ??
    toNumber(data.totalElements) ??
    content.length;

  return {
    content,
    total: Math.max(0, total),
  };
}

function getPageNumbers(currentPage: number, totalPages: number) {
  const pages: Array<number | "..."> = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    if (currentPage <= 3) pages.push(1, 2, 3, "...", totalPages);
    else if (currentPage >= totalPages - 2)
      pages.push(1, "...", totalPages - 2, totalPages - 1, totalPages);
    else pages.push(1, "...", currentPage, "...", totalPages);
  }
  return pages;
}

/** tenta achar foto sem any */
function tutorPhotoUrl(tutor: TutorResponseDto) {
  if (!isObject(tutor)) return "";

  const foto = (tutor as unknown as Record<string, unknown>).foto;
  if (isObject(foto) && typeof (foto as Record<string, unknown>).url === "string") {
    return (foto as Record<string, unknown>).url as string;
  }

  const fotoUrl = (tutor as unknown as Record<string, unknown>).fotoUrl;
  if (typeof fotoUrl === "string") return fotoUrl;

  const photoUrl = (tutor as unknown as Record<string, unknown>).photoUrl;
  if (typeof photoUrl === "string") return photoUrl;

  return "";
}

function normalizeText(s: string) {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export default function TutoresList() {
  // UI 1-based
  const [page, setPage] = useState(1);

  // input e filtro aplicado
  const [searchInput, setSearchInput] = useState("");
  const [searchApplied, setSearchApplied] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [items, setItems] = useState<TutorResponseDto[]>([]);
  const [pageCount, setPageCount] = useState(1);
  const [total, setTotal] = useState(0);

  const canPrev = page > 1;
  const canNext = page < pageCount;

  const pageNumbers = useMemo(
    () => getPageNumbers(page, pageCount),
    [page, pageCount]
  );

  useEffect(() => {
    let alive = true;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const term = searchApplied.trim();
        const usingFilter = term.length > 0;

        const requestPage = usingFilter ? 0 : page - 1;
        const requestSize = usingFilter ? 500 : PAGE_SIZE;

        const data = await listTutores({
          page: requestPage,
          size: requestSize,
          nome: term || undefined,
        });

        if (!alive) return;

        const norm = normalizePaged<TutorResponseDto>(data as unknown);
        const all = norm.content;

        if (!usingFilter) {
          const computedPageCount = Math.max(1, Math.ceil(norm.total / PAGE_SIZE));
          setItems(all);
          setTotal(norm.total);
          setPageCount(computedPageCount);

          if (page > computedPageCount) setPage(1);
          return;
        }

        // ✅ fallback: filtra no front (nome/email/telefone/id)
        const termNorm = normalizeText(term);
        const filtered = all.filter((t) => {
          const nome = normalizeText(t.nome ?? "");
          const email = normalizeText(t.email ?? "");
          const telefone = normalizeText(t.telefone ?? "");
          const id = String(t.id ?? "");
          return (
            nome.includes(termNorm) ||
            email.includes(termNorm) ||
            telefone.includes(termNorm) ||
            id.includes(termNorm)
          );
        });

        // ✅ repagina no front
        const computedTotal = filtered.length;
        const computedPageCount = Math.max(1, Math.ceil(computedTotal / PAGE_SIZE));

        const safePage = Math.min(page, computedPageCount);
        if (safePage !== page) {
          setPage(safePage);
          return;
        }

        const start = (safePage - 1) * PAGE_SIZE;
        const paged = filtered.slice(start, start + PAGE_SIZE);

        setItems(paged);
        setTotal(computedTotal);
        setPageCount(computedPageCount);
      } catch (e: unknown) {
        if (!alive) return;
        setError("Não foi possível carregar a lista de tutores.");
        console.error(e);
      } finally {
        if (alive) setLoading(false);
      }
    }

    load();
    return () => {
      alive = false;
    };
  }, [page, searchApplied]);

  function onSearch() {
    setPage(1);
    setSearchApplied(searchInput.trim());
  }

  function onClear() {
    setSearchInput("");
    setSearchApplied("");
    setPage(1);
  }

  return (
    <div className="space-y-4">
      {/* Top card */}
      <div className="rounded-xl bg-white border border-gray-200 p-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Tutores</h2>
            <p className="text-sm text-gray-600">
              Total: <span className="font-medium">{total}</span>
            </p>
          </div>

          <Link
            to="/tutores/novo"
            className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Cadastrar Tutor
          </Link>
        </div>

        {/* Busca */}
        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") onSearch();
              }}
              placeholder="Buscar por nome, e-mail, telefone ou ID..."
              className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            />
          </div>

          <button
            onClick={onSearch}
            className="rounded-lg border border-blue-600 px-4 py-2 text-sm font-semibold text-blue-600 hover:bg-blue-50"
            type="button"
          >
            Buscar
          </button>

          <button
            onClick={onClear}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            type="button"
          >
            Limpar
          </button>
        </div>
      </div>

      {/* States */}
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-red-700">
          {error}
        </div>
      )}

      {loading && (
        <div className="rounded-lg bg-white border border-gray-200 p-4 text-gray-700">
          Carregando...
        </div>
      )}

      {!loading && !error && items.length === 0 && (
        <div className="rounded-lg bg-white border border-gray-200 p-6 text-gray-700">
          Nenhum tutor encontrado.
        </div>
      )}

      {/* List */}
      <div className="space-y-3">
        {!loading &&
          !error &&
          items.map((tutor) => {
            const photo = tutorPhotoUrl(tutor);

            return (
              <div
                key={tutor.id}
                className="bg-white rounded-lg border border-gray-200 p-4 flex items-center gap-4 hover:shadow-md transition-shadow"
              >
                {photo ? (
                  <img
                    src={photo}
                    alt={tutor.nome}
                    className="w-16 h-16 rounded-full bg-gray-100 object-cover"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 text-xs">
                    Sem foto
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-gray-800 truncate">
                    {tutor.nome} <span className="text-gray-500">#{tutor.id}</span>
                  </h3>
                    {tutor.cpf ? (
                        <p className="text-sm text-gray-700">
                            CPF: <span className="font-medium">{maskCpf(tutor.cpf)}</span>
                        </p>
                        ) : (
                        <p className="text-sm text-gray-400">CPF: —</p>
                        )}

                  <p className="text-sm text-gray-600 truncate">
                    {tutor.email ? tutor.email : "—"}
                    {" • "}
                    {maskPhone(tutor.telefone)}
                  </p>
                  {tutor.endereco ? (
                    <p className="text-xs text-gray-500 truncate">{tutor.endereco}</p>
                  ) : null}
                </div>

                <Link
                  to={`/tutores/${tutor.id}`}
                  className="px-4 py-2 text-sm font-medium text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                >
                  Ver
                </Link>
              </div>
            );
          })}
      </div>

      {/* Pagination */}
      <div className="mt-6 flex items-center justify-center gap-2">
        <button
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={!canPrev || loading}
          className="px-3 py-2 text-sm font-medium text-gray-700 hover:bg-white hover:shadow-sm rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all border border-gray-200"
          type="button"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {pageNumbers.map((p, idx) =>
          p === "..." ? (
            <span key={`dots-${idx}`} className="px-3 py-2 text-gray-500">
              ...
            </span>
          ) : (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`px-3 py-2 text-sm font-medium rounded-lg transition-all ${
                page === p
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-gray-700 hover:bg-white hover:shadow-sm border border-gray-200"
              }`}
              type="button"
            >
              {p}
            </button>
          )
        )}

        <button
          onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
          disabled={!canNext || loading}
          className="px-3 py-2 text-sm font-medium text-gray-700 hover:bg-white hover:shadow-sm rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all border border-gray-200"
          type="button"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
