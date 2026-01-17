import { Routes, Route, Navigate } from "react-router-dom";

import RequireAuth from "./RequireAuth";
import Login from "@/pages/Login";

import PetsRoutes from "@/modules/pets/routes";
import TutoresRoutes from "@/modules/tutores/routes";

export default function AppRoutes() {
  return (
    <Routes>
      {/* inicial */}
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* pública */}
      <Route path="/login" element={<Login />} />

      {/* protegidas */}
      <Route element={<RequireAuth />}>
        <Route path="/pets/*" element={<PetsRoutes />} />
        <Route path="/tutores/*" element={<TutoresRoutes />} />
      </Route>

      {/* fallback */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
