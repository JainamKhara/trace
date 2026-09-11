'use client';

import React from 'react';
import Link from 'next/link';
import {
  X,
  ShieldCheck,
  Network,
  FileCode
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import type { Evidence, Entity } from '@/types/investigation';
import { ConfidenceBadge } from '@/components/common/ConfidenceBadge';
import { ClassificationBadge } from '@/components/common/ClassificationBadge';
import { getEntityById } from '@/lib/dataService';
import { cn } from '@/lib/utils';

interface EvidenceDetailModalProps {
  evidence: Evidence | null;
  onClose: () => void;
}

export function EvidenceDetailModal({ evidence, onClose }: EvidenceDetailModalProps) {
  // Finding 2 fix: Escape key listener for keyboard dismissal
  React.useEffect(() => {
    if (!evidence) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [evidence, onClose]);

  if (!evidence) return null;

  const linkedEntities = evidence.relatedEntityIds
    .map(id => getEntityById(id))
    .filter(Boolean) as Entity[];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="evidence-modal-title"
    >
      <Card
        className="relative w-full max-w-2xl border-border bg-card shadow-2xl overflow-hidden flex flex-col max-h-[85vh] text-xs p-0"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <CardHeader className="px-5 py-4 border-b border-border flex flex-row items-start justify-between gap-3 shrink-0">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-semibold text-primary">
                {evidence.id}
              </span>
              <ClassificationBadge status={evidence.status} size="sm" />
              <Badge variant="outline" className="text-[10px] font-normal text-muted-foreground">
                {evidence.type}
              </Badge>
            </div>
            <CardTitle id="evidence-modal-title" className="text-sm font-semibold text-foreground">
              {evidence.title}
            </CardTitle>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            onClick={onClose}
            title="Close modal"
          >
            <X className="size-4 text-muted-foreground" />
          </Button>
        </CardHeader>

        {/* Modal Body */}
        <CardContent className="flex-1 overflow-y-auto p-5 flex flex-col gap-4">
          {/* Metadata Grid */}
          <div className="p-3.5 rounded-lg bg-muted/20 border border-border grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
            <div>
              <span className="text-[11px] text-muted-foreground block">Case Association</span>
              <Link
                href={`/cases/${evidence.caseId}`}
                className="text-primary hover:underline font-mono font-medium text-xs"
              >
                {evidence.caseId}
              </Link>
            </div>
            <div>
              <span className="text-[11px] text-muted-foreground block mb-0.5">Confidence Rating</span>
              <ConfidenceBadge score={evidence.confidence} label="Signal" size="sm" />
            </div>
            <div>
              <span className="text-[11px] text-muted-foreground block">Source Document</span>
              <span className="text-foreground truncate block font-mono text-[11px]">{evidence.sourceFile}</span>
            </div>
            <div>
              <span className="text-[11px] text-muted-foreground block">Timestamp</span>
              <span className="text-foreground text-xs">{evidence.timestamp}</span>
            </div>
          </div>

          {/* Forensic Summary */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-medium text-muted-foreground">
              Forensic Record Summary
            </span>
            <div className="p-3 rounded-md bg-muted/20 border border-border">
              <p className="text-foreground text-xs leading-relaxed">
                {evidence.summary}
              </p>
            </div>
          </div>

          {/* Classification Rationale */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-medium text-muted-foreground">
              Evidence Classification Rationale
            </span>
            <div className="p-3 rounded-md bg-muted/20 border border-border flex items-start gap-2.5">
              <ShieldCheck className="size-4 text-primary shrink-0 mt-0.5" />
              <p className="text-muted-foreground text-xs leading-relaxed">
                {evidence.classificationRationale}
              </p>
            </div>
          </div>

          {/* Linked Entities */}
          <div className="flex flex-col gap-2">
            <span className="text-[11px] font-medium text-muted-foreground">
              Corroborated Entities ({linkedEntities.length})
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {linkedEntities.map(e => (
                <div
                  key={e.id}
                  className="p-2.5 rounded-md bg-muted/20 border border-border flex items-center justify-between text-xs"
                >
                  <div className="min-w-0">
                    <span className="font-medium text-foreground block truncate">
                      {e.name}
                    </span>
                    <span className="text-[11px] text-muted-foreground">{e.type} • {e.primaryCase}</span>
                  </div>
                  <Link
                    href={`/network?entity=${e.id}&case=${e.primaryCase}`}
                    title="View in Network Graph"
                    className={cn(buttonVariants({ variant: 'ghost', size: 'icon-xs' }))}
                  >
                    <Network className="size-3.5 text-primary" />
                  </Link>
                </div>
              ))}
            </div>
          </div>

          {/* Raw Structured Data Preview */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5">
              <FileCode className="size-3.5 text-primary" />
              <span>Switch / Telematics Record Excerpt</span>
            </span>
            <pre className="p-3 rounded-md bg-muted/30 border border-border text-foreground font-mono text-[11px] overflow-x-auto">
              {JSON.stringify(evidence.rawDataPreview, null, 2)}
            </pre>
          </div>
        </CardContent>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-border bg-muted/10 flex items-center justify-between shrink-0">
          <span className="text-[11px] font-mono text-muted-foreground">
            Provenance Record: {evidence.id}-VERIFIED
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
          >
            Close Dossier
          </Button>
        </div>
      </Card>
    </div>
  );
}
