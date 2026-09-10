import React, { useState, useRef, useEffect } from 'react';
import { Download, FileImage, FileCode, FileText, ChevronDown } from 'lucide-react';
import { toPng } from 'html-to-image';
import { useAppStore } from '../store/appStore';
import { PIPELINE_NODES } from '../data/nodes';
import { PIPELINE_EDGES } from '../data/edges';
import { resolveContent } from '../data/resolveContent';
import { VERSIONS } from '../data/versions';

export const ExportMenu: React.FC = () => {
  const { selectedVersion } = useAppStore();
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const activeVerDef = VERSIONS.find((v) => v.id === selectedVersion)!;

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getResolvedData = () => {
    const visibleNodes = PIPELINE_NODES.filter((n) => {
      const c = resolveContent(n, selectedVersion);
      return c.visible !== false;
    }).map((n) => {
      const c = resolveContent(n, selectedVersion);
      return {
        id: n.id,
        category: n.category,
        title: c.title || n.baseTitle,
        owner: n.owner,
        status: c.status,
        sourceDoc: n.sourceDoc,
        description: c.description,
        prosCons: c.prosCons,
        gaps: c.gaps,
        notes: c.notes,
        policies: n.policies,
      };
    });

    const activeNodeIds = new Set(visibleNodes.map((n) => n.id));
    const visibleEdges = PIPELINE_EDGES.filter(
      (e) => !e.visibleIn || e.visibleIn.includes(selectedVersion)
    ).filter((e) => activeNodeIds.has(e.source) && activeNodeIds.has(e.target));

    return {
      version: activeVerDef,
      generatedAt: new Date().toISOString(),
      nodes: visibleNodes,
      edges: visibleEdges,
    };
  };

  const handleExportPNG = async () => {
    setIsOpen(false);
    setIsExporting(true);
    try {
      const reactFlowViewport = document.querySelector('.react-flow__viewport') as HTMLElement;
      if (!reactFlowViewport) {
        alert('Could not locate canvas viewport for PNG export.');
        return;
      }
      const dataUrl = await toPng(reactFlowViewport, {
        backgroundColor: '#0b0d14',
        quality: 0.95,
      });
      const link = document.createElement('a');
      link.download = `henkel-data-mesh-${selectedVersion}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to export PNG', err);
      alert('Error exporting PNG image.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportJSON = () => {
    setIsOpen(false);
    const data = getResolvedData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = `henkel-data-mesh-${selectedVersion}.json`;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleExportMarkdown = () => {
    setIsOpen(false);
    const data = getResolvedData();

    let md = `# Henkel Data Mesh Architecture Report\n\n`;
    md += `**Scenario / Version:** ${data.version.label} (${data.version.id})\n`;
    md += `**Generated:** ${data.generatedAt}\n`;
    md += `**Source Basis:** ${data.version.sourceDoc}\n\n`;
    md += `---\n\n## 1. Executive Headline Counts\n\n`;

    const counts = { ok: 0, partial: 0, missing: 0, unknown: 0, gaps: 0 };
    data.nodes.forEach((n) => {
      counts[n.status]++;
      if (n.gaps) counts.gaps += n.gaps.length;
    });

    md += `| Status | Metric | Count |\n|---|---|---|\n`;
    md += `| ✅ | Established / Operational | ${counts.ok} |\n`;
    md += `| ⚠️ | Partially Established | ${counts.partial} |\n`;
    md += `| ❌ | Missing / Unowned | ${counts.missing} |\n`;
    md += `| ❓ | Unknown Governance State | ${counts.unknown} |\n`;
    md += `| 🔍 | Total Identified Gaps | ${counts.gaps} |\n\n`;

    md += `---\n\n## 2. End-to-End Stages & Architecture Nodes\n\n`;
    data.nodes.forEach((n) => {
      md += `### ${n.id.toUpperCase()}: ${n.title}\n\n`;
      md += `- **Owner:** ${n.owner}\n`;
      md += `- **Status:** \`${n.status.toUpperCase()}\`\n`;
      md += `- **Source Document Citation:** \`${n.sourceDoc}\`\n\n`;
      md += `#### Description\n${n.description}\n\n`;

      if (n.prosCons) {
        md += `#### Decision Analysis\n`;
        md += `**Advantages:**\n`;
        n.prosCons.pros.forEach((p) => (md += `- ${p}\n`));
        md += `**Disadvantages & Trade-offs:**\n`;
        n.prosCons.cons.forEach((c) => (md += `- ${c}\n`));
        md += `\n`;
      }

      if (n.gaps && n.gaps.length > 0) {
        md += `#### Identified Gaps\n`;
        n.gaps.forEach((g) => (md += `- ⚠️ ${g}\n`));
        md += `\n`;
      }

      if (n.notes && n.notes.length > 0) {
        md += `#### Notes\n`;
        n.notes.forEach((nt) => (md += `- ℹ️ ${nt}\n`));
        md += `\n`;
      }
      md += `---\n\n`;
    });

    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = `henkel-data-mesh-${selectedVersion}-report.md`;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isExporting}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#141826] border border-border text-xs font-semibold text-dim hover:text-white hover:border-white/20 transition-all shadow"
      >
        <Download size={13} />
        <span>{isExporting ? 'Exporting...' : 'Export'}</span>
        <ChevronDown size={12} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1.5 w-48 bg-[#161a2c] border border-border rounded-xl shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95 divide-y divide-border">
          <div className="py-1">
            <button
              onClick={handleExportPNG}
              className="w-full px-2.5 py-1.5 text-left text-xs text-dim hover:text-white hover:bg-white/5 rounded-lg flex items-center gap-2 transition-colors"
            >
              <FileImage size={13} className="text-blue-400" />
              <span>Canvas Image (PNG)</span>
            </button>
            <button
              onClick={handleExportJSON}
              className="w-full px-2.5 py-1.5 text-left text-xs text-dim hover:text-white hover:bg-white/5 rounded-lg flex items-center gap-2 transition-colors"
            >
              <FileCode size={13} className="text-purple-400" />
              <span>Dataset (JSON)</span>
            </button>
            <button
              onClick={handleExportMarkdown}
              className="w-full px-2.5 py-1.5 text-left text-xs text-dim hover:text-white hover:bg-white/5 rounded-lg flex items-center gap-2 transition-colors"
            >
              <FileText size={13} className="text-teal-400" />
              <span>Report (Markdown)</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
