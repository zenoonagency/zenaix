export interface InputCreateEmbedDTO {
  name: string;
  url: string;
}

export interface InputUpdateEmbedDTO extends InputCreateEmbedDTO {}

export interface EmbedOutput {
  id: string;
  name: string;
  url: string;
  organizationId: string;
  creatorId: string;
  createdAt: string;
  updatedAt: string;
}
