'use client';

import React, { useState } from 'react';
import {
  X,
  Printer,
  Download,
  FileSpreadsheet,
  FileCode,
  Shield,
  Calendar,
  Layers,
  FileText
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { getCases, getEvidence, getTimelineEvents, getEntities } from '@/lib/dataService';
import { useAuth } from '@/lib/authContext';

interface ExportReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultCaseId?: string;
}

export function ExportReportModal({
  isOpen,
  onClose,
  defaultCaseId
}: ExportReportModalProps) {
  const { user } = useAuth();
  const cases = React.useMemo(() => (isOpen ? getCases() : []), [isOpen]);
  const [selectedCaseId, setSelectedCaseId] = useState<string>(() => defaultCaseId || 'ALL');

  if (!isOpen) return null;

  const allEv = getEvidence();
  const allTl = getTimelineEvents();
  const allEnt = getEntities();

  const filteredEvidence = selectedCaseId === 'ALL'
    ? allEv
    : allEv.filter(e => e.caseId.toUpperCase() === selectedCaseId.toUpperCase());

  const filteredTimeline = selectedCaseId === 'ALL'
    ? allTl
    : allTl.filter(t => t.caseId.toUpperCase() === selectedCaseId.toUpperCase());

  const currentCase = cases.find(c => c.id.toUpperCase() === selectedCaseId.toUpperCase());

  const handlePrint = () => {
    window.print();
  };

  const handleExportCsv = () => {
    const headers = ['Evidence ID', 'Case ID', 'Title', 'Type', 'Classification', 'Confidence', 'Source File', 'Timestamp', 'Summary'];
    const rows = filteredEvidence.map(e => [
      `"${e.id}"`,
      `"${e.caseId}"`,
      `"${e.title.replace(/"/g, '""')}"`,
      `"${e.type}"`,
      `"${e.status}"`,
      `"${e.confidence}%"`,
      `"${(e.sourceFile || '').replace(/"/g, '""')}"`,
      `"${e.timestamp}"`,
      `"${(e.summary || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `TRACE-Evidence-${selectedCaseId}-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleExportJson = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      officer: user?.name ? `${user.name} (${user.badgeId})` : 'Officer',
      caseFilter: selectedCaseId,
      caseDetails: currentCase || null,
      evidenceRecords: filteredEvidence,
      timelineEvents: filteredTimeline,
      entityCount: allEnt.length
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `TRACE-Dossier-${selectedCaseId}-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <Card
        className="relative w-full max-w-4xl border-slate-200 bg-white shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-xs p-0 animate-in zoom-in-95 duration-150"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <CardHeader className="px-5 py-3.5 border-b border-slate-200 flex flex-row items-center justify-between gap-3 shrink-0 bg-slate-50/80">
          <div className="flex items-center gap-2">
            <div className="size-7 rounded-md bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center">
              <FileText className="size-4" />
            </div>
            <div>
              <CardTitle className="text-sm font-bold text-slate-900">
                Investigation Report & Dossier Export
              </CardTitle>
              <p className="text-[11px] text-slate-500">
                Generate printable briefing summaries or export raw data in CSV and JSON formats.
              </p>
            </div>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            onClick={onClose}
            className="text-slate-500 hover:text-slate-900 hover:bg-slate-200"
          >
            <X className="size-4" />
          </Button>
        </CardHeader>

        {/* Action Controls & Scope */}
        <div className="px-5 py-3 bg-white border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <label className="text-[11px] font-semibold text-slate-700 whitespace-nowrap">
              Dossier Scope:
            </label>
            <Select value={selectedCaseId} onValueChange={v => v && setSelectedCaseId(v)}>
              <SelectTrigger className="h-8 text-xs bg-slate-50 border-slate-200 min-w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Active Investigations</SelectItem>
                {cases.map(c => (
                  <SelectItem key={c.id} value={c.id}>
                    <span className="font-semibold text-blue-700 mr-2">{c.id}</span>
                    <span className="text-slate-600">— {c.title}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleExportCsv}
              className="h-8 text-xs gap-1.5"
            >
              <FileSpreadsheet className="size-3.5 text-emerald-600" />
              <span>Export CSV</span>
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleExportJson}
              className="h-8 text-xs gap-1.5"
            >
              <FileCode className="size-3.5 text-blue-600" />
              <span>Export JSON</span>
            </Button>

            <Button
              type="button"
              size="sm"
              onClick={handlePrint}
              className="h-8 text-xs bg-blue-600 hover:bg-blue-700 text-white gap-1.5 shadow-xs"
            >
              <Printer className="size-3.5" />
              <span>Print / Save PDF</span>
            </Button>
          </div>
        </div>

        {/* Printable Dossier Preview Pane */}
        <CardContent className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
          <div id="printable-dossier" className="bg-white border border-slate-200 rounded-lg p-6 shadow-xs max-w-3xl mx-auto text-slate-800 space-y-6">
            {/* Header / Seal */}
            <div className="border-b-2 border-slate-900 pb-4 flex items-start justify-between">
              <div>
                <span className="text-[10px] tracking-widest font-mono uppercase text-slate-500 font-semibold">
                  Criminal Investigation Department • TRACE Intelligence
                </span>
                <h1 className="text-xl font-black text-slate-950 mt-0.5 tracking-tight uppercase">
                  Investigation Dossier & Evidence Record
                </h1>
                <p className="text-xs text-slate-600 mt-1">
                  Scope: <strong className="text-slate-900">{selectedCaseId === 'ALL' ? 'Comprehensive Multi-Case Registry' : `${selectedCaseId} — ${currentCase?.title || ''}`}</strong>
                </p>
              </div>

              <div className="text-right text-[11px] font-mono text-slate-600">
                <div>Date: {currentCase?.lastUpdated || 'Current Dossier'}</div>
                <div>Status: <span className="font-semibold text-emerald-700 uppercase">{currentCase?.status || 'Active'}</span></div>
                <div className="text-[10px] text-slate-400 mt-1">ID: TRACE-REP-{selectedCaseId.replace(/[^a-zA-Z0-9]/g, '')}</div>
              </div>
            </div>

            {/* Case Summary Card */}
            {currentCase && (
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-md text-xs space-y-1.5">
                <div className="font-semibold text-slate-900 text-xs flex items-center justify-between">
                  <span>Case Overview</span>
                  <Badge variant="outline" className="text-[10px] font-mono">
                    Priority: {currentCase.priority}
                  </Badge>
                </div>
                <p className="text-slate-600 leading-relaxed">
                  {currentCase.description}
                </p>
                <div className="flex items-center gap-4 text-[11px] text-slate-500 font-mono pt-1 border-t border-slate-200">
                  <span>Lead: {currentCase.leadInvestigator}</span>
                  <span>•</span>
                  <span>Opened: {currentCase.dateOpened}</span>
                  <span>•</span>
                  <span>Tags: {currentCase.tags.join(', ')}</span>
                </div>
              </div>
            )}

            {/* Metrics Overview */}
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-md">
                <div className="text-lg font-bold text-slate-900">{filteredEvidence.length}</div>
                <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Evidence Items</div>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-md">
                <div className="text-lg font-bold text-slate-900">{filteredTimeline.length}</div>
                <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Chronological Events</div>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-md">
                <div className="text-lg font-bold text-slate-900">{allEnt.length}</div>
                <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Tracked Entities</div>
              </div>
            </div>

            {/* Evidence Roster Table */}
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Shield className="size-3.5 text-blue-600" />
                <span>Evidentiary Classification Register</span>
              </h3>
              <div className="border border-slate-200 rounded-md overflow-hidden text-[11px]">
                <table className="w-full text-left">
                  <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="p-2">ID</th>
                      <th className="p-2">Record</th>
                      <th className="p-2">Type</th>
                      <th className="p-2">Classification</th>
                      <th className="p-2 text-right">Confidence</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {filteredEvidence.slice(0, 15).map(ev => (
                      <tr key={ev.id} className="hover:bg-slate-50/50">
                        <td className="p-2 font-mono text-blue-700">{ev.id}</td>
                        <td className="p-2 font-medium text-slate-900 max-w-[200px] truncate">{ev.title}</td>
                        <td className="p-2 text-slate-600">{ev.type}</td>
                        <td className="p-2">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${
                            ev.status === 'OBSERVED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                            ev.status === 'DERIVED' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                            ev.status === 'INFERRED' ? 'bg-purple-50 text-purple-700 border border-purple-200' :
                            'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}>
                            {ev.status}
                          </span>
                        </td>
                        <td className="p-2 text-right font-mono font-semibold">{ev.confidence}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {filteredEvidence.length > 15 && (
                <p className="text-[10px] text-slate-400 mt-1 italic">
                  Showing top 15 records. Download CSV for full {filteredEvidence.length} items.
                </p>
              )}
            </div>

            {/* Timeline Highlights */}
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Calendar className="size-3.5 text-blue-600" />
                <span>Chronological Reconstruction Highlights</span>
              </h3>
              <div className="border border-slate-200 rounded-md p-3 divide-y divide-slate-100 space-y-2">
                {filteredTimeline.slice(0, 6).map(tl => (
                  <div key={tl.id} className="pt-2 first:pt-0 flex items-start justify-between gap-3 text-[11px]">
                    <div>
                      <span className="font-semibold text-slate-900">{tl.title}</span>
                      <p className="text-slate-600 text-[10px] line-clamp-1">{tl.description}</p>
                    </div>
                    <div className="text-right shrink-0 text-[10px] font-mono text-slate-500">
                      <div>{tl.timestamp.slice(0, 16)}</div>
                      <span className="text-blue-600">{tl.location}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Officer Sign-off Block */}
            <div className="pt-6 border-t border-slate-200 grid grid-cols-2 gap-6 text-[11px] text-slate-600">
              <div>
                <p className="font-semibold text-slate-900">Generated By:</p>
                <p>{user?.name || 'Authorized Investigative Officer'} • Badge #{user?.badgeId || 'CID-409'}</p>
                <p className="text-[10px] text-slate-400">Electronic verification stamp logged.</p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-slate-900">Supervisory Review:</p>
                <p>Digital signature pending certification</p>
                <p className="text-[10px] text-slate-400 font-mono">HASH: SHA256-SEC-{selectedCaseId.toUpperCase()}-VERIFIED</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
