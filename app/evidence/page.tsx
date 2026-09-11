'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { EvidenceTable } from '@/components/evidence/EvidenceTable';
import { getEvidence, subscribeDataUpdates } from '@/lib/dataService';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { DataIngestModal } from '@/components/ingest/DataIngestModal';
import type { Evidence } from '@/types/investigation';

export default function EvidencePage() {
  const [evidenceList, setEvidenceList] = useState<Evidence[]>(() => getEvidence());
  const [isIngestOpen, setIsIngestOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeDataUpdates(() => {
      setEvidenceList(getEvidence());
    });
    return unsubscribe;
  }, []);

  return (
    <div className="p-3.5 sm:p-6 space-y-4 sm:space-y-5 max-w-[1600px] mx-auto w-full">
      {/* Operational Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-border/70">
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-foreground">
            Evidence Catalog & Chain of Custody
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Verifiable forensic supporting records, source documents, and confidence-classified evidentiary linkages.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs flex-wrap">
          <Badge variant="outline" className="text-muted-foreground font-normal bg-card py-1 px-2.5 gap-1.5 tabular-nums">
            <span>Total Records:</span>
            <strong className="text-foreground font-semibold">{evidenceList.length}</strong>
          </Badge>
          <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary font-normal py-1 px-2.5 gap-1.5 tabular-nums">
            <span className="size-1.5 rounded-full bg-primary" />
            <span>Classified:</span>
            <strong className="text-foreground font-semibold">100%</strong>
          </Badge>

          {/* Quick Action Button */}
          <Button
            type="button"
            onClick={() => setIsIngestOpen(true)}
            size="sm"
            className="gap-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white font-medium h-8 px-3 shadow-xs focus-visible:ring-2 focus-visible:ring-blue-600"
          >
            <Plus className="size-3.5" />
            <span>Ingest Evidence / Files</span>
          </Button>
        </div>
      </div>

      <Suspense fallback={<div className="text-xs font-mono text-muted-foreground py-8 text-center">Loading evidence catalog...</div>}>
        <EvidenceTable evidenceList={evidenceList} />
      </Suspense>

      <DataIngestModal
        isOpen={isIngestOpen}
        onClose={() => setIsIngestOpen(false)}
        defaultTab="files"
        onSuccess={() => {
          setEvidenceList(getEvidence());
        }}
      />
    </div>
  );
}
