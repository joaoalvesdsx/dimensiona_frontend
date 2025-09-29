import React from 'react';
import styled from 'styled-components';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ZAxis } from 'recharts';
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

const HeatMapGrid = styled.div`
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
`;

const HeatMapCell = styled.div<{ status: string }>`
  padding: 16px;
  border-radius: 8px;
  text-align: center;
  transition: all 0.3s ease;
  cursor: pointer;
  
  ${({ status }) => {
    switch (status) {
      case 'high':
        return `
          background: linear-gradient(135deg, #ef4444, #dc2626);
          color: white;
        `;
      case 'medium':
        return `
          background: linear-gradient(135deg, #f59e0b, #d97706);
          color: white;
        `;
      case 'low':
        return `
          background: linear-gradient(135deg, #10b981, #059669);
          color: white;
        `;
      default:
        return `
          background: #f3f4f6;
          color: #4b5563;
        `;
    }
  }}

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 12px -2px rgba(0, 0, 0, 0.1);
  }
`;

const CellTitle = styled.h4`
  font-size: 0.9rem;
  font-weight: 600;
  margin-bottom: 8px;
`;

const CellSubtitle = styled.p`
  font-size: 0.8rem;
  opacity: 0.9;
  margin-bottom: 4px;
`;

const CellValue = styled.p`
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0;
`;

const Legend = styled.div`
  display: flex;
  justify-content: center;
  gap: 24px;
  margin-top: 20px;
`;

const LegendItem = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const LegendColor = styled.div<{ status: string }>`
  width: 16px;
  height: 16px;
  border-radius: 4px;
  
  ${({ status }) => {
    switch (status) {
      case 'high':
        return 'background: #ef4444;';
      case 'medium':
        return 'background: #f59e0b;';
      case 'low':
        return 'background: #10b981;';
      default:
        return 'background: #f3f4f6;';
    }
  }}
`;

const LegendLabel = styled.span`
  font-size: 0.9rem;
  color: #4b5563;
`;

const ScatterTooltipContent = styled.div`
  background: white;
  padding: 12px;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
`;

const ScatterTooltipLabel = styled.p`
  color: #374151;
  font-weight: 600;
  margin-bottom: 4px;
`;

const ScatterTooltipValue = styled.p`
  color: #6b7280;
  margin: 2px 0;
`;

interface HeatScaleChartProps {
  data: HeatMapData[];
  title?: string;
}

type ViewMode = 'both' | 'grid' | 'scatter';

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'high':
      return 'Alta (≥80%)';
    case 'medium':
      return 'Média (60-79%)';
    case 'low':
      return 'Baixa (<60%)';
    default:
      return 'N/A';
  }
};

const getStatusColor = (status: string) => {
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

const CustomScatterTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <ScatterTooltipContent>
        <ScatterTooltipLabel>{data.sector}</ScatterTooltipLabel>
        <ScatterTooltipValue>Hospital: {data.hospital}</ScatterTooltipValue>
        <ScatterTooltipValue>Taxa de Ocupação: {data.value}%</ScatterTooltipValue>
        <ScatterTooltipValue>
          Status: {data.status === 'high' ? 'Alto' : 
                   data.status === 'medium' ? 'Médio' : 'Baixo'}
        </ScatterTooltipValue>
      </ScatterTooltipContent>
    );
  }
  return null;
};

export const HeatScaleChart: React.FC<HeatScaleChartProps> = ({ 
  data, 
  title = 'Mapa de Calor - Taxa de Ocupação' 
}) => {
  const [viewMode, setViewMode] = React.useState<ViewMode>('both');

  // Prepara dados para o scatter plot
  const scatterData = data.map((item, index) => ({
    x: index + 1,
    y: item.value,
    z: item.value,
    sector: item.sector,
    hospital: item.hospital,
    status: item.status,
    fill: getStatusColor(item.status)
  }));

  const renderGridView = () => (
    <SingleChartContainer>
      <ChartSubtitle>Heat Map Grid - Diverging Scale</ChartSubtitle>
      <HeatMapGrid>
        {data.map((item, index) => (
          <HeatMapCell key={index} status={item.status}>
            <CellTitle>{item.sector}</CellTitle>
            <CellSubtitle>{item.hospital}</CellSubtitle>
            <CellValue>{item.value}%</CellValue>
          </HeatMapCell>
        ))}
      </HeatMapGrid>
    </SingleChartContainer>
  );

  const renderScatterView = () => (
    <SingleChartContainer>
      <ChartSubtitle>Scatter Plot - Taxa de Ocupação</ChartSubtitle>
      <ResponsiveContainer width="100%" height={300}>
        <ScatterChart margin={{ top: 20, right: 30, left: 40, bottom: 60 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
          <XAxis 
            type="number" 
            dataKey="x"
            name="Setor"
            tick={{ fontSize: 11, fill: '#6b7280' }}
            domain={[0, data.length + 1]}
          />
          <YAxis 
            type="number" 
            dataKey="y"
            name="Taxa"
            tick={{ fontSize: 11, fill: '#6b7280' }}
            tickFormatter={(value) => `${value}%`}
            domain={[0, 100]}
          />
          <ZAxis type="number" dataKey="z" range={[50, 200]} />
          <Tooltip content={<CustomScatterTooltip />} />
          <Scatter 
            data={scatterData} 
            fill="#4b5563"
          >
            {scatterData.map((entry, index) => (
              <Scatter key={`scatter-${index}`} fill={entry.fill} />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
    </SingleChartContainer>
  );

  const renderBothViews = () => (
    <ChartsGrid>
      {renderGridView()}
      {renderScatterView()}
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
          Grid + Scatter
        </ToggleButton>
        <ToggleButton 
          active={viewMode === 'grid'} 
          onClick={() => setViewMode('grid')}
        >
          Heat Map Grid
        </ToggleButton>
        <ToggleButton 
          active={viewMode === 'scatter'} 
          onClick={() => setViewMode('scatter')}
        >
          Scatter Plot
        </ToggleButton>
      </ViewToggle>

      {viewMode === 'both' && renderBothViews()}
      {viewMode === 'grid' && renderGridView()}
      {viewMode === 'scatter' && renderScatterView()}
      
      <Legend>
        <LegendItem>
          <LegendColor status="low" />
          <LegendLabel>Baixa Ocupação</LegendLabel>
        </LegendItem>
        <LegendItem>
          <LegendColor status="medium" />
          <LegendLabel>Ocupação Média</LegendLabel>
        </LegendItem>
        <LegendItem>
          <LegendColor status="high" />
          <LegendLabel>Alta Ocupação</LegendLabel>
        </LegendItem>
      </Legend>
    </ChartContainer>
  );
};