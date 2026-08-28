import { useState, useEffect, useCallback } from 'react';
import { Header } from '@/components/Sidebar';
import { TaskCard, TaskModal, type TaskModalData } from '@/components/TaskModal';
import { Plus, Loader2 } from 'lucide-react';
import {
  fetchTasks,
  createTask,
  updateTask,
  updateTaskStatus,
  deleteTask,
  logActivity,
} from '@/lib/data';
import { useAuth } from '@/context/AuthContext';
import { TASK_STATUSES, type Task, type Profile, type TaskStatus } from '@/types';

interface BoardProps {
  profiles: Profile[];
}

export function BoardView({ profiles }: BoardProps) {
  const { profile } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<TaskStatus | null>(null);

  const loadTasks = useCallback(async () => {
    try {
      const data = await fetchTasks();
      setTasks(data);
    } catch (err) {
      console.error('Failed to load tasks:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  function handleDragStart(taskId: string) {
    setDraggedTaskId(taskId);
  }

  function handleDragEnd() {
    setDraggedTaskId(null);
    setDragOverColumn(null);
  }

  async function handleDrop(status: TaskStatus) {
    if (!draggedTaskId) return;
    const task = tasks.find((t) => t.id === draggedTaskId);
    if (!task || task.status === status) {
      setDraggedTaskId(null);
      setDragOverColumn(null);
      return;
    }

    setTasks((prev) => prev.map((t) => (t.id === draggedTaskId ? { ...t, status } : t)));

    try {
      await updateTaskStatus(draggedTaskId, status);
      await logActivity({
        user_id: profile?.id ?? null,
        action: 'moved_task',
        entity_type: 'task',
        entity_id: draggedTaskId,
        details: `"${task.title}" moved to ${status.replace('_', ' ')}`,
      });
    } catch (err) {
      console.error('Failed to update task status:', err);
      setTasks((prev) => prev.map((t) => (t.id === draggedTaskId ? { ...t, status: task.status } : t)));
    }

    setDraggedTaskId(null);
    setDragOverColumn(null);
  }

  async function handleSave(data: TaskModalData) {
    try {
      if (editingTask) {
        const updated = await updateTask(editingTask.id, data);
        setTasks((prev) => prev.map((t) => (t.id === editingTask.id ? updated : t)));
        await logActivity({
          user_id: profile?.id ?? null,
          action: 'updated_task',
          entity_type: 'task',
          entity_id: editingTask.id,
          details: `Updated "${data.title}"`,
        });
      } else {
        const created = await createTask({ ...data, created_by: profile?.id ?? null });
        setTasks((prev) => [...prev, created]);
        await logActivity({
          user_id: profile?.id ?? null,
          action: 'created_task',
          entity_type: 'task',
          entity_id: created.id,
          details: `Created "${data.title}"`,
        });
      }
      setModalOpen(false);
      setEditingTask(null);
    } catch (err) {
      console.error('Failed to save task:', err);
    }
  }

  async function handleDelete(taskId: string) {
    const task = tasks.find((t) => t.id === taskId);
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    try {
      await deleteTask(taskId);
      await logActivity({
        user_id: profile?.id ?? null,
        action: 'deleted_task',
        entity_type: 'task',
        entity_id: taskId,
        details: `Deleted "${task?.title ?? ''}"`,
      });
    } catch (err) {
      console.error('Failed to delete task:', err);
      loadTasks();
    }
  }

  function openNewTask() {
    setEditingTask(null);
    setModalOpen(true);
  }

  function openEditTask(task: Task) {
    setEditingTask(task);
    setModalOpen(true);
  }

  if (loading) {
    return (
      <div>
        <Header title="Kanban Board" subtitle="Track and manage your team's tasks" />
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
        </div>
      </div>
    );
  }

  return (
    <div>
      <Header title="Kanban Board" subtitle="Track and manage your team's tasks" />
      <div className="p-4 lg:p-6">
        <div className="flex items-center justify-between mb-5">
          <p className="text-sm text-secondary-500 dark:text-secondary-400">
            {tasks.length} task{tasks.length !== 1 ? 's' : ''} total
          </p>
          <button onClick={openNewTask} className="btn-primary">
            <Plus className="w-4 h-4" />
            New Task
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {TASK_STATUSES.map((col) => {
            const colTasks = tasks.filter((t) => t.status === col.value);
            return (
              <div
                key={col.value}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOverColumn(col.value);
                }}
                onDragLeave={() => setDragOverColumn(null)}
                onDrop={() => handleDrop(col.value)}
                className={`rounded-xl border-2 border-dashed transition-colors p-3 ${
                  dragOverColumn === col.value
                    ? 'border-primary-400 bg-primary-50/50 dark:bg-primary-900/10'
                    : 'border-transparent bg-secondary-100/50 dark:bg-secondary-800/30'
                }`}
              >
                <div className="flex items-center justify-between mb-3 px-1">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full bg-${col.color}-500`} />
                    <h3 className="text-sm font-semibold">{col.label}</h3>
                  </div>
                  <span className="text-xs text-secondary-400 bg-secondary-200 dark:bg-secondary-700 rounded-full px-2 py-0.5">
                    {colTasks.length}
                  </span>
                </div>
                <div className="space-y-2 min-h-[100px]">
                  {colTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onEdit={() => openEditTask(task)}
                      onDelete={() => handleDelete(task.id)}
                      onDragStart={() => handleDragStart(task.id)}
                      onDragEnd={handleDragEnd}
                    />
                  ))}
                  {colTasks.length === 0 && (
                    <div className="text-center py-8 text-xs text-secondary-400">
                      Drop tasks here
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <TaskModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingTask(null);
        }}
        onSave={handleSave}
        profiles={profiles}
        task={editingTask}
        currentUserId={profile?.id ?? null}
      />
    </div>
  );
}
