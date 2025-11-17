import { formatISO } from "date-fns";
import { useEffect, useState } from "react";

type Props = {
  onAdd: (input: { title: string; scheduledDate: string }) => void;
  selectedDate?: string;
};

export const TaskComposer = ({ onAdd, selectedDate }: Props) => {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState<string>(selectedDate ?? formatISO(new Date(), { representation: "date" }));

  useEffect(() => {
    if (selectedDate) {
      setDate(selectedDate);
    }
  }, [selectedDate]);

  const handleAdd = () => {
    if (!title.trim()) return;
    onAdd({ title: title.trim(), scheduledDate: date });
    setTitle("");
  };

  return (
    <div style={{ marginTop: "1rem" }}>
      <h4 style={{ margin: "0 0 0.75rem" }}>Quick Add Task</h4>
      <div className="flex-row">
        <input
          style={inputStyle}
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Mock interview, outreach, etc."
        />
        <input style={inputStyle} type="date" value={date} onChange={(event) => setDate(event.target.value)} />
        <button style={primaryButton} onClick={handleAdd}>
          Add
        </button>
      </div>
    </div>
  );
};

const inputStyle: React.CSSProperties = {
  flex: 1,
  minWidth: 160,
  borderRadius: "8px",
  border: "1px solid #cbd5f5",
  padding: "0.75rem",
  fontSize: "1rem",
};

const primaryButton: React.CSSProperties = {
  background: "#0f172a",
  color: "white",
  border: "none",
  borderRadius: "8px",
  padding: "0.75rem 1.4rem",
  cursor: "pointer",
};
