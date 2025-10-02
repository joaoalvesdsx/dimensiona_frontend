import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { ChartData } from '../types/hospital';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface PizzaChartProps {
  data: ChartData[];
  title?: string;
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const d = payload[0]?.payload;
    return (
      <div className="bg-background border p-3 rounded-lg shadow-lg text-sm">
        <p className="font-bold text-foreground">{d.name}</p>
        <p className="text-muted-foreground">Leitos: <span className="font-semibold">{d.value}</span></p>
      </div>
    );
  }
  return null;
};

export const PizzaChart: React.FC<PizzaChartProps> = ({ data, title = 'Distribuição de Leitos' }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="w-full h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Tooltip content={<CustomTooltip />} />
              <Legend iconType="circle" iconSize={8} verticalAlign="bottom" wrapperStyle={{ fontSize: '12px' }} />
              <Pie data={data} cx="50%" cy="50%" outerRadius={110} innerRadius={70} dataKey="value" strokeWidth={3} stroke="hsl(var(--background))" paddingAngle={3}>
                {data.map((entry) => (
                  <Cell key={`cell-${entry.name}`} fill={entry.color || 'hsl(var(--primary))'} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
