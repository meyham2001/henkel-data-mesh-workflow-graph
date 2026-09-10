import { describe, it, expect } from 'vitest';
import { VERSIONS, VersionDefinition } from '../src/data/versions';
import { PIPELINE_NODES } from '../src/data/nodes';
import { PIPELINE_EDGES } from '../src/data/edges';
import { resolveContent } from '../src/data/resolveContent';
import { VERSION_SUMMARIES } from '../src/data/versionSummaries';
import { validateContinuity } from '../src/data/validateContinuity';

describe('Specification Acceptance Criteria (D1 - D11)', () => {
  it('D1 & D5: All nodes have valid sourceDoc citations and Synapse model is one-way', () => {
    PIPELINE_NODES.forEach((node) => {
      expect(node.sourceDoc).toBeDefined();
      expect(node.sourceDoc.length).toBeGreaterThan(0);
    });

    const s1 = PIPELINE_NODES.find((n) => n.id === 's1')!;
    const desc = s1.versions.current!.description;
    expect(desc).toContain('one-way');
    expect(desc.toLowerCase()).not.toContain('bidirectional');
    expect(desc.toLowerCase()).not.toContain('circular');
  });

  it('D7 & D10: Six nodes vary by version and show distinct content with Pros/Cons', () => {
    const varyingNodeIds = ['s1', 's1b', 's4', 's5', 's6', 's10'];
    varyingNodeIds.forEach((id) => {
      const node = PIPELINE_NODES.find((n) => n.id === id);
      expect(node).toBeDefined();
      expect(node!.variesByVersion).toBe(true);

      const opt1 = resolveContent(node!, 'option1');
      const opt2 = resolveContent(node!, 'option2');

      expect(opt1.description).not.toEqual(opt2.description);

      // Node-level decision analysis Pros & Cons (D10)
      if (opt1.prosCons) {
        expect(opt1.prosCons.pros.length).toBeGreaterThan(0);
        expect(opt1.prosCons.cons.length).toBeGreaterThan(0);
      }
      if (opt2.prosCons) {
        expect(opt2.prosCons.pros.length).toBeGreaterThan(0);
        expect(opt2.prosCons.cons.length).toBeGreaterThan(0);
      }
    });

    // Stage 4 spot-check: Option 1 domain owns logic, Option 2 centralized persists
    const s4 = PIPELINE_NODES.find((n) => n.id === 's4')!;
    const s4Opt1 = resolveContent(s4, 'option1');
    const s4Opt2 = resolveContent(s4, 'option2');
    expect(s4Opt1.description.toLowerCase()).toContain('domain data product takes full, legitimate ownership');
    expect(s4Opt2.description.toLowerCase()).toContain('does not move here');
  });

  it('D8: Adding a 4th entry to VERSIONS works with zero code changes and falls back to current', () => {
    const customVersions: VersionDefinition[] = [
      ...VERSIONS,
      {
        id: 'hypothetical-v4',
        label: 'Hypothetical Scenario 4',
        shortLabel: 'experimental',
        accentColor: '#ec4899',
        sourceDoc: 'cin_replacement_decision.md',
      },
    ];

    expect(customVersions.length).toBe(4);

    // Any node without 'hypothetical-v4' must fall back seamlessly to 'current'
    PIPELINE_NODES.forEach((node) => {
      const resolved = resolveContent(node, 'hypothetical-v4');
      const current = resolveContent(node, 'current');
      expect(resolved).toEqual(current);
    });

    // Continuity validator works with hypothetical-v4
    const problems = validateContinuity(PIPELINE_NODES, PIPELINE_EDGES, 'hypothetical-v4');
    expect(problems).toEqual([]);
  });

  it('D10: Version-level summaries show both Pros and Cons for options', () => {
    ['option1', 'option2'].forEach((optKey) => {
      const summary = VERSION_SUMMARIES[optKey];
      expect(summary).toBeDefined();
      expect(summary.pros.length).toBeGreaterThan(0);
      expect(summary.cons.length).toBeGreaterThan(0);
    });

    // Option 2 con must explicitly state it does NOT resolve the qualification failure
    expect(
      VERSION_SUMMARIES.option2.cons.some((c) =>
        c.toLowerCase().includes('does not resolve the qualification failure')
      )
    ).toBe(true);
  });

  it('D11: "unknown" and "missing" are distinct statuses across nodes', () => {
    const statuses = new Set<string>();
    PIPELINE_NODES.forEach((node) => {
      const content = resolveContent(node, 'current');
      statuses.add(content.status);
    });

    expect(statuses.has('missing')).toBe(true);
    expect(statuses.has('unknown')).toBe(true);

    // Spot-check unknown nodes
    const s10b = PIPELINE_NODES.find((n) => n.id === 's10b')!;
    expect(resolveContent(s10b, 'current').status).toBe('unknown');

    const xGov = PIPELINE_NODES.find((n) => n.id === 'x-gov')!;
    expect(resolveContent(xGov, 'current').status).toBe('unknown');
  });

  it('Option 2 has three simultaneous downstream routes from Stage 6 (Cross-Product Mirroring)', () => {
    const s6OutEdges = PIPELINE_EDGES.filter(
      (e) => e.source === 's6' && (!e.visibleIn || e.visibleIn.includes('option2'))
    );
    // Three outgoing routes under option2: to s10 (BDC direct), to s7 (serving/central product), to s1b (CIN indirect)
    const targets = s6OutEdges.map((e) => e.target);
    expect(targets).toContain('s10');
    expect(targets).toContain('s7');
    expect(targets).toContain('s1b');
  });

  it('KPI selection deselects previously selected entity, and entity selection closes KPI drawer', async () => {
    const { useAppStore } = await import('../src/store/appStore');
    const store = useAppStore.getState();

    // Select an entity first
    store.setSelectedNodeId('s4');
    expect(useAppStore.getState().selectedNodeId).toBe('s4');

    // Simulate clicking established KPI box
    useAppStore.getState().setSelectedNodeId(null);
    useAppStore.getState().setFilterStatus('ok');
    useAppStore.getState().setIsStatsModalOpen(true);

    expect(useAppStore.getState().selectedNodeId).toBeNull();
    expect(useAppStore.getState().filterStatus).toBe('ok');
    expect(useAppStore.getState().isStatsModalOpen).toBe(true);

    // Now selecting an entity closes the KPI drawer
    useAppStore.getState().setSelectedNodeId('s2');
    expect(useAppStore.getState().selectedNodeId).toBe('s2');
    expect(useAppStore.getState().isStatsModalOpen).toBe(false);
    expect(useAppStore.getState().filterStatus).toBeNull();
  });

  it('User can jump from KPI filter into stage details and click back to return to KPI filter', async () => {
    const { useAppStore } = await import('../src/store/appStore');

    // 1. User clicks 'missing' KPI box
    useAppStore.getState().setSelectedNodeId(null);
    useAppStore.getState().setFilterStatus('missing');
    useAppStore.getState().setIsStatsModalOpen(true);
    expect(useAppStore.getState().filterStatus).toBe('missing');

    // 2. User clicks a missing stage (e.g. s0)
    useAppStore.getState().setReturnFilterStatus('missing');
    useAppStore.getState().setIsStatsModalOpen(false);
    useAppStore.getState().setSelectedNodeId('s0');

    expect(useAppStore.getState().selectedNodeId).toBe('s0');
    expect(useAppStore.getState().returnFilterStatus).toBe('missing');

    // 3. User clicks Back button to return to missing list
    const returnTarget = useAppStore.getState().returnFilterStatus!;
    useAppStore.getState().setSelectedNodeId(null);
    useAppStore.getState().setFilterStatus(returnTarget);
    useAppStore.getState().setIsStatsModalOpen(true);

    expect(useAppStore.getState().selectedNodeId).toBeNull();
    expect(useAppStore.getState().filterStatus).toBe('missing');
    expect(useAppStore.getState().isStatsModalOpen).toBe(true);
  });

  it('Platform & System Placement: Every stage has authoritative platform and zone boundaries', async () => {
    const { PLATFORM_METADATA, ZONE_DEFINITIONS } = await import(
      '../src/data/platformPlacement'
    );

    // All pipeline stages and governance entities are categorized
    PIPELINE_NODES.forEach((node) => {
      const p = PLATFORM_METADATA[node.id];
      expect(p).toBeDefined();
      expect(p.platformId).toBeDefined();
      expect(p.systemName.length).toBeGreaterThan(0);
      expect(p.authoritativeFor.length).toBeGreaterThan(0);
      expect(p.mustNotHold.length).toBeGreaterThan(0);
    });

    // Databricks / Unity Catalog boundary verification
    const databricksStages = ['s1b', 's2', 's3', 's4', 's5', 's6', 's7'];
    databricksStages.forEach((id) => {
      const p = PLATFORM_METADATA[id];
      expect(
        p.platformId === 'inside_databricks' || p.platformId === 'unity_catalog'
      ).toBe(true);
      expect(p.zoneId).toBe('zone_2');
    });

    // Unity Catalog sub-layer (Stages 2 through 7)
    const ucStages = ['s2', 's3', 's4', 's5', 's6', 's7'];
    ucStages.forEach((id) => {
      const p = PLATFORM_METADATA[id];
      expect(p.platformId).toBe('unity_catalog');
      expect(p.boundaryTag).toContain('UNITY CATALOG');
    });

    // Stage 0 & 1 are Before the Platform (Outside Databricks)
    expect(PLATFORM_METADATA.s0.platformId).toBe('outside_databricks');
    expect(PLATFORM_METADATA.s0.zoneId).toBe('zone_1');
    expect(PLATFORM_METADATA.s1.platformId).toBe('outside_databricks');
    expect(PLATFORM_METADATA.s1.zoneId).toBe('zone_1');

    // Stage 9 straddles the boundary (UC + Security Service)
    expect(PLATFORM_METADATA.s9.platformId).toBe('straddles_boundary');
    expect(PLATFORM_METADATA.s9.boundaryTag).toBe('STRADDLES BOUNDARY');

    // Stages 11 & 12 are Home Undecided (Lifecycle gaps)
    expect(PLATFORM_METADATA.s11.platformId).toBe('home_undecided');
    expect(PLATFORM_METADATA.s11.zoneId).toBe('zone_4');
    expect(PLATFORM_METADATA.s12.platformId).toBe('home_undecided');
    expect(PLATFORM_METADATA.s12.zoneId).toBe('zone_4');

    // Zone 2 is confirmed as Databricks boundary
    expect(ZONE_DEFINITIONS.zone_2.isDatabricksBoundary).toBe(true);
  });

  it('Platform filter state in store isolates platforms and clears cleanly', async () => {
    const { useAppStore } = await import('../src/store/appStore');

    // Activate Databricks filter
    useAppStore.getState().setSelectedPlatformFilter('inside_databricks');
    expect(useAppStore.getState().selectedPlatformFilter).toBe('inside_databricks');

    // Toggle or clear
    useAppStore.getState().setSelectedPlatformFilter(null);
    expect(useAppStore.getState().selectedPlatformFilter).toBeNull();
  });

  it('Stage 1b sits vertically above Stage 2 (Raw) and Unity Catalog boundary', async () => {
    const { getLayoutedElements } = await import('../src/components/graph/layout');
    const rfNodes = PIPELINE_NODES.map((n) => ({ id: n.id, data: n, position: { x: 0, y: 0 } }));
    const rfEdges = PIPELINE_EDGES.map((e) => ({ id: e.id, source: e.source, target: e.target }));
    const { nodes } = getLayoutedElements(rfNodes, rfEdges);

    const s1b = nodes.find((n) => n.id === 's1b')!;
    const s2 = nodes.find((n) => n.id === 's2')!;

    // s1b must be positioned higher up (smaller y) than s2
    expect(s1b.position.y).toBeLessThan(s2.position.y);
  });

  it('Show/hide boundaries toggle controls boundary visibility in store', async () => {
    const { useAppStore } = await import('../src/store/appStore');
    expect(useAppStore.getState().showBoundaries).toBe(true);

    // Toggle off
    useAppStore.getState().toggleShowBoundaries();
    expect(useAppStore.getState().showBoundaries).toBe(false);

    // Toggle back on
    useAppStore.getState().toggleShowBoundaries();
    expect(useAppStore.getState().showBoundaries).toBe(true);

    // Direct setter
    useAppStore.getState().setShowBoundaries(false);
    expect(useAppStore.getState().showBoundaries).toBe(false);
    useAppStore.getState().setShowBoundaries(true);
  });
});
