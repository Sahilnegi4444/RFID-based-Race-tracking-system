import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, Upload, Settings as SettingsIcon, LogOut, Radio } from 'lucide-react';
import useAuthStore from '../store/authStore';
import useSettingsStore from '../store/settingsStore';
import { cn } from '../utils/utils';

export default function DashboardLayout() {
  const logout = useAuthStore(state => state.logout);
  const raceTitle = useSettingsStore(state => state.raceTitle);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Upload Tags', path: '/upload', icon: Upload },
    { name: 'Settings', path: '/settings', icon: SettingsIcon },
  ];

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 flex flex-col">
        <div className="p-6 flex items-center gap-3 text-slate-900 dark:text-white font-bold text-lg border-b border-slate-100 dark:border-slate-800">
          <div className="p-2 bg-blue-600 rounded-lg text-white">
            <Radio size={20} />
          </div>
          <span>RFID System</span>
        </div>
        
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium",
                isActive 
                  ? "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" 
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              )}
            >
              <item.icon size={20} />
              {item.name}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-200 dark:border-slate-800">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-slate-600 dark:text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400 transition-colors font-medium"
          >
            <LogOut size={20} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Navbar */}
        <header className="h-16 bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-8 shrink-0">
          <h1 className="text-xl font-semibold text-slate-800 dark:text-white">
            {raceTitle}
          </h1>
          <div className="flex items-center gap-4">
            <div className="h-8 w-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center text-blue-700 dark:text-blue-300 font-bold">
              A
            </div>
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Admin User</span>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-auto p-8 bg-slate-50 dark:bg-slate-900">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
