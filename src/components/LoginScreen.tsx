import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { Layers, Mail, Lock, User, Sun, Moon, Loader2, CheckCircle2 } from 'lucide-react';

export function LoginScreen() {
  const { signIn, signUp } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    if (mode === 'login') {
      const { error } = await signIn(email, password);
      if (error) setError(error);
      else setSuccess('Login successful! Redirecting to dashboard...');
    } else {
      if (displayName.trim().length < 2) {
        setError('Please enter your full name.');
        setLoading(false);
        return;
      }
      if (password.length < 1) {
        setError('Please enter a password.');
        setLoading(false);
        return;
      }
      const { error } = await signUp(email, password, displayName);
      if (error) setError(error);
      else setSuccess('Account created! You can now sign in.');
    }
    setLoading(false);
  }

  function fillDemoCredentials(email: string) {
    setEmail(email);
    setPassword('123456');
    setMode('login');
    setError(null);
    setSuccess(null);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-secondary-100 via-primary-50 to-accent-50 dark:from-secondary-950 dark:via-secondary-900 dark:to-secondary-950 p-4">
      <button
        onClick={toggleTheme}
        className="absolute top-6 right-6 btn-ghost p-2 rounded-lg"
        aria-label="Toggle theme"
      >
        {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
      </button>

      <div className="w-full max-w-md animate-slide-up">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-primary-600 flex items-center justify-center shadow-lg shadow-primary-600/20 mb-4">
            <Layers className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">IT-EGAS</h1>
          <p className="text-sm text-secondary-500 dark:text-secondary-400 mt-1">
            Enterprise Team Workspace
          </p>
        </div>

        <div className="card p-6">
          <div className="flex gap-1 p-1 bg-secondary-100 dark:bg-secondary-800 rounded-lg mb-6">
            <button
              onClick={() => setMode('login')}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                mode === 'login'
                  ? 'bg-white dark:bg-secondary-900 shadow-sm text-primary-600 dark:text-primary-400'
                  : 'text-secondary-500'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setMode('signup')}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                mode === 'signup'
                  ? 'bg-white dark:bg-secondary-900 shadow-sm text-primary-600 dark:text-primary-400'
                  : 'text-secondary-500'
              }`}
            >
              Create Account
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="block text-sm font-medium mb-1.5">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="e.g. Mohamed Ahmed"
                    className="input pl-10"
                    required
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@egas.com"
                  className="input pl-10"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="input pl-10"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="text-sm text-error-600 dark:text-error-400 bg-error-50 dark:bg-error-900/20 rounded-lg px-3 py-2 animate-fade-in">
                {error}
              </div>
            )}

            {success && (
              <div className="text-sm text-success-600 dark:text-success-400 bg-success-50 dark:bg-success-900/20 rounded-lg px-3 py-2 flex items-center gap-2 animate-fade-in">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                {success}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {mode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          {mode === 'login' && (
            <div className="mt-4 space-y-2">
              <p className="text-xs text-center text-secondary-400">
                Use your team email to sign in. New users can create an account from the "Create Account" tab.
              </p>
              <div className="border-t border-secondary-100 dark:border-secondary-800 pt-3">
                <p className="text-xs font-medium text-secondary-500 dark:text-secondary-400 mb-2">
                  Demo accounts (password: 123456):
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { email: 'mahmoud@egas.com', label: 'Admin' },
                    { email: 'eslam@egas.com', label: 'Eslam' },
                    { email: 'mohamed@egas.com', label: 'Mohamed' },
                    { email: 'marwa@egas.com', label: 'Marwa' },
                  ].map((acc) => (
                    <button
                      key={acc.email}
                      type="button"
                      onClick={() => fillDemoCredentials(acc.email)}
                      className="text-xs px-2 py-1 rounded-md bg-secondary-100 dark:bg-secondary-800 text-secondary-600 dark:text-secondary-300 hover:bg-primary-100 dark:hover:bg-primary-900/30 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                    >
                      {acc.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
