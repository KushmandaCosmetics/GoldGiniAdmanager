'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Wallet, 
  Plus, 
  Bell, 
  User, 
  LogOut, 
  Menu, 
  X, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle,
  Megaphone,
  Settings
} from 'lucide-react';
import QuickTopUpModal from './QuickTopUpModal';

interface AdManagerHeaderProps {
  onMobileMenuToggle?: () => void;
  isMobileMenuOpen?: boolean;
}

export default function AdManagerHeader({ onMobileMenuToggle, isMobileMenuOpen }: AdManagerHeaderProps) {
  const router = useRouter();
  const [balance, setBalance] = useState<number | null>(null);
  const [isTopUpOpen, setIsTopUpOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  useEffect(() => {
    fetchBalance();
    const interval = setInterval(fetchBalance, 30000); // refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const fetchBalance = async () => {
    try {
      const res = await fetch('/api/wallet');
      const data = await res.json();
      if (data.success) {
        setBalance(Number(data.balance) || 0);
      }
    } catch (e) {
      // fallback
    }
  };

  const handleLogout = () => {
    document.cookie = 'ad_manager_session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    router.push('/login');
  };

  const notifications = [
    {
      id: 1,
      title: 'RTB Bidding Active',
      desc: 'Sponsored slot algorithms updated for maximum ROI.',
      time: '10m ago',
      icon: Sparkles,
      color: 'text-[#4F23D6]',
    },
    {
      id: 2,
      title: 'Campaign Approved',
      desc: 'Your Summer Glow Campaign has been approved by moderation.',
      time: '2h ago',
      icon: CheckCircle2,
      color: 'text-emerald-600',
    },
    {
      id: 3,
      title: 'Low Balance Warning',
      desc: 'Wallet balance is below ₹500. Top up to prevent campaign pausing.',
      time: '1d ago',
      icon: AlertTriangle,
      color: 'text-amber-500',
    },
  ];

  return (
    <>
      <header className="h-16 bg-white border-b border-gray-200 px-4 sm:px-8 flex items-center justify-between z-20 sticky top-0 shadow-sm">
        {/* Left: Mobile Toggle & Breadcrumb / App Title */}
        <div className="flex items-center space-x-3">
          <button
            onClick={onMobileMenuToggle}
            className="lg:hidden p-2 text-gray-700 hover:text-gray-900 border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          
          <div className="hidden sm:flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-gray-500">
            <Link href="/dashboard" className="text-gray-900 hover:text-[#4F23D6] transition-colors">
              Ad Console
            </Link>
            <span>/</span>
            <span className="text-[#4F23D6]">Seller Network</span>
          </div>
        </div>

        {/* Right: Actions, Wallet Pill, Notifications, Profile */}
        <div className="flex items-center space-x-3 sm:space-x-4">
          {/* Quick Create Campaign Button */}
          <Link
            href="/campaigns/new"
            className="hidden md:inline-flex items-center space-x-1.5 px-3 py-1.5 bg-[#4F23D6] text-white text-xs font-black uppercase tracking-wider shadow-[2px_2px_0px_0px_#E1FF00] hover:shadow-[3px_3px_0px_0px_#E1FF00] hover:-translate-y-0.5 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Ad</span>
          </Link>

          {/* Wallet Balance Pill */}
          <div className="flex items-center bg-gray-50 border-2 border-gray-900 p-1 pl-3 shadow-[2px_2px_0px_0px_#110C24]">
            <div className="flex items-center space-x-2 mr-2">
              <Wallet className="w-4 h-4 text-[#4F23D6]" />
              <div className="flex flex-col">
                <span className="text-[9px] uppercase font-bold text-gray-400 leading-none">Balance</span>
                <span className="text-sm font-black text-gray-900 leading-tight">
                  ₹{balance !== null ? balance.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '...'}
                </span>
              </div>
            </div>
            <button
              onClick={() => setIsTopUpOpen(true)}
              className="bg-[#E1FF00] hover:bg-[#d0ed00] text-black px-2.5 py-1 text-xs font-black uppercase tracking-wider flex items-center space-x-1 border border-black transition-colors"
              title="Add Credits"
            >
              <Plus className="w-3 h-3" />
              <span>Top-Up</span>
            </button>
          </div>

          {/* Notifications Bell */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 text-gray-700 hover:text-gray-900 border border-gray-200 hover:bg-gray-50 transition-colors relative"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-[#4F23D6] rounded-full animate-pulse" />
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white border-2 border-gray-900 shadow-[6px_6px_0px_0px_#110C24] p-4 z-50 animate-in fade-in">
                <div className="flex items-center justify-between pb-3 border-b border-gray-200">
                  <h4 className="text-xs font-black uppercase tracking-wider text-gray-900">Ad Updates & Alerts</h4>
                  <span className="text-[10px] font-bold text-purple-600 cursor-pointer hover:underline">Mark read</span>
                </div>
                <div className="divide-y divide-gray-100 max-h-72 overflow-y-auto">
                  {notifications.map((n) => (
                    <div key={n.id} className="py-3 flex space-x-3 hover:bg-gray-50 transition-colors cursor-pointer">
                      <n.icon className={`w-4 h-4 mt-0.5 shrink-0 ${n.color}`} />
                      <div className="space-y-0.5">
                        <p className="text-xs font-bold text-gray-900">{n.title}</p>
                        <p className="text-[11px] text-gray-500 line-clamp-2">{n.desc}</p>
                        <span className="text-[9px] text-gray-400 font-medium">{n.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <Link
                  href="/moderation"
                  onClick={() => setShowNotifications(false)}
                  className="block text-center pt-2 mt-2 border-t border-gray-200 text-xs font-bold text-[#4F23D6] hover:underline uppercase tracking-wide"
                >
                  View Moderation Status →
                </Link>
              </div>
            )}
          </div>

          {/* User Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center space-x-2 p-1.5 border border-gray-200 hover:border-gray-900 transition-colors"
            >
              <div className="w-7 h-7 bg-[#4F23D6] text-white flex items-center justify-center font-black text-xs">
                GG
              </div>
              <span className="text-xs font-black text-gray-900 uppercase hidden md:inline">Seller Portal</span>
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white border-2 border-gray-900 shadow-[4px_4px_0px_0px_#110C24] p-2 z-50">
                <div className="px-3 py-2 border-b border-gray-100">
                  <p className="text-xs font-bold text-gray-900">Verified Advertiser</p>
                  <p className="text-[10px] text-gray-500 font-medium">GoldGini Merchant</p>
                </div>
                <div className="py-1">
                  <Link
                    href="/wallet"
                    onClick={() => setShowUserMenu(false)}
                    className="flex items-center space-x-2 px-3 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50 uppercase tracking-wide"
                  >
                    <Wallet className="w-4 h-4 text-gray-500" />
                    <span>Billing & Wallet</span>
                  </Link>
                  <Link
                    href="/settings"
                    onClick={() => setShowUserMenu(false)}
                    className="flex items-center space-x-2 px-3 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50 uppercase tracking-wide"
                  >
                    <Settings className="w-4 h-4 text-gray-500" />
                    <span>Ad Policies</span>
                  </Link>
                </div>
                <div className="pt-1 border-t border-gray-100">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center space-x-2 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 uppercase tracking-wide text-left"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Log Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Reusable Quick Top Up Modal */}
      <QuickTopUpModal
        isOpen={isTopUpOpen}
        onClose={() => setIsTopUpOpen(false)}
        onSuccess={fetchBalance}
      />
    </>
  );
}
