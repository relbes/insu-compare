import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, 
  Calculator, 
  Percent, 
  Building2, 
  ShieldCheck, 
  Receipt, 
  ArrowRight, 
  CheckCircle2, 
  Edit3, 
  Sparkles, 
  HelpCircle,
  TrendingDown,
  TrendingUp,
  RotateCcw,
  Sliders,
  DollarSign,
  Plus,
  Minus,
  FileSpreadsheet
} from 'lucide-react';
import { CompanyProposal, DemographicCensus, CompanyPricingStructure } from '../types';
import { 
  DEFAULT_DEMOGRAPHIC_CENSUS, 
  calculateCompanyPremium, 
  getDefaultCompanyPricing,
  resolveProposalPricing,
  formatFeeRate,
  normalizeFeeMultiplier
} from '../utils/actuarialCalculator';
import { OfficialFinancialEvaluationMatrix } from './OfficialFinancialEvaluationMatrix';
import { useI18n } from '../i18n/I18nContext';
import { TenderTermsForensicViewer } from './TenderTermsForensicViewer';

interface ActuarialPricingCalculatorProps {
  proposals: CompanyProposal[];
  census: DemographicCensus;
  onUpdateCensus: (newCensus: DemographicCensus) => void;
  onUpdateProposals: (updatedProposals: CompanyProposal[]) => void;
  onToggleExcludeProposal?: (proposalId: string) => void;
  onNavigateToMatrix?: () => void;
}

export const ActuarialPricingCalculator: React.FC<ActuarialPricingCalculatorProps> = ({
  proposals,
  census,
  onUpdateCensus,
  onUpdateProposals,
  onToggleExcludeProposal,
  onNavigateToMatrix
}) => {
  const { isRtl } = useI18n();

  // Local state for census inputs (3 age brackets based on tender specifications)
  const [childrenInput, setChildrenInput] = useState<number>(census.childrenCount ?? 97);
  const [adultsInput, setAdultsInput] = useState<number>(census.adultsCount ?? 159);
  const [seniorsInput, setSeniorsInput] = useState<number>(census.seniorsCount ?? 0);
  const [includeDental, setIncludeDental] = useState<boolean>(census.includeDental || false);
  const [includeOptical, setIncludeOptical] = useState<boolean>(census.includeOptical || false);

  // Sync with prop when external updates occur
  useEffect(() => {
    setChildrenInput(census.childrenCount ?? 97);
    setAdultsInput(census.adultsCount ?? 159);
    setSeniorsInput(census.seniorsCount ?? 0);
    setIncludeDental(census.includeDental || false);
    setIncludeOptical(census.includeOptical || false);
  }, [census.childrenCount, census.adultsCount, census.seniorsCount, census.includeDental, census.includeOptical]);

  // Selected proposal for deep-dive detail
  const [selectedProposalId, setSelectedProposalId] = useState<string>(proposals[0]?.id || '');

  // Auto-sync on mount to resolve any stale fallback rates (e.g. 310/510/750 applied to Middle East or Jordan International)
  useEffect(() => {
    let hasChanges = false;
    const currentCensus: DemographicCensus = {
      totalMembers: totalCalculated,
      childrenCount: childrenInput,
      adultsCount: adultsInput,
      seniorsCount: seniorsInput,
      includeDental,
      includeOptical
    };

    const resolvedProposals = proposals.map(p => {
      const resolvedPricing = resolveProposalPricing(p.companyName, p.pricingStructure);
      const isPricingDifferent = JSON.stringify(resolvedPricing) !== JSON.stringify(p.pricingStructure);
      const breakdown = calculateCompanyPremium(resolvedPricing, currentCensus);
      const isPremiumDifferent = !p.calculatedBreakdown || p.premiumAnnual !== breakdown.totalAnnualPremium;

      if (isPricingDifferent || isPremiumDifferent) {
        hasChanges = true;
        return {
          ...p,
          pricingStructure: resolvedPricing,
          calculatedBreakdown: breakdown,
          premiumAnnual: breakdown.totalAnnualPremium
        };
      }
      return p;
    });

    if (hasChanges) {
      onUpdateProposals(resolvedProposals);
    }
  }, []);

  // Editing company pricing modal
  const [editingProposalId, setEditingProposalId] = useState<string | null>(null);
  const [editChildRate, setEditChildRate] = useState<number>(310);
  const [editAdultRate, setEditAdultRate] = useState<number>(510);
  const [editSeniorRate, setEditSeniorRate] = useState<number>(750);
  
  // Specific Statutory Fees (Jordan Regulatory Standard)
  const [editIssuanceFeePercent, setEditIssuanceFeePercent] = useState<number>(5.0); // رسوم إصدار
  const [editStampsFeePercent, setEditStampsFeePercent] = useState<number>(1.0); // رسوم طوابع
  const [editGuaranteeFundFeePercent, setEditGuaranteeFundFeePercent] = useState<number>(0.5); // رسوم صندوق ضمان المؤمن له
  const [editFeesPercent, setEditFeesPercent] = useState<number>(6.5);
  const [editFixedFee, setEditFixedFee] = useState<number>(0);
  const [editDentalRate, setEditDentalRate] = useState<number>(35);
  const [editOpticalRate, setEditOpticalRate] = useState<number>(20);
  const [editNotes, setEditNotes] = useState<string>('');

  // Toggle to expand detailed statutory fees columns in the main table
  const [showDetailedFeesColumns, setShowDetailedFeesColumns] = useState<boolean>(false);

  const totalCalculated = Math.max(0, childrenInput + adultsInput + seniorsInput);
  const childRatio = totalCalculated > 0 ? Math.round((childrenInput / totalCalculated) * 100) : 38;
  const adultRatio = totalCalculated > 0 ? Math.round((adultsInput / totalCalculated) * 100) : 62;
  const seniorRatio = totalCalculated > 0 ? Math.max(0, 100 - childRatio - adultRatio) : 0;

  // Apply changes to demographic census
  const handleCensusChange = (
    children: number, 
    adults: number, 
    seniors: number, 
    dental: boolean, 
    optical: boolean
  ) => {
    const validChildren = Math.max(0, Math.round(children));
    const validAdults = Math.max(0, Math.round(adults));
    const validSeniors = Math.max(0, Math.round(seniors));
    setChildrenInput(validChildren);
    setAdultsInput(validAdults);
    setSeniorsInput(validSeniors);
    setIncludeDental(dental);
    setIncludeOptical(optical);

    const updatedCensus: DemographicCensus = {
      totalMembers: validChildren + validAdults + validSeniors,
      childrenCount: validChildren,
      adultsCount: validAdults,
      seniorsCount: validSeniors,
      includeDental: dental,
      includeOptical: optical
    };

    onUpdateCensus(updatedCensus);

    // Synchronize proposals' premiums immediately using resolved company rates
    const updatedProposals = proposals.map(prop => {
      const pricing = resolveProposalPricing(prop.companyName, prop.pricingStructure);
      const breakdown = calculateCompanyPremium(pricing, updatedCensus);
      return {
        ...prop,
        pricingStructure: pricing,
        calculatedBreakdown: breakdown,
        premiumAnnual: breakdown.totalAnnualPremium
      };
    });

    onUpdateProposals(updatedProposals);
  };

  // Directly change total subscribers (scales proportionally across categories)
  const handleTotalChange = (newTotal: number) => {
    const validTotal = Math.max(1, Math.round(newTotal));
    const currentTotal = totalCalculated || 256;
    const ratioChild = currentTotal > 0 ? (childrenInput / currentTotal) : (97 / 256);
    const ratioSenior = currentTotal > 0 ? (seniorsInput / currentTotal) : 0;
    
    const newChildren = Math.round(validTotal * ratioChild);
    const newSeniors = Math.round(validTotal * ratioSenior);
    const newAdults = Math.max(0, validTotal - newChildren - newSeniors);
    handleCensusChange(newChildren, newAdults, newSeniors, includeDental, includeOptical);
  };

  // Step total (+/- delta)
  const handleStepTotal = (delta: number) => {
    handleTotalChange(totalCalculated + delta);
  };

  // Step individual categories
  const handleStepChildren = (delta: number) => {
    const newChildren = Math.max(0, childrenInput + delta);
    handleCensusChange(newChildren, adultsInput, seniorsInput, includeDental, includeOptical);
  };

  const handleStepAdults = (delta: number) => {
    const newAdults = Math.max(0, adultsInput + delta);
    handleCensusChange(childrenInput, newAdults, seniorsInput, includeDental, includeOptical);
  };

  const handleStepSeniors = (delta: number) => {
    const newSeniors = Math.max(0, seniorsInput + delta);
    handleCensusChange(childrenInput, adultsInput, newSeniors, includeDental, includeOptical);
  };

  // Direct inline rate editing from table cells
  const handleInlineRateChange = (
    proposalId: string, 
    field: 'childRate' | 'adultRate' | 'seniorRate' | 'feesPercentage' | 'issuanceFeePercent' | 'stampsFeePercent' | 'guaranteeFundFeePercent' | 'fixedContractFee', 
    val: number
  ) => {
    const validVal = Math.max(0, val);
    const currentCensus: DemographicCensus = {
      totalMembers: totalCalculated,
      childrenCount: childrenInput,
      adultsCount: adultsInput,
      seniorsCount: seniorsInput,
      includeDental,
      includeOptical
    };

    const updated = proposals.map(p => {
      if (p.id === proposalId) {
        const currentPricing = resolveProposalPricing(p.companyName, p.pricingStructure);
        const updatedPricing: CompanyPricingStructure = {
          ...currentPricing,
          [field]: validVal
        };

        // If one of the 3 statutory fee components changed, recalculate total feesPercentage:
        if (field === 'issuanceFeePercent' || field === 'stampsFeePercent' || field === 'guaranteeFundFeePercent') {
          const iss = normalizeFeeMultiplier(field === 'issuanceFeePercent' ? validVal : updatedPricing.issuanceFeePercent, 'issuance');
          const stp = normalizeFeeMultiplier(field === 'stampsFeePercent' ? validVal : updatedPricing.stampsFeePercent, 'stamps');
          const gfd = normalizeFeeMultiplier(field === 'guaranteeFundFeePercent' ? validVal : updatedPricing.guaranteeFundFeePercent, 'guarantee');
          updatedPricing.issuanceFeePercent = iss;
          updatedPricing.stampsFeePercent = stp;
          updatedPricing.guaranteeFundFeePercent = gfd;
          updatedPricing.feesPercentage = Math.round((iss + stp + gfd) * 10000) / 100;
        } else if (field === 'feesPercentage') {
          // If total fee percentage was edited directly, maintain proportional split: 0.05/0.065, 0.01/0.065, 0.005/0.065
          const ratio = validVal > 0 ? (validVal / 6.5) : 0;
          updatedPricing.issuanceFeePercent = Math.round(0.05 * ratio * 1000) / 1000;
          updatedPricing.stampsFeePercent = Math.round(0.01 * ratio * 1000) / 1000;
          updatedPricing.guaranteeFundFeePercent = Math.round(0.005 * ratio * 1000) / 1000;
        }

        const breakdown = calculateCompanyPremium(updatedPricing, currentCensus);
        return {
          ...p,
          pricingStructure: updatedPricing,
          calculatedBreakdown: breakdown,
          premiumAnnual: breakdown.totalAnnualPremium
        };
      }
      return p;
    });

    onUpdateProposals(updated);
  };

  // Reset a specific company proposal to its official tender default rates
  const handleResetProposalToDefault = (proposalId: string) => {
    const currentCensus: DemographicCensus = {
      totalMembers: totalCalculated,
      childrenCount: childrenInput,
      adultsCount: adultsInput,
      seniorsCount: seniorsInput,
      includeDental,
      includeOptical
    };

    const updated = proposals.map(p => {
      if (p.id === proposalId) {
        const defaultPricing = getDefaultCompanyPricing(p.companyName);
        const breakdown = calculateCompanyPremium(defaultPricing, currentCensus);
        return {
          ...p,
          pricingStructure: defaultPricing,
          calculatedBreakdown: breakdown,
          premiumAnnual: breakdown.totalAnnualPremium
        };
      }
      return p;
    });

    onUpdateProposals(updated);
  };

  // Reset all proposals in comparison to their respective official company defaults
  const handleResetAllToDefaults = () => {
    const currentCensus: DemographicCensus = {
      totalMembers: totalCalculated,
      childrenCount: childrenInput,
      adultsCount: adultsInput,
      seniorsCount: seniorsInput,
      includeDental,
      includeOptical
    };

    const updated = proposals.map(p => {
      const defaultPricing = getDefaultCompanyPricing(p.companyName);
      const breakdown = calculateCompanyPremium(defaultPricing, currentCensus);
      return {
        ...p,
        pricingStructure: defaultPricing,
        calculatedBreakdown: breakdown,
        premiumAnnual: breakdown.totalAnnualPremium
      };
    });

    onUpdateProposals(updated);
  };

  // Open Edit Pricing Modal
  const handleOpenEditPricing = (proposal: CompanyProposal) => {
    const pricing = resolveProposalPricing(proposal.companyName, proposal.pricingStructure);
    setEditingProposalId(proposal.id);
    setEditChildRate(pricing.childRate);
    setEditAdultRate(pricing.adultRate);
    setEditSeniorRate(pricing.seniorRate || Math.round(pricing.adultRate * 1.4));

    // 3 Specific Statutory Fees
    const iss = normalizeFeeMultiplier(
      typeof pricing.issuanceFeePercent === 'number' 
        ? pricing.issuanceFeePercent 
        : (pricing.feesBreakdown?.issuancePercent ?? 0.05),
      'issuance'
    );
    const stp = normalizeFeeMultiplier(
      typeof pricing.stampsFeePercent === 'number' 
        ? pricing.stampsFeePercent 
        : (pricing.feesBreakdown?.revenueStampsPercent ?? 0.01),
      'stamps'
    );
    const gfd = normalizeFeeMultiplier(
      typeof pricing.guaranteeFundFeePercent === 'number' 
        ? pricing.guaranteeFundFeePercent 
        : (pricing.feesBreakdown?.guaranteeFundPercent ?? 0.005),
      'guarantee'
    );

    setEditIssuanceFeePercent(iss);
    setEditStampsFeePercent(stp);
    setEditGuaranteeFundFeePercent(gfd);
    setEditFeesPercent(pricing.feesPercentage || Math.round((iss + stp + gfd) * 10000) / 100);
    setEditFixedFee(pricing.fixedContractFee);
    setEditDentalRate(pricing.dentalRatePerPerson || 0);
    setEditOpticalRate(pricing.opticalRatePerPerson || 0);
    setEditNotes(pricing.customNotes || '');
  };

  // Save Company Pricing Rate Card
  const handleSaveCompanyPricing = () => {
    if (!editingProposalId) return;

    const currentCensus: DemographicCensus = {
      totalMembers: totalCalculated,
      childrenCount: childrenInput,
      adultsCount: adultsInput,
      seniorsCount: seniorsInput,
      includeDental,
      includeOptical
    };

    const iss = normalizeFeeMultiplier(editIssuanceFeePercent, 'issuance');
    const stp = normalizeFeeMultiplier(editStampsFeePercent, 'stamps');
    const gfd = normalizeFeeMultiplier(editGuaranteeFundFeePercent, 'guarantee');
    const calculatedTotalPercent = Math.round((iss + stp + gfd) * 10000) / 100;

    const newPricing: CompanyPricingStructure = {
      childRate: editChildRate,
      adultRate: editAdultRate,
      seniorRate: editSeniorRate,
      issuanceFeePercent: iss,
      stampsFeePercent: stp,
      guaranteeFundFeePercent: gfd,
      feesPercentage: calculatedTotalPercent,
      feesBreakdown: {
        issuancePercent: iss,
        revenueStampsPercent: stp,
        guaranteeFundPercent: gfd,
        description: `رسوم إصدار ${formatFeeRate(iss, 'issuance')} + رسوم طوابع ${formatFeeRate(stp, 'stamps')} + رسوم صندوق ضمان المؤمن له ${formatFeeRate(gfd, 'guarantee')}`
      },
      fixedContractFee: editFixedFee,
      dentalRatePerPerson: editDentalRate,
      opticalRatePerPerson: editOpticalRate,
      customNotes: editNotes
    };

    const breakdown = calculateCompanyPremium(newPricing, currentCensus);

    const updatedProposals = proposals.map(p => {
      if (p.id === editingProposalId) {
        return {
          ...p,
          pricingStructure: newPricing,
          calculatedBreakdown: breakdown,
          premiumAnnual: breakdown.totalAnnualPremium
        };
      }
      return p;
    });

    onUpdateProposals(updatedProposals);
    setEditingProposalId(null);
  };

  // Selected proposal details
  const activeSelectedProposal = proposals.find(p => p.id === selectedProposalId) || proposals[0];
  const activePricing = activeSelectedProposal?.pricingStructure || getDefaultCompanyPricing(activeSelectedProposal?.companyName);
  const activeBreakdown = calculateCompanyPremium(activePricing, {
    totalMembers: totalCalculated,
    childrenCount: childrenInput,
    adultsCount: adultsInput,
    seniorsCount: seniorsInput,
    includeDental,
    includeOptical
  });

  // Calculate dynamic tender rank based on calculated total annual premium
  const sortedProposalsForRank = useMemo(() => {
    return [...proposals].map(p => {
      const pr = p.pricingStructure || resolveProposalPricing(p.companyName);
      const bd = p.calculatedBreakdown || calculateCompanyPremium(pr, {
        totalMembers: totalCalculated,
        childrenCount: childrenInput,
        adultsCount: adultsInput,
        seniorsCount: seniorsInput,
        includeDental,
        includeOptical
      });
      return { id: p.id, total: bd.totalAnnualPremium };
    }).sort((a, b) => a.total - b.total);
  }, [proposals, totalCalculated, childrenInput, adultsInput, seniorsInput, includeDental, includeOptical]);

  const activeProposalRank = useMemo(() => {
    if (!activeSelectedProposal) return 1;
    const idx = sortedProposalsForRank.findIndex(p => p.id === activeSelectedProposal.id);
    return idx >= 0 ? idx + 1 : 1;
  }, [sortedProposalsForRank, activeSelectedProposal]);

  return (
    <div className="space-y-6" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Top Banner / Explanation */}
      <div className="bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-sky-800/40 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-sky-500/20 text-sky-300 rounded-full text-xs font-semibold border border-sky-400/30">
              <Calculator className="w-3.5 h-3.5" />
              <span>{isRtl ? `حاسبة الأقساط والتسعير (${totalCalculated} مشتركاً)` : `Premium & Pricing Calculator (${totalCalculated} Pax)`}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              {isRtl ? 'حساب إجمالي الأقساط السنوية لشركات التأمين بدقة' : 'Accurate Annual Premium Calculation by Age Groups'}
            </h2>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              {isRtl 
                ? `لحساب المبلغ الإجمالي الدقيق الذي يجب دفعه سنوياً، يتم توزيع المشتركين (إجمالي ${totalCalculated} منتفعاً - قابل للزيادة والنقصان والتعديل الفوري) حسب الفئات العمرية (يوم - 17 سنة، و 18 - 65 سنة)، واحتساب الرسوم القانونية الإضافية (6.5% أو 6% ورسم العقد الثابت) ومنافع الأسنان والنظر.`
                : `Calculate the exact annual payable sum by distributing the ${totalCalculated} beneficiaries (fully adjustable up or down) across age bands, applying statutory fees (6.5% or 6% + contract issuance fee), and optional riders.`
              }
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {onNavigateToMatrix && (
              <button
                onClick={onNavigateToMatrix}
                className="flex items-center gap-2 px-5 py-3 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold rounded-xl shadow-lg transition-all cursor-pointer"
              >
                <span>{isRtl ? 'الانتقال لمصفوفة المفاضلة والترتيب' : 'Proceed to Trade-off Matrix'}</span>
                <ArrowRight className={`w-4 h-4 ${isRtl ? 'rotate-180' : ''}`} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Interactive Census Configuration Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
        {/* Card Header with Live Total & Status */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-sky-600" />
              <span>{isRtl ? `توزيع المشتركين حسب الفئات العمرية الثلاث (إجمالي ${totalCalculated} منتفعاً)` : `Demographic Census Across 3 Age Brackets (${totalCalculated} Beneficiaries)`}</span>
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              {isRtl 
                ? 'عدد المشتركين الإجمالي 256 قابل للتعديل والزيادة أو النقصان. الأسعار والأقساط مقسمة حسب الفئات العمرية: (0-17)، (18-65)، و (66-75).'
                : 'The 256 subscribers count is fully editable up and down. Rates and premiums are partitioned across age groups: (0-17), (18-65), and (66-75).'
              }
            </p>
          </div>

          {/* Current Status Pill */}
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-50 text-sky-900 font-bold text-sm border border-sky-200">
            <span className="text-xs text-sky-700">{isRtl ? 'المجموع الحالي:' : 'Current Total:'}</span>
            <span className="px-2.5 py-0.5 rounded-lg text-sm font-black bg-sky-600 text-white shadow-xs">
              {totalCalculated} {isRtl ? 'مشتركاً' : 'members'}
            </span>
            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
              {isRtl ? 'قابل للتعديل' : 'Flexible'}
            </span>
          </div>
        </div>

        {/* Official Census Table from Tender Document */}
        <div className="bg-slate-900 text-white rounded-2xl p-4 sm:p-5 border border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-bold text-sky-400">
              <ShieldCheck className="w-4 h-4" />
              <span>{isRtl ? 'جدول الفئات العمرية المعتمد في وثيقة المناقصة الرسمية:' : 'Official Tender Census Schedule:'}</span>
            </div>
            <p className="text-xs text-slate-300">
              {isRtl 
                ? 'وفق بيانات الكراسة: الفئة الأولى 0-17 (97)، الفئة الثانية 18-65 (159)، الفئة الثالثة 66-75 (0) بإجمالي 256 مشتركاً.'
                : 'As per RFP specification: 0-17 (97), 18-65 (159), 66-75 (0), summing to 256 participants.'
              }
            </p>
          </div>

          {/* Mini Table Display */}
          <div className="flex items-center gap-2 overflow-x-auto bg-slate-800/80 p-2.5 rounded-xl border border-slate-700">
            <div className="px-3 py-1 text-center border-e border-slate-700">
              <span className="block text-xs font-medium text-slate-300">{isRtl ? '0 - 17' : '0-17'}</span>
              <span className="text-base font-bold text-sky-300">{childrenInput}</span>
            </div>
            <div className="px-3 py-1 text-center border-e border-slate-700">
              <span className="block text-xs font-medium text-slate-300">{isRtl ? '18 - 65' : '18-65'}</span>
              <span className="text-base font-bold text-indigo-300">{adultsInput}</span>
            </div>
            <div className="px-3 py-1 text-center border-e border-slate-700">
              <span className="block text-xs font-medium text-slate-300">{isRtl ? '66 - 75' : '66-75'}</span>
              <span className="text-base font-bold text-amber-300">{seniorsInput}</span>
            </div>
            <div className="px-3 py-1 text-center">
              <span className="block text-xs font-medium text-slate-300">{isRtl ? 'المجموع' : 'Total'}</span>
              <span className="text-base font-bold text-emerald-400">{totalCalculated}</span>
            </div>
          </div>
        </div>

        {/* Master Total Beneficiaries Controller Bar */}
        <div className="bg-gradient-to-r from-sky-50 via-indigo-50/50 to-slate-50 rounded-2xl p-5 border-2 border-sky-200/80 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
            {/* Direct Total Input & Steppers */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-sky-600 animate-pulse" />
                <label htmlFor="total-subscribers-input" className="text-sm font-black text-slate-900">
                  {isRtl ? 'إجمالي عدد المشتركين الكلي (قابل للزيادة أو النقصان):' : 'Total Beneficiaries Count (Fully Scalable):'}
                </label>
              </div>
              <p className="text-xs text-slate-600">
                {isRtl 
                  ? 'عند زيادة أو إنقاص المجموع الكلي، يتم تحديث توزيع الفئات والأقساط السنوية لجميع الشركات تلقائياً'
                  : 'Modifying the total instantly recalculates premiums and statutory fees for all competing insurers'
                }
              </p>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                {/* Decrement Buttons */}
                <div className="inline-flex items-center rounded-xl bg-white border border-slate-300 shadow-xs overflow-hidden">
                  <button
                    type="button"
                    onClick={() => handleStepTotal(-50)}
                    disabled={totalCalculated <= 50}
                    className="px-2.5 py-2 text-xs font-bold text-slate-700 hover:bg-rose-50 hover:text-rose-700 border-e border-slate-200 transition-colors disabled:opacity-40 cursor-pointer"
                    title={isRtl ? 'إنقاص 50 مشتركاً' : 'Decrease 50'}
                  >
                    -50
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStepTotal(-10)}
                    disabled={totalCalculated <= 10}
                    className="px-2.5 py-2 text-xs font-bold text-slate-700 hover:bg-rose-50 hover:text-rose-700 border-e border-slate-200 transition-colors disabled:opacity-40 cursor-pointer"
                    title={isRtl ? 'إنقاص 10 مشتركين' : 'Decrease 10'}
                  >
                    -10
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStepTotal(-1)}
                    disabled={totalCalculated <= 1}
                    className="px-2.5 py-2 text-xs font-bold text-slate-700 hover:bg-rose-50 hover:text-rose-700 transition-colors disabled:opacity-40 cursor-pointer"
                    title={isRtl ? 'إنقاص مشترك واحد' : 'Decrease 1'}
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Direct Number Input */}
                <div className="relative">
                  <input
                    id="total-subscribers-input"
                    type="number"
                    min={1}
                    max={50000}
                    value={totalCalculated}
                    onChange={(e) => handleTotalChange(Number(e.target.value) || 1)}
                    className="w-32 sm:w-40 text-center text-3xl font-black text-slate-900 bg-white border-2 border-sky-500 rounded-xl py-1.5 px-3 shadow-inner focus:ring-3 focus:ring-sky-500/30 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <span className="absolute -bottom-4 inset-x-0 text-[10px] text-center font-bold text-sky-700">
                    {isRtl ? 'مشتركاً' : 'members'}
                  </span>
                </div>

                {/* Increment Buttons */}
                <div className="inline-flex items-center rounded-xl bg-white border border-slate-300 shadow-xs overflow-hidden">
                  <button
                    type="button"
                    onClick={() => handleStepTotal(1)}
                    className="px-2.5 py-2 text-xs font-bold text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 border-e border-slate-200 transition-colors cursor-pointer"
                    title={isRtl ? 'زيادة مشترك واحد' : 'Increase 1'}
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStepTotal(10)}
                    className="px-2.5 py-2 text-xs font-bold text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 border-e border-slate-200 transition-colors cursor-pointer"
                    title={isRtl ? 'زيادة 10 مشتركين' : 'Increase 10'}
                  >
                    +10
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStepTotal(50)}
                    className="px-2.5 py-2 text-xs font-bold text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors cursor-pointer"
                    title={isRtl ? 'زيادة 50 مشتركاً' : 'Increase 50'}
                  >
                    +50
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Sizing Pill Bar */}
            <div className="flex flex-col gap-2">
              <span className="text-xs font-bold text-slate-700">{isRtl ? 'نسب توزيع الفئات العمرية الحالية:' : 'Current Age Distribution:'}</span>
              <div className="flex items-center gap-2 text-xs font-bold">
                <span className="px-2.5 py-1 bg-sky-100 text-sky-800 rounded-lg">
                  {isRtl ? 'أطفال (0-17):' : '0-17:'} {childRatio}%
                </span>
                <span className="px-2.5 py-1 bg-indigo-100 text-indigo-800 rounded-lg">
                  {isRtl ? 'بالغون (18-65):' : '18-65:'} {adultRatio}%
                </span>
                <span className="px-2.5 py-1 bg-amber-100 text-amber-800 rounded-lg">
                  {isRtl ? 'كبار سن (66-75):' : '66-75:'} {seniorRatio}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Section 1: The Three Official Tender Age Categories */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
            <span className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Users className="w-4 h-4 text-sky-600" />
              <span>{isRtl ? 'توزيع المشتركين حسب الفئات العمرية الثلاث (أرقام واضحة ومباشرة):' : 'Census Distribution by 3 Age Brackets:'}</span>
            </span>
            <span className="text-xs text-slate-500 font-semibold">
              {isRtl 
                ? `المجموع الفعلي: ${childrenInput} + ${adultsInput} + ${seniorsInput} = ${totalCalculated} مشتركاً`
                : `Actual: ${childrenInput} + ${adultsInput} + ${seniorsInput} = ${totalCalculated} Beneficiaries`
              }
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Category 1: 0 - 17 */}
            <div className="bg-gradient-to-b from-sky-50/90 to-white rounded-2xl p-5 border-2 border-sky-300 shadow-sm flex flex-col justify-between">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="inline-block px-2.5 py-1 bg-sky-600 text-white text-xs font-black rounded-lg shadow-xs">
                    {isRtl ? 'الفئة الأولى' : 'Category 1'}
                  </span>
                  <span className="text-xs font-black text-sky-800 bg-sky-100 px-2.5 py-0.5 rounded-md">
                    {childRatio}% {isRtl ? 'من المشتركين' : 'of total'}
                  </span>
                </div>
                <h4 className="font-black text-slate-900 text-base">
                  {isRtl ? '0 – 17 عاماً' : '0 – 17 Yrs'}
                </h4>
                <p className="text-xs font-medium text-slate-600">
                  {isRtl ? 'الأطفال والتابعون والأبناء' : 'Children & Dependents'}
                </p>
              </div>

              <div className="mt-5 space-y-3">
                <div className="flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleStepChildren(-10)}
                    disabled={childrenInput <= 0}
                    className="px-2.5 py-2 text-xs font-bold bg-white text-slate-700 border border-sky-300 rounded-xl hover:bg-sky-100 disabled:opacity-30 cursor-pointer transition-colors shadow-2xs"
                    title="-10"
                  >
                    -10
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStepChildren(-1)}
                    disabled={childrenInput <= 0}
                    className="p-2 text-xs font-bold bg-white text-slate-700 border border-sky-300 rounded-xl hover:bg-sky-100 disabled:opacity-30 cursor-pointer transition-colors shadow-2xs"
                    title="-1"
                  >
                    <Minus className="w-4 h-4" />
                  </button>

                  <div className="relative w-32 sm:w-36">
                    <input
                      type="number"
                      min={0}
                      max={50000}
                      value={childrenInput}
                      onChange={(e) => handleCensusChange(Number(e.target.value) || 0, adultsInput, seniorsInput, includeDental, includeOptical)}
                      className="w-full text-center text-3xl font-black text-slate-900 bg-white border-2 border-sky-500 rounded-xl py-2 px-2 shadow-inner focus:ring-3 focus:ring-sky-500/30 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => handleStepChildren(1)}
                    className="p-2 text-xs font-bold bg-white text-slate-700 border border-sky-300 rounded-xl hover:bg-sky-100 cursor-pointer transition-colors shadow-2xs"
                    title="+1"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStepChildren(10)}
                    className="px-2.5 py-2 text-xs font-bold bg-white text-slate-700 border border-sky-300 rounded-xl hover:bg-sky-100 cursor-pointer transition-colors shadow-2xs"
                    title="+10"
                  >
                    +10
                  </button>
                </div>

                <div className="text-center text-xs font-bold text-sky-900 bg-sky-100/80 py-2 px-3 rounded-xl border border-sky-200">
                  {childrenInput} {isRtl ? 'طفلاً وتابعاً مسجلاً' : 'registered children'}
                </div>
              </div>
            </div>

            {/* Category 2: 18 - 65 */}
            <div className="bg-gradient-to-b from-indigo-50/90 to-white rounded-2xl p-5 border-2 border-indigo-300 shadow-sm flex flex-col justify-between">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="inline-block px-2.5 py-1 bg-indigo-600 text-white text-xs font-black rounded-lg shadow-xs">
                    {isRtl ? 'الفئة الثانية' : 'Category 2'}
                  </span>
                  <span className="text-xs font-black text-indigo-800 bg-indigo-100 px-2.5 py-0.5 rounded-md">
                    {adultRatio}% {isRtl ? 'من المشتركين' : 'of total'}
                  </span>
                </div>
                <h4 className="font-black text-slate-900 text-base">
                  {isRtl ? '18 – 65 عاماً' : '18 – 65 Yrs'}
                </h4>
                <p className="text-xs font-medium text-slate-600">
                  {isRtl ? 'الموظفون والبالغون والعاملون' : 'Employees & Adults'}
                </p>
              </div>

              <div className="mt-5 space-y-3">
                <div className="flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleStepAdults(-10)}
                    disabled={adultsInput <= 0}
                    className="px-2.5 py-2 text-xs font-bold bg-white text-slate-700 border border-indigo-300 rounded-xl hover:bg-indigo-100 disabled:opacity-30 cursor-pointer transition-colors shadow-2xs"
                    title="-10"
                  >
                    -10
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStepAdults(-1)}
                    disabled={adultsInput <= 0}
                    className="p-2 text-xs font-bold bg-white text-slate-700 border border-indigo-300 rounded-xl hover:bg-indigo-100 disabled:opacity-30 cursor-pointer transition-colors shadow-2xs"
                    title="-1"
                  >
                    <Minus className="w-4 h-4" />
                  </button>

                  <div className="relative w-32 sm:w-36">
                    <input
                      type="number"
                      min={0}
                      max={50000}
                      value={adultsInput}
                      onChange={(e) => handleCensusChange(childrenInput, Number(e.target.value) || 0, seniorsInput, includeDental, includeOptical)}
                      className="w-full text-center text-3xl font-black text-slate-900 bg-white border-2 border-indigo-500 rounded-xl py-2 px-2 shadow-inner focus:ring-3 focus:ring-indigo-500/30 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => handleStepAdults(1)}
                    className="p-2 text-xs font-bold bg-white text-slate-700 border border-indigo-300 rounded-xl hover:bg-indigo-100 cursor-pointer transition-colors shadow-2xs"
                    title="+1"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStepAdults(10)}
                    className="px-2.5 py-2 text-xs font-bold bg-white text-slate-700 border border-indigo-300 rounded-xl hover:bg-indigo-100 cursor-pointer transition-colors shadow-2xs"
                    title="+10"
                  >
                    +10
                  </button>
                </div>

                <div className="text-center text-xs font-bold text-indigo-900 bg-indigo-100/80 py-2 px-3 rounded-xl border border-indigo-200">
                  {adultsInput} {isRtl ? 'موظفاً وبالغاً مسجلاً' : 'registered adults'}
                </div>
              </div>
            </div>

            {/* Category 3: 66 - 75 */}
            <div className="bg-gradient-to-b from-amber-50/90 to-white rounded-2xl p-5 border-2 border-amber-300 shadow-sm flex flex-col justify-between">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="inline-block px-2.5 py-1 bg-amber-600 text-white text-xs font-black rounded-lg shadow-xs">
                    {isRtl ? 'الفئة الثالثة' : 'Category 3'}
                  </span>
                  <span className="text-xs font-black text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-md">
                    {seniorRatio}% {isRtl ? 'من المشتركين' : 'of total'}
                  </span>
                </div>
                <h4 className="font-black text-slate-900 text-base">
                  {isRtl ? '66 – 75 عاماً' : '66 – 75 Yrs'}
                </h4>
                <p className="text-xs font-medium text-slate-600">
                  {isRtl ? 'كبار السن والمتقاعدون' : 'Seniors & Retirees'}
                </p>
              </div>

              <div className="mt-5 space-y-3">
                <div className="flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleStepSeniors(-10)}
                    disabled={seniorsInput <= 0}
                    className="px-2.5 py-2 text-xs font-bold bg-white text-slate-700 border border-amber-300 rounded-xl hover:bg-amber-100 disabled:opacity-30 cursor-pointer transition-colors shadow-2xs"
                    title="-10"
                  >
                    -10
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStepSeniors(-1)}
                    disabled={seniorsInput <= 0}
                    className="p-2 text-xs font-bold bg-white text-slate-700 border border-amber-300 rounded-xl hover:bg-amber-100 disabled:opacity-30 cursor-pointer transition-colors shadow-2xs"
                    title="-1"
                  >
                    <Minus className="w-4 h-4" />
                  </button>

                  <div className="relative w-32 sm:w-36">
                    <input
                      type="number"
                      min={0}
                      max={50000}
                      value={seniorsInput}
                      onChange={(e) => handleCensusChange(childrenInput, adultsInput, Number(e.target.value) || 0, includeDental, includeOptical)}
                      className="w-full text-center text-3xl font-black text-slate-900 bg-white border-2 border-amber-500 rounded-xl py-2 px-2 shadow-inner focus:ring-3 focus:ring-amber-500/30 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => handleStepSeniors(1)}
                    className="p-2 text-xs font-bold bg-white text-slate-700 border border-amber-300 rounded-xl hover:bg-amber-100 cursor-pointer transition-colors shadow-2xs"
                    title="+1"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStepSeniors(10)}
                    className="px-2.5 py-2 text-xs font-bold bg-white text-slate-700 border border-amber-300 rounded-xl hover:bg-amber-100 cursor-pointer transition-colors shadow-2xs"
                    title="+10"
                  >
                    +10
                  </button>
                </div>

                <div className="text-center text-xs font-bold text-amber-900 bg-amber-100/80 py-2 px-3 rounded-xl border border-amber-200">
                  {seniorsInput} {isRtl ? 'من كبار السن المسجلين' : 'registered seniors'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Optional Coverage Riders (Dental & Optical) */}
        <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-200/90 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
            <span className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>{isRtl ? 'الملحقات والمنافع الاختيارية (حسب رغبة العميل):' : 'Optional Coverage Riders (Customer Choice):'}</span>
            </span>
            <span className="text-xs text-slate-500">
              {isRtl ? 'تحديد شمول ملحق الأسنان أو النظر في احتساب الأقساط الإجمالية' : 'Toggle riders to include in overall premium calculations'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Add-on 1: Dental Option */}
            <div className={`rounded-2xl p-4 border-2 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
              includeDental ? 'bg-amber-50/90 border-amber-300 ring-2 ring-amber-400/20 shadow-xs' : 'bg-white border-slate-200'
            }`}>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="inline-block px-2.5 py-0.5 bg-amber-600 text-white text-xs font-semibold rounded-md">
                    {isRtl ? 'ملحق اختياري' : 'Optional Rider'}
                  </span>
                  <h4 className="font-bold text-slate-900 text-sm">
                    {isRtl ? 'تغطية الأسنان (Dental)' : 'Dental Coverage'}
                  </h4>
                </div>
                <p className="text-xs text-slate-500">
                  {isRtl ? `إضافة قسط الأسنان للفرد لكافة المشتركين (${totalCalculated})` : `Add per-person dental rate for all ${totalCalculated} members`}
                </p>
              </div>

              <label className="flex items-center gap-3 cursor-pointer select-none bg-white/90 px-3.5 py-2.5 rounded-xl border border-slate-200 shadow-2xs shrink-0">
                <input
                  type="checkbox"
                  checked={includeDental}
                  onChange={(e) => handleCensusChange(childrenInput, adultsInput, seniorsInput, e.target.checked, includeOptical)}
                  className="w-5 h-5 text-amber-600 rounded border-slate-300 focus:ring-amber-500 cursor-pointer"
                />
                <span className="text-xs font-bold text-slate-800 whitespace-nowrap">
                  {includeDental ? (isRtl ? 'مضمن في الحسبة ✓' : 'Included ✓') : (isRtl ? 'غير مشمول (مستبعد)' : 'Excluded')}
                </span>
              </label>
            </div>

            {/* Add-on 2: Optical Option */}
            <div className={`rounded-2xl p-4 border-2 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
              includeOptical ? 'bg-emerald-50/90 border-emerald-300 ring-2 ring-emerald-400/20 shadow-xs' : 'bg-white border-slate-200'
            }`}>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="inline-block px-2.5 py-0.5 bg-emerald-600 text-white text-xs font-semibold rounded-md">
                    {isRtl ? 'ملحق اختياري' : 'Optional Rider'}
                  </span>
                  <h4 className="font-bold text-slate-900 text-sm">
                    {isRtl ? 'تغطية النظر والبصريات (Optical)' : 'Optical Coverage'}
                  </h4>
                </div>
                <p className="text-xs text-slate-500">
                  {isRtl ? `إضافة قسط البصريات للفرد لكافة المشتركين (${totalCalculated})` : `Add per-person optical rate for all ${totalCalculated} members`}
                </p>
              </div>

              <label className="flex items-center gap-3 cursor-pointer select-none bg-white/90 px-3.5 py-2.5 rounded-xl border border-slate-200 shadow-2xs shrink-0">
                <input
                  type="checkbox"
                  checked={includeOptical}
                  onChange={(e) => handleCensusChange(childrenInput, adultsInput, seniorsInput, includeDental, e.target.checked)}
                  className="w-5 h-5 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                />
                <span className="text-xs font-bold text-slate-800 whitespace-nowrap">
                  {includeOptical ? (isRtl ? 'مضمن في الحسبة ✓' : 'Included ✓') : (isRtl ? 'غير مشمول (مستبعد)' : 'Excluded')}
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Quick Demographic & Sizing Presets */}
        <div className="pt-4 border-t border-slate-100 space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-sky-600" />
              <span>{isRtl ? 'سيناريوهات وأحجام سريعة قابلة للتطبيق بنقرة واحدة:' : 'Quick demographic & size presets:'}</span>
            </span>
            <button
              type="button"
              onClick={() => handleCensusChange(97, 159, 0, false, false)}
              className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-sky-700 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>{isRtl ? 'استعادة جدول المناقصة (97 + 159 + 0 = 256)' : 'Reset to RFP 256 (97 + 159 + 0)'}</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => handleCensusChange(97, 159, 0, includeDental, includeOptical)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                childrenInput === 97 && adultsInput === 159 && seniorsInput === 0
                  ? 'bg-sky-600 text-white border-sky-600 shadow-xs' 
                  : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
              }`}
            >
              {isRtl ? '📋 التوزيع الفعلي المعتمد (97 أطفال + 159 بالغين + 0 كبار سن = 256)' : '📋 RFP Benchmark (97 kids + 159 adults + 0 seniors = 256)'}
            </button>

            <button
              type="button"
              onClick={() => handleCensusChange(97, 149, 10, includeDental, includeOptical)}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white hover:bg-amber-50 text-amber-800 border border-amber-200 transition-all cursor-pointer"
            >
              {isRtl ? '👴 إضافة 10 كبار سن (97 أطفال + 149 بالغين + 10 كبار سن = 256)' : '👴 10 Seniors Scenario (97 + 149 + 10 = 256)'}
            </button>

            <button
              type="button"
              onClick={() => handleTotalChange(totalCalculated + 50)}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-200 transition-all cursor-pointer"
            >
              {isRtl ? `📈 زيادة +50 مشتركاً (${totalCalculated + 50})` : `📈 Scale Up +50 (${totalCalculated + 50})`}
            </button>

            {totalCalculated > 50 && (
              <button
                type="button"
                onClick={() => handleTotalChange(Math.max(1, totalCalculated - 50))}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white hover:bg-rose-50 text-rose-800 border border-rose-200 transition-all cursor-pointer"
              >
                {isRtl ? `📉 إنقاص -50 مشتركاً (${Math.max(1, totalCalculated - 50)})` : `📉 Scale Down -50 (${Math.max(1, totalCalculated - 50)})`}
              </button>
            )}

            <button
              type="button"
              onClick={() => handleTotalChange(300)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                totalCalculated === 300
                  ? 'bg-sky-600 text-white border-sky-600 shadow-xs' 
                  : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
              }`}
            >
              {isRtl ? '👥 300 مشترك' : '👥 300 Pax'}
            </button>

            <button
              type="button"
              onClick={() => handleTotalChange(500)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                totalCalculated === 500
                  ? 'bg-sky-600 text-white border-sky-600 shadow-xs' 
                  : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
              }`}
            >
              {isRtl ? '🏢 500 مشترك' : '🏢 500 Pax'}
            </button>
          </div>
        </div>
      </div>

      {/* Statutory Fees Reference Box - 3 Specific Mandated Items */}
      <div className="bg-gradient-to-r from-amber-50/80 via-amber-50/40 to-slate-50 border border-amber-200/90 rounded-2xl p-5 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-amber-200/60">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-800 flex items-center justify-center shrink-0 mt-0.5 font-black text-base shadow-2xs">
              %
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-black text-slate-900 text-sm sm:text-base">
                  {isRtl ? 'تفصيل الرسوم القانونية المضافة إلى التكلفة (وفق وثائق العطاء والقوانين الأردنية)' : 'Statutory & Regulatory Fee Additions to Premium Cost'}
                </h4>
                <span className="text-[11px] font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded-md border border-amber-300">
                  {isRtl ? 'إجمالي 6.5%' : 'Total 6.5%'}
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                {isRtl 
                  ? 'تُضاف الرسوم القانونية الثلاث أدناه مباشرة على الأقساط الأساسية، وتتوزع على النحو التالي لكافة الشركات (باستثناء MEICO التي تعتمد 6% + 50 ديناراً رسم إصدار عقد مقطوع):'
                  : 'The three statutory fees below are added directly to base costs across all proposals (except MEICO which applies 6.0% + 50 JOD fixed contract fee):'
                }
              </p>
            </div>
          </div>
        </div>

        {/* 3 Dedicated Fee Component Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* 1. رسوم إصدار */}
          <div className="bg-white p-3.5 rounded-xl border border-amber-200/80 shadow-2xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <span className="text-base">📄</span>
                <span>{isRtl ? '١. رسوم إصدار' : '1. Issuance Fee'}</span>
              </span>
              <span className="text-xs font-black text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded-md">
                5.0%
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              {isRtl ? 'رسم إصدار وثيقة وبطاقات التأمين الطبي المعتمدة' : 'Policy & medical card issuance fee (4.5% in MEICO)'}
            </p>
          </div>

          {/* 2. رسوم طوابع */}
          <div className="bg-white p-3.5 rounded-xl border border-amber-200/80 shadow-2xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <span className="text-base">🏷️</span>
                <span>{isRtl ? '٢. رسوم طوابع' : '2. Revenue Stamps'}</span>
              </span>
              <span className="text-xs font-black text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded-md">
                1.0%
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              {isRtl ? 'رسوم طوابع الواردات القانونية والمالية الأردنية' : 'Mandatory Jordanian statutory revenue stamp duty'}
            </p>
          </div>

          {/* 3. رسوم صندوق ضمان المؤمن له */}
          <div className="bg-white p-3.5 rounded-xl border border-amber-200/80 shadow-2xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <span className="text-base">🛡️</span>
                <span>{isRtl ? '٣. صندوق ضمان المؤمن له' : '3. Guarantee Fund'}</span>
              </span>
              <span className="text-xs font-black text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded-md">
                0.5%
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              {isRtl ? 'حصة صندوق ضمان حقوق المؤمن لهم بإشراف البنك المركزي' : 'Policyholders guarantee fund under Central Bank of Jordan'}
            </p>
          </div>
        </div>
      </div>

      {/* Official Financial Evaluation Matrix (Excel Spreadsheet Model 40%) */}
      <OfficialFinancialEvaluationMatrix 
        proposals={proposals} 
        census={census || DEFAULT_DEMOGRAPHIC_CENSUS} 
        onToggleExcludeProposal={onToggleExcludeProposal}
        onUpdateProposals={onUpdateProposals}
        showTitle={true}
      />

      {/* Primary Table: Detailed Cost Breakdown for All Companies */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-sky-600" />
              <h3 className="font-bold text-slate-900 text-base">
                {isRtl ? 'جدول مقارنة الأقساط الإجمالية لجميع الشركات حسب الفئات العمرية الثلاث' : 'Detailed Premium Comparison by 3 Age Brackets'}
              </h3>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-full">
                <span>✍️</span>
                <span>{isRtl ? 'حقول الأسعار قابلة للتعديل المباشر' : 'Directly Editable'}</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {isRtl 
                ? `محسوبة وفق توزيع: ${childrenInput} أطفال (0-17) + ${adultsInput} بالغين (18-65) + ${seniorsInput} كبار سن (66-75) = ${totalCalculated} منتفعاً. انقر على أي رقم لتعديله فورياً.`
                : `Computed for: ${childrenInput} (0-17) + ${adultsInput} (18-65) + ${seniorsInput} (66-75) = ${totalCalculated} Beneficiaries. Click any rate to edit directly.`
              }
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Toggle Detailed Fees Columns */}
            <button
              type="button"
              onClick={() => setShowDetailedFeesColumns(!showDetailedFeesColumns)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg border transition-all cursor-pointer shadow-2xs ${
                showDetailedFeesColumns 
                  ? 'bg-amber-600 text-white border-amber-600' 
                  : 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-300'
              }`}
              title={isRtl ? 'عرض أو إخفاء تفصيل أعمدة رسوم الإصدار، الطوابع، وصندوق الضمان' : 'Toggle granular columns for issuance, stamps, guarantee fund'}
            >
              <span>{showDetailedFeesColumns ? '🗂️' : '📊'}</span>
              <span>
                {showDetailedFeesColumns 
                  ? (isRtl ? 'دمج أعمدة الرسوم' : 'Collapse Fee Columns')
                  : (isRtl ? 'تفصيل أعمدة الرسوم (إصدار / طوابع / ضمان)' : 'Detail Fees (Issuance / Stamps / Guarantee)')
                }
              </span>
            </button>

            <button
              type="button"
              onClick={handleResetAllToDefaults}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer shadow-2xs"
              title={isRtl ? 'استعادة أسعار العروض الافتراضية المعتمدة لجميع الشركات' : 'Reset all rates to official tender defaults'}
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              <span>{isRtl ? 'استعادة الأسعار الافتراضية للجميع' : 'Reset All Defaults'}</span>
            </button>

            <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{isRtl ? 'مربوط لحظياً بمصفوفة المفاضلة' : 'Auto-synced with Matrix'}</span>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-start">
            <thead className="bg-slate-50 text-slate-700 text-xs font-bold border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4 text-start">{isRtl ? 'شركة التأمين والعرض' : 'Company & Proposal'}</th>
                <th className="py-3.5 px-2 text-center">{isRtl ? 'قسط (0-17)' : 'Rate (0-17)'}</th>
                <th className="py-3.5 px-2 text-center">{isRtl ? 'قسط (18-65)' : 'Rate (18-65)'}</th>
                <th className="py-3.5 px-2 text-center">{isRtl ? 'قسط (66-75)' : 'Rate (66-75)'}</th>

                {/* Conditional Detailed Fees Columns or Standard Fee Column */}
                {showDetailedFeesColumns ? (
                  <>
                    <th className="py-3.5 px-2 text-center bg-amber-50/50 text-amber-900" title={isRtl ? 'رسوم إصدار الوثيقة والبطاقات' : 'Issuance Fee'}>
                      {isRtl ? 'رسوم إصدار' : 'Issuance'}
                    </th>
                    <th className="py-3.5 px-2 text-center bg-amber-50/50 text-amber-900" title={isRtl ? 'رسوم طوابع الواردات القانونية' : 'Revenue Stamps'}>
                      {isRtl ? 'رسوم طوابع' : 'Stamps'}
                    </th>
                    <th className="py-3.5 px-2 text-center bg-amber-50/50 text-amber-900" title={isRtl ? 'صندوق ضمان المؤمن لهم (البنك المركزي)' : 'Guarantee Fund'}>
                      {isRtl ? 'صندوق الضمان' : 'Guarantee Fund'}
                    </th>
                    <th className="py-3.5 px-2 text-center bg-amber-100/60 text-amber-950 font-black">
                      {isRtl ? 'إجمالي الرسوم' : 'Total Fees'}
                    </th>
                  </>
                ) : (
                  <th className="py-3.5 px-2 text-center">{isRtl ? 'الرسوم الإضافية' : 'Statutory Fees'}</th>
                )}

                <th className="py-3.5 px-2 text-center">{isRtl ? 'تكلفة الفرد + الرسوم' : 'Cost/Person + Fees'}</th>
                <th className="py-3.5 px-2.5 text-center">{isRtl ? 'إجمالي (0-17)' : '0-17 Total'}</th>
                <th className="py-3.5 px-2.5 text-center">{isRtl ? 'إجمالي (18-65)' : '18-65 Total'}</th>
                <th className="py-3.5 px-2.5 text-center">{isRtl ? 'إجمالي (66-75)' : '66-75 Total'}</th>
                <th className="py-3.5 px-4 text-center bg-sky-50/70 text-sky-950 font-black">
                  {isRtl ? 'المبلغ الإجمالي الدقيق سنوياً' : 'Total Annual Premium'}
                </th>
                <th className="py-3.5 px-3 text-center">{isRtl ? 'إجراءات' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {proposals.map((proposal) => {
                const pricing = resolveProposalPricing(proposal.companyName, proposal.pricingStructure);
                const seniorRate = pricing.seniorRate || Math.round(pricing.adultRate * 1.4);
                const breakdown = calculateCompanyPremium(pricing, {
                  totalMembers: totalCalculated,
                  childrenCount: childrenInput,
                  adultsCount: adultsInput,
                  seniorsCount: seniorsInput,
                  includeDental,
                  includeOptical
                });

                const isSelected = proposal.id === selectedProposalId;

                return (
                  <tr 
                    key={proposal.id}
                    className={`hover:bg-slate-50/80 transition-colors ${
                      isSelected ? 'bg-sky-50/40 font-medium' : ''
                    }`}
                  >
                    {/* Insurer Info */}
                    <td className="py-4 px-4">
                      <div className="font-bold text-slate-900">{proposal.companyName}</div>
                      <div className="text-xs text-slate-500">{proposal.planName}</div>
                      {pricing.customNotes && (
                        <div className="text-[11px] text-sky-700 mt-1 max-w-xs truncate" title={pricing.customNotes}>
                          {pricing.customNotes}
                        </div>
                      )}
                    </td>

                    {/* Child Rate (Directly Editable) */}
                    <td className="py-3 px-2 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <input
                          type="number"
                          value={pricing.childRate}
                          onChange={(e) => handleInlineRateChange(proposal.id, 'childRate', parseFloat(e.target.value) || 0)}
                          className="w-20 px-2 py-1.5 text-center text-sm font-bold text-sky-950 bg-white border border-slate-200 rounded-lg shadow-2xs hover:border-sky-400 focus:border-sky-600 focus:ring-2 focus:ring-sky-500/20 outline-none transition-all"
                          min="0"
                          step="any"
                          title={isRtl ? 'انقر لتعديل قسط الأطفال مباشرة' : 'Click to edit child rate'}
                        />
                        <span className="text-[11px] font-bold text-slate-400">{isRtl ? 'د' : 'JOD'}</span>
                      </div>
                    </td>

                    {/* Adult Rate (Directly Editable) */}
                    <td className="py-3 px-2 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <input
                          type="number"
                          value={pricing.adultRate}
                          onChange={(e) => handleInlineRateChange(proposal.id, 'adultRate', parseFloat(e.target.value) || 0)}
                          className="w-20 px-2 py-1.5 text-center text-sm font-bold text-indigo-950 bg-white border border-slate-200 rounded-lg shadow-2xs hover:border-indigo-400 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                          min="0"
                          step="any"
                          title={isRtl ? 'انقر لتعديل قسط البالغين مباشرة' : 'Click to edit adult rate'}
                        />
                        <span className="text-[11px] font-bold text-slate-400">{isRtl ? 'د' : 'JOD'}</span>
                      </div>
                    </td>

                    {/* Senior Rate (Directly Editable) */}
                    <td className="py-3 px-2 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <input
                          type="number"
                          value={seniorRate}
                          onChange={(e) => handleInlineRateChange(proposal.id, 'seniorRate', parseFloat(e.target.value) || 0)}
                          className="w-20 px-2 py-1.5 text-center text-sm font-bold text-amber-950 bg-white border border-slate-200 rounded-lg shadow-2xs hover:border-amber-400 focus:border-amber-600 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all"
                          min="0"
                          step="any"
                          title={isRtl ? 'انقر لتعديل قسط كبار السن مباشرة' : 'Click to edit senior rate'}
                        />
                        <span className="text-[11px] font-bold text-slate-400">{isRtl ? 'د' : 'JOD'}</span>
                      </div>
                    </td>

                    {/* Conditional Detailed Columns OR Granular Single Cell */}
                    {showDetailedFeesColumns ? (
                      <>
                        {/* 1. رسوم إصدار */}
                        <td className="py-3 px-2 text-center bg-amber-50/20">
                          <div className="flex flex-col items-center justify-center gap-0.5">
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                value={formatFeeRate(breakdown.issuanceFeePercent, 'issuance')}
                                onChange={(e) => handleInlineRateChange(proposal.id, 'issuanceFeePercent', parseFloat(e.target.value) || 0)}
                                className="w-16 px-1 py-0.5 text-center text-xs font-bold text-slate-800 bg-white border border-slate-200 rounded hover:border-amber-400 focus:border-amber-600 outline-none"
                                min="0"
                                max="1"
                                step="0.001"
                                title={isRtl ? 'بدل خدمة الإصدار (كسر عشري)' : 'Issuance fee rate'}
                              />
                            </div>
                            <span className="text-[11px] font-bold text-amber-900">
                              {breakdown.issuanceFeeAmount.toLocaleString()} {isRtl ? 'د' : 'JOD'}
                            </span>
                          </div>
                        </td>

                        {/* 2. رسوم طوابع */}
                        <td className="py-3 px-2 text-center bg-amber-50/20">
                          <div className="flex flex-col items-center justify-center gap-0.5">
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                value={formatFeeRate(breakdown.stampsFeePercent, 'stamps')}
                                onChange={(e) => handleInlineRateChange(proposal.id, 'stampsFeePercent', parseFloat(e.target.value) || 0)}
                                className="w-16 px-1 py-0.5 text-center text-xs font-bold text-slate-800 bg-white border border-slate-200 rounded hover:border-amber-400 focus:border-amber-600 outline-none"
                                min="0"
                                max="1"
                                step="0.001"
                                title={isRtl ? 'رسوم طوابع الواردات (كسر عشري)' : 'Stamps fee rate'}
                              />
                            </div>
                            <span className="text-[11px] font-bold text-amber-900">
                              {breakdown.stampsFeeAmount.toLocaleString()} {isRtl ? 'د' : 'JOD'}
                            </span>
                          </div>
                        </td>

                        {/* 3. صندوق ضمان المؤمن له */}
                        <td className="py-3 px-2 text-center bg-amber-50/20">
                          <div className="flex flex-col items-center justify-center gap-0.5">
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                value={formatFeeRate(breakdown.guaranteeFundFeePercent, 'guarantee')}
                                onChange={(e) => handleInlineRateChange(proposal.id, 'guaranteeFundFeePercent', parseFloat(e.target.value) || 0)}
                                className="w-16 px-1 py-0.5 text-center text-xs font-bold text-slate-800 bg-white border border-slate-200 rounded hover:border-amber-400 focus:border-amber-600 outline-none"
                                min="0"
                                max="1"
                                step="0.001"
                                title={isRtl ? 'صندوق ضمان المؤمن له (كسر عشري)' : 'Guarantee fund rate'}
                              />
                            </div>
                            <span className="text-[11px] font-bold text-amber-900">
                              {breakdown.guaranteeFundFeeAmount.toLocaleString()} {isRtl ? 'د' : 'JOD'}
                            </span>
                          </div>
                        </td>

                        {/* 4. Total Fees */}
                        <td className="py-3 px-2 text-center bg-amber-100/30">
                          <div className="flex flex-col items-center justify-center">
                            <div className="text-xs font-black text-amber-950">
                              {breakdown.feesAmount.toLocaleString()} {isRtl ? 'د' : 'JOD'}
                            </div>
                            <span className="text-[10px] text-amber-800 font-bold">
                              ({pricing.feesPercentage}%)
                            </span>
                            {pricing.fixedContractFee > 0 && (
                              <span className="text-[10px] font-bold text-amber-700">
                                + {pricing.fixedContractFee} {isRtl ? 'د عقد' : 'fee'}
                              </span>
                            )}
                          </div>
                        </td>
                      </>
                    ) : (
                      /* Standard View: Comprehensive Fees Cell with 3 Items */
                      <td className="py-2 px-2 text-center">
                        <div className="flex flex-col items-center justify-center space-y-1">
                          <div className="flex items-center justify-center gap-1">
                            <input
                              type="number"
                              value={pricing.feesPercentage}
                              onChange={(e) => handleInlineRateChange(proposal.id, 'feesPercentage', parseFloat(e.target.value) || 0)}
                              className="w-16 px-1.5 py-0.5 text-center text-xs font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-md hover:border-slate-400 focus:border-sky-500 focus:bg-white outline-none transition-all"
                              min="0"
                              max="100"
                              step="0.1"
                              title={isRtl ? 'نسبة الرسوم والضرائب الإجمالية' : 'Total statutory fees percentage'}
                            />
                            <span className="text-xs font-bold text-slate-500">%</span>
                          </div>

                          {/* Mini itemized statutory tags */}
                          <div className="text-[10px] text-slate-500 space-y-0.5 w-full max-w-[140px] bg-slate-50 p-1 rounded border border-slate-100">
                            <div className="flex justify-between text-slate-600">
                              <span>{isRtl ? 'إصدار:' : 'Iss:'}</span>
                              <span className="font-semibold">{formatFeeRate(breakdown.issuanceFeePercent, 'issuance')} ({breakdown.issuanceFeeAmount.toLocaleString()}د)</span>
                            </div>
                            <div className="flex justify-between text-slate-600">
                              <span>{isRtl ? 'طوابع:' : 'Stp:'}</span>
                              <span className="font-semibold">{formatFeeRate(breakdown.stampsFeePercent, 'stamps')} ({breakdown.stampsFeeAmount.toLocaleString()}د)</span>
                            </div>
                            <div className="flex justify-between text-slate-600">
                              <span>{isRtl ? 'ضمان:' : 'Gfd:'}</span>
                              <span className="font-semibold">{formatFeeRate(breakdown.guaranteeFundFeePercent, 'guarantee')} ({breakdown.guaranteeFundFeeAmount.toLocaleString()}د)</span>
                            </div>
                            {pricing.fixedContractFee > 0 && (
                              <div className="flex justify-between text-amber-700 font-bold border-t border-slate-200 pt-0.5">
                                <span>{isRtl ? 'عقد مقطوع:' : 'Contract:'}</span>
                                <span>+{pricing.fixedContractFee} د</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    )}

                    {/* Cost Per Person With Fees */}
                    <td className="py-4 px-2 text-center text-[11px] space-y-0.5 whitespace-nowrap">
                      <div className="text-slate-700">
                        <span className="text-slate-400">{isRtl ? '0-17: ' : '0-17: '}</span>
                        <span className="font-bold text-sky-950">{breakdown.childPerPersonWithFees.toFixed(1)}</span>
                      </div>
                      <div className="text-slate-700">
                        <span className="text-slate-400">{isRtl ? '18-65: ' : '18-65: '}</span>
                        <span className="font-bold text-indigo-950">{breakdown.adultPerPersonWithFees.toFixed(1)}</span>
                      </div>
                      <div className="text-slate-700">
                        <span className="text-slate-400">{isRtl ? '66-75: ' : '66-75: '}</span>
                        <span className="font-bold text-amber-950">{breakdown.seniorPerPersonWithFees.toFixed(1)}</span>
                      </div>
                    </td>

                    {/* Children Subtotal */}
                    <td className="py-4 px-2.5 text-center text-slate-700 text-xs">
                      <div className="font-bold text-sky-950">{breakdown.childrenBase.toLocaleString()} {isRtl ? 'د' : 'JOD'}</div>
                      <div className="text-[10px] text-slate-500">({childrenInput} × {pricing.childRate})</div>
                    </td>

                    {/* Adults Subtotal */}
                    <td className="py-4 px-2.5 text-center text-slate-700 text-xs">
                      <div className="font-bold text-indigo-950">{breakdown.adultsBase.toLocaleString()} {isRtl ? 'د' : 'JOD'}</div>
                      <div className="text-[10px] text-slate-500">({adultsInput} × {pricing.adultRate})</div>
                    </td>

                    {/* Seniors Subtotal */}
                    <td className="py-4 px-2.5 text-center text-slate-700 text-xs">
                      <div className="font-bold text-amber-950">{breakdown.seniorsBase.toLocaleString()} {isRtl ? 'د' : 'JOD'}</div>
                      <div className="text-[10px] text-slate-500">({seniorsInput} × {seniorRate})</div>
                    </td>

                    {/* Total Annual Contract Premium */}
                    <td className="py-4 px-4 text-center bg-sky-50/70 border-x border-sky-100">
                      <div className="text-base font-black text-sky-950">
                        {breakdown.totalAnnualPremium.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                      <div className="text-[11px] font-bold text-sky-700">
                        {proposal.currency || (isRtl ? 'دينار أردني' : 'JOD')}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => setSelectedProposalId(proposal.id)}
                          className={`px-2.5 py-1 text-xs font-bold rounded-lg border transition-colors cursor-pointer ${
                            isSelected 
                              ? 'bg-sky-600 text-white border-sky-600' 
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                          title={isRtl ? 'معاينة التفاصيل والحسبة المفصلة' : 'Inspect breakdown'}
                        >
                          {isRtl ? 'التفاصيل' : 'Breakdown'}
                        </button>

                        <button
                          onClick={() => handleOpenEditPricing(proposal)}
                          className="p-1.5 text-slate-500 hover:text-sky-600 hover:bg-sky-50 rounded-md transition-colors cursor-pointer"
                          title={isRtl ? 'تعديل متقدم لجدول الأسعار والرسوم والإضافات' : 'Advanced rate card edit'}
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleResetProposalToDefault(proposal.id)}
                          className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-md transition-colors cursor-pointer"
                          title={isRtl ? 'استعادة الأسعار الافتراضية المعتمدة لهذه الشركة' : 'Reset to company default rates'}
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Deep-Dive Card for Selected Proposal */}
      {activeSelectedProposal && (
        <div className="bg-slate-900 rounded-3xl p-6 sm:p-8 text-white border border-slate-800 shadow-xl">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-slate-800">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-sky-500/20 text-sky-300 rounded-full text-xs font-semibold mb-2">
                <Receipt className="w-3.5 h-3.5" />
                <span>{isRtl ? 'مذكرة الحسبة التفصيلية الشاملة' : 'Complete Actuarial Ledger'}</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-white">
                {activeSelectedProposal?.companyName || ''}
              </h3>
              <p className="text-slate-400 text-xs sm:text-sm mt-0.5">
                {activeSelectedProposal?.planName || ''}
              </p>
            </div>

            <div className="text-start md:text-end">
              <span className="text-xs text-slate-400 block">{isRtl ? 'المبلغ الإجمالي السنوي المستحق للدفع' : 'Total Annual Payable'}</span>
              <div className="text-3xl sm:text-4xl font-black text-sky-400 mt-0.5">
                {activeBreakdown.totalAnnualPremium.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                <span className="text-base font-bold text-slate-300 ms-1.5">{activeSelectedProposal.currency || (isRtl ? 'دينار' : 'JOD')}</span>
              </div>
            </div>
          </div>

          {/* Breakdown Steps Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
            {/* Step 1: Base Premiums */}
            <div className="bg-slate-800/80 rounded-2xl p-5 border border-slate-700/60 space-y-3">
              <div className="text-xs font-bold text-sky-400 uppercase tracking-wider flex items-center gap-2">
                <span>١. {isRtl ? 'الأقساط الأساسية حسب الفئات الثلاث' : 'Base Group Premiums by 3 Brackets'}</span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-700/50">
                  <span className="text-slate-300">{isRtl ? 'الفئة الأولى (0 – 17 عاماً):' : 'Category 1 (0-17 yrs):'}</span>
                  <span className="font-bold text-white">{activePricing.childRate} {isRtl ? 'د / للفرد' : 'JOD/pax'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-700/50">
                  <span className="text-slate-400">{isRtl ? 'مجموع فئة الأطفال' : 'Children Total'} ({childrenInput} × {activePricing.childRate}):</span>
                  <span className="font-bold text-white">{activeBreakdown.childrenBase.toLocaleString()} {isRtl ? 'د' : 'JOD'}</span>
                </div>

                <div className="flex justify-between py-1 border-b border-slate-700/50 pt-2">
                  <span className="text-slate-300">{isRtl ? 'الفئة الثانية (18 – 65 عاماً):' : 'Category 2 (18-65 yrs):'}</span>
                  <span className="font-bold text-white">{activePricing.adultRate} {isRtl ? 'د / للفرد' : 'JOD/pax'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-700/50">
                  <span className="text-slate-400">{isRtl ? 'مجموع فئة البالغين' : 'Adults Total'} ({adultsInput} × {activePricing.adultRate}):</span>
                  <span className="font-bold text-white">{activeBreakdown.adultsBase.toLocaleString()} {isRtl ? 'د' : 'JOD'}</span>
                </div>

                <div className="flex justify-between py-1 border-b border-slate-700/50 pt-2">
                  <span className="text-slate-300">{isRtl ? 'الفئة الثالثة (66 – 75 عاماً):' : 'Category 3 (66-75 yrs):'}</span>
                  <span className="font-bold text-white">{activePricing.seniorRate || Math.round(activePricing.adultRate * 1.4)} {isRtl ? 'د / للفرد' : 'JOD/pax'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-700/50">
                  <span className="text-slate-400">{isRtl ? 'مجموع فئة كبار السن' : 'Seniors Total'} ({seniorsInput} × {activePricing.seniorRate || Math.round(activePricing.adultRate * 1.4)}):</span>
                  <span className="font-bold text-white">{activeBreakdown.seniorsBase.toLocaleString()} {isRtl ? 'د' : 'JOD'}</span>
                </div>

                {(activeBreakdown.dentalBase > 0 || activeBreakdown.opticalBase > 0) && (
                  <div className="pt-2 space-y-1">
                    {activeBreakdown.dentalBase > 0 && (
                      <div className="flex justify-between py-0.5 text-amber-300">
                        <span>{isRtl ? 'ملحق الأسنان:' : 'Dental Rider:'}</span>
                        <span>+{activeBreakdown.dentalBase.toLocaleString()} {isRtl ? 'د' : 'JOD'}</span>
                      </div>
                    )}
                    {activeBreakdown.opticalBase > 0 && (
                      <div className="flex justify-between py-0.5 text-emerald-300">
                        <span>{isRtl ? 'ملحق النظر:' : 'Optical Rider:'}</span>
                        <span>+{activeBreakdown.opticalBase.toLocaleString()} {isRtl ? 'د' : 'JOD'}</span>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex justify-between pt-3 text-sm font-bold text-slate-100">
                  <span>{isRtl ? 'مجموع الأقساط الأساسية:' : 'Base Subtotal:'}</span>
                  <span className="text-sky-300">{activeBreakdown.baseSubtotal.toLocaleString()} {isRtl ? 'د' : 'JOD'}</span>
                </div>
              </div>
            </div>

            {/* Step 2: Taxes & Statutory Fees */}
            <div className="bg-slate-800/80 rounded-2xl p-5 border border-slate-700/60 space-y-3">
              <div className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center justify-between">
                <span>٢. {isRtl ? 'الرسوم الإضافية المعتمدة (تضاف للتكلفة)' : 'Statutory & Contract Fees'}</span>
                <span className="text-[11px] font-black text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded">
                  {activePricing.feesPercentage}%
                </span>
              </div>

              <div className="space-y-2 text-xs">
                {/* 1. رسوم إصدار */}
                <div className="flex justify-between py-1.5 border-b border-slate-700/50">
                  <div className="flex items-center gap-1.5 text-slate-300">
                    <span>📄</span>
                    <span>{isRtl ? '١. رسوم إصدار الوثيقة والبطاقات:' : '1. Policy Issuance Fee:'}</span>
                    <span className="text-slate-400">({formatFeeRate(activeBreakdown.issuanceFeePercent, 'issuance')})</span>
                  </div>
                  <span className="font-bold text-amber-300">
                    +{activeBreakdown.issuanceFeeAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {isRtl ? 'د' : 'JOD'}
                  </span>
                </div>

                {/* 2. رسوم طوابع */}
                <div className="flex justify-between py-1.5 border-b border-slate-700/50">
                  <div className="flex items-center gap-1.5 text-slate-300">
                    <span>🏷️</span>
                    <span>{isRtl ? '٢. رسوم طوابع الواردات:' : '2. Revenue Stamps:'}</span>
                    <span className="text-slate-400">({formatFeeRate(activeBreakdown.stampsFeePercent, 'stamps')})</span>
                  </div>
                  <span className="font-bold text-amber-300">
                    +{activeBreakdown.stampsFeeAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {isRtl ? 'د' : 'JOD'}
                  </span>
                </div>

                {/* 3. رسوم صندوق ضمان المؤمن له */}
                <div className="flex justify-between py-1.5 border-b border-slate-700/50">
                  <div className="flex items-center gap-1.5 text-slate-300">
                    <span>🛡️</span>
                    <span>{isRtl ? '٣. صندوق ضمان المؤمن له:' : '3. Guarantee Fund:'}</span>
                    <span className="text-slate-400">({formatFeeRate(activeBreakdown.guaranteeFundFeePercent, 'guarantee')})</span>
                  </div>
                  <span className="font-bold text-amber-300">
                    +{activeBreakdown.guaranteeFundFeeAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {isRtl ? 'د' : 'JOD'}
                  </span>
                </div>

                {/* Fixed Contract Fee */}
                {activePricing.fixedContractFee > 0 && (
                  <div className="flex justify-between py-1.5 border-b border-slate-700/50 text-amber-200 font-bold">
                    <div className="flex items-center gap-1.5">
                      <span>🔖</span>
                      <span>{isRtl ? 'رسم إصدار عقد مقطوع:' : 'Fixed Contract Fee:'}</span>
                    </div>
                    <span>+{activePricing.fixedContractFee.toFixed(2)} {isRtl ? 'د' : 'JOD'}</span>
                  </div>
                )}

                {activePricing.feesBreakdown?.description && (
                  <div className="text-[11px] text-slate-400 bg-slate-900/60 p-2.5 rounded-lg border border-slate-700/50 leading-relaxed mt-1">
                    {activePricing.feesBreakdown.description}
                  </div>
                )}

                <div className="flex justify-between pt-3 text-sm font-black text-slate-100 border-t border-slate-700">
                  <span>{isRtl ? 'إجمالي الرسوم المضافة للتكلفة:' : 'Total Fees Subtotal:'}</span>
                  <span className="text-amber-300">
                    {(activeBreakdown.feesAmount + activeBreakdown.fixedFee).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {isRtl ? 'د' : 'JOD'}
                  </span>
                </div>
              </div>
            </div>

            {/* Step 3: Individual Costs & Summary */}
            <div className="bg-slate-800/80 rounded-2xl p-5 border border-slate-700/60 space-y-3">
              <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                <span>٣. {isRtl ? 'تكلفة الفرد والنطاق النظري' : 'Unit Cost & Theoretical Range'}</span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="bg-slate-900/50 p-2.5 rounded-xl border border-slate-700/50 space-y-1.5">
                  <div className="text-[11px] text-slate-400">{isRtl ? 'تكلفة الفرد الواحد شاملة الرسوم:' : 'Individual Cost Incl. Fees:'}</div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-300">{isRtl ? 'فئة الأطفال (0-17):' : 'Child (0-17):'}</span>
                    <span className="font-bold text-sky-300">{activeBreakdown.childPerPersonWithFees.toFixed(2)} {isRtl ? 'د' : 'JOD'}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-300">{isRtl ? 'فئة البالغين (18-65):' : 'Adult (18-65):'}</span>
                    <span className="font-bold text-indigo-300">{activeBreakdown.adultPerPersonWithFees.toFixed(2)} {isRtl ? 'د' : 'JOD'}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-300">{isRtl ? 'فئة كبار السن (66-75):' : 'Senior (66-75):'}</span>
                    <span className="font-bold text-amber-300">{activeBreakdown.seniorPerPersonWithFees.toFixed(2)} {isRtl ? 'د' : 'JOD'}</span>
                  </div>
                </div>

                <div className="bg-slate-900/50 p-2.5 rounded-xl border border-slate-700/50 space-y-1.5">
                  <div className="text-[11px] text-slate-400">
                    {isRtl ? `النطاق النظري للـ (${totalCalculated}) مشتركاً:` : `Theoretical Range (${totalCalculated} pax):`}
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-300">
                      {isRtl ? `الحد الأدنى (لو كان الكل أطفالاً):` : `Min (If all children):`}
                    </span>
                    <span className="font-semibold text-slate-200">{activeBreakdown.theoreticalMinTotal.toLocaleString()} {isRtl ? 'د' : 'JOD'}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-300">
                      {isRtl ? `الحد الأقصى (لو كان الكل بالغين):` : `Max (If all adults):`}
                    </span>
                    <span className="font-semibold text-slate-200">{activeBreakdown.theoreticalMaxTotal.toLocaleString()} {isRtl ? 'د' : 'JOD'}</span>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => handleOpenEditPricing(activeSelectedProposal)}
                    className="w-full py-2 bg-sky-600/30 hover:bg-sky-600/50 text-sky-300 border border-sky-500/40 rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>{isRtl ? 'تعديل جدول أسعار هذه الشركة' : 'Edit Company Pricing Rates'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Exact Official Excel Tender Matrix Replica */}
          <div className="mt-8 pt-6 border-t border-slate-800">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
                <h4 className="text-base font-bold text-white">
                  {isRtl ? 'مطابقة جدول إكسل المعتمد للمناقصة (Excel Tender Ledger Sheet)' : 'Official Excel Tender Ledger Matrix'}
                </h4>
              </div>
              <span className="text-xs text-emerald-300 bg-emerald-950/80 border border-emerald-600/50 px-3 py-1 rounded-full font-bold inline-flex items-center gap-1">
                <span>✓</span>
                <span>{isRtl ? 'مطابق لنموذج الحسبة المعتمد في العطاء' : 'Exact Tender Formula Match'}</span>
              </span>
            </div>

            {/* Excel Sheet Card */}
            <div className="bg-slate-950 p-4 sm:p-6 rounded-2xl border border-slate-800 overflow-x-auto flex justify-center">
              <div className="inline-block border-2 border-slate-900 bg-white text-slate-900 shadow-xl font-sans text-sm min-w-[480px]">
                {/* Excel Table Title Bar */}
                <div className="bg-white border-b-2 border-slate-900 text-center font-bold text-slate-900 py-2.5 text-base sm:text-lg tracking-wide">
                  {(activeSelectedProposal?.companyName || '').split('(')[0].trim()}
                </div>

                {/* Table Content with Green Dashed Tender Box */}
                <div className="relative">
                  {/* Grid Headers */}
                  <div className="grid grid-cols-4 border-b-2 border-slate-900 bg-white font-black text-center text-xs sm:text-sm">
                    <div className="p-2.5 border-e border-slate-400 bg-slate-50">{isRtl ? 'الأعمار' : 'Age'}</div>
                    <div className="p-2.5 border-e border-slate-400 bg-slate-50">{isRtl ? 'الأعداد' : 'Census'}</div>
                    <div className="p-2.5 border-e border-slate-400">{isRtl ? 'السعر / دينار' : 'Rate / JOD'}</div>
                    <div className="p-2.5">{isRtl ? 'المجموع' : 'Total'}</div>
                  </div>

                  {/* Row 1: 0-17 */}
                  <div className="grid grid-cols-4 border-b border-slate-300 text-center text-xs sm:text-sm">
                    <div className="p-2.5 border-e border-slate-300 font-bold bg-slate-50/50">0-17</div>
                    <div className="p-2.5 border-e border-slate-300 font-black text-slate-800">{childrenInput}</div>
                    <div className="p-2.5 border-e border-slate-300 font-black text-slate-800">{activePricing.childRate}</div>
                    <div className="p-2.5 font-black text-slate-950">{Math.round(activeBreakdown.childrenBase).toLocaleString()}</div>
                  </div>

                  {/* Row 2: 18-65 */}
                  <div className="grid grid-cols-4 border-b border-slate-300 text-center text-xs sm:text-sm">
                    <div className="p-2.5 border-e border-slate-300 font-bold bg-slate-50/50">65 - 18</div>
                    <div className="p-2.5 border-e border-slate-300 font-black text-slate-800">{adultsInput}</div>
                    <div className="p-2.5 border-e border-slate-300 font-black text-slate-800">{activePricing.adultRate}</div>
                    <div className="p-2.5 font-black text-slate-950">{Math.round(activeBreakdown.adultsBase).toLocaleString()}</div>
                  </div>

                  {/* Row 3: 66-75 */}
                  <div className="grid grid-cols-4 border-b-2 border-slate-900 text-center text-xs sm:text-sm">
                    <div className="p-2.5 border-e border-slate-300 font-bold bg-slate-50/50">75 - 66</div>
                    <div className="p-2.5 border-e border-slate-300 font-black text-slate-800">{seniorsInput}</div>
                    <div className="p-2.5 border-e border-slate-300 font-black text-slate-800">{seniorsInput > 0 ? (activePricing.seniorRate || 0) : '0'}</div>
                    <div className="p-2.5 font-black text-slate-950">{seniorsInput > 0 ? Math.round(activeBreakdown.seniorsBase).toLocaleString() : '-'}</div>
                  </div>

                  {/* Row 4: Subtotal Base */}
                  <div className="grid grid-cols-4 border-b-2 border-slate-900 bg-white font-bold text-center text-xs sm:text-sm">
                    <div className="p-2.5 border-e border-slate-400 font-black bg-slate-100">{isRtl ? 'المجموع' : 'Subtotal'}</div>
                    <div className="p-2.5 border-e border-slate-400 font-black text-slate-950 bg-slate-100">{totalCalculated}</div>
                    <div className="p-2.5 border-e border-slate-400 bg-slate-50"></div>
                    <div className="p-2.5 font-black text-slate-950 text-sm sm:text-base">{Math.round(activeBreakdown.baseSubtotal).toLocaleString()}</div>
                  </div>

                  {/* Row 5: Issuance Fee */}
                  <div className="grid grid-cols-4 border-b border-slate-300 text-xs sm:text-sm">
                    <div className="col-span-2 p-2.5 border-e border-slate-300 font-bold text-slate-800 ps-4 bg-slate-50/30">
                      {isRtl ? 'رسوم إصدار' : 'Issuance Fee'}
                    </div>
                    <div className="p-2.5 border-e border-slate-300 text-center font-bold text-slate-800">
                      {formatFeeRate(activeBreakdown.issuanceFeePercent, 'issuance')}
                    </div>
                    <div className="p-2.5 text-center font-black text-slate-950">
                      {activeBreakdown.issuanceFeeAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  </div>

                  {/* Row 6: Revenue Stamps (on Base + Issuance) */}
                  <div className="grid grid-cols-4 border-b border-slate-300 text-xs sm:text-sm">
                    <div className="col-span-2 p-2.5 border-e border-slate-300 font-bold text-slate-800 ps-4 bg-slate-50/30">
                      {isRtl ? 'رسوم طوابع' : 'Stamp Duty'}
                    </div>
                    <div className="p-2.5 border-e border-slate-300 text-center font-bold text-slate-800">
                      {formatFeeRate(activeBreakdown.stampsFeePercent, 'stamps')}
                    </div>
                    <div className="p-2.5 text-center font-black text-slate-950">
                      {activeBreakdown.stampsFeeAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  </div>

                  {/* Row 7: Policyholder Guarantee Fund (0.005) */}
                  <div className="grid grid-cols-4 border-b-2 border-slate-900 text-xs sm:text-sm">
                    <div className="col-span-2 p-2.5 border-e border-slate-300 font-bold text-slate-800 ps-4 bg-slate-50/30">
                      {isRtl ? 'رسوم صندوق ضمان المؤمن له' : 'Guarantee Fund'}
                    </div>
                    <div className="p-2.5 border-e border-slate-300 text-center font-bold text-slate-800">
                      {formatFeeRate(activeBreakdown.guaranteeFundFeePercent, 'guarantee')}
                    </div>
                    <div className="p-2.5 text-center font-black text-slate-950">
                      {activeBreakdown.guaranteeFundFeeAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  </div>

                  {/* Row 8: Grand Total */}
                  <div className="grid grid-cols-4 border-b-2 border-slate-900 bg-white text-xs sm:text-base">
                    <div className="col-span-2 p-3 border-e border-slate-900 font-black ps-4 text-slate-900 bg-slate-100">
                      {isRtl ? 'المجموع الكلي' : 'Grand Total'}
                    </div>
                    <div className="p-3 border-e border-slate-900 bg-slate-50"></div>
                    <div className="p-3 text-center text-slate-950 text-base sm:text-xl font-black bg-amber-50">
                      {Math.round(activeBreakdown.totalAnnualPremium).toLocaleString()}
                    </div>
                  </div>

                  {/* Row 9: Rank */}
                  <div className="grid grid-cols-4 bg-slate-50 text-xs sm:text-sm">
                    <div className="col-span-2 p-2.5 border-e border-slate-400 ps-4 font-bold text-slate-600">
                      {isRtl ? 'الترتيب المالي للعرض' : 'Financial Rank'}
                    </div>
                    <div className="p-2.5 border-e border-slate-400"></div>
                    <div className="p-2.5 text-center text-base font-black text-emerald-800">
                      {activeProposalRank}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Forensic Terms, Conditions & Exclusions Viewer for Active Selected Proposal */}
      {activeSelectedProposal && (
        <div className="pt-2">
          <TenderTermsForensicViewer proposal={activeSelectedProposal} />
        </div>
      )}

      {/* Edit Company Pricing Modal */}
      {editingProposalId && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-sky-600" />
                <span>{isRtl ? 'تعديل جدول أسعار الشركة' : 'Edit Company Rate Card'}</span>
              </h3>
              <button
                onClick={() => setEditingProposalId(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 py-4 text-sm">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {isRtl ? 'الفئة 1 (0-17)' : 'Cat 1 (0-17)'}
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={editChildRate}
                      onChange={(e) => setEditChildRate(Number(e.target.value) || 0)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2 py-2 font-bold text-slate-900 focus:ring-2 focus:ring-sky-500 focus:outline-none text-center"
                    />
                    <span className="block text-[10px] text-center text-slate-400 mt-0.5">JOD</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {isRtl ? 'الفئة 2 (18-65)' : 'Cat 2 (18-65)'}
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={editAdultRate}
                      onChange={(e) => setEditAdultRate(Number(e.target.value) || 0)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2 py-2 font-bold text-slate-900 focus:ring-2 focus:ring-sky-500 focus:outline-none text-center"
                    />
                    <span className="block text-[10px] text-center text-slate-400 mt-0.5">JOD</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {isRtl ? 'الفئة 3 (66-75)' : 'Cat 3 (66-75)'}
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={editSeniorRate}
                      onChange={(e) => setEditSeniorRate(Number(e.target.value) || 0)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2 py-2 font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none text-center"
                    />
                    <span className="block text-[10px] text-center text-slate-400 mt-0.5">JOD</span>
                  </div>
                </div>
              </div>

              {/* Specific Statutory Fees Breakdown (Added to Cost) */}
              <div className="bg-amber-50/70 p-4 rounded-2xl border border-amber-200 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-amber-950 flex items-center gap-1.5">
                    <span>⚖️</span>
                    <span>{isRtl ? 'تفصيل الرسوم القانونية المضافة للتكلفة (القانون الأردني)' : 'Statutory Fee Additions to Cost'}</span>
                  </h4>
                  <span className="text-xs font-black bg-amber-200/80 text-amber-900 px-2 py-0.5 rounded-md">
                    {isRtl ? 'المجموع:' : 'Sum:'} {(normalizeFeeMultiplier(editIssuanceFeePercent, 'issuance') + normalizeFeeMultiplier(editStampsFeePercent, 'stamps') + normalizeFeeMultiplier(editGuaranteeFundFeePercent, 'guarantee')).toFixed(3)}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* 1. رسوم إصدار */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      {isRtl ? '١. رسوم إصدار (كسر عشري)' : '1. Issuance (Rate)'}
                    </label>
                    <input
                      type="number"
                      step="0.001"
                      min="0"
                      max="1"
                      value={editIssuanceFeePercent}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0;
                        setEditIssuanceFeePercent(val);
                        const iss = normalizeFeeMultiplier(val, 'issuance');
                        const stp = normalizeFeeMultiplier(editStampsFeePercent, 'stamps');
                        const gfd = normalizeFeeMultiplier(editGuaranteeFundFeePercent, 'guarantee');
                        setEditFeesPercent(Math.round((iss + stp + gfd) * 10000) / 100);
                      }}
                      className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-2 font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none text-center text-xs"
                      placeholder="0.05"
                    />
                    <span className="text-[10px] text-slate-500 mt-0.5 block text-center">
                      {isRtl ? 'الافتراضي: 0.05 (MEICO: 0.045, JIC: 0.04)' : 'Default: 0.05'}
                    </span>
                  </div>

                  {/* 2. رسوم طوابع */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      {isRtl ? '٢. رسوم طوابع (كسر عشري)' : '2. Stamps (Rate)'}
                    </label>
                    <input
                      type="number"
                      step="0.001"
                      min="0"
                      max="1"
                      value={editStampsFeePercent}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0;
                        setEditStampsFeePercent(val);
                        const iss = normalizeFeeMultiplier(editIssuanceFeePercent, 'issuance');
                        const stp = normalizeFeeMultiplier(val, 'stamps');
                        const gfd = normalizeFeeMultiplier(editGuaranteeFundFeePercent, 'guarantee');
                        setEditFeesPercent(Math.round((iss + stp + gfd) * 10000) / 100);
                      }}
                      className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-2 font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none text-center text-xs"
                      placeholder="0.01"
                    />
                    <span className="text-[10px] text-slate-500 mt-0.5 block text-center">
                      {isRtl ? 'الافتراضي: 0.01' : 'Default: 0.01'}
                    </span>
                  </div>

                  {/* 3. رسوم صندوق ضمان المؤمن له */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      {isRtl ? '٣. صندوق الضمان (كسر عشري)' : '3. Guarantee Fund (Rate)'}
                    </label>
                    <input
                      type="number"
                      step="0.001"
                      min="0"
                      max="1"
                      value={editGuaranteeFundFeePercent}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0;
                        setEditGuaranteeFundFeePercent(val);
                        const iss = normalizeFeeMultiplier(editIssuanceFeePercent, 'issuance');
                        const stp = normalizeFeeMultiplier(editStampsFeePercent, 'stamps');
                        const gfd = normalizeFeeMultiplier(val, 'guarantee');
                        setEditFeesPercent(Math.round((iss + stp + gfd) * 10000) / 100);
                      }}
                      className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-2 font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none text-center text-xs"
                      placeholder="0.005"
                    />
                    <span className="text-[10px] text-slate-500 mt-0.5 block text-center">
                      {isRtl ? 'الافتراضي: 0.005 (5 في الألف)' : 'Default: 0.005 (5/1000)'}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-amber-200/60">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {isRtl ? 'رسم إصدار عقد مقطوع (دينار أردني)' : 'Fixed Contract Fee (JOD)'}
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={editFixedFee}
                      onChange={(e) => setEditFixedFee(Number(e.target.value) || 0)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                    <span className="absolute end-3 top-2 text-xs font-semibold text-slate-400">JOD</span>
                  </div>
                  <span className="text-[11px] text-slate-500 mt-1 block">
                    {isRtl ? 'مثل 50 دينار لشركة MEICO (أو 0 لبقية الشركات)' : 'e.g. 50 JOD for MEICO (0 for others)'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {isRtl ? 'قسط الأسنان للفرد (اختياري)' : 'Dental Rider Rate / pax'}
                  </label>
                  <input
                    type="number"
                    value={editDentalRate}
                    onChange={(e) => setEditDentalRate(Number(e.target.value) || 0)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {isRtl ? 'قسط النظر للفرد (اختياري)' : 'Optical Rider Rate / pax'}
                  </label>
                  <input
                    type="number"
                    value={editOpticalRate}
                    onChange={(e) => setEditOpticalRate(Number(e.target.value) || 0)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {isRtl ? 'ملاحظات وتفاصيل التسعير' : 'Pricing Notes'}
                </label>
                <textarea
                  rows={2}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900"
                  placeholder={isRtl ? 'تفاصيل الرسوم أو شروط التسعير...' : 'Rate card notes...'}
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                onClick={() => setEditingProposalId(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                {isRtl ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                onClick={handleSaveCompanyPricing}
                className="px-5 py-2 text-xs font-bold bg-sky-600 hover:bg-sky-500 text-white rounded-xl shadow-sm cursor-pointer"
              >
                {isRtl ? 'حفظ وتحديث الحسبة المالية' : 'Save & Recalculate'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
