'use client';

import React, { useState } from 'react';
import {
  Plus,
  Trash2,
  CheckCircle2,
  Calendar,
  FileText,
  User,
  Shield,
  Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import type {
  Case,
  Entity,
  EntityType,
  EvidenceClassification,
  EvidenceType,
  ManualEvidenceInput
} from '@/types/investigation';
import { addManualEvidence } from '@/lib/dataService';
import { useAuth } from '@/lib/authContext';

interface ManualEntryFormProps {
  cases: Case[];
  entities: Entity[];
  defaultCaseId?: string;
  onSuccess?: () => void;
}

interface KeyValuePair {
  id: string;
  key: string;
  value: string;
}

interface QuickEntity {
  id: string;
  name: string;
  type: EntityType;
  identifierKey?: 'phone' | 'registration' | 'accountNumber' | 'coordinates' | 'address';
  identifierValue?: string;
}

const evidenceTypeOptions: { value: EvidenceType; label: string }[] = [
  { value: 'CDR', label: 'Call Detail Record (CDR)' },
  { value: 'FIR', label: 'FIR / Complaint' },
  { value: 'Financial Record', label: 'Financial Record' },
  { value: 'Vehicle Record', label: 'Vehicle Record' },
  { value: 'Location Record', label: 'Location Record' },
  { value: 'Report', label: 'Investigation Report' },
  { value: 'CCTV / Media', label: 'Photo / Media' },
  { value: 'Digital Evidence', label: 'Digital Document' }
];

const classificationOptions: { value: EvidenceClassification; label: string }[] = [
  { value: 'OBSERVED', label: 'Observed (Direct source)' },
  { value: 'DERIVED', label: 'Derived (Extracted data)' },
  { value: 'INFERRED', label: 'Inferred (Corroborated)' },
  { value: 'HYPOTHESIS', label: 'Hypothesis (Unconfirmed)' }
];

export function ManualEntryForm({
  cases,
  entities,
  defaultCaseId,
  onSuccess
}: ManualEntryFormProps) {
  const { user } = useAuth();

  const [caseId, setCaseId] = useState<string>(() => {
    return defaultCaseId || (cases.length > 0 ? cases[0].id : 'CASE-101');
  });
  const [customCaseId, setCustomCaseId] = useState<string>('');
  const [isNewCase, setIsNewCase] = useState<boolean>(false);

  const [type, setType] = useState<EvidenceType>('CDR');
  const [title, setTitle] = useState<string>('');
  const [sourceFile, setSourceFile] = useState<string>('');
  const [timestamp, setTimestamp] = useState<string>(() => {
    const now = new Date();
    return now.toISOString().replace('T', ' ').slice(0, 19);
  });
  const [status, setStatus] = useState<EvidenceClassification>('OBSERVED');
  const [confidence, setConfidence] = useState<number>(90);
  const [summary, setSummary] = useState<string>('');
  const [classificationRationale, setClassificationRationale] = useState<string>('');

  // Corroborated entities selection
  const [selectedEntityIds, setSelectedEntityIds] = useState<string[]>([]);
  const [newEntities, setNewEntities] = useState<QuickEntity[]>([]);

  // Key-Value pairs
  const [keyValuePairs, setKeyValuePairs] = useState<KeyValuePair[]>([
    { id: '1', key: 'notes', value: 'Officer field record' }
  ]);

  // Timeline Event options
  const [createTimelineEvent, setCreateTimelineEvent] = useState<boolean>(true);
  const [timelineEventType, setTimelineEventType] = useState<
    'Call' | 'Transaction' | 'Location Ping' | 'Vehicle Sighting' | 'Report Entry'
  >('Report Entry');
  const [timelineLocation, setTimelineLocation] = useState<string>('');

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const addKeyValuePair = () => {
    setKeyValuePairs(prev => [
      ...prev,
      { id: Date.now().toString(), key: '', value: '' }
    ]);
  };

  const removeKeyValuePair = (id: string) => {
    setKeyValuePairs(prev => prev.filter(item => item.id !== id));
  };

  const updateKeyValuePair = (id: string, field: 'key' | 'value', val: string) => {
    setKeyValuePairs(prev =>
      prev.map(item => (item.id === id ? { ...item, [field]: val } : item))
    );
  };

  const addQuickEntity = () => {
    setNewEntities(prev => [
      ...prev,
      {
        id: Date.now().toString(),
        name: '',
        type: 'Person',
        identifierKey: 'phone',
        identifierValue: ''
      }
    ]);
  };

  const removeQuickEntity = (id: string) => {
    setNewEntities(prev => prev.filter(e => e.id !== id));
  };

  const updateQuickEntity = (
    id: string,
    field: keyof QuickEntity,
    value: string
  ) => {
    setNewEntities(prev =>
      prev.map(e => (e.id === id ? { ...e, [field]: value } : e))
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const activeCase = isNewCase ? customCaseId.trim().toUpperCase() : caseId;

    if (!activeCase) {
      setErrorMessage('Please select or specify a Case File.');
      return;
    }
    if (!title.trim()) {
      setErrorMessage('Please enter a Title.');
      return;
    }
    if (!summary.trim()) {
      setErrorMessage('Please enter a Summary.');
      return;
    }

    setIsSubmitting(true);

    const rawDataPreview: Record<string, string> = {};
    keyValuePairs.forEach(kv => {
      if (kv.key.trim()) {
        rawDataPreview[kv.key.trim()] = kv.value.trim();
      }
    });

    const payload: ManualEvidenceInput = {
      caseId: activeCase,
      type,
      title: title.trim(),
      sourceFile: sourceFile.trim() || 'Manual Entry',
      timestamp: timestamp.trim(),
      status,
      confidence,
      summary: summary.trim(),
      classificationRationale:
        classificationRationale.trim() ||
        `Registered with ${status} classification by officer ${user?.name || 'Officer'}.`,
      relatedEntityIds: selectedEntityIds,
      rawDataPreview,
      createTimelineEvent,
      timelineEventType,
      timelineLocation: timelineLocation.trim() || undefined,
      newEntities: newEntities
        .filter(ne => ne.name.trim())
        .map(ne => ({
          name: ne.name.trim(),
          type: ne.type,
          identifierKey: ne.identifierKey,
          identifierValue: ne.identifierValue?.trim()
        }))
    };

    try {
      const result = addManualEvidence(payload, user?.badgeId);

      setSuccessMessage(
        `Record "${result.evidence.title}" [${result.evidence.id}] saved to ${activeCase}.`
      );

      setTitle('');
      setSummary('');
      setClassificationRationale('');
      setNewEntities([]);
      setKeyValuePairs([
        { id: '1', key: 'notes', value: 'Officer field record' }
      ]);

      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      console.error('Submission error:', err);
      setErrorMessage('An unexpected error occurred while saving.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-xs">
      {errorMessage && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800 flex items-center justify-between">
          <span>{errorMessage}</span>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-red-600 hover:underline font-semibold ml-2"
          >
            Dismiss
          </button>
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

      {/* Row 1: Case Association & Record Type */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg">
        {/* Case Selector */}
        <div className="sm:col-span-1">
          <div className="flex items-center justify-between mb-1">
            <label className="block text-[11px] font-semibold text-slate-700">
              Case File
            </label>
            <button
              type="button"
              onClick={() => setIsNewCase(!isNewCase)}
              className="text-[10px] text-blue-600 hover:underline"
            >
              {isNewCase ? 'Existing cases' : '+ New Case'}
            </button>
          </div>

          {isNewCase ? (
            <Input
              type="text"
              placeholder="e.g. CASE-205"
              value={customCaseId}
              onChange={e => setCustomCaseId(e.target.value)}
              className="h-8 text-xs bg-white uppercase font-mono w-full"
            />
          ) : (
            <Select value={caseId} onValueChange={val => val && setCaseId(val)}>
              <SelectTrigger className="h-8 text-xs bg-white w-full border-slate-200">
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
          )}
        </div>

        {/* Record Type */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-700 mb-1">
            Record Type
          </label>
          <Select
            value={type}
            onValueChange={val => val && setType(val as EvidenceType)}
          >
            <SelectTrigger className="h-8 text-xs bg-white w-full border-slate-200">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {evidenceTypeOptions.map(opt => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Timestamp */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-[11px] font-semibold text-slate-700">
              Date & Time
            </label>
            <button
              type="button"
              onClick={() => {
                setTimestamp(new Date().toISOString().replace('T', ' ').slice(0, 19));
              }}
              className="text-[10px] text-blue-600 hover:underline flex items-center gap-1"
            >
              <Calendar className="size-2.5" />
              <span>Now</span>
            </button>
          </div>
          <Input
            type="text"
            value={timestamp}
            onChange={e => setTimestamp(e.target.value)}
            placeholder="YYYY-MM-DD HH:mm:ss"
            className="h-8 text-xs bg-white font-mono w-full"
          />
        </div>
      </div>

      {/* Row 2: Title & Source */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-[11px] font-semibold text-slate-700 mb-1">
            Title <span className="text-red-500">*</span>
          </label>
          <Input
            type="text"
            placeholder="e.g. Interrogation note: Rahul Sharma meeting"
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="h-8 text-xs bg-white w-full"
            required
          />
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-700 mb-1">
            Source Reference
          </label>
          <Input
            type="text"
            placeholder="e.g. Officer Diary Vol. 3, Bank Notice #901"
            value={sourceFile}
            onChange={e => setSourceFile(e.target.value)}
            className="h-8 text-xs bg-white w-full"
          />
        </div>
      </div>

      {/* Row 3: Classification & Confidence */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg">
        <div>
          <label className="text-[11px] font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
            <Shield className="size-3 text-blue-600" />
            <span>Classification</span>
          </label>
          <Select
            value={status}
            onValueChange={val => val && setStatus(val as EvidenceClassification)}
          >
            <SelectTrigger className="h-8 text-xs bg-white w-full border-slate-200">
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

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-[11px] font-semibold text-slate-700">
              Confidence Level
            </label>
            <Badge variant="outline" className="text-[10px] font-mono font-semibold text-blue-700 bg-blue-50">
              {confidence}%
            </Badge>
          </div>
          <div className="flex items-center gap-3 mt-1.5">
            <input
              type="range"
              min="20"
              max="100"
              step="1"
              value={confidence}
              onChange={e => setConfidence(Number(e.target.value))}
              className="flex-1 accent-blue-600 cursor-pointer h-1.5 bg-slate-200 rounded-lg"
            />
          </div>
        </div>
      </div>

      {/* Row 4: Summary */}
      <div>
        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
          Summary & Notes <span className="text-red-500">*</span>
        </label>
        <textarea
          rows={3}
          value={summary}
          onChange={e => setSummary(e.target.value)}
          placeholder="Describe key findings, statements, or record details..."
          className="w-full p-2.5 text-xs rounded-md border border-slate-200 bg-white focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-blue-600"
          required
        />
      </div>

      {/* Row 5: Classification Reason */}
      <div>
        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
          Classification Reason / Basis
        </label>
        <Input
          type="text"
          value={classificationRationale}
          onChange={e => setClassificationRationale(e.target.value)}
          placeholder="e.g. Corroborated with bank statement; verified in person."
          className="h-8 text-xs bg-white w-full"
        />
      </div>

      {/* Linked Entities */}
      <div className="p-3 bg-slate-50/70 border border-slate-200 rounded-lg flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 font-semibold text-slate-900 text-xs">
            <User className="size-3.5 text-blue-600" />
            <span>Linked Entities</span>
          </div>

          <Button
            type="button"
            variant="outline"
            size="xs"
            onClick={addQuickEntity}
            className="gap-1 text-[11px] h-6 bg-white"
          >
            <Plus className="size-3" />
            <span>Add Entity</span>
          </Button>
        </div>

        {/* Existing Entities Checkbox/Multi-select pill list */}
        {entities.length > 0 && (
          <div>
            <span className="text-[10px] text-slate-500 block mb-1.5">
              Select existing entities:
            </span>
            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1 bg-white border border-slate-200 rounded-md">
              {entities.map(ent => {
                const isSelected = selectedEntityIds.includes(ent.id);
                return (
                  <button
                    key={ent.id}
                    type="button"
                    onClick={() => {
                      setSelectedEntityIds(prev =>
                        isSelected
                          ? prev.filter(id => id !== ent.id)
                          : [...prev, ent.id]
                      );
                    }}
                    className={`px-2 py-0.5 rounded text-[11px] transition-colors flex items-center gap-1 border ${
                      isSelected
                        ? 'bg-blue-600 text-white border-blue-600 font-medium'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span>{ent.name}</span>
                    <span className="text-[9px] opacity-70">({ent.type})</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Dynamic New Entities created on the fly */}
        {newEntities.length > 0 && (
          <div className="space-y-2 mt-1">
            <span className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider">
              New Entities to Add
            </span>
            {newEntities.map(ne => (
              <div
                key={ne.id}
                className="grid grid-cols-1 sm:grid-cols-4 gap-2 p-2 bg-white border border-slate-200 rounded-md items-center"
              >
                <Input
                  type="text"
                  placeholder="Entity Name"
                  value={ne.name}
                  onChange={e => updateQuickEntity(ne.id, 'name', e.target.value)}
                  className="h-7 text-xs"
                />

                <Select
                  value={ne.type}
                  onValueChange={val => val && updateQuickEntity(ne.id, 'type', val)}
                >
                  <SelectTrigger className="h-7 text-xs bg-white w-full border-slate-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Person">Person</SelectItem>
                    <SelectItem value="Phone">Phone</SelectItem>
                    <SelectItem value="Vehicle">Vehicle</SelectItem>
                    <SelectItem value="Account">Account</SelectItem>
                    <SelectItem value="Location">Location</SelectItem>
                  </SelectContent>
                </Select>

                <Input
                  type="text"
                  placeholder="Identifier (Phone / Plate / Acct)"
                  value={ne.identifierValue || ''}
                  onChange={e => updateQuickEntity(ne.id, 'identifierValue', e.target.value)}
                  className="h-7 text-xs font-mono"
                />

                <div className="flex items-center justify-end">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => removeQuickEntity(ne.id)}
                    className="text-slate-400 hover:text-red-600"
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Additional Details Key-Value */}
      <div className="p-3 bg-slate-50/70 border border-slate-200 rounded-lg flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-slate-900 text-xs flex items-center gap-1.5">
            <FileText className="size-3.5 text-blue-600" />
            <span>Additional Details (Key / Value)</span>
          </span>
          <Button
            type="button"
            variant="outline"
            size="xs"
            onClick={addKeyValuePair}
            className="gap-1 text-[11px] h-6 bg-white"
          >
            <Plus className="size-3" />
            <span>Add Field</span>
          </Button>
        </div>

        <div className="space-y-1.5">
          {keyValuePairs.map(kv => (
            <div key={kv.id} className="flex items-center gap-2">
              <Input
                type="text"
                placeholder="Field name (e.g. amount, caller)"
                value={kv.key}
                onChange={e => updateKeyValuePair(kv.id, 'key', e.target.value)}
                className="h-7 text-xs bg-white font-mono flex-1"
              />
              <Input
                type="text"
                placeholder="Value"
                value={kv.value}
                onChange={e => updateKeyValuePair(kv.id, 'value', e.target.value)}
                className="h-7 text-xs bg-white font-mono flex-1"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                onClick={() => removeKeyValuePair(kv.id)}
                className="text-slate-400 hover:text-red-600 shrink-0"
              >
                <Trash2 className="size-3.5" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* Timeline Event Option */}
      <div className="p-3 bg-blue-50/40 border border-blue-200 rounded-lg flex flex-col gap-2">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={createTimelineEvent}
            onChange={e => setCreateTimelineEvent(e.target.checked)}
            className="size-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
          />
          <span className="font-semibold text-slate-900 text-xs flex items-center gap-1.5">
            <Clock className="size-3.5 text-blue-600" />
            <span>Add to Investigation Timeline</span>
          </span>
        </label>

        {createTimelineEvent && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1 pl-6">
            <div>
              <label className="block text-[10px] font-semibold text-slate-600 mb-1">
                Event Category
              </label>
              <Select
                value={timelineEventType}
                onValueChange={val =>
                  val &&
                  setTimelineEventType(
                    val as 'Call' | 'Transaction' | 'Location Ping' | 'Vehicle Sighting' | 'Report Entry'
                  )
                }
              >
                <SelectTrigger className="h-7 text-xs bg-white w-full border-slate-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Call">Call</SelectItem>
                  <SelectItem value="Transaction">Transaction</SelectItem>
                  <SelectItem value="Location Ping">Location Ping</SelectItem>
                  <SelectItem value="Vehicle Sighting">Vehicle Sighting</SelectItem>
                  <SelectItem value="Report Entry">Report Entry</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-slate-600 mb-1">
                Location
              </label>
              <Input
                type="text"
                placeholder="e.g. Sector 18, Noida"
                value={timelineLocation}
                onChange={e => setTimelineLocation(e.target.value)}
                className="h-7 text-xs bg-white w-full"
              />
            </div>
          </div>
        )}
      </div>

      {/* Submit Button */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-200">
        <div className="flex items-center gap-1 text-[11px] text-slate-500">
          <span>Logged by: {user?.name || user?.badgeId || 'Officer'}</span>
        </div>

        <Button
          type="submit"
          disabled={isSubmitting}
          className="bg-blue-600 hover:bg-blue-700 text-white text-xs h-8 px-5 font-medium shadow-xs focus-visible:ring-2 focus-visible:ring-blue-600"
        >
          {isSubmitting ? 'Saving...' : 'Save Record'}
        </Button>
      </div>
    </form>
  );
}
