import React, { useState, useEffect, useRef } from 'react';
import { 
  Users, 
  Settings, 
  Bot, 
  Image as ImageIcon, 
  ShieldCheck, 
  Key, 
  Trash2, 
  Edit3, 
  UserPlus, 
  Save, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  RefreshCw, 
  UploadCloud, 
  Server, 
  Download, 
  Lock, 
  Eye, 
  EyeOff, 
  Crown, 
  Scale, 
  CheckSquare, 
  Eye as EyeIcon, 
  Zap,
  Sliders,
  Building2,
  FileSpreadsheet
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { useI18n } from '../i18n/I18nContext';
import { AppUser, UserRole, RolePermissions, DEFAULT_ROLE_PERMISSIONS, SystemSettings } from '../types';
import { authFetch } from '../utils/authInterceptor';

export interface AdminPanelProps {
  onNavigateHome?: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ onNavigateHome }) => {
  const { isRtl, language } = useI18n();
  const { user, token, isAdmin, isSuperAdmin, permissions: currentUserPerms, hasPermission, setAuthModalOpen } = useAuth();
  const { settings, updateSettings, uploadLogo, removeLogo, testAi, reloadSettings } = useSettings();

  const [activeSubTab, setActiveSubTab] = useState<'users' | 'ai' | 'branding' | 'tender' | 'deployment'>('users');
  
  // Users state
  const [usersList, setUsersList] = useState<AppUser[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [userModalMode, setUserModalMode] = useState<'add' | 'edit' | null>(null);
  const [selectedUser, setSelectedUser] = useState<AppUser | null>(null);
  
  // User form
  const [formUsername, setFormUsername] = useState('');
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formDepartment, setFormDepartment] = useState('');
  const [formJobTitle, setFormJobTitle] = useState('');
  const [formRole, setFormRole] = useState<UserRole>('evaluator');
  const [formPermissions, setFormPermissions] = useState<RolePermissions>({ ...DEFAULT_ROLE_PERMISSIONS.evaluator });
  const [formPassword, setFormPassword] = useState('');
  const [formIsActive, setFormIsActive] = useState(true);
  const [userFormError, setUserFormError] = useState<string | null>(null);
  const [userFormSuccess, setUserFormSuccess] = useState<string | null>(null);

  // Settings form state (mirrors settings)
  const [localSettings, setLocalSettings] = useState<SystemSettings>(settings);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // AI Connection test state
  const [isTestingAi, setIsTestingAi] = useState(false);
  const [aiTestResult, setAiTestResult] = useState<{
    success: boolean;
    provider?: string;
    model?: string;
    latencyMs?: number;
    reply?: string;
    message?: string;
  } | null>(null);

  // Logo upload state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [logoPreview, setLogoPreview] = useState<string>(settings.logoUrl || '');
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [logoError, setLogoError] = useState<string | null>(null);

  useEffect(() => {
    setLocalSettings(settings);
    setLogoPreview(settings.logoUrl || '');
  }, [settings]);

  // Fetch users when on users tab and authorized
  const fetchUsers = async () => {
    if (!token) return;
    setIsLoadingUsers(true);
    try {
      const res = await authFetch('/api/admin/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUsersList(data);
      }
    } catch (err) {
      console.error('Failed to fetch users:', err);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  useEffect(() => {
    if (token && isAdmin) {
      fetchUsers();
    }
  }, [token, isAdmin]);

  // Handle Save Settings
  const handleSaveSettings = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);

    const success = await updateSettings(localSettings);
    setIsSaving(false);
    if (success) {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }
  };

  // Handle Add/Edit User
  const handleOpenAddUser = () => {
    setSelectedUser(null);
    setFormUsername('');
    setFormName('');
    setFormEmail('');
    setFormPhone('');
    setFormDepartment('');
    setFormJobTitle('');
    setFormRole('evaluator');
    setFormPermissions({ ...DEFAULT_ROLE_PERMISSIONS.evaluator });
    setFormPassword('');
    setFormIsActive(true);
    setUserFormError(null);
    setUserFormSuccess(null);
    setUserModalMode('add');
  };

  const handleOpenEditUser = (u: AppUser) => {
    setSelectedUser(u);
    setFormUsername(u.username);
    setFormName(u.name);
    setFormEmail(u.email);
    setFormPhone(u.phone || '');
    setFormDepartment(u.department || '');
    setFormJobTitle(u.jobTitle || '');
    setFormRole(u.role);
    const defaults = DEFAULT_ROLE_PERMISSIONS[u.role] || DEFAULT_ROLE_PERMISSIONS.viewer;
    setFormPermissions({
      ...defaults,
      ...(u.permissions || {})
    });
    setFormPassword('');
    setFormIsActive(u.isActive);
    setUserFormError(null);
    setUserFormSuccess(null);
    setUserModalMode('edit');
  };

  const handleRoleChange = (newRole: UserRole) => {
    setFormRole(newRole);
    // Auto-populate recommended default permissions for this role
    const defaults = DEFAULT_ROLE_PERMISSIONS[newRole] || DEFAULT_ROLE_PERMISSIONS.viewer;
    setFormPermissions({ ...defaults });
  };

  const togglePermission = (key: keyof RolePermissions) => {
    setFormPermissions(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setUserFormError(null);
    setUserFormSuccess(null);

    if (userModalMode === 'add') {
      if (!formUsername.trim() || !formName.trim() || !formEmail.trim() || !formPassword.trim()) {
        setUserFormError(isRtl ? 'يرجى تعبئة كافة الحقول المطلوبة' : 'Please fill all required fields');
        return;
      }
      if (formPassword.length < 6) {
        setUserFormError(isRtl ? 'كلمة المرور يجب أن لا تقل عن 6 أحرف' : 'Password must be at least 6 characters');
        return;
      }

      try {
        const res = await authFetch('/api/admin/users', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            username: formUsername,
            name: formName,
            email: formEmail,
            phone: formPhone,
            department: formDepartment,
            jobTitle: formJobTitle,
            role: formRole,
            permissions: formPermissions,
            password: formPassword
          })
        });
        const data = await res.json();
        if (!res.ok) {
          setUserFormError(data.error || 'Failed to create user');
        } else {
          setUserFormSuccess(isRtl ? 'تم إضافة المستخدم بنجاح' : 'User created successfully');
          fetchUsers();
          setTimeout(() => setUserModalMode(null), 1200);
        }
      } catch (err: any) {
        setUserFormError(err.message || 'Error creating user');
      }
    } else if (userModalMode === 'edit' && selectedUser) {
      try {
        const payload: any = {
          name: formName,
          email: formEmail,
          phone: formPhone,
          department: formDepartment,
          jobTitle: formJobTitle,
          role: formRole,
          permissions: formPermissions,
          isActive: formIsActive
        };
        if (formPassword.trim()) {
          payload.password = formPassword.trim();
        }

        const res = await authFetch(`/api/admin/users/${selectedUser.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (!res.ok) {
          setUserFormError(data.error || 'Failed to update user');
        } else {
          setUserFormSuccess(isRtl ? 'تم تحديث بيانات وصلاحيات المستخدم بنجاح' : 'User and permissions updated successfully');
          fetchUsers();
          setTimeout(() => setUserModalMode(null), 1200);
        }
      } catch (err: any) {
        setUserFormError(err.message || 'Error updating user');
      }
    }
  };

  const handleDeleteUser = async (id: string, name: string) => {
    const confirmMsg = isRtl
      ? `هل أنت متأكد من رغبتك في حذف حساب "${name}" نهائياً؟`
      : `Are you sure you want to permanently delete user "${name}"?`;
    if (!window.confirm(confirmMsg)) return;

    try {
      const res = await authFetch(`/api/admin/users/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Failed to delete user');
      } else {
        fetchUsers();
      }
    } catch (err: any) {
      alert(err.message || 'Error deleting user');
    }
  };

  // Handle Logo Upload
  const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setLogoError(isRtl ? 'يرجى اختيار ملف صورة صالح (PNG, JPG, SVG, WebP)' : 'Please select a valid image file');
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      setLogoError(isRtl ? 'حجم الصورة يجب ألا يتجاوز 8 ميجابايت' : 'Image size must be less than 8MB');
      return;
    }

    setLogoError(null);
    setIsUploadingLogo(true);

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      setLogoPreview(base64);
      const res = await uploadLogo(base64, localSettings.logoWidth || 160);
      setIsUploadingLogo(false);
      if (!res.success) {
        setLogoError(res.error || 'Failed to upload logo');
      }
    };
    reader.onerror = () => {
      setIsUploadingLogo(false);
      setLogoError(isRtl ? 'حدث خطأ أثناء قراءة ملف الصورة' : 'Error reading image file');
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = async () => {
    if (!window.confirm(isRtl ? 'هل ترغب بإزالة الشعار المخصص واستعادة الشعار الافتراضي؟' : 'Reset custom logo to default emblem?')) {
      return;
    }
    await removeLogo();
    setLogoPreview('');
  };

  // Handle Live AI Connection Test
  const handleTestAi = async () => {
    setIsTestingAi(true);
    setAiTestResult(null);
    const res = await testAi({
      provider: localSettings.aiProvider,
      model: localSettings.aiProvider === 'openai' ? localSettings.openaiModel : localSettings.geminiModel,
      customKey: localSettings.aiProvider === 'openai' ? localSettings.customOpenaiKey : localSettings.customGeminiKey
    });
    setIsTestingAi(false);
    setAiTestResult(res);
  };

  // Export full JSON backup
  const handleExportBackup = () => {
    const fullBackup = {
      systemSettings: settings,
      projects: JSON.parse(localStorage.getItem('insur_tender_projects') || '[]'),
      exportedAt: new Date().toISOString(),
      appVersion: '2.0.0-production'
    };
    const blob = new Blob([JSON.stringify(fullBackup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Tender_Evaluator_Backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Role Badge Helper
  const renderRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'super_admin':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-black bg-rose-50 text-rose-800 border border-rose-200">
            <Crown className="w-3.5 h-3.5 text-rose-600" />
            <span>{isRtl ? 'مدير عام للنظام' : 'Super Admin'}</span>
          </span>
        );
      case 'committee_admin':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-black bg-indigo-50 text-indigo-800 border border-indigo-200">
            <Scale className="w-3.5 h-3.5 text-indigo-600" />
            <span>{isRtl ? 'رئيس لجنة العطاء' : 'Committee Admin'}</span>
          </span>
        );
      case 'evaluator':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-black bg-sky-50 text-sky-800 border border-sky-200">
            <CheckSquare className="w-3.5 h-3.5 text-sky-600" />
            <span>{isRtl ? 'مقيّم فني ومالي' : 'Evaluator'}</span>
          </span>
        );
      case 'viewer':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-black bg-slate-100 text-slate-700 border border-slate-200">
            <EyeIcon className="w-3.5 h-3.5 text-slate-500" />
            <span>{isRtl ? 'مستعرض تقارير' : 'Viewer'}</span>
          </span>
        );
    }
  };

  if (!isAdmin) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4" dir={isRtl ? 'rtl' : 'ltr'}>
        <div className="bg-white rounded-3xl p-8 border border-slate-200 text-center shadow-lg space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-200">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-black text-slate-900">
            {isRtl ? 'لوحة إدارة النظام مقيدة بالصلاحيات' : 'Admin Panel Restricted'}
          </h2>
          <p className="text-sm text-slate-600 max-w-md mx-auto">
            {isRtl 
              ? 'يجب تسجيل الدخول بحساب يتمتع بصلاحية إدارة النظام (Super Admin) أو رئيس لجنة العطاءات (Committee Admin) للوصول إلى إدارة المستخدمين وإعدادات الذكاء الاصطناعي.'
              : 'Please sign in with an account having Administrative or Committee Head privileges to access user management, AI switcher, and system branding.'}
          </p>
          <div className="pt-2">
            <button
              type="button"
              onClick={() => setAuthModalOpen(true)}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 text-white text-sm font-black shadow-md cursor-pointer inline-flex items-center gap-2"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{isRtl ? 'تسجيل الدخول كمسؤول' : 'Sign in as Administrator'}</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Top Banner Header */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-600 via-indigo-600 to-sky-700 flex items-center justify-center text-white shadow-md">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-slate-900">
                {isRtl ? 'لوحة إدارة النظام والإعدادات المتقدمة' : 'Admin Panel & System Configuration'}
              </h1>
              <span className="px-2.5 py-0.5 rounded-md text-[11px] font-black bg-emerald-50 text-emerald-800 border border-emerald-200">
                v2.0 Production Ready
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5 font-bold">
              {isRtl
                ? 'إدارة المستخدمين، التبديل الفوري بين Gemini و OpenAI، تخصيص الشعار المؤسسي، وتجهيز النشر على السيرفر'
                : 'User management, AI provider toggle (Gemini & OpenAI), custom logo upload, and hosting deployment tools'}
            </p>
          </div>
        </div>

        {/* Global Save Button if in Settings tabs */}
        {(activeSubTab === 'ai' || activeSubTab === 'branding' || activeSubTab === 'tender') && (
          <div className="flex items-center gap-2.5 self-end md:self-auto">
            {saveSuccess && (
              <span className="text-xs font-black text-emerald-600 flex items-center gap-1 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4" />
                <span>{isRtl ? 'تم حفظ التعديلات بنجاح' : 'Settings Saved'}</span>
              </span>
            )}
            <button
              type="button"
              onClick={() => handleSaveSettings()}
              disabled={isSaving}
              className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-black shadow-md cursor-pointer flex items-center gap-1.5 disabled:opacity-50 transition-all"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? (isRtl ? 'جاري الحفظ...' : 'Saving...') : (isRtl ? 'حفظ كافة الإعدادات' : 'Save Settings')}</span>
            </button>
          </div>
        )}
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveSubTab('users')}
          className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-black flex items-center gap-2 cursor-pointer transition-all ${
            activeSubTab === 'users'
              ? 'bg-sky-600 text-white shadow-md'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>{isRtl ? 'إدارة المستخدمين والصلاحيات' : 'Users & Roles'}</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-white/20 font-mono">
            {usersList.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('ai')}
          className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-black flex items-center gap-2 cursor-pointer transition-all ${
            activeSubTab === 'ai'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Bot className="w-4 h-4" />
          <span>{isRtl ? 'الذكاء الاصطناعي (Gemini / OpenAI)' : 'AI Provider (Gemini / OpenAI)'}</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-indigo-100 text-indigo-900 uppercase font-black">
            {localSettings.aiProvider}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('branding')}
          className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-black flex items-center gap-2 cursor-pointer transition-all ${
            activeSubTab === 'branding'
              ? 'bg-sky-600 text-white shadow-md'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <ImageIcon className="w-4 h-4" />
          <span>{isRtl ? 'الشعار والهوية المؤسسية' : 'Branding & Logo'}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('tender')}
          className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-black flex items-center gap-2 cursor-pointer transition-all ${
            activeSubTab === 'tender'
              ? 'bg-sky-600 text-white shadow-md'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>{isRtl ? 'محددات العطاء والرسوم القانونية' : 'Tender & Statutory Rules'}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('deployment')}
          className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-black flex items-center gap-2 cursor-pointer transition-all ${
            activeSubTab === 'deployment'
              ? 'bg-slate-900 text-white shadow-md'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Server className="w-4 h-4" />
          <span>{isRtl ? 'النشر على السيرفر والنسخ الاحتياطي' : 'Server Deployment & Backup'}</span>
        </button>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* SUB-TAB 1: USERS & ROLES */}
      {/* ------------------------------------------------------------- */}
      {activeSubTab === 'users' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="text-base font-black text-slate-900">
                  {isRtl ? 'حسابات مستخدمي المنظومة' : 'System User Accounts'}
                </h3>
                <p className="text-xs text-slate-500 font-bold mt-0.5">
                  {isRtl
                    ? 'إدارة حسابات أعضاء لجنة التقييم وصلاحيات الوصول والاعتماد'
                    : 'Manage committee member credentials, roles, and administrative privileges'}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={fetchUsers}
                  className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer"
                  title={isRtl ? 'تحديث' : 'Refresh'}
                >
                  <RefreshCw className={`w-4 h-4 ${isLoadingUsers ? 'animate-spin' : ''}`} />
                </button>
                <button
                  type="button"
                  onClick={handleOpenAddUser}
                  className="px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-black flex items-center gap-2 shadow-md cursor-pointer transition-all"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>{isRtl ? 'إضافة مستخدم جديد' : 'Add New User'}</span>
                </button>
              </div>
            </div>

            {/* Users Table */}
            <div className="overflow-x-auto rounded-2xl border border-slate-200/90">
              <table className="w-full text-start text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-700 font-black">
                    <th className="py-3 px-4 text-start">{isRtl ? 'المستخدم' : 'User'}</th>
                    <th className="py-3 px-4 text-start">{isRtl ? 'الاسم والبريد' : 'Name & Email'}</th>
                    <th className="py-3 px-4 text-start">{isRtl ? 'الدور والصلاحية' : 'Role'}</th>
                    <th className="py-3 px-4 text-start">{isRtl ? 'الحالة' : 'Status'}</th>
                    <th className="py-3 px-4 text-start">{isRtl ? 'تاريخ الإنشاء' : 'Created At'}</th>
                    <th className="py-3 px-4 text-center">{isRtl ? 'الإجراءات' : 'Actions'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {usersList.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        {u.username}
                        {u.id === user?.id && (
                          <span className="ms-2 px-1.5 py-0.5 rounded text-[10px] font-black bg-sky-100 text-sky-800">
                            {isRtl ? 'أنت' : 'You'}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-black text-slate-800">{u.name}</div>
                        <div className="text-[11px] text-slate-500">{u.email}</div>
                        {(u.jobTitle || u.department || u.phone) && (
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            {[u.jobTitle, u.department, u.phone].filter(Boolean).join(' • ')}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="space-y-1">
                          {renderRoleBadge(u.role)}
                          {u.permissions && (
                            <div className="flex flex-wrap gap-1 max-w-xs">
                              {u.permissions.manageUsers && (
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-purple-50 text-purple-700 border border-purple-200">
                                  {isRtl ? 'المستخدمين' : 'Users'}
                                </span>
                              )}
                              {u.permissions.manageAiSettings && (
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-indigo-50 text-indigo-700 border border-indigo-200">
                                  AI
                                </span>
                              )}
                              {u.permissions.manageBranding && (
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-amber-50 text-amber-700 border border-amber-200">
                                  {isRtl ? 'الهوية' : 'Branding'}
                                </span>
                              )}
                              {u.permissions.manageTenderRules && (
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-sky-50 text-sky-700 border border-sky-200">
                                  {isRtl ? 'الأوزان' : 'Rules'}
                                </span>
                              )}
                              {u.permissions.manageDeployment && (
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-slate-100 text-slate-700 border border-slate-200">
                                  {isRtl ? 'السيرفر' : 'Server'}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 text-[11px] font-black ${
                          u.isActive ? 'text-emerald-700' : 'text-slate-400'
                        }`}>
                          <span className={`w-2 h-2 rounded-full ${u.isActive ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                          <span>{u.isActive ? (isRtl ? 'نشط' : 'Active') : (isRtl ? 'معطل' : 'Disabled')}</span>
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-500 text-[11px]">
                        {u.createdAt ? u.createdAt.split('T')[0] : '—'}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEditUser(u)}
                            className="p-1.5 rounded-lg text-slate-600 hover:text-sky-700 hover:bg-sky-50 transition-colors cursor-pointer"
                            title={isRtl ? 'تعديل' : 'Edit'}
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          {u.id !== user?.id && (
                            <button
                              type="button"
                              onClick={() => handleDeleteUser(u.id, u.name)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                              title={isRtl ? 'حذف' : 'Delete'}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {usersList.length === 0 && !isLoadingUsers && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        {isRtl ? 'لا يوجد مستخدمون حالياً' : 'No users found'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* SUB-TAB 2: AI PROVIDER (GEMINI VS OPENAI SWITCHER) */}
      {/* ------------------------------------------------------------- */}
      {activeSubTab === 'ai' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-6">
            <div>
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Bot className="w-5 h-5 text-indigo-600" />
                <span>{isRtl ? 'مزود الذكاء الاصطناعي النشط للتحليل المالي والفني' : 'Active AI Engine & Model Selector'}</span>
              </h3>
              <p className="text-xs text-slate-500 font-bold mt-0.5">
                {isRtl
                  ? 'اختر المزود الرئيسي لاستخراج كراسات الشروط، فحص عروض التأمين، وتوليد المقارنات المالية والفنية مع نظام التحويل التلقائي عند الضغط العالي'
                  : 'Toggle between Google Gemini and OpenAI for automated RFP parsing, tender condition binding, and advisory generation'}
              </p>
            </div>

            {/* Resilient Failover Notice */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-indigo-50/80 via-sky-50/80 to-emerald-50/80 border border-indigo-200/80 flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                <Zap className="w-4 h-4 text-amber-300" />
              </div>
              <div className="text-xs leading-relaxed">
                <span className="font-black text-indigo-950 block mb-0.5">
                  {isRtl ? 'نظام التحويل التلقائي الذكي (Automatic Seamless Failover):' : 'Intelligent Dual-Engine Failover System:'}
                </span>
                <span className="font-semibold text-slate-700">
                  {isRtl
                    ? 'تم تعيين OpenAI كالمزود الافتراضي. في حال عدم توفر مفتاح OpenAI أو حدوث أي بطء أو خطأ، يتحول النظام فورياً وتلقائياً إلى محرك Google Gemini الفعّال حالياً دون أي انقطاع في تجربة الاستخدام.'
                    : 'OpenAI is configured as the default engine. If OpenAI is unavailable, has quota limits, or lacks a key, the system automatically falls over to the currently loaded Google Gemini engine with zero downtime.'}
                </span>
              </div>
            </div>

            {/* Provider Switcher Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Card 1: Google Gemini */}
              <div
                onClick={() => setLocalSettings(prev => ({ ...prev, aiProvider: 'gemini' }))}
                className={`p-5 rounded-3xl border-2 transition-all cursor-pointer relative ${
                  localSettings.aiProvider === 'gemini'
                    ? 'border-sky-600 bg-sky-50/40 shadow-md ring-2 ring-sky-100'
                    : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-300'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-xs">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-slate-900">Google Gemini</h4>
                      <div className="text-[11px] font-bold text-sky-800">Gemini 3.8 & 3.1 Architecture</div>
                    </div>
                  </div>
                  {localSettings.aiProvider === 'gemini' && (
                    <span className="px-2.5 py-0.5 rounded-full bg-sky-600 text-white text-[10px] font-black uppercase">
                      {isRtl ? 'المزود النشط' : 'Active Engine'}
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-600 font-medium leading-relaxed mb-4">
                  {isRtl
                    ? 'محرك استدلال فائق السرعة ذو سياق ضخم مدعوم بمجمع فشل تلقائي مرن (Gemini 3.8 Flash + Gemini 3.1 Flash Lite) يضمن عدم توقف العمليات.'
                    : 'High-speed reasoning with massive context window and resilient multi-model failover pool (3.8 Flash, 3.1 Flash Lite, 2.5 Flash).'}
                </p>

                {/* Gemini Model Selector */}
                <div>
                  <label className="block text-[11px] font-black text-slate-700 mb-1">
                    {isRtl ? 'نموذج Gemini الافتراضي' : 'Default Gemini Model'}
                  </label>
                  <select
                    value={localSettings.geminiModel || 'gemini-3.8-flash'}
                    onChange={(e) => setLocalSettings(prev => ({ ...prev, geminiModel: e.target.value }))}
                    className="w-full h-9 px-3 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-800 focus:border-sky-600 outline-hidden"
                  >
                    <option value="gemini-3.8-flash">gemini-3.8-flash (Recommended)</option>
                    <option value="gemini-3.1-flash-lite">gemini-3.1-flash-lite (Ultra Fast)</option>
                    <option value="gemini-2.5-flash">gemini-2.5-flash (Standard)</option>
                    <option value="gemini-flash-latest">gemini-flash-latest</option>
                  </select>
                </div>
              </div>

              {/* Card 2: OpenAI */}
              <div
                onClick={() => setLocalSettings(prev => ({ ...prev, aiProvider: 'openai' }))}
                className={`p-5 rounded-3xl border-2 transition-all cursor-pointer relative ${
                  localSettings.aiProvider === 'openai'
                    ? 'border-indigo-600 bg-indigo-50/40 shadow-md ring-2 ring-indigo-100'
                    : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-300'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-700 flex items-center justify-center text-white shadow-xs">
                      <Zap className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-slate-900">OpenAI</h4>
                      <div className="text-[11px] font-bold text-emerald-800">GPT-4o & o3 Series</div>
                    </div>
                  </div>
                  {localSettings.aiProvider === 'openai' && (
                    <span className="px-2.5 py-0.5 rounded-full bg-indigo-600 text-white text-[10px] font-black uppercase">
                      {isRtl ? 'المزود النشط' : 'Active Engine'}
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-600 font-medium leading-relaxed mb-4">
                  {isRtl
                    ? 'استخدم نماذج OpenAI GPT-4o المتقدمة لتحليل شروط العطاءات واستخراج جداول المنافع بدقة هيكلية عالية بصيغة JSON.'
                    : 'Industry-standard GPT-4o models for forensic contractual document analysis and structured JSON parsing.'}
                </p>

                {/* OpenAI Model Selector */}
                <div>
                  <label className="block text-[11px] font-black text-slate-700 mb-1">
                    {isRtl ? 'نموذج OpenAI الافتراضي' : 'Default OpenAI Model'}
                  </label>
                  <select
                    value={localSettings.openaiModel || 'gpt-4o'}
                    onChange={(e) => setLocalSettings(prev => ({ ...prev, openaiModel: e.target.value }))}
                    className="w-full h-9 px-3 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-800 focus:border-indigo-600 outline-hidden"
                  >
                    <option value="gpt-4o">gpt-4o (Omni Flagship)</option>
                    <option value="gpt-4o-mini">gpt-4o-mini (Cost Efficient)</option>
                    <option value="o3-mini">o3-mini (High Reasoning)</option>
                    <option value="gpt-4-turbo">gpt-4-turbo</option>
                  </select>
                </div>
              </div>

            </div>

            {/* Optional Custom Keys Configuration */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-black text-slate-900">
                    {isRtl ? 'إدارة مفاتيح API للبيئة المستضافة' : 'Hosting Environment API Keys'}
                  </h4>
                  <p className="text-[11px] text-slate-500 font-bold">
                    {isRtl 
                      ? 'يمكنك الاعتماد على ملف .env في السيرفر أو تخصيص المفتاح مباشرة هنا ليتم حفظه بأمان على الخادم.'
                      : 'You can configure keys via .env on your server or provide custom keys securely stored in the server database.'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-black text-slate-700 mb-1">
                    OpenAI API Key
                  </label>
                  <input
                    type="password"
                    value={localSettings.customOpenaiKey || ''}
                    onChange={(e) => setLocalSettings(prev => ({ ...prev, customOpenaiKey: e.target.value }))}
                    placeholder="sk-proj-••••••••••••"
                    className="w-full h-10 px-3 rounded-xl bg-white border border-slate-300 text-xs font-mono font-bold text-slate-800 focus:border-indigo-600 outline-hidden"
                  />
                  <div className="text-[10px] text-slate-400 mt-1 font-bold">
                    {settings.hasCustomOpenaiKey ? (isRtl ? '✓ المفتاح معرف حالياً' : '✓ Key is currently loaded') : (isRtl ? 'غير معرف' : 'Not configured')}
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-black text-slate-700 mb-1">
                    Google Gemini API Key
                  </label>
                  <input
                    type="password"
                    value={localSettings.customGeminiKey || ''}
                    onChange={(e) => setLocalSettings(prev => ({ ...prev, customGeminiKey: e.target.value }))}
                    placeholder="AIzaSy••••••••••••"
                    className="w-full h-10 px-3 rounded-xl bg-white border border-slate-300 text-xs font-mono font-bold text-slate-800 focus:border-sky-600 outline-hidden"
                  />
                  <div className="text-[10px] text-slate-400 mt-1 font-bold">
                    {settings.hasCustomGeminiKey ? (isRtl ? '✓ المفتاح معرف حالياً' : '✓ Key is currently loaded') : (isRtl ? 'غير معرف' : 'Not configured')}
                  </div>
                </div>
              </div>
            </div>

            {/* Test Connection Button & Result */}
            <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleTestAi}
                disabled={isTestingAi}
                className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-black flex items-center gap-2 shadow-md cursor-pointer disabled:opacity-50 transition-all"
              >
                <Zap className={`w-4 h-4 text-amber-400 ${isTestingAi ? 'animate-bounce' : ''}`} />
                <span>
                  {isTestingAi
                    ? (isRtl ? 'جاري فحص الاتصال بالذكاء الاصطناعي...' : 'Testing AI Connection...')
                    : (isRtl ? `فحص جاهزية ${localSettings.aiProvider === 'openai' ? 'OpenAI' : 'Gemini'}` : `Test ${localSettings.aiProvider.toUpperCase()} Connection`)}
                </span>
              </button>

              {aiTestResult && (
                <div className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2.5 animate-in fade-in ${
                  aiTestResult.success
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}>
                  {aiTestResult.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  )}
                  <span>
                    {aiTestResult.success
                      ? (isRtl 
                          ? `الاتصال ناجح بمزود ${aiTestResult.provider} (${aiTestResult.model}) - زمن الاستجابة: ${aiTestResult.latencyMs}ms` 
                          : `Connection successful (${aiTestResult.provider} / ${aiTestResult.model}) in ${aiTestResult.latencyMs}ms`)
                      : aiTestResult.message}
                  </span>
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* SUB-TAB 3: BRANDING & LOGO UPLOAD */}
      {/* ------------------------------------------------------------- */}
      {activeSubTab === 'branding' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-6">
            <div>
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-sky-600" />
                <span>{isRtl ? 'الشعار الرسمي والهوية المؤسسية للتقارير' : 'Official Logo & Organization Branding'}</span>
              </h3>
              <p className="text-xs text-slate-500 font-bold mt-0.5">
                {isRtl
                  ? 'رفع شعار المؤسسة أو الجامعة لطباعته في ترويسة التقارير الرسمية وفي الشريط الجانبي والرئيسي'
                  : 'Upload your organization or university logo to appear on official evaluation reports and the application headers'}
              </p>
            </div>

            {/* Logo Upload Box */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* Dropzone & Selector */}
              <div className="lg:col-span-7 space-y-3">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleLogoFileChange}
                  accept="image/png,image/jpeg,image/svg+xml,image/webp"
                  className="hidden"
                />

                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="p-8 rounded-3xl border-2 border-dashed border-sky-300 hover:border-sky-500 bg-sky-50/30 hover:bg-sky-50/60 transition-all cursor-pointer text-center space-y-3 group"
                >
                  <div className="w-14 h-14 rounded-2xl bg-white shadow-md text-sky-600 flex items-center justify-center mx-auto border border-sky-200 group-hover:scale-105 transition-transform">
                    <UploadCloud className="w-7 h-7" />
                  </div>
                  <div>
                    <div className="text-sm font-black text-slate-900">
                      {isRtl ? 'انقر لرفع الشعار أو اسحب الملف هنا' : 'Click to upload logo or drag and drop'}
                    </div>
                    <div className="text-xs text-slate-500 font-bold mt-1">
                      PNG, JPG, SVG, WebP (Max 8MB)
                    </div>
                  </div>
                </div>

                {logoError && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                    <span>{logoError}</span>
                  </div>
                )}
              </div>

              {/* Preview & Controls */}
              <div className="lg:col-span-5 p-5 rounded-3xl bg-slate-50 border border-slate-200/90 space-y-4">
                <div className="text-xs font-black text-slate-700 flex items-center justify-between">
                  <span>{isRtl ? 'معاينة الشعار الحالي' : 'Logo Preview'}</span>
                  {logoPreview && (
                    <button
                      type="button"
                      onClick={handleRemoveLogo}
                      className="text-rose-600 hover:text-rose-700 text-[11px] font-black cursor-pointer"
                    >
                      {isRtl ? 'إزالة الشعار' : 'Remove'}
                    </button>
                  )}
                </div>

                <div className="h-36 rounded-2xl bg-white border border-slate-200/90 flex items-center justify-center p-4 shadow-2xs overflow-hidden">
                  {logoPreview ? (
                    <img
                      src={logoPreview}
                      alt="Uploaded Logo"
                      style={{ maxWidth: `${localSettings.logoWidth || 160}px` }}
                      className="max-h-28 object-contain"
                    />
                  ) : (
                    <div className="text-center text-slate-400 space-y-1">
                      <Building2 className="w-8 h-8 mx-auto text-slate-300" />
                      <div className="text-xs font-bold">{isRtl ? 'لا يوجد شعار مخصص بعد' : 'No custom logo uploaded'}</div>
                      <div className="text-[10px] text-slate-400">{isRtl ? 'يتم استخدام أيقونة الميزان الافتراضية' : 'Using default scale icon'}</div>
                    </div>
                  )}
                </div>

                {logoPreview && (
                  <div>
                    <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-1">
                      <span>{isRtl ? 'عرض الشعار بالبكسل:' : 'Logo Width:'}</span>
                      <span className="font-mono font-black">{localSettings.logoWidth || 160}px</span>
                    </div>
                    <input
                      type="range"
                      min="90"
                      max="260"
                      step="5"
                      value={localSettings.logoWidth || 160}
                      onChange={(e) => setLocalSettings(prev => ({ ...prev, logoWidth: Number(e.target.value) }))}
                      className="w-full accent-sky-600 cursor-pointer"
                    />
                  </div>
                )}
              </div>

            </div>

            {/* Organization Names Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
              <div>
                <label className="block text-xs font-black text-slate-700 mb-1.5">
                  {isRtl ? 'اسم الجهة أو المنظمة (بالعربية)' : 'Organization Name (Arabic)'}
                </label>
                <input
                  type="text"
                  value={localSettings.organizationNameAr}
                  onChange={(e) => setLocalSettings(prev => ({ ...prev, organizationNameAr: e.target.value }))}
                  className="w-full h-11 px-3.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-bold text-slate-900 focus:bg-white focus:border-sky-600 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 mb-1.5">
                  {isRtl ? 'اسم الجهة أو المنظمة (بالإنجليزية)' : 'Organization Name (English)'}
                </label>
                <input
                  type="text"
                  value={localSettings.organizationNameEn}
                  onChange={(e) => setLocalSettings(prev => ({ ...prev, organizationNameEn: e.target.value }))}
                  className="w-full h-11 px-3.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-bold text-slate-900 focus:bg-white focus:border-sky-600 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 mb-1.5">
                  {isRtl ? 'مسمى لجنة التقييم والترسية (بالعربية)' : 'Tender Committee Title (Arabic)'}
                </label>
                <input
                  type="text"
                  value={localSettings.committeeTitleAr}
                  onChange={(e) => setLocalSettings(prev => ({ ...prev, committeeTitleAr: e.target.value }))}
                  className="w-full h-11 px-3.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-bold text-slate-900 focus:bg-white focus:border-sky-600 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 mb-1.5">
                  {isRtl ? 'مسمى لجنة التقييم والترسية (بالإنجليزية)' : 'Tender Committee Title (English)'}
                </label>
                <input
                  type="text"
                  value={localSettings.committeeTitleEn}
                  onChange={(e) => setLocalSettings(prev => ({ ...prev, committeeTitleEn: e.target.value }))}
                  className="w-full h-11 px-3.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-bold text-slate-900 focus:bg-white focus:border-sky-600 outline-hidden"
                />
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* SUB-TAB 4: TENDER & STATUTORY DEFAULTS */}
      {/* ------------------------------------------------------------- */}
      {activeSubTab === 'tender' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-6">
            <div>
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Sliders className="w-5 h-5 text-emerald-600" />
                <span>{isRtl ? 'محددات التسعير والرسوم القانونية التلقائية' : 'Pricing Formula & Statutory Fee Standards'}</span>
              </h3>
              <p className="text-xs text-slate-500 font-bold mt-0.5">
                {isRtl
                  ? 'ضبط نسب الرسوم القانونية المفروضة على عقود التأمين الطبي والنسبة القياسية لمفاضلة الترسية (60% فني / 40% مالي)'
                  : 'Configure standard statutory fees breakdown and technical/financial trade-off weight ratios'}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <label className="block text-xs font-black text-slate-700 mb-1">
                  {isRtl ? 'نسبة رسوم الإصدار %' : 'Issuance Fee %'}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.001"
                    min="0"
                    max="0.2"
                    value={localSettings.statutoryIssuancePercent}
                    onChange={(e) => setLocalSettings(prev => ({ ...prev, statutoryIssuancePercent: parseFloat(e.target.value) || 0 }))}
                    className="w-full h-10 px-3 rounded-xl bg-white border border-slate-300 font-mono font-bold text-sm text-slate-900"
                  />
                  <span className="text-xs font-bold text-slate-500 font-mono">
                    ({(localSettings.statutoryIssuancePercent * 100).toFixed(1)}%)
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 mt-1">
                  {isRtl ? 'الحد القانوني المعتاد: 4% إلى 5%' : 'Standard legal rate: 4% to 5%'}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <label className="block text-xs font-black text-slate-700 mb-1">
                  {isRtl ? 'نسبة رسوم الطوابع %' : 'Revenue Stamps Fee %'}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.001"
                    min="0"
                    max="0.1"
                    value={localSettings.statutoryStampsPercent}
                    onChange={(e) => setLocalSettings(prev => ({ ...prev, statutoryStampsPercent: parseFloat(e.target.value) || 0 }))}
                    className="w-full h-10 px-3 rounded-xl bg-white border border-slate-300 font-mono font-bold text-sm text-slate-900"
                  />
                  <span className="text-xs font-bold text-slate-500 font-mono">
                    ({(localSettings.statutoryStampsPercent * 100).toFixed(1)}%)
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 mt-1">
                  {isRtl ? 'المعتمد نظاماً: 1% على إجمالي القسط والإصدار' : '1% statutory duty'}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <label className="block text-xs font-black text-slate-700 mb-1">
                  {isRtl ? 'نسبة صندوق ضمان المؤمن له %' : 'Policyholder Guarantee Fund %'}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.0005"
                    min="0"
                    max="0.05"
                    value={localSettings.statutoryGuaranteePercent}
                    onChange={(e) => setLocalSettings(prev => ({ ...prev, statutoryGuaranteePercent: parseFloat(e.target.value) || 0 }))}
                    className="w-full h-10 px-3 rounded-xl bg-white border border-slate-300 font-mono font-bold text-sm text-slate-900"
                  />
                  <span className="text-xs font-bold text-slate-500 font-mono">
                    ({(localSettings.statutoryGuaranteePercent * 100).toFixed(2)}%)
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 mt-1">
                  {isRtl ? 'المعتمد نظاماً: 5 بالألف (0.5%)' : '5 in 1000 (0.5%) standard'}
                </div>
              </div>
            </div>

            {/* Weights and Currency */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div>
                <label className="block text-xs font-black text-slate-700 mb-1">
                  {isRtl ? 'وزن التقييم الفني (%)' : 'Technical Weight (%)'}
                </label>
                <input
                  type="number"
                  min="10"
                  max="90"
                  value={localSettings.defaultTechnicalRatio}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setLocalSettings(prev => ({
                      ...prev,
                      defaultTechnicalRatio: val,
                      defaultFinancialRatio: 100 - val
                    }));
                  }}
                  className="w-full h-10 px-3 rounded-xl bg-slate-50 border border-slate-200 font-mono font-bold text-sm text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 mb-1">
                  {isRtl ? 'وزن التقييم المالي (%)' : 'Financial Weight (%)'}
                </label>
                <input
                  type="number"
                  disabled
                  value={localSettings.defaultFinancialRatio}
                  className="w-full h-10 px-3 rounded-xl bg-slate-100 border border-slate-200 font-mono font-bold text-sm text-slate-500"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 mb-1">
                  {isRtl ? 'العملة الافتراضية' : 'Default Currency'}
                </label>
                <input
                  type="text"
                  value={localSettings.defaultCurrency}
                  onChange={(e) => setLocalSettings(prev => ({ ...prev, defaultCurrency: e.target.value.toUpperCase() }))}
                  className="w-full h-10 px-3 rounded-xl bg-slate-50 border border-slate-200 font-mono font-bold text-sm text-slate-900"
                />
              </div>
            </div>

            {/* Strict No-Bonus toggle */}
            <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/90 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-5 h-5 text-amber-700 shrink-0" />
                <div>
                  <div className="text-xs font-black text-amber-950">
                    {isRtl ? 'تفعيل قاعدة السقوف الصارمة (عدم منح البونص 5/5)' : 'Strict No-Bonus Enforcement (5/5 Cap)'}
                  </div>
                  <div className="text-[11px] text-amber-800 font-medium">
                    {isRtl
                      ? 'منع تضخيم العلامات عند تقديم مزايا تفوق ما طلبته كراسة الشروط لمنع استدراج العطاءات بمزايا غير مطلوبة.'
                      : 'Prevents rating inflation if a company offers beyond 100% of required targets, safeguarding tender neutrality.'}
                  </div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={localSettings.strictNoBonusEnforced}
                onChange={(e) => setLocalSettings(prev => ({ ...prev, strictNoBonusEnforced: e.target.checked }))}
                className="w-5 h-5 accent-sky-600 rounded cursor-pointer"
              />
            </div>

          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* SUB-TAB 5: DEPLOYMENT & SERVER BACKUP */}
      {/* ------------------------------------------------------------- */}
      {activeSubTab === 'deployment' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-6">
            <div>
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Server className="w-5 h-5 text-slate-700" />
                <span>{isRtl ? 'الجاهزية للنشر على الاستضافة المشتركة والسيرفر الخاص' : 'Shared Hosting & Server Deployment Tools'}</span>
              </h3>
              <p className="text-xs text-slate-500 font-bold mt-0.5">
                {isRtl
                  ? 'تأكيد جاهزية النظام، تصدير نسخة احتياطية لكافة البيانات، والتحقق من توافق ملفات الإنتاج'
                  : 'Verify server environment, export full database backups, and inspect production bundle assets'}
              </p>
            </div>

            {/* Quick Health Status Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[11px] font-bold text-emerald-800">{isRtl ? 'حالة السيرفر' : 'Server Status'}</div>
                  <div className="text-sm font-black text-emerald-950">Active (Port 3000)</div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-sky-50/70 border border-sky-200 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-sky-600 text-white flex items-center justify-center">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[11px] font-bold text-sky-800">{isRtl ? 'المزود النشط' : 'Active AI'}</div>
                  <div className="text-sm font-black text-sky-950 uppercase">{settings.aiProvider}</div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[11px] font-bold text-indigo-800">{isRtl ? 'المستخدمون المعتمدون' : 'Registered Users'}</div>
                  <div className="text-sm font-black text-indigo-950">{usersList.length} Accounts</div>
                </div>
              </div>
            </div>

            {/* Actions: Download Backup */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/90 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h4 className="text-xs font-black text-slate-900">
                  {isRtl ? 'تصدير نسخة احتياطية شاملة للنظام (JSON Backup)' : 'Export Full System Backup (JSON)'}
                </h4>
                <p className="text-[11px] text-slate-500 font-bold mt-0.5">
                  {isRtl
                    ? 'تحميل ملف JSON يحتوي على كافة كراسات الشروط، عروض الشركات، حسابات المستخدمين، وإعدادات الشعار لنقلها إلى سيرفرك'
                    : 'Download all tender projects, insurer proposals, actuarial pricing data, and branding configuration'}
                </p>
              </div>

              <button
                type="button"
                onClick={handleExportBackup}
                className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-black flex items-center gap-2 shadow-sm cursor-pointer shrink-0"
              >
                <Download className="w-4 h-4 text-emerald-400" />
                <span>{isRtl ? 'تنزيل ملف النسخة الاحتياطية' : 'Download Backup'}</span>
              </button>
            </div>

            {/* cPanel / Node.js Deployment Quick Checklist */}
            <div className="p-5 rounded-2xl bg-slate-900 text-slate-200 space-y-3 text-xs">
              <h4 className="font-black text-white text-sm flex items-center gap-2">
                <Server className="w-4 h-4 text-sky-400" />
                <span>{isRtl ? 'خطوات الرفع على استضافة cPanel / CloudLinux' : 'Quick Steps to Upload to cPanel / Node.js Host'}</span>
              </h4>
              <ol className="list-decimal list-inside space-y-1.5 text-slate-300 font-medium">
                <li>{isRtl ? 'شغّل npm run build على جهازك لإنشاء مجلد dist وملف dist/server.cjs.' : 'Run npm run build locally to generate the dist/ directory and dist/server.cjs.'}</li>
                <li>{isRtl ? 'من لوحة cPanel، افتح Setup Node.js App واختر Node.js 18 أو 20.' : 'In cPanel, click "Setup Node.js App" and choose Node.js 18 or 20.'}</li>
                <li>{isRtl ? 'ارفع مجلد dist و package.json وملف .env.' : 'Upload the dist/ folder, package.json, and .env file.'}</li>
                <li>{isRtl ? 'اضغط Run NPM Install ثم Restart لبدء تشغيل التطبيق بأمان.' : 'Click "Run NPM Install" then "Restart" to launch your production applet.'}</li>
              </ol>
            </div>

          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* USER MODAL (ADD / EDIT) */}
      {/* ------------------------------------------------------------- */}
      {userModalMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div 
            className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200"
            dir={isRtl ? 'rtl' : 'ltr'}
          >
            <div className="bg-slate-900 p-5 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center border border-sky-500/30">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black">
                    {userModalMode === 'add'
                      ? (isRtl ? 'إضافة مستخدم جديد للنظام' : 'Add New User')
                      : (isRtl ? 'تعديل بيانات المستخدم' : 'Edit User Account')}
                  </h3>
                  <div className="text-[11px] text-slate-400 font-bold">
                    {userModalMode === 'add' ? (isRtl ? 'تعيين الصلاحيات وكلمة المرور' : 'Set credentials & role') : selectedUser?.username}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setUserModalMode(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/80 hover:text-white transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="p-6 space-y-4">
              {userFormError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{userFormError}</span>
                </div>
              )}

              {userFormSuccess && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>{userFormSuccess}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1">
                    {isRtl ? 'اسم المستخدم (Username)' : 'Username'}
                  </label>
                  <input
                    type="text"
                    disabled={userModalMode === 'edit'}
                    value={formUsername}
                    onChange={(e) => setFormUsername(e.target.value)}
                    placeholder="e.g. auditor"
                    className="w-full h-10 px-3 rounded-xl bg-slate-50 disabled:bg-slate-100 border border-slate-200 text-xs font-mono font-bold text-slate-900 focus:bg-white focus:border-sky-600 outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1">
                    {isRtl ? 'الاسم المعروض' : 'Full Name'}
                  </label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder={isRtl ? 'د. فلان الفلاني' : 'John Doe'}
                    className="w-full h-10 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:bg-white focus:border-sky-600 outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1">
                    {isRtl ? 'البريد الإلكتروني' : 'Email Address'}
                  </label>
                  <input
                    type="email"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="user@organization.com"
                    className="w-full h-10 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:bg-white focus:border-sky-600 outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1">
                    {isRtl ? 'الدور الوظيفي الرئيسي' : 'Primary Role'}
                  </label>
                  <select
                    value={formRole}
                    onChange={(e) => handleRoleChange(e.target.value as UserRole)}
                    className="w-full h-10 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-black text-slate-900 focus:bg-white focus:border-sky-600 outline-hidden"
                  >
                    <option value="super_admin">{isRtl ? 'مدير عام للنظام (Super Admin) - كامل الصلاحيات' : 'Super Admin (Full Access)'}</option>
                    <option value="committee_admin">{isRtl ? 'رئيس لجنة العطاء (Committee Admin) - إدارة الفحص' : 'Committee Admin (Tender Head)'}</option>
                    <option value="evaluator">{isRtl ? 'مقيّم فني ومالي (Evaluator) - إدخال وتحليل' : 'Evaluator (Scoring & Analysis)'}</option>
                    <option value="viewer">{isRtl ? 'مستعرض تقارير فقط (Viewer) - قراءة وتدقيق' : 'Viewer (Read-only)'}</option>
                  </select>
                </div>
              </div>

              {/* Fine-grained Role Permissions Checklist (Check/Uncheck Options) */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-sky-600" />
                    <span className="text-xs font-black text-slate-900">
                      {isRtl ? 'تحديد صلاحيات هذا المستخدم (تفعيل / إلغاء)' : 'Role Permissions (Check / Uncheck Access)'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const defaults = DEFAULT_ROLE_PERMISSIONS[formRole] || DEFAULT_ROLE_PERMISSIONS.viewer;
                      setFormPermissions({ ...defaults });
                    }}
                    className="text-[11px] font-bold text-sky-700 hover:text-sky-800 underline cursor-pointer"
                  >
                    {isRtl ? 'استعادة الافتراضي للدور' : 'Reset to Role Defaults'}
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  {/* manageUsers */}
                  <label className="flex items-start gap-2.5 p-2.5 rounded-xl bg-white border border-slate-200/80 cursor-pointer hover:border-sky-300 transition-colors">
                    <input
                      type="checkbox"
                      checked={formPermissions.manageUsers}
                      onChange={() => togglePermission('manageUsers')}
                      className="mt-0.5 w-4 h-4 accent-sky-600 rounded cursor-pointer"
                    />
                    <div>
                      <div className="text-xs font-black text-slate-800">
                        {isRtl ? 'إدارة المستخدمين والأدوار' : 'Manage Users & Roles'}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {isRtl ? 'إنشاء وتعديل وحذف حسابات المستخدمين وتعيين الصلاحيات' : 'Create, edit, delete users and adjust permissions'}
                      </div>
                    </div>
                  </label>

                  {/* manageAiSettings */}
                  <label className="flex items-start gap-2.5 p-2.5 rounded-xl bg-white border border-slate-200/80 cursor-pointer hover:border-sky-300 transition-colors">
                    <input
                      type="checkbox"
                      checked={formPermissions.manageAiSettings}
                      onChange={() => togglePermission('manageAiSettings')}
                      className="mt-0.5 w-4 h-4 accent-sky-600 rounded cursor-pointer"
                    />
                    <div>
                      <div className="text-xs font-black text-slate-800">
                        {isRtl ? 'إعدادات الذكاء الاصطناعي (AI)' : 'AI Provider & Models'}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {isRtl ? 'التبديل بين Gemini و OpenAI وتعديل مفاتيح الربط والموديلات' : 'Configure Gemini / OpenAI keys, models, and test connections'}
                      </div>
                    </div>
                  </label>

                  {/* manageBranding */}
                  <label className="flex items-start gap-2.5 p-2.5 rounded-xl bg-white border border-slate-200/80 cursor-pointer hover:border-sky-300 transition-colors">
                    <input
                      type="checkbox"
                      checked={formPermissions.manageBranding}
                      onChange={() => togglePermission('manageBranding')}
                      className="mt-0.5 w-4 h-4 accent-sky-600 rounded cursor-pointer"
                    />
                    <div>
                      <div className="text-xs font-black text-slate-800">
                        {isRtl ? 'الهوية والشعار المؤسسي' : 'Branding & Logo'}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {isRtl ? 'تحديث مسميات الجامعة واللجنة ورفع وتغيير الشعار' : 'Upload custom logos, update organization & committee titles'}
                      </div>
                    </div>
                  </label>

                  {/* manageTenderRules */}
                  <label className="flex items-start gap-2.5 p-2.5 rounded-xl bg-white border border-slate-200/80 cursor-pointer hover:border-sky-300 transition-colors">
                    <input
                      type="checkbox"
                      checked={formPermissions.manageTenderRules}
                      onChange={() => togglePermission('manageTenderRules')}
                      className="mt-0.5 w-4 h-4 accent-sky-600 rounded cursor-pointer"
                    />
                    <div>
                      <div className="text-xs font-black text-slate-800">
                        {isRtl ? 'محددات العطاء والرسوم القانونية' : 'Tender & Statutory Rules'}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {isRtl ? 'تعديل نسب الأوزان الفنية والمالية ورسوم الطوابع ورسوم العقد' : 'Set technical/financial weights, stamp duties, and guarantee fees'}
                      </div>
                    </div>
                  </label>

                  {/* manageDeployment */}
                  <label className="flex items-start gap-2.5 p-2.5 rounded-xl bg-white border border-slate-200/80 cursor-pointer hover:border-sky-300 transition-colors">
                    <input
                      type="checkbox"
                      checked={formPermissions.manageDeployment}
                      onChange={() => togglePermission('manageDeployment')}
                      className="mt-0.5 w-4 h-4 accent-sky-600 rounded cursor-pointer"
                    />
                    <div>
                      <div className="text-xs font-black text-slate-800">
                        {isRtl ? 'النشر على السيرفر والنسخ الاحتياطي' : 'Deployment & Backups'}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {isRtl ? 'الوصول لأدوات نشر cPanel والنسخ الاحتياطي الكامل' : 'Access cPanel/Cloud hosting deployment tools and JSON backup'}
                      </div>
                    </div>
                  </label>

                  {/* exportReports */}
                  <label className="flex items-start gap-2.5 p-2.5 rounded-xl bg-white border border-slate-200/80 cursor-pointer hover:border-sky-300 transition-colors">
                    <input
                      type="checkbox"
                      checked={formPermissions.exportReports}
                      onChange={() => togglePermission('exportReports')}
                      className="mt-0.5 w-4 h-4 accent-sky-600 rounded cursor-pointer"
                    />
                    <div>
                      <div className="text-xs font-black text-slate-800">
                        {isRtl ? 'تصدير التقارير و Excel / PDF' : 'Export Reports & Files'}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {isRtl ? 'تصدير جداول المفاضلة ومحاضر الترسية بصيغ Excel و PDF' : 'Export comparison tables, executive summaries, and award letters'}
                      </div>
                    </div>
                  </label>

                  {/* editProposals */}
                  <label className="flex items-start gap-2.5 p-2.5 rounded-xl bg-white border border-slate-200/80 cursor-pointer hover:border-sky-300 transition-colors">
                    <input
                      type="checkbox"
                      checked={formPermissions.editProposals}
                      onChange={() => togglePermission('editProposals')}
                      className="mt-0.5 w-4 h-4 accent-sky-600 rounded cursor-pointer"
                    />
                    <div>
                      <div className="text-xs font-black text-slate-800">
                        {isRtl ? 'إدخال وتعديل عروض الشركات' : 'Edit Proposals & Rates'}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {isRtl ? 'تعديل أسعار التأمين وتغطيات الشركات ومطابقة المنافع' : 'Modify financial premiums, benefit requirements, and company offers'}
                      </div>
                    </div>
                  </label>

                  {/* viewAudit */}
                  <label className="flex items-start gap-2.5 p-2.5 rounded-xl bg-white border border-slate-200/80 cursor-pointer hover:border-sky-300 transition-colors">
                    <input
                      type="checkbox"
                      checked={formPermissions.viewAudit}
                      onChange={() => togglePermission('viewAudit')}
                      className="mt-0.5 w-4 h-4 accent-sky-600 rounded cursor-pointer"
                    />
                    <div>
                      <div className="text-xs font-black text-slate-800">
                        {isRtl ? 'سجل التدقيق والتوافق النظامي' : 'Audit Logs & Compliance'}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {isRtl ? 'استعراض سجلات الدخول وتعديلات التقييم والفحص الفني' : 'Inspect user activity audit trails and evaluation compliance'}
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1">
                    {isRtl ? 'رقم الهاتف / الجوال' : 'Phone / Mobile'}
                  </label>
                  <input
                    type="tel"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="+962... / +966..."
                    className="w-full h-10 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:bg-white focus:border-sky-600 outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1">
                    {isRtl ? 'المسمى الوظيفي' : 'Job Title'}
                  </label>
                  <input
                    type="text"
                    value={formJobTitle}
                    onChange={(e) => setFormJobTitle(e.target.value)}
                    placeholder={isRtl ? 'مستشار مالي وتأميني / مقيّم' : 'Financial Consultant'}
                    className="w-full h-10 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:bg-white focus:border-sky-600 outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 mb-1">
                  {isRtl ? 'الإدارة / القسم' : 'Department / Committee'}
                </label>
                <input
                  type="text"
                  value={formDepartment}
                  onChange={(e) => setFormDepartment(e.target.value)}
                  placeholder={isRtl ? 'لجنة فحص عطاءات التأمين' : 'Tender Evaluation Committee'}
                  className="w-full h-10 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:bg-white focus:border-sky-600 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 mb-1">
                  {userModalMode === 'add' 
                    ? (isRtl ? 'كلمة المرور الأولية' : 'Initial Password')
                    : (isRtl ? 'كلمة المرور الجديدة (اتركه فارغاً للإبقاء على الحالية)' : 'New Password (leave blank to keep current)')}
                </label>
                <input
                  type="password"
                  value={formPassword}
                  onChange={(e) => setFormPassword(e.target.value)}
                  placeholder={userModalMode === 'add' ? '••••••••' : (isRtl ? 'اتركه فارغاً دون تغيير' : 'Leave blank')}
                  className="w-full h-10 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:bg-white focus:border-sky-600 outline-hidden"
                />
              </div>

              {userModalMode === 'edit' && (
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="isActiveCheck"
                    checked={formIsActive}
                    onChange={(e) => setFormIsActive(e.target.checked)}
                    className="w-4 h-4 accent-sky-600 rounded cursor-pointer"
                  />
                  <label htmlFor="isActiveCheck" className="text-xs font-black text-slate-800 cursor-pointer">
                    {isRtl ? 'حساب نشط ومفعّل لتسجيل الدخول' : 'Active Account (allow login)'}
                  </label>
                </div>
              )}

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setUserModalMode(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  {isRtl ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-black shadow-md cursor-pointer"
                >
                  {userModalMode === 'add'
                    ? (isRtl ? 'إضافة المستخدم' : 'Create User')
                    : (isRtl ? 'حفظ التعديلات' : 'Save Changes')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
