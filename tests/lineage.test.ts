import { describe, it, expect } from 'vitest';
import { PIPELINE_EDGES } from '../src/data/edges';
import { getConnectedLineage } from '../src/data/lineageUtils';

describe('Interactive Lineage Highlighting (getConnectedLineage)', () => {
  it('returns null for nonexistent edge', () => {
    const result = getConnectedLineage('invalid-edge-id', PIPELINE_EDGES);
    expect(result).toBeNull();
  });

  it('correctly identifies immediate source and target endpoints', () => {
    const lineage = getConnectedLineage('e-s4-s5', PIPELINE_EDGES);
    expect(lineage).not.toBeNull();
    expect(lineage!.sourceId).toBe('s4');
    expect(lineage!.targetId).toBe('s5');
    expect(lineage!.connectedNodeIds.has('s4')).toBe(true);
    expect(lineage!.connectedNodeIds.has('s5')).toBe(true);
    expect(lineage!.connectedEdgeIds.has('e-s4-s5')).toBe(true);
  });

  it('traverses upstream ancestors backwards to Intake (s0)', () => {
    const lineage = getConnectedLineage('e-s4-s5', PIPELINE_EDGES);
    expect(lineage).not.toBeNull();
    // s4 <- s3 <- s2 <- s1b <- s1 <- s0
    expect(lineage!.connectedNodeIds.has('s3')).toBe(true);
    expect(lineage!.connectedNodeIds.has('s2')).toBe(true);
    expect(lineage!.connectedNodeIds.has('s1b')).toBe(true);
    expect(lineage!.connectedNodeIds.has('s1')).toBe(true);
    expect(lineage!.connectedNodeIds.has('s0')).toBe(true);
  });

  it('traverses downstream descendants forwards to Lifecycle (s12)', () => {
    const lineage = getConnectedLineage('e-s4-s5', PIPELINE_EDGES);
    expect(lineage).not.toBeNull();
    // s5 -> s6, s7, s8 -> s10 -> s11 -> s12
    expect(lineage!.connectedNodeIds.has('s6')).toBe(true);
    expect(lineage!.connectedNodeIds.has('s7')).toBe(true);
    expect(lineage!.connectedNodeIds.has('s8')).toBe(true);
    expect(lineage!.connectedNodeIds.has('s10')).toBe(true);
    expect(lineage!.connectedNodeIds.has('s11')).toBe(true);
    expect(lineage!.connectedNodeIds.has('s12')).toBe(true);
  });

  it('handles feedback loop e-s12-s0 without infinite cycle', () => {
    const lineage = getConnectedLineage('e-s12-s0', PIPELINE_EDGES);
    expect(lineage).not.toBeNull();
    expect(lineage!.sourceId).toBe('s12');
    expect(lineage!.targetId).toBe('s0');
  });

  it('isolates cross-cutting governance links accurately', () => {
    // Unity Catalog to Raw link
    const lineage = getConnectedLineage('e-xuc-s2', PIPELINE_EDGES);
    expect(lineage).not.toBeNull();
    expect(lineage!.sourceId).toBe('x-uc');
    expect(lineage!.targetId).toBe('s2');

    // Downstream of s2 should be connected
    expect(lineage!.connectedNodeIds.has('s3')).toBe(true);
    expect(lineage!.connectedNodeIds.has('s4')).toBe(true);

    // Unrelated governance nodes should NOT be in the connected path
    expect(lineage!.connectedNodeIds.has('x-dh')).toBe(false);
  });
});
