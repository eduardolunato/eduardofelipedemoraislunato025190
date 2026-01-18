import { Routes, Route, Navigate } from "react-router-dom";
import PetsList from "./pages/PetsList";
import PetDetail from "./pages/PetDetail";
import PetCreate from "./pages/PetCreate";

export default function PetsRoutes() {
  return (
    <Routes>
      <Route index element={<PetsList />} />
      <Route path="novo" element={<PetCreate />} />
      <Route path=":id" element={<PetDetail />} />
      <Route path="*" element={<Navigate to="/pets" replace />} />
    </Routes>
  );
}
