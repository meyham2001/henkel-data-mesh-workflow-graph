import React, { useEffect } from 'react';
import { X, ArrowRight, AlertTriangle, CheckCircle2, Clock, HelpCircle, Flame } from 'lucide-react';
import { useAppStore } from '../store/appStore';
import { PIPELINE_NODES } from '../data/nodes';
import { resolveContent } from '../data/resolveContent';

export const StatsModal: React.FC = () => {
  const {
    isStatsModalOpen,
    setIsStatsModalOpen,
    filterStatus,
    setFilterStatus,
    setReturnFilterStatus,
    selectedVersion,
    setSelectedNodeId,
  } = useAppStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsStatsModalOpen(false);
        setFilterStatus(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setIsStatsModalOpen, setFilterStatus]);

  if (!isStatsModalOpen || !filterStatus) return null;

  const visibleNodes = PIPELINE_NODES.filter((n) => {
    const content = resolveContent(n, selectedVersion);
    return content.visible !== false;
  });

  const getStatusMeta = () => {
    switch (filterStatus) {
      case 'ok':
        return {
          title: 'Established Stages',
          stripeColor: 'from-emerald-500 via-status-ok to-teal-400',
          icon: <CheckCircle2 size={18} className="text-status-ok" />,
          badgeColor: 'bg-status-ok/20 text-status-ok border-status-ok/30',
          accentBorder: 'hover:border-l-status-ok',
        };
      case 'partial':
        return {
          title: 'Partially Established Stages',
          stripeColor: 'from-amber-500 via-status-partial to-yellow-400',
          icon: <Clock size={18} className="text-status-partial" />,
          badgeColor: 'bg-status-partial/20 text-status-partial border-status-partial/30',
          accentBorder: 'hover:border-l-status-partial',
        };
      case 'missing':
        return {
          title: 'Missing or Unowned Stages',
          stripeColor: 'from-rose-500 via-status-missing to-red-600',
          icon: <Flame size={18} className="text-status-missing" />,
          badgeColor: 'bg-status-missing/20 text-status-missing border-status-missing/30',
          accentBorder: 'hover:border-l-status-missing',
        };
      case 'unknown':
        return {
          title: 'Unknown Governance State',
          stripeColor: 'from-purple-500 via-status-unknown to-indigo-400',
          icon: <HelpCircle size={18} className="text-status-unknown" />,
          badgeColor: 'bg-status-unknown/20 text-status-unknown border-status-unknown/30',
          accentBorder: 'hover:border-l-status-unknown',
        };
      case 'gaps':
        return {
          title: 'Identified Architecture Gaps',
          stripeColor: 'from-rose-400 via-orange-400 to-amber-500',
          icon: <AlertTriangle size={18} className="text-rose-400" />,
          badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
          accentBorder: 'hover:border-l-rose-500',
        };
    }
  };

  const meta = getStatusMeta();

  const getStatusFilteredNodes = () => {
    return visibleNodes.filter((n) => {
      const c = resolveContent(n, selectedVersion);
      return c.status === filterStatus;
    });
  };

  const getAllGaps = () => {
    const gapsList: { stageId: string; stageTitle: string; gapText: string }[] = [];
    visibleNodes.forEach((n) => {
      const c = resolveContent(n, selectedVersion);
      if (c.gaps) {
        c.gaps.forEach((g) => {
          gapsList.push({
            stageId: n.id,
            stageTitle: n.baseTitle,
            gapText: g,
          });
        });
      }
    });
    return gapsList;
  };

  const itemsCount = filterStatus === 'gaps' ? getAllGaps().length : getStatusFilteredNodes().length;

  const handleJump = (stageId: string) => {
    setReturnFilterStatus(filterStatus);
    setIsStatsModalOpen(false);
    setSelectedNodeId(stageId);
  };

  const handleClose = () => {
    setIsStatsModalOpen(false);
    setFilterStatus(null);
    setReturnFilterStatus(null);
  };

  return (
    <div className="absolute top-0 right-0 h-full w-full sm:w-[480px] lg:w-[540px] z-30 bg-[#121624]/95 backdrop-blur-xl border-l border-border shadow-2xl flex flex-col drawer-animate">
      {/* Top glowing gradient accent stripe */}
      <div className={`h-1.5 w-full bg-gradient-to-r ${meta.stripeColor} shrink-0`} />

      {/* Drawer Header */}
      <div className="px-5 sm:px-6 py-4 border-b border-border bg-[#161a2c]/95 flex items-start justify-between gap-3 shrink-0">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 shadow-inner shrink-0 mt-0.5">
            {meta.icon}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight leading-snug">
                {meta.title}
              </h2>
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold border whitespace-nowrap shrink-0 shadow-sm ${meta.badgeColor}`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-current" />
                <span>
                  {itemsCount} {filterStatus === 'gaps' ? 'Total Gaps' : 'Stages'}
                </span>
              </span>
            </div>
            <p className="text-xs text-mute mt-1 leading-normal">
              {filterStatus === 'gaps'
                ? 'Documented technical and operational gaps across pipeline stages'
                : 'Select any stage below to inspect its architecture and contract'}
            </p>
          </div>
        </div>
        <button
          onClick={handleClose}
          className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-dim hover:text-white transition-all border border-border hover:scale-105 shrink-0"
          aria-label="Close"
          title="Close (Esc)"
        >
          <X size={16} />
        </button>
      </div>

      {/* Drawer List Area */}
      <div className="flex-1 overflow-y-auto p-5 divide-y divide-border space-y-2">
        {filterStatus === 'gaps' ? (
          getAllGaps().map((gap, idx) => (
            <div
              key={idx}
              onClick={() => handleJump(gap.stageId)}
              style={{ animationDelay: `${Math.min(idx * 25, 250)}ms` }}
              className={`pt-2.5 first:pt-0 pb-1.5 cursor-pointer group hover:bg-white/[0.04] p-3 rounded-xl transition-all border-l-2 border-transparent ${meta.accentBorder} item-animate`}
            >
              <div className="flex items-center justify-between text-xs font-semibold text-rose-300 mb-1">
                <span className="flex items-center gap-1.5 group-hover:text-rose-200 transition-colors">
                  <AlertTriangle size={13} className="text-rose-400 shrink-0" />
                  <span className="truncate">{gap.stageTitle}</span>
                </span>
                <span className="text-[10.5px] text-mute group-hover:text-white flex items-center gap-1 shrink-0 transition-transform group-hover:translate-x-1 font-medium">
                  Inspect Stage <ArrowRight size={11} />
                </span>
              </div>
              <p className="text-xs text-dim leading-relaxed pl-5 group-hover:text-gray-200 transition-colors">
                {gap.gapText}
              </p>
            </div>
          ))
        ) : (
          getStatusFilteredNodes().map((n, idx) => {
            const c = resolveContent(n, selectedVersion);
            return (
              <div
                key={n.id}
                onClick={() => handleJump(n.id)}
                style={{ animationDelay: `${Math.min(idx * 25, 250)}ms` }}
                className={`pt-2.5 first:pt-0 pb-1.5 cursor-pointer group hover:bg-white/[0.04] p-3 rounded-xl transition-all border-l-2 border-transparent ${meta.accentBorder} item-animate`}
              >
                <div className="flex items-center justify-between text-xs font-semibold text-white mb-0.5">
                  <span className="group-hover:text-blue-400 transition-colors text-sm font-bold flex items-center gap-2">
                    <span className="font-mono text-[10px] text-mute group-hover:text-blue-300">
                      {n.id.toUpperCase()}
                    </span>
                    {n.baseTitle}
                  </span>
                  <span className="text-[10.5px] text-mute group-hover:text-white flex items-center gap-1 shrink-0 transition-transform group-hover:translate-x-1 font-medium">
                    View Details <ArrowRight size={11} />
                  </span>
                </div>
                <div className="text-[11px] text-mute mb-1 font-medium">{n.owner}</div>
                <p className="text-xs text-dim line-clamp-2 leading-relaxed group-hover:text-gray-200 transition-colors">
                  {c.description}
                </p>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
