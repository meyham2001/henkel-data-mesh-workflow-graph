import React from 'react';
import { PipelineCanvas } from './components/graph/PipelineCanvas';
import { DetailPanel } from './components/panel/DetailPanel';
import { VersionToggle } from './components/VersionToggle';
import { VersionSummaryBanner } from './components/VersionSummaryBanner';
import { StatsBar } from './components/StatsBar';
import { SearchBar } from './components/SearchBar';
import { ExportMenu } from './components/ExportMenu';
import { StatsModal } from './components/StatsModal';
import { Network, Eye, EyeOff } from 'lucide-react';
import { useAppStore } from './store/appStore';

export const App: React.FC = () => {
  const {
    selectedPlatformFilter,
    setSelectedPlatformFilter,
    showBoundaries,
    toggleShowBoundaries,
  } = useAppStore();
  return (
    <div className="flex flex-col h-screen w-screen bg-[#0b0d12] text-[#eef0f6] overflow-hidden select-none">
      {/* Top Application Header */}
      <header className="h-14 border-b border-border bg-[#101422] px-4 flex items-center justify-between gap-3 shrink-0 z-20">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-teal-400 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Network size={18} className="text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold text-white tracking-tight">
                Henkel Data Mesh
              </h1>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-300 border border-blue-500/25 hidden sm:inline">
                Interactive Architecture Explorer
              </span>
            </div>
            <p className="text-[10.5px] text-mute hidden md:block">
              End-to-end data flow, system boundaries & decision scenarios (HDP)
            </p>
          </div>
        </div>

        {/* Center/Right controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          <SearchBar />
          <VersionToggle />
          <ExportMenu />
        </div>
      </header>

      {/* Version Summary Banner (Level 1 Pros & Cons) */}
      <VersionSummaryBanner />

      {/* Headline KPI Stats Bar */}
      <div className="border-b border-border bg-[#0d101a] py-1 shrink-0 z-10">
        <StatsBar />
      </div>

      {/* Main Canvas Area */}
      <main className="flex-1 relative overflow-hidden">
        <PipelineCanvas />

        {/* Status & System Boundaries Legend floating at bottom left (offset from zoomer) */}
        <div className="absolute bottom-4 left-[60px] sm:left-[64px] z-20 bg-[#121624]/95 backdrop-blur-md p-2.5 rounded-xl border border-border shadow-xl text-[11px] text-dim flex items-center gap-3.5 flex-wrap max-w-[calc(100vw-280px)] md:max-w-3xl pointer-events-auto">
          {/* Status Dots */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="flex items-center gap-1.5 font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-status-ok"></span>
              <span>Established</span>
            </div>
            <div className="flex items-center gap-1.5 font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-status-partial"></span>
              <span>Partial</span>
            </div>
            <div className="flex items-center gap-1.5 font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-status-missing"></span>
              <span>Missing</span>
            </div>
            <div className="flex items-center gap-1.5 font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-status-unknown"></span>
              <span>Unknown</span>
            </div>
          </div>

          <div className="h-3.5 w-px bg-border hidden sm:block"></div>

          {/* System Boundaries Key */}
          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={() =>
                setSelectedPlatformFilter(
                  selectedPlatformFilter === 'inside_databricks' ? null : 'inside_databricks'
                )
              }
              className={`flex items-center gap-1.5 transition-colors cursor-pointer hover:text-white ${
                selectedPlatformFilter === 'inside_databricks' ? 'text-sky-300 font-bold' : ''
              }`}
              title="Click to isolate Databricks boundary"
            >
              <span className="w-3.5 h-2 rounded border-2 border-sky-400 bg-sky-500/20"></span>
              <span>Databricks / UC</span>
            </button>
            <button
              onClick={() =>
                setSelectedPlatformFilter(
                  selectedPlatformFilter === 'outside_databricks' ? null : 'outside_databricks'
                )
              }
              className={`flex items-center gap-1.5 transition-colors cursor-pointer hover:text-white ${
                selectedPlatformFilter === 'outside_databricks' ? 'text-slate-200 font-bold' : ''
              }`}
              title="Click to isolate components outside Databricks"
            >
              <span className="w-3.5 h-2 rounded border border-dashed border-slate-400 bg-slate-500/20"></span>
              <span>Outside Databricks</span>
            </button>
            <button
              onClick={() =>
                setSelectedPlatformFilter(
                  selectedPlatformFilter === 'home_undecided' ? null : 'home_undecided'
                )
              }
              className={`flex items-center gap-1.5 transition-colors cursor-pointer hover:text-white ${
                selectedPlatformFilter === 'home_undecided' ? 'text-amber-300 font-bold' : ''
              }`}
              title="Click to isolate unassigned lifecycle gaps"
            >
              <span className="w-3.5 h-2 rounded border border-dashed border-amber-400 bg-amber-500/20"></span>
              <span>Home Undecided</span>
            </button>

            <div className="h-3.5 w-px bg-border hidden sm:block"></div>
            <button
              onClick={() => toggleShowBoundaries()}
              className={`flex items-center gap-1.5 transition-colors cursor-pointer px-2 py-0.5 rounded-md border text-[10px] font-semibold ${
                showBoundaries
                  ? 'bg-sky-500/20 text-sky-300 border-sky-400/40 hover:bg-sky-500/30'
                  : 'bg-white/5 text-dim border-white/10 hover:text-white'
              }`}
              title="Show or hide all platform & zone boundaries (Alt+B)"
            >
              {showBoundaries ? <Eye size={11} className="text-sky-400" /> : <EyeOff size={11} />}
              <span>{showBoundaries ? 'Hide Boundaries' : 'Show Boundaries'}</span>
            </button>
          </div>
        </div>

        {/* Detail Panel Drawer (when node selected) */}
        <DetailPanel />

        {/* KPI Filter Drawer (when KPI box clicked) */}
        <StatsModal />
      </main>
    </div>
  );
};
