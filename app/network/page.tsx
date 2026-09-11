import React, { Suspense } from 'react';
import { NetworkWorkspace } from '@/components/network/NetworkWorkspace';

export default function NetworkPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 flex items-center justify-center h-full bg-[#080c14] text-xs font-mono text-slate-400">
          Initializing Cytoscape Network Workspace...
        </div>
      }
    >
      <NetworkWorkspace />
    </Suspense>
  );
}
