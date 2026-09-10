# Glossary

Abbreviations and terms used across the data mesh documents, the learning
project, and our discussion.

---

## Henkel / platform specific

| Term | Meaning |
|---|---|
| **HDP** | Henkel Data Platform — the Azure Databricks-based data platform |
| **UC** | Unity Catalog — Databricks' governance and metadata layer |
| **Metastore** | Top-level UC container holding catalogs. One per account on Free Edition |
| **Catalog** | A domain/product namespace inside a metastore, e.g. `hdp_sales_dev` |
| **Schema** | A grouping inside a catalog. In HDP, zones are implemented as schemas |
| **Zone** | HDP's pipeline stages: 10-Raw, 15-External, 20-Staging, 30-Enriched, 40-Curated, 50-Serving, 60-Workspace |
| **`self_`** | Schema prefix for a domain's own tables |
| **`shared_`** | Schema prefix for views a domain publishes for others to mirror |
| **`source_`** | Schema prefix for a mirror of another domain's `shared_` view, inside the consumer's own catalog |
| **`def_def`** | Default variant/view suffix in HDP's `{entity}_{variant}_{view}` naming |
| **SNOW** | ServiceNow — Henkel's service request system |
| **P47** | The extraction pipeline pulling data out of SAP. Delivers to two destinations: Synapse and CIN. Guaranteed to remain for at least three years |
| **CIN** | Central Ingestion — a Databricks component that ingests all incoming data regardless of domain. Will not remain in its current form; its output is still needed in a different shape |
| **Synapse** | Azure Synapse — the data warehouse. Receives data from P47, is also a *source* Databricks ingests from, and is slated for eventual decommissioning |
| **DWH** | Data warehouse — at Henkel, Synapse |
| **DxD** | The technical data function. Technical owner of data products; business domains are business owners |
| **Platform Team** | Owns ingestion and data integration capability — P47 evolution, BDC integration patterns, Hangfire replacement, HDP capabilities and operations. Confirmed explicitly out of the BI Evolution Program's scope |
| **BI Evolution Program** | Owns business data content and semantics, central/domain data product definition and ownership, migration of business logic off CIN/Synapse, and adoption of new data products by BI applications |
| **BDC** | SAP Business Data Cloud — SAP's own managed data platform, positioned as the successor ingestion path for SAP data. Includes SAP Analytics Cloud, Business Data Fabric, SAP Datasphere, and an Object Store for data products |
| **BDC Connect** | The confirmed mechanism delivering BDC data into Databricks — a **Delta (Open) Share**, not a custom-built pipeline |
| **Hangfire** | The current orchestration layer between P47 and Blob storage in the ingestion chain (P47 → Hangfire → Blob → CIN). Slated for replacement |
| **S4HANA / BDC** | The future SAP source generation, replacing the current SAP ECC/BW landscape that P47 extracts from |
| **Henkel Data Hub** | The confirmed internal name for what this project has been calling "DataHub" — four capabilities: Data Marketplace, Lineage, Business Glossary, Search Functionality |
| **Central data product** | Current terminology for a CIN-derived container holding all of one domain's data (e.g. "CFI" = all Finance data as one container). Distinct from the future **Domain Data Product** |
| **Domain Data Product** | The target unit — many named, owned products per domain (e.g. Finance moving from one "CFI" container to roughly 8–10 individual Finance Data Products). This is the same distinction the qualification test in this project draws between a landing function and a real product |
| **UDA** | A named platform workstream in the BI Evolution planning (exact scope not fully specified in source material — appears responsible for extraction stability and later BDC/CIN compatibility work) |

## Governance and data management

| Term | Meaning |
|---|---|
| **MDM** | Master Data Management — the discipline of maintaining one authoritative version of shared entities (customer, product) |
| **Golden record** | The single resolved, authoritative row for an entity, after reconciling conflicting versions from multiple systems |
| **Crosswalk / xref** | A mapping table linking one system's IDs to another's |
| **Conformed key** | An identifier that means the same thing across domains, enabling joins |
| **Data contract** | A versioned specification of what a published data product promises: schema, freshness, ownership, change policy |
| **ODCS** | Open Data Contract Standard — Bitol / Linux Foundation |
| **ODPS** | Open Data Product Standard — also Bitol. *Note:* an unrelated project (opendataproducts.org) also uses "ODPS" for Open Data Product Specification. Check which governance body is meant |
| **Data Product Canvas** | INNOQ's 8-block design framework for specifying data products before building |
| **PII** | Personally Identifiable Information |
| **SLA** | Service Level Agreement — here, a promised data freshness or availability level |
| **RBAC** | Role-Based Access Control — permissions granted to roles/groups |
| **ABAC** | Attribute-Based Access Control — permissions derived from tags on data. GA in Unity Catalog since May 2026 |
| **Governed tags** | Account-level key-value tags on UC objects that ABAC policies read |

## Databricks technical

| Term | Meaning |
|---|---|
| **Delta / Delta Lake** | Databricks' table format: Parquet files plus a transaction log giving ACID, time travel, upserts |
| **Parquet** | Columnar file format. Delta is built on it; raw Parquet has no transaction log |
| **ACID** | Atomicity, Consistency, Isolation, Durability — transactional guarantees |
| **`_delta_log`** | The transaction log folder that makes a set of Parquet files a Delta table |
| **Managed table** | A table whose storage location UC controls |
| **External table** | A table pointing at storage you manage. Requires External Locations — unsupported on Free Edition |
| **Volume** | A UC-governed folder for non-tabular files |
| **DLT** | Delta Live Tables — now called Lakeflow Declarative Pipelines |
| **Lakeflow** | Databricks' declarative pipeline framework (successor naming to DLT) |
| **DAB** | Databricks Asset Bundles — YAML-based packaging and deployment of jobs, pipelines, and UC objects. Now also branded Declarative Automation Bundles |
| **`bundle init`** | The CLI command that generates a project from a bundle template |
| **PK / FK** | Primary Key / Foreign Key. In UC these are *informational only, never enforced* |
| **`information_schema`** | Queryable metadata about catalogs, schemas, tables, columns |
| **Serverless** | Compute managed entirely by Databricks; the only option on Free Edition |

## Azure / infrastructure

| Term | Meaning |
|---|---|
| **ADF** | Azure Data Factory — ingestion and orchestration service used in HDP |
| **AD / Entra ID** | Active Directory — Microsoft's identity service (Entra ID is the current name) |
| **SSO** | Single Sign-On |
| **SCIM** | System for Cross-domain Identity Management — protocol for syncing users/groups |
| **IaC** | Infrastructure as Code — managing infrastructure through version-controlled definitions |
| **Terraform** | An IaC tool; has a Databricks provider |
| **CI / CD** | Continuous Integration / Continuous Deployment — automated build, test, deploy |
| **Service principal** | A non-human identity used by automation |

## Data / analytics general

| Term | Meaning |
|---|---|
| **ETL / ELT** | Extract-Transform-Load vs Extract-Load-Transform |
| **Medallion architecture** | Bronze/Silver/Gold layering. HDP uses its own numbered zones instead |
| **Fact table** | Records events with measures — orders, clicks, tests |
| **Dimension table** | Describes entities — customer, product |
| **Grain** | What one row represents |
| **Denormalising** | Flattening joined data into one wide table for easier consumption |
| **Fan-out** | A join producing more rows than expected, usually from a wrong or missing relationship |
| **Orphan reference** | A foreign key value with no matching parent row |
| **BI** | Business Intelligence |
| **KPI** | Key Performance Indicator |
| **LTV / CLV** | (Customer) Lifetime Value |
| **QC** | Quality Control |
| **CRM** | Customer Relationship Management system — Salesforce, HubSpot |
| **ERP** | Enterprise Resource Planning system — SAP |
| **SAP SD** | SAP Sales & Distribution module |
| **LIMS** | Laboratory Information Management System |

## AI

| Term | Meaning |
|---|---|
| **LLM** | Large Language Model |
| **NL query** | Natural Language query — asking questions in plain language |
| **Semantic layer** | Certified metric definitions and business meaning that let tools or LLMs interpret data correctly |
| **RAG** | Retrieval-Augmented Generation — retrieving documents/data to ground an LLM's answer |
| **Vector / embedding** | Numeric representation of content enabling similarity search |
| **Agent** | An AI system that takes actions, not just answers questions |
| **Blast radius** | How much damage an action can cause if wrong |
| **Human-in-the-loop** | Requiring human approval before an automated action takes effect |

---

## Labels used in these documents

**Confidence markers**
- **[Certain]** — verified against documentation or directly observed
- **[Likely]** — reasoned inference, not verified
- **[Guessing]** — explicitly unverified, flagged so it isn't relied on
- **[INVENTED]** — my construct for the learning project, not a Henkel fact
  (notably `hdp_mdm_dev`)

**Structural labels**

| Label | Where | Meaning |
|---|---|---|
| **H1–H7** | HLD §2, §3.5 | Adoption barrier hypotheses to test |
| **P1–P4** | HLD §3.4 | Agent-readiness properties (machine-readable state, structured events, scoped actions, identity+audit) |
| **L0–L4** | HLD §3.4 | Agent autonomy ladder |
| **Layer 0 / A / B / C** | HLD §3, proposal §2 | Diagnosis / golden path / automated governance / AI-readiness |
| **QQ1–QQ4** | Scorecard | The four qualification questions |
| **R1–R3** | Scorecard | Registered tier criteria |
| **CERT-1–CERT-5** | Scorecard | Certified tier criteria |
| **AI-C1 / AI-C2 / AI-C3** | HLD §3.3 | AI phases: semantic layer / ML features / RAG |

**Naming collisions — corrected**

Two labelling conflicts existed in earlier drafts and have been fixed:
- **C1/C2/C3** previously meant both AI phases *and* Certified-tier
  criteria. AI phases are now **AI-C1/2/3**; scorecard criteria are now
  **CERT-1…5**.
- **Q1–Q4** previously meant both calendar quarters *and* the four
  qualification questions. Qualification questions are now **QQ1–QQ4**;
  Q1–Q4 means quarters only.
