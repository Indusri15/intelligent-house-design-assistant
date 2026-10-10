import React from 'react';
import { useParams } from 'react-router-dom';
import { useProject } from '../context/ProjectContext';
import { reportApi } from '../services/api';
import {
  FileDown,
  FileSpreadsheet,
  FileText,
  CheckCircle2,
  ShieldCheck,
  Building2,
  Download
} from 'lucide-react';

export const ReportsPage = () => {
  const { id } = useParams();
  const { currentProject } = useProject();

  const handleDownloadPdf = () => {
    window.open(reportApi.getPdfUrl(id), '_blank');
  };

  const handleDownloadExcel = () => {
    window.open(reportApi.getExcelUrl(id), '_blank');
  };

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2 mb-1">
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
            DOCUMENT EXPORT ENGINE
          </span>
          <span className="text-xs text-slate-400">•</span>
          <span className="text-xs text-slate-500 font-semibold">{currentProject?.name}</span>
        </div>
        <h1 className="text-xl font-bold text-slate-900">Project Reports & Export Center</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Generate comprehensive architectural dossiers and itemized financial spreadsheets formatted for municipal submissions, contractors, and home loans.
        </p>
      </div>

      {/* 2 Main Exporter Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* PDF Exporter Card */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Architectural & Financial PDF Portfolio</h3>
                <p className="text-xs text-slate-500">Multi-page printable project dossier</p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl space-y-2 text-xs text-slate-600">
              <p className="font-bold text-slate-800">Dossier Contents:</p>
              <ul className="space-y-1.5 list-disc list-inside">
                <li>Executive Summary & Gross Plot Measurements</li>
                <li>Room-by-Room Schedule & Area Statement</li>
                <li>Vastu Shastra Compliance & Remedial Table</li>
                <li>3-Tier Package Comparison Matrix (Basic, Medium, Rich)</li>
                <li>Itemized Bill of Quantities (BOQ) with Unit Rates</li>
                <li>Construction Milestone Timeline Schedule</li>
                <li>Academic Major Project Engineering Disclaimer</li>
              </ul>
            </div>
          </div>

          <button
            onClick={handleDownloadPdf}
            className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md shadow-rose-600/20 transition-all hover:scale-[1.01]"
          >
            <Download className="w-4 h-4" />
            <span>Generate & Download PDF Report</span>
          </button>
        </div>

        {/* Excel Exporter Card */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Comprehensive Excel Financial Workbook</h3>
                <p className="text-xs text-slate-500">Multi-tab structured spreadsheet (.xlsx)</p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl space-y-2 text-xs text-slate-600">
              <p className="font-bold text-slate-800">Workbook Sheets:</p>
              <ul className="space-y-1.5 list-disc list-inside">
                <li><strong>Sheet 1 - Project Summary</strong>: Key specifications & metrics</li>
                <li><strong>Sheet 2 - Detailed BOQ</strong>: 28 items with quantities & rates</li>
                <li><strong>Sheet 3 - Package Comparison</strong>: Basic vs Medium vs Rich</li>
                <li><strong>Sheet 4 - Construction Timeline</strong>: 21 milestone stages</li>
                <li><strong>Sheet 5 - Expense Ledger</strong>: All logged purchases & invoices</li>
              </ul>
            </div>
          </div>

          <button
            onClick={handleDownloadExcel}
            className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition-all hover:scale-[1.01]"
          >
            <Download className="w-4 h-4" />
            <span>Generate & Download Excel Workbook</span>
          </button>
        </div>

      </div>

    </div>
  );
};

export default ReportsPage;
