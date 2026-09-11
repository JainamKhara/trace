'use client';

import React from 'react';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { FileSpreadsheet, Eye } from 'lucide-react';

interface CsvPreviewTableProps {
  columns: string[];
  rows: Record<string, string>[];
  totalRows: number;
  maxDisplayRows?: number;
  fileName?: string;
}

export function CsvPreviewTable({
  columns,
  rows,
  totalRows,
  maxDisplayRows = 8,
  fileName
}: CsvPreviewTableProps) {
  const displayRows = rows.slice(0, maxDisplayRows);

  if (!columns.length || !rows.length) {
    return (
      <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 text-center text-xs text-slate-500">
        No spreadsheet data rows parsed yet.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 border border-slate-200 rounded-lg overflow-hidden bg-white shadow-xs">
      <div className="px-3.5 py-2 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          <FileSpreadsheet className="size-4 text-emerald-600 shrink-0" />
          <span className="font-semibold text-slate-900 truncate">
            {fileName || 'Parsed CSV Telematics / CDR Dataset'}
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <Badge variant="outline" className="text-[10px] font-mono text-slate-600 bg-white border-slate-200">
            {columns.length} columns
          </Badge>
          <Badge variant="outline" className="text-[10px] font-mono text-emerald-700 bg-emerald-50 border-emerald-200">
            {totalRows} total rows
          </Badge>
          <div className="flex items-center gap-1 text-[11px] text-slate-500">
            <Eye className="size-3 text-slate-400" />
            <span>Showing top {displayRows.length} rows</span>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto max-h-64">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/80 hover:bg-slate-50/80">
              <TableHead className="w-10 text-[11px] font-mono text-slate-500 py-1.5 px-2.5">#</TableHead>
              {columns.map(col => (
                <TableHead
                  key={col}
                  className="text-[11px] font-semibold text-slate-700 py-1.5 px-3 whitespace-nowrap"
                >
                  {col}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayRows.map((row, idx) => (
              <TableRow key={idx} className="hover:bg-blue-50/40 text-xs transition-colors">
                <TableCell className="font-mono text-[10px] text-slate-400 py-1.5 px-2.5 bg-slate-50/50">
                  {idx + 1}
                </TableCell>
                {columns.map(col => (
                  <TableCell
                    key={col}
                    className="py-1.5 px-3 text-slate-800 font-mono text-[11px] whitespace-nowrap max-w-[200px] truncate"
                    title={row[col] ?? ''}
                  >
                    {row[col] !== undefined && row[col] !== '' ? row[col] : (
                      <span className="text-slate-300 italic">null</span>
                    )}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {totalRows > maxDisplayRows && (
        <div className="px-3 py-1.5 bg-slate-50/70 border-t border-slate-100 text-center text-[11px] text-slate-500">
          + {totalRows - maxDisplayRows} additional records will be ingested into the forensic repository.
        </div>
      )}
    </div>
  );
}
