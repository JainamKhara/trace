export type CaseStatus = 'Active' | 'Review' | 'Closed';

export type EntityType = 
  | 'Person' 
  | 'Phone' 
  | 'Vehicle' 
  | 'Account' 
  | 'Location' 
  | 'Organization' 
  | 'Case';

export type RelationshipType = 
  | 'CALLED' 
  | 'TRANSFERRED' 
  | 'OWNS' 
  | 'LOCATED_AT' 
  | 'ASSOCIATED_WITH' 
  | 'LINKED_TO' 
  | 'CONNECTED_TO';

export type EvidenceClassification = 
  | 'OBSERVED' 
  | 'DERIVED' 
  | 'INFERRED' 
  | 'HYPOTHESIS';

export type EvidenceType = 
  | 'FIR' 
  | 'CDR' 
  | 'Financial Record' 
  | 'Vehicle Record' 
  | 'Location Record' 
  | 'Report'
  | 'Digital Evidence'
  | 'CCTV / Media'
  | 'Forensic Dump';

export type LeadType = 
  | 'Potential Cross-Case Bridge' 
  | 'Entity Resolution Review' 
  | 'Unusual Relationship Cluster' 
  | 'Temporal Coincidence';

export type ReviewStatus = 'Pending' | 'Accepted' | 'Rejected' | 'Uncertain';

export interface Case {
  id: string;
  title: string;
  description: string;
  status: CaseStatus;
  priority: 'High' | 'Medium' | 'Low';
  leadInvestigator: string;
  tags: string[];
  entityCount: number;
  relationshipCount: number;
  evidenceCount: number;
  lastUpdated: string;
  dateOpened: string;
}

export interface Entity {
  id: string;
  name: string;
  aliases?: string[];
  type: EntityType;
  primaryCase: string;
  associatedCases: string[];
  confidence: number;
  identifiers: {
    phone?: string;
    registration?: string;
    accountNumber?: string;
    bank?: string;
    coordinates?: string;
    address?: string;
    nationalIdMasked?: string;
    imei?: string;
  };
  attributes?: Record<string, string | number | boolean | null | undefined>;
  notes?: string;
}

export interface Relationship {
  id: string;
  sourceId: string;
  targetId: string;
  type: RelationshipType;
  label: string;
  confidence: number;
  status: EvidenceClassification;
  sourceDoc: string;
  timestamp: string;
  caseId: string;
  isCrossCase?: boolean;
  metadata?: {
    callDurationSec?: number;
    amountInr?: number;
    frequency?: number;
    locationNote?: string;
    notes?: string;
  };
}

export interface Evidence {
  id: string;
  title: string;
  type: EvidenceType;
  caseId: string;
  sourceFile: string;
  timestamp: string;
  status: EvidenceClassification;
  confidence: number;
  relatedEntityIds: string[];
  relatedRelationshipId?: string;
  summary: string;
  classificationRationale: string;
  rawDataPreview: Record<string, string | number | boolean | null | undefined>;
}

export interface TimelineEvent {
  id: string;
  timestamp: string;
  timeFormatted: string;
  entityId: string;
  entityName: string;
  entityType: EntityType;
  caseId: string;
  eventType: 'Call' | 'Transaction' | 'Location Ping' | 'Vehicle Sighting' | 'Report Entry';
  title: string;
  description: string;
  location?: string;
  source: string;
  evidenceId: string;
  confidence: number;
}

export interface InvestigativeLead {
  id: string;
  title: string;
  type: LeadType;
  confidence: number;
  relatedCaseIds: string[];
  relatedEntityIds: string[];
  signals: string[];
  rationale: string;
  reviewStatus: ReviewStatus;
  reviewedBy?: string;
  reviewTimestamp?: string;
  reviewNotes?: string;
}

export interface NetworkGraphNode {
  data: {
    id: string;
    label: string;
    type: EntityType;
    caseId: string;
    confidence: number;
    phone?: string;
    registration?: string;
    accountNumber?: string;
    isCrossCaseBridge?: boolean;
    aliases?: string[];
  };
}

export interface NetworkGraphEdge {
  data: {
    id: string;
    source: string;
    target: string;
    type: RelationshipType;
    label: string;
    confidence: number;
    status: EvidenceClassification;
    sourceDoc: string;
    timestamp: string;
    caseId: string;
    isCrossCase?: boolean;
  };
}

export interface IngestedFileRecord {
  id: string;
  name: string;
  size: number;
  type: 'csv' | 'pdf' | 'image' | 'text' | 'other';
  mimeType: string;
  dataUrl?: string;
  sha256Hash: string;
  uploadedAt: string;
  uploadedBy: string;
  caseId: string;
  evidenceId?: string;
  parsedRowCount?: number;
  parsedColumns?: string[];
  notes?: string;
}

export interface ManualEvidenceInput {
  caseId: string;
  type: EvidenceType;
  title: string;
  sourceFile: string;
  timestamp: string;
  status: EvidenceClassification;
  confidence: number;
  summary: string;
  classificationRationale: string;
  relatedEntityIds?: string[];
  rawDataPreview?: Record<string, string | number | boolean | null | undefined>;
  createTimelineEvent?: boolean;
  timelineEventType?: 'Call' | 'Transaction' | 'Location Ping' | 'Vehicle Sighting' | 'Report Entry';
  timelineLocation?: string;
  newEntities?: Array<{
    name: string;
    type: EntityType;
    identifierKey?: 'phone' | 'registration' | 'accountNumber' | 'coordinates' | 'address';
    identifierValue?: string;
  }>;
}
