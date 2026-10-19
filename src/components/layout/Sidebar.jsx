import React from 'react';
import {
  LayoutDashboard,
  Globe,
  Search,
  Smartphone,
  Tag,
  KeyRound,
  MapPin,
  ListChecks,
  Wrench,
  Link2,
  Sparkles,
  FileText,
  Settings,
  ChevronsLeft,
  ChevronsRight,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export const NAV_ITEMS = [
  { key: 'overview', label: 'Overview', icon: LayoutDashboard },
  { key: 'traffic', label: 'Website Traffic', icon: Globe },
  { key: 'search-console', label: 'Search Console', icon: Search },
  { key: 'device-insights', label: 'Device Insights', icon: Smartphone },
  { key: 'brand-queries', label: 'Brand vs Non-Brand', icon: Tag },
  { key: 'keywords', label: 'Keyword Rankings', icon: KeyRound },
  { key: 'local-seo', label: 'Local SEO', icon: MapPin },
  { key: 'seo-activities', label: 'SEO Activities', icon: ListChecks },
  { key: 'technical-seo', label: 'Technical SEO', icon: Wrench },
  { key: 'backlinks', label: 'Backlinks', icon: Link2 },
  { key: 'ai-citations', label: 'AI Citations', icon: Sparkles },
  { key: 'pdf-reports', label: 'PDF Reports', icon: FileText },
  { key: 'settings', label: 'Settings', icon: Settings },
];

function NavList({ activePage, onNavigate, collapsed }) {
  return (
    <nav className="flex-1 overflow-y-auto px-2.5 py-3 space-y-0.5">
      {NAV_ITEMS.map(({ key, label, icon: Icon }) => {
        const active = activePage === key;
        return (
          <button
            key={key}
            data-page={key}
            type="button"
            onClick={() => onNavigate(key)}
            title={collapsed ? label : undefined}
            className={cn(
              'flex w-full items-center gap-3 rounded-md px-2.5 py-2 text-sm font-medium transition-colors cursor-pointer',
              active
                ? 'bg-blue-50 text-blue-700'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
              collapsed && 'justify-center px-0'
            )}
          >
            <Icon className={cn('h-4 w-4 shrink-0', active ? 'text-blue-600' : 'text-slate-400')} />
            {!collapsed && <span className="truncate">{label}</span>}
          </button>
        );
      })}
    </nav>
  );
}

export default function Sidebar({ activePage, onNavigate, collapsed, onToggleCollapse, mobileOpen, onCloseMobile }) {
  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={cn(
          'hidden md:flex flex-col border-r border-slate-200/80 bg-white h-screen sticky top-0 shrink-0 transition-all',
          collapsed ? 'w-16' : 'w-64'
        )}
      >
        <div className={cn('flex items-center gap-2.5 px-4 py-4 border-b border-slate-100', collapsed && 'justify-center px-2')}>
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-white font-bold text-xs">
            ACA
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="text-sm font-bold text-slate-900 truncate">Appliance Care</p>
              <p className="text-[11px] text-slate-500 truncate">SEO Reporting Dashboard</p>
            </div>
          )}
        </div>

        <NavList activePage={activePage} onNavigate={onNavigate} collapsed={collapsed} />

        <div className="border-t border-slate-100 p-2.5">
          <button
            type="button"
            onClick={onToggleCollapse}
            className="flex w-full items-center justify-center gap-2 rounded-md px-2.5 py-2 text-xs font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-900 cursor-pointer"
          >
            {collapsed ? <ChevronsRight className="h-4 w-4" /> : <><ChevronsLeft className="h-4 w-4" /> Collapse</>}
          </button>
        </div>
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50">
          <div className="fixed inset-0 bg-slate-950/40" onClick={onCloseMobile} />
          <aside className="fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-white shadow-xl">
            <div className="flex items-center justify-between gap-2.5 px-4 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-white font-bold text-xs">
                  ACA
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">Appliance Care</p>
                  <p className="text-[11px] text-slate-500">SEO Reporting Dashboard</p>
                </div>
              </div>
              <button type="button" onClick={onCloseMobile} className="p-1 text-slate-500 hover:text-slate-900 cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>
            <NavList
              activePage={activePage}
              onNavigate={(key) => {
                onNavigate(key);
                onCloseMobile();
              }}
              collapsed={false}
            />
          </aside>
        </div>
      )}
    </>
  );
}
