import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signIn(email, password);
      navigate('/upload', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        background:
          'radial-gradient(ellipse 70% 60% at 80% 20%, rgba(255,22,53,0.12) 0%, transparent 60%), radial-gradient(ellipse 50% 50% at 15% 80%, rgba(161,0,255,0.10) 0%, transparent 55%), #000623',
      }}
    >
      <div className="w-full max-w-md">
        {/* Wordmark */}
        <div className="text-center mb-10">
          <p
            className="text-white/35 mb-3 text-xs uppercase"
            style={{ fontFamily: '"JetBrains Mono", monospace', letterSpacing: '0.14em' }}
          >
            Project: Tredstone
          </p>
          <h1
            className="text-white font-space font-bold"
            style={{ fontSize: '5rem', letterSpacing: '-0.03em', lineHeight: 1 }}
          >
            RIVER
          </h1>
          <p
            className="text-white/40 mt-3 text-xs uppercase"
            style={{ fontFamily: '"JetBrains Mono", monospace', letterSpacing: '0.14em' }}
          >
            Upload once. Flow everywhere.
          </p>
        </div>

        {/* Card */}
        <div
          className="rounded-card p-8 border"
          style={{
            background: 'rgba(0,9,71,0.55)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            borderColor: 'rgba(255,255,255,0.08)',
            boxShadow: '0 8px 40px rgba(0,0,0,0.45), 0 2px 10px rgba(0,0,0,0.25)',
          }}
        >
          <h2 className="text-2xl font-space font-bold text-white mb-6" style={{ letterSpacing: '-0.02em' }}>
            Sign in
          </h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="email"
                className="block text-xs text-white/50 mb-2 uppercase"
                style={{ fontFamily: '"JetBrains Mono", monospace', letterSpacing: '0.10em' }}
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full px-4 py-3 rounded-lg text-white text-sm placeholder-white/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-pinky/55 focus-visible:ring-offset-0 transition-[border-color] duration-200"
                style={{
                  background: 'rgba(0,6,35,0.8)',
                  border: '1px solid rgba(255,255,255,0.10)',
                  fontFamily: '"Inter", sans-serif',
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = 'rgba(255,22,115,0.55)')}
                onBlur={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.10)')}
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-xs text-white/50 mb-2 uppercase"
                style={{ fontFamily: '"JetBrains Mono", monospace', letterSpacing: '0.10em' }}
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="w-full px-4 py-3 rounded-lg text-white text-sm placeholder-white/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-pinky/55 focus-visible:ring-offset-0 transition-[border-color] duration-200"
                style={{
                  background: 'rgba(0,6,35,0.8)',
                  border: '1px solid rgba(255,255,255,0.10)',
                  fontFamily: '"Inter", sans-serif',
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = 'rgba(255,22,115,0.55)')}
                onBlur={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.10)')}
                placeholder="••••••••"
              />
              {error && (
                <p className="mt-2 text-sm text-big-red">{error}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full text-white py-3.5 px-4 rounded-lg font-space font-semibold text-sm active:scale-[0.97] mt-1 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pinky focus-visible:ring-offset-2"
              style={{
                background: '#FF1635',
                boxShadow: '0 4px 20px rgba(255,22,53,0.35)',
                transition: 'background 0.2s ease, transform 0.2s cubic-bezier(0.4,0,0.2,1)',
              }}
              onMouseEnter={(e) => { if (!loading) e.currentTarget.style.background = '#e01030'; }}
              onMouseLeave={(e) => { if (!loading) e.currentTarget.style.background = '#FF1635'; }}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-white/40">
            No account?{' '}
            <Link to="/signup" className="text-vista-blue hover:text-white transition-[color] duration-200 focus-visible:outline-none focus-visible:rounded-sm focus-visible:ring-2 focus-visible:ring-pinky focus-visible:ring-offset-1">
              Create account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
