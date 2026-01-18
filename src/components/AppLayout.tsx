import { useMemo, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  Home,
  PlusCircle,
  Users,
  Menu,
  X,
  LogOut,
} from "lucide-react";
import { clearTokens } from "@/utils/auth";

type MenuItem = {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  to: string;
  enabled?: boolean;
};

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems: MenuItem[] = useMemo(
    () => [
      { icon: Home, label: "Pets", to: "/pets", enabled: true },
      { icon: PlusCircle, label: "Cadastrar Pet", to: "/pets/novo", enabled: true },
      { icon: Users, label: "Tutores", to: "/tutores", enabled: true },
    ],
    []
  );

  function logout() {
    clearTokens();
    navigate("/login", { replace: true });
  }

  const pageTitle = useMemo(() => {
    if (location.pathname.startsWith("/pets/novo")) return "Cadastrar Pet";
    if (location.pathname.startsWith("/pets")) return "Pets";
    if (location.pathname.startsWith("/tutores")) return "Tutores";
    return "Pet Manager";
  }, [location.pathname]);

  const pageSubtitle = useMemo(() => {
    if (location.pathname.startsWith("/pets")) return "Gerencie seus pets cadastrados";
    if (location.pathname.startsWith("/tutores")) return "Gerencie os tutores cadastrados";
    return "Bem-vindo";
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed lg:static inset-y-0 left-0 z-50 w-64",
          "bg-gradient-to-b from-blue-600 to-indigo-700",
          "transform transition-transform duration-300 ease-in-out",
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between p-6 border-b border-blue-500/60">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                <div className="w-6 h-6 rounded bg-blue-600" />
              </div>
              <span className="text-xl font-bold text-white">PetApp</span>
            </div>

            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-white hover:text-blue-100"
              aria-label="Fechar menu"
              type="button"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            {menuItems.map((item) => {
              const disabled = item.enabled === false;

              if (disabled) {
                return (
                  <div
                    key={item.to}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-blue-200/50 cursor-not-allowed"
                  >
                    <item.icon className="w-5 h-5" />
                    {item.label}
                  </div>
                );
              }

              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setSidebarOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                      isActive
                        ? "bg-white bg-opacity-20 text-white"
                        : "text-blue-100 hover:bg-white hover:bg-opacity-10"
                    )
                  }
                  end={item.to === "/pets"}
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </NavLink>
              );
            })}
          </nav>

          {/* User/Profile + Logout */}
          <div className="p-4 border-t border-blue-500/60 space-y-2">
            <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-white/10">
              <div className="w-10 h-10 rounded-full border-2 border-white/70 bg-white/20" />
              <div className="text-left flex-1">
                <p className="text-sm font-medium text-white">Usuário</p>
                <p className="text-xs text-blue-100">admin</p>
              </div>
            </div>

            <button
              onClick={logout}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-white/15 hover:bg-white/20 transition-colors text-white font-semibold"
              type="button"
            >
              <LogOut className="w-5 h-5" />
              Sair
            </button>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 flex items-center gap-4 shadow-sm">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-white hover:text-blue-100"
            type="button"
            aria-label="Abrir menu"
          >
            <Menu className="w-6 h-6" />
          </button>

          <div className="flex-1">
            <h1 className="text-2xl font-bold text-white">{pageTitle}</h1>
            <p className="text-sm text-blue-100 mt-1">{pageSubtitle}</p>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
          <div className="max-w-5xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
