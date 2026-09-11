'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { CaseTable } from '@/components/cases/CaseTable';
import { NewCaseModal } from '@/components/cases/NewCaseModal';
import { getCases, subscribeDataUpdates } from '@/lib/dataService';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import type { Case } from '@/types/investigation';

export default function CasesPage() {
  const [cases, setCases] = useState<Case[]>(() => getCases());
  const [isNewCaseOpen, setIsNewCaseOpen] = useState(false);

  const reloadCases = useCallback(() => {
    setCases(getCases());
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeDataUpdates(() => {
      reloadCases();
    });
    return unsubscribe;
  }, [reloadCases]);

  const activeCount = cases.filter(c => c.status === 'Active').length;
  const reviewCount = cases.filter(c => c.status === 'Review').length;

  return (
    <div className="p-3.5 sm:p-6 space-y-4 sm:space-y-5 max-w-[1600px] mx-auto w-full">
      {/* Operational Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-border/70">
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-foreground">
            Case Files & Dossiers
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Structured case register with multi-source record linkage, entity tracking, and cross-jurisdictional correlation.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs flex-wrap">
          <Badge variant="outline" className="text-muted-foreground font-normal bg-card py-1 px-2.5 gap-1.5 tabular-nums">
            <span>Total Dossiers:</span>
            <strong className="text-foreground font-semibold">{cases.length}</strong>
          </Badge>
          <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-400 font-normal py-1 px-2.5 gap-1.5 tabular-nums">
            <span className="size-1.5 rounded-full bg-emerald-500" />
            <span>Active:</span>
            <strong className="text-emerald-300 font-semibold">{activeCount}</strong>
          </Badge>
          <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-amber-400 font-normal py-1 px-2.5 gap-1.5 tabular-nums">
            <span className="size-1.5 rounded-full bg-amber-500" />
            <span>Review:</span>
            <strong className="text-amber-300 font-semibold">{reviewCount}</strong>
          </Badge>

          <Button
            size="sm"
            onClick={() => setIsNewCaseOpen(true)}
            className="h-8 text-xs bg-blue-600 hover:bg-blue-700 text-white gap-1.5 shadow-xs ml-1"
          >
            <Plus className="size-3.5" />
            <span>New Case File</span>
          </Button>
        </div>
      </div>

      <CaseTable cases={cases} />

      <NewCaseModal
        isOpen={isNewCaseOpen}
        onClose={() => setIsNewCaseOpen(false)}
        onSuccess={() => reloadCases()}
      />
    </div>
  );
}
