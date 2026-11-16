'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ShieldCheck, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  XCircle, 
  ExternalLink, 
  HelpCircle,
  FileText,
  ArrowRight,
  RefreshCw,
  Search
} from 'lucide-react';

export default function ModerationPage() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/campaigns');
      const data = await res.json();
      if (data.success && data.campaigns) {
        setCampaigns(data.campaigns);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Mock moderation status calculation if column is not explicitly set
  const getModerationStatus = (c: any) => {
    if (c.moderation_status) return c.moderation_status;
    if (c.status === 'REJECTED') return 'REJECTED';
    if (c.status === 'ACTIVE' || c.status === 'PAUSED') return 'APPROVED';
    return 'PENDING';
  };

  const filtered = campaigns.filter((c) => {
    const status = getModerationStatus(c);
    const matchesTab = activeTab === 'ALL' || status === activeTab;
    const matchesSearch = c.name?.toLowerCase().includes(search.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const counts = {
    ALL: campaigns.length,
    PENDING: campaigns.filter((c) => getModerationStatus(c) === 'PENDING').length,
    APPROVED: campaigns.filter((c) => getModerationStatus(c) === 'APPROVED').length,
    REJECTED: campaigns.filter((c) => getModerationStatus(c) === 'REJECTED').length,
  };

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-[#4F23D6] mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>Ad Quality & Safety</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-gray-900">
            Campaign <span className="text-[#4F23D6]">Moderation</span>
          </h1>
          <p className="text-gray-500 text-sm mt-1 font-medium">
            Track approval status, policy compliance, and review feedback for your ads.
          </p>
        </div>

        <button
          onClick={fetchCampaigns}
          className="px-4 py-2 bg-white border-2 border-gray-900 text-gray-900 font-bold uppercase text-xs tracking-wider flex items-center space-x-2 hover:bg-gray-100 transition-colors shadow-[2px_2px_0px_0px_#110C24]"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Status</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white border-2 border-gray-900 p-5 shadow-[4px_4px_0px_0px_#10b981]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-gray-500">Approved & Live</span>
            <CheckCircle2 className="w-6 h-6 text-emerald-600" />
          </div>
          <p className="text-3xl font-black text-gray-900 mt-2">{counts.APPROVED}</p>
          <p className="text-[11px] text-gray-500 mt-1">Eligible to participate in live RTB auctions</p>
        </div>

        <div className="bg-white border-2 border-gray-900 p-5 shadow-[4px_4px_0px_0px_#f59e0b]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-gray-500">Pending Review</span>
            <Clock className="w-6 h-6 text-amber-500" />
          </div>
          <p className="text-3xl font-black text-gray-900 mt-2">{counts.PENDING}</p>
          <p className="text-[11px] text-gray-500 mt-1">Average review time is under 2 business hours</p>
        </div>

        <div className="bg-white border-2 border-gray-900 p-5 shadow-[4px_4px_0px_0px_#ef4444]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-gray-500">Needs Action</span>
            <AlertCircle className="w-6 h-6 text-red-500" />
          </div>
          <p className="text-3xl font-black text-gray-900 mt-2">{counts.REJECTED}</p>
          <p className="text-[11px] text-gray-500 mt-1">Revise headline or image to resubmit</p>
        </div>
      </div>

      {/* Policy Guidelines Accordion Strip */}
      <div className="bg-[#110C24] text-white p-6 border-2 border-gray-900 shadow-[6px_6px_0px_0px_#E1FF00]">
        <div className="flex items-center space-x-2 text-[#E1FF00] font-black text-sm uppercase tracking-wider mb-2">
          <FileText className="w-4 h-4" />
          <span>GoldGini Quick Advertising Guidelines</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-purple-200 mt-3 pt-3 border-t border-white/10">
          <div>
            <span className="font-bold text-white block mb-0.5">1. Image Quality</span>
            High-resolution product images on clean, non-distracting backgrounds. No watermarks or excessive text overlays.
          </div>
          <div>
            <span className="font-bold text-white block mb-0.5">2. Honest Claims</span>
            Avoid misleading claims (e.g. &ldquo;100% cure&rdquo;, &ldquo;instant wealth&rdquo;). Prices must match product landing page.
          </div>
          <div>
            <span className="font-bold text-white block mb-0.5">3. Keyword Relevance</span>
            Bidded keywords must be directly related to the advertised catalog product or category.
          </div>
        </div>
      </div>

      {/* Main Campaign List with Filtering */}
      <div className="bg-white border-2 border-gray-900 shadow-[4px_4px_0px_0px_#110C24]">
        {/* Filter bar */}
        <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-3">
          <div className="flex space-x-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
            {(['ALL', 'APPROVED', 'PENDING', 'REJECTED'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 text-xs font-black uppercase tracking-wider border-2 transition-all ${
                  activeTab === tab
                    ? 'border-gray-900 bg-[#4F23D6] text-white shadow-[2px_2px_0px_0px_#E1FF00]'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                {tab === 'ALL' ? 'All Ads' : tab} ({counts[tab]})
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search ad campaign..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 border border-gray-300 text-xs font-bold text-gray-900 focus:outline-none focus:border-[#4F23D6]"
            />
          </div>
        </div>

        {/* Table / List */}
        {loading ? (
          <div className="p-12 text-center text-sm font-bold text-[#4F23D6]">Loading moderation statuses...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <p className="text-gray-400 font-bold text-sm">No campaigns found in this view.</p>
            <Link
              href="/campaigns/new"
              className="inline-block mt-2 text-xs font-black uppercase text-[#4F23D6] underline"
            >
              + Create a new campaign
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filtered.map((camp) => {
              const status = getModerationStatus(camp);
              return (
                <div key={camp.id} className="p-4 sm:p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:bg-gray-50 transition-colors">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-black text-sm text-gray-900">{camp.name}</span>
                      <span className="text-[10px] bg-gray-100 px-2 py-0.5 font-bold uppercase text-gray-600 border border-gray-200">
                        {camp.objective || 'SPONSORED_PRODUCTS'}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500 font-medium">
                      <span>Daily Budget: ₹{Number(camp.daily_budget || 0).toFixed(2)}</span>
                      <span>•</span>
                      <span>Target: {camp.productId ? `Product ID #${camp.productId}` : 'Catalog'}</span>
                      <span>•</span>
                      <span>Created: {new Date(camp.created_at || Date.now()).toLocaleDateString()}</span>
                    </div>

                    {status === 'REJECTED' && (
                      <div className="mt-2 p-2 bg-red-50 border-l-4 border-red-500 text-red-700 text-xs">
                        <strong>Reason for Rejection:</strong> {camp.moderation_reason || 'Product creative headline does not match catalog details. Please edit and resubmit.'}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center space-x-4 self-end md:self-center shrink-0">
                    {/* Status Badge */}
                    {status === 'APPROVED' && (
                      <span className="inline-flex items-center space-x-1.5 px-3 py-1 bg-emerald-50 border border-emerald-500 text-emerald-700 text-xs font-black uppercase">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Approved</span>
                      </span>
                    )}
                    {status === 'PENDING' && (
                      <span className="inline-flex items-center space-x-1.5 px-3 py-1 bg-amber-50 border border-amber-500 text-amber-700 text-xs font-black uppercase">
                        <Clock className="w-3.5 h-3.5" />
                        <span>In Review</span>
                      </span>
                    )}
                    {status === 'REJECTED' && (
                      <span className="inline-flex items-center space-x-1.5 px-3 py-1 bg-red-50 border border-red-500 text-red-700 text-xs font-black uppercase">
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Rejected</span>
                      </span>
                    )}

                    <Link
                      href={`/campaigns/${camp.id}`}
                      className="px-3 py-1.5 bg-gray-900 hover:bg-[#4F23D6] text-white text-xs font-black uppercase tracking-wider transition-colors flex items-center space-x-1"
                    >
                      <span>Manage</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
