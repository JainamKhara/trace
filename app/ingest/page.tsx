'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  UploadCloud,
  PenTool,
  FileCheck2,
  HardDrive,
  ShieldCheck,
  FileSpreadsheet,
  FileText,
  Image as ImageIcon,
  ExternalLink,
  Trash2,
  Clock,
  Search,
  Filter,
  Edit3,
  Check
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileUploadZone } from '@/components/ingest/FileUploadZone';
import { ManualEntryForm } from '@/components/ingest/ManualEntryForm';
import { ExportReportModal } from '@/components/reports/ExportReportModal';
import {
  getCases,
  getEntities,
  getStoredCustomFiles,
  getStoredCustomEvidence,
  subscribeDataUpdates,
  clearCustomData,
  deleteCustomEvidence,
  updateCustomEvidenceNote
} from '@/lib/dataService';
import type { Case, Entity, IngestedFileRecord, Evidence } from '@/types/investigation';
import Link from 'next/link';

export default function IngestPage() {
  const [activeTab, setActiveTab] = useState<'files' | 'manual'>('files');
  const [cases, setCases] = useState<Case[]>(() => getCases());
  const [entities, setEntities] = useState<Entity[]>(() => getEntities());
  const [customFiles, setCustomFiles] = useState<IngestedFileRecord[]>(() => getStoredCustomFiles());
  const [customEvidence, setCustomEvidence] = useState<Evidence[]>(() => getStoredCustomEvidence());

  // Search & Filter state for Recent Uploads
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');

  // Inline Note Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingNote, setEditingNote] = useState('');

  // Export Modal state
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  const reloadData = useCallback(() => {
    setCases(getCases());
    setEntities(getEntities());
    setCustomFiles(getStoredCustomFiles());
    setCustomEvidence(getStoredCustomEvidence());
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeDataUpdates(() => {
      reloadData();
    });
    return unsubscribe;
  }, [reloadData]);

  const filteredCustomEvidence = customEvidence.filter(ev => {
    const matchesSearch =
      !searchQuery.trim() ||
      ev.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ev.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ev.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ev.caseId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (ev.sourceFile || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType =
      typeFilter === 'ALL' ||
      (typeFilter === 'CDR' && ev.type === 'CDR') ||
      (typeFilter === 'FIR' && ev.type === 'FIR') ||
      (typeFilter === 'CCTV' && ev.type === 'CCTV / Media') ||
      (typeFilter === 'OTHER' && !['CDR', 'FIR', 'CCTV / Media'].includes(ev.type));

    return matchesSearch && matchesType;
  });

  const handleStartEdit = (ev: Evidence) => {
    setEditingId(ev.id);
    setEditingNote(ev.summary);
  };

  const handleSaveEdit = (id: string) => {
    updateCustomEvidenceNote(id, editingNote.trim());
    setEditingId(null);
    reloadData();
  };

  return (
    <div className="p-3.5 sm:p-6 space-y-4 sm:space-y-5 max-w-[1600px] mx-auto w-full">
      {/* Operational Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-border/70">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold tracking-tight text-foreground">
              Data Ingestion
            </h1>
            <Badge variant="outline" className="text-[10px] font-mono border-blue-200 bg-blue-50 text-blue-700">
              Upload & Entry
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Add investigation files (CSV spreadsheets, PDFs, images) or record manual entries.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs flex-wrap">
          <Badge variant="outline" className="text-muted-foreground font-normal bg-card py-1 px-2.5 gap-1.5 tabular-nums">
            <HardDrive className="size-3 text-slate-500" />
            <span>Uploaded Files:</span>
            <strong className="text-foreground font-semibold">{customFiles.length}</strong>
          </Badge>

          <Badge variant="outline" className="text-muted-foreground font-normal bg-card py-1 px-2.5 gap-1.5 tabular-nums">
            <ShieldCheck className="size-3 text-emerald-600" />
            <span>Active Cases:</span>
            <strong className="text-foreground font-semibold">{cases.length}</strong>
          </Badge>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsExportModalOpen(true)}
            className="h-8 text-xs gap-1.5 shadow-xs"
          >
            <FileText className="size-3.5 text-slate-500" />
            <span>Export Report</span>
          </Button>

          <Link href="/evidence">
            <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5">
              <span>View Evidence</span>
              <ExternalLink className="size-3" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Main Intake Hub */}
      <Card className="border-border bg-card shadow-xs overflow-hidden">
        {/* Module Switcher Header */}
        <div className="p-4 border-b border-border/80 bg-slate-50/70 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('files')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'files'
                  ? 'bg-blue-600 text-white font-semibold shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <UploadCloud className="size-4" />
              <span>File Upload (CSV, PDF, Images)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('manual')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'manual'
                  ? 'bg-blue-600 text-white font-semibold shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <PenTool className="size-4" />
              <span>Manual Entry</span>
            </button>
          </div>

          <span className="text-[11px] text-slate-500 flex items-center gap-1.5">
            <FileCheck2 className="size-3.5 text-slate-400" />
            <span>Session storage active</span>
          </span>
        </div>

        {/* Tab Content View */}
        <CardContent className="p-4 sm:p-6">
          {activeTab === 'files' ? (
            <div className="max-w-4xl mx-auto">
              <div className="mb-4">
                <h2 className="text-sm font-semibold text-slate-900">
                  Upload Investigation Files
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Select or drag-and-drop spreadsheets (.csv), documents (.pdf), images (.png, .jpg), or text logs.
                </p>
              </div>

              <FileUploadZone
                cases={cases}
                onSuccess={() => reloadData()}
              />
            </div>
          ) : (
            <div className="max-w-4xl mx-auto">
              <div className="mb-4">
                <h2 className="text-sm font-semibold text-slate-900">
                  Manual Record Entry
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Record witness statements, informant notes, vehicle sightings, or manual case findings.
                </p>
              </div>

              <ManualEntryForm
                cases={cases}
                entities={entities}
                onSuccess={() => reloadData()}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Audit Ledger: Custom Ingested Records */}
      {(customFiles.length > 0 || customEvidence.length > 0) && (
        <Card className="border-border bg-card shadow-xs overflow-hidden">
          <CardHeader className="p-4 border-b border-border bg-slate-50/70 flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Clock className="size-4 text-blue-600" />
                <CardTitle className="text-sm font-semibold text-foreground">
                  Recent Uploads & Entries
                </CardTitle>
                <Badge variant="outline" className="text-[10px] font-mono text-blue-700 bg-blue-50">
                  {filteredCustomEvidence.length} of {customEvidence.length} items
                </Badge>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="xs"
                  onClick={() => {
                    if (confirm('Clear all custom ingested data in this browser session?')) {
                      clearCustomData();
                    }
                  }}
                  className="text-slate-400 hover:text-red-600 text-xs gap-1"
                >
                  <Trash2 className="size-3" />
                  <span>Clear All Session Records</span>
                </Button>
              </div>
            </div>

            {/* Instant Search & Category Filter Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1">
              <div className="relative flex-1 min-w-[220px] max-w-sm">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-slate-400 pointer-events-none" />
                <Input
                  type="text"
                  placeholder="Filter by title, case ID, summary, or file..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="h-7 text-xs pl-8 bg-white"
                />
              </div>

              <div className="flex items-center gap-1 text-[11px]">
                <span className="text-slate-500 mr-1 flex items-center gap-1">
                  <Filter className="size-3" />
                  <span>Type:</span>
                </span>
                {(['ALL', 'CDR', 'FIR', 'CCTV', 'OTHER'] as const).map(typeKey => (
                  <button
                    key={typeKey}
                    type="button"
                    onClick={() => setTypeFilter(typeKey)}
                    className={`px-2 py-0.5 rounded text-[11px] transition-colors ${
                      typeFilter === typeKey
                        ? 'bg-blue-600 text-white font-semibold'
                        : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    {typeKey === 'ALL' ? 'All' :
                     typeKey === 'CDR' ? 'Spreadsheet' :
                     typeKey === 'FIR' ? 'PDF' :
                     typeKey === 'CCTV' ? 'Image' : 'Other'}
                  </button>
                ))}
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {filteredCustomEvidence.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">
                No custom records match the search filter.
              </div>
            ) : (
              <div className="divide-y divide-border/60">
                {filteredCustomEvidence.map(ev => {
                  let Icon = FileText;
                  if (ev.type === 'CDR') Icon = FileSpreadsheet;
                  else if (ev.type === 'CCTV / Media') Icon = ImageIcon;

                  const isEditingThis = editingId === ev.id;

                  return (
                    <div
                      key={ev.id}
                      className="p-3.5 hover:bg-slate-50/80 transition-colors flex flex-wrap items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-start gap-3 min-w-0 max-w-2xl flex-1">
                        <div className="size-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center shrink-0 mt-0.5 border border-blue-100">
                          <Icon className="size-4" />
                        </div>

                        <div className="flex flex-col min-w-0 gap-1 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-xs font-semibold text-blue-700">
                              {ev.id}
                            </span>
                            <span className="font-medium text-slate-900 truncate">
                              {ev.title}
                            </span>
                            <Badge variant="outline" className="text-[9px] font-mono py-0 h-4 text-slate-600">
                              {ev.type}
                            </Badge>
                            <Badge variant="outline" className="text-[9px] font-mono py-0 h-4 text-blue-700 bg-blue-50 border-blue-200">
                              {ev.caseId}
                            </Badge>
                          </div>

                          {isEditingThis ? (
                            <div className="flex items-center gap-2 mt-1">
                              <Input
                                type="text"
                                value={editingNote}
                                onChange={e => setEditingNote(e.target.value)}
                                className="h-7 text-xs bg-white flex-1"
                                placeholder="Edit summary note..."
                              />
                              <Button
                                size="xs"
                                onClick={() => handleSaveEdit(ev.id)}
                                className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
                              >
                                <Check className="size-3" />
                                <span>Save</span>
                              </Button>
                              <Button
                                size="xs"
                                variant="ghost"
                                onClick={() => setEditingId(null)}
                                className="h-7 text-xs text-slate-500"
                              >
                                Cancel
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 group/edit">
                              <p className="text-[11px] text-slate-600 line-clamp-2">
                                {ev.summary}
                              </p>
                              <button
                                type="button"
                                onClick={() => handleStartEdit(ev)}
                                className="opacity-0 group-hover/edit:opacity-100 text-slate-400 hover:text-blue-600 transition-opacity"
                                title="Edit note"
                              >
                                <Edit3 className="size-3" />
                              </button>
                            </div>
                          )}

                          <div className="flex items-center gap-3 text-[10px] text-slate-500 font-mono mt-0.5">
                            <span>Source: {ev.sourceFile}</span>
                            <span>•</span>
                            <span>Timestamp: {ev.timestamp}</span>
                            <span>•</span>
                            <span>Confidence: {ev.confidence}%</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <Link href={`/evidence?id=${ev.id}`}>
                          <Button variant="outline" size="xs" className="text-xs h-7 gap-1">
                            <span>View</span>
                            <ExternalLink className="size-3" />
                          </Button>
                        </Link>

                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => {
                            if (confirm(`Remove record "${ev.title}"?`)) {
                              deleteCustomEvidence(ev.id);
                            }
                          }}
                          className="text-slate-400 hover:text-red-600 size-7"
                          title="Delete record"
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Global Dossier & Report Export Modal */}
      <ExportReportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
      />
    </div>
  );
}
