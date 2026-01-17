import { useState } from "react";
import { login } from "../api/auth.service";
import { saveTokens, getAccessToken, clearTokens } from "../utils/auth";

export default function LoginPanel() {
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isLogged = !!getAccessToken();

  async function handleLogin() {
    setMsg(null);
    setError(null);

    try {
      setLoading(true);
      const data = await login("admin", "admin");
      saveTokens(data.access_token, data.refresh_token);
      setMsg("Login realizado e tokens salvos ✅");
    } catch (err) {
      console.error(err);
      setError("Falha no login. Veja o console.");
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    clearTokens();
    setMsg("Logout realizado ✅");
    setError(null);
  }

  return (
    <div className="rounded-xl border bg-white p-4 shadow">
      <h2 className="text-lg font-semibold mb-2">Autenticação</h2>

      {msg && <div className="mb-3 rounded bg-green-50 p-2 text-green-700">{msg}</div>}
      {error && <div className="mb-3 rounded bg-red-50 p-2 text-red-700">{error}</div>}

      <div className="flex gap-2">
        {!isLogged ? (
          <button
            onClick={handleLogin}
            disabled={loading}
            className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {loading ? "Entrando..." : "Fazer login (admin/admin)"}
          </button>
        ) : (
          <button
            onClick={handleLogout}
            className="rounded bg-gray-700 px-4 py-2 text-white hover:bg-gray-800"
          >
            Logout
          </button>
        )}
      </div>

      <p className="mt-2 text-sm text-gray-500">
        Status:{" "}
        {isLogged ? (
          <span className="text-green-700 font-medium">Logado</span>
        ) : (
          <span className="text-red-700 font-medium">Não logado</span>
        )}
      </p>
    </div>
  );
}
