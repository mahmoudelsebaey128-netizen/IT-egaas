import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { Avatar } from '@/components/Avatar';
import { roleBadgeClasses } from '@/lib/utils';
import { ROLE_LABELS, type UserRole } from '@/types';
import {
  Layers,
  LayoutDashboard,
  KanbanSquare,
  Users,
  CalendarCheck,
  Activity,
  Sun,
  Moon,
  LogOut,
  Menu,
  X,
} from 'lucide-react';

export type ViewKey = 'dashboard' | 'board' | 'team' | 'attendance' | 'activity';

interface SidebarProps {
  current: ViewKey;
  onNavigate: (view: ViewKey) => void;
}

const navItems: { key: ViewKey; label: string; icon: typeof LayoutDashboard }[] = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'board', label: 'Kanban Board', icon: KanbanSquare },
  { key: 'team', label: 'Team Members', icon: Users },
  { key: 'attendance', label: 'Attendance', icon: CalendarCheck },
  { key: 'activity', label: 'Activity Log', icon: Activity },
];

export function Sidebar({ current, onNavigate }: SidebarProps) {
  const { profile, signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  function handleNav(view: ViewKey) {
    onNavigate(view);
    setMobileOpen(false);
  }

  const sidebarContent = (
    <>
      <div className="flex items-center gap-3 px-5 py-5 border-b border-secondary-200 dark:border-secondary-800">
        <div className="w-10 h-10 rounded-xl bg-primary-600 flex items-center justify-center shadow-md shadow-primary-600/20">
          <Layers className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="font-bold text-base leading-tight">IT-EGAS</h1>
          <p className="text-xs text-secondary-500 dark:text-secondary-400">Team Workspace</p>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = current === item.key;
          return (
            <button
              key={item.key}
              onClick={() => handleNav(item.key)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                active
                  ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300'
                  : 'text-secondary-600 hover:bg-secondary-100 dark:text-secondary-300 dark:hover:bg-secondary-800'
              }`}
            >
              <Icon className="w-[18px] h-[18px] flex-shrink-0" />
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="px-3 pb-4">
        <div className="flex items-center gap-3 px-3 py-3 rounded-lg bg-secondary-50 dark:bg-secondary-800/50">
          <Avatar profile={profile} size="sm" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{profile?.display_name ?? 'User'}</p>
            <span
              className={`badge ${roleBadgeClasses[profile?.role ?? 'team_member' as UserRole]}`}
            >
              {ROLE_LABELS[profile?.role ?? 'team_member']}
            </span>
          </div>
        </div>
        <button
          onClick={signOut}
          className="w-full mt-2 flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-error-600 dark:text-error-400 hover:bg-error-50 dark:hover:bg-error-900/20 transition-all"
        >
          <LogOut className="w-[18px] h-[18px]" />
          Sign Out
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile header bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-30 flex items-center justify-between px-4 py-3 bg-white dark:bg-secondary-900 border-b border-secondary-200 dark:border-secondary-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center">
            <Layers className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-sm">IT-EGAS</span>
        </div>
        <button onClick={() => setMobileOpen(true)} className="btn-ghost p-2 rounded-lg">
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-64 flex-col bg-white dark:bg-secondary-900 border-r border-secondary-200 dark:border-secondary-800 h-screen sticky top-0">
        {sidebarContent}
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 animate-fade-in">
          <div className="absolute inset-0 bg-secondary-950/40 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-72 bg-white dark:bg-secondary-900 flex flex-col animate-slide-in-right">
            <button onClick={() => setMobileOpen(false)} className="absolute top-4 right-4 btn-ghost p-1 rounded-lg z-10">
              <X className="w-5 h-5" />
            </button>
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}

export function Header({ title, subtitle }: { title: string; subtitle?: string }) {
  const { theme, toggleTheme } = useTheme();
  return (
    <header className="sticky top-0 z-20 bg-white/80 dark:bg-secondary-900/80 backdrop-blur-md border-b border-secondary-200 dark:border-secondary-800 px-4 lg:px-6 py-3.5 mt-14 lg:mt-0">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg lg:text-xl font-bold tracking-tight">{title}</h2>
          {subtitle && <p className="text-sm text-secondary-500 dark:text-secondary-400">{subtitle}</p>}
        </div>
        <button
          onClick={toggleTheme}
          className="btn-ghost p-2 rounded-lg"
          aria-label="Toggle dark mode"
        >
          {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
      </div>
    </header>
  );
}
