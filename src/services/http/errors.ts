export class HttpError extends Error {
  constructor(
    message: string,
    public status: number,
    public statusText: string,
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

export class TimeoutError extends Error {
  constructor(message = 'A requisição excedeu o tempo limite.') {
    super(message);
    this.name = 'TimeoutError';
  }
}

export class NetworkError extends Error {
  constructor(message = 'Erro de conexão. Verifique sua internet.') {
    super(message);
    this.name = 'NetworkError';
  }
}