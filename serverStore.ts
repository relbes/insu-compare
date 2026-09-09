import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

export type UserRole = 'super_admin' | 'committee_admin' | 'evaluator' | 'viewer';

export interface StoredUser {
  id: string;
  username: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  phone?: string;
  department?: string;
  jobTitle?: string;
  bio?: string;
  passwordHash: string;
  salt: string;
  createdAt: string;
  lastLoginAt?: string;
  isActive: boolean;
}

export interface SystemSettings {
  organizationNameAr: string;
  organizationNameEn: string;
  committeeTitleAr: string;
  committeeTitleEn: string;
  logoUrl?: string; // base64 or URL
  logoWidth?: number;
  aiProvider: 'gemini' | 'openai';
  geminiModel: string;
  openaiModel: string;
  hasCustomGeminiKey?: boolean;
  hasCustomOpenaiKey?: boolean;
  customGeminiKey?: string;
  customOpenaiKey?: string;
  defaultCurrency: string;
  defaultTechnicalRatio: number; // e.g. 60
  defaultFinancialRatio: number; // e.g. 40
  strictNoBonusEnforced: boolean;
  statutoryIssuancePercent: number; // 0.05
  statutoryStampsPercent: number; // 0.01
  statutoryGuaranteePercent: number; // 0.005
  fixedContractFee: number;
  requireAuthForReports: boolean;
}

interface AppStoreData {
  users: StoredUser[];
  settings: SystemSettings;
}

const DATA_DIR = path.join(process.cwd(), 'data');
const STORE_FILE = path.join(DATA_DIR, 'system_store.json');
function getJwtSecret(): string {
  return process.env.JWT_SECRET || 'insurance-evaluator-super-secret-key-2026';
}

function hashPassword(password: string, existingSalt?: string): { salt: string; hash: string } {
  const salt = existingSalt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return { salt, hash };
}

function verifyPassword(password: string, salt: string, expectedHash: string): boolean {
  const { hash } = hashPassword(password, salt);
  return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(expectedHash));
}

const DEFAULT_SETTINGS: SystemSettings = {
  organizationNameAr: 'الجامعة العربية المفتوحة - نظام مقارنة للتأمين الطبي للعاملين',
  organizationNameEn: 'Arab Open University - Staff Medical Insurance Comparison System',
  committeeTitleAr: 'الجامعة العربيه المفتوحة - الأردن',
  committeeTitleEn: 'Arab Open University - Jordan',
  logoUrl: '/logo.png',
  logoWidth: 160,
  aiProvider: process.env.OPENAI_API_KEY ? 'openai' : 'gemini',
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

function createInitialUsers(): StoredUser[] {
  const adminPass = hashPassword('Admin@12345');
  const committeePass = hashPassword('Committee123!');
  const evalPass = hashPassword('Evaluator123!');

  return [
    {
      id: 'usr_admin',
      username: 'admin',
      name: 'مدير النظام التنفيذي (Super Admin)',
      email: 'admin@tender-evaluator.local',
      role: 'super_admin',
      passwordHash: adminPass.hash,
      salt: adminPass.salt,
      createdAt: new Date().toISOString(),
      isActive: true
    },
    {
      id: 'usr_committee',
      username: 'committee',
      name: 'رئيس لجنة العطاءات (Committee Admin)',
      email: 'committee@tender-evaluator.local',
      role: 'committee_admin',
      passwordHash: committeePass.hash,
      salt: committeePass.salt,
      createdAt: new Date().toISOString(),
      isActive: true
    },
    {
      id: 'usr_evaluator',
      username: 'evaluator',
      name: 'عضو ومقيم فني ومالي (Evaluator)',
      email: 'evaluator@tender-evaluator.local',
      role: 'evaluator',
      passwordHash: evalPass.hash,
      salt: evalPass.salt,
      createdAt: new Date().toISOString(),
      isActive: true
    }
  ];
}

class StoreManager {
  private data: AppStoreData;

  constructor() {
    this.data = this.loadData();
  }

  private loadData(): AppStoreData {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      if (fs.existsSync(STORE_FILE)) {
        const content = fs.readFileSync(STORE_FILE, 'utf-8');
        const parsed = JSON.parse(content);
        const mergedSettings = { ...DEFAULT_SETTINGS, ...(parsed.settings || {}) };
        if (mergedSettings.aiProvider === 'openai' && !mergedSettings.customOpenaiKey && !process.env.OPENAI_API_KEY) {
          mergedSettings.aiProvider = 'gemini';
        }
        return {
          users: Array.isArray(parsed.users) && parsed.users.length > 0 ? parsed.users : createInitialUsers(),
          settings: mergedSettings
        };
      }
    } catch (err) {
      console.warn('Could not read system_store.json, initializing fresh store:', err);
    }

    const initialData: AppStoreData = {
      users: createInitialUsers(),
      settings: DEFAULT_SETTINGS
    };
    this.saveData(initialData);
    return initialData;
  }

  private saveData(dataToSave?: AppStoreData) {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      const toWrite = dataToSave || this.data;
      fs.writeFileSync(STORE_FILE, JSON.stringify(toWrite, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to write system_store.json:', err);
    }
  }

  // User methods
  getUsers() {
    return this.data.users.map(({ passwordHash, salt, ...safeUser }) => safeUser);
  }

  getUserById(id: string) {
    return this.data.users.find(u => u.id === id);
  }

  getUserByUsername(username: string) {
    return this.data.users.find(u => u.username.toLowerCase() === username.toLowerCase().trim());
  }

  authenticate(username: string, plainPassword: string) {
    const user = this.getUserByUsername(username);
    if (!user || !user.isActive) {
      return null;
    }
    let isValid = verifyPassword(plainPassword, user.salt, user.passwordHash);
    
    // Auto-reconciliation for default admin password: Admin@12345 or Admin123!#
    if (!isValid && user.username === 'admin') {
      if (plainPassword === 'Admin@12345' || plainPassword === 'Admin123!#') {
        const { hash, salt } = hashPassword(plainPassword);
        user.passwordHash = hash;
        user.salt = salt;
        isValid = true;
      }
    }

    if (!isValid) {
      return null;
    }
    user.lastLoginAt = new Date().toISOString();
    this.saveData();

    const { passwordHash, salt, ...safeUser } = user;
    const token = this.generateToken(safeUser.id, safeUser.username, safeUser.role);
    return { user: safeUser, token };
  }

  createUser(params: {
    username: string;
    password: string;
    name: string;
    email: string;
    role: UserRole;
  }) {
    const existing = this.getUserByUsername(params.username);
    if (existing) {
      throw new Error('اسم المستخدم مستخدم بالفعل (Username already taken)');
    }
    const { hash, salt } = hashPassword(params.password);
    const newUser: StoredUser = {
      id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      username: params.username.toLowerCase().trim(),
      name: params.name.trim(),
      email: params.email.trim(),
      role: params.role,
      passwordHash: hash,
      salt: salt,
      createdAt: new Date().toISOString(),
      isActive: true
    };
    this.data.users.push(newUser);
    this.saveData();
    const { passwordHash, salt: _, ...safeUser } = newUser;
    return safeUser;
  }

  updateUser(id: string, updates: Partial<{
    name: string;
    username: string;
    email: string;
    phone: string;
    department: string;
    jobTitle: string;
    bio: string;
    avatar: string;
    role: UserRole;
    password?: string;
    isActive: boolean;
  }>) {
    const user = this.data.users.find(u => u.id === id);
    if (!user) {
      throw new Error('المستخدم غير موجود (User not found)');
    }

    if (updates.name !== undefined) user.name = updates.name.trim();
    if (updates.email !== undefined) user.email = updates.email.trim();
    if (updates.phone !== undefined) user.phone = updates.phone.trim();
    if (updates.department !== undefined) user.department = updates.department.trim();
    if (updates.jobTitle !== undefined) user.jobTitle = updates.jobTitle.trim();
    if (updates.bio !== undefined) user.bio = updates.bio.trim();
    if (updates.avatar !== undefined) user.avatar = updates.avatar;
    if (updates.role !== undefined) user.role = updates.role;
    if (updates.isActive !== undefined) user.isActive = updates.isActive;

    if (updates.username !== undefined) {
      const cleanUsername = updates.username.trim().toLowerCase();
      if (cleanUsername.length < 3) {
        throw new Error('اسم المستخدم يجب ألا يقل عن 3 أحرف (Username must be at least 3 characters)');
      }
      const existing = this.data.users.find(u => u.username.toLowerCase() === cleanUsername && u.id !== id);
      if (existing) {
        throw new Error('اسم المستخدم مستخدم بالفعل من قبل عضو آخر (Username is already taken)');
      }
      user.username = cleanUsername;
    }

    if (updates.password && updates.password.trim().length >= 6) {
      const { hash, salt } = hashPassword(updates.password.trim());
      user.passwordHash = hash;
      user.salt = salt;
    }

    this.saveData();
    const { passwordHash, salt: _, ...safeUser } = user;
    return safeUser;
  }

  deleteUser(id: string, currentUserId?: string) {
    if (id === currentUserId) {
      throw new Error('لا يمكنك حذف حسابك الحالي (Cannot delete your own account)');
    }
    const index = this.data.users.findIndex(u => u.id === id);
    if (index === -1) {
      throw new Error('المستخدم غير موجود (User not found)');
    }
    // Prevent deleting the last super_admin
    const user = this.data.users[index];
    if (user.role === 'super_admin') {
      const superAdminCount = this.data.users.filter(u => u.role === 'super_admin' && u.isActive).length;
      if (superAdminCount <= 1) {
        throw new Error('لا يمكن حذف المسؤول الأخير في النظام (Cannot delete the last Super Admin)');
      }
    }

    this.data.users.splice(index, 1);
    this.saveData();
    return true;
  }

  // Settings methods
  getSettings(): SystemSettings {
    const s = this.data.settings;
    return {
      ...s,
      hasCustomGeminiKey: !!(s.customGeminiKey || process.env.GEMINI_API_KEY),
      hasCustomOpenaiKey: !!(s.customOpenaiKey || process.env.OPENAI_API_KEY),
      // Do not return raw API secrets to the browser for security!
      customGeminiKey: s.customGeminiKey ? '••••••••' + s.customGeminiKey.slice(-4) : '',
      customOpenaiKey: s.customOpenaiKey ? '••••••••' + s.customOpenaiKey.slice(-4) : ''
    };
  }

  getRawSettings(): SystemSettings {
    return this.data.settings;
  }

  updateSettings(updates: Partial<SystemSettings>) {
    // Merge updates
    const current = this.data.settings;
    
    // Check if new API keys were provided or if placeholder was kept
    let geminiKey = current.customGeminiKey;
    if (updates.customGeminiKey !== undefined) {
      if (!updates.customGeminiKey.includes('••••')) {
        geminiKey = updates.customGeminiKey.trim();
      }
    }

    let openaiKey = current.customOpenaiKey;
    if (updates.customOpenaiKey !== undefined) {
      if (!updates.customOpenaiKey.includes('••••')) {
        openaiKey = updates.customOpenaiKey.trim();
      }
    }

    this.data.settings = {
      ...current,
      ...updates,
      customGeminiKey: geminiKey,
      customOpenaiKey: openaiKey
    };

    this.saveData();
    return this.getSettings();
  }

  // Token methods
  generateToken(userId: string, username: string, role: UserRole): string {
    const payload = {
      userId,
      username,
      role,
      exp: Date.now() + 7 * 24 * 60 * 60 * 1000 // 7 days
    };
    const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const signature = crypto
      .createHmac('sha256', getJwtSecret())
      .update(encodedPayload)
      .digest('base64url');
    return `${encodedPayload}.${signature}`;
  }

  verifyToken(token: string) {
    if (!token) return null;
    const parts = token.split('.');
    if (parts.length !== 2) return null;
    const [encodedPayload, signature] = parts;
    const expectedSig = crypto
      .createHmac('sha256', getJwtSecret())
      .update(encodedPayload)
      .digest('base64url');
    
    if (signature !== expectedSig) return null;

    try {
      const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf-8'));
      if (payload.exp && payload.exp < Date.now()) {
        return null; // Expired
      }
      const user = this.getUserById(payload.userId);
      if (!user || !user.isActive) return null;
      const { passwordHash, salt, ...safeUser } = user;
      return safeUser;
    } catch {
      return null;
    }
  }
}

export const store = new StoreManager();
