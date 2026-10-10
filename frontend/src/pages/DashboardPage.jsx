import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useProject } from '../context/ProjectContext';
import { useAuth } from '../context/AuthContext';
import { 
  Building2, 
  FolderPlus, 
  Layers, 
  Compass, 
  Calculator, 
  ArrowRight, 
  Trash2, 
  CalendarCheck,
  CheckCircle2,
  TrendingUp,
  MapPin
} from 'lucide-react';
import { projectApi } from '../services/api';

export const DashboardPage = () => {
  const { user } = useAuth();
  const { projects, fetchProjects, setCurrentProject } = useProject();
  const navigate = useNavigate();

  const handleOpenProject = (project) => {
    setCurrentProject(project);
    navigate(`/project/${project._id || project.id}`);
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this project and all associated data?')) {
      await projectApi.delete(id);
      fetchProjects();
    }
  };

  const totalEstimatedValue = projects.reduce((acc, p) => acc + (p.budget || 0), 0);

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8">
      
      {/* Header Banner */}
      <div className="bg-slate-900 rounded-3xl p-6 sm:p-8 text-white flex flex-wrap items-center justify-between gap-6 shadow-sm border border-slate-800">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-blue-400">Welcome Back</span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1">{user?.name}'s Dashboard</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xl">
            Manage your architectural designs, geometric floor plans, transparent BOQ estimates, and construction progress.
          </p>
        </div>

        <Link
          to="/wizard"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all hover:scale-105"
        >
          <FolderPlus className="w-4 h-4" />
          <span>New House Project</span>
        </Link>
      </div>

      {/* KPI Overview Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Saved Projects</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">{projects.length}</h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Building2 className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Planned Budget</p>
            <h3 className="text-2xl font-bold text-blue-600 mt-1">₹ {totalEstimatedValue.toLocaleString('en-IN')}</h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Calculator className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Region</p>
            <h3 className="text-xl font-bold text-slate-900 mt-1">Warangal / Telangana</h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <MapPin className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Projects List Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-900">Your House Projects</h2>
          <span className="text-xs text-slate-500">{projects.length} active workspace(s)</span>
        </div>

        {projects.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-slate-300">
            <Building2 className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-900">No House Projects Yet</h3>
            <p className="text-xs text-slate-500 mt-1 mb-5 max-w-sm mx-auto">
              Start planning your residential house with our multi-step wizard to generate customized floor plans and cost estimates.
            </p>
            <Link
              to="/wizard"
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-sm transition-colors"
            >
              <FolderPlus className="w-4 h-4" />
              <span>Launch Project Wizard</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((p) => {
              const pid = p._id || p.id;
              return (
                <div
                  key={pid}
                  onClick={() => handleOpenProject(p)}
                  className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-400 p-5 cursor-pointer transition-all flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors truncate">
                        {p.name}
                      </h3>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                        {p.selectedPackage || 'MEDIUM'}
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 flex items-center gap-1 mb-4">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span className="truncate">{p.location} ({p.pincode})</span>
                    </p>

                    <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 rounded-xl text-xs mb-4">
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Plot Size</span>
                        <span className="font-semibold text-slate-800">{p.plot?.width}' x {p.plot?.length}' ({p.plot?.area} sq.ft)</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Facing</span>
                        <span className="font-semibold text-slate-800">{p.plot?.facingDirection || 'East'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Floors & Beds</span>
                        <span className="font-semibold text-slate-800">{p.accommodation?.floors || 1}F / {p.accommodation?.bedrooms || 3} BHK</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Budget</span>
                        <span className="font-semibold text-blue-600">₹ {Number(p.budget || 0).toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <button
                      onClick={(e) => handleDelete(e, pid)}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete Project"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <span className="inline-flex items-center gap-1 font-semibold text-blue-600 group-hover:translate-x-0.5 transition-transform">
                      Open Workspace <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};

export default DashboardPage;
