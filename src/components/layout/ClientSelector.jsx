import React from 'react';
import { Building2, Check, ChevronDown, Sparkles } from 'lucide-react';
import { useClient } from '@/context/ClientContext';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function ClientSelector({ className = '' }) {
  const { clients, selectedClient, switchClient, loadingClients } = useClient();

  if (loadingClients && !selectedClient) {
    return (
      <div className="h-9 w-40 rounded-full bg-slate-100 animate-pulse border border-slate-200" />
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={`h-9 px-3 gap-2 rounded-full border border-emerald-900/10 bg-white hover:bg-emerald-50/50 shadow-xs transition-all cursor-pointer text-slate-800 ${className}`}
        >
          <div className="h-5 w-5 rounded-full bg-[#14532D] text-white flex items-center justify-center shrink-0">
            <Building2 className="h-3 w-3" />
          </div>
          <span className="font-semibold text-xs tracking-tight truncate max-w-[130px] sm:max-w-[180px]">
            {selectedClient?.name || 'Select Client'}
          </span>
          <ChevronDown className="h-3.5 w-3.5 text-slate-400 shrink-0" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="w-64 p-1.5 rounded-2xl border-slate-200/80 shadow-donezo-md">
        <DropdownMenuLabel className="px-2.5 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
          <span>Active Client Workspace</span>
          <Badge variant="outline" className="text-[10px] bg-emerald-50 text-[#14532D] border-emerald-200">
            {clients.length} Clients
          </Badge>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-slate-100" />

        <div className="max-h-72 overflow-y-auto py-1 space-y-0.5">
          {clients.map((client) => {
            const isSelected = selectedClient?.id === client.id;
            return (
              <DropdownMenuItem
                key={client.id}
                onSelect={() => switchClient(client.id)}
                className={`flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-colors ${
                  isSelected ? 'bg-emerald-50 text-[#14532D]' : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className={`h-6 w-6 rounded-lg flex items-center justify-center shrink-0 ${
                      isSelected ? 'bg-[#14532D] text-white' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    <span className="text-[10px] font-bold uppercase">{client.name.slice(0, 2)}</span>
                  </div>
                  <div className="truncate">
                    <p className="truncate font-semibold">{client.name}</p>
                    {client.domain && (
                      <p className="text-[10px] text-slate-400 truncate font-normal">{client.domain}</p>
                    )}
                  </div>
                </div>

                {isSelected && <Check className="h-4 w-4 text-[#14532D] shrink-0 ml-2" />}
              </DropdownMenuItem>
            );
          })}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
