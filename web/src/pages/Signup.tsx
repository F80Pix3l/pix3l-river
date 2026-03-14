import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string; confirmPassword?: string; general?: string }>({});
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const validate = () => {
    const next: typeof errors = {};
    if (!email) next.email = 'Email is required';
    if (!password) next.password = 'Password is required';
    else if (password.length < 6) next.password = 'Password must be at least 6 characters';
    if (!confirmPassword) next.confirmPassword = 'Please confirm your password';
    else if (password !== confirmPassword) next.confirmPassword = 'Passwords do not match';
    return next;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const fieldErrors = validate();
    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    setLoading(true);

    try {
      await signUp(email, password);
      navigate('/upload', { replace: true });
    } catch (err) {
      setErrors({ general: err instanceof Error ? err.message : 'Sign up failed' });
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
          <h2 className="text-xl font-space font-semibold text-white mb-6">Create account</h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            {errors.general && (
              <p className="text-sm text-big-red font-inter">{errors.general}</p>
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
                autoComplete="email"
                className="w-full px-4 py-2.5 bg-deep-navy border border-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-vista-blue focus:border-transparent font-inter transition-colors"
                placeholder="you@example.com"
              />
              {errors.email && (
                <p className="mt-2 text-sm text-big-red font-inter">{errors.email}</p>
              )}
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
                autoComplete="new-password"
                className="w-full px-4 py-2.5 bg-deep-navy border border-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-vista-blue focus:border-transparent font-inter transition-colors"
                placeholder="••••••••"
              />
              {errors.password && (
                <p className="mt-2 text-sm text-big-red font-inter">{errors.password}</p>
              )}
            </div>

            <div>
              <label htmlFor="confirm-password" className="block text-sm font-medium text-white/70 mb-1 font-inter">
                Confirm password
              </label>
              <input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                autoComplete="new-password"
                className="w-full px-4 py-2.5 bg-deep-navy border border-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-vista-blue focus:border-transparent font-inter transition-colors"
                placeholder="••••••••"
              />
              {errors.confirmPassword && (
                <p className="mt-2 text-sm text-big-red font-inter">{errors.confirmPassword}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-big-red text-white py-3 px-4 rounded-lg hover:bg-big-red/90 disabled:opacity-50 disabled:cursor-not-allowed font-space font-semibold transition-all duration-200 active:scale-[0.97] mt-2"
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-white/45 font-inter">
            Already have an account?{' '}
            <Link to="/login" className="text-vista-blue hover:text-white transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
