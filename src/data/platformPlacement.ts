export type PlatformPlacementId =
  | 'inside_databricks'
  | 'unity_catalog'
  | 'outside_databricks'
  | 'straddles_boundary'
  | 'home_undecided'
  | 'not_a_system';

export type ArchitectureZoneId =
  | 'cross_cutting'
  | 'zone_1'
  | 'zone_2'
  | 'zone_3'
  | 'zone_4';

export interface PlatformMetadata {
  platformId: PlatformPlacementId;
  systemName: string;
  zoneId: ArchitectureZoneId;
  zoneTitle: string;
  zoneSub: string;
  boundaryTag: string;
  badgeStyle: {
    bg: string;
    text: string;
    border: string;
  };
  authoritativeFor: string;
  mustNotHold: string;
  placementDetails: string;
}

export const PLATFORM_METADATA: Record<string, PlatformMetadata> = {
  s0: {
    platformId: 'outside_databricks',
    systemName: 'Business Domain & Azure DevOps',
    zoneId: 'zone_1',
    zoneTitle: 'Zone 1: Before the Platform',
    zoneSub: 'Business + ADF',
    boundaryTag: 'OUTSIDE DATABRICKS',
    badgeStyle: {
      bg: 'bg-slate-500/15',
      text: 'text-slate-300',
      border: 'border-slate-500/30',
    },
    authoritativeFor: 'Business owner, named consumer, required freshness SLA, and business justification',
    mustNotHold: 'Technical pipeline execution or physical storage',
    placementDetails:
      'Outside the platform. Captures the three human decisions that cannot be inferred from data (owner, named consumer, freshness SLA). Proposed operational home: Azure DevOps work item.',
  },
  s1: {
    platformId: 'outside_databricks',
    systemName: 'Azure Data Factory (ADF) + P47',
    zoneId: 'zone_1',
    zoneTitle: 'Zone 1: Before the Platform',
    zoneSub: 'Business + ADF',
    boundaryTag: 'OUTSIDE DATABRICKS',
    badgeStyle: {
      bg: 'bg-slate-500/15',
      text: 'text-slate-300',
      border: 'border-slate-500/30',
    },
    authoritativeFor: 'Ingestion orchestration & source system connectivity',
    mustNotHold: 'Business transformation or domain analytical logic',
    placementDetails:
      'Outside Databricks. Scheduled extraction from ~40 source systems. SAP is extracted via P47 (committed for 3 years), which feeds both Synapse and Databricks in parallel. Synapse feeds Databricks one-way.',
  },
  bdc: {
    platformId: 'inside_databricks',
    systemName: 'SAP Business Data Cloud (BDC) · Delta Share',
    zoneId: 'zone_2',
    zoneTitle: 'Zone 2: Databricks / Unity Catalog',
    zoneSub: 'DxD owns · zones 10–50',
    boundaryTag: 'INSIDE DATABRICKS',
    badgeStyle: {
      bg: 'bg-sky-500/20',
      text: 'text-sky-300',
      border: 'border-sky-500/40',
    },
    authoritativeFor: 'Direct SAP SaaS delivery via Delta (Open) Share',
    mustNotHold: 'Domain-specific analytical rules',
    placementDetails:
      'Delivers directly into Databricks via Delta/Open Share (BDC Connect) — not a custom-built extraction pipeline. P47 successor in Option 1 & 2 Phase 2.',
  },
  'bdc-node': {
    platformId: 'inside_databricks',
    systemName: 'SAP Business Data Cloud (BDC) · Delta Share',
    zoneId: 'zone_2',
    zoneTitle: 'Zone 2: Databricks / Unity Catalog',
    zoneSub: 'DxD owns · zones 10–50',
    boundaryTag: 'INSIDE DATABRICKS',
    badgeStyle: {
      bg: 'bg-sky-500/20',
      text: 'text-sky-300',
      border: 'border-sky-500/40',
    },
    authoritativeFor: 'Direct SAP SaaS delivery via Delta (Open) Share',
    mustNotHold: 'Domain-specific analytical rules',
    placementDetails:
      'Delivers directly into Databricks via Delta/Open Share (BDC Connect) — not a custom-built extraction pipeline. P47 successor in Option 1 & 2 Phase 2.',
  },
  s1b: {
    platformId: 'inside_databricks',
    systemName: 'Databricks Compute (Lakeflow / Warehouses)',
    zoneId: 'zone_2',
    zoneTitle: 'Zone 2: Databricks / Unity Catalog',
    zoneSub: 'DxD owns · zones 10–50',
    boundaryTag: 'INSIDE DATABRICKS',
    badgeStyle: {
      bg: 'bg-sky-500/20',
      text: 'text-sky-300',
      border: 'border-sky-500/40',
    },
    authoritativeFor: 'Central ingestion landing (provisional estate-wide Zone 10)',
    mustNotHold: 'Permanent domain analytical models or unowned central logic',
    placementDetails:
      'Sits inside Databricks compute, but outside Unity Catalog domain objects. Ingests all incoming data regardless of domain. Being restructured under Option 1 (distributed bypass) or Option 2 (thin CIN).',
  },
  s2: {
    platformId: 'unity_catalog',
    systemName: 'Databricks / Unity Catalog (Zone 10 Raw)',
    zoneId: 'zone_2',
    zoneTitle: 'Zone 2: Databricks / Unity Catalog',
    zoneSub: 'DxD owns · zones 10–50',
    boundaryTag: 'UNITY CATALOG',
    badgeStyle: {
      bg: 'bg-indigo-500/20',
      text: 'text-indigo-300',
      border: 'border-indigo-500/40',
    },
    authoritativeFor: 'Unmodified raw landing audit trail (byte-for-byte fidelity)',
    mustNotHold: 'Typing, renaming, filtering, or business rules',
    placementDetails:
      'Inside Unity Catalog. Schema: self_{module}_raw. Third-party vendor feeds quarantined in external_{module}_raw (Zone 15 External).',
  },
  s3: {
    platformId: 'unity_catalog',
    systemName: 'Databricks / Unity Catalog (Zone 20 Staging)',
    zoneId: 'zone_2',
    zoneTitle: 'Zone 2: Databricks / Unity Catalog',
    zoneSub: 'DxD owns · zones 10–50',
    boundaryTag: 'UNITY CATALOG',
    badgeStyle: {
      bg: 'bg-indigo-500/20',
      text: 'text-indigo-300',
      border: 'border-indigo-500/40',
    },
    authoritativeFor: 'Data typing, ISO conforming, and domain identifier qualification',
    mustNotHold: 'Business filtering or aggregation logic (record counting)',
    placementDetails:
      'Inside Unity Catalog. Schema: self_{module}_staging. Maps vendor columns to Henkel standards and prefixes IDs (e.g. customerID → mkt_lead_id).',
  },
  s4: {
    platformId: 'unity_catalog',
    systemName: 'Databricks / Unity Catalog (Zone 30 Enriched)',
    zoneId: 'zone_2',
    zoneTitle: 'Zone 2: Databricks / Unity Catalog',
    zoneSub: 'DxD owns · zones 10–50',
    boundaryTag: 'UNITY CATALOG',
    badgeStyle: {
      bg: 'bg-indigo-500/20',
      text: 'text-indigo-300',
      border: 'border-indigo-500/40',
    },
    authoritativeFor: 'Business transformation rules defined by business owner',
    mustNotHold: 'Direct cross-product table reads without source_ mirrors',
    placementDetails:
      'Inside Unity Catalog. Schema: self_{module}_enriched. Business logic applied; first joins to master and reference data via source_ mirrors.',
  },
  s5: {
    platformId: 'unity_catalog',
    systemName: 'Databricks / Unity Catalog (Zone 40 Curated)',
    zoneId: 'zone_2',
    zoneTitle: 'Zone 2: Databricks / Unity Catalog',
    zoneSub: 'DxD owns · zones 10–50',
    boundaryTag: 'UNITY CATALOG',
    badgeStyle: {
      bg: 'bg-indigo-500/20',
      text: 'text-indigo-300',
      border: 'border-indigo-500/40',
    },
    authoritativeFor: 'Certified published data contract view for consumption',
    mustNotHold: 'Internal staging tables or unvetted private schemas',
    placementDetails:
      'Inside Unity Catalog. Schema: shared_{module}_curated. The trust-boundary where data contracts are published and access grants issued.',
  },
  s6: {
    platformId: 'unity_catalog',
    systemName: 'Databricks / Unity Catalog (Mirroring Layer)',
    zoneId: 'zone_2',
    zoneTitle: 'Zone 2: Databricks / Unity Catalog',
    zoneSub: 'DxD owns · zones 10–50',
    boundaryTag: 'UNITY CATALOG',
    badgeStyle: {
      bg: 'bg-indigo-500/20',
      text: 'text-indigo-300',
      border: 'border-indigo-500/40',
    },
    authoritativeFor: 'Cross-product consumer mirror views across catalogs',
    mustNotHold: 'Direct writes into upstream producer catalogs',
    placementDetails:
      'Inside Unity Catalog. Schema: source_{producer}_{module}_curated. Consumer mirrors producer shared_ views into their own catalog.',
  },
  s7: {
    platformId: 'unity_catalog',
    systemName: 'Databricks / Unity Catalog + Azure SQL (Zone 50 Serving)',
    zoneId: 'zone_2',
    zoneTitle: 'Zone 2: Databricks / Unity Catalog',
    zoneSub: 'DxD owns · zones 10–50',
    boundaryTag: 'UNITY CATALOG + AZURE SQL',
    badgeStyle: {
      bg: 'bg-indigo-500/20',
      text: 'text-indigo-300',
      border: 'border-indigo-500/40',
    },
    authoritativeFor: 'Serving aggregations, access tiers, and analytical format conversion',
    mustNotHold: 'Raw or un-anonymized PII datasets',
    placementDetails:
      'Inside Unity Catalog with egress to Azure SQL. Sits at the Databricks boundary exit before handing off to discovery and consumption tools.',
  },
  s8: {
    platformId: 'outside_databricks',
    systemName: 'DataHub (Enterprise Catalog)',
    zoneId: 'zone_3',
    zoneTitle: 'Zone 3: Discovery, Access & Consumption',
    zoneSub: 'DataHub · security service · Power BI',
    boundaryTag: 'OUTSIDE DATABRICKS',
    badgeStyle: {
      bg: 'bg-amber-500/20',
      text: 'text-amber-300',
      border: 'border-amber-500/40',
    },
    authoritativeFor: 'Business glossary, certified business definitions, cross-platform discovery, aggregated lineage',
    mustNotHold: 'Access enforcement or data processing engine',
    placementDetails:
      'Outside Databricks. Enterprise search and governance portal. Ingests lineage from Unity Catalog but enforces nothing.',
  },
  s9: {
    platformId: 'straddles_boundary',
    systemName: 'UC Grants (Inside) + Security Service (Outside)',
    zoneId: 'zone_3',
    zoneTitle: 'Zone 3: Discovery, Access & Consumption',
    zoneSub: 'DataHub · security service · Power BI',
    boundaryTag: 'STRADDLES BOUNDARY',
    badgeStyle: {
      bg: 'bg-purple-500/25',
      text: 'text-purple-300',
      border: 'border-purple-500/40',
    },
    authoritativeFor: 'Internal catalog access grants (UC) and external frontend authentication (Security Service)',
    mustNotHold: 'Business metric definitions or analytical logic',
    placementDetails:
      'Straddles the platform boundary. Unity Catalog issues and enforces grants inside Databricks; the corporate security service gates frontend consumption outside it. This split makes authoritative classification tags essential.',
  },
  s10: {
    platformId: 'outside_databricks',
    systemName: 'Power BI & Custom Applications',
    zoneId: 'zone_3',
    zoneTitle: 'Zone 3: Discovery, Access & Consumption',
    zoneSub: 'DataHub · security service · Power BI',
    boundaryTag: 'OUTSIDE DATABRICKS',
    badgeStyle: {
      bg: 'bg-slate-500/15',
      text: 'text-slate-300',
      border: 'border-slate-500/30',
    },
    authoritativeFor: 'Presentation, visual reporting, and user interactive analytics',
    mustNotHold: 'Canonical metric definitions or core data transformations',
    placementDetails:
      'Outside Databricks. Consumes served datasets via DirectQuery or import mode. Synapse operates in parallel as an established legacy consumption alternative.',
  },
  s10b: {
    platformId: 'inside_databricks',
    systemName: 'Databricks ML Workspace (Zone 60)',
    zoneId: 'zone_3',
    zoneTitle: 'Zone 3: Discovery, Access & Consumption',
    zoneSub: 'DataHub · security service · Power BI · Data Science',
    boundaryTag: 'DATABRICKS · ZONE 60',
    badgeStyle: {
      bg: 'bg-sky-500/20',
      text: 'text-sky-300',
      border: 'border-sky-500/40',
    },
    authoritativeFor: 'Data science feature engineering, ML models, and predictive enrichments',
    mustNotHold: 'Unversioned or untagged production model endpoints',
    placementDetails:
      'Inside Databricks (Zone 60 Workspace). Sits in Zone 3 because data scientists consume served data products from Stage 5 & 7 and act as secondary producers of ML features/models. Positioned in the consumption layer rather than the core DxD production pipeline (Zones 10–50); governance status remains unconfirmed.',
  },
  s11: {
    platformId: 'home_undecided',
    systemName: 'Unassigned (Operational Tooling)',
    zoneId: 'zone_4',
    zoneTitle: 'Zone 4: Operate & Evolve',
    zoneSub: 'largest capability gap · ownership unassigned',
    boundaryTag: 'HOME UNDECIDED',
    badgeStyle: {
      bg: 'bg-amber-500/20',
      text: 'text-amber-300',
      border: 'border-amber-500/40 border-dashed',
    },
    authoritativeFor: 'Pipeline monitoring, freshness SLA verification, and automated alerting',
    mustNotHold: 'Manual break investigation without alerting',
    placementDetails:
      'Home undecided. Naturally divides into Databricks jobs (freshness checks inside), UC lineage for break analysis (inside), and Teams/ServiceNow alerts (outside). Currently unassigned and traced manually.',
  },
  s12: {
    platformId: 'home_undecided',
    systemName: 'Unassigned (Lifecycle & Governance)',
    zoneId: 'zone_4',
    zoneTitle: 'Zone 4: Operate & Evolve',
    zoneSub: 'largest capability gap · ownership unassigned',
    boundaryTag: 'HOME UNDECIDED',
    badgeStyle: {
      bg: 'bg-amber-500/20',
      text: 'text-amber-300',
      border: 'border-amber-500/40 border-dashed',
    },
    authoritativeFor: 'Breaking-change policies, consumer impact analysis, and product deprecation',
    mustNotHold: 'Silent breaking changes without contract version bumps',
    placementDetails:
      'Home undecided. Naturally divides into Git contract versioning (outside), UC lineage impact analysis (inside), and organizational retirement decisions. Currently no breaking-change policy exists.',
  },
  'x-uc': {
    platformId: 'unity_catalog',
    systemName: 'Databricks Unity Catalog',
    zoneId: 'zone_2',
    zoneTitle: 'Zone 2: Databricks / Unity Catalog',
    zoneSub: 'DxD owns · Metastore, Schemas & Access',
    boundaryTag: 'INSIDE DATABRICKS · METASTORE',
    badgeStyle: {
      bg: 'bg-indigo-500/20',
      text: 'text-indigo-300',
      border: 'border-indigo-500/40',
    },
    authoritativeFor: 'All data, transformation, access enforcement, and classification tags for enforcement',
    mustNotHold: 'Glossary or contract as system of record (stores no data itself)',
    placementDetails:
      'Inside Databricks. Unity Catalog is Databricks\' native metastore, schema, lineage, and access enforcement layer. Spans stages 2–9; issues grants at Stage 9 and produces lineage ingested by DataHub at Stage 8.',
  },
  'x-dh': {
    platformId: 'outside_databricks',
    systemName: 'DataHub (Enterprise Catalog)',
    zoneId: 'cross_cutting',
    zoneTitle: 'Cross-Cutting: Metadata & Governance',
    zoneSub: 'applies across all stages',
    boundaryTag: 'OUTSIDE DATABRICKS',
    badgeStyle: {
      bg: 'bg-amber-500/20',
      text: 'text-amber-300',
      border: 'border-amber-500/40',
    },
    authoritativeFor: 'Glossary, certified business definitions, cross-platform discovery, aggregated lineage',
    mustNotHold: 'Access enforcement or direct data access controls',
    placementDetails:
      'Outside Databricks. Business glossary and certified definitions. Genuinely separate system; enforces nothing.',
  },
  'x-git': {
    platformId: 'outside_databricks',
    systemName: 'Git (Azure DevOps)',
    zoneId: 'cross_cutting',
    zoneTitle: 'Cross-Cutting: Metadata & Governance',
    zoneSub: 'applies across all stages',
    boundaryTag: 'GIT → DEPLOYS TO UC',
    badgeStyle: {
      bg: 'bg-purple-500/20',
      text: 'text-purple-300',
      border: 'border-purple-500/40',
    },
    authoritativeFor: 'Pipeline code, data contracts, product specs, CI checks',
    mustNotHold: 'Actual data storage or live tables',
    placementDetails:
      'Authored outside in Git, deployed into Databricks. Git is the system of record; the contract is deployed into UC as comments, tags, and constraints. Same content, one authority.',
  },
  'x-gov': {
    platformId: 'not_a_system',
    systemName: 'Governance Function (Team)',
    zoneId: 'cross_cutting',
    zoneTitle: 'Cross-Cutting: Metadata & Governance',
    zoneSub: 'applies across all stages',
    boundaryTag: 'NOT A SYSTEM',
    badgeStyle: {
      bg: 'bg-emerald-500/20',
      text: 'text-emerald-300',
      border: 'border-emerald-500/40',
    },
    authoritativeFor: 'Policy standards, classification taxonomy, certification criteria',
    mustNotHold: 'Not a technical platform or database',
    placementDetails:
      'Organizational body — a team, not a system. Establishes standards that data products and governance tools enforce.',
  },
};

export const ZONE_DEFINITIONS: Record<
  ArchitectureZoneId,
  {
    id: ArchitectureZoneId;
    title: string;
    subtitle: string;
    description: string;
    borderStyle: string;
    bgStyle: string;
    headerColor: string;
    nodeIds: string[];
    isDatabricksBoundary?: boolean;
  }
> = {
  zone_1: {
    id: 'zone_1',
    title: 'Zone 1 — Before the Platform',
    subtitle: 'Business Domain & ADF Extraction',
    description: 'Demand capture and ingestion orchestration before reaching Databricks.',
    borderStyle: 'border-2 border-dashed border-slate-500/35',
    bgStyle: 'bg-slate-500/[0.02]',
    headerColor: 'text-slate-300',
    nodeIds: ['s0', 's1'],
  },
  zone_2: {
    id: 'zone_2',
    title: 'Zone 2 — Databricks / Unity Catalog',
    subtitle: 'Platform Boundary · DxD owns · Zones 10–50',
    description:
      'Core Databricks compute and Unity Catalog metastore. Compute layer executes transformations; UC governs metadata, schemas, contracts, and access.',
    borderStyle: 'border-2 border-sky-400/60 shadow-[0_0_60px_rgba(56,189,248,0.08)]',
    bgStyle: 'bg-sky-500/[0.035]',
    headerColor: 'text-sky-300',
    nodeIds: ['bdc-node', 'bdc', 's1b', 's2', 's3', 's4', 's5', 's6', 's7', 'x-uc'],
    isDatabricksBoundary: true,
  },
  zone_3: {
    id: 'zone_3',
    title: 'Zone 3 — Discovery, Access & Consumption',
    subtitle: 'DataHub · Security Service · Power BI',
    description:
      'Egress from the platform. Stage 9 straddles the boundary: UC issues internal grants, Security Service gates external frontend tools.',
    borderStyle: 'border-2 border-dashed border-teal-500/35',
    bgStyle: 'bg-teal-500/[0.02]',
    headerColor: 'text-teal-300',
    nodeIds: ['s8', 's9', 's10', 's10b'],
  },
  zone_4: {
    id: 'zone_4',
    title: 'Zone 4 — Operate & Evolve',
    subtitle: 'Largest capability gap · Ownership unassigned (Home Undecided)',
    description:
      'Monitoring, alerting, freshness checks, and breaking change policies. Unbuilt and unassigned in current estate.',
    borderStyle: 'border-2 border-dashed border-amber-500/40',
    bgStyle: 'bg-amber-500/[0.03]',
    headerColor: 'text-amber-300',
    nodeIds: ['s11', 's12'],
  },
  cross_cutting: {
    id: 'cross_cutting',
    title: 'Cross-Cutting Layer — Metadata & Governance',
    subtitle: 'Applies across all stages',
    description:
      'Spans stages 0–12. UC is inside Databricks; DataHub is outside; Git is system of record; Governance is a team.',
    borderStyle: 'border-2 border-purple-500/40',
    bgStyle: 'bg-purple-500/[0.03]',
    headerColor: 'text-purple-300',
    nodeIds: ['x-uc', 'x-dh', 'x-git', 'x-gov'],
  },
};
