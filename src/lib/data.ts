import { supabase } from '@/lib/supabase';
import type { Task, Attendance, ActivityLog, Profile, TaskStatus, TaskPriority, AttendanceStatus, UserRole } from '@/types';

// ---- Tasks ----

export async function fetchTasks(): Promise<Task[]> {
  const { data, error } = await supabase
    .from('tasks')
    .select('*, assignee:profiles!tasks_assignee_id_fkey(*), creator:profiles!tasks_created_by_fkey(*)')
    .order('sort_order', { ascending: true });

  if (error) throw error;
  return (data ?? []) as unknown as Task[];
}

export async function createTask(input: {
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  category?: string;
  assignee_id?: string | null;
  due_date?: string | null;
  created_by?: string | null;
}): Promise<Task> {
  const { data, error } = await supabase
    .from('tasks')
    .insert({
      title: input.title,
      description: input.description ?? '',
      status: input.status ?? 'todo',
      priority: input.priority ?? 'medium',
      category: input.category ?? 'General',
      assignee_id: input.assignee_id ?? null,
      created_by: input.created_by ?? null,
      due_date: input.due_date ?? null,
    })
    .select('*, assignee:profiles!tasks_assignee_id_fkey(*), creator:profiles!tasks_created_by_fkey(*)')
    .single();

  if (error) throw error;
  return data as unknown as Task;
}

export async function updateTask(id: string, updates: Partial<Task>): Promise<Task> {
  const { data, error } = await supabase
    .from('tasks')
    .update({
      title: updates.title,
      description: updates.description,
      status: updates.status,
      priority: updates.priority,
      category: updates.category,
      assignee_id: updates.assignee_id,
      due_date: updates.due_date,
    })
    .eq('id', id)
    .select('*, assignee:profiles!tasks_assignee_id_fkey(*), creator:profiles!tasks_created_by_fkey(*)')
    .single();

  if (error) throw error;
  return data as unknown as Task;
}

export async function updateTaskStatus(id: string, status: TaskStatus): Promise<void> {
  const { error } = await supabase.from('tasks').update({ status }).eq('id', id);
  if (error) throw error;
}

export async function deleteTask(id: string): Promise<void> {
  const { error } = await supabase.from('tasks').delete().eq('id', id);
  if (error) throw error;
}

// ---- Profiles ----

export async function fetchProfiles(): Promise<Profile[]> {
  const { data, error } = await supabase.from('profiles').select('*').order('display_name');
  if (error) throw error;
  return (data ?? []) as Profile[];
}

export async function updateProfileRole(id: string, role: UserRole): Promise<void> {
  const { error } = await supabase.from('profiles').update({ role }).eq('id', id);
  if (error) throw error;
}

// ---- Attendance ----

export async function fetchAttendance(startDate?: string, endDate?: string): Promise<Attendance[]> {
  let query = supabase
    .from('attendance')
    .select('*, profile:profiles!attendance_user_id_fkey(*)')
    .order('date', { ascending: false });

  if (startDate) query = query.gte('date', startDate);
  if (endDate) query = query.lte('date', endDate);

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as unknown as Attendance[];
}

export async function upsertAttendance(input: {
  user_id: string;
  date: string;
  status: AttendanceStatus;
  check_in?: string | null;
  check_out?: string | null;
  notes?: string;
}): Promise<void> {
  const { error } = await supabase.from('attendance').upsert(
    {
      user_id: input.user_id,
      date: input.date,
      status: input.status,
      check_in: input.check_in ?? null,
      check_out: input.check_out ?? null,
      notes: input.notes ?? '',
    },
    { onConflict: 'user_id,date' }
  );
  if (error) throw error;
}

// ---- Activity Logs ----

export async function fetchActivityLogs(limit = 50): Promise<ActivityLog[]> {
  const { data, error } = await supabase
    .from('activity_logs')
    .select('*, profile:profiles!activity_logs_user_id_fkey(*)')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data ?? []) as unknown as ActivityLog[];
}

export async function logActivity(input: {
  user_id?: string | null;
  action: string;
  entity_type?: string;
  entity_id?: string | null;
  details?: string;
}): Promise<void> {
  const { error } = await supabase.from('activity_logs').insert({
    user_id: input.user_id ?? null,
    action: input.action,
    entity_type: input.entity_type ?? 'task',
    entity_id: input.entity_id ?? null,
    details: input.details ?? '',
  });
  if (error) console.error('Failed to log activity:', error);
}
