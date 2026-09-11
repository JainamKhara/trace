'use client';

import React, { useSyncExternalStore } from 'react';
import Link from 'next/link';
import {
  Clock,
  FileCheck,
  GitFork,
  FilePlus,
  RefreshCw,
  FolderOpen
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { getRecentActivities, getBaseRecentActivities, subscribeLeadReviews } from '@/lib/dataService';
import { cn } from '@/lib/utils';

export function RecentActivityFeed() {
  const activities = useSyncExternalStore(
    subscribeLeadReviews,
    getRecentActivities,
    getBaseRecentActivities
  );

  const iconMap = {
    bridge: { icon: GitFork, color: 'text-blue-700 bg-blue-50 border-blue-200' },
    review: { icon: FileCheck, color: 'text-amber-700 bg-amber-50 border-amber-200' },
    evidence: { icon: FilePlus, color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
    update: { icon: RefreshCw, color: 'text-indigo-700 bg-indigo-50 border-indigo-200' }
  };

  return (
    <Card className="border-border bg-card shadow-xs">
      <CardHeader className="flex flex-row items-center justify-between border-b border-border/60 px-4 py-3">
        <div className="flex items-center gap-2">
          <Clock className="size-4 text-blue-600" />
          <CardTitle className="text-sm font-semibold text-slate-900">
            Chronological Audit Trail
          </CardTitle>
        </div>
        <Badge variant="outline" className="text-xs text-slate-600 font-normal">
          Immutable Chain of Custody
        </Badge>
      </CardHeader>

      <CardContent className="p-2">
        {activities.length === 0 ? (
          <div className="py-12 px-4 text-center flex flex-col items-center gap-2 text-xs text-slate-600">
            <FolderOpen className="size-8 text-slate-400" />
            <p className="font-medium text-slate-800">No recent operational entries</p>
            <p className="text-[11px] text-slate-500 max-w-xs">
              Actions taken on cases, evidence ingestion, or lead reviews will generate immutable chronological logs here.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            {activities.map(item => {
              const cfg = iconMap[item.type] || iconMap.update;
              const Icon = cfg.icon;

              return (
                <div
                  key={item.id}
                  className="p-3 rounded-lg hover:bg-muted/40 transition-colors flex items-start gap-3 group"
                >
                  <div
                    className={`size-7 rounded-md flex items-center justify-center shrink-0 border mt-0.5 ${cfg.color}`}
                  >
                    <Icon className="size-3.5" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center justify-between gap-1 mb-1">
                      <span className="text-xs font-semibold text-slate-900 group-hover:text-blue-700 transition-colors">
                        {item.title}
                      </span>
                      <span className="text-[11px] text-slate-500 font-mono">
                        {item.timestamp}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed mb-2">
                      {item.description}
                    </p>

                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-[10px] text-slate-600 font-mono border-slate-200 bg-slate-50">
                        {item.caseId}
                      </Badge>
                      <Link
                        href={item.linkHref}
                        className={cn(buttonVariants({ variant: 'ghost', size: 'xs' }), 'text-blue-700 text-xs font-medium hover:text-blue-900')}
                      >
                        <span>View Record</span>
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
