interface QRCodeResponse {
  qrCode: string;
  status: 'pending' | 'connected' | 'disconnected';
}

interface WhatsAppStatus {
  connected: boolean;
  qrCode?: string;
}

// Mock data for development
const MOCK_QR_CODE = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

export const evolutionApi = {
  baseUrl: 'https://api.evolution.ai',
  
  async getQRCode(): Promise<QRCodeResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/whatsapp/qr-code`);
      if (!response.ok) throw new Error('Failed to get QR code');
      return response.json();
    } catch (error) {
      console.warn('Using mock QR code for development');
      // Return mock data for development
      return {
        qrCode: MOCK_QR_CODE,
        status: 'pending'
      };
    }
  },

  async checkStatus(): Promise<WhatsAppStatus> {
    try {
      const response = await fetch(`${this.baseUrl}/whatsapp/status`);
      if (!response.ok) throw new Error('Failed to check status');
      return response.json();
    } catch (error) {
      console.warn('Using mock status for development');
      // Return mock data for development
      return {
        connected: false,
        qrCode: MOCK_QR_CODE
      };
    }
  },

  async sendMessage(phone: string, message: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/whatsapp/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, message })
      });
      if (!response.ok) throw new Error('Failed to send message');
    } catch (error) {
      console.warn('Message sending simulated for development');
      // Simulate successful message sending
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  },

  async takeControl(conversationId: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/conversation/control`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          conversationId,
          action: 'take'
        })
      });
      if (!response.ok) throw new Error('Failed to take control');
    } catch (error) {
      console.warn('Control action simulated for development');
      await new Promise(resolve => setTimeout(resolve, 300));
    }
  },

  async returnControl(conversationId: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/conversation/control`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          conversationId,
          action: 'return'
        })
      });
      if (!response.ok) throw new Error('Failed to return control');
    } catch (error) {
      console.warn('Control action simulated for development');
      await new Promise(resolve => setTimeout(resolve, 300));
    }
  }
};