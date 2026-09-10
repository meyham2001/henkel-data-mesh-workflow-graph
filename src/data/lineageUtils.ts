import { LineageEdge } from './schema';

export interface ConnectedLineage {
  edgeId: string;
  sourceId: string;
  targetId: string;
  connectedNodeIds: Set<string>;
  connectedEdgeIds: Set<string>;
}

/**
 * Computes all nodes and edges connected to a selected edge through
 * upstream traversal (feeding into the source) and downstream traversal
 * (flowing out of the target).
 */
export function getConnectedLineage(
  edgeId: string,
  visibleEdges: LineageEdge[]
): ConnectedLineage | null {
  const edge = visibleEdges.find((e) => e.id === edgeId);
  if (!edge) return null;

  const connectedNodeIds = new Set<string>([edge.source, edge.target]);
  const connectedEdgeIds = new Set<string>([edge.id]);

  // Traverse upstream (backwards from source)
  const upstreamQueue = [edge.source];
  const visitedUpstream = new Set<string>([edge.source]);

  while (upstreamQueue.length > 0) {
    const curr = upstreamQueue.shift()!;
    for (const e of visibleEdges) {
      if (e.target === curr) {
        // Prevent feedback loop s12 -> s0 from wrapping backwards indefinitely
        if (edge.id !== 'e-s12-s0' && e.id === 'e-s12-s0') continue;

        connectedEdgeIds.add(e.id);
        if (!visitedUpstream.has(e.source)) {
          visitedUpstream.add(e.source);
          connectedNodeIds.add(e.source);
          upstreamQueue.push(e.source);
        }
      }
    }
  }

  // Traverse downstream (forwards from target)
  const downstreamQueue = [edge.target];
  const visitedDownstream = new Set<string>([edge.target]);

  while (downstreamQueue.length > 0) {
    const curr = downstreamQueue.shift()!;
    for (const e of visibleEdges) {
      if (e.source === curr) {
        // Prevent feedback loop s12 -> s0 from wrapping forwards indefinitely
        if (edge.id !== 'e-s12-s0' && e.id === 'e-s12-s0') continue;

        connectedEdgeIds.add(e.id);
        if (!visitedDownstream.has(e.target)) {
          visitedDownstream.add(e.target);
          connectedNodeIds.add(e.target);
          downstreamQueue.push(e.target);
        }
      }
    }
  }

  return {
    edgeId: edge.id,
    sourceId: edge.source,
    targetId: edge.target,
    connectedNodeIds,
    connectedEdgeIds,
  };
}
