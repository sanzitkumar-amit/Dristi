import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  FolderKanban, Activity, CheckCircle2, ChevronRight, Clock,
  ArrowUpRight, Landmark, ShieldCheck, Loader2, ListChecks, AlertTriangle,
  MapPin, Navigation, Compass, Globe
} from 'lucide-react';
import DrishtiLogo from '../components/DrishtiLogo';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { REGION_CENTROIDS } from '../utils/geoUtils';

const QUICK_REGIONS = [
  'All Regions',
  'Gujarat',
  'Maharashtra',
  'Assam',
  'Tamil Nadu',
  'Karnataka',
  'Madhya Pradesh',
  'Odisha',
  'Uttar Pradesh'
];

export default function Dashboard() {
  const { t } = useLanguage();
  const { user, isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [taskFilter, setTaskFilter] = useState('all');
  const [activeRegion, setActiveRegion] = useState('All Regions');
  const [isTaskTrackerOpen, setIsTaskTrackerOpen] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/projects');
      setProjects(res.data);
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-4">
        <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
        <p className="text-sm font-mono text-blue-600">{t('loading', 'Loading...')}</p>
      </div>
    );
  }

  // ── Regional filtering ──
  const regionalProjects = activeRegion === 'All Regions'
    ? projects
    : projects.filter(p => 
        (p.mybharat_state && p.mybharat_state.toLowerCase().includes(activeRegion.toLowerCase())) ||
        (p.location && p.location.toLowerCase().includes(activeRegion.toLowerCase()))
      );

  // ── Compute essential numbers ──
  const totalProjects = regionalProjects.length;
  const ongoingProjects = regionalProjects.filter(p => p.current_progress_pct > 0 && p.current_progress_pct < 100).length;
  const finishedProjects = regionalProjects.filter(p => p.current_progress_pct >= 100).length;

  // ── Task Tracker ──
  const pendingCount = regionalProjects.filter(p => p.current_progress_pct === 0).length;
  const inProgressCount = regionalProjects.filter(p => p.current_progress_pct > 0 && p.current_progress_pct < 100).length;
  const completedCount = regionalProjects.filter(p => p.current_progress_pct >= 100).length;
  const totalTasks = pendingCount + inProgressCount + completedCount;

  const filteredProjects = taskFilter === 'pending'
    ? regionalProjects.filter(p => p.current_progress_pct === 0)
    : taskFilter === 'in-progress'
    ? regionalProjects.filter(p => p.current_progress_pct > 0 && p.current_progress_pct < 100)
    : taskFilter === 'completed'
    ? regionalProjects.filter(p => p.current_progress_pct >= 100)
    : regionalProjects;

  // Role greeting
  const roleGreeting = () => {
    if (!isLoggedIn || !user) return { title: 'Welcome to DRISHTI', subtitle: 'Login to access full portal features' };
    if (user.role === 'government') return { title: `Welcome, ${user.name}`, subtitle: `${user.ministry} · ${user.designation || 'Government Official'}` };
    if (user.role === 'vendor') return { title: `Welcome, ${user.name}`, subtitle: `GSTIN: ${user.gstin} · GST Status: ${user.gstStatus || 'Verified'}` };
    if (user.role === 'citizen') return { title: `Welcome, ${user.name}`, subtitle: `My Bharat ID: ${user.myBharatId} · Verified Citizen` };
    return { title: 'Welcome', subtitle: 'DRISHTI Portal' };
  };

  const greeting = roleGreeting();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

      {/* ── Executive Banner ── */}
      <div className="relative overflow-hidden rounded-2xl bg-white p-6 sm:p-8 border border-slate-200 shadow-sm">
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#ff9933] via-[#ffffff] to-[#138808]"></div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="flex items-start gap-4 max-w-3xl">
            <div className="hidden sm:flex shrink-0 p-1.5 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <DrishtiLogo className="w-14 h-14" rounded="rounded-xl" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded text-[11px] font-bold font-mono bg-blue-50 text-blue-600 border border-blue-200 flex items-center gap-1.5">
                  <Landmark className="w-3.5 h-3.5 text-blue-500" />
                  {t('dashDecisionHeader', 'PAIMANA / OCMS Dashboard')}
                </span>
                {isLoggedIn && user && (
                  <span className={`px-2.5 py-0.5 rounded text-[10px] font-semibold font-mono border ${
                    user.role === 'government' ? 'bg-blue-50 text-blue-600 border-blue-200' :
                    user.role === 'vendor' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                    'bg-amber-50 text-amber-600 border-amber-200'
                  }`}>
                    {user.avatar} {user.role === 'government' ? 'Govt Official' : user.role === 'vendor' ? `GST: ${user.gstin}` : `My Bharat: ${user.myBharatId}`}
                  </span>
                )}
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight">
                {greeting.title}
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed max-w-2xl">
                {greeting.subtitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Link
              to="/projects"
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition-all active:scale-95"
            >
              <FolderKanban className="w-4 h-4" />
              <span>{t('dashExploreProjects', 'Explore Projects Hub & Detailed Telemetry')}</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* ── Location & Region Quick Switcher Strip ── */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
          <MapPin className="w-4 h-4 text-blue-600" />
          <span>Filter by Place / State:</span>
          {activeRegion !== 'All Regions' && (
            <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-mono text-[10px] border border-blue-200">
              {activeRegion} ({regionalProjects.length} Projects)
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {QUICK_REGIONS.map((reg) => (
            <button
              key={reg}
              onClick={() => setActiveRegion(reg)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all flex items-center gap-1 ${
                activeRegion === reg
                  ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              {reg === 'All Regions' ? (
                <>
                  <Globe className="w-3 h-3" />
                  <span>All India</span>
                </>
              ) : (
                <>
                  <MapPin className="w-3 h-3 text-slate-400" />
                  <span>{reg}</span>
                </>
              )}
            </button>
          ))}
          <button
            onClick={() => navigate('/projects')}
            className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100 text-xs font-bold flex items-center gap-1"
            title="Open GPS Location Explorer"
          >
            <Compass className="w-3.5 h-3.5" />
            <span>GIS Explorer ↗</span>
          </button>
        </div>
      </div>

      {/* ── 3 Essential Metric Cards (Clickable) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {/* Total Projects (Clickable) */}
        <Link
          to={`/projects${activeRegion !== 'All Regions' ? `?region=${encodeURIComponent(activeRegion)}` : ''}`}
          className="relative overflow-hidden rounded-2xl bg-white border border-slate-200 shadow-sm p-6 group hover:border-blue-400 hover:shadow-md transition-all cursor-pointer block"
        >
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-blue-400 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                <span>{t('dashTotalProjects', 'Total Projects')}</span>
                <ChevronRight className="w-3.5 h-3.5 text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
              </p>
              <p className="text-4xl font-extrabold text-slate-800 tracking-tight">{totalProjects}</p>
              <p className="text-xs text-blue-600 font-medium mt-1.5 font-mono flex items-center gap-1">
                <span>View {activeRegion !== 'All Regions' ? activeRegion : 'All'} Projects ↗</span>
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <FolderKanban className="w-6 h-6 text-blue-600 group-hover:text-white transition-colors" />
            </div>
          </div>
        </Link>

        {/* Ongoing Projects (Clickable) */}
        <Link
          to={`/projects${activeRegion !== 'All Regions' ? `?region=${encodeURIComponent(activeRegion)}` : ''}`}
          className="relative overflow-hidden rounded-2xl bg-white border border-slate-200 shadow-sm p-6 group hover:border-amber-400 hover:shadow-md transition-all cursor-pointer block"
        >
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-amber-400 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                <span>{t('dashOngoing', 'Ongoing / In-Process Projects')}</span>
                <ChevronRight className="w-3.5 h-3.5 text-amber-500 opacity-0 group-hover:opacity-100 transition-opacity" />
              </p>
              <p className="text-4xl font-extrabold text-slate-800 tracking-tight">{ongoingProjects}</p>
              <p className="text-xs text-amber-600 font-medium mt-1.5 font-mono flex items-center gap-1">
                <span>View Ongoing Projects ↗</span>
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center group-hover:bg-amber-600 group-hover:text-white transition-colors">
              <Activity className="w-6 h-6 text-amber-600 group-hover:text-white transition-colors" />
            </div>
          </div>
        </Link>

        {/* Finished Projects (Clickable) */}
        <Link
          to={`/projects${activeRegion !== 'All Regions' ? `?region=${encodeURIComponent(activeRegion)}` : ''}`}
          className="relative overflow-hidden rounded-2xl bg-white border border-slate-200 shadow-sm p-6 group hover:border-emerald-400 hover:shadow-md transition-all cursor-pointer block"
        >
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                <span>{t('dashFinished', 'Finished / Completed Projects')}</span>
                <ChevronRight className="w-3.5 h-3.5 text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />
              </p>
              <p className="text-4xl font-extrabold text-slate-800 tracking-tight">{finishedProjects}</p>
              <p className="text-xs text-emerald-600 font-medium mt-1.5 font-mono flex items-center gap-1">
                <span>View Finished Projects ↗</span>
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 group-hover:text-white transition-colors" />
            </div>
          </div>
        </Link>
      </div>

      {/* ── Task Tracker ── */}
      <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div 
            className="flex items-center gap-2.5 cursor-pointer hover:opacity-80 transition-opacity flex-1" 
            onClick={() => setIsTaskTrackerOpen(!isTaskTrackerOpen)}
          >
            <div className="w-9 h-9 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center shrink-0">
              <ListChecks className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                {t('dashTaskTracker', 'Task & Work Tracker')}
                <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform ${isTaskTrackerOpen ? 'rotate-90' : ''}`} />
              </h3>
              <p className="text-[11px] text-slate-400">
                {activeRegion !== 'All Regions' ? `Active milestone tasks in ${activeRegion}` : 'Project milestone progress across all active works'}
              </p>
            </div>
          </div>

          {/* Status Filter Chips */}
          <div className="flex items-center gap-2">
            {[
              { key: 'all', label: 'All', count: totalTasks, color: 'slate' },
              { key: 'pending', label: 'Pending', count: pendingCount, color: 'slate' },
              { key: 'in-progress', label: 'In Progress', count: inProgressCount, color: 'amber' },
              { key: 'completed', label: 'Completed', count: completedCount, color: 'emerald' },
            ].map(chip => (
              <button
                key={chip.key}
                onClick={() => setTaskFilter(chip.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold border transition-all ${
                  taskFilter === chip.key
                    ? chip.color === 'emerald' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                      chip.color === 'amber' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                      'bg-blue-50 text-blue-700 border-blue-200'
                    : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <span>{chip.label}</span>
                <span className="font-mono text-[10px] opacity-70">{chip.count}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Expandable Content */}
        {isTaskTrackerOpen && (
          <div className="animate-in slide-in-from-top-2 fade-in duration-200">
            {/* Progress Bar Overview */}
            <div className="px-6 py-4 bg-slate-50/50 border-b border-slate-100">
              <div className="flex items-center gap-4 text-[11px] text-slate-500 mb-2">
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-slate-300"></span> Pending ({pendingCount})</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span> In Progress ({inProgressCount})</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Completed ({completedCount})</span>
              </div>
              <div className="w-full h-3 rounded-full bg-slate-200 overflow-hidden flex">
                {completedCount > 0 && (
                  <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${(completedCount / (totalTasks || 1)) * 100}%` }}></div>
                )}
                {inProgressCount > 0 && (
                  <div className="h-full bg-amber-400 transition-all duration-500" style={{ width: `${(inProgressCount / (totalTasks || 1)) * 100}%` }}></div>
                )}
                {pendingCount > 0 && (
                  <div className="h-full bg-slate-300 transition-all duration-500" style={{ width: `${(pendingCount / (totalTasks || 1)) * 100}%` }}></div>
                )}
              </div>
            </div>

            {/* Task List Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 uppercase font-mono text-[11px]">
                    <th className="py-3 px-6">Project & Place</th>
                    <th className="py-3 px-4">Department</th>
                    <th className="py-3 px-4">Progress</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredProjects.map((p) => {
                    const status = p.current_progress_pct >= 100 ? 'Completed'
                      : p.current_progress_pct > 0 ? 'In Progress' : 'Pending';
                    return (
                      <tr key={p.id} className="hover:bg-slate-50 transition-colors group">
                        <td className="py-3.5 px-6 font-medium text-slate-800">
                          <Link to={`/projects/${p.id}`} className="font-semibold text-slate-800 hover:text-blue-600 transition-colors block">
                            {p.name}
                          </Link>
                          <div className="text-[10px] font-mono text-slate-400 flex items-center gap-1 mt-0.5">
                            <span className="text-blue-500 font-semibold">{p.project_code}</span>
                            <span>•</span>
                            <span className="text-slate-600 flex items-center gap-0.5">
                              <MapPin className="w-2.5 h-2.5 text-rose-500" />
                              {p.location}
                            </span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-slate-600">
                          <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-[10px]">
                            {p.department}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="w-28">
                            <div className="flex justify-between text-[10px] font-mono mb-1 text-slate-500">
                              <span>{p.current_progress_pct}%</span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${
                                  p.current_progress_pct >= 100 ? 'bg-emerald-500' :
                                  p.current_progress_pct > 50 ? 'bg-blue-500' :
                                  p.current_progress_pct > 0 ? 'bg-amber-500' : 'bg-slate-300'
                                }`}
                                style={{ width: `${Math.min(100, p.current_progress_pct)}%` }}
                              ></div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold ${
                            status === 'Completed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                            status === 'In Progress' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                            'bg-slate-100 text-slate-700 border border-slate-200'
                          }`}>
                            {status === 'Completed' && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                            {status === 'In Progress' && <Activity className="w-3 h-3 text-amber-600" />}
                            {status === 'Pending' && <Clock className="w-3 h-3 text-slate-500" />}
                            {status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <Link
                            to={`/projects/${p.id}`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-600 text-blue-600 hover:text-white border border-blue-200 text-[11px] font-semibold transition-all"
                          >
                            <span>View Details</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredProjects.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400 text-xs">
                        No projects found for {activeRegion}. Try switching back to All India.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ── Civic Transparency Portal Banner (Clickable) ── */}
      <Link
        to="/transparency"
        className="rounded-xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 bg-blue-50 hover:bg-blue-100/70 border border-blue-200 transition-all group cursor-pointer block"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center group-hover:bg-blue-600 transition-colors">
            <ShieldCheck className="w-5 h-5 text-blue-600 group-hover:text-white transition-colors" />
          </div>
          <div>
            <div className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
              <span>{t('civicBannerTitle', 'Empowering Citizen Oversight & Transparent Tenders')}</span>
              <ChevronRight className="w-4 h-4 text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <p className="text-[11px] text-slate-500">{t('civicBannerDesc', 'Explore public tenders, contractor proposal reviews, auditor milestone stamps, and community feedback.')}</p>
          </div>
        </div>
        <span className="shrink-0 px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-semibold shadow-xs">
          Open Transparency Portal ↗
        </span>
      </Link>

    </div>
  );
}
