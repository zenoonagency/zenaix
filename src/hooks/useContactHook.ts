import { useState } from 'react';
import { ContactData } from '../components/ContactModal';

export interface ContactFormData {
  tipo: 'service' | 'feedback';
  [key: string]: any;
}

const CONTACT_WEBHOOK_URL = 'https://fluxos-n8n.mgmxhs.easypanel.host/webhook/contact';

export function useContactHook() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const sendContactForm = async (contactData: ContactData, formData: ContactFormData) => {
    setIsLoading(true);
    setError(null);
    setSuccess(false);
    
    try {
      const tipoEmPortugues = formData.tipo === 'service' ? 'serviço' : 'feedback';
      
      const payload = {
        ...formData,
        tipo: tipoEmPortugues,
        name: contactData.name,
        phone: contactData.phone,
        email: contactData.email,
        timestamp: new Date().toISOString()
      };

      console.log('Enviando dados para webhook:', payload);
      
      const response = await fetch(CONTACT_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Erro ao enviar o formulário');
      }

      const data = await response.json();
      console.log('Resposta do webhook:', data);
      
      setSuccess(true);
      return { success: true, data };
    } catch (err) {
      console.error('Erro ao enviar formulário:', err);
      setError(err instanceof Error ? err.message : 'Erro ao enviar o formulário');
      return { success: false, error: err };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    error,
    success,
    sendContactForm,
  };
} 