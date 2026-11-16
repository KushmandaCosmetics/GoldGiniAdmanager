'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Search, 
  Filter, 
  Plus, 
  Megaphone, 
  Trash2, 
  Eye, 
  MousePointerClick, 
  Play, 
  Pause, 
  ArrowUpRight,
  Sparkles,
  TrendingUp,
  Tag,
  Clock,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export default function CampaignsList() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState<'newest' | 'spend' | 'clicks'>('newest');

  useEffect(() => {
    fetchCampaigns();
  }, []);

  async function fetchCampaigns() {
    setLoading(true);
    try {
      const res = await fetch('/api/campaigns');
      const data = await res.json();
      if (data.success && data.campaigns) {
        setCampaigns(data.campaigns);
      }
    } catch (error) {
      console.error("Failed to load campaigns", error);
    } finally {
      setLoading(false);
    }
  }

  const toggleCampaignStatus = async (id: number, currentStatus: string) => {
    const newStatus = currentStatus === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
    try {
      const res = await fetch(`/api/campaigns/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setCampaigns(campaigns.map(c => c.id === id ? { ...c, status: newStatus } : c));
      } else {
        alert(data.error || 'Failed to update campaign status');
      }
    } catch (e) {
      alert('Network error while updating status');
    }
  };

  const handleDelete = async (campaignId: number, campaignName: string) => {
    if (!confirm(`Are you sure you want to permanently delete "${campaignName}"?`)) return;
    
    try {
      const res = await fetch(`/api/campaigns/${campaignId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setCampaigns(campaigns.filter(c => c.id !== campaignId));
      } else {
        alert(data.error || 'Failed to delete campaign');
      }
    } catch (err) {
      alert('Failed to delete campaign');
    }
  };

  const filteredCampaigns = campaigns
    .filter(camp => {
      const matchesSearch = camp.name?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'ALL' || camp.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      if (sortBy === 'spend') return Number(b.total_spend || 0) - Number(a.total_spend || 0);
      if (sortBy === 'clicks') return Number(b.total_clicks || 0) - Number(a.total_clicks || 0);
      return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
    });

  const statusCounts = {
    ALL: campaigns.length,
    ACTIVE: campaigns.filter(c => c.status === 'ACTIVE').length,
    PAUSED: campaigns.filter(c => c.status === 'PAUSED').length,
    BUDGET_EXHAUSTED: campaigns.filter(c => c.status === 'BUDGET_EXHAUSTED').length,
  };

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-[#4F23D6] mb-1">
            <Megaphone className="w-4 h-4" />
            <span>Ad Portfolio Management</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-gray-900">
            Your <span className="text-[#4F23D6]">Ad Campaigns</span>
          </h1>
          <p className="text-gray-500 text-sm mt-1 font-medium">
            Monitor real-time auctions, click-through rates, and adjust keyword bids.
          </p>
        </div>

        <Link 
          href="/campaigns/new" 
          className="bg-[#4F23D6] hover:bg-[#3815a8] text-white px-6 py-3 font-black text-xs uppercase tracking-wider flex items-center space-x-2 shadow-[4px_4px_0px_0px_#E1FF00] hover:shadow-[6px_6px_0px_0px_#E1FF00] hover:-translate-y-0.5 active:translate-y-0 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Campaign</span>
        </Link>
      </div>

      {/* Filter and Controls Strip */}
      <div className="bg-white border-2 border-gray-900 p-4 shadow-[4px_4px_0px_0px_#110C24] space-y-4">
        {/* Status Tabs */}
        <div className="flex flex-wrap items-center gap-2 border-b border-gray-100 pb-3">
          {[
            { id: 'ALL', label: 'All Campaigns', count: statusCounts.ALL },
            { id: 'ACTIVE', label: 'Active', count: statusCounts.ACTIVE },
            { id: 'PAUSED', label: 'Paused', count: statusCounts.PAUSED },
            { id: 'BUDGET_EXHAUSTED', label: 'Out of Budget', count: statusCounts.BUDGET_EXHAUSTED },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 text-xs font-black uppercase tracking-wider border-2 transition-all ${
                statusFilter === tab.id
                  ? 'border-gray-900 bg-[#4F23D6] text-white shadow-[2px_2px_0px_0px_#E1FF00]'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>

        {/* Search & Sort Controls */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input 
              type="text" 
              placeholder="Search campaigns by name..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border-2 border-gray-900 text-xs font-bold text-gray-900 focus:outline-none focus:border-[#4F23D6]"
            />
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
            <span className="text-xs font-bold uppercase text-gray-500">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="border-2 border-gray-900 px-3 py-1.5 text-xs font-bold text-gray-900 bg-white"
            >
              <option value="newest">Recently Created</option>
              <option value="spend">Highest Spend</option>
              <option value="clicks">Highest Clicks</option>
            </select>
          </div>
        </div>
      </div>

      {/* Campaigns Table / Cards */}
      <div className="bg-white border-2 border-gray-900 shadow-[6px_6px_0px_0px_#110C24] overflow-hidden">
        {loading ? (
          <div className="p-16 text-center text-sm font-bold text-[#4F23D6] animate-pulse">
            Loading your campaigns...
          </div>
        ) : filteredCampaigns.length === 0 ? (
          <div className="p-16 text-center space-y-4">
            <div className="w-16 h-16 bg-purple-50 text-[#4F23D6] flex items-center justify-center mx-auto border-2 border-[#4F23D6]">
              <Megaphone className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-base font-black uppercase text-gray-900">No campaigns found</h3>
              <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto font-medium">
                {searchQuery || statusFilter !== 'ALL'
                  ? 'Try adjusting your search query or status filter.'
                  : 'Start driving high-intent customer traffic to your catalog today.'}
              </p>
            </div>
            <Link
              href="/campaigns/new"
              className="inline-flex items-center space-x-2 px-6 py-2.5 bg-[#4F23D6] text-white text-xs font-black uppercase tracking-wider shadow-[3px_3px_0px_0px_#E1FF00]"
            >
              <Plus className="w-4 h-4" />
              <span>Launch Your First Ad</span>
            </Link>
          </div>
        ) : (
          <div className="divide-y-2 divide-gray-100">
            {filteredCampaigns.map((camp) => {
              const dailyBudget = Number(camp.daily_budget || 0);
              const spend = Number(camp.spend || camp.total_spend || 0);
              const budgetUsagePercent = dailyBudget > 0 ? Math.min(100, (spend / dailyBudget) * 100) : 0;
              const impressions = Number(camp.impressions || camp.total_impressions || 0);
              const clicks = Number(camp.clicks || camp.total_clicks || 0);
              const ctr = impressions > 0 ? ((clicks / impressions) * 100).toFixed(2) : '0.00';
              const isActive = camp.status === 'ACTIVE';

              return (
                <div 
                  key={camp.id} 
                  className="p-5 sm:p-6 hover:bg-gray-50/80 transition-colors flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6"
                >
                  {/* Left: Info & Badges */}
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link 
                        href={`/campaigns/${camp.id}`}
                        className="text-base font-black uppercase text-gray-900 hover:text-[#4F23D6] transition-colors flex items-center space-x-1"
                      >
                        <span>{camp.name}</span>
                        <ArrowUpRight className="w-4 h-4 opacity-50" />
                      </Link>

                      {/* Status Badge */}
                      <span className={`px-2.5 py-0.5 text-[10px] font-black uppercase border ${
                        camp.status === 'ACTIVE'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-500'
                          : camp.status === 'PAUSED'
                          ? 'bg-gray-100 text-gray-700 border-gray-400'
                          : 'bg-amber-50 text-amber-700 border-amber-500'
                      }`}>
                        {camp.status}
                      </span>

                      <span className="text-[10px] bg-purple-50 text-[#4F23D6] border border-purple-200 px-2 py-0.5 font-bold uppercase">
                        {camp.objective || 'SPONSORED_PRODUCTS'}
                      </span>
                    </div>

                    {/* Spend progress bar */}
                    <div className="space-y-1 max-w-md">
                      <div className="flex justify-between text-[11px] font-bold text-gray-500">
                        <span>Today&apos;s Spend: ₹{spend.toFixed(2)}</span>
                        <span>Daily Cap: ₹{dailyBudget.toFixed(2)} ({budgetUsagePercent.toFixed(0)}%)</span>
                      </div>
                      <div className="w-full h-2 bg-gray-200 overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-500 ${
                            budgetUsagePercent > 80 ? 'bg-amber-500' : 'bg-[#4F23D6]'
                          }`}
                          style={{ width: `${budgetUsagePercent}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Middle: Key Performance Metrics */}
                  <div className="grid grid-cols-3 gap-4 text-center shrink-0 w-full sm:w-auto border-y sm:border-y-0 sm:border-x border-gray-200 py-3 sm:py-0 sm:px-6">
                    <div>
                      <div className="text-[10px] uppercase font-bold text-gray-400">Impressions</div>
                      <div className="text-sm font-black text-gray-900">{impressions.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase font-bold text-gray-400">Clicks</div>
                      <div className="text-sm font-black text-gray-900">{clicks.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase font-bold text-gray-400">Avg CTR</div>
                      <div className="text-sm font-black text-[#4F23D6]">{ctr}%</div>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center space-x-2 self-end lg:self-center shrink-0">
                    <button
                      onClick={() => toggleCampaignStatus(camp.id, camp.status)}
                      className={`p-2 border-2 border-gray-900 transition-colors ${
                        isActive 
                          ? 'bg-amber-100 hover:bg-amber-200 text-amber-900' 
                          : 'bg-emerald-100 hover:bg-emerald-200 text-emerald-900'
                      }`}
                      title={isActive ? 'Pause Campaign' : 'Activate Campaign'}
                    >
                      {isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </button>

                    <Link
                      href={`/campaigns/${camp.id}`}
                      className="px-3 py-2 bg-gray-900 hover:bg-[#4F23D6] text-white text-xs font-black uppercase tracking-wider transition-colors"
                    >
                      Keywords & Bids
                    </Link>

                    <button
                      onClick={() => handleDelete(camp.id, camp.name)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 transition-colors"
                      title="Delete Campaign"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
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
