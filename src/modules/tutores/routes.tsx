import TutoresList from "./pages/TutoresList";
import TutorCreate from "./pages/TutorCreate";
import { Routes, Route } from "react-router-dom";
import TutorDetail from "./pages/TutorDetail";

export default function TutoresRoutes() {
  return (
    <Routes>
      <Route index element={<TutoresList />} />
      <Route path="novo" element={<TutorCreate />} />
      <Route path=":id" element={<TutorDetail />} />
    </Routes>
  );
}
