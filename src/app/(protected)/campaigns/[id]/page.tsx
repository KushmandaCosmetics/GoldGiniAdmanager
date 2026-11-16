'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Target, 
  Pause, 
  Play, 
  Trash2, 
  Eye, 
  MousePointerClick, 
  DollarSign, 
  Activity, 
  Plus, 
  X, 
  Edit3, 
  Image as ImageIcon,
  CheckCircle2,
  Clock,
  AlertCircle,
  Tag,
  Sliders,
  Check
} from 'lucide-react';

export default function CampaignDetails() {
  const params = useParams();
  const router = useRouter();
  const [campaign, setCampaign] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showAddKeyword, setShowAddKeyword] = useState(false);
  const [newKeyword, setNewKeyword] = useState({ keyword: '', matchType: 'BROAD', maxCpcBid: '4.50' });
  const [addingKeyword, setAddingKeyword] = useState(false);
  const [editingBidId, setEditingBidId] = useState<number | null>(null);
  const [tempBid, setTempBid] = useState('');
  const [showEditBudget, setShowEditBudget] = useState(false);
  const [newBudget, setNewBudget] = useState('');

  useEffect(() => {
    fetchCampaign();
  }, [params.id]);

  async function fetchCampaign() {
    try {
      const res = await fetch(`/api/campaigns/${params.id}`);
      const data = await res.json();
      if (data.success && data.campaign) {
        setCampaign(data.campaign);
        setNewBudget(data.campaign.daily_budget?.toString() || '');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const toggleStatus = async () => {
    try {
      const newStatus = campaign.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
      const res = await fetch(`/api/campaigns/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (data.success) {
        setCampaign({ ...campaign, status: newStatus });
      } else {
        alert(data.error || 'Failed to update status');
      }
    } catch (err) {
      alert("Failed to update status");
    }
  };

  const updateBudget = async () => {
    const val = Number(newBudget);
    if (!val || val < 100) {
      alert('Minimum daily budget is ₹100');
      return;
    }

    try {
      const res = await fetch(`/api/campaigns/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dailyBudget: val })
      });
      const data = await res.json();
      if (data.success) {
        setCampaign({ ...campaign, daily_budget: val });
        setShowEditBudget(false);
      } else {
        alert(data.error || 'Failed to update daily budget');
      }
    } catch (e) {
      alert('Error updating budget');
    }
  };

  const handleAddKeyword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyword.keyword.trim()) return;

    setAddingKeyword(true);
    try {
      const res = await fetch(`/api/campaigns/${params.id}/keywords`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keyword: newKeyword.keyword.trim(),
          matchType: newKeyword.matchType,
          maxCpcBid: Number(newKeyword.maxCpcBid) || 2
        })
      });
      const data = await res.json();
      if (data.success) {
        setNewKeyword({ keyword: '', matchType: 'BROAD', maxCpcBid: '4.50' });
        setShowAddKeyword(false);
        fetchCampaign();
      } else {
        alert(data.error || 'Failed to add keyword');
      }
    } catch (err) {
      alert('Error adding keyword');
    } finally {
      setAddingKeyword(false);
    }
  };

  const handleUpdateKeywordBid = async (keywordId: number) => {
    const num = Number(tempBid);
    if (isNaN(num) || num <= 0) return;

    try {
      const res = await fetch(`/api/campaigns/keywords/${keywordId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ maxCpcBid: num })
      });
      const data = await res.json();
      if (data.success) {
        setCampaign({
          ...campaign,
          keywords: campaign.keywords.map((k: any) => k.id === keywordId ? { ...k, max_cpc_bid: num } : k)
        });
        setEditingBidId(null);
      } else {
        alert(data.error || 'Failed to update bid');
      }
    } catch (err) {
      alert('Error updating bid');
    }
  };

  const handleDeleteKeyword = async (keywordId: number) => {
    if (!confirm('Remove this target keyword from auction?')) return;
    try {
      const res = await fetch(`/api/campaigns/keywords/${keywordId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setCampaign({
          ...campaign,
          keywords: campaign.keywords.filter((k: any) => k.id !== keywordId)
        });
      } else {
        alert(data.error || 'Failed to remove keyword');
      }
    } catch (err) {
      alert('Error removing keyword');
    }
  };

  const deleteCampaign = async () => {
    if (!confirm("Are you sure you want to permanently delete this campaign? This action cannot be undone.")) return;
    try {
      const res = await fetch(`/api/campaigns/${params.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        router.push('/campaigns');
      } else {
        alert(data.error || 'Failed to delete');
      }
    } catch (err) {
      alert("Error deleting campaign");
    }
  };

  if (loading) {
    return <div className="p-16 text-center text-sm font-bold text-[#4F23D6] animate-pulse">Loading campaign details...</div>;
  }

  if (!campaign) {
    return (
      <div className="p-16 text-center space-y-4">
        <p className="text-gray-500 font-bold">Campaign not found or was removed.</p>
        <Link href="/campaigns" className="text-xs font-black uppercase text-[#4F23D6] underline">
          ← Return to Campaigns
        </Link>
      </div>
    );
  }

  const spend = Number(campaign.spend || campaign.total_spend || 0);
  const impressions = Number(campaign.impressions || campaign.total_impressions || 0);
  const clicks = Number(campaign.clicks || campaign.total_clicks || 0);
  const ctr = impressions > 0 ? ((clicks / impressions) * 100).toFixed(2) : '0.00';
  const avgCpc = clicks > 0 ? (spend / clicks).toFixed(2) : '0.00';
  const isActive = campaign.status === 'ACTIVE';

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-8">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <Link 
          href="/campaigns" 
          className="inline-flex items-center text-xs font-bold uppercase tracking-wider text-gray-500 hover:text-[#4F23D6] transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Campaigns
        </Link>

        <div className="flex items-center space-x-3">
          <button
            onClick={toggleStatus}
            className={`px-4 py-2 border-2 border-gray-900 text-xs font-black uppercase tracking-wider flex items-center space-x-1.5 transition-all shadow-[2px_2px_0px_0px_#110C24] ${
              isActive 
                ? 'bg-amber-100 hover:bg-amber-200 text-amber-900' 
                : 'bg-emerald-100 hover:bg-emerald-200 text-emerald-900'
            }`}
          >
            {isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            <span>{isActive ? 'Pause Campaign' : 'Resume Campaign'}</span>
          </button>

          <button
            onClick={() => setShowEditBudget(true)}
            className="px-4 py-2 bg-white border-2 border-gray-900 text-xs font-black uppercase tracking-wider flex items-center space-x-1.5 hover:bg-gray-100 transition-colors shadow-[2px_2px_0px_0px_#110C24]"
          >
            <Sliders className="w-4 h-4" />
            <span>Edit Budget</span>
          </button>

          <button
            onClick={deleteCampaign}
            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 transition-colors"
            title="Delete Campaign"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Campaign Header Banner */}
      <div className="bg-[#110C24] text-white border-2 border-gray-900 p-6 sm:p-8 shadow-[6px_6px_0px_0px_#E1FF00] space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="text-[10px] bg-[#E1FF00] text-black px-2 py-0.5 font-black uppercase tracking-wide">
                {campaign.objective || 'SPONSORED_PRODUCTS'}
              </span>
              <span className={`text-[10px] px-2 py-0.5 font-black uppercase border ${
                isActive ? 'border-emerald-400 text-emerald-300' : 'border-gray-500 text-gray-400'
              }`}>
                {campaign.status}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white">
              {campaign.name}
            </h1>
          </div>

          <div className="bg-white/10 p-4 border border-white/20 text-right">
            <span className="text-[10px] text-purple-200 uppercase font-bold block">Daily Budget Cap</span>
            <span className="text-2xl font-black text-[#E1FF00]">
              ₹{Number(campaign.daily_budget || 0).toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* 5 KPI Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white border-2 border-gray-900 p-4 shadow-[3px_3px_0px_0px_#110C24]">
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Total Spend</span>
          <p className="text-2xl font-black text-gray-900 mt-1">₹{spend.toFixed(2)}</p>
        </div>

        <div className="bg-white border-2 border-gray-900 p-4 shadow-[3px_3px_0px_0px_#110C24]">
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Impressions</span>
          <p className="text-2xl font-black text-gray-900 mt-1">{impressions.toLocaleString()}</p>
        </div>

        <div className="bg-white border-2 border-gray-900 p-4 shadow-[3px_3px_0px_0px_#110C24]">
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Total Clicks</span>
          <p className="text-2xl font-black text-gray-900 mt-1">{clicks.toLocaleString()}</p>
        </div>

        <div className="bg-white border-2 border-gray-900 p-4 shadow-[3px_3px_0px_0px_#110C24]">
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Average CTR</span>
          <p className="text-2xl font-black text-[#4F23D6] mt-1">{ctr}%</p>
        </div>

        <div className="col-span-2 lg:col-span-1 bg-white border-2 border-gray-900 p-4 shadow-[3px_3px_0px_0px_#110C24]">
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Avg. CPC Paid</span>
          <p className="text-2xl font-black text-emerald-600 mt-1">₹{avgCpc}</p>
        </div>
      </div>

      {/* Keywords Bidding Management Section */}
      <div className="bg-white border-2 border-gray-900 shadow-[6px_6px_0px_0px_#110C24] overflow-hidden">
        {/* Section Header */}
        <div className="p-5 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gray-50">
          <div>
            <div className="flex items-center space-x-2">
              <Tag className="w-5 h-5 text-[#4F23D6]" />
              <h2 className="text-lg font-black uppercase tracking-tight text-gray-900">
                Target Keywords & RTB Bids ({campaign.keywords?.length || 0})
              </h2>
            </div>
            <p className="text-xs text-gray-500 mt-0.5 font-medium">
              Manage keyword search queries, match types, and individual maximum cost-per-click bids.
            </p>
          </div>

          <button
            onClick={() => setShowAddKeyword(true)}
            className="px-4 py-2 bg-[#4F23D6] hover:bg-[#3815a8] text-white text-xs font-black uppercase tracking-wider flex items-center space-x-1.5 shadow-[2px_2px_0px_0px_#E1FF00]"
          >
            <Plus className="w-4 h-4" />
            <span>Add Target Keyword</span>
          </button>
        </div>

        {/* Keywords Table */}
        {!campaign.keywords || campaign.keywords.length === 0 ? (
          <div className="p-12 text-center text-xs text-gray-400 font-bold">
            No keywords attached to this campaign. Click &ldquo;Add Target Keyword&rdquo; to start bidding.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b-2 border-gray-200 text-[10px] font-black uppercase text-gray-500 tracking-wider bg-gray-50">
                  <th className="p-4">Target Keyword</th>
                  <th className="p-4">Match Type</th>
                  <th className="p-4">Max CPC Bid</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 text-xs font-bold text-gray-800">
                {campaign.keywords.map((kw: any) => {
                  const isEditing = editingBidId === kw.id;

                  return (
                    <tr key={kw.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="p-4 font-black text-gray-900">
                        {kw.keyword}
                      </td>
                      <td className="p-4">
                        <span className="px-2 py-0.5 text-[10px] font-black uppercase bg-purple-50 text-[#4F23D6] border border-purple-200">
                          {kw.match_type || 'BROAD'}
                        </span>
                      </td>
                      <td className="p-4">
                        {isEditing ? (
                          <div className="flex items-center space-x-2">
                            <span className="text-gray-500">₹</span>
                            <input
                              type="number"
                              step="0.25"
                              value={tempBid}
                              onChange={(e) => setTempBid(e.target.value)}
                              className="w-20 px-2 py-1 border-2 border-gray-900 text-xs font-bold"
                              autoFocus
                            />
                            <button
                              onClick={() => handleUpdateKeywordBid(kw.id)}
                              className="p-1 bg-[#4F23D6] text-white hover:bg-black"
                              title="Save"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setEditingBidId(null)}
                              className="p-1 text-gray-400 hover:text-black"
                              title="Cancel"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div 
                            onClick={() => {
                              setEditingBidId(kw.id);
                              setTempBid(Number(kw.max_cpc_bid || 0).toFixed(2));
                            }}
                            className="inline-flex items-center space-x-1.5 cursor-pointer hover:text-[#4F23D6] group"
                            title="Click to edit bid"
                          >
                            <span className="font-mono text-sm font-black">
                              ₹{Number(kw.max_cpc_bid || 0).toFixed(2)}
                            </span>
                            <Edit3 className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 text-gray-400" />
                          </div>
                        )}
                      </td>
                      <td className="p-4">
                        <span className="text-emerald-700 bg-emerald-50 border border-emerald-500 px-2 py-0.5 text-[10px] font-black uppercase">
                          Bidding Active
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => handleDeleteKeyword(kw.id)}
                          className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                          title="Remove keyword"
                        >
                          <Trash2 className="w-4 h-4" />
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

      {/* Modal: Add Target Keyword */}
      {showAddKeyword && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white border-2 border-gray-900 w-full max-w-md shadow-[8px_8px_0px_0px_#110C24]">
            <div className="bg-[#110C24] text-white p-5 flex justify-between items-center border-b border-white/10">
              <h3 className="text-sm font-black uppercase tracking-wider">Add Target Keyword</h3>
              <button onClick={() => setShowAddKeyword(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddKeyword} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Search Keyword *
                </label>
                <input
                  required
                  value={newKeyword.keyword}
                  onChange={(e) => setNewKeyword({ ...newKeyword, keyword: e.target.value })}
                  placeholder="e.g. 24k gold mangalsutra"
                  className="w-full px-3 py-2 border-2 border-gray-900 text-xs font-bold text-gray-900 focus:outline-none focus:border-[#4F23D6]"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Match Type
                </label>
                <select
                  value={newKeyword.matchType}
                  onChange={(e) => setNewKeyword({ ...newKeyword, matchType: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-gray-900 text-xs font-bold text-gray-900 bg-white"
                >
                  <option value="BROAD">Broad Match (Maximum Reach)</option>
                  <option value="PHRASE">Phrase Match (Order Sensitive)</option>
                  <option value="EXACT">Exact Match (Highest Precision)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Max Bid per Click (₹) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-gray-500">₹</span>
                  <input
                    required
                    type="number"
                    step="0.25"
                    min="0.5"
                    value={newKeyword.maxCpcBid}
                    onChange={(e) => setNewKeyword({ ...newKeyword, maxCpcBid: e.target.value })}
                    className="w-full pl-7 pr-3 py-2 border-2 border-gray-900 text-xs font-black text-gray-900"
                  />
                </div>
              </div>

              <div className="flex space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddKeyword(false)}
                  className="flex-1 py-2.5 border-2 border-gray-300 text-gray-700 font-bold uppercase text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addingKeyword}
                  className="flex-1 py-2.5 bg-[#4F23D6] text-white font-black uppercase text-xs shadow-[3px_3px_0px_0px_#E1FF00]"
                >
                  {addingKeyword ? 'Adding...' : 'Add Keyword'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Daily Budget */}
      {showEditBudget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white border-2 border-gray-900 w-full max-w-sm shadow-[8px_8px_0px_0px_#110C24]">
            <div className="bg-[#110C24] text-white p-4 flex justify-between items-center">
              <h3 className="text-xs font-black uppercase tracking-wider">Update Daily Budget</h3>
              <button onClick={() => setShowEditBudget(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">New Daily Limit (₹)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-gray-500">₹</span>
                  <input
                    type="number"
                    min="100"
                    step="50"
                    value={newBudget}
                    onChange={(e) => setNewBudget(e.target.value)}
                    className="w-full pl-7 pr-3 py-2 border-2 border-gray-900 text-xs font-black text-gray-900"
                  />
                </div>
              </div>
              <div className="flex space-x-2 pt-2">
                <button
                  onClick={() => setShowEditBudget(false)}
                  className="flex-1 py-2 border border-gray-300 text-xs font-bold uppercase text-gray-700"
                >
                  Cancel
                </button>
                <button
                  onClick={updateBudget}
                  className="flex-1 py-2 bg-[#4F23D6] text-white text-xs font-black uppercase shadow-[2px_2px_0px_0px_#E1FF00]"
                >
                  Save Limit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
