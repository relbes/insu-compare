import React, { useState, useRef, useEffect } from 'react';
import { 
  Menu, 
  Globe, 
  Calendar, 
  Award, 
  BarChart3, 
  Calculator, 
  Sparkles,
  ShieldCheck,
  ChevronRight,
  ChevronLeft,
  User,
  LogOut,
  Settings,
  KeyRound,
  ChevronDown,
  Sun,
  Moon,
  FileSpreadsheet,
  FileText,
  CheckSquare,
  Building2,
  Scale,
  Bot
} from 'lucide-react';
import { useI18n } from '../i18n/I18nContext';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { useTheme } from '../context/ThemeContext';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenMobileMenu: () => void;
  onOpenProjectManager?: () => void;
  onOpenExport?: () => void;
  onOpenAdvisor: () => void;
  activeProjectYear?: string;
  activeProjectName?: string;
  proposalsCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenMobileMenu,
  onOpenProjectManager,
  onOpenExport,
  onOpenAdvisor,
  activeProjectYear = '2026 - 2027',
  activeProjectName,
  proposalsCount
}) => {
  const { language, toggleLanguage, isRtl } = useI18n();
  const { isDark, toggleTheme } = useTheme();
  const { 
    user, 
    isAuthenticated, 
    isAdmin, 
    logout, 
    setProfileModalOpen 
  } = useAuth();
  const { settings } = useSettings();

  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const [isNavDropdownOpen, setIsNavDropdownOpen] = useState(false);
  const navDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false);
      }
      if (navDropdownRef.current && !navDropdownRef.current.contains(event.target as Node)) {
        setIsNavDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Quick navigation menu structure
  const menuCategories = [
    {
      key: 'specs',
      categoryTitle: isRtl ? 'الشروط والمواصفات (كراسة العطاء)' : 'Specs & RFP Requirements',
      shortTitle: isRtl ? 'الشروط والمواصفات' : 'Specs & Terms',
      items: [
        { id: 'step1_excel', stepNum: '1', title: isRtl ? 'كشف المنافع الأصلي (Excel)' : 'Original Benefits Schedule', icon: FileSpreadsheet },
        { id: 'step2_rfp', stepNum: '2', title: isRtl ? 'كراسة الشروط والمحددات السعرية' : 'RFP Conditions & Caps', icon: FileText },
        { id: 'step3_binding', stepNum: '3', title: isRtl ? 'المطابقة والربط الذكي بالذكاء الاصطناعي' : 'Smart AI Matching & Binding', icon: Sparkles },
        { id: 'step4_review', stepNum: '4', title: isRtl ? 'مراجعة واعتماد بنود كراسة الشروط' : 'Approved Benefit Requirements', icon: CheckSquare },
      ]
    },
    {
      key: 'analysis',
      categoryTitle: isRtl ? 'عروض الشركات والمفاضلة المالية' : 'Insurer Proposals & Scoring',
      shortTitle: isRtl ? 'عروض الشركات والمفاضلة' : 'Proposals & Scoring',
      items: [
        { id: 'step5_proposals', stepNum: '5', title: isRtl ? 'عروض وأسعار شركات التأمين' : 'Insurer Submitted Proposals', icon: Building2 },
        { id: 'step_actuarial', stepNum: '6', title: isRtl ? 'التقييم المالي وتوزيع الأقساط (40%)' : 'Financial & Actuarial Pricing', icon: Calculator },
        { id: 'step6_tradeoff_matrix', stepNum: '7', title: isRtl ? 'مصفوفة المفاضلة الشاملة (60/40)' : 'Trade-off Comparison Matrix', icon: BarChart3 },
        { id: 'audit', stepNum: '8', title: isRtl ? 'مدقق السقوف وقواعد الالتزام' : 'Compliance & Cap Audit', icon: ShieldCheck },
      ]
    },
    {
      key: 'decision',
      categoryTitle: isRtl ? 'قرار الترسية والتقارير المعتمدة' : 'Final Award & Reports',
      shortTitle: isRtl ? 'قرار الترسية والتقارير' : 'Award & Reports',
      items: [
        { id: 'step_reports', stepNum: '9', title: isRtl ? 'التقرير النهائي وقرار الترسية المعتمد (390 علامة)' : 'Final Award Report (390 Pts)', icon: Award },
      ]
    },
    {
      key: 'admin',
      categoryTitle: isRtl ? 'إدارة النظام والتحكم المؤسسي' : 'System Administration',
      shortTitle: isRtl ? 'إدارة النظام' : 'Admin Panel',
      items: [
        { id: 'admin', stepNum: '⚙', title: isRtl ? 'لوحة إدارة النظام والمستخدمين والذكاء الاصطناعي' : 'Admin Panel & AI Engine', icon: Settings },
      ]
    }
  ];

  // Normalize current tab name
  const normalizedCurrentTab = 
    activeTab === 'requirements' ? 'step4_review' :
    activeTab === 'proposals' ? 'step5_proposals' :
    activeTab === 'rankings' ? 'step6_tradeoff_matrix' :
    activeTab === 'actuarial' ? 'step_actuarial' :
    activeTab === 'reports' ? 'step_reports' :
    activeTab;

  // View title helper mapping tabs to Main Menu and Sub-Menu names
  const getViewTitle = () => {
    switch (normalizedCurrentTab) {
      case 'step1_excel':
        return {
          mainMenu: isRtl ? 'الشروط والمواصفات' : 'Specs & Terms',
          stepNum: '1',
          stepBadge: isRtl ? 'خطوة 1' : 'Step 1',
          title: isRtl ? 'كشف المنافع الأصلي (Excel)' : 'Original Benefits Schedule',
          desc: isRtl ? 'جدول المنافع والتغطيات الطبية' : 'Benefits & Coverage Table',
          icon: FileSpreadsheet,
          color: 'text-sky-600 dark:text-sky-400',
          bgColor: 'bg-sky-50 dark:bg-sky-950/60 border-sky-200 dark:border-sky-800'
        };
      case 'step2_rfp':
        return {
          mainMenu: isRtl ? 'الشروط والمواصفات' : 'Specs & Terms',
          stepNum: '2',
          stepBadge: isRtl ? 'خطوة 2' : 'Step 2',
          title: isRtl ? 'كراسة الشروط والمحددات السعرية' : 'RFP Conditions & Caps',
          desc: isRtl ? 'الشروط التعاقدية والسقوف المالية' : 'Rules & Financial Limits',
          icon: FileText,
          color: 'text-sky-600 dark:text-sky-400',
          bgColor: 'bg-sky-50 dark:bg-sky-950/60 border-sky-200 dark:border-sky-800'
        };
      case 'step3_binding':
        return {
          mainMenu: isRtl ? 'الشروط والمواصفات' : 'Specs & Terms',
          stepNum: '3',
          stepBadge: isRtl ? 'خطوة 3' : 'Step 3',
          title: isRtl ? 'المطابقة والربط الذكي بالذكاء الاصطناعي' : 'Smart AI Matching & Binding',
          desc: isRtl ? 'اقتران الشروط بالمنافع آلياً' : 'Automated Semantic Binding',
          icon: Sparkles,
          color: 'text-purple-600 dark:text-purple-400',
          bgColor: 'bg-purple-50 dark:bg-purple-950/60 border-purple-200 dark:border-purple-800'
        };
      case 'step4_review':
        return {
          mainMenu: isRtl ? 'الشروط والمواصفات' : 'Specs & Terms',
          stepNum: '4',
          stepBadge: isRtl ? 'خطوة 4' : 'Step 4',
          title: isRtl ? 'مراجعة واعتماد بنود كراسة الشروط' : 'Approved Benefit Requirements',
          desc: isRtl ? 'الاعتماد النهائي لمعايير التقييم' : 'Final Validated Criteria',
          icon: CheckSquare,
          color: 'text-sky-600 dark:text-sky-400',
          bgColor: 'bg-sky-50 dark:bg-sky-950/60 border-sky-200 dark:border-sky-800'
        };
      case 'step5_proposals':
        return {
          mainMenu: isRtl ? 'عروض الشركات والمفاضلة' : 'Proposals & Scoring',
          stepNum: '5',
          stepBadge: isRtl ? 'خطوة 5' : 'Step 5',
          title: isRtl ? 'عروض وأسعار شركات التأمين' : 'Insurer Submitted Proposals',
          desc: isRtl ? 'تفريغ عروض وأسعار شركات التأمين' : 'Insurer Premium Proposals',
          icon: Building2,
          color: 'text-indigo-600 dark:text-indigo-400',
          bgColor: 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-200 dark:border-indigo-800'
        };
      case 'step_actuarial':
        return {
          mainMenu: isRtl ? 'عروض الشركات والمفاضلة' : 'Proposals & Scoring',
          stepNum: '6',
          stepBadge: isRtl ? 'خطوة 6' : 'Step 6',
          title: isRtl ? 'التقييم المالي وتوزيع الأقساط (40%)' : 'Financial & Actuarial Pricing',
          desc: isRtl ? 'حساب الأقساط وتوزيع الفئات العمرية' : 'Demographic Census & Premium Calculation',
          icon: Calculator,
          color: 'text-emerald-600 dark:text-emerald-400',
          bgColor: 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800'
        };
      case 'step6_tradeoff_matrix':
        return {
          mainMenu: isRtl ? 'عروض الشركات والمفاضلة' : 'Proposals & Scoring',
          stepNum: '7',
          stepBadge: isRtl ? 'خطوة 7' : 'Step 7',
          title: isRtl ? 'مصفوفة المفاضلة الشاملة (60% فني + 40% مالي)' : 'Trade-off Comparison Matrix (60/40)',
          desc: isRtl ? 'المقارنة الفنية والمالية المتكاملة' : 'Integrated Technical & Financial Scoring',
          icon: BarChart3,
          color: 'text-indigo-600 dark:text-indigo-400',
          bgColor: 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-200 dark:border-indigo-800'
        };
      case 'audit':
        return {
          mainMenu: isRtl ? 'عروض الشركات والمفاضلة' : 'Proposals & Scoring',
          stepNum: '8',
          stepBadge: isRtl ? 'مدقق الالتزام' : 'Compliance Audit',
          title: isRtl ? 'مدقق السقوف وقواعد الالتزام وعدم منح البونص' : 'Cap Audit & Strict No-Bonus Inspector',
          desc: isRtl ? 'فحص الالتزام بالسقوف ومنع تجاوز 100%' : '100% Ceiling Enforcement',
          icon: ShieldCheck,
          color: 'text-rose-600 dark:text-rose-400',
          bgColor: 'bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800'
        };
      case 'step_reports':
        return {
          mainMenu: isRtl ? 'قرار الترسية والتقارير' : 'Award & Reports',
          stepNum: '9',
          stepBadge: isRtl ? 'التقرير النهائي' : 'Final Report',
          title: isRtl ? 'التقرير النهائي وقرار الترسية المعتمد (390 علامة)' : 'Final Award Report (390 Pts)',
          desc: isRtl ? 'المذكرة الشاملة وتوصية الترسية المعتمدة' : 'Award Memo & Recommended Insurer',
          icon: Award,
          color: 'text-amber-600 dark:text-amber-400',
          bgColor: 'bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800'
        };
      case 'admin':
        return {
          mainMenu: isRtl ? 'إدارة النظام' : 'Admin Panel',
          stepNum: '⚙',
          stepBadge: isRtl ? 'لوحة التحكم' : 'Admin',
          title: isRtl ? 'لوحة إدارة النظام والمستخدمين والذكاء الاصطناعي' : 'Admin Panel & AI Engine',
          desc: isRtl ? 'صلاحيات المستخدمين، مفاتيح AI، وإعدادات العطاء' : 'User roles, AI keys & settings',
          icon: Settings,
          color: 'text-violet-600 dark:text-violet-400',
          bgColor: 'bg-violet-50 dark:bg-violet-950/60 border-violet-200 dark:border-violet-800'
        };
      default:
        return {
          mainMenu: isRtl ? 'المناقصة' : 'Tender',
          stepNum: '•',
          stepBadge: isRtl ? 'نشط' : 'Active',
          title: isRtl ? 'منصة تقييم عروض التأمين الطبي' : 'Medical Insurance Tender Evaluation',
          desc: isRtl ? 'المنظومة الذكية لمفاضلة وترسية العطاءات' : 'Smart Evaluation System',
          icon: Award,
          color: 'text-sky-600 dark:text-sky-400',
          bgColor: 'bg-sky-50 dark:bg-sky-950/60 border-sky-200 dark:border-sky-800'
        };
    }
  };

  const viewMeta = getViewTitle();
  const IconComp = viewMeta.icon;

  return (
    <header className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/90 dark:border-slate-800 sticky top-0 z-30 shadow-xs transition-colors">
      <div className="w-full px-3 sm:px-5 lg:px-7 h-16 sm:h-[68px] flex items-center justify-between gap-3 sm:gap-4 lg:gap-6">
        
        {/* ======================================================================= */}
        {/* 1. RIGHT SECTION (Start in RTL): Page Icon + Step Indicator + Page Title */}
        {/* ======================================================================= */}
        <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0 shrink">
          {/* Mobile Drawer Toggle Button */}
          <button
            type="button"
            onClick={onOpenMobileMenu}
            className="lg:hidden w-9 h-9 rounded-xl flex items-center justify-center text-slate-700 dark:text-slate-200 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 cursor-pointer shrink-0 transition-colors shadow-2xs"
            title={isRtl ? 'فتح القائمة الرئيسية والفرعية' : 'Open Menu'}
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Page Icon */}
          <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center shrink-0 border shadow-2xs transition-transform hover:scale-105 ${viewMeta.bgColor} ${viewMeta.color}`}>
            <IconComp className="w-5 h-5 sm:w-5.5 sm:h-5.5" />
          </div>

          {/* Title & Hierarchy Block with Dropdown */}
          <div className="relative min-w-0 flex flex-col justify-center" ref={navDropdownRef}>
            {/* Category Breadcrumb (Changes dynamically based on active menu & page) */}
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 dark:text-slate-400 leading-none mb-1">
              <button
                type="button"
                onClick={() => setIsNavDropdownOpen(!isNavDropdownOpen)}
                className="inline-flex items-center gap-1 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer group"
                title={isRtl ? 'اضغط لتبديل القائمة والصفحة' : 'Click to switch menu & page'}
              >
                <span className="font-extrabold text-slate-600 dark:text-slate-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  {viewMeta.mainMenu}
                </span>
                <ChevronDown className={`w-3 h-3 text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-transform duration-200 ${isNavDropdownOpen ? 'rotate-180 text-indigo-600' : ''}`} />
              </button>
            </div>

            {/* Step Badge & Page Title on the primary baseline */}
            <div className="flex items-center gap-2 min-w-0">
              <span className="inline-flex items-center px-2 py-0.5 rounded-md font-mono text-[10px] sm:text-[11px] font-black bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800/80 shrink-0 shadow-2xs">
                {viewMeta.stepBadge}
              </span>
              <h1 className="text-sm sm:text-base lg:text-[17px] font-black text-slate-900 dark:text-white leading-tight tracking-tight truncate max-w-[260px] sm:max-w-[360px] md:max-w-[460px] lg:max-w-[540px] xl:max-w-none">
                {viewMeta.title}
              </h1>
            </div>

            {/* Quick Menu & Page Navigation Dropdown */}
            {isNavDropdownOpen && (
              <div className={`absolute top-full ${isRtl ? 'right-0' : 'left-0'} mt-2 w-80 sm:w-96 max-h-[75vh] overflow-y-auto bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-2.5 z-50 animate-in fade-in zoom-in-95 duration-150`}>
                <div className="px-2.5 py-2 mb-2 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                    <span className="text-xs font-black text-slate-900 dark:text-white">
                      {isRtl ? 'التنقل السريع وتغيير الصفحة' : 'Quick Menu Navigation'}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium">
                    {isRtl ? 'انقر للذهاب فوراً' : 'Click to jump'}
                  </span>
                </div>

                <div className="space-y-3">
                  {menuCategories.map((cat) => (
                    <div key={cat.key} className="space-y-1">
                      <div className="px-2 py-0.5 text-[11px] font-black text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0"></span>
                        <span className="truncate">{cat.categoryTitle}</span>
                      </div>
                      <div className="space-y-0.5">
                        {cat.items.map((item) => {
                          const isCurrent = normalizedCurrentTab === item.id;
                          const ItemIcon = item.icon;
                          return (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => {
                                setActiveTab(item.id);
                                setIsNavDropdownOpen(false);
                              }}
                              className={`w-full text-start px-2.5 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-2.5 cursor-pointer ${
                                isCurrent
                                  ? 'bg-indigo-600 text-white shadow-xs'
                                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-950 dark:hover:text-white'
                              }`}
                            >
                              <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 text-[10px] font-black ${
                                isCurrent
                                  ? 'bg-white/20 text-white'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                              }`}>
                                <ItemIcon className="w-3.5 h-3.5" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="truncate font-black">{item.title}</div>
                              </div>
                              <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold shrink-0 ${
                                isCurrent
                                  ? 'bg-white/20 text-white'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                              }`}>
                                {item.stepNum === '⚙' ? (isRtl ? 'نظام' : 'Admin') : (isRtl ? `خطوة ${item.stepNum}` : `Step ${item.stepNum}`)}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ======================================================================= */}
        {/* 2. CENTER SECTION: Criteria Badge + Year Selector + AI Consultant Button */}
        {/* ======================================================================= */}
        <div className="flex items-center justify-center gap-2 sm:gap-3 shrink-0">
          {/* Approved Criteria Badge (60% Tech + 40% Fin) */}
          <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100/90 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 shadow-2xs shrink-0">
            <Scale className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
            <span className="hidden 2xl:inline text-slate-500 dark:text-slate-400 font-medium">
              {isRtl ? 'المعيار المعتمد:' : 'Criteria:'}
            </span>
            <span className="font-mono font-black text-indigo-700 dark:text-indigo-300">
              {isRtl ? '60% فني + 40% مالي' : '60% Tech + 40% Fin'}
            </span>
          </div>

          {/* Academic / Tender Year Selector */}
          {onOpenProjectManager && (
            <button
              type="button"
              onClick={onOpenProjectManager}
              className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 hover:text-slate-950 dark:hover:text-white bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-all cursor-pointer shadow-2xs shrink-0"
              title={isRtl ? 'إدارة وتبديل سنوات العطاءات' : 'Switch Tender Year'}
            >
              <Calendar className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400 shrink-0" />
              <span dir="ltr" className="font-mono font-black">{activeProjectYear}</span>
            </button>
          )}

          {/* AI Consultant Button - Elegant Purple Action */}
          <button
            type="button"
            onClick={onOpenAdvisor}
            className="h-9 inline-flex items-center justify-center gap-2 px-3 sm:px-3.5 rounded-xl text-xs font-black text-white bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 hover:from-indigo-700 hover:to-purple-800 transition-all cursor-pointer shadow-xs active:scale-95 shrink-0"
            title={isRtl ? 'المستشار الذكي (AI Smart Advisor)' : 'AI Smart Advisor'}
          >
            <Bot className="w-4 h-4 text-white shrink-0" />
            <span className="hidden sm:inline font-bold">{isRtl ? 'المستشار الذكي' : 'AI Advisor'}</span>
            <span className="text-[9px] bg-amber-400 text-slate-950 px-1 py-0.5 rounded font-black uppercase tracking-wider">
              AI
            </span>
          </button>
        </div>

        {/* ======================================================================= */}
        {/* 3. LEFT SECTION (End in RTL): Theme + Language + Profile Menu           */}
        {/* ======================================================================= */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          {/* Dark / Light Mode Switcher */}
          <button
            type="button"
            onClick={toggleTheme}
            className="h-9 w-9 inline-flex items-center justify-center rounded-xl text-slate-700 dark:text-slate-200 bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-all cursor-pointer shadow-2xs active:scale-95 shrink-0"
            title={isDark ? (isRtl ? 'التبديل إلى الوضع النهاري' : 'Switch to Light Mode') : (isRtl ? 'التبديل إلى الوضع الليلي' : 'Switch to Dark Mode')}
          >
            {isDark ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-slate-700 dark:text-slate-300" />
            )}
          </button>

          {/* Language Switcher */}
          <button
            type="button"
            onClick={toggleLanguage}
            className="h-9 inline-flex items-center justify-center gap-1.5 px-2.5 sm:px-3 rounded-xl text-xs font-bold text-sky-950 dark:text-sky-200 bg-sky-50 hover:bg-sky-100 dark:bg-sky-950/60 dark:hover:bg-sky-900/80 border border-sky-300/80 dark:border-sky-800 transition-all cursor-pointer shadow-2xs active:scale-95 shrink-0"
            title="Switch Language / تبديل اللغة"
          >
            <Globe className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400 shrink-0" />
            <span className="font-black">{language === 'en' ? 'العربية' : 'EN'}</span>
          </button>

          {/* User Profile & Account Menu */}
          {isAuthenticated && user && (
            <div className="relative shrink-0" ref={userMenuRef}>
              <button
                type="button"
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="h-9 inline-flex items-center gap-2 px-2 sm:px-2.5 rounded-xl bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-slate-100 transition-all cursor-pointer shadow-2xs"
              >
                <div className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-xs font-black shadow-2xs shrink-0">
                  {user.name.charAt(0)}
                </div>
                <span className="hidden xl:inline max-w-[110px] truncate">{user.name}</span>
                <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
              </button>

              {userDropdownOpen && (
                <div className="absolute top-full mt-2 ltr:right-0 rtl:left-0 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-3 py-2.5 border-b border-slate-100 dark:border-slate-800">
                    <div className="text-xs font-black text-slate-900 dark:text-white truncate">{user.name}</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono truncate">@{user.username}</div>
                    <div className="mt-1.5 flex items-center gap-1.5">
                      <span className="inline-block text-[10px] font-black px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                        {user.role}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {isRtl ? 'عضو لجنة' : 'Committee Member'}
                      </span>
                    </div>
                  </div>

                  <div className="py-1 space-y-0.5">
                    <button
                      type="button"
                      onClick={() => {
                        setProfileModalOpen(true);
                        setUserDropdownOpen(false);
                      }}
                      className="w-full text-start px-3 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 cursor-pointer transition-colors"
                    >
                      <User className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      <span>{isRtl ? 'الملف الشخصي وتعديل الحساب' : 'My Profile & Details'}</span>
                    </button>

                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => {
                          setActiveTab('admin');
                          setUserDropdownOpen(false);
                        }}
                        className="w-full text-start px-3 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 cursor-pointer transition-colors"
                      >
                        <Settings className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                        <span>{isRtl ? 'لوحة إدارة النظام والإعدادات' : 'Admin Panel & Settings'}</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        logout();
                        setUserDropdownOpen(false);
                      }}
                      className="w-full text-start px-3 py-2 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 flex items-center gap-2 cursor-pointer transition-colors"
                    >
                      <LogOut className="w-4 h-4 text-rose-500 dark:text-rose-400" />
                      <span>{isRtl ? 'تسجيل الخروج' : 'Sign Out'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </header>
  );
};
