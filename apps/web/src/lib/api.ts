const API_BASE_URL = (import.meta.env.VITE_API_URL || "http://127.0.0.1:8000") + "/api";

export interface ApiError {
  message: string;
  errors?: string[];
}

function getAccessTokenFromSupabaseStorage(): string | null {
  try {
    const key = Object.keys(localStorage).find(
      (k) => k.startsWith("sb-") && k.endsWith("-auth-token"),
    );
    if (!key) return null;
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as
      | { access_token?: string; currentSession?: { access_token?: string } }
      | Array<{ access_token?: string }>;

    if (Array.isArray(parsed)) {
      return parsed[0]?.access_token ?? null;
    }
    return parsed.access_token ?? parsed.currentSession?.access_token ?? null;
  } catch {
    return null;
  }
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {},
  retried = false,
): Promise<T> {
  const { supabase } = await import("./supabase");

  let authSession = (await supabase.auth.getSession()).data.session;
  if (!authSession?.access_token && !retried) {
    const { data } = await supabase.auth.refreshSession();
    authSession = data.session;
  }
  const token = authSession?.access_token ?? getAccessTokenFromSupabaseStorage();

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

  if (response.status === 401 && !retried) {
    const { data } = await supabase.auth.refreshSession();
    const newToken = data.session?.access_token;
    if (newToken) {
      const newHeaders: Record<string, string> = {
        "Content-Type": "application/json",
        ...(options.headers as Record<string, string>),
        Authorization: `Bearer ${newToken}`,
      };
      return request<T>(endpoint, { ...options, headers: newHeaders }, true);
    }
  }

  if (!response.ok) {
    let error: ApiError;
    const contentType = response.headers.get("content-type");
    if (contentType?.includes("application/json")) {
      error = await response.json().catch(() => ({
        message: `HTTP ${response.status}: ${response.statusText}`,
      }));
    } else {
      error = {
        message:
          response.status === 401
            ? "Session expirée ou invalide. Essaie de te reconnecter."
            : response.status === 404
              ? "Ressource introuvable."
              : response.status === 403
                ? "Accès refusé."
                : `Erreur serveur (${response.status}). Vérifie que l'API est démarrée.`,
      };
    }
    throw new Error(error.message || `HTTP ${response.status}`);
  }

  return response.json();
}

// Health
export async function getHealth() {
  return request<{ status: string; service: string }>("/health");
}

// User
export async function getMe() {
  return request<{ id: string; email: string; role: string }>("/me");
}

// Quiz (parcours avec questions)
export interface QuizQuestion {
  id: string;
  text: string;
  answers?: Array<{ id: string; label: string }>;
  jobId?: string | null;
}

export interface QuizDefinition {
  id: string;
  jobId: string;
  name: string;
  questions: QuizQuestion[];
  createdAt: string;
}

export async function getDefaultQuiz(): Promise<QuizDefinition> {
  return request<QuizDefinition>("/quiz/default");
}

export interface QuizQuestionsResponse {
  questions: QuizQuestion[];
  questionsPerPage: number;
}

export async function getQuizQuestions(): Promise<QuizQuestionsResponse> {
  return request<QuizQuestionsResponse>("/quiz/questions");
}

export async function submitContactRequest(data: {
  sessionId: string;
  email?: string;
  phone?: string;
  jobId?: string;
  explanation?: string;
  scores?: Record<string, number>;
}): Promise<{ id: string; message: string }> {
  return request<{ id: string; message: string }>("/contact", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function getJobs(): Promise<{ items: JobFiche[] }> {
  const response = await fetch(`${API_BASE_URL}/jobs`, {
    headers: { Accept: "application/json" },
  });
  if (!response.ok) {
    throw new Error(`Impossible de charger les fiches métiers (${response.status}).`);
  }
  return response.json();
}

export async function submitFeedback(data: {
  message: string;
  email?: string;
  rating?: number;
}): Promise<{ id: string; message: string }> {
  return request<{ id: string; message: string }>("/feedback", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// Quiz Sessions
export interface QuizSession {
  id: string;
  userId: string;
  createdAt: string;
  finalJobId: string | null;
  scores: Record<string, number> | null;
  answerCount?: number;
}

export interface QuizSessionWithAnswers extends QuizSession {
  answers: Array<{
    id: string;
    questionId: string;
    answerId: string | null;
    textValue: string | null;
    createdAt: string;
  }>;
}

export async function createQuizSession(): Promise<QuizSession> {
  return request<QuizSession>("/quiz/session", {
    method: "POST",
  });
}

export async function getQuizSessions(): Promise<{ items: QuizSession[] }> {
  return request<{ items: QuizSession[] }>("/quiz/session");
}

export async function getQuizSession(id: string): Promise<QuizSessionWithAnswers> {
  return request<QuizSessionWithAnswers>(`/quiz/session/${id}`);
}

export async function deleteQuizSession(id: string): Promise<{ message: string }> {
  return request<{ message: string }>(`/quiz/session/${id}`, {
    method: "DELETE",
  });
}

// Quiz Answers
export interface SubmitAnswerRequest {
  questionId: string;
  answerId?: string | null;
  textValue?: string | null;
  jobId?: string | null;
  questionText?: string | null;
}

export interface QuizAnswer {
  id: string;
  questionId: string;
  answerId: string | null;
  textValue: string | null;
  createdAt: string;
}

export async function submitAnswer(
  sessionId: string,
  answer: SubmitAnswerRequest,
): Promise<QuizAnswer> {
  return request<QuizAnswer>(`/quiz/session/${sessionId}/answer`, {
    method: "POST",
    body: JSON.stringify(answer),
  });
}

// Fiche métier RH (retournée avec le résultat d’analyse)
export interface JobFicheIndicator {
  label: string;
  value: string | number;
}

export interface JobFiche {
  id: string;
  name: string;
  description?: string;
  salary?: string;
  hiringRate?: number;
  turnoverRate?: number;
  indicators?: JobFicheIndicator[];
  videoUrl?: string;
  category?: string;
  createdAt: string;
}

// Analysis
export interface AnalysisResult {
  jobId: string;
  confidence: number;
  explanation: string;
  scores: Record<string, number>;
  /** Fiche RH du métier recommandé (si disponible) */
  job?: JobFiche;
}

export async function analyzeQuiz(sessionId: string): Promise<AnalysisResult> {
  return request<AnalysisResult>(`/quiz/session/${sessionId}/analyze`, {
    method: "POST",
  });
}

export async function submitSupportTicket(data: {
  email: string;
  type: "support" | "feature_request";
  subject: string;
  message: string;
}): Promise<{ id: string; message: string }> {
  return request<{ id: string; message: string }>("/support", {
    method: "POST",
    body: JSON.stringify(data),
  });
}
