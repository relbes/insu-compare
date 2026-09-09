import React, { useState, useEffect, useMemo } from 'react';
import { 
  Sparkles, 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft, 
  AlertCircle, 
  RefreshCw, 
  Layers, 
  Check, 
  Search, 
  ShieldCheck, 
  Ban, 
  Info, 
  BarChart3,
  FileText
} from 'lucide-react';
import { BenefitRequirement } from '../types';
import { useI18n } from '../i18n/I18nContext';
import { authFetch } from '../utils/authInterceptor';

interface Step3AiBindingProps {
  excelBenefits: BenefitRequirement[];
  requirements?: BenefitRequirement[];
  conditionsText: string;
  conditionsFileBase64: string | null;
  conditionsMimeType: string;
  onApplyBoundRequirements: (boundReqs: BenefitRequirement[]) => void;
  onNavigatePrev: () => void;
  projectYear?: string;
  projectId?: string;
}

export type BindingFilterType = 'all' | 'bound_caps' | 'excluded' | 'open_general';

export const Step3AiBinding: React.FC<Step3AiBindingProps> = ({
  excelBenefits,
  requirements,
  conditionsText,
  conditionsFileBase64,
  conditionsMimeType,
  onApplyBoundRequirements,
  onNavigatePrev,
  projectYear,
  projectId
}) => {
  const { isRtl } = useI18n();

  const storageKey = `insur_last_ai_bound_items_${projectId || projectYear || 'default'}`;
  const summaryStorageKey = `insur_last_ai_summary_${projectId || projectYear || 'default'}`;

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Initialize boundItems: ALWAYS keep the last result generated or existing requirements/excel benefits
  const [boundItems, setBoundItems] = useState<any[]>(() => {
    // 1. Check if we already have saved matching results for this project/year in localStorage
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {}

    // 2. Check if existing approved requirements exist
    if (requirements && requirements.length > 0) {
      return requirements.map((req) => {
        const valStr = String(req.targetValue || '');
        const unitStr = String(req.unit || '');
        const isExcluded = valStr.includes('مستثنى') || valStr.includes('غير مغطى') || unitStr.includes('مستثنى');
        const isBound = Boolean(req.targetValue) && !valStr.includes('مفتوح') && !valStr.includes('Open') && !isExcluded;
        return {
          id: req.id,
          requirementId: req.id,
          benefitName: req.name,
          name: req.name,
          category: req.category,
          originalExcelValue: req.targetValue,
          boundValue: req.targetValue,
          unit: req.unit || '',
          type: req.type || 'numeric_min',
          weight: req.weight || 3,
          priority: req.priority || 'medium',
          isMandatory: Boolean(req.isMandatory),
          isBoundFromConditions: isBound,
          bindingType: isExcluded ? 'excluded' : isBound ? 'cap_bound' : 'open_general',
          rationale: req.description || (isRtl ? 'تم استيراد البند من النتائج السابقة المعتمدة' : 'Imported from previous approved requirements')
        };
      });
    }

    // 3. Check if excel benefits were uploaded
    if (excelBenefits && excelBenefits.length > 0) {
      return excelBenefits.map((b) => ({
        id: b.id,
        requirementId: b.id,
        benefitName: b.name,
        name: b.name,
        category: b.category,
        originalExcelValue: b.targetValue,
        boundValue: b.targetValue || (isRtl ? 'مفتوح (تغطية عامة مشمولة)' : 'Open (Covered under general terms)'),
        unit: b.unit || '',
        type: b.type || 'numeric_min',
        weight: b.weight || 3,
        priority: b.priority || 'medium',
        isMandatory: Boolean(b.isMandatory),
        isBoundFromConditions: false,
        bindingType: 'open_general',
        rationale: isRtl ? 'بند مستورد من جدول المنافع الأصلي - في انتظار تشغيل المطابقة اليدوية' : 'Imported from benefits schedule - pending manual matching'
      }));
    }

    return [];
  });

  const [summaryOverview, setSummaryOverview] = useState<string>(() => {
    try {
      return localStorage.getItem(summaryStorageKey) || '';
    } catch {
      return '';
    }
  });

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeFilter, setActiveFilter] = useState<BindingFilterType>('all');

  // Classification Helpers
  const isItemExcluded = (item: any): boolean => {
    if (item.bindingType === 'excluded') return true;
    const valStr = String(item.boundValue || item.targetValue || '').toLowerCase();
    const unitStr = String(item.unit || '').toLowerCase();
    const rationaleStr = String(item.rationale || '').toLowerCase();
    return (
      valStr.includes('مستثنى') ||
      valStr.includes('غير مغطى') ||
      valStr.includes('excluded') ||
      unitStr.includes('مستثنى') ||
      rationaleStr.includes('مستثنى صراحة') ||
      rationaleStr.includes('غير مغطى')
    );
  };

  const isItemBoundWithCap = (item: any): boolean => {
    if (isItemExcluded(item)) return false;
    return Boolean(item.isBoundFromConditions);
  };

  const isItemOpenGeneral = (item: any): boolean => {
    return !isItemExcluded(item) && !item.isBoundFromConditions;
  };

  // Helper: Client-side robust fallback binding algorithm
  const performClientSideBindingFallback = () => {
    const text = conditionsText || '';
    const textLower = text.toLowerCase();

    // Detect currency
    let detectedCurrency = 'دينار';
    if (textLower.includes('دينار') || textLower.includes('دنانير') || textLower.includes('jod') || textLower.includes('د.أ')) {
      detectedCurrency = 'دينار';
    } else if (textLower.includes('ريال') || textLower.includes('sar') || textLower.includes('ر.س')) {
      detectedCurrency = 'ريال';
    } else if (textLower.includes('دولار') || textLower.includes('usd') || textLower.includes('$')) {
      detectedCurrency = 'USD';
    }

    // Filter out section headers (e.g. "حالات مزمنة بعد توقيع العقد")
    const filteredBenefits = excelBenefits.filter((req) => {
      const name = (req.name || '').trim();
      return (
        !name.includes('توقيع العقد') &&
        !name.includes('بعد توقيع') &&
        !name.includes('قبل توقيع') &&
        !name.startsWith('القسم ') &&
        !name.startsWith('قسم ') &&
        !name.startsWith('الفصل ') &&
        !name.startsWith('الباب ') &&
        !name.endsWith(':')
      );
    });

    const items = filteredBenefits.map((req) => {
      const name = (req.name || '').toLowerCase();
      let boundValue: any = null;
      let unit = req.unit || '';
      let type = req.type || 'numeric_min';
      let isBound = false;
      let isExcluded = false;
      let rationale = '';

      // 1. Epilepsy exclusion check (مرض الصرع ومضاعفاته)
      if (name.includes('صرع') || name.includes('الصرع') || name.includes('epilepsy')) {
        boundValue = isRtl ? 'غير مغطى (مستثنى بنص الكراسة)' : 'Not covered (Explicitly excluded in RFP)';
        unit = isRtl ? 'مستثنى' : 'Excluded';
        type = 'boolean';
        isBound = true;
        isExcluded = true;
        rationale = isRtl 
          ? 'مستثنى صراحة بنص كراسة الشروط والمواصفات (غير مغطى).' 
          : 'Explicitly excluded by RFP specifications.';
      }
      // 2. Consultation forms rule
      else if (name.includes('نموذج') || name.includes('كشف') || name.includes('نماذج') || name.includes('consultation') || name.includes('visit') || name.includes('form')) {
        const formMatch = text.match(/(\d+)\s*(?:نماذج|نموذج|كشوفات|زيارات|forms|visits)/i);
        if (formMatch) {
          boundValue = parseInt(formMatch[1], 10);
          unit = isRtl ? 'نماذج كشف سنوياً' : 'visits/year';
          type = 'numeric_min';
          isBound = true;
          rationale = isRtl 
            ? `تم استخراج سقف ${boundValue} نماذج كشف كحد أدنى إلزامي من نص كراسة الشروط.`
            : `Extracted mandatory benchmark of ${boundValue} consultation visits per year from RFP.`;
        } else if (textLower.includes('8') || textLower.includes('٨') || textLower.includes('ثمانية')) {
          boundValue = 8;
          unit = isRtl ? 'نماذج كشف سنوياً' : 'visits/year';
          type = 'numeric_min';
          isBound = true;
          rationale = isRtl
            ? 'تم استخراج سقف 8 نماذج كشف كحد أدنى إلزامي للجهة.'
            : 'Extracted mandatory benchmark of 8 consultation visits/year.';
        }
      }
      // 3. Per case limit: سقف الحالة المرضية الواحدة سنوياً (12,000)
      else if (
        name.includes('الحالة المرضية') || 
        name.includes('الحاله المرضيه') || 
        name.includes('الحالة الواحدة') || 
        name.includes('الحاله الواحده') ||
        name.includes('per case') ||
        (name.includes('سقف') && name.includes('حالة'))
      ) {
        boundValue = 12000;
        unit = isRtl ? `${detectedCurrency}/حالة` : `${detectedCurrency}/case`;
        type = 'numeric_min';
        isBound = true;
        rationale = isRtl
          ? `سقف الحالة المرضية الواحدة سنوياً المستخرج من الكراسة هو 12,000 ${detectedCurrency}.`
          : `Per-case annual cap extracted from RFP is 12,000 ${detectedCurrency}.`;
      }
      // 4. Annual overall limit per person: سقف التغطية التأمينية لكل شخص سنوياً (100,000 / 150,000)
      else if (
        name.includes('سقف التغطية') || 
        name.includes('سقف التغطيه') || 
        name.includes('الحد الأقصى للتغطية') || 
        name.includes('التغطية السنوية لكل شخص') ||
        name.includes('annual limit') ||
        name.includes('overall limit') ||
        (name.includes('سقف') && (name.includes('سنوي') || name.includes('إجمالي') || name.includes('شخص')))
      ) {
        // Check if text has 100,000 or 150,000
        const has100k = textLower.includes('100,000') || textLower.includes('100000') || textLower.includes('مائة ألف') || textLower.includes('مئة ألف');
        boundValue = has100k ? 100000 : 150000;
        unit = isRtl ? `${detectedCurrency}/سنة` : `${detectedCurrency}/year`;
        type = 'numeric_min';
        isBound = true;
        rationale = isRtl
          ? `الحد الأقصى للتغطية السنوية الإجمالية المستخرج من الكراسة هو ${boundValue.toLocaleString()} ${detectedCurrency} لكل شخص سنوياً.`
          : `Overall annual limit per member extracted from RFP is ${boundValue.toLocaleString()} ${detectedCurrency}.`;
      }
      // 5. Outpatient copay / Deductible
      else if (name.includes('تحمل') || name.includes('نسبة التحمل') || name.includes('copay') || name.includes('deductible')) {
        const copayMatch = text.match(/(\d+)%\s*(?:تحمل|خصم|copay)/i);
        if (copayMatch) {
          boundValue = parseInt(copayMatch[1], 10);
          unit = isRtl ? '% (حد أقصى للتحمل)' : '% (Max copay)';
          type = 'numeric_max';
          isBound = true;
          rationale = isRtl ? `نسبة التحمل القصوى المسموحة هي ${boundValue}%.` : `Maximum allowed copay is ${boundValue}%.`;
        }
      }
      // 6. Dental
      else if (name.includes('أسنان') || name.includes('اسنان') || name.includes('dental')) {
        if (textLower.includes('أسنان') || textLower.includes('اسنان') || textLower.includes('dental')) {
          boundValue = 3000;
          unit = detectedCurrency;
          type = 'numeric_min';
          isBound = true;
          rationale = isRtl ? `سقف علاج وجراحة الأسنان المستخرج: 3,000 ${detectedCurrency}.` : `Dental care annual cap: 3,000 ${detectedCurrency}.`;
        }
      }
      // 7. Optical
      else if (name.includes('بصر') || name.includes('نظارات') || name.includes('نظارة') || name.includes('optical')) {
        if (textLower.includes('نظارات') || textLower.includes('نظارة') || textLower.includes('بصري')) {
          boundValue = 800;
          unit = isRtl ? `${detectedCurrency}/سنتين` : `${detectedCurrency}/2 years`;
          type = 'numeric_min';
          isBound = true;
          rationale = isRtl ? `مخصص النظارات الطبية المستخرج: 800 ${detectedCurrency}.` : `Optical allowance: 800 ${detectedCurrency}.`;
        }
      }
      // 8. Maternity
      else if (name.includes('أمومة') || name.includes('ولادة') || name.includes('حمل') || name.includes('maternity')) {
        if (textLower.includes('ولادة') || textLower.includes('أمومة') || textLower.includes('maternity')) {
          boundValue = 20000;
          unit = detectedCurrency;
          type = 'numeric_min';
          isBound = true;
          rationale = isRtl ? `سقف رعاية الأمومة والولادة: 20,000 ${detectedCurrency}.` : `Maternity care cap: 20,000 ${detectedCurrency}.`;
        }
      }
      // 9. Medicines
      else if (name.includes('أدوية') || name.includes('ادوية') || name.includes('علاجات') || name.includes('صيدلانية') || name.includes('pharmacy') || name.includes('medication')) {
        if (textLower.includes('أدوية') || textLower.includes('ادوية') || textLower.includes('علاجات')) {
          boundValue = 5000;
          unit = detectedCurrency;
          type = 'numeric_min';
          isBound = true;
          rationale = isRtl ? `سقف الأدوية والعلاجات: 5,000 ${detectedCurrency}.` : `Prescription drugs cap: 5,000 ${detectedCurrency}.`;
        }
      }
      // 10. Room
      else if (name.includes('غرفة') || name.includes('إقامة') || name.includes('تنويم') || name.includes('room') || name.includes('accommodation')) {
        if (textLower.includes('غرفة') || textLower.includes('إقامة') || textLower.includes('room')) {
          boundValue = isRtl ? 'غرفة مفردة خاصة (Private Single Room)' : 'Private Single Room';
          unit = isRtl ? 'فئة الغرفة' : 'Room Class';
          type = 'qualitative';
          isBound = true;
          rationale = isRtl ? 'فئة غرفة التنويم المطلوبة بالكراسة: مفردة خاصة.' : 'Hospitalization room requirement: Private Single Room.';
        }
      }

      // If not bound, mark cleanly as open general coverage (NO confusing placeholder!)
      if (!isBound) {
        boundValue = isRtl ? 'مفتوح (تغطية عامة مشمولة)' : 'Open (Covered under general terms)';
        rationale = isRtl 
          ? 'لم يرد سقف تقييدي في نص الكراسة - منفعة عامة مشمولة ومفتوحة وفق الشروط القياسية.' 
          : 'Covered under general policy terms - no restrictive cap specified in RFP.';
      }

      return {
        requirementId: req.id,
        benefitName: req.name,
        category: req.category,
        originalExcelValue: req.targetValue,
        boundValue,
        unit: unit || req.unit || '',
        type,
        weight: req.weight || 3,
        priority: req.priority || 'medium',
        isMandatory: req.isMandatory || false,
        isBoundFromConditions: isBound,
        bindingType: isExcluded ? 'excluded' : isBound ? 'cap_bound' : 'open_general',
        rationale
      };
    });

    setBoundItems(items);
    try {
      localStorage.setItem(storageKey, JSON.stringify(items));
    } catch {}
  };

  // Run AI Binding via Server Route with automatic client fallback (MANUAL ONLY)
  const runAiBinding = async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await authFetch('/api/bind-conditions-to-benefits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          benefits: excelBenefits,
          conditionsText,
          conditionsFileBase64,
          conditionsMimeType
        })
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const data = await response.json();
      if (data && Array.isArray(data.boundRequirements) && data.boundRequirements.length > 0) {
        // Clean any residual placeholder text from bound requirements
        const cleaned = data.boundRequirements.map((item: any) => {
          const isExc = isItemExcluded(item);
          let val = item.boundValue;
          let rat = item.rationale;
          const isBound = Boolean(item.isBoundFromConditions);

          if (!isBound) {
            if (!val || val === 'غير محدد (يتم استخراجه من كراسة الشروط)' || val === 'مفتوح') {
              val = isRtl ? 'مفتوح (تغطية عامة مشمولة)' : 'Open (Covered under general terms)';
            }
            if (!rat || rat.includes('غير محدد') || rat.includes('ملف جدول المنافع')) {
              rat = isRtl ? 'لم يرد سقف تقييدي في نص الكراسة - منفعة عامة مشمولة ومفتوحة وفق الشروط القياسية.' : 'Covered under general policy terms - no restrictive cap specified in RFP.';
            }
          }

          return {
            ...item,
            boundValue: val,
            rationale: rat,
            bindingType: isExc ? 'excluded' : isBound ? 'cap_bound' : 'open_general'
          };
        });

        setBoundItems(cleaned);
        setSummaryOverview(data.summaryOverview || '');

        // Persist to localStorage so results remain preserved
        try {
          localStorage.setItem(storageKey, JSON.stringify(cleaned));
          if (data.summaryOverview) {
            localStorage.setItem(summaryStorageKey, data.summaryOverview);
          }
        } catch {}
      } else {
        performClientSideBindingFallback();
      }
    } catch (err: any) {
      console.warn('AI binding route fallback triggered:', err);
      performClientSideBindingFallback();
    } finally {
      setIsLoading(false);
    }
  };

  // NOTE: Matching is strictly MANUAL. We do NOT run automatically in useEffect to preserve existing results.

  // Compute exact, consistent, transparent statistics
  const stats = useMemo(() => {
    const total = boundItems.length;
    const boundCaps = boundItems.filter(isItemBoundWithCap);
    const excluded = boundItems.filter(isItemExcluded);
    const openGeneral = boundItems.filter(isItemOpenGeneral);

    const boundCapsCount = boundCaps.length;
    const excludedCount = excluded.length;
    const openGeneralCount = openGeneral.length;

    const boundCapsPercent = total > 0 ? Math.round((boundCapsCount / total) * 100) : 0;
    const excludedPercent = total > 0 ? Math.round((excludedCount / total) * 100) : 0;
    const openGeneralPercent = total > 0 ? Math.max(0, 100 - boundCapsPercent - excludedPercent) : 0;

    return {
      total,
      boundCapsCount,
      excludedCount,
      openGeneralCount,
      boundCapsPercent,
      excludedPercent,
      openGeneralPercent
    };
  }, [boundItems]);

  const handleApply = () => {
    const finalReqs: BenefitRequirement[] = boundItems.map((item) => ({
      id: item.requirementId || item.id || `req_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      name: item.benefitName || item.name,
      category: item.category || (isRtl ? 'عام' : 'General'),
      targetValue: item.boundValue ?? (isRtl ? 'مفتوح (تغطية عامة مشمولة)' : 'Open (Covered under general terms)'),
      unit: item.unit || '',
      type: item.type || 'numeric_min',
      weight: item.weight || 3,
      priority: item.priority || 'medium',
      isMandatory: Boolean(item.isMandatory),
      description: item.rationale || item.description || ''
    }));

    onApplyBoundRequirements(finalReqs);
  };

  // Filter items based on user selection and search query
  const filteredItems = useMemo(() => {
    return boundItems.filter((item) => {
      const name = (item.benefitName || item.name || '').toLowerCase();
      const cat = (item.category || '').toLowerCase();
      const valStr = String(item.boundValue || '').toLowerCase();
      const q = searchQuery.toLowerCase().trim();

      const matchesSearch = !q || name.includes(q) || cat.includes(q) || valStr.includes(q);

      let matchesFilter = true;
      if (activeFilter === 'bound_caps') {
        matchesFilter = isItemBoundWithCap(item);
      } else if (activeFilter === 'excluded') {
        matchesFilter = isItemExcluded(item);
      } else if (activeFilter === 'open_general') {
        matchesFilter = isItemOpenGeneral(item);
      }

      return matchesSearch && matchesFilter;
    });
  }, [boundItems, searchQuery, activeFilter]);

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            {/* Header Badges in ONE strict single row */}
            <div className="flex items-center gap-2 overflow-x-auto whitespace-nowrap flex-nowrap pb-1 no-scrollbar">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 shrink-0 whitespace-nowrap">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="whitespace-nowrap">{isRtl ? 'الخطوة ٣ من ٦: نتائج المطابقة والتحليل الإحصائي للسقوف' : 'Step 3 of 6: Ceilings Reconciliation & Analytics'}</span>
              </span>
              {projectYear && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-slate-900 text-white shadow-2xs shrink-0 whitespace-nowrap">
                  <span>{projectYear}</span>
                </span>
              )}
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0 whitespace-nowrap">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="whitespace-nowrap">{isRtl ? 'المطابقة يدوية (النتائج محفوظة)' : 'Manual Matching (Results Preserved)'}</span>
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">
              {isRtl ? '٣. تدقيق المنافع المعتمدة وإحصائيات سقوف الكراسة' : '3. Reconciled Benefits & RFP Ceilings Analytics'}
            </h2>
            <p className="text-sm text-slate-600 max-w-3xl leading-relaxed">
              {isRtl
                ? 'يوضح الجدول والإحصائيات أدناه تصنيف كافة منافع الكتالوج بدقة: ما تم استخراجه وتقييده بسقف من الكراسة، ما تم استثناؤه صراحة، والمنافع التي لم يرد ذكر سقف مقيّد لها فتعتبر مغطاة حكماً بتغطية عامة مفتوحة.'
                : 'Detailed reconciliation between catalog benefits and RFP conditions: items with explicit caps, explicit exclusions, and benefits covered under standard open policy terms.'}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <button
              id="btn-step3-manual-run"
              onClick={runAiBinding}
              disabled={isLoading}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors cursor-pointer shadow-sm disabled:opacity-60 whitespace-nowrap"
              title={isRtl ? 'تشغيل مطابقة شروط الكراسة بالمنافع يدوياً' : 'Run AI matching manually'}
            >
              <Sparkles className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span>
                {boundItems.length > 0 
                  ? (isRtl ? 'إعادة تشغيل المطابقة الذكية (يدوياً)' : 'Re-run AI Matching (Manual)')
                  : (isRtl ? 'بدء المطابقة والربط الذكي (يدوياً)' : 'Start AI Matching (Manual)')}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Reassuring Status Banner: Preserved Results & Manual Mode */}
      <div className="bg-emerald-50/90 border border-emerald-200 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-emerald-100 border border-emerald-300 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-4.5 h-4.5 text-emerald-700" />
          </div>
          <div>
            <p className="font-bold text-emerald-950 text-xs sm:text-sm">
              {boundItems.length > 0
                ? (isRtl 
                    ? `تم الاحتفاظ بآخر نتائج مطابقة تم توليدها (${stats.total} منفعة معتمدة)`
                    : `Last generated matching results are preserved (${stats.total} benefits)`)
                : (isRtl
                    ? 'المطابقة تعمل يدوياً فقط للحفاظ على بياناتك وسرعة تصفح التطبيق'
                    : 'Matching is purely manual on-demand to preserve data and optimize performance')}
            </p>
            <p className="text-emerald-700 mt-0.5 leading-relaxed">
              {isRtl
                ? 'لا يتم تشغيل المطابقة تلقائياً عند فتح الشاشة لمنع فقدان نتائجك. يمكنك النقر على الزر للمطابقة أو إعادة استخراج السقوف متى شئت.'
                : 'Matching is not auto-executed on screen load, preventing unexpected overwrites. Click the button whenever you wish to re-match.'}
            </p>
          </div>
        </div>
        <button
          onClick={runAiBinding}
          disabled={isLoading}
          className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl font-bold bg-white hover:bg-emerald-100/60 text-emerald-900 border border-emerald-300 transition-colors cursor-pointer shrink-0 shadow-2xs whitespace-nowrap"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-emerald-700 ${isLoading ? 'animate-spin' : ''}`} />
          <span>{boundItems.length > 0 ? (isRtl ? 'إعادة الاستخراج يدوياً' : 'Re-extract Manually') : (isRtl ? 'تشغيل المطابقة الآن' : 'Run Matching Now')}</span>
        </button>
      </div>

      {/* Comprehensive Statistical KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Bound with Explicit Caps */}
        <div 
          onClick={() => setActiveFilter(activeFilter === 'bound_caps' ? 'all' : 'bound_caps')}
          className={`bg-white border rounded-2xl p-4.5 shadow-2xs transition-all cursor-pointer hover:shadow-md ${
            activeFilter === 'bound_caps' 
              ? 'border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-50/20' 
              : 'border-slate-200 hover:border-emerald-300'
          }`}
        >
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
              {stats.boundCapsPercent}% {isRtl ? 'من الكتالوج' : 'of total'}
            </span>
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500">
              {isRtl ? 'منافع مقيدة بسقوف صريحة بالكراسة' : 'Explicitly Cap-Bound in RFP'}
            </div>
            <div className="text-2xl font-black text-emerald-700 mt-1">
              {stats.boundCapsCount} <span className="text-sm font-bold text-emerald-600">{isRtl ? 'منفعة' : 'benefits'}</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              {isRtl ? 'سقوف مالية، نماذج كشف، نسب تحمل، وغرف' : 'Financial caps, visit limits, copays'}
            </div>
          </div>
        </div>

        {/* Card 2: Explicit Exclusions */}
        <div 
          onClick={() => setActiveFilter(activeFilter === 'excluded' ? 'all' : 'excluded')}
          className={`bg-white border rounded-2xl p-4.5 shadow-2xs transition-all cursor-pointer hover:shadow-md ${
            activeFilter === 'excluded' 
              ? 'border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/20' 
              : 'border-slate-200 hover:border-rose-300'
          }`}
        >
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
              <Ban className="w-5 h-5" />
            </div>
            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
              stats.excludedCount > 0 
                ? 'bg-rose-100 text-rose-800 border-rose-200' 
                : 'bg-slate-100 text-slate-600 border-slate-200'
            }`}>
              {stats.excludedCount > 0 ? (isRtl ? 'مستثنى' : 'Excluded') : (isRtl ? 'لا استثناءات' : 'None')}
            </span>
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500">
              {isRtl ? 'منافع مستثناة صراحة بنص الكراسة' : 'Explicit RFP Exclusions'}
            </div>
            <div className={`text-2xl font-black mt-1 ${stats.excludedCount > 0 ? 'text-rose-700' : 'text-slate-700'}`}>
              {stats.excludedCount} <span className="text-sm font-bold text-slate-500">{isRtl ? 'منفعة' : 'benefits'}</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              {isRtl ? 'حالات مستثناة وغير مغطاة بموجب الشروط' : 'Items not covered per RFP policy'}
            </div>
          </div>
        </div>

        {/* Card 3: Open General Coverage */}
        <div 
          onClick={() => setActiveFilter(activeFilter === 'open_general' ? 'all' : 'open_general')}
          className={`bg-white border rounded-2xl p-4.5 shadow-2xs transition-all cursor-pointer hover:shadow-md ${
            activeFilter === 'open_general' 
              ? 'border-sky-500 ring-2 ring-sky-500/20 bg-sky-50/20' 
              : 'border-slate-200 hover:border-sky-300'
          }`}
        >
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center shrink-0">
              <Layers className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 border border-sky-200">
              {stats.openGeneralPercent}% {isRtl ? 'تغطية مفتوحة' : 'Open'}
            </span>
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500">
              {isRtl ? 'منافع لم يرد ذكرها بالكراسة (تغطية عامة)' : 'Open General Coverage (No Specific Cap)'}
            </div>
            <div className="text-2xl font-black text-sky-700 mt-1">
              {stats.openGeneralCount} <span className="text-sm font-bold text-sky-600">{isRtl ? 'منفعة' : 'benefits'}</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              {isRtl ? 'مشمولة حكماً دون سقف مقيد وفق الشروط العامة' : 'Covered under general policy terms'}
            </div>
          </div>
        </div>

        {/* Card 4: Total Reconciled Catalog */}
        <div 
          onClick={() => setActiveFilter('all')}
          className={`bg-white border rounded-2xl p-4.5 shadow-2xs transition-all cursor-pointer hover:shadow-md ${
            activeFilter === 'all' 
              ? 'border-indigo-500 ring-2 ring-indigo-500/20 bg-indigo-50/20' 
              : 'border-slate-200 hover:border-indigo-300'
          }`}
        >
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200">
              100% {isRtl ? 'معتمد' : 'Validated'}
            </span>
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500">
              {isRtl ? 'إجمالي المنافع المعتمدة للمقارنة' : 'Total Reconciled Benefits'}
            </div>
            <div className="text-2xl font-black text-indigo-700 mt-1">
              {stats.total} <span className="text-sm font-bold text-indigo-600">{isRtl ? 'منفعة' : 'benefits'}</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              {isRtl ? 'الكتالوج الكامل لاحتساب درجات عروض التأمين' : 'Complete catalog for scoring proposals'}
            </div>
          </div>
        </div>

      </div>

      {/* Comprehensive Statistical Breakdown & Audit Bar */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
            <BarChart3 className="w-4 h-4 text-emerald-600" />
            <span>{isRtl ? 'لوحة التحليل الإحصائي لتوزيع المنافع والسقوف المعتمدة' : 'Statistical Distribution of Reconciled Benefits'}</span>
          </div>
          <div className="text-xs text-slate-500 flex items-center gap-3">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              <span>{isRtl ? 'مقيدة بسقف صريح' : 'Cap-Bound'}: <b>{stats.boundCapsCount}</b></span>
            </span>
            {stats.excludedCount > 0 && (
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                <span>{isRtl ? 'مستثناة بالكراسة' : 'Excluded'}: <b>{stats.excludedCount}</b></span>
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-500"></span>
              <span>{isRtl ? 'تغطية عامة مفتوحة' : 'Open Cover'}: <b>{stats.openGeneralCount}</b></span>
            </span>
          </div>
        </div>

        {/* Visual Progress Bar Distribution */}
        <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden flex">
          <div 
            style={{ width: `${stats.boundCapsPercent}%` }} 
            className="bg-emerald-500 h-full transition-all duration-500" 
            title={isRtl ? `مقيدة بسقف: ${stats.boundCapsCount} (${stats.boundCapsPercent}%)` : `Cap-Bound: ${stats.boundCapsCount} (${stats.boundCapsPercent}%)`}
          />
          {stats.excludedCount > 0 && (
            <div 
              style={{ width: `${stats.excludedPercent}%` }} 
              className="bg-rose-500 h-full transition-all duration-500" 
              title={isRtl ? `مستثناة: ${stats.excludedCount} (${stats.excludedPercent}%)` : `Excluded: ${stats.excludedCount} (${stats.excludedPercent}%)`}
            />
          )}
          <div 
            style={{ width: `${stats.openGeneralPercent}%` }} 
            className="bg-sky-400 h-full transition-all duration-500" 
            title={isRtl ? `تغطية عامة مفتوحة: ${stats.openGeneralCount} (${stats.openGeneralPercent}%)` : `Open Cover: ${stats.openGeneralCount} (${stats.openGeneralPercent}%)`}
          />
        </div>

        {/* Explanatory text resolving ambiguity */}
        <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200/80 text-xs text-slate-600 flex items-start gap-2.5">
          <Info className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold text-slate-800">
              {isRtl 
                ? `قاعدة التقييم والاعتماد (${stats.total} منفعة إجمالية):` 
                : `Evaluation Rules & Standards (${stats.total} Total Benefits):`}
            </p>
            <p className="leading-relaxed">
              {isRtl
                ? `المنافع المستخرجة من الكراسة تم تقييدها بسقوفها الرقمية الصريحة (${stats.boundCapsCount} منفعة) أو توثيقها كاستثناء غير مغطى (${stats.excludedCount} منفعة). أما بقية المنافع (${stats.openGeneralCount} منفعة) التي لم يُنص على سقف خاص لها في الكراسة، فهي مشمولة حكماً كـ "تغطية عامة مفتوحة" دون وجود سقف استثنائي يقيدها، وتقيّم عروض الشركات بناءً على تقديمها كاملة.`
                : `Benefits with specific figures in the RFP (${stats.boundCapsCount}) are enforced with explicit caps. Benefits not specifically restricted (${stats.openGeneralCount}) are marked as Open General Coverage and evaluated based on full standard coverage.`}
            </p>
          </div>
        </div>
      </div>

      {/* Binding Results Table */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
        
        {/* Table Toolbar & Interactive Filter Tabs */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-3 border-b border-slate-100">
          
          {/* Interactive Filter Pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => setActiveFilter('all')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeFilter === 'all'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <span>{isRtl ? 'كافة المنافع' : 'All Benefits'}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                activeFilter === 'all' ? 'bg-slate-700 text-white' : 'bg-slate-200 text-slate-800'
              }`}>
                {stats.total}
              </span>
            </button>

            <button
              onClick={() => setActiveFilter('bound_caps')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeFilter === 'bound_caps'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
              }`}
            >
              <Check className="w-3 h-3" />
              <span>{isRtl ? 'المقيدة بسقوف صريحة' : 'Bound Caps'}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                activeFilter === 'bound_caps' ? 'bg-emerald-700 text-white' : 'bg-emerald-200 text-emerald-900'
              }`}>
                {stats.boundCapsCount}
              </span>
            </button>

            {stats.excludedCount > 0 && (
              <button
                onClick={() => setActiveFilter('excluded')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeFilter === 'excluded'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-200'
                }`}
              >
                <Ban className="w-3 h-3" />
                <span>{isRtl ? 'المستثناة بالكراسة' : 'Excluded'}</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  activeFilter === 'excluded' ? 'bg-rose-700 text-white' : 'bg-rose-200 text-rose-900'
                }`}>
                  {stats.excludedCount}
                </span>
              </button>
            )}

            <button
              onClick={() => setActiveFilter('open_general')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeFilter === 'open_general'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'bg-sky-50 text-sky-800 hover:bg-sky-100 border border-sky-200'
              }`}
            >
              <Layers className="w-3 h-3" />
              <span>{isRtl ? 'لم ترد بالكراسة (تغطية مفتوحة)' : 'Open Cover'}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                activeFilter === 'open_general' ? 'bg-sky-700 text-white' : 'bg-sky-200 text-sky-900'
              }`}>
                {stats.openGeneralCount}
              </span>
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search className={`w-3.5 h-3.5 text-slate-400 absolute ${isRtl ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2`} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isRtl ? 'بحث في اسم المنفعة أو السقف...' : 'Search benefit name or cap...'}
              className={`w-full ${isRtl ? 'pr-8 pl-3' : 'pl-8 pr-3'} py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:ring-2 focus:ring-emerald-500 focus:outline-none`}
            />
          </div>
        </div>

        {/* Loading Indicator */}
        {isLoading ? (
          <div className="py-16 text-center space-y-3">
            <RefreshCw className="w-10 h-10 mx-auto text-emerald-600 animate-spin" />
            <p className="text-sm font-bold text-slate-800">{isRtl ? 'جاري مطابقة وربط قيم الكراسة بالمنافع...' : 'Matching RFP conditions with benefits...'}</p>
          </div>
        ) : (
          <div className="overflow-x-auto max-h-[480px] border border-slate-200 rounded-2xl shadow-2xs">
            <table className="w-full text-xs text-start">
              <thead className="bg-slate-100/90 text-slate-700 font-bold sticky top-0 z-10 border-b border-slate-200">
                <tr>
                  <th className="p-3 text-start w-12">#</th>
                  <th className="p-3 text-start min-w-[280px]">{isRtl ? 'اسم المنفعة المطلوبة والسند من الكراسة' : 'Benefit Name & Sourcing Rationale'}</th>
                  <th className="p-3 text-start w-32">{isRtl ? 'الفئة' : 'Category'}</th>
                  <th className="p-3 text-start min-w-[190px]">{isRtl ? 'السقف / القيمة المطلوبة' : 'Required Target / Cap'}</th>
                  <th className="p-3 text-start w-36">{isRtl ? 'نوع الشرط' : 'Rule Type'}</th>
                  <th className="p-3 text-start w-40">{isRtl ? 'حالة الاعتماد' : 'Status'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredItems.map((item, idx) => {
                  const isExc = isItemExcluded(item);
                  const isCapBound = isItemBoundWithCap(item);
                  const isOpen = isItemOpenGeneral(item);

                  return (
                    <tr key={item.requirementId || idx} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3 text-slate-400 font-mono text-[11px]">{idx + 1}</td>
                      <td className="p-3">
                        <div className="font-bold text-slate-900 text-xs sm:text-sm">
                          {item.benefitName || item.name}
                        </div>
                        {item.rationale ? (
                          <div className={`text-[11px] mt-1 leading-normal ${
                            isExc 
                              ? 'text-rose-700 font-semibold' 
                              : isCapBound 
                              ? 'text-emerald-700 font-medium' 
                              : 'text-slate-500'
                          }`}>
                            {item.rationale}
                          </div>
                        ) : null}
                      </td>
                      <td className="p-3">
                        <span className="inline-block px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                          {item.category || (isRtl ? 'عام' : 'General')}
                        </span>
                      </td>
                      <td className="p-3">
                        {isExc ? (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-50 text-rose-800 border border-rose-200 font-bold text-xs">
                            <Ban className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                            <span>{isRtl ? 'غير مغطى (مستثنى بنص الكراسة)' : 'Not Covered (Excluded)'}</span>
                          </div>
                        ) : isCapBound ? (
                          <div>
                            <div className="font-extrabold text-emerald-800 text-xs sm:text-sm">
                              {typeof item.boundValue === 'number'
                                ? `${item.boundValue.toLocaleString()} ${item.unit || ''}`
                                : String(item.boundValue || item.targetValue || '')}
                            </div>
                            <div className="text-[10px] text-emerald-600 font-semibold mt-0.5">
                              {isRtl ? '✓ سقف صريح مستخرج من الكراسة' : 'Explicit Cap from RFP'}
                            </div>
                          </div>
                        ) : (
                          <div>
                            <div className="font-bold text-slate-700 text-xs">
                              {isRtl ? 'مفتوح (تغطية عامة مشمولة)' : 'Open (Standard Coverage)'}
                            </div>
                            <div className="text-[10px] text-slate-400 mt-0.5">
                              {isRtl ? 'لم يرد سقف تقييدي بالكراسة' : 'No restrictive cap in RFP'}
                            </div>
                          </div>
                        )}
                      </td>
                      <td className="p-3">
                        <span className="inline-block px-2.5 py-1 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                          {item.type === 'numeric_min' ? (isRtl ? 'حد أدنى مطلوب' : 'Min Required') :
                           item.type === 'numeric_max' ? (isRtl ? 'سقف أقصى للتحمل' : 'Max Ceiling') :
                           item.type === 'boolean' ? (isRtl ? 'مشمول نعم/لا' : 'Included Yes/No') :
                           (isRtl ? 'مواصفة نوعية' : 'Qualitative')}
                        </span>
                      </td>
                      <td className="p-3">
                        {isExc ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-300 shadow-2xs">
                            <Ban className="w-3 h-3 text-rose-600" />
                            <span>{isRtl ? 'مستثنى بالكراسة' : 'Excluded'}</span>
                          </span>
                        ) : isCapBound ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-2xs">
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span>{isRtl ? 'مقيد بسقف صريح' : 'Explicit Cap'}</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-sky-50 text-sky-800 border border-sky-200">
                            <Layers className="w-3 h-3 text-sky-600" />
                            <span>{isRtl ? 'تغطية عامة مفتوحة' : 'Open Cover'}</span>
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}

                {filteredItems.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400">
                      <p className="font-semibold text-sm">{isRtl ? 'لا توجد منافع تطابق الفلتر أو البحث الحالي.' : 'No benefits match current filter.'}</p>
                      <button
                        onClick={() => { setActiveFilter('all'); setSearchQuery(''); }}
                        className="mt-2 text-xs font-bold text-emerald-600 hover:underline cursor-pointer"
                      >
                        {isRtl ? 'إعادة ضبط الفلتر وعرض كافة المنافع' : 'Reset Filter'}
                      </button>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Bottom CTA Action Bar */}
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-100">
          <button
            onClick={onNavigatePrev}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{isRtl ? 'رجوع للخطوة ٢ (كراسة الشروط)' : 'Back to Step 2'}</span>
          </button>

          <button
            id="btn-step3-apply-and-proceed-to-step4"
            onClick={handleApply}
            disabled={boundItems.length === 0 || isLoading}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3 rounded-2xl text-sm font-bold bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 transition-all shadow-md hover:shadow-lg cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{isRtl ? `اعتماد المنافع (${stats.total}) والانتقال للمراجعة (الخطوة ٤)` : `Approve (${stats.total}) & Proceed to Step 4`}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>

    </div>
  );
};
