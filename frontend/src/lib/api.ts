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
};

export { API_BASE_URL };
