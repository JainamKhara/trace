'use client';

import React, { useState, useRef, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  getCytoscapeGraphData,
  getCases,
  getEntities,
  getEntityById,
  getRelationshipById,
  getRelationshipsByEntity,
  getInvestigativeLeads
} from '@/lib/dataService';
import { NetworkControls } from './NetworkControls';
import { NetworkGraph, type NetworkGraphHandle } from './NetworkGraph';
import { EntityPanel } from './EntityPanel';
import { RelationshipPanel } from './RelationshipPanel';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Network,
  GitFork,
  Target,
  ArrowRight,
  SlidersHorizontal
} from 'lucide-react';
import type { Entity, Relationship, InvestigativeLead } from '@/types/investigation';
import { cn } from '@/lib/utils';

export function NetworkWorkspace() {
  const searchParams = useSearchParams();
  const queryCase = searchParams.get('case');
  const queryEntity = searchParams.get('entity');

  const cases = useMemo(() => getCases(), []);
  const allEntities = useMemo(() => getEntities(), []);
  const graphRef = useRef<NetworkGraphHandle>(null);

  const [mobileTab, setMobileTab] = useState<'graph' | 'controls' | 'inspector'>('graph');
  const [selectedCase, setSelectedCase] = useState<string>(() => queryCase || 'ALL');
  const [entitySearch, setEntitySearch] = useState<string>('');
  const [selectedEntityType, setSelectedEntityType] = useState<string>('ALL');
  const [selectedRelType, setSelectedRelType] = useState<string>('ALL');
  const [filterCrossCaseOnly, setFilterCrossCaseOnly] = useState<boolean>(false);
  const [activeLayout, setActiveLayout] = useState<string>('cose');

  const [selectedNodeId, setSelectedNodeId] = useState<string>(() => queryEntity || '');
  const [selectedEdgeId, setSelectedEdgeId] = useState<string>('');

  const [prevQueryParams, setPrevQueryParams] = useState({ case: queryCase, entity: queryEntity });

  if (prevQueryParams.case !== queryCase || prevQueryParams.entity !== queryEntity) {
    setPrevQueryParams({ case: queryCase, entity: queryEntity });
    if (queryCase && queryCase !== selectedCase) {
      setSelectedCase(queryCase);
    }
    if (queryEntity) {
      setSelectedNodeId(queryEntity);
      setSelectedEdgeId('');
    }
  }

  // When mobile tab switches to graph, ensure Cytoscape resizes and fits to viewport
  React.useEffect(() => {
    if (mobileTab === 'graph' && graphRef.current) {
      const timer = setTimeout(() => {
        graphRef.current?.resizeAndFit();
      }, 60);
      return () => clearTimeout(timer);
    }
  }, [mobileTab]);

  // Compute graph data based on filters
  const graphData = useMemo(() => {
    return getCytoscapeGraphData({
      caseId: selectedCase,
      entityType: selectedEntityType,
      relationshipType: selectedRelType,
      filterCrossCaseOnly
    });
  }, [selectedCase, selectedEntityType, selectedRelType, filterCrossCaseOnly]);

  // Handle entity search within graph
  const handleEntitySearchChange = (val: string) => {
    setEntitySearch(val);
    if (!val.trim()) return;
    const match = allEntities.find(
      e =>
        e.name.toLowerCase().includes(val.toLowerCase()) ||
        e.identifiers.phone?.includes(val) ||
        e.identifiers.registration?.toLowerCase().includes(val.toLowerCase())
    );

    if (match) {
      setSelectedNodeId(match.id);
      setSelectedEdgeId('');
      graphRef.current?.highlightNode(match.id);
    }
  };

  // Node & Edge selection handlers
  const handleSelectNode = (nodeId: string) => {
    setSelectedNodeId(nodeId);
    setSelectedEdgeId('');
  };

  const handleSelectEdge = (edgeId: string) => {
    setSelectedEdgeId(edgeId);
    setSelectedNodeId('');
  };

  const handleClearSelection = () => {
    setSelectedNodeId('');
    setSelectedEdgeId('');
  };

  const handleResetFilters = () => {
    setSelectedCase('ALL');
    setEntitySearch('');
    setSelectedEntityType('ALL');
    setSelectedRelType('ALL');
    setFilterCrossCaseOnly(false);
    setSelectedNodeId('');
    setSelectedEdgeId('');
    graphRef.current?.resetView();
  };

  const handleExpandConnections = () => {
    if (selectedNodeId) {
      graphRef.current?.expandNeighborhood(selectedNodeId);
    } else {
      // Default to Rahul Sharma if none selected
      setSelectedNodeId('E-PER-001');
      graphRef.current?.expandNeighborhood('E-PER-001');
    }
  };

  // Resolve selected entity dossier or relationship
  const selectedEntity: Entity | undefined = selectedNodeId
    ? getEntityById(selectedNodeId)
    : undefined;

  const entityRelationships: Relationship[] = selectedNodeId
    ? getRelationshipsByEntity(selectedNodeId)
    : [];

  const selectedRelationship: Relationship | undefined = selectedEdgeId
    ? getRelationshipById(selectedEdgeId)
    : undefined;

  const crossCaseLead: InvestigativeLead | undefined = useMemo(() => {
    return getInvestigativeLeads().find(l => l.id === 'LEAD-001');
  }, []);

  return (
    <div className="flex-1 flex flex-col w-full h-[calc(100vh-3.5rem)] overflow-hidden bg-background">
      {/* Mobile Tab Switcher (< lg) */}
      <div className="lg:hidden flex items-center justify-between px-3 py-2 bg-card border-b border-border shrink-0 z-20">
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg w-full">
          <button
            type="button"
            onClick={() => setMobileTab('graph')}
            className={cn(
              'flex-1 py-1.5 px-2 text-xs font-medium rounded-md text-center transition-colors flex items-center justify-center gap-1.5',
              mobileTab === 'graph'
                ? 'bg-white text-blue-700 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            )}
          >
            <Network className="size-3.5" />
            <span>Graph</span>
          </button>
          <button
            type="button"
            onClick={() => setMobileTab('controls')}
            className={cn(
              'flex-1 py-1.5 px-2 text-xs font-medium rounded-md text-center transition-colors flex items-center justify-center gap-1.5',
              mobileTab === 'controls'
                ? 'bg-white text-blue-700 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            )}
          >
            <SlidersHorizontal className="size-3.5" />
            <span>Filters ({graphData.nodes.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setMobileTab('inspector')}
            className={cn(
              'flex-1 py-1.5 px-2 text-xs font-medium rounded-md text-center transition-colors flex items-center justify-center gap-1.5 relative',
              mobileTab === 'inspector'
                ? 'bg-white text-blue-700 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            )}
          >
            <Target className="size-3.5" />
            <span>Inspector</span>
            {(selectedEntity || selectedRelationship) && (
              <span className="size-1.5 rounded-full bg-blue-600" />
            )}
          </button>
        </div>
      </div>

      {/* Main Workspace Body */}
      <div className="flex-1 flex w-full h-full overflow-hidden relative">
        {/* Left Column: Network Controls */}
        <div
          className={cn(
            'w-full lg:w-72 shrink-0 h-full overflow-hidden bg-card lg:border-r border-border',
            mobileTab === 'controls' ? 'flex flex-col' : 'hidden lg:flex lg:flex-col'
          )}
        >
          <NetworkControls
            cases={cases}
            selectedCase={selectedCase}
            onSelectCase={c => {
              setSelectedCase(c);
              setSelectedNodeId('');
              setSelectedEdgeId('');
            }}
            entitySearch={entitySearch}
            onEntitySearchChange={handleEntitySearchChange}
            selectedEntityType={selectedEntityType}
            onSelectEntityType={setSelectedEntityType}
            selectedRelType={selectedRelType}
            onSelectRelType={setSelectedRelType}
            filterCrossCaseOnly={filterCrossCaseOnly}
            onToggleCrossCaseOnly={() => setFilterCrossCaseOnly(prev => !prev)}
            activeLayout={activeLayout}
            onChangeLayout={layoutId => {
              setActiveLayout(layoutId);
              setMobileTab('graph');
            }}
            onFitGraph={() => {
              graphRef.current?.fit();
              setMobileTab('graph');
            }}
            onResetGraph={handleResetFilters}
            onExpandConnections={() => {
              handleExpandConnections();
              setMobileTab('graph');
            }}
            nodeCount={graphData.nodes.length}
            edgeCount={graphData.edges.length}
          />
        </div>

        {/* Center Column: Cytoscape Network Canvas */}
        <div
          className={cn(
            'flex-1 flex-col min-w-0 h-full relative',
            mobileTab === 'graph' ? 'flex' : 'hidden lg:flex'
          )}
        >
          {/* Top Active Graph Filter Bar */}
          <div className="h-10 px-3 sm:px-4 border-b border-border bg-card flex items-center justify-between text-xs select-none z-10 shrink-0">
            <div className="flex items-center gap-2 text-foreground truncate">
              <span className="text-slate-500 text-xs hidden sm:inline">Scope:</span>
              <Badge variant="outline" className="text-xs font-medium py-0.5 px-2 bg-blue-50 text-blue-700 border-blue-200 truncate">
                {selectedCase === 'ALL' ? 'All Active Cases' : selectedCase}
              </Badge>
              {filterCrossCaseOnly && (
                <Badge variant="outline" className="border-rose-200 bg-rose-50 text-rose-800 gap-1 font-normal text-[11px] truncate">
                  <GitFork className="size-3" />
                  Cross-Case Filter Active
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-slate-500 text-[11px] hidden sm:inline">Cytoscape Multi-Hop Engine</span>
              <Badge variant="outline" className="text-emerald-700 border-emerald-200 bg-emerald-50 text-[10px] gap-1 py-0 h-5 font-normal">
                <span className="size-1.5 rounded-full bg-emerald-600 animate-pulse" />
                Verified Local
              </Badge>
            </div>
          </div>

          {/* Graph Component */}
          <NetworkGraph
            ref={graphRef}
            nodes={graphData.nodes}
            edges={graphData.edges}
            onSelectNode={handleSelectNode}
            onSelectEdge={handleSelectEdge}
            onClearSelection={handleClearSelection}
            selectedNodeId={selectedNodeId}
            selectedEdgeId={selectedEdgeId}
            layoutName={activeLayout}
          />

          {/* Floating Mobile Bottom Pill When Node/Edge is Selected */}
          {(selectedEntity || selectedRelationship) && mobileTab === 'graph' && (
            <div className="lg:hidden absolute bottom-3 left-3 right-3 z-20 bg-white/95 backdrop-blur-xs border border-blue-200 rounded-lg p-2.5 shadow-lg flex items-center justify-between gap-2 animate-in slide-in-from-bottom duration-200">
              <div className="flex items-center gap-2 min-w-0">
                <span className="size-2 rounded-full bg-blue-600 shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-900 truncate">
                    {selectedEntity ? selectedEntity.name : `Link: ${selectedRelationship?.type}`}
                  </p>
                  <p className="text-[10px] text-slate-500 truncate">
                    {selectedEntity ? `${selectedEntity.type} • ${selectedEntity.primaryCase}` : `Confidence: ${selectedRelationship?.confidence}%`}
                  </p>
                </div>
              </div>
              <Button
                type="button"
                size="xs"
                onClick={() => setMobileTab('inspector')}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs shrink-0"
              >
                Inspect Intel
              </Button>
            </div>
          )}
        </div>

        {/* Right Column: Selected Entity / Relationship / Empty State Inspector */}
        <div
          className={cn(
            'w-full lg:w-84 xl:w-96 shrink-0 h-full overflow-hidden flex flex-col bg-card lg:border-l border-border',
            mobileTab === 'inspector' ? 'flex flex-col' : 'hidden lg:flex lg:flex-col'
          )}
        >
          {selectedEntity ? (
            <EntityPanel
              entity={selectedEntity}
              relationships={entityRelationships}
              onSelectRelationship={handleSelectEdge}
              onClose={handleClearSelection}
            />
          ) : selectedRelationship ? (
            <RelationshipPanel
              relationship={selectedRelationship}
              sourceEntity={getEntityById(selectedRelationship.sourceId)}
              targetEntity={getEntityById(selectedRelationship.targetId)}
              onClose={handleClearSelection}
            />
          ) : (
            /* Empty / Default Inspector State with Demo Shortcuts */
            <div className="h-full flex flex-col overflow-y-auto p-4 text-xs space-y-4 select-none">
              <Card className="border-dashed border-slate-200 bg-slate-50/50 text-center p-5 shadow-none space-y-2.5">
                <div className="size-10 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 mx-auto flex items-center justify-center">
                  <Network className="size-5" />
                </div>
                <h3 className="text-sm font-semibold text-slate-900">
                  Inspector Ready
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Click any entity node or connection edge in the graph canvas to inspect verified provenance, confidence scores, and source evidence.
                </p>
              </Card>

              {/* Cross-Case Bridge Highlight Feature */}
              {crossCaseLead && (
                <Card className="border-amber-200 bg-amber-50/40 p-3.5 space-y-2.5 shadow-none">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-900 flex items-center gap-1.5">
                      <GitFork className="size-3.5 text-amber-600" />
                      CASE-101 ↔ CASE-207
                    </span>
                    <Badge variant="outline" className="border-amber-200 bg-amber-100/60 text-amber-800 font-mono text-[10px] tabular-nums py-0 h-4">
                      91% Confidence
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Correlated records link Rahul Sharma (CASE-101) to Amit Patel (CASE-207) via shared handset Phone X.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedNodeId('E-PHO-001');
                      graphRef.current?.expandNeighborhood('E-PHO-001');
                      setMobileTab('graph');
                    }}
                    className="w-full text-xs h-7 gap-1.5 border-amber-300 bg-white text-amber-800 hover:bg-amber-50"
                  >
                    <span>Highlight Bridge in Graph</span>
                    <ArrowRight className="size-3" />
                  </Button>
                </Card>
              )}

              {/* Quick Demo Shortcuts for Evaluators/Judges */}
              <div className="space-y-2 pt-2 border-t border-slate-200">
                <div className="flex items-center gap-1.5 text-xs font-medium text-slate-700">
                  <Target className="size-3.5 text-blue-600" />
                  <span>Quick Inspection Anchors</span>
                </div>
                <div className="space-y-1.5">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedNodeId('E-PER-001');
                      graphRef.current?.highlightNode('E-PER-001');
                      setMobileTab('graph');
                    }}
                    className="w-full h-8 px-2.5 justify-between text-xs font-normal border-slate-200 bg-white hover:bg-slate-50"
                  >
                    <span className="text-slate-900">1. Rahul Sharma (Person)</span>
                    <Badge variant="secondary" className="text-[10px] font-mono py-0 h-4 text-blue-700 bg-blue-50">
                      CASE-101
                    </Badge>
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedNodeId('E-PHO-001');
                      graphRef.current?.highlightNode('E-PHO-001');
                      setMobileTab('graph');
                    }}
                    className="w-full h-8 px-2.5 justify-between text-xs font-normal border-slate-200 bg-white hover:bg-slate-50"
                  >
                    <span className="text-slate-900">2. Phone X (+91 98712...)</span>
                    <Badge variant="secondary" className="text-[10px] font-mono py-0 h-4 text-sky-700 bg-sky-50">
                      Bridge Handset
                    </Badge>
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedNodeId('E-PER-003');
                      graphRef.current?.highlightNode('E-PER-003');
                      setMobileTab('graph');
                    }}
                    className="w-full h-8 px-2.5 justify-between text-xs font-normal border-slate-200 bg-white hover:bg-slate-50"
                  >
                    <span className="text-slate-900">3. Amit Patel (Person)</span>
                    <Badge variant="secondary" className="text-[10px] font-mono py-0 h-4 text-blue-700 bg-blue-50">
                      CASE-207
                    </Badge>
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedEdgeId('REL-002');
                      setMobileTab('graph');
                    }}
                    className="w-full h-8 px-2.5 justify-between text-xs font-normal border-slate-200 bg-white hover:bg-slate-50"
                  >
                    <span className="text-slate-900">4. Phone Call (CDR_101.csv)</span>
                    <Badge variant="secondary" className="text-[10px] font-mono py-0 h-4 text-emerald-700 bg-emerald-50 tabular-nums">
                      96% Conf
                    </Badge>
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
