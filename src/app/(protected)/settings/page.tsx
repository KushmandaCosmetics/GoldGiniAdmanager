'use client';

import { useState } from 'react';
import { 
  Settings, 
  ShieldCheck, 
  Bell, 
  Sliders, 
  HelpCircle, 
  Check, 
  DollarSign, 
  FileText,
  Mail,
  Zap
} from 'lucide-react';

export default function SettingsPage() {
  const [saved, setSaved] = useState(false);
  const [biddingStrategy, setBiddingStrategy] = useState('FIXED');
  const [defaultMaxCpc, setDefaultMaxCpc] = useState('5.00');
  const [lowBalanceAlert, setLowBalanceAlert] = useState('500');
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [smsAlerts, setSmsAlerts] = useState(true);
  const [autoPauseBudget, setAutoPauseBudget] = useState(true);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="p-6 sm:p-8 max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-[#4F23D6] mb-1">
          <Settings className="w-4 h-4" />
          <span>Console Configuration</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-gray-900">
          Ad Rules & <span className="text-[#4F23D6]">Settings</span>
        </h1>
        <p className="text-gray-500 text-sm mt-1 font-medium">
          Manage your default bidding automation, budget safety alerts, and account preferences.
        </p>
      </div>

      {saved && (
        <div className="p-4 bg-emerald-50 border-2 border-emerald-500 text-emerald-800 text-xs font-black uppercase tracking-wide flex items-center space-x-2 shadow-[2px_2px_0px_0px_#10b981] animate-in fade-in">
          <Check className="w-4 h-4" />
          <span>Settings saved successfully!</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Account Info Card */}
        <div className="bg-white border-2 border-gray-900 p-6 shadow-[4px_4px_0px_0px_#110C24] space-y-4">
          <div className="flex items-center space-x-2 pb-3 border-b border-gray-200">
            <ShieldCheck className="w-5 h-5 text-[#4F23D6]" />
            <h3 className="text-base font-black uppercase tracking-wider text-gray-900">
              Advertiser Account Profile
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <span className="text-gray-500 font-bold block mb-1">Account Type</span>
              <span className="font-black text-gray-900 bg-purple-50 px-2 py-1 inline-block border border-purple-200 text-[#4F23D6]">
                Verified GoldGini Seller
              </span>
            </div>
            <div>
              <span className="text-gray-500 font-bold block mb-1">Billing Currency</span>
              <span className="font-black text-gray-900">INR (₹) - India</span>
            </div>
            <div>
              <span className="text-gray-500 font-bold block mb-1">Auction Protocol</span>
              <span className="font-black text-gray-900 flex items-center space-x-1">
                <Zap className="w-3.5 h-3.5 text-emerald-600" />
                <span>Second-Price RTB Auction</span>
              </span>
            </div>
          </div>
        </div>

        {/* Bidding Automation */}
        <div className="bg-white border-2 border-gray-900 p-6 shadow-[4px_4px_0px_0px_#110C24] space-y-4">
          <div className="flex items-center space-x-2 pb-3 border-b border-gray-200">
            <Sliders className="w-5 h-5 text-[#4F23D6]" />
            <h3 className="text-base font-black uppercase tracking-wider text-gray-900">
              Default Bidding Strategy & Thresholds
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                Default Bidding Engine
              </label>
              <select
                value={biddingStrategy}
                onChange={(e) => setBiddingStrategy(e.target.value)}
                className="w-full p-3 border-2 border-gray-900 bg-white text-xs font-bold text-gray-900 focus:outline-none focus:border-[#4F23D6]"
              >
                <option value="FIXED">Fixed Bids (Strict manual control)</option>
                <option value="DYNAMIC_DOWN_ONLY">Dynamic Bids - Down Only (Conservative)</option>
                <option value="DYNAMIC_UP_DOWN">Dynamic Bids - Up & Down (Aggressive)</option>
              </select>
              <p className="text-[11px] text-gray-500 mt-1">
                Dynamic bidding automatically adjusts bids in real-time based on purchase probability.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                Default Max CPC Bid Cap (₹)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold">₹</span>
                <input
                  type="number"
                  step="0.50"
                  value={defaultMaxCpc}
                  onChange={(e) => setDefaultMaxCpc(e.target.value)}
                  className="w-full pl-8 pr-3 py-2.5 border-2 border-gray-900 text-xs font-black text-gray-900 focus:outline-none focus:border-[#4F23D6]"
                />
              </div>
              <p className="text-[11px] text-gray-500 mt-1">
                New keywords default to this bid limit unless overridden.
              </p>
            </div>
          </div>
        </div>

        {/* Budget & Safety Notifications */}
        <div className="bg-white border-2 border-gray-900 p-6 shadow-[4px_4px_0px_0px_#110C24] space-y-4">
          <div className="flex items-center space-x-2 pb-3 border-b border-gray-200">
            <Bell className="w-5 h-5 text-[#4F23D6]" />
            <h3 className="text-base font-black uppercase tracking-wider text-gray-900">
              Safety Caps & Notifications
            </h3>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200">
              <div>
                <p className="text-xs font-bold text-gray-900">Low Balance Alert Threshold</p>
                <p className="text-[11px] text-gray-500">Alert me when wallet falls below this balance</p>
              </div>
              <div className="relative w-32">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-xs">₹</span>
                <input
                  type="number"
                  value={lowBalanceAlert}
                  onChange={(e) => setLowBalanceAlert(e.target.value)}
                  className="w-full pl-7 pr-2 py-1.5 border border-gray-400 text-xs font-bold text-gray-900"
                />
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200">
              <div>
                <p className="text-xs font-bold text-gray-900">Automatic Budget Safety Pause</p>
                <p className="text-[11px] text-gray-500">Automatically pause campaigns when daily limit is exhausted</p>
              </div>
              <input
                type="checkbox"
                checked={autoPauseBudget}
                onChange={(e) => setAutoPauseBudget(e.target.checked)}
                className="w-4 h-4 accent-[#4F23D6]"
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200">
              <div>
                <p className="text-xs font-bold text-gray-900">Email Notifications</p>
                <p className="text-[11px] text-gray-500">Receive performance summaries & moderation verdicts</p>
              </div>
              <input
                type="checkbox"
                checked={emailAlerts}
                onChange={(e) => setEmailAlerts(e.target.checked)}
                className="w-4 h-4 accent-[#4F23D6]"
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="px-8 py-3 bg-[#4F23D6] hover:bg-[#3915a8] text-white font-black uppercase text-xs tracking-wider shadow-[4px_4px_0px_0px_#E1FF00] hover:shadow-[6px_6px_0px_0px_#E1FF00] hover:-translate-y-0.5 active:translate-y-0 transition-all"
          >
            Save Account Preferences
          </button>
        </div>
      </form>
    </div>
  );
}
