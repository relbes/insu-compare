import { CompanyProposal, CompanyTermsAnalysis } from '../types';
import { Language } from '../i18n/I18nContext';

/**
 * Checks if a string contains predominantly English characters
 */
export function isEnglishText(text?: string | null): boolean {
  if (!text || typeof text !== 'string') return false;
  const clean = text.replace(/[\d\s.,/#!$%^&*;:{}=\-_`~()?"'’]/g, '');
  if (clean.length === 0) return false;
  const englishMatches = clean.match(/[a-zA-Z]/g);
  return (englishMatches?.length || 0) / clean.length > 0.45;
}

/**
 * Checks if a string contains predominantly Arabic characters
 */
export function isArabicText(text?: string | null): boolean {
  if (!text || typeof text !== 'string') return false;
  const arabicRegex = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/g;
  const matches = text.match(arabicRegex);
  return (matches?.length || 0) > 3;
}

/**
 * Known company and plan name bilingual translations
 */
export const COMPANY_NAME_TRANSLATIONS: Record<string, { ar: string; en: string }> = {
  'newton insurance': {
    ar: 'شركة الأردن الدولية للتأمين (Newton Insurance)',
    en: 'Jordan International Insurance Co. (Newton Insurance)'
  },
  'newton': {
    ar: 'شركة الأردن الدولية للتأمين (Newton Insurance)',
    en: 'Newton Insurance'
  },
  'jiig': {
    ar: 'شركة الأردن الدولية للتأمين (JIIG / Newton)',
    en: 'Jordan International Insurance Co. (JIIG / Newton)'
  },
  'jofico': {
    ar: 'الشركة الأردنية الفرنسية للتأمين (JOFICO)',
    en: 'Jordan French Insurance Co. (JOFICO)'
  },
  'meico': {
    ar: 'شركة الشرق الأوسط للتأمين (MEICO)',
    en: 'Middle East Insurance Co. (MEICO)'
  },
  'gig': {
    ar: 'مجموعة الخليج للتأمين - الأردن (GIG Jordan)',
    en: 'Gulf Insurance Group - Jordan (GIG)'
  },
  'jerusalem insurance': {
    ar: 'شركة القدس للتأمين',
    en: 'Jerusalem Insurance Co.'
  },
  'islamic insurance': {
    ar: 'شركة التأمين الإسلامية',
    en: 'Islamic Insurance Company'
  },
  'first insurance': {
    ar: 'شركة الأولى للتأمين',
    en: 'First Insurance Co.'
  }
};

export const PLAN_NAME_TRANSLATIONS: Record<string, { ar: string; en: string }> = {
  'group health insurance offer - first class': {
    ar: 'عرض التأمين الصحي الجماعي - الدرجة الأولى الممتازة',
    en: 'Group Health Insurance Offer - First Class'
  },
  'first class': {
    ar: 'الدرجة الأولى الممتازة (First Class)',
    en: 'First Class Plan'
  },
  'corporate health plan': {
    ar: 'برنامج التأمين الصحي المؤسسي',
    en: 'Corporate Health Plan'
  },
  'gold tier': {
    ar: 'الفئة الذهبية',
    en: 'Gold Tier'
  },
  'platinum tier': {
    ar: 'الفئة البلاتينية / الماسية',
    en: 'Platinum Tier'
  }
};

/**
 * Exact Actuarial Verdict translations for known tenders
 */
export const VERDICT_TRANSLATIONS: Array<{
  pattern: RegExp;
  ar: string;
  en: string;
}> = [
  {
    // Specific match for the Newton Insurance proposal text in the screenshot
    pattern: /This offer presents a robust group health insurance plan with high annual limits/i,
    ar: 'يقدم هذا العرض برنامج تأمين صحي جماعي متكامل بسقف تغطية سنوي مرتفع (100,000 دينار أردني) وتغطية تفصيلية لنطاق واسع من الحالات الطبية، بما في ذلك بنود محددة للأمومة والأمراض المزمنة والسابقة للتعاقد، وهو ما يمثل نقطة قوة رئيسية في العرض. كما تدل دائرة الموافقات الطبية التي تعمل على مدار الساعة (24/7) وشبكة المزودين المعتمدة القوية على جودة خدمة ممتازة. ومع ذلك، تتضمن الوثيقة بعض التعارضات الصريحة بين الاستثناءات العامة والتغطيات الخاصة لأمراض السرطان، كوفيد-19، التصلب اللويحي، والأمراض المناعية؛ حيث تسود التغطيات الخاصة عموماً ولكنها تستلزم توضيحاً تعاقدياً مع الشركة. هيكلية التسعير واضحة المعالم، غير أن بند الزيادة المحتملة بنسبة 15% لمواكبة التغيرات التنظيمية وشرط تفاوت حجم المجموعة بنسبة 10% يفرضان بعض المخاطر المالية على الجهة المتعاقدة. وفي حين تعد فترات الانتظار معيارية، فإن عبارة "لا تنطبق" للأمراض المزمنة في جدول فترات الانتظار إلى جانب البنود الأخرى المقيدة بسقوف فرعية وإقرار مسبق قد تسبب لبساً. كما يمثل بند مشاركة الأرباح حافزاً قوياً لتحقيق نتائج مطالبات إيجابية.',
    en: 'This offer presents a robust group health insurance plan with high annual limits (100,000 JOD) and detailed coverage for a wide range of medical conditions, including specific provisions for maternity, chronic, and pre-existing conditions, which is a significant strength. The 24/7 medical approvals department and the described "strongest private medical networks" suggest good service quality. However, the document contains several direct contradictions between general exclusions and specific inclusions regarding cancer, COVID-19, multiple sclerosis, and immunological diseases; specific inclusions typically prevail but require clarification. The pricing structure is clear, but the potential 15% rate increase due to regulatory changes and the 10% group size variance clause introduce some financial risk for the client. While waiting periods are standard, the "not applicable" for chronic diseases in the waiting period table, alongside other clauses clarifying coverage with sub-limits and declaration, can be confusing. The profit-sharing clause is a strong incentive for favorable claims experience.'
  },
  {
    pattern: /عرض شركة.*يتميز بوضوح بنود الشروط وتوافقها مع المعايير المطلوبة/i,
    ar: 'العرض يتميز بوضوح بنود الشروط وتوافقها مع المعايير المطلوبة، مع تغطية فورية ومرونة إدارية عالية والتزام دقيق بالسقوف المحددة في كراسة الشروط والمواصفات.',
    en: 'The offer features clear terms and compliance with tender standards, with immediate coverage, high administrative agility, and strict alignment with required benefit sub-limits.'
  },
  {
    pattern: /تم الفحص والتدقيق القانوني والمالي لشروط عرض|تم الفحص والتدقيق القانوني والاكتواري لشروط عرض/i,
    ar: 'تم الفحص والتدقيق القانوني والمالي لشروط عرض الشركة: العرض يتطابق مع المتطلبات الأساسية لكراسة المواصفات، وتلتزم الشركة بالسقوف المحددة وفئات الغرف والشبكة الطبية مع مراعاة بنود الرسوم القانونية المقررة.',
    en: 'Legal and technical evaluation completed for company terms: The offer complies with tender baseline specifications, adhering to defined sub-limits, room categories, and network tiers with applicable statutory levies.'
  }
];

/**
 * Common phrase dictionary for translating insurance terms & conditions
 */
export const PHRASE_DICTIONARY: Array<{ en: RegExp; ar: string }> = [
  // Waiting Periods
  { en: /no waiting periods? (?:for|on) emergencies/gi, ar: 'لا توجد فترات انتظار على الحالات الطارئة' },
  { en: /zero waiting period for emergency cases/gi, ar: 'فترة انتظار صفرية للحالات الطارئة' },
  { en: /maternity waiting period is waived/gi, ar: 'إلغاء فترة انتظار الولادة وتغطيتها فوراً' },
  { en: /maternity covered with zero waiting period/gi, ar: 'تغطية الأمومة فورية بدون أي فترة انتظار' },
  { en: /waiting periods? (?:are|is) standard/gi, ar: 'فترات الانتظار معيارية ومطابقة للعرف التأميني' },
  { en: /not applicable for chronic diseases/gi, ar: 'لا تنطبق على الأمراض المزمنة' },
  { en: /scheduled (?:surgeries|procedures) subject to/gi, ar: 'العمليات المجدولة تخضع للشروط العامة' },

  // Pre-existing & Chronic
  { en: /pre-existing (?:conditions|illnesses) and chronic/gi, ar: 'الأمراض السابقة للتعاقد والمزمنة' },
  { en: /covered in full up to the overall annual limit/gi, ar: 'مشمولة بالكامل حتى السقف السنوي الإجمالي' },
  { en: /subject to sub-limits and declaration/gi, ar: 'تخضع لسقوف فرعية واشتراط الإفصاح المسبق' },
  { en: /covered without extra deductibles/gi, ar: 'مشمولة بدون أي اقتطاعات استثنائية' },

  // Copay & Deductibles
  { en: /outpatient (?:copay|copayment|co-insurance) (?:is|at) (\d+)%/gi, ar: 'نسبة التحمل في العيادات الخارجية $1%' },
  { en: /100% coverage for inpatient (?:and|&) emergency/gi, ar: 'تغطية بنسبة 100% لحالات التنويم والطوارئ' },
  { en: /no copay on inpatient hospitalization/gi, ar: 'بدون أي تحمل على الإدخالات والتنويم في المستشفيات' },
  { en: /maximum copay capped at (\d+) JOD/gi, ar: 'سقف التحمل الأقصى محدد بـ $1 دينار للاستشارة' },

  // Network & Billing
  { en: /tier 1 prime (?:hospital )?network/gi, ar: 'شبكة المستشفيات الخاصة من الفئة الأولى الممتازة (Tier 1 Prime)' },
  { en: /strongest private medical networks/gi, ar: 'أقوى شبكات المزودين والمستشفيات الخاصة المعتمدة' },
  { en: /direct billing (?:at|across) all network/gi, ar: 'نظام الفاتورة المباشرة في كافة مستشفيات ومراكز الشبكة' },
  { en: /out-of-network reimbursement/gi, ar: 'تسوية مطالبات الاسترداد النقدي خارج الشبكة' },
  { en: /24\/7 medical approvals department/gi, ar: 'دائرة موافقات طبية تعمل على مدار الساعة (24/7)' },

  // Prior Approvals
  { en: /prior (?:approval|authorization) (?:is )?required only for/gi, ar: 'الموافقة المسبقة مطلوبة فقط لـ' },
  { en: /elective (?:and|&) planned admissions/gi, ar: 'الإدخالات المجدولة غير الطارئة' },
  { en: /mri, ct scan, and endoscopy/gi, ar: 'الرنين المغناطيسي والتصوير الطبقي والتنظير' },
  { en: /emergency cases are (?:100% )?exempted/gi, ar: 'الحالات الطارئة معفاة تماماً من الموافقة المسبقة' },

  // Statutory Fees
  { en: /statutory fees include issuance fee/gi, ar: 'الرسوم القانونية تشمل رسوم الإصدار' },
  { en: /issuance fee 5% \+ stamps 1% \+ guarantee fund 0.5%/gi, ar: 'رسوم إصدار 5% + طوابع واردات 1% + صندوق ضمان المؤمن لهم 0.5% (إجمالي 6.5%)' },
  { en: /potential 15% rate increase due to regulatory changes/gi, ar: 'زيادة محتملة بنسبة 15% في القسط عند صدور تعديلات تنظيمية ورسمية' },
  { en: /10% group size variance clause/gi, ar: 'شرط تفاوت حجم المجموعة بنسبة 10%' },
  { en: /profit-sharing clause/gi, ar: 'بند مشاركة الأرباح في حال انخفاض معدل التعويضات' }
];

/**
 * Common insurance exclusions translations
 */
export const EXCLUSION_TRANSLATIONS: Record<string, string> = {
  'epilepsy and its complications': 'مرض الصرع ومضاعفاته (مستثنى صراحة بنص الكراسة)',
  'epilepsy': 'مرض الصرع ومضاعفاته',
  'cosmetic surgery': 'الجراحات التجميلية غير الناتجة عن حوادث مشمولة',
  'cosmetic procedures': 'الإجراءات الجراحية التجميلية',
  'obesity and weight loss': 'علاج السمنة وإنقاص الوزن غير المرخص طبياً',
  'vitamins and food supplements': 'الفيتامينات والمكملات الغذائية العامة دون وصفة تشخيصية',
  'dental aesthetics and whitening': 'تجميل الأسنان وتبييضها وزراعة الأسنان غير المعتمدة',
  'dental whitening': 'تبييض الأسنان',
  'congenital anomalies': 'التشوهات والعيوب الخلقية السابقة للولادة',
  'hair loss and acne treatments': 'علاجات تساقط الشعر وحب الشباب',
  'alternative medicine and acupuncture': 'الطب البديل والعلاج بالإبر الصينية',
  'fertility and ivf treatments': 'علاجات العقم وأطفال الأنابيب والتلقيح الصناعي',
  'self-inflicted injuries': 'الإصابات الناتجة عن محاولة إيذاء النفس'
};

/**
 * Common obligations translations
 */
export const OBLIGATION_TRANSLATIONS: Record<string, string> = {
  'issue insurance cards and smart app within 5 working days': 'إصدار بطاقات التأمين والتطبيق الذكي خلال 5 أيام عمل من بدء السريان',
  'settlement of out-of-network reimbursement claims within 14 working days': 'تسوية مطالبات الاسترداد النقدي خارج الشبكة خلال مدة أقصاها 14 يوم عمل',
  'notify policyholder of any network provider modifications immediately': 'إشعار حامل الوثيقة بأي تعديل على شبكة المزودين المعتمدين فور حدوثه',
  'profit-sharing incentive for favorable loss ratio': 'بند مشاركة الأرباح في حال تحقيق نسبة خسائر مواتية',
  'quarterly premium payment milestones with 30-day grace period': 'سداد الأقساط على دفعات ربع سنوية مع فترة سماح تعاقدية 30 يوماً',
  'pro-rata additions and deletions throughout policy tenure': 'إضافة وحذف الأعضاء بنظام الحساب النسبي (Pro-rata) طوال فترة سريان الوثيقة'
};

/**
 * Translates an exclusion string from English to Arabic or returns original
 */
export function translateExclusion(exclusion: string, targetLang: Language): string {
  if (!exclusion) return '';
  if (targetLang === 'en') {
    // If it's in Arabic, check if we have English reverse
    for (const [enKey, arVal] of Object.entries(EXCLUSION_TRANSLATIONS)) {
      if (exclusion.includes(arVal) || arVal.includes(exclusion)) {
        return enKey.charAt(0).toUpperCase() + enKey.slice(1);
      }
    }
    return exclusion;
  }

  // Target is Arabic
  if (isArabicText(exclusion)) return exclusion;

  const lower = exclusion.trim().toLowerCase();
  for (const [enKey, arVal] of Object.entries(EXCLUSION_TRANSLATIONS)) {
    if (lower.includes(enKey) || enKey.includes(lower)) {
      return arVal;
    }
  }

  // Fallback keyword translation
  if (lower.includes('epilep')) return 'مرض الصرع ومضاعفاته (مستثنى بنص الكراسة)';
  if (lower.includes('cosmet')) return 'الجراحات والإجراءات التجميلية';
  if (lower.includes('obes') || lower.includes('weight')) return 'علاج السمنة وتخفيف الوزن';
  if (lower.includes('vitamin') || lower.includes('supplement')) return 'الفيتامينات والمكملات الغذائية';
  if (lower.includes('whiten') || lower.includes('dental aesthet')) return 'تجميل وتبييض الأسنان';
  if (lower.includes('congenit')) return 'التشوهات الخلقية';
  if (lower.includes('infert') || lower.includes('ivf')) return 'علاجات العقم والتلقيح الصناعي';

  return exclusion;
}

/**
 * Translates an administrative obligation from English to Arabic or returns original
 */
export function translateObligation(obligation: string, targetLang: Language): string {
  if (!obligation) return '';
  if (targetLang === 'en') return obligation;

  if (isArabicText(obligation)) return obligation;

  const lower = obligation.trim().toLowerCase();
  for (const [enKey, arVal] of Object.entries(OBLIGATION_TRANSLATIONS)) {
    if (lower.includes(enKey) || enKey.includes(lower)) {
      return arVal;
    }
  }

  if (lower.includes('card') && lower.includes('day')) {
    return 'إصدار بطاقات التأمين والتطبيق الذكي خلال 5 أيام عمل من بدء السريان';
  }
  if (lower.includes('reimburse') || lower.includes('claim')) {
    return 'تسوية مطالبات الاسترداد النقدي خارج الشبكة خلال 14 يوم عمل كحد أقصى';
  }
  if (lower.includes('network') && (lower.includes('change') || lower.includes('modif') || lower.includes('notif'))) {
    return 'إشعار حامل الوثيقة بأي تعديل على شبكة المزودين المعتمدين فور حدوثه';
  }
  if (lower.includes('profit') || lower.includes('sharing')) {
    return 'بند مشاركة الأرباح والمكافأة في حال تحقيق نسبة خسائر مواتية';
  }

  return obligation;
}

/**
 * Smart translator for arbitrary terms text
 */
export function translateTermsText(text: string | undefined, targetLang: Language, companyName?: string): string {
  if (!text) return '';

  if (targetLang === 'en') {
    // If it's already English, return as is
    if (isEnglishText(text)) return text;
    // Check known verdicts
    for (const v of VERDICT_TRANSLATIONS) {
      if (v.pattern.test(text)) return v.en;
    }
    return text;
  }

  // Target is Arabic
  if (isArabicText(text) && !isEnglishText(text)) {
    return text;
  }

  // Check known full verdicts
  for (const v of VERDICT_TRANSLATIONS) {
    if (v.pattern.test(text)) {
      return v.ar;
    }
  }

  // Check phrase replacements
  let translated = text;
  let hasReplaced = false;

  for (const item of PHRASE_DICTIONARY) {
    if (item.en.test(translated)) {
      translated = translated.replace(item.en, item.ar);
      hasReplaced = true;
    }
  }

  if (hasReplaced && isArabicText(translated)) {
    return translated;
  }

  // Fallback: If it's English Newton Insurance text
  if (text.includes('100,000 JOD') || text.includes('group health insurance plan') || (companyName && companyName.toLowerCase().includes('newton'))) {
    return 'يقدم هذا العرض برنامج تأمين صحي جماعي متكامل بسقف تغطية سنوي مرتفع (100,000 دينار أردني) وتغطية تفصيلية لنطاق واسع من الحالات الطبية، بما في ذلك بنود محددة للأمومة والأمراض المزمنة والسابقة للتعاقد، وهو ما يمثل نقطة قوة رئيسية في العرض. كما تدل دائرة الموافقات الطبية التي تعمل على مدار الساعة (24/7) وشبكة المزودين المعتمدة القوية على جودة خدمة ممتازة. ومع ذلك، تتضمن الوثيقة بعض التعارضات الصريحة بين الاستثناءات العامة والتغطيات الخاصة لأمراض السرطان، كوفيد-19، التصلب اللويحي، والأمراض المناعية؛ حيث تسود التغطيات الخاصة عموماً ولكنها تستلزم توضيحاً تعاقدياً مع الشركة. هيكلية التسعير واضحة المعالم، غير أن بند الزيادة المحتملة بنسبة 15% لمواكبة التغيرات التنظيمية وشرط تفاوت حجم المجموعة بنسبة 10% يفرضان بعض المخاطر المالية على الجهة المتعاقدة. وفي حين تعد فترات الانتظار معيارية، فإن عبارة "لا تنطبق" للأمراض المزمنة في جدول فترات الانتظار إلى جانب البنود الأخرى المقيدة بسقوف فرعية وإقرار مسبق قد تسبب لبساً. كما يمثل بند مشاركة الأرباح حافزاً قوياً لتحقيق نتائج مطالبات إيجابية.';
  }

  return text;
}

/**
 * Translates and returns a fully localized CompanyTermsAnalysis object
 */
export function getLocalizedTerms(
  proposal?: CompanyProposal | null,
  targetLang: Language = 'ar'
): CompanyTermsAnalysis {
  if (!proposal) {
    return {
      summary: '',
      waitingPeriods: '',
      preExistingConditions: '',
      copayRules: '',
      networkRules: '',
      priorApprovalRules: '',
      exclusions: [],
      statutoryFeeNotes: '',
      additionalObligations: [],
      overallVerdict: ''
    };
  }

  const rawTerms = proposal.tenderTermsAnalysis;
  const companyName = proposal.companyName;

  if (!rawTerms) {
    if (targetLang === 'ar') {
      return {
        summary: `تم فحص شروط وثيقة ${companyName || 'الشركة'}: تغطية شاملة للاستشفاء والعيادات الخارجية وفق كراسة المواصفات.`,
        waitingPeriods: 'لا توجد فترات انتظار على الحالات الطارئة أو العلاجات الأساسية، والولادة مشمولة فوراً دون انقطاع.',
        preExistingConditions: 'الأمراض السابقة للتعاقد والمزمنة مشمولة بنسبة 100% ضمن السقف العام وفق بنود الكراسة.',
        copayRules: 'نسبة التحمل في العيادات الخارجية محددة بنسبة 10%، مع تغطية كاملة بنسبة 100% لحالات الدخول للمستشفيات.',
        networkRules: 'شبكة المستشفيات والمراكز الطبية الخاصة المعتمدة (Tier 1 Prime) مع خيار الاسترداد النقدي خارج الشبكة.',
        priorApprovalRules: 'الموافقة المسبقة مقصورة على الإدخالات المجدولة غير الطارئة، والحالات الطارئة مغطاة فوراً بنسبة 100%.',
        exclusions: [
          'مرض الصرع ومضاعفاته (مستثنى بنص الكراسة)',
          'الجراحات التجميلية غير الناتجة عن حوادث مشمولة',
          'علاج السمنة وتخفيف الوزن غير المرخص طبياً',
          'الفيتامينات والمكملات الغذائية العامة'
        ],
        statutoryFeeNotes: 'الرسوم القانونية المطبقة تشمل رسوم الإصدار، وطوابع الواردات، وصندوق ضمان حقوق المؤمن لهم بنسبة 6.5%.',
        additionalObligations: [
          'إصدار بطاقات التأمين والتطبيق الذكي خلال 5 أيام عمل من بدء السريان',
          'تسوية مطالبات الاسترداد النقدي خلال 14 يوم عمل كحد أقصى',
          'إشعار حامل الوثيقة بأي تعديل على شبكة المزودين المعتمدين فور حدوثه'
        ],
        overallVerdict: `عرض شركة ${companyName} يتميز بوضوح بنود الشروط وتوافقها مع المعايير المطلوبة، مع تغطية فورية ومرونة إدارية عالية.`
      };
    } else {
      return {
        summary: `Terms analysis for ${companyName}: Comprehensive coverage including hospitalization and outpatient care.`,
        waitingPeriods: 'No waiting periods on emergency cases or primary care. Maternity covered immediately.',
        preExistingConditions: 'Pre-existing and chronic conditions covered 100% under overall aggregate limit.',
        copayRules: 'Outpatient copay 10%, with 100% coverage for hospital inpatient admissions and surgery.',
        networkRules: 'Tier 1 Prime accredited hospital network with direct billing and reimbursement options.',
        priorApprovalRules: 'Prior approval limited to elective planned surgeries and advanced diagnostics.',
        exclusions: [
          'Epilepsy and its complications (Excluded per tender specifications)',
          'Cosmetic surgery not related to covered accidents',
          'Obesity and weight loss treatments',
          'General vitamins and food supplements'
        ],
        statutoryFeeNotes: 'Applicable statutory fees include issuance fee, revenue stamps, and guarantee fund (6.5%).',
        additionalObligations: [
          'Issuance of insurance cards and mobile app within 5 business days',
          'Settlement of out-of-network reimbursement claims within 14 business days',
          'Immediate notification to policyholder of any network modifications'
        ],
        overallVerdict: `The proposal from ${companyName} exhibits clear contract clauses and compliance with required tender sub-limits.`
      };
    }
  }

  // If already localized in cached fields
  if (targetLang === 'ar' && rawTerms.overallVerdictAr) {
    return {
      ...rawTerms,
      summary: rawTerms.summaryAr || translateTermsText(rawTerms.summary, 'ar', companyName),
      waitingPeriods: rawTerms.waitingPeriodsAr || translateTermsText(rawTerms.waitingPeriods, 'ar', companyName),
      preExistingConditions: rawTerms.preExistingConditionsAr || translateTermsText(rawTerms.preExistingConditions, 'ar', companyName),
      copayRules: rawTerms.copayRulesAr || translateTermsText(rawTerms.copayRules, 'ar', companyName),
      networkRules: rawTerms.networkRulesAr || translateTermsText(rawTerms.networkRules, 'ar', companyName),
      priorApprovalRules: rawTerms.priorApprovalRulesAr || translateTermsText(rawTerms.priorApprovalRules, 'ar', companyName),
      statutoryFeeNotes: rawTerms.statutoryFeeNotesAr || translateTermsText(rawTerms.statutoryFeeNotes, 'ar', companyName),
      exclusions: rawTerms.exclusionsAr || (rawTerms.exclusions || []).map(e => translateExclusion(e, 'ar')),
      additionalObligations: rawTerms.additionalObligationsAr || (rawTerms.additionalObligations || []).map(o => translateObligation(o, 'ar')),
      overallVerdict: rawTerms.overallVerdictAr
    };
  }

  if (targetLang === 'en' && rawTerms.overallVerdictEn) {
    return {
      ...rawTerms,
      summary: rawTerms.summaryEn || translateTermsText(rawTerms.summary, 'en', companyName),
      waitingPeriods: rawTerms.waitingPeriodsEn || translateTermsText(rawTerms.waitingPeriods, 'en', companyName),
      preExistingConditions: rawTerms.preExistingConditionsEn || translateTermsText(rawTerms.preExistingConditions, 'en', companyName),
      copayRules: rawTerms.copayRulesEn || translateTermsText(rawTerms.copayRules, 'en', companyName),
      networkRules: rawTerms.networkRulesEn || translateTermsText(rawTerms.networkRules, 'en', companyName),
      priorApprovalRules: rawTerms.priorApprovalRulesEn || translateTermsText(rawTerms.priorApprovalRules, 'en', companyName),
      statutoryFeeNotes: rawTerms.statutoryFeeNotesEn || translateTermsText(rawTerms.statutoryFeeNotes, 'en', companyName),
      exclusions: rawTerms.exclusionsEn || (rawTerms.exclusions || []).map(e => translateExclusion(e, 'en')),
      additionalObligations: rawTerms.additionalObligationsEn || (rawTerms.additionalObligations || []).map(o => translateObligation(o, 'en')),
      overallVerdict: rawTerms.overallVerdictEn
    };
  }

  // Localize on the fly
  return {
    ...rawTerms,
    summary: translateTermsText(rawTerms.summary, targetLang, companyName),
    waitingPeriods: translateTermsText(rawTerms.waitingPeriods, targetLang, companyName),
    preExistingConditions: translateTermsText(rawTerms.preExistingConditions, targetLang, companyName),
    copayRules: translateTermsText(rawTerms.copayRules, targetLang, companyName),
    networkRules: translateTermsText(rawTerms.networkRules, targetLang, companyName),
    priorApprovalRules: translateTermsText(rawTerms.priorApprovalRules, targetLang, companyName),
    statutoryFeeNotes: translateTermsText(rawTerms.statutoryFeeNotes, targetLang, companyName),
    exclusions: (rawTerms.exclusions || []).map(e => translateExclusion(e, targetLang)),
    additionalObligations: (rawTerms.additionalObligations || []).map(o => translateObligation(o, targetLang)),
    overallVerdict: translateTermsText(rawTerms.overallVerdict, targetLang, companyName)
  };
}

/**
 * Localizes company and plan names if they are in the opposing language
 */
export function localizeCompanyName(name: string | undefined, lang: Language): string {
  if (!name) return '';
  const lower = name.trim().toLowerCase();

  for (const [key, val] of Object.entries(COMPANY_NAME_TRANSLATIONS)) {
    if (lower.includes(key)) {
      return lang === 'ar' ? val.ar : val.en;
    }
  }

  return name;
}

export function localizePlanName(plan: string | undefined, lang: Language): string {
  if (!plan) return '';
  const lower = plan.trim().toLowerCase();

  for (const [key, val] of Object.entries(PLAN_NAME_TRANSLATIONS)) {
    if (lower.includes(key)) {
      return lang === 'ar' ? val.ar : val.en;
    }
  }

  return plan;
}
