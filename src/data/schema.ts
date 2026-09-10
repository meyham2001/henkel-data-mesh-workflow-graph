export type Status = "ok" | "partial" | "missing" | "unknown";

export type NodeCategory =
  | "source"
  | "zone"
  | "container"
  | "product"
  | "governance"
  | "external";

export interface CodeExample {
  language: "sql" | "yaml" | "python";
  code: string;
  caption: string;
}

export interface SampleData {
  columns: string[];
  rows: (string | number)[][];
  caption?: string;
}

export interface PolicyRef {
  tagKey: string;
  tagValue: string;
  effect: string; // e.g. "Masks this column for non-privacy-cleared users"
}

export interface ProsCons {
  pros: string[];
  cons: string[];
}

export interface VersionedContent {
  status: Status;
  visible: boolean; // does this node exist at all under this version?
  title?: string; // override, if it differs from the base title
  description: string; // rich markdown-like prose
  prosCons?: ProsCons; // required whenever this node represents a decision point
  gaps?: string[];
  notes?: string[];
}

export interface PipelineNode extends Record<string, unknown> {
  id: string;
  category: NodeCategory;
  baseTitle: string;
  owner: string;
  sourceDoc: string; // REQUIRED — traceability per Section 1
  variesByVersion: boolean; // see Section 4.4 — most nodes are false
  codeExample?: CodeExample;
  sampleData?: SampleData;
  policies?: PolicyRef[];
  versions: Partial<Record<string, VersionedContent>>; // keyed by VersionDefinition.id
}

export interface LineageEdge {
  id: string;
  source: string;
  target: string;
  visibleIn?: string[]; // VersionDefinition ids; omit = visible in all
  label?: string;
  styleVariant?: "default" | "dashed" | "bdc" | "loop";
}
