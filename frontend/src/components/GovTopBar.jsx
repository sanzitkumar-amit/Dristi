import React, { useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function GovTopBar() {
  const { language } = useLanguage();
  const [fontSize, setFontSize] = useState('normal');

  const handleFontSize = (size) => {
    setFontSize(size);
    const root = document.documentElement;
    if (size === 'small') {
      root.style.fontSize = '14px';
    } else if (size === 'large') {
      root.style.fontSize = '18px';
    } else {
      root.style.fontSize = '16px';
    }
  };

  return (
    <div className="w-full bg-white border-b border-slate-200 text-slate-600 select-none text-[11px] font-sans">
      {/* ── National Tricolor Stripe ── */}
      <div className="h-[3px] w-full bg-gradient-to-r from-[#ff9933] via-[#ffffff] to-[#138808]"></div>

      {/* ── Official Government Header Bar ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-1.5 flex flex-wrap items-center justify-between gap-2">
        {/* Left: Ministry & Government of India */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-base">🏛️</span>
            <div className="flex items-center gap-1.5 text-xs">
              <span className="font-semibold text-slate-700 tracking-wide">
                {language === 'hi' ? 'भारत सरकार' : language === 'bn' ? 'ভারত সরকার' : 'GOVERNMENT OF INDIA'}
              </span>
              <span className="text-slate-300">|</span>
              <span className="text-slate-500 hidden md:inline font-medium">
                {language === 'hi' ? 'सांख्यिकी एवं कार्यक्रम कार्यान्वयन मंत्रालय (MoSPI)' : 
                 language === 'bn' ? 'পরিসংখ্যান ও কর্মসূচি বাস্তবায়ন মন্ত্রণালয় (MoSPI)' : 
                 'Ministry of Statistics & Programme Implementation (MoSPI)'}
              </span>
            </div>
          </div>

          <span className="hidden lg:inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-50 text-blue-600 border border-blue-200 text-[10px] font-mono font-medium">
            <ShieldCheck className="w-3 h-3" /> PAIMANA / OCMS
          </span>
        </div>

        {/* Right: Accessibility & Official Portal Tools */}
        <div className="flex items-center gap-3 text-[11px] text-slate-400">
          {/* Skip to Main */}
          <a href="#main-content" className="hover:text-blue-600 transition-colors hidden sm:inline text-slate-500">
            Skip to Main Content
          </a>
          <span className="text-slate-300 hidden sm:inline">•</span>

          {/* Text Sizing Controls */}
          <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 font-mono text-slate-500">
            <button
              onClick={() => handleFontSize('small')}
              title="Decrease Font Size"
              className={`px-1 rounded hover:text-slate-800 ${fontSize === 'small' ? 'text-blue-600 font-bold' : ''}`}
            >
              A-
            </button>
            <span className="text-slate-300">|</span>
            <button
              onClick={() => handleFontSize('normal')}
              title="Normal Font Size"
              className={`px-1 rounded hover:text-slate-800 ${fontSize === 'normal' ? 'text-blue-600 font-bold' : ''}`}
            >
              A
            </button>
            <span className="text-slate-300">|</span>
            <button
              onClick={() => handleFontSize('large')}
              title="Increase Font Size"
              className={`px-1 rounded hover:text-slate-800 ${fontSize === 'large' ? 'text-blue-600 font-bold' : ''}`}
            >
              A+
            </button>
          </div>

          <span className="text-slate-300">•</span>

          {/* Security & Official Compliance Tag */}
          <div className="flex items-center gap-1.5 text-[10px] text-emerald-600 font-mono font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>GIGW 3.0 / NIC Verified ✓</span>
          </div>
        </div>
      </div>
    </div>
  );
}
