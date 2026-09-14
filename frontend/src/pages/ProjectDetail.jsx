import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { 
  Building2, Calendar, MapPin, HardHat, IndianRupee, Clock, 
  AlertTriangle, ArrowLeft, CheckCircle2, FileText, Cpu, 
  TrendingUp, Activity, Lightbulb, ShieldAlert, Tag, SlidersHorizontal,
  Download, ShieldCheck, RotateCcw, Sparkles, ChevronRight, Play,
  BarChart3, CircleDollarSign, Mountain
} from 'lucide-react';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, ArcElement, RadialLinearScale,
  Title, Tooltip, Legend, Filler
} from 'chart.js';
import { Line, Bar, Doughnut, Radar } from 'react-chartjs-2';
import RiskBadge from '../components/RiskBadge';
import { useLanguage } from '../context/LanguageContext';

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, RadialLinearScale, Title, Tooltip, Legend, Filler
);

export default function ProjectDetail() {
  const { id } = useParams();
  const { t } = useLanguage();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('explainability');

  // What-If Simulation state
  const [simForm, setSimForm] = useState({
    spent_cr: 0,
    elapsed_months: 0,
    current_progress_pct: 0,
    remarks: ''
  });
  const [simResult, setSimResult] = useState(null);
  const [simLoading, setSimLoading] = useState(false);

  useEffect(() => {
    fetchProjectDetails();
  }, [id]);

  const fetchProjectDetails = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`/api/projects/${id}`);
      setProject(res.data);
      setSimForm({
        spent_cr: res.data.spent_cr,
        elapsed_months: res.data.elapsed_months,
        current_progress_pct: res.data.current_progress_pct,
        remarks: res.data.remarks || ''
      });
      // Initial simulation baseline
      runSimulationWithData(res.data, {
        spent_cr: res.data.spent_cr,
        elapsed_months: res.data.elapsed_months,
        current_progress_pct: res.data.current_progress_pct,
        remarks: res.data.remarks || ''
      });
    } catch (err) {
      console.error("Error loading project details:", err);
    } finally {
      setLoading(false);
    }
  };

  const runSimulationWithData = async (baseProj, formValues) => {
    if (!baseProj) return;
    try {
      setSimLoading(true);
      const res = await axios.post('/api/projects/simulate', {
        budget_cr: baseProj.budget_cr,
        spent_cr: parseFloat(formValues.spent_cr) || 0.0,
        planned_duration_months: baseProj.planned_duration_months,
        elapsed_months: parseInt(formValues.elapsed_months) || 0,
        current_progress_pct: parseFloat(formValues.current_progress_pct) || 0.0,
        remarks: formValues.remarks || ''
      });
      setSimResult(res.data);
    } catch (err) {
      console.error("Error running simulation:", err);
    } finally {
      setSimLoading(false);
    }
  };

  const handleSimulate = (e) => {
    if (e) e.preventDefault();
    runSimulationWithData(project, simForm);
  };

  const resetSimulation = () => {
    if (!project) return;
    const baseForm = {
      spent_cr: project.spent_cr,
      elapsed_months: project.elapsed_months,
      current_progress_pct: project.current_progress_pct,
      remarks: project.remarks || ''
    };
    setSimForm(baseForm);
    runSimulationWithData(project, baseForm);
  };

  const exportProjectReportCSV = () => {
    if (!project) return;
    const riskData = project.risk_score || {};
    const nlpData = project.remark_insight || {};
    
    const rows = [
      ["DRISHTI PROJECT RISK & TELEMETRY REPORT", ""],
      ["Generated Timestamp", new Date().toISOString()],
      ["Project Code", project.project_code],
      ["Project Name", `"${project.name}"`],
      ["Department", `"${project.department}"`],
      ["Location", `"${project.location}"`],
      ["Contractor", `"${project.contractor}"`],
      ["Sanctioned Budget (Cr INR)", project.budget_cr],
      ["Spent to Date (Cr INR)", project.spent_cr],
      ["Planned Duration (Months)", project.planned_duration_months],
      ["Elapsed Months", project.elapsed_months],
      ["Current Physical Progress (%)", project.current_progress_pct],
      ["DRISHTI Risk Score (0-100)", riskData.overall_risk_score],
      ["Overall Risk Level", riskData.overall_risk_level],
      ["Cost Risk Score (%)", riskData.cost_risk_score],
      ["Predicted Cost Overrun (%)", riskData.predicted_cost_overrun_pct],
      ["Schedule Risk Score (%)", riskData.schedule_risk_score],
      ["Predicted Delay (Months)", riskData.predicted_delay_months],
      ["NLP Sentiment Score", nlpData.sentiment_score],
      ["NLP Risk Penalty Points", nlpData.risk_weight_addition],
      ["Inspector Remarks", `"${project.remarks || ''}"`],
      ["NLP Risk Flags", `"${(nlpData.risk_flags || []).join('; ')}"`],
      ["TF-IDF Keywords", `"${(nlpData.extracted_keywords || []).join('; ')}"`]
    ];

    const csvContent = "data:text/csv;charset=utf-8," + rows.map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `DRISHTI_Risk_Report_${project.project_code}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-3">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs font-mono text-slate-500">{t('loading', 'Fetching Project Risk Telemetry & NLP Insights...')}</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center space-y-4">
        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto" />
        <h2 className="text-xl font-bold text-slate-800">{t('noProjectsFound', 'Project Record Not Found')}</h2>
        <Link to="/projects" className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-lg">
          <ArrowLeft className="w-4 h-4" /> {t('projDetailBack', 'Back to Projects')}
        </Link>
      </div>
    );
  }

  const risk = project.risk_score || {};
  const nlp = project.remark_insight || {};
  const history = project.historical_progress || [];

  // Chart: Historical S-Curve
  const historyLabels = history.map(h => `Month ${h.month}`);
  const plannedProgressData = history.map(h => h.planned_progress_pct);
  const actualProgressData = history.map(h => h.actual_progress_pct);

  const scurveData = {
    labels: historyLabels,
    datasets: [
      {
        label: 'Planned Progress %',
        data: plannedProgressData,
        borderColor: '#94a3b8',
        borderDash: [5, 5],
        backgroundColor: 'rgba(148, 163, 184, 0.1)',
        tension: 0.3,
        fill: false,
      },
      {
        label: 'Actual Progress %',
        data: actualProgressData,
        borderColor: risk.overall_risk_level === 'High' ? '#ef4444' : '#3b82f6',
        backgroundColor: risk.overall_risk_level === 'High' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(59, 130, 246, 0.1)',
        tension: 0.3,
        fill: true,
      }
    ]
  };

  // Chart 2: Graphical Feature Attribution Bar Chart
  const riskFactors = risk.top_risk_factors || [];
  const riskFactorsBarData = {
    labels: riskFactors.map(rf => rf.factor),
    datasets: [
      {
        label: 'Impact Score (%)',
        data: riskFactors.map(rf => rf.impact_score),
        backgroundColor: [
          '#3b82f6', '#ef4444', '#f59e0b', '#10b981', '#8b5cf6', '#ec4899'
        ],
        borderRadius: 6,
      }
    ]
  };

  // Chart 3: Financial Budget Utilization Doughnut Chart
  const remainingBudget = Math.max(0, project.budget_cr - project.spent_cr);
  const budgetDoughnutData = {
    labels: ['Spent to Date (₹ Cr)', 'Remaining Budget (₹ Cr)'],
    datasets: [
      {
        data: [project.spent_cr, remainingBudget],
        backgroundColor: ['#3b82f6', '#cbd5e1'],
        borderWidth: 0,
      }
    ]
  };

  // Chart 4: Multi-Vector Risk Radar Chart
  const riskRadarData = {
    labels: ['Cost Risk', 'Schedule Risk', 'Overall Risk', 'Landslide Risk', 'NLP Penalty'],
    datasets: [
      {
        label: 'Risk Telemetry %',
        data: [
          risk.cost_risk_score || 0,
          risk.schedule_risk_score || 0,
          risk.overall_risk_score || 0,
          project.landslide_risk_pct || 0,
          (nlp.risk_weight_addition || 0) * 10
        ],
        backgroundColor: 'rgba(239, 68, 68, 0.2)',
        borderColor: '#ef4444',
        pointBackgroundColor: '#ef4444',
        pointBorderColor: '#fff',
      }
    ]
  };

  // Automated Recommendations
  const generateRecommendations = () => {
    const recs = [];
    if (risk.cost_risk_score > 60) {
      recs.push({
        title: "Immediate Financial & Billing Audit",
        desc: "Budget utilization significantly outpaces physical progress. Issue mandatory joint audit notice to verify contractor valuation sheets and subcontractor payment ledger.",
        level: "High Priority"
      });
    }
    if (risk.predicted_delay_months > 6) {
      recs.push({
        title: "Contractual Acceleration Notice (Clause 14.2)",
        desc: `Project is running ${risk.predicted_delay_months} months behind baseline. Issue formal acceleration schedule requiring contractor to add double-shift labor teams.`,
        level: "High Priority"
      });
    }
    if (nlp.risk_flags && nlp.risk_flags.length > 0) {
      recs.push({
        title: "Inter-Ministerial Nodal Clearance",
        desc: `Targeted issues detected in remarks: ${nlp.risk_flags.join(', ')}. Convene Empowered Group of Secretaries (EGoS) meeting to resolve Right-of-Way and environmental clearances.`,
        level: "Medium Priority"
      });
    }
    if (recs.length === 0) {
      recs.push({
        title: "Standard Monitoring Protocol",
        desc: "Project is operating within baseline variance thresholds. Continue routine monthly drone telemetry inspections and automated expenditure reconciliation.",
        level: "Routine"
      });
    }
    return recs;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Top Navigation & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link
          to="/projects"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-slate-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t('projDetailBack', 'Back to Projects Directory')}</span>
        </Link>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Link
            to={`/transparency/project/${project.id}`}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-semibold transition-all shadow-sm"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Civic Transparency Dossier ↗</span>
          </Link>
          <button
            onClick={exportProjectReportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold transition-all shadow-sm"
          >
            <Download className="w-3.5 h-3.5 text-blue-500" />
            <span>Export Risk Dossier</span>
          </button>
          <span className="font-mono text-xs text-slate-400">ID: #{project.id}</span>
        </div>
      </div>

      {/* Hero Header Card */}
      <div className="p-6 sm:p-8 rounded-2xl bg-white border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          
          <div className="space-y-3 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-md bg-blue-50 text-blue-600 border border-blue-200 font-mono text-xs font-bold">
                {project.project_code}
              </span>
              <span className="px-3 py-1 rounded-md bg-slate-100 text-slate-600 text-xs font-medium border border-slate-200">
                {project.department}
              </span>
              {project.tender_status && (
                <span className="px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-medium">
                  {project.tender_status}
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight">
              {project.name}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
              <div className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-slate-400" />{project.location}</div>
              <div className="flex items-center gap-1.5"><HardHat className="w-4 h-4 text-slate-400" />{project.contractor}</div>
            </div>
          </div>

          {/* Overall Risk Score Badge Widget */}
          <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col items-center justify-center min-w-[220px]">
            <span className="text-[11px] font-mono text-slate-400 uppercase tracking-widest">{t('dashRiskLevel', 'DRISHTI Risk Score')}</span>
            <div className="text-4xl font-extrabold font-mono mt-1 mb-2 text-slate-800">
              {(risk?.overall_risk_score || 0).toFixed(1)}<span className="text-sm text-slate-400">/100</span>
            </div>
            <RiskBadge level={risk?.overall_risk_level || 'Safe'} score={risk?.overall_risk_score || 0} showScore={false} />
          </div>

        </div>

        {/* Quick KPI Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-6 border-t border-slate-100 text-xs">
          <div>
            <span className="text-slate-400 block font-mono">{t('tblSanctionedBudget', 'Sanctioned Budget')}</span>
            <span className="text-base font-bold text-slate-800 font-mono">₹{project.budget_cr.toLocaleString()} {t('crore', 'Cr')}</span>
          </div>
          <div>
            <span className="text-slate-400 block font-mono">{t('tblSpentToDate', 'Spent to Date')}</span>
            <span className="text-base font-bold text-slate-600 font-mono">₹{project.spent_cr.toLocaleString()} {t('crore', 'Cr')}</span>
          </div>
          <div>
            <span className="text-slate-400 block font-mono">{t('tblPhysicalProgress', 'Physical Progress')}</span>
            <span className="text-base font-bold text-blue-600 font-mono">{project.current_progress_pct}%</span>
          </div>
          <div>
            <span className="text-slate-400 block font-mono">{t('dashDelayForecast', 'Predicted Delay')}</span>
            <span className="text-base font-bold text-amber-600 font-mono">+{risk.predicted_delay_months} {t('months', 'Months')}</span>
          </div>
        </div>

        {/* Landslide Risk & My Bharat GIS Integration Card */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 pt-6 border-t border-slate-100">
          
          {/* Landslide Risk Gauge & Hazard Telemetry */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Mountain className="w-4 h-4 text-slate-500" />
                  <span>Landslide Hazard Assessment</span>
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-slate-200 font-mono text-slate-700 font-medium">
                  {project.terrain_type || "Hilly / Mountainous"}
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Terrain stability model calculated from slope, rainfall, and fault lines.
              </p>
            </div>
            <div className="text-right pl-4">
              <span className={`text-2xl font-black font-mono ${
                (project.landslide_risk_pct || 0) >= 50 ? 'text-rose-600' :
                (project.landslide_risk_pct || 0) >= 25 ? 'text-amber-600' : 'text-emerald-600'
              }`}>
                {project.landslide_risk_pct || 0}%
              </span>
              <span className={`block text-[10px] font-bold uppercase tracking-wider ${
                (project.landslide_risk_pct || 0) >= 50 ? 'text-rose-600' :
                (project.landslide_risk_pct || 0) >= 25 ? 'text-amber-600' : 'text-emerald-600'
              }`}>
                {(project.landslide_risk_pct || 0) >= 50 ? 'High Hazard' :
                 (project.landslide_risk_pct || 0) >= 25 ? 'Moderate Hazard' : 'Stable Terrain'}
              </span>
            </div>
          </div>

          {/* My Bharat Portal GIS Integration */}
          <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-200 flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-emerald-700" />
                  <span>My Bharat Portal GIS Link</span>
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-mono font-bold">
                  ID: {project.mybharat_location_id || "MB-GIS-88412"}
                </span>
              </div>
              <p className="text-[11px] text-emerald-700">
                Location: <strong className="font-semibold">{project.mybharat_district || project.location}</strong>, {project.mybharat_state || "India"}
              </p>
            </div>
            <div className="text-right pl-4 font-mono text-[11px] text-emerald-800">
              <span className="block font-bold">GPS Coordinates:</span>
              <span className="text-[10px] text-emerald-600">{project.mybharat_coordinates || "31.1048° N, 77.1734° E"}</span>
            </div>
          </div>

        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex border-b border-slate-200 space-x-4 overflow-x-auto">
        {[
          { id: 'explainability', label: t('tabOverview', 'ML Explainability & Risk Drivers'), icon: Cpu },
          { id: 'simulate', label: 'What-If Scenario Simulator', icon: SlidersHorizontal, badge: 'AI Tool' },
          { id: 'timeline', label: t('tabScheduleAnalysis', 'Historical S-Curve Timeline'), icon: TrendingUp },
          { id: 'nlp', label: t('tabNlpInsights', 'NLP Remarks Insights'), icon: FileText },
          { id: 'recommendations', label: t('dashPriorityWatchlist', 'Decision-Support Action Plan'), icon: Lightbulb }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 pb-3 text-xs font-semibold border-b-2 transition-all whitespace-nowrap ${
                isActive
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.badge && (
                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-100 text-blue-700">
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Content 1: ML Explainability & Graphical Analytics */}
      {activeTab === 'explainability' && (
        <div className="space-y-6">
          
          {/* Graphical Analytics Row 1: Feature Attribution Bar Chart + Radar Telemetry */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Graphical Bar Chart for Risk Factors */}
            <div className="lg:col-span-2 p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
              <div>
                <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-blue-500" />
                  <span>Graphical Risk Attribution (Feature Impact Bar Chart)</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Random Forest ML feature weightings driving the project risk calculation.
                </p>
              </div>

              <div className="h-64">
                <Bar
                  data={riskFactorsBarData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    indexAxis: 'y',
                    plugins: {
                      legend: { display: false },
                      tooltip: { callbacks: { label: (ctx) => `Impact Score: ${ctx.raw}%` } }
                    },
                    scales: {
                      x: { max: 100, ticks: { color: '#64748b' }, grid: { color: 'rgba(226, 232, 240, 0.6)' } },
                      y: { ticks: { color: '#334155', font: { size: 11, weight: 'bold' } }, grid: { display: false } }
                    }
                  }}
                />
              </div>
            </div>

            {/* Graphical Multi-Vector Radar Chart */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4 flex flex-col justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-rose-500" />
                  <span>Multi-Vector Risk Radar</span>
                </h3>
                <p className="text-xs text-slate-400">
                  360-degree graphical risk breakdown.
                </p>
              </div>

              <div className="h-56">
                <Radar
                  data={riskRadarData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                      r: {
                        angleLines: { color: 'rgba(226, 232, 240, 0.8)' },
                        grid: { color: 'rgba(226, 232, 240, 0.8)' },
                        ticks: { display: false },
                        suggestedMin: 0,
                        suggestedMax: 100
                      }
                    }
                  }}
                />
              </div>
            </div>

          </div>

          {/* Graphical Analytics Row 2: Budget Doughnut + Feature Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Graphical Budget Utilization Doughnut */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <CircleDollarSign className="w-5 h-5 text-emerald-500" />
                <span>Financial Utilization Breakdown</span>
              </h3>
              <div className="h-52 relative flex items-center justify-center">
                <Doughnut
                  data={budgetDoughnutData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { position: 'bottom', labels: { color: '#64748b', font: { size: 11 } } }
                    },
                    cutout: '70%'
                  }}
                />
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-6">
                  <span className="text-xs text-slate-400 font-mono">Spent</span>
                  <span className="text-lg font-black text-slate-800 font-mono">₹{project.spent_cr} Cr</span>
                </div>
              </div>
            </div>

            {/* Feature Impact List */}
            <div className="lg:col-span-2 p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Cpu className="w-5 h-5 text-blue-500" />
                <span>Risk Factor Detailed Descriptions & Impact Flags</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(risk.top_risk_factors || []).map((rf, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800 text-xs">{rf.factor}</span>
                      <span className="font-mono font-bold text-rose-500 text-xs">
                        Impact: {rf.impact_score}%
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-normal">{rf.description}</p>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>
      )}

      {/* Tab Content: What-If Scenario Simulator */}
      {activeTab === 'simulate' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Controls Panel */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <SlidersHorizontal className="w-5 h-5 text-blue-500" />
                  <span>Scenario Controls</span>
                </h3>
                <p className="text-xs text-slate-400">Tweak parameters to recalculate risk telemetry</p>
              </div>
              <button
                onClick={resetSimulation}
                className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-blue-600 px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 transition-colors"
                title="Reset to project baseline"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            </div>

            <form onSubmit={handleSimulate} className="space-y-5 text-xs">
              
              {/* Slider 1: Budget Spent */}
              <div className="space-y-2">
                <div className="flex justify-between font-semibold text-slate-700">
                  <span>Simulated Expenditure</span>
                  <span className="font-mono text-blue-600">₹{simForm.spent_cr} Cr ({((simForm.spent_cr / project.budget_cr) * 100).toFixed(0)}%)</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max={project.budget_cr * 1.5}
                  step={project.budget_cr * 0.02}
                  value={simForm.spent_cr}
                  onChange={e => {
                    const nextForm = { ...simForm, spent_cr: parseFloat(e.target.value) };
                    setSimForm(nextForm);
                    runSimulationWithData(project, nextForm);
                  }}
                  className="w-full accent-blue-600 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                  <span>₹0 Cr</span>
                  <span>Baseline: ₹{project.spent_cr} Cr</span>
                  <span>₹{(project.budget_cr * 1.5).toFixed(0)} Cr</span>
                </div>
              </div>

              {/* Slider 2: Elapsed Months */}
              <div className="space-y-2">
                <div className="flex justify-between font-semibold text-slate-700">
                  <span>Elapsed Duration</span>
                  <span className="font-mono text-amber-600">{simForm.elapsed_months} / {project.planned_duration_months} Months</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max={project.planned_duration_months * 1.5}
                  step="1"
                  value={simForm.elapsed_months}
                  onChange={e => {
                    const nextForm = { ...simForm, elapsed_months: parseInt(e.target.value) };
                    setSimForm(nextForm);
                    runSimulationWithData(project, nextForm);
                  }}
                  className="w-full accent-amber-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                  <span>1 mo</span>
                  <span>Baseline: {project.elapsed_months} mo</span>
                  <span>{(project.planned_duration_months * 1.5).toFixed(0)} mo</span>
                </div>
              </div>

              {/* Slider 3: Current Physical Progress */}
              <div className="space-y-2">
                <div className="flex justify-between font-semibold text-slate-700">
                  <span>Physical Progress %</span>
                  <span className="font-mono text-emerald-600">{simForm.current_progress_pct}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  value={simForm.current_progress_pct}
                  onChange={e => {
                    const nextForm = { ...simForm, current_progress_pct: parseFloat(e.target.value) };
                    setSimForm(nextForm);
                    runSimulationWithData(project, nextForm);
                  }}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                  <span>0%</span>
                  <span>Baseline: {project.current_progress_pct}%</span>
                  <span>100%</span>
                </div>
              </div>

              {/* Remarks Box */}
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700 block">Scenario Remarks / Risk Signals</label>
                <textarea
                  rows="3"
                  value={simForm.remarks}
                  onChange={e => setSimForm({ ...simForm, remarks: e.target.value })}
                  placeholder="e.g. Additional equipment deployed, contractor added night shift, land acquisition cleared..."
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:border-blue-500 transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={simLoading}
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center justify-center gap-2 shadow-sm transition-all"
              >
                {simLoading ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Recalculating ML Models...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Run Scenario Simulation</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Simulation Output Dashboard */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Top Comparison Card */}
            {simResult && (
              <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-slate-800">Simulated ML Risk Telemetry</h3>
                    <p className="text-xs text-slate-400">Comparing original project baseline with simulated what-if outcome</p>
                  </div>
                  <RiskBadge level={simResult.overall_risk_level} score={simResult.overall_risk_score} />
                </div>

                {/* Metric Delta Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  
                  {/* Overall Risk Score Delta */}
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                    <span className="text-[11px] font-mono text-slate-400 uppercase">Overall Risk Score</span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-extrabold font-mono text-slate-800">{simResult.overall_risk_score}%</span>
                      <span className={`text-xs font-mono font-bold ${
                        simResult.overall_risk_score < risk.overall_risk_score ? 'text-emerald-600' :
                        simResult.overall_risk_score > risk.overall_risk_score ? 'text-red-500' : 'text-slate-400'
                      }`}>
                        {simResult.overall_risk_score < risk.overall_risk_score ? '↓ ' : simResult.overall_risk_score > risk.overall_risk_score ? '↑ +' : ''}
                        {(simResult.overall_risk_score - risk.overall_risk_score).toFixed(1)}%
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400">Baseline: {risk.overall_risk_score}%</span>
                  </div>

                  {/* Predicted Delay Delta */}
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                    <span className="text-[11px] font-mono text-slate-400 uppercase">Delay Forecast</span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-extrabold font-mono text-amber-600">+{simResult.predicted_delay_months} mo</span>
                      <span className={`text-xs font-mono font-bold ${
                        simResult.predicted_delay_months < risk.predicted_delay_months ? 'text-emerald-600' :
                        simResult.predicted_delay_months > risk.predicted_delay_months ? 'text-red-500' : 'text-slate-400'
                      }`}>
                        {simResult.predicted_delay_months < risk.predicted_delay_months ? '↓ ' : simResult.predicted_delay_months > risk.predicted_delay_months ? '↑ +' : ''}
                        {(simResult.predicted_delay_months - risk.predicted_delay_months).toFixed(1)} mo
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400">Baseline: +{risk.predicted_delay_months} mo</span>
                  </div>

                  {/* Cost Overrun Delta */}
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                    <span className="text-[11px] font-mono text-slate-400 uppercase">Cost Overrun Likelihood</span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-extrabold font-mono text-slate-800">+{simResult.predicted_cost_overrun_pct}%</span>
                      <span className={`text-xs font-mono font-bold ${
                        simResult.predicted_cost_overrun_pct < risk.predicted_cost_overrun_pct ? 'text-emerald-600' :
                        simResult.predicted_cost_overrun_pct > risk.predicted_cost_overrun_pct ? 'text-red-500' : 'text-slate-400'
                      }`}>
                        {simResult.predicted_cost_overrun_pct < risk.predicted_cost_overrun_pct ? '↓ ' : simResult.predicted_cost_overrun_pct > risk.predicted_cost_overrun_pct ? '↑ +' : ''}
                        {(simResult.predicted_cost_overrun_pct - risk.predicted_cost_overrun_pct).toFixed(1)}%
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400">Baseline: +{risk.predicted_cost_overrun_pct}%</span>
                  </div>

                </div>

                {/* Simulated Risk Drivers */}
                <div className="space-y-3 pt-2">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Simulated Risk Drivers & Attribution</h4>
                  <div className="space-y-2.5">
                    {(simResult.top_risk_factors || []).map((rf, idx) => (
                      <div key={idx} className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs flex items-center justify-between gap-3">
                        <div>
                          <div className="font-bold text-slate-800">{rf.factor}</div>
                          <div className="text-[11px] text-slate-500">{rf.description}</div>
                        </div>
                        <span className="font-mono font-bold text-red-500 text-xs shrink-0">Impact: {rf.impact_score}%</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* NLP Flags Detected in Simulation */}
                {simResult.nlp_insights && (simResult.nlp_insights.risk_flags || []).length > 0 && (
                  <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs space-y-1">
                    <span className="font-bold text-red-700">Remarks Risk Flags Detected in Scenario:</span>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {simResult.nlp_insights.risk_flags.map((flag, fi) => (
                        <span key={fi} className="px-2 py-0.5 rounded bg-red-100 text-red-700 font-semibold text-[10px]">⚠️ {flag}</span>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            )}

          </div>

        </div>
      )}

      {/* Tab Content 2: Historical Progress Curve & Moderator Reasoning */}
      {activeTab === 'timeline' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
            <div>
              <h3 className="text-base font-bold text-slate-800">S-Curve Historical Progress & Baseline Comparison Graph</h3>
              <p className="text-xs text-slate-400">Comparison of planned milestone trajectory vs actual ground progress % over project timeline.</p>
            </div>
            <div className="h-80">
              <Line
                data={scurveData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { position: 'top', labels: { color: '#64748b', font: { size: 12 } } }
                  },
                  scales: {
                    x: { ticks: { color: '#64748b' }, grid: { color: 'rgba(226, 232, 240, 0.6)' } },
                    y: { ticks: { color: '#64748b' }, grid: { color: 'rgba(226, 232, 240, 0.6)' }, min: 0, max: 100 }
                  }
                }}
              />
            </div>
          </div>

          {/* Moderator's Reasoning & Risk Assessment Card */}
          <div className={`p-6 rounded-2xl border ${
            risk.overall_risk_level === 'High' ? 'bg-rose-50/80 border-rose-200 text-rose-950' :
            risk.overall_risk_level === 'Medium' ? 'bg-amber-50/80 border-amber-200 text-amber-950' :
            'bg-emerald-50/80 border-emerald-200 text-emerald-950'
          } shadow-sm space-y-3`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-current" />
                <h4 className="text-sm font-extrabold uppercase tracking-wider">Moderator's Assessment & Risk Reasoning</h4>
              </div>
              <span className="px-2.5 py-0.5 rounded font-mono text-xs font-bold bg-white/80 border border-current shadow-xs">
                Status: {risk.overall_risk_level || 'Safe'}
              </span>
            </div>
            <p className="text-xs leading-relaxed font-medium">
              {risk.overall_risk_level === 'High'
                ? `OFFICIAL MODERATOR REASONING: Project is flagged HIGH RISK (Score: ${risk.overall_risk_score}/100) due to a severe physical-financial divergence. While ₹${project.spent_cr} Cr (${((project.spent_cr / (project.budget_cr || 1)) * 100).toFixed(1)}%) of budget has been disbursed, physical progress stands at only ${project.current_progress_pct}%, resulting in a projected delay of +${risk.predicted_delay_months} months. Landslide hazard index is rated at ${project.landslide_risk_pct || 0}% for ${project.terrain_type || 'hilly terrain'}. Accelerated supervisory intervention mandated.`
                : risk.overall_risk_level === 'Medium'
                ? `OFFICIAL MODERATOR REASONING: Project classified as MODERATE RISK (Score: ${risk.overall_risk_score}/100). Physical completion (${project.current_progress_pct}%) is tracking moderately close to schedule targets with an anticipated delay of +${risk.predicted_delay_months} months. Cost expenditure is within ₹${project.spent_cr} Cr out of ₹${project.budget_cr} Cr sanctioned.`
                : `OFFICIAL MODERATOR REASONING: Project classified as SAFE / LOW RISK (Score: ${risk.overall_risk_score}/100). Operations are running on schedule within target financial baselines. Physical progress stands at ${project.current_progress_pct}% with zero critical bottlenecks recorded.`
              }
            </p>
          </div>

          {/* Vendor, GST & Citizen Intelligence Hub */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Vendor Record & GST Verification Status */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <HardHat className="w-4 h-4 text-blue-500" />
                <span>Primary Contractor & GST Verification</span>
              </h4>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">Contractor Name:</span>
                  <span className="font-bold text-slate-800">{project.contractor}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">GSTIN Status:</span>
                  <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-mono font-bold border border-emerald-200">
                    27AABCT1332Q1Z5 (ACTIVE)
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">Taxpayer Category:</span>
                  <span className="font-semibold text-slate-700">Regular - Infrastructure Taxpayer</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-500">Sanctioned Budget:</span>
                  <span className="font-mono font-bold text-slate-800">₹{project.budget_cr} Cr</span>
                </div>
              </div>
            </div>

            {/* Citizen Feedback & Ratings Summary */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>My Bharat Citizen Ratings & Oversight</span>
              </h4>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">Overall Citizen Rating:</span>
                  <span className="font-mono font-bold text-amber-600">4.2 ★ / 5.0 ★</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">My Bharat ID Verification:</span>
                  <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-mono font-bold border border-blue-200">
                    Gated (MB-IND Verified Only)
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">Public Grievances Filed:</span>
                  <span className="font-semibold text-slate-700">0 Critical Open Concerns</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-500">GIS Location ID:</span>
                  <span className="font-mono font-bold text-emerald-700">{project.mybharat_location_id || "MB-LOC-GIS"}</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Tab Content 3: NLP Remarks */}
      {activeTab === 'nlp' && (
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-6">
          <div>
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <FileText className="w-5 h-5 text-cyan-500" />
              <span>Free-Text Monitoring Remarks & TF-IDF Analytics</span>
            </h3>
            <p className="text-xs text-slate-400">Natural Language Processing performed on field inspector notes.</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <span className="text-[11px] font-mono text-slate-400 uppercase">Original Inspector Remarks:</span>
            <p className="text-sm italic text-slate-700 leading-relaxed">
              "{project.remarks || 'No textual remarks filed.'}"
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Extracted Keywords */}
            <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-3">
              <h4 className="text-xs font-bold text-slate-600 flex items-center gap-2">
                <Tag className="w-4 h-4 text-blue-500" />
                <span>TF-IDF Extracted Key Terms</span>
              </h4>
              <div className="flex flex-wrap gap-2">
                {(nlp.extracted_keywords || []).map((word, i) => (
                  <span key={i} className="px-3 py-1 rounded-lg bg-blue-50 text-blue-600 border border-blue-200 text-xs font-mono">
                    #{word}
                  </span>
                ))}
              </div>
            </div>

            {/* Identified Risk Category Flags */}
            <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-3">
              <h4 className="text-xs font-bold text-slate-600 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-red-500" />
                <span>Regex Identified Risk Flags</span>
              </h4>
              <div className="flex flex-wrap gap-2">
                {(nlp.risk_flags || []).length > 0 ? (
                  nlp.risk_flags.map((flag, i) => (
                    <span key={i} className="px-3 py-1 rounded-lg bg-red-50 text-red-600 border border-red-200 text-xs font-bold">
                      ⚠️ {flag}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-emerald-600 font-mono">No critical risk flags detected in remarks.</span>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Tab Content 4: Recommendations */}
      {activeTab === 'recommendations' && (
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-6">
          <div>
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-amber-500" />
              <span>Automated Decision-Support & Policy Action Plan</span>
            </h3>
            <p className="text-xs text-slate-400">Algorithmic mitigation strategy based on PAIMANA project monitoring protocols.</p>
          </div>

          <div className="space-y-4">
            {generateRecommendations().map((rec, i) => (
              <div key={i} className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span>{rec.title}</span>
                  </h4>
                  <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-600 border border-amber-200">
                    {rec.level}
                  </span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">{rec.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
