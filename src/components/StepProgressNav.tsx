import React, { useState } from 'react';
import { 
  CheckCircle2, 
  FileSpreadsheet,
  FileText, 
  Sparkles,
  CheckSquare,
  Building2, 
  BarChart3,
  Calculator,
  Lock,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  HelpCircle,
  ChevronRight,
  ShieldCheck,
  Compass,
  Award
} from 'lucide-react';
import { useI18n } from '../i18n/I18nContext';
import { getStepDefinitions, checkStepNavigation } from '../utils/stepGuard';

interface StepProgressNavProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  excelCount: number;
  requirementsCount: number;
  proposalsCount: number;
  hasConditions: boolean;
  totalMembers?: number;
}

export const StepProgressNav: React.FC<StepProgressNavProps> = ({
  currentTab,
  onSelectTab,
  excelCount,
  requirementsCount,
  proposalsCount,
  hasConditions,
  totalMembers = 256
}) => {
  const { isRtl } = useI18n();
  const [lockedNotice, setLockedNotice] = useState<{
    stepTitle: string;
    reason: string;
    targetStepId?: string;
    targetStepName?: string;
  } | null>(null);

  // Compute step definitions using strict guardrail rules
  const steps = getStepDefinitions({
    excelCount,
    hasConditions,
    requirementsCount,
    proposalsCount
  });

  // Assign appropriate icon to each step
  const iconMap: Record<string, React.FC<{ className?: string }>> = {
    step1_excel: FileSpreadsheet,
    step2_rfp: FileText,
    step3_binding: Sparkles,
    step4_review: CheckSquare,
    step5_proposals: Building2,
    step_actuarial: Calculator,
    step6_tradeoff_matrix: BarChart3,
    step_reports: Award
  };

  // Map normalized current tab to step ID
  const normalizedCurrentTab = 
    currentTab === 'requirements' ? 'step4_review' :
    currentTab === 'proposals' ? 'step5_proposals' :
    currentTab === 'rankings' ? 'step6_tradeoff_matrix' :
    currentTab === 'actuarial' ? 'step_actuarial' :
    currentTab === 'reports' ? 'step_reports' :
    currentTab;

  const currentStepIndex = steps.findIndex(s => s.id === normalizedCurrentTab);
  const completedCount = steps.filter(s => s.isCompleted).length;
  const progressPercent = Math.round((completedCount / steps.length) * 100);

  const handleStepClick = (stepId: string) => {
    const check = checkStepNavigation(
      stepId,
      { excelCount, hasConditions, requirementsCount, proposalsCount },
      isRtl
    );

    if (!check.allowed) {
      const stepObj = steps.find(s => s.id === stepId);
      setLockedNotice({
        stepTitle: isRtl ? (stepObj?.titleAr || '') : (stepObj?.titleEn || ''),
        reason: check.reason || (isRtl ? 'يجب إكمال الخطوة السابقة أولاً بنجاح.' : 'Previous step must be completed first.'),
        targetStepId: check.redirectStepId,
        targetStepName: check.stepName
      });
      return;
    }

    setLockedNotice(null);
    onSelectTab(stepId);
  };

  return (
    <div className="mb-6 space-y-3">
      
      {/* Step Stepper Container */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs">
        
        {/* Top Progress & Status Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 mb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="w-7 h-7 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center shrink-0">
              <Compass className="w-4 h-4" />
            </div>
            <span className="text-xs sm:text-sm font-black text-slate-800 tracking-tight">
              {isRtl ? 'مسار خطوات إعداد وتقييم المناقصة (1 - 7):' : 'Tender Workflow Stages (1 - 7):'}
            </span>
            <span className="text-xs font-bold text-sky-700 bg-sky-50 px-2.5 py-0.5 rounded-full border border-sky-200/70 whitespace-nowrap">
              {completedCount} {isRtl ? 'من 7 خطوات مكتملة بنجاح' : 'of 7 completed'} ({progressPercent}%)
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="w-36 sm:w-48 bg-slate-100 rounded-full h-2.5 overflow-hidden border border-slate-200/80">
              <div 
                className="bg-gradient-to-r from-sky-500 to-emerald-500 h-full rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className="text-xs font-extrabold text-slate-700 font-mono">
              {progressPercent}%
            </span>
          </div>
        </div>

        {/* 7-Step Navigation Cards Grid: Perfectly responsive & Never overflowing */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-2.5 sm:gap-3 min-w-0 w-full">
          {steps.map((step) => {
            const isCurrent = step.id === normalizedCurrentTab;
            const isCompleted = step.isCompleted;
            const isLocked = step.isLocked;
            const StepIcon = iconMap[step.id] || FileText;

            return (
              <button
                key={step.id}
                type="button"
                onClick={() => handleStepClick(step.id)}
                className={`group relative flex flex-col justify-between p-3 rounded-xl transition-all text-start border select-none min-h-[95px] xl:min-h-[108px] min-w-0 overflow-hidden ${
                  isCurrent
                    ? 'bg-sky-50/90 border-sky-400 text-sky-950 shadow-xs ring-2 ring-sky-500/20 z-10'
                    : isCompleted
                    ? 'bg-emerald-50/35 border-emerald-300/80 text-slate-800 hover:bg-emerald-50/70 cursor-pointer'
                    : isLocked
                    ? 'bg-slate-50/70 border-slate-200/80 text-slate-400 cursor-not-allowed opacity-80'
                    : 'bg-white border-slate-200 hover:border-sky-300 text-slate-700 hover:bg-slate-50 cursor-pointer'
                }`}
                title={isLocked ? (isRtl ? step.lockReasonAr : step.lockReasonEn) : undefined}
              >
                {/* Card Top Row: Number/Icon Badge + Status Pill */}
                <div className="flex items-center justify-between w-full gap-1.5 mb-2 min-w-0">
                  <div
                    className={`w-6 h-6 sm:w-7 sm:h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 transition-colors shadow-2xs ${
                      isCurrent
                        ? 'bg-sky-600 text-white ring-2 ring-sky-200'
                        : isCompleted
                        ? 'bg-emerald-600 text-white'
                        : isLocked
                        ? 'bg-slate-200 text-slate-500'
                        : 'bg-slate-100 text-slate-700 group-hover:bg-sky-100 group-hover:text-sky-800'
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    ) : isLocked ? (
                      <Lock className="w-3 h-3" />
                    ) : (
                      <span>{step.number}</span>
                    )}
                  </div>

                  {/* Status Indicator Pill */}
                  <div className="shrink-0">
                    {isCurrent ? (
                      <span className="text-[11px] font-bold uppercase text-sky-800 bg-sky-100/90 px-1.5 py-0.5 rounded-md border border-sky-200/80 whitespace-nowrap">
                        {isRtl ? 'الحالية' : 'Active'}
                      </span>
                    ) : isCompleted ? (
                      <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-100/80 px-1.5 py-0.5 rounded-md border border-emerald-200/70 whitespace-nowrap">
                        {isRtl ? 'مكتملة' : 'Done'}
                      </span>
                    ) : isLocked ? (
                      <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-md whitespace-nowrap">
                        {isRtl ? 'مقفلة' : 'Locked'}
                      </span>
                    ) : (
                      <span className="text-[11px] font-medium text-slate-600 bg-slate-50 px-1.5 py-0.5 rounded-md whitespace-nowrap">
                        {isRtl ? 'جاهزة' : 'Ready'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Body: Title & Subtitle with proper wrapping (No truncation clipping) */}
                <div className="w-full flex-1 flex flex-col justify-end min-w-0">
                  <div className={`text-xs sm:text-sm font-bold leading-snug text-start truncate ${
                    isCurrent ? 'text-sky-950 font-bold' : isLocked ? 'text-slate-400' : 'text-slate-900 group-hover:text-sky-950'
                  }`}>
                    {isRtl ? step.titleAr : step.titleEn}
                  </div>
                  <div className={`text-[11px] leading-normal text-start mt-0.5 font-normal truncate ${
                    isCurrent ? 'text-sky-700 font-medium' : isCompleted ? 'text-emerald-700 font-medium' : 'text-slate-500'
                  }`}>
                    {isRtl ? step.subtitleAr : step.subtitleEn}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Interactive Locked Step Notice Banner */}
      {lockedNotice && (
        <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 text-amber-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 mt-0.5">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-xs sm:text-sm text-amber-950 flex items-center gap-2 flex-wrap">
                <span>{isRtl ? `الخطوة "${lockedNotice.stepTitle}" مقفلة حالياً` : `Step "${lockedNotice.stepTitle}" is Locked`}</span>
                <span className="text-[10px] font-bold bg-amber-200/80 text-amber-900 px-2 py-0.5 rounded-full">
                  {isRtl ? 'حظر القفز غير المكتمل' : 'Prerequisite Guard'}
                </span>
              </div>
              <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                {lockedNotice.reason}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {lockedNotice.targetStepId && (
              <button
                type="button"
                onClick={() => {
                  onSelectTab(lockedNotice.targetStepId!);
                  setLockedNotice(null);
                }}
                className="h-9 px-3.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-colors inline-flex items-center gap-1.5 cursor-pointer shadow-2xs whitespace-nowrap"
              >
                <span>{isRtl ? `الانتقال إلى ${lockedNotice.targetStepName}` : `Go to ${lockedNotice.targetStepName}`}</span>
                {isRtl ? <ArrowLeft className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
              </button>
            )}
            <button
              type="button"
              onClick={() => setLockedNotice(null)}
              className="h-9 px-3 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-900 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap"
            >
              {isRtl ? 'إغلاق' : 'Dismiss'}
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
