import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useProject } from '../context/ProjectContext';
import { floorPlanApi } from '../services/api';
import FloorPlanViewer from '../components/FloorPlanViewer';
import {
  Layers,
  Sparkles,
  RefreshCw,
  CheckCircle2,
  BookmarkPlus,
  AlertTriangle,
  FileCode,
  Maximize2
} from 'lucide-react';

export const FloorPlanStudioPage = () => {
  const { id } = useParams();
  const { currentProject } = useProject();
  const [floorPlan, setFloorPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const [revisionNotes, setRevisionNotes] = useState('');
  const [showRevModal, setShowRevModal] = useState(false);
  const [notification, setNotification] = useState(null);

  const fetchPlan = async () => {
    try {
      setLoading(true);
      const res = await floorPlanApi.get(id);
      if (res.data.success) {
        setFloorPlan(res.data.floorPlan);
      }
    } catch (err) {
      console.error('Error fetching plan:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchPlan();
  }, [id]);

  const handleRegenerate = async () => {
    try {
      setRegenerating(true);
      const res = await floorPlanApi.generate(id);
      if (res.data.success) {
        setFloorPlan(res.data.floorPlan);
        showToast('New geometric layout alternatives generated!');
      }
    } catch (err) {
      console.error('Regenerate error:', err);
    } finally {
      setRegenerating(false);
    }
  };

  const handleSelectCandidate = async (candidateId) => {
    try {
      const res = await floorPlanApi.select(id, candidateId);
      if (res.data.success) {
        setFloorPlan(res.data.floorPlan);
        showToast(`Activated layout: ${res.data.floorPlan.layoutCandidateName}`);
      }
    } catch (err) {
      console.error('Candidate select error:', err);
    }
  };

  const handleSaveRevision = async () => {
    try {
      const res = await floorPlanApi.saveRevision(id, revisionNotes);
      if (res.data.success) {
        setFloorPlan(res.data.floorPlan);
        setShowRevModal(false);
        setRevisionNotes('');
        showToast(`Revision ${res.data.floorPlan.revision} saved to history!`);
      }
    } catch (err) {
      console.error('Save rev error:', err);
    }
  };

  const showToast = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-500 text-xs">
        Loading geometric floor plan engine...
      </div>
    );
  }

  const alternatives = floorPlan?.alternatives || [];
  const currentFloor = floorPlan?.floors?.[0];
  const rooms = currentFloor?.rooms || [];

  return (
    <div className="space-y-6">
      
      {/* Toast Notification */}
      {notification && (
        <div className="p-3 bg-blue-600 text-white text-xs font-semibold rounded-xl shadow-lg flex items-center gap-2 animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 text-blue-200 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Top Studio Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
              GEOMETRIC SOLVER V1.0
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs text-slate-500 font-semibold">
              Revision {floorPlan?.revision || 1}
            </span>
          </div>
          <h1 className="text-xl font-bold text-slate-900">Architectural Floor Plan Studio</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Active Option: <strong>{floorPlan?.layoutCandidateName}</strong> ({floorPlan?.totalBuiltUpAreaSqFt} sq.ft Built-Up)
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowRevModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
          >
            <BookmarkPlus className="w-4 h-4" />
            <span>Commit Revision</span>
          </button>
          
          <button
            onClick={handleRegenerate}
            disabled={regenerating}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-semibold shadow-sm transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${regenerating ? 'animate-spin' : ''}`} />
            <span>Regenerate Layouts</span>
          </button>
        </div>
      </div>

      {/* Alternative Layout Candidates Selector */}
      {alternatives.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {alternatives.map((alt) => {
            const isSelected = floorPlan?.layoutCandidateName?.includes(alt.name.split(':')[0]);
            return (
              <div
                key={alt.id}
                onClick={() => handleSelectCandidate(alt.id)}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-blue-50/70 border-blue-500 shadow-sm ring-1 ring-blue-500'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <h4 className="text-xs font-bold text-slate-900">{alt.name}</h4>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    {alt.score}% Score
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">{alt.description}</p>
              </div>
            );
          })}
        </div>
      )}

      {/* Interactive SVG Blueprint Viewer */}
      <FloorPlanViewer floorPlan={floorPlan} project={currentProject} />

      {/* Room Schedule & Mathematical Area Statement Table */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Room Schedule & Area Statement (Ground Floor)</h3>
            <p className="text-xs text-slate-500">Exact room dimensions, calculated carpet areas, and allocated Vastu zones.</p>
          </div>
          <span className="text-xs font-bold text-slate-700 bg-slate-100 px-3 py-1 rounded-lg">
            {rooms.length} Allocated Spaces
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-2.5 px-3">Room / Space Name</th>
                <th className="py-2.5 px-3">Type</th>
                <th className="py-2.5 px-3">Dimensions (W x L)</th>
                <th className="py-2.5 px-3">Area (Sq.Ft)</th>
                <th className="py-2.5 px-3">Vastu Zone</th>
                <th className="py-2.5 px-3">Fenestrations</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rooms.map((r, i) => (
                <tr key={i} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-2.5 px-3 font-bold text-slate-900 flex items-center gap-2">
                    <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: r.color }}></span>
                    <span>{r.name}</span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-600 capitalize">{r.type.replace('_', ' ')}</td>
                  <td className="py-2.5 px-3 font-mono text-slate-700">{r.width}'0" x {r.length}'0"</td>
                  <td className="py-2.5 px-3 font-semibold text-blue-600">{Math.round(r.areaSqFt)} sq.ft</td>
                  <td className="py-2.5 px-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                      {r.vastuZone || 'NE'}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-500">
                    {(r.doors?.length || 0)} Door(s), {(r.windows?.length || 0)} Window(s)
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Revision Modal */}
      {showRevModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900">Save Architectural Revision</h3>
            <p className="text-xs text-slate-500">Record design notes or feedback for Revision {(floorPlan?.revision || 1) + 1}.</p>
            <textarea
              rows="3"
              value={revisionNotes}
              onChange={(e) => setRevisionNotes(e.target.value)}
              placeholder="e.g. Expanded kitchen pantry counter and aligned master bed..."
              className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowRevModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveRevision}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-sm"
              >
                Save Revision
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default FloorPlanStudioPage;
