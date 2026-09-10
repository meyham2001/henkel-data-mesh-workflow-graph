import React, { useEffect, useState } from 'react';
import Prism from 'prismjs';
import 'prismjs/components/prism-sql';
import 'prismjs/components/prism-yaml';
import 'prismjs/components/prism-python';
import 'prismjs/themes/prism-tomorrow.css';
import { Copy, Check } from 'lucide-react';
import { CodeExample } from '../../data/schema';

export const CodeBlock: React.FC<{ example: CodeExample }> = ({ example }) => {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    Prism.highlightAll();
  }, [example.code, example.language]);

  const handleCopy = () => {
    navigator.clipboard.writeText(example.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-3 rounded-lg overflow-hidden border border-border bg-[#11131c]">
      <div className="flex items-center justify-between px-3 py-1.5 bg-[#181c2b] border-b border-border text-xs text-dim">
        <span className="font-mono uppercase font-semibold text-[10px] tracking-wider text-blue-400">
          {example.language}
        </span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 text-[11px] hover:text-white transition-colors px-2 py-0.5 rounded bg-white/5 hover:bg-white/10"
          title="Copy code"
        >
          {copied ? <Check size={12} className="text-status-ok" /> : <Copy size={12} />}
          <span>{copied ? 'Copied' : 'Copy'}</span>
        </button>
      </div>
      <div className="p-3 overflow-x-auto text-[12px] leading-relaxed font-mono">
        <pre className="!bg-transparent !p-0 !m-0">
          <code className={`language-${example.language}`}>{example.code}</code>
        </pre>
      </div>
      {example.caption && (
        <div className="px-3 py-1.5 bg-black/20 border-t border-border text-[11px] text-mute italic">
          {example.caption}
        </div>
      )}
    </div>
  );
};
