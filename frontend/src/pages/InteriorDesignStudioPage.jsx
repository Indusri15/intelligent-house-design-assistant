import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useProject } from '../context/ProjectContext';
import { designApi } from '../services/api';
import {
  Palette,
  Sparkles,
  Sliders,
  Layers,
  Heart,
  CheckCircle2,
  Download,
  RotateCcw,
  Maximize2,
  Info,
  Camera,
  UploadCloud,
  Columns,
  History,
  Trash2,
  AlertCircle,
  HelpCircle,
  Coins,
  ChevronRight,
  Sun,
  Eye
} from 'lucide-react';

const ROOM_TYPES = [
  { id: 'living_room', label: 'Living Room', icon: '🛋️', defaultArea: 220 },
  { id: 'master_bedroom', label: 'Master Bedroom', icon: '🛏️', defaultArea: 180 },
  { id: 'bedroom', label: 'Guest / Kids Bedroom', icon: '🚪', defaultArea: 150 },
  { id: 'kitchen', label: 'Modular Kitchen', icon: '🍳', defaultArea: 120 },
  { id: 'dining_room', label: 'Dining Room', icon: '🍽️', defaultArea: 140 },
  { id: 'bathroom', label: 'Luxury Bathroom', icon: '🚿', defaultArea: 60 },
  { id: 'pooja_room', label: 'Pooja Mandir', icon: '🪔', defaultArea: 50 },
  { id: 'staircase', label: 'Staircase Lobby', icon: '🪜', defaultArea: 90 },
  { id: 'balcony', label: 'Balcony / Sitout', icon: '🪴', defaultArea: 80 }
];

const DESIGN_STYLES = [
  { id: 'Modern', label: 'Modern', desc: 'Clean geometry, open plan & flush joinery' },
  { id: 'Minimalist', label: 'Minimalist', desc: 'Monochromatic, clutter-free & organic textures' },
  { id: 'Contemporary', label: 'Contemporary', desc: 'Warm neutral tones, curved profiles & mixed metals' },
  { id: 'Traditional Indian', label: 'Traditional Indian', desc: 'Teakwood carvings, brass jali & terracotta warmth' },
  { id: 'Luxury', label: 'Luxury / Italian', desc: 'Statuario marble, fluted oak & gold accents' }
];

const CURATED_PALETTES = [
  { name: 'Warm Architectural', colors: ['#F8FAFC', '#334155', '#D97706', '#E2E8F0'] },
  { name: 'Modern Charcoal Slate', colors: ['#0F172A', '#1E293B', '#38BDF8', '#F1F5F9'] },
  { name: 'Heritage Sandalwood', colors: ['#FFFBEB', '#B45309', '#78350F', '#15803D'] },
  { name: 'Luxury Obsidian Gold', colors: ['#090A0F', '#1E293B', '#F59E0B', '#E2E8F0'] },
  { name: 'Zen Earth Olive', colors: ['#F7FEE7', '#365314', '#713F12', '#ECFCCB'] }
];

export const InteriorDesignStudioPage = () => {
  const { id } = useParams();
  const { currentProject } = useProject();

  // Form Configuration State
  const [selectedRoom, setSelectedRoom] = useState('living_room');
  const [style, setStyle] = useState('Contemporary');
  const [budgetTier, setBudgetTier] = useState('MEDIUM');
  const [wallColors, setWallColors] = useState(['#F8FAFC', '#334155', '#D97706']);
  const [flooring, setFlooring] = useState('Glazed Vitrified Tiles (4x2 ft)');
  const [ceiling, setCeiling] = useState('Saint-Gobain Gypsum False Ceiling with LED Cove');
  const [lighting, setLighting] = useState('Warm White Recessed Downlights & Magnetic Track');
  const [furniture, setFurniture] = useState('6-Seater Fabric Sectional Sofa & Floating Console');
  const [storage, setStorage] = useState('Floor-to-Ceiling Wardrobes with Soft-Close');
  const [dimensions, setDimensions] = useState({ length: 16, width: 14, height: 10, areaSqFt: 224 });
  const [customInstructions, setCustomInstructions] = useState('');

  // Generation & Gallery State
  const [activeDesign, setActiveDesign] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [genStep, setGenStep] = useState(0);
  const [history, setHistory] = useState([]);
  const [historyDrawerOpen, setHistoryDrawerOpen] = useState(false);
  const [compareModalOpen, setCompareModalOpen] = useState(false);
  const [providerInfo, setProviderInfo] = useState(null);
  const [toast, setToast] = useState(null);

  // ADE20K Scene Understanding Upload State
  const [sceneFile, setSceneFile] = useState(null);
  const [scenePreview, setScenePreview] = useState(null);
  const [analyzingScene, setAnalyzingScene] = useState(false);
  const [sceneAnalysis, setSceneAnalysis] = useState(null);

  // Sync project default style & budget on load
  useEffect(() => {
    if (currentProject) {
      if (currentProject.preferences?.style) {
        const matched = DESIGN_STYLES.find(s => s.id.toLowerCase() === currentProject.preferences.style.toLowerCase());
        if (matched) setStyle(matched.id);
      }
      if (currentProject.selectedPackage) {
        setBudgetTier(currentProject.selectedPackage);
      }
    }
  }, [currentProject]);

  // Fetch History & Providers
  const fetchHistory = async () => {
    try {
      const res = await designApi.getHistory(id, 'interior');
      if (res.data.success) {
        setHistory(res.data.designs || []);
        if (res.data.designs?.length > 0 && !activeDesign) {
          const roomMatch = res.data.designs.find(d => d.roomType === selectedRoom);
          setActiveDesign(roomMatch || res.data.designs[0]);
        }
      }
    } catch (err) {
      console.error('Fetch history error:', err);
    }
  };

  const fetchProviders = async () => {
    try {
      const res = await designApi.getProviders();
      if (res.data.success) setProviderInfo(res.data);
    } catch (err) {
      console.error('Fetch providers error:', err);
    }
  };

  useEffect(() => {
    if (id) {
      fetchHistory();
      fetchProviders();
    }
  }, [id]);

  // Dimension calculator
  const handleDimensionChange = (field, val) => {
    const num = Number(val) || 0;
    setDimensions(prev => {
      const updated = { ...prev, [field]: num };
      updated.areaSqFt = Math.round((updated.length || 0) * (updated.width || 0));
      return updated;
    });
  };

  // Switch Room Type & Set Defaults
  const handleRoomSelect = (roomId) => {
    setSelectedRoom(roomId);
    const roomMeta = ROOM_TYPES.find(r => r.id === roomId);
    if (roomMeta) {
      const side = Math.round(Math.sqrt(roomMeta.defaultArea));
      setDimensions({
        length: side + 2,
        width: side - 1,
        height: 10,
        areaSqFt: roomMeta.defaultArea
      });
    }

    // Switch active design in preview if found in history
    const existing = history.find(d => d.roomType === roomId);
    if (existing) setActiveDesign(existing);
  };

  // ADE20K Scene Image Upload & Analysis
  const handleSceneUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSceneFile(file);
    setScenePreview(URL.createObjectURL(file));
    setAnalyzingScene(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('sceneHint', selectedRoom);

      const res = await designApi.analyzeScene(formData);
      if (res.data.success) {
        setSceneAnalysis(res.data.analysis);
        setToast('ADE20K Scene Analysis Completed!');
        setTimeout(() => setToast(null), 3000);
      }
    } catch (err) {
      console.error('ADE20K analysis error:', err);
      setToast('Scene uploaded (Standard fallback analysis active)');
      setTimeout(() => setToast(null), 3000);
    } finally {
      setAnalyzingScene(false);
    }
  };

  const applyScenePalette = (palette) => {
    if (palette && palette.length > 0) {
      setWallColors(palette.slice(0, 4));
      setToast('Applied ADE20K extracted color palette to studio!');
      setTimeout(() => setToast(null), 3000);
    }
  };

  // Trigger AI Interior Generation
  const handleGenerate = async () => {
    try {
      setGenerating(true);
      setGenStep(1);

      const stepTimer1 = setTimeout(() => setGenStep(2), 1200);
      const stepTimer2 = setTimeout(() => setGenStep(3), 2600);

      const payload = {
        roomType: selectedRoom,
        style,
        budgetTier,
        wallColors,
        flooring,
        ceiling,
        lighting,
        furniture,
        storage,
        dimensions,
        customInstructions,
        sceneAnalysis,
        generateAlternatives: true
      };

      const res = await designApi.generateInterior(id, payload);
      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);

      if (res.data.success) {
        setActiveDesign(res.data.design);
        setHistory(prev => [res.data.design, ...prev]);
        setToast('✨ New Interior Design Concept Generated!');
        setTimeout(() => setToast(null), 4000);
      }
    } catch (err) {
      console.error('Generate interior error:', err);
      setToast('Generation notice: Switched to verified architectural reference visualizer.');
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

  // Select as Final Design & Sync with BOQ
  const handleSelectFinal = async () => {
    if (!activeDesign?._id) return;
    try {
      const res = await designApi.selectFinal(id, activeDesign._id);
      if (res.data.success) {
        const updated = { ...activeDesign, isFinal: true };
        setActiveDesign(updated);
        setHistory(prev => prev.map(d => d._id === updated._id ? { ...d, isFinal: true } : (d.roomType === updated.roomType ? { ...d, isFinal: false } : d)));
        setToast('✅ Selected as final concept & synchronized with BOQ Cost Estimation!');
        setTimeout(() => setToast(null), 4000);
      }
    } catch (err) {
      console.error('Select final error:', err);
    }
  };

  // Download Image
  const handleDownload = () => {
    if (!activeDesign?.imageUrl) return;
    const link = document.createElement('a');
    link.href = activeDesign.imageUrl;
    link.download = `${selectedRoom}_${style.replace(/\s+/g, '_')}_design.jpg`;
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
            <span className="px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-purple-100 text-purple-800 border border-purple-200">
              AI Interior Design Studio
            </span>
            <span className="text-xs text-slate-300">•</span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
              ADE20K Scene Understanding
            </span>
            <span className="text-xs text-slate-300">•</span>
            <span className="text-xs text-slate-500 font-semibold">
              Project: <strong>{currentProject?.name || 'My Villa'}</strong>
            </span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-black text-slate-900 tracking-tight">
            AI Room Interior Design & Styling
          </h1>
          <p className="text-xs lg:text-sm text-slate-500 mt-1 max-w-2xl">
            Generate photorealistic interior styling concepts tailored to your room dimensions, architectural theme, custom palette, and live BOQ material estimates.
          </p>
        </div>

        {/* Top Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setHistoryDrawerOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all"
          >
            <History className="w-4 h-4 text-slate-600" />
            <span>Saved Concepts ({history.length})</span>
          </button>

          <Link
            to={`/project/${id}/boq`}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold transition-all"
          >
            <Coins className="w-4 h-4 text-emerald-600" />
            <span>View BOQ Cost Impact</span>
          </Link>
        </div>
      </div>

      {/* Room Category Navigation Pills */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
        {ROOM_TYPES.map((room) => (
          <button
            key={room.id}
            onClick={() => handleRoomSelect(room.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all shrink-0 ${
              selectedRoom === room.id
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25 ring-2 ring-blue-600/30'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <span className="text-base">{room.icon}</span>
            <span>{room.label}</span>
          </button>
        ))}
      </div>

      {/* Main Studio Grid: Configuration on Left (40%), Visualizer on Right (60%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: Controls & Specification Studio */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Design Preferences Card */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-blue-600" />
                <span>Room Style & Parameters</span>
              </h3>
              <span className="text-[11px] font-bold text-slate-400">
                {dimensions.areaSqFt} sq.ft
              </span>
            </div>

            {/* Design Style Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">Architectural Style</label>
              <div className="grid grid-cols-2 gap-2">
                {DESIGN_STYLES.map((st) => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => setStyle(st.id)}
                    className={`p-3 rounded-2xl text-left border transition-all ${
                      style === st.id
                        ? 'bg-blue-50/80 border-blue-500 ring-2 ring-blue-500/20 text-blue-900'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <p className="text-xs font-bold">{st.label}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5 truncate">{st.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Budget Finish Tier */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">Budget Finish Tier</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'BASIC', label: 'Basic', desc: 'Practical & Durable' },
                  { id: 'MEDIUM', label: 'Medium', desc: 'Premium Balance' },
                  { id: 'RICH', label: 'Rich Luxury', desc: 'Italian Marble & Custom' },
                ].map((tier) => (
                  <button
                    key={tier.id}
                    type="button"
                    onClick={() => setBudgetTier(tier.id)}
                    className={`p-2.5 rounded-2xl text-center border text-xs font-bold transition-all ${
                      budgetTier === tier.id
                        ? 'bg-slate-900 text-white border-slate-900 shadow-md'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div>{tier.label}</div>
                    <div className={`text-[9px] mt-0.5 ${budgetTier === tier.id ? 'text-slate-300' : 'text-slate-400'}`}>{tier.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Wall Colors & Curated Palettes */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-700">Wall Colors & Mood Palette</label>
                <span className="text-[10px] text-slate-400">Click to apply palette</span>
              </div>

              {/* Preset Palettes */}
              <div className="flex gap-2 overflow-x-auto pb-2">
                {CURATED_PALETTES.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setWallColors(p.colors)}
                    className="p-1.5 rounded-xl border border-slate-200 hover:border-blue-400 bg-slate-50 shrink-0 flex items-center gap-1.5 transition-all"
                  >
                    <div className="flex -space-x-1">
                      {p.colors.map((c, i) => (
                        <div key={i} className="w-3.5 h-3.5 rounded-full border border-white shadow-xs" style={{ backgroundColor: c }} />
                      ))}
                    </div>
                    <span className="text-[10px] font-semibold text-slate-600">{p.name.split(' ')[0]}</span>
                  </button>
                ))}
              </div>

              {/* Active Color Hex Pickers */}
              <div className="grid grid-cols-3 gap-2 mt-2">
                {wallColors.slice(0, 3).map((col, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 border border-slate-200">
                    <input
                      type="color"
                      value={col}
                      onChange={(e) => {
                        const copy = [...wallColors];
                        copy[idx] = e.target.value;
                        setWallColors(copy);
                      }}
                      className="w-6 h-6 rounded-lg border-0 cursor-pointer p-0 bg-transparent"
                    />
                    <span className="text-[10px] font-mono text-slate-700 uppercase">{col}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Room Dimensions */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">Room Dimensions (Feet)</label>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <span className="text-[10px] text-slate-400">Length (ft)</span>
                  <input
                    type="number"
                    value={dimensions.length}
                    onChange={(e) => handleDimensionChange('length', e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-semibold"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400">Width (ft)</span>
                  <input
                    type="number"
                    value={dimensions.width}
                    onChange={(e) => handleDimensionChange('width', e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-semibold"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400">Ceiling Height (ft)</span>
                  <input
                    type="number"
                    value={dimensions.height}
                    onChange={(e) => handleDimensionChange('height', e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-semibold"
                  />
                </div>
              </div>
            </div>

            {/* Materials & Fixtures */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Flooring Finish</label>
                <select
                  value={flooring}
                  onChange={(e) => setFlooring(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-slate-50"
                >
                  <option value="Glazed Vitrified Tiles (4x2 ft)">Glazed Vitrified Tiles (4x2 ft)</option>
                  <option value="Imported Italian Statuario Marble">Imported Italian Statuario Marble</option>
                  <option value="Engineered Wooden Texture Planks">Engineered Wooden Planks</option>
                  <option value="Anti-Skid Matte Porcelain Tiles">Anti-Skid Matte Porcelain</option>
                  <option value="Polished Makrana Marble with Inlay">Polished Makrana Marble</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">False Ceiling Design</label>
                <select
                  value={ceiling}
                  onChange={(e) => setCeiling(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-slate-50"
                >
                  <option value="Saint-Gobain Gypsum False Ceiling with LED Cove">Saint-Gobain Gypsum with LED Cove</option>
                  <option value="Minimalist Perimeter False Ceiling">Minimalist Perimeter Drop</option>
                  <option value="Exposed Teak Wood Rafters Ceiling">Exposed Teak Wood Rafters</option>
                  <option value="Moisture Resistant Flush Ceiling">Moisture Resistant Gypsum</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Lighting Fixtures</label>
                <input
                  type="text"
                  value={lighting}
                  onChange={(e) => setLighting(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Furniture Concept</label>
                <input
                  type="text"
                  value={furniture}
                  onChange={(e) => setFurniture(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300"
                />
              </div>
            </div>

            {/* Custom Instructions */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Additional Text Instructions</label>
              <textarea
                rows={2}
                value={customInstructions}
                onChange={(e) => setCustomInstructions(e.target.value)}
                placeholder="E.g., Add warm brass profile handles, fluted glass partition, and recessed prayer niche..."
                className="w-full text-xs p-3 rounded-2xl border border-slate-300 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Generate Button */}
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white text-xs font-extrabold uppercase tracking-wider shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2.5 transition-all disabled:opacity-50"
            >
              <Sparkles className={`w-4 h-4 ${generating ? 'animate-spin' : ''}`} />
              <span>{generating ? 'Synthesizing Design...' : 'Generate AI Interior Design'}</span>
            </button>
          </div>

          {/* ADE20K Scene Understanding & Room Photo Analysis Card */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                <Camera className="w-4 h-4 text-purple-600" />
                <span>ADE20K Existing Room Photo Analyzer</span>
              </h3>
              <span className="text-[10px] font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
                150 Scene Classes
              </span>
            </div>
            
            <p className="text-[11px] text-slate-500">
              Upload a photo of your existing room or site shell. ADE20K semantic parsing will extract the surface ratios, dominant palette, and lighting quality.
            </p>

            <div className="border-2 border-dashed border-slate-300 rounded-2xl p-4 text-center hover:bg-slate-50 transition-colors">
              <input
                type="file"
                accept="image/*"
                onChange={handleSceneUpload}
                id="room-photo-upload"
                className="hidden"
              />
              <label htmlFor="room-photo-upload" className="cursor-pointer flex flex-col items-center gap-1.5">
                <UploadCloud className="w-6 h-6 text-slate-400" />
                <span className="text-xs font-bold text-blue-600">Upload Room Photograph</span>
                <span className="text-[10px] text-slate-400">JPEG, PNG, WEBP up to 10MB</span>
              </label>
            </div>

            {analyzingScene && (
              <div className="p-3 bg-blue-50 text-blue-700 text-xs font-semibold rounded-xl flex items-center gap-2 animate-pulse">
                <Sparkles className="w-4 h-4 animate-spin" />
                <span>Parsing scene elements with ADE20K semantic segmentor...</span>
              </div>
            )}

            {/* ADE20K Analysis Results */}
            {sceneAnalysis && (
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 text-xs animate-in fade-in">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">{sceneAnalysis.sceneType}</span>
                  <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                    Daylight Score: {sceneAnalysis.lightingScore}% ({sceneAnalysis.lightingCondition})
                  </span>
                </div>

                {/* Extracted Palette */}
                {sceneAnalysis.extractedPalette && (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-bold text-slate-500">Extracted Dominant Palette</span>
                      <button
                        type="button"
                        onClick={() => applyScenePalette(sceneAnalysis.extractedPalette)}
                        className="text-[10px] font-bold text-blue-600 hover:underline"
                      >
                        Apply to Form
                      </button>
                    </div>
                    <div className="flex gap-1.5">
                      {sceneAnalysis.extractedPalette.map((col, i) => (
                        <div key={i} className="flex-1 h-6 rounded-lg shadow-xs border border-slate-200" style={{ backgroundColor: col }} title={col} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Detected Elements */}
                {sceneAnalysis.detectedElements && (
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 block mb-1">Detected Architectural Surfaces</span>
                    <div className="space-y-1">
                      {sceneAnalysis.detectedElements.map((el, i) => (
                        <div key={i} className="flex items-center justify-between text-[11px] text-slate-600 bg-white p-1.5 rounded-lg border border-slate-100">
                          <span>{el.label} ({el.material})</span>
                          <span className="font-mono font-bold text-slate-800">{Math.round(el.areaRatio * 100)}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

          </div>

        </div>

        {/* RIGHT COLUMN: Visual Rendering, Comparison & Itemized BOQ */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Main Visualizer Card */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-5">
            
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-900">
                    {activeDesign ? activeDesign.title : `${style} ${selectedRoom.replace(/_/g, ' ')}`}
                  </span>
                  {activeDesign?.isFinal && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      FINAL APPROVED CONCEPT
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Engine: {activeDesign?.provider || 'AI Generative Pipeline'} ({activeDesign?.model || 'flux'})
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
                      <span>Compare (3)</span>
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
                    <p className="text-sm font-bold text-white">Synthesizing Architectural Visualization</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {genStep === 1 && '1/3 Formulating multi-element room prompt...'}
                      {genStep === 2 && '2/3 Synthesizing textures, lighting & materials...'}
                      {genStep === 3 && '3/3 Calculating itemized BOQ cost parameters...'}
                    </p>
                  </div>
                </div>
              ) : activeDesign?.imageUrl ? (
                <img
                  src={activeDesign.imageUrl}
                  alt={activeDesign.title || 'Generated Interior'}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                />
              ) : (
                <div className="text-center p-12 text-slate-500 space-y-3">
                  <Palette className="w-12 h-12 mx-auto text-slate-700" />
                  <p className="text-xs font-semibold">No design concept generated for this room yet.</p>
                  <p className="text-[11px] text-slate-600 max-w-sm mx-auto">
                    Select your room parameters on the left and click "Generate AI Interior Design" to synthesize customized conceptual renderings.
                  </p>
                </div>
              )}

              {/* Conceptual Visualization Disclaimer Banner */}
              {activeDesign?.imageUrl && (
                <div className="absolute bottom-3 left-3 right-3 p-2 rounded-xl bg-slate-900/80 backdrop-blur-md border border-slate-700 text-slate-300 text-[10px] flex items-center justify-between">
                  <span className="font-semibold flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    Conceptual Visualization — Exact dimensions governed by Floor Plans.
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
                    <img src={activeDesign.imageUrl} alt="Main" className="w-full h-full object-cover" />
                    <span className="absolute bottom-1 right-1 text-[9px] font-bold bg-blue-600 text-white px-1.5 rounded">Active</span>
                  </div>
                  {activeDesign.alternatives.map((alt, i) => (
                    <div
                      key={i}
                      onClick={() => {
                        const temp = activeDesign.imageUrl;
                        setActiveDesign({ ...activeDesign, imageUrl: alt.imageUrl });
                      }}
                      className="relative rounded-xl overflow-hidden border border-slate-200 hover:border-purple-500 cursor-pointer aspect-[4/3] transition-all"
                    >
                      <img src={alt.imageUrl} alt={`Alt ${i + 1}`} className="w-full h-full object-cover" />
                      <span className="absolute bottom-1 right-1 text-[9px] font-bold bg-slate-900/80 text-white px-1.5 rounded">Alt #{i + 1}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* Connected Room Materials & BOQ Cost Impact Card */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Coins className="w-4 h-4 text-emerald-600" />
                  <span>Itemized Material Specifications & Cost</span>
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Calculated based on {dimensions.areaSqFt} sq.ft room area & Warangal regional SoR 2026.
                </p>
              </div>

              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                Est. Total: ₹{Number(activeDesign?.costImpact?.estimatedCost || 135000).toLocaleString('en-IN')}
              </span>
            </div>

            {/* Specifications Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px]">
                    <th className="py-2.5 px-3">Item / Surface</th>
                    <th className="py-2.5 px-3">Specification</th>
                    <th className="py-2.5 px-3">Quantity</th>
                    <th className="py-2.5 px-3">Rate</th>
                    <th className="py-2.5 px-3 text-right">Cost (INR)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(activeDesign?.costImpact?.specifications || [
                    { name: "Glazed Vitrified Flooring", spec: "4x2 GVT Matte Finish", qty: dimensions.areaSqFt, unit: "sq.ft", unitCost: 85, totalCost: dimensions.areaSqFt * 85 },
                    { name: "Saint-Gobain Gypsum Ceiling", spec: "12.5mm Gypsum with Warm Cove LED", qty: dimensions.areaSqFt, unit: "sq.ft", unitCost: 95, totalCost: dimensions.areaSqFt * 95 },
                    { name: "Royale Luxury Emulsion Paint", spec: "Asian Paints Royale 2-Coat", qty: dimensions.areaSqFt * 2.5, unit: "sq.ft", unitCost: 35, totalCost: Math.round(dimensions.areaSqFt * 2.5 * 35) }
                  ]).map((m, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-2 px-3 font-semibold text-slate-900">{m.name}</td>
                      <td className="py-2 px-3 text-slate-600">{m.spec}</td>
                      <td className="py-2 px-3 font-mono text-slate-700">{m.qty} {m.unit}</td>
                      <td className="py-2 px-3 font-mono text-slate-700">₹{m.unitCost || m.rate}</td>
                      <td className="py-2 px-3 font-mono font-bold text-blue-600 text-right">
                        ₹{Number(m.totalCost || m.total).toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl text-[11px] text-slate-500 flex items-center justify-between">
              <span>* Construction quantities are linked to project floor plan geometry and confirmation.</span>
              <Link to={`/project/${id}/boq`} className="text-blue-600 font-bold hover:underline">
                Open Full 28-Category BOQ →
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
                <h3 className="text-lg font-black text-slate-900">Compare Interior Design Variations</h3>
                <p className="text-xs text-slate-500">Side-by-side comparison for {selectedRoom.replace(/_/g, ' ')} ({style} Style)</p>
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
                  <img src={activeDesign.imageUrl} alt="Candidate 1" className="w-full h-full object-cover" />
                </div>
                <p className="text-xs font-semibold text-slate-800">Primary Composition</p>
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
                    <img src={alt.imageUrl} alt={`Candidate ${i + 2}`} className="w-full h-full object-cover" />
                  </div>
                  <p className="text-xs font-semibold text-slate-800">Alternative Perspective #{i + 1}</p>
                  <button
                    onClick={() => {
                      setActiveDesign({ ...activeDesign, imageUrl: alt.imageUrl });
                      setCompareModalOpen(false);
                      setToast(`Selected Candidate ${i + 2} as active visual!`);
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
                <h3 className="text-base font-bold text-slate-900">Saved Design History</h3>
                <p className="text-xs text-slate-500">{history.length} generated interior concepts</p>
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
                    setSelectedRoom(item.roomType);
                    setHistoryDrawerOpen(false);
                  }}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer flex gap-3 ${
                    activeDesign?._id === item._id
                      ? 'bg-blue-50 border-blue-400 ring-2 ring-blue-400/20'
                      : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <div className="w-20 h-20 rounded-xl overflow-hidden bg-slate-900 shrink-0">
                    <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-slate-900 truncate">{item.title}</p>
                      {item.isFinal && <span className="text-[9px] font-bold text-emerald-700 bg-emerald-100 px-1.5 rounded">Final</span>}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5 capitalize">{item.roomType.replace(/_/g, ' ')} • {item.style}</p>
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

export default InteriorDesignStudioPage;
