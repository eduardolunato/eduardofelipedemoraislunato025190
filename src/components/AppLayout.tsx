import { useMemo, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Home, PlusCircle, Users, Menu, X, LogOut, PawPrint } from "lucide-react";
import { clearTokens } from "@/utils/auth";

type MenuItem = {
  to: string;
  label: string;
  icon: React.ElementType;
};

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const menuItems: MenuItem[] = useMemo(
    () => [
      { to: "/pets", label: "Pets", icon: Home },
      { to: "/pets/novo", label: "Cadastrar Pet", icon: PlusCircle },
      { to: "/tutores", label: "Tutores", icon: Users },
    ],
    []
  );

  const title = useMemo(() => {
    if (location.pathname.startsWith("/pets/novo")) return "Cadastrar Pet";
    if (location.pathname.startsWith("/pets")) return "Pets";
    if (location.pathname.startsWith("/tutores")) return "Tutores";
    return "Pet Manager";
  }, [location.pathname]);

  function logout() {
    clearTokens();
    navigate("/login", { replace: true });
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside
        className={[
          "fixed lg:static inset-y-0 left-0 z-50 w-72",
          "bg-gradient-to-b from-blue-600 to-indigo-700",
          "transform transition-transform duration-300 ease-in-out",
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        ].join(" ")}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex items-center justify-between gap-3 border-b border-white/15 p-6">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-white/90">
                <PawPrint className="h-6 w-6 text-blue-700" />
              </div>
              <div className="leading-tight">
                <p className="text-lg font-bold text-white">MeuPet</p>
                <p className="text-xs text-blue-100">Administração</p>
              </div>
            </div>

            <button
              onClick={() => setSidebarOpen(false)}
              className="rounded-lg p-2 text-white/90 hover:bg-white/10 lg:hidden"
              aria-label="Fechar menu"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Nav */}
          <nav className="flex-1 space-y-2 p-4">
            {menuItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  [
                    "group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition",
                    isActive
                      ? "bg-white/20 text-white"
                      : "text-blue-100 hover:bg-white/10 hover:text-white",
                  ].join(" ")
                }
              >
                <item.icon className="h-5 w-5 shrink-0" />
                {item.label}
              </NavLink>
            ))}
          </nav>

          {/* Footer / User */}
          <div className="border-t border-white/15 p-4">
            <div className="mb-3 rounded-xl bg-white/10 p-3 text-white">
              <p className="text-xs text-blue-100">Usuário</p>
              <p className="font-semibold">admin</p>
            </div>

            <button
              onClick={logout}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-white/15 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/20"
            >
              <LogOut className="h-4 w-4" />
              Sair
            </button>
          </div>
        </div>
      </aside>

      {/* Overlay mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="flex items-center gap-4 bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 shadow-sm">
          <button
            onClick={() => setSidebarOpen(true)}
            className="rounded-lg p-2 text-white/90 hover:bg-white/10 lg:hidden"
            aria-label="Abrir menu"
          >
            <Menu className="h-6 w-6" />
          </button>

          <div className="flex-1">
            <h1 className="text-2xl font-bold text-white">{title}</h1>
            <p className="mt-1 text-sm text-blue-100">
              Gerencie seus pets e tutores cadastrados
            </p>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="mx-auto w-full max-w-6xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
