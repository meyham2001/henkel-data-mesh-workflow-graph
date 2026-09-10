import { ProsCons } from './schema';

export const VERSION_SUMMARIES: Record<string, ProsCons> = {
  current: {
    pros: [
      "Existing infrastructure is in place and running in production today (P47, Hangfire, CIN, Synapse)",
      "No immediate disruption to active pipelines or ongoing analytics feeds",
    ],
    cons: [
      "Fails all four qualification tests: no named consumer, cannot change independently, doesn't change as a unit, not requested by name",
      "CIN acts as an undifferentiated Zone 10 container for the whole estate, mislabelled as a product",
      "No data contracts or automated break detection — breaks must be traced manually step by step",
    ],
  },
  option1: {
    pros: [
      "Passes the qualification test from Phase 1 onward: named consumer, independent change, changes as a unit, requestable by name",
      "Resolves the structural problem rather than deferring it — domain products take true ownership of business logic",
      "Matches Henkel's own documented preference (BI Evolution & Platform - Data Mesh Evaluation)",
      "CIN shrinks to pure landing in Phase 1, then is completely bypassed once SAP BDC lands in Phase 2",
    ],
    cons: [
      "Requires real migration effort immediately in Phase 1 — business logic must move out of CIN and Synapse into domain data products",
      "Does not yet name a home for cross-domain reference data (customer, material, company code) — risk of duplication across N domains",
      "Phase 2 requires a second logic adjustment once BDC lands, since the BDC-sourced view differs from the CIN view",
    ],
  },
  option2: {
    pros: [
      "Lower short-term disruption — reuses existing CDS extractor logic and keeps central infrastructure stable",
      "Explicit backup solution: reduces operational risk if Option 1 migration stalls, exceeds capacity, or runs over",
    ],
    cons: [
      "Does NOT resolve the qualification failure — still one undifferentiated centre everyone depends on, just thinner and Databricks-native",
      "Explicitly framed as risk-reduction, not target architecture, in Henkel's own document",
      "Consumption remains partly indirect via CIN even after BDC migration completes in Phase 2",
      "Requires ongoing maintenance of dual compatibility views (S4-native and legacy CIN compatibility)",
    ],
  },
};
