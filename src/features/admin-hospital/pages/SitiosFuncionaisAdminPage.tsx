import { useState, useEffect, FormEvent } from 'react';
import { useParams } from 'react-router-dom';
import { 
    getUnidadeById, 
    createSitioFuncional, 
    // updateSitioFuncional, 
    // deleteSitioFuncional, 
    UnidadeNaoInternacao, 
    SitioFuncional,
    CreateSitioFuncionalDTO
} from '@/lib/api';
import { Trash2, Edit, Building2 } from 'lucide-react';

export default function SitiosFuncionaisAdminPage() {
    const { setorId: unidadeId } = useParams<{ setorId: string }>();
    const [unidade, setUnidade] = useState<UnidadeNaoInternacao | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [isFormVisible, setIsFormVisible] = useState(false);
    const [formData, setFormData] = useState<Partial<CreateSitioFuncionalDTO>>({ nome: '', descricao: '' });

    const fetchData = async () => {
        if (!unidadeId) return;
        setLoading(true);
        setError(null);
        try {
            // A API buscará a unidade correta, seja ela de internação ou não.
            // O componente pai (SetorDetailPage) já garante que isso só renderize para não-internação.
            const data = await getUnidadeById(unidadeId) as UnidadeNaoInternacao;
            setUnidade(data);
        } catch (err) {
            setError('Falha ao carregar os sítios funcionais.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [unidadeId]);

    const handleAddNew = () => {
        setFormData({ nome: '', descricao: '' });
        setIsFormVisible(true);
    };

    const handleCancel = () => {
        setIsFormVisible(false);
        setFormData({ nome: '', descricao: '' });
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!unidadeId || !formData.nome?.trim()) return;

        try {
            const data: CreateSitioFuncionalDTO = {
                unidadeId,
                nome: formData.nome,
                descricao: formData.descricao,
            };
            await createSitioFuncional(unidadeId, data);
            handleCancel();
            fetchData();
        } catch (err) {
            setError('Falha ao criar o sítio funcional.');
        }
    };

    // Funções de editar e deletar podem ser implementadas aqui quando o backend suportá-las
    // const handleEdit = (sitio: SitioFuncional) => { ... };
    // const handleDelete = async (sitioId: string) => { ... };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-primary flex items-center gap-2">
                    <Building2 /> Gestão de Sítios Funcionais
                </h2>
                <button
                    onClick={isFormVisible ? handleCancel : handleAddNew}
                    className="px-4 py-2 text-white bg-secondary rounded-md hover:opacity-90 transition-opacity"
                >
                    {isFormVisible ? 'Cancelar' : '+ Novo Sítio'}
                </button>
            </div>

            {isFormVisible && (
                <div className="bg-white p-6 rounded-lg border animate-fade-in-down">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <h3 className="text-lg font-semibold text-primary">Adicionar Novo Sítio Funcional</h3>
                        <div>
                            <label htmlFor="nome" className="block text-sm font-medium text-gray-700">Nome do Sítio</label>
                            <input
                                type="text"
                                id="nome"
                                value={formData.nome || ''}
                                onChange={(e) => setFormData(prev => ({...prev, nome: e.target.value}))}
                                className="mt-1 block w-full p-2 border rounded-md"
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="descricao" className="block text-sm font-medium text-gray-700">Descrição</label>
                            <textarea
                                id="descricao"
                                value={formData.descricao || ''}
                                onChange={(e) => setFormData(prev => ({...prev, descricao: e.target.value}))}
                                rows={3}
                                className="mt-1 block w-full p-2 border rounded-md"
                            />
                        </div>
                        <div className="flex justify-end">
                            <button type="submit" className="px-4 py-2 text-white bg-green-600 rounded-md hover:bg-green-700">
                                Salvar Sítio
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="bg-white p-4 rounded-lg border">
                {loading && <p>Carregando...</p>}
                {error && <p className="text-red-500">{error}</p>}
                {!loading && !error && (
                    <table className="min-w-full">
                        <thead>
                            <tr className="border-b">
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Nome</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Descrição</th>
                                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {unidade?.sitiosFuncionais?.map((sitio) => (
                                <tr key={sitio.id}>
                                    <td className="px-4 py-2 whitespace-nowrap text-sm font-medium">{sitio.nome}</td>
                                    <td className="px-4 py-2 whitespace-nowrap text-sm">{sitio.descricao || '-'}</td>
                                    <td className="px-4 py-2 whitespace-nowrap text-right text-sm space-x-2">
                                        <button className="text-gray-400 cursor-not-allowed" title="Editar em breve"><Edit size={18} /></button>
                                        <button className="text-gray-400 cursor-not-allowed" title="Deletar em breve"><Trash2 size={18} /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}