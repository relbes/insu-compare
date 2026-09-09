import {
  BenefitMatchEvaluation,
  BenefitRequirement,
  CategoryScoreSummary,
  CompanyProposal,
  ProposalEvaluationResult
} from '../types';
import { Language } from '../i18n/translations';

/**
 * Normalizes any numeric value, handling numbers, strings with commas (100,000),
 * dots as thousands separators (100.000 = 100,000, 12.000 = 12,000),
 * Arabic thousands words ("100 ألف", "12 ألف"), percentages (15%),
 * currency labels (100000 دينار / SAR), and Arabic-Indic numerals (١٠٠,٠٠٠).
 */
export function normalizeNumber(val: any): number | null {
  if (val === undefined || val === null) return null;
  if (typeof val === 'number') return isNaN(val) ? null : val;
  
  let str = String(val).trim();
  if (!str) return null;

  // Convert Arabic-Indic digits (٠-٩) to ASCII (0-9)
  str = str.replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 1632));
  // Convert Eastern Persian digits (۰-۹) to ASCII (0-9)
  str = str.replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 1776));

  // If text indicates excluded / not covered, numeric value is 0
  if (
    str.includes('غير مغطى') ||
    str.includes('غير مغطاه') ||
    str.includes('مستثنى') ||
    str.includes('غير مشمول') ||
    str.toLowerCase().includes('excluded') ||
    str.toLowerCase().includes('not covered')
  ) {
    return 0;
  }

  // If text indicates unlimited or open coverage
  if (
    str.includes('مفتوح') || 
    str.includes('غير محدود') || 
    str.includes('بدون سقف') || 
    str.toLowerCase().includes('unlimited') || 
    str.toLowerCase().includes('no limit')
  ) {
    return 999999999;
  }

  // 1. Check for thousand in words: "100 ألف", "12 ألف", "100k"
  const thousandWordMatch = str.match(/(\d+(?:[.,]\d+)?)\s*(?:ألف|الف|الاف|آلاف|k)\b/i);
  if (thousandWordMatch) {
    const base = parseFloat(thousandWordMatch[1].replace(/,/g, ''));
    if (!isNaN(base)) {
      return Math.round(base * 1000);
    }
  }

  // 2. Check for dot thousands separator: "100.000", "12.000", "150.000"
  const dotThousandMatch = str.match(/\b(\d{1,3})\.(000|\d{3})\b/);
  if (dotThousandMatch) {
    const p1 = parseInt(dotThousandMatch[1], 10);
    const p2 = parseInt(dotThousandMatch[2], 10);
    return p1 * 1000 + p2;
  }

  // 3. Remove commas
  const withoutCommas = str.replace(/,/g, '');
  // Match standard integer or decimal number
  const match = withoutCommas.match(/[-+]?\d+(?:\.\d+)?/);
  if (!match) return null;

  const parsed = parseFloat(match[0]);
  return isNaN(parsed) ? null : parsed;
}

/**
 * Checks if a value represents an open/unconstrained benefit (no rigid ceiling required)
 */
export function isUnconstrainedTarget(val: any): boolean {
  if (val === undefined || val === null || val === '') return true;
  const str = String(val).toLowerCase().trim();

  // Excluded is a strict negative condition, NOT unconstrained
  if (
    str.includes('غير مغطى') ||
    str.includes('مستثنى') ||
    str.includes('غير مشمول') ||
    str.includes('excluded') ||
    str.includes('not covered')
  ) {
    return false;
  }

  return (
    str.includes('غير محدد') ||
    str.includes('مفتوح') ||
    str.includes('غير مقيد') ||
    str.includes('بدون سقف') ||
    str.includes('open') ||
    str.includes('unconstrained') ||
    str.includes('n/a')
  );
}

/**
 * Evaluates a single insurance company proposal against the requirements checklist.
 */
export function evaluateProposal(
  proposal: CompanyProposal,
  requirements: BenefitRequirement[],
  lang: Language = 'ar'
): ProposalEvaluationResult {
  const isEn = lang === 'en';
  const benefitEvaluations: Record<string, BenefitMatchEvaluation> = {};
  const categoryMap: Record<
    string,
    { earned: number; max: number; count: number; met: number }
  > = {};

  let totalEarnedPoints = 0;
  let totalMaxPoints = 0;
  let failedMandatoryCount = 0;
  let cappedBenefitsCount = 0;
  let confirmedMetCount = 0;
  let confirmedPoints = 0;
  let partialCount = 0;
  let unmetCount = 0;
  const keyStrengths: string[] = [];
  const keyGaps: string[] = [];

  const proposalBenefits = proposal.benefits || {};

  for (const req of requirements) {
    // 1. Find matching offered benefit by ID or fuzzy name match
    let offered = proposalBenefits[req.id];
    if (!offered) {
      const lowerReqName = (req.name || '').toLowerCase().trim();
      for (const [key, bData] of Object.entries(proposalBenefits)) {
        const lowerKey = key.toLowerCase();
        if (lowerKey === lowerReqName || lowerKey.includes(lowerReqName) || lowerReqName.includes(lowerKey)) {
          offered = bData;
          break;
        }
      }
    }

    const weight = req.weight || 1;
    totalMaxPoints += weight;

    // Initialize category aggregation
    const categoryKey = req.category || (isEn ? 'General' : 'عام');
    if (!categoryMap[categoryKey]) {
      categoryMap[categoryKey] = { earned: 0, max: 0, count: 0, met: 0 };
    }
    categoryMap[categoryKey].max += weight;
    categoryMap[categoryKey].count += 1;

    // Check if the tender itself specified this item as excluded / not covered
    const reqIsExcludedInTender = typeof req.targetValue === 'string' && (
      req.targetValue.toLowerCase().includes('غير مغطى') ||
      req.targetValue.toLowerCase().includes('مستثنى') ||
      req.targetValue.toLowerCase().includes('excluded') ||
      req.unit === 'مستثنى'
    );

    // Check if explicitly excluded or missing in insurer's proposal
    const isExcluded = !offered || offered.isIncluded === false || (
      typeof offered.offeredValue === 'string' && (
        offered.offeredValue.toLowerCase().includes('excluded') ||
        offered.offeredValue.toLowerCase().includes('غير مشمول') ||
        offered.offeredValue.toLowerCase().includes('مستثنى') ||
        offered.offeredValue.toLowerCase().includes('غير مغطى') ||
        offered.offeredValue === 'لا'
      )
    );

    // If tender says excluded, check compliance
    if (reqIsExcludedInTender) {
      if (isExcluded) {
        // Both tender and company exclude -> 100% compliant with tender specification!
        const matchEval: BenefitMatchEvaluation = {
          requirementId: req.id,
          benefitName: req.name,
          category: req.category,
          requiredValue: req.targetValue,
          offeredValue: isEn ? 'Excluded per RFP (Not covered)' : 'مستثنى حسب نص الكراسة (غير مغطى)',
          unit: req.unit,
          type: req.type,
          weight,
          isMandatory: req.isMandatory,
          matchRatio: 1.0,
          scoreEarned: weight,
          maxScore: weight,
          scoreOutOf5: 5,
          status: 'meets_exact',
          statusLabel: isEn ? 'Compliant with RFP (Excluded)' : 'مطابق للكراسة (مستثنى)',
          isCapped: false,
          explanation: isEn 
            ? 'Compliant with tender specification which stipulated excluding this item.' 
            : 'مطابق لمواصفات الكراسة التي نصت على استثناء هذا البند وعدم تغطيته.',
          rawOfferedText: offered?.rawText
        };
        benefitEvaluations[req.id] = matchEval;
        totalEarnedPoints += weight;
        categoryMap[categoryKey].earned += weight;
        categoryMap[categoryKey].met += 1;
        continue;
      } else {
        // Tender said excluded, but company offers coverage -> bonus coverage!
        const matchEval: BenefitMatchEvaluation = {
          requirementId: req.id,
          benefitName: req.name,
          category: req.category,
          requiredValue: req.targetValue,
          offeredValue: offered.offeredValue,
          unit: req.unit,
          type: req.type,
          weight,
          isMandatory: req.isMandatory,
          matchRatio: 1.0,
          scoreEarned: weight,
          maxScore: weight,
          scoreOutOf5: 5,
          status: 'exceeds_capped',
          statusLabel: isEn ? 'Added Benefit (Covered despite RFP exclusion)' : 'ميزة إضافية (مغطى رغم استثنائه بالكراسة)',
          isCapped: false,
          explanation: isEn
            ? 'Insurer offered coverage for this item despite RFP exclusion; counted as an added benefit.'
            : 'عرضت شركة التأمين تغطية هذا البند رغم استثنائه في كراسة الشروط، وتعتبر ميزة إضافية للجهة.',
          rawOfferedText: offered?.rawText
        };
        benefitEvaluations[req.id] = matchEval;
        totalEarnedPoints += weight;
        categoryMap[categoryKey].earned += weight;
        categoryMap[categoryKey].met += 1;
        keyStrengths.push(isEn ? `${req.name}: Added bonus coverage` : `${req.name}: تغطية إضافية ميزة`);
        continue;
      }
    }

    if (isExcluded) {
      const matchEval: BenefitMatchEvaluation = {
        requirementId: req.id,
        benefitName: req.name,
        category: req.category,
        requiredValue: req.targetValue,
        offeredValue: isEn ? 'Excluded / Not covered' : 'مستثنى / غير مشمول (Excluded)',
        unit: req.unit,
        type: req.type,
        weight,
        isMandatory: req.isMandatory,
        matchRatio: 0,
        scoreEarned: 0,
        maxScore: weight,
        scoreOutOf5: 0,
        status: 'not_offered',
        statusLabel: isEn ? 'Not Offered (0%)' : 'غير مقدم (0%)',
        isCapped: false,
        explanation: isEn
          ? 'This benefit is excluded or not covered in the insurer proposal.'
          : 'هذا البند مستثنى أو غير مغطى في عرض شركة التأمين.',
        rawOfferedText: offered?.rawText
      };

      benefitEvaluations[req.id] = matchEval;
      if (req.isMandatory) {
        failedMandatoryCount++;
        keyGaps.push(isEn ? `Mandatory item excluded: ${req.name}` : `بند إلزامي مستثنى: ${req.name}`);
      } else if (weight >= 3) {
        keyGaps.push(isEn ? `High priority item not covered: ${req.name}` : `بند ذو أولوية غير مغطى: ${req.name}`);
      }
      continue;
    }

    let matchRatio = 0;
    let isCapped = false;
    let status: BenefitMatchEvaluation['status'] = 'unmet';
    let statusLabel = isEn ? 'Non-compliant' : 'غير مطابق';
    let explanation = '';

    const reqVal = req.targetValue;
    const offVal = offered.offeredValue;

    // CASE: Unconstrained / Open requirement in tender
    if (isUnconstrainedTarget(reqVal)) {
      matchRatio = 1.0;
      status = 'meets_exact';
      statusLabel = isEn ? 'Covered & Included (100%)' : 'مغطى ومشمول (100%)';
      explanation = isEn
        ? 'Open benefit included in the proposal subject to standard terms.'
        : 'منفعة مفتوحة مشمولة في العرض وفق الشروط العامة.';
      keyStrengths.push(isEn ? `${req.name}: Included` : `${req.name}: مشمول`);
    } else {
      switch (req.type) {
        case 'numeric_min': {
          const targetNum = normalizeNumber(reqVal);
          const offeredNum = normalizeNumber(offVal);

          if (targetNum === null) {
            // Target was non-numeric string, fallback to open coverage
            matchRatio = 1.0;
            status = 'meets_exact';
            statusLabel = isEn ? 'Compliant (100%)' : 'مطابق (100%)';
            explanation = isEn ? 'Benefit is fully covered.' : 'البند مغطى بالكامل.';
          } else if (offeredNum === null) {
            // Offered is non-numeric, check if text says covered
            const offStr = String(offVal).toLowerCase();
            if (offStr.includes('مغطى') || offStr.includes('مشمول') || offStr.includes('covered') || offStr.includes('included')) {
              matchRatio = 1.0;
              status = 'meets_exact';
              statusLabel = isEn ? 'Compliant (100%)' : 'مطابق (100%)';
              explanation = isEn ? 'Covered under policy terms.' : 'مشمول بالتغطية.';
            } else {
              matchRatio = 0;
              status = 'unmet';
              statusLabel = isEn ? 'Unspecified (0%)' : 'غير محدد (0%)';
              explanation = isEn
                ? 'Unable to verify numeric offer value in proposal documents.'
                : 'تعذر التحقق من القيمة الرقمية للعرض في وثيقة التأمين.';
            }
          } else if (offeredNum >= targetNum) {
            // STRICT RULE: No bonus for over-providing!
            matchRatio = 1.0;
            if (offeredNum > targetNum) {
              isCapped = true;
              cappedBenefitsCount++;
              status = 'exceeds_capped';
              statusLabel = isEn ? 'Exceeds Required (100% Capped, No Bonus)' : 'يتجاوز المطلوب (سقف 100% بدون نقاط إضافية)';
              explanation = isEn
                ? `Company offers ${offeredNum.toLocaleString()} ${req.unit} (higher than required ${targetNum.toLocaleString()} ${req.unit}). 100% cap and No-Bonus policy applied.`
                : `الشركة تقدم ${offeredNum.toLocaleString()} ${req.unit} (أعلى من المطلوب ${targetNum.toLocaleString()} ${req.unit}). تم تطبيق سقف 100% وقاعدة منع تضخيم الدرجات (No-Bonus).`;
              keyStrengths.push(isEn
                ? `${req.name}: Covers ${offeredNum.toLocaleString()} ${req.unit} (Fully met)`
                : `${req.name}: يغطي ${offeredNum.toLocaleString()} ${req.unit} (مستوفٍ بالكامل)`);
            } else {
              status = 'meets_exact';
              statusLabel = isEn ? 'Exact Match (100%)' : 'مطابق تماماً (100%)';
              explanation = isEn
                ? `Exactly matches required target (${targetNum.toLocaleString()} ${req.unit}). Full score granted.`
                : `يطابق المطلوب تماماً (${targetNum.toLocaleString()} ${req.unit}). تم منح الدرجة الكاملة.`;
              keyStrengths.push(isEn
                ? `${req.name}: Matches ${targetNum.toLocaleString()} ${req.unit}`
                : `${req.name}: مطابق ${targetNum.toLocaleString()} ${req.unit}`);
            }
          } else {
            // Below target limit
            matchRatio = Math.max(0, offeredNum / targetNum);
            const percent = Math.round(matchRatio * 100);
            status = matchRatio >= 0.6 ? 'partial' : 'unmet';
            statusLabel = isEn ? `Partial Coverage (${percent}%)` : `تغطية جزئية (${percent}%)`;
            const deficit = targetNum - offeredNum;
            explanation = isEn
              ? `Company offers ${offeredNum.toLocaleString()} ${req.unit} vs required ${targetNum.toLocaleString()} ${req.unit} (Deficit of ${deficit.toLocaleString()} ${req.unit} - match ratio ${percent}%).`
              : `الشركة تقدم ${offeredNum.toLocaleString()} ${req.unit} مقابل ${targetNum.toLocaleString()} ${req.unit} المطلوبة (عجز قدره ${deficit.toLocaleString()} ${req.unit} - نسبة مطابقة ${percent}%).`;
            keyGaps.push(isEn
              ? `${req.name}: Deficit of ${deficit.toLocaleString()} ${req.unit} (${offeredNum}/${targetNum})`
              : `${req.name}: يقل بمقدار ${deficit.toLocaleString()} ${req.unit} (${offeredNum}/${targetNum})`);
          }
          break;
        }

        case 'numeric_max': {
          // e.g. Copayment <= 15%. If offered is 10%, it's better -> 100% capped (no bonus).
          const maxThreshold = normalizeNumber(reqVal);
          const offeredNum = normalizeNumber(offVal);

          if (maxThreshold === null || offeredNum === null) {
            matchRatio = 0.5;
            status = 'partial';
            statusLabel = isEn ? 'Uncertain (50%)' : 'غير مؤكد (50%)';
            explanation = isEn ? 'Copayment percentage could not be determined accurately.' : 'لم يتم تحديد نسبة التحمل بدقة.';
          } else if (offeredNum <= maxThreshold) {
            matchRatio = 1.0;
            if (offeredNum < maxThreshold) {
              isCapped = true;
              cappedBenefitsCount++;
              status = 'exceeds_capped';
              statusLabel = isEn ? 'Better than ceiling (100% No Bonus)' : 'أفضل من الحد الأقصى (100% بدون بونص)';
              explanation = isEn
                ? `Offered copay of ${offeredNum}% is better/lower than required max ${maxThreshold}%. Evaluated at 100% with no extra points.`
                : `نسبة التحمل المقدمة ${offeredNum}% أفضل/أقل من السقف المطلوب ${maxThreshold}%. تم احتساب 100% فقط دون نقاط إضافية.`;
              keyStrengths.push(isEn
                ? `${req.name}: Better at ${offeredNum}% (max was ${maxThreshold}%)`
                : `${req.name}: أفضل عند ${offeredNum}% (الحد الأقصى ${maxThreshold}%)`);
            } else {
              status = 'meets_exact';
              statusLabel = isEn ? 'Matches ceiling (100%)' : 'مطابق للسقف (100%)';
              explanation = isEn
                ? `Exactly matches required maximum threshold of ${maxThreshold}%.`
                : `يطابق سقف التحمل المحدد ${maxThreshold}% تماماً.`;
            }
          } else {
            // Worse than max threshold (higher copay than allowed)
            const excess = offeredNum - maxThreshold;
            matchRatio = Math.max(0, 1 - excess / (maxThreshold || 1));
            const percent = Math.round(matchRatio * 100);
            status = matchRatio >= 0.5 ? 'partial' : 'unmet';
            statusLabel = isEn ? `High Copayment (${percent}%)` : `تحمل مرتفع (${percent}%)`;
            explanation = isEn
              ? `Exceeds maximum allowable copay (${maxThreshold}%) by +${excess}% (Offered: ${offeredNum}%).`
              : `يتجاوز الحد الأقصى للتحمل (${maxThreshold}%) بزيادة +${excess}% (العرض: ${offeredNum}%).`;
            keyGaps.push(isEn
              ? `${req.name}: Copay higher than required (${offeredNum}% vs max ${maxThreshold}%)`
              : `${req.name}: نسبة تحمل أعلى من المطلوب (${offeredNum}% مقابل أقصى ${maxThreshold}%)`);
          }
          break;
        }

        case 'boolean': {
          const offStr = String(offVal).toLowerCase();
          const isTrue =
            offVal === true ||
            offStr === 'true' ||
            offStr === 'yes' ||
            offStr.includes('نعم') ||
            offStr.includes('مغطى') ||
            offStr.includes('مضمن') ||
            offStr.includes('مشمول') ||
            offStr.includes('included') ||
            offStr.includes('covered');

          const isPartial =
            offStr.includes('جزئي') ||
            offStr.includes('بشروط') ||
            offStr.includes('تحمل') ||
            offStr.includes('partial') ||
            offStr.includes('conditional');

          if (isTrue) {
            matchRatio = 1.0;
            status = 'meets_exact';
            statusLabel = isEn ? 'Covered & Included (100%)' : 'مضمن ومغطى (100%)';
            explanation = isEn ? 'Benefit is fully included and covered as required.' : 'البند مشمول ومغطى بالكامل في وثيقة التأمين كما هو مطلوب.';
            keyStrengths.push(isEn ? `${req.name}: Fully covered` : `${req.name}: مغطى بالكامل`);
          } else if (isPartial) {
            matchRatio = 0.5;
            status = 'partial';
            statusLabel = isEn ? 'Conditional Coverage (50%)' : 'تغطية مشروطة (50%)';
            explanation = isEn ? 'Benefit is covered under special conditions or restrictions.' : 'البند مشمول بشروط خاصة أو قيود إضافية.';
            keyGaps.push(isEn ? `${req.name}: Partial or conditional coverage only` : `${req.name}: تغطية جزئية أو مشروطة فقط`);
          } else {
            matchRatio = 0;
            status = 'unmet';
            statusLabel = isEn ? 'Not Covered (0%)' : 'غير مغطى (0%)';
            explanation = isEn ? 'Benefit is not covered under basic policy terms.' : 'البند غير مشمول في التغطية الأساسية.';
            keyGaps.push(isEn ? `${req.name}: Not covered` : `${req.name}: غير مشمول`);
          }
          break;
        }

        case 'tier_level': {
          const reqStr = String(reqVal).toLowerCase();
          const offStr = String(offVal).toLowerCase();

          const isPrimeOffered =
            offStr.includes('tier 1') ||
            offStr.includes('prime') ||
            offStr.includes('vip') ||
            offStr.includes('platinum') ||
            offStr.includes('أولى') ||
            offStr.includes('ممتازة') ||
            offStr.includes('فئة أ') ||
            offStr.includes('class a');

          const isStandardOffered =
            offStr.includes('tier 2') ||
            offStr.includes('standard') ||
            offStr.includes('gold') ||
            offStr.includes('ثانية') ||
            offStr.includes('فئة ب') ||
            offStr.includes('class b');

          if (isPrimeOffered) {
            matchRatio = 1.0;
            if (reqStr.includes('tier 2') || reqStr.includes('ثانية') || reqStr.includes('فئة ب')) {
              isCapped = true;
              cappedBenefitsCount++;
              status = 'exceeds_capped';
              statusLabel = isEn ? 'Tier 1 Network (100% Capped, No Bonus)' : 'شبكة فئة أولى (سقف 100% بدون بونص)';
              explanation = isEn
                ? 'Offers Tier 1 Prime Network (higher than required Tier 2). Evaluated at 100% without extra points.'
                : 'يقدم شبكة الفئة الأولى الممتازة (أعلى من الفئة الثانية المطلوبة). تم التقييم بنسبة 100% دون نقاط إضافية.';
            } else {
              status = 'meets_exact';
              statusLabel = isEn ? 'Matching Network (100%)' : 'شبكة مطابقة (100%)';
              explanation = isEn
                ? `Direct billing hospital network satisfies required tier (${req.targetValue}).`
                : `الشبكة الطبية المباشرة تلبي معيار الفئة المطلوبة (${req.targetValue}).`;
            }
            keyStrengths.push(`${req.name}: ${offered.offeredValue}`);
          } else if (isStandardOffered) {
            if (reqStr.includes('tier 1') || reqStr.includes('أولى') || reqStr.includes('prime')) {
              matchRatio = 0.6;
              status = 'partial';
              statusLabel = isEn ? 'Tier 2 Network (60%)' : 'فئة ثانية (60%)';
              explanation = isEn
                ? 'Offers Tier 2 Standard network which is lower than Tier 1 Prime required in RFP.'
                : 'يقدم شبكة الفئة الثانية Standard وهي أقل من الفئة الأولى الممتازة المطلوبة في الكراسة.';
              keyGaps.push(isEn ? `${req.name}: Tier 2 network instead of Tier 1 Prime` : `${req.name}: شبكة فئة ثانية بدلاً من الفئة الأولى الممتازة`);
            } else {
              matchRatio = 1.0;
              status = 'meets_exact';
              statusLabel = isEn ? 'Matching Network (100%)' : 'شبكة مطابقة (100%)';
              explanation = isEn ? 'Hospital network satisfies required level.' : 'الشبكة الطبية تلبي المستوى المطلوب.';
            }
          } else {
            matchRatio = 0.3;
            status = 'unmet';
            statusLabel = isEn ? 'Restricted Network (30%)' : 'شبكة محدودة (30%)';
            explanation = isEn ? 'Limited provider healthcare network.' : 'شبكة طبية محدودة المراكز.';
            keyGaps.push(isEn ? `${req.name}: Restricted network` : `${req.name}: شبكة محدودة`);
          }
          break;
        }

        case 'qualitative':
        default: {
          const reqStr = String(reqVal).toLowerCase().trim();
          const offStr = String(offVal).toLowerCase().trim();

          if (offStr === reqStr || offStr.includes(reqStr) || reqStr.includes(offStr)) {
            matchRatio = 1.0;
            status = 'meets_exact';
            statusLabel = isEn ? 'Matching Specification (100%)' : 'مطابق للمواصفة (100%)';
            explanation = isEn ? `Matches required specification "${req.targetValue}".` : `يطابق المواصفة المطلوبة "${req.targetValue}".`;
            keyStrengths.push(`${req.name}: ${offered.offeredValue}`);
          } else if (
            (reqStr.includes('single') || reqStr.includes('مفردة')) &&
            (offStr.includes('suite') || offStr.includes('جناح') || offStr.includes('deluxe') || offStr.includes('vip'))
          ) {
            matchRatio = 1.0;
            isCapped = true;
            cappedBenefitsCount++;
            status = 'exceeds_capped';
            statusLabel = isEn ? 'Exceeds Specification (100% Capped)' : 'يتجاوز المواصفة (سقف 100% بدون بونص)';
            explanation = isEn
              ? `Offers higher tier (${offered.offeredValue}) than required single room. Capped at 100% with no bonus.`
              : `يقدم فئة أعلى (${offered.offeredValue}) مقارنة بالغرفة المفردة المطلوبة. تم الاحتساب بسقف 100% بدون بونص.`;
          } else if (
            (reqStr.includes('single') || reqStr.includes('مفردة') || reqStr.includes('خاصة')) &&
            (offStr.includes('semi-private') || offStr.includes('مشتركة') || offStr.includes('مزدوجة') || offStr.includes('شبه خاصة'))
          ) {
            matchRatio = 0.5;
            status = 'partial';
            statusLabel = isEn ? 'Shared Room (50%)' : 'غرفة مشتركة (50%)';
            explanation = isEn
              ? 'Offers shared/double room instead of required private single room.'
              : 'يقدم غرفة مشتركة/مزدوجة بدلاً من الغرفة المفردة الخاصة المطلوبة.';
            keyGaps.push(isEn ? `${req.name}: Shared room instead of private single` : `${req.name}: غرفة مشتركة بدلاً من مفردة خاصة`);
          } else {
            matchRatio = 0.5;
            status = 'partial';
            statusLabel = isEn ? 'Partial Match (50%)' : 'مطابقة جزئية (50%)';
            explanation = isEn
              ? `Offered: "${offered.offeredValue}" vs required "${req.targetValue}".`
              : `العرض: "${offered.offeredValue}" مقابل المطلوب "${req.targetValue}".`;
          }
          break;
        }
      }
    }

    const scoreEarned = matchRatio * weight;
    totalEarnedPoints += scoreEarned;

    categoryMap[categoryKey].earned += scoreEarned;
    if (matchRatio >= 0.99) {
      categoryMap[categoryKey].met += 1;
      confirmedMetCount += 1;
      confirmedPoints += scoreEarned;
    } else if (status === 'partial') {
      partialCount += 1;
    } else {
      unmetCount += 1;
    }

    if (req.isMandatory && (isExcluded || matchRatio < 0.5)) {
      failedMandatoryCount++;
    }

    const scoreOutOf5 = Math.min(5.0, Math.round(matchRatio * 5.0 * 100) / 100);

    benefitEvaluations[req.id] = {
      requirementId: req.id,
      benefitName: req.name,
      category: req.category,
      requiredValue: req.targetValue,
      offeredValue: offered.offeredValue,
      unit: req.unit,
      type: req.type,
      weight,
      isMandatory: req.isMandatory,
      matchRatio,
      scoreEarned: Math.round(scoreEarned * 100) / 100,
      maxScore: weight,
      scoreOutOf5,
      status,
      statusLabel,
      isCapped,
      explanation,
      rawOfferedText: offered.rawText
    };
  }

  const totalScore = totalMaxPoints > 0 ? (totalEarnedPoints / totalMaxPoints) * 100 : 0;
  const roundedTotalScore = Math.round(totalScore * 10) / 10;
  const averageScoreOutOf5 = Math.round((roundedTotalScore / 100) * 5.0 * 100) / 100;
  const confirmedMatchPercentage = totalMaxPoints > 0
    ? Math.round((confirmedPoints / totalMaxPoints) * 1000) / 10
    : 0;

  // Category scores
  const categoryScores: Record<string, CategoryScoreSummary> = {};
  for (const [category, data] of Object.entries(categoryMap)) {
    const percentage = data.max > 0 ? Math.round((data.earned / data.max) * 100) : 0;
    categoryScores[category] = {
      category,
      earnedPoints: Math.round(data.earned * 10) / 10,
      maxPoints: data.max,
      percentage,
      benefitsCount: data.count,
      metCount: data.met
    };
  }

  // Value for Money Ratio (Score per 1000 currency units of premium)
  const premiumNum = normalizeNumber(proposal.premiumAnnual) || 10000;
  const premiumInThousands = premiumNum / 1000;
  const valueForMoneyRatio =
    premiumInThousands > 0 ? Math.round((roundedTotalScore / premiumInThousands) * 100) / 100 : 0;

  // Real tender compliance level:
  // - High confirmed match (>=85% or >=80% with no critical exclusions): Fully Compliant
  // - Good match (>=70%): Minor Gaps / Conditionally Compliant
  // - Only severe deficiency (<70% or multiple critical exclusions): Non Compliant
  let complianceLevel: ProposalEvaluationResult['complianceLevel'] = 'fully_compliant';
  let mandatorySatisfied = true;

  if (failedMandatoryCount > 2 || roundedTotalScore < 70) {
    complianceLevel = 'non_compliant';
    mandatorySatisfied = false;
  } else if (failedMandatoryCount > 0 || roundedTotalScore < 85) {
    complianceLevel = 'minor_gaps';
    mandatorySatisfied = true;
  } else {
    complianceLevel = 'fully_compliant';
    mandatorySatisfied = true;
  }

  return {
    proposalId: proposal.id,
    companyName: proposal.companyName,
    planName: proposal.planName,
    premiumAnnual: proposal.premiumAnnual,
    currency: proposal.currency || 'SAR (ريال)',
    totalScore: roundedTotalScore,
    averageScoreOutOf5,
    totalEarnedPoints: Math.round(totalEarnedPoints * 10) / 10,
    totalMaxPoints,
    mandatorySatisfied,
    failedMandatoryCount,
    confirmedMetCount,
    confirmedPoints: Math.round(confirmedPoints * 10) / 10,
    confirmedMatchPercentage,
    partialCount,
    unmetCount,
    totalRequirementsCount: requirements.length,
    complianceLevel,
    benefitEvaluations,
    categoryScores,
    cappedBenefitsCount,
    rank: 1, // Will be calculated after evaluating all proposals
    valueForMoneyRatio,
    keyStrengths: keyStrengths.slice(0, 4),
    keyGaps: keyGaps.slice(0, 4)
  };
}

export function rankAllProposals(
  proposals: CompanyProposal[],
  requirements: BenefitRequirement[],
  lang: Language = 'ar'
): ProposalEvaluationResult[] {
  const evaluated = proposals.map((p) => evaluateProposal(p, requirements, lang));

  // Sort strictly by Confirmed Compliance (التوافق المتأكد منه):
  // 1. Confirmed Match Score / Confirmed Percentage (نسبة التوافق المتأكد منه) descending
  // 2. Confirmed Met Benefits Count (عدد المنافع المطابقة المؤكدة) descending
  // 3. Overall Total Score descending
  // 4. In case of identical technical match, sort by lower annual premium
  evaluated.sort((a, b) => {
    // 1. Primary: Confirmed match percentage (التوافق المتأكد منه)
    if (b.confirmedMatchPercentage !== a.confirmedMatchPercentage) {
      return b.confirmedMatchPercentage - a.confirmedMatchPercentage;
    }
    // 2. Count of confirmed met benefits
    if (b.confirmedMetCount !== a.confirmedMetCount) {
      return b.confirmedMetCount - a.confirmedMetCount;
    }
    // 3. Overall total score
    if (b.totalScore !== a.totalScore) {
      return b.totalScore - a.totalScore;
    }
    // 4. Financial offer / lower premium if technical is identical
    const premA = normalizeNumber(a.premiumAnnual) || 0;
    const premB = normalizeNumber(b.premiumAnnual) || 0;
    return premA - premB;
  });

  // Assign ranks
  return evaluated.map((res, idx) => ({
    ...res,
    rank: idx + 1
  }));
}

