import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";

import TutorDetail from "./TutorDetail";

// mocks
vi.mock("@/api/tutores.service", () => ({
  getTutorByIdCompleto: vi.fn(),
  vincularPetAoTutor: vi.fn(),
  desvincularPetDoTutor: vi.fn(),
}));

vi.mock("@/api/pets.service", () => ({
  listPets: vi.fn(),
  getPetByIdCompleto: vi.fn(),
}));

import {
  getTutorByIdCompleto,
  desvincularPetDoTutor,
} from "@/api/tutores.service";

describe("TutorDetail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renderiza tutor e pets vinculados", async () => {
    (getTutorByIdCompleto as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 10,
      nome: "Tutor Teste",
      cpf: "12345678901",
      telefone: "65999999999",
      email: "tutor@teste.com",
      endereco: "Rua X",
      foto: null,
      pets: [
        { id: 1, nome: "Rex", idade: 3, raca: "Vira-lata", foto: null },
      ],
    });

    render(
      <MemoryRouter initialEntries={["/tutores/10"]}>
        <Routes>
          <Route path="/tutores/:id" element={<TutorDetail />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByText(/Tutor Teste/i)).toBeInTheDocument();
    expect(screen.getByText(/Pets vinculados/i)).toBeInTheDocument();
    expect(screen.getByText(/Rex/i)).toBeInTheDocument();
  });

  it("desvincula pet e recarrega tutor", async () => {
    // 1a carga: tem 1 pet
    (getTutorByIdCompleto as unknown as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({
        id: 10,
        nome: "Tutor Teste",
        cpf: "12345678901",
        telefone: "65999999999",
        email: "tutor@teste.com",
        endereco: "Rua X",
        foto: null,
        pets: [{ id: 1, nome: "Rex", idade: 3, raca: "Vira-lata", foto: null }],
      })
      // 2a carga: depois de desvincular fica sem pets
      .mockResolvedValueOnce({
        id: 10,
        nome: "Tutor Teste",
        cpf: "12345678901",
        telefone: "65999999999",
        email: "tutor@teste.com",
        endereco: "Rua X",
        foto: null,
        pets: [],
      });

    (desvincularPetDoTutor as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

    render(
      <MemoryRouter initialEntries={["/tutores/10"]}>
        <Routes>
          <Route path="/tutores/:id" element={<TutorDetail />} />
        </Routes>
      </MemoryRouter>
    );

    // garante pet carregado
    expect(await screen.findByText(/Rex/i)).toBeInTheDocument();

    // clica "Desvincular"
    fireEvent.click(screen.getByRole("button", { name: /Desvincular/i }));

    await waitFor(() =>
      expect(desvincularPetDoTutor).toHaveBeenCalledWith(10, 1)
    );

    // depois do refresh, deve mostrar "Nenhum pet vinculado."
    expect(await screen.findByText(/Nenhum pet vinculado/i)).toBeInTheDocument();
  });
});
