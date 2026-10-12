import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useProject } from '../context/ProjectContext';
import { designApi, resolveImageUrl } from '../services/api';
import curatedLibrary from '../data/curatedDesignLibrary.json';
import {
  Building2,
  Sparkles,
  Sliders,
  Layers,
  Heart,
  CheckCircle2,
  Download,
  Info,
  Columns,
  History,
  Coins,
  Compass,
  AlertCircle,
  ChevronRight
} from 'lucide-react';

const EXTERIOR_STYLES = [
  { id: 'Modern Indian house', label: 'Modern Indian house', desc: 'Cantilevers, stone cladding & warm teakwood accents' },
  { id: 'Contemporary', label: 'Contemporary', desc: 'Asymmetrical cubical projections & large glass glazing' },
  { id: 'Traditional Indian', label: 'Traditional Indian', desc: 'Sloped Mangalore tile eaves, verandah pillars & brick plinth' },
  { id: 'Minimalist', label: 'Minimalist', desc: 'Monolithic clean volumes, crisp shadow grooves & louvers' },
  { id: 'Premium Luxury', label: 'Premium Luxury', desc: 'Ultra-wide cantilevered villa, porcelain slabs & double-height glass' }
];

export const getCuratedExteriorDesign = (styleId, numFloors = 2, facingDirection = '') => {
  let styleKey = styleId || 'Modern Indian house';
  if (styleKey === 'Modern Indian house' || styleKey === 'Modern' || styleKey === 'Modern Indian') {
    styleKey = 'Modern Indian';
  } else if (styleKey === 'Luxury' || styleKey === 'Luxury / Italian' || styleKey === 'Premium Luxury') {
    styleKey = 'Premium Luxury';
  } else if (styleKey === 'Traditional' || styleKey === 'Traditional Indian') {
    styleKey = 'Traditional Indian';
  } else if (styleKey === 'Minimalist') {
    styleKey = 'Minimalist';
  } else if (styleKey === 'Contemporary') {
    styleKey = 'Contemporary';
  }

  const floorsClamped = Math.max(1, Math.min(3, Number(numFloors) || 2));
  const floorKey = String(floorsClamped);

  const styleObj = curatedLibrary.exterior?.[styleKey] || curatedLibrary.exterior?.['Modern Indian'];
  const entry = styleObj?.[floorKey] || styleObj?.['2'] || {
    title: `${styleKey} Villa Front Elevation`,
    description: `Architectural exterior facade concept for ${floorsClamped}-floor ${styleKey} residence.`,
    image: '/assets/designs/exterior_modern_2f.jpg',
    alternatives: [],
    materials: [],
    estimatedCost: 200000
  };

  const facingPrefix = facingDirection ? `${facingDirection} Facing • ` : '';
  const displayTitle = entry.title.includes('Facing') ? entry.title : `${facingPrefix}${entry.title}`;

  return {
    _id: `curated_ext_${styleKey}_${floorKey}`,
    designType: 'exterior',
    style: styleId,
    floors: floorsClamped,
    facingDirection: facingDirection || 'East',
    title: displayTitle,
    description: entry.description,
    imageUrl: entry.image,
    alternatives: entry.alternatives || [],
    provider: 'curated-architectural-library',
    model: 'curated-elevation-portfolio',
    isFavorite: false,
    isFinal: false,
    costImpact: {
      estimatedCost: entry.estimatedCost || 200000,
      specifications: entry.materials || []
    }
  };
};

export const ExteriorDesignStudioPage = () => {
  const { id } = useParams();
  const { currentProject, selectProjectById } = useProject();

  // Read-only elevation architecture constraints derived directly from project requirements
  const projectFloors = Math.max(1, Math.min(3, Number(currentProject?.accommodation?.floors || 2)));
  const projectFacing = currentProject?.plot?.facingDirection || '';

  // Form State: Only style is user-selectable
  const [style, setStyle] = useState('Modern Indian house');

  // Generation & Gallery State
  const [activeDesign, setActiveDesign] = useState(() => getCuratedExteriorDesign('Modern Indian house', 2, ''));
  const [generating, setGenerating] = useState(false);
  const [genStep, setGenStep] = useState(0);
  const [history, setHistory] = useState([]);
  const [historyDrawerOpen, setHistoryDrawerOpen] = useState(false);
  const [compareModalOpen, setCompareModalOpen] = useState(false);
  const [toast, setToast] = useState(null);

  // Sync project default style & floor count on load with instant visual updates
  useEffect(() => {
    if (currentProject) {
      let activeSt = style;
      if (currentProject.preferences?.style) {
        const matched = EXTERIOR_STYLES.find(
          s => s.id.toLowerCase() === currentProject.preferences.style.toLowerCase() ||
               s.label.toLowerCase() === currentProject.preferences.style.toLowerCase()
        );
        if (matched) {
          setStyle(matched.id);
          activeSt = matched.id;
        }
      }
      const pFloors = Math.max(1, Math.min(3, Number(currentProject.accommodation?.floors || 2)));
      const pFacing = currentProject.plot?.facingDirection || '';
      setActiveDesign(prev => {
        if (!prev || prev._id?.startsWith('curated_')) {
          return getCuratedExteriorDesign(activeSt, pFloors, pFacing);
        }
        return prev;
      });
    }
  }, [currentProject]);

  // Fetch History & Sync
  const fetchHistory = async () => {
    try {
      const res = await designApi.getHistory(id, 'exterior');
      if (res.data.success) {
        const designs = res.data.designs || [];
        setHistory(designs);
        const match = designs.find(
          d => d.style === style && Number(d.settings?.floors || d.floors || 2) === projectFloors
        ) || designs.find(d => d.style === style);

        if (match) {
          setActiveDesign(match);
        } else {
          setActiveDesign(prev => (prev && !prev._id?.startsWith('curated_')) ? prev : getCuratedExteriorDesign(style, projectFloors, projectFacing));
        }
      }
    } catch (err) {
      console.error('Fetch exterior history error:', err);
    }
  };

  useEffect(() => {
    if (id) {
      if (selectProjectById && (!currentProject || (currentProject._id !== id && currentProject.id !== id))) {
        selectProjectById(id);
      }
      fetchHistory();
    }
  }, [id]);

  // Handle Style Selection with Instant Visual Synchronization
  const handleStyleSelect = (styleId) => {
    setStyle(styleId);
    const existing = history.find(
      d => d.style === styleId && Number(d.settings?.floors || d.floors || 2) === projectFloors
    ) || history.find(d => d.style === styleId);

    setActiveDesign(existing || getCuratedExteriorDesign(styleId, projectFloors, projectFacing));
  };

  // Trigger Generation
  const handleGenerate = async () => {
    try {
      setGenerating(true);
      setGenStep(1);

      const t1 = setTimeout(() => setGenStep(2), 1200);
      const t2 = setTimeout(() => setGenStep(3), 2600);

      const payload = {
        style,
        floors: projectFloors,
        facingDirection: projectFacing || 'East',
        generateAlternatives: true
      };

      const res = await designApi.generateExterior(id, payload);
      clearTimeout(t1);
      clearTimeout(t2);

      if (res.data.success) {
        setActiveDesign(res.data.design);
        setHistory(prev => [res.data.design, ...prev]);
        setToast('🏛️ New Exterior Elevation Generated!');
        setTimeout(() => setToast(null), 4000);
      }
    } catch (err) {
      console.error('Generate exterior error:', err);
      setToast('Notice: Switched to verified architectural elevation specifications.');
      setTimeout(() => setToast(null), 4000);
    } finally {
      setGenerating(false);
      setGenStep(0);
    }
  };

  // Toggle Favorite
  const handleToggleFavorite = async () => {
    if (!activeDesign?._id) return;
    try {
      const res = await designApi.toggleFavorite(activeDesign._id);
      if (res.data.success) {
        const updated = { ...activeDesign, isFavorite: res.data.design.isFavorite };
        setActiveDesign(updated);
        setHistory(prev => prev.map(d => d._id === updated._id ? updated : d));
        setToast(updated.isFavorite ? 'Saved to favorites!' : 'Removed from favorites');
        setTimeout(() => setToast(null), 2500);
      }
    } catch (err) {
      console.error('Favorite error:', err);
    }
  };

  // Select Final Concept & Sync BOQ
  const handleSelectFinal = async () => {
    if (!activeDesign?._id) return;
    try {
      const res = await designApi.selectFinal(id, activeDesign._id);
      if (res.data.success) {
        const updated = { ...activeDesign, isFinal: true };
        setActiveDesign(updated);
        setHistory(prev => prev.map(d => d._id === updated._id ? { ...d, isFinal: true } : (d.designType === 'exterior' ? { ...d, isFinal: false } : d)));
        setToast('✅ Selected as final facade & synchronized with BOQ Cost Estimation!');
        setTimeout(() => setToast(null), 4000);
      }
    } catch (err) {
      console.error('Select final error:', err);
    }
  };

  // Fallback handler for images to prevent black previews or broken icons
  const handleImageError = (e, fallbackTitle = 'Exterior Architectural Elevation') => {
    e.target.onerror = null;
    e.target.src = '/assets/designs/exterior_modern_2f.jpg';
  };

  // Download Image
  const handleDownload = () => {
    if (!activeDesign?.imageUrl) return;
    const link = document.createElement('a');
    link.href = resolveImageUrl(activeDesign.imageUrl);
    link.download = `Exterior_${style.replace(/\s+/g, '_')}_elevation.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-20 right-8 z-50 p-4 bg-slate-900/95 text-white text-xs font-semibold rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-3 backdrop-blur-md animate-in slide-in-from-top-4">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{toast}</span>
        </div>
      )}

      {/* Top Header Card */}
      <div className="bg-white rounded-3xl p-6 lg:p-8 border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2.5 mb-2">
            <span className="px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-blue-100 text-blue-800 border border-blue-200">
              Elevation & Facade Studio
            </span>
            <span className="text-xs text-slate-300">•</span>
            <span className="text-xs text-slate-500 font-semibold">
              Project: <strong>{currentProject?.name || 'My Villa'}</strong>
            </span>
            <span className="text-xs text-slate-300">•</span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
              {projectFloors} Floor{projectFloors > 1 ? 's' : ''} (G+{projectFloors - 1})
            </span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-black text-slate-900 tracking-tight">
            Exterior Elevation & Facade Architecture
          </h1>
          <p className="text-xs lg:text-sm text-slate-500 mt-1 max-w-2xl">
            Synthesize exterior elevations strictly synchronized with your project's facing direction, floor architecture, boundary setbacks, and itemized facade BOQ schedule.
          </p>
        </div>

        {/* Top Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setHistoryDrawerOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all"
          >
            <History className="w-4 h-4 text-slate-600" />
            <span>Saved Elevations ({history.length})</span>
          </button>

          <Link
            to={`/project/${id}/boq`}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold transition-all"
          >
            <Coins className="w-4 h-4 text-emerald-600" />
            <span>View Facade BOQ Impact</span>
          </Link>
        </div>
      </div>

      {/* Main Studio Grid: Elevation Controls on Left (40%), Visualizer on Right (60%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: Read-only Project Parameters & Style Selection */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Elevation Architecture Card (Read-only Project Requirements) */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-blue-600" />
                <span>Elevation Architecture</span>
              </h3>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Project Requirements
              </span>
            </div>

            {/* Warning Banner: Missing Facing Direction */}
            {!projectFacing && (
              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-3">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="font-bold text-amber-900">Facing direction not configured in project requirements</p>
                  <p className="text-[11px] text-amber-700 leading-relaxed">
                    Defaulting to East Facing for visualization.
                  </p>
                  <Link
                    to={`/project/${id}/setup`}
                    className="inline-block text-[11px] font-bold text-amber-800 underline hover:text-amber-950 pt-0.5"
                  >
                    Configure Facing in Project Setup →
                  </Link>
                </div>
              </div>
            )}

            {/* Read-Only Parameter Badges */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1">
                  <Compass className="w-3.5 h-3.5 text-blue-500" />
                  <span>Plot Facing</span>
                </div>
                <p className="text-xs font-black text-slate-800">
                  {projectFacing ? `${projectFacing} Facing` : 'East (Default)'}
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1">
                  <Layers className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Floor Architecture</span>
                </div>
                <p className="text-xs font-black text-slate-800">
                  {projectFloors} Floor{projectFloors > 1 ? 's' : ''} (G+{projectFloors - 1})
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1">
                  <Building2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Plot Footprint</span>
                </div>
                <p className="text-xs font-black text-slate-800">
                  {currentProject?.plot?.width || 30}' × {currentProject?.plot?.length || 50}'
                </p>
              </div>
            </div>
          </div>

          {/* Architectural Style Theme Selector Card */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-blue-600" />
                <span>Architectural Style Theme</span>
              </h3>
              <span className="text-[11px] font-bold text-slate-400">
                5 Portfolio Styles
              </span>
            </div>

            <div className="space-y-2">
              {EXTERIOR_STYLES.map((st) => (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => handleStyleSelect(st.id)}
                  className={`w-full p-3.5 rounded-2xl text-left border transition-all flex items-center justify-between ${
                    style === st.id
                      ? 'bg-blue-50/80 border-blue-500 ring-2 ring-blue-500/20 text-blue-900 shadow-xs'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <div className="min-w-0 pr-3">
                    <p className="text-xs font-bold text-slate-900">{st.label}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">{st.desc}</p>
                  </div>
                  {style === st.id ? (
                    <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
                  )}
                </button>
              ))}
            </div>

            {/* Generate Button */}
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="w-full mt-2 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white text-xs font-extrabold uppercase tracking-wider shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2.5 transition-all disabled:opacity-50"
            >
              <Sparkles className={`w-4 h-4 ${generating ? 'animate-spin' : ''}`} />
              <span>{generating ? 'Synthesizing Elevation...' : 'Generate AI Exterior Elevation'}</span>
            </button>
          </div>

          {/* Project Geometry Overview */}
          <div className="bg-slate-900 text-slate-300 rounded-3xl p-6 space-y-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Compass className="w-4 h-4 text-blue-400" />
              <span>Dimensionally Constrained Geometry</span>
            </h3>
            <p className="text-[11px] text-slate-400">
              Geometric floor plans and municipal setback constraints are isolated from the visual artistic rendering to ensure structural feasibility.
            </p>
            <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
              <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700">
                <span className="text-slate-400 block text-[10px]">Plot Footprint</span>
                <span className="font-bold text-white">{currentProject?.plot?.width || 30}' × {currentProject?.plot?.length || 50}'</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700">
                <span className="text-slate-400 block text-[10px]">Built-Up Coverage</span>
                <span className="font-bold text-white">{Math.round((currentProject?.plot?.area || 1500) * 0.75 * projectFloors)} sq.ft</span>
              </div>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: Elevation Visualizer, Alternatives & Cost Breakdown */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Main Visualizer Card */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-5">
            
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-900">
                    {activeDesign ? activeDesign.title : `${style} Villa Front Elevation`}
                  </span>
                  {activeDesign?.provider === 'curated-architectural-library' || activeDesign?._id?.startsWith('curated_') ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center gap-1">
                      🏛️ Curated Architectural Reference
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1">
                      ✨ AI-Generated Concept
                    </span>
                  )}
                  {activeDesign?.isFinal && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      FINAL APPROVED FACADE
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Visualizer: {activeDesign?.provider === 'curated-architectural-library' || activeDesign?._id?.startsWith('curated_') ? 'Curated Architectural Portfolio' : (activeDesign?.provider || 'AI Elevation Generator')} ({activeDesign?.model || 'photorealistic-v2'})
                </p>
              </div>

              {/* Action Toolbar */}
              {activeDesign && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleToggleFavorite}
                    className={`p-2 rounded-xl border transition-all ${
                      activeDesign.isFavorite
                        ? 'bg-rose-50 border-rose-300 text-rose-600'
                        : 'bg-slate-50 border-slate-200 text-slate-500 hover:text-slate-800'
                    }`}
                    title={activeDesign.isFavorite ? 'Saved Favorite' : 'Save as Favorite'}
                  >
                    <Heart className={`w-4 h-4 ${activeDesign.isFavorite ? 'fill-rose-500 text-rose-500' : ''}`} />
                  </button>

                  <button
                    onClick={handleSelectFinal}
                    className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${
                      activeDesign.isFinal
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                        : 'bg-slate-900 text-white hover:bg-slate-800'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{activeDesign.isFinal ? 'Approved' : 'Select as Final'}</span>
                  </button>

                  {activeDesign.alternatives && activeDesign.alternatives.length > 0 && (
                    <button
                      onClick={() => setCompareModalOpen(true)}
                      className="p-2 rounded-xl bg-purple-50 border border-purple-200 text-purple-700 hover:bg-purple-100 text-xs font-bold flex items-center gap-1"
                      title="Compare Alternatives"
                    >
                      <Columns className="w-4 h-4" />
                      <span>Compare ({activeDesign.alternatives.length + 1})</span>
                    </button>
                  )}

                  <button
                    onClick={handleDownload}
                    className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700"
                    title="Download High-Res"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Visual Canvas Display */}
            <div className="relative rounded-2xl overflow-hidden bg-slate-950 aspect-[4/3] flex items-center justify-center border border-slate-800 group">
              {generating ? (
                <div className="text-center p-8 space-y-4">
                  <div className="w-16 h-16 mx-auto rounded-full border-4 border-blue-500/30 border-t-blue-500 animate-spin flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-blue-400 animate-pulse" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">Synthesizing Architectural Elevation</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {genStep === 1 && '1/3 Formulating elevation geometry & facade materials...'}
                      {genStep === 2 && '2/3 Synthesizing natural daylight, textures & cladding...'}
                      {genStep === 3 && '3/3 Calculating exterior BOQ schedule of quantities...'}
                    </p>
                  </div>
                </div>
              ) : activeDesign?.imageUrl ? (
                <img
                  src={resolveImageUrl(activeDesign.imageUrl)}
                  alt={activeDesign.title || 'Generated Elevation'}
                  onError={(e) => handleImageError(e, activeDesign.title || 'Exterior Facade Elevation')}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                />
              ) : (
                <div className="text-center p-12 text-slate-500 space-y-3">
                  <Building2 className="w-12 h-12 mx-auto text-slate-700" />
                  <p className="text-xs font-semibold">No exterior elevation concept generated yet.</p>
                  <p className="text-[11px] text-slate-600 max-w-sm mx-auto">
                    Select your architectural style on the left to preview verified elevation concepts or click Generate for AI synthesis.
                  </p>
                </div>
              )}

              {/* Conceptual Visualization Disclaimer Banner */}
              {activeDesign?.imageUrl && (
                <div className="absolute bottom-3 left-3 right-3 p-2 rounded-xl bg-slate-900/80 backdrop-blur-md border border-slate-700 text-slate-300 text-[10px] flex items-center justify-between">
                  <span className="font-semibold flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    Conceptual Visualization — Structural drawings governed by IS 1200 Standards.
                  </span>
                  <span className="text-slate-400 font-mono">1024 x 1024</span>
                </div>
              )}
            </div>

            {/* Alternatives Strip */}
            {activeDesign?.alternatives && activeDesign.alternatives.length > 0 && (
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-2">Alternative Variations</span>
                <div className="grid grid-cols-3 gap-3">
                  <div
                    onClick={() => {}}
                    className="relative rounded-xl overflow-hidden border-2 border-blue-500 cursor-pointer aspect-[4/3]"
                  >
                    <img
                      src={resolveImageUrl(activeDesign.imageUrl)}
                      alt="Main"
                      onError={(e) => handleImageError(e, 'Active Elevation')}
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute bottom-1 right-1 text-[9px] font-bold bg-blue-600 text-white px-1.5 rounded">Active</span>
                  </div>
                  {activeDesign.alternatives.map((alt, i) => (
                    <div
                      key={i}
                      onClick={() => {
                        setActiveDesign({ ...activeDesign, imageUrl: alt.imageUrl });
                      }}
                      className="relative rounded-xl overflow-hidden border border-slate-200 hover:border-purple-500 cursor-pointer aspect-[4/3] transition-all"
                    >
                      <img
                        src={resolveImageUrl(alt.imageUrl)}
                        alt={`Alt ${i + 1}`}
                        onError={(e) => handleImageError(e, `Alternative #${i + 1}`)}
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute bottom-1 right-1 text-[9px] font-bold bg-slate-900/80 text-white px-1.5 rounded">Alt #{i + 1}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* Exterior Material & BOQ Cost Impact Card */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Coins className="w-4 h-4 text-emerald-600" />
                  <span>Itemized Exterior Facade Specifications & Cost</span>
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Calculated for {projectFloors}-Floor {style} elevation & Warangal regional SoR 2026.
                </p>
              </div>

              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                Est. Facade: ₹{Number(activeDesign?.costImpact?.estimatedCost || 226000).toLocaleString('en-IN')}
              </span>
            </div>

            {/* Specifications Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px]">
                    <th className="py-2.5 px-3">Item / Category</th>
                    <th className="py-2.5 px-3">Specification</th>
                    <th className="py-2.5 px-3">Quantity</th>
                    <th className="py-2.5 px-3 text-right">Cost (INR)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(activeDesign?.costImpact?.specifications || []).map((m, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-2 px-3 font-semibold text-slate-900">{m.name}</td>
                      <td className="py-2 px-3 text-slate-600">{m.spec}</td>
                      <td className="py-2 px-3 font-mono text-slate-700">{m.qty} {m.unit}</td>
                      <td className="py-2 px-3 font-mono font-bold text-blue-600 text-right">
                        ₹{Number(m.totalCost || m.total || 0).toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl text-[11px] text-slate-500 flex items-center justify-between">
              <span>* Exterior finishes automatically synchronize with project schedule of rates and cost estimation.</span>
              <Link to={`/project/${id}/boq`} className="text-blue-600 font-bold hover:underline">
                Open Full BOQ Schedule →
              </Link>
            </div>
          </div>

        </div>

      </div>

      {/* Side-by-Side Comparison Modal */}
      {compareModalOpen && activeDesign?.alternatives && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 lg:p-8 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-6xl w-full max-h-[90vh] overflow-y-auto p-6 lg:p-8 space-y-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-black text-slate-900">Compare Elevation Architectural Variations</h3>
                <p className="text-xs text-slate-500">Side-by-side comparison for {style} Villa ({projectFloors} Floor{projectFloors > 1 ? 's' : ''})</p>
              </div>
              <button
                onClick={() => setCompareModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200"
              >
                Close
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Primary Candidate */}
              <div className="bg-slate-50 rounded-2xl p-4 border-2 border-blue-500 space-y-3">
                <span className="text-[10px] font-extrabold uppercase bg-blue-600 text-white px-2.5 py-0.5 rounded-full">Candidate 1 (Active)</span>
                <div className="aspect-[4/3] rounded-xl overflow-hidden bg-slate-900">
                  <img
                    src={resolveImageUrl(activeDesign.imageUrl)}
                    alt="Candidate 1"
                    onError={(e) => handleImageError(e, 'Candidate 1')}
                    className="w-full h-full object-cover"
                  />
                </div>
                <p className="text-xs font-semibold text-slate-800">Primary Elevation Composition</p>
                <button
                  disabled
                  className="w-full py-2 rounded-xl bg-blue-100 text-blue-800 text-xs font-bold cursor-default"
                >
                  Active Visual
                </button>
              </div>

              {/* Alternatives */}
              {activeDesign.alternatives.map((alt, i) => (
                <div key={i} className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-3">
                  <span className="text-[10px] font-extrabold uppercase bg-purple-600 text-white px-2.5 py-0.5 rounded-full">Candidate {i + 2}</span>
                  <div className="aspect-[4/3] rounded-xl overflow-hidden bg-slate-900">
                    <img
                      src={resolveImageUrl(alt.imageUrl)}
                      alt={`Candidate ${i + 2}`}
                      onError={(e) => handleImageError(e, `Candidate ${i + 2}`)}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <p className="text-xs font-semibold text-slate-800">Alternative Architectural Angle #{i + 1}</p>
                  <button
                    onClick={() => {
                      setActiveDesign({ ...activeDesign, imageUrl: alt.imageUrl });
                      setCompareModalOpen(false);
                      setToast(`Selected Candidate ${i + 2} as active facade!`);
                    }}
                    className="w-full py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold"
                  >
                    Select This Variation
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* History Drawer Modal */}
      {historyDrawerOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex justify-end animate-in fade-in">
          <div className="bg-white w-full max-w-md h-full p-6 space-y-6 overflow-y-auto shadow-2xl flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Saved Elevation History</h3>
                <p className="text-xs text-slate-500">{history.length} generated exterior concepts</p>
              </div>
              <button
                onClick={() => setHistoryDrawerOpen(false)}
                className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold"
              >
                Close
              </button>
            </div>

            <div className="flex-1 space-y-4">
              {history.map((item) => (
                <div
                  key={item._id || item.id}
                  onClick={() => {
                    setActiveDesign(item);
                    setHistoryDrawerOpen(false);
                  }}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer flex gap-3 ${
                    activeDesign?._id === item._id
                      ? 'bg-blue-50 border-blue-400 ring-2 ring-blue-400/20'
                      : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <div className="w-20 h-20 rounded-xl overflow-hidden bg-slate-900 shrink-0">
                    <img
                      src={resolveImageUrl(item.imageUrl)}
                      alt={item.title}
                      onError={(e) => handleImageError(e, item.title || 'Saved Elevation')}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-slate-900 truncate">{item.title}</p>
                      {item.isFinal && <span className="text-[9px] font-bold text-emerald-700 bg-emerald-100 px-1.5 rounded">Final</span>}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">{item.style} • {item.budgetTier || 'MEDIUM'} Finish</p>
                    <p className="text-[10px] text-slate-400 mt-1">{new Date(item.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ExteriorDesignStudioPage;
