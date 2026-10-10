import React from 'react';
import { NavLink } from 'react-router-dom';
import { useProject } from '../context/ProjectContext';
import {
  Layers,
  Palette,
  Building2,
  Compass,
  Calculator,
  CalendarCheck,
  PackageCheck,
  Receipt,
  FileDown,
  Camera,
  Home,
  Sparkles
} from 'lucide-react';

export const Sidebar = () => {
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
    { label: 'Package Comparison', path: `/project/${projectId}/packages`, icon: PackageCheck },
    { label: 'Expenses & Invoices', path: `/project/${projectId}/expenses`, icon: Receipt },
    { label: 'Site CV Analyzer', path: `/project/${projectId}/site-analysis`, icon: Camera },
    { label: 'Reports & Portfolio', path: `/project/${projectId}/reports`, icon: FileDown },
  ];

  if (!currentProject) {
    return null;
  }

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col border-r border-slate-800 shrink-0">
      
      {/* Project Card Header */}
      <div className="p-4 border-b border-slate-800">
        <span className="text-[10px] uppercase font-bold tracking-wider text-blue-400">Active Workspace</span>
        <h2 className="text-sm font-bold text-white truncate mt-0.5">{currentProject.name}</h2>
        <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400">
          <span>{currentProject.plot?.width}' x {currentProject.plot?.length}'</span>
          <span>•</span>
          <span className="text-blue-400 font-semibold">{currentProject.selectedPackage || 'MEDIUM'} Tier</span>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="truncate">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Footer Info */}
      <div className="p-4 border-t border-slate-800 text-[11px] text-slate-500">
        <p>Plot: {currentProject.plot?.area || 1500} sq.ft | {currentProject.accommodation?.floors || 1} Floor(s)</p>
        <p className="mt-0.5 text-slate-400 font-medium truncate">{currentProject.location}</p>
      </div>

    </aside>
  );
};

export default Sidebar;
