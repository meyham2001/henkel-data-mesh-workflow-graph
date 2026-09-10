import React from 'react';
import { useAppStore } from '../store/appStore';
import { PIPELINE_NODES } from '../data/nodes';
import { resolveContent } from '../data/resolveContent';
import { Status } from '../data/schema';

export const StatsBar: React.FC = () => {
  const {
    selectedVersion,
    filterStatus,
    setFilterStatus,
    isStatsModalOpen,
    setIsStatsModalOpen,
    setSelectedNodeId,
    setSelectedEdgeId,
  } = useAppStore();

  const visibleNodes = PIPELINE_NODES.filter((n) => {
    const c = resolveContent(n, selectedVersion);
    return c.visible !== false;
  });

  const counts = {
    ok: 0,
    partial: 0,
    missing: 0,
    unknown: 0,
    gaps: 0,
  };

  visibleNodes.forEach((n) => {
    const c = resolveContent(n, selectedVersion);
    counts[c.status]++;
    if (c.gaps) {
      counts.gaps += c.gaps.length;
    }
  });

  const openFilter = (status: Status | 'gaps') => {
    // If clicking the active KPI, toggle it closed
    if (isStatsModalOpen && filterStatus === status) {
      setIsStatsModalOpen(false);
      setFilterStatus(null);
      return;
    }

    // Crucial requirement: deselect any previously selected entity or connection line
    setSelectedNodeId(null);
    setSelectedEdgeId(null);

    // Open KPI drawer
    setFilterStatus(status);
    setIsStatsModalOpen(true);
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 w-full max-w-7xl mx-auto px-4 py-2">
      <button
        onClick={() => openFilter('ok')}
        className={`p-2.5 sm:p-3 rounded-xl bg-[#141826] border transition-all text-left group shadow ${
          isStatsModalOpen && filterStatus === 'ok'
            ? 'ring-2 ring-status-ok bg-status-ok/[0.12] border-status-ok shadow-lg'
            : 'border-border hover:border-status-ok/40 hover:bg-status-ok/[0.04]'
        }`}
      >
        <div className="text-xl sm:text-2xl font-bold font-mono text-status-ok group-hover:scale-105 transition-transform">
          {counts.ok}
        </div>
        <div className="text-[11px] text-mute font-medium mt-0.5 flex items-center justify-between">
          <span>Established</span>
          <span className={`text-[9px] transition-all font-semibold ${
            isStatsModalOpen && filterStatus === 'ok'
              ? 'text-status-ok opacity-100'
              : 'opacity-0 group-hover:opacity-80'
          }`}>
            {isStatsModalOpen && filterStatus === 'ok' ? 'Active ✕' : 'View →'}
          </span>
        </div>
      </button>

      <button
        onClick={() => openFilter('partial')}
        className={`p-2.5 sm:p-3 rounded-xl bg-[#141826] border transition-all text-left group shadow ${
          isStatsModalOpen && filterStatus === 'partial'
            ? 'ring-2 ring-status-partial bg-status-partial/[0.12] border-status-partial shadow-lg'
            : 'border-border hover:border-status-partial/40 hover:bg-status-partial/[0.04]'
        }`}
      >
        <div className="text-xl sm:text-2xl font-bold font-mono text-status-partial group-hover:scale-105 transition-transform">
          {counts.partial}
        </div>
        <div className="text-[11px] text-mute font-medium mt-0.5 flex items-center justify-between">
          <span>Partially In Place</span>
          <span className={`text-[9px] transition-all font-semibold ${
            isStatsModalOpen && filterStatus === 'partial'
              ? 'text-status-partial opacity-100'
              : 'opacity-0 group-hover:opacity-80'
          }`}>
            {isStatsModalOpen && filterStatus === 'partial' ? 'Active ✕' : 'View →'}
          </span>
        </div>
      </button>

      <button
        onClick={() => openFilter('missing')}
        className={`p-2.5 sm:p-3 rounded-xl bg-[#141826] border transition-all text-left group shadow ${
          isStatsModalOpen && filterStatus === 'missing'
            ? 'ring-2 ring-status-missing bg-status-missing/[0.12] border-status-missing shadow-lg'
            : 'border-border hover:border-status-missing/40 hover:bg-status-missing/[0.04]'
        }`}
      >
        <div className="text-xl sm:text-2xl font-bold font-mono text-status-missing group-hover:scale-105 transition-transform">
          {counts.missing}
        </div>
        <div className="text-[11px] text-mute font-medium mt-0.5 flex items-center justify-between">
          <span>Missing / Unowned</span>
          <span className={`text-[9px] transition-all font-semibold ${
            isStatsModalOpen && filterStatus === 'missing'
              ? 'text-status-missing opacity-100'
              : 'opacity-0 group-hover:opacity-80'
          }`}>
            {isStatsModalOpen && filterStatus === 'missing' ? 'Active ✕' : 'View →'}
          </span>
        </div>
      </button>

      <button
        onClick={() => openFilter('unknown')}
        className={`p-2.5 sm:p-3 rounded-xl bg-[#141826] border transition-all text-left group shadow ${
          isStatsModalOpen && filterStatus === 'unknown'
            ? 'ring-2 ring-status-unknown bg-status-unknown/[0.12] border-status-unknown shadow-lg'
            : 'border-border hover:border-status-unknown/40 hover:bg-status-unknown/[0.04]'
        }`}
      >
        <div className="text-xl sm:text-2xl font-bold font-mono text-status-unknown group-hover:scale-105 transition-transform">
          {counts.unknown}
        </div>
        <div className="text-[11px] text-mute font-medium mt-0.5 flex items-center justify-between">
          <span>Unknown</span>
          <span className={`text-[9px] transition-all font-semibold ${
            isStatsModalOpen && filterStatus === 'unknown'
              ? 'text-status-unknown opacity-100'
              : 'opacity-0 group-hover:opacity-80'
          }`}>
            {isStatsModalOpen && filterStatus === 'unknown' ? 'Active ✕' : 'View →'}
          </span>
        </div>
      </button>

      <button
        onClick={() => openFilter('gaps')}
        className={`col-span-2 sm:col-span-1 p-2.5 sm:p-3 rounded-xl bg-[#141826] border transition-all text-left group shadow ${
          isStatsModalOpen && filterStatus === 'gaps'
            ? 'ring-2 ring-rose-400 bg-rose-500/[0.12] border-rose-400 shadow-lg'
            : 'border-border hover:border-white/30 hover:bg-white/[0.04]'
        }`}
      >
        <div className="text-xl sm:text-2xl font-bold font-mono text-[#eef0f6] group-hover:scale-105 transition-transform">
          {counts.gaps}
        </div>
        <div className="text-[11px] text-mute font-medium mt-0.5 flex items-center justify-between">
          <span>Identified Gaps</span>
          <span className={`text-[9px] transition-all font-semibold ${
            isStatsModalOpen && filterStatus === 'gaps'
              ? 'text-rose-400 opacity-100'
              : 'opacity-0 group-hover:opacity-80'
          }`}>
            {isStatsModalOpen && filterStatus === 'gaps' ? 'Active ✕' : 'View →'}
          </span>
        </div>
      </button>
    </div>
  );
};
