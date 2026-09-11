'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Search,
  FolderKanban,
  Network,
  FileText
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { buttonVariants, Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import type { Case, CaseStatus } from '@/types/investigation';
import { cn } from '@/lib/utils';

interface CaseTableProps {
  cases: Case[];
}

export function CaseTable({ cases }: CaseTableProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');

  const filteredCases = cases.filter(c => {
    const matchesSearch =
      c.id.toLowerCase().includes(search.toLowerCase()) ||
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.description.toLowerCase().includes(search.toLowerCase()) ||
      c.tags.some(t => t.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter;
    const matchesPriority = priorityFilter === 'ALL' || c.priority === priorityFilter;

    return matchesSearch && matchesStatus && matchesPriority;
  });

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

  const getPriorityBadge = (priority: 'High' | 'Medium' | 'Low') => {
    switch (priority) {
      case 'High':
        return <Badge variant="outline" className="text-rose-800 border-rose-200 bg-rose-50 font-normal">{priority}</Badge>;
      case 'Medium':
        return <Badge variant="outline" className="text-amber-800 border-amber-200 bg-amber-50 font-normal">{priority}</Badge>;
      case 'Low':
        return <Badge variant="outline" className="text-slate-600 border-slate-200 bg-slate-100 font-normal">{priority}</Badge>;
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Search & Filter Bar */}
      <Card className="border-border/80 bg-card shadow-xs">
        <CardContent className="p-3 flex flex-wrap items-center justify-between gap-3">
          <div className="relative flex-1 min-w-[260px] max-w-md">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
            <Input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search cases by ID, title, keywords, tags..."
              className="pl-9 h-8 text-xs bg-muted/20 border-input"
            />
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-muted-foreground text-xs">Status:</span>
              <Select value={statusFilter} onValueChange={val => setStatusFilter(val ?? 'ALL')}>
                <SelectTrigger size="sm" className="h-8 min-w-[130px] text-xs">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Statuses</SelectItem>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Review">Review</SelectItem>
                  <SelectItem value="Closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-muted-foreground text-xs">Priority:</span>
              <Select value={priorityFilter} onValueChange={val => setPriorityFilter(val ?? 'ALL')}>
                <SelectTrigger size="sm" className="h-8 min-w-[130px] text-xs">
                  <SelectValue placeholder="All Priorities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Priorities</SelectItem>
                  <SelectItem value="High">High</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="Low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {(search || statusFilter !== 'ALL' || priorityFilter !== 'ALL') && (
              <Button
                variant="ghost"
                size="xs"
                onClick={() => {
                  setSearch('');
                  setStatusFilter('ALL');
                  setPriorityFilter('ALL');
                }}
                className="text-xs text-muted-foreground hover:text-foreground h-8"
              >
                Reset
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Main Investigation Table */}
      <Card className="border-border/80 bg-card shadow-xs overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border/70 hover:bg-transparent">
              <TableHead className="w-[120px] font-medium text-xs text-muted-foreground">Case ID</TableHead>
              <TableHead className="font-medium text-xs text-muted-foreground">Case Title & Scope</TableHead>
              <TableHead className="w-[100px] font-medium text-xs text-muted-foreground">Status</TableHead>
              <TableHead className="w-[90px] font-medium text-xs text-muted-foreground">Priority</TableHead>
              <TableHead className="w-[80px] font-medium text-xs text-center text-muted-foreground">Entities</TableHead>
              <TableHead className="w-[100px] font-medium text-xs text-center text-muted-foreground">Relationships</TableHead>
              <TableHead className="w-[110px] font-medium text-xs text-muted-foreground">Updated</TableHead>
              <TableHead className="w-[160px] text-right font-medium text-xs text-muted-foreground">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCases.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="py-12 text-center text-muted-foreground text-xs">
                  No cases match the selected search filters.
                </TableCell>
              </TableRow>
            ) : (
              filteredCases.map(c => (
                <TableRow key={c.id} className="border-border/50 hover:bg-muted/30 transition-colors">
                  <TableCell className="font-mono text-xs font-medium text-primary whitespace-nowrap">
                    <Link href={`/cases/${c.id}`} className="hover:underline flex items-center gap-1.5">
                      <FolderKanban className="size-3.5 text-primary" />
                      <span>{c.id}</span>
                    </Link>
                  </TableCell>

                  <TableCell>
                    <div className="flex flex-col gap-1 min-w-[220px] max-w-[420px]">
                      <Link
                        href={`/cases/${c.id}`}
                        className="font-medium text-foreground hover:text-primary transition-colors text-xs truncate"
                      >
                        {c.title}
                      </Link>
                      <p className="text-[11px] text-muted-foreground line-clamp-1">
                        {c.description}
                      </p>
                      <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                        {c.tags.map(t => (
                          <Badge
                            key={t}
                            variant="secondary"
                            className="text-[10px] py-0 px-1.5 font-normal h-4 text-muted-foreground"
                          >
                            {t}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </TableCell>

                  <TableCell className="whitespace-nowrap">
                    {getStatusBadge(c.status)}
                  </TableCell>

                  <TableCell className="whitespace-nowrap">
                    {getPriorityBadge(c.priority)}
                  </TableCell>

                  <TableCell className="text-center font-mono text-xs text-foreground tabular-nums">
                    {c.entityCount}
                  </TableCell>

                  <TableCell className="text-center font-mono text-xs text-foreground tabular-nums">
                    {c.relationshipCount}
                  </TableCell>

                  <TableCell className="whitespace-nowrap text-xs text-muted-foreground tabular-nums">
                    {c.lastUpdated}
                  </TableCell>

                  <TableCell className="text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5">
                      <Link
                        href={`/cases/${c.id}`}
                        className={cn(buttonVariants({ variant: 'outline', size: 'xs' }), 'gap-1 text-xs')}
                      >
                        <FileText className="size-3 text-muted-foreground" />
                        <span>Dossier</span>
                      </Link>
                      <Link
                        href={`/network?case=${c.id}`}
                        className={cn(buttonVariants({ variant: 'secondary', size: 'xs' }), 'gap-1 text-xs text-primary')}
                      >
                        <Network className="size-3" />
                        <span>Network</span>
                      </Link>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
