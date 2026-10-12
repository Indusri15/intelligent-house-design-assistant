import React, { useState } from 'react';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Download,
  Printer,
  Eye,
  Layers,
  Compass,
  Maximize2
} from 'lucide-react';

export const FloorPlanViewer = ({ floorPlan, project }) => {
  const [activeFloorIndex, setActiveFloorIndex] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [layers, setLayers] = useState({
    dimensions: true,
    labels: true,
    doorsWindows: true,
    vastuBadges: true,
  });

  const floors = floorPlan?.floors || [];
  const currentFloor = floors[activeFloorIndex] || null;

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.15, 2.0));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.15, 0.6));
  const handleResetZoom = () => setZoom(1);

  const downloadSvg = () => {
    if (!currentFloor?.svgContent) return;
    const blob = new Blob([currentFloor.svgContent], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${project?.name || 'House'}_Floor_${activeFloorIndex + 1}_Blueprint.svg`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  if (!floorPlan || floors.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
        <p className="text-slate-500 text-sm">No floor plan data available for this project.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
      
      {/* Top Controls Bar */}
      <div className="p-4 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-4">
        
        {/* Floor Switcher */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-medium">Floor:</span>
          <div className="flex bg-slate-800 rounded-lg p-1 border border-slate-700">
            {floors.map((floor, idx) => (
              <button
                key={idx}
                onClick={() => { setActiveFloorIndex(idx); setSelectedRoom(null); }}
                className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors ${
                  activeFloorIndex === idx
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                {floor.floorName}
              </button>
            ))}
          </div>
        </div>

        {/* View & Layer Toggles */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setLayers(p => ({ ...p, vastuBadges: !p.vastuBadges }))}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
              layers.vastuBadges
                ? 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
          >
            🧭 Vastu Tags
          </button>
          <button
            onClick={() => setLayers(p => ({ ...p, dimensions: !p.dimensions }))}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
              layers.dimensions
                ? 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
          >
            📏 Dimensions
          </button>
        </div>

        {/* Zoom & Action Buttons */}
        <div className="flex items-center gap-1.5">
          <button onClick={handleZoomOut} className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg" title="Zoom Out">
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-xs font-mono text-slate-400 px-1">{Math.round(zoom * 100)}%</span>
          <button onClick={handleZoomIn} className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg" title="Zoom In">
            <ZoomIn className="w-4 h-4" />
          </button>
          <button onClick={handleResetZoom} className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg" title="Reset Zoom">
            <RotateCcw className="w-4 h-4" />
          </button>

          <div className="w-[1px] h-5 bg-slate-700 mx-1"></div>

          <button onClick={downloadSvg} className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition-colors" title="Download Vector SVG">
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export SVG</span>
          </button>
          <button onClick={handlePrint} className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg" title="Print Blueprint">
            <Printer className="w-4 h-4" />
          </button>
        </div>

      </div>

      {/* Blueprint Drawing Viewport */}
      <div className="relative min-h-[440px] max-h-[580px] p-6 overflow-auto bg-slate-100 flex items-center justify-center blueprint-grid">
        
        {/* Rendered SVG Content */}
        <div
          style={{ transform: `scale(${zoom})`, transformOrigin: 'center center', transition: 'transform 0.15s ease-out' }}
          className="shadow-2xl rounded-xl overflow-hidden bg-white max-w-full"
          dangerouslySetInnerHTML={{ __html: currentFloor?.svgContent || '' }}
        />

      </div>

      {/* Architectural Blueprint Legend Panel for Homeowners */}
      <div className="p-3 bg-white border-t border-slate-200 text-xs">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Plan Symbol Legend & Standards:</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 text-[11px] text-slate-600">
          <div className="flex items-center gap-1.5 p-1.5 rounded-lg bg-slate-50 border border-slate-200">
            <span className="w-3.5 h-3.5 rounded bg-slate-800 shrink-0"></span>
            <span>External 9" Walls</span>
          </div>
          <div className="flex items-center gap-1.5 p-1.5 rounded-lg bg-slate-50 border border-slate-200">
            <span className="w-3.5 h-3.5 rounded bg-slate-400 shrink-0"></span>
            <span>Internal 4.5" Walls</span>
          </div>
          <div className="flex items-center gap-1.5 p-1.5 rounded-lg bg-slate-50 border border-slate-200">
            <span className="w-3.5 h-3.5 rounded border border-blue-500 border-dashed shrink-0"></span>
            <span>Door Swing Arc</span>
          </div>
          <div className="flex items-center gap-1.5 p-1.5 rounded-lg bg-slate-50 border border-slate-200">
            <span className="w-3.5 h-1.5 rounded bg-sky-400 shrink-0"></span>
            <span>Glazed Windows</span>
          </div>
          <div className="flex items-center gap-1.5 p-1.5 rounded-lg bg-slate-50 border border-slate-200">
            <span className="w-3.5 h-3.5 rounded bg-amber-100 border border-amber-300 shrink-0"></span>
            <span>Vastu Quadrants</span>
          </div>
          <div className="flex items-center gap-1.5 p-1.5 rounded-lg bg-slate-50 border border-slate-200">
            <span className="w-3.5 h-3.5 rounded bg-red-500 shrink-0 text-[9px] text-white font-bold flex items-center justify-center">N</span>
            <span>True North</span>
          </div>
        </div>
      </div>

      {/* Floor Summary Footer Bar */}
      <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
        <div>
          <span className="font-bold text-slate-900">{currentFloor?.floorName}</span>: Built-up Area <strong className="text-blue-600">{currentFloor?.floorAreaSqFt} sq.ft</strong> | Total Project: <strong>{floorPlan.totalBuiltUpAreaSqFt} sq.ft</strong>
        </div>
        <div className="flex items-center gap-4 text-slate-500 text-[11px]">
          <span>Facing: <strong className="text-slate-800">{project?.plot?.facingDirection || 'East'}</strong></span>
          <span>•</span>
          <span>Permitted Boundary: {currentFloor?.boundary?.width}' x {currentFloor?.boundary?.length}'</span>
        </div>
      </div>

    </div>
  );
};

export default FloorPlanViewer;
