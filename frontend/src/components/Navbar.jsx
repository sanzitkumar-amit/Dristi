import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, FolderKanban, Bell, Upload, ShieldCheck, LogIn, LogOut, UserCircle, Database } from 'lucide-react';
import axios from 'axios';
import DrishtiLogo from './DrishtiLogo';
import LanguageSelector from './LanguageSelector';
import GovTopBar from './GovTopBar';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const { user, isLoggedIn, logout } = useAuth();
  const [unreadAlertsCount, setUnreadAlertsCount] = useState(0);

  useEffect(() => {
    fetchUnreadAlerts();
    const interval = setInterval(fetchUnreadAlerts, 15000);
    return () => clearInterval(interval);
  }, []);

  const fetchUnreadAlerts = async () => {
    try {
      const res = await axios.get('/api/alerts?is_read=false');
      setUnreadAlertsCount(res.data.length);
    } catch (err) {
      console.error("Failed to fetch alert count:", err);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navLinks = [
    { path: '/', label: t('navDashboard', 'Dashboard'), icon: LayoutDashboard },
    { path: '/projects', label: t('navProjects', 'Projects'), icon: FolderKanban },
    { path: '/transparency', label: t('navTransparency', 'Civic Transparency'), icon: ShieldCheck },
    { path: '/alerts', label: t('navAlerts', 'Alerts'), icon: Bell, badge: unreadAlertsCount },
    { path: '/upload', label: t('navUpload', 'Data Ingestion'), icon: Upload },
    { path: '/data-sync', label: t('navDataSync', 'Data Sync'), icon: Database },
  ];

  const roleBadge = () => {
    if (!isLoggedIn || !user) return null;
    const configs = {
      government: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', label: `🏛️ ${user.name?.split(',')[0] || 'Govt Official'}` },
      vendor: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', label: `🏢 GST: ${user.gstin || 'Verified'}` },
      citizen: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', label: `🇮🇳 MB: ${user.myBharatId || 'Citizen'}` },
    };
    const cfg = configs[user.role] || configs.government;
    return (
      <span className={`hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-lg ${cfg.bg} ${cfg.text} border ${cfg.border} text-[11px] font-semibold`}>
        {cfg.label}
      </span>
    );
  };

  return (
    <header className="sticky top-0 z-50 shadow-sm">
      {/* ── Top Official Government & Accessibility Ribbon ── */}
      <GovTopBar />

      {/* ── Main Navigation Header ── */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-[64px]">
            
            {/* Brand Title */}
            <Link to="/" className="flex items-center gap-3 group">
              <div className="relative p-1 rounded-xl border border-slate-200 bg-white shadow-xs group-hover:border-blue-400 transition-all">
                <DrishtiLogo className="w-10 h-10" rounded="rounded-lg" />
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-extrabold tracking-wider text-slate-800">
                    {t('brandName', 'DRISHTI')}
                  </span>
                  <span className="px-2 py-0.5 text-[10px] font-mono font-semibold bg-blue-50 text-blue-600 border border-blue-200 rounded tracking-wider">
                    PAIMANA
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-medium tracking-tight hidden sm:block">
                  {t('brandTagline', 'Project Risk & Delay Intelligence System')}
                </p>
              </div>
            </Link>

            {/* Navigation Tabs */}
            <nav className="hidden md:flex items-center space-x-1">
              {navLinks.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50 border border-transparent'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                    {item.badge !== undefined && item.badge > 0 && (
                      <span className="ml-1 px-1.5 py-0.5 text-[10px] font-bold bg-red-500 text-white rounded-full leading-none">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* Right Controls */}
            <div className="flex items-center gap-2.5">
              {/* Role Badge */}
              {roleBadge()}

              {/* Language Selector */}
              <LanguageSelector />

              {/* Status Indicator */}
              <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-full text-xs text-emerald-700">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="font-mono text-[11px] font-semibold">{t('engineActive', 'ML Engine Active')}</span>
              </div>

              {/* Login / Logout */}
              {isLoggedIn ? (
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-600 border border-slate-200 hover:border-red-200 text-xs font-semibold transition-all"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              ) : (
                <Link
                  to="/login"
                  className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-all active:scale-95"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{t('loginBtn', 'Login / Register')}</span>
                </Link>
              )}
            </div>

          </div>
        </div>
      </div>
    </header>
  );
}
