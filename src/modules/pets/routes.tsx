import { Routes, Route } from "react-router-dom";
import PetsList from "./pages/PetsList";
import PetDetail from "./pages/PetDetail";

export default function PetsRoutes() {
  return (
    <Routes>
      <Route index element={<PetsList />} />
      <Route path=":id" element={<PetDetail />} />
    </Routes>
  );
}
