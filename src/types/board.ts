export type BoardAccessLevel =
  | "TEAM_WIDE"
  | "CREATOR_ONLY"
  | "SELECTED_MEMBERS";

export interface BoardMember {
  id: string;
  email: string;
  name: string;
  first_name?: string | null;
  last_name?: string | null;
  role: string;
  organization_id: string;
  created_at: string;
  updated_at: string;
  avatar_url?: string | null;
}

export interface BoardList {
  id: string;
  name: string;
  color: string;
  position: number;
  board_id: string;
  created_at: string;
  updated_at: string;
  is_deletable?: boolean;
  cards: BoardCard[];
}

export interface BoardCard {
  id: string;
  title: string;
  description?: string;
  value?: number;
  phone?: string;
  due_date?: string;
  priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  position: number;
  list_id: string;
  assignee_id?: string | null;
  assignee?: BoardMember | null;
  tag_ids?: string[];
  tags?: Array<{
    id: string;
    name: string;
    color: string;
    organization_id: string;
  }>;
  subtasks?: Array<{
    id: string;
    title: string;
    description?: string | null;
    is_completed: boolean;
    card_id: string;
  }>;
  attachments?: Array<any>;
  created_at: string;
  updated_at: string;
  list?: BoardList;
}

export interface Board {
  id: string;
  name: string;
  description: string;
  organization_id: string;
  creator_id: string;
  access_level: BoardAccessLevel;
  created_at: string;
  updated_at: string;
  completed_list_id?: string;
  lists: BoardList[];
  membersWithAccess?: BoardMember[];
}

export interface InputCreateBoardDTO {
  name: string;
  description: string;
  access_level: BoardAccessLevel;
  member_ids?: string[];
}

export interface InputUpdateBoardDTO {
  name?: string;
  description?: string;
  access_level?: BoardAccessLevel;
  member_ids?: string[];
}

export interface InputSetCompletedListDTO {
  list_id: string;
}

export interface BoardResponse {
  message: string;
  data: Board;
  status: number;
}

export interface BoardListResponse {
  message: string;
  data: Board[];
  status: number;
}

export interface BoardAccessListMember {
  id: string;
  name: string;
  email: string;
  hasAccess: boolean;
}

export interface BoardAccessListResponse {
  message: string;
  data: BoardAccessListMember[];
  status: number;
}

export interface TopSeller {
  user: {
    id: string;
    name: string;
    avatar_url: string | null;
  };
  totalValue: number;
}

export interface TopSellersResponse {
  data: TopSeller[];
}
