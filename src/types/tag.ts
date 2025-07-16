export interface InputCreateTagDTO {
  name: string;
  color: string;
}

export interface InputUpdateTagDTO {
  name?: string;
  color?: string;
}

export interface OutputTagDTO {
  id: string;
  name: string;
  color: string;
  organization_id: string;
}

export interface TagState {
  tags: OutputTagDTO[];
  isLoading: boolean;
  error: string | null;
  lastFetched: number | null;

  setTags: (tags: OutputTagDTO[]) => void;
  addTag: (tag: OutputTagDTO) => void;
  updateTag: (tag: OutputTagDTO) => void;
  deleteTag: (tagId: string) => void;

  fetchAllTags: (token: string, organizationId: string) => Promise<void>;
}
