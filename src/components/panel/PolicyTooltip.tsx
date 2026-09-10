import React from 'react';
import * as Tooltip from '@radix-ui/react-tooltip';
import { Shield } from 'lucide-react';
import { PolicyRef } from '../../data/schema';

export const PolicyTooltip: React.FC<{ policy: PolicyRef }> = ({ policy }) => {
  return (
    <Tooltip.Provider delayDuration={150}>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-purple-900/30 text-purple-300 border border-purple-500/30 hover:border-purple-400 cursor-help transition-all">
            <Shield size={10} className="text-purple-400" />
            <span className="font-mono">{policy.tagKey}</span>: <span>{policy.tagValue}</span>
          </span>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content
            className="z-50 max-w-xs rounded-lg bg-[#1a1d2e] p-2.5 text-xs text-[#eef0f6] shadow-xl border border-white/20 animate-in fade-in-50 zoom-in-95 leading-relaxed"
            sideOffset={5}
          >
            <div className="font-semibold text-purple-300 mb-1 text-[11px] flex items-center gap-1.5">
              <Shield size={12} />
              Policy Tag: <code className="text-white font-mono">{policy.tagKey}={policy.tagValue}</code>
            </div>
            <p className="text-[11px] text-dim">{policy.effect}</p>
            <Tooltip.Arrow className="fill-[#1a1d2e]" />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
};
