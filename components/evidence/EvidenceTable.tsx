'use client';

import React, { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Search } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import type { Evidence, EvidenceClassification, EvidenceType } from '@/types/investigation';
import { ClassificationBadge } from '@/components/common/ClassificationBadge';
import { EvidenceDetailModal } from './EvidenceDetailModal';

interface EvidenceTableProps {
  evidenceList: Evidence[];
}

const evidenceTypes: (EvidenceType | 'ALL')[] = [
  'ALL',
  'FIR',
  'CDR',
  'Financial Record',
  'Vehicle Record',
  'Location Record',
  'Report'
];

const classificationStatuses: (EvidenceClassification | 'ALL')[] = [
  'ALL',
  'OBSERVED',
  'DERIVED',
  'INFERRED',
  'HYPOTHESIS'
];

export function EvidenceTable({ evidenceList }: EvidenceTableProps) {
  const searchParams = useSearchParams();
  const initialId = searchParams.get('id');

  const [search, setSearch] = useState('');
  const [selectedCase, setSelectedCase] = useState('ALL');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  const [activeEvidence, setActiveEvidence] = useState<Evidence | null>(() => {
    if (!initialId) return null;
    return evidenceList.find(ev => ev.id.toLowerCase() === initialId.toLowerCase()) || null;
  });

  const [prevInitialId, setPrevInitialId] = useState(initialId);
  if (initialId !== prevInitialId) {
    setPrevInitialId(initialId);
    if (initialId) {
      const match = evidenceList.find(ev => ev.id.toLowerCase() === initialId.toLowerCase());
      setActiveEvidence(match || null);
    }
  }

  const uniqueCases = Array.from(new Set(evidenceList.map(ev => ev.caseId)));

  const filteredEvidence = evidenceList.filter(ev => {
    const matchSearch =
      ev.id.toLowerCase().includes(search.toLowerCase()) ||
      ev.title.toLowerCase().includes(search.toLowerCase()) ||
      ev.summary.toLowerCase().includes(search.toLowerCase()) ||
      ev.sourceFile.toLowerCase().includes(search.toLowerCase());

    const matchCase = selectedCase === 'ALL' || ev.caseId === selectedCase;
    const matchType = selectedType === 'ALL' || ev.type === selectedType;
    const matchStatus = selectedStatus === 'ALL' || ev.status === selectedStatus;

    return matchSearch && matchCase && matchType && matchStatus;
  });

  const hasActiveFilters = search || selectedCase !== 'ALL' || selectedType !== 'ALL' || selectedStatus !== 'ALL';

  return (
    <div className="flex flex-col gap-4">
      {/* Search and Filters */}
      <Card className="border-border/80 bg-card shadow-xs">
        <CardContent className="p-3 flex flex-wrap items-center justify-between gap-3">
          <div className="relative flex-1 min-w-[260px] max-w-md">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
            <Input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search evidence ID, source file, summary..."
              className="pl-9 h-8 text-xs bg-muted/20 border-input"
            />
          </div>

          <div className="flex items-center gap-2.5 flex-wrap text-xs">
            {/* Case Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-muted-foreground text-xs">Case:</span>
              <Select value={selectedCase} onValueChange={val => setSelectedCase(val ?? 'ALL')}>
                <SelectTrigger size="sm" className="h-8 min-w-[120px] text-xs">
                  <SelectValue placeholder="All Cases" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Cases</SelectItem>
                  {uniqueCases.map(cid => (
                    <SelectItem key={cid} value={cid}>{cid}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Type Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-muted-foreground text-xs">Type:</span>
              <Select value={selectedType} onValueChange={val => setSelectedType(val ?? 'ALL')}>
                <SelectTrigger size="sm" className="h-8 min-w-[130px] text-xs">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  {evidenceTypes.map(t => (
                    <SelectItem key={t} value={t}>
                      {t === 'ALL' ? 'All Types' : t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Classification Status Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-muted-foreground text-xs">Classification:</span>
              <Select value={selectedStatus} onValueChange={val => setSelectedStatus(val ?? 'ALL')}>
                <SelectTrigger size="sm" className="h-8 min-w-[130px] text-xs">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  {classificationStatuses.map(s => (
                    <SelectItem key={s} value={s}>
                      {s === 'ALL' ? 'All Statuses' : s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="xs"
                onClick={() => {
                  setSearch('');
                  setSelectedCase('ALL');
                  setSelectedType('ALL');
                  setSelectedStatus('ALL');
                }}
                className="text-xs text-muted-foreground hover:text-foreground h-8"
              >
                Reset
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Main Evidence Table */}
      <Card className="border-border bg-card shadow-xs overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border/70 hover:bg-transparent">
              <TableHead className="w-[120px] font-medium text-xs text-muted-foreground">Evidence ID</TableHead>
              <TableHead className="w-[110px] font-medium text-xs text-muted-foreground">Type</TableHead>
              <TableHead className="font-medium text-xs text-muted-foreground">Title & Forensic Summary</TableHead>
              <TableHead className="w-[110px] font-medium text-xs text-muted-foreground">Case</TableHead>
              <TableHead className="w-[130px] font-medium text-xs text-muted-foreground">Source Document</TableHead>
              <TableHead className="w-[120px] font-medium text-xs text-muted-foreground">Timestamp</TableHead>
              <TableHead className="w-[110px] font-medium text-xs text-muted-foreground">Status</TableHead>
              <TableHead className="w-[90px] text-right font-medium text-xs text-muted-foreground">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredEvidence.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="py-12 text-center text-muted-foreground text-xs">
                  No evidence records match the selected filters.
                </TableCell>
              </TableRow>
            ) : (
              filteredEvidence.map(ev => (
                <TableRow
                  key={ev.id}
                  className="border-border/50 hover:bg-slate-50 transition-colors group cursor-pointer"
                  onClick={() => setActiveEvidence(ev)}
                >
                  <TableCell className="font-mono text-xs font-semibold text-emerald-700 whitespace-nowrap">
                    {ev.id}
                  </TableCell>

                  <TableCell className="whitespace-nowrap text-xs text-slate-600">
                    <Badge variant="outline" className="text-[10px] font-normal text-slate-600 border-slate-200 bg-slate-50">
                      {ev.type}
                    </Badge>
                  </TableCell>

                  <TableCell>
                    <div className="flex flex-col gap-0.5 min-w-[220px] max-w-[420px]">
                      <span className="font-medium text-slate-900 group-hover:text-blue-700 transition-colors text-xs truncate">
                        {ev.title}
                      </span>
                      <p className="text-[11px] text-slate-500 line-clamp-1">
                        {ev.summary}
                      </p>
                    </div>
                  </TableCell>

                  <TableCell className="whitespace-nowrap font-mono text-xs font-semibold text-blue-700">
                    {ev.caseId}
                  </TableCell>

                  <TableCell className="whitespace-nowrap font-mono text-slate-600 text-[11px]">
                    {ev.sourceFile}
                  </TableCell>

                  <TableCell className="whitespace-nowrap text-muted-foreground text-xs">
                    {ev.timestamp}
                  </TableCell>

                  <TableCell className="whitespace-nowrap">
                    <ClassificationBadge status={ev.status} size="sm" />
                  </TableCell>

                  <TableCell className="text-right whitespace-nowrap">
                    <Button
                      type="button"
                      variant="outline"
                      size="xs"
                      onClick={e => {
                        e.stopPropagation();
                        setActiveEvidence(ev);
                      }}
                    >
                      Inspect
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Forensic Evidence Detail Modal */}
      {activeEvidence && (
        <EvidenceDetailModal
          evidence={activeEvidence}
          onClose={() => setActiveEvidence(null)}
        />
      )}
    </div>
  );
}
