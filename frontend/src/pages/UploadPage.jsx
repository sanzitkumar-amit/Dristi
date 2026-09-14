import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { 
  Upload, FileSpreadsheet, Download, CheckCircle2, 
  AlertTriangle, Cpu, FileText, ArrowRight, X, BarChart3,
  TrendingUp, Clock, IndianRupee, ShieldCheck, Activity, ChevronRight
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const RISK_COLORS = {
  'High': 'bg-red-50 text-red-600 border-red-200',
  'Medium': 'bg-amber-50 text-amber-600 border-amber-200',
  'Low': 'bg-emerald-50 text-emerald-600 border-emerald-200',
};

export default function UploadPage() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [file, setFile] = useState(null);

  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const SUPPORTED_EXTS = ['.csv', '.xlsx', '.xls', '.tsv', '.txt', '.doc', '.docx', '.pdf', '.json'];

  const isSupported = (filename) => {
    return SUPPORTED_EXTS.some(ext => filename.toLowerCase().endsWith(ext));
  };

  const getFileTypeLabel = (filename) => {
    if (!filename) return '';
    const lower = filename.toLowerCase();
    if (lower.endsWith('.docx') || lower.endsWith('.doc')) return 'Word Document';
    if (lower.endsWith('.pdf')) return 'PDF Report / Document';
    if (lower.endsWith('.xlsx') || lower.endsWith('.xls')) return 'Excel Spreadsheet';
    if (lower.endsWith('.json')) return 'JSON Dataset';
    if (lower.endsWith('.csv')) return 'CSV Data File';
    if (lower.endsWith('.tsv')) return 'Tab-Separated File';
    if (lower.endsWith('.txt')) return 'Plain Text / Memo';
    return 'Data File';
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const selectedFile = e.dataTransfer.files[0];
      if (isSupported(selectedFile.name)) {
        setFile(selectedFile);
        setError('');
        setResult(null);
      } else {
        setError(`Unsupported file type. Supported formats: ${SUPPORTED_EXTS.join(', ')}`);
      }
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (isSupported(selectedFile.name)) {
        setFile(selectedFile);
        setError('');
        setResult(null);
      } else {
        setError(`Unsupported file type. Supported formats: ${SUPPORTED_EXTS.join(', ')}`);
      }
    }
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!file) return;

    try {
      setUploading(true);
      setError('');
      
      const formData = new FormData();
      formData.append('file', file);

      const res = await axios.post('/api/projects/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setResult(res.data);
    } catch (err) {
      console.error("Upload error:", err);
      setError(err.response?.data?.detail || "Failed to parse and evaluate data file. Ensure it contains valid project metrics or tables.");
    } finally {
      setUploading(false);
    }
  };

  const downloadSampleTemplate = () => {
    window.location.href = '/api/projects/sample-csv/download';
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 flex items-center gap-2">
            <Upload className="w-6 h-6 text-blue-500" />
            <span>{t('uploadTitle', 'DRISHTI Multi-Document Ingestion & AI Risk Engine')}</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {t('uploadSubtitle', 'Upload project files (Word Document, PDF Report, Excel, JSON, CSV, TSV, TXT) to automatically run DRISHTI ML risk scoring, NLP sentiment/flag analysis, and timeline/cost overrun forecasting.')}
          </p>
        </div>

        <button
          onClick={downloadSampleTemplate}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold transition-all self-start sm:self-auto shadow-sm"
        >
          <Download className="w-4 h-4 text-blue-500" />
          <span>{t('btnDownloadSample', 'Download Sample CSV Template')}</span>
        </button>
      </div>

      {/* Main Upload Box */}
      <div className="p-8 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-6">
        
        <form onSubmit={handleUploadSubmit} className="space-y-6">
          
          {/* Drag & Drop Area */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-2xl p-10 text-center transition-all cursor-pointer relative ${
              dragActive
                ? 'border-blue-400 bg-blue-50'
                : file
                ? 'border-emerald-400 bg-emerald-50'
                : 'border-slate-300 hover:border-slate-400 bg-slate-50'
            }`}
          >
            <input
              type="file"
              accept=".csv,.xlsx,.xls,.tsv,.txt,.doc,.docx,.pdf,.json"
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />

            <div className="flex flex-col items-center justify-center space-y-3">
              <div className="h-16 w-16 rounded-2xl bg-white border border-slate-200 flex items-center justify-center shadow-sm">
                {file ? (
                  <FileSpreadsheet className="w-8 h-8 text-emerald-500" />
                ) : (
                  <Upload className="w-8 h-8 text-blue-400" />
                )}
              </div>

              {file ? (
                <div>
                  <p className="text-sm font-bold text-emerald-700 font-mono">{file.name}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{(file.size / 1024).toFixed(1)} KB • {getFileTypeLabel(file.name)} • Ready for ML Analysis</p>
                </div>
              ) : (
                <div>
                  <p className="text-sm font-bold text-slate-700">
                    {t('dragDropText', 'Drag and drop your project document or data file here, or')} <span className="text-blue-600 underline">{t('browseText', 'browse')}</span>
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-1.5 mt-2">
                    <span className="px-2 py-0.5 rounded bg-blue-50 border border-blue-200 text-[11px] font-mono text-blue-600">Word (.docx / .doc)</span>
                    <span className="px-2 py-0.5 rounded bg-red-50 border border-red-200 text-[11px] font-mono text-red-600">PDF (.pdf)</span>
                    <span className="px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-[11px] font-mono text-emerald-600">Excel (.xlsx / .xls)</span>
                    <span className="px-2 py-0.5 rounded bg-amber-50 border border-amber-200 text-[11px] font-mono text-amber-600">JSON (.json)</span>
                    <span className="px-2 py-0.5 rounded bg-indigo-50 border border-indigo-200 text-[11px] font-mono text-indigo-600">CSV / TSV / TXT</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-2">
                    {t('supportedFormatsNotice', 'Supports tables, formatted key-values, and project status reports with automated column & entity recognition')}
                  </p>
                </div>
              )}
            </div>
          </div>

          {error && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-3">
            {file && (
              <button
                type="button"
                onClick={() => { setFile(null); setResult(null); setError(''); }}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold border border-slate-200"
              >
                {t('btnClearSelection', 'Clear Selection')}
              </button>
            )}

            <button
              type="submit"
              disabled={!file || uploading}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-xs shadow-sm transition-all ${
                !file || uploading
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                  : 'bg-blue-600 hover:bg-blue-700 text-white font-extrabold'
              }`}
            >
              {uploading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>{t('btnRunningAnalysis', 'Running ML Risk Analysis Pipeline...')}</span>
                </>
              ) : (
                <>
                  <Cpu className="w-4 h-4" />
                  <span>{t('btnRunAnalysis', 'Ingest & Analyze with DRISHTI ML')}</span>
                </>
              )}
            </button>
          </div>

        </form>

        {/* ── Rich Analysis Results ── */}
        {result && (
          <div className="space-y-6 pt-4 border-t border-slate-200">

            {/* Success Header */}
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-7 h-7 text-emerald-500" />
              <div>
                <h3 className="text-base font-bold text-emerald-700">{t('uploadSuccessHeader', 'Analysis Complete —')} {result.message}</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  File: <span className="text-slate-700 font-mono">{result.file_name}</span> • 
                  Format: <span className="text-blue-600 font-mono">{(result.file_type || '').toUpperCase()}</span> • 
                  Detected Columns: <span className="text-slate-600">{(result.detected_columns || []).join(', ')}</span>
                </p>
              </div>
            </div>

            {/* KPI Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
              {[
                { label: t('kpiImported', 'Imported'), value: result.imported_count, color: 'text-emerald-600' },
                { label: t('kpiUpdated', 'Updated'), value: result.updated_count, color: 'text-amber-600' },
                { label: t('kpiSkipped', 'Skipped'), value: result.skipped_count || 0, color: 'text-slate-400' },
                { label: t('kpiTotalBudget', 'Total Budget'), value: `₹${result.summary?.total_budget_cr || 0} Cr`, color: 'text-cyan-600' },
                { label: t('kpiAvgRisk', 'Avg ML Risk'), value: `${result.summary?.average_risk_score || 0}%`, color: 'text-red-500' },
                { label: t('kpiHighRisk', 'High Risk Flags'), value: result.summary?.high_risk_count || 0, color: 'text-red-500' },
                { label: t('kpiTotalDelay', 'Total Delay'), value: `${result.summary?.total_predicted_delay_months || 0} Mos`, color: 'text-amber-600' },
              ].map((kpi, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
                  <div className={`text-base font-extrabold font-mono ${kpi.color}`}>{kpi.value}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">{kpi.label}</div>
                </div>
              ))}
            </div>

            {/* Per-Project Analysis Results Table */}
            {result.project_results && result.project_results.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-blue-500" />
                    <span>Per-Project ML Intelligence & Risk Telemetry ({result.project_results.length} Projects Analyzed)</span>
                  </h4>
                  <span className="text-[11px] text-slate-400 font-mono">
                    Random Forest + Linear Regression Pipeline
                  </span>
                </div>
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200">
                        <th className="px-3.5 py-3 text-left text-slate-400 font-medium">Project Code & Name</th>
                        <th className="px-3.5 py-3 text-right text-slate-400 font-medium">Budget / Spent</th>
                        <th className="px-3.5 py-3 text-center text-slate-400 font-medium">Physical Progress</th>
                        <th className="px-3.5 py-3 text-center text-slate-400 font-medium">ML Risk Score</th>
                        <th className="px-3.5 py-3 text-center text-slate-400 font-medium">Delay Forecast</th>
                        <th className="px-3.5 py-3 text-left text-slate-400 font-medium">Top Risk Driver</th>
                        <th className="px-3.5 py-3 text-left text-slate-400 font-medium">NLP Flags</th>
                        <th className="px-3.5 py-3 text-right text-slate-400 font-medium">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {result.project_results.map((p, i) => (
                        <tr key={i} className="hover:bg-slate-50/80 transition-colors group">
                          <td className="px-3.5 py-3">
                            <Link 
                              to={p.id ? `/projects/${p.id}` : `/projects`}
                              className="font-bold text-slate-800 group-hover:text-blue-600 transition-colors block"
                            >
                              {p.name}
                            </Link>
                            <div className="text-[10px] text-slate-400 font-mono mt-0.5 flex items-center gap-1.5">
                              <span className="text-blue-500 font-semibold">{p.project_code}</span>
                              <span>•</span>
                              <span>{p.department}</span>
                              <span>•</span>
                              <span>{p.location}</span>
                            </div>
                          </td>
                          <td className="px-3.5 py-3 text-right">
                            <div className="font-mono font-bold text-slate-800">₹{p.budget_cr} Cr</div>
                            <div className="text-[10px] font-mono text-slate-400">Spent: ₹{p.spent_cr} Cr ({p.budget_utilization_pct}%)</div>
                          </td>
                          <td className="px-3.5 py-3 text-center">
                            <div className="flex flex-col items-center gap-1">
                              <div className="w-20 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full rounded-full ${
                                    p.current_progress_pct >= 100 ? 'bg-emerald-500' :
                                    p.current_progress_pct > 50 ? 'bg-blue-500' : 'bg-amber-500'
                                  }`} 
                                  style={{ width: `${p.current_progress_pct}%` }}
                                ></div>
                              </div>
                              <span className="font-mono text-slate-700 text-[11px] font-semibold">{p.current_progress_pct}%</span>
                            </div>
                          </td>
                          <td className="px-3.5 py-3 text-center">
                            <div className="font-mono font-black text-slate-800 text-sm">{p.overall_risk_score}%</div>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border mt-0.5 ${RISK_COLORS[p.overall_risk_level] || RISK_COLORS['Low']}`}>
                              {p.overall_risk_level}
                            </span>
                          </td>
                          <td className="px-3.5 py-3 text-center font-mono font-bold text-amber-600">
                            +{p.predicted_delay_months} mo
                            <span className="block text-[10px] text-slate-400 font-normal">Overrun: {p.predicted_cost_overrun_pct}%</span>
                          </td>
                          <td className="px-3.5 py-3">
                            {p.top_risk_factors && p.top_risk_factors.length > 0 ? (
                              <div className="text-[11px] text-slate-600 max-w-xs">
                                <span className="font-bold text-slate-700">{p.top_risk_factors[0].factor}: </span>
                                <span className="text-slate-500">{p.top_risk_factors[0].description}</span>
                              </div>
                            ) : (
                              <span className="text-slate-400 text-[10px]">Within normal thresholds</span>
                            )}
                          </td>
                          <td className="px-3.5 py-3">
                            <div className="flex flex-wrap gap-1 max-w-[150px]">
                              {(p.nlp_risk_flags || []).slice(0, 2).map((flag, fi) => (
                                <span key={fi} className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-red-50 text-red-600 border border-red-200">{flag}</span>
                              ))}
                              {(p.nlp_risk_flags || []).length === 0 && <span className="text-[10px] text-emerald-600 font-semibold">Clean ✓</span>}
                            </div>
                          </td>
                          <td className="px-3.5 py-3 text-right">
                            <Link
                              to={p.id ? `/projects/${p.id}` : `/projects`}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-600 text-blue-600 hover:text-white border border-blue-200 text-[11px] font-semibold transition-all"
                            >
                              <span>Inspect</span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center gap-3 flex-wrap pt-2">
              <button
                onClick={() => navigate('/projects')}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all"
              >
                <span>View All Projects</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => navigate('/')}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold border border-blue-200 transition-all"
              >
                <BarChart3 className="w-4 h-4" />
                <span>Risk Dashboard</span>
              </button>
              <Link
                to="/transparency"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold border border-emerald-200 transition-all"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Civic Transparency Portal</span>
              </Link>
            </div>
          </div>
        )}

      </div>

    </div>
  );
}
