import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useProject } from '../context/ProjectContext';
import { 
  Building2, 
  FolderPlus, 
  LogOut, 
  Bot, 
  Menu, 
  Bell, 
  ShieldCheck, 
  Building,
  CheckCircle2
} from 'lucide-react';

export const Navbar = ({ onOpenChat, onToggleSidebar, isSidebarCollapsed }) => {
  const { user, logout, isAdmin } = useAuth();
  const { projects, currentProject, selectProjectById } = useProject();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-40 bg-white text-slate-800 border-b border-slate-200 shadow-xs">
      <div className="px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        
        {/* Left Side: Sidebar Toggle & Project Selector matching Image 1 */}
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          {/* Sidebar Toggle Button */}
          {user && (
            <button
              onClick={onToggleSidebar}
              className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors shrink-0"
              title={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          {/* Project Label & Selector Pill */}
          {user && currentProject && (
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-xs font-semibold text-slate-500 shrink-0 hidden sm:inline">
                Project:
              </span>

              <div className="relative flex items-center bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl px-2.5 py-1.5 transition-colors group cursor-pointer max-w-[200px] sm:max-w-[260px]">
                {/* Project Mini-Thumbnail */}
                <div className="w-6 h-6 rounded-md overflow-hidden bg-slate-200 border border-slate-300 shrink-0 mr-2">
                  <img
                    src="/assets/designs/exterior_modern_3f.jpg"
                    alt="Project Thumbnail"
                    className="w-full h-full object-cover"
                  />
                </div>

                <span className="text-xs font-bold text-slate-800 truncate mr-1.5">
                  {currentProject.name || 'Dream Villa'}
                </span>

                <svg className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>

                {/* Hidden native select for accessible project switching */}
                <select
                  value={currentProject?._id || currentProject?.id || ''}
                  onChange={(e) => selectProjectById(e.target.value)}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  title="Switch Active Project"
                >
                  {projects.map((p) => (
                    <option key={p._id || p.id} value={p._id || p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Actions, AI Assistant, Notifications, User Profile */}
        <div className="flex items-center gap-2.5 shrink-0">
          {user ? (
            <>
              {/* + New Project Button matching Image 1 */}
              <Link
                to="/wizard"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm shadow-blue-600/25 transition-all"
              >
                <FolderPlus className="w-3.5 h-3.5" />
                <span>New Project</span>
              </Link>

              {/* AI Assistant Button matching Image 1 */}
              <button
                onClick={onOpenChat}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 text-xs font-bold transition-all shadow-xs"
                title="Open AI House Planning Assistant"
              >
                <Bot className="w-4 h-4 text-blue-600" />
                <span className="hidden sm:inline">AI Assistant</span>
              </button>

              {/* Notification Icon matching Image 1 with red badge */}
              <button
                className="relative p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                title="Project Notifications"
              >
                <Bell className="w-4 h-4" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white"></span>
              </button>

              {/* Admin Link if authorized */}
              {isAdmin && (
                <Link
                  to="/admin"
                  className="hidden lg:inline-flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-2.5 py-1.5 rounded-xl border border-amber-200 font-semibold"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Admin</span>
                </Link>
              )}

              {/* User Profile Info & Logout */}
              <div className="flex items-center gap-2.5 pl-2 border-l border-slate-200">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center text-xs font-bold shadow-xs">
                  {user.name ? user.name.charAt(0).toUpperCase() : 'I'}
                </div>

                <div className="flex items-center gap-1 cursor-pointer">
                  <span className="text-xs font-bold text-slate-800 hidden sm:inline">
                    {user.name || 'Indusri'}
                  </span>
                  <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>

                <button
                  onClick={handleLogout}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-red-500 hover:bg-slate-100 transition-colors"
                  title="Log Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                to="/login"
                className="text-xs text-slate-600 hover:text-slate-900 font-semibold px-3 py-1.5"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-sm transition-all"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>

      </div>
    </header>
  );
};

export default Navbar;
