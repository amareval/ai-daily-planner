import { format, formatISO, parseISO } from "date-fns";
import { nanoid } from "nanoid";
import { useCallback, useEffect, useState } from "react";
import type { ChatMessage, Goal, RecommendationTodo, RecommendationsResponse, Task } from "./types";
import { AvailabilityCard } from "./components/AvailabilityCard";
import { BriefPreview } from "./components/BriefPreview";
import { ChatPanel } from "./components/ChatPanel";
import { GoalBanner } from "./components/GoalBanner";
import { OnboardingForm } from "./components/OnboardingForm";
import { PdfUploadCard } from "./components/PdfUploadCard";
import { TaskComposer } from "./components/TaskComposer";
import { TaskList } from "./components/TaskList";
import { usePlannerStore } from "./hooks/usePlannerState";
import { plannerApi } from "./lib/api";

type Tab = "daily" | "settings";
type GoalFormValues = Goal & { timezone?: string; fullName?: string };

const App = () => {
  const [activeTab, setActiveTab] = useState<Tab>("daily");
  const [selectedDate, setSelectedDate] = useState(formatISO(new Date(), { representation: "date" }));
  const selectedDateLabel = format(parseISO(selectedDate), "MMMM d, yyyy");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{ message: string; variant: "neutral" | "success" | "error" }>({
    message: "No upload yet",
    variant: "neutral",
  });
  const [carryForwardStatus, setCarryForwardStatus] = useState<string | null>(null);
  const [recommendations, setRecommendations] = useState<RecommendationsResponse | null>(null);
  const [recommendationsError, setRecommendationsError] = useState<string | null>(null);
  const [isFetchingRecommendations, setIsFetchingRecommendations] = useState(false);
  const {
    goal,
    tasks,
    availability,
    fullName,
    timezone,
    updateGoal,
    updateProfile,
    addTask,
    toggleTaskStatus,
    updateAvailability,
    reorderTasks,
    userId,
    setTasks,
  } = usePlannerStore();

  const handleGoalSubmit = (values: GoalFormValues) => {
    const { fullName: name, timezone: tz, ...goalPayload } = values;
    updateGoal(goalPayload);
    updateProfile({ fullName: name, timezone: tz });
  };

  const pushMessage = (role: ChatMessage["role"], content: string) => {
    setChatMessages((prev) => [
      ...prev,
      {
        id: nanoid(),
        role,
        content,
        timestamp: new Date().toISOString(),
      },
    ]);
  };

  const buildAssistantResponse = (prompt: string) => {
    if (prompt.includes("task:")) {
      return "Break the task into a 15-minute research block, a draft, and a polish pass. Share progress with an accountability partner to stay on track.";
    }
    return "Focus the next block on your number-one priority, then summarize what you accomplished so I can suggest your next move.";
  };

  const handleSendChat = (content: string) => {
    pushMessage("user", content);
    setIsThinking(true);
    setTimeout(() => {
      pushMessage("assistant", buildAssistantResponse(content));
      setIsThinking(false);
    }, 700);
  };

  const handleAskForTask = (taskTitle: string) => {
    handleSendChat(`Need help completing task: "${taskTitle}". Any ideas? [task:${taskTitle}]`);
    setActiveTab("daily");
  };

  const mapTaskFromApi = (apiTask: any): Task => ({
    id: apiTask.id,
    title: apiTask.title,
    notes: apiTask.notes ?? undefined,
    scheduledDate: apiTask.scheduled_date,
    estimatedMinutes: apiTask.estimated_minutes ?? undefined,
    status: apiTask.status,
    source: apiTask.source,
    pdfIngestionId: apiTask.pdf_ingestion_id,
  });

  const refreshTasksFromApi = async () => {
    if (!userId) return;
    try {
      const apiTasks = await plannerApi.fetchTasks({ userId, scheduledDate: selectedDate });
      if (apiTasks.length) {
        const mappedApi = apiTasks.map(mapTaskFromApi);
        const knownIds = new Set(mappedApi.map((task) => task.id));
        const localOnly = tasks.filter((task) => !knownIds.has(task.id));
        setTasks([...localOnly, ...mappedApi]);
      }
    } catch (error) {
      console.warn("Falling back to local tasks; fetch failed:", error);
    }
  };

  const refreshRecommendations = useCallback(async () => {
    if (!userId || !goal) {
      return;
    }
    setIsFetchingRecommendations(true);
    try {
      const response = await plannerApi.fetchRecommendations({
        userId,
        scheduledDate: selectedDate,
        primaryGoal: goal.primaryGoal,
        secondaryGoals: goal.secondaryGoals,
        skillsFocus: goal.skillsFocus,
      });
      setRecommendations(response);
      setRecommendationsError(null);
    } catch (error: any) {
      setRecommendationsError(error.message || "Unable to load recommendations");
    } finally {
      setIsFetchingRecommendations(false);
    }
  }, [goal?.primaryGoal, goal?.secondaryGoals, goal?.skillsFocus, selectedDate, userId]);

  useEffect(() => {
    refreshTasksFromApi();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, selectedDate]);

  useEffect(() => {
    void refreshRecommendations();
  }, [refreshRecommendations]);

  const handlePdfUpload = async (file: File) => {
    if (!userId) {
      setUploadStatus({ message: "No user ID set", variant: "error" });
      return;
    }
    setUploadStatus({ message: `Parsing ${file.name}...`, variant: "neutral" });
    try {
      const response = await plannerApi.uploadPdf({ userId, scheduledDate: selectedDate, file });
      setUploadStatus({
        message: `Parsed ${response.parsed_task_count ?? response.tasks_created?.length ?? 0} tasks from ${file.name}`,
        variant: "success",
      });
      await refreshTasksFromApi();
    } catch (error: any) {
      setUploadStatus({ message: `Upload failed: ${error.message || "Unknown error"}`, variant: "error" });
    }
  };

  const handleCarryForward = async () => {
    if (!userId) return;
    setCarryForwardStatus("Moving incomplete tasks…");
    try {
      const moved = await plannerApi.carryForward({ userId, fromDate: selectedDate });
      setCarryForwardStatus(`Moved ${moved.length} tasks to tomorrow.`);
      await refreshTasksFromApi();
    } catch (error: any) {
      setCarryForwardStatus(`Carry-forward failed: ${error.message || "Unknown error"}`);
    }
  };

  const handleAddRecommendation = (suggestion: RecommendationTodo) => {
    addTask({
      title: suggestion.title,
      scheduledDate: selectedDate,
      notes: suggestion.description,
    });
    setActiveTab("daily");
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await plannerApi.deleteTask(taskId);
      setTasks(tasks.filter((task) => task.id !== taskId));
    } catch (error) {
      console.warn("Delete failed:", error);
    }
  };

  const handleToggleTaskStatus = async (taskId: string) => {
    const current = tasks.find((task) => task.id === taskId);
    if (!current) return;
    const nextStatus = current.status === "complete" ? "pending" : "complete";
    try {
      await plannerApi.updateTask(taskId, { status: nextStatus });
      setTasks(tasks.map((task) => (task.id === taskId ? { ...task, status: nextStatus } : task)));
    } catch (error) {
      console.warn("Status update failed:", error);
    }
  };

  const handleCreateTask = async ({ title, scheduledDate }: { title: string; scheduledDate: string }) => {
    if (!userId) return;
    try {
      const apiTask = await plannerApi.createTask({ userId, title, scheduledDate });
      setTasks([...tasks, mapTaskFromApi(apiTask)]);
    } catch (error) {
      console.warn("Create task failed:", error);
    }
  };

  const handleDateChange = (value: string) => {
    setSelectedDate(value);
    setCarryForwardStatus(null);
  };

  const dailyView = (
    <div className="daily-layout">
      <div className="daily-main">
        <header>
          <p style={{ textTransform: "uppercase", letterSpacing: "0.1em", color: "#94a3b8", margin: 0 }}>Daily</p>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem" }}>
            <h1 style={{ margin: "0.35rem 0 0" }}>Daily Plan - {selectedDateLabel}</h1>
            <input
              type="date"
              value={selectedDate}
              onChange={(event) => handleDateChange(event.target.value)}
              style={{
                border: "1px solid #cbd5f5",
                borderRadius: "8px",
                padding: "0.4rem 0.6rem",
                fontSize: "1rem",
              }}
            />
          </div>
        </header>

        <GoalBanner goal={goal} />

        <div className="surface">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem" }}>
            <div>
              <h3 style={{ margin: "0 0 0.35rem" }}>Today's To-Do</h3>
              <p style={{ margin: 0, color: "#475569" }}>Rank tasks, click to ask AI for help, or keep adding more.</p>
            </div>
            <span style={{ color: "#94a3b8" }}>
              {tasks.filter((task) => task.scheduledDate === selectedDate).length} items
            </span>
          </div>
          {carryForwardStatus && <small style={{ color: "#475569" }}>{carryForwardStatus}</small>}
          <TaskList
            tasks={tasks}
            onToggle={handleToggleTaskStatus}
            onReorder={reorderTasks}
            onAsk={(task) => handleAskForTask(task.title)}
            onDelete={handleDeleteTask}
            dateFilter={selectedDate}
            title={undefined}
          />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "1rem", gap: "1rem", flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 300 }}>
              <TaskComposer onAdd={handleCreateTask} selectedDate={selectedDate} />
            </div>
            <button
              onClick={handleCarryForward}
              style={{
                border: "1px solid #cbd5f5",
                background: "#e0e7ff",
                color: "#312e81",
                borderRadius: "999px",
                padding: "0.55rem 1.2rem",
                cursor: "pointer",
                fontWeight: 600,
                alignSelf: "flex-end",
              }}
            >
              Carry incomplete tomorrow
            </button>
          </div>
        </div>

        <BriefPreview
          recommendations={recommendations}
          onGenerate={refreshRecommendations}
          onAddSuggestion={handleAddRecommendation}
          isLoading={isFetchingRecommendations}
          statusMessage={recommendationsError}
        />

        <PdfUploadCard
          statusMessage={uploadStatus.message}
          statusVariant={uploadStatus.variant}
          onUpload={handlePdfUpload}
        />
      </div>
      <div className="daily-chat">
        <ChatPanel messages={chatMessages} onSend={handleSendChat} isThinking={isThinking} />
      </div>
    </div>
  );

  const onboardingDefaults: Goal & { timezone?: string; fullName?: string } = goal
    ? { ...goal, fullName, timezone }
    : { primaryGoal: "", fullName, timezone };

  const settingsView = (
    <div className="section-stack">
      <header>
        <p style={{ textTransform: "uppercase", letterSpacing: "0.1em", color: "#94a3b8", margin: 0 }}>Settings</p>
        <h1 style={{ margin: "0.35rem 0 0" }}>Evening capture preferences</h1>
        <p style={{ margin: "0.25rem 0 0", color: "#475569" }}>
          Tune your ultimate goal, skills focus, and default learning time.
        </p>
      </header>

      <OnboardingForm
        defaultValues={onboardingDefaults}
        onSubmit={handleGoalSubmit}
      />

      <AvailabilityCard defaultMinutes={availability?.minutesAvailable ?? 120} onSave={updateAvailability} />
    </div>
  );

  return (
    <div className="app-root">
      <aside className="sidebar">
        <div>
          <h2>Daily AI Planner</h2>
          <p style={{ margin: "0.35rem 0 0", color: "#94a3b8" }}>Daily agent cockpit</p>
        </div>
        <nav className="sidebar-nav">
          <button
            className={`sidebar-button ${activeTab === "daily" ? "active" : ""}`}
            onClick={() => setActiveTab("daily")}
          >
            Daily
          </button>
          <button
            className={`sidebar-button ${activeTab === "settings" ? "active" : ""}`}
            onClick={() => setActiveTab("settings")}
          >
            Settings
          </button>
        </nav>
      </aside>

      <main className="main-panel">{activeTab === "daily" ? dailyView : settingsView}</main>
    </div>
  );
};

export default App;
