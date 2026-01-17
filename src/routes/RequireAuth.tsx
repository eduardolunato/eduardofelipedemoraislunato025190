import { Navigate, Outlet, useLocation } from "react-router-dom";
import { getAccessToken } from "@/utils/auth";

export default function RequireAuth() {
  const location = useLocation();
  const token = getAccessToken();

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
