import { useState, useEffect, FormEvent } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getUnidadeById, getScpSchema, updateSessao, Setor, ScpSchema } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

export default function AvaliacaoScpPage() {
    const { unidadeId, sessaoId } = useParams<{ unidadeId: string, sessaoId: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    
    const [unidade, setUnidade] = useState<Setor | null>(null);
    const [schema, setSchema] = useState<ScpSchema | null>(null);
    const [respostas, setRespostas] = useState<Record<string, number>>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            if (!unidadeId) return;
            try {
                const unidadeData = await getUnidadeById(unidadeId);
                setUnidade(unidadeData);
                if (unidadeData.scpMetodoKey) {
                    const schemaData = await getScpSchema(unidadeData.scpMetodoKey);
                    setSchema(schemaData);
                } else {
                    setError("Esta unidade não possui um método de avaliação configurado.");
                }
            } catch (err) {
                setError("Falha ao carregar dados da avaliação.");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [unidadeId]);

    const handleSelectChange = (questionKey: string, value: string) => {
        setRespostas(prev => ({ ...prev, [questionKey]: Number(value) }));
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!sessaoId || !user?.id || Object.keys(respostas).length !== schema?.questions.length) {
            setError("Por favor, responda todas as perguntas.");
            return;
        }
        try {
            await updateSessao(sessaoId, { colaboradorId: user.id, itens: respostas });
            navigate(`/unidade/${unidadeId}/leitos`);
        } catch (err) {
            setError("Falha ao salvar avaliação.");
        }
    };

    if (loading) return <p>A carregar formulário...</p>;
    if (error) return <p className="text-red-500">{error}</p>;
    if (!schema) return <p>Formulário de avaliação não encontrado.</p>;

    return (
        <div className="space-y-6">
            <div>
                <Link to={`/unidade/${unidadeId}/leitos`} className="text-sm text-gray-500 hover:underline">&larr; Voltar para Leitos</Link>
                <h1 className="text-3xl font-bold text-primary">Avaliação {schema.title}</h1>
                <p className="text-gray-600">Unidade: {unidade?.nome}</p>
            </div>

            <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg border space-y-6">
                {schema.questions.map(q => (
                    <div key={q.key}>
                        <label className="block text-md font-medium text-gray-800">{q.text}</label>
                        <select
                            onChange={(e) => handleSelectChange(q.key, e.target.value)}
                            className="mt-2 block w-full p-2 border border-gray-300 rounded-md shadow-sm"
                            required
                        >
                            <option value="">Selecione uma opção...</option>
                            {q.options.map(opt => (
                                <option key={`${q.key}-${opt.value}`} value={opt.value}>{opt.label} ({opt.value} pts)</option>
                            ))}
                        </select>
                    </div>
                ))}
                <div className="flex justify-end pt-4">
                    <button type="submit" className="px-6 py-2 text-white bg-green-600 rounded-md hover:bg-green-700">
                        Salvar Avaliação
                    </button>
                </div>
            </form>
        </div>
    );
}