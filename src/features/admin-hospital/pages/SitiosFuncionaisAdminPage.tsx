import { useState, useEffect, FormEvent } from "react";
import { useParams } from "react-router-dom";
import {
  getUnidadeById,
  createSitioFuncional,
  updateSitioFuncional,
  deleteSitioFuncional,
  UnidadeNaoInternacao,
  SitioFuncional,
  CreateSitioFuncionalDTO,
} from "@/lib/api";
import { Trash2, Edit, Building2, Users } from "lucide-react";
import CargoSitioManager from "../components/CargoSitioManager";

export default function SitiosFuncionaisAdminPage() {
  const { setorId: unidadeId, hospitalId } = useParams<{
    setorId: string;
    hospitalId: string;
  }>();
  const [unidade, setUnidade] = useState<UnidadeNaoInternacao | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isFormVisible, setIsFormVisible] = useState(false);
  const [formData, setFormData] = useState<Partial<SitioFuncional>>({});
  const [editingSitio, setEditingSitio] = useState<SitioFuncional | null>(null);

  const [managingSitio, setManagingSitio] = useState<SitioFuncional | null>(
    null
  );

  const fetchData = async () => {
    if (!unidadeId) return;
    setLoading(true);
    setError(null);
    try {
      const data = (await getUnidadeById(unidadeId)) as UnidadeNaoInternacao;
      setUnidade(data);
    } catch (err) {
      setError("Falha ao carregar os sítios funcionais.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [unidadeId]);

  const handleOpenForm = (sitio: SitioFuncional | null) => {
    setEditingSitio(sitio);
    setFormData(
      sitio
        ? { nome: sitio.nome, descricao: sitio.descricao }
        : { nome: "", descricao: "" }
    );
    setIsFormVisible(true);
  };

  const handleCancel = () => {
    setIsFormVisible(false);
    setEditingSitio(null);
    setFormData({});
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!unidadeId || !formData.nome?.trim()) return;

    try {
      if (editingSitio) {
        // Edição
        await updateSitioFuncional(editingSitio.id, {
          nome: formData.nome,
          descricao: formData.descricao,
        });
      } else {
        // Criação
        const data: CreateSitioFuncionalDTO = {
          unidadeId,
          nome: formData.nome,
          descricao: formData.descricao,
        };
        await createSitioFuncional(unidadeId, data);
      }
      handleCancel();
      fetchData();
    } catch (err) {
      setError(
        editingSitio ? "Falha ao atualizar o sítio." : "Falha ao criar o sítio."
      );
    }
  };

  const handleDelete = async (sitioId: string) => {
    if (
      window.confirm(
        "Tem certeza que deseja excluir este sítio funcional? Todas as alocações de cargos serão perdidas."
      )
    ) {
      try {
        await deleteSitioFuncional(sitioId);
        fetchData();
      } catch (err) {
        setError("Falha ao excluir o sítio funcional.");
      }
    }
  };

  return (
    <div className="space-y-6">
      {managingSitio && hospitalId && (
        <CargoSitioManager
          sitioId={managingSitio.id}
          hospitalId={hospitalId}
          onClose={() => setManagingSitio(null)}
        />
      )}

      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-primary flex items-center gap-2">
          <Building2 /> Gestão de Sítios Funcionais
        </h2>
        <button
          onClick={() => handleOpenForm(null)}
          className="px-4 py-2 text-white bg-secondary rounded-md hover:opacity-90 transition-opacity"
        >
          + Novo Sítio
        </button>
      </div>

      {isFormVisible && (
        <div className="bg-white p-6 rounded-lg border animate-fade-in-down">
          <form onSubmit={handleSubmit} className="space-y-4">
            <h3 className="text-lg font-semibold text-primary">
              {editingSitio ? "Editar" : "Adicionar Novo"} Sítio Funcional
            </h3>
            <div>
              <label
                htmlFor="nome"
                className="block text-sm font-medium text-gray-700"
              >
                Nome do Sítio
              </label>
              <input
                type="text"
                id="nome"
                value={formData.nome || ""}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, nome: e.target.value }))
                }
                className="mt-1 block w-full p-2 border rounded-md"
                required
              />
            </div>
            <div>
              <label
                htmlFor="descricao"
                className="block text-sm font-medium text-gray-700"
              >
                Descrição
              </label>
              <textarea
                id="descricao"
                value={formData.descricao || ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    descricao: e.target.value,
                  }))
                }
                rows={3}
                className="mt-1 block w-full p-2 border rounded-md"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-white bg-green-600 rounded-md hover:bg-green-700"
              >
                Salvar
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white p-4 rounded-lg border">
        {loading && <p>Carregando...</p>}
        {error && <p className="text-red-500">{error}</p>}
        {!loading && (
          <table className="min-w-full">
            <thead>
              <tr className="border-b">
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Nome
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Descrição
                </th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {unidade?.sitiosFuncionais?.map((sitio) => (
                <tr key={sitio.id}>
                  <td className="px-4 py-2 whitespace-nowrap text-sm font-medium">
                    {sitio.nome}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm">
                    {sitio.descricao || "-"}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-right text-sm space-x-2">
                    <button
                      onClick={() => setManagingSitio(sitio)}
                      className="text-green-600 hover:text-green-800"
                      title="Gerenciar Cargos"
                    >
                      <Users size={18} />
                    </button>
                    <button
                      onClick={() => handleOpenForm(sitio)}
                      className="text-secondary hover:opacity-70"
                      title="Editar Sítio"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(sitio.id)}
                      className="text-red-600 hover:opacity-70"
                      title="Excluir Sítio"
                    >
                      <Trash2 size={18} />
                    </button>
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
