import React from 'react';
import styled from 'styled-components';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, LineChart, Line, Area, AreaChart } from 'recharts';
import { HeatMapData } from '../types/hospital';

const ChartContainer = styled.div`
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;

  &:hover {
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  }
`;

const ChartTitle = styled.h3`
  color: #4b5563;
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 20px;
  text-align: center;
`;

const ViewToggle = styled.div`
  display: flex;
  background: #f3f4f6;
  border-radius: 8px;
  padding: 4px;
  margin-bottom: 20px;
  justify-content: center;
`;

const ToggleButton = styled.button<{ active: boolean }>`
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  
  ${({ active }) => active 
    ? `
      background: #4b5563;
      color: white;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    `
    : `
      background: transparent;
      color: #6b7280;
      
      &:hover {
        color: #4b5563;
        background: rgba(75, 85, 99, 0.05);
      }
    `
  }
`;

const ChartsGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  
  @media (max-width: 1200px) {
    grid-template-columns: 1fr;
  }
`;

const SingleChartContainer = styled.div`
  min-height: 350px;
`;

const ChartSubtitle = styled.h4`
  color: #6b7280;
  font-size: 1rem;
  font-weight: 500;
  margin-bottom: 16px;
  text-align: center;
`;

const MetricsContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
`;

const MetricCard = styled.div`
  background: linear-gradient(135deg, #f8fafc, #f1f5f9);
  padding: 16px;
  border-radius: 8px;
  text-align: center;
  border: 1px solid #e2e8f0;
`;

const MetricValue = styled.div`
  font-size: 1.5rem;
  font-weight: 700;
  color: #4b5563;
  margin-bottom: 4px;
`;

const MetricLabel = styled.div`
  font-size: 0.8rem;
  color: #64748b;
  font-weight: 500;
`;

const TooltipContent = styled.div`
  background: white;
  padding: 12px;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
`;

const TooltipLabel = styled.p`
  color: #374151;
  font-weight: 600;
  margin-bottom: 4px;
`;

const TooltipValue = styled.p`
  color: #6b7280;
  margin: 0;
`;

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

type ViewMode = 'both' | 'bar' | 'trend';

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    return (
      <TooltipContent>
        <TooltipLabel>{label}</TooltipLabel>
        <TooltipValue>Taxa de Ocupação: {data.value}%</TooltipValue>
        <TooltipValue>
          Status: {data.payload.status === 'high' ? 'Alto' : 
                   data.payload.status === 'medium' ? 'Médio' : 'Baixo'}
        </TooltipValue>
      </TooltipContent>
    );
  }
  return null;
};

const getBarColor = (status: string) => {
  switch (status) {
    case 'high':
      return '#ef4444';
    case 'medium':
      return '#f59e0b';
    case 'low':
      return '#10b981';
    default:
      return '#6b7280';
  }
};

export const OccupationRateChart: React.FC<OccupationRateChartProps> = ({ 
  data, 
  metrics,
  title = 'Análise da Taxa de Ocupação' 
}) => {
  const [viewMode, setViewMode] = React.useState<ViewMode>('both');

  const chartData = data.map(item => ({
    name: `${item.sector}`,
    value: item.value,
    status: item.status,
    hospital: item.hospital
  }));

  const renderBarChart = () => (
    <SingleChartContainer>
      <ChartSubtitle>Taxa de Ocupação por Setor</ChartSubtitle>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
          <XAxis 
            dataKey="name" 
            angle={-45}
            textAnchor="end"
            height={80}
            interval={0}
            tick={{ fontSize: 12, fill: '#6b7280' }}
          />
          <YAxis 
            tick={{ fontSize: 12, fill: '#6b7280' }}
            domain={[0, 100]}
            tickFormatter={(value) => `${value}%`}
          />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine y={80} stroke="#ef4444" strokeDasharray="5 5" label="Meta Alta" />
          <ReferenceLine y={60} stroke="#f59e0b" strokeDasharray="5 5" label="Meta Média" />
          <Bar 
            dataKey="value" 
            radius={[4, 4, 0, 0]}
            fill="#4b5563"
          >
            {chartData.map((entry, index) => (
              <Bar key={`bar-${index}`} fill={getBarColor(entry.status)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </SingleChartContainer>
  );

  const renderTrendChart = () => (
    <SingleChartContainer>
      <ChartSubtitle>Tendência de Ocupação</ChartSubtitle>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
          <XAxis 
            dataKey="name" 
            angle={-45}
            textAnchor="end"
            height={80}
            interval={0}
            tick={{ fontSize: 12, fill: '#6b7280' }}
          />
          <YAxis 
            tick={{ fontSize: 12, fill: '#6b7280' }}
            domain={[0, 100]}
            tickFormatter={(value) => `${value}%`}
          />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine y={80} stroke="#ef4444" strokeDasharray="5 5" label="Meta Alta" />
          <ReferenceLine y={60} stroke="#f59e0b" strokeDasharray="5 5" label="Meta Média" />
          <Area
            type="monotone"
            dataKey="value" 
            stroke="#4b5563"
            fill="#4b5563"
            fillOpacity={0.3}
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </SingleChartContainer>
  );

  const renderBothCharts = () => (
    <ChartsGrid>
      {renderBarChart()}
      {renderTrendChart()}
    </ChartsGrid>
  );

  return (
    <ChartContainer>
      <ChartTitle>{title}</ChartTitle>
      
      {metrics && (
        <MetricsContainer>
          <MetricCard>
            <MetricValue>{metrics.avgOccupation}%</MetricValue>
            <MetricLabel>Média</MetricLabel>
          </MetricCard>
          <MetricCard>
            <MetricValue>{metrics.maxOccupation}%</MetricValue>
            <MetricLabel>Máxima</MetricLabel>
          </MetricCard>
          <MetricCard>
            <MetricValue>{metrics.minOccupation}%</MetricValue>
            <MetricLabel>Mínima</MetricLabel>
          </MetricCard>
          <MetricCard>
            <MetricValue>{metrics.totalSectors}</MetricValue>
            <MetricLabel>Setores</MetricLabel>
          </MetricCard>
          <MetricCard>
            <MetricValue>{metrics.overcrowded}</MetricValue>
            <MetricLabel>Superlotados</MetricLabel>
          </MetricCard>
          <MetricCard>
            <MetricValue>{metrics.underutilized}</MetricValue>
            <MetricLabel>Subutilizados</MetricLabel>
          </MetricCard>
        </MetricsContainer>
      )}

      <ViewToggle>
        <ToggleButton 
          active={viewMode === 'both'} 
          onClick={() => setViewMode('both')}
        >
          Barras + Tendência
        </ToggleButton>
        <ToggleButton 
          active={viewMode === 'bar'} 
          onClick={() => setViewMode('bar')}
        >
          Gráfico de Barras
        </ToggleButton>
        <ToggleButton 
          active={viewMode === 'trend'} 
          onClick={() => setViewMode('trend')}
        >
          Gráfico de Tendência
        </ToggleButton>
      </ViewToggle>

      {viewMode === 'both' && renderBothCharts()}
      {viewMode === 'bar' && renderBarChart()}
      {viewMode === 'trend' && renderTrendChart()}
    </ChartContainer>
  );
};