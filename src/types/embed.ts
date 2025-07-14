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
