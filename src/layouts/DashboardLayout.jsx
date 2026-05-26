import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { LayoutDashboard, Upload, PlusCircle, LogOut, Radio, Shield } from 'lucide-react';
import useAuthStore from '../store/authStore';
import useSettingsStore from '../store/settingsStore';
import useRaceStore from '../store/raceStore';
import useRunnerStore from '../store/runnerStore';
import { cn } from '../utils/utils';

export default function DashboardLayout() {
  const logout = useAuthStore(state => state.logout);
  const user = useAuthStore(state => state.user);
  const raceTitle = useSettingsStore(state => state.raceTitle);
  const navigate = useNavigate();

  const loadActiveRace = useRaceStore(state => state.loadActiveRace);
  const resetRace = useRaceStore(state => state.resetRace);
  const clearRunners = useRunnerStore(state => state.clearRunners);

  useEffect(() => {
    loadActiveRace();
  }, [loadActiveRace]);

  const handleLogout = () => {
    logout();
    resetRace();
    clearRunners();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard',    path: '/dashboard',    icon: LayoutDashboard },
    { name: 'Upload Tags',  path: '/upload',       icon: Upload },
    { name: 'Create Race',  path: '/create-race',  icon: PlusCircle },
  ];

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--khaki)' }}>

      {/* ── Sidebar ── */}
      <aside
        className="w-64 flex flex-col shrink-0 shadow-lg"
        style={{
          background: 'var(--army-green-dark)',
          borderRight: '3px solid var(--gold)',
        }}
      >
        {/* Logo / Brand */}
        <div
          className="p-5 flex items-center gap-3 shrink-0"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}
        >
          <div
            className="p-2 rounded-lg shrink-0"
            style={{ background: 'var(--gold)', color: '#fff' }}
          >
            <Radio size={20} />
          </div>
          <div>
            <p className="font-bold text-white text-sm leading-tight">RFID Tracker</p>
            <p className="text-xs" style={{ color: 'var(--gold-muted)' }}>Race Control</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => cn(
                'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium text-sm',
                isActive
                  ? 'text-white'
                  : 'text-white/60 hover:text-white hover:bg-white/10'
              )}
              style={({ isActive }) => isActive ? {
                background: 'var(--army-green)',
                borderLeft: '3px solid var(--gold)',
                paddingLeft: '13px',
              } : {}}
            >
              <item.icon size={18} />
              {item.name}
            </NavLink>
          ))}
        </nav>

        {/* User & Logout */}
        <div
          className="p-4 shrink-0"
          style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}
        >
          <div className="flex items-center gap-3 px-3 py-2 mb-2 rounded-xl" style={{ background: 'rgba(255,255,255,0.06)' }}>
            <div
              className="h-8 w-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0"
              style={{ background: 'var(--gold)', color: '#fff' }}
            >
              {user?.username?.[0]?.toUpperCase() ?? 'A'}
            </div>
            <div className="overflow-hidden">
              <p className="text-white text-sm font-medium truncate">{user?.username ?? 'Admin'}</p>
              <p className="text-xs" style={{ color: 'var(--gold-muted)' }}>Administrator</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-2.5 w-full rounded-xl text-sm font-medium transition-colors"
            style={{ color: 'rgba(255,255,255,0.6)' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(192,57,43,0.25)'; e.currentTarget.style.color = '#ff8a8a'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; }}
          >
            <LogOut size={17} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">

        {/* Top Navbar */}
        <header
          className="h-16 flex items-center justify-between px-8 shrink-0 shadow-sm"
          style={{
            background: 'var(--surface)',
            borderBottom: '2px solid var(--khaki-border)',
          }}
        >
          {/* Title area */}
          <div className="flex items-center gap-3">
            <Shield size={20} style={{ color: 'var(--army-green)' }} />
            <div>
              <h1 className="text-base font-bold leading-tight" style={{ color: 'var(--text-primary)' }}>
                {raceTitle}
              </h1>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Admin Control Center</p>
            </div>
          </div>

          {/* Status badge */}
          <div className="flex items-center gap-3">
            <span
              className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
              style={{ background: 'var(--success-pale)', color: 'var(--success)' }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-green-600 inline-block animate-pulse" />
              System Online
            </span>
          </div>
        </header>

        {/* Page Content */}
        <div
          className="flex-1 overflow-auto p-8"
          style={{ background: 'var(--khaki)' }}
        >
          <Outlet />
        </div>
      </main>
    </div>
  );
}
