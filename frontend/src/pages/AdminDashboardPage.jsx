import React, { useState, useEffect } from 'react';
import { adminApi, estimationApi } from '../services/api';
import {
  ShieldCheck,
  Building2,
  Users,
  Calculator,
  Save,
  CheckCircle2,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';

export const AdminDashboardPage = () => {
  const [stats, setStats] = useState(null);
  const [rates, setRates] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const [statsRes, ratesRes] = await Promise.all([
        adminApi.getStats(),
        estimationApi.getRates()
      ]);

      if (statsRes.data.success) setStats(statsRes.data.stats);
      if (ratesRes.data.success) setRates(ratesRes.data.rates);
    } catch (err) {
      console.error('Admin data fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleUpdateRate = (category, key, newRate) => {
    setRates(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: {
          ...prev[category][key],
          rate: Number(newRate)
        }
      }
    }));
  };

  const handleSaveRates = async () => {
    try {
      setSaving(true);
      const res = await adminApi.updateRates({
        materialRates: rates.materialRates,
        labourRates: rates.labourRates
      });
      if (res.data.success) {
        showToast('Regional Schedules of Rates (SoR) saved successfully!');
      }
    } catch (err) {
      console.error('Save rates error:', err);
    } finally {
      setSaving(false);
    }
  };

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-500 text-xs">
        Loading system administration dashboard...
      </div>
    );
  }

  const matRates = rates?.materialRates || {};
  const labRates = rates?.labourRates || {};

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8">
      
      {/* Toast */}
      {toast && (
        <div className="p-3 bg-emerald-600 text-white text-xs font-semibold rounded-xl shadow-lg flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-200 shrink-0" />
          <span>{toast}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-slate-900 rounded-3xl p-6 sm:p-8 text-white flex flex-wrap items-center justify-between gap-6 shadow-sm border border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1 text-amber-400 font-semibold text-xs">
            <ShieldCheck className="w-4 h-4" />
            <span>Administrator Control Center</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">System Administration</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xl">
            Configure regional Schedules of Rates (Warangal / Telangana), inspect platform activity, and manage project volumes.
          </p>
        </div>

        <button
          onClick={handleSaveRates}
          disabled={saving}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Updating Rates...' : 'Save Rate Updates'}</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Registered Users</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">{stats?.totalUsers || 0}</h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Projects Created</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">{stats?.totalProjects || 0}</h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <Building2 className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Planned Pipeline</p>
            <h3 className="text-2xl font-bold text-emerald-600 mt-1">₹ {Number(stats?.totalEstimatedValue || 0).toLocaleString('en-IN')}</h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Calculator className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Regional Material Rates Editor */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-6 space-y-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Regional Material Schedules of Rates (Warangal / Telangana)</h3>
          <p className="text-xs text-slate-500">Edit unit rates (INR) to automatically update all project BOQ calculations across the platform.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
          {Object.entries(matRates).map(([key, item]) => (
            <div key={key} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
              <span className="font-bold text-slate-900 block truncate">{item.name}</span>
              <div className="flex items-center gap-2">
                <span className="text-slate-500">₹</span>
                <input
                  type="number"
                  value={item.rate}
                  onChange={(e) => handleUpdateRate('materialRates', key, e.target.value)}
                  className="w-full font-mono font-bold text-blue-600 p-1.5 rounded-lg border border-slate-300 bg-white"
                />
                <span className="text-slate-500 shrink-0 font-mono">/ {item.unit}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

export default AdminDashboardPage;
