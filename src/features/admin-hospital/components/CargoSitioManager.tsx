import { useState, useEffect, FormEvent } from 'react';
import { getCargosPorSitio, addCargoASitio, deleteCargoDeSitio, getCargosByHospitalId, CargoSitio, Cargo } from '@/lib/api';
import { Trash2, X } from 'lucide-react';

interface CargoSitioManagerProps {
    sitioId: string;
    hospitalId: string;
    onClose: () => void;
}

export default function CargoSitioManager({ sitioId, hospitalId, onClose }: CargoSitioManagerProps) {
    const [cargosNoSitio, setCargosNoSitio] = useState<CargoSitio[]>([]);
    const [cargosDisponiveis, setCargosDisponiveis] = useState<Cargo[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    // Formulário para adicionar novo cargo
    const [selectedCargoId, setSelectedCargoId] = useState('');
    const [quantidade, setQuantidade] = useState(1);

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const [sitioData, hospitalData] = await Promise.all([
                getCargosPorSitio(sitioId),
                getCargosByHospitalId(hospitalId)
            ]);
            setCargosNoSitio(sitioData);
            
            // Filtra para mostrar apenas cargos que ainda não estão no sítio
            const idsNoSitio = new Set(sitioData.map(cs => cs.cargoUnidade.cargo.id));
            const cargosFiltrados = hospitalData.filter(c => !idsNoSitio.has(c.id));
            
            setCargosDisponiveis(cargosFiltrados);

            if (cargosFiltrados.length > 0) {
                setSelectedCargoId(cargosFiltrados[0].id);
            }
        } catch (err) {
            setError("Falha ao carregar dados dos cargos.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [sitioId, hospitalId]);

    const handleAddCargo = async (e: FormEvent) => {
        e.preventDefault();
        if (!selectedCargoId || quantidade < 1) {
            setError("Selecione um cargo e informe uma quantidade válida.");
            return;
        }
        try {
            // Nota: O backend espera o ID da relação CargoUnidade, não do Cargo em si.
            // Esta lógica precisa ser ajustada se o backend evoluir para aceitar o cargoId diretamente.
            // Por enquanto, assumimos que o backend resolverá a relação.
            await addCargoASitio(sitioId, { cargoUnidadeId: selectedCargoId, quantidade_funcionarios: quantidade });
            fetchData(); // Recarrega a lista
            setQuantidade(1);
        } catch (err) {
            setError("Falha ao adicionar cargo. Verifique se este cargo já foi adicionado.");
        }
    };

    const handleDeleteCargo = async (cargoSitioId: string) => {
        if (window.confirm("Remover este cargo do sítio?")) {
            try {
                await deleteCargoDeSitio(cargoSitioId);
                fetchData(); // Recarrega a lista
            } catch (err) {
                setError("Falha ao remover cargo.");
            }
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl space-y-4 animate-fade-in-down relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-700">
                    <X size={24}/>
                </button>
                <h2 className="text-xl font-bold text-primary">Gerenciar Cargos do Sítio</h2>
                
                {loading && <p>Carregando...</p>}
                {error && <p className="text-red-500 text-sm bg-red-50 p-2 rounded">{error}</p>}
                
                {/* Formulário de Adição */}
                <form onSubmit={handleAddCargo} className="flex items-end gap-2 border-b pb-4">
                    <div className="flex-grow">
                        <label className="text-sm font-medium">Cargo Disponível</label>
                        <select value={selectedCargoId} onChange={e => setSelectedCargoId(e.target.value)} className="w-full p-2 border rounded-md mt-1 bg-white" disabled={cargosDisponiveis.length === 0}>
                            {cargosDisponiveis.length > 0 ? (
                                cargosDisponiveis.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)
                            ) : (
                                <option>Nenhum cargo novo para adicionar</option>
                            )}
                        </select>
                    </div>
                    <div>
                        <label className="text-sm font-medium">Qtd.</label>
                        <input type="number" value={quantidade} onChange={e => setQuantidade(Number(e.target.value))} min="1" className="w-24 p-2 border rounded-md mt-1"/>
                    </div>
                    <button type="submit" className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700" disabled={cargosDisponiveis.length === 0}>Adicionar</button>
                </form>

                {/* Lista de Cargos no Sítio */}
                <div className="space-y-2 max-h-60 overflow-y-auto">
                    <h3 className="text-md font-semibold text-gray-700 mt-2">Cargos Alocados</h3>
                    {cargosNoSitio.map(cs => (
                        <div key={cs.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                            <div>
                                <span className="font-semibold">{cs.cargoUnidade.cargo.nome}</span>
                                <span className="text-sm text-gray-600"> (Qtd: {cs.quantidade_funcionarios})</span>
                            </div>
                            <button onClick={() => handleDeleteCargo(cs.id)} className="text-red-500 hover:text-red-700">
                                <Trash2 size={16}/>
                            </button>
                        </div>
                    ))}
                     {cargosNoSitio.length === 0 && !loading && <p className="text-sm text-center text-gray-500 py-4">Nenhum cargo associado a este sítio.</p>}
                </div>

                <div className="flex justify-end pt-4 border-t mt-4">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300">Fechar</button>
                </div>
            </div>
        </div>
    );
}