import { BenefitRequirement, CompanyProposal, PresetTemplate } from '../types';
import { calculateCompanyPremium, DEFAULT_DEMOGRAPHIC_CENSUS } from '../utils/actuarialCalculator';

export const CORPORATE_HEALTH_TEMPLATE: PresetTemplate = {
  id: 'corporate_health',
  name: 'Corporate Health & Medical Benefits (RFP)',
  category: 'Health & Medical',
  description: 'Standard group health insurance tender with outpatient visits, inpatient limits, maternity, dental, and network tiers.',
  requirements: [
    {
      id: 'req_outpatient_visits',
      category: 'Outpatient & Consultations',
      name: 'Outpatient Consultation Forms / Visits',
      targetValue: 8,
      unit: 'forms/year',
      type: 'numeric_min',
      weight: 5,
      priority: 'critical',
      isMandatory: true,
      description: 'Annual employee outpatient visit forms/claim entitlements needed per member.'
    },
    {
      id: 'req_annual_max_limit',
      category: 'Hospitalization & Inpatient',
      name: 'Annual Maximum Limit per Member',
      targetValue: 100000,
      unit: 'USD ($)',
      type: 'numeric_min',
      weight: 5,
      priority: 'critical',
      isMandatory: true,
      description: 'Maximum overall coverage per insured member per policy year.'
    },
    {
      id: 'req_inpatient_room',
      category: 'Hospitalization & Inpatient',
      name: 'Inpatient Hospital Room Category',
      targetValue: 'Private Single Room',
      unit: 'Category',
      type: 'qualitative',
      weight: 4,
      priority: 'high',
      isMandatory: true,
      description: 'Minimum hospital room accommodation level during inpatient stays.'
    },
    {
      id: 'req_outpatient_copay',
      category: 'Outpatient & Consultations',
      name: 'Outpatient Copayment / Co-insurance',
      targetValue: 15,
      unit: '% copay',
      type: 'numeric_max',
      weight: 4,
      priority: 'high',
      isMandatory: false,
      description: 'Member copay per clinic visit (Lower is better; max 15% required).'
    },
    {
      id: 'req_prescription_drugs',
      category: 'Prescription & Pharmacy',
      name: 'Prescription Drugs Annual Limit',
      targetValue: 3000,
      unit: 'USD ($)',
      type: 'numeric_min',
      weight: 3,
      priority: 'medium',
      isMandatory: false,
      description: 'Annual allowance for prescribed chronic and acute medications.'
    },
    {
      id: 'req_physio_sessions',
      category: 'Outpatient & Consultations',
      name: 'Physiotherapy & Rehab Sessions',
      targetValue: 12,
      unit: 'sessions/year',
      type: 'numeric_min',
      weight: 3,
      priority: 'medium',
      isMandatory: false,
      description: 'Number of prescribed physical therapy visits allowed annually.'
    },
    {
      id: 'req_dental_limit',
      category: 'Dental & Vision',
      name: 'Dental Care Coverage Limit',
      targetValue: 1500,
      unit: 'USD ($)',
      type: 'numeric_min',
      weight: 3,
      priority: 'medium',
      isMandatory: false,
      description: 'Annual dental routine checkup, fillings, and extraction benefit.'
    },
    {
      id: 'req_optical_allowance',
      category: 'Dental & Vision',
      name: 'Optical & Eyewear Allowance',
      targetValue: 300,
      unit: 'USD ($)',
      type: 'numeric_min',
      weight: 2,
      priority: 'low',
      isMandatory: false,
      description: 'Prescription eyeglasses and contact lens allowance every 2 years.'
    },
    {
      id: 'req_maternity_normal',
      category: 'Maternity Care',
      name: 'Maternity Normal Delivery Limit',
      targetValue: 6000,
      unit: 'USD ($)',
      type: 'numeric_min',
      weight: 4,
      priority: 'high',
      isMandatory: false,
      description: 'Maternity normal delivery and pre/post-natal care limit.'
    },
    {
      id: 'req_direct_billing',
      category: 'Network & Administration',
      name: 'Direct Billing Hospital Network Tier',
      targetValue: 'Tier 1 Prime Network',
      unit: 'Tier',
      type: 'tier_level',
      weight: 4,
      priority: 'high',
      isMandatory: true,
      description: 'Direct billing cashless hospital network tier (Tier 1 Prime, Tier 2 Standard).'
    },
    {
      id: 'req_telehealth_included',
      category: 'Wellness & Digital Health',
      name: '24/7 Virtual Telehealth App & Consultations',
      targetValue: true,
      unit: 'Included',
      type: 'boolean',
      weight: 2,
      priority: 'low',
      isMandatory: false,
      description: 'Free unlimited virtual doctor video consultations via mobile app.'
    },
    {
      id: 'req_emergency_evac',
      category: 'Emergency & Evacuation',
      name: 'Emergency Medical Evacuation & Repatriation',
      targetValue: 50000,
      unit: 'USD ($)',
      type: 'numeric_min',
      weight: 3,
      priority: 'medium',
      isMandatory: true,
      description: 'Coverage for international or regional emergency transport to equipped hospital.'
    }
  ]
};

export const GROUP_LIFE_TEMPLATE: PresetTemplate = {
  id: 'group_life',
  name: 'Group Life & Personal Accident Plan',
  category: 'Life & Disability',
  description: 'Term life cover, accidental death & dismemberment, critical illness lump sums, and permanent total disability.',
  requirements: [
    {
      id: 'gl_life_multiple',
      category: 'Death Benefit',
      name: 'Life Insurance Sum Assured (Annual Salary Multiple)',
      targetValue: 36,
      unit: 'months salary',
      type: 'numeric_min',
      weight: 5,
      priority: 'critical',
      isMandatory: true,
      description: 'Multiple of monthly salary paid upon natural death.'
    },
    {
      id: 'gl_add_benefit',
      category: 'Accidental Cover',
      name: 'Accidental Death & Dismemberment (AD&D)',
      targetValue: 48,
      unit: 'months salary',
      type: 'numeric_min',
      weight: 4,
      priority: 'high',
      isMandatory: true,
      description: 'Coverage multiplier for accidental death.'
    },
    {
      id: 'gl_ptd_disability',
      category: 'Disability',
      name: 'Permanent Total Disability (PTD)',
      targetValue: 36,
      unit: 'months salary',
      type: 'numeric_min',
      weight: 4,
      priority: 'high',
      isMandatory: true,
      description: 'Lump sum payment for permanent total incapacity.'
    },
    {
      id: 'gl_critical_illness',
      category: 'Critical Illness',
      name: 'Critical Illness Covered Conditions',
      targetValue: 32,
      unit: 'conditions',
      type: 'numeric_min',
      weight: 3,
      priority: 'medium',
      isMandatory: false,
      description: 'Number of major critical illnesses covered under lump-sum rider.'
    },
    {
      id: 'gl_repatriation_remains',
      category: 'Repatriation',
      name: 'Repatriation of Mortal Remains',
      targetValue: 10000,
      unit: 'USD ($)',
      type: 'numeric_min',
      weight: 3,
      priority: 'medium',
      isMandatory: true,
      description: 'Allowance to transport remains to home country.'
    }
  ]
};

export const COMMERCIAL_FLEET_TEMPLATE: PresetTemplate = {
  id: 'commercial_fleet',
  name: 'Commercial Vehicle Fleet & Motor Cover',
  category: 'Property & Fleet',
  description: 'Comprehensive motor insurance for company fleet vehicles, third-party liability, agency repairs, and replacement car days.',
  requirements: [
    {
      id: 'fl_tpl_limit',
      category: 'Liability',
      name: 'Third Party Property Damage Limit',
      targetValue: 1000000,
      unit: 'USD ($)',
      type: 'numeric_min',
      weight: 5,
      priority: 'critical',
      isMandatory: true,
      description: 'Statutory and excess third party liability protection limit.'
    },
    {
      id: 'fl_replacement_car_days',
      category: 'Mobility & Convenience',
      name: 'Replacement Courtesy Car Days',
      targetValue: 10,
      unit: 'days/accident',
      type: 'numeric_min',
      weight: 4,
      priority: 'high',
      isMandatory: false,
      description: 'Courtesy replacement vehicle provided during accident repairs (10 days needed).'
    },
    {
      id: 'fl_agency_repair_years',
      category: 'Repair Standards',
      name: 'Authorized Agency Repair Period',
      targetValue: 3,
      unit: 'years',
      type: 'numeric_min',
      weight: 4,
      priority: 'high',
      isMandatory: false,
      description: 'Repair at official brand dealership for vehicles up to N years old.'
    },
    {
      id: 'fl_deductible_own_damage',
      category: 'Excess & Deductible',
      name: 'Standard Own-Damage Deductible / Excess',
      targetValue: 250,
      unit: 'USD ($)',
      type: 'numeric_max',
      weight: 3,
      priority: 'medium',
      isMandatory: false,
      description: 'Fixed excess per claim (Lower is better; max $250 required).'
    },
    {
      id: 'fl_roadside_assistance',
      category: 'Assistance',
      name: '24/7 Roadside Assistance & Towing',
      targetValue: true,
      unit: 'Included',
      type: 'boolean',
      weight: 3,
      priority: 'medium',
      isMandatory: true,
      description: 'Free towing, battery jumpstart, lockout, and tire assistance.'
    }
  ]
};

export const PRESET_TEMPLATES: PresetTemplate[] = [
  CORPORATE_HEALTH_TEMPLATE,
  GROUP_LIFE_TEMPLATE,
  COMMERCIAL_FLEET_TEMPLATE
];

// 5 Real-World High Quality Insurance Proposals with Actuarial Rate Cards
export const DEMO_COMPANY_PROPOSALS: CompanyProposal[] = [
  {
    id: 'prop_jic',
    companyName: 'شركة التأمين الأردنية (Jordan Insurance Company - JIC)',
    planName: 'برنامج الرعاية الصحية الشامل (العرض الرسمي للمناقصة)',
    currency: 'JOD (دينار)',
    networkName: 'الشبكة الطبية الأولى المباشرة (JIC Prime Network)',
    sourceFileName: 'JIC_Jordan_Insurance_GD-1150-11798.pdf',
    submissionDate: '2026-07-26',
    executiveSummary: 'عرض شركة التأمين الأردنية الرسمي بكتاب تجديد رقم GD/1150-11798/25/2 بتاريخ 26/07/2026: فئة 0-17: 339.900 د (97 طفلاً = 32,970.30 د)، فئة 18-65: 636.460 د (159 بالغاً = 101,197.14 د)، مجموع الأقساط الأساسية = 134,167.44 د، رسوم إصدار 4% = 5,366.70 د، طوابع واردات 1% = 1,395.34 د، صندوق ضمان المؤمن لهم 0.5% = 670.84 د، الإجمالي الكلي المعتمد للعقد = 141,600.32 دينار.',
    pricingStructure: {
      childRate: 339.900,
      adultRate: 636.460,
      seniorRate: 1790.800,
      dentalRatePerPerson: 0,
      opticalRatePerPerson: 0,
      issuanceFeePercent: 4.0,
      stampsFeePercent: 1.0,
      guaranteeFundFeePercent: 0.5,
      stampsCalculationBasis: 'base_plus_issuance',
      feesPercentage: 5.54024,
      feesBreakdown: {
        issuancePercent: 4.0,
        revenueStampsPercent: 1.0,
        guaranteeFundPercent: 0.5,
        description: 'رسوم إصدار 4% (5,366.70 د) + طوابع واردات 1% (1,395.34 د) + صندوق ضمان المؤمن له 0.5% (670.84 د) = إجمالي الرسوم 7,432.88 د'
      },
      fixedContractFee: 0,
      customNotes: 'عرض شركة التأمين الأردنية الرسمي بكتاب 26/07/2026: 97 أطفال × 339.900 د = 32,970.30 د، 159 بالغين × 636.460 د = 101,197.14 د (الأساسي 134,167.44 د) + رسوم قانونية 7,432.88 د = الإجمالي 141,600.32 د'
    },
    calculatedBreakdown: calculateCompanyPremium({
      childRate: 339.900,
      adultRate: 636.460,
      seniorRate: 1790.800,
      issuanceFeePercent: 4.0,
      stampsFeePercent: 1.0,
      guaranteeFundFeePercent: 0.5,
      stampsCalculationBasis: 'base_plus_issuance',
      feesPercentage: 5.54024,
      fixedContractFee: 0
    }, DEFAULT_DEMOGRAPHIC_CENSUS),
    premiumAnnual: 141600.32,
    benefits: {
      req_outpatient_visits: {
        offeredValue: 9,
        rawText: '9 نماذج وكشوفات زيارات عيادات خارجية سنوياً لكل مؤمن له.',
        isIncluded: true,
        notes: 'يتجاوز الحد الأدنى (8 زيارات) ومسقوف عند 100% دون زيادة وهمية.'
      },
      req_annual_max_limit: {
        offeredValue: 120000,
        rawText: 'سقف إجمالي سنوي 120,000 دينار لكل مشترك.',
        isIncluded: true,
        notes: 'يتجاوز المستهدف (100,000 د).'
      },
      req_inpatient_room: {
        offeredValue: 'Private Single Room',
        rawText: 'غرفة خاصة مفردة مع حمام مستقل ومرافق كامل.',
        isIncluded: true
      },
      req_outpatient_copay: {
        offeredValue: 10,
        rawText: '10% نسبة تحمل في العيادات الخارجية.',
        isIncluded: true,
        notes: 'أفضل من الحد الأقصى 15% المطلوب.'
      },
      req_prescription_drugs: {
        offeredValue: 3500,
        rawText: '3,500 دينار سقف الأدوية الموصوفة السنوي.',
        isIncluded: true
      },
      req_physio_sessions: {
        offeredValue: 15,
        rawText: '15 جلسة علاج طبيعي وتأهيلي سنوياً.',
        isIncluded: true
      },
      req_dental_limit: {
        offeredValue: 1500,
        rawText: '1,500 دينار سقف علاجات الأسنان المشمولة.',
        isIncluded: true
      },
      req_optical_allowance: {
        offeredValue: 350,
        rawText: '350 دينار مخصص الإطارات والعدسات الطبية كل عامين.',
        isIncluded: true
      },
      req_maternity_normal: {
        offeredValue: 6500,
        rawText: '6,500 دينار سقف الولادة الطبيعية ورعاية الحمل.',
        isIncluded: true
      },
      req_direct_billing: {
        offeredValue: 'Tier 1 Prime Network',
        rawText: 'مطالبة مباشرة وفورية عبر شبكة المستشفيات والمراكز من الفئة الأولى.',
        isIncluded: true
      },
      req_telehealth_included: {
        offeredValue: true,
        rawText: 'استشارات طبية مرئية وهاتفية على مدار الساعة (JIC TeleHealth 24/7).',
        isIncluded: true
      },
      req_emergency_evac: {
        offeredValue: 80000,
        rawText: 'تغطية إخلاء طبي طارئ وإعادة للوطن حتى 80,000 دينار.',
        isIncluded: true
      }
    },
    extraFeatures: [
      { title: 'برنامج الفحص الدوري السنوي', description: 'فحص سريري ومخبري سنوي شامل للمشتركين فوق سن الأربعين.' },
      { title: 'خدمة توصيل أدوية الأمراض المزمنة', description: 'توصيل شهري دوري للأدوية المزمنة لمنازل ومقار العمل.' }
    ]
  },
  {
    id: 'prop_jofico',
    companyName: 'الشركة الأردنية الفرنسية للتأمين (JOFICO)',
    planName: 'برنامج الرعاية الصحية المؤسسية (الفئة الذهبية)',
    currency: 'JOD (دينار)',
    networkName: 'شبكة الفئة الأولى الطبية المعتمدة (Tier 1 Prime)',
    sourceFileName: 'JOFICO_Corporate_Offer_2026.pdf',
    submissionDate: '2026-08-20',
    executiveSummary: 'عرض متكامل يلبي كافة اشتراطات كراسة الجامعة، متضمن 10 نماذج كشف (مسقوفة عند 100%)، قسط فئة 0-17 سنة: 310 د، وفئة 18-65 سنة: 510 د، مع رسوم 6.5%.',
    pricingStructure: {
      childRate: 310,
      adultRate: 510,
      seniorRate: 750,
      dentalRatePerPerson: 35,
      opticalRatePerPerson: 20,
      feesPercentage: 6.5,
      feesBreakdown: {
        issuancePercent: 5.0,
        revenueStampsPercent: 1.0,
        guaranteeFundPercent: 0.5,
        description: 'رسوم إصدار 5% + طوابع واردات 1% + صندوق ضمان المؤمن لهم (البنك المركزي) 0.5%'
      },
      fixedContractFee: 0,
      customNotes: 'فئة 0–17 سنة: 310 د، فئة 18–65 سنة: 510 د، فئة 66–75 سنة: 750 د، رسوم 6.5%'
    },
    calculatedBreakdown: calculateCompanyPremium({
      childRate: 310,
      adultRate: 510,
      seniorRate: 750,
      feesPercentage: 6.5,
      fixedContractFee: 0
    }, DEFAULT_DEMOGRAPHIC_CENSUS),
    premiumAnnual: 118385.40,
    benefits: {
      req_outpatient_visits: {
        offeredValue: 10, // Target is 8, offers 10 -> Capped strictly at 100%, 0 bonus points!
        rawText: '10 outpatient consultation vouchers/forms per covered member annually.',
        isIncluded: true,
        notes: 'Exceeds target (offers 10 vs 8 needed). Strictly capped at 100% score.'
      },
      req_annual_max_limit: {
        offeredValue: 150000,
        rawText: '$150,000 annual maximum aggregate limit per member.',
        isIncluded: true,
        notes: 'Exceeds $100k target; score capped at maximum 100%.'
      },
      req_inpatient_room: {
        offeredValue: 'Private Single Room',
        rawText: 'Full coverage for Private Single Ensuite Room.',
        isIncluded: true
      },
      req_outpatient_copay: {
        offeredValue: 10, // Target max 15%, offered 10% (more favorable)
        rawText: '10% co-insurance at network clinics and medical centers.',
        isIncluded: true,
        notes: 'Better than 15% required max; receives 100% full score.'
      },
      req_prescription_drugs: {
        offeredValue: 3500,
        rawText: '$3,500 annual pharmacy allowance.',
        isIncluded: true
      },
      req_physio_sessions: {
        offeredValue: 15,
        rawText: 'Up to 15 rehabilitation & physiotherapy sessions per annum.',
        isIncluded: true
      },
      req_dental_limit: {
        offeredValue: 1500,
        rawText: '$1,500 standard dental package included.',
        isIncluded: true
      },
      req_optical_allowance: {
        offeredValue: 350,
        rawText: '$350 frame and lenses allowance every 2 years.',
        isIncluded: true
      },
      req_maternity_normal: {
        offeredValue: 7000,
        rawText: '$7,000 normal delivery and ante-natal care package.',
        isIncluded: true
      },
      req_direct_billing: {
        offeredValue: 'Tier 1 Prime Network',
        rawText: 'Direct billing at all Tier 1 hospitals & private medical centers.',
        isIncluded: true
      },
      req_telehealth_included: {
        offeredValue: true,
        rawText: 'Included: 24/7 JOFICO Click & TebFact virtual doctor consultations.',
        isIncluded: true
      },
      req_emergency_evac: {
        offeredValue: 100000,
        rawText: 'Up to $100,000 worldwide air evacuation & repatriation.',
        isIncluded: true
      }
    },
    extraFeatures: [
      { title: 'Executive Health Screening', description: 'Free annual comprehensive health checkup for senior management.' },
      { title: 'JOFICO Parents Care Program', description: 'Specialized health management for elderly dependents.' }
    ]
  },
  {
    id: 'prop_meico',
    companyName: 'شركة الشرق الأوسط للتأمين (MEICO)',
    planName: 'برنامج التأمين الطبي الماسي (Corporate Diamond Plan)',
    currency: 'JOD (دينار)',
    networkName: 'شبكة الشرق الأوسط الماسية (MEICO Platinum Tier 1)',
    sourceFileName: 'MEICO_Insurance_Tender_Offer_2026.pdf',
    submissionDate: '2026-08-22',
    executiveSummary: 'عرض شركة الشرق الأوسط للتأمين، فئة 0-17: 405 دنانير، فئة 18-65: 755 ديناراً، رسوم وضرائب 6%، ورسم إصدار عقد مقطوع 50 ديناراً.',
    pricingStructure: {
      childRate: 405,
      adultRate: 755,
      seniorRate: 1100,
      dentalRatePerPerson: 45,
      opticalRatePerPerson: 25,
      feesPercentage: 6.0,
      feesBreakdown: {
        issuancePercent: 4.5,
        revenueStampsPercent: 1.0,
        guaranteeFundPercent: 0.5,
        description: 'تشمل رسوم الإصدار، الطوابع، وصندوق الشركات المتعثرة (6%) + رسم عقد مقطوع 50 دينار'
      },
      fixedContractFee: 50,
      customNotes: 'عرض شركة الشرق الأوسط للتأمين: فئة 0-17: 405 د، فئة 18-65: 755 د، فئة 66-75: 1,100 د، رسوم 6%، ورسم إصدار عقد 50 دينار'
    },
    calculatedBreakdown: calculateCompanyPremium({
      childRate: 405,
      adultRate: 755,
      seniorRate: 1100,
      feesPercentage: 6.0,
      fixedContractFee: 50
    }, DEFAULT_DEMOGRAPHIC_CENSUS),
    premiumAnnual: 168939.80,
    benefits: {
      req_outpatient_visits: {
        offeredValue: 8, // Exactly meets target of 8
        rawText: '8 outpatient consultation claim visits per year per insured.',
        isIncluded: true,
        notes: 'Exactly meets required 8 visits; receives 100% full score.'
      },
      req_annual_max_limit: {
        offeredValue: 100000,
        rawText: '$100,000 annual aggregate per insured member.',
        isIncluded: true
      },
      req_inpatient_room: {
        offeredValue: 'Private Single Room',
        rawText: 'Single private room accommodation.',
        isIncluded: true
      },
      req_outpatient_copay: {
        offeredValue: 15, // Exact match to max 15%
        rawText: '15% copayment at general practitioners & specialist clinics.',
        isIncluded: true
      },
      req_prescription_drugs: {
        offeredValue: 3000,
        rawText: '$3,000 prescription drugs cap.',
        isIncluded: true
      },
      req_physio_sessions: {
        offeredValue: 12,
        rawText: '12 physiotherapy sessions with medical referral.',
        isIncluded: true
      },
      req_dental_limit: {
        offeredValue: 1200, // Partial match (target: 1500, offers 1200 => 80%)
        rawText: '$1,200 annual dental ceiling.',
        isIncluded: true,
        notes: 'Slightly below $1,500 requirement (80% match).'
      },
      req_optical_allowance: {
        offeredValue: 300,
        rawText: '$300 optical limit per 24 months.',
        isIncluded: true
      },
      req_maternity_normal: {
        offeredValue: 6000,
        rawText: '$6,000 normal delivery maternity benefit.',
        isIncluded: true
      },
      req_direct_billing: {
        offeredValue: 'Tier 1 Prime Network',
        rawText: 'Tier 1 prime hospital network direct settlement.',
        isIncluded: true
      },
      req_telehealth_included: {
        offeredValue: true,
        rawText: 'MEICO Doctor 24/7 teleconsultation app included.',
        isIncluded: true
      },
      req_emergency_evac: {
        offeredValue: 50000,
        rawText: '$50,000 emergency evacuation coverage.',
        isIncluded: true
      }
    },
    extraFeatures: [
      { title: 'MEICO Wellness Points', description: 'Employee reward program for physical activity and healthy habits.' },
      { title: 'Chronic Medication Home Delivery', description: 'Direct doorstep delivery for monthly chronic prescriptions.' }
    ]
  },
  {
    id: 'prop_gig',
    companyName: 'مجموعة الخليج للتأمين - الأردن (GIG Jordan)',
    planName: 'برنامج بلسم بلس الصحي المؤسسي',
    currency: 'JOD (دينار)',
    networkName: 'شبكة GIG الأردن الطبية المباشرة',
    sourceFileName: 'GIG_Jordan_Tender_2026.pdf',
    submissionDate: '2026-08-25',
    executiveSummary: 'عرض مجموعة الخليج للتأمين: فئة الأطفال 345 ديناراً، فئة البالغين 590 ديناراً، رسوم 6.5%، ورسم عقد 25 ديناراً.',
    pricingStructure: {
      childRate: 345,
      adultRate: 590,
      seniorRate: 850,
      dentalRatePerPerson: 40,
      opticalRatePerPerson: 22,
      feesPercentage: 6.5,
      feesBreakdown: {
        issuancePercent: 5.0,
        revenueStampsPercent: 1.0,
        guaranteeFundPercent: 0.5,
        description: 'رسوم إصدار وطوابع 6.5%'
      },
      fixedContractFee: 25,
      customNotes: 'مجموعة الخليج للتأمين: 0-17: 345 د، 18-65: 590 د، 66-75: 850 د، رسوم 6.5%، رسم عقد 25 د'
    },
    calculatedBreakdown: calculateCompanyPremium({
      childRate: 345,
      adultRate: 590,
      seniorRate: 850,
      feesPercentage: 6.5,
      fixedContractFee: 25
    }, DEFAULT_DEMOGRAPHIC_CENSUS),
    premiumAnnual: 135572.88,
    benefits: {
      req_outpatient_visits: {
        offeredValue: 12, // Offers 12 forms! Capped at 100% (same as 8), 0 bonus!
        rawText: '12 outpatient specialist / GP forms per annum.',
        isIncluded: true,
        notes: 'Offers 12 forms vs 8 needed. Score is capped strictly at 100% with no bonus.'
      },
      req_annual_max_limit: {
        offeredValue: 250000,
        rawText: '$250,000 annual maximum ceiling.',
        isIncluded: true,
        notes: 'Over-spec; capped at 100%.'
      },
      req_inpatient_room: {
        offeredValue: 'VIP Suite / Private Single',
        rawText: 'Private Single or VIP suite where available.',
        isIncluded: true
      },
      req_outpatient_copay: {
        offeredValue: 0, // 0% copay
        rawText: '0% copay across all network clinics (100% covered).',
        isIncluded: true
      },
      req_prescription_drugs: {
        offeredValue: 5000,
        rawText: '$5,000 prescription limit.',
        isIncluded: true
      },
      req_physio_sessions: {
        offeredValue: 20,
        rawText: '20 physiotherapy sessions per policy year.',
        isIncluded: true
      },
      req_dental_limit: {
        offeredValue: 2500,
        rawText: '$2,500 comprehensive dental care.',
        isIncluded: true
      },
      req_optical_allowance: {
        offeredValue: 500,
        rawText: '$500 eyewear and vision test allowance.',
        isIncluded: true
      },
      req_maternity_normal: {
        offeredValue: 10000,
        rawText: '$10,000 normal delivery package with zero waiting period.',
        isIncluded: true
      },
      req_direct_billing: {
        offeredValue: 'Tier 1 Prime Network',
        rawText: 'Global Tier 1 Direct Settlement Network.',
        isIncluded: true
      },
      req_telehealth_included: {
        offeredValue: true,
        rawText: 'GIG TeleCare app included 24/7.',
        isIncluded: true
      },
      req_emergency_evac: {
        offeredValue: 200000,
        rawText: 'Unlimited / $200,000 emergency medical evacuation.',
        isIncluded: true
      }
    },
    extraFeatures: [
      { title: 'Sharia Compliant Surplus Distribution', description: 'Annual takaful surplus profit distribution to policyholders.' },
      { title: 'Global Concierge & Travel Medicine', description: 'International medical travel escort and emergency second opinion.' }
    ]
  },
  {
    id: 'prop_jerusalem',
    companyName: 'شركة القدس للتأمين (Jerusalem Insurance)',
    planName: 'برنامج الحماية الشاملة',
    currency: 'JOD (دينار)',
    networkName: 'شبكة القدس للتأمين الفئة الأولى',
    sourceFileName: 'Jerusalem_Insurance_Tender_2026.pdf',
    submissionDate: '2026-08-26',
    executiveSummary: 'عرض شركة القدس للتأمين: فئة الأطفال 360 ديناراً، فئة البالغين 640 ديناراً، رسوم 6.5%، ورسم عقد 30 ديناراً.',
    pricingStructure: {
      childRate: 360,
      adultRate: 640,
      seniorRate: 900,
      dentalRatePerPerson: 38,
      opticalRatePerPerson: 20,
      feesPercentage: 6.5,
      feesBreakdown: {
        issuancePercent: 5.0,
        revenueStampsPercent: 1.0,
        guaranteeFundPercent: 0.5,
        description: 'رسوم حكومية ورقابية 6.5%'
      },
      fixedContractFee: 30,
      customNotes: 'شركة القدس للتأمين: 0-17: 360 د، 18-65: 640 د، 66-75: 900 د، رسوم 6.5%، رسم عقد 30 د'
    },
    calculatedBreakdown: calculateCompanyPremium({
      childRate: 360,
      adultRate: 640,
      seniorRate: 900,
      feesPercentage: 6.5,
      fixedContractFee: 30
    }, DEFAULT_DEMOGRAPHIC_CENSUS),
    premiumAnnual: 145594.20,
    benefits: {
      req_outpatient_visits: {
        offeredValue: 6, // Under target of 8! Score is 6/8 = 75%
        rawText: '6 outpatient visits per insured member.',
        isIncluded: true,
        notes: 'Offers 6 visits (deficit of 2 visits). Score is 75%.'
      },
      req_annual_max_limit: {
        offeredValue: 75000, // Under target of $100k! Score is 75%
        rawText: '$75,000 annual aggregate limit.',
        isIncluded: true,
        notes: 'Below $100,000 mandatory requirement.'
      },
      req_inpatient_room: {
        offeredValue: 'Semi-Private (Shared 2-bed)',
        rawText: 'Semi-private double room accommodation.',
        isIncluded: true,
        notes: 'Below requested Private Single Room (partial score).'
      },
      req_outpatient_copay: {
        offeredValue: 20, // Worse than 15% target
        rawText: '20% copayment per outpatient visit.',
        isIncluded: true,
        notes: 'Higher copayment than required 15%.'
      },
      req_prescription_drugs: {
        offeredValue: 2000,
        rawText: '$2,000 prescription medicines cap.',
        isIncluded: true
      },
      req_physio_sessions: {
        offeredValue: 8, // 8 vs 12
        rawText: '8 physical therapy sessions.',
        isIncluded: true
      },
      req_dental_limit: {
        offeredValue: 800, // 800 vs 1500
        rawText: '$800 basic dental care.',
        isIncluded: true
      },
      req_optical_allowance: {
        offeredValue: 150,
        rawText: '$150 optical frame benefit.',
        isIncluded: true
      },
      req_maternity_normal: {
        offeredValue: 4000,
        rawText: '$4,000 maternity normal delivery with waiting period.',
        isIncluded: true
      },
      req_direct_billing: {
        offeredValue: 'Tier 2 Standard Network',
        rawText: 'Tier 2 direct billing hospital network only.',
        isIncluded: true,
        notes: 'Fails Tier 1 Prime mandatory requirement.'
      },
      req_telehealth_included: {
        offeredValue: false, // Not included!
        rawText: 'Telehealth not included in this tier (available as paid add-on).',
        isIncluded: false,
        notes: '0% score - excluded.'
      },
      req_emergency_evac: {
        offeredValue: 25000, // 25k vs 50k
        rawText: '$25,000 local emergency evacuation limit.',
        isIncluded: true
      }
    },
    extraFeatures: [
      { title: 'Corporate Portal & Online Endorsements', description: 'Fast automated employee addition and deletion portal.' }
    ]
  }
];
