import { Navigate, Route, Routes } from "react-router-dom";

import { RequireAuth } from "./auth/RequireAuth";
import { RequireAdmin } from "./auth/RequireAdmin";
import { LoginPage } from "./pages/LoginPage";
import { CheckEmailPage } from "./pages/CheckEmailPage";
import AuthCallbackPage from "./pages/AuthCallbackPage";
import { AdminIndexPage } from "./pages/admin/AdminIndexPage";
import { AdminJobsPage } from "./pages/admin/AdminJobsPage";
import { AdminQuizzesPage } from "./pages/admin/AdminQuizzesPage";
import { AdminUsersPage } from "./pages/admin/AdminUsersPage";
import { AdminContactRequestsPage } from "./pages/admin/AdminContactRequestsPage";
import { AdminFeedbacksPage } from "./pages/admin/AdminFeedbacksPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* Public */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/check-email" element={<CheckEmailPage />} />
      <Route path="/auth/callback" element={<AuthCallbackPage />} />

      {/* Admin */}
      <Route
        path="/admin"
        element={
          <RequireAuth>
            <RequireAdmin>
              <AdminIndexPage />
            </RequireAdmin>
          </RequireAuth>
        }
      />
      <Route
        path="/admin/jobs"
        element={
          <RequireAuth>
            <RequireAdmin>
              <AdminJobsPage />
            </RequireAdmin>
          </RequireAuth>
        }
      />
      <Route
        path="/admin/quizzes"
        element={
          <RequireAuth>
            <RequireAdmin>
              <AdminQuizzesPage />
            </RequireAdmin>
          </RequireAuth>
        }
      />
      <Route
        path="/admin/users"
        element={
          <RequireAuth>
            <RequireAdmin>
              <AdminUsersPage />
            </RequireAdmin>
          </RequireAuth>
        }
      />
      <Route
        path="/admin/contact-requests"
        element={
          <RequireAuth>
            <RequireAdmin>
              <AdminContactRequestsPage />
            </RequireAdmin>
          </RequireAuth>
        }
      />
      <Route
        path="/admin/feedbacks"
        element={
          <RequireAuth>
            <RequireAdmin>
              <AdminFeedbacksPage />
            </RequireAdmin>
          </RequireAuth>
        }
      />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
