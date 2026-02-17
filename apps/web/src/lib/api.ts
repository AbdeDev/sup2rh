const API_BASE_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api";

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

// Analysis
export interface AnalysisResult {
  jobId: string;
  confidence: number;
  explanation: string;
  scores: Record<string, number>;
}

export async function analyzeQuiz(sessionId: string): Promise<AnalysisResult> {
  return request<AnalysisResult>(`/quiz/session/${sessionId}/analyze`, {
    method: "POST",
  });
}
