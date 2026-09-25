'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Filter, Plus, Megaphone, Trash2, Eye, MousePointerClick } from 'lucide-react';

export default function CampaignsList() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  useEffect(() => {
    fetchCampaigns();
  }, []);

  async function fetchCampaigns() {
    try {
      const res = await fetch('/api/campaigns');
      const data = await res.json();
      if (data.success) {
        setCampaigns(data.campaigns);
      }
    } catch (error) {
      console.error("Failed to load campaigns", error);
    } finally {
      setLoading(false);
    }
  }

  const handleDelete = async (campaignId: number, campaignName: string) => {
    if (!confirm(`Are you sure you want to delete "${campaignName}"? This action cannot be undone.`)) return;
    
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

  // Filter campaigns
  const filteredCampaigns = campaigns.filter(camp => {
    const matchesSearch = camp.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || camp.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const statusCounts = {
    ALL: campaigns.length,
    ACTIVE: campaigns.filter(c => c.status === 'ACTIVE').length,
    PAUSED: campaigns.filter(c => c.status === 'PAUSED').length,
    BUDGET_EXHAUSTED: campaigns.filter(c => c.status === 'BUDGET_EXHAUSTED').length,
    ENDED: campaigns.filter(c => c.status === 'ENDED').length,
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black uppercase tracking-tighter text-gray-900">Your <span className="text-[#4F23D6]">Campaigns</span></h1>
          <p className="text-gray-500 mt-2 font-medium">Manage and track your advertising campaigns</p>
        </div>
        <Link 
          href="/campaigns/new" 
          className="bg-[#4F23D6] text-white px-6 py-3 font-bold uppercase tracking-wide flex items-center hover:bg-gray-900 transition-colors shadow-[4px_4px_0px_0px_#E1FF00] hover:shadow-[6px_6px_0px_0px_#E1FF00] hover:-translate-y-0.5 active:translate-y-0 active:shadow-[2px_2px_0px_0px_#E1FF00]"
        >
          <Plus className="w-5 h-5 mr-2" /> New Campaign
        </Link>
      </div>

      {/* Controls */}
      <div className="flex space-x-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input 
            type="text" 
            placeholder="Search campaigns..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white border border-gray-300 text-gray-900 focus:outline-none focus:border-[#4F23D6] focus:ring-1 focus:ring-[#4F23D6] transition-colors placeholder-gray-400 shadow-sm"
          />
        </div>
        <div className="relative">
          <button 
            onClick={() => setShowFilterDropdown(!showFilterDropdown)}
            className="px-4 py-3 bg-white border border-gray-300 text-gray-700 flex items-center hover:bg-gray-50 transition-colors font-bold uppercase tracking-wide shadow-sm"
          >
            <Filter className="w-5 h-5 mr-2" /> 
            {statusFilter === 'ALL' ? 'All Status' : statusFilter.replace('_', ' ')}
          </button>
          {showFilterDropdown && (
            <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 shadow-lg z-20 w-56">
              {Object.entries(statusCounts).map(([status, count]) => (
                <button
                  key={status}
                  onClick={() => { setStatusFilter(status); setShowFilterDropdown(false); }}
                  className={`w-full text-left px-4 py-3 flex justify-between items-center hover:bg-gray-50 transition-colors text-sm font-bold uppercase tracking-wide ${
                    statusFilter === status ? 'bg-purple-50 text-[#4F23D6]' : 'text-gray-700'
                  }`}
                >
                  <span>{status === 'ALL' ? 'All Campaigns' : status.replace('_', ' ')}</span>
                  <span className="text-gray-400 font-mono">{count}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-[#4F23D6] font-bold uppercase tracking-widest">Loading...</div>
        ) : filteredCampaigns.length === 0 ? (
          <div className="p-16 text-center flex flex-col items-center">
            <Megaphone className="w-16 h-16 text-gray-300 mb-4" />
            <h3 className="text-xl font-bold text-gray-900 uppercase tracking-wide mb-2">
              {searchQuery || statusFilter !== 'ALL' ? 'No Matching Campaigns' : 'No Campaigns Yet'}
            </h3>
            <p className="text-gray-500 mb-6 font-medium">
              {searchQuery || statusFilter !== 'ALL' 
                ? 'Try adjusting your search or filter.' 
                : 'Create your first campaign to start driving traffic to your products.'}
            </p>
            {!searchQuery && statusFilter === 'ALL' && (
              <Link 
                href="/campaigns/new" 
                className="border-2 border-[#4F23D6] text-[#4F23D6] px-6 py-3 font-bold uppercase tracking-wide hover:bg-[#4F23D6] hover:text-white transition-colors"
              >
                Get Started
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase tracking-wider text-gray-500">
                  <th className="p-4 font-bold">Campaign Name</th>
                  <th className="p-4 font-bold">Status</th>
                  <th className="p-4 font-bold text-right">Daily Budget</th>
                  <th className="p-4 font-bold text-right">Total Spent</th>
                  <th className="p-4 font-bold text-right">Impressions</th>
                  <th className="p-4 font-bold text-right">Clicks</th>
                  <th className="p-4 font-bold text-right">CTR</th>
                  <th className="p-4 font-bold text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredCampaigns.map((camp: any) => {
                  const ctr = camp._count?.impressions > 0 
                    ? ((camp._count.clicks / camp._count.impressions) * 100).toFixed(2) 
                    : '0.00';
                  return (
                    <tr key={camp.id} className="hover:bg-gray-50 transition-colors group">
                      <td className="p-4">
                        <Link href={`/campaigns/${camp.id}`} className="font-bold text-gray-900 hover:text-[#4F23D6] transition-colors">
                          {camp.name}
                        </Link>
                        <p className="text-xs text-gray-400 mt-1">
                          {camp.keywords?.length || 0} keywords · {camp.ads?.length || 0} ads
                        </p>
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-1 text-xs font-bold uppercase tracking-wider ${
                          camp.status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
                          camp.status === 'PAUSED' ? 'bg-yellow-100 text-yellow-700' :
                          camp.status === 'BUDGET_EXHAUSTED' ? 'bg-red-100 text-red-700' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {camp.status}
                        </span>
                      </td>
                      <td className="p-4 text-right font-mono text-gray-600">
                        ₹{Number(camp.dailyBudget).toFixed(2)}
                      </td>
                      <td className="p-4 text-right font-mono text-gray-600">
                        ₹{Number(camp.totalSpent).toFixed(2)}
                      </td>
                      <td className="p-4 text-right text-gray-600">
                        {(camp._count?.impressions || 0).toLocaleString()}
                      </td>
                      <td className="p-4 text-right text-gray-600">
                        {(camp._count?.clicks || 0).toLocaleString()}
                      </td>
                      <td className="p-4 text-right font-mono text-[#4F23D6] font-bold">
                        {ctr}%
                      </td>
                      <td className="p-4 text-center">
                        <button 
                          onClick={() => handleDelete(camp.id, camp.name)}
                          className="p-2 text-gray-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                          title="Delete campaign"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
