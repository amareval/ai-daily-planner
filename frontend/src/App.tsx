import { format, formatISO } from "date-fns";
import { nanoid } from "nanoid";
import { useEffect, useState } from "react";
import type { ChatMessage, DailyBrief, Goal } from "./types";
import { AvailabilityCard } from "./components/AvailabilityCard";
import { BriefPreview } from "./components/BriefPreview";
import { ChatPanel } from "./components/ChatPanel";
import { GoalBanner } from "./components/GoalBanner";
import { OnboardingForm } from "./components/OnboardingForm";
import { PdfUploadCard } from "./components/PdfUploadCard";
import { TaskComposer } from "./components/TaskComposer";
import { TaskList } from "./components/TaskList";
import { usePlannerStore } from "./hooks/usePlannerState";

type Tab = "daily" | "settings";
type GoalFormValues = Goal & { timezone?: string; fullName?: string };

const App = () => {
  const today = formatISO(new Date(), { representation: "date" });
  const [activeTab, setActiveTab] = useState<Tab>("daily");
  const todayLabel = format(new Date(), "MMMM d, yyyy");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const {
    goal,
    tasks,
    availability,
    brief,
    fullName,
    timezone,
    bootstrapDemo,
    updateGoal,
    updateProfile,
    addTask,
    toggleTaskStatus,
    updateAvailability,
    generateBrief,
    reorderTasks,
  } = usePlannerStore();

  useEffect(() => {
    bootstrapDemo();
  }, [bootstrapDemo]);

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
          onMockParse={(generated) => {
            for (let index = 0; index < generated; index += 1) {
              addTask({
                title: `Parsed task ${index + 1}`,
                scheduledDate: today,
              });
            }
          }}
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
