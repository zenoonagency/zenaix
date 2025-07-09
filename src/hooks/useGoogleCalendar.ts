import { useState, useEffect, useCallback } from 'react';
import { EventInput } from '@fullcalendar/core';
import { toast } from 'react-toastify';

interface GoogleUser {
  name: string;
  email: string;
  picture: string;
}

export function useGoogleCalendar() {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [events, setEvents] = useState<EventInput[]>([]);
  const [googleUser, setGoogleUser] = useState<GoogleUser | null>(null);
  const [tokenClient, setTokenClient] = useState<any>(null);

  const initialize = useCallback(async () => {
    try {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);

      script.onload = () => {
        if (!window.google) return;

        const client = window.google.accounts.oauth2.initTokenClient({
          client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
          scope: 'https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email',
          callback: handleAuthResponse,
        });

        setTokenClient(client);
      };
    } catch (error) {
      console.error('Erro ao inicializar Google Calendar:', error);
      toast.error('Erro ao carregar Google Calendar');
    }
  }, []);

  const handleAuthResponse = useCallback(async (response: any) => {
    if (response.error) {
      console.error('Erro na autenticação:', response);
      toast.error('Erro ao conectar com Google Calendar');
      return;
    }

    try {
      setIsLoading(true);

      // Carrega a API do Google
      await new Promise((resolve) => {
        const script = document.createElement('script');
        script.src = 'https://apis.google.com/js/api.js';
        script.onload = resolve;
        document.head.appendChild(script);
      });

      // Inicializa o cliente da API
      await new Promise((resolve) => {
        window.gapi.load('client', resolve);
      });

      // Inicializa o cliente do Calendar
      await window.gapi.client.init({});
      await window.gapi.client.load('calendar', 'v3');

      // Obtém informações do usuário
      const userResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: {
          'Authorization': `Bearer ${response.access_token}`
        }
      });
      const userData = await userResponse.json();

      setGoogleUser({
        name: userData.name,
        email: userData.email,
        picture: userData.picture
      });

      // Configura o token de acesso para as chamadas da API
      window.gapi.client.setToken({
        access_token: response.access_token
      });

      setIsConnected(true);
      toast.success('Conectado ao Google Calendar com sucesso!');
      await fetchEvents();
    } catch (error) {
      console.error('Erro ao processar resposta:', error);
      toast.error('Erro ao conectar com Google Calendar');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signIn = useCallback(async () => {
    if (!tokenClient) {
      toast.error('Aguarde o carregamento da API do Google');
      return;
    }

    try {
      setIsLoading(true);
      tokenClient.requestAccessToken();
    } catch (error) {
      console.error('Erro ao fazer login:', error);
      toast.error('Erro ao conectar com Google Calendar');
    } finally {
      setIsLoading(false);
    }
  }, [tokenClient]);

  const signOut = useCallback(async () => {
    try {
      if (window.google?.accounts?.oauth2) {
        window.google.accounts.oauth2.revoke(window.gapi.client.getToken()?.access_token || '');
        window.gapi.client.setToken('');
      }
      setIsConnected(false);
      setGoogleUser(null);
      setEvents([]);
      toast.success('Desconectado do Google Calendar');
    } catch (error) {
      console.error('Erro ao desconectar:', error);
      toast.error('Erro ao desconectar do Google Calendar');
    }
  }, []);

  const fetchEvents = useCallback(async () => {
    if (!isConnected) return;

    try {
      setIsLoading(true);
      const response = await window.gapi.client.calendar.events.list({
        'calendarId': 'primary',
        'timeMin': (new Date()).toISOString(),
        'showDeleted': false,
        'singleEvents': true,
        'maxResults': 100,
        'orderBy': 'startTime'
      });

      const events = response.result.items.map(event => ({
        id: event.id,
        title: event.summary,
        start: event.start.dateTime || event.start.date,
        end: event.end.dateTime || event.end.date,
        description: event.description
      }));

      setEvents(events);
    } catch (error) {
      console.error('Erro ao buscar eventos:', error);
      toast.error('Erro ao carregar eventos do Google Calendar');
    } finally {
      setIsLoading(false);
    }
  }, [isConnected]);

  const createEvent = useCallback(async (event: EventInput) => {
    if (!isConnected) {
      toast.error('Você precisa estar conectado ao Google Calendar');
      throw new Error('Not connected to Google Calendar');
    }

    try {
      setIsLoading(true);
      const response = await window.gapi.client.calendar.events.insert({
        'calendarId': 'primary',
        'resource': {
          'summary': event.title,
          'description': event.description,
          'start': {
            'dateTime': event.start,
            'timeZone': Intl.DateTimeFormat().resolvedOptions().timeZone
          },
          'end': {
            'dateTime': event.end,
            'timeZone': Intl.DateTimeFormat().resolvedOptions().timeZone
          }
        }
      });

      const newEvent = {
        id: response.result.id,
        title: response.result.summary,
        start: response.result.start.dateTime || response.result.start.date,
        end: response.result.end.dateTime || response.result.end.date,
        description: response.result.description
      };

      setEvents(prev => [...prev, newEvent]);
      return newEvent;
    } catch (error) {
      console.error('Erro ao criar evento:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [isConnected]);

  const updateEvent = useCallback(async (event: EventInput) => {
    if (!isConnected) {
      toast.error('Você precisa estar conectado ao Google Calendar');
      throw new Error('Not connected to Google Calendar');
    }

    try {
      setIsLoading(true);
      const response = await window.gapi.client.calendar.events.update({
        'calendarId': 'primary',
        'eventId': event.id as string,
        'resource': {
          'summary': event.title,
          'description': event.description,
          'start': {
            'dateTime': event.start,
            'timeZone': Intl.DateTimeFormat().resolvedOptions().timeZone
          },
          'end': {
            'dateTime': event.end,
            'timeZone': Intl.DateTimeFormat().resolvedOptions().timeZone
          }
        }
      });

      const updatedEvent = {
        id: response.result.id,
        title: response.result.summary,
        start: response.result.start.dateTime || response.result.start.date,
        end: response.result.end.dateTime || response.result.end.date,
        description: response.result.description
      };

      setEvents(prev => prev.map(e => e.id === event.id ? updatedEvent : e));
      return updatedEvent;
    } catch (error) {
      console.error('Erro ao atualizar evento:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [isConnected]);

  const deleteEvent = useCallback(async (eventId: string) => {
    if (!isConnected) {
      toast.error('Você precisa estar conectado ao Google Calendar');
      throw new Error('Not connected to Google Calendar');
    }

    try {
      setIsLoading(true);
      await window.gapi.client.calendar.events.delete({
        'calendarId': 'primary',
        'eventId': eventId
      });

      setEvents(prev => prev.filter(e => e.id !== eventId));
    } catch (error) {
      console.error('Erro ao deletar evento:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [isConnected]);

  useEffect(() => {
    initialize();
  }, [initialize]);

  return {
    isConnected,
    isLoading,
    events,
    googleUser,
    signIn,
    signOut,
    createEvent,
    updateEvent,
    deleteEvent,
    refreshEvents: fetchEvents
  };
} 