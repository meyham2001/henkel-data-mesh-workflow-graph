import { PipelineNode, LineageEdge } from './schema';
import { resolveContent } from './resolveContent';

/**
 * Validates graph continuity for a given version.
 * Requirements:
 * 1. Every visible edge's source and target must be visible.
 * 2. Stage 1 (s1) must reach Stage 10 (s10) via at least one path of visible edges.
 * 3. No visible pipeline node is orphaned (isolated with 0 edges).
 */
export function validateContinuity(
  nodes: PipelineNode[],
  edges: LineageEdge[],
  versionId: string
): string[] {
  const problems: string[] = [];

  // Filter visible nodes in this version
  const visibleNodes = nodes.filter((n) => {
    const content = resolveContent(n, versionId);
    return content.visible !== false;
  });
  const visibleNodeIds = new Set(visibleNodes.map((n) => n.id));

  // Filter visible edges in this version
  const visibleEdges = edges.filter(
    (e) => !e.visibleIn || e.visibleIn.includes(versionId)
  );

  // 1. Every edge's source and target must both be visible in this version
  for (const edge of visibleEdges) {
    if (!visibleNodeIds.has(edge.source)) {
      problems.push(
        `Edge ${edge.id} has invisible source: "${edge.source}" in version "${versionId}"`
      );
    }
    if (!visibleNodeIds.has(edge.target)) {
      problems.push(
        `Edge ${edge.id} has invisible target: "${edge.target}" in version "${versionId}"`
      );
    }
  }

  // 2. Stage 1 (s1) can reach Stage 10 (s10) via at least one path of visible edges
  const adj = new Map<string, string[]>();
  for (const e of visibleEdges) {
    if (visibleNodeIds.has(e.source) && visibleNodeIds.has(e.target)) {
      const list = adj.get(e.source) || [];
      list.push(e.target);
      adj.set(e.source, list);
    }
  }

  const visitedFromS1 = new Set<string>();
  const queue = ['s1'];
  visitedFromS1.add('s1');

  while (queue.length > 0) {
    const curr = queue.shift()!;
    const neighbors = adj.get(curr) || [];
    for (const nxt of neighbors) {
      if (!visitedFromS1.has(nxt)) {
        visitedFromS1.add(nxt);
        queue.push(nxt);
      }
    }
  }

  if (!visitedFromS1.has('s10')) {
    problems.push(
      `Stage 1 (s1) cannot reach Stage 10 (s10) in version "${versionId}". No connected path exists.`
    );
  }

  // 3. No visible pipeline stage is completely disconnected (orphaned)
  const connectedNodes = new Set<string>();
  for (const e of visibleEdges) {
    if (visibleNodeIds.has(e.source) && visibleNodeIds.has(e.target)) {
      connectedNodes.add(e.source);
      connectedNodes.add(e.target);
    }
  }

  for (const node of visibleNodes) {
    // Cross-cutting nodes or stages
    if (!connectedNodes.has(node.id)) {
      problems.push(
        `Node "${node.id}" (${node.baseTitle}) is visible but has 0 connected edges in version "${versionId}".`
      );
    }
  }

  return problems;
}
