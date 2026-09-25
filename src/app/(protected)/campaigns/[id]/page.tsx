'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Target, Pause, Play, Trash2, Eye, MousePointerClick, DollarSign, Activity, Plus, X, Edit3, Image as ImageIcon } from 'lucide-react';

export default function CampaignDetails() {
  const params = useParams();
  const router = useRouter();
  const [campaign, setCampaign] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showAddKeyword, setShowAddKeyword] = useState(false);
  const [newKeyword, setNewKeyword] = useState({ keyword: '', matchType: 'BROAD', maxCpcBid: '' });
  const [addingKeyword, setAddingKeyword] = useState(false);

  useEffect(() => {
    fetchCampaign();
  }, [params.id]);

  async function fetchCampaign() {
    try {
      const res = await fetch(`/api/campaigns/${params.id}`);
      const data = await res.json();
      if (data.success) setCampaign(data.campaign);
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

  const deleteCampaign = async () => {
    if (!confirm("Are you sure you want to delete this campaign? This action cannot be undone.")) return;
    try {
      const res = await fetch(`/api/campaigns/${params.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        router.push('/campaigns');
      } else {
        alert(data.error || 'Failed to delete');
      }
    } catch (err) {
      alert("Failed to delete campaign");
    }
  };

  const handleAddKeyword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyword.keyword || !newKeyword.maxCpcBid) return;
    setAddingKeyword(true);
    try {
      const res = await fetch(`/api/campaigns/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          addKeyword: {
            keyword: newKeyword.keyword,
            matchType: newKeyword.matchType,
            maxCpcBid: Number(newKeyword.maxCpcBid)
          }
        })
      });
      const data = await res.json();
      if (data.success) {
        setNewKeyword({ keyword: '', matchType: 'BROAD', maxCpcBid: '' });
        setShowAddKeyword(false);
        fetchCampaign(); // Refresh
      }
    } catch (err) {
      alert('Failed to add keyword');
    } finally {
      setAddingKeyword(false);
    }
  };

  if (loading) return <div className="p-8 text-[#4F23D6] font-bold uppercase tracking-widest">Loading...</div>;
  if (!campaign) return <div className="p-8 text-red-500 font-bold">Campaign not found</div>;

  const ctr = campaign._count?.impressions > 0 
    ? ((campaign._count.clicks / campaign._count.impressions) * 100).toFixed(2) 
    : '0.00';
  const avgCpc = campaign._count?.clicks > 0 
    ? (Number(campaign.totalSpent) / campaign._count.clicks).toFixed(2) 
    : '0.00';

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <Link href="/campaigns" className="inline-flex items-center text-gray-500 hover:text-[#4F23D6] font-bold uppercase tracking-wide transition-colors">
        <ArrowLeft className="w-5 h-5 mr-2" /> Back to Campaigns
      </Link>

      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-4xl font-black uppercase tracking-tighter text-gray-900">{campaign.name}</h1>
          <div className="flex items-center mt-3 space-x-4">
            <span className={`px-3 py-1 text-xs font-bold uppercase tracking-wider ${
              campaign.status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
              campaign.status === 'PAUSED' ? 'bg-yellow-100 text-yellow-700' :
              campaign.status === 'BUDGET_EXHAUSTED' ? 'bg-red-100 text-red-700' :
              'bg-gray-100 text-gray-600'
            }`}>
              {campaign.status}
            </span>
            <span className="text-gray-400 text-sm font-medium">Created: {new Date(campaign.createdAt).toLocaleDateString()}</span>
          </div>
        </div>

        <div className="flex space-x-3">
          <button 
            onClick={toggleStatus}
            className={`px-4 py-2 border-2 flex items-center font-bold uppercase tracking-wide transition-colors ${
              campaign.status === 'ACTIVE' 
                ? 'border-yellow-500 text-yellow-600 hover:bg-yellow-50' 
                : 'border-green-500 text-green-600 hover:bg-green-50'
            }`}
          >
            {campaign.status === 'ACTIVE' ? <><Pause className="w-4 h-4 mr-2"/> Pause</> : <><Play className="w-4 h-4 mr-2"/> Activate</>}
          </button>
          <button onClick={deleteCampaign} className="px-4 py-2 border-2 border-red-500 text-red-500 flex items-center hover:bg-red-50 transition-colors font-bold uppercase tracking-wide">
            <Trash2 className="w-4 h-4 mr-2" /> Delete
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center text-gray-400 mb-2"><DollarSign className="w-4 h-4 mr-1" /><span className="text-xs font-bold uppercase tracking-wider">Total Spent</span></div>
          <p className="text-2xl font-black text-gray-900 tracking-tighter">₹{Number(campaign.totalSpent).toFixed(2)}</p>
        </div>
        <div className="bg-white border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center text-gray-400 mb-2"><DollarSign className="w-4 h-4 mr-1" /><span className="text-xs font-bold uppercase tracking-wider">Spent Today</span></div>
          <p className="text-2xl font-black text-gray-900 tracking-tighter">₹{Number(campaign.spentToday).toFixed(2)}</p>
          <p className="text-xs text-gray-400 mt-1">of ₹{Number(campaign.dailyBudget).toFixed(2)} budget</p>
        </div>
        <div className="bg-white border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center text-gray-400 mb-2"><Eye className="w-4 h-4 mr-1" /><span className="text-xs font-bold uppercase tracking-wider">Impressions</span></div>
          <p className="text-2xl font-black text-gray-900 tracking-tighter">{(campaign._count?.impressions || 0).toLocaleString()}</p>
        </div>
        <div className="bg-white border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center text-gray-400 mb-2"><MousePointerClick className="w-4 h-4 mr-1" /><span className="text-xs font-bold uppercase tracking-wider">Clicks</span></div>
          <p className="text-2xl font-black text-gray-900 tracking-tighter">{(campaign._count?.clicks || 0).toLocaleString()}</p>
        </div>
        <div className="bg-gradient-to-br from-[#4F23D6] to-[#2c1280] p-5 shadow-[3px_3px_0px_0px_#E1FF00]">
          <div className="flex items-center text-purple-200 mb-2"><Activity className="w-4 h-4 mr-1" /><span className="text-xs font-bold uppercase tracking-wider">CTR</span></div>
          <p className="text-2xl font-black text-[#E1FF00] tracking-tighter">{ctr}%</p>
          <p className="text-xs text-purple-200 mt-1">Avg CPC: ₹{avgCpc}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Ad Preview */}
        <div className="md:col-span-1 space-y-4">
          <h3 className="text-lg font-bold text-gray-900 uppercase tracking-wide">Ad Preview</h3>
          {campaign.ads?.map((ad: any) => (
            <div key={ad.id} className="bg-white border border-gray-200 p-4 relative shadow-sm">
              <span className="absolute top-2 right-2 text-[10px] bg-[#4F23D6] text-white px-2 py-0.5 font-bold uppercase">Sponsored</span>
              <div className="w-full h-40 bg-gray-100 mb-4 overflow-hidden flex items-center justify-center">
                {ad.imageUrl ? (
                  <img src={ad.imageUrl} alt="Ad" className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon className="w-12 h-12 text-gray-300" />
                )}
              </div>
              <h4 className="font-bold text-gray-900 mb-1 leading-tight">{ad.headline}</h4>
              {ad.description && <p className="text-gray-500 text-sm mb-3 line-clamp-2">{ad.description}</p>}
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-400">Product #{ad.productId}</span>
                <a href={ad.targetUrl} target="_blank" rel="noreferrer" className="text-[#4F23D6] text-sm font-bold uppercase hover:underline">View →</a>
              </div>
            </div>
          ))}

          {/* Campaign Settings */}
          <div className="bg-white border border-gray-200 p-5 shadow-sm">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-4">Campaign Settings</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Daily Budget</span>
                <span className="font-mono font-bold text-gray-900">₹{Number(campaign.dailyBudget).toFixed(2)}</span>
              </div>
              {campaign.totalBudget && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Total Budget</span>
                  <span className="font-mono font-bold text-gray-900">₹{Number(campaign.totalBudget).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-500">Start Date</span>
                <span className="font-medium text-gray-900">{new Date(campaign.startDate).toLocaleDateString()}</span>
              </div>
              {campaign.endDate && (
                <div className="flex justify-between">
                  <span className="text-gray-500">End Date</span>
                  <span className="font-medium text-gray-900">{new Date(campaign.endDate).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Keywords Section */}
        <div className="md:col-span-2">
          <div className="bg-white border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-900 uppercase tracking-wide flex items-center">
                <Target className="w-5 h-5 mr-2 text-[#4F23D6]" /> Targeting Keywords
              </h3>
              <button 
                onClick={() => setShowAddKeyword(!showAddKeyword)}
                className="text-sm text-[#4F23D6] font-bold uppercase hover:underline flex items-center"
              >
                {showAddKeyword ? <><X className="w-4 h-4 mr-1" /> Cancel</> : <><Plus className="w-4 h-4 mr-1" /> Add Keyword</>}
              </button>
            </div>

            {/* Add Keyword Form */}
            {showAddKeyword && (
              <form onSubmit={handleAddKeyword} className="p-4 bg-purple-50 border-b border-purple-100 flex gap-3 items-end">
                <div className="flex-1">
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">Keyword</label>
                  <input
                    required
                    value={newKeyword.keyword}
                    onChange={(e) => setNewKeyword({ ...newKeyword, keyword: e.target.value })}
                    className="w-full bg-white border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-[#4F23D6]"
                    placeholder="gold ring"
                  />
                </div>
                <div className="w-36">
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">Match</label>
                  <select
                    value={newKeyword.matchType}
                    onChange={(e) => setNewKeyword({ ...newKeyword, matchType: e.target.value })}
                    className="w-full bg-white border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-[#4F23D6]"
                  >
                    <option value="BROAD">Broad</option>
                    <option value="PHRASE">Phrase</option>
                    <option value="EXACT">Exact</option>
                  </select>
                </div>
                <div className="w-28">
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">Max CPC (₹)</label>
                  <input
                    required
                    type="number"
                    min="0.1"
                    step="0.1"
                    value={newKeyword.maxCpcBid}
                    onChange={(e) => setNewKeyword({ ...newKeyword, maxCpcBid: e.target.value })}
                    className="w-full bg-white border border-gray-300 px-3 py-2 text-sm font-mono focus:outline-none focus:border-[#4F23D6]"
                    placeholder="5.00"
                  />
                </div>
                <button
                  type="submit"
                  disabled={addingKeyword}
                  className="px-4 py-2 bg-[#4F23D6] text-white font-bold text-sm uppercase disabled:opacity-50"
                >
                  {addingKeyword ? '...' : 'Add'}
                </button>
              </form>
            )}

            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-white">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Keyword</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Match Type</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Max CPC Bid</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {campaign.keywords?.length > 0 ? campaign.keywords.map((kw: any) => (
                  <tr key={kw.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{kw.keyword}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className="px-2 py-0.5 text-xs font-bold uppercase bg-gray-100 text-gray-600">{kw.matchType}</span>
                    </td>
                    <td className="px-6 py-4 text-sm font-mono text-[#4F23D6] font-bold">₹{Number(kw.maxCpcBid).toFixed(2)}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-2 py-1 text-xs font-bold rounded-full ${kw.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {kw.isActive ? 'Active' : 'Paused'}
                      </span>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-gray-400">No keywords configured</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
