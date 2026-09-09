import { 
  BenefitRequirement, 
  CompanyProposal, 
  PresetTemplate, 
  TenderProject, 
  OfferedBenefitData 
} from '../types';
import { Language } from '../i18n/translations';
import { getLocalizedTerms, localizeCompanyName, localizePlanName } from './termsTranslation';

// ============================================================================
// 1. COMPREHENSIVE BENEFIT DEFINITIONS (ARABIC & ENGLISH)
// ============================================================================

export interface BilingualBenefitDefinition {
  id: string;
  nameAr: string;
  nameEn: string;
  categoryAr: string;
  categoryEn: string;
  unitAr: string;
  unitEn: string;
  targetValueAr?: string | number | boolean;
  targetValueEn?: string | number | boolean;
  descriptionAr: string;
  descriptionEn: string;
}

export const BILINGUAL_BENEFITS: Record<string, BilingualBenefitDefinition> = {
  // Corporate Health Template items
  req_outpatient_visits: {
    id: 'req_outpatient_visits',
    nameAr: 'نماذج وكشوفات زيارات العيادات الخارجية',
    nameEn: 'Outpatient Consultation Forms / Visits',
    categoryAr: 'العيادات الخارجية والاستشارات',
    categoryEn: 'Outpatient & Consultations',
    unitAr: 'نماذج كشف/سنة',
    unitEn: 'forms/year',
    descriptionAr: 'الحد الأدنى لعدد نماذج أو زيارات الكشف الطبي المطلوبة لكل موظف وتابع سنوياً.',
    descriptionEn: 'Annual employee outpatient visit forms/claim entitlements needed per member.'
  },
  req_annual_max_limit: {
    id: 'req_annual_max_limit',
    nameAr: 'سقف التغطية السنوية الإجمالية لكل عضو',
    nameEn: 'Annual Maximum Limit per Member',
    categoryAr: 'التنويم والمستشفيات',
    categoryEn: 'Hospitalization & Inpatient',
    unitAr: 'ريال / دينار / دولار',
    unitEn: 'USD ($)',
    descriptionAr: 'الحد الأقصى الإجمالي للتغطية التأمينية السنوية للشخص الواحد طوال مدة الوثيقة.',
    descriptionEn: 'Maximum overall coverage per insured member per policy year.'
  },
  req_inpatient_room: {
    id: 'req_inpatient_room',
    nameAr: 'الدرجة وفئة غرفة الإقامة والتنويم بالمستشفى',
    nameEn: 'Inpatient Hospital Room Category',
    categoryAr: 'التنويم والمستشفيات',
    categoryEn: 'Hospitalization & Inpatient',
    unitAr: 'فئة الغرفة',
    unitEn: 'Category',
    targetValueAr: 'غرفة مفردة خاصة',
    targetValueEn: 'Private Single Room',
    descriptionAr: 'مستوى الإقامة الفندقية في المستشفى أثناء التنويم وحالات الاستشفاء.',
    descriptionEn: 'Minimum hospital room accommodation level during inpatient stays.'
  },
  req_outpatient_copay: {
    id: 'req_outpatient_copay',
    nameAr: 'نسبة التحمل في العيادات الخارجية',
    nameEn: 'Outpatient Copayment / Co-insurance',
    categoryAr: 'العيادات الخارجية والاستشارات',
    categoryEn: 'Outpatient & Consultations',
    unitAr: '% نسبة التحمل',
    unitEn: '% copay',
    descriptionAr: 'نسبة مشاركة الموظف في تكلفة الاستشارة بالعيادة (الأقل أفضل؛ أقصى نسبة 15%).',
    descriptionEn: 'Member copay per clinic visit (Lower is better; max 15% required).'
  },
  req_prescription_drugs: {
    id: 'req_prescription_drugs',
    nameAr: 'سقف الأدوية والعلاجات الصيدلانية السنوي',
    nameEn: 'Prescription Drugs Annual Limit',
    categoryAr: 'الأدوية والصيدلية',
    categoryEn: 'Prescription & Pharmacy',
    unitAr: 'ريال / دينار / دولار',
    unitEn: 'USD ($)',
    descriptionAr: 'المخصص المالي السنوي للأدوية الموصوفة للأمراض الحادة والمزمنة.',
    descriptionEn: 'Annual allowance for prescribed chronic and acute medications.'
  },
  req_physio_sessions: {
    id: 'req_physio_sessions',
    nameAr: 'جلسات العلاج الطبيعي والتأهيل الحركي',
    nameEn: 'Physiotherapy & Rehab Sessions',
    categoryAr: 'العيادات الخارجية والاستشارات',
    categoryEn: 'Outpatient & Consultations',
    unitAr: 'جلسات/سنة',
    unitEn: 'sessions/year',
    descriptionAr: 'عدد جلسات العلاج الطبيعي والتأهيلي المسموح بها سنوياً لكل منتفع.',
    descriptionEn: 'Number of prescribed physical therapy visits allowed annually.'
  },
  req_dental_limit: {
    id: 'req_dental_limit',
    nameAr: 'سقف علاج وجراحة الأسنان السنوي',
    nameEn: 'Dental Care Coverage Limit',
    categoryAr: 'الأسنان والعيون',
    categoryEn: 'Dental & Vision',
    unitAr: 'ريال / دينار / دولار',
    unitEn: 'USD ($)',
    descriptionAr: 'التغطية السنوية لفحص وحشوات وتنظيف وجراحة والتهابات الأسنان.',
    descriptionEn: 'Annual dental routine checkup, fillings, and extraction benefit.'
  },
  req_optical_allowance: {
    id: 'req_optical_allowance',
    nameAr: 'مخصص النظارات الطبية والإطارات والعدسات',
    nameEn: 'Optical & Eyewear Allowance',
    categoryAr: 'الأسنان والعيون',
    categoryEn: 'Dental & Vision',
    unitAr: 'ريال / دينار / دولار',
    unitEn: 'USD ($)',
    descriptionAr: 'مخصص الإطارات والعدسات الطبية كل سنتين للمنتفع.',
    descriptionEn: 'Prescription eyeglasses and contact lens allowance every 2 years.'
  },
  req_maternity_normal: {
    id: 'req_maternity_normal',
    nameAr: 'سقف تغطية الأمومة والولادة الطبيعية والقيصرية',
    nameEn: 'Maternity Normal Delivery Limit',
    categoryAr: 'الأمومة ورعاية المواليد',
    categoryEn: 'Maternity Care',
    unitAr: 'ريال / دينار / دولار',
    unitEn: 'USD ($)',
    descriptionAr: 'تغطية تكاليف الولادة ورعاية الحمل السابقة واللاحقة والمضاعفات.',
    descriptionEn: 'Maternity normal delivery and pre/post-natal care limit.'
  },
  req_direct_billing: {
    id: 'req_direct_billing',
    nameAr: 'فئة الشبكة الطبية المعتمدة (الدفع المباشر)',
    nameEn: 'Direct Billing Hospital Network Tier',
    categoryAr: 'الشبكة الطبية والإدارة',
    categoryEn: 'Network & Administration',
    unitAr: 'فئة الشبكة',
    unitEn: 'Tier',
    targetValueAr: 'شبكة الفئة الأولى الممتازة (Tier 1 Prime)',
    targetValueEn: 'Tier 1 Prime Network',
    descriptionAr: 'درجة اعتماد المستشفيات والمراكز التخصصية بنظام الدفع المباشر.',
    descriptionEn: 'Direct billing cashless hospital network tier (Tier 1 Prime, Tier 2 Standard).'
  },
  req_telehealth_included: {
    id: 'req_telehealth_included',
    nameAr: 'الاستشارات الطبية عن بعد 24/7 عبر التطبيق',
    nameEn: '24/7 Virtual Telehealth App & Consultations',
    categoryAr: 'الرعاية الرقمية والوقائية',
    categoryEn: 'Wellness & Digital Health',
    unitAr: 'مشمول',
    unitEn: 'Included',
    targetValueAr: true,
    targetValueEn: true,
    descriptionAr: 'استشارات مرئية وفورية مجانية مع أطباء معتمدين على مدار الساعة عبر التطبيق.',
    descriptionEn: 'Free unlimited virtual doctor video consultations via mobile app.'
  },
  req_emergency_evac: {
    id: 'req_emergency_evac',
    nameAr: 'الإخلاء الطبي الطارئ ونقل الجثمان',
    nameEn: 'Emergency Medical Evacuation & Repatriation',
    categoryAr: 'الطوارئ والإخلاء الطبي',
    categoryEn: 'Emergency & Evacuation',
    unitAr: 'ريال / دينار / دولار',
    unitEn: 'USD ($)',
    descriptionAr: 'تغطية النقل الإسعافي الطارئ الجوي والإقليمي لمستشفى مجهز ونقل الجثمان.',
    descriptionEn: 'Coverage for international or regional emergency transport to equipped hospital.'
  },

  // Group Life Template items
  gl_life_multiple: {
    id: 'gl_life_multiple',
    nameAr: 'مبلغ التأمين على الحياة (مضاعف الراتب السنوي)',
    nameEn: 'Life Insurance Sum Assured (Annual Salary Multiple)',
    categoryAr: 'تغطية الوفاة الطبيعية',
    categoryEn: 'Death Benefit',
    unitAr: 'راتب شهر',
    unitEn: 'months salary',
    descriptionAr: 'مضاعف الراتب الأساسي أو الإجمالي المستحق في حالة الوفاة الطبيعية.',
    descriptionEn: 'Multiple of employee annual/monthly basic salary paid upon natural death.'
  },
  gl_add_benefit: {
    id: 'gl_add_benefit',
    nameAr: 'الوفاة بحادث والعجز الجزئي الدائم (AD&D)',
    nameEn: 'Accidental Death & Dismemberment (AD&D)',
    categoryAr: 'تغطيات الحوادث',
    categoryEn: 'Accidental Cover',
    unitAr: 'راتب شهر',
    unitEn: 'months salary',
    descriptionAr: 'تعويض إضافي يعادل مضاعف الراتب في حالة الوفاة أو العجز الناتج عن حادث.',
    descriptionEn: 'Double indemnity accidental death or permanent dismemberment rider.'
  },
  gl_ptd_disability: {
    id: 'gl_ptd_disability',
    nameAr: 'العجز الكلي الدائم الناتج عن حادث أو مرض (PTD)',
    nameEn: 'Permanent Total Disability (PTD)',
    categoryAr: 'تغطية العجز',
    categoryEn: 'Disability',
    unitAr: 'راتب شهر',
    unitEn: 'months salary',
    descriptionAr: 'صرف تعويض العجز الكلي الدائم المانع من ممارسة أي مهنة أو عمل.',
    descriptionEn: 'Lump-sum compensation upon permanent total disability preventing any gainful employment.'
  },
  gl_critical_illness: {
    id: 'gl_critical_illness',
    nameAr: 'عدد الأمراض المستعصية والحرجة المغطاة',
    nameEn: 'Critical Illness Covered Conditions',
    categoryAr: 'الأمراض الحرجة',
    categoryEn: 'Critical Illness',
    unitAr: 'مرض مغطى',
    unitEn: 'conditions',
    descriptionAr: 'عدد الأمراض الخطيرة والمستعصية المغطاة بالتعويض النقدي المقطوع.',
    descriptionEn: 'Number of major critical illnesses covered under lump-sum rider.'
  },
  gl_repatriation_remains: {
    id: 'gl_repatriation_remains',
    nameAr: 'نفقات إعادة ونقل الجثمان إلى موطنه الأصلي',
    nameEn: 'Repatriation of Mortal Remains',
    categoryAr: 'نقل الجثمان',
    categoryEn: 'Repatriation',
    unitAr: 'دولار ($)',
    unitEn: 'USD ($)',
    descriptionAr: 'مخصص تغطية نفقات نقل الجثمان وتجهيزه وتذاكر المرافقين للموطن الأصلي.',
    descriptionEn: 'Allowance to transport remains to home country with companion ticket.'
  },

  // Commercial Fleet Template items
  fl_tpl_limit: {
    id: 'fl_tpl_limit',
    nameAr: 'سقف المسؤولية المدنية تجاه الطرف الثالث للمركبات',
    nameEn: 'Third Party Property Damage Limit',
    categoryAr: 'المسؤولية المدنية',
    categoryEn: 'Liability',
    unitAr: 'دولار ($)',
    unitEn: 'USD ($)',
    descriptionAr: 'الحد الأقصى لتغطية الأضرار المادية الناتجة عن حوادث المركبات تجاه الغير.',
    descriptionEn: 'Statutory and excess third party liability protection limit.'
  },
  fl_replacement_car_days: {
    id: 'fl_replacement_car_days',
    nameAr: 'أيام توفير سيارة بديلة مجانية أثناء الإصلاح',
    nameEn: 'Replacement Courtesy Car Days',
    categoryAr: 'الخدمات المساندة',
    categoryEn: 'Mobility & Convenience',
    unitAr: 'أيام/حادث',
    unitEn: 'days/accident',
    descriptionAr: 'عدد أيام استحقاق سيارة بديلة مجانية في حال استغرق إصلاح المركبة وقتاً.',
    descriptionEn: 'Courtesy replacement vehicle provided during accident repairs (10 days needed).'
  },
  fl_agency_repair_years: {
    id: 'fl_agency_repair_years',
    nameAr: 'مدة الإصلاح داخل الوكالة المعتمدة للمركبات',
    nameEn: 'Authorized Agency Repair Period',
    categoryAr: 'معايير الإصلاح',
    categoryEn: 'Repair Standards',
    unitAr: 'سنوات',
    unitEn: 'years',
    descriptionAr: 'إصلاح المركبات داخل ورش وكيل العلامة التجارية للمركبات التي لا تتجاوز هذا العمر.',
    descriptionEn: 'Repair at official brand dealership for vehicles up to N years old.'
  },
  fl_deductible_own_damage: {
    id: 'fl_deductible_own_damage',
    nameAr: 'مبلغ التحمل الثابت للأضرار الذاتية للمركبة',
    nameEn: 'Standard Own-Damage Deductible / Excess',
    categoryAr: 'مبالغ التحمل',
    categoryEn: 'Excess & Deductible',
    unitAr: 'دولار ($)',
    unitEn: 'USD ($)',
    descriptionAr: 'الحد الأقصى لمبلغ التحمل الثابت عند وقوع حادث مسؤول عنه السائق.',
    descriptionEn: 'Fixed excess per claim (Lower is better; max $250 required).'
  },
  fl_roadside_assistance: {
    id: 'fl_roadside_assistance',
    nameAr: 'المساعدة على الطريق والقطر 24/7 للمركبات',
    nameEn: '24/7 Roadside Assistance & Towing',
    categoryAr: 'المساعدة على الطريق',
    categoryEn: 'Assistance',
    unitAr: 'مشمول',
    unitEn: 'Included',
    targetValueAr: true,
    targetValueEn: true,
    descriptionAr: 'خدمات سحب وقطر المركبة، شحن البطارية، وتغيير الإطارات مجاناً.',
    descriptionEn: 'Free towing, battery jumpstart, lockout, and tire assistance.'
  }
};

// 72-Point Specific Name Dictionary
export const BENEFIT_72_NAMES: Record<string, { ar: string; en: string }> = {
  req_official_72_1: { ar: 'الشبكة الطبية المعتمدة', en: 'Approved Medical Network' },
  req_official_72_2: { ar: 'سقف التغطية التأمينية لكل شخص سنوياً', en: 'Annual Coverage Maximum Limit per Member' },
  req_official_72_3: { ar: 'سقف الحالة المرضية الواحدة سنوياً', en: 'Per-Condition Maximum Limit per Year' },
  req_official_72_4: { ar: 'السقف العام للاستشفاء والتنويم', en: 'Inpatient Hospitalization Overall Limit' },
  req_official_72_5: { ar: 'تغطية الحالات الطارئة', en: 'Emergency Cases Coverage' },
  req_official_72_6: { ar: 'الدرجة وفئة الإقامة في المستشفى', en: 'Inpatient Hospital Room Category' },
  req_official_72_7: { ar: 'نسبة التغطية داخل الشبكة الطبية', en: 'In-Network Coverage Ratio' },
  req_official_72_8: { ar: 'غرفة العمليات ومواد التخدير وأدوية التخدير', en: 'Operating Theatre & Anesthesia Materials' },
  req_official_72_9: { ar: 'سقف العناية المركزة والعناية القلبية التاجية (ICU & CCU)', en: 'ICU & CCU Intensive Care Limit' },
  req_official_72_10: { ar: 'تغطية العمليات المختلفة (بما في ذلك العلاج الطبيعي والكيماوي وبالأشعة)', en: 'Surgical Operations, Chemo & Radiotherapy' },
  req_official_72_11: { ar: 'أتعاب الطبيب وجراحاته', en: 'Physician & Surgical Fees' },
  req_official_72_12: { ar: 'العلاجات الطبية والطبيب المبنج', en: 'Medical Treatments & Anesthesiologist Fees' },
  req_official_72_13: { ar: 'الفحوصات المخبرية والتشخيص، صور الأشعة، تخطيط القلب، التصوير الطبقي', en: 'Diagnostic Labs, X-Rays, ECG, CT & MRI' },
  req_official_72_14: { ar: 'أدوات التثبيت ورعاية التمريض الخاصة', en: 'Prosthetics, Fixation Devices & Private Nursing' },
  req_official_72_15: { ar: 'خدمات سيارة الإسعاف', en: 'Ambulance Services' },
  req_official_72_16: { ar: 'تغطية جميع المستلزمات الطبية', en: 'All Medical Consumables Coverage' },
  req_official_72_17: { ar: 'تغطية عمليات تبديل صمام القلب وزراعة منظم ضربات القلب (Pacemaker)', en: 'Heart Valve Replacement & Pacemaker Implantation' },
  req_official_72_18: { ar: 'تغطية عمليات شبكات القلب STENT', en: 'Coronary Stents Coverage' },
  req_official_72_19: { ar: 'كافة العمليات الأخرى بموافقة شركة التأمين بأن العلاج ضروري', en: 'Other Medically Necessary Surgeries' },
  req_official_72_20: { ar: 'تغطية عمليات الغدة الدرقية', en: 'Thyroid Surgery Coverage' },
  req_official_72_21: { ar: 'تغطية عمليات استئصال الرحم وعمليات الرحم', en: 'Hysterectomy & Uterine Surgeries' },
  req_official_72_22: { ar: 'تغطية عمليات الدوالي والبواسير وجراحتها', en: 'Varicose Veins & Hemorrhoids Surgery' },
  req_official_72_23: { ar: 'عمليات المنظار التشخيصية والجراحية', en: 'Diagnostic & Surgical Endoscopy' },
  req_official_72_24: { ar: 'العلاج الطبيعي والتأهيلي', en: 'Physical Therapy & Rehabilitation' },
  req_official_72_25: { ar: 'أمراض الأعصاب والدماغ', en: 'Neurological & Brain Diseases' },
  req_official_72_26: { ar: 'تغطية أمراض العيون غير المتعلقة بحدة الإبصار', en: 'Non-Refractive Eye Diseases (Cataract, Glaucoma)' },
  req_official_72_27: { ar: 'تغطية الحالات المفاجئة للانزلاق الغضروفي وحالات الديسك', en: 'Acute Herniated Disc & Spinal Cases' },
  req_official_72_28: { ar: 'المفصل الكوعي وجراحات المفاصل', en: 'Joint Surgeries & Arthroplasty' },
  req_official_72_29: { ar: 'أولوية شمولية التغطيات الإضافية وتقديمها على أي استثناءات', en: 'Precedence of Required Benefits Over Exclusions' },
  req_official_72_30: { ar: 'أمراض السرطان والأورام الخبيثة', en: 'Cancer & Malignant Neoplasms' },
  req_official_72_31: { ar: 'تكلفة الأجهزة والمعدات الطبية المساعدة', en: 'Assistive Medical Devices & Equipment' },
  req_official_72_32: { ar: 'زراعة الأعضاء ونقل النخاع العظمي', en: 'Organ Transplantation & Bone Marrow Transfer' },
  req_official_72_33: { ar: 'غسيل الكلى وحالات الفشل الكلوي المزمن', en: 'Hemodialysis & Chronic Renal Failure' },
  req_official_72_34: { ar: 'جراحة التشوهات الخلقية المهددة للحياة للأطفال', en: 'Life-Threatening Congenital Deformities Surgery' },
  req_official_72_35: { ar: 'الحد الأعلى لتغطية الحالات المرضية المزمنة والسابقة للتأمين', en: 'Pre-Existing & Chronic Conditions Maximum Limit' },
  req_official_72_36: { ar: 'علاج ارتفاع ضغط الدم وتصلب الشرايين', en: 'Hypertension & Arteriosclerosis Treatment' },
  req_official_72_37: { ar: 'مرض السكري ومضاعفاته (علاجات، أجهزة قياس، فحص تراكمي)', en: 'Diabetes & Complications (Medication, Glucometers, HbA1c)' },
  req_official_72_38: { ar: 'الربو والأمراض الصدرية والجهاز التنفسي المزمنة', en: 'Asthma & Chronic Respiratory Diseases' },
  req_official_72_39: { ar: 'أمراض الكبد والجهاز الهضمي المزمنة', en: 'Chronic Liver & Gastrointestinal Diseases' },
  req_official_72_40: { ar: 'أمراض المفاصل والروماتيزم والتهابات المناعة الذاتية', en: 'Rheumatology & Autoimmune Disorders' },
  req_official_72_41: { ar: 'عدد نماذج/زيارات الكشف الطبي لكل منتفع سنوياً', en: 'Outpatient Consultation Vouchers / Visits per Year' },
  req_official_72_42: { ar: 'الأدوية الموصوفة والعلاجات الصيدلانية', en: 'Prescription Drugs & Pharmacy Allowance' },
  req_official_72_43: { ar: 'الإجراءات التشخيصية والفحوصات المخبرية والأشعة خارج المستشفى', en: 'Outpatient Diagnostic Labs & Radiology' },
  req_official_72_44: { ar: 'أدوية الأمراض المزمنة (صرف دوري)', en: 'Chronic Disease Medications (Refills)' },
  req_official_72_45: { ar: 'أمراض الأعصاب والدماغ في العيادات الخارجية', en: 'Outpatient Neurology Consultations' },
  req_official_72_46: { ar: 'أمراض الدم وعلاجاتها (مميعات الدم، دهنيات الدم، سكر الدم)', en: 'Hematology & Blood Disorders Treatments' },
  req_official_72_47: { ar: 'تغطية أمراض الغدة الدرقية في العيادات', en: 'Outpatient Thyroid Treatments & Hormones' },
  req_official_72_48: { ar: 'أمراض العظام وهشاشة العظام (فحص ديكسا DEXA)', en: 'Osteoporosis & DEXA Bone Density Scan' },
  req_official_72_49: { ar: 'فحص الماموجرام والكشف المبكر عن أورام الثدي', en: 'Mammogram & Early Breast Cancer Screening' },
  req_official_72_50: { ar: 'جميع الأدوية المسجلة بوزارة الصحة وهيئة الغذاء والدواء', en: 'All Registered MOH/FDA Pharmaceutical Drugs' },
  req_official_72_51: { ar: 'العمود الفقري وآلام الظهر والرقبة', en: 'Spine, Back & Neck Pain Treatments' },
  req_official_72_52: { ar: 'نسبة التحمل في العيادات الخارجية والمراكز الطبية', en: 'Outpatient Copayment Percentage' },
  req_official_72_53: { ar: 'استشارات أطباء الاختصاص والاستشاريين', en: 'Specialist & Consultant Doctor Visits' },
  req_official_72_54: { ar: 'زيارات واستشارات طبيب الأسرة والطب العام', en: 'General Practitioner & Family Doctor Visits' },
  req_official_72_55: { ar: 'سقف علاج وجراحة الأسنان السنوي', en: 'Annual Dental Treatment & Surgery Limit' },
  req_official_72_56: { ar: 'تنظيف وتلميع الأسنان الدوري وإزالة الجير', en: 'Routine Dental Scaling, Polishing & Tartar Removal' },
  req_official_72_57: { ar: 'حشوات الأسنان وعلاج الجذور والأعصاب', en: 'Dental Fillings & Endodontic Root Canal Treatments' },
  req_official_72_58: { ar: 'خلع الأسنان والجراحات الفموية البسيطة والمركبة', en: 'Tooth Extractions & Oral Surgeries' },
  req_official_72_59: { ar: 'النظارات الطبية والإطارات والعدسات البصرية', en: 'Prescription Eyewear, Frames & Lenses Allowance' },
  req_official_72_60: { ar: 'فحص النظر وقياس حدة الإبصار الشامل', en: 'Comprehensive Vision & Eye Pressure Exam' },
  req_official_72_61: { ar: 'سقف تغطية الأمومة والولادة الطبيعية والقيصرية', en: 'Maternity Normal & C-Section Delivery Limit' },
  req_official_72_62: { ar: 'متابعة الحمل والفحوصات الدورية وسونار الجنين', en: 'Antenatal Care, Routine Labs & Fetal Ultrasound' },
  req_official_72_63: { ar: 'رعاية المواليد الجدد وحواضن الخدج والتطعيمات الإلزامية', en: 'Newborn Care, Premature Incubators & Vaccines' },
  req_official_72_64: { ar: 'جدول التطعيمات واللقاحات الأساسية للأطفال', en: 'Childhood Essential Vaccination Schedule' },
  req_official_72_65: { ar: 'العلاج الطبيعي والتأهيل خارج المستشفى', en: 'Outpatient Physical Therapy & Rehabilitation' },
  req_official_72_66: { ar: 'الفحوصات الدورية الوقائية والتحاليل الشاملة السنوية', en: 'Annual Routine Preventive Checkups & Wellness Labs' },
  req_official_72_67: { ar: 'الاستشارات الطبية عن بعد (Telemedicine 24/7)', en: '24/7 Virtual Telehealth App Consultations' },
  req_official_72_68: { ar: 'التغطية الإقليمية والدولية في حالات الطوارئ أثناء السفر', en: 'Worldwide Emergency Travel Medical Cover' }
};

// ============================================================================
// 2. CATEGORY & UNIT DICTIONARIES
// ============================================================================

export const CATEGORY_TRANSLATIONS: Record<string, { ar: string; en: string }> = {
  'outpatient & consultations': { ar: 'العيادات الخارجية والاستشارات', en: 'Outpatient & Consultations' },
  'العيادات الخارجية والاستشارات': { ar: 'العيادات الخارجية والاستشارات', en: 'Outpatient & Consultations' },
  'العيادات الخارجية والاستشارات (outpatient)': { ar: 'العيادات الخارجية والاستشارات', en: 'Outpatient & Consultations' },
  'hospitalization & inpatient': { ar: 'التنويم والمستشفيات', en: 'Hospitalization & Inpatient' },
  'التنويم والمستشفيات': { ar: 'التنويم والمستشفيات', en: 'Hospitalization & Inpatient' },
  'التنويم والمستشفيات (hospitalization & inpatient)': { ar: 'التنويم والمستشفيات', en: 'Hospitalization & Inpatient' },
  'التغطيات داخل المستشفى (inpatient coverage)': { ar: 'التغطيات داخل المستشفى', en: 'Inpatient Coverage' },
  'inpatient coverage': { ar: 'التغطيات داخل المستشفى', en: 'Inpatient Coverage' },
  'طوارئ وعناية مركزة': { ar: 'الطوارئ والعناية المركزة', en: 'Emergency & ICU' },
  'الطوارئ والعناية المركزة (emergency & icu)': { ar: 'الطوارئ والعناية المركزة', en: 'Emergency & ICU' },
  'emergency & icu': { ar: 'الطوارئ والعناية المركزة', en: 'Emergency & ICU' },
  'emergency & evacuation': { ar: 'الطوارئ والإخلاء الطبي', en: 'Emergency & Evacuation' },
  'المنافع والتغطيات الإضافية (additional benefits)': { ar: 'المنافع والتغطيات الإضافية', en: 'Additional Benefits' },
  'additional benefits': { ar: 'المنافع والتغطيات الإضافية', en: 'Additional Benefits' },
  'الأمراض المزمنة والحالات السابقة (chronic & pre-existing)': { ar: 'الأمراض المزمنة والحالات السابقة', en: 'Chronic & Pre-existing' },
  'chronic & pre-existing': { ar: 'الأمراض المزمنة والحالات السابقة', en: 'Chronic & Pre-existing' },
  'prescription & pharmacy': { ar: 'الأدوية والصيدلية', en: 'Prescription & Pharmacy' },
  'الأدوية والصيدلية': { ar: 'الأدوية والصيدلية', en: 'Prescription & Pharmacy' },
  'الأدوية والصيدلية (prescription & pharmacy)': { ar: 'الأدوية والصيدلية', en: 'Prescription & Pharmacy' },
  'الفحوصات والأشعة والمختبر (diagnostics & labs)': { ar: 'الفحوصات والأشعة والمختبر', en: 'Diagnostics & Labs' },
  'diagnostics & labs': { ar: 'الفحوصات والأشعة والمختبر', en: 'Diagnostics & Labs' },
  'نسب التحمل والمشاركات المالية (financial deductibles)': { ar: 'نسب التحمل والمشاركات المالية', en: 'Financial Deductibles' },
  'financial deductibles': { ar: 'نسب التحمل والمشاركات المالية', en: 'Financial Deductibles' },
  'dental & vision': { ar: 'الأسنان والعيون', en: 'Dental & Vision' },
  'الأسنان والعيون': { ar: 'الأسنان والعيون', en: 'Dental & Vision' },
  'الأسنان واللثة (dental treatment)': { ar: 'الأسنان واللثة', en: 'Dental Treatment' },
  'dental treatment': { ar: 'الأسنان واللثة', en: 'Dental Treatment' },
  'البصريات والعيون (vision & optics)': { ar: 'البصريات والعيون', en: 'Vision & Optics' },
  'vision & optics': { ar: 'البصريات والعيون', en: 'Vision & Optics' },
  'maternity care': { ar: 'الأمومة ورعاية المواليد', en: 'Maternity Care' },
  'الأمومة ورعاية المواليد': { ar: 'الأمومة ورعاية المواليد', en: 'Maternity Care' },
  'الأمومة ورعاية المواليد (maternity care)': { ar: 'الأمومة ورعاية المواليد', en: 'Maternity Care' },
  'network & administration': { ar: 'الشبكة الطبية والإدارة', en: 'Network & Administration' },
  'الشبكة الطبية والإدارة': { ar: 'الشبكة الطبية والإدارة', en: 'Network & Administration' },
  'الشبكة الطبية والإدارة (network & providers)': { ar: 'الشبكة الطبية ومقدمو الخدمة', en: 'Network & Providers' },
  'network & providers': { ar: 'الشبكة الطبية ومقدمو الخدمة', en: 'Network & Providers' },
  'wellness & digital health': { ar: 'الرعاية الرقمية والوقائية', en: 'Wellness & Digital Health' },
  'الرعاية الرقمية والوقائية (telehealth & wellness)': { ar: 'الرعاية الرقمية والوقائية', en: 'Telehealth & Wellness' },
  'telehealth & wellness': { ar: 'الرعاية الرقمية والوقائية', en: 'Telehealth & Wellness' },
  'العلاج الطبيعي والتأهيل (physical therapy)': { ar: 'العلاج الطبيعي والتأهيل', en: 'Physical Therapy' },
  'physical therapy': { ar: 'العلاج الطبيعي والتأهيل', en: 'Physical Therapy' },
  'death benefit': { ar: 'تغطية الوفاة الطبيعية', en: 'Death Benefit' },
  'accidental cover': { ar: 'تغطيات الحوادث', en: 'Accidental Cover' },
  'disability': { ar: 'تغطية العجز', en: 'Disability' },
  'critical illness': { ar: 'الأمراض الحرجة', en: 'Critical Illness' },
  'repatriation': { ar: 'نقل الجثمان', en: 'Repatriation' },
  'liability': { ar: 'المسؤولية المدنية', en: 'Liability' },
  'mobility & convenience': { ar: 'الخدمات المساندة والسيارة البديلة', en: 'Mobility & Convenience' },
  'repair standards': { ar: 'معايير الإصلاح والوكالة', en: 'Repair Standards' },
  'excess & deductible': { ar: 'مبالغ التحمل', en: 'Excess & Deductible' },
  'assistance': { ar: 'المساعدة على الطريق', en: 'Roadside Assistance' },
  'health & medical': { ar: 'التأمين الطبي والصحي', en: 'Health & Medical' },
  'property & fleet': { ar: 'الممتلكات وأساطيل المركبات', en: 'Property & Fleet' },
  'life & accident': { ar: 'الحياة والحوادث الشخصية', en: 'Life & Accident' }
};

export const UNIT_TRANSLATIONS: Record<string, { ar: string; en: string }> = {
  'forms/year': { ar: 'نماذج كشف/سنة', en: 'forms/year' },
  'نماذج كشف/سنة': { ar: 'نماذج كشف/سنة', en: 'forms/year' },
  'usd ($)': { ar: 'دولار ($)', en: 'USD ($)' },
  'ريال/سنة': { ar: 'ريال/سنة', en: 'SAR/year' },
  'دينار/سنة': { ar: 'دينار/سنة', en: 'JOD/year' },
  'ريال/حالة': { ar: 'ريال/حالة', en: 'SAR/case' },
  'دينار/حالة': { ar: 'دينار/حالة', en: 'JOD/case' },
  'فئة الشبكة': { ar: 'فئة الشبكة', en: 'Network Tier' },
  'tier': { ar: 'فئة الشبكة', en: 'Tier' },
  '% نسبة التغطية': { ar: '% نسبة التغطية', en: '% Coverage' },
  'فئة الغرفة': { ar: 'فئة الغرفة', en: 'Room Category' },
  'category': { ar: 'فئة الغرفة', en: 'Category' },
  'تغطية شاملة': { ar: 'تغطية شاملة', en: 'Comprehensive' },
  'تغطية كاملة': { ar: 'تغطية كاملة', en: 'Full Coverage' },
  'جلسة/سنة': { ar: 'جلسة/سنة', en: 'sessions/year' },
  'sessions/year': { ar: 'جلسة/سنة', en: 'sessions/year' },
  'شرط تعاقدي': { ar: 'شرط تعاقدي', en: 'Contractual' },
  'فحص دوري وقائي': { ar: 'فحص دوري وقائي', en: 'Preventive Exam' },
  '% copay': { ar: '% نسبة التحمل', en: '% copay' },
  '% (بحد أقصى 50 ريال)': { ar: '% (بحد أقصى 50 ريال)', en: '% (max 50 SAR)' },
  'مرة/سنة': { ar: 'مرة/سنة', en: 'times/year' },
  'ريال/سنتين': { ar: 'ريال/سنتين', en: 'SAR/2 years' },
  'دينار/سنتين': { ar: 'دينار/سنتين', en: 'JOD/2 years' },
  'فحص شامل': { ar: 'فحص شامل', en: 'Comprehensive Exam' },
  'متابعة كاملة': { ar: 'متابعة كاملة', en: 'Full Follow-up' },
  'فحص وقائي': { ar: 'فحص وقائي', en: 'Preventive Check' },
  'خدمة رقمية': { ar: 'خدمة رقمية', en: 'Digital Service' },
  'تغطية دولية': { ar: 'تغطية دولية', en: 'International Cover' },
  'included': { ar: 'مشمول', en: 'Included' },
  'مشمول': { ar: 'مشمول', en: 'Included' },
  'months salary': { ar: 'راتب شهر', en: 'months salary' },
  'conditions': { ar: 'أمراض مغطاة', en: 'conditions' },
  'days/accident': { ar: 'أيام/حادث', en: 'days/accident' },
  'years': { ar: 'سنوات', en: 'years' }
};

export const VALUE_TRANSLATIONS: Record<string, { ar: string; en: string }> = {
  'private single room': { ar: 'غرفة مفردة خاصة', en: 'Private Single Room' },
  'غرفة مفردة خاصة': { ar: 'غرفة مفردة خاصة', en: 'Private Single Room' },
  'غرفة مفردة خاصة (private single room)': { ar: 'غرفة مفردة خاصة', en: 'Private Single Room' },
  'tier 1 prime network': { ar: 'شبكة الفئة الأولى الممتازة (Tier 1 Prime)', en: 'Tier 1 Prime Network' },
  'شبكة الفئة الأولى الممتازة (tier 1 prime)': { ar: 'شبكة الفئة الأولى الممتازة (Tier 1 Prime)', en: 'Tier 1 Prime Network' },
  'vip suite / private single': { ar: 'جناح VIP / غرفة مفردة خاصة', en: 'VIP Suite / Private Single' },
  'semi-private (shared 2-bed)': { ar: 'غرفة مشتركة (سريران)', en: 'Semi-Private (Shared 2-bed)' },
  'tier 1 premier network': { ar: 'شبكة الفئة الأولى الممتازة', en: 'Tier 1 Premier Network' },
  'tier 2 comprehensive network': { ar: 'شبكة الفئة الثانية الشاملة', en: 'Tier 2 Comprehensive Network' },
  'tier 3 restricted network': { ar: 'شبكة الفئة الثالثة المحدودة', en: 'Tier 3 Restricted Network' },
  'مغطى بالكامل بنسبة 100%': { ar: 'مغطى بالكامل بنسبة 100%', en: '100% Fully Covered' },
  'مغطى بنسبة 100% بدون حد زمني': { ar: 'مغطى بنسبة 100% بدون حد زمني', en: '100% Covered Without Time Limit' },
  'مغطى حسب التعريفة المعتمدة بالكامل': { ar: 'مغطى حسب التعريفة المعتمدة بالكامل', en: 'Fully Covered per Approved Tariff' },
  'مغطى بالكامل حسب الحاجة الطبية': { ar: 'مغطى بالكامل حسب الحاجة الطبية', en: 'Fully Covered per Medical Necessity' },
  'مغطى بنسبة 100% لنقل الحالات الطارئة': { ar: 'مغطى بنسبة 100% لنقل الحالات الطارئة', en: '100% Covered for Emergency Transfer' },
  'مغطى بالكامل': { ar: 'مغطى بالكامل', en: 'Fully Covered' },
  'مغطى بالكامل بسقف الوثيقة': { ar: 'مغطى بالكامل بسقف الوثيقة', en: 'Fully Covered up to Policy Limit' },
  'مغطى بالكامل حتى 4 شبكات سنوياً': { ar: 'مغطى بالكامل حتى 4 شبكات سنوياً', en: 'Fully Covered up to 4 Stents/year' },
  'مغطى بنسبة 100%': { ar: 'مغطى بنسبة 100%', en: '100% Covered' },
  'مغطى بالكامل بدون فترات انتظار': { ar: 'مغطى بالكامل بدون فترات انتظار', en: 'Fully Covered Without Waiting Periods' },
  'مغطى بالكامل حتى سقف الوثيقة': { ar: 'مغطى بالكامل حتى سقف الوثيقة', en: 'Fully Covered up to Policy Limit' },
  'مضمن وملزم لشركة التأمين': { ar: 'مضمن وملزم لشركة التأمين', en: 'Included & Contractually Binding' },
  'مغطى بالكامل حتى سقف الوثيقة الإجمالي': { ar: 'مغطى بالكامل حتى سقف الوثيقة الإجمالي', en: 'Fully Covered up to Aggregate Limit' },
  'مغطى بالكامل (أدوية وفحوصات دورية)': { ar: 'مغطى بالكامل (أدوية وفحوصات دورية)', en: 'Fully Covered (Drugs & Routine Labs)' },
  'مغطى بالكامل مع شرائح الفحص': { ar: 'مغطى بالكامل مع شرائح الفحص', en: 'Fully Covered with Glucometer Strips' },
  'مغطى بالكامل (بخاخات وجلسات تبخير)': { ar: 'مغطى بالكامل (بخاخات وجلسات تبخير)', en: 'Fully Covered (Inhalers & Nebulization)' },
  'مغطى بالكامل (شامل العلاجات البيولوجية)': { ar: 'مغطى بالكامل (شامل العلاجات البيولوجية)', en: 'Fully Covered (Biologics Included)' },
  'مغطى بنسبة 100% بعد التحمل': { ar: 'مغطى بنسبة 100% بعد التحمل', en: '100% Covered After Copay' },
  'مغطى بالكامل بدون خصم من سقف الأدوية الحادة': { ar: 'مغطى بالكامل بدون خصم من سقف الأدوية الحادة', en: 'Fully Covered (Separate from Acute Cap)' },
  'مغطى بالكامل (كشف وتخطيط دماغ)': { ar: 'مغطى بالكامل (كشف وتخطيط دماغ)', en: 'Fully Covered (Consults & EEG)' },
  'مغطى بالكامل (هرمونات وسونار)': { ar: 'مغطى بالكامل (هرمونات وسونار)', en: 'Fully Covered (Hormones & Ultrasound)' },
  'مغطى بالكامل سنوياً للمستحقين': { ar: 'مغطى بالكامل سنوياً للمستحقين', en: 'Fully Covered Annually for Eligible' },
  'مغطى بالكامل سنوياً مجاناً': { ar: 'مغطى بالكامل سنوياً مجاناً', en: 'Fully Covered Annually at No Cost' },
  'تغطية شاملة لكافة الأدوية المسجلة': { ar: 'تغطية شاملة لكافة الأدوية المسجلة', en: 'Comprehensive Cover for All Registered Drugs' },
  'مغطى بالكامل استشارات وعلاج تحفظي': { ar: 'مغطى بالكامل استشارات وعلاج تحفظي', en: 'Fully Covered Consults & Conservative Care' },
  'مغطى مباشرة بدون تحويل': { ar: 'مغطى مباشرة بدون تحويل', en: 'Direct Access Without Referral' },
  'مغطى ضمن سقف الأسنان بنسبة 100%': { ar: 'مغطى ضمن سقف الأسنان بنسبة 100%', en: '100% Covered within Dental Cap' },
  'مغطى بالكامل مجاناً في المراكز المعتمدة': { ar: 'مغطى بالكامل مجاناً في المراكز المعتمدة', en: 'Fully Covered Free at Approved Centers' },
  'مغطى بالكامل (9 زيارات + تحاليل وسونار)': { ar: 'مغطى بالكامل (9 زيارات + تحاليل وسونار)', en: 'Fully Covered (9 Visits + Labs & Ultrasound)' },
  'مغطى على وثيقة الأم حتى إضافة المولود': { ar: 'مغطى على وثيقة الأم حتى إضافة المولود', en: 'Covered Under Mother\'s Policy Until Endorsement' },
  'مغطى بنسبة 100% حسب جدول وزارة الصحة': { ar: 'مغطى بنسبة 100% حسب جدول وزارة الصحة', en: '100% Covered per MOH Vaccination Schedule' },
  'مغطى مرة سنوياً مجاناً': { ar: 'مغطى مرة سنوياً مجاناً', en: 'Covered Once Annually Free' },
  'مضمن عبر تطبيق هاتفي مجاناً': { ar: 'مضمن عبر تطبيق هاتفي مجاناً', en: 'Included Free via Mobile App' },
  'مغطى بنظام الاسترداد المالي (reimbursement)': { ar: 'مغطى بنظام الاسترداد المالي', en: 'Covered via Reimbursement' }
};

// ============================================================================
// 3. COMPANY PROPOSAL BILINGUAL DEFINITIONS
// ============================================================================

export interface BilingualProposalData {
  companyNameAr: string;
  companyNameEn: string;
  planNameAr: string;
  planNameEn: string;
  networkNameAr: string;
  networkNameEn: string;
  currencyAr: string;
  currencyEn: string;
  executiveSummaryAr: string;
  executiveSummaryEn: string;
  feesDescriptionAr: string;
  feesDescriptionEn: string;
  customNotesAr: string;
  customNotesEn: string;
  extraFeaturesAr: Array<{ title: string; description: string }>;
  extraFeaturesEn: Array<{ title: string; description: string }>;
  benefitTexts: Record<string, {
    rawTextAr: string;
    rawTextEn: string;
    notesAr: string;
    notesEn: string;
    offeredValueAr?: string;
    offeredValueEn?: string;
  }>;
}

export const BILINGUAL_PROPOSALS: Record<string, BilingualProposalData> = {
  prop_jic: {
    companyNameAr: 'شركة التأمين الأردنية (Jordan Insurance Company - JIC)',
    companyNameEn: 'Jordan Insurance Company (JIC)',
    planNameAr: 'برنامج الرعاية الصحية الشامل (العرض الرسمي للمناقصة)',
    planNameEn: 'Comprehensive Healthcare Plan (Official Tender Offer)',
    networkNameAr: 'الشبكة الطبية الأولى المباشرة (JIC Prime Network)',
    networkNameEn: 'JIC Tier 1 Prime Direct Billing Network',
    currencyAr: 'دينار أردني (JOD)',
    currencyEn: 'JOD (Jordanian Dinar)',
    executiveSummaryAr: 'عرض شركة التأمين الأردنية الرسمي: فئة 0-17: 324.555 د (97 طفلاً = 31,482 د)، فئة 18-65: 607.53 د (159 بالغاً = 96,597 د)، مجموع الأقساط الأساسية = 128,079 د، رسوم إصدار 4% = 5,123.16 د، رسوم طوابع 1% = 1,332.02 د، رسوم صندوق ضمان 0.5% = 640.40 د، الإجمالي الكلي المعتمد للعقد = 135,175 ديناراً (المرتبة الثانية: 2).',
    executiveSummaryEn: 'Jordan Insurance Company (JIC) official tender offer: Rate 0-17: 324.555 JOD (97 children = 31,482 JOD), rate 18-65: 607.53 JOD (159 adults = 96,597 JOD), base subtotal = 128,079 JOD, 4% issuance fee = 5,123.16 JOD, 1% stamps = 1,332.02 JOD, 0.5% guarantee fund = 640.40 JOD, grand total contract premium = 135,175 JOD (Rank: 2).',
    feesDescriptionAr: 'رسوم إصدار 4% (5,123.16 د) + رسوم طوابع 1% (1,332.02 د) + صندوق ضمان المؤمن له 0.5% (640.40 د) = إجمالي الرسوم 7,095.58 د',
    feesDescriptionEn: '4% Issuance fee (5,123.16 JOD) + 1% Revenue Stamps (1,332.02 JOD) + 0.5% Guarantee Fund (640.40 JOD) = Total fees 7,095.58 JOD',
    customNotesAr: 'عرض شركة التأمين الأردنية (JIC): 97 أطفال × 324.555 د = 31,482 د، 159 بالغين × 607.53 د = 96,597 د (المجموع الأساسي 128,079 د) + رسوم إصدار 4% (5,123.16 د) + طوابع 1% (1,332.02 د) + صندوق ضمان 0.5% (640.40 د) = الإجمالي الكلي 135,175 دينار (الترتيب: 2)',
    customNotesEn: 'JIC Calculation: 97 children × 324.555 + 159 adults × 607.53 = 128,079 JOD base + 4% issuance (5,123.16 JOD) + 1% stamps (1,332.02 JOD) + 0.5% guarantee fund (640.40 JOD) = Total 135,175 JOD (Rank: 2)',
    extraFeaturesAr: [
      { title: 'برنامج الفحص الدوري السنوي', description: 'فحص سريري ومخبري سنوي شامل للمشتركين فوق سن الأربعين.' },
      { title: 'خدمة توصيل أدوية الأمراض المزمنة', description: 'توصيل شهري دوري للأدوية المزمنة لمنازل ومقار العمل.' }
    ],
    extraFeaturesEn: [
      { title: 'Annual Preventative Health Screening', description: 'Comprehensive annual physical and lab checkup for insured members.' },
      { title: 'Chronic Medication Doorstep Delivery', description: 'Monthly direct doorstep delivery for scheduled chronic prescriptions.' }
    ],
    benefitTexts: {
      req_outpatient_visits: {
        rawTextAr: '9 نماذج وكشوفات زيارات عيادات خارجية سنوياً لكل مؤمن له.',
        rawTextEn: '9 outpatient consultation vouchers/forms per covered member annually.',
        notesAr: 'يتجاوز الحد الأدنى (8 زيارات) ومسقوف عند 100% دون زيادة وهمية.',
        notesEn: 'Exceeds minimum (offers 9 vs 8 needed). Capped at 100% without score inflation.'
      },
      req_annual_max_limit: {
        rawTextAr: 'سقف إجمالي سنوي 120,000 دينار لكل مشترك.',
        rawTextEn: '120,000 JOD annual maximum limit per member.',
        notesAr: 'يتجاوز المستهدف (100,000 د).',
        notesEn: 'Exceeds requirement ($100k target).'
      },
      req_inpatient_room: {
        rawTextAr: 'غرفة خاصة مفردة مع حمام مستقل ومرافق كامل.',
        rawTextEn: 'Private Single Room with private ensuite and companion accommodation.',
        notesAr: 'مطابق للشروط تماماً.',
        notesEn: 'Fully compliant with tender specs.',
        offeredValueAr: 'غرفة مفردة خاصة',
        offeredValueEn: 'Private Single Room'
      },
      req_outpatient_copay: {
        rawTextAr: '10% نسبة تحمل في العيادات الخارجية.',
        rawTextEn: '10% co-insurance at network outpatient clinics.',
        notesAr: 'أفضل من الحد الأقصى 15% المطلوب.',
        notesEn: 'Better than required maximum 15%.'
      },
      req_prescription_drugs: {
        rawTextAr: '3,500 دينار سقف الأدوية الموصوفة السنوي.',
        rawTextEn: '3,500 JOD annual prescription drugs limit.',
        notesAr: 'يتجاوز المطلوب (3,000 د).',
        notesEn: 'Exceeds tender target.'
      },
      req_physio_sessions: {
        rawTextAr: '15 جلسة علاج طبيعي وتأهيلي سنوياً.',
        rawTextEn: '15 physical therapy and rehabilitation sessions per year.',
        notesAr: 'يتجاوز المطلوب (12 جلسة).',
        notesEn: 'Exceeds minimum requirement.'
      },
      req_dental_limit: {
        rawTextAr: '1,500 دينار سقف علاجات الأسنان المشمولة.',
        rawTextEn: '1,500 JOD dental care annual ceiling.',
        notesAr: 'مطابق للحد المطلوب 1,500 دينار تماماً.',
        notesEn: 'Matches requirement exactly.'
      },
      req_optical_allowance: {
        rawTextAr: '350 دينار مخصص الإطارات والعدسات الطبية كل عامين.',
        rawTextEn: '350 JOD vision allowance every 2 years.',
        notesAr: 'مطابق للمستهدف.',
        notesEn: 'Matches required allowance.'
      },
      req_maternity_normal: {
        rawTextAr: '6,500 دينار سقف الولادة الطبيعية ورعاية الحمل.',
        rawTextEn: '6,500 JOD maternity delivery and ante-natal care package.',
        notesAr: 'مطابق لمواصفات الكراسة.',
        notesEn: 'Fully compliant.'
      },
      req_direct_billing: {
        rawTextAr: 'مطالبة مباشرة وفورية عبر شبكة المستشفيات والمراكز من الفئة الأولى.',
        rawTextEn: 'Direct billing via Tier 1 prime hospital and medical center network.',
        notesAr: 'مطابق لشرط الشبكة المعتمدة.',
        notesEn: 'Fully compliant with network requirement.'
      },
      req_telehealth_included: {
        rawTextAr: 'استشارات طبية مرئية وهاتفية على مدار الساعة (JIC TeleHealth 24/7).',
        rawTextEn: 'Included 24/7 virtual doctor consultation services.',
        notesAr: 'مشمول بالكامل مجاناً.',
        notesEn: 'Included free of charge.'
      },
      req_emergency_evac: {
        rawTextAr: 'تغطية إخلاء طبي طارئ وإعادة للوطن حتى 80,000 دينار.',
        rawTextEn: 'Emergency medical evacuation up to 80,000 JOD.',
        notesAr: 'يتجاوز الحد الأدنى المطلوب.',
        notesEn: 'Exceeds minimum requirement.'
      }
    }
  },
  prop_jofico: {
    companyNameAr: 'الشركة الأردنية الفرنسية للتأمين (جوفيكو)',
    companyNameEn: 'Jordan French Insurance Co. (JOFICO)',
    planNameAr: 'برنامج الرعاية الصحية المؤسسية (الفئة الذهبية)',
    planNameEn: 'Corporate Health Care Program (Gold Tier)',
    networkNameAr: 'شبكة الفئة الأولى الطبية المعتمدة (Tier 1 Prime)',
    networkNameEn: 'Tier 1 Prime Hospital Network',
    currencyAr: 'دينار أردني (JOD)',
    currencyEn: 'JOD (Jordanian Dinar)',
    executiveSummaryAr: 'عرض متكامل يلبي كافة اشتراطات كراسة الجامعة، متضمن 10 نماذج كشف (مسقوفة عند 100%)، قسط فئة 0-17 سنة: 310 د، وفئة 18-65 سنة: 510 د، مع رسوم 6.5%.',
    executiveSummaryEn: 'Comprehensive offer meeting all university tender specifications, including 10 consultation vouchers (strictly capped at 100%), rate for 0-17 yrs: 310 JOD, rate for 18-65 yrs: 510 JOD, with 6.5% statutory fees.',
    feesDescriptionAr: 'رسوم إصدار 5% + طوابع واردات 1% + صندوق ضمان المؤمن لهم (البنك المركزي) 0.5%',
    feesDescriptionEn: '5% Issuance Fee + 1% Revenue Stamps + 0.5% Policyholders Guarantee Fund (Central Bank)',
    customNotesAr: 'فئة 0–17 سنة: 310 د، فئة 18–65 سنة: 510 د، فئة 66–75 سنة: 750 د، رسوم 6.5%',
    customNotesEn: 'Age 0-17: 310 JOD, Age 18-65: 510 JOD, Age 66-75: 750 JOD, Statutory fees: 6.5%',
    extraFeaturesAr: [
      { title: 'فحص طبي وقائي شامل للإدارة العليا', description: 'فحص دوري سنوي مجاني شامل للقيادات الإدارية والتنفيذية.' },
      { title: 'برنامج جوفيكو لرعاية كبار السن والمعالين', description: 'إدارة صحية مخصصة ومتابعة منزلية لكبار السن وأصحاب الأمراض المزمنة.' }
    ],
    extraFeaturesEn: [
      { title: 'Executive Health Screening', description: 'Free annual comprehensive health checkup for senior management.' },
      { title: 'JOFICO Parents Care Program', description: 'Specialized health management for elderly dependents and chronic cases.' }
    ],
    benefitTexts: {
      req_outpatient_visits: {
        rawTextAr: '10 كوبونات ونماذج كشف عيادات خارجية سنوياً لكل عضو مؤمن.',
        rawTextEn: '10 outpatient consultation vouchers/forms per covered member annually.',
        notesAr: 'يتجاوز المستهدف (يقدم 10 مقابل 8 مطلوبة). مسقوف بدقة عند 100% دون بونص إضافي.',
        notesEn: 'Exceeds target (offers 10 vs 8 needed). Strictly capped at 100% score (No bonus).'
      },
      req_annual_max_limit: {
        rawTextAr: 'سقف إجمالي سنوي 150,000 دينار/دولار لكل عضو.',
        rawTextEn: '$150,000 annual maximum aggregate limit per member.',
        notesAr: 'يتجاوز المستهدف (100 ألف)؛ الدرجة مسقوفة عند 100% كحد أقصى.',
        notesEn: 'Exceeds $100k target; score capped at maximum 100%.'
      },
      req_inpatient_room: {
        rawTextAr: 'تغطية كاملة لغرفة خاصة مفردة مع حمام مستقل ومرافق.',
        rawTextEn: 'Full coverage for Private Single Ensuite Room.',
        notesAr: 'مطابق للمستهدف تماماً (غرفة مفردة خاصة).',
        notesEn: 'Matches required target exactly (Private Single Room).',
        offeredValueAr: 'غرفة مفردة خاصة',
        offeredValueEn: 'Private Single Room'
      },
      req_outpatient_copay: {
        rawTextAr: '10% نسبة تحمل في العيادات والمراكز الطبية المعتمدة.',
        rawTextEn: '10% co-insurance at network clinics and medical centers.',
        notesAr: 'أفضل من الحد الأقصى المطلوب (15%)؛ يستحق درجة كاملة 100%.',
        notesEn: 'Better than 15% required max; receives 100% full score.'
      },
      req_prescription_drugs: {
        rawTextAr: 'مخصص سنوي 3,500 دينار/دولار للأدوية الموصوفة.',
        rawTextEn: '$3,500 annual pharmacy allowance.',
        notesAr: 'يتجاوز المطلوب (3,000)؛ يحصل على 100% مسقوف.',
        notesEn: 'Exceeds target ($3,000); receives strictly capped 100%.'
      },
      req_physio_sessions: {
        rawTextAr: '15 جلسة علاج طبيعي وتأهيلي سنوياً.',
        rawTextEn: 'Up to 15 rehabilitation & physiotherapy sessions per annum.',
        notesAr: 'يتجاوز الـ 12 جلسة المطلوبة؛ مسقوف عند 100%.',
        notesEn: 'Exceeds 12 sessions required; strictly capped at 100%.'
      },
      req_dental_limit: {
        rawTextAr: 'تغطية سنوية 1,500 دينار/دولار لعلاجات وجراحة الأسنان.',
        rawTextEn: '$1,500 standard dental package included.',
        notesAr: 'مطابق للمطلوب تماماً (1,500).',
        notesEn: 'Exact match with requirement ($1,500).'
      },
      req_optical_allowance: {
        rawTextAr: 'مخصص 350 دينار/دولار للإطارات والعدسات الطبية كل سنتين.',
        rawTextEn: '$350 frame and lenses allowance every 2 years.',
        notesAr: 'أعلى من المستهدف (300)؛ مسقوف عند 100%.',
        notesEn: 'Higher than target ($300); capped at 100%.'
      },
      req_maternity_normal: {
        rawTextAr: 'تغطية 7,000 دينار/دولار للولادة الطبيعية والرعاية السابقة واللاحقة.',
        rawTextEn: '$7,000 normal delivery and ante-natal care package.',
        notesAr: 'يتجاوز المستهدف (6,000)؛ مسقوف عند 100%.',
        notesEn: 'Exceeds target ($6,000); capped at 100%.'
      },
      req_direct_billing: {
        rawTextAr: 'دفع مباشر في كبرى المستشفيات والمراكز التخصصية المعتمدة.',
        rawTextEn: 'Direct billing at all Tier 1 hospitals & private medical centers.',
        notesAr: 'شبكة فئة أولى ممتازة كاملة مطابقة للمطلوب.',
        notesEn: 'Full Tier 1 Prime Network matching requirements.',
        offeredValueAr: 'شبكة الفئة الأولى الممتازة (Tier 1 Prime)',
        offeredValueEn: 'Tier 1 Prime Network'
      },
      req_telehealth_included: {
        rawTextAr: 'مشمول: استشارات طبية مرئية 24/7 عبر التطبيق الذكي مجاناً.',
        rawTextEn: 'Included: 24/7 JOFICO Click & TebFact virtual doctor consultations.',
        notesAr: 'مشمول بالكامل مجاناً.',
        notesEn: 'Fully included at no extra cost.'
      },
      req_emergency_evac: {
        rawTextAr: 'تغطية إخلاء طبي طارئ ونقل الجثمان حتى 100,000 دينار/دولار.',
        rawTextEn: 'Up to $100,000 worldwide air evacuation & repatriation.',
        notesAr: 'مطابق تماماً للمستهدف المطلوب.',
        notesEn: 'Exact match with required target.'
      }
    }
  },
  prop_meico: {
    companyNameAr: 'شركة الشرق الأوسط للتأمين (MEICO)',
    companyNameEn: 'Middle East Insurance Co. (MEICO)',
    planNameAr: 'برنامج التأمين الطبي الماسي المؤسسي',
    planNameEn: 'Corporate Diamond Medical Plan',
    networkNameAr: 'شبكة الشرق الأوسط الماسية المعتمدة (Platinum Network)',
    networkNameEn: 'MEICO Platinum Tier 1 Network',
    currencyAr: 'دينار أردني (JOD)',
    currencyEn: 'JOD (Jordanian Dinar)',
    executiveSummaryAr: 'عرض متميز بأعلى معايير الخدمة، 12 نموذج كشف (مسقوفة عند 100%)، سقف سنوي 200,000 د، قسط فئة 0-17: 405 د، وفئة 18-65: 755 د، رسوم 6.5%.',
    executiveSummaryEn: 'Premium high-tier offer with 12 consultation vouchers (capped at 100%), annual limit of 200,000 JOD, rate for 0-17: 405 JOD, rate for 18-65: 755 JOD, 6.5% fees.',
    feesDescriptionAr: 'رسوم إصدار 5% + طوابع واردات 1% + صندوق ضمان المؤمن لهم 0.5%',
    feesDescriptionEn: '5% Issuance Fee + 1% Revenue Stamps + 0.5% Policyholders Guarantee Fund',
    customNotesAr: 'فئة 0–17 سنة: 405 د، فئة 18–65 سنة: 755 د، فئة 66–75 سنة: 1,100 د، رسوم 6.5%',
    customNotesEn: 'Age 0-17: 405 JOD, Age 18-65: 755 JOD, Age 66-75: 1,100 JOD, Fees: 6.5%',
    extraFeaturesAr: [
      { title: 'توصيل الأدوية الشهرية للأمراض المزمنة مجاناً', description: 'خدمة إيصال أدوية الأمراض المزمنة إلى مقر العمل أو المنزل شهرياً مجاناً.' },
      { title: 'خط مساعدة طبي وتنسيق طوارئ VIP', description: 'تنسيق مواعيد ودخول المستشفيات مع مدير حساب طبي مخصص على مدار 24 ساعة.' }
    ],
    extraFeaturesEn: [
      { title: 'Free Chronic Medication Home Delivery', description: 'Door-to-door monthly delivery of chronic prescriptions to office or home.' },
      { title: 'VIP Medical Concierge & 24/7 Hotline', description: 'Dedicated priority healthcare manager for appointments and hospital admissions.' }
    ],
    benefitTexts: {
      req_outpatient_visits: {
        rawTextAr: '12 نموذج وكوبون كشف عيادات خارجية سنوياً لكل عضو.',
        rawTextEn: '12 outpatient doctor consultation coupons per member per year.',
        notesAr: 'يتجاوز المستهدف (12 مقابل 8). مسقوف بصرامة عند 100% دون زيادة نقاط.',
        notesEn: 'Exceeds requirement (12 vs 8). Strictly capped at 100% with no score inflation.'
      },
      req_annual_max_limit: {
        rawTextAr: 'سقف إجمالي سنوي 200,000 دينار/دولار لكل عضو.',
        rawTextEn: '$200,000 annual aggregate limit per member.',
        notesAr: 'يتجاوز المستهدف (100 ألف)؛ مسقوف عند 100%.',
        notesEn: 'Exceeds target ($100k); capped at 100%.'
      },
      req_inpatient_room: {
        rawTextAr: 'جناح VIP خاص أو غرفة مفردة ديلوكس في جميع المستشفيات المعتمدة.',
        rawTextEn: 'VIP Suite / Private Deluxe Single Room in all approved hospitals.',
        notesAr: 'يتجاوز المفردة العادية؛ مسقوف عند 100%.',
        notesEn: 'Exceeds normal single; capped at 100%.',
        offeredValueAr: 'جناح VIP / مفردة خاصة',
        offeredValueEn: 'VIP Suite / Private Single'
      },
      req_outpatient_copay: {
        rawTextAr: '5% فقط نسبة تحمل في العيادات والمراكز المعتمدة.',
        rawTextEn: 'Only 5% copay at all accredited clinics.',
        notesAr: 'ممتاز جداً (أقل بكثير من سقف الـ 15%)؛ يستحق 100%.',
        notesEn: 'Excellent (well below 15% ceiling); earns 100%.'
      },
      req_prescription_drugs: {
        rawTextAr: 'مخصص سنوي 5,000 دينار/دولار للأدوية الموصوفة.',
        rawTextEn: '$5,000 annual prescription medications ceiling.',
        notesAr: 'يتجاوز المستهدف (3,000)؛ مسقوف عند 100%.',
        notesEn: 'Exceeds target ($3,000); capped at 100%.'
      },
      req_physio_sessions: {
        rawTextAr: '20 جلسة علاج طبيعي وتأهيلي سنوياً.',
        rawTextEn: 'Up to 20 physiotherapy sessions annually.',
        notesAr: 'يتجاوز الـ 12 جلسة المطلوبة؛ مسقوف عند 100%.',
        notesEn: 'Exceeds 12 sessions required; capped at 100%.'
      },
      req_dental_limit: {
        rawTextAr: 'سقف 2,500 دينار/دولار لعلاجات الأسنان.',
        rawTextEn: '$2,500 comprehensive dental package.',
        notesAr: 'يتجاوز المستهدف (1,500)؛ مسقوف عند 100%.',
        notesEn: 'Exceeds target ($1,500); capped at 100%.'
      },
      req_optical_allowance: {
        rawTextAr: 'مخصص 500 دينار/دولار للإطارات والعدسات كل سنتين.',
        rawTextEn: '$500 optical frame and corrective lenses allowance.',
        notesAr: 'يتجاوز المستهدف (300)؛ مسقوف عند 100%.',
        notesEn: 'Exceeds target ($300); capped at 100%.'
      },
      req_maternity_normal: {
        rawTextAr: 'تغطية 10,000 دينار/دولار للولادة الطبيعية والقيصرية.',
        rawTextEn: '$10,000 maternity & childbirth allowance.',
        notesAr: 'يتجاوز المستهدف (6,000)؛ مسقوف عند 100%.',
        notesEn: 'Exceeds target ($6,000); capped at 100%.'
      },
      req_direct_billing: {
        rawTextAr: 'شبكة الشرق الأوسط الماسية الأولى (VIP Prime Network).',
        rawTextEn: 'Tier 1 Premier VIP Direct Settlement Network.',
        notesAr: 'مطابق للمستهدف بنسبة 100%.',
        notesEn: '100% match with requirement.',
        offeredValueAr: 'شبكة الفئة الأولى الممتازة (Tier 1 Prime)',
        offeredValueEn: 'Tier 1 Prime Network'
      },
      req_telehealth_included: {
        rawTextAr: 'مشمول: استشارات طبية عن بعد مجانية 24/7 عبر تطبيق MEICO Health.',
        rawTextEn: 'Included: 24/7 unlimited virtual consultations via MEICO Health.',
        notesAr: 'مشمول بالكامل مجاناً.',
        notesEn: 'Fully included.'
      },
      req_emergency_evac: {
        rawTextAr: 'إخلاء طبي دولي وإقليمي حتى 150,000 دينار/دولار.',
        rawTextEn: 'Up to $150,000 air ambulance & repatriation.',
        notesAr: 'يتجاوز المستهدف (100 ألف)؛ مسقوف عند 100%.',
        notesEn: 'Exceeds target ($100k); capped at 100%.'
      }
    }
  },
  prop_gig: {
    companyNameAr: 'مجموعة الخليج للتأمين - الأردن (GIG Jordan)',
    companyNameEn: 'Gulf Insurance Group - Jordan (GIG)',
    planNameAr: 'برنامج بلسم بلس الصحي المؤسسي',
    planNameEn: 'Balsam Plus Corporate Health Plan',
    networkNameAr: 'شبكة الخليج للتأمين المباشرة المعتمدة',
    networkNameEn: 'GIG Direct Medical Network',
    currencyAr: 'دينار أردني (JOD)',
    currencyEn: 'JOD (Jordanian Dinar)',
    executiveSummaryAr: 'عرض منافس مطابق لاشتراطات الكراسة تماماً، 8 نماذج كشف (100% مطابقة)، قسط فئة 0-17: 340 د، وفئة 18-65: 545 د، رسوم 6.0%.',
    executiveSummaryEn: 'Competitive offer exactly matching tender requirements, 8 consultation vouchers (100% exact match), rate for 0-17: 340 JOD, rate for 18-65: 545 JOD, 6.0% fees.',
    feesDescriptionAr: 'رسوم إصدار 4.5% + طوابع 1% + صندوق ضمان 0.5%',
    feesDescriptionEn: '4.5% Issuance Fee + 1% Stamps + 0.5% Guarantee Fund',
    customNotesAr: 'فئة 0–17 سنة: 340 د، فئة 18–65 سنة: 545 د، فئة 66–75 سنة: 820 د، رسوم 6.0%',
    customNotesEn: 'Age 0-17: 340 JOD, Age 18-65: 545 JOD, Age 66-75: 820 JOD, Fees: 6.0%',
    extraFeaturesAr: [
      { title: 'برنامج الخصومات الطبية في شبكة العافية', description: 'خصومات تصل إلى 40% على خدمات التجميل والليزر واللياقة غير المغطاة بالوثيقة.' },
      { title: 'تطبيق جي آي جي الطبي للهواتف الذكية', description: 'إصدار موافقات فورية وبطاقة تأمين رقمية وتتبع المطالبات لحظياً.' }
    ],
    extraFeaturesEn: [
      { title: 'GIG Wellness Network Discount Card', description: 'Up to 40% discount on non-covered cosmetic, laser, and gym wellness services.' },
      { title: 'GIG Mobile Health App', description: 'Instant digital approvals, virtual insurance card, and real-time claim tracker.' }
    ],
    benefitTexts: {
      req_outpatient_visits: {
        rawTextAr: '8 نماذج وكوبونات كشف عيادات خارجية سنوياً لكل عضو.',
        rawTextEn: '8 consultation vouchers per employee & dependent annually.',
        notesAr: 'مطابق للمطلوب تماماً (8 مقابل 8 مطلوبة). درجة كاملة 100%.',
        notesEn: 'Exact match with requirement (8 vs 8 needed). Full 100% score.'
      },
      req_annual_max_limit: {
        rawTextAr: 'سقف إجمالي سنوي 100,000 دينار/دولار لكل عضو.',
        rawTextEn: '$100,000 annual maximum coverage per member.',
        notesAr: 'مطابق للمستهدف تماماً (100 ألف).',
        notesEn: 'Exact match with target ($100k).'
      },
      req_inpatient_room: {
        rawTextAr: 'غرفة خاصة مفردة في جميع المستشفيات المعتمدة.',
        rawTextEn: 'Private Single Room with en-suite bath.',
        notesAr: 'مطابق للمطلوب تماماً (غرفة مفردة خاصة).',
        notesEn: 'Exact match (Private Single Room).',
        offeredValueAr: 'غرفة مفردة خاصة',
        offeredValueEn: 'Private Single Room'
      },
      req_outpatient_copay: {
        rawTextAr: '15% نسبة تحمل في العيادات الخارجية.',
        rawTextEn: '15% co-insurance at network clinics.',
        notesAr: 'مطابق للحد الأقصى المسموح به (15%) تماماً.',
        notesEn: 'Meets maximum allowed threshold (15%) exactly.'
      },
      req_prescription_drugs: {
        rawTextAr: 'سقف 3,000 دينار/دولار للأدوية الموصوفة.',
        rawTextEn: '$3,000 annual pharmacy drug limit.',
        notesAr: 'مطابق للمستهدف المطلوب تماماً.',
        notesEn: 'Exact match with target.'
      },
      req_physio_sessions: {
        rawTextAr: '12 جلسة علاج طبيعي سنوياً.',
        rawTextEn: '12 physical therapy sessions per year.',
        notesAr: 'مطابق للمستهدف المطلوب تماماً.',
        notesEn: 'Exact match with required target.'
      },
      req_dental_limit: {
        rawTextAr: 'سقف 1,500 دينار/دولار لعلاجات الأسنان.',
        rawTextEn: '$1,500 dental treatment limit.',
        notesAr: 'مطابق للمستهدف المطلوب تماماً.',
        notesEn: 'Exact match with required target.'
      },
      req_optical_allowance: {
        rawTextAr: 'مخصص 300 دينار/دولار للبصريات كل سنتين.',
        rawTextEn: '$300 eyewear allowance every 2 years.',
        notesAr: 'مطابق للمستهدف المطلوب تماماً.',
        notesEn: 'Exact match with required target.'
      },
      req_maternity_normal: {
        rawTextAr: 'سقف 6,000 دينار/دولار للولادة الطبيعية.',
        rawTextEn: '$6,000 normal delivery benefit.',
        notesAr: 'مطابق للمستهدف المطلوب تماماً.',
        notesEn: 'Exact match with required target.'
      },
      req_direct_billing: {
        rawTextAr: 'شبكة الفئة الأولى الممتازة (Tier 1 Prime Network).',
        rawTextEn: 'Tier 1 Prime Hospital Network.',
        notesAr: 'مطابق تماماً لدرجة الشبكة المطلوبة.',
        notesEn: 'Exact match with required network tier.',
        offeredValueAr: 'شبكة الفئة الأولى الممتازة (Tier 1 Prime)',
        offeredValueEn: 'Tier 1 Prime Network'
      },
      req_telehealth_included: {
        rawTextAr: 'مشمول: استشارات طبية عن بعد مجانية 24/7 عبر تطبيق GIG Smart.',
        rawTextEn: 'Included: 24/7 virtual doctor consultations via GIG Smart.',
        notesAr: 'مشمول بالكامل مجاناً.',
        notesEn: 'Fully included.'
      },
      req_emergency_evac: {
        rawTextAr: 'إخلاء طبي طارئ ونقل الجثمان حتى 100,000 دينار/دولار.',
        rawTextEn: '$100,000 emergency evacuation & repatriation.',
        notesAr: 'مطابق تماماً للمستهدف المطلوب.',
        notesEn: 'Exact match with required target.'
      }
    }
  },
  prop_jerusalem: {
    companyNameAr: 'شركة القدس للتأمين (Jerusalem Insurance)',
    companyNameEn: 'Jerusalem Insurance Co.',
    planNameAr: 'برنامج الحماية الشاملة للرعاية الطبية',
    planNameEn: 'Comprehensive Health Protection Plan',
    networkNameAr: 'شبكة القدس للتأمين الطبية (الفئة الأولى)',
    networkNameEn: 'Jerusalem Ins. Tier 1 Network',
    currencyAr: 'دينار أردني (JOD)',
    currencyEn: 'JOD (Jordanian Dinar)',
    executiveSummaryAr: 'عرض اقتصادي مع عجز طفيف: 6 نماذج كشف فقط (أقل من الـ 8 المطلوبة، درجة 3.75/5)، قسط فئة 0-17: 290 د، وفئة 18-65: 480 د، رسوم 6.5%.',
    executiveSummaryEn: 'Budget proposal with a minor gap: only 6 consultation vouchers (below the 8 required, 3.75/5 score), rate for 0-17: 290 JOD, rate for 18-65: 480 JOD, 6.5% fees.',
    feesDescriptionAr: 'رسوم إصدار 5% + طوابع 1% + صندوق ضمان 0.5%',
    feesDescriptionEn: '5% Issuance Fee + 1% Stamps + 0.5% Guarantee Fund',
    customNotesAr: 'فئة 0–17 سنة: 290 د، فئة 18–65 سنة: 480 د، فئة 66–75 سنة: 710 د، رسوم 6.5%',
    customNotesEn: 'Age 0-17: 290 JOD, Age 18-65: 480 JOD, Age 66-75: 710 JOD, Fees: 6.5%',
    extraFeaturesAr: [
      { title: 'تطعيمات الإنفلونزا الموسمية المجانية', description: 'حملة تطعيم سنوية مجانية ضد الإنفلونزا الموسمية بمقر المؤسسة لجميع الموظفين.' }
    ],
    extraFeaturesEn: [
      { title: 'Free Seasonal Flu Vaccination', description: 'Annual onsite seasonal influenza vaccination campaign at company premises.' }
    ],
    benefitTexts: {
      req_outpatient_visits: {
        rawTextAr: '6 نماذج كشف فقط سنوياً لكل عضو مؤمن (يقل عن المطلوب).',
        rawTextEn: '6 outpatient consultation forms per member per year (below target).',
        notesAr: 'عجز جزئي (يقدم 6 مقابل 8 مطلوبة). يحصل على نسبة 75% فقط (3.75/5).',
        notesEn: 'Partial deficit (offers 6 vs 8 required). Receives only 75% score (3.75/5).'
      },
      req_annual_max_limit: {
        rawTextAr: 'سقف إجمالي سنوي 80,000 دينار/دولار لكل عضو (أقل من الـ 100 ألف).',
        rawTextEn: '$80,000 annual aggregate limit per member (below $100k target).',
        notesAr: 'عجز طفيف في السقف السنوي (يقدم 80 ألف مقابل 100 ألف). درجة 80%.',
        notesEn: 'Minor deficit in annual limit (offers $80k vs $100k). 80% score.'
      },
      req_inpatient_room: {
        rawTextAr: 'غرفة مشتركة (سريران) مع إمكانية الترقية بفارق سعري.',
        rawTextEn: 'Semi-Private Room (2-bed shared) with upgrade option.',
        notesAr: 'أقل من المطلوب (غرفة مشتركة بدلاً من مفردة خاصة). درجة 60%.',
        notesEn: 'Below required standard (shared room instead of private single). 60% score.',
        offeredValueAr: 'غرفة مشتركة (سريران)',
        offeredValueEn: 'Semi-Private (Shared 2-bed)'
      },
      req_outpatient_copay: {
        rawTextAr: '20% نسبة تحمل في العيادات الخارجية (أعلى من الـ 15% المطلوبة).',
        rawTextEn: '20% copay in outpatient clinics (higher than 15% limit).',
        notesAr: 'نسبة تحمل أعلى من الحد الأقصى المشترط (20% مقابل 15%). غرامة نقاط.',
        notesEn: 'Higher copay than maximum allowed threshold (20% vs 15%). Score penalized.'
      },
      req_prescription_drugs: {
        rawTextAr: 'سقف سنوي 2,500 دينار/دولار للأدوية.',
        rawTextEn: '$2,500 annual prescription drugs limit.',
        notesAr: 'أقل من المستهدف (2,500 مقابل 3,000). درجة 83.3%.',
        notesEn: 'Below target ($2,500 vs $3,000). 83.3% score.'
      },
      req_physio_sessions: {
        rawTextAr: '10 جلسات علاج طبيعي سنوياً.',
        rawTextEn: '10 physiotherapy sessions per year.',
        notesAr: 'أقل من الـ 12 جلسة المطلوبة. درجة 83.3%.',
        notesEn: 'Below 12 sessions required. 83.3% score.'
      },
      req_dental_limit: {
        rawTextAr: 'سقف 1,000 دينار/دولار لعلاجات الأسنان.',
        rawTextEn: '$1,000 dental allowance.',
        notesAr: 'أقل من المستهدف (1,000 مقابل 1,500). درجة 66.7%.',
        notesEn: 'Below target ($1,000 vs $1,500). 66.7% score.'
      },
      req_optical_allowance: {
        rawTextAr: 'مخصص 200 دينار/دولار للبصريات كل سنتين.',
        rawTextEn: '$200 optical allowance every 2 years.',
        notesAr: 'أقل من المستهدف (200 مقابل 300). درجة 66.7%.',
        notesEn: 'Below target ($200 vs $300). 66.7% score.'
      },
      req_maternity_normal: {
        rawTextAr: 'سقف 5,000 دينار/دولار للولادة الطبيعية.',
        rawTextEn: '$5,000 normal delivery benefit.',
        notesAr: 'أقل من المستهدف (5,000 مقابل 6,000). درجة 83.3%.',
        notesEn: 'Below target ($5,000 vs $6,000). 83.3% score.'
      },
      req_direct_billing: {
        rawTextAr: 'شبكة القدس الطبية (فئة ثانية موسعة).',
        rawTextEn: 'Jerusalem Network Tier 2 Comprehensive.',
        notesAr: 'شبكة فئة ثانية بدلاً من الفئة الأولى الممتازة المشترطة. درجة 70%.',
        notesEn: 'Tier 2 network instead of required Tier 1 Prime. 70% score.',
        offeredValueAr: 'شبكة فئة ثانية شاملة',
        offeredValueEn: 'Tier 2 Comprehensive Network'
      },
      req_telehealth_included: {
        rawTextAr: 'غير مشمول: لا تتوفر خدمة الاستشارات عن بعد حالياً.',
        rawTextEn: 'Not included: Telehealth app is currently not available.',
        notesAr: 'بند غير مشمول (0%).',
        notesEn: 'Not included (0% score).'
      },
      req_emergency_evac: {
        rawTextAr: 'إخلاء طبي محلي فقط حتى 50,000 دينار/دولار.',
        rawTextEn: 'Local evacuation only up to $50,000.',
        notesAr: 'أقل من المستهدف (50 ألف مقابل 100 ألف). درجة 50%.',
        notesEn: 'Below target ($50k vs $100k). 50% score.'
      }
    }
  }
};

// ============================================================================
// 4. TEMPLATES & PROJECTS TRANSLATION
// ============================================================================

export const TEMPLATE_TRANSLATIONS: Record<string, {
  nameAr: string;
  nameEn: string;
  categoryAr: string;
  categoryEn: string;
  descriptionAr: string;
  descriptionEn: string;
}> = {
  corporate_health: {
    nameAr: 'كراسة منافع التأمين الطبي المؤسسي (RFP)',
    nameEn: 'Corporate Health & Medical Benefits (RFP)',
    categoryAr: 'التأمين الطبي والصحي',
    categoryEn: 'Health & Medical',
    descriptionAr: 'كراسة شروط ومواصفات التأمين الطبي الجماعي تشمل كشوفات العيادات، سقوف التنويم، الأمومة، الأسنان، وشبكات المستشفيات.',
    descriptionEn: 'Standard group health insurance tender with outpatient visits, inpatient limits, maternity, dental, and network tiers.'
  },
  group_life: {
    nameAr: 'خطة التأمين الجماعي على الحياة والحوادث الشخصية',
    nameEn: 'Group Life & Personal Accident Plan',
    categoryAr: 'الحياة والحوادث الشخصية',
    categoryEn: 'Life & Accident',
    descriptionAr: 'برنامج حماية الموظفين يشمل تغطية الوفاة الطبيعية، مضاعف الحوادث، العجز الكلي الدائم، والأمراض الحرجة.',
    descriptionEn: 'Employee protection benefits for death, accidental injury, permanent total disability, and critical illnesses.'
  },
  commercial_fleet: {
    nameAr: 'وثيقة تأمين أسطول المركبات والسيارات التجارية',
    nameEn: 'Commercial Vehicle Fleet & Motor Cover',
    categoryAr: 'الممتلكات وأساطيل المركبات',
    categoryEn: 'Property & Fleet',
    descriptionAr: 'تأمين شامل لأساطيل مركبات الشركة يشمل المسؤولية المدنية، الإصلاح بالوكالة، والسيارة البديلة.',
    descriptionEn: 'Comprehensive motor insurance for company fleet vehicles, third-party liability, agency repairs, and replacement car days.'
  }
};

export const PROJECT_TRANSLATIONS: Record<string, {
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
  conditionsFileNameAr: string;
  conditionsFileNameEn: string;
  conditionsTextAr: string;
  conditionsTextEn: string;
}> = {
  proj_2025_2026: {
    nameAr: 'مناقصة التأمين الطبي لمنسوبي الجامعة 2025-2026',
    nameEn: 'University Staff Medical Insurance Tender 2025-2026',
    descriptionAr: 'المشروع النشط للعام الحالي لمقارنة عروض شركات التأمين',
    descriptionEn: 'Active fiscal year project for benchmarking insurer proposals',
    conditionsFileNameAr: 'كراسة شروط ومواصفات التأمين الطبي للجامعة (معتمدة)',
    conditionsFileNameEn: 'University Medical Insurance RFP Specifications (Approved)',
    conditionsTextAr: `كراسة الشروط والمواصفات ومحددات السقوف لبرنامج التأمين الطبي لمنسوبي الجامعة:
١. نماذج وكشوفات العيادات الخارجية: يجب ألا يقل عدد نماذج/زيارات الكشف الطبي عن 8 نماذج كشف سنوياً للموظف والتابع كحد أدنى إلزامي (أي شركة تقدم 8 نماذج أو أكثر تحصل على الدرجة الكاملة 5/5 دون أي بونص إضافي).
٢. سقف التغطية السنوية لكل شخص: الحد الأقصى للتغطية السنوية الإجمالية هو 150,000 ريال/دينار لكل عضو سنوياً كحد أدنى مطلوب.
٣. نسبة التحمل في العيادات الخارجية: الحد الأقصى لنسبة تحمل الموظف في العيادات الخارجية هو 10% فقط وبحد أقصى 50 ريال للاستشارة.
٤. الإقامة في المستشفيات وفئة غرفة التنويم: غرفة مفردة خاصة (Private Single Room) مع تغطية كاملة لمرافق المريض للأعمار تحت 12 سنة.
٥. العناية المركزة وحالات الطوارئ: تغطية بنسبة 100% بدون أي فترات انتظار ودون اشتراط موافقة مسبقة في الطوارئ.
٦. الأدوية والعلاجات الصيدلانية: سقف سنوي 5,000 للأدوية مع تغطية كاملة للأمراض المزمنة دون شروط إضافية.
٧. علاج وجراحة الأسنان: سقف 3,000 سنوياً شامل الحشوات وتنظيف الأسنان وعلاج الجذور وخلع الأسنان.
٨. النظارات الطبية والإطارات البصرية: مخصص 800 كل سنتين للإطارات والعدسات الطبية.
٩. تغطية الأمومة والولادة ورعاية المواليد: سقف 20,000 للولادة الطبيعية والقيصرية ومضاعفات الحمل.
١٠. الشبكة الطبية المعتمدة: شبكة الفئة الأولى الممتازة (Tier 1 Prime) تشمل كبرى المستشفيات والمراكز التخصصية.`,
    conditionsTextEn: `Terms, Conditions & Sub-limit Specifications for the University Staff Medical Insurance Program:
1. Outpatient Consultation Forms / Visits: Shall not be less than 8 consultation vouchers/visits per year per employee/dependent as an essential mandatory minimum (any company offering 8 or more receives a full 5/5 score with zero extra bonus).
2. Annual Maximum Aggregate Limit per Member: The overall annual maximum coverage is 150,000 SAR/JOD per member per year as a required minimum.
3. Outpatient Copayment / Co-insurance: Maximum employee copay at outpatient clinics is 10% capped at 50 per consultation.
4. Inpatient Hospital Accommodation & Room Category: Private Single Room with full companion accommodation for dependents under 12 years.
5. Emergency Care & ICU: 100% coverage without waiting periods or prior approval for emergency cases.
6. Prescription Drugs & Pharmacy: Annual limit of 5,000 for medications with full chronic disease coverage without extra conditions.
7. Dental Treatment & Oral Surgery: Annual limit of 3,000 including routine checkups, fillings, scaling, root canals, and extractions.
8. Optical & Eyewear Allowance: 800 every two years for prescription frames and optical lenses.
9. Maternity & Newborn Care: 20,000 limit for normal and c-section delivery and pregnancy complications.
10. Approved Medical Network: Tier 1 Prime Network including major tertiary hospitals and specialized medical centers.`
  },
  proj_2024_2025: {
    nameAr: 'مناقصة التأمين الطبي (أرشيف 2024)',
    nameEn: 'Medical Insurance Tender (Archive 2024)',
    descriptionAr: 'أرشيف السنة السابقة للمقارنة والرجوع',
    descriptionEn: 'Previous year archive for benchmark and reference',
    conditionsFileNameAr: 'كراسة شروط ومواصفات مناقصة عام 2024 السابقة',
    conditionsFileNameEn: 'Previous Year 2024 RFP Specifications Document',
    conditionsTextAr: 'كراسة شروط ومواصفات مناقصة عام 2024 السابقة لأغراض الأرشفة والمقارنة...',
    conditionsTextEn: 'Previous year 2024 tender terms and conditions archive for reference...'
  }
};

// ============================================================================
// 5. HELPER LOCALIZATION FUNCTIONS
// ============================================================================

/**
 * Localizes a single BenefitRequirement object to the active language
 */
export function localizeRequirement(req: BenefitRequirement, lang: Language): BenefitRequirement {
  if (!req) return req;

  // Check if req explicitly carries bilingual properties
  let name = lang === 'ar' ? req.nameAr : req.nameEn;
  let category = lang === 'ar' ? req.categoryAr : req.categoryEn;
  let unit = lang === 'ar' ? req.unitAr : req.unitEn;
  let description = lang === 'ar' ? req.descriptionAr : req.descriptionEn;
  let targetVal = lang === 'ar' ? req.targetValueAr : req.targetValueEn;

  // Check known benefit IDs in BILINGUAL_BENEFITS
  const known = BILINGUAL_BENEFITS[req.id];
  if (known) {
    name = name || (lang === 'ar' ? known.nameAr : known.nameEn);
    category = category || (lang === 'ar' ? known.categoryAr : known.categoryEn);
    unit = unit || (lang === 'ar' ? known.unitAr : known.unitEn);
    description = description || (lang === 'ar' ? known.descriptionAr : known.descriptionEn);
    if (known.targetValueAr !== undefined && known.targetValueEn !== undefined) {
      targetVal = targetVal ?? (lang === 'ar' ? known.targetValueAr : known.targetValueEn);
    }
  }

  // Check 72-point names dictionary
  const known72 = BENEFIT_72_NAMES[req.id];
  if (known72) {
    name = name || (lang === 'ar' ? known72.ar : known72.en);
  }

  // Fallback for name: string dictionary match
  if (!name) {
    const rawName = (req.name || '').trim();
    const lowerName = rawName.toLowerCase();
    for (const def of Object.values(BILINGUAL_BENEFITS)) {
      if (def.nameAr.toLowerCase() === lowerName || def.nameEn.toLowerCase() === lowerName) {
        name = lang === 'ar' ? def.nameAr : def.nameEn;
        break;
      }
    }
    if (!name) {
      for (const def72 of Object.values(BENEFIT_72_NAMES)) {
        if (def72.ar.toLowerCase() === lowerName || def72.en.toLowerCase() === lowerName) {
          name = lang === 'ar' ? def72.ar : def72.en;
          break;
        }
      }
    }
    if (!name) name = rawName;
  }

  // Fallback for category
  if (!category) {
    const rawCat = (req.category || '').trim();
    const lowerCat = rawCat.toLowerCase();
    const catEntry = CATEGORY_TRANSLATIONS[lowerCat];
    if (catEntry) {
      category = lang === 'ar' ? catEntry.ar : catEntry.en;
    } else {
      category = rawCat;
    }
  }

  // Fallback for unit
  if (!unit) {
    const rawUnit = (req.unit || '').trim();
    const lowerUnit = rawUnit.toLowerCase();
    const unitEntry = UNIT_TRANSLATIONS[lowerUnit];
    if (unitEntry) {
      unit = lang === 'ar' ? unitEntry.ar : unitEntry.en;
    } else {
      unit = rawUnit;
    }
  }

  // Fallback for qualitative target value
  let finalTargetVal = targetVal !== undefined ? targetVal : req.targetValue;
  if (typeof finalTargetVal === 'string') {
    const lowerVal = finalTargetVal.trim().toLowerCase();
    const valEntry = VALUE_TRANSLATIONS[lowerVal];
    if (valEntry) {
      finalTargetVal = lang === 'ar' ? valEntry.ar : valEntry.en;
    }
  }

  return {
    ...req,
    name: name || req.name,
    category: category || req.category,
    unit: unit || req.unit,
    targetValue: finalTargetVal,
    description: description || req.description,
    nameAr: req.nameAr || (known ? known.nameAr : undefined),
    nameEn: req.nameEn || (known ? known.nameEn : undefined),
    categoryAr: req.categoryAr || (known ? known.categoryAr : undefined),
    categoryEn: req.categoryEn || (known ? known.categoryEn : undefined),
    unitAr: req.unitAr || (known ? known.unitAr : undefined),
    unitEn: req.unitEn || (known ? known.unitEn : undefined),
    descriptionAr: req.descriptionAr || (known ? known.descriptionAr : undefined),
    descriptionEn: req.descriptionEn || (known ? known.descriptionEn : undefined)
  };
}

/**
 * Localizes a list of BenefitRequirements
 */
export function localizeRequirements(requirements: BenefitRequirement[], lang: Language): BenefitRequirement[] {
  if (!Array.isArray(requirements)) return [];
  return requirements.map(r => localizeRequirement(r, lang));
}

/**
 * Localizes a single CompanyProposal object
 */
export function localizeProposal(prop: CompanyProposal, lang: Language): CompanyProposal {
  if (!prop) return prop;

  const bilingual = BILINGUAL_PROPOSALS[prop.id];

  let companyName = lang === 'ar' ? prop.companyNameAr : prop.companyNameEn;
  let planName = lang === 'ar' ? prop.planNameAr : prop.planNameEn;
  let networkName = lang === 'ar' ? prop.networkNameAr : prop.networkNameEn;
  let currency = lang === 'ar' ? prop.currencyAr : prop.currencyEn;
  let executiveSummary = lang === 'ar' ? prop.executiveSummaryAr : prop.executiveSummaryEn;

  if (bilingual) {
    companyName = companyName || (lang === 'ar' ? bilingual.companyNameAr : bilingual.companyNameEn);
    planName = planName || (lang === 'ar' ? bilingual.planNameAr : bilingual.planNameEn);
    networkName = networkName || (lang === 'ar' ? bilingual.networkNameAr : bilingual.networkNameEn);
    currency = currency || (lang === 'ar' ? bilingual.currencyAr : bilingual.currencyEn);
    executiveSummary = executiveSummary || (lang === 'ar' ? bilingual.executiveSummaryAr : bilingual.executiveSummaryEn);
  }

  // Localize extra features
  let extraFeatures = prop.extraFeatures;
  if (bilingual) {
    extraFeatures = lang === 'ar' ? bilingual.extraFeaturesAr : bilingual.extraFeaturesEn;
  }

  // Localize pricing structure texts
  let pricingStructure = prop.pricingStructure;
  if (pricingStructure && bilingual) {
    pricingStructure = {
      ...pricingStructure,
      feesBreakdown: pricingStructure.feesBreakdown ? {
        ...pricingStructure.feesBreakdown,
        description: lang === 'ar' ? bilingual.feesDescriptionAr : bilingual.feesDescriptionEn
      } : undefined,
      customNotes: lang === 'ar' ? bilingual.customNotesAr : bilingual.customNotesEn
    };
  }

  // Localize offered benefits
  const newBenefits: Record<string, OfferedBenefitData> = {};
  const rawBenefits = prop.benefits || {};

  for (const [key, bData] of Object.entries(rawBenefits)) {
    let rawText = lang === 'ar' ? bData.rawTextAr : bData.rawTextEn;
    let notes = lang === 'ar' ? bData.notesAr : bData.notesEn;
    let offeredVal = bData.offeredValue;

    if (bilingual && bilingual.benefitTexts[key]) {
      const bInfo = bilingual.benefitTexts[key];
      rawText = rawText || (lang === 'ar' ? bInfo.rawTextAr : bInfo.rawTextEn);
      notes = notes || (lang === 'ar' ? bInfo.notesAr : bInfo.notesEn);
      if (bInfo.offeredValueAr !== undefined && bInfo.offeredValueEn !== undefined) {
        offeredVal = lang === 'ar' ? bInfo.offeredValueAr : bInfo.offeredValueEn;
      }
    }

    if (typeof offeredVal === 'string') {
      const lowerVal = offeredVal.trim().toLowerCase();
      const valEntry = VALUE_TRANSLATIONS[lowerVal];
      if (valEntry) {
        offeredVal = lang === 'ar' ? valEntry.ar : valEntry.en;
      }
    }

    newBenefits[key] = {
      ...bData,
      rawText: rawText || bData.rawText,
      notes: notes || bData.notes,
      offeredValue: offeredVal
    };
  }

  const finalCompanyName = companyName || localizeCompanyName(prop?.companyName || '', lang);
  const finalPlanName = planName || localizePlanName(prop?.planName || '', lang);

  // Localize forensic tender terms & conditions
  const localizedTerms = prop.tenderTermsAnalysis 
    ? getLocalizedTerms(prop, lang) 
    : undefined;

  return {
    ...prop,
    companyName: finalCompanyName,
    planName: finalPlanName,
    networkName: networkName || prop.networkName,
    currency: currency || prop.currency,
    executiveSummary: executiveSummary || prop.executiveSummary,
    extraFeatures,
    pricingStructure,
    tenderTermsAnalysis: localizedTerms,
    benefits: newBenefits
  };
}

/**
 * Localizes a list of CompanyProposals
 */
export function localizeProposals(proposals: CompanyProposal[], lang: Language): CompanyProposal[] {
  if (!Array.isArray(proposals)) return [];
  return proposals.map(p => localizeProposal(p, lang));
}

/**
 * Localizes a PresetTemplate
 */
export function localizeTemplate(tmpl: PresetTemplate, lang: Language): PresetTemplate {
  if (!tmpl) return tmpl;
  const tInfo = TEMPLATE_TRANSLATIONS[tmpl.id];

  const name = tInfo ? (lang === 'ar' ? tInfo.nameAr : tInfo.nameEn) : tmpl.name;
  const category = tInfo ? (lang === 'ar' ? tInfo.categoryAr : tInfo.categoryEn) : tmpl.category;
  const description = tInfo ? (lang === 'ar' ? tInfo.descriptionAr : tInfo.descriptionEn) : tmpl.description;

  return {
    ...tmpl,
    name,
    category,
    description,
    requirements: localizeRequirements(tmpl.requirements, lang)
  };
}

/**
 * Localizes a TenderProject
 */
export function localizeProject(proj: TenderProject, lang: Language): TenderProject {
  if (!proj) return proj;
  const pInfo = PROJECT_TRANSLATIONS[proj.id];

  const name = pInfo ? (lang === 'ar' ? pInfo.nameAr : pInfo.nameEn) : proj.name;
  const description = pInfo ? (lang === 'ar' ? pInfo.descriptionAr : pInfo.descriptionEn) : proj.description;
  const conditionsFileName = pInfo ? (lang === 'ar' ? pInfo.conditionsFileNameAr : pInfo.conditionsFileNameEn) : proj.conditionsFileName;
  const conditionsText = pInfo && (!proj.conditionsFileBase64)
    ? (lang === 'ar' ? pInfo.conditionsTextAr : pInfo.conditionsTextEn)
    : proj.conditionsText;

  return {
    ...proj,
    name,
    description,
    conditionsFileName,
    conditionsText,
    requirements: localizeRequirements(proj.requirements, lang),
    proposals: localizeProposals(proj.proposals, lang),
    excelBenefits: localizeRequirements(proj.excelBenefits, lang)
  };
}

/**
 * Standalone helper to localize any string (e.g. category, unit, value)
 */
export function getLocalizedCategory(category: string, lang: Language): string {
  if (!category) return '';
  const lower = category.trim().toLowerCase();
  const entry = CATEGORY_TRANSLATIONS[lower];
  return entry ? (lang === 'ar' ? entry.ar : entry.en) : category;
}

export function getLocalizedUnit(unit: string, lang: Language): string {
  if (!unit) return '';
  const lower = unit.trim().toLowerCase();
  const entry = UNIT_TRANSLATIONS[lower];
  return entry ? (lang === 'ar' ? entry.ar : entry.en) : unit;
}

export function getLocalizedValue(value: any, lang: Language): any {
  if (typeof value !== 'string') return value;
  const lower = value.trim().toLowerCase();
  const entry = VALUE_TRANSLATIONS[lower];
  return entry ? (lang === 'ar' ? entry.ar : entry.en) : value;
}
