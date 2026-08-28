import { useEffect, useState } from 'react';
import { Header } from '@/components/Sidebar';
import { Avatar } from '@/components/Avatar';
import { attendanceBadgeClasses, formatDate } from '@/lib/utils';
import { ATTENDANCE_STATUSES } from '@/types';
import { fetchAttendance, upsertAttendance, logActivity } from '@/lib/data';
import { useAuth } from '@/context/AuthContext';
import type { Attendance, Profile, AttendanceStatus } from '@/types';
import { Loader2, CalendarCheck } from 'lucide-react';

interface AttendanceProps {
  profiles: Profile[];
}

export function AttendanceView({ profiles }: AttendanceProps) {
  const { profile: currentUser } = useAuth();
  const [records, setRecords] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    fetchAttendance(selectedDate, selectedDate)
      .then(setRecords)
      .catch((err) => console.error('Failed to load attendance:', err))
      .finally(() => setLoading(false));
  }, [selectedDate]);

  const canManage = currentUser?.role === 'admin' || currentUser?.role === 'team_leader';

  async function handleStatusChange(userId: string, status: AttendanceStatus) {
    try {
      await upsertAttendance({
        user_id: userId,
        date: selectedDate,
        status,
        check_in: status === 'present' || status === 'late' ? new Date().toISOString() : null,
      });
      await logActivity({
        user_id: currentUser?.id ?? null,
        action: 'updated_attendance',
        entity_type: 'attendance',
        entity_id: userId,
        details: `Marked ${profiles.find((p) => p.id === userId)?.display_name ?? ''} as ${status} on ${selectedDate}`,
      });
      const refreshed = await fetchAttendance(selectedDate, selectedDate);
      setRecords(refreshed);
    } catch (err) {
      console.error('Failed to update attendance:', err);
    }
  }

  function getRecordForUser(userId: string): Attendance | undefined {
    return records.find((r) => r.user_id === userId);
  }

  return (
    <div>
      <Header title="Attendance" subtitle="Track daily team attendance" />
      <div className="p-4 lg:p-6">
        <div className="flex items-center gap-3 mb-5">
          <CalendarCheck className="w-5 h-5 text-primary-500" />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="input max-w-[200px]"
          />
          <span className="text-sm text-secondary-500 dark:text-secondary-400">
            {formatDate(selectedDate)}
          </span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
          </div>
        ) : (
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-secondary-200 dark:border-secondary-800 bg-secondary-50 dark:bg-secondary-800/50">
                    <th className="text-left text-xs font-semibold text-secondary-500 uppercase tracking-wider px-4 py-3">
                      Team Member
                    </th>
                    <th className="text-left text-xs font-semibold text-secondary-500 uppercase tracking-wider px-4 py-3">
                      Status
                    </th>
                    <th className="text-left text-xs font-semibold text-secondary-500 uppercase tracking-wider px-4 py-3">
                      Check In
                    </th>
                    <th className="text-left text-xs font-semibold text-secondary-500 uppercase tracking-wider px-4 py-3">
                      Check Out
                    </th>
                    {canManage && (
                      <th className="text-right text-xs font-semibold text-secondary-500 uppercase tracking-wider px-4 py-3">
                        Actions
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-secondary-100 dark:divide-secondary-800">
                  {profiles.map((p) => {
                    const record = getRecordForUser(p.id);
                    return (
                      <tr key={p.id} className="hover:bg-secondary-50 dark:hover:bg-secondary-800/30 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <Avatar profile={p} size="sm" />
                            <div>
                              <p className="text-sm font-medium">{p.display_name}</p>
                              <p className="text-xs text-secondary-400">{p.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {record ? (
                            <span className={`badge ${attendanceBadgeClasses[record.status]}`}>
                              {ATTENDANCE_STATUSES.find((s) => s.value === record.status)?.label}
                            </span>
                          ) : (
                            <span className="text-xs text-secondary-400">Not marked</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-secondary-500 dark:text-secondary-400">
                          {record?.check_in ? new Date(record.check_in).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '—'}
                        </td>
                        <td className="px-4 py-3 text-sm text-secondary-500 dark:text-secondary-400">
                          {record?.check_out ? new Date(record.check_out).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '—'}
                        </td>
                        {canManage && (
                          <td className="px-4 py-3 text-right">
                            <select
                              value={record?.status ?? ''}
                              onChange={(e) => handleStatusChange(p.id, e.target.value as AttendanceStatus)}
                              className="input text-sm max-w-[140px] ml-auto"
                            >
                              <option value="">Mark attendance</option>
                              {ATTENDANCE_STATUSES.map((s) => (
                                <option key={s.value} value={s.value}>
                                  {s.label}
                                </option>
                              ))}
                            </select>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
