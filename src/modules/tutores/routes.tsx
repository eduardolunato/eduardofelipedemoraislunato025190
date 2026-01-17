import { Routes, Route } from "react-router-dom";

function TutoresHome() {
  return <div className="p-6">Módulo Tutores (em construção)</div>;
}

export default function TutoresRoutes() {
  return (
    <Routes>
      <Route index element={<TutoresHome />} />
    </Routes>
  );
}
