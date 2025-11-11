import type { DailyBrief, LearningSuggestion } from "../types";

type Props = {
  brief?: DailyBrief;
  onGenerate: () => void;
  onAddSuggestion: (suggestion: LearningSuggestion) => void;
};

export const BriefPreview = ({ brief, onGenerate, onAddSuggestion }: Props) => (
  <div className="surface">
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <div>
        <h3 style={{ margin: "0 0 0.25rem" }}>Recommended To-Do's</h3>
        <p style={{ margin: 0, color: "#475569" }}>
          These are recommended to-do's to help achieve your goal that will refresh each day based on new materials
          available online.
        </p>
      </div>
      <button style={primaryButton} onClick={onGenerate}>
        Refresh Recommendations
      </button>
    </div>
    {brief ? (
      <div>
        <p style={{ color: "#475569" }}>
          Date: <strong>{brief.date}</strong> • Total focused minutes: {brief.totalTaskMinutes}
        </p>
        <h4>Learning Opportunities</h4>
        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
          {brief.learningSuggestions.map((suggestion) => (
            <div key={suggestion.title} className="surface" style={{ flex: "1 1 220px", border: "1px solid #e2e8f0" }}>
              <p style={{ margin: "0 0 0.35rem", fontWeight: 600 }}>{suggestion.title}</p>
              <p style={{ margin: 0, color: "#475569" }}>{suggestion.description}</p>
              <small style={{ color: "#94a3b8", display: "block" }}>
                {suggestion.timeMinutes} min • {suggestion.category}
              </small>
              <button
                style={secondaryButton}
                onClick={() => onAddSuggestion(suggestion)}
                type="button"
              >
                Add to To-Do's
              </button>
            </div>
          ))}
        </div>
      </div>
    ) : (
      <p style={{ color: "#94a3b8" }}>No brief generated yet. Hit “Generate Preview” to see the summary.</p>
    )}
  </div>
);

const primaryButton: React.CSSProperties = {
  background: "#0f172a",
  color: "white",
  border: "none",
  borderRadius: "8px",
  padding: "0.65rem 1.25rem",
  cursor: "pointer",
};

const secondaryButton: React.CSSProperties = {
  marginTop: "0.5rem",
  border: "1px solid #2563eb",
  background: "white",
  color: "#2563eb",
  borderRadius: "6px",
  padding: "0.35rem 0.75rem",
  cursor: "pointer",
  fontSize: "0.9rem",
};
