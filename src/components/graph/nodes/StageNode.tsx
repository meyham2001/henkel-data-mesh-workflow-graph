import React, { memo, useMemo } from 'react';
import { Handle, Position, NodeProps, Node } from '@xyflow/react';
import { Shield, Layers, Database, Sparkles, RefreshCw, GitCompare, ArrowUpRight, ArrowDownRight, Link2, Server } from 'lucide-react';
import { PipelineNode } from '../../../data/schema';
import { useAppStore } from '../../../store/appStore';
import { resolveContent } from '../../../data/resolveContent';
import { useConnectedLineage } from '../../../hooks/useConnectedLineage';
import { PLATFORM_METADATA } from '../../../data/platformPlacement';

export type StageNodeType = Node<PipelineNode, 'stage'>;

export const StageNode: React.FC<NodeProps<StageNodeType>> = memo(({ data }) => {
  const {
    selectedVersion,
    selectedNodeId,
    setSelectedNodeId,
    selectedEdgeId,
    filterStatus,
    isStatsModalOpen,
    selectedPlatformFilter,
  } = useAppStore();
  const connectedLineage = useConnectedLineage();
  const content = resolveContent(data, selectedVersion);
  const platform = PLATFORM_METADATA[data.id];

  const isSelected = selectedNodeId === data.id;
  const isEdgeSource = connectedLineage?.sourceId === data.id;
  const isEdgeTarget = connectedLineage?.targetId === data.id;
  const isConnectedToEdge = connectedLineage ? connectedLineage.connectedNodeIds.has(data.id) : false;
  const isDimmedByEdge = selectedEdgeId !== null && !isConnectedToEdge;

  // KPI Filter Highlighting
  const isKpiActive = isStatsModalOpen && filterStatus !== null;
  const matchesKpi = isKpiActive && (
    filterStatus === 'gaps'
      ? Boolean(content.gaps && content.gaps.length > 0)
      : content.status === filterStatus
  );
  const isDimmedByKpi = isKpiActive && !matchesKpi;

  // Platform Filter Highlighting
  const matchesPlatform = useMemo(() => {
    if (!selectedPlatformFilter) return true;
    if (!platform) return false;
    if (selectedPlatformFilter === 'inside_databricks') {
      return (
        platform.platformId === 'inside_databricks' ||
        platform.platformId === 'unity_catalog'
      );
    }
    if (selectedPlatformFilter === 'unity_catalog') {
      return platform.platformId === 'unity_catalog';
    }
    return platform.platformId === selectedPlatformFilter;
  }, [selectedPlatformFilter, platform]);

  const isPlatformActive = Boolean(selectedPlatformFilter);
  const isHighlightedByPlatform = isPlatformActive && matchesPlatform;
  const isDimmedByPlatform = isPlatformActive && !matchesPlatform;

  const isDimmed = isDimmedByEdge || isDimmedByKpi || isDimmedByPlatform;

  // Status-driven colors
  const statusStyles = {
    ok: {
      border: 'border-l-status-ok',
      badge: 'bg-status-ok/15 text-status-ok border-status-ok/30',
      dot: 'bg-status-ok',
      label: 'Established',
    },
    partial: {
      border: 'border-l-status-partial',
      badge: 'bg-status-partial/15 text-status-partial border-status-partial/30',
      dot: 'bg-status-partial',
      label: 'Partial',
    },
    missing: {
      border: 'border-l-status-missing',
      badge: 'bg-status-missing/15 text-status-missing border-status-missing/30',
      dot: 'bg-status-missing',
      label: 'Missing / Unowned',
    },
    unknown: {
      border: 'border-l-status-unknown',
      badge: 'bg-status-unknown/15 text-status-unknown border-status-unknown/30',
      dot: 'bg-status-unknown',
      label: 'Unknown',
    },
  }[content.status];

  const getCategoryIcon = () => {
    switch (data.category) {
      case 'source':
        return <Database size={12} className="text-blue-400" />;
      case 'zone':
        return <Layers size={12} className="text-teal-400" />;
      case 'product':
        return <Sparkles size={12} className="text-amber-400" />;
      case 'container':
        return <RefreshCw size={12} className="text-purple-400" />;
      default:
        return <Layers size={12} className="text-dim" />;
    }
  };

  return (
    <div
      onClick={() => setSelectedNodeId(data.id)}
      className={`relative w-[280px] sm:w-[310px] rounded-xl p-3.5 bg-[#141826] border border-border border-l-4 ${statusStyles.border} transition-all duration-300 cursor-pointer hover:translate-y-[-2px] hover:border-white/30 hover:shadow-lg ${
        isSelected
          ? 'ring-2 ring-white shadow-2xl bg-[#191e32] translate-y-[-2px] glow-selected'
          : matchesKpi
          ? `ring-2 ${
              filterStatus === 'ok'
                ? 'ring-status-ok shadow-[0_0_20px_rgba(92,184,122,0.35)]'
                : filterStatus === 'partial'
                ? 'ring-status-partial shadow-[0_0_20px_rgba(232,178,94,0.35)]'
                : filterStatus === 'missing'
                ? 'ring-status-missing shadow-[0_0_20px_rgba(232,117,106,0.35)]'
                : filterStatus === 'unknown'
                ? 'ring-status-unknown shadow-[0_0_20px_rgba(160,138,224,0.35)]'
                : 'ring-rose-400 shadow-[0_0_20px_rgba(251,113,133,0.35)]'
            } bg-[#161c2e] translate-y-[-2px]`
          : isHighlightedByPlatform
          ? 'ring-2 ring-sky-400 shadow-[0_0_25px_rgba(56,189,248,0.4)] bg-[#131b2e] translate-y-[-2px]'
          : isEdgeSource
          ? 'ring-2 ring-blue-400 shadow-[0_0_25px_rgba(56,189,248,0.45)] bg-[#172036] translate-y-[-2px]'
          : isEdgeTarget
          ? 'ring-2 ring-teal-400 shadow-[0_0_25px_rgba(45,212,191,0.45)] bg-[#132427] translate-y-[-2px]'
          : isConnectedToEdge
          ? 'ring-1 ring-blue-500/40 shadow-lg bg-[#161a2c]'
          : isDimmed
          ? 'opacity-25 grayscale-[35%] hover:opacity-50'
          : 'shadow-md'
      }`}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!w-2.5 !h-2.5 !bg-blue-400 !border-2 !border-[#141826] transition-transform hover:scale-125"
      />

      {/* Header */}
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-1.5">
          {getCategoryIcon()}
          <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-mute">
            {data.id.toUpperCase()}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span
            className={`text-[9.5px] font-semibold px-2 py-0.5 rounded-full border flex items-center gap-1 ${statusStyles.badge}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${statusStyles.dot}`}></span>
            {statusStyles.label}
          </span>
        </div>
      </div>

      {/* Title */}
      <h3 className="text-sm font-bold text-white tracking-tight leading-snug line-clamp-2 mb-1">
        {content.title || data.baseTitle}
      </h3>

      {/* Platform & System Environment Tag */}
      {platform && (
        <div className="mb-1.5 flex items-center">
          <span
            className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-md border flex items-center gap-1.5 shadow-sm ${platform.badgeStyle.bg} ${platform.badgeStyle.text} ${platform.badgeStyle.border}`}
            title={`${platform.systemName} · ${platform.zoneTitle}`}
          >
            {platform.platformId === 'inside_databricks' || platform.platformId === 'unity_catalog' ? (
              <Server size={10} className="text-sky-400 shrink-0" />
            ) : platform.platformId === 'straddles_boundary' ? (
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse shrink-0" />
            ) : platform.platformId === 'home_undecided' ? (
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
            ) : (
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0" />
            )}
            <span className="truncate">{platform.boundaryTag}</span>
          </span>
        </div>
      )}

      {/* Owner & Category chips */}
      <div className="flex items-center gap-1.5 flex-wrap text-[10px] text-dim mb-2">
        <span className="truncate max-w-[170px] bg-white/5 px-2 py-0.5 rounded text-mute font-medium">
          {data.owner.split('·')[0].trim()}
        </span>
        {data.variesByVersion && (
          <span
            className="bg-amber-500/20 text-amber-300 font-bold px-2 py-0.5 rounded-full text-[9.5px] border border-amber-500/30 flex items-center gap-1 shadow-sm hover:bg-amber-500/30 transition-colors"
            title="Architecture varies across Current State, Option 1 (Distributed), and Option 2 (Centralized). Click node to inspect and compare variations."
          >
            <GitCompare size={10} className="text-amber-400" />
            <span>3 Variations</span>
          </span>
        )}
      </div>

      {/* Policies indicator */}
      {data.policies && data.policies.length > 0 && (
        <div className="flex items-center gap-1 pt-1.5 border-t border-white/5 text-[10px] text-purple-300 font-medium">
          <Shield size={11} className="text-purple-400" />
          <span>{data.policies.length} Policy Attached</span>
        </div>
      )}

      {/* Selection pill */}
      {isSelected && (
        <div className="absolute -top-2.5 right-3 bg-white text-black text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full shadow-md">
          Selected
        </div>
      )}

      {/* Lineage Connection Pills */}
      {isEdgeSource && !isSelected && (
        <div className="absolute -top-2.5 left-3 bg-blue-500 text-white text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full shadow-md flex items-center gap-1 animate-pulse">
          <ArrowUpRight size={10} />
          <span>Upstream Source</span>
        </div>
      )}

      {isEdgeTarget && !isSelected && (
        <div className="absolute -top-2.5 left-3 bg-teal-500 text-black text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full shadow-md flex items-center gap-1 animate-pulse">
          <ArrowDownRight size={10} />
          <span>Downstream Target</span>
        </div>
      )}

      {isConnectedToEdge && !isEdgeSource && !isEdgeTarget && !isSelected && (
        <div className="absolute -top-2.5 right-3 bg-blue-900/90 text-blue-200 border border-blue-500/40 text-[8.5px] font-bold uppercase px-1.5 py-0.5 rounded-full shadow-sm flex items-center gap-1">
          <Link2 size={9} />
          <span>In Lineage</span>
        </div>
      )}

      {/* KPI Filter Pill */}
      {matchesKpi && !isSelected && (
        <div className="absolute -top-2.5 right-3 bg-[#131b2e] text-white border border-white/20 text-[8.5px] font-bold uppercase px-2 py-0.5 rounded-full shadow-md flex items-center gap-1 animate-pulse">
          <span className={`w-1.5 h-1.5 rounded-full ${statusStyles.dot}`} />
          <span>Matches Filter</span>
        </div>
      )}

      {/* Platform Filter Pill */}
      {isHighlightedByPlatform && !isSelected && !matchesKpi && (
        <div className="absolute -top-2.5 right-3 bg-sky-500 text-black text-[8.5px] font-extrabold uppercase px-2 py-0.5 rounded-full shadow-md flex items-center gap-1 animate-pulse">
          <Server size={9} />
          <span>In System Filter</span>
        </div>
      )}

      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-2.5 !h-2.5 !bg-teal-400 !border-2 !border-[#141826] transition-transform hover:scale-125"
      />
    </div>
  );
});

StageNode.displayName = 'StageNode';
