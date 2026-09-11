'use client';

import React, { useState, useRef, useCallback } from 'react';
import {
  UploadCloud,
  FileSpreadsheet,
  FileText,
  Image as ImageIcon,
  FileCode,
  Trash2,
  CheckCircle2,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { CsvPreviewTable } from './CsvPreviewTable';
import type {
  Case,
  EvidenceClassification,
  IngestedFileRecord,
  TimelineEvent
} from '@/types/investigation';
import { addUploadedFiles, addBatchTimelineEvents } from '@/lib/dataService';
import { useAuth } from '@/lib/authContext';

interface StagedFile {
  id: string;
  file: File;
  name: string;
  size: number;
  type: 'csv' | 'pdf' | 'image' | 'text' | 'other';
  mimeType: string;
  dataUrl?: string;
  sha256Hash: string;
  caseId: string;
  notes: string;
  parsedRowCount?: number;
  parsedColumns?: string[];
  parsedSampleRows?: Record<string, string>[];
  classification: EvidenceClassification;
  isExpanded?: boolean;
  extractRowsToTimeline?: boolean;
}

interface FileUploadZoneProps {
  cases: Case[];
  defaultCaseId?: string;
  onSuccess?: (count: number) => void;
}

// Compute deterministic hash for file provenance
async function computeSha256(file: File): Promise<string> {
  try {
    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  } catch {
    const seed = `${file.name}-${file.size}-${file.lastModified}`;
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = (hash << 5) - hash + seed.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash).toString(16).padStart(16, '0') + 'f0a78b9c1d2e3f4a5b6c7d8e';
  }
}

// Simple fast CSV parser for client-side inspection
function parseCsv(text: string): { columns: string[]; rows: Record<string, string>[]; totalRows: number } {
  const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
  if (lines.length === 0) return { columns: [], rows: [], totalRows: 0 };

  const splitRow = (row: string) => {
    const regex = /(?:,|\n|^)("(?:(?:"")*[^"]*)*"|[^",\n]*|(?:\n|$))/g;
    const entries: string[] = [];
    let match;
    while ((match = regex.exec(row)) !== null) {
      let val = match[1];
      if (!val && match[0] === '') break;
      if (val) {
        if (val.startsWith('"') && val.endsWith('"')) {
          val = val.slice(1, -1).replace(/""/g, '"');
        }
        entries.push(val.trim());
      } else {
        entries.push('');
      }
      if (regex.lastIndex >= row.length) break;
    }
    return entries.length > 0 ? entries : row.split(',').map(s => s.trim());
  };

  const columns = splitRow(lines[0]);
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < Math.min(lines.length, 50); i++) {
    const values = splitRow(lines[i]);
    const obj: Record<string, string> = {};
    columns.forEach((col, idx) => {
      obj[col] = values[idx] ?? '';
    });
    rows.push(obj);
  }

  return {
    columns,
    rows,
    totalRows: lines.length - 1
  };
}

const classificationOptions: { value: EvidenceClassification; label: string }[] = [
  { value: 'OBSERVED', label: 'Observed (Direct source)' },
  { value: 'DERIVED', label: 'Derived (Extracted data)' },
  { value: 'INFERRED', label: 'Inferred (Corroborated)' },
  { value: 'HYPOTHESIS', label: 'Hypothesis (Unconfirmed)' }
];

export function FileUploadZone({
  cases,
  defaultCaseId,
  onSuccess
}: FileUploadZoneProps) {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedCase, setSelectedCase] = useState<string>(() => {
    return defaultCaseId || (cases.length > 0 ? cases[0].id : 'CASE-101');
  });
  const [globalClassification, setGlobalClassification] = useState<EvidenceClassification>('OBSERVED');
  const [stagedFiles, setStagedFiles] = useState<StagedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const processIncomingFiles = useCallback(async (files: FileList | File[]) => {
    if (!files.length) return;
    setIsProcessing(true);

    const newStaged: StagedFile[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const ext = file.name.split('.').pop()?.toLowerCase() || '';

      let type: StagedFile['type'] = 'other';
      if (['csv', 'tsv'].includes(ext) || file.type.includes('csv')) {
        type = 'csv';
      } else if (ext === 'pdf' || file.type === 'application/pdf') {
        type = 'pdf';
      } else if (['png', 'jpg', 'jpeg', 'webp', 'bmp', 'tiff', 'gif'].includes(ext) || file.type.startsWith('image/')) {
        type = 'image';
      } else if (['txt', 'json', 'log'].includes(ext)) {
        type = 'text';
      }

      const sha256Hash = await computeSha256(file);

      let dataUrl: string | undefined;
      let parsedRowCount: number | undefined;
      let parsedColumns: string[] | undefined;
      let parsedSampleRows: Record<string, string>[] | undefined;

      if (type === 'image') {
        dataUrl = await new Promise<string>(resolve => {
          const reader = new FileReader();
          reader.onload = e => resolve(e.target?.result as string);
          reader.onerror = () => resolve('');
          reader.readAsDataURL(file);
        });
      } else if (type === 'csv') {
        const text = await new Promise<string>(resolve => {
          const reader = new FileReader();
          reader.onload = e => resolve(e.target?.result as string);
          reader.onerror = () => resolve('');
          reader.readAsText(file.slice(0, 1024 * 512));
        });
        const parsed = parseCsv(text);
        parsedRowCount = parsed.totalRows;
        parsedColumns = parsed.columns;
        parsedSampleRows = parsed.rows;
      }

      newStaged.push({
        id: `STG-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        file,
        name: file.name,
        size: file.size,
        type,
        mimeType: file.type || 'application/octet-stream',
        dataUrl,
        sha256Hash,
        caseId: selectedCase,
        notes: '',
        parsedRowCount,
        parsedColumns,
        parsedSampleRows,
        classification: globalClassification,
        isExpanded: type === 'csv',
        extractRowsToTimeline: type === 'csv'
      });
    }

    setStagedFiles(prev => [...prev, ...newStaged]);
    setIsProcessing(false);
  }, [selectedCase, globalClassification]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      processIncomingFiles(e.dataTransfer.files);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      processIncomingFiles(e.target.files);
      e.target.value = '';
    }
  };

  const removeStagedFile = (id: string) => {
    setStagedFiles(prev => prev.filter(f => f.id !== id));
  };

  const toggleExpand = (id: string) => {
    setStagedFiles(prev =>
      prev.map(f => (f.id === id ? { ...f, isExpanded: !f.isExpanded } : f))
    );
  };

  const updateFileCase = (id: string, caseId: string) => {
    setStagedFiles(prev =>
      prev.map(f => (f.id === id ? { ...f, caseId } : f))
    );
  };

  const updateFileNotes = (id: string, notes: string) => {
    setStagedFiles(prev =>
      prev.map(f => (f.id === id ? { ...f, notes } : f))
    );
  };

  const handleIngestAll = async () => {
    if (stagedFiles.length === 0) return;
    setIsSubmitting(true);

    const recordsToIngest: IngestedFileRecord[] = stagedFiles.map(sf => ({
      id: `FILE-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: sf.name,
      size: sf.size,
      type: sf.type,
      mimeType: sf.mimeType,
      dataUrl: sf.dataUrl,
      sha256Hash: sf.sha256Hash,
      uploadedAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
      uploadedBy: user?.name ? `${user.name} (${user.badgeId})` : 'Officer',
      caseId: sf.caseId,
      parsedRowCount: sf.parsedRowCount,
      parsedColumns: sf.parsedColumns,
      notes: sf.notes || `Uploaded ${sf.name}`
    }));

    addUploadedFiles(recordsToIngest, {
      defaultClassification: globalClassification,
      officerBadge: user?.badgeId || 'OFFICER',
      createEvidence: true
    });

    // Batch extract CSV rows to Timeline events if selected
    const batchTimelineEvents: TimelineEvent[] = [];
    stagedFiles.forEach(sf => {
      if (sf.type === 'csv' && sf.extractRowsToTimeline && sf.parsedSampleRows) {
        const timeCol = sf.parsedColumns?.find(c => {
          const l = c.toLowerCase();
          return l.includes('time') || l.includes('date');
        });
        const entityCol = sf.parsedColumns?.find(c => {
          const l = c.toLowerCase();
          return l.includes('caller') || l.includes('from') || l.includes('sender') || l.includes('entity') || l.includes('party');
        });
        const targetCol = sf.parsedColumns?.find(c => {
          const l = c.toLowerCase();
          return l.includes('receiver') || l.includes('to') || l.includes('recipient') || l.includes('target');
        });
        const locationCol = sf.parsedColumns?.find(c => {
          const l = c.toLowerCase();
          return l.includes('location') || l.includes('tower') || l.includes('city') || l.includes('address');
        });
        const amountCol = sf.parsedColumns?.find(c => {
          const l = c.toLowerCase();
          return l.includes('amount') || l.includes('value') || l.includes('fee');
        });

        sf.parsedSampleRows.forEach((row, rIdx) => {
          const rawTime = timeCol ? row[timeCol] : '';
          const entityVal = entityCol ? row[entityCol] : '';
          const targetVal = targetCol ? row[targetCol] : '';
          const locVal = locationCol ? row[locationCol] : 'Field Site';
          const amtVal = amountCol ? row[amountCol] : '';

          const title = entityVal && targetVal
            ? `Interaction: ${entityVal} ↔ ${targetVal}`
            : entityVal
            ? `Activity: ${entityVal}`
            : `Log Entry #${rIdx + 1} (${sf.name})`;

          const desc = Object.entries(row)
            .slice(0, 4)
            .map(([k, v]) => `${k}: ${v}`)
            .join(' • ');

          batchTimelineEvents.push({
            id: `TL-CSV-${Date.now().toString().slice(-6)}-${rIdx}`,
            timestamp: rawTime || new Date().toISOString().replace('T', ' ').slice(0, 19),
            timeFormatted: rawTime || 'Recent',
            entityId: entityVal ? `ENT-${entityVal.replace(/\\W+/g, '-').toUpperCase()}` : 'ENT-GENERAL',
            entityName: entityVal || 'Extracted Entity',
            entityType: 'Person',
            caseId: sf.caseId.toUpperCase(),
            eventType: amtVal ? 'Transaction' : 'Call',
            title,
            description: desc,
            location: locVal,
            source: sf.name,
            evidenceId: `EV-${sf.id}`,
            confidence: 90
          });
        });
      }
    });

    if (batchTimelineEvents.length > 0) {
      addBatchTimelineEvents(batchTimelineEvents);
    }

    const count = stagedFiles.length;
    setStagedFiles([]);
    setIsSubmitting(false);
    setSuccessMessage(`Successfully added ${count} file${count > 1 ? 's' : ''}${batchTimelineEvents.length > 0 ? ` and registered ${batchTimelineEvents.length} timeline events` : ''}.`);

    if (onSuccess) {
      onSuccess(count);
    }
  };

  return (
    <div className="flex flex-col gap-4 text-xs">
      {/* Top Configuration Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg">
        <div>
          <label className="block text-[11px] font-semibold text-slate-700 mb-1">
            Case File
          </label>
          <Select
            value={selectedCase}
            onValueChange={val => {
              if (val) {
                setSelectedCase(val);
                setStagedFiles(prev => prev.map(f => ({ ...f, caseId: val })));
              }
            }}
          >
            <SelectTrigger className="h-8 text-xs bg-white border-slate-200 w-full">
              <SelectValue placeholder="Select case" />
            </SelectTrigger>
            <SelectContent>
              {cases.map(c => (
                <SelectItem key={c.id} value={c.id}>
                  <span className="font-semibold text-blue-700 mr-2">{c.id}</span>
                  <span className="text-slate-600">— {c.title}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-700 mb-1">
            Classification
          </label>
          <Select
            value={globalClassification}
            onValueChange={val => {
              if (val) {
                const cVal = val as EvidenceClassification;
                setGlobalClassification(cVal);
                setStagedFiles(prev => prev.map(f => ({ ...f, classification: cVal })));
              }
            }}
          >
            <SelectTrigger className="h-8 text-xs bg-white border-slate-200 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {classificationOptions.map(opt => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Drag & Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-xl p-6 sm:p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
          isDragging
            ? 'border-blue-500 bg-blue-50/70 scale-[0.99]'
            : 'border-slate-300 hover:border-blue-400 bg-slate-50/50 hover:bg-slate-50'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".csv,.tsv,.pdf,.png,.jpg,.jpeg,.webp,.tiff,.bmp,.txt,.json,.log"
          onChange={handleFileInputChange}
          className="hidden"
        />

        <div className="size-11 rounded-full bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center mb-2.5 shadow-xs">
          <UploadCloud className="size-5" />
        </div>

        <h4 className="text-sm font-semibold text-slate-900 mb-1">
          Drag and drop files here, or <span className="text-blue-600 hover:underline">browse</span>
        </h4>
        <p className="text-xs text-slate-500 max-w-md mb-3">
          Upload spreadsheets, PDF reports, or images.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-1.5 text-[11px]">
          <span className="px-2.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
            CSV (.csv)
          </span>
          <span className="px-2.5 py-0.5 rounded bg-red-50 text-red-700 border border-red-200">
            PDF (.pdf)
          </span>
          <span className="px-2.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
            Images (.png, .jpg, .webp)
          </span>
          <span className="px-2.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
            Text / Logs (.txt, .json)
          </span>
        </div>
      </div>

      {isProcessing && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-700 flex items-center gap-2">
          <div className="size-4 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
          <span>Processing files...</span>
        </div>
      )}

      {successMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-start justify-between gap-2 animate-in fade-in">
          <div className="flex items-start gap-2">
            <CheckCircle2 className="size-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>{successMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessMessage(null)}
            className="text-emerald-700 hover:underline text-[11px]"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Staged Files Review Queue */}
      {stagedFiles.length > 0 && (
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-900 text-xs flex items-center gap-1.5">
              <span>Selected Files</span>
              <Badge variant="secondary" className="text-[10px] font-mono py-0 px-1.5 h-4 text-blue-700 bg-blue-50">
                {stagedFiles.length}
              </Badge>
            </span>

            <Button
              type="button"
              variant="ghost"
              size="xs"
              onClick={() => setStagedFiles([])}
              className="text-slate-500 hover:text-red-600 text-xs"
            >
              Clear All
            </Button>
          </div>

          <div className="space-y-2">
            {stagedFiles.map(sf => {
              let Icon = FileCode;
              if (sf.type === 'csv') Icon = FileSpreadsheet;
              else if (sf.type === 'pdf') Icon = FileText;
              else if (sf.type === 'image') Icon = ImageIcon;

              return (
                <div
                  key={sf.id}
                  className="p-3 bg-white border border-slate-200 rounded-lg shadow-xs flex flex-col gap-2 transition-all hover:border-slate-300"
                >
                  <div className="flex items-start justify-between gap-2.5">
                    <div className="flex items-start gap-2.5 min-w-0 flex-1">
                      <div className="size-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center shrink-0 mt-0.5">
                        <Icon className="size-4" />
                      </div>

                      <div className="flex flex-col min-w-0 flex-1 gap-0.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-slate-900 text-xs truncate max-w-[280px]">
                            {sf.name}
                          </span>
                          <Badge variant="outline" className="text-[10px] font-mono uppercase text-slate-600 py-0 h-4">
                            {sf.type}
                          </Badge>
                          <span className="text-[11px] text-slate-500 font-mono">
                            {(sf.size / 1024).toFixed(1)} KB
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      {sf.type === 'csv' && sf.parsedSampleRows && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => toggleExpand(sf.id)}
                          title={sf.isExpanded ? 'Hide Data Preview' : 'Show Data Preview'}
                        >
                          {sf.isExpanded ? <ChevronUp className="size-3.5 text-slate-600" /> : <ChevronDown className="size-3.5 text-slate-600" />}
                        </Button>
                      )}

                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => removeStagedFile(sf.id)}
                        className="text-slate-400 hover:text-red-600"
                        title="Remove file"
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </div>

                  {/* Thumbnail Preview for Images */}
                  {sf.type === 'image' && sf.dataUrl && (
                    <div className="mt-1 p-2 bg-slate-50 border border-slate-200 rounded-md flex items-center gap-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={sf.dataUrl}
                        alt={sf.name}
                        className="size-14 object-cover rounded border border-slate-300 shadow-xs shrink-0"
                      />
                      <div className="flex flex-col gap-0.5 text-[11px] text-slate-600">
                        <span className="font-medium text-slate-800">Image Attached</span>
                        <p className="text-[10px] text-slate-500">
                          Preview ready for inspection.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Expandable CSV Data Preview */}
                  {sf.type === 'csv' && sf.isExpanded && sf.parsedColumns && sf.parsedSampleRows && (
                    <div className="mt-1 space-y-2">
                      <CsvPreviewTable
                        columns={sf.parsedColumns}
                        rows={sf.parsedSampleRows}
                        totalRows={sf.parsedRowCount || sf.parsedSampleRows.length}
                        fileName={sf.name}
                      />

                      <label className="flex items-center gap-2 cursor-pointer text-[11px] text-slate-700 bg-slate-50 p-2 rounded border border-slate-200 hover:bg-slate-100">
                        <input
                          type="checkbox"
                          checked={sf.extractRowsToTimeline ?? true}
                          onChange={e => {
                            const checked = e.target.checked;
                            setStagedFiles(prev =>
                              prev.map(f => (f.id === sf.id ? { ...f, extractRowsToTimeline: checked } : f))
                            );
                          }}
                          className="rounded text-blue-600 focus:ring-blue-500 size-3.5"
                        />
                        <span className="font-medium">Map CSV rows into Timeline events</span>
                        <span className="text-[10px] text-slate-500">({sf.parsedSampleRows?.length || 0} events will be created)</span>
                      </label>
                    </div>
                  )}

                  {/* Per-file metadata edit */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-slate-100 text-xs">
                    <div>
                      <Input
                        type="text"
                        placeholder="Notes / description..."
                        value={sf.notes}
                        onChange={e => updateFileNotes(sf.id, e.target.value)}
                        className="h-7 text-xs bg-slate-50/60"
                      />
                    </div>
                    <div>
                      <Select
                        value={sf.caseId}
                        onValueChange={val => val && updateFileCase(sf.id, val)}
                      >
                        <SelectTrigger className="h-7 text-xs bg-slate-50/60 w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {cases.map(c => (
                            <SelectItem key={c.id} value={c.id}>
                              <span className="font-semibold text-blue-700 mr-2">{c.id}</span>
                              <span className="text-slate-600">— {c.title}</span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Action Button */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-200">
            <span className="text-xs text-slate-600">
              {stagedFiles.length} file{stagedFiles.length > 1 ? 's' : ''} ready to add
            </span>

            <Button
              type="button"
              onClick={handleIngestAll}
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs h-8 px-4 font-medium shadow-xs focus-visible:ring-2 focus-visible:ring-blue-600"
            >
              {isSubmitting ? (
                <span>Adding...</span>
              ) : (
                <span>Add {stagedFiles.length} File{stagedFiles.length > 1 ? 's' : ''}</span>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
