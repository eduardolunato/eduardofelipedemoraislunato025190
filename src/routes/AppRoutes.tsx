import { Suspense, lazy } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

const PetsRoutes = lazy(() => import("../modules/pets/routes"));
const TutoresRoutes = lazy(() => import("../modules/tutores/routes"));

export default function AppRoutes() {
  return (
    <Suspense fallback={<div className="p-6">Carregando...</div>}>
      <Routes>
        <Route path="/" element={<Navigate to="/pets" replace />} />

        <Route path="/pets/*" element={<PetsRoutes />} />
        <Route path="/tutores/*" element={<TutoresRoutes />} />

        <Route path="*" element={<div className="p-6">Página não encontrada</div>} />
      </Routes>
    </Suspense>
  );
}
