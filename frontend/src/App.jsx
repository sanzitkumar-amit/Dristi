import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import ProjectsList from './pages/ProjectsList';
import ProjectDetail from './pages/ProjectDetail';
import AlertsPage from './pages/AlertsPage';
import UploadPage from './pages/UploadPage';
import TransparencyPortal from './pages/TransparencyPortal';
import CivicProjectDetail from './pages/CivicProjectDetail';
import DataSyncPage from './pages/DataSyncPage';
import LoginPage from './pages/LoginPage';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { AuthProvider, useAuth } from './context/AuthContext';

function Footer() {
  const { t, language } = useLanguage();
  return (
    <footer className="border-t border-slate-200 bg-white text-slate-500 text-xs font-sans mt-16 select-none">
      {/* Institutional Links Strip */}
      <div className="border-b border-slate-100 py-6 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-6 text-[12px]">
          <div>
            <h5 className="font-bold text-slate-700 uppercase tracking-wider mb-2.5 text-[11px]">
              {language === 'hi' ? 'मंत्रालय एवं निकाय' : language === 'bn' ? 'মন্ত্রণালয় ও সংস্থা' : 'Ministries & Portals'}
            </h5>
            <ul className="space-y-1.5 text-slate-400">
              <li><a href="https://www.mospi.gov.in" target="_blank" rel="noreferrer" className="hover:text-blue-600 transition-colors">MoSPI Official Portal ↗</a></li>
              <li><a href="https://paimanaprojects.nic.in" target="_blank" rel="noreferrer" className="hover:text-blue-600 transition-colors">PAIMANA / OCMS ↗</a></li>
              <li><a href="https://pmgatishakti.gov.in" target="_blank" rel="noreferrer" className="hover:text-blue-600 transition-colors">PM GatiShakti National Portal ↗</a></li>
              <li><a href="https://gem.gov.in" target="_blank" rel="noreferrer" className="hover:text-blue-600 transition-colors">Government e-Marketplace (GeM) ↗</a></li>
            </ul>
          </div>
          <div>
            <h5 className="font-bold text-slate-700 uppercase tracking-wider mb-2.5 text-[11px]">
              {language === 'hi' ? 'दृष्टि एआई एवं निर्णय' : language === 'bn' ? 'দৃষ্টি এআই ও সিদ্ধান্ত' : 'DRISHTI ML & Decision'}
            </h5>
            <ul className="space-y-1.5 text-slate-400">
              <li><span className="text-slate-500">Random Forest Classifier (v1.0)</span></li>
              <li><span className="text-slate-500">Multi-Linear Delay Forecasting</span></li>
              <li><span className="text-slate-500">TF-IDF Remarks Mining Engine</span></li>
              <li><span className="text-slate-500">Explainable AI (XAI) Attribution</span></li>
            </ul>
          </div>
          <div>
            <h5 className="font-bold text-slate-700 uppercase tracking-wider mb-2.5 text-[11px]">
              {language === 'hi' ? 'नागरिक एवं पारदर्शिता' : language === 'bn' ? 'নাগরিক ও স্বচ্ছতা' : 'Civic Transparency'}
            </h5>
            <ul className="space-y-1.5 text-slate-400">
              <li><span className="text-slate-500">Public Tender Oversight</span></li>
              <li><span className="text-slate-500">Auditor Milestone Stamps</span></li>
              <li><span className="text-slate-500">Vendor Bidding Benchmarks</span></li>
              <li><span className="text-slate-500">Community Trust Index (CTI)</span></li>
            </ul>
          </div>
          <div>
            <h5 className="font-bold text-slate-700 uppercase tracking-wider mb-2.5 text-[11px]">
              {language === 'hi' ? 'नीति एवं दिशानिर्देश' : language === 'bn' ? 'নীতি ও নির্দেশিকা' : 'Policies & Compliance'}
            </h5>
            <ul className="space-y-1.5 text-slate-400">
              <li><a href="#terms" className="hover:text-blue-600 transition-colors">Terms of Service</a></li>
              <li><a href="#privacy" className="hover:text-blue-600 transition-colors">Privacy Policy</a></li>
              <li><a href="#hyperlink" className="hover:text-blue-600 transition-colors">Hyperlink Policy</a></li>
              <li><a href="#accessibility" className="hover:text-blue-600 transition-colors">Accessibility Statement</a></li>
            </ul>
          </div>
          <div className="col-span-2 sm:col-span-4 lg:col-span-1">
            <h5 className="font-bold text-slate-700 uppercase tracking-wider mb-2.5 text-[11px]">
              {language === 'hi' ? 'सुरक्षा एवं प्रमाणीकरण' : language === 'bn' ? 'নিরাপত্তা ও প্রমাণীকরণ' : 'Security & Standards'}
            </h5>
            <div className="space-y-2 text-[11px]">
              <div className="p-2 rounded bg-emerald-50 border border-emerald-200 text-emerald-700 font-mono flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> GIGW 3.0 Certified
              </div>
              <div className="p-2 rounded bg-blue-50 border border-blue-200 text-blue-700 font-mono flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span> W3C WAI-AA Compliant
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Legal & NIC Attribution */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-3 text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="space-y-1 text-slate-400 text-[11px]">
          <p className="font-medium text-slate-500">
            {language === 'hi' ? 'यह पोर्टल सांख्यिकी एवं कार्यक्रम कार्यान्वयन मंत्रालय (MoSPI), भारत सरकार के लिए विकसित किया गया है।' :
             language === 'bn' ? 'এই পোর্টালটি পরিসংখ্যান ও কর্মসূচি বাস্তবায়ন মন্ত্রণালয় (MoSPI), ভারত সরকারের জন্য তৈরি করা হয়েছে।' :
             'This portal is designed, developed and hosted for PAIMANA / Ministry of Statistics & Programme Implementation (MoSPI), Government of India.'}
          </p>
          <p className="text-slate-400 font-mono">
            DRISHTI ML Platform (v1.0) · Project Risk & Delay Early-Warning Telemetry · Last Updated: 2026
          </p>
        </div>

        <div className="flex items-center gap-3 text-[11px] font-mono text-slate-500">
          <span className="px-2.5 py-1 rounded bg-blue-50 border border-blue-200 text-blue-600 font-semibold">
            🇮🇳 Digital India
          </span>
          <span className="px-2.5 py-1 rounded bg-slate-100 border border-slate-200 text-slate-600 font-semibold">
            NIC / MoSPI
          </span>
        </div>
      </div>

      {/* National Tricolor Bottom Accent */}
      <div className="h-[3px] w-full bg-gradient-to-r from-[#ff9933] via-[#ffffff] to-[#138808]"></div>
    </footer>
  );
}

function AppLayout() {
  const location = useLocation();
  const { isLoggedIn } = useAuth();
  const isLoginPage = location.pathname === '/login';

  // If not logged in, force login page first to access the web portal
  if (!isLoggedIn || isLoginPage) {
    return (
      <Routes>
        <Route path="*" element={<LoginPage />} />
      </Routes>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans selection:bg-blue-500 selection:text-white">
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/projects" element={<ProjectsList />} />
          <Route path="/projects/:id" element={<ProjectDetail />} />
          <Route path="/transparency" element={<TransparencyPortal />} />
          <Route path="/transparency/project/:id" element={<CivicProjectDetail />} />
          <Route path="/alerts" element={<AlertsPage />} />
          <Route path="/upload" element={<UploadPage />} />
          <Route path="/data-sync" element={<DataSyncPage />} />
          <Route path="*" element={<Dashboard />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <Router>
          <AppLayout />
        </Router>
      </AuthProvider>
    </LanguageProvider>
  );
}
