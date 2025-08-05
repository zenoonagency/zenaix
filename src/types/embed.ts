export interface InputCreateEmbedDTO {
  name: string;
  url: string;
}

export interface InputUpdateEmbedDTO extends InputCreateEmbedDTO {}

export interface EmbedOutput {
  id: string;
  name: string;
  url: string;
  organization_id: string;
  creator_id: string;
  created_at: string;
  updated_at: string;
}

export interface EmbedPagesState {
  pages: EmbedOutput[];
  isLoading: boolean;
  error: string | null;
  lastFetched: number | null;
  cleanUserData: () => void;

  setPages: (pages: EmbedOutput[]) => void;
  addPage: (page: EmbedOutput) => void;
  updatePage: (page: EmbedOutput) => void;
  deletePage: (pageId: string) => void;
  fetchAllEmbedPages: (token: string, organizationId: string) => Promise<void>;
}
