import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

import { api } from "@/api/axios";
import { saveTokens } from "@/utils/auth";

type LoginResponse = {
  access_token: string;
  refresh_token: string;
  expires_in?: number;
  refresh_expires_in?: number;
};

type ApiErrorPayload = {
  message?: string;
  error?: string;
};

export default function Login() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("admin");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    try {
      setLoading(true);

      const { data } = await api.post<LoginResponse>("/autenticacao/login", {
        username,
        password,
      });

      saveTokens(data.access_token, data.refresh_token);
      navigate("/pets", { replace: true });
    } catch (err: unknown) {
      let msg = "Falha ao fazer login.";

      if (axios.isAxiosError<ApiErrorPayload>(err)) {
        msg =
          err.response?.data?.message ||
          err.response?.data?.error ||
          err.message ||
          msg;
      }

      setError(msg);
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-xl shadow p-6">
        <h1 className="text-2xl font-bold mb-4">Login</h1>

        {error && (
          <div className="mb-4 rounded bg-red-50 p-3 text-red-700">{error}</div>
        )}

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Usuário</label>
            <input
              className="w-full rounded border p-2"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="admin"
              required
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Senha</label>
            <input
              className="w-full rounded border p-2"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="admin"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded bg-blue-600 py-2 font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}
