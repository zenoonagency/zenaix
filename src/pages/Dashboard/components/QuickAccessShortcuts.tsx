import React from "react";
import { Grid, DollarSign, Bookmark } from "lucide-react";
import { ProtectedLink } from "../../../components/ProtectedLink";

export function QuickAccessShortcuts() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <ProtectedLink
        to="/dashboard/clients"
        className="p-4 bg-gradient-to-br from-purple-500/10 to-indigo-500/10 rounded-xl border border-purple-500/20 hover:border-purple-500/40 transition-all group"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-500/20 rounded-lg">
            <Grid className="w-5 h-5 text-purple-500" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-800 dark:text-gray-200">
              Kanban
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Gestão de negócios
            </p>
          </div>
        </div>
      </ProtectedLink>

      <ProtectedLink
        to="/dashboard/financial"
        className="p-4 bg-gradient-to-br from-emerald-500/10 to-green-500/10 rounded-xl border border-emerald-500/20 hover:border-emerald-500/40 transition-all group"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-500/20 rounded-lg">
            <DollarSign className="w-5 h-5 text-emerald-500" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-800 dark:text-gray-200">
              Financeiro
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Controle financeiro
            </p>
          </div>
        </div>
      </ProtectedLink>

      <ProtectedLink
        to="/dashboard/contracts"
        className="p-4 bg-gradient-to-br from-amber-500/10 to-yellow-500/10 rounded-xl border border-amber-500/20 hover:border-amber-500/40 transition-all group"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-500/20 rounded-lg">
            <Bookmark className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-800 dark:text-gray-200">
              Contratos
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Gestão de contratos
            </p>
          </div>
        </div>
      </ProtectedLink>
    </div>
  );
}
