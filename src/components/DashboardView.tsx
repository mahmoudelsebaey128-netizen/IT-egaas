import { useEffect, useState } from 'react';
import { Header } from '@/components/Sidebar';
import { Avatar } from '@/components/Avatar';
import { priorityBadgeClasses, statusBadgeClasses, roleBadgeClasses, timeAgo } from '@/lib/utils';
import { ROLE_LABELS } from '@/types';
import { fetchTasks, fetchActivityLogs, fetchProfiles } from '@/lib/data';
import { TASK_STATUSES, TASK_PRIORITIES, type Task, type ActivityLog, type Profile } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { KanbanSquare, CheckCircle2, Clock, AlertTriangle, TrendingUp } from 'lucide-react';

interface DashboardProps {
  profiles: Profile[];
}

export function DashboardView({ profiles }: DashboardProps) {
  const { profile: currentUser } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetchTasks(), fetchActivityLogs(8)])
      .then(([t, l]) => {
        setTasks(t);
        setLogs(l);
      })
      .catch((err) => console.error('Failed to load dashboard:', err))
      .finally(() => setLoading(false));
  }, []);

  const stats = {
    total: tasks.length,
    done: tasks.filter((t) => t.status === 'done').length,
    inProgress: tasks.filter((t) => t.status === 'in_progress').length,
    urgent: tasks.filter((t) => t.priority === 'urgent' && t.status !== 'done').length,
  };

  const completionRate = stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0;

  const statCards = [
    { label: 'Total Tasks', value: stats.total, icon: KanbanSquare, color: 'primary' },
    { label: 'Completed', value: stats.done, icon: CheckCircle2, color: 'success' },
    { label: 'In Progress', value: stats.inProgress, icon: Clock, color: 'warning' },
    { label: 'Urgent Open', value: stats.urgent, icon: AlertTriangle, color: 'error' },
  ];

  if (loading) {
    return (
      <div>
        <Header title="Dashboard" subtitle={`Welcome back, ${currentUser?.display_name ?? ''}`} />
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div>
      <Header title="Dashboard" subtitle={`Welcome back, ${currentUser?.display_name ?? ''}`} />
      <div className="p-4 lg:p-6 space-y-6">
        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="card p-5 animate-fade-in">
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-10 h-10 rounded-lg bg-${stat.color}-100 dark:bg-${stat.color}-900/30 flex items-center justify-center`}>
                    <Icon className={`w-5 h-5 text-${stat.color}-600 dark:text-${stat.color}-400`} />
                  </div>
                </div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-sm text-secondary-500 dark:text-secondary-400">{stat.label}</p>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Completion progress */}
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-4 h-4 text-primary-500" />
              <h3 className="text-sm font-semibold">Completion Rate</h3>
            </div>
            <div className="flex items-center justify-center mb-4">
              <div className="relative w-32 h-32">
                <svg className="w-32 h-32 -rotate-90" viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r="52" fill="none" strokeWidth="10" className="stroke-secondary-200 dark:stroke-secondary-800" />
                  <circle
                    cx="60" cy="60" r="52" fill="none" strokeWidth="10"
                    stroke="currentColor"
                    className="text-primary-500"
                    strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 52}`}
                    strokeDashoffset={`${2 * Math.PI * 52 * (1 - completionRate / 100)}`}
                    style={{ transition: 'stroke-dashoffset 0.5s ease' }}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl font-bold">{completionRate}%</span>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              {TASK_STATUSES.map((s) => {
                const count = tasks.filter((t) => t.status === s.value).length;
                return (
                  <div key={s.value} className="flex items-center justify-between text-sm">
                    <span className="text-secondary-500 dark:text-secondary-400">{s.label}</span>
                    <span className="font-medium">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Priority breakdown */}
          <div className="card p-5">
            <h3 className="text-sm font-semibold mb-4">Priority Breakdown</h3>
            <div className="space-y-3">
              {TASK_PRIORITIES.map((p) => {
                const count = tasks.filter((t) => t.priority === p.value).length;
                const pct = stats.total > 0 ? (count / stats.total) * 100 : 0;
                return (
                  <div key={p.value}>
                    <div className="flex items-center justify-between mb-1">
                      <span className={`badge ${priorityBadgeClasses[p.value]}`}>{p.label}</span>
                      <span className="text-sm font-medium">{count}</span>
                    </div>
                    <div className="h-1.5 bg-secondary-100 dark:bg-secondary-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full bg-${p.color}-500 rounded-full transition-all duration-500`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Team overview */}
          <div className="card p-5">
            <h3 className="text-sm font-semibold mb-4">Team Overview</h3>
            <div className="space-y-3">
              {profiles.slice(0, 6).map((p) => {
                const userTasks = tasks.filter((t) => t.assignee_id === p.id);
                const userDone = userTasks.filter((t) => t.status === 'done').length;
                return (
                  <div key={p.id} className="flex items-center gap-3">
                    <Avatar profile={p} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{p.display_name}</p>
                      <span className={`badge ${roleBadgeClasses[p.role]} text-[10px]`}>
                        {ROLE_LABELS[p.role]}
                      </span>
                    </div>
                    <span className="text-xs text-secondary-400">
                      {userDone}/{userTasks.length}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Recent activity */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold mb-4">Recent Activity</h3>
          {logs.length === 0 ? (
            <p className="text-sm text-secondary-400">No recent activity</p>
          ) : (
            <div className="space-y-3">
              {logs.map((log) => (
                <div key={log.id} className="flex items-center gap-3">
                  <Avatar profile={log.profile ?? null} size="xs" />
                  <p className="text-sm flex-1">
                    <span className="font-medium">{log.profile?.display_name ?? 'System'}</span>{' '}
                    <span className="text-secondary-500 dark:text-secondary-400">{log.details || log.action}</span>
                  </p>
                  <span className="text-xs text-secondary-400">{timeAgo(log.created_at)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
