export interface VersionDefinition {
  id: string;             // stable key, e.g. "current", "option1"
  label: string;          // full display label
  shortLabel?: string;    // compact chip text, e.g. "preferred", "backup"
  accentColor: string;    // hex, drives the toggle button + status highlight
  sourceDoc: string;
}

export const VERSIONS: VersionDefinition[] = [
  {
    id: "current",
    label: "Current state",
    accentColor: "#94a3b8",
    sourceDoc: "workflow_and_environment_design.md",
  },
  {
    id: "option1",
    label: "Option 1 — Distributed",
    shortLabel: "preferred",
    accentColor: "#5cb87a",
    sourceDoc: "cin_replacement_decision.md",
  },
  {
    id: "option2",
    label: "Option 2 — Centralized",
    shortLabel: "backup",
    accentColor: "#e8b25e",
    sourceDoc: "cin_replacement_decision.md",
  },
];
