'use client';

import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar 
} from 'recharts';

interface ChartProps {
  data: any[];
  type: 'line' | 'bar';
  dataKey1: string;
  dataKey2?: string;
  color1?: string;
  color2?: string;
}

export default function AnalyticsChart({ 
  data, type, dataKey1, dataKey2, color1 = '#EAB308', color2 = '#3B82F6' 
}: ChartProps) {
  
  if (!data || data.length === 0) {
    return <div className="h-64 flex items-center justify-center text-gray-400 bg-gray-50 rounded-lg border border-dashed border-gray-200">No data available</div>;
  }

  const ChartComponent = type === 'line' ? LineChart : BarChart;
  const DataComponent = type === 'line' ? Line : Bar;

  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        {/* @ts-ignore */}
        <ChartComponent data={data} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
          <XAxis 
            dataKey="date" 
            tickFormatter={(val) => {
              const d = new Date(val);
              return `${d.getDate()} ${d.toLocaleString('default', { month: 'short' })}`;
            }}
            stroke="#9CA3AF"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} />
          <Tooltip 
            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            labelFormatter={(label) => new Date(label).toLocaleDateString()}
          />
          <Legend wrapperStyle={{ paddingTop: '20px' }} iconType="circle" />
          
          {/* @ts-ignore */}
          <DataComponent 
            type="monotone" 
            dataKey={dataKey1} 
            stroke={color1} 
            fill={color1} 
            strokeWidth={3} 
            activeDot={{ r: 6 }} 
            radius={[4, 4, 0, 0]} 
          />
          
          {dataKey2 && (
            /* @ts-ignore */
            <DataComponent 
              type="monotone" 
              dataKey={dataKey2} 
              stroke={color2} 
              fill={color2} 
              strokeWidth={3} 
              activeDot={{ r: 6 }}
              radius={[4, 4, 0, 0]}
            />
          )}
        </ChartComponent>
      </ResponsiveContainer>
    </div>
  );
}
