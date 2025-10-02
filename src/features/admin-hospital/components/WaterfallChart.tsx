import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ComposedChart, Cell } from 'recharts';
import { WaterfallData } from '../types/hospital';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

type ViewMode = 'dual' | 'global' | 'sector';

interface WaterfallChartProps {
  data: WaterfallData[];
  title?: string;
  subtitle?: string;
}

const axisTick = { fontSize: 12, fill: 'hsl(var(--muted-foreground))' } as const;

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  return (
    <div className="bg-background border border-border rounded-lg shadow-lg p-3 text-sm">
      <p className="font-bold text-foreground mb-1">{label}</p>
      <p className="text-muted-foreground">Valor: <span className="font-semibold">R$ {Number(d.value || 0).toLocaleString('pt-BR')}</span></p>
      {d.cumulative !== undefined && (
        <p className="text-muted-foreground">Acumulado: <span className="font-semibold">R$ {Number(d.cumulative || 0).toLocaleString('pt-BR')}</span></p>
      )}
    </div>
  );
};

const getBarColor = (type: string) => {
  switch (type) {
    case 'total':    return '#1e40af';
    case 'negative': return 'hsl(var(--destructive))';
    default:         return 'hsl(var(--primary))';
  }
};

export const WaterfallChart: React.FC<WaterfallChartProps> = ({
  data,
  title = 'Waterfall',
  subtitle,
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('dual');

  const totalValue = data.find((d) => d.type === 'total')?.value ?? 0;
  const items = data.filter((d) => d.type !== 'total');
  const avg = items.length ? items.reduce((s, i) => s + i.value, 0) / items.length : 0;
  const max = items.length ? Math.max(...items.map((i) => i.value)) : 0;

  const globalData = data.filter((item) => item.type !== 'sector');

  const sectorComparisonData = data.map((item) => ({
    ...item,
    globalValue: item.type === 'total' ? item.value : Math.round(item.value * 0.85),
    sectorValue: item.value,
  }));

  const renderGlobalChart = () => (
    <div className="min-h-[350px]">
      <h4 className="text-center text-sm font-medium text-muted-foreground mb-3">Visão Global</h4>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={globalData} margin={{ top: 8, right: 16, left: 8, bottom: 56 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} interval={0} tick={axisTick} />
          <YAxis tick={axisTick} tickFormatter={(v) => `R$ ${(v / 1000).toFixed(0)}k`} />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="value" radius={[6,6,0,0]}>
            {globalData.map((entry, idx) => <Cell key={idx} fill={getBarColor(entry.type)} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );

  const renderSectorComparisonChart = () => (
    <div className="min-h-[350px]">
      <h4 className="text-center text-sm font-medium text-muted-foreground mb-3">Global vs Contribuições</h4>
      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart data={sectorComparisonData} margin={{ top: 8, right: 16, left: 8, bottom: 56 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} interval={0} tick={axisTick} />
          <YAxis tick={axisTick} tickFormatter={(v) => `R$ ${(v / 1000).toFixed(0)}k`} />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="globalValue" name="Global" radius={[4,4,0,0]} fill="hsl(var(--muted-foreground))" opacity={0.85} />
          <Bar dataKey="sectorValue" name="Contribuição" radius={[6,6,0,0]}>
            {sectorComparisonData.map((entry, idx) => <Cell key={idx} fill={getBarColor(entry.type)} />)}
          </Bar>
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );

  const renderSingleView = () => (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart data={data} margin={{ top: 8, right: 16, left: 8, bottom: 56 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} interval={0} tick={axisTick} />
        <YAxis tick={axisTick} tickFormatter={(v) => `R$ ${(v / 1000).toFixed(0)}k`} />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey="value" radius={[6,6,0,0]}>
          {data.map((entry, idx) => <Cell key={idx} fill={getBarColor(entry.type)} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );

  return (
    <Card className="transition-shadow hover:shadow-lg">
      <CardHeader>
        <div className="flex items-center justify-between gap-4">
          <div>
            <CardTitle>{title}</CardTitle>
            {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
          </div>
          <div className="flex gap-1 bg-muted rounded-lg p-1">
            <Button size="sm" variant={viewMode === 'dual' ? 'default' : 'ghost'} onClick={() => setViewMode('dual')}>Visão Dupla</Button>
            <Button size="sm" variant={viewMode === 'global' ? 'default' : 'ghost'} onClick={() => setViewMode('global')}>Global</Button>
            <Button size="sm" variant={viewMode === 'sector' ? 'default' : 'ghost'} onClick={() => setViewMode('sector')}>Contribuições</Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 rounded-lg">
          <div className="text-center">
            <div className="text-xl font-bold text-foreground">R$ {(totalValue / 1000).toFixed(0)}k</div>
            <div className="text-[11px] text-muted-foreground font-medium uppercase">Total</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-foreground">R$ {(avg / 1000).toFixed(0)}k</div>
            <div className="text-[11px] text-muted-foreground font-medium uppercase">Média</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-foreground">R$ {(max / 1000).toFixed(0)}k</div>
            <div className="text-[11px] text-muted-foreground font-medium uppercase">Maior Contribuição</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-foreground">{Math.max(items.length, 0)}</div>
            <div className="text-[11px] text-muted-foreground font-medium uppercase">Itens</div>
          </div>
        </div>

        {viewMode === 'dual' && <div className="grid lg:grid-cols-2 gap-6">{renderGlobalChart()}{renderSectorComparisonChart()}</div>}
        {viewMode === 'global' && renderGlobalChart()}
        {viewMode === 'sector' && renderSingleView()}
      </CardContent>
    </Card>
  );
};
