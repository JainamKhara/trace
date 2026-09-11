'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  UploadCloud,
  PenTool
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileUploadZone } from './FileUploadZone';
import { ManualEntryForm } from './ManualEntryForm';
import { getCases, getEntities } from '@/lib/dataService';

interface DataIngestModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'files' | 'manual';
  defaultCaseId?: string;
  onSuccess?: () => void;
}

export function DataIngestModal({
  isOpen,
  onClose,
  defaultTab = 'files',
  defaultCaseId,
  onSuccess
}: DataIngestModalProps) {
  const [activeTab, setActiveTab] = useState<'files' | 'manual'>(defaultTab);
  const [prevDefaultTab, setPrevDefaultTab] = useState(defaultTab);
  if (defaultTab !== prevDefaultTab) {
    setPrevDefaultTab(defaultTab);
    setActiveTab(defaultTab);
  }

  const cases = React.useMemo(() => (isOpen ? getCases() : []), [isOpen]);
  const entities = React.useMemo(() => (isOpen ? getEntities() : []), [isOpen]);

  // Escape key listener for keyboard dismissal
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="ingest-modal-title"
    >
      <Card
        className="relative w-full max-w-3xl border-slate-200 bg-white shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-xs p-0 animate-in zoom-in-95 duration-150"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <CardHeader className="px-5 py-3.5 border-b border-slate-200 flex flex-row items-center justify-between gap-3 shrink-0 bg-slate-50/70">
          <div className="flex flex-col gap-0.5 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-blue-700 flex items-center gap-1.5">
                <UploadCloud className="size-3.5 text-blue-600" />
                <span>Add Case Data</span>
              </span>
            </div>
            <CardTitle id="ingest-modal-title" className="text-sm font-bold text-slate-900 truncate">
              Upload Files or Enter Data Manually
            </CardTitle>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            onClick={onClose}
            title="Close modal"
            className="text-slate-500 hover:text-slate-900 hover:bg-slate-200"
          >
            <X className="size-4" />
          </Button>
        </CardHeader>

        {/* Tab Switcher */}
        <div className="px-5 pt-3 pb-2 bg-white border-b border-slate-100 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-lg">
            <button
              type="button"
              onClick={() => setActiveTab('files')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                activeTab === 'files'
                  ? 'bg-white text-blue-700 font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <UploadCloud className="size-3.5" />
              <span>Upload Files</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('manual')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                activeTab === 'manual'
                  ? 'bg-white text-blue-700 font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <PenTool className="size-3.5" />
              <span>Manual Entry</span>
            </button>
          </div>
        </div>

        {/* Body Content */}
        <CardContent className="flex-1 overflow-y-auto p-5">
          {activeTab === 'files' ? (
            <FileUploadZone
              cases={cases}
              defaultCaseId={defaultCaseId}
              onSuccess={() => {
                if (onSuccess) onSuccess();
              }}
            />
          ) : (
            <ManualEntryForm
              cases={cases}
              entities={entities}
              defaultCaseId={defaultCaseId}
              onSuccess={() => {
                if (onSuccess) onSuccess();
              }}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
