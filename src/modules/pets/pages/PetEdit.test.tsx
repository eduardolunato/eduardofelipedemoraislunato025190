import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";

import PetEdit from "./PetEdit";

// --- mocks: react-router-dom (somente navigate) ---
const navigateMock = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>(
    "react-router-dom"
  );
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

// --- mocks: pets.service ---
const getPetByIdCompletoMock = vi.fn();
const updatePetMock = vi.fn();
const addPetFotoMock = vi.fn();
const removePetFotoMock = vi.fn();
const deletePetMock = vi.fn();

vi.mock("@/api/pets.service", () => ({
  getPetByIdCompleto: (id: number) => getPetByIdCompletoMock(id),
  updatePet: (id: number, body: unknown) => updatePetMock(id, body),
  addPetFoto: (id: number, file: File) => addPetFotoMock(id, file),
  removePetFoto: (id: number, fotoId: number) => removePetFotoMock(id, fotoId),
  deletePet: (id: number) => deletePetMock(id),
}));

// --- mocks: tutores.service (não usamos aqui, mas o componente importa) ---
const listTutoresMock = vi.fn();
const vincularPetAoTutorMock = vi.fn();
const desvincularPetDoTutorMock = vi.fn();

vi.mock("@/api/tutores.service", () => ({
  listTutores: (params: unknown) => listTutoresMock(params),
  vincularPetAoTutor: (tutorId: number, petId: number) =>
    vincularPetAoTutorMock(tutorId, petId),
  desvincularPetDoTutor: (tutorId: number, petId: number) =>
    desvincularPetDoTutorMock(tutorId, petId),
}));

function renderWithRoute(petId = 10) {
  return render(
    <MemoryRouter initialEntries={[`/pets/${petId}/editar`]}>
      <Routes>
        <Route path="/pets/:id/editar" element={<PetEdit />} />
      </Routes>
    </MemoryRouter>
  );
}

beforeEach(() => {
  navigateMock.mockReset();

  getPetByIdCompletoMock.mockReset();
  updatePetMock.mockReset();
  addPetFotoMock.mockReset();
  removePetFotoMock.mockReset();
  deletePetMock.mockReset();

  listTutoresMock.mockReset();
  vincularPetAoTutorMock.mockReset();
  desvincularPetDoTutorMock.mockReset();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("PetEdit", () => {
  it("carrega pet e preenche o formulário", async () => {
    getPetByIdCompletoMock.mockResolvedValueOnce({
      id: 10,
      nome: "Rex",
      raca: "Labrador",
      idade: 3,
      foto: null,
      tutores: [],
    });

    renderWithRoute(10);

    expect(screen.getByText(/Carregando/i)).toBeInTheDocument();
    expect(await screen.findByText(/Editar Pet/i)).toBeInTheDocument();

    expect(screen.getByPlaceholderText("Ex.: Rex")).toHaveValue("Rex");
    expect(screen.getByPlaceholderText("Ex.: Labrador")).toHaveValue("Labrador");
    expect(screen.getByRole("spinbutton")).toHaveValue(3);

    expect(screen.getByText(/Nenhum tutor vinculado/i)).toBeInTheDocument();
  });

  it("valida formulário e impede submit quando nome está vazio", async () => {
    getPetByIdCompletoMock.mockResolvedValueOnce({
      id: 10,
      nome: "Rex",
      raca: "Labrador",
      idade: 3,
      foto: null,
      tutores: [],
    });

    renderWithRoute(10);
    await screen.findByText(/Editar Pet/i);

    fireEvent.change(screen.getByPlaceholderText("Ex.: Rex"), {
      target: { value: "" },
    });

    fireEvent.click(screen.getByRole("button", { name: /Salvar alterações/i }));

    expect(await screen.findByText(/Informe o nome/i)).toBeInTheDocument();
    expect(updatePetMock).not.toHaveBeenCalled();
  });

  it("salva alterações, chama updatePet com trim e clamp e navega para /pets/:id", async () => {
    getPetByIdCompletoMock.mockResolvedValueOnce({
      id: 10,
      nome: "Rex",
      raca: "Labrador",
      idade: 3,
      foto: null,
      tutores: [],
    });

    updatePetMock.mockResolvedValueOnce({ ok: true });

    renderWithRoute(10);
    await screen.findByText(/Editar Pet/i);

    fireEvent.change(screen.getByPlaceholderText("Ex.: Rex"), {
      target: { value: "  Thor  " },
    });
    fireEvent.change(screen.getByPlaceholderText("Ex.: Labrador"), {
      target: { value: "  Husky  " },
    });
    fireEvent.change(screen.getByRole("spinbutton"), {
      target: { value: "999" }, // clamp para 200
    });

    fireEvent.click(screen.getByRole("button", { name: /Salvar alterações/i }));

    await waitFor(() => {
      expect(updatePetMock).toHaveBeenCalledWith(10, {
        nome: "Thor",
        raca: "Husky",
        idade: 200,
      });
    });

    // sucesso aparece
    expect(
      await screen.findByText(/Pet atualizado com sucesso/i)
    ).toBeInTheDocument();

    // navega após 600ms (sem fake timers; só espera)
    await waitFor(
      () => {
        expect(navigateMock).toHaveBeenCalledWith("/pets/10");
      },
      { timeout: 1500 }
    );
  });

  it("abre modal de exclusão e confirma delete chamando API e navegando para /pets", async () => {
    getPetByIdCompletoMock.mockResolvedValueOnce({
      id: 10,
      nome: "Rex",
      raca: "Labrador",
      idade: 3,
      foto: null,
      tutores: [],
    });

    deletePetMock.mockResolvedValueOnce({ ok: true });

    renderWithRoute(10);
    await screen.findByText(/Editar Pet/i);

    // abre modal (botão Excluir do topo)
    fireEvent.click(screen.getByRole("button", { name: /^Excluir$/i }));

    expect(await screen.findByText(/Confirmar exclusão/i)).toBeInTheDocument();

    // agora existem 2 botões "Excluir": topo e modal -> clica no do modal (o último)
    const excluirBtns = screen.getAllByRole("button", { name: /^Excluir$/i });
    fireEvent.click(excluirBtns[excluirBtns.length - 1]);

    await waitFor(() => {
      expect(deletePetMock).toHaveBeenCalledWith(10);
      expect(navigateMock).toHaveBeenCalledWith("/pets", { replace: true });
    });
  });
});
