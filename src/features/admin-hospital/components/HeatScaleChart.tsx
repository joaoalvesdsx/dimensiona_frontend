import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ZAxis,
  Cell,
} from "recharts";

/** ===== Tipos ===== */
export interface HeatMapData {
  hospital: string;
  sector: string;
  value: number; // 0..100 (taxa de ocupação)
  status?: "low" | "medium" | "high";
}

type SortMode = "critico" | "alfabetico";

interface HeatScaleChartProps {
  data: HeatMapData[];
  title?: string;
  subtitle?: string;
  className?: string;
  sortMode?: SortMode; // padrão: "critico"
}

/** ===== Utils de cor (escala contínua) ===== */
function hexToRgb(hex: string) {
  const h = hex.replace("#", "");
  const n = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const v = parseInt(n, 16);
  return { r: (v >> 16) & 255, g: (v >> 8) & 255, b: v & 255 };
}
function mixHex(a: string, b: string, t: number) {
  const ca = hexToRgb(a),
    cb = hexToRgb(b);
  const r = Math.round(ca.r + (cb.r - ca.r) * t);
  const g = Math.round(ca.g + (cb.g - ca.g) * t);
  const b2 = Math.round(ca.b + (cb.b - ca.b) * t);
  return `rgb(${r}, ${g}, ${b2})`;
}
/** 0..70: verde→âmbar | 70..85: âmbar→laranja | 85..100: laranja→vermelho */
function valueToColor(v: number) {
  const x = Math.max(0, Math.min(100, v));
  if (x <= 70) return mixHex("#16a34a", "#f59e0b", x / 70); // verde -> âmbar
  if (x <= 85) return mixHex("#f59e0b", "#f97316", (x - 70) / 15); // âmbar -> laranja
  return mixHex("#f97316", "#ef4444", (x - 85) / 15); // laranja -> vermelho
}
function statusBadgeClass(v: number) {
  if (v >= 85) return "bg-destructive text-destructive-foreground";
  if (v >= 70) return "bg-warning text-warning-foreground";
  return "bg-success text-success-foreground";
}

// ====================================================================
// CORREÇÃO APLICADA AQUI
// O componente Kpi foi movido daqui (do final do arquivo) para cima.
// ====================================================================

/** ===== Subcomponentes ===== */
function GridView({ data }: { data: HeatMapData[] }) {
  // Ajuste fino no grid para melhor visualização em telas médias
  return (
    <div>
      <h4 className="text-center text-sm font-medium text-muted-foreground mb-3">Heat Map</h4>
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {data.map((item, idx) => {
          const bg = valueToColor(item.value);
          const fg = item.value >= 85 ? "#fff" : item.value >= 70 ? "#111" : "#0a0a0a";
          return (
            <div
              key={`${item.sector}-${idx}`}
              className="group relative border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all"
              style={{ background: bg, color: fg }}
              role="button"
              aria-label={`${item.sector}: ${item.value}% de ocupação`}
              title={`${item.sector} — ${item.value}%`}
            >
              <div className="p-3">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-xs font-medium opacity-90 truncate max-w-[70%]">
                    {item.sector}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-md font-semibold bg-black/15 text-white/95 backdrop-blur-sm">
                    {item.value}%
                  </span>
                </div>
                <div className="mt-3 h-1.5 w-full rounded-full bg-black/20 overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${item.value}%`, background: "rgba(255,255,255,0.9)" }}
                  />
                </div>
              </div>
              <div className="pointer-events-none absolute inset-x-0 -bottom-2 translate-y-full opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition">
                <div className="mx-2 mb-2 rounded-md bg-background text-foreground text-xs border shadow p-2">
                  <div className="font-semibold">{item.sector}</div>
                  <div className="text-muted-foreground">
                    Ocupação:&nbsp;<span className="font-semibold">{item.value}%</span>
                  </div>
                  <div className="mt-1">
                    <span className={cn("text-[10px] px-2 py-0.5 rounded", statusBadgeClass(item.value))}>
                      {item.value >= 85 ? "Crítico" : item.value >= 70 ? "Atenção" : "OK"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ScatterView({
  data,
}: {
  data: Array<{ x: number; y: number; z: number; sector: string; hospital: string; color: string }>;
}) {
  const axisTick = { fontSize: 12, fill: "hsl(var(--muted-foreground))" } as const;
  const maxX = Math.max(1, data.length);

  return (
    <div>
      <h4 className="text-center text-sm font-medium text-muted-foreground mb-3">Scatter Plot</h4>
      <div className="h-[320px] min-h-[320px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 8, right: 16, left: 8, bottom: 32 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              type="number"
              dataKey="x"
              name="Setor"
              tick={axisTick}
              allowDecimals={false}
              domain={[1, maxX]}
            />
            <YAxis
              type="number"
              dataKey="y"
              name="Taxa"
              tick={axisTick}
              tickFormatter={(v) => `${v}%`}
              domain={[0, 100]}
            />
            <ZAxis type="number" dataKey="z" range={[40, 160]} />
            <Tooltip
              content={({ active, payload }: any) => {
                if (!active || !payload?.length) return null;
                const d = payload[0].payload;
                return (
                  <div className="bg-background border border-border rounded-lg shadow-lg p-3 text-sm">
                    <p className="font-bold text-foreground mb-1">{d.sector}</p>
                    <p className="text-muted-foreground">
                      Hospital: <span className="font-semibold">{d.hospital}</span>
                    </p>
                    <p className="text-muted-foreground">
                      Ocupação: <span className="font-semibold">{d.y}%</span>
                    </p>
                  </div>
                );
              }}
            />
            <Scatter data={data}>
              {data.map((pt, i) => (
                <Cell key={i} fill={pt.color} />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ===== ALTERAÇÃO: O componente Kpi foi movido para ANTES do componente principal =====
function Kpi({
  label,
  value,
  strong,
}: {
  label: string;
  value: string | number;
  strong?: boolean;
}) {
  // Determina a cor com base no valor para "Críticos" e "Atenção"
  const valueColor =
    label.startsWith("Críticos") && value > 0
      ? "text-destructive"
      : label.startsWith("Atenção") && value > 0
      ? "text-amber-600" // Um tom de âmbar para atenção
      : "text-foreground";

  return (
    <div className="bg-muted/40 p-3 rounded-lg text-center">
      <div className={cn("text-xl", strong ? "font-extrabold" : "font-bold", valueColor)}>
        {value}
      </div>
      <div className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide">
        {label}
      </div>
    </div>
  );
}

/** ===== Componente principal ===== */
export const HeatScaleChart: React.FC<HeatScaleChartProps> = ({
  data,
  title = "Mapa de Calor - Ocupação por Setor",
  subtitle = "Cores indicam tendência: verde (OK), âmbar (atenção), vermelho (crítico).",
  className,
  sortMode = "critico",
}) => {
  const [mode, setMode] = React.useState<SortMode>(sortMode);
  const [tab, setTab] = React.useState<"grid" | "scatter" | "both">("both");

  React.useEffect(() => {
    const id = setTimeout(() => {
      window.dispatchEvent(new Event("resize"));
    }, 80);
    return () => clearTimeout(id);
  }, [tab]);

  const sorted = React.useMemo(() => {
    const arr = [...data];
    if (mode === "alfabetico") return arr.sort((a, b) => a.sector.localeCompare(b.sector, "pt-BR"));
    return arr.sort((a, b) => (b.value ?? 0) - (a.value ?? 0)); // criticidade
  }, [data, mode]);

  const resumo = React.useMemo(() => {
    if (!sorted.length) return null;
    const vals = sorted.map((d) => d.value);
    const avg = Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
    const max = Math.max(...vals);
    const min = Math.min(...vals);
    const high = sorted.filter((d) => d.value >= 85).length;
    const medium = sorted.filter((d) => d.value >= 70 && d.value < 85).length;
    const low = sorted.filter((d) => d.value < 70).length;
    return { avg, max, min, high, medium, low, total: sorted.length };
  }, [sorted]);

  const scatterData = React.useMemo(
    () =>
      sorted.map((item, idx) => ({
        x: idx + 1,
        y: item.value,
        z: Math.max(20, Math.min(160, item.value)),
        sector: item.sector,
        hospital: item.hospital,
        color: valueToColor(item.value),
      })),
    [sorted]
  );

  return (
    <Card className={cn("transition-shadow hover:shadow-md h-full", className)}>
      <CardHeader className="space-y-2">
        <div className="flex items-center justify-between gap-4">
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{subtitle}</CardDescription>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <button
              onClick={() => setMode("critico")}
              className={cn(
                "px-3 py-1 rounded-md border",
                mode === "critico"
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-muted hover:bg-muted/80 border-border"
              )}
            >
              Criticidade
            </button>
            <button
              onClick={() => setMode("alfabetico")}
              className={cn(
                "px-3 py-1 rounded-md border",
                mode === "alfabetico"
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-muted hover:bg-muted/80 border-border"
              )}
            >
              A–Z
            </button>
          </div>
        </div>
        
        <div className="space-y-2 pt-2"> {/* Adicionado pt-2 para um respiro */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>0%</span>
            <span>70%</span>
            <span>85%</span>
            <span>100%</span>
          </div>
          <div
            className="h-2 w-full rounded-full"
            style={{
              background:
                "linear-gradient(90deg, #16a34a 0%, #f59e0b 70%, #f97316 85%, #ef4444 100%)",
            }}
          />
          <div className="flex items-center gap-3 text-xs">
            <span className="inline-block h-3 w-3 rounded-sm" style={{ background: "#16a34a" }} /> OK
            <span className="inline-block h-3 w-3 rounded-sm" style={{ background: "#f59e0b" }} /> Atenção
            <span className="inline-block h-3 w-3 rounded-sm" style={{ background: "#ef4444" }} /> Crítico
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        {resumo && (
          // ===== ALTERAÇÃO 1: Ajuste no grid responsivo dos KPIs =====
          // Trocamos `sm:grid-cols-3` por `md:grid-cols-3`.
          // Agora ele só usará 3 colunas em telas médias, evitando a quebra em telas menores.
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <Kpi label="Média" value={`${resumo.avg}%`} />
            <Kpi label="Máx" value={`${resumo.max}%`} strong />
            <Kpi label="Mín" value={`${resumo.min}%`} />
            {/* ===== ALTERAÇÃO 2: Rótulos dos KPIs encurtados ===== */}
            <Kpi label="Críticos (≥85%)" value={resumo.high} />
            <Kpi label="Atenção (70-84%)" value={resumo.medium} />
            <Kpi label="Total de Setores" value={resumo.total} />
          </div>
        )}

        <Tabs value={tab} onValueChange={(v) => setTab(v as any)} className="w-full">
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="grid">Heat Map Grid</TabsTrigger>
              <TabsTrigger value="scatter">Scatter Plot</TabsTrigger>
              <TabsTrigger value="both">Grid + Scatter</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="grid" className="mt-4">
            <GridView data={sorted} />
          </TabsContent>

          <TabsContent value="scatter" className="mt-4">
            <ScatterView key={tab} data={scatterData} />
          </TabsContent>

          <TabsContent value="both" className="mt-4">
            <div className="grid lg:grid-cols-2 gap-6">
              <GridView data={sorted} />
              <ScatterView key={tab} data={scatterData} />
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};