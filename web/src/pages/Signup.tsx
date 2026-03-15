import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { GlowingEffect } from '../components/ui/glowing-effect';

export function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
    confirmPassword?: string;
    general?: string;
  }>({});
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
          className="p-8 relative"
          style={{
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 12,
            background: 'rgba(0,9,71,0.55)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            boxShadow: '0 8px 40px rgba(0,0,0,0.45), 0 2px 10px rgba(0,0,0,0.25)',
          }}
        >
          <GlowingEffect disabled={false} borderWidth={4} />
          <h2 className="text-2xl font-space font-bold text-white mb-6" style={{ letterSpacing: '-0.02em' }}>
            Create account
          </h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            {errors.general && (
              <div className="px-4 py-3 rounded-lg text-sm text-big-red" style={{ background: 'rgba(255,22,53,0.08)', border: '1px solid rgba(255,22,53,0.2)' }}>
                {errors.general}
              </div>
            )}

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
              {errors.email && <p className="mt-2 text-sm text-big-red">{errors.email}</p>}
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
                autoComplete="new-password"
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
              {errors.password && <p className="mt-2 text-sm text-big-red">{errors.password}</p>}
            </div>

            <div>
              <label
                htmlFor="confirm-password"
                className="block text-xs text-white/50 mb-2 uppercase"
                style={{ fontFamily: '"JetBrains Mono", monospace', letterSpacing: '0.10em' }}
              >
                Confirm password
              </label>
              <input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                autoComplete="new-password"
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
              {errors.confirmPassword && <p className="mt-2 text-sm text-big-red">{errors.confirmPassword}</p>}
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
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-white/40">
            Already have an account?{' '}
            <Link to="/login" className="text-vista-blue hover:text-white transition-[color] duration-200 focus-visible:outline-none focus-visible:rounded-sm focus-visible:ring-2 focus-visible:ring-pinky focus-visible:ring-offset-1">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
