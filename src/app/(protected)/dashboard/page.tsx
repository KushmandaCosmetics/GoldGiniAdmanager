'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, AreaChart, Area } from 'recharts';
import { MousePointerClick, Eye, TrendingUp, DollarSign, Activity, Megaphone, Target, ShoppingCart } from 'lucide-react';

export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('7');
  const [campaigns, setCampaigns] = useState<any[]>([]);

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

  if (loading) return <div className="p-8 text-[#4F23D6] font-bold">Loading Dashboard...</div>;
  if (!stats) return <div className="p-8 text-red-400">Failed to load analytics</div>;

  const avgCpc = stats.clicks > 0 ? (Number(stats.spend) / stats.clicks) : 0;
  const activeCampaigns = campaigns.filter(c => c.status === 'ACTIVE').length;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black uppercase tracking-tighter text-gray-900">Analytics <span className="text-[#4F23D6]">Overview</span></h1>
          <p className="text-gray-500 mt-2 font-medium">Performance for the last {period} days</p>
        </div>
        <div className="flex items-center space-x-3">
          {/* Period selector */}
          <div className="flex bg-gray-100 border border-gray-200">
            {[
              { label: '7D', value: '7' },
              { label: '14D', value: '14' },
              { label: '30D', value: '30' },
              { label: '90D', value: '90' },
            ].map(p => (
              <button
                key={p.value}
                onClick={() => setPeriod(p.value)}
                className={`px-4 py-2 text-sm font-bold uppercase tracking-wide transition-colors ${
                  period === p.value 
                    ? 'bg-[#4F23D6] text-white' 
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
          <Link 
            href="/campaigns/new" 
            className="bg-[#4F23D6] text-white px-6 py-3 font-bold uppercase tracking-wide hover:bg-gray-900 transition-colors shadow-[4px_4px_0px_0px_#E1FF00] hover:shadow-[6px_6px_0px_0px_#E1FF00] hover:-translate-y-0.5 active:translate-y-0 active:shadow-[2px_2px_0px_0px_#E1FF00]"
          >
            + New Campaign
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <div className="bg-white border border-gray-200 p-6 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <DollarSign className="w-16 h-16 text-[#4F23D6]" />
          </div>
          <p className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">Total Spend</p>
          <p className="text-3xl font-black text-gray-900 tracking-tighter">₹{Number(stats.spend).toFixed(2)}</p>
        </div>

        <div className="bg-white border border-gray-200 p-6 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Eye className="w-16 h-16 text-[#4F23D6]" />
          </div>
          <p className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">Impressions</p>
          <p className="text-3xl font-black text-gray-900 tracking-tighter">{stats.impressions.toLocaleString()}</p>
        </div>

        <div className="bg-white border border-gray-200 p-6 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <MousePointerClick className="w-16 h-16 text-[#4F23D6]" />
          </div>
          <p className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">Clicks</p>
          <p className="text-3xl font-black text-gray-900 tracking-tighter">{stats.clicks.toLocaleString()}</p>
        </div>

        <div className="bg-white border border-gray-200 p-6 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Target className="w-16 h-16 text-[#4F23D6]" />
          </div>
          <p className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">Avg. CPC</p>
          <p className="text-3xl font-black text-gray-900 tracking-tighter">₹{avgCpc.toFixed(2)}</p>
        </div>

        <div className="bg-gradient-to-br from-[#4F23D6] to-[#2c1280] p-6 relative overflow-hidden group shadow-[4px_4px_0px_0px_#E1FF00]">
          <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:opacity-30 transition-opacity">
            <Activity className="w-16 h-16 text-white" />
          </div>
          <p className="text-sm font-bold text-purple-200 uppercase tracking-wider mb-2">Avg. CTR</p>
          <p className="text-3xl font-black text-[#E1FF00] tracking-tighter">
            {stats.impressions > 0 
              ? ((stats.clicks / stats.impressions) * 100).toFixed(2) 
              : '0.00'}%
          </p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Impressions & Clicks Chart */}
        <div className="bg-white border border-gray-200 p-6 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 uppercase tracking-wide mb-6 flex items-center">
            <TrendingUp className="w-5 h-5 mr-2 text-[#4F23D6]" /> Traffic Trends
          </h3>
          <div className="h-72 w-full">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" vertical={false} />
                  <XAxis 
                    dataKey="date" 
                    stroke="#6b7280" 
                    axisLine={false} 
                    tickLine={false} 
                    fontSize={12}
                    tickFormatter={(val) => {
                      const d = new Date(val);
                      return `${d.getDate()}/${d.getMonth() + 1}`;
                    }}
                  />
                  <YAxis stroke="#6b7280" axisLine={false} tickLine={false} fontSize={12} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#fff', borderColor: '#e5e7eb', color: '#111827', borderRadius: '4px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                    labelFormatter={(label) => new Date(label).toLocaleDateString()}
                  />
                  <Legend />
                  <Bar dataKey="impressions" fill="#4F23D6" radius={[4, 4, 0, 0]} name="Impressions" />
                  <Bar dataKey="clicks" fill="#E1FF00" radius={[4, 4, 0, 0]} name="Clicks" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400 font-medium">
                No data for this period
              </div>
            )}
          </div>
        </div>

        {/* Spend Chart */}
        <div className="bg-white border border-gray-200 p-6 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 uppercase tracking-wide mb-6 flex items-center">
            <DollarSign className="w-5 h-5 mr-2 text-[#4F23D6]" /> Daily Spend (₹)
          </h3>
          <div className="h-72 w-full">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" vertical={false} />
                  <XAxis 
                    dataKey="date" 
                    stroke="#6b7280" 
                    axisLine={false} 
                    tickLine={false}
                    fontSize={12}
                    tickFormatter={(val) => {
                      const d = new Date(val);
                      return `${d.getDate()}/${d.getMonth() + 1}`;
                    }}
                  />
                  <YAxis stroke="#6b7280" axisLine={false} tickLine={false} fontSize={12} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#fff', borderColor: '#e5e7eb', color: '#111827', borderRadius: '4px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                    labelFormatter={(label) => new Date(label).toLocaleDateString()}
                    formatter={(value: any) => [`₹${Number(value).toFixed(2)}`, 'Spend']}
                  />
                  <defs>
                    <linearGradient id="spendGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4F23D6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#4F23D6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Area type="monotone" dataKey="spend" stroke="#4F23D6" fill="url(#spendGradient)" strokeWidth={3} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400 font-medium">
                No data for this period
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Top Campaigns Table */}
      {campaigns.length > 0 && (
        <div className="bg-white border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-900 uppercase tracking-wide flex items-center">
              <Megaphone className="w-5 h-5 mr-2 text-[#4F23D6]" /> Campaign Performance
            </h3>
            <Link href="/campaigns" className="text-sm text-[#4F23D6] font-bold uppercase hover:underline">
              View All →
            </Link>
          </div>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-200 text-xs uppercase tracking-wider text-gray-500">
                <th className="pb-3 font-bold">Campaign</th>
                <th className="pb-3 font-bold">Status</th>
                <th className="pb-3 font-bold text-right">Budget</th>
                <th className="pb-3 font-bold text-right">Spent</th>
                <th className="pb-3 font-bold text-right">Impressions</th>
                <th className="pb-3 font-bold text-right">Clicks</th>
                <th className="pb-3 font-bold text-right">CTR</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {campaigns.slice(0, 5).map((camp: any) => {
                const ctr = camp._count.impressions > 0 
                  ? ((camp._count.clicks / camp._count.impressions) * 100).toFixed(2)
                  : '0.00';
                return (
                  <tr key={camp.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3">
                      <Link href={`/campaigns/${camp.id}`} className="font-bold text-gray-900 hover:text-[#4F23D6] transition-colors">
                        {camp.name}
                      </Link>
                    </td>
                    <td className="py-3">
                      <span className={`px-2 py-1 text-xs font-bold uppercase tracking-wider ${
                        camp.status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
                        camp.status === 'PAUSED' ? 'bg-yellow-100 text-yellow-700' :
                        camp.status === 'BUDGET_EXHAUSTED' ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {camp.status}
                      </span>
                    </td>
                    <td className="py-3 text-right font-mono text-gray-600">₹{Number(camp.dailyBudget).toFixed(2)}/d</td>
                    <td className="py-3 text-right font-mono text-gray-600">₹{Number(camp.totalSpent).toFixed(2)}</td>
                    <td className="py-3 text-right text-gray-600">{camp._count.impressions.toLocaleString()}</td>
                    <td className="py-3 text-right text-gray-600">{camp._count.clicks.toLocaleString()}</td>
                    <td className="py-3 text-right font-mono text-[#4F23D6] font-bold">{ctr}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
