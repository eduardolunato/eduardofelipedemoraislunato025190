import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";

import PetDetail from "./PetDetail";
import { getPetById } from "@/api/pets.service";
import { getTutorById } from "@/api/tutores.service";

vi.mock("@/api/pets.service", () => ({
  getPetById: vi.fn(),
}));

vi.mock("@/api/tutores.service", () => ({
  getTutorById: vi.fn(),
}));

describe("PetDetail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("quando houver tutor, carrega e exibe dados do tutor", async () => {
    (getPetById as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 10,
      nome: "Rex",
      idade: 4,
      raca: "Pastor",
      tutores: [{ id: 99 }],
    });

    (getTutorById as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 99,
      nome: "João da Silva Sauro",
      telefone: "65999999999",
      email: "joao@gmail.com",
    });

    render(
      <MemoryRouter initialEntries={["/pets/10"]}>
        <Routes>
          <Route path="/pets/:id" element={<PetDetail />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByText("Rex")).toBeInTheDocument();
    expect(await screen.findByText(/João da Silva Sauro/i)).toBeInTheDocument();
  });

  it("quando não houver tutor, exibe mensagem padrão", async () => {
    (getPetById as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 11,
      nome: "Mewtwo",
      idade: 2,
      raca: "Pokemon",
      tutores: [],
    });

    render(
      <MemoryRouter initialEntries={["/pets/11"]}>
        <Routes>
          <Route path="/pets/:id" element={<PetDetail />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByText("Mewtwo")).toBeInTheDocument();
    expect(await screen.findByText(/Nenhum tutor vinculado/i)).toBeInTheDocument();
  });
});
