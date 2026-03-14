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
    <div className="min-h-screen bg-deep-navy flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-space font-bold tracking-tight-display text-white">
            RIVER
          </h1>
          <p className="text-white/45 mt-2 font-inter">Upload once. Flow everywhere.</p>
        </div>

        <div className="bg-dark-navy border border-white/6 rounded-card shadow-card-dark p-8">
          <h2 className="text-xl font-space font-semibold text-white mb-6">Sign in</h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-white/70 mb-1 font-inter">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full px-4 py-2.5 bg-deep-navy border border-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-vista-blue focus:border-transparent font-inter transition-colors"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-white/70 mb-1 font-inter">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="w-full px-4 py-2.5 bg-deep-navy border border-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-vista-blue focus:border-transparent font-inter transition-colors"
                placeholder="••••••••"
              />
              {error && (
                <p className="mt-2 text-sm text-big-red font-inter">{error}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-big-red text-white py-3 px-4 rounded-lg hover:bg-big-red/90 disabled:opacity-50 disabled:cursor-not-allowed font-space font-semibold transition-all duration-200 active:scale-[0.97] mt-2"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-white/45 font-inter">
            No account?{' '}
            <Link to="/signup" className="text-vista-blue hover:text-white transition-colors">
              Create account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
