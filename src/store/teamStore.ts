import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  isAdmin: boolean;
}

interface TeamState {
  members: TeamMember[];
  addMember: (member: Omit<TeamMember, 'id'>) => void;
  updateMember: (id: string, member: Partial<TeamMember>) => void;
  deleteMember: (id: string) => void;
}

const initialMembers: TeamMember[] = [
  {
    id: 'myund2ib7mm8b06n3',
    name: 'Miguel',
    email: 'teste@teste.com',
    role: 'Desenvolvedor',
    isAdmin: true
  },
  {
    id: 'teste1',
    name: 'teste',
    email: 'teste@teste.com',
    role: 'Desenvolvedor',
    isAdmin: false
  },
  {
    id: 'teste2',
    name: 'teste2',
    email: 'teste2@teste.com',
    role: 'Desenvolvedor',
    isAdmin: false
  },
  {
    id: 'vitor',
    name: 'Vitor',
    email: 'vitor@teste.com',
    role: 'Usuário',
    isAdmin: false
  }
];

export const useTeamStore = create<TeamState>()(
  persist(
    (set) => ({
      members: initialMembers,
      addMember: (member) =>
        set((state) => ({
          members: [
            ...state.members,
            { ...member, id: Math.random().toString(36).substr(2, 9) },
          ],
        })),
      updateMember: (id, updatedMember) =>
        set((state) => ({
          members: state.members.map((member) =>
            member.id === id ? { ...member, ...updatedMember } : member
          ),
        })),
      deleteMember: (id) =>
        set((state) => ({
          members: state.members.filter((member) => member.id !== id),
        })),
    }),
    {
      name: 'team-storage',
      version: 1,
    }
  )
); 