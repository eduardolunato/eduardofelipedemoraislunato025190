import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";


// componente
import Login from "./Login";

// mocks
vi.mock("@/api/axios", () => ({
  api: {
    post: vi.fn(),
  },
}));

vi.mock("@/utils/auth", () => ({
  saveTokens: vi.fn(),
}));

const navigateMock = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

import { api } from "@/api/axios";
import { saveTokens } from "@/utils/auth";

describe("Login page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("faz login, salva tokens e navega para /pets", async () => {
    (api.post as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { access_token: "A", refresh_token: "R" },
    });

    render(<Login />);

    fireEvent.change(screen.getByPlaceholderText("Login"), {
      target: { value: "admin" },
    });
    fireEvent.change(screen.getByPlaceholderText("senha"), {
      target: { value: "admin" },
    });

    fireEvent.click(screen.getByRole("button", { name: /entrar/i }));

    // espera a promise resolver (UI muda pra "Entrando..." enquanto isso)
    expect(await screen.findByRole("button", { name: /entrando/i })).toBeInTheDocument();

    // aguarda o fluxo terminar
    await screen.findByRole("button", { name: /entrar/i });

    expect(api.post).toHaveBeenCalledWith("/autenticacao/login", {
      username: "admin",
      password: "admin",
    });

    expect(saveTokens).toHaveBeenCalledWith("A", "R");
    expect(navigateMock).toHaveBeenCalledWith("/pets", { replace: true });
  });

  it("mostra mensagem de erro quando falha o login (axios error)", async () => {
  const err = {
    isAxiosError: true,
    message: "Request failed",
    response: {
      status: 401,
      data: { message: "Credenciais inválidas" },
    },
  };

  (api.post as unknown as ReturnType<typeof vi.fn>).mockRejectedValue(err);

  render(<Login />);

  fireEvent.change(screen.getByPlaceholderText("Login"), {
    target: { value: "x" },
  });
  fireEvent.change(screen.getByPlaceholderText("senha"), {
    target: { value: "y" },
  });

  fireEvent.click(screen.getByRole("button", { name: /entrar/i }));

  expect(await screen.findByText(/credenciais inválidas/i)).toBeInTheDocument();
  expect(saveTokens).not.toHaveBeenCalled();
  expect(navigateMock).not.toHaveBeenCalled();
});

});
