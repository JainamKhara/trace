'use client';

import React, { useState, useEffect } from 'react';
import { X, FolderPlus, CheckCircle2 } from 'lucide-react';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { useAuth } from '@/lib/authContext';
import { addCustomCase, getCases } from '@/lib/dataService';
import type { Case, CaseStatus } from '@/types/investigation';

interface NewCaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (newCase: Case) => void;
}

function getNextSuggestedCaseId(): string {
  const existing = getCases();
  const numbers = existing
    .map(c => {
      const match = c.id.match(/\d+/);
      return match ? parseInt(match[0], 10) : 0;
    })
    .filter(n => !isNaN(n));
  const nextNum = (numbers.length > 0 ? Math.max(...numbers) : 100) + 1;
  return `CASE-${nextNum}`;
}

function NewCaseDialogContent({
  onClose,
  onSuccess
}: {
  onClose: () => void;
  onSuccess?: (newCase: Case) => void;
}) {
  const { user } = useAuth();

  const [id, setId] = useState(() => getNextSuggestedCaseId());
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'High' | 'Medium' | 'Low'>('High');
  const [status, setStatus] = useState<CaseStatus>('Active');
  const [leadInvestigator, setLeadInvestigator] = useState(() =>
    user?.name ? `${user.name} (${user.badgeId})` : 'Insp. Vikramaditya'
  );
  const [tagsInput, setTagsInput] = useState('Financial, Fraud');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Escape key handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !id.trim()) {
      setError('Please provide both a Case ID and Title.');
      return;
    }

    setIsSubmitting(true);
    const now = new Date().toISOString().slice(0, 10);

    const tags = tagsInput
      .split(',')
      .map(t => t.trim())
      .filter(Boolean);

    const newCaseRecord: Case = {
      id: id.trim().toUpperCase(),
      title: title.trim(),
      description: description.trim() || `Investigation opened on ${now}.`,
      status,
      priority,
      leadInvestigator: leadInvestigator.trim() || 'Lead Investigator',
      tags: tags.length > 0 ? tags : ['General'],
      entityCount: 0,
      relationshipCount: 0,
      evidenceCount: 0,
      lastUpdated: 'Just now',
      dateOpened: now
    };

    try {
      addCustomCase(newCaseRecord);
      setIsSubmitting(false);
      if (onSuccess) {
        onSuccess(newCaseRecord);
      }
      onClose();
    } catch {
      setError('Failed to create case record.');
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <Card
        className="relative w-full max-w-lg border-slate-200 bg-white shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-xs p-0 animate-in zoom-in-95 duration-150"
        onClick={e => e.stopPropagation()}
      >
        <CardHeader className="px-5 py-3.5 border-b border-slate-200 flex flex-row items-center justify-between gap-3 shrink-0 bg-slate-50/70">
          <div className="flex items-center gap-2">
            <div className="size-7 rounded-md bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center">
              <FolderPlus className="size-4" />
            </div>
            <div>
              <CardTitle className="text-sm font-bold text-slate-900">
                Register New Case File
              </CardTitle>
              <p className="text-[11px] text-slate-500">
                Create a case file to organize evidence, entities, and timelines.
              </p>
            </div>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            onClick={onClose}
            className="text-slate-500 hover:text-slate-900 hover:bg-slate-200"
          >
            <X className="size-4" />
          </Button>
        </CardHeader>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-3.5">
          {error && (
            <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 rounded-md text-xs">
              {error}
            </div>
          )}

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-1">
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Case ID <span className="text-red-500">*</span>
              </label>
              <Input
                type="text"
                value={id}
                onChange={e => setId(e.target.value)}
                placeholder="CASE-105"
                className="h-8 text-xs font-mono uppercase bg-slate-50"
                required
              />
            </div>

            <div className="col-span-2">
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Priority
              </label>
              <Select
                value={priority}
                onValueChange={v => v && setPriority(v as 'High' | 'Medium' | 'Low')}
              >
                <SelectTrigger className="h-8 text-xs bg-white w-full border-slate-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="High">High Priority</SelectItem>
                  <SelectItem value="Medium">Medium Priority</SelectItem>
                  <SelectItem value="Low">Low Priority</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
              Case Title <span className="text-red-500">*</span>
            </label>
            <Input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Cross-Border Shell Company & Hawala Network"
              className="h-8 text-xs bg-white w-full"
              required
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
              Description & Investigation Scope
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Describe initial complaint, jurisdiction, and target entities..."
              className="w-full p-2.5 text-xs rounded-md border border-slate-200 bg-white focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-blue-600"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Initial Status
              </label>
              <Select
                value={status}
                onValueChange={v => v && setStatus(v as CaseStatus)}
              >
                <SelectTrigger className="h-8 text-xs bg-white w-full border-slate-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active Investigation</SelectItem>
                  <SelectItem value="Review">Under Review</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Lead Investigator
              </label>
              <Input
                type="text"
                value={leadInvestigator}
                onChange={e => setLeadInvestigator(e.target.value)}
                placeholder="Investigator name"
                className="h-8 text-xs bg-white w-full"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
              Tags (comma-separated)
            </label>
            <Input
              type="text"
              value={tagsInput}
              onChange={e => setTagsInput(e.target.value)}
              placeholder="Financial, Hawala, Cyber, Interstate"
              className="h-8 text-xs bg-white w-full"
            />
          </div>

          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              className="h-8 text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting}
              className="h-8 text-xs bg-blue-600 hover:bg-blue-700 text-white font-medium"
            >
              <CheckCircle2 className="size-3.5 mr-1.5" />
              <span>{isSubmitting ? 'Creating...' : 'Create Case File'}</span>
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

export function NewCaseModal({ isOpen, onClose, onSuccess }: NewCaseModalProps) {
  if (!isOpen) return null;

  return (
    <NewCaseDialogContent onClose={onClose} onSuccess={onSuccess} />
  );
}
