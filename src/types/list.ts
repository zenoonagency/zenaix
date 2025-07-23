export interface InputCreateListDTO {
  name: string;
  color: string;
}

export interface InputUpdateListDTO {
  name?: string;
  color?: string;
  position?: number;
}

export interface OutputListDTO {
  id: string;
  name: string;
  color: string;
  position: number;
  board_id: string;
  created_at: string;
  updated_at: string;
}

export interface ListResponse {
  message: string;
  data: OutputListDTO;
  status: number;
}

export interface ListListResponse {
  message: string;
  data: OutputListDTO[];
  status: number;
}

export interface ListState {
  lists: OutputListDTO[];
  isLoading: boolean;
  error: string | null;
  lastFetched: number | null;
  selectedList: OutputListDTO | null;

  setLists: (lists: OutputListDTO[]) => void;
  addList: (list: OutputListDTO) => void;
  updateList: (list: OutputListDTO) => void;
  removeList: (listId: string) => void;
  selectList: (list: OutputListDTO) => void;
  cleanUserData: () => void;

  fetchLists: (boardId: string) => Promise<void>;
}
