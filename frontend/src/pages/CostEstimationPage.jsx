import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useProject } from '../context/ProjectContext';
import { estimationApi } from '../services/api';
import {
  Calculator,
  Filter,
  RefreshCw,
  Sparkles,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  Download,
  Info
} from 'lucide-react';

export const CostEstimationPage = () => {
  const { id } = useParams();
  const { currentProject } = useProject();
  const [estimate, setEstimate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [recalculating, setRecalculating] = useState(false);

  const fetchEstimate = async () => {
    try {
      setLoading(true);
      const res = await estimationApi.get(id);
      if (res.data.success) {
        setEstimate(res.data.estimate);
      }
    } catch (err) {
      console.error('Error fetching BOQ:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchEstimate();
  }, [id]);

  const handleRecalculate = async () => {
    try {
      setRecalculating(true);
      const res = await estimationApi.recalculate(id, currentProject?.selectedPackage || 'MEDIUM');
      if (res.data.success) {
        setEstimate(res.data.estimate);
      }
    } catch (err) {
      console.error('Recalculate error:', err);
    } finally {
      setRecalculating(false);
    }
  };

  if (loading || !estimate) {
    return (
      <div className="p-12 text-center text-slate-500 text-xs">
        Calculating 28-category itemized Bill of Quantities...
      </div>
    );
  }

  const items = estimate.boqLineItems || [];
  const categories = ['ALL', ...new Set(items.map(i => i.category))];
  const filteredItems = selectedCategory === 'ALL' ? items : items.filter(i => i.category === selectedCategory);

  const summary = estimate.summary || {};
  const diff = estimate.budgetDifference || 0;

  return (
    <div className="space-y-6">
      
      {/* Top Header Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              {estimate.selectedPackage || 'MEDIUM'} TIER ESTIMATE
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs text-slate-500 font-semibold">
              Warangal / Telangana SoR 2026
            </span>
          </div>
          <h1 className="text-xl font-bold text-slate-900">Bill of Quantities (BOQ) & Cost Estimation</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Transparent itemized quantities, wastage allowances, material costs, and labour expenses for {estimate.totalBuiltUpAreaSqFt} sq.ft built-up area.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRecalculate}
            disabled={recalculating}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-semibold shadow-sm transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${recalculating ? 'animate-spin' : ''}`} />
            <span>Recalculate</span>
          </button>
        </div>
      </div>

      {/* Financial Overview Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <span className="text-[10px] uppercase font-bold text-slate-400">Total Construction Cost</span>
          <h3 className="text-xl font-bold text-slate-900 mt-1">₹ {Number(estimate.totalEstimatedCost).toLocaleString('en-IN')}</h3>
          <p className="text-[11px] text-blue-600 font-semibold mt-1">₹ {estimate.costPerSqFt} / sq.ft</p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <span className="text-[10px] uppercase font-bold text-slate-400">Material Cost Share</span>
          <h3 className="text-xl font-bold text-emerald-600 mt-1">₹ {Number(summary.materialCost || 0).toLocaleString('en-IN')}</h3>
          <p className="text-[11px] text-slate-500 mt-1">
            {Math.round(((summary.materialCost || 0) / estimate.totalEstimatedCost) * 100)}% of total cost
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <span className="text-[10px] uppercase font-bold text-slate-400">Labour & Machinery</span>
          <h3 className="text-xl font-bold text-amber-600 mt-1">₹ {Number(summary.labourCost || 0).toLocaleString('en-IN')}</h3>
          <p className="text-[11px] text-slate-500 mt-1">
            {Math.round(((summary.labourCost || 0) / estimate.totalEstimatedCost) * 100)}% of total cost
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <span className="text-[10px] uppercase font-bold text-slate-400">Budget Variance</span>
          <h3 className={`text-xl font-bold mt-1 ${diff >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            ₹ {Math.abs(diff).toLocaleString('en-IN')}
          </h3>
          <p className="text-[11px] font-medium mt-1 text-slate-500">
            {diff >= 0 ? 'Projected Savings' : 'Estimated Shortfall'}
          </p>
        </div>
      </div>

      {/* Category Filter Chips */}
      <div className="flex gap-2 overflow-x-auto pb-1 text-xs">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3.5 py-1.5 rounded-xl font-semibold shrink-0 transition-colors ${
              selectedCategory === cat
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Itemized BOQ Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            {selectedCategory === 'ALL' ? 'Complete 28-Category Schedule of Quantities' : selectedCategory} ({filteredItems.length} items)
          </h3>
          <span className="text-[11px] text-slate-500">IS 1200 Standards & Regional SoR</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-600 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                <th className="py-2.5 px-3">Code</th>
                <th className="py-2.5 px-3">Item Description</th>
                <th className="py-2.5 px-3">Quantity & Unit</th>
                <th className="py-2.5 px-3">Wastage</th>
                <th className="py-2.5 px-3">Mat. Rate</th>
                <th className="py-2.5 px-3">Mat. Cost</th>
                <th className="py-2.5 px-3">Labour Cost</th>
                <th className="py-2.5 px-3">Total (INR)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredItems.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-3 font-mono font-bold text-slate-600">{item.code}</td>
                  <td className="py-3 px-3">
                    <p className="font-bold text-slate-900">{item.itemName}</p>
                    <p className="text-[11px] text-slate-500">{item.description}</p>
                  </td>
                  <td className="py-3 px-3 font-mono font-semibold text-slate-800">
                    {item.quantity} {item.unit}
                  </td>
                  <td className="py-3 px-3 text-slate-500 font-mono">
                    {item.wastagePercentage ? `${item.wastagePercentage}%` : '-'}
                  </td>
                  <td className="py-3 px-3 font-mono">
                    {item.materialRate ? `₹${item.materialRate}` : '-'}
                  </td>
                  <td className="py-3 px-3 font-mono font-semibold text-slate-700">
                    {item.materialCost ? `₹${Number(item.materialCost).toLocaleString('en-IN')}` : '-'}
                  </td>
                  <td className="py-3 px-3 font-mono font-semibold text-slate-700">
                    {item.labourCost ? `₹${Number(item.labourCost).toLocaleString('en-IN')}` : '-'}
                  </td>
                  <td className="py-3 px-3 font-mono font-bold text-blue-600">
                    ₹ {Number(item.totalCost).toLocaleString('en-IN')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default CostEstimationPage;
