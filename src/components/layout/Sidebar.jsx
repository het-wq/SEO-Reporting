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
  Settings,
  ChevronsLeft,
  ChevronsRight,
  Download,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export const NAV_ITEMS = [
  { key: 'overview', label: 'Overview', icon: LayoutDashboard, section: 'menu' },
  { key: 'traffic', label: 'Website Traffic', icon: Globe, section: 'menu' },
  { key: 'search-console', label: 'Search Console', icon: Search, section: 'menu' },
  { key: 'device-insights', label: 'Device Insights', icon: Smartphone, section: 'menu' },
  { key: 'brand-queries', label: 'Brand vs Non-Brand', icon: Tag, section: 'menu' },
  { key: 'keywords', label: 'Keyword Rankings', icon: KeyRound, section: 'menu' },
  { key: 'local-seo', label: 'Local SEO', icon: MapPin, section: 'menu' },
  { key: 'seo-activities', label: 'SEO Activities', icon: ListChecks, section: 'menu' },
  { key: 'settings', label: 'Settings', icon: Settings, section: 'general' },
];

function NavList({ activePage, onNavigate, collapsed }) {
  const menuItems = NAV_ITEMS.filter((item) => item.section === 'menu');
  const generalItems = NAV_ITEMS.filter((item) => item.section === 'general');

  const renderItem = ({ key, label, icon: Icon }) => {
    const active = activePage === key;
    return (
      <button
        key={key}
        data-page={key}
        type="button"
        onClick={() => onNavigate(key)}
        title={collapsed ? label : undefined}
        className={cn(
          'group relative flex w-full items-center gap-3 rounded-full px-3 py-2 text-[13px] font-medium transition-all cursor-pointer',
          active
            ? 'bg-[#E3F4EA]/70 text-[#111827] font-semibold'
            : 'text-[#6B7280] hover:bg-[#F3F4F1]/70 hover:text-[#111827]',
          collapsed && 'justify-center px-0'
        )}
      >
        {active && (
          <span className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-full bg-[#14532D]" />
        )}
        <Icon
          className={cn(
            'h-4 w-4 shrink-0 transition-colors',
            active ? 'text-[#14532D]' : 'text-[#9CA3AF] group-hover:text-[#111827]'
          )}
        />
        {!collapsed && <span className="truncate">{label}</span>}
      </button>
    );
  };

  return (
    <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
      <div>
        {!collapsed && (
          <p className="px-3 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF]">
            Menu
          </p>
        )}
        <div className="space-y-0.5">{menuItems.map(renderItem)}</div>
      </div>

      <div>
        {!collapsed && (
          <p className="px-3 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF]">
            General
          </p>
        )}
        <div className="space-y-0.5">{generalItems.map(renderItem)}</div>
      </div>
    </nav>
  );
}

export default function Sidebar({
  activePage,
  onNavigate,
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onCloseMobile,
}) {
  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={cn(
          'hidden md:flex flex-col border-r border-[#EEF0EC] bg-white h-screen sticky top-0 shrink-0 transition-all select-none',
          collapsed ? 'w-18' : 'w-64'
        )}
      >
        {/* Brand Header */}
        <div
          className={cn(
            'flex items-center gap-3 px-5 py-5 border-b border-[#F3F4F1]',
            collapsed && 'justify-center px-2'
          )}
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0E3B27] to-[#14532D] text-white font-bold text-sm shadow-donezo">
            BD
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="text-sm font-bold text-[#111827] tracking-tight truncate">
                Boulder Decision
              </p>
              <p className="text-[11px] text-[#6B7280] truncate font-medium">
                SEO Reporting
              </p>
            </div>
          )}
        </div>

        {/* Navigation list */}
        <NavList activePage={activePage} onNavigate={onNavigate} collapsed={collapsed} />

        {/* Bottom Promo Card (Export action) */}
        {!collapsed && (
          <div className="mx-3 mb-2 p-3.5 rounded-[20px] bg-gradient-to-br from-[#0E3B27] via-[#14532D] to-[#1B6B45] text-white shadow-donezo-md relative overflow-hidden">
            <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-[#2E9B62]/20 blur-xl pointer-events-none" />
            <div className="flex items-center gap-2 mb-1">
              <div className="h-6 w-6 rounded-lg bg-white/20 flex items-center justify-center text-white">
                <Download className="h-3.5 w-3.5" />
              </div>
              <p className="text-xs font-bold tracking-tight">Export Report</p>
            </div>
            <p className="text-[11px] text-white/80 leading-snug mb-2.5">
              Download executive PDF snapshot.
            </p>
            <button
              type="button"
              onClick={() => window.print()}
              className="w-full py-1.5 px-3 rounded-full bg-white text-[#14532D] hover:bg-slate-50 font-bold text-[11px] transition-colors cursor-pointer shadow-xs text-center"
            >
              Print / Save PDF
            </button>
          </div>
        )}

        {/* Collapse toggle */}
        <div className="border-t border-[#F3F4F1] p-2.5">
          <button
            type="button"
            onClick={onToggleCollapse}
            className="flex w-full items-center justify-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium text-[#6B7280] hover:bg-[#F3F4F1] hover:text-[#111827] transition-colors cursor-pointer"
          >
            {collapsed ? (
              <ChevronsRight className="h-4 w-4" />
            ) : (
              <>
                <ChevronsLeft className="h-4 w-4" />
                <span>Collapse</span>
              </>
            )}
          </button>
        </div>
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50">
          <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs" onClick={onCloseMobile} />
          <aside className="fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-white shadow-2xl rounded-r-[28px] overflow-hidden">
            <div className="flex items-center justify-between gap-2.5 px-5 py-5 border-b border-[#F3F4F1]">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0E3B27] to-[#14532D] text-white font-bold text-sm shadow-donezo">
                  BD
                </div>
                <div>
                  <p className="text-sm font-bold text-[#111827] tracking-tight">
                    Boulder Decision
                  </p>
                  <p className="text-[11px] text-[#6B7280] font-medium">
                    SEO Reporting
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onCloseMobile}
                className="p-1.5 rounded-full text-[#6B7280] hover:bg-[#F3F4F1] hover:text-[#111827] cursor-pointer"
              >
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
