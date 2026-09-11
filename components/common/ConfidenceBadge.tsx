import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface ConfidenceBadgeProps {
  score: number;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export function ConfidenceBadge({
  score,
  label = 'Confidence',
  size = 'md',
  showLabel = true,
  className
}: ConfidenceBadgeProps) {
  let dotColor = 'bg-lime-500';

  if (score >= 90) {
    dotColor = 'bg-emerald-600';
  } else if (score >= 80) {
    dotColor = 'bg-blue-600';
  } else if (score >= 70) {
    dotColor = 'bg-amber-600';
  } else {
    dotColor = 'bg-slate-400';
  }

  return (
    <Badge
      variant="outline"
      className={cn(
        'font-normal gap-1.5 border-slate-200 bg-slate-50 text-slate-900',
        size === 'sm' && 'text-[10px] px-1.5 py-0 h-5',
        size === 'md' && 'text-xs px-2 py-0.5 h-6',
        size === 'lg' && 'text-sm px-2.5 py-1 h-7 font-medium',
        className
      )}
      title="Algorithmic signal confidence. Does not determine guilt."
    >
      <span className={cn('rounded-full shrink-0 size-1.5', dotColor)} />
      {showLabel && <span className="text-slate-500">{label}:</span>}
      <span className="font-semibold text-slate-900 tabular-nums">{score}%</span>
    </Badge>
  );
}
