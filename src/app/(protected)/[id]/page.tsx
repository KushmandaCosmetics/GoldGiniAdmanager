'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

type Keyword = {
  id: number;
  keyword: string;
  matchType: string;
  maxCpcBid: string;
  isActive: boolean;
};

type Campaign = {
  id: number;
  name: string;
  status: string;
  dailyBudget: string;
  spentToday: string;
  keywords: Keyword[];
  ads: { id: number; headline: string; productId: string }[];
  _count: { clicks: number, impressions: number };
};

export default function CampaignDetailPage() {
  const params = useParams();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/campaigns/${params.id}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setCampaign(data.campaign);
        }
        setLoading(false);
      });
  }, [params.id]);

  const toggleStatus = async () => {
    if (!campaign) return;
    const newStatus = campaign.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
    const res = await fetch(`/api/campaigns/${campaign.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    });
    const data = await res.json();
    if (data.success) {
      setCampaign({ ...campaign, status: newStatus });
    } else {
      alert(data.error);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading campaign details...</div>;
  if (!campaign) return <div className="p-8 text-center text-red-500">Campaign not found</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex justify-between items-start">
        <div>
          <Link href="/campaigns" className="text-sm text-yellow-600 font-semibold hover:underline mb-2 inline-block">← Back to Campaigns</Link>
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-4">
            {campaign.name}
            <span className={`px-3 py-1 text-sm font-semibold rounded-full ${
              campaign.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 
              campaign.status === 'BUDGET_EXHAUSTED' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
            }`}>
              {campaign.status}
            </span>
          </h1>
        </div>
        <button 
          onClick={toggleStatus}
          className="px-4 py-2 border border-gray-300 rounded-md font-medium text-gray-700 bg-white hover:bg-gray-50 shadow-sm"
        >
          {campaign.status === 'ACTIVE' ? 'Pause Campaign' : 'Activate Campaign'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <p className="text-sm text-gray-500 font-medium mb-1">Daily Budget</p>
          <p className="text-2xl font-bold text-gray-900">₹{campaign.dailyBudget}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <p className="text-sm text-gray-500 font-medium mb-1">Spent Today</p>
          <p className="text-2xl font-bold text-gray-900">₹{campaign.spentToday}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <p className="text-sm text-gray-500 font-medium mb-1">Impressions</p>
          <p className="text-2xl font-bold text-gray-900">{campaign._count.impressions}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <p className="text-sm text-gray-500 font-medium mb-1">Clicks</p>
          <p className="text-2xl font-bold text-gray-900">{campaign._count.clicks}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
          <h2 className="text-lg font-bold text-gray-800">Targeting Keywords</h2>
          <button className="text-sm text-yellow-600 font-semibold hover:underline">+ Add Keyword</button>
        </div>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-white">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Keyword</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Match Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Max CPC Bid</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {campaign.keywords.map(kw => (
              <tr key={kw.id}>
                <td className="px-6 py-4 text-sm font-medium text-gray-900">{kw.keyword}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{kw.matchType}</td>
                <td className="px-6 py-4 text-sm text-gray-500">₹{kw.maxCpcBid}</td>
                <td className="px-6 py-4 text-sm">
                  <span className={`px-2 py-1 text-xs rounded-full ${kw.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                    {kw.isActive ? 'Active' : 'Paused'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-lg font-bold text-gray-800">Ad Creatives</h2>
        </div>
        <ul className="divide-y divide-gray-200">
          {campaign.ads.map(ad => (
            <li key={ad.id} className="px-6 py-4 flex justify-between items-center">
              <div>
                <p className="text-sm font-bold text-gray-900">{ad.headline}</p>
                <p className="text-sm text-gray-500">Product ID: {ad.productId}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>

    </div>
  );
}
