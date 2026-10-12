import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useProject } from '../context/ProjectContext';
import { progressApi } from '../services/api';
import {
  CalendarCheck,
  CheckCircle2,
  Clock,
  AlertCircle,
  ArrowRight,
  ShieldAlert,
  User,
  Package,
  FileText,
  Lock
} from 'lucide-react';

export const ProgressTrackerPage = () => {
  const { id } = useParams();
  const { currentProject } = useProject();
  const [stages, setStages] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedStage, setSelectedStage] = useState(null);
  const [exceptionReason, setExceptionReason] = useState('');
  const [showExceptionModal, setShowExceptionModal] = useState(false);
  const [toast, setToast] = useState(null);

  const fetchStages = async () => {
    try {
      setLoading(true);
      const res = await progressApi.getStages(id);
      if (res.data.success) {
        setStages(res.data.stages);
        setMetrics(res.data.metrics);
      }
    } catch (err) {
      console.error('Error fetching stages:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchStages();
  }, [id]);

  const handleComplete = async (stage) => {
    try {
      const res = await progressApi.completeStage(id, stage._id || stage.id, 'Verified on site completion');
      if (res.data.success) {
        setStages(res.data.stages);
        setMetrics(res.data.metrics);
        showToast(`Milestone '${stage.name}' marked completed!`);
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Prerequisite stage incomplete!', true);
    }
  };

  const handleUpdateStatus = async (stageId, newStatus) => {
    try {
      const res = await progressApi.updateStage(id, stageId, {
        status: newStatus,
        progressPercentage: newStatus === 'In Progress' ? 50 : newStatus === 'Completed' ? 100 : 0
      });
      if (res.data.success) {
        fetchStages();
        showToast(`Stage status updated to '${newStatus}'`);
      }
    } catch (err) {
      console.error('Update status error:', err);
    }
  };

  const handleRecordException = async () => {
    if (!exceptionReason || !selectedStage) return;
    try {
      const res = await progressApi.recordException(id, selectedStage._id || selectedStage.id, exceptionReason);
      if (res.data.success) {
        setShowExceptionModal(false);
        setExceptionReason('');
        fetchStages();
        showToast('Dependency exception override recorded.');
      }
    } catch (err) {
      console.error('Record exception error:', err);
    }
  };

  const showToast = (msg, isError = false) => {
    setToast({ msg, isError });
    setTimeout(() => setToast(null), 4000);
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-500 text-xs">
        Loading 21-stage construction dependency timeline...
      </div>
    );
  }

  const nextTask = metrics?.nextTask;
  const overallPercent = metrics?.overallPercentage || 0;

  return (
    <div className="space-y-6">
      
      {/* Toast */}
      {toast && (
        <div className={`p-3 text-white text-xs font-semibold rounded-xl shadow-lg flex items-center gap-2 animate-in fade-in ${
          toast.isError ? 'bg-red-600' : 'bg-emerald-600'
        }`}>
          {toast.isError ? <AlertCircle className="w-4 h-4 text-red-200" /> : <CheckCircle2 className="w-4 h-4 text-emerald-200" />}
          <span>{toast.msg}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
              TOPOLOGICAL DEPENDENCY ENGINE
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs text-slate-500 font-semibold">
              {metrics?.completedCount} of {metrics?.totalStages} Stages Completed
            </span>
          </div>
          <h1 className="text-xl font-bold text-slate-900">Construction Milestone & Progress Tracker</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            21 standardized civil & architectural construction stages with automated prerequisite validation.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Overall Progress</span>
            <span className="text-xl font-extrabold text-blue-600">{overallPercent}%</span>
          </div>
          <div className="w-24 bg-slate-100 rounded-full h-2.5 overflow-hidden">
            <div className="bg-blue-600 h-full rounded-full transition-all duration-500" style={{ width: `${overallPercent}%` }}></div>
          </div>
        </div>
      </div>

      {/* Recommended Next Eligible Task Banner */}
      {nextTask && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-900 to-slate-900 text-white shadow-md flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/30 text-blue-400 border border-blue-500/40 flex items-center justify-center">
              <CalendarCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-blue-400 tracking-wider">Next Recommended Task</span>
              <h3 className="text-sm font-bold text-white mt-0.5">{nextTask.code}: {nextTask.name}</h3>
              <p className="text-[11px] text-slate-300">Category: {nextTask.category}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-300">Required Materials:</span>
            <span className="text-xs font-semibold bg-slate-800 px-3 py-1 rounded-lg text-blue-300 border border-slate-700">
              {nextTask.requiredMaterials?.[0]?.name || 'Drawings & Civil Tools'}
            </span>
          </div>
        </div>
      )}

      {/* 21 Stages Interactive Timeline List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden divide-y divide-slate-100">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Construction Milestone Sequence</h3>
          <span className="text-[11px] text-slate-500">Click actions to advance milestones</span>
        </div>

        {stages.map((stage) => {
          const isComplete = stage.status === 'Completed';
          const isInProgress = stage.status === 'In Progress';
          const isBlocked = stage.status === 'Blocked';

          return (
            <div
              key={stage._id || stage.id}
              className={`p-4 transition-colors flex flex-wrap items-center justify-between gap-4 ${
                isComplete ? 'bg-emerald-50/20' : isInProgress ? 'bg-blue-50/30' : 'hover:bg-slate-50/60'
              }`}
            >
              <div className="flex items-center gap-3.5 min-w-[280px]">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                  isComplete
                    ? 'bg-emerald-100 text-emerald-700'
                    : isInProgress
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-slate-100 text-slate-500'
                }`}>
                  {stage.stageOrder}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">{stage.name}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                      {stage.code}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-500">
                    <span>Category: <strong>{stage.category}</strong></span>
                    <span>•</span>
                    <span>Contractor: {stage.assignedContractor}</span>
                    <span>•</span>
                    <span>Est: ₹{Number(stage.estimatedCost || 0).toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>

              {/* Status Controls */}
              {(() => {
                const hasDeps = stage.dependencies && stage.dependencies.length > 0;
                const unmetDeps = hasDeps
                  ? stage.dependencies.filter(depCode => stages.find(s => s.code === depCode)?.status !== 'Completed')
                  : [];
                const isEligible = unmetDeps.length === 0 || stage.exceptionOverride?.isOverridden;

                return (
                  <div className="flex items-center gap-2.5">
                    <select
                      value={stage.status}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === 'Completed' && !isEligible) {
                          showToast(`Cannot mark complete: prerequisite stages (${unmetDeps.join(', ')}) are incomplete.`, true);
                          return;
                        }
                        handleUpdateStatus(stage._id || stage.id, val);
                      }}
                      className={`text-xs font-bold px-3 py-1.5 rounded-lg border focus:outline-none ${
                        isComplete
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                          : isInProgress
                          ? 'bg-blue-50 text-blue-800 border-blue-300'
                          : 'bg-slate-50 text-slate-700 border-slate-300'
                      }`}
                    >
                      <option value="Not Started">Not Started</option>
                      <option value="Ready">Ready</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Blocked">Blocked</option>
                      <option value="Completed" disabled={!isEligible && !isComplete}>
                        Completed {!isEligible && !isComplete ? '(Prerequisites Pending)' : ''}
                      </option>
                    </select>

                    {isComplete ? (
                      <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-100 text-emerald-800 text-xs font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Completed</span>
                      </span>
                    ) : isEligible ? (
                      <button
                        onClick={() => handleComplete(stage)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition-colors"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Complete</span>
                      </button>
                    ) : (
                      <span
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 text-slate-500 text-[11px] font-medium border border-slate-200 cursor-help"
                        title={`Prerequisites incomplete: ${unmetDeps.join(', ')}. Complete earlier stages first or record an engineering exception override.`}
                      >
                        <Lock className="w-3 h-3 text-slate-400" />
                        <span>Prereq: {unmetDeps.join(', ')}</span>
                      </span>
                    )}

                    {stage.dependencies && stage.dependencies.length > 0 && !isComplete && (
                      <button
                        onClick={() => { setSelectedStage(stage); setShowExceptionModal(true); }}
                        className="p-1.5 text-slate-400 hover:text-amber-600 rounded-lg"
                        title="Record Prerequisite Exception Override"
                      >
                        <ShieldAlert className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                );
              })()}
            </div>
          );
        })}
      </div>

      {/* Exception Override Modal */}
      {showExceptionModal && selectedStage && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900">Record Justified Dependency Override</h3>
            <p className="text-xs text-slate-500">
              Stage <strong>{selectedStage.name}</strong> requires prerequisites ({selectedStage.dependencies.join(', ')}). Record a justified engineering reason to bypass strict sequencing:
            </p>
            <textarea
              rows="3"
              value={exceptionReason}
              onChange={(e) => setExceptionReason(e.target.value)}
              placeholder="e.g. Verified early material arrival and site weather clearance..."
              className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowExceptionModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={handleRecordException}
                disabled={!exceptionReason.trim()}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white shadow-sm"
              >
                Authorize Exception
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ProgressTrackerPage;
