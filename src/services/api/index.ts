import { aiService } from './ai.service';
import { documentService } from './document.service';

export const api = {
  startAI: aiService.start,
  stopAI: aiService.stop,
  uploadDocument: documentService.upload
};