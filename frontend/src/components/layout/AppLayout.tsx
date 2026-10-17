import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { MessageSquare, Database, Settings, LogOut, Bot, Sparkles, User, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Badge } from '../ui/Badge';

export const AppLayout: React.FC = () => {
  const { user, logout, isCognitoLive } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { to: '/chat', label: 'Chat', icon: MessageSquare },
    { to: '/memories', label: 'Memory Dashboard', icon: Database },
    { to: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="flex h-screen w-full bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* Sidebar */}
      <aside className="w-64 border-r border-slate-800 bg-slate-900/60 backdrop-blur flex flex-col justify-between shrink-0">
        <div>
          {/* Brand header */}
          <div className="p-4 border-b border-slate-800 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-inner">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="font-semibold text-slate-100 text-sm tracking-tight flex items-center gap-1.5">
                Memory AI
                <span className="text-[10px] bg-indigo-950 text-indigo-300 border border-indigo-800/80 px-1.5 py-0.2 rounded font-mono">
                  v2.0
                </span>
              </div>
              <p className="text-[11px] text-slate-400 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-emerald-400" />
                Bedrock + DynamoDB
              </p>
            </div>
          </div>

          {/* Navigation links */}
          <nav className="p-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                        : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* User profile & footer */}
        <div className="p-3 border-t border-slate-800 bg-slate-900/40">
          <div className="flex items-center justify-between mb-2 px-1">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
              <span className="text-[11px] text-slate-400">Auth Status</span>
            </div>
            <Badge variant={isCognitoLive ? 'emerald' : 'amber'} size="sm" dot>
              {isCognitoLive ? 'Cognito Live' : 'Dev Mode'}
            </Badge>
          </div>

          <div className="flex items-center justify-between p-2 rounded-xl bg-slate-850 border border-slate-800">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-indigo-950 border border-indigo-800/60 flex items-center justify-center text-indigo-300 shrink-0">
                <User className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-medium text-slate-200 truncate">
                  {user?.name || user?.email?.split('@')[0] || 'User'}
                </div>
                <div className="text-[10px] text-slate-500 truncate" title={user?.email}>
                  {user?.email}
                </div>
              </div>
            </div>

            <button
              onClick={handleLogout}
              title="Sign Out"
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden relative">
        <Outlet />
      </main>
    </div>
  );
};

