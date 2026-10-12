import React from 'react';
import { NavLink } from 'react-router-dom';
import { useProject } from '../context/ProjectContext';
import {
  Home,
  Layers,
  Palette,
  Building2,
  Compass,
  Calculator,
  CalendarCheck,
  Package,
  Receipt,
  Camera,
  FileDown,
  Building,
  Sparkles,
  ChevronRight
} from 'lucide-react';

export const Sidebar = ({ isCollapsed, onToggleCollapse }) => {
  const { currentProject } = useProject();
  const projectId = currentProject?._id || currentProject?.id || 'active';

  const navItems = [
    { label: 'Project Overview', path: `/project/${projectId}`, icon: Home, end: true },
    { label: 'Floor Plans', path: `/project/${projectId}/floor-plan`, icon: Layers },
    { label: 'Interior Design', path: `/project/${projectId}/interior`, icon: Palette },
    { label: 'Exterior Design', path: `/project/${projectId}/exterior`, icon: Building2 },
    { label: 'Vastu Analysis', path: `/project/${projectId}/vastu`, icon: Compass },
    { label: 'Cost Estimation', path: `/project/${projectId}/boq`, icon: Calculator },
    { label: 'Construction Progress', path: `/project/${projectId}/progress`, icon: CalendarCheck },
    { label: 'Expenses & Invoices', path: `/project/${projectId}/expenses`, icon: Receipt },
    { label: 'Site CV Analyzer', path: `/project/${projectId}/site-analysis`, icon: Camera },
    { label: 'Reports & Portfolio', path: `/project/${projectId}/reports`, icon: FileDown },
  ];

  if (!currentProject) {
    return null;
  }

  return (
    <aside
      className={`bg-[#0B132B] text-slate-300 flex flex-col border-r border-slate-800/80 shrink-0 transition-all duration-300 z-30 select-none ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/25 shrink-0">
            <Building className="w-5 h-5 text-white" />
          </div>
          {!isCollapsed && (
            <div className="min-w-0">
              <span className="text-sm font-black tracking-tight text-white truncate block">
                ArchPlan AI
              </span>
              <p className="text-[10px] text-slate-400 truncate mt-0.5 font-medium">
                Intelligent House Design & Construction
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto scrollbar-none">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.label}
              to={item.path}
              end={item.end}
              title={isCollapsed ? item.label : undefined}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all group ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 font-bold'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" />
              {!isCollapsed && <span className="truncate">{item.label}</span>}
              {!isCollapsed && (
                <ChevronRight className="w-3.5 h-3.5 ml-auto opacity-0 group-hover:opacity-100 transition-opacity text-slate-400" />
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom Architectural Visual Card & Brand Tagline matching Image 1 */}
      {!isCollapsed && (
        <div className="p-3 border-t border-slate-800/80 space-y-2.5">
          <div className="relative rounded-2xl overflow-hidden aspect-[16/10] border border-slate-800 group shadow-md">
            <img
              src="/assets/designs/exterior_modern_3f.jpg"
              alt="Architectural Villa Reference"
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent flex flex-col justify-end p-2.5">
              <span className="text-[9px] font-bold text-blue-300 uppercase tracking-wider">
                ArchPlan AI Architecture
              </span>
            </div>
          </div>
          <div className="px-1 text-[11px] font-semibold text-slate-400 leading-tight space-y-0.5">
            <p className="text-slate-300">Design Smarter</p>
            <p className="text-slate-400">Build Better</p>
            <p className="text-slate-500">Live Happier</p>
          </div>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
