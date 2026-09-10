import React, { useMemo } from 'react';
import { Node, useViewport } from '@xyflow/react';
import { Server, Database, Sparkles, Layers, AlertCircle, ArrowDown } from 'lucide-react';
import { ZONE_DEFINITIONS, ArchitectureZoneId } from '../../data/platformPlacement';
import { useAppStore } from '../../store/appStore';

interface ZoneBoundariesLayerProps {
  nodes: Node[];
}

interface ComputedBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

const DEFAULT_NODE_WIDTH = 310;
const DEFAULT_NODE_HEIGHT = 150;

export const ZoneBoundariesLayer: React.FC<ZoneBoundariesLayerProps> = ({ nodes }) => {
  const { x, y, zoom } = useViewport();
  const { selectedPlatformFilter, setSelectedPlatformFilter, showBoundaries } = useAppStore();

  const getBounds = (nodeIds: string[], padX = 36, padTop = 52, padBottom = 32): ComputedBounds | null => {
    const matchingNodes = nodes.filter((n) => nodeIds.includes(n.id) && n.position);
    if (matchingNodes.length === 0) return null;

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    matchingNodes.forEach((node) => {
      const w = node.measured?.width || DEFAULT_NODE_WIDTH;
      const h = node.measured?.height || DEFAULT_NODE_HEIGHT;
      const nx = node.position.x;
      const ny = node.position.y;

      if (nx < minX) minX = nx;
      if (ny < minY) minY = ny;
      if (nx + w > maxX) maxX = nx + w;
      if (ny + h > maxY) maxY = ny + h;
    });

    return {
      x: Math.round(minX - padX),
      y: Math.round(minY - padTop),
      width: Math.round(maxX - minX + padX * 2),
      height: Math.round(maxY - minY + padTop + padBottom),
    };
  };

  // Specific Unity Catalog sub-box inside Zone 2 (wrapping s2, s3, s4, s5, s6, s7, and x-uc)
  const ucSubBounds = useMemo(() => {
    return getBounds(['s2', 's3', 's4', 's5', 's6', 's7', 'x-uc'], 22, 42, 22);
  }, [nodes]);

  const zoneBounds = useMemo(() => {
    const result: Partial<Record<ArchitectureZoneId, ComputedBounds>> = {};
    (Object.keys(ZONE_DEFINITIONS) as ArchitectureZoneId[]).forEach((zid) => {
      const def = ZONE_DEFINITIONS[zid];
      let b = getBounds(def.nodeIds);
      if (b) {
        if (zid === 'zone_2' && ucSubBounds) {
          // CRITICAL: Databricks Compute & Ingestion layer sits ABOVE Unity Catalog.
          // Zone 2's top must NEVER collapse onto the Unity Catalog boundary, even if Stage 1b is dragged.
          // It is guaranteed to always maintain at least 150px of compute headroom above Unity Catalog.
          const guaranteedTop = Math.min(b.y, ucSubBounds.y - 150);
          const guaranteedBottom = Math.max(b.y + b.height, ucSubBounds.y + ucSubBounds.height + 25);
          const guaranteedLeft = Math.min(b.x, ucSubBounds.x - 15);
          const guaranteedRight = Math.max(b.x + b.width, ucSubBounds.x + ucSubBounds.width + 15);
          b = {
            x: guaranteedLeft,
            y: guaranteedTop,
            width: guaranteedRight - guaranteedLeft,
            height: guaranteedBottom - guaranteedTop,
          };
        }
        result[zid] = b;
      }
    });
    return result;
  }, [nodes, ucSubBounds]);

  const isDatabricksFiltered =
    selectedPlatformFilter === 'inside_databricks' || selectedPlatformFilter === 'unity_catalog';

  if (!showBoundaries) return null;

  return (
    <div
      className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-visible"
      style={{
        transform: `translate(${x}px, ${y}px) scale(${zoom})`,
        transformOrigin: '0 0',
        zIndex: 0,
      }}
    >
      {/* Zone 1: Before the Platform */}
      {zoneBounds.zone_1 && (
        <div
          className={`absolute rounded-3xl border-2 border-dashed border-slate-600/40 bg-slate-900/[0.15] transition-all duration-300 ${
            selectedPlatformFilter === 'outside_databricks'
              ? 'ring-2 ring-slate-300 shadow-[0_0_30px_rgba(255,255,255,0.1)]'
              : ''
          }`}
          style={{
            left: zoneBounds.zone_1.x,
            top: zoneBounds.zone_1.y,
            width: zoneBounds.zone_1.width,
            height: zoneBounds.zone_1.height,
          }}
        >
          <div className="absolute top-3 left-4 flex items-center gap-2 pointer-events-auto">
            <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-slate-800/80 border border-slate-600/50 text-slate-300 text-[11px] font-bold uppercase tracking-wider shadow-sm">
              <Database size={12} className="text-slate-400" />
              <span>Zone 1: Before the Platform</span>
              <span className="text-slate-400 font-normal">· Business Domain & ADF Extraction</span>
            </span>
          </div>
        </div>
      )}

      {/* Zone 2: Databricks / Unity Catalog Platform Boundary */}
      {zoneBounds.zone_2 && (
        <div
          className={`absolute rounded-3xl border-2 transition-all duration-300 ${
            isDatabricksFiltered
              ? 'border-sky-400 ring-4 ring-sky-500/30 bg-sky-500/[0.06] shadow-[0_0_90px_rgba(56,189,248,0.22)]'
              : 'border-sky-500/50 bg-sky-500/[0.025] shadow-[0_0_60px_rgba(56,189,248,0.06)]'
          }`}
          style={{
            left: zoneBounds.zone_2.x,
            top: zoneBounds.zone_2.y,
            width: zoneBounds.zone_2.width,
            height: zoneBounds.zone_2.height,
          }}
        >
          {/* Top Header: Databricks / UC Core Pipeline */}
          <div className="absolute -top-3.5 left-6 right-6 flex items-center justify-between gap-3 pointer-events-auto">
            <div className="flex items-center gap-2 bg-[#0d1527] px-3 py-1 rounded-full border border-sky-400/60 shadow-lg text-sky-300 text-[11px] font-bold tracking-wide">
              <Server size={12} className="text-sky-400 animate-pulse" />
              <span className="flex items-center gap-1.5">
                ZONE 2: DATABRICKS & UNITY CATALOG CORE PIPELINE
              </span>
              <span className="text-sky-400/60 text-[10px] font-medium hidden md:inline">
                · DxD Governed Platform (Zones 10–50)
              </span>
            </div>

            <button
              onClick={() =>
                setSelectedPlatformFilter(isDatabricksFiltered ? null : 'inside_databricks')
              }
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border transition-all ${
                isDatabricksFiltered
                  ? 'bg-sky-400 text-black border-sky-300 shadow-md'
                  : 'bg-sky-500/20 text-sky-300 border-sky-500/40 hover:bg-sky-500/30'
              }`}
              title="Filter to only show components inside Databricks"
            >
              {isDatabricksFiltered ? 'Showing Databricks ✕' : 'Isolate Databricks'}
            </button>
          </div>

          {/* Compute Layer banner inside Zone 2 */}
          <div className="absolute top-5 left-5 right-5 pointer-events-auto flex items-center justify-between bg-sky-950/40 border border-sky-500/20 px-3 py-1 rounded-xl text-[10.5px] text-sky-200/80">
            <div className="flex items-center gap-1.5 truncate">
              <span className="font-bold text-sky-300">Compute Layer:</span>
              <span className="truncate">
                Ingestion Landing (Stage 1b CIN / SAP BDC) · SQL Warehouses, Lakeflow, Notebooks execute transformations outside UC.
              </span>
            </div>
            <span className="text-[9.5px] bg-sky-500/10 px-1.5 py-0.5 rounded border border-sky-500/20 text-sky-300 font-mono shrink-0 hidden sm:inline">
              Outside Unity Catalog
            </span>
          </div>

          {/* Nested Unity Catalog Box */}
          {ucSubBounds && (
            <div
              className="absolute rounded-2xl border border-indigo-500/35 bg-indigo-950/[0.15] transition-all duration-200"
              style={{
                left: ucSubBounds.x - zoneBounds.zone_2.x,
                top: ucSubBounds.y - zoneBounds.zone_2.y,
                width: ucSubBounds.width,
                height: ucSubBounds.height,
              }}
            >
              <div className="absolute -top-3 left-4 flex items-center gap-1.5 bg-[#12162e] px-2.5 py-0.5 rounded-md border border-indigo-500/40 text-indigo-300 text-[10px] font-bold tracking-wide shadow-md">
                <Layers size={11} className="text-indigo-400" />
                <span>UNITY CATALOG — METADATA & ACCESS LAYER</span>
                <span className="text-indigo-400/60 font-mono text-[9px] font-normal hidden md:inline">
                  (metastore → catalog → schema → table)
                </span>
              </div>
              <div className="absolute -bottom-2.5 right-4 bg-[#12162e]/90 px-2 py-0.5 rounded border border-indigo-500/30 text-[9px] text-indigo-300/80 font-mono">
                Schemas: self_{'{module}'}_* · external_* · shared_* · source_*
              </div>
            </div>
          )}

          {/* Bottom Egress: Core pipeline hand-off */}
          <div className="absolute -bottom-3 left-6 right-6 flex items-center justify-between pointer-events-auto">
            <div className="flex items-center gap-2 bg-[#0d1527] px-3 py-0.5 rounded-full border border-sky-400/40 shadow-lg text-sky-300 text-[10px] font-semibold tracking-wide">
              <ArrowDown size={10} className="text-sky-400" />
              <span>Core Pipeline Egress (Stage 7 Serving)</span>
              <span className="text-sky-400/60 text-[9.5px] font-normal hidden md:inline">
                · Hand-off to Discovery, Consumption & ML Workspaces
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Zone 3: Discovery, Access & Consumption */}
      {zoneBounds.zone_3 && (
        <div
          className={`absolute rounded-3xl border-2 border-dashed border-teal-500/35 bg-teal-950/[0.12] transition-all duration-300 ${
            selectedPlatformFilter === 'outside_databricks'
              ? 'ring-2 ring-teal-400 shadow-[0_0_30px_rgba(45,212,191,0.15)]'
              : ''
          }`}
          style={{
            left: zoneBounds.zone_3.x,
            top: zoneBounds.zone_3.y,
            width: zoneBounds.zone_3.width,
            height: zoneBounds.zone_3.height,
          }}
        >
          <div className="absolute top-3 left-4 flex items-center gap-2 pointer-events-auto">
            <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-teal-950/90 border border-teal-500/40 text-teal-300 text-[11px] font-bold uppercase tracking-wider shadow-sm">
              <Sparkles size={12} className="text-teal-400" />
              <span>Zone 3: Discovery, Access & Consumption</span>
              <span className="text-teal-400/60 font-normal">· DataHub · Security Service · Power BI</span>
            </span>
          </div>
          <div className="absolute bottom-2.5 left-5 text-[10px] text-teal-300/70 italic hidden md:block">
            * Stage 9 straddles boundary: UC issues internal grants, Security Service gates external frontend tools.
          </div>
        </div>
      )}

      {/* Zone 4: Operate & Evolve */}
      {zoneBounds.zone_4 && (
        <div
          className={`absolute rounded-3xl border-2 border-dashed border-amber-500/40 bg-amber-950/[0.12] transition-all duration-300 ${
            selectedPlatformFilter === 'home_undecided'
              ? 'ring-2 ring-amber-400 shadow-[0_0_35px_rgba(232,178,94,0.2)]'
              : ''
          }`}
          style={{
            left: zoneBounds.zone_4.x,
            top: zoneBounds.zone_4.y,
            width: zoneBounds.zone_4.width,
            height: zoneBounds.zone_4.height,
          }}
        >
          <div className="absolute top-3 left-4 flex items-center gap-2 pointer-events-auto">
            <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-amber-950/90 border border-amber-500/50 text-amber-300 text-[11px] font-bold uppercase tracking-wider shadow-sm">
              <AlertCircle size={12} className="text-amber-400" />
              <span>Zone 4: Operate & Evolve</span>
              <span className="text-amber-400/70 font-normal">· Home Undecided (Largest Lifecycle Capability Gap)</span>
            </span>
          </div>
        </div>
      )}

    </div>
  );
};
