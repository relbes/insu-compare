import React, { useState, useRef } from 'react';
import { 
  FileSpreadsheet, 
  FileText, 
  Sparkles, 
  Upload, 
  Check, 
  X, 
  AlertCircle, 
  Download, 
  CheckCircle2, 
  Layers, 
  PlusCircle, 
  Info,
  Building2,
  FileCheck,
  Trash2,
  Plus,
  ArrowRight,
  ArrowLeft,
  Search,
  Filter,
  CheckSquare,
  Square,
  Star,
  Quote,
  Sliders,
  ShieldCheck
} from 'lucide-react';
import { BenefitRequirement, BenefitEvaluationType, PriorityLevel } from '../types';
import { authFetch } from '../utils/authInterceptor';
import { useI18n } from '../i18n/I18nContext';
import { 
  parseBenefitsExcel, 
  downloadSingleColumnExcelTemplate, 
  downloadBenefitAndCategoryExcelTemplate,
  downloadSampleExcelTemplate,
  DEFAULT_SINGLE_COLUMN_BENEFITS,
  inferBenefitCategory 
} from '../utils/excelParser';

interface ExcelAndConditionsBinderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyRequirements: (reqs: BenefitRequirement[], andProceedToProposals?: boolean) => void;
  currentRequirements?: BenefitRequirement[];
}

export const ExcelAndConditionsBinderModal: React.FC<ExcelAndConditionsBinderModalProps> = ({
  isOpen,
  onClose,
  onApplyRequirements,
  currentRequirements = []
}) => {
  const { isRtl } = useI18n();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textFileInputRef = useRef<HTMLInputElement>(null);

  // Wizard Sub-steps: 1 = Upload & Edit Benefits, 2 = Conditions Text, 3 = Compare & Confirm
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Step 1 States: Loaded Benefits List
  const [loadedBenefits, setLoadedBenefits] = useState<BenefitRequirement[]>(() => {
    return currentRequirements && currentRequirements.length > 0
      ? currentRequirements
      : DEFAULT_SINGLE_COLUMN_BENEFITS;
  });
  const [excelFileName, setExcelFileName] = useState<string>('');
  const [isUploadingExcel, setIsUploadingExcel] = useState<boolean>(false);
  const [excelError, setExcelError] = useState<string | null>(null);
  const [benefitSearchQuery, setBenefitSearchQuery] = useState<string>('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');

  // Inline Quick Add for Step 1
  const [newBenefitName, setNewBenefitName] = useState<string>('');
  const [newBenefitCategory, setNewBenefitCategory] = useState<string>('');

  // Step 2 States: Conditions Text & Document
  const [conditionsText, setConditionsText] = useState<string>('');
  const [conditionsFileName, setConditionsFileName] = useState<string>('');
  const [conditionsFileBase64, setConditionsFileBase64] = useState<string | null>(null);
  const [conditionsMimeType, setConditionsMimeType] = useState<string>('');
  const [isBinding, setIsBinding] = useState<boolean>(false);
  const [bindError, setBindError] = useState<string | null>(null);

  // Step 3 States: Bound & Reconciled Benefits
  const [boundBenefits, setBoundBenefits] = useState<any[]>([]);
  const [summaryOverview, setSummaryOverview] = useState<string>('');
  const [matchedCount, setMatchedCount] = useState<number>(0);
  const [unmatchedCount, setUnmatchedCount] = useState<number>(0);
  const [suggestedExtras, setSuggestedExtras] = useState<BenefitRequirement[]>([]);
  const [includeExtras, setIncludeExtras] = useState<boolean>(true);
  const [auditSearchQuery, setAuditSearchQuery] = useState<string>('');
  const [auditFilterStatus, setAuditFilterStatus] = useState<'all' | 'bound' | 'open'>('all');

  if (!isOpen) return null;

  // Sample Corporate / University RFP Tender Conditions Text Preset
  const sampleUniversityConditionsRFP = `كراسة الشروط والمواصفات ومحددات السقوف لبرنامج التأمين الطبي لمنسوبي الجامعة:
١. نماذج وكشوفات العيادات الخارجية: يجب ألا يقل عدد نماذج/زيارات الكشف الطبي عن 8 نماذج كشف سنوياً للموظف والتابع كحد أدنى إلزامي.
٢. سقف التغطية السنوية لكل شخص سنوياً: الحد الأقصى للتغطية السنوية الإجمالية هو 100,000 ريال سعودي لكل عضو سنوياً.
٣. نسبة التحمل في العيادات الخارجية والمراكز: الحد الأقصى لنسبة تحمل الموظف في العيادات الخارجية هو 15% فقط ولا تتجاوز 50 ريال كحد أقصى للاستشارة.
٤. الإقامة في المستشفيات وفئة غرفة التنويم: غرفة مفردة خاصة (Private Single Room) مع تغطية كاملة لمرافق المريض للأعمار تحت 12 سنة.
٥. العناية المركزة وحالات الطوارئ: تغطية بنسبة 100% بدون أي فترات انتظار ودون اشتراط موافقة مسبقة في الطوارئ.
٦. الأدوية والعلاجات الصيدلانية: سقف سنوي 5,000 ريال للأدوية مع تغطية كاملة للأمراض المزمنة.
٧. علاج وجراحة الأسنان: سقف 3,000 ريال سنوياً شامل الحشوات وتنظيف الأسنان وعلاج الجذور وخلع الأسنان.
٨. النظارات الطبية والإطارات البصرية: مخصص 800 ريال كل سنتين للإطارات والعدسات الطبية.
٩. تغطية الأمومة والولادة ورعاية المواليد: سقف 20,000 ريال للولادة الطبيعية والقيصرية ومضاعفات الحمل.
١٠. الشبكة الطبية المعتمدة: شبكة الفئة الأولى الممتازة (Tier 1 Prime) تشمل كبرى المستشفيات والمراكز التخصصية.
١١. الاستشارات الطبية عن بعد (Telemedicine): تغطية مجانية 24/7 عبر التطبيق الذكي.
(ملاحظة هامة: المنافع الأخرى المدرجة في جدول بنود التأمين والتي لم يرد لها سقف أو نص مالي صريح في هذه الكراسة، تعتبر منافع عادية مفتوحة دون إلزام بسقف محدد وفق طلب الجامعة).`;

  // Categories present in loaded benefits
  const loadedCategories = Array.from(new Set(loadedBenefits.map((b) => b.category || 'عام')));

  // Filtered benefits for Step 1
  const filteredLoadedBenefits = loadedBenefits.filter((b) => {
    const matchesCat = selectedCategoryFilter === 'all' || b.category === selectedCategoryFilter;
    const matchesSearch =
      (b.name || '').toLowerCase().includes(benefitSearchQuery.toLowerCase()) ||
      (b.category || '').toLowerCase().includes(benefitSearchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  // Handle Excel File Upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    setExcelFileName(file.name);
    setIsUploadingExcel(true);
    setExcelError(null);

    try {
      const parsed = await parseBenefitsExcel(file);
      if (parsed.length === 0) {
        throw new Error('لم يتم استخراج أي منافع من ملف الإكسل. يرجى التأكد من محتوى الملف.');
      }
      setLoadedBenefits(parsed);
      setExcelError(null);
    } catch (err: any) {
      console.error(err);
      setExcelError(err.message || 'حدث خطأ أثناء قراءة ملف الإكسل.');
    } finally {
      setIsUploadingExcel(false);
    }
  };

  // Drag & drop handlers
  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    setExcelFileName(file.name);
    setIsUploadingExcel(true);
    setExcelError(null);

    try {
      const parsed = await parseBenefitsExcel(file);
      if (parsed.length === 0) {
        throw new Error('لم يتم استخراج أي منافع من ملف الإكسل.');
      }
      setLoadedBenefits(parsed);
      setExcelError(null);
    } catch (err: any) {
      console.error(err);
      setExcelError(err.message || 'حدث خطأ أثناء قراءة ملف الإكسل.');
    } finally {
      setIsUploadingExcel(false);
    }
  };

  // Handle University RFP Conditions File Upload (.docx, .doc, .pdf, .txt, .csv, .md)
  const handleTextFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    setConditionsFileName(file.name);
    setConditionsMimeType(file.type || 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');

    try {
      if (file.name.endsWith('.txt') || file.name.endsWith('.csv') || file.name.endsWith('.md')) {
        const text = await file.text();
        setConditionsText(text);
      } else {
        // For docx, doc, pdf, images - read base64
        const reader = new FileReader();
        reader.onload = (event) => {
          const res = event.target?.result as string;
          const b64 = res.split(',')[1] || res;
          setConditionsFileBase64(b64);
          if (!conditionsText) {
            setConditionsText(`[ملف مرفق: ${file.name}]`);
          }
        };
        reader.readAsDataURL(file);
      }
    } catch (err: any) {
      console.error('File read error:', err);
    }
  };

  // Step 1: Inline edit handlers
  const handleUpdateBenefitStep1 = (id: string, updates: Partial<BenefitRequirement>) => {
    setLoadedBenefits((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
  };

  const handleDeleteBenefitStep1 = (id: string) => {
    if (loadedBenefits.length <= 1) {
      alert('يجب الإبقاء على منفعة واحدة على الأقل في القائمة.');
      return;
    }
    setLoadedBenefits((prev) => prev.filter((item) => item.id !== id));
  };

  const handleAddNewBenefitStep1 = () => {
    if (!newBenefitName.trim()) return;

    const cat = newBenefitCategory.trim() || inferBenefitCategory(newBenefitName.trim());
    const newReq: BenefitRequirement = {
      id: `req_custom_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      name: newBenefitName.trim(),
      category: cat,
      targetValue: 'غير محدد (يتم استخراجه من كراسة الشروط)',
      unit: '',
      type: 'numeric_min',
      weight: 3,
      priority: 'medium',
      isMandatory: false,
      description: 'بند مضاف يدوياً'
    };

    setLoadedBenefits((prev) => [...prev, newReq]);
    setNewBenefitName('');
    setNewBenefitCategory('');
  };

  // Quick Preset Handlers
  const handleLoadSingleColumnPreset = () => {
    setLoadedBenefits(DEFAULT_SINGLE_COLUMN_BENEFITS);
    setExcelFileName('جدول بنود التأمين القياسي (١٥ بند مصنف)');
    setExcelError(null);
  };

  // Perform AI Smart Binding between Benefits Table and Conditions Text
  const handleRunAiBinding = async () => {
    if (!conditionsText.trim() && !conditionsFileBase64) {
      setBindError('يرجى إدخال أو رفع كراسة شروط ومواصفات التأمين.');
      return;
    }
    if (loadedBenefits.length === 0) {
      setBindError('يرجى رفع أو تجهيز قائمة المنافع أولاً قبل تنفيذ الربط.');
      return;
    }

    setIsBinding(true);
    setBindError(null);

    try {
      const res = await authFetch('/api/ai-bind-conditions-to-benefits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          existingBenefits: loadedBenefits,
          conditionsText: conditionsText.startsWith('[ملف مرفق:') ? '' : conditionsText,
          fileBase64: conditionsFileBase64,
          mimeType: conditionsMimeType,
          fileName: conditionsFileName
        })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        let errMsg = errData.error || `خطأ في الخادم (رمز ${res.status})`;
        if (typeof errMsg === 'object') {
          errMsg = errMsg.message || JSON.stringify(errMsg);
        }
        throw new Error(errMsg);
      }

      const data = await res.json();
      setBoundBenefits(data.updatedBenefits || []);
      setSummaryOverview(data.summaryOverview || '');
      setMatchedCount(data.matchedCount || 0);
      setUnmatchedCount(data.unmatchedCount || 0);
      setSuggestedExtras(data.suggestedAdditionalBenefits || []);
      setStep(3); // Move to review step
    } catch (err: any) {
      console.error('Error binding conditions:', err);
      let displayError = err.message || 'تعذر استخراج وربط الشروط بالذكاء الاصطناعي.';
      if (displayError.includes('503') || displayError.includes('high demand') || displayError.includes('UNAVAILABLE')) {
        displayError = 'الخدمة تشهد ضغطاً مؤقتاً، جاري تطبيق الربط عبر المحرك الذكي الاحتياطي... يرجى إعادة المحاولة.';
      }
      setBindError(displayError);
    } finally {
      setIsBinding(false);
    }
  };

  // Step 3: Inline edit handlers in Audit Grid
  const handleUpdateBoundBenefit = (id: string, updates: Partial<any>) => {
    setBoundBenefits((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
  };

  const handleDeleteBoundBenefit = (id: string) => {
    if (boundBenefits.length <= 1) {
      alert('يجب الإبقاء على منفعة واحدة على الأقل.');
      return;
    }
    setBoundBenefits((prev) => prev.filter((item) => item.id !== id));
  };

  // Step 3: Add new row in Audit Grid
  const handleAddRowInStep3 = () => {
    const name = prompt(isRtl ? 'أدخل اسم المنفعة / التغطية الجديدة:' : 'Enter new benefit name:');
    if (!name || !name.trim()) return;

    const cat = inferBenefitCategory(name.trim());
    const created = {
      id: `req_step3_${Date.now()}`,
      name: name.trim(),
      category: cat,
      targetValue: 'مفتوح',
      unit: '',
      type: 'numeric_min',
      weight: 3,
      priority: 'medium',
      isMandatory: false,
      isBoundFromText: false,
      bindingQuote: 'تمت إضافته يدوياً أثناء المراجعة',
      description: 'منفعة مضافة يدوياً'
    };

    setBoundBenefits((prev) => [...prev, created]);
  };

  // Filtered bound benefits for Step 3
  const filteredBoundBenefits = boundBenefits.filter((b) => {
    const matchesStatus =
      auditFilterStatus === 'all' ||
      (auditFilterStatus === 'bound' && b.isBoundFromText) ||
      (auditFilterStatus === 'open' && !b.isBoundFromText);

    const matchesSearch =
      (b.name || '').toLowerCase().includes(auditSearchQuery.toLowerCase()) ||
      (b.category || '').toLowerCase().includes(auditSearchQuery.toLowerCase()) ||
      (b.bindingQuote || '').toLowerCase().includes(auditSearchQuery.toLowerCase());

    return matchesStatus && matchesSearch;
  });

  // Apply final requirements and optionally proceed to proposals tab
  const handleFinalApply = (andProceedToProposals: boolean = false) => {
    let finalReqs: BenefitRequirement[] = boundBenefits.map((b) => {
      // Normalize target value
      let val = b.targetValue;
      if (b.type === 'numeric_min' || b.type === 'numeric_max') {
        const parsedNum = parseFloat(String(val).replace(/[^0-9.-]+/g, ''));
        if (!isNaN(parsedNum)) val = parsedNum;
      }
      return {
        id: b.id,
        category: b.category || 'عام',
        name: b.name,
        targetValue: val,
        unit: b.unit || '',
        type: b.type || 'numeric_min',
        weight: b.weight || 3,
        priority: b.priority || 'medium',
        isMandatory: !!b.isMandatory,
        description: b.description || b.bindingQuote || ''
      };
    });

    if (includeExtras && suggestedExtras.length > 0) {
      finalReqs = [...finalReqs, ...suggestedExtras];
    }

    onApplyRequirements(finalReqs, andProceedToProposals);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-6xl max-h-[94vh] flex flex-col overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="px-6 py-4.5 bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-500/20 text-sky-400 border border-sky-400/30 flex items-center justify-center font-bold text-lg">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <span>{isRtl ? 'رفع المنافع المطلوبة وتحديد شروط وسقوف الكراسة واعتمادها' : 'Insurance Benefits & Tender Specifications Binder'}</span>
                <span className="px-2 py-0.5 text-[10px] uppercase font-black tracking-wider bg-sky-500/20 text-sky-300 border border-sky-400/30 rounded-full">
                  AI Smart Match
                </span>
              </h3>
              <p className="text-xs text-slate-300">
                {isRtl 
                  ? 'رفع اسم المنفعة / التغطية وفئتها، تعديل وحذف وإضافة المنافع، ومطابقة السقوف المطلوبة في كراسة الشروط ثم اعتمادها للمفاضلة' 
                  : 'Upload benefit names & categories, edit/delete/add items, bind tender caps, and approve for proposal evaluation.'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Multi-step progress bar */}
        <div className="px-6 py-3 bg-slate-100/90 border-b border-slate-200 flex items-center justify-between gap-2 overflow-x-auto text-xs shrink-0">
          <button 
            onClick={() => setStep(1)}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl cursor-pointer transition-all ${
              step === 1 ? 'bg-white text-sky-700 font-bold shadow-xs border border-sky-200' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold ${
              loadedBenefits.length > 0 ? 'bg-emerald-500 text-white' : 'bg-slate-300 text-slate-700'
            }`}>
              {loadedBenefits.length > 0 ? <Check className="w-3 h-3" /> : '١'}
            </span>
            <span>{isRtl ? '١. قائمة المنافع والفئات (تعديل وحذف وإضافة)' : '1. Benefits & Categories'}</span>
            {loadedBenefits.length > 0 && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold">
                ({loadedBenefits.length})
              </span>
            )}
          </button>

          <div className="text-slate-300">/</div>

          <button 
            onClick={() => loadedBenefits.length > 0 && setStep(2)}
            disabled={loadedBenefits.length === 0}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl transition-all ${
              loadedBenefits.length === 0 ? 'opacity-50 cursor-not-allowed text-slate-400' :
              step === 2 ? 'bg-white text-sky-700 font-bold shadow-xs border border-sky-200 cursor-pointer' : 'text-slate-500 hover:text-slate-800 cursor-pointer'
            }`}
          >
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold ${
              boundBenefits.length > 0 ? 'bg-emerald-500 text-white' : 'bg-slate-300 text-slate-700'
            }`}>
              {boundBenefits.length > 0 ? <Check className="w-3 h-3" /> : '٢'}
            </span>
            <span>{isRtl ? '٢. نص شروط وسقوف الكراسة' : '2. Tender Conditions'}</span>
          </button>

          <div className="text-slate-300">/</div>

          <button 
            onClick={() => boundBenefits.length > 0 && setStep(3)}
            disabled={boundBenefits.length === 0}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl transition-all ${
              boundBenefits.length === 0 ? 'opacity-50 cursor-not-allowed text-slate-400' :
              step === 3 ? 'bg-sky-600 text-white font-bold shadow-xs cursor-pointer' : 'text-slate-500 hover:text-slate-800 cursor-pointer'
            }`}
          >
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold ${
              step === 3 ? 'bg-white text-sky-700' : 'bg-slate-300 text-slate-700'
            }`}>
              ٣
            </span>
            <span>{isRtl ? '٣. جدول المقارنة والتدقيق والاعتماد' : '3. Reconcile & Approve'}</span>
          </button>
        </div>

        {/* Modal Body Content */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-6">

          {/* ======================================================== */}
          {/* STEP 1: Upload, View, Edit, Delete, and Add Benefits      */}
          {/* ======================================================== */}
          {step === 1 && (
            <div className="space-y-5 animate-in fade-in duration-150">
              
              {/* Instructions & Template Downloads Card */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-sky-50/80 p-4 rounded-2xl border border-sky-100">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />
                  <div className="text-xs text-sky-950 space-y-1">
                    <p className="font-bold text-sm">
                      {isRtl 
                        ? 'إدارة بنود وتغطيات التأمين المطلوبة (اسم المنفعة / التغطية & فئة التغطية):' 
                        : 'Manage Insurance Required Benefits (Benefit Name & Category):'}
                    </p>
                    <p className="text-sky-800 leading-relaxed">
                      {isRtl
                        ? 'يمكنك رفع ملف إكسل (عمود واحد للأسماء أو عمودين للاسم والفئة)، وتعديل أو حذف أو إضافة أي منفعة مباشرة في الجدول أدناه قبل الانتقال لاستخراج ومطابقة السقوف من كراسة الشروط.'
                        : 'Upload an Excel sheet (1 column or 2 columns: Name & Category), or edit, delete, and add benefits directly below.'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap shrink-0">
                  <button
                    type="button"
                    onClick={downloadBenefitAndCategoryExcelTemplate}
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold text-sky-800 bg-white hover:bg-sky-100 rounded-xl border border-sky-200 shadow-xs transition-colors cursor-pointer"
                    title="تحميل نموذج إكسل عمودين: اسم المنفعة وفئة التغطية"
                  >
                    <Download className="w-3.5 h-3.5 text-sky-600" />
                    <span>{isRtl ? 'نموذج عمودين (الاسم + الفئة) .xlsx' : '2-Col Template'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={downloadSingleColumnExcelTemplate}
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 rounded-xl border border-slate-200 shadow-xs transition-colors cursor-pointer"
                    title="تحميل نموذج إكسل عمود واحد"
                  >
                    <Download className="w-3.5 h-3.5 text-slate-500" />
                    <span>{isRtl ? 'نموذج عمود واحد .xlsx' : '1-Col Template'}</span>
                  </button>
                  
                  <button
                    type="button"
                    onClick={handleLoadSingleColumnPreset}
                    className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-bold text-emerald-800 bg-emerald-100/80 hover:bg-emerald-200/80 rounded-xl border border-emerald-300 shadow-xs transition-colors cursor-pointer"
                  >
                    <FileCheck className="w-3.5 h-3.5 text-emerald-700" />
                    <span>{isRtl ? 'تحميل جدول البنود القياسي (١٥ منفعة)' : 'Load 15 Standard Benefits'}</span>
                  </button>
                </div>
              </div>

              {/* Upload Dropzone */}
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 hover:border-sky-500 bg-slate-50/70 hover:bg-sky-50/40 rounded-3xl p-6 text-center transition-all cursor-pointer group"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  className="hidden"
                  onChange={handleFileUpload}
                />
                
                <div className="w-14 h-14 mx-auto mb-2.5 rounded-2xl bg-sky-100 text-sky-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <FileSpreadsheet className="w-7 h-7" />
                </div>

                <h4 className="text-sm font-bold text-slate-800 mb-1">
                  {excelFileName 
                    ? `الملف المختار: ${excelFileName}` 
                    : (isRtl ? 'اسحب ملف الإكسل (عمود واحد أو عمودين أو جدول كامل) إلى هنا، أو اضغط للاختيار' : 'Drag & drop Excel file here, or click to browse')}
                </h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  {isRtl 
                    ? 'يدعم ملفات Microsoft Excel (.xlsx, .xls) وجداول CSV. يتعرف النظام تلقائياً على اسم المنفعة وفئة التغطية.' 
                    : 'Supports Microsoft Excel (.xlsx, .xls) and CSV. Automatically detects names and categories.'}
                </p>

                {isUploadingExcel && (
                  <div className="mt-3 inline-flex items-center gap-2 text-xs text-sky-600 font-semibold animate-pulse">
                    <div className="w-3.5 h-3.5 rounded-full border-2 border-sky-600 border-t-transparent animate-spin" />
                    <span>{isRtl ? 'جاري قراءة وتحليل ملف الإكسل...' : 'Parsing Excel file...'}</span>
                  </div>
                )}
              </div>

              {excelError && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{excelError}</span>
                </div>
              )}

              {/* Interactive Benefits Table with Edit, Delete, and Add */}
              <div className="space-y-3 pt-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-sky-600" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                      {isRtl ? 'جدول المنافع المحملة وتصنيفاتها (قابل للتعديل والحذف والإضافة المباشرة):' : 'Loaded Benefits & Categories (Editable Table):'}
                    </h4>
                    <span className="px-2.5 py-0.5 rounded-full bg-sky-100 text-sky-800 font-bold text-xs">
                      {loadedBenefits.length} {isRtl ? 'منفعة' : 'items'}
                    </span>
                  </div>

                  {/* Search and Category Filter */}
                  <div className="flex items-center gap-2">
                    <div className="relative w-48 sm:w-64">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 rtl:left-auto rtl:right-3 top-2.5" />
                      <input
                        type="text"
                        placeholder={isRtl ? 'بحث في المنافع أو الفئات...' : 'Search benefits...'}
                        value={benefitSearchQuery}
                        onChange={(e) => setBenefitSearchQuery(e.target.value)}
                        className="w-full text-xs ps-8 pe-3 py-1.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 bg-slate-50"
                      />
                    </div>
                  </div>
                </div>

                {/* Category Filter Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 text-xs">
                  <button
                    type="button"
                    onClick={() => setSelectedCategoryFilter('all')}
                    className={`px-3 py-1 rounded-xl text-[11px] font-semibold transition-colors cursor-pointer ${
                      selectedCategoryFilter === 'all'
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {isRtl ? 'كافة الفئات' : 'All Categories'} ({loadedBenefits.length})
                  </button>
                  {loadedCategories.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedCategoryFilter(cat)}
                      className={`px-3 py-1 rounded-xl text-[11px] font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                        selectedCategoryFilter === cat
                          ? 'bg-slate-900 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {/* Table */}
                <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs">
                  <div className="max-h-72 overflow-y-auto">
                    <table className="w-full text-start text-xs">
                      <thead className="bg-slate-50/90 sticky top-0 z-10 border-b border-slate-200 text-slate-600 uppercase font-semibold text-[11px]">
                        <tr>
                          <th className="py-2.5 px-3 w-10 text-center">#</th>
                          <th className="py-2.5 px-3 w-3/5">{isRtl ? 'اسم المنفعة / التغطية (قابل للتعديل)' : 'Benefit Name / Coverage (Editable)'}</th>
                          <th className="py-2.5 px-3 w-2/5">{isRtl ? 'فئة التغطية (قابل للتعديل)' : 'Category (Editable)'}</th>
                          <th className="py-2.5 px-3 w-16 text-center">{isRtl ? 'إجراءات' : 'Actions'}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredLoadedBenefits.map((item, idx) => (
                          <tr key={item.id || idx} className="hover:bg-sky-50/30 transition-colors group">
                            <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-400 text-[11px]">
                              {idx + 1}
                            </td>

                            {/* Benefit Name Editable Input */}
                            <td className="py-2.5 px-3">
                              <input
                                type="text"
                                value={item.name}
                                onChange={(e) => handleUpdateBenefitStep1(item.id, { name: e.target.value })}
                                className="w-full text-xs font-bold text-slate-900 bg-transparent hover:bg-white focus:bg-white px-2 py-1 rounded-lg border border-transparent hover:border-slate-200 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                                placeholder="اسم المنفعة أو التغطية..."
                              />
                            </td>

                            {/* Benefit Category Editable Input */}
                            <td className="py-2.5 px-3">
                              <input
                                type="text"
                                value={item.category}
                                onChange={(e) => handleUpdateBenefitStep1(item.id, { category: e.target.value })}
                                className="w-full text-[11px] font-medium text-slate-700 bg-slate-50 hover:bg-white focus:bg-white px-2 py-1 rounded-lg border border-slate-200/80 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                                placeholder="فئة التغطية..."
                              />
                            </td>

                            {/* Delete Action */}
                            <td className="py-2.5 px-3 text-center">
                              <button
                                type="button"
                                onClick={() => handleDeleteBenefitStep1(item.id)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                title="حذف هذه المنفعة"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}

                        {filteredLoadedBenefits.length === 0 && (
                          <tr>
                            <td colSpan={4} className="py-6 text-center text-slate-400 text-xs">
                              {isRtl ? 'لا توجد منافع تطابق البحث الحالي.' : 'No benefits match current filter.'}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Inline Quick Add Row at Table Bottom */}
                  <div className="p-3 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center gap-2">
                    <div className="flex-1 w-full">
                      <input
                        type="text"
                        value={newBenefitName}
                        onChange={(e) => setNewBenefitName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleAddNewBenefitStep1();
                        }}
                        placeholder={isRtl ? '+ أضف اسم منفعة جديدة (مثال: علاج الحروق، التطعيمات، الإسعاف الجوي...)' : '+ Add new benefit name...'}
                        className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                      />
                    </div>

                    <div className="w-full sm:w-64">
                      <input
                        type="text"
                        value={newBenefitCategory}
                        onChange={(e) => setNewBenefitCategory(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleAddNewBenefitStep1();
                        }}
                        placeholder={isRtl ? 'فئة التغطية (اختياري، يحدد تلقائياً)' : 'Category (optional)...'}
                        className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                      />
                    </div>

                    <button
                      type="button"
                      disabled={!newBenefitName.trim()}
                      onClick={handleAddNewBenefitStep1}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-xs transition-colors cursor-pointer shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{isRtl ? 'إضافة منفعة' : 'Add Benefit'}</span>
                    </button>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* ======================================================== */}
          {/* STEP 2: University / Corporate RFP Conditions Text        */}
          {/* ======================================================== */}
          {step === 2 && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div className="bg-amber-50/80 p-4 rounded-2xl border border-amber-200/80 flex items-start gap-3">
                <Building2 className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-950 space-y-1">
                  <p className="font-bold text-sm">
                    {isRtl 
                      ? 'وثيقة كراسة الشروط والمواصفات ومحددات السقوف المطلوبة (الجامعة):' 
                      : 'University RFP & Tender Specifications Text:'}
                  </p>
                  <p className="text-amber-800 leading-relaxed">
                    {isRtl
                      ? 'الصق أو ارفع نص كراسة شروط ومواصفات الجامعة متضمناً السقوف والأرقام (مثل 100,000 ريال، 8 نماذج كشف، نسبة تحمل 15%، غرفة مفردة خاصة، سقف أسنان 3000 ريال). سيقوم الذكاء الاصطناعي بربط كل بند بسقفه المطلوب، وترك المنافع غير المحددة كمنافع عادية مفتوحة دون تقييد.'
                      : 'Paste or upload the tender specs text with caps and requirements. Gemini AI will match limits to your benefits list automatically.'}
                  </p>
                </div>
              </div>

              {/* Quick Preset and Text Upload Buttons */}
              <div className="flex items-center justify-between flex-wrap gap-2">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-sky-600" />
                  <span>{isRtl ? 'نص شروط ومواصفات ومحددات الجامعة المطلوبة:' : 'Tender Specifications Text:'}</span>
                </label>

                <div className="flex items-center gap-2 flex-wrap">
                  <input
                    ref={textFileInputRef}
                    type="file"
                    accept=".doc,.docx,.pdf,.txt,.csv,.md,.text"
                    className="hidden"
                    onChange={handleTextFileUpload}
                  />
                  <button
                    type="button"
                    onClick={() => textFileInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl transition-colors cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5 text-slate-600" />
                    <span>{isRtl ? 'رفع ملف كراسة الشروط (Word / PDF / Text)' : 'Upload RFP Document'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setConditionsText(sampleUniversityConditionsRFP);
                      setConditionsFileName('');
                      setConditionsFileBase64(null);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-sky-800 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-xl transition-colors cursor-pointer"
                  >
                    <FileCheck className="w-3.5 h-3.5 text-sky-600" />
                    <span>{isRtl ? 'تحميل نموذج كراسة شروط الجامعة (جاهز)' : 'Load University RFP Sample'}</span>
                  </button>

                  {(conditionsText || conditionsFileName) && (
                    <button
                      type="button"
                      onClick={() => {
                        setConditionsText('');
                        setConditionsFileName('');
                        setConditionsFileBase64(null);
                      }}
                      className="px-2.5 py-1 text-xs text-slate-500 hover:text-rose-600 transition-colors cursor-pointer"
                    >
                      {isRtl ? 'مسح' : 'Clear'}
                    </button>
                  )}
                </div>
              </div>

              {/* Text Area */}
              <textarea
                rows={12}
                value={conditionsText}
                onChange={(e) => setConditionsText(e.target.value)}
                placeholder={isRtl 
                  ? 'الصق هنا نص كراسة شروط ومواصفات الجامعة (مثال: يجب ألا يقل عدد نماذج الكشف عن 8 سنوياً، سقف التغطية 100,000 ريال، سقف الأدوية 5000 ريال، نسبة التحمل 15%، الغرفة مفردة خاصة...)' 
                  : 'Paste university RFP conditions text here (e.g. Min 8 consultation forms/year, 100k annual cap, prescription drug cap 5,000 SAR, max copay 15%, private single room...)'}
                className="w-full p-4 rounded-2xl border border-slate-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 text-xs text-slate-800 leading-relaxed font-sans transition-all resize-y"
              />

              {bindError && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{bindError}</span>
                </div>
              )}

              {/* Action Button */}
              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  disabled={isBinding || !conditionsText.trim()}
                  onClick={handleRunAiBinding}
                  className="inline-flex items-center gap-2.5 px-6 py-3 rounded-2xl text-xs font-bold text-white bg-gradient-to-r from-sky-600 via-indigo-600 to-sky-700 hover:from-sky-700 hover:to-indigo-800 shadow-md transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98]"
                >
                  {isBinding ? (
                    <>
                      <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                      <span>{isRtl ? 'جاري استخراج السقوف وربطها ببنود الإكسل بالذكاء الاصطناعي...' : 'Extracting & Binding Ceilings with Gemini AI...'}</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-amber-300" />
                      <span>{isRtl ? 'استخراج السقوف ومقارنتها ووضع كل شيء في مكانه ⬅️' : 'Auto-Extract Caps & Reconcile Table ⬅️'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* STEP 3: Reconcile, Side-by-Side Comparison & Approve      */}
          {/* ======================================================== */}
          {step === 3 && (
            <div className="space-y-5 animate-in fade-in duration-150">
              
              {/* Summary Dashboard Header */}
              <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    <span>{isRtl ? 'اكتملت مطابقة وربط سقوف الكراسة مع جدول المنافع المطلوبة' : 'Tender Ceilings Extracted & Bound to Benefits'}</span>
                  </h4>
                  <p className="text-xs text-slate-300 mt-1 max-w-2xl">
                    {summaryOverview || (isRtl 
                      ? `تم وضع كل شيء في مكانه: تم ربط ${matchedCount} بند بسقوف ومحددات صريحة من الكراسة، وترك ${unmatchedCount} بند كمنافع عادية مفتوحة.` 
                      : `Successfully placed all items: ${matchedCount} bound to explicit caps, ${unmatchedCount} open benefits.`)}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0 flex-wrap">
                  <div className="px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5" />
                    <span>{matchedCount} {isRtl ? 'مقيدة بسقف من الكراسة' : 'Bound Caps'}</span>
                  </div>
                  <div className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 border border-slate-700 text-xs font-semibold">
                    <span>{unmatchedCount} {isRtl ? 'منافع مفتوحة' : 'Open Benefits'}</span>
                  </div>
                </div>
              </div>

              {/* Table Controls */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-sky-600" />
                    <span>{isRtl ? 'جدول مقارنة وتدقيق المنافع والسقوف المعتمدة:' : 'Reconciled Requirements & Caps Table:'}</span>
                  </h4>
                  <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold text-xs">
                    {boundBenefits.length} {isRtl ? 'منفعة' : 'benefits'}
                  </span>
                </div>

                {/* Filter and Search */}
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex items-center bg-slate-100 p-0.5 rounded-xl text-xs">
                    <button
                      type="button"
                      onClick={() => setAuditFilterStatus('all')}
                      className={`px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                        auditFilterStatus === 'all' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500'
                      }`}
                    >
                      {isRtl ? 'الكل' : 'All'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setAuditFilterStatus('bound')}
                      className={`px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                        auditFilterStatus === 'bound' ? 'bg-white text-emerald-700 shadow-2xs' : 'text-slate-500'
                      }`}
                    >
                      {isRtl ? 'المقيدة بسقف' : 'Bound Caps'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setAuditFilterStatus('open')}
                      className={`px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                        auditFilterStatus === 'open' ? 'bg-white text-slate-700 shadow-2xs' : 'text-slate-500'
                      }`}
                    >
                      {isRtl ? 'المفتوحة' : 'Open'}
                    </button>
                  </div>

                  <input
                    type="text"
                    placeholder={isRtl ? 'بحث في الجدول أو السقوف...' : 'Search table...'}
                    value={auditSearchQuery}
                    onChange={(e) => setAuditSearchQuery(e.target.value)}
                    className="text-xs px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />

                  <button
                    type="button"
                    onClick={handleAddRowInStep3}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-sky-700 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-xl transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{isRtl ? 'إضافة منفعة جديدة' : 'Add Item'}</span>
                  </button>
                </div>
              </div>

              {/* Comprehensive Side-by-Side Table */}
              <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs">
                <div className="max-h-96 overflow-y-auto">
                  <table className="w-full text-start text-xs">
                    <thead className="bg-slate-50/95 sticky top-0 z-10 border-b border-slate-200 text-slate-700 font-bold text-[11px]">
                      <tr>
                        <th className="py-3 px-3 w-8 text-center">#</th>
                        <th className="py-3 px-3 w-1/4">{isRtl ? 'اسم المنفعة والفئة' : 'Benefit & Category'}</th>
                        <th className="py-3 px-3 w-1/3">{isRtl ? 'ما وجد في كراسة الشروط (الاقتباس/السياق)' : 'Found in Tender RFP Specs'}</th>
                        <th className="py-3 px-3 w-1/5">{isRtl ? 'السقف والقيمة المعتمدة' : 'Target Cap / Value'}</th>
                        <th className="py-3 px-3 w-28">{isRtl ? 'نوع المعيار' : 'Metric Type'}</th>
                        <th className="py-3 px-3 w-24 text-center">{isRtl ? 'الإلزامية والوزن' : 'Mandatory & Weight'}</th>
                        <th className="py-3 px-3 w-12 text-center">{isRtl ? 'حذف' : 'Del'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredBoundBenefits.map((b, idx) => (
                        <tr key={b.id || idx} className="hover:bg-slate-50/80 transition-colors">
                          {/* # */}
                          <td className="py-3 px-3 text-center font-mono font-bold text-slate-400 text-[11px]">
                            {idx + 1}
                          </td>

                          {/* Benefit Name & Category */}
                          <td className="py-3 px-3">
                            <input
                              type="text"
                              value={b.name}
                              onChange={(e) => handleUpdateBoundBenefit(b.id, { name: e.target.value })}
                              className="w-full text-xs font-bold text-slate-900 bg-transparent hover:bg-slate-100 focus:bg-white px-2 py-1 rounded-lg border border-transparent focus:border-sky-500 focus:outline-none"
                            />
                            <div className="mt-0.5 px-2">
                              <input
                                type="text"
                                value={b.category}
                                onChange={(e) => handleUpdateBoundBenefit(b.id, { category: e.target.value })}
                                className="text-[10px] text-slate-500 font-medium bg-transparent hover:bg-slate-100 focus:bg-white px-1.5 py-0.5 rounded border border-transparent focus:border-sky-500 focus:outline-none"
                              />
                            </div>
                          </td>

                          {/* What was found in tender specifications / RFP Quote */}
                          <td className="py-3 px-3">
                            {b.isBoundFromText ? (
                              <div className="p-2 rounded-xl bg-sky-50/70 border border-sky-100 space-y-1">
                                <div className="flex items-center gap-1 text-[10px] font-bold text-sky-900">
                                  <Quote className="w-3 h-3 text-sky-600" />
                                  <span>{isRtl ? 'نص الكراسة المرصود:' : 'Found Tender Condition:'}</span>
                                </div>
                                <p className="text-[11px] text-slate-800 leading-relaxed italic">
                                  &ldquo;{b.bindingQuote || b.description}&rdquo;
                                </p>
                              </div>
                            ) : (
                              <div className="p-2 rounded-xl bg-slate-50 border border-slate-100 text-[11px] text-slate-500">
                                <span>{isRtl ? 'لم يرد سقف مقيد في نص الكراسة (منفعة قياسية مفتوحة)' : 'Left unconstrained (standard open benefit)'}</span>
                              </div>
                            )}
                          </td>

                          {/* Target Cap / Value & Unit */}
                          <td className="py-3 px-3">
                            <div className="space-y-1">
                              <input
                                type="text"
                                value={String(b.targetValue)}
                                onChange={(e) => handleUpdateBoundBenefit(b.id, { targetValue: e.target.value })}
                                className="w-full text-xs font-mono font-bold text-sky-950 bg-sky-50 border border-sky-200 px-2 py-1 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-sky-500"
                              />
                              <input
                                type="text"
                                value={b.unit || ''}
                                onChange={(e) => handleUpdateBoundBenefit(b.id, { unit: e.target.value })}
                                placeholder={isRtl ? 'الوحدة (مثال: ريال، كشف/سنة، %)' : 'Unit...'}
                                className="w-full text-[10px] text-slate-600 bg-white border border-slate-200 px-2 py-0.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-sky-500"
                              />
                            </div>
                          </td>

                          {/* Evaluation Metric Type */}
                          <td className="py-3 px-3">
                            <select
                              value={b.type}
                              onChange={(e) => handleUpdateBoundBenefit(b.id, { type: e.target.value as BenefitEvaluationType })}
                              className="w-full text-[11px] font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-lg p-1.5 focus:outline-none focus:ring-1 focus:ring-sky-500"
                            >
                              <option value="numeric_min">{isRtl ? 'حد أدنى (≥)' : 'Min Needed (≥)'}</option>
                              <option value="numeric_max">{isRtl ? 'سقف أقصى (≤)' : 'Max Ceiling (≤)'}</option>
                              <option value="boolean">{isRtl ? 'مضمن (Boolean)' : 'Included / Excluded'}</option>
                              <option value="tier_level">{isRtl ? 'فئة الشبكة (Tier)' : 'Network Tier'}</option>
                              <option value="qualitative">{isRtl ? 'وصفي (Text)' : 'Qualitative'}</option>
                            </select>
                          </td>

                          {/* Mandatory & Weight Stars */}
                          <td className="py-3 px-3 text-center">
                            <div className="space-y-1">
                              <button
                                type="button"
                                onClick={() => handleUpdateBoundBenefit(b.id, { isMandatory: !b.isMandatory })}
                                className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors cursor-pointer ${
                                  b.isMandatory
                                    ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                              >
                                {b.isMandatory ? (isRtl ? 'إلزامي' : 'Mandatory') : (isRtl ? 'اختياري' : 'Optional')}
                              </button>

                              <div className="flex items-center justify-center gap-0.5">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <button
                                    key={star}
                                    type="button"
                                    onClick={() => handleUpdateBoundBenefit(b.id, { weight: star })}
                                    className="p-0.5 cursor-pointer text-amber-400 hover:scale-125 transition-transform"
                                  >
                                    <Star
                                      className={`w-3 h-3 ${
                                        star <= (b.weight || 3) ? 'fill-amber-400 text-amber-400' : 'text-slate-200'
                                      }`}
                                    />
                                  </button>
                                ))}
                              </div>
                            </div>
                          </td>

                          {/* Delete Action */}
                          <td className="py-3 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => handleDeleteBoundBenefit(b.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="حذف هذه المنفعة"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Suggested Extra Conditions that were discovered in text but not in original Excel */}
              {suggestedExtras.length > 0 && (
                <div className="p-4 bg-indigo-50/80 rounded-2xl border border-indigo-100 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <PlusCircle className="w-4 h-4 text-indigo-600" />
                      <span className="text-xs font-bold text-indigo-950">
                        {isRtl 
                          ? `تم رصد ${suggestedExtras.length} شروط ومحددات إضافية في كراسة الجامعة لم تكن في قائمة الإكسل الأولية:` 
                          : `Detected ${suggestedExtras.length} extra conditions from University RFP specs:`}
                      </span>
                    </div>

                    <label className="flex items-center gap-2 text-xs font-semibold text-indigo-900 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={includeExtras}
                        onChange={(e) => setIncludeExtras(e.target.checked)}
                        className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                      />
                      <span>{isRtl ? 'إدراجها تلقائياً مع جدول المنافع المعتمدة' : 'Include in approved benefits'}</span>
                    </label>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                    {suggestedExtras.map((extra, idx) => (
                      <div key={idx} className="p-2.5 bg-white rounded-xl border border-indigo-200/60 flex items-center justify-between">
                        <div>
                          <p className="font-bold text-slate-800">{extra.name}</p>
                          <span className="text-[10px] text-indigo-700">{extra.category}</span>
                        </div>
                        <span className="font-mono font-bold text-indigo-900 bg-indigo-50 px-2 py-0.5 rounded">
                          {String(extra.targetValue)} {extra.unit}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          )}

        </div>

        {/* Modal Footer Controls */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3 shrink-0">
          <div>
            {step > 1 && (
              <button
                type="button"
                onClick={() => setStep((prev) => (prev - 1) as any)}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 rounded-xl border border-slate-300 transition-colors cursor-pointer"
              >
                <span>{isRtl ? 'الخطوة السابقة' : 'Previous Step'}</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 transition-colors cursor-pointer"
            >
              {isRtl ? 'إلغاء' : 'Cancel'}
            </button>

            {step === 1 && (
              <button
                type="button"
                disabled={loadedBenefits.length === 0}
                onClick={() => setStep(2)}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-xs transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
              >
                <span>{isRtl ? 'المتابعة للخطوة ٢: نص شروط وسقوف الكراسة ⬅️' : 'Proceed to Step 2: Tender Specs ⬅️'}</span>
              </button>
            )}

            {step === 2 && (
              <button
                type="button"
                disabled={isBinding || !conditionsText.trim()}
                onClick={handleRunAiBinding}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-xs transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
              >
                <span>{isRtl ? 'استخراج السقوف وربطها ⬅️' : 'Extract & Bind Ceilings ⬅️'}</span>
              </button>
            )}

            {step === 3 && (
              <>
                <button
                  type="button"
                  onClick={() => handleFinalApply(false)}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl transition-colors cursor-pointer"
                >
                  <Check className="w-4 h-4 text-slate-600" />
                  <span>{isRtl ? 'اعتماد المتطلبات فقط' : 'Save Requirements'}</span>
                </button>

                <button
                  type="button"
                  id="btn-apply-bound-requirements-and-proceed"
                  onClick={() => handleFinalApply(true)}
                  className="inline-flex items-center gap-2 px-6 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 rounded-xl shadow-md transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                >
                  <ShieldCheck className="w-4 h-4 text-emerald-200" />
                  <span>{isRtl ? 'اعتماد المتطلبات والمتابعة لرفع عروض الشركات ⬅️' : 'Approve & Proceed to Upload Proposals ⬅️'}</span>
                </button>
              </>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
