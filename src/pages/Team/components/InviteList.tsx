import React, { useState } from "react";
import { X } from "lucide-react";
import { useInviteStore } from "../../../store/inviteStore";
import { useAuthStore } from "../../../store/authStore";
import { OutputInvitation } from "../../../types/invites.types";

const InviteList: React.FC = () => {
  const { invites, revokeInvite } = useInviteStore();
  const { token, user } = useAuthStore();
  const organizationId = user?.organization_id;
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleRevoke = async (inviteId: string) => {
    if (!token || !organizationId) return;
    setLoadingId(inviteId);
    try {
      await revokeInvite(token, organizationId, inviteId);
    } catch (err) {
      alert("Erro ao cancelar convite.");
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="bg-white dark:bg-dark-800 rounded-lg shadow-sm border border-gray-200/10 dark:border-gray-700/10 overflow-hidden">
      <div className="min-w-full">
        <table className="min-w-full divide-y divide-gray-200/10 dark:divide-gray-700/10">
          <thead>
            <tr className="bg-gray-50 dark:bg-dark-900">
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                E-mail
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Função
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Enviado em
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Ações
              </th>
            </tr>
          </thead>
          <tbody>
            {invites.map((invite: OutputInvitation) => {
              const isPending = invite.status !== "ACCEPTED";
              return (
                <tr
                  key={invite.id}
                  className="hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors overflow-visible"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">
                      {invite.email}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500 dark:text-gray-300">
                      {invite.role_assigned === "ADMIN"
                        ? "Administrador"
                        : "Membro"}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500 dark:text-gray-300">
                      {invite.status}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500 dark:text-gray-300">
                      {new Date(invite.created_at).toLocaleString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right min-w-0 overflow-visible">
                    {isPending ? (
                      <button
                        onClick={() => handleRevoke(invite.id)}
                        className="p-1 rounded-full hover:bg-red-100 dark:hover:bg-red-900 transition-colors"
                        disabled={loadingId === invite.id}
                        aria-label="Cancelar convite"
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <X
                          className={`w-5 h-5 ${
                            loadingId === invite.id
                              ? "animate-spin text-red-400"
                              : "text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200"
                          }`}
                        />
                      </button>
                    ) : null}
                  </td>
                </tr>
              );
            })}
            {invites.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-6 py-10 text-center text-sm text-gray-500 dark:text-gray-400"
                >
                  Nenhum convite enviado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default InviteList;
