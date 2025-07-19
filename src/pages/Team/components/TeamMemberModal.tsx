import React, { useState } from "react";
import { X, Loader2 } from "lucide-react";
import { useSystemPermissionsStore } from "../../../store/systemPermissionsStore";
import { usePermissionsStore } from "../../../store/permissionsStore";
import { useAuthStore } from "../../../store/authStore";
import { useEffect } from "react";
import { TeamMember } from "../../../types/team.types";
import { permissionsLabels } from "../../../components/ui/permissionsLabels";

export type TeamRole = "ADMIN" | "TEAM_MEMBER";

interface TeamMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (member: { email: string; role: TeamRole }) => void;
  member?: TeamMember;
  isLoading?: boolean;
}

// Type guard para TeamMember
function isTeamMember(obj: any): obj is TeamMember {
  return (
    obj && typeof obj === "object" && "id" in obj && typeof obj.id === "string"
  );
}

export function TeamMemberModal({
  isOpen,
  onClose,
  onSave,
  member,
  isLoading = false,
}: TeamMemberModalProps) {
  const [email, setEmail] = useState(member?.email || "");
  const [role, setRole] = useState<TeamRole>(
    member &&
      "role" in member &&
      (member.role === "ADMIN" || member.role === "TEAM_MEMBER")
      ? member.role
      : "TEAM_MEMBER"
  );
  const [localLoading, setLocalLoading] = useState(false);
  // Estado local para permissões marcadas
  const [localPerms, setLocalPerms] = useState<string[]>([]);
  const [savingPerms, setSavingPerms] = useState(false);

  const { token, user } = useAuthStore();
  const organizationId = user?.organization_id;
  const {
    systemPermissions,
    fetchAllSystemPermissions,
    isLoading: isLoadingSystem,
  } = useSystemPermissionsStore();
  const {
    permissions,
    fetchPermissions,
    grantPermissions,
    revokePermissions,
    isLoading: isLoadingMemberPerms,
  } = usePermissionsStore();

  // Determinar se é modo de adicionar ou editar
  const isAddMode = !isTeamMember(member);

  useEffect(() => {
    if (isOpen && token && isTeamMember(member) && organizationId) {
      console.log(
        `[TeamMemberModal] Modal aberto. A buscar permissões para o membro ${member.id}`
      );
      fetchPermissions(token, organizationId, member.id);
    }
  }, [isOpen, token, organizationId, member, fetchPermissions]);

  // Reset do estado quando o modal é aberto para adicionar
  useEffect(() => {
    if (isOpen && isAddMode) {
      setEmail("");
      setRole("TEAM_MEMBER");
      setLocalLoading(false);
    }
  }, [isOpen, isAddMode]);

  useEffect(() => {
    if (isTeamMember(member)) {
      setLocalPerms(permissions.map((p) => p.name));
    }
  }, [permissions, member]);

  const handleTogglePermission = (permName: string, checked: boolean) => {
    setLocalPerms((prev) =>
      checked ? [...prev, permName] : prev.filter((p) => p !== permName)
    );
  };

  const handleSavePermissions = async () => {
    if (!token || !organizationId || !isTeamMember(member)) return;
    setSavingPerms(true);
    const currentPerms = permissions.map((p) => p.name);
    const toGrant = localPerms.filter((p) => !currentPerms.includes(p));
    const toRevoke = currentPerms.filter((p) => !localPerms.includes(p));
    if (toGrant.length > 0) {
      await grantPermissions(token, organizationId, member.id, {
        permission_names: toGrant,
      });
    }
    if (toRevoke.length > 0) {
      await revokePermissions(token, organizationId, member.id, {
        permission_names: toRevoke,
      });
    }
    setSavingPerms(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLocalLoading(true);
    onSave({
      email,
      role,
    });
    // O localLoading será resetado quando o modal for fechado
  };

  if (!isOpen) return null;

  // Pega nome ou e-mail do membro
  const memberName = isTeamMember(member)
    ? member?.name || member?.email || member?.id
    : "";

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 !mt-0">
      <div className="bg-white dark:bg-dark-800 rounded-lg shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-4 border-b border-gray-200/10 dark:border-gray-700/10">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {isAddMode ? "Adicionar Membro" : "Editar permissões do membro"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 focus:outline-none"
            disabled={isLoading || localLoading}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4">
          {isAddMode ? (
            // Interface para adicionar membro
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-dark-700 rounded-lg text-gray-900 dark:text-white border border-gray-300 dark:border-dark-600 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="email@exemplo.com"
                  required
                  disabled={isLoading || localLoading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Função
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as TeamRole)}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-dark-700 rounded-lg text-gray-900 dark:text-white border border-gray-300 dark:border-dark-600 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  disabled={isLoading || localLoading}
                >
                  <option value="TEAM_MEMBER">Membro da Equipe</option>
                  <option value="ADMIN">Administrador</option>
                </select>
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border border-gray-300/20 dark:border-gray-600/20 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-dark-700 hover:bg-gray-50 dark:hover:bg-dark-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  disabled={isLoading || localLoading}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 flex items-center justify-center gap-2"
                  disabled={isLoading || localLoading}
                >
                  {(isLoading || localLoading) && (
                    <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></span>
                  )}
                  Adicionar Membro
                </button>
              </div>
            </form>
          ) : (
            // Interface para editar permissões
            <>
              <div className="mb-6 text-lg font-medium text-gray-800 dark:text-gray-100 flex items-center gap-4">
                {member && member.avatar_url ? (
                  <img
                    className="w-16 h-16 object-cover rounded-full"
                    src={member.avatar_url}
                    alt=""
                  />
                ) : (
                  ""
                )}
                {memberName}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Permissões do membro
                </label>
                <div
                  className={`max-h-60 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-md p-2 bg-gray-50 dark:bg-dark-700 divide-y divide-gray-100 dark:divide-gray-800 ${
                    savingPerms ? "opacity-60 pointer-events-none" : ""
                  }`}
                >
                  {isLoadingSystem || isLoadingMemberPerms ? (
                    <div className="text-center text-gray-500 text-sm py-4">
                      Carregando permissões...
                    </div>
                  ) : (
                    Object.entries(permissionsLabels).map(
                      ([categoria, permsObj]) => {
                        const perms = Object.entries(permsObj).filter(
                          ([permName]) => permName !== "organization:edit"
                        );
                        if (perms.length === 0) return null;
                        return (
                          <div
                            key={categoria}
                            className="py-2 first:pt-0 last:pb-0"
                          >
                            <div className="font-semibold text-xs text-purple-700 dark:text-purple-300 mb-2 uppercase tracking-wide">
                              {categoria}
                            </div>
                            <ul className="space-y-2">
                              {perms.map(([permName, label]) => (
                                <li
                                  key={permName}
                                  className="flex items-center gap-2"
                                >
                                  <input
                                    type="checkbox"
                                    checked={localPerms.includes(permName)}
                                    onChange={(e) =>
                                      handleTogglePermission(
                                        permName,
                                        e.target.checked
                                      )
                                    }
                                    disabled={isLoading || localLoading}
                                    id={`perm-${permName}`}
                                  />
                                  <label
                                    htmlFor={`perm-${permName}`}
                                    className="text-sm text-gray-700 dark:text-gray-200 cursor-pointer"
                                  >
                                    {label}
                                  </label>
                                </li>
                              ))}
                            </ul>
                          </div>
                        );
                      }
                    )
                  )}
                </div>
              </div>
              <div className="flex justify-end mt-6 space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border border-gray-300/20 dark:border-gray-600/20 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-dark-700 hover:bg-gray-50 dark:hover:bg-dark-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  disabled={isLoading || localLoading}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSavePermissions}
                  className="px-4 py-2 rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 flex items-center justify-center gap-2"
                  disabled={isLoading || localLoading || savingPerms}
                >
                  {savingPerms && (
                    <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></span>
                  )}
                  Salvar permissões
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
