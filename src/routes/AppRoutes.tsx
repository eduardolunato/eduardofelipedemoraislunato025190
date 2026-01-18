import { Routes, Route, Navigate } from "react-router-dom";
import { lazy, Suspense } from "react";

import RequireAuth from "@/routes/RequireAuth";

import AppLayout from "@/components/AppLayout";
import Login from "@/pages/Login";

const PetsRoutes = lazy(() => import("@/modules/pets/routes"));
const TutoresRoutes = lazy(() => import("@/modules/tutores/routes"));

function Loading() {
  return <div className="p-6 text-gray-700">Carregando...</div>;
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* Pública */}
      <Route path="/login" element={<Login />} />

      {/* Protegidas + Layout */}
      <Route element={<RequireAuth />}>
        <Route element={<AppLayout />}>
          <Route
            path="/pets/*"
            element={
              <Suspense fallback={<Loading />}>
                <PetsRoutes />
              </Suspense>
            }
          />
          <Route
            path="/tutores/*"
            element={
              <Suspense fallback={<Loading />}>
                <TutoresRoutes />
              </Suspense>
            }
          />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
