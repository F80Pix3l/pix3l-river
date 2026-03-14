import { useState } from 'react';
import type { ReactNode } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface LayoutProps {
  children: ReactNode;
  pageTitle: string;
}

type NavItem = {
  id: string;
  label: string;
  icon: string;
};

const navItems: NavItem[] = [
  { id: 'home', label: 'Home', icon: '🏠' },
  { id: 'upload', label: 'Upload', icon: '⬆️' },
  { id: 'pipeline', label: 'Pipeline', icon: '⚡' },
  { id: 'review', label: 'Review', icon: '✓' },
  { id: 'settings', label: 'Settings', icon: '⚙️' },
];

export function Layout({ children, pageTitle }: LayoutProps) {
  const { user, signOut } = useAuth();
  const [activeNav, setActiveNav] = useState('upload');

  return (
    <div className="flex min-h-screen bg-deep-navy">
      {/* Sidebar */}
      <aside className="w-64 bg-dark-navy border-r border-white/6 flex flex-col">
        {/* RIVER Wordmark */}
        <div className="p-6 border-b border-white/6">
          <h1 className="text-3xl font-space font-bold tracking-tight-display text-white">
            RIVER
          </h1>
          <p className="text-xs text-white/45 mt-1 font-inter">
            Upload once. Flow everywhere.
          </p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {navItems.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => setActiveNav(item.id)}
                  className={`
                    w-full flex items-center gap-3 px-4 py-3 rounded-lg
                    font-inter text-sm font-medium transition-all duration-200
                    ${
                      activeNav === item.id
                        ? 'bg-vista-blue/10 text-white border border-vista-blue/20'
                        : 'text-white/55 hover:text-white hover:bg-white/5'
                    }
                  `}
                >
                  <span className="text-lg">{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* User Section */}
        <div className="p-4 border-t border-white/6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-vista-blue/20 flex items-center justify-center text-vista-blue font-space font-bold text-sm">
              {user?.email?.[0].toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-white/70 truncate font-inter">
                {user?.email}
              </p>
            </div>
          </div>
          <button
            onClick={signOut}
            className="w-full px-4 py-2 text-sm text-white/55 hover:text-white hover:bg-white/5 rounded-lg transition-colors duration-200 font-inter"
          >
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Header Bar */}
        <header className="h-16 bg-dark-navy border-b border-white/6 flex items-center justify-between px-6">
          <h2 className="text-xl font-space font-bold text-white">
            {pageTitle}
          </h2>
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-vista-blue/20 flex items-center justify-center">
              <span className="text-vista-blue font-space font-bold">
                {user?.email?.[0].toUpperCase() || 'U'}
              </span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
