'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  X,
  User,
  Smartphone,
  Car,
  CreditCard,
  MapPin,
  Folder,
  FileText,
  CornerDownLeft
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { globalSearch, type GlobalSearchResult } from '@/lib/dataService';
import { cn } from '@/lib/utils';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const categoryIcons = {
  Person: User,
  Phone: Smartphone,
  Vehicle: Car,
  Account: CreditCard,
  Location: MapPin,
  Organization: Folder,
  Case: Folder,
  Evidence: FileText
};

export function GlobalSearchModal({ isOpen, onClose }: GlobalSearchModalProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Compute search results directly from query and open state
  const results = useMemo(() => {
    if (!isOpen) return [];
    if (query.trim()) {
      return globalSearch(query);
    }
    return globalSearch('Rahul'); // default preview search
  }, [query, isOpen]);

  const activeIndex = results.length > 0 ? Math.min(selectedIndex, results.length - 1) : 0;

  const handleClose = useCallback(() => {
    setQuery('');
    setSelectedIndex(0);
    onClose();
  }, [onClose]);

  const navigateToResult = useCallback((result: GlobalSearchResult) => {
    handleClose();
    router.push(result.href);
  }, [handleClose, router]);

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        handleClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev < results.length - 1 ? prev + 1 : prev));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : 0));
      } else if (e.key === 'Enter' && results[activeIndex]) {
        e.preventDefault();
        navigateToResult(results[activeIndex]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, results, activeIndex, handleClose, navigateToResult]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={handleClose}
    >
      <Card
        className="relative w-full max-w-2xl border-slate-200 bg-white shadow-2xl overflow-hidden flex flex-col max-h-[75vh] p-0"
        onClick={e => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3 border-b border-slate-200 bg-slate-50/70 gap-3">
          <Search className="size-4 text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Search across cases, entities, phones, vehicles, accounts, evidence..."
            className="flex-1 bg-transparent text-sm text-foreground outline-none font-normal"
          />
          {query && (
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              onClick={() => {
                setQuery('');
                setSelectedIndex(0);
              }}
              title="Clear search"
            >
              <X className="size-3.5 text-slate-400 hover:text-slate-700" />
            </Button>
          )}
          <Badge variant="outline" className="font-mono text-[10px] text-slate-500 border-slate-200 bg-white px-1.5 py-0.5">
            ESC
          </Badge>
        </div>

        {/* Search Results */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1 divide-y divide-slate-100">
          {results.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500">
              No matching records found for &ldquo;<span className="text-slate-900 font-medium">{query}</span>&rdquo;
            </div>
          ) : (
            results.map((result, idx) => {
              const isSelected = idx === selectedIndex;
              const Icon = categoryIcons[result.category as keyof typeof categoryIcons] || Folder;

              return (
                <div
                  key={`${result.category}-${result.id}-${idx}`}
                  onClick={() => navigateToResult(result)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={cn(
                    'flex items-center justify-between px-3 py-2.5 rounded-md cursor-pointer transition-colors text-xs',
                    isSelected
                      ? 'bg-blue-50 text-blue-950 border border-blue-200'
                      : 'hover:bg-slate-50 text-slate-800 border border-transparent'
                  )}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="size-7 rounded-md bg-blue-50 border border-blue-200 flex items-center justify-center shrink-0 text-blue-700">
                      <Icon className="size-3.5" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900 truncate">
                          {result.title}
                        </span>
                        <Badge variant="outline" className="text-[10px] font-normal text-slate-600 border-slate-200 bg-white">
                          {result.category}
                        </Badge>
                      </div>
                      <span className="text-[11px] text-slate-500 truncate mt-0.5 font-mono">
                        {result.subtitle}
                      </span>
                    </div>
                  </div>

                  {isSelected && (
                    <div className="flex items-center gap-1 text-[10px] text-blue-700 font-mono shrink-0 pl-2">
                      <span>Select</span>
                      <CornerDownLeft className="size-3" />
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-4 py-2 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-[11px] font-mono text-slate-500">
          <div className="flex items-center gap-3">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
            <span>ESC Close</span>
          </div>
          <span>Local Forensic Index</span>
        </div>
      </Card>
    </div>
  );
}
