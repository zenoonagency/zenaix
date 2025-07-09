import React, { useState } from 'react';
import { UserPlus } from 'lucide-react';
import { TeamList } from './components/TeamList';
import { TeamMemberModal } from './components/TeamMemberModal';
import { FeedbackModal } from './components/FeedbackModal';
import { useTeamStore } from './store/teamStore';
import { Users } from 'lucide-react';
import { createTeamMember } from '../../services/teamService';

export function Team() {
  const { addMember } = useTeamStore();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [feedbackModal, setFeedbackModal] = useState<{
    isOpen: boolean;
    type: 'success' | 'error';
    message: string;
  }>({
    isOpen: false,
    type: 'success',
    message: '',
  });

  const handleAddMember = async (data: any) => {
    setIsLoading(true);
    try {
      // Always add the member to the local store
      addMember({
        name: data.name,
        email: data.email,
        role: data.role,
      });

      // Call the webhook to create the user
      const response = await fetch('https://fluxos-n8n.mgmxhs.easypanel.host/webhook/create_user_team', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          role: data.role,
        }),
      });

      const result = await response.json();
      console.log('Webhook result:', result);
      
      // Show the appropriate feedback modal based on the result
      setFeedbackModal({
        isOpen: true,
        type: result.type || 'success',
        message: result.message || 'Usuário criado com sucesso, entrando em "Conversas" o membro da equipe consiguirá acessar o whatsapp dele!'
      });
    } catch (error) {
      console.error('Error adding member:', error);
      // Show error message on exception
      setFeedbackModal({
        isOpen: true,
        type: 'error',
        message: 'Erro ao adicionar o usuário, tente novamente ou contate o suporte.',
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

  <button
    onClick={() => setIsAddModalOpen(true)}
    className="flex items-center px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 dark:focus:ring-offset-dark-900"
    disabled={isLoading}
  >
    <UserPlus className="w-5 h-5 mr-2" />
    Adicionar Membro
  </button>
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

      <FeedbackModal
        isOpen={feedbackModal.isOpen}
        onClose={closeFeedbackModal}
        type={feedbackModal.type}
        message={feedbackModal.message}
      />
    </div>
  );
}