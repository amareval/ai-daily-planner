import type { RecommendationTodo, RecommendationsResponse } from "../types";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000";

const jsonHeaders = {
  "Content-Type": "application/json",
};

export type UploadPdfPayload = {
  userId: string;
  scheduledDate: string;
  file: File;
};

export type FetchTasksParams = {
  userId: string;
  scheduledDate: string;
};

export type CarryForwardPayload = {
  userId: string;
  fromDate: string;
  toDate?: string;
};

export type CreateTaskPayload = {
  userId: string;
  title: string;
  scheduledDate: string;
};

export type UpdateTaskPayload = {
  status?: string;
  scheduledDate?: string;
  notes?: string;
  estimatedMinutes?: number | null;
};

export type FetchRecommendationsPayload = {
  userId: string;
  scheduledDate: string;
  primaryGoal?: string;
  secondaryGoals?: string;
  skillsFocus?: string;
};

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || res.statusText);
  }
  return res.json() as Promise<T>;
}

export const plannerApi = {
  async uploadPdf({ userId, scheduledDate, file }: UploadPdfPayload) {
    const form = new FormData();
    form.append("user_id", userId);
    form.append("scheduled_date", scheduledDate);
    form.append("file", file);

    const res = await fetch(`${API_BASE_URL}/api/v1/uploads/pdf`, {
      method: "POST",
      body: form,
    });
    return handleResponse<{
      id: string;
      parsed_task_count: number;
      tasks_created: string[];
    }>(res);
  },

  async fetchTasks({ userId, scheduledDate }: FetchTasksParams) {
    const params = new URLSearchParams({ user_id: userId, scheduled_date: scheduledDate });
    const res = await fetch(`${API_BASE_URL}/api/v1/tasks?${params.toString()}`);
    return handleResponse<any[]>(res);
  },

  async carryForward(payload: CarryForwardPayload) {
    const body = {
      user_id: payload.userId,
      from_date: payload.fromDate,
      to_date: payload.toDate,
    };
    const res = await fetch(`${API_BASE_URL}/api/v1/tasks/carry-forward`, {
      method: "POST",
      headers: jsonHeaders,
      body: JSON.stringify(body),
    });
    return handleResponse<any[]>(res);
  },

  async deleteTask(taskId: string) {
    const res = await fetch(`${API_BASE_URL}/api/v1/tasks/${taskId}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || res.statusText);
    }
  },

  async createTask(payload: CreateTaskPayload) {
    const res = await fetch(`${API_BASE_URL}/api/v1/tasks`, {
      method: "POST",
      headers: jsonHeaders,
      body: JSON.stringify({
        user_id: payload.userId,
        title: payload.title,
        scheduled_date: payload.scheduledDate,
        source: "manual",
      }),
    });
    return handleResponse<any>(res);
  },

  async updateTask(taskId: string, payload: UpdateTaskPayload) {
    const res = await fetch(`${API_BASE_URL}/api/v1/tasks/${taskId}`, {
      method: "PATCH",
      headers: jsonHeaders,
      body: JSON.stringify(payload),
    });
    return handleResponse<any>(res);
  },

  async fetchRecommendations(payload: FetchRecommendationsPayload) {
    const res = await fetch(`${API_BASE_URL}/api/v1/recommendations`, {
      method: "POST",
      headers: jsonHeaders,
      body: JSON.stringify({
        user_id: payload.userId,
        scheduled_date: payload.scheduledDate,
        primary_goal: payload.primaryGoal,
        secondary_goals: payload.secondaryGoals,
        skills_focus: payload.skillsFocus,
      }),
    });
    return handleResponse<{
      user_id: string;
      scheduled_date: string;
      goal_statement: string;
      recommended_todos: {
        title: string;
        description: string;
        category: string;
        estimated_minutes: number;
        resource_url?: string | null;
      }[];
    }>(res).then((data) => ({
      userId: data.user_id,
      scheduledDate: data.scheduled_date,
      goalStatement: data.goal_statement,
      recommendedTodos: data.recommended_todos.map<RecommendationTodo>((todo) => ({
        title: todo.title,
        description: todo.description,
        category: todo.category,
        estimatedMinutes: todo.estimated_minutes,
        resourceUrl: todo.resource_url ?? undefined,
      })),
    }));
  },
};

export { API_BASE_URL };
