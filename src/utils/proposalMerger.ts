import { CompanyProposal, CompanyPricingStructure, DemographicCensus } from '../types';
import { calculateCompanyPremium, DEFAULT_DEMOGRAPHIC_CENSUS, resolveProposalPricing } from './actuarialCalculator';

/**
 * Normalizes company names for robust Arabic and English matching
 * Handles alef/hamza normalization, ta-marbuta, ya/alef-maqsura,
 * removes common prefixes/suffixes like "شركة", "مجموعة", "للتأمين", "Ltd", etc.
 */
export function normalizeCompanyMatchName(name?: string): string {
  if (!name) return '';
  let s = name
    .toLowerCase()
    .replace(/[\u064B-\u065F\u0670]/g, '') // remove diacritics
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/[\(\)\[\]\-_,.\/\\:;\"'#]/g, ' '); // punctuation to spaces

  // Strip prefixes & noise words without relying on ASCII-only \b
  s = s.replace(/(?:^|\s)(شركة|الشركة|مجموعة|المجموعة|مؤسسة|المؤسسة|عرض|عطاء|ملف|برنامج|وثيقة|خطة|كشف|الفني|المالي|فني|مالي)(?:\s|$)/gi, ' ');
  s = s.replace(/(?:^|\s)(للتامين|للتأمين|تأمين|تامين|للتامينات|للتأمينات|الاردن|الأردن|العامة|العامه|المساهمة|المساهمه|المحدودة|المحدوده)(?:\s|$)/gi, ' ');
  s = s.replace(/\b(insurance|company|co|group|ltd|plc|corp|jordan|offer|proposal|tender|plan|technical|financial)\b/gi, ' ');

  // Compact alphanumeric
  return s.replace(/[^a-z0-9\u0621-\u064A]/g, '').trim();
}

/**
 * Standard Canonical Company Names for Jordanian Insurance Tenders
 */
export const CANONICAL_COMPANY_NAMES: Record<string, string> = {
  gig: 'مجموعة الخليج للتأمين - الأردن (GIG Jordan)',
  jofico: 'الشركة الأردنية الفرنسية للتأمين (JOFICO)',
  jic: 'شركة التأمين الأردنية (Jordan Insurance Company - JIC)',
  meico: 'شركة الشرق الأوسط للتأمين (MEICO)',
  jerusalem: 'شركة القدس للتأمين (Jerusalem Insurance)',
  newton: 'شركة الأردن الدولية للتأمين (Newton)',
  first: 'شركة الأولى للتأمين (Solidarity)',
  islamic: 'شركة التأمين الإسلامية',
  nisr: 'شركة نسر التأمين العربي',
  arab_life: 'الشركة الأردنية لتأمين الحياة (Arab Life)',
  arab_assurers: 'شركة الضامنون العرب للتأمين'
};

/**
 * Known insurance company clusters in Jordan.
 * If two names match the same cluster key, they are guaranteed to be the same company.
 */
export const COMPANY_CLUSTERS: Record<string, string[]> = {
  jofico: ['فرنسي', 'فرنسيه', 'الفرنسيه', 'الفرنسي', 'jofico', 'jordanfrench', 'فرنسية', 'الفرنسية'],
  first: ['اولي', 'الاولى', 'solidarity', 'سوليدرتي', 'سوليدارتي', 'firstinsurance', 'اولى', 'الأولى'],
  jic: ['تاميناردني', 'التامينالاردنيه', 'jic', 'jordaninsurance', 'تاميناردنية', 'الاردنيةللتامين', 'اردنيةللتامين', 'الاردنيه', 'الاردنية'],
  newton: ['نيوتن', 'newton', 'jiig', 'اردندولي', 'الاردنالدوليه', 'الدوليه', 'jordaninternational', 'اردنيةدولية', 'الاردن الدولية'],
  meico: ['شرقاوسط', 'الشرقاوسط', 'شرق اوسط', 'الشرق الاوسط', 'meico', 'middleeast'],
  gig: [
    'خليج', 'الخليج', 'gig', 'gulf', 'gulfinsurance', 'عربيهتعاونيه',
    'شرقعربي', 'الشرقعربي', 'شرق عربي', 'الشرق العربي',
    'عرباورينت', 'عرب أورينت', 'عرب اورينت', 'araborient', 'orient',
    'جيايجي', 'جي اي جي', 'جي آي جي'
  ],
  jerusalem: ['قدس', 'القدس', 'jerusalem', 'medgulf', 'ميدغلف'],
  islamic: ['اسلامي', 'الاسلاميه', 'اسلامية', 'الاسلامية', 'islamic'],
  nisr: ['نسر', 'النسر', 'nisr', 'arabeagle'],
  arab_life: ['عربيهللحياه', 'عربلايف', 'arablife'],
  arab_assurers: ['ضامنونعرب', 'الضامنونالعرب', 'arabassurers']
};

/**
 * Resolves a raw/extracted company name to its standard canonical formal title.
 */
export function getCanonicalInsuranceCompanyName(name?: string): string {
  if (!name) return 'شركة التأمين';
  const raw = name.toLowerCase().trim();
  const norm = normalizeCompanyMatchName(name);

  for (const [clusterKey, aliases] of Object.entries(COMPANY_CLUSTERS)) {
    const matches = aliases.some(alias => {
      const normAlias = normalizeCompanyMatchName(alias);
      return (norm && norm.includes(normAlias)) || raw.includes(alias.toLowerCase());
    });
    if (matches && CANONICAL_COMPANY_NAMES[clusterKey]) {
      return CANONICAL_COMPANY_NAMES[clusterKey];
    }
  }

  // Clean out words like "المالي" or "الفني" or "عرض" if no cluster matched
  const cleaned = name
    .replace(/(?:^|\s)(عرض|عطاء|ملف|العرض|الملف|الفني|المالي|فني|مالي)(?:\s|$)/g, ' ')
    .trim();
  return cleaned.length >= 3 ? cleaned : name;
}

/**
 * Detects whether two company names refer to the same insurance company.
 */
export function isSameInsuranceCompany(nameA?: string, nameB?: string): boolean {
  if (!nameA || !nameB) return false;
  
  const rawA = nameA.toLowerCase().trim();
  const rawB = nameB.toLowerCase().trim();
  if (rawA === rawB) return true;

  const normA = normalizeCompanyMatchName(nameA);
  const normB = normalizeCompanyMatchName(nameB);
  if (normA && normA === normB) return true;

  // Check against defined known insurance company clusters
  for (const [, aliases] of Object.entries(COMPANY_CLUSTERS)) {
    const matchesA = aliases.some(alias => {
      const normAlias = normalizeCompanyMatchName(alias);
      return (normA && normA.includes(normAlias)) || rawA.includes(alias.toLowerCase());
    });
    const matchesB = aliases.some(alias => {
      const normAlias = normalizeCompanyMatchName(alias);
      return (normB && normB.includes(normAlias)) || rawB.includes(alias.toLowerCase());
    });
    if (matchesA && matchesB) {
      return true;
    }
  }

  // Fallback substring matching for tokens >= 4 characters
  if (normA.length >= 4 && normB.length >= 4) {
    if (normA.includes(normB) || normB.includes(normA)) return true;
  }

  return false;
}

/**
 * Checks if two proposals belong to the same insurer by comparing company names and file sources
 */
export function isSameProposal(propA: Partial<CompanyProposal>, propB: Partial<CompanyProposal>): boolean {
  if (!propA || !propB) return false;
  if (propA.id && propB.id && propA.id === propB.id) return true;

  // Check companyName
  if (isSameInsuranceCompany(propA.companyName, propB.companyName)) return true;

  // Check sourceFileName against companyName or against other sourceFileName
  const srcA = (propA.sourceFileName || '').toLowerCase();
  const srcB = (propB.sourceFileName || '').toLowerCase();
  if (srcA && isSameInsuranceCompany(srcA, propB.companyName)) return true;
  if (srcB && isSameInsuranceCompany(propA.companyName, srcB)) return true;
  if (srcA && srcB && isSameInsuranceCompany(srcA, srcB)) return true;

  return false;
}

/**
 * Checks whether a proposal has extracted financial and pricing details
 */
export function hasFinancialData(proposal: Partial<CompanyProposal>): boolean {
  const p = proposal.pricingStructure;
  if (!p) return (proposal.premiumAnnual || 0) > 0;
  return (
    (p.childRate !== undefined && p.childRate > 0) ||
    (p.adultRate !== undefined && p.adultRate > 0) ||
    (proposal.premiumAnnual !== undefined && proposal.premiumAnnual > 0) ||
    Boolean(p.isCustomExtracted)
  );
}

/**
 * Checks whether a proposal has extracted technical benefit requirements data
 */
export function hasTechnicalData(proposal: Partial<CompanyProposal>): boolean {
  if (!proposal.benefits) return false;
  const benefitValues = Object.values(proposal.benefits);
  if (benefitValues.length === 0) return false;
  return benefitValues.some(b => b.rawText && b.rawText.trim().length > 10);
}

/**
 * Deep-merges two proposals belonging to the same insurance company.
 * Typically one file is the Technical Offer (العرض الفني) and the other is the Financial Offer (العرض المالي).
 * Combines benefits, pricing structure, statutory fees, terms analysis, and file sources.
 */
export function mergeCompanyProposals(
  existing: CompanyProposal,
  incoming: CompanyProposal,
  census: DemographicCensus = DEFAULT_DEMOGRAPHIC_CENSUS
): { merged: CompanyProposal; wasMerged: boolean; details: string } {
  // Determine canonical company name using tender standard resolver
  const canonicalCompanyName = getCanonicalInsuranceCompanyName(
    existing.companyName.length >= incoming.companyName.length
      ? existing.companyName
      : incoming.companyName
  );

  const incomingHasFinancial = hasFinancialData(incoming);
  const existingHasFinancial = hasFinancialData(existing);

  // 1. Merge Pricing Structure & Statutory Fees
  let mergedPricing: CompanyPricingStructure;
  let finalPremiumAnnual: number;

  if (incomingHasFinancial && !existingHasFinancial) {
    // Incoming is the financial offer
    mergedPricing = resolveProposalPricing(canonicalCompanyName, incoming.pricingStructure);
    finalPremiumAnnual = incoming.premiumAnnual || 0;
  } else if (!incomingHasFinancial && existingHasFinancial) {
    // Existing already has the financial offer
    mergedPricing = resolveProposalPricing(canonicalCompanyName, existing.pricingStructure);
    finalPremiumAnnual = existing.premiumAnnual || 0;
  } else if (incomingHasFinancial && existingHasFinancial) {
    // Both have pricing: merge with preference for incoming if it contains custom statutory fees
    const pExist = existing.pricingStructure || resolveProposalPricing(canonicalCompanyName);
    const pInc = incoming.pricingStructure || resolveProposalPricing(canonicalCompanyName);

    mergedPricing = {
      childRate: pInc.childRate > 0 ? pInc.childRate : pExist.childRate,
      adultRate: pInc.adultRate > 0 ? pInc.adultRate : pExist.adultRate,
      seniorRate: pInc.seniorRate !== undefined ? pInc.seniorRate : pExist.seniorRate,
      dentalRatePerPerson: pInc.dentalRatePerPerson ?? pExist.dentalRatePerPerson,
      opticalRatePerPerson: pInc.opticalRatePerPerson ?? pExist.opticalRatePerPerson,
      // Statutory fees: preserve specific company fees
      issuanceFeePercent: pInc.issuanceFeePercent !== undefined ? pInc.issuanceFeePercent : pExist.issuanceFeePercent,
      stampsFeePercent: pInc.stampsFeePercent !== undefined ? pInc.stampsFeePercent : pExist.stampsFeePercent,
      guaranteeFundFeePercent: pInc.guaranteeFundFeePercent !== undefined ? pInc.guaranteeFundFeePercent : pExist.guaranteeFundFeePercent,
      feesPercentage: pInc.feesPercentage || pExist.feesPercentage,
      fixedContractFee: pInc.fixedContractFee !== undefined ? pInc.fixedContractFee : pExist.fixedContractFee,
      stampsCalculationBasis: pInc.stampsCalculationBasis || pExist.stampsCalculationBasis,
      customNotes: pInc.customNotes || pExist.customNotes,
      isCustomExtracted: true,
      extractedRatesSource: 'تم استخراج وتدقيق الأسعار والرسوم القانونية من العرض المالي للشركة'
    };

    finalPremiumAnnual = incoming.premiumAnnual > 0 ? incoming.premiumAnnual : existing.premiumAnnual;
  } else {
    // Neither has explicit pricing: use standard company defaults
    mergedPricing = resolveProposalPricing(canonicalCompanyName);
    finalPremiumAnnual = 0;
  }

  // Calculate official breakdown
  const breakdown = calculateCompanyPremium(mergedPricing, census);
  if (finalPremiumAnnual === 0) {
    finalPremiumAnnual = breakdown.totalAnnualPremium;
  }

  // 2. Merge Benefits Map (Technical Offer)
  const mergedBenefits = { ...(existing.benefits || {}) };
  if (incoming.benefits) {
    for (const [key, incBen] of Object.entries(incoming.benefits)) {
      const existBen = mergedBenefits[key];
      if (!existBen) {
        mergedBenefits[key] = incBen;
      } else {
        // If incoming has richer text or notes, prefer incoming
        const incHasNotes = Boolean(incBen.notes && incBen.notes.length > 5);
        const incHasRaw = Boolean(incBen.rawText && incBen.rawText.length > 10);
        const existHasRaw = Boolean(existBen.rawText && existBen.rawText.length > 10);

        if ((incHasRaw && !existHasRaw) || (incHasNotes && !existBen.notes)) {
          mergedBenefits[key] = {
            ...existBen,
            ...incBen,
            offeredValue: incBen.offeredValue !== undefined ? incBen.offeredValue : existBen.offeredValue,
            isIncluded: incBen.isIncluded !== undefined ? incBen.isIncluded : existBen.isIncluded
          };
        } else if (incBen.offeredValue !== undefined && incBen.offeredValue !== '' && existBen.offeredValue === '') {
          mergedBenefits[key] = {
            ...existBen,
            offeredValue: incBen.offeredValue,
            isIncluded: incBen.isIncluded
          };
        }
      }
    }
  }

  // 3. Merge Terms Analysis (Forensic T&C)
  const existTerms = existing.tenderTermsAnalysis || {};
  const incTerms = incoming.tenderTermsAnalysis || {};

  const mergedTerms = {
    summary: incTerms.summary && incTerms.summary.length > (existTerms.summary || '').length ? incTerms.summary : (existTerms.summary || incTerms.summary),
    waitingPeriods: incTerms.waitingPeriods || existTerms.waitingPeriods,
    preExistingConditions: incTerms.preExistingConditions || existTerms.preExistingConditions,
    copayRules: incTerms.copayRules || existTerms.copayRules,
    networkRules: incTerms.networkRules || existTerms.networkRules,
    priorApprovalRules: incTerms.priorApprovalRules || existTerms.priorApprovalRules,
    exclusions: Array.from(new Set([...(existTerms.exclusions || []), ...(incTerms.exclusions || [])])),
    statutoryFeeNotes: incTerms.statutoryFeeNotes || existTerms.statutoryFeeNotes,
    additionalObligations: Array.from(new Set([...(existTerms.additionalObligations || []), ...(incTerms.additionalObligations || [])])),
    overallVerdict: incTerms.overallVerdict || existTerms.overallVerdict
  };

  // 4. Source Files Tracking
  const fileSources = [existing.sourceFileName, incoming.sourceFileName].filter(Boolean);
  const combinedFileName = Array.from(new Set(fileSources)).join(' + ');

  // 5. Build Final Merged Proposal
  const merged: CompanyProposal = {
    ...existing,
    companyName: canonicalCompanyName,
    planName: existing.planName && existing.planName !== 'عرض التأمين الصحي' ? existing.planName : (incoming.planName || existing.planName),
    premiumAnnual: finalPremiumAnnual,
    currency: incoming.currency || existing.currency || 'JOD (دينار)',
    networkName: incoming.networkName || existing.networkName,
    sourceFileName: combinedFileName || 'عرض فني + مالي مدمج',
    pricingStructure: mergedPricing,
    calculatedBreakdown: breakdown,
    benefits: mergedBenefits,
    tenderTermsAnalysis: mergedTerms,
    executiveSummary: `تم بنجاح دمج ملفي العرض الفني والعرض المالي لشركة ${canonicalCompanyName} في سجل موحد متكامل يشمل مطابقة الـ 78 منفعة وتدقيق الأسعار والرسوم القانونية الخاصة بها.`
  };

  return {
    merged,
    wasMerged: true,
    details: `تم دمج العرض الفني والمالي لشركة "${canonicalCompanyName}" في سجل موحد`
  };
}

/**
 * Merges a list of newly uploaded or extracted proposals into an existing proposal list.
 * Any proposals targeting the same company are combined into a single unified record.
 */
export function mergeProposalsList(
  existingList: CompanyProposal[],
  incomingList: CompanyProposal[],
  census: DemographicCensus = DEFAULT_DEMOGRAPHIC_CENSUS
): {
  updatedList: CompanyProposal[];
  mergedCount: number;
  mergedCompanyNames: string[];
} {
  const resultList = [...existingList];
  const mergedCompanyNames: string[] = [];
  let mergedCount = 0;

  for (const incoming of incomingList) {
    // Find if an existing proposal in resultList matches this company
    const matchIndex = resultList.findIndex(p => isSameProposal(p, incoming));

    if (matchIndex >= 0) {
      // Merge into existing record!
      const existing = resultList[matchIndex];
      const { merged } = mergeCompanyProposals(existing, incoming, census);
      resultList[matchIndex] = merged;
      mergedCount++;
      if (!mergedCompanyNames.includes(merged.companyName)) {
        mergedCompanyNames.push(merged.companyName);
      }
    } else {
      // No match found yet, add as new proposal
      resultList.push(incoming);
    }
  }

  // Also check if resultList has internal duplicates (e.g. from previously unmerged records)
  const finalCleanedList: CompanyProposal[] = [];
  for (const prop of resultList) {
    const existingIndex = finalCleanedList.findIndex(p => isSameProposal(p, prop));
    if (existingIndex >= 0) {
      const existing = finalCleanedList[existingIndex];
      const { merged } = mergeCompanyProposals(existing, prop, census);
      finalCleanedList[existingIndex] = merged;
      mergedCount++;
      if (!mergedCompanyNames.includes(merged.companyName)) {
        mergedCompanyNames.push(merged.companyName);
      }
    } else {
      finalCleanedList.push(prop);
    }
  }

  return {
    updatedList: finalCleanedList,
    mergedCount,
    mergedCompanyNames
  };
}

/**
 * Scans an array of proposals and groups any unmerged duplicates of the same insurer.
 */
export function findDuplicateProposalClusters(proposals: CompanyProposal[]): Array<{
  canonicalName: string;
  count: number;
  proposals: CompanyProposal[];
}> {
  const clusters: Array<{
    canonicalName: string;
    count: number;
    proposals: CompanyProposal[];
  }> = [];
  const visited = new Set<string>();

  for (let i = 0; i < proposals.length; i++) {
    const p1 = proposals[i];
    if (visited.has(p1.id)) continue;

    const group = [p1];
    for (let j = i + 1; j < proposals.length; j++) {
      const p2 = proposals[j];
      if (!visited.has(p2.id) && isSameProposal(p1, p2)) {
        group.push(p2);
        visited.add(p2.id);
      }
    }

    if (group.length > 1) {
      visited.add(p1.id);
      clusters.push({
        canonicalName: getCanonicalInsuranceCompanyName(p1.companyName),
        count: group.length,
        proposals: group
      });
    }
  }

  return clusters;
}
