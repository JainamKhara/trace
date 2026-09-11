'use client';

import React, { createContext, useContext, useSyncExternalStore, useMemo } from 'react';
import { InvestigatorUser } from '@/types/auth';

export const DEMO_INVESTIGATORS: InvestigatorUser[] = [
  {
    id: 'officer-1',
    name: 'Insp. Vikram Rathore',
    badgeId: 'SCB-7821',
    role: 'Lead Investigator',
    department: 'Crime Branch',
    station: 'Crime Branch HQ, Unit 1',
    avatarInitials: 'VR',
    email: 'v.rathore@police.gov.in',
    lastLogin: 'Today, 09:30'
  },
  {
    id: 'officer-2',
    name: 'Dr. Ananya Sharma',
    badgeId: 'CYB-4092',
    role: 'Forensic Analyst',
    department: 'Cyber Crime Unit',
    station: 'Cyber Forensic Lab',
    avatarInitials: 'AS',
    email: 'ananya.sharma@police.gov.in',
    lastLogin: 'Today, 10:15'
  },
  {
    id: 'officer-3',
    name: 'ACP Rajesh Menon',
    badgeId: 'IPS-1104',
    role: 'Supervisory Officer',
    department: 'Zonal Division',
    station: 'Central Zone Office',
    avatarInitials: 'RM',
    email: 'rajesh.menon@police.gov.in',
    lastLogin: 'Yesterday, 17:45'
  }
];

interface AuthContextType {
  user: InvestigatorUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  demoUsers: InvestigatorUser[];
  login: (badgeOrEmail: string, password?: string, department?: string) => Promise<{ success: boolean; error?: string }>;
  quickLogin: (userId: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = 'trace_auth_session';
const LOGGED_OUT_KEY = 'trace_auth_logged_out';

const emptySubscribe = () => () => {};

function subscribeAuth(callback: () => void) {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener('storage', callback);
  window.addEventListener('trace_auth_event', callback);
  return () => {
    window.removeEventListener('storage', callback);
    window.removeEventListener('trace_auth_event', callback);
  };
}

function getAuthSnapshot(): string {
  try {
    return localStorage.getItem(AUTH_STORAGE_KEY) || '';
  } catch {
    return '';
  }
}

function getAuthServerSnapshot(): string {
  return '';
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const isMounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  const rawSession = useSyncExternalStore(
    subscribeAuth,
    getAuthSnapshot,
    getAuthServerSnapshot
  );

  const user = useMemo<InvestigatorUser | null>(() => {
    if (!isMounted) return null;
    try {
      const isLoggedOut = localStorage.getItem(LOGGED_OUT_KEY) === 'true';
      if (isLoggedOut) return null;
      if (rawSession) {
        const parsed = JSON.parse(rawSession);
        if (parsed && parsed.id) return parsed;
      }
      return null;
    } catch {
      return null;
    }
  }, [isMounted, rawSession]);

  const isLoading = !isMounted;

  const quickLogin = async (userId: string): Promise<void> => {
    const selected = DEMO_INVESTIGATORS.find(u => u.id === userId) || DEMO_INVESTIGATORS[0];
    const sessionUser: InvestigatorUser = {
      ...selected,
      lastLogin: `Today, ${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}`
    };
    localStorage.removeItem(LOGGED_OUT_KEY);
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(sessionUser));
    window.dispatchEvent(new Event('trace_auth_event'));
  };

  const login = async (
    badgeOrEmail: string,
    _password?: string,
    department?: string
  ): Promise<{ success: boolean; error?: string }> => {
    const cleanQuery = badgeOrEmail.trim().toLowerCase();

    if (!cleanQuery) {
      return { success: false, error: 'Please enter your Badge ID or Email address.' };
    }

    const matched = DEMO_INVESTIGATORS.find(
      u =>
        u.badgeId.toLowerCase() === cleanQuery ||
        u.email.toLowerCase() === cleanQuery ||
        u.name.toLowerCase().includes(cleanQuery)
    );

    let sessionUser: InvestigatorUser;

    if (matched) {
      sessionUser = {
        ...matched,
        department: department || matched.department,
        lastLogin: `Today, ${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}`
      };
    } else {
      const cleanBadge = cleanQuery.toUpperCase();
      sessionUser = {
        id: `officer-${Date.now()}`,
        name: cleanQuery.includes('@') ? cleanQuery.split('@')[0].replace('.', ' ').toUpperCase() : `Officer ${cleanBadge}`,
        badgeId: cleanBadge,
        role: 'Investigator',
        department: department || 'Crime Branch',
        station: 'Field Investigation Office',
        avatarInitials: cleanBadge.slice(0, 2),
        email: cleanQuery.includes('@') ? cleanQuery : `${cleanBadge.toLowerCase()}@police.gov.in`,
        lastLogin: `Today, ${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}`
      };
    }

    localStorage.removeItem(LOGGED_OUT_KEY);
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(sessionUser));
    window.dispatchEvent(new Event('trace_auth_event'));
    return { success: true };
  };

  const logout = () => {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    localStorage.setItem(LOGGED_OUT_KEY, 'true');
    window.dispatchEvent(new Event('trace_auth_event'));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        demoUsers: DEMO_INVESTIGATORS,
        login,
        quickLogin,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
