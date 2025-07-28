import { create } from "zustand";
import { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "../lib/supabaseClient";
import { useAuthStore } from "./authStore";
import { RealtimeEventPayload } from "../types/realtime.types";
import { useTagStore } from "./tagStore";
import { useContractStore } from "./contractStore";
import { useTransactionStore } from "./transactionStore";
import { useTeamMembersStore } from "./teamMembersStore";
import { useBoardStore } from "./boardStore";
import { useWhatsAppInstanceStore } from "./whatsAppInstanceStore";
import { useWhatsappMessageStore } from "./whatsapp/whatsappMessageStore";
import { useWhatsappContactStore } from "./whatsapp/whatsappContactStore";

interface RealtimeState {
  userChannel: RealtimeChannel | null;
  orgChannel: RealtimeChannel | null;
  connect: (userId: string, organizationId?: string | null) => void;
  disconnect: () => void;
  heartbeatInterval: NodeJS.Timeout | null;
  testConnection: () => void;
  simulateDisconnect: () => void;
}

const handleRealtimeEvent = (payload: RealtimeEventPayload) => {
  console.log("[RealtimeStore] 📨 Evento recebido:", payload.event, payload.data);

  switch (payload.event) {

    case "USER_UPDATED_IN_ORGANIZATION":
    case "USER_PROFILE_UPDATED":
    case "USER_REMOVED_FROM_ORG":
      console.log("[RealtimeStore] 🔄 Evento de usuário recebido, atualizando dados...");
      // TODO: Implementar sincronização de usuário se necessário
      break;

    case "ORGANIZATION_UPDATED":
      useAuthStore.getState().setOrganization(payload.data);
      break;
    case "TAG_CREATED":
      useTagStore.getState().addTag(payload.data);
      break;
    case "TAG_UPDATED":
      useTagStore.getState().updateTag(payload.data);
      break;
    case "TAG_DELETED":
      useTagStore.getState().deleteTag(payload.data.id);
      break;
    case "CONTRACT_CREATED":
      useContractStore.getState().addContract(payload.data);
      break;
    case "CONTRACT_UPDATE":
    case "CONTRACT_FILE_UPDATE":
    case "CONTRACT_FILE_DELETED":
      useContractStore.getState().updateContract(payload.data);
      break;
    case "CONTRACT_DELETED":
      useContractStore.getState().deleteContract(payload.data.id);
      break;
    case "TRANSACTION_CREATED":
      useTransactionStore.getState().addTransaction(payload.data);
      break;
    case "TRANSACTION_UPDATED":
      useTransactionStore.getState().updateTransaction(payload.data);
      break;
    case "TRANSACTION_DELETED":
      useTransactionStore.getState().deleteTransaction(payload.data.id);
      break;
    case "TEAM_MEMBER_REMOVED":
      useTeamMembersStore.getState().removeMember(payload.data.user_id);
      break;
    case "TEAM_MEMBER_UPDATED":
      useTeamMembersStore.getState().updateMember(payload.data);
      break;
    case "BOARD_CREATED":
      useBoardStore.getState().addBoard(payload.data);
      break;
    case "BOARD_UPDATED":
      useBoardStore.getState().updateBoard(payload.data);
      break;
    case "BOARD_DELETED":
      useBoardStore.getState().removeBoard(payload.data.id);
      break;
    case "LIST_CREATED":
      useBoardStore.getState().addListToActiveBoard(payload.data);
      break;
    case "LIST_UPDATED":
      useBoardStore.getState().updateListInActiveBoard(payload.data);
      break;
    case "LIST_DELETED":
      useBoardStore.getState().removeListFromActiveBoard(payload.data.id);
      break;
    case "CARD_CREATED":
      useBoardStore.getState().addCardToActiveBoard(payload.data);
      break;
    case "CARD_UPDATED":
      useBoardStore.getState().updateCardInActiveBoard(payload.data);
      break;
    case "CARD_DELETED":
      useBoardStore.getState().removeCardFromActiveBoard(payload.data.id, payload.data.list_id);
      break;
    case "WHATSAPP_INSTANCE_CREATED":
      useWhatsAppInstanceStore.getState().addInstance(payload.data);
      break;
    case "WHATSAPP_INSTANCE_UPDATED":
      useWhatsAppInstanceStore.getState().updateInstance(payload.data);
      break;
    case "WHATSAPP_INSTANCE_DELETED":
      useWhatsAppInstanceStore.getState().deleteInstance(payload.data.instance_id);
      break;
    case "WHATSAPP_QR_CODE":
      useWhatsAppInstanceStore.getState().updateQrCode(payload.data.instance_id, payload.data.qrCode);
      break;
    case "WHATSAPP_INSTANCE_CONNECTED": {
      const store = useWhatsAppInstanceStore.getState();
      const oldInstance = store.instances.find(i => i.id === payload.data.instance_id);
      if (oldInstance) {
        store.updateInstance({
          ...oldInstance,
          phone_number: payload.data.phoneNumber, // corrigido para snake_case
          status: payload.data.status,
        });
      }
      break;
    }
    case "NEW_WHATSAPP_MESSAGE": {
      console.log("[RealtimeStore] 📱 Nova mensagem WhatsApp recebida:", payload.data);
      
      const messageStore = useWhatsappMessageStore.getState();
      const contactStore = useWhatsappContactStore.getState();
      
      // Extrair informações da mensagem
      const { 
        id, 
        body, 
        from, 
        to, 
        timestamp, 
        media_url, 
        media_type, 
        file_name, 
        file_size_bytes, 
        media_duration_sec, 
        whatsapp_instance_id, 
        organization_id, 
        whatsapp_contact_id,
        created_at,
        read,
        wa_message_id
      } = payload.data;

      // Determinar a direção da mensagem
      const instance = useWhatsAppInstanceStore.getState().instances.find(i => i.id === whatsapp_instance_id);
      const instanceNumber = instance?.phone_number;
      const direction: 'INCOMING' | 'OUTGOING' = from === `${instanceNumber}@c.us` ? 'OUTGOING' : 'INCOMING';

      // Criar objeto da mensagem no formato correto
      const message = {
        id,
        wa_message_id,
        from,
        to,
        body,
        media_url,
        media_type,
        timestamp,
        read,
        file_name,
        file_size_bytes,
        media_duration_sec,
        whatsapp_instance_id,
        organization_id,
        whatsapp_contact_id,
        created_at,
        direction
      };

      // Se temos o contact_id, adicionar a mensagem diretamente
      if (whatsapp_contact_id) {
        messageStore.addMessage(whatsapp_instance_id, whatsapp_contact_id, message);
      } else {
        // Se não temos contact_id, tentar encontrar o contato pelo número
        const contacts = contactStore.contacts[whatsapp_instance_id] || [];
        const contactNumber = direction === 'INCOMING' 
          ? from.replace('@c.us', '') 
          : to.replace('@c.us', '');
        
        const contact = contacts.find(c => c.phone === contactNumber);
        if (contact) {
          messageStore.addMessage(whatsapp_instance_id, contact.id, message);
          console.log("[RealtimeStore] ✅ Mensagem adicionada para contato encontrado:", contact.id);
        } else {
          console.log("[RealtimeStore] ⚠️ Contato não encontrado para mensagem:", contactNumber);
        }
      }
      break;
    }
    default:
      break;
  }
};

export const useRealtimeStore = create<RealtimeState>()((set, get) => ({
  userChannel: null,
  orgChannel: null,
  heartbeatInterval: null,

  connect: (userId, organizationId) => {
    get().disconnect();

    console.log("[RealtimeStore] 🔌 Iniciando nova conexão realtime...");
    if (!supabase) return console.error("Supabase client não configurado!");

    if (!supabase.realtime.isConnected()) {
      supabase.realtime.connect();
    }

    const handleSubscription = (status: string, channelName: string) => {
      if (status === "SUBSCRIBED") {
        console.log(`[RealtimeStore] ✅ Canal ${channelName} conectado com sucesso.`);
      } else if (status === "CHANNEL_ERROR") {
        console.error(`[RealtimeStore] ❌ Erro ao conectar no canal ${channelName}. Tentando reconectar em 2s...`);
        setTimeout(() => {
          // Tenta reconectar automaticamente
          const { user } = useAuthStore.getState();
          const orgId = user?.organization_id;
          if (user?.id) get().connect(user.id, orgId);
        }, 2000);
      }
    };

    // --- Canal do Usuário ---
    const userChannelName = `user-updates-${userId}`;
    const newUserChannel = supabase.channel(userChannelName);
    newUserChannel
      .on("broadcast", { event: "message" }, (message) => handleRealtimeEvent(message.payload))
      .subscribe((status) => handleSubscription(status, userChannelName));

    // --- Canal da Organização ---
    let newOrgChannel: RealtimeChannel | null = null;
    if (organizationId) {
      const orgChannelName = `org-updates-${organizationId}`;
      newOrgChannel = supabase.channel(orgChannelName);
      newOrgChannel
        .on("broadcast", { event: "message" }, (message) => handleRealtimeEvent(message.payload))
        .subscribe((status) => handleSubscription(status, orgChannelName));
    }

    // --- Heartbeat ---
    const newHeartbeatInterval = setInterval(() => {
      const isConnected = supabase.realtime.isConnected();
      console.log(`[RealtimeStore][HEARTBEAT] Estado da conexão: ${isConnected ? 'CONECTADO' : 'DESCONECTADO'}`);
      if (!isConnected) {
        supabase.realtime.connect();
        // Após reconectar, reestabelece os canais
        setTimeout(() => {
          const { user } = useAuthStore.getState();
          const orgId = user?.organization_id;
          if (user?.id) {
            get().connect(user.id, orgId);
          } 
        }, 1000); 
      }
    }, 5000); 

    set({
      userChannel: newUserChannel,
      orgChannel: newOrgChannel,
      heartbeatInterval: newHeartbeatInterval,
    });
  },

  disconnect: () => {
    const { userChannel, orgChannel, heartbeatInterval } = get();

    if (heartbeatInterval) {
      clearInterval(heartbeatInterval);
    }

    const channelsToRemove = [userChannel, orgChannel].filter(Boolean) as RealtimeChannel[];
    if (channelsToRemove.length > 0) {
      console.log(`[RealtimeStore] 🔌 Removendo ${channelsToRemove.length} canais...`);
      channelsToRemove.forEach(ch => supabase.removeChannel(ch));
    }

    set({ userChannel: null, orgChannel: null, heartbeatInterval: null });
  },

  testConnection: () => {
    const { userChannel } = get();
    if (userChannel && userChannel.state === 'joined') {
      userChannel.send({
        type: 'broadcast',
        event: 'test',
        payload: { message: 'Teste de conexão realtime', timestamp: new Date().toISOString() }
      });
    }
  },

  // Adiciona função para simular queda manual
  simulateDisconnect: () => {
    console.warn('[RealtimeStore] 🔌 Simulando queda manual da conexão realtime!');
    supabase.realtime.disconnect();
  },
}));