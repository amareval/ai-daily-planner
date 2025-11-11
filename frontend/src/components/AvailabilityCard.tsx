import { useState } from "react";

type Props = {
  defaultMinutes?: number;
  onSave: (minutes: number) => void;
};

export const AvailabilityCard = ({ defaultMinutes = 120, onSave }: Props) => {
  const [minutes, setMinutes] = useState(defaultMinutes);

  return (
    <div className="surface">
      <h3 style={{ marginTop: 0 }}>Available Learning Time</h3>
      <p style={{ color: "#475569" }}>Tell the planner how much extra capacity you have tomorrow.</p>
      <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
        <input
          type="number"
          min={30}
          max={600}
          value={minutes}
          onChange={(event) => setMinutes(Number(event.target.value))}
          style={{
            flex: "0 0 140px",
            padding: "0.75rem",
            borderRadius: "8px",
            border: "1px solid #cbd5f5",
            fontSize: "1rem",
          }}
        />
        <button
          onClick={() => onSave(minutes)}
          style={{
            background: "#2563eb",
            color: "white",
            border: "none",
            borderRadius: "8px",
            padding: "0.75rem 1.5rem",
            cursor: "pointer",
          }}
        >
          Save
        </button>
      </div>
    </div>
  );
};
