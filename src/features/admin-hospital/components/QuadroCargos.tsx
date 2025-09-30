import { useMemo } from "react";
import { Briefcase } from "lucide-react";

// Definindo a tipagem dos dados que o componente espera receber
interface Cargo {
  id: string;
  nome: string;
  salario: string;
}

export interface CargoUnidade {
  cargo: Cargo;
  quantidade_funcionarios: number;
}

interface QuadroCargosProps {
  cargos: CargoUnidade[];
}

export default function QuadroCargos({ cargos }: QuadroCargosProps) {
  // Opcional: Apenas para calcular o total de funcionários no cabeçalho
  const totalFuncionarios = useMemo(() => {
    if (!cargos) return 0;
    return cargos.reduce((sum, item) => sum + item.quantidade_funcionarios, 0);
  }, [cargos]);

  // Se não houver dados, exibe uma mensagem
  if (!cargos || cargos.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg border">
        <h2 className="text-xl font-semibold text-primary mb-4">
          Quadro de Funcionários
        </h2>
        <p className="text-sm text-gray-500 mt-4">
          Não há informações de cargos para esta unidade.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg border animate-fade-in-down">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-primary">
          Quadro de Funcionários
        </h2>
        <div className="text-right">
          <p className="text-gray-600">Total de Funcionários</p>
          <p className="font-bold text-2xl text-primary">{totalFuncionarios}</p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left table-auto">
          <thead>
            <tr className="bg-slate-50 border-b">
              <th className="px-4 py-2 font-semibold text-gray-700">Cargo</th>
              <th className="px-4 py-2 font-semibold text-gray-700">
                Salário Base
              </th>
              <th className="px-4 py-2 font-semibold text-gray-700 text-right">
                Quantidade
              </th>
            </tr>
          </thead>
          <tbody>
            {cargos.map((item) => (
              <tr key={item.cargo.id} className="border-b hover:bg-slate-50">
                <td className="px-4 py-3 flex items-center gap-2">
                  <Briefcase className="text-gray-400" size={16} />
                  {item.cargo.nome}
                </td>
                <td className="px-4 py-3">R$ {item.cargo.salario}</td>
                <td className="px-4 py-3 text-right font-medium">
                  {item.quantidade_funcionarios}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
