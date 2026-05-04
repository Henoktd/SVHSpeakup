import { Route, Routes } from "react-router-dom";
import { HomePage } from "./pages/HomePage";
import { ReportPage } from "./pages/ReportPage";
import { ConfirmationPage } from "./pages/ConfirmationPage";

export function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/report" element={<ReportPage />} />
      <Route path="/confirmation" element={<ConfirmationPage />} />
    </Routes>
  );
}
