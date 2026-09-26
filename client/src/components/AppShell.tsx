import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { 
  Home, Bell, Calendar, FileText, Image, User, Settings, LogOut, UserPlus, Menu, X, MonitorPlay
} from 'lucide-react';
import useAuthStore from '../store/authStore';
import { cn } from '../lib/utils';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SearchOverlay from './SearchOverlay';
import InstallPrompt from './InstallPrompt';
import NotificationBell from './NotificationBell';
import { useDeviceTier } from '../hooks/useDeviceTier';

const AppShell = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const tier = useDeviceTier();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: Home, roles: ['admin', 'deo', 'faculty', 'student'] },
    { name: 'Announcements', path: '/announcements', icon: Bell, roles: ['admin', 'deo', 'faculty', 'student'] },
    { name: 'Events', path: '/events', icon: Calendar, roles: ['admin', 'deo', 'faculty', 'student'] },
    { name: 'Time Table', path: '/timetable', icon: Calendar, roles: ['admin', 'deo', 'faculty', 'student'] },
    { name: 'Resources', path: '/files', icon: FileText, roles: ['admin', 'deo', 'faculty', 'student'] },
    { name: 'Gallery', path: '/gallery', icon: Image, roles: ['admin', 'deo', 'faculty', 'student'] },
    { name: 'Calendar', path: '/calendar', icon: Calendar, roles: ['admin', 'deo', 'faculty', 'student'] },
    { name: 'Manage Users', path: '/admin/manage-users', icon: UserPlus, roles: ['admin', 'deo'] },
    { name: 'Academic Structure', path: '/admin/sections-years', icon: Settings, roles: ['admin', 'deo'] },
    { name: 'System Logs', path: '/admin/notification-log', icon: Settings, roles: ['admin', 'deo'] },
  ];

  const visibleNavItems = navItems.filter(item => {
    if (!item.roles.includes(user?.role)) return false;
    return true;
  });

  const renderSidebar = () => {
    if (tier === 'phone') return null;

    const isCollapsed = tier === 'tablet';

    return (
      <aside className={cn(
        "flex flex-col border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 transition-all duration-300",
        isCollapsed ? "w-20 items-center" : "w-64"
      )}>
        <div className={cn(
          "p-4 flex items-center justify-between border-b border-gray-200 dark:border-gray-800",
          isCollapsed ? "justify-center" : ""
        )}>
          <div className="flex items-center gap-2.5">
            <img src="/icon.png" alt="CSE HUB Logo" className="w-9 h-9 object-contain rounded-xl shadow-sm" />
            {!isCollapsed && (
              <div>
                <span className="font-extrabold text-base tracking-tight dark:text-white block">CSE HUB</span>
                <span className="text-xs text-gray-400 uppercase font-bold tracking-wider block -mt-0.5">Department Portal</span>
              </div>
            )}
          </div>
        </div>
        
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto w-full">
          {visibleNavItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              title={isCollapsed ? item.name : undefined}
              className={({ isActive }) => cn(
                "flex items-center gap-3 rounded-xl text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500",
                isCollapsed ? "justify-center p-3" : "px-3.5 py-2.5",
                isActive 
                  ? "bg-brand-50 text-brand-700 dark:bg-brand-900/20 dark:text-brand-400 shadow-sm" 
                  : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
              )}
            >
              <item.icon size={19} />
              {!isCollapsed && item.name}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-200 dark:border-gray-800 space-y-2 w-full">
          {['admin', 'deo'].includes(user?.role) && (
            <NavLink to="/board" target="_blank" className={cn(
              "flex items-center gap-3 rounded-xl text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500",
              isCollapsed ? "justify-center p-3" : "px-3.5 py-2.5",
              "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
            )} title={isCollapsed ? "Board Mode" : undefined}>
              <MonitorPlay size={19} />
              {!isCollapsed && "Board Display"}
            </NavLink>
          )}
          <NavLink to="/profile" className={({ isActive }) => cn(
            "flex items-center gap-3 rounded-xl text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500",
            isCollapsed ? "justify-center p-3" : "px-3.5 py-2.5",
            isActive ? "bg-brand-50 text-brand-700 dark:bg-brand-900/20 dark:text-brand-400" : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
          )} title={isCollapsed ? "Profile" : undefined}>
            <User size={19} /> {!isCollapsed && "Profile"}
          </NavLink>
          <NavLink to="/settings" className={({ isActive }) => cn(
            "flex items-center gap-3 rounded-xl text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500",
            isCollapsed ? "justify-center p-3" : "px-3.5 py-2.5",
            isActive ? "bg-brand-50 text-brand-700 dark:bg-brand-900/20 dark:text-brand-400" : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
          )} title={isCollapsed ? "Settings" : undefined}>
            <Settings size={19} /> {!isCollapsed && "Settings"}
          </NavLink>
          <button 
            onClick={handleLogout}
            title={isCollapsed ? "Logout" : undefined}
            className={cn(
              "w-full flex items-center gap-3 rounded-xl text-sm font-semibold text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500",
              isCollapsed ? "justify-center p-3" : "px-3.5 py-2.5"
            )}
          >
            <LogOut size={19} /> {!isCollapsed && "Logout"}
          </button>
        </div>
      </aside>
    );
  };

  const renderBottomNav = () => {
    if (tier !== 'phone') return null;

    return (
      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-gray-950/95 backdrop-blur-md border-t border-gray-200 dark:border-gray-800 flex justify-around px-2 py-1.5 pb-[calc(env(safe-area-inset-bottom)+6px)] z-40">
        {[
          { name: 'Home', path: '/dashboard', icon: Home },
          { name: 'Schedule', path: '/timetable', icon: Calendar },
          { name: 'Updates', path: '/announcements', icon: Bell },
          { name: 'Resources', path: '/files', icon: FileText },
          { name: 'Profile', path: '/profile', icon: User },
        ].map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => cn(
              "relative flex flex-col items-center justify-center w-full py-1.5 transition-all",
              isActive ? "text-brand-600 dark:text-brand-400 font-bold" : "text-gray-500 dark:text-gray-400 font-medium"
            )}
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.div
                    layoutId="activeTabPill"
                    className="absolute inset-x-1.5 top-0.5 bottom-0.5 bg-brand-50/90 dark:bg-brand-900/30 rounded-2xl -z-10"
                    transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                  />
                )}
                <item.icon size={21} className={cn("transition-transform", isActive ? "scale-110 active:scale-95" : "active:scale-95")} />
                <span className="text-xs mt-0.5">{item.name}</span>
              </>
            )}
          </NavLink>
        ))}
        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className="flex flex-col items-center justify-center w-full py-1.5 text-gray-500 dark:text-gray-400 font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded-xl active:scale-95 transition-transform"
        >
          <Menu size={21} />
          <span className="text-xs mt-0.5">More</span>
        </button>
      </nav>
    );
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden">
      {renderSidebar()}

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Top Header */}
        <header className={cn(
          "h-16 flex items-center justify-between px-4 sm:px-6 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 z-10",
          tier === 'phone' ? "pt-[env(safe-area-inset-top)]" : "" // Handle notch padding on phone top bar
        )}>
          <div className={cn("flex items-center gap-2.5", tier === 'phone' ? "flex" : "hidden")}>
            <img src="/icon.png" alt="CSE HUB Logo" className="w-8 h-8 object-contain rounded-lg" />
            <span className="font-extrabold text-base tracking-tight dark:text-white">CSE HUB</span>
          </div>

          <div className="flex-1 flex justify-end items-center gap-3">
            {['admin', 'deo', 'faculty'].includes(user?.role) && (
              <SearchOverlay />
            )}
            <NotificationBell />
          </div>
        </header>

        {/* Page Content */}
        <div className={cn(
          "flex-1 overflow-y-auto p-4 sm:p-6",
          tier === 'phone' ? "pb-24" : "pb-6"
        )} id="main-scroll-container">
          <div className={cn(
            "h-full",
            tier === 'desktop' || tier === 'board' ? "max-w-7xl mx-auto" : "max-w-full"
          )}>
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={tier === 'phone' ? { opacity: 0, x: 20 } : { opacity: 0, y: 10 }} // Slide transition for phone
                animate={tier === 'phone' ? { opacity: 1, x: 0 } : { opacity: 1, y: 0 }}
                exit={tier === 'phone' ? { opacity: 0, x: -20 } : { opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="h-full"
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </main>

      {renderBottomNav()}

      {/* Mobile Menu Overlay */}
      {tier === 'phone' && isMobileMenuOpen && (
        <div className="fixed inset-0 z-[60] bg-white dark:bg-gray-950 flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-200">
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 pt-[env(safe-area-inset-top)]">
            <div className="flex items-center gap-2">
              <img src="/icon.png" alt="CSE HUB Logo" className="w-8 h-8 object-contain rounded-lg" />
              <span className="font-bold text-base dark:text-white">CSE HUB Menu</span>
            </div>
            <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors active:scale-90">
              <X size={22} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-1.5 bg-gray-50 dark:bg-gray-900 pb-[env(safe-area-inset-bottom)]">
            {visibleNavItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={({ isActive }) => cn(
                  "flex items-center gap-3.5 px-4 py-3 rounded-2xl text-sm font-semibold transition-all shadow-sm active:scale-[0.98]",
                  isActive 
                    ? "bg-brand-600 text-white shadow-brand-500/20" 
                    : "bg-white dark:bg-gray-950 text-gray-700 dark:text-gray-300 border border-gray-100 dark:border-gray-800"
                )}
              >
                {({ isActive }) => (
                  <>
                    <item.icon size={20} className={cn(isActive ? "text-white" : "text-gray-500 dark:text-gray-400")} />
                    {item.name}
                  </>
                )}
              </NavLink>
            ))}
            
            <div className="pt-4 mt-4 border-t border-gray-200 dark:border-gray-800 space-y-1.5">
              <NavLink
                to="/settings"
                onClick={() => setIsMobileMenuOpen(false)}
                className={({ isActive }) => cn(
                  "flex items-center gap-3.5 px-4 py-3 rounded-2xl text-sm font-semibold transition-all shadow-sm active:scale-[0.98]",
                  isActive ? "bg-brand-600 text-white" : "bg-white dark:bg-gray-950 text-gray-700 dark:text-gray-300 border border-gray-100 dark:border-gray-800"
                )}
              >
                {({ isActive }) => (
                  <>
                    <Settings size={20} className={cn(isActive ? "text-white" : "text-gray-500 dark:text-gray-400")} />
                    Settings
                  </>
                )}
              </NavLink>
              
              <button
                onClick={() => { setIsMobileMenuOpen(false); handleLogout(); }}
                className="w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl text-sm font-semibold bg-white dark:bg-gray-950 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900/30 shadow-sm mt-3 active:scale-[0.98] transition-transform"
              >
                <LogOut size={20} />
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

      <InstallPrompt />
    </div>
  );
};

export default AppShell;
