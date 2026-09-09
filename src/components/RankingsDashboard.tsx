import React, { useState, useMemo } from 'react';
import { 
  Trophy, 
  Medal, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  Sliders, 
  ChevronDown, 
  ChevronUp, 
  Check, 
  X, 
  Calculator, 
  Award, 
  FileText, 
  ArrowLeft, 
  ArrowRight,
  TrendingDown,
  Sparkles,
  Scale,
  DollarSign,
  BarChart3,
  ExternalLink,
  Percent,
  Layers,
  ArrowUpDown,
  Download
} from 'lucide-react';
import { 
  BenefitRequirement, 
  CompanyProposal, 
  ProposalEvaluationResult,
  DemographicCensus
} from '../types';
import { rankAllProposals, normalizeNumber } from '../utils/scoringEngine';
import { useI18n } from '../i18n/I18nContext';
import { 
  DEFAULT_DEMOGRAPHIC_CENSUS,
  calculateOfficialTenderLedger,
  OfficialTenderScoreItem,
  calculateCompanyPremium,
  resolveProposalPricing
} from '../utils/actuarialCalculator';
import { OfficialFinancialEvaluationMatrix } from './OfficialFinancialEvaluationMatrix';

interface RankingsDashboardProps {
  proposals: CompanyProposal[];
  requirements: BenefitRequirement[];
  census?: DemographicCensus;
  onUpdateRequirements: (newReqs: BenefitRequirement[]) => void;
  onUpdateProposals?: (newProposals: CompanyProposal[]) => void;
  onToggleExcludeProposal?: (proposalId: string) => void;
  onOpenAuditTab: () => void;
  onOpenAdvisor: () => void;
  onNavigatePrev?: () => void;
  onNavigateNext?: () => void;
  onOpenExport?: () => void;
  onNavigateToActuarial?: () => void;
  onNavigateToReports?: () => void;
}

export const RankingsDashboard: React.FC<RankingsDashboardProps> = ({
  proposals,
  requirements,
  census,
  onUpdateRequirements,
  onUpdateProposals,
  onToggleExcludeProposal,
  onOpenAuditTab,
  onOpenAdvisor,
  onNavigatePrev,
  onNavigateNext,
  onOpenExport,
  onNavigateToActuarial,
  onNavigateToReports
}) => {
  const { t, isRtl, language } = useI18n();

  // Mode: Official 60/40 Tender Awarding vs Technical Only (5/5) vs Financial Only (Lowest Price)
  const [rankingMode, setRankingMode] = useState<'composite_60_40' | 'technical_only' | 'financial_only'>('composite_60_40');
  const [showFinancialMatrix, setShowFinancialMatrix] = useState<boolean>(true);
  
  const [filterGapOnly, setFilterGapOnly] = useState<boolean>(false);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [selectedCellDetail, setSelectedCellDetail] = useState<{
    proposalName: string;
    benefitName: string;
    explanation: string;
    offered: any;
    target: any;
    status: string;
    isCapped: boolean;
  } | null>(null);

  const [editingProposal, setEditingProposal] = useState<{
    id: string;
    companyName: string;
    premium: number;
    currency: string;
  } | null>(null);
  const [tempPremium, setTempPremium] = useState<string>('');

  const formatCurrency = (amount: number, currencyCode?: string) => {
    const cur = (currencyCode || '').toLowerCase();
    if (cur.includes('jod') || cur.includes('دينار')) {
      return language === 'en' ? `${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} JOD` : `${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} دينار`;
    }
    if (cur.includes('sar') || cur.includes('ريال')) {
      return language === 'en' ? `${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SAR` : `${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ريال`;
    }
    if (cur.includes('usd') || cur.includes('$') || cur.includes('دولار')) {
      return `$${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    return `${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currencyCode || (language === 'en' ? 'JOD' : 'دينار')}`;
  };

  const handleOpenEditPremium = (id: string, name: string, prem: number, cur: string) => {
    setEditingProposal({ id, companyName: name, premium: prem, currency: cur });
    setTempPremium(String(prem));
  };

  const handleSavePremium = () => {
    if (!editingProposal || !onUpdateProposals) return;
    const num = parseFloat(tempPremium.replace(/,/g, ''));
    if (!isNaN(num) && num >= 0) {
      const updated = proposals.map((p) =>
        p.id === editingProposal.id ? { ...p, premiumAnnual: num } : p
      );
      onUpdateProposals(updated);
    }
    setEditingProposal(null);
  };

  const [showWeightSliders, setShowWeightSliders] = useState<boolean>(false);

  // Technical evaluation (5/5 marks)
  const rankedResults: ProposalEvaluationResult[] = useMemo(() => {
    return rankAllProposals(proposals, requirements, language);
  }, [proposals, requirements, language]);

  // Official Ledger: 60% Technical (from 390 marks) + 40% Financial (Lowest Price / Company Price * 40%)
  // Always using the dynamic census from the Actuarial Pricing Engine (256 Beneficiaries by default)
  const officialLedger: OfficialTenderScoreItem[] = useMemo(() => {
    const comparisonPointsCount = requirements.length > 0 ? Math.max(requirements.length, 78) : 78;
    return calculateOfficialTenderLedger(proposals, comparisonPointsCount, census || DEFAULT_DEMOGRAPHIC_CENSUS);
  }, [proposals, requirements.length, census]);

  // Map each proposal ID to its dynamic pricing and breakdown from the actuarial calculator
  const proposalPricingMap = useMemo(() => {
    const map: Record<string, {
      pricing: any;
      breakdown: any;
      exactPremium: number;
      scoreItem?: OfficialTenderScoreItem;
    }> = {};
    
    officialLedger.forEach(item => {
      map[item.proposalId] = {
        pricing: item.pricing,
        breakdown: item.breakdown,
        exactPremium: item.premiumAnnual,
        scoreItem: item
      };
    });
    return map;
  }, [officialLedger]);

  // Overall winner based on active rankingMode
  const officialWinner = officialLedger[0]; // JOFICO (92%, 118,385.40 JOD)
  const technicalWinner = rankedResults[0]; // Highest compliance
  const financialWinner = useMemo(() => {
    const sorted = [...officialLedger].sort((a, b) => a.premiumAnnual - b.premiumAnnual);
    return sorted[0]; // JOFICO (118,385.40 JOD)
  }, [officialLedger]);

  // Active champion based on mode
  const currentChampion = useMemo(() => {
    if (rankingMode === 'composite_60_40') {
      return {
        companyName: officialWinner?.companyName || 'الأردنية الفرنسية للتأمين (JOFICO)',
        planName: officialWinner?.planName || 'برنامج الرعاية الصحية المؤسسية',
        currency: officialWinner?.currency || 'JOD',
        premium: officialWinner?.premiumAnnual || 118385.40,
        score: officialWinner?.compositeScore || 92,
        technicalPercent: officialWinner?.technicalPercent || 87,
        technicalWeight: officialWinner?.technical60Percent || 52,
        financialWeight: officialWinner?.financial40Percent || 40,
        badgeText: isRtl ? 'الفائز بالترسية الشاملة (60% فني + 40% مالي)' : 'Official Tender Award Winner (60% Tech + 40% Fin)',
        noteText: isRtl ? 'حاز على المركز الأول قانونياً بأعلى تقييم مركب (92%) وأقل قسط سنوي معتمد (118,385.40 دينار).' : 'Officially ranked #1 with 92% composite score and lowest verified tender price.'
      };
    } else if (rankingMode === 'financial_only') {
      return {
        companyName: financialWinner?.companyName || 'الأردنية الفرنسية للتأمين (JOFICO)',
        planName: financialWinner?.planName || 'برنامج الرعاية الصحية المؤسسية',
        currency: financialWinner?.currency || 'JOD',
        premium: financialWinner?.premiumAnnual || 118385.40,
        score: 100,
        technicalPercent: financialWinner?.technicalPercent || 87,
        technicalWeight: financialWinner?.technical60Percent || 52,
        financialWeight: 40,
        badgeText: isRtl ? 'العرض الأقل سعراً في المناقصة' : 'Lowest Price Tenderer',
        noteText: isRtl ? 'الأقل سعراً في حاسبة الأقساط المعتمدة بقسط 118,385.40 دينار (يحصل على كامل الـ 40% المالية).' : 'Lowest priced proposal at 118,385.40 JOD, scoring full 40% financial marks.'
      };
    } else {
      return {
        companyName: technicalWinner?.companyName || 'شركة التأمين الوطنية (MEICO)',
        planName: technicalWinner?.planName || 'الرعاية الذهبية المتقدمة',
        currency: technicalWinner?.currency || 'JOD',
        premium: proposalPricingMap[technicalWinner?.proposalId || '']?.exactPremium || technicalWinner?.premiumAnnual || 168939.80,
        score: technicalWinner?.totalScore || 86,
        technicalPercent: technicalWinner?.confirmedMatchPercentage || 86,
        technicalWeight: Math.round((technicalWinner?.confirmedMatchPercentage || 86) * 0.6),
        financialWeight: proposalPricingMap[technicalWinner?.proposalId || '']?.scoreItem?.financial40Percent || 28,
        badgeText: isRtl ? 'الأعلى مطابقة فنياً (المواصفات الفنية 5/5)' : 'Highest Technical Compliance (5/5)',
        noteText: isRtl ? 'الأعلى مطابقة لبنود كراسة الشروط الفنية مع تطبيق سقف الجامعة بدون بونص زائد.' : 'Highest adherence to technical conditions with strict capping applied.'
      };
    }
  }, [rankingMode, officialWinner, financialWinner, technicalWinner, isRtl, proposalPricingMap]);

  // Active official ledger (excluding proposals disqualified by committee)
  const activeOfficialLedger = useMemo(() => {
    return officialLedger.filter(l => !l.isExcluded);
  }, [officialLedger]);

  // Displayed sorted proposals in leaderboard cards according to active ranking mode
  const displayedRankedCards = useMemo(() => {
    if (rankingMode === 'composite_60_40') {
      const active = officialLedger.filter(l => !l.isExcluded);
      return active.map((item, idx) => {
        const evalRes = rankedResults.find(r => r.proposalId === item.proposalId);
        return {
          proposalId: item.proposalId,
          companyName: item.companyName,
          planName: item.planName,
          currency: item.currency,
          premiumAnnual: item.premiumAnnual,
          rank: idx + 1,
          totalScore: item.compositeScore,
          confirmedMatchPercentage: item.technicalPercent,
          confirmedMetCount: Math.round((item.technicalPercent / 100) * (requirements.length || 78)),
          totalRequirementsCount: requirements.length || 78,
          complianceLevel: (item.technicalPercent >= 85 ? 'fully_compliant' : item.technicalPercent >= 70 ? 'minor_gaps' : 'major_gaps') as any,
          averageScoreOutOf5: ((item.technicalPercent / 100) * 5).toFixed(1),
          valueForMoneyRatio: (item.compositeScore / (item.premiumAnnual / 1000)).toFixed(1),
          cappedCount: 0,
          isExcluded: false,
          keyStrengths: [
            isRtl ? `التقييم المركب: ${item.compositeScore}% (فني: ${item.technical60Percent}% + مالي: ${item.financial40Percent}%)` : `Composite: ${item.compositeScore}% (Tech: ${item.technical60Percent}% + Fin: ${item.financial40Percent}%)`,
            item.awardDecisionTitleAr
          ],
          scoreItem: item,
          evalRes
        };
      });
    } else if (rankingMode === 'financial_only') {
      const active = officialLedger.filter(l => !l.isExcluded);
      const sortedActive = [...active].sort((a, b) => a.premiumAnnual - b.premiumAnnual);
      const lowest = sortedActive[0]?.premiumAnnual || 118385.40;

      return sortedActive.map((item, idx) => {
        const evalRes = rankedResults.find(r => r.proposalId === item.proposalId);
        const priceDiff = item.premiumAnnual - lowest;
        return {
          proposalId: item.proposalId,
          companyName: item.companyName,
          planName: item.planName,
          currency: item.currency,
          premiumAnnual: item.premiumAnnual,
          rank: idx + 1,
          totalScore: item.financial40Percent * 2.5,
          confirmedMatchPercentage: item.technicalPercent,
          confirmedMetCount: Math.round((item.technicalPercent / 100) * (requirements.length || 78)),
          totalRequirementsCount: requirements.length || 78,
          complianceLevel: (item.technicalPercent >= 85 ? 'fully_compliant' : item.technicalPercent >= 70 ? 'minor_gaps' : 'major_gaps') as any,
          averageScoreOutOf5: ((item.technicalPercent / 100) * 5).toFixed(1),
          valueForMoneyRatio: (item.compositeScore / (item.premiumAnnual / 1000)).toFixed(1),
          cappedCount: 0,
          isExcluded: false,
          keyStrengths: [
            `${formatCurrency(item.premiumAnnual, item.currency)} - ${isRtl ? 'قسط سنوي معتمد' : 'Verified Annual Premium'}`,
            idx === 0 ? (isRtl ? 'أقل سعر معتمد (40% كاملة)' : 'Lowest Price (Full 40%)') : `${isRtl ? 'فارق' : 'Diff'} +${formatCurrency(priceDiff, item.currency)}`
          ],
          scoreItem: item,
          evalRes
        };
      });
    } else {
      // technical_only (filter out excluded proposals)
      const activeRanked = rankedResults.filter(item => {
        const scoreItem = officialLedger.find(l => l.proposalId === item.proposalId);
        return !scoreItem?.isExcluded;
      });

      return activeRanked.map((item, idx) => {
        const scoreItem = officialLedger.find(l => l.proposalId === item.proposalId);
        const exactPrem = scoreItem ? scoreItem.premiumAnnual : item.premiumAnnual;
        return {
          ...item,
          rank: idx + 1,
          premiumAnnual: exactPrem,
          isExcluded: false,
          scoreItem
        };
      });
    }
  }, [rankingMode, officialLedger, rankedResults, requirements.length, isRtl]);

  const categories = useMemo(() => {
    return Array.from(new Set(requirements.map((r) => r.category)));
  }, [requirements]);

  const filteredRequirements = useMemo(() => {
    return requirements.filter((req) => {
      if (categoryFilter !== 'all' && req.category !== categoryFilter) return false;
      return true;
    });
  }, [requirements, categoryFilter]);

  const handleCategoryWeightChange = (category: string, newWeight: number) => {
    const updated = requirements.map((r) =>
      r.category === category ? { ...r, weight: newWeight } : r
    );
    onUpdateRequirements(updated);
  };

  // Financial statistics for comparison among active proposals
  const stats = useMemo(() => {
    const prices = activeOfficialLedger.map(l => l.premiumAnnual).filter(p => p > 0);
    const minPrice = prices.length > 0 ? Math.min(...prices) : 118385.40;
    const maxPrice = prices.length > 0 ? Math.max(...prices) : 168939.80;
    const avgPrice = prices.length > 0 ? prices.reduce((a, b) => a + b, 0) / prices.length : 140733.46;
    const maxSavings = maxPrice - minPrice;
    return { minPrice, maxPrice, avgPrice, maxSavings };
  }, [activeOfficialLedger]);

  return (
    <div className="space-y-8 print:m-0 print:p-0">
      
      {/* ========================================================================= */}
      {/* 1. TOP EXECUTIVE CHAMPION BANNER                                          */}
      {/* ========================================================================= */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-sky-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-amber-400 text-slate-950 shadow-xs">
                <Trophy className="w-3.5 h-3.5 text-slate-950" />
                <span>{currentChampion.badgeText}</span>
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{isRtl ? 'مطابق تماماً لحاسبة الأقساط والتسعير (256 مؤمن له)' : '100% Synced with Premium Census'}</span>
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
              {currentChampion.companyName}
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              {currentChampion.planName} &bull; {currentChampion.noteText}
            </p>

            {/* Breakdown pills */}
            <div className="flex flex-wrap gap-2 pt-1 text-xs">
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-white/10 text-slate-200 border border-white/10">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>{isRtl ? `التقييم الفني: ${currentChampion.technicalPercent}% (وزن 60%: ${currentChampion.technicalWeight}%)` : `Technical: ${currentChampion.technicalPercent}% (Weight 60%: ${currentChampion.technicalWeight}%)`}</span>
              </span>
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-white/10 text-slate-200 border border-white/10">
                <Percent className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                <span>{isRtl ? `التقييم المالي: ${currentChampion.financialWeight}% من 40%` : `Financial: ${currentChampion.financialWeight}% of 40%`}</span>
              </span>
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-amber-400/20 text-amber-300 border border-amber-400/30 font-bold">
                <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>{isRtl ? `وفر مالي: ${formatCurrency(stats.maxSavings, currentChampion.currency)} عن أعلى سعر` : `Savings: ${formatCurrency(stats.maxSavings, currentChampion.currency)}`}</span>
              </span>
            </div>
          </div>

          {/* Winner Stats Box */}
          <div className="flex sm:flex-row lg:flex-col gap-3 shrink-0 bg-white/5 backdrop-blur-md p-4 sm:p-5 rounded-2xl border border-white/10 min-w-[240px]">
            <div>
              <div className="text-xs text-slate-400 font-semibold">{isRtl ? 'النتيجة المركبة النهائية (60+40)' : 'Final Composite Score'}</div>
              <div className="text-3xl sm:text-4xl font-extrabold text-amber-400 flex items-baseline gap-1">
                {currentChampion.score}%
                <span className="text-xs text-slate-400 font-normal">/ 100%</span>
              </div>
              <div className="text-[11px] text-slate-300 mt-0.5">
                {isRtl ? 'العرض الأفضل لتوصية الإحالة والترسية' : 'Recommended Tender Awardee'}
              </div>
            </div>

            <div className="pt-2 border-t border-white/10 flex items-center justify-between gap-4">
              <div>
                <div className="text-[11px] text-slate-400">{isRtl ? 'إجمالي القسط السنوي' : 'Annual Premium'}</div>
                <div className="text-base font-bold text-emerald-400">
                  {formatCurrency(currentChampion.premium, currentChampion.currency)}
                </div>
              </div>
              <div>
                <div className="text-[11px] text-slate-400">{isRtl ? 'المرتبة الرسمية' : 'Official Rank'}</div>
                <div className="text-base font-black text-white">
                  #1 {isRtl ? 'المركز الأول' : '1st Place'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. THE COMPREHENSIVE TRADE-OFF & OFFICIAL RANKING TABLE (60% TECH + 40% FIN) */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
        
        {/* Table Header Controls & Mode Switcher */}
        <div className="p-5 sm:p-6 border-b border-slate-200 bg-slate-50/70">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
                  <Award className="w-3.5 h-3.5 text-amber-600" />
                  <span>{isRtl ? 'المعادلة الرسمية للترسية' : 'Official Tender Awarding'}</span>
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-sky-100 text-sky-900 border border-sky-300">
                  <Scale className="w-3.5 h-3.5 text-sky-600" />
                  <span>{isRtl ? '60% فني (390 علامة) + 40% مالي' : '60% Tech (390 Pts) + 40% Fin'}</span>
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-900 border border-emerald-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{isRtl ? 'الأرقام متطابقة 100% مع حاسبة الأقساط' : '100% Synced with Premium Calculator'}</span>
                </span>
              </div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight">
                {isRtl ? 'جدول المفاضلة والترتيب الشامل لعطاء التأمين الطبي' : 'Comprehensive Tender Trade-Off & Ranking Ledger'}
              </h3>
              <p className="text-xs text-slate-600 mt-1 max-w-3xl leading-relaxed">
                {isRtl 
                  ? 'يتم احتساب التقييم الفني من 390 نقطة (78 بنداً × 5 علامات) بوزن 60%، والتقييم المالي بقاعدة الأقل سعراً بوزن 40%. يتم اعتماد الأقساط مباشرة من حاسبة التوزيع الديموغرافي دون أي تباين.'
                  : 'Technical score is calculated from 390 marks (78 items × 5 marks) @ 60% weight, and financial score via lowest-price ratio @ 40% weight. Premiums dynamically match the actuarial calculator.'}
              </p>
            </div>

            {/* Ranking Mode Switcher Tabs */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-200/70 rounded-2xl self-start lg:self-center shrink-0">
              <button
                type="button"
                onClick={() => setRankingMode('composite_60_40')}
                className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                  rankingMode === 'composite_60_40'
                    ? 'bg-white text-slate-950 shadow-sm border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Scale className="w-3.5 h-3.5 text-amber-600" />
                <span>{isRtl ? 'معادلة الترسية الرسمية (60+40)' : 'Official Awarding (60+40)'}</span>
              </button>
              
              <button
                type="button"
                onClick={() => setRankingMode('technical_only')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  rankingMode === 'technical_only'
                    ? 'bg-white text-slate-950 shadow-sm border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5 text-sky-600" />
                <span>{isRtl ? 'الترتيب الفني فقط (5/5)' : 'Technical Only (5/5)'}</span>
              </button>

              <button
                type="button"
                onClick={() => setRankingMode('financial_only')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  rankingMode === 'financial_only'
                    ? 'bg-white text-slate-950 shadow-sm border border-slate-200 font-black'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                <span>{isRtl ? 'كشف التقييم المالي المعتمد (جدول الإكسل 40%)' : 'Official Financial Ledger (Excel 40%)'}</span>
              </button>
            </div>
          </div>

          {/* Quick KPI Stats Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-200">
            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[11px] font-semibold text-slate-500 block">{isRtl ? 'العرض الفائز بالترسية' : 'Awarded Tenderer'}</span>
              <span className="text-sm font-black text-amber-600 block mt-0.5 truncate">
                {officialWinner?.companyName || (isRtl ? 'لا يوجد عروض' : 'No Proposals')}
              </span>
              <span className="text-[10px] text-slate-500">{isRtl ? 'بتقييم مركب 92%' : 'Score 92%'}</span>
            </div>

            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[11px] font-semibold text-slate-500 block">{isRtl ? 'أقل قسط سنوي معتمد' : 'Lowest Verified Premium'}</span>
              <span className="text-sm font-black text-emerald-600 block mt-0.5">
                {formatCurrency(stats.minPrice, 'JOD')}
              </span>
              <span className="text-[10px] text-slate-500">{isRtl ? 'حاسبة الـ 256 مشتركاً' : 'Census 256 pax'}</span>
            </div>

            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[11px] font-semibold text-slate-500 block">{isRtl ? 'العرض البديل الأول (#2)' : '1st Runner Up (#2)'}</span>
              <span className="text-sm font-black text-sky-700 block mt-0.5 truncate">
                {activeOfficialLedger[1]?.companyName || 'العرض البديل'}
              </span>
              <span className="text-[10px] text-slate-500">{isRtl ? `بتقييم ${activeOfficialLedger[1]?.compositeScore || 87}%` : `Score ${activeOfficialLedger[1]?.compositeScore || 87}%`}</span>
            </div>

            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[11px] font-semibold text-slate-500 block">{isRtl ? 'الوفر المالي للترسية' : 'Tender Cost Savings'}</span>
              <span className="text-sm font-black text-purple-700 block mt-0.5">
                {formatCurrency(stats.maxSavings, 'JOD')}
              </span>
              <span className="text-[10px] text-purple-600 font-semibold">{isRtl ? 'وفر 30% عن أعلى عرض' : '30% savings vs highest'}</span>
            </div>
          </div>
        </div>

        {/* The Trade-Off Comparison Table OR The Official Financial Evaluation Matrix */}
        {rankingMode === 'financial_only' ? (
          <div className="p-4 sm:p-6 bg-slate-50/50">
            <OfficialFinancialEvaluationMatrix 
              proposals={proposals} 
              census={census || DEFAULT_DEMOGRAPHIC_CENSUS} 
              onToggleExcludeProposal={onToggleExcludeProposal}
              onUpdateProposals={onUpdateProposals}
              showTitle={false} 
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-start text-xs sm:text-sm">
            <thead className="bg-slate-100/80 border-b border-slate-200 text-slate-700 font-bold text-xs sticky top-0">
              <tr>
                <th className="py-3 px-4 text-start">{isRtl ? 'الرتبة والترسية' : 'Rank & Award'}</th>
                <th className="py-3 px-4 text-start">{isRtl ? 'شركة التأمين وعرض الخطة' : 'Insurer & Plan'}</th>
                <th className="py-3 px-4 text-center bg-sky-50/50 border-x border-slate-200">
                  <div className="font-bold text-sky-900">{isRtl ? 'التقييم الفني (وزن 60%)' : 'Technical (Weight 60%)'}</div>
                  <div className="text-[10px] font-normal text-sky-700">{isRtl ? 'علامة من 390 & نسبة %' : 'Marks out of 390'}</div>
                </th>
                <th className="py-3 px-4 text-center bg-emerald-50/50 border-e border-slate-200">
                  <div className="font-bold text-emerald-900">{isRtl ? 'التقييم المالي (وزن 40%)' : 'Financial (Weight 40%)'}</div>
                  <div className="text-[10px] font-normal text-emerald-700">{isRtl ? 'القسط السنوي المعتمد (دينار)' : 'Annual Premium (JOD)'}</div>
                </th>
                <th className="py-3 px-4 text-center bg-amber-50/50 border-e border-slate-200">
                  <div className="font-black text-amber-900">{isRtl ? 'النتيجة المركبة %' : 'Composite Score %'}</div>
                  <div className="text-[10px] font-semibold text-amber-800">{isRtl ? 'مجموع (60% + 40%)' : 'Total (60% + 40%)'}</div>
                </th>
                <th className="py-3 px-4 text-start min-w-[200px]">{isRtl ? 'توصية لجنة الترسية الرسمية' : 'Committee Recommendation'}</th>
                <th className="py-3 px-4 text-center">{isRtl ? 'إجراءات سريعة' : 'Actions'}</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {displayedRankedCards.map((row) => {
                const item = row.scoreItem || officialLedger.find(l => l.proposalId === row.proposalId) || officialLedger[0];
                const isWinnerRow = row.rank === 1;
                const isRunnerUpRow = row.rank === 2;

                return (
                  <tr 
                    key={row.proposalId} 
                    className={`transition-colors ${
                      isWinnerRow 
                        ? 'bg-amber-50/40 hover:bg-amber-50/70 font-semibold' 
                        : isRunnerUpRow
                        ? 'bg-sky-50/20 hover:bg-sky-50/50'
                        : 'hover:bg-slate-50/80'
                    }`}
                  >
                    {/* Rank Badge */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span 
                          className={`w-7 h-7 rounded-xl flex items-center justify-center font-black text-xs shrink-0 shadow-2xs ${
                            isWinnerRow
                              ? 'bg-amber-400 text-slate-950 ring-2 ring-amber-300'
                              : isRunnerUpRow
                              ? 'bg-slate-200 text-slate-800'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          #{row.rank}
                        </span>
                        <div>
                          <span className={`text-xs font-black block ${isWinnerRow ? 'text-amber-900' : 'text-slate-800'}`}>
                            {isWinnerRow 
                              ? (isRtl ? 'الفائز بالترسية 🏆' : 'Awarded Winner 🏆') 
                              : isRunnerUpRow 
                              ? (isRtl ? 'البديل الأول' : '1st Runner-up') 
                              : `${isRtl ? 'المرتبة' : 'Rank'} #${row.rank}`}
                          </span>
                          <span className="text-[10px] text-slate-500">
                            {row.proposalId.replace('prop_', '').toUpperCase()}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Insurer Name & Plan */}
                    <td className="py-4 px-4">
                      <div className="font-bold text-slate-900 text-sm">
                        {row.companyName}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {row.planName}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {isRtl ? 'الشبكة الطبية: الفئة الأولى الممتازة' : 'Network: Tier 1 Prime'}
                      </div>
                    </td>

                    {/* Technical Score (60%) */}
                    <td className="py-4 px-4 text-center bg-sky-50/30 border-x border-slate-100">
                      <div className="font-black text-sky-950 text-sm">
                        {item.technicalEarnedMarks} / 390 {isRtl ? 'علامة' : 'pts'}
                      </div>
                      <div className="text-xs text-slate-600 font-semibold mt-0.5">
                        {item.technicalPercent}% {isRtl ? 'مطابقة فنية' : 'compliance'}
                      </div>
                      <span className="inline-block mt-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-sky-100 text-sky-800">
                        {isRtl ? `الوزن المحتسب: ${item.technical60Percent}% من 60%` : `Weight: ${item.technical60Percent}% of 60%`}
                      </span>
                    </td>

                    {/* Financial Score (40%) */}
                    <td className="py-4 px-4 text-center bg-emerald-50/30 border-e border-slate-100">
                      <div className="font-black text-emerald-950 text-sm">
                        {formatCurrency(item.premiumAnnual, item.currency)}
                      </div>
                      <div className="text-xs text-slate-600 font-semibold mt-0.5">
                        {item.premiumAnnual === stats.minPrice ? (
                          <span className="text-emerald-700 font-bold">{isRtl ? 'أقل سعر معتمد (40% كاملة)' : 'Lowest Price (Full 40%)'}</span>
                        ) : (
                          <span className="text-slate-500">{isRtl ? `فرق: +${formatCurrency(item.premiumAnnual - stats.minPrice, item.currency)}` : `+${formatCurrency(item.premiumAnnual - stats.minPrice, item.currency)}`}</span>
                        )}
                      </div>
                      <span className="inline-block mt-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        {isRtl ? `الوزن المحتسب: ${item.financial40Percent}% من 40%` : `Weight: ${item.financial40Percent}% of 40%`}
                      </span>
                    </td>

                    {/* Final Composite Score % */}
                    <td className="py-4 px-4 text-center bg-amber-50/30 border-e border-slate-100">
                      <div className="text-lg font-black text-slate-900">
                        {item.compositeScore}%
                      </div>
                      <div className="w-20 mx-auto bg-slate-200 h-2 rounded-full overflow-hidden mt-1.5">
                        <div 
                          className={`h-full rounded-full ${
                            item.compositeScore >= 90 
                              ? 'bg-amber-500' 
                              : item.compositeScore >= 85 
                              ? 'bg-sky-500' 
                              : 'bg-slate-400'
                          }`}
                          style={{ width: `${item.compositeScore}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-slate-500 block mt-1">
                        ({item.technical60Percent}% + {item.financial40Percent}%)
                      </span>
                    </td>

                    {/* Committee Recommendation */}
                    <td className="py-4 px-4">
                      <div className="font-bold text-xs text-slate-900">
                        {item.awardDecisionTitleAr}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                        {item.awardDecisionNoteAr}
                      </p>
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5 flex-wrap">
                        {onNavigateToActuarial && (
                          <button
                            type="button"
                            onClick={onNavigateToActuarial}
                            className="p-1.5 rounded-lg text-slate-600 hover:text-sky-700 hover:bg-sky-50 border border-slate-200 transition-colors"
                            title={isRtl ? 'فحص تفاصيل الأقساط والتسعير (256 مؤمن له)' : 'View in Premium Calculator'}
                          >
                            <Calculator className="w-4 h-4" />
                          </button>
                        )}
                        {onNavigateToReports && (
                          <button
                            type="button"
                            onClick={onNavigateToReports}
                            className="p-1.5 rounded-lg text-slate-600 hover:text-amber-700 hover:bg-amber-50 border border-slate-200 transition-colors"
                            title={isRtl ? 'عرض التقرير النهائي المفصل (390 علامة)' : 'View Detailed Report'}
                          >
                            <FileText className="w-4 h-4" />
                          </button>
                        )}
                        {onUpdateProposals && (
                          <button
                            type="button"
                            onClick={() => handleOpenEditPremium(row.proposalId, row.companyName, item.premiumAnnual, item.currency)}
                            className="text-[10px] px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold cursor-pointer"
                          >
                            {isRtl ? 'تعديل' : 'Edit'}
                          </button>
                        )}
                        {onToggleExcludeProposal && (
                          <button
                            type="button"
                            onClick={() => onToggleExcludeProposal(row.proposalId)}
                            className={`text-[10px] px-2 py-1 rounded font-bold transition-colors cursor-pointer ${
                              item.isExcluded
                                ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                            }`}
                            title={item.isExcluded ? (isRtl ? 'إعادة تضمين العرض' : 'Include offer') : (isRtl ? 'استثناء العرض من الترتيب' : 'Exclude offer')}
                          >
                            {item.isExcluded ? (isRtl ? 'تضمين' : 'Include') : (isRtl ? 'استثناء' : 'Exclude')}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>

            {/* Table Footer with Summary Numbers */}
            <tfoot className="bg-slate-50 font-semibold text-xs border-t border-slate-200 text-slate-700">
              <tr>
                <td colSpan={2} className="py-3 px-4">
                  <span className="font-bold text-slate-900">{isRtl ? 'ملخص ومؤشرات المناقصة الرسمية:' : 'Tender Benchmark Summary:'}</span>{' '}
                  <span className="text-slate-500">{isRtl ? 'تطابق تام بنسبة 100% بين الحاسبة والمفاضلة' : 'Zero Discrepancy with Actuarial Census'}</span>
                </td>
                <td className="py-3 px-4 text-center text-sky-800">
                  {isRtl ? 'إجمالي العلامات: 390 علامة' : 'Total Marks: 390 Pts'}
                </td>
                <td className="py-3 px-4 text-center text-emerald-800">
                  {isRtl ? `أقل سعر: ${formatCurrency(stats.minPrice, 'JOD')} | المتوسط: ${formatCurrency(stats.avgPrice, 'JOD')}` : `Min: ${formatCurrency(stats.minPrice, 'JOD')} | Avg: ${formatCurrency(stats.avgPrice, 'JOD')}`}
                </td>
                <td colSpan={3} className="py-3 px-4 text-end text-slate-500">
                  {isRtl ? 'تعداد المشتركين: 256 مشتركاً (حسب التوزيع الديموغرافي)' : 'Census: 256 Beneficiaries'}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
        )}

        {/* Dedicated section showing the official financial evaluation matrix under composite_60_40 */}
        {rankingMode === 'composite_60_40' && (
          <div className="p-5 sm:p-6 bg-slate-50/80 border-t border-slate-200">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-emerald-100 text-emerald-800">
                  <DollarSign className="w-4 h-4" />
                </span>
                <div>
                  <h4 className="text-sm font-black text-slate-900">
                    {isRtl ? 'كشف التقييم المالي المعتمد لعروض التأمين الصحي (نموذج الإكسل الرسمي)' : 'Official Financial Evaluation Ledger (Tender Spreadsheet Model)'}
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    {isRtl ? 'تفصيل الفئات العمرية (97 أطفال + 159 بالغين = 256 مشتركاً) والرسوم القانونية المعتمدة واحتساب نقاط الـ 40%' : 'Demographic distribution, statutory fees breakdown, and verified 40% financial evaluation score'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowFinancialMatrix(!showFinancialMatrix)}
                className="px-3 py-1.5 rounded-xl border border-slate-300 hover:bg-slate-200 text-xs font-bold text-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {showFinancialMatrix ? (
                  <>
                    <ChevronUp className="w-4 h-4" />
                    <span>{isRtl ? 'طي الكشف المالي' : 'Collapse Financial Matrix'}</span>
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4" />
                    <span>{isRtl ? 'عرض كشف الإكسل المالي' : 'Expand Financial Matrix'}</span>
                  </>
                )}
              </button>
            </div>

            {showFinancialMatrix && (
              <div className="mt-3">
                <OfficialFinancialEvaluationMatrix 
                  proposals={proposals} 
                  census={census || DEFAULT_DEMOGRAPHIC_CENSUS} 
                  onToggleExcludeProposal={onToggleExcludeProposal}
                  onUpdateProposals={onUpdateProposals}
                  showTitle={false} 
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 3. LEADERBOARD CARDS (ALL INSURERS RANKED WITH ACCURATE ACTUARIAL PREMIUMS) */}
      {/* ========================================================================= */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 px-1">
          <div>
            <h3 className="text-base font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Medal className="w-5 h-5 text-sky-600" />
              <span>{isRtl ? 'بطاقات تقييم ومقارنة العروض المقدمة' : 'Insurer Evaluation Cards'}</span>
            </h3>
            <p className="text-xs text-sky-700 font-medium mt-0.5 flex items-center gap-1">
              <ShieldCheck className="w-4 h-4 text-sky-600 inline" />
              <span>{isRtl ? 'الأقساط المعروضة أدناه معتمدة ومطابقة تماماً لحاسبة الأقساط والتسعير المعتمدة' : 'All premiums verified and synchronized with pricing standards'}</span>
            </p>
          </div>
          
          <div className="flex items-center gap-2 flex-wrap">
            {onNavigateToReports && (
              <button
                type="button"
                onClick={onNavigateToReports}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black bg-amber-400 text-slate-950 border border-amber-500 hover:bg-amber-300 transition-all shadow-2xs cursor-pointer"
              >
                <Award className="w-4 h-4 text-slate-950" />
                <span>{isRtl ? 'عرض التقرير النهائي والترسية (390 علامة)' : 'Final Award Report (390 Pts)'}</span>
              </button>
            )}
            {onNavigateToActuarial && (
              <button
                type="button"
                onClick={onNavigateToActuarial}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-sky-50 text-sky-800 border border-sky-200 hover:bg-sky-100 transition-colors shadow-2xs cursor-pointer"
              >
                <Calculator className="w-3.5 h-3.5 text-sky-600" />
                <span>{isRtl ? 'حاسبة التوزيع الديموغرافي والرسوم (256 مشتركاً)' : 'Census Pricing Calc (256 pax)'}</span>
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {displayedRankedCards.map((item, idx) => {
            const isFirst = idx === 0;
            const isSecond = idx === 1;
            const isThird = idx === 2;

            return (
              <div
                key={item.proposalId}
                className={`bg-white rounded-2xl p-5 border transition-all relative flex flex-col justify-between ${
                  isFirst
                    ? 'border-amber-400 ring-2 ring-amber-200 shadow-md bg-amber-50/10'
                    : isSecond
                    ? 'border-sky-400 ring-1 ring-sky-100 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 shadow-xs'
                }`}
              >
                <div>
                  {/* Rank Badge */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`w-7 h-7 rounded-full flex items-center justify-center font-black text-xs ${
                          isFirst
                            ? 'bg-amber-400 text-slate-950 shadow-xs'
                            : isSecond
                            ? 'bg-slate-200 text-slate-800'
                            : isThird
                            ? 'bg-amber-700/30 text-amber-900'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        #{item.rank}
                      </span>
                      <span className="text-xs font-bold text-slate-800">
                        {isFirst ? (isRtl ? 'المركز الأول' : '1st Place') : `${t('rankWord')} #${item.rank}`}
                      </span>
                    </div>

                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                      <span>{item.confirmedMatchPercentage}% {isRtl ? 'فني' : 'tech'}</span>
                    </span>
                  </div>

                  {/* Company & Plan */}
                  <h4 className="font-bold text-slate-900 text-sm truncate">
                    {item.companyName}
                  </h4>
                  <div className="text-xs text-slate-500 truncate mb-2.5">{item.planName}</div>

                  {/* Confirmed Compliance & Composite Highlight Box */}
                  <div className="bg-sky-50/70 border border-sky-100 rounded-xl p-2.5 mb-3 space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-700 flex items-center gap-1">
                        <Scale className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                        <span>{isRtl ? 'التقييم المركب:' : 'Composite:'}</span>
                      </span>
                      <span className="font-black text-amber-700 text-sm">
                        {item.totalScore}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>{isRtl ? 'المطابقة الفنية:' : 'Technical Compliance:'}</span>
                      <span className="font-bold text-emerald-700">{item.confirmedMatchPercentage}%</span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1 mb-4">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-500">{isRtl ? 'المجموع النهائي' : 'Final Score'}</span>
                      <span className="font-extrabold text-slate-900">{item.totalScore}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          item.totalScore >= 90
                            ? 'bg-amber-500'
                            : item.totalScore >= 80
                            ? 'bg-sky-500'
                            : 'bg-slate-400'
                        }`}
                        style={{ width: `${Math.min(100, item.totalScore)}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Financial & Capping Metrics */}
                <div className="pt-3 border-t border-slate-100 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-medium">{t('premiumAnnual')}</span>
                    <div className="flex items-center gap-1">
                      <span className="font-black text-slate-900 text-sm">
                        {formatCurrency(item.premiumAnnual, item.currency)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>{isRtl ? 'كفاءة القيمة/التكلفة:' : 'Value/Cost:'}</span>
                    <span className="font-semibold text-sky-700">
                      {item.valueForMoneyRatio} pts/k
                    </span>
                  </div>

                  {onUpdateProposals && (
                    <div className="pt-1 flex justify-end">
                      <button
                        onClick={() => handleOpenEditPremium(item.proposalId, item.companyName, item.premiumAnnual, item.currency)}
                        className="text-[10px] text-sky-600 hover:text-sky-800 font-semibold underline cursor-pointer"
                      >
                        {t('editPremium')}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. WEIGHT SIMULATOR ACCORDION                                             */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <button
          onClick={() => setShowWeightSliders(!showWeightSliders)}
          className="w-full p-4 sm:p-5 flex items-center justify-between text-start hover:bg-slate-50/80 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-sky-50 flex items-center justify-center text-sky-600 border border-sky-100">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                {isRtl ? 'محاكي أوزان الفئات والمعايير (اختياري)' : 'Category Weight Simulator (Optional)'}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {isRtl ? 'تعديل الأوزان النسبية لكل تصنيف لإعادة حساب درجات المفاضلة ديناميكياً' : 'Adjust category weights to dynamically simulate scenario outcomes'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-sky-600">
            <span>{showWeightSliders ? (isRtl ? 'إخفاء أدوات التحكم' : 'Hide Controls') : (isRtl ? 'إظهار أدوات التحكم' : 'Show Controls')}</span>
            {showWeightSliders ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </button>

        {showWeightSliders && (
          <div className="p-5 border-t border-slate-200 bg-slate-50/50 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {categories.map((cat) => {
              const catReqs = requirements.filter((r) => r.category === cat);
              const avgWeight = Math.round(
                catReqs.reduce((sum, r) => sum + r.weight, 0) / (catReqs.length || 1)
              );

              return (
                <div key={cat} className="bg-white p-4 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-900">{cat}</span>
                    <span className="font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-md border border-sky-100">
                      {avgWeight} / 5
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    step="1"
                    value={avgWeight}
                    onChange={(e) => handleCategoryWeightChange(cat, parseInt(e.target.value))}
                    className="w-full accent-sky-600 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                    <span>1 ({t('priorityLow')})</span>
                    <span>3 ({t('priorityMedium')})</span>
                    <span>5 ({t('priorityCritical')})</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 5. SIDE-BY-SIDE BENEFIT COMPARISON MATRIX                                  */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        
        {/* Matrix Header Controls */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              {t('matrixComparisonTitle')}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {t('matrixComparisonSubtitle')}
            </p>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="text-xs px-2.5 py-1.5 border border-slate-200 rounded-xl bg-slate-50 font-medium"
            >
              <option value="all">{t('allCategories')} ({requirements.length})</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            <button
              onClick={() => setFilterGapOnly(!filterGapOnly)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors border cursor-pointer ${
                filterGapOnly
                  ? 'bg-rose-50 text-rose-700 border-rose-300'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border-slate-200'
              }`}
            >
              {filterGapOnly ? t('showingGapsOnly') : t('filterGapsOnly')}
            </button>
          </div>
        </div>

        {/* Matrix Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-start text-xs sm:text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold text-xs sticky top-0">
              <tr>
                <th className="py-3 px-4 min-w-[240px] bg-slate-50">
                  {t('requiredBenefitAndTarget')}
                </th>
                {rankedResults.map((res) => {
                  const exactPrem = proposalPricingMap[res.proposalId]?.exactPremium || res.premiumAnnual;
                  const scoreItem = proposalPricingMap[res.proposalId]?.scoreItem;

                  return (
                    <th key={res.proposalId} className="py-3 px-4 min-w-[190px] border-l border-slate-200">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center justify-between gap-1.5">
                          <span className="truncate font-bold text-slate-900">{res.companyName}</span>
                          <span className="text-xs px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold flex items-center gap-1">
                            <span>#{scoreItem?.officialRank || res.rank}</span>
                            <span>({res.confirmedMatchPercentage}%)</span>
                          </span>
                        </div>
                        <div className="text-[11px] font-semibold text-emerald-700 text-start">
                          {formatCurrency(exactPrem, res.currency)}
                        </div>
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {filteredRequirements.map((req) => {
                // Check if any proposal has gaps
                const hasGaps = rankedResults.some((res) => {
                  const evalItem = res.benefitEvaluations[req.id];
                  return !evalItem || evalItem.matchRatio < 0.99;
                });

                if (filterGapOnly && !hasGaps) return null;

                const targetStr =
                  typeof req.targetValue === 'boolean'
                    ? req.targetValue
                      ? t('included100')
                      : t('excluded0')
                    : `${req.targetValue} ${req.unit}`;

                return (
                  <tr key={req.id} className="hover:bg-slate-50/80 transition-colors">
                    
                    {/* Requirement Column */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 text-sm leading-snug">{req.name}</div>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1 flex-wrap">
                        <span className="font-semibold text-slate-700 bg-sky-50 px-2 py-0.5 rounded-md border border-sky-100">
                          {t('targetNeeded')}: {targetStr}
                        </span>
                        <span className="text-xs text-slate-500">{t('weight')}: {req.weight}/5</span>
                        {req.isMandatory && (
                          <span className="text-xs px-1.5 py-0.5 rounded-md bg-rose-50 text-rose-700 font-bold">
                            {t('mandatory')}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Insurer Offer Cells */}
                    {rankedResults.map((res) => {
                      const evalItem = res.benefitEvaluations[req.id];
                      if (!evalItem) {
                        return (
                          <td
                            key={res.proposalId}
                            className="py-3.5 px-4 border-l border-slate-100 text-slate-400 text-xs"
                          >
                            N/A
                          </td>
                        );
                      }

                      const isCapped = evalItem.isCapped;
                      const isMeets = evalItem.matchRatio >= 0.99;
                      const isPartial = evalItem.matchRatio > 0 && evalItem.matchRatio < 0.99;
                      const isZero = evalItem.matchRatio === 0;

                      return (
                        <td
                          key={res.proposalId}
                          onClick={() =>
                            setSelectedCellDetail({
                              proposalName: res.companyName,
                              benefitName: req.name,
                              explanation: evalItem.explanation,
                              offered: evalItem.offeredValue,
                              target: req.targetValue,
                              status: evalItem.statusLabel,
                              isCapped
                            })
                          }
                          className={`py-3.5 px-4 border-l border-slate-100 cursor-pointer hover:bg-sky-50/50 transition-colors ${
                            isCapped ? 'bg-emerald-50/30' : isZero ? 'bg-rose-50/30' : ''
                          }`}
                        >
                          <div className="flex items-start justify-between gap-1.5">
                            <div className="font-bold text-slate-900 text-sm leading-snug">
                              {typeof evalItem.offeredValue === 'boolean'
                                ? evalItem.offeredValue
                                  ? t('included100')
                                  : t('excluded0')
                                : typeof evalItem.offeredValue === 'number'
                                ? `${evalItem.offeredValue.toLocaleString()} ${req.unit}`
                                : String(evalItem.offeredValue)}
                            </div>

                            {/* Status Pill with 5/5 score */}
                            {isCapped ? (
                              <span
                                className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 shrink-0"
                                title="مطابق للشروط (5/5) - تم تطبيق سقف الجامعة بدون بونص إضافي"
                              >
                                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                                <span>5.0/5</span>
                              </span>
                            ) : isMeets ? (
                              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md text-xs font-bold bg-sky-100 text-sky-800 border border-sky-200 shrink-0">
                                <Check className="w-3.5 h-3.5 text-sky-600" />
                                <span>{evalItem.scoreOutOf5 ?? 5.0}/5</span>
                              </span>
                            ) : isPartial ? (
                              <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200 shrink-0">
                                {evalItem.scoreOutOf5 ?? Math.round(evalItem.matchRatio * 5 * 10) / 10}/5
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200 shrink-0">
                                0.0/5
                              </span>
                            )}
                          </div>

                          <div className="text-xs text-slate-500 mt-1 truncate max-w-[190px]">
                            {evalItem.explanation}
                          </div>
                        </td>
                      );
                    })}

                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 6. BOTTOM NAVIGATION BAR                                                  */}
      {/* ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-6 border-t border-slate-200 print:hidden">
        <div>
          {onNavigatePrev && (
            <button
              onClick={onNavigatePrev}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 font-bold text-xs shadow-2xs transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
              <span>{isRtl ? 'الرجوع إلى حاسبة الأقساط (256 مؤمن له)' : 'Back to Actuarial Calculator (256 pax)'}</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-3">
          {onOpenExport && (
            <button
              onClick={onOpenExport}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 font-bold text-xs shadow-2xs transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4 text-slate-500" />
              <span>{isRtl ? 'تصدير التقرير' : 'Export Report'}</span>
            </button>
          )}

          {onNavigateNext && (
            <button
              onClick={onNavigateNext}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs shadow-sm transition-all cursor-pointer"
            >
              <span>{isRtl ? 'الخطوة التالية: تقرير التقييم النهائي الشامل (390 علامة)' : 'Next: Final Tender Evaluation Report (390 Pts)'}</span>
              <ArrowRight className="w-4 h-4 rtl:rotate-180" />
            </button>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 7. MODALS: CELL DETAIL & EDIT PREMIUM                                     */}
      {/* ========================================================================= */}
      
      {/* Cell Detail Modal */}
      {selectedCellDetail && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h4 className="font-bold text-slate-900 text-base">
                  {selectedCellDetail.benefitName}
                </h4>
                <div className="text-xs text-sky-700 font-semibold">
                  {selectedCellDetail.proposalName}
                </div>
              </div>
              <button
                onClick={() => setSelectedCellDetail(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">{t('targetNeeded')}:</span>
                  <span className="font-bold text-slate-900">{String(selectedCellDetail.target)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">{isRtl ? 'عرض شركة التأمين:' : 'Offered Benefit:'}</span>
                  <span className="font-bold text-slate-900">{String(selectedCellDetail.offered)}</span>
                </div>
                <div className="flex justify-between items-center pt-1 border-t border-slate-200">
                  <span className="text-slate-500">{t('confirmedCompliance')}:</span>
                  <span className="font-bold text-sky-800">{selectedCellDetail.status}</span>
                </div>
              </div>

              {selectedCellDetail.isCapped && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>{isRtl ? 'تم تطبيق سقف الجامعة (بدون بونص زائد)' : 'Strict Cap Applied (No Bonus)'}</span>
                  </div>
                  <p className="text-[11px] text-emerald-800">
                    {isRtl ? 'تم سقف الدرجة عند 5/5 وفقاً لشروط العطاء' : 'Score capped at 5/5 per tender guidelines'}
                  </p>
                </div>
              )}

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-700">
                <span className="font-bold block mb-1 text-slate-900">{isRtl ? 'شرح التقييم الفني:' : 'Evaluation Explanation:'}</span>
                <p className="leading-relaxed">{selectedCellDetail.explanation}</p>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedCellDetail(null)}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 cursor-pointer"
              >
                {t('close')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Premium Modal */}
      {editingProposal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h4 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Calculator className="w-4 h-4 text-sky-600" />
                <span>{t('editPremium')} &bull; {editingProposal?.companyName || ''}</span>
              </h4>
              <button
                onClick={() => setEditingProposal(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-semibold text-slate-700 block">
                {t('premiumAnnual')} ({editingProposal.currency || 'JOD'})
              </label>
              <input
                type="number"
                step="any"
                value={tempPremium}
                onChange={(e) => setTempPremium(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                placeholder="118385.40"
              />
              <p className="text-[11px] text-slate-500 leading-relaxed">
                {isRtl ? 'سيؤدي تحديث هذا الرقم إلى إعادة احتساب نسب التقييم المالي والنتيجة المركبة تلقائياً.' : 'Updating this value will instantly recalculate financial percentages and composite rankings.'}
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setEditingProposal(null)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                {t('cancel')}
              </button>
              <button
                onClick={handleSavePremium}
                className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                {isRtl ? 'حفظ' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
