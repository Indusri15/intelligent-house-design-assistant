import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useProject } from '../context/ProjectContext';
import {
  Layers,
  Compass,
  Calculator,
  CalendarCheck,
  Receipt,
  ArrowRight,
  MapPin,
  TrendingUp,
  FileDown,
  Sparkles,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { vastuApi, estimationApi, progressApi, floorPlanApi } from '../services/api';
import FloorPlanViewer from '../components/FloorPlanViewer';

export const ProjectOverviewPage = () => {
  const { id } = useParams();
  const { currentProject, selectProjectById } = useProject();
  const [floorPlan, setFloorPlan] = useState(null);
  const [vastu, setVastu] = useState(null);
  const [estimate, setEstimate] = useState(null);
  const [progressMetrics, setProgressMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id && (!currentProject || (currentProject._id !== id && currentProject.id !== id))) {
      selectProjectById(id);
    }
  }, [id]);

  useEffect(() => {
    const loadProjectBundle = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const [fpRes, vastuRes, estRes, progRes] = await Promise.allSettled([
          floorPlanApi.get(id),
          vastuApi.get(id),
          estimationApi.get(id),
          progressApi.getStages(id)
        ]);

        if (fpRes.status === 'fulfilled' && fpRes.value.data.success) setFloorPlan(fpRes.value.data.floorPlan);
        if (vastuRes.status === 'fulfilled' && vastuRes.value.data.success) setVastu(vastuRes.value.data.vastu);
        if (estRes.status === 'fulfilled' && estRes.value.data.success) setEstimate(estRes.value.data.estimate);
        if (progRes.status === 'fulfilled' && progRes.value.data.success) setProgressMetrics(progRes.value.data.metrics);
      } catch (err) {
        console.error('Error loading project bundle:', err);
      } finally {
        setLoading(false);
      }
    };

    loadProjectBundle();
  }, [id]);

  if (!currentProject) {
    return (
      <div className="p-8 text-center text-slate-500 text-xs">
        Loading project workspace...
      </div>
    );
  }

  const budget = currentProject.budget || 3500000;
  const estimatedTotal = estimate?.totalEstimatedCost || 3200000;
  const diff = budget - estimatedTotal;
  const vastuScore = vastu?.overallScore || 85;
  const progressPercent = progressMetrics?.overallPercentage || 5;

  return (
    <div className="space-y-6">
      
      {/* Overview Top Header Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
              {currentProject.selectedPackage || 'MEDIUM'} TIER
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              {currentProject.location}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">{currentProject.name}</h1>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            {currentProject.description || 'Residential architecture planned with non-overlapping geometric spaces, Vastu orientation, and itemized BOQ.'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to={`/project/${id}/reports`}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
          >
            <FileDown className="w-4 h-4" />
            <span>Download Reports</span>
          </Link>
          <Link
            to={`/project/${id}/floor-plan`}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-sm transition-colors"
          >
            <Layers className="w-4 h-4" />
            <span>Floor Plan Studio</span>
          </Link>
        </div>
      </div>

      {/* 4 Summary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Estimated Cost */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Estimated Total</span>
          <h3 className="text-xl font-bold text-slate-900 mt-1">₹ {estimatedTotal.toLocaleString('en-IN')}</h3>
          <p className={`text-[11px] font-medium mt-1 ${diff >= 0 ? 'text-emerald-600' : 'text-amber-600'}`}>
            {diff >= 0 ? `₹${Math.abs(diff).toLocaleString('en-IN')} below budget` : `₹${Math.abs(diff).toLocaleString('en-IN')} over budget`}
          </p>
        </div>

        {/* Built-Up Area */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Built-Up Area</span>
          <h3 className="text-xl font-bold text-slate-900 mt-1">{floorPlan?.totalBuiltUpAreaSqFt || 1500} sq.ft</h3>
          <p className="text-[11px] text-slate-500 mt-1">
            ₹ {estimate?.costPerSqFt || 2150} / sq.ft ({currentProject.accommodation?.floors || 1} Floors)
          </p>
        </div>

        {/* Vastu Compliance */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Vastu Compliance</span>
          <div className="flex items-center gap-2 mt-1">
            <h3 className="text-xl font-bold text-slate-900">{vastuScore}/100</h3>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700">
              {vastu?.grade || 'GOOD'}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Facing: {currentProject.plot?.facingDirection || 'East'}</p>
        </div>

        {/* Construction Progress */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Overall Progress</span>
          <h3 className="text-xl font-bold text-blue-600 mt-1">{progressPercent}%</h3>
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
            <div className="bg-blue-600 h-full rounded-full transition-all duration-500" style={{ width: `${progressPercent}%` }}></div>
          </div>
        </div>

      </div>

      {/* Main Content Layout: Live Floor Plan Preview + Quick Navigation Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Live SVG Floor Plan Preview */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-600" />
              <span>Architectural Floor Plan</span>
            </h2>
            <Link to={`/project/${id}/floor-plan`} className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1">
              Interactive Studio <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <FloorPlanViewer floorPlan={floorPlan} project={currentProject} />
        </div>

        {/* Quick Module Access Panel */}
        <div className="space-y-4">
          <h2 className="text-base font-bold text-slate-900">Project Modules</h2>

          <div className="space-y-3">
            <Link
              to={`/project/${id}/boq`}
              className="block p-4 rounded-xl bg-white border border-slate-200 hover:border-blue-400 hover:shadow-sm transition-all group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <Calculator className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 group-hover:text-blue-600">Bill of Quantities (BOQ)</h4>
                    <p className="text-[11px] text-slate-500">28 material & labour categories</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>

            <Link
              to={`/project/${id}/packages`}
              className="block p-4 rounded-xl bg-white border border-slate-200 hover:border-blue-400 hover:shadow-sm transition-all group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 group-hover:text-blue-600">Package Comparison</h4>
                    <p className="text-[11px] text-slate-500">Basic vs Medium vs Rich finishes</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>

            <Link
              to={`/project/${id}/vastu`}
              className="block p-4 rounded-xl bg-white border border-slate-200 hover:border-blue-400 hover:shadow-sm transition-all group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                    <Compass className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 group-hover:text-blue-600">Vastu Analysis Studio</h4>
                    <p className="text-[11px] text-slate-500">Cardinal orientations & remedies</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>

            <Link
              to={`/project/${id}/progress`}
              className="block p-4 rounded-xl bg-white border border-slate-200 hover:border-blue-400 hover:shadow-sm transition-all group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                    <CalendarCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 group-hover:text-blue-600">Construction Timeline</h4>
                    <p className="text-[11px] text-slate-500">21 standardized milestone stages</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>

            <Link
              to={`/project/${id}/expenses`}
              className="block p-4 rounded-xl bg-white border border-slate-200 hover:border-blue-400 hover:shadow-sm transition-all group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                    <Receipt className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 group-hover:text-blue-600">Expense & Invoice Tracker</h4>
                    <p className="text-[11px] text-slate-500">Estimated vs actual spending</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          </div>

        </div>

      </div>

    </div>
  );
};

export default ProjectOverviewPage;
