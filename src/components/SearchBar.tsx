import React, { useState, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';
import { PIPELINE_NODES } from '../data/nodes';
import { useAppStore } from '../store/appStore';
import { resolveContent } from '../data/resolveContent';

export const SearchBar: React.FC = () => {
  const { searchQuery, setSearchQuery, setSelectedNodeId, selectedVersion } = useAppStore();
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Global hotkey: / or Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === '/' || (e.key === 'k' && (e.metaKey || e.ctrlKey))) && document.activeElement?.tagName !== 'INPUT') {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const matches = searchQuery.trim()
    ? PIPELINE_NODES.filter((node) => {
        const content = resolveContent(node, selectedVersion);
        if (content.visible === false) return false;
        const q = searchQuery.toLowerCase();
        return (
          node.baseTitle.toLowerCase().includes(q) ||
          node.id.toLowerCase().includes(q) ||
          node.owner.toLowerCase().includes(q) ||
          node.sourceDoc.toLowerCase().includes(q) ||
          content.description.toLowerCase().includes(q)
        );
      })
    : [];

  const handleSelect = (id: string) => {
    setSelectedNodeId(id);
    setIsOpen(false);
    setSearchQuery('');
  };

  return (
    <div ref={dropdownRef} className="relative w-48 sm:w-64 md:w-72">
      <div className="relative flex items-center">
        <Search size={14} className="absolute left-3 text-mute pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Search stages or terms... (/)"
          className="w-full bg-[#141826] text-xs text-[#eef0f6] pl-8 pr-7 py-1.5 rounded-xl border border-border focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 placeholder:text-mute transition-all shadow-inner"
        />
        {searchQuery && (
          <button
            onClick={() => {
              setSearchQuery('');
              setIsOpen(false);
            }}
            className="absolute right-2 text-mute hover:text-white"
          >
            <X size={13} />
          </button>
        )}
      </div>

      {isOpen && matches.length > 0 && (
        <div className="absolute top-full mt-1.5 left-0 w-full max-h-72 overflow-y-auto bg-[#161a2c] border border-border rounded-xl shadow-2xl z-50 p-1 divide-y divide-border">
          {matches.map((m) => (
            <button
              key={m.id}
              onClick={() => handleSelect(m.id)}
              className="w-full p-2 text-left hover:bg-white/5 rounded-lg flex items-start justify-between gap-2 transition-colors"
            >
              <div className="truncate">
                <div className="font-semibold text-xs text-white truncate">{m.baseTitle}</div>
                <div className="text-[10px] text-mute truncate">{m.owner}</div>
              </div>
              <span className="font-mono text-[9px] uppercase px-1.5 py-0.5 rounded bg-white/5 text-dim border border-border">
                {m.id}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
