export type UserRole = 'admin' | 'team_leader' | 'team_member';

export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'remote' | 'leave';

export interface Profile {
  id: string;
  user_id: string | null;
  email: string;
  display_name: string;
  role: UserRole;
  avatar_url: string | null;
  created_at: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  category: string;
  assignee_id: string | null;
  created_by: string | null;
  due_date: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
  assignee?: Profile | null;
  creator?: Profile | null;
}

export interface Attendance {
  id: string;
  user_id: string;
  date: string;
  status: AttendanceStatus;
  check_in: string | null;
  check_out: string | null;
  notes: string;
  created_at: string;
  profile?: Profile | null;
}

export interface ActivityLog {
  id: string;
  user_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  details: string;
  created_at: string;
  profile?: Profile | null;
}

export const TASK_STATUSES: { value: TaskStatus; label: string; color: string }[] = [
  { value: 'todo', label: 'To Do', color: 'secondary' },
  { value: 'in_progress', label: 'In Progress', color: 'primary' },
  { value: 'review', label: 'Review', color: 'warning' },
  { value: 'done', label: 'Done', color: 'success' },
];

export const TASK_PRIORITIES: { value: TaskPriority; label: string; color: string }[] = [
  { value: 'low', label: 'Low', color: 'secondary' },
  { value: 'medium', label: 'Medium', color: 'primary' },
  { value: 'high', label: 'High', color: 'warning' },
  { value: 'urgent', label: 'Urgent', color: 'error' },
];

export const ATTENDANCE_STATUSES: { value: AttendanceStatus; label: string; color: string }[] = [
  { value: 'present', label: 'Present', color: 'success' },
  { value: 'absent', label: 'Absent', color: 'error' },
  { value: 'late', label: 'Late', color: 'warning' },
  { value: 'remote', label: 'Remote', color: 'primary' },
  { value: 'leave', label: 'On Leave', color: 'secondary' },
];

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Admin',
  team_leader: 'Team Leader',
  team_member: 'Team Member',
};
