import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

import TutoresList from "./TutoresList";

vi.mock("@/api/tutores.service", () => ({
  listTutores: vi.fn(),
}));

import { listTutores } from "@/api/tutores.service";

describe("TutoresList", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renderiza lista e chama API com paginação padrão", async () => {
    (listTutores as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      content: [
        {
          id: 1,
          nome: "Maria Silva Sauro",
          cpf: "12345678901",
          telefone: "65999999999",
          email: "maria@gmail.com",
          endereco: "Rua A",
          foto: null,
        },
        {
          id: 2,
          nome: "João Souza",
          cpf: null,
          telefone: "6512345678",
          email: null,
          endereco: null,
          foto: null,
        },
      ],
      totalElements: 2,
    });

    render(
      <MemoryRouter>
        <TutoresList />
      </MemoryRouter>
    );

    // chama API
    await waitFor(() => expect(listTutores).toHaveBeenCalled());

    // confere parâmetros padrão (page 0, size 10)
    expect(listTutores).toHaveBeenCalledWith(
      expect.objectContaining({ page: 0, size: 10, nome: undefined })
    );

    // render
    expect(await screen.findByText(/Tutores/i)).toBeInTheDocument();
    expect(screen.getByText(/Maria Silva Sauro/i)).toBeInTheDocument();
    expect(screen.getByText(/João Souza/i)).toBeInTheDocument();

    // CPF aparece (mascarado) ou "—"
    expect(screen.getByText(/123\.456\.789-01/)).toBeInTheDocument(); // CPF mascarado
    expect(screen.getByText(/CPF:\s*—/i)).toBeInTheDocument();        // CPF vazio
  });

  it("faz busca e chama API com size 500 e nome", async () => {
    (listTutores as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      content: [],
      totalElements: 0,
    });

    render(
      <MemoryRouter>
        <TutoresList />
      </MemoryRouter>
    );

    // primeira carga
    await waitFor(() => expect(listTutores).toHaveBeenCalledTimes(1));

    // busca
    fireEvent.change(
      screen.getByPlaceholderText(/Buscar por nome, e-mail, telefone ou ID/i),
      { target: { value: "maria" } }
    );

    fireEvent.click(screen.getByRole("button", { name: /Buscar/i }));

    await waitFor(() => expect(listTutores).toHaveBeenCalledTimes(2));

    expect(listTutores).toHaveBeenLastCalledWith(
      expect.objectContaining({
        page: 0,
        size: 500,
        nome: "maria",
      })
    );
  });
});
