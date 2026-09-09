import React, { useState, useRef, useEffect } from 'react';
import { 
  Scale, 
  ShieldCheck, 
  FileSpreadsheet, 
  FileText, 
  Sparkles, 
  CheckSquare, 
  Building2, 
  BarChart3, 
  Calculator, 
  Award, 
  ChevronDown, 
  Download, 
  Trash2, 
  ChevronRight, 
  ChevronLeft, 
  X,
  CheckCircle2,
  HelpCircle,
  Settings as SettingsIcon,
  Shield,
  Layers,
  FolderOpen,
  PieChart,
  Bot
} from 'lucide-react';
import { PRESET_TEMPLATES } from '../data/presetData';
import { PresetTemplate } from '../types';
import { useI18n } from '../i18n/I18nContext';
import { useSettings } from '../context/SettingsContext';
import { useAuth } from '../context/AuthContext';
import { localizeTemplate } from '../utils/bilingualData';

interface SidebarNavProps {
  activeTab: string;
  onSelectTab: (tab: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  requirementsCount: number;
  proposalsCount: number;
  excelCount: number;
  hasConditions: boolean;
  activeProjectYear?: string;
  activeProjectName?: string;
  onOpenProjectManager?: () => void;
  onOpenAdvisor: () => void;
  onResetToDemo: () => void;
  onClearData: () => void;
  onSelectPreset: (preset: PresetTemplate) => void;
  onOpenExport: () => void;
  totalMembers?: number;
}

export const SidebarNav: React.FC<SidebarNavProps> = ({
  activeTab,
  onSelectTab,
  isCollapsed,
  onToggleCollapse,
  isMobileOpen,
  onCloseMobile,
  requirementsCount,
  proposalsCount,
  excelCount,
  hasConditions,
  activeProjectYear = '2026 - 2027',
  activeProjectName,
  onOpenProjectManager,
  onOpenAdvisor,
  onResetToDemo,
  onClearData,
  onSelectPreset,
  onOpenExport,
  totalMembers = 256
}) => {
  const { isRtl, language } = useI18n();
  const { settings } = useSettings();
  const { isAdmin } = useAuth();
  const [isTemplateMenuOpen, setIsTemplateMenuOpen] = useState(false);
  const templateMenuRef = useRef<HTMLDivElement>(null);

  // Normalize current tab name
  const normalizedCurrentTab = 
    activeTab === 'requirements' ? 'step4_review' :
    activeTab === 'proposals' ? 'step5_proposals' :
    activeTab === 'rankings' ? 'step6_tradeoff_matrix' :
    activeTab === 'actuarial' ? 'step_actuarial' :
    activeTab === 'reports' ? 'step_reports' :
    activeTab;

  // Determine active category to keep it open
  const getInitialOpenCategories = () => {
    return {
      specs: ['step1_excel', 'step2_rfp', 'step3_binding', 'step4_review'].includes(normalizedCurrentTab),
      analysis: ['step5_proposals', 'step_actuarial', 'step6_tradeoff_matrix', 'audit'].includes(normalizedCurrentTab),
      decision: ['step_reports'].includes(normalizedCurrentTab),
      admin: ['admin'].includes(normalizedCurrentTab)
    };
  };

  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({
    specs: true,
    analysis: true,
    decision: true,
    admin: false
  });

  // Automatically expand category when activeTab changes
  useEffect(() => {
    if (['step1_excel', 'step2_rfp', 'step3_binding', 'step4_review'].includes(normalizedCurrentTab)) {
      setOpenCategories(prev => ({ ...prev, specs: true }));
    } else if (['step5_proposals', 'step_actuarial', 'step6_tradeoff_matrix', 'audit'].includes(normalizedCurrentTab)) {
      setOpenCategories(prev => ({ ...prev, analysis: true }));
    } else if (normalizedCurrentTab === 'step_reports') {
      setOpenCategories(prev => ({ ...prev, decision: true }));
    } else if (normalizedCurrentTab === 'admin') {
      setOpenCategories(prev => ({ ...prev, admin: true }));
    }
  }, [normalizedCurrentTab]);

  const toggleCategory = (catKey: string) => {
    setOpenCategories(prev => ({ ...prev, [catKey]: !prev[catKey] }));
  };

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (templateMenuRef.current && !templateMenuRef.current.contains(event.target as Node)) {
        setIsTemplateMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleItemClick = (tabId: string) => {
    onSelectTab(tabId);
    if (isMobileOpen) {
      onCloseMobile();
    }
  };

  // Main Categories and Submenus Structure
  const menuCategories = [
    {
      key: 'specs',
      titleAr: 'الشروط والمواصفات (كراسة العطاء)',
      titleEn: 'Tender Specs & RFP Requirements',
      shortTitleAr: 'الشروط والمواصفات',
      shortTitleEn: 'Specs & Terms',
      icon: Layers,
      color: 'text-sky-600 dark:text-sky-400',
      badge: `${[excelCount > 0, hasConditions, requirementsCount > 0, requirementsCount > 0].filter(Boolean).length}/4`,
      badgeColor: 'bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300 border-sky-200 dark:border-sky-800',
      submenus: [
        {
          id: 'step1_excel',
          stepNum: '1',
          titleAr: 'كشف المنافع الأصلي',
          titleEn: 'Original Benefits Schedule',
          descAr: 'جدول المنافع والتغطيات الطبية (Excel)',
          descEn: 'Medical benefits & coverage table',
          count: `${excelCount} ${isRtl ? 'بند' : 'items'}`,
          icon: FileSpreadsheet,
          isCompleted: excelCount > 0
        },
        {
          id: 'step2_rfp',
          stepNum: '2',
          titleAr: 'كراسة الشروط والمحددات',
          titleEn: 'RFP Conditions & Caps',
          descAr: 'الشروط التعاقدية والسقوف المالية',
          descEn: 'Contractual rules & financial limits',
          count: hasConditions ? (isRtl ? 'معتمدة' : 'Verified') : (isRtl ? 'مسودة' : 'Draft'),
          icon: FileText,
          isCompleted: hasConditions
        },
        {
          id: 'step3_binding',
          stepNum: '3',
          titleAr: 'المطابقة والربط الذكي',
          titleEn: 'Smart AI Binding',
          descAr: 'اقتران الشروط بالمنافع آلياً (AI)',
          descEn: 'Automated semantic condition binding',
          count: `${requirementsCount} ${isRtl ? 'سقف' : 'caps'}`,
          icon: Sparkles,
          isCompleted: requirementsCount > 0,
          pill: 'AI'
        },
        {
          id: 'step4_review',
          stepNum: '4',
          titleAr: 'مراجعة البنود المعتمدة',
          titleEn: 'Approved Requirements',
          descAr: 'الاعتماد النهائي لمعايير التقييم',
          descEn: 'Final validated evaluation items',
          count: `${requirementsCount} ${isRtl ? 'بند' : 'reqs'}`,
          icon: CheckSquare,
          isCompleted: requirementsCount > 0
        }
      ]
    },
    {
      key: 'analysis',
      titleAr: 'عروض الشركات والمفاضلة المالية',
      titleEn: 'Insurer Proposals & Scoring',
      shortTitleAr: 'عروض الشركات والمفاضلة',
      shortTitleEn: 'Proposals & Scoring',
      icon: BarChart3,
      color: 'text-indigo-600 dark:text-indigo-400',
      badge: `${proposalsCount} ${isRtl ? 'عروض' : 'bids'}`,
      badgeColor: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
      submenus: [
        {
          id: 'step5_proposals',
          stepNum: '5',
          titleAr: 'عروض وأسعار الشركات',
          titleEn: 'Insurer Bids & Quotes',
          descAr: 'تفريغ عروض وأسعار شركات التأمين',
          descEn: 'Insurer premium proposals & documents',
          count: `${proposalsCount} ${isRtl ? 'عروض' : 'bids'}`,
          icon: Building2,
          isCompleted: proposalsCount > 0
        },
        {
          id: 'step_actuarial',
          stepNum: '6',
          titleAr: 'التقييم المالي وتوزيع الأقساط',
          titleEn: 'Financial & Premium Analysis',
          descAr: 'حساب الأقساط حسب الفئات والأعمار (40%)',
          descEn: 'Actuarial demographic census calculation',
          count: `${totalMembers} ${isRtl ? 'مشترك' : 'mbrs'}`,
          icon: Calculator,
          isCompleted: proposalsCount > 0
        },
        {
          id: 'step6_tradeoff_matrix',
          stepNum: '7',
          titleAr: 'مصفوفة المفاضلة والمقارنة',
          titleEn: 'Tradeoff & Comparison Matrix',
          descAr: 'معيار 60% فني + 40% مالي معتمد',
          descEn: 'Official 60% technical / 40% financial rule',
          count: isRtl ? '60/40' : '60/40',
          icon: Scale,
          isCompleted: proposalsCount > 0 && requirementsCount > 0,
          pill: '60/40'
        },
        {
          id: 'audit',
          stepNum: '8',
          titleAr: 'مدقق السقوف وقواعد الالتزام',
          titleEn: 'Ceiling & Compliance Audit',
          descAr: 'فاحص عدم تجاوز 100% ومنع البونص',
          descEn: 'Strict 100% no-bonus cap compliance',
          count: isRtl ? 'صارم' : 'Strict',
          icon: ShieldCheck,
          isCompleted: requirementsCount > 0,
          pill: 'Strict'
        }
      ]
    },
    {
      key: 'decision',
      titleAr: 'قرار الترسية والتقارير المعتمدة',
      titleEn: 'Final Award Decision & Reports',
      shortTitleAr: 'قرار الترسية والتقارير',
      shortTitleEn: 'Award & Reports',
      icon: Award,
      color: 'text-amber-600 dark:text-amber-400',
      badge: isRtl ? 'الترسية' : 'Award',
      badgeColor: 'bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800',
      submenus: [
        {
          id: 'step_reports',
          stepNum: '9',
          titleAr: 'التقرير النهائي وقرار الترسية',
          titleEn: 'Final Award & Tender Report',
          descAr: 'المذكرة الشاملة، المفاضلة، وتوصية اللجنة',
          descEn: 'Comprehensive tender report & award memo',
          count: isRtl ? 'معتمد' : 'Final',
          icon: Award,
          isCompleted: proposalsCount > 0 && requirementsCount > 0,
          pill: '390 Pts'
        }
      ]
    },
    {
      key: 'admin',
      titleAr: 'إدارة النظام والتحكم المؤسسي',
      titleEn: 'System Admin & Governance',
      shortTitleAr: 'إدارة النظام',
      shortTitleEn: 'Admin Panel',
      icon: Shield,
      color: 'text-violet-600 dark:text-violet-400',
      badge: settings.aiProvider === 'gemini' ? 'Gemini AI' : 'OpenAI',
      badgeColor: 'bg-violet-50 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300 border-violet-200 dark:border-violet-800',
      submenus: [
        {
          id: 'admin',
          stepNum: '⚙',
          titleAr: 'لوحة الإدارة والإعدادات',
          titleEn: 'Admin Panel & Settings',
          descAr: 'المستخدمين، شعار المؤسسة، ومفاتيح الذكاء',
          descEn: 'Users, roles, branding & AI engine keys',
          count: isAdmin ? (isRtl ? 'مسؤول' : 'Admin') : (isRtl ? 'دخول' : 'Login'),
          icon: SettingsIcon,
          isCompleted: true
        }
      ]
    }
  ];

  const sidebarContent = (
    <div className="h-full flex flex-col justify-between overflow-hidden select-none bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm">
      
      {/* 1. Header: Platform identity & Active Tender Banner */}
      <div className="px-3 py-3 border-b border-slate-200/90 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/90 shrink-0">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            {settings.logoUrl ? (
              <img 
                src={settings.logoUrl} 
                alt="Logo" 
                onError={(e) => { (e.target as HTMLImageElement).src = '/logo.png'; }}
                className="w-9 h-9 rounded-xl object-contain bg-white shadow-xs shrink-0 ring-1 ring-slate-200 dark:ring-slate-700 p-1" 
              />
            ) : (
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-600 via-indigo-600 to-sky-700 flex items-center justify-center text-white shadow-xs shrink-0">
                <Scale className="w-5 h-5 text-white" />
              </div>
            )}
            
            {!isCollapsed && (
              <div className="min-w-0 flex-1">
                <h1 className="text-sm font-black text-slate-900 dark:text-white leading-tight truncate">
                  {isRtl ? 'منصة مقارنة عروض التأمين' : 'Insurance Tender Evaluator'}
                </h1>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[11px] font-bold text-sky-700 dark:text-sky-400 flex items-center gap-1 truncate">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span className="truncate">{activeProjectName || (isRtl ? 'مناقصة التأمين الطبي' : 'Active Tender')}</span>
                  </span>
                  {onOpenProjectManager && (
                    <button
                      type="button"
                      onClick={onOpenProjectManager}
                      className="text-[10px] font-black text-slate-700 dark:text-slate-300 hover:text-sky-900 dark:hover:text-sky-300 bg-white dark:bg-slate-800 hover:bg-sky-50 dark:hover:bg-slate-700 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer shrink-0 shadow-2xs"
                      title={isRtl ? 'إدارة وتبديل المناقصات' : 'Switch Tender'}
                    >
                      {activeProjectYear}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Desktop Collapse Toggle */}
          <button
            type="button"
            onClick={onToggleCollapse}
            className="hidden lg:flex w-7 h-7 rounded-lg items-center justify-center text-slate-500 hover:text-slate-950 dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
            title={isCollapsed ? (isRtl ? 'توسيع القائمة' : 'Expand Sidebar') : (isRtl ? 'طي القائمة' : 'Collapse Sidebar')}
          >
            {isRtl ? (
              isCollapsed ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />
            ) : (
              isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />
            )}
          </button>

          {/* Mobile Close Button */}
          <button
            type="button"
            onClick={onCloseMobile}
            className="lg:hidden w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-950 dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 2. Main Navigation: Categorized Main Menus with Collapsible Submenus */}
      <div className="flex-1 py-3 px-2 space-y-2.5 overflow-y-auto custom-scrollbar">
        {menuCategories.map((category) => {
          const isOpen = openCategories[category.key] ?? true;
          const CategoryIcon = category.icon;
          const hasActiveChild = category.submenus.some(sub => sub.id === normalizedCurrentTab);

          if (isCollapsed) {
            // In Collapsed mode: icon only with popover title
            return (
              <div key={category.key} className="space-y-1">
                <div className="w-full flex justify-center py-1">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-500`}>
                    <CategoryIcon className="w-4 h-4" />
                  </div>
                </div>
                {category.submenus.map((step) => {
                  const isActive = normalizedCurrentTab === step.id;
                  const Icon = step.icon;
                  return (
                    <button
                      key={step.id}
                      type="button"
                      onClick={() => handleItemClick(step.id)}
                      className={`w-full h-9 rounded-xl flex items-center justify-center transition-all relative group cursor-pointer ${
                        isActive
                          ? 'bg-indigo-600 text-white shadow-xs font-bold'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                      title={`${isRtl ? step.titleAr : step.titleEn} - ${step.descAr}`}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      {step.isCompleted && !isActive && (
                        <span className="absolute top-1 end-1 w-1.5 h-1.5 rounded-full bg-emerald-500 ring-1 ring-white dark:ring-slate-900" />
                      )}
                    </button>
                  );
                })}
              </div>
            );
          }

          return (
            <div 
              key={category.key} 
              className={`rounded-2xl transition-all duration-200 border ${
                hasActiveChild 
                  ? 'bg-white dark:bg-slate-900 border-indigo-200/90 dark:border-indigo-900/60 shadow-xs' 
                  : 'bg-slate-50/60 dark:bg-slate-800/40 border-slate-200/70 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              {/* Main Menu Header Toggle */}
              <div
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-2xl text-start transition-colors cursor-pointer group ${
                  hasActiveChild
                    ? 'text-slate-900 dark:text-white'
                    : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <div 
                  className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer"
                  onClick={() => {
                    if (!isOpen) {
                      toggleCategory(category.key);
                    }
                    if (category.submenus.length > 0) {
                      handleItemClick(category.submenus[0].id);
                    }
                  }}
                >
                  <div className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${
                    hasActiveChild 
                      ? 'bg-indigo-600 text-white shadow-xs' 
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                  }`}>
                    <CategoryIcon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-black tracking-tight truncate leading-tight">
                      {isRtl ? category.shortTitleAr : category.shortTitleEn}
                    </div>
                    <div className="text-[10px] text-slate-400 dark:text-slate-500 font-medium truncate leading-none mt-0.5">
                      {isRtl ? `${category.submenus.length} بنود فرعية` : `${category.submenus.length} sub-items`}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0 ms-2">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-black border ${category.badgeColor}`}>
                    {category.badge}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleCategory(category.key);
                    }}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-transform duration-200 p-1 cursor-pointer"
                    title={isOpen ? (isRtl ? 'طي القائمة' : 'Collapse') : (isRtl ? 'توسيع القائمة' : 'Expand')}
                  >
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? 'rotate-0' : isRtl ? 'rotate-90' : '-rotate-90'}`} />
                  </button>
                </div>
              </div>

              {/* Submenus List */}
              {isOpen && (
                <div className="px-2 pb-2 pt-0.5 space-y-1">
                  <div className="border-t border-slate-100 dark:border-slate-800 my-1" />
                  {category.submenus.map((step) => {
                    const isActive = normalizedCurrentTab === step.id;
                    const Icon = step.icon;

                    return (
                      <button
                        key={step.id}
                        type="button"
                        onClick={() => handleItemClick(step.id)}
                        className={`w-full text-start py-2 px-2.5 rounded-xl transition-all flex items-center justify-between gap-2 cursor-pointer group/item relative ${
                          isActive
                            ? 'bg-gradient-to-r from-indigo-50 to-sky-50 dark:from-indigo-950/80 dark:to-sky-950/80 text-indigo-950 dark:text-sky-200 font-black border border-indigo-200 dark:border-indigo-800 shadow-2xs'
                            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100/80 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white font-medium border border-transparent'
                        }`}
                      >
                        {/* Submenu Item Content */}
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          {/* Step Number / Completed Badge */}
                          <div className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-black shrink-0 transition-colors ${
                            isActive
                              ? 'bg-indigo-600 text-white shadow-2xs'
                              : step.isCompleted
                              ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                              : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                          }`}>
                            {step.isCompleted ? <CheckCircle2 className="w-3.5 h-3.5" /> : step.stepNum}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className={`text-xs truncate leading-snug ${isActive ? 'font-black text-indigo-950 dark:text-white' : 'font-bold text-slate-800 dark:text-slate-200'}`}>
                              {isRtl ? step.titleAr : step.titleEn}
                            </div>
                            <div className="text-[10px] text-slate-400 dark:text-slate-500 truncate leading-none mt-0.5">
                              {isRtl ? step.descAr : step.descEn}
                            </div>
                          </div>
                        </div>

                        {/* Status / Pill Badge */}
                        <div className="flex items-center gap-1 shrink-0">
                          {step.pill && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded font-black bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                              {step.pill}
                            </span>
                          )}
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold shrink-0 tabular-nums ${
                            step.isCompleted 
                              ? 'text-emerald-800 dark:text-emerald-300 bg-emerald-100/70 dark:bg-emerald-950/50' 
                              : 'text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800'
                          }`}>
                            {step.count}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 3. Bottom Footer Actions: Sleek, compact toolbar */}
      <div className="p-2.5 border-t border-slate-200/90 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-900/90 space-y-2 shrink-0">
        
        {/* AI Advisor Button - Prominent, beautiful gradient */}
        <button
          type="button"
          onClick={onOpenAdvisor}
          className={`w-full rounded-xl flex items-center justify-between px-3 h-10 font-black transition-all cursor-pointer shadow-xs active:scale-[0.99] text-xs ${
            isCollapsed 
              ? 'justify-center px-0 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-slate-800' 
              : 'bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 hover:from-indigo-700 hover:to-purple-800 text-white shadow-indigo-600/20'
          }`}
          title={isRtl ? 'المستشار الذكي (AI Smart Advisor)' : 'AI Smart Advisor'}
        >
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
              <Bot className="w-3.5 h-3.5 text-white" />
            </div>
            {!isCollapsed && (
              <span>{isRtl ? 'المستشار الذكي (AI)' : 'AI Advisor'}</span>
            )}
          </div>
          {!isCollapsed && (
            <div className="flex items-center gap-1 text-[10px] bg-amber-400 text-slate-950 px-1.5 py-0.5 rounded font-black tracking-wider uppercase">
              <Sparkles className="w-3 h-3 text-slate-950" />
              <span>PRO</span>
            </div>
          )}
        </button>

        {/* Compact Utility Toolbar: Templates, Sample Data, Export, Clear */}
        <div className="flex items-center gap-1.5">
          {/* RFP Templates Dropdown */}
          <div className="relative flex-1" ref={templateMenuRef}>
            <button
              type="button"
              onClick={() => setIsTemplateMenuOpen(!isTemplateMenuOpen)}
              className={`w-full h-8 rounded-lg flex items-center justify-center gap-1 text-xs font-bold bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer shadow-2xs ${
                isCollapsed ? 'px-1' : 'px-2'
              }`}
              title={isRtl ? 'نماذج كراسة الشروط RFP' : 'RFP Templates'}
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 shrink-0" />
              {!isCollapsed && <span className="truncate">{isRtl ? 'نماذج' : 'Templates'}</span>}
              {!isCollapsed && <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />}
            </button>

            {isTemplateMenuOpen && (
              <div className={`absolute bottom-full mb-2 ${isRtl ? 'end-0' : 'start-0'} w-72 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150`}>
                <div className="text-xs font-black text-slate-800 dark:text-slate-200 px-2 py-1.5 border-b border-slate-100 dark:border-slate-700 mb-1">
                  {isRtl ? 'اختر نموذجاً قياسياً جاهزاً' : 'Select standard template'}
                </div>
                <div className="space-y-1 max-h-52 overflow-y-auto custom-scrollbar">
                  {PRESET_TEMPLATES.map((rawTmpl) => {
                    const tmpl = localizeTemplate(rawTmpl, language);
                    return (
                      <button
                        key={tmpl.id}
                        type="button"
                        onClick={() => {
                          onSelectPreset(tmpl);
                          setIsTemplateMenuOpen(false);
                        }}
                        className="w-full text-start p-2 rounded-lg hover:bg-sky-50 dark:hover:bg-slate-700/80 text-xs font-bold text-slate-800 dark:text-slate-200 transition-colors flex items-center justify-between gap-2 cursor-pointer"
                      >
                        <span className="truncate">{tmpl.name}</span>
                        <span className="text-[10px] text-sky-900 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/60 px-2 py-0.5 rounded font-mono font-bold shrink-0">
                          {tmpl.requirements.length} {isRtl ? 'بند' : 'reqs'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Load Sample Demo */}
          <button
            type="button"
            onClick={onResetToDemo}
            className={`h-8 rounded-lg flex items-center justify-center gap-1 text-xs font-bold bg-white dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-emerald-900 dark:text-emerald-300 border border-slate-200 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors cursor-pointer shadow-2xs ${
              isCollapsed ? 'w-8' : 'flex-1 px-2'
            }`}
            title={isRtl ? 'تحميل بيانات تجريبية' : 'Load Demo Data'}
          >
            <Building2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            {!isCollapsed && <span className="truncate">{isRtl ? 'تجريبي' : 'Demo'}</span>}
          </button>

          {/* Export Report */}
          <button
            type="button"
            onClick={onOpenExport}
            className={`h-8 rounded-lg flex items-center justify-center gap-1 text-xs font-bold bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer shadow-2xs ${
              isCollapsed ? 'w-8' : 'flex-1 px-2'
            }`}
            title={isRtl ? 'تصدير التقرير والنتائج' : 'Export Report'}
          >
            <Download className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300 shrink-0" />
            {!isCollapsed && <span>{isRtl ? 'تصدير' : 'Export'}</span>}
          </button>

          {/* Clear Data */}
          <button
            type="button"
            onClick={onClearData}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-slate-200 dark:border-slate-700 hover:border-rose-200 dark:hover:border-rose-800 transition-colors cursor-pointer shrink-0 shadow-2xs"
            title={isRtl ? 'مسح وتصفير البيانات' : 'Clear Data'}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside 
        className={`hidden lg:block shrink-0 bg-white dark:bg-slate-900 border-e border-slate-200 dark:border-slate-800 sticky top-0 h-screen transition-all duration-300 z-30 ${
          isCollapsed ? 'w-20' : 'w-80 xl:w-84'
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity" 
            onClick={onCloseMobile} 
          />
          {/* Drawer Container */}
          <div className={`fixed inset-y-0 ${isRtl ? 'right-0' : 'left-0'} max-w-[88vw] w-84 bg-white dark:bg-slate-900 shadow-2xl z-50 animate-in slide-in-from-${isRtl ? 'right' : 'left'} duration-200`}>
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
