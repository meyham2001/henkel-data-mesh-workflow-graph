import React, { useEffect, useState } from 'react';
import {
  X,
  ArrowUpRight,
  ArrowDownRight,
  ArrowLeft,
  AlertTriangle,
  Info,
  ThumbsUp,
  ThumbsDown,
  BookOpen,
  User,
  GitCompare,
  Sliders,
  Check,
  Server,
} from 'lucide-react';
import { useAppStore } from '../../store/appStore';
import { PIPELINE_NODES } from '../../data/nodes';
import { PIPELINE_EDGES } from '../../data/edges';
import { resolveContent } from '../../data/resolveContent';
import { VERSIONS } from '../../data/versions';
import { CodeBlock } from './CodeBlock';
import { SampleDataTable } from './SampleDataTable';
import { PolicyTooltip } from './PolicyTooltip';
import { Status } from '../../data/schema';
import { PLATFORM_METADATA } from '../../data/platformPlacement';

export const DetailPanel: React.FC = () => {
  const {
    selectedNodeId,
    setSelectedNodeId,
    selectedVersion,
    setSelectedVersion,
    returnFilterStatus,
    setReturnFilterStatus,
    setFilterStatus,
    setIsStatsModalOpen,
  } = useAppStore();
  const [showCompareAll, setShowCompareAll] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedNodeId(null);
        setReturnFilterStatus(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setSelectedNodeId, setReturnFilterStatus]);

  if (!selectedNodeId) return null;

  const node = PIPELINE_NODES.find((n) => n.id === selectedNodeId);
  if (!node) return null;

  const content = resolveContent(node, selectedVersion);
  const platform = PLATFORM_METADATA[node.id];

  // Compute upstream and downstream from visible edges
  const visibleEdges = PIPELINE_EDGES.filter(
    (e) => !e.visibleIn || e.visibleIn.includes(selectedVersion)
  );

  const upstreamNodeIds = Array.from(
    new Set(visibleEdges.filter((e) => e.target === node.id).map((e) => e.source))
  );
  const downstreamNodeIds = Array.from(
    new Set(visibleEdges.filter((e) => e.source === node.id).map((e) => e.target))
  );

  const upstreamNodes = PIPELINE_NODES.filter((n) => upstreamNodeIds.includes(n.id));
  const downstreamNodes = PIPELINE_NODES.filter((n) => downstreamNodeIds.includes(n.id));

  const getStatusBadge = (status: Status) => {
    switch (status) {
      case 'ok':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-status-ok/20 text-status-ok border border-status-ok/30 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-status-ok"></span>
            Established
          </span>
        );
      case 'partial':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-status-partial/20 text-status-partial border border-status-partial/30 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-status-partial"></span>
            Partial
          </span>
        );
      case 'missing':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-status-missing/20 text-status-missing border border-status-missing/30 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-status-missing"></span>
            Missing / Unowned
          </span>
        );
      case 'unknown':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-status-unknown/20 text-status-unknown border border-status-unknown/30 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-status-unknown"></span>
            Unknown Status
          </span>
        );
    }
  };

  const getReturnMeta = (status: Status | 'gaps') => {
    switch (status) {
      case 'ok':
        return {
          label: 'Established Stages',
          color: 'bg-status-ok/15 text-status-ok border-status-ok/30 hover:bg-status-ok/25',
        };
      case 'partial':
        return {
          label: 'Partially In Place Stages',
          color: 'bg-status-partial/15 text-status-partial border-status-partial/30 hover:bg-status-partial/25',
        };
      case 'missing':
        return {
          label: 'Missing / Unowned Stages',
          color: 'bg-status-missing/15 text-status-missing border-status-missing/30 hover:bg-status-missing/25',
        };
      case 'unknown':
        return {
          label: 'Unknown Stages',
          color: 'bg-status-unknown/15 text-status-unknown border-status-unknown/30 hover:bg-status-unknown/25',
        };
      case 'gaps':
        return {
          label: 'Identified Gaps',
          color: 'bg-rose-500/15 text-rose-300 border-rose-500/30 hover:bg-rose-500/25',
        };
    }
  };

  const handleBackToKpi = () => {
    if (returnFilterStatus) {
      const target = returnFilterStatus;
      setSelectedNodeId(null);
      setFilterStatus(target);
      setIsStatsModalOpen(true);
    }
  };

  const handleClose = () => {
    setSelectedNodeId(null);
    setReturnFilterStatus(null);
  };

  return (
    <div className="fixed top-0 right-0 h-full w-full sm:w-[500px] lg:w-[560px] z-50 bg-[#121624]/95 backdrop-blur-xl border-l border-border shadow-2xl flex flex-col transition-all duration-300 drawer-animate shadow-[0_0_50px_rgba(0,0,0,0.7),-5px_0_30px_rgba(106,169,232,0.08)]">
      {/* Header */}
      <div className="p-4 sm:p-5 border-b border-border bg-[#161a2c]/80 flex items-start justify-between gap-3 shrink-0">
        <div className="space-y-1.5 flex-1 pr-2">
          {/* Back button to KPI List if navigated from KPI drawer */}
          {returnFilterStatus && (
            <button
              onClick={handleBackToKpi}
              className={`mb-2 px-2.5 py-1 rounded-lg text-xs font-semibold border flex items-center gap-1.5 transition-all hover:scale-[1.02] shadow-sm ${
                getReturnMeta(returnFilterStatus).color
              }`}
              title={`Return to ${getReturnMeta(returnFilterStatus).label} list`}
            >
              <ArrowLeft size={13} className="shrink-0" />
              <span>Back to {getReturnMeta(returnFilterStatus).label}</span>
            </button>
          )}

          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-xs font-bold text-blue-400 uppercase tracking-wider">
              {node.id.toUpperCase()}
            </span>
            {getStatusBadge(content.status)}
            <span className="text-[11px] px-2 py-0.5 rounded bg-white/5 text-dim border border-border flex items-center gap-1">
              <BookOpen size={10} className="text-mute" />
              {node.sourceDoc}
            </span>
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight leading-snug">
            {content.title || node.baseTitle}
          </h2>
          <div className="flex items-center gap-2 text-xs text-dim flex-wrap">
            <span className="flex items-center gap-1 text-mute">
              <User size={12} />
              Owner:
            </span>
            <span className="text-dim font-medium">{node.owner}</span>
          </div>
        </div>
        <button
          onClick={handleClose}
          className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-dim hover:text-white transition-colors border border-border"
          aria-label="Close panel"
        >
          <X size={18} />
        </button>
      </div>

      {/* Content Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
        {/* Platform & Environment Placement Card */}
        {platform && (
          <div className="p-3.5 rounded-xl bg-gradient-to-r from-sky-500/10 via-sky-500/5 to-transparent border border-sky-500/30 space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-sky-300">
                <Server size={14} className="text-sky-400" />
                <span>System Placement & Boundaries</span>
              </div>
              <span
                className={`text-[9.5px] font-extrabold uppercase px-2 py-0.5 rounded-md border shadow-sm ${platform.badgeStyle.bg} ${platform.badgeStyle.text} ${platform.badgeStyle.border}`}
              >
                {platform.boundaryTag}
              </span>
            </div>

            <div className="text-xs text-white font-semibold flex items-center justify-between gap-2">
              <span>{platform.systemName}</span>
              <span className="text-[10.5px] text-mute font-normal">{platform.zoneTitle}</span>
            </div>

            <p className="text-xs text-dim leading-relaxed">
              {platform.placementDetails}
            </p>

            {/* Authoritative System Boundary Rules Table Excerpt */}
            <div className="pt-2 border-t border-sky-500/20 space-y-1.5 text-[11px]">
              <div className="flex items-baseline gap-1.5">
                <span className="text-sky-300 font-bold uppercase tracking-wider text-[9.5px] shrink-0">
                  Authoritative For:
                </span>
                <span className="text-slate-200">{platform.authoritativeFor}</span>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-amber-400 font-bold uppercase tracking-wider text-[9.5px] shrink-0">
                  Must NOT Hold:
                </span>
                <span className="text-dim italic">{platform.mustNotHold}</span>
              </div>
            </div>
          </div>
        )}

        {/* Scenario Variations Card (Answers "what does varies mean?") */}
        {node.variesByVersion && (
          <div className="p-3.5 rounded-xl bg-gradient-to-r from-amber-500/15 via-amber-500/5 to-transparent border border-amber-500/30 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300">
                <GitCompare size={14} className="text-amber-400" />
                <span>Architecture Varies Across Scenarios</span>
              </div>
              <button
                onClick={() => setShowCompareAll(!showCompareAll)}
                className="text-[11px] px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white font-semibold flex items-center gap-1.5 transition-all border border-white/15"
              >
                <Sliders size={12} />
                <span>{showCompareAll ? 'Single View' : 'Compare All 3'}</span>
              </button>
            </div>

            <p className="text-xs text-dim leading-relaxed">
              This stage has different architectural designs and trade-offs across Henkel's documented scenarios. Switch between them or compare below:
            </p>

            {/* Variation Switcher Tabs */}
            <div className="grid grid-cols-3 gap-2">
              {VERSIONS.map((ver) => {
                const verContent = resolveContent(node, ver.id);
                const isActive = selectedVersion === ver.id;
                return (
                  <button
                    key={ver.id}
                    onClick={() => setSelectedVersion(ver.id)}
                    className={`p-2.5 rounded-xl text-left transition-all border flex flex-col justify-between ${
                      isActive
                        ? 'bg-white/15 border-amber-400/50 shadow-md ring-1 ring-amber-400/30'
                        : 'bg-black/30 border-white/10 hover:bg-white/5 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="text-[10.5px] font-bold text-white truncate">
                        {ver.id === 'current'
                          ? 'Current State'
                          : ver.id === 'option1'
                          ? 'Option 1'
                          : 'Option 2'}
                      </span>
                      {isActive ? (
                        <Check size={11} className="text-amber-400" />
                      ) : (
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            verContent.status === 'ok'
                              ? 'bg-status-ok'
                              : verContent.status === 'partial'
                              ? 'bg-status-partial'
                              : verContent.status === 'missing'
                              ? 'bg-status-missing'
                              : 'bg-status-unknown'
                          }`}
                        />
                      )}
                    </div>
                    <div className="text-[10px] text-mute truncate font-medium">
                      {ver.id === 'current'
                        ? 'Legacy Setup'
                        : ver.id === 'option1'
                        ? 'Distributed (pref)'
                        : 'Centralized (thin)'}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Compare All Variations Side-by-Side Breakdown */}
            {showCompareAll && (
              <div className="pt-2 border-t border-white/10 space-y-2.5 animate-in fade-in-50">
                <div className="text-[11px] font-bold uppercase tracking-wider text-white">
                  Cross-Scenario Comparison for {node.baseTitle}:
                </div>
                {VERSIONS.map((ver) => {
                  const verContent = resolveContent(node, ver.id);
                  const isCurActive = selectedVersion === ver.id;
                  return (
                    <div
                      key={ver.id}
                      onClick={() => setSelectedVersion(ver.id)}
                      className={`p-3 rounded-lg border cursor-pointer transition-all ${
                        isCurActive
                          ? 'bg-white/10 border-white/30 ring-1 ring-white/20'
                          : 'bg-black/20 border-white/5 hover:bg-white/[0.04]'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-xs font-bold text-white flex items-center gap-1.5">
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: ver.accentColor }}
                          />
                          {ver.label}
                        </span>
                        <span className="text-[10px] font-mono uppercase px-1.5 py-0.2 rounded bg-white/5 text-dim border border-border">
                          {verContent.status}
                        </span>
                      </div>
                      <div className="text-[11.5px] font-medium text-amber-200/90 mb-1">
                        {verContent.title || node.baseTitle}
                      </div>
                      <p className="text-[11.5px] text-dim leading-relaxed line-clamp-3">
                        {verContent.description}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Lineage Upstream / Downstream Nav */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-xl bg-white/[0.02] border border-border text-xs">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-blue-400 flex items-center gap-1 mb-1.5">
              <ArrowUpRight size={12} />
              Upstream (Receives From)
            </span>
            {upstreamNodes.length > 0 ? (
              <ul className="space-y-1">
                {upstreamNodes.map((u) => (
                  <li key={u.id}>
                    <button
                      onClick={() => setSelectedNodeId(u.id)}
                      className="text-left w-full truncate text-dim hover:text-white hover:underline transition-all"
                    >
                      &bull; {u.baseTitle}
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <span className="text-mute italic text-[11px]">None (Origin stage)</span>
            )}
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-teal-400 flex items-center gap-1 mb-1.5">
              <ArrowDownRight size={12} />
              Downstream (Feeds Into)
            </span>
            {downstreamNodes.length > 0 ? (
              <ul className="space-y-1">
                {downstreamNodes.map((d) => (
                  <li key={d.id}>
                    <button
                      onClick={() => setSelectedNodeId(d.id)}
                      className="text-left w-full truncate text-dim hover:text-white hover:underline transition-all"
                    >
                      &bull; {d.baseTitle}
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <span className="text-mute italic text-[11px]">None (Terminal stage)</span>
            )}
          </div>
        </div>

        {/* Level 2 Pros & Cons for Decision Nodes */}
        {content.prosCons && (
          <div className="space-y-2 p-3.5 rounded-xl bg-white/[0.02] border border-border">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white flex items-center justify-between">
              <span>Decision Analysis</span>
              <span className="text-[10px] text-amber-300 font-mono font-semibold">
                ACTIVE: {selectedVersion.toUpperCase()}
              </span>
            </h4>
            <div className="grid grid-cols-1 gap-2.5 pt-1">
              <div className="p-2.5 rounded-lg bg-status-ok/10 border border-status-ok/20">
                <span className="text-[11px] font-semibold text-status-ok flex items-center gap-1.5 mb-1">
                  <ThumbsUp size={12} /> Advantages ({selectedVersion})
                </span>
                <ul className="list-disc list-inside text-xs text-dim space-y-1">
                  {content.prosCons.pros.map((pro, idx) => (
                    <li key={idx} className="leading-relaxed">
                      {pro}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="p-2.5 rounded-lg bg-status-partial/10 border border-status-partial/20">
                <span className="text-[11px] font-semibold text-status-partial flex items-center gap-1.5 mb-1">
                  <ThumbsDown size={12} /> Trade-offs & Disadvantages ({selectedVersion})
                </span>
                <ul className="list-disc list-inside text-xs text-dim space-y-1">
                  {content.prosCons.cons.map((con, idx) => (
                    <li key={idx} className="leading-relaxed">
                      {con}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Description */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-mute">
            {node.variesByVersion ? `Overview (${selectedVersion.toUpperCase()})` : 'Overview'}
          </h3>
          <div className="text-xs sm:text-[13px] leading-relaxed text-dim space-y-2 bg-white/[0.02] p-3.5 rounded-xl border border-border">
            {content.description.split('\n\n').map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </div>
        </div>

        {/* Security & Governance Policies */}
        {node.policies && node.policies.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-mute">
              Security & Access Policies
            </h3>
            <div className="flex flex-wrap gap-2">
              {node.policies.map((p, idx) => (
                <PolicyTooltip key={idx} policy={p} />
              ))}
            </div>
          </div>
        )}

        {/* Code Example */}
        {node.codeExample && (
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-mute">
              Technical Implementation Snippet
            </h3>
            <CodeBlock example={node.codeExample} />
          </div>
        )}

        {/* Sample Data Table */}
        {node.sampleData && (
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-mute">
              Sample Schema / Reference Data
            </h3>
            <SampleDataTable data={node.sampleData} />
          </div>
        )}

        {/* Gaps Register */}
        {content.gaps && content.gaps.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-status-missing flex items-center gap-1.5">
              <AlertTriangle size={14} /> Identified Gaps & Deficiencies
            </h3>
            <div className="space-y-2">
              {content.gaps.map((gapText, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-lg bg-status-missing/10 border-l-2 border-status-missing text-xs text-dim leading-relaxed"
                >
                  {gapText}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Architectural Notes */}
        {content.notes && content.notes.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-teal-400 flex items-center gap-1.5">
              <Info size={14} /> Architectural Context
            </h3>
            <div className="space-y-2">
              {content.notes.map((noteText, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-lg bg-teal-900/10 border-l-2 border-teal-500 text-xs text-dim leading-relaxed"
                >
                  {noteText}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
