import { useState, useEffect, FormEvent } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getQuestionarioById, createColeta, Questionario, Pergunta } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Camera, CheckCircle } from 'lucide-react';

export default function RealizarColetaPage() {
    const { questionarioId, unidadeId, unidadeNome } = useParams<{ questionarioId: string; unidadeId: string; unidadeNome: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { toast } = useToast();

    const [questionario, setQuestionario] = useState<Questionario | null>(null);
    const [respostas, setRespostas] = useState<Record<string, any>>({});
    const [fotos, setFotos] = useState<Record<string, File>>({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!questionarioId) return;
        getQuestionarioById(questionarioId)
            .then(setQuestionario)
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, [questionarioId]);

    const handleValueChange = (perguntaId: string, value: any) => {
        setRespostas(prev => ({ ...prev, [perguntaId]: value }));
    };

    const handleFileChange = (perguntaId: string, file: File | null) => {
        if (file) {
            setFotos(prev => ({ ...prev, [perguntaId]: file }));
        }
    };
    
    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();

        const formData = new FormData();
        formData.append('questionarioId', questionarioId!);
        formData.append('unidadeId', unidadeId!);
        formData.append('localNome', decodeURIComponent(unidadeNome!));
        formData.append('colaboradorId', user!.id);
        
        const respostasParaEnviar = questionario!.perguntas.map(p => ({
            perguntaId: p.id,
            valor: respostas[p.id] || null
        }));

        formData.append('respostas', JSON.stringify(respostasParaEnviar));

        Object.keys(fotos).forEach(perguntaId => {
            formData.append(perguntaId, fotos[perguntaId]);
        });

        try {
            await createColeta(formData);
            toast({ title: "Sucesso!", description: "Coleta enviada com sucesso." });
            navigate('/coletas');
        } catch (err) {
            toast({ title: "Erro", description: "Não foi possível enviar a coleta.", variant: "destructive" });
        }
    };

    if (loading) return <p>Carregando questionário...</p>;
    if (!questionario) return <p>Questionário não encontrado.</p>;
    
    const renderInput = (pergunta: Pergunta) => {
        switch(pergunta.tipoResposta) {
            case 'sim_nao_na':
                return <Select onValueChange={value => handleValueChange(pergunta.id, value)}><SelectTrigger><SelectValue placeholder="Selecione..."/></SelectTrigger><SelectContent><SelectItem value="sim">Sim</SelectItem><SelectItem value="nao">Não</SelectItem><SelectItem value="na">N/A</SelectItem></SelectContent></Select>
            case 'texto':
                return <Textarea placeholder="Digite sua resposta..." onChange={e => handleValueChange(pergunta.id, e.target.value)} />
            case 'numero':
                return <Input type="number" placeholder="Digite um número..." onChange={e => handleValueChange(pergunta.id, e.target.value)} />
            case 'data':
                return <Input type="date" onChange={e => handleValueChange(pergunta.id, e.target.value)} />
            default: return <p>Tipo de pergunta não suportado.</p>
        }
    }

    return (
        <div className="max-w-4xl mx-auto pb-24">
            <div className="space-y-2 mb-6">
                <Link to="/coletas" className="flex items-center text-sm text-muted-foreground hover:text-primary transition-colors"><ArrowLeft className="h-4 w-4 mr-1" /> Voltar</Link>
                <h1 className="text-3xl font-bold text-primary">{questionario.nome}</h1>
                <p className="text-muted-foreground">Local: {decodeURIComponent(unidadeNome!)}</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {questionario.perguntas.map((pergunta, index) => (
                    <Card key={pergunta.id}>
                        <CardHeader><CardTitle className="text-lg"><span className="text-primary mr-2">{index + 1}.</span>{pergunta.texto}</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            {renderInput(pergunta)}
                            <div className="flex items-center gap-2">
                                 <label htmlFor={`foto-${pergunta.id}`} className="flex items-center gap-2 text-sm text-secondary cursor-pointer hover:underline">
                                    <Camera className="h-4 w-4" />
                                    {fotos[pergunta.id] ? "Trocar foto" : "Anexar foto"}
                                 </label>
                                 <Input id={`foto-${pergunta.id}`} type="file" accept="image/*" className="hidden" onChange={e => handleFileChange(pergunta.id, e.target.files ? e.target.files[0] : null)}/>
                                 {fotos[pergunta.id] && <span className="text-xs text-muted-foreground">{fotos[pergunta.id].name}</span>}
                            </div>
                        </CardContent>
                    </Card>
                ))}
                 <div className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-sm border-t p-4">
                    <div className="max-w-4xl mx-auto flex justify-end">
                        <Button type="submit" size="lg"><CheckCircle className="h-5 w-5 mr-2"/>Finalizar e Enviar Coleta</Button>
                    </div>
                </div>
            </form>
        </div>
    );
}