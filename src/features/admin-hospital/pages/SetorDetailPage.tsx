import { useEffect, useState, FormEvent, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import {
  getUnidadeById,
  getSessoesAtivasByUnidadeId,
  UnidadeInternacao,
  SessaoAtiva,
  Dimensionamento,
  getDimensionamentosPorUnidade,
  createDimensionamento,
  CreateDimensionamentoDTO,
  UnidadeNaoInternacao,
} from "@/lib/api";
import { Bed, User, Calculator, Download } from "lucide-react";

// Importando os componentes
import CardInfo from "../components/CardInfo";
import QuadroCargos from "../components/QuadroCargos";

import LeitosAdminPage from "./LeitosAdminPage";
import ParametrosPage from "./ParametrosPage";
import SitiosFuncionaisAdminPage from "./SitiosFuncionaisAdminPage";

// --- Lógica de Cálculo (sem alterações) ---
const HORAS_PADRAO = {
  MINIMOS: 4,
  INTERMEDIARIOS: 6,
  ALTA_DEPENDENCIA: 10,
  SEMI_INTENSIVOS: 10,
  INTENSIVOS: 18,
};
function calcularResultadoDimensionamento(dados: CreateDimensionamentoDTO) {
  const {
    pcm,
    pci,
    pcad,
    pcsi,
    pcit,
    enfermeiroPercentualEquipe,
    indiceTecnico,
  } = dados;
  const distribuicao = {
    MINIMOS: pcm,
    INTERMEDIARIOS: pci,
    ALTA_DEPENDENCIA: pcad,
    SEMI_INTENSIVOS: pcsi,
    INTENSIVOS: pcit,
  };
  const the =
    distribuicao.MINIMOS * HORAS_PADRAO.MINIMOS +
    distribuicao.INTERMEDIARIOS * HORAS_PADRAO.INTERMEDIARIOS +
    distribuicao.ALTA_DEPENDENCIA * HORAS_PADRAO.ALTA_DEPENDENCIA +
    distribuicao.SEMI_INTENSIVOS * HORAS_PADRAO.SEMI_INTENSIVOS +
    distribuicao.INTENSIVOS * HORAS_PADRAO.INTENSIVOS;
  const istAplicado = indiceTecnico / 100;
  const km = 0.2236;
  let qpEnf = the * km * enfermeiroPercentualEquipe;
  let qpTec = the * km * (1 - enfermeiroPercentualEquipe);
  if (istAplicado > 0) {
    qpEnf *= 1 + istAplicado;
    qpTec *= 1 + istAplicado;
  }
  return {
    the: the.toFixed(2),
    qpEnf: qpEnf.toFixed(2),
    qpTec: qpTec.toFixed(2),
    qpEnfArredondado: Math.ceil(qpEnf),
    qpTecArredondado: Math.ceil(qpTec),
    qpTotal: Math.ceil(qpEnf) + Math.ceil(qpTec),
  };
}
const TabelaResultado = ({
  titulo,
  dados,
}: {
  titulo: string;
  dados: CreateDimensionamentoDTO | Dimensionamento;
}) => {
  // @ts-ignore
  const resultado = calcularResultadoDimensionamento(dados);
  return (
    <div className="mt-4">
      <h4 className="font-semibold text-gray-700">{titulo}</h4>
      <table className="w-full text-sm mt-2">
        <tbody>
          <tr className="border-b">
            <td className="py-1">Total de Horas (THE)</td>
            <td className="text-right font-medium">{resultado.the} h</td>
          </tr>
          <tr className="border-b">
            <td className="py-1">QP Enfermeiros</td>
            <td className="text-right font-medium">
              {resultado.qpEnf} ({resultado.qpEnfArredondado})
            </td>
          </tr>
          <tr className="border-b">
            <td className="py-1">QP Técnicos</td>
            <td className="text-right font-medium">
              {resultado.qpTec} ({resultado.qpTecArredondado})
            </td>
          </tr>
          <tr className="bg-slate-50">
            <td className="py-1 font-bold">QP Total</td>
            <td className="text-right font-bold">{resultado.qpTotal}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default function SetorDetailPage() {
  const { hospitalId, setorId } = useParams<{
    hospitalId: string;
    setorId: string;
  }>();
  const [unidade, setUnidade] = useState<
    | (UnidadeInternacao & { cargos_unidade?: any[] })
    | UnidadeNaoInternacao
    | null
  >(null);
  const [sessoes, setSessoes] = useState<SessaoAtiva[]>([]);
  const [dimensionamentos, setDimensionamentos] = useState<Dimensionamento[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [activeTab, setActiveTab] = useState("dimensionamento");
  const [formData, setFormData] = useState<CreateDimensionamentoDTO>({
    enfermeiroCargoHorario: 36,
    enfermeiroPercentualEquipe: 0.33,
    tecnicoEnfermagemCargoHorario: 36,
    tecnicoEnfermagemPercentualEquipe: 0.67,
    indiceTecnico: 15,
    idadeEquipeRestricoes: "nao",
    quantidadeLeitos: 0,
    taxaOcupacao: 85,
    pcm: 0,
    pci: 0,
    pcad: 0,
    pcsi: 0,
    pcit: 0,
  });

  const fetchData = async () => {
    if (!setorId) return;
    setLoading(true);
    setError(null);
    try {
      const unidadeData = (await getUnidadeById(setorId)) as
        | UnidadeInternacao
        | UnidadeNaoInternacao;
      setUnidade(unidadeData);

      if (unidadeData.tipo === "internacao") {
        console.log(unidadeData);
        setActiveTab("dimensionamento");
        const [sessoesData, dimensionamentosData] = await Promise.all([
          getSessoesAtivasByUnidadeId(setorId),
          getDimensionamentosPorUnidade(setorId),
        ]);
        setSessoes(sessoesData);
        setDimensionamentos(dimensionamentosData);
        setFormData((prev) => ({
          ...prev,
          quantidadeLeitos:
            (unidadeData as UnidadeInternacao).leitos?.length || 0,
        }));
      } else {
        setActiveTab("sitios");
      }
    } catch (err) {
      setError("Falha ao carregar dados do setor.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [setorId]);

  const distribuicaoAtual = useMemo(() => {
    const dist = { pcm: 0, pci: 0, pcad: 0, pcsi: 0, pcit: 0 };
    sessoes.forEach((s) => {
      if (s.classificacao === "MINIMOS") dist.pcm++;
      if (s.classificacao === "INTERMEDIARIOS") dist.pci++;
      if (s.classificacao === "ALTA_DEPENDENCIA") dist.pcad++;
      if (s.classificacao === "SEMI_INTENSIVOS") dist.pcsi++;
      if (s.classificacao === "INTENSIVOS") dist.pcit++;
    });
    return dist;
  }, [sessoes]);
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    const parsedValue = type === "number" ? Number(value) : value;
    setFormData((prev) => ({ ...prev, [name]: parsedValue }));
  };
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!setorId) return;
    try {
      await createDimensionamento(setorId, formData);
      setIsFormVisible(false);
      fetchData();
    } catch (err) {
      setError("Falha ao salvar dimensionamento projetado.");
    }
  };
  const handleDownloadPdf = (dimensionamentoId: string) => {
    window.open(
      `/api/unidades/${setorId}/dimensionamento/${dimensionamentoId}/pdf`,
      "_blank"
    );
  };

  if (loading) return <p>Carregando detalhes do setor...</p>;
  if (error) return <p className="text-red-500">{error}</p>;
  if (!unidade) return <p>Setor não encontrado.</p>;

  return (
    <div className="space-y-6">
      <div>
        <Link
          to={`/hospital/${hospitalId}/setores`}
          className="text-sm text-gray-500 hover:underline"
        >
          &larr; Voltar para Setores
        </Link>
        <h1 className="text-3xl font-bold text-primary">{unidade.nome}</h1>
      </div>

      <CardInfo unidade={unidade} sessoes={sessoes} />

      <div className="border-b">
        <nav className="-mb-px flex space-x-8">
          {unidade.tipo === "internacao" ? (
            <>
              <TabButton
                id="dimensionamento"
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                label="Dimensionamento"
              />
              <TabButton
                id="leitos"
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                label="Leitos"
              />
              <TabButton
                id="funcionarios"
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                label="Funcionários"
              />
              <TabButton
                id="parametros"
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                label="Parâmetros"
              />
            </>
          ) : (
            <>
              <TabButton
                id="sitios"
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                label="Sítios Funcionais"
              />
              <TabButton
                id="funcionarios"
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                label="Funcionários"
              />
            </>
          )}
        </nav>
      </div>

      {activeTab === "funcionarios" && (
        // @ts-ignore
        <QuadroCargos cargos={unidade.cargos_unidade} />
      )}

      {unidade.tipo === "internacao" && (
        <>
          {activeTab === "dimensionamento" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-lg border">
                <h2 className="text-xl font-semibold text-primary mb-4">
                  Dimensionamento Atual
                </h2>
                <TabelaResultado
                  titulo="Baseado nos Pacientes Atuais"
                  dados={{ ...formData, ...distribuicaoAtual }}
                />
              </div>
              <div className="bg-white p-6 rounded-lg border">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-primary">
                    Dimensionamento Projetado
                  </h2>
                  <button
                    onClick={() => setIsFormVisible(!isFormVisible)}
                    className="text-sm text-secondary hover:underline flex items-center gap-1"
                  >
                    <Calculator size={16} />{" "}
                    {isFormVisible ? "Fechar" : "Projetar Cenário"}
                  </button>
                </div>
                {isFormVisible ? (
                  <form
                    onSubmit={handleSubmit}
                    className="space-y-4 animate-fade-in-down"
                  >
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                      <label className="text-sm">
                        PCM{" "}
                        <input
                          name="pcm"
                          type="number"
                          value={formData.pcm}
                          onChange={handleChange}
                          className="w-full p-1 border rounded"
                        />
                      </label>
                      <label className="text-sm">
                        PCI{" "}
                        <input
                          name="pci"
                          type="number"
                          value={formData.pci}
                          onChange={handleChange}
                          className="w-full p-1 border rounded"
                        />
                      </label>
                      <label className="text-sm">
                        PCAD{" "}
                        <input
                          name="pcad"
                          type="number"
                          value={formData.pcad}
                          onChange={handleChange}
                          className="w-full p-1 border rounded"
                        />
                      </label>
                      <label className="text-sm">
                        PCSI{" "}
                        <input
                          name="pcsi"
                          type="number"
                          value={formData.pcsi}
                          onChange={handleChange}
                          className="w-full p-1 border rounded"
                        />
                      </label>
                      <label className="text-sm">
                        PCIT{" "}
                        <input
                          name="pcit"
                          type="number"
                          value={formData.pcit}
                          onChange={handleChange}
                          className="w-full p-1 border rounded"
                        />
                      </label>
                    </div>
                    <TabelaResultado
                      titulo="Resultado da Projeção"
                      dados={formData}
                    />
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        className="px-4 py-2 text-sm text-white bg-green-600 rounded-md"
                      >
                        Salvar Projeção
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-2">
                    {dimensionamentos.map((dim) => (
                      <div
                        key={dim.id}
                        className="p-3 bg-slate-50 rounded-md border text-sm"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p>
                              <strong>Projeção Salva em:</strong>
                            </p>
                            <p>
                              {new Date(dim.createdAt).toLocaleString("pt-BR")}
                            </p>
                          </div>
                          <button
                            onClick={() => handleDownloadPdf(dim.id)}
                            className="text-secondary hover:underline"
                          >
                            <Download size={16} />
                          </button>
                        </div>
                        <TabelaResultado titulo="" dados={dim} />
                      </div>
                    ))}
                    {dimensionamentos.length === 0 && (
                      <p className="text-sm text-gray-500">
                        Nenhum dimensionamento projetado foi salvo.
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
          {activeTab === "leitos" && <LeitosAdminPage />}
          {activeTab === "parametros" && <ParametrosPage />}
        </>
      )}

      {unidade.tipo === "nao-internacao" && activeTab === "sitios" && (
        <SitiosFuncionaisAdminPage />
      )}
    </div>
  );
}

const TabButton = ({ id, activeTab, setActiveTab, label }: any) => (
  <button
    onClick={() => setActiveTab(id)}
    className={`py-4 px-1 border-b-2 font-medium text-sm ${
      activeTab === id
        ? "border-secondary text-secondary"
        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
    }`}
  >
    {label}
  </button>
);
