import { OutputListDTO } from "./list";
import { OutputCardDTO, SubtaskDTO, AttachmentDTO } from "./card";

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
  language?: string;
  timezone?: string;
  organization?: any | null;
  organization_mastered?: any | null;
}

export interface BoardGoal {
  id: string;
  name: string;
  description: string;
  value: any; // Pode ser um objeto vazio {} ou qualquer outro tipo conforme a API
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
  creator?: BoardMember;
  lists: BoardList[];
  membersWithAccess?: BoardMember[];
  members_with_access?: BoardMember[]; // compatível com a nova resposta da API
  goal?: BoardGoal;
}

export interface InputCreateBoardDTO {
  name: string;
  description: string;
  access_level: BoardAccessLevel;
  member_ids?: string[];
  goal?: {
    name: string;
    description: string;
    value: any;
  };
}

export interface InputUpdateBoardDTO {
  name?: string;
  description?: string;
  access_level?: BoardAccessLevel;
  member_ids?: string[];
  goal?: {
    name?: string;
    description?: string;
    value?: any;
  };
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

export interface BoardState {
  boards: Board[];
  isLoading: boolean;
  isDashboardLoading: boolean;
  error: string | null;
  selectedBoard: Board | null;
  lastFetched: number | null;

  activeBoardId: string | null;
  lastUsedBoardId: string | null;
  activeBoard: Board | null;
  setActiveBoardId: (boardId: string | null) => void;
  setLastUsedBoardId: (boardId: string | null) => void;
  setActiveBoard: (board: Board | null) => void;
  selectActiveBoard: (boards: Board[]) => void;
  fetchFullBoard: (boardId: string) => Promise<void>;
  selectAndLoadKanbanBoard: (boardId: string) => Promise<void>;

  boardDashboardActiveId: string | null;
  boardDashboardActive: Board | null;
  lastUsedDashboardBoardId: string | null;
  setBoardDashboardActiveId: (boardId: string | null) => void;
  setBoardDashboardActive: (board: Board | null) => void;
  setLastUsedDashboardBoardId: (boardId: string | null) => void;
  selectDashboardBoard: (boards: Board[]) => void;
  fetchFullDashboardBoard: (boardId: string) => Promise<void>;
  selectAndLoadDashboardBoard: (boardId: string) => Promise<void>;
  topSellers: TopSellersResponse;

  setBoards: (boards: Board[]) => void;
  addBoard: (board: Board) => void;
  updateBoard: (board: Board) => void;
  removeBoard: (boardId: string) => void;
  cleanUserData: () => void;

  setSelectedBoard: (board: Board | null) => void;
  addListToActiveBoard: (list: OutputListDTO) => void;
  updateListInActiveBoard: (list: OutputListDTO) => void;
  removeListFromActiveBoard: (listId: string) => void;
  addCardToActiveBoard: (card: OutputCardDTO) => void;
  updateCardInActiveBoard: (card: OutputCardDTO) => void;
  removeCardFromActiveBoard: (cardId: string, listId: string) => void;
  addSubtaskToCard: (subtask: SubtaskDTO) => void;
  updateSubtaskInCard: (subtask: SubtaskDTO) => void;
  removeSubtaskFromCard: (subtask: { id: string; card_id: string }) => void;
  addAttachmentToCard: (attachment: AttachmentDTO) => void;
  updateAttachmentInCard: (attachment: AttachmentDTO) => void;
  removeAttachmentFromCard: (attachment: {
    id: string;
    card_id: string;
  }) => void;

  fetchAllBoards: (token: string, organizationId: string) => Promise<void>;
  fetchTopSellers: (boardId: string) => Promise<void>;
}
