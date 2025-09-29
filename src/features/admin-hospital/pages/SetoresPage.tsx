import { useState, useEffect, FormEvent } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
    getUnidadesInternacao, getUnidadesNaoInternacao, 
    createUnidadeInternacao, createUnidadeNaoInternacao,
    deleteUnidadeInternacao, deleteUnidadeNaoInternacao,
    getScpMetodos,
    Unidade, ScpMetodo 
} from '@/lib/api';
import { Trash2, Edit, Hospital, Building2 } from 'lucide-react';

export default function SetoresPage() {
  const { hospitalId } = useParams<{ hospitalId: string }>();
  const [unidades, setUnidades] = useState<Unidade[]>([]);
  const [scpMetodos, setScpMetodos] = useState<ScpMetodo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [tipoUnidade, setTipoUnidade] = useState<'internacao' | 'nao-internacao' | null>(null);

  // Estados para os formulários
  const [nome, setNome] = useState('');
  const [numeroLeitos, setNumeroLeitos] = useState(0);
  const [scpMetodoId, setScpMetodoId] = useState('');
  const [descricao, setDescricao] = useState('');


  const fetchData = async () => {
    if (!hospitalId) return;
    setLoading(true);
    setError(null);
    try {
      // Busca os dois tipos de unidades e os métodos SCP em paralelo
      const [internacaoData, naoInternacaoData, scpData] = await Promise.all([
        getUnidadesInternacao(hospitalId),
        getUnidadesNaoInternacao(hospitalId),
        getScpMetodos(),
      ]);
      setUnidades([...internacaoData, ...naoInternacaoData]);
      setScpMetodos(scpData);
    } catch (err) {
      setError('Falha ao carregar os setores.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [hospitalId]);
  
  const resetForm = () => {
      setNome('');
      setNumeroLeitos(0);
      setScpMetodoId('');
      setDescricao('');
      setTipoUnidade(null);
      setIsFormVisible(false);
  }

  const handleAddNew = () => {
    setIsFormVisible(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!hospitalId || !tipoUnidade) return;

    try {
        if (tipoUnidade === 'internacao') {
            await createUnidadeInternacao({ hospitalId, nome, numeroLeitos, scpMetodoId: scpMetodoId || undefined });
        } else {
            await createUnidadeNaoInternacao({ hospitalId, nome, descricao });
        }
        resetForm();
        fetchData();
    } catch (err) {
        setError(`Falha ao criar o setor de ${tipoUnidade}.`);
    }
  };

  const handleDelete = async (unidade: Unidade) => {
    const confirmMessage = `Tem a certeza que deseja excluir o setor "${unidade.nome}"?`;
    if (window.confirm(confirmMessage)) {
      try {
        if (unidade.tipo === 'internacao') {
          await deleteUnidadeInternacao(unidade.id);
        } else {
          await deleteUnidadeNaoInternacao(unidade.id);
        }
        fetchData();
      } catch (err) {
        setError(`Falha ao excluir o setor.`);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-primary">Gerenciamento de Setores</h1>
        <button
          onClick={isFormVisible ? resetForm : handleAddNew}
          className="px-4 py-2 text-white bg-secondary rounded-md hover:opacity-90 transition-opacity"
        >
          {isFormVisible ? 'Cancelar' : '+ Novo Setor'}
        </button>
      </div>

      {isFormVisible && (
        <div className="bg-white p-6 rounded-lg border animate-fade-in-down">
          {!tipoUnidade ? (
            <div>
                <h2 className="text-xl font-semibold mb-4 text-primary">Qual tipo de setor deseja criar?</h2>
                <div className="flex gap-4">
                    <button onClick={() => setTipoUnidade('internacao')} className="flex-1 p-4 border rounded-md hover:bg-slate-50 text-center">
                        <Hospital className="mx-auto mb-2 h-8 w-8 text-secondary"/>
                        <span className="font-semibold">Unidade de Internação</span>
                    </button>
                    <button onClick={() => setTipoUnidade('nao-internacao')} className="flex-1 p-4 border rounded-md hover:bg-slate-50 text-center">
                        <Building2 className="mx-auto mb-2 h-8 w-8 text-secondary"/>
                        <span className="font-semibold">Unidade de Não Internação</span>
                    </button>
                </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <h2 className="text-xl font-semibold text-primary">
                Adicionar Nova Unidade de {tipoUnidade === 'internacao' ? 'Internação' : 'Não Internação'}
              </h2>
              
              <input name="nome" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nome do Setor" required className="p-2 w-full border rounded-md"/>

              {tipoUnidade === 'internacao' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input name="numeroLeitos" type="number" value={numeroLeitos} onChange={(e) => setNumeroLeitos(Number(e.target.value))} placeholder="Número de Leitos" required className="p-2 border rounded-md"/>
                  <select name="scpMetodoId" value={scpMetodoId} onChange={(e) => setScpMetodoId(e.target.value)} className="p-2 border rounded-md">
                    <option value="">Selecione um método SCP (opcional)</option>
                    {scpMetodos.map(metodo => <option key={metodo.id} value={metodo.id}>{metodo.title}</option>)}
                  </select>
                </div>
              )}

              {tipoUnidade === 'nao-internacao' && (
                <textarea name="descricao" value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Descrição (opcional)" rows={3} className="p-2 w-full border rounded-md"/>
              )}

              <div className="flex justify-end gap-4">
                <button type="button" onClick={() => setTipoUnidade(null)} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">Voltar</button>
                <button type="submit" className="px-4 py-2 text-white bg-green-600 rounded-md hover:bg-green-700">Salvar Setor</button>
              </div>
            </form>
          )}
        </div>
      )}

      <div className="bg-white p-6 rounded-lg border">
        {loading && <p>A carregar...</p>}
        {error && <p className="text-red-500">{error}</p>}
        {!loading && !error && (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nome</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {unidades.length > 0 ? (
                  unidades.map((unidade) => (
                    <tr key={unidade.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800">
                         <Link to={`/hospital/${hospitalId}/setores/${unidade.id}`} className="hover:underline text-primary">
                          {unidade.nome}
                        </Link>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${unidade.tipo === 'internacao' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}`}>
                            {unidade.tipo === 'internacao' ? 'Internação' : 'Não Internação'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-4">
                        <button disabled className="text-gray-400 cursor-not-allowed"><Edit size={20} /></button>
                        <button onClick={() => handleDelete(unidade)} className="text-red-600 hover:opacity-70"><Trash2 size={20} /></button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan={3} className="px-6 py-4 text-center text-sm text-gray-500">Nenhum setor registado.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}