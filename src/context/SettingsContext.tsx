import React, { createContext, useContext, useState, useEffect } from 'react';
import { SystemSettings } from '../types';
import { useAuth } from './AuthContext';
import { authFetch } from '../utils/authInterceptor';

interface SettingsContextType {
  settings: SystemSettings;
  isLoading: boolean;
  updateSettings: (updates: Partial<SystemSettings>) => Promise<boolean>;
  uploadLogo: (fileBase64: string, width?: number) => Promise<{ success: boolean; logoUrl?: string; error?: string }>;
  removeLogo: () => Promise<boolean>;
  testAi: (params?: { provider?: string; model?: string; customKey?: string }) => Promise<{
    success: boolean;
    provider?: string;
    model?: string;
    latencyMs?: number;
    reply?: string;
    message?: string;
  }>;
  reloadSettings: () => Promise<void>;
}

const DEFAULT_SETTINGS: SystemSettings = {
  organizationNameAr: 'الجامعة العربية المفتوحة - نظام مقارنة للتأمين الطبي للعاملين',
  organizationNameEn: 'Arab Open University - Staff Medical Insurance Comparison System',
  committeeTitleAr: 'الجامعة العربيه المفتوحة - الأردن',
  committeeTitleEn: 'Arab Open University - Jordan',
  logoUrl: '/logo.png',
  logoWidth: 160,
  aiProvider: 'openai',
  geminiModel: 'gemini-3.8-flash',
  openaiModel: 'gpt-4o',
  defaultCurrency: 'JOD',
  defaultTechnicalRatio: 60,
  defaultFinancialRatio: 40,
  strictNoBonusEnforced: true,
  statutoryIssuancePercent: 0.05,
  statutoryStampsPercent: 0.01,
  statutoryGuaranteePercent: 0.005,
  fixedContractFee: 0,
  requireAuthForReports: false
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token } = useAuth();
  const [settings, setSettings] = useState<SystemSettings>(() => {
    try {
      const cached = localStorage.getItem('insur_system_settings');
      if (cached) {
        const parsed = JSON.parse(cached);
        // Sanitize legacy default values if present
        if (parsed.organizationNameAr === 'لجنة العطاءات المركزية - مناقصة التأمين الطبي' || parsed.organizationNameAr?.includes('لجنة العطاءات')) {
          parsed.organizationNameAr = DEFAULT_SETTINGS.organizationNameAr;
        }
        if (parsed.committeeTitleAr === 'لجنة الفحص والتقييم الفني والإكتواري' || parsed.committeeTitleAr?.includes('لجنة العطاءات') || parsed.committeeTitleAr?.includes('إكتواري') || parsed.committeeTitleAr?.includes('اكتواري')) {
          parsed.committeeTitleAr = DEFAULT_SETTINGS.committeeTitleAr;
        }
        if (parsed.logoUrl === '/aou-logo.svg' || !parsed.logoUrl) {
          parsed.logoUrl = '/logo.png';
        }
        return { ...DEFAULT_SETTINGS, ...parsed };
      }
    } catch {}
    return DEFAULT_SETTINGS;
  });
  const [isLoading, setIsLoading] = useState(true);

  const reloadSettings = async () => {
    try {
      if (token) {
        const res = await authFetch('/api/settings');
        if (res.ok) {
          const data = await res.json();
          setSettings(prev => {
            const merged = { ...prev, ...data };
            try {
              localStorage.setItem('insur_system_settings', JSON.stringify(merged));
            } catch {}
            return merged;
          });
          return;
        }
      }

      // If unauthenticated or no token yet, fetch safe public branding for login gate
      const publicRes = await authFetch('/api/auth/public-info');
      if (publicRes.ok) {
        const publicData = await publicRes.json();
        setSettings(prev => ({
          ...prev,
          organizationNameAr: publicData.organizationNameAr || prev.organizationNameAr,
          organizationNameEn: publicData.organizationNameEn || prev.organizationNameEn,
          committeeTitleAr: publicData.committeeTitleAr || prev.committeeTitleAr,
          committeeTitleEn: publicData.committeeTitleEn || prev.committeeTitleEn,
          logoUrl: publicData.logoUrl !== undefined ? publicData.logoUrl : prev.logoUrl,
          logoWidth: publicData.logoWidth || prev.logoWidth,
          defaultCurrency: publicData.defaultCurrency || prev.defaultCurrency
        }));
      }
    } catch (err) {
      console.warn('Could not fetch settings from server:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    reloadSettings();
  }, [token]);

  const updateSettings = async (updates: Partial<SystemSettings>): Promise<boolean> => {
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const res = await authFetch('/api/settings', {
        method: 'POST',
        headers,
        body: JSON.stringify(updates)
      });
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
        try {
          localStorage.setItem('insur_system_settings', JSON.stringify(data));
        } catch {}
        return true;
      }
      return false;
    } catch (err) {
      console.error('Error saving settings:', err);
      return false;
    }
  };

  const uploadLogo = async (fileBase64: string, width?: number) => {
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const res = await authFetch('/api/settings/upload-logo', {
        method: 'POST',
        headers,
        body: JSON.stringify({ logoBase64: fileBase64, logoWidth: width || 160 })
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Failed to upload logo' };
      }
      if (data.settings) {
        setSettings(data.settings);
        try {
          localStorage.setItem('insur_system_settings', JSON.stringify(data.settings));
        } catch {}
      }
      return { success: true, logoUrl: data.logoUrl };
    } catch (err: any) {
      return { success: false, error: err.message || 'Logo upload error' };
    }
  };

  const removeLogo = async (): Promise<boolean> => {
    return await updateSettings({ logoUrl: '/logo.png' });
  };

  const testAi = async (params?: { provider?: string; model?: string; customKey?: string }) => {
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const res = await authFetch('/api/settings/test-ai', {
        method: 'POST',
        headers,
        body: JSON.stringify(params || {})
      });
      const data = await res.json();
      return data;
    } catch (err: any) {
      return {
        success: false,
        message: err.message || 'Connection test failed'
      };
    }
  };

  return (
    <SettingsContext.Provider
      value={{
        settings,
        isLoading,
        updateSettings,
        uploadLogo,
        removeLogo,
        testAi,
        reloadSettings
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
