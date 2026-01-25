import AppRoutes from "@/routes/AppRoutes";
import { useTokenRefresh } from "@/hooks/useTokenRefresh";

export default function App() {
  console.log('🔥 APP RENDERIZADO');
  useTokenRefresh();

  return <AppRoutes />;
}

