import { useState, useEffect } from "react";
import {
  UnidadeInternacao,
  SessaoAtiva,
  getAnaliseInternacao,
  AnaliseInternacaoResponse,
} from "@/lib/api";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import AnaliseFinanceira, {
  LinhaAnalise,
} from "@/components/shared/AnaliseFinanceira";
import { Skeleton } from "@/components/ui/skeleton";

// Mapeamento para nomes mais amigáveis
const classificationMap: { [key: string]: string } = {
  PCM: "Cuidado Mínimo",
  PCI: "Cuidado Intermediário",
  PADC: "Alta Dependência",
  PCSI: "Semi-Intensivo",
  PCIt: "Intensivo",
};

// Props que este componente espera receber
interface DimensionamentoTabProps {
  unidade: UnidadeInternacao;
  sessoes: SessaoAtiva[];
  onDataChange: () => void;
}

export default function DimensionamentoTab({
  unidade,
  sessoes,
}: DimensionamentoTabProps) {
  const [analiseData, setAnaliseData] =
    useState<AnaliseInternacaoResponse | null>(null);
  const [tabelaData, setTabelaData] = useState<LinhaAnalise[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const buscarDadosAnalise = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getAnaliseInternacao(unidade.id);
        setAnaliseData(data);
        setTabelaData(data.tabela); // A 'quantidadeProjetada' já vem calculada
      } catch (err) {
        setError("Falha ao carregar os dados da análise de dimensionamento.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    buscarDadosAnalise();
  }, [unidade.id]);

  const handleQuantidadeChange = (cargoId: string, novaQuantidade: number) => {
    setTabelaData((prev) =>
      prev.map((linha) =>
        linha.cargoId === cargoId
          ? { ...linha, quantidadeProjetada: Math.max(0, novaQuantidade) }
          : linha
      )
    );
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (error) {
    return <p className="text-red-500 text-center">{error}</p>;
  }

  const totalLeitos = unidade.leitos?.length || 0;
  const taxaOcupacaoAtual =
    totalLeitos > 0 ? (sessoes.length / totalLeitos) * 100 : 0;

  const distribuicao =
    analiseData?.agregados.distribuicaoTotalClassificacao || {};

  return (
    <div className="space-y-6 animate-fade-in-down">
      <Card>
        <CardHeader>
          <CardTitle>Dados Agregados e Atuais</CardTitle>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 text-sm text-gray-500 mt-2">
            <div>
              <p>
                <strong>Período de Análise:</strong>{" "}
                {new Date(
                  analiseData?.agregados.periodo.inicio || ""
                ).toLocaleDateString()}{" "}
                a{" "}
                {new Date(
                  analiseData?.agregados.periodo.fim || ""
                ).toLocaleDateString()}
              </p>
              <p>
                <strong>Total de Pacientes Atuais:</strong> {sessoes.length}
              </p>
              <p>
                <strong>Taxa de Ocupação Atual:</strong>{" "}
                {taxaOcupacaoAtual.toFixed(2)}%
              </p>
              <p>
                <strong>Taxa de Ocupação Média (Mês):</strong>{" "}
                {(
                  (analiseData?.agregados.taxaOcupacaoMensal || 0) * 100
                ).toFixed(2)}
                %
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-700 mb-1">
                Total de Pacientes-Dia no Mês:
              </h4>
              {Object.keys(distribuicao).length > 0 ? (
                <ul className="list-disc list-inside">
                  {Object.entries(distribuicao).map(([key, value]) => (
                    <li key={key}>
                      {classificationMap[key] || key}:{" "}
                      <strong>{value.toFixed(0)}</strong>
                    </li>
                  ))}
                </ul>
              ) : (
                <p>Nenhum dado de classificação no período.</p>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      <AnaliseFinanceira
        tipo="internacao"
        dados={tabelaData}
        horasExtrasProjetadas={parseFloat(
          unidade.horas_extra_projetadas || "0"
        )}
        onQuantidadeChange={handleQuantidadeChange}
      />
    </div>
  );
}
