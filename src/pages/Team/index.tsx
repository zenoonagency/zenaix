import React, { useState } from "react";
import { TeamList } from "./components/TeamList";
import { TeamMemberModal, TeamRole } from "./components/TeamMemberModal";
import { FeedbackModal } from "./components/FeedbackModal";
import { Users, UserPlus, Mail } from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import { inviteService } from "../../services/invite/invite.service";
import InviteList from "./components/InviteList";
import { useInviteStore } from "../../store/inviteStore";

export function Team() {
  const { inviteError } = useInviteStore();
  const { token, organization } = useAuthStore();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [feedbackModal, setFeedbackModal] = useState<{
    isOpen: boolean;
    type: "success" | "error";
    message: string;
  }>({
    isOpen: false,
    type: "success",
    message: "",
  });
  const [isInvitesModalOpen, setIsInvitesModalOpen] = useState(false);

  const handleAddMember = async (data: { email: string; role: TeamRole }) => {
    setIsLoading(true);
    try {
      if (!token || !organization?.id) {
        throw new Error(
          "Usuário não autenticado ou organização não encontrada."
        );
      }
      await inviteService.sendInvite(token, organization.id, {
        email: data.email,
        role: data.role,
      });
      setFeedbackModal({
        isOpen: true,
        type: "success",
        message:
          "Convite enviado com sucesso! O usuário receberá um email para se juntar à equipe.",
      });
    } catch (error: any) {
      setFeedbackModal({
        isOpen: true,
        type: "error",
        message:
          error?.message ||
          inviteError ||
          "Erro ao enviar convite, tente novamente ou contate o suporte.",
      });
    } finally {
      setIsLoading(false);
      setIsAddModalOpen(false);
    }
  };

  const closeFeedbackModal = () => {
    setFeedbackModal((prev) => ({ ...prev, isOpen: false }));
  };

  return (
    <div className="min-h-screen bg-transparent p-6 space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <div className="p-2 border border-purple-500 rounded-lg">
            <Users className="w-5 h-5 text-purple-600" />
          </div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-purple-700 text-transparent bg-clip-text">
            Equipe
          </h1>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setIsInvitesModalOpen(true)}
            className="flex items-center px-4 py-2 bg-purple-100 hover:bg-purple-200 text-purple-700 font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 dark:focus:ring-offset-dark-900"
          >
            <Mail className="w-5 h-5 mr-2" />
            Convites
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 dark:focus:ring-offset-dark-900"
            disabled={isLoading}
          >
            <UserPlus className="w-5 h-5 mr-2" />
            Adicionar Membro
          </button>
        </div>
      </div>

      <TeamList />

      {isAddModalOpen && (
        <TeamMemberModal
          isOpen={isAddModalOpen}
          onClose={() => !isLoading && setIsAddModalOpen(false)}
          onSave={handleAddMember}
          isLoading={isLoading}
        />
      )}

      {isInvitesModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 !mt-0">
          <div className="bg-white dark:bg-dark-800 rounded-lg shadow-xl w-full max-w-3xl">
            <div className="flex items-center justify-between p-4 border-b border-gray-200/10 dark:border-gray-700/10">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Convites Enviados
              </h2>
              <button
                onClick={() => setIsInvitesModalOpen(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 focus:outline-none"
              >
                <span className="text-2xl">&times;</span>
              </button>
            </div>
            <div className="p-4">
              <InviteList />
            </div>
          </div>
        </div>
      )}
      <FeedbackModal
        isOpen={feedbackModal.isOpen}
        onClose={closeFeedbackModal}
        type={feedbackModal.type}
        message={feedbackModal.message}
      />
    </div>
  );
}
