import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Sun, 
  Moon, 
  Plus, 
  LogOut, 
  Layers, 
  Menu, 
  Bell,
  UserCheck,
  Settings
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { NotificationsDropdown } from './NotificationsDropdown';
import { NewProjectModal } from './NewProjectModal';
import { EditProfileModal } from './EditProfileModal';
import { getUserAvatar } from '../utils/avatar';

interface NavbarProps {
  onToggleSidebar?: () => void;
  onProjectCreated?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ 
  onToggleSidebar, 
  onProjectCreated
}) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const displayName = user?.name ? user.name.split(' ')[0] : (user?.email?.split('@')[0] || 'User');

  return (
    <>
      <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#111827] px-6 transition-colors shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
        {/* Left: Brand Logo & Title */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="p-1.5 -ml-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 md:hidden focus:outline-none"
            aria-label="Toggle Menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#4f46e5] text-white shadow-sm transition-transform group-hover:scale-105">
              <Layers className="w-5 h-5" />
            </div>
            <span className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
              TaskFlow
            </span>
          </Link>
        </div>

        {/* Right: + New Project pill, Theme, Notifications, Avatar */}
        <div className="flex items-center gap-4">
          {/* + New Project pill button */}
          <button
            onClick={() => setShowNewProjectModal(true)}
            className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full bg-[#4f46e5] hover:bg-[#4338ca] text-white text-xs font-semibold shadow-sm transition-all hover:shadow active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Project</span>
          </button>

          {/* Theme Switcher Moon/Sun */}
          <button
            onClick={toggleTheme}
            className="p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition focus:outline-none"
            title={theme === 'dark' ? 'Switch to Light mode' : 'Switch to Dark mode'}
          >
            {theme === 'dark' ? (
              <Sun className="w-5 h-5 text-amber-400" />
            ) : (
              <Moon className="w-5 h-5" />
            )}
          </button>

          {/* Notifications Dropdown (Bell icon inside rounded border) */}
          <NotificationsDropdown />

          {/* User Profile matching reference */}
          <div className="relative" ref={profileMenuRef}>
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-2 py-1 px-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition focus:outline-none"
            >
              <img
                src={getUserAvatar(user, displayName)}
                alt={displayName}
                className="w-8 h-8 rounded-full object-cover ring-2 ring-indigo-500/20 shadow-xs"
              />
              <span className="hidden sm:block text-xs font-bold text-slate-800 dark:text-slate-200">
                {displayName}
              </span>
            </button>

            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white dark:bg-slate-900 shadow-xl border border-slate-200 dark:border-slate-800 p-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 mb-1 flex items-center gap-2.5">
                  <img
                    src={getUserAvatar(user, displayName)}
                    alt={displayName}
                    className="w-9 h-9 rounded-full object-cover ring-1 ring-slate-200 dark:ring-slate-700"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{user?.name || displayName}</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{user?.email || 'user@example.com'}</p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    setShowEditProfileModal(true);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded-xl transition font-medium"
                >
                  <Settings className="w-4 h-4 text-indigo-500" />
                  <span>Edit Profile & Avatar</span>
                </button>

                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    setShowNewProjectModal(true);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded-xl transition font-medium"
                >
                  <Plus className="w-4 h-4 text-indigo-500" />
                  <span>Create Project</span>
                </button>

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition font-medium"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {showNewProjectModal && (
        <NewProjectModal
          onClose={() => setShowNewProjectModal(false)}
          onSuccess={() => {
            setShowNewProjectModal(false);
            if (onProjectCreated) onProjectCreated();
          }}
        />
      )}

      {showEditProfileModal && (
        <EditProfileModal
          onClose={() => setShowEditProfileModal(false)}
        />
      )}
    </>
  );
};
