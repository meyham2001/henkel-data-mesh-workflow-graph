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

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, {
      width: node.measured?.width || NODE_WIDTH,
      height: node.measured?.height || NODE_HEIGHT,
    });
  });

  edges.forEach((edge) => {
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
    // Cross-cutting governance links (x-uc, x-dh, x-git, x-gov)
    else if (edge.source.startsWith('x-')) {
      weight = 1;
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

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    const width = node.measured?.width || NODE_WIDTH;
    const height = node.measured?.height || NODE_HEIGHT;

    return {
      ...node,
      position: {
        x: Math.round(nodeWithPosition.x - width / 2),
        y: Math.round(nodeWithPosition.y - height / 2),
      },
    };
  });

  return { nodes: layoutedNodes, edges };
}
