import { addDays, formatISO } from "date-fns";
import type { DailyBrief, DailyAvailability, Goal, Task } from "../types";

const todayISO = formatISO(new Date(), { representation: "date" });

export const mockGoal: Goal = {
  primaryGoal: "Land a Senior Product Manager role at a Series A startup",
  secondaryGoals: "Write weekly case studies, maintain networking cadence",
  industry: "AI Productivity",
  skillsFocus: "Storytelling, data case studies, networking cadence",
  defaultLearningMinutes: 120,
};

export const mockTasks: Task[] = [
  {
    id: "t-1",
    title: "Tailor resume for Nimbus Labs",
    scheduledDate: todayISO,
    estimatedMinutes: 45,
    status: "pending",
    source: "manual",
  },
  {
    id: "t-2",
    title: "Reach out to 3 alumni on LinkedIn",
    scheduledDate: todayISO,
    estimatedMinutes: 30,
    status: "pending",
    source: "pdf",
  },
  {
    id: "t-3",
    title: "Mock interview: product strategy",
    scheduledDate: formatISO(addDays(new Date(), 1), { representation: "date" }),
    estimatedMinutes: 60,
    status: "deferred",
    source: "manual",
  },
];

export const mockAvailability: DailyAvailability = {
  date: todayISO,
  minutesAvailable: 240,
};

export const mockBrief: DailyBrief = {
  date: todayISO,
  totalTaskMinutes: 75,
  tasks: mockTasks.filter((task) => task.scheduledDate === todayISO),
  learningSuggestions: [
    {
      title: "Skill Drill: Behavioral Story Bank",
      description: "Draft STAR stories for leadership & conflict scenarios.",
      timeMinutes: 30,
      category: "Skill Drill",
    },
    {
      title: "Market Pulse: AI Product Trends",
      description: "Read the Latent Space digest on enterprise AI adoption.",
      timeMinutes: 20,
      category: "Market Pulse",
    },
    {
      title: "Job Search Tactic: Warm intros",
      description: "Identify 2 second-degree connections at top targets.",
      timeMinutes: 25,
      category: "Job Search Tactic",
    },
  ],
};
