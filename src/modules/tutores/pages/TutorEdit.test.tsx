import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";

import TutorEdit from "./TutorEdit";

// --- mocks: react-router-dom ---
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

// --- mocks: tutores.service ---
const getTutorByIdMock = vi.fn();
const updateTutorMock = vi.fn();
const addTutorFotoMock = vi.fn();
const deleteTutorFotoMock = vi.fn();
const deleteTutorMock = vi.fn();

vi.mock("@/api/tutores.service", () => ({
  getTutorById: (id: number) => getTutorByIdMock(id),
  updateTutor: (id: number, body: unknown) => updateTutorMock(id, body),
  addTutorFoto: (id: number, file: File) => addTutorFotoMock(id, file),
  deleteTutorFoto: (id: number, fotoId: number) => deleteTutorFotoMock(id, fotoId),
  deleteTutor: (id: number) => deleteTutorMock(id),
}));

function renderWithRoute(tutorId = 7) {
  return render(
    <MemoryRouter initialEntries={[`/tutores/${tutorId}/editar`]}>
      <Routes>
        <Route path="/tutores/:id/editar" element={<TutorEdit />} />
      </Routes>
    </MemoryRouter>
  );
}

beforeEach(() => {
  navigateMock.mockReset();

  getTutorByIdMock.mockReset();
  updateTutorMock.mockReset();
  addTutorFotoMock.mockReset();
  deleteTutorFotoMock.mockReset();
  deleteTutorMock.mockReset();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("TutorEdit", () => {
  it("carrega tutor e preenche o formulário", async () => {
    getTutorByIdMock.mockResolvedValueOnce({
      id: 7,
      nome: "Maria",
      email: "maria@email.com",
      endereco: "Rua X",
      telefone: "65999998888",
      cpf: 12345678901,
      foto: null,
    });

    renderWithRoute(7);

    expect(screen.getByText(/Carregando/i)).toBeInTheDocument();

    expect(await screen.findByText(/Editar Tutor/i)).toBeInTheDocument();

    expect(screen.getByPlaceholderText("Ex.: Maria do Carmo Silva")).toHaveValue("Maria");
    expect(screen.getByPlaceholderText("Ex.: maria@email.com")).toHaveValue("maria@email.com");
    expect(screen.getByPlaceholderText("Ex.: Rua X, Nº 123, Bairro...")).toHaveValue("Rua X");

    // telefone é mascarado no UI, então compara pelo valor exibido (não "any")
    const phone = screen.getByPlaceholderText("(65) 99999-9999") as HTMLInputElement;
    expect(phone.value).toMatch(/\(\d{2}\)\s?\d{4,5}-\d{4}/);

    // cpf é mascarado no UI
    const cpf = screen.getByPlaceholderText("000.000.000-00") as HTMLInputElement;
    expect(cpf.value).toMatch(/\d{3}\.\d{3}\.\d{3}-\d{2}/);
  });

  it("valida formulário e impede submit quando nome está vazio", async () => {
    getTutorByIdMock.mockResolvedValueOnce({
      id: 7,
      nome: "Maria",
      email: "",
      endereco: "",
      telefone: "",
      cpf: undefined,
      foto: null,
    });

    renderWithRoute(7);
    await screen.findByText(/Editar Tutor/i);

    fireEvent.change(screen.getByPlaceholderText("Ex.: Maria do Carmo Silva"), {
      target: { value: "" },
    });

    fireEvent.click(screen.getByRole("button", { name: /Salvar alterações/i }));

    expect(await screen.findByText(/Informe o nome completo/i)).toBeInTheDocument();
    expect(updateTutorMock).not.toHaveBeenCalled();
  });

  it("salva alterações, chama updateTutor com payload tratado e navega para /tutores/:id", async () => {
    // mocka setTimeout SEM quebrar waitFor/findBy:
    // só intercepta o setTimeout de 500ms do componente
    const realSetTimeout = window.setTimeout.bind(window);
    const setTimeoutSpy = vi
      .spyOn(window, "setTimeout")
      .mockImplementation((handler: TimerHandler, timeout?: number, ...args: unknown[]) => {
        if (timeout === 500) {
          if (typeof handler === "function") {
            handler(...(args as []));
          }
          return 0 as unknown as ReturnType<typeof window.setTimeout>;
        }
        return realSetTimeout(handler, timeout as number, ...(args as []));
      });

    getTutorByIdMock.mockResolvedValueOnce({
      id: 7,
      nome: "Maria",
      email: "",
      endereco: "",
      telefone: "",
      cpf: undefined,
      foto: null,
    });

    updateTutorMock.mockResolvedValueOnce({ ok: true });

    renderWithRoute(7);
    await screen.findByText(/Editar Tutor/i);

    fireEvent.change(screen.getByPlaceholderText("Ex.: Maria do Carmo Silva"), {
      target: { value: "  Maria da Silva  " },
    });

    fireEvent.change(screen.getByPlaceholderText("Ex.: maria@email.com"), {
      target: { value: "  maria@teste.com  " },
    });

    fireEvent.change(screen.getByPlaceholderText("Ex.: Rua X, Nº 123, Bairro..."), {
      target: { value: "  Rua Y  " },
    });

    // Telefone: o componente guarda dígitos, mas o input mostra máscara.
    // Envia já no formato mascarado (ele faz clampDigits por onlyDigits)
    fireEvent.change(screen.getByPlaceholderText("(65) 99999-9999"), {
      target: { value: "(65) 99999-8888" },
    });

    // CPF (11 dígitos)
    fireEvent.change(screen.getByPlaceholderText("000.000.000-00"), {
      target: { value: "123.456.789-01" },
    });

    fireEvent.click(screen.getByRole("button", { name: /Salvar alterações/i }));

    await waitFor(() => {
      expect(updateTutorMock).toHaveBeenCalledWith(7, {
        nome: "Maria da Silva",
        email: "maria@teste.com",
        endereco: "Rua Y",
        telefone: "65999998888",
        cpf: 12345678901,
      });
    });

    expect(await screen.findByText(/Tutor atualizado com sucesso/i)).toBeInTheDocument();

    // como o setTimeout(500) do componente foi executado "na hora", já navega:
    expect(navigateMock).toHaveBeenCalledWith("/tutores/7");

    setTimeoutSpy.mockRestore();
  });

  it("abre modal de exclusão e confirma delete chamando API e navegando para /tutores", async () => {
    getTutorByIdMock.mockResolvedValueOnce({
      id: 7,
      nome: "Maria",
      email: "",
      endereco: "",
      telefone: "",
      cpf: undefined,
      foto: null,
    });

    deleteTutorMock.mockResolvedValueOnce({ ok: true });

    renderWithRoute(7);
    await screen.findByText(/Editar Tutor/i);

    // abre modal (botão Excluir do topo)
    fireEvent.click(screen.getByRole("button", { name: /^Excluir$/i }));

    const title = await screen.findByText(/Confirmar exclusão/i);
    const modalRoot = title.closest(".fixed") ?? title.closest("div");
    expect(modalRoot).toBeTruthy();

    const modal = within(modalRoot as HTMLElement);

    // confirma exclusão (botão Excluir do modal)
    fireEvent.click(modal.getByRole("button", { name: /^Excluir$/i }));

    await waitFor(() => {
      expect(deleteTutorMock).toHaveBeenCalledWith(7);
      expect(navigateMock).toHaveBeenCalledWith("/tutores");
    });
  });
});
