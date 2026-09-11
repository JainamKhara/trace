'use client';

import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { Activity, Network } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getRelationships, getEntities } from '@/lib/dataService';

export function NetworkOverviewChart() {
  const relationships = getRelationships();
  const entities = getEntities();

  const relationshipData = [
    { type: 'Calls', count: relationships.filter(r => r.type === 'CALLED').length, fill: '#2563eb' },
    { type: 'Transfers', count: relationships.filter(r => r.type === 'TRANSFERRED').length, fill: '#10b981' },
    { type: 'Ownership', count: relationships.filter(r => r.type === 'OWNS').length, fill: '#f59e0b' },
    { type: 'Locations', count: relationships.filter(r => r.type === 'LOCATED_AT').length, fill: '#8b5cf6' },
    { type: 'Associations', count: relationships.filter(r => r.type === 'ASSOCIATED_WITH').length, fill: '#06b6d4' },
    { type: 'Linked To', count: relationships.filter(r => r.type === 'LINKED_TO' || r.type === 'CONNECTED_TO').length, fill: '#f43f5e' }
  ];

  const entityTypeData = [
    { name: 'People', value: entities.filter(e => e.type === 'Person').length, fill: '#2563eb' },
    { name: 'Phones', value: entities.filter(e => e.type === 'Phone').length, fill: '#06b6d4' },
    { name: 'Vehicles', value: entities.filter(e => e.type === 'Vehicle').length, fill: '#f59e0b' },
    { name: 'Accounts', value: entities.filter(e => e.type === 'Account').length, fill: '#10b981' },
    { name: 'Locations', value: entities.filter(e => e.type === 'Location').length, fill: '#8b5cf6' },
    { name: 'Orgs', value: entities.filter(e => e.type === 'Organization').length, fill: '#f43f5e' }
  ];
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
      {/* Bar Chart: Relationship Types */}
      <Card className="lg:col-span-2 border-border bg-card shadow-xs">
        <CardHeader className="flex flex-row items-center justify-between border-b border-border/60 px-4 py-3">
          <div className="flex items-center gap-2">
            <Activity className="size-4 text-blue-600" />
            <CardTitle className="text-sm font-semibold text-slate-900">
              Which connection types dominate the intelligence network?
            </CardTitle>
          </div>
          <Badge variant="outline" className="text-xs text-slate-600 font-medium tabular-nums">
            {relationships.length} Direct Records
          </Badge>
        </CardHeader>

        <CardContent className="p-4">
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={relationshipData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <XAxis
                  dataKey="type"
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={false}
                />
                <YAxis
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderColor: '#e2e8f0',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: '#0f172a',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)'
                  }}
                  formatter={(val) => [`${val ?? 0} Links`, 'Count']}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {relationshipData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} fillOpacity={0.9} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Pie Chart: Entity Breakdown */}
      <Card className="border-border bg-card shadow-xs">
        <CardHeader className="flex flex-row items-center justify-between border-b border-border/60 px-4 py-3">
          <div className="flex items-center gap-2">
            <Network className="size-4 text-blue-600" />
            <CardTitle className="text-sm font-semibold text-slate-900">
              What entity classes are under active cross-case surveillance?
            </CardTitle>
          </div>
          <Badge variant="outline" className="text-xs text-slate-600 font-medium tabular-nums">
            {entities.length} Nodes
          </Badge>
        </CardHeader>

        <CardContent className="p-4 flex flex-col items-center justify-center">
          <div className="h-40 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderColor: '#e2e8f0',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: '#0f172a',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)'
                  }}
                />
                <Pie
                  data={entityTypeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={36}
                  outerRadius={60}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {entityTypeData.map((entry, index) => (
                    <Cell key={`slice-${index}`} fill={entry.fill} stroke="#ffffff" strokeWidth={2} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-3 gap-2 w-full pt-3 border-t border-border/50 text-[11px]">
            {entityTypeData.map(item => (
              <div key={item.name} className="flex items-center gap-1.5 text-slate-600">
                <span className="size-2 rounded-full shrink-0" style={{ backgroundColor: item.fill }} />
                <span className="truncate">{item.name}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
