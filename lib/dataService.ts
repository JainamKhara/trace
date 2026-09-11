import casesData from '@/data/cases.json';
import personsData from '@/data/persons.json';
import vehiclesData from '@/data/vehicles.json';
import accountsData from '@/data/accounts.json';
import locationsData from '@/data/locations.json';
import relationshipsData from '@/data/relationships.json';
import evidenceData from '@/data/evidence.json';
import timelineData from '@/data/timeline.json';
import leadsData from '@/data/leads.json';

import type {
  Case,
  Entity,
  Relationship,
  Evidence,
  TimelineEvent,
  InvestigativeLead,
  ReviewStatus,
  NetworkGraphNode,
  NetworkGraphEdge,
  EntityType,
  IngestedFileRecord,
  ManualEvidenceInput,
  EvidenceClassification,
  EvidenceType
} from '@/types/investigation';

// Build unified list of entities from persons, vehicles, accounts, and locations
const buildAllEntities = (): Entity[] => {
  const entityMap = new Map<string, Entity>();

  (personsData as unknown as Entity[]).forEach(e => entityMap.set(e.id, e));
  (vehiclesData as unknown as Entity[]).forEach(e => entityMap.set(e.id, e));
  (accountsData as unknown as Entity[]).forEach(e => entityMap.set(e.id, e));
  (locationsData as unknown as Entity[]).forEach(e => entityMap.set(e.id, e));

  return Array.from(entityMap.values());
};

const allEntities = buildAllEntities();
const allCases = casesData as unknown as Case[];
const allRelationships = relationshipsData as unknown as Relationship[];
const allEvidence = evidenceData as unknown as Evidence[];
const allTimeline = timelineData as unknown as TimelineEvent[];
const baseLeads = leadsData as unknown as InvestigativeLead[];
let cachedResolvedLeads: InvestigativeLead[] | null = null;
let cachedRecentActivities: ActivityLogItem[] | null = null;
let baseRecentActivities: ActivityLogItem[] | null = null;

const STORAGE_KEYS = {
  EVIDENCE: 'trace_custom_evidence',
  TIMELINE: 'trace_custom_timeline',
  ENTITIES: 'trace_custom_entities',
  FILES: 'trace_custom_files',
  ACTIVITIES: 'trace_custom_activities',
  CASES: 'trace_custom_cases',
  REVIEWS: 'wecontribute_lead_reviews'
};

type ReviewListener = () => void;
const reviewListeners = new Set<ReviewListener>();

export const subscribeDataUpdates = (listener: ReviewListener) => {
  reviewListeners.add(listener);

  const handleStorage = (e: StorageEvent) => {
    if (
      e.key &&
      (e.key.startsWith('trace_custom_') || e.key === STORAGE_KEYS.REVIEWS)
    ) {
      cachedResolvedLeads = resolveLeads();
      cachedRecentActivities = buildRecentActivities();
      listener();
    }
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('storage', handleStorage);
  }

  return () => {
    reviewListeners.delete(listener);
    if (typeof window !== 'undefined') {
      window.removeEventListener('storage', handleStorage);
    }
  };
};

export const notifyDataUpdates = () => {
  cachedResolvedLeads = resolveLeads();
  cachedRecentActivities = buildRecentActivities();
  reviewListeners.forEach(listener => {
    try {
      listener();
    } catch (err) {
      console.error('Listener callback error:', err);
    }
  });
};

export const subscribeLeadReviews = subscribeDataUpdates;
export const notifyLeadReviews = notifyDataUpdates;

export const getStoredCustomEvidence = (): Evidence[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.EVIDENCE);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const getStoredCustomTimeline = (): TimelineEvent[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TIMELINE);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const getStoredCustomEntities = (): Entity[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ENTITIES);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const getStoredCustomFiles = (): IngestedFileRecord[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.FILES);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const getStoredCustomActivities = (): ActivityLogItem[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ACTIVITIES);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

// In-memory / client-side localStorage state manager for Human-in-the-loop review
export const getStoredReviewStatuses = (): Record<string, { status: ReviewStatus; notes?: string }> => {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.REVIEWS);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

const resolveLeads = (): InvestigativeLead[] => {
  const stored = getStoredReviewStatuses();
  if (Object.keys(stored).length === 0) {
    return baseLeads;
  }
  return baseLeads.map(lead => {
    if (stored[lead.id]) {
      return {
        ...lead,
        reviewStatus: stored[lead.id].status,
        reviewNotes: stored[lead.id].notes || lead.reviewNotes,
        reviewedBy: 'Investigator (Analyst Desk)'
      };
    }
    return lead;
  });
};

export const getBaseInvestigativeLeads = (): InvestigativeLead[] => {
  return baseLeads;
};

export const saveReviewStatus = (leadId: string, status: ReviewStatus, notes?: string) => {
  if (typeof window !== 'undefined') {
    try {
      const existing = getStoredReviewStatuses();
      existing[leadId] = { status, notes };
      localStorage.setItem('wecontribute_lead_reviews', JSON.stringify(existing));
    } catch {
      // ignore localStorage errors
    }
  }

  cachedResolvedLeads = resolveLeads();
  cachedRecentActivities = buildRecentActivities();
  notifyLeadReviews();
};

export const getStoredCustomCases = (): Case[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CASES);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const getCases = (): Case[] => {
  const custom = getStoredCustomCases();
  if (custom.length === 0) return allCases;
  const map = new Map<string, Case>();
  allCases.forEach(c => map.set(c.id.toLowerCase(), c));
  custom.forEach(c => map.set(c.id.toLowerCase(), c));
  return Array.from(map.values());
};

export const getCaseById = (id: string): Case | undefined => {
  return getCases().find(c => c.id.toLowerCase() === id.toLowerCase());
};

export const addCustomCase = (newCase: Case): Case => {
  const custom = getStoredCustomCases();
  const existsIdx = custom.findIndex(c => c.id.toLowerCase() === newCase.id.toLowerCase());
  if (existsIdx >= 0) {
    custom[existsIdx] = newCase;
  } else {
    custom.unshift(newCase);
  }

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEYS.CASES, JSON.stringify(custom));
    } catch (err) {
      console.error('Failed to save custom case:', err);
    }
  }

  // Add activity log entry
  const storedActivities = getStoredCustomActivities();
  storedActivities.unshift({
    id: `ACT-CASE-${Date.now().toString().slice(-6)}`,
    type: 'update',
    title: `Case File Registered: ${newCase.id}`,
    description: `${newCase.title} registered with priority ${newCase.priority}. Lead: ${newCase.leadInvestigator}.`,
    timestamp: 'Just now • Case Intake',
    caseId: newCase.id,
    linkHref: `/cases`
  });
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEYS.ACTIVITIES, JSON.stringify(storedActivities.slice(0, 25)));
    } catch {
      // ignore
    }
  }

  notifyDataUpdates();
  return newCase;
};

export const getEntities = (): Entity[] => {
  const custom = getStoredCustomEntities();
  if (custom.length === 0) return allEntities;
  const map = new Map<string, Entity>();
  allEntities.forEach(e => map.set(e.id.toLowerCase(), e));
  custom.forEach(e => map.set(e.id.toLowerCase(), e));
  return Array.from(map.values());
};

export const getEntityById = (id: string): Entity | undefined => {
  return getEntities().find(e => e.id.toLowerCase() === id.toLowerCase());
};

export const getEntitiesByCase = (caseId: string): Entity[] => {
  const normCase = caseId.toUpperCase();
  return getEntities().filter(
    e => e.primaryCase.toUpperCase() === normCase || e.associatedCases.some(ac => ac.toUpperCase() === normCase)
  );
};

export const getRelationships = (): Relationship[] => {
  return allRelationships;
};

export const getRelationshipById = (id: string): Relationship | undefined => {
  return allRelationships.find(r => r.id.toLowerCase() === id.toLowerCase());
};

export const getRelationshipsByEntity = (entityId: string): Relationship[] => {
  const normId = entityId.toLowerCase();
  return allRelationships.filter(
    r => r.sourceId.toLowerCase() === normId || r.targetId.toLowerCase() === normId
  );
};

export const getRelationshipsByCase = (caseId: string): Relationship[] => {
  const normCase = caseId.toUpperCase();
  const caseEntities = new Set(getEntitiesByCase(normCase).map(e => e.id.toLowerCase()));
  return allRelationships.filter(
    r => r.caseId.toUpperCase() === normCase || 
         (caseEntities.has(r.sourceId.toLowerCase()) && caseEntities.has(r.targetId.toLowerCase())) ||
         (r.isCrossCase && (caseEntities.has(r.sourceId.toLowerCase()) || caseEntities.has(r.targetId.toLowerCase())))
  );
};

export const getEvidence = (): Evidence[] => {
  const custom = getStoredCustomEvidence();
  return [...custom, ...allEvidence];
};

export const getEvidenceById = (id: string): Evidence | undefined => {
  return getEvidence().find(ev => ev.id.toLowerCase() === id.toLowerCase());
};

export const getEvidenceByCase = (caseId: string): Evidence[] => {
  const normCase = caseId.toUpperCase();
  return getEvidence().filter(ev => ev.caseId.toUpperCase() === normCase);
};

export const getEvidenceByEntity = (entityId: string): Evidence[] => {
  const normId = entityId.toLowerCase();
  return getEvidence().filter(ev => 
    ev.relatedEntityIds.some(eid => eid.toLowerCase() === normId)
  );
};

export const getTimelineEvents = (filters?: {
  caseId?: string;
  entityId?: string;
  eventType?: string;
}): TimelineEvent[] => {
  const custom = getStoredCustomTimeline();
  let result = [...custom, ...allTimeline];

  if (filters?.caseId && filters.caseId !== 'ALL') {
    const cId = filters.caseId.toUpperCase();
    result = result.filter(ev => ev.caseId.toUpperCase() === cId);
  }

  if (filters?.entityId && filters.entityId !== 'ALL') {
    const eId = filters.entityId.toLowerCase();
    result = result.filter(ev => ev.entityId.toLowerCase() === eId);
  }

  if (filters?.eventType && filters.eventType !== 'ALL') {
    result = result.filter(ev => ev.eventType.toLowerCase() === filters.eventType?.toLowerCase());
  }

  return result.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
};

export const getInvestigativeLeads = (): InvestigativeLead[] => {
  if (!cachedResolvedLeads) {
    cachedResolvedLeads = resolveLeads();
  }
  return cachedResolvedLeads;
};

export const getLeadById = (id: string): InvestigativeLead | undefined => {
  return getInvestigativeLeads().find(l => l.id.toLowerCase() === id.toLowerCase());
};

export const getLeadsByCase = (caseId: string): InvestigativeLead[] => {
  const normCase = caseId.toUpperCase();
  return getInvestigativeLeads().filter(l => 
    l.relatedCaseIds.some(cid => cid.toUpperCase() === normCase)
  );
};

export const getDashboardStats = () => {
  const customEvCount = getStoredCustomEvidence().length;
  const currentEntities = getEntities();
  return {
    activeCases: allCases.filter(c => c.status === 'Active').length,
    totalCases: allCases.length,
    totalEntities: currentEntities.length,
    totalRelationships: allRelationships.length,
    potentialLeads: getInvestigativeLeads().length,
    totalEvidence: allEvidence.length + customEvCount
  };
};

export interface ActivityLogItem {
  id: string;
  type: 'update' | 'review' | 'bridge' | 'evidence';
  title: string;
  description: string;
  timestamp: string;
  caseId: string;
  linkHref: string;
}

export const buildRecentActivities = (): ActivityLogItem[] => {
  const activities: ActivityLogItem[] = [];
  const storedReviews = getStoredReviewStatuses();
  const storedCustomActivities = getStoredCustomActivities();

  // 0. Prepend recent custom actions (manual entry, file uploads)
  activities.push(...storedCustomActivities);

  // 1. Dynamic review activities logged by the investigator
  Object.entries(storedReviews).forEach(([leadId, reviewData], idx) => {
    const lead = baseLeads.find(l => l.id === leadId);
    if (lead) {
      activities.push({
        id: `REV-${lead.id}-${idx}`,
        type: 'review',
        title: `Investigator Determination: ${reviewData.status}`,
        description: `Lead "${lead.title}" reviewed and designated as ${reviewData.status}.${reviewData.notes ? ` Notes: "${reviewData.notes}"` : ''}`,
        timestamp: 'Recently • Analyst Desk',
        caseId: lead.relatedCaseIds.join(' / '),
        linkHref: `/dashboard`
      });
    }
  });

  // 2. Real evidence ingested records
  allEvidence.slice(0, 2).forEach(ev => {
    activities.push({
      id: `ACT-EV-${ev.id}`,
      type: 'evidence',
      title: `Forensic Evidence Ingested: ${ev.sourceFile}`,
      description: `${ev.title} (${ev.type}) registered into forensic index with ${ev.confidence}% confidence rating.`,
      timestamp: ev.timestamp,
      caseId: ev.caseId,
      linkHref: `/evidence?id=${ev.id}`
    });
  });

  // 3. Real cross-case correlation events
  const crossRel = allRelationships.find(r => r.isCrossCase);
  if (crossRel) {
    const srcEntity = allEntities.find(e => e.id === crossRel.sourceId);
    const tgtEntity = allEntities.find(e => e.id === crossRel.targetId);
    activities.push({
      id: `ACT-REL-${crossRel.id}`,
      type: 'bridge',
      title: `Cross-Case Bridge Corroborated: ${crossRel.type}`,
      description: `Correlated ${srcEntity?.name || crossRel.sourceId} to ${tgtEntity?.name || crossRel.targetId} with ${crossRel.confidence}% confidence.`,
      timestamp: '11 Aug 2026 • 06:00',
      caseId: crossRel.caseId,
      linkHref: `/network?case=${crossRel.caseId}`
    });
  }

  // 4. Real case dossier updates
  allCases.slice(0, 1).forEach(c => {
    activities.push({
      id: `ACT-CASE-${c.id}`,
      type: 'update',
      title: `Case Dossier Synchronized: ${c.id}`,
      description: `${c.title} updated with ${c.entityCount} monitored entities and active status '${c.status}'.`,
      timestamp: c.lastUpdated,
      caseId: c.id,
      linkHref: `/cases/${c.id}`
    });
  });

  return activities;
};

export const getBaseRecentActivities = (): ActivityLogItem[] => {
  if (!baseRecentActivities) {
    baseRecentActivities = [
      ...allEvidence.slice(0, 2).map(ev => ({
        id: `ACT-EV-${ev.id}`,
        type: 'evidence' as const,
        title: `Forensic Evidence Ingested: ${ev.sourceFile}`,
        description: `${ev.title} (${ev.type}) registered into forensic index with ${ev.confidence}% confidence rating.`,
        timestamp: ev.timestamp,
        caseId: ev.caseId,
        linkHref: `/evidence?id=${ev.id}`
      })),
      {
        id: 'ACT-REL-bridge',
        type: 'bridge' as const,
        title: 'Cross-Case Bridge Corroborated: TRANSFERRED',
        description: 'Correlated Rahul Sharma to Vikram Verma with 94% confidence.',
        timestamp: '11 Aug 2026 • 06:00',
        caseId: 'CASE-101',
        linkHref: '/network?case=CASE-101'
      }
    ];
  }
  return baseRecentActivities;
};

export const getRecentActivities = (): ActivityLogItem[] => {
  if (!cachedRecentActivities) {
    cachedRecentActivities = buildRecentActivities();
  }
  return cachedRecentActivities;
};

export type SearchCategory = 'Case' | 'Evidence' | EntityType;

export interface GlobalSearchResult {
  id: string;
  title: string;
  subtitle: string;
  category: SearchCategory;
  href: string;
  tag?: string;
}

export const globalSearch = (query: string): GlobalSearchResult[] => {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const results: GlobalSearchResult[] = [];

  // Cases
  allCases.forEach(c => {
    if (c.id.toLowerCase().includes(q) || c.title.toLowerCase().includes(q) || c.description.toLowerCase().includes(q)) {
      results.push({
        id: c.id,
        title: `${c.id}: ${c.title}`,
        subtitle: `${c.status} • ${c.entityCount} entities • ${c.relationshipCount} relationships`,
        category: 'Case',
        href: `/cases/${c.id}`,
        tag: c.status
      });
    }
  });

  // Entities
  allEntities.forEach(e => {
    const matchName = e.name.toLowerCase().includes(q);
    const matchAlias = e.aliases?.some(a => a.toLowerCase().includes(q));
    const matchPhone = e.identifiers?.phone?.toLowerCase().includes(q);
    const matchReg = e.identifiers?.registration?.toLowerCase().includes(q);
    const matchAcc = e.identifiers?.accountNumber?.toLowerCase().includes(q);
    const matchAddr = e.identifiers?.address?.toLowerCase().includes(q);

    if (matchName || matchAlias || matchPhone || matchReg || matchAcc || matchAddr) {
      let subtitle = `Primary: ${e.primaryCase}`;
      if (e.identifiers.phone) subtitle += ` • ${e.identifiers.phone}`;
      if (e.identifiers.registration) subtitle += ` • ${e.identifiers.registration}`;
      if (e.identifiers.accountNumber) subtitle += ` • Acct: ${e.identifiers.accountNumber}`;

      results.push({
        id: e.id,
        title: e.name,
        subtitle,
        category: e.type,
        href: `/network?entity=${e.id}&case=${e.primaryCase}`,
        tag: e.type
      });
    }
  });

  // Evidence
  allEvidence.forEach(ev => {
    if (
      ev.id.toLowerCase().includes(q) ||
      ev.title.toLowerCase().includes(q) ||
      ev.sourceFile.toLowerCase().includes(q) ||
      ev.summary.toLowerCase().includes(q)
    ) {
      results.push({
        id: ev.id,
        title: `${ev.id}: ${ev.title}`,
        subtitle: `${ev.type} • ${ev.caseId} • Source: ${ev.sourceFile}`,
        category: 'Evidence',
        href: `/evidence?id=${ev.id}`,
        tag: ev.status
      });
    }
  });

  return results.slice(0, 15);
};

// Cytoscape Graph Data Generator
export const getCytoscapeGraphData = (params?: {
  caseId?: string;
  entityType?: string;
  relationshipType?: string;
  filterCrossCaseOnly?: boolean;
}) => {
  let filteredEntities = [...allEntities];
  let filteredRelationships = [...allRelationships];

  if (params?.caseId && params.caseId !== 'ALL') {
    const targetCase = params.caseId.toUpperCase();
    const caseEntityIds = new Set<string>();

    allEntities.forEach(e => {
      if (e.primaryCase.toUpperCase() === targetCase || e.associatedCases.some(ac => ac.toUpperCase() === targetCase)) {
        caseEntityIds.add(e.id);
      }
    });

    filteredRelationships = filteredRelationships.filter(r => {
      const sourceInCase = caseEntityIds.has(r.sourceId);
      const targetInCase = caseEntityIds.has(r.targetId);
      return sourceInCase || targetInCase;
    });

    const activeNodeIds = new Set<string>();
    filteredRelationships.forEach(r => {
      activeNodeIds.add(r.sourceId);
      activeNodeIds.add(r.targetId);
    });
    caseEntityIds.forEach(id => activeNodeIds.add(id));

    filteredEntities = filteredEntities.filter(e => activeNodeIds.has(e.id));
  }

  if (params?.entityType && params.entityType !== 'ALL') {
    const validIds = new Set(
      filteredEntities.filter(e => e.type.toLowerCase() === params.entityType?.toLowerCase()).map(e => e.id)
    );
    // Keep nodes of selected type plus their direct 1-hop connections
    const connectedIds = new Set<string>();
    filteredRelationships.forEach(r => {
      if (validIds.has(r.sourceId)) connectedIds.add(r.targetId);
      if (validIds.has(r.targetId)) connectedIds.add(r.sourceId);
    });
    filteredEntities = filteredEntities.filter(e => validIds.has(e.id) || connectedIds.has(e.id));
  }

  if (params?.relationshipType && params.relationshipType !== 'ALL') {
    filteredRelationships = filteredRelationships.filter(
      r => r.type.toLowerCase() === params.relationshipType?.toLowerCase()
    );
  }

  if (params?.filterCrossCaseOnly) {
    filteredRelationships = filteredRelationships.filter(r => r.isCrossCase);
    const activeNodeIds = new Set<string>();
    filteredRelationships.forEach(r => {
      activeNodeIds.add(r.sourceId);
      activeNodeIds.add(r.targetId);
    });
    filteredEntities = filteredEntities.filter(e => activeNodeIds.has(e.id));
  }

  const nodes: NetworkGraphNode[] = filteredEntities.map(e => ({
    data: {
      id: e.id,
      label: e.name,
      type: e.type,
      caseId: e.primaryCase,
      confidence: e.confidence,
      phone: e.identifiers.phone,
      registration: e.identifiers.registration,
      accountNumber: e.identifiers.accountNumber,
      isCrossCaseBridge: e.associatedCases.length > 1,
      aliases: e.aliases
    }
  }));

  const nodeMap = new Set(nodes.map(n => n.data.id));

  const edges: NetworkGraphEdge[] = filteredRelationships
    .filter(r => nodeMap.has(r.sourceId) && nodeMap.has(r.targetId))
    .map(r => ({
      data: {
        id: r.id,
        source: r.sourceId,
        target: r.targetId,
        type: r.type,
        label: r.label,
        confidence: r.confidence,
        status: r.status,
        sourceDoc: r.sourceDoc,
        timestamp: r.timestamp,
        caseId: r.caseId,
        isCrossCase: !!r.isCrossCase
      }
    }));

  return { nodes, edges };
};

export const getIngestedFiles = (): IngestedFileRecord[] => {
  return getStoredCustomFiles();
};

export const addManualEvidence = (
  input: ManualEvidenceInput,
  officerBadge?: string
): { evidence: Evidence; timelineEvent?: TimelineEvent; createdEntities: Entity[] } => {
  const timestamp = input.timestamp || new Date().toISOString().replace('T', ' ').slice(0, 19);
  const evidenceId = `EV-MAN-${Date.now().toString().slice(-6)}`;
  
  // 1. Resolve / Create linked entities
  const createdEntities: Entity[] = [];
  const relatedEntityIds: string[] = [...(input.relatedEntityIds || [])];

  if (input.newEntities && input.newEntities.length > 0) {
    const storedEntities = getStoredCustomEntities();
    input.newEntities.forEach((ne, i) => {
      const entId = `ENT-MAN-${Date.now().toString().slice(-4)}-${i + 1}`;
      const identifiers: Entity['identifiers'] = {};
      if (ne.identifierKey && ne.identifierValue) {
        identifiers[ne.identifierKey] = ne.identifierValue;
      }
      const newEnt: Entity = {
        id: entId,
        name: ne.name,
        type: ne.type,
        primaryCase: input.caseId,
        associatedCases: [input.caseId],
        confidence: input.confidence,
        identifiers,
        notes: `Created via manual evidence entry [${evidenceId}]`
      };
      createdEntities.push(newEnt);
      relatedEntityIds.push(entId);
      storedEntities.push(newEnt);
    });

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEYS.ENTITIES, JSON.stringify(storedEntities));
      } catch (err) {
        console.error('Failed to save custom entities to localStorage:', err);
      }
    }
  }

  // 2. Build Evidence object
  const newEvidence: Evidence = {
    id: evidenceId,
    title: input.title,
    type: input.type,
    caseId: input.caseId.toUpperCase(),
    sourceFile: input.sourceFile || 'Manual Police Memo / Field Entry',
    timestamp,
    status: input.status,
    confidence: input.confidence,
    relatedEntityIds,
    summary: input.summary,
    classificationRationale: input.classificationRationale || 'Verified forensic entry manually registered by authorized officer.',
    rawDataPreview: input.rawDataPreview || {
      ingestMethod: 'MANUAL_ENTRY',
      recordedTimestamp: timestamp,
      operatorBadge: officerBadge || 'ACTIVE_OFFICER'
    }
  };

  const storedEvidence = getStoredCustomEvidence();
  storedEvidence.unshift(newEvidence);
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEYS.EVIDENCE, JSON.stringify(storedEvidence));
    } catch (err) {
      console.error('Failed to save custom evidence to localStorage:', err);
    }
  }

  // 3. Optional Timeline Event creation
  let newTimelineEvent: TimelineEvent | undefined;
  if (input.createTimelineEvent) {
    const primaryEnt = createdEntities[0] || (relatedEntityIds[0] ? getEntityById(relatedEntityIds[0]) : undefined);
    newTimelineEvent = {
      id: `TL-MAN-${Date.now().toString().slice(-6)}`,
      timestamp,
      timeFormatted: timestamp.includes('T') ? timestamp.replace('T', ' • ').slice(0, 16) : timestamp,
      entityId: primaryEnt ? primaryEnt.id : 'ENT-GENERAL',
      entityName: primaryEnt ? primaryEnt.name : 'General Case Inquiry',
      entityType: primaryEnt ? primaryEnt.type : 'Case',
      caseId: input.caseId.toUpperCase(),
      eventType: input.timelineEventType || 'Report Entry',
      title: input.title,
      description: input.summary,
      location: input.timelineLocation || 'Field Jurisdiction',
      source: input.sourceFile || 'Manual Ingestion Memo',
      evidenceId,
      confidence: input.confidence
    };

    const storedTimeline = getStoredCustomTimeline();
    storedTimeline.unshift(newTimelineEvent);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEYS.TIMELINE, JSON.stringify(storedTimeline));
      } catch (err) {
        console.error('Failed to save custom timeline to localStorage:', err);
      }
    }
  }

  // 4. Activity Log Item
  const newActivity: ActivityLogItem = {
    id: `ACT-MAN-${Date.now().toString().slice(-6)}`,
    type: 'evidence',
    title: `Manual Record Ingested: ${input.title}`,
    description: `${input.type} registered into ${input.caseId} with ${input.confidence}% confidence rating. Recorded by ${officerBadge || 'Investigator'}.`,
    timestamp: 'Just now • Manual Ingest',
    caseId: input.caseId,
    linkHref: `/evidence?id=${evidenceId}`
  };
  const storedActivities = getStoredCustomActivities();
  storedActivities.unshift(newActivity);
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEYS.ACTIVITIES, JSON.stringify(storedActivities.slice(0, 25)));
    } catch (err) {
      console.error('Failed to save custom activities to localStorage:', err);
    }
  }

  notifyDataUpdates();
  return { evidence: newEvidence, timelineEvent: newTimelineEvent, createdEntities };
};

export const addUploadedFiles = (
  files: IngestedFileRecord[],
  options?: {
    defaultClassification?: EvidenceClassification;
    createEvidence?: boolean;
    officerBadge?: string;
  }
): { evidenceItems: Evidence[]; ingestedFiles: IngestedFileRecord[] } => {
  const storedFiles = getStoredCustomFiles();
  const storedEvidence = getStoredCustomEvidence();
  const storedActivities = getStoredCustomActivities();
  const newEvidenceItems: Evidence[] = [];

  files.forEach((file, idx) => {
    storedFiles.unshift(file);

    if (options?.createEvidence !== false) {
      const evId = `EV-FILE-${Date.now().toString().slice(-6)}-${idx + 1}`;
      file.evidenceId = evId;

      let evType: EvidenceType = 'Report';
      if (file.type === 'csv') evType = 'CDR';
      else if (file.type === 'pdf') evType = 'FIR';
      else if (file.type === 'image') evType = 'CCTV / Media';

      const ev: Evidence = {
        id: evId,
        title: `File Evidence: ${file.name}`,
        type: evType,
        caseId: file.caseId.toUpperCase(),
        sourceFile: file.name,
        timestamp: file.uploadedAt,
        status: options?.defaultClassification || 'OBSERVED',
        confidence: file.type === 'image' ? 95 : file.type === 'csv' ? 94 : 90,
        relatedEntityIds: [],
        summary: file.notes || `${file.type.toUpperCase()} file ${file.name} (${Math.round(file.size / 1024)} KB) uploaded to ${file.caseId}.`,
        classificationRationale: `File uploaded by officer ${file.uploadedBy || options?.officerBadge || 'Investigator'}.`,
        rawDataPreview: {
          fileName: file.name,
          fileSize: file.size,
          sha256: file.sha256Hash,
          mimeType: file.mimeType,
          parsedRowCount: file.parsedRowCount || 0,
          parsedColumns: file.parsedColumns?.join(', ') || 'N/A'
        }
      };

      storedEvidence.unshift(ev);
      newEvidenceItems.push(ev);

      storedActivities.unshift({
        id: `ACT-FILE-${Date.now().toString().slice(-6)}-${idx}`,
        type: 'evidence',
        title: `File Uploaded: ${file.name}`,
        description: `Uploaded ${file.type.toUpperCase()} (${(file.size / 1024).toFixed(1)} KB) to ${file.caseId}.`,
        timestamp: 'Just now • File Upload',
        caseId: file.caseId,
        linkHref: `/evidence?id=${evId}`
      });
    }
  });

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEYS.FILES, JSON.stringify(storedFiles));
      localStorage.setItem(STORAGE_KEYS.EVIDENCE, JSON.stringify(storedEvidence));
      localStorage.setItem(STORAGE_KEYS.ACTIVITIES, JSON.stringify(storedActivities.slice(0, 25)));
    } catch (err) {
      console.error('Failed to save uploaded files to localStorage:', err);
    }
  }

  notifyDataUpdates();
  return { evidenceItems: newEvidenceItems, ingestedFiles: files };
};

export const deleteCustomEvidence = (id: string) => {
  const stored = getStoredCustomEvidence();
  const filtered = stored.filter(ev => ev.id !== id);
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEYS.EVIDENCE, JSON.stringify(filtered));
  }
  notifyDataUpdates();
};

export const deleteCustomFile = (id: string) => {
  const stored = getStoredCustomFiles();
  const filtered = stored.filter(f => f.id !== id);
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEYS.FILES, JSON.stringify(filtered));
  }
  notifyDataUpdates();
};

export const updateCustomEvidenceNote = (id: string, newSummary: string) => {
  const stored = getStoredCustomEvidence();
  const item = stored.find(ev => ev.id === id);
  if (item) {
    item.summary = newSummary;
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.EVIDENCE, JSON.stringify(stored));
    }
    notifyDataUpdates();
  }
};

export const addBatchTimelineEvents = (
  events: TimelineEvent[],
  newEntitiesList?: Entity[]
) => {
  if (events.length === 0) return;
  const storedTimeline = getStoredCustomTimeline();
  events.forEach(ev => storedTimeline.unshift(ev));

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEYS.TIMELINE, JSON.stringify(storedTimeline));
    } catch (err) {
      console.error('Failed to save batch timeline events:', err);
    }
  }

  if (newEntitiesList && newEntitiesList.length > 0) {
    const storedEntities = getStoredCustomEntities();
    const existingMap = new Map(storedEntities.map(e => [e.id.toLowerCase(), e]));
    newEntitiesList.forEach(e => existingMap.set(e.id.toLowerCase(), e));
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(
          STORAGE_KEYS.ENTITIES,
          JSON.stringify(Array.from(existingMap.values()))
        );
      } catch (err) {
        console.error('Failed to save batch entities:', err);
      }
    }
  }

  notifyDataUpdates();
};

export const clearCustomData = () => {
  if (typeof window !== 'undefined') {
    Object.values(STORAGE_KEYS).forEach(k => {
      if (k !== STORAGE_KEYS.REVIEWS) {
        localStorage.removeItem(k);
      }
    });
  }
  notifyDataUpdates();
};
