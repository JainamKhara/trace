'use client';

import React from 'react';
import {
  FolderKanban,
  Users,
  GitBranch,
  Lightbulb,
  Database
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getDashboardStats } from '@/lib/dataService';

export function StatOverview() {
  const stats = getDashboardStats();

  const cards = [
    {
      label: 'Active Cases',
      value: stats.activeCases,
      total: `${stats.totalCases} Total recorded`,
      icon: FolderKanban,
      accent: 'text-blue-700 bg-blue-50 border-blue-200'
    },
    {
      label: 'Monitored Entities',
      value: stats.totalEntities,
      total: `${stats.totalEntities} Verified entities`,
      icon: Users,
      accent: 'text-emerald-700 bg-emerald-50 border-emerald-200'
    },
    {
      label: 'Mapped Relationships',
      value: stats.totalRelationships,
      total: `${stats.totalRelationships} Corroborated edges`,
      icon: GitBranch,
      accent: 'text-indigo-700 bg-indigo-50 border-indigo-200'
    },
    {
      label: 'Investigative Leads',
      value: stats.potentialLeads,
      total: `${stats.potentialLeads} Review pending`,
      icon: Lightbulb,
      accent: 'text-rose-700 bg-rose-50 border-rose-200'
    }
  ];

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
          <Database className="size-3.5 text-primary" />
          <span>Intelligence Metrics</span>
        </div>
        <Badge variant="outline" className="text-muted-foreground font-normal bg-card/50">
          Synthetic Local Dataset
        </Badge>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {cards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <Card
              key={idx}
              className="border-border/80 bg-card shadow-xs transition-all hover:border-border hover:shadow-sm"
            >
              <CardContent className="p-4 flex items-center justify-between gap-3">
                <div className="flex flex-col gap-1 min-w-0">
                  <span className="text-xs font-medium text-muted-foreground truncate">
                    {card.label}
                  </span>
                  <div className="text-2xl font-semibold text-foreground tracking-tight tabular-nums">
                    {card.value}
                  </div>
                  <span className="text-[11px] text-muted-foreground/90 truncate tabular-nums">
                    {card.total}
                  </span>
                </div>

                <div
                  className={`size-10 rounded-lg border flex items-center justify-center shrink-0 transition-colors ${card.accent}`}
                >
                  <Icon className="size-5" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
