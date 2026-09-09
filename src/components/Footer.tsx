import React from 'react';
import { 
  ShieldCheck, 
  Scale, 
  Building2, 
  Calculator, 
  FileCheck2, 
  Users, 
  Sparkles, 
  FileSpreadsheet, 
  ExternalLink,
  Lock,
  Download,
  Calendar
} from 'lucide-react';
import { useI18n } from '../i18n/I18nContext';

interface FooterProps {
  activeProjectYear?: string;
  requirementsCount: number;
  proposalsCount: number;
  onOpenExport?: () => void;
  onNavigateTab?: (tab: string) => void;
  onOpenAdvisor?: () => void;
  onResetToDemo?: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  activeProjectYear = '2025 - 2026',
  requirementsCount,
  proposalsCount,
  onOpenExport,
  onNavigateTab,
  onOpenAdvisor,
  onResetToDemo
}) => {
  const { t, isRtl } = useI18n();

  return (
    <footer className="mt-16 bg-[#0B1329] text-slate-200 border-t border-slate-800 text-sm selection:bg-sky-500 selection:text-white">
      {/* Upper Status & Governance Highlights */}
      <div className="max-w-7xl xl:max-w-[1400px] 2xl:max-w-[1720px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pb-10 border-b border-slate-800/80">
          
          {/* Card 1: Zero-Bonus Governance Rule */}
          <div className="bg-slate-900/80 rounded-2xl p-5 border border-slate-800 hover:border-emerald-500/50 transition-all shadow-sm">
            <div className="flex items-center gap-3 text-emerald-400 font-black text-sm sm:text-base mb-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
              </div>
              <span>{isRtl ? 'معيار حظر البونص الصارم' : 'Strict Zero-Bonus Standard'}</span>
            </div>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
              {isRtl 
                ? 'أي عرض يقدم سقفاً أعلى من المطلوب يحصل على 5/5 دون أي نقاط إضافية؛ لمنع تضخيم المزايا غير المطلوبة والحفاظ على نزاهة التقييم.'
                : 'Any offer exceeding requested caps receives maximum 5/5 with zero bonus points to prevent unneeded feature inflation.'}
            </p>
          </div>

          {/* Card 2: Statutory Fees (Without % sign per user instruction) */}
          <div className="bg-slate-900/80 rounded-2xl p-5 border border-slate-800 hover:border-sky-500/50 transition-all shadow-sm">
            <div className="flex items-center gap-3 text-sky-400 font-black text-sm sm:text-base mb-2.5">
              <div className="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center shrink-0">
                <Calculator className="w-5 h-5 text-sky-400" />
              </div>
              <span>
                {isRtl ? 'الرسوم القانونية الرسمية' : 'Official Statutory Fees'}
              </span>
            </div>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
              {isRtl ? (
                <>
                  احتساب دقيق ومطابق لبدل خدمة الإصدار{' '}
                  <span dir="ltr" className="tabular-nums font-bold text-white inline-block">0.05</span>، وطوابع الواردات{' '}
                  <span dir="ltr" className="tabular-nums font-bold text-white inline-block">0.01</span>، وصندوق ضمان حقوق المؤمن لهم{' '}
                  <span dir="ltr" className="tabular-nums font-bold text-white inline-block">0.005</span>، ورسوم العقد المقطوعة.
                </>
              ) : (
                'Precise auditing of 0.05 issuance fee, 0.01 revenue stamps, and 0.005 policyholders guarantee fund.'
              )}
            </p>
          </div>

          {/* Card 3: Actuarial Census Model */}
          <div className="bg-slate-900/80 rounded-2xl p-5 border border-slate-800 hover:border-indigo-500/50 transition-all shadow-sm">
            <div className="flex items-center gap-3 text-indigo-400 font-black text-sm sm:text-base mb-2.5">
              <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center shrink-0">
                <Users className="w-5 h-5 text-indigo-400" />
              </div>
              <span>
                {isRtl ? (
                  <>
                    <span>التعداد الديمغرافي</span>{' '}
                    <span dir="ltr" className="tabular-nums font-black inline-block mx-0.5">(256)</span>
                  </>
                ) : (
                  'Demographic Census (256)'
                )}
              </span>
            </div>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
              {isRtl ? (
                <>
                  نموذج فئات عمرية معتمد: 97 طفلاً ومعالاً{' '}
                  <span dir="ltr" className="tabular-nums font-bold text-white inline-block">(0-17 سنة)</span>{' '}
                  + 159 موظفاً وبالغاً{' '}
                  <span dir="ltr" className="tabular-nums font-bold text-white inline-block">(18-65 سنة)</span>{' '}
                  لمحاكاة التكلفة الفعلية للعقد.
                </>
              ) : (
                'Standard demographic breakdown: 97 dependents/children (0-17) + 159 adults/employees (18-65).'
              )}
            </p>
          </div>

          {/* Card 4: Tender Year & Audit State */}
          <div className="bg-slate-900/80 rounded-2xl p-5 border border-slate-800 hover:border-amber-500/50 transition-all shadow-sm">
            <div className="flex items-center gap-3 text-amber-400 font-black text-sm sm:text-base mb-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shrink-0">
                <Calendar className="w-5 h-5 text-amber-400" />
              </div>
              <span>
                {isRtl ? (
                  <>
                    <span>دورة العطاء</span>{' '}
                    <span dir="ltr" className="tabular-nums font-black inline-block mx-0.5">({activeProjectYear})</span>
                  </>
                ) : (
                  `Tender Cycle (${activeProjectYear})`
                )}
              </span>
            </div>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
              {isRtl ? (
                <>
                  حالة المناقصة الحالية:{' '}
                  <strong className="text-white tabular-nums font-black">{requirementsCount}</strong>{' '}
                  منفعة معتمدة ومطابقة، و{' '}
                  <strong className="text-white tabular-nums font-black">{proposalsCount}</strong>{' '}
                  عروض شركات خاضعة للتدقيق والفحص الفني والمالي.
                </>
              ) : (
                `Current status: ${requirementsCount} approved requirements and ${proposalsCount} insurer proposals under forensic audit.`
              )}
            </p>
          </div>

        </div>

        {/* Lower Main Footer Row */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-6">
          
          {/* Brand & Purpose */}
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white font-black shadow-sm shrink-0">
              <Scale className="w-6 h-6" />
            </div>
            <div>
              <div className="font-black text-white text-base flex items-center gap-2.5">
                <span>{t('appName')}</span>
                <span className="text-xs bg-slate-800 text-sky-400 font-bold px-2.5 py-0.5 rounded-full border border-slate-700">
                  v2.8 Enterprise
                </span>
              </div>
              <p className="text-slate-400 text-xs sm:text-sm mt-0.5 font-medium">
                {isRtl 
                  ? 'منظومة تدقيق الأسعار والمفاضلة الفنية والمالية لعروض التأمين الطبي المؤسسي'
                  : 'Institutional Medical Insurance Tender Evaluation & Financial Scoring Platform'}
              </p>
            </div>
          </div>

          {/* Quick Action Navigation Links */}
          <div className="flex items-center flex-wrap gap-2 sm:gap-3 text-xs sm:text-sm">
            {onNavigateTab && (
              <>
                <button
                  type="button"
                  onClick={() => onNavigateTab('step1_excel')}
                  className="px-3.5 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 hover:text-white font-bold transition-all cursor-pointer shadow-2xs"
                >
                  {isRtl ? '١. جدول المنافع' : '1. Benefits'}
                </button>
                <button
                  type="button"
                  onClick={() => onNavigateTab('step5_proposals')}
                  className="px-3.5 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 hover:text-white font-bold transition-all cursor-pointer shadow-2xs"
                >
                  {isRtl ? '٥. عروض الشركات' : '5. Proposals'}
                </button>
                <button
                  type="button"
                  onClick={() => onNavigateTab('step_actuarial')}
                  className="px-3.5 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 hover:text-white font-bold transition-all cursor-pointer shadow-2xs"
                >
                  {isRtl ? '٦. حاسبة الأقساط' : '6. Premium Calc'}
                </button>
                <button
                  type="button"
                  onClick={() => onNavigateTab('step_reports')}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black transition-all cursor-pointer shadow-2xs"
                >
                  {isRtl ? '٩. التقرير النهائي (390)' : '9. Final Report (390)'}
                </button>
              </>
            )}

            {onOpenExport && (
              <button
                type="button"
                onClick={onOpenExport}
                className="px-4 py-2 rounded-xl bg-emerald-900/50 hover:bg-emerald-800/70 text-emerald-200 border border-emerald-600/60 font-black transition-all flex items-center gap-2 cursor-pointer shadow-2xs"
              >
                <Download className="w-4 h-4" />
                <span>{isRtl ? 'تصدير التقرير' : 'Export Report'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Bottom Rights Notice */}
        <div className="mt-8 pt-6 border-t border-slate-800/70 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-3">
          <div>
            &copy; {new Date().getFullYear()} {isRtl ? 'منصة الجامعة العربية المفتوحة - الأردن. جميع الحقوق محفوظة.' : 'Arab Open University - Jordan Platform. All rights reserved.'}
          </div>
          <div className="flex items-center gap-4 text-slate-300 font-semibold">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              {isRtl ? 'نظام اعتماد عروض شركات التامين - الجامعة العربية المفتوحة (AOU)' : 'AOU Insurance Proposals Evaluation & Approval System'}
            </span>
          </div>
        </div>

      </div>
    </footer>
  );
};
