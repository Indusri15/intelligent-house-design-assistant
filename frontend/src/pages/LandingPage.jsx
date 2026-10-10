import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Building2, 
  Layers, 
  Compass, 
  Calculator, 
  CheckCircle2, 
  ArrowRight, 
  ShieldCheck, 
  Sparkles,
  CalendarCheck,
  Receipt,
  FileDown
} from 'lucide-react';

export const LandingPage = () => {
  return (
    <div className="min-h-screen bg-slate-900 text-white selection:bg-blue-600">
      
      {/* Hero Section */}
      <section className="relative pt-20 pb-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center overflow-hidden">
        
        {/* Glow backdrop */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-blue-600/20 rounded-full blur-3xl pointer-events-none"></div>

        {/* Academic Project Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-800/80 border border-slate-700/80 text-blue-400 text-xs font-semibold mb-6 shadow-sm">
          <Sparkles className="w-3.5 h-3.5" />
          <span>B.Tech Information Technology Major Project — AI/ML Domain</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-tight sm:leading-none">
          Intelligent House Design & <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-sky-300">Construction Assistant</span>
        </h1>

        <p className="mt-6 text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
          Autonomous geometric floor-plan generation, transparent 28-category BOQ cost estimation, parametric Vastu Shastra analysis, and milestone dependency tracking.
        </p>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Link
            to="/register"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold shadow-lg shadow-blue-600/30 transition-all hover:scale-105"
          >
            <span>Start House Planning Wizard</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            to="/login"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700 text-sm font-semibold transition-colors"
          >
            <span>Sign In to Existing Project</span>
          </Link>
        </div>

      </section>

      {/* 6 Core Feature Pillars Grid */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-slate-800">
        <div className="text-center mb-12">
          <h2 className="text-2xl font-bold text-white">Full-Stack Architectural & Construction Suite</h2>
          <p className="text-xs text-slate-400 mt-1">Engineered with rigorous mathematical geometry, Indian Standard codes, and modern AI pipelines.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          <div className="p-6 rounded-2xl bg-slate-800/50 border border-slate-700/60 hover:border-blue-500/50 transition-all">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center mb-4">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white mb-2">Geometric Floor-Plan Engine</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Solves non-overlapping room polygons, front/rear setback restrictions, circulation foyers, and multi-floor aligned staircase vertical continuity.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-800/50 border border-slate-700/60 hover:border-blue-500/50 transition-all">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center mb-4">
              <Compass className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white mb-2">Vastu Shastra Expert System</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Directional compass evaluation across 8 zones (Ishanya, Agneya, Niruthi, Vayu) with room compliance scoring and architectural remedies.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-800/50 border border-slate-700/60 hover:border-blue-500/50 transition-all">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-4">
              <Calculator className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white mb-2">Itemized BOQ & Regional Rates</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              28 construction categories with material quantities, steel (3.85 kg/sqft), cement (0.42 bags/sqft), wastage allowances, and Telangana regional rates.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-800/50 border border-slate-700/60 hover:border-blue-500/50 transition-all">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center mb-4">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white mb-2">3-Tier Package Comparison</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Compare Basic (₹1,650/sq.ft), Medium (₹2,150/sq.ft), and Rich / Luxury (₹2,850/sq.ft) specifications with item-level cost differentials.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-800/50 border border-slate-700/60 hover:border-blue-500/50 transition-all">
            <div className="w-10 h-10 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center mb-4">
              <CalendarCheck className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white mb-2">21-Stage Milestone DAG</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Topological dependency graph tracking planning, excavation, RCC frame, brickwork, plastering, tiles, electrical fixtures, and handover.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-800/50 border border-slate-700/60 hover:border-blue-500/50 transition-all">
            <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center mb-4">
              <FileDown className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white mb-2">Automated PDF & Excel Exporters</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Generate downloadable PDF architectural portfolio dossiers and multi-tab Excel financial workbooks ready for contractors and banks.
            </p>
          </div>

        </div>
      </section>

      {/* Dataset & Machine Learning Reference */}
      <section className="py-12 bg-slate-950/60 border-t border-slate-800 text-center px-4">
        <p className="text-xs text-slate-400">
          Dataset Integration: <strong>CubiCasa5K</strong> (Kalervo et al., ICIPR 2019, DOI: 10.5281/zenodo.5142274) | Semantic Floorplan Segmentation Pipeline
        </p>
        <p className="text-[11px] text-slate-500 mt-1">
          Developed as a B.Tech Information Technology Major Capstone Project.
        </p>
      </section>

    </div>
  );
};

export default LandingPage;
