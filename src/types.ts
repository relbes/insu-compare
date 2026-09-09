export type BenefitEvaluationType = 
  | 'numeric_min' // Required is minimum needed (e.g., min 8 visits). >= target gives 100% capped (NO BONUS). < target gives (offered/target)*100%.
  | 'numeric_max' // Required is maximum ceiling (e.g., max 20% copay, max $500 deductible). <= target gives 100% capped. > target penalized.
  | 'boolean'     // Included (100%) vs Excluded (0%) vs Partial (50%)
  | 'tier_level'  // Network/Plan tier (VIP, Comprehensive, Standard, Restricted)
  | 'qualitative'; // AI semantic match or custom string matching

export type PriorityLevel = 'low' | 'medium' | 'high' | 'critical';

export interface BenefitRequirement {
  id: string;
  category: string;
  name: string;
  targetValue: number | string | boolean;
  unit: string;
  type: BenefitEvaluationType;
  weight: number; // 1 to 5
  priority: PriorityLevel;
  isMandatory: boolean; // Flag if failing this makes proposal non-compliant
  description?: string;
  // Bilingual cache
  nameAr?: string;
  nameEn?: string;
  categoryAr?: string;
  categoryEn?: string;
  unitAr?: string;
  unitEn?: string;
  descriptionAr?: string;
  descriptionEn?: string;
  targetValueAr?: number | string | boolean;
  targetValueEn?: number | string | boolean;
}

export interface OfferedBenefitData {
  offeredValue: number | string | boolean;
  rawText?: string;
  notes?: string;
  isIncluded: boolean;
  confidence?: number;
  // Bilingual cache
  rawTextAr?: string;
  rawTextEn?: string;
  notesAr?: string;
  notesEn?: string;
}

export interface DemographicCensus {
  totalMembers: number; // e.g. 256
  childrenCount: number; // e.g. 97 (0 – 17 years)
  adultsCount: number; // e.g. 159 (18 – 65 years)
  seniorsCount?: number; // e.g. 0 (66 – 75 years)
  includeDental: boolean;
  includeOptical: boolean;
}

export interface CompanyPricingStructure {
  childRate: number; // Rate for Category 1 (0 – 17 yrs), e.g. 310 or 405 JOD
  adultRate: number; // Rate for Category 2 (18 – 65 yrs), e.g. 510 or 755 JOD
  seniorRate?: number; // Rate for Category 3 (66 – 75 yrs), e.g. 750 or 1,100 JOD
  dentalRatePerPerson?: number; // Optional add-on dental rate per person
  opticalRatePerPerson?: number; // Optional add-on optical rate per person
  
  // Specific Jordanian Statutory Fees Breakdown
  issuanceFeePercent?: number; // رسوم إصدار (افتراضي 5.0%)
  stampsFeePercent?: number; // رسوم طوابع (افتراضي 1.0%)
  guaranteeFundFeePercent?: number; // رسوم صندوق ضمان المؤمن له (افتراضي 0.5%)
  
  feesPercentage: number; // Total percent fees e.g. 6.5 or 6.0 (sum of the three above)
  stampsCalculationBasis?: 'base_plus_issuance' | 'base_only'; // Official tender method: 1% stamp duty on (Base + Issuance)
  feesBreakdown?: {
    issuancePercent?: number; // e.g. 5%
    revenueStampsPercent?: number; // e.g. 1%
    guaranteeFundPercent?: number; // e.g. 0.5%
    otherPercent?: number;
    description?: string;
  };
  fixedContractFee: number; // e.g. 50 JOD or 0
  customNotes?: string;
  isCustomExtracted?: boolean;
  extractedRatesSource?: string;
}

export interface CalculatedPremiumBreakdown {
  childrenBase: number;
  adultsBase: number;
  seniorsBase: number;
  dentalBase: number;
  opticalBase: number;
  baseSubtotal: number;

  // Exact Monetary and Percentage Breakdown for the 3 Statutory Fees
  issuanceFeeAmount: number; // رسوم إصدار بالدينار
  issuanceFeePercent: number; // نسبة رسوم إصدار %
  stampsFeeAmount: number; // رسوم طوابع بالدينار
  stampsFeePercent: number; // نسبة رسوم طوابع %
  guaranteeFundFeeAmount: number; // رسوم صندوق ضمان المؤمن له بالدينار
  guaranteeFundFeePercent: number; // نسبة رسوم صندوق ضمان المؤمن له %

  feesAmount: number;
  fixedFee: number;
  totalAnnualPremium: number;
  childPerPersonWithFees: number;
  adultPerPersonWithFees: number;
  seniorPerPersonWithFees: number;
  theoreticalMinTotal: number;
  theoreticalMaxTotal: number;
}

// Deep forensic analysis of tender conditions, terms, restrictions, and waiting periods
export interface CompanyTermsAnalysis {
  summary?: string; // ملخص شامل لشروط العرض
  waitingPeriods?: string; // فترات الانتظار بدقة (الولادة، الحالات السابقة، الإجراءات المجدولة)
  preExistingConditions?: string; // تغطية الأمراض السابقة للتعاقد والمزمنة وشروطها
  copayRules?: string; // نسب وضوابط التحمل في العيادات والمستشفيات والحدود القصوى
  networkRules?: string; // درجات الشبكة الطبية والمستشفيات المعتمدة وخارج الشبكة
  priorApprovalRules?: string; // إجراءات وحالات الموافقة المسبقة
  exclusions?: string[]; // قائمة الاستثناءات الصريحة المذكورة في نص العرض
  statutoryFeeNotes?: string; // بنود ونصوص الرسوم القانونية والضرائب
  additionalObligations?: string[]; // التزامات الشركة وحامل الوثيقة
  overallVerdict?: string; // التقييم الفني والقانوني الشامل لمدى ملاءمة الشروط
  // Optional bilingual cache
  summaryAr?: string;
  summaryEn?: string;
  waitingPeriodsAr?: string;
  waitingPeriodsEn?: string;
  preExistingConditionsAr?: string;
  preExistingConditionsEn?: string;
  copayRulesAr?: string;
  copayRulesEn?: string;
  networkRulesAr?: string;
  networkRulesEn?: string;
  priorApprovalRulesAr?: string;
  priorApprovalRulesEn?: string;
  exclusionsAr?: string[];
  exclusionsEn?: string[];
  statutoryFeeNotesAr?: string;
  statutoryFeeNotesEn?: string;
  additionalObligationsAr?: string[];
  additionalObligationsEn?: string[];
  overallVerdictAr?: string;
  overallVerdictEn?: string;
}

export interface CompanyProposal {
  id: string;
  companyName: string;
  planName: string;
  premiumAnnual: number;
  currency: string;
  deductibleGeneral?: string;
  networkName?: string;
  submissionDate?: string;
  sourceFileName?: string;
  benefits: Record<string, OfferedBenefitData>; // key is requirementId
  extraFeatures?: Array<{
    title: string;
    description: string;
  }>;
  executiveSummary?: string;
  // Bilingual cache
  companyNameAr?: string;
  companyNameEn?: string;
  planNameAr?: string;
  planNameEn?: string;
  networkNameAr?: string;
  networkNameEn?: string;
  currencyAr?: string;
  currencyEn?: string;
  executiveSummaryAr?: string;
  executiveSummaryEn?: string;
  // Actuarial pricing & demographic census calculation
  pricingStructure?: CompanyPricingStructure;
  calculatedBreakdown?: CalculatedPremiumBreakdown;
  // Deep forensic analysis of tender terms & conditions
  tenderTermsAnalysis?: CompanyTermsAnalysis;
  // Committee exclusion from competitive evaluation and ranking
  isExcluded?: boolean;
  excludedReason?: string;
  // Custom technical evaluation score overrides (from 390)
  customTechnicalMarks?: number;
  technicalEarnedMarks?: number;
}

export interface BenefitMatchEvaluation {
  requirementId: string;
  benefitName: string;
  category: string;
  requiredValue: number | string | boolean;
  offeredValue: number | string | boolean;
  unit: string;
  type: BenefitEvaluationType;
  weight: number;
  isMandatory: boolean;
  matchRatio: number; // 0.0 to 1.0 (capped at 1.0)
  scoreEarned: number; // matchRatio * weight
  maxScore: number; // weight
  scoreOutOf5: number; // Score out of 5 (0.0 to 5.0) - CAPPED AT 5.0 WITH STRICT NO-BONUS
  status: 'exceeds_capped' | 'meets_exact' | 'partial' | 'unmet' | 'not_offered';
  statusLabel: string;
  isCapped: boolean; // True when offered exceeds target, ensuring NO inflation bonus
  explanation: string;
  rawOfferedText?: string;
}

export interface CategoryScoreSummary {
  category: string;
  earnedPoints: number;
  maxPoints: number;
  percentage: number; // 0 to 100
  benefitsCount: number;
  metCount: number;
}

export interface ProposalEvaluationResult {
  proposalId: string;
  companyName: string;
  planName: string;
  premiumAnnual: number;
  currency: string;
  totalScore: number; // 0 to 100%
  averageScoreOutOf5: number; // Average rating out of 5.0 (0.0 to 5.0)
  totalEarnedPoints: number;
  totalMaxPoints: number;
  mandatorySatisfied: boolean;
  failedMandatoryCount: number;
  confirmedMetCount: number; // عدد المنافع المطابقة المؤكدة بنسبة 100%
  confirmedPoints: number; // مجموع النقاط المحققة من المنافع المؤكدة
  confirmedMatchPercentage: number; // نسبة التوافق المتأكد منه (Confirmed Match %)
  partialCount: number; // عدد المنافع المشمولة جزئياً
  unmetCount: number; // عدد المنافع غير المشمولة
  totalRequirementsCount: number; // إجمالي عدد المنافع
  complianceLevel: 'fully_compliant' | 'minor_gaps' | 'non_compliant';
  benefitEvaluations: Record<string, BenefitMatchEvaluation>;
  categoryScores: Record<string, CategoryScoreSummary>;
  cappedBenefitsCount: number; // Number of benefits where excess features were capped without bonus
  rank: number;
  valueForMoneyRatio: number; // Score / (Premium / 1000)
  keyStrengths: string[];
  keyGaps: string[];
}

export interface PresetTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  requirements: BenefitRequirement[];
}

export interface TenderProject {
  id: string;
  year: string; // e.g. "2025-2026" or "2024"
  name: string; // e.g. "مناقصة التأمين الطبي لمنسوبي الجامعة 2025-2026"
  description?: string;
  excelBenefits: BenefitRequirement[]; // Dynamically imported benefits from Excel for this specific year
  excelFileName?: string;
  conditionsText: string;
  conditionsFileName?: string;
  conditionsFileBase64?: string | null;
  conditionsMimeType?: string;
  requirements: BenefitRequirement[];
  proposals: CompanyProposal[];
  census?: DemographicCensus; // Actuarial demographic distribution (e.g., 256 members: 100 children, 156 adults)
  createdAt: string;
  updatedAt: string;
}

export type UserRole = 'super_admin' | 'committee_admin' | 'evaluator' | 'viewer';

export interface AppUser {
  id: string;
  username: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  phone?: string;
  department?: string;
  jobTitle?: string;
  bio?: string;
  createdAt: string;
  lastLoginAt?: string;
  isActive: boolean;
}

export interface SystemSettings {
  organizationNameAr: string;
  organizationNameEn: string;
  committeeTitleAr: string;
  committeeTitleEn: string;
  logoUrl?: string; // base64 or URL
  logoWidth?: number;
  aiProvider: 'gemini' | 'openai';
  geminiModel: string;
  openaiModel: string;
  hasCustomGeminiKey?: boolean;
  hasCustomOpenaiKey?: boolean;
  customGeminiKey?: string;
  customOpenaiKey?: string;
  defaultCurrency: string;
  defaultTechnicalRatio: number; // e.g. 60
  defaultFinancialRatio: number; // e.g. 40
  strictNoBonusEnforced: boolean;
  statutoryIssuancePercent: number; // 0.05
  statutoryStampsPercent: number; // 0.01
  statutoryGuaranteePercent: number; // 0.005
  fixedContractFee: number;
  requireAuthForReports: boolean;
}

export interface AuthSession {
  user: AppUser;
  token: string;
  expiresAt: number;
}
