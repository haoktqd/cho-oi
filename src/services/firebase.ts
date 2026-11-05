import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  Auth,
  User,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  Firestore,
} from 'firebase/firestore';
import { GameSaveState } from '../types';

export interface AuthUser {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  isDemo?: boolean;
}

export interface FirebaseClientConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId: string;
}

const LOCAL_STORAGE_FIREBASE_CONFIG_KEY = 'cho_oi_firebase_config';
const LOCAL_STORAGE_DEMO_USER_KEY = 'cho_oi_demo_user';

function getActiveConfig(): FirebaseClientConfig | null {
  // 1. Check Vite env variables safely (browser or test environment)
  const metaEnv = (typeof import.meta !== 'undefined' && (import.meta as any).env) || {};
  const envConfig: FirebaseClientConfig = {
    apiKey: metaEnv.VITE_FIREBASE_API_KEY || '',
    authDomain: metaEnv.VITE_FIREBASE_AUTH_DOMAIN || '',
    projectId: metaEnv.VITE_FIREBASE_PROJECT_ID || '',
    storageBucket: metaEnv.VITE_FIREBASE_STORAGE_BUCKET || '',
    messagingSenderId: metaEnv.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
    appId: metaEnv.VITE_FIREBASE_APP_ID || '',
  };

  if (envConfig.apiKey && envConfig.projectId) {
    return envConfig;
  }

  // 2. Check LocalStorage fallback
  try {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(LOCAL_STORAGE_FIREBASE_CONFIG_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.apiKey && parsed.projectId) {
          return parsed;
        }
      }
    }
  } catch {}

  return null;
}

class FirebaseService {
  private app: FirebaseApp | null = null;
  private auth: Auth | null = null;
  private db: Firestore | null = null;
  private googleProvider: GoogleAuthProvider | null = null;
  private authListeners: Set<(user: AuthUser | null) => void> = new Set();
  public currentUser: AuthUser | null = null;

  constructor() {
    this.init();
  }

  public init() {
    const config = getActiveConfig();
    if (config && config.apiKey && config.projectId) {
      try {
        if (!getApps().length) {
          this.app = initializeApp(config);
        } else {
          this.app = getApps()[0];
        }
        this.auth = getAuth(this.app);
        this.db = getFirestore(this.app);
        this.googleProvider = new GoogleAuthProvider();

        onAuthStateChanged(this.auth, (user: User | null) => {
          if (user) {
            this.currentUser = {
              uid: user.uid,
              displayName: user.displayName,
              email: user.email,
              photoURL: user.photoURL,
            };
          } else {
            this.currentUser = null;
          }
          this.notifyAuthListeners();
        });
      } catch (err) {
        console.warn('[Firebase] Initialization error:', err);
      }
    } else {
      // Check if demo user was logged in previously
      try {
        const demo = localStorage.getItem(LOCAL_STORAGE_DEMO_USER_KEY);
        if (demo) {
          this.currentUser = JSON.parse(demo);
        }
      } catch {}
    }
  }

  public isConfigured(): boolean {
    return this.auth !== null && this.db !== null;
  }

  public saveConfig(config: FirebaseClientConfig) {
    try {
      localStorage.setItem(LOCAL_STORAGE_FIREBASE_CONFIG_KEY, JSON.stringify(config));
      this.init();
      return true;
    } catch {
      return false;
    }
  }

  public subscribeAuth(listener: (user: AuthUser | null) => void): () => void {
    this.authListeners.add(listener);
    listener(this.currentUser);
    return () => this.authListeners.delete(listener);
  }

  private notifyAuthListeners() {
    this.authListeners.forEach((l) => l(this.currentUser));
  }

  /**
   * Log in using real Google Account popup (requires Firebase credentials)
   */
  public async loginWithGoogle(): Promise<{ success: boolean; user?: AuthUser; message?: string }> {
    if (!this.isConfigured() || !this.auth || !this.googleProvider) {
      return {
        success: false,
        message: 'Chưa cấu hình Firebase! Bạn có thể nhập mã Firebase hoặc dùng thử Đăng Nhập Mẫu (Demo).',
      };
    }

    try {
      const result = await signInWithPopup(this.auth, this.googleProvider);
      const user = result.user;
      this.currentUser = {
        uid: user.uid,
        displayName: user.displayName,
        email: user.email,
        photoURL: user.photoURL,
      };
      this.notifyAuthListeners();
      return { success: true, user: this.currentUser };
    } catch (err: any) {
      console.error('[Firebase] Sign-in error:', err);
      return {
        success: false,
        message: err.message || 'Đăng nhập Google thất bại, vui lòng thử lại!',
      };
    }
  }

  /**
   * Simulated Demo Google login for immediate testing before real credentials are added
   */
  public loginDemoGoogle(): AuthUser {
    const demoUser: AuthUser = {
      uid: 'demo_google_trader_888',
      displayName: 'Nguyễn Văn Buôn (Demo Gmail)',
      email: 'trader.cho.oi@gmail.com',
      photoURL: 'https://api.dicebear.com/7.x/bottts/svg?seed=cho_oi_trader',
      isDemo: true,
    };
    this.currentUser = demoUser;
    try {
      localStorage.setItem(LOCAL_STORAGE_DEMO_USER_KEY, JSON.stringify(demoUser));
    } catch {}
    this.notifyAuthListeners();
    return demoUser;
  }

  public async logout(): Promise<void> {
    if (this.auth && !this.currentUser?.isDemo) {
      await signOut(this.auth);
    }
    this.currentUser = null;
    try {
      localStorage.removeItem(LOCAL_STORAGE_DEMO_USER_KEY);
    } catch {}
    this.notifyAuthListeners();
  }

  /**
   * Save game progress to Firestore Cloud
   */
  public async saveGameStateToCloud(
    uid: string,
    state: GameSaveState
  ): Promise<{ success: boolean; message?: string }> {
    if (!this.isConfigured() || !this.db) {
      // If demo mode, save to localStorage cloud slot
      if (this.currentUser?.isDemo) {
        try {
          localStorage.setItem(`cho_oi_cloud_save_${uid}`, JSON.stringify(state));
          return { success: true, message: 'Đã lưu lên Cloud (Chế độ Demo)' };
        } catch (err) {
          return { success: false, message: 'Bộ nhớ cục bộ đầy' };
        }
      }
      return { success: false, message: 'Chưa cấu hình cơ sở dữ liệu Firebase Firestore' };
    }

    try {
      const saveDocRef = doc(this.db, 'users', uid, 'gameSaves', 'default');
      const payload = {
        ...state,
        lastCloudSaved: Date.now(),
        userEmail: this.currentUser?.email || '',
        userDisplayName: this.currentUser?.displayName || '',
      };
      await setDoc(saveDocRef, payload);
      return { success: true, message: 'Đồng bộ đám mây thành công' };
    } catch (err: any) {
      console.error('[Firebase] Save to cloud error:', err);
      return { success: false, message: err.message || 'Lỗi lưu dữ liệu lên đám mây' };
    }
  }

  /**
   * Load game progress from Firestore Cloud
   */
  public async loadGameStateFromCloud(uid: string): Promise<GameSaveState | null> {
    if (!this.isConfigured() || !this.db) {
      if (this.currentUser?.isDemo) {
        try {
          const raw = localStorage.getItem(`cho_oi_cloud_save_${uid}`);
          if (raw) return JSON.parse(raw);
        } catch {}
      }
      return null;
    }

    try {
      const saveDocRef = doc(this.db, 'users', uid, 'gameSaves', 'default');
      const snap = await getDoc(saveDocRef);
      if (snap.exists()) {
        const data = snap.data() as GameSaveState;
        if (data && data.version === 2) {
          return data;
        }
      }
    } catch (err) {
      console.error('[Firebase] Load from cloud error:', err);
    }
    return null;
  }
}

export const firebaseService = new FirebaseService();
