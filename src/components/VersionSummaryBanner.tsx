import React from 'react';
import { ChevronDown, ChevronUp, ThumbsUp, ThumbsDown, Info } from 'lucide-react';
import { useAppStore } from '../store/appStore';
import { VERSION_SUMMARIES } from '../data/versionSummaries';
import { VERSIONS } from '../data/versions';

export const VersionSummaryBanner: React.FC = () => {
  const { selectedVersion, isSummaryBannerOpen, toggleSummaryBanner } = useAppStore();

  const summary = VERSION_SUMMARIES[selectedVersion];
  const activeVerDef = VERSIONS.find((v) => v.id === selectedVersion);
  if (!summary || !activeVerDef) return null;

  return (
    <div className="border-b border-border bg-[#121624] text-xs transition-all">
      <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Info size={14} className="text-blue-400 shrink-0" />
          <span className="font-semibold text-white">
            Architecture Decision Summary:
          </span>
          <span className="text-dim font-medium">
            {activeVerDef.label} {activeVerDef.shortLabel ? `(${activeVerDef.shortLabel})` : ''}
          </span>
        </div>
        <button
          onClick={toggleSummaryBanner}
          className="flex items-center gap-1 text-[11px] font-medium text-dim hover:text-white px-2.5 py-1 rounded bg-white/5 hover:bg-white/10 border border-border transition-colors"
        >
          <span>{isSummaryBannerOpen ? 'Hide Trade-offs' : 'View Trade-offs'}</span>
          {isSummaryBannerOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </button>
      </div>

      {isSummaryBannerOpen && (
        <div className="max-w-7xl mx-auto px-4 pb-3.5 pt-1 grid grid-cols-1 md:grid-cols-2 gap-3 animate-in fade-in-50">
          <div className="p-3 rounded-lg bg-status-ok/10 border border-status-ok/20 space-y-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-status-ok flex items-center gap-1.5">
              <ThumbsUp size={13} /> Documented Advantages
            </span>
            <ul className="list-disc list-inside text-xs text-dim space-y-1 leading-relaxed">
              {summary.pros.map((pro, i) => (
                <li key={i}>{pro}</li>
              ))}
            </ul>
          </div>
          <div className="p-3 rounded-lg bg-status-partial/10 border border-status-partial/20 space-y-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-status-partial flex items-center gap-1.5">
              <ThumbsDown size={13} /> Documented Trade-offs / Risks
            </span>
            <ul className="list-disc list-inside text-xs text-dim space-y-1 leading-relaxed">
              {summary.cons.map((con, i) => (
                <li key={i}>{con}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};
