import React, { useEffect, useState } from "react";
import { X, Shield, User } from "lucide-react";
import { useInviteStore } from "../../../store/inviteStore";
import { useAuthStore } from "../../../store/authStore";
import { OutputInvitation } from "../../../types/invites.types";

const InviteList: React.FC = () => {
  const { invites, revokeInvite, fetchAllInvites, isLoadingInvites } =
    useInviteStore();
  const { token, organizationId } = useAuthStore((state) => ({
    token: state.token,
    organizationId: state.organization.id,
  }));
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [hasFetched, setHasFetched] = useState(false);

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

  useEffect(() => {
    if (token && organizationId && !hasFetched) {
      setHasFetched(true);
      fetchAllInvites(token, organizationId);
    }
  }, [token, organizationId, hasFetched]);

  return (
    <div className="bg-white dark:bg-dark-800 rounded-lg shadow-sm border border-gray-200/10 dark:border-gray-700/10 overflow-hidden">
      <div className="w-full overflow-x-auto">
        <table className="w-full divide-y divide-gray-200/10 dark:divide-gray-700/10">
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
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-20">
                Ações
              </th>
            </tr>
          </thead>
          <tbody>
            {isLoadingInvites ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-6 py-10 text-center text-sm text-gray-500 dark:text-gray-400"
                >
                  <div className="flex items-center justify-center gap-2">
                    <span className="animate-spin inline-block w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full"></span>
                    Carregando convites...
                  </div>
                </td>
              </tr>
            ) : (
              <>
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
                        <div className="flex items-center">
                          {invite.role_assigned === "ADMIN" ? (
                            <div className="flex items-center text-purple-600 dark:text-purple-400">
                              <Shield className="w-4 h-4 mr-1" />
                              Administrador
                            </div>
                          ) : (
                            <div className="flex items-center text-gray-500 dark:text-gray-400">
                              <User className="w-4 h-4 mr-1" />
                              Membro
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              invite.status === "ACCEPTED"
                                ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                                : invite.status === "PENDING"
                                ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                                : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                            }`}
                          >
                            {invite.status === "ACCEPTED"
                              ? "Aceito"
                              : invite.status === "PENDING"
                              ? "Pendente"
                              : invite.status}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500 dark:text-gray-300">
                          {new Date(invite.created_at).toLocaleString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right w-20">
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
                            {loadingId === invite.id ? (
                              <span className="animate-spin inline-block w-5 h-5 border-2 border-red-400 border-t-transparent rounded-full"></span>
                            ) : (
                              <X className="w-5 h-5 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200" />
                            )}
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
              </>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default InviteList;
