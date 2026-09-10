import { describe, it, expect } from 'vitest';
import { VERSIONS } from '../src/data/versions';
import { PIPELINE_NODES } from '../src/data/nodes';
import { PIPELINE_EDGES } from '../src/data/edges';
import { validateContinuity } from '../src/data/validateContinuity';

describe('Graph Continuity Validation', () => {
  VERSIONS.forEach((ver) => {
    it(`validates continuity for version: ${ver.id} (${ver.label})`, () => {
      const problems = validateContinuity(PIPELINE_NODES, PIPELINE_EDGES, ver.id);
      expect(problems).toEqual([]);
    });
  });

  it('detects broken continuity when a required node is intentionally made invisible', () => {
    // Intentionally break: hide s3 in option1
    const brokenNodes = PIPELINE_NODES.map((n) => {
      if (n.id === 's3') {
        return {
          ...n,
          versions: {
            ...n.versions,
            option1: {
              status: 'missing' as const,
              visible: false,
              description: 'Hidden broken stage',
            },
          },
        };
      }
      return n;
    });

    const problems = validateContinuity(brokenNodes, PIPELINE_EDGES, 'option1');
    expect(problems.length).toBeGreaterThan(0);
    expect(problems.some((p) => p.includes('invisible target: "s3"') || p.includes('invisible source: "s3"'))).toBe(true);
  });
});
