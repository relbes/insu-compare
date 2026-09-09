import { BenefitRequirement, CompanyProposal } from '../types';

export interface StepDefinition {
  id: string;
  number: number;
  titleAr: string;
  titleEn: string;
  subtitleAr: string;
  subtitleEn: string;
  isCompleted: boolean;
  isLocked: boolean;
  lockReasonAr?: string;
  lockReasonEn?: string;
  prerequisiteStepId?: string;
  prerequisiteStepNameAr?: string;
  prerequisiteStepNameEn?: string;
}

export interface StepGuardState {
  excelCount: number;
  hasConditions: boolean;
  requirementsCount: number;
  proposalsCount: number;
}

/**
 * Validates step access rules and completion status.
 * Rule: A step can only be opened if the prior step was completed successfully!
 */
export function getStepDefinitions(state: StepGuardState): StepDefinition[] {
  const { excelCount, hasConditions, requirementsCount, proposalsCount } = state;

  const isStep1Done = excelCount > 0;
  const isStep2Done = hasConditions;
  const isStep3Done = requirementsCount > 0;
  const isStep4Done = requirementsCount > 0;
  const isStep5Done = proposalsCount > 0;
  const isStep6Done = proposalsCount > 0; // pricing calculator ready once proposals are uploaded
  const isStep7Done = proposalsCount > 0 && requirementsCount > 0;

  return [
    {
      id: 'step1_excel',
      number: 1,
      titleAr: '١. جدول الإكسل',
      titleEn: '1. Excel Schedule',
      subtitleAr: isStep1Done ? `${excelCount} منفعة مدخلة` : 'رفع الملف',
      subtitleEn: isStep1Done ? `${excelCount} benefits` : 'Upload Excel',
      isCompleted: isStep1Done,
      isLocked: false // Always unlocked as initial entry
    },
    {
      id: 'step2_rfp',
      number: 2,
      titleAr: '٢. كراسة الشروط',
      titleEn: '2. RFP Conditions',
      subtitleAr: isStep2Done ? 'الكراسة معتمدة' : 'إدخال الشروط',
      subtitleEn: isStep2Done ? 'Conditions Ready' : 'Input Conditions',
      isCompleted: isStep2Done,
      isLocked: !isStep1Done,
      lockReasonAr: 'يرجى أولاً رفع جدول المنافع من الإكسل في الخطوة الأولى لتتمكن من إدخال كراسة الشروط.',
      lockReasonEn: 'Please complete Step 1 (Excel benefits schedule) before accessing RFP conditions.',
      prerequisiteStepId: 'step1_excel',
      prerequisiteStepNameAr: 'الخطوة الأولى: جدول الإكسل',
      prerequisiteStepNameEn: 'Step 1: Excel Schedule'
    },
    {
      id: 'step3_binding',
      number: 3,
      titleAr: '٣. ربط السقوف',
      titleEn: '3. AI Binding',
      subtitleAr: isStep3Done ? 'تم ربط السقوف' : 'مطابقة ذكية',
      subtitleEn: isStep3Done ? 'Caps Bound' : 'Smart Binding',
      isCompleted: isStep3Done,
      isLocked: !isStep2Done,
      lockReasonAr: 'يرجى إدخال أو رفع كراسة الشروط في الخطوة الثانية للبدء بالربط والمطابقة الذكية.',
      lockReasonEn: 'Please complete Step 2 (RFP conditions) before executing AI smart binding.',
      prerequisiteStepId: 'step2_rfp',
      prerequisiteStepNameAr: 'الخطوة الثانية: كراسة الشروط',
      prerequisiteStepNameEn: 'Step 2: RFP Conditions'
    },
    {
      id: 'step4_review',
      number: 4,
      titleAr: '٤. مراجعة وتعديل',
      titleEn: '4. Approved Checklist',
      subtitleAr: `${requirementsCount} منفعة معتمدة`,
      subtitleEn: `${requirementsCount} approved`,
      isCompleted: isStep4Done,
      isLocked: !isStep1Done && !isStep3Done && requirementsCount === 0,
      lockReasonAr: 'يرجى استيراد وربط المنافع أولاً لتتمكن من مراجعة واعتماد قائمة الاشتراطات.',
      lockReasonEn: 'Please import and bind benefits before reviewing the approved checklist.',
      prerequisiteStepId: 'step1_excel',
      prerequisiteStepNameAr: 'الخطوات السابقة (جدول المنافع والربط)',
      prerequisiteStepNameEn: 'Previous Steps (Benefits & Binding)'
    },
    {
      id: 'step5_proposals',
      number: 5,
      titleAr: '٥. عروض الشركات',
      titleEn: '5. Insurer Proposals',
      subtitleAr: isStep5Done ? `${proposalsCount} عروض مرفوعة` : 'رفع العروض',
      subtitleEn: isStep5Done ? `${proposalsCount} proposals` : 'Upload Proposals',
      isCompleted: isStep5Done,
      isLocked: requirementsCount === 0,
      lockReasonAr: 'يرجى اعتماد وتأكيد جدول المنافع والسقوف في الخطوة الرابعة قبل رفع عروض شركات التأمين.',
      lockReasonEn: 'Please approve the requirements checklist in Step 4 before uploading insurer proposals.',
      prerequisiteStepId: 'step4_review',
      prerequisiteStepNameAr: 'الخطوة الرابعة: مراجعة واعتماد المنافع',
      prerequisiteStepNameEn: 'Step 4: Review Checklist'
    },
    {
      id: 'step_actuarial',
      number: 6,
      titleAr: '٦. حاسبة الأقساط والرسوم',
      titleEn: '6. Premium & Pricing Calculator',
      subtitleAr: 'الرسوم 6.5% والتعداد 256',
      subtitleEn: 'Fees 6.5% & Census 256',
      isCompleted: isStep6Done,
      isLocked: proposalsCount === 0,
      lockReasonAr: 'يرجى رفع عروض شركات التأمين في الخطوة الخامسة لاحتساب الأقساط والرسوم المقررة بناءً على عروضها.',
      lockReasonEn: 'Please upload insurer proposals in Step 5 before performing premium calculations.',
      prerequisiteStepId: 'step5_proposals',
      prerequisiteStepNameAr: 'الخطوة الخامسة: عروض الشركات',
      prerequisiteStepNameEn: 'Step 5: Insurer Proposals'
    },
    {
      id: 'step6_tradeoff_matrix',
      number: 7,
      titleAr: '٧. مصفوفة المفاضلة',
      titleEn: '7. Trade-off Matrix',
      subtitleAr: 'تقييم من 5 والترتيب',
      subtitleEn: '5/5 Scoring & Rank',
      isCompleted: isStep7Done,
      isLocked: proposalsCount === 0 || requirementsCount === 0,
      lockReasonAr: 'يرجى اعتماد جدول المنافع ورفع عروض شركات التأمين لحساب التقييم التنافسي ومصفوفة المفاضلة.',
      lockReasonEn: 'Please ensure both approved requirements and insurer proposals are uploaded to view the matrix.',
      prerequisiteStepId: proposalsCount === 0 ? 'step5_proposals' : 'step4_review',
      prerequisiteStepNameAr: proposalsCount === 0 ? 'الخطوة الخامسة: عروض الشركات' : 'الخطوة الرابعة: مراجعة المنافع',
      prerequisiteStepNameEn: proposalsCount === 0 ? 'Step 5: Proposals' : 'Step 4: Requirements'
    },
    {
      id: 'step_reports',
      number: 8,
      titleAr: '٨. تقرير التقييم والترسية',
      titleEn: '8. Evaluation & Reports',
      subtitleAr: 'تقرير الـ 390 علامة (60/40)',
      subtitleEn: '390-Pt Report (60/40)',
      isCompleted: isStep7Done,
      isLocked: proposalsCount === 0 || requirementsCount === 0,
      lockReasonAr: 'يرجى استكمال رفع عروض الشركات واعتماد الشروط لإصدار التقرير النهائي للجنة الترسية.',
      lockReasonEn: 'Please complete proposal uploads and requirements review before viewing final reports.',
      prerequisiteStepId: 'step6_tradeoff_matrix',
      prerequisiteStepNameAr: 'الخطوة السابعة: مصفوفة المفاضلة',
      prerequisiteStepNameEn: 'Step 7: Trade-off Matrix'
    }
  ];
}

/**
 * Checks if target tab can be navigated to.
 * Returns null if allowed, or reason string + prerequisite step ID if blocked.
 */
export function checkStepNavigation(
  targetTab: string, 
  state: StepGuardState, 
  isRtl: boolean
): { allowed: boolean; reason?: string; redirectStepId?: string; stepName?: string } {
  // Auxiliary tabs
  if (targetTab === 'audit' || targetTab === 'advisor') {
    return { allowed: true };
  }

  // Aliases for tabs
  const normalizedTab = 
    targetTab === 'requirements' ? 'step4_review' :
    targetTab === 'proposals' ? 'step5_proposals' :
    targetTab === 'rankings' ? 'step6_tradeoff_matrix' :
    targetTab === 'actuarial' ? 'step_actuarial' :
    targetTab === 'reports' ? 'step_reports' :
    targetTab;

  const steps = getStepDefinitions(state);
  const targetStep = steps.find(s => s.id === normalizedTab);

  if (!targetStep) {
    return { allowed: true };
  }

  if (targetStep.isLocked) {
    return {
      allowed: false,
      reason: isRtl ? targetStep.lockReasonAr : targetStep.lockReasonEn,
      redirectStepId: targetStep.prerequisiteStepId,
      stepName: isRtl ? targetStep.prerequisiteStepNameAr : targetStep.prerequisiteStepNameEn
    };
  }

  return { allowed: true };
}
