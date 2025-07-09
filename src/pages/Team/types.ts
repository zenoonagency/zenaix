export type TeamRole = 'admin' | 'user';

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: TeamRole;
}

export interface TeamState {
  members: TeamMember[];
  addMember: (member: Omit<TeamMember, 'id'>) => void;
  updateMember: (id: string, updates: Partial<TeamMember>) => void;
  deleteMember: (id: string) => void;
}