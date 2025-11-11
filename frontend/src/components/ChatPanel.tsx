import { format } from "date-fns";
import type { ChatMessage } from "../types";

type Props = {
  messages: ChatMessage[];
  onSend: (message: string) => void;
  isThinking?: boolean;
};

export const ChatPanel = ({ messages, onSend, isThinking = false }: Props) => {
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const value = (formData.get("message") as string)?.trim();
    if (!value) return;
    onSend(value);
    event.currentTarget.reset();
  };

  return (
    <div className="surface" style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <h3 style={{ marginTop: 0 }}>AI Copilot</h3>
      <p style={{ color: "#475569", marginTop: 0 }}>
        Ask for tactics, brainstorm blockers, or get proactive insight on today’s focus.
      </p>
      <div
        style={{
          flex: 1,
          border: "1px solid #e2e8f0",
          borderRadius: "10px",
          padding: "1rem",
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: "0.75rem",
          background: "#f8fafc",
        }}
      >
        {messages.map((message) => (
          <div
            key={message.id}
            style={{
              alignSelf: message.role === "user" ? "flex-end" : "flex-start",
              background: message.role === "user" ? "#2563eb" : "white",
              color: message.role === "user" ? "white" : "#0f172a",
              padding: "0.65rem 0.85rem",
              borderRadius: "10px",
              maxWidth: "85%",
              boxShadow: "0 4px 12px rgba(15,23,42,0.12)",
            }}
          >
            <p style={{ margin: 0 }}>{message.content}</p>
            <small style={{ opacity: 0.8 }}>{format(new Date(message.timestamp), "p")}</small>
          </div>
        ))}
        {messages.length === 0 && <p style={{ color: "#94a3b8" }}>No chats yet. Click a task or ask for help.</p>}
      </div>
      <form onSubmit={handleSubmit} style={{ marginTop: "1rem", display: "flex", gap: "0.5rem" }}>
        <input
          name="message"
          placeholder="Ask the copilot…"
          style={{
            flex: 1,
            borderRadius: "10px",
            border: "1px solid #cbd5f5",
            padding: "0.75rem",
            fontSize: "1rem",
          }}
        />
        <button
          type="submit"
          style={{
            minWidth: "110px",
            background: "#0f172a",
            color: "white",
            border: "none",
            borderRadius: "10px",
            fontWeight: 600,
            cursor: "pointer",
          }}
          disabled={isThinking}
        >
          {isThinking ? "Thinking…" : "Send"}
        </button>
      </form>
    </div>
  );
};
