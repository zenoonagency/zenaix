import React, { useState } from "react";
import { Modal } from "../../../components/Modal";
import { useAuthStore } from "../../../store/authStore";
import { transactionService } from "../../../services/transaction/transaction.service";
import { InputCreateTransactionDTO } from "../../../types/transaction";

interface NewTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  filterDate: string;
}

export function NewTransactionModal({
  isOpen,
  onClose,
  filterDate,
}: NewTransactionModalProps) {
  const [type, setType] = useState<"income" | "expense">("income");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  // Função utilitária para pegar a data inicial baseada no filtro
  function getInitialDate() {
    if (!filterDate) return new Date().toISOString().split("T")[0];
    const [year, month] = filterDate.split("-").map(Number);
    const today = new Date();
    // Se o mês/ano do filtro for o atual, retorna hoje
    if (today.getFullYear() === year && today.getMonth() + 1 === month) {
      return today.toISOString().split("T")[0];
    }
    // Senão, retorna o primeiro dia do mês filtrado
    return `${year}-${String(month).padStart(2, "0")}-01`;
  }

  const [date, setDate] = useState(getInitialDate());

  React.useEffect(() => {
    if (isOpen) {
      setDate(getInitialDate());
    }
    // eslint-disable-next-line
  }, [isOpen, filterDate]);

  const [status, setStatus] = useState<"pendente" | "concluido" | "cancelado">(
    "concluido"
  );
  const [isLoading, setIsLoading] = useState(false);

  const { token, organizationId } = useAuthStore((state) => ({
    token: state.token,
    organizationId: state.user?.organization_id,
  }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !organizationId) return;
    setIsLoading(true);
    try {
      // Mapear campos para o DTO da API
      const dto: InputCreateTransactionDTO = {
        description,
        value: Number(amount),
        type: type === "income" ? "INCOME" : "EXPENSE",
        date,
        category: category || undefined,
        status:
          status === "concluido"
            ? "COMPLETED"
            : status === "pendente"
            ? "PENDING"
            : "CANCELED",
      };
      const created = await transactionService.create(
        token,
        organizationId,
        dto
      );

      onClose();
      resetForm();
    } catch (err) {
      alert("Erro ao criar transação.");
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setType("income");
    setDescription("");
    setAmount("");
    setCategory("");
    setDate(getInitialDate());
    setStatus("concluido");
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Nova Transação">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Tipo
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setType("income")}
              className={`flex-1 px-4 py-2 rounded-lg border transition-colors ${
                type === "income"
                  ? "bg-green-100 border-green-500 text-green-700 dark:bg-green-900/20 dark:border-green-500 dark:text-green-400"
                  : "border-gray-300 text-gray-700 dark:border-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-700"
              }`}
            >
              Entrada
            </button>
            <button
              type="button"
              onClick={() => setType("expense")}
              className={`flex-1 px-4 py-2 rounded-lg border transition-colors ${
                type === "expense"
                  ? "bg-red-100 border-red-500 text-red-700 dark:bg-red-900/20 dark:border-red-500 dark:text-red-400"
                  : "border-gray-300 text-gray-700 dark:border-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-700"
              }`}
            >
              Saída
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Descrição
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-gray-50 dark:bg-dark-700 border border-gray-300 dark:border-dark-600 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-colors"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Valor
          </label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-gray-50 dark:bg-dark-700 border border-gray-300 dark:border-dark-600 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-colors"
            min="0"
            step="0.01"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Categoria
          </label>
          <input
            type="text"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-gray-50 dark:bg-dark-700 border border-gray-300 dark:border-dark-600 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-colors"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Data
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-gray-50 dark:bg-dark-700 border border-gray-300 dark:border-dark-600 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-colors"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Status
          </label>
          <select
            value={status}
            onChange={(e) =>
              setStatus(
                e.target.value as "pendente" | "concluido" | "cancelado"
              )
            }
            className="w-full px-3 py-2 rounded-lg bg-gray-50 dark:bg-dark-700 border border-gray-300 dark:border-dark-600 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-colors"
            required
          >
            <option value="pendente">Pendente</option>
            <option value="concluido">Concluído</option>
            <option value="cancelado">Cancelado</option>
          </select>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            disabled={isLoading}
          >
            {isLoading ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
