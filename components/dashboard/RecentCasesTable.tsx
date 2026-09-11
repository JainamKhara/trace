'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowUpRight, FolderKanban, Network, FileText } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { getCases } from '@/lib/dataService';
import type { CaseStatus } from '@/types/investigation';
import { cn } from '@/lib/utils';

export function RecentCasesTable() {
  const allCases = getCases();
  const cases = allCases.slice(0, 5);

  const getStatusBadge = (status: CaseStatus) => {
    switch (status) {
      case 'Active':
        return (
          <Badge variant="outline" className="gap-1.5 border-emerald-200 bg-emerald-50 text-emerald-800 font-normal">
            <span className="size-1.5 rounded-full bg-emerald-600" />
            Active
          </Badge>
        );
      case 'Review':
        return (
          <Badge variant="outline" className="gap-1.5 border-amber-200 bg-amber-50 text-amber-800 font-normal">
            <span className="size-1.5 rounded-full bg-amber-600" />
            Review
          </Badge>
        );
      case 'Closed':
        return (
          <Badge variant="outline" className="gap-1.5 border-slate-200 bg-slate-100 text-slate-700 font-normal">
            <span className="size-1.5 rounded-full bg-slate-500" />
            Closed
          </Badge>
        );
    }
  };

  return (
    <Card className="border-border bg-card shadow-xs">
      <CardHeader className="flex flex-row items-center justify-between border-b border-border/70 px-4 py-3">
        <div className="flex items-center gap-2">
          <FolderKanban className="size-4 text-primary" />
          <CardTitle className="text-sm font-semibold text-foreground">
            Recent Investigations
          </CardTitle>
        </div>
        <Link
          href="/cases"
          className={cn(buttonVariants({ variant: 'ghost', size: 'xs' }), 'gap-1 text-primary text-xs font-medium focus-visible:ring-2 focus-visible:ring-blue-600')}
        >
          <span>View all {allCases.length} cases</span>
          <ArrowUpRight className="size-3.5" />
        </Link>
      </CardHeader>

      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="border-border/60 hover:bg-transparent">
              <TableHead className="w-[120px] font-medium text-xs text-muted-foreground">Case ID</TableHead>
              <TableHead className="font-medium text-xs text-muted-foreground">Title</TableHead>
              <TableHead className="w-[100px] font-medium text-xs text-muted-foreground">Status</TableHead>
              <TableHead className="w-[100px] font-medium text-xs text-muted-foreground">Entities</TableHead>
              <TableHead className="w-[120px] font-medium text-xs text-muted-foreground">Updated</TableHead>
              <TableHead className="w-[140px] text-right font-medium text-xs text-muted-foreground">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {cases.map(c => (
              <TableRow key={c.id} className="border-border/50 hover:bg-muted/40 transition-colors">
                <TableCell className="font-mono text-xs font-medium text-primary">
                  <Link href={`/cases/${c.id}`} className="hover:underline">
                    {c.id}
                  </Link>
                </TableCell>
                <TableCell>
                  <Link
                    href={`/cases/${c.id}`}
                    className="font-medium text-foreground hover:text-primary transition-colors text-xs line-clamp-1 max-w-[280px]"
                  >
                    {c.title}
                  </Link>
                </TableCell>
                <TableCell>
                  {getStatusBadge(c.status)}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {c.entityCount} entities
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {c.lastUpdated}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <Link
                      href={`/cases/${c.id}`}
                      className={cn(buttonVariants({ variant: 'outline', size: 'xs' }), 'gap-1 text-[11px]')}
                    >
                      <FileText className="size-3 text-muted-foreground" />
                      Dossier
                    </Link>
                    <Link
                      href={`/network?case=${c.id}`}
                      className={cn(buttonVariants({ variant: 'secondary', size: 'xs' }), 'gap-1 text-[11px] text-primary')}
                    >
                      <Network className="size-3" />
                      Graph
                    </Link>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
