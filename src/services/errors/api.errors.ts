export class NetworkError extends Error {
  constructor(message = 'Erro de conexão. Verifique sua internet e tente novamente.') {
    super(message);
    this.name = 'NetworkError';
  }
}

export class TimeoutError extends Error {
  constructor(message = 'A requisição excedeu o tempo limite. Tente novamente.') {
    super(message);
    this.name = 'TimeoutError';
  }
}

export class APIError extends Error {
  constructor(message = 'Ocorreu um erro ao processar sua requisição.') {
    super(message);
    this.name = 'APIError';
  }
}