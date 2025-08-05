import React, { useState, useEffect } from "react";
import { useTransactionStore } from "../../../store/transactionStore";
import {
  OutputTransactionDTO,
  TransactionType,
  TransactionStatus,
} from "../../../types/transaction";
import { Modal } from "../../../components/Modal";
import { transactionService } from "../../../services/transaction/transaction.service";
import { useAuthStore } from "../../../store/authStore";

interface EditTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: OutputTransactionDTO;
  onTransactionUpdated?: (transactionDate: string) => void;
}

export function EditTransactionModal({
  isOpen,
  onClose,
  transaction,
  onTransactionUpdated,
}: EditTransactionModalProps) {
  const [type, setType] = useState<TransactionType>("INCOME");
  const [description, setDescription] = useState("");
  const [value, setValue] = useState("");
  const [category, setCategory] = useState("");
  const [date, setDate] = useState("");
  const [status, setStatus] = useState<TransactionStatus>("COMPLETED");
  const [isSaving, setIsSaving] = useState(false);

  const { updateTransaction } = useTransactionStore();
  const { hasPermission } = useAuthStore((state) => ({
    hasPermission: state.hasPermission,
  }));

  // Verificar se o usuário tem permissão para editar transações
  if (!hasPermission("finance:update")) {
    return null;
  }

  useEffect(() => {
    if (transaction) {
      setType(transaction.type);
      setDescription(transaction.description || "");
      setValue(
        transaction.value !== undefined && transaction.value !== null
          ? transaction.value.toString()
          : ""
      );
      setCategory(transaction.category || "");
      setDate(transaction.date ? transaction.date.split("T")[0] : "");
      setStatus(transaction.status);
    }
  }, [transaction]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasPermission("finance:update")) {
      return;
    }
    setIsSaving(true);
    const { token, user } = useAuthStore.getState();
    if (!token || !user?.organization_id) {
      setIsSaving(false);
      return;
    }
    const selectedDate = new Date(date + "T12:00:00");
    const updatedTransaction = {
      description,
      value: Number(value),
      category,
      type,
      status,
      date: selectedDate.toISOString(),
    };
    await transactionService.update(
      token,
      user.organization_id,
      transaction.id,
      updatedTransaction
    );
    // Chamar callback para atualizar filtro se a data mudou
    if (onTransactionUpdated) {
      onTransactionUpdated(date);
    }
    setIsSaving(false);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Editar Transação">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Tipo
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setType("INCOME")}
              className={`flex-1 px-4 py-2 rounded-lg border transition-colors ${
                type === "INCOME"
                  ? "bg-green-100 border-green-500 text-green-700 dark:bg-green-900/20 dark:border-green-500 dark:text-green-400"
                  : "border-gray-300 text-gray-700 dark:border-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-700"
              }`}
            >
              Entrada
            </button>
            <button
              type="button"
              onClick={() => setType("EXPENSE")}
              className={`flex-1 px-4 py-2 rounded-lg border transition-colors ${
                type === "EXPENSE"
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
            value={value}
            onChange={(e) => setValue(e.target.value)}
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
            onChange={(e) => setStatus(e.target.value as TransactionStatus)}
            className="w-full px-3 py-2 rounded-lg bg-gray-50 dark:bg-dark-700 border border-gray-300 dark:border-dark-600 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-colors"
            required
          >
            <option value="PENDING">Pendente</option>
            <option value="COMPLETED">Concluído</option>
            <option value="CANCELED">Cancelado</option>
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
            disabled={isSaving}
          >
            {isSaving ? (
              <span className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Salvando...
              </span>
            ) : (
              "Salvar Alterações"
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
