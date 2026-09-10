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

  // 3. Position cross-cutting governance entities in a dedicated lane on the right
  // This completely prevents them from intersecting or overlapping the Databricks Zone 2 boundary
  const governanceLaneX = Math.round(maxPipelineRight + 95);

  const crossCuttingYAnchorMap: Record<string, string> = {
    'x-uc': 's2',   // Unity Catalog aligns with Stage 2 Raw
    'x-git': 's5',  // Git aligns with Stage 5 Curated
    'x-dh': 's8',   // DataHub aligns with Stage 8 Discovery
    'x-gov': 's9',  // Governance function aligns with Stage 9 Access
  };

  const layoutedNodes = nodes.map((node) => {
    if (node.id.startsWith('x-')) {
      const anchorId = crossCuttingYAnchorMap[node.id];
      const anchorPos = anchorId ? layoutedPipelineMap.get(anchorId) : null;
      const y = anchorPos ? anchorPos.y : 200;

      return {
        ...node,
        position: {
          x: governanceLaneX,
          y,
        },
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
