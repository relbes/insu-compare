import React, { useState } from 'react';
import { 
  HelpCircle, 
  ChevronDown, 
  ChevronUp, 
  CheckCircle2
} from 'lucide-react';
import { useI18n } from '../i18n/I18nContext';

interface ClarificationQABoxProps {
  onApplyScoringPreset?: (mode: string) => void;
}

export const ClarificationQABox: React.FC<ClarificationQABoxProps> = () => {
  const { t } = useI18n();
  const [isOpen, setIsOpen] = useState(false);

  const questions = [
    {
      id: 1,
      title: t('q1Title'),
      defaultAnswer: t('q1Answer'),
      explanation: t('q1Explanation')
    },
    {
      id: 2,
      title: t('q2Title'),
      defaultAnswer: t('q2Answer'),
      explanation: t('q2Explanation')
    },
    {
      id: 3,
      title: t('q3Title'),
      defaultAnswer: t('q3Answer'),
      explanation: t('q3Explanation')
    },
    {
      id: 4,
      title: t('q4Title'),
      defaultAnswer: t('q4Answer'),
      explanation: t('q4Explanation')
    }
  ];

  return (
    <div className="bg-gradient-to-r from-sky-50 via-indigo-50/40 to-white border border-sky-200/80 rounded-2xl p-4 sm:p-5 shadow-xs mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-600 text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5">
            <HelpCircle className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm sm:text-base font-bold text-slate-900">
                {t('qaBoxTitle')}
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-sky-100 text-sky-800 border border-sky-200 whitespace-nowrap">
                {t('strictCappingActive')}
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-1 max-w-3xl leading-relaxed">
              {t('qaBoxIntro')}
            </p>
          </div>
        </div>

        <button
          id="btn-toggle-qa-box"
          onClick={() => setIsOpen(!isOpen)}
          className="h-9 inline-flex items-center justify-center gap-1.5 px-3.5 rounded-xl text-xs font-bold text-sky-800 hover:text-sky-950 bg-white hover:bg-sky-50 border border-sky-200 shrink-0 transition-colors cursor-pointer shadow-2xs whitespace-nowrap self-start sm:self-center"
        >
          <span>{isOpen ? t('collapseDetails') : t('viewClarifications')}</span>
          {isOpen ? <ChevronUp className="w-4 h-4 text-sky-600 shrink-0" /> : <ChevronDown className="w-4 h-4 text-sky-600 shrink-0" />}
        </button>
      </div>

      {isOpen && (
        <div className="mt-4 pt-4 border-t border-sky-200/60 grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
          {questions.map((q) => (
            <div 
              key={q.id}
              className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-2xs hover:border-sky-300 transition-all"
            >
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-bold text-slate-900">{q.title}</h4>
                  <div className="mt-1 inline-block px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 text-[11px] font-semibold border border-emerald-200">
                    {q.defaultAnswer}
                  </div>
                  <p className="text-[11px] text-slate-600 mt-1.5 leading-relaxed">
                    {q.explanation}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

