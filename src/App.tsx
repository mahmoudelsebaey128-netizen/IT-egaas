import { useEffect, useState } from 'react';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { LoginScreen } from '@/components/LoginScreen';
import { Sidebar, type ViewKey } from '@/components/Sidebar';
import { BoardView } from '@/components/BoardView';
import { TeamView } from '@/components/TeamView';
import { AttendanceView } from '@/components/AttendanceView';
import { ActivityView } from '@/components/ActivityView';
import { DashboardView } from '@/components/DashboardView';
import { fetchProfiles } from '@/lib/data';
import type { Profile } from '@/types';
import { Loader2 } from 'lucide-react';

function AppContent() {
  const { session, loading } = useAuth();
  const [view, setView] = useState<ViewKey>('dashboard');
  const [profiles, setProfiles] = useState<Profile[]>([]);

  useEffect(() => {
    if (session) {
      fetchProfiles()
        .then(setProfiles)
        .catch((err) => console.error('Failed to load profiles:', err));
    }
  }, [session]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary-50 dark:bg-secondary-950">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  if (!session) {
    return <LoginScreen />;
  }

  return (
    <div className="min-h-screen flex bg-secondary-50 dark:bg-secondary-950">
      <Sidebar current={view} onNavigate={setView} />
      <main className="flex-1 min-w-0">
        {view === 'dashboard' && <DashboardView profiles={profiles} />}
        {view === 'board' && <BoardView profiles={profiles} />}
        {view === 'team' && <TeamView />}
        {view === 'attendance' && <AttendanceView profiles={profiles} />}
        {view === 'activity' && <ActivityView />}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}
