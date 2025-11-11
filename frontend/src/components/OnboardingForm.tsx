import { useForm } from "react-hook-form";
import type { Goal } from "../types";

type Props = {
  defaultValues?: Goal & { timezone?: string; fullName?: string };
  onSubmit: (values: Goal & { timezone?: string; fullName?: string }) => void;
};

export const OnboardingForm = ({ defaultValues, onSubmit }: Props) => {
  const { handleSubmit, register } = useForm<Goal & { timezone?: string; fullName?: string }>({
    defaultValues,
  });

  return (
    <form className="surface" onSubmit={handleSubmit(onSubmit)}>
      <h3 style={{ marginTop: 0 }}>Settings for Goals</h3>
      <p style={{ color: "#475569", marginTop: 0 }}>
        Define or tweak the mission so every recommendation ladders up to where you want to land.
      </p>
      <div className="flex-row">
        <label style={fieldStyle}>
          <span>Primary Goal</span>
          <textarea {...register("primaryGoal", { required: true })} rows={3} placeholder="Launch a portfolio project..." />
        </label>
        <label style={fieldStyle}>
          <span>Secondary Goals</span>
          <textarea {...register("secondaryGoals")} rows={3} placeholder="Ship weekly updates, meet mentor..." />
        </label>
        <label style={fieldStyle}>
          <span>Industry</span>
          <input {...register("industry")} placeholder="AI Productivity, Fintech..." />
        </label>
      </div>
      <div className="flex-row">
        <label style={fieldStyle}>
          <span>Skills Focus</span>
          <textarea {...register("skillsFocus")} rows={2} placeholder="Storytelling, whiteboarding..." />
        </label>
        <label style={fieldStyle}>
          <span>Default Daily Learning Minutes</span>
          <input type="number" {...register("defaultLearningMinutes", { valueAsNumber: true })} min={30} max={360} />
        </label>
      </div>
      <div className="flex-row">
        <label style={fieldStyle}>
          <span>Full Name</span>
          <input {...register("fullName")} placeholder="Alex Candidate" />
        </label>
        <label style={fieldStyle}>
          <span>Timezone</span>
          <input {...register("timezone")} placeholder="America/Los_Angeles" />
        </label>
      </div>
      <button type="submit" style={primaryButton}>
        Save Evening Capture
      </button>
    </form>
  );
};

const fieldStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "0.5rem",
  flex: 1,
  minWidth: 220,
};

const primaryButton: React.CSSProperties = {
  marginTop: "1rem",
  background: "#2563eb",
  color: "white",
  border: "none",
  borderRadius: "10px",
  padding: "0.9rem 1.6rem",
  fontSize: "1rem",
  cursor: "pointer",
};
