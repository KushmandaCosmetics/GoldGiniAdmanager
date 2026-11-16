'use client';

import React from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  CartesianGrid, 
  Legend, 
  AreaChart, 
  Area 
} from 'recharts';
import { TrendingUp, DollarSign } from 'lucide-react';

interface DashboardChartsProps {
  chartData: any[];
}

export default function DashboardCharts({ chartData }: DashboardChartsProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Impressions & Clicks Bar Chart */}
      <div className="bg-white border-2 border-gray-900 p-6 shadow-[6px_6px_0px_0px_#110C24]">
        <div className="flex items-center justify-between mb-6 pb-3 border-b border-gray-100">
          <h3 className="text-sm font-black text-gray-900 uppercase tracking-wide flex items-center">
            <TrendingUp className="w-4 h-4 mr-2 text-[#4F23D6]" />
            Traffic Volume (Impressions vs Clicks)
          </h3>
        </div>
        <div className="h-72 w-full">
          {chartData && chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  stroke="#9ca3af" 
                  axisLine={false} 
                  tickLine={false} 
                  fontSize={11}
                  tickFormatter={(val) => {
                    const d = new Date(val);
                    return `${d.getDate()}/${d.getMonth() + 1}`;
                  }}
                />
                <YAxis stroke="#9ca3af" axisLine={false} tickLine={false} fontSize={11} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#110C24', 
                    borderColor: '#E1FF00', 
                    color: '#fff', 
                    borderWidth: '2px',
                    fontSize: '11px',
                    fontWeight: 'bold' 
                  }}
                  labelFormatter={(label: any) => new Date(label || 0).toLocaleDateString()}
                />
                <Legend />
                <Bar dataKey="impressions" fill="#4F23D6" name="Impressions" />
                <Bar dataKey="clicks" fill="#E1FF00" name="Clicks" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-gray-400 font-bold">
              No traffic recorded for this selected time window.
            </div>
          )}
        </div>
      </div>

      {/* Daily Spend Area Chart */}
      <div className="bg-white border-2 border-gray-900 p-6 shadow-[6px_6px_0px_0px_#110C24]">
        <div className="flex items-center justify-between mb-6 pb-3 border-b border-gray-100">
          <h3 className="text-sm font-black text-gray-900 uppercase tracking-wide flex items-center">
            <DollarSign className="w-4 h-4 mr-2 text-[#4F23D6]" />
            Daily Ad Budget Spend (₹)
          </h3>
        </div>
        <div className="h-72 w-full">
          {chartData && chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  stroke="#9ca3af" 
                  axisLine={false} 
                  tickLine={false}
                  fontSize={11}
                  tickFormatter={(val) => {
                    const d = new Date(val);
                    return `${d.getDate()}/${d.getMonth() + 1}`;
                  }}
                />
                <YAxis stroke="#9ca3af" axisLine={false} tickLine={false} fontSize={11} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#110C24', 
                    borderColor: '#4F23D6', 
                    color: '#fff', 
                    borderWidth: '2px',
                    fontSize: '11px',
                    fontWeight: 'bold' 
                  }}
                  labelFormatter={(label: any) => new Date(label || 0).toLocaleDateString()}
                  formatter={(value: any) => [`₹${Number(value).toFixed(2)}`, 'Spend']}
                />
                <defs>
                  <linearGradient id="spendGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4F23D6" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#4F23D6" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="spend" stroke="#4F23D6" fill="url(#spendGradient)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-gray-400 font-bold">
              No spend recorded for this selected time window.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
