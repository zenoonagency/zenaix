import { HttpError } from './errors';

export async function handleResponse(response: Response): Promise<any> {
  if (!response.ok) {
    let errorMessage = 'Erro no servidor. Por favor, tente novamente.';
    
    try {
      const contentType = response.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
      } else {
        errorMessage = await response.text() || errorMessage;
      }
    } catch {
      // Keep default error message if parsing fails
    }

    throw new HttpError(errorMessage, response.status, response.statusText);
  }

  if (response.status === 204) {
    return null;
  }

  const contentType = response.headers.get('content-type');
  if (contentType?.includes('application/json')) {
    return response.json();
  }

  return null;
}