'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LogOut, LucideIcon } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';

export interface DashboardTabItem {
  id: string;
  label: string;
  icon: LucideIcon;
  badge?: number;
}

interface DashboardShellProps {
  title: string;
  subtitle: string;
  tabs: DashboardTabItem[];
  activeTab: string;
  onTabChange: (id: string) => void;
  children: React.ReactNode;
}

export function DashboardShell({
  title,
  subtitle,
  tabs,
  activeTab,
  onTabChange,
  children,
}: DashboardShellProps) {
  const router = useRouter();
  const { user, logout } = useAuth();

  const handleSignOut = async () => {
    await logout();
    router.push('/');
    router.refresh();
  };

  return (
    <div className="bg-[#F8FAFC] min-h-[85vh]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Sidebar Navigation (240px–260px equivalent on 12-col grid) */}
          <aside className="lg:col-span-3 bg-white border border-slate-200 rounded-xl p-4 space-y-5">
            <div className="pb-4 border-b border-slate-100">
              <p className="text-xs font-medium text-[#0F766E]">
                {user?.role === 'provider'
                  ? 'Provider Studio'
                  : user?.role === 'admin'
                    ? 'Platform Administration'
                    : 'Client Workspace'}
              </p>
              <p className="text-base font-bold text-[#0F172A] mt-0.5 truncate">
                {user?.fullName || 'SkillNest Member'}
              </p>
              <p className="text-xs text-slate-500 truncate">{user?.email}</p>
            </div>

            <nav className="space-y-1" aria-label="Dashboard sections">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => onTabChange(tab.id)}
                    className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      active
                        ? 'bg-[#0F766E] text-white'
                        : 'text-slate-700 hover:bg-[#F1F5F9]'
                    }`}
                  >
                    <span className="flex items-center gap-2.5 truncate">
                      <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
                      <span className="truncate">{tab.label}</span>
                    </span>
                    {typeof tab.badge === 'number' && tab.badge > 0 && (
                      <span
                        className={`text-xs tabular-nums font-semibold ${
                          active ? 'text-teal-100' : 'text-slate-500'
                        }`}
                      >
                        {tab.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>

            <div className="pt-4 border-t border-slate-100 space-y-2">
              <Link
                href="/browse"
                className="block w-full px-3 py-2 text-xs font-medium text-slate-600 hover:text-[#0F172A] hover:bg-slate-50 rounded-lg"
              >
                Browse Public Directory →
              </Link>
              <button
                type="button"
                onClick={handleSignOut}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
                Sign Out
              </button>
            </div>
          </aside>

          {/* Main Workspace Viewport */}
          <div className="lg:col-span-9 space-y-6">
            <div className="bg-white border border-slate-200 rounded-xl p-6">
              <p className="text-xs text-slate-500 mb-1">
                Dashboard / {title}
              </p>
              <h1 className="text-2xl font-bold tracking-tight text-[#0F172A]">
                {title}
              </h1>
              <p className="text-sm text-slate-600 mt-1">{subtitle}</p>
            </div>

            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
