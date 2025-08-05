/**
 * Utilitário para traduzir erros do Supabase para português
 */

export function translateSupabaseError(error: any): string {
  if (!error || !error.message) {
    return "Ocorreu um erro inesperado";
  }

  const message = error.message.toLowerCase();

  // Erros de autenticação
  if (message.includes("invalid login credentials")) {
    return "Email ou senha incorretos";
  }

  if (message.includes("email not confirmed")) {
    return "Email não confirmado. Verifique sua caixa de entrada e confirme seu email";
  }

  if (message.includes("user not found")) {
    return "Usuário não encontrado";
  }

  if (message.includes("weak password")) {
    return "Senha muito fraca. Use pelo menos 6 caracteres";
  }

  if (message.includes("password should be at least")) {
    return "A senha deve ter pelo menos 6 caracteres";
  }

  if (message.includes("email already registered") || message.includes("already registered")) {
    return "Este email já está cadastrado. Faça login ou use outro email";
  }

  if (message.includes("invalid email")) {
    return "Email inválido";
  }

  if (message.includes("too many requests")) {
    return "Muitas tentativas. Aguarde um momento e tente novamente";
  }

  if (message.includes("network error") || message.includes("fetch")) {
    return "Erro de conexão. Verifique sua internet e tente novamente";
  }

  if (message.includes("jwt expired")) {
    return "Sessão expirada. Faça login novamente";
  }

  if (message.includes("invalid jwt")) {
    return "Token inválido. Faça login novamente";
  }

  if (message.includes("user already signed in")) {
    return "Usuário já está logado";
  }

  if (message.includes("signup disabled")) {
    return "Cadastro temporariamente desabilitado";
  }

  if (message.includes("signin disabled")) {
    return "Login temporariamente desabilitado";
  }

  // Erros de storage
  if (message.includes("storage")) {
    if (message.includes("not found")) {
      return "Arquivo não encontrado";
    }
    if (message.includes("quota exceeded")) {
      return "Limite de armazenamento excedido";
    }
    if (message.includes("invalid file")) {
      return "Arquivo inválido";
    }
    if (message.includes("file too large")) {
      return "Arquivo muito grande";
    }
    return "Erro ao processar arquivo";
  }

  // Erros de OAuth
  if (message.includes("oauth")) {
    if (message.includes("cancelled")) {
      return "Login cancelado";
    }
    if (message.includes("provider not found")) {
      return "Provedor de login não disponível";
    }
    return "Erro no login social";
  }

  // Erros de recuperação de senha
  if (message.includes("recovery")) {
    if (message.includes("expired")) {
      return "Link de recuperação expirado. Solicite um novo";
    }
    if (message.includes("invalid")) {
      return "Link de recuperação inválido";
    }
    return "Erro na recuperação de senha";
  }

  // Erros de confirmação de email
  if (message.includes("confirmation")) {
    if (message.includes("expired")) {
      return "Link de confirmação expirado. Solicite um novo";
    }
    if (message.includes("invalid")) {
      return "Link de confirmação inválido";
    }
    return "Erro na confirmação de email";
  }

  // Erros genéricos
  if (message.includes("internal server error")) {
    return "Erro interno do servidor. Tente novamente mais tarde";
  }

  if (message.includes("service unavailable")) {
    return "Serviço temporariamente indisponível";
  }

  if (message.includes("bad request")) {
    return "Dados inválidos";
  }

  if (message.includes("unauthorized")) {
    return "Acesso não autorizado";
  }

  if (message.includes("forbidden")) {
    return "Acesso negado";
  }

  // Se não encontrar uma tradução específica, retorna uma mensagem genérica
  console.warn("Erro do Supabase não traduzido:", error.message);
  return "Ocorreu um erro inesperado. Tente novamente";
}

/**
 * Função para tratar erros do Supabase de forma consistente
 */
export function handleSupabaseError(error: any, defaultMessage: string = "Ocorreu um erro"): string {
  try {
    return translateSupabaseError(error);
  } catch (translationError) {
    console.error("Erro ao traduzir erro do Supabase:", translationError);
    return defaultMessage;
  }
} 