import { Coleta } from "@/lib/api";
import { X } from "lucide-react";

interface ColetaDetalhesModalProps {
    coleta: Coleta;
    onClose: () => void;
}

export default function ColetaDetalhesModal({ coleta, onClose }: ColetaDetalhesModalProps) {

    // Mapeia as perguntas do questionário pelo ID para fácil acesso
    const perguntasMap = new Map(coleta.questionario.perguntas.map(p => [p.id, p]));

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl space-y-4 relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-800">
                    <X size={24} />
                </button>
                
                <h2 className="text-xl font-bold text-primary">Detalhes da Coleta</h2>
                
                <div className="text-sm space-y-1">
                    <p><strong>Local:</strong> {coleta.localNome}</p>
                    <p><strong>Questionário:</strong> {coleta.questionario.nome}</p>
                    <p><strong>Data:</strong> {new Date(coleta.created_at).toLocaleString('pt-BR')}</p>
                    <p><strong>Responsável:</strong> {coleta.colaborador?.nome || 'Não identificado'}</p>
                </div>

                <div className="border-t pt-4 space-y-3 max-h-[60vh] overflow-y-auto">
                    <h3 className="font-semibold">Respostas:</h3>
                    {coleta.respostas.map(resposta => {
                        const pergunta = perguntasMap.get(resposta.perguntaId);
                        return (
                            <div key={resposta.perguntaId} className="p-3 bg-gray-50 rounded-md">
                                <p className="font-medium text-gray-800 text-sm">{pergunta?.texto || 'Pergunta não encontrada'}</p>
                                <p className="text-gray-600 pl-2">- Resposta: <span className="font-semibold">{resposta.valor}</span></p>
                                {resposta.fotoUrl && (
                                    <a href={`http://localhost:3000${resposta.fotoUrl}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 text-sm pl-2 hover:underline">
                                        Ver foto anexada
                                    </a>
                                )}
                            </div>
                        );
                    })}
                </div>

                <div className="flex justify-end pt-4">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300">Fechar</button>
                </div>
            </div>
        </div>
    );
}