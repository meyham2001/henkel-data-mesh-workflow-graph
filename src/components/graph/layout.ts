import dagre from '@dagrejs/dagre';
import { Node, Edge } from '@xyflow/react';

const NODE_WIDTH = 320;
const NODE_HEIGHT = 145;

export function getLayoutedElements(
  nodes: Node[],
  edges: Edge[],
  direction = 'TB'
): { nodes: Node[]; edges: Edge[] } {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));

  dagreGraph.setGraph({
    rankdir: direction,
    ranksep: 75,
    nodesep: 55,
    edgesep: 25,
    marginx: 50,
    marginy: 50,
  });

  // 1. Separate pipeline stages from cross-cutting governance entities
  const pipelineNodes = nodes.filter((n) => !n.id.startsWith('x-'));

  pipelineNodes.forEach((node) => {
    dagreGraph.setNode(node.id, {
      width: node.measured?.width || NODE_WIDTH,
      height: node.measured?.height || NODE_HEIGHT,
    });
  });

  edges.forEach((edge) => {
    // Skip cross-cutting edges in Dagre rank calculation so they don't skew the pipeline spine
    if (edge.source.startsWith('x-') || edge.target.startsWith('x-')) {
      return;
    }

    let weight = 5;
    let minlen = 1;

    // Feedback loops: s12 -> s0, s6 -> s4, Option 2 s6 -> s1b
    // Must NOT determine vertical ranks to keep stages strictly chronological
    if (
      edge.id === 'e-s12-s0' ||
      edge.id === 'e-s6-s4' ||
      edge.id === 'e-s6-s1b-cin'
    ) {
      weight = 0;
      minlen = 1;
    }
    // Primary linear spine: s0 -> s1 -> s1b -> s2 -> s3 -> s4 -> s5
    if (edge.id === 'e-s1-s1b' || edge.id === 'e-s1b-s2') {
      weight = 50;
      minlen = 1;
    }
    // Main linear pipeline spine stages (s0 -> s1 -> s1b/bdc -> s2 -> s3 -> s4 -> s5 -> s6 -> s7 -> s9 -> s10 -> s11 -> s12)
    else if (
      edge.source.startsWith('s') &&
      edge.target.startsWith('s') &&
      !edge.id.includes('s10b') &&
      !edge.id.includes('s8')
    ) {
      weight = 10;
      minlen = 1;
    }
    // ML Feature store branch (s10b) & Discovery branch (s8)
    else if (edge.target === 's10b' || edge.target === 's8') {
      weight = 3;
      minlen = 1;
    }

    dagreGraph.setEdge(edge.source, edge.target, { weight, minlen });
  });

  dagre.layout(dagreGraph);

  // 2. Map pipeline stages and find the maximum right edge of the pipeline
  let maxPipelineRight = -Infinity;
  const layoutedPipelineMap = new Map<string, { x: number; y: number }>();

  pipelineNodes.forEach((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    const width = node.measured?.width || NODE_WIDTH;
    const height = node.measured?.height || NODE_HEIGHT;
    const x = Math.round(nodeWithPosition.x - width / 2);
    const y = Math.round(nodeWithPosition.y - height / 2);

    layoutedPipelineMap.set(node.id, { x, y });
    if (x + width > maxPipelineRight) {
      maxPipelineRight = x + width;
    }
  });

  // 3. Position x-uc INSIDE Databricks next to Stage 2 (where UC schema governance begins)
  const s2Pos = layoutedPipelineMap.get('s2');
  const xUcPosition = s2Pos
    ? { x: Math.round(s2Pos.x + 360), y: s2Pos.y }
    : { x: Math.round(maxPipelineRight - 100), y: 350 };

  // Calculate the effective right boundary of Databricks (including x-uc)
  const databricksRight = Math.max(maxPipelineRight, xUcPosition.x + (s2Pos ? NODE_WIDTH : 0));

  // Position external governance entities (Git, DataHub, Governance Function) completely outside Databricks
  const externalLaneX = Math.round(databricksRight + 85);

  // Calculate distinct, non-overlapping Y positions for external nodes
  const MIN_EXTERNAL_GAP = 75; // Standard vertical gap between cards
  const externalPositions = new Map<string, { x: number; y: number }>();
  let lastOccupiedY = -Infinity;

  const externalOrder = ['x-git', 'x-dh', 'x-gov'];
  externalOrder.forEach((id) => {
    let idealY = 200;
    if (id === 'x-git') {
      idealY = layoutedPipelineMap.get('s5')?.y ?? 1500;
    } else if (id === 'x-dh') {
      // DataHub ingests technical lineage from Stage 8 (Data Discovery)
      idealY = layoutedPipelineMap.get('s8')?.y ?? 2250;
    } else if (id === 'x-gov') {
      // Governance function feeds Stage 9 (Access Authorisation).
      // Since Dagre places s8 and s9 at the same vertical rank (y = 2250),
      // anchor x-gov cleanly beside Stage 10 (Consumption) or below x-dh with clearance.
      const s10Pos = layoutedPipelineMap.get('s10');
      const s9Pos = layoutedPipelineMap.get('s9');
      idealY = s10Pos?.y ?? (s9Pos ? s9Pos.y + NODE_HEIGHT + MIN_EXTERNAL_GAP : 2470);
    }

    const effectiveY = Math.max(idealY, lastOccupiedY + NODE_HEIGHT + MIN_EXTERNAL_GAP);
    externalPositions.set(id, { x: externalLaneX, y: effectiveY });
    lastOccupiedY = effectiveY;
  });

  const layoutedNodes = nodes.map((node) => {
    if (node.id === 'x-uc') {
      return {
        ...node,
        position: xUcPosition,
      };
    }

    if (node.id.startsWith('x-')) {
      const pos = externalPositions.get(node.id) || { x: externalLaneX, y: 200 };
      return {
        ...node,
        position: pos,
      };
    }

    const pos = layoutedPipelineMap.get(node.id) || { x: 0, y: 0 };
    return {
      ...node,
      position: pos,
    };
  });

  return { nodes: layoutedNodes, edges };
}
