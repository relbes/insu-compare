import React, { useState } from 'react';
import { 
  X, 
  Lock, 
  User, 
  ShieldCheck, 
  Eye, 
  EyeOff, 
  LogIn, 
  CheckCircle2, 
  AlertCircle,
  ShieldAlert
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../i18n/I18nContext';

export const LoginModal: React.FC = () => {
  const { authModalOpen, setAuthModalOpen, login } = useAuth();
  const { isRtl } = useI18n();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!authModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setErrorMessage(isRtl ? 'يرجى إدخال اسم المستخدم وكلمة المرور' : 'Please enter both username and password');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    const result = await login(username.trim(), password);
    setIsLoading(false);

    if (!result.success) {
      setErrorMessage(result.error || (isRtl ? 'بيانات الدخول غير صحيحة' : 'Invalid credentials'));
    } else {
      setUsername('');
      setPassword('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200"
        dir={isRtl ? 'rtl' : 'ltr'}
      >
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 p-6 text-white relative">
          <button
            type="button"
            onClick={() => setAuthModalOpen(false)}
            className="absolute top-5 end-5 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/80 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
          
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-500 flex items-center justify-center text-white shadow-lg mb-3">
            <ShieldCheck className="w-6 h-6" />
          </div>

          <h2 className="text-xl font-black tracking-tight text-white">
            {isRtl ? 'تسجيل الدخول للنظام المالي والمفاضلة' : 'Sign in to Tender Evaluator'}
          </h2>
          <p className="text-xs text-sky-200/90 mt-1 font-medium">
            {isRtl ? 'الوصول إلى لوحة الإدارة وإعدادات المفاضلة والترسية' : 'Access Admin Panel, committee settings, and official scoring'}
          </p>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 flex items-center gap-3 text-rose-800 text-xs font-bold animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form 
            onSubmit={handleSubmit} 
            className="space-y-4"
            autoComplete="off"
            data-lpignore="true"
            data-1p-ignore="true"
            data-form-type="other"
          >
            {/* Hidden dummy decoy inputs to absorb aggressive browser/extension autofill heuristics */}
            <input 
              type="text" 
              name="prevent_autofill_modal_user_decoy" 
              tabIndex={-1} 
              aria-hidden="true" 
              autoComplete="off"
              className="sr-only hidden" 
              style={{ display: 'none', position: 'absolute', opacity: 0 }}
            />
            <input 
              type="password" 
              name="prevent_autofill_modal_pwd_decoy" 
              tabIndex={-1} 
              aria-hidden="true" 
              autoComplete="new-password"
              className="sr-only hidden" 
              style={{ display: 'none', position: 'absolute', opacity: 0 }}
            />

            <div>
              <label className="block text-xs font-black text-slate-700 mb-1.5" htmlFor="login_modal_username">
                {isRtl ? 'اسم المستخدم' : 'Username'}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 start-0 ps-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  id="login_modal_username"
                  name="tender_eval_modal_usr"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="off"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  data-lpignore="true"
                  data-1p-ignore="true"
                  data-form-type="other"
                  placeholder={isRtl ? 'مثال: admin' : 'e.g. admin'}
                  className="w-full h-11 ps-10 pe-4 rounded-xl bg-slate-50 border border-slate-200 text-sm font-bold text-slate-900 focus:bg-white focus:border-sky-600 focus:ring-2 focus:ring-sky-100 outline-hidden transition-all"
                  autoFocus
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-black text-slate-700 mb-1.5" htmlFor="login_modal_password">
                {isRtl ? 'كلمة المرور' : 'Password'}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 start-0 ps-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="login_modal_password"
                  name="tender_eval_modal_pwd"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  data-lpignore="true"
                  data-1p-ignore="true"
                  data-form-type="other"
                  spellCheck={false}
                  placeholder="••••••••"
                  className="w-full h-11 ps-10 pe-11 rounded-xl bg-slate-50 border border-slate-200 text-sm font-bold text-slate-900 focus:bg-white focus:border-sky-600 focus:ring-2 focus:ring-sky-100 outline-hidden transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 end-0 pe-3.5 flex items-center text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 text-white font-black text-sm flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-50"
            >
              <LogIn className="w-4 h-4" />
              <span>{isLoading ? (isRtl ? 'جاري التحقق...' : 'Verifying...') : (isRtl ? 'دخول آمن للنظام' : 'Sign In')}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
