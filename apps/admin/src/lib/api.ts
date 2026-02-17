const API_BASE_URL = (import.meta.env.VITE_API_URL || "http://127.0.0.1:8000") + "/api";

export interface ApiError {
  message: string;
  errors?: string[];
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const { supabase } = await import("./supabase");

  const {
    data: { session: authSession },
  } = await supabase.auth.getSession();
  const token = authSession?.access_token;

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...options.headers,
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

  return response.json();
}

// User
export async function getMe() {
  return request<{ id: string; email: string; role: string }>("/me");
}

// Admin - Jobs (Fiches métier RH)
export interface Job {
  id: string;
  name: string;
  description?: string;
  salary?: string;
  hiringRate?: number;
  turnoverRate?: number;
  indicators?: Record<string, unknown>;
  videoUrl?: string;
  createdAt: string;
}

export interface CreateJobRequest {
  id: string;
  name: string;
  description?: string;
  salary?: string;
  hiringRate?: number;
  turnoverRate?: number;
  indicators?: Record<string, unknown>;
  videoUrl?: string;
}

export interface UpdateJobRequest {
  name?: string;
  description?: string;
  salary?: string;
  hiringRate?: number;
  turnoverRate?: number;
  indicators?: Record<string, unknown>;
  videoUrl?: string;
}

export async function getJobs(): Promise<{ items: Job[] }> {
  return request<{ items: Job[] }>("/admin/jobs");
}

export async function getJob(id: string): Promise<Job> {
  return request<Job>(`/admin/jobs/${id}`);
}

export async function createJob(job: CreateJobRequest): Promise<Job> {
  return request<Job>("/admin/jobs", {
    method: "POST",
    body: JSON.stringify(job),
  });
}

export async function updateJob(id: string, job: UpdateJobRequest): Promise<Job> {
  return request<Job>(`/admin/jobs/${id}`, {
    method: "PUT",
    body: JSON.stringify(job),
  });
}

export async function deleteJob(id: string): Promise<void> {
  return request<void>(`/admin/jobs/${id}`, {
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
  return request<QuizDefinition>(`/admin/quizzes/${id}`);
}

export async function createQuiz(quiz: CreateQuizRequest): Promise<QuizDefinition> {
  return request<QuizDefinition>("/admin/quizzes", {
    method: "POST",
    body: JSON.stringify(quiz),
  });
}

export async function deleteQuiz(id: string): Promise<void> {
  return request<void>(`/admin/quizzes/${id}`, {
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
