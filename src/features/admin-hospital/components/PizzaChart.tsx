import React from 'react';
import styled from 'styled-components';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { ChartData } from '../types/hospital';

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

interface PizzaChartProps {
  data: ChartData[];
  title?: string;
}

type ViewMode = 'both' | 'pie' | 'bar';

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    return (
      <TooltipContent>
        <TooltipLabel>{data.payload.name}</TooltipLabel>
        <TooltipValue>
          Valor: R$ {data.value.toLocaleString('pt-BR')}
        </TooltipValue>
        <TooltipValue>
          Percentual: {data.payload.percentage?.toFixed(2)}%
        </TooltipValue>
      </TooltipContent>
    );
  }
  return null;
};

export const PizzaChart: React.FC<PizzaChartProps> = ({ 
  data, 
  title = 'Distribuição de Custos por Setor' 
}) => {
  const [viewMode, setViewMode] = React.useState<ViewMode>('both');

  const renderPieChart = () => (
    <SingleChartContainer>
      <ChartSubtitle>SCP (Distribuição por Setor)</ChartSubtitle>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            outerRadius={100}
            innerRadius={40}
            dataKey="value"
            strokeWidth={2}
            stroke="#ffffff"
          >
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={entry.color || '#4b5563'}
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            verticalAlign="bottom" 
            height={36}
            wrapperStyle={{
              paddingTop: '10px',
              fontSize: '12px',
              color: '#4b5563'
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </SingleChartContainer>
  );

  const renderBarChart = () => (
    <SingleChartContainer>
      <ChartSubtitle>Sítio Funcional (Custos por Setor)</ChartSubtitle>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} margin={{ top: 20, right: 30, left: 40, bottom: 60 }}>
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
            {data.map((entry, index) => (
              <Bar key={`bar-${index}`} fill={entry.color || '#4b5563'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </SingleChartContainer>
  );

  const renderBothCharts = () => (
    <ChartsGrid>
      {renderPieChart()}
      {renderBarChart()}
    </ChartsGrid>
  );

  return (
    <ChartContainer>
      <ChartTitle>{title}</ChartTitle>
      
      <ViewToggle>
        <ToggleButton 
          active={viewMode === 'both'} 
          onClick={() => setViewMode('both')}
        >
          SCP + Sítio Funcional
        </ToggleButton>
        <ToggleButton 
          active={viewMode === 'pie'} 
          onClick={() => setViewMode('pie')}
        >
          Apenas SCP
        </ToggleButton>
        <ToggleButton 
          active={viewMode === 'bar'} 
          onClick={() => setViewMode('bar')}
        >
          Apenas Sítio Funcional
        </ToggleButton>
      </ViewToggle>

      {viewMode === 'both' && renderBothCharts()}
      {viewMode === 'pie' && renderPieChart()}
      {viewMode === 'bar' && renderBarChart()}
    </ChartContainer>
  );
};