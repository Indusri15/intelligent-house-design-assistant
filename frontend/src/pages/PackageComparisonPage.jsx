import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useProject } from '../context/ProjectContext';
import { estimationApi } from '../services/api';
import {
  Sparkles,
  Check,
  X,
  CheckCircle2,
  TrendingDown,
  TrendingUp,
  ShieldCheck,
  Layers
} from 'lucide-react';

export const PackageComparisonPage = () => {
  const { id } = useParams();
  const { currentProject, selectProjectById } = useProject();
  const [packageData, setPackageData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selecting, setSelecting] = useState(null);
  const [toast, setToast] = useState(null);

  const fetchPackages = async () => {
    try {
      setLoading(true);
      const res = await estimationApi.getPackages(id);
      if (res.data.success) {
        setPackageData(res.data);
      }
    } catch (err) {
      console.error('Error fetching packages:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchPackages();
  }, [id]);

  const handleSelectPackage = async (tier) => {
    try {
      setSelecting(tier);
      const res = await estimationApi.selectPackage(id, tier);
      if (res.data.success) {
        setToast(`Active project package updated to '${tier}' tier!`);
        await fetchPackages();
        await selectProjectById(id);
        setTimeout(() => setToast(null), 3500);
      }
    } catch (err) {
      console.error('Error selecting package:', err);
    } finally {
      setSelecting(null);
    }
  };

  if (loading || !packageData) {
    return (
      <div className="p-12 text-center text-slate-500 text-xs">
        Comparing 3-tier construction packages...
      </div>
    );
  }

  const { packages, selectedPackage, userBudget, builtUpArea } = packageData;
  const tiers = [
    { key: 'BASIC', data: packages.basic, color: 'blue', badge: 'Standard / Budget-Conscious' },
    { key: 'MEDIUM', data: packages.medium, color: 'purple', badge: 'Most Popular / Premium Value' },
    { key: 'RICH', data: packages.rich, color: 'amber', badge: 'Ultra-Luxury & Smart Home' }
  ];

  return (
    <div className="space-y-6">
      
      {/* Toast Notification */}
      {toast && (
        <div className="p-3 bg-emerald-600 text-white text-xs font-semibold rounded-xl shadow-lg flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-200 shrink-0" />
          <span>{toast}</span>
        </div>
      )}

      {/* Top Header Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
              3-TIER SPECIFICATION MATRIX
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs text-slate-500 font-semibold">
              Built-Up: {builtUpArea} sq.ft | Budget: ₹{Number(userBudget).toLocaleString('en-IN')}
            </span>
          </div>
          <h1 className="text-xl font-bold text-slate-900">Construction Package Comparison</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Switch between finishing tiers. All packages use the same plot, room layouts, and structural engineering safety standards.
          </p>
        </div>
      </div>

      {/* 3 Package Columns Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {tiers.map(({ key, data, badge }) => {
          const isCurrent = (selectedPackage === key);
          const diff = data.diffFromBudget || 0;

          return (
            <div
              key={key}
              className={`rounded-2xl border transition-all flex flex-col justify-between ${
                isCurrent
                  ? 'bg-white border-blue-600 ring-2 ring-blue-600 shadow-lg'
                  : 'bg-white border-slate-200 shadow-sm hover:border-slate-300'
              }`}
            >
              <div className="p-6 space-y-4">
                
                {/* Badge & Title */}
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                      {badge}
                    </span>
                    {isCurrent && (
                      <span className="text-[10px] uppercase font-extrabold px-2.5 py-0.5 rounded-full bg-blue-600 text-white">
                        Active Tier
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">{data.name}</h3>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-2xl font-extrabold text-slate-900">₹ {data.costPerSqFt}</span>
                    <span className="text-xs text-slate-500">/ sq.ft</span>
                  </div>
                  <p className="text-sm font-bold text-blue-600 mt-0.5">
                    Total: ₹ {Number(data.totalCost).toLocaleString('en-IN')}
                  </p>
                </div>

                {/* Budget Variance */}
                <div className={`p-3 rounded-xl text-xs font-semibold flex items-center justify-between ${
                  diff >= 0 ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-800'
                }`}>
                  <span>Variance from Budget:</span>
                  <span>{diff >= 0 ? `+ ₹${Math.abs(diff).toLocaleString('en-IN')} Savings` : `- ₹${Math.abs(diff).toLocaleString('en-IN')} Shortfall`}</span>
                </div>

                {/* Cost Distribution */}
                <div className="p-3 bg-slate-50 rounded-xl text-[11px] text-slate-600 space-y-1">
                  <div className="flex justify-between">
                    <span>Materials:</span>
                    <strong className="text-slate-800">₹ {Number(data.materialsCost).toLocaleString('en-IN')}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Labour & Supervision:</span>
                    <strong className="text-slate-800">₹ {Number(data.labourCost).toLocaleString('en-IN')}</strong>
                  </div>
                </div>

                {/* Specifications Checklist */}
                <div>
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">Included Specifications</h4>
                  <ul className="space-y-2 text-xs text-slate-600">
                    {data.specs.map((spec, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{spec}</span>
                      </li>
                    ))}
                  </ul>
                </div>

              </div>

              {/* Action Button */}
              <div className="p-6 pt-0">
                <button
                  onClick={() => handleSelectPackage(key)}
                  disabled={isCurrent || selecting === key}
                  className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm ${
                    isCurrent
                      ? 'bg-slate-100 text-slate-400 cursor-default'
                      : 'bg-blue-600 hover:bg-blue-500 text-white hover:shadow-md'
                  }`}
                >
                  {selecting === key ? 'Activating...' : isCurrent ? '✓ Active Selected Package' : `Activate ${key} Package`}
                </button>
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
};

export default PackageComparisonPage;
