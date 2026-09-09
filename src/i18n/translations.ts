export type Language = 'en' | 'ar';

export interface Translations {
  // Brand & Nav
  appName: string;
  appSubtitle: string;
  heroSubtitle: string;
  noBonusBadge: string;
  tabRequirements: string;
  tabProposals: string;
  tabRankings: string;
  tabAudit: string;
  rfpTemplates: string;
  loadRfpBenchmark: string;
  aiAdvisor: string;
  export: string;
  resetDemo: string;
  confirmReset: string;
  cleanDataBtn: string;
  loadRealDataBtn: string;
  confirmClearAll: string;
  loadSaudiRealDemo: string;
  langSwitch: string;
  currentLangName: string;

  // Stepper & Guided Flow
  step1Title: string;
  step1Badge: string;
  step2Title: string;
  step2Badge: string;
  step3Title: string;
  step3Badge: string;
  step4Title: string;
  step4Badge: string;
  stepActive: string;
  nextStepBtn: string;
  prevStepBtn: string;
  step1ProceedBtn: string;
  step2ProceedBtn: string;
  step3ProceedBtn: string;
  step4FinishBtn: string;

  // Clarification / Q&A Box
  qaBoxTitle: string;
  strictCappingActive: string;
  qaBoxIntro: string;
  collapseDetails: string;
  viewClarifications: string;
  q1Title: string;
  q1Answer: string;
  q1Explanation: string;
  q2Title: string;
  q2Answer: string;
  q2Explanation: string;
  q3Title: string;
  q3Answer: string;
  q3Explanation: string;
  q4Title: string;
  q4Answer: string;
  q4Explanation: string;

  // Requirements Manager
  reqManagerTitle: string;
  reqManagerSubtitle: string;
  totalRequiredBenefits: string;
  addRequirementBtn: string;
  aiRfpParserBtn: string;
  excelAndConditionsBinderBtn: string;
  downloadExcelTemplateBtn: string;
  searchFilterPlaceholder: string;
  allCategories: string;
  mandatoryOnly: string;
  addRequirementModalTitle: string;
  editRequirementModalTitle: string;
  benefitNameLabel: string;
  categoryLabel: string;
  targetValueLabel: string;
  unitLabel: string;
  evaluationTypeLabel: string;
  priorityWeightLabel: string;
  mandatoryCheckboxLabel: string;
  descriptionLabel: string;
  saveRequirement: string;
  cancel: string;
  deleteRequirement: string;
  editRequirement: string;
  targetNeeded: string;
  weight: string;
  mandatory: string;
  optional: string;
  typeNumericMin: string;
  typeNumericMax: string;
  typeBoolean: string;
  typeTier: string;
  typeQualitative: string;
  priorityCritical: string;
  priorityHigh: string;
  priorityMedium: string;
  priorityLow: string;
  aiExtractRfpTitle: string;
  aiExtractRfpSubtitle: string;
  aiExtractRfpPastePlaceholder: string;
  extractWithAi: string;
  extracting: string;

  // Proposals Manager
  proposalsManagerTitle: string;
  proposalsManagerSubtitle: string;
  proposalsUploadedCount: string;
  propManagerTitle: string;
  propManagerSubtitle: string;
  uploadedProposalsCount: string;
  pasteQuoteBtn: string;
  pasteOfferBtn: string;
  reloadDemoBtn: string;
  loadDemoInsurersBtn: string;
  calculateRankingsBtn: string;
  dropOfferFiles: string;
  dropOfferFilesSubtitle: string;
  dropOfferSub: string;
  proposalsTab: string;
  uploadedInsurers: string;
  clickToInspect: string;
  matchedCount: string;
  annualPremium: string;
  premiumAnnual: string;
  totalAnnualContractPremium: string;
  annualPremiumExplanation: string;
  annualPremiumPerMemberCalc: string;
  perMemberRate: string;
  subscribersCount: string;
  applyCalculatedTotal: string;
  currency: string;
  networkTier: string;
  strictCappingReminder: string;
  capRuleShortNotice: string;
  benefitOffersMapping: string;
  covered: string;
  coveredStatus: string;
  included100: string;
  conditional50: string;
  excluded0: string;
  additionalPerks: string;
  unrequestedPerksTitle: string;
  noProposalSelected: string;
  pasteModalTitle: string;
  pasteModalSubtitle: string;
  pasteOfferTitle: string;
  pasteOfferSubtitle: string;
  companyNameOptional: string;
  companyNameLabel: string;
  proposalContentSchedule: string;
  extractProposal: string;
  extractOfferBtn: string;
  offeredByCompany: string;

  // Rankings Dashboard
  topRecommendation: string;
  topRecommended: string;
  strictNoBonusApplied: string;
  overallMatch: string;
  championSubtitle: string;
  totalQualityScore: string;
  valueEfficiency: string;
  rankingsLeaderboardTitle: string;
  leaderboardTitle: string;
  offersEvaluated: string;
  rank1st: string;
  rankWord: string;
  rankNum: string;
  topChoice: string;
  compliant: string;
  nonCompliant: string;
  conditionallyCompliant: string;
  confirmedCompliance: string;
  confirmedMetBenefits: string;
  confirmedComplianceBasisNotice: string;
  overallScoreLabel: string;
  editPremium: string;
  requirementMatch: string;
  noBonusCappedCount: string;
  cappedSurplus: string;
  benefitsWord: string;
  allRequirementsSatisfied: string;
  sensitivitySimulatorTitle: string;
  sensitivitySimulatorSubtitle: string;
  sensitivityTitle: string;
  sensitivitySubtitle: string;
  adjustWeights: string;
  hideSimulator: string;
  matrixComparisonTitle: string;
  matrixComparisonSubtitle: string;
  sideBySideMatrixTitle: string;
  sideBySideMatrixSubtitle: string;
  filterGapsOnly: string;
  showingGapsOnly: string;
  requiredBenefitAndTarget: string;
  reqBenefitTargetCol: string;
  capped100: string;
  meets100: string;
  status100Capped: string;
  status100Meets: string;
  statusPartial: string;
  status0Excluded: string;
  evaluationRationale: string;
  evalRationale: string;
  noBonusEnforcedTitle: string;
  noBonusEnforcedDesc: string;
  noBonusEnforcedNotice: string;
  close: string;

  // Cap Audit Inspector
  capAuditTitle: string;
  capAuditSubtitle: string;
  capAuditDescription: string;
  active100Cap: string;
  fairCappedScore: string;
  skewedUncapped: string;
  ifSkewedUncapped: string;
  excessFeaturesCapped: string;
  zeroSurplusFeatures: string;
  cappedExcessCount: string;
  skewNeutralized: string;
  neutralizedInflation: string;
  zeroExcess: string;
  surplusNeutralizationLog: string;
  surplusNeutralizationSubtitle: string;
  neutralizationLogTitle: string;
  neutralizationLogSubtitle: string;
  insuranceCompany: string;
  benefitRequirement: string;
  yourTargetNeed: string;
  companyOffered: string;
  surplusUnsolicited: string;
  scoreAwarded: string;
  zeroBonusGiven: string;
  strictlyCapped: string;
  colInsuranceCompany: string;
  colBenefitReq: string;
  colTargetNeed: string;
  colOffered: string;
  colSurplus: string;
  colScoreAwarded: string;
  aiProcurementMemoTitle: string;
  aiProcurementMemoSubtitle: string;
  aiMemoTitle: string;
  aiMemoSubtitle: string;
  generateDecisionMemo: string;
  generateMemoBtn: string;
  generatingAdvice: string;
  procurementExecutiveStrategy: string;
  strategyHeading: string;

  // Export Report Modal
  exportReportModalTitle: string;
  exportReportModalSubtitle: string;
  exportTitle: string;
  exportSubtitle: string;
  exportOverviewTitle: string;
  companiesCount: string;
  cappingPolicyCardTitle: string;
  csvExport: string;
  csvDesc: string;
  pdfSummary: string;
  pdfDesc: string;
  jsonExport: string;
  jsonDesc: string;
  exportCsvTitle: string;
  exportCsvDesc: string;
  exportPrintTitle: string;
  exportPrintDesc: string;
  exportJsonTitle: string;
  exportJsonDesc: string;
  evaluatedInsurersCount: string;
  definedRequirementsCount: string;
  winningProposal: string;
  evaluationStandard: string;
  done: string;

  // Footer
  footerTagline: string;
  footerCapRule: string;
}

export const translations: Record<Language, Translations> = {
  en: {
    // Brand & Nav
    appName: 'Insurance Offer Evaluator',
    appSubtitle: 'Objective RFP procurement: Score & rank insurer proposals based strictly on defined needs',
    heroSubtitle: 'Objective tender scoring, benefit matching & procurement decision engine.',
    noBonusBadge: 'Strict No-Bonus Capping',
    tabRequirements: '1. Required Benefits',
    tabProposals: '2. Insurer Offers',
    tabRankings: '3. Rankings & Scorecard',
    tabAudit: '4. No-Bonus Cap Audit',
    rfpTemplates: 'RFP Templates',
    loadRfpBenchmark: 'Load RFP Benchmark',
    aiAdvisor: 'AI Advisor',
    export: 'Export',
    resetDemo: 'Reset to 4 Real Insurers',
    confirmReset: 'Reset evaluation session to the 4 realistic insurers (Bupa, Tawuniya, Al Rajhi, MedGulf)?',
    cleanDataBtn: 'Clear All (Start Fresh)',
    loadRealDataBtn: 'Load 4 Real Insurers',
    confirmClearAll: 'Are you sure you want to clear all data and start a completely blank session?',
    loadSaudiRealDemo: 'Load 4 Real Corporate Proposals (Bupa, Tawuniya, Al Rajhi, MedGulf)',
    langSwitch: 'العربية',
    currentLangName: 'English',

    // Stepper & Guided Flow
    step1Title: '1. Define Tender Requirements',
    step1Badge: 'defined benefits',
    step2Title: '2. Insurer Proposals (4 Offers)',
    step2Badge: 'company offers',
    step3Title: '3. Rankings & Matrix',
    step3Badge: 'Scorecard & matrix',
    step4Title: '4. Surplus Audit & Decision',
    step4Badge: 'No-bonus log & memo',
    stepActive: 'Active Step',
    nextStepBtn: 'Next Step',
    prevStepBtn: 'Previous Step',
    step1ProceedBtn: 'Save Requirements & Proceed to Step 2: Enter Insurer Offers ➡️',
    step2ProceedBtn: 'Confirm Offers & Proceed to Step 3: View Rankings & Matrix ➡️',
    step3ProceedBtn: 'Proceed to Step 4: Audit Surplus Cap & Generate Memo ➡️',
    step4FinishBtn: 'Start New Tender Evaluation 🔁',

    // Clarification / Q&A Box
    qaBoxTitle: 'Evaluation Model Clarity & Customization',
    strictCappingActive: 'Strict Capping Active',
    qaBoxIntro: 'We have configured your exact requested rule: Any company providing 8 or more forms gets 100% full score (strictly capped with zero extra bonus points). Below are the four core operational assumptions built into this system. Click to inspect or customize:',
    collapseDetails: 'Collapse Details',
    viewClarifications: 'View 4 Clarifications',
    q1Title: 'How should partial scores be calculated when an insurer offers less than required?',
    q1Answer: 'Proportional Linear Score (Standard)',
    q1Explanation: 'For example: If you need 8 outpatient forms and Company A offers 6 forms, they receive 6/8 = 75% score for that benefit. If they offer 8 forms (or 10 forms), they receive exactly 100% full score (strict 100% cap, zero bonus).',
    q2Title: 'How are Copayments and Deductibles evaluated (where lower numbers are better)?',
    q2Answer: 'Inverse Ceiling Scoring with No-Bonus Cap',
    q2Explanation: 'If you require maximum 15% copay, and Company A offers 10% (more favorable), they receive full 100% (capped, no bonus). If Company B offers 20% (worse), their score is penalized proportionally to the excess copayment.',
    q3Title: 'How would you like Mandatory / Non-Negotiable requirements flagged?',
    q3Answer: 'Mandatory Compliance Filter',
    q3Explanation: 'If a company fails a mandatory requirement (e.g. minimum hospital network tier or emergency evacuation), they are flagged as Non-Compliant in rankings so you do not accidentally select an invalid proposal.',
    q4Title: 'Do you want to compare Total Annual Premium vs Quality Score?',
    q4Answer: 'Value-for-Money Efficiency Ratio ($ per Quality Point)',
    q4Explanation: 'The dashboard automatically computes an Efficiency Score (Benefit Quality Score ÷ Annual Premium) to spotlight which insurer gives you the most true value per dollar without paying for fluff.',

    // Requirements Manager
    reqManagerTitle: 'Tender Benefit Requirements Specification',
    reqManagerSubtitle: 'Define the exact coverage levels, forms, limits, and hospital tiers your organization requires.',
    totalRequiredBenefits: 'Defined Benefits',
    addRequirementBtn: 'Add Requirement',
    aiRfpParserBtn: 'AI RFP / PDF Parser',
    excelAndConditionsBinderBtn: 'Import Excel + AI Conditions Matcher',
    downloadExcelTemplateBtn: 'Download Excel Template (.xlsx)',
    searchFilterPlaceholder: 'Search benefit name, category, or unit...',
    allCategories: 'All Categories',
    mandatoryOnly: 'Mandatory Requirements Only',
    addRequirementModalTitle: 'Add Benefit Requirement',
    editRequirementModalTitle: 'Edit Benefit Requirement',
    benefitNameLabel: 'Benefit Name',
    categoryLabel: 'Category',
    targetValueLabel: 'Target Needed Value',
    unitLabel: 'Unit of Measure',
    evaluationTypeLabel: 'Scoring & Capping Rule',
    priorityWeightLabel: 'Priority Weight (1 to 5)',
    mandatoryCheckboxLabel: 'Mandatory Requirement (Non-negotiable condition for tender compliance)',
    descriptionLabel: 'Procurement Specification Notes',
    saveRequirement: 'Save Requirement',
    cancel: 'Cancel',
    deleteRequirement: 'Delete',
    editRequirement: 'Edit',
    targetNeeded: 'Target Needed',
    weight: 'Weight',
    mandatory: 'Mandatory',
    optional: 'Optional',
    typeNumericMin: 'Min Target (Equal/Higher: 100% Capped)',
    typeNumericMax: 'Max Limit (Equal/Lower: 100% Capped)',
    typeBoolean: 'Boolean (Yes/Included = 100%)',
    typeTier: 'Network Tier Level',
    typeQualitative: 'Qualitative Specification',
    priorityCritical: 'Critical Priority (Weight 5)',
    priorityHigh: 'High Priority (Weight 4)',
    priorityMedium: 'Medium Priority (Weight 3)',
    priorityLow: 'Low Priority (Weight 1-2)',
    aiExtractRfpTitle: 'AI Tender & RFP Document Parser',
    aiExtractRfpSubtitle: 'Upload or paste an existing corporate insurance tender specification. Gemini AI extracts and maps all required benefit line items.',
    aiExtractRfpPastePlaceholder: 'Paste RFP requirements text, tables, or specifications here...',
    extractWithAi: 'Extract Requirements with AI',
    extracting: 'Extracting with Gemini AI...',

    // Proposals Manager
    proposalsManagerTitle: 'Company Insurance Proposals & File Upload',
    proposalsManagerSubtitle: 'Upload proposals from any number of insurance companies (unlimited). Gemini AI maps limits, consultation forms, and copays automatically.',
    proposalsUploadedCount: 'Proposals Uploaded',
    propManagerTitle: 'Company Insurance Proposals & File Upload',
    propManagerSubtitle: 'Upload proposals from any number of insurance companies (unlimited). Gemini AI maps limits, consultation forms, and copays automatically.',
    uploadedProposalsCount: 'Proposals Uploaded',
    pasteQuoteBtn: 'Paste Text / Quote',
    pasteOfferBtn: 'Paste Text / Quote',
    reloadDemoBtn: 'Load Sample Benchmark Insurers',
    loadDemoInsurersBtn: 'Load Sample Benchmark Insurers',
    calculateRankingsBtn: 'Calculate Rankings',
    dropOfferFiles: 'Drop Insurance Offer Files Here or Browse',
    dropOfferFilesSubtitle: 'Upload single or multiple proposal documents at once (PDF, Images, Word, Excel). AI parses limits, forms, and deductibles automatically.',
    dropOfferSub: 'Upload single or multiple proposal documents at once (PDF, Images, Word, Excel). AI parses limits, forms, and deductibles automatically.',
    proposalsTab: 'Proposals',
    uploadedInsurers: 'Uploaded Insurers',
    clickToInspect: 'Click to inspect values',
    matchedCount: 'matched',
    annualPremium: 'Total Annual Contract Premium (All Benefits)',
    premiumAnnual: 'Total Annual Contract Premium (All Benefits)',
    totalAnnualContractPremium: 'Total Annual Contract Premium (All Benefits Combined)',
    annualPremiumExplanation: 'The total financial sum requested by the insurer for the entire contract and all covered benefits combined for all insured members (not for a single specific benefit).',
    annualPremiumPerMemberCalc: 'Per-Member Rate Calculator',
    perMemberRate: 'Per-Member Annual Rate',
    subscribersCount: 'Total Insured Members',
    applyCalculatedTotal: 'Apply as Total Contract Premium',
    currency: 'USD ($)',
    networkTier: 'Network Tier',
    strictCappingReminder: 'Values entered here will be compared against your target values. Offering more than required earns full 100% (strictly capped, no bonus).',
    capRuleShortNotice: 'Strict Cap: Exceeding requirements gets 100% score (Zero feature inflation bonus).',
    benefitOffersMapping: 'Benefit Offers Mapping',
    covered: 'Covered',
    coveredStatus: 'Covered',
    included100: 'Included (100%)',
    conditional50: 'Conditional (50%)',
    excluded0: 'Excluded (0%)',
    additionalPerks: 'Additional Free Perks / Unrequested Features',
    unrequestedPerksTitle: 'Additional Free Perks / Unrequested Features',
    noProposalSelected: 'No proposal selected. Click an insurer on the left to review offers.',
    pasteModalTitle: 'Paste Insurer Proposal Quotation',
    pasteModalSubtitle: 'Paste proposal text or email quotes. AI will map all coverages to your requirements.',
    pasteOfferTitle: 'Paste Insurer Proposal Quotation',
    pasteOfferSubtitle: 'Paste proposal text or email quotes. AI will map all coverages to your requirements.',
    companyNameOptional: 'Insurance Company Name (Optional)',
    companyNameLabel: 'Insurance Company Name (Optional)',
    proposalContentSchedule: 'Proposal Content / Benefit Schedule',
    extractProposal: 'Extract Proposal',
    extractOfferBtn: 'Extract Proposal with AI',
    offeredByCompany: 'Company Offered',

    // Rankings Dashboard
    topRecommendation: 'Top Recommended Proposal (#1 Rank)',
    topRecommended: 'Top Recommended Proposal (#1 Rank)',
    strictNoBonusApplied: 'Strict No-Bonus Capping Applied',
    overallMatch: 'Requirement Match',
    championSubtitle: 'Plan: {planName} • Achieved {score}% overall requirement match across {count} defined benefits with strict compliance.',
    totalQualityScore: 'Total Quality Score',
    valueEfficiency: 'Value Efficiency',
    rankingsLeaderboardTitle: 'Proposal Rankings & Alignment Leaderboard',
    leaderboardTitle: 'Proposal Rankings & Alignment Leaderboard',
    offersEvaluated: 'offers evaluated',
    rank1st: 'Top Choice',
    rankWord: 'Rank',
    rankNum: 'Rank #{rank}',
    topChoice: 'Top Choice',
    compliant: 'Compliant',
    nonCompliant: 'Non-Compliant',
    conditionallyCompliant: 'Minor Deviations',
    confirmedCompliance: 'Confirmed Compliance',
    confirmedMetBenefits: 'Confirmed Met Benefits',
    confirmedComplianceBasisNotice: 'Ranked primarily by Confirmed Compliance (100% verified meeting specifications)',
    overallScoreLabel: 'Overall Weighted Score',
    editPremium: 'Edit Premium',
    requirementMatch: 'Requirement Match',
    noBonusCappedCount: 'No-Bonus Capped',
    cappedSurplus: 'No-Bonus Capped',
    benefitsWord: 'benefits',
    allRequirementsSatisfied: 'All requirements satisfied',
    sensitivitySimulatorTitle: 'Sensitivity Analysis: Adjust Category Importance Weights',
    sensitivitySimulatorSubtitle: 'Simulate how prioritizing Outpatient vs Hospitalization vs Maternity changes the winning insurer.',
    sensitivityTitle: 'Sensitivity Analysis: Adjust Category Importance Weights',
    sensitivitySubtitle: 'Simulate how prioritizing Outpatient vs Hospitalization vs Maternity changes the winning insurer.',
    adjustWeights: 'Adjust Weights',
    hideSimulator: 'Hide Simulator',
    matrixComparisonTitle: 'Side-by-Side Benefit Match Matrix',
    matrixComparisonSubtitle: 'Compare target values vs what each company offered. Notice that surplus benefits (e.g. 10 forms vs 8) are strictly capped at 100% with no inflation bonus.',
    sideBySideMatrixTitle: 'Side-by-Side Benefit Match Matrix',
    sideBySideMatrixSubtitle: 'Compare target values vs what each company offered. Notice that surplus benefits (e.g. 10 forms vs 8) are strictly capped at 100% with no inflation bonus.',
    filterGapsOnly: 'Filter Gaps / Unmet',
    showingGapsOnly: 'Showing Gaps Only',
    requiredBenefitAndTarget: 'Required Benefit & Target Value',
    reqBenefitTargetCol: 'Required Benefit & Target Value',
    capped100: '100% Capped',
    meets100: '100% Meets',
    status100Capped: '100% Capped',
    status100Meets: '100% Meets',
    statusPartial: 'Partial',
    status0Excluded: '0% Excluded',
    evaluationRationale: 'Evaluation Rationale',
    evalRationale: 'Evaluation Rationale:',
    noBonusEnforcedTitle: 'No-Bonus Rule Enforced',
    noBonusEnforcedDesc: 'The insurer provided surplus value for this item. Their score is locked at 100% to protect your tender from being skewed by unwanted features.',
    noBonusEnforcedNotice: 'No-Bonus Rule Enforced: The insurer provided surplus value for this item. Their score is locked at 100% to protect your tender from being skewed by unwanted features.',
    close: 'Close',

    // Cap Audit Inspector
    capAuditTitle: 'Feature Inflation & No-Bonus Compliance Audit',
    capAuditSubtitle: 'In tender evaluations, insurers often offer extra volume you did not request (e.g. 10 or 12 consultation forms when you only needed 8) to justify higher premiums. Our engine ensures that providing 8 or more awards exactly 100% full score with 0 bonus points for surplus features.',
    capAuditDescription: 'In tender evaluations, insurers often offer extra volume you did not request (e.g. 10 or 12 consultation forms when you only needed 8) to justify higher premiums. Our engine ensures that providing 8 or more awards exactly 100% full score with 0 bonus points for surplus features.',
    active100Cap: '100% Capping Active',
    fairCappedScore: 'Fair Capped Score',
    skewedUncapped: 'If Skewed (Uncapped):',
    ifSkewedUncapped: 'If Skewed (Uncapped)',
    excessFeaturesCapped: 'Excess Features Capped:',
    zeroSurplusFeatures: 'Zero unrequested excess features.',
    cappedExcessCount: 'Excess Features Capped',
    skewNeutralized: 'Neutralized +{skew}% artificial score inflation',
    neutralizedInflation: 'Neutralized score inflation',
    zeroExcess: 'Zero unrequested excess features.',
    surplusNeutralizationLog: 'Surplus Benefit Neutralization Log',
    surplusNeutralizationSubtitle: 'Every benefit item where an insurer provided more than your requested need, locked strictly at 100% full score.',
    neutralizationLogTitle: 'Surplus Benefit Neutralization Log',
    neutralizationLogSubtitle: 'Every benefit item where an insurer provided more than your requested need, locked strictly at 100% full score.',
    insuranceCompany: 'Insurance Company',
    benefitRequirement: 'Benefit Requirement',
    yourTargetNeed: 'Your Target Need',
    companyOffered: 'Company Offered',
    surplusUnsolicited: 'Surplus Unsolicited',
    scoreAwarded: 'Score Awarded',
    zeroBonusGiven: 'No bonus given',
    strictlyCapped: 'Strictly Capped',
    colInsuranceCompany: 'Insurance Company',
    colBenefitReq: 'Benefit Requirement',
    colTargetNeed: 'Your Target Need',
    colOffered: 'Company Offered',
    colSurplus: 'Surplus Unsolicited',
    colScoreAwarded: 'Score Awarded',
    aiProcurementMemoTitle: 'AI Executive Negotiation & Procurement Memo',
    aiProcurementMemoSubtitle: 'Generate tailored negotiation talking points and contract advice based on this tender\'s results.',
    aiMemoTitle: 'AI Executive Negotiation & Procurement Memo',
    aiMemoSubtitle: 'Generate tailored negotiation talking points and contract advice based on this tender\'s results.',
    generateDecisionMemo: 'Generate Decision Memo',
    generateMemoBtn: 'Generate Decision Memo',
    generatingAdvice: 'Generating Advice...',
    procurementExecutiveStrategy: 'Procurement & Negotiation Executive Strategy',
    strategyHeading: 'Procurement & Negotiation Executive Strategy',

    // Export Report Modal
    exportReportModalTitle: 'Export Evaluation Audit Report',
    exportReportModalSubtitle: 'Download complete comparative audit spreadsheets or print executive summaries.',
    exportTitle: 'Export Evaluation Audit Report',
    exportSubtitle: 'Download complete comparative audit spreadsheets or print executive summaries.',
    exportOverviewTitle: 'Evaluation Session Summary',
    companiesCount: 'Companies',
    cappingPolicyCardTitle: 'Evaluation Standard',
    csvExport: 'Spreadsheet (CSV)',
    csvDesc: 'Full side-by-side data matrix for Excel / Sheets',
    pdfSummary: 'Print / PDF Summary',
    pdfDesc: 'Formatted executive summary for stakeholder sign-off',
    jsonExport: 'Raw JSON Session',
    jsonDesc: 'Structured data backup to reload anytime',
    exportCsvTitle: 'Spreadsheet (CSV)',
    exportCsvDesc: 'Full side-by-side data matrix for Excel / Sheets',
    exportPrintTitle: 'Print / PDF Summary',
    exportPrintDesc: 'Formatted executive summary for stakeholder sign-off',
    exportJsonTitle: 'Raw JSON Session',
    exportJsonDesc: 'Structured data backup to reload anytime',
    evaluatedInsurersCount: 'Evaluated Insurers:',
    definedRequirementsCount: 'Defined Benefit Requirements:',
    winningProposal: 'Winning Proposal:',
    evaluationStandard: 'Evaluation Standard:',
    done: 'Done',

    // Footer
    footerTagline: 'Insurance Offer Evaluator — Objective RFP scoring & benefit matching.',
    footerCapRule: 'Strict Cap: Equal to or exceeding target receives 100% (No Feature Inflation Bonus)'
  },
  ar: {
    // Brand & Nav
    appName: 'مقيّم ومقارن عروض التأمين',
    appSubtitle: 'تقييم مناقصات التأمين بموضوعية: تسجيل وترتيب عروض الشركات بناءً على الاحتياجات المحددة بدقة',
    heroSubtitle: 'محرك تقييم المناقصات، مطابقة المنافع، واتخاذ قرارات الشراء التأميني بموضوعية.',
    noBonusBadge: 'سقف صارم ١٠٠٪ بدون مكافأة فائض',
    tabRequirements: '١. المنافع المطلوبة',
    tabProposals: '٢. عروض شركات التأمين (عدد غير محدود)',
    tabRankings: '٣. الترتيب ولوحة النتائج',
    tabAudit: '٤. تدقيق سقف الفائض والتحيز',
    rfpTemplates: 'نماذج المناقصات الجاهزة',
    loadRfpBenchmark: 'تحميل نموذج مناقصة معياري',
    aiAdvisor: 'المستشار الذكي (AI)',
    export: 'تصدير التقرير',
    resetDemo: 'تحميل نموذج تجريبي جاهز',
    confirmReset: 'هل تريد تحميل النموذج التجريبي الجاهز (عينة شركات ومعايير) للتجربة؟',
    cleanDataBtn: 'مسح كافة البيانات (بدء من الصفر)',
    loadRealDataBtn: 'تحميل عينة تجريبية جاهزة',
    confirmClearAll: 'هل أنت متأكد من رغبتك في مسح كافة البيانات وبدء جلسة جديدة فارغة تماماً؟',
    loadSaudiRealDemo: 'تحميل نموذج تجريبي جاهز مع عينات العروض للمعاينة',
    langSwitch: 'English',
    currentLangName: 'العربية',

    // Stepper & Guided Flow
    step1Title: '١. تحديد متطلبات ومنافع المناقصة',
    step1Badge: 'منافع محددة',
    step2Title: '٢. عروض شركات التأمين (رفع أي عدد من الشركات)',
    step2Badge: 'عروض شركات',
    step3Title: '٣. النتائج والمقارنة المباشرة',
    step3Badge: 'الترتيب والمصفوفة',
    step4Title: '٤. تدقيق سقف الفائض والقرار',
    step4Badge: 'سجل السقف والمذكرة',
    stepActive: 'الخطوة الحالية',
    nextStepBtn: 'الخطوة التالية',
    prevStepBtn: 'الخطوة السابقة',
    step1ProceedBtn: 'حفظ المتطلبات والانتقال للخطوة ٢: إدخال ومراجعة عروض الشركات ⬅️',
    step2ProceedBtn: 'اعتماد العروض والانتقال للخطوة ٣: احتساب الترتيب والمقارنة ⬅️',
    step3ProceedBtn: 'الانتقال للخطوة ٤: تدقيق سقف الفائض وتوليد مذكرة القرار ⬅️',
    step4FinishBtn: 'بدء جلسة تقييم مناقصة جديدة 🔁',

    // Clarification / Q&A Box
    qaBoxTitle: 'وضوح نموذج التقييم والقواعد التشغيلية',
    strictCappingActive: 'السقف الصارم مفعل',
    qaBoxIntro: 'تم ضبط النظام وفقاً لقاعدتك الدقيقة: أي شركة تقدم ٨ نماذج أو أكثر تحصل على الدرجة الكاملة ١٠٠٪ (سقف صارم بدون أي نقاط مكافأة إضافية لمنع تضخيم الدرجات). فيما يلي القواعد الأربع الأساسية المعتمدة:',
    collapseDetails: 'طي التفاصيل',
    viewClarifications: 'عرض القواعد والتوضيحات الـ ٤',
    q1Title: 'كيف يتم احتساب الدرجات الجزئية عند تقديم أقل من المطلوب؟',
    q1Answer: 'تقييم خطي نسبي (معياري)',
    q1Explanation: 'على سبيل المثال: إذا كان المطلوب ٨ نماذج كشف خارجي وقدمت الشركة (أ) ٦ نماذج فقط، تحصل على ٦ ÷ ٨ = ٧٥٪ من درجة هذا البند. وإذا قدمت ٨ أو ١٠ نماذج، تحصل بالضبط على ١٠٠٪ (سقف صارم بدون بونص).',
    q2Title: 'كيف يتم تقييم نسبة التحمل والخصم (حيث تكون النسبة الأقل أفضل)؟',
    q2Answer: 'تقييم السقف العكسي مع سقف ١٠٠٪',
    q2Explanation: 'إذا كان الحد الأقصى المطلوب للتحمل ١٥٪، وقدمت الشركة (أ) نسبة ١٠٪ (أفضل للعميل)، تحصل على الدرجة الكاملة ١٠٠٪ (مقفولة بدون بونص). وإذا قدمت الشركة (ب) نسبة ٢٠٪ (أسوأ)، تخصم درجتها بمقدار الزيادة.',
    q3Title: 'كيف يتم التعامل مع الشروط الإلزامية غير القابلة للتفاوض؟',
    q3Answer: 'فلتر الالتزام الإلزامي',
    q3Explanation: 'إذا أخفقت أي شركة في شرط إلزامي (مثل درجة شبكة المستشفيات أو الإخلاء الطبي الطارئ)، يتم تمييزها فوراً بأنها "غير مطابقة للمواصفات" لتفادي التعاقد مع عرض غير صالح.',
    q4Title: 'هل ترغب في مقارنة القسط السنوي الإجمالي مقابل جودة التغطية؟',
    q4Answer: 'معامل كفاءة القيمة مقابل السعر (النقاط لكل ١٠٠٠ دولار)',
    q4Explanation: 'تقوم لوحة التحكم تلقائياً بحساب مؤشر الكفاءة (درجة جودة المنافع ÷ القسط السنوي) لإبراز الشركة التي تقدم أعلى فائدة حقيقية لكل دولار دون دفع مبالغ لمزايا وهمية.',

    // Requirements Manager
    reqManagerTitle: 'تحديد منافع ومواصفات المناقصة التأمينية',
    reqManagerSubtitle: 'حدد بدقة مستويات التغطية، عدد النماذج، الحدود المالية، ودرجات شبكات المستشفيات المطلوبة لمؤسستك.',
    totalRequiredBenefits: 'منافع محددة',
    addRequirementBtn: 'إضافة منفعة مطلوبة',
    aiRfpParserBtn: 'استخراج المواصفات بالذكاء الاصطناعي',
    excelAndConditionsBinderBtn: 'رفع المنافع من إكسل وربط الشروط والسقوف (AI)',
    downloadExcelTemplateBtn: 'تحميل نموذج إكسل جاهز (.xlsx)',
    searchFilterPlaceholder: 'البحث باسم المنفعة، الفئة، أو وحدة القياس...',
    allCategories: 'جميع الفئات',
    mandatoryOnly: 'الشروط الإلزامية فقط',
    addRequirementModalTitle: 'إضافة شرط منفعة جديد',
    editRequirementModalTitle: 'تعديل شرط المنفعة',
    benefitNameLabel: 'اسم المنفعة / التغطية',
    categoryLabel: 'فئة التغطية',
    targetValueLabel: 'القيمة / الحد المطلوب',
    unitLabel: 'وحدة القياس',
    evaluationTypeLabel: 'قاعدة القياس والسقف',
    priorityWeightLabel: 'وزن الأهمية (من ١ إلى ٥)',
    mandatoryCheckboxLabel: 'شرط إلزامي غير قابل للتفاوض (عدم توفره يجعل العرض غير مطابق)',
    descriptionLabel: 'ملاحظات ومواصفات المناقصة',
    saveRequirement: 'حفظ المنفعة',
    cancel: 'إلغاء',
    deleteRequirement: 'حذف',
    editRequirement: 'تعديل',
    targetNeeded: 'الحد المطلوب',
    weight: 'الوزن',
    mandatory: 'إلزامي',
    optional: 'اختياري',
    typeNumericMin: 'حد أدنى (مساوٍ أو أعلى: سقف ١٠٠٪ بدون بونص)',
    typeNumericMax: 'حد أقصى (مساوٍ أو أقل: سقف ١٠٠٪)',
    typeBoolean: 'نعم / لا (مشمول = ١٠٠٪)',
    typeTier: 'درجة شبكة المستشفيات',
    typeQualitative: 'مواصفة نوعية / نصية',
    priorityCritical: 'أولوية قصوى (وزن ٥)',
    priorityHigh: 'أولوية عالية (وزن ٤)',
    priorityMedium: 'أولوية متوسطة (وزن ٣)',
    priorityLow: 'أولوية منخفضة (وزن ١-٢)',
    aiExtractRfpTitle: 'قارئ ومحلل وثائق المناقصات بالذكاء الاصطناعي',
    aiExtractRfpSubtitle: 'ارفع ملف أو الصق شروط ومواصفات التأمين الحالية، وسيقوم Gemini AI باستخراج البنود والمنافع تلقائياً.',
    aiExtractRfpPastePlaceholder: 'الصق نصوص الشروط أو جداول المنافع هنا...',
    extractWithAi: 'استخراج المنافع بواسطة AI',
    extracting: 'جاري التحليل والاستخراج بواسطة Gemini AI...',

    // Proposals Manager
    proposalsManagerTitle: 'عروض شركات التأمين ورفع الملفات',
    proposalsManagerSubtitle: 'ارفع وقارن عروض أي عدد من شركات التأمين بدون حد أقصى. يربط الذكاء الاصطناعي التغطيات بالمنافع المطلوبة تلقائياً مع تطبيق السقف الصارم.',
    proposalsUploadedCount: 'عروض مرفوعة',
    propManagerTitle: 'عروض شركات التأمين ورفع الملفات',
    propManagerSubtitle: 'ارفع وقارن عروض أي عدد من شركات التأمين بدون حد أقصى. يربط الذكاء الاصطناعي التغطيات بالمنافع المطلوبة تلقائياً مع تطبيق السقف الصارم.',
    uploadedProposalsCount: 'عروض مرفوعة',
    pasteQuoteBtn: 'لصق نص / عرض سعر',
    pasteOfferBtn: 'لصق نص / عرض سعر',
    reloadDemoBtn: 'تحميل عينة شركات جاهزة للمعاينة',
    loadDemoInsurersBtn: 'تحميل عينة شركات جاهزة للمعاينة',
    calculateRankingsBtn: 'احتساب الترتيب والنتائج',
    dropOfferFiles: 'اسحب وأفلت ملفات عروض التأمين هنا أو تصفح (عدد غير محدود)',
    dropOfferFilesSubtitle: 'ارفع أي عدد من ملفات العروض معاً (PDF، صور، وورد، إكسل). يقرأ الذكاء الاصطناعي الحدود والنسب والتغطيات تلقائياً.',
    dropOfferSub: 'ارفع أي عدد من ملفات العروض معاً (PDF، صور، وورد، إكسل). يقرأ الذكاء الاصطناعي الحدود والنسب والتغطيات تلقائياً.',
    proposalsTab: 'العروض',
    uploadedInsurers: 'شركات التأمين المرفوعة',
    clickToInspect: 'انقر لمعاينة التفاصيل',
    matchedCount: 'بند مطابق',
    annualPremium: 'القسط السنوي الإجمالي (لكامل العقد والمنافع)',
    premiumAnnual: 'القسط السنوي الإجمالي (لكامل العقد والمنافع)',
    totalAnnualContractPremium: 'القسط السنوي الإجمالي (لكامل العقد والمنافع مجتمعة)',
    annualPremiumExplanation: 'المبلغ المالي الإجمالي المطلوب من شركة التأمين لتغطية كامل العطاء وجميع المنافع المشمولة لكافة المشتركين (وليس لمنفعة فردية معينة).',
    annualPremiumPerMemberCalc: 'حاسبة: قسط الفرد × عدد المشتركين',
    perMemberRate: 'قسط الفرد السنوي',
    subscribersCount: 'عدد المشتركين / المؤمن عليهم',
    applyCalculatedTotal: 'تطبيق كقسط سنوي إجمالي',
    currency: 'دولار ($)',
    networkTier: 'درجة الشبكة',
    strictCappingReminder: 'تتم مقارنة القيم المدخلة هنا بالقيم المستهدفة. تقديم قيمة أعلى من المطلوب يمنح ١٠٠٪ كحد أقصى (سقف صارم بدون أي نقاط إضافية).',
    capRuleShortNotice: 'السقف الصارم: تجاوز المتطلبات يمنح ١٠٠٪ (صفر مكافأة للتضخيم).',
    benefitOffersMapping: 'مطابقة منافع العرض',
    covered: 'مشمول',
    coveredStatus: 'مشمول',
    included100: 'مشمول بالكامل (١٠٠٪)',
    conditional50: 'مشروط / جزئي (٥٠٪)',
    excluded0: 'مستثنى (٠٪)',
    additionalPerks: 'مزايا إضافية غير مطلوبة (مجانية)',
    unrequestedPerksTitle: 'مزايا إضافية غير مطلوبة (مجانية)',
    noProposalSelected: 'لم يتم اختيار عرض. انقر على شركة تأمين من القائمة لمعاينة التفاصيل.',
    pasteModalTitle: 'لصق عرض سعر شركة التأمين',
    pasteModalSubtitle: 'الصق نص العرض أو الرسالة الإلكترونية. سيقوم الذكاء الاصطناعي بمطابقة التغطيات مع متطلباتك.',
    pasteOfferTitle: 'لصق عرض سعر شركة التأمين',
    pasteOfferSubtitle: 'الصق نص العرض أو الرسالة الإلكترونية. سيقوم الذكاء الاصطناعي بمطابقة التغطيات مع متطلباتك.',
    companyNameOptional: 'اسم شركة التأمين (اختياري)',
    companyNameLabel: 'اسم شركة التأمين (اختياري)',
    proposalContentSchedule: 'محتوى العرض / جدول المنافع والتغطيات',
    extractProposal: 'استخراج العرض وتحليله',
    extractOfferBtn: 'استخراج العرض بواسطة AI',
    offeredByCompany: 'المعروض من الشركة',

    // Rankings Dashboard
    topRecommendation: 'العرض الأفضل والفائز بالمركز الأول (#1)',
    topRecommended: 'العرض الأفضل والفائز بالمركز الأول (#1)',
    strictNoBonusApplied: 'تم تطبيق السقف الصارم بدون مكافأة فائض',
    overallMatch: 'نسبة مطابقة المنافع',
    championSubtitle: 'الخطة: {planName} • حقق نسبة مطابقة {score}٪ عبر {count} منفعة محددة مع التزام تام بالشروط.',
    totalQualityScore: 'درجة الجودة الإجمالية',
    valueEfficiency: 'كفاءة القيمة / السعر',
    rankingsLeaderboardTitle: 'لوحة ترتيب وتقييم عروض التأمين',
    leaderboardTitle: 'لوحة ترتيب وتقييم عروض التأمين',
    offersEvaluated: 'عروض تم تقييمها',
    rank1st: 'الخيار الأفضل',
    rankWord: 'المركز',
    rankNum: 'المركز #{rank}',
    topChoice: 'الخيار الأفضل',
    compliant: 'مطابق للمواصفات',
    nonCompliant: 'غير مطابق للمواصفات',
    conditionallyCompliant: 'مطابق مع ملاحظات طفيفة',
    confirmedCompliance: 'التوافق المتأكد منه',
    confirmedMetBenefits: 'المنافع المطابقة المؤكدة',
    confirmedComplianceBasisNotice: 'الترتيب معتمد بشكل رئيسي وأولوي على نسبة التوافق المتأكد منه (المطابقة ١٠٠٪)',
    overallScoreLabel: 'الدرجة الموزونة الإجمالية',
    editPremium: 'تعديل',
    requirementMatch: 'نسبة مطابقة المنافع',
    noBonusCappedCount: 'بنود فائضة تم سقفها',
    cappedSurplus: 'بنود فائضة مسقوفة',
    benefitsWord: 'منافع',
    allRequirementsSatisfied: 'جميع المتطلبات مستوفاة بالكامل',
    sensitivitySimulatorTitle: 'تحليل الحساسية: ضبط أوزان أهمية الفئات',
    sensitivitySimulatorSubtitle: 'جرب كيف يؤثر تفضيل العيادات الخارجية مقابل الإقامة بالمستشفى أو الولادة على تغيير الشركة الفائزة.',
    sensitivityTitle: 'تحليل الحساسية: ضبط أوزان أهمية الفئات',
    sensitivitySubtitle: 'جرب كيف يؤثر تفضيل العيادات الخارجية مقابل الإقامة بالمستشفى أو الولادة على تغيير الشركة الفائزة.',
    adjustWeights: 'تعديل الأوزان',
    hideSimulator: 'إخفاء المحاكي',
    matrixComparisonTitle: 'مصفوفة المقارنة المباشرة جنباً إلى جنب',
    matrixComparisonSubtitle: 'قارن القيم المستهدفة بما قدمته كل شركة. لاحظ أن المزايا الفائضة (مثل تقديم ١٠ نماذج بدلاً من ٨) مقفولة تماماً عند ١٠٠٪ دون تضخيم النتيجة.',
    sideBySideMatrixTitle: 'مصفوفة المقارنة المباشرة جنباً إلى جنب',
    sideBySideMatrixSubtitle: 'قارن القيم المستهدفة بما قدمته كل شركة. لاحظ أن المزايا الفائضة (مثل تقديم ١٠ نماذج بدلاً من ٨) مقفولة تماماً عند ١٠٠٪ دون تضخيم النتيجة.',
    filterGapsOnly: 'تصفية الفروقات / النواقص',
    showingGapsOnly: 'عرض النواقص فقط',
    requiredBenefitAndTarget: 'المنفعة المطلوبة والقيمة المستهدفة',
    reqBenefitTargetCol: 'المنفعة المطلوبة والقيمة المستهدفة',
    capped100: '١٠٠٪ (سقف الفائض)',
    meets100: '١٠٠٪ (مطابق تماماً)',
    status100Capped: '١٠٠٪ (سقف الفائض)',
    status100Meets: '١٠٠٪ (مطابق تماماً)',
    statusPartial: 'جزئي',
    status0Excluded: '٠٪ (مستثنى)',
    evaluationRationale: 'مبررات التقييم',
    evalRationale: 'مبررات التقييم:',
    noBonusEnforcedTitle: 'تطبيق قاعدة منع المكافأة',
    noBonusEnforcedDesc: 'قدمت شركة التأمين قيمة فائضة لهذا البند. تم قفل النتيجة عند ١٠٠٪ لحماية مناقصتك من الانحياز للمزايا غير المطلوبة.',
    noBonusEnforcedNotice: 'تطبيق قاعدة منع المكافأة: قدمت شركة التأمين قيمة فائضة لهذا البند. تم قفل النتيجة عند ١٠٠٪ لحماية مناقصتك من الانحياز للمزايا غير المطلوبة.',
    close: 'إغلاق',

    // Cap Audit Inspector
    capAuditTitle: 'تدقيق تضخيم المزايا والالتزام بسقف الفائض',
    capAuditSubtitle: 'في مناقصات التأمين، غالباً ما تعرض الشركات كميات إضافية لم تطلبها (مثل تقديم ١٠ أو ١٢ نموذج كشف بينما تحتاج ٨ فقط) لتبرير أسعار أعلى. يضمن محركنا أن تقديم ٨ أو أكثر يمنح بالضبط ١٠٠٪ مع صفر نقاط إضافية للمزايا الفائضة.',
    capAuditDescription: 'في مناقصات التأمين، غالباً ما تعرض الشركات كميات إضافية لم تطلبها (مثل تقديم ١٠ أو ١٢ نموذج كشف بينما تحتاج ٨ فقط) لتبرير أسعار أعلى. يضمن محركنا أن تقديم ٨ أو أكثر يمنح بالضبط ١٠٠٪ مع صفر نقاط إضافية للمزايا الفائضة.',
    active100Cap: 'السقف الصارم مفعل',
    fairCappedScore: 'النتيجة العادلة (مع السقف)',
    skewedUncapped: 'النتيجة لو تم التضخيم (بدون سقف):',
    ifSkewedUncapped: 'النتيجة لو تم التضخيم (بدون سقف)',
    excessFeaturesCapped: 'المزايا الفائضة المحيدة:',
    zeroSurplusFeatures: 'لا توجد مزايا فائضة غير مطلوبة.',
    cappedExcessCount: 'المزايا الفائضة المحيدة',
    skewNeutralized: 'تم تحييد تضخيم بنسبة +{skew}٪',
    neutralizedInflation: 'تم تحييد تضخيم النتيجة',
    zeroExcess: 'لا توجد مزايا فائضة غير مطلوبة.',
    surplusNeutralizationLog: 'سجل تحييد المنافع الفائضة',
    surplusNeutralizationSubtitle: 'كل بند منفعة قدمت فيه شركة التأمين أكثر من احتياجك الفعلي، وتم قفله بصرامة عند درجة ١٠٠٪ الكاملة.',
    neutralizationLogTitle: 'سجل تحييد المنافع الفائضة',
    neutralizationLogSubtitle: 'كل بند منفعة قدمت فيه شركة التأمين أكثر من احتياجك الفعلي، وتم قفله بصرامة عند درجة ١٠٠٪ الكاملة.',
    insuranceCompany: 'شركة التأمين',
    benefitRequirement: 'بند المنفعة المطلوب',
    yourTargetNeed: 'احتياجك المستهدف',
    companyOffered: 'المعروض من الشركة',
    surplusUnsolicited: 'الفائض غير المطلوب',
    scoreAwarded: 'الدرجة الممنوحة',
    zeroBonusGiven: 'بدون بونص إضافي',
    strictlyCapped: 'سقف صارم',
    colInsuranceCompany: 'شركة التأمين',
    colBenefitReq: 'بند المنفعة المطلوب',
    colTargetNeed: 'احتياجك المستهدف',
    colOffered: 'المعروض من الشركة',
    colSurplus: 'الفائض غير المطلوب',
    colScoreAwarded: 'الدرجة الممنوحة',
    aiProcurementMemoTitle: 'مذكرة المفاوضات والقرار التنفيذي بالذكاء الاصطناعي',
    aiProcurementMemoSubtitle: 'توليد نقاط تفاوض واستراتيجية تعاقدية مخصصة استناداً لنتائج هذه المناقصة.',
    aiMemoTitle: 'مذكرة المفاوضات والقرار التنفيذي بالذكاء الاصطناعي',
    aiMemoSubtitle: 'توليد نقاط تفاوض واستراتيجية تعاقدية مخصصة استناداً لنتائج هذه المناقصة.',
    generateDecisionMemo: 'توليد مذكرة القرار والتفاوض',
    generateMemoBtn: 'توليد مذكرة القرار والتفاوض',
    generatingAdvice: 'جاري توليد الاستراتيجية والتوصيات...',
    procurementExecutiveStrategy: 'استراتيجية المشتريات والتفاوض التنفيذي',
    strategyHeading: 'استراتيجية المشتريات والتفاوض التنفيذي',

    // Export Report Modal
    exportReportModalTitle: 'تصدير تقرير تدقيق التقييم والمقارنة',
    exportReportModalSubtitle: 'تنزيل جداول المقارنة الكاملة أو طباعة ملخص تنفيذي للمسؤولين.',
    exportTitle: 'تصدير تقرير تدقيق التقييم والمقارنة',
    exportSubtitle: 'تنزيل جداول المقارنة الكاملة أو طباعة ملخص تنفيذي للمسؤولين.',
    exportOverviewTitle: 'ملخص جلسة التقييم',
    companiesCount: 'شركات تأمين',
    cappingPolicyCardTitle: 'معيار التقييم',
    csvExport: 'جدول بيانات (CSV / Excel)',
    csvDesc: 'مصفوفة البيانات الكاملة جنباً إلى جنب للاستخدام في Excel',
    pdfSummary: 'طباعة / حفظ PDF',
    pdfDesc: 'ملخص تنفيذي منسق لتوقيع أصحاب المصلحة والإدارة',
    jsonExport: 'ملف الجلسة الخام (JSON)',
    jsonDesc: 'نسخة احتياطية للبيانات يمكن إعادة تحميلها في أي وقت',
    exportCsvTitle: 'جدول بيانات (CSV / Excel)',
    exportCsvDesc: 'مصفوفة البيانات الكاملة جنباً إلى جنب للاستخدام في Excel',
    exportPrintTitle: 'طباعة / حفظ PDF',
    exportPrintDesc: 'ملخص تنفيذي منسق لتوقيع أصحاب المصلحة والإدارة',
    exportJsonTitle: 'ملف الجلسة الخام (JSON)',
    exportJsonDesc: 'نسخة احتياطية للبيانات يمكن إعادة تحميلها في أي وقت',
    evaluatedInsurersCount: 'شركات التأمين المقيمة:',
    definedRequirementsCount: 'المنافع والمتطلبات المحددة:',
    winningProposal: 'العرض الفائز بالمركز الأول:',
    evaluationStandard: 'معيار التقييم:',
    done: 'تم',

    // Footer
    footerTagline: 'مقيّم عروض التأمين — تقييم موضوعي للمناقصات ومطابقة دقيقة للمنافع.',
    footerCapRule: 'السقف الصارم: مطابقة أو تجاوز الحد المطلوب يمنح ١٠٠٪ (بدون مكافأة للمزايا الفائضة)'
  }
};
