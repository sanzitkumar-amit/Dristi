import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck, Building2, Users, ChevronRight, Eye, EyeOff,
  BadgeCheck, Fingerprint, Landmark, KeyRound, CheckCircle2, AlertCircle, Loader2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import DrishtiLogo from '../components/DrishtiLogo';

const TABS = [
  { key: 'government', label: 'Government Official', icon: Landmark, color: 'blue' },
  { key: 'vendor', label: 'Vendor / Contractor', icon: Building2, color: 'emerald' },
  { key: 'citizen', label: 'Citizen Oversight', icon: Users, color: 'amber' },
];

export default function LoginPage() {
  const { login, verifyGSTIN, verifyMyBharatId, demoAccounts } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('government');
  const [isLoading, setIsLoading] = useState(false);

  // Government state
  const [govMinistry, setGovMinistry] = useState('MoSPI');
  const [govOfficerName, setGovOfficerName] = useState('');
  const [govShowOtp, setGovShowOtp] = useState(false);
  const [govOtp, setGovOtp] = useState('');

  // Vendor state
  const [vendorGstin, setVendorGstin] = useState('');
  const [vendorCompany, setVendorCompany] = useState('');
  const [vendorEmail, setVendorEmail] = useState('');
  const [gstResult, setGstResult] = useState(null);

  // Citizen state
  const [citizenName, setCitizenName] = useState('');
  const [citizenMyBharatId, setCitizenMyBharatId] = useState('');
  const [mbResult, setMbResult] = useState(null);

  const [error, setError] = useState('');

  const handleDemoLogin = (role) => {
    setIsLoading(true);
    setTimeout(() => {
      login(role);
      setIsLoading(false);
      navigate('/');
    }, 800);
  };

  const handleGovLogin = (e) => {
    e.preventDefault();
    setError('');
    if (!govOfficerName.trim()) { setError('Please enter officer name'); return; }
    if (!govShowOtp) {
      setGovShowOtp(true);
      return;
    }
    if (govOtp.length < 4) { setError('Please enter valid OTP'); return; }
    setIsLoading(true);
    setTimeout(() => {
      login('government', { name: govOfficerName, ministry: govMinistry });
      setIsLoading(false);
      navigate('/');
    }, 1000);
  };

  const handleVendorLogin = (e) => {
    e.preventDefault();
    setError('');
    if (!vendorGstin.trim()) { setError('Please enter GSTIN'); return; }
    const result = verifyGSTIN(vendorGstin);
    if (!result.valid) { setError(result.error); setGstResult(null); return; }
    setGstResult(result.data);
    if (!vendorCompany.trim() || !vendorEmail.trim()) { setError('Please fill all vendor details'); return; }
    setIsLoading(true);
    setTimeout(() => {
      login('vendor', { name: vendorCompany, gstin: vendorGstin, contactEmail: vendorEmail, ...result.data });
      setIsLoading(false);
      navigate('/');
    }, 1000);
  };

  const handleCitizenLogin = (e) => {
    e.preventDefault();
    setError('');
    if (!citizenMyBharatId.trim()) { setError('Please enter My Bharat ID'); return; }
    const result = verifyMyBharatId(citizenMyBharatId);
    if (!result.valid) { setError(result.error); setMbResult(null); return; }
    setMbResult(result.data);
    if (!citizenName.trim()) { setError('Please enter your full name'); return; }
    setIsLoading(true);
    setTimeout(() => {
      login('citizen', { name: citizenName, myBharatId: citizenMyBharatId, ...result.data });
      setIsLoading(false);
      navigate('/');
    }, 1000);
  };

  const tabColors = {
    government: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', activeBg: 'bg-blue-600', hoverBg: 'hover:bg-blue-50' },
    vendor: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', activeBg: 'bg-emerald-600', hoverBg: 'hover:bg-emerald-50' },
    citizen: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', activeBg: 'bg-amber-600', hoverBg: 'hover:bg-amber-50' },
  };

  const tc = tabColors[activeTab];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100 flex flex-col">
      {/* ── Top National Tricolor ── */}
      <div className="h-[3px] w-full bg-gradient-to-r from-[#ff9933] via-[#ffffff] to-[#138808]"></div>

      {/* ── Top Ribbon ── */}
      <div className="bg-white border-b border-slate-200 py-2 px-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center gap-2">
            <span className="text-base">🏛️</span>
            <span className="font-semibold text-slate-700">GOVERNMENT OF INDIA</span>
            <span className="text-slate-300">|</span>
            <span className="hidden sm:inline">Ministry of Statistics & Programme Implementation</span>
          </div>
          <div className="flex items-center gap-1.5 text-emerald-600 font-mono text-[10px]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            GIGW 3.0 Certified ✓
          </div>
        </div>
      </div>

      {/* ── Login Card ── */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-lg">
          {/* Brand Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="p-2 rounded-2xl border border-slate-200 bg-white shadow-sm">
                <DrishtiLogo className="w-16 h-16" rounded="rounded-xl" />
              </div>
            </div>
            <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">DRISHTI Portal</h1>
            <p className="text-sm text-slate-500 mt-1.5">
              {t('loginSubtitle', 'Project Risk & Delay Intelligence System — PAIMANA / OCMS')}
            </p>
          </div>

          {/* Tab Selector */}
          <div className="flex bg-white rounded-xl border border-slate-200 shadow-sm p-1 mb-6 gap-1">
            {TABS.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => { setActiveTab(key); setError(''); setGstResult(null); setMbResult(null); setGovShowOtp(false); }}
                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === key
                    ? `${tabColors[key].activeBg} text-white shadow-sm`
                    : 'text-slate-500 hover:bg-slate-50'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </div>

          {/* Login Form Card */}
          <div className={`bg-white rounded-2xl border ${tc.border} shadow-sm p-6 sm:p-8 space-y-5`}>
            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* ──────── GOVERNMENT TAB ──────── */}
            {activeTab === 'government' && (
              <form onSubmit={handleGovLogin} className="space-y-4">
                <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${tc.bg} ${tc.text} text-xs font-medium`}>
                  <Landmark className="w-4 h-4" />
                  NIC / Parichay Single Sign-On (SSO)
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Officer Name</label>
                  <input
                    type="text" value={govOfficerName} onChange={e => setGovOfficerName(e.target.value)}
                    placeholder="Dr. Rajeev Kumar Sharma, IAS"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-sm focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Ministry / Department</label>
                  <select
                    value={govMinistry} onChange={e => setGovMinistry(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-sm focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all bg-white"
                  >
                    <option value="MoSPI">MoSPI — Statistics & Programme Implementation</option>
                    <option value="MoRTH">MoRTH — Road Transport & Highways</option>
                    <option value="MoUD">MoUD — Urban Development</option>
                    <option value="MoWR">MoWR — Water Resources</option>
                    <option value="MoRE">MoRE — Renewable Energy</option>
                    <option value="MoH">MoH — Health & Family Welfare</option>
                  </select>
                </div>

                {govShowOtp && (
                  <div className="animate-in slide-in-from-top">
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                      <KeyRound className="w-3.5 h-3.5 inline mr-1" />
                      2FA OTP Verification
                    </label>
                    <input
                      type="text" maxLength={6} value={govOtp} onChange={e => setGovOtp(e.target.value.replace(/\D/g, ''))}
                      placeholder="Enter 6-digit OTP"
                      className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-sm font-mono tracking-[0.3em] text-center focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">OTP sent to registered Parichay mobile number. For demo, enter any 6 digits.</p>
                  </div>
                )}

                <button
                  type="submit" disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold shadow-sm transition-all active:scale-[0.98] disabled:opacity-60"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                  {govShowOtp ? 'Verify & Login' : 'Proceed to OTP Verification'}
                </button>

                <div className="relative py-2">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200"></div></div>
                  <div className="relative flex justify-center"><span className="bg-white px-3 text-[10px] text-slate-400 uppercase tracking-wider">Quick Demo</span></div>
                </div>

                <button
                  type="button" onClick={() => handleDemoLogin('government')} disabled={isLoading}
                  className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg ${tc.bg} ${tc.text} border ${tc.border} text-xs font-semibold transition-all hover:opacity-80`}
                >
                  <Fingerprint className="w-4 h-4" />
                  1-Click Demo: Joint Secretary (MoSPI)
                </button>
              </form>
            )}

            {/* ──────── VENDOR TAB ──────── */}
            {activeTab === 'vendor' && (
              <form onSubmit={handleVendorLogin} className="space-y-4">
                <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${tc.bg} ${tc.text} text-xs font-medium`}>
                  <Building2 className="w-4 h-4" />
                  GST Portal Verification Gateway
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">GSTIN (15-digit)</label>
                  <input
                    type="text" value={vendorGstin} onChange={e => setVendorGstin(e.target.value.toUpperCase())}
                    placeholder="e.g. 27AABCT1332Q1Z5" maxLength={15}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-sm font-mono tracking-wider focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none transition-all"
                  />
                </div>

                {gstResult && (
                  <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs space-y-1.5 animate-in slide-in-from-top">
                    <div className="flex items-center gap-1.5 text-emerald-700 font-semibold">
                      <CheckCircle2 className="w-4 h-4" /> GST Verification Successful
                    </div>
                    <div className="grid grid-cols-2 gap-1.5 text-slate-600">
                      <span>Legal Name:</span><span className="font-medium">{gstResult.gstLegalName}</span>
                      <span>Status:</span><span className="font-mono text-emerald-600">{gstResult.gstStatus}</span>
                      <span>Taxpayer Type:</span><span>{gstResult.taxpayerType}</span>
                      <span>State Code:</span><span className="font-mono">{gstResult.stateCode}</span>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Company / Firm Name</label>
                  <input
                    type="text" value={vendorCompany} onChange={e => setVendorCompany(e.target.value)}
                    placeholder="Tata Projects Ltd."
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-sm focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Contact Email</label>
                  <input
                    type="email" value={vendorEmail} onChange={e => setVendorEmail(e.target.value)}
                    placeholder="tenders@company.com"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-sm focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none transition-all"
                  />
                </div>

                <button
                  type="submit" disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold shadow-sm transition-all active:scale-[0.98] disabled:opacity-60"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <BadgeCheck className="w-4 h-4" />}
                  Verify GSTIN & Login
                </button>

                <div className="relative py-2">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200"></div></div>
                  <div className="relative flex justify-center"><span className="bg-white px-3 text-[10px] text-slate-400 uppercase tracking-wider">Quick Demo</span></div>
                </div>

                <button
                  type="button" onClick={() => handleDemoLogin('vendor')} disabled={isLoading}
                  className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg ${tc.bg} ${tc.text} border ${tc.border} text-xs font-semibold transition-all hover:opacity-80`}
                >
                  <Fingerprint className="w-4 h-4" />
                  1-Click Demo: L&T Infrastructure (GSTIN Verified)
                </button>
              </form>
            )}

            {/* ──────── CITIZEN TAB ──────── */}
            {activeTab === 'citizen' && (
              <form onSubmit={handleCitizenLogin} className="space-y-4">
                <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${tc.bg} ${tc.text} text-xs font-medium`}>
                  <Users className="w-4 h-4" />
                  My Bharat / Meri Pehchan Citizen Portal
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">My Bharat ID</label>
                  <input
                    type="text" value={citizenMyBharatId} onChange={e => setCitizenMyBharatId(e.target.value)}
                    placeholder="MB-IND-2026-784920"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-sm font-mono tracking-wider focus:border-amber-400 focus:ring-2 focus:ring-amber-100 outline-none transition-all"
                  />
                </div>

                {mbResult && (
                  <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs space-y-1.5 animate-in slide-in-from-top">
                    <div className="flex items-center gap-1.5 text-amber-700 font-semibold">
                      <CheckCircle2 className="w-4 h-4" /> My Bharat ID Verified
                    </div>
                    <div className="text-slate-600">
                      <span>ID: </span><span className="font-mono font-medium">{mbResult.myBharatId}</span>
                      <span className="ml-2">Verified: </span><span className="text-emerald-600">✓ DigiLocker</span>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Full Name</label>
                  <input
                    type="text" value={citizenName} onChange={e => setCitizenName(e.target.value)}
                    placeholder="Ananya Deshmukh"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-sm focus:border-amber-400 focus:ring-2 focus:ring-amber-100 outline-none transition-all"
                  />
                </div>

                <button
                  type="submit" disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-sm font-bold shadow-sm transition-all active:scale-[0.98] disabled:opacity-60"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <BadgeCheck className="w-4 h-4" />}
                  Verify My Bharat ID & Login
                </button>

                <div className="relative py-2">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200"></div></div>
                  <div className="relative flex justify-center"><span className="bg-white px-3 text-[10px] text-slate-400 uppercase tracking-wider">Quick Demo</span></div>
                </div>

                <button
                  type="button" onClick={() => handleDemoLogin('citizen')} disabled={isLoading}
                  className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg ${tc.bg} ${tc.text} border ${tc.border} text-xs font-semibold transition-all hover:opacity-80`}
                >
                  <Fingerprint className="w-4 h-4" />
                  1-Click Demo: My Bharat Citizen (Verified)
                </button>
              </form>
            )}
          </div>

          {/* Footer Security Note */}
          <div className="mt-6 text-center text-[10px] text-slate-400 font-mono space-y-1">
            <p>🔒 Secured by NIC PKI • GIGW 3.0 Compliant • S3WaaS Hosted</p>
            <p>DRISHTI ML Platform v1.0 · PAIMANA / MoSPI · Government of India</p>
          </div>
        </div>
      </div>

      {/* ── Bottom Tricolor ── */}
      <div className="h-[3px] w-full bg-gradient-to-r from-[#ff9933] via-[#ffffff] to-[#138808]"></div>
    </div>
  );
}
