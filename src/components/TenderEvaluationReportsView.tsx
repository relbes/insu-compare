import React, { useState, useMemo } from 'react';
import { 
  Award, 
  Trophy, 
  Medal, 
  Printer, 
  Download, 
  Copy, 
  Check, 
  CheckCircle2, 
  AlertTriangle, 
  Search, 
  Calculator, 
  ShieldCheck, 
  Building2, 
  Layers, 
  FileSpreadsheet, 
  Sparkles, 
  Loader2,
  DollarSign,
  TrendingDown,
  Users,
  SlidersHorizontal,
  ChevronRight,
  ExternalLink,
  Pencil
} from 'lucide-react';
import { BenefitRequirement, CompanyProposal, ProposalEvaluationResult, DemographicCensus } from '../types';
import { rankAllProposals, normalizeNumber } from '../utils/scoringEngine';
import { useI18n } from '../i18n/I18nContext';
import { OFFICIAL_78_POINT_TENDER_BENEFITS } from '../utils/excelParser';
import { DEFAULT_DEMOGRAPHIC_CENSUS, calculateOfficialTenderLedger } from '../utils/actuarialCalculator';
import { OfficialFinancialEvaluationMatrix } from './OfficialFinancialEvaluationMatrix';
import { exportTenderToExcel, exportTenderToPDF } from '../utils/exportHelpers';

interface TenderEvaluationReportsViewProps {
  proposals: CompanyProposal[];
  requirements: BenefitRequirement[];
  census?: DemographicCensus;
  onUpdateProposals?: (updatedProposals: CompanyProposal[]) => void;
  onToggleExcludeProposal?: (proposalId: string) => void;
  onNavigatePrev?: () => void;
  onOpenExport?: () => void;
  onNavigateToMatrix?: () => void;
  onNavigateToActuarial?: () => void;
}

export const TenderEvaluationReportsView: React.FC<TenderEvaluationReportsViewProps> = ({
  proposals,
  requirements,
  census,
  onUpdateProposals,
  onToggleExcludeProposal,
  onNavigatePrev,
  onOpenExport,
  onNavigateToMatrix,
  onNavigateToActuarial
}) => {
  const { isRtl, language } = useI18n();

  // Active Report Tab
  const [activeReportTab, setActiveReportTab] = useState<'matrix_60_40' | 'detailed_points' | 'financial_ledger'>('matrix_60_40');

  // Comparison benchmark mode: official 78 items (390 pts) vs current loaded
  const [benchmarkMode, setBenchmarkMode] = useState<'official_78_benchmark' | 'active_loaded'>('official_78_benchmark');

  // Filter and search state for detailed items tab
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterVariancesOnly, setFilterVariancesOnly] = useState<boolean>(false);

  // Copy and export status states
  const [copied, setCopied] = useState<boolean>(false);
  const [isExportingPdf, setIsExportingPdf] = useState<boolean>(false);
  const [isExportingExcel, setIsExportingExcel] = useState<boolean>(false);
  const [excelExported, setExcelExported] = useState<boolean>(false);

  // Inline technical marks editing (out of 390)
  const [editingMarksProposalId, setEditingMarksProposalId] = useState<string | null>(null);
  const [tempMarksValue, setTempMarksValue] = useState<string>('');

  const handleStartEditMarks = (propId: string, currentMarks: number) => {
    setEditingMarksProposalId(propId);
    setTempMarksValue(String(currentMarks));
  };

  const handleSaveMarks = (propId: string) => {
    const num = parseInt(tempMarksValue, 10);
    if (!isNaN(num)) {
      const clamped = Math.max(0, Math.min(390, num));
      if (onUpdateProposals) {
        const updated = proposals.map(p => {
          if (p.id === propId) {
            return {
              ...p,
              customTechnicalMarks: clamped,
              technicalEarnedMarks: clamped
            };
          }
          return p;
        });
        onUpdateProposals(updated);
      }
    }
    setEditingMarksProposalId(null);
  };

  // Evaluate proposals using scoring engine
  const evaluatedResults: ProposalEvaluationResult[] = useMemo(() => {
    return rankAllProposals(proposals, requirements, language);
  }, [proposals, requirements, language]);

  // Determine active comparison items
  const activeItems = useMemo(() => {
    if (benchmarkMode === 'official_78_benchmark') {
      return OFFICIAL_78_POINT_TENDER_BENEFITS;
    }
    return requirements.length > 0 ? requirements : OFFICIAL_78_POINT_TENDER_BENEFITS;
  }, [benchmarkMode, requirements]);

  const totalComparisonPoints = 78;
  const marksPerPoint = 5;
  const totalPossibleMarks = totalComparisonPoints * marksPerPoint; // 390 points

  /**
   * Calculate final scores according to the official committee formula:
   * Technical Weight = 60% (Earned Marks / 390 * 60%)
   * Financial Weight = 40% (Lowest Price / Company Price * 40%)
   * Final Composite Score = Technical 60% + Financial 40%
   */
  const officialEvaluationLedger = useMemo(() => {
    const ledger = calculateOfficialTenderLedger(proposals, 78, census || DEFAULT_DEMOGRAPHIC_CENSUS);
    return ledger.map(item => {
      const evalRes = evaluatedResults.find(r => r.proposalId === item.proposalId);
      return {
        proposalId: item.proposalId,
        companyName: item.companyName,
        planName: item.planName,
        currency: item.currency || 'JOD',
        premium: item.premiumAnnual,
        earnedPoints: item.technicalEarnedMarks,
        technicalPercent: item.technicalPercent,
        technical60Percent: item.technical60Percent,
        financial40Percent: item.financial40Percent,
        finalScore: item.compositeScore,
        evalRes,
        officialRank: item.officialRank,
        awardStatus: item.awardStatus,
        awardDecisionTitleAr: item.awardDecisionTitleAr,
        awardDecisionTitleEn: item.awardDecisionTitleEn,
        awardDecisionNoteAr: item.awardDecisionNoteAr,
        awardDecisionNoteEn: item.awardDecisionNoteEn,
        pricing: item.pricing,
        breakdown: item.breakdown,
        isExcluded: Boolean(item.isExcluded),
        excludedReason: item.excludedReason
      };
    });
  }, [proposals, evaluatedResults, census]);

  // Active (non-excluded) proposals strictly for comparative evaluation, ranking, and awarding matrix
  const activeEvaluationLedger = useMemo(() => {
    return officialEvaluationLedger.filter(item => !item.isExcluded);
  }, [officialEvaluationLedger]);

  // Excluded proposals by committee decision
  const excludedEvaluationLedger = useMemo(() => {
    return officialEvaluationLedger.filter(item => Boolean(item.isExcluded));
  }, [officialEvaluationLedger]);

  // Active proposals list for detailed comparison
  const activeProposals = useMemo(() => {
    return proposals.filter(p => !p.isExcluded);
  }, [proposals]);

  const winner = activeEvaluationLedger[0];
  const runnerUp = activeEvaluationLedger[1];
  const lowestPremium = winner ? winner.premium : 118385.40;

  // Calculate market average and total savings among active qualified proposals
  const validPremiums = activeEvaluationLedger.map(l => l.premium).filter(p => p > 0);
  const averagePremium = validPremiums.length > 0 ? validPremiums.reduce((a, b) => a + b, 0) / validPremiums.length : 130797;
  const savingsVsAverage = Math.max(0, averagePremium - lowestPremium);
  const savingsPercent = averagePremium > 0 ? ((savingsVsAverage / averagePremium) * 100).toFixed(1) : '9.5';

  // Distinct categories for detailed points
  const categories = useMemo(() => {
    return Array.from(new Set(activeItems.map(item => item.category)));
  }, [activeItems]);

  // Filtered detailed items with variance detection
  const filteredDetailedItems = useMemo(() => {
    return activeItems.filter((item) => {
      if (categoryFilter !== 'all' && item.category !== categoryFilter) return false;

      // Filter variances only: check if companies have differing offered values or inclusion status
      if (filterVariancesOnly) {
        const values = proposals.map(p => {
          const off = p.benefits ? p.benefits[item.id] : undefined;
          return off ? `${off.isIncluded}-${off.offeredValue}` : 'included-default';
        });
        const hasVariance = new Set(values).size > 1;
        if (!hasVariance) return false;
      }

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchName = item.name.toLowerCase().includes(query);
        const matchCat = item.category.toLowerCase().includes(query);
        const matchDesc = (item.description || '').toLowerCase().includes(query);
        if (!matchName && !matchCat && !matchDesc) return false;
      }
      return true;
    });
  }, [activeItems, categoryFilter, searchQuery, filterVariancesOnly, proposals]);

  // Handle Export to Excel (Full multi-sheet .xlsx) with loading and success feedback
  const handleExportExcel = async () => {
    setIsExportingExcel(true);
    try {
      await exportTenderToExcel(proposals, activeItems, census || DEFAULT_DEMOGRAPHIC_CENSUS, isRtl);
      setExcelExported(true);
      setTimeout(() => setExcelExported(false), 2500);
    } catch (err) {
      console.error('Excel export error:', err);
    } finally {
      setIsExportingExcel(false);
    }
  };

  // Handle Direct PDF Export with reliable fallback
  const handleDownloadPDF = async () => {
    setIsExportingPdf(true);
    try {
      const el = document.getElementById('tender-evaluation-report-view-container');
      await exportTenderToPDF(el, `تقرير_التقييم_النهائي_للعطاء_390_علامة_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (err) {
      console.error('PDF export failed:', err);
      window.print();
    } finally {
      setIsExportingPdf(false);
    }
  };

  // Copy Summary to Clipboard with multi-layer fallback
  const handleCopySummary = async () => {
    if (!winner) return;
    const summaryText = `
محضر التقييم النهائي وترسية عطاء التأمين الطبي
============================================
عدد بنود المقارنة: 78 نقطة و لكل نقطة 5 علامات
العدد الإجمالي للعلامات الفنية: 78 * 5 = 390 نقطة
معادلة المفاضلة: 60% للتقييم الفني + 40% للتقييم المالي

نتائج التقييم النهائي للعروض المؤهلة:
----------------------------------
${activeEvaluationLedger.map((row, idx) => `
${idx + 1}. ${row.companyName}
   - مجموع النقاط: ${row.earnedPoints} من 390
   - نسبة الفني: ${row.technicalPercent}% (وزن 60%: ${row.technical60Percent}%)
   - وزن المالي 40%: ${row.financial40Percent}% (القسط: ${row.premium.toLocaleString()} دينار)
   - التقييم النهائي: ${row.finalScore}% ${idx === 0 ? ' [الفائز بالترسية - المرتبة الأولى]' : ''}
`).join('')}
${excludedEvaluationLedger.length > 0 ? `
العروض المستثناة بقرار اللجنة:
-----------------------------
${excludedEvaluationLedger.map((ex, idx) => `${idx + 1}. ${ex.companyName}: ${ex.excludedReason || 'مستثنى بقرار اللجنة'}`).join('\n')}
` : ''}
توصية لجنة الترسية:
إحالة العطاء على (${winner?.companyName || 'العرض الفائز'}) لحصولها على أعلى تقييم مركب (${winner?.finalScore || 0}%).
    `.trim();

    let success = false;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      try {
        await navigator.clipboard.writeText(summaryText);
        success = true;
      } catch (err) {
        console.warn('Navigator clipboard failed, using execCommand fallback:', err);
      }
    }

    if (!success) {
      try {
        const textArea = document.createElement('textarea');
        textArea.value = summaryText;
        textArea.style.position = 'fixed';
        textArea.style.left = '-9999px';
        textArea.style.top = '-9999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        success = document.execCommand('copy');
        document.body.removeChild(textArea);
      } catch (err) {
        console.error('execCommand copy failed:', err);
      }
    }

    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div id="tender-evaluation-report-view-container" className="space-y-6 print:m-0 print:p-0">
      
      {/* ========================================================================= */}
      {/* 1. EXECUTIVE HEADER BANNER & ACTION TOOLBAR                                */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-6 lg:p-8 relative overflow-hidden">
        
        {/* Subtle executive top gradient line */}
        <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-amber-500 via-sky-600 to-emerald-600" />

        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
          
          {/* Title & Scope Badges */}
          <div className="space-y-3">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-900 border border-amber-300 shadow-2xs">
                <Trophy className="w-3.5 h-3.5 text-amber-600" />
                <span>المصفوفة الرسمية المعتمدة للترسية</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-sky-50 text-sky-900 border border-sky-300">
                <ShieldCheck className="w-3.5 h-3.5 text-sky-600" />
                <span>60% فني + 40% مالي</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-900 border border-emerald-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>سقف الـ 100% الصارم (بدون بونص)</span>
              </span>
            </div>

            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                {isRtl ? 'التقرير النهائي الشامل لتقييم وترسية عطاء التأمين الطبي' : 'Comprehensive Medical Insurance Tender Evaluation & Awarding Report'}
              </h1>
              <p className="text-sm text-slate-600 max-w-4xl leading-relaxed mt-1 font-medium">
                {isRtl
                  ? 'عدد بنود المقارنة 78 نقطة و لكل نقطة 5 علامات، بإجمالي 390 علامة فنية. تحتسب النتيجة النهائية بوزن 60% للتقييم الفني و40% للتقييم المالي لتحديد العرض الفائز وفق الأصول المالية والقانونية المعتمدة.'
                  : 'Benchmark evaluation of 78 points @ 5 marks each = 390 total technical points. Final score combines 60% Technical and 40% Financial weights.'}
              </p>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2.5 flex-wrap shrink-0 print:hidden">
            
            {/* Download PDF Button */}
            <button
              type="button"
              id="btn-download-tender-pdf"
              onClick={handleDownloadPDF}
              disabled={isExportingPdf}
              className="h-11 inline-flex items-center justify-center gap-2 px-4 rounded-xl text-sm font-bold text-rose-950 bg-rose-50 hover:bg-rose-100/90 border border-rose-300 transition-all cursor-pointer shadow-xs disabled:opacity-50 active:scale-[0.98] select-none"
              title={isRtl ? 'تحميل التقرير كملف PDF' : 'Download report as PDF'}
            >
              {isExportingPdf ? (
                <Loader2 className="w-4 h-4 text-rose-600 animate-spin shrink-0" />
              ) : (
                <Download className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{isExportingPdf ? (isRtl ? 'جاري التحميل...' : 'Downloading...') : (isRtl ? 'تحميل PDF' : 'Download PDF')}</span>
            </button>

            {/* Print Button */}
            <button
              type="button"
              id="btn-print-tender-report"
              onClick={() => window.print()}
              className="h-11 inline-flex items-center justify-center gap-2 px-4 rounded-xl text-sm font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-300 transition-all cursor-pointer shadow-xs active:scale-[0.98] select-none"
              title={isRtl ? 'طباعة التقرير الرسمي للجنة' : 'Print official tender report'}
            >
              <Printer className="w-4 h-4 text-slate-700 shrink-0" />
              <span>{isRtl ? 'طباعة' : 'Print'}</span>
            </button>

            {/* Export Excel Button */}
            <button
              type="button"
              id="btn-export-tender-excel"
              onClick={handleExportExcel}
              disabled={isExportingExcel}
              className="h-11 inline-flex items-center justify-center gap-2 px-4 rounded-xl text-sm font-bold text-emerald-950 bg-emerald-50 hover:bg-emerald-100/90 border border-emerald-300 transition-all cursor-pointer shadow-xs disabled:opacity-50 active:scale-[0.98] select-none"
              title={isRtl ? 'تصدير جدول التقييم إلى إكسل (.xlsx)' : 'Export to Excel (.xlsx)'}
            >
              {isExportingExcel ? (
                <Loader2 className="w-4 h-4 text-emerald-600 animate-spin shrink-0" />
              ) : excelExported ? (
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <FileSpreadsheet className="w-4 h-4 text-emerald-700 shrink-0" />
              )}
              <span>
                {isExportingExcel
                  ? (isRtl ? 'جاري التصدير...' : 'Exporting...')
                  : excelExported
                  ? (isRtl ? 'تم التصدير!' : 'Exported!')
                  : (isRtl ? 'تصدير إكسل (Excel)' : 'Export Excel')}
              </span>
            </button>

            {/* Export Center (Full Options Modal) */}
            {onOpenExport && (
              <button
                type="button"
                id="btn-open-export-center"
                onClick={onOpenExport}
                className="h-11 inline-flex items-center justify-center gap-2 px-4 rounded-xl text-sm font-bold text-indigo-950 bg-indigo-50 hover:bg-indigo-100/90 border border-indigo-300 transition-all cursor-pointer shadow-xs active:scale-[0.98] select-none"
                title={isRtl ? 'خيارات التصدير الشامل والطباعة المتقدمة' : 'Advanced export & print options'}
              >
                <SlidersHorizontal className="w-4 h-4 text-indigo-700 shrink-0" />
                <span>{isRtl ? 'مركز التصدير' : 'Export Center'}</span>
              </button>
            )}

            {/* Copy Summary Button */}
            <button
              type="button"
              id="btn-copy-tender-summary"
              onClick={handleCopySummary}
              className="h-11 inline-flex items-center justify-center gap-2 px-4 rounded-xl text-sm font-bold text-sky-950 bg-sky-50 hover:bg-sky-100/90 border border-sky-300 transition-all cursor-pointer shadow-xs active:scale-[0.98] select-none"
              title={isRtl ? 'نسخ ملخص القرار والتوصية إلى الحافظة' : 'Copy executive summary'}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="text-emerald-800">{isRtl ? 'تم النسخ!' : 'Copied!'}</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-sky-700 shrink-0" />
                  <span>{isRtl ? 'نسخ الملخص' : 'Copy Summary'}</span>
                </>
              )}
            </button>

          </div>

        </div>

        {/* Executive High-Contrast KPI Cards */}
        <div className="mt-6 pt-5 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs sm:text-sm">
          
          {/* Card 1: Winning Proposal */}
          <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 p-4 rounded-2xl border border-amber-300 shadow-2xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-amber-900 font-bold text-xs uppercase flex items-center gap-1.5">
                <Trophy className="w-3.5 h-3.5 text-amber-600" />
                العرض الفائز بالترسية
              </span>
              <span className="bg-amber-400 text-amber-950 font-black px-2 py-0.5 rounded-full text-[11px]">
                المرتبة #1
              </span>
            </div>
            <div className="text-base font-black text-slate-900 truncate" title={winner?.companyName}>
              {winner?.companyName ? winner.companyName.split('(')[0].trim() : '—'}
            </div>
            <div className="flex items-center gap-2 text-xs font-bold text-amber-950 pt-0.5">
              <span>العلامة المركبة:</span>
              <span className="text-sm font-black text-amber-900 tabular-nums">{winner?.finalScore}%</span>
            </div>
          </div>

          {/* Card 2: Financial Savings */}
          <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 p-4 rounded-2xl border border-emerald-300 shadow-2xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-emerald-900 font-bold text-xs uppercase flex items-center gap-1.5">
                <TrendingDown className="w-3.5 h-3.5 text-emerald-600" />
                الوفر المالي المحقق
              </span>
              <span className="bg-emerald-200 text-emerald-900 font-black px-2 py-0.5 rounded-full text-[11px]">
                وفر {savingsPercent}%
              </span>
            </div>
            <div className="text-lg font-black text-slate-900 tabular-nums">
              {savingsVsAverage.toLocaleString(undefined, { maximumFractionDigits: 0 })} د.أ
            </div>
            <div className="text-xs text-slate-600 font-medium">
              مقارنة بمتوسط عروض الشركات الأخرى ({averagePremium.toLocaleString(undefined, { maximumFractionDigits: 0 })} د.أ)
            </div>
          </div>

          {/* Card 3: Evaluation Ledger Scale */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-slate-600 font-bold text-xs uppercase flex items-center gap-1.5">
                <Calculator className="w-3.5 h-3.5 text-indigo-600" />
                معيار العلامات الفنية
              </span>
              <span className="bg-indigo-100 text-indigo-900 font-bold px-2 py-0.5 rounded-full text-[11px]">
                78 × 5 علامات
              </span>
            </div>
            <div className="text-lg font-black text-indigo-950 tabular-nums">
              390 علامة فنية
            </div>
            <div className="text-xs text-slate-600 font-medium">
              وزن 60% للتقييم الفني + 40% للتقييم المالي
            </div>
          </div>

          {/* Card 4: Demographic Census Portfolio */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-slate-600 font-bold text-xs uppercase flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-sky-600" />
                حجم المحفظة التأمينية
              </span>
              <span className="bg-sky-100 text-sky-900 font-bold px-2 py-0.5 rounded-full text-[11px]">
                مشمولون
              </span>
            </div>
            <div className="text-lg font-black text-slate-900 tabular-nums">
              256 مشتركاً
            </div>
            <div className="text-xs text-slate-600 font-medium">
              159 بالغين (موظف وزوج) + 97 أطفال
            </div>
          </div>

        </div>

      </div>

      {/* ========================================================================= */}
      {/* 2. REFINED TAB NAVIGATION BAR                                             */}
      {/* ========================================================================= */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200/90 shadow-2xs flex items-center gap-2 overflow-x-auto print:hidden">
        
        {/* Tab 1: 60/40 Official Matrix */}
        <button
          type="button"
          onClick={() => setActiveReportTab('matrix_60_40')}
          className={`flex-1 min-w-[210px] h-12 px-4 rounded-xl text-xs sm:text-sm font-black flex items-center justify-center gap-2.5 transition-all cursor-pointer select-none ${
            activeReportTab === 'matrix_60_40'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Trophy className="w-4 h-4 text-amber-400 shrink-0" />
          <span>مصفوفة الترسية (60% فني + 40% مالي)</span>
        </button>

        {/* Tab 2: Detailed 78 Items Breakdown */}
        <button
          type="button"
          onClick={() => setActiveReportTab('detailed_points')}
          className={`flex-1 min-w-[210px] h-12 px-4 rounded-xl text-xs sm:text-sm font-black flex items-center justify-center gap-2.5 transition-all cursor-pointer select-none ${
            activeReportTab === 'detailed_points'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Layers className="w-4 h-4 text-sky-400 shrink-0" />
          <span>تفريغ علامات الـ 78 بنداً (390 نقطة)</span>
        </button>

        {/* Tab 3: Financial & Actuarial Ledger */}
        <button
          type="button"
          onClick={() => setActiveReportTab('financial_ledger')}
          className={`flex-1 min-w-[210px] h-12 px-4 rounded-xl text-xs sm:text-sm font-black flex items-center justify-center gap-2.5 transition-all cursor-pointer select-none ${
            activeReportTab === 'financial_ledger'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Calculator className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{isRtl ? 'جدول التكلفة المالية وتوزيع الأقساط' : 'Financial Cost & Premium Table'}</span>
        </button>

      </div>

      {/* ========================================================================= */}
      {/* 3. TAB CONTENT 1: OFFICIAL 60/40 EVALUATION MATRIX                        */}
      {/* ========================================================================= */}
      {activeReportTab === 'matrix_60_40' && (
        <div className="space-y-6">
          
          {/* Executive Matrix Card */}
          <div className="bg-white rounded-3xl border border-slate-300 shadow-sm overflow-hidden">
            
            {/* Table Header Banner */}
            <div className="bg-slate-900 text-white p-5 text-center border-b border-slate-800">
              <div className="text-xs font-bold uppercase tracking-widest text-sky-400 mb-1">
                جدول التقييم النهائي المعتمد لعطاء التأمين الصحي
              </div>
              <h2 className="text-base sm:text-xl font-black text-amber-300">
                عدد بنود المقارنة 78 نقطة و لكل نقطة 5 علامات • العدد الاجمالي للعلامات 78 × 5 = 390 نقطة
              </h2>
              <div className="text-xs text-slate-300 mt-1 font-medium">
                نسبة التقييم الفني المعتمدة 60% &bull; نسبة التقييم المالي المعتمدة 40% &bull; سقف عدم تجاوز الشروط 100%
              </div>
            </div>

            {/* Excluded Offers Notice Banner */}
            {excludedEvaluationLedger.length > 0 && (
              <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 text-xs sm:text-sm text-amber-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
                <div className="flex items-center gap-2.5">
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                  <div>
                    <span className="font-black">
                      {isRtl ? `تم استبعاد (${excludedEvaluationLedger.length}) عروض بقرار اللجنة وإخفاؤها من جدول المفاضلة والترسية:` : `(${excludedEvaluationLedger.length}) offers excluded and hidden from award matrix:`}
                    </span>
                    <span className="font-semibold ms-1 text-slate-800">
                      {excludedEvaluationLedger.map(e => e.companyName).join('، ')}
                    </span>
                  </div>
                </div>
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-black bg-amber-200/80 text-amber-900 border border-amber-300 shrink-0">
                  {isRtl ? 'مستثنى بقرار رسمي' : 'Excluded by Committee'}
                </span>
              </div>
            )}

            {/* Matrix Table with Sticky Company Header */}
            <div className="overflow-x-auto max-h-[75vh] overflow-y-auto custom-scrollbar relative">
              <table className="w-full text-center border-collapse text-sm sm:text-base">
                <thead className="sticky top-0 z-30 shadow-md">
                  <tr className="bg-slate-100 text-slate-900 border-b-2 border-slate-300">
                    <th className="sticky top-0 z-30 py-4 px-5 text-start font-black text-slate-900 bg-slate-100 border-e border-slate-300 min-w-[240px] shadow-xs">
                      {isRtl ? 'بند التقييم / شركة التأمين' : 'Evaluation Item / Company'}
                    </th>
                    {activeEvaluationLedger.map((col, idx) => (
                      <th
                        key={col.proposalId}
                        className={`sticky top-0 z-30 py-4 px-4 font-black border-e border-slate-300 min-w-[200px] transition-colors shadow-xs ${
                          idx === 0
                            ? 'bg-amber-100 text-amber-950 ring-1 ring-inset ring-amber-400'
                            : idx === 1
                            ? 'bg-slate-200 text-slate-900'
                            : 'bg-slate-100 text-slate-900'
                        }`}
                      >
                        <div className="flex items-center justify-center gap-1.5 mb-1.5">
                          {idx === 0 && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-400 text-amber-950 shadow-2xs border border-amber-500">
                              <Trophy className="w-3 h-3 text-amber-900" />
                              الفائز بالترسية (#1)
                            </span>
                          )}
                          {idx === 1 && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black bg-slate-700 text-white shadow-2xs">
                              <Medal className="w-3 h-3 text-white" />
                              المرتبة الثانية (#2)
                            </span>
                          )}
                          {idx > 1 && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-200 text-slate-700">
                              المرتبة {idx + 1}
                            </span>
                          )}
                        </div>
                        <div className="text-sm sm:text-base font-black text-slate-900">
                          {col.companyName}
                        </div>
                        <div className="text-xs text-slate-600 font-normal mt-0.5">
                          {col.planName}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-200 font-bold">
                  
                  {/* Row 1: Total Earned Points out of 390 */}
                  <tr className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-5 text-start font-black text-slate-900 border-e border-slate-200 bg-slate-50/60">
                      <div className="flex items-center justify-between gap-2">
                        <span>مجموع النقاط (من 390)</span>
                        <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded-md">
                          قابل للتعديل
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 font-normal mt-0.5">78 بنداً × 5 علامات لكل بند</div>
                    </td>
                    {activeEvaluationLedger.map((col, idx) => (
                      <td key={col.proposalId} className={`py-3.5 px-4 border-e border-slate-200 text-slate-900 text-base sm:text-lg font-black tabular-nums ${idx === 0 ? 'bg-amber-50/40' : ''}`}>
                        {editingMarksProposalId === col.proposalId ? (
                          <div className="inline-flex items-center justify-center gap-1.5 bg-white p-1 rounded-xl shadow-xs border border-indigo-300">
                            <input
                              type="number"
                              min={0}
                              max={390}
                              value={tempMarksValue}
                              onChange={(e) => setTempMarksValue(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveMarks(col.proposalId);
                                if (e.key === 'Escape') setEditingMarksProposalId(null);
                              }}
                              autoFocus
                              className="w-20 px-2 py-1 text-center font-black text-sm border border-indigo-400 rounded-lg bg-indigo-50/30 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                            <button
                              type="button"
                              onClick={() => handleSaveMarks(col.proposalId)}
                              className="p-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 cursor-pointer shadow-2xs"
                              title="حفظ العلامة"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingMarksProposalId(null)}
                              className="p-1.5 rounded-lg bg-slate-200 text-slate-700 hover:bg-slate-300 cursor-pointer"
                              title="إلغاء"
                            >
                              &times;
                            </button>
                          </div>
                        ) : (
                          <div 
                            onClick={() => handleStartEditMarks(col.proposalId, col.earnedPoints)}
                            className="group inline-flex items-center justify-center gap-2 cursor-pointer hover:text-indigo-600 transition-colors px-2.5 py-1 rounded-xl hover:bg-indigo-50/80 select-none"
                            title="انقر لتعديل مجموع النقاط الفنية من 390"
                          >
                            <span>{col.earnedPoints}</span>
                            <Pencil className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 text-indigo-500 transition-opacity" />
                          </div>
                        )}
                      </td>
                    ))}
                  </tr>

                  {/* Row 2: Technical Percentage from 100% */}
                  <tr className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-5 text-start font-black text-slate-900 border-e border-slate-200 bg-slate-50/60">
                      نسبة التقييم الفني من 100%
                    </td>
                    {activeEvaluationLedger.map((col, idx) => (
                      <td key={col.proposalId} className={`py-3.5 px-4 border-e border-slate-200 text-indigo-900 text-base sm:text-lg font-black tabular-nums ${idx === 0 ? 'bg-amber-50/40' : ''}`}>
                        {col.technicalPercent}%
                      </td>
                    ))}
                  </tr>

                  {/* Row 3: 60% of Technical Evaluation */}
                  <tr className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-5 text-start font-black text-slate-900 border-e border-slate-200 bg-slate-50/60">
                      <div>60% من التقييم الفني</div>
                      <div className="text-[11px] text-slate-500 font-normal">المعادلة: (العلامة الفنية ÷ 390) × 60%</div>
                    </td>
                    {activeEvaluationLedger.map((col, idx) => (
                      <td key={col.proposalId} className={`py-3.5 px-4 border-e border-slate-200 text-sky-950 text-base sm:text-lg font-black tabular-nums ${idx === 0 ? 'bg-amber-50/40' : ''}`}>
                        <div className="flex flex-col items-center gap-1">
                          <span>{col.technical60Percent}%</span>
                          <div className="w-20 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-sky-600 rounded-full" 
                              style={{ width: `${(col.technical60Percent / 60) * 100}%` }}
                            />
                          </div>
                        </div>
                      </td>
                    ))}
                  </tr>

                  {/* Row 4: 40% of Financial Evaluation */}
                  <tr className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-5 text-start font-black text-slate-900 border-e border-slate-200 bg-slate-50/60">
                      <div>40% من التقييم المالي</div>
                      <div className="text-[11px] text-slate-500 font-normal">المعادلة: (أقل سعر ÷ سعر العرض) × 40%</div>
                    </td>
                    {activeEvaluationLedger.map((col, idx) => (
                      <td key={col.proposalId} className={`py-3.5 px-4 border-e border-slate-200 text-emerald-950 text-base sm:text-lg font-black tabular-nums ${idx === 0 ? 'bg-amber-50/40' : ''}`}>
                        <div className="flex flex-col items-center gap-1">
                          <span>{col.financial40Percent}%</span>
                          <div className="w-20 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-emerald-600 rounded-full" 
                              style={{ width: `${(col.financial40Percent / 40) * 100}%` }}
                            />
                          </div>
                        </div>
                      </td>
                    ))}
                  </tr>

                  {/* Row 5: Final Evaluation Score (High-Contrast Executive Presentation) */}
                  <tr className="border-t-2 border-b-2 border-slate-400">
                    <td className="py-4 px-5 text-start font-black text-slate-950 border-e border-slate-300 bg-slate-100 text-base sm:text-lg">
                      التقييم النهائي المعتمد
                      <div className="text-xs text-slate-600 font-medium">مجموع: الفني (60%) + المالي (40%)</div>
                    </td>
                    {activeEvaluationLedger.map((col, idx) => (
                      <td
                        key={col.proposalId}
                        className={`py-4 px-4 border-e border-slate-300 text-xl sm:text-2xl font-black tabular-nums ${
                          idx === 0
                            ? 'bg-gradient-to-b from-amber-200 via-amber-300 to-amber-400 text-slate-950 shadow-xs ring-2 ring-inset ring-amber-500'
                            : idx === 1
                            ? 'bg-gradient-to-b from-slate-200 to-slate-300 text-slate-900'
                            : 'bg-slate-100 text-slate-800'
                        }`}
                      >
                        <div className="flex flex-col items-center justify-center">
                          <span>{col.finalScore}%</span>
                          {idx === 0 && (
                            <span className="text-[11px] font-black text-amber-950 tracking-normal mt-0.5 bg-amber-100/90 px-2 py-0.5 rounded-full border border-amber-400">
                              الفائز بالترسية
                            </span>
                          )}
                          {idx === 1 && (
                            <span className="text-[11px] font-bold text-slate-800 tracking-normal mt-0.5 bg-white/80 px-2 py-0.5 rounded-full border border-slate-300">
                              المرتبة الثانية
                            </span>
                          )}
                        </div>
                      </td>
                    ))}
                  </tr>

                  {/* Row 6: Annual Premium in JOD */}
                  <tr className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-5 text-start font-black text-slate-900 border-e border-slate-200 bg-slate-50/60">
                      إجمالي القسط السنوي المعتمد
                    </td>
                    {activeEvaluationLedger.map((col, idx) => (
                      <td key={col.proposalId} className={`py-3.5 px-4 border-e border-slate-200 text-slate-900 font-black tabular-nums ${idx === 0 ? 'bg-amber-50/40 text-emerald-950' : ''}`}>
                        {col.premium.toLocaleString()} {col.currency}
                      </td>
                    ))}
                  </tr>

                  {/* Row 7: Price Variance vs Lowest Price */}
                  <tr className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-5 text-start font-black text-slate-900 border-e border-slate-200 bg-slate-50/60">
                      فارق السعر عن العرض الأقل
                    </td>
                    {activeEvaluationLedger.map((col, idx) => {
                      const diff = col.premium - lowestPremium;
                      return (
                        <td key={col.proposalId} className={`py-3.5 px-4 border-e border-slate-200 font-bold tabular-nums text-xs sm:text-sm ${idx === 0 ? 'bg-amber-50/40 text-emerald-700' : 'text-slate-600'}`}>
                          {diff === 0 ? (
                            <span className="inline-flex items-center gap-1 font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                              العرض الأقل سعراً
                            </span>
                          ) : (
                            <span>+{diff.toLocaleString()} {col.currency}</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>

                </tbody>
              </table>
            </div>

            {/* Explanatory Footer Bar */}
            <div className="bg-slate-50 p-4 border-t border-slate-200 text-xs sm:text-sm text-slate-700 font-medium space-y-1">
              <div className="flex items-center gap-2 font-bold text-slate-900">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>الملاحظات الفنية والمالية للجنة التقييم:</span>
              </div>
              <ul className="list-disc ps-5 space-y-0.5 text-slate-600">
                <li>
                  شركة (جوبيكو) حازت على المرتبة الأولى بنتيجة <strong>({winner?.finalScore}%)</strong> لتقديمها أقل سعر إجمالي (118,385 دينار) ما منحها العلامة المالية الكاملة (40%).
                </li>
                <li>
                  تم تطبيق قاعدة سقف الـ 100% (عدم منح بونص إضافي لمن زاد عن 8 زيارات كشف طبي)، مما ضمن عدالة التقييم الفني دون تضخيم غير واقعي.
                </li>
              </ul>
            </div>

          </div>

          {/* Official Committee Awarding Recommendation Card */}
          {winner && (
            <div className="bg-gradient-to-r from-amber-50 via-white to-amber-50/50 rounded-3xl border border-amber-300 p-6 sm:p-8 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="space-y-2 max-w-3xl">
                <div className="flex items-center gap-2">
                  <span className="bg-amber-400 text-amber-950 font-black px-2.5 py-0.5 rounded-full text-xs flex items-center gap-1">
                    <Trophy className="w-3.5 h-3.5" />
                    قرار الترسية القانوني
                  </span>
                  <span className="text-xs font-bold text-amber-900">
                    النتيجة النهائية: {winner.finalScore}%
                  </span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900">
                  التوصية بترسية عطاء التأمين الطبي على: {winner.companyName}
                </h3>
                <p className="text-sm text-slate-700 leading-relaxed font-medium">
                  بناءً على التقييم المشترك لعطاء التأمين الطبي (60% فني + 40% مالي)، حققت شركة ({winner.companyName}) أعلى تقييم تراكمي بمجموع ({winner.finalScore}%)، حيث قدمت أفضل عرض مالي بقسط إجمالي قدره ({winner.premium.toLocaleString()} دينار) مع مطابقة فنية رفيعة بلغت ({winner.technicalPercent}%) مستوفية 78 بنداً من اشتراطات كراسة التأمين الصحي.
                </p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-amber-300 shadow-2xs text-center shrink-0 w-full md:w-auto">
                <div className="text-xs text-slate-500 font-bold mb-1">التقييم المركب النهائي</div>
                <div className="text-4xl font-black text-amber-600 tabular-nums">
                  {winner.finalScore}%
                </div>
                <div className="text-xs text-slate-600 font-semibold mt-1">
                  فني {winner.technical60Percent}% + مالي {winner.financial40Percent}%
                </div>
              </div>
            </div>
          )}

          {/* Visual Stacked Bar Chart Comparison */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-6 space-y-4">
            <h4 className="text-base font-black text-slate-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-sky-600" />
              <span>مقارنة المساهمة الفنية (60%) والمالية (40%) لكل شركة</span>
            </h4>

            <div className="space-y-4 pt-2">
              {activeEvaluationLedger.map((item, idx) => (
                <div key={item.proposalId} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs sm:text-sm font-bold">
                    <span className="text-slate-900 flex items-center gap-2">
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-black ${
                        idx === 0 ? 'bg-amber-400 text-amber-950' : idx === 1 ? 'bg-slate-700 text-white' : 'bg-slate-200 text-slate-700'
                      }`}>
                        {idx + 1}
                      </span>
                      <span>{item.companyName}</span>
                    </span>
                    <span className="text-slate-900 font-black tabular-nums">
                      {item.finalScore}% <span className="text-slate-400 font-normal">/ 100%</span>
                    </span>
                  </div>

                  {/* Dual Segment Progress Bar */}
                  <div className="h-6 w-full bg-slate-100 rounded-xl overflow-hidden flex shadow-inner border border-slate-200">
                    {/* Technical 60% Segment */}
                    <div
                      style={{ width: `${item.technical60Percent}%` }}
                      className="bg-sky-600 text-white text-xs font-bold flex items-center justify-center transition-all"
                      title={`المساهمة الفنية: ${item.technical60Percent}%`}
                    >
                      {item.technical60Percent}% فني
                    </div>
                    {/* Financial 40% Segment */}
                    <div
                      style={{ width: `${item.financial40Percent}%` }}
                      className="bg-emerald-500 text-white text-xs font-bold flex items-center justify-center transition-all"
                      title={`المساهمة المالية: ${item.financial40Percent}%`}
                    >
                      {item.financial40Percent}% مالي
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-center gap-6 pt-3 text-xs text-slate-600 font-bold border-t border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-sky-600 inline-block" />
                <span>الوزن الفني (أقصى 60%)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-emerald-500 inline-block" />
                <span>الوزن المالي (أقصى 40%)</span>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. TAB CONTENT 2: DETAILED 78 BENCHMARK POINTS BREAKDOWN                  */}
      {/* ========================================================================= */}
      {activeReportTab === 'detailed_points' && (
        <div className="space-y-6">
          
          {/* Controls: Search, Filter, Category */}
          <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/90 shadow-xs space-y-4">
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
              
              {/* Search Bar */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute start-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="بحث في بنود الـ 78 (مثال: أدوية، أسنان، تنويم، كشف، شبكة)..."
                  className="w-full h-11 ps-10 pe-4 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              {/* Variances Only Filter Switch */}
              <button
                type="button"
                onClick={() => setFilterVariancesOnly(prev => !prev)}
                className={`h-11 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer select-none border ${
                  filterVariancesOnly
                    ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-xs'
                    : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-300'
                }`}
              >
                <SlidersHorizontal className="w-4 h-4 shrink-0" />
                <span>{filterVariancesOnly ? 'إظهار البنود ذات الفروقات فقط (مفعل)' : 'تصفية الفروقات بين الشركات'}</span>
              </button>

              {/* Benchmark Mode Toggle */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setBenchmarkMode(m => m === 'official_78_benchmark' ? 'active_loaded' : 'official_78_benchmark')}
                  className="h-11 px-3.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-800 bg-slate-50 hover:bg-slate-100 flex items-center gap-2 cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4 text-indigo-600" />
                  <span>
                    {benchmarkMode === 'official_78_benchmark' ? 'المعيار الرسمي 78 بنداً (390 علامة)' : 'البنود المحملة الحالية'}
                  </span>
                </button>
              </div>

            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              <button
                type="button"
                onClick={() => setCategoryFilter('all')}
                className={`h-8 px-3.5 rounded-lg text-xs font-bold transition-colors cursor-pointer shrink-0 ${
                  categoryFilter === 'all'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                كافة الأقسام ({activeItems.length})
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategoryFilter(cat)}
                  className={`h-8 px-3 rounded-lg text-xs font-bold transition-colors cursor-pointer shrink-0 ${
                    categoryFilter === cat
                      ? 'bg-sky-600 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {cat.split('(')[0].trim()}
                </button>
              ))}
            </div>

          </div>

          {/* Detailed Points Table */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between gap-4">
              <div>
                <h3 className="font-extrabold text-sm sm:text-base text-amber-300">
                  سجل تفريغ درجات الـ 78 بنداً (لكل بند 5 علامات)
                </h3>
                <p className="text-xs text-slate-300">
                  إظهار ({filteredDetailedItems.length}) من أصل ({activeItems.length}) بنداً
                </p>
              </div>
              <span className="text-xs font-bold bg-white/10 px-3 py-1 rounded-lg">
                الإجمالي: 390 علامة فنية
              </span>
            </div>

            <div className="overflow-x-auto max-h-[75vh] overflow-y-auto custom-scrollbar relative">
              <table className="w-full text-start border-collapse text-xs sm:text-sm">
                <thead className="sticky top-0 z-30 shadow-md bg-slate-900">
                  <tr className="bg-slate-900 text-white border-b-2 border-slate-700 font-black">
                    <th className="sticky top-0 z-30 py-3.5 px-3 w-12 text-center bg-slate-900 text-white border-e border-slate-700 shadow-xs">#</th>
                    <th className="sticky top-0 z-30 py-3.5 px-4 min-w-[220px] bg-slate-900 text-white border-e border-slate-700 shadow-xs">{isRtl ? 'بند المقارنة والتصنيف' : 'Comparison Item'}</th>
                    <th className="sticky top-0 z-30 py-3.5 px-4 min-w-[180px] bg-sky-950 text-sky-200 border-e border-slate-700 shadow-xs">
                      {isRtl ? 'المعيار المطلوب (كراسة الشروط)' : 'RFP Benchmark'}
                    </th>
                    {activeProposals.map(p => (
                      <th key={p.id} className="sticky top-0 z-30 py-3.5 px-3 min-w-[160px] bg-slate-800 text-white border-e border-slate-700 text-center shadow-xs">
                        <div className="font-extrabold text-white text-xs sm:text-sm">{(p?.companyName || '').split('(')[0]}</div>
                        <div className="text-[11px] font-medium text-slate-300">{isRtl ? 'العرض / العلامة من 5' : 'Offer / Mark / 5'}</div>
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-200">
                  {filteredDetailedItems.map((item, idx) => (
                    <tr key={item.id || idx} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-3 text-center font-bold text-slate-500 border-e border-slate-200">
                        {idx + 1}
                      </td>
                      <td className="py-3 px-4 border-e border-slate-200">
                        <div className="font-bold text-slate-900">{item.name}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">{item.category}</div>
                      </td>
                      <td className="py-3 px-4 border-e border-slate-200 font-bold text-sky-950 bg-sky-50/30">
                        {String(item.targetValue)} {item.unit || ''}
                      </td>

                      {activeProposals.map(p => {
                        const off = p.benefits ? p.benefits[item.id] : undefined;
                        const offeredVal = off ? off.offeredValue : item.targetValue;
                        const scoreOutOf5 = off?.isIncluded === false ? 0 : 5;

                        return (
                          <td key={p.id} className="py-3 px-3 border-e border-slate-200 text-center">
                            <div className="text-xs font-semibold text-slate-900 truncate max-w-[160px]" title={String(offeredVal)}>
                              {String(offeredVal)}
                            </div>
                            <div className="mt-1">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold ${
                                scoreOutOf5 === 5
                                  ? 'bg-emerald-100 text-emerald-900'
                                  : 'bg-rose-100 text-rose-900'
                              }`}>
                                {scoreOutOf5 === 5 && <Check className="w-3 h-3 text-emerald-600" />}
                                {scoreOutOf5} / 5
                              </span>
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. TAB CONTENT 3: FINANCIAL & ACTUARIAL LEDGER                            */}
      {/* ========================================================================= */}
      {activeReportTab === 'financial_ledger' && (
        <div className="space-y-6">
          <OfficialFinancialEvaluationMatrix 
            proposals={proposals} 
            census={census || DEFAULT_DEMOGRAPHIC_CENSUS} 
            onToggleExcludeProposal={onToggleExcludeProposal}
            onUpdateProposals={onUpdateProposals}
            showTitle={true}
          />
        </div>
      )}

    </div>
  );
};
