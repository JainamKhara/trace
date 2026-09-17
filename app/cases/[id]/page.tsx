import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  Network,
  Users,
  FileSearch,
  Clock,
  ArrowLeft,
  ArrowRight,
  Smartphone,
  Car,
  CreditCard,
  MapPin,
  Building,
  User,
  ExternalLink,
  ShieldAlert
} from 'lucide-react';
import {
  getCases,
  getCaseById,
  getEntitiesByCase,
  getRelationshipsByCase,
  getEvidenceByCase,
  getLeadsByCase
} from '@/lib/dataService';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ConfidenceBadge } from '@/components/common/ConfidenceBadge';
import { ClassificationBadge } from '@/components/common/ClassificationBadge';
import { InvestigativeLeadCard } from '@/components/common/InvestigativeLeadCard';
import type { CaseStatus } from '@/types/investigation';
import { cn } from '@/lib/utils';

export async function generateStaticParams() {
  const cases = getCases();
  return cases.map((c) => ({
    id: c.id,
  }));
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function CaseDetailPage({ params }: PageProps) {
  const { id } = await params;
  const caseItem = getCaseById(id);

  if (!caseItem) {
    notFound();
  }

  const entities = getEntitiesByCase(caseItem.id);
  const relationships = getRelationshipsByCase(caseItem.id);
  const evidence = getEvidenceByCase(caseItem.id);
  const leads = getLeadsByCase(caseItem.id);

  const people = entities.filter(e => e.type === 'Person');
  const phones = entities.filter(e => e.type === 'Phone');
  const vehicles = entities.filter(e => e.type === 'Vehicle');
  const accounts = entities.filter(e => e.type === 'Account');
  const locations = entities.filter(e => e.type === 'Location');
  const organizations = entities.filter(e => e.type === 'Organization');

  const getStatusBadge = (status: CaseStatus) => {
    switch (status) {
      case 'Active':
        return (
          <Badge variant="outline" className="gap-1.5 border-emerald-200 bg-emerald-50 text-emerald-800 font-normal">
            <span className="size-1.5 rounded-full bg-emerald-600" />
            Active
          </Badge>
        );
      case 'Review':
        return (
          <Badge variant="outline" className="gap-1.5 border-amber-200 bg-amber-50 text-amber-800 font-normal">
            <span className="size-1.5 rounded-full bg-amber-600" />
            Review
          </Badge>
        );
      case 'Closed':
        return (
          <Badge variant="outline" className="gap-1.5 border-slate-200 bg-slate-100 text-slate-700 font-normal">
            <span className="size-1.5 rounded-full bg-slate-500" />
            Closed
          </Badge>
        );
    }
  };

  return (
    <div className="p-6 flex flex-col gap-6 max-w-[1600px] mx-auto w-full">
      {/* Back link & Top Bar */}
      <div className="flex items-center justify-between">
        <Link
          href="/cases"
          className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'gap-1.5 text-xs text-muted-foreground hover:text-foreground')}
        >
          <ArrowLeft className="size-3.5" />
          <span>Back to Cases Register</span>
        </Link>

        <Badge variant="outline" className="text-muted-foreground font-normal bg-card">
          Synthetic Local Dataset
        </Badge>
      </div>

      {/* Case Header Card */}
      <Card className="border-border bg-card shadow-xs">
        <CardContent className="p-5 flex flex-col gap-4">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="font-mono text-xs font-semibold text-primary">
                  {caseItem.id}
                </Badge>
                {getStatusBadge(caseItem.status)}
                <Badge variant="outline" className="text-xs text-muted-foreground font-normal">
                  Priority: {caseItem.priority}
                </Badge>
              </div>

              <h1 className="text-xl font-bold text-foreground tracking-tight">
                {caseItem.title}
              </h1>
              <p className="text-xs text-muted-foreground max-w-3xl leading-relaxed">
                {caseItem.description}
              </p>
            </div>

            {/* Primary CTA */}
            <div className="flex items-center gap-2">
              <Link
                href={`/timeline?case=${caseItem.id}`}
                className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'gap-1.5 text-xs')}
              >
                <Clock className="size-3.5 text-muted-foreground" />
                <span>Timeline</span>
              </Link>

              <Link
                href={`/network?case=${caseItem.id}`}
                className={cn(buttonVariants({ variant: 'default', size: 'sm' }), 'gap-2 text-xs')}
              >
                <Network className="size-4" />
                <span>Open Network Analysis</span>
              </Link>
            </div>
          </div>

          <Separator />

          {/* Quick Meta Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <span className="text-[11px] text-muted-foreground block">Lead Investigator</span>
              <span className="text-foreground font-medium">{caseItem.leadInvestigator}</span>
            </div>
            <div>
              <span className="text-[11px] text-muted-foreground block">Date Opened</span>
              <span className="text-foreground">{caseItem.dateOpened}</span>
            </div>
            <div>
              <span className="text-[11px] text-muted-foreground block">Links / Evidence</span>
              <span className="text-foreground">{relationships.length} links • {evidence.length} records</span>
            </div>
            <div>
              <span className="text-[11px] text-muted-foreground block">Tags</span>
              <span className="text-foreground truncate block">
                {caseItem.tags.join(', ')}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Entity Breakdown Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'People', count: people.length, icon: User, color: 'text-blue-700 bg-blue-50 border-blue-200' },
          { label: 'Phones', count: phones.length, icon: Smartphone, color: 'text-sky-700 bg-sky-50 border-sky-200' },
          { label: 'Vehicles', count: vehicles.length, icon: Car, color: 'text-amber-800 bg-amber-50 border-amber-200' },
          { label: 'Accounts', count: accounts.length, icon: CreditCard, color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
          { label: 'Locations', count: locations.length, icon: MapPin, color: 'text-purple-700 bg-purple-50 border-purple-200' },
          { label: 'Organizations', count: organizations.length, icon: Building, color: 'text-slate-700 bg-slate-100 border-slate-200' }
        ].map((item, idx) => {
          const Icon = item.icon;
          return (
            <Card key={idx} className="border-border bg-card shadow-xs">
              <CardContent className="p-3 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-medium text-muted-foreground block">
                    {item.label}
                  </span>
                  <span className="text-lg font-semibold text-foreground">
                    {item.count}
                  </span>
                </div>
                <div className={`size-8 rounded-lg flex items-center justify-center border ${item.color}`}>
                  <Icon className="size-4" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Potential Leads in this Case */}
      {leads.length > 0 && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 pb-2 border-b border-border/70">
            <ShieldAlert className="size-4 text-amber-500" />
            <h2 className="text-sm font-semibold text-foreground">
              Potential Investigative Leads ({leads.length})
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {leads.map(lead => (
              <InvestigativeLeadCard key={lead.id} lead={lead} />
            ))}
          </div>
        </div>
      )}

      {/* Two Column Layout: Entities & Evidence */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Entities Section */}
        <Card className="border-border bg-card shadow-xs flex flex-col overflow-hidden">
          <CardHeader className="p-4 border-b border-border/70 flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="size-4 text-primary" />
              <CardTitle className="text-sm font-semibold text-foreground">
                Connected Entities ({entities.length})
              </CardTitle>
            </div>
            <Link
              href={`/network?case=${caseItem.id}`}
              className={cn(buttonVariants({ variant: 'ghost', size: 'xs' }), 'text-xs text-primary font-medium gap-1')}
            >
              <span>Inspect in Graph</span>
              <ArrowRight className="size-3" />
            </Link>
          </CardHeader>

          <CardContent className="p-2 divide-y divide-border/50 overflow-y-auto max-h-[440px]">
            {entities.map(e => (
              <div
                key={e.id}
                className="py-2.5 px-3 rounded-md hover:bg-muted/40 transition-colors flex items-center justify-between gap-2"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Badge variant="outline" className="text-[10px] font-normal text-muted-foreground">
                    {e.type}
                  </Badge>
                  <div className="min-w-0">
                    <span className="text-xs font-medium text-foreground block truncate">
                      {e.name}
                    </span>
                    <span className="text-[11px] text-muted-foreground font-mono truncate block">
                      {e.identifiers.phone || e.identifiers.registration || e.identifiers.accountNumber || e.identifiers.address}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <ConfidenceBadge score={e.confidence} size="sm" showLabel={false} />
                  <Link
                    href={`/network?entity=${e.id}&case=${caseItem.id}`}
                    title="Focus Entity in Network"
                    className={cn(buttonVariants({ variant: 'ghost', size: 'icon-xs' }))}
                  >
                    <ExternalLink className="size-3.5 text-muted-foreground hover:text-primary" />
                  </Link>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Evidence Records Section */}
        <Card className="border-border bg-card shadow-xs flex flex-col overflow-hidden">
          <CardHeader className="p-4 border-b border-border/70 flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <FileSearch className="size-4 text-emerald-500" />
              <CardTitle className="text-sm font-semibold text-foreground">
                Supporting Evidence Records ({evidence.length})
              </CardTitle>
            </div>
            <Link
              href="/evidence"
              className={cn(buttonVariants({ variant: 'ghost', size: 'xs' }), 'text-xs text-primary font-medium gap-1')}
            >
              <span>All Evidence</span>
              <ArrowRight className="size-3" />
            </Link>
          </CardHeader>

          <CardContent className="p-2 divide-y divide-border/50 overflow-y-auto max-h-[440px]">
            {evidence.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground">
                No direct evidence records linked to this case.
              </div>
            ) : (
              evidence.map(ev => (
                <div
                  key={ev.id}
                  className="py-2.5 px-3 rounded-md hover:bg-muted/40 transition-colors flex items-start justify-between gap-2"
                >
                  <div className="flex flex-col gap-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-medium text-emerald-400">
                        {ev.id}
                      </span>
                      <ClassificationBadge status={ev.status} size="sm" />
                      <Badge variant="outline" className="text-[10px] font-normal text-muted-foreground">
                        {ev.type}
                      </Badge>
                    </div>
                    <span className="text-xs text-foreground font-medium block truncate">
                      {ev.title}
                    </span>
                    <p className="text-[11px] text-muted-foreground line-clamp-2">
                      {ev.summary}
                    </p>
                    <div className="text-[11px] text-muted-foreground flex items-center gap-2">
                      <span>Source: {ev.sourceFile}</span>
                      <span>•</span>
                      <span>{ev.timestamp}</span>
                    </div>
                  </div>

                  <div className="shrink-0 pt-1">
                    <Link
                      href={`/evidence?id=${ev.id}`}
                      className={cn(buttonVariants({ variant: 'outline', size: 'xs' }))}
                    >
                      Inspect
                    </Link>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
