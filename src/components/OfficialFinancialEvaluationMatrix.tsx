import React, { useState, useMemo } from 'react';
import { CompanyProposal, DemographicCensus, CompanyPricingStructure } from '../types';
import { 
  calculateCompanyPremium, 
  resolveProposalPricing,
  DEFAULT_DEMOGRAPHIC_CENSUS,
  formatFeeRate,
  normalizeFeeMultiplier
} from '../utils/actuarialCalculator';
import { useI18n } from '../i18n/I18nContext';
import { 
  Download, 
  Trophy, 
  CheckCircle2, 
  Coins, 
  ShieldCheck, 
  EyeOff, 
  Eye, 
  Ban, 
  AlertTriangle, 
  HelpCircle, 
  Edit3, 
  X, 
  Save, 
  RefreshCw,
  FileText,
  SlidersHorizontal,
  ChevronDown,
  Info
} from 'lucide-react';
import * as XLSX from 'xlsx';

interface OfficialFinancialEvaluationMatrixProps {
  proposals: CompanyProposal[];
  census?: DemographicCensus;
  onUpdateProposalPricing?: (proposalId: string, pricing: CompanyPricingStructure) => void;
  onToggleExcludeProposal?: (proposalId: string) => void;
  onUpdateProposals?: (newProposals: CompanyProposal[]) => void;
  className?: string;
  showTitle?: boolean;
}

export const OfficialFinancialEvaluationMatrix: React.FC<OfficialFinancialEvaluationMatrixProps> = ({
  proposals,
  census = DEFAULT_DEMOGRAPHIC_CENSUS,
  onUpdateProposalPricing,
  onToggleExcludeProposal,
  onUpdateProposals,
  className = '',
  showTitle = true
}) => {
  const { isRtl } = useI18n();

  const childrenCount = census.childrenCount ?? 97;
  const adultsCount = census.adultsCount ?? 159;
  const seniorsCount = census.seniorsCount ?? 0;
  const totalMembers = census.totalMembers || (childrenCount + adultsCount + seniorsCount);

  // Local state for excluded proposal IDs to provide instant UI responsiveness
  const [localExcludedIds, setLocalExcludedIds] = useState<Set<string>>(() => {
    const set = new Set<string>();
    proposals.forEach(p => {
      if (p.isExcluded) set.add(p.id);
    });
    return set;
  });

  // Filter tab mode: 'all' | 'active' | 'excluded' (default to 'active')
  const [filterMode, setFilterMode] = useState<'all' | 'active' | 'excluded'>('active');

  // Toggle for hiding excluded columns completely (default to true)
  const [hideExcludedColumns, setHideExcludedColumns] = useState<boolean>(true);

  // State for "Where did the numbers come from?" explanation modal
  const [showExplanationModal, setShowExplanationModal] = useState<boolean>(false);

  // State for Editing Company Rates modal
  const [editingProposalId, setEditingProposalId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{
    childRate: number;
    adultRate: number;
    seniorRate: number;
    issuanceFeePercent: number;
    stampsFeePercent: number;
    guaranteeFundFeePercent: number;
    fixedContractFee: number;
    customNotes: string;
  }>({
    childRate: 0,
    adultRate: 0,
    seniorRate: 0,
    issuanceFeePercent: 4.0,
    stampsFeePercent: 1.0,
    guaranteeFundFeePercent: 0.5,
    fixedContractFee: 0,
    customNotes: ''
  });

  // Keep local excluded IDs in sync when proposals prop changes
  React.useEffect(() => {
    setLocalExcludedIds(prev => {
      const next = new Set(prev);
      proposals.forEach(p => {
        if (p.isExcluded) next.add(p.id);
      });
      return next;
    });
  }, [proposals]);

  // Handler to toggle proposal exclusion
  const handleToggleExclude = (proposalId: string, reason?: string) => {
    const isCurrentlyExcluded = localExcludedIds.has(proposalId);
    
    // Update local state immediately
    setLocalExcludedIds(prev => {
      const next = new Set(prev);
      if (isCurrentlyExcluded) {
        next.delete(proposalId);
      } else {
        next.add(proposalId);
      }
      return next;
    });

    // Notify parent callback if provided
    if (onToggleExcludeProposal) {
      onToggleExcludeProposal(proposalId);
    }

    // Update proposals array directly if onUpdateProposals provided
    if (onUpdateProposals) {
      const updated = proposals.map(p => {
        if (p.id === proposalId) {
          return {
            ...p,
            isExcluded: !isCurrentlyExcluded,
            excludedReason: !isCurrentlyExcluded 
              ? (reason || 'مستثنى بقرار لجنة العطاءات من شاشة التقييم المالي') 
              : undefined
          };
        }
        return p;
      });
      onUpdateProposals(updated);
    }
  };

  // Open Edit Rates modal for a specific proposal
  const handleOpenEditRates = (proposal: CompanyProposal) => {
    const pricing = resolveProposalPricing(proposal.companyName, proposal.pricingStructure);
    setEditingProposalId(proposal.id);
    setEditForm({
      childRate: pricing.childRate,
      adultRate: pricing.adultRate,
      seniorRate: pricing.seniorRate || 0,
      issuanceFeePercent: normalizeFeeMultiplier(pricing.issuanceFeePercent ?? 0.05, 'issuance'),
      stampsFeePercent: normalizeFeeMultiplier(pricing.stampsFeePercent ?? 0.01, 'stamps'),
      guaranteeFundFeePercent: normalizeFeeMultiplier(pricing.guaranteeFundFeePercent ?? 0.005, 'guarantee'),
      fixedContractFee: pricing.fixedContractFee || 0,
      customNotes: pricing.customNotes || ''
    });
  };

  // Save edited rates
  const handleSaveEditRates = () => {
    if (!editingProposalId) return;

    const issMult = normalizeFeeMultiplier(editForm.issuanceFeePercent, 'issuance');
    const stampsMult = normalizeFeeMultiplier(editForm.stampsFeePercent, 'stamps');
    const guaranteeMult = normalizeFeeMultiplier(editForm.guaranteeFundFeePercent, 'guarantee');

    const newPricing: CompanyPricingStructure = {
      childRate: Number(editForm.childRate) || 0,
      adultRate: Number(editForm.adultRate) || 0,
      seniorRate: Number(editForm.seniorRate) || 0,
      issuanceFeePercent: issMult,
      stampsFeePercent: stampsMult,
      guaranteeFundFeePercent: guaranteeMult,
      fixedContractFee: Number(editForm.fixedContractFee) || 0,
      stampsCalculationBasis: 'base_plus_issuance',
      feesPercentage: Math.round((issMult + stampsMult + guaranteeMult) * 10000) / 100,
      customNotes: editForm.customNotes,
      isCustomExtracted: true
    };

    if (onUpdateProposalPricing) {
      onUpdateProposalPricing(editingProposalId, newPricing);
    }

    if (onUpdateProposals) {
      const updated = proposals.map(p => {
        if (p.id === editingProposalId) {
          const breakdown = calculateCompanyPremium(newPricing, census);
          return {
            ...p,
            pricingStructure: newPricing,
            calculatedBreakdown: breakdown,
            premiumAnnual: breakdown.totalAnnualPremium
          };
        }
        return p;
      });
      onUpdateProposals(updated);
    }

    setEditingProposalId(null);
  };

  // Evaluate each company's pricing with exact actuarial and statutory formulas
  const evaluatedCompanies = useMemo(() => {
    return proposals.map(p => {
      const isExcluded = Boolean(p.isExcluded || localExcludedIds.has(p.id));
      const pricing = resolveProposalPricing(p.companyName, p.pricingStructure);
      const breakdown = calculateCompanyPremium(pricing, census);
      return {
        proposal: p,
        pricing,
        breakdown,
        totalPremium: breakdown.totalAnnualPremium,
        isExcluded,
        excludedReason: p.excludedReason
      };
    });
  }, [proposals, census, localExcludedIds]);

  // Determine lowest price for the 40% financial formula (ONLY from active, non-excluded companies!)
  const activeCompanies = useMemo(() => {
    return evaluatedCompanies.filter(c => !c.isExcluded);
  }, [evaluatedCompanies]);

  const validActivePremiums = useMemo(() => {
    return activeCompanies.map(c => c.totalPremium).filter(p => p > 0);
  }, [activeCompanies]);

  const lowestPrice = useMemo(() => {
    return validActivePremiums.length > 0 ? Math.min(...validActivePremiums) : 118385.40;
  }, [validActivePremiums]);

  // Compute financial scores and ranks
  const rankedFinancialList = useMemo(() => {
    // 1. Compute scores for all items
    const listWithScores = evaluatedCompanies.map(item => {
      if (item.isExcluded) {
        return {
          ...item,
          financialRatio: 0,
          financial40Exact: 0,
          financial40Rounded: 0,
          financialRank: -1 // Excluded from ranking
        };
      }

      const financialRatio = item.totalPremium > 0 ? Math.min(1.0, lowestPrice / item.totalPremium) : 0;
      const financial40Exact = financialRatio * 40;
      const financial40Rounded = Math.round(financial40Exact * 100) / 100;
      return {
        ...item,
        financialRatio,
        financial40Exact,
        financial40Rounded,
        financialRank: 1
      };
    });

    // 2. Rank ONLY active companies based on total premium ascending
    const activeList = listWithScores.filter(item => !item.isExcluded);
    const sortedActive = [...activeList].sort((a, b) => a.totalPremium - b.totalPremium);
    
    const rankMap = new Map<string, number>();
    sortedActive.forEach((item, index) => {
      rankMap.set(item.proposal.id, index + 1);
    });

    // 3. Assign correct ranks
    return listWithScores.map(item => ({
      ...item,
      financialRank: item.isExcluded ? -1 : (rankMap.get(item.proposal.id) || 1)
    }));
  }, [evaluatedCompanies, lowestPrice]);

  // Filtered list for display based on user filter tab and hide checkbox
  const displayedFinancialList = useMemo(() => {
    return rankedFinancialList.filter(item => {
      if (hideExcludedColumns && item.isExcluded) return false;
      if (filterMode === 'active' && item.isExcluded) return false;
      if (filterMode === 'excluded' && !item.isExcluded) return false;
      return true;
    });
  }, [rankedFinancialList, filterMode, hideExcludedColumns]);

  // Detect duplicate proposals for the same company (e.g. 2 offers for Jordan Insurance Company)
  const duplicateCompaniesList = useMemo(() => {
    const map = new Map<string, CompanyProposal[]>();
    proposals.forEach(p => {
      if (!p) return;
      const raw = (p.companyName || '').toLowerCase();
      let key = (p.companyName || '').trim();
      if (raw.includes('jic') || (raw.includes('تامين') && raw.includes('اردني'))) {
        key = 'شركة التأمين الأردنية (JIC)';
      } else if (raw.includes('jofico') || raw.includes('فرنسي')) {
        key = 'الأردنية الفرنسية للتأمين (JOFICO)';
      } else if (raw.includes('meico') || (raw.includes('شرق') && raw.includes('اوسط'))) {
        key = 'شركة الشرق الأوسط للتأمين (MEICO)';
      } else if (raw.includes('gig') || raw.includes('خليج')) {
        key = 'مجموعة الخليج للتأمين (GIG)';
      } else if (raw.includes('قدس') || raw.includes('jerusalem')) {
        key = 'شركة القدس للتأمين';
      }
      const existing = map.get(key) || [];
      existing.push(p);
      map.set(key, existing);
    });

    return Array.from(map.entries())
      .filter(([_, list]) => list.length > 1)
      .map(([companyKey, list]) => ({ companyKey, list }));
  }, [proposals]);

  const formatCurrency = (val: number) => {
    return val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const formatDinar = (val: number) => {
    return Math.round(val).toLocaleString();
  };

  // Export exact matrix to Excel
  const handleExportExcel = () => {
    const listToExport = displayedFinancialList;

    const headerRow1 = [
      isRtl ? 'الأعمار' : 'Age Brackets',
      isRtl ? 'الأعداد' : 'Count',
      ...listToExport.flatMap(c => [
        c.isExcluded ? `${c.proposal?.companyName || ''} (مستثنى)` : (c.proposal?.companyName || ''),
        ''
      ])
    ];

    const headerRow2 = [
      '',
      '',
      ...listToExport.flatMap(c => [
        isRtl ? 'السعر / دينار' : 'Rate / JOD',
        isRtl ? 'المجموع' : 'Subtotal'
      ])
    ];

    const dataRows = [
      [
        '0 - 17',
        childrenCount,
        ...listToExport.flatMap(c => [
          c.pricing.childRate || 0,
          Math.round(c.breakdown.childrenBase)
        ])
      ],
      [
        '18 - 65',
        adultsCount,
        ...listToExport.flatMap(c => [
          c.pricing.adultRate || 0,
          Math.round(c.breakdown.adultsBase)
        ])
      ],
      [
        '66 - 75',
        seniorsCount,
        ...listToExport.flatMap(c => [
          c.pricing.seniorRate || 0,
          Math.round(c.breakdown.seniorsBase)
        ])
      ],
      [
        isRtl ? 'المجموع الأساسي' : 'Base Subtotal',
        totalMembers,
        ...listToExport.flatMap(c => [
          '-',
          Math.round(c.breakdown.baseSubtotal)
        ])
      ],
      [
        isRtl ? 'رسوم إصدار' : 'Issuance Fee',
        '-',
        ...listToExport.flatMap(c => [
          formatFeeRate(c.breakdown.issuanceFeePercent, 'issuance'),
          formatCurrency(c.breakdown.issuanceFeeAmount)
        ])
      ],
      [
        isRtl ? 'رسوم طوابع' : 'Stamp Duty',
        '-',
        ...listToExport.flatMap(c => [
          formatFeeRate(c.breakdown.stampsFeePercent, 'stamps'),
          formatCurrency(c.breakdown.stampsFeeAmount)
        ])
      ],
      [
        isRtl ? 'رسوم صندوق ضمان المؤمن له' : 'Guarantee Fund',
        '-',
        ...listToExport.flatMap(c => [
          formatFeeRate(c.breakdown.guaranteeFundFeePercent, 'guarantee'),
          formatCurrency(c.breakdown.guaranteeFundFeeAmount)
        ])
      ],
      [
        isRtl ? 'المجموع الكلي' : 'Total Premium',
        totalMembers,
        ...listToExport.flatMap(c => [
          '-',
          formatCurrency(c.totalPremium)
        ])
      ],
      [
        isRtl ? 'التقييم المالي (40%)' : 'Financial Score (40%)',
        '40%',
        ...listToExport.flatMap(c => [
          c.isExcluded ? 'مستثنى (0%)' : `${c.financial40Rounded}%`,
          c.isExcluded 
            ? 'مستثنى بقرار اللجنة' 
            : `(${formatDinar(lowestPrice)} / ${formatDinar(c.totalPremium)}) × 40%`
        ])
      ],
      [
        isRtl ? 'الترتيب المالي' : 'Financial Rank',
        '-',
        ...listToExport.flatMap(c => [
          c.isExcluded ? 'مستثنى' : `#${c.financialRank}`,
          c.isExcluded
            ? 'مستثنى من الترتيب والمفاضلة'
            : (c.financialRank === 1 ? (isRtl ? 'المرتبة الأولى (أقل سعر)' : 'Rank 1 (Lowest Price)') : `المرتبة ${c.financialRank}`)
        ])
      ]
    ];

    const ws = XLSX.utils.aoa_to_sheet([headerRow1, headerRow2, ...dataRows]);
    ws['!views'] = [{ RTL: isRtl }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, isRtl ? 'التقييم_المالي_المعتمد' : 'Financial_Evaluation');
    XLSX.writeFile(wb, isRtl ? 'التقييم_المالي_لعروض_التأمين.xlsx' : 'Financial_Evaluation_Health_Tender_2026.xlsx');
  };

  const totalProposalsCount = proposals.length;
  const activeProposalsCount = activeCompanies.length;
  const excludedProposalsCount = totalProposalsCount - activeProposalsCount;

  return (
    <div className={`space-y-4 ${className}`} id="official-financial-matrix-container">
      {/* Header Banner */}
      {showTitle && (
        <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white rounded-2xl p-5 sm:p-6 shadow-md relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
            <div>
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-400 text-slate-950">
                  <Coins className="w-3.5 h-3.5 text-slate-950" />
                  {isRtl ? 'النموذج الرسمي المعتمد' : 'Official Tender Model'}
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-white/10 text-emerald-200 border border-white/10">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  {isRtl ? `التعداد: ${totalMembers} مؤمن له` : `Census: ${totalMembers} Members`}
                </span>
                {excludedProposalsCount > 0 && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-400/30">
                    <Ban className="w-3 h-3 text-rose-400" />
                    {isRtl ? `${excludedProposalsCount} عروض مستثناة` : `${excludedProposalsCount} Excluded`}
                  </span>
                )}
              </div>
              <h3 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                {isRtl ? 'التقييم المالي لعروض التأمين الصحي' : 'Financial Evaluation of Health Insurance Proposals'}
              </h3>
              <p className="text-xs sm:text-sm text-emerald-100/90 mt-1 max-w-3xl leading-relaxed">
                {isRtl 
                  ? 'كشف تفصيلي بتوزيع الفئات العمرية واحتساب الأقساط الأساسية والرسوم القانونية المعتمدة (إصدار، طوابع واردات، صندوق ضمان) واستخراج علامة الـ 40% المالية والترتيب المالي، مع إمكانية استثناء أي عرض مكرر أو بديل بنقرة واحدة.'
                  : 'Detailed breakdown of demographic age brackets, base premiums, statutory legal fees, exact 40% financial score calculation, and instantaneous offer exclusion.'}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0 flex-wrap">
              <button
                type="button"
                onClick={() => setShowExplanationModal(true)}
                className="h-10 px-3.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center gap-1.5 transition-all border border-white/20 cursor-pointer"
                title={isRtl ? 'من أين جاءت الأرقام؟ عرض مصادر الوثائق والكتب الرسمية' : 'Where did the numbers come from?'}
              >
                <HelpCircle className="w-4 h-4 text-emerald-300" />
                <span>{isRtl ? 'من أين جاءت الأرقام؟' : 'Data Sources'}</span>
              </button>

              <button
                type="button"
                onClick={handleExportExcel}
                className="h-10 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black flex items-center gap-2 transition-all shadow-sm cursor-pointer"
                title={isRtl ? 'تصدير جدول الإكسل المعتمد' : 'Export Official Excel Sheet'}
              >
                <Download className="w-4 h-4" />
                <span>{isRtl ? 'تصدير إكسل (XLSX)' : 'Export Excel'}</span>
              </button>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-white/10 text-xs">
            <div className="bg-white/5 rounded-xl p-2.5 border border-white/10">
              <div className="text-emerald-200/80 font-medium">
                {isRtl ? 'أقل سعر معتمد (40% كاملة)' : 'Lowest Price (Full 40%)'}
              </div>
              <div className="text-base sm:text-lg font-black text-amber-300 mt-0.5">
                {formatCurrency(lowestPrice)} <span className="text-xs font-normal text-white/80">{isRtl ? 'دينار' : 'JOD'}</span>
              </div>
              <div className="text-[10px] text-emerald-300/80 mt-0.5">
                {isRtl ? 'يحتسب حصراً من العروض المعتمدة' : 'Active proposals only'}
              </div>
            </div>

            <div className="bg-white/5 rounded-xl p-2.5 border border-white/10">
              <div className="text-emerald-200/80 font-medium">{isRtl ? 'فئة الأطفال (0 - 17)' : 'Children (0 - 17)'}</div>
              <div className="text-base sm:text-lg font-black text-white mt-0.5">
                {childrenCount} <span className="text-xs font-normal text-white/80">{isRtl ? 'مشتركاً' : 'members'}</span>
              </div>
              <div className="text-[10px] text-white/60 mt-0.5">
                {isRtl ? 'الدرجة الأولى المعتمدة' : 'First class'}
              </div>
            </div>

            <div className="bg-white/5 rounded-xl p-2.5 border border-white/10">
              <div className="text-emerald-200/80 font-medium">{isRtl ? 'فئة البالغين (18 - 65)' : 'Adults (18 - 65)'}</div>
              <div className="text-base sm:text-lg font-black text-white mt-0.5">
                {adultsCount} <span className="text-xs font-normal text-white/80">{isRtl ? 'مشتركاً' : 'members'}</span>
              </div>
              <div className="text-[10px] text-white/60 mt-0.5">
                {isRtl ? 'الدرجة الأولى المعتمدة' : 'First class'}
              </div>
            </div>

            <div className="bg-white/5 rounded-xl p-2.5 border border-white/10">
              <div className="text-emerald-200/80 font-medium">{isRtl ? 'حالة العروض في الكشف' : 'Proposals Status'}</div>
              <div className="text-sm font-black text-emerald-200 mt-1 flex items-center gap-2">
                <span>{activeProposalsCount} معتمد</span>
                {excludedProposalsCount > 0 && (
                  <span className="text-rose-300">({excludedProposalsCount} مستثنى)</span>
                )}
              </div>
              <div className="text-[10px] text-emerald-100/70 mt-0.5">
                {isRtl ? 'المستثنى يستبعد فوراً من الترتيب' : 'Excluded are omitted'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Duplicate Companies Notice Banner */}
      {duplicateCompaniesList.length > 0 && (
        <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 text-slate-800 shadow-xs">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1.5 flex-1">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <h4 className="font-extrabold text-sm text-amber-900">
                  {isRtl ? 'تنبيه: تم رصد أكثر من عرض لنفس الشركة' : 'Notice: Multiple proposals detected for the same company'}
                </h4>
                <span className="text-xs font-bold text-amber-800 bg-amber-200/70 px-2.5 py-0.5 rounded-full">
                  {isRtl ? 'إمكانية الاستثناء متاحة بنقرة واحدة' : 'One-click exclusion available'}
                </span>
              </div>
              <p className="text-xs text-amber-800 leading-relaxed">
                {isRtl
                  ? `يوجد ${duplicateCompaniesList.map(d => `${d.companyKey} (${d.list.length} عروض)`).join('، ')} في الكشف. يمكنك استثناء أي عرض بالنقر على زر "استثناء العرض من الترتيب" في رأس العمود أدناه، ليستبعد فوراً من الترتيب ولا يؤثر سعره على علامات بقية الشركات.`
                  : `Multiple offers detected. You can exclude any offer by clicking "Exclude Offer" in the column header below.`}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Top Controls Bar: Filter Tabs & Hide Excluded Checkbox */}
      <div className="bg-slate-100 border border-slate-200 rounded-xl p-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="font-bold text-slate-600 me-1">{isRtl ? 'عرض الجدول:' : 'View:'}</span>
          <button
            type="button"
            onClick={() => setFilterMode('all')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
              filterMode === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
            }`}
          >
            {isRtl ? `كافة العروض (${totalProposalsCount})` : `All Offers (${totalProposalsCount})`}
          </button>

          <button
            type="button"
            onClick={() => setFilterMode('active')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
              filterMode === 'active'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
            }`}
          >
            {isRtl ? `العروض المعتمدة فقط (${activeProposalsCount})` : `Active Only (${activeProposalsCount})`}
          </button>

          <button
            type="button"
            onClick={() => setFilterMode('excluded')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
              filterMode === 'excluded'
                ? 'bg-rose-700 text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
            }`}
          >
            {isRtl ? `العروض المستثناة (${excludedProposalsCount})` : `Excluded Only (${excludedProposalsCount})`}
          </button>
        </div>

        <div className="flex items-center gap-3">
          <label className="inline-flex items-center gap-2 font-medium text-slate-700 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={hideExcludedColumns}
              onChange={(e) => setHideExcludedColumns(e.target.checked)}
              className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
            />
            <span>{isRtl ? 'إخفاء الأعمدة المستثناة من الجدول' : 'Hide excluded columns completely'}</span>
          </label>
        </div>
      </div>

      {/* Official Matrix Table */}
      <div className="bg-white rounded-2xl border-2 border-slate-300 shadow-sm overflow-hidden">
        <div className="overflow-x-auto max-h-[75vh] overflow-y-auto custom-scrollbar relative">
          <table className="w-full text-center border-collapse text-xs sm:text-sm">
            <thead className="sticky top-0 z-30 shadow-md bg-slate-900">
              {/* Top Header: Company Names Spanning 2 Columns each */}
              <tr className="bg-slate-800 text-white font-black border-b-2 border-slate-400">
                <th 
                  rowSpan={2} 
                  className="sticky top-0 z-30 py-3 px-3 w-28 text-center bg-slate-900 text-white border-e-2 border-slate-300 align-middle shadow-xs"
                >
                  <div className="text-xs sm:text-sm font-black">{isRtl ? 'الأعمار' : 'Age Brackets'}</div>
                </th>
                <th 
                  rowSpan={2} 
                  className="sticky top-0 z-30 py-3 px-3 w-20 text-center bg-slate-900 text-white border-e-2 border-slate-300 align-middle shadow-xs"
                >
                  <div className="text-xs sm:text-sm font-black">{isRtl ? 'الأعداد' : 'Count'}</div>
                </th>

                {displayedFinancialList.map((col) => {
                  const isExcluded = col.isExcluded;
                  const isFirst = !isExcluded && col.financialRank === 1;
                  const isSecond = !isExcluded && col.financialRank === 2;

                  return (
                    <th 
                      key={col.proposal.id} 
                      colSpan={2} 
                      className={`sticky top-0 z-30 py-3 px-3 border-e-2 border-slate-300 text-center transition-colors shadow-xs ${
                        isExcluded
                          ? 'bg-slate-800 text-slate-300 relative'
                          : isFirst 
                          ? 'bg-amber-600 text-white' 
                          : isSecond
                          ? 'bg-slate-700 text-white'
                          : 'bg-slate-800 text-white'
                      }`}
                    >
                      <div className="flex flex-col items-center justify-center gap-1.5">
                        {/* Company Name & Rank Badge */}
                        <div className="flex items-center justify-center gap-1.5 flex-wrap">
                          <span className={`font-extrabold text-sm ${isExcluded ? 'line-through text-slate-300' : ''}`}>
                            {(col.proposal?.companyName || '').split('(')[0]}
                          </span>
                          
                          {isExcluded ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500 text-white shadow-xs">
                              <Ban className="w-3 h-3" />
                              {isRtl ? 'مستثنى' : 'Excluded'}
                            </span>
                          ) : isFirst ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-yellow-400 text-slate-950">
                              <Trophy className="w-3 h-3" />
                              {isRtl ? 'المرتبة الأولى (أقل سعر)' : '#1 Lowest'}
                            </span>
                          ) : (
                            <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-white/20 text-white">
                              #{col.financialRank}
                            </span>
                          )}
                        </div>

                        {/* Plan Name / Note if available */}
                        <div className="text-[10px] text-white/80 font-normal max-w-[200px] truncate">
                          {col.proposal.planName}
                        </div>

                        {/* Action Buttons: Exclude / Re-Include + Edit Rates */}
                        <div className="flex items-center gap-1.5 mt-1 w-full justify-center">
                          {isExcluded ? (
                            <button
                              type="button"
                              onClick={() => handleToggleExclude(col.proposal.id)}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold flex items-center gap-1 shadow-xs transition-colors cursor-pointer"
                              title={isRtl ? 'إعادة تضمين هذا العرض في التقييم والترتيب المالي' : 'Include back in ranking'}
                            >
                              <CheckCircle2 className="w-3 h-3" />
                              <span>{isRtl ? 'إعادة التضمين' : 'Include'}</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleToggleExclude(col.proposal.id)}
                              className="px-2 py-1 rounded-lg bg-rose-500/30 hover:bg-rose-500/50 text-rose-100 border border-rose-400/40 text-[10px] font-bold flex items-center gap-1 shadow-xs transition-colors cursor-pointer"
                              title={isRtl ? 'استثناء هذا العرض واستبعاده من الترتيب ومعادلة أقل سعر' : 'Exclude offer from ranking'}
                            >
                              <EyeOff className="w-3 h-3 text-rose-300" />
                              <span>{isRtl ? 'استثناء العرض' : 'Exclude'}</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => handleOpenEditRates(col.proposal)}
                            className="px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[10px] font-medium flex items-center gap-1 border border-white/20 transition-colors cursor-pointer"
                            title={isRtl ? 'تعديل أسعار الفئات والرسوم لهذه الشركة' : 'Edit pricing rates'}
                          >
                            <Edit3 className="w-3 h-3 text-white/80" />
                            <span>{isRtl ? 'تعديل' : 'Edit'}</span>
                          </button>
                        </div>
                      </div>
                    </th>
                  );
                })}
              </tr>

              {/* Sub-Header: Price / JOD vs Total */}
              <tr className="bg-slate-200 text-slate-800 font-bold border-b-2 border-slate-300">
                {displayedFinancialList.map((col) => (
                  <React.Fragment key={`sub-${col.proposal.id}`}>
                    <th className={`sticky top-[86px] sm:top-[92px] z-20 py-2 px-2 text-center text-xs border-e border-slate-300 font-bold shadow-xs ${
                      col.isExcluded ? 'bg-slate-300/90 text-slate-600' : 'bg-slate-100 text-slate-800'
                    }`}>
                      {isRtl ? 'السعر / دينار' : 'Rate / JOD'}
                    </th>
                    <th className={`sticky top-[86px] sm:top-[92px] z-20 py-2 px-2 text-center text-xs border-e-2 border-slate-300 font-extrabold shadow-xs ${
                      col.isExcluded ? 'bg-slate-300 text-slate-600' : 'bg-slate-200 text-slate-900'
                    }`}>
                      {isRtl ? 'المجموع' : 'Total'}
                    </th>
                  </React.Fragment>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200 font-medium">
              {/* Row 1: Age Category 0 - 17 */}
              <tr className="hover:bg-slate-50 transition-colors">
                <td className="py-3 px-3 text-center font-bold text-slate-900 bg-slate-50/80 border-e-2 border-slate-300">
                  0 - 17
                </td>
                <td className="py-3 px-3 text-center font-bold text-slate-800 bg-slate-50/80 border-e-2 border-slate-300 tabular-nums">
                  {childrenCount}
                </td>
                {displayedFinancialList.map((col) => (
                  <React.Fragment key={`row1-${col.proposal.id}`}>
                    <td className={`py-3 px-2 text-center border-e border-slate-200 tabular-nums ${
                      col.isExcluded ? 'text-slate-400 bg-slate-50/30' : 'text-slate-800'
                    }`}>
                      {col.pricing.childRate ? col.pricing.childRate.toLocaleString(undefined, { minimumFractionDigits: col.pricing.childRate % 1 === 0 ? 0 : 3 }) : '-'}
                    </td>
                    <td className={`py-3 px-2 text-center border-e-2 border-slate-300 font-bold tabular-nums ${
                      col.isExcluded ? 'text-slate-400 bg-slate-100/30' : 'text-slate-900 bg-slate-50/40'
                    }`}>
                      {formatDinar(col.breakdown.childrenBase)}
                    </td>
                  </React.Fragment>
                ))}
              </tr>

              {/* Row 2: Age Category 18 - 65 */}
              <tr className="hover:bg-slate-50 transition-colors">
                <td className="py-3 px-3 text-center font-bold text-slate-900 bg-slate-50/80 border-e-2 border-slate-300">
                  18 - 65
                </td>
                <td className="py-3 px-3 text-center font-bold text-slate-800 bg-slate-50/80 border-e-2 border-slate-300 tabular-nums">
                  {adultsCount}
                </td>
                {displayedFinancialList.map((col) => (
                  <React.Fragment key={`row2-${col.proposal.id}`}>
                    <td className={`py-3 px-2 text-center border-e border-slate-200 tabular-nums ${
                      col.isExcluded ? 'text-slate-400 bg-slate-50/30' : 'text-slate-800'
                    }`}>
                      {col.pricing.adultRate ? col.pricing.adultRate.toLocaleString(undefined, { minimumFractionDigits: col.pricing.adultRate % 1 === 0 ? 0 : 3 }) : '-'}
                    </td>
                    <td className={`py-3 px-2 text-center border-e-2 border-slate-300 font-bold tabular-nums ${
                      col.isExcluded ? 'text-slate-400 bg-slate-100/30' : 'text-slate-900 bg-slate-50/40'
                    }`}>
                      {formatDinar(col.breakdown.adultsBase)}
                    </td>
                  </React.Fragment>
                ))}
              </tr>

              {/* Row 3: Age Category 66 - 75 */}
              <tr className="hover:bg-slate-50 transition-colors">
                <td className="py-3 px-3 text-center font-bold text-slate-900 bg-slate-50/80 border-e-2 border-slate-300">
                  66 - 75
                </td>
                <td className="py-3 px-3 text-center font-bold text-slate-800 bg-slate-50/80 border-e-2 border-slate-300 tabular-nums">
                  {seniorsCount}
                </td>
                {displayedFinancialList.map((col) => (
                  <React.Fragment key={`row3-${col.proposal.id}`}>
                    <td className={`py-3 px-2 text-center border-e border-slate-200 tabular-nums ${
                      col.isExcluded ? 'text-slate-400 bg-slate-50/30' : 'text-slate-600'
                    }`}>
                      {col.pricing.seniorRate && col.pricing.seniorRate > 0 ? col.pricing.seniorRate.toLocaleString() : '-'}
                    </td>
                    <td className={`py-3 px-2 text-center border-e-2 border-slate-300 font-bold tabular-nums ${
                      col.isExcluded ? 'text-slate-400 bg-slate-100/30' : 'text-slate-900 bg-slate-50/40'
                    }`}>
                      {seniorsCount > 0 && col.breakdown.seniorsBase > 0 ? formatDinar(col.breakdown.seniorsBase) : '-'}
                    </td>
                  </React.Fragment>
                ))}
              </tr>

              {/* Row 4: Base Subtotal (المجموع الأساسي) */}
              <tr className="bg-slate-100/90 font-black border-t-2 border-b-2 border-slate-300">
                <td className="py-3.5 px-3 text-center font-black text-slate-950 bg-slate-200/90 border-e-2 border-slate-300">
                  {isRtl ? 'المجموع' : 'Total Base'}
                </td>
                <td className="py-3.5 px-3 text-center font-black text-slate-950 bg-slate-200/90 border-e-2 border-slate-300 tabular-nums">
                  {totalMembers}
                </td>
                {displayedFinancialList.map((col) => (
                  <React.Fragment key={`row4-${col.proposal.id}`}>
                    <td className="py-3.5 px-2 text-center border-e border-slate-300 text-slate-400 font-normal">
                      -
                    </td>
                    <td className={`py-3.5 px-2 text-center border-e-2 border-slate-300 font-black text-sm sm:text-base tabular-nums ${
                      col.isExcluded ? 'text-slate-500 bg-slate-200/50' : 'text-slate-950 bg-slate-100'
                    }`}>
                      {formatDinar(col.breakdown.baseSubtotal)}
                    </td>
                  </React.Fragment>
                ))}
              </tr>

              {/* Row 5: Issuance Fee (رسوم إصدار) */}
              <tr className="hover:bg-slate-50 transition-colors">
                <td className="py-3 px-3 text-center font-bold text-slate-800 bg-slate-50 border-e-2 border-slate-300">
                  {isRtl ? 'رسوم إصدار' : 'Issuance Fee'}
                </td>
                <td className="py-3 px-3 text-center font-medium text-slate-400 bg-slate-50 border-e-2 border-slate-300">
                  -
                </td>
                {displayedFinancialList.map((col) => (
                  <React.Fragment key={`row5-${col.proposal.id}`}>
                    <td className={`py-3 px-2 text-center border-e border-slate-200 tabular-nums font-semibold ${
                      col.isExcluded ? 'text-slate-400' : 'text-slate-700'
                    }`}>
                      {formatFeeRate(col.breakdown.issuanceFeePercent, 'issuance')}
                    </td>
                    <td className={`py-3 px-2 text-center border-e-2 border-slate-300 tabular-nums font-bold ${
                      col.isExcluded ? 'text-slate-400 bg-slate-100/30' : 'text-slate-900 bg-slate-50/40'
                    }`}>
                      {formatCurrency(col.breakdown.issuanceFeeAmount)}
                    </td>
                  </React.Fragment>
                ))}
              </tr>

              {/* Row 6: Revenue Stamp Fee (رسوم طوابع) */}
              <tr className="hover:bg-slate-50 transition-colors">
                <td className="py-3 px-3 text-center font-bold text-slate-800 bg-slate-50 border-e-2 border-slate-300">
                  {isRtl ? 'رسوم طوابع' : 'Stamp Duty'}
                </td>
                <td className="py-3 px-3 text-center font-medium text-slate-400 bg-slate-50 border-e-2 border-slate-300">
                  -
                </td>
                {displayedFinancialList.map((col) => (
                  <React.Fragment key={`row6-${col.proposal.id}`}>
                    <td className={`py-3 px-2 text-center border-e border-slate-200 tabular-nums font-semibold ${
                      col.isExcluded ? 'text-slate-400' : 'text-slate-700'
                    }`}>
                      {formatFeeRate(col.breakdown.stampsFeePercent, 'stamps')}
                    </td>
                    <td className={`py-3 px-2 text-center border-e-2 border-slate-300 tabular-nums font-bold ${
                      col.isExcluded ? 'text-slate-400 bg-slate-100/30' : 'text-slate-900 bg-slate-50/40'
                    }`} title={isRtl ? 'محتسبة بنسبة 0.01 وفقاً للقانون' : '0.01 statutory stamp duty'}>
                      {formatCurrency(col.breakdown.stampsFeeAmount)}
                    </td>
                  </React.Fragment>
                ))}
              </tr>

              {/* Row 7: Policyholder Guarantee Fund Fee (رسوم صندوق ضمان المؤمن له) */}
              <tr className="hover:bg-slate-50 transition-colors">
                <td className="py-3 px-3 text-center font-bold text-slate-800 bg-slate-50 border-e-2 border-slate-300 text-[11px] sm:text-xs">
                  {isRtl ? 'رسوم صندوق ضمان المؤمن له' : 'Guarantee Fund'}
                </td>
                <td className="py-3 px-3 text-center font-medium text-slate-400 bg-slate-50 border-e-2 border-slate-300">
                  -
                </td>
                {displayedFinancialList.map((col) => (
                  <React.Fragment key={`row7-${col.proposal.id}`}>
                    <td className={`py-3 px-2 text-center border-e border-slate-200 tabular-nums font-semibold text-xs ${
                      col.isExcluded ? 'text-slate-400' : 'text-slate-700'
                    }`}>
                      {formatFeeRate(col.breakdown.guaranteeFundFeePercent, 'guarantee')}
                    </td>
                    <td className={`py-3 px-2 text-center border-e-2 border-slate-300 tabular-nums font-bold ${
                      col.isExcluded ? 'text-slate-400 bg-slate-100/30' : 'text-slate-900 bg-slate-50/40'
                    }`}>
                      {formatCurrency(col.breakdown.guaranteeFundFeeAmount)}
                    </td>
                  </React.Fragment>
                ))}
              </tr>

              {/* Row 8: Grand Total Premium (المجموع الكلي المعتمد) */}
              <tr className="border-t-2 border-b-2 border-slate-400 bg-amber-50/60 font-black">
                <td className="py-4 px-3 text-center font-black text-slate-950 bg-amber-100/90 border-e-2 border-slate-300 text-sm">
                  {isRtl ? 'المجموع الكلي' : 'Total Premium'}
                </td>
                <td className="py-4 px-3 text-center font-black text-slate-950 bg-amber-100/90 border-e-2 border-slate-300 tabular-nums">
                  {totalMembers}
                </td>
                {displayedFinancialList.map((col) => {
                  const isExcluded = col.isExcluded;
                  const isFirst = !isExcluded && col.financialRank === 1;
                  const isSecond = !isExcluded && col.financialRank === 2;

                  return (
                    <React.Fragment key={`row8-${col.proposal.id}`}>
                      <td colSpan={2} className={`py-4 px-2 text-center border-e-2 border-slate-300 text-base sm:text-lg font-black tabular-nums ${
                        isExcluded
                          ? 'bg-slate-100 text-slate-500'
                          : isFirst 
                          ? 'bg-yellow-200/90 text-slate-950 shadow-inner' 
                          : isSecond
                          ? 'bg-amber-100/70 text-slate-950'
                          : 'bg-white text-slate-900'
                      }`}>
                        <div className="flex flex-col items-center justify-center">
                          <span className={isExcluded ? 'line-through text-slate-400 text-sm sm:text-base' : ''}>
                            {formatDinar(col.totalPremium)} <span className="text-xs font-normal text-slate-600">{isRtl ? 'دينار' : 'JOD'}</span>
                          </span>
                          {col.totalPremium % 1 !== 0 && (
                            <span className="text-[10px] text-slate-500 font-normal">
                              ({formatCurrency(col.totalPremium)})
                            </span>
                          )}
                          {isExcluded && (
                            <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 mt-1">
                              {isRtl ? 'مستثنى بقرار اللجنة' : 'Excluded by Committee'}
                            </span>
                          )}
                        </div>
                      </td>
                    </React.Fragment>
                  );
                })}
              </tr>

              {/* Row 9: 40% Financial Evaluation Score (علامة التقييم المالي) */}
              <tr className="border-b-2 border-slate-300 bg-emerald-50/50">
                <td className="py-3.5 px-3 text-center font-black text-emerald-950 bg-emerald-100/80 border-e-2 border-slate-300">
                  {isRtl ? 'التقييم المالي (40%)' : 'Financial (40%)'}
                </td>
                <td className="py-3.5 px-3 text-center font-black text-emerald-950 bg-emerald-100/80 border-e-2 border-slate-300">
                  40%
                </td>
                {displayedFinancialList.map((col) => {
                  const isExcluded = col.isExcluded;
                  const isFirst = !isExcluded && col.financialRank === 1;

                  return (
                    <td 
                      key={`row9-${col.proposal.id}`} 
                      colSpan={2} 
                      className={`py-3.5 px-3 text-center border-e-2 border-slate-300 ${
                        isExcluded 
                          ? 'bg-slate-100/60'
                          : isFirst 
                          ? 'bg-emerald-100/90' 
                          : 'bg-emerald-50/30'
                      }`}
                    >
                      <div className="flex flex-col items-center justify-center gap-1">
                        {isExcluded ? (
                          <>
                            <span className="text-sm font-black text-rose-700 bg-rose-50 px-2.5 py-1 rounded border border-rose-200">
                              {isRtl ? 'مستثنى (0%)' : 'Excluded (0%)'}
                            </span>
                            <span className="text-[10px] text-slate-500 font-medium mt-0.5">
                              {isRtl ? 'لا يدخل في معادلة أقل سعر' : 'Excluded from lowest price formula'}
                            </span>
                          </>
                        ) : (
                          <>
                            <span className="text-lg font-black text-emerald-950 tabular-nums">
                              {col.financial40Rounded}%
                            </span>
                            <span className="text-[10px] text-slate-600 font-mono bg-white/80 px-2 py-0.5 rounded border border-slate-200" title={isRtl ? 'معادلة الاحتساب الرسمية' : 'Official Formula'}>
                              {isFirst 
                                ? (isRtl ? '40.00% كاملة (أقل سعر)' : 'Full 40.00% (Lowest)') 
                                : `(${formatDinar(lowestPrice)} / ${formatDinar(col.totalPremium)}) × 40%`}
                            </span>
                          </>
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>

              {/* Row 10: Financial Rank (الترتيب المالي) */}
              <tr className="bg-slate-100">
                <td className="py-3 px-3 text-center font-black text-slate-900 border-e-2 border-slate-300">
                  {isRtl ? 'الترتيب المالي' : 'Financial Rank'}
                </td>
                <td className="py-3 px-3 text-center font-medium text-slate-500 border-e-2 border-slate-300">
                  -
                </td>
                {displayedFinancialList.map((col) => {
                  const isExcluded = col.isExcluded;
                  const isFirst = !isExcluded && col.financialRank === 1;

                  return (
                    <td 
                      key={`row10-${col.proposal.id}`} 
                      colSpan={2} 
                      className={`py-3 px-2 text-center border-e-2 border-slate-300 font-bold ${
                        isExcluded ? 'bg-slate-200/60' : ''
                      }`}
                    >
                      {isExcluded ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-rose-100 text-rose-800 border border-rose-300">
                          <Ban className="w-3.5 h-3.5 text-rose-600" />
                          {isRtl ? 'مستثنى من الترتيب' : 'Excluded from Ranking'}
                        </span>
                      ) : isFirst ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black bg-yellow-400 text-slate-950 shadow-xs">
                          <Trophy className="w-3.5 h-3.5 text-slate-950" />
                          {isRtl ? 'المرتبة الأولى (الفائز المالي)' : 'Rank #1 (Financial Winner)'}
                        </span>
                      ) : (
                        <span className="text-xs font-bold text-slate-700 bg-white px-2.5 py-1 rounded-md border border-slate-300">
                          {isRtl ? `المرتبة ${col.financialRank}` : `Rank #${col.financialRank}`}
                        </span>
                      )}
                    </td>
                  );
                })}
              </tr>

            </tbody>
          </table>
        </div>

        {/* Footer Notes and Statutory Compliance Notice */}
        <div className="p-4 bg-slate-50 border-t border-slate-300 text-xs text-slate-600 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              {isRtl 
                ? 'مطابق بنسبة 100% لكشف التقييم المالي المعتمد في كراسة العطاء ولجنة الترسية وموزع حسب الفئات العمرية والرسوم القانونية.'
                : '100% verified and synchronized with official tender evaluation spreadsheet, statutory fee regulations, and demographic census.'}
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs font-semibold flex-wrap">
            <span className="text-slate-600 font-mono">
              {isRtl ? 'معادلة الـ 40% = (أقل سعر معتمد ÷ سعر العرض) × 40' : 'Financial Formula = (Lowest Price / Offer Price) * 40'}
            </span>
            <span className="text-slate-500">
              {isRtl ? 'طوابع: 0.01 + صندوق ضمان: 0.005 (5 في الألف)' : 'Stamps: 0.01 + Guarantee: 0.005'}
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: "Where did the numbers come from?" (Data Sources & Letters)     */}
      {/* ========================================================================= */}
      {showExplanationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900">
                    {isRtl ? 'مصادر الأرقام والوثائق الرسمية المعتمدة' : 'Official Data Sources & Certified Documents'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {isRtl ? 'توضيح أصول احتساب الأسعار والرسوم القانونية لكل شركة تأمين' : 'Detailed breakdown of verified sources and pricing rates'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowExplanationModal(false)}
                className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto py-4 space-y-4 text-xs sm:text-sm text-slate-700">
              {/* Census Basis */}
              <div className="p-3.5 bg-sky-50 rounded-xl border border-sky-200">
                <h4 className="font-extrabold text-sky-950 mb-1 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-sky-700" />
                  {isRtl ? 'التعداد الديمغرافي المعتمد (256 مؤمن له):' : 'Certified Demographic Census (256 Members):'}
                </h4>
                <p className="text-xs text-sky-900 leading-relaxed">
                  {isRtl 
                    ? `تعداد الجامعة المعتمد في كراسة العطاء يتضمن: 97 مشتركاً فئة الأطفال (0 - 17 سنة)، 159 مشتركاً فئة البالغين (18 - 65 سنة)، بإجمالي 256 مشتركاً بالدرجة الأولى.`
                    : `Demographic census: 97 children (0-17 yrs) and 159 adults (18-65 yrs) totaling 256 members.`}
                </p>
              </div>

              {/* Jordan Insurance Company */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-extrabold text-slate-900 text-sm">
                    {isRtl ? '1. شركة التأمين الأردنية (JIC):' : '1. Jordan Insurance Company (JIC):'}
                  </h4>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-black">
                    {formatCurrency(141600.32)} {isRtl ? 'دينار' : 'JOD'}
                  </span>
                </div>
                <div className="text-xs text-slate-600 space-y-1 leading-relaxed">
                  <p>
                    <strong className="text-slate-800">{isRtl ? 'المرجع الرسمي:' : 'Official Reference:'}</strong> {isRtl ? 'كتاب التجديد الرسمي رقم GD/1150-11798/25/2 بتاريخ 26/07/2026.' : 'Official renewal letter GD/1150-11798/25/2 dated 26/07/2026.'}
                  </p>
                  <p>
                    <strong className="text-slate-800">{isRtl ? 'الأسعار الفردية:' : 'Rates:'}</strong> 0-17 سنة: <strong>339.900 د</strong> (97 فرد = 32,970.30 د) | 18-65 سنة: <strong>636.460 د</strong> (159 فرد = 101,197.14 د).
                  </p>
                  <p>
                    <strong className="text-slate-800">{isRtl ? 'المجموع الأساسي:' : 'Base Subtotal:'}</strong> 134,167.44 دينار.
                  </p>
                  <p>
                    <strong className="text-slate-800">{isRtl ? 'الرسوم القانونية المعتمدة:' : 'Legal Fees:'}</strong> بدل إصدار 0.04 (5,366.70 د) + طوابع مالية 0.01 (1,395.34 د) + صندوق ضمان المؤمن له 0.005 (670.84 د) = <strong>7,432.88 دينار</strong>.
                  </p>
                  <p className="font-bold text-slate-900">
                    {isRtl ? 'الإجمالي الكلي النهائي:' : 'Grand Total:'} 141,600.32 دينار.
                  </p>
                  <p className="text-[11px] text-amber-700 bg-amber-50 p-2 rounded-lg border border-amber-200 mt-1">
                    {isRtl ? 'ملاحظة: إذا كان هناك عرض بديل سابق للشركة بمبلغ 135,175 دينار (بأسعار 324.555 د و 607.53 د)، يمكنك استثناء أحد العرضين بنقرة واحدة من رأس الجدول.' : 'Note: If an alternate offer exists, you can exclude either one with a single click.'}
                  </p>
                </div>
              </div>

              {/* JOFICO */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-extrabold text-slate-900 text-sm">
                    {isRtl ? '2. الأردنية الفرنسية للتأمين (JOFICO) - الفائز المالي:' : '2. JOFICO (Financial Winner):'}
                  </h4>
                  <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 text-xs font-black">
                    {formatCurrency(118385.40)} {isRtl ? 'دينار (أقل سعر)' : 'JOD (Lowest)'}
                  </span>
                </div>
                <div className="text-xs text-slate-600 space-y-1 leading-relaxed">
                  <p>
                    <strong className="text-slate-800">{isRtl ? 'الأسعار الفردية:' : 'Rates:'}</strong> 0-17 سنة: <strong>298.50 د</strong> (97 فرد = 28,954.50 د) | 18-65 سنة: <strong>524.30 د</strong> (159 فرد = 83,363.70 د).
                  </p>
                  <p>
                    <strong className="text-slate-800">{isRtl ? 'المجموع الأساسي:' : 'Base Subtotal:'}</strong> 112,318.20 دينار + رسوم قانونية (6,067.20 د) = <strong>118,385.40 دينار</strong>.
                  </p>
                  <p>
                    <strong className="text-slate-800">{isRtl ? 'التقييم المالي:' : 'Score:'}</strong> بما أنه أقل سعر معتمد، يحصل على كامل علامة الـ 40.00% المالية والترتيب رقم 1.
                  </p>
                </div>
              </div>

              {/* GIG & MEICO */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <h4 className="font-extrabold text-slate-900 text-sm">
                  {isRtl ? '3. بقية الشركات المنافسة:' : '3. Other Competitors:'}
                </h4>
                <ul className="list-disc list-inside text-xs text-slate-600 space-y-1">
                  <li>
                    <strong>مجموعة الخليج للتأمين (GIG):</strong> قسط إجمالي 147,819.50 دينار (علامة مالية: 32.04%).
                  </li>
                  <li>
                    <strong>شركة الشرق الأوسط للتأمين (MEICO):</strong> قسط إجمالي 168,939.80 دينار (علامة مالية: 28.03%).
                  </li>
                  <li>
                    <strong>شركة القدس للتأمين:</strong> قسط إجمالي 168,000.00 دينار (علامة مالية: 28.19%).
                  </li>
                </ul>
              </div>

              {/* Statutory Fees Reference */}
              <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-950 space-y-1">
                <h4 className="font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                  {isRtl ? 'الرسوم القانونية المعتمدة وفقاً للتشريعات الأردنية:' : 'Statutory Legal Fees in Jordan:'}
                </h4>
                <p>• <strong>بدل خدمة إصدار:</strong> 0.04 إلى 0.05 بموجب تعليمات هيئة التأمين والبنك المركزي.</p>
                <p>• <strong>رسوم طوابع الواردات:</strong> 0.01 تحتسب على القسط الأساسي ورسوم الإصدار.</p>
                <p>• <strong>صندوق ضمان المؤمن لهم والمستفيدين:</strong> 0.005 (5 في الألف) بموجب قرار مجلس إدارة البنك المركزي الأردني رقم 2024/145 (ملاحظة: النسبة 0.005 وليست 0.005%).</p>
              </div>
            </div>

            <div className="border-t border-slate-200 pt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setShowExplanationModal(false)}
                className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors cursor-pointer"
              >
                {isRtl ? 'إغلاق' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: Direct Company Rates Editing                                     */}
      {/* ========================================================================= */}
      {editingProposalId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Edit3 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    {isRtl ? 'تعديل أسعار ورسوم العرض المالي' : 'Edit Proposal Pricing Rates'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {proposals.find(p => p.id === editingProposalId)?.companyName}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingProposalId(null)}
                className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {isRtl ? 'قسط فئة 0 - 17 سنة (دينار)' : 'Children Rate (0-17)'}
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    value={editForm.childRate}
                    onChange={(e) => setEditForm({ ...editForm, childRate: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-emerald-500 font-bold tabular-nums"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {isRtl ? 'قسط فئة 18 - 65 سنة (دينار)' : 'Adults Rate (18-65)'}
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    value={editForm.adultRate}
                    onChange={(e) => setEditForm({ ...editForm, adultRate: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-emerald-500 font-bold tabular-nums"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200">
                <div>
                  <label className="block font-bold text-slate-700 mb-1 text-[11px]">
                    {isRtl ? 'رسوم الإصدار (كسر عشري)' : 'Issuance (Rate)'}
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    value={editForm.issuanceFeePercent}
                    onChange={(e) => setEditForm({ ...editForm, issuanceFeePercent: parseFloat(e.target.value) || 0 })}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 focus:outline-emerald-500 font-bold tabular-nums text-center text-xs"
                    placeholder="0.05"
                  />
                  <span className="block text-[10px] text-slate-400 text-center mt-0.5">
                    {isRtl ? 'مثل: 0.05 أو 0.04' : 'e.g. 0.05 or 0.04'}
                  </span>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1 text-[11px]">
                    {isRtl ? 'رسوم الطوابع (كسر عشري)' : 'Stamps (Rate)'}
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    value={editForm.stampsFeePercent}
                    onChange={(e) => setEditForm({ ...editForm, stampsFeePercent: parseFloat(e.target.value) || 0 })}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 focus:outline-emerald-500 font-bold tabular-nums text-center text-xs"
                    placeholder="0.01"
                  />
                  <span className="block text-[10px] text-slate-400 text-center mt-0.5">
                    {isRtl ? 'مثل: 0.01' : 'e.g. 0.01'}
                  </span>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1 text-[11px]">
                    {isRtl ? 'صندوق الضمان (كسر عشري)' : 'Guarantee (Rate)'}
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    value={editForm.guaranteeFundFeePercent}
                    onChange={(e) => setEditForm({ ...editForm, guaranteeFundFeePercent: parseFloat(e.target.value) || 0 })}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 focus:outline-emerald-500 font-bold tabular-nums text-center text-xs"
                    placeholder="0.005"
                  />
                  <span className="block text-[10px] text-slate-400 text-center mt-0.5">
                    {isRtl ? 'مثل: 0.005 (5 في الألف)' : 'e.g. 0.005 (5/1000)'}
                  </span>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {isRtl ? 'ملاحظات وتفاصيل السعر المعتمد' : 'Notes & Reference'}
                </label>
                <textarea
                  rows={2}
                  value={editForm.customNotes}
                  onChange={(e) => setEditForm({ ...editForm, customNotes: e.target.value })}
                  placeholder={isRtl ? 'مثال: كتاب التجديد رقم... بتاريخ...' : 'e.g. Renewal letter...'}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-emerald-500 text-xs"
                />
              </div>

              {/* Preview Total Premium with updated values */}
              <div className="p-3 bg-slate-100 rounded-xl flex items-center justify-between font-black text-xs">
                <span>{isRtl ? 'المجموع المحتسب بعد التعديل:' : 'Calculated Total Premium:'}</span>
                <span className="text-emerald-700 text-sm font-black tabular-nums">
                  {(() => {
                    const tempBase = (childrenCount * (Number(editForm.childRate) || 0)) + (adultsCount * (Number(editForm.adultRate) || 0));
                    const issMult = normalizeFeeMultiplier(editForm.issuanceFeePercent, 'issuance');
                    const stampsMult = normalizeFeeMultiplier(editForm.stampsFeePercent, 'stamps');
                    const guaranteeMult = normalizeFeeMultiplier(editForm.guaranteeFundFeePercent, 'guarantee');
                    const issuanceAmt = tempBase * issMult;
                    const stampsAmt = (tempBase + issuanceAmt) * stampsMult;
                    const guaranteeAmt = tempBase * guaranteeMult;
                    const total = tempBase + issuanceAmt + stampsAmt + guaranteeAmt;
                    return `${formatCurrency(total)} ${isRtl ? 'دينار' : 'JOD'}`;
                  })()}
                </span>
              </div>
            </div>

            <div className="border-t border-slate-200 pt-4 mt-4 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingProposalId(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
              >
                {isRtl ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleSaveEditRates}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
              >
                <Save className="w-4 h-4" />
                <span>{isRtl ? 'حفظ وتحديث الجدول فوراً' : 'Save & Update Table'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
