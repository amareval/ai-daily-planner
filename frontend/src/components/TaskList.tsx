import {
  closestCenter,
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  SortableContext,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useState, type CSSProperties } from "react";
import type { Task } from "../types";

type Props = {
  tasks: Task[];
  onToggle: (taskId: string) => void;
  onReorder: (orderedIds: string[]) => void;
  onAsk?: (task: Task) => void;
  title?: string;
  dateFilter?: string;
  collapseAfter?: number;
};

export const TaskList = ({
  tasks,
  onToggle,
  onReorder,
  onAsk,
  title = "Today's Tasks",
  dateFilter,
  collapseAfter = 8,
}: Props) => {
  const [expanded, setExpanded] = useState(false);
  const filtered = dateFilter ? tasks.filter((task) => task.scheduledDate === dateFilter) : tasks;
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const filteredIds = filtered.map((task) => task.id);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = filteredIds.indexOf(active.id as string);
    const newIndex = filteredIds.indexOf(over.id as string);
    if (oldIndex === -1 || newIndex === -1) return;

    const reorderedFiltered = arrayMove(filteredIds, oldIndex, newIndex);
    const filteredSet = new Set(filteredIds);
    let reorderedIndex = 0;
    const mergedOrder = tasks.map((task) =>
      filteredSet.has(task.id) ? reorderedFiltered[reorderedIndex++] : task.id,
    );
    onReorder(mergedOrder);
  };

  const visibleTasks =
    !expanded && filtered.length > collapseAfter ? filtered.slice(0, collapseAfter) : filtered;
  const hiddenCount = Math.max(filtered.length - collapseAfter, 0);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <h3 style={{ marginTop: 0 }}>{title}</h3>
        <p style={{ color: "#94a3b8" }}>{filtered.length} items</p>
      </div>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={visibleTasks.map((task) => task.id)} strategy={rectSortingStrategy}>
          <ul
            style={{
              listStyle: "none",
              padding: 0,
              margin: 0,
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: "0.75rem",
            }}
          >
            {visibleTasks.map((task) => (
              <SortableTaskCard key={task.id} task={task} onToggle={onToggle} onAsk={onAsk} />
            ))}
          </ul>
        </SortableContext>
      </DndContext>
      {visibleTasks.length === 0 && <p style={{ color: "#94a3b8" }}>No tasks scheduled for this day.</p>}
      {!expanded && hiddenCount > 0 && (
        <button style={toggleButton} onClick={() => setExpanded(true)}>
          Show all tasks ({hiddenCount} more)
        </button>
      )}
      {expanded && filtered.length > collapseAfter && (
        <button style={toggleButton} onClick={() => setExpanded(false)}>
          Show fewer tasks
        </button>
      )}
    </div>
  );
};

const toggleButton: CSSProperties = {
  marginTop: "0.75rem",
  background: "transparent",
  border: "none",
  color: "#2563eb",
  cursor: "pointer",
  fontWeight: 600,
};

const cardStyle: CSSProperties = {
  display: "flex",
  gap: "0.75rem",
  padding: "0.85rem 1rem",
  borderRadius: "8px",
  border: "1px solid #e2e8f0",
  background: "white",
  minHeight: "82px",
};

type CardProps = {
  task: Task;
  onToggle: (taskId: string) => void;
  onAsk?: (task: Task) => void;
};

const SortableTaskCard = ({ task, onToggle, onAsk }: CardProps) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });
  const style: CSSProperties = {
    ...cardStyle,
    background: task.source === "pdf" ? "#fefce8" : "white",
    boxShadow: isDragging ? "0 10px 20px rgba(15,23,42,0.15)" : "none",
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.8 : 1,
  };

  return (
    <li ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <div style={{ display: "flex", flexDirection: "column", flex: 1, gap: "0.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.75rem" }}>
          <div style={{ display: "flex", gap: "0.6rem" }}>
            <input type="checkbox" checked={task.status === "complete"} onChange={() => onToggle(task.id)} />
            <div>
              <p
                style={{
                  margin: 0,
                  fontWeight: 600,
                  textDecoration: task.status === "complete" ? "line-through" : "none",
                }}
              >
                {task.title}
              </p>
              <small style={{ color: "#475569" }}>Created: {task.scheduledDate} &bull; Source: {task.source}</small>
            </div>
          </div>
          {onAsk && (
            <button style={askButton} type="button" onClick={() => onAsk(task)}>
              Ask AI
            </button>
          )}
        </div>
      </div>
      <span style={{ cursor: "grab", color: "#94a3b8", fontSize: "1.25rem" }}>⋮⋮</span>
    </li>
  );
};

const askButton: CSSProperties = {
  background: "#e0f2fe",
  color: "#0369a1",
  border: "none",
  borderRadius: "999px",
  padding: "0.25rem 0.85rem",
  fontWeight: 600,
  cursor: "pointer",
  fontSize: "0.85rem",
};
