import React, { useMemo, useEffect, useRef, useState, useCallback } from 'react';
import {
  ReactFlow,
  Controls,
  ControlButton,
  MiniMap,
  Background,
  BackgroundVariant,
  MarkerType,
  useNodesState,
  useEdgesState,
  Node,
  Edge,
  NodeTypes,
  ReactFlowInstance,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Link2, ArrowRight, X, LayoutGrid, Check, Server } from 'lucide-react';
import { useAppStore } from '../../store/appStore';
import { PIPELINE_NODES } from '../../data/nodes';
import { PIPELINE_EDGES } from '../../data/edges';
import { resolveContent } from '../../data/resolveContent';
import { StageNode } from './nodes/StageNode';
import { GovernanceNode } from './nodes/GovernanceNode';
import { AnimatedLineageEdge } from './edges/AnimatedLineageEdge';
import { ZoneBoundariesLayer } from './ZoneBoundariesLayer';
import { getLayoutedElements } from './layout';

const nodeTypes: NodeTypes = {
  stage: StageNode as any,
  governance: GovernanceNode as any,
};

const edgeTypes = {
  animatedLineage: AnimatedLineageEdge,
};

export const PipelineCanvas: React.FC = () => {
  const {
    selectedVersion,
    selectedNodeId,
    setSelectedNodeId,
    selectedEdgeId,
    setSelectedEdgeId,
    setIsStatsModalOpen,
    setFilterStatus,
    selectedPlatformFilter,
    setSelectedPlatformFilter,
  } = useAppStore();
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const rfInstanceRef = useRef<ReactFlowInstance | null>(null);

  // Compute active nodes and edges based on selectedVersion
  const { rawNodes, rawEdges } = useMemo(() => {
    const visiblePipelineNodes = PIPELINE_NODES.filter((n) => {
      const content = resolveContent(n, selectedVersion);
      return content.visible !== false;
    });

    const activeNodeIds = new Set(visiblePipelineNodes.map((n) => n.id));

    const flowNodes: Node[] = visiblePipelineNodes.map((n) => ({
      id: n.id,
      type: n.category === 'governance' && n.id.startsWith('x-') ? 'governance' : 'stage',
      position: { x: 0, y: 0 },
      data: n as any,
    }));

    const visiblePipelineEdges = PIPELINE_EDGES.filter(
      (e) => !e.visibleIn || e.visibleIn.includes(selectedVersion)
    ).filter((e) => activeNodeIds.has(e.source) && activeNodeIds.has(e.target));

    const flowEdges: Edge[] = visiblePipelineEdges.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      label: e.label,
      type: 'animatedLineage',
      markerEnd: {
        type: MarkerType.ArrowClosed,
        width: 14,
        height: 14,
        color: '#64748b',
      },
      data: {
        styleVariant: e.styleVariant,
      },
    }));

    return { rawNodes: flowNodes, rawEdges: flowEdges };
  }, [selectedVersion]);

  // Recalculate Dagre layout whenever nodes/edges change or version toggles
  useEffect(() => {
    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
      rawNodes,
      rawEdges,
      'TB'
    );
    setNodes(layoutedNodes);
    setEdges(layoutedEdges);

    const timer = setTimeout(() => {
      if (rfInstanceRef.current) {
        rfInstanceRef.current.fitView({ padding: 0.15, duration: 400 });
      }
    }, 50);

    return () => clearTimeout(timer);
  }, [rawNodes, rawEdges, setNodes, setEdges]);

  // When selectedNodeId changes, center on it if found
  useEffect(() => {
    if (selectedNodeId && rfInstanceRef.current) {
      const node = nodes.find((n) => n.id === selectedNodeId);
      if (node && node.position) {
        rfInstanceRef.current.setCenter(
          node.position.x + 150,
          node.position.y + 70,
          { zoom: 1.1, duration: 600 }
        );
      }
    }
  }, [selectedNodeId, nodes]);

  const [isArranging, setIsArranging] = useState(false);
  const [justArranged, setJustArranged] = useState(false);

  const handleAutoArrange = useCallback(() => {
    setIsArranging(true);

    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
      rawNodes,
      rawEdges,
      'TB'
    );
    setNodes(layoutedNodes);
    setEdges(layoutedEdges);

    if (rfInstanceRef.current) {
      rfInstanceRef.current.fitView({ padding: 0.15, duration: 550 });
    }

    setTimeout(() => {
      setIsArranging(false);
      setJustArranged(true);
      setTimeout(() => setJustArranged(false), 1600);
    }, 550);
  }, [rawNodes, rawEdges, setNodes, setEdges]);

  // Global Escape & Alt+A listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedNodeId(null);
        setSelectedEdgeId(null);
        setIsStatsModalOpen(false);
        setFilterStatus(null);
        setSelectedPlatformFilter(null);
      }
      if (e.altKey && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        handleAutoArrange();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setSelectedNodeId, setSelectedEdgeId, setIsStatsModalOpen, setFilterStatus, setSelectedPlatformFilter, handleAutoArrange]);

  // Active edge details for floating banner
  const selectedEdgeDetails = useMemo(() => {
    if (!selectedEdgeId) return null;
    const edge = rawEdges.find((e) => e.id === selectedEdgeId);
    if (!edge) return null;
    const sourceNode = PIPELINE_NODES.find((n) => n.id === edge.source);
    const targetNode = PIPELINE_NODES.find((n) => n.id === edge.target);
    return {
      edge,
      sourceNode,
      targetNode,
    };
  }, [selectedEdgeId, rawEdges]);

  return (
    <div className={`w-full h-full relative bg-[#0b0d14] ${isArranging ? 'auto-arranging' : ''}`}>
      {/* Floating Canvas Action Bar (System Environment Filter & Auto-Arrange) */}
      <div className="absolute top-3.5 right-4 z-20 flex items-center gap-2 flex-wrap justify-end">
        {/* System Environment Segmented Control */}
        <div className="flex items-center p-1 rounded-xl bg-[#141826]/90 border border-border backdrop-blur-md shadow-xl text-xs">
          <button
            onClick={() => setSelectedPlatformFilter(null)}
            className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
              !selectedPlatformFilter
                ? 'bg-white/15 text-white font-bold'
                : 'text-dim hover:text-white'
            }`}
          >
            All Systems
          </button>
          <button
            onClick={() =>
              setSelectedPlatformFilter(
                selectedPlatformFilter === 'inside_databricks' ? null : 'inside_databricks'
              )
            }
            className={`px-2.5 py-1 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
              selectedPlatformFilter === 'inside_databricks'
                ? 'bg-sky-500/25 text-sky-300 font-bold border border-sky-400/40 shadow-sm'
                : 'text-dim hover:text-sky-300'
            }`}
            title="Filter to components sitting inside Databricks & Unity Catalog"
          >
            <Server size={12} className="text-sky-400" />
            <span>Databricks / UC</span>
          </button>
          <button
            onClick={() =>
              setSelectedPlatformFilter(
                selectedPlatformFilter === 'outside_databricks' ? null : 'outside_databricks'
              )
            }
            className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
              selectedPlatformFilter === 'outside_databricks'
                ? 'bg-slate-500/25 text-slate-200 font-bold border border-slate-400/40 shadow-sm'
                : 'text-dim hover:text-white'
            }`}
            title="Filter components outside Databricks (ADF, DataHub, Power BI, Git)"
          >
            Outside
          </button>
          <button
            onClick={() =>
              setSelectedPlatformFilter(
                selectedPlatformFilter === 'home_undecided' ? null : 'home_undecided'
              )
            }
            className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
              selectedPlatformFilter === 'home_undecided'
                ? 'bg-amber-500/25 text-amber-300 font-bold border border-amber-400/40 shadow-sm'
                : 'text-dim hover:text-amber-300'
            }`}
            title="Filter components with home undecided (Lifecycle capability gaps)"
          >
            Undecided
          </button>
        </div>

        {/* Floating Auto-Arrange Button on Canvas */}
        <button
          onClick={handleAutoArrange}
          disabled={isArranging}
          className={`px-3 py-1.5 rounded-xl border backdrop-blur-md text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xl select-none group ${
            justArranged
              ? 'bg-status-ok/20 text-status-ok border-status-ok/40 scale-105'
              : 'bg-[#141826]/90 hover:bg-[#1c233a] text-white border-border hover:border-blue-400/40 hover:scale-105 active:scale-95'
          }`}
          title="Auto-arrange graph nodes into clean hierarchical layout (Alt+A)"
        >
          {justArranged ? (
            <>
              <Check size={13} className="text-status-ok" />
              <span>Arranged!</span>
            </>
          ) : (
            <>
              <LayoutGrid
                size={13}
                className={`text-blue-400 transition-transform duration-300 ${
                  isArranging ? 'animate-spin' : 'group-hover:rotate-90'
                }`}
              />
              <span>{isArranging ? 'Arranging...' : 'Auto-Arrange'}</span>
            </>
          )}
        </button>
      </div>

      {/* Floating Active Platform Filter Banner */}
      {selectedPlatformFilter && !selectedEdgeDetails && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2.5 bg-[#121624]/95 backdrop-blur-md px-4 py-2 rounded-2xl border border-sky-500/40 shadow-2xl text-xs text-white animate-in fade-in slide-in-from-top-3 max-w-[90vw]">
          <div className="flex items-center gap-1.5 text-sky-400 font-bold text-[11px] uppercase tracking-wider">
            <Server size={13} className="text-sky-400 animate-pulse" />
            <span>Platform View</span>
          </div>
          <div className="h-3.5 w-px bg-border"></div>
          <span className="px-2.5 py-0.5 rounded-full bg-sky-500/20 text-sky-300 font-semibold text-[11px] border border-sky-500/30">
            {selectedPlatformFilter === 'inside_databricks'
              ? 'Inside Databricks & Unity Catalog Platform Boundary'
              : selectedPlatformFilter === 'unity_catalog'
              ? 'Unity Catalog Metastore & Access Layer'
              : selectedPlatformFilter === 'outside_databricks'
              ? 'Outside Databricks (ADF, DataHub, Power BI, Git)'
              : selectedPlatformFilter === 'home_undecided'
              ? 'Home Undecided (Lifecycle Capability Gaps)'
              : selectedPlatformFilter}
          </span>
          <button
            onClick={() => setSelectedPlatformFilter(null)}
            className="p-1 hover:bg-white/10 rounded-full text-dim hover:text-white transition-colors ml-1"
            title="Clear platform filter (Esc)"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Floating Lineage Connection Banner */}
      {selectedEdgeDetails && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2.5 bg-[#121624]/95 backdrop-blur-md px-4 py-2 rounded-2xl border border-blue-500/40 shadow-2xl text-xs text-white animate-in fade-in slide-in-from-top-3 max-w-[90vw]">
          <div className="flex items-center gap-1.5 text-blue-400 font-bold text-[11px] uppercase tracking-wider">
            <Link2 size={13} className="text-blue-400 animate-pulse" />
            <span>Lineage Connection</span>
          </div>
          <div className="h-3.5 w-px bg-border"></div>
          <button
            onClick={() => {
              if (selectedEdgeDetails.sourceNode) {
                setSelectedNodeId(selectedEdgeDetails.sourceNode.id);
              }
            }}
            className="px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-300 font-semibold hover:bg-blue-500/30 transition-colors truncate max-w-[180px]"
            title="Click to inspect Source node in detail panel"
          >
            {selectedEdgeDetails.sourceNode?.baseTitle || selectedEdgeDetails.edge.source}
          </button>
          <ArrowRight size={13} className="text-dim shrink-0" />
          <button
            onClick={() => {
              if (selectedEdgeDetails.targetNode) {
                setSelectedNodeId(selectedEdgeDetails.targetNode.id);
              }
            }}
            className="px-2 py-0.5 rounded-md bg-teal-500/20 text-teal-300 font-semibold hover:bg-teal-500/30 transition-colors truncate max-w-[180px]"
            title="Click to inspect Target node in detail panel"
          >
            {selectedEdgeDetails.targetNode?.baseTitle || selectedEdgeDetails.edge.target}
          </button>
          {selectedEdgeDetails.edge.label && (
            <span className="hidden md:inline-block px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[10.5px] text-mute font-mono truncate max-w-[200px]">
              {selectedEdgeDetails.edge.label}
            </span>
          )}
          <button
            onClick={() => setSelectedEdgeId(null)}
            className="p-1 hover:bg-white/10 rounded-full text-dim hover:text-white transition-colors ml-1"
            title="Clear lineage selection (Esc)"
          >
            <X size={14} />
          </button>
        </div>
      )}

      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onEdgeClick={(_, edge) => setSelectedEdgeId(edge.id)}
        onInit={(instance) => {
          rfInstanceRef.current = instance;
        }}
        onPaneClick={() => {
          setSelectedNodeId(null);
          setSelectedEdgeId(null);
          setIsStatsModalOpen(false);
          setFilterStatus(null);
          setSelectedPlatformFilter(null);
        }}
        minZoom={0.2}
        maxZoom={2}
        fitView
        proOptions={{ hideAttribution: true }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1}
          color="rgba(255, 255, 255, 0.08)"
        />
        <ZoneBoundariesLayer nodes={nodes} />
        <Controls
          className="!bg-[#141826] !border-border !rounded-xl !overflow-hidden !shadow-xl [&>button]:!border-border [&>button]:!fill-white [&>button:hover]:!bg-white/10"
        >
          <ControlButton
            onClick={handleAutoArrange}
            title="Auto-arrange layout (Alt+A)"
            aria-label="Auto-arrange layout"
          >
            <LayoutGrid size={14} className={isArranging ? 'animate-spin text-blue-400' : 'text-slate-200'} />
          </ControlButton>
        </Controls>
        <MiniMap
          nodeColor={(node) => {
            const pNode = node.data as any;
            const content = resolveContent(pNode, selectedVersion);
            switch (content.status) {
              case 'ok':
                return '#5cb87a';
              case 'partial':
                return '#e8b25e';
              case 'missing':
                return '#e8756a';
              case 'unknown':
                return '#a08ae0';
              default:
                return '#334155';
            }
          }}
          maskColor="rgba(11, 13, 20, 0.75)"
          className="!bg-[#141826] !border-border !rounded-xl !overflow-hidden !shadow-2xl"
          zoomable
          pannable
        />
      </ReactFlow>
    </div>
  );
};
