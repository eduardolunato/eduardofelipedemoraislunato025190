import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

import PetsList from "./PetsList";
import { listPets } from "@/api/pets.service";

vi.mock("@/api/pets.service", () => ({
  listPets: vi.fn(),
}));

describe("PetsList", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renderiza pets retornados da API", async () => {
    (listPets as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      content: [
        { id: 1, nome: "Rex", idade: 3, raca: "SRD" },
        { id: 2, nome: "Mel", idade: 2, raca: "Poodle" },
      ],
      totalElements: 2,
    });

    render(
      <MemoryRouter>
        <PetsList />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(listPets).toHaveBeenCalled();
    });

    expect(screen.getByText("Rex")).toBeInTheDocument();
    expect(screen.getByText("Mel")).toBeInTheDocument();
  });

  it("mostra estado vazio quando não houver pets", async () => {
    (listPets as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      content: [],
      totalElements: 0,
    });

    render(
      <MemoryRouter>
        <PetsList />
      </MemoryRouter>
    );

    expect(await screen.findByText(/Nenhum pet encontrado/i)).toBeInTheDocument();
  });
});
