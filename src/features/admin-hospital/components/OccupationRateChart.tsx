import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell } from 'recharts';
import { HeatMapData } from '../types/hospital';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

const MetricCard = ({ value, label, valueColor = 'text-primary' }: { value: string | number; label: string; valueColor?: string }) => (
  <div className="bg-muted/50 p-3 rounded-lg text-center">
    <div className={`text-2xl font-bold ${valueColor}`}>{value}</div>
    <div className="text-xs text-muted-foreground font-medium uppercase">{label}</div>
  </div>
);

interface OccupationRateChartProps {
  data: HeatMapData[];
  metrics?: {
    avgOccupation: number;
    maxOccupation: number;
    minOccupation: number;
    totalSectors: number;
    overcrowded: number;
    underutilized: number;
  } | null;
  title?: string;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const d = payload[0].payload;
    return (
      <div className="bg-background border p-3 rounded-lg shadow-lg text-sm">
        <p className="font-bold text-foreground mb-1">{label}</p>
        <p className="text-muted-foreground">Taxa de Ocupação: <span className="font-semibold text-primary">{d.value}%</span></p>
      </div>
    );
  }
  return null;
};

const getBarColor = (value: number) => {
  if (value >= 85) return 'hsl(var(--destructive))';
  if (value >= 70) return 'hsl(var(--warning))';
  return 'hsl(var(--success))';
};

export const OccupationRateChart: React.FC<OccupationRateChartProps> = ({ 
  data, 
  metrics,
  title = 'Análise da Taxa de Ocupação' 
}) => {
  const chartData = data.map(item => ({ name: item.sector, value: item.value }));
  const axisTick = { fontSize: 12, fill: 'hsl(var(--muted-foreground))' } as const;

  return (
    <Card className="col-span-1 lg:col-span-2">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>Visão geral da taxa de ocupação dos leitos por setor.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {metrics && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            <MetricCard value={`${metrics.avgOccupation}%`} label="Média" />
            <MetricCard value={`${metrics.maxOccupation}%`} label="Máxima" valueColor="text-destructive" />
            <MetricCard value={`${metrics.minOccupation}%`} label="Mínima" valueColor="text-success" />
            <MetricCard value={metrics.totalSectors} label="Setores" />
            <MetricCard value={metrics.overcrowded} label="Acima de 85%" />
            <MetricCard value={metrics.underutilized} label="Abaixo de 70%" />
          </div>
        )}
        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 8, right: 20, left: 0, bottom: 56 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} interval={0} tick={axisTick} />
              <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} tick={axisTick} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted) / 0.3)' }} />
              <ReferenceLine y={85} label={{ value: 'Crítico', position: 'insideTopLeft', fill: 'hsl(var(--destructive))', fontSize: 12 }} stroke="hsl(var(--destructive))" strokeDasharray="4 4" strokeWidth={2} />
              <ReferenceLine y={70} label={{ value: 'Atenção', position: 'insideTopLeft', fill: 'hsl(var(--warning))', fontSize: 12 }} stroke="hsl(var(--warning))" strokeDasharray="4 4" />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {chartData.map((e, i) => (
                  <Cell key={i} fill={getBarColor(e.value)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
