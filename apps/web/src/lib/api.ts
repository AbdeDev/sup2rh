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
  return request<{ items: JobFiche[] }>("/jobs");
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
