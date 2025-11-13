import { useRef } from "react";

type Props = {
  statusMessage: string;
  statusVariant: "neutral" | "success" | "error";
  onUpload: (file: File) => void;
};

export const PdfUploadCard = ({ statusMessage, statusVariant, onUpload }: Props) => {
  const inputRef = useRef<HTMLInputElement | null>(null);

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
            background: statusVariant === "success" ? "#16a34a" : statusVariant === "error" ? "#dc2626" : "#cbd5f5",
            color: statusVariant === "success" || statusVariant === "error" ? "white" : "#0f172a",
            fontWeight: 600,
            transition: "background 0.2s ease",
          }}
        >
          {statusMessage}
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
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) {
            onUpload(file);
            event.target.value = "";
          }
        }}
      />
    </div>
  );
};
