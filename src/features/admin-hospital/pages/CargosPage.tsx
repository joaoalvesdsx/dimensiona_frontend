import { useState, useEffect, FormEvent } from "react";
import { useParams } from "react-router-dom";
import {
  getCargosByHospitalId,
  createCargo,
  updateCargo,
  deleteCargo,
  Cargo,
  CreateCargoDTO,
  UpdateCargoDTO,
} from "@/lib/api";
import { Trash2, Edit } from "lucide-react";

const initialFormState: Omit<Cargo, "id"> = {
  nome: "",
  salario: "",
  carga_horaria: "",
  descricao: "",
  adicionais_tributos: "",
};

export default function CargosPage() {
  const { hospitalId } = useParams<{ hospitalId: string }>();
  const [cargos, setCargos] = useState<Cargo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isFormVisible, setIsFormVisible] = useState(false);
  const [formData, setFormData] = useState<Partial<Cargo>>(initialFormState);

  const fetchCargos = async () => {
    if (!hospitalId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getCargosByHospitalId(hospitalId);
      setCargos(data);
    } catch (err) {
      setError("Falha ao carregar os cargos.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCargos();
  }, [hospitalId]);

  const handleEdit = (cargo: Cargo) => {
    setFormData(cargo);
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

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!hospitalId || !formData.nome?.trim()) return;

    try {
      if (formData.id) {
        const updateData: UpdateCargoDTO = { ...formData };
        delete updateData.id;
        await updateCargo(hospitalId, formData.id, updateData);
      } else {
        const createData: CreateCargoDTO = {
          hospitalId,
          ...initialFormState,
          ...formData,
        };
        await createCargo(createData);
      }
      handleCancel();
      fetchCargos();
    } catch (err) {
      setError(
        formData.id ? "Falha ao atualizar o cargo." : "Falha ao criar o cargo."
      );
      console.error(err);
    }
  };

  const handleDelete = async (cargoId: string) => {
    if (!hospitalId) return;
    if (window.confirm("Tem certeza que deseja excluir este cargo?")) {
      try {
        await deleteCargo(hospitalId, cargoId);
        fetchCargos();
      } catch (err) {
        setError("Falha ao excluir o cargo.");
        console.error(err);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-primary">
          Gerenciamento de Cargos
        </h1>
        <button
          onClick={isFormVisible ? handleCancel : handleAddNew}
          className="px-4 py-2 text-white bg-secondary rounded-md hover:opacity-90 transition-opacity"
        >
          {isFormVisible ? "Cancelar" : "+ Novo Cargo"}
        </button>
      </div>

      {isFormVisible && (
        <div className="bg-white p-6 rounded-lg border animate-fade-in-down">
          <form onSubmit={handleSubmit} className="space-y-4">
            <h2 className="text-xl font-semibold text-primary">
              {formData.id ? "Editar Cargo" : "Adicionar Novo Cargo"}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="nome"
                  className="block text-sm font-medium text-gray-700"
                >
                  Nome do Cargo
                </label>
                <input
                  type="text"
                  name="nome"
                  id="nome"
                  value={formData.nome || ""}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full p-2 border rounded-md focus:ring-1 focus:ring-secondary focus:border-secondary"
                />
              </div>
              <div>
                <label
                  htmlFor="salario"
                  className="block text-sm font-medium text-gray-700"
                >
                  Salário (R$)
                </label>
                <input
                  type="text"
                  name="salario"
                  id="salario"
                  value={formData.salario || ""}
                  onChange={handleChange}
                  className="mt-1 block w-full p-2 border rounded-md focus:ring-1 focus:ring-secondary focus:border-secondary"
                />
              </div>
              <div>
                <label
                  htmlFor="carga_horaria"
                  className="block text-sm font-medium text-gray-700"
                >
                  Carga Horária (horas/mês)
                </label>
                <input
                  type="text"
                  name="carga_horaria"
                  id="carga_horaria"
                  value={formData.carga_horaria || ""}
                  onChange={handleChange}
                  className="mt-1 block w-full p-2 border rounded-md focus:ring-1 focus:ring-secondary focus:border-secondary"
                />
              </div>
              <div>
                <label
                  htmlFor="adicionais_tributos"
                  className="block text-sm font-medium text-gray-700"
                >
                  Adicionais e Tributos (R$)
                </label>
                <input
                  type="text"
                  name="adicionais_tributos"
                  id="adicionais_tributos"
                  value={formData.adicionais_tributos || ""}
                  onChange={handleChange}
                  className="mt-1 block w-full p-2 border rounded-md focus:ring-1 focus:ring-secondary focus:border-secondary"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="descricao"
                className="block text-sm font-medium text-gray-700"
              >
                Descrição
              </label>
              <textarea
                name="descricao"
                id="descricao"
                value={formData.descricao || ""}
                onChange={handleChange}
                rows={3}
                className="mt-1 block w-full p-2 border rounded-md focus:ring-1 focus:ring-secondary focus:border-secondary"
              />
            </div>

            <div className="flex justify-end">
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

      <div className="bg-white p-6 rounded-lg border">
        {loading && <p>A carregar...</p>}
        {error && <p className="text-red-500">{error}</p>}
        {!loading && !error && (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Nome
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Carga Horária
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Salário
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {cargos.length > 0 ? (
                  cargos.map((cargo) => (
                    <tr key={cargo.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800">
                        {cargo.nome}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {cargo.carga_horaria || "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {cargo.salario ? `R$ ${cargo.salario}` : "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-4">
                        <button
                          onClick={() => handleEdit(cargo)}
                          className="text-secondary hover:opacity-70"
                        >
                          <Edit size={20} />
                        </button>
                        <button
                          onClick={() => handleDelete(cargo.id)}
                          className="text-red-600 hover:opacity-70"
                        >
                          <Trash2 size={20} />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-6 py-4 text-center text-sm text-gray-500"
                    >
                      Nenhum cargo registado.
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
