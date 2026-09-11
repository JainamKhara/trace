import React from 'react';
import { Badge } from '@/components/ui/badge';
import type { EvidenceClassification } from '@/types/investigation';
import { cn } from '@/lib/utils';

interface ClassificationBadgeProps {
  status: EvidenceClassification;
  size?: 'sm' | 'md';
  className?: string;
}

const statusConfigs: Record<EvidenceClassification, { label: string; dot: string; desc: string }> = {
  OBSERVED: {
    label: 'Observed',
    dot: 'bg-emerald-600',
    desc: 'Direct primary physical or digital record'
  },
  DERIVED: {
    label: 'Derived',
    dot: 'bg-blue-600',
    desc: 'Algorithmic calculation from corroborated records'
  },
  INFERRED: {
    label: 'Inferred',
    dot: 'bg-purple-600',
    desc: 'Logical deduction from circumstantial proximity'
  },
  HYPOTHESIS: {
    label: 'Hypothesis',
    dot: 'bg-amber-600',
    desc: 'Investigative premise awaiting corroboration'
  }
};

export function ClassificationBadge({
  status,
  size = 'md',
  className
}: ClassificationBadgeProps) {
  const config = statusConfigs[status] || statusConfigs.OBSERVED;

  return (
    <Badge
      variant="outline"
      className={cn(
        'font-normal gap-1.5 border-slate-200 bg-slate-50 text-slate-900 tracking-normal',
        size === 'sm' ? 'text-[10px] px-1.5 py-0 h-5' : 'text-xs px-2 py-0.5 h-6',
        className
      )}
      title={config.desc}
    >
      <span className={cn('rounded-full shrink-0 size-1.5', config.dot)} />
      <span>{config.label}</span>
    </Badge>
  );
}
