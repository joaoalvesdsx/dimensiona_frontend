import { useState, useEffect, useMemo } from "react";
import { useParams } from "react-router-dom";
import {
  getHospitalStats,
  getHospitalById,
  getUnidadesInternacao,
  getUnidadesNaoInternacao,
  getBaselinesByHospitalId,
  getSessoesAtivasByUnidadeId,
  HospitalStats,
  Hospital,
  Unidade,
  SessaoAtiva,
} from "@/lib/api";
import { DollarSign, BarChart, Building, Hourglass, AlertCircle, TrendingUp, Wallet, Users } from "lucide-react";

import { OccupationRateChart } from "@/features/admin-hospital/components/OccupationRateChart";
import { PizzaChart } from "@/features/admin-hospital/components/PizzaChart";
import { WaterfallChart } from "@/features/admin-hospital/components/WaterfallChart";
import { HorasExtraChart } from "@/features/admin-hospital/components/HorasExtraChart";
import { HeatScaleChart } from "@/features/admin-hospital/components/HeatScaleChart";

import {
  ChartData,
  HeatMapData,
  WaterfallData,
} from "@/features/admin-hospital/types/hospital";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
// ===== NOVO: Importando componentes de Abas (Tabs) =====
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const MetricCard = ({ title, value, icon: Icon }: any) => (
  <div className="bg-white dark:bg-background p-4 rounded-xl border flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
    <div className="bg-primary/10 p-3 rounded-full">
      <Icon className="h-6 w-6 text-primary" />
    </div>
    <div>
      <p className="text-sm text-muted-foreground">{title}</p>
      <p className="text-2xl font-bold text-foreground">{value}</p>
    </div>
  </div>
);

const EmptyState = ({ title, message }: { title: string; message: string }) => (
  <Card className="h-full min-h-[340px] flex items-center justify-center">
    <CardContent className="text-center py-10">
      <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-md">{message}</p>
    </CardContent>
  </Card>
);

export default function HospitalDashboardPage() {
  const { hospitalId } = useParams<{ hospitalId: string }>();
  // ... (toda a sua lógica de useState, useEffect e useMemo permanece a mesma)
  // Nenhuma alteração é necessária na busca de dados ou na preparação dos dados dos gráficos.
  const [stats, setStats] = useState<HospitalStats | null>(null);
  const [hospital, setHospital] = useState<Hospital | null>(null);
  const [unidades, setUnidades] = useState<Unidade[]>([]);
  const [sessoesMap, setSessoesMap] = useState<Map<string, SessaoAtiva[]>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!hospitalId) {
      setError("ID do hospital não fornecido.");
      setLoading(false);
      return;
    }

    const fetchAllData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [
          statsData,
          hospitalData,
          unidadesInternacao,
          unidadesNaoInternacao,
          baselineData,
        ] = await Promise.all([
          getHospitalStats(hospitalId),
          getHospitalById(hospitalId),
          getUnidadesInternacao(hospitalId),
          getUnidadesNaoInternacao(hospitalId),
          getBaselinesByHospitalId(hospitalId).catch(() => null),
        ]);

        const baselineObj = Array.isArray(baselineData) ? baselineData[0] : baselineData;
        const hospitalComBaseline = { ...hospitalData, baseline: baselineObj ?? null };
        const todasUnidades = [...unidadesInternacao, ...unidadesNaoInternacao];
        const unidadesStats = Array.isArray(statsData?.unidades) ? statsData.unidades : [];
        const precisaFallbackPorUnidade = new Set<string>();
        unidadesStats.forEach((u: any) => {
          const unidadeId = u?.unidade?.id;
          const totalLeitos = u?.totalLeitos ?? 0;
          const taxa = u?.ocupacao?.taxaOcupacao;
          const confiavel =
            typeof taxa === "number" && isFinite(taxa) && taxa >= 0 && taxa <= 100;
          if (!confiavel && totalLeitos > 0 && unidadeId) {
            precisaFallbackPorUnidade.add(unidadeId);
          }
        });

        setUnidades(todasUnidades);
        setStats(statsData);
        setHospital(hospitalComBaseline);

        const sessoesMapLocal = new Map<string, SessaoAtiva[]>();
        const toFetch = unidadesInternacao.filter((u) => precisaFallbackPorUnidade.has(u.id));

        const maxConc = 6;
        let i = 0;
        const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
        const fetchWithRetry = async (unidadeId: string, attempts = 2): Promise<SessaoAtiva[]> => {
          for (let t = 0; t <= attempts; t++) {
            try {
              return await getSessoesAtivasByUnidadeId(unidadeId);
            } catch (e) {
              if (t === attempts) return [];
              await sleep(200 * (t + 1));
            }
          }
          return [];
        };

        const workers: Promise<void>[] = [];
        for (let w = 0; w < Math.min(maxConc, toFetch.length); w++) {
          workers.push((async () => {
            while (i < toFetch.length) {
              const idx = i++;
              const unidade = toFetch[idx];
              const sessoes = await fetchWithRetry(unidade.id, 2);
              sessoesMapLocal.set(unidade.id, sessoes);
            }
          })());
        }
        await Promise.all(workers);
        setSessoesMap(sessoesMapLocal);
      } catch (err) {
        setError("Falha ao carregar os dados do dashboard. Verifique a conexão e se o hospital possui dados cadastrados.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, [hospitalId]);

  const pizzaData: ChartData[] = useMemo(() => {
    const scpDistribution: Record<string, number> = { "Cuidados Mínimos": 0, "Cuidados Intermediários": 0, "Alta Dependência": 0, "Cuidados Semi-intensivos": 0, "Cuidados Intensivos": 0 };
    sessoesMap.forEach((sessoes) => {
      sessoes.forEach((sessao: any) => {
        const c = sessao?.classificacao;
        if (c === "MINIMOS") scpDistribution["Cuidados Mínimos"]++;
        else if (c === "INTERMEDIARIOS") scpDistribution["Cuidados Intermediários"]++;
        else if (c === "ALTA_DEPENDENCIA") scpDistribution["Alta Dependência"]++;
        else if (c === "SEMI_INTENSIVOS") scpDistribution["Cuidados Semi-intensivos"]++;
        else if (c === "INTENSIVOS") scpDistribution["Cuidados Intensivos"]++;
      });
    });
    return Object.entries(scpDistribution)
      .map(([name, value], i) => ({ name, value, color: ["hsl(var(--success))", "hsl(var(--primary))", "hsl(var(--warning))", "hsl(var(--muted-foreground))", "hsl(var(--destructive))"][i % 5] }))
      .filter((it) => it.value > 0);
  }, [sessoesMap]);

  const heatMapData: HeatMapData[] = useMemo(() => {
    if (!stats?.unidades) return [];
    return stats.unidades
      .map((u: any) => {
        const unidadeId = u?.unidade?.id;
        const unidadeNome = u?.unidade?.nome ?? "Setor";
        const totalLeitos = u?.totalLeitos ?? 0;
        let taxa: number | null = typeof u?.ocupacao?.taxaOcupacao === "number" && isFinite(u.ocupacao.taxaOcupacao) ? u.ocupacao.taxaOcupacao : null;
        if ((taxa === null || taxa < 0 || taxa > 100) && totalLeitos > 0) {
          const sessoes = sessoesMap.get(unidadeId) || [];
          taxa = (sessoes.length / totalLeitos) * 100;
        }
        if (taxa === null || !isFinite(taxa) || totalLeitos === 0) return null;
        const value = Math.round(Math.max(0, Math.min(100, taxa)));
        const status = value >= 85 ? "high" : value >= 70 ? "medium" : "low";
        return { hospital: hospital?.nome || "N/A", sector: unidadeNome, value, status } as HeatMapData;
      })
      .filter(Boolean) as HeatMapData[];
  }, [stats, sessoesMap, hospital]);

  const { waterfallData, waterfallTitle, waterfallSubtitle } = useMemo(() => {
    const baseline = (hospital as any)?.baseline;
    if (baseline?.setores?.length) {
      const parsed = (baseline.setores as any[]).map((s) => ({ name: String(s?.nome ?? "").trim(), value: parseFloat(String(s?.custo ?? "0")) || 0, ativo: s?.ativo !== false })).filter((s) => s.ativo && s.name && s.value > 0).sort((a, b) => b.value - a.value);
      if (parsed.length) {
        const total = parseFloat(String(baseline.custo_total ?? "0")) || 0;
        let cum = total;
        const out: WaterfallData[] = [{ name: "Total", value: total, cumulative: total, type: "total" }];
        parsed.forEach((s) => { out.push({ name: s.name, value: s.value, cumulative: cum, type: "positive" }); cum -= s.value; });
        return { waterfallData: out, waterfallTitle: "Custos por Setor (Baseline)", waterfallSubtitle: "Fonte: Baseline do hospital" };
      }
    }
    const contribs = (unidades || []).map((u: any) => ({ name: String(u?.nome ?? "").trim() || "Unidade", value: parseFloat(String(u?.horas_extra_reais ?? "0")) || 0 })).filter((x) => x.value > 0).sort((a, b) => b.value - a.value);
    if (!contribs.length) { return { waterfallData: [], waterfallTitle: "Composição de Custos", waterfallSubtitle: null }; }
    const totalFallback = contribs.reduce((sum, it) => sum + it.value, 0);
    let cum = totalFallback;
    const out: WaterfallData[] = [{ name: "Total", value: totalFallback, cumulative: totalFallback, type: "total" }];
    contribs.forEach((c) => { out.push({ name: c.name, value: c.value, cumulative: cum, type: "positive" }); cum -= c.value; });
    return { waterfallData: out, waterfallTitle: "Composição por Unidade (Horas Extras Reais)", waterfallSubtitle: "Fonte: Unidades — Horas Extras (R$)" };
  }, [hospital, unidades]);

  const horasExtraData = useMemo(() => {
    if (!unidades?.length) return [];
    return unidades.map((u: any) => { const reais = parseFloat(u?.horas_extra_reais ?? "0"); const proj = parseFloat(u?.horas_extra_projetadas ?? "0"); if (reais > 0 || proj > 0) { return { name: u?.nome ?? "Unidade", "Horas Extras Reais": reais, "Horas Extras Projetadas": proj } as const; } return null; }).filter(Boolean) as { name: string; "Horas Extras Reais": number; "Horas Extras Projetadas": number }[];
  }, [unidades]);

  const occupationMetrics = useMemo(() => {
    if (!heatMapData.length) return null;
    const vals = heatMapData.map((d) => d.value);
    return { avgOccupation: Math.round(vals.reduce((a, b) => a + b, 0) / vals.length), maxOccupation: Math.max(...vals), minOccupation: Math.min(...vals), totalSectors: heatMapData.length, overcrowded: heatMapData.filter((d) => d.status === "high").length, underutilized: heatMapData.filter((d) => d.status === "low").length };
  }, [heatMapData]);

  if (loading) { /* ... spinner ... */ }
  if (error) { /* ... error alert ... */ }
  if (!stats || !hospital) { /* ... no data alert ... */ }

  const totalHorasExtrasReais = unidades.reduce((sum, u: any) => { const valor = parseFloat(u?.horas_extra_reais ?? "0"); return sum + (isNaN(valor) ? 0 : valor); }, 0);
  const baseline = (hospital as any)?.baseline ?? null;
  const custoTotalBaseline = parseFloat(String(baseline?.custo_total ?? "0")) || 0;
  const custoTotalDisplay = (baseline && custoTotalBaseline > 0) ? `R$ ${(custoTotalBaseline / 1000).toFixed(1)}k` : "—";
  const horasExtrasDisplay = totalHorasExtrasReais > 0 ? `R$ ${(totalHorasExtrasReais / 1000).toFixed(1)}k` : "R$ 0,0k";

  return (
    <div className="space-y-8 pb-10">
      {/* Header (permanece igual) */}
      <div>
        <h1 className="text-3xl font-bold text-primary">{hospital.nome}</h1>
        <p className="text-muted-foreground">Visão geral dos indicadores chave de desempenho</p>
      </div>

      {/* KPIs (permanece igual) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <MetricCard title="Ocupação Média" value={`${occupationMetrics?.avgOccupation || 0}%`} icon={BarChart} />
        <MetricCard title="Total de Leitos" value={stats.totalLeitos} icon={Building} />
        <MetricCard title="Custo (Baseline)" value={custoTotalDisplay} icon={DollarSign} />
        <MetricCard title="Horas Extras (Real)" value={horasExtrasDisplay} icon={Hourglass} />
      </div>

      {/* ===== NOVA ESTRUTURA DE ABAS ===== */}
      <Tabs defaultValue="ocupacao" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="ocupacao">
            <TrendingUp className="mr-2 h-4 w-4" /> Análise de Ocupação
          </TabsTrigger>
          <TabsTrigger value="custos">
            <Wallet className="mr-2 h-4 w-4" /> Análise de Custos
          </TabsTrigger>
          <TabsTrigger value="pacientes">
            <Users className="mr-2 h-4 w-4" /> Distribuição de Pacientes
          </TabsTrigger>
        </TabsList>

        {/* ===== CONTEÚDO DA ABA DE OCUPAÇÃO ===== */}
        <TabsContent value="ocupacao" className="mt-6">
          {/* Layout mais generoso: 5 colunas no total em telas grandes */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Gráfico de Barras agora ocupa 3 de 5 colunas */}
            <div className="lg:col-span-3">
              {heatMapData.length > 0 && occupationMetrics ? (
                <Card className="h-full transition-shadow hover:shadow-md">
                  <CardContent className="pt-6 min-h-[420px]">
                    <OccupationRateChart data={heatMapData} metrics={occupationMetrics} title="Ocupação por Setor" />
                  </CardContent>
                </Card>
              ) : (
                <EmptyState title="Sem dados de ocupação" message="Não há dados de ocupação disponíveis." />
              )}
            </div>

            {/* HeatScaleChart agora ocupa 2 de 5 colunas, tendo muito mais espaço */}
            <div className="lg:col-span-2">
              {heatMapData.length > 0 ? (
                <div className="h-full">
                  <HeatScaleChart data={heatMapData} title="Temperatura da Ocupação" className="h-full" />
                </div>
              ) : (
                <EmptyState title="Mapa de calor indisponível" message="O mapa de calor será exibido quando houver dados de ocupação." />
              )}
            </div>
          </div>
        </TabsContent>

        {/* ===== CONTEÚDO DA ABA DE CUSTOS ===== */}
        <TabsContent value="custos" className="mt-6">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {waterfallData.length > 1 ? (
              <Card className="transition-shadow hover:shadow-md">
                <CardContent className="pt-6 min-h-[420px]">
                  <WaterfallChart data={waterfallData} title={waterfallTitle} subtitle={waterfallSubtitle || undefined} />
                </CardContent>
              </Card>
            ) : (
              <EmptyState title="Sem dados para o Waterfall" message="Cadastre a baseline ou informe Horas Extras Reais nas unidades." />
            )}
            {horasExtraData.length > 0 ? (
              <Card className="transition-shadow hover:shadow-md">
                <CardContent className="pt-6 min-h-[420px]">
                  <HorasExtraChart data={horasExtraData} />
                </CardContent>
              </Card>
            ) : (
              <EmptyState title="Sem dados de horas extras" message="Nenhuma unidade possui horas extras cadastradas." />
            )}
          </div>
        </TabsContent>

        {/* ===== CONTEÚDO DA ABA DE PACIENTES ===== */}
        <TabsContent value="pacientes" className="mt-6">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {pizzaData.length > 0 ? (
              <Card className="transition-shadow hover:shadow-md">
                <CardContent className="pt-6 min-h-[420px]">
                  <PizzaChart data={pizzaData} title="Distribuição por Classificação" />
                </CardContent>
              </Card>
            ) : (
              <EmptyState title="Sem pacientes admitidos" message="A distribuição será exibida após admissões." />
            )}
            <Card>
              <CardHeader><CardTitle>Resumo Estatístico</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg"><span className="text-sm font-medium">Total de Unidades</span><span className="text-lg font-bold">{unidades.length}</span></div>
                  <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg"><span className="text-sm font-medium">Pacientes Internados</span><span className="text-lg font-bold">{Array.from(sessoesMap.values()).reduce((sum, s) => sum + s.length, 0)}</span></div>
                  <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg"><span className="text-sm font-medium">Taxa de Ocupação Geral</span><span className="text-lg font-bold">{occupationMetrics?.avgOccupation || 0}%</span></div>
                  <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg"><span className="text-sm font-medium">Setores Críticos (≥85%)</span><span className="text-lg font-bold text-destructive">{occupationMetrics?.overcrowded || 0}</span></div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}