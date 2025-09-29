import React, { useState } from 'react';
import styled from 'styled-components';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ComposedChart, Line } from 'recharts';
import { WaterfallData } from '../types/hospital';

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

const ChartHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`;

const ChartTitle = styled.h3`
  color: #4b5563;
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0;
`;

const ViewToggle = styled.div`
  display: flex;
  background: #f3f4f6;
  border-radius: 8px;
  padding: 4px;
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
  margin: 2px 0;
`;

const MetricsContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 12px;
  margin-bottom: 20px;
  padding: 16px;
  background: linear-gradient(135deg, #f8fafc, #f1f5f9);
  border-radius: 8px;
`;

const MetricCard = styled.div`
  text-align: center;
`;

const MetricValue = styled.div`
  font-size: 1.2rem;
  font-weight: 700;
  color: #4b5563;
  margin-bottom: 4px;
`;

const MetricLabel = styled.div`
  font-size: 0.75rem;
  color: #64748b;
  font-weight: 500;
`;

interface WaterfallChartProps {
  data: WaterfallData[];
  title?: string;
}

type ViewMode = 'dual' | 'global' | 'sector';

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    return (
      <TooltipContent>
        <TooltipLabel>{label}</TooltipLabel>
        <TooltipValue>
          Valor: R$ {data.value.toLocaleString('pt-BR')}
        </TooltipValue>
        <TooltipValue>
          Acumulado: R$ {data.payload.cumulative.toLocaleString('pt-BR')}
        </TooltipValue>
      </TooltipContent>
    );
  }
  return null;
};

const getBarColor = (type: string) => {
  switch (type) {
    case 'total':
      return '#1e40af';
    case 'negative':
      return '#dc2626';
    default:
      return '#3b82f6';
  }
};

export const WaterfallChart: React.FC<WaterfallChartProps> = ({ 
  data, 
  title = 'Waterfall - Quantitativo' 
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('dual');

  // Dados para o gráfico global (econômico-financeiro)
  const globalData = data.filter(item => item.type !== 'sector');
  
  // Dados para comparação global vs setor
  const sectorComparisonData = data.map(item => ({
    ...item,
    globalValue: item.type === 'total' ? item.value : item.value * 0.85, // Simula valor global
    sectorValue: item.value
  }));

  const totalValue = data.find(item => item.type === 'total')?.value || 0;
  const avgSectorValue = data.filter(item => item.type === 'positive').reduce((sum, item) => sum + item.value, 0) / data.filter(item => item.type === 'positive').length;
  const maxSectorValue = Math.max(...data.filter(item => item.type === 'positive').map(item => item.value));

  const renderGlobalChart = () => (
    <SingleChartContainer>
      <ChartSubtitle>Econômico-Financeiro (Global)</ChartSubtitle>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={globalData} margin={{ top: 20, right: 30, left: 40, bottom: 60 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
          <XAxis 
            dataKey="name" 
            angle={-45}
            textAnchor="end"
            height={80}
            interval={0}
            tick={{ fontSize: 11, fill: '#6b7280' }}
          />
          <YAxis 
            tick={{ fontSize: 11, fill: '#6b7280' }}
            tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar 
            dataKey="value" 
            radius={[4, 4, 0, 0]}
          >
            {globalData.map((entry, index) => (
              <Bar key={`bar-${index}`} fill={getBarColor(entry.type)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </SingleChartContainer>
  );

  const renderSectorComparisonChart = () => (
    <SingleChartContainer>
      <ChartSubtitle>Global vs Setor (Unidade de Internação)</ChartSubtitle>
      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart data={sectorComparisonData} margin={{ top: 20, right: 30, left: 40, bottom: 60 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
          <XAxis 
            dataKey="name" 
            angle={-45}
            textAnchor="end"
            height={80}
            interval={0}
            tick={{ fontSize: 11, fill: '#6b7280' }}
          />
          <YAxis 
            tick={{ fontSize: 11, fill: '#6b7280' }}
            tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar 
            dataKey="globalValue" 
            fill="#94a3b8"
            name="Global"
            radius={[2, 2, 0, 0]}
            opacity={0.7}
          />
          <Bar 
            dataKey="sectorValue" 
            name="Setor"
            radius={[4, 4, 0, 0]}
          >
            {sectorComparisonData.map((entry, index) => (
              <Bar key={`sector-bar-${index}`} fill={getBarColor(entry.type)} />
            ))}
          </Bar>
        </ComposedChart>
      </ResponsiveContainer>
    </SingleChartContainer>
  );

  const renderDualView = () => (
    <ChartsGrid>
      {renderGlobalChart()}
      {renderSectorComparisonChart()}
    </ChartsGrid>
  );

  const renderSingleView = () => (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart data={data} margin={{ top: 20, right: 30, left: 40, bottom: 60 }}>
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
          tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
        />
        <Tooltip content={<CustomTooltip />} />
        <Bar 
          dataKey="value" 
          radius={[4, 4, 0, 0]}
        >
          {data.map((entry, index) => (
            <Bar key={`bar-${index}`} fill={getBarColor(entry.type)} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );

  return (
    <ChartContainer>
      <ChartHeader>
        <ChartTitle>{title}</ChartTitle>
        <ViewToggle>
          <ToggleButton 
            active={viewMode === 'dual'} 
            onClick={() => setViewMode('dual')}
          >
            Visão Dupla
          </ToggleButton>
          <ToggleButton 
            active={viewMode === 'global'} 
            onClick={() => setViewMode('global')}
          >
            Global
          </ToggleButton>
          <ToggleButton 
            active={viewMode === 'sector'} 
            onClick={() => setViewMode('sector')}
          >
            Setores
          </ToggleButton>
        </ViewToggle>
      </ChartHeader>

      <MetricsContainer>
        <MetricCard>
          <MetricValue>R$ {(totalValue / 1000).toFixed(0)}k</MetricValue>
          <MetricLabel>Total Geral</MetricLabel>
        </MetricCard>
        <MetricCard>
          <MetricValue>R$ {(avgSectorValue / 1000).toFixed(0)}k</MetricValue>
          <MetricLabel>Média por Setor</MetricLabel>
        </MetricCard>
        <MetricCard>
          <MetricValue>R$ {(maxSectorValue / 1000).toFixed(0)}k</MetricValue>
          <MetricLabel>Maior Custo</MetricLabel>
        </MetricCard>
        <MetricCard>
          <MetricValue>{data.filter(item => item.type === 'positive').length}</MetricValue>
          <MetricLabel>Setores</MetricLabel>
        </MetricCard>
      </MetricsContainer>

      {viewMode === 'dual' && renderDualView()}
      {viewMode === 'global' && renderGlobalChart()}
      {viewMode === 'sector' && renderSingleView()}
    </ChartContainer>
  );
};