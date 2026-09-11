'use client';

import React from 'react';
import {
  SlidersHorizontal,
  Search,
  RotateCcw,
  Maximize2,
  GitFork,
  Layers,
  Eye
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import type { Case } from '@/types/investigation';

interface NetworkControlsProps {
  cases: Case[];
  selectedCase: string;
  onSelectCase: (caseId: string) => void;
  entitySearch: string;
  onEntitySearchChange: (val: string) => void;
  selectedEntityType: string;
  onSelectEntityType: (type: string) => void;
  selectedRelType: string;
  onSelectRelType: (relType: string) => void;
  filterCrossCaseOnly: boolean;
  onToggleCrossCaseOnly: () => void;
  activeLayout: string;
  onChangeLayout: (layout: string) => void;
  onFitGraph: () => void;
  onResetGraph: () => void;
  onExpandConnections: () => void;
  nodeCount: number;
  edgeCount: number;
}

const entityTypes = [
  'ALL',
  'Person',
  'Phone',
  'Vehicle',
  'Account',
  'Location',
  'Organization'
];

const relationshipTypes = [
  'ALL',
  'CALLED',
  'TRANSFERRED',
  'OWNS',
  'LOCATED_AT',
  'ASSOCIATED_WITH',
  'LINKED_TO',
  'CONNECTED_TO'
];

const layouts = [
  { id: 'cose', label: 'CoSE Force' },
  { id: 'concentric', label: 'Concentric' },
  { id: 'breadthfirst', label: 'Hierarchical' },
  { id: 'grid', label: 'Grid' }
];

export function NetworkControls({
  cases,
  selectedCase,
  onSelectCase,
  entitySearch,
  onEntitySearchChange,
  selectedEntityType,
  onSelectEntityType,
  selectedRelType,
  onSelectRelType,
  filterCrossCaseOnly,
  onToggleCrossCaseOnly,
  activeLayout,
  onChangeLayout,
  onFitGraph,
  onResetGraph,
  onExpandConnections,
  nodeCount,
  edgeCount
}: NetworkControlsProps) {
  return (
    <div className="w-full bg-card flex flex-col shrink-0 select-none text-xs h-full overflow-hidden">
      {/* Header */}
      <div className="h-14 px-4 border-b border-border flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="size-4 text-blue-600" />
          <span className="font-semibold text-slate-900 text-sm tracking-tight">
            Network Controls
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <Badge variant="outline" className="text-[11px] font-mono tabular-nums py-0 h-5 text-blue-700 border-blue-200 bg-blue-50">
            {nodeCount} Nodes
          </Badge>
          <Badge variant="secondary" className="text-[11px] font-mono tabular-nums py-0 h-5 text-slate-600 bg-slate-100">
            {edgeCount} Edges
          </Badge>
        </div>
      </div>

      {/* Control Body */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
        {/* Search Entity Input */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-medium text-slate-600">
            Search in Network
          </label>
          <div className="relative">
            <Search className="size-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <Input
              type="text"
              value={entitySearch}
              onChange={e => onEntitySearchChange(e.target.value)}
              placeholder="Search name, phone, reg..."
              className="pl-8 h-8 text-xs bg-slate-50/50 border-slate-200"
            />
          </div>
        </div>

        {/* Case Scope Filter */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-medium text-slate-600">
            Investigation Case Scope
          </label>
          <Select value={selectedCase} onValueChange={val => onSelectCase(val ?? 'ALL')}>
            <SelectTrigger size="sm" className="w-full h-8 text-xs border-slate-200">
              <SelectValue placeholder="All Active Cases" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Active Cases (Global)</SelectItem>
              {cases.map(c => (
                <SelectItem key={c.id} value={c.id}>
                  {c.id} - {c.title.slice(0, 22)}...
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Cross-Case Bridge Highlight Toggle */}
        <div
          role="button"
          tabIndex={0}
          onClick={onToggleCrossCaseOnly}
          onKeyDown={e => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onToggleCrossCaseOnly();
            }
          }}
          className={cn(
            'w-full text-left p-3 rounded-xl border transition-all cursor-pointer select-none',
            filterCrossCaseOnly
              ? 'bg-rose-50/90 border-rose-300 ring-1 ring-rose-200 shadow-xs'
              : 'bg-slate-50/70 border-slate-200 hover:bg-slate-100/70'
          )}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className={cn(
                  'size-8 rounded-lg flex items-center justify-center shrink-0 transition-colors',
                  filterCrossCaseOnly
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'bg-white text-rose-600 border border-slate-200'
                )}
              >
                <GitFork className="size-4" />
              </div>
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-slate-900 truncate">
                    Cross-Case Bridges
                  </span>
                  {filterCrossCaseOnly && (
                    <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 border-rose-300 bg-rose-100 text-rose-700 font-mono font-semibold">
                      ACTIVE
                    </Badge>
                  )}
                </div>
                <span className="text-[11px] text-slate-500 leading-tight mt-0.5">
                  Isolate multi-case syndicate links
                </span>
              </div>
            </div>

            {/* Custom Interactive Switch Pill */}
            <div
              role="switch"
              aria-checked={filterCrossCaseOnly}
              aria-label="Toggle Cross-Case Bridges isolation"
              className={cn(
                'w-9 h-5 rounded-full transition-colors relative shrink-0 p-0.5 pointer-events-none',
                filterCrossCaseOnly ? 'bg-rose-600' : 'bg-slate-300'
              )}
            >
              <div
                className={cn(
                  'w-4 h-4 rounded-full bg-white transition-transform shadow-xs',
                  filterCrossCaseOnly ? 'translate-x-4' : 'translate-x-0'
                )}
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Entity Type Filter */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-medium text-slate-600">
            Entity Type Filter
          </label>
          <div className="grid grid-cols-2 gap-1.5 bg-slate-100/70 p-1.5 rounded-lg border border-slate-200">
            {entityTypes.map(type => {
              const isSelected = selectedEntityType === type;
              return (
                <Button
                  key={type}
                  type="button"
                  size="xs"
                  variant={isSelected ? 'secondary' : 'ghost'}
                  onClick={() => onSelectEntityType(type)}
                  className={cn(
                    'text-[11px] h-6 justify-start px-2 font-normal transition-all',
                    isSelected
                      ? 'bg-white text-blue-700 font-semibold shadow-xs border border-blue-200'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                  )}
                >
                  <span className={cn('size-1.5 rounded-full mr-1.5', isSelected ? 'bg-blue-600' : 'bg-slate-400')} />
                  <span>{type}</span>
                </Button>
              );
            })}
          </div>
        </div>

        {/* Relationship Type Filter */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-medium text-slate-600">
            Relationship Type Filter
          </label>
          <Select value={selectedRelType} onValueChange={val => onSelectRelType(val ?? 'ALL')}>
            <SelectTrigger size="sm" className="w-full h-8 text-xs border-slate-200">
              <SelectValue placeholder="All Relationships" />
            </SelectTrigger>
            <SelectContent>
              {relationshipTypes.map(rel => (
                <SelectItem key={rel} value={rel}>
                  {rel === 'ALL' ? 'All Relationships' : rel}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Separator />

        {/* Graph Layout Selector */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-medium text-slate-600 flex items-center gap-1.5">
            <Layers className="size-3.5 text-slate-500" />
            <span>Layout Engine</span>
          </label>
          <div className="grid grid-cols-2 gap-1.5">
            {layouts.map(layout => {
              const isActive = activeLayout === layout.id;
              return (
                <Button
                  key={layout.id}
                  type="button"
                  size="xs"
                  variant={isActive ? 'secondary' : 'outline'}
                  onClick={() => onChangeLayout(layout.id)}
                  className={cn(
                    'text-[11px] h-7 font-normal transition-all',
                    isActive
                      ? 'border-blue-300 text-blue-700 font-semibold bg-blue-50'
                      : 'border-slate-200 text-slate-700 bg-white hover:bg-slate-50'
                  )}
                >
                  {layout.label}
                </Button>
              );
            })}
          </div>
        </div>

        <Separator />

        {/* Action Controls */}
        <div className="flex flex-col gap-2 pt-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onFitGraph}
            className="gap-2 justify-center text-xs"
          >
            <Maximize2 className="size-3.5 text-primary" />
            <span>Fit to Viewport</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onResetGraph}
            className="gap-2 justify-center text-xs"
          >
            <RotateCcw className="size-3.5 text-muted-foreground" />
            <span>Reset Layout</span>
          </Button>

          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={onExpandConnections}
            className="gap-2 justify-center text-xs"
            title="Expand selected node connections"
          >
            <Eye className="size-3.5" />
            <span>Expand Neighborhood</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
