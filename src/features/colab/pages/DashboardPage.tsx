import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import {
  getHospitalStats,
  getBaselinesByHospitalId,
  HospitalStats,
  Baseline,
} from "@/lib/api";
import { Download, DollarSign, BarChart, Users, Building } from "lucide-react";

// Importando os componentes de gráfico reais
import { OccupationRateChart } from "@/features/admin-hospital/components/OccupationRateChart";
import { PizzaChart } from "@/features/admin-hospital/components/PizzaChart";
import { HeatScaleChart } from "@/features/admin-hospital/components/HeatScaleChart";
import { WaterfallChart } from "@/features/admin-hospital/components/WaterfallChart";
import {
  ChartData,
  HeatMapData,
  WaterfallData,
} from "@/features/admin-hospital/types/hospital";

// --- Componente de Card para Métricas ---
const MetricCard = ({ title, value, icon: Icon }: any) => (
  <div className="bg-white p-4 rounded-lg border flex items-center gap-4">
    <div className="bg-primary/10 p-3 rounded-full">
      <Icon className="h-6 w-6 text-primary" />
    </div>
    <div>
      <p className="text-sm text-gray-500">{title}</p>
      <p className="text-2xl font-bold text-primary">{value}</p>
    </div>
  </div>
);

export default function HospitalDashboardPage() {
  const { hospitalId } = useParams<{ hospitalId: string }>();
  const [stats, setStats] = useState<HospitalStats | null>(null);
  const [baselines, setBaselines] = useState<Baseline[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!hospitalId) return;

    const fetchAllData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [statsData, baselinesData] = await Promise.all([
          getHospitalStats(hospitalId),
          getBaselinesByHospitalId(hospitalId),
        ]);
        setStats(statsData);
        setBaselines(baselinesData);
      } catch (err) {
        setError("Falha ao carregar os dados do dashboard.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAllData();
  }, [hospitalId]);

  if (loading) return <div>Carregando dashboard...</div>;
  if (error) return <div className="text-red-500 p-4">{error}</div>;
  if (!stats)
    return (
      <div>Não foram encontrados dados estatísticos para este hospital.</div>
    );

  // --- Preparação dos Dados para os Gráficos ---

  const pizzaData: ChartData[] = stats.unidades.map((u, index) => ({
    name: u.unidade.nome,
    value: u.totalLeitos, // Usando total de leitos como valor para o gráfico de pizza
    color: ["#0b6f88", "#003151", "#4a90e2", "#7bbfd3", "#d0e1e8"][index % 5],
  }));

  const heatMapData: HeatMapData[] = stats.unidades.map((u) => ({
    hospital: hospitalId || "N/A",
    sector: u.unidade.nome,
    value: Math.round(u.ocupacao.taxaOcupacao * 100),
    status:
      u.ocupacao.taxaOcupacao >= 0.8
        ? "high"
        : u.ocupacao.taxaOcupacao >= 0.6
        ? "medium"
        : "low",
  }));

  const waterfallData: WaterfallData[] = baselines.flatMap((b) =>
    b.setores.map((setor, index, arr) => ({
      name: setor.nome,
      value: parseFloat(setor.custo) || 0,
      cumulative: arr
        .slice(0, index + 1)
        .reduce((acc, s) => acc + (parseFloat(s.custo) || 0), 0),
      type: "sector" as const,
    }))
  );
  if (baselines.length > 0) {
    const totalCost = parseFloat(baselines[0].custo_total) || 0;
    waterfallData.unshift({
      name: "Custo Total Baseline",
      value: totalCost,
      cumulative: totalCost,
      type: "total",
    });
  }

  const occupationMetrics = {
    avgOccupation: Math.round(stats.taxaOcupacaoMedia * 100),
    maxOccupation: Math.max(...heatMapData.map((d) => d.value)),
    minOccupation: Math.min(...heatMapData.map((d) => d.value)),
    totalSectors: stats.unidades.length,
    overcrowded: heatMapData.filter((d) => d.status === "high").length,
    underutilized: heatMapData.filter((d) => d.status === "low").length,
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-primary">
            Dashboard do Hospital
          </h1>
          <p className="text-gray-500">Visão geral dos indicadores chave.</p>
        </div>
        {/* Funcionalidade de download pode ser adicionada aqui */}
      </div>

      {/* Cards de Métricas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Taxa de Ocupação Média"
          value={`${occupationMetrics.avgOccupation}%`}
          icon={BarChart}
        />
        <MetricCard
          title="Total de Leitos"
          value={stats.totalLeitos}
          icon={Building}
        />
        <MetricCard
          title="Custo Total (Baseline)"
          value={`R$ ${(
            parseFloat(baselines[0]?.custo_total) / 1000 || 0
          ).toFixed(1)}k`}
          icon={DollarSign}
        />
        <MetricCard
          title="Total de Colaboradores"
          value={baselines[0]?.quantidade_funcionarios || 0}
          icon={Users}
        />
      </div>

      <div className="space-y-6">
        <OccupationRateChart data={heatMapData} metrics={occupationMetrics} />

        {baselines.length > 0 && (
          <WaterfallChart
            data={waterfallData}
            title="Análise de Custos (Baseline)"
          />
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <PizzaChart
            data={pizzaData}
            title="Distribuição de Leitos por Unidade"
          />
          <HeatScaleChart data={heatMapData} title="Mapa de Calor - Ocupação" />
        </div>
      </div>
    </div>
  );
}
