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
    <div className="min-h-screen flex items-center justify-center p-4 relative" style={{ background: '#00061a' }}>
      {/* Dot grid */}
      <div
        aria-hidden="true"
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(133,153,255,0.14) 1px, transparent 1px)',
          backgroundSize: '36px 36px',
          maskImage: 'radial-gradient(ellipse 90% 80% at 50% 50%, black 30%, transparent 100%)',
          WebkitMaskImage: 'radial-gradient(ellipse 90% 80% at 50% 50%, black 30%, transparent 100%)',
          zIndex: 3,
        }}
      />
      <div className="w-full max-w-md relative" style={{ zIndex: 4 }}>
        {/* Wordmark */}
        <div className="text-center mb-10">
          <style>{`
            @keyframes pulseDot {
              0%, 100% { box-shadow: 0 0 0 0 rgba(255,22,53,0.5); }
              50%       { box-shadow: 0 0 0 6px rgba(255,22,53,0); }
            }
            @keyframes gradientShift {
              0%   { background-position: 0% 50%; }
              50%  { background-position: 100% 50%; }
              100% { background-position: 0% 50%; }
            }
          `}</style>
          <p
            className="text-white/35 mb-3 text-xs uppercase flex items-center justify-center gap-2.5"
            style={{ fontFamily: '"JetBrains Mono", monospace', letterSpacing: '0.14em' }}
          >
            <span style={{
              width: 6, height: 6, borderRadius: '50%', flexShrink: 0, display: 'inline-block',
              background: 'rgba(255,86,107,0.85)',
              boxShadow: '0 0 8px rgba(255,22,53,0.4)',
              animation: 'pulseDot 2.4s ease-in-out infinite',
            }} />
            Project: Tredstone
          </p>
          <h1
            className="font-space font-bold block"
            style={{
              fontSize: 'clamp(4.5rem, 13vw, 10rem)',
              fontWeight: 700,
              letterSpacing: '-0.04em',
              lineHeight: 0.9,
              background: 'linear-gradient(135deg, #FF1635 0%, #A100FF 60%, #FF1673 100%)',
              backgroundSize: '200% 200%',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              animation: 'gradientShift 6s cubic-bezier(0.4, 0, 0.2, 1) infinite',
            }}
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
              className="w-full inline-flex items-center justify-center gap-2 font-space font-semibold disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pinky focus-visible:ring-offset-2 mt-1"
              style={{
                padding: '13px 26px',
                background: 'linear-gradient(135deg, #FF1635, #FF1673)',
                color: '#fff',
                fontSize: 14,
                letterSpacing: '-0.01em',
                borderRadius: 8,
                border: 'none',
                boxShadow: '0 4px 22px rgba(255,22,53,0.32), 0 1px 4px rgba(255,22,53,0.14)',
                transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.3s ease, opacity 0.15s ease',
              }}
              onMouseEnter={(e) => { if (!loading) e.currentTarget.style.transform = 'scale(1.03)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
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
