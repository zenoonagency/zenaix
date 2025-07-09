/**
 * Service for managing team-related API operations
 */

interface WebhookResponse {
  isOpen?: boolean;
  type: 'success' | 'error';
  message?: string;
}

/**
 * Creates a new team member by calling the webhook
 * @param userData Data of the user to be created
 * @returns Promise with the creation result
 */
export async function createTeamMember(userData: { 
  name: string; 
  email: string; 
  role: string;
}): Promise<WebhookResponse> {
  try {
    const response = await fetch('https://fluxos-n8n.mgmxhs.easypanel.host/webhook/create_user_team', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    // Parse the response as JSON
    const data = await response.json();
    
    // Based on error screenshot, we expect an object with isOpen, type and message
    console.log('Webhook response:', data);
    
    // Return the response in the expected format
    return {
      type: data && data.type ? data.type : (response.ok ? 'success' : 'error'),
      message: data && data.message ? data.message : 'No message provided'
    };
  } catch (error) {
    console.error('Error creating team member:', error);
    return {
      type: 'error',
      message: 'Erro ao conectar com o servidor. Tente novamente mais tarde.'
    };
  }
} 