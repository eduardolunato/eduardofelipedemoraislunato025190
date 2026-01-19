import TutorCreate from "./pages/TutorCreate";
import { Routes, Route } from "react-router-dom";

function TutoresHome() {
  return <div className="p-6">Módulo Tutores (em construção)</div>;
}

export default function TutoresRoutes() {
  return (
    <Routes>
      <Route index element={<TutoresHome />} />
      <Route path="novo" element={<TutorCreate />} />
    </Routes>
  );
}
