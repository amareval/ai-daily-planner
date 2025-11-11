import { nanoid } from "nanoid";
import { useMemo } from "react";
import { create } from "zustand";
import { formatISO } from "date-fns";

import type { DailyBrief, Goal, PlannerState, Task } from "../types";
import { mockAvailability, mockBrief, mockGoal, mockTasks } from "../mocks/plannerData";

type PlannerActions = {
  bootstrapDemo: () => void;
  updateProfile: (profile: { fullName?: string; timezone?: string }) => void;
  updateGoal: (goal: Goal) => void;
  addTask: (task: Omit<Task, "id" | "status" | "source" | "estimatedMinutes">) => void;
  toggleTaskStatus: (taskId: string) => void;
  updateAvailability: (minutes: number) => void;
  generateBrief: () => DailyBrief;
  reorderTasks: (orderedIds: string[]) => void;
};

export const usePlannerStore = create<PlannerState & PlannerActions>((set, get) => ({
  tasks: [],
  bootstrapDemo: () =>
    set({
      goal: mockGoal,
      tasks: mockTasks,
      availability: mockAvailability,
      brief: mockBrief,
      userEmail: "demo@planner.ai",
      fullName: "Demo Candidate",
      timezone: "America/Los_Angeles",
    }),
  updateProfile: (profile) => set(profile),
  updateGoal: (goal) => set({ goal }),
  addTask: (taskInput) =>
    set((state) => ({
      tasks: [
        ...state.tasks,
        {
          ...taskInput,
          id: nanoid(6),
          status: "pending",
          source: "manual",
        },
      ],
    })),
  toggleTaskStatus: (taskId) =>
    set((state) => ({
      tasks: state.tasks.map((task) =>
        task.id === taskId ? { ...task, status: task.status === "complete" ? "pending" : "complete" } : task,
      ),
    })),
  updateAvailability: (minutes) =>
    set({
      availability: {
        date: formatISO(new Date(), { representation: "date" }),
        minutesAvailable: minutes,
      },
    }),
  generateBrief: () => {
    const state = get();
    const today = formatISO(new Date(), { representation: "date" });
    const todaysTasks = state.tasks.filter((task) => task.scheduledDate === today);
    const totalTaskMinutes = todaysTasks.reduce((sum, task) => sum + (task.estimatedMinutes ?? 0), 0);

    const brief: DailyBrief = {
      date: today,
      totalTaskMinutes,
      tasks: todaysTasks,
      learningSuggestions: mockBrief.learningSuggestions,
    };
    set({ brief });
    return brief;
  },
  reorderTasks: (orderedIds) =>
    set((state) => {
      const taskMap = Object.fromEntries(state.tasks.map((task) => [task.id, task]));
      return {
        tasks: orderedIds.map((id) => taskMap[id]).filter(Boolean),
      };
    }),
}));

export const usePlannerState = () => {
  const store = usePlannerStore();

  return useMemo(
    () => ({
      ...store,
    }),
    [store],
  );
};
