import { Navigate, Route, Routes } from "react-router-dom";

import { RequireAuth } from "./auth/RequireAuth";
import { CheckEmailPage } from "./pages/CheckEmailPage";
import { LoginPage } from "./pages/LoginPage";
import { QuizLandingPage } from "./pages/QuizLandingPage";
import { QuizStartPage } from "./pages/QuizStartPage";
import { ResultPage } from "./pages/ResultPage";
import { ProfilePage } from "./pages/ProfilePage";
import { VerifyPage } from "./pages/VerifyPage";
import { SessionsPage } from "./pages/SessionsPage";
import AuthCallbackPage from "./pages/AuthCallbackPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/quiz" replace />} />

      {/* Public */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/check-email" element={<CheckEmailPage />} />
      <Route path="/verify" element={<VerifyPage />} />
      <Route path="/auth/callback" element={<AuthCallbackPage />} />

      {/* Private */}
      <Route
        path="/quiz"
        element={
          <RequireAuth>
            <QuizLandingPage />
          </RequireAuth>
        }
      />
      <Route
        path="/quiz/start"
        element={
          <RequireAuth>
            <QuizStartPage />
          </RequireAuth>
        }
      />
      <Route
        path="/result/:id"
        element={
          <RequireAuth>
            <ResultPage />
          </RequireAuth>
        }
      />
      <Route
        path="/profile"
        element={
          <RequireAuth>
            <ProfilePage />
          </RequireAuth>
        }
      />
      <Route
        path="/sessions"
        element={
          <RequireAuth>
            <SessionsPage />
          </RequireAuth>
        }
      />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
