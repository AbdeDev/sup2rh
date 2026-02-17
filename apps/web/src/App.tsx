import { Navigate, Route, Routes } from "react-router-dom";

import { RequireAuth } from "./auth/RequireAuth";
import { CheckEmailPage } from "./pages/CheckEmailPage";
import { LoginPage } from "./pages/LoginPage";
import { QuizPage } from "./pages/QuizPage";
import AuthCallbackPage from "./pages/AuthCallbackPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/quiz" replace />} />

      {/* Public */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/check-email" element={<CheckEmailPage />} />
      <Route path="/auth/callback" element={<AuthCallbackPage />} />

      {/* Private */}
      <Route
        path="/quiz"
        element={
          <RequireAuth>
            <QuizPage />
          </RequireAuth>
        }
      />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
