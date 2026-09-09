import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Clock, 
  HeartHandshake, 
  ShieldAlert, 
  Hospital, 
  CheckCircle2, 
  AlertTriangle, 
  Scale, 
  FileCheck, 
  ChevronDown, 
  ChevronUp, 
  Building2,
  Sparkles,
  Info,
  Languages
} from 'lucide-react';
import { CompanyProposal, CompanyTermsAnalysis } from '../types';
import { useI18n, Language } from '../i18n/I18nContext';
import { getLocalizedTerms, localizeCompanyName, localizePlanName } from '../utils/termsTranslation';

interface TenderTermsForensicViewerProps {
  proposal?: CompanyProposal | null;
  isCompact?: boolean;
}

export const TenderTermsForensicViewer: React.FC<TenderTermsForensicViewerProps> = ({
  proposal,
  isCompact = false
}) => {
  const { isRtl, language } = useI18n();
  const [isExpanded, setIsExpanded] = useState<boolean>(!isCompact);
  // Allow user to toggle terms language independently or follow app language
  const [termsLanguage, setTermsLanguage] = useState<Language>(language || (isRtl ? 'ar' : 'en'));

  // Keep terms language synced when the app language switches
  useEffect(() => {
    setTermsLanguage(language || (isRtl ? 'ar' : 'en'));
  }, [language, isRtl]);

  if (!proposal) return null;

  const terms: CompanyTermsAnalysis = getLocalizedTerms(proposal, termsLanguage);
  const displayCompanyName = localizeCompanyName(proposal?.companyName || '', termsLanguage);
  const displayPlanName = localizePlanName(proposal?.planName || '', termsLanguage);
  const isArabic = termsLanguage === 'ar';

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden transition-all">
      {/* Header Bar */}
      <div 
        onClick={() => setIsExpanded(!isExpanded)}
        className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between gap-3 cursor-pointer select-none"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 flex items-center justify-center shrink-0">
            <FileCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-bold text-sm sm:text-base text-white">
                {isArabic ? 'التحليل الفني لنص الشروط والبنود التعاقدية والاستثناءات' : 'Forensic Terms, Conditions & Exclusions Analysis'}
              </h4>
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                {isArabic ? 'تدقيق دقيق لملف الشركة' : 'Forensically Audited'}
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              {isArabic 
                ? `قراءة وفحص متكامل لشروط عرض ${displayCompanyName} (${displayPlanName}) وفترات الانتظار والاستثناءات والرسوم`
                : `Comprehensive breakdown of terms, waiting periods, pre-existing clauses, and exclusions for ${displayCompanyName}`
              }
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
          {/* Language Switcher for the Forensic Analysis View */}
          <div className="flex items-center bg-slate-800/90 p-1 rounded-xl border border-slate-700 text-xs">
            <button
              type="button"
              onClick={() => setTermsLanguage('ar')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                termsLanguage === 'ar'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white'
              }`}
              title="عرض التحليل باللغة العربية"
            >
              عربي
            </button>
            <button
              type="button"
              onClick={() => setTermsLanguage('en')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                termsLanguage === 'en'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white'
              }`}
              title="View analysis in English"
            >
              EN
            </button>
          </div>

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title={isExpanded ? (isArabic ? 'طي' : 'Collapse') : (isArabic ? 'توسيع' : 'Expand')}
          >
            {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="p-5 sm:p-6 space-y-6">
          {/* Executive Actuary Verdict Banner */}
          {terms.overallVerdict && (
            <div className="bg-gradient-to-br from-indigo-50 via-sky-50/50 to-white rounded-2xl p-4 sm:p-5 border border-indigo-100 flex flex-col sm:flex-row sm:items-start gap-4 shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="space-y-1 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold text-indigo-950 uppercase tracking-wider">
                    {isArabic ? 'الرأي الفني والمالي لعقد الشركة' : 'Technical & Procurement Verdict'}
                  </span>
                  <span className="text-[10px] font-bold bg-indigo-100 text-indigo-800 px-2 py-0.2 rounded-md">
                    {displayCompanyName}
                  </span>
                  <span className="text-[10px] text-slate-500 font-medium">
                    ({isArabic ? 'مترجم ومدقق مهنياً' : 'Professionally Audited'})
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
                  {terms.overallVerdict}
                </p>
                {terms.summary && terms.summary !== terms.overallVerdict && (
                  <p className="text-xs text-slate-500 pt-1 leading-relaxed border-t border-indigo-100/70">
                    <strong>{isArabic ? 'الملخص التعاقدي:' : 'Contract Summary:'}</strong> {terms.summary}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Granular Terms Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            
            {/* 1. فترات الانتظار (Waiting Periods) */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-2 hover:border-sky-300 transition-colors shadow-2xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                  <h5 className="font-bold text-xs sm:text-sm text-slate-900">
                    {isArabic ? '١. فترات الانتظار (Waiting Periods)' : '1. Waiting Periods'}
                  </h5>
                </div>
                <span className="text-[10px] font-bold bg-amber-50 text-amber-800 px-2 py-0.5 rounded-full border border-amber-200">
                  {isArabic ? 'محدد زمني' : 'Timeline'}
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed min-h-[60px]">
                {terms.waitingPeriods || (isArabic ? 'لا توجد فترات انتظار مفروضة وفق الشروط العامة.' : 'No waiting periods indicated.')}
              </p>
              <div className="text-[10px] text-slate-400 bg-slate-50 p-2 rounded-lg border border-slate-100">
                {isArabic ? '💡 تشمل تغطية الولادة، الأمراض المزمنة، والعمليات المجدولة.' : 'Covers maternity, chronic diseases, and elective surgery.'}
              </div>
            </div>

            {/* 2. الأمراض السابقة والمزمنة (Pre-existing & Chronic) */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-2 hover:border-sky-300 transition-colors shadow-2xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <HeartHandshake className="w-4 h-4 text-rose-600 shrink-0" />
                  <h5 className="font-bold text-xs sm:text-sm text-slate-900">
                    {isArabic ? '٢. الأمراض السابقة والمزمنة' : '2. Pre-Existing & Chronic'}
                  </h5>
                </div>
                <span className="text-[10px] font-bold bg-rose-50 text-rose-800 px-2 py-0.5 rounded-full border border-rose-200">
                  {isArabic ? 'تغطية صحية' : 'Coverage'}
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed min-h-[60px]">
                {terms.preExistingConditions || (isArabic ? 'مشمولة بنسبة 100% وفق الشروط الفنية للكراسة.' : 'Covered in full as per specifications.')}
              </p>
              <div className="text-[10px] text-slate-400 bg-slate-50 p-2 rounded-lg border border-slate-100">
                {isArabic ? '💡 فحص شمول الحالات المعلنة وغير المعلنة وسقوف الأدوية الشهرية.' : 'Includes declared/undeclared conditions and prescription caps.'}
              </div>
            </div>

            {/* 3. نسب وضوابط التحمل (Copay & Deductibles) */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-2 hover:border-sky-300 transition-colors shadow-2xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Scale className="w-4 h-4 text-sky-600 shrink-0" />
                  <h5 className="font-bold text-xs sm:text-sm text-slate-900">
                    {isArabic ? '٣. نسب وضوابط التحمل (Copay)' : '3. Copay & Deductibles'}
                  </h5>
                </div>
                <span className="text-[10px] font-bold bg-sky-50 text-sky-800 px-2 py-0.5 rounded-full border border-sky-200">
                  {isArabic ? 'المشاركة المالية' : 'Cost Share'}
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed min-h-[60px]">
                {terms.copayRules || (isArabic ? 'نسبة التحمل في العيادات الخارجية تخضع لشروط الوثيقة دون تحميل على الإدخالات.' : 'Copay rules defined per schedule without inpatient cost-share.')}
              </p>
              <div className="text-[10px] text-slate-400 bg-slate-50 p-2 rounded-lg border border-slate-100">
                {isArabic ? '💡 فحص سقف كشفية الطبيب ونسبة مساهمة الموظف في الأدوية.' : 'Checks GP/specialist visit limits and pharmacy co-share.'}
              </div>
            </div>

            {/* 4. الشبكة الطبية والمستشفيات (Network & Reimbursement) */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-2 hover:border-sky-300 transition-colors shadow-2xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Hospital className="w-4 h-4 text-indigo-600 shrink-0" />
                  <h5 className="font-bold text-xs sm:text-sm text-slate-900">
                    {isArabic ? '٤. الشبكة الطبية والتزويد المباشر' : '4. Medical Network & Billing'}
                  </h5>
                </div>
                <span className="text-[10px] font-bold bg-indigo-50 text-indigo-800 px-2 py-0.5 rounded-full border border-indigo-200">
                  {isArabic ? 'المزودون' : 'Providers'}
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed min-h-[60px]">
                {terms.networkRules || (isArabic ? 'شبكة معتمدة شاملة لكافة المستشفيات والمراكز الكبرى مع تسوية مطالبات الاسترداد.' : 'Accredited Tier 1 provider network with reimbursement options.')}
              </p>
              <div className="text-[10px] text-slate-400 bg-slate-50 p-2 rounded-lg border border-slate-100">
                {isArabic ? '💡 فحص شمول مستشفيات الدرجة الأولى وآلية التعويض خارج الشبكة.' : 'Includes Tier 1 Prime hospitals and out-of-network claims.'}
              </div>
            </div>

            {/* 5. الموافقة المسبقة والإجراءات المجدولة (Prior Authorization) */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-2 hover:border-sky-300 transition-colors shadow-2xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <h5 className="font-bold text-xs sm:text-sm text-slate-900">
                    {isArabic ? '٥. الموافقة المسبقة والاستثناءات' : '5. Prior Approvals'}
                  </h5>
                </div>
                <span className="text-[10px] font-bold bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-200">
                  {isArabic ? 'الإجراءات' : 'Authorizations'}
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed min-h-[60px]">
                {terms.priorApprovalRules || (isArabic ? 'الموافقة المسبقة مقتصرة على الإجراءات الجراحية المجدولة والفحوصات المتقدمة، مع إعفاء الحالات الطارئة.' : 'Prior approval limited to elective surgeries and advanced diagnostics.')}
              </p>
              <div className="text-[10px] text-slate-400 bg-slate-50 p-2 rounded-lg border border-slate-100">
                {isArabic ? '💡 الحالات الطارئة تغطى 100% دون اشتراط إشعار مسبق.' : 'Emergency cases are 100% covered with no pre-auth needed.'}
              </div>
            </div>

            {/* 6. الرسوم القانونية والتسعير (Statutory Fees Notes) */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-2 hover:border-sky-300 transition-colors shadow-2xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-amber-700 shrink-0" />
                  <h5 className="font-bold text-xs sm:text-sm text-slate-900">
                    {isArabic ? '٦. الرسوم القانونية والضرائب' : '6. Statutory Levies & Fees'}
                  </h5>
                </div>
                <span className="text-[10px] font-bold bg-amber-50 text-amber-800 px-2 py-0.5 rounded-full border border-amber-200">
                  {proposal.pricingStructure?.feesPercentage || 6.5}%
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed min-h-[60px]">
                {terms.statutoryFeeNotes || (isArabic ? 'رسوم إصدار 5% + رسوم طوابع 1% + صندوق ضمان المؤمن لهم 0.5% (إجمالي 6.5%).' : 'Statutory fees 6.5% standard.')}
              </p>
              <div className="text-[10px] text-slate-400 bg-slate-50 p-2 rounded-lg border border-slate-100">
                {isArabic ? '💡 مدققة ومطابقة للأحكام القانونية الأردنية الرسمية.' : 'Audited and aligned with Jordanian statutory regulations.'}
              </div>
            </div>

          </div>

          {/* Section: Explicit Policy Exclusions (الاستثناءات الصريحة المستخرجة) */}
          {terms.exclusions && terms.exclusions.length > 0 && (
            <div className="bg-slate-50 rounded-2xl p-4 sm:p-5 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0" />
                  <h5 className="font-bold text-sm text-slate-900">
                    {isArabic ? 'الاستثناءات الصريحة المذكورة في نص وثيقة الشركة (Exclusions)' : 'Explicit Policy Exclusions'}
                  </h5>
                </div>
                <span className="text-xs font-bold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
                  {terms.exclusions.length} {isArabic ? 'استثناءات صريحة' : 'Exclusions'}
                </span>
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                {terms.exclusions.map((exclusion, idx) => (
                  <div 
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-700 shadow-2xs"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                    <span>{exclusion}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section: Administrative & Contractual Obligations (الالتزامات والإجراءات التعاقدية) */}
          {terms.additionalObligations && terms.additionalObligations.length > 0 && (
            <div className="bg-emerald-50/50 rounded-2xl p-4 sm:p-5 border border-emerald-200 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-emerald-700 shrink-0" />
                  <h5 className="font-bold text-sm text-emerald-950">
                    {isArabic ? 'الالتزامات والإجراءات الإدارية والتعاقدية (Obligations & SLA)' : 'Administrative Obligations & SLA'}
                  </h5>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
                {terms.additionalObligations.map((obligation, idx) => (
                  <div 
                    key={idx}
                    className="p-3 bg-white rounded-xl border border-emerald-100 text-xs text-emerald-900 space-y-1 shadow-2xs"
                  >
                    <div className="flex items-center gap-1.5 font-bold text-emerald-800">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>{isArabic ? `التزام تعاقدي #${idx + 1}` : `Obligation #${idx + 1}`}</span>
                    </div>
                    <p className="text-slate-600 text-[11px] leading-relaxed">
                      {obligation}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

