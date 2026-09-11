'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Clock,
  PhoneCall,
  CreditCard,
  MapPin,
  Car,
  FileText
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import type { TimelineEvent, Case, Entity } from '@/types/investigation';
import { ConfidenceBadge } from '@/components/common/ConfidenceBadge';
import { EvidenceDetailModal } from '@/components/evidence/EvidenceDetailModal';
import { getEvidenceById } from '@/lib/dataService';
import { cn } from '@/lib/utils';

interface InvestigationTimelineProps {
  events: TimelineEvent[];
  cases: Case[];
  entities: Entity[];
}

const eventTypeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  Call: PhoneCall,
  Transaction: CreditCard,
  'Location Ping': MapPin,
  'Vehicle Sighting': Car,
  'Report Entry': FileText
};

export function InvestigationTimeline({
  events,
  cases,
  entities
}: InvestigationTimelineProps) {
  const searchParams = useSearchParams();
  const queryCase = searchParams.get('case');
  const queryEntity = searchParams.get('entity');

  const [selectedCase, setSelectedCase] = useState<string>(() => queryCase || 'ALL');
  const [selectedEntity, setSelectedEntity] = useState<string>(() => queryEntity || 'ALL');
  const [selectedEventType, setSelectedEventType] = useState<string>('ALL');
  const [activeEvidenceId, setActiveEvidenceId] = useState<string | null>(null);

  const [prevQueryParams, setPrevQueryParams] = useState({ case: queryCase, entity: queryEntity });

  if (prevQueryParams.case !== queryCase || prevQueryParams.entity !== queryEntity) {
    setPrevQueryParams({ case: queryCase, entity: queryEntity });
    if (queryCase) setSelectedCase(queryCase);
    if (queryEntity) setSelectedEntity(queryEntity);
  }

  const filteredEvents = events.filter(ev => {
    const matchCase = selectedCase === 'ALL' || ev.caseId.toUpperCase() === selectedCase.toUpperCase();
    const matchEntity = selectedEntity === 'ALL' || ev.entityId.toLowerCase() === selectedEntity.toLowerCase();
    const matchType = selectedEventType === 'ALL' || ev.eventType === selectedEventType;

    return matchCase && matchEntity && matchType;
  });

  const activeEvidence = activeEvidenceId ? getEvidenceById(activeEvidenceId) || null : null;

  return (
    <div className="flex flex-col gap-4">
      {/* Filters Bar */}
      <Card className="border-border/80 bg-card shadow-xs">
        <CardContent className="p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Case Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-muted-foreground text-xs">Case:</span>
              <Select value={selectedCase} onValueChange={val => setSelectedCase(val ?? 'ALL')}>
                <SelectTrigger size="sm" className="h-8 min-w-[120px] text-xs">
                  <SelectValue placeholder="All Cases" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Cases</SelectItem>
                  {cases.map(c => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Entity Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-muted-foreground text-xs">Entity:</span>
              <Select value={selectedEntity} onValueChange={val => setSelectedEntity(val ?? 'ALL')}>
                <SelectTrigger size="sm" className="h-8 min-w-[150px] text-xs">
                  <SelectValue placeholder="All Entities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Entities</SelectItem>
                  {entities.map(e => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.name} ({e.type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Event Type Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-muted-foreground text-xs">Event Type:</span>
              <Select value={selectedEventType} onValueChange={val => setSelectedEventType(val ?? 'ALL')}>
                <SelectTrigger size="sm" className="h-8 min-w-[130px] text-xs">
                  <SelectValue placeholder="All Events" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Events</SelectItem>
                  <SelectItem value="Call">Calls</SelectItem>
                  <SelectItem value="Transaction">Transactions</SelectItem>
                  <SelectItem value="Location Ping">Location Pings</SelectItem>
                  <SelectItem value="Vehicle Sighting">Vehicle Sightings</SelectItem>
                  <SelectItem value="Report Entry">Reports</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground tabular-nums">
              Showing <strong className="text-foreground font-semibold">{filteredEvents.length}</strong> Events
            </span>
            {(selectedCase !== 'ALL' || selectedEntity !== 'ALL' || selectedEventType !== 'ALL') && (
              <Button
                type="button"
                variant="ghost"
                size="xs"
                onClick={() => {
                  setSelectedCase('ALL');
                  setSelectedEntity('ALL');
                  setSelectedEventType('ALL');
                }}
                className="text-xs text-muted-foreground hover:text-foreground h-8"
              >
                Reset
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Main Chronological Timeline Spine */}
      <div className="relative pl-6 sm:pl-8 border-l-2 border-slate-200 flex flex-col gap-4 ml-2 sm:ml-4 py-2">
        {filteredEvents.length === 0 ? (
          <Card className="p-8 border-slate-200 bg-white text-center flex flex-col items-center justify-center">
            <p className="text-xs text-slate-600 max-w-md">
              No chronological timeline records match the selected filters
              {selectedCase !== 'ALL' && ` for case ${selectedCase}`}
              {selectedEntity !== 'ALL' && ` and entity ${selectedEntity}`}.
            </p>
            <Button
              type="button"
              onClick={() => {
                setSelectedCase('ALL');
                setSelectedEntity('ALL');
                setSelectedEventType('ALL');
              }}
              className="mt-3 bg-blue-600 hover:bg-blue-700 text-white text-xs h-8 focus-visible:ring-2 focus-visible:ring-blue-600"
            >
              Reset All Filters
            </Button>
          </Card>
        ) : (
          filteredEvents.map(ev => {
            const Icon = eventTypeIcons[ev.eventType] || Clock;

            return (
              <div key={ev.id} className="relative group">
                {/* Timeline Node Dot */}
                <div
                  className="absolute left-[-31px] sm:left-[-39px] top-3 size-6 rounded-full border-2 border-white bg-blue-50 text-blue-700 flex items-center justify-center shadow-xs shrink-0 transition-transform group-hover:scale-110"
                >
                  <Icon className="size-3" />
                </div>

                {/* Event Card */}
                <Card className="border-slate-200 bg-white shadow-xs transition-colors hover:border-blue-300">
                  <CardContent className="p-4 flex flex-col gap-2">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-mono font-semibold text-slate-900 tabular-nums">
                          {ev.timeFormatted}
                        </span>
                        <Badge variant="outline" className="text-[10px] font-normal text-slate-600 border-slate-200 bg-slate-50">
                          {ev.eventType}
                        </Badge>
                        <Badge variant="secondary" className="text-[10px] font-mono text-blue-700 bg-blue-50 tabular-nums">
                          {ev.caseId}
                        </Badge>
                      </div>

                      <ConfidenceBadge score={ev.confidence} label="Confidence" size="sm" />
                    </div>

                    {/* Title & Entity */}
                    <div className="flex flex-col gap-0.5">
                      <h3 className="text-sm font-semibold text-slate-900">
                        {ev.title}
                      </h3>
                      <div className="flex items-center gap-2 text-xs text-slate-600">
                        <span className="text-blue-700 font-semibold">{ev.entityName}</span>
                        {ev.location && (
                          <span className="flex items-center gap-1 text-slate-600">
                            <MapPin className="size-3 text-slate-500" />
                            {ev.location}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {ev.description}
                    </p>

                    {/* Footer Meta & Action */}
                    <div className="pt-2 border-t border-border/60 flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2 text-slate-600">
                        <span>Source: <strong className="text-slate-900 font-medium">{ev.source}</strong></span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Link
                          href={`/network?entity=${ev.entityId}&case=${ev.caseId}`}
                          className={cn(buttonVariants({ variant: 'ghost', size: 'xs' }), 'text-primary text-xs font-medium focus-visible:ring-2 focus-visible:ring-blue-600')}
                        >
                          Inspect in Graph
                        </Link>

                        <Button
                          type="button"
                          variant="outline"
                          size="xs"
                          onClick={() => setActiveEvidenceId(ev.evidenceId)}
                          className="focus-visible:ring-2 focus-visible:ring-blue-600"
                        >
                          View Evidence
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            );
          })
        )}
      </div>

      {/* Detail Modal */}
      {activeEvidence && (
        <EvidenceDetailModal
          evidence={activeEvidence}
          onClose={() => setActiveEvidenceId(null)}
        />
      )}
    </div>
  );
}
