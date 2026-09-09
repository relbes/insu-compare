import * as XLSX from 'xlsx';
import { BenefitRequirement, BenefitEvaluationType, PriorityLevel } from '../types';

export interface ParsedExcelBenefit {
  id?: string;
  category: string;
  name: string;
  targetValue?: any;
  unit?: string;
  type?: BenefitEvaluationType;
  weight?: number;
  priority?: PriorityLevel;
  isMandatory?: boolean;
  description?: string;
  hasExplicitValue?: boolean;
}

/**
 * Normalizes Arabic string for robust fuzzy comparison:
 * - Removes diacritics / tashkeel
 * - Normalizes Alef forms (أ, إ, آ -> ا)
 * - Normalizes Taa Marbuta (ة -> ه)
 * - Normalizes Yaa (ى -> ي)
 * - Normalizes spaces around 'و' (e.g. "المنافع و التغطيات" -> "المنافع والتغطيات")
 * - Trims and lowercases
 */
export function normalizeArabic(text: string): string {
  if (!text) return '';
  return text
    .trim()
    .toLowerCase()
    .replace(/[\u064B-\u065F\u0670]/g, '') // Remove tashkeel
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/\s*و\s+/g, ' و') // Normalize conjunction 'wa'
    .replace(/[_\-\/\\:;,\.\|]+/g, ' ') // Replace punctuation with space
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Checks if a string represents a Document/Table Title Banner
 */
export function isTitleBanner(rawText: string): boolean {
  if (!rawText) return false;
  const norm = normalizeArabic(rawText);

  const titlePatterns = [
    'مقارنه عقود التامين',
    'مقارنه عروض التامين',
    'مقارنه شركات التامين',
    'مقارنه التامين الطبي',
    'جدول مقارنه عروض التامين',
    'كراسه الشروط والمواصفات',
    'جدول بنود التامين',
    'جدول المنافع',
    'وثيقه التامين الطبي',
    'insurance comparison',
    'tender comparison'
  ];

  return titlePatterns.some(tp => norm.includes(tp) && norm.length < 80);
}

/**
 * Checks if a cell is a Row Number / Sequence / Header word
 */
export function isNoiseOrHeaderRow(rawText: string): boolean {
  if (!rawText) return true;
  const rawTrimmed = rawText.trim();
  const norm = normalizeArabic(rawTrimmed);

  // Pure digits, bullets, or punctuation markers
  if (/^[\d٠-٩\s\.\-•\(\)\[\]#*:ـ_]+$/.test(rawTrimmed)) return true;

  // Ordinal step markers
  if (/^(اولا|ثانيا|ثالثا|رابعا|خامسا|سادسا|سابعا|ثامنا|تاسعا|عاشرا)[:.]?$/.test(norm)) return true;
  if (/^(ا|ب|ج|د|هـ|و|ز|ح)[:.]?$/.test(norm)) return true;

  // Header column labels
  const headerLabels = [
    'م', 'رقم', 'الرقم', 'تسلسل', 'التسلسل', '#', 'no', 'seq', 'item', 'code',
    'اسم المنفعه', 'المنفعه', 'المنافع', 'اسم البند', 'البند', 'البنود', 'البيان', 'التغطيه', 'التغطيات', 'نوع التغطيه',
    'benefit', 'benefit name', 'coverage', 'item name', 'description',
    'التصنيف', 'الفئه', 'القسم', 'category', 'class', 'section',
    'القيمه المطلوبه', 'القيمه المستهدفه', 'السقف', 'الحد', 'الحد الاقصي', 'target', 'target value', 'limit', 'ceiling',
    'الوحده', 'وحده القياس', 'unit',
    'النوع', 'نوع التقييم', 'type', 'rule',
    'الوزن', 'الاهميه', 'الدرجه', 'النقاط', 'weight', 'priority', 'score', 'points',
    'الزامي', 'شرط الزامي', 'mandatory', 'required',
    'الوصف', 'الملاحظات', 'الشروط', 'notes', 'details',
    'شركه التامين', 'بوبا', 'التعاونيه', 'الراجحي', 'ميدغلف', 'عرض الشركه'
  ];

  if (headerLabels.includes(norm)) return true;

  return false;
}

/**
 * Checks if a string represents a Section Header / Grouping Category
 */
export function isSectionOrCategoryHeader(rawText: string): boolean {
  if (!rawText) return false;
  const trimmed = rawText.trim();
  const norm = normalizeArabic(trimmed);

  // 1. Explicit check for contract timing headers (e.g. "حالات مزمنة بعد توقيع العقد", "حالات مزمنة قبل توقيع العقد")
  if (
    norm.includes('توقيع العقد') ||
    norm.includes('بعد توقيع') ||
    norm.includes('قبل توقيع') ||
    norm.includes('سابق لتوقيع') ||
    norm.includes('لاحق لتوقيع')
  ) {
    return true;
  }

  // 2. Structural prefixes (القسم الأول، الفصل، الباب، أولاً...)
  if (
    norm.startsWith('القسم ') ||
    norm.startsWith('قسم ') ||
    norm.startsWith('الفصل ') ||
    norm.startsWith('فصل ') ||
    norm.startsWith('الباب ') ||
    norm.startsWith('باب ') ||
    norm.startsWith('المبحث ') ||
    norm.startsWith('ملحق ') ||
    norm.startsWith('جدول رقم ') ||
    norm.startsWith('اولا:') ||
    norm.startsWith('ثانيا:') ||
    norm.startsWith('ثالثا:') ||
    norm.startsWith('رابعا:') ||
    norm.startsWith('خامسا:') ||
    norm.startsWith('سادسا:') ||
    norm.startsWith('سابعا:') ||
    norm.startsWith('ثامنا:') ||
    norm.startsWith('تاسعا:') ||
    norm.startsWith('عاشرا:')
  ) {
    return true;
  }

  // 3. Explicit category and section headers in medical insurance
  const sectionKeywords = [
    'التغطيات داخل المستشفي',
    'تغطيات داخل المستشفي',
    'التغطيات خارج المستشفي',
    'تغطيات خارج المستشفي',
    'منافع خارج المستشفي',
    'المنافع خارج المستشفي',
    'المنافع والتغطيات الاضافيه',
    'المنافع والتغطيات الإضافيه',
    'المنافع و التغطيات الاضافيه',
    'منافع وتغطيات اضافيه',
    'المنافع الاضافيه',
    'التغطيات الاضافيه',
    'المنافع الاساسيه',
    'التغطيات الاساسيه',
    'الاستثناءات الخاصه',
    'استثناءات خاصه',
    'الاستثناءات العامه',
    'استثناءات عامه',
    'استثناءات الوثيقه',
    'الاستثناءات',
    'استثناءات',
    'الحالات السابقه والمزمنه',
    'الحالات السابقه و المزمنه',
    'حالات سابقه ومزمنه',
    'الامراض المزمنه والحالات السابقه',
    'الامراض المزمنه',
    'الحالات المزمنه',
    'الشروط العامه',
    'الشروط والاحكام',
    'الشروط الخاصه',
    'المحددات العامه',
    'تغطيات التنويم',
    'تغطيات العيادات',
    'الاسنان والعيون',
    'الامومه ورعايه المواليد',
    'الشبكه الطبيه',
    'القسم الاول',
    'القسم الثاني',
    'القسم الثالث',
    'الفصل الاول',
    'الفصل الثاني',
    'الباب الاول',
    'الباب الثاني',
    'ملاحظات هامه',
    'inpatient benefits',
    'outpatient benefits',
    'additional benefits',
    'special exceptions',
    'general exceptions',
    'pre-existing and chronic conditions',
    'exclusions',
    'general terms',
    'terms and conditions'
  ];

  if (sectionKeywords.some(kw => norm === kw || norm === `قسم ${kw}` || norm === `جدول ${kw}` || norm.startsWith(`${kw}:`))) {
    return true;
  }

  // 4. Ends with colon or dash indicating category header (< 60 chars)
  if (trimmed.endsWith(':') || trimmed.endsWith(':-') || trimmed.endsWith('=')) {
    if (trimmed.length < 60) return true;
  }

  // 5. Formatting patterns of section headers
  if (
    trimmed.startsWith('---') ||
    trimmed.startsWith('===') ||
    trimmed.startsWith('***') ||
    trimmed.startsWith('###') ||
    (norm.startsWith('قسم ') && norm.length < 35) ||
    (norm.startsWith('فصل ') && norm.length < 35) ||
    (norm.startsWith('باب ') && norm.length < 35)
  ) {
    return true;
  }

  return false;
}

/**
 * Checks if a row is a Financial Quotation / Premium Row (القسط السنوي الإجمالي / العرض المالي)
 * In tender schedules, this row specifies the total policy cost for all benefits,
 * NOT an individual medical benefit requirement!
 */
export function isFinancialOrTotalPremiumRow(rawText: string): boolean {
  if (!rawText) return false;
  const norm = normalizeArabic(rawText).toLowerCase();

  return (
    norm.includes('القسط السنوي') ||
    norm.includes('قسط التامين') ||
    norm.includes('اجمالي القسط') ||
    norm.includes('القسط الاجمالي') ||
    norm.includes('العرض المالي') ||
    norm.includes('قيمه العرض') ||
    norm.includes('قسط الفرد') ||
    norm.includes('total premium') ||
    norm.includes('annual premium') ||
    norm.includes('financial offer') ||
    norm.includes('contract premium')
  );
}

export interface ParsedInsuranceValue {
  value: any;
  unit: string;
  type: BenefitEvaluationType;
  isExcluded: boolean;
  rawText: string;
}

/**
 * Robust Insurance Financial Value & Exclusion Parser
 * Handles thousands formatted with dots (100.000 = 100,000, 12.000 = 12,000),
 * Arabic thousands words ("100 ألف", "12 ألف"), Dinars / Riyals,
 * and explicit exclusions ("غير مغطى", "مستثنى").
 */
export function safeParseInsuranceValue(
  cellVal: any,
  benefitName: string = '',
  detectedCurrency: string = 'دينار'
): ParsedInsuranceValue {
  if (cellVal === undefined || cellVal === null) {
    return {
      value: 'غير محدد (يتم استخراجه من كراسة الشروط)',
      unit: '',
      type: 'numeric_min',
      isExcluded: false,
      rawText: ''
    };
  }

  let str = String(cellVal).trim();
  const rawText = str;

  // Convert Arabic-Indic & Eastern digits
  str = str.replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 1632));
  str = str.replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 1776));

  const strLower = str.toLowerCase();
  const normBenefit = normalizeArabic(benefitName);

  // 1. Check for EXCLUSIONS (غير مغطى / مستثنى)
  if (
    strLower.includes('غير مغطى') ||
    strLower.includes('غير مغطاه') ||
    strLower.includes('غير مغطاة') ||
    strLower.includes('غير مشمول') ||
    strLower.includes('غير مشموله') ||
    strLower.includes('غير مشمولة') ||
    strLower.includes('مستثنى') ||
    strLower.includes('مستثناه') ||
    strLower.includes('مستثناة') ||
    strLower.includes('لا يغطي') ||
    strLower.includes('لا تشمل') ||
    strLower.includes('لا يشمل') ||
    strLower.includes('لا تغطي') ||
    strLower.includes('excluded') ||
    strLower.includes('not covered')
  ) {
    return {
      value: 'غير مغطى (مستثنى بنص الكراسة)',
      unit: 'مستثنى',
      type: 'boolean',
      isExcluded: true,
      rawText
    };
  }

  // 2. Check for OPEN / FULL COVERAGE (مفتوح / بدون سقف)
  if (
    strLower.includes('مفتوح') ||
    strLower.includes('بدون سقف') ||
    strLower.includes('غير محدود') ||
    strLower.includes('كامل السقف') ||
    strLower.includes('سقف الوثيقة') ||
    strLower.includes('unlimited') ||
    strLower.includes('no limit')
  ) {
    return {
      value: 'مفتوح (مغطى بالكامل وفق الشروط العامة)',
      unit: 'تغطية كاملة',
      type: 'boolean',
      isExcluded: false,
      rawText
    };
  }

  // 3. Determine Currency (Dinar by default for Jordan, or Riyal / USD)
  let curr = detectedCurrency || 'دينار';
  if (strLower.includes('دينار') || strLower.includes('دنانير') || strLower.includes('jod') || strLower.includes('د.أ')) {
    curr = 'دينار';
  } else if (strLower.includes('ريال') || strLower.includes('sar') || strLower.includes('ر.س')) {
    curr = 'ريال';
  } else if (strLower.includes('دولار') || strLower.includes('usd') || strLower.includes('$')) {
    curr = 'USD';
  }

  // 4. Consultation Forms / Visits
  if (
    normBenefit.includes('كشف') ||
    normBenefit.includes('نماذج') ||
    normBenefit.includes('زيار') ||
    strLower.includes('نماذج') ||
    strLower.includes('زيارات')
  ) {
    const formMatch = str.match(/\b(\d+)\b/);
    if (formMatch) {
      const fNum = parseInt(formMatch[1], 10);
      if (fNum > 0 && fNum <= 30) {
        return {
          value: fNum,
          unit: 'نماذج كشف سنوياً',
          type: 'numeric_min',
          isExcluded: false,
          rawText
        };
      }
    }
  }

  // 5. Copay / Deductible Percentage
  if (
    normBenefit.includes('تحمل') ||
    normBenefit.includes('copay') ||
    normBenefit.includes('خصم') ||
    strLower.includes('%')
  ) {
    const pctMatch = str.match(/(\d+)%/);
    if (pctMatch) {
      return {
        value: parseInt(pctMatch[1], 10),
        unit: '%',
        type: 'numeric_max',
        isExcluded: false,
        rawText
      };
    }
  }

  // 6. Numbers with "ألف" (Thousands in words: "100 ألف", "12 ألف", "100k")
  const thousandWordMatch = str.match(/(\d+(?:[.,]\d+)?)\s*(?:ألف|الف|الاف|آلاف|k)\b/i);
  if (thousandWordMatch) {
    const baseNum = parseFloat(thousandWordMatch[1].replace(/,/g, ''));
    if (!isNaN(baseNum)) {
      const fullNum = Math.round(baseNum * 1000);
      return {
        value: fullNum,
        unit: curr,
        type: 'numeric_min',
        isExcluded: false,
        rawText
      };
    }
  }

  // 7. Dot as Thousands Separator: "100.000", "12.000", "150.000", "5.000"
  const dotThousandMatch = str.match(/\b(\d{1,3})\.(000|\d{3})\b/);
  if (dotThousandMatch) {
    const p1 = parseInt(dotThousandMatch[1], 10);
    const p2 = parseInt(dotThousandMatch[2], 10);
    const fullNum = p1 * 1000 + p2;
    return {
      value: fullNum,
      unit: curr,
      type: 'numeric_min',
      isExcluded: false,
      rawText
    };
  }

  // 8. Comma as Thousands Separator: "100,000", "12,000"
  const cleanCommas = str.replace(/,/g, '');
  const numMatch = cleanCommas.match(/[-+]?\d+(?:\.\d+)?/);
  if (numMatch) {
    let parsed = parseFloat(numMatch[0]);
    if (!isNaN(parsed)) {
      // Insurance domain safety guard:
      // "سقف التغطية التأمينية لكل شخص سنوياً" (e.g. 100 -> 100,000)
      if (
        (normBenefit.includes('سقف التغطيه') || normBenefit.includes('الحد الاقصي للتغطيه') || normBenefit.includes('التغطيه السنويه لكل شخص')) &&
        parsed >= 40 && parsed <= 500
      ) {
        parsed = parsed * 1000;
      }
      // "سقف الحالة المرضية الواحدة سنوياً" (e.g. 12 -> 12,000)
      else if (
        (normBenefit.includes('الحاله المرضيه') || normBenefit.includes('الحاله الواحده') || normBenefit.includes('سقف الحاله')) &&
        parsed >= 5 && parsed <= 50
      ) {
        parsed = parsed * 1000;
      }
      // "الأدوية" (e.g. 3 or 5 -> 3,000 or 5,000)
      else if (
        (normBenefit.includes('ادويه') || normBenefit.includes('صيدليه') || normBenefit.includes('علاجات')) &&
        parsed >= 1 && parsed <= 15
      ) {
        parsed = parsed * 1000;
      }
      // "الأسنان" (e.g. 2 or 3 -> 2,000 or 3,000)
      else if (
        normBenefit.includes('اسنان') &&
        parsed >= 1 && parsed <= 10
      ) {
        parsed = parsed * 1000;
      }

      return {
        value: parsed,
        unit: parsed > 100 ? curr : '',
        type: 'numeric_min',
        isExcluded: false,
        rawText
      };
    }
  }

  return {
    value: str,
    unit: '',
    type: 'qualitative',
    isExcluded: false,
    rawText
  };
}

/**
 * Checks if a string represents calculation, totals, formulas, or footer metadata rows
 */
export function isFooterOrSummaryRow(rawText: string): boolean {
  if (!rawText) return false;
  const norm = normalizeArabic(rawText);

  const footerKeywords = [
    'عدد بنود المقارنه',
    'العدد الاجمالي للعلامات',
    'مجموع النقاط',
    'نسبه التقييم الفني',
    'من التقييم الفني',
    'من التقييم المالي',
    'التقييم النهائي',
    'النتيجه النهائيه',
    'توقيع اللجنه',
    'اعتماد اللجنه',
    'المجموع الكلي',
    'المجموع الاجمالي',
    'total score',
    'technical evaluation',
    'financial evaluation',
    'final score',
    'committee signature'
  ];

  return footerKeywords.some(kw => norm.includes(kw));
}

/**
 * Cleans a benefit name from leading bullets, numbering, or trailing punctuation
 */
export function cleanBenefitName(name: string): string {
  if (!name) return '';
  let cleaned = name
    .replace(/^[\s\d٠-٩\.\-•\(\)\[\]#*:\/\\–—]+/, '') // Remove leading numbering/bullets
    .replace(/[:\-–—]+$/, '') // Remove trailing dashes/colons
    .trim();
  
  return cleaned || name.trim();
}

/**
 * Determines category from text content or context
 */
export function inferBenefitCategory(benefitName: string): string {
  const norm = normalizeArabic(benefitName);

  if (norm.includes('عياد') || norm.includes('كشف') || norm.includes('استشار') || norm.includes('طبيب عام') || norm.includes('نماذج') || norm.includes('outpatient')) {
    return 'العيادات الخارجية والاستشارات (Outpatient)';
  }
  if (norm.includes('سقف التغطيه') || norm.includes('الحد الاقصي') || norm.includes('السنوي') || norm.includes('تنويم') || norm.includes('اقامه') || norm.includes('مستشفي') || norm.includes('غرفه') || norm.includes('inpatient') || norm.includes('hospitalization') || norm.includes('room')) {
    return 'التنويم والمستشفيات (Hospitalization & Inpatient)';
  }
  if (norm.includes('تحمل') || norm.includes('مشاركه') || norm.includes('خصم') || norm.includes('copay') || norm.includes('deductible')) {
    return 'نسب التحمل والمشاركات المالية (Financial Deductibles)';
  }
  if (norm.includes('دواء') || norm.includes('ادويه') || norm.includes('صيدل') || norm.includes('pharmacy') || norm.includes('prescription') || norm.includes('drugs')) {
    return 'الأدوية والصيدلية (Prescription & Pharmacy)';
  }
  if (norm.includes('مزمن') || norm.includes('سابقه للتامين') || norm.includes('ضغط') || norm.includes('سكري') || norm.includes('كلي') || norm.includes('كبد') || norm.includes('قلب')) {
    return 'الأمراض المزمنة والحالات السابقة (Chronic & Pre-existing)';
  }
  if (norm.includes('عمليات') || norm.includes('جراح') || norm.includes('تخدير') || norm.includes('صمام') || norm.includes('شبكات') || norm.includes('stent') || norm.includes('منظار') || norm.includes('غده') || norm.includes('رحم') || norm.includes('دوالي') || norm.includes('بواسير') || norm.includes('ديسك') || norm.includes('انزلاق غضروفي') || norm.includes('سرطان')) {
    return 'العمليات والمنافع الجراحية الإضافية (Surgeries & Additional)';
  }
  if (norm.includes('سن') || norm.includes('اسنان') || norm.includes('لثه') || norm.includes('حشو') || norm.includes('dental') || norm.includes('teeth')) {
    return 'الأسنان واللثة (Dental Treatment)';
  }
  if (norm.includes('بصر') || norm.includes('نظار') || norm.includes('عين') || norm.includes('عيون') || norm.includes('عدس') || norm.includes('optical') || norm.includes('vision') || norm.includes('glasses')) {
    return 'البصريات والعيون (Vision & Optics)';
  }
  if (norm.includes('ولاد') || norm.includes('حمل') || norm.includes('اموم') || norm.includes('مولود') || norm.includes('مواليد') || norm.includes('maternity') || norm.includes('childbirth')) {
    return 'الأمومة ورعاية المواليد (Maternity Care)';
  }
  if (norm.includes('شبك') || norm.includes('مقدم الخدمه') || norm.includes('فئه') || norm.includes('مراكز') || norm.includes('network') || norm.includes('tier') || norm.includes('provider')) {
    return 'الشبكة الطبية والإدارة (Network & Providers)';
  }
  if (norm.includes('طوارئ') || norm.includes('اسعاف') || norm.includes('عنايه مركزه') || norm.includes('حرجه') || norm.includes('emergency') || norm.includes('icu') || norm.includes('ambulance')) {
    return 'الطوارئ والعناية المركزة (Emergency & ICU)';
  }
  if (norm.includes('مخبر') || norm.includes('تحليل') || norm.includes('فحص') || norm.includes('اشعه') || norm.includes('رنين') || norm.includes('ماموجرام') || norm.includes('lab') || norm.includes('x-ray') || norm.includes('radiology')) {
    return 'الفحوصات والأشعة والمختبر (Diagnostics & Labs)';
  }
  if (norm.includes('طبيعي') || norm.includes('تاهيل') || norm.includes('فيزيائي') || norm.includes('physiotherapy') || norm.includes('rehab')) {
    return 'العلاج الطبيعي والتأهيل (Physical Therapy)';
  }
  if (norm.includes('عن بعد') || norm.includes('تطبيب') || norm.includes('تطبيق') || norm.includes('telemedicine') || norm.includes('telehealth') || norm.includes('digital')) {
    return 'الرعاية الرقمية والوقائية (Telehealth & Wellness)';
  }

  return 'منافع وتغطيات عامة (General Benefits)';
}

/**
 * Universal & Robust Excel Benefits Parser.
 * Handles ANY Excel layout:
 * - Single column list of benefits
 * - 2-column (Name + Category)
 * - Multi-column structured table with headers
 * - Full Tender Comparison Matrix (with Top Title Banner, Sequence column, Section headers, and Footer Totals)
 */
export async function parseBenefitsExcel(file: File): Promise<BenefitRequirement[]> {
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data, { type: 'array' });

  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  
  if (!worksheet) {
    throw new Error('الملف فارغ أو لا يحتوي على أوراق عمل صالحة (Empty or invalid sheet)');
  }

  // Convert to 2D Array [row][col] to inspect exact grid layout
  const rawGrid: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

  if (!rawGrid || rawGrid.length === 0) {
    throw new Error('لم يتم العثور على أي صفوف في ملف الإكسل (No data rows found)');
  }

  // Filter out rows that have zero text
  const cleanGrid = rawGrid.filter(row => Array.isArray(row) && row.some(cell => String(cell).trim().length > 0));

  if (cleanGrid.length === 0) {
    throw new Error('ملف الإكسل لا يحتوي على بيانات صالحة (File has no valid data)');
  }

  // Find maximum column index across all rows
  let maxColIndex = 0;
  cleanGrid.forEach(row => {
    maxColIndex = Math.max(maxColIndex, row.length);
  });

  // Calculate score for each column to find the column containing benefit descriptions
  // The benefit column typically has Arabic strings with insurance keywords or reasonable length (5 - 150 chars)
  const colTextScores: number[] = new Array(maxColIndex).fill(0);
  
  for (let c = 0; c < maxColIndex; c++) {
    for (let r = 0; r < cleanGrid.length; r++) {
      const cellVal = String(cleanGrid[r][c] || '').trim();
      if (!cellVal) continue;
      
      const norm = normalizeArabic(cellVal);
      // If it's a number only, don't give points for benefit name
      if (/^[\d٠-٩\s\.\-]+$/.test(cellVal)) continue;
      // If it's a known header keyword like "الرقم" or "م", don't give high score
      if (norm === 'الرقم' || norm === 'م' || norm === 'ت' || norm === 'رقم') continue;

      if (cellVal.length >= 4 && cellVal.length <= 250) {
        colTextScores[c] += 2;
        if (norm.includes('تغطيه') || norm.includes('سقف') || norm.includes('عمليات') || norm.includes('ادويه') || norm.includes('كشف') || norm.includes('اسنان') || norm.includes('نظارات') || norm.includes('طوارئ') || norm.includes('شبكه') || norm.includes('مستشفي')) {
          colTextScores[c] += 5;
        }
      }
    }
  }

  // Find best benefit name column
  let bestBenefitCol = 0;
  let maxScore = -1;
  colTextScores.forEach((score, idx) => {
    if (score > maxScore) {
      maxScore = score;
      bestBenefitCol = idx;
    }
  });

  const requirements: BenefitRequirement[] = [];
  let currentCategory = 'التغطيات الأساسية والتنويم (Hospitalization & Inpatient)';
  let itemCounter = 0;

  for (let r = 0; r < cleanGrid.length; r++) {
    const row = cleanGrid[r];
    
    // Get text from the best benefit column, or fallback to first non-empty text cell
    let rawBenefitText = String(row[bestBenefitCol] || '').trim();
    
    if (!rawBenefitText) {
      // Find first non-empty text cell in row
      for (let c = 0; c < row.length; c++) {
        const val = String(row[c] || '').trim();
        if (val && !/^[\d٠-٩\s\.\-]+$/.test(val) && !isNoiseOrHeaderRow(val)) {
          rawBenefitText = val;
          break;
        }
      }
    }

    if (!rawBenefitText) continue;

    // 1. Skip Title Banners (e.g. "مقارنة عقود التأمين", "كراسة الشروط")
    if (isTitleBanner(rawBenefitText)) {
      continue;
    }

    // 2. Skip Footer / Summary rows (e.g. "عدد بنود المقارنة 72 نقطة...", "مجموع النقاط", "60% من التقييم الفني")
    if (isFooterOrSummaryRow(rawBenefitText)) {
      continue;
    }

    // 3. Skip pure Header row labels (e.g. "الرقم", "اسم المنفعة", "البيان")
    if (isNoiseOrHeaderRow(rawBenefitText)) {
      continue;
    }

    // 4. Skip Financial Quotation / Annual Premium rows (e.g. "القسط السنوي", "العرض المالي")
    // The annual premium applies to the whole policy and all benefits combined, not an individual benefit!
    if (isFinancialOrTotalPremiumRow(rawBenefitText)) {
      continue;
    }

    // 5. Check if row is a Section / Category Header (e.g. "التغطيات داخل المستشفى", "المنافع و التغطيات الإضافية")
    if (isSectionOrCategoryHeader(rawBenefitText)) {
      const cleanCat = rawBenefitText.replace(/[:\-=_*#]+/g, '').trim();
      if (cleanCat) {
        currentCategory = cleanCat;
      }
      // Do NOT add section headers as individual benefit items
      continue;
    }

    // Clean name
    const benefitName = cleanBenefitName(rawBenefitText);

    // Validate benefit name: must be descriptive and not noise
    if (!benefitName || benefitName.length < 2 || isNoiseOrHeaderRow(benefitName) || isFooterOrSummaryRow(benefitName) || isFinancialOrTotalPremiumRow(benefitName)) {
      continue;
    }

    if (isSectionOrCategoryHeader(benefitName)) {
      currentCategory = benefitName.replace(/[:\-=_*#]+/g, '').trim();
      continue;
    }

    itemCounter++;
    const finalCategory = currentCategory || inferBenefitCategory(benefitName);

    // Extract target value or notes if present in another column
    let targetVal: any = 'غير محدد (يتم استخراجه من كراسة الشروط)';
    let unit = '';
    let type: BenefitEvaluationType = 'numeric_min';
    let weight = 3;
    let priority: PriorityLevel = 'medium';
    let isMandatory = false;

    // Check if there are other columns in the same row
    for (let c = 0; c < row.length; c++) {
      if (c === bestBenefitCol) continue;
      const cellVal = String(row[c] || '').trim();
      if (!cellVal || cellVal === 'الرقم' || cellVal === benefitName) continue;
      
      const parsedInfo = safeParseInsuranceValue(cellVal, benefitName, 'دينار');
      if (parsedInfo.isExcluded) {
        targetVal = parsedInfo.value;
        unit = parsedInfo.unit;
        type = parsedInfo.type;
        weight = 5;
        priority = 'critical';
        isMandatory = true;
        break;
      } else if (parsedInfo.value !== 'غير محدد (يتم استخراجه من كراسة الشروط)') {
        targetVal = parsedInfo.value;
        unit = parsedInfo.unit;
        type = parsedInfo.type;
        if (typeof targetVal === 'number' && targetVal >= 10000) {
          weight = 5;
          priority = 'critical';
          isMandatory = true;
        }
        break;
      }
    }

    requirements.push({
      id: `req_gen_${Date.now()}_${itemCounter}`,
      category: finalCategory,
      name: benefitName,
      targetValue: targetVal,
      unit,
      type,
      weight,
      priority,
      isMandatory,
      description: `بند رقم (${itemCounter}) مستخرج من ملف جدول المنافع المرفوع`
    });
  }

  if (requirements.length === 0) {
    throw new Error('لم يتم استخراج أي منافع صالحة من ملف الإكسل. يرجى التأكد من احتواء الملف على بنود التأمين.');
  }

  return requirements;
}

function normIncludes(text: string, words: string[]): boolean {
  const n = normalizeArabic(text);
  return words.some(w => n.includes(normalizeArabic(w)));
}

/**
 * The Comprehensive 72-Point Medical Insurance Tender Comparison Dataset (Matching the Exact Schedule in Image)
 * 72 points * 5 marks = 360 total points (60% Technical / 40% Financial)
 */
const raw72Benefits: Array<Omit<BenefitRequirement, 'id'>> = [
  // القسم 1: المحددات العامة والتغطية الأساسية
  { name: 'الشبكة الطبية المعتمدة', category: 'الشبكة الطبية والإدارة (Network & Providers)', targetValue: 'شبكة الفئة الأولى الممتازة (Tier 1 Prime)', unit: 'فئة الشبكة', type: 'tier_level', weight: 5, priority: 'critical', isMandatory: true, description: 'اعتماد كبرى المستشفيات والمراكز التخصصية' },
  { name: 'سقف التغطية التأمينية لكل شخص سنوياً', category: 'التنويم والمستشفيات (Hospitalization & Inpatient)', targetValue: 150000, unit: 'ريال/سنة', type: 'numeric_min', weight: 5, priority: 'critical', isMandatory: true, description: 'الحد الأقصى الإجمالي للتغطية السنوية للعضو' },
  { name: 'سقف الحالة المرضية الواحدة سنوياً', category: 'التنويم والمستشفيات (Hospitalization & Inpatient)', targetValue: 100000, unit: 'ريال/حالة', type: 'numeric_min', weight: 4, priority: 'high', isMandatory: false, description: 'السقف المالي المخصص للحالة المرضية الواحدة' },
  { name: 'السقف العام للاستشفاء والتنويم', category: 'التنويم والمستشفيات (Hospitalization & Inpatient)', targetValue: 150000, unit: 'ريال/سنة', type: 'numeric_min', weight: 4, priority: 'high', isMandatory: false, description: 'تغطية نفقات الإقامة والعلاج داخل المستشفى' },
  { name: 'تغطية الحالات الطارئة', category: 'الطوارئ والعناية المركزة (Emergency & ICU)', targetValue: 100, unit: '% نسبة التغطية', type: 'numeric_min', weight: 5, priority: 'critical', isMandatory: true, description: 'تغطية الحالات الطارئة بدون موافقة مسبقة وبدون فترات انتظار' },
  { name: 'الدرجة وفئة الإقامة في المستشفى', category: 'التنويم والمستشفيات (Hospitalization & Inpatient)', targetValue: 'غرفة مفردة خاصة (Private Single Room)', unit: 'فئة الغرفة', type: 'qualitative', weight: 4, priority: 'high', isMandatory: false, description: 'غرفة خاصة مفردة مع تغطية مرافق المريض' },

  // القسم 2: التغطيات داخل المستشفى
  { name: 'نسبة التغطية داخل الشبكة الطبية', category: 'التغطيات داخل المستشفى (Inpatient Coverage)', targetValue: 100, unit: '% نسبة التغطية', type: 'numeric_min', weight: 5, priority: 'critical', isMandatory: true, description: 'تغطية بنسبة 100% داخل المستشفيات المعتمدة' },
  { name: 'غرفة العمليات ومواد التخدير وأدوية التخدير', category: 'التغطيات داخل المستشفى (Inpatient Coverage)', targetValue: 'مغطى بالكامل بنسبة 100%', unit: 'تغطية شاملة', type: 'boolean', weight: 4, priority: 'high', isMandatory: true, description: 'شاملة رسوم الجراحة والتخدير والمستلزمات' },
  { name: 'سقف العناية المركزة والعناية القلبية التاجية (ICU & CCU)', category: 'التغطيات داخل المستشفى (Inpatient Coverage)', targetValue: 'مغطى بنسبة 100% بدون حد زمني', unit: 'تغطية شاملة', type: 'boolean', weight: 5, priority: 'critical', isMandatory: true, description: 'تغطية أسرة العناية المركزة والقلبية الفائقة' },
  { name: 'تغطية العمليات المختلفة (بما في ذلك العلاج الطبيعي والكيماوي وبالأشعة)', category: 'التغطيات داخل المستشفى (Inpatient Coverage)', targetValue: 'مغطى بالكامل بنسبة 100%', unit: 'تغطية شاملة', type: 'boolean', weight: 5, priority: 'critical', isMandatory: true, description: 'علاجات الأورام والعلاج الإشعاعي والكيماوي' },
  { name: 'أتعاب الطبيب وجراحاته', category: 'التغطيات داخل المستشفى (Inpatient Coverage)', targetValue: 'مغطى حسب التعريفة المعتمدة بالكامل', unit: 'تغطية كاملة', type: 'boolean', weight: 4, priority: 'high', isMandatory: false, description: 'أتعاب الاستشاريين والجراحين المعتمدين' },
  { name: 'العلاجات الطبية والطبيب المبنج', category: 'التغطيات داخل المستشفى (Inpatient Coverage)', targetValue: 'مغطى بالكامل بنسبة 100%', unit: 'تغطية كاملة', type: 'boolean', weight: 4, priority: 'medium', isMandatory: false, description: 'أتعاب أطباء التخدير والرعاية السريرية' },
  { name: 'الفحوصات المخبرية والتشخيص، صور الأشعة، تخطيط القلب، التصوير الطبقي', category: 'التغطيات داخل المستشفى (Inpatient Coverage)', targetValue: 'مغطى بالكامل بنسبة 100%', unit: 'تغطية كاملة', type: 'boolean', weight: 4, priority: 'high', isMandatory: false, description: 'الأشعة المقطعية والرنين المغناطيسي والمختبرات' },
  { name: 'أدوات التثبيت ورعاية التمريض الخاصة', category: 'التغطيات داخل المستشفى (Inpatient Coverage)', targetValue: 'مغطى بالكامل حسب الحاجة الطبية', unit: 'تغطية كاملة', type: 'boolean', weight: 3, priority: 'medium', isMandatory: false, description: 'الجبائر والصفائح وأجهزة التثبيت' },
  { name: 'خدمات سيارة الإسعاف', category: 'التغطيات داخل المستشفى (Inpatient Coverage)', targetValue: 'مغطى بنسبة 100% لنقل الحالات الطارئة', unit: 'تغطية كاملة', type: 'boolean', weight: 4, priority: 'high', isMandatory: false, description: 'النقل الإسعافي السريع بين المستشفيات' },

  // القسم 3: المنافع والتغطيات الإضافية
  { name: 'تغطية جميع المستلزمات الطبية', category: 'المنافع والتغطيات الإضافية (Additional Benefits)', targetValue: 'مغطى بالكامل', unit: 'تغطية شاملة', type: 'boolean', weight: 4, priority: 'high', isMandatory: false, description: 'المستلزمات المستهلكة أثناء الإقامة والجراحة' },
  { name: 'تغطية عمليات تبديل صمام القلب وزراعة منظم ضربات القلب (Pacemaker)', category: 'المنافع والتغطيات الإضافية (Additional Benefits)', targetValue: 'مغطى بالكامل بسقف الوثيقة', unit: 'تغطية شاملة', type: 'boolean', weight: 5, priority: 'critical', isMandatory: true, description: 'جراحات القلب المفتوح وزراعة الصمامات والمنظمات' },
  { name: 'تغطية عمليات شبكات القلب STENT', category: 'المنافع والتغطيات الإضافية (Additional Benefits)', targetValue: 'مغطى بالكامل حتى 4 شبكات سنوياً', unit: 'تغطية شاملة', type: 'boolean', weight: 5, priority: 'critical', isMandatory: true, description: 'القسطرة القلبية وتركيب الدعامات التاجية' },
  { name: 'كافة العمليات الأخرى بموافقة شركة التأمين بأن العلاج ضروري', category: 'المنافع والتغطيات الإضافية (Additional Benefits)', targetValue: 'مغطى بنسبة 100%', unit: 'تغطية كاملة', type: 'boolean', weight: 4, priority: 'high', isMandatory: false, description: 'الجراحات التخصصية بموجب تقرير طبي معتمد' },
  { name: 'تغطية عمليات الغدة الدرقية', category: 'المنافع والتغطيات الإضافية (Additional Benefits)', targetValue: 'مغطى بالكامل بنسبة 100%', unit: 'تغطية كاملة', type: 'boolean', weight: 3, priority: 'medium', isMandatory: false, description: 'استئصال وعلاج أورام واعتلالات الغدة الدرقية' },
  { name: 'تغطية عمليات استئصال الرحم وعمليات الرحم', category: 'المنافع والتغطيات الإضافية (Additional Benefits)', targetValue: 'مغطى بالكامل بنسبة 100%', unit: 'تغطية كاملة', type: 'boolean', weight: 4, priority: 'high', isMandatory: false, description: 'الجراحات النسائية واستئصال الألياف والأورام' },
  { name: 'تغطية عمليات الدوالي والبواسير وجراحتها', category: 'المنافع والتغطيات الإضافية (Additional Benefits)', targetValue: 'مغطى بالكامل بدون فترات انتظار', unit: 'تغطية كاملة', type: 'boolean', weight: 3, priority: 'medium', isMandatory: false, description: 'العلاج الجراحي والليزر للدوالي والبواسير' },
  { name: 'عمليات المنظار التشخيصية والجراحية', category: 'المنافع والتغطيات الإضافية (Additional Benefits)', targetValue: 'مغطى بالكامل بنسبة 100%', unit: 'تغطية كاملة', type: 'boolean', weight: 4, priority: 'high', isMandatory: false, description: 'مناظير الجهاز الهضمي والبطن والمفاصل' },
  { name: 'العلاج الطبيعي والتأهيلي', category: 'المنافع والتغطيات الإضافية (Additional Benefits)', targetValue: 20, unit: 'جلسة/سنة', type: 'numeric_min', weight: 4, priority: 'high', isMandatory: false, description: 'جلسات العلاج الطبيعي والتأهيل الحركي' },
  { name: 'أمراض الأعصاب والدماغ', category: 'المنافع والتغطيات الإضافية (Additional Benefits)', targetValue: 'مغطى بالكامل حتى سقف الوثيقة', unit: 'تغطية كاملة', type: 'boolean', weight: 5, priority: 'critical', isMandatory: true, description: 'السكتات الدماغية والصرع والتصلب اللويحي' },
  { name: 'تغطية أمراض العيون غير المتعلقة بحدة الإبصار', category: 'المنافع والتغطيات الإضافية (Additional Benefits)', targetValue: 'مغطى بالكامل (المياه البيضاء والزرقاء والشبكية)', unit: 'تغطية كاملة', type: 'boolean', weight: 4, priority: 'high', isMandatory: false, description: 'عمليات الساد وإعتام عدسة العين والقرنية' },
  { name: 'تغطية الحالات المفاجئة للانزلاق الغضروفي وحالات الديسك', category: 'المنافع والتغطيات الإضافية (Additional Benefits)', targetValue: 'مغطى بالكامل جراحياً وتحفظياً', unit: 'تغطية كاملة', type: 'boolean', weight: 4, priority: 'high', isMandatory: false, description: 'جراحات العمود الفقري وعلاج آلام الديسك الحادة' },
  { name: 'المفصل الكوعي وجراحات المفاصل', category: 'المنافع والتغطيات الإضافية (Additional Benefits)', targetValue: 'مغطى بالكامل بنسبة 100%', unit: 'تغطية كاملة', type: 'boolean', weight: 3, priority: 'medium', isMandatory: false, description: 'تبديل وترميم مفاصل الأطراف' },
  { name: 'أولوية شمولية التغطيات الإضافية وتقديمها على أي استثناءات', category: 'المنافع والتغطيات الإضافية (Additional Benefits)', targetValue: 'مضمن وملزم لشركة التأمين', unit: 'شرط تعاقدي', type: 'boolean', weight: 5, priority: 'critical', isMandatory: true, description: 'اعتبار كافة البنود المطلوبة مغطاة ولا يعمل بأي استثناء ضدها' },
  { name: 'أمراض السرطان والأورام الخبيثة', category: 'المنافع والتغطيات الإضافية (Additional Benefits)', targetValue: 'مغطى بالكامل حتى سقف الوثيقة الإجمالي', unit: 'تغطية كاملة', type: 'boolean', weight: 5, priority: 'critical', isMandatory: true, description: 'شاملة التشخيص والجراحة والعلاج الكيماوي والبيولوجي' },
  { name: 'تكلفة الأجهزة والمعدات الطبية المساعدة', category: 'المنافع والتغطيات الإضافية (Additional Benefits)', targetValue: 5000, unit: 'ريال/سنة', type: 'numeric_min', weight: 3, priority: 'medium', isMandatory: false, description: 'أجهزة التنفس والسماعات الطبية والكراسي' },
  { name: 'زراعة الأعضاء ونقل النخاع العظمي', category: 'المنافع والتغطيات الإضافية (Additional Benefits)', targetValue: 150000, unit: 'ريال/سنة', type: 'numeric_min', weight: 5, priority: 'critical', isMandatory: true, description: 'نفقات زراعة الكلى والكبد والنخاع' },
  { name: 'غسيل الكلى وحالات الفشل الكلوي المزمن', category: 'المنافع والتغطيات الإضافية (Additional Benefits)', targetValue: 'مغطى بالكامل بنسبة 100%', unit: 'تغطية شاملة', type: 'boolean', weight: 5, priority: 'critical', isMandatory: true, description: 'جلسات الغسيل الكلوي الدموي والبريتوني' },
  { name: 'جراحة التشوهات الخلقية المهددة للحياة للأطفال', category: 'المنافع والتغطيات الإضافية (Additional Benefits)', targetValue: 'مغطى بالكامل حتى سقف الوثيقة', unit: 'تغطية كاملة', type: 'boolean', weight: 4, priority: 'high', isMandatory: true, description: 'التدخلات الجراحية الفورية للمواليد' },

  // القسم 4: الحالات السابقة والمزمنة
  { name: 'الحد الأعلى لتغطية الحالات المرضية المزمنة والسابقة للتأمين', category: 'الأمراض المزمنة والحالات السابقة (Chronic & Pre-existing)', targetValue: 150000, unit: 'ريال/سنة', type: 'numeric_min', weight: 5, priority: 'critical', isMandatory: true, description: 'تغطية كاملة للأمراض السابقة للتعاقد دون استثناء' },
  { name: 'علاج ارتفاع ضغط الدم وتصلب الشرايين', category: 'الأمراض المزمنة والحالات السابقة (Chronic & Pre-existing)', targetValue: 'مغطى بالكامل (أدوية وفحوصات دورية)', unit: 'تغطية كاملة', type: 'boolean', weight: 4, priority: 'high', isMandatory: true, description: 'الأدوية الخافضة للضغط ومتابعة القلب' },
  { name: 'مرض السكري ومضاعفاته (علاجات، أجهزة قياس، فحص تراكمي)', category: 'الأمراض المزمنة والحالات السابقة (Chronic & Pre-existing)', targetValue: 'مغطى بالكامل مع شرائح الفحص', unit: 'تغطية كاملة', type: 'boolean', weight: 5, priority: 'critical', isMandatory: true, description: 'الإنسولين والأدوية الفموية وشرائح القياس' },
  { name: 'الربو والأمراض الصدرية والجهاز التنفسي المزمنة', category: 'الأمراض المزمنة والحالات السابقة (Chronic & Pre-existing)', targetValue: 'مغطى بالكامل (بخاخات وجلسات تبخير)', unit: 'تغطية كاملة', type: 'boolean', weight: 4, priority: 'high', isMandatory: true, description: 'موسعات الشعب الهوائية والعلاجات الوقائية' },
  { name: 'أمراض الكبد والجهاز الهضمي المزمنة', category: 'الأمراض المزمنة والحالات السابقة (Chronic & Pre-existing)', targetValue: 'مغطى بالكامل حتى سقف الوثيقة', unit: 'تغطية كاملة', type: 'boolean', weight: 4, priority: 'high', isMandatory: false, description: 'متابعة وظائف الكبد والأدوية التخصصية' },
  { name: 'أمراض المفاصل والروماتيزم والتهابات المناعة الذاتية', category: 'الأمراض المزمنة والحالات السابقة (Chronic & Pre-existing)', targetValue: 'مغطى بالكامل (شامل العلاجات البيولوجية)', unit: 'تغطية كاملة', type: 'boolean', weight: 4, priority: 'high', isMandatory: false, description: 'أدوية الروماتويد والذئبة الحمراء' },

  // القسم 5: منافع خارج المستشفى (العيادات الخارجية)
  { name: 'عدد نماذج/زيارات الكشف الطبي لكل منتفع سنوياً', category: 'العيادات الخارجية والاستشارات (Outpatient)', targetValue: 8, unit: 'نماذج كشف/سنة', type: 'numeric_min', weight: 5, priority: 'critical', isMandatory: true, description: 'الحد الأدنى المطلوب 8 نماذج كشف (تستحق 5/5 دون أي بونص لمن يقدم أكثر)' },
  { name: 'الأدوية الموصوفة والعلاجات الصيدلانية', category: 'الأدوية والصيدلية (Prescription & Pharmacy)', targetValue: 5000, unit: 'ريال/سنة', type: 'numeric_min', weight: 5, priority: 'critical', isMandatory: true, description: 'سقف تغطية الأدوية السنوي للعيادات الخارجية' },
  { name: 'الإجراءات التشخيصية والفحوصات المخبرية والأشعة خارج المستشفى', category: 'الفحوصات والأشعة والمختبر (Diagnostics & Labs)', targetValue: 'مغطى بنسبة 100% بعد التحمل', unit: 'تغطية شاملة', type: 'boolean', weight: 4, priority: 'high', isMandatory: true, description: 'التحاليل الروتينية وصور الأشعة السينية والتلفزيونية' },
  { name: 'أدوية الأمراض المزمنة (صرف دوري)', category: 'الأدوية والصيدلية (Prescription & Pharmacy)', targetValue: 'مغطى بالكامل بدون خصم من سقف الأدوية الحادة', unit: 'تغطية كاملة', type: 'boolean', weight: 5, priority: 'critical', isMandatory: true, description: 'صرف أدوية الأمراض المزمنة لمدد تصل إلى 3 أشهر' },
  { name: 'أمراض الأعصاب والدماغ في العيادات الخارجية', category: 'العيادات الخارجية والاستشارات (Outpatient)', targetValue: 'مغطى بالكامل (كشف وتخطيط دماغ)', unit: 'تغطية كاملة', type: 'boolean', weight: 4, priority: 'high', isMandatory: false, description: 'استشارات طب وجراحة الأعصاب' },
  { name: 'أمراض الدم وعلاجاتها (مميعات الدم، دهنيات الدم، سكر الدم)', category: 'الأدوية والصيدلية (Prescription & Pharmacy)', targetValue: 'مغطى بالكامل بنسبة 100%', unit: 'تغطية كاملة', type: 'boolean', weight: 4, priority: 'high', isMandatory: true, description: 'فحوصات التخثر والأدوية المنظمة' },
  { name: 'تغطية أمراض الغدة الدرقية في العيادات', category: 'العيادات الخارجية والاستشارات (Outpatient)', targetValue: 'مغطى بالكامل (هرمونات وسونار)', unit: 'تغطية كاملة', type: 'boolean', weight: 3, priority: 'medium', isMandatory: false, description: 'تحاليل هرمونات TSH, T3, T4 وعلاج الهرمونات البديلة' },
  { name: 'أمراض العظام وهشاشة العظام (فحص ديكسا DEXA)', category: 'الفحوصات والأشعة والمختبر (Diagnostics & Labs)', targetValue: 'مغطى بالكامل سنوياً للمستحقين', unit: 'تغطية كاملة', type: 'boolean', weight: 3, priority: 'medium', isMandatory: false, description: 'قياس كثافة العظام وعلاجات الهشاشة' },
  { name: 'فحص الماموجرام والكشف المبكر عن أورام الثدي', category: 'الفحوصات والأشعة والمختبر (Diagnostics & Labs)', targetValue: 'مغطى بالكامل سنوياً مجاناً', unit: 'فحص دوري وقائي', type: 'boolean', weight: 4, priority: 'high', isMandatory: true, description: 'فحص الماموجرام السنوي للسيدات فوق 40 سنة' },
  { name: 'جميع الأدوية المسجلة بوزارة الصحة وهيئة الغذاء والدواء', category: 'الأدوية والصيدلية (Prescription & Pharmacy)', targetValue: 'تغطية شاملة لكافة الأدوية المسجلة', unit: 'تغطية كاملة', type: 'boolean', weight: 4, priority: 'high', isMandatory: true, description: 'عدم حصر الأدوية بقائمة ضيقة والسماح بالبدائل المعتمدة' },
  { name: 'العمود الفقري وآلام الظهر والرقبة', category: 'العيادات الخارجية والاستشارات (Outpatient)', targetValue: 'مغطى بالكامل استشارات وعلاج تحفظي', unit: 'تغطية كاملة', type: 'boolean', weight: 4, priority: 'high', isMandatory: false, description: 'استشارات جراحة العظام والمخ والأعصاب' },
  { name: 'نسبة التحمل في العيادات الخارجية والمراكز الطبية', category: 'نسب التحمل والمشاركات المالية (Financial Deductibles)', targetValue: 10, unit: '% (بحد أقصى 50 ريال)', type: 'numeric_max', weight: 5, priority: 'critical', isMandatory: true, description: 'تحمل 10% بحد أقصى 50 ريال للاستشارة الواحدة' },
  { name: 'استشارات أطباء الاختصاص والاستشاريين', category: 'العيادات الخارجية والاستشارات (Outpatient)', targetValue: 'مغطى مباشرة بدون تحويل', unit: 'تغطية كاملة', type: 'boolean', weight: 4, priority: 'high', isMandatory: false, description: 'إمكانية مراجعة الاستشاري مباشرة داخل الشبكة' },
  { name: 'زيارات واستشارات طبيب الأسرة والطب العام', category: 'العيادات الخارجية والاستشارات (Outpatient)', targetValue: 'مغطى بنسبة 100% بعد التحمل', unit: 'تغطية كاملة', type: 'boolean', weight: 3, priority: 'medium', isMandatory: false, description: 'الرعاية الأولية والتشخيص الأولي' },

  // القسم 6: الأسنان والعيون
  { name: 'سقف علاج وجراحة الأسنان السنوي', category: 'الأسنان واللثة (Dental Treatment)', targetValue: 3000, unit: 'ريال/سنة', type: 'numeric_min', weight: 4, priority: 'high', isMandatory: true, description: 'الحد الأقصى المخصص لعلاجات وجراحة الأسنان' },
  { name: 'تنظيف وتلميع الأسنان الدوري وإزالة الجير', category: 'الأسنان واللثة (Dental Treatment)', targetValue: 2, unit: 'مرة/سنة', type: 'numeric_min', weight: 3, priority: 'medium', isMandatory: false, description: 'جلستان تنظيف أسنان سنوياً للمنتفع' },
  { name: 'حشوات الأسنان وعلاج الجذور والأعصاب', category: 'الأسنان واللثة (Dental Treatment)', targetValue: 'مغطى ضمن سقف الأسنان بنسبة 100%', unit: 'تغطية كاملة', type: 'boolean', weight: 4, priority: 'high', isMandatory: true, description: 'شامل الحشوات الضوئية والبلاتينية وسحب العصب' },
  { name: 'خلع الأسنان والجراحات الفموية البسيطة والمركبة', category: 'الأسنان واللثة (Dental Treatment)', targetValue: 'مغطى بنسبة 100% ضمن سقف الأسنان', unit: 'تغطية كاملة', type: 'boolean', weight: 4, priority: 'high', isMandatory: false, description: 'خلع ضرس العقل والجراحات الفموية' },
  { name: 'النظارات الطبية والإطارات والعدسات البصرية', category: 'البصريات والعيون (Vision & Optics)', targetValue: 800, unit: 'ريال/سنتين', type: 'numeric_min', weight: 3, priority: 'medium', isMandatory: false, description: 'مخصص الإطارات والعدسات الطبية كل سنتين' },
  { name: 'فحص النظر وقياس حدة الإبصار الشامل', category: 'البصريات والعيون (Vision & Optics)', targetValue: 'مغطى بالكامل مجاناً في المراكز المعتمدة', unit: 'فحص شامل', type: 'boolean', weight: 3, priority: 'medium', isMandatory: false, description: 'فحص البصريات وضغط العين السنوي' },

  // القسم 7: الأمومة والولادة ورعاية الأطفال
  { name: 'سقف تغطية الأمومة والولادة الطبيعية والقيصرية', category: 'الأمومة ورعاية المواليد (Maternity Care)', targetValue: 20000, unit: 'ريال/حالة', type: 'numeric_min', weight: 5, priority: 'critical', isMandatory: true, description: 'شاملة الولادة الطبيعية والقيصرية والمضاعفات' },
  { name: 'متابعة الحمل والفحوصات الدورية وسونار الجنين', category: 'الأمومة ورعاية المواليد (Maternity Care)', targetValue: 'مغطى بالكامل (9 زيارات + تحاليل وسونار)', unit: 'متابعة كاملة', type: 'boolean', weight: 4, priority: 'high', isMandatory: true, description: 'الفحوصات السريرية والموجات الصوتية الدورية' },
  { name: 'رعاية المواليد الجدد وحواضن الخدج والتطعيمات الإلزامية', category: 'الأمومة ورعاية المواليد (Maternity Care)', targetValue: 'مغطى على وثيقة الأم حتى إضافة المولود', unit: 'تغطية كاملة', type: 'boolean', weight: 5, priority: 'critical', isMandatory: true, description: 'حواضن الخدج وفحص السمع وغربلة الأمراض الوراثية' },
  { name: 'جدول التطعيمات واللقاحات الأساسية للأطفال', category: 'الأمومة ورعاية المواليد (Maternity Care)', targetValue: 'مغطى بنسبة 100% حسب جدول وزارة الصحة', unit: 'تغطية كاملة', type: 'boolean', weight: 5, priority: 'critical', isMandatory: true, description: 'تطعيمات الأطفال حتى عمر 6 سنوات مجاناً' },

  // القسم 8: الخدمات الإضافية والنوعية
  { name: 'العلاج الطبيعي والتأهيل خارج المستشفى', category: 'العلاج الطبيعي والتأهيل (Physical Therapy)', targetValue: 12, unit: 'جلسة/سنة', type: 'numeric_min', weight: 3, priority: 'medium', isMandatory: false, description: 'جلسات التأهيل وإصابات الملاعب وآلام المفاصل' },
  { name: 'الفحوصات الدورية الوقائية والتحاليل الشاملة السنوية', category: 'الرعاية الرقمية والوقائية (Telehealth & Wellness)', targetValue: 'مغطى مرة سنوياً مجاناً', unit: 'فحص وقائي', type: 'boolean', weight: 3, priority: 'medium', isMandatory: false, description: 'فحص وظائف الكبد والكلى والدهون وسكر الدم' },
  { name: 'الاستشارات الطبية عن بعد (Telemedicine 24/7)', category: 'الرعاية الرقمية والوقائية (Telehealth & Wellness)', targetValue: 'مضمن عبر تطبيق هاتفي مجاناً', unit: 'خدمة رقمية', type: 'boolean', weight: 2, priority: 'low', isMandatory: false, description: 'تواصل فوري مع أطباء معتمدين على مدار الساعة' },
  { name: 'التغطية الإقليمية والدولية في حالات الطوارئ أثناء السفر', category: 'الشبكة الطبية والإدارة (Network & Providers)', targetValue: 'مغطى بنظام الاسترداد المالي (Reimbursement)', unit: 'تغطية دولية', type: 'boolean', weight: 3, priority: 'medium', isMandatory: false, description: 'علاج الحالات الطارئة خارج المملكة بنسبة 100%' },

  // القسم 9: التغطيات والمحددات الإضافية المكملة لجدول الـ 78 بنداً الرسمية (78 × 5 = 390 علامة)
  { name: 'نفقات الإقامة لمرافق المريض في المستشفى (Companion Accommodation)', category: 'التنويم والمستشفيات (Hospitalization & Inpatient)', targetValue: 'مغطى بالكامل للأطفال وكبار السن', unit: 'إقامة مرافق', type: 'boolean', weight: 4, priority: 'high', isMandatory: false, description: 'تغطية إقامة وإعاشة مرافق المريض داخل المستشفى' },
  { name: 'تغطية علاجات السمنة المفرطة وجراحات التكميم الطبية (Bariatric Surgery)', category: 'المنافع والتغطيات الإضافية (Additional Benefits)', targetValue: 'مغطى وفق المعايير الطبية المعتمدة', unit: 'جراحة طبية', type: 'boolean', weight: 4, priority: 'medium', isMandatory: false, description: 'جراحات السمنة المرضية لمؤشر كتلة جسم BMI > 40' },
  { name: 'فحوصات ما قبل الزواج والفحوصات الوراثية (Premarital Screening)', category: 'الرعاية الرقمية والوقائية (Telehealth & Wellness)', targetValue: 'مغطى بالكامل حسب الباقة الوطنية', unit: 'فحص وقائي', type: 'boolean', weight: 3, priority: 'medium', isMandatory: false, description: 'فحص أمراض الدم الوراثية والأمراض المعدية' },
  { name: 'تغطية الأطراف الصناعية والأجهزة التعويضية (Prosthetics & Orthotics)', category: 'المنافع والتغطيات الإضافية (Additional Benefits)', targetValue: 10000, unit: 'ريال/سنة', type: 'numeric_min', weight: 4, priority: 'high', isMandatory: false, description: 'الأطراف الصناعية والجبائر التقويمية التعويضية' },
  { name: 'علاج اضطرابات التوحد والنمو للأطفال (Autism Spectrum Disorder)', category: 'الأمومة ورعاية المواليد (Maternity Care)', targetValue: 25000, unit: 'ريال/سنة', type: 'numeric_min', weight: 4, priority: 'high', isMandatory: false, description: 'جلسات التخاطب وتعديل السلوك والعلاج الوظيفي' },
  { name: 'خدمة التوصيل المنزلي لأدوية الأمراض المزمنة (Chronic Medication Home Delivery)', category: 'الأدوية والصيدلية (Prescription & Pharmacy)', targetValue: 'مغطى ومتاح مجاناً لكافة المشتركين', unit: 'خدمة لوجستية', type: 'boolean', weight: 3, priority: 'medium', isMandatory: false, description: 'توصيل شهري دوري للأدوية المزمنة للمنزل أو مقر العمل' },
  { name: 'برنامج المتابعة التغذوية والحميات العلاجية (Clinical Nutrition Consultation)', category: 'الرعاية الرقمية والوقائية (Telehealth & Wellness)', targetValue: 6, unit: 'استشارة/سنة', type: 'numeric_min', weight: 3, priority: 'low', isMandatory: false, description: 'استشارات أخصائي التغذية العلاجية لمرضى السكري والضغط' },
  { name: 'تغطية جراحة الجيوب الأنفية وانحراف الوتيرة التنفسية (Deviated Septum Surgery)', category: 'المنافع والتغطيات الإضافية (Additional Benefits)', targetValue: 'مغطى لأسباب علاجية تنفسية', unit: 'جراحة علاجية', type: 'boolean', weight: 4, priority: 'high', isMandatory: false, description: 'استئصال لحميات وجراحة تعديل الحاجز الأنفي التنفسي' },
  { name: 'تغطية فحص مسحة عنق الرحم الدوري (Pap Smear Screening)', category: 'الفحوصات والأشعة والمختبر (Diagnostics & Labs)', targetValue: 'مغطى سنوياً لكافة السيدات المؤهلات', unit: 'فحص دوري', type: 'boolean', weight: 3, priority: 'medium', isMandatory: false, description: 'فحص الكشف المبكر الدوري' },
  { name: 'تغطية علاج القدم السكرية وجروح السكري (Diabetic Foot Care)', category: 'الأمراض المزمنة والحالات السابقة (Chronic & Pre-existing)', targetValue: 'مغطى بالكامل بما في ذلك الأحذية الطبية', unit: 'رعاية تخصصية', type: 'boolean', weight: 4, priority: 'high', isMandatory: true, description: 'العناية بالجروح السكرية والمستلزمات الوقائية' },
  { name: 'بروتوكول إدارة الألم التداخلي وعلاج آلام الأعصاب (Interventional Pain Management)', category: 'المنافع والتغطيات الإضافية (Additional Benefits)', targetValue: 'مغطى بالكامل عبر حقن المفاصل والأعصاب', unit: 'علاج تداخلي', type: 'boolean', weight: 3, priority: 'medium', isMandatory: false, description: 'إحصار الأعصاب وحقن العمود الفقري لتخفيف الألم' },
  { name: 'تغطية التهابات الأذن الوسطى وزراعة أنابيب التهوية للأطفال (Myringotomy Tubes)', category: 'المنافع والتغطيات الإضافية (Additional Benefits)', targetValue: 'مغطى بالكامل بنسبة 100%', unit: 'جراحة أنف وأذن', type: 'boolean', weight: 4, priority: 'medium', isMandatory: false, description: 'جراحات الأذن الدقيقة للأطفال والمضادات المتخصصة' },
  { name: 'السماعات الطبية وفحص التخطيط السمعي (Audiology & Hearing Aids)', category: 'البصريات والعيون (Vision & Optics)', targetValue: 3000, unit: 'ريال/سنتين', type: 'numeric_min', weight: 3, priority: 'medium', isMandatory: false, description: 'تخطيط السمع وسماعات الأذن الطبية المعتمدة' },
  { name: 'تغطية الإسعاف الجوي والإخلاء الطبي الدولي (Air Ambulance Evacuation)', category: 'الطوارئ والعناية المركزة (Emergency & ICU)', targetValue: 100000, unit: 'ريال/حالة', type: 'numeric_min', weight: 5, priority: 'critical', isMandatory: true, description: 'الإخلاء الطبي الجوي للحالات الحرجة داخل وخارج الدولة' },
  { name: 'المرونة في فترات السداد وإصدار بطاقات التأمين الرقمية الفورية (Digital ID & Flexible Settlement)', category: 'الشبكة الطبية والإدارة (Network & Providers)', targetValue: 'إصدار فوري ودفعات ربع سنوية ميسرة', unit: 'ميزة إدارية', type: 'boolean', weight: 3, priority: 'medium', isMandatory: false, description: 'بطاقة رقمية على الهاتف المحمول وسداد مرن' },
  { name: 'خدمة الموافقات الطبية السريعة والرد خلال 15 دقيقة (Fast-Track Pre-authorization SLA)', category: 'الشبكة الطبية والإدارة (Network & Providers)', targetValue: '15 دقيقة للحالات العاجلة وساعة للروتينية', unit: 'مستوى الخدمة SLA', type: 'boolean', weight: 4, priority: 'high', isMandatory: true, description: 'التزام تعاقدي ملزم بزمن الاستجابة للطلبات الطبية' }
];

export const OFFICIAL_78_POINT_TENDER_BENEFITS: BenefitRequirement[] = raw72Benefits.slice(0, 78).map((item, idx) => ({
  ...item,
  id: `req_official_78_${idx + 1}`
}));

// Backward-compatible alias
export const OFFICIAL_72_POINT_TENDER_BENEFITS: BenefitRequirement[] = OFFICIAL_78_POINT_TENDER_BENEFITS;

/**
 * Default single column benefits list for quick loading
 */
export const DEFAULT_SINGLE_COLUMN_BENEFITS: BenefitRequirement[] = OFFICIAL_78_POINT_TENDER_BENEFITS;

/**
 * Downloads a single-column Excel template (جدول بنود التأمين - 78 بنداً)
 */
export function downloadSingleColumnExcelTemplate(): void {
  const singleColData = OFFICIAL_78_POINT_TENDER_BENEFITS.map((item, idx) => ({
    'الرقم': idx + 1,
    'جدول بنود التأمين': item.name,
    'التصنيف': item.category
  }));

  const worksheet = XLSX.utils.json_to_sheet(singleColData);
  worksheet['!cols'] = [{ wch: 8 }, { wch: 60 }, { wch: 45 }];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'جدول_بنود_التأمين_78_بند');

  XLSX.writeFile(workbook, 'مقارنة_عقود_التامين_78_نقطة_390_علامة.xlsx');
}

/**
 * Downloads a 2-column Excel template: Benefit Name / Coverage & Category
 */
export function downloadBenefitAndCategoryExcelTemplate(): void {
  const sample2ColData = OFFICIAL_78_POINT_TENDER_BENEFITS.map(item => ({
    'اسم المنفعة / التغطية (Benefit Name / Coverage)': item.name,
    'فئة التغطية (Benefit Category)': item.category
  }));

  const worksheet = XLSX.utils.json_to_sheet(sample2ColData);
  worksheet['!cols'] = [
    { wch: 60 },
    { wch: 45 }
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'قائمة_المنافع_والفئات');

  XLSX.writeFile(workbook, 'Insurance_Benefits_and_Categories_Template.xlsx');
}

/**
 * Downloads a standardized full Excel template for benefit requirements
 */
export function downloadSampleExcelTemplate(): void {
  const sampleData = OFFICIAL_78_POINT_TENDER_BENEFITS.map(item => ({
    'التصنيف (Category)': item.category,
    'اسم المنفعة (Benefit Name)': item.name,
    'القيمة المطلوبة (Target Value)': item.targetValue,
    'الوحدة (Unit)': item.unit,
    'نوع التقييم (Type)': item.type,
    'الوزن (Weight 1-5)': item.weight,
    'إلزامي (Mandatory)': item.isMandatory ? 'نعم (Yes)' : 'لا (No)',
    'الوصف والملاحظات (Description)': item.description
  }));

  const worksheet = XLSX.utils.json_to_sheet(sampleData);
  worksheet['!cols'] = [
    { wch: 35 },
    { wch: 55 },
    { wch: 25 },
    { wch: 20 },
    { wch: 18 },
    { wch: 15 },
    { wch: 15 },
    { wch: 50 }
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'قائمة_المنافع_المطلوبة');

  XLSX.writeFile(workbook, 'Insurance_Tender_Benefits_Template.xlsx');
}
