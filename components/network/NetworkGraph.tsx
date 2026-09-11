'use client';

import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react';
import cytoscape from 'cytoscape';
import { ZoomIn, ZoomOut, Maximize2, RotateCcw } from 'lucide-react';
import type { NetworkGraphNode, NetworkGraphEdge } from '@/types/investigation';

export interface NetworkGraphHandle {
  fit: () => void;
  resetView: () => void;
  expandNeighborhood: (nodeId: string) => void;
  highlightNode: (nodeId: string) => void;
  resizeAndFit: () => void;
  runLayout: (layoutName?: string) => void;
}

interface NetworkGraphProps {
  nodes: NetworkGraphNode[];
  edges: NetworkGraphEdge[];
  onSelectNode: (nodeId: string) => void;
  onSelectEdge: (edgeId: string) => void;
  onClearSelection: () => void;
  selectedNodeId?: string;
  selectedEdgeId?: string;
  layoutName?: string;
}

export const NetworkGraph = forwardRef<NetworkGraphHandle, NetworkGraphProps>(function NetworkGraph(
  {
    nodes,
    edges,
    onSelectNode,
    onSelectEdge,
    onClearSelection,
    selectedNodeId,
    selectedEdgeId,
    layoutName = 'cose'
  },
  ref
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<cytoscape.Core | null>(null);
  const [isReady, setIsReady] = useState(false);

  const onSelectNodeRef = useRef(onSelectNode);
  const onSelectEdgeRef = useRef(onSelectEdge);
  const onClearSelectionRef = useRef(onClearSelection);
  const layoutNameRef = useRef(layoutName);

  useEffect(() => {
    onSelectNodeRef.current = onSelectNode;
    onSelectEdgeRef.current = onSelectEdge;
    onClearSelectionRef.current = onClearSelection;
    layoutNameRef.current = layoutName;
  }, [onSelectNode, onSelectEdge, onClearSelection, layoutName]);

  // Expose imperative methods to parent
  useImperativeHandle(ref, () => ({
    fit: () => {
      if (cyRef.current) {
        cyRef.current.resize();
        cyRef.current.animate({ fit: { eles: cyRef.current.elements(), padding: 40 }, duration: 300 });
      }
    },
    resetView: () => {
      if (cyRef.current) {
        cyRef.current.resize();
        cyRef.current.elements().removeClass('highlighted dimmed active-selected');
        const layout = cyRef.current.layout(getLayoutConfig(layoutName));
        layout.run();
        cyRef.current.fit(undefined, 40);
      }
    },
    resizeAndFit: () => {
      if (cyRef.current) {
        cyRef.current.resize();
        const layout = cyRef.current.layout(getLayoutConfig(layoutName));
        layout.run();
        cyRef.current.fit(undefined, 40);
      }
    },
    runLayout: (name?: string) => {
      if (cyRef.current) {
        cyRef.current.resize();
        const layout = cyRef.current.layout(getLayoutConfig(name || layoutName));
        layout.run();
        cyRef.current.fit(undefined, 40);
      }
    },
    expandNeighborhood: (nodeId: string) => {
      if (!cyRef.current) return;
      const target = cyRef.current.getElementById(nodeId);
      if (target.length > 0) {
        const neighborhood = target.neighborhood().add(target);
        cyRef.current.elements().addClass('dimmed').removeClass('highlighted active-selected');
        neighborhood.removeClass('dimmed').addClass('highlighted');
        target.addClass('active-selected');
        cyRef.current.animate({
          fit: { eles: neighborhood, padding: 60 },
          duration: 400
        });
      }
    },
    highlightNode: (nodeId: string) => {
      if (!cyRef.current) return;
      const node = cyRef.current.getElementById(nodeId);
      if (node.length > 0) {
        applySelectionHighlight(cyRef.current, node);
      }
    }
  }));

  const getLayoutConfig = (name: string): cytoscape.LayoutOptions => {
    switch (name) {
      case 'concentric':
        return {
          name: 'concentric',
          fit: true,
          concentric: (node: cytoscape.NodeSingular) => {
            if (node.data('isCrossCaseBridge')) return 10;
            const deg = node.degree();
            if (deg >= 5) return 8;
            if (deg >= 3) return 6;
            if (deg >= 2) return 4;
            return 2;
          },
          levelWidth: () => 2.5,
          padding: 30,
          avoidOverlap: true,
          nodeDimensionsIncludeLabels: false,
          spacingFactor: 0.9,
          equidistant: false,
          minNodeSpacing: 18,
          animate: false,
          stop: () => {
            if (cyRef.current) {
              cyRef.current.fit(undefined, 30);
            }
          }
        } as unknown as cytoscape.LayoutOptions;
      case 'breadthfirst':
        return {
          name: 'breadthfirst',
          directed: true,
          fit: true,
          padding: 30,
          spacingFactor: 0.9,
          avoidOverlap: true,
          nodeDimensionsIncludeLabels: false,
          animate: false,
          stop: () => {
            if (cyRef.current) {
              cyRef.current.fit(undefined, 30);
            }
          }
        } as unknown as cytoscape.LayoutOptions;
      case 'grid':
        return {
          name: 'grid',
          fit: true,
          padding: 30,
          avoidOverlap: true,
          avoidOverlapPadding: 20,
          nodeDimensionsIncludeLabels: true,
          spacingFactor: 1.25,
          condense: false,
          animate: false,
          stop: () => {
            if (cyRef.current) {
              cyRef.current.fit(undefined, 30);
            }
          }
        } as unknown as cytoscape.LayoutOptions;
      case 'cose':
      default:
        return {
          name: 'cose',
          fit: true,
          animate: false,
          randomize: false,
          componentSpacing: 80,
          nodeRepulsion: () => 600000,
          nodeOverlap: 30,
          idealEdgeLength: () => 90,
          edgeElasticity: () => 100,
          nestingFactor: 1.2,
          gravity: 80,
          numIter: 1000,
          initialTemp: 200,
          coolingFactor: 0.95,
          minTemp: 1.0,
          stop: () => {
            if (cyRef.current) {
              cyRef.current.fit(undefined, 30);
            }
          }
        } as unknown as cytoscape.LayoutOptions;
    }
  };

  const applySelectionHighlight = (
    cy: cytoscape.Core,
    targetEles: cytoscape.SingularElementReturnValue | cytoscape.CollectionReturnValue
  ) => {
    cy.elements().removeClass('highlighted dimmed active-selected');

    if (targetEles && typeof (targetEles as cytoscape.NodeSingular).isNode === 'function' && (targetEles as cytoscape.NodeSingular).isNode()) {
      const node = targetEles as cytoscape.NodeSingular;
      const neighborhood = node.neighborhood().add(node);
      cy.elements().difference(neighborhood).addClass('dimmed');
      neighborhood.addClass('highlighted');
      node.addClass('active-selected');
    } else if (targetEles && typeof (targetEles as cytoscape.EdgeSingular).isEdge === 'function' && (targetEles as cytoscape.EdgeSingular).isEdge()) {
      const edge = targetEles as cytoscape.EdgeSingular;
      const connectedNodes = edge.connectedNodes();
      const activeGroup = edge.add(connectedNodes);
      cy.elements().difference(activeGroup).addClass('dimmed');
      activeGroup.addClass('highlighted');
      edge.addClass('active-selected');
    }
  };

  // Initialize Cytoscape
  useEffect(() => {
    if (!containerRef.current) return;

    const elements: cytoscape.ElementDefinition[] = [
      ...nodes.map(n => ({
        group: 'nodes' as const,
        data: {
          ...n.data,
          id: n.data.id,
          label: n.data.label
        }
      })),
      ...edges.map(e => ({
        group: 'edges' as const,
        data: {
          ...e.data,
          id: e.data.id,
          source: e.data.source,
          target: e.data.target,
          label: e.data.type
        }
      }))
    ];

    const cy = cytoscape({
      container: containerRef.current,
      elements,
      style: [
        // Base Node Style
        {
          selector: 'node',
          style: {
            label: 'data(label)',
            'font-size': '11px',
            'font-family': 'Inter, sans-serif',
            'font-weight': 500,
            color: '#0f172a',
            'text-valign': 'bottom',
            'text-margin-y': 5,
            'text-max-width': '95px',
            'text-wrap': 'ellipsis',
            'text-background-color': '#ffffff',
            'text-background-opacity': 0.95,
            'text-background-padding': '3px',
            'text-background-shape': 'roundrectangle',
            'text-border-width': 1,
            'text-border-color': '#e2e8f0',
            width: 34,
            height: 34,
            'border-width': 2,
            'border-color': '#ffffff',
            'transition-property': 'background-color, border-color, border-width, opacity',
            'transition-duration': 0.2
          }
        },
        // Entity Type Shapes & Colors
        {
          selector: 'node[type = "Person"]',
          style: {
            shape: 'ellipse',
            'background-color': '#2563eb',
            'border-color': '#1d4ed8'
          }
        },
        {
          selector: 'node[type = "Phone"]',
          style: {
            shape: 'roundrectangle',
            'background-color': '#0284c7',
            'border-color': '#0369a1'
          }
        },
        {
          selector: 'node[type = "Vehicle"]',
          style: {
            shape: 'diamond',
            width: 38,
            height: 38,
            'background-color': '#d97706',
            'border-color': '#b45309'
          }
        },
        {
          selector: 'node[type = "Account"]',
          style: {
            shape: 'round-hexagon',
            'background-color': '#059669',
            'border-color': '#047857'
          }
        },
        {
          selector: 'node[type = "Location"]',
          style: {
            shape: 'tag',
            width: 36,
            height: 36,
            'background-color': '#7c3aed',
            'border-color': '#6d28d9'
          }
        },
        {
          selector: 'node[type = "Organization"]',
          style: {
            shape: 'round-pentagon',
            'background-color': '#475569',
            'border-color': '#334155'
          }
        },
        // Cross-Case Bridge Node styling
        {
          selector: 'node[?isCrossCaseBridge]',
          style: {
            'border-width': 3,
            'border-color': '#dc2626',
            'border-style': 'dashed'
          }
        },
        // Base Edge Style
        {
          selector: 'edge',
          style: {
            width: 2,
            'line-color': '#94a3b8',
            'target-arrow-color': '#64748b',
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier',
            'arrow-scale': 0.85,
            label: 'data(label)',
            'font-size': '9px',
            'font-family': 'Inter, monospace',
            color: '#475569',
            'text-rotation': 'autorotate',
            'text-background-color': '#ffffff',
            'text-background-opacity': 0.95,
            'text-background-padding': '2px',
            'text-border-width': 1,
            'text-border-color': '#e2e8f0',
            'text-margin-y': -6,
            'transition-property': 'line-color, width, opacity',
            'transition-duration': 0.2
          }
        },
        // Cross-case Edge styling
        {
          selector: 'edge[?isCrossCase]',
          style: {
            width: 2.5,
            'line-color': '#dc2626',
            'target-arrow-color': '#dc2626',
            'line-style': 'dashed'
          }
        },
        // Selection and Dimming classes
        {
          selector: 'node.highlighted',
          style: {
            opacity: 1,
            'border-width': 3,
            'border-color': '#1d4ed8'
          }
        },
        {
          selector: 'node.active-selected',
          style: {
            opacity: 1,
            'border-width': 4,
            'border-color': '#0f172a'
          }
        },
        {
          selector: 'edge.highlighted',
          style: {
            opacity: 1,
            width: 3,
            'line-color': '#2563eb',
            'target-arrow-color': '#2563eb'
          }
        },
        {
          selector: 'edge.active-selected',
          style: {
            opacity: 1,
            width: 4,
            'line-color': '#1d4ed8',
            'target-arrow-color': '#1d4ed8'
          }
        },
        {
          selector: '.dimmed',
          style: {
            opacity: 0.15
          }
        }
      ],
      layout: getLayoutConfig(layoutNameRef.current),
      wheelSensitivity: 0.2,
      minZoom: 0.06,
      maxZoom: 3.5
    });

    cyRef.current = cy;

    // Attach Event Listeners
    cy.on('tap', 'node', evt => {
      const node = evt.target;
      applySelectionHighlight(cy, node);
      onSelectNodeRef.current(node.id());
    });

    cy.on('tap', 'edge', evt => {
      const edge = evt.target;
      applySelectionHighlight(cy, edge);
      onSelectEdgeRef.current(edge.id());
    });

    cy.on('tap', evt => {
      if (evt.target === cy) {
        cy.elements().removeClass('highlighted dimmed active-selected');
        onClearSelectionRef.current();
      }
    });

    cy.ready(() => {
      setIsReady(true);
      cy.fit(undefined, 40);
    });

    return () => {
      cy.destroy();
      cyRef.current = null;
    };
  }, [nodes, edges]);

  // Handle dynamic selection changes from outside (e.g. search or panel clicks)
  useEffect(() => {
    if (!cyRef.current || !isReady) return;

    if (selectedNodeId) {
      const node = cyRef.current.getElementById(selectedNodeId);
      if (node.length > 0) {
        applySelectionHighlight(cyRef.current, node);
      }
    } else if (selectedEdgeId) {
      const edge = cyRef.current.getElementById(selectedEdgeId);
      if (edge.length > 0) {
        applySelectionHighlight(cyRef.current, edge);
      }
    } else {
      cyRef.current.elements().removeClass('highlighted dimmed active-selected');
    }
  }, [selectedNodeId, selectedEdgeId, isReady]);

  // Keep Cytoscape dimensions synchronized with container resize / mobile tab activation
  useEffect(() => {
    if (!containerRef.current || !cyRef.current || !isReady) return;
    const observer = new ResizeObserver(entries => {
      for (const entry of entries) {
        if (entry.contentRect.width > 50 && entry.contentRect.height > 50) {
          if (cyRef.current) {
            cyRef.current.resize();
          }
        }
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [isReady]);

  // Handle layout change
  useEffect(() => {
    if (!cyRef.current || !isReady) return;
    try {
      cyRef.current.stop();
    } catch {
      // ignore
    }
    cyRef.current.resize();
    const layout = cyRef.current.layout(getLayoutConfig(layoutName));
    layout.run();
    const timer = setTimeout(() => {
      if (cyRef.current) {
        cyRef.current.resize();
        cyRef.current.fit(undefined, 40);
      }
    }, 60);
    return () => clearTimeout(timer);
  }, [layoutName, isReady]);

  return (
    <div className="relative w-full h-full flex-1 min-h-[500px] bg-slate-50 overflow-hidden select-none">
      {/* Cytoscape Container Element */}
      <div ref={containerRef} className="w-full h-full cytoscape-container" />

      {/* Floating Canvas Quick Controls (Zoom, Fit) */}
      <div className="absolute bottom-4 left-4 z-10 flex items-center gap-1.5 p-1 rounded-lg bg-white/95 border border-slate-200 backdrop-blur-xs shadow-md">
        <button
          type="button"
          onClick={() => cyRef.current?.zoom(cyRef.current.zoom() * 1.25)}
          className="p-1.5 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => cyRef.current?.zoom(cyRef.current.zoom() * 0.8)}
          className="p-1.5 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>

        <div className="h-4 w-px bg-slate-200" />

        <button
          type="button"
          onClick={() => {
            if (cyRef.current) {
              cyRef.current.animate({ fit: { eles: cyRef.current.elements(), padding: 40 }, duration: 300 });
            }
          }}
          className="p-1.5 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          title="Fit Graph to Screen"
        >
          <Maximize2 className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => {
            if (cyRef.current) {
              cyRef.current.elements().removeClass('highlighted dimmed active-selected');
              onClearSelection();
              cyRef.current.animate({ fit: { eles: cyRef.current.elements(), padding: 40 }, duration: 300 });
            }
          }}
          className="p-1.5 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          title="Reset Zoom & Selection"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Floating Graph Legend */}
      <div className="absolute top-4 left-4 z-10 hidden xl:flex items-center gap-3 px-3 py-1.5 rounded-lg bg-white/95 border border-slate-200 backdrop-blur-xs text-[11px] font-medium text-slate-700 shadow-sm">
        <span className="text-slate-400 font-semibold uppercase text-[10px]">Entity Legend:</span>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#2563eb]" />
          <span>Person</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-xs bg-[#0284c7]" />
          <span>Phone</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rotate-45 bg-[#d97706]" />
          <span>Vehicle</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-xs bg-[#059669]" />
          <span>Account</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#7c3aed]" />
          <span>Location</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 border-b-2 border-dashed border-[#dc2626]" />
          <span className="text-rose-700 font-semibold">Cross-Case Bridge</span>
        </div>
      </div>
    </div>
  );
});
