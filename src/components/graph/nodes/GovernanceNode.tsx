import React, { memo } from 'react';
import { Handle, Position, NodeProps, Node } from '@xyflow/react';
import { ShieldCheck, BookMarked, GitBranch, Users, Shield, ArrowUpRight, ArrowDownRight, Link2 } from 'lucide-react';
import { PipelineNode } from '../../../data/schema';
import { useAppStore } from '../../../store/appStore';
import { resolveContent } from '../../../data/resolveContent';
import { useConnectedLineage } from '../../../hooks/useConnectedLineage';

export type GovernanceNodeType = Node<PipelineNode, 'governance'>;

export const GovernanceNode: React.FC<NodeProps<GovernanceNodeType>> = memo(({ data }) => {
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
  const matchesPlatform = React.useMemo(() => {
    if (!selectedPlatformFilter) return true;
    if (data.id === 'x-uc') {
      return (
        selectedPlatformFilter === 'inside_databricks' ||
        selectedPlatformFilter === 'unity_catalog'
      );
    }
    if (data.id === 'x-dh' || data.id === 'x-git') {
      return selectedPlatformFilter === 'outside_databricks';
    }
    if (data.id === 'x-gov') {
      return selectedPlatformFilter === 'not_a_system';
    }
    return false;
  }, [selectedPlatformFilter, data.id]);

  const isPlatformActive = Boolean(selectedPlatformFilter);
  const isHighlightedByPlatform = isPlatformActive && matchesPlatform;
  const isDimmedByPlatform = isPlatformActive && !matchesPlatform;

  const isDimmed = isDimmedByEdge || isDimmedByKpi || isDimmedByPlatform;

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

  const getSystemPlacement = () => {
    switch (data.id) {
      case 'x-uc':
        return { text: 'INSIDE DATABRICKS', bg: 'bg-blue-500/20 text-blue-300 border-blue-500/30' };
      case 'x-dh':
        return { text: 'OUTSIDE DATABRICKS', bg: 'bg-amber-500/20 text-amber-300 border-amber-500/30' };
      case 'x-git':
        return { text: 'AUTHORED IN GIT → DEPLOYS TO UC', bg: 'bg-purple-500/20 text-purple-300 border-purple-500/30' };
      case 'x-gov':
        return { text: 'ORGANISATIONAL (TEAM)', bg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' };
      default:
        return { text: 'GOVERNANCE', bg: 'bg-white/10 text-dim border-white/20' };
    }
  };

  const placement = getSystemPlacement();

  const getIcon = () => {
    switch (data.id) {
      case 'x-uc':
        return <ShieldCheck size={14} className="text-blue-400" />;
      case 'x-dh':
        return <BookMarked size={14} className="text-amber-400" />;
      case 'x-git':
        return <GitBranch size={14} className="text-purple-400" />;
      case 'x-gov':
        return <Users size={14} className="text-emerald-400" />;
      default:
        return <ShieldCheck size={14} className="text-dim" />;
    }
  };

  return (
    <div
      onClick={() => setSelectedNodeId(data.id)}
      className={`relative w-[280px] sm:w-[300px] rounded-xl p-3.5 bg-[#141826] border border-border border-l-4 ${statusStyles.border} transition-all duration-300 cursor-pointer hover:translate-y-[-2px] hover:border-white/30 hover:shadow-lg ${
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
        className="!w-2.5 !h-2.5 !bg-purple-400 !border-2 !border-[#141826] transition-transform hover:scale-125"
      />

      {/* Header */}
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-1.5">
          {getIcon()}
          <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-purple-300">
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
      <h3 className="text-sm font-bold text-white tracking-tight leading-snug mb-1.5">{data.baseTitle}</h3>

      {/* System Placement Badge */}
      <div className="mb-2">
        <span
          className={`inline-block text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${placement.bg}`}
        >
          {placement.text}
        </span>
      </div>

      {/* Description preview */}
      <p className="text-[11px] text-dim line-clamp-2 leading-relaxed mb-1.5">
        {content.description}
      </p>

      {/* Policies if present */}
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
          <span>In System Filter</span>
        </div>
      )}

      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-2.5 !h-2.5 !bg-purple-400 !border-2 !border-[#141826] transition-transform hover:scale-125"
      />
    </div>
  );
});

GovernanceNode.displayName = 'GovernanceNode';
