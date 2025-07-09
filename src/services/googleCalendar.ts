import { EventInput } from '@fullcalendar/core';

interface CalendarCredentials {
  userId: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

interface CalendarUser {
  id: string;
  email: string;
  name: string;
  picture: string;
}

class GoogleCalendarService {
  private credentials: Map<string, CalendarCredentials> = new Map();
  private users: Map<string, CalendarUser> = new Map();

  // Inicializa as credenciais para um usuário específico
  async initializeForUser(userId: string) {
    // Aqui você buscaria as credenciais do banco de dados
    const savedCredentials = await this.loadUserCredentials(userId);
    if (savedCredentials) {
      this.credentials.set(userId, savedCredentials);
    }
  }

  // Salva as credenciais do usuário
  async saveUserCredentials(userId: string, credentials: CalendarCredentials) {
    // Aqui você salvaria no banco de dados
    this.credentials.set(userId, credentials);
    // Exemplo de como salvar no localStorage (temporário)
    localStorage.setItem(`calendar-credentials-${userId}`, JSON.stringify(credentials));
  }

  // Carrega as credenciais do usuário
  private async loadUserCredentials(userId: string): Promise<CalendarCredentials | null> {
    // Aqui você buscaria do banco de dados
    // Por enquanto, vamos usar localStorage como exemplo
    const saved = localStorage.getItem(`calendar-credentials-${userId}`);
    return saved ? JSON.parse(saved) : null;
  }

  // Verifica se o token expirou e precisa ser renovado
  private async ensureValidToken(userId: string) {
    const credentials = this.credentials.get(userId);
    if (!credentials) {
      throw new Error('User not authenticated');
    }

    if (credentials.expiresAt < Date.now()) {
      // Aqui você implementaria a lógica de refresh token
      // usando o refreshToken para obter um novo accessToken
      // await this.refreshAccessToken(userId, credentials.refreshToken);
    }
  }

  // Lista eventos para um usuário específico
  async listEvents(userId: string): Promise<EventInput[]> {
    await this.ensureValidToken(userId);
    const credentials = this.credentials.get(userId);
    
    if (!credentials) {
      throw new Error('User not authenticated');
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Aqui você usaria o token do usuário específico
    const response = await gapi.client.calendar.events.list({
      'calendarId': 'primary',
      'timeMin': startOfMonth.toISOString(),
      'timeMax': endOfMonth.toISOString(),
      'showDeleted': false,
      'singleEvents': true,
      'orderBy': 'startTime',
      'access_token': credentials.accessToken
    });

    return response.result.items?.map(event => ({
      id: event.id,
      title: event.summary,
      start: event.start?.dateTime || event.start?.date,
      end: event.end?.dateTime || event.end?.date,
      description: event.description,
      location: event.location,
    })) || [];
  }

  // Cria um evento para um usuário específico
  async createEvent(userId: string, event: EventInput): Promise<EventInput> {
    await this.ensureValidToken(userId);
    const credentials = this.credentials.get(userId);
    
    if (!credentials) {
      throw new Error('User not authenticated');
    }

    const response = await gapi.client.calendar.events.insert({
      calendarId: 'primary',
      resource: {
        summary: event.title,
        description: event.description,
        location: event.location,
        start: {
          dateTime: new Date(event.start as string).toISOString(),
        },
        end: {
          dateTime: new Date(event.end as string).toISOString(),
        },
      },
      access_token: credentials.accessToken
    });

    return {
      id: response.result.id,
      title: response.result.summary,
      start: response.result.start?.dateTime || response.result.start?.date,
      end: response.result.end?.dateTime || response.result.end?.date,
      description: response.result.description,
      location: response.result.location,
    };
  }

  // Atualiza um evento para um usuário específico
  async updateEvent(userId: string, event: EventInput): Promise<EventInput> {
    await this.ensureValidToken(userId);
    const credentials = this.credentials.get(userId);
    
    if (!credentials) {
      throw new Error('User not authenticated');
    }

    if (!event.id) {
      throw new Error('Event ID is required for update');
    }

    const response = await gapi.client.calendar.events.update({
      calendarId: 'primary',
      eventId: event.id,
      resource: {
        summary: event.title,
        description: event.description,
        location: event.location,
        start: {
          dateTime: new Date(event.start as string).toISOString(),
        },
        end: {
          dateTime: new Date(event.end as string).toISOString(),
        },
      },
      access_token: credentials.accessToken
    });

    return {
      id: response.result.id,
      title: response.result.summary,
      start: response.result.start?.dateTime || response.result.start?.date,
      end: response.result.end?.dateTime || response.result.end?.date,
      description: response.result.description,
      location: response.result.location,
    };
  }

  // Deleta um evento para um usuário específico
  async deleteEvent(userId: string, eventId: string): Promise<void> {
    await this.ensureValidToken(userId);
    const credentials = this.credentials.get(userId);
    
    if (!credentials) {
      throw new Error('User not authenticated');
    }

    await gapi.client.calendar.events.delete({
      calendarId: 'primary',
      eventId: eventId,
      access_token: credentials.accessToken
    });
  }

  // Desconecta um usuário específico
  async disconnectUser(userId: string) {
    this.credentials.delete(userId);
    this.users.delete(userId);
    localStorage.removeItem(`calendar-credentials-${userId}`);
  }
}

export const googleCalendarService = new GoogleCalendarService(); 