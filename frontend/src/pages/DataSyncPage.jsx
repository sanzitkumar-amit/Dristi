import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import {
  Database, RefreshCw, CheckCircle2, AlertTriangle, ChevronRight,
  Activity, Loader2, Server, Cpu, Shield, BarChart3, Zap,
  ArrowUpRight, Clock, FileSearch, Layers, TrendingUp, Brain
} from 'lucide-react';

export default function DataSyncPage() {
  const [syncStatus, setSyncStatus] = useState(null);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [syncingPaimana, setSyncingPaimana] = useState(false);
  const [syncingOcms, setSyncingOcms] = useState(false);
  const [syncingFull, setSyncingFull] = useState(false);
  const [lastSyncResult, setLastSyncResult] = useState(null);
  const [syncLog, setSyncLog] = useState([]);

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      setLoadingStatus(true);
      const res = await axios.get('/api/data-sync/status');
      setSyncStatus(res.data);
    } catch (err) {
      console.error('Failed to fetch sync status:', err);
    } finally {
      setLoadingStatus(false);
    }
  };

  const addLog = (msg, type = 'info') => {
    setSyncLog(prev => [{ msg, type, time: new Date().toLocaleTimeString() }, ...prev].slice(0, 50));
  };

  const handleSyncPaimana = async () => {
    setSyncingPaimana(true);
    addLog('Initiating PAIMANA data sync...', 'info');
    try {
      const res = await axios.post('/api/data-sync/paimana?count=20');
      setLastSyncResult(res.data);
      addLog(`PAIMANA sync complete: ${res.data.total_processed} projects processed`, 'success');
      addLog(`${res.data.imported_count} new, ${res.data.updated_count} updated, ${res.data.high_risk_flagged} high-risk flagged`, 'success');
      if (res.data.anomalies_detected > 0) {
        addLog(`Isolation Forest detected ${res.data.anomalies_detected} statistical anomalies`, 'warning');
      }
      fetchStatus();
    } catch (err) {
      addLog(`PAIMANA sync failed: ${err.message}`, 'error');
    } finally {
      setSyncingPaimana(false);
    }
  };

  const handleSyncOcms = async () => {
    setSyncingOcms(true);
    addLog('Initiating OCMS contract data sync...', 'info');
    try {
      const res = await axios.post('/api/data-sync/ocms?count=10');
      setLastSyncResult(res.data);
      addLog(`OCMS sync complete: ${res.data.total_processed} contracts processed`, 'success');
      addLog(`${res.data.imported_count} new, ${res.data.updated_count} updated`, 'success');
      fetchStatus();
    } catch (err) {
      addLog(`OCMS sync failed: ${err.message}`, 'error');
    } finally {
      setSyncingOcms(false);
    }
  };

  const handleFullSync = async () => {
    setSyncingFull(true);
    addLog('Initiating FULL sync (PAIMANA + OCMS)...', 'info');
    try {
      const res = await axios.post('/api/data-sync/full');
      setLastSyncResult(res.data);
      addLog(`Full sync complete: ${res.data.total_processed} projects from both sources`, 'success');
      addLog(`PAIMANA: ${res.data.paimana_count}, OCMS: ${res.data.ocms_count}`, 'success');
      addLog(`High risk: ${res.data.high_risk_flagged}, Anomalies: ${res.data.anomalies_detected}`, res.data.high_risk_flagged > 0 ? 'warning' : 'success');
      fetchStatus();
    } catch (err) {
      addLog(`Full sync failed: ${err.message}`, 'error');
    } finally {
      setSyncingFull(false);
    }
  };

  const isSyncing = syncingPaimana || syncingOcms || syncingFull;

  if (loadingStatus) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-4">
        <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
        <p className="text-sm font-mono text-blue-600">Loading Data Sync Status...</p>
      </div>
    );
  }

  const connectors = syncStatus?.connectors || {};
  const mlEngine = syncStatus?.ml_engine || {};
  const history = syncStatus?.sync_history || {};

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

      {/* ── Page Header ── */}
      <div className="relative overflow-hidden rounded-2xl bg-white p-6 sm:p-8 border border-slate-200 shadow-sm">
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-violet-500 via-blue-500 to-cyan-500"></div>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-blue-600 flex items-center justify-center shadow-lg shrink-0">
              <Database className="w-7 h-7 text-white" />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight">
                  PAIMANA / OCMS Data Sync
                </h1>
                <span className="px-2.5 py-0.5 rounded text-[10px] font-bold font-mono bg-violet-50 text-violet-600 border border-violet-200">
                  LIVE CONNECTOR
                </span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed max-w-2xl">
                Connect directly to Government of India's PAIMANA (Project Appraisal, Infrastructure Management and Network Analysis)
                and OCMS (Online Contract Management System) databases. Sync project data and run DRISHTI's ensemble ML risk engine in real-time.
              </p>
            </div>
          </div>

          <button
            onClick={handleFullSync}
            disabled={isSyncing}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-bold shadow-sm transition-all active:scale-95 shrink-0 ${
              isSyncing
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-700 hover:to-blue-700 text-white'
            }`}
          >
            {syncingFull ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
            <span>{syncingFull ? 'Syncing All Sources...' : 'Sync All Sources'}</span>
          </button>
        </div>
      </div>

      {/* ── Connector Cards ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* PAIMANA Connector */}
        <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center">
                  <Server className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">PAIMANA System</h3>
                  <p className="text-[10px] text-slate-400 font-mono">paimana.gov.in/api/v2</p>
                </div>
              </div>
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                {connectors.paimana?.status || 'Connected'}
              </span>
            </div>
          </div>
          <div className="px-6 py-4 space-y-3">
            <div className="grid grid-cols-2 gap-3 text-[11px]">
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                <p className="text-slate-400 font-mono mb-0.5">Protocol</p>
                <p className="font-semibold text-slate-700">{connectors.paimana?.protocol || 'REST API v2'}</p>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                <p className="text-slate-400 font-mono mb-0.5">Auth</p>
                <p className="font-semibold text-slate-700">OAuth 2.0 Bearer</p>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                <p className="text-slate-400 font-mono mb-0.5">Latency</p>
                <p className="font-semibold text-slate-700">{connectors.paimana?.latency_ms || '—'}ms</p>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                <p className="text-slate-400 font-mono mb-0.5">Last Sync</p>
                <p className="font-semibold text-slate-700">{history.paimana?.last_sync || 'Never'}</p>
              </div>
            </div>
            {history.paimana?.last_sync && (
              <div className="flex items-center gap-3 text-[11px] text-slate-500 bg-blue-50/50 rounded-lg p-2.5 border border-blue-100">
                <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                <span>Last: <strong>{history.paimana.records}</strong> records (<strong>{history.paimana.new}</strong> new, <strong>{history.paimana.updated}</strong> updated, <strong className="text-red-600">{history.paimana.high_risk}</strong> high-risk)</span>
              </div>
            )}
            <button
              onClick={handleSyncPaimana}
              disabled={isSyncing}
              className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                isSyncing
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm active:scale-[0.98]'
              }`}
            >
              {syncingPaimana ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              <span>{syncingPaimana ? 'Fetching PAIMANA Data...' : 'Sync PAIMANA Projects'}</span>
            </button>
          </div>
        </div>

        {/* OCMS Connector */}
        <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center">
                  <Layers className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">OCMS System</h3>
                  <p className="text-[10px] text-slate-400 font-mono">ocms.gov.in/api/contracts</p>
                </div>
              </div>
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                {connectors.ocms?.status || 'Connected'}
              </span>
            </div>
          </div>
          <div className="px-6 py-4 space-y-3">
            <div className="grid grid-cols-2 gap-3 text-[11px]">
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                <p className="text-slate-400 font-mono mb-0.5">Protocol</p>
                <p className="font-semibold text-slate-700">{connectors.ocms?.protocol || 'REST API v1'}</p>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                <p className="text-slate-400 font-mono mb-0.5">Auth</p>
                <p className="font-semibold text-slate-700">API Key + IP Whitelist</p>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                <p className="text-slate-400 font-mono mb-0.5">Latency</p>
                <p className="font-semibold text-slate-700">{connectors.ocms?.latency_ms || '—'}ms</p>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                <p className="text-slate-400 font-mono mb-0.5">Last Sync</p>
                <p className="font-semibold text-slate-700">{history.ocms?.last_sync || 'Never'}</p>
              </div>
            </div>
            {history.ocms?.last_sync && (
              <div className="flex items-center gap-3 text-[11px] text-slate-500 bg-indigo-50/50 rounded-lg p-2.5 border border-indigo-100">
                <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
                <span>Last: <strong>{history.ocms.records}</strong> records (<strong>{history.ocms.new}</strong> new, <strong>{history.ocms.updated}</strong> updated, <strong className="text-red-600">{history.ocms.high_risk}</strong> high-risk)</span>
              </div>
            )}
            <button
              onClick={handleSyncOcms}
              disabled={isSyncing}
              className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                isSyncing
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm active:scale-[0.98]'
              }`}
            >
              {syncingOcms ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              <span>{syncingOcms ? 'Fetching OCMS Contracts...' : 'Sync OCMS Contracts'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── ML Engine Status Panel ── */}
      <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">DRISHTI Ensemble ML Engine</h3>
              <p className="text-[10px] text-slate-400">5 models · {mlEngine.feature_count || 16} features · {mlEngine.training_samples || 500} training samples</p>
            </div>
          </div>
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            {mlEngine.status || 'Operational'}
          </span>
        </div>
        <div className="px-6 py-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {(mlEngine.model_names || [
              'Random Forest (Cost Risk)',
              'Gradient Boosting (Cost Risk)',
              'Linear Regression (Delay)',
              'Ridge Regression (Delay)',
              'Isolation Forest (Anomaly)'
            ]).map((name, idx) => {
              const icons = [Shield, Cpu, TrendingUp, BarChart3, FileSearch];
              const colors = ['blue', 'violet', 'amber', 'emerald', 'rose'];
              const Icon = icons[idx] || Cpu;
              const color = colors[idx] || 'slate';
              const detail = mlEngine.models_detail || {};
              const modelKeys = ['random_forest', 'gradient_boosting', 'linear_regression', 'ridge_regression', 'isolation_forest'];
              const meta = detail[modelKeys[idx]] || {};
              const metricLabel = meta.cv_accuracy_mean ? 'Accuracy' : meta.cv_r2_mean ? 'R²' : meta.contamination ? 'Contamination' : '';
              const metricVal = meta.cv_accuracy_mean ? `${(meta.cv_accuracy_mean * 100).toFixed(1)}%` : meta.cv_r2_mean ? meta.cv_r2_mean.toFixed(3) : meta.contamination ? `${meta.contamination * 100}%` : '';

              return (
                <div key={idx} className={`p-3 rounded-xl bg-${color}-50/50 border border-${color}-100 space-y-2`}>
                  <div className="flex items-center gap-2">
                    <Icon className={`w-4 h-4 text-${color}-600`} />
                    <span className="text-[11px] font-bold text-slate-700 leading-tight">{name}</span>
                  </div>
                  {metricLabel && (
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-slate-400 font-mono">{metricLabel}</span>
                      <span className="font-bold text-slate-700 font-mono">{metricVal}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Sync Log + Results ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Live Sync Log */}
        <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-800">Sync Activity Log</h3>
            <span className="ml-auto text-[10px] font-mono text-slate-400">{syncLog.length} entries</span>
          </div>
          <div className="max-h-[400px] overflow-y-auto">
            {syncLog.length === 0 ? (
              <div className="px-6 py-12 text-center text-xs text-slate-400">
                <Clock className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                No sync activity yet. Click a sync button to begin.
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {syncLog.map((entry, idx) => (
                  <div key={idx} className="px-6 py-2.5 flex items-start gap-3 text-[11px]">
                    <span className="font-mono text-slate-400 shrink-0 mt-0.5">{entry.time}</span>
                    <span className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${
                      entry.type === 'success' ? 'bg-emerald-500' :
                      entry.type === 'error' ? 'bg-red-500' :
                      entry.type === 'warning' ? 'bg-amber-500' : 'bg-blue-500'
                    }`}></span>
                    <span className={`leading-relaxed ${
                      entry.type === 'error' ? 'text-red-600' :
                      entry.type === 'warning' ? 'text-amber-600' :
                      entry.type === 'success' ? 'text-emerald-700' : 'text-slate-600'
                    }`}>{entry.msg}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sync Summary Cards */}
        <div className="space-y-4">
          {lastSyncResult ? (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-white border border-slate-200 shadow-sm p-4">
                  <p className="text-[10px] font-mono text-slate-400 uppercase mb-1">Total Processed</p>
                  <p className="text-3xl font-extrabold text-slate-800">{lastSyncResult.total_processed}</p>
                </div>
                <div className="rounded-xl bg-white border border-slate-200 shadow-sm p-4">
                  <p className="text-[10px] font-mono text-slate-400 uppercase mb-1">High Risk Flagged</p>
                  <p className="text-3xl font-extrabold text-red-600">{lastSyncResult.high_risk_flagged}</p>
                </div>
                <div className="rounded-xl bg-white border border-slate-200 shadow-sm p-4">
                  <p className="text-[10px] font-mono text-slate-400 uppercase mb-1">Avg Risk Score</p>
                  <p className="text-3xl font-extrabold text-amber-600">{lastSyncResult.summary?.average_risk_score}</p>
                </div>
                <div className="rounded-xl bg-white border border-slate-200 shadow-sm p-4">
                  <p className="text-[10px] font-mono text-slate-400 uppercase mb-1">Anomalies</p>
                  <p className="text-3xl font-extrabold text-violet-600">{lastSyncResult.anomalies_detected || 0}</p>
                </div>
              </div>

              {/* Recent Synced Projects Table */}
              <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2">
                  <Database className="w-4 h-4 text-violet-600" />
                  <h4 className="text-xs font-bold text-slate-800">Synced Projects (ML Analyzed)</h4>
                </div>
                <div className="overflow-x-auto max-h-[300px]">
                  <table className="w-full text-left text-[11px] border-collapse">
                    <thead className="sticky top-0 bg-white">
                      <tr className="border-b border-slate-200 text-slate-400 uppercase font-mono text-[10px]">
                        <th className="py-2.5 px-4">Project</th>
                        <th className="py-2.5 px-3">Risk</th>
                        <th className="py-2.5 px-3">Delay</th>
                        <th className="py-2.5 px-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {(lastSyncResult.project_results || []).slice(0, 15).map((p, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 transition-colors">
                          <td className="py-2.5 px-4">
                            <div className="font-semibold text-slate-800 truncate max-w-[200px]">{p.name}</div>
                            <div className="text-[9px] font-mono text-slate-400 flex items-center gap-1">
                              <span className="text-blue-500">{p.project_code}</span>
                              <span>·</span>
                              <span>{p.location}</span>
                              {p.is_anomaly && (
                                <span className="ml-1 px-1.5 py-0.5 rounded bg-rose-50 text-rose-600 border border-rose-200 text-[8px] font-bold">ANOMALY</span>
                              )}
                            </div>
                          </td>
                          <td className="py-2.5 px-3">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              p.overall_risk_level === 'High' ? 'bg-red-50 text-red-700 border border-red-200' :
                              p.overall_risk_level === 'Medium' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                              'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            }`}>
                              {p.overall_risk_score}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 font-mono text-slate-600">
                            {p.predicted_delay_months}mo
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <Link
                              to={`/projects/${p.id}`}
                              className="inline-flex items-center gap-0.5 text-blue-600 hover:text-blue-800 font-semibold text-[10px]"
                            >
                              View <ArrowUpRight className="w-3 h-3" />
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-12 text-center">
              <Database className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <h4 className="text-sm font-bold text-slate-700 mb-1">No Sync Results Yet</h4>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                Click "Sync PAIMANA Projects" or "Sync OCMS Contracts" to fetch live data from government systems and run ML analysis.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── Feature Importance Panel ── */}
      {mlEngine.feature_importance?.random_forest && (
        <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-violet-600" />
            <h3 className="text-sm font-bold text-slate-800">ML Feature Importance (Random Forest)</h3>
          </div>
          <div className="px-6 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {Object.entries(mlEngine.feature_importance.random_forest).slice(0, 8).map(([feature, importance], idx) => (
                <div key={feature} className="flex items-center gap-3 p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-mono text-slate-500 truncate">{feature.replace(/_/g, ' ')}</p>
                    <div className="mt-1 w-full bg-slate-200 rounded-full h-1.5">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-violet-500 to-blue-500 transition-all"
                        style={{ width: `${Math.min(100, importance * 500)}%` }}
                      ></div>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold font-mono text-slate-700 shrink-0">
                    {(importance * 100).toFixed(1)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
