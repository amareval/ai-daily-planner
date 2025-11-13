import { format, formatISO } from "date-fns";
import { nanoid } from "nanoid";
import { useEffect, useState } from "react";
import type { ChatMessage, DailyBrief, Goal, Task } from "./types";
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
  const today = formatISO(new Date(), { representation: "date" });
  const [activeTab, setActiveTab] = useState<Tab>("daily");
  const todayLabel = format(new Date(), "MMMM d, yyyy");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{ message: string; variant: "neutral" | "success" | "error" }>({
    message: "No upload yet",
    variant: "neutral",
  });
  const [carryForwardStatus, setCarryForwardStatus] = useState<string | null>(null);
  const {
    goal,
    tasks,
    availability,
    brief,
    fullName,
    timezone,
    updateGoal,
    updateProfile,
    addTask,
    toggleTaskStatus,
    updateAvailability,
    generateBrief,
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
      const apiTasks = await plannerApi.fetchTasks({ userId, scheduledDate: today });
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

  useEffect(() => {
    refreshTasksFromApi();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, today]);

  const handlePdfUpload = async (file: File) => {
    if (!userId) {
      setUploadStatus({ message: "No user ID set", variant: "error" });
      return;
    }
    setUploadStatus({ message: `Parsing ${file.name}...`, variant: "neutral" });
    try {
      const response = await plannerApi.uploadPdf({ userId, scheduledDate: today, file });
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
      const moved = await plannerApi.carryForward({ userId, fromDate: today });
      setCarryForwardStatus(`Moved ${moved.length} tasks to tomorrow.`);
      await refreshTasksFromApi();
    } catch (error: any) {
      setCarryForwardStatus(`Carry-forward failed: ${error.message || "Unknown error"}`);
    }
  };

  const handleAddRecommendation = (suggestion: DailyBrief["learningSuggestions"][number]) => {
    addTask({
      title: suggestion.title,
      scheduledDate: today,
    });
    setActiveTab("daily");
  };

  const dailyView = (
    <div className="daily-layout">
      <div className="daily-main">
        <header>
          <p style={{ textTransform: "uppercase", letterSpacing: "0.1em", color: "#94a3b8", margin: 0 }}>Daily</p>
          <h1 style={{ margin: "0.35rem 0 0" }}>Daily Plan - {todayLabel}</h1>
        </header>

        <GoalBanner goal={goal} />

        <div className="surface">
          <h3 style={{ marginTop: 0 }}>Today's Tasks</h3>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem" }}>
            <p style={{ margin: 0, color: "#475569" }}>Rank tasks, click to ask AI for help, or keep adding more.</p>
            <button
              onClick={handleCarryForward}
              style={{
                border: "1px solid #cbd5f5",
                background: "#e0e7ff",
                color: "#312e81",
                borderRadius: "999px",
                padding: "0.35rem 0.9rem",
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              Carry forward incomplete
            </button>
          </div>
          {carryForwardStatus && <small style={{ color: "#475569" }}>{carryForwardStatus}</small>}
          <TaskList
            tasks={tasks}
            onToggle={toggleTaskStatus}
            onReorder={reorderTasks}
            onAsk={(task) => handleAskForTask(task.title)}
            dateFilter={today}
            title="Focus for Today"
          />
          <TaskComposer onAdd={addTask} />
        </div>

        <BriefPreview brief={brief} onGenerate={generateBrief} onAddSuggestion={handleAddRecommendation} />

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
        defaultValues={{
          ...goal,
          fullName,
          timezone,
        }}
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
