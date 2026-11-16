'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, 
  Megaphone, 
  Wallet, 
  ShieldCheck, 
  Settings, 
  PlusCircle, 
  LogOut,
  Sparkles,
  Layers,
  ArrowUpRight
} from 'lucide-react';
import { ReactNode } from 'react';
import AdManagerHeader from '@/components/AdManagerHeader';

export default function ProtectedLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const navigation = [
    { name: 'Analytics', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Campaigns', href: '/campaigns', icon: Megaphone },
    { name: 'New Campaign', href: '/campaigns/new', icon: PlusCircle, highlight: true },
    { name: 'Moderation', href: '/moderation', icon: ShieldCheck },
    { name: 'Wallet & Credits', href: '/wallet', icon: Wallet },
    { name: 'Rules & Settings', href: '/settings', icon: Settings },
  ];

  const handleLogout = () => {
    document.cookie = 'ad_manager_session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    router.push('/login');
  };

  return (
    <div className="flex h-screen bg-gray-50 text-gray-900 overflow-hidden font-sans">
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-30 lg:hidden backdrop-blur-sm"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Left Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-[#110C24] text-white flex flex-col border-r border-white/10 transition-transform duration-300 ease-in-out ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Banner */}
        <div className="p-6 border-b border-white/10">
          <Link href="/dashboard" className="block group">
            <div className="flex items-center space-x-2">
              <span className="w-8 h-8 bg-[#E1FF00] text-black font-black flex items-center justify-center text-sm shadow-[2px_2px_0px_0px_#4F23D6]">
                GG
              </span>
              <span className="text-xl font-black tracking-tight uppercase text-white">
                GoldGini <span className="text-[#E1FF00]">Ads</span>
              </span>
            </div>
            <p className="text-[10px] text-purple-300 font-bold tracking-widest uppercase mt-1">
              Sponsored Products Console
            </p>
          </Link>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-6 space-y-1.5 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href) && item.href !== '/campaigns/new');
            const isHighlight = item.highlight;

            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setIsMobileOpen(false)}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-none transition-all duration-200 uppercase tracking-wider text-xs font-bold ${
                  isActive
                    ? 'bg-[#4F23D6] text-white shadow-[3px_3px_0px_0px_#E1FF00] border-l-4 border-[#E1FF00]'
                    : isHighlight
                    ? 'bg-white/5 border border-[#E1FF00]/40 text-[#E1FF00] hover:bg-[#E1FF00] hover:text-black hover:border-black'
                    : 'text-gray-300 hover:bg-white/5 hover:text-white border-l-4 border-transparent'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <item.icon className={`w-4 h-4 ${isActive ? 'text-[#E1FF00]' : isHighlight ? 'text-[#E1FF00]' : 'text-gray-400'}`} />
                  <span>{item.name}</span>
                </div>
                {item.highlight && (
                  <span className="text-[9px] bg-[#E1FF00] text-black px-1.5 py-0.5 font-black uppercase tracking-tight">
                    Fast
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* RTB Live Indicator Card */}
        <div className="p-4 m-3 bg-white/5 border border-white/10 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase text-[#E1FF00] tracking-wider flex items-center space-x-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>RTB Auction</span>
            </span>
            <span className="text-[9px] text-gray-400 font-bold">2.4ms avg</span>
          </div>
          <p className="text-[11px] text-purple-200 leading-tight">
            Real-Time Ad Auction bidding active across search & categories.
          </p>
        </div>

        {/* Footer Logout */}
        <div className="p-4 border-t border-white/10">
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 px-3 py-2 text-gray-400 hover:text-red-400 hover:bg-white/5 transition-all uppercase tracking-wider text-xs font-bold"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <AdManagerHeader
          isMobileMenuOpen={isMobileOpen}
          onMobileMenuToggle={() => setIsMobileOpen(!isMobileOpen)}
        />

        {/* Page Body */}
        <main className="flex-1 overflow-y-auto bg-gray-50 text-gray-900">
          {children}
        </main>
      </div>
    </div>
  );
}
