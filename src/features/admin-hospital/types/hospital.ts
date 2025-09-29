export interface ChartData {
  name: string;
  value: number;
  percentage?: number;
  color?: string;
}

export interface HeatMapData {
  hospital: string;
  sector: string;
  value: number;
  status: 'high' | 'medium' | 'low';
}

export interface WaterfallData {
  name: string;
  value: number;
  cumulative: number;
  type: 'total' | 'positive' | 'negative' | 'sector';
}