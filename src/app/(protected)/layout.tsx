'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Megaphone, Wallet, LogOut } from 'lucide-react';
import { ReactNode } from 'react';

export default function ProtectedLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Campaigns', href: '/campaigns', icon: Megaphone },
    { name: 'Wallet', href: '/wallet', icon: Wallet },
  ];

  const handleLogout = () => {
    // In a real app, clear cookie via API
    document.cookie = 'ad_manager_session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    router.push('/login');
  };

  return (
    <div className="flex h-screen bg-gray-50 text-gray-900 overflow-hidden">
      {/* Left Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col shadow-sm z-10">
        <div className="p-6">
          <h1 className="text-2xl font-black tracking-tighter text-gray-900 uppercase">
            GoldGini <br />
            <span className="text-[#4F23D6]">Ad Manager</span>
          </h1>
        </div>
        
        <nav className="flex-1 px-4 space-y-2 mt-4">
          {navigation.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center space-x-3 px-4 py-3 rounded-none border-l-4 transition-all duration-200 uppercase tracking-wide font-bold ${
                  isActive
                    ? 'bg-purple-50 border-[#4F23D6] text-[#4F23D6]'
                    : 'border-transparent text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <item.icon className={`w-5 h-5 ${isActive ? 'text-[#4F23D6]' : 'text-gray-400'}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-none text-gray-500 hover:text-red-600 hover:bg-red-50 transition-all uppercase tracking-wide font-bold"
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto bg-gray-50 text-gray-900">
        {children}
      </main>
    </div>
  );
}
