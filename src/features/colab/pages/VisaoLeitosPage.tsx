import { useEffect, useState, FormEvent } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  getUnidadeById,
  getSessoesAtivasByUnidadeId,
  UnidadeInternacao,
  Leito,
  SessaoAtiva,
  StatusLeito,
  admitirPaciente,
  liberarSessao,
} from "../../../lib/api";
import { useAuth } from "../../../contexts/AuthContext";
import { Bed, User, CheckCircle, Star, LogOut } from "lucide-react";

const getStatusInfo = (status: StatusLeito) => {
  switch (status) {
    case StatusLeito.ATIVO:
      return {
        class: "bg-red-100 border-red-400 text-red-700",
        text: "Ocupado",
      };
    case StatusLeito.VAGO:
      return {
        class: "bg-green-100 border-green-400 text-green-700",
        text: "Vago",
      };
    case StatusLeito.PENDENTE:
      return {
        class: "bg-yellow-100 border-yellow-400 text-yellow-700",
        text: "Pendente",
      };
    case StatusLeito.INATIVO:
      return {
        class: "bg-gray-200 border-gray-400 text-gray-600 cursor-not-allowed",
        text: "Inativo",
      };
    default:
      return { class: "bg-gray-100 border-gray-300", text: "Desconhecido" };
  }
};

export default function VisaoLeitosPage() {
  const { unidadeId } = useParams<{ unidadeId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [unidade, setUnidade] = useState<UnidadeInternacao | null>(null);
  const [sessoes, setSessoes] = useState<SessaoAtiva[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [leitoSelecionado, setLeitoSelecionado] = useState<string | null>(null);
  const [prontuario, setProntuario] = useState("");

  const fetchData = async () => {
    if (!unidadeId) return;
    setLoading(true);
    setError(null);
    try {
      const [unidadeData, sessoesData] = await Promise.all([
        getUnidadeById(unidadeId),
        getSessoesAtivasByUnidadeId(unidadeId),
      ]);
      setUnidade(unidadeData);
      setSessoes(sessoesData);
    } catch (error) {
      setError("Falha ao buscar dados da unidade");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [unidadeId]);

  const handleLeitoClick = (leitoId: string, status: StatusLeito) => {
    if (status === StatusLeito.VAGO || status === StatusLeito.PENDENTE) {
      setLeitoSelecionado(leitoSelecionado === leitoId ? null : leitoId);
      setProntuario("");
    }
  };

  const handleAdmitir = async (e: FormEvent) => {
    e.preventDefault();
    if (
      !unidadeId ||
      !leitoSelecionado ||
      !user?.id ||
      !unidade?.scpMetodoKey ||
      prontuario.length < 3
    ) {
      setError("Prontuário deve ter no mínimo 3 caracteres.");
      return;
    }

    try {
      await admitirPaciente({
        unidadeId,
        leitoId: leitoSelecionado,
        prontuario,
        colaboradorId: user.id,
        scp: unidade.scpMetodoKey,
      });
      setLeitoSelecionado(null);
      setProntuario("");
      fetchData();
    } catch (error) {
      setError("Falha ao admitir paciente.");
    }
  };

  const handleDarAlta = async (sessaoId: string) => {
    if (
      window.confirm("Tem certeza que deseja dar alta para esta internação?")
    ) {
      try {
        await liberarSessao(sessaoId);
        fetchData();
      } catch (err) {
        setError("Falha ao dar alta.");
      }
    }
  };

  const sessoesPorLeitoId = new Map(sessoes.map((s) => [s.leito.id, s]));

  if (loading) return <p>A carregar leitos...</p>;
  if (error) return <p className="text-red-500">{error}</p>;
  if (!unidade) return <p>Unidade não encontrada.</p>;

  const backLink =
    user?.appRole === "ADMIN"
      ? `/hospital/${unidade.hospitalId}/unidades-leitos`
      : "/meu-hospital";

  return (
    <div className="space-y-6 p-8">
      <div>
        <Link to={backLink} className="text-sm text-gray-500 hover:underline">
          &larr; Voltar para Unidades
        </Link>
        <h1 className="text-3xl font-bold text-primary">{unidade.nome}</h1>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
        {unidade.leitos?.map((leito) => {
          const sessao = sessoesPorLeitoId.get(leito.id);
          const statusAtual = sessao ? StatusLeito.ATIVO : leito.status;
          const statusInfo = getStatusInfo(statusAtual);
          const isClickable =
            statusAtual === StatusLeito.VAGO ||
            statusAtual === StatusLeito.PENDENTE;

          return (
            <div key={leito.id} className="relative">
              <div
                onClick={() =>
                  isClickable && handleLeitoClick(leito.id, statusAtual)
                }
                className={`w-full p-4 border-2 rounded-lg flex flex-col items-center justify-center transition-all ${
                  statusInfo.class
                } ${
                  isClickable
                    ? "cursor-pointer hover:shadow-lg hover:border-secondary"
                    : ""
                }`}
              >
                <Bed size={32} />
                <p className="mt-2 font-bold text-lg">{leito.numero}</p>
                <p className="text-xs uppercase font-semibold">
                  {statusInfo.text}
                </p>
                {sessao && (
                  <div className="mt-2 text-center text-xs flex items-center">
                    <User size={12} className="mr-1" />
                    <span>{sessao.prontuario || "Ocupado"}</span>
                  </div>
                )}
              </div>

              {sessao && (
                <div className="mt-2 space-y-2">
                  <button
                    onClick={() =>
                      navigate(
                        `/unidade/${unidadeId}/sessao/${sessao.id}/avaliar`
                      )
                    }
                    className="w-full flex justify-center items-center gap-2 px-3 py-1.5 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700"
                  >
                    <Star size={16} /> Avaliar
                  </button>
                  <button
                    onClick={() => handleDarAlta(sessao.id)}
                    className="w-full flex justify-center items-center gap-2 px-3 py-1.5 text-sm text-white bg-orange-500 rounded-md hover:bg-orange-600"
                  >
                    <LogOut size={16} /> Dar Alta
                  </button>
                </div>
              )}

              {leitoSelecionado === leito.id && (
                <form
                  onSubmit={handleAdmitir}
                  className="mt-2 p-3 bg-white border rounded-md shadow-sm animate-fade-in-down"
                >
                  <label
                    htmlFor="prontuario"
                    className="text-xs font-medium text-gray-700"
                  >
                    Nº do Prontuário
                  </label>
                  <input
                    id="prontuario"
                    type="text"
                    value={prontuario}
                    onChange={(e) => setProntuario(e.target.value)}
                    minLength={3}
                    required
                    autoFocus
                    className="mt-1 w-full p-1.5 border rounded-md text-sm focus:ring-1 focus:ring-secondary focus:border-secondary"
                  />
                  <button
                    type="submit"
                    className="mt-2 w-full flex justify-center items-center gap-2 px-3 py-1.5 text-sm text-white bg-green-600 rounded-md hover:bg-green-700"
                  >
                    <CheckCircle size={16} /> Admitir
                  </button>
                </form>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
