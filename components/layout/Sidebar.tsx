'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  FolderKanban,
  Network,
  FileSearch,
  Clock,
  HardDrive,
  ShieldCheck,
  LogOut,
  X,
  UploadCloud
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ProductLogo } from '@/components/common/ProductLogo';
import { useAuth } from '@/lib/authContext';
import { getCases, getEvidence, subscribeDataUpdates } from '@/lib/dataService';
import { cn } from '@/lib/utils';

export interface SidebarProps {
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export function Sidebar({ isMobileOpen = false, onCloseMobile }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  // Dynamic counts from data service with live reactive updates
  const [caseCount, setCaseCount] = React.useState(() => getCases().length);
  const [evidenceCount, setEvidenceCount] = React.useState(() => getEvidence().length);

  React.useEffect(() => {
    const unsubscribe = subscribeDataUpdates(() => {
      setCaseCount(getCases().length);
      setEvidenceCount(getEvidence().length);
    });
    return unsubscribe;
  }, []);

  const navSections = [
    {
      label: 'Operations',
      items: [
        { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
        { name: 'Cases', href: '/cases', icon: FolderKanban, badge: `${caseCount}` }
      ]
    },
    {
      label: 'Evidence & Intake',
      items: [
        { name: 'Data Ingestion', href: '/ingest', icon: UploadCloud },
        { name: 'Evidence', href: '/evidence', icon: FileSearch, badge: `${evidenceCount}` }
      ]
    },
    {
      label: 'Intelligence Analysis',
      items: [
        { name: 'Network Analysis', href: '/network', icon: Network },
        { name: 'Timeline', href: '/timeline', icon: Clock }
      ]
    }
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full w-64 bg-card select-none text-xs">
      {/* Brand Header with TRACE Product Logo */}
      <div className="h-14 px-3.5 flex items-center justify-between border-b border-border bg-card shrink-0">
        <Link
          href="/dashboard"
          onClick={onCloseMobile}
          className="flex items-center group focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-blue-600 rounded-md"
        >
          <ProductLogo size="sm" variant="horizontal" showSubtitle={true} />
        </Link>
        {onCloseMobile && isMobileOpen && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onCloseMobile}
            className="md:hidden size-8 text-slate-500 hover:text-slate-900"
            aria-label="Close Sidebar"
          >
            <X className="size-4" />
          </Button>
        )}
      </div>

      {/* Primary Navigation with Grouped Workflow Sections */}
      <div className="flex-1 py-3 px-3 flex flex-col gap-4 overflow-y-auto">
        {navSections.map(section => (
          <div key={section.label} className="flex flex-col gap-1">
            <div className="px-3 pb-1 text-[10px] font-semibold text-slate-600 uppercase tracking-wider">
              <span>{section.label}</span>
            </div>

            {section.items.map(item => {
              const isActive =
                pathname === item.href ||
                (item.href !== '/dashboard' && pathname.startsWith(item.href));

              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onCloseMobile}
                  className={cn(
                    'flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition-colors group focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-blue-600',
                    isActive
                      ? 'bg-blue-50 text-blue-700 font-semibold border border-blue-200 shadow-xs'
                      : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100/80'
                  )}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon
                      className={cn(
                        'size-4 shrink-0 transition-colors',
                        isActive ? 'text-blue-600' : 'text-slate-500 group-hover:text-slate-800'
                      )}
                    />
                    <span className="truncate">{item.name}</span>
                  </div>
                  {item.badge && (
                    <Badge
                      variant={isActive ? 'default' : 'secondary'}
                      className={cn(
                        'text-[10px] py-0 px-1.5 h-4 font-mono font-normal tabular-nums',
                        isActive ? 'bg-blue-600 text-white font-medium' : 'text-slate-700 bg-slate-100 border border-slate-200'
                      )}
                    >
                      {item.badge}
                    </Badge>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </div>

      {/* Active Officer Status & Offline Ready Footer */}
      <div className="p-3 border-t border-border flex flex-col gap-2.5 shrink-0 bg-slate-50/70">
        {/* Active Investigator Strip */}
        {user && (
          <div className="p-2 rounded-lg bg-white border border-slate-200 shadow-xs flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="size-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                {user.avatarInitials}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[11px] font-semibold text-slate-900 truncate leading-tight">
                  {user.name}
                </span>
                <span className="text-[10px] font-mono text-slate-600 truncate">
                  {user.badgeId}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                logout();
                router.push('/login');
              }}
              title="Lock Terminal / Sign Out"
              className="size-8 rounded hover:bg-red-50 text-slate-500 hover:text-red-600 flex items-center justify-center transition-colors shrink-0 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-red-500"
              aria-label="Lock Terminal and Sign Out"
            >
              <LogOut className="size-3.5" />
            </button>
          </div>
        )}

        <div className="flex items-center justify-between text-xs px-1">
          <div className="flex items-center gap-2 text-emerald-700 font-medium">
            <span className="relative flex size-2">
              <span className="animate-ping absolute inline-flex size-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full size-2 bg-emerald-500"></span>
            </span>
            <span className="text-[11px]">Offline Ready</span>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-slate-600">
            <HardDrive className="size-3 text-slate-500" />
            <span>Local DB</span>
          </div>
        </div>

        <div className="p-2 rounded-md bg-slate-100/80 border border-slate-200 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-slate-700 text-[11px]">
            <ShieldCheck className="size-3.5 text-blue-600 shrink-0" />
            <span className="truncate">Investigation Prototype</span>
          </div>
          <Badge variant="outline" className="text-[9px] py-0 h-4 text-slate-700 font-normal bg-white border-slate-200">
            Local Data
          </Badge>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar (Finding 3 fix) */}
      <aside
        className="hidden md:flex w-64 bg-card border-r border-border flex-col shrink-0 select-none text-xs h-screen sticky top-0 z-30 shadow-xs"
        aria-label="Investigation Navigation Sidebar"
      >
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Overlay and Flyout (Finding 3 fix) */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex animate-in fade-in duration-150">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <aside
            className="relative w-64 max-w-[80vw] bg-card h-full shadow-2xl z-50 flex flex-col animate-in slide-in-from-left duration-200"
            aria-label="Mobile Navigation Sidebar"
          >
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
}
