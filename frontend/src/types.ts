export type Goal = {
  primaryGoal: string;
  secondaryGoals?: string;
  industry?: string;
  skillsFocus?: string;
  defaultLearningMinutes?: number;
};

export type Task = {
  id: string;
  title: string;
  notes?: string;
  scheduledDate: string;
  estimatedMinutes?: number;
  status: "pending" | "complete" | "deferred";
  source: "manual" | "pdf";
};

export type DailyAvailability = {
  date: string;
  minutesAvailable: number;
};

export type LearningSuggestion = {
  title: string;
  description: string;
  timeMinutes: number;
  category: string;
};

export type DailyBrief = {
  date: string;
  totalTaskMinutes: number;
  tasks: Task[];
  learningSuggestions: LearningSuggestion[];
};

export type PlannerState = {
  userEmail?: string;
  fullName?: string;
  timezone?: string;
  goal?: Goal;
  tasks: Task[];
  availability?: DailyAvailability;
  brief?: DailyBrief;
};

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
};
