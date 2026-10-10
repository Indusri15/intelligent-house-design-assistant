import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useProject } from '../context/ProjectContext';
import { designApi } from '../services/api';
import {
  Palette,
  Home,
  Sparkles,
  Layers,
  Save,
  CheckCircle2,
  Paintbrush,
  Armchair,
  Lamp,
  ShieldAlert,
  Building2,
  ArrowRight
} from 'lucide-react';

export const DesignStudioPage = () => {
  const { id } = useParams();
  const { currentProject } = useProject();
  const [activeTab, setActiveTab] = useState('exterior');
  const [design, setDesign] = useState(null);
  const [selectedRoomIndex, setSelectedRoomIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    const fetchDesign = async () => {
      try {
        setLoading(true);
        const res = await designApi.get(id);
        if (res.data.success) {
          setDesign(res.data.design);
        }
      } catch (err) {
        console.error('Error fetching design:', err);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchDesign();
  }, [id]);

  const handleSave = async () => {
    try {
      setSaving(true);
      const res = await designApi.update(id, design);
      if (res.data.success) {
        setToast('Design selections updated and saved!');
        setTimeout(() => setToast(null), 3500);
      }
    } catch (err) {
      console.error('Save design error:', err);
    } finally {
      setSaving(false);
    }
  };

  const updateExterior = (field, value) => {
    setDesign(prev => ({
      ...prev,
      exterior: {
        ...prev.exterior,
        [field]: value
      }
    }));
  };

  const updateRoomField = (index, field, value) => {
    const updatedRooms = [...(design.interiorRooms || [])];
    updatedRooms[index] = {
      ...updatedRooms[index],
      [field]: value
    };
    setDesign(prev => ({ ...prev, interiorRooms: updatedRooms }));
  };

  if (loading || !design) {
    return (
      <div className="p-12 text-center text-slate-500 text-xs">
        Loading room-wise design studio...
      </div>
    );
  }

  const rooms = design.interiorRooms || [];
  const currentRoom = rooms[selectedRoomIndex] || null;

  return (
    <div className="space-y-6">
      
      {/* Toast Notification */}
      {toast && (
        <div className="p-3 bg-emerald-600 text-white text-xs font-semibold rounded-xl shadow-lg flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-200 shrink-0" />
          <span>{toast}</span>
        </div>
      )}

      {/* Top Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
              ROOM-WISE DESIGN STUDIO
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs text-slate-500 font-medium">
              Style: <strong>{currentProject?.preferences?.style || 'Contemporary'}</strong>
            </span>
          </div>
          <h1 className="text-xl font-bold text-slate-900">Interior & Exterior Design Studio</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure room-by-room materials, false ceilings, flooring textures, and facade finishes.
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold shadow-sm transition-colors"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Saving...' : 'Save Design Selections'}</span>
        </button>
      </div>

      {/* AI Studios Quick Jump Banner */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link
          to={`/project/${id}/interior`}
          className="p-5 rounded-3xl bg-gradient-to-br from-purple-900 to-indigo-950 text-white border border-purple-700/50 shadow-md hover:shadow-xl transition-all group flex items-center justify-between"
        >
          <div className="space-y-1">
            <span className="px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase bg-purple-500/30 text-purple-200 border border-purple-400/30">
              AI Powered
            </span>
            <h3 className="text-base font-bold text-white group-hover:text-purple-200 transition-colors">
              AI Interior Design Studio →
            </h3>
            <p className="text-[11px] text-purple-200/70">
              Generate photorealistic room interiors with ADE20K Scene AI.
            </p>
          </div>
          <div className="p-3 rounded-2xl bg-purple-800/40 text-purple-300 group-hover:scale-110 transition-transform">
            <Palette className="w-6 h-6" />
          </div>
        </Link>

        <Link
          to={`/project/${id}/exterior`}
          className="p-5 rounded-3xl bg-gradient-to-br from-slate-900 to-blue-950 text-white border border-blue-700/50 shadow-md hover:shadow-xl transition-all group flex items-center justify-between"
        >
          <div className="space-y-1">
            <span className="px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase bg-blue-500/30 text-blue-200 border border-blue-400/30">
              AI Powered
            </span>
            <h3 className="text-base font-bold text-white group-hover:text-blue-200 transition-colors">
              AI Exterior Design Studio →
            </h3>
            <p className="text-[11px] text-blue-200/70">
              Synthesize front elevations, cladding & landscape concepts.
            </p>
          </div>
          <div className="p-3 rounded-2xl bg-blue-800/40 text-blue-300 group-hover:scale-110 transition-transform">
            <Building2 className="w-6 h-6" />
          </div>
        </Link>
      </div>

      {/* Main Tabs (Exterior vs Interior) */}
      <div className="flex gap-2 p-1 bg-slate-200 rounded-xl max-w-sm">
        <button
          onClick={() => setActiveTab('exterior')}
          className={`flex-1 py-2 rounded-lg text-xs font-bold transition-colors ${
            activeTab === 'exterior'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          🏛️ Exterior Facade
        </button>
        <button
          onClick={() => setActiveTab('interior')}
          className={`flex-1 py-2 rounded-lg text-xs font-bold transition-colors ${
            activeTab === 'interior'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          🛋️ Room-Wise Interiors
        </button>
      </div>

      {/* TAB 1: Exterior Facade Studio */}
      {activeTab === 'exterior' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">Exterior Elevation & Materials</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Front Elevation Architectural Style</label>
                <select
                  value={design.exterior?.frontElevationStyle || ''}
                  onChange={(e) => updateExterior('frontElevationStyle', e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Modern Cubical Facade">Modern Cubical Facade with Box Projections</option>
                  <option value="Minimalist Glass & Louvers">Minimalist Framed Glass & WPC Louvers</option>
                  <option value="Heritage Courtyard Elevation">Traditional Indian Sloped Roof & Verandah</option>
                  <option value="Ultra-Luxury Floating Cantilever">Ultra-Luxury Floating Cantilever Villa</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Facade Cladding Material</label>
                <select
                  value={design.exterior?.facadeMaterial || ''}
                  onChange={(e) => updateExterior('facadeMaterial', e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Stone Cladding & Louvers">Natural Teak Sandstone Cladding & WPC Louvers</option>
                  <option value="Porcelain Big Slab Tiles">Large Porcelain Slab Tiles with Concrete Texture</option>
                  <option value="Exposed Wirecut Brickwork">Exposed Wire-cut Red Brickwork & Granite Plinth</option>
                  <option value="Textured Weatherproof Plaster">Grooved Weatherproof Acrylic Texture Plaster</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Balcony & Terrace Railing</label>
                <select
                  value={design.exterior?.balconyRailing || ''}
                  onChange={(e) => updateExterior('balconyRailing', e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Toughened Glass with SS Profile">12mm Toughened Glass with SS 304 Base Profile</option>
                  <option value="Matte Black MS Vertical Louver">Matte Black MS Vertical Louver Railing</option>
                  <option value="Solid Parapet with Granite Cap">Solid Masonry Parapet with Granite Coping</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Boundary Wall & Gate Design</label>
                <select
                  value={design.exterior?.gateDesign || ''}
                  onChange={(e) => updateExterior('gateDesign', e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500"
                >
                  <option value="CNC Laser Cut WPC Composite">CNC Laser Cut Steel Gate with WPC Wooden Planks</option>
                  <option value="Minimalist Charcoal Metal Slats">Minimalist Charcoal Horizontal Metal Slats</option>
                  <option value="Solid Teak Wood Motorized Gate">Solid Teak Wood Inlay Motorized Sliding Gate</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">Exterior Facade Lighting Concept</label>
                <input
                  type="text"
                  value={design.exterior?.lighting || ''}
                  onChange={(e) => updateExterior('lighting', e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300"
                />
              </div>
            </div>
          </div>

          {/* Palette Preview Card */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Facade Color Palette</h3>
            <p className="text-xs text-slate-500">Curated architectural exterior shades tested for weather resistance.</p>
            
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="w-8 h-8 rounded-lg shadow-sm border border-slate-300 bg-[#f8fafc]"></div>
                <div>
                  <p className="text-xs font-bold text-slate-900">Base Wall (70%)</p>
                  <p className="text-[10px] text-slate-500">Off-White / Silk Breeze (#F8FAFC)</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="w-8 h-8 rounded-lg shadow-sm border border-slate-300 bg-[#334155]"></div>
                <div>
                  <p className="text-xs font-bold text-slate-900">Accent Features (20%)</p>
                  <p className="text-[10px] text-slate-500">Slate Charcoal (#334155)</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="w-8 h-8 rounded-lg shadow-sm border border-slate-300 bg-[#d97706]"></div>
                <div>
                  <p className="text-xs font-bold text-slate-900">Warm Highlight (10%)</p>
                  <p className="text-[10px] text-slate-500">Natural Teak Wood Louvers (#D97706)</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* TAB 2: Room-Wise Interiors Studio */}
      {activeTab === 'interior' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* Room Selector Sidebar */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 px-2">Select Space</span>
            {rooms.map((room, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedRoomIndex(idx)}
                className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold transition-all flex items-center justify-between ${
                  selectedRoomIndex === idx
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <span>{room.roomName}</span>
                <span className={`text-[10px] ${selectedRoomIndex === idx ? 'text-blue-200' : 'text-slate-400'}`}>
                  ₹{room.estimatedCost ? Math.round(room.estimatedCost / 1000) + 'k' : ''}
                </span>
              </button>
            ))}
          </div>

          {/* Active Room Detail Studio */}
          {currentRoom && (
            <div className="lg:col-span-3 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-base font-bold text-slate-900">{currentRoom.roomName} Specifications</h3>
                  <p className="text-xs text-slate-500">Room Type: {currentRoom.roomType.replace('_', ' ')}</p>
                </div>
                <span className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-lg border border-blue-200">
                  Est. Interior Cost: ₹{Number(currentRoom.estimatedCost || 120000).toLocaleString('en-IN')}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Flooring Specification</label>
                  <input
                    type="text"
                    value={currentRoom.flooring || ''}
                    onChange={(e) => updateRoomField(selectedRoomIndex, 'flooring', e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Wall Treatment & Accent Panel</label>
                  <input
                    type="text"
                    value={currentRoom.wallTreatment || ''}
                    onChange={(e) => updateRoomField(selectedRoomIndex, 'wallTreatment', e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">False Ceiling Design</label>
                  <input
                    type="text"
                    value={currentRoom.ceilingType || ''}
                    onChange={(e) => updateRoomField(selectedRoomIndex, 'ceilingType', e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Lighting Fixtures</label>
                  <input
                    type="text"
                    value={currentRoom.lightingFixtures || ''}
                    onChange={(e) => updateRoomField(selectedRoomIndex, 'lightingFixtures', e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Furniture Layout Concept</label>
                  <input
                    type="text"
                    value={currentRoom.furnitureLayout || ''}
                    onChange={(e) => updateRoomField(selectedRoomIndex, 'furnitureLayout', e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Wardrobes & Built-In Storage</label>
                  <input
                    type="text"
                    value={currentRoom.storageWardrobes || ''}
                    onChange={(e) => updateRoomField(selectedRoomIndex, 'storageWardrobes', e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              {/* Itemized Materials Breakdown */}
              {currentRoom.materials && currentRoom.materials.length > 0 && (
                <div className="pt-4 border-t border-slate-100">
                  <h4 className="text-xs font-bold text-slate-900 mb-2">Itemized Room Materials & Quantities</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px]">
                          <th className="py-2 px-3">Material / Item</th>
                          <th className="py-2 px-3">Specification</th>
                          <th className="py-2 px-3">Quantity</th>
                          <th className="py-2 px-3">Rate (INR)</th>
                          <th className="py-2 px-3">Cost (INR)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {currentRoom.materials.map((m, idx) => (
                          <tr key={idx}>
                            <td className="py-2 px-3 font-semibold text-slate-900">{m.name}</td>
                            <td className="py-2 px-3 text-slate-600">{m.spec}</td>
                            <td className="py-2 px-3 font-mono">{m.qty} {m.unit}</td>
                            <td className="py-2 px-3">₹ {m.unitCost}</td>
                            <td className="py-2 px-3 font-bold text-blue-600">₹ {Number(m.totalCost).toLocaleString('en-IN')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      )}

    </div>
  );
};

export default DesignStudioPage;
