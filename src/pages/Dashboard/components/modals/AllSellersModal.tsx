import React from "react";
import { X } from "lucide-react";

interface AllSellersModalProps {
  isOpen: boolean;
  onClose: () => void;
  dashboardTopSellers: any;
  formatCurrency: (value: number) => string;
}

export function AllSellersModal({
  isOpen,
  onClose,
  dashboardTopSellers,
  formatCurrency,
}: AllSellersModalProps) {
  if (!isOpen) return null;

  return (
    <div className="modal-container z-[9999]">
      <div className="bg-white dark:bg-dark-800 rounded-lg p-6 w-full max-w-2xl overflow-hidden flex flex-col shadow-xl m-4">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100 dark:border-dark-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Todos os Vendedores
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-dark-700 text-gray-500 dark:text-gray-400"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto max-h-[60vh] pr-2">
          <table className="w-full">
            <thead className="sticky top-0 bg-white dark:bg-dark-800">
              <tr className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-dark-700">
                <th className="pb-2 w-16">#</th>
                <th className="pb-2">Vendedor</th>
                <th className="pb-2 text-center">Vendas</th>
                <th className="pb-2 text-right">Valor Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-dark-700">
              {dashboardTopSellers.data.map((seller, index) => {
                const positionColor =
                  index === 0
                    ? "text-yellow-500"
                    : index === 1
                    ? "text-gray-400"
                    : index === 2
                    ? "text-amber-700"
                    : "text-gray-500 dark:text-gray-400";

                const sellerName = seller.user?.name || "Vendedor";
                const initials = sellerName
                  .split(" ")
                  .map((part: string) => part[0])
                  .join("")
                  .substring(0, 2)
                  .toUpperCase();

                const avatarBgClass =
                  index === 0
                    ? "from-yellow-400 to-amber-500"
                    : index === 1
                    ? "from-gray-400 to-gray-500"
                    : index === 2
                    ? "from-amber-700 to-amber-800"
                    : "from-purple-500 to-indigo-600";

                return (
                  <tr
                    key={seller.user?.id || `seller-${index}`}
                    className="hover:bg-gray-50 dark:hover:bg-dark-700/50"
                  >
                    <td className="py-3">
                      <span className={`font-bold ${positionColor}`}>
                        {index + 1}
                      </span>
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-8 h-8 rounded-full bg-gradient-to-br ${avatarBgClass} flex items-center justify-center text-white text-xs font-medium shadow-sm`}
                        >
                          {initials}
                        </div>
                        <span className="font-medium text-gray-800 dark:text-gray-200">
                          {sellerName}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 text-center">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Vendas
                      </span>
                    </td>
                    <td className="py-3 text-right font-medium text-gray-800 dark:text-gray-200">
                      {formatCurrency(seller.totalValue)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-dark-700 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-purple-50 dark:bg-purple-900/10 text-purple-700 dark:text-purple-400 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/20 transition-colors text-sm font-medium"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
