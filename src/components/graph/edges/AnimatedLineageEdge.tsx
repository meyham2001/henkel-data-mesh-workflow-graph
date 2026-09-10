import React, { memo } from 'react';
import { EdgeProps, getBezierPath, EdgeLabelRenderer, BaseEdge } from '@xyflow/react';
import { useAppStore } from '../../../store/appStore';
import { useConnectedLineage } from '../../../hooks/useConnectedLineage';

export const AnimatedLineageEdge: React.FC<EdgeProps> = memo(({
  id,
  source,
  target,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  label,
  data,
  markerEnd,
}) => {
  const { selectedNodeId, selectedEdgeId, setSelectedEdgeId } = useAppStore();
  const connectedLineage = useConnectedLineage();

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const isDirectlySelected = selectedEdgeId === id;
  const isConnectedLineageEdge = connectedLineage?.connectedEdgeIds.has(id) ?? false;
  const isDimmedByEdge = selectedEdgeId !== null && !isDirectlySelected && !isConnectedLineageEdge;

  const isUpstream = selectedNodeId === target;
  const isDownstream = selectedNodeId === source;
  const isHighlighted = isDirectlySelected || isConnectedLineageEdge || isUpstream || isDownstream;

  const styleVariant = data?.styleVariant as string | undefined;

  let strokeColor = '#3e465e';
  let strokeWidth = 1.5;
  let isAnimated = false;
  let strokeDasharray: string | undefined = undefined;
  let edgeOpacity = 1;

  if (isDirectlySelected) {
    strokeColor = '#38bdf8'; // Bright cyan selected edge
    strokeWidth = 3.5;
    isAnimated = true;
    strokeDasharray = '6 3';
  } else if (isConnectedLineageEdge) {
    strokeColor = '#60a5fa'; // Bright blue connected path edge
    strokeWidth = 2.5;
    isAnimated = true;
    strokeDasharray = '4 4';
  } else if (isDimmedByEdge) {
    strokeColor = '#1e2436'; // Dimmed edge
    strokeWidth = 1;
    edgeOpacity = 0.2;
  } else if (isDownstream) {
    strokeColor = '#5cc9b0'; // Teal downstream
    strokeWidth = 2.5;
    isAnimated = true;
  } else if (isUpstream) {
    strokeColor = '#6aa9e8'; // Blue upstream
    strokeWidth = 2.5;
    isAnimated = true;
  } else if (styleVariant === 'bdc') {
    strokeColor = '#7bc17b';
    strokeDasharray = '5 5';
    strokeWidth = 2;
  } else if (styleVariant === 'loop') {
    strokeColor = '#e8b25e';
    strokeDasharray = '4 4';
    strokeWidth = 2;
  } else if (styleVariant === 'dashed') {
    strokeDasharray = '4 4';
    strokeColor = '#4a5578';
  }

  const handleEdgeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedEdgeId(id);
  };

  return (
    <>
      {/* Invisible wide stroke for easy clicking */}
      <path
        d={edgePath}
        fill="none"
        stroke="transparent"
        strokeWidth={28}
        className="cursor-pointer"
        style={{ pointerEvents: 'stroke' }}
        onClick={handleEdgeClick}
      />

      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          stroke: strokeColor,
          strokeWidth,
          strokeDasharray,
          opacity: edgeOpacity,
          transition: 'stroke 0.2s, stroke-width 0.2s, opacity 0.2s',
        }}
        className={isAnimated ? 'animate-pulse' : ''}
      />

      {label && (
        <EdgeLabelRenderer>
          <div
            onClick={handleEdgeClick}
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: 'all',
            }}
            className={`px-1.5 py-0.5 rounded text-[9.5px] font-medium tracking-tight border transition-all cursor-pointer select-none ${
              isDirectlySelected
                ? 'bg-blue-600 text-white border-blue-400 shadow-[0_0_12px_rgba(56,189,248,0.5)] scale-110'
                : isConnectedLineageEdge
                ? 'bg-[#1e293b] text-blue-200 border-blue-500/40 shadow-sm scale-105'
                : isHighlighted
                ? 'bg-[#181d2f] text-white border-white/30 shadow-md scale-105'
                : isDimmedByEdge
                ? 'bg-[#101422]/40 text-dim/30 border-border/20 opacity-30'
                : 'bg-[#101422]/90 text-dim/80 border-border hover:border-white/30 hover:text-white'
            }`}
          >
            {label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
});

AnimatedLineageEdge.displayName = 'AnimatedLineageEdge';
