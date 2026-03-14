import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

export function Auth() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signUp, signIn } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isSignUp) {
        await signUp(email, password);
      } else {
        await signIn(email, password);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-deep-navy flex items-center justify-center p-4">
      <div className="bg-dark-navy border border-white/6 rounded-card shadow-card-dark p-8 max-w-md w-full">
        <h1 className="text-4xl font-space font-bold tracking-tight-display text-white mb-2 text-center">
          RIVER
        </h1>
        <p className="text-white/45 mb-8 text-center font-inter">
          Upload once. Flow everywhere.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-big-red/10 border border-big-red/20 text-big-red px-4 py-3 rounded-lg font-inter text-sm">
              {error}
            </div>
          )}

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
              className="w-full px-4 py-2 bg-deep-navy border border-white/10 rounded-lg text-white placeholder-white/30 focus:ring-2 focus:ring-vista-blue focus:border-transparent font-inter"
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
              minLength={6}
              className="w-full px-4 py-2 bg-deep-navy border border-white/10 rounded-lg text-white placeholder-white/30 focus:ring-2 focus:ring-vista-blue focus:border-transparent font-inter"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-big-red text-white py-2 px-4 rounded-lg hover:bg-big-red/90 disabled:opacity-50 disabled:cursor-not-allowed font-space font-semibold transition-all duration-200 active:scale-[0.97]"
          >
            {loading ? 'Processing...' : isSignUp ? 'Sign Up' : 'Sign In'}
          </button>
        </form>

        <div className="mt-4 text-center">
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-vista-blue hover:text-white text-sm font-inter transition-colors duration-200"
          >
            {isSignUp ? 'Already have an account? Sign in' : 'Don\'t have an account? Sign up'}
          </button>
        </div>
      </div>
    </div>
  );
}
