import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import {
  ArrowLeft, MapPin, Calendar, Clock, IndianRupee, Building2, Briefcase,
  CheckCircle2, AlertTriangle, Star, ShieldCheck, Eye, Gavel, Send,
  MessageSquareWarning, ThumbsUp, Users, FileText, Award, Timer,
  ChevronRight, Activity, CircleDollarSign, X, Plus, Landmark, Search
} from 'lucide-react';
import RiskBadge from '../components/RiskBadge';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';

const API = '/api/transparency';

const MILESTONE_STATUS_STYLE = {
  'Pending': 'bg-slate-700/50 text-slate-300 border-slate-600/40',
  'In Progress': 'bg-blue-500/15 text-blue-300 border-blue-500/40',
  'Under Review': 'bg-violet-500/15 text-violet-300 border-violet-500/40',
  'Completed': 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40',
  'Verified by Auditor': 'bg-teal-500/15 text-teal-300 border-teal-500/40',
};

const PROPOSAL_STATUS_STYLE = {
  'Submitted': 'bg-blue-500/15 text-blue-300 border-blue-500/40',
  'Under Review': 'bg-violet-500/15 text-violet-300 border-violet-500/40',
  'Shortlisted': 'bg-cyan-500/15 text-cyan-300 border-cyan-500/40',
  'Awarded': 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40',
  'Rejected': 'bg-rose-500/15 text-rose-300 border-rose-500/40',
};

const CONCERN_STATUS_STYLE = {
  'Open': 'bg-rose-500/15 text-rose-300 border-rose-500/40',
  'Under Investigation': 'bg-amber-500/15 text-amber-300 border-amber-500/40',
  'Action Taken': 'bg-blue-500/15 text-blue-300 border-blue-500/40',
  'Resolved': 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40',
  'Dismissed': 'bg-slate-500/15 text-slate-300 border-slate-500/40',
};

const SEVERITY_STYLE = {
  'Low': 'text-slate-300',
  'Medium': 'text-amber-300',
  'High': 'text-rose-300',
  'Critical': 'text-rose-400 font-bold animate-pulse',
};

export default function CivicProjectDetail() {
  const { id } = useParams();
  const { t } = useLanguage();
  const { user, role } = useAuth();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('milestones');
  const [showBidModal, setShowBidModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [showConcernModal, setShowConcernModal] = useState(false);
  const [showMilestoneUpdateModal, setShowMilestoneUpdateModal] = useState(null);
  const [showAwardModal, setShowAwardModal] = useState(null);
  const [showRespondModal, setShowRespondModal] = useState(null);

  useEffect(() => { fetchProject(); }, [id]);

  const fetchProject = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API}/projects/${id}`);
      setProject(res.data);
    } catch (err) {
      console.error('Error loading project:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-3">
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs font-mono text-slate-300">{t('loading', 'Loading Transparency Dossier...')}</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center space-y-4">
        <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-xl font-bold text-white">{t('noProjectsFound', 'Project Record Not Found')}</h2>
        <Link to="/transparency" className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-xs font-semibold rounded-lg">
          <ArrowLeft className="w-4 h-4" /> {t('btnBackToPortal', 'Back to Portal')}
        </Link>
      </div>
    );
  }

  const risk = project.risk_score || {};
  const milestones = project.milestones || [];
  const proposals = project.proposals || [];
  const feedbacks = project.feedbacks || [];
  const concerns = project.concerns || [];

  const progressPct = Math.min(100, Math.max(0, project.current_progress_pct));
  const budgetUsedPct = project.budget_cr > 0 ? Math.min(100, (project.spent_cr / project.budget_cr) * 100) : 0;
  const milestonesCompleted = milestones.filter(m => m.status === 'Completed' || m.status === 'Verified by Auditor').length;
  const avgRating = feedbacks.length > 0 ? (feedbacks.reduce((s, f) => s + f.rating_overall, 0) / feedbacks.length).toFixed(1) : 'N/A';
  const openConcerns = concerns.filter(c => c.status === 'Open' || c.status === 'Under Investigation').length;

  const tabs = [
    { key: 'milestones', label: t('tabMilestones', 'Milestones'), icon: CheckCircle2, count: milestones.length },
    { key: 'proposals', label: t('tabProposals', 'Vendor Bids'), icon: Briefcase, count: proposals.length },
    { key: 'feedback', label: t('tabFeedback', 'Citizen Reviews'), icon: Star, count: feedbacks.length },
    { key: 'concerns', label: t('tabConcerns', 'Accountability'), icon: MessageSquareWarning, count: concerns.length },
  ];

  const inputClass = "w-full px-3 py-2 rounded-lg bg-slate-800/80 border border-slate-700 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-600/40 transition-all";
  const selectClass = "w-full px-3 py-2 rounded-lg bg-slate-800/80 border border-slate-700 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40 transition-all appearance-none";

  const handleUpvoteFeedback = async (fbId) => {
    try { await axios.post(`${API}/feedbacks/${fbId}/upvote`); fetchProject(); } catch (err) { console.error(err); }
  };
  const handleUpvoteConcern = async (cId) => {
    try { await axios.post(`${API}/concerns/${cId}/upvote`); fetchProject(); } catch (err) { console.error(err); }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Back */}
      <Link to="/transparency" className="inline-flex items-center gap-2 text-xs text-slate-400 hover:text-emerald-300 transition-colors font-medium">
        <ArrowLeft className="w-4 h-4" /> {t('btnBackToPortal', 'Back to Civic Transparency Portal')}
      </Link>

      {/* ── Header Card ── */}
      <div className="glass-card rounded-2xl p-6 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded text-[10px] font-bold border bg-emerald-500/15 text-emerald-300 border-emerald-500/40">{project.tender_status}</span>
              <RiskBadge level={risk.overall_risk_level} score={risk.overall_risk_score} />
              <span className="text-xs font-mono text-slate-400">{project.project_code}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white">{project.name}</h1>
            <div className="flex items-center gap-4 text-xs text-slate-400 flex-wrap">
              <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{project.location}</span>
              <span className="flex items-center gap-1"><Building2 className="w-3.5 h-3.5" />{project.contractor}</span>
              <span className="flex items-center gap-1"><FileText className="w-3.5 h-3.5" />{project.department}</span>
              {project.bidding_deadline && <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />Bid Deadline: {project.bidding_deadline}</span>}
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2">
            {role === 'vendor' && project.tender_status === 'Open for Bids' && (
              <button onClick={() => setShowBidModal(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white text-xs font-semibold shadow-md transition-all active:scale-95">
                <Send className="w-3.5 h-3.5" /> {t('btnSubmitBidShort', 'Submit GST-Verified Bid')}
              </button>
            )}
            {role === 'citizen' && (
              <>
                <button onClick={() => setShowFeedbackModal(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-semibold shadow-md transition-all active:scale-95">
                  <Star className="w-3.5 h-3.5" /> {t('btnRatePerf', 'My Bharat Rating')}
                </button>
                <button onClick={() => setShowConcernModal(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white text-xs font-semibold shadow-md transition-all active:scale-95">
                  <MessageSquareWarning className="w-3.5 h-3.5" /> {t('btnRaiseConcernShort', 'File Grievance')}
                </button>
              </>
            )}
            {role === 'government' && (
              <div className="flex items-center gap-2">
                <button onClick={() => setActiveTab('milestones')} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 border border-indigo-500/40 text-xs font-semibold transition-all">
                  <Gavel className="w-3.5 h-3.5 text-indigo-400" /> Audit & Milestones
                </button>
                <button onClick={() => setActiveTab('proposals')} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-600/30 hover:bg-blue-600/50 text-blue-200 border border-blue-500/40 text-xs font-semibold transition-all">
                  <Briefcase className="w-3.5 h-3.5 text-blue-400" /> Evaluate Bids
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Purpose & Specs */}
        {project.purpose && (
          <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800/50 space-y-2">
            <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Project Purpose & Public Objective</h4>
            <p className="text-sm text-slate-300 leading-relaxed">{project.purpose}</p>
            {project.specifications && (
              <>
                <h4 className="text-xs font-bold text-blue-400 uppercase tracking-wider mt-3">Technical Specifications</h4>
                <p className="text-xs text-slate-400 leading-relaxed">{project.specifications}</p>
              </>
            )}
          </div>
        )}

        {/* KPI Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {[
            { label: t('cardBudget', 'Budget'), value: `₹${project.budget_cr} ${t('crore', 'Cr')}`, color: 'text-emerald-400' },
            { label: t('cardSpent', 'Spent'), value: `₹${project.spent_cr} ${t('crore', 'Cr')}`, color: budgetUsedPct > 90 ? 'text-rose-400' : 'text-blue-400' },
            { label: 'Savings', value: `₹${Math.max(0, project.budget_cr - project.spent_cr).toFixed(1)} ${t('crore', 'Cr')}`, color: 'text-teal-400' },
            { label: t('dashProgress', 'Progress'), value: `${progressPct.toFixed(1)}%`, color: 'text-amber-400' },
            { label: t('tblScheduleRisk', 'Duration'), value: `${project.elapsed_months}/${project.planned_duration_months} ${t('months', 'mo')}`, color: 'text-violet-400' },
            { label: t('cardMilestones', 'Milestones'), value: `${milestonesCompleted}/${milestones.length}`, color: 'text-cyan-400' },
            { label: t('cardCitizenScore', 'Citizen Rating'), value: `${avgRating}★`, color: 'text-yellow-400' },
            { label: t('tabConcerns', 'Open Issues'), value: openConcerns, color: openConcerns > 0 ? 'text-rose-400' : 'text-emerald-400' },
          ].map((kpi, i) => (
            <div key={i} className="text-center p-2.5 rounded-lg bg-slate-900/50 border border-slate-800/40">
              <div className={`text-sm font-bold font-mono ${kpi.color}`}>{kpi.value}</div>
              <div className="text-[10px] text-slate-500 mt-0.5">{kpi.label}</div>
            </div>
          ))}
        </div>

        {/* Progress Bars */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <div className="flex items-center justify-between text-[11px] mb-1.5">
              <span className="text-slate-400">{t('tblPhysicalProgress', 'Physical Progress')}</span>
              <span className="text-white font-mono font-bold">{progressPct.toFixed(1)}%</span>
            </div>
            <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all duration-700" style={{ width: `${progressPct}%` }}></div>
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between text-[11px] mb-1.5">
              <span className="text-slate-400">{t('cardUtilization', 'Fund Utilization')}</span>
              <span className="text-white font-mono font-bold">{budgetUsedPct.toFixed(1)}%</span>
            </div>
            <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all duration-700 ${budgetUsedPct > 90 ? 'bg-gradient-to-r from-rose-600 to-rose-400' : budgetUsedPct > 70 ? 'bg-gradient-to-r from-amber-600 to-amber-400' : 'bg-gradient-to-r from-blue-600 to-blue-400'}`} style={{ width: `${budgetUsedPct}%` }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Tab Bar ── */}
      <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-900/80 border border-slate-800 overflow-x-auto">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              activeTab === t.key
                ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <t.icon className={`w-4 h-4 ${activeTab === t.key ? 'text-emerald-400' : 'text-slate-500'}`} />
            {t.label}
            <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-mono ${activeTab === t.key ? 'bg-emerald-800/50 text-emerald-300' : 'bg-slate-800 text-slate-500'}`}>{t.count}</span>
          </button>
        ))}
      </div>

      {/* ── Tab Content ── */}
      <div className="min-h-[300px]">

        {/* MILESTONES TAB */}
        {activeTab === 'milestones' && (
          <div className="space-y-3">
            {milestones.map((m, idx) => (
              <div key={m.id} className="glass-card rounded-xl p-5 flex flex-col sm:flex-row items-start gap-4">
                {/* Step Indicator */}
                <div className="flex flex-col items-center gap-1 shrink-0">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-2 ${
                    m.status === 'Verified by Auditor' ? 'bg-teal-600/30 border-teal-500 text-teal-300' :
                    m.status === 'Completed' ? 'bg-emerald-600/30 border-emerald-500 text-emerald-300' :
                    m.status === 'In Progress' ? 'bg-blue-600/30 border-blue-500 text-blue-300' :
                    'bg-slate-700/30 border-slate-600 text-slate-400'
                  }`}>
                    {m.status === 'Verified by Auditor' || m.status === 'Completed' ? <CheckCircle2 className="w-5 h-5" /> : m.milestone_number}
                  </div>
                  {idx < milestones.length - 1 && <div className="w-0.5 h-8 bg-slate-700/50"></div>}
                </div>
                {/* Content */}
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-sm font-bold text-white">{m.title}</h4>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${MILESTONE_STATUS_STYLE[m.status] || ''}`}>
                      {m.status}
                    </span>
                  </div>
                  {m.description && <p className="text-xs text-slate-400">{m.description}</p>}
                  <div className="flex items-center gap-4 text-[11px] text-slate-400">
                    <span>Budget: ₹{m.allocated_budget_cr} Cr</span>
                    <span>Spent: ₹{m.spent_budget_cr} Cr</span>
                    {m.target_date && <span>Target: {m.target_date}</span>}
                  </div>
                  {/* Milestone progress bar */}
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-teal-400 transition-all duration-500" style={{ width: `${m.progress_pct}%` }}></div>
                    </div>
                    <span className="text-[11px] font-mono text-white font-bold">{m.progress_pct}%</span>
                  </div>
                  {m.official_update_notes && (
                    <div className="p-2.5 rounded-lg bg-slate-900/50 border border-slate-800/40 text-[11px] text-slate-300 italic">
                      <span className="text-emerald-400 not-italic font-bold">Official: </span>{m.official_update_notes}
                    </div>
                  )}
                  {/* Government action: update milestone */}
                  <button onClick={() => setShowMilestoneUpdateModal(m)} className="text-[11px] text-indigo-400 hover:text-indigo-300 font-medium transition-colors flex items-center gap-1 mt-1">
                    <Activity className="w-3 h-3" /> Update Progress
                  </button>
                </div>
              </div>
            ))}
            {milestones.length === 0 && <p className="text-center text-sm text-slate-500 py-12">No milestones defined yet.</p>}
          </div>
        )}

        {/* PROPOSALS TAB */}
        {activeTab === 'proposals' && (
          <div className="space-y-3">
            {proposals.map(p => (
              <div key={p.id} className="glass-card rounded-xl p-5 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-white">{p.vendor_name}</h4>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${PROPOSAL_STATUS_STYLE[p.status] || ''}`}>
                        {p.status === 'Awarded' && <Award className="w-3 h-3 mr-1" />}{p.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1">
                      <span>{p.vendor_email}</span>
                      <span>{p.years_of_experience} yrs experience</span>
                      {p.compliance_certified && <span className="text-emerald-400">✓ Compliance Certified</span>}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-white font-mono">₹{p.bid_amount_cr} Cr</div>
                    <div className="text-[10px] text-slate-400">{p.proposed_duration_months} months</div>
                  </div>
                </div>
                {p.technical_proposal && (
                  <div className="p-3 rounded-lg bg-slate-900/50 border border-slate-800/40 text-xs text-slate-300">
                    <span className="text-blue-400 font-bold">Technical Approach: </span>{p.technical_proposal}
                  </div>
                )}
                {/* Bid vs Budget comparison bar */}
                <div>
                  <div className="flex items-center justify-between text-[10px] mb-1">
                    <span className="text-slate-400">Bid vs Budget</span>
                    <span className="text-white font-mono">{((p.bid_amount_cr / project.budget_cr) * 100).toFixed(1)}% of ₹{project.budget_cr} Cr</span>
                  </div>
                  <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${p.bid_amount_cr <= project.budget_cr ? 'bg-gradient-to-r from-emerald-600 to-emerald-400' : 'bg-gradient-to-r from-rose-600 to-rose-400'}`}
                      style={{ width: `${Math.min(100, (p.bid_amount_cr / project.budget_cr) * 100)}%` }}></div>
                  </div>
                </div>
                {p.decision_notes && (
                  <p className="text-[11px] text-slate-400 italic"><span className="text-violet-400 not-italic font-bold">Decision Notes: </span>{p.decision_notes}</p>
                )}
                {/* Government action: award contract */}
                {p.status !== 'Awarded' && p.status !== 'Rejected' && (
                  <button onClick={() => setShowAwardModal(p)} className="text-[11px] text-indigo-400 hover:text-indigo-300 font-medium transition-colors flex items-center gap-1">
                    <Gavel className="w-3 h-3" /> Review & Award
                  </button>
                )}
              </div>
            ))}
            {project.tender_status === 'Open for Bids' && (
              <button onClick={() => setShowBidModal(true)} className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed border-slate-700 hover:border-amber-600/50 text-slate-400 hover:text-amber-300 text-xs font-semibold transition-all">
                <Plus className="w-4 h-4" /> Submit Your Vendor Bid
              </button>
            )}
            {proposals.length === 0 && <p className="text-center text-sm text-slate-500 py-12">No vendor bids received yet.</p>}
          </div>
        )}

        {/* FEEDBACK TAB */}
        {activeTab === 'feedback' && (
          <div className="space-y-3">
            {feedbacks.map(f => (
              <div key={f.id} className="glass-card rounded-xl p-5 space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-white">{f.citizen_name}</h4>
                      {f.is_verified_resident && <span className="text-[10px] text-emerald-400 font-bold">✓ Verified</span>}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">{f.citizen_location} · {f.aspect}</div>
                  </div>
                  <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
                    <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                    <span className="text-sm font-bold text-yellow-300 font-mono">{f.rating_overall}</span>
                  </div>
                </div>
                {/* Star breakdown */}
                <div className="flex items-center gap-4 text-[11px] text-slate-400">
                  <span>Quality: {'★'.repeat(f.rating_quality)}{'☆'.repeat(5 - f.rating_quality)}</span>
                  <span>Speed: {'★'.repeat(f.rating_speed)}{'☆'.repeat(5 - f.rating_speed)}</span>
                  <span>Safety: {'★'.repeat(f.rating_safety)}{'☆'.repeat(5 - f.rating_safety)}</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">"{f.comment}"</p>
                <div className="flex items-center gap-3 pt-1">
                  <button onClick={() => handleUpvoteFeedback(f.id)} className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-emerald-300 transition-colors">
                    <ThumbsUp className="w-3.5 h-3.5" /> {f.upvotes}
                  </button>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${f.sentiment === 'Positive' ? 'bg-emerald-500/15 text-emerald-300' : f.sentiment === 'Concern' ? 'bg-rose-500/15 text-rose-300' : 'bg-slate-700/50 text-slate-300'}`}>
                    {f.sentiment}
                  </span>
                </div>
              </div>
            ))}
            <button onClick={() => setShowFeedbackModal(true)} className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed border-slate-700 hover:border-emerald-600/50 text-slate-400 hover:text-emerald-300 text-xs font-semibold transition-all">
              <Plus className="w-4 h-4" /> Submit Your Review
            </button>
            {feedbacks.length === 0 && <p className="text-center text-sm text-slate-500 py-12">No citizen reviews yet. Be the first!</p>}
          </div>
        )}

        {/* CONCERNS TAB */}
        {activeTab === 'concerns' && (
          <div className="space-y-3">
            {concerns.map(c => (
              <div key={c.id} className="glass-card rounded-xl p-5 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-bold text-white">{c.title}</h4>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${CONCERN_STATUS_STYLE[c.status] || ''}`}>{c.status}</span>
                      <span className={`text-[10px] font-bold ${SEVERITY_STYLE[c.severity] || ''}`}>{c.severity}</span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1">
                      Reported by: {c.citizen_name} · {c.concern_type} · {c.location_detail}
                    </div>
                  </div>
                  <button onClick={() => handleUpvoteConcern(c.id)} className="flex flex-col items-center gap-0.5 text-slate-400 hover:text-rose-300 transition-colors shrink-0">
                    <ThumbsUp className="w-4 h-4" />
                    <span className="text-[10px] font-mono font-bold">{c.upvotes}</span>
                  </button>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">{c.description}</p>
                {c.official_response && (
                  <div className="p-3 rounded-lg bg-emerald-950/30 border border-emerald-800/30 text-xs space-y-1">
                    <div className="flex items-center gap-1 text-emerald-400 font-bold">
                      <ShieldCheck className="w-3.5 h-3.5" /> Official Government Response
                    </div>
                    <p className="text-slate-300">{c.official_response}</p>
                    {c.response_officer && <p className="text-[10px] text-slate-500">— {c.response_officer}</p>}
                  </div>
                )}
                {/* Government action: respond to concern */}
                {c.status !== 'Resolved' && c.status !== 'Dismissed' && (
                  <button onClick={() => setShowRespondModal(c)} className="text-[11px] text-indigo-400 hover:text-indigo-300 font-medium transition-colors flex items-center gap-1">
                    <Gavel className="w-3 h-3" /> Respond Officially
                  </button>
                )}
              </div>
            ))}
            <button onClick={() => setShowConcernModal(true)} className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed border-slate-700 hover:border-rose-600/50 text-slate-400 hover:text-rose-300 text-xs font-semibold transition-all">
              <Plus className="w-4 h-4" /> Report an Issue
            </button>
            {concerns.length === 0 && <p className="text-center text-sm text-slate-500 py-12">No accountability concerns filed.</p>}
          </div>
        )}
      </div>

      {/* ── Quick Link to Risk Intelligence ── */}
      <div className="glass-card rounded-xl p-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-400 flex items-center justify-center shadow-lg">
            <Eye className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="text-sm font-bold text-white">DRISHTI ML Risk Intelligence</div>
            <p className="text-[11px] text-slate-400">View AI-powered cost & schedule risk analysis</p>
          </div>
        </div>
        <Link to={`/projects/${id}`} className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-indigo-600/20 text-indigo-300 hover:text-white border border-indigo-500/30 text-xs font-semibold transition-all">
          View Risk Dashboard <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      {/* ── Inline Modals ── */}

      {/* Submit Bid Modal */}
      {showBidModal && <InlineBidModal project={project} onClose={() => setShowBidModal(false)} onSuccess={fetchProject} />}

      {/* Submit Feedback Modal */}
      {showFeedbackModal && <InlineFeedbackModal project={project} onClose={() => setShowFeedbackModal(false)} onSuccess={fetchProject} />}

      {/* Raise Concern Modal */}
      {showConcernModal && <InlineConcernModal project={project} onClose={() => setShowConcernModal(false)} onSuccess={fetchProject} />}

      {/* Milestone Update Modal */}
      {showMilestoneUpdateModal && (
        <MilestoneUpdateModal milestone={showMilestoneUpdateModal} onClose={() => setShowMilestoneUpdateModal(null)} onSuccess={fetchProject} />
      )}

      {/* Award Proposal Modal */}
      {showAwardModal && (
        <AwardProposalModal proposal={showAwardModal} onClose={() => setShowAwardModal(null)} onSuccess={fetchProject} />
      )}

      {/* Respond to Concern Modal */}
      {showRespondModal && (
        <RespondConcernModal concern={showRespondModal} onClose={() => setShowRespondModal(null)} onSuccess={fetchProject} />
      )}
    </div>
  );
}


/* ─── Shared Modal Backdrop ─── */
function ModalBackdrop({ title, icon: Icon, iconColor, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="relative w-full max-w-md max-h-[85vh] overflow-y-auto bg-slate-900 border border-slate-700/60 rounded-2xl shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 z-10 bg-slate-900/95 backdrop-blur-sm border-b border-slate-800 p-4 rounded-t-2xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-lg ${iconColor} flex items-center justify-center`}>
              <Icon className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-bold text-white">{title}</span>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-800"><X className="w-4 h-4 text-slate-400" /></button>
        </div>
        <div className="p-4 space-y-3">{children}</div>
      </div>
    </div>
  );
}

const inputClass2 = "w-full px-3 py-2 rounded-lg bg-slate-800/80 border border-slate-700 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 transition-all";
const selectClass2 = "w-full px-3 py-2 rounded-lg bg-slate-800/80 border border-slate-700 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40 transition-all appearance-none";


/* ─── Inline Bid Modal ─── */
function InlineBidModal({ project, onClose, onSuccess }) {
  const [form, setForm] = useState({ vendor_name: '', vendor_email: '', bid_amount_cr: '', proposed_duration_months: '', technical_proposal: '', years_of_experience: '' });
  const [submitting, setSubmitting] = useState(false);
  const handleSubmit = async () => {
    if (!form.vendor_name || !form.vendor_email || !form.bid_amount_cr || !form.technical_proposal) return;
    try {
      setSubmitting(true);
      await axios.post(`${API}/projects/${project.id}/apply`, {
        ...form, bid_amount_cr: parseFloat(form.bid_amount_cr),
        proposed_duration_months: parseInt(form.proposed_duration_months) || project.planned_duration_months,
        years_of_experience: parseInt(form.years_of_experience) || 5, compliance_certified: true
      });
      onSuccess(); onClose();
    } catch (err) { alert(err.response?.data?.detail || 'Failed'); } finally { setSubmitting(false); }
  };
  return (
    <ModalBackdrop title="Submit Vendor Bid" icon={Building2} iconColor="bg-gradient-to-br from-amber-600 to-orange-600" onClose={onClose}>
      <input className={inputClass2} placeholder="Company Name *" value={form.vendor_name} onChange={e => setForm({ ...form, vendor_name: e.target.value })} />
      <input className={inputClass2} placeholder="Email *" value={form.vendor_email} onChange={e => setForm({ ...form, vendor_email: e.target.value })} />
      <div className="grid grid-cols-2 gap-2">
        <input className={inputClass2} type="number" step="0.1" placeholder={`Bid ₹ Cr (Budget: ${project.budget_cr})`} value={form.bid_amount_cr} onChange={e => setForm({ ...form, bid_amount_cr: e.target.value })} />
        <input className={inputClass2} type="number" placeholder="Duration (mo)" value={form.proposed_duration_months} onChange={e => setForm({ ...form, proposed_duration_months: e.target.value })} />
      </div>
      <textarea className={`${inputClass2} min-h-[60px]`} placeholder="Technical Proposal *" value={form.technical_proposal} onChange={e => setForm({ ...form, technical_proposal: e.target.value })} />
      <button onClick={handleSubmit} disabled={submitting} className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 text-white text-sm font-semibold disabled:opacity-50">
        {submitting ? 'Submitting...' : 'Submit Bid'}
      </button>
    </ModalBackdrop>
  );
}

/* ─── Inline Feedback Modal ─── */
function InlineFeedbackModal({ project, onClose, onSuccess }) {
  const [form, setForm] = useState({ citizen_name: '', rating_quality: 5, rating_speed: 4, rating_safety: 5, aspect: 'Work Quality', comment: '' });
  const [submitting, setSubmitting] = useState(false);
  const handleSubmit = async () => {
    if (!form.comment) return;
    try {
      setSubmitting(true);
      await axios.post(`${API}/projects/${project.id}/feedback`, form);
      onSuccess(); onClose();
    } catch (err) { alert('Failed'); } finally { setSubmitting(false); }
  };
  return (
    <ModalBackdrop title="Rate Vendor Performance" icon={Star} iconColor="bg-gradient-to-br from-emerald-600 to-teal-600" onClose={onClose}>
      <input className={inputClass2} placeholder="Your Name" value={form.citizen_name} onChange={e => setForm({ ...form, citizen_name: e.target.value })} />
      <div className="grid grid-cols-3 gap-2">
        {[['Quality', 'rating_quality'], ['Speed', 'rating_speed'], ['Safety', 'rating_safety']].map(([label, key]) => (
          <div key={key} className="text-center">
            <div className="text-[10px] text-slate-400 mb-1">{label}</div>
            <div className="flex justify-center gap-0.5">
              {[1,2,3,4,5].map(s => (
                <button key={s} onClick={() => setForm({ ...form, [key]: s })}>
                  <Star className={`w-4 h-4 ${s <= form[key] ? 'text-yellow-400 fill-yellow-400' : 'text-slate-600'}`} />
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
      <textarea className={`${inputClass2} min-h-[60px]`} placeholder="Your observation... *" value={form.comment} onChange={e => setForm({ ...form, comment: e.target.value })} />
      <button onClick={handleSubmit} disabled={submitting} className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-sm font-semibold disabled:opacity-50">
        {submitting ? 'Submitting...' : 'Submit Review'}
      </button>
    </ModalBackdrop>
  );
}

/* ─── Inline Concern Modal ─── */
function InlineConcernModal({ project, onClose, onSuccess }) {
  const [form, setForm] = useState({ citizen_name: '', concern_type: 'Substandard Materials', title: '', description: '', severity: 'Medium' });
  const [submitting, setSubmitting] = useState(false);
  const handleSubmit = async () => {
    if (!form.title || !form.description) return;
    try {
      setSubmitting(true);
      await axios.post(`${API}/projects/${project.id}/concerns`, form);
      onSuccess(); onClose();
    } catch (err) { alert('Failed'); } finally { setSubmitting(false); }
  };
  return (
    <ModalBackdrop title="Raise Accountability Concern" icon={MessageSquareWarning} iconColor="bg-gradient-to-br from-rose-600 to-pink-600" onClose={onClose}>
      <input className={inputClass2} placeholder="Your Name" value={form.citizen_name} onChange={e => setForm({ ...form, citizen_name: e.target.value })} />
      <select className={selectClass2} value={form.concern_type} onChange={e => setForm({ ...form, concern_type: e.target.value })}>
        {['Substandard Materials', 'Unsafe Worksite', 'Prolonged Delay / Inactivity', 'Cost Anomaly', 'Environmental Damage', 'Noise / Inconvenience', 'Corruption Suspicion'].map(c => <option key={c} value={c}>{c}</option>)}
      </select>
      <input className={inputClass2} placeholder="Issue Title *" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
      <textarea className={`${inputClass2} min-h-[60px]`} placeholder="Detailed description... *" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
      <select className={selectClass2} value={form.severity} onChange={e => setForm({ ...form, severity: e.target.value })}>
        {['Low', 'Medium', 'High', 'Critical'].map(s => <option key={s} value={s}>{s}</option>)}
      </select>
      <button onClick={handleSubmit} disabled={submitting} className="w-full py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 text-white text-sm font-semibold disabled:opacity-50">
        {submitting ? 'Submitting...' : 'Submit Grievance'}
      </button>
    </ModalBackdrop>
  );
}

/* ─── Milestone Update Modal ─── */
function MilestoneUpdateModal({ milestone, onClose, onSuccess }) {
  const [form, setForm] = useState({ status: milestone.status, progress_pct: milestone.progress_pct, spent_budget_cr: milestone.spent_budget_cr, official_update_notes: '' });
  const [submitting, setSubmitting] = useState(false);
  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      await axios.put(`${API}/milestones/${milestone.id}`, {
        ...form, progress_pct: parseFloat(form.progress_pct), spent_budget_cr: parseFloat(form.spent_budget_cr)
      });
      onSuccess(); onClose();
    } catch (err) { alert('Failed'); } finally { setSubmitting(false); }
  };
  return (
    <ModalBackdrop title={`Update: ${milestone.title}`} icon={Activity} iconColor="bg-gradient-to-br from-indigo-600 to-blue-600" onClose={onClose}>
      <select className={selectClass2} value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
        {['Pending', 'In Progress', 'Under Review', 'Completed', 'Verified by Auditor'].map(s => <option key={s} value={s}>{s}</option>)}
      </select>
      <div className="grid grid-cols-2 gap-2">
        <input className={inputClass2} type="number" step="0.1" placeholder="Progress %" value={form.progress_pct} onChange={e => setForm({ ...form, progress_pct: e.target.value })} />
        <input className={inputClass2} type="number" step="0.1" placeholder="Spent ₹ Cr" value={form.spent_budget_cr} onChange={e => setForm({ ...form, spent_budget_cr: e.target.value })} />
      </div>
      <textarea className={`${inputClass2} min-h-[60px]`} placeholder="Official update notes..." value={form.official_update_notes} onChange={e => setForm({ ...form, official_update_notes: e.target.value })} />
      <button onClick={handleSubmit} disabled={submitting} className="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 text-white text-sm font-semibold disabled:opacity-50">
        {submitting ? 'Updating...' : 'Publish Update'}
      </button>
    </ModalBackdrop>
  );
}

/* ─── Award Proposal Modal ─── */
function AwardProposalModal({ proposal, onClose, onSuccess }) {
  const [status, setStatus] = useState('Awarded');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      await axios.put(`${API}/proposals/${proposal.id}/status`, { status, decision_notes: notes });
      onSuccess(); onClose();
    } catch (err) { alert('Failed'); } finally { setSubmitting(false); }
  };
  return (
    <ModalBackdrop title={`Review: ${proposal.vendor_name}`} icon={Gavel} iconColor="bg-gradient-to-br from-indigo-600 to-violet-600" onClose={onClose}>
      <select className={selectClass2} value={status} onChange={e => setStatus(e.target.value)}>
        {['Under Review', 'Shortlisted', 'Awarded', 'Rejected'].map(s => <option key={s} value={s}>{s}</option>)}
      </select>
      <textarea className={`${inputClass2} min-h-[60px]`} placeholder="Decision notes..." value={notes} onChange={e => setNotes(e.target.value)} />
      <button onClick={handleSubmit} disabled={submitting} className="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-sm font-semibold disabled:opacity-50">
        {submitting ? 'Processing...' : `${status === 'Awarded' ? 'Award Contract' : 'Update Status'}`}
      </button>
    </ModalBackdrop>
  );
}

/* ─── Respond to Concern Modal ─── */
function RespondConcernModal({ concern, onClose, onSuccess }) {
  const [form, setForm] = useState({ status: 'Under Investigation', official_response: '', response_officer: '' });
  const [submitting, setSubmitting] = useState(false);
  const handleSubmit = async () => {
    if (!form.official_response) return;
    try {
      setSubmitting(true);
      await axios.put(`${API}/concerns/${concern.id}/respond`, form);
      onSuccess(); onClose();
    } catch (err) { alert('Failed'); } finally { setSubmitting(false); }
  };
  return (
    <ModalBackdrop title={`Respond: ${concern.title}`} icon={ShieldCheck} iconColor="bg-gradient-to-br from-emerald-600 to-teal-600" onClose={onClose}>
      <select className={selectClass2} value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
        {['Under Investigation', 'Action Taken', 'Resolved', 'Dismissed'].map(s => <option key={s} value={s}>{s}</option>)}
      </select>
      <textarea className={`${inputClass2} min-h-[60px]`} placeholder="Official response... *" value={form.official_response} onChange={e => setForm({ ...form, official_response: e.target.value })} />
      <input className={inputClass2} placeholder="Response Officer Name" value={form.response_officer} onChange={e => setForm({ ...form, response_officer: e.target.value })} />
      <button onClick={handleSubmit} disabled={submitting || !form.official_response} className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-sm font-semibold disabled:opacity-50">
        {submitting ? 'Publishing...' : 'Publish Official Response'}
      </button>
    </ModalBackdrop>
  );
}
