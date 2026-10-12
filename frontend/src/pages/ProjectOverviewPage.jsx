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
  AlertCircle,
  Edit3,
  RefreshCw,
  X,
  Save,
  Building,
  Check,
  Maximize2,
  Building2,
  Palette,
  Bot,
  Activity,
  ChevronRight,
  Eye,
  Clock,
  Coins,
  ShieldCheck
} from 'lucide-react';
import { vastuApi, estimationApi, progressApi, floorPlanApi, projectApi, resolveImageUrl } from '../services/api';
import FloorPlanViewer from '../components/FloorPlanViewer';

export const ProjectOverviewPage = () => {
  const { id } = useParams();
  const { currentProject, selectProjectById, setCurrentProject } = useProject();
  const [floorPlan, setFloorPlan] = useState(null);
  const [vastu, setVastu] = useState(null);
  const [estimate, setEstimate] = useState(null);
  const [progressMetrics, setProgressMetrics] = useState(null);
  const [stages, setStages] = useState([]);
  const [loading, setLoading] = useState(true);

  // Preview tab state: 'floor_plan' | 'exterior' | 'interior'
  const [activePreviewTab, setActivePreviewTab] = useState('exterior');

  // Edit Requirements & Regeneration States
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [isStale, setIsStale] = useState(false);
  const [toast, setToast] = useState(null);
  const [confirmRegenModal, setConfirmRegenModal] = useState(false);

  // Edit Form State
  const [editForm, setEditForm] = useState({
    name: '',
    location: '',
    budget: 3500000,
    selectedPackage: 'MEDIUM',
    plotLength: 50,
    plotWidth: 30,
    plotFacing: 'East',
    floors: 2,
    bedrooms: 3,
    bathrooms: 3,
    livingRoom: true,
    diningRoom: true,
    kitchen: true,
    poojaRoom: true,
    utilityArea: true,
    balcony: true,
    studyRoom: false,
    parking: true,
    style: 'Modern Indian house',
    autoRegenerate: true
  });

  useEffect(() => {
    if (id && (!currentProject || (currentProject._id !== id && currentProject.id !== id))) {
      selectProjectById(id);
    }
  }, [id]);

  // Sync form when currentProject changes
  useEffect(() => {
    if (currentProject) {
      setEditForm({
        name: currentProject.name || '',
        location: currentProject.location || '',
        budget: currentProject.budget || 3500000,
        selectedPackage: currentProject.selectedPackage || 'MEDIUM',
        plotLength: currentProject.plot?.length || 50,
        plotWidth: currentProject.plot?.width || 30,
        plotFacing: currentProject.plot?.facingDirection || 'East',
        floors: currentProject.accommodation?.floors || 2,
        bedrooms: currentProject.accommodation?.bedrooms || 3,
        bathrooms: currentProject.accommodation?.bathrooms || 3,
        livingRoom: currentProject.accommodation?.livingRoom ?? true,
        diningRoom: currentProject.accommodation?.diningRoom ?? true,
        kitchen: currentProject.accommodation?.kitchen ?? true,
        poojaRoom: currentProject.accommodation?.poojaRoom ?? true,
        utilityArea: currentProject.accommodation?.utilityArea ?? true,
        balcony: currentProject.accommodation?.balcony ?? true,
        studyRoom: currentProject.accommodation?.studyRoom ?? false,
        parking: currentProject.accommodation?.parking ?? true,
        style: currentProject.preferences?.style || 'Modern Indian house',
        autoRegenerate: true
      });
    }
  }, [currentProject]);

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
      if (progRes.status === 'fulfilled' && progRes.value.data.success) {
        setProgressMetrics(progRes.value.data.metrics);
        setStages(progRes.value.data.stages || []);
      }
    } catch (err) {
      console.error('Error loading project bundle:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjectBundle();
  }, [id]);

  // Save Project Requirements
  const handleSaveRequirements = async (e) => {
    e.preventDefault();
    if (!id) return;

    // Validation
    const length = Number(editForm.plotLength);
    const width = Number(editForm.plotWidth);
    const budgetVal = Number(editForm.budget);
    if (length <= 10 || width <= 10) {
      setToast('⚠️ Plot length and width must each be greater than 10 ft.');
      setTimeout(() => setToast(null), 3000);
      return;
    }
    if (budgetVal < 100000) {
      setToast('⚠️ Budget must be at least ₹ 1,00,000.');
      setTimeout(() => setToast(null), 3000);
      return;
    }

    try {
      setSavingEdit(true);
      const payload = {
        name: editForm.name,
        location: editForm.location,
        budget: budgetVal,
        selectedPackage: editForm.selectedPackage,
        plot: {
          ...currentProject.plot,
          length,
          width,
          area: length * width,
          facingDirection: editForm.plotFacing
        },
        accommodation: {
          ...currentProject.accommodation,
          floors: Number(editForm.floors),
          bedrooms: Number(editForm.bedrooms),
          bathrooms: Number(editForm.bathrooms),
          livingRoom: Boolean(editForm.livingRoom),
          diningRoom: Boolean(editForm.diningRoom),
          kitchen: Boolean(editForm.kitchen),
          poojaRoom: Boolean(editForm.poojaRoom),
          utilityArea: Boolean(editForm.utilityArea),
          balcony: Boolean(editForm.balcony),
          studyRoom: Boolean(editForm.studyRoom),
          parking: Boolean(editForm.parking)
        },
        preferences: {
          ...currentProject.preferences,
          style: editForm.style
        }
      };

      const res = await projectApi.update(id, payload);
      if (res.data?.success) {
        setCurrentProject(res.data.project);
        setEditModalOpen(false);

        if (editForm.autoRegenerate) {
          // Immediately regenerate dependent floor plan & calculations
          await triggerRegenerateFloorPlan();
          setToast('✅ Requirements saved & Floor Plan successfully regenerated!');
        } else {
          setIsStale(true);
          setToast('✅ Requirements saved! Dependent floor plan & estimates marked outdated.');
        }
        setTimeout(() => setToast(null), 4000);
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || 'Failed to update requirements.';
      setToast(`❌ Error: ${errMsg}`);
      setTimeout(() => setToast(null), 4000);
    } finally {
      setSavingEdit(false);
    }
  };

  // Trigger Floor Plan Regeneration
  const triggerRegenerateFloorPlan = async () => {
    try {
      setRegenerating(true);
      const res = await floorPlanApi.generate(id);
      if (res.data?.success) {
        if (res.data.floorPlan) setFloorPlan(res.data.floorPlan);
        if (res.data.vastu) setVastu(res.data.vastu);
        if (res.data.boq) setEstimate(res.data.boq);
        setIsStale(false);
        setToast('⚡ Architectural floor plan, Vastu & BOQ recalculated!');
        setTimeout(() => setToast(null), 4000);
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || 'Floor plan regeneration failed.';
      setToast(`❌ Error: ${errMsg}`);
      setTimeout(() => setToast(null), 4000);
    } finally {
      setRegenerating(false);
      setConfirmRegenModal(false);
    }
  };

  if (!currentProject) {
    return (
      <div className="p-12 text-center text-slate-500 text-xs font-semibold">
        Loading project workspace...
      </div>
    );
  }

  const budget = currentProject.budget || 3500000;
  const estimatedTotal = estimate?.totalEstimatedCost || 3200000;
  const diff = budget - estimatedTotal;
  const vastuScore = vastu?.overallScore || 85;
  const progressPercent = progressMetrics?.overallPercentage || 5;
  const plotArea = (currentProject.plot?.length || 50) * (currentProject.plot?.width || 30);
  const numFloors = currentProject.accommodation?.floors || 2;
  const facingDir = currentProject.plot?.facingDirection || 'East';

  // Recent genuine project activity events
  const activityEvents = [
    { title: 'Project requirements saved', time: 'Initial setup', desc: `${plotArea} sq.ft • ${numFloors} Floors (${facingDir} Facing)` },
    { title: 'Geometric floor plan synthesized', time: 'Geometry Engine', desc: `${floorPlan?.totalBuiltUpAreaSqFt || 1500} sq.ft non-overlapping footprint` },
    { title: 'Vastu orientation verified', time: 'Vastu Shastra', desc: `Score: ${vastuScore}/100 • ${vastu?.grade || 'GOOD'} compliance` },
    { title: 'BOQ schedule & rates calculated', time: 'Cost Engine', desc: `₹ ${estimatedTotal.toLocaleString('en-IN')} across 28 categories` }
  ];

  return (
    <div className="space-y-3.5 pb-10">
      
      {/* Toast Alert */}
      {toast && (
        <div className="fixed top-20 right-8 z-50 p-4 bg-slate-900/95 text-white text-xs font-semibold rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-3 backdrop-blur-md animate-in slide-in-from-top-4">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{toast}</span>
        </div>
      )}

      {/* Outdated Stale Results Warning Banner */}
      {isStale && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 text-xs flex flex-wrap items-center justify-between gap-3 shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <span className="font-bold">Project Requirements were updated!</span>
              <span className="text-amber-800 ml-1">
                The active floor plan geometry, Vastu score, and BOQ estimates reflect older parameters and are OUTDATED.
              </span>
            </div>
          </div>
          <button
            onClick={() => setConfirmRegenModal(true)}
            disabled={regenerating}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${regenerating ? 'animate-spin' : ''}`} />
            <span>Regenerate Floor Plan Now</span>
          </button>
        </div>
      )}

      {/* SECTION C: COMPACT DARK ARCHITECTURAL HERO BANNER */}
      <div className="relative rounded-2xl lg:rounded-3xl overflow-hidden bg-gradient-to-r from-[#0B132B] via-[#111D3B] to-[#1A2644] text-white border border-slate-800 shadow-md min-h-[210px] lg:h-[220px] flex flex-col justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 items-center h-full">
          
          {/* Left Column: Project Information (Takes 8 cols on desktop) */}
          <div className="lg:col-span-8 p-4 sm:p-5 lg:py-4 lg:px-6 flex flex-col justify-between h-full">
            <div>
              {/* Header Row: Welcome & Utility Actions */}
              <div className="flex items-center justify-between gap-2">
                <p className="text-[11px] font-medium text-slate-400">
                  Welcome back, {currentProject.owner?.name || 'Indusri'} 👋
                </p>
                
                {/* Secondary Edit/Regenerate Controls Compact */}
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setEditModalOpen(true)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[10px] font-semibold border border-white/15 transition-all shadow-2xs"
                    title="Edit Project Requirements"
                  >
                    <Edit3 className="w-3 h-3 text-slate-300" />
                    <span>Edit Requirements</span>
                  </button>

                  <button
                    onClick={() => setConfirmRegenModal(true)}
                    disabled={regenerating}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[10px] font-semibold border border-white/15 transition-all shadow-2xs disabled:opacity-50"
                    title="Regenerate Architectural Plan"
                  >
                    <RefreshCw className={`w-3 h-3 text-slate-300 ${regenerating ? 'animate-spin' : ''}`} />
                    <span>{regenerating ? 'Regenerating...' : 'Regenerate Plan'}</span>
                  </button>
                </div>
              </div>

              {/* Title & Active Badge */}
              <div className="flex items-center gap-2.5 mt-0.5">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-white tracking-tight leading-tight">
                  {currentProject.name || 'Dream Villa'}
                </h1>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Active Project
                </span>
              </div>

              {/* Description */}
              <p className="text-[11px] sm:text-xs text-slate-300 mt-0.5 line-clamp-1 max-w-xl leading-normal">
                {currentProject.description || 'AI-powered house design, planning and construction assistant to turn your dream home into reality.'}
              </p>
            </div>

            {/* SINGLE COMPACT HORIZONTAL ROW: 4 Project Specs + View Details Button */}
            <div className="flex items-center gap-2 lg:gap-2.5 pt-2.5 overflow-x-auto scrollbar-none flex-nowrap">
              {/* 1. Site Area */}
              <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-white/5 border border-white/10 shrink-0">
                <div className="w-6 h-6 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                  <Maximize2 className="w-3 h-3" />
                </div>
                <div className="leading-tight">
                  <span className="text-[9px] uppercase font-bold text-slate-400 block">Site Area</span>
                  <span className="text-xs font-black text-white block">{plotArea} sq.ft</span>
                </div>
              </div>

              {/* 2. Facing */}
              <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-white/5 border border-white/10 shrink-0">
                <div className="w-6 h-6 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                  <Compass className="w-3 h-3" />
                </div>
                <div className="leading-tight">
                  <span className="text-[9px] uppercase font-bold text-slate-400 block">Facing</span>
                  <span className="text-xs font-black text-white block">{facingDir}</span>
                </div>
              </div>

              {/* 3. Floors */}
              <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-white/5 border border-white/10 shrink-0">
                <div className="w-6 h-6 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                  <Layers className="w-3 h-3" />
                </div>
                <div className="leading-tight">
                  <span className="text-[9px] uppercase font-bold text-slate-400 block">Floors</span>
                  <span className="text-xs font-black text-white block">{numFloors} (G+{numFloors - 1})</span>
                </div>
              </div>

              {/* 4. Estimated Budget */}
              <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-white/5 border border-white/10 shrink-0">
                <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <Coins className="w-3 h-3" />
                </div>
                <div className="leading-tight">
                  <span className="text-[9px] uppercase font-bold text-slate-400 block">Estimated Budget</span>
                  <span className="text-xs font-black text-white block">
                    ₹ {(budget / 100000).toFixed(0)} - {(budget * 1.25 / 100000).toFixed(0)} Lakhs
                  </span>
                </div>
              </div>

              {/* 5. View Details CTA Button */}
              <Link
                to={`/project/${id}/floor-plan`}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shrink-0 shadow-sm shadow-blue-600/30 transition-all"
              >
                <span>View Details</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Right Column: Architectural House Image (Takes 4 cols on desktop) */}
          <div className="lg:col-span-4 h-full relative hidden sm:block">
            <div className="relative w-full h-full min-h-[210px] overflow-hidden">
              <img
                src="/assets/designs/exterior_modern_3f.jpg"
                alt="Dream Villa Elevation"
                className="w-full h-full object-cover object-center"
              />
              {/* Subtle gradient blend to the dark navy card */}
              <div className="absolute inset-0 bg-gradient-to-r from-[#0B132B] via-transparent to-transparent w-24"></div>
            </div>
          </div>

        </div>
      </div>

      {/* SECTION D: FIVE SUMMARY CARDS (COMPACT SINGLE ROW) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-3">
        
        {/* 1. Site Area */}
        <div className="p-2.5 sm:p-3 rounded-xl lg:rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex items-center gap-2.5 hover:shadow-xs transition-shadow h-[68px]">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
            <Maximize2 className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm lg:text-base font-black text-slate-900 leading-tight">{plotArea} sq.ft</h3>
            <span className="text-[11px] font-bold text-slate-600 block leading-tight mt-0.5">Site Area <span className="text-[9px] text-slate-400 font-medium">(Plot Size)</span></span>
          </div>
        </div>

        {/* 2. Facing Direction */}
        <div className="p-2.5 sm:p-3 rounded-xl lg:rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex items-center gap-2.5 hover:shadow-xs transition-shadow h-[68px]">
          <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
            <Compass className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm lg:text-base font-black text-slate-900 leading-tight">{facingDir}</h3>
            <span className="text-[11px] font-bold text-slate-600 block leading-tight mt-0.5">Facing Direction</span>
          </div>
        </div>

        {/* 3. Number of Floors */}
        <div className="p-2.5 sm:p-3 rounded-xl lg:rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex items-center gap-2.5 hover:shadow-xs transition-shadow h-[68px]">
          <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
            <Layers className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm lg:text-base font-black text-slate-900 leading-tight">{numFloors} (G+{numFloors - 1})</h3>
            <span className="text-[11px] font-bold text-slate-600 block leading-tight mt-0.5">Number of Floors</span>
          </div>
        </div>

        {/* 4. Estimated Cost */}
        <div className="p-2.5 sm:p-3 rounded-xl lg:rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex items-center gap-2.5 hover:shadow-xs transition-shadow h-[68px]">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
            <span className="text-base font-bold">₹</span>
          </div>
          <div className="min-w-0">
            <h3 className="text-sm lg:text-base font-black text-slate-900 leading-tight">₹ {(estimatedTotal / 100000).toFixed(1)} Lakhs</h3>
            <span className="text-[11px] font-bold text-slate-600 block leading-tight mt-0.5">Estimated Cost <span className="text-[9px] text-slate-400 font-medium">(Approx.)</span></span>
          </div>
        </div>

        {/* 5. Project Progress */}
        <div className="p-2.5 sm:p-3 rounded-xl lg:rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex items-center gap-2.5 hover:shadow-xs transition-shadow h-[68px] col-span-2 sm:col-span-1">
          <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 border border-purple-100">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm lg:text-base font-black text-slate-900 leading-tight">{progressPercent}%</h3>
            <span className="text-[11px] font-bold text-slate-600 block leading-tight mt-0.5">Project Progress</span>
            <div className="w-full bg-slate-100 rounded-full h-1 mt-1 overflow-hidden">
              <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${progressPercent}%` }} />
            </div>
          </div>
        </div>

      </div>

      {/* SECTION E: QUICK ACTIONS (COMPACT & VISIBLE IMMEDIATELY) */}
      <div className="space-y-2 pt-0.5">
        <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-800">
          Quick Actions
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
          
          {/* 1. Generate Floor Plans */}
          <Link
            to={`/project/${id}/floor-plan`}
            className="h-[105px] rounded-xl lg:rounded-2xl bg-white border border-slate-200/90 hover:border-blue-500 hover:shadow-sm transition-all group overflow-hidden flex flex-col"
          >
            <div className="h-16 bg-blue-50/60 p-1.5 flex items-center justify-center overflow-hidden border-b border-slate-100">
              <div className="w-12 h-12 border-2 border-dashed border-blue-400 rounded-lg p-1 flex flex-col justify-between group-hover:scale-105 transition-transform">
                <div className="w-full h-1.5 bg-blue-200 rounded"></div>
                <div className="flex gap-1">
                  <div className="w-1/2 h-3.5 bg-blue-100 rounded"></div>
                  <div className="w-1/2 h-3.5 bg-blue-100 rounded"></div>
                </div>
              </div>
            </div>
            <div className="p-1.5 text-center flex-1 flex items-center justify-center">
              <span className="text-[11px] font-bold text-slate-800 group-hover:text-blue-600 transition-colors leading-tight truncate">
                Generate Floor Plans
              </span>
            </div>
          </Link>

          {/* 2. Explore Interior Designs */}
          <Link
            to={`/project/${id}/interior`}
            className="h-[105px] rounded-xl lg:rounded-2xl bg-white border border-slate-200/90 hover:border-blue-500 hover:shadow-sm transition-all group overflow-hidden flex flex-col"
          >
            <div className="h-16 overflow-hidden border-b border-slate-100">
              <img
                src="/assets/designs/interior_living_modern.jpg"
                alt="Interior Designs"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            </div>
            <div className="p-1.5 text-center flex-1 flex items-center justify-center">
              <span className="text-[11px] font-bold text-slate-800 group-hover:text-blue-600 transition-colors leading-tight truncate">
                Explore Interior Designs
              </span>
            </div>
          </Link>

          {/* 3. Explore Exterior Designs */}
          <Link
            to={`/project/${id}/exterior`}
            className="h-[105px] rounded-xl lg:rounded-2xl bg-white border border-slate-200/90 hover:border-blue-500 hover:shadow-sm transition-all group overflow-hidden flex flex-col"
          >
            <div className="h-16 overflow-hidden border-b border-slate-100">
              <img
                src="/assets/designs/exterior_modern_2f.jpg"
                alt="Exterior Designs"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            </div>
            <div className="p-1.5 text-center flex-1 flex items-center justify-center">
              <span className="text-[11px] font-bold text-slate-800 group-hover:text-blue-600 transition-colors leading-tight truncate">
                Explore Exterior Designs
              </span>
            </div>
          </Link>

          {/* 4. Vastu Analysis */}
          <Link
            to={`/project/${id}/vastu`}
            className="h-[105px] rounded-xl lg:rounded-2xl bg-white border border-slate-200/90 hover:border-blue-500 hover:shadow-sm transition-all group overflow-hidden flex flex-col"
          >
            <div className="h-16 bg-amber-50/70 p-1.5 flex items-center justify-center overflow-hidden border-b border-slate-100">
              <div className="w-10 h-10 rounded-full border-2 border-amber-400 p-0.5 flex items-center justify-center bg-white shadow-2xs group-hover:rotate-45 transition-transform duration-500">
                <Compass className="w-6 h-6 text-amber-500" />
              </div>
            </div>
            <div className="p-1.5 text-center flex-1 flex items-center justify-center">
              <span className="text-[11px] font-bold text-slate-800 group-hover:text-blue-600 transition-colors leading-tight truncate">
                Vastu Analysis
              </span>
            </div>
          </Link>

          {/* 5. Cost Estimation */}
          <Link
            to={`/project/${id}/boq`}
            className="h-[105px] rounded-xl lg:rounded-2xl bg-white border border-slate-200/90 hover:border-blue-500 hover:shadow-sm transition-all group overflow-hidden flex flex-col"
          >
            <div className="h-16 bg-emerald-50/70 p-1.5 flex items-center justify-center overflow-hidden border-b border-slate-100">
              <div className="w-10 h-11 bg-white rounded-lg border border-emerald-300 shadow-2xs p-1 flex flex-col justify-between group-hover:scale-105 transition-transform">
                <div className="text-[8px] font-black text-emerald-600 text-right">₹ 62L</div>
                <Calculator className="w-4 h-4 text-emerald-500 mx-auto" />
              </div>
            </div>
            <div className="p-1.5 text-center flex-1 flex items-center justify-center">
              <span className="text-[11px] font-bold text-slate-800 group-hover:text-blue-600 transition-colors leading-tight truncate">
                Cost Estimation
              </span>
            </div>
          </Link>

          {/* 6. Track Construction */}
          <Link
            to={`/project/${id}/progress`}
            className="h-[105px] rounded-xl lg:rounded-2xl bg-white border border-slate-200/90 hover:border-blue-500 hover:shadow-sm transition-all group overflow-hidden flex flex-col"
          >
            <div className="h-16 bg-slate-900 overflow-hidden border-b border-slate-100">
              <img
                src="/assets/designs/exterior_modern_1f.jpg"
                alt="Track Construction"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            </div>
            <div className="p-1.5 text-center flex-1 flex items-center justify-center">
              <span className="text-[11px] font-bold text-slate-800 group-hover:text-blue-600 transition-colors leading-tight truncate">
                Track Construction
              </span>
            </div>
          </Link>

          {/* 7. AI Assistant */}
          <button
            onClick={() => {
              const aiBtn = document.querySelector('button[title*="AI House Planning Assistant"]');
              if (aiBtn) aiBtn.click();
            }}
            className="h-[105px] rounded-xl lg:rounded-2xl bg-white border border-slate-200/90 hover:border-blue-500 hover:shadow-sm transition-all group overflow-hidden flex flex-col text-left"
          >
            <div className="h-16 bg-blue-50/70 p-1.5 flex items-center justify-center overflow-hidden border-b border-slate-100">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/30 group-hover:scale-110 transition-transform">
                <Bot className="w-5 h-5" />
              </div>
            </div>
            <div className="p-1.5 text-center flex-1 flex items-center justify-center">
              <span className="text-[11px] font-bold text-slate-800 group-hover:text-blue-600 transition-colors leading-tight truncate">
                AI Assistant
              </span>
            </div>
          </button>

        </div>
      </div>

      {/* SECTION F: LOWER DASHBOARD WORKSPACE (THREE-COLUMN LAYOUT) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* COLUMN 1 (LEFT): RECENT ACTIVITY */}
        <div className="lg:col-span-4 bg-white rounded-3xl p-5 border border-slate-200 shadow-2xs space-y-4 flex flex-col">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900">
              Recent Activity
            </h3>
            <Link to={`/project/${id}/reports`} className="text-xs font-bold text-blue-600 hover:underline">
              View All
            </Link>
          </div>

          <div className="space-y-3.5 flex-1">
            {[
              { title: 'Floor plan generated for Ground Floor', time: 'Today, 10:30 AM', icon: Layers, iconBg: 'bg-blue-50', iconColor: 'text-blue-600' },
              { title: `Interior design saved - Living Room (${currentProject.preferences?.style || 'Modern'})`, time: 'Today, 09:15 AM', icon: Palette, iconBg: 'bg-amber-50', iconColor: 'text-amber-600' },
              { title: `Vastu analysis completed (${vastuScore}/100 score)`, time: 'Yesterday, 06:20 PM', icon: Compass, iconBg: 'bg-emerald-50', iconColor: 'text-emerald-600' },
              { title: `Cost estimation updated (₹${(estimatedTotal / 100000).toFixed(1)}L)`, time: 'Yesterday, 04:10 PM', icon: Calculator, iconBg: 'bg-blue-50', iconColor: 'text-blue-600' },
              { title: 'Project requirements edited', time: 'Yesterday, 01:30 PM', icon: Edit3, iconBg: 'bg-rose-50', iconColor: 'text-rose-600' }
            ].map((act, i) => {
              const ActIcon = act.icon;
              return (
                <div key={i} className="flex items-start gap-3 text-xs">
                  <div className={`w-8 h-8 rounded-xl ${act.iconBg} ${act.iconColor} flex items-center justify-center shrink-0`}>
                    <ActIcon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-slate-800 text-xs truncate leading-tight">{act.title}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{act.time}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* COLUMN 2 (CENTER): PROJECT PREVIEW */}
        <div className="lg:col-span-4 bg-white rounded-3xl p-5 border border-slate-200 shadow-2xs space-y-3 flex flex-col">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 className="text-sm font-bold text-slate-900">
              Project Preview
            </h3>

            {/* Pill Tabs */}
            <div className="flex p-0.5 bg-slate-100 rounded-xl text-xs font-semibold">
              <button
                onClick={() => setActivePreviewTab('exterior')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  activePreviewTab === 'exterior'
                    ? 'bg-blue-600 text-white font-bold shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Exterior
              </button>
              <button
                onClick={() => setActivePreviewTab('floor_plan')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  activePreviewTab === 'floor_plan'
                    ? 'bg-blue-600 text-white font-bold shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Floor Plan
              </button>
              <button
                onClick={() => setActivePreviewTab('interior')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  activePreviewTab === 'interior'
                    ? 'bg-blue-600 text-white font-bold shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Interior
              </button>
            </div>
          </div>

          {/* Preview Image with Carousel Controls */}
          <div className="relative rounded-2xl overflow-hidden aspect-[16/11] bg-slate-950 flex items-center justify-center group shadow-xs">
            {activePreviewTab === 'exterior' && (
              <img
                src="/assets/designs/exterior_modern_3f.jpg"
                alt="Exterior Villa Preview"
                className="w-full h-full object-cover"
              />
            )}
            {activePreviewTab === 'floor_plan' && (
              <div className="w-full h-full p-2 bg-slate-900 overflow-auto">
                <FloorPlanViewer floorPlan={floorPlan} project={currentProject} />
              </div>
            )}
            {activePreviewTab === 'interior' && (
              <img
                src="/assets/designs/interior_living_modern.jpg"
                alt="Interior Preview"
                className="w-full h-full object-cover"
              />
            )}

            {/* Prev/Next Carousel Arrows matching Image 1 */}
            <button
              className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-slate-900/60 text-white hover:bg-slate-900/90 flex items-center justify-center transition-opacity opacity-75 hover:opacity-100"
              title="Previous preview"
            >
              ‹
            </button>
            <button
              className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-slate-900/60 text-white hover:bg-slate-900/90 flex items-center justify-center transition-opacity opacity-75 hover:opacity-100"
              title="Next preview"
            >
              ›
            </button>
          </div>

          {/* Pagination Dots */}
          <div className="flex justify-center items-center gap-1.5 pt-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
            <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
            <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
            <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
            <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
          </div>

          {/* Caption */}
          <p className="text-[11px] text-slate-500 font-medium text-center">
            {currentProject.preferences?.style || 'Modern Indian Style'} - Front Elevation ({facingDir} Facing, {numFloors} Floors)
          </p>
        </div>

        {/* COLUMN 3 (RIGHT): CONSTRUCTION PROGRESS & BUDGET OVERVIEW */}
        <div className="lg:col-span-4 space-y-4">
          
          {/* Card 1: Construction Progress */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-2xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-sm font-bold text-slate-900">
                Construction Progress
              </h3>
              <Link to={`/project/${id}/progress`} className="text-xs font-bold text-blue-600 hover:underline">
                View Details ›
              </Link>
            </div>

            <div className="flex items-center justify-between gap-4">
              {/* Circular Gauge matching Image 1 */}
              <div className="flex flex-col items-center">
                <div className="relative w-24 h-24 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                    <path
                      className="text-slate-100"
                      strokeWidth="3.5"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      className="text-emerald-500"
                      strokeDasharray={`${progressPercent}, 100`}
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                  <div className="absolute text-center">
                    <span className="text-lg font-black text-slate-900">{progressPercent}%</span>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-slate-600 mt-1">Overall Progress</span>
                <span className="text-[9px] font-semibold text-emerald-600">In Progress</span>
              </div>

              {/* Milestones list matching Image 1 */}
              <div className="space-y-1.5 flex-1 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 text-[11px] flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    Planning & Design
                  </span>
                  <span className="text-emerald-600 font-bold text-[11px]">✓</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 text-[11px] flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    Foundation
                  </span>
                  <span className="text-slate-700 font-bold text-[11px]">60%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 text-[11px] flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                    Structure
                  </span>
                  <span className="text-slate-700 font-bold text-[11px]">30%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 text-[11px] flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                    Interior Work
                  </span>
                  <span className="text-slate-400 font-bold text-[11px]">0%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 text-[11px] flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                    Finishing
                  </span>
                  <span className="text-slate-400 font-bold text-[11px]">0%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Budget Overview */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-2xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-sm font-bold text-slate-900">
                Budget Overview
              </h3>
              <Link to={`/project/${id}/boq`} className="text-xs font-bold text-blue-600 hover:underline">
                View Details ›
              </Link>
            </div>

            <div>
              <div className="text-lg font-black text-slate-900">
                ₹ {(estimatedTotal / 100000).toFixed(1)} Lakhs
              </div>
              <p className="text-[11px] text-slate-400 font-medium">Estimated Total Cost</p>
            </div>

            {/* Segmented Horizontal Bar */}
            <div className="w-full h-3 rounded-full overflow-hidden flex bg-slate-100">
              <div className="bg-blue-600 h-full" style={{ width: '55%' }} title="Materials 55%"></div>
              <div className="bg-emerald-500 h-full" style={{ width: '25%' }} title="Labour 25%"></div>
              <div className="bg-amber-500 h-full" style={{ width: '20%' }} title="Others 20%"></div>
            </div>

            {/* Segment Legend */}
            <div className="flex items-center justify-between text-[11px] pt-1">
              <div className="flex items-center gap-1.5 text-slate-600">
                <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                <span>Materials 55%</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-600">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>Labour 25%</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-600">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                <span>Others 20%</span>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* EDIT REQUIREMENTS MODAL (CRITICAL PRESERVATION) */}
      {editModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6 animate-in zoom-in-95 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-black text-slate-900">Edit Project Requirements</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Update plot dimensions, floors, rooms, and tier specifications.
                </p>
              </div>
              <button
                onClick={() => setEditModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveRequirements} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Project Name</label>
                  <input
                    type="text"
                    required
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full p-3 rounded-xl border border-slate-300 font-semibold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Location / City</label>
                  <input
                    type="text"
                    required
                    value={editForm.location}
                    onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                    className="w-full p-3 rounded-xl border border-slate-300 font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Plot Length (ft)</label>
                  <input
                    type="number"
                    required
                    min="15"
                    max="300"
                    value={editForm.plotLength}
                    onChange={(e) => setEditForm({ ...editForm, plotLength: e.target.value })}
                    className="w-full p-3 rounded-xl border border-slate-300 font-semibold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Plot Width (ft)</label>
                  <input
                    type="number"
                    required
                    min="15"
                    max="300"
                    value={editForm.plotWidth}
                    onChange={(e) => setEditForm({ ...editForm, plotWidth: e.target.value })}
                    className="w-full p-3 rounded-xl border border-slate-300 font-semibold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Calculated Area</label>
                  <div className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 font-bold text-slate-800">
                    {Number(editForm.plotLength || 0) * Number(editForm.plotWidth || 0)} sq.ft
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Facing Direction</label>
                  <select
                    value={editForm.plotFacing}
                    onChange={(e) => setEditForm({ ...editForm, plotFacing: e.target.value })}
                    className="w-full p-3 rounded-xl border border-slate-300 bg-white font-semibold"
                  >
                    <option value="East">East (Most Auspicious)</option>
                    <option value="North">North (Kubera Corner)</option>
                    <option value="West">West</option>
                    <option value="South">South</option>
                    <option value="North-East">North-East (Ishanya)</option>
                    <option value="North-West">North-West (Vayu)</option>
                    <option value="South-East">South-East (Agneya)</option>
                    <option value="South-West">South-West (Nairuthi)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Number of Floors</label>
                  <select
                    value={editForm.floors}
                    onChange={(e) => setEditForm({ ...editForm, floors: Number(e.target.value) })}
                    className="w-full p-3 rounded-xl border border-slate-300 bg-white font-semibold"
                  >
                    <option value={1}>G (1 Floor)</option>
                    <option value={2}>G+1 (2 Floors)</option>
                    <option value={3}>G+2 (3 Floors)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Budget Tier / Package</label>
                  <select
                    value={editForm.selectedPackage}
                    onChange={(e) => setEditForm({ ...editForm, selectedPackage: e.target.value })}
                    className="w-full p-3 rounded-xl border border-slate-300 bg-white font-semibold"
                  >
                    <option value="BASIC">Basic (₹ 1,750 / sq.ft)</option>
                    <option value="MEDIUM">Medium (₹ 2,150 / sq.ft)</option>
                    <option value="RICH">Rich / Luxury (₹ 2,750 / sq.ft)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Bedrooms</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={editForm.bedrooms}
                    onChange={(e) => setEditForm({ ...editForm, bedrooms: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-semibold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Bathrooms</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={editForm.bathrooms}
                    onChange={(e) => setEditForm({ ...editForm, bathrooms: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 text-xs uppercase tracking-wider mb-2">Required Rooms & Amenities</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {[
                    { key: 'livingRoom', label: 'Living Room' },
                    { key: 'diningRoom', label: 'Dining Space' },
                    { key: 'kitchen', label: 'Modular Kitchen' },
                    { key: 'poojaRoom', label: 'Pooja Mandir' },
                    { key: 'parking', label: 'Car Parking / Porch' },
                    { key: 'balcony', label: 'Balcony / Terrace' },
                    { key: 'utilityArea', label: 'Utility / Wash' },
                    { key: 'studyRoom', label: 'Study / Office' },
                  ].map(item => (
                    <label
                      key={item.key}
                      className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer text-xs font-semibold transition-all ${
                        editForm[item.key]
                          ? 'bg-blue-50/70 border-blue-400 text-blue-900'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={Boolean(editForm[item.key])}
                        onChange={(e) => setEditForm({ ...editForm, [item.key]: e.target.checked })}
                        className="w-3.5 h-3.5 rounded text-blue-600"
                      />
                      <span>{item.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Architectural Style</label>
                  <select
                    value={editForm.style}
                    onChange={(e) => setEditForm({ ...editForm, style: e.target.value })}
                    className="w-full p-3 rounded-xl border border-slate-300 bg-white font-semibold"
                  >
                    <option value="Modern Indian house">Modern Indian</option>
                    <option value="Contemporary">Contemporary</option>
                    <option value="Traditional Indian">Traditional Indian</option>
                    <option value="Minimalist">Minimalist</option>
                    <option value="Premium Luxury">Premium Luxury</option>
                  </select>
                </div>
              </div>

              {/* Automatic Regeneration Checkbox */}
              <div className="p-3.5 bg-blue-50/80 rounded-2xl border border-blue-200">
                <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-blue-900">
                  <input
                    type="checkbox"
                    checked={editForm.autoRegenerate}
                    onChange={(e) => setEditForm({ ...editForm, autoRegenerate: e.target.checked })}
                    className="w-4 h-4 rounded text-blue-600"
                  />
                  <span>
                    ⚡ Immediately regenerate geometric floor plan, Vastu orientation, and BOQ estimates on save
                  </span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold flex items-center gap-2 transition-all shadow-md shadow-blue-500/20 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{savingEdit ? 'Saving Changes...' : 'Save Requirements'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM REGENERATION MODAL (CRITICAL PRESERVATION) */}
      {confirmRegenModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center gap-3 text-indigo-600">
              <RefreshCw className="w-6 h-6" />
              <h3 className="text-base font-black text-slate-900">Regenerate Architectural Plan?</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              This action will recalculate the entire floor plan layout, room geometry, Vastu score, and BOQ cost estimates using your project's current specifications (<strong>{currentProject.plot?.length}'x{currentProject.plot?.width}'</strong>, <strong>{currentProject.accommodation?.floors || 2} Floors</strong>, <strong>{currentProject.accommodation?.bedrooms || 3} BHK</strong>).
            </p>
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Existing room customizations and past design revisions will be archived.</span>
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmRegenModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={triggerRegenerateFloorPlan}
                disabled={regenerating}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-indigo-500/20 disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${regenerating ? 'animate-spin' : ''}`} />
                <span>{regenerating ? 'Regenerating...' : 'Confirm & Regenerate'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ProjectOverviewPage;
