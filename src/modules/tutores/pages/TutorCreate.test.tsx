import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";

import TutorCreate from "./TutorCreate";

// --- mock navigate ---
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
const createTutorMock = vi.fn();

vi.mock("@/api/tutores.service", () => ({
  createTutor: (payload: unknown) => createTutorMock(payload),
}));

function renderWithRoute() {
  return render(
    <MemoryRouter initialEntries={["/tutores/novo"]}>
      <Routes>
        <Route path="/tutores/novo" element={<TutorCreate />} />
      </Routes>
    </MemoryRouter>
  );
}

beforeEach(() => {
  navigateMock.mockReset();
  createTutorMock.mockReset();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("TutorCreate", () => {
  it("mostra erro de validação e não chama API quando nome está vazio", async () => {
    renderWithRoute();

    fireEvent.click(screen.getByRole("button", { name: /Salvar tutor/i }));

    expect(
      await screen.findByText(/Informe o nome completo/i)
    ).toBeInTheDocument();

    expect(createTutorMock).not.toHaveBeenCalled();
  });

  it("mostra erro quando email é inválido", async () => {
    renderWithRoute();

    fireEvent.change(screen.getByPlaceholderText(/Maria do Carmo Silva/i), {
      target: { value: "Maria Silva" },
    });

    fireEvent.change(screen.getByPlaceholderText(/maria@email\.com/i), {
      target: { value: "email-invalido" },
    });

    fireEvent.click(screen.getByRole("button", { name: /Salvar tutor/i }));

    expect(await screen.findByText(/E-mail inválido/i)).toBeInTheDocument();
    expect(createTutorMock).not.toHaveBeenCalled();
  });

  it("cadastra com sucesso, chama createTutor com payload tratado e navega para /tutores/:id", async () => {
    createTutorMock.mockResolvedValueOnce({ id: 77 });

    renderWithRoute();

    fireEvent.change(screen.getByPlaceholderText(/Maria do Carmo Silva/i), {
      target: { value: "  Maria do Carmo Silva  " },
    });

    fireEvent.change(screen.getByPlaceholderText(/maria@email\.com/i), {
      target: { value: "  maria@email.com  " },
    });

    fireEvent.change(screen.getByPlaceholderText(/\(65\) 99999-9999/i), {
      target: { value: "65999998888" },
    });

    fireEvent.change(screen.getByPlaceholderText(/Rua X, Nº 123/i), {
      target: { value: "  Rua A, 10  " },
    });

    fireEvent.change(screen.getByPlaceholderText(/000\.000\.000-00/i), {
      target: { value: "12345678901" },
    });

    fireEvent.click(screen.getByRole("button", { name: /Salvar tutor/i }));

    await waitFor(() => {
      expect(createTutorMock).toHaveBeenCalledTimes(1);
    });

    // payload tratado: trim, onlyDigits telefone, cpf number
    expect(createTutorMock).toHaveBeenCalledWith({
      nome: "Maria do Carmo Silva",
      email: "maria@email.com",
      telefone: "65999998888",
      endereco: "Rua A, 10",
      cpf: 12345678901,
    });

    expect(navigateMock).toHaveBeenCalledWith("/tutores/77");
  });
});
