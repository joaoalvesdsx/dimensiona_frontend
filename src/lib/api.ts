import axios from "axios";

const api = axios.create({
  baseURL: "/api", // Usamos o proxy
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("authToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// --- INTERFACES GERAIS ---
export interface Admin {
  id: string;
  nome: string;
  email: string;
}
export interface Hospital {
  id: string;
  nome: string;
  cnpj: string;
  endereco: string;
  telefone: string;
  regiao?: Regiao;
  baseline?: Baseline;
}

export type CreateHospitalDTO = Omit<Hospital, "id" | "regiao"> & {
  regiaoId?: string;
};
export type UpdateHospitalDTO = Partial<CreateHospitalDTO>;

export interface UnidadeInternacao {
  id: string;
  nome: string;
  leitos: Leito[];
  scpMetodoKey?: string | null;
  tipo: "internacao";
  hospitalId: string;
  horas_extra_reais?: string;
  horas_extra_projetadas?: string;
  cargos_unidade?: CargoUnidade[];
}
export interface UnidadeNaoInternacao {
  id: string;
  nome: string;
  tipo: "nao-internacao";
  sitiosFuncionais: SitioFuncional[];
  hospitalId: string;
  descricao?: string;
  horas_extra_reais?: string;
  horas_extra_projetadas?: string;
  cargos_unidade?: CargoUnidade[];
}
export type Unidade = UnidadeInternacao | UnidadeNaoInternacao;

export type CargoUnidade = {
  id: string; // Adicionado ID para referência
  cargo: Cargo;
  quantidade_funcionarios: number;
};

export type CreateUnidadeInternacaoDTO = {
  hospitalId: string;
  nome: string;
  numeroLeitos: number;
  scpMetodoId?: string;
  horas_extra_reais?: string;
  horas_extra_projetadas?: string;
  cargos_unidade: { cargoId: string; quantidade_funcionarios: number }[];
};
export type CreateUnidadeNaoInternacaoDTO = {
  hospitalId: string;
  nome: string;
  descricao?: string;
  horas_extra_reais?: string;
  horas_extra_projetadas?: string;
  cargos_unidade: { cargoId: string; quantidade_funcionarios: number }[];
};

export type UpdateUnidadeInternacaoDTO = Partial<CreateUnidadeInternacaoDTO>;
export type UpdateUnidadeNaoInternacaoDTO =
  Partial<CreateUnidadeNaoInternacaoDTO>;

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  cpf?: string;
  permissao: "ADMIN" | "GESTOR" | "COMUM";
}
export interface CreateUsuarioDTO {
  hospitalId: string;
  nome: string;
  email: string;
  cpf?: string;
  permissao: "ADMIN" | "GESTOR" | "COMUM";
  senha?: string;
}
export type UpdateUsuarioDTO = Partial<
  Omit<CreateUsuarioDTO, "hospitalId" | "senha">
>;

export interface Cargo {
  id: string;
  nome: string;
  salario?: string;
  carga_horaria?: string;
  descricao?: string;
  adicionais_tributos?: string;
}
export type CreateCargoDTO = Omit<Cargo, "id"> & { hospitalId: string };
export type UpdateCargoDTO = Partial<Omit<Cargo, "id">>;

export interface SetorBaseline {
  nome: string;
  custo: string;
  ativo: boolean;
}
export interface Baseline {
  id: string;
  nome: string;
  quantidade_funcionarios: number;
  custo_total: string;
  setores: SetorBaseline[];
}
export type CreateBaselineDTO = Omit<Baseline, "id"> & { hospitalId: string };
export type UpdateBaselineDTO = Partial<Omit<Baseline, "id">>;

export interface Rede {
  id: string;
  nome: string;
}

export interface Grupo {
  id: string;
  nome: string;
  rede: Rede;
}
export interface CreateGrupoDTO {
  nome: string;
  redeId: string;
}

export interface Regiao {
  id: string;
  nome: string;
  grupo: Grupo;
}
export interface CreateRegiaoDTO {
  nome: string;
  grupoId: string;
}
export interface UpdateRegiaoDTO {
  nome?: string;
  grupoId?: string;
}

export enum StatusLeito {
  ATIVO = "ATIVO",
  PENDENTE = "PENDENTE",
  VAGO = "VAGO",
  INATIVO = "INATIVO",
}
export interface Leito {
  id: string;
  numero: string;
  status: StatusLeito;
}
export interface CreateLeitoDTO {
  unidadeId: string;
  numero: string;
}
export type UpdateLeitoDTO = Partial<{
  justificativa?: string | null;
  status: string;
}>;

export interface SessaoAtiva {
  id: string;
  leito: Leito;
  prontuario: string | null;
  classificacao: string;
  itens: Record<string, number>;
}
export interface AdmitirPacienteDTO {
  leitoId: string;
  unidadeId: string;
  prontuario: string;
  colaboradorId: string;
  scp: string;
}
export interface ScpQuestion {
  key: string;
  text: string;
  options: { label: string; value: number }[];
}
export interface ScpSchema {
  scp: string;
  title: string;
  questions: ScpQuestion[];
}
export interface UpdateSessaoDTO {
  itens: Record<string, number>;
  colaboradorId: string;
}
export interface ScpMetodo {
  id: string;
  key: string;
  title: string;
  description?: string;
  questions: ScpQuestion[];
  faixas: any[];
}
export type CreateScpMetodoDTO = Omit<ScpMetodo, "id">;

export interface Dimensionamento {
  id: string;
  unidadeId: string;
  enfermeiroCargoHorario: number;
  enfermeiroPercentualEquipe: number;
  tecnicoEnfermagemCargoHorario: number;
  tecnicoEnfermagemPercentualEquipe: number;
  indiceTecnico: number;
  idadeEquipeRestricoes: "sim" | "nao";
  quantidadeLeitos: number;
  taxaOcupacao: number;
  pcm: number;
  pci: number;
  pcad: number;
  pcsi: number;
  pcit: number;
  createdAt: string;
}
export type CreateDimensionamentoDTO = Omit<
  Dimensionamento,
  "id" | "unidadeId" | "createdAt"
>;

export interface HospitalStats {
  totalLeitos: number;
  taxaOcupacaoMedia: number;
  unidades: Array<{
    distribuicao: Record<string, number>;
    ocupacao: {
      taxaOcupacao: number;
    };
    totalLeitos: number;
    unidade: {
      id: string;
      nome: string;
    };
  }>;
}

export interface SitioFuncional {
  id: string;
  nome: string;
  descricao?: string;
}
export interface CreateSitioFuncionalDTO {
  unidadeId: string;
  nome: string;
  descricao?: string;
}

export interface CreateParametrosDTO {
  nome_enfermeiro?: string;
  numero_coren?: string;
  aplicarIST?: boolean;
  ist?: number;
  diasSemana?: number;
}
export type ParametrosUnidade = CreateParametrosDTO & { id: string };

// Interfaces para Questionários e Coletas
export interface Pergunta {
  id: string;
  categoria: string;
  texto: string;
  tipoResposta: "sim_nao_na" | "texto" | "numero" | "data" | "multipla_escolha";
  opcoes?: string[];
  obrigatoria: boolean;
}

export interface Questionario {
  id: string;
  nome: string;
  perguntas: Pergunta[];
}
export type CreateQuestionarioDTO = Omit<Questionario, "id">;
export type UpdateQuestionarioDTO = Partial<CreateQuestionarioDTO>;

export interface RespostaColeta {
  perguntaId: string;
  valor: any;
  comentario?: string;
  fotoUrl?: string;
}
export interface Coleta {
  id: string;
  localNome: string;
  respostas: RespostaColeta[];
  questionario: Questionario;
  colaborador?: { id: string; nome: string };
  created_at: string;
}

// Interfaces para Cargos em Sítios
export interface CargoSitio {
  id: string;
  quantidade_funcionarios: number;
  cargoUnidade: {
    id: string;
    cargo: Cargo;
  };
}

// --- INTERFACES PARA DIMENSIONAMENTO (BASEADO NO DTO DO BACKEND) ---
export interface LinhaAnaliseFinanceira {
  cargoId: string;
  cargoNome: string;
  isScpCargo: boolean;
  salario: number;
  adicionais: number;
  valorHorasExtras: number;
  custoPorFuncionario: number;
  cargaHoraria: number;
  quantidadeAtual: number;
  quantidadeProjetada: number;
}

export interface AnaliseInternacaoResponse {
  agregados: {
    periodo: {
      inicio: string;
      fim: string;
      dias: number;
    };
    totalLeitosDia: number;
    totalAvaliacoes: number;
    taxaOcupacaoMensal: number;
  };
  tabela: LinhaAnaliseFinanceira[];
}

export interface GrupoCargosNaoInternacao {
  id: string;
  nome: string;
  cargos: LinhaAnaliseFinanceira[];
}

export interface AnaliseNaoInternacaoResponse {
  tabela: GrupoCargosNaoInternacao[];
  horasExtrasProjetadas: number;
}

// --- FUNÇÕES DA API ---

// ADMIN GLOBAL
export const getAdmins = async (): Promise<Admin[]> => {
  console.warn(
    "API para listar admins não encontrada no backend. Retornando array vazio."
  );
  return Promise.resolve([]);
};
export const createAdmin = async (data: any): Promise<Admin> => {
  const response = await api.post("/admin/criar", data);
  return response.data;
};
export const deleteAdmin = async (id: string): Promise<void> => {
  console.warn(`API para deletar admin ${id} não encontrada no backend.`);
  return Promise.resolve();
};

// HOSPITAIS
export const getHospitais = async (): Promise<Hospital[]> => {
  const response = await api.get("/hospitais");
  return response.data;
};
export const getHospitalById = async (id: string): Promise<Hospital> => {
  const response = await api.get(`/hospitais/${id}`);
  return response.data;
};
export const createHospital = async (
  data: CreateHospitalDTO
): Promise<Hospital> => {
  const response = await api.post("/hospitais", data);
  return response.data;
};
export const updateHospital = async (
  hospitalId: string,
  data: UpdateHospitalDTO
): Promise<Hospital> => {
  const response = await api.put(`/hospitais/${hospitalId}`, data);
  return response.data;
};
export const deleteHospital = async (hospitalId: string): Promise<void> => {
  await api.delete(`/hospitais/${hospitalId}`);
};

// REDES, GRUPOS, REGIOES
export const getRedes = async (): Promise<Rede[]> => {
  const response = await api.get("/redes");
  return response.data;
};
export const createRede = async (nome: string): Promise<Rede> => {
  const response = await api.post("/redes", { nome });
  return response.data;
};
export const updateRede = async (
  redeId: string,
  nome: string
): Promise<Rede> => {
  const response = await api.put(`/redes/${redeId}`, { nome });
  return response.data;
};
export const deleteRede = async (redeId: string): Promise<void> => {
  await api.delete(`/redes/${redeId}`);
};
export const getGrupos = async (): Promise<Grupo[]> => {
  const response = await api.get("/grupos");
  return response.data;
};
export const createGrupo = async (data: CreateGrupoDTO): Promise<Grupo> => {
  const response = await api.post("/grupos", data);
  return response.data;
};
export const updateGrupo = async (
  grupoId: string,
  data: Partial<CreateGrupoDTO>
): Promise<Grupo> => {
  const response = await api.put(`/grupos/${grupoId}`, data);
  return response.data;
};
export const deleteGrupo = async (grupoId: string): Promise<void> => {
  await api.delete(`/grupos/${grupoId}`);
};
export const getRegioes = async (): Promise<Regiao[]> => {
  const response = await api.get("/regioes");
  return response.data;
};
export const createRegiao = async (data: CreateRegiaoDTO): Promise<Regiao> => {
  const response = await api.post("/regioes", data);
  return response.data;
};
export const updateRegiao = async (
  regiaoId: string,
  data: UpdateRegiaoDTO
): Promise<Regiao> => {
  const response = await api.put(`/regioes/${regiaoId}`, data);
  return response.data;
};
export const deleteRegiao = async (regiaoId: string): Promise<void> => {
  await api.delete(`/regioes/${regiaoId}`);
};

// UNIDADES (SETORES)
export const getUnidadesInternacao = async (
  hospitalId: string
): Promise<UnidadeInternacao[]> => {
  const response = await api.get(`/unidades`, { params: { hospitalId } });
  return response.data.map((u: any) => ({
    ...u,
    tipo: "internacao",
    hospitalId,
  }));
};
export const getUnidadesNaoInternacao = async (
  hospitalId: string
): Promise<UnidadeNaoInternacao[]> => {
  const response = await api.get(
    `/unidades-nao-internacao/hospital/${hospitalId}`
  );
  return response.data.data.map((u: any) => ({
    ...u,
    tipo: "nao-internacao",
    hospitalId,
  }));
};
export const createUnidadeInternacao = async (
  data: CreateUnidadeInternacaoDTO
): Promise<UnidadeInternacao> => {
  const response = await api.post("/unidades", data);
  return response.data;
};
export const createUnidadeNaoInternacao = async (
  data: CreateUnidadeNaoInternacaoDTO
): Promise<UnidadeNaoInternacao> => {
  const response = await api.post("/unidades-nao-internacao", data);
  return response.data;
};

export const updateUnidadeInternacao = async (
  setorId: string,
  data: UpdateUnidadeInternacaoDTO
): Promise<UnidadeInternacao> => {
  const response = await api.put(`/unidades/${setorId}`, data);
  return response.data;
};

export const updateUnidadeNaoInternacao = async (
  setorId: string,
  data: UpdateUnidadeNaoInternacaoDTO
): Promise<UnidadeNaoInternacao> => {
  const response = await api.put(`/unidades-nao-internacao/${setorId}`, data);
  console.log("Data :", data);
  return response.data;
};

export const deleteUnidadeInternacao = async (
  setorId: string
): Promise<void> => {
  await api.delete(`/unidades/${setorId}`);
};
export const deleteUnidadeNaoInternacao = async (
  setorId: string
): Promise<void> => {
  await api.delete(`/unidades-nao-internacao/${setorId}`);
};

// MÉTODOS SCP
export const getScpMetodos = async (): Promise<ScpMetodo[]> => {
  const response = await api.get("/scp-metodos");
  return response.data;
};
export const createScpMetodo = async (
  data: CreateScpMetodoDTO
): Promise<ScpMetodo> => {
  const response = await api.post("/scp-metodos", data);
  return response.data;
};
export const updateScpMetodo = async (
  id: string,
  data: CreateScpMetodoDTO
): Promise<ScpMetodo> => {
  const response = await api.put(`/scp-metodos/${id}`, data);
  return response.data;
};
export const deleteScpMetodo = async (id: string): Promise<void> => {
  await api.delete(`/scp-metodos/${id}`);
};

// USUÁRIOS (COLABORADORES)
export const getUsuariosByHospitalId = async (
  hospitalId: string
): Promise<Usuario[]> => {
  const response = await api.get("/colaboradores", { params: { hospitalId } });
  return response.data;
};
export const createUsuario = async (
  data: CreateUsuarioDTO
): Promise<Usuario> => {
  const response = await api.post("/colaboradores", data);
  return response.data;
};
export const updateUsuario = async (
  usuarioId: string,
  data: UpdateUsuarioDTO
): Promise<Usuario> => {
  const response = await api.patch(`/colaboradores/${usuarioId}`, data);
  return response.data;
};
export const deleteUsuario = async (usuarioId: string): Promise<void> => {
  await api.delete(`/colaboradores/${usuarioId}`);
};

// CARGOS
export const getCargosByHospitalId = async (
  hospitalId: string
): Promise<Cargo[]> => {
  const { data } = await api.get(`/hospitais/${hospitalId}/cargos`);
  return data;
};
export const createCargo = async (data: CreateCargoDTO): Promise<Cargo> => {
  const response = await api.post(`/hospitais/${data.hospitalId}/cargos`, data);
  return response.data;
};
export const updateCargo = async (
  hospitalId: string,
  cargoId: string,
  data: UpdateCargoDTO
): Promise<Cargo> => {
  const response = await api.patch(
    `/hospitais/${hospitalId}/cargos/${cargoId}`,
    data
  );
  return response.data;
};
export const deleteCargo = async (
  hospitalId: string,
  cargoId: string
): Promise<void> => {
  await api.delete(`/hospitais/${hospitalId}/cargos/${cargoId}`);
};

// BASELINE
export const getBaselinesByHospitalId = async (
  hospitalId: string
): Promise<Baseline> => {
  const response = await api.get("/baselines");
  const Baselines = response.data as Baseline;
  return Baselines || null;
};
export const createBaseline = async (
  data: CreateBaselineDTO
): Promise<Baseline> => {
  const response = await api.post("/baselines", data);
  return response.data;
};
export const updateBaseline = async (
  baselineId: string,
  data: UpdateBaselineDTO
): Promise<Baseline> => {
  const response = await api.put(`/baselines/${baselineId}`, data);
  return response.data;
};
export const deleteBaseline = async (baselineId: string): Promise<void> => {
  await api.delete(`/baselines/${baselineId}`);
};

export const getUnidadeById = async (
  unidadeId: string
): Promise<UnidadeInternacao | UnidadeNaoInternacao> => {
  try {
    const response = await api.get(`/unidades/${unidadeId}`);
    return { ...response.data, tipo: "internacao" };
  } catch (error) {
    const response = await api.get(`/unidades-nao-internacao/${unidadeId}`);

    const data = response.data; // Acessa a propriedade 'data'
    if (data.cargosUnidade) {
      data.cargos_unidade = data.cargosUnidade;
      delete data.cargosUnidade;
    }

    return { ...data, tipo: "nao-internacao" };
  }
};
export const getSessoesAtivasByUnidadeId = async (
  unidadeId: string
): Promise<SessaoAtiva[]> => {
  const response = await api.get("/avaliacoes/sessoes-ativas", {
    params: { unidadeId },
  });
  return response.data;
};
export const admitirPaciente = async (
  data: AdmitirPacienteDTO
): Promise<SessaoAtiva> => {
  const payload = { ...data, itens: {} };
  const response = await api.post("/avaliacoes/sessao", payload);
  return response.data;
};
export const getScpSchema = async (scpKey: string): Promise<ScpSchema> => {
  const response = await api.get("/avaliacoes/schema", {
    params: { scp: scpKey },
  });
  return response.data;
};
export const updateSessao = async (
  sessaoId: string,
  data: UpdateSessaoDTO
): Promise<SessaoAtiva> => {
  const response = await api.put(`/avaliacoes/sessao/${sessaoId}`, data);
  return response.data;
};
export const liberarSessao = async (sessaoId: string): Promise<void> => {
  await api.post(`/avaliacoes/sessao/${sessaoId}/liberar`);
};
export const changePassword = async (
  colaboradorId: string,
  novaSenha: string
): Promise<void> => {
  await api.patch(`/colaboradores/${colaboradorId}/senha`, {
    senha: novaSenha,
  });
};

// DIMENSIONAMENTO (ANTIGO)
export const getDimensionamentosPorUnidade = async (
  unidadeId: string
): Promise<Dimensionamento[]> => {
  const response = await api.get(`/unidades/${unidadeId}/dimensionamento`);
  return response.data;
};
export const createDimensionamento = async (
  unidadeId: string,
  data: CreateDimensionamentoDTO
): Promise<Dimensionamento> => {
  const response = await api.post(
    `/unidades/${unidadeId}/dimensionamento`,
    data
  );
  return response.data;
};

// --- NOVAS ROTAS DE DIMENSIONAMENTO ---
export const getAnaliseInternacao = async (
  unidadeId: string
): Promise<AnaliseInternacaoResponse> => {
  const response = await api.get(`/dimensionamento/internacao/${unidadeId}`);
  return response.data;
};

export const getAnaliseNaoInternacao = async (
  unidadeId: string
): Promise<AnaliseNaoInternacaoResponse> => {
  const response = await api.get(
    `/dimensionamento/nao-internacao/${unidadeId}`
  );
  return response.data;
};

// ESTATÍSTICAS E RELATÓRIOS
export const getHospitalStats = async (
  hospitalId: string
): Promise<HospitalStats> => {
  const response = await api.get(`/estatisticas/hospital/${hospitalId}/json`);
  return response.data;
};

// LEITOS (Admin)
export const getLeitosByUnidade = async (
  unidadeId: string
): Promise<Leito[]> => {
  const response = await api.get("/leitos", { params: { unidadeId } });
  return response.data;
};
export const createLeito = async (data: CreateLeitoDTO): Promise<Leito> => {
  const response = await api.post("/leitos", data);
  return response.data;
};
export const updateLeito = async (
  leitoId: string,
  data: UpdateLeitoDTO
): Promise<Leito> => {
  const response = await api.patch(`/leitos/${leitoId}/status`, data);
  return response.data;
};
export const deleteLeito = async (leitoId: string): Promise<void> => {
  await api.delete(`/leitos/${leitoId}`);
};

// PARAMETROS (Admin)
export const getParametros = async (
  unidadeId: string
): Promise<ParametrosUnidade> => {
  const response = await api.get(`/parametros/unidade/${unidadeId}`);
  return response.data;
};
export const saveParametros = async (
  unidadeId: string,
  data: CreateParametrosDTO
): Promise<ParametrosUnidade> => {
  const response = await api.post(`/parametros/unidade/${unidadeId}`, data);
  return response.data;
};

// SÍTIOS FUNCIONAIS (Admin)
export const createSitioFuncional = async (
  unidadeId: string,
  data: CreateSitioFuncionalDTO
): Promise<SitioFuncional> => {
  const response = await api.post(
    `/unidades-nao-internacao/${unidadeId}/sitios`,
    data
  );
  return response.data;
};
export const updateSitioFuncional = async (
  sitioId: string,
  data: Partial<CreateSitioFuncionalDTO>
): Promise<SitioFuncional> => {
  const response = await api.put(`/sitios/sitios-funcionais/${sitioId}`, data);
  return response.data;
};
export const deleteSitioFuncional = async (sitioId: string): Promise<void> => {
  await api.delete(`/sitios/sitios-funcionais/${sitioId}`);
};

// GESTÃO DE CARGOS EM SÍTIOS
export const getCargosPorSitio = async (
  sitioId: string
): Promise<CargoSitio[]> => {
  const response = await api.get(`/sitios/sitios-funcionais/${sitioId}/cargos`);
  return response.data.data;
};
export const addCargoASitio = async (
  sitioId: string,
  data: { cargoUnidadeId: string; quantidade_funcionarios: number }
): Promise<CargoSitio> => {
  const response = await api.post(
    `/sitios/sitios-funcionais/${sitioId}/cargos`,
    data
  );
  return response.data;
};
export const deleteCargoDeSitio = async (
  cargoSitioId: string
): Promise<void> => {
  await api.delete(`/sitios/sitios-funcionais/cargos/${cargoSitioId}`);
};

// QUESTIONÁRIOS E COLETAS
export const getQuestionarios = async (): Promise<Questionario[]> => {
  const response = await api.get("/questionarios");
  return response.data.questionarios;
};
export const createQuestionario = async (
  data: CreateQuestionarioDTO
): Promise<Questionario> => {
  const response = await api.post("/questionarios", data);
  return response.data;
};
export const updateQuestionario = async (
  id: string,
  data: UpdateQuestionarioDTO
): Promise<Questionario> => {
  const response = await api.put(`/questionarios/${id}`, data);
  return response.data;
};
export const deleteQuestionario = async (id: string): Promise<void> => {
  await api.delete(`/questionarios/${id}`);
};
export const createColeta = async (data: FormData): Promise<any> => {
  const response = await api.post("/coletas", data, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
};
export const getColetasPorHospital = async (
  hospitalId: string
): Promise<Coleta[]> => {
  const response = await api.get(`/coletas/hospital/${hospitalId}`);
  return response.data;
};
export const deleteColeta = async (id: string): Promise<void> => {
  await api.delete(`/coletas/${id}`);
};

export default api;
