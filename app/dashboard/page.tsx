import React from 'react';
import { StatOverview } from '@/components/dashboard/StatOverview';
import { RecentCasesTable } from '@/components/dashboard/RecentCasesTable';
import { NetworkOverviewChart } from '@/components/dashboard/NetworkOverviewChart';
import { LeadList } from '@/components/dashboard/LeadList';
import { RecentActivityFeed } from '@/components/dashboard/RecentActivityFeed';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Network } from 'lucide-react';

export default function DashboardPage() {
  return (
    <div className="p-3.5 sm:p-6 space-y-4 sm:space-y-6 max-w-[1600px] mx-auto w-full">
      {/* Operational Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-border/70">
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-foreground">
            Operational Intelligence
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Real-time synthesis of cross-case criminal networks, verified entities, and correlation signals.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Badge
            variant="outline"
            className="text-xs font-normal py-1 px-3 border-border/80 bg-card gap-2 text-muted-foreground"
          >
            <span className="size-2 rounded-full bg-lime-500 animate-pulse" />
            <span className="text-foreground font-medium">Linkage Engine</span> Active
          </Badge>

          <Link href="/network">
            <Button size="sm" className="gap-2 text-xs font-medium h-8">
              <Network className="size-3.5" />
              <span>Network Workspace</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* A. Statistics Overview */}
      <StatOverview />

      {/* B. Network Overview Visualizations */}
      <NetworkOverviewChart />

      {/* C. Recent Investigations & Audit Feed */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <RecentCasesTable />
        <RecentActivityFeed />
      </div>

      {/* D. Investigative Correlations & Leads */}
      <LeadList />
    </div>
  );
}
