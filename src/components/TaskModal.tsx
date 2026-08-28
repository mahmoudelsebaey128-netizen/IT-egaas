import { useState, useEffect } from 'react';
import { Modal } from '@/components/Modal';
import { Avatar } from '@/components/Avatar';
import { priorityBadgeClasses, statusBadgeClasses } from '@/lib/utils';
import { TASK_PRIORITIES, TASK_STATUSES, type Profile, type Task, type TaskPriority, type TaskStatus } from '@/types';
import { Loader2 } from 'lucide-react';

interface TaskModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: TaskModalData) => Promise<void>;
  profiles: Profile[];
  task: Task | null;
  currentUserId: string | null;
}

export interface TaskModalData {
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  category: string;
  assignee_id: string | null;
  due_date: string | null;
}

export function TaskModal({ open, onClose, onSave, profiles, task, currentUserId }: TaskModalProps) {
  const [data, setData] = useState<TaskModalData>({
    title: '',
    description: '',
    status: 'todo',
    priority: 'medium',
    category: 'General',
    assignee_id: null,
    due_date: null,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (task) {
      setData({
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        category: task.category,
        assignee_id: task.assignee_id,
        due_date: task.due_date,
      });
    } else {
      setData({
        title: '',
        description: '',
        status: 'todo',
        priority: 'medium',
        category: 'General',
        assignee_id: null,
        due_date: null,
      });
    }
  }, [task, open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (data.title.trim().length < 2) return;
    setSaving(true);
    await onSave(data);
    setSaving(false);
  }

  return (
    <Modal open={open} onClose={onClose} title={task ? 'Edit Task' : 'Create Task'} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1.5">Title</label>
          <input
            type="text"
            value={data.title}
            onChange={(e) => setData({ ...data, title: e.target.value })}
            placeholder="Task title..."
            className="input"
            autoFocus
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">Description</label>
          <textarea
            value={data.description}
            onChange={(e) => setData({ ...data, description: e.target.value })}
            placeholder="Add details..."
            rows={3}
            className="input resize-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Status</label>
            <select
              value={data.status}
              onChange={(e) => setData({ ...data, status: e.target.value as TaskStatus })}
              className="input"
            >
              {TASK_STATUSES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Priority</label>
            <select
              value={data.priority}
              onChange={(e) => setData({ ...data, priority: e.target.value as TaskPriority })}
              className="input"
            >
              {TASK_PRIORITIES.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Category</label>
            <input
              type="text"
              value={data.category}
              onChange={(e) => setData({ ...data, category: e.target.value })}
              placeholder="e.g. Frontend, Backend, Design..."
              className="input"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Due Date</label>
            <input
              type="date"
              value={data.due_date ?? ''}
              onChange={(e) => setData({ ...data, due_date: e.target.value || null })}
              className="input"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">Assignee</label>
          <div className="flex items-center gap-3">
            <Avatar
              profile={profiles.find((p) => p.id === data.assignee_id) ?? null}
              size="md"
            />
            <select
              value={data.assignee_id ?? ''}
              onChange={(e) => setData({ ...data, assignee_id: e.target.value || null })}
              className="input"
            >
              <option value="">Unassigned</option>
              {profiles.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.display_name} ({p.email})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary">
            Cancel
          </button>
          <button type="submit" disabled={saving} className="btn-primary">
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {task ? 'Save Changes' : 'Create Task'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export function TaskCard({
  task,
  onEdit,
  onDelete,
  onDragStart,
  onDragEnd,
}: {
  task: Task;
  onEdit: () => void;
  onDelete: () => void;
  onDragStart: () => void;
  onDragEnd: () => void;
}) {
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={onEdit}
      className="card p-3 cursor-pointer hover:shadow-md hover:border-primary-300 dark:hover:border-primary-700 transition-all group animate-fade-in"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <span className={`badge ${priorityBadgeClasses[task.priority]}`}>{task.priority}</span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="opacity-0 group-hover:opacity-100 text-secondary-400 hover:text-error-500 transition-all text-xs"
        >
          Delete
        </button>
      </div>
      <h4 className="text-sm font-medium mb-1 line-clamp-2">{task.title}</h4>
      {task.description && (
        <p className="text-xs text-secondary-500 dark:text-secondary-400 line-clamp-2 mb-2">
          {task.description}
        </p>
      )}
      <div className="flex items-center justify-between mt-2">
        <span className="text-xs text-secondary-400">{task.category}</span>
        {task.due_date && (
          <span className="text-xs text-secondary-400">{new Date(task.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
        )}
      </div>
      <div className="flex items-center justify-between mt-2 pt-2 border-t border-secondary-100 dark:border-secondary-800">
        <span className={`badge ${statusBadgeClasses[task.status]}`}>{task.status.replace('_', ' ')}</span>
        <Avatar profile={task.assignee ?? null} size="xs" />
      </div>
    </div>
  );
}
