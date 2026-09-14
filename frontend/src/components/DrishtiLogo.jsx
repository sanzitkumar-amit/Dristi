import React from 'react';
import logoImg from '../assets/drishti-logo.png';

export default function DrishtiLogo({ className = "w-10 h-10", rounded = "rounded-lg" }) {
  return (
    <div className={`relative overflow-hidden shrink-0 ${rounded} ${className} bg-white transition-transform duration-300 group-hover:scale-105 flex items-center justify-center`}>
      <img
        src={logoImg}
        alt="DRISHTI Logo"
        className="w-full h-full object-contain select-none"
        loading="eager"
      />
    </div>
  );
}
