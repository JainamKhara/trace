'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/authContext';
import { ProductLogo } from '@/components/common/ProductLogo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Users, LogIn, Eye, EyeOff, AlertCircle, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { demoUsers, login, quickLogin, isAuthenticated, user } = useAuth();

  const [activeTab, setActiveTab] = useState<'demo' | 'credentials'>('demo');
  const [badgeInput, setBadgeInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleQuickLogin = async (userId: string) => {
    setErrorMsg(null);
    setIsLoading(true);
    await quickLogin(userId);
    router.push('/dashboard');
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!badgeInput.trim()) {
      setErrorMsg('Please enter your Badge ID or Email.');
      return;
    }

    setIsLoading(true);
    const res = await login(badgeInput, passwordInput);
    if (res.success) {
      router.push('/dashboard');
    } else {
      setIsLoading(false);
      setErrorMsg(res.error || 'Authentication failed.');
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-50 flex items-center justify-center p-4 font-sans select-none">
      <div className="w-full max-w-[420px] bg-white border border-slate-200 rounded-xl shadow-sm p-6 sm:p-8 space-y-6">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center">
          <ProductLogo size="lg" variant="stacked" showSubtitle={true} />
          <p className="text-xs text-slate-500 mt-2">
            Investigation & Criminal Network Analysis System
          </p>
        </div>

        {/* Active Session Notice if already logged in */}
        {isAuthenticated && user && (
          <div className="p-3 bg-blue-50/80 border border-blue-200 rounded-lg text-xs flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="font-semibold text-slate-900 truncate">
                Active Session: {user.name}
              </p>
              <p className="text-[11px] text-slate-600 font-mono truncate">
                {user.badgeId} • {user.role}
              </p>
            </div>
            <Button
              type="button"
              size="sm"
              onClick={() => router.push('/dashboard')}
              className="h-7 px-2.5 text-xs bg-blue-600 hover:bg-blue-700 text-white shrink-0 font-medium cursor-pointer"
            >
              Enter <ArrowRight className="size-3 ml-1" />
            </Button>
          </div>
        )}

        {/* Mode Switcher */}
        <div className="flex items-center p-1 bg-slate-100 rounded-lg text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('demo')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md font-medium transition-all focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-blue-600 ${
              activeTab === 'demo'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-700 hover:text-slate-900'
            }`}
          >
            <Users className="size-3.5" />
            <span>Test Accounts</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('credentials')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md font-medium transition-all focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-blue-600 ${
              activeTab === 'credentials'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-700 hover:text-slate-900'
            }`}
          >
            <LogIn className="size-3.5" />
            <span>Manual Sign In</span>
          </button>
        </div>

        {/* Tab 1: Test Accounts */}
        {activeTab === 'demo' && (
          <div className="space-y-2.5">
            <div className="text-[11px] font-medium text-slate-600 px-0.5">
              Select an investigator profile to continue:
            </div>

            <div className="space-y-2">
              {demoUsers.map(officer => (
                <button
                  key={officer.id}
                  type="button"
                  disabled={isLoading}
                  onClick={() => handleQuickLogin(officer.id)}
                  className="w-full text-left p-3 rounded-lg border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 transition-all flex items-center justify-between gap-3 group bg-slate-50/50 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-blue-600"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="size-8 rounded-lg bg-blue-100 text-blue-700 font-semibold text-xs flex items-center justify-center shrink-0">
                      {officer.avatarInitials}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-semibold text-slate-900 group-hover:text-blue-700 transition-colors truncate">
                        {officer.name}
                      </span>
                      <span className="text-[11px] text-slate-600 truncate">
                        {officer.role} • {officer.department}
                      </span>
                    </div>
                  </div>

                  <ArrowRight className="size-4 text-slate-500 group-hover:text-blue-600 transition-colors shrink-0" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Tab 2: Manual Credentials */}
        {activeTab === 'credentials' && (
          <form onSubmit={handleManualSubmit} className="space-y-3.5">
            {errorMsg && (
              <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="size-4 shrink-0 text-red-600" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-800">Badge ID or Email</label>
              <Input
                type="text"
                value={badgeInput}
                onChange={e => setBadgeInput(e.target.value)}
                placeholder="e.g. SCB-7821"
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-800">Password</label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={passwordInput}
                  onChange={e => setPasswordInput(e.target.value)}
                  placeholder="••••••••"
                  className="h-9 text-xs pr-9"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-2.5 text-slate-500 hover:text-slate-700 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-blue-600 rounded"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={() => {
                  setBadgeInput('SCB-7821');
                  setPasswordInput('password123');
                }}
                className="text-[11px] text-blue-700 hover:underline font-medium focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-blue-600 rounded px-1"
              >
                Use sample credentials
              </button>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs h-9 font-medium shadow-xs"
            >
              {isLoading ? 'Signing In...' : 'Sign In'}
            </Button>
          </form>
        )}

        {/* Footer Note */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-600">
          <span>Local Forensic Prototype</span>
          <span className="font-medium text-slate-700">TRACE Intelligence</span>
        </div>
      </div>
    </div>
  );
}
