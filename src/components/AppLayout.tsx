import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { clearTokens } from "@/utils/auth";

export default function AppLayout() {
  const navigate = useNavigate();

  function logout() {
    clearTokens();
    navigate("/login");
  }

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `block rounded px-3 py-2 ${
      isActive ? "bg-blue-600 text-white" : "text-gray-700 hover:bg-gray-100"
    }`;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside className="w-64 bg-white border-r p-4">
        <h1 className="text-xl font-bold mb-4">Pet Manager</h1>

        <nav className="space-y-2">
          <NavLink to="/pets" className={linkClass}>
            Pets
          </NavLink>

          {/* Futuro: tutores */}
          {/* <NavLink to="/tutores" className={linkClass}>Tutores</NavLink> */}
        </nav>

        <button
          onClick={logout}
          className="mt-6 w-full rounded bg-red-600 py-2 text-white font-semibold hover:bg-red-700"
        >
          Sair
        </button>
      </aside>

      <main className="flex-1 p-6">
        <Outlet />
      </main>
    </div>
  );
}
