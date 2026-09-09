import React, { useState, useEffect } from 'react';
import { 
  FolderGit2, 
  Calendar, 
  Plus, 
  Trash2, 
  Check, 
  Edit3, 
  ChevronDown, 
  FileSpreadsheet, 
  Building2, 
  X, 
  AlertCircle,
  AlertTriangle,
  FileText
} from 'lucide-react';
import { TenderProject } from '../types';
import { useI18n } from '../i18n/I18nContext';

interface ProjectYearManagerProps {
  hideBanner?: boolean;
  projects: TenderProject[];
  activeProjectId: string;
  onSelectProject: (projectId: string) => void;
  onCreateProject: (project: Omit<TenderProject, 'id' | 'createdAt' | 'updatedAt'>, cloneFromId?: string) => void;
  onUpdateProject: (projectId: string, updates: Partial<TenderProject>) => void;
  onDeleteProject: (projectId: string) => void;
  isModalOpenControlled?: boolean;
  onCloseModal?: () => void;
  onOpenModal?: () => void;
  editingProjectIdControlled?: string | null;
  onResetEditingProjectIdControlled?: () => void;
}

export const ProjectYearManager: React.FC<ProjectYearManagerProps> = ({
  hideBanner = false,
  projects,
  activeProjectId,
  onSelectProject,
  onCreateProject,
  onUpdateProject,
  onDeleteProject,
  isModalOpenControlled,
  onCloseModal,
  onOpenModal,
  editingProjectIdControlled,
  onResetEditingProjectIdControlled
}) => {
  const { isRtl } = useI18n();
  const [internalModalOpen, setInternalModalOpen] = useState(false);
  const isModalOpen = isModalOpenControlled !== undefined ? isModalOpenControlled : internalModalOpen;
  
  const setIsModalOpen = (open: boolean) => {
    setInternalModalOpen(open);
    if (!open && onCloseModal) {
      onCloseModal();
    } else if (open && onOpenModal) {
      onOpenModal();
    }
  };

  const [isNewProjectMode, setIsNewProjectMode] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [projectPendingDelete, setProjectPendingDelete] = useState<TenderProject | null>(null);

  // New Project Form State
  const [newYear, setNewYear] = useState('2026 - 2027');
  const [newName, setNewName] = useState('مشروع مناقصة التأمين الطبي 2026 - 2027');
  const [newDescription, setNewDescription] = useState('مشروع جديد لاستيراد جدول المنافع والشروط الخاصة بالسنة القادمة');
  const [cloneSourceId, setCloneSourceId] = useState<string>('blank');

  // Edit Project State
  const [editName, setEditName] = useState('');
  const [editYear, setEditYear] = useState('');
  const [editDescription, setEditDescription] = useState('');

  // Handle external edit project trigger
  useEffect(() => {
    if (editingProjectIdControlled) {
      const proj = projects.find(p => p.id === editingProjectIdControlled);
      if (proj) {
        setEditingProjectId(proj.id);
        setEditName(proj.name);
        setEditYear(proj.year);
        setEditDescription(proj.description || '');
        setIsNewProjectMode(false);
        setIsModalOpen(true);
      }
      if (onResetEditingProjectIdControlled) {
        onResetEditingProjectIdControlled();
      }
    }
  }, [editingProjectIdControlled, projects]);

  const activeProject = projects.find(p => p.id === activeProjectId) || projects[0];

  const handleOpenCreate = () => {
    setIsNewProjectMode(true);
    setEditingProjectId(null);
    const currentYearNum = new Date().getFullYear();
    setNewYear(`${currentYearNum + 1} - ${currentYearNum + 2}`);
    setNewName(isRtl ? `مشروع مناقصة التأمين الطبي ${currentYearNum + 1} - ${currentYearNum + 2}` : `Health Insurance Tender ${currentYearNum + 1} - ${currentYearNum + 2}`);
    setNewDescription(isRtl ? 'مشروع جديد مستقل لاستيراد جدول المنافع والشروط الخاصة بهذه السنة' : 'Independent new project for importing this year\'s Excel benefits and RFP');
    setCloneSourceId('blank');
  };

  const handleSubmitNewProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newYear.trim()) return;

    onCreateProject(
      {
        year: newYear.trim(),
        name: newName.trim(),
        description: newDescription.trim(),
        excelBenefits: [],
        excelFileName: '',
        conditionsText: '',
        conditionsFileName: '',
        requirements: [],
        proposals: []
      },
      cloneSourceId !== 'blank' ? cloneSourceId : undefined
    );

    setIsNewProjectMode(false);
    setIsModalOpen(false);
  };

  const handleStartEdit = (proj: TenderProject) => {
    setEditingProjectId(proj.id);
    setEditName(proj.name);
    setEditYear(proj.year);
    setEditDescription(proj.description || '');
    setIsNewProjectMode(false);
    setIsModalOpen(true);
  };

  const handleSaveEdit = (projectId: string) => {
    if (!editName.trim() || !editYear.trim()) return;
    onUpdateProject(projectId, {
      name: editName.trim(),
      year: editYear.trim(),
      description: editDescription.trim()
    });
    setEditingProjectId(null);
  };

  const handleConfirmDelete = () => {
    if (!projectPendingDelete) return;
    if (projects.length <= 1) {
      alert(isRtl ? 'لا يمكن حذف المشروع الأخير. يجب أن يحتوي النظام على مشروع واحد على الأقل.' : 'Cannot delete the only project. At least one project is required.');
      setProjectPendingDelete(null);
      return;
    }

    onDeleteProject(projectPendingDelete.id);
    setProjectPendingDelete(null);
  };

  return (
    <>
      {/* Top Project/Year Banner Bar */}
      {!hideBanner && (
        <div className="bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 text-white px-4 sm:px-6 py-2.5 shadow-sm border-b border-slate-800">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
            
            {/* Active Project Info + Direct Edit & Delete Buttons */}
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-wrap">
              <div className="h-8 inline-flex items-center gap-2 bg-sky-500/20 text-sky-300 px-2.5 rounded-lg text-xs font-bold border border-sky-400/30 shrink-0">
                <Calendar className="w-3.5 h-3.5" />
                <span>{activeProject ? activeProject.year : '2025 - 2026'}</span>
              </div>

              <div className="min-w-0 flex items-center gap-2">
                <span className="text-xs text-slate-400 font-medium hidden md:inline">
                  {isRtl ? 'المشروع النشط:' : 'Active Project:'}
                </span>
                <h3 className="text-xs sm:text-sm font-bold text-white truncate max-w-xs sm:max-w-md">
                  {activeProject ? activeProject.name : 'مشروع مناقصة التأمين'}
                </h3>
              </div>

              {/* Quick In-Banner Edit & Delete Actions for Active Project */}
              {activeProject && (
                <div className="flex items-center gap-1.5 ms-1">
                  <button
                    id="btn-banner-edit-active-project"
                    onClick={() => handleStartEdit(activeProject)}
                    className="h-8 inline-flex items-center gap-1.5 px-2.5 rounded-lg text-xs font-semibold bg-white/10 hover:bg-white/20 text-sky-200 hover:text-white border border-white/15 transition-colors cursor-pointer whitespace-nowrap"
                    title={isRtl ? 'تعديل اسم وسنة المشروع النشط' : 'Edit active project title and year'}
                  >
                    <Edit3 className="w-3.5 h-3.5 text-sky-300 shrink-0" />
                    <span>{isRtl ? 'تعديل' : 'Edit'}</span>
                  </button>

                  {projects.length > 1 && (
                    <button
                      id="btn-banner-delete-active-project"
                      onClick={() => setProjectPendingDelete(activeProject)}
                      className="h-8 inline-flex items-center gap-1.5 px-2.5 rounded-lg text-xs font-semibold bg-rose-500/15 hover:bg-rose-500/30 text-rose-300 hover:text-rose-100 border border-rose-500/30 transition-colors cursor-pointer whitespace-nowrap"
                      title={isRtl ? 'حذف هذا المشروع' : 'Delete this project'}
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-300 shrink-0" />
                      <span>{isRtl ? 'حذف' : 'Delete'}</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Quick Metrics & Project Controls */}
            <div className="flex items-center gap-2 shrink-0 flex-wrap">
              
              {/* Project Benefits Stats */}
              <div className="h-8 hidden lg:inline-flex items-center gap-2 text-[11px] text-slate-300 bg-white/5 px-2.5 rounded-lg border border-white/10">
                <span className="flex items-center gap-1">
                  <FileSpreadsheet className="w-3 h-3 text-emerald-400" />
                  <strong className="text-white">{activeProject?.excelBenefits?.length || 0}</strong> {isRtl ? 'بند مستورد' : 'benefits'}
                </span>
                <span className="text-slate-500">•</span>
                <span className="flex items-center gap-1">
                  <Building2 className="w-3 h-3 text-sky-400" />
                  <strong className="text-white">{activeProject?.proposals?.length || 0}</strong> {isRtl ? 'عروض شركات' : 'proposals'}
                </span>
              </div>

              {/* Switch / Manage Projects Button */}
              <button
                id="btn-switch-project-year"
                onClick={() => {
                  setIsNewProjectMode(false);
                  setEditingProjectId(null);
                  setIsModalOpen(true);
                }}
                className="h-8 inline-flex items-center gap-1.5 px-3 rounded-lg text-xs font-bold bg-sky-600 hover:bg-sky-500 text-white shadow-2xs transition-colors cursor-pointer whitespace-nowrap"
                title={isRtl ? 'إدارة وتبديل مشاريع السنوات' : 'Manage & switch tender project years'}
              >
                <FolderGit2 className="w-3.5 h-3.5 shrink-0" />
                <span>{isRtl ? 'إدارة وتعديل السنوات' : 'Manage & Edit Years'}</span>
                <ChevronDown className="w-3 h-3 opacity-80 shrink-0" />
              </button>

              {/* Quick Add Year Button */}
              <button
                id="btn-quick-new-year"
                onClick={() => {
                  handleOpenCreate();
                  setIsModalOpen(true);
                }}
                className="h-8 inline-flex items-center gap-1.5 px-2.5 rounded-lg text-xs font-semibold bg-white/10 hover:bg-white/20 text-slate-200 border border-white/15 transition-colors cursor-pointer whitespace-nowrap"
                title={isRtl ? 'إنشاء مشروع سنة جديدة مستقلة' : 'Create new independent year project'}
              >
                <Plus className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>{isRtl ? 'سنة جديدة' : 'New Year'}</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Project / Year Manager Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            
            {/* Modal Header */}
            <div className="px-6 py-5 bg-gradient-to-r from-slate-900 to-sky-950 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-sky-500/20 border border-sky-400/30 flex items-center justify-center text-sky-300">
                  <FolderGit2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {isRtl ? 'إدارة وتعديل وحذف مشاريع التأمين حسب السنوات' : 'Tender Projects & Years: Edit, Delete & Switch'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {isRtl 
                      ? 'لكل سنة مشروع مستقل؛ يمكنك تعديل الاسم والسنة أو حذف أي مشروع وتبديله' 
                      : 'Each year is stored independently. You can edit names, tender years, or delete projects'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setIsNewProjectMode(false);
                  setEditingProjectId(null);
                }}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
              
              {!isNewProjectMode ? (
                <>
                  {/* Actions Header */}
                  <div className="flex items-center justify-between gap-4">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      {isRtl ? `قائمة المشاريع والسنوات (${projects.length})` : `Projects & Years (${projects.length})`}
                    </p>
                    <button
                      id="btn-modal-create-year"
                      onClick={handleOpenCreate}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-sky-600 hover:bg-sky-700 text-white transition-colors cursor-pointer shadow-xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{isRtl ? '+ مشروع سنة جديدة' : '+ New Year Project'}</span>
                    </button>
                  </div>

                  {/* Projects List with Enhanced Edit & Delete Controls */}
                  <div className="space-y-3">
                    {projects.map((proj) => {
                      const isActive = proj.id === activeProjectId;
                      const isEditing = editingProjectId === proj.id;

                      return (
                        <div
                          key={proj.id}
                          className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                            isActive 
                              ? 'bg-sky-50/70 border-sky-300 ring-2 ring-sky-500/20' 
                              : 'bg-white border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          {isEditing ? (
                            /* Inline Edit Form */
                            <div className="space-y-3 bg-white p-4 rounded-xl border border-sky-200 shadow-xs">
                              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                                <div className="flex items-center gap-1.5 text-xs font-bold text-sky-800">
                                  <Edit3 className="w-4 h-4 text-sky-600" />
                                  <span>{isRtl ? 'تعديل بيانات مشروع السنة التأمينية' : 'Edit Tender Year Project Details'}</span>
                                </div>
                                <span className="text-[11px] font-semibold text-slate-400">ID: {proj.id}</span>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div className="sm:col-span-1">
                                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                                    {isRtl ? 'السنة التأمينية' : 'Tender Year'} *
                                  </label>
                                  <input
                                    type="text"
                                    value={editYear}
                                    onChange={(e) => setEditYear(e.target.value)}
                                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 font-bold"
                                    placeholder="2025 - 2026"
                                  />
                                </div>
                                <div className="sm:col-span-2">
                                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                                    {isRtl ? 'اسم المشروع' : 'Project Name'} *
                                  </label>
                                  <input
                                    type="text"
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500"
                                    placeholder="مشروع مناقصة التأمين الطبي"
                                  />
                                </div>
                              </div>

                              <div>
                                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                                  {isRtl ? 'الوصف أو الملاحظات' : 'Description / Notes'}
                                </label>
                                <input
                                  type="text"
                                  value={editDescription}
                                  onChange={(e) => setEditDescription(e.target.value)}
                                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500"
                                  placeholder={isRtl ? 'ملاحظات حول نطاق هذا المشروع...' : 'Notes about this project scope...'}
                                />
                              </div>

                              <div className="flex items-center gap-2 justify-end pt-1">
                                <button
                                  type="button"
                                  onClick={() => setEditingProjectId(null)}
                                  className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                                >
                                  {isRtl ? 'إلغاء' : 'Cancel'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleSaveEdit(proj.id)}
                                  className="px-4 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-xs cursor-pointer"
                                >
                                  {isRtl ? 'حفظ التعديلات' : 'Save Changes'}
                                </button>
                              </div>
                            </div>
                          ) : (
                            /* Project Details Card View */
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                              <div className="space-y-1.5 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="px-2.5 py-0.5 rounded-lg text-xs font-black bg-slate-900 text-white">
                                    {proj.year}
                                  </span>
                                  <h4 className="text-sm font-bold text-slate-900 truncate">
                                    {proj.name}
                                  </h4>
                                  {isActive && (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                                      <Check className="w-3 h-3" />
                                      {isRtl ? 'المشروع النشط حالياً' : 'Active Project'}
                                    </span>
                                  )}
                                </div>

                                <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                                  <span className="flex items-center gap-1">
                                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                                    <span>{proj.excelBenefits?.length || 0} {isRtl ? 'بند مستورد من الإكسل' : 'imported benefits'}</span>
                                  </span>
                                  <span>•</span>
                                  <span className="flex items-center gap-1">
                                    <Building2 className="w-3.5 h-3.5 text-sky-600" />
                                    <span>{proj.proposals?.length || 0} {isRtl ? 'عروض شركات' : 'proposals'}</span>
                                  </span>
                                  {proj.excelFileName && (
                                    <>
                                      <span>•</span>
                                      <span className="flex items-center gap-1 truncate max-w-xs text-slate-400">
                                        <FileText className="w-3 h-3 text-slate-400" />
                                        <span className="truncate">{proj.excelFileName}</span>
                                      </span>
                                    </>
                                  )}
                                </div>

                                {proj.description && (
                                  <p className="text-xs text-slate-500 italic line-clamp-1 max-w-lg">
                                    {proj.description}
                                  </p>
                                )}
                              </div>

                              {/* Action Buttons for this Project: Activate, Edit, Delete */}
                              <div className="flex items-center gap-2 shrink-0 self-end sm:self-center flex-wrap">
                                {!isActive && (
                                  <button
                                    onClick={() => {
                                      onSelectProject(proj.id);
                                      setIsModalOpen(false);
                                    }}
                                    className="px-3 py-1.5 rounded-xl text-xs font-bold bg-sky-600 hover:bg-sky-700 text-white shadow-2xs transition-colors cursor-pointer"
                                  >
                                    {isRtl ? 'تفعيل' : 'Activate'}
                                  </button>
                                )}

                                {/* Edit Button */}
                                <button
                                  id={`btn-edit-project-${proj.id}`}
                                  onClick={() => handleStartEdit(proj)}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors cursor-pointer"
                                  title={isRtl ? 'تعديل اسم وسنة ووصف المشروع' : 'Edit project title, year and description'}
                                >
                                  <Edit3 className="w-3.5 h-3.5 text-sky-600" />
                                  <span>{isRtl ? 'تعديل' : 'Edit'}</span>
                                </button>

                                {/* Delete Button */}
                                {projects.length > 1 ? (
                                  <button
                                    id={`btn-delete-project-${proj.id}`}
                                    onClick={() => setProjectPendingDelete(proj)}
                                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors cursor-pointer"
                                    title={isRtl ? 'حذف هذا المشروع' : 'Delete project'}
                                  >
                                    <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                                    <span>{isRtl ? 'حذف' : 'Delete'}</span>
                                  </button>
                                ) : (
                                  <span 
                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[11px] font-semibold text-slate-400 bg-slate-50 border border-slate-200"
                                    title={isRtl ? 'لا يمكن حذف المشروع الوحيد المتبقي' : 'Cannot delete the only project'}
                                  >
                                    {isRtl ? 'المشروع الوحيد' : 'Only Project'}
                                  </span>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <p className="leading-relaxed">
                      {isRtl
                        ? 'تنبيه: كل سنة تأمينية يتم حفظها كمشروع مستقل بالكامل. تعديل بيانات السنة أو حذف مشروع قديم لا يؤثر إطلاقاً على بيانات المشاريع والسنوات الأخرى.'
                        : 'Notice: Each tender year is kept completely isolated. Editing year details or deleting a project does not affect other tender years.'}
                    </p>
                  </div>
                </>
              ) : (
                /* New Project Form */
                <form onSubmit={handleSubmitNewProject} className="space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                    <h4 className="text-sm font-bold text-slate-800">
                      {isRtl ? 'إنشاء مشروع سنة تأمينية جديدة' : 'Create New Year Tender Project'}
                    </h4>
                    <button
                      type="button"
                      onClick={() => setIsNewProjectMode(false)}
                      className="text-xs font-semibold text-slate-500 hover:text-slate-700"
                    >
                      {isRtl ? '← العودة للقائمة' : '← Back to list'}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-1">
                      <label className="text-xs font-bold text-slate-700 block mb-1">
                        {isRtl ? 'السنة التأمينية' : 'Tender Year'} *
                      </label>
                      <input
                        type="text"
                        required
                        value={newYear}
                        onChange={(e) => setNewYear(e.target.value)}
                        placeholder="2026 - 2027"
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 font-bold"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="text-xs font-bold text-slate-700 block mb-1">
                        {isRtl ? 'اسم المشروع' : 'Project Title'} *
                      </label>
                      <input
                        type="text"
                        required
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        placeholder="مشروع مناقصة التأمين الطبي للعام 2026-2027"
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      {isRtl ? 'وصف أو ملاحظات المشروع' : 'Description / Notes'}
                    </label>
                    <textarea
                      rows={2}
                      value={newDescription}
                      onChange={(e) => setNewDescription(e.target.value)}
                      placeholder={isRtl ? 'ملاحظات حول نطاق هذا العطاء...' : 'Notes about this tender scope...'}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>

                  {/* Starting Baseline Option */}
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-2">
                      {isRtl ? 'أساس بدء بيانات هذا المشروع:' : 'Initial Project Baseline:'}
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      
                      <label className={`p-3 rounded-xl border cursor-pointer flex items-start gap-2.5 transition-all ${
                        cloneSourceId === 'blank' ? 'bg-sky-50 border-sky-400 ring-1 ring-sky-400' : 'bg-slate-50 border-slate-200'
                      }`}>
                        <input
                          type="radio"
                          name="cloneSource"
                          checked={cloneSourceId === 'blank'}
                          onChange={() => setCloneSourceId('blank')}
                          className="mt-0.5"
                        />
                        <div>
                          <div className="text-xs font-bold text-slate-800">
                            {isRtl ? 'مشروع فارغ جديد بالكامل' : 'Start Clean & Empty'}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {isRtl ? 'جاهز لرفع ملف إكسل السنة الجديدة من الصفر' : 'Ready to upload this year\'s Excel file from scratch'}
                          </div>
                        </div>
                      </label>

                      {projects.map((proj) => (
                        <label 
                          key={proj.id}
                          className={`p-3 rounded-xl border cursor-pointer flex items-start gap-2.5 transition-all ${
                            cloneSourceId === proj.id ? 'bg-sky-50 border-sky-400 ring-1 ring-sky-400' : 'bg-slate-50 border-slate-200'
                          }`}
                        >
                          <input
                            type="radio"
                            name="cloneSource"
                            checked={cloneSourceId === proj.id}
                            onChange={() => setCloneSourceId(proj.id)}
                            className="mt-0.5"
                          />
                          <div>
                            <div className="text-xs font-bold text-slate-800">
                              {isRtl ? `نسخ من: ${proj.name}` : `Clone from: ${proj.name}`}
                            </div>
                            <div className="text-[11px] text-slate-500">
                              {proj.excelBenefits?.length || 0} {isRtl ? 'بند مستورد سابق' : 'previous benefits'}
                            </div>
                          </div>
                        </label>
                      ))}

                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                    <button
                      type="button"
                      onClick={() => setIsNewProjectMode(false)}
                      className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                    >
                      {isRtl ? 'إلغاء' : 'Cancel'}
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-sky-600 hover:bg-sky-700 text-white shadow-xs cursor-pointer"
                    >
                      {isRtl ? 'إنشاء وتفعيل المشروع الآن' : 'Create & Activate Project'}
                    </button>
                  </div>
                </form>
              )}

            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
              <span>{projects.length} {isRtl ? 'مشاريع مسجلة' : 'projects saved'}</span>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setIsNewProjectMode(false);
                  setEditingProjectId(null);
                }}
                className="font-bold text-slate-700 hover:text-slate-900 cursor-pointer"
              >
                {isRtl ? 'إغلاق' : 'Close'}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Explicit Delete Confirmation Danger Modal */}
      {projectPendingDelete && (
        <div className="fixed inset-0 z-60 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-rose-200 shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-6 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
                <AlertTriangle className="w-6 h-6" />
              </div>

              <div className="text-center space-y-1.5">
                <h3 className="text-base font-bold text-slate-900">
                  {isRtl ? 'تأكيد حذف مشروع السنة التأمينية' : 'Confirm Delete Tender Project'}
                </h3>
                <p className="text-xs text-slate-500">
                  {isRtl 
                    ? 'هل أنت متأكد من رغبتك في حذف هذا المشروع نهائياً؟ لا يمكن التراجع عن هذه العملية.'
                    : 'Are you sure you want to permanently delete this tender project? This cannot be undone.'}
                </p>
              </div>

              {/* Target Project Summary Box */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-500">{isRtl ? 'السنة التأمينية:' : 'Tender Year:'}</span>
                  <span className="font-black px-2 py-0.5 rounded-md bg-slate-900 text-white text-[11px]">
                    {projectPendingDelete.year}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-500">{isRtl ? 'اسم المشروع:' : 'Project Name:'}</span>
                  <span className="font-bold text-slate-800 truncate max-w-[200px]">
                    {projectPendingDelete.name}
                  </span>
                </div>
                <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
                  <span>{projectPendingDelete.excelBenefits?.length || 0} {isRtl ? 'بند مستورد' : 'benefits'}</span>
                  <span>•</span>
                  <span>{projectPendingDelete.proposals?.length || 0} {isRtl ? 'عروض شركات' : 'proposals'}</span>
                </div>
              </div>

              {projectPendingDelete.id === activeProjectId && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-900">
                  <strong>{isRtl ? 'ملاحظة:' : 'Note:'}</strong> {isRtl 
                    ? 'هذا هو المشروع النشط حالياً. عند الحذف، سيتم التبديل تلقائياً للمشروع البديل.' 
                    : 'This is the active project. Upon deletion, another project will be activated automatically.'}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setProjectPendingDelete(null)}
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  {isRtl ? 'إلغاء التراجع' : 'Cancel'}
                </button>
                <button
                  type="button"
                  id="btn-confirm-delete-project-final"
                  onClick={handleConfirmDelete}
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 transition-colors shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>{isRtl ? 'نعم، احذف المشروع' : 'Yes, Delete'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

