'use client';

import React from 'react';
import Link from 'next/link';
import {
  FileSearch,
  ArrowRight,
  GitFork,
  X
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import type { Relationship, Entity } from '@/types/investigation';
import { ConfidenceBadge } from '@/components/common/ConfidenceBadge';
import { ClassificationBadge } from '@/components/common/ClassificationBadge';
import { cn } from '@/lib/utils';

interface RelationshipPanelProps {
  relationship: Relationship;
  sourceEntity?: Entity;
  targetEntity?: Entity;
  evidenceId?: string;
  onClose?: () => void;
}

export function RelationshipPanel({
  relationship,
  sourceEntity,
  targetEntity,
  evidenceId = 'EV-001',
  onClose
}: RelationshipPanelProps) {
  return (
    <div className="h-full flex flex-col bg-card overflow-hidden text-xs select-none">
      {/* Header */}
      <div className="p-4 border-b border-border flex items-start justify-between gap-3 shrink-0">
        <div className="flex flex-col gap-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-medium text-slate-500">
              Relationship Provenance
            </span>
            {relationship.isCrossCase && (
              <Badge variant="outline" className="text-[10px] border-amber-200 bg-amber-50 text-amber-800 gap-1 font-normal">
                <GitFork className="size-2.5" />
                Cross-Case Link
              </Badge>
            )}
          </div>
          <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-1.5 truncate">
            <span className="truncate">{sourceEntity?.name || relationship.sourceId}</span>
            <ArrowRight className="size-3.5 text-blue-600 shrink-0" />
            <span className="truncate">{targetEntity?.name || relationship.targetId}</span>
          </h2>
        </div>

        {onClose && (
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            onClick={onClose}
            title="Close panel"
          >
            <X className="size-4 text-slate-400 hover:text-slate-700" />
          </Button>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
        {/* Core Provenance Card */}
        <Card className="border-border bg-muted/20 shadow-none">
          <CardContent className="p-3 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <Badge variant="secondary" className="font-mono text-xs text-primary font-medium">
                {relationship.type}
              </Badge>
              <ClassificationBadge status={relationship.status} size="sm" />
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs pt-1">
              <div>
                <span className="text-[11px] text-muted-foreground block">Source Document</span>
                <span className="text-foreground font-medium truncate block">
                  {relationship.sourceDoc}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-muted-foreground block mb-0.5">Confidence</span>
                <ConfidenceBadge score={relationship.confidence} label="Link" size="sm" />
              </div>
              <div>
                <span className="text-[11px] text-muted-foreground block">Timestamp</span>
                <span className="text-foreground font-mono text-[11px]">{relationship.timestamp}</span>
              </div>
              <div>
                <span className="text-[11px] text-muted-foreground block">Case Scope</span>
                <span className="text-primary font-mono text-xs font-medium">{relationship.caseId}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Metadata Details */}
        {relationship.metadata && (
          <Card className="border-border bg-muted/20 shadow-none">
            <CardContent className="p-3 flex flex-col gap-2 text-xs">
              <span className="text-[11px] font-medium text-muted-foreground block">
                Observed Parameters
              </span>
              {relationship.metadata.callDurationSec !== undefined && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-[11px]">Call Duration:</span>
                  <span className="text-foreground font-mono">{relationship.metadata.callDurationSec} seconds</span>
                </div>
              )}
              {relationship.metadata.amountInr !== undefined && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-[11px]">Amount:</span>
                  <span className="text-emerald-500 font-semibold font-mono">₹{relationship.metadata.amountInr.toLocaleString()}</span>
                </div>
              )}
              {relationship.metadata.frequency !== undefined && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-[11px]">Frequency:</span>
                  <span className="text-foreground font-mono">{relationship.metadata.frequency} events</span>
                </div>
              )}
              {relationship.metadata.locationNote && (
                <div className="flex flex-col pt-1">
                  <span className="text-muted-foreground text-[11px]">Location Correlation:</span>
                  <span className="text-foreground">{relationship.metadata.locationNote}</span>
                </div>
              )}
              {relationship.metadata.notes && (
                <div className="flex flex-col pt-1">
                  <span className="text-muted-foreground text-[11px]">Corroboration Note:</span>
                  <span className="text-foreground/90 leading-relaxed mt-0.5">
                    {relationship.metadata.notes}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Investigative Context Explanation */}
        <div className="flex flex-col gap-1.5">
          <span className="text-[11px] font-medium text-muted-foreground">
            Analysis Rationale
          </span>
          <Card className="border-border bg-muted/20 shadow-none p-3">
            <p className="text-xs text-foreground/90 leading-relaxed">
              Forensic extraction identified this link from {relationship.sourceDoc}. 
              The system correlated multiple independent data points and derived a confidence of {relationship.confidence}%.
            </p>
          </Card>
        </div>

        {/* Connected Endpoints */}
        <div className="flex flex-col gap-2">
          <span className="text-[11px] font-medium text-slate-500">
            Connected Endpoints
          </span>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 rounded-md bg-slate-50 border border-slate-200 flex flex-col gap-0.5">
              <span className="text-[10px] text-slate-400 uppercase font-medium tracking-wider">Origin</span>
              <span className="text-blue-700 font-semibold truncate">
                {sourceEntity?.name || relationship.sourceId}
              </span>
              <span className="text-[11px] text-slate-500">{sourceEntity?.type}</span>
            </div>
            <div className="p-2.5 rounded-md bg-slate-50 border border-slate-200 flex flex-col gap-0.5">
              <span className="text-[10px] text-slate-400 uppercase font-medium tracking-wider">Target</span>
              <span className="text-indigo-700 font-semibold truncate">
                {targetEntity?.name || relationship.targetId}
              </span>
              <span className="text-[11px] text-slate-500">{targetEntity?.type}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer CTA: View Evidence */}
      <div className="p-3 border-t border-border flex items-center justify-between gap-2 shrink-0">
        <Link
          href={`/evidence?id=${evidenceId}`}
          className={cn(buttonVariants({ variant: 'default', size: 'sm' }), 'w-full gap-2')}
        >
          <FileSearch className="size-4" />
          <span>View Supporting Evidence</span>
        </Link>
      </div>
    </div>
  );
}
