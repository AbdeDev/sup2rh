import { Navigate, Route, Routes } from "react-router-dom";
import { Toaster } from "sonner";

import { RequireAuth } from "./auth/RequireAuth";
import { CheckEmailPage } from "./pages/CheckEmailPage";
import { HomeRedirect } from "./pages/HomeRedirect";
import { LoginPage } from "./pages/LoginPage";
import { QuizLandingPage } from "./pages/QuizLandingPage";
import { QuizStartPage } from "./pages/QuizStartPage";
import { ResultPage } from "./pages/ResultPage";
import { ProfilePage } from "./pages/ProfilePage";
import { FichesPage } from "./pages/FichesPage";
import { FicheDetailPage } from "./pages/FicheDetailPage";
import { VerifyPage } from "./pages/VerifyPage";
import { SessionsPage } from "./pages/SessionsPage";
import AuthCallbackPage from "./pages/AuthCallbackPage";
import { LegalConditionsPage } from "./pages/LegalConditionsPage";
import { LegalPrivacyPage } from "./pages/LegalPrivacyPage";

export default function App() {
  return (
    <>
      <Toaster position="top-right" richColors closeButton />
      <Routes>
        <Route path="/" element={<HomeRedirect />} />

        {/* Public */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/check-email" element={<CheckEmailPage />} />
        <Route path="/verify" element={<VerifyPage />} />
        <Route path="/auth/callback" element={<AuthCallbackPage />} />
        <Route path="/legal/conditions" element={<LegalConditionsPage />} />
        <Route path="/legal/confidentialite" element={<LegalPrivacyPage />} />

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
        <Route path="/fiches" element={<FichesPage />} />
        <Route path="/fiches/:id" element={<FicheDetailPage />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/quiz" replace />} />
      </Routes>
    </>
  );
}
