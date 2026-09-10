import json

# Define the nodes cleanly
nodes = [
  {
    "id": "s0",
    "category": "source",
    "baseTitle": "Stage 0 — Demand & Intake",
    "owner": "Business domain (as business owner), with DxD",
    "sourceDoc": "workflow_and_environment_design.md",
    "variesByVersion": False,
    "codeExample": {
      "language": "yaml",
      "caption": "Proposed Azure DevOps Intake Work Item template for Data Products",
      "code": "name: Data Product Request\nmetadata:\n  domain: Finance\n  business_owner: \"alex.schmidt@henkel.com\"\n  named_consumer: \"Global Controlling Reporting Team\"\n  use_case: \"Monthly automated variance analysis against SAP ECC actuals\"\nguarantees:\n  freshness_sla: \"Daily 06:00 CET\"\n  sensitivity: \"Internal / Financial Confidential\"\n  data_quality_tier: \"Certified\""
    },
    "sampleData": {
      "caption": "Intake Specification Key Facts",
      "columns": ["Intake Field", "Determined By", "Automation Level", "Current Status"],
      "rows": [
        ["Business Owner", "Business Domain Lead", "Manual decision", "Informal / uncaptured"],
        ["Named Consumer & Use Case", "Business + Application Team", "Manual (mandatory QQ1)", "Absent in most products"],
        ["Promised Freshness SLA", "Business commitment", "Manual sign-off", "No SLA declared"],
        ["Sensitivity Classification", "Data Classification Standard", "Semi-automated (ABAC tags)", "View DDL dev/prod split"]
      ]
    },
    "versions": {
      "current": {
        "status": "missing",
        "visible": True,
        "description": "Someone identifies a question the business cannot currently answer, and a product request is raised. Captures: business owner, named consumer, the question being answered, required freshness, sensitivity expectations. Produces a product request record that becomes the pre-filled input to the contract so nobody writes one later.",
        "gaps": [
          "G9: No formal intake step exists today — products are built without identifiable consumers",
          "Owner, named consumer, and promised SLA cannot be automated from data; without intake they are filled retrospectively or omitted",
          "Absence of intake is the primary structural reason some current products have no active consumers"
        ],
        "notes": [
          "Azure DevOps work item is the natural operational home for intake tickets",
          "Reconciliation of 'zero manual contract': capture the 3 human decisions at intake; generate all technical schema metadata automatically"
        ]
      }
    }
  },
  {
    "id": "s1",
    "category": "source",
    "baseTitle": "Stage 1 — Source Extraction",
    "owner": "DxD platform / ADF pipelines",
    "sourceDoc": "workflow_and_environment_design.md",
    "variesByVersion": True,
    "codeExample": {
      "language": "sql",
      "caption": "Current SAP extraction landing query executed via P47",
      "code": "-- SAP extraction pipeline P47 delivers to both Synapse and CIN in Databricks\n-- P47 is guaranteed for at least 3 years by management decision\nSELECT\n    mandt AS client_id,\n    vbeln AS sales_doc_id,\n    posnr AS sales_doc_item,\n    matnr AS material_id,\n    netwr AS net_value_eur,\n    erdat AS creation_date\nFROM sap_p47_extract.vbrk_vbrp_stream;"
    },
    "sampleData": {
      "caption": "Extraction Landscape & Horizon",
      "columns": ["Source System", "Extraction Tool", "Current Destination", "Horizon / Successor"],
      "rows": [
        ["SAP ECC / BW", "P47 Extraction Pipeline", "Synapse (DWH) + CIN (Databricks)", "3-year commitment -> SAP BDC / BDC Connect"],
        ["Salesforce / CRM", "Azure Data Factory (ADF)", "Databricks Zone 10 Raw", "Managed ADF REST API extraction"],
        ["PIM / Product Data", "ADF SFTP / Blob Drop", "Databricks Zone 15 External", "Quarantined third-party feed"],
        ["Synapse (Modelled)", "ADF Copy Pipeline", "Databricks (One-way feed)", "To be migrated to Databricks native logic"]
      ]
    },
    "versions": {
      "current": {
        "status": "ok",
        "visible": True,
        "description": "Scheduled extraction from ~40 source systems: SAP ECC, CRM, PIM, MES, sensor platforms, external data providers via ADF (SharePoint, FTP, APIs, file drops). SAP is extracted via P47, which delivers to TWO destinations: Synapse (the DWH) and CIN in Databricks. Synapse also feeds transformed output into Databricks one-way.",
        "gaps": [
          "Missing notification when a source schema changes upstream — today discovered only when downstream pipelines fail",
          "P47 is committed for at least 3 years — domain routing logic placed inside P47 will be rebuilt when P47 is replaced",
          "G13: Synapse dependency map unknown — need full inventory of products consuming Synapse-modelled output"
        ],
        "notes": [
          "Synapse is NOT bidirectional with Databricks: SAP feeds both in parallel via P47; Synapse feeds Databricks one-way. Databricks does not feed Synapse."
        ]
      },
      "option1": {
        "status": "ok",
        "visible": True,
        "title": "Stage 1 — Source Extraction (P47 & BDC)",
        "description": "Phase 1: Test CDS-based extraction with prototype products consuming from CIN Raw. Phase 2: Sources switch to SAP Business Data Cloud (BDC) delivering directly into Databricks via BDC Connect (Delta/Open Share), running alongside P47 during transition.",
        "prosCons": {
          "pros": [
            "Direct, high-throughput Delta Share feed into Databricks via BDC Connect",
            "Decouples extraction from legacy P47 pipeline and Hangfire orchestration"
          ],
          "cons": [
            "Requires operating dual extraction paths during Phase 1-to-Phase 2 transition",
            "Dependent on SAP BDC roadmap and delivery timeline"
          ]
        },
        "gaps": [
          "Impact after P47 decommissioning must be confirmed per internal BI Evolution roadmap question 4"
        ]
      },
      "option2": {
        "status": "ok",
        "visible": True,
        "title": "Stage 1 — Source Extraction (P47 into CIN)",
        "description": "Phase 1: CDS-based extraction into CIN, source-aligned, reapplying existing extractor logic. Phase 2: SAP extractors move into BDC within CIN, maintaining centralized extraction control.",
        "prosCons": {
          "pros": [
            "Reuses existing extraction logic and minimizes changes to upstream extractor configurations"
          ],
          "cons": [
            "Routing logic stays coupled to central extraction infrastructure",
            "P47 retirement forces redesign of central ingestion layer"
          ]
        }
      }
    }
  },
  {
    "id": "s1b",
    "category": "container",
    "baseTitle": "Stage 1b — CIN (Central Ingestion)",
    "owner": "Ownership unassigned · restructuring confirmed by management decision",
    "sourceDoc": "cin_replacement_decision.md",
    "variesByVersion": True,
    "codeExample": {
      "language": "sql",
      "caption": "Current catalog structure confirmed in hdp_cin_dev",
      "code": "-- Real catalog confirmed in internal screenshots (cin_replacement_decision.md)\nSHOW SCHEMAS IN hdp_cin_dev;\n-- Output: self_cs_enriched, self_fi_staging, self_ie_curated, self_cs_raw...\n-- CIN sits inside Databricks compute, but functions as estate-wide Zone 10"
    },
    "sampleData": {
      "caption": "Scorecard Four-Question Qualification Test Applied to CIN",
      "columns": ["Question", "Evaluation for CIN", "Pass / Fail"],
      "rows": [
        ["QQ1: Named consumer who would notice absence?", "Every domain — functionally the same as no one", "FAIL"],
        ["QQ2: Can owning team change without sign-off?", "No. Any SAP change impacts all consuming domains", "FAIL"],
        ["QQ3: Does whole thing change as a unit?", "No. Changes whenever any source system changes", "FAIL"],
        ["QQ4: Would a consumer request it by name?", "No. Consumers request their domain data (e.g. Finance)", "FAIL"]
      ]
    },
    "policies": [
      {
        "tagKey": "pii_masking",
        "tagValue": "ddl_view_level",
        "effect": "Per-column masking written into view DDL; dev view is masked, prod view is unmasked (current_state_assessment.md §3b)"
      }
    ],
    "versions": {
      "current": {
        "status": "missing",
        "visible": True,
        "title": "Stage 1b — CIN (Central Ingestion)",
        "description": "Ingests all incoming data regardless of domain, then feeds domain products. Sits inside Databricks compute but outside Unity Catalog objects. It fails all four qualification tests: no named consumer, cannot change without affecting all domains, does not change as a unit, nobody requests it by name. It is Zone 10 for the whole estate, mislabelled as a product.",
        "gaps": [
          "G16: CIN has no owner and is not a data product — management confirmed it cannot remain in current form",
          "Fails all 4 qualification questions (QQ1–QQ4) in data_product_scorecard.md",
          "Centralizes business logic with no accountable domain product"
        ],
        "notes": [
          "Zones do not move under any replacement option: zones are schema names inside each domain catalog (self_{module}_raw). CIN was someone else's Zone 10 sitting outside."
        ]
      },
      "option1": {
        "status": "partial",
        "visible": True,
        "title": "Stage 1b — CIN (Phase 1: Raw Only → Bypassed in Phase 2)",
        "description": "Option 1 (Distributed — Henkel's preferred path): In Phase 1, business logic migrates OUT of CIN and Synapse into domain data products. CIN narrows to source-aligned raw landing only. In Phase 2, sources switch to SAP BDC via BDC Connect, and CIN is struck through and bypassed entirely.",
        "prosCons": {
          "pros": [
            "Passes the qualification test from Phase 1 onward: domain products own their logic and lifecycle",
            "Resolves the structural problem rather than deferring it",
            "CIN is completely removed from the future target chain: P47 -> Hangfire -> Blob -> Domain Products"
          ],
          "cons": [
            "Requires immediate logic-migration engineering effort in Phase 1",
            "Phase 1 does not name a home for cross-domain reference data (customer, material, company code)"
          ]
        },
        "gaps": [
          "G17: Need dedicated master data products publishing shared_ views so shared SAP tables do not duplicate into N domains"
        ]
      },
      "option2": {
        "status": "partial",
        "visible": True,
        "title": "Stage 1b — CIN (\"Thin CIN\" — Backup Option)",
        "description": "Option 2 (Centralized / \"Thin CIN\" — Henkel's documented backup): CIN stays structurally as-is. Business logic migrates from Synapse to Databricks, but central data products do NOT take logic ownership — logic remains centralized. In Phase 2, BDC extractors are added inside CIN.",
        "prosCons": {
          "pros": [
            "Lower short-term disruption — reuses existing extractor logic and minimizes immediate domain team refactoring",
            "Serves as an explicit fallback if Option 1 migration runs over schedule"
          ],
          "cons": [
            "Does NOT resolve the qualification failure — still one undifferentiated centre everyone depends on, just thinner",
            "Explicitly framed as risk-reduction, not architecture, in Henkel source document",
            "Consumption remains partly indirect via CIN even after BDC migration completes"
          ]
        },
        "notes": [
          "Option 2 is an operational fallback, not a target data mesh architecture."
        ]
      }
    }
  },
  {
    "id": "s2",
    "category": "zone",
    "baseTitle": "Stage 2 — Zone 10 Raw / Zone 15 External",
    "owner": "DxD (product-aligned)",
    "sourceDoc": "workflow_and_environment_design.md",
    "variesByVersion": False,
    "codeExample": {
      "language": "sql",
      "caption": "Raw table creation in Unity Catalog (unmodified landing)",
      "code": "-- Schema: self_{module}_raw\nCREATE OR REPLACE TABLE hdp_sales_dev.self_orders_raw.sales_orders (\n    raw_payload STRING,\n    ingestion_timestamp TIMESTAMP,\n    source_system_file STRING\n) USING DELTA\nTBLPROPERTIES ('delta.autoOptimize.optimizeWrite' = 'true');"
    },
    "sampleData": {
      "caption": "Zone 10 Raw vs Zone 15 External Ingestion Stream",
      "columns": ["Catalog.Schema", "Source File", "Ingestion Mode", "Transformation State"],
      "rows": [
        ["hdp_sales_dev.self_orders_raw", "sap_vbrk_20260910.parquet", "Batch hourly append", "Raw payload, unmodified byte-for-byte"],
        ["hdp_mkt_dev.external_vendor_raw", "campaign_leads_export.csv", "External vendor drop", "Quarantined third-party feed, raw strings"],
        ["hdp_rnd_dev.self_lab_raw", "lims_test_results.json", "Event stream", "Unparsed JSON telemetry audit trail"]
      ]
    },
    "versions": {
      "current": {
        "status": "ok",
        "visible": True,
        "description": "Data lands unmodified into self_{module}_raw. Third-party feeds land separately in Zone 15 External, quarantined because their schemas are not controlled by Henkel. Rule: no typing, no renaming, no filtering. Raw is the audit trail back to source.",
        "gaps": [
          "Missing schema-drift detection at landing — the cheapest possible early warning mechanism, currently absent"
        ]
      }
    }
  },
  {
    "id": "s3",
    "category": "zone",
    "baseTitle": "Stage 3 — Zone 20 Staging",
    "owner": "DxD (product-aligned)",
    "sourceDoc": "workflow_and_environment_design.md",
    "variesByVersion": False,
    "codeExample": {
      "language": "sql",
      "caption": "Staging layer identifier domain qualification",
      "code": "-- Schema: self_{module}_staging\n-- Rule: domain-qualify identifiers here to prevent collisions across catalogs\nCREATE OR REPLACE VIEW hdp_mkt_dev.self_campaign_staging.leads_conformed AS\nSELECT\n    lead_id AS mkt_lead_id,\n    TRIM(email) AS contact_email,\n    TO_DATE(created_date, 'dd/MM/yyyy') AS lead_created_date,\n    CAST(lead_score AS INTEGER) AS lead_score\nFROM hdp_mkt_dev.external_vendor_raw.campaign_leads;"
    },
    "sampleData": {
      "caption": "Domain Disambiguation Applied in Staging",
      "columns": ["Raw Generic Column", "Staging Conformed Column", "Cast Type", "Target Standard"],
      "rows": [
        ["customerID", "sales_customer_id", "STRING", "Prefixed domain namespace"],
        ["ID", "mkt_lead_id", "STRING", "Prefixed domain namespace"],
        ["dd/MM/yyyy date", "event_date", "DATE", "ISO-8601 standard"],
        ["plantCode", "sap_plant_id", "STRING", "Master plant standard conformed"]
      ]
    },
    "versions": {
      "current": {
        "status": "ok",
        "visible": True,
        "description": "Typing and conforming only. Vendor-shaped columns mapped to Henkel conventions. Generic identifiers domain-qualified (e.g. customerID -> mkt_lead_id). Test: 'is this the right type?' belongs here; 'should this record count?' belongs in Enriched.",
        "gaps": [
          "G12: Agreed, enforced naming convention for identifier disambiguation is missing; without it engineers invent divergent standards",
          "Convention compliance checks not automated in CI/CD (e.g. non-conforming supply_chain_gold observed in sandbox)"
        ]
      }
    }
  },
  {
    "id": "s4",
    "category": "zone",
    "baseTitle": "Stage 4 — Zone 30 Enriched",
    "owner": "DxD (product-aligned), business rules defined by business owner",
    "sourceDoc": "cin_replacement_decision.md",
    "variesByVersion": True,
    "codeExample": {
      "language": "sql",
      "caption": "Enriched table applying business rules and joining via source_ mirrors",
      "code": "-- Schema: self_{module}_enriched\nCREATE OR REPLACE TABLE hdp_sales_dev.self_orders_enriched.order_items AS\nSELECT\n    o.sales_order_id,\n    o.item_number,\n    o.net_value_eur,\n    m.material_name,\n    m.product_line_code\nFROM hdp_sales_dev.self_orders_staging.orders o\nINNER JOIN hdp_sales_dev.source_cma_material_curated.material_dim m\n    ON o.sap_material_id = m.material_id\nWHERE o.order_status NOT IN ('CANCELLED', 'TEST');"
    },
    "sampleData": {
      "caption": "Enriched Entity with Quality & Referential Audit",
      "columns": ["sales_order_id", "sap_material_id", "net_value_eur", "order_status", "master_match_status"],
      "rows": [
        ["SO-982101", "MAT-00412", "14250.00", "CONFIRMED", "RESOLVED_GOLDEN"],
        ["SO-982102", "MAT-00984", "8300.50", "CONFIRMED", "RESOLVED_GOLDEN"],
        ["SO-982103", "MAT-UNKNOWN", "120.00", "ON_HOLD", "ORPHAN_REFERENCE"]
      ]
    },
    "versions": {
      "current": {
        "status": "ok",
        "visible": True,
        "description": "Business rules applied; first joins to master and reference data via source_ mirrors rather than reaching into other products directly. Business rules live in SQL code.",
        "gaps": [
          "Data quality expectations absent (no pipeline-level assertions fail a job on invalid records)",
          "Documented business rules missing — rule lives in SQL while the business justification does not"
        ]
      },
      "option1": {
        "status": "ok",
        "visible": True,
        "title": "Stage 4 — Zone 30 Enriched (Domain Owns Logic)",
        "description": "Option 1 Phase 1: Business logic currently trapped inside CIN and Synapse migrates OUT into this stage. The domain data product takes full, legitimate ownership of its business rules and calculations.",
        "prosCons": {
          "pros": [
            "Domain product takes real ownership of its business rules — passes qualification test from here on",
            "Removes hidden transformation logic from upstream platform pipeline"
          ],
          "cons": [
            "Requires migrating existing Synapse and CIN logic immediately — real one-time engineering cost"
          ]
        },
        "gaps": [
          "Need clear catalogue of business rules currently implemented in Synapse models for logic migration"
        ]
      },
      "option2": {
        "status": "ok",
        "visible": True,
        "title": "Stage 4 — Zone 30 Enriched (Centralized Logic Persists)",
        "description": "Option 2 Phase 1: Business logic does NOT move here. Logic migrates from Synapse to Databricks but stays centralized inside CIN; domain data products do not take ownership.",
        "prosCons": {
          "pros": [
            "No immediate logic-migration engineering burden on domain teams"
          ],
          "cons": [
            "Domain product still cannot independently own its business rules — qualification failure persists at this stage"
          ]
        }
      }
    }
  },
  {
    "id": "s5",
    "category": "zone",
    "baseTitle": "Stage 5 — Zone 40 Curated + Publish",
    "owner": "DxD technical owner, business domain accountable",
    "sourceDoc": "cin_replacement_decision.md",
    "variesByVersion": True,
    "codeExample": {
      "language": "sql",
      "caption": "Publishing curated data product view in Unity Catalog",
      "code": "-- Schema: shared_{module}_curated, naming {entity}_{variant}_{view} (default def_def)\nCREATE OR REPLACE VIEW hdp_sales_dev.shared_orders_curated.customer_orders_def_def AS\nSELECT\n    sales_order_id,\n    customer_id,\n    order_date,\n    total_amount_eur,\n    order_status\nFROM hdp_sales_dev.self_orders_enriched.orders_stable;\n-- Published views store SQL text only; zero storage files, live query resolution"
    },
    "sampleData": {
      "caption": "Data Product Certification & Contract State",
      "columns": ["Product View Name", "Access Layer", "Contract Version", "Certification Tier"],
      "rows": [
        ["shared_orders_curated.customer_orders_def_def", "shared_ publish view", "v1.0 (ODCS in Git)", "Certified (CERT-1..5 met)"],
        ["shared_material_curated.material_dim_def_def", "shared_ publish view", "v2.1 (ODCS in Git)", "Certified (Master Data)"],
        ["self_orders_enriched.campaign_efficiency", "self_ internal table", "None", "Registered (Internal only)"]
      ]
    },
    "versions": {
      "current": {
        "status": "partial",
        "visible": True,
        "description": "The product reaches its stable, documented form and is published via shared_{module}_curated views for other products to mirror. Publishing is a deliberate act per entity, not automatic.",
        "gaps": [
          "G1: No data contracts exist — the central gap preventing consumer trust",
          "G2: No freshness declaration or automated monitoring",
          "Table and column documentation is inconsistent across catalogs",
          "No formal certification status (Registered vs Certified tiers absent)"
        ],
        "notes": [
          "This is where trust is created — or currently isn't. A consumer cannot determine what is guaranteed, how current it is, or who is accountable."
        ]
      },
      "option1": {
        "status": "partial",
        "visible": True,
        "title": "Stage 5 — Zone 40 Curated (BDC Direct Redirect)",
        "description": "Phase 1: Publishes views derived from domain-owned logic. Phase 2: Redirects to BDC sources once SAP BDC lands — logic changes since BDC-sourced view differs from CIN-sourced view.",
        "prosCons": {
          "pros": [
            "Direct alignment with SAP S4/BDC target data model",
            "Published views have clear accountable domain owner"
          ],
          "cons": [
            "Phase 2 requires a second logic adjustment when BDC lands"
          ]
        }
      },
      "option2": {
        "status": "partial",
        "visible": True,
        "title": "Stage 5 — Zone 40 Curated (CIN Compatibility View)",
        "description": "Phase 2: Builds a compatibility view for BDC-in-CIN; some downstream products remain on CIN-sourced views while others adapt to S4 changes.",
        "prosCons": {
          "pros": [
            "Minimizes consumer breaking changes during SAP modernization"
          ],
          "cons": [
            "Dual maintenance of legacy compatibility view alongside new S4-native view"
          ]
        }
      }
    }
  },
  {
    "id": "s6",
    "category": "product",
    "baseTitle": "Stage 6 — Cross-Product Mirroring",
    "owner": "Consuming product team (DxD)",
    "sourceDoc": "cin_replacement_decision.md",
    "variesByVersion": True,
    "codeExample": {
      "language": "sql",
      "caption": "Cross-product mirroring view definition in consumer catalog",
      "code": "-- Consumer creates mirror view in its own catalog pointing to producer shared view\nCREATE OR REPLACE VIEW hdp_sales_dev.source_cma_material_curated.material_dim AS\nSELECT * FROM hdp_cma_dev.shared_material_curated.material_def_def;\n-- Stores only SQL query text; zero files copied, always live, zero sync delay"
    },
    "sampleData": {
      "caption": "Observed Cross-Product Mirrors in HDP Workspace",
      "columns": ["Consumer Schema", "Target Entity", "Producer Source", "Object Type"],
      "rows": [
        ["source_cma_material_curated", "material_dim", "hdp_cma_dev.shared_material_curated", "View (live SQL resolution)"],
        ["source_csc_def_curated", "customer_dim", "hdp_csc_dev.shared_def_curated", "View (live SQL resolution)"],
        ["source_sbi_def_curated", "sales_benchmark", "hdp_sbi_dev.shared_def_curated", "View (live SQL resolution)"],
        ["source_cma_shared_curated", "companycode2_dim", "hdp_cma_dev.shared_company_curated", "View (live SQL resolution)"]
      ]
    },
    "versions": {
      "current": {
        "status": "partial",
        "visible": True,
        "description": "A product needing another domain's data creates source_{producer}_{module}_{layer} in its own catalog, mirroring the producer's shared_ view. Zero data copied, never stale. Observed in sandbox: source_cma_material_curated, source_csc_def_curated, source_sbi_def_curated.",
        "gaps": [
          "Architecture map dependency density makes this the highest-risk stage for cascading breakage",
          "Producer has no awareness of who mirrors them — lineage shows it technically, but no producer is notified before a change",
          "G6: No breaking-change policy or impact analysis before schema modifications ship"
        ]
      },
      "option1": {
        "status": "partial",
        "visible": True,
        "title": "Stage 6 — Cross-Product Mirroring (Direct Mesh)",
        "description": "CIN drops out of the mirroring path entirely once bypassed. Mirroring connects domain to domain directly via shared_ -> source_ views.",
        "prosCons": {
          "pros": [
            "Eliminates intermediate pipeline hops and removes CIN bottleneck",
            "Full end-to-end lineage clarity in Unity Catalog"
          ],
          "cons": [
            "Requires strict contract versioning to protect dense inter-domain dependencies"
          ]
        }
      },
      "option2": {
        "status": "partial",
        "visible": True,
        "title": "Stage 6 — Cross-Product Mirroring (Three-Way Routing)",
        "description": "Option 2 Phase 2 explicit three-way routing decision required per source: (1) direct from BDC, (2) via central data products, or (3) still indirect via CIN.",
        "prosCons": {
          "pros": [
            "Allows flexible per-source migration pacing"
          ],
          "cons": [
            "Complex tri-modal routing topology with high operational overhead and consumer ambiguity",
            "Requires three simultaneous downstream routing connections from this stage"
          ]
        }
      }
    }
  },
  {
    "id": "s7",
    "category": "zone",
    "baseTitle": "Stage 7 — Zone 50 Serving",
    "owner": "DxD / Application teams",
    "sourceDoc": "workflow_and_environment_design.md",
    "variesByVersion": False,
    "codeExample": {
      "language": "sql",
      "caption": "Consumption-optimised aggregated serving table",
      "code": "-- Schema: self_{module}_serving or external Azure SQL serving structure\nCREATE OR REPLACE TABLE hdp_sales_dev.self_orders_serving.monthly_brand_revenue AS\nSELECT\n    DATE_TRUNC('month', order_date) AS sales_month,\n    product_brand,\n    country_code,\n    SUM(net_value_eur) AS total_revenue_eur,\n    COUNT(DISTINCT customer_id) AS active_customer_count\nFROM hdp_sales_dev.self_orders_enriched.order_items\nGROUP BY 1, 2, 3;"
    },
    "sampleData": {
      "caption": "Serving Zone Structures & Access Tiers",
      "columns": ["Serving Table", "Target Consumer", "Shaping / Optimization", "Access Tier"],
      "rows": [
        ["monthly_brand_revenue", "Power BI Executive Dashboard", "Aggregated monthly dimensional grain", "Unrestricted Internal"],
        ["customer_order_history_serving", "CRM Sales Representative App", "Denormalised customer history", "PII Masked Tier"],
        ["supply_chain_plant_efficiency", "Logistics Operations Portal", "Pre-computed KPIs and variance", "Business Cleared"]
      ]
    },
    "versions": {
      "current": {
        "status": "partial",
        "visible": True,
        "description": "Consumption-optimised structures: aggregation, denormalisation, dimensional shaping, format conversion, access tiering. Serves Power BI and external BI applications via Unity Catalog and Azure SQL.",
        "gaps": [
          "Systematic access tiering absent (full / PII-stripped / aggregated variants handled case-by-case)",
          "G3: Certified metric definitions not attached to served structures (calculated in DAX instead)"
        ]
      }
    }
  },
  {
    "id": "s8",
    "category": "governance",
    "baseTitle": "Stage 8 — Discovery",
    "owner": "DataHub team (surface), product owners (content)",
    "sourceDoc": "workflow_and_environment_design.md",
    "variesByVersion": False,
    "codeExample": {
      "language": "yaml",
      "caption": "DataHub ingestion recipe snippet for Unity Catalog metadata",
      "code": "source:\n  type: databricks\n  config:\n    workspace_url: \"https://adb-xxx.azuredatabricks.net\"\n    include_tables: true\n    include_views: true\n    include_lineage: true\n    profiling:\n      enabled: true"
    },
    "sampleData": {
      "caption": "Henkel Data Hub Discovery Inventory",
      "columns": ["Capability", "Status in Henkel", "Platform Coverage", "Key Limitation"],
      "rows": [
        ["Technical Lineage", "Populated", "Databricks, Power BI, SAP, DWH", "Shows connections, not guarantees"],
        ["Business Glossary", "Rolling out", "Enterprise-wide", "Only a handful of terms populated"],
        ["Data Marketplace", "Early stage", "Databricks catalogs", "No consumer quality/freshness signals"],
        ["Search Functionality", "Active", "Cross-platform metadata", "Discovers tables, not business definitions"]
      ]
    },
    "versions": {
      "current": {
        "status": "partial",
        "visible": True,
        "description": "Henkel Data Hub ingests Databricks, Power BI, SAP, DWH. Lineage is populated across sources. The business glossary holds only a handful of terms — 'just rolling out'. Corrected chain: owners author -> governance defines standard -> DataHub presents -> apps consume.",
        "gaps": [
          "G3: Certified definitions absent at scale — consumers cannot understand what they find",
          "Consumer-facing quality, contract, and freshness signals missing from search view",
          "Certification tier visibility absent (cannot filter for Certified vs Draft products)",
          "Metric definition authoring ownership unresolved between Application teams and Governance"
        ]
      }
    }
  },
  {
    "id": "s9",
    "category": "governance",
    "baseTitle": "Stage 9 — Access Authorisation",
    "owner": "Governance (policy), DxD (implementation), security service",
    "sourceDoc": "current_state_assessment.md",
    "variesByVersion": False,
    "codeExample": {
      "language": "sql",
      "caption": "View-DDL masking workaround (current) vs target ABAC row/column policy",
      "code": "-- CURRENT WORKAROUND: View DDL per-column masking (predates built-in masking)\n-- Dev view masked:\nCREATE VIEW hdp_sales_dev.shared_orders_curated.orders_dev AS\nSELECT order_id, SHA2(customer_email, 256) AS customer_email FROM ...;\n-- Prod view unmasked:\nCREATE VIEW hdp_sales_prod.shared_orders_curated.orders_prod AS\nSELECT order_id, customer_email FROM ...;\n\n-- TARGET ABAC POLICY (GA since May 2026, status in Henkel UNKNOWN):\n-- CREATE ROW FILTER / COLUMN MASK ON TAG governed_pii;"
    },
    "sampleData": {
      "caption": "Access Enforcement Comparison",
      "columns": ["Security Property", "Current View-DDL Approach", "Target ABAC Policy"],
      "rows": [
        ["Enforcement Granularity", "Per environment (dev vs prod)", "Per user attribute / AD role"],
        ["New PII Column Addition", "Requires view DDL edit & redeploy", "Tag column once; inherits policy"],
        ["Auditability", "Inspect DDL across all views", "Query centralized policy rules"],
        ["Prod PII Protection", "Table / schema grants only", "Enforced dynamically at query time"]
      ]
    },
    "policies": [
      {
        "tagKey": "pii",
        "tagValue": "view_ddl_masked",
        "effect": "Per-column masking written into view DDL; dev view masked, prod unmasked (current_state_assessment.md §3b)"
      },
      {
        "tagKey": "abac_governed_tags",
        "tagValue": "status_unknown",
        "effect": "Attribute-Based Access Control GA since May 2026; whether enabled in Henkel is UNKNOWN (G11)"
      }
    ],
    "versions": {
      "current": {
        "status": "partial",
        "visible": True,
        "description": "Unity Catalog grants via AD groups (APP-HDP-PP-[product]-[env]). PII masking today is applied per-column written into view DDL at creation time (dev masked, prod unmasked). Legitimate workaround because UC table masks do not apply to views, but it is environment separation, not access control.",
        "gaps": [
          "G11: ABAC and automated data classification status is UNKNOWN (one question blocks governance automation planning)",
          "G14: PII masking is environment-based, not user-based — prod PII is protected only by coarse table grants",
          "G8: Classification tag authority undecided between Databricks and DataHub",
          "Migrating from DDL masking to ABAC carries regression risk across every existing view"
        ],
        "notes": [
          "Recommendation: Databricks authoritative for enforcement tags (ABAC reads them), DataHub ingests for display"
        ]
      }
    }
  },
  {
    "id": "s10",
    "category": "product",
    "baseTitle": "Stage 10 — Consumption",
    "owner": "Application teams (Power BI), business users",
    "sourceDoc": "cin_replacement_decision.md",
    "variesByVersion": True,
    "codeExample": {
      "language": "sql",
      "caption": "Power BI DirectQuery consumption from Unity Catalog",
      "code": "-- Application / Power BI team connects directly to published views\nSELECT\n    o.sales_month,\n    o.product_brand,\n    o.total_revenue_eur\nFROM hdp_sales_prod.shared_orders_curated.customer_orders_def_def o\nWHERE o.sales_year = 2026;"
    },
    "sampleData": {
      "caption": "Consumption Channels & Adoption Barriers",
      "columns": ["Consumption Channel", "User Group", "Adoption Constraint", "Key Driver"],
      "rows": [
        ["Power BI Executive Apps", "Business Leadership", "Competing against trusted DWH (H10)", "Perceived benefit / trust"],
        ["Ad Hoc Self-Service", "Financial / Sales Analysts", "No semantic layer or NL access (AI-C1)", "Speed of query answer"],
        ["Legacy DWH (Synapse)", "Enterprise Reporting", "Active system running in parallel", "Historical trust and stability"]
      ]
    },
    "versions": {
      "current": {
        "status": "partial",
        "visible": True,
        "description": "Power BI applications built on data products. Competing against the data warehouse (Synapse) as an established alternative with years of accumulated trust. Synapse modelled output feeds Databricks one-way.",
        "gaps": [
          "G4: DWH position undefined — products compete against working alternative with no decommissioning migration path",
          "G5: No consumer registry or measurement of actual query usage per product",
          "Natural language query access (AI-C1) absent — visible consumption needed to drive adoption"
        ],
        "notes": [
          "The adoption constraint is consumption-side, not production. Products exist but are not being used."
        ]
      },
      "option1": {
        "status": "partial",
        "visible": True,
        "title": "Stage 10 — Consumption (Domain Data Products)",
        "description": "CIN is fully bypassed; consumption is purely via domain and central data products with clear contracts, certified semantics, and direct business domain accountability.",
        "prosCons": {
          "pros": [
            "Direct, unmediated consumption from verified domain data products",
            "Establishes genuine business value and trust"
          ],
          "cons": [
            "Requires migrating legacy Power BI reports off old Synapse/CIN links"
          ]
        }
      },
      "option2": {
        "status": "partial",
        "visible": True,
        "title": "Stage 10 — Consumption (Partly Indirect via CIN)",
        "description": "Consumption remains partly indirect via CIN even after Phase 2 BDC migration completes.",
        "prosCons": {
          "pros": [
            "Lower disruption to existing dashboards reading from CIN views"
          ],
          "cons": [
            "Perpetuates indirect dependency and dual consumption architecture"
          ]
        }
      }
    }
  },
  {
    "id": "s10b",
    "category": "product",
    "baseTitle": "Stage 10b — Data-Scientist Enriched Products",
    "owner": "Data scientists (second producer population)",
    "sourceDoc": "current_state_assessment.md",
    "variesByVersion": False,
    "codeExample": {
      "language": "python",
      "caption": "Data scientist registering ML feature table in Unity Catalog Workspace zone",
      "code": "# Likely what Zone 60 Workspace is reserved for\nimport mlflow\nfrom pyspark.sql import functions as F\n\nfeatures_df = spark.table(\"hdp_sales_dev.shared_orders_curated.customer_orders_def_def\") \\\n    .groupBy(\"customer_id\") \\\n    .agg(F.sum(\"total_amount_eur\").alias(\"customer_ltv\"))\n\nfeatures_df.write.format(\"delta\") \\\n    .mode(\"overwrite\") \\\n    .saveAsTable(\"hdp_sales_dev.self_analytics_workspace.customer_churn_features\")"
    },
    "sampleData": {
      "caption": "Data Scientist Producer Footprint",
      "columns": ["Catalog / Namespace", "Product Type", "Target Consumers", "Governance State"],
      "rows": [
        ["Zone 60 Workspace", "Customer Churn Features", "Marketing automation pipelines", "Governance UNKNOWN (G15)"],
        ["Zone 60 Workspace", "Demand Forecast Predictions", "Supply chain planners", "No published contract"],
        ["Zone 60 Workspace", "Lead Propensity Scores", "Salesforce CRM push", "Ad hoc scheduling"]
      ]
    },
    "versions": {
      "current": {
        "status": "unknown",
        "visible": True,
        "description": "Data scientists consume data products AND create their own enriched products. Narrows 'domains lack technical capability' constraint — technical capability exists outside DxD. Likely what Zone 60 Workspace is for. Governance status is UNKNOWN.",
        "gaps": [
          "G15: Governance status unknown — whether these products follow naming conventions or are shadow products",
          "No SLAs, data contracts, or published shared_ interfaces for data science features"
        ],
        "notes": [
          "If governed -> evidence self-service CAN work here. If not -> shadow products inside the platform."
        ]
      }
    }
  },
  {
    "id": "s11",
    "category": "governance",
    "baseTitle": "Stage 11 — Operate",
    "owner": "DxD",
    "sourceDoc": "workflow_and_environment_design.md",
    "variesByVersion": False,
    "codeExample": {
      "language": "sql",
      "caption": "Automated orphan check and freshness assertion (missing today)",
      "code": "-- Orphan detection check (informational PK/FK not enforced by UC)\nSELECT\n    o.sales_order_id,\n    o.sap_material_id\nFROM hdp_sales_dev.self_orders_enriched.order_items o\nLEFT ANTI JOIN hdp_sales_dev.source_cma_material_curated.material_dim m\n    ON o.sap_material_id = m.material_id;\n-- If rows returned: orphan references exist, trigger structured incident event"
    },
    "sampleData": {
      "caption": "Operational Capability Assessment",
      "columns": ["Operational Capability", "Target State", "Current Henkel Reality", "Incident Impact"],
      "rows": [
        ["Pipeline Break Detection", "Automated job alert & error isolation", "Manual step-by-step tracing", "High engineer MTTR"],
        ["Freshness SLA Monitoring", "Automated breach notification (G2)", "No monitoring; user complains", "Silent data staleness"],
        ["Incident Event Architecture", "Structured machine-readable events (P2)", "Unstructured emails / none", "Blocks AI agent automation"],
        ["Consumer Notification", "Automated push to downstream users", "Absent", "Broken dashboard cascades"]
      ]
    },
    "versions": {
      "current": {
        "status": "missing",
        "visible": True,
        "description": "When a pipeline breaks today, engineers trace it manually, step by step. Missing: automated break detection, freshness SLA monitoring, structured incident events, consumer notification when a product breaks.",
        "gaps": [
          "G2: No freshness or quality monitoring — nobody knows a product is stale until someone complains",
          "Pipeline breaks found manually, step by step",
          "G10: No structured incident events — blocks later automation and agent-readiness (properties P1/P2)"
        ],
        "notes": [
          "Agent-readiness is earned here at no extra cost: emit structured events rather than human emails with scoped service principal actions."
        ]
      }
    }
  },
  {
    "id": "s12",
    "category": "governance",
    "baseTitle": "Stage 12 — Evolve & Retire",
    "owner": "Business owner decides, DxD executes",
    "sourceDoc": "workflow_and_environment_design.md",
    "variesByVersion": False,
    "codeExample": {
      "language": "yaml",
      "caption": "Data contract deprecation and retirement specification",
      "code": "contract_version: \"2.1.0\"\nstatus: \"deprecated\"\ndeprecation_policy:\n  announcement_date: \"2026-09-10\"\n  sunset_date: \"2026-12-31\"\n  successor_product: \"hdp_sales_dev.shared_orders_v2.orders_curated\"\n  breaking_changes:\n    - field: \"customer_legacy_id\"\n      action: \"removed\"\n      mitigation: \"Join via mdm_customer_golden_record\""
    },
    "sampleData": {
      "caption": "Product Lifecycle Governance Register",
      "columns": ["Lifecycle Phase", "Required Action", "Enforcement Mechanism", "Henkel Status"],
      "rows": [
        ["Minor Evolution", "Backward-compatible schema expansion", "CI schema-diff check", "Informal"],
        ["Breaking Change", "Notice period + semantic major bump", "Consumer registry impact analysis", "Missing (G6)"],
        ["Retirement / Sunset", "Identify active consumers & decommission", "Usage query audit & sign-off", "Missing (G7)"]
      ]
    },
    "versions": {
      "current": {
        "status": "missing",
        "visible": True,
        "description": "Missing: breaking-change policy and notice period, consumer impact analysis before changes ship, retirement process for products with no consumers, and contract versioning. Retirement is as valuable as building: maintaining products nobody uses is a permanent capacity tax.",
        "gaps": [
          "G6: No breaking-change process — producers change things; consumers discover by breakage",
          "G7: No retirement process — permanent maintenance tax on unused products"
        ],
        "notes": [
          "Feeds back into Stage 0: a change or retirement decision re-enters intake rather than happening informally."
        ]
      }
    }
  },
  {
    "id": "x-uc",
    "category": "governance",
    "baseTitle": "Unity Catalog",
    "owner": "hdp_ppr_catalogmanager / DxD",
    "sourceDoc": "workflow_and_environment_design.md",
    "variesByVersion": False,
    "codeExample": {
      "language": "sql",
      "caption": "Unity Catalog metadata and access hierarchy definition",
      "code": "-- Metastore -> Catalog -> Schema -> Table/View\n-- Catalog naming: hdp_{ProductName}_{Environment}\nCREATE CATALOG IF NOT EXISTS hdp_sales_dev;\nGRANT ALL PRIVILEGES ON CATALOG hdp_sales_dev TO `APP-HDP-PP-sales-dev`;\nGRANT BROWSE ON CATALOG hdp_sales_dev TO `account users`;"
    },
    "sampleData": {
      "caption": "Unity Catalog Architecture Positioning",
      "columns": ["Layer", "System Location", "Stores Real Data?", "Authoritative Role"],
      "rows": [
        ["Metastore", "Account level (one per account)", "No", "Top-level governance boundary"],
        ["Catalog", "Inside Databricks", "No", "Product namespace (hdp_{product}_{env})"],
        ["Schema", "Inside Databricks", "No", "Zone representation (10-Raw..50-Serving)"],
        ["Delta Table", "Inside Databricks storage", "Yes (Parquet + _delta_log)", "Stateful data storage"],
        ["Shared View", "Inside Databricks metadata", "No (SQL query text)", "Zero-copy live mirror endpoint"]
      ]
    },
    "versions": {
      "current": {
        "status": "ok",
        "visible": True,
        "description": "INSIDE Databricks. Technical metadata, schema, lineage, and access enforcement. Stores no data itself. Spans stages 2–9: issues grants at Stage 9 and produces lineage DataHub ingests at Stage 8. Authoritative for classification tags used in enforcement.",
        "gaps": [
          "G11: ABAC and automated data classification status is UNKNOWN",
          "Lossy contract projection: UC has comments, tags, and informational constraints, but no first-class contract object"
        ],
        "notes": [
          "Cross-cutting here means spans many stages — it is INSIDE Databricks, not outside."
        ]
      }
    }
  },
  {
    "id": "x-dh",
    "category": "governance",
    "baseTitle": "DataHub (Henkel Data Hub)",
    "owner": "DataHub team",
    "sourceDoc": "workflow_and_environment_design.md",
    "variesByVersion": False,
    "codeExample": {
      "language": "yaml",
      "caption": "DataHub entity definition linking business glossary to Databricks table",
      "code": "urn: \"urn:li:dataset:(urn:li:dataPlatform:databricks,hdp_sales_dev.shared_orders_curated.customer_orders_def_def,PROD)\"\nproperties:\n  description: \"Certified monthly customer order facts\"\nglossary_terms:\n  - \"urn:li:glossaryTerm:GrossRevenue\"\n  - \"urn:li:glossaryTerm:ConformedCustomer\""
    },
    "sampleData": {
      "caption": "DataHub Four Confirmed Capabilities",
      "columns": ["Capability", "Confirmed Name", "Implementation Reality", "System Authority"],
      "rows": [
        ["Data Marketplace", "Henkel Data Hub", "Early rollout", "Discovery surface, not control plane"],
        ["End-to-End Lineage", "Henkel Data Hub", "Populated across Databricks, SAP, DWH", "Technical lineage ingestion"],
        ["Business Glossary", "Henkel Data Hub", "Near-empty (handful of terms)", "Meaning & definitions surface"],
        ["Search Functionality", "Henkel Data Hub", "Active", "Cross-platform search"]
      ]
    },
    "versions": {
      "current": {
        "status": "partial",
        "visible": True,
        "description": "OUTSIDE Databricks. Business glossary, certified definitions, cross-platform discovery, aggregated lineage. Enforces nothing. It is a discovery and meaning surface, not a control plane.",
        "gaps": [
          "Glossary holds only handful of terms — 'just rolling out'",
          "Metric definition authoring ownership unresolved with Application teams"
        ],
        "notes": [
          "Governance should NOT maintain definitions (that creates a bottleneck); governance owns the STANDARD for definitions; owners author content."
        ]
      }
    }
  },
  {
    "id": "x-git",
    "category": "governance",
    "baseTitle": "Git (Azure DevOps)",
    "owner": "DxD engineering",
    "sourceDoc": "workflow_and_environment_design.md",
    "variesByVersion": False,
    "codeExample": {
      "language": "yaml",
      "caption": "Open Data Contract Standard (ODCS) specification in Git",
      "code": "dataContractSpecification: 0.9.3\nid: urn:henkel:dataproduct:sales:customer-orders\ninfo:\n  title: Customer Orders Data Product\n  version: 1.0.0\n  owner: Sales Analytics DxD Team\nservers:\n  production:\n    type: databricks\n    catalog: hdp_sales_prod\n    schema: shared_orders_curated\nmodels:\n  customer_orders_def_def:\n    description: Stable conformed orders view\n    fields:\n      sales_order_id:\n        type: string\n        required: true\n      net_value_eur:\n        type: decimal(18,2)\n        required: true"
    },
    "sampleData": {
      "caption": "Contract Authority & Dual-Home Arrangement",
      "columns": ["Job", "Home", "Why", "Format"],
      "rows": [
        ["Negotiated Promise", "Git (Azure DevOps)", "Needs diff, PR review before changes ship, and CI validation", "YAML (ODCS)"],
        ["Runtime Metadata", "Unity Catalog", "Visible to consumers browsing Catalog Explorer", "Comments, Tags, Constraints"],
        ["Runtime Freshness Check", "Databricks Job / DLT", "Git cannot enforce SLAs at runtime; needs monitoring", "Automated assertions"]
      ]
    },
    "versions": {
      "current": {
        "status": "ok",
        "visible": True,
        "description": "System of record for data contracts, product specifications, pipeline code, infrastructure definitions, and CI checks. Authored in Git, deployed into Unity Catalog.",
        "gaps": [
          "G1: Data contracts do not exist today in Git repositories",
          "CI checks for contract compatibility not yet implemented"
        ],
        "notes": [
          "Contracts live in Git as YAML (system of record) and deploy to Databricks (runtime metadata). Lossy projection: UC has no first-class contract object."
        ]
      }
    }
  },
  {
    "id": "x-gov",
    "category": "governance",
    "baseTitle": "Governance Function",
    "owner": "Central Governance Team",
    "sourceDoc": "workflow_and_environment_design.md",
    "variesByVersion": False,
    "codeExample": {
      "language": "yaml",
      "caption": "Governed tag and sensitivity classification standard definition",
      "code": "governance_standard:\n  name: Henkel Global Data Classification Standard\n  taxonomy:\n    confidentiality:\n      - Public\n      - Internal\n      - Confidential\n      - Strictly Confidential (PII / Financial)\n  pruning_discipline:\n    rule: \"Any criterion that has never caused a rejection or fix is ceremony and is dropped at review\""
    },
    "sampleData": {
      "caption": "Governance Role Division",
      "columns": ["Entity", "Responsible Party", "Role", "Enforcement Mechanism"],
      "rows": [
        ["Policy Content & Rules", "Governance Team", "Defines what the rules are", "Standards & taxonomy documentation"],
        ["Execution & Automation", "Data Architecture / DxD", "Automates how rules are followed", "Templates, CI, ABAC policies"],
        ["Meaning & Lineage Display", "DataHub Team", "Presents what exists", "Henkel Data Hub UI"]
      ]
    },
    "versions": {
      "current": {
        "status": "unknown",
        "visible": True,
        "description": "Organisational, not a system. Owns policy, classification taxonomy, and the standards that definitions and contracts must meet. Current implementation state is UNKNOWN — what has actually been published vs chartered has not been established.",
        "gaps": [
          "Governance team implementation state unknown (tool-enforced vs people-followed policies)",
          "Pruning discipline required: criteria that never cause a rejection are ceremony and must be pruned"
        ]
      }
    }
  },
  {
    "id": "bdc-node",
    "category": "external",
    "baseTitle": "SAP BDC (Business Data Cloud)",
    "owner": "SAP / Platform Team",
    "sourceDoc": "cin_replacement_decision.md",
    "variesByVersion": True,
    "codeExample": {
      "language": "sql",
      "caption": "BDC Connect Delta Share mounted inside Databricks",
      "code": "-- BDC Connect delivers SAP data via Delta (Open) Share\n-- Verified from internal BI Evolution source document\nCREATE SHARE IF NOT EXISTS sap_bdc_finance_share;\n-- Data maps directly to Domain Data Products, bypassing CIN"
    },
    "sampleData": {
      "caption": "SAP BDC Successor Specifications",
      "columns": ["Component", "Confirmed Technology", "Deployment Target", "Protocol"],
      "rows": [
        ["Ingestion Mechanism", "BDC Connect", "Databricks Metastore", "Delta (Open) Share"],
        ["Upstream Source", "SAP S4/HANA / Datasphere", "SAP Cloud", "Direct Delta Share"],
        ["Intermediate Routing", "Bypasses CIN", "Domain Data Products", "Zero-copy direct mount"]
      ]
    },
    "versions": {
      "current": {
        "status": "ok",
        "visible": False,
        "description": "SAP Business Data Cloud (BDC) — confirmed successor to P47 in Henkel future state. Delivers into Databricks via BDC Connect (Delta/Open Share)."
      },
      "option1": {
        "status": "ok",
        "visible": True,
        "title": "SAP BDC · BDC Connect (Delta Share)",
        "description": "Option 1 Phase 2: Sources switch to SAP BDC. Delivers directly into Databricks via BDC Connect (Delta/Open Share). Hangfire and CIN are struck through and bypassed completely.",
        "prosCons": {
          "pros": [
            "Confirmed mechanism delivering directly into Databricks via Delta (Open) Share",
            "Completely eliminates legacy P47, Hangfire, and CIN from the chain"
          ],
          "cons": [
            "Requires domain data products to adapt to new BDC-sourced views"
          ]
        }
      },
      "option2": {
        "status": "ok",
        "visible": True,
        "title": "SAP BDC (Inside CIN Extractor)",
        "description": "Option 2 Phase 2: SAP extractors move into BDC inside CIN, building both a compatibility view and a new S4-native view. Consumption remains partly indirect via CIN.",
        "prosCons": {
          "pros": [
            "Centralizes BDC integration inside existing CIN component"
          ],
          "cons": [
            "Retains CIN as an intermediary bottleneck between SAP BDC and domain products"
          ]
        }
      }
    }
  }
]

out = "import { PipelineNode } from './schema';\n\nexport const PIPELINE_NODES: PipelineNode[] = " + json.dumps(nodes, indent=2) + ";\n"
with open('src/data/nodes.ts', 'w') as f:
    f.write(out)
print('Successfully wrote src/data/nodes.ts with JSON serialization')
