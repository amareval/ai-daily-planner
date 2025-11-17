import type { RecommendationTodo, RecommendationsResponse } from "../types";

type Props = {
  recommendations?: RecommendationsResponse | null;
  onGenerate: () => void;
  onAddSuggestion: (suggestion: RecommendationTodo) => void;
  isLoading?: boolean;
  statusMessage?: string | null;
};

export const BriefPreview = ({
  recommendations,
  onGenerate,
  onAddSuggestion,
  isLoading,
  statusMessage,
}: Props) => (
  <div className="surface">
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <div>
        <h3 style={{ margin: "0 0 0.25rem" }}>Recommended To-Do's</h3>
        <p style={{ margin: 0, color: "#475569" }}>
          These recommended to-do's lean on your goal, skills focus, and refreshed materials—tap refresh whenever you
          need new inspiration.
        </p>
      </div>
      <button style={primaryButton} onClick={onGenerate} disabled={isLoading} type="button">
        {isLoading ? "Refreshing…" : "Refresh Recommendations"}
      </button>
    </div>
    {statusMessage && (
      <small style={{ color: "#dc2626", display: "block", margin: "0.25rem 0" }}>{statusMessage}</small>
    )}
    {recommendations && recommendations.recommendedTodos.length > 0 ? (
      <div>
        <p style={{ color: "#475569" }}>
          Goal: <strong>{recommendations.goalStatement}</strong> • Date:{" "}
          <strong>{recommendations.scheduledDate}</strong>
        </p>
        <h4>Fresh ideas</h4>
        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
          {recommendations.recommendedTodos.map((suggestion) => (
            <div
              key={`${suggestion.title}-${suggestion.category}`}
              className="surface"
              style={{ flex: "1 1 220px", border: "1px solid #e2e8f0" }}
            >
              <p style={{ margin: "0 0 0.35rem", fontWeight: 600 }}>{suggestion.title}</p>
              <p style={{ margin: 0, color: "#475569" }}>{suggestion.description}</p>
              <small style={{ color: "#94a3b8", display: "block" }}>
                {suggestion.estimatedMinutes} min • {suggestion.category}
              </small>
              {suggestion.resourceUrl && (
                <a
                  href={suggestion.resourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: "block",
                    fontSize: "0.9rem",
                    color: "#2563eb",
                    marginTop: "0.25rem",
                  }}
                >
                  Open resource
                </a>
              )}
              <button style={secondaryButton} onClick={() => onAddSuggestion(suggestion)} type="button">
                Add to To-Do's
              </button>
            </div>
          ))}
        </div>
      </div>
    ) : (
      <p style={{ color: "#94a3b8" }}>No recommendations yet. Hit “Refresh Recommendations” to pull the latest ideas.</p>
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
