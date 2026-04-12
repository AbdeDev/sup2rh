const API_BASE_URL = (import.meta.env.VITE_API_URL || "http://127.0.0.1:8000") + "/api";

const ADMIN_TOKEN_KEY = "supdesrh_admin_token";

export interface ApiError {
  message: string;
  errors?: string[];
}

export function getAdminToken(): string | null {
  return localStorage.getItem(ADMIN_TOKEN_KEY);
}

export function setAdminToken(token: string): void {
  localStorage.setItem(ADMIN_TOKEN_KEY, token);
}

export function clearAdminToken(): void {
  localStorage.removeItem(ADMIN_TOKEN_KEY);
}

export async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const adminToken = getAdminToken();
  let token: string | null = adminToken;

  if (!token) {
    const { supabase } = await import("./supabase");
    const {
      data: { session: authSession },
    } = await supabase.auth.getSession();
    token = authSession?.access_token ?? null;
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error: ApiError = await response.json().catch(() => ({
      message: `HTTP ${response.status}: ${response.statusText}`,
    }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }

  // 204 No Content (common for DELETE endpoints)
  if (response.status === 204) {
    return undefined as T;
  }

  const contentLength = response.headers.get("content-length");
  if (contentLength === "0") {
    return undefined as T;
  }

  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    return undefined as T;
  }

  return response.json();
}

/** Connexion admin par email seul. Lance si l’email n’a pas le rôle ADMIN. */
export async function adminLogin(
  email: string,
): Promise<{ token: string; user: { id: string; email: string; role: string } }> {
  const res = await fetch(`${API_BASE_URL}/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: email.trim() }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || "Accès refusé");
  }
  return res.json();
}

// User
export async function getMe() {
  return request<{ id: string; email: string; role: string }>("/me");
}

// Indicateur supplémentaire : libellé + valeur (chiffre ou texte)
export interface JobIndicator {
  label: string;
  value: string | number;
}

// Admin - Jobs (Fiches métier RH)
export interface Job {
  id: string;
  name: string;
  description?: string;
  salary?: string;
  hiringRate?: number;
  turnoverRate?: number;
  indicators?: JobIndicator[];
  videoUrl?: string;
  category?: string;
  createdAt: string;
}

export interface CreateJobRequest {
  id: string;
  name: string;
  description?: string;
  salary?: string;
  hiringRate?: number;
  turnoverRate?: number;
  indicators?: JobIndicator[];
  videoUrl?: string;
  category?: string;
}

export interface UpdateJobRequest {
  name?: string;
  description?: string;
  salary?: string;
  hiringRate?: number;
  turnoverRate?: number;
  indicators?: JobIndicator[];
  videoUrl?: string;
  category?: string;
}

export async function getJobs(): Promise<{ items: Job[] }> {
  return request<{ items: Job[] }>("/admin/jobs");
}

export async function getJob(id: string): Promise<Job> {
  return request<Job>(`/admin/jobs/${encodeURIComponent(id)}`);
}

export async function createJob(job: CreateJobRequest): Promise<Job> {
  return request<Job>("/admin/jobs", {
    method: "POST",
    body: JSON.stringify(job),
  });
}

export async function updateJob(id: string, job: UpdateJobRequest): Promise<Job> {
  return request<Job>(`/admin/jobs/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: JSON.stringify(job),
  });
}

export async function deleteJob(id: string): Promise<void> {
  return request<void>(`/admin/jobs/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

// Admin - Quiz Definitions
export interface QuizDefinition {
  id: string;
  jobId: string;
  name: string;
  questions: Array<{
    id: string;
    text: string;
    answers: Array<{
      id: string;
      label: string;
    }>;
  }>;
  createdAt: string;
}

export interface CreateQuizRequest {
  jobId: string;
  name: string;
  questions: Array<{
    id: string;
    text: string;
    answers: Array<{
      id: string;
      label: string;
    }>;
  }>;
}

export async function getQuizzes(): Promise<{ items: QuizDefinition[] }> {
  return request<{ items: QuizDefinition[] }>("/admin/quizzes");
}

export async function getQuiz(id: string): Promise<QuizDefinition> {
  return request<QuizDefinition>(`/admin/quizzes/${encodeURIComponent(id)}`);
}

export async function createQuiz(quiz: CreateQuizRequest): Promise<QuizDefinition> {
  return request<QuizDefinition>("/admin/quizzes", {
    method: "POST",
    body: JSON.stringify(quiz),
  });
}

export interface UpdateQuizRequest {
  name?: string;
  jobId?: string;
  questions?: CreateQuizRequest["questions"];
}

export async function updateQuiz(id: string, data: UpdateQuizRequest): Promise<QuizDefinition> {
  return request<QuizDefinition>(`/admin/quizzes/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteQuiz(id: string): Promise<void> {
  return request<void>(`/admin/quizzes/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

// Admin - Users
export interface AdminUser {
  id: string;
  email: string;
  role: "USER" | "ADMIN";
  createdAt: string;
}

export async function getUsers(): Promise<{ items: AdminUser[] }> {
  return request<{ items: AdminUser[] }>("/admin/users");
}

export async function updateUserRole(userId: string, role: "USER" | "ADMIN"): Promise<AdminUser> {
  return request<AdminUser>(`/admin/users/${userId}/role`, {
    method: "PUT",
    body: JSON.stringify({ role }),
  });
}

// Admin - Demandes de contact (1 card par user avec toutes ses sessions)
export interface ContactRequestUserItem {
  email: string;
  phone?: string | null;
  userId: string;
  contactRequestedAt: string;
  sessions: Array<{
    id: string;
    answerCount: number;
    answers: Array<{
      questionId: string;
      answerId: string | null;
      textValue: string | null;
    }>;
    finalJobId: string | null;
    jobName: string | null;
    scores: Record<string, number> | null;
    createdAt: string;
  }>;
}

export async function getContactRequests(): Promise<{ items: ContactRequestUserItem[] }> {
  return request<{ items: ContactRequestUserItem[] }>("/admin/contact-requests");
}

// Admin - Avis utilisateurs
export interface FeedbackItem {
  id: string;
  email: string;
  userId: string;
  message: string;
  rating: number | null;
  createdAt: string;
}

export async function getFeedbacks(): Promise<{ items: FeedbackItem[] }> {
  return request<{ items: FeedbackItem[] }>("/admin/feedbacks");
}

// Admin - Demandes entreprises (contact depuis la landing)
export interface CompanyContactItem {
  id: string;
  companyName: string;
  contactName: string;
  email: string;
  phone: string | null;
  message: string;
  formationInterest: string | null;
  createdAt: string;
}

export async function getCompanyContacts(): Promise<{ items: CompanyContactItem[] }> {
  return request<{ items: CompanyContactItem[] }>("/company-contact/admin");
}

// Admin - Sessions par utilisateur (quiz, résultats, dates)
export interface AdminUserSession {
  userId: string;
  email: string;
  sessionCount: number;
  sessions: Array<{
    id: string;
    answerCount: number;
    finalJobId: string | null;
    jobName: string | null;
    scores: Record<string, number> | null;
    createdAt: string;
  }>;
}

export async function getAdminSessions(): Promise<{ items: AdminUserSession[] }> {
  return request<{ items: AdminUserSession[] }>("/admin/sessions");
}

export interface AdminSessionDetail {
  session: {
    id: string;
    userId: string;
    createdAt: string;
    finalJobId: string | null;
    scores: Record<string, number> | null;
    answers: Array<{
      questionId: string;
      answerId: string | null;
      textValue: string | null;
      jobId: string | null;
      createdAt: string;
    }>;
  };
  user: { id: string; email: string };
  analysis: {
    jobId: string;
    confidence: number;
    explanation: string;
    scores: Record<string, number>;
    job: {
      id: string;
      name: string;
      description?: string;
      salary?: string;
      hiringRate?: number;
      turnoverRate?: number;
      category?: string;
      createdAt: string;
    } | null;
  } | null;
}

export async function getAdminSessionDetail(sessionId: string): Promise<AdminSessionDetail> {
  return request<AdminSessionDetail>(`/admin/sessions/${sessionId}`);
}

// ─── Grands domaines RH (Job Categories) ────────────────────────────────────

export interface JobCategory {
  id: string;
  name: string;
  emoji: string | null;
  description: string | null;
  status: "established" | "emerging" | null;
  position: number;
  createdAt: string;
}

export interface CreateJobCategoryRequest {
  id?: string;
  name: string;
  emoji?: string;
  description?: string;
  status?: "established" | "emerging";
  position?: number;
}

export interface UpdateJobCategoryRequest {
  name?: string;
  emoji?: string | null;
  description?: string | null;
  status?: "established" | "emerging" | null;
  position?: number;
}

export async function getJobCategories(): Promise<{ items: JobCategory[] }> {
  return request<{ items: JobCategory[] }>("/admin/job-categories");
}

export async function createJobCategory(data: CreateJobCategoryRequest): Promise<JobCategory> {
  return request<JobCategory>("/admin/job-categories", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateJobCategory(
  id: string,
  data: UpdateJobCategoryRequest,
): Promise<JobCategory> {
  return request<JobCategory>(`/admin/job-categories/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteJobCategory(id: string): Promise<void> {
  return request<void>(`/admin/job-categories/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

export function getExportCsvUrl(type: "contact-requests" | "company-contacts"): string {
  return `${API_BASE_URL}/admin/${type}/export`;
}

export async function downloadCsv(type: "contact-requests" | "company-contacts"): Promise<void> {
  const token = getAdminToken();
  const res = await fetch(getExportCsvUrl(type), {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error("Erreur lors de l'export");
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = type === "contact-requests" ? "demandes-contact.csv" : "demandes-entreprises.csv";
  a.click();
  URL.revokeObjectURL(url);
}
