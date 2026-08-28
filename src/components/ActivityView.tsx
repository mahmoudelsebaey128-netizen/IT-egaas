import { useEffect, useState } from 'react';
import { Header } from '@/components/Sidebar';
import { Avatar } from '@/components/Avatar';
import { timeAgo } from '@/lib/utils';
import { fetchActivityLogs } from '@/lib/data';
import type { ActivityLog } from '@/types';
import { Loader2, Activity as ActivityIcon } from 'lucide-react';

export function ActivityView() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActivityLogs(100)
      .then(setLogs)
      .catch((err) => console.error('Failed to load activity logs:', err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <Header title="Activity Log" subtitle="Audit trail of all team actions" />
      <div className="p-4 lg:p-6">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
          </div>
        ) : logs.length === 0 ? (
          <div className="card p-12 text-center">
            <ActivityIcon className="w-10 h-10 text-secondary-300 dark:text-secondary-600 mx-auto mb-3" />
            <p className="text-sm text-secondary-500">No activity yet</p>
          </div>
        ) : (
          <div className="card p-4">
            <div className="space-y-1">
              {logs.map((log, idx) => (
                <div
                  key={log.id}
                  className="flex items-start gap-3 py-2.5 animate-fade-in"
                >
                  <div className="relative flex flex-col items-center">
                    <Avatar profile={log.profile ?? null} size="sm" />
                    {idx < logs.length - 1 && (
                      <div className="w-px h-full bg-secondary-200 dark:bg-secondary-700 absolute top-10 left-1/2 -translate-x-1/2" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0 pb-2">
                    <p className="text-sm">
                      <span className="font-medium">{log.profile?.display_name ?? 'System'}</span>{' '}
                      <span className="text-secondary-500 dark:text-secondary-400">{log.details || log.action}</span>
                    </p>
                    <p className="text-xs text-secondary-400 mt-0.5">{timeAgo(log.created_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
