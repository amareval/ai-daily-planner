import type { Goal } from "../types";

type Props = {
  goal?: Goal;
  onEdit?: () => void;
};

export const GoalBanner = ({ goal, onEdit }: Props) => (
  <div className="surface" style={{ marginBottom: "1.5rem", borderLeft: "6px solid #2563eb" }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: "1rem" }}>
      <div>
        <p style={{ textTransform: "uppercase", letterSpacing: "0.08em", color: "#94a3b8", margin: 0 }}>Goal</p>
        <h2 style={{ margin: "0.35rem 0 0", fontSize: "1.4rem" }}>{goal?.primaryGoal ?? "Define your mission"}</h2>
        {goal?.secondaryGoals && (
          <p style={{ margin: "0.25rem 0 0", color: "#475569" }}>Secondary: {goal.secondaryGoals}</p>
        )}
        {goal?.industry && (
          <p style={{ margin: "0.25rem 0 0", color: "#475569" }}>Industry: {goal.industry}</p>
        )}
        {goal?.skillsFocus && (
          <p style={{ margin: "0.25rem 0 0", color: "#475569" }}>Skills Focus: {goal.skillsFocus}</p>
        )}
      </div>
      {onEdit && (
        <button
          style={{
            border: "1px solid #cbd5f5",
            background: "white",
            color: "#2563eb",
            borderRadius: "8px",
            padding: "0.4rem 1rem",
            cursor: "pointer",
          }}
          onClick={onEdit}
        >
          Edit
        </button>
      )}
    </div>
  </div>
);
