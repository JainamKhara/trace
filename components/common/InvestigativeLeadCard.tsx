'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  GitFork,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ArrowRight,
  AlertTriangle,
  MessageSquare
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import type { InvestigativeLead, ReviewStatus } from '@/types/investigation';
import { ConfidenceBadge } from './ConfidenceBadge';
import { saveReviewStatus } from '@/lib/dataService';
import { cn } from '@/lib/utils';

interface InvestigativeLeadCardProps {
  lead: InvestigativeLead;
  onStatusChange?: (leadId: string, status: ReviewStatus) => void;
  compact?: boolean;
}

export function InvestigativeLeadCard({
  lead,
  onStatusChange,
  compact = false
}: InvestigativeLeadCardProps) {
  const [currentStatus, setCurrentStatus] = useState<ReviewStatus>(lead.reviewStatus);
  const [showNotes, setShowNotes] = useState(false);
  const [notes, setNotes] = useState(lead.reviewNotes || '');

  const handleAction = (status: ReviewStatus) => {
    setCurrentStatus(status);
    saveReviewStatus(lead.id, status, notes);
    if (onStatusChange) {
      onStatusChange(lead.id, status);
    }
  };

  const statusConfigs: Record<ReviewStatus, { label: string; badgeVariant: 'outline' | 'secondary' | 'destructive' | 'default'; className: string; icon: React.ComponentType<{ className?: string }> }> = {
    Pending: {
      label: 'Requires Review',
      badgeVariant: 'outline',
      className: 'border-amber-200 bg-amber-50 text-amber-800',
      icon: AlertTriangle
    },
    Accepted: {
      label: 'Investigator Corroborated',
      badgeVariant: 'outline',
      className: 'border-emerald-200 bg-emerald-50 text-emerald-800',
      icon: CheckCircle2
    },
    Rejected: {
      label: 'False Positive',
      badgeVariant: 'outline',
      className: 'border-rose-200 bg-rose-50 text-rose-800',
      icon: XCircle
    },
    Uncertain: {
      label: 'Pending Field Corroboration',
      badgeVariant: 'outline',
      className: 'border-slate-200 bg-slate-50 text-slate-700',
      icon: HelpCircle
    }
  };

  const statusConfig = statusConfigs[currentStatus];
  const StatusIcon = statusConfig.icon;

  return (
    <Card
      className={cn(
        'border-border bg-card shadow-xs transition-colors flex flex-col justify-between overflow-hidden',
        currentStatus === 'Accepted' && 'border-emerald-300 ring-1 ring-emerald-100',
        currentStatus === 'Rejected' && 'border-slate-200 opacity-75',
        currentStatus === 'Uncertain' && 'border-amber-300 ring-1 ring-amber-100'
      )}
    >
      <CardHeader className="p-4 pb-3 border-b border-border/70 flex flex-col gap-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <Badge variant="secondary" className="gap-1 text-[11px] font-medium text-foreground bg-secondary">
              <GitFork className="size-3 text-primary" />
              {lead.type}
            </Badge>
            {lead.relatedCaseIds.map(cid => (
              <Badge key={cid} variant="outline" className="text-[10px] text-muted-foreground font-mono tabular-nums">
                {cid}
              </Badge>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <ConfidenceBadge score={lead.confidence} label="Confidence" size="sm" />
            <Badge variant="outline" className={cn('gap-1 text-[10px] font-normal py-0 h-5', statusConfig.className)}>
              <StatusIcon className="size-3 shrink-0" />
              <span>{statusConfig.label}</span>
            </Badge>
          </div>
        </div>

        <CardTitle className="text-sm font-semibold text-foreground leading-snug">
          {lead.title}
        </CardTitle>
      </CardHeader>

      <CardContent className="p-4 flex-1 flex flex-col gap-3 text-xs">
        <div>
          <span className="text-xs font-medium text-muted-foreground block mb-2">
            Correlated Signals
          </span>
          <ul className="flex flex-col gap-1.5 text-foreground/90">
            {lead.signals.map((sig, idx) => (
              <li key={idx} className="flex items-start gap-2 text-xs">
                <span className="size-1.5 rounded-full bg-primary/70 mt-1.5 shrink-0" />
                <span className="text-muted-foreground leading-relaxed">{sig}</span>
              </li>
            ))}
          </ul>
        </div>

        {!compact && (
          <p className="text-xs text-muted-foreground leading-relaxed pt-2 border-t border-border/50">
            {lead.rationale}
          </p>
        )}

        {lead.reviewedBy && (
          <div className="flex items-center justify-between text-[11px] text-muted-foreground bg-muted/30 px-2.5 py-1.5 rounded-md border border-border/60">
            <span>Determination logged</span>
            <span className="font-medium text-foreground">{lead.reviewedBy}</span>
          </div>
        )}

        {showNotes && (
          <div className="flex flex-col gap-1.5 pt-1">
            <label className="text-[11px] font-medium text-muted-foreground">
              Investigator Determination Note:
            </label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Record justification or operational instructions..."
              className="w-full text-xs p-2.5 rounded-md bg-muted/30 border border-input focus:outline-none focus:ring-1 focus:ring-ring resize-none text-foreground"
              rows={2}
            />
          </div>
        )}
      </CardContent>

      <CardFooter className="p-3 px-4 border-t border-border/70 bg-muted/20 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <Button
            type="button"
            size="xs"
            variant={currentStatus === 'Accepted' ? 'default' : 'outline'}
            onClick={() => handleAction('Accepted')}
            className={cn(
              currentStatus === 'Accepted'
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                : 'hover:border-emerald-300 hover:text-emerald-700 hover:bg-emerald-50'
            )}
            title="Accept this investigative correlation"
          >
            <CheckCircle2 className="size-3" />
            Accept
          </Button>

          <Button
            type="button"
            size="xs"
            variant={currentStatus === 'Rejected' ? 'destructive' : 'outline'}
            onClick={() => handleAction('Rejected')}
            className={cn(
              currentStatus !== 'Rejected' && 'hover:border-rose-300 hover:text-rose-700 hover:bg-rose-50'
            )}
            title="Mark as false positive"
          >
            <XCircle className="size-3" />
            Reject
          </Button>

          <Button
            type="button"
            size="xs"
            variant={currentStatus === 'Uncertain' ? 'secondary' : 'outline'}
            onClick={() => handleAction('Uncertain')}
            className={cn(
              currentStatus === 'Uncertain'
                ? 'bg-slate-800 text-white hover:bg-slate-900'
                : 'hover:border-slate-300 hover:text-slate-800 hover:bg-slate-100'
            )}
            title="Mark as uncertain (pending corroboration)"
          >
            <HelpCircle className="size-3" />
            Uncertain
          </Button>

          <Button
            type="button"
            size="icon-xs"
            variant="ghost"
            onClick={() => setShowNotes(!showNotes)}
            className="text-muted-foreground hover:text-foreground"
            title="Attach Note"
          >
            <MessageSquare className="size-3" />
          </Button>
        </div>

        <Link
          href={`/network?case=${lead.relatedCaseIds[0] || 'CASE-101'}`}
          className={cn(buttonVariants({ variant: 'secondary', size: 'xs' }), 'gap-1.5 text-foreground text-xs font-medium')}
        >
          <span>Inspect Graph</span>
          <ArrowRight className="size-3 text-muted-foreground" />
        </Link>
      </CardFooter>
    </Card>
  );
}
