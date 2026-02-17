console.log("Hello via Bun!");

export type JobId = string;

export type Job = { id: JobId; name: string; description?: string };

export type Answer = {
  id: string;
  label: string;
  scores: Record<JobId, number>;
  nextQuestionId?: string;
};

export type Question = {
  id: string;
  label: string;
  type: "single" | "multiple" | "text";
  answers?: Answer[];
};

export type QuizDefinition = {
  jobs: Job[];
  questions: Question[];
  startQuestionId: string;
};
