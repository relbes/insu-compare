import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { SidebarNav } from './components/SidebarNav';
import { StepProgressNav } from './components/StepProgressNav';
import { ClarificationQABox } from './components/ClarificationQABox';
import { Step1ExcelBenefits } from './components/Step1ExcelBenefits';
import { Step2RfpConditions } from './components/Step2RfpConditions';
import { Step3AiBinding } from './components/Step3AiBinding';
import { RequirementsManager } from './components/RequirementsManager';
import { ProposalsManager } from './components/ProposalsManager';
import { RankingsDashboard } from './components/RankingsDashboard';
import { CapAuditInspector } from './components/CapAuditInspector';
import { ExportReportModal } from './components/ExportReportModal';
import { AiAdvisorModal } from './components/AiAdvisorModal';
import { ProjectYearManager } from './components/ProjectYearManager';
import { ActuarialPricingCalculator } from './components/ActuarialPricingCalculator';
import { TenderEvaluationReportsView } from './components/TenderEvaluationReportsView';
import { AdminPanel } from './components/AdminPanel';
import { LoginModal } from './components/LoginModal';
import { ChangePasswordModal } from './components/ChangePasswordModal';
import { UserProfileModal } from './components/UserProfileModal';
import { LoginGateway } from './components/LoginGateway';
import { Footer } from './components/Footer';
import { checkStepNavigation } from './utils/stepGuard';
import { 
  CORPORATE_HEALTH_TEMPLATE, 
  DEMO_COMPANY_PROPOSALS 
} from './data/presetData';
import { DEFAULT_SINGLE_COLUMN_BENEFITS } from './utils/excelParser';
import { DEFAULT_DEMOGRAPHIC_CENSUS, syncProposalsWithCensus } from './utils/actuarialCalculator';
import { BenefitRequirement, CompanyProposal, PresetTemplate, TenderProject, DemographicCensus } from './types';
import { useI18n } from './i18n/I18nContext';
import { useAuth } from './context/AuthContext';
import { 
  localizeRequirements, 
  localizeProposals, 
  localizeProject, 
  localizeTemplate,
  PROJECT_TRANSLATIONS 
} from './utils/bilingualData';

const DEFAULT_INITIAL_PROJECTS: TenderProject[] = [
  {
    id: 'proj_2025_2026',
    year: '2025 - 2026',
    name: 'مناقصة التأمين الطبي لمنسوبي الجامعة 2025-2026',
    description: 'المشروع النشط للعام الحالي لمقارنة عروض شركات التأمين',
    excelBenefits: DEFAULT_SINGLE_COLUMN_BENEFITS,
    excelFileName: 'مقارنة شركات التامين للعاملين.xlsx',
    conditionsText: `كراسة الشروط والمواصفات ومحددات السقوف لبرنامج التأمين الطبي لمنسوبي الجامعة:
١. نماذج وكشوفات العيادات الخارجية: يجب ألا يقل عدد نماذج/زيارات الكشف الطبي عن 8 نماذج كشف سنوياً للموظف والتابع كحد أدنى إلزامي (أي شركة تقدم 8 نماذج أو أكثر تحصل على الدرجة الكاملة 5/5 دون أي بونص إضافي).
٢. سقف التغطية السنوية لكل شخص: الحد الأقصى للتغطية السنوية الإجمالية هو 150,000 ريال سعودي لكل عضو سنوياً كحد أدنى مطلوب.
٣. نسبة التحمل في العيادات الخارجية: الحد الأقصى لنسبة تحمل الموظف في العيادات الخارجية هو 10% فقط وبحد أقصى 50 ريال للاستشارة.
٤. الإقامة في المستشفيات وفئة غرفة التنويم: غرفة مفردة خاصة (Private Single Room) مع تغطية كاملة لمرافق المريض للأعمار تحت 12 سنة.
٥. العناية المركزة وحالات الطوارئ: تغطية بنسبة 100% بدون أي فترات انتظار ودون اشتراط موافقة مسبقة في الطوارئ.
٦. الأدوية والعلاجات الصيدلانية: سقف سنوي 5,000 ريال للأدوية مع تغطية كاملة للأمراض المزمنة دون شروط إضافية.
٧. علاج وجراحة الأسنان: سقف 3,000 ريال سنوياً شامل الحشوات وتنظيف الأسنان وعلاج الجذور وخلع الأسنان.
٨. النظارات الطبية والإطارات البصرية: مخصص 800 ريال كل سنتين للإطارات والعدسات الطبية.
٩. تغطية الأمومة والولادة ورعاية المواليد: سقف 20,000 ريال للولادة الطبيعية والقيصرية ومضاعفات الحمل.
١٠. الشبكة الطبية المعتمدة: شبكة الفئة الأولى الممتازة (Tier 1 Prime) تشمل كبرى المستشفيات والمراكز التخصصية.`,
    conditionsFileName: 'كراسة شروط ومواصفات التأمين الطبي للجامعة (معتمدة)',
    conditionsFileBase64: null,
    conditionsMimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    requirements: CORPORATE_HEALTH_TEMPLATE.requirements,
    proposals: DEMO_COMPANY_PROPOSALS,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'proj_2024_2025',
    year: '2024 - 2025',
    name: 'مناقصة التأمين الطبي (أرشيف 2024)',
    description: 'أرشيف السنة السابقة للمقارنة والرجوع',
    excelBenefits: [],
    excelFileName: '',
    conditionsText: 'كراسة شروط ومواصفات مناقصة عام 2024 السابقة...',
    conditionsFileName: '',
    conditionsFileBase64: null,
    conditionsMimeType: '',
    requirements: [],
    proposals: [],
    createdAt: new Date(Date.now() - 365 * 24 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 365 * 24 * 3600 * 1000).toISOString()
  }
];

export default function App() {
  const { isAuthenticated } = useAuth();
  const { t, isRtl, language } = useI18n();
  const [activeTab, setActiveTab] = useState<string>('step1_excel');

  // Multi-Year Project Architecture
  const [projects, setProjects] = useState<TenderProject[]>(() => {
    const saved = localStorage.getItem('insur_tender_projects');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch {}
    }
    return DEFAULT_INITIAL_PROJECTS;
  });

  const [activeProjectId, setActiveProjectId] = useState<string>(() => {
    const saved = localStorage.getItem('insur_active_project_id');
    if (saved) return saved;
    return 'proj_2025_2026';
  });

  const [isProjectManagerModalOpen, setIsProjectManagerModalOpen] = useState(false);
  const [editingProjectIdForModal, setEditingProjectIdForModal] = useState<string | null>(null);

  const handleOpenEditProject = (projectId?: string) => {
    setEditingProjectIdForModal(projectId || activeProjectId);
    setIsProjectManagerModalOpen(true);
  };

  // Active project reference
  const activeProject = projects.find(p => p.id === activeProjectId) || projects[0] || DEFAULT_INITIAL_PROJECTS[0];

  // Step 1: Excel Benefits state
  const [excelBenefits, setExcelBenefits] = useState<BenefitRequirement[]>(() => {
    return activeProject?.excelBenefits || DEFAULT_SINGLE_COLUMN_BENEFITS;
  });

  // Step 2: RFP Conditions Text & Files state
  const [conditionsText, setConditionsText] = useState<string>(() => {
    return activeProject?.conditionsText || '';
  });
  const [conditionsFileName, setConditionsFileName] = useState<string>(() => {
    return activeProject?.conditionsFileName || 'كراسة شروط ومواصفات التأمين الطبي للجامعة (معتمدة)';
  });
  const [conditionsFileBase64, setConditionsFileBase64] = useState<string | null>(null);
  const [conditionsMimeType, setConditionsMimeType] = useState<string>('application/vnd.openxmlformats-officedocument.wordprocessingml.document');

  // Step 4: Approved Requirements used across the platform
  const [requirements, setRequirements] = useState<BenefitRequirement[]>(() => {
    return activeProject?.requirements || CORPORATE_HEALTH_TEMPLATE.requirements;
  });

  // Actuarial Demographic Census (256 Beneficiaries) state
  const [census, setCensus] = useState<DemographicCensus>(() => {
    return activeProject?.census || DEFAULT_DEMOGRAPHIC_CENSUS;
  });

  // Step 5: Insurer Proposals state - Synchronized with actuarial pricing and census
  const [proposals, setProposals] = useState<CompanyProposal[]>(() => {
    const raw = activeProject?.proposals || DEMO_COMPANY_PROPOSALS;
    const projectCensus = activeProject?.census || DEFAULT_DEMOGRAPHIC_CENSUS;
    return syncProposalsWithCensus(raw, projectCensus);
  });

  const [isExportOpen, setIsExportOpen] = useState<boolean>(false);
  const [isAiAdvisorOpen, setIsAiAdvisorOpen] = useState<boolean>(false);
  const [showClearConfirmModal, setShowClearConfirmModal] = useState<boolean>(false);
  const [showDemoModal, setShowDemoModal] = useState<boolean>(false);
  const [showClearRequirementsModal, setShowClearRequirementsModal] = useState<boolean>(false);
  const [showClearProposalsModal, setShowClearProposalsModal] = useState<boolean>(false);

  // Sidebar navigation states
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('insur_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });
  const [isMobileNavOpen, setIsMobileNavOpen] = useState<boolean>(false);

  useEffect(() => {
    try {
      localStorage.setItem('insur_sidebar_collapsed', isSidebarCollapsed.toString());
    } catch {}
  }, [isSidebarCollapsed]);

  // Synchronize language changes across live requirements, excel benefits, proposals, and projects
  useEffect(() => {
    setRequirements(prev => localizeRequirements(prev, language));
    setExcelBenefits(prev => localizeRequirements(prev, language));
    setProposals(prev => localizeProposals(prev, language));
    setProjects(prevProjects => {
      const updated = prevProjects.map(proj => localizeProject(proj, language));
      try {
        localStorage.setItem('insur_tender_projects', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    const activeTrans = PROJECT_TRANSLATIONS[activeProjectId];
    if (activeTrans) {
      setConditionsFileName(language === 'en' ? activeTrans.conditionsFileNameEn : activeTrans.conditionsFileNameAr);
      if (!conditionsFileBase64) {
        setConditionsText(language === 'en' ? activeTrans.conditionsTextEn : activeTrans.conditionsTextAr);
      }
    }
  }, [language]);

  // Synchronize state with current active project whenever activeProjectId or data changes
  const handleSelectProject = (projectId: string) => {
    if (projectId === activeProjectId) return;

    // Save current active state before switching
    setProjects(prevProjects => {
      const updated = prevProjects.map(p => {
        if (p.id === activeProjectId) {
          return {
            ...p,
            excelBenefits,
            conditionsText,
            conditionsFileName,
            conditionsFileBase64,
            conditionsMimeType,
            requirements,
            proposals,
            census,
            updatedAt: new Date().toISOString()
          };
        }
        return p;
      });
      localStorage.setItem('insur_tender_projects', JSON.stringify(updated));
      return updated;
    });

    const target = projects.find(p => p.id === projectId);
    if (target) {
      const locTarget = localizeProject(target, language);
      setActiveProjectId(locTarget.id);
      localStorage.setItem('insur_active_project_id', locTarget.id);
      setExcelBenefits(locTarget.excelBenefits || []);
      setConditionsText(locTarget.conditionsText || '');
      setConditionsFileName(locTarget.conditionsFileName || '');
      setConditionsFileBase64(locTarget.conditionsFileBase64 || null);
      setConditionsMimeType(locTarget.conditionsMimeType || '');
      setRequirements(locTarget.requirements || []);
      setProposals(locTarget.proposals || []);
      setCensus(locTarget.census || DEFAULT_DEMOGRAPHIC_CENSUS);
    }
  };

  const handleUpdateCensus = (newCensus: DemographicCensus) => {
    setCensus(newCensus);
    const synced = syncProposalsWithCensus(proposals, newCensus);
    setProposals(synced);
    setProjects(prev => {
      const next = prev.map(p => p.id === activeProjectId ? { 
        ...p, 
        census: newCensus, 
        proposals: synced,
        updatedAt: new Date().toISOString() 
      } : p);
      localStorage.setItem('insur_tender_projects', JSON.stringify(next));
      return next;
    });
  };

  const handleUpdateExcelBenefits = (newBenefits: BenefitRequirement[]) => {
    setExcelBenefits(newBenefits);
    setProjects(prev => {
      const next = prev.map(p => p.id === activeProjectId ? { ...p, excelBenefits: newBenefits, updatedAt: new Date().toISOString() } : p);
      localStorage.setItem('insur_tender_projects', JSON.stringify(next));
      return next;
    });
  };

  const handleUpdateConditionsText = (text: string) => {
    setConditionsText(text);
    setProjects(prev => {
      const next = prev.map(p => p.id === activeProjectId ? { ...p, conditionsText: text, updatedAt: new Date().toISOString() } : p);
      localStorage.setItem('insur_tender_projects', JSON.stringify(next));
      return next;
    });
  };

  const handleUpdateRequirements = (newReqs: BenefitRequirement[]) => {
    setRequirements(newReqs);
    setProjects(prev => {
      const next = prev.map(p => p.id === activeProjectId ? { ...p, requirements: newReqs, updatedAt: new Date().toISOString() } : p);
      localStorage.setItem('insur_tender_projects', JSON.stringify(next));
      return next;
    });
  };

  const handleUpdateProposals = (newProposals: CompanyProposal[]) => {
    setProposals(newProposals);
    setProjects(prev => {
      const next = prev.map(p => p.id === activeProjectId ? { ...p, proposals: newProposals, updatedAt: new Date().toISOString() } : p);
      localStorage.setItem('insur_tender_projects', JSON.stringify(next));
      return next;
    });
  };

  const handleToggleExcludeProposal = (proposalId: string) => {
    const updated = proposals.map(p => {
      if (p.id === proposalId) {
        const isExcludedNow = !p.isExcluded;
        return {
          ...p,
          isExcluded: isExcludedNow,
          excludedReason: isExcludedNow ? 'مستثنى بقرار لجنة العطاءات من شاشة التقييم المالي' : undefined
        };
      }
      return p;
    });
    handleUpdateProposals(updated);
  };

  const handleCreateProject = (
    newProjData: Omit<TenderProject, 'id' | 'createdAt' | 'updatedAt'>,
    cloneFromId?: string
  ) => {
    const newId = `proj_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    let initialBenefits: BenefitRequirement[] = [];
    let initialConditionsText = '';
    let initialConditionsFileName = '';
    let initialRequirements: BenefitRequirement[] = [];
    let initialProposals: CompanyProposal[] = [];

    if (cloneFromId) {
      const source = projects.find(p => p.id === cloneFromId);
      if (source) {
        initialBenefits = JSON.parse(JSON.stringify(source.excelBenefits || []));
        initialConditionsText = source.conditionsText || '';
        initialConditionsFileName = source.conditionsFileName || '';
        initialRequirements = JSON.parse(JSON.stringify(source.requirements || []));
        initialProposals = JSON.parse(JSON.stringify(source.proposals || []));
      }
    }

    const newProject: TenderProject = {
      id: newId,
      year: newProjData.year,
      name: newProjData.name,
      description: newProjData.description,
      excelBenefits: initialBenefits,
      excelFileName: newProjData.excelFileName || '',
      conditionsText: initialConditionsText,
      conditionsFileName: initialConditionsFileName,
      conditionsFileBase64: null,
      conditionsMimeType: '',
      requirements: initialRequirements,
      proposals: initialProposals,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Save current active project first
    const updatedProjects = projects.map(p => {
      if (p.id === activeProjectId) {
        return {
          ...p,
          excelBenefits,
          conditionsText,
          conditionsFileName,
          conditionsFileBase64,
          conditionsMimeType,
          requirements,
          proposals,
          updatedAt: new Date().toISOString()
        };
      }
      return p;
    });

    const allProjects = [...updatedProjects, newProject];
    setProjects(allProjects);
    localStorage.setItem('insur_tender_projects', JSON.stringify(allProjects));

    setActiveProjectId(newId);
    localStorage.setItem('insur_active_project_id', newId);

    setExcelBenefits(initialBenefits);
    setConditionsText(initialConditionsText);
    setConditionsFileName(initialConditionsFileName);
    setConditionsFileBase64(null);
    setConditionsMimeType('');
    setRequirements(initialRequirements);
    setProposals(initialProposals);

    setActiveTab('step1_excel');
  };

  const handleUpdateProject = (projectId: string, updates: Partial<TenderProject>) => {
    setProjects(prev => {
      const next = prev.map(p => p.id === projectId ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p);
      localStorage.setItem('insur_tender_projects', JSON.stringify(next));
      return next;
    });
  };

  const handleDeleteProject = (projectId: string) => {
    if (projects.length <= 1) return;
    const remaining = projects.filter(p => p.id !== projectId);
    setProjects(remaining);
    localStorage.setItem('insur_tender_projects', JSON.stringify(remaining));

    if (activeProjectId === projectId) {
      const nextActive = remaining[0];
      setActiveProjectId(nextActive.id);
      localStorage.setItem('insur_active_project_id', nextActive.id);
      setExcelBenefits(nextActive.excelBenefits || []);
      setConditionsText(nextActive.conditionsText || '');
      setConditionsFileName(nextActive.conditionsFileName || '');
      setConditionsFileBase64(nextActive.conditionsFileBase64 || null);
      setConditionsMimeType(nextActive.conditionsMimeType || '');
      setRequirements(nextActive.requirements || []);
      setProposals(nextActive.proposals || []);
    }
  };

  const handleSelectTabSafely = (targetTab: string) => {
    setActiveTab(targetTab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleResetToDemo = () => {
    setShowDemoModal(true);
  };

  const handleExecuteResetToDemo = () => {
    handleUpdateExcelBenefits(localizeRequirements(DEFAULT_SINGLE_COLUMN_BENEFITS, language));
    handleUpdateRequirements(localizeRequirements(CORPORATE_HEALTH_TEMPLATE.requirements, language));
    handleUpdateProposals(localizeProposals(DEMO_COMPANY_PROPOSALS, language));
    setActiveTab('step6_tradeoff_matrix');
    setShowDemoModal(false);
  };

  const handleExecuteClearAll = () => {
    handleUpdateExcelBenefits([]);
    handleUpdateConditionsText('');
    setConditionsFileName('');
    setConditionsFileBase64(null);
    handleUpdateRequirements([]);
    handleUpdateProposals([]);
    setShowClearConfirmModal(false);
    setActiveTab('step1_excel');
  };

  const handleClearAllData = () => {
    setShowClearConfirmModal(true);
  };

  const handleClearRequirementsOnly = () => {
    setShowClearRequirementsModal(true);
  };

  const handleExecuteClearRequirements = () => {
    handleUpdateRequirements([]);
    handleUpdateExcelBenefits([]);
    setShowClearRequirementsModal(false);
  };

  const handleClearProposalsOnly = () => {
    setShowClearProposalsModal(true);
  };

  const handleExecuteClearProposals = () => {
    handleUpdateProposals([]);
    setShowClearProposalsModal(false);
  };

  const handleSelectPreset = (preset: PresetTemplate) => {
    const localized = localizeTemplate(preset, language);
    handleUpdateRequirements(localized.requirements);
    handleUpdateExcelBenefits(localized.requirements);
    setActiveTab('step4_review');
  };

  const handleApplyBoundRequirements = (boundReqs: BenefitRequirement[]) => {
    handleUpdateRequirements(boundReqs);
    setActiveTab('step4_review');
  };

  const isWorkflowStep = [
    'step1_excel', 
    'step2_rfp', 
    'step3_binding', 
    'step4_review', 
    'requirements', 
    'step5_proposals', 
    'proposals'
  ].includes(activeTab);

  // Global Access Control: Block unauthenticated users from accessing any system screen
  if (!isAuthenticated) {
    return <LoginGateway />;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex font-sans selection:bg-sky-500 selection:text-white antialiased overflow-x-hidden w-full max-w-full">
      {/* Sidebar Navigation */}
      <SidebarNav
        activeTab={activeTab}
        onSelectTab={handleSelectTabSafely}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        isMobileOpen={isMobileNavOpen}
        onCloseMobile={() => setIsMobileNavOpen(false)}
        requirementsCount={requirements.length}
        proposalsCount={proposals.length}
        excelCount={excelBenefits.length}
        hasConditions={Boolean(conditionsText.trim() || conditionsFileBase64)}
        activeProjectYear={activeProject?.year}
        activeProjectName={activeProject?.name}
        onOpenProjectManager={() => setIsProjectManagerModalOpen(true)}
        onOpenAdvisor={() => setIsAiAdvisorOpen(true)}
        onResetToDemo={handleResetToDemo}
        onClearData={handleClearAllData}
        onSelectPreset={handleSelectPreset}
        onOpenExport={() => setIsExportOpen(true)}
        totalMembers={census.totalMembers || (census.childrenCount + census.adultsCount + (census.seniorsCount || 0))}
      />

      {/* Main Workspace Area (Right/Left of sidebar) */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen bg-slate-50/50 overflow-x-hidden w-full max-w-full">
        
        {/* Sleek Top Bar Header */}
        <Header
          activeTab={activeTab}
          setActiveTab={handleSelectTabSafely}
          onOpenMobileMenu={() => setIsMobileNavOpen(true)}
          onOpenProjectManager={() => setIsProjectManagerModalOpen(true)}
          onOpenExport={() => setIsExportOpen(true)}
          onOpenAdvisor={() => setIsAiAdvisorOpen(true)}
          activeProjectYear={activeProject?.year}
          activeProjectName={activeProject?.name}
          proposalsCount={proposals.length}
        />

        {/* Year & Project Management Modal */}
        <ProjectYearManager
          hideBanner={true}
          projects={projects}
          activeProjectId={activeProjectId}
          onSelectProject={handleSelectProject}
          onCreateProject={handleCreateProject}
          onUpdateProject={handleUpdateProject}
          onDeleteProject={handleDeleteProject}
          isModalOpenControlled={isProjectManagerModalOpen}
          onCloseModal={() => setIsProjectManagerModalOpen(false)}
          onOpenModal={() => setIsProjectManagerModalOpen(true)}
          editingProjectIdControlled={editingProjectIdForModal}
          onResetEditingProjectIdControlled={() => setEditingProjectIdForModal(null)}
        />

        {/* Main Content Area: Centered, Highly Legible, Maximized View */}
        <main className="flex-1 max-w-7xl 2xl:max-w-[1640px] w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
          
          {/* Step by Step Guided Workflow Stepper (Only for setup workflow steps 1 to 5) */}
          {isWorkflowStep && (
            <>
              <StepProgressNav
                currentTab={activeTab}
                onSelectTab={handleSelectTabSafely}
                excelCount={excelBenefits.length}
                requirementsCount={requirements.length}
                proposalsCount={proposals.length}
                hasConditions={Boolean(conditionsText.trim() || conditionsFileBase64)}
                totalMembers={census.totalMembers || (census.childrenCount + census.adultsCount + (census.seniorsCount || 0))}
              />

              {/* Interactive Clarification & Operational Rules Banner */}
              <ClarificationQABox />
            </>
          )}

          {/* Step 1: Upload Excel Benefit Schedule */}
        {activeTab === 'step1_excel' && (
          <Step1ExcelBenefits
            excelBenefits={excelBenefits}
            onUpdateExcelBenefits={handleUpdateExcelBenefits}
            onProceedToStep2={() => setActiveTab('step2_rfp')}
            projectYear={activeProject?.year}
            projectName={activeProject?.name}
            onOpenProjectManager={() => setIsProjectManagerModalOpen(true)}
            onEditCurrentProject={() => handleOpenEditProject(activeProjectId)}
            onDeleteCurrentProject={() => handleDeleteProject(activeProjectId)}
            canDeleteProject={projects.length > 1}
          />
        )}

        {/* Step 2: Tender RFP Conditions & Caps */}
        {activeTab === 'step2_rfp' && (
          <Step2RfpConditions
            conditionsText={conditionsText}
            onUpdateConditionsText={handleUpdateConditionsText}
            conditionsFileName={conditionsFileName}
            onUpdateConditionsFileName={setConditionsFileName}
            conditionsFileBase64={conditionsFileBase64}
            onUpdateConditionsFileBase64={setConditionsFileBase64}
            conditionsMimeType={conditionsMimeType}
            onUpdateConditionsMimeType={setConditionsMimeType}
            excelBenefitsCount={excelBenefits.length}
            onNavigatePrev={() => setActiveTab('step1_excel')}
            onProceedToStep3={() => setActiveTab('step3_binding')}
          />
        )}

        {/* Step 3: AI Smart Binding */}
        {activeTab === 'step3_binding' && (
          <Step3AiBinding
            excelBenefits={excelBenefits}
            requirements={requirements}
            conditionsText={conditionsText}
            conditionsFileBase64={conditionsFileBase64}
            conditionsMimeType={conditionsMimeType}
            onApplyBoundRequirements={handleApplyBoundRequirements}
            onNavigatePrev={() => setActiveTab('step2_rfp')}
            projectYear={activeProject?.year}
            projectId={activeProjectId}
          />
        )}

        {/* Step 4: Approved Requirements Review & Inline Management */}
        {(activeTab === 'step4_review' || activeTab === 'requirements') && (
          <RequirementsManager
            requirements={requirements}
            onUpdateRequirements={handleUpdateRequirements}
            onNavigatePrev={() => setActiveTab('step3_binding')}
            onNavigateNext={() => setActiveTab('step5_proposals')}
            onClearAll={handleClearAllData}
            onClearRequirements={handleClearRequirementsOnly}
            onLoadRealInsurers={handleResetToDemo}
            projectYear={activeProject?.year}
            projectName={activeProject?.name}
          />
        )}

        {/* Step 5: Insurer Proposals & AI Extraction */}
        {(activeTab === 'step5_proposals' || activeTab === 'proposals') && (
          <ProposalsManager
            proposals={proposals}
            requirements={requirements}
            onUpdateProposals={handleUpdateProposals}
            onNavigateToRankings={() => setActiveTab('step6_tradeoff_matrix')}
            onNavigatePrev={() => setActiveTab('step4_review')}
            onClearProposals={handleClearProposalsOnly}
            onLoadRealProposals={handleResetToDemo}
            onNavigateToActuarial={() => setActiveTab('step_actuarial')}
          />
        )}

        {/* Step 6: Actuarial Demographic Census & Statutory Premium Calculation (256 Beneficiaries) */}
        {(activeTab === 'step_actuarial' || activeTab === 'actuarial') && (
          <ActuarialPricingCalculator
            proposals={proposals}
            census={census}
            onUpdateCensus={handleUpdateCensus}
            onUpdateProposals={handleUpdateProposals}
            onToggleExcludeProposal={handleToggleExcludeProposal}
            onNavigateToMatrix={() => setActiveTab('step6_tradeoff_matrix')}
          />
        )}

        {/* Step 7: Trade-off Comparison Matrix & 5/5 Rankings */}
        {(activeTab === 'step6_tradeoff_matrix' || activeTab === 'rankings') && (
          <RankingsDashboard
            proposals={proposals}
            requirements={requirements}
            census={census}
            onUpdateProposals={handleUpdateProposals}
            onUpdateRequirements={handleUpdateRequirements}
            onToggleExcludeProposal={handleToggleExcludeProposal}
            onOpenAuditTab={() => setActiveTab('audit')}
            onOpenAdvisor={() => setActiveTab('audit')}
            onNavigatePrev={() => setActiveTab('step_actuarial')}
            onNavigateNext={() => setActiveTab('step_reports')}
            onOpenExport={() => setIsExportOpen(true)}
            onNavigateToActuarial={() => setActiveTab('step_actuarial')}
            onNavigateToReports={() => setActiveTab('step_reports')}
          />
        )}

        {/* Step 8: Final Tender Evaluation Reports View (390 Points / 60% Tech + 40% Fin) */}
        {(activeTab === 'step_reports' || activeTab === 'reports') && (
          <TenderEvaluationReportsView
            proposals={proposals}
            requirements={requirements}
            census={census}
            onUpdateProposals={handleUpdateProposals}
            onToggleExcludeProposal={handleToggleExcludeProposal}
            onNavigatePrev={() => setActiveTab('step6_tradeoff_matrix')}
            onOpenExport={() => setIsExportOpen(true)}
            onNavigateToMatrix={() => setActiveTab('step6_tradeoff_matrix')}
            onNavigateToActuarial={() => setActiveTab('step_actuarial')}
          />
        )}

        {/* Additional View: Surplus Cap Audit Inspector */}
        {activeTab === 'audit' && (
          <CapAuditInspector
            proposals={proposals}
            requirements={requirements}
            onNavigatePrev={() => setActiveTab('step6_tradeoff_matrix')}
            onOpenExport={() => setIsExportOpen(true)}
            onStartNewTender={() => {
              setActiveTab('step1_excel');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}

        {/* Administration & AI Engine Settings */}
        {activeTab === 'admin' && (
          <AdminPanel
            onNavigateHome={() => {
              setActiveTab('step1_excel');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}
      </main>

      {/* Global Authentication and Security Modals */}
      <LoginModal />
      <ChangePasswordModal />
      <UserProfileModal />

      {/* Export Report Modal */}
      <ExportReportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        requirements={requirements}
        proposals={proposals}
        census={census}
        onNavigateToReports={() => setActiveTab('step_reports')}
      />

      {/* AI Advisor Modal */}
      <AiAdvisorModal
        isOpen={isAiAdvisorOpen}
        onClose={() => setIsAiAdvisorOpen(false)}
        proposals={proposals}
        requirements={requirements}
        census={census}
      />

      {/* Clear Data Confirmation Modal */}
      {showClearConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            
            <h3 className="text-lg font-bold text-slate-900 text-center mb-2">
              {isRtl ? 'مسح كافة البيانات والبدء من جديد' : 'Clear All Data & Start Fresh'}
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 text-center mb-6 leading-relaxed">
              {isRtl 
                ? 'هل أنت متأكد من رغبتك في مسح كافة بنود المنافع وعروض الشركات المرفوعة وبدء جلسة جديدة فارغة تماماً؟'
                : 'Are you sure you want to clear all benefits and proposals to start completely fresh?'}
            </p>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowClearConfirmModal(false)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                {isRtl ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleExecuteClearAll}
                className="flex-1 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs sm:text-sm font-bold transition-colors shadow-sm cursor-pointer"
              >
                {isRtl ? 'نعم، مسح والبدء من الصفر' : 'Yes, Clear Everything'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clear Requirements Only Modal */}
      {showClearRequirementsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            
            <h3 className="text-lg font-bold text-slate-900 text-center mb-2">
              {isRtl ? 'مسح كافة متطلبات ومنافع الخطوة الأولى' : 'Clear Step 1 Requirements'}
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 text-center mb-6 leading-relaxed">
              {isRtl 
                ? 'هل أنت متأكد من مسح كافة المنافع المعتمدة الحالية لتتمكن من إعادة استيرادها أو إدخالها من جديد؟'
                : 'Are you sure you want to clear current requirements to re-import or enter them anew?'}
            </p>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowClearRequirementsModal(false)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                {isRtl ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleExecuteClearRequirements}
                className="flex-1 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs sm:text-sm font-bold transition-colors shadow-sm cursor-pointer"
              >
                {isRtl ? 'نعم، مسح المتطلبات' : 'Yes, Clear Requirements'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clear Proposals Only Modal */}
      {showClearProposalsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            
            <h3 className="text-lg font-bold text-slate-900 text-center mb-2">
              {isRtl ? 'مسح عروض شركات التأمين' : 'Clear Insurer Proposals'}
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 text-center mb-6 leading-relaxed">
              {isRtl 
                ? 'هل أنت متأكد من مسح كافة عروض الشركات المرفوعة الحالية والبدء من جديد؟'
                : 'Are you sure you want to clear all uploaded insurer proposals?'}
            </p>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowClearProposalsModal(false)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                {isRtl ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleExecuteClearProposals}
                className="flex-1 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs sm:text-sm font-bold transition-colors shadow-sm cursor-pointer"
              >
                {isRtl ? 'نعم، مسح العروض' : 'Yes, Clear Proposals'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Demo Modal */}
      {showDemoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-full bg-sky-100 text-sky-600 flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
            
            <h3 className="text-lg font-bold text-slate-900 text-center mb-2">
              {isRtl ? 'تحميل العروض والبيانات التجريبية' : 'Load Demo Data & Proposals'}
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 text-center mb-6 leading-relaxed">
              {isRtl 
                ? 'هل تريد تحميل عروض الشركات الـ 4 الحقيقية (بوبا، التعاونية، الراجحي، ميدغلف) وجدول المنافع المعتمد للتحليل الفوري؟'
                : 'Load the 4 real insurer proposals (Bupa, Tawuniya, Al Rajhi, Medgulf) and benefits schedule for instant comparison?'}
            </p>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowDemoModal(false)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                {isRtl ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleExecuteResetToDemo}
                className="flex-1 px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs sm:text-sm font-bold transition-colors shadow-sm cursor-pointer"
              >
                {isRtl ? 'تحميل البيانات' : 'Load Demo Data'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modern Executive Footer */}
      <Footer
        activeProjectYear={activeProject?.year}
        requirementsCount={requirements.length}
        proposalsCount={proposals.length}
        onOpenExport={() => setIsExportOpen(true)}
        onNavigateTab={handleSelectTabSafely}
        onOpenAdvisor={() => setIsAiAdvisorOpen(true)}
        onResetToDemo={handleResetToDemo}
      />
      </div>
    </div>
  );
}
