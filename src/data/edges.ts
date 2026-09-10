import { LineageEdge } from './schema';

export const PIPELINE_EDGES: LineageEdge[] = [
  // Stage 0 -> Stage 1
  {
    id: 'e-s0-s1',
    source: 's0',
    target: 's1',
    label: 'Approved Product Request',
  },

  // Stage 1 Extraction -> CIN (Current, Option 1 Phase 1, Option 2)
  {
    id: 'e-s1-s1b',
    source: 's1',
    target: 's1b',
    label: 'P47 Ingestion Extract',
  },

  // Stage 1 Extraction -> SAP BDC (Option 1 Phase 2, Option 2 Phase 2)
  {
    id: 'e-s1-bdc',
    source: 's1',
    target: 'bdc-node',
    visibleIn: ['option1', 'option2'],
    label: 'Successor Transition',
    styleVariant: 'bdc',
  },

  // SAP BDC -> Zone 10 Raw direct Delta Share (Option 1 Phase 2 bypasses CIN)
  {
    id: 'e-bdc-s2',
    source: 'bdc-node',
    target: 's2',
    visibleIn: ['option1'],
    label: 'BDC Connect (Delta Share)',
    styleVariant: 'bdc',
  },

  // SAP BDC -> CIN (Option 2 Phase 2 centralized extractor)
  {
    id: 'e-bdc-s1b',
    source: 'bdc-node',
    target: 's1b',
    visibleIn: ['option2'],
    label: 'Central BDC Extractor',
    styleVariant: 'bdc',
  },

  // CIN -> Zone 10 Raw (Lands into domain self_{module}_raw)
  {
    id: 'e-s1b-s2',
    source: 's1b',
    target: 's2',
    label: 'Landing to self_raw',
  },

  // Zone 10 Raw -> Zone 20 Staging
  {
    id: 'e-s2-s3',
    source: 's2',
    target: 's3',
    label: 'Typing & Conforming',
  },

  // Zone 20 Staging -> Zone 30 Enriched
  {
    id: 'e-s3-s4',
    source: 's3',
    target: 's4',
    label: 'Business Rules & Logic',
  },

  // Zone 30 Enriched -> Zone 40 Curated
  {
    id: 'e-s4-s5',
    source: 's4',
    target: 's5',
    label: 'Entity Harmonization',
  },

  // Zone 40 Curated -> Cross-Product Mirroring (Stage 6)
  {
    id: 'e-s5-s6',
    source: 's5',
    target: 's6',
    label: 'Publish shared_ view',
  },

  // Cross-Product Mirroring -> Enriched (Consumers join mirrors in Stage 4)
  {
    id: 'e-s6-s4',
    source: 's6',
    target: 's4',
    label: 'source_ mirror join',
    styleVariant: 'dashed',
  },

  // Cross-Product Mirroring -> Serving (Consumers build serving views on mirrors)
  {
    id: 'e-s6-s7',
    source: 's6',
    target: 's7',
    label: 'Dimensional join',
  },

  // Option 2 Three-Way Routing from Stage 6 (Spec Section 4.6):
  // 1. Direct from BDC -> Consumption
  {
    id: 'e-s6-s10-bdc',
    source: 's6',
    target: 's10',
    visibleIn: ['option2'],
    label: 'Route 1: BDC Direct',
    styleVariant: 'bdc',
  },
  // 2. Central Data Product -> Serving (already e-s6-s7)
  // 3. Indirect via CIN -> Loopback to CIN
  {
    id: 'e-s6-s1b-cin',
    source: 's6',
    target: 's1b',
    visibleIn: ['option2'],
    label: 'Route 3: Indirect via CIN',
    styleVariant: 'loop',
  },

  // Zone 40 Curated -> Zone 50 Serving
  {
    id: 'e-s5-s7',
    source: 's5',
    target: 's7',
    label: 'Denormalize / Aggregate',
  },

  // Zone 40 Curated -> Discovery (Stage 8 DataHub metadata ingestion)
  {
    id: 'e-s5-s8',
    source: 's5',
    target: 's8',
    label: 'Metadata & Lineage Push',
    styleVariant: 'dashed',
  },

  // Zone 50 Serving -> Stage 9 Access Authorisation
  {
    id: 'e-s7-s9',
    source: 's7',
    target: 's9',
    label: 'Security & Masking Gate',
  },

  // Zone 50 Serving -> Stage 10 Consumption
  {
    id: 'e-s7-s10',
    source: 's7',
    target: 's10',
    label: 'Power BI Query',
  },

  // Stage 8 Discovery -> Stage 10 Consumption
  {
    id: 'e-s8-s10',
    source: 's8',
    target: 's10',
    label: 'Consumer Discovery & Catalog',
  },

  // Stage 9 Access Authorisation -> Stage 10 Consumption
  {
    id: 'e-s9-s10',
    source: 's9',
    target: 's10',
    label: 'Authorised Query Session',
  },

  // Data Science Enriched Products (Stage 10b)
  {
    id: 'e-s5-s10b',
    source: 's5',
    target: 's10b',
    label: 'ML Feature Input',
    styleVariant: 'dashed',
  },
  {
    id: 'e-s7-s10b',
    source: 's7',
    target: 's10b',
    label: 'Aggregate Feature Training',
    styleVariant: 'dashed',
  },
  {
    id: 'e-s10b-s10',
    source: 's10b',
    target: 's10',
    label: 'Predictive Insights App',
  },

  // Stage 10 Consumption -> Stage 11 Operate (Usage & Telemetry Feedback)
  {
    id: 'e-s10-s11',
    source: 's10',
    target: 's11',
    label: 'Usage Audit & Error Reports',
  },

  // Stage 11 Operate -> Stage 12 Evolve & Retire
  {
    id: 'e-s11-s12',
    source: 's11',
    target: 's12',
    label: 'Reliability & Lifecycle Trigger',
  },

  // Stage 12 Evolve & Retire -> Stage 0 Intake (Feedback loop)
  {
    id: 'e-s12-s0',
    source: 's12',
    target: 's0',
    label: 'Deprecation / Request Sunset',
    styleVariant: 'dashed',
  },

  // Cross-cutting links
  {
    id: 'e-xuc-s2',
    source: 'x-uc',
    target: 's2',
    label: 'Schema & Permissions',
    styleVariant: 'dashed',
  },
  {
    id: 'e-xuc-s9',
    source: 'x-uc',
    target: 's9',
    label: 'AD Group Grants',
    styleVariant: 'dashed',
  },
  {
    id: 'e-xgit-s5',
    source: 'x-git',
    target: 's5',
    label: 'Deploy Contract to UC',
    styleVariant: 'dashed',
  },
  {
    id: 'e-xdh-s8',
    source: 'x-dh',
    target: 's8',
    label: 'Ingest Technical Lineage',
    styleVariant: 'dashed',
  },
  {
    id: 'e-xgov-s9',
    source: 'x-gov',
    target: 's9',
    label: 'Classification Standard',
    styleVariant: 'dashed',
  },
];
