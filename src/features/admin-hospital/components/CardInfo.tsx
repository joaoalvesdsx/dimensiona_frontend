import React from "react";
import {
  UnidadeInternacao,
  UnidadeNaoInternacao,
  SessaoAtiva,
} from "@/lib/api";
import { Building, Bed, Users, Percent, Home, Activity } from "lucide-react";

// Um componente auxiliar para os itens de informação
const InfoItem = ({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
}) => (
  <div className="flex items-start text-sm">
    <div className="flex-shrink-0 mr-3 text-gray-500">{icon}</div>
    <div>
      <p className="text-gray-600">{label}</p>
      <p className="font-bold text-lg text-primary">{value}</p>
    </div>
  </div>
);

// Tipagem para as props do nosso novo componente
interface CardInfoProps {
  unidade: UnidadeInternacao | UnidadeNaoInternacao;
  sessoes: SessaoAtiva[];
}

export default function CardInfo({ unidade, sessoes }: CardInfoProps) {
  if (unidade.tipo === "internacao") {
    const unidadeInternacao = unidade as UnidadeInternacao;
    const totalLeitos = unidadeInternacao.leitos?.length || 0;
    const pacientesAtuais = sessoes.length;
    const taxaOcupacao =
      totalLeitos > 0 ? ((pacientesAtuais / totalLeitos) * 100).toFixed(1) : 0;

    return (
      <div className="bg-white p-6 rounded-lg border">
        <h3 className="text-lg font-semibold text-primary mb-4">
          Informações da Unidade
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <InfoItem
            icon={<Activity size={24} />}
            label="Método SCP"
            value={unidade.scpMetodoKey as string}
          />

          <InfoItem
            icon={<Bed size={24} />}
            label="Total de Leitos"
            value={totalLeitos}
          />
          <InfoItem
            icon={<Users size={24} />}
            label="Leitos Ocupados"
            value={pacientesAtuais}
          />
          <InfoItem
            icon={<Percent size={24} />}
            label="Taxa de Ocupação"
            value={`${taxaOcupacao}%`}
          />
        </div>
      </div>
    );
  }

  if (unidade.tipo === "nao-internacao") {
    return (
      <div className="bg-white p-6 rounded-lg border">
        <h3 className="text-lg font-semibold text-primary mb-4">
          Informações da Unidade
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
          <InfoItem
            icon={<Building size={24} />}
            label="Tipo de Unidade"
            value="Não Internação"
          />
          <InfoItem
            icon={<Home size={24} />}
            label="Sítios Funcionais"
            value={unidade.sitiosFuncionais.length}
          />
          {/* Adicione outros itens de informação relevantes aqui */}
        </div>
      </div>
    );
  }

  return null;
}
