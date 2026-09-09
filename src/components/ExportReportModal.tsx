import React, { useState } from 'react';
import { 
  FileSpreadsheet, 
  Printer, 
  X, 
  ShieldCheck, 
  Award, 
  ArrowRight, 
  ArrowLeft,
  Download,
  Loader2,
  FileText
} from 'lucide-react';
import { BenefitRequirement, CompanyProposal, DemographicCensus } from '../types';
import { useI18n } from '../i18n/I18nContext';
import { calculateOfficialTenderLedger, DEFAULT_DEMOGRAPHIC_CENSUS } from '../utils/actuarialCalculator';
import { exportTenderToExcel, exportTenderToPDF } from '../utils/exportHelpers';

interface ExportReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  requirements: BenefitRequirement[];
  proposals: CompanyProposal[];
  census?: DemographicCensus;
  onNavigateToReports?: () => void;
}

export const ExportReportModal: React.FC<ExportReportModalProps> = ({
  isOpen,
  onClose,
  requirements,
  proposals,
  census = DEFAULT_DEMOGRAPHIC_CENSUS,
  onNavigateToReports
}) => {
  const { t, isRtl } = useI18n();
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [exportSuccess, setExportSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const ledger = calculateOfficialTenderLedger(proposals, 78, census);
  const winner = ledger[0];

  const handleDownloadExcel = () => {
    try {
      exportTenderToExcel(proposals, requirements, census, isRtl);
      setExportSuccess(isRtl ? 'تم تصدير ملف الإكسل (Excel) بنجاح!' : 'Excel file exported successfully!');
      setTimeout(() => setExportSuccess(null), 3000);
    } catch (err) {
      console.error('Failed to export Excel:', err);
    }
  };

  const handleDownloadPDF = async () => {
    setIsExportingPdf(true);
    try {
      // First try to export from reports view if rendered, otherwise fallback to printable
      await exportTenderToPDF(null, `تقرير_ترسية_عطاء_التأمين_الطبي_${new Date().toISOString().split('T')[0]}.pdf`);
      setExportSuccess(isRtl ? 'تم تحميل مستند PDF بنجاح!' : 'PDF downloaded successfully!');
      setTimeout(() => setExportSuccess(null), 3000);
    } catch (err) {
      console.error('PDF export failed:', err);
      window.print();
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportJSON = () => {
    const data = {
      generatedAt: new Date().toISOString(),
      evaluationPolicy: 'Strict 100% Capping on Surplus Features (Zero Inflation Bonus)',
      census,
      requirements,
      proposals,
      officialLedger: ledger
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Insurance_Evaluation_Session_${Date.now()}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <div>
            <h3 className="text-xl font-black text-slate-900 tracking-tight">
              {isRtl ? 'تصدير وطباعة تقارير العطاء الرسمية' : 'Export & Print Official Tender Reports'}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {isRtl 
                ? 'تصدير فوري بصيغتي Excel و PDF لجداول المفاضلة، محضر الترسية، وتفريغ الـ 78 بنداً' 
                : 'Instant export to Excel (.xlsx) and PDF (.pdf) for official committee records'}
            </p>
          </div>
          <button 
            type="button"
            onClick={onClose} 
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success Alert */}
        {exportSuccess && (
          <div className="my-4 p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-bold flex items-center gap-2">
            <span>✓</span>
            <span>{exportSuccess}</span>
          </div>
        )}

        {/* Executive Summary Card */}
        <div className="my-5 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2.5">
          <div className="flex items-center justify-between font-semibold text-slate-700">
            <span>{isRtl ? 'عدد عروض الشركات الخاضعة للتقييم:' : 'Proposals Evaluated:'}</span>
            <span className="font-bold text-slate-900">{proposals.length} {t('companiesCount')}</span>
          </div>
          <div className="flex items-center justify-between font-semibold text-slate-700">
            <span>{isRtl ? 'بنود المقارنة الفنية:' : 'Benchmark Items:'}</span>
            <span className="font-bold text-slate-900">{requirements.length || 78} {isRtl ? 'بنداً (390 علامة)' : 'items (390 marks)'}</span>
          </div>
          {winner && (
            <div className="flex items-center justify-between font-semibold text-slate-700">
              <span>{isRtl ? 'العرض الموصى به للترسية (المرتبة الأولى):' : 'Award Recommendation (Rank #1):'}</span>
              <span className="font-bold text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-300">
                {winner.companyName} ({winner.compositeScore}% - {winner.premiumAnnual.toLocaleString()} د.أ)
              </span>
            </div>
          )}
          <div className="flex items-center justify-between font-semibold text-slate-700">
            <span>{isRtl ? 'سياسة احتساب السقوف:' : 'Capping Policy:'}</span>
            <span className="inline-flex items-center gap-1 font-bold text-emerald-700">
              <ShieldCheck className="w-3.5 h-3.5" />
              {isRtl ? 'سقف 100% صارم (بدون احتساب أي بونص)' : 'Strict 100% Cap (Zero Bonus)'}
            </span>
          </div>
        </div>

        {/* Shortcut to full on-screen report */}
        {onNavigateToReports && (
          <div className="mb-5">
            <button
              type="button"
              onClick={() => {
                onClose();
                onNavigateToReports();
              }}
              className="w-full p-4 rounded-2xl bg-amber-50 hover:bg-amber-100/80 border border-amber-300 transition-all flex items-center justify-between gap-3 text-start cursor-pointer shadow-2xs group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-black text-slate-900 flex items-center gap-2">
                    <span>{isRtl ? 'عرض التقرير النهائي الشامل (390 علامة)' : 'View Full 390-Point Award Report'}</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-300 text-amber-950">
                      60% فني + 40% مالي
                    </span>
                  </div>
                  <div className="text-xs text-slate-600 font-medium mt-0.5">
                    {isRtl ? 'استعراض مصفوفة المفاضلة، توقيعات اللجنة، وهوامش الوفر في شاشة كاملة' : 'Interactive matrix, signatures block, and savings overview'}
                  </div>
                </div>
              </div>

              {isRtl ? (
                <ArrowLeft className="w-5 h-5 text-amber-700 shrink-0 group-hover:-translate-x-1 transition-transform" />
              ) : (
                <ArrowRight className="w-5 h-5 text-amber-700 shrink-0 group-hover:translate-x-1 transition-transform" />
              )}
            </button>
          </div>
        )}

        {/* Export Action Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          
          {/* Excel Export */}
          <button
            type="button"
            onClick={handleDownloadExcel}
            className="p-4 rounded-2xl border-2 border-slate-200 hover:border-emerald-500 bg-white hover:bg-emerald-50/50 text-start transition-all group flex flex-col justify-between cursor-pointer shadow-2xs"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div className="font-black text-slate-900 text-sm">
                {isRtl ? 'تصدير إكسل (Excel .xlsx)' : 'Export Excel (.xlsx)'}
              </div>
              <div className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                {isRtl 
                  ? 'ملف إكسل (ورقتين): مصفوفة مقارنة شركات التأمين للعاملين مع تقييم كل منفعة + التقييم المالي والترسية' 
                  : 'Two-sheet workbook: Employee benefit comparison matrix with per-benefit scores + Financial & Award matrix'}
              </div>
            </div>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 mt-3">
              <Download className="w-3.5 h-3.5" />
              <span>{isRtl ? 'تحميل .xlsx' : 'Download .xlsx'}</span>
            </span>
          </button>

          {/* PDF Direct Download */}
          <button
            type="button"
            onClick={handleDownloadPDF}
            disabled={isExportingPdf}
            className="p-4 rounded-2xl border-2 border-slate-200 hover:border-rose-500 bg-white hover:bg-rose-50/50 text-start transition-all group flex flex-col justify-between cursor-pointer shadow-2xs disabled:opacity-50"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                {isExportingPdf ? (
                  <Loader2 className="w-5 h-5 animate-spin text-rose-600" />
                ) : (
                  <Download className="w-5 h-5" />
                )}
              </div>
              <div className="font-black text-slate-900 text-sm">
                {isRtl ? 'تحميل مستند PDF (.pdf)' : 'Download PDF (.pdf)'}
              </div>
              <div className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                {isRtl 
                  ? 'حفظ تقرير التقييم والترسية الرسمي كملف PDF عالي الدقة وجاهز للأرشفة' 
                  : 'Save official tender award report as standalone high-res PDF file'}
              </div>
            </div>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 mt-3">
              <Download className="w-3.5 h-3.5" />
              <span>{isExportingPdf ? (isRtl ? 'جاري التحضير...' : 'Exporting...') : (isRtl ? 'تحميل PDF' : 'Download PDF')}</span>
            </span>
          </button>

          {/* Browser Print */}
          <button
            type="button"
            onClick={handlePrint}
            className="p-4 rounded-2xl border-2 border-slate-200 hover:border-sky-500 bg-white hover:bg-sky-50/50 text-start transition-all group flex flex-col justify-between cursor-pointer shadow-2xs"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Printer className="w-5 h-5" />
              </div>
              <div className="font-black text-slate-900 text-sm">
                {isRtl ? 'طباعة رسمية (Print)' : 'Print to Paper / PDF'}
              </div>
              <div className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                {isRtl 
                  ? 'طباعة فورية عبر المتصفح مع ضبط التنسيق لورق A4 ومحاضر التوقيع' 
                  : 'Direct browser print dialogue formatted for A4 printing and signatures'}
              </div>
            </div>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-sky-700 mt-3">
              <Printer className="w-3.5 h-3.5" />
              <span>{isRtl ? 'فتح الطباعة' : 'Open Print'}</span>
            </span>
          </button>

        </div>

        {/* Footer Actions */}
        <div className="mt-6 pt-4 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={handleExportJSON}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>{isRtl ? 'تصدير نسخة احتياطية (JSON)' : 'Export Backup Data (JSON)'}</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors cursor-pointer"
          >
            {isRtl ? 'إغلاق' : 'Close'}
          </button>
        </div>

      </div>
    </div>
  );
};
