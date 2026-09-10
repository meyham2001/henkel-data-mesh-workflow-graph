# Henkel Data Mesh Workflow Graph

An interactive architecture visualization and decision analysis tool for the **Henkel Data Platform (HDP)** data mesh estate.

This application models the end-to-end data lifecycle across Stages 0 through 12, cross-cutting governance entities, platform boundaries (Databricks / Unity Catalog vs. External Systems vs. Unassigned Gaps), and versioned architectural scenarios based strictly on confirmed source documentation.

---

## Key Features

- **Interactive End-to-End Pipeline**: Full interactive React Flow canvas rendering Stages 0–12 with Dagre-based auto-layout.
- **Platform Boundaries & System Placement**:
  - **Zone 1**: Ingestion & Extraction (ADF / P47, Demand & Intake).
  - **Zone 2**: Databricks Platform Boundary & Unity Catalog Boundary (Stages 2–7).
  - **Zone 3**: Discovery, Access & Consumption (DataHub, Stage 9 Security Broker, Power BI, Zone 60 Workspace).
  - **Zone 4**: Operate & Evolve (Stages 11–12 unassigned lifecycle gaps).
  - **Cross-Cutting**: Central governance, DataHub metadata sync, and Git orchestration.
- **Decision Scenarios**:
  - **Current State**: Existing pipeline baseline with known gaps.
  - **Option 1 (Distributed)**: Decentralized domain autonomy with federated governance.
  - **Option 2 (Centralized)**: Shared core infrastructure with centralized governance & cross-product mirroring.
- **Deep Lineage Tracing**: Click any dependency line or label to isolate and highlight the full upstream source and downstream target lineage chains with pulsing flow paths.
- **Slide-Over Detail Drawer & KPI Explorer**:
  - Technical code implementations (Prism syntax-highlighted SQL, YAML, Python).
  - Section 446 Authoritative System Boundary specifications (*"Authoritative For"* and *"Must NOT Hold"*).
  - Four-state gap categorization: Established (green), Partial (amber), Missing (red), Unknown (purple).
  - Slide-over KPI drawer with click-to-jump stage inspection and breadcrumb navigation.
- **Export Capabilities**:
  - High-res PNG image export.
  - Full active scenario graph JSON dataset.
  - Formatted Executive Markdown report.

---

## Tech Stack

- **Framework**: React 18 + TypeScript + Vite 6
- **Graph & Visualization**: `@xyflow/react` (React Flow v12), `@dagrejs/dagre`, `html-to-image`
- **State Management**: Zustand
- **Styling**: Tailwind CSS + Radix UI + Lucide Icons
- **Code Formatting**: PrismJS
- **Testing**: Vitest

---

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

```bash
npm install
```

### Development

Start the local development server:

```bash
npm run dev
```

The application will be available at `http://localhost:5173`.

### Testing

Run the automated Vitest test suite:

```bash
npm test
```

### Production Build

```bash
npm run build
```

---

## Architecture Traceability

All stages, gaps, and decisions cite verified documentation in `source-docs/`:
1. `datamesh_working_log.md`
2. `workflow_and_environment_design.md`
3. `cin_replacement_decision.md`
4. `current_state_assessment.md`
5. `data_product_scorecard.md`
6. `glossary.md`
7. `workflow_diagram.html`
