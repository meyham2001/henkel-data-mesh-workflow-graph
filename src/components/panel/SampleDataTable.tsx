import React from 'react';
import { SampleData } from '../../data/schema';

export const SampleDataTable: React.FC<{ data: SampleData }> = ({ data }) => {
  return (
    <div className="my-3 overflow-hidden rounded-lg border border-border bg-panel">
      {data.caption && (
        <div className="px-3 py-2 bg-white/5 border-b border-border text-xs font-semibold text-dim">
          {data.caption}
        </div>
      )}
      <div className="overflow-x-auto max-h-60">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-border bg-black/20 text-mute uppercase font-mono text-[10px] tracking-wider">
              {data.columns.map((col, idx) => (
                <th key={idx} className="px-3 py-2 font-medium">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {data.rows.map((row, rIdx) => (
              <tr key={rIdx} className="hover:bg-white/[0.03] transition-colors">
                {row.map((cell, cIdx) => (
                  <td key={cIdx} className="px-3 py-2 text-dim whitespace-nowrap text-[11.5px]">
                    {String(cell)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
