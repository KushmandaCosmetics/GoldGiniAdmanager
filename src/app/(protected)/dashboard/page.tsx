'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

import dynamic from 'next/dynamic';

const DashboardCharts = dynamic(() => import('@/components/DashboardCharts'), {
  ssr: false,
  loading: () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="bg-white border-2 border-gray-900 p-6 shadow-[6px_6px_0px_0px_#110C24] h-80 flex items-center justify-center text-xs text-gray-400 font-bold">
        Loading analytics charts...
      </div>
      <div className="bg-white border-2 border-gray-900 p-6 shadow-[6px_6px_0px_0px_#110C24] h-80 flex items-center justify-center text-xs text-gray-400 font-bold">
        Loading analytics charts...
      </div>
    </div>
  ),
});
import { 
  MousePointerClick, 
  Eye, 
  TrendingUp, 
  DollarSign, 
  Activity, 
  Megaphone, 
  Target, 
  Plus,
  Zap,
  ArrowUpRight,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import QuickTopUpModal from '@/components/QuickTopUpModal';

export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('7');
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [isTopUpOpen, setIsTopUpOpen] = useState(false);

  useEffect(() => {
    fetchData();
  }, [period]);

  async function fetchData() {
    setLoading(true);
    try {
      const [analyticsRes, campaignsRes] = await Promise.all([
        fetch(`/api/analytics?days=${period}`),
        fetch('/api/campaigns')
      ]);
      
      const analyticsData = await analyticsRes.json();
      const campaignsData = await campaignsRes.json();
      
      if (analyticsData.success) {
        setStats(analyticsData.summary);
        setChartData(analyticsData.chartData || []);
      }
      if (campaignsData.success) {
        setCampaigns(campaignsData.campaigns || []);
      }
    } catch (err) {
      console.error("Failed to fetch analytics", err);
    } finally {
      setLoading(false);
    }
  }

  const impressions = Number(stats?.impressions || 0);
  const clicks = Number(stats?.clicks || 0);
  const spend = Number(stats?.spend || 0);
  const avgCpc = clicks > 0 ? (spend / clicks) : 0;
  const ctr = impressions > 0 ? ((clicks / impressions) * 100).toFixed(2) : '0.00';
  const activeCampaigns = campaigns.filter((c: any) => c.status === 'ACTIVE').length;

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-[#4F23D6] mb-1">
            <Activity className="w-4 h-4" />
            <span>Real-Time Ad Performance</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-gray-900">
            Analytics <span className="text-[#4F23D6]">Dashboard</span>
          </h1>
          <p className="text-gray-500 text-sm mt-1 font-medium">
            Auction metrics, ad spend, and impressions for the last {period} days.
          </p>
        </div>

        <div className="flex items-center space-x-3 w-full sm:w-auto justify-end">
          {/* Period selector */}
          <div className="flex border-2 border-gray-900 bg-white">
            {[
              { label: '7D', value: '7' },
              { label: '14D', value: '14' },
              { label: '30D', value: '30' },
              { label: '90D', value: '90' },
            ].map(p => (
              <button
                key={p.value}
                onClick={() => setPeriod(p.value)}
                className={`px-3 py-1.5 text-xs font-black uppercase tracking-wider transition-colors ${
                  period === p.value 
                    ? 'bg-[#4F23D6] text-white' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <Link 
            href="/campaigns/new" 
            className="bg-[#4F23D6] hover:bg-[#3815a8] text-white px-5 py-2.5 font-black text-xs uppercase tracking-wider flex items-center space-x-1.5 shadow-[3px_3px_0px_0px_#E1FF00] hover:shadow-[5px_5px_0px_0px_#E1FF00] hover:-translate-y-0.5 active:translate-y-0 transition-all shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Launch Ad</span>
          </Link>
        </div>
      </div>

      {loading && !stats ? (
        <div className="p-16 text-center text-sm font-bold text-[#4F23D6] animate-pulse">
          Loading analytics metrics...
        </div>
      ) : (
        <>
          {/* 5 High-Impact KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Total Spend */}
            <div className="bg-white border-2 border-gray-900 p-5 shadow-[4px_4px_0px_0px_#110C24] relative overflow-hidden group">
              <div className="flex items-center justify-between text-gray-500 mb-2">
                <span className="text-[10px] font-black uppercase tracking-wider">Total Ad Spend</span>
                <DollarSign className="w-4 h-4 text-[#4F23D6]" />
              </div>
              <p className="text-3xl font-black text-gray-900 tracking-tight">₹{spend.toFixed(2)}</p>
              <div className="mt-2 flex items-center justify-between text-[11px] text-gray-500 font-bold">
                <span>Active Bids</span>
                <span className="text-[#4F23D6] font-black">{activeCampaigns} Campaigns</span>
              </div>
            </div>

            {/* Impressions */}
            <div className="bg-white border-2 border-gray-900 p-5 shadow-[4px_4px_0px_0px_#110C24] relative overflow-hidden group">
              <div className="flex items-center justify-between text-gray-500 mb-2">
                <span className="text-[10px] font-black uppercase tracking-wider">Impressions</span>
                <Eye className="w-4 h-4 text-[#4F23D6]" />
              </div>
              <p className="text-3xl font-black text-gray-900 tracking-tight">{impressions.toLocaleString()}</p>
              <div className="mt-2 text-[11px] text-gray-500 font-bold">
                Search & Category placements
              </div>
            </div>

            {/* Clicks */}
            <div className="bg-white border-2 border-gray-900 p-5 shadow-[4px_4px_0px_0px_#110C24] relative overflow-hidden group">
              <div className="flex items-center justify-between text-gray-500 mb-2">
                <span className="text-[10px] font-black uppercase tracking-wider">Shopper Clicks</span>
                <MousePointerClick className="w-4 h-4 text-[#4F23D6]" />
              </div>
              <p className="text-3xl font-black text-gray-900 tracking-tight">{clicks.toLocaleString()}</p>
              <div className="mt-2 text-[11px] text-emerald-600 font-bold">
                High-intent visits to catalog
              </div>
            </div>

            {/* Avg CPC */}
            <div className="bg-white border-2 border-gray-900 p-5 shadow-[4px_4px_0px_0px_#110C24] relative overflow-hidden group">
              <div className="flex items-center justify-between text-gray-500 mb-2">
                <span className="text-[10px] font-black uppercase tracking-wider">Average CPC</span>
                <Target className="w-4 h-4 text-[#4F23D6]" />
              </div>
              <p className="text-3xl font-black text-gray-900 tracking-tight">₹{avgCpc.toFixed(2)}</p>
              <div className="mt-2 text-[11px] text-gray-500 font-bold">
                Second-price auction discount
              </div>
            </div>

            {/* CTR */}
            <div className="bg-[#110C24] text-white border-2 border-gray-900 p-5 shadow-[4px_4px_0px_0px_#E1FF00] relative overflow-hidden sm:col-span-2 lg:col-span-1">
              <div className="flex items-center justify-between text-purple-200 mb-2">
                <span className="text-[10px] font-black uppercase tracking-wider">Click-Through Rate</span>
                <Sparkles className="w-4 h-4 text-[#E1FF00]" />
              </div>
              <p className="text-3xl font-black text-[#E1FF00] tracking-tight">{ctr}%</p>
              <div className="mt-2 text-[11px] text-purple-200 font-bold">
                {Number(ctr) >= 1.5 ? '🔥 Above Industry Avg' : 'Target: > 1.5%'}
              </div>
            </div>
          </div>

          {/* Charts Row */}
          <DashboardCharts chartData={chartData} />

          {/* Quick Portfolio Table */}
          {campaigns.length > 0 && (
            <div className="bg-white border-2 border-gray-900 shadow-[6px_6px_0px_0px_#110C24] overflow-hidden">
              <div className="p-5 border-b border-gray-200 flex items-center justify-between bg-gray-50">
                <div className="flex items-center space-x-2">
                  <Megaphone className="w-4 h-4 text-[#4F23D6]" />
                  <h3 className="text-sm font-black text-gray-900 uppercase tracking-wide">
                    Active Campaign Snapshot
                  </h3>
                </div>
                <Link href="/campaigns" className="text-xs font-black uppercase text-[#4F23D6] hover:underline flex items-center space-x-1">
                  <span>View All Campaigns</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200 text-[10px] uppercase font-black tracking-wider text-gray-500 bg-gray-50">
                      <th className="p-4">Campaign Name</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Daily Budget</th>
                      <th className="p-4 text-right">Impressions</th>
                      <th className="p-4 text-right">Clicks</th>
                      <th className="p-4 text-right">CTR</th>
                      <th className="p-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-xs font-bold text-gray-800">
                    {campaigns.slice(0, 5).map((camp: any) => {
                      const cImpr = Number(camp._count?.impressions || camp.impressions || camp.total_impressions || 0);
                      const cClicks = Number(camp._count?.clicks || camp.clicks || camp.total_clicks || 0);
                      const cCtr = cImpr > 0 ? ((cClicks / cImpr) * 100).toFixed(2) : '0.00';

                      return (
                        <tr key={camp.id} className="hover:bg-gray-50 transition-colors">
                          <td className="p-4 font-black text-gray-900">
                            <Link href={`/campaigns/${camp.id}`} className="hover:text-[#4F23D6] transition-colors">
                              {camp.name}
                            </Link>
                          </td>
                          <td className="p-4">
                            <span className={`px-2 py-0.5 text-[10px] font-black uppercase border ${
                              camp.status === 'ACTIVE' 
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-500' 
                                : 'bg-gray-100 text-gray-600 border-gray-300'
                            }`}>
                              {camp.status}
                            </span>
                          </td>
                          <td className="p-4 text-right font-mono">
                            ₹{Number(camp.daily_budget || camp.dailyBudget || 0).toFixed(2)}/d
                          </td>
                          <td className="p-4 text-right font-mono">
                            {cImpr.toLocaleString()}
                          </td>
                          <td className="p-4 text-right font-mono">
                            {cClicks.toLocaleString()}
                          </td>
                          <td className="p-4 text-right font-mono text-[#4F23D6] font-black">
                            {cCtr}%
                          </td>
                          <td className="p-4 text-right">
                            <Link
                              href={`/campaigns/${camp.id}`}
                              className="text-[10px] font-black uppercase text-gray-900 hover:text-[#4F23D6] border border-gray-300 px-2.5 py-1 hover:border-black transition-colors"
                            >
                              Manage →
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* Top Up Modal triggerable from Dashboard */}
      <QuickTopUpModal
        isOpen={isTopUpOpen}
        onClose={() => setIsTopUpOpen(false)}
        onSuccess={fetchData}
      />
    </div>
  );
}
