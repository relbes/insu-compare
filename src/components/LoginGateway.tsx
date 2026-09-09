import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  LogIn, 
  AlertCircle, 
  Globe, 
  CheckCircle2,
  Loader2,
  Sun,
  Moon
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../i18n/I18nContext';
import { useSettings } from '../context/SettingsContext';
import { useTheme } from '../context/ThemeContext';

export const LoginGateway: React.FC = () => {
  const { login, isCheckingAuth } = useAuth();
  const { isRtl, language, toggleLanguage } = useI18n();
  const { settings } = useSettings();
  const { isDark, toggleTheme } = useTheme();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [logoLoadError, setLogoLoadError] = useState(false);

  useEffect(() => {
    setLogoLoadError(false);
  }, [settings.logoUrl]);

  // Active logo: fetched dynamically from admin panel settings, with local AOU logo as default
  const activeLogoUrl = !logoLoadError && settings.logoUrl 
    ? settings.logoUrl 
    : '/logo.png';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setErrorMessage(
        isRtl 
          ? 'يرجى إدخال اسم المستخدم وكلمة المرور' 
          : 'Please enter both username and password'
      );
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    const result = await login(username.trim(), password);
    setIsLoading(false);

    if (!result.success) {
      setErrorMessage(
        result.error || 
        (isRtl ? 'بيانات الدخول غير صحيحة، يرجى التحقق وإعادة المحاولة' : 'Invalid credentials, please verify and try again')
      );
    }
  };

  if (isCheckingAuth) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center p-4 transition-colors ${
        isDark ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-800'
      }`}>
        <div className="w-16 h-16 rounded-2xl bg-blue-600/10 border border-blue-500/30 flex items-center justify-center animate-pulse mb-4">
          <ShieldCheck className="w-8 h-8 text-blue-600 dark:text-blue-400" />
        </div>
        <p className="text-sm font-bold">
          {isRtl ? 'جارٍ التحقق من جلسة العمل...' : 'Verifying session...'}
        </p>
      </div>
    );
  }

  return (
    <div 
      className={`min-h-screen w-full flex flex-col lg:flex-row transition-colors duration-200 ${
        isDark 
          ? 'bg-slate-950 text-slate-100' 
          : 'bg-slate-50 text-slate-900'
      }`}
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      {/* ========================================================
          LEFT (or RIGHT in RTL) 50% SPLIT: INSTITUTIONAL SHOWCASE
         ======================================================== */}
      <section 
        className={`w-full lg:w-1/2 flex flex-col justify-between p-6 sm:p-10 lg:p-14 relative overflow-hidden border-b lg:border-b-0 ${
          isRtl ? 'lg:border-s' : 'lg:border-e'
        } ${
          isDark 
            ? 'bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950/40 border-slate-800/80 text-white' 
            : 'bg-gradient-to-br from-blue-50/80 via-white to-slate-100/90 border-slate-200/90 text-slate-900 shadow-xs'
        }`}
      >
        {/* Subtle Ambient Glow */}
        <div className="absolute top-0 start-0 w-80 h-80 bg-blue-500/10 dark:bg-blue-600/15 rounded-full blur-3xl pointer-events-none -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 end-0 w-96 h-96 bg-emerald-500/10 dark:bg-emerald-600/10 rounded-full blur-3xl pointer-events-none translate-x-1/3 translate-y-1/3" />

        {/* Institutional Header with Official University Logo (Single Placement) */}
        <div className="relative z-10 space-y-6">
          <div className="inline-block">
            <div className={`p-3.5 sm:p-4 rounded-2xl border transition-all ${
              isDark 
                ? 'bg-white border-slate-700 shadow-lg shadow-black/30' 
                : 'bg-white border-slate-200/90 shadow-md shadow-slate-200/60'
            }`}>
              <img 
                src={activeLogoUrl} 
                alt="Arab Open University - Jordan" 
                onError={() => setLogoLoadError(true)}
                className="h-16 sm:h-20 w-auto object-contain"
              />
            </div>
          </div>

          {/* User-Requested Required Notice Badge */}
          <div className="pt-1">
            <div className={`inline-flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm sm:text-base font-bold border transition-colors ${
              isDark 
                ? 'bg-blue-950/60 border-blue-800/80 text-blue-200' 
                : 'bg-blue-50 border-blue-200/90 text-[#0F3876] shadow-xs'
            }`}>
              <Lock className="w-4.5 h-4.5 text-blue-600 dark:text-blue-400 shrink-0" />
              <span>
                {isRtl 
                  ? 'للدخول الى المنصة  يجب ان يكون لديك حساب' 
                  : 'To access the platform, you must have an account'}
              </span>
            </div>
          </div>

          {/* Main Title & Description */}
          <div className="space-y-3 pt-2">
            <h1 className="text-2xl sm:text-3xl lg:text-[2.35rem] font-black tracking-tight leading-tight text-slate-900 dark:text-white">
              {isRtl 
                ? 'الجامعة العربية المفتوحة - نظام مقارنة للتأمين الطبي للعاملين' 
                : 'Arab Open University - Staff Medical Insurance Comparison System'}
            </h1>
            <p className="text-base sm:text-lg leading-relaxed text-slate-600 dark:text-slate-300 max-w-xl font-medium">
              {isRtl
                ? 'منظومة إدارية موحدة لمقارنة وتدقيق عروض التأمين الطبي لمنسوبي الجامعة، مطابقة الشروط والمنافع، وحساب الأقساط والنتائج المالية بدقة وشفافية وفق المعايير والتعليمات المعتمدة.'
                : 'A unified procurement platform to audit and compare staff medical insurance proposals, cross-examine benefits, and compute financial outcomes with precision, transparency, and approved criteria.'}
            </p>
          </div>
        </div>

        {/* Institutional Bottom Metadata */}
        <div className="relative z-10 pt-8 mt-6 border-t border-slate-200/60 dark:border-slate-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
            <span className="font-bold">
              {isRtl ? 'منصة التقييم والمقارنة المعتمدة - الجامعة العربية المفتوحة - الأردن' : 'Official Evaluation Platform - Arab Open University (Jordan)'}
            </span>
          </div>
          <div className="font-medium">
            {isRtl ? 'عمان - المملكة الأردنية الهاشمية' : 'Amman - Hashemite Kingdom of Jordan'}
          </div>
        </div>
      </section>


      {/* ========================================================
          RIGHT (or LEFT in RTL) 50% SPLIT: AUTHENTICATION PANEL
         ======================================================== */}
      <section 
        className={`w-full lg:w-1/2 flex flex-col justify-between p-6 sm:p-10 lg:p-14 relative ${
          isDark 
            ? 'bg-slate-900/95 text-slate-100' 
            : 'bg-white text-slate-900'
        }`}
      >
        {/* Top Control Bar: Theme & Language (Single logo principle: No duplicate logo here) */}
        <div className="w-full flex items-center justify-end gap-2 pb-6">
          {/* Theme Switcher Button */}
          <button
            type="button"
            onClick={toggleTheme}
            className={`h-9.5 w-9.5 rounded-xl border flex items-center justify-center cursor-pointer transition-all shadow-xs ${
              isDark 
                ? 'bg-slate-800 border-slate-700 text-amber-400 hover:bg-slate-700' 
                : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
            }`}
            title={isDark ? (isRtl ? 'التحويل للوضع النهاري (Light)' : 'Switch to Light Mode') : (isRtl ? 'التحويل للوضع الليلي (Dark)' : 'Switch to Dark Mode')}
            aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {isDark ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
          </button>

          {/* Language Switcher Button */}
          <button
            type="button"
            onClick={toggleLanguage}
            className={`h-9.5 px-3.5 rounded-xl border text-xs sm:text-sm font-bold flex items-center gap-2 cursor-pointer transition-all shadow-xs ${
              isDark 
                ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700' 
                : 'bg-slate-100 border-slate-200 text-slate-800 hover:bg-slate-200'
            }`}
            aria-label="Toggle language"
          >
            <Globe className="w-4 h-4 text-blue-600 dark:text-sky-400" />
            <span>{language === 'en' ? 'العربية' : 'English'}</span>
          </button>
        </div>

        {/* Central Authentication Form Container */}
        <div className="w-full max-w-md mx-auto my-auto py-6">
          <div className="mb-6">
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
              {isRtl ? 'تسجيل الدخول' : 'Sign In'}
            </h2>
            <p className="text-base text-slate-500 dark:text-slate-400 mt-1.5 font-medium">
              {isRtl 
                ? 'أدخل بيانات حسابك المعتمد للدخول إلى نظام التقييم' 
                : 'Enter your authorized credentials to access the system'}
            </p>
          </div>

          {/* Error Message Box */}
          {errorMessage && (
            <div className="mb-5 p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 flex items-start gap-3 text-rose-800 dark:text-rose-300 text-sm font-bold animate-in fade-in">
              <AlertCircle className="w-4.5 h-4.5 shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Sign In Form */}
          <form 
            onSubmit={handleSubmit} 
            className="space-y-4"
            autoComplete="off"
            data-lpignore="true"
            data-1p-ignore="true"
            data-form-type="other"
          >
            {/* Decoy fields to intercept aggressive browser autofill heuristics */}
            <input 
              type="text" 
              name="prevent_autofill_decoy_usr" 
              tabIndex={-1} 
              aria-hidden="true" 
              autoComplete="off"
              className="sr-only hidden" 
              style={{ display: 'none', position: 'absolute', opacity: 0 }}
            />
            <input 
              type="password" 
              name="prevent_autofill_decoy_pwd" 
              tabIndex={-1} 
              aria-hidden="true" 
              autoComplete="new-password"
              className="sr-only hidden" 
              style={{ display: 'none', position: 'absolute', opacity: 0 }}
            />

            {/* Username Input */}
            <div>
              <label 
                htmlFor="login_usr_field" 
                className="block text-sm font-black text-slate-700 dark:text-slate-200 mb-1.5"
              >
                {isRtl ? 'اسم المستخدم' : 'Username'}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 start-0 ps-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                  <User className="w-4.5 h-4.5" />
                </div>
                <input
                  id="login_usr_field"
                  name="aou_portal_usr"
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="off"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  data-lpignore="true"
                  data-1p-ignore="true"
                  data-form-type="other"
                  placeholder={isRtl ? 'أدخل اسم المستخدم' : 'Enter username'}
                  className={`w-full ps-10 pe-4 py-3 rounded-xl text-base font-semibold transition-all border outline-hidden ${
                    isDark 
                      ? 'bg-slate-950 border-slate-700 text-white placeholder-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20' 
                      : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:bg-white focus:border-[#0F3876] focus:ring-3 focus:ring-blue-100'
                  }`}
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label 
                htmlFor="login_pwd_field" 
                className="block text-sm font-black text-slate-700 dark:text-slate-200 mb-1.5"
              >
                {isRtl ? 'كلمة المرور' : 'Password'}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 start-0 ps-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                  <Lock className="w-4.5 h-4.5" />
                </div>
                <input
                  id="login_pwd_field"
                  name="aou_portal_pwd"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  data-lpignore="true"
                  data-1p-ignore="true"
                  data-form-type="other"
                  spellCheck={false}
                  placeholder="••••••••••••"
                  className={`w-full ps-10 pe-11 py-3 rounded-xl text-base font-semibold transition-all border outline-hidden font-mono ${
                    isDark 
                      ? 'bg-slate-950 border-slate-700 text-white placeholder-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20' 
                      : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:bg-white focus:border-[#0F3876] focus:ring-3 focus:ring-blue-100'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 end-0 pe-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors cursor-pointer"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-3.5 px-5 rounded-xl font-black text-base transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed mt-3 ${
                isDark 
                  ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/30 active:bg-blue-700' 
                  : 'bg-[#0F3876] hover:bg-[#08214D] text-white shadow-[#0F3876]/25 active:bg-slate-900'
              }`}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4.5 h-4.5 animate-spin text-white" />
                  <span>{isRtl ? 'جارٍ تسجيل الدخول...' : 'Signing in...'}</span>
                </>
              ) : (
                <>
                  <LogIn className="w-4.5 h-4.5" />
                  <span>{isRtl ? 'دخول للنظام' : 'Sign In'}</span>
                </>
              )}
            </button>
          </form>

          {/* Assistance Note */}
          <div className={`mt-6 p-4 rounded-xl border text-center text-sm leading-relaxed transition-colors ${
            isDark 
              ? 'bg-slate-950/60 border-slate-800 text-slate-400' 
              : 'bg-slate-50 border-slate-200 text-slate-600'
          }`}>
            <p className="font-semibold">
              {isRtl 
                ? 'لطلب صلاحيات الدخول أو الدعم الفني، يرجى مراجعة إدارة تقنية المعلومات بالجامعة.' 
                : 'For access permissions or technical assistance, please contact the University IT Department.'}
            </p>
          </div>
        </div>

        {/* Footer info */}
        <div className="w-full pt-6 border-t border-slate-200/80 dark:border-slate-800/80 flex flex-col sm:flex-row items-center justify-between text-xs sm:text-sm text-slate-400 dark:text-slate-500 gap-2">
          <span>
            {isRtl 
              ? `© ${new Date().getFullYear()} الجامعة العربية المفتوحة - كافة الحقوق محفوظة` 
              : `© ${new Date().getFullYear()} Arab Open University. All rights reserved.`}
          </span>
          <span className="font-mono text-xs font-bold">
            {isRtl ? 'إصدار النظام 2026' : 'Version 2026'}
          </span>
        </div>
      </section>
    </div>
  );
};
