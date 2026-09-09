import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  Mail,
  Phone,
  Building2,
  Briefcase,
  FileText,
  KeyRound,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Save,
  Clock,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../i18n/I18nContext';

export const UserProfileModal: React.FC = () => {
  const { user, profileModalOpen, setProfileModalOpen, updateProfile } = useAuth();
  const { isRtl } = useI18n();

  // Profile Fields
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [department, setDepartment] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [bio, setBio] = useState('');
  const [avatar, setAvatar] = useState('');

  // Password Fields
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);

  // States
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'profile' | 'security'>('profile');

  // Populate form with current user details when modal opens
  useEffect(() => {
    if (user && profileModalOpen) {
      setName(user.name || '');
      setUsername(user.username || '');
      setEmail(user.email || '');
      setPhone(user.phone || '');
      setDepartment(user.department || '');
      setJobTitle(user.jobTitle || '');
      setBio(user.bio || '');
      setAvatar(user.avatar || '');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setMessage(null);
    }
  }, [user, profileModalOpen]);

  if (!profileModalOpen || !user) return null;

  const roleLabels: Record<string, { ar: string; en: string; color: string }> = {
    super_admin: {
      ar: 'مدير عام النظام التنفيذي (Super Admin)',
      en: 'Executive Super Admin',
      color: 'bg-rose-50 text-rose-800 border-rose-200'
    },
    committee_admin: {
      ar: 'رئيس لجنة العطاءات (Committee Admin)',
      en: 'Committee Lead Admin',
      color: 'bg-indigo-50 text-indigo-800 border-indigo-200'
    },
    evaluator: {
      ar: 'عضو مقيّم فني ومالي (Evaluator)',
      en: 'Technical & Financial Evaluator',
      color: 'bg-emerald-50 text-emerald-800 border-emerald-200'
    },
    viewer: {
      ar: 'مستعرض ومدقق معتمد (Viewer)',
      en: 'Auditor & Observer',
      color: 'bg-slate-50 text-slate-800 border-slate-200'
    }
  };

  const currentRole = roleLabels[user.role] || {
    ar: user.role,
    en: user.role,
    color: 'bg-slate-100 text-slate-800 border-slate-200'
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 1.5 * 1024 * 1024) {
      setMessage({
        type: 'error',
        text: isRtl ? 'حجم الصورة يجب ألا يتجاوز 1.5 ميغابايت' : 'Avatar image must not exceed 1.5 MB'
      });
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === 'string') {
        setAvatar(event.target.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    // Validation
    if (!name.trim()) {
      setMessage({
        type: 'error',
        text: isRtl ? 'يرجى إدخال الاسم بالكامل' : 'Please enter your full name'
      });
      return;
    }

    if (!username.trim() || username.trim().length < 3) {
      setMessage({
        type: 'error',
        text: isRtl ? 'اسم المستخدم يجب ألا يقل عن 3 أحرف' : 'Username must be at least 3 characters'
      });
      return;
    }

    if (!email.trim() || !email.includes('@')) {
      setMessage({
        type: 'error',
        text: isRtl ? 'يرجى إدخال بريد إلكتروني صحيح' : 'Please enter a valid email address'
      });
      return;
    }

    // If changing password
    if (newPassword || currentPassword) {
      if (!currentPassword) {
        setMessage({
          type: 'error',
          text: isRtl
            ? 'يرجى إدخال كلمة المرور الحالية لتأكيد التغيير'
            : 'Current password is required to change password'
        });
        return;
      }
      if (newPassword.length < 6) {
        setMessage({
          type: 'error',
          text: isRtl
            ? 'كلمة المرور الجديدة يجب ألا تقل عن 6 أحرف'
            : 'New password must be at least 6 characters'
        });
        return;
      }
      if (newPassword !== confirmPassword) {
        setMessage({
          type: 'error',
          text: isRtl ? 'كلمة المرور الجديدة غير متطابقة' : 'New passwords do not match'
        });
        return;
      }
    }

    setIsSaving(true);

    try {
      const res = await updateProfile({
        name: name.trim(),
        username: username.trim(),
        email: email.trim(),
        phone: phone.trim(),
        department: department.trim(),
        jobTitle: jobTitle.trim(),
        bio: bio.trim(),
        avatar: avatar || undefined,
        currentPassword: currentPassword || undefined,
        newPassword: newPassword || undefined
      });

      if (!res.success) {
        setMessage({ type: 'error', text: res.error || (isRtl ? 'فشل التحديث' : 'Update failed') });
      } else {
        setMessage({
          type: 'success',
          text: isRtl
            ? 'تم حفظ وتحديث بيانات الملف الشخصي بنجاح'
            : 'Profile details saved and updated successfully'
        });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => {
          setMessage(null);
        }, 2500);
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'An unexpected error occurred' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/65 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        dir={isRtl ? 'rtl' : 'ltr'}
      >
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 text-white relative shrink-0">
          <button
            type="button"
            onClick={() => setProfileModalOpen(false)}
            className="absolute top-5 end-5 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/80 hover:text-white transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
            {/* Avatar with image or initials */}
            <div className="relative group">
              {avatar ? (
                <img
                  src={avatar}
                  alt={name}
                  className="w-18 h-18 rounded-2xl object-cover border-2 border-indigo-400 shadow-md bg-white"
                />
              ) : (
                <div className="w-18 h-18 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 text-white flex items-center justify-center text-2xl font-black border-2 border-indigo-300 shadow-md">
                  {name.charAt(0) || user.username.charAt(0).toUpperCase()}
                </div>
              )}
              <label
                className="absolute -bottom-1.5 -end-1.5 w-7 h-7 rounded-lg bg-white text-slate-800 shadow-md flex items-center justify-center border border-slate-200 cursor-pointer hover:bg-indigo-50 hover:text-indigo-600 transition-all"
                title={isRtl ? 'تغيير الصورة الشخصية' : 'Change Avatar'}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
              </label>
            </div>

            <div className="text-center sm:text-start flex-1 min-w-0">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h3 className="text-xl font-black tracking-tight text-white truncate">{name || user.name}</h3>
                <span className="text-xs font-mono text-indigo-300 bg-white/10 px-2 py-0.5 rounded-lg border border-white/10">
                  @{username || user.username}
                </span>
              </div>

              <div className="mt-2 flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <span
                  className={`inline-flex items-center gap-1.5 text-xs font-black px-2.5 py-1 rounded-xl border ${currentRole.color}`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>{isRtl ? currentRole.ar : currentRole.en}</span>
                </span>
                {department && (
                  <span className="inline-flex items-center gap-1 text-xs text-slate-300 bg-white/5 px-2.5 py-1 rounded-xl border border-white/10">
                    <Building2 className="w-3 h-3 text-indigo-400" />
                    <span>{department}</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex gap-2 mt-5 border-t border-white/10 pt-4">
            <button
              type="button"
              onClick={() => setActiveTab('profile')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'profile'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'bg-white/10 text-white/80 hover:bg-white/15'
              }`}
            >
              <User className="w-4 h-4" />
              <span>{isRtl ? 'المعلومات الشخصية والوظيفية' : 'Personal & Job Info'}</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('security')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'security'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'bg-white/10 text-white/80 hover:bg-white/15'
              }`}
            >
              <Lock className="w-4 h-4" />
              <span>{isRtl ? 'الأمان وتغيير كلمة المرور' : 'Security & Password'}</span>
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {message && (
            <div
              className={`p-3.5 rounded-2xl flex items-center gap-3 text-xs font-bold animate-in fade-in duration-150 ${
                message.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}
            >
              {message.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              )}
              <span>{message.text}</span>
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Full Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    {isRtl ? 'الاسم الكامل' : 'Full Name'} <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      placeholder={isRtl ? 'مثال: د. طارق الأحمد' : 'e.g. Dr. John Doe'}
                      className="w-full h-11 ps-10 pe-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 font-medium text-slate-800"
                    />
                    <User className={`w-4 h-4 text-slate-400 absolute top-3.5 ${isRtl ? 'right-3' : 'left-3'}`} />
                  </div>
                </div>

                {/* Username */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    {isRtl ? 'اسم المستخدم (تسجيل الدخول)' : 'Username (Login ID)'}{' '}
                    <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value.toLowerCase())}
                      required
                      placeholder="e.g. admin"
                      className="w-full h-11 ps-10 pe-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 font-mono text-slate-800"
                    />
                    <span className={`text-xs font-bold text-slate-400 absolute top-3.5 ${isRtl ? 'right-3' : 'left-3'}`}>
                      @
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Email Address */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    {isRtl ? 'البريد الإلكتروني' : 'Email Address'} <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="user@organization.local"
                      className="w-full h-11 ps-10 pe-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 font-medium text-slate-800"
                    />
                    <Mail className={`w-4 h-4 text-slate-400 absolute top-3.5 ${isRtl ? 'right-3' : 'left-3'}`} />
                  </div>
                </div>

                {/* Phone Number */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    {isRtl ? 'رقم الهاتف / الجوال' : 'Phone / Mobile'}
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder={isRtl ? '+962 7 9000 0000 أو +966...' : '+1 (555) 000-0000'}
                      className="w-full h-11 ps-10 pe-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 font-medium text-slate-800"
                    />
                    <Phone className={`w-4 h-4 text-slate-400 absolute top-3.5 ${isRtl ? 'right-3' : 'left-3'}`} />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Job Title / Role */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    {isRtl ? 'المسمى الوظيفي' : 'Job Title / Designation'}
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={jobTitle}
                      onChange={(e) => setJobTitle(e.target.value)}
                      placeholder={isRtl ? 'مثال: مستشار مالي وتأميني / رئيس قسم العطاءات' : 'e.g. Senior Procurement Consultant'}
                      className="w-full h-11 ps-10 pe-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 font-medium text-slate-800"
                    />
                    <Briefcase className={`w-4 h-4 text-slate-400 absolute top-3.5 ${isRtl ? 'right-3' : 'left-3'}`} />
                  </div>
                </div>

                {/* Department / Unit */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    {isRtl ? 'الإدارة / القسم' : 'Department / Organization Unit'}
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      placeholder={isRtl ? 'مثال: لجنة تقييم مناقصات التأمين الطبي' : 'e.g. Medical Tender Evaluation Board'}
                      className="w-full h-11 ps-10 pe-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 font-medium text-slate-800"
                    />
                    <Building2 className={`w-4 h-4 text-slate-400 absolute top-3.5 ${isRtl ? 'right-3' : 'left-3'}`} />
                  </div>
                </div>
              </div>

              {/* Bio / Professional Specialty */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  {isRtl ? 'نبذة مختصرة / التخصص والمهام' : 'Bio / Professional Notes'}
                </label>
                <div className="relative">
                  <textarea
                    rows={3}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder={
                      isRtl
                        ? 'ملاحظات حول الخبرة المهنية أو الصلاحيات الخاصة في تدقيق عطاءات التأمين...'
                        : 'Brief note on expertise, credentials, or evaluation specialties...'
                    }
                    className="w-full p-3 ps-10 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 font-medium text-slate-800 resize-none"
                  />
                  <FileText className={`w-4 h-4 text-slate-400 absolute top-3.5 ${isRtl ? 'right-3' : 'left-3'}`} />
                </div>
              </div>

              {/* Metadata Info Cards */}
              <div className="pt-2 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-3">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <div>
                    <div className="text-[10px] text-slate-500 font-bold">
                      {isRtl ? 'تاريخ إنشاء الحساب' : 'Account Created'}
                    </div>
                    <div className="text-xs font-semibold text-slate-700">
                      {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '-'}
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-3">
                  <KeyRound className="w-4 h-4 text-slate-400" />
                  <div>
                    <div className="text-[10px] text-slate-500 font-bold">
                      {isRtl ? 'آخر تسجيل دخول' : 'Last Login Activity'}
                    </div>
                    <div className="text-xs font-semibold text-slate-700">
                      {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : isRtl ? 'الجلسة الحالية' : 'Current Session'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-4">
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3 text-amber-900 text-xs leading-relaxed">
                <KeyRound className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold mb-0.5">{isRtl ? 'أمان كلمة المرور' : 'Password Security Requirements'}</div>
                  <div>
                    {isRtl
                      ? 'لتحديث كلمة المرور الخاصة بك، يجب إدخال كلمة المرور الحالية أولاً للتحقق من هويتك، ويجب ألا تقل كلمة المرور الجديدة عن 6 خانات.'
                      : 'To update your password, your current password is required for identity verification. New password must be at least 6 characters.'}
                  </div>
                </div>
              </div>

              {/* Current Password */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  {isRtl ? 'كلمة المرور الحالية' : 'Current Password'} <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPass ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full h-11 ps-10 pe-10 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 font-mono text-slate-800"
                  />
                  <Lock className={`w-4 h-4 text-slate-400 absolute top-3.5 ${isRtl ? 'right-3' : 'left-3'}`} />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPass(!showCurrentPass)}
                    className={`absolute top-3 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer ${
                      isRtl ? 'left-3' : 'right-3'
                    }`}
                  >
                    {showCurrentPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  {isRtl ? 'كلمة المرور الجديدة' : 'New Password'} <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showNewPass ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full h-11 ps-10 pe-10 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 font-mono text-slate-800"
                  />
                  <KeyRound className={`w-4 h-4 text-slate-400 absolute top-3.5 ${isRtl ? 'right-3' : 'left-3'}`} />
                  <button
                    type="button"
                    onClick={() => setShowNewPass(!showNewPass)}
                    className={`absolute top-3 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer ${
                      isRtl ? 'left-3' : 'right-3'
                    }`}
                  >
                    {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {newPassword && (
                  <div className="mt-1.5 flex items-center gap-2">
                    <div className="h-1.5 flex-1 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          newPassword.length < 6
                            ? 'w-1/3 bg-rose-500'
                            : newPassword.length < 10
                            ? 'w-2/3 bg-amber-500'
                            : 'w-full bg-emerald-500'
                        }`}
                      />
                    </div>
                    <span className="text-[10px] font-bold text-slate-500">
                      {newPassword.length < 6
                        ? isRtl ? 'قصيرة جداً' : 'Too short'
                        : newPassword.length < 10
                        ? isRtl ? 'متوسطة القوة' : 'Medium strength'
                        : isRtl ? 'قوية وممتازة' : 'Strong password'}
                    </span>
                  </div>
                )}
              </div>

              {/* Confirm New Password */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  {isRtl ? 'تأكيد كلمة المرور الجديدة' : 'Confirm New Password'} <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className={`w-full h-11 ps-10 pe-3 text-sm bg-slate-50 border rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 font-mono text-slate-800 ${
                      confirmPassword && newPassword !== confirmPassword
                        ? 'border-rose-300 focus:border-rose-500'
                        : 'border-slate-200 focus:border-indigo-500'
                    }`}
                  />
                  <Lock className={`w-4 h-4 text-slate-400 absolute top-3.5 ${isRtl ? 'right-3' : 'left-3'}`} />
                </div>
                {confirmPassword && newPassword !== confirmPassword && (
                  <p className="text-[11px] text-rose-600 font-bold mt-1">
                    {isRtl ? 'كلمات المرور غير متطابقة' : 'Passwords do not match'}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Footer Controls */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setProfileModalOpen(false)}
              className="h-11 px-5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold transition-all cursor-pointer"
            >
              {isRtl ? 'إلغاء' : 'Cancel'}
            </button>

            <button
              type="submit"
              disabled={isSaving}
              className="h-11 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>
                {isSaving
                  ? isRtl
                    ? 'جاري حفظ التعديلات...'
                    : 'Saving Changes...'
                  : isRtl
                  ? 'حفظ التعديلات'
                  : 'Save Changes'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
