import React from 'react';
import { AlertTriangle, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function RiskBadge({ level, score, showScore = true }) {
  const { t } = useLanguage();
  const normalizedLevel = (level || 'low').toLowerCase();

  if (normalizedLevel === 'high') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold badge-high">
        <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
        <span>{t('badgeHighRisk', 'HIGH RISK')}</span>
        {showScore && score !== undefined && (
          <span className="ml-1 pl-1 border-l border-red-300 font-mono">
            {score.toFixed(1)}%
          </span>
        )}
      </span>
    );
  }

  if (normalizedLevel === 'medium') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold badge-medium">
        <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
        <span>{t('badgeMediumRisk', 'MEDIUM RISK')}</span>
        {showScore && score !== undefined && (
          <span className="ml-1 pl-1 border-l border-amber-300 font-mono">
            {score.toFixed(1)}%
          </span>
        )}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold badge-low">
      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
      <span>{t('badgeLowRisk', 'LOW RISK')}</span>
      {showScore && score !== undefined && (
        <span className="ml-1 pl-1 border-l border-emerald-300 font-mono">
          {score.toFixed(1)}%
        </span>
      )}
    </span>
  );
}
