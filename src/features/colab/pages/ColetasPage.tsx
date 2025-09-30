import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { getUnidadesInternacao, getUnidadesNaoInternacao, getQuestionarios, getColetasPorHospital, Unidade, Questionario, Coleta } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, Eye } from "lucide-react";
import ColetaDetalhesModal from "@/features/admin-hospital/components/ColetaDetalhesModal"; // Reutilizando o modal de detalhes

export default function ColetasPage() {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [unidades, setUnidades] = useState<Unidade[]>([]);
    const [questionarios, setQuestionarios] = useState<Questionario[]>([]);
    const [coletas, setColetas] = useState<Coleta[]>([]);
    const [loading, setLoading] = useState(true);

    const [selectedUnidade, setSelectedUnidade] = useState("");
    const [selectedQuestionario, setSelectedQuestionario] = useState("");
    const [selectedColeta, setSelectedColeta] = useState<Coleta | null>(null);

    useEffect(() => {
        if (!user?.hospital?.id) return;

        const fetchData = async () => {
            setLoading(true);
            try {
                const [unidadesInternacao, unidadesNaoInternacao, questionariosData, coletasData] = await Promise.all([
                    getUnidadesInternacao(user.hospital.id),
                    getUnidadesNaoInternacao(user.hospital.id),
                    getQuestionarios(),
                    getColetasPorHospital(user.hospital.id)
                ]);
                setUnidades([...unidadesInternacao, ...unidadesNaoInternacao]);
                setQuestionarios(questionariosData);
                setColetas(coletasData);
            } catch (err) {
                console.error("Falha ao carregar dados para coletas", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [user?.hospital?.id]);

    const handleStartColeta = () => {
        if (!selectedUnidade || !selectedQuestionario) {
            alert("Por favor, selecione uma unidade e um questionário.");
            return;
        }
        const unidadeNome = unidades.find(u => u.id === selectedUnidade)?.nome || 'desconhecida';
        navigate(`/coletas/realizar/${selectedQuestionario}/${selectedUnidade}/${encodeURIComponent(unidadeNome)}`);
    };

    if (loading) return <p>Carregando...</p>;

    return (
        <div className="space-y-8">
            {selectedColeta && <ColetaDetalhesModal coleta={selectedColeta} onClose={() => setSelectedColeta(null)} />}

            {/* COMPONENTE 1: Realizar Nova Avaliação */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><PlusCircle className="text-primary"/> Iniciar Nova Coleta de Dados</CardTitle>
                    <CardDescription>Selecione a unidade e o questionário que deseja aplicar.</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Select onValueChange={setSelectedUnidade} value={selectedUnidade}>
                        <SelectTrigger><SelectValue placeholder="Selecione a Unidade/Setor" /></SelectTrigger>
                        <SelectContent>
                            {unidades.map(u => <SelectItem key={u.id} value={u.id}>{u.nome}</SelectItem>)}
                        </SelectContent>
                    </Select>

                    <Select onValueChange={setSelectedQuestionario} value={selectedQuestionario}>
                        <SelectTrigger><SelectValue placeholder="Selecione o Questionário" /></SelectTrigger>
                        <SelectContent>
                            {questionarios.map(q => <SelectItem key={q.id} value={q.id}>{q.nome}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    
                    <Button onClick={handleStartColeta} disabled={!selectedUnidade || !selectedQuestionario}>
                        Iniciar Avaliação
                    </Button>
                </CardContent>
            </Card>

            {/* COMPONENTE 2: Histórico de Coletas */}
            <Card>
                <CardHeader>
                    <CardTitle>Histórico de Coletas</CardTitle>
                    <CardDescription>Visualize as avaliações já realizadas neste hospital.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Data</TableHead>
                                <TableHead>Unidade</TableHead>
                                <TableHead>Questionário</TableHead>
                                <TableHead>Responsável</TableHead>
                                <TableHead>Pontuação</TableHead>
                                <TableHead className="text-right">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {coletas.length > 0 ? coletas.map(coleta => (
                                <TableRow key={coleta.id}>
                                    <TableCell>{new Date(coleta.created_at).toLocaleString('pt-BR')}</TableCell>
                                    <TableCell>{coleta.localNome}</TableCell>
                                    <TableCell>{coleta.questionario.nome}</TableCell>
                                    <TableCell>{coleta.colaborador?.nome || 'N/A'}</TableCell>
                                    <TableCell>
                                        <Badge variant="secondary">N/D</Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="icon" onClick={() => setSelectedColeta(coleta)}>
                                            <Eye className="h-4 w-4"/>
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            )) : (
                                <TableRow><TableCell colSpan={6} className="text-center h-24">Nenhuma coleta encontrada.</TableCell></TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}