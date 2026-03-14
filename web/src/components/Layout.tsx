import type { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
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

const navItems = [
  { id: 'upload', label: 'Upload', href: '/upload', icon: <UploadIcon /> },
  { id: 'pipeline', label: 'Pipeline', href: null, icon: <PipelineIcon /> },
  { id: 'review', label: 'Review', href: null, icon: <ReviewIcon /> },
];

export function Layout({ children, pageTitle }: LayoutProps) {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const activeId = location.pathname.startsWith('/pipeline')
    ? 'pipeline'
    : location.pathname.startsWith('/review')
    ? 'review'
    : 'upload';

  const initials = user?.email?.[0].toUpperCase() || 'U';

  return (
    <div className="flex min-h-screen" style={{ background: '#000623' }}>
      {/* Sidebar */}
      <aside
        className="w-60 flex flex-col flex-shrink-0"
        style={{
          background: '#000947',
          borderRight: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        {/* Wordmark */}
        <div className="px-6 py-6" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-2">
            <div
              className="w-2 h-6 rounded-sm"
              style={{ background: 'linear-gradient(180deg, #FF1635 0%, #A100FF 100%)' }}
            />
            <h1 className="text-xl font-space font-bold text-white" style={{ letterSpacing: '-0.02em' }}>
              RIVER
            </h1>
          </div>
          <p
            className="text-white/35 mt-1.5 text-xs uppercase"
            style={{ fontFamily: '"JetBrains Mono", monospace', letterSpacing: '0.10em' }}
          >
            Pix3l
          </p>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4">
          <p
            className="text-white/25 text-xs uppercase px-3 mb-3"
            style={{ fontFamily: '"JetBrains Mono", monospace', letterSpacing: '0.12em' }}
          >
            Workspace
          </p>
          <ul className="space-y-1">
            {navItems.map((item) => {
              const isActive = activeId === item.id;
              const content = (
                <span
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer"
                  style={{
                    color: isActive ? '#fff' : 'rgba(255,255,255,0.50)',
                    background: isActive ? 'rgba(255,22,53,0.08)' : 'transparent',
                    borderLeft: isActive ? '2px solid #FF1635' : '2px solid transparent',
                    fontFamily: '"Inter", sans-serif',
                  }}
                >
                  <span style={{ color: isActive ? '#FF1635' : 'rgba(255,255,255,0.40)' }}>
                    {item.icon}
                  </span>
                  {item.label}
                </span>
              );

              return (
                <li key={item.id}>
                  {item.href ? (
                    <Link to={item.href} className="block hover:opacity-90">
                      {content}
                    </Link>
                  ) : (
                    <div>{content}</div>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User Section */}
        <div className="px-3 py-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-3 px-3 py-2 mb-2">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold font-space flex-shrink-0"
              style={{ background: 'rgba(133,153,255,0.15)', color: '#8599FF' }}
            >
              {initials}
            </div>
            <p className="text-xs text-white/55 truncate flex-1" style={{ fontFamily: '"Inter", sans-serif' }}>
              {user?.email}
            </p>
          </div>
          <button
            onClick={signOut}
            className="w-full px-3 py-2 text-xs text-white/40 hover:text-white rounded-lg transition-colors duration-200 text-left"
            style={{ fontFamily: '"Inter", sans-serif' }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            Sign out
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header
          className="h-14 flex items-center justify-between px-8 flex-shrink-0"
          style={{
            background: 'rgba(0,9,71,0.6)',
            backdropFilter: 'blur(12px)',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <h2
            className="text-base font-space font-semibold text-white"
            style={{ letterSpacing: '-0.01em' }}
          >
            {pageTitle}
          </h2>
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold font-space"
            style={{ background: 'rgba(133,153,255,0.15)', color: '#8599FF' }}
          >
            {initials}
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
