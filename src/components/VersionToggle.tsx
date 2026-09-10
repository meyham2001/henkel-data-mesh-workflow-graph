import React from 'react';
import { VERSIONS } from '../data/versions';
import { useAppStore } from '../store/appStore';

export const VersionToggle: React.FC = () => {
  const { selectedVersion, setSelectedVersion } = useAppStore();

  return (
    <div className="flex items-center gap-1.5 p-1 bg-[#141826] border border-border rounded-xl shadow-inner">
      <span className="text-[10px] font-bold uppercase tracking-wider text-mute px-2 hidden md:inline">
        Scenario:
      </span>
      {VERSIONS.map((ver) => {
        const isActive = selectedVersion === ver.id;
        return (
          <button
            key={ver.id}
            onClick={() => setSelectedVersion(ver.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              isActive
                ? 'bg-white/15 text-white shadow border border-white/20'
                : 'text-dim hover:text-white hover:bg-white/5'
            }`}
          >
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: ver.accentColor }}
            />
            <span>{ver.label}</span>
            {ver.shortLabel && (
              <span
                className={`text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded-full ${
                  ver.shortLabel === 'preferred'
                    ? 'bg-status-ok/20 text-status-ok border border-status-ok/30'
                    : 'bg-status-partial/20 text-status-partial border border-status-partial/30'
                }`}
              >
                {ver.shortLabel}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
