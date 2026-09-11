'use client';

import React, { useState, useSyncExternalStore } from 'react';
import { Lightbulb } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getInvestigativeLeads, getBaseInvestigativeLeads, subscribeLeadReviews } from '@/lib/dataService';
import { InvestigativeLeadCard } from '@/components/common/InvestigativeLeadCard';
import type { ReviewStatus } from '@/types/investigation';

type FilterTab = 'ALL' | ReviewStatus;

export function LeadList() {
  const leads = useSyncExternalStore(
    subscribeLeadReviews,
    getInvestigativeLeads,
    getBaseInvestigativeLeads
  );
  const [filter, setFilter] = useState<FilterTab>('ALL');

  const filteredLeads = leads.filter(l => {
    if (filter === 'ALL') return true;
    return l.reviewStatus === filter;
  });

  const filterTabs: { label: string; value: FilterTab }[] = [
    { label: 'All Leads', value: 'ALL' },
    { label: 'Pending', value: 'Pending' },
    { label: 'Accepted', value: 'Accepted' },
    { label: 'Uncertain', value: 'Uncertain' },
    { label: 'Rejected', value: 'Rejected' }
  ];

  return (
    <div className="flex flex-col gap-3.5">
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-border/70">
        <div className="flex items-center gap-2">
          <div className="size-6 rounded-md bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shrink-0">
            <Lightbulb className="size-3.5" />
          </div>
          <h2 className="text-sm font-semibold text-slate-900 tracking-tight">
            Investigative Correlations & Leads
          </h2>
          <Badge variant="outline" className="text-slate-600 font-normal tabular-nums text-[11px] h-5 bg-white border-slate-200">
            {leads.length} Active Signals
          </Badge>
        </div>

        {/* Segmented Filter Control with shadcn Tabs */}
        <Tabs value={filter} onValueChange={(val) => setFilter(val as FilterTab)} className="max-w-full overflow-x-auto">
          <TabsList className="bg-slate-100 border border-slate-200 h-8 p-0.5 max-w-full overflow-x-auto flex-nowrap">
            {filterTabs.map(tab => {
              const count = tab.value === 'ALL'
                ? leads.length
                : leads.filter(l => l.reviewStatus === tab.value).length;

              return (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="text-xs px-2.5 h-7 font-medium data-active:bg-white data-active:shadow-xs focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none"
                >
                  <span>{tab.label}</span>
                  <span className="text-[10px] text-slate-600 font-semibold ml-1 tabular-nums">
                    ({count})
                  </span>
                </TabsTrigger>
              );
            })}
          </TabsList>
        </Tabs>
      </div>

      {filteredLeads.length === 0 ? (
        <div className="p-8 rounded-lg border border-slate-200 bg-white text-center flex flex-col items-center justify-center">
          <p className="text-xs text-slate-600 max-w-md">
            No investigative leads currently in the <strong className="text-slate-900">{filter}</strong> queue.
            Adjust your filter criteria or view all active intelligence signals.
          </p>
          <button
            type="button"
            onClick={() => setFilter('ALL')}
            className="mt-3 inline-flex items-center justify-center px-3 py-1.5 rounded-md text-xs font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {filteredLeads.map(lead => (
            <InvestigativeLeadCard
              key={`${lead.id}-${lead.reviewStatus}`}
              lead={lead}
            />
          ))}
        </div>
      )}
    </div>
  );
}
