import React, { createContext, useContext, useState, useEffect } from 'react';
import { AppUser, UserRole } from '../types';
import { authFetch } from '../utils/authInterceptor';

export interface UpdateProfileParams {
  name?: string;
  username?: string;
  email?: string;
  phone?: string;
  department?: string;
  jobTitle?: string;
  bio?: string;
  avatar?: string;
  currentPassword?: string;
  newPassword?: string;
}

interface AuthContextType {
  user: AppUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isCheckingAuth: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isCommitteeAdmin: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  authModalOpen: boolean;
  setAuthModalOpen: (open: boolean) => void;
  profileModalOpen: boolean;
  setProfileModalOpen: (open: boolean) => void;
  changePasswordModalOpen: boolean;
  setChangePasswordModalOpen: (open: boolean) => void;
  updateProfile: (params: UpdateProfileParams) => Promise<{ success: boolean; error?: string }>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => {
    try {
      return localStorage.getItem('insur_auth_token');
    } catch {
      return null;
    }
  });

  const [user, setUser] = useState<AppUser | null>(() => {
    try {
      const saved = localStorage.getItem('insur_auth_user');
      if (saved) return JSON.parse(saved);
    } catch {}
    return null;
  });

  const [isCheckingAuth, setIsCheckingAuth] = useState<boolean>(() => {
    try {
      return !!localStorage.getItem('insur_auth_token');
    } catch {
      return false;
    }
  });

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [changePasswordModalOpen, setChangePasswordModalOpen] = useState(false);

  // Handle unauthorized event dispatched by interceptor
  useEffect(() => {
    const handleUnauthorized = () => {
      setToken(null);
      setUser(null);
      setIsCheckingAuth(false);
    };
    window.addEventListener('insur_auth_unauthorized', handleUnauthorized);
    return () => window.removeEventListener('insur_auth_unauthorized', handleUnauthorized);
  }, []);

  // Validate session on boot
  useEffect(() => {
    if (token) {
      setIsCheckingAuth(true);
      authFetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => {
          if (res.ok) return res.json();
          throw new Error('Session expired');
        })
        .then(data => {
          if (data.user) {
            setUser(data.user);
            try {
              localStorage.setItem('insur_auth_user', JSON.stringify(data.user));
            } catch {}
          }
        })
        .catch(() => {
          logout();
        })
        .finally(() => {
          setIsCheckingAuth(false);
        });
    } else {
      setIsCheckingAuth(false);
    }
  }, [token]);

  const login = async (username: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await authFetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'فشل تسجيل الدخول (Login failed)' };
      }
      setToken(data.token);
      setUser(data.user);
      try {
        localStorage.setItem('insur_auth_token', data.token);
        localStorage.setItem('insur_auth_user', JSON.stringify(data.user));
      } catch {}
      setAuthModalOpen(false);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error occurred' };
    }
  };

  const logout = () => {
    try {
      authFetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
      localStorage.removeItem('insur_auth_token');
      localStorage.removeItem('insur_auth_user');
    } catch {}
    setToken(null);
    setUser(null);
  };

  const updateProfile = async (params: UpdateProfileParams): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await authFetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(params)
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'فشل تحديث الملف الشخصي (Profile update failed)' };
      }
      if (data.user) {
        setUser(data.user);
        try {
          localStorage.setItem('insur_auth_user', JSON.stringify(data.user));
        } catch {}
      }
      if (data.token) {
        setToken(data.token);
        try {
          localStorage.setItem('insur_auth_token', data.token);
        } catch {}
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'حدث خطأ في الاتصال بالخادم' };
    }
  };

  const refreshUser = async () => {
    if (!token) return;
    try {
      const res = await authFetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          setUser(data.user);
          localStorage.setItem('insur_auth_user', JSON.stringify(data.user));
        }
      }
    } catch {}
  };

  const role: UserRole | undefined = user?.role;
  const isSuperAdmin = role === 'super_admin';
  const isCommitteeAdmin = role === 'committee_admin';
  const isAdmin = isSuperAdmin || isCommitteeAdmin;

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isCheckingAuth,
        isAdmin,
        isSuperAdmin,
        isCommitteeAdmin,
        login,
        logout,
        authModalOpen,
        setAuthModalOpen,
        profileModalOpen,
        setProfileModalOpen,
        changePasswordModalOpen,
        setChangePasswordModalOpen,
        updateProfile,
        refreshUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
