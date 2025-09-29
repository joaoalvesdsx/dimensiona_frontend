/* eslint-disable no-useless-escape */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  TrendingUp,
  DollarSign,
  BarChart3,
  Activity,
  Eye,
  EyeOff,
  List,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import ParetoChart from "./ParetoChart";
import { useToast } from "@/hooks/use-toast";
import CostAnalyticsPanel from "./CostAnalyticsPanel";

// Simulação de uma chamada de API - substitua pela sua implementação real
const hospitaisApi = {
  atualizarStatusBaseline: async (
    baselineId: string,
    setorNome: string,
    ativo: boolean
  ) => {
    console.log(
      `API CALL: update baseline ${baselineId}, setor ${setorNome} to ativo=${ativo}`
    );
    // Aqui você chamaria sua API real: await api.patch(...)
    return Promise.resolve();
  },
};

interface BaselineParetoProps {
  hospital: any;
  collapsed: boolean;
  onToggle: () => void;
}

interface SetorBaseline {
  nome: string;
  custo?: string;
  ativo?: boolean;
}

// Componente principal
export default function BaselinePareto({
  hospital,
  collapsed,
  onToggle,
}: BaselineParetoProps) {
  const baseline: any = hospital?.baseline;

  const { toast } = useToast();
  const [showAnalytics, setShowAnalytics] = useState(false);

  // Normaliza os dados dos setores vindos do backend
  const normalizeSetores = (raw: any): SetorBaseline[] => {
    if (!raw || !Array.isArray(raw)) return [];

    return raw.map((s: any) => {
      try {
        if (typeof s === "string") {
          const trimmed = s.trim();
          if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
            const parsed = JSON.parse(trimmed);
            return {
              nome: String(parsed.nome ?? ""),
              custo: String(parsed.custo ?? "0"),
              ativo: Boolean(parsed.ativo),
            };
          }
          return { nome: trimmed, custo: "0", ativo: false };
        }
        if (typeof s === "object" && s !== null) {
          return {
            nome: String(s.nome ?? ""),
            custo: String(s.custo ?? "0"),
            ativo: Boolean(s.ativo),
          };
        }
        return { nome: "", custo: "0", ativo: false };
      } catch {
        return {
          nome: String(s?.nome || ""),
          custo: String(s?.custo || "0"),
          ativo: Boolean(s?.ativo),
        };
      }
    });
  };

  const [setores, setSetores] = useState<SetorBaseline[]>(() =>
    normalizeSetores(baseline?.setores)
  );

  useEffect(() => {
    setSetores(normalizeSetores(baseline?.setores));
  }, [baseline?.setores]);

  const toggleAtivo = async (setorNome: string) => {
    const originalSetores = [...setores];
    const updatedSetores = setores.map((s) =>
      s.nome === setorNome ? { ...s, ativo: !s.ativo } : s
    );
    setSetores(updatedSetores);

    try {
      const setor = updatedSetores.find((s) => s.nome === setorNome);
      if (setor) {
        await hospitaisApi.atualizarStatusBaseline(
          baseline.id,
          setor.nome,
          setor.ativo ?? false
        );
      }
    } catch (err: any) {
      setSetores(originalSetores); // Rollback
      toast({
        title: "Erro",
        description: err?.message || "Falha ao atualizar status do setor",
        variant: "destructive",
      });
    }
  };

  const entries = setores
    .map((s: SetorBaseline) => {
      const cleaned = String(s.custo ?? "0")
        .replace(/[^\d,.-]/g, "")
        .replace(/\./g, "")
        .replace(",", ".");
      return {
        nome: String(s.nome || "-").trim(),
        custo: Number(cleaned) || 0,
        ativo: Boolean(s.ativo),
      };
    })
    .sort((a, b) => b.custo - a.custo);

  const total = entries.reduce((s, e) => s + e.custo, 0);

  let acc = 0;
  const chartData = entries.map((e) => {
    acc += e.custo;
    return {
      ...e,
      acumulado: acc,
      acumuladoPercent: total ? (acc / total) * 100 : 0,
    };
  });

  const selectedEntries = entries.filter((e) => e.ativo);
  const totalSelected = selectedEntries.reduce((s, e) => s + e.custo, 0);

  let accSel = 0;
  const chartDataSelected = selectedEntries.map((e) => {
    accSel += e.custo;
    return {
      ...e,
      acumulado: accSel,
      acumuladoPercent: totalSelected ? (accSel / totalSelected) * 100 : 0,
    };
  });
  const quantidadeFuncionarios =
    baseline?.quantidade_funcionarios ?? baseline?.quantidadeFuncionarios ?? 0;

  if (!baseline) {
    return (
      <div className="bg-white rounded-lg border">
        <div
          className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50"
          onClick={onToggle}
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-primary">
                Pareto - Baseline do Hospital
              </h2>
              <p className="text-sm text-gray-500">
                Análise de custos por setor
              </p>
            </div>
          </div>
          {collapsed ? (
            <ChevronRight className="h-5 w-5 text-gray-500" />
          ) : (
            <ChevronDown className="h-5 w-5 text-gray-500" />
          )}
        </div>
        {!collapsed && (
          <div className="text-center p-10 border-t">
            <BarChart3 className="h-10 w-10 text-gray-300 mx-auto mb-3" />
            <h3 className="text-md font-semibold text-gray-700">
              Nenhum baseline disponível
            </h3>
            <p className="text-sm text-gray-500">
              Os dados de baseline do hospital não foram encontrados.
            </p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg border">
        <div
          className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50"
          onClick={onToggle}
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-primary">
                Pareto - Baseline do Hospital
              </h2>
              <p className="text-sm text-gray-500">
                Análise de custos por setor com gráfico interativo
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!collapsed && (
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowAnalytics(!showAnalytics);
                }}
              >
                {showAnalytics ? (
                  <EyeOff className="h-4 w-4 mr-2" />
                ) : (
                  <Eye className="h-4 w-4 mr-2" />
                )}
                Analytics
              </Button>
            )}
            {collapsed ? (
              <ChevronRight className="h-5 w-5 text-gray-500" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-500" />
            )}
          </div>
        </div>

        {!collapsed && (
          <div className="p-4 md:p-6 border-t">
            <div className="grid grid-cols-1 md:grid-cols-5 lg:grid-cols-5 gap-6 mb-6">
              <StatCard
                title="Total de Setores"
                value={chartData.length}
                icon={<List />}
              />
              <StatCard
                title="Custo Total"
                value={total.toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                })}
                icon={<DollarSign />}
              />
              <StatCard
                title="Setor Mais Relevante"
                value={chartData[0]?.nome || "-"}
                icon={<TrendingUp />}
              />
              <StatCard
                title="Foco (80%)"
                value={`${
                  chartData.findIndex((d) => d.acumuladoPercent >= 80) + 1
                } setores`}
                icon={<Activity />}
              />
              <StatCard
                title="Qtd. Funcionários"
                value={String(quantidadeFuncionarios)}
                icon={<TrendingUp />}
              />
            </div>

            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-2 md:w-[400px]">
                <TabsTrigger value="overview">Visão Geral</TabsTrigger>
                <TabsTrigger value="selected">
                  Análise de Selecionados
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="mt-4">
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                  <ChartContainer
                    title="Análise de Pareto - Custos por Setor"
                    chart={<ParetoChart data={chartData} total={total} />}
                  />
                  <CostTable
                    title="Detalhamento dos Custos"
                    chartData={chartData}
                    total={total}
                    toggleAtivo={toggleAtivo}
                  />
                </div>
              </TabsContent>

              <TabsContent value="selected" className="mt-4">
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                  <ChartContainer
                    title="Pareto - Setores Selecionados"
                    chart={
                      chartDataSelected.length > 0 ? (
                        <ParetoChart
                          data={chartDataSelected}
                          total={totalSelected}
                        />
                      ) : (
                        <NoDataSelected />
                      )
                    }
                  />
                  <CostTable
                    title="Detalhamento - Selecionados"
                    chartData={chartDataSelected}
                    total={totalSelected}
                    toggleAtivo={toggleAtivo}
                    isSelectionTable
                  />
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>
      {!collapsed && showAnalytics && (
        <CostAnalyticsPanel
          allData={chartData}
          selectedData={chartDataSelected}
          totalAll={total}
          totalSelected={totalSelected}
          onToggleAnalytics={() => setShowAnalytics(false)}
          visible={showAnalytics}
        />
      )}
    </div>
  );
}

// Sub-componentes
const StatCard = ({
  title,
  value,
  icon,
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
}) => (
  <div className="bg-slate-50 p-3 rounded-lg border">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-xs font-medium text-gray-600">{title}</p>
        <p className="text-xl font-bold text-gray-800 truncate">{value}</p>
      </div>
      <div className="w-8 h-8">{icon}</div>
    </div>
  </div>
);

const ChartContainer = ({
  title,
  chart,
}: {
  title: string;
  chart: React.ReactNode;
}) => (
  <div className="bg-white rounded-lg border h-[450px] flex flex-col">
    <div className="p-4 border-b">
      <h3 className="font-semibold text-gray-800">{title}</h3>
    </div>
    <div className="flex-grow p-2">{chart}</div>
  </div>
);

const CostTable = ({
  title,
  chartData,
  total,
  toggleAtivo,
  isSelectionTable = false,
}: {
  title: string;
  chartData: any[];
  total: number;
  toggleAtivo: (nome: string) => void;
  isSelectionTable?: boolean;
}) => (
  <div className="bg-white rounded-lg border h-[450px] flex flex-col">
    <div className="p-4 border-b">
      <h3 className="font-semibold text-gray-800">{title}</h3>
    </div>
    <div className="flex-grow overflow-y-auto">
      <Table>
        <TableHeader className="sticky top-0 bg-slate-50 z-10">
          <TableRow>
            {!isSelectionTable && <TableHead className="w-[40px]"></TableHead>}
            <TableHead>Setor</TableHead>
            <TableHead className="text-right">Custo</TableHead>
            <TableHead className="text-right">%</TableHead>
            <TableHead className="text-right">Acum. %</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {chartData.map((d) => (
            <TableRow key={d.nome}>
              {!isSelectionTable && (
                <TableCell className="p-2">
                  <Checkbox
                    checked={d.ativo}
                    onCheckedChange={() => toggleAtivo(d.nome)}
                    id={`check-${d.nome}`}
                  />
                </TableCell>
              )}
              <TableCell className="font-medium text-gray-700 truncate max-w-[150px]">
                {d.nome}
              </TableCell>
              <TableCell className="text-right">
                {d.custo.toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                })}
              </TableCell>
              <TableCell className="text-right text-gray-500">
                {total > 0 ? ((d.custo / total) * 100).toFixed(1) : "0.0"}%
              </TableCell>
              <TableCell className="text-right font-medium text-primary">
                {d.acumuladoPercent.toFixed(1)}%
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
    <div className="p-3 border-t bg-slate-50 font-semibold flex justify-between text-gray-800">
      <span>TOTAL</span>
      <span>
        {total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
      </span>
    </div>
  </div>
);

const NoDataSelected = () => (
  <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 p-4">
    <Activity className="h-12 w-12 text-gray-300 mb-3" />
    <h3 className="font-semibold text-gray-700">Nenhum Setor Selecionado</h3>
    <p className="text-sm">
      Marque os setores na tabela ao lado para analisar.
    </p>
  </div>
);
