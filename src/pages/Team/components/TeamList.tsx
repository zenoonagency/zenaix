import React, { useState } from "react";
import { Edit2, Trash2, Shield, User, X } from "lucide-react";
import { FaCrown } from "react-icons/fa";
import { useCustomModal } from "../../../components/CustomModal";
import { TeamMember } from "../../../types/team.types";
import { useTeamMembersStore } from "../../../store/teamMembersStore";
import { useAuthStore } from "../../../store/authStore";

export function TeamList() {
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const { modal, customConfirm } = useCustomModal();

  const { members, removeMember, removeMemberFromOrg } = useTeamMembersStore();
  const { token, user } = useAuthStore();
  const organizationId = user?.organization_id;
  const [removingId, setRemovingId] = useState<string | null>(null);

  const sortedMembers = [...members].sort((a, b) => {
    if (a.role === "MASTER") return -1;
    if (b.role === "MASTER") return 1;
    return 0;
  });

  const handleRoleChange = (memberId: string, isAdmin: boolean) => {};

  const handleDelete = async (id: string) => {
    const confirmed = await customConfirm(
      "Excluir membro",
      "Tem certeza que deseja excluir este membro?"
    );
    if (!confirmed) return;
    if (!token || !organizationId) return;
    setRemovingId(id);
    try {
      await removeMemberFromOrg(token, organizationId, id);
    } catch (err: any) {
      alert(err.message || "Erro ao remover membro.");
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <>
      <div className="bg-white dark:bg-dark-800 rounded-lg shadow-sm border border-gray-200/10 dark:border-gray-700/10 overflow-hidden">
        <div className="min-w-full">
          <table className="min-w-full divide-y divide-gray-200/10 dark:divide-gray-700/10">
            <thead>
              <tr className="bg-gray-50 dark:bg-dark-900">
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  Nome
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  E-mail
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  Função
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-dark-800 divide-y divide-gray-200/10 dark:divide-gray-700/10">
              {sortedMembers.map((member) => (
                <tr
                  key={member.id}
                  className="hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {member.name}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500 dark:text-gray-300">
                      {member.email}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {member.role === "MASTER" ? (
                        <div className="flex items-center text-yellow-500 dark:text-yellow-400 font-semibold">
                          <FaCrown
                            className="w-4 h-4 mr-1"
                            title="Master da organização"
                          />
                          Master
                        </div>
                      ) : (
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={member.role === "ADMIN"}
                            onChange={(e) =>
                              handleRoleChange(member.id, e.target.checked)
                            }
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-500/20 dark:peer-focus:ring-purple-500/30 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-purple-600"></div>
                          <div className="ml-3 text-sm font-medium text-gray-900 dark:text-white">
                            {member.role === "ADMIN" ? (
                              <div className="flex items-center text-purple-600 dark:text-purple-400">
                                <Shield className="w-4 h-4 mr-1" />
                                Admin
                              </div>
                            ) : (
                              <div className="flex items-center text-gray-500 dark:text-gray-400">
                                <User className="w-4 h-4 mr-1" />
                                Usuário
                              </div>
                            )}
                          </div>
                        </label>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {member.role !== "MASTER" && (
                      <>
                        <button
                          onClick={() => setEditingMember(member)}
                          className="text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-300 mr-3"
                          disabled={removingId === member.id}
                        >
                          <Edit2 className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(member.id)}
                          className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                          disabled={removingId === member.id}
                        >
                          {removingId === member.id ? (
                            <span className="animate-spin inline-block w-5 h-5 border-2 border-current border-t-transparent rounded-full"></span>
                          ) : (
                            <Trash2 className="w-5 h-5" />
                          )}
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
              {members.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-6 py-10 text-center text-sm text-gray-500 dark:text-gray-400"
                  >
                    Nenhum membro na equipe. Adicione um novo membro para
                    começar.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      {modal}
    </>
  );
}
