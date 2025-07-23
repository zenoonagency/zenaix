import React from "react";
import { Users, ChevronDown } from "lucide-react";

interface TopSellersProps {
  dashboardTopSellers: any;
  isDashboardLoadingTopSellers: boolean;
  formatCurrency: (value: number) => string;
  onShowAllSellersModal: () => void;
}

export function TopSellers({
  dashboardTopSellers,
  isDashboardLoadingTopSellers,
  formatCurrency,
  onShowAllSellersModal,
}: TopSellersProps) {
  if (isDashboardLoadingTopSellers && dashboardTopSellers.data.length === 0) {
    return (
      <div className="bg-white dark:bg-dark-800 p-4 rounded-xl shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="h-5 bg-gray-200 dark:bg-dark-700 rounded animate-pulse w-24"></div>
          <div className="p-1.5 bg-gray-200 dark:bg-dark-700 rounded-lg animate-pulse w-8 h-8"></div>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="p-3 rounded-lg bg-gray-100 dark:bg-dark-700 animate-pulse"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-200 dark:bg-dark-600 rounded-full"></div>
                  <div>
                    <div className="h-4 bg-gray-200 dark:bg-dark-600 rounded w-24 mb-1"></div>
                    <div className="h-3 bg-gray-200 dark:bg-dark-600 rounded w-16"></div>
                  </div>
                </div>
                <div className="h-4 bg-gray-200 dark:bg-dark-600 rounded w-16"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-dark-800 p-4 rounded-xl shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base font-semibold text-gray-800 dark:text-gray-200">
          Top Vendedores
        </h3>
        <div className="p-1.5 bg-purple-500/10 rounded-lg">
          <Users className="w-4 h-4 text-purple-500" />
        </div>
      </div>

      <div className="mt-4">
        {dashboardTopSellers.data.length === 0 ? (
          <div className="h-24 flex items-center justify-center text-gray-400">
            Nenhum vendedor encontrado
          </div>
        ) : (
          <>
            <div className="mb-2 px-1">
              <div className="flex justify-between text-xs font-medium text-gray-500 dark:text-gray-400">
                <span>Vendedor</span>
                <span>Desempenho</span>
              </div>
            </div>
            <div className="space-y-3">
              {dashboardTopSellers.data.slice(0, 3).map((seller, index) => {
                const positionColor =
                  index === 0
                    ? "bg-yellow-500"
                    : index === 1
                    ? "bg-gray-400"
                    : index === 2
                    ? "bg-amber-700"
                    : "bg-purple-500";

                const cardBgClass =
                  index === 0
                    ? "bg-yellow-50 dark:bg-yellow-900/10 hover:bg-yellow-100 dark:hover:bg-yellow-900/20"
                    : index === 1
                    ? "bg-gray-50 dark:bg-gray-700/30 hover:bg-gray-100 dark:hover:bg-gray-700/40"
                    : index === 2
                    ? "bg-amber-50 dark:bg-amber-900/10 hover:bg-amber-100 dark:hover:bg-amber-900/20"
                    : "bg-purple-50 dark:bg-purple-900/10 hover:bg-purple-100 dark:hover:bg-purple-900/20";

                const avatarBgClass =
                  index === 0
                    ? "from-yellow-400 to-amber-500"
                    : index === 1
                    ? "from-gray-400 to-gray-500"
                    : index === 2
                    ? "from-amber-700 to-amber-800"
                    : "from-purple-500 to-indigo-600";

                const user = seller.user;
                const sellerName = user?.name || "Responsável Desconhecido";
                const initials = sellerName
                  .split(" ")
                  .map((part) => part[0])
                  .join("")
                  .substring(0, 2)
                  .toUpperCase();

                const position = index + 1;

                return (
                  <div
                    key={user?.id || index}
                    className={`relative p-3 rounded-lg transition-all ${cardBgClass} group`}
                  >
                    <div
                      className={`absolute -top-2 -left-2 w-6 h-6 ${positionColor} rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm`}
                    >
                      {position}
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 pl-2">
                        {user?.avatar_url ? (
                          <img
                            src={user.avatar_url}
                            alt={sellerName}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div
                            className={`w-10 h-10 rounded-full bg-gradient-to-br ${avatarBgClass} flex items-center justify-center text-white text-sm font-medium shadow-sm`}
                          >
                            {initials}
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-gray-800 dark:text-gray-200">
                            {sellerName}
                          </p>
                          <div className="flex items-center gap-1 mt-0.5">
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              Vendas realizadas
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-sm text-gray-800 dark:text-gray-200">
                          {formatCurrency(seller.totalValue)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            {dashboardTopSellers.data.length > 3 && (
              <div className="mt-4 pt-3 border-t border-gray-100 dark:border-dark-700">
                <button
                  onClick={onShowAllSellersModal}
                  className="w-full py-2 px-3 bg-purple-50 dark:bg-purple-900/10 text-purple-700 dark:text-purple-400 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/20 transition-colors text-xs font-medium flex items-center justify-center gap-1"
                >
                  Ver todos os vendedores ({dashboardTopSellers.data.length})
                  <ChevronDown className="w-3 h-3 transform rotate-[-90deg]" />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
