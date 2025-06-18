import { AreaChart, Area, ResponsiveContainer, BarChart, Bar } from 'recharts';

export interface ChartData {
  name: string;
  value: number;
}

interface MiniAreaChartProps {
  data: ChartData[];
  color: string;
}

interface MiniBarChartProps {
  data: ChartData[];
  color: string;
}

export function MiniAreaChart({ data, color }: MiniAreaChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data}>
        <defs>
          <linearGradient id={`gradient-${color}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.3}/>
            <stop offset="95%" stopColor={color} stopOpacity={0}/>
          </linearGradient>
        </defs>
        <Area 
          type="monotone" 
          dataKey="value" 
          stroke={color} 
          strokeWidth={2}
          fill={`url(#gradient-${color})`}
          dot={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function MiniBarChart({ data, color }: MiniBarChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data}>
        <Bar 
          dataKey="value" 
          fill={color} 
          radius={[2, 2, 0, 0]}
          opacity={0.7}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}