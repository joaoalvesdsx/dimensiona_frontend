import { useState, useEffect, FormEvent } from 'react';
import { useParams } from 'react-router-dom';
import { getBaselinesByHospitalId, createBaseline, updateBaseline, deleteBaseline, Baseline, CreateBaselineDTO, UpdateBaselineDTO, SetorBaseline } from '@/lib/api';
import { Trash2, Edit, PlusCircle } from 'lucide-react';

const initialFormState: Omit<Baseline, 'id'> = {
    nome: '',
    quantidade_funcionarios: 0,
    custo_total: '',
    setores: [],
};

export default function BaselinePage() {
  const { hospitalId } = useParams<{ hospitalId: string }>();
  const [baselines, setBaselines] = useState<Baseline[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isFormVisible, setIsFormVisible] = useState(false);
  const [formData, setFormData] = useState<Partial<Baseline>>(initialFormState);

  const fetchBaselines = async () => {
    if (!hospitalId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getBaselinesByHospitalId(hospitalId);
      setBaselines(data);
    } catch (err) {
      setError('Falha ao carregar os baselines.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBaselines();
  }, [hospitalId]);

  const handleEdit = (baseline: Baseline) => {
    setFormData(baseline);
    setIsFormVisible(true);
  };

  const handleAddNew = () => {
    setFormData(initialFormState);
    setIsFormVisible(true);
  };

  const handleCancel = () => {
    setIsFormVisible(false);
    setFormData(initialFormState);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'number' ? Number(value) : value }));
  };

  const handleSetorChange = (index: number, field: keyof SetorBaseline, value: string | boolean) => {
      const novosSetores = [...(formData.setores || [])];
      novosSetores[index] = { ...novosSetores[index], [field]: value };
      setFormData(prev => ({ ...prev, setores: novosSetores }));
  };
  
  const addSetor = () => {
      const novosSetores = [...(formData.setores || []), { nome: '', custo: '', ativo: true }];
      setFormData(prev => ({ ...prev, setores: novosSetores }));
  };

  const removeSetor = (index: number) => {
      const novosSetores = [...(formData.setores || [])];
      novosSetores.splice(index, 1);
      setFormData(prev => ({ ...prev, setores: novosSetores }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!hospitalId || !formData.nome?.trim()) return;

    try {
      if (formData.id) {
        const updateData: UpdateBaselineDTO = { ...formData };
        delete updateData.id;
        await updateBaseline(formData.id, updateData);
      } else {
        const createData: CreateBaselineDTO = { hospitalId, ...initialFormState, ...formData };
        await createBaseline(createData);
      }
      handleCancel();
      fetchBaselines();
    } catch (err) {
      setError(formData.id ? 'Falha ao atualizar o baseline.' : 'Falha ao criar o baseline.');
      console.error(err);
    }
  };

  const handleDelete = async (baselineId: string) => {
    if (window.confirm('Tem certeza que deseja excluir este baseline?')) {
      try {
        await deleteBaseline(baselineId);
        fetchBaselines();
      } catch (err) {
        setError('Falha ao excluir o baseline.');
        console.error(err);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-primary">Gerenciamento de Baseline</h1>
        <button
          onClick={isFormVisible ? handleCancel : handleAddNew}
          className="px-4 py-2 text-white bg-secondary rounded-md hover:opacity-90 transition-opacity"
        >
          {isFormVisible ? 'Cancelar' : '+ Novo Baseline'}
        </button>
      </div>

      {isFormVisible && (
        <div className="bg-white p-6 rounded-lg border animate-fade-in-down">
          <form onSubmit={handleSubmit} className="space-y-6">
            <h2 className="text-xl font-semibold text-primary">{formData.id ? 'Editar Baseline' : 'Adicionar Novo Baseline'}</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input name="nome" value={formData.nome || ''} onChange={handleChange} placeholder="Nome do Baseline" required className="p-2 border rounded-md"/>
              <input name="quantidade_funcionarios" type="number" value={formData.quantidade_funcionarios || ''} onChange={handleChange} placeholder="Qtd. Funcionários" className="p-2 border rounded-md"/>
              <input name="custo_total" value={formData.custo_total || ''} onChange={handleChange} placeholder="Custo Total (R$)" className="p-2 border rounded-md"/>
            </div>

            <div>
                <h3 className="text-lg font-medium text-gray-800 mb-2">Setores de Custo</h3>
                <div className="space-y-3">
                    {formData.setores?.map((setor, index) => (
                        <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-center">
                            <input value={setor.nome} onChange={(e) => handleSetorChange(index, 'nome', e.target.value)} placeholder="Nome do Setor" className="p-2 border rounded-md"/>
                            <input value={setor.custo} onChange={(e) => handleSetorChange(index, 'custo', e.target.value)} placeholder="Custo (R$)" className="p-2 border rounded-md"/>
                            <label className="flex items-center gap-2 text-sm">
                                <input type="checkbox" checked={setor.ativo} onChange={(e) => handleSetorChange(index, 'ativo', e.target.checked)} className="rounded"/>
                                Ativo
                            </label>
                            <button type="button" onClick={() => removeSetor(index)} className="text-red-500 hover:text-red-700 justify-self-start">
                                <Trash2 size={18} />
                            </button>
                        </div>
                    ))}
                </div>
                <button type="button" onClick={addSetor} className="mt-3 flex items-center gap-2 text-sm text-secondary hover:underline">
                    <PlusCircle size={18}/> Adicionar Setor
                </button>
            </div>
            
            <div className="flex justify-end pt-4 border-t">
              <button type="submit" className="px-4 py-2 text-white bg-green-600 rounded-md hover:bg-green-700">
                Salvar Baseline
              </button>
            </div>
          </form>
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Funcionários</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Custo Total</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {baselines.length > 0 ? (
                  baselines.map((baseline) => (
                    <tr key={baseline.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800">{baseline.nome}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{baseline.quantidade_funcionarios || 0}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{baseline.custo_total ? `R$ ${baseline.custo_total}` : '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-4">
                        <button onClick={() => handleEdit(baseline)} className="text-secondary hover:opacity-70">
                          <Edit size={20} />
                        </button>
                        <button onClick={() => handleDelete(baseline.id)} className="text-red-600 hover:opacity-70">
                          <Trash2 size={20} />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">
                      Nenhum baseline registado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}