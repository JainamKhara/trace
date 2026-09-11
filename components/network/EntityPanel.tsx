'use client';

import React from 'react';
import Link from 'next/link';
import {
  User,
  Smartphone,
  Car,
  CreditCard,
  MapPin,
  Building,
  Folder,
  Clock,
  ExternalLink,
  GitFork,
  X
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import type { Entity, Relationship } from '@/types/investigation';
import { ConfidenceBadge } from '@/components/common/ConfidenceBadge';
import { cn } from '@/lib/utils';

interface EntityPanelProps {
  entity: Entity;
  relationships: Relationship[];
  onSelectConnectedEntity?: (entityId: string) => void;
  onSelectRelationship?: (relId: string) => void;
  onClose?: () => void;
}

const typeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  Person: User,
  Phone: Smartphone,
  Vehicle: Car,
  Account: CreditCard,
  Location: MapPin,
  Organization: Building,
  Case: Folder
};

export function EntityPanel({
  entity,
  relationships,
  onSelectRelationship,
  onClose
}: EntityPanelProps) {
  const Icon = typeIcons[entity.type] || User;

  // Group relationship counts
  const relTypeCounts: Record<string, number> = {};
  relationships.forEach(r => {
    relTypeCounts[r.type] = (relTypeCounts[r.type] || 0) + 1;
  });

  const isCrossCaseBridge = entity.associatedCases.length > 1;

  return (
    <div className="h-full flex flex-col bg-card overflow-hidden text-xs select-none">
      {/* Header */}
      <div className="p-4 border-b border-border flex items-start justify-between gap-3 shrink-0">
        <div className="flex items-start gap-3 min-w-0">
          <div className="size-9 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center shrink-0 mt-0.5">
            <Icon className="size-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <Badge variant="outline" className="text-[10px] font-normal text-slate-600 bg-slate-50 border-slate-200">
                {entity.type}
              </Badge>
              {isCrossCaseBridge && (
                <Badge variant="outline" className="text-[10px] border-amber-200 bg-amber-50 text-amber-800 gap-1 font-normal">
                  <GitFork className="size-2.5" />
                  Cross-Case Bridge
                </Badge>
              )}
            </div>
            <h2 className="text-sm font-semibold text-slate-900 truncate mt-1">
              {entity.name}
            </h2>
            {entity.aliases && entity.aliases.length > 0 && (
              <span className="text-[11px] text-slate-500 truncate block mt-0.5">
                Aliases: {entity.aliases.join(', ')}
              </span>
            )}
          </div>
        </div>

        {onClose && (
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            onClick={onClose}
            title="Close dossier"
          >
            <X className="size-4 text-slate-400 hover:text-slate-700" />
          </Button>
        )}
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
        {/* Core Dossier Fields */}
        <Card className="border-slate-200 bg-slate-50/50 shadow-none">
          <CardContent className="p-3 flex flex-col gap-2.5">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-[11px] text-slate-500 block">Primary Case</span>
                <Link
                  href={`/cases/${entity.primaryCase}`}
                  className="text-blue-700 hover:underline font-mono text-xs font-semibold tabular-nums"
                >
                  {entity.primaryCase}
                </Link>
              </div>
              <div>
                <span className="text-[11px] text-muted-foreground block mb-0.5">Confidence</span>
                <ConfidenceBadge score={entity.confidence} label="Match" size="sm" />
              </div>
              <div>
                <span className="text-[11px] text-muted-foreground block">Associated Cases</span>
                <span className="text-foreground font-mono text-xs tabular-nums">{entity.associatedCases.join(', ')}</span>
              </div>
              <div>
                <span className="text-[11px] text-muted-foreground block">Connections</span>
                <span className="text-foreground font-semibold tabular-nums">{relationships.length}</span>
              </div>
            </div>

            {/* Specific Identifiers */}
            <Separator />
            <div className="flex flex-col gap-1.5 text-xs">
              {entity.identifiers.phone && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-[11px]">Phone:</span>
                  <span className="text-foreground font-mono">{entity.identifiers.phone}</span>
                </div>
              )}
              {entity.identifiers.registration && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-[11px]">Registration:</span>
                  <span className="text-foreground font-mono">{entity.identifiers.registration}</span>
                </div>
              )}
              {entity.identifiers.accountNumber && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-[11px]">Account No:</span>
                  <span className="text-foreground font-mono">{entity.identifiers.accountNumber}</span>
                </div>
              )}
              {entity.identifiers.bank && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-[11px]">Bank:</span>
                  <span className="text-foreground truncate max-w-[170px]">{entity.identifiers.bank}</span>
                </div>
              )}
              {entity.identifiers.coordinates && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-[11px]">Coordinates:</span>
                  <span className="text-foreground font-mono">{entity.identifiers.coordinates}</span>
                </div>
              )}
              {entity.identifiers.address && (
                <div className="flex flex-col">
                  <span className="text-muted-foreground text-[11px]">Address:</span>
                  <span className="text-foreground">{entity.identifiers.address}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Investigative Notes */}
        {entity.notes && (
          <div className="flex flex-col gap-1">
            <span className="text-[11px] font-medium text-muted-foreground">
              Investigator Notes
            </span>
            <Card className="border-border bg-muted/20 shadow-none p-2.5">
              <p className="text-xs text-foreground/90 leading-relaxed">
                {entity.notes}
              </p>
            </Card>
          </div>
        )}

        {/* Relationship Summary */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between text-[11px] text-muted-foreground font-medium">
            <span>Relationship Distribution</span>
            <span>{relationships.length} Total</span>
          </div>

          <div className="grid grid-cols-2 gap-1.5">
            {Object.entries(relTypeCounts).map(([type, count]) => (
              <div
                key={type}
                className="p-2 rounded-md bg-muted/20 border border-border flex items-center justify-between text-xs"
              >
                <span className="text-muted-foreground text-[11px]">{type}</span>
                <span className="text-foreground font-semibold">{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Associated Relationship Records List */}
        <div className="flex flex-col gap-2">
          <span className="text-[11px] font-medium text-muted-foreground">
            Direct Associated Links
          </span>

          <div className="flex flex-col gap-1 max-h-56 overflow-y-auto divide-y divide-border/40">
            {relationships.map(r => (
              <div
                key={r.id}
                onClick={() => onSelectRelationship && onSelectRelationship(r.id)}
                className="py-2 px-1 hover:bg-muted/30 rounded-md cursor-pointer transition-colors flex items-center justify-between gap-2"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="font-medium text-foreground">{r.type}</span>
                    <span className="text-muted-foreground">•</span>
                    <span className="text-muted-foreground text-[11px]">{r.timestamp}</span>
                  </div>
                  <span className="text-muted-foreground text-[11px] truncate block mt-0.5">
                    {r.sourceDoc}
                  </span>
                </div>
                <ConfidenceBadge score={r.confidence} size="sm" showLabel={false} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer Navigation */}
      <div className="p-3 border-t border-border flex items-center justify-between gap-2 shrink-0">
        <Link
          href={`/timeline?entity=${entity.id}&case=${entity.primaryCase}`}
          className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'flex-1 text-xs gap-1.5')}
        >
          <Clock className="size-3.5 text-primary" />
          <span>Timeline</span>
        </Link>
        <Link
          href={`/cases/${entity.primaryCase}`}
          className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'text-xs gap-1 text-primary')}
        >
          <span>Case Dossier</span>
          <ExternalLink className="size-3" />
        </Link>
      </div>
    </div>
  );
}
