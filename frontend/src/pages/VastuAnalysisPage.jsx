import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useProject } from '../context/ProjectContext';
import { vastuApi } from '../services/api';
import {
  Compass,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Info,
  ShieldCheck,
  Flame,
  Droplet,
  Wind,
  Mountain,
  Sun
} from 'lucide-react';

export const VastuAnalysisPage = () => {
  const { id } = useParams();
  const { currentProject } = useProject();
  const [vastu, setVastu] = useState(null);
  const [loading, setLoading] = useState(true);
  const [evaluating, setEvaluating] = useState(false);

  const fetchVastu = async () => {
    try {
      setLoading(true);
      const res = await vastuApi.get(id);
      if (res.data.success) {
        setVastu(res.data.vastu);
      }
    } catch (err) {
      console.error('Error fetching Vastu:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchVastu();
  }, [id]);

  const handleReevaluate = async () => {
    try {
      setEvaluating(true);
      const res = await vastuApi.evaluate(id);
      if (res.data.success) {
        setVastu(res.data.vastu);
      }
    } catch (err) {
      console.error('Re-evaluate error:', err);
    } finally {
      setEvaluating(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-500 text-xs">
        Analyzing parametric Vastu Shastra compass orientations...
      </div>
    );
  }

  const score = vastu?.overallScore || 85;
  const grade = vastu?.grade || 'GOOD';
  const evaluations = vastu?.evaluations || [];

  return (
    <div className="space-y-6">
      
      {/* Top Header Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
              VASTU PURUSHA MANDALA EXPERT
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs text-slate-500 font-semibold">
              Facing: {currentProject?.plot?.facingDirection || 'East'}
            </span>
          </div>
          <h1 className="text-xl font-bold text-slate-900">Vastu Shastra Compliance Studio</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Spatial harmony, natural solar morning illumination, and wind circulation analysis based on canonical Vastu rules.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-200">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <div>
              <p className="text-[10px] uppercase font-bold text-emerald-700">Vastu Rating</p>
              <p className="text-sm font-extrabold text-emerald-900">{score}/100 ({grade})</p>
            </div>
          </div>

          <button
            onClick={handleReevaluate}
            disabled={evaluating}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-semibold shadow-sm transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${evaluating ? 'animate-spin' : ''}`} />
            <span>Re-evaluate</span>
          </button>
        </div>
      </div>

      {/* 8-Zone Compass Visualizer & Elemental Zones Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        
        <div className="p-4 rounded-xl bg-cyan-50/70 border border-cyan-200">
          <div className="flex items-center gap-2 text-cyan-800 font-bold text-xs mb-1">
            <Droplet className="w-4 h-4 text-cyan-600" />
            <span>North-East (Ishanya)</span>
          </div>
          <p className="text-[11px] text-cyan-900">Water / Mind: Pooja room, open balcony, morning solar energy.</p>
        </div>

        <div className="p-4 rounded-xl bg-orange-50/70 border border-orange-200">
          <div className="flex items-center gap-2 text-orange-800 font-bold text-xs mb-1">
            <Flame className="w-4 h-4 text-orange-600" />
            <span>South-East (Agneya)</span>
          </div>
          <p className="text-[11px] text-orange-900">Fire: Primary modular kitchen & electrical distribution panel.</p>
        </div>

        <div className="p-4 rounded-xl bg-purple-50/70 border border-purple-200">
          <div className="flex items-center gap-2 text-purple-800 font-bold text-xs mb-1">
            <Mountain className="w-4 h-4 text-purple-600" />
            <span>South-West (Niruthi)</span>
          </div>
          <p className="text-[11px] text-purple-900">Earth / Stability: Master bedroom & heavy structural column load.</p>
        </div>

        <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200">
          <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs mb-1">
            <Wind className="w-4 h-4 text-emerald-600" />
            <span>North-West (Vayu)</span>
          </div>
          <p className="text-[11px] text-emerald-900">Air / Wind: Guest room, parking, bathrooms & utility wash.</p>
        </div>

      </div>

      {/* Room-by-Room Evaluation Cards */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-slate-900">Room-Wise Placement Audit</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {evaluations.map((ev, idx) => {
            const isOpt = ev.status === 'OPTIMAL';
            const isAcc = ev.status === 'ACCEPTABLE';
            return (
              <div
                key={idx}
                className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">{ev.roomName}</h4>
                    <p className="text-xs text-slate-500">
                      Allocated Zone: <strong className="text-slate-800">{ev.allocatedZone}</strong> | Optimal: {ev.recommendedZones?.join(', ')}
                    </p>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    isOpt
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      : isAcc
                      ? 'bg-amber-100 text-amber-800 border border-amber-200'
                      : 'bg-rose-100 text-rose-800 border border-rose-200'
                  }`}>
                    {ev.status.replace('_', ' ')} ({ev.score}%)
                  </span>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-2.5 rounded-xl">
                  {ev.explanation}
                </p>

                <div className="flex items-start gap-2 text-[11px] text-slate-700 bg-blue-50/60 p-2.5 rounded-xl border border-blue-100">
                  <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-blue-900">Architectural Recommendation: </strong>
                    <span>{ev.suggestedRemedy}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Engineering Notice */}
      <div className="p-4 rounded-xl bg-slate-100 border border-slate-200 text-slate-600 text-xs flex items-center gap-3">
        <AlertTriangle className="w-5 h-5 text-slate-400 shrink-0" />
        <span>
          <strong>Engineering & Bylaw Notice:</strong> Vastu Shastra suggestions are traditional spatial guidelines for solar exposure and air comfort. Mandatory municipal setbacks, ventilation bylaws, and structural load calculations must never be compromised solely for orientation.
        </span>
      </div>

    </div>
  );
};

export default VastuAnalysisPage;
