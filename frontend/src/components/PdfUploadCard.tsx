import { useRef, useState } from "react";

type Props = {
  onMockParse: (tasksCreated: number) => void;
};

export const PdfUploadCard = ({ onMockParse }: Props) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [status, setStatus] = useState<string>("No upload yet");
  const [statusColor, setStatusColor] = useState<"neutral" | "success" | "error">("neutral");

  const simulateParse = (file?: File) => {
    if (!file) {
      setStatus("No file selected");
      setStatusColor("error");
      return;
    }
    setStatus(`Parsing ${file.name}...`);
    setStatusColor("neutral");
    setTimeout(() => {
      const generated = Math.floor(Math.random() * 3) + 2;
      setStatus(`Parsed ${generated} tasks from ${file.name}`);
      setStatusColor("success");
      onMockParse(generated);
    }, 800);
  };

  return (
    <div className="surface">
      <h3 style={{ marginTop: 0 }}>Remarkable PDF Upload</h3>
      <p style={{ color: "#475569" }}>Drop in tonight's planning PDF to auto-extract tomorrow's tasks.</p>
      <p style={{ margin: "0.5rem 0 1rem" }}>
        <span
          style={{
            display: "inline-block",
            padding: "0.4rem 0.9rem",
            borderRadius: "999px",
            background: statusColor === "success" ? "#16a34a" : statusColor === "error" ? "#dc2626" : "#cbd5f5",
            color: statusColor === "success" || statusColor === "error" ? "white" : "#0f172a",
            fontWeight: 600,
            transition: "background 0.2s ease",
          }}
        >
          {status}
        </span>
      </p>
      <div
        onClick={() => inputRef.current?.click()}
        style={{
          border: "2px dashed #c7d2fe",
          borderRadius: "12px",
          padding: "2rem",
          textAlign: "center",
          cursor: "pointer",
          background: "#f8fafc",
        }}
      >
        <p style={{ margin: 0, fontWeight: 600 }}>Drag & drop or click to upload</p>
        <p style={{ margin: "0.5rem 0 0", color: "#94a3b8" }}>PDF only • we’ll parse bullet lists into tasks</p>
      </div>
      <input
        type="file"
        accept="application/pdf"
        ref={inputRef}
        style={{ display: "none" }}
        onChange={(event) => simulateParse(event.target.files?.[0])}
      />
    </div>
  );
};
