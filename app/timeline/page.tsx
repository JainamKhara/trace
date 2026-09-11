'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { InvestigationTimeline } from '@/components/timeline/InvestigationTimeline';
import { getTimelineEvents, getCases, getEntities, subscribeDataUpdates } from '@/lib/dataService';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { DataIngestModal } from '@/components/ingest/DataIngestModal';
import type { TimelineEvent, Case, Entity } from '@/types/investigation';

export default function TimelinePage() {
  const [events, setEvents] = useState<TimelineEvent[]>(() => getTimelineEvents());
  const [cases, setCases] = useState<Case[]>(() => getCases());
  const [entities, setEntities] = useState<Entity[]>(() => getEntities());
  const [isIngestOpen, setIsIngestOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeDataUpdates(() => {
      setEvents(getTimelineEvents());
      setCases(getCases());
      setEntities(getEntities());
    });
    return unsubscribe;
  }, []);

  return (
    <div className="p-3.5 sm:p-6 space-y-4 sm:space-y-5 max-w-[1400px] mx-auto w-full">
      {/* Operational Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-border/70">
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-foreground">
            Chronological Event Reconstruction
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Sequenced logs of cellular tower pings, financial wire disbursements, toll crossings, and surveillance sightings.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs flex-wrap">
          <Badge variant="outline" className="text-muted-foreground font-normal bg-card py-1 px-2.5 gap-1.5 tabular-nums">
            <span>Recorded Events:</span>
            <strong className="text-foreground font-semibold">{events.length}</strong>
          </Badge>
          <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-amber-400 font-normal py-1 px-2.5 gap-1.5 tabular-nums">
            <span className="size-1.5 rounded-full bg-amber-500" />
            <span>Synchronized:</span>
            <strong className="text-amber-300 font-semibold">Active</strong>
          </Badge>

          {/* Add Event / Import Log Button */}
          <Button
            type="button"
            onClick={() => setIsIngestOpen(true)}
            size="sm"
            className="gap-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white font-medium h-8 px-3 shadow-xs focus-visible:ring-2 focus-visible:ring-blue-600"
          >
            <Plus className="size-3.5" />
            <span>Add Event / Import Log</span>
          </Button>
        </div>
      </div>

      <Suspense fallback={<div className="text-xs font-mono text-muted-foreground py-8 text-center">Loading chronological timeline...</div>}>
        <InvestigationTimeline
          events={events}
          cases={cases}
          entities={entities}
        />
      </Suspense>

      <DataIngestModal
        isOpen={isIngestOpen}
        onClose={() => setIsIngestOpen(false)}
        defaultTab="manual"
        onSuccess={() => {
          setEvents(getTimelineEvents());
          setCases(getCases());
          setEntities(getEntities());
        }}
      />
    </div>
  );
}
