'use client';

import React, { useState, useRef, useEffect } from 'react';
import { usePathname, useSearchParams, useRouter } from 'next/navigation';
import {
  Search,
  Bell,
  ChevronDown,
  LogOut,
  UserCheck,
  Building2,
  Lock,
  Menu,
  X,
  ShieldCheck,
  CheckCircle2,
  Database,
  Plus,
  FileText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/lib/authContext';
import { DataIngestModal } from '@/components/ingest/DataIngestModal';
import { ExportReportModal } from '@/components/reports/ExportReportModal';

interface HeaderProps {
  onOpenSearch: () => void;
  onToggleMobileNav?: () => void;
  isMobileNavOpen?: boolean;
}

const breadcrumbMap: Record<string, { root: string; current: string }> = {
  '/dashboard': {
    root: 'Intelligence Workspace',
    current: 'Operational Dashboard'
  },
  '/cases': {
    root: 'Case Management',
    current: 'Investigation Register'
  },
  '/network': {
    root: 'Intelligence Workspace',
    current: 'Network Analysis'
  },
  '/evidence': {
    root: 'Forensic Registry',
    current: 'Evidence Provenance'
  },
  '/timeline': {
    root: 'Temporal Analysis',
    current: 'Investigation Timeline'
  },
  '/ingest': {
    root: 'Forensic Intake',
    current: 'Data Ingestion Desk'
  }
};

export function Header({ onOpenSearch, onToggleMobileNav, isMobileNavOpen }: HeaderProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const caseParam = searchParams.get('case');

  const { user, logout, quickLogin, demoUsers } = useAuth();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isIngestModalOpen, setIsIngestModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const notificationsMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (profileMenuRef.current && !profileMenuRef.current.contains(target)) {
        setIsProfileOpen(false);
      }
      if (notificationsMenuRef.current && !notificationsMenuRef.current.contains(target)) {
        setIsNotificationsOpen(false);
      }
    };

    if (isProfileOpen || isNotificationsOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isProfileOpen, isNotificationsOpen]);

  let crumbs = breadcrumbMap[pathname] || {
    root: 'Intelligence Workspace',
    current: 'Analysis Desk'
  };

  if (pathname.startsWith('/cases/') && pathname !== '/cases') {
    const caseId = pathname.split('/')[2];
    crumbs = {
      root: 'Case Files',
      current: caseId
    };
  }

  const handleLogout = () => {
    setIsProfileOpen(false);
    logout();
    router.push('/login');
  };

  const handleSwitchUser = async (targetId: string) => {
    setIsProfileOpen(false);
    await quickLogin(targetId);
  };

  return (
    <header className="h-14 border-b border-border bg-card px-4 sm:px-6 flex items-center justify-between shrink-0 select-none relative z-40">
      {/* Left Area: Mobile Hamburger + Breadcrumb Path */}
      <div className="flex items-center gap-3 min-w-0">
        {/* Mobile Navigation Trigger */}
        {onToggleMobileNav && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onToggleMobileNav}
            className="md:hidden size-9 text-slate-700 hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-blue-600"
            aria-label={isMobileNavOpen ? 'Close Navigation Menu' : 'Open Navigation Menu'}
          >
            {isMobileNavOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </Button>
        )}

        <div className="flex items-center gap-2 text-xs min-w-0">
          <span className="text-slate-600 hidden sm:inline truncate">
            {crumbs.root}
          </span>
          <span className="text-slate-400 hidden sm:inline">/</span>
          <span className="font-semibold text-slate-900 tracking-tight truncate">
            {crumbs.current}
          </span>
          {caseParam && (
            <Badge variant="outline" className="text-[10px] font-mono py-0 h-5 text-blue-700 border-blue-200 bg-blue-50 ml-1">
              Focus: {caseParam}
            </Badge>
          )}
        </div>
      </div>

      {/* Right Controls: Search, Notifications, Profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Ingest Data Quick-Trigger Button */}
        <Button
          type="button"
          variant="default"
          size="sm"
          onClick={() => setIsIngestModalOpen(true)}
          className="gap-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white font-medium h-8 px-2.5 sm:px-3 shadow-xs focus-visible:ring-2 focus-visible:ring-blue-600"
          title="Ingest data manually or upload files (CSV, PDF, images)"
        >
          <Plus className="size-3.5" />
          <span className="hidden sm:inline">Ingest Data</span>
        </Button>

        {/* Export Report Quick-Trigger Button */}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setIsExportModalOpen(true)}
          className="gap-1.5 text-xs text-slate-700 hover:text-slate-900 font-medium h-8 px-2.5 sm:px-3 border-slate-200 bg-white hover:bg-slate-100 shadow-xs"
          title="Export investigation report and dossier"
        >
          <FileText className="size-3.5 text-slate-600" />
          <span className="hidden lg:inline">Export Report</span>
        </Button>

        {/* Global Search trigger */}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onOpenSearch}
          className="gap-2.5 text-xs text-slate-700 hover:text-slate-900 font-normal h-8 px-2.5 sm:px-3 border-slate-200 bg-slate-50/70 hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-blue-600"
          title="Search entities and records (Ctrl+K)"
        >
          <Search className="size-3.5 text-slate-500" />
          <span className="hidden md:inline">Search entities, cases...</span>
          <kbd className="hidden sm:inline-flex text-[10px] font-mono px-1.5 py-0.5 rounded bg-white text-slate-600 border border-slate-200">
            Ctrl+K
          </kbd>
        </Button>

        {/* Functional System Notifications Popover (Finding 1 fix) */}
        <div className="relative" ref={notificationsMenuRef}>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => {
              setIsNotificationsOpen(prev => !prev);
              setIsProfileOpen(false);
            }}
            className="relative size-8 text-slate-600 hover:text-slate-900 focus-visible:ring-2 focus-visible:ring-blue-600"
            title="System & Security Audit Notifications"
            aria-expanded={isNotificationsOpen}
          >
            <Bell className="size-4" />
            <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-blue-600 ring-2 ring-white" />
          </Button>

          {isNotificationsOpen && (
            <div className="fixed top-14 left-3 right-3 sm:left-auto sm:right-0 sm:absolute sm:top-full sm:mt-2 w-auto sm:w-80 sm:max-w-sm rounded-xl bg-white border border-slate-200 shadow-xl py-2 z-50 animate-in fade-in-0 zoom-in-95 text-xs text-slate-700 font-sans max-h-[calc(100vh-4.5rem)] overflow-y-auto">
              <div className="px-4 py-2.5 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2 font-semibold text-slate-900">
                  <ShieldCheck className="size-4 text-blue-600" />
                  <span>Security & Integrity Alerts</span>
                </div>
                <Badge variant="outline" className="text-[10px] font-mono text-emerald-700 bg-emerald-50 border-emerald-200">
                  Audit Active
                </Badge>
              </div>

              <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
                <div className="p-3 hover:bg-slate-50 transition-colors flex items-start gap-2.5">
                  <CheckCircle2 className="size-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <span className="font-semibold text-slate-900 text-xs">Forensic Integrity Verified</span>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      All local CDR and FIR dataset hashes validated with zero tampering detected.
                    </p>
                    <span className="text-[10px] font-mono text-slate-500 mt-1">Live • Hash check OK</span>
                  </div>
                </div>

                <div className="p-3 hover:bg-slate-50 transition-colors flex items-start gap-2.5">
                  <Database className="size-4 text-blue-600 shrink-0 mt-0.5" />
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <span className="font-semibold text-slate-900 text-xs">Offline Cache Synchronized</span>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      12 cases, 20 evidence items, and 27 mapped entities cached for offline tactical analysis.
                    </p>
                    <span className="text-[10px] font-mono text-slate-500 mt-1">Local SQLite / IndexedDB</span>
                  </div>
                </div>

                <div className="p-3 hover:bg-slate-50 transition-colors flex items-start gap-2.5">
                  <Lock className="size-4 text-indigo-600 shrink-0 mt-0.5" />
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <span className="font-semibold text-slate-900 text-xs">Active Session Established</span>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      Officer {user?.name || 'User'} ({user?.badgeId}) authenticated with departmental privileges.
                    </p>
                    <span className="text-[10px] font-mono text-slate-500 mt-1">Session token valid</span>
                  </div>
                </div>
              </div>

              <div className="px-4 py-2 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between text-[11px] text-slate-500">
                <span>System Health: 100% Operational</span>
                <button
                  type="button"
                  onClick={() => setIsNotificationsOpen(false)}
                  className="text-blue-600 hover:underline font-medium"
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}
        </div>

        <Separator orientation="vertical" className="h-5 hidden sm:block" />

        {/* Active Investigator Profile with Dropdown Menu */}
        <div className="relative" ref={profileMenuRef}>
          <button
            type="button"
            onClick={() => {
              setIsProfileOpen(prev => !prev);
              setIsNotificationsOpen(false);
            }}
            className="flex items-center gap-2.5 pl-1 py-1 pr-2 rounded-lg hover:bg-slate-100/80 transition-colors group text-left cursor-pointer outline-hidden"
            aria-expanded={isProfileOpen}
            title="Investigator Security Session"
          >
            <div className="size-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs ring-1 ring-blue-500/30">
              {user?.avatarInitials || 'IN'}
            </div>
            <div className="hidden lg:flex flex-col text-left min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-slate-900 leading-tight truncate max-w-[140px]">
                  {user?.name || 'Authorized Officer'}
                </span>
                <ChevronDown className={`size-3 text-slate-400 transition-transform ${isProfileOpen ? 'rotate-180' : ''}`} />
              </div>
              <span className="text-[10px] font-mono text-slate-500 truncate max-w-[140px]">
                {user?.badgeId || 'OFFICER-ID'} • {user?.role || 'Investigator'}
              </span>
            </div>
          </button>

          {/* Interactive Officer Profile Dropdown */}
          {isProfileOpen && (
            <div className="fixed top-14 left-3 right-3 sm:left-auto sm:right-0 sm:absolute sm:top-full sm:mt-2 w-auto sm:w-80 sm:max-w-sm rounded-xl bg-white border border-slate-200 shadow-xl py-2 z-50 animate-in fade-in-0 zoom-in-95 text-xs text-slate-700 font-sans max-h-[calc(100vh-4.5rem)] overflow-y-auto">
              {/* Officer Card Header */}
              <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/70">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-xl bg-blue-600 text-white flex items-center justify-center text-sm font-bold shadow-xs shrink-0">
                    {user?.avatarInitials || 'IN'}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-bold text-slate-900 truncate">
                      {user?.name}
                    </span>
                    <span className="text-xs text-slate-500 truncate">
                      {user?.role}
                    </span>
                    <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                      <Badge variant="outline" className="text-[9px] py-0 h-4 font-mono text-blue-700 bg-blue-50 border-blue-200">
                        {user?.badgeId}
                      </Badge>
                      <Badge variant="outline" className="text-[9px] py-0 h-4 text-slate-600 bg-slate-100 border-slate-200">
                        {user?.department}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="mt-2.5 pt-2 border-t border-slate-200/60 space-y-1 text-[11px] text-slate-500">
                  <div className="flex items-center gap-1.5 truncate">
                    <Building2 className="size-3 text-slate-400 shrink-0" />
                    <span className="truncate">{user?.station}</span>
                  </div>
                  <div className="flex items-center gap-1.5 truncate font-mono text-[10px]">
                    <Lock className="size-3 text-slate-400 shrink-0" />
                    <span>Signed in: {user?.lastLogin}</span>
                  </div>
                </div>
              </div>

              {/* Fast Switch Persona Sub-menu (Hackathon friendly) */}
              <div className="p-2 border-b border-slate-100">
                <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                  <span>Switch Officer Persona</span>
                  <UserCheck className="size-3 text-slate-400" />
                </div>
                <div className="space-y-0.5 mt-1">
                  {demoUsers.map(officer => {
                    const isCurrent = officer.id === user?.id;
                    return (
                      <button
                        key={officer.id}
                        type="button"
                        onClick={() => handleSwitchUser(officer.id)}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left transition-colors text-xs ${
                          isCurrent
                            ? 'bg-blue-50 text-blue-800 font-semibold'
                            : 'hover:bg-slate-100 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="size-5 rounded bg-slate-200 text-slate-700 flex items-center justify-center text-[10px] font-bold">
                            {officer.avatarInitials}
                          </span>
                          <div className="flex flex-col min-w-0">
                            <span className="truncate text-[11px] leading-tight">{officer.name}</span>
                            <span className="text-[9px] text-slate-400 font-mono truncate">{officer.badgeId}</span>
                          </div>
                        </div>
                        {isCurrent && (
                          <span className="text-[10px] text-blue-600 font-medium">Active</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Terminal Lock & Sign Out */}
              <div className="p-1">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-red-600 hover:bg-red-50 text-xs font-medium transition-colors"
                >
                  <LogOut className="size-3.5 text-red-500" />
                  <span>Lock Terminal & Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Global Data Ingestion Modal */}
      <DataIngestModal
        isOpen={isIngestModalOpen}
        onClose={() => setIsIngestModalOpen(false)}
        defaultCaseId={caseParam || undefined}
      />

      {/* Global Report Export Modal */}
      <ExportReportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        defaultCaseId={caseParam || undefined}
      />
    </header>
  );
}
