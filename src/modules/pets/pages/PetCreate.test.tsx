import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import PetCreate from "./PetCreate";
import { createPet } from "@/api/pets.service";

// mock do service
vi.mock("@/api/pets.service", () => ({
  createPet: vi.fn(),
}));

describe("PetCreate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("mostra erro de validação e não chama API quando nome está vazio", async () => {
    render(<PetCreate />);

    fireEvent.change(screen.getByPlaceholderText(/labrador/i), {
      target: { value: "Labrador Retriever" },
    });
    fireEvent.change(screen.getByRole("spinbutton"), {
      target: { value: "2" },
    });

    fireEvent.click(screen.getByRole("button", { name: /cadastrar/i }));

    expect(await screen.findByText(/informe o nome/i)).toBeInTheDocument();
    expect(createPet).not.toHaveBeenCalled();
  });

  it("cadastra com sucesso, mostra mensagem e limpa formulário", async () => {
    (createPet as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 123,
    });

    render(<PetCreate />);

    fireEvent.change(screen.getByPlaceholderText(/rex/i), {
      target: { value: "Rex" },
    });
    fireEvent.change(screen.getByPlaceholderText(/labrador/i), {
      target: { value: "Labrador Retriever" },
    });
    fireEvent.change(screen.getByRole("spinbutton"), {
      target: { value: "3" },
    });

    fireEvent.click(screen.getByRole("button", { name: /cadastrar/i }));

    await waitFor(() => {
      expect(createPet).toHaveBeenCalledWith({
        nome: "Rex",
        raca: "Labrador Retriever",
        idade: 3,
      });
    });

    expect(
      await screen.findByText(/pet cadastrado com sucesso/i)
    ).toBeInTheDocument();

    // limpou os campos
    expect(screen.getByPlaceholderText(/rex/i)).toHaveValue("");
    expect(screen.getByPlaceholderText(/labrador/i)).toHaveValue("");
    expect(screen.getByRole("spinbutton")).toHaveValue(0);
  });

  it("mostra mensagem do backend quando a API falha (axios-like)", async () => {
    (createPet as unknown as ReturnType<typeof vi.fn>).mockRejectedValue({
      isAxiosError: true,
      response: { data: { message: "Erro do backend" } },
    });

    render(<PetCreate />);

    fireEvent.change(screen.getByPlaceholderText(/rex/i), {
      target: { value: "Rex" },
    });
    fireEvent.change(screen.getByPlaceholderText(/labrador/i), {
      target: { value: "Labrador Retriever" },
    });
    fireEvent.change(screen.getByRole("spinbutton"), {
      target: { value: "1" },
    });

    fireEvent.click(screen.getByRole("button", { name: /cadastrar/i }));

    expect(await screen.findByText(/erro do backend/i)).toBeInTheDocument();
  });
});
