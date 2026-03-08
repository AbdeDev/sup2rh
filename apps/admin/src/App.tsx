import { Navigate, Route, Routes } from "react-router-dom";
import { Toaster } from "sonner";

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
import { AdminCompanyContactsPage } from "./pages/admin/AdminCompanyContactsPage";
import { AdminFeedbacksPage } from "./pages/admin/AdminFeedbacksPage";
import { AdminJobCategoriesPage } from "./pages/admin/AdminJobCategoriesPage";

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Navigate to="/admin" replace />} />

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
          path="/admin/company-contacts"
          element={
            <RequireAuth>
              <RequireAdmin>
                <AdminCompanyContactsPage />
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

        <Route
          path="/admin/job-categories"
          element={
            <RequireAuth>
              <RequireAdmin>
                <AdminJobCategoriesPage />
              </RequireAdmin>
            </RequireAuth>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
      <Toaster position="top-right" richColors closeButton />
    </>
  );
}
