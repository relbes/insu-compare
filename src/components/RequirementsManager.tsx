import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  Check, 
  X, 
  AlertTriangle, 
  ShieldCheck,
  Download,
  RotateCcw,
  Search,
  Filter,
  Layers,
  FileCheck,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Calculator,
  SlidersHorizontal,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Calendar
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { BenefitRequirement, BenefitEvaluationType, PriorityLevel } from '../types';
import { useI18n } from '../i18n/I18nContext';
import { CORPORATE_HEALTH_TEMPLATE } from '../data/presetData';
import { ExcelAndConditionsBinderModal } from './ExcelAndConditionsBinderModal';

interface RequirementsManagerProps {
  requirements: BenefitRequirement[];
  onUpdateRequirements: (newReqs: BenefitRequirement[]) => void;
  onNavigatePrev?: () => void;
  onNavigateNext?: () => void;
  onClearAll?: () => void;
  onClearRequirements?: () => void;
  onLoadRealInsurers?: () => void;
  projectYear?: string;
  projectName?: string;
}

export const RequirementsManager: React.FC<RequirementsManagerProps> = ({
  requirements,
  onUpdateRequirements,
  onNavigatePrev,
  onNavigateNext,
  onClearAll,
  onClearRequirements,
  onLoadRealInsurers,
  projectYear = '2026 - 2027',
  projectName
}) => {
  const { t, isRtl, language } = useI18n();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<'all' | 'caps' | 'copays' | 'mandatory'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [editingRequirement, setEditingRequirement] = useState<BenefitRequirement | null>(null);
  const [quickEditId, setQuickEditId] = useState<string | null>(null);
  const [quickEditValue, setQuickEditValue] = useState<string>('');
  const [quickEditUnit, setQuickEditUnit] = useState<string>('');
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [showBinderModal, setShowBinderModal] = useState<boolean>(false);

  // New Requirement Form State
  const [newReq, setNewReq] = useState<Partial<BenefitRequirement>>({
    category: isRtl ? 'العيادات الخارجية والاستشارات' : 'Outpatient & Consultations',
    name: '',
    targetValue: 8,
    unit: isRtl ? 'نماذج كشف/سنة' : 'forms/year',
    type: 'numeric_min',
    weight: 4,
    priority: 'high',
    isMandatory: false,
    description: ''
  });

  // Extract unique categories
  const categories = useMemo(() => {
    return Array.from(new Set(requirements.map((r) => r.category).filter(Boolean)));
  }, [requirements]);

  // Statistics calculation
  const stats = useMemo(() => {
    const total = requirements.length;
    const explicitCaps = requirements.filter(
      r => r.type === 'numeric_min' || r.type === 'numeric_max' || (typeof r.targetValue === 'number' && r.targetValue > 0)
    ).length;
    const copaysAndGeneral = requirements.filter(
      r => r.type === 'boolean' || r.type === 'qualitative' || (typeof r.unit === 'string' && r.unit.includes('%'))
    ).length;
    const mandatoryCount = requirements.filter(r => r.isMandatory).length;

    return {
      total,
      explicitCaps,
      copaysAndGeneral,
      mandatoryCount
    };
  }, [requirements]);

  // Filtered requirements list
  const filteredRequirements = useMemo(() => {
    return requirements.filter((r) => {
      // Category filter
      const matchesCat = selectedCategory === 'all' || r.category === selectedCategory;
      
      // Type/Status filter
      let matchesType = true;
      if (selectedTypeFilter === 'caps') {
        matchesType = r.type === 'numeric_min' || r.type === 'numeric_max' || typeof r.targetValue === 'number';
      } else if (selectedTypeFilter === 'copays') {
        matchesType = r.type === 'boolean' || r.type === 'qualitative' || (typeof r.unit === 'string' && r.unit.includes('%'));
      } else if (selectedTypeFilter === 'mandatory') {
        matchesType = !!r.isMandatory;
      }

      // Search query filter
      const query = searchQuery.trim().toLowerCase();
      const matchesSearch = !query ||
        r.name.toLowerCase().includes(query) ||
        r.category.toLowerCase().includes(query) ||
        (r.description || '').toLowerCase().includes(query) ||
        String(r.targetValue).toLowerCase().includes(query) ||
        (r.unit || '').toLowerCase().includes(query);

      return matchesCat && matchesType && matchesSearch;
    });
  }, [requirements, selectedCategory, selectedTypeFilter, searchQuery]);

  // Handlers
  const handleUpdateSingle = (id: string, updates: Partial<BenefitRequirement>) => {
    const updated = requirements.map((r) => (r.id === id ? { ...r, ...updates } : r));
    onUpdateRequirements(updated);
  };

  const handleStartQuickEdit = (req: BenefitRequirement) => {
    setQuickEditId(req.id);
    setQuickEditValue(String(req.targetValue));
    setQuickEditUnit(req.unit || '');
  };

  const handleSaveQuickEdit = (id: string, type: BenefitEvaluationType) => {
    const isNum = type === 'numeric_min' || type === 'numeric_max';
    const parsedVal = isNum ? (parseFloat(quickEditValue) || 0) : quickEditValue;
    handleUpdateSingle(id, {
      targetValue: parsedVal,
      unit: quickEditUnit
    });
    setQuickEditId(null);
  };

  const handleDelete = (id: string) => {
    if (requirements.length <= 1) {
      alert(isRtl ? 'يجب أن يحتوي جدول المناقصة على بند منفعة واحد على الأقل.' : 'You must have at least one requirement in your evaluation template.');
      return;
    }
    const updated = requirements.filter((r) => r.id !== id);
    onUpdateRequirements(updated);
  };

  const handleAddNew = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReq.name?.trim()) return;

    const created: BenefitRequirement = {
      id: `req_${Date.now()}`,
      category: newReq.category || (isRtl ? 'منافع عامة' : 'General Benefits'),
      name: newReq.name.trim(),
      targetValue: newReq.targetValue ?? 8,
      unit: newReq.unit || '',
      type: (newReq.type as BenefitEvaluationType) || 'numeric_min',
      weight: Number(newReq.weight) || 3,
      priority: (newReq.priority as PriorityLevel) || 'medium',
      isMandatory: !!newReq.isMandatory,
      description: newReq.description || ''
    };

    onUpdateRequirements([...requirements, created]);
    setShowAddModal(false);
    setNewReq({
      category: isRtl ? 'العيادات الخارجية والاستشارات' : 'Outpatient & Consultations',
      name: '',
      targetValue: 8,
      unit: isRtl ? 'نماذج كشف/سنة' : 'forms/year',
      type: 'numeric_min',
      weight: 4,
      priority: 'high',
      isMandatory: false,
      description: ''
    });
  };

  const handleSaveFullEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRequirement) return;
    const updated = requirements.map(r => r.id === editingRequirement.id ? editingRequirement : r);
    onUpdateRequirements(updated);
    setEditingRequirement(null);
  };

  const handleResetToStandard = () => {
    if (window.confirm(isRtl 
      ? 'هل أنت متأكد من رغبتك في استعادة النموذج المعياري القياسي المعتمد (مناقصة الرعاية الصحية الشاملة)؟' 
      : 'Are you sure you want to reset to the standard corporate health insurance template?')) {
      onUpdateRequirements(CORPORATE_HEALTH_TEMPLATE.requirements);
    }
  };

  const handleExportExcel = () => {
    try {
      const exportData = requirements.map((req, idx) => ({
        '#': idx + 1,
        'اسم المنفعة': req.name,
        'التصنيف': req.category,
        'السقف / القيمة المعتمدة': typeof req.targetValue === 'boolean' 
          ? (req.targetValue ? 'مشمول 100%' : 'مستثنى 0%') 
          : req.targetValue,
        'الوحدة': req.unit || '',
        'نوع الشرط': req.type === 'numeric_min' ? 'حد أدنى مطلوب' :
                     req.type === 'numeric_max' ? 'سقف أقصى للتحمل' :
                     req.type === 'boolean' ? 'مشمول / مستثنى' :
                     req.type === 'tier_level' ? 'درجة / فئة' : 'وصفي / كيفي',
        'الوزن النسبي (1-5)': req.weight,
        'الأولوية': req.priority === 'critical' ? 'حرجة' :
                    req.priority === 'high' ? 'عالية' :
                    req.priority === 'medium' ? 'متوسطة' : 'منخفضة',
        'إلزامي؟': req.isMandatory ? 'نعم (إلزامي)' : 'لا (اختياري)',
        'الملاحظات والتفاصيل': req.description || ''
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'المنافع_المعتمدة');
      XLSX.writeFile(wb, `approved_tender_benefits_${Date.now()}.xlsx`);
    } catch (err) {
      console.error('Export error:', err);
      alert(isRtl ? 'حدث خطأ أثناء تصدير ملف الإكسل.' : 'Failed to export Excel file.');
    }
  };

  return (
    <div className="space-y-6 min-w-0 w-full">
      
      {/* 1. Header Banner matching Steps 1, 2, 3 format */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs">
        
        {/* Single Row Badge Header Bar */}
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 mb-3 pb-3 border-b border-slate-100 overflow-x-auto no-scrollbar">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-black bg-sky-100 text-sky-900 dark:bg-sky-950/60 dark:text-sky-300 border border-sky-300/80 shrink-0 whitespace-nowrap shadow-2xs">
            <CheckCircle2 className="w-3.5 h-3.5 text-sky-700" />
            <span>{isRtl ? 'الخطوة ٤ من ٦: مراجعة واعتماد بنود المنافع' : 'Step 4 of 6: Approved Requirements Review'}</span>
          </span>

          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200 shrink-0 whitespace-nowrap">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <span>{projectYear}</span>
          </span>

          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 shrink-0 whitespace-nowrap">
            <Layers className="w-3.5 h-3.5 text-emerald-600" />
            <span>{requirements.length} {isRtl ? 'منفعة معتمدة ومطابقة' : 'Approved Benefits'}</span>
          </span>

          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 shrink-0 whitespace-nowrap">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
            <span>{isRtl ? 'معيار التقييم: 60% فني + 40% مالي' : 'Evaluation: 60% Tech + 40% Fin'}</span>
          </span>
        </div>

        {/* Title, Subtitle, and Primary Actions */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="min-w-0">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-snug">
              {isRtl ? '٤. مراجعة وتدقيق جدول المنافع المعتمدة وسقوف الكراسة' : '4. Review & Audit Approved Tender Benefit Specifications'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-3xl leading-relaxed">
              {isRtl 
                ? 'فحص السقوف ونسب التحمل والبنود الإلزامية التي تم استخراجها وربطها بالذكاء الاصطناعي، تمهيداً للانتقال لرفع عروض شركات التأمين ومطابقتها.'
                : 'Inspect and verify the approved benefits, caps, copays, and mandatory requirements bound from RFP & Excel, ready for insurer proposal scoring.'}
            </p>
          </div>

          {/* Quick Header Actions */}
          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold bg-sky-600 hover:bg-sky-700 text-white transition-all shadow-xs cursor-pointer hover:scale-[1.01]"
              title={isRtl ? 'إضافة بند منفرد جديد' : 'Add New Benefit'}
            >
              <Plus className="w-4 h-4" />
              <span>{isRtl ? '+ إضافة منفعة جديدة' : '+ Add Requirement'}</span>
            </button>

            <button
              type="button"
              onClick={handleExportExcel}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 transition-colors shadow-2xs cursor-pointer"
              title={isRtl ? 'تصدير جدول المنافع المعتمدة إلى ملف إكسل' : 'Export Approved Requirements to Excel'}
            >
              <Download className="w-3.5 h-3.5 text-slate-600" />
              <span className="hidden sm:inline">{isRtl ? 'تصدير إكسل' : 'Export Excel'}</span>
            </button>

            <button
              type="button"
              onClick={() => setShowBinderModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 transition-colors shadow-2xs cursor-pointer"
              title={isRtl ? 'إعادة تشغيل معالج الربط الذكي' : 'Re-open AI Smart Binder'}
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>{isRtl ? 'أداة المطابقة والربط' : 'Smart Binder'}</span>
            </button>

            <button
              type="button"
              onClick={handleResetToStandard}
              className="inline-flex items-center gap-1.5 px-2.5 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
              title={isRtl ? 'استعادة النموذج القياسي المعتمد' : 'Reset to Benchmark Template'}
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">{isRtl ? 'استعادة القياسي' : 'Reset'}</span>
            </button>

            {onClearRequirements && (
              <button
                type="button"
                onClick={onClearRequirements}
                className="p-2 rounded-xl text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors cursor-pointer"
                title={isRtl ? 'مسح كافة البنود' : 'Clear All Requirements'}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. Executive KPI Summary Cards (4 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        
        {/* Total Approved */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs flex items-center justify-between gap-3">
          <div>
            <span className="text-xs font-bold text-slate-500 block">
              {isRtl ? 'إجمالي المنافع المعتمدة' : 'Total Approved Benefits'}
            </span>
            <div className="text-2xl font-black text-slate-900 mt-1 font-mono">
              {stats.total}
              <span className="text-xs font-bold text-slate-400 mx-1.5 font-sans">
                {isRtl ? 'منفعة' : 'benefits'}
              </span>
            </div>
            <span className="text-[11px] text-emerald-700 font-bold block mt-1">
              ✓ {isRtl ? 'جاهزة لتقييم العروض' : 'Ready for scoring'}
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100 shadow-2xs">
            <Layers className="w-6 h-6" />
          </div>
        </div>

        {/* Explicit Caps */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs flex items-center justify-between gap-3">
          <div>
            <span className="text-xs font-bold text-slate-500 block">
              {isRtl ? 'سقوف محددة وصريحة' : 'Explicit Capped Limits'}
            </span>
            <div className="text-2xl font-black text-sky-950 mt-1 font-mono">
              {stats.explicitCaps}
              <span className="text-xs font-bold text-slate-400 mx-1.5 font-sans">
                {isRtl ? 'سقف مقيد' : 'capped'}
              </span>
            </div>
            <span className="text-[11px] text-sky-700 font-medium block mt-1">
              {isRtl ? 'مبالغ، زيارات، أو مخصصات' : 'Sums, visits, or sessions'}
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0 border border-sky-100 shadow-2xs">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        {/* Copays & General Coverage */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs flex items-center justify-between gap-3">
          <div>
            <span className="text-xs font-bold text-slate-500 block">
              {isRtl ? 'نسب تحمل وتغطيات عامة' : 'Copays & General Coverage'}
            </span>
            <div className="text-2xl font-black text-violet-950 mt-1 font-mono">
              {stats.copaysAndGeneral}
              <span className="text-xs font-bold text-slate-400 mx-1.5 font-sans">
                {isRtl ? 'بند' : 'items'}
              </span>
            </div>
            <span className="text-[11px] text-violet-700 font-medium block mt-1">
              {isRtl ? 'تغطية 100% أو مشاركة مئوية' : '100% or percentage copay'}
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-violet-50 text-violet-600 flex items-center justify-center shrink-0 border border-violet-100 shadow-2xs">
            <Calculator className="w-6 h-6" />
          </div>
        </div>

        {/* Mandatory Requirements */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs flex items-center justify-between gap-3">
          <div>
            <span className="text-xs font-bold text-slate-500 block">
              {isRtl ? 'بنود مشروطة بإلزامية' : 'Mandatory Requirements'}
            </span>
            <div className="text-2xl font-black text-rose-950 mt-1 font-mono">
              {stats.mandatoryCount}
              <span className="text-xs font-bold text-slate-400 mx-1.5 font-sans">
                {isRtl ? 'بند إلزامي' : 'mandatory'}
              </span>
            </div>
            <span className="text-[11px] text-rose-700 font-bold block mt-1">
              ⚠️ {isRtl ? 'استبعاد فوري عند النقص' : 'Strict disqualification'}
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-100 shadow-2xs">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

      </div>

      {/* 3. Strict Rule Operational Banner */}
      <div className="flex items-start sm:items-center gap-3 p-3.5 rounded-2xl bg-amber-50/90 border border-amber-200 text-amber-950 text-xs shadow-2xs">
        <ShieldCheck className="w-5 h-5 text-amber-700 shrink-0 mt-0.5 sm:mt-0" />
        <div className="leading-relaxed">
          <span className="font-extrabold text-amber-900">{isRtl ? 'قاعدة التدقيق الفني الصارم:' : 'Strict Technical Capping Rule:'}</span>{' '}
          {isRtl 
            ? 'أي شركة تقدم سقفاً أو ميزة أعلى من المطلوب تمنح الدرجة الكاملة 100% دون أي بونص إضافي، لمنع تضخيم الدرجات الفنية على حساب السعر المالي.'
            : 'Any insurer offering higher limits than specified receives a capped 100% score (NO bonus), strictly preserving actuarial tender fairness.'}
        </div>
      </div>

      {/* 4. Filter Toolbar & Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs space-y-3.5">
        
        {/* Category Pills Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer shadow-2xs ${
              selectedCategory === 'all'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            {isRtl ? 'كافة التصنيفات' : 'All Categories'} ({requirements.length})
          </button>

          {categories.map((cat) => {
            const count = requirements.filter(r => r.category === cat).length;
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer shadow-2xs flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-sky-700 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <span>{cat}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                  isSelected ? 'bg-sky-800 text-white' : 'bg-slate-200 text-slate-800'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Secondary Filter & Search Inputs */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100">
          
          {/* Quick Scope Filter Buttons */}
          <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto no-scrollbar">
            <span className="text-xs font-bold text-slate-500 shrink-0 hidden md:inline">
              <Filter className="w-3.5 h-3.5 inline text-slate-400 mx-1" />
              {isRtl ? 'فلترة حسب:' : 'Filter:'}
            </span>

            <button
              type="button"
              onClick={() => setSelectedTypeFilter('all')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                selectedTypeFilter === 'all'
                  ? 'bg-slate-800 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {isRtl ? 'الكل' : 'All'}
            </button>

            <button
              type="button"
              onClick={() => setSelectedTypeFilter('caps')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                selectedTypeFilter === 'caps'
                  ? 'bg-sky-600 text-white'
                  : 'bg-sky-50 text-sky-800 hover:bg-sky-100'
              }`}
            >
              {isRtl ? 'سقوف صريحة' : 'Explicit Caps'}
            </button>

            <button
              type="button"
              onClick={() => setSelectedTypeFilter('copays')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                selectedTypeFilter === 'copays'
                  ? 'bg-violet-600 text-white'
                  : 'bg-violet-50 text-violet-800 hover:bg-violet-100'
              }`}
            >
              {isRtl ? 'نسب تحمل وعام' : 'Copays / General'}
            </button>

            <button
              type="button"
              onClick={() => setSelectedTypeFilter('mandatory')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                selectedTypeFilter === 'mandatory'
                  ? 'bg-rose-600 text-white'
                  : 'bg-rose-50 text-rose-800 hover:bg-rose-100'
              }`}
            >
              {isRtl ? 'إلزامي فقط' : 'Mandatory Only'}
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute start-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={isRtl ? 'بحث في اسم المنفعة، التصنيف، أو السقف...' : 'Search benefits, caps, or notes...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs ps-9 pe-8 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent bg-slate-50 font-medium"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute end-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 5. Approved Requirements Review Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-xs">
        
        {/* Table Header Summary Bar */}
        <div className="px-5 py-3 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <FileCheck className="w-4 h-4 text-sky-600" />
            <span className="text-xs font-bold text-slate-800">
              {isRtl ? 'جدول بنود ومواصفات العطاء المعتمدة' : 'Approved Tender Benefit Specifications'}
            </span>
            <span className="text-[11px] font-mono font-bold text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
              {isRtl ? `عرض ${filteredRequirements.length} من ${requirements.length} بند` : `Showing ${filteredRequirements.length} of ${requirements.length}`}
            </span>
          </div>

          <span className="text-[11px] text-slate-500 font-medium hidden sm:inline">
            {isRtl ? 'انقر على أيقونة القلم للتعديل السريع المباشر للسقف' : 'Click pencil to edit limit/unit'}
          </span>
        </div>

        <div className="overflow-x-auto w-full">
          <table className="w-full text-start text-xs sm:text-sm">
            <thead className="bg-slate-100/70 border-b border-slate-200 text-slate-700 font-bold text-xs">
              <tr>
                <th className="py-3 px-3.5 w-12 text-center">#</th>
                <th className="py-3 px-4 text-start">{isRtl ? 'اسم المنفعة والتصنيف' : 'Benefit & Category'}</th>
                <th className="py-3 px-4 text-start">{isRtl ? 'السقف المعتمد والقيمة المطلوبة' : 'Approved Target / Cap'}</th>
                <th className="py-3 px-4 text-start">{isRtl ? 'نوع الشرط والتقييم' : 'Evaluation Rule'}</th>
                <th className="py-3 px-4 text-center">{isRtl ? 'الأولوية والإلزامية' : 'Priority & Status'}</th>
                <th className="py-3 px-4 text-center">{isRtl ? 'الوزن (1-5)' : 'Weight'}</th>
                <th className="py-3 px-4 text-end">{isRtl ? 'إجراءات' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {filteredRequirements.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-14 px-4 text-center">
                    <div className="max-w-md mx-auto space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 mx-auto flex items-center justify-center">
                        <Layers className="w-6 h-6" />
                      </div>
                      <h4 className="text-sm font-bold text-slate-800">
                        {requirements.length === 0 
                          ? (isRtl ? 'لا توجد بنود معتمدة حتى الآن' : 'No requirements defined yet')
                          : (isRtl ? 'لم يتم العثور على نتائج تطابق معايير البحث' : 'No requirements match your filters')}
                      </h4>
                      <p className="text-xs text-slate-500">
                        {requirements.length === 0
                          ? (isRtl 
                              ? 'يمكنك استيراد جدول المنافع من الخطوة ١، أو استعادة النموذج المعياري المعتمد مباشرة.' 
                              : 'Import your benefit schedule from Step 1 or load standard template.')
                          : (isRtl ? 'جرّب تعديل مصطلح البحث أو اختيار كافة التصنيفات.' : 'Try adjusting search or category filter.')}
                      </p>
                      {requirements.length === 0 && (
                        <div className="flex items-center justify-center gap-2 pt-2">
                          <button
                            type="button"
                            onClick={handleResetToStandard}
                            className="px-4 py-2 rounded-xl text-xs font-bold bg-sky-600 hover:bg-sky-700 text-white shadow-xs cursor-pointer"
                          >
                            {isRtl ? 'تحميل النموذج المعياري المعتمد' : 'Load Standard Benchmark'}
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredRequirements.map((req, index) => {
                  const isQuickEditing = quickEditId === req.id;
                  
                  return (
                    <tr 
                      key={req.id} 
                      className={`hover:bg-sky-50/30 transition-colors ${
                        req.isMandatory ? 'bg-rose-50/15' : ''
                      }`}
                    >
                      {/* # Number */}
                      <td className="py-3 px-3.5 text-center font-mono text-xs font-bold text-slate-400">
                        {index + 1}
                      </td>

                      {/* Benefit Name & Category */}
                      <td className="py-3.5 px-4 min-w-[220px]">
                        <div>
                          <div className="font-bold text-slate-900 text-sm leading-snug">
                            {req.name}
                          </div>
                          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold text-[11px] border border-slate-200">
                              {req.category}
                            </span>
                            {req.description && (
                              <span className="text-[11px] text-slate-500 truncate max-w-xs" title={req.description}>
                                {req.description}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Target Value & Cap (with Quick Inline Edit) */}
                      <td className="py-3.5 px-4 min-w-[180px]">
                        {isQuickEditing ? (
                          <div className="flex items-center gap-1.5 animate-in fade-in">
                            <input
                              type={req.type.startsWith('numeric') ? 'number' : 'text'}
                              value={quickEditValue}
                              onChange={(e) => setQuickEditValue(e.target.value)}
                              className="w-24 text-xs font-bold px-2 py-1 border border-sky-400 rounded-lg bg-white shadow-2xs"
                              autoFocus
                            />
                            <input
                              type="text"
                              value={quickEditUnit}
                              onChange={(e) => setQuickEditUnit(e.target.value)}
                              placeholder="unit"
                              className="w-20 text-[11px] px-1.5 py-1 border border-slate-300 rounded-lg bg-white"
                            />
                            <button
                              type="button"
                              onClick={() => handleSaveQuickEdit(req.id, req.type)}
                              className="p-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 cursor-pointer shadow-2xs"
                              title={isRtl ? 'حفظ' : 'Save'}
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setQuickEditId(null)}
                              className="p-1.5 rounded-lg bg-slate-200 text-slate-600 hover:bg-slate-300 cursor-pointer"
                              title={isRtl ? 'إلغاء' : 'Cancel'}
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="group inline-flex items-center gap-2">
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-sky-50 border border-sky-200">
                              <span className="font-black text-sky-950 text-xs sm:text-sm font-mono">
                                {typeof req.targetValue === 'boolean'
                                  ? (req.targetValue ? (isRtl ? 'مشمول 100%' : 'Included 100%') : (isRtl ? 'مستثنى 0%' : 'Excluded 0%'))
                                  : typeof req.targetValue === 'number'
                                  ? req.targetValue.toLocaleString()
                                  : req.targetValue}
                              </span>
                              {req.unit && (
                                <span className="text-[11px] text-sky-700 font-bold">{req.unit}</span>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() => handleStartQuickEdit(req)}
                              className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-sky-700 transition-opacity cursor-pointer"
                              title={isRtl ? 'تعديل السقف والوحدة' : 'Quick edit cap/unit'}
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </td>

                      {/* Metric Rule Type */}
                      <td className="py-3.5 px-4 min-w-[140px]">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                          {req.type === 'numeric_min' && (isRtl ? 'حد أدنى (≥ مطلوب)' : 'Min Target (>=)')}
                          {req.type === 'numeric_max' && (isRtl ? 'سقف أقصى (≤ مطلوب)' : 'Max Ceiling (<=)')}
                          {req.type === 'boolean' && (isRtl ? 'مشمول / مستثنى' : 'Boolean (Inc/Exc)')}
                          {req.type === 'tier_level' && (isRtl ? 'فئة ودرجة شبكة' : 'Tier Level')}
                          {req.type === 'qualitative' && (isRtl ? 'تقييم وصفي/كيفي' : 'Qualitative')}
                        </span>
                      </td>

                      {/* Priority & Mandatory Status */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex flex-col items-center gap-1">
                          {req.isMandatory ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-black bg-rose-50 text-rose-700 border border-rose-200 shadow-2xs">
                              <AlertTriangle className="w-3 h-3 text-rose-600" />
                              <span>{isRtl ? 'إلزامي' : 'Mandatory'}</span>
                            </span>
                          ) : (
                            <span className="text-[11px] text-slate-500 font-medium">
                              {isRtl ? 'اختياري' : 'Optional'}
                            </span>
                          )}

                          <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                            req.priority === 'critical' ? 'bg-rose-100 text-rose-800' :
                            req.priority === 'high' ? 'bg-amber-100 text-amber-800' :
                            req.priority === 'medium' ? 'bg-sky-100 text-sky-800' :
                            'bg-slate-100 text-slate-600'
                          }`}>
                            {req.priority === 'critical' ? (isRtl ? 'حرجة' : 'Critical') :
                             req.priority === 'high' ? (isRtl ? 'عالية' : 'High') :
                             req.priority === 'medium' ? (isRtl ? 'متوسطة' : 'Medium') :
                             (isRtl ? 'منخفضة' : 'Low')}
                          </span>
                        </div>
                      </td>

                      {/* Weight (1-5) */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {[1, 2, 3, 4, 5].map((level) => (
                            <div
                              key={level}
                              className={`w-1.5 h-3.5 rounded-xs ${
                                level <= req.weight
                                  ? req.weight >= 4
                                    ? 'bg-sky-600'
                                    : 'bg-indigo-500'
                                  : 'bg-slate-200'
                              }`}
                            />
                          ))}
                          <span className="text-xs font-bold font-mono text-slate-700 ms-1.5">
                            {req.weight}/5
                          </span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-end">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => setEditingRequirement(req)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-sky-700 hover:bg-sky-50 transition-colors cursor-pointer"
                            title={isRtl ? 'تعديل كامل البند' : 'Edit Full Requirement'}
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(req.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            title={isRtl ? 'حذف البند' : 'Delete Requirement'}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 6. Step 4 Completion & Next Step Action Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 text-white rounded-2xl p-4 sm:p-5 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 text-center sm:text-start">
          <div className="w-10 h-10 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-400/30 flex items-center justify-center font-bold text-sm shrink-0">
            ٤ / ٦
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">
              {isRtl ? 'تم مراجعة وتدقيق جدول المنافع المعتمدة' : 'Tender Benefit Specifications Verified'} ({requirements.length} {isRtl ? 'منفعة' : 'benefits'})
            </h4>
            <p className="text-xs text-slate-300">
              {isRtl 
                ? 'انتقل للخطوة ٥ لرفع وتحليل عروض شركات التأمين بالذكاء الاصطناعي وتوليد مصفوفة المطابقة.' 
                : 'Proceed to Step 5 to upload and AI-analyze insurer proposals against these approved specs.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap justify-center sm:justify-end shrink-0">
          {onNavigatePrev && (
            <button
              type="button"
              onClick={onNavigatePrev}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold rounded-xl text-slate-200 hover:text-white hover:bg-slate-800/80 border border-slate-700 transition-colors cursor-pointer"
            >
              {isRtl ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
              <span>{isRtl ? 'الرجوع للخطوة ٣ (المطابقة والربط)' : 'Back to Step 3 (Binding)'}</span>
            </button>
          )}

          {onNavigateNext && (
            <button
              type="button"
              id="btn-step4-next"
              onClick={onNavigateNext}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-bold rounded-xl text-slate-950 bg-white hover:bg-sky-50 transition-all shadow-md cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
            >
              <span>{isRtl ? 'اعتماد المنافع والانتقال لرفع عروض التأمين (الخطوة ٥)' : 'Confirm & Proceed to Insurer Proposals (Step 5)'}</span>
              {isRtl ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>

      {/* MODAL: Add New Benefit Requirement */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                {isRtl ? 'إضافة منفعة تأمينية جديدة إلى الكراسة' : 'Add New Benefit Requirement'}
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddNew} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {isRtl ? 'تصنيف المنفعة' : 'Category'}
                </label>
                <input
                  type="text"
                  required
                  placeholder={isRtl ? 'مثال: العيادات الخارجية والاستشارات، المستشفيات، الأسنان' : 'e.g. Outpatient, Inpatient, Dental'}
                  value={newReq.category}
                  onChange={(e) => setNewReq({ ...newReq, category: e.target.value })}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {isRtl ? 'اسم المنفعة أو التغطية المطلوبة' : 'Benefit Name'}
                </label>
                <input
                  type="text"
                  required
                  placeholder={isRtl ? 'مثال: الحد الأقصى السنوي للعلاج الطبي لكل موظف' : 'e.g. Annual Maximum Limit per Member'}
                  value={newReq.name}
                  onChange={(e) => setNewReq({ ...newReq, name: e.target.value })}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {isRtl ? 'السقف / القيمة المستهدفة' : 'Target Value / Cap'}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={isRtl ? 'مثال: 8 أو 100000 أو مشمول' : 'e.g. 8 or 100000'}
                    value={String(newReq.targetValue ?? '')}
                    onChange={(e) => {
                      const v = e.target.value;
                      const num = parseFloat(v);
                      setNewReq({ ...newReq, targetValue: isNaN(num) ? v : num });
                    }}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {isRtl ? 'الوحدة القياسية' : 'Unit'}
                  </label>
                  <input
                    type="text"
                    placeholder={isRtl ? 'مثال: د.أ، زيارات/سنة، % تحمل' : 'e.g. JOD, visits/year, % copay'}
                    value={newReq.unit || ''}
                    onChange={(e) => setNewReq({ ...newReq, unit: e.target.value })}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {isRtl ? 'نوع الشرط القياسي' : 'Evaluation Type'}
                  </label>
                  <select
                    value={newReq.type}
                    onChange={(e) =>
                      setNewReq({ ...newReq, type: e.target.value as BenefitEvaluationType })
                    }
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl bg-white"
                  >
                    <option value="numeric_min">{isRtl ? 'حد أدنى مطلوب (الأعلى أفضل)' : 'Min Needed (Higher Better)'}</option>
                    <option value="numeric_max">{isRtl ? 'حد أقصى للسقف/التحمل (الأقل أفضل)' : 'Max Ceiling (Lower Better)'}</option>
                    <option value="boolean">{isRtl ? 'مشمول / مستثنى (100% أو 0%)' : 'Boolean (Included/Excluded)'}</option>
                    <option value="tier_level">{isRtl ? 'درجة / فئة شبكة' : 'Tier Level'}</option>
                    <option value="qualitative">{isRtl ? 'تقييم وصفي/كيفي' : 'Qualitative'}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {isRtl ? 'الوزن والأولوية' : 'Weight (1-5)'}
                  </label>
                  <select
                    value={newReq.weight}
                    onChange={(e) => setNewReq({ ...newReq, weight: parseInt(e.target.value) })}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl bg-white font-bold"
                  >
                    <option value={5}>5 - {isRtl ? 'أولوية حرجة جداً' : 'Critical'}</option>
                    <option value={4}>4 - {isRtl ? 'أولوية عالية' : 'High'}</option>
                    <option value={3}>3 - {isRtl ? 'أولوية متوسطة' : 'Medium'}</option>
                    <option value={2}>2 - {isRtl ? 'أولوية عادية' : 'Low'}</option>
                    <option value={1}>1 - {isRtl ? 'أولوية منخفضة' : 'Minor'}</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="modal-add-mandatory"
                  checked={newReq.isMandatory}
                  onChange={(e) => setNewReq({ ...newReq, isMandatory: e.target.checked })}
                  className="rounded text-rose-600 focus:ring-rose-500 w-4 h-4 cursor-pointer"
                />
                <label htmlFor="modal-add-mandatory" className="text-xs font-bold text-slate-800 cursor-pointer">
                  {isRtl ? 'بند إلزامي (عدم التغطية يترتب عليه استبعاد العرض)' : 'Mandatory (Non-compliance disqualifies proposal)'}
                </label>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {isRtl ? 'ملاحظات وسند التغطية' : 'Description / Notes'}
                </label>
                <textarea
                  rows={2}
                  placeholder={isRtl ? 'شروط خاصة، تغطية مرافق، استثناءات محددة...' : 'Specific conditions, sub-limits...'}
                  value={newReq.description || ''}
                  onChange={(e) => setNewReq({ ...newReq, description: e.target.value })}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  {isRtl ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-xl shadow-xs cursor-pointer"
                >
                  {isRtl ? 'حفظ وإضافة المنفعة' : 'Save Requirement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Full Edit Requirement */}
      {editingRequirement && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                {isRtl ? 'تعديل بيانات المنفعة المعتمدة' : 'Edit Benefit Requirement'}
              </h3>
              <button
                type="button"
                onClick={() => setEditingRequirement(null)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveFullEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {isRtl ? 'تصنيف المنفعة' : 'Category'}
                </label>
                <input
                  type="text"
                  required
                  value={editingRequirement.category}
                  onChange={(e) => setEditingRequirement({ ...editingRequirement, category: e.target.value })}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {isRtl ? 'اسم المنفعة' : 'Benefit Name'}
                </label>
                <input
                  type="text"
                  required
                  value={editingRequirement.name}
                  onChange={(e) => setEditingRequirement({ ...editingRequirement, name: e.target.value })}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {isRtl ? 'السقف / القيمة المطلوبة' : 'Target Value / Cap'}
                  </label>
                  <input
                    type="text"
                    required
                    value={String(editingRequirement.targetValue)}
                    onChange={(e) => {
                      const v = e.target.value;
                      const num = parseFloat(v);
                      setEditingRequirement({
                        ...editingRequirement,
                        targetValue: isNaN(num) ? v : num
                      });
                    }}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {isRtl ? 'الوحدة القياسية' : 'Unit'}
                  </label>
                  <input
                    type="text"
                    value={editingRequirement.unit || ''}
                    onChange={(e) => setEditingRequirement({ ...editingRequirement, unit: e.target.value })}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {isRtl ? 'نوع الشرط' : 'Evaluation Type'}
                  </label>
                  <select
                    value={editingRequirement.type}
                    onChange={(e) =>
                      setEditingRequirement({
                        ...editingRequirement,
                        type: e.target.value as BenefitEvaluationType
                      })
                    }
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl bg-white"
                  >
                    <option value="numeric_min">{isRtl ? 'حد أدنى مطلوب (الأعلى أفضل)' : 'Min Target'}</option>
                    <option value="numeric_max">{isRtl ? 'سقف أقصى للتحمل (الأقل أفضل)' : 'Max Ceiling'}</option>
                    <option value="boolean">{isRtl ? 'مشمول / مستثنى' : 'Boolean'}</option>
                    <option value="tier_level">{isRtl ? 'فئة ودرجة شبكة' : 'Tier Level'}</option>
                    <option value="qualitative">{isRtl ? 'تقييم وصفي/كيفي' : 'Qualitative'}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {isRtl ? 'الوزن (1-5)' : 'Weight'}
                  </label>
                  <select
                    value={editingRequirement.weight}
                    onChange={(e) =>
                      setEditingRequirement({ ...editingRequirement, weight: parseInt(e.target.value) })
                    }
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl bg-white font-bold"
                  >
                    <option value={5}>5 - {isRtl ? 'حرجة' : 'Critical'}</option>
                    <option value={4}>4 - {isRtl ? 'عالية' : 'High'}</option>
                    <option value={3}>3 - {isRtl ? 'متوسطة' : 'Medium'}</option>
                    <option value={2}>2 - {isRtl ? 'عادية' : 'Low'}</option>
                    <option value={1}>1 - {isRtl ? 'منخفضة' : 'Minor'}</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="modal-edit-mandatory"
                  checked={editingRequirement.isMandatory}
                  onChange={(e) =>
                    setEditingRequirement({ ...editingRequirement, isMandatory: e.target.checked })
                  }
                  className="rounded text-rose-600 focus:ring-rose-500 w-4 h-4 cursor-pointer"
                />
                <label htmlFor="modal-edit-mandatory" className="text-xs font-bold text-slate-800 cursor-pointer">
                  {isRtl ? 'بند إلزامي (استبعاد العرض عند النقص)' : 'Mandatory (Disqualifies proposal)'}
                </label>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {isRtl ? 'الملاحظات والوصف' : 'Description'}
                </label>
                <textarea
                  rows={2}
                  value={editingRequirement.description || ''}
                  onChange={(e) =>
                    setEditingRequirement({ ...editingRequirement, description: e.target.value })
                  }
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingRequirement(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  {isRtl ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-xl shadow-xs cursor-pointer"
                >
                  {isRtl ? 'حفظ التعديلات' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Re-usable Smart Binder Modal if needed */}
      <ExcelAndConditionsBinderModal
        isOpen={showBinderModal}
        onClose={() => setShowBinderModal(false)}
        onApplyRequirements={(newReqs, andProceed) => {
          onUpdateRequirements(newReqs);
          if (andProceed && onNavigateNext) {
            onNavigateNext();
          }
        }}
        currentRequirements={requirements}
      />

    </div>
  );
};
