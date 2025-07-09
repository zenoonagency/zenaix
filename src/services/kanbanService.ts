import { supabase } from './supabaseClient';
import { getCurrentUser } from './authService';
import { monitorSupabaseOperation, performanceMonitor } from './performanceMonitor';

export interface Board {
  id: string;
  title: string;
  description: string | null;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface List {
  id: string;
  title: string;
  position: number;
  board_id: string;
  created_at: string;
  updated_at: string;
}

export interface Card {
  id: string;
  title: string;
  description: string | null;
  position: number;
  list_id: string;
  created_at: string;
  updated_at: string;
}

// Sistema de cache para melhorar o desempenho
const CACHE_DURATION = 5000; // 5 segundos
const cache = {
  boards: { data: null as Board[] | null, timestamp: 0 },
  boardDetails: {} as Record<string, { data: any, timestamp: number }>,
  lists: {} as Record<string, { data: List[], timestamp: number }>,
  cards: {} as Record<string, { data: Card[], timestamp: number }>,
  clearBoardCache: (boardId?: string) => {
    if (boardId) {
      // Limpar cache apenas para o board específico
      delete cache.boardDetails[boardId];
      console.log(`[Cache] Limpando cache do board ${boardId}`);
    } else {
      // Limpar todo o cache quando uma operação global é realizada
      cache.boards.data = null;
      cache.boards.timestamp = 0;
      cache.boardDetails = {};
      console.log(`[Cache] Limpando cache de todos os boards`);
    }
  },
  clearListCache: (boardId: string) => {
    // Limpar listas quando houver modificações
    delete cache.lists[boardId];
    // Limpar também o board relacionado
    delete cache.boardDetails[boardId];
    console.log(`[Cache] Limpando cache de listas do board ${boardId}`);
  },
  clearCardCache: (listId: string) => {
    // Limpar cards quando houver modificações
    delete cache.cards[listId];
    console.log(`[Cache] Limpando cache de cards da lista ${listId}`);
    
    // Tentar encontrar e limpar o board relacionado
    for (const boardId in cache.boardDetails) {
      const boardData = cache.boardDetails[boardId].data;
      if (boardData?.lists?.some(list => list.id === listId)) {
        delete cache.boardDetails[boardId];
        console.log(`[Cache] Limpando cache do board ${boardId} relacionado à lista ${listId}`);
        break;
      }
    }
  },
  isCacheValid: (timestamp: number) => {
    return Date.now() - timestamp < CACHE_DURATION;
  }
};

export const kanbanService = {
  // ==== BOARDS ====
  getBoards: async (): Promise<Board[]> => {
    try {
      // Verificar se há cache válido
      if (cache.boards.data && cache.isCacheValid(cache.boards.timestamp)) {
        console.log('[KanbanService] Usando cache para obter boards');
        return cache.boards.data;
      }
      
      console.log('[KanbanService] Buscando boards do servidor');
      const user = await getCurrentUser();
      if (!user) throw new Error("Usuário não autenticado");
      
      // Usar o monitor de desempenho
      const { data, error } = await monitorSupabaseOperation(
        'getBoards',
        () => supabase
          .from('boards')
          .select()
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),
        { userId: user.id }
      );
      
      if (error) throw error;
      
      // Armazenar no cache
      cache.boards.data = data;
      cache.boards.timestamp = Date.now();
      
      return data;
    } catch (error) {
      console.error('Erro ao buscar quadros:', error);
      throw error;
    }
  },
  
  getBoardDetails: async (boardId: string) => {
    try {
      // Verificar se há cache válido para este board
      if (
        cache.boardDetails[boardId] && 
        cache.isCacheValid(cache.boardDetails[boardId].timestamp)
      ) {
        console.log(`[KanbanService] Usando cache para obter detalhes do board ${boardId}`);
        return cache.boardDetails[boardId].data;
      }
      
      console.log(`[KanbanService] Buscando detalhes do board ${boardId} do servidor`);
      const user = await getCurrentUser();
      if (!user) throw new Error("Usuário não autenticado");
      
      // Usar o monitor de desempenho
      const { data, error } = await monitorSupabaseOperation(
        'getBoardDetails',
        () => supabase
          .from('boards')
          .select(`
            *,
            lists:lists(
              *,
              cards:cards(*)
            )
          `)
          .eq('id', boardId)
          .eq('user_id', user.id)
          .order('created_at', { foreignTable: 'lists.cards', ascending: true })
          .order('position', { foreignTable: 'lists' })
          .order('position', { foreignTable: 'lists.cards' })
          .single(),
        { boardId, userId: user.id }
      );
      
      if (error) throw error;
      
      // Armazenar no cache
      cache.boardDetails[boardId] = {
        data: data,
        timestamp: Date.now()
      };
      
      return data;
    } catch (error) {
      console.error(`Erro ao buscar detalhes do quadro ${boardId}:`, error);
      throw error;
    }
  },
  
  createBoard: async (title: string, description?: string): Promise<Board> => {
    try {
      console.log(`[KanbanService] Criando board "${title}"`);
      const user = await getCurrentUser();
      if (!user) throw new Error("Usuário não autenticado");
      
      // Usar o monitor de desempenho
      const { data, error } = await monitorSupabaseOperation(
        'createBoard',
        () => supabase
          .from('boards')
          .insert({
            title,
            description,
            user_id: user.id
          })
          .select()
          .single(),
        { title, userId: user.id }
      );
      
      if (error) throw error;
      
      // Limpar cache após criação
      cache.clearBoardCache();
      
      return data;
    } catch (error) {
      console.error('Erro ao criar quadro:', error);
      throw error;
    }
  },
  
  updateBoard: async (id: string, updates: Partial<Board>): Promise<Board> => {
    try {
      console.log(`[KanbanService] Atualizando board ${id}`);
      const user = await getCurrentUser();
      if (!user) throw new Error("Usuário não autenticado");
      
      // Usar o monitor de desempenho
      const { data, error } = await monitorSupabaseOperation(
        'updateBoard',
        () => supabase
          .from('boards')
          .update({
            ...updates,
            updated_at: new Date().toISOString()
          })
          .eq('id', id)
          .eq('user_id', user.id)
          .select()
          .single(),
        { boardId: id, userId: user.id, updates }
      );
      
      if (error) throw error;
      
      // Limpar cache específico após atualização
      cache.clearBoardCache(id);
      
      return data;
    } catch (error) {
      console.error(`Erro ao atualizar quadro ${id}:`, error);
      throw error;
    }
  },
  
  deleteBoard: async (id: string): Promise<void> => {
    try {
      console.log(`[KanbanService] Excluindo board ${id}`);
      const user = await getCurrentUser();
      if (!user) throw new Error("Usuário não autenticado");
      
      // Usar o monitor de desempenho
      const { error } = await monitorSupabaseOperation(
        'deleteBoard',
        () => supabase
          .from('boards')
          .delete()
          .eq('id', id)
          .eq('user_id', user.id),
        { boardId: id, userId: user.id }
      );
      
      if (error) throw error;
      
      // Limpar cache após exclusão
      cache.clearBoardCache();
      
      return;
    } catch (error) {
      console.error(`Erro ao excluir quadro ${id}:`, error);
      throw error;
    }
  },
  
  // ==== LISTS ====
  getLists: async (boardId: string): Promise<List[]> => {
    try {
      // Verificar se há cache válido
      if (
        cache.lists[boardId] && 
        cache.isCacheValid(cache.lists[boardId].timestamp)
      ) {
        console.log(`[KanbanService] Usando cache para obter listas do board ${boardId}`);
        return cache.lists[boardId].data;
      }
      
      console.log(`[KanbanService] Buscando listas do board ${boardId} do servidor`);
      const user = await getCurrentUser();
      if (!user) throw new Error("Usuário não autenticado");
      
      // Verificar se o usuário tem acesso ao board
      const { data: boardData, error: boardError } = await monitorSupabaseOperation(
        'getBoardAccess',
        () => supabase
          .from('boards')
          .select('id')
          .eq('id', boardId)
          .eq('user_id', user.id)
          .single(),
        { boardId, userId: user.id }
      );
      
      if (boardError || !boardData) throw new Error("Acesso negado ao quadro");
      
      // Usar o monitor de desempenho
      const { data, error } = await monitorSupabaseOperation(
        'getLists',
        () => supabase
          .from('lists')
          .select()
          .eq('board_id', boardId)
          .order('position'),
        { boardId }
      );
      
      if (error) throw error;
      
      // Armazenar no cache
      cache.lists[boardId] = {
        data: data,
        timestamp: Date.now()
      };
      
      return data;
    } catch (error) {
      console.error(`Erro ao buscar listas do quadro ${boardId}:`, error);
      throw error;
    }
  },
  
  createList: async (boardId: string, title: string, position: number): Promise<List> => {
    try {
      console.log(`[KanbanService] Criando lista "${title}" para o board ${boardId}`);
      const user = await getCurrentUser();
      if (!user) throw new Error("Usuário não autenticado");
      
      // Verificar se o usuário tem acesso ao board
      const { data: boardData, error: boardError } = await monitorSupabaseOperation(
        'getBoardAccessForList',
        () => supabase
          .from('boards')
          .select('id')
          .eq('id', boardId)
          .eq('user_id', user.id)
          .single(),
        { boardId, userId: user.id }
      );
      
      if (boardError || !boardData) throw new Error("Acesso negado ao quadro");
      
      // Usar o monitor de desempenho
      const { data, error } = await monitorSupabaseOperation(
        'createList',
        () => supabase
          .from('lists')
          .insert({
            title,
            position,
            board_id: boardId
          })
          .select()
          .single(),
        { boardId, title, position }
      );
      
      if (error) throw error;
      
      // Limpar cache após criação
      cache.clearListCache(boardId);
      
      return data;
    } catch (error) {
      console.error(`Erro ao criar lista no quadro ${boardId}:`, error);
      throw error;
    }
  },
  
  updateList: async (id: string, updates: Partial<List>): Promise<List> => {
    try {
      console.log(`[KanbanService] Atualizando lista ${id}`);
      const user = await getCurrentUser();
      if (!user) throw new Error("Usuário não autenticado");
      
      // Obter o board_id para verificação de acesso e limpeza de cache
      const { data: listData, error: listError } = await supabase
        .from('lists')
        .select('board_id')
        .eq('id', id)
        .single();
      
      if (listError || !listData) throw new Error("Lista não encontrada");
      
      // Verificar se o usuário tem acesso ao board
      const { data: boardData, error: boardError } = await supabase
        .from('boards')
        .select('id')
        .eq('id', listData.board_id)
        .eq('user_id', user.id)
        .single();
      
      if (boardError || !boardData) throw new Error("Acesso negado ao quadro");
      
      const { data, error } = await supabase
        .from('lists')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      // Limpar cache após atualização
      cache.clearListCache(listData.board_id);
      
      return data;
    } catch (error) {
      console.error(`Erro ao atualizar lista ${id}:`, error);
      throw error;
    }
  },
  
  deleteList: async (id: string): Promise<void> => {
    try {
      console.log(`[KanbanService] Excluindo lista ${id}`);
      const user = await getCurrentUser();
      if (!user) throw new Error("Usuário não autenticado");
      
      // Obter o board_id para verificação de acesso e limpeza de cache
      const { data: listData, error: listError } = await supabase
        .from('lists')
        .select('board_id')
        .eq('id', id)
        .single();
      
      if (listError || !listData) throw new Error("Lista não encontrada");
      
      // Verificar se o usuário tem acesso ao board
      const { data: boardData, error: boardError } = await supabase
        .from('boards')
        .select('id')
        .eq('id', listData.board_id)
        .eq('user_id', user.id)
        .single();
      
      if (boardError || !boardData) throw new Error("Acesso negado ao quadro");
      
      const { error } = await supabase
        .from('lists')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      // Limpar cache após exclusão
      cache.clearListCache(listData.board_id);
      
      return;
    } catch (error) {
      console.error(`Erro ao excluir lista ${id}:`, error);
      throw error;
    }
  },
  
  // ==== CARDS ====
  getCards: async (listId: string): Promise<Card[]> => {
    try {
      // Verificar se há cache válido
      if (
        cache.cards[listId] && 
        cache.isCacheValid(cache.cards[listId].timestamp)
      ) {
        console.log(`[KanbanService] Usando cache para obter cards da lista ${listId}`);
        return cache.cards[listId].data;
      }
      
      console.log(`[KanbanService] Buscando cards da lista ${listId} do servidor`);
      const user = await getCurrentUser();
      if (!user) throw new Error("Usuário não autenticado");
      
      // Obter o board_id para verificação de acesso
      const { data: listData, error: listError } = await supabase
        .from('lists')
        .select('board_id')
        .eq('id', listId)
        .single();
      
      if (listError || !listData) throw new Error("Lista não encontrada");
      
      // Verificar se o usuário tem acesso ao board
      const { data: boardData, error: boardError } = await supabase
        .from('boards')
        .select('id')
        .eq('id', listData.board_id)
        .eq('user_id', user.id)
        .single();
      
      if (boardError || !boardData) throw new Error("Acesso negado ao quadro");
      
      const { data, error } = await supabase
        .from('cards')
        .select()
        .eq('list_id', listId)
        .order('position');
      
      if (error) throw error;
      
      // Armazenar no cache
      cache.cards[listId] = {
        data: data,
        timestamp: Date.now()
      };
      
      return data;
    } catch (error) {
      console.error(`Erro ao buscar cartões da lista ${listId}:`, error);
      throw error;
    }
  },
  
  createCard: async (listId: string, title: string, position: number, description?: string): Promise<Card> => {
    try {
      console.log(`[KanbanService] Criando card "${title}" para a lista ${listId}`);
      const user = await getCurrentUser();
      if (!user) throw new Error("Usuário não autenticado");
      
      // Obter o board_id para verificação de acesso
      const { data: listData, error: listError } = await supabase
        .from('lists')
        .select('board_id')
        .eq('id', listId)
        .single();
      
      if (listError || !listData) throw new Error("Lista não encontrada");
      
      // Verificar se o usuário tem acesso ao board
      const { data: boardData, error: boardError } = await supabase
        .from('boards')
        .select('id')
        .eq('id', listData.board_id)
        .eq('user_id', user.id)
        .single();
      
      if (boardError || !boardData) throw new Error("Acesso negado ao quadro");
      
      const { data, error } = await supabase
        .from('cards')
        .insert({
          title,
          description,
          position,
          list_id: listId
        })
        .select()
        .single();
      
      if (error) throw error;
      
      // Limpar cache após criação
      cache.clearCardCache(listId);
      
      return data;
    } catch (error) {
      console.error(`Erro ao criar cartão na lista ${listId}:`, error);
      throw error;
    }
  },
  
  updateCard: async (id: string, updates: Partial<Card>): Promise<Card> => {
    try {
      console.log(`[KanbanService] Atualizando card ${id}`);
      const user = await getCurrentUser();
      if (!user) throw new Error("Usuário não autenticado");
      
      // Obter o list_id e board_id para verificação de acesso e limpeza de cache
      const { data: cardData, error: cardError } = await supabase
        .from('cards')
        .select('list_id')
        .eq('id', id)
        .single();
      
      if (cardError || !cardData) throw new Error("Cartão não encontrado");
      
      // Obter o board_id para verificação de acesso
      const { data: listData, error: listError } = await supabase
        .from('lists')
        .select('board_id')
        .eq('id', cardData.list_id)
        .single();
      
      if (listError || !listData) throw new Error("Lista não encontrada");
      
      // Verificar se o usuário tem acesso ao board
      const { data: boardData, error: boardError } = await supabase
        .from('boards')
        .select('id')
        .eq('id', listData.board_id)
        .eq('user_id', user.id)
        .single();
      
      if (boardError || !boardData) throw new Error("Acesso negado ao quadro");
      
      const { data, error } = await supabase
        .from('cards')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      // Limpar cache após atualização
      cache.clearCardCache(cardData.list_id);
      
      return data;
    } catch (error) {
      console.error(`Erro ao atualizar cartão ${id}:`, error);
      throw error;
    }
  },
  
  moveCard: async (cardId: string, toListId: string, newPosition: number): Promise<Card> => {
    try {
      console.log(`[KanbanService] Movendo card ${cardId} para lista ${toListId} na posição ${newPosition}`);
      const user = await getCurrentUser();
      if (!user) throw new Error("Usuário não autenticado");
      
      // Obter dados do cartão para verificação e limpeza de cache
      const { data: cardData, error: cardError } = await supabase
        .from('cards')
        .select('list_id')
        .eq('id', cardId)
        .single();
      
      if (cardError || !cardData) throw new Error("Cartão não encontrado");
      
      // Verificar se o usuário tem acesso ao board da lista de destino
      const { data: destListData, error: destListError } = await supabase
        .from('lists')
        .select('board_id')
        .eq('id', toListId)
        .single();
      
      if (destListError || !destListData) throw new Error("Lista de destino não encontrada");
      
      // Verificar se o usuário tem acesso ao board
      const { data: boardData, error: boardError } = await supabase
        .from('boards')
        .select('id')
        .eq('id', destListData.board_id)
        .eq('user_id', user.id)
        .single();
      
      if (boardError || !boardData) throw new Error("Acesso negado ao quadro");
      
      // Atualizar a posição e a lista do cartão
      const { data, error } = await supabase
        .from('cards')
        .update({
          list_id: toListId,
          position: newPosition,
          updated_at: new Date().toISOString()
        })
        .eq('id', cardId)
        .select()
        .single();
      
      if (error) throw error;
      
      // Limpar cache da lista de origem e de destino
      cache.clearCardCache(cardData.list_id);
      if (cardData.list_id !== toListId) {
        cache.clearCardCache(toListId);
      }
      
      // Limpar cache do board para garantir que as alterações sejam refletidas
      cache.clearBoardCache(destListData.board_id);
      
      return data;
    } catch (error) {
      console.error(`Erro ao mover cartão ${cardId}:`, error);
      throw error;
    }
  },
  
  deleteCard: async (id: string): Promise<void> => {
    try {
      console.log(`[KanbanService] Excluindo card ${id}`);
      const user = await getCurrentUser();
      if (!user) throw new Error("Usuário não autenticado");
      
      // Obter o list_id para verificação de acesso e limpeza de cache
      const { data: cardData, error: cardError } = await supabase
        .from('cards')
        .select('list_id')
        .eq('id', id)
        .single();
      
      if (cardError || !cardData) throw new Error("Cartão não encontrado");
      
      // Obter o board_id para verificação de acesso
      const { data: listData, error: listError } = await supabase
        .from('lists')
        .select('board_id')
        .eq('id', cardData.list_id)
        .single();
      
      if (listError || !listData) throw new Error("Lista não encontrada");
      
      // Verificar se o usuário tem acesso ao board
      const { data: boardData, error: boardError } = await supabase
        .from('boards')
        .select('id')
        .eq('id', listData.board_id)
        .eq('user_id', user.id)
        .single();
      
      if (boardError || !boardData) throw new Error("Acesso negado ao quadro");
      
      const { error } = await supabase
        .from('cards')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      // Limpar cache após exclusão
      cache.clearCardCache(cardData.list_id);
      
      return;
    } catch (error) {
      console.error(`Erro ao excluir cartão ${id}:`, error);
      throw error;
    }
  },
  
  // Método para obter estatísticas de desempenho
  getPerformanceStats: () => {
    return performanceMonitor.getStats();
  },
  
  // Método para obter operações mais lentas
  getSlowestOperations: (count: number = 5) => {
    return performanceMonitor.getSlowestOperations(count);
  }
}; 