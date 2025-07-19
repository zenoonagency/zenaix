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
