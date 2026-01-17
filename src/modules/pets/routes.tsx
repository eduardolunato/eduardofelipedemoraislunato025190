import { Routes, Route } from "react-router-dom";
import PetsList from "@/modules/pets/pages/PetsList";
import PetDetail from "@/modules/pets/pages/PetDetail";


export default function PetsRoutes() {
  return (
    <Routes>
      <Route index element={<PetsList />} />
      <Route path=":id" element={<PetDetail />} />
    </Routes>
  );
}
