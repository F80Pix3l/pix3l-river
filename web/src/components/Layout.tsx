import type { ReactNode } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface LayoutProps {
  children: ReactNode;
  pageTitle: string;
}

const UploadIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </svg>
);

const PipelineIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3" />
    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
  </svg>
);

const ReviewIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="9" y1="13" x2="15" y2="13" />
    <line x1="9" y1="17" x2="13" y2="17" />
  </svg>
);

const BASE_NAV = [
  { id: 'upload', label: 'Upload', icon: <UploadIcon /> },
  { id: 'pipeline', label: 'Pipeline', icon: <PipelineIcon /> },
  { id: 'review', label: 'Review', icon: <ReviewIcon /> },
];

export function Layout({ children, pageTitle }: LayoutProps) {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const params = useParams<{ jobId?: string }>();
  const jobId = params.jobId;

  const activeId = location.pathname.startsWith('/pipeline')
    ? 'pipeline'
    : location.pathname.startsWith('/review')
    ? 'review'
    : 'upload';

  const navItems = BASE_NAV.map((item) => {
    if (item.id === 'upload') return { ...item, href: '/upload', disabled: false };
    if (item.id === 'pipeline') return { ...item, href: jobId ? `/pipeline/${jobId}` : null, disabled: !jobId };
    if (item.id === 'review') return { ...item, href: jobId ? `/review/${jobId}` : null, disabled: !jobId };
    return { ...item, href: null, disabled: true };
  });

  const initials = user?.email?.[0].toUpperCase() || 'U';

  return (
    <div className="flex min-h-screen" style={{ background: '#000623' }}>
      {/* Sidebar
          md (768px+): full width 240px with labels
          sm (< 768px): icon-only 56px strip */}
      <aside
        className="w-14 md:w-60 flex flex-col flex-shrink-0"
        style={{
          background: '#000947',
          borderRight: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        {/* Wordmark */}
        <div
          className="px-3 md:px-6 py-6 flex items-start"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
        >
          <div className="flex items-center gap-2 min-w-0">
            {/* Gradient mark -- always visible */}
            <div
              className="w-2 h-6 rounded-sm flex-shrink-0"
              style={{ background: 'linear-gradient(180deg, #FF1635 0%, #A100FF 100%)' }}
            />
            <div className="hidden md:block min-w-0">
              <h1 className="text-xl font-space font-bold text-white" style={{ letterSpacing: '-0.02em', lineHeight: 1 }}>
                RIVER
              </h1>
              <p
                className="text-white/35 mt-1 text-xs uppercase"
                style={{ fontFamily: '"JetBrains Mono", monospace', letterSpacing: '0.10em' }}
              >
                Pix3l
              </p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-1.5 md:px-3 py-4" aria-label="Main navigation">
          <p
            className="hidden md:block text-white/25 text-xs uppercase px-3 mb-3"
            style={{ fontFamily: '"JetBrains Mono", monospace', letterSpacing: '0.12em' }}
          >
            Workspace
          </p>
          <ul className="space-y-0.5 md:space-y-1">
            {navItems.map((item) => {
              const isActive = activeId === item.id;
              const isDisabled = item.disabled && !isActive;

              const linkStyle = {
                color: isDisabled ? 'rgba(255,255,255,0.20)' : isActive ? '#fff' : 'rgba(255,255,255,0.50)',
                background: isActive ? 'rgba(255,22,53,0.08)' : 'transparent',
                borderLeft: isActive ? '2px solid #FF1635' : '2px solid transparent',
                fontFamily: '"Inter", sans-serif',
                cursor: isDisabled ? 'default' : 'pointer',
                pointerEvents: isDisabled ? 'none' as const : 'auto' as const,
              };

              const iconColor = isDisabled
                ? 'rgba(255,255,255,0.15)'
                : isActive
                ? '#FF1635'
                : 'rgba(255,255,255,0.40)';

              const content = (
                <>
                  <span className="flex-shrink-0" style={{ color: iconColor }}>{item.icon}</span>
                  <span className="hidden md:inline truncate">{item.label}</span>
                </>
              );

              return (
                <li key={item.id}>
                  {item.href && !isDisabled ? (
                    <Link
                      to={item.href}
                      className="w-full flex items-center justify-center md:justify-start gap-3 px-2 md:px-3 py-2.5 rounded-lg text-sm font-medium transition-[background-color,color,border-left-color] duration-150 motion-reduce:transition-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#FF1673] focus-visible:outline-offset-2"
                      style={linkStyle}
                      onMouseEnter={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                          e.currentTarget.style.color = 'rgba(255,255,255,0.80)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.background = 'transparent';
                          e.currentTarget.style.color = 'rgba(255,255,255,0.50)';
                        }
                      }}
                    >
                      {content}
                    </Link>
                  ) : (
                    <div
                      className="w-full flex items-center justify-center md:justify-start gap-3 px-2 md:px-3 py-2.5 rounded-lg text-sm font-medium"
                      style={linkStyle}
                      aria-disabled="true"
                    >
                      {content}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User section */}
        <div className="px-1.5 md:px-3 py-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          {/* Avatar + email row */}
          <div className="flex items-center justify-center md:justify-start gap-3 px-1.5 md:px-3 py-2 mb-1">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold font-space flex-shrink-0"
              style={{ background: 'rgba(133,153,255,0.15)', color: '#8599FF', border: '1px solid rgba(133,153,255,0.2)' }}
            >
              {initials}
            </div>
            <p className="hidden md:block text-xs text-white/50 truncate flex-1" style={{ fontFamily: '"Inter", sans-serif' }}>
              {user?.email}
            </p>
          </div>
          <button
            onClick={signOut}
            className="w-full flex items-center justify-center md:justify-start px-2 md:px-3 py-2 text-xs text-white/40 rounded-lg transition-[color,background-color] duration-200 motion-reduce:transition-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#FF1673] focus-visible:outline-offset-2"
            style={{ fontFamily: '"Inter", sans-serif' }}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.75)'; e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.40)'; e.currentTarget.style.background = 'transparent'; }}
          >
            <span className="hidden md:inline">Sign out</span>
            {/* Mobile: show a log-out icon */}
            <svg className="md:hidden" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
        </div>
      </aside>

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header -- 64px height per branding spec */}
        <header
          className="h-16 flex items-center justify-between px-6 md:px-8 flex-shrink-0"
          style={{
            background: 'rgba(0,9,71,0.6)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            boxShadow: '0 1px 0 rgba(255,255,255,0.04)',
          }}
        >
          <h2
            className="text-base font-space font-semibold text-white"
            style={{ letterSpacing: '-0.01em' }}
          >
            {pageTitle}
          </h2>
          {/* Avatar -- shown in header on all breakpoints for identity context */}
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold font-space flex-shrink-0"
            style={{ background: 'rgba(133,153,255,0.15)', color: '#8599FF', border: '1px solid rgba(133,153,255,0.2)' }}
            title={user?.email}
          >
            {initials}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
