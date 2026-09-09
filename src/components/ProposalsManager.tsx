import React, { useState } from 'react';
import { 
  Upload, 
  FileText, 
  Sparkles, 
  Trash2, 
  DollarSign, 
  Building2, 
  ShieldCheck, 
  AlertCircle, 
  X,
  ChevronRight,
  RefreshCw,
  Plus,
  Coins,
  Calculator,
  FileCheck
} from 'lucide-react';
import { BenefitRequirement, CompanyProposal } from '../types';
import { DEMO_COMPANY_PROPOSALS } from '../data/presetData';
import { useI18n } from '../i18n/I18nContext';
import { evaluateProposal } from '../utils/scoringEngine';
import { TenderTermsForensicViewer } from './TenderTermsForensicViewer';
import { localizeCompanyName, localizePlanName } from '../utils/termsTranslation';
import { authFetch } from '../utils/authInterceptor';
import { 
  mergeProposalsList, 
  isSameInsuranceCompany, 
  isSameProposal, 
  findDuplicateProposalClusters, 
  mergeCompanyProposals, 
  getCanonicalInsuranceCompanyName 
} from '../utils/proposalMerger';
import { formatFeeRate, DEFAULT_DEMOGRAPHIC_CENSUS } from '../utils/actuarialCalculator';

interface ProposalsManagerProps {
  proposals: CompanyProposal[];
  requirements: BenefitRequirement[];
  onUpdateProposals: (newProposals: CompanyProposal[]) => void;
  onNavigateToRankings: () => void;
  onNavigatePrev?: () => void;
  onClearProposals?: () => void;
  onLoadRealProposals?: () => void;
  onNavigateToActuarial?: () => void;
}

export const ProposalsManager: React.FC<ProposalsManagerProps> = ({
  proposals,
  requirements,
  onUpdateProposals,
  onNavigateToRankings,
  onNavigatePrev,
  onClearProposals,
  onLoadRealProposals,
  onNavigateToActuarial
}) => {
  const { t, isRtl, language } = useI18n();
  const [selectedProposalId, setSelectedProposalId] = useState<string | null>(
    proposals.length > 0 ? proposals[0].id : null
  );
  const [isExtracting, setIsExtracting] = useState<boolean>(false);
  const [extractProgress, setExtractProgress] = useState<string>('');
  const [extractError, setExtractError] = useState<string | null>(null);
  const [mergeSuccessMessage, setMergeSuccessMessage] = useState<string | null>(null);

  // Quick Paste Proposal Text Modal
  const [showPasteModal, setShowPasteModal] = useState<boolean>(false);
  const [pastedText, setPastedText] = useState<string>('');
  const [pasteCompanyName, setPasteCompanyName] = useState<string>('');

  // Manual Merge Two Offers Modal
  const [showManualMergeModal, setShowManualMergeModal] = useState<boolean>(false);
  const [manualMergeFirstId, setManualMergeFirstId] = useState<string>('');
  const [manualMergeSecondId, setManualMergeSecondId] = useState<string>('');
  const [manualMergeTargetName, setManualMergeTargetName] = useState<string>('');

  // Detect unmerged duplicate proposals in the current list
  const duplicateClusters = React.useMemo(() => {
    return findDuplicateProposalClusters(proposals);
  }, [proposals]);

  // Per-member rate to Total Contract Premium calculator
  const [showCalculator, setShowCalculator] = useState<boolean>(false);
  const [calcPerMemberRate, setCalcPerMemberRate] = useState<number>(510);
  const [calcMembersCount, setCalcMembersCount] = useState<number>(1000);

  const currentSelectedProposal = proposals.find((p) => p.id === selectedProposalId) || proposals[0];

  // Handle uploading proposal files (PDFs, Images, Text)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsExtracting(true);
    setExtractError(null);

    const newlyExtracted: CompanyProposal[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setExtractProgress(`${t('extracting')} ${i + 1} / ${files.length}: ${file.name}...`);

      try {
        const base64Data = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (event) => {
            const res = event.target?.result as string;
            resolve(res.split(',')[1] || res);
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        const res = await authFetch('/api/ai-extract-proposal', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileBase64: base64Data,
            mimeType: file.type || 'application/pdf',
            fileName: file.name,
            requirements,
            language: language || (isRtl ? 'ar' : 'en')
          })
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || `Failed to extract from ${file.name}`);
        }

        const extractedProposal = await res.json();
        newlyExtracted.push(extractedProposal);
      } catch (err: any) {
        console.error('Extraction error on file:', file.name, err);
        setExtractError(`Error extracting from ${file.name}: ${err.message}`);
      }
    }

    if (newlyExtracted.length > 0) {
      // Manual mode: every uploaded file is added as an individual proposal without auto-merging
      const updatedList = [...proposals, ...newlyExtracted];
      onUpdateProposals(updatedList);
      setSelectedProposalId(newlyExtracted[0].id || updatedList[0]?.id || null);
      setMergeSuccessMessage(
        isRtl
          ? `✓ تم بنجاح إضافة ${newlyExtracted.length} ملفات كعروض مستقلة. يمكنك دمج أي عرضين يدوياً عبر زر "دمج يدوي بين عرضين".`
          : `✓ Successfully added ${newlyExtracted.length} files as separate proposals. You can merge any offers manually.`
      );
    }

    setIsExtracting(false);
    setExtractProgress('');
  };

  const handlePasteExtract = async () => {
    if (!pastedText.trim()) return;
    setIsExtracting(true);
    setExtractError(null);
    setExtractProgress(t('extracting'));

    try {
      const res = await authFetch('/api/ai-extract-proposal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentText: pastedText,
          fileName: `${pasteCompanyName || 'Custom'}_Proposal.txt`,
          requirements,
          language: language || (isRtl ? 'ar' : 'en')
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to extract proposal.');
      }

      const extracted = await res.json();
      if (pasteCompanyName.trim()) {
        extracted.companyName = pasteCompanyName.trim();
      }

      // Manual mode: append as an individual proposal without auto-merging
      const updatedList = [...proposals, extracted];
      onUpdateProposals(updatedList);
      setSelectedProposalId(extracted.id);
      setMergeSuccessMessage(
        isRtl
          ? `✓ تم بنجاح إضافة العرض لـ (${extracted.companyName}).`
          : `✓ Successfully added proposal for (${extracted.companyName}).`
      );

      setShowPasteModal(false);
      setPastedText('');
      setPasteCompanyName('');
    } catch (err: any) {
      setExtractError(err.message);
    } finally {
      setIsExtracting(false);
      setExtractProgress('');
    }
  };

  // Consolidate any duplicate companies already loaded
  const handleConsolidateDuplicates = () => {
    if (proposals.length <= 1) return;
    const { updatedList, mergedCount, mergedCompanyNames } = mergeProposalsList([], proposals);
    if (mergedCount > 0) {
      onUpdateProposals(updatedList);
      const currentSelected = updatedList.find(p => p.id === selectedProposalId);
      if (!currentSelected && updatedList.length > 0) {
        setSelectedProposalId(updatedList[0].id);
      }
      setMergeSuccessMessage(
        isRtl
          ? `✓ تم بنجاح دمج وتوحيد ${mergedCount} عروض مكررة لنفس الشركات (${mergedCompanyNames.join('، ')})!`
          : `✓ Successfully merged ${mergedCount} duplicate proposals for (${mergedCompanyNames.join(', ')})!`
      );
    } else {
      setMergeSuccessMessage(
        isRtl
          ? '✓ جميع العروض الحالية لشركات منفصلة ولا توجد عروض مكررة لنفس الشركة.'
          : '✓ All current proposals are unique.'
      );
    }
  };

  const handleOpenManualMergeModal = (presetFirstId?: string, presetSecondId?: string) => {
    if (proposals.length < 2) return;
    const first = presetFirstId || proposals[0].id;
    const second = presetSecondId || (proposals.find(p => p.id !== first)?.id || proposals[1].id);
    setManualMergeFirstId(first);
    setManualMergeSecondId(second);

    const p1 = proposals.find(p => p.id === first);
    const p2 = proposals.find(p => p.id === second);
    const resolvedCanonical = getCanonicalInsuranceCompanyName(p1?.companyName || p2?.companyName || '');
    setManualMergeTargetName(resolvedCanonical);
    setShowManualMergeModal(true);
  };

  const handleExecuteManualMerge = () => {
    const p1 = proposals.find(p => p.id === manualMergeFirstId);
    const p2 = proposals.find(p => p.id === manualMergeSecondId);
    if (!p1 || !p2 || p1.id === p2.id) return;

    const { merged } = mergeCompanyProposals(p1, p2, DEFAULT_DEMOGRAPHIC_CENSUS);
    if (manualMergeTargetName.trim()) {
      merged.companyName = manualMergeTargetName.trim();
    }
    const remaining = proposals.filter(p => p.id !== p1.id && p.id !== p2.id);
    const updated = [merged, ...remaining];
    onUpdateProposals(updated);
    setSelectedProposalId(merged.id);
    setShowManualMergeModal(false);
    setMergeSuccessMessage(
      isRtl
        ? `✓ تم بنجاح دمج العرضين المحددين في ملف موحد لـ (${merged.companyName})!`
        : `✓ Successfully merged both selected proposals into (${merged.companyName})!`
    );
  };

  const handleDeleteProposal = (id: string) => {
    const updated = proposals.filter((p) => p.id !== id);
    onUpdateProposals(updated);
    if (selectedProposalId === id) {
      setSelectedProposalId(updated[0]?.id || null);
    }
  };

  const handleCreateBlankProposal = () => {
    const newId = `prop_${Date.now()}`;
    const defaultBenefits: Record<string, any> = {};
    requirements.forEach((req) => {
      defaultBenefits[req.id] = {
        offeredValue: req.type === 'boolean' ? true : req.targetValue,
        isIncluded: true,
        notes: ''
      };
    });

    const newProposal: CompanyProposal = {
      id: newId,
      companyName: isRtl ? `شركة تأمين جديدة (${proposals.length + 1})` : `New Insurance Company (${proposals.length + 1})`,
      planName: isRtl ? 'خطة الرعاية الشاملة' : 'Comprehensive Plan',
      premiumAnnual: 850000,
      currency: '$',
      deductibleGeneral: '10%',
      networkName: 'Network Tier A',
      submissionDate: new Date().toISOString().split('T')[0],
      benefits: defaultBenefits,
      extraFeatures: []
    };

    onUpdateProposals([...proposals, newProposal]);
    setSelectedProposalId(newId);
  };

  const handleUpdateBenefitValue = (
    proposalId: string,
    reqId: string,
    offeredVal: any,
    isIncluded: boolean = true
  ) => {
    const updated = proposals.map((p) => {
      if (p.id !== proposalId) return p;
      return {
        ...p,
        benefits: {
          ...p.benefits,
          [reqId]: {
            ...p.benefits[reqId],
            offeredValue: offeredVal,
            isIncluded
          }
        }
      };
    });
    onUpdateProposals(updated);
  };

  const handleUpdateProposalMeta = (proposalId: string, field: string, value: any) => {
    const updated = proposals.map((p) => {
      if (p.id !== proposalId) return p;
      return { ...p, [field]: value };
    });
    onUpdateProposals(updated);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner & Upload Station */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                {t('propManagerTitle')}
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                {proposals.length} {t('uploadedProposalsCount')}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
              {t('propManagerSubtitle')}
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {proposals.length > 0 && onClearProposals && (
              <button
                id="btn-clear-proposals"
                onClick={onClearProposals}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors cursor-pointer"
                title="مسح كافة عروض الشركات والبدء من جديد"
              >
                <Trash2 className="w-4 h-4 text-rose-600" />
                <span>{isRtl ? 'مسح العروض' : 'Clear Proposals'}</span>
              </button>
            )}

            <button
              id="btn-add-blank-proposal"
              onClick={handleCreateBlankProposal}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-200 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4 text-sky-600" />
              <span>{isRtl ? 'إضافة شركة يدوياً' : 'Add Insurer Manually'}</span>
            </button>

            {proposals.length > 1 && (
              <button
                id="btn-open-manual-merge"
                onClick={() => handleOpenManualMergeModal()}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 transition-colors cursor-pointer"
                title={isRtl ? 'دمج مخصص بين أي عرضين مختارين وتوحيدهما في ملف واحد' : 'Manually choose two offers to merge'}
              >
                <FileCheck className="w-4 h-4 text-indigo-600" />
                <span>{isRtl ? 'دمج يدوي بين عرضين (فني + مالي)' : 'Manual Merge Offers'}</span>
              </button>
            )}

            <button
              id="btn-paste-proposal"
              onClick={() => setShowPasteModal(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors border border-slate-200 cursor-pointer"
            >
              <FileText className="w-4 h-4 text-slate-600" />
              <span>{t('pasteOfferBtn')}</span>
            </button>

            <button
              id="btn-load-demo-proposals"
              onClick={() => {
                onUpdateProposals(DEMO_COMPANY_PROPOSALS);
                setSelectedProposalId(DEMO_COMPANY_PROPOSALS[0].id);
              }}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-4 h-4 text-slate-500" />
              <span>{t('loadDemoInsurersBtn')}</span>
            </button>

            <button
              id="btn-go-to-rankings"
              onClick={onNavigateToRankings}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-xs cursor-pointer"
            >
              <span>{t('calculateRankingsBtn')}</span>
              <ChevronRight className={`w-4 h-4 ${isRtl ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>

        {/* Multi-file Upload Zone with Smart Merge Note */}
        <div className="mt-5">
          <div className="border-2 border-dashed border-sky-200 hover:border-sky-500 bg-sky-50/40 rounded-2xl p-6 text-center transition-all cursor-pointer">
            <input
              type="file"
              id="multi-proposal-input"
              multiple
              accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.txt,.csv"
              onChange={handleFileUpload}
              className="hidden"
            />
            <label
              htmlFor="multi-proposal-input"
              className="cursor-pointer flex flex-col items-center justify-center gap-2"
            >
              <div className="w-12 h-12 rounded-full bg-sky-100 text-sky-600 flex items-center justify-center shadow-xs">
                <Upload className="w-6 h-6" />
              </div>
              <div className="font-bold text-slate-900 text-sm">
                {t('dropOfferFiles')}
              </div>
              <p className="text-xs text-slate-500 max-w-md">
                {t('dropOfferSub')}
              </p>
              <div className="mt-1 inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 border border-indigo-200/80 rounded-full text-xs font-semibold text-indigo-900">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                <span>
                  {isRtl
                    ? 'الدمج يدوي حسب الطلب: يتم رفع كل ملف بشكل مستقل، ويمكنك في أي وقت دمج العرض الفني والمالي لأي شركة يدوياً عبر زر "دمج يدوي بين عرضين".'
                    : 'Manual Merge Mode: Each file is added as an independent proposal. You can merge any technical & financial offers manually using "Manual Merge".'}
                </span>
              </div>
            </label>
          </div>
        </div>

        {/* Extraction Progress Indicator */}
        {isExtracting && (
          <div className="mt-4 p-4 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center gap-3 animate-pulse">
            <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin shrink-0" />
            <div className="text-xs font-semibold text-indigo-900">
              {extractProgress || t('extracting')}
            </div>
          </div>
        )}

        {/* Merge Success Banner */}
        {mergeSuccessMessage && (
          <div className="mt-4 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2">
              <FileCheck className="w-4.5 h-4.5 text-emerald-600 shrink-0" />
              <span className="font-bold">{mergeSuccessMessage}</span>
            </div>
            <button
              onClick={() => setMergeSuccessMessage(null)}
              className="text-emerald-700 hover:text-emerald-900 p-1 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Unmerged Duplicates Detection Alert */}
        {duplicateClusters.length > 0 && (
          <div className="mt-4 p-4 rounded-xl bg-amber-50 border-2 border-amber-300 text-amber-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-start sm:items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700 shrink-0 border border-amber-200">
                <FileCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs sm:text-sm font-bold text-amber-900 flex items-center gap-2">
                  <span>
                    {isRtl
                      ? `تم رصد عروض متعددة لنفس الشركة بحاجة للدمج: (${duplicateClusters.map(d => d.canonicalName).join('، ')})`
                      : `Multiple offers detected for same insurer: (${duplicateClusters.map(d => d.canonicalName).join(', ')})`}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-200 text-amber-900">
                    {duplicateClusters.reduce((acc, c) => acc + c.count, 0)} {isRtl ? 'ملفات' : 'files'}
                  </span>
                </div>
                <p className="text-[11px] sm:text-xs text-amber-800 mt-0.5">
                  {isRtl
                    ? 'يوجد عرض فني وعرض مالي منفصلين للشركة. اضغط لفتح نافذة الدمج اليدوي لمراجعة وتوحيد العرضين.'
                    : 'Separate technical and financial offers detected. Click to open manual merge to review and consolidate.'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
              <button
                type="button"
                id="btn-quick-merge-duplicates"
                onClick={() => {
                  const cluster = duplicateClusters[0];
                  if (cluster && cluster.proposals.length >= 2) {
                    handleOpenManualMergeModal(cluster.proposals[0].id, cluster.proposals[1].id);
                  } else {
                    handleOpenManualMergeModal();
                  }
                }}
                className="w-full sm:w-auto px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs sm:text-sm font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <FileCheck className="w-4 h-4" />
                <span>{isRtl ? '⚡ فتح نافذة الدمج اليدوي' : '⚡ Open Manual Merge'}</span>
              </button>
            </div>
          </div>
        )}

        {extractError && (
          <div className="mt-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{extractError}</span>
          </div>
        )}
      </div>

      {/* Main Split View or Empty State */}
      {proposals.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-12 text-center shadow-xs max-w-2xl mx-auto space-y-4 my-4">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto border border-indigo-100 shadow-xs">
            <Building2 className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              {isRtl ? 'لا توجد عروض شركات تأمين مرفوعة حالياً (جلسة جديدة)' : 'No Insurer Proposals Uploaded Yet (Fresh Session)'}
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-md mx-auto leading-relaxed">
              {isRtl 
                ? 'ارفع ملفات عروض الشركات (PDF أو صور أو جداول) أو الصق نصوص عروض الأسعار ليتم مطابقتها مع المنافع المطلوبة.'
                : 'Upload insurer quote files (PDF/Images/Excel) or paste quote text to map against your required benefits.'}
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={() => setShowPasteModal(true)}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold text-xs sm:text-sm hover:bg-indigo-700 transition-colors shadow-xs cursor-pointer flex items-center gap-2"
            >
              <FileText className="w-4 h-4" />
              <span>{t('pasteOfferBtn')}</span>
            </button>
            <label
              htmlFor="multi-proposal-input"
              className="px-4 py-2.5 rounded-xl bg-sky-600 text-white font-semibold text-xs sm:text-sm hover:bg-sky-700 transition-colors shadow-xs cursor-pointer flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              <span>{isRtl ? 'رفع ملفات العروض' : 'Upload Quote Files'}</span>
            </label>
            {(onLoadRealProposals || onUpdateProposals) && (
              <button
                onClick={() => {
                  if (onLoadRealProposals) {
                    onLoadRealProposals();
                  } else {
                    onUpdateProposals(DEMO_COMPANY_PROPOSALS);
                    setSelectedProposalId(DEMO_COMPANY_PROPOSALS[0].id);
                  }
                }}
                className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-semibold text-xs sm:text-sm hover:bg-slate-200 border border-slate-200 transition-colors cursor-pointer flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4 text-slate-500" />
                <span>{t('loadDemoInsurersBtn')}</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Proposals Cards List (4 cols) */}
        <div className="lg:col-span-4 space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {t('proposalsTab')} ({proposals.length})
            </h3>
            <span className="text-[11px] text-slate-400">{t('clickToInspect')}</span>
          </div>

          {proposals.map((p) => {
            const isSelected = p.id === (currentSelectedProposal?.id);
            const evalRes = evaluateProposal(p, requirements, language);

            return (
              <div
                key={p.id}
                onClick={() => setSelectedProposalId(p.id)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer text-start ${
                  isSelected
                    ? 'bg-sky-50/70 border-sky-400 shadow-md ring-1 ring-sky-300'
                    : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-2xs'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <Building2 className={`w-4 h-4 shrink-0 ${isSelected ? 'text-sky-600' : 'text-slate-500'}`} />
                      <h4 className="font-bold text-sm text-slate-900 truncate">
                        {localizeCompanyName(p.companyName, language || (isRtl ? 'ar' : 'en'))}
                      </h4>
                    </div>
                    <div className="text-xs text-slate-500 truncate mt-0.5">
                      {localizePlanName(p.planName, language || (isRtl ? 'ar' : 'en'))}
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteProposal(p.id);
                    }}
                    className="text-slate-400 hover:text-rose-600 p-1 rounded-lg hover:bg-rose-50 transition-colors shrink-0 cursor-pointer"
                    title="Remove proposal"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="mt-2.5 flex items-center justify-between text-[11px]">
                  <span className="text-slate-500 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-600" />
                    <span>{t('confirmedCompliance')}:</span>
                  </span>
                  <span className="font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-md">
                    {evalRes.confirmedMatchPercentage}% ({evalRes.confirmedMetCount}/{requirements.length})
                  </span>
                </div>

                {/* Forensic terms & conditions audited tag */}
                <div className="mt-1.5 flex items-center gap-1 text-[10px] text-indigo-700 bg-indigo-50/90 border border-indigo-200/80 px-2 py-0.5 rounded-md">
                  <FileCheck className="w-3 h-3 text-indigo-600 shrink-0" />
                  <span className="truncate">
                    {isRtl ? 'تدقيق دقيق لنص الشروط والرسوم القانونية' : 'Forensic Terms & Statutory Fees Audited'}
                  </span>
                </div>

                <div className="mt-2.5 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1 font-bold text-slate-800" title={t('totalAnnualContractPremium')}>
                    <Coins className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{p.premiumAnnual.toLocaleString()}</span>
                    <span className="text-[10px] text-slate-500 font-medium">{p.currency || (isRtl ? 'دينار' : 'JOD')}</span>
                  </div>

                  <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600">
                    {t('overallScoreLabel')}: {evalRes.totalScore}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Column: Selected Proposal Detail & In-Depth Benefit Editor (8 cols) */}
        <div className="lg:col-span-8">
          {currentSelectedProposal ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-5">
              
              {/* Proposal Header Info */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <input
                      type="text"
                      value={currentSelectedProposal.companyName}
                      onChange={(e) =>
                        handleUpdateProposalMeta(currentSelectedProposal.id, 'companyName', e.target.value)
                      }
                      className="text-lg font-bold text-slate-900 border-b border-transparent hover:border-slate-300 focus:border-sky-500 focus:outline-none px-1"
                    />
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-sky-100 text-sky-800 font-medium">
                      {currentSelectedProposal.networkName || 'Direct Billing'}
                    </span>
                    {currentSelectedProposal.sourceFileName?.includes('+') && (
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold border border-emerald-300 flex items-center gap-1">
                        <FileCheck className="w-3 h-3 text-emerald-600" />
                        {isRtl ? 'عرض فني ومالي مدمج' : 'Merged Tech & Financial'}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <input
                      type="text"
                      value={currentSelectedProposal.planName}
                      onChange={(e) =>
                        handleUpdateProposalMeta(currentSelectedProposal.id, 'planName', e.target.value)
                      }
                      className="text-xs text-slate-500 border-b border-transparent hover:border-slate-300 focus:border-sky-500 focus:outline-none px-1 flex-1 min-w-[200px]"
                    />
                    {currentSelectedProposal.sourceFileName && (
                      <span className="text-[11px] text-slate-400 font-mono truncate max-w-xs" title={currentSelectedProposal.sourceFileName}>
                        📁 {currentSelectedProposal.sourceFileName}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Dedicated Financial Offer: Total Annual Contract Premium (All Benefits Combined) */}
              <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4 sm:p-5 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <Coins className="w-5 h-5 text-emerald-700 shrink-0" />
                      <h4 className="text-sm font-bold text-emerald-950">
                        {t('totalAnnualContractPremium')}
                      </h4>
                      <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                        {isRtl ? 'العرض المالي للعقد' : 'Financial Offer'}
                      </span>
                    </div>
                    <p className="text-xs text-emerald-800/90 mt-1 leading-relaxed max-w-2xl">
                      {t('annualPremiumExplanation')}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {onNavigateToActuarial && (
                      <button
                        type="button"
                        onClick={onNavigateToActuarial}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-sky-600 hover:bg-sky-500 text-white shadow-xs shrink-0 cursor-pointer"
                        title={isRtl ? 'حاسبة توزيع الأعمار والرسوم القانونية 6.5%' : 'Actuarial census & statutory fees calculator'}
                      >
                        <Calculator className="w-3.5 h-3.5" />
                        <span>{isRtl ? 'حاسبة الأعمار والرسوم 6.5% (٢٥٦)' : 'Census Pricing (256 pax)'}</span>
                      </button>
                    )}

                    {/* Calculator Button */}
                    <button
                      type="button"
                      onClick={() => setShowCalculator(!showCalculator)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white hover:bg-emerald-100/60 text-emerald-800 border border-emerald-300 transition-colors shadow-xs shrink-0 cursor-pointer"
                    >
                      <Calculator className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{t('annualPremiumPerMemberCalc')}</span>
                    </button>
                  </div>
                </div>

                {/* Actuarial Pricing Summary Pill if available */}
                {currentSelectedProposal.pricingStructure && (
                  <div className="flex flex-wrap items-center gap-2 py-1.5 px-3 bg-sky-50/70 border border-sky-200/80 rounded-xl text-xs text-sky-900">
                    <span className="font-bold text-sky-800">{isRtl ? 'تسعير الفئات والأقساط:' : 'Age Groups Pricing:'}</span>
                    <span>{isRtl ? 'فئة (0-17):' : '0-17 yrs:'} <strong>{currentSelectedProposal.pricingStructure.childRate} {isRtl ? 'د' : 'JOD'}</strong></span>
                    <span>&bull;</span>
                    <span>{isRtl ? 'فئة (18-65):' : '18-65 yrs:'} <strong>{currentSelectedProposal.pricingStructure.adultRate} {isRtl ? 'د' : 'JOD'}</strong></span>
                    {currentSelectedProposal.pricingStructure.seniorRate !== undefined && (
                      <>
                        <span>&bull;</span>
                        <span>{isRtl ? 'فئة (66-75):' : '66-75 yrs:'} <strong>{currentSelectedProposal.pricingStructure.seniorRate} {isRtl ? 'د' : 'JOD'}</strong></span>
                      </>
                    )}
                    <span>&bull;</span>
                    <span className="font-bold text-amber-900">{isRtl ? 'الرسوم القانونية للشركة:' : 'Company Statutory Fees:'}</span>
                    <span title={isRtl ? 'بدل خدمة الإصدار' : 'Issuance Fee'}>
                      {isRtl ? 'إصدار: ' : 'Issuance: '}<strong>{formatFeeRate(currentSelectedProposal.pricingStructure.issuanceFeePercent, 'issuance')}</strong>
                    </span>
                    <span>&bull;</span>
                    <span title={isRtl ? 'طوابع الواردات' : 'Revenue Stamps'}>
                      {isRtl ? 'طوابع: ' : 'Stamps: '}<strong>{formatFeeRate(currentSelectedProposal.pricingStructure.stampsFeePercent, 'stamps')}</strong>
                    </span>
                    <span>&bull;</span>
                    <span title={isRtl ? 'صندوق ضمان المؤمن له' : 'Policyholders Guarantee Fund'}>
                      {isRtl ? 'صندوق ضمان: ' : 'Guarantee: '}<strong>{formatFeeRate(currentSelectedProposal.pricingStructure.guaranteeFundFeePercent, 'guarantee')}</strong>
                    </span>
                    {currentSelectedProposal.pricingStructure.fixedContractFee > 0 && (
                      <>
                        <span>&bull;</span>
                        <span>{isRtl ? 'رسم عقد: ' : 'Contract: '} <strong>{currentSelectedProposal.pricingStructure.fixedContractFee} {isRtl ? 'د' : 'JOD'}</strong></span>
                      </>
                    )}
                    {onNavigateToActuarial && (
                      <button
                        type="button"
                        onClick={onNavigateToActuarial}
                        className="ms-auto text-sky-700 font-bold hover:underline cursor-pointer"
                      >
                        {isRtl ? 'تعديل أو معاينة التفاصيل ⬅' : 'Inspect or edit ➡'}
                      </button>
                    )}
                  </div>
                )}

                {/* Premium Amount & Currency Controls */}
                <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-emerald-200/60">
                  <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-emerald-300 shadow-xs">
                    <span className="text-xs font-bold text-slate-500">{t('premiumAnnual')}:</span>
                    <input
                      type="number"
                      value={currentSelectedProposal.premiumAnnual}
                      onChange={(e) =>
                        handleUpdateProposalMeta(
                          currentSelectedProposal.id,
                          'premiumAnnual',
                          parseFloat(e.target.value) || 0
                        )
                      }
                      className="w-36 text-base font-extrabold text-emerald-950 focus:outline-none"
                      placeholder="0"
                    />
                    <input
                      type="text"
                      value={currentSelectedProposal.currency || (isRtl ? 'دينار' : 'JOD')}
                      onChange={(e) =>
                        handleUpdateProposalMeta(
                          currentSelectedProposal.id,
                          'currency',
                          e.target.value
                        )
                      }
                      className="w-20 text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200 focus:outline-none text-center"
                      title={isRtl ? 'تغيير العملة (دينار، ريال، USD...)' : 'Change currency'}
                    />
                  </div>

                  <span className="text-xs font-semibold text-emerald-800 bg-emerald-100/70 px-2.5 py-1.5 rounded-xl">
                    {language === 'en'
                      ? `Approved evaluation premium: ${(currentSelectedProposal.premiumAnnual || 0).toLocaleString()} ${currentSelectedProposal.currency || 'JOD'}`
                      : `المبلغ المعتمد للتقييم: ${(currentSelectedProposal.premiumAnnual || 0).toLocaleString()} ${currentSelectedProposal.currency || 'دينار'}`}
                  </span>
                </div>

                {/* Optional Per-Member Rate Calculator */}
                {showCalculator && (
                  <div className="p-3.5 bg-white rounded-xl border border-emerald-200 text-xs space-y-2 mt-2 shadow-xs">
                    <div className="font-bold text-slate-700 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Calculator className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{t('annualPremiumPerMemberCalc')}</span>
                      </span>
                      <span className="text-xs text-slate-500 font-normal">
                        قسط الفرد × عدد المشتركين = القسط السنوي الإجمالي للعقد
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 items-end pt-1">
                      <div>
                        <label className="text-xs font-semibold text-slate-700 block mb-1">{t('perMemberRate')}:</label>
                        <input
                          type="number"
                          value={calcPerMemberRate}
                          onChange={(e) => setCalcPerMemberRate(parseFloat(e.target.value) || 0)}
                          className="w-full text-xs font-bold bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:border-emerald-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-700 block mb-1">{t('subscribersCount')}:</label>
                        <input
                          type="number"
                          value={calcMembersCount}
                          onChange={(e) => setCalcMembersCount(parseInt(e.target.value, 10) || 0)}
                          className="w-full text-xs font-bold bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:border-emerald-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <button
                          type="button"
                          onClick={() => {
                            const total = Math.round(calcPerMemberRate * calcMembersCount);
                            handleUpdateProposalMeta(currentSelectedProposal.id, 'premiumAnnual', total);
                            setShowCalculator(false);
                          }}
                          className="w-full px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-bold text-xs shadow-xs transition-colors cursor-pointer"
                        >
                          {t('applyCalculatedTotal')} ({Math.round(calcPerMemberRate * calcMembersCount).toLocaleString()})
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Strict Capping Reminder */}
              <div className="p-3 bg-sky-50/70 rounded-2xl border border-sky-200 text-xs text-sky-900 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-sky-600 shrink-0" />
                  <span>
                    {t('capRuleShortNotice')}
                  </span>
                </div>
              </div>

              {/* Forensic Terms, Conditions & Exclusions Analysis */}
              <TenderTermsForensicViewer proposal={currentSelectedProposal} />

              {/* Benefit Mapping Table */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  {t('benefitOffersMapping')} ({requirements.length} {t('totalRequiredBenefits')})
                </h4>

                <div className="border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100">
                  {requirements.map((req) => {
                    const benefitData = currentSelectedProposal.benefits[req.id] || {
                      offeredValue: '',
                      isIncluded: false,
                      rawText: ''
                    };

                    const targetValStr =
                      typeof req.targetValue === 'boolean'
                        ? req.targetValue
                          ? t('included100')
                          : t('excluded0')
                        : `${req.targetValue} ${req.unit}`;

                    return (
                      <div
                        key={req.id}
                        className="p-3.5 hover:bg-slate-50/70 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        {/* Requirement Info */}
                        <div className="sm:w-1/2 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-xs text-slate-900 truncate">
                              {req.name}
                            </span>
                            {req.isMandatory && (
                              <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-rose-50 text-rose-700 font-bold border border-rose-200">
                                {t('mandatory')}
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            {t('targetNeeded')}:{' '}
                            <span className="font-semibold text-slate-600">{targetValStr}</span>
                          </div>
                          {benefitData.rawText && (
                            <p className="text-[10px] text-slate-500 italic mt-1 bg-slate-100/70 px-2 py-0.5 rounded truncate">
                              &ldquo;{benefitData.rawText}&rdquo;
                            </p>
                          )}
                        </div>

                        {/* Insurer Offered Value Controls */}
                        <div className="sm:w-1/2 flex items-center justify-end gap-3">
                          <div className="flex items-center gap-2">
                            <label className="flex items-center gap-1 text-xs text-slate-600 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={benefitData.isIncluded !== false}
                                onChange={(e) =>
                                  handleUpdateBenefitValue(
                                    currentSelectedProposal.id,
                                    req.id,
                                    benefitData.offeredValue,
                                    e.target.checked
                                  )
                                }
                                className="rounded text-sky-600"
                              />
                              <span className="text-[11px]">{t('coveredStatus')}</span>
                            </label>

                            {req.type === 'boolean' ? (
                              <select
                                value={String(benefitData.offeredValue)}
                                onChange={(e) =>
                                  handleUpdateBenefitValue(
                                    currentSelectedProposal.id,
                                    req.id,
                                    e.target.value === 'true',
                                    benefitData.isIncluded
                                  )
                                }
                                className="text-xs px-2.5 py-1.5 border rounded-xl bg-white"
                              >
                                <option value="true">{t('included100')}</option>
                                <option value="partial">{t('conditional50')}</option>
                                <option value="false">{t('excluded0')}</option>
                              </select>
                            ) : req.type.startsWith('numeric') ? (
                              <div className="flex items-center gap-1">
                                <input
                                  type="number"
                                  value={
                                    benefitData.offeredValue === undefined
                                      ? ''
                                      : String(benefitData.offeredValue)
                                  }
                                  placeholder={t('offeredByCompany')}
                                  onChange={(e) => {
                                    const val = parseFloat(e.target.value) || 0;
                                    handleUpdateBenefitValue(
                                      currentSelectedProposal.id,
                                      req.id,
                                      val,
                                      true
                                    );
                                  }}
                                  className="w-24 text-xs font-bold px-2 py-1.5 border rounded-xl bg-white"
                                />
                                <span className="text-[11px] text-slate-500 font-medium">
                                  {req.unit}
                                </span>
                              </div>
                            ) : (
                              <input
                                type="text"
                                value={String(benefitData.offeredValue || '')}
                                placeholder="e.g. Private Single Room"
                                onChange={(e) =>
                                  handleUpdateBenefitValue(
                                    currentSelectedProposal.id,
                                    req.id,
                                    e.target.value,
                                    true
                                  )
                                }
                                className="text-xs px-2.5 py-1.5 border rounded-xl bg-white w-36"
                              />
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Extra Features Unrequested */}
              {currentSelectedProposal.extraFeatures &&
                currentSelectedProposal.extraFeatures.length > 0 && (
                  <div className="pt-2">
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                      {t('unrequestedPerksTitle')}
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {currentSelectedProposal.extraFeatures.map((feat, idx) => (
                        <div
                          key={idx}
                          className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs"
                        >
                          <div className="font-semibold text-slate-800">{feat.title}</div>
                          <div className="text-[11px] text-slate-500">{feat.description}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-400">
              {t('noProposalSelected')}
            </div>
          )}
        </div>
      </div>
      )}

      {/* Step 5 Completion & Next/Prev Step Action Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 text-white rounded-2xl p-4 sm:p-5 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 text-center sm:text-start">
          <div className="w-10 h-10 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-400/30 flex items-center justify-center font-bold text-sm shrink-0">
            ٥ / ٦
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">
              {isRtl ? 'تم إدخال ومطابقة عروض شركات التأمين' : 'Insurer Proposals Configured'} ({proposals.length} {t('uploadedProposalsCount')})
            </h4>
            <p className="text-xs text-slate-300">
              {isRtl 
                ? 'انتقل للخطوة ٦ لمعاينة مصفوفة المفاضلة الشاملة، والتقييم من 5، ولوحة الترتيب' 
                : 'Proceed to Step 6 to view master trade-off matrix, 5/5 score breakdown, and final rankings.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap justify-center sm:justify-end shrink-0">
          {onNavigatePrev && (
            <button
              id="btn-step5-prev"
              onClick={onNavigatePrev}
              className="px-3.5 py-2.5 text-xs font-semibold rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-700 transition-colors cursor-pointer"
            >
              {isRtl ? 'رجوع للخطوة ٤' : 'Back to Step 4'}
            </button>
          )}
          {onClearProposals && (
            <button
              onClick={onClearProposals}
              className="px-3 py-2 text-xs font-medium rounded-xl text-rose-300 hover:text-white hover:bg-rose-900/40 border border-rose-800/60 transition-colors cursor-pointer"
            >
              {t('cleanDataBtn')}
            </button>
          )}
          <button
            id="btn-step5-next"
            onClick={onNavigateToRankings}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold rounded-xl text-slate-900 bg-white hover:bg-sky-50 transition-all shadow-md cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
          >
            <span>{isRtl ? 'عرض مصفوفة المفاضلة الشاملة والترتيب (الخطوة ٦)' : 'View Trade-off Matrix & Final Rankings (Step 6)'}</span>
          </button>
        </div>
      </div>

      {/* Modal: Paste Proposal Text */}
      {showPasteModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-sky-100 text-sky-700">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {t('pasteOfferTitle')}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {t('pasteOfferSubtitle')}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowPasteModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t('companyNameLabel')}
                </label>
                <input
                  type="text"
                  placeholder="e.g. Zurich Insurance / Prudential"
                  value={pasteCompanyName}
                  onChange={(e) => setPasteCompanyName(e.target.value)}
                  className="w-full text-xs px-3 py-2 border rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t('pasteOfferSubtitle')}
                </label>
                <textarea
                  rows={8}
                  placeholder="Paste table or proposal text here (e.g. Premium: $17,000/yr. Outpatient visits: 10 per member. Inpatient: $150k limit. Copay: 10%. Dental: $1500...)"
                  value={pastedText}
                  onChange={(e) => setPastedText(e.target.value)}
                  className="w-full text-xs p-3 border rounded-xl font-mono focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowPasteModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  {t('cancel')}
                </button>
                <button
                  type="button"
                  onClick={handlePasteExtract}
                  disabled={isExtracting || !pastedText.trim()}
                  className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 disabled:opacity-50 rounded-xl shadow-xs cursor-pointer"
                >
                  {isExtracting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>{t('extracting')}</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{t('extractOfferBtn')}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Manual Merge Two Proposals */}
      {showManualMergeModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-indigo-100 text-indigo-700">
                  <FileCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {isRtl ? 'دمج مخصص بين عرضين (فني + مالي)' : 'Manual Merge Between Two Proposals'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {isRtl
                      ? 'حدد العرضين المراد دمجهما (مثل العرض الفني والمالي لشركة الخليج) لتوحيدهما في سجل واحد شامل.'
                      : 'Select the two offers to combine (e.g., technical and financial offers) into a single record.'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowManualMergeModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Proposal 1 Selection */}
                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                  <label className="block text-xs font-bold text-slate-800">
                    {isRtl ? 'العرض الأول (مثلاً: العرض الفني):' : 'First Proposal (e.g., Technical):'}
                  </label>
                  <select
                    value={manualMergeFirstId}
                    onChange={(e) => {
                      setManualMergeFirstId(e.target.value);
                      const p = proposals.find(pr => pr.id === e.target.value);
                      if (p) setManualMergeTargetName(getCanonicalInsuranceCompanyName(p.companyName));
                    }}
                    className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-lg font-semibold text-slate-800"
                  >
                    {proposals.map(p => (
                      <option key={p.id} value={p.id} disabled={p.id === manualMergeSecondId}>
                        {p.companyName} {p.sourceFileName ? `(${p.sourceFileName})` : ''}
                      </option>
                    ))}
                  </select>

                  {/* Summary of Proposal 1 */}
                  {(() => {
                    const p1 = proposals.find(p => p.id === manualMergeFirstId);
                    if (!p1) return null;
                    const bCount = Object.keys(p1.benefits || {}).length;
                    const prem = p1.premiumAnnual || 0;
                    return (
                      <div className="text-[11px] text-slate-600 space-y-1 pt-1 border-t border-slate-200">
                        <div><span className="font-semibold">{isRtl ? 'المنافع المستخرجة:' : 'Extracted Benefits:'}</span> {bCount} {isRtl ? 'بند' : 'points'}</div>
                        <div><span className="font-semibold">{isRtl ? 'القسط السنوي:' : 'Annual Premium:'}</span> {prem > 0 ? `${prem.toLocaleString()} JOD` : (isRtl ? 'غير محدد في هذا الملف' : 'Not set')}</div>
                      </div>
                    );
                  })()}
                </div>

                {/* Proposal 2 Selection */}
                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                  <label className="block text-xs font-bold text-slate-800">
                    {isRtl ? 'العرض الثاني (مثلاً: العرض المالي):' : 'Second Proposal (e.g., Financial):'}
                  </label>
                  <select
                    value={manualMergeSecondId}
                    onChange={(e) => {
                      setManualMergeSecondId(e.target.value);
                      if (!manualMergeTargetName) {
                        const p = proposals.find(pr => pr.id === e.target.value);
                        if (p) setManualMergeTargetName(getCanonicalInsuranceCompanyName(p.companyName));
                      }
                    }}
                    className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-lg font-semibold text-slate-800"
                  >
                    {proposals.map(p => (
                      <option key={p.id} value={p.id} disabled={p.id === manualMergeFirstId}>
                        {p.companyName} {p.sourceFileName ? `(${p.sourceFileName})` : ''}
                      </option>
                    ))}
                  </select>

                  {/* Summary of Proposal 2 */}
                  {(() => {
                    const p2 = proposals.find(p => p.id === manualMergeSecondId);
                    if (!p2) return null;
                    const bCount = Object.keys(p2.benefits || {}).length;
                    const prem = p2.premiumAnnual || 0;
                    return (
                      <div className="text-[11px] text-slate-600 space-y-1 pt-1 border-t border-slate-200">
                        <div><span className="font-semibold">{isRtl ? 'المنافع المستخرجة:' : 'Extracted Benefits:'}</span> {bCount} {isRtl ? 'بند' : 'points'}</div>
                        <div><span className="font-semibold">{isRtl ? 'القسط السنوي:' : 'Annual Premium:'}</span> {prem > 0 ? `${prem.toLocaleString()} JOD` : (isRtl ? 'غير محدد في هذا الملف' : 'Not set')}</div>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Target Unified Company Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {isRtl ? 'الاسم الرسمي الموحد لشركة التأمين بعد الدمج:' : 'Unified Company Name After Merge:'}
                </label>
                <input
                  type="text"
                  value={manualMergeTargetName}
                  onChange={(e) => setManualMergeTargetName(e.target.value)}
                  placeholder="مثال: مجموعة الخليج للتأمين - الأردن (GIG Jordan)"
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl font-semibold focus:ring-2 focus:ring-indigo-500"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  {isRtl 
                    ? 'سيتم جمع منافع العرضين (78 بند)، واعتماد أسعار الفئات والرسوم القانونية الخاصة بالشركة، وحذف الملف المكرر.' 
                    : 'Benefits will be combined (78 points), rates and fees resolved, and duplicate file removed.'}
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowManualMergeModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  {t('cancel')}
                </button>
                <button
                  type="button"
                  onClick={handleExecuteManualMerge}
                  disabled={!manualMergeFirstId || !manualMergeSecondId || manualMergeFirstId === manualMergeSecondId}
                  className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-xl shadow-xs cursor-pointer"
                >
                  <FileCheck className="w-4 h-4" />
                  <span>{isRtl ? '⚡ دمج وتوحيد العرضين الآن' : '⚡ Consolidate Offers Now'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

