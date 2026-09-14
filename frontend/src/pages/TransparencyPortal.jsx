import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import {
  Landmark, Users, Building2, FileText, Star, AlertTriangle, ShieldCheck,
  IndianRupee, Clock, ChevronRight, Search, Filter, X, Plus, Send,
  ArrowUpRight, CheckCircle2, Eye, Gavel, MessageSquareWarning,
  TrendingUp, Award, MapPin, Calendar, Briefcase, ThumbsUp,
  CircleDollarSign, Timer, BarChart3, Activity, Compass, Navigation
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import DrishtiLogo from '../components/DrishtiLogo';

const API = '/api/transparency';

const STATUS_COLORS = {
  'Open for Bids': 'bg-cyan-500/15 text-cyan-300 border-cyan-500/40',
  'Evaluation': 'bg-violet-500/15 text-violet-300 border-violet-500/40',
  'Contract Awarded': 'bg-blue-500/15 text-blue-300 border-blue-500/40',
  'In Execution': 'bg-amber-500/15 text-amber-300 border-amber-500/40',
  'Completed': 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40',
  'Under Audit': 'bg-fuchsia-500/15 text-fuchsia-300 border-fuchsia-500/40',
  'Draft': 'bg-slate-500/15 text-slate-300 border-slate-500/40',
};

const RISK_COLORS = {
  'High': 'bg-rose-500/15 text-rose-300 border-rose-500/40',
  'Medium': 'bg-amber-500/15 text-amber-300 border-amber-500/40',
  'Low': 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40',
};

const FILTER_STATUSES = ['All', 'Open for Bids', 'Evaluation', 'In Execution', 'Contract Awarded', 'Completed'];

export default function TransparencyPortal() {
  const { t } = useLanguage();
  const { user, isLoggedIn, switchRole } = useAuth();
  const [overview, setOverview] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [perspective, setPerspective] = useState(() => user?.role || 'citizen');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [showTenderModal, setShowTenderModal] = useState(false);
  const [showBidModal, setShowBidModal] = useState(null);
  const [showFeedbackModal, setShowFeedbackModal] = useState(null);
  const [showConcernModal, setShowConcernModal] = useState(null);

  useEffect(() => {
    if (user?.role) {
      setPerspective(user.role);
    }
  }, [user?.role]);

  const PERSPECTIVES = [
    { key: 'citizen', label: t('roleCitizen', 'Citizen Oversight'), icon: Users, color: 'from-emerald-500 to-teal-600' },
    { key: 'government', label: t('roleGov', 'Government Officer'), icon: Landmark, color: 'from-indigo-500 to-blue-600' },
    { key: 'vendor', label: t('roleVendor', 'Vendor Hub'), icon: Building2, color: 'from-amber-500 to-orange-600' },
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [overviewRes, projectsRes] = await Promise.all([
        axios.get(`${API}/overview`),
        axios.get(`${API}/projects`)
      ]);
      setOverview(overviewRes.data);
      setProjects(projectsRes.data);
    } catch (err) {
      console.error('Error fetching transparency data:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredProjects = projects.filter(p => {
    const matchesSearch = !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.project_code.toLowerCase().includes(search.toLowerCase()) ||
      p.location.toLowerCase().includes(search.toLowerCase()) ||
      (p.purpose || '').toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'All' || p.tender_status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-4">
        <div className="w-14 h-14 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-mono text-emerald-300">{t('loading', 'Loading DRISHTI Civic Transparency Portal...')}</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

      {/* ── Hero Section ── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-emerald-950/30 to-slate-900 border border-emerald-800/30 p-8 sm:p-10">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-emerald-500/10 via-transparent to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-white p-1 flex items-center justify-center shadow-lg shadow-emerald-500/20 border border-slate-700/40 shrink-0">
                <DrishtiLogo className="w-full h-full" rounded="rounded-lg" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-white via-emerald-100 to-emerald-300 bg-clip-text text-transparent">
                  {t('brandName', 'DRISHTI')} Civic
                </h1>
                <p className="text-xs font-mono text-emerald-400/80 tracking-wide">
                  {t('transparencyTitle', 'Transparency & Public Procurement Portal')}
                </p>
              </div>
            </div>
            <p className="text-sm text-slate-300 max-w-xl leading-relaxed">
              {t('transparencySubtitle', 'Empowering citizens to monitor public funds, track government project milestones, rate vendor performance, and raise accountability concerns — building trust through complete transparency.')}
            </p>
          </div>
          <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl glass-panel border border-emerald-700/30">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-xs font-mono text-emerald-400 font-semibold">{t('trustIndex', 'Community Trust Index')}</span>
            </div>
            <span className="text-2xl font-bold text-emerald-300 font-mono">{overview?.community_trust_index || 0}%</span>
          </div>
        </div>
      </div>

      {/* ── KPI Cards ── */}
      {overview && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: t('publicFundsAccounted', 'Public Funds'), value: `₹${(overview.total_public_funds_cr / 1000).toFixed(1)}K Cr`, icon: CircleDollarSign, color: 'text-emerald-400', bg: 'from-emerald-950/50 to-emerald-900/30' },
            { label: t('tabOpenBidding', 'Open Tenders'), value: overview.open_tenders_count, icon: FileText, color: 'text-cyan-400', bg: 'from-cyan-950/50 to-cyan-900/30' },
            { label: t('tabInExecution', 'Active Projects'), value: overview.active_construction_count, icon: Activity, color: 'text-amber-400', bg: 'from-amber-950/50 to-amber-900/30' },
            { label: t('activeBidsReceived', 'Vendor Bids'), value: overview.total_proposals_received, icon: Briefcase, color: 'text-violet-400', bg: 'from-violet-950/50 to-violet-900/30' },
            { label: t('cardCitizenScore', 'Citizen Rating'), value: `${overview.citizen_average_rating.toFixed(1)}★`, icon: Star, color: 'text-yellow-400', bg: 'from-yellow-950/50 to-yellow-900/30' },
            { label: t('resolvedConcerns', 'Grievances Resolved'), value: `${overview.concerns_resolution_rate_pct}%`, icon: ShieldCheck, color: 'text-teal-400', bg: 'from-teal-950/50 to-teal-900/30' },
          ].map((card, i) => (
            <div key={i} className={`rounded-xl bg-gradient-to-br ${card.bg} border border-slate-800/60 p-4 flex flex-col items-center gap-2 text-center hover:border-slate-700/80 transition-colors`}>
              <card.icon className={`w-5 h-5 ${card.color}`} />
              <div className="text-xl font-bold text-white font-mono">{card.value}</div>
              <div className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">{card.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* ── Role Banner & Perspective Section ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {isLoggedIn && user ? (
          <div className="flex flex-wrap items-center gap-3 p-3 rounded-xl bg-slate-900/90 border border-emerald-500/30 shadow-lg">
            <div className="flex items-center gap-2">
              <span className="text-xl">{user.avatar || '👤'}</span>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white">{user.name}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    {user.role === 'government' ? '🏛️ Official Access' : user.role === 'vendor' ? '🏢 GST-Verified Vendor' : '🇮🇳 My Bharat Citizen'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-mono">
                  {user.role === 'government' ? (user.designation || user.parichayId) : user.role === 'vendor' ? `GSTIN: ${user.gstin}` : `My Bharat ID: ${user.myBharatId}`}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 p-1 rounded-xl bg-slate-900/80 border border-slate-800">
            {PERSPECTIVES.map(p => (
              <button
                key={p.key}
                onClick={() => setPerspective(p.key)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                  perspective === p.key
                    ? `bg-gradient-to-r ${p.color} text-white shadow-lg`
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <p.icon className="w-4 h-4" />
                {p.label}
              </button>
            ))}
          </div>
        )}

        {perspective === 'government' && (
          <button
            onClick={() => setShowTenderModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white text-xs font-semibold shadow-lg shadow-indigo-900/40 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            {t('btnPublishTender', 'Publish Public Tender')}
          </button>
        )}
      </div>

      {/* ── Search & Filters ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('filterSearchPlaceholder', 'Search projects, locations, codes, purposes...')}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-slate-900/80 border border-slate-800 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-600/50 transition-all"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2">
              <X className="w-4 h-4 text-slate-500 hover:text-white" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {FILTER_STATUSES.map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                statusFilter === s
                  ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40'
                  : 'text-slate-400 border-slate-800 hover:text-white hover:border-slate-700'
              }`}
            >
              {s === 'All' ? t('filterDeptAll', 'All') : s}
            </button>
          ))}
        </div>
      </div>

      {/* ── Projects Grid ── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">{t('navProjects', 'Public Projects')} ({filteredProjects.length})</h2>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredProjects.map(p => (
            <ProjectCard
              key={p.id}
              project={p}
              perspective={perspective}
              onBid={() => setShowBidModal(p)}
              onFeedback={() => setShowFeedbackModal(p)}
              onConcern={() => setShowConcernModal(p)}
            />
          ))}
        </div>

        {filteredProjects.length === 0 && (
          <div className="text-center py-16 text-slate-500">
            <Search className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p className="text-sm">{t('noProjectsFoundSub', 'No projects found matching your search criteria.')}</p>
          </div>
        )}
      </div>

      {/* ── Modals ── */}
      {showTenderModal && <PublishTenderModal onClose={() => setShowTenderModal(false)} onSuccess={fetchData} />}
      {showBidModal && <SubmitBidModal project={showBidModal} onClose={() => setShowBidModal(null)} onSuccess={fetchData} />}
      {showFeedbackModal && <SubmitFeedbackModal project={showFeedbackModal} onClose={() => setShowFeedbackModal(null)} onSuccess={fetchData} />}
      {showConcernModal && <RaiseConcernModal project={showConcernModal} onClose={() => setShowConcernModal(null)} onSuccess={fetchData} />}
    </div>
  );
}

/* ────────────────────────────────────── */
/* ─── Project Card Component ─────────── */
/* ────────────────────────────────────── */
function ProjectCard({ project: p, perspective, onBid, onFeedback, onConcern }) {
  const { t } = useLanguage();
  const progressPct = Math.min(100, Math.max(0, p.current_progress_pct));
  const budgetUsedPct = p.budget_cr > 0 ? Math.min(100, (p.spent_cr / p.budget_cr) * 100) : 0;

  return (
    <div className="glass-card rounded-xl p-5 space-y-4">
      {/* Header Row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${STATUS_COLORS[p.tender_status] || STATUS_COLORS['Draft']}`}>
              {p.tender_status}
            </span>
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${RISK_COLORS[p.overall_risk_level] || RISK_COLORS['Low']}`}>
              {p.overall_risk_level === 'High' ? t('badgeHighRisk', 'HIGH RISK') : p.overall_risk_level === 'Medium' ? t('badgeMediumRisk', 'MEDIUM RISK') : t('badgeLowRisk', 'LOW RISK')}
            </span>
          </div>
          <Link to={`/transparency/project/${p.id}`} className="group">
            <h3 className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors truncate">{p.name}</h3>
          </Link>
          <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-400">
            <span className="font-mono">{p.project_code}</span>
            <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{p.location}</span>
          </div>
        </div>
        <Link to={`/transparency/project/${p.id}`} className="shrink-0 p-2 rounded-lg hover:bg-slate-800/60 transition-colors">
          <ArrowUpRight className="w-4 h-4 text-slate-400 hover:text-emerald-400" />
        </Link>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="text-center p-2 rounded-lg bg-slate-900/50 border border-slate-800/50">
          <div className="text-xs font-bold text-white font-mono">₹{p.budget_cr} {t('crore', 'Cr')}</div>
          <div className="text-[10px] text-slate-500">{t('cardBudget', 'Budget')}</div>
        </div>
        <div className="text-center p-2 rounded-lg bg-slate-900/50 border border-slate-800/50">
          <div className="text-xs font-bold text-white font-mono">{p.planned_duration_months} {t('months', 'mo')}</div>
          <div className="text-[10px] text-slate-500">{t('tblScheduleRisk', 'Timeline')}</div>
        </div>
        <div className="text-center p-2 rounded-lg bg-slate-900/50 border border-slate-800/50">
          <div className="text-xs font-bold text-white font-mono">{p.department}</div>
          <div className="text-[10px] text-slate-500">{t('dashDepartment', 'Department')}</div>
        </div>
      </div>

      {/* Progress Bars */}
      <div className="space-y-2">
        <div>
          <div className="flex items-center justify-between text-[10px] mb-1">
            <span className="text-slate-400">{t('tblPhysicalProgress', 'Physical Progress')}</span>
            <span className="text-white font-mono font-bold">{progressPct.toFixed(1)}%</span>
          </div>
          <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all duration-700"
              style={{ width: `${progressPct}%` }}
            ></div>
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between text-[10px] mb-1">
            <span className="text-slate-400">{t('cardUtilization', 'Fund Utilization')} (₹{p.spent_cr} / ₹{p.budget_cr} {t('crore', 'Cr')})</span>
            <span className="text-white font-mono font-bold">{budgetUsedPct.toFixed(1)}%</span>
          </div>
          <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                budgetUsedPct > 90 ? 'bg-gradient-to-r from-rose-600 to-rose-400' :
                budgetUsedPct > 70 ? 'bg-gradient-to-r from-amber-600 to-amber-400' :
                'bg-gradient-to-r from-blue-600 to-blue-400'
              }`}
              style={{ width: `${budgetUsedPct}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Civic Stats Row */}
      <div className="flex items-center gap-4 text-[11px] text-slate-400 pt-1 border-t border-slate-800/50">
        <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-emerald-400" /> {p.milestones_completed}/{p.milestones_total} {t('cardMilestones', 'Milestones')}</span>
        <span className="flex items-center gap-1"><Briefcase className="w-3 h-3 text-violet-400" /> {p.proposals_count} {t('cardProposals', 'Bids')}</span>
        <span className="flex items-center gap-1"><Star className="w-3 h-3 text-yellow-400" /> {p.citizen_rating_avg}★ ({p.citizen_feedbacks_count})</span>
        {p.open_concerns_count > 0 && (
          <span className="flex items-center gap-1 text-rose-400"><AlertTriangle className="w-3 h-3" /> {p.open_concerns_count}</span>
        )}
      </div>

      {/* Perspective-Aware Actions */}
      <div className="flex items-center gap-2 pt-1">
        {perspective === 'vendor' && p.tender_status === 'Open for Bids' && (
          <button onClick={onBid} className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white text-xs font-semibold shadow-md transition-all active:scale-95">
            <Send className="w-3.5 h-3.5" /> {t('btnSubmitBidShort', 'Submit Bid')}
          </button>
        )}
        {perspective === 'citizen' && (
          <>
            <button onClick={onFeedback} className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-semibold shadow-md transition-all active:scale-95">
              <Star className="w-3.5 h-3.5" /> {t('btnRatePerf', 'Rate Performance')}
            </button>
            <button onClick={onConcern} className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white text-xs font-semibold shadow-md transition-all active:scale-95">
              <MessageSquareWarning className="w-3.5 h-3.5" /> {t('btnRaiseConcernShort', 'Raise Concern')}
            </button>
          </>
        )}
        {perspective === 'government' && (
          <Link to={`/transparency/project/${p.id}`} className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white text-xs font-semibold shadow-md transition-all active:scale-95">
            <Gavel className="w-3.5 h-3.5" /> {t('btnManageProject', 'Manage Project')}
          </Link>
        )}
        <Link to={`/transparency/project/${p.id}`} className="px-3 py-2 rounded-lg border border-slate-700 text-slate-300 hover:text-white hover:border-slate-600 text-xs font-medium transition-all flex items-center gap-1">
          <Eye className="w-3.5 h-3.5" /> {t('btnView', 'View')}
        </Link>
      </div>
    </div>
  );
}


/* ────────────────────────────────────────── */
/* ─── Modal Backdrop Component ───────────── */
/* ────────────────────────────────────────── */
function ModalBackdrop({ title, subtitle, icon: Icon, iconColor, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="relative w-full max-w-lg max-h-[85vh] overflow-y-auto bg-slate-900 border border-slate-700/60 rounded-2xl shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 z-10 bg-slate-900/95 backdrop-blur-sm border-b border-slate-800 p-5 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl ${iconColor} flex items-center justify-center shadow-lg`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">{title}</h3>
                <p className="text-[11px] text-slate-400">{subtitle}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-800 transition-colors">
              <X className="w-4 h-4 text-slate-400" />
            </button>
          </div>
        </div>
        <div className="p-5 space-y-4">{children}</div>
      </div>
    </div>
  );
}

function FormField({ label, children }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-slate-300">{label}</label>
      {children}
    </div>
  );
}

function StarRating({ value, onChange, label }) {
  return (
    <div className="space-y-1">
      <div className="text-xs text-slate-400">{label}</div>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map(star => (
          <button key={star} type="button" onClick={() => onChange(star)} className="transition-transform hover:scale-110">
            <Star className={`w-5 h-5 ${star <= value ? 'text-yellow-400 fill-yellow-400' : 'text-slate-600'}`} />
          </button>
        ))}
      </div>
    </div>
  );
}

const inputClass = "w-full px-3 py-2 rounded-lg bg-slate-800/80 border border-slate-700 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-600/40 transition-all";
const selectClass = "w-full px-3 py-2 rounded-lg bg-slate-800/80 border border-slate-700 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40 transition-all appearance-none";



/* ─── Publish Tender Modal ─── */
function PublishTenderModal({ onClose, onSuccess }) {
  const [form, setForm] = useState({
    project_code: '', name: '', department: 'Highways & Transport', location: '',
    budget_cr: '', planned_duration_months: '', purpose: '', specifications: '',
    bidding_deadline: '', min_vendor_experience_years: 5, tender_category: 'Civil Infrastructure'
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!form.project_code || !form.name || !form.budget_cr || !form.purpose || !form.bidding_deadline) return;
    try {
      setSubmitting(true);
      await axios.post(`${API}/projects`, {
        ...form,
        budget_cr: parseFloat(form.budget_cr),
        planned_duration_months: parseInt(form.planned_duration_months) || 24,
        min_vendor_experience_years: parseInt(form.min_vendor_experience_years) || 5
      });
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Error publishing tender:', err);
      alert(err.response?.data?.detail || 'Failed to publish tender');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModalBackdrop title="Publish Public Tender" subtitle="Create a transparent government project for competitive bidding" icon={Landmark} iconColor="bg-gradient-to-br from-indigo-600 to-blue-600" onClose={onClose}>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Project Code *">
          <input className={inputClass} placeholder="PRJ-XXX-001" value={form.project_code} onChange={e => setForm({ ...form, project_code: e.target.value })} />
        </FormField>
        <FormField label="Department">
          <select className={selectClass} value={form.department} onChange={e => setForm({ ...form, department: e.target.value })}>
            {['Highways & Transport', 'Urban Transit', 'Water Resources', 'Renewable Energy', 'Healthcare', 'Urban Development', 'Energy & Power'].map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </FormField>
      </div>
      <FormField label="Project Name *">
        <input className={inputClass} placeholder="Smart Highway Corridor Phase X" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
      </FormField>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Location">
          <input className={inputClass} placeholder="City (State)" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} />
        </FormField>
        <FormField label="Tender Category">
          <input className={inputClass} placeholder="Civil Infrastructure" value={form.tender_category} onChange={e => setForm({ ...form, tender_category: e.target.value })} />
        </FormField>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <FormField label="Budget (₹ Cr) *">
          <input className={inputClass} type="number" step="0.1" placeholder="500" value={form.budget_cr} onChange={e => setForm({ ...form, budget_cr: e.target.value })} />
        </FormField>
        <FormField label="Duration (Months)">
          <input className={inputClass} type="number" placeholder="24" value={form.planned_duration_months} onChange={e => setForm({ ...form, planned_duration_months: e.target.value })} />
        </FormField>
        <FormField label="Min. Vendor Exp (Yrs)">
          <input className={inputClass} type="number" placeholder="5" value={form.min_vendor_experience_years} onChange={e => setForm({ ...form, min_vendor_experience_years: e.target.value })} />
        </FormField>
      </div>
      <FormField label="Bidding Deadline *">
        <input className={inputClass} type="date" value={form.bidding_deadline} onChange={e => setForm({ ...form, bidding_deadline: e.target.value })} />
      </FormField>
      <FormField label="Project Purpose & Objective *">
        <textarea className={`${inputClass} min-h-[80px]`} placeholder="Describe the public objective and impact..." value={form.purpose} onChange={e => setForm({ ...form, purpose: e.target.value })} />
      </FormField>
      <FormField label="Technical Specifications">
        <textarea className={`${inputClass} min-h-[60px]`} placeholder="Engineering standards, materials, certifications..." value={form.specifications} onChange={e => setForm({ ...form, specifications: e.target.value })} />
      </FormField>
      <button
        onClick={handleSubmit}
        disabled={submitting || !form.project_code || !form.name || !form.budget_cr || !form.purpose || !form.bidding_deadline}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-semibold text-sm shadow-lg shadow-indigo-900/40 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Landmark className="w-4 h-4" />
        {submitting ? 'Publishing...' : 'Publish Public Tender'}
      </button>
    </ModalBackdrop>
  );
}


/* ─── Submit Vendor Bid Modal ─── */
function SubmitBidModal({ project, onClose, onSuccess }) {
  const [form, setForm] = useState({
    vendor_name: '', vendor_email: '', vendor_phone: '', vendor_registration_no: '',
    years_of_experience: '', bid_amount_cr: '', proposed_duration_months: '',
    technical_proposal: '', key_personnel: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!form.vendor_name || !form.vendor_email || !form.bid_amount_cr || !form.technical_proposal) return;
    try {
      setSubmitting(true);
      await axios.post(`${API}/projects/${project.id}/apply`, {
        ...form,
        years_of_experience: parseInt(form.years_of_experience) || 5,
        bid_amount_cr: parseFloat(form.bid_amount_cr),
        proposed_duration_months: parseInt(form.proposed_duration_months) || project.planned_duration_months,
        compliance_certified: true
      });
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Error submitting bid:', err);
      alert(err.response?.data?.detail || 'Failed to submit bid');
    } finally {
      setSubmitting(false);
    }
  };

  const bidVsBudget = form.bid_amount_cr ? ((parseFloat(form.bid_amount_cr) / project.budget_cr) * 100).toFixed(1) : null;

  return (
    <ModalBackdrop title="Submit Vendor Bid" subtitle={`Tender: ${project.name} (Budget: ₹${project.budget_cr} Cr)`} icon={Building2} iconColor="bg-gradient-to-br from-amber-600 to-orange-600" onClose={onClose}>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Company / JV Name *">
          <input className={inputClass} placeholder="Your Company Ltd" value={form.vendor_name} onChange={e => setForm({ ...form, vendor_name: e.target.value })} />
        </FormField>
        <FormField label="Email *">
          <input className={inputClass} type="email" placeholder="bids@company.com" value={form.vendor_email} onChange={e => setForm({ ...form, vendor_email: e.target.value })} />
        </FormField>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="GSTIN / Registration No.">
          <input className={inputClass} placeholder="GSTIN27XXXXX" value={form.vendor_registration_no} onChange={e => setForm({ ...form, vendor_registration_no: e.target.value })} />
        </FormField>
        <FormField label="Years of Experience">
          <input className={inputClass} type="number" placeholder="10" value={form.years_of_experience} onChange={e => setForm({ ...form, years_of_experience: e.target.value })} />
        </FormField>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Bid Amount (₹ Cr) *">
          <input className={inputClass} type="number" step="0.1" placeholder="480" value={form.bid_amount_cr} onChange={e => setForm({ ...form, bid_amount_cr: e.target.value })} />
        </FormField>
        <FormField label="Proposed Duration (Months)">
          <input className={inputClass} type="number" placeholder={project.planned_duration_months} value={form.proposed_duration_months} onChange={e => setForm({ ...form, proposed_duration_months: e.target.value })} />
        </FormField>
      </div>
      {bidVsBudget && (
        <div className={`flex items-center gap-2 p-3 rounded-lg text-xs font-mono ${
          parseFloat(bidVsBudget) <= 100 ? 'bg-emerald-950/40 text-emerald-300 border border-emerald-800/40' : 'bg-rose-950/40 text-rose-300 border border-rose-800/40'
        }`}>
          <BarChart3 className="w-4 h-4" />
          Bid is {bidVsBudget}% of Government Budget (₹{project.budget_cr} Cr)
          {parseFloat(bidVsBudget) <= 100 ? ' — Competitive ✓' : ' — Exceeds Budget'}
        </div>
      )}
      <FormField label="Technical Proposal *">
        <textarea className={`${inputClass} min-h-[80px]`} placeholder="Describe your technical methodology, equipment, key milestones..." value={form.technical_proposal} onChange={e => setForm({ ...form, technical_proposal: e.target.value })} />
      </FormField>
      <FormField label="Key Personnel">
        <input className={inputClass} placeholder="Project Director, Lead Engineer..." value={form.key_personnel} onChange={e => setForm({ ...form, key_personnel: e.target.value })} />
      </FormField>
      <button
        onClick={handleSubmit}
        disabled={submitting || !form.vendor_name || !form.vendor_email || !form.bid_amount_cr || !form.technical_proposal}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-semibold text-sm shadow-lg transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Send className="w-4 h-4" />
        {submitting ? 'Submitting...' : 'Submit Competitive Bid'}
      </button>
    </ModalBackdrop>
  );
}


/* ─── Submit Citizen Feedback Modal ─── */
function SubmitFeedbackModal({ project, onClose, onSuccess }) {
  const [form, setForm] = useState({
    citizen_name: '', citizen_location: '', rating_quality: 5, rating_speed: 4, rating_safety: 5,
    aspect: 'Work Quality', comment: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [detectingLoc, setDetectingLoc] = useState(false);

  const handleAutoLocation = () => {
    if (!navigator.geolocation) return;
    setDetectingLoc(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm(prev => ({
          ...prev,
          citizen_location: `GPS: ${pos.coords.latitude.toFixed(3)}°N, ${pos.coords.longitude.toFixed(3)}°E`
        }));
        setDetectingLoc(false);
      },
      () => {
        setDetectingLoc(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const handleSubmit = async () => {
    if (!form.comment) return;
    try {
      setSubmitting(true);
      await axios.post(`${API}/projects/${project.id}/feedback`, form);
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Error submitting feedback:', err);
      alert(err.response?.data?.detail || 'Failed to submit');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModalBackdrop title="Rate Vendor Performance" subtitle={`Project: ${project.name}`} icon={Star} iconColor="bg-gradient-to-br from-emerald-600 to-teal-600" onClose={onClose}>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Your Name">
          <input className={inputClass} placeholder="Verified Citizen" value={form.citizen_name} onChange={e => setForm({ ...form, citizen_name: e.target.value })} />
        </FormField>
        <FormField label="Your Location">
          <div className="relative">
            <input className={`${inputClass} pr-9`} placeholder="Ward / Area" value={form.citizen_location} onChange={e => setForm({ ...form, citizen_location: e.target.value })} />
            <button
              type="button"
              onClick={handleAutoLocation}
              disabled={detectingLoc}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-emerald-400 transition-colors"
              title="Detect Current GPS Location"
            >
              <Compass className={`w-4 h-4 ${detectingLoc ? 'animate-spin text-emerald-400' : ''}`} />
            </button>
          </div>
        </FormField>
      </div>
      <div className="grid grid-cols-3 gap-4 p-4 rounded-xl bg-slate-800/50 border border-slate-700/40">
        <StarRating label="Work Quality" value={form.rating_quality} onChange={v => setForm({ ...form, rating_quality: v })} />
        <StarRating label="Pace of Work" value={form.rating_speed} onChange={v => setForm({ ...form, rating_speed: v })} />
        <StarRating label="Public Safety" value={form.rating_safety} onChange={v => setForm({ ...form, rating_safety: v })} />
      </div>
      <FormField label="Feedback Aspect">
        <select className={selectClass} value={form.aspect} onChange={e => setForm({ ...form, aspect: e.target.value })}>
          {['Work Quality', 'Pace of Work', 'Public Safety & Traffic', 'Environmental Impact', 'Fund Transparency'].map(a => <option key={a} value={a}>{a}</option>)}
        </select>
      </FormField>
      <FormField label="Your Observation / Comment *">
        <textarea className={`${inputClass} min-h-[80px]`} placeholder="Share your ground observation about the project..." value={form.comment} onChange={e => setForm({ ...form, comment: e.target.value })} />
      </FormField>
      <button
        onClick={handleSubmit}
        disabled={submitting || !form.comment}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-sm shadow-lg transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Star className="w-4 h-4" />
        {submitting ? 'Submitting...' : 'Submit Community Review'}
      </button>
    </ModalBackdrop>
  );
}


/* ─── Raise Citizen Concern Modal ─── */
function RaiseConcernModal({ project, onClose, onSuccess }) {
  const [form, setForm] = useState({
    citizen_name: '', citizen_email: '', concern_type: 'Substandard Materials',
    title: '', description: '', location_detail: '', severity: 'Medium'
  });
  const [submitting, setSubmitting] = useState(false);
  const [detectingLoc, setDetectingLoc] = useState(false);

  const handleAutoLocation = () => {
    if (!navigator.geolocation) return;
    setDetectingLoc(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm(prev => ({
          ...prev,
          location_detail: `GPS: ${pos.coords.latitude.toFixed(3)}°N, ${pos.coords.longitude.toFixed(3)}°E`
        }));
        setDetectingLoc(false);
      },
      () => {
        setDetectingLoc(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const handleSubmit = async () => {
    if (!form.title || !form.description) return;
    try {
      setSubmitting(true);
      await axios.post(`${API}/projects/${project.id}/concerns`, form);
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Error raising concern:', err);
      alert(err.response?.data?.detail || 'Failed to submit');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModalBackdrop title="Raise Accountability Concern" subtitle={`Project: ${project.name}`} icon={MessageSquareWarning} iconColor="bg-gradient-to-br from-rose-600 to-pink-600" onClose={onClose}>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Your Name">
          <input className={inputClass} placeholder="Concerned Citizen" value={form.citizen_name} onChange={e => setForm({ ...form, citizen_name: e.target.value })} />
        </FormField>
        <FormField label="Email (optional)">
          <input className={inputClass} type="email" placeholder="For official response" value={form.citizen_email} onChange={e => setForm({ ...form, citizen_email: e.target.value })} />
        </FormField>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Concern Type">
          <select className={selectClass} value={form.concern_type} onChange={e => setForm({ ...form, concern_type: e.target.value })}>
            {['Substandard Materials', 'Unsafe Worksite', 'Prolonged Delay / Inactivity', 'Cost Anomaly', 'Environmental Damage', 'Noise / Inconvenience', 'Corruption Suspicion'].map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </FormField>
        <FormField label="Severity">
          <select className={selectClass} value={form.severity} onChange={e => setForm({ ...form, severity: e.target.value })}>
            {['Low', 'Medium', 'High', 'Critical'].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </FormField>
      </div>
      <FormField label="Issue Title *">
        <input className={inputClass} placeholder="Brief title of the issue" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
      </FormField>
      <FormField label="Detailed Description *">
        <textarea className={`${inputClass} min-h-[80px]`} placeholder="Provide details of your concern for government investigation..." value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
      </FormField>
      <FormField label="Specific Location">
        <div className="relative">
          <input className={`${inputClass} pr-9`} placeholder="KM marker, ward, sector..." value={form.location_detail} onChange={e => setForm({ ...form, location_detail: e.target.value })} />
          <button
            type="button"
            onClick={handleAutoLocation}
            disabled={detectingLoc}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-rose-400 transition-colors"
            title="Detect Current GPS Location"
          >
            <Compass className={`w-4 h-4 ${detectingLoc ? 'animate-spin text-rose-400' : ''}`} />
          </button>
        </div>
      </FormField>
      <button
        onClick={handleSubmit}
        disabled={submitting || !form.title || !form.description}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-semibold text-sm shadow-lg transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <MessageSquareWarning className="w-4 h-4" />
        {submitting ? 'Submitting...' : 'Submit Grievance to Public Oversight Ledger'}
      </button>
    </ModalBackdrop>
  );
}
