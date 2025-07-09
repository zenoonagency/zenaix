import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { TeamState } from '../types';
import { generateId } from '../../../utils/generateId';

export const useTeamStore = create<TeamState>()(
  persist(
    (set) => ({
      members: [],

      addMember: (member) =>
        set((state) => ({
          members: [
            ...state.members,
            {
              ...member,
              id: generateId(),
            },
          ],
        })),

      updateMember: (id, updates) =>
        set((state) => ({
          members: state.members.map((member) =>
            member.id === id ? { ...member, ...updates } : member
          ),
        })),

      deleteMember: (id) =>
        set((state) => ({
          members: state.members.filter((member) => member.id !== id),
        })),
    }),
    {
      name: 'team-store',
    }
  )
);