'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { GlobalSearchModal } from './GlobalSearchModal';
import { AuthProvider, useAuth } from '@/lib/authContext';
import { ProductLogo } from '@/components/common/ProductLogo';

interface AppShellProps {
  children: React.ReactNode;
}

function AppShellContent({ children }: AppShellProps) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (prevPathname !== pathname) {
    setPrevPathname(pathname);
    setIsMobileNavOpen(false);
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Route security gate: Redirect unauthenticated officers to /login
  useEffect(() => {
    if (!isLoading && !isAuthenticated && pathname !== '/login') {
      router.replace('/login');
    }
  }, [isLoading, isAuthenticated, pathname, router]);

  // If on login route, render cleanly full screen
  if (pathname === '/login') {
    return <>{children}</>;
  }

  // Session verification loading screen (Light workstation aesthetic)
  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-50 text-slate-900">
        <div className="flex flex-col items-center gap-4">
          <ProductLogo size="md" variant="icon-only" />
          <div className="flex items-center gap-2 text-xs font-mono text-slate-600">
            <span className="size-2 rounded-full bg-blue-600 animate-ping" />
            <span>Verifying Active Session...</span>
          </div>
        </div>
      </div>
    );
  }

  // If unauthenticated on protected route, show transition state
  if (!isAuthenticated) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-50 text-slate-900">
        <div className="flex flex-col items-center gap-4">
          <ProductLogo size="md" variant="icon-only" />
          <p className="text-xs text-slate-600">Redirecting to Authorization Portal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground antialiased font-sans">
      {/* Sidebar for desktop and mobile drawer */}
      <Sidebar
        isMobileOpen={isMobileNavOpen}
        onCloseMobile={() => setIsMobileNavOpen(false)}
      />

      {/* Main viewport */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        <Suspense fallback={<div className="h-14 bg-card border-b border-border" />}>
          <Header
            onOpenSearch={() => setIsSearchOpen(true)}
            onToggleMobileNav={() => setIsMobileNavOpen(prev => !prev)}
            isMobileNavOpen={isMobileNavOpen}
          />
        </Suspense>
        <main className="flex-1 overflow-y-auto bg-background flex flex-col min-h-0">
          {children}
        </main>
      </div>

      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />
    </div>
  );
}

export function AppShell({ children }: AppShellProps) {
  return (
    <AuthProvider>
      <AppShellContent>{children}</AppShellContent>
    </AuthProvider>
  );
}
