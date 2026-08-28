import type { TaskPriority, TaskStatus, AttendanceStatus, UserRole } from '@/types';

export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return parts[0].slice(0, 2).toUpperCase();
}

export function formatDate(date: string | null): string {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function formatDateTime(date: string | null): string {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function timeAgo(date: string): string {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return formatDate(date);
}

export function avatarColor(seed: string): string {
  const colors = [
    'bg-primary-500',
    'bg-accent-500',
    'bg-success-500',
    'bg-warning-500',
    'bg-error-500',
    'bg-primary-700',
    'bg-accent-700',
  ];
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

export const priorityBadgeClasses: Record<TaskPriority, string> = {
  low: 'bg-secondary-100 text-secondary-600 dark:bg-secondary-700 dark:text-secondary-300',
  medium: 'bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300',
  high: 'bg-warning-100 text-warning-700 dark:bg-warning-900/40 dark:text-warning-300',
  urgent: 'bg-error-100 text-error-700 dark:bg-error-900/40 dark:text-error-300',
};

export const statusBadgeClasses: Record<TaskStatus, string> = {
  todo: 'bg-secondary-100 text-secondary-600 dark:bg-secondary-700 dark:text-secondary-300',
  in_progress: 'bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300',
  review: 'bg-warning-100 text-warning-700 dark:bg-warning-900/40 dark:text-warning-300',
  done: 'bg-success-100 text-success-700 dark:bg-success-900/40 dark:text-success-300',
};

export const attendanceBadgeClasses: Record<AttendanceStatus, string> = {
  present: 'bg-success-100 text-success-700 dark:bg-success-900/40 dark:text-success-300',
  absent: 'bg-error-100 text-error-700 dark:bg-error-900/40 dark:text-error-300',
  late: 'bg-warning-100 text-warning-700 dark:bg-warning-900/40 dark:text-warning-300',
  remote: 'bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300',
  leave: 'bg-secondary-100 text-secondary-600 dark:bg-secondary-700 dark:text-secondary-300',
};

export const roleBadgeClasses: Record<UserRole, string> = {
  admin: 'bg-error-100 text-error-700 dark:bg-error-900/40 dark:text-error-300',
  team_leader: 'bg-accent-100 text-accent-700 dark:bg-accent-900/40 dark:text-accent-300',
  team_member: 'bg-secondary-100 text-secondary-600 dark:bg-secondary-700 dark:text-secondary-300',
};
