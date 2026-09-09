import React, { useState, useRef } from 'react';
import { 
  FileSpreadsheet, 
  Upload, 
  Check, 
  Download, 
  Plus, 
  Trash2, 
  Search, 
  Filter, 
  ArrowRight, 
  Layers, 
  AlertCircle,
  Sparkles,
  RefreshCw,
  CheckCircle2,
  Calendar,
  FolderGit2,
  Edit3
} from 'lucide-react';
import { BenefitRequirement } from '../types';
import { useI18n } from '../i18n/I18nContext';
import { 
  parseBenefitsExcel, 
  downloadSingleColumnExcelTemplate, 
  downloadBenefitAndCategoryExcelTemplate,
  downloadSampleExcelTemplate,
  inferBenefitCategory 
} from '../utils/excelParser';

interface Step1ExcelBenefitsProps {
  excelBenefits: BenefitRequirement[];
  onUpdateExcelBenefits: (benefits: BenefitRequirement[]) => void;
  onProceedToStep2: () => void;
  projectYear?: string;
  projectName?: string;
  onOpenProjectManager?: () => void;
  onEditCurrentProject?: () => void;
  onDeleteCurrentProject?: () => void;
  canDeleteProject?: boolean;
}

export const Step1ExcelBenefits: React.FC<Step1ExcelBenefitsProps> = ({
  excelBenefits,
  onUpdateExcelBenefits,
  onProceedToStep2,
  projectYear = '2025 - 2026',
  projectName = 'مناقصة التأمين الطبي',
  onOpenProjectManager,
  onEditCurrentProject,
  onDeleteCurrentProject,
  canDeleteProject = false
}) => {
  const { isRtl } = useI18n();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [excelFileName, setExcelFileName] = useState<string>('');
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showClearConfirmModal, setShowClearConfirmModal] = useState<boolean>(false);

  // Inline Quick Add
  const [newBenefitName, setNewBenefitName] = useState<string>('');
  const [newBenefitCategory, setNewBenefitCategory] = useState<string>('');

  const categories = Array.from(new Set(excelBenefits.map((b) => b.category || (isRtl ? 'عام' : 'General'))));

  const filteredBenefits = excelBenefits.filter((b) => {
    const matchesCat = selectedCategory === 'all' || b.category === selectedCategory;
    const matchesSearch =
      (b.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (b.category || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    setExcelFileName(file.name);
    setIsUploading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const parsed = await parseBenefitsExcel(file);
      if (parsed.length === 0) {
        throw new Error(isRtl ? 'لم يتم العثور على بنود منافع في الملف. يرجى التأكد من محتوى الإكسل.' : 'No benefit items found in the Excel file.');
      }
      onUpdateExcelBenefits(parsed);
      setSuccessMessage(isRtl ? `تم فك واستخراج ${parsed.length} بنداً بنجاح وتصنيفها تلقائياً!` : `Successfully parsed ${parsed.length} benefits!`);
      setErrorMessage(null);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || (isRtl ? 'حدث خطأ أثناء قراءة ملف الإكسل.' : 'Error reading Excel file.'));
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    setExcelFileName(file.name);
    setIsUploading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const parsed = await parseBenefitsExcel(file);
      if (parsed.length === 0) {
        throw new Error(isRtl ? 'لم يتم استخراج أي منافع من ملف الإكسل.' : 'No benefits extracted.');
      }
      onUpdateExcelBenefits(parsed);
      setSuccessMessage(isRtl ? `تم فك واستخراج ${parsed.length} بنداً بنجاح وتصنيفها تلقائياً!` : `Successfully parsed ${parsed.length} benefits!`);
      setErrorMessage(null);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || (isRtl ? 'حدث خطأ أثناء قراءة ملف الإكسل.' : 'Error reading Excel file.'));
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleAddNewBenefit = () => {
    if (!newBenefitName.trim()) return;

    const cat = newBenefitCategory.trim() || inferBenefitCategory(newBenefitName.trim());
    const newReq: BenefitRequirement = {
      id: `req_custom_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: newBenefitName.trim(),
      category: cat,
      targetValue: isRtl ? 'غير محدد (يتم استخراجه من كراسة الشروط)' : 'Unconstrained (Will be bound in Step 3)',
      unit: '',
      type: 'numeric_min',
      weight: 3,
      priority: 'medium',
      isMandatory: false,
      description: isRtl ? 'بند مضاف يدوياً' : 'Manually added benefit'
    };

    onUpdateExcelBenefits([...excelBenefits, newReq]);
    setNewBenefitName('');
    setNewBenefitCategory('');
  };

  const handleDeleteBenefit = (id: string) => {
    onUpdateExcelBenefits(excelBenefits.filter((b) => b.id !== id));
  };

  const handleConfirmClear = () => {
    onUpdateExcelBenefits([]);
    setExcelFileName('');
    setSuccessMessage(isRtl ? 'تم مسح القائمة بنجاح. يمكنك الآن استيراد ملف إكسل جديد.' : 'List cleared. You can now import a new Excel file.');
    setErrorMessage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setShowClearConfirmModal(false);
  };

  const handleTriggerReimport = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header Banner with Project Year Context */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            {/* Header Badges in ONE strict single row */}
            <div className="flex items-center gap-2 overflow-x-auto whitespace-nowrap flex-nowrap pb-1 no-scrollbar">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-sky-100 text-sky-800 border border-sky-200 shrink-0 whitespace-nowrap">
                <FileSpreadsheet className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                <span className="whitespace-nowrap">{isRtl ? 'الخطوة ١ من ٦: استيراد جدول المنافع' : 'Step 1 of 6: Import Benefits Schedule'}</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-slate-900 text-white shadow-2xs shrink-0 whitespace-nowrap">
                <Calendar className="w-3.5 h-3.5 text-sky-300 shrink-0" />
                <span className="whitespace-nowrap">{projectYear}</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200 shrink-0 whitespace-nowrap">
                <FolderGit2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="truncate max-w-xs whitespace-nowrap">{projectName}</span>
              </span>

              {/* Direct Quick Edit for this active year project */}
              {onEditCurrentProject && (
                <button
                  id="btn-step1-edit-project"
                  onClick={onEditCurrentProject}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold text-sky-700 bg-sky-50 hover:bg-sky-100 border border-sky-200 transition-colors cursor-pointer shrink-0 whitespace-nowrap"
                  title={isRtl ? 'تعديل اسم وسنة المشروع' : 'Edit project name and year'}
                >
                  <Edit3 className="w-3 h-3 text-sky-600 shrink-0" />
                  <span className="whitespace-nowrap">{isRtl ? 'تعديل المشروع' : 'Edit'}</span>
                </button>
              )}

              {/* Direct Quick Delete if multiple projects exist */}
              {canDeleteProject && onDeleteCurrentProject && (
                <button
                  id="btn-step1-delete-project"
                  onClick={onDeleteCurrentProject}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors cursor-pointer shrink-0 whitespace-nowrap"
                  title={isRtl ? 'حذف هذا المشروع' : 'Delete this project'}
                >
                  <Trash2 className="w-3 h-3 text-rose-600 shrink-0" />
                  <span className="whitespace-nowrap">{isRtl ? 'حذف' : 'Delete'}</span>
                </button>
              )}
            </div>

            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 leading-normal">
              {isRtl ? '١. استيراد جدول بنود ومنافع التأمين من ملف الإكسل' : '1. Import Benefits Schedule from Excel File'}
            </h2>
            <p className="text-sm text-slate-600 max-w-3xl leading-relaxed">
              {isRtl
                ? 'تختلف بنود وسقوف التأمين من سنة لأخرى؛ لذا يقوم النظام باستيراد واستخراج كافة البنود ديناميكياً من ملف الإكسل المرفوع الخاص بهذه السنة، مع حفظ كل سنة كمشروع مستقل ومستمر.'
                : 'Benefits and coverage ceilings vary from year to year. The system dynamically imports all rows from your uploaded Excel for this specific year and saves each year as an independent project.'}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            {onOpenProjectManager && (
              <button
                id="btn-step1-manage-projects"
                onClick={onOpenProjectManager}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold bg-slate-100 text-slate-800 hover:bg-slate-200 border border-slate-200 shadow-2xs transition-colors cursor-pointer"
                title={isRtl ? 'إدارة وتعديل وحذف مشاريع السنوات' : 'Manage, edit & switch tender years'}
              >
                <FolderGit2 className="w-4 h-4 text-sky-600" />
                <span>{isRtl ? 'إدارة وتعديل السنوات' : 'Manage & Edit Years'}</span>
              </button>
            )}

            {excelBenefits.length > 0 && (
              <>
                <button
                  id="btn-step1-reimport-top"
                  onClick={handleTriggerReimport}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold text-sky-800 bg-sky-50 hover:bg-sky-100 border border-sky-200 transition-colors shadow-2xs cursor-pointer"
                  title={isRtl ? 'إعادة استيراد ملف إكسل أو استبداله' : 'Re-import or replace Excel file'}
                >
                  <RefreshCw className="w-3.5 h-3.5 text-sky-600" />
                  <span>{isRtl ? 'إعادة استيراد ملف إكسل' : 'Re-import Excel'}</span>
                </button>

                <button
                  id="btn-step1-clear-list-top"
                  onClick={() => setShowClearConfirmModal(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors shadow-2xs cursor-pointer"
                  title={isRtl ? 'مسح كافة المنافع والبدء بقائمة فارغة' : 'Clear all loaded benefits'}
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                  <span>{isRtl ? 'مسح القائمة' : 'Clear List'}</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Dynamic Metrics Bar When Items Exist */}
      {excelBenefits.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
            <div className="text-xs font-semibold text-slate-500 mb-1">
              {isRtl ? 'البنود المستوردة من الإكسل' : 'Imported Benefit Items'}
            </div>
            <div className="text-2xl font-bold text-slate-900 flex items-baseline gap-1.5">
              <span>{excelBenefits.length}</span>
              <span className="text-xs font-medium text-slate-500">{isRtl ? 'بنداً' : 'items'}</span>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
            <div className="text-xs font-semibold text-slate-500 mb-1">
              {isRtl ? 'مجموع الدرجات الفنية المحسوبة' : 'Total Technical Score'}
            </div>
            <div className="text-2xl font-bold text-sky-700 flex items-baseline gap-1.5">
              <span>{excelBenefits.length * 5}</span>
              <span className="text-xs font-medium text-slate-500">{isRtl ? 'علامة (بمعدل 5 علامات/بند)' : 'marks (5 marks/item)'}</span>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
            <div className="text-xs font-semibold text-slate-500 mb-1">
              {isRtl ? 'الفئات والأقسام المكتشفة' : 'Detected Categories'}
            </div>
            <div className="text-2xl font-bold text-emerald-700 flex items-baseline gap-1.5">
              <span>{categories.length}</span>
              <span className="text-xs font-medium text-slate-500">{isRtl ? 'فئات طبية' : 'categories'}</span>
            </div>
          </div>
        </div>
      )}

      {/* Upload Dropzone & Templates */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* Dropzone (2 Cols) */}
        <div className="lg:col-span-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            onClick={(e) => {
              // Ensure change event fires even if the same file name is chosen again
              (e.target as HTMLInputElement).value = '';
            }}
            accept=".xlsx,.xls,.csv"
            className="hidden"
          />

          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={handleTriggerReimport}
            className={`border-2 border-dashed rounded-3xl p-6 sm:p-8 text-center transition-all cursor-pointer flex flex-col items-center justify-center min-h-[220px] ${
              isUploading
                ? 'bg-sky-50/50 border-sky-400 animate-pulse'
                : excelBenefits.length > 0
                ? 'bg-emerald-50/40 border-emerald-300 hover:bg-emerald-50/70'
                : 'bg-white border-slate-300 hover:border-sky-500 hover:bg-sky-50/30'
            }`}
          >
            {excelBenefits.length > 0 ? (
              <div className="space-y-3 w-full max-w-md">
                <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-2xs">
                  <FileSpreadsheet className="w-7 h-7" />
                </div>

                <div>
                  <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 mb-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{isRtl ? `تم استيراد ${excelBenefits.length} بنداً بنجاح` : `${excelBenefits.length} benefits loaded`}</span>
                  </div>
                  <h3 className="text-sm sm:text-base font-extrabold text-slate-800 truncate">
                    {excelFileName ? `${isRtl ? 'الملف: ' : 'File: '} ${excelFileName}` : (isRtl ? 'جدول المنافع مفعل' : 'Benefits Schedule Active')}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    {isRtl 
                      ? 'يمكنك استبدال هذا الملف بملف آخر فوراً، أو مسح القائمة الحالية.' 
                      : 'You can re-import/replace with another Excel file or clear the list.'}
                  </p>
                </div>

                <div className="flex items-center justify-center gap-2 pt-1 flex-wrap">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleTriggerReimport();
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-sky-600 text-white hover:bg-sky-700 transition-all shadow-2xs cursor-pointer"
                    title={isRtl ? 'اختيار ملف إكسل آخر واستبدال القائمة الحالية' : 'Choose another file to replace list'}
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>{isRtl ? 'استبدال / إعادة استيراد ملف جديد' : 'Re-import / Replace File'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowClearConfirmModal(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-rose-700 bg-white hover:bg-rose-50 border border-rose-200 transition-all cursor-pointer shadow-2xs"
                    title={isRtl ? 'مسح جدول المنافع الحالي' : 'Clear current benefits list'}
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                    <span>{isRtl ? 'مسح القائمة' : 'Clear List'}</span>
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="w-14 h-14 rounded-2xl bg-sky-100 text-sky-600 flex items-center justify-center mb-3 shadow-2xs">
                  <Upload className="w-7 h-7" />
                </div>

                <h3 className="text-base font-bold text-slate-800 mb-1">
                  {isUploading
                    ? (isRtl ? 'جاري فك وقراءة ملف الإكسل واستخراج البنود...' : 'Parsing Excel file...')
                    : (isRtl ? 'اسحب وأفلت ملف الإكسل هنا أو انقر للتصفح' : 'Drop Excel file here or click to browse')}
                </h3>

                <p className="text-xs text-slate-500 max-w-md mb-3">
                  {isRtl
                    ? 'يدعم ملفات XLSX, XLS, CSV (بما في ذلك ملفات مقارنة عروض وشركات التأمين مع الأعمدة المدمجة)'
                    : 'Supports XLSX, XLS, CSV files (including multi-column insurance comparison matrices)'}
                </p>

                <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold bg-sky-600 text-white shadow-2xs">
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>{isRtl ? 'تحديد ملف إكسل من جهازك' : 'Choose Excel File'}</span>
                </span>
              </>
            )}
          </div>

          {successMessage && (
            <div className="mt-3 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {errorMessage && (
            <div className="mt-3 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>

        {/* Templates & Quick Downloads Card */}
        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center gap-2 text-slate-800 font-bold text-sm mb-1.5">
              <Download className="w-4 h-4 text-sky-600" />
              <span>{isRtl ? 'نماذج وقوالب إكسل جاهزة' : 'Download Excel Templates'}</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed mb-4">
              {isRtl
                ? 'يمكنك تنزيل أحد النماذج المعتمدة لجدول الـ 72 بنداً أو تعبئته ورفعه مباشرة:'
                : 'Download blank or filled templates for the 72-point schedule:'}
            </p>

            <div className="space-y-2">
              <button
                onClick={downloadSingleColumnExcelTemplate}
                className="w-full text-start flex items-center justify-between p-2.5 rounded-xl bg-slate-50 hover:bg-sky-50 text-slate-700 hover:text-sky-800 border border-slate-200 transition-colors text-xs font-semibold cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  <span>{isRtl ? 'قالب جدول بنود التأمين المعتمد (72 بند)' : 'Official 72-Point Benefit Template'}</span>
                </div>
                <Download className="w-3.5 h-3.5 text-slate-400" />
              </button>

              <button
                onClick={downloadBenefitAndCategoryExcelTemplate}
                className="w-full text-start flex items-center justify-between p-2.5 rounded-xl bg-slate-50 hover:bg-sky-50 text-slate-700 hover:text-sky-800 border border-slate-200 transition-colors text-xs font-semibold cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-sky-600" />
                  <span>{isRtl ? 'قالب عمودين (المنفعة + الفئة/القسم)' : 'Two-Column Template (Category + Name)'}</span>
                </div>
                <Download className="w-3.5 h-3.5 text-slate-400" />
              </button>

              <button
                onClick={downloadSampleExcelTemplate}
                className="w-full text-start flex items-center justify-between p-2.5 rounded-xl bg-slate-50 hover:bg-sky-50 text-slate-700 hover:text-sky-800 border border-slate-200 transition-colors text-xs font-semibold cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-indigo-600" />
                  <span>{isRtl ? 'قالب متقدم مع الأوزان والدرجات (5/5)' : 'Full Template with Weights & Limits'}</span>
                </div>
                <Download className="w-3.5 h-3.5 text-slate-400" />
              </button>
            </div>
          </div>

          <div className="p-3 bg-sky-50/60 rounded-2xl border border-sky-100 text-[11px] text-sky-900 leading-relaxed">
            💡 <strong>{isRtl ? 'نظام المعالجة الذكي:' : 'Smart Engine:'}</strong>{' '}
            {isRtl
              ? 'يقوم النظام تلقائياً بتحديد عمود أسماء المنافع، واستبعاد الترويسات وأرقام التسلسل، وتصنيف كل بند في فئته المناسبة للربط مع كراسة الشروط في الخطوة التالية.'
              : 'The system automatically identifies the benefit descriptions column, skips noise/headers, and groups each point into its category.'}
          </div>
        </div>
      </div>

      {/* Benefits Preview & Inline Management */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
        
        {/* Table Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <h3 className="text-base font-bold text-slate-900">
              {isRtl ? 'جدول المنافع المرفوعة' : 'Loaded Benefits Schedule'}
            </h3>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-sky-100 text-sky-800">
              {excelBenefits.length} {isRtl ? 'منفعة' : 'benefits'}
            </span>
            <span className="text-xs text-slate-400 hidden sm:inline">
              ({categories.length} {isRtl ? 'فئات تصنيف' : 'categories'})
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isRtl ? 'بحث في المنافع...' : 'Search benefits...'}
                className="pr-8 pl-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none w-40 sm:w-48 bg-slate-50/50"
              />
            </div>

            {/* Category Filter */}
            <div className="relative">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs bg-slate-50/50 focus:ring-2 focus:ring-sky-500 focus:outline-none"
              >
                <option value="all">{isRtl ? 'كافة الفئات' : 'All Categories'}</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {excelBenefits.length > 0 && (
              <>
                <button
                  id="btn-table-reimport"
                  onClick={handleTriggerReimport}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-sky-200 text-xs font-bold text-sky-700 bg-sky-50 hover:bg-sky-100 transition-colors cursor-pointer"
                  title={isRtl ? 'إعادة استيراد ملف إكسل آخر' : 'Re-import another Excel file'}
                >
                  <RefreshCw className="w-3.5 h-3.5 text-sky-600" />
                  <span className="hidden sm:inline">{isRtl ? 'إعادة استيراد' : 'Re-import'}</span>
                </button>

                <button
                  id="btn-table-clear"
                  onClick={() => setShowClearConfirmModal(true)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-rose-200 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 transition-colors cursor-pointer"
                  title={isRtl ? 'مسح كافة المنافع والبدء بقائمة فارغة' : 'Clear all benefits'}
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                  <span>{isRtl ? 'مسح القائمة' : 'Clear List'}</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Inline Add Quick Form */}
        <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 flex flex-col sm:flex-row items-center gap-2">
          <input
            type="text"
            value={newBenefitName}
            onChange={(e) => setNewBenefitName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddNewBenefit()}
            placeholder={isRtl ? 'إضافة منفعة جديدة يدوياً (مثال: جلسات العلاج الطبيعي)...' : 'Add custom benefit name...'}
            className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
          />
          <input
            type="text"
            value={newBenefitCategory}
            onChange={(e) => setNewBenefitCategory(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddNewBenefit()}
            placeholder={isRtl ? 'الفئة (اختياري - مثل: العيادات)...' : 'Category (Optional)...'}
            className="w-full sm:w-48 px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
          />
          <button
            onClick={handleAddNewBenefit}
            disabled={!newBenefitName.trim()}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1 px-4 py-2 rounded-xl text-xs font-bold bg-sky-600 text-white hover:bg-sky-700 disabled:opacity-50 transition-colors shadow-2xs cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>{isRtl ? 'إضافة منفعة' : 'Add Benefit'}</span>
          </button>
        </div>

        {/* Benefits Table */}
        {excelBenefits.length === 0 ? (
          <div className="py-12 text-center text-slate-400 space-y-3">
            <FileSpreadsheet className="w-12 h-12 mx-auto text-slate-300" />
            <p className="text-sm font-semibold">{isRtl ? 'لم يتم تحميل أي منافع بعد' : 'No benefits loaded yet'}</p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {isRtl ? 'قم برفع ملف إكسل أعلاه أو انقر على "تحميل جدول منافع نموذجي" للبدء فوراً.' : 'Upload an Excel file or click Load Sample Benefits to start.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto max-h-[380px] border border-slate-200 rounded-2xl">
            <table className="w-full text-xs text-start">
              <thead className="bg-slate-100/80 text-slate-700 font-bold sticky top-0 z-10 border-b border-slate-200">
                <tr>
                  <th className="p-3 text-start w-12">#</th>
                  <th className="p-3 text-start">{isRtl ? 'اسم المنفعة المطلوبة' : 'Benefit Name'}</th>
                  <th className="p-3 text-start w-44">{isRtl ? 'الفئة / القسم' : 'Category'}</th>
                  <th className="p-3 text-start w-48">{isRtl ? 'القيمة المبدئية' : 'Initial Value'}</th>
                  <th className="p-3 text-center w-16">{isRtl ? 'إجراء' : 'Action'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredBenefits.map((b, idx) => (
                  <tr key={b.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3 text-slate-500 font-medium text-xs">{idx + 1}</td>
                    <td className="p-3 font-semibold text-slate-900 text-sm">{b.name}</td>
                    <td className="p-3">
                      <span className="inline-block px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                        {b.category || (isRtl ? 'عام' : 'General')}
                      </span>
                    </td>
                    <td className="p-3 text-slate-600 text-xs">
                      {b.targetValue ? String(b.targetValue) : (isRtl ? 'يتم الربط في الخطوة ٣' : 'Pending Step 3 binding')}
                    </td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => handleDeleteBenefit(b.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        title={isRtl ? 'حذف هذه المنفعة' : 'Delete benefit'}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Bottom CTA Action Bar */}
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-100">
          <div className="text-xs text-slate-500">
            {isRtl ? 'جاهز؟ انقر على الزر للمتابعة وإدخال كراسة الشروط والسقوف.' : 'Ready? Proceed to Step 2 to enter RFP conditions.'}
          </div>

          <button
            id="btn-step1-proceed-to-step2"
            onClick={onProceedToStep2}
            disabled={excelBenefits.length === 0}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl text-sm font-bold bg-sky-600 text-white hover:bg-sky-700 disabled:opacity-50 transition-all shadow-md hover:shadow-lg cursor-pointer"
          >
            <span>{isRtl ? 'اعتماد المنافع والانتقال للخطوة ٢ (كراسة الشروط)' : 'Confirm Benefits & Proceed to Step 2 (RFP Conditions)'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>

      {/* Clear Benefits Confirmation Modal */}
      {showClearConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6" />
            </div>
            
            <h3 className="text-lg font-bold text-slate-900 text-center mb-2">
              {isRtl ? 'مسح جدول المنافع المستوردة' : 'Clear Benefits Schedule'}
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 text-center mb-6 leading-relaxed">
              {isRtl 
                ? `هل أنت متأكد من مسح كافة المنافع المرفوعة (${excelBenefits.length} بنداً)؟ سيتم تفريغ القائمة لتتمكن من استيراد ملف إكسل جديد فوراً.`
                : `Are you sure you want to clear all ${excelBenefits.length} loaded benefits? The list will be emptied so you can re-import a new file.`}
            </p>

            <div className="flex items-center gap-3">
              <button
                type="button"
                id="btn-cancel-clear-modal"
                onClick={() => setShowClearConfirmModal(false)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer text-center"
              >
                {isRtl ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="button"
                id="btn-confirm-clear-modal"
                onClick={handleConfirmClear}
                className="flex-1 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs sm:text-sm font-bold transition-colors shadow-sm cursor-pointer text-center"
              >
                {isRtl ? 'نعم، مسح القائمة' : 'Yes, Clear List'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
