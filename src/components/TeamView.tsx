import { useEffect, useState } from 'react';
import { Header } from '@/components/Sidebar';
import { Avatar } from '@/components/Avatar';
import { roleBadgeClasses } from '@/lib/utils';
import { ROLE_LABELS } from '@/types';
import { fetchProfiles, updateProfileRole } from '@/lib/data';
import { useAuth } from '@/context/AuthContext';
import type { Profile, UserRole } from '@/types';
import { Mail, Loader2, Shield, Crown } from 'lucide-react';

export function TeamView() {
  const { profile: currentUser } = useAuth();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfiles()
      .then(setProfiles)
      .catch((err) => console.error('Failed to load profiles:', err))
      .finally(() => setLoading(false));
  }, []);

  const canManage = currentUser?.role === 'admin' || currentUser?.role === 'team_leader';

  async function handleRoleChange(id: string, role: UserRole) {
    setProfiles((prev) => prev.map((p) => (p.id === id ? { ...p, role } : p)));
    try {
      await updateProfileRole(id, role);
    } catch (err) {
      console.error('Failed to update role:', err);
      fetchProfiles().then(setProfiles);
    }
  }

  if (loading) {
    return (
      <div>
        <Header title="Team Members" subtitle="Manage your team and roles" />
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
        </div>
      </div>
    );
  }

  return (
    <div>
      <Header title="Team Members" subtitle="Manage your team and roles" />
      <div className="p-4 lg:p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {profiles.map((p) => {
            const isCurrentUser = p.id === currentUser?.id;
            return (
              <div key={p.id} className="card p-5 animate-fade-in">
                <div className="flex items-start gap-4">
                  <Avatar profile={p} size="lg" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold truncate">{p.display_name}</h3>
                      {p.role === 'admin' && <Shield className="w-4 h-4 text-error-500 flex-shrink-0" />}
                      {p.role === 'team_leader' && <Crown className="w-4 h-4 text-accent-500 flex-shrink-0" />}
                    </div>
                    <div className="flex items-center gap-1.5 text-sm text-secondary-500 dark:text-secondary-400 mt-0.5">
                      <Mail className="w-3.5 h-3.5" />
                      <span className="truncate">{p.email}</span>
                    </div>
                    <span className={`badge ${roleBadgeClasses[p.role]} mt-2`}>
                      {ROLE_LABELS[p.role]}
                    </span>
                  </div>
                </div>

                {canManage && !isCurrentUser && (
                  <div className="mt-4 pt-4 border-t border-secondary-100 dark:border-secondary-800">
                    <label className="block text-xs font-medium text-secondary-500 mb-1.5">Role</label>
                    <select
                      value={p.role}
                      onChange={(e) => handleRoleChange(p.id, e.target.value as UserRole)}
                      className="input text-sm"
                    >
                      <option value="team_member">Team Member</option>
                      <option value="team_leader">Team Leader</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                )}

                {isCurrentUser && (
                  <div className="mt-4 pt-4 border-t border-secondary-100 dark:border-secondary-800">
                    <p className="text-xs text-secondary-400">This is you</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
