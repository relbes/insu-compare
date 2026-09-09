import React, { useState, useRef } from 'react';
import { 
  FileText, 
  Upload, 
  Sparkles, 
  ArrowRight, 
  ArrowLeft, 
  AlertCircle, 
  FileCheck, 
  Check, 
  Trash2, 
  Quote, 
  Layers,
  Building2,
  Info
} from 'lucide-react';
import { useI18n } from '../i18n/I18nContext';

interface Step2RfpConditionsProps {
  conditionsText: string;
  onUpdateConditionsText: (text: string) => void;
  conditionsFileName: string;
  onUpdateConditionsFileName: (name: string) => void;
  conditionsFileBase64: string | null;
  onUpdateConditionsFileBase64: (b64: string | null) => void;
  conditionsMimeType: string;
  onUpdateConditionsMimeType: (mime: string) => void;
  excelBenefitsCount: number;
  onNavigatePrev: () => void;
  onProceedToStep3: () => void;
}

export const Step2RfpConditions: React.FC<Step2RfpConditionsProps> = ({
  conditionsText,
  onUpdateConditionsText,
  conditionsFileName,
  onUpdateConditionsFileName,
  conditionsFileBase64,
  onUpdateConditionsFileBase64,
  conditionsMimeType,
  onUpdateConditionsMimeType,
  excelBenefitsCount,
  onNavigatePrev,
  onProceedToStep3
}) => {
  const { isRtl } = useI18n();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isReadingFile, setIsReadingFile] = useState<boolean>(false);

  // Sample Corporate / University RFP Tender Conditions Text Preset
  const sampleUniversityConditionsRFP = `كراسة الشروط والمواصفات ومحددات السقوف لبرنامج التأمين الطبي لمنسوبي الجامعة:
١. نماذج وكشوفات العيادات الخارجية: يجب ألا يقل عدد نماذج/زيارات الكشف الطبي عن 8 نماذج كشف سنوياً للموظف والتابع كحد أدنى إلزامي (أي شركة تقدم 8 نماذج أو أكثر تحصل على الدرجة الكاملة 5/5).
٢. سقف التغطية السنوية لكل شخص: الحد الأقصى للتغطية السنوية الإجمالية هو 150,000 ريال سعودي لكل عضو سنوياً كحد أدنى مطلوب.
٣. نسبة التحمل في العيادات الخارجية: الحد الأقصى لنسبة تحمل الموظف في العيادات الخارجية هو 10% فقط وبحد أقصى 50 ريال للاستشارة.
٤. الإقامة في المستشفيات وفئة غرفة التنويم: غرفة مفردة خاصة (Private Single Room) مع تغطية كاملة لمرافق المريض للأعمار تحت 12 سنة.
٥. العناية المركزة وحالات الطوارئ: تغطية بنسبة 100% بدون أي فترات انتظار ودون اشتراط موافقة مسبقة في الطوارئ.
٦. الأدوية والعلاجات الصيدلانية: سقف سنوي 5,000 ريال للأدوية مع تغطية كاملة للأمراض المزمنة دون شروط إضافية.
٧. علاج وجراحة الأسنان: سقف 3,000 ريال سنوياً شامل الحشوات وتنظيف الأسنان وعلاج الجذور وخلع الأسنان.
٨. النظارات الطبية والإطارات البصرية: مخصص 800 ريال كل سنتين للإطارات والعدسات الطبية.
٩. تغطية الأمومة والولادة ورعاية المواليد: سقف 20,000 ريال للولادة الطبيعية والقيصرية ومضاعفات الحمل.
١٠. الشبكة الطبية المعتمدة: شبكة الفئة الأولى الممتازة (Tier 1 Prime) تشمل كبرى المستشفيات والمراكز التخصصية.
١١. الاستشارات الطبية عن بعد (Telemedicine): تغطية مجانية 24/7 عبر التطبيق الذكي.
١٢. الفحص الطبي الدوري الشامل: مشمول مرة واحدة سنوياً لجميع الموظفين فوق سن 35 سنة.
(ملاحظة هامة: أي منفعة أخرى مدرجة في جدول بنود التأمين ولم يرد لها سقف أو نص مالي صريح في هذه الكراسة، تعتبر منفعة عامة مشمولة ومفتوحة وفق شروط الجامعة).`;

  const sampleUniversityConditionsRFPEnglish = `RFP Specifications and Benchmark Sub-Limits for University Health Insurance Program:
1. Outpatient Consultations/Visits: Not less than 8 clinical consultation visits per employee and dependent annually as a mandatory minimum requirement (any insurer offering 8 or more visits receives full score 5/5).
2. Annual Aggregate Limit per Person: Minimum SAR 150,000 per member per policy year.
3. Outpatient Deductible/Copay: Maximum 10% copay, capped at SAR 50 per consultation.
4. Inpatient Hospitalization Room Category: Private Single Room with full companion accommodation for dependents under 12.
5. Intensive Care (ICU) & Emergency: 100% covered with zero waiting period and no pre-authorization in emergencies.
6. Pharmaceuticals & Prescription Drugs: Annual limit SAR 5,000 with comprehensive chronic illness medication coverage.
7. Dental Care & Procedures: Annual limit SAR 3,000 covering fillings, root canal therapy, prophylaxis, and extractions.
8. Optical & Vision Care: SAR 800 allowance every two years for prescription frames and lenses.
9. Maternity & Neonatal Care: Limit SAR 20,000 covering natural and C-section deliveries and pregnancy complications.
10. Approved Healthcare Network: Tier 1 Prime Network including major tertiary hospitals and specialized medical centers.
11. Telemedicine Consultations: 24/7 complimentary access via dedicated mobile application.
12. Comprehensive Annual Health Checkup: Covered once per year for all employees aged 35 and above.
(Important Note: Any other medical benefit listed in the insurance schedule without a specified sub-limit is deemed fully covered under University specifications).`;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    onUpdateConditionsFileName(file.name);
    onUpdateConditionsMimeType(file.type || 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    setIsReadingFile(true);

    try {
      if (file.name.endsWith('.txt') || file.name.endsWith('.csv') || file.name.endsWith('.md')) {
        const text = await file.text();
        onUpdateConditionsText(text);
        onUpdateConditionsFileBase64(null);
      } else {
        const reader = new FileReader();
        reader.onload = (event) => {
          const res = event.target?.result as string;
          const b64 = res.split(',')[1] || res;
          onUpdateConditionsFileBase64(b64);
          if (!conditionsText || conditionsText.trim().length < 10) {
            onUpdateConditionsText(isRtl ? `[تم إرفاق ملف كراسة الشروط: ${file.name}]` : `[Attached RFP File: ${file.name}]`);
          }
          setIsReadingFile(false);
        };
        reader.readAsDataURL(file);
      }
    } catch (err: any) {
      console.error('File read error:', err);
    } finally {
      if (file.name.endsWith('.txt') || file.name.endsWith('.csv') || file.name.endsWith('.md')) {
        setIsReadingFile(false);
      }
    }
  };

  const handleLoadSampleUniversityRFP = () => {
    onUpdateConditionsText(isRtl ? sampleUniversityConditionsRFP : sampleUniversityConditionsRFPEnglish);
    onUpdateConditionsFileName(isRtl ? 'كراسة شروط ومواصفات التأمين الطبي للجامعة (معتمدة)' : 'University Health Insurance Tender Specs (Sample)');
    onUpdateConditionsFileBase64(null);
  };

  const handleClearText = () => {
    onUpdateConditionsText('');
    onUpdateConditionsFileName('');
    onUpdateConditionsFileBase64(null);
  };

  const hasConditions = Boolean(conditionsText.trim() || conditionsFileBase64);

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
              <FileText className="w-3.5 h-3.5 text-indigo-600" />
              <span>{isRtl ? 'الخطوة ٢ من ٦: كراسة الشروط والسقوف' : 'Step 2 of 6: Tender Conditions & Caps'}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">
              {isRtl ? '٢. إدخال أو رفع نص كراسة الشروط والمواصفات والقيم المطلوبة' : '2. Upload or Paste RFP Conditions, Caps & Requirements'}
            </h2>
            <p className="text-sm text-slate-500 max-w-3xl">
              {isRtl
                ? 'ارفع ملف كراسة الشروط (PDF أو Word أو نص) أو الصق نص الشروط التي تحدد سقوف الجامعة ومحدداتها (مثل: 8 نماذج كشف، نسبة التحمل 10%، سقف الأسنان 3000 ريال، إلخ).'
                : 'Upload or paste the tender RFP requirements document containing specific limits, caps, and consultation form counts (e.g. min 8 consultation forms, max 10% copay, dental 3,000 SAR limit).'}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <button
              onClick={handleLoadSampleUniversityRFP}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 transition-colors cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span>{isRtl ? 'تحميل نص كراسة جامعية نموذجية' : 'Load Sample University RFP'}</span>
            </button>

            {hasConditions && (
              <button
                onClick={handleClearText}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                <span>{isRtl ? 'مسح النص' : 'Clear Text'}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Form & Upload Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* Conditions Text Area (2 Cols) */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Quote className="w-4 h-4 text-indigo-600" />
              <span>{isRtl ? 'نص شروط ومحددات الكراسة المطلوبة' : 'Tender RFP Conditions Text'}</span>
            </label>
            <span className="text-xs text-slate-400">
              {conditionsText.length} {isRtl ? 'حرف' : 'characters'}
            </span>
          </div>

          <textarea
            value={conditionsText}
            onChange={(e) => onUpdateConditionsText(e.target.value)}
            rows={12}
            placeholder={isRtl 
              ? 'الصق هنا نص كراسة الشروط والمواصفات للجامعة (مثال: عدد نماذج الكشف 8 كحد أدنى، نسبة التحمل في العيادات 10% كحد أقصى، سقف الأسنان 3,000 ريال، غرفة التنويم مفردة خاصة...)'
              : 'Paste tender RFP conditions here (e.g., minimum 8 consultation forms, max 10% outpatient copay, 3,000 SAR dental cap, private single room...)'}
            className="w-full p-4 rounded-2xl border border-slate-200 text-xs sm:text-sm leading-relaxed focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-slate-50/50 font-sans resize-y"
          />

          {conditionsFileName && (
            <div className="p-3 bg-indigo-50/70 rounded-2xl border border-indigo-200 text-xs text-indigo-900 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-indigo-600" />
                <span><strong>{isRtl ? 'الملف المرتبط:' : 'Attached file:'}</strong> {conditionsFileName}</span>
              </div>
              <button
                onClick={() => {
                  onUpdateConditionsFileName('');
                  onUpdateConditionsFileBase64(null);
                }}
                className="text-rose-600 hover:text-rose-800 text-xs font-semibold cursor-pointer"
              >
                {isRtl ? 'إلغاء المرفق' : 'Remove'}
              </button>
            </div>
          )}
        </div>

        {/* Upload Document & Info Sidecard */}
        <div className="space-y-4">
          
          {/* Document Upload Box */}
          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-3">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Upload className="w-4 h-4 text-indigo-600" />
              <span>{isRtl ? 'أو ارفع ملف الكراسة مباشرة' : 'Or Upload RFP File'}</span>
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              {isRtl
                ? 'يدعم ملفات Word (.docx/.doc) و PDF ونصوص TXT وصور كراسة الشروط.'
                : 'Supports Word (.docx/.doc), PDF, TXT, and document scans.'}
            </p>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".docx,.doc,.pdf,.txt,.csv,.png,.jpg,.jpeg"
              className="hidden"
            />

            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isReadingFile}
              className="w-full flex items-center justify-center gap-2 p-4 rounded-2xl border-2 border-dashed border-indigo-300 bg-indigo-50/40 hover:bg-indigo-50 text-indigo-800 text-xs font-bold transition-colors cursor-pointer"
            >
              <Upload className="w-4 h-4 text-indigo-600" />
              <span>{isReadingFile ? (isRtl ? 'جاري القراءة...' : 'Reading file...') : (isRtl ? 'اختيار ملف كراسة الشروط' : 'Select RFP Document')}</span>
            </button>
          </div>

          {/* Quick Guidance Box */}
          <div className="bg-indigo-900 text-white rounded-3xl p-5 shadow-sm space-y-3">
            <div className="flex items-center gap-2 font-bold text-xs text-indigo-200">
              <Info className="w-4 h-4 text-indigo-400" />
              <span>{isRtl ? 'كيف يعمل الربط الذكي؟' : 'How Smart Binding Works'}</span>
            </div>
            <p className="text-xs text-indigo-100 leading-relaxed">
              {isRtl
                ? `سيقوم الذكاء الاصطناعي في الخطوة التالية بمطابقة المنافع المرفوعة من الإكسل (${excelBenefitsCount} منفعة) مع القيم والسقوف المذكورة في هذا النص، لتحديد السقف المطلوب ونوع الشرط لكل بند تلقائياً.`
                : `AI will match your ${excelBenefitsCount} Excel benefits with limits and conditions found in this text, setting target caps and rules automatically.`}
            </p>
          </div>

        </div>

      </div>

      {/* Navigation Buttons */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <button
          onClick={onNavigatePrev}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{isRtl ? 'رجوع للخطوة ١ (جدول المنافع)' : 'Back to Step 1'}</span>
        </button>

        <button
          id="btn-step2-proceed-to-step3"
          onClick={onProceedToStep3}
          disabled={!hasConditions}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl text-sm font-bold bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-md hover:shadow-lg cursor-pointer"
        >
          <Sparkles className="w-4 h-4" />
          <span>{isRtl ? 'الانتقال للمطابقة والربط الذكي (الخطوة ٣)' : 'Proceed to Smart Binding (Step 3)'}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

    </div>
  );
};
