/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
} from "recharts";

interface ParetoChartData {
  nome: string;
  custo: number;
  acumulado: number;
  acumuladoPercent: number;
  ativo?: boolean;
}

interface ParetoChartProps {
  data: ParetoChartData[];
  total: number;
}

const ParetoChart: React.FC<ParetoChartProps> = ({ data, total }) => {
  // Formata os dados para o gráfico
  const chartData = data.map((item, index) => ({
    ...item,
    custoFormatted: item.custo / 1000, // Converte para milhares
    index: index + 1,
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-card border border-border rounded-lg shadow-lg p-3">
          <h4 className="font-semibold text-sm mb-2">{data.nome}</h4>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Custo:</span>
              <span className="font-medium">
                R$ {data.custoFormatted.toFixed(0)}k
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">% do Total:</span>
              <span className="font-medium">
                {((data.custo / total) * 100).toFixed(1)}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Acumulado:</span>
              <span className="font-medium">
                {data.acumuladoPercent.toFixed(1)}%
              </span>
            </div>
            {data.ativo !== undefined && (
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Status:</span>
                <span
                  className={`font-medium ${
                    data.ativo ? "text-success" : "text-muted-foreground"
                  }`}
                >
                  {data.ativo ? "Ativo" : "Inativo"}
                </span>
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  const CustomLegend = ({ payload }: any) => (
    <div className="flex justify-center items-center space-x-6 mt-4">
      {payload?.map((entry: any, index: number) => (
        <div key={index} className="flex items-center space-x-2">
          <div
            className="w-3 h-3 rounded"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-sm text-muted-foreground">{entry.value}</span>
        </div>
      ))}
    </div>
  );

  return (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart
        data={chartData}
        margin={{
          top: 20,
          right: 30,
          left: 20,
          bottom: 60,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis
          dataKey="nome"
          angle={-45}
          textAnchor="end"
          height={80}
          interval={0}
          tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
        />
        <YAxis
          yAxisId="custo"
          orientation="left"
          tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
          label={{
            value: "Custo (R$ mil)",
            angle: -90,
            position: "insideLeft",
            style: {
              textAnchor: "middle",
              fill: "hsl(var(--muted-foreground))",
              fontSize: 12,
            },
          }}
        />
        <YAxis
          yAxisId="percent"
          orientation="right"
          domain={[0, 100]}
          tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
          label={{
            value: "Acumulado (%)",
            angle: 90,
            position: "insideRight",
            style: {
              textAnchor: "middle",
              fill: "hsl(var(--muted-foreground))",
              fontSize: 12,
            },
          }}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend content={<CustomLegend />} />

        {/* Barras de custo */}
        <Bar
          yAxisId="custo"
          dataKey="custoFormatted"
          name="Custo (R$ mil)"
          fill="#2563eb"
          radius={[4, 4, 0, 0]}
        />

        {/* Linha de Pareto (acumulado) */}
        <Line
          yAxisId="percent"
          type="monotone"
          dataKey="acumuladoPercent"
          name="Acumulado (%)"
          stroke="#ea580c"
          strokeWidth={3}
          dot={{ fill: "#ea580c", strokeWidth: 2, r: 4 }}
          activeDot={{ r: 6, stroke: "#ea580c", strokeWidth: 2 }}
        />

        {/* Linha de referência 80% */}
        <Line
          yAxisId="percent"
          type="monotone"
          dataKey={() => 80}
          name="80% (Pareto)"
          stroke="#dc2626"
          strokeWidth={2}
          strokeDasharray="5 5"
          dot={false}
          activeDot={false}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
};

export default ParetoChart;
