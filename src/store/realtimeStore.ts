import { create } from "zustand";
import { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "../lib/supabaseClient";
import { useAuthStore } from "./authStore";
import { useEmbedPagesStore } from "./embedPagesStore";
import { RealtimeEventPayload } from "../types/realtime.types";
import { useTagStore } from "./tagStore";
import { useContractStore } from "./contractStore";
import { useTransactionStore } from "./transactionStore";
import { useTeamMembersStore } from "./teamMembersStore";
import { useInviteStore } from "./inviteStore";
import { usePermissionsStore } from "./permissionsStore";
import { useCalendarStore } from "./calendarStore";
import { useBoardStore } from "./boardStore";
import { useWhatsAppInstanceStore } from "./whatsAppInstanceStore";

interface RealtimeState {
  userChannel: RealtimeChannel | null;
  orgChannel: RealtimeChannel | null;
  connect: (userId: string, organizationId?: string | null) => void;
  disconnect: () => void;
  heartbeatInterval: NodeJS.Timeout | null;
}

const handleRealtimeEvent = (payload: RealtimeEventPayload) => {


  switch (payload.event) {

    case "USER_UPDATED_IN_ORGANIZATION":
    case "USER_PROFILE_UPDATED":
    case "USER_REMOVED_FROM_ORG":
      useAuthStore.getState().fetchAndSyncUser();
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
    default:
      break;
  }
};

export const useRealtimeStore = create<RealtimeState>()((set, get) => ({
  userChannel: null,
  orgChannel: null,
  heartbeatInterval: null,

  connect: (userId, organizationId) => {
    console.log("[RealtimeStore] 🔌 Iniciando conexão realtime...");
    const { userChannel, orgChannel, heartbeatInterval } = get();

    if (heartbeatInterval) clearInterval(heartbeatInterval);
    if (!supabase) return console.error("[RealtimeStore] Supabase client não está configurado!");
    
    if (!supabase.realtime.isConnected()) {
      supabase.realtime.connect();
    }
    
    if (!userChannel || userChannel.state === 'closed') {
      console.log("[RealtimeStore] Criando canal do usuário...");
      const newUserChannel = supabase.channel(`user-updates-${userId}`);
      newUserChannel
        .on("broadcast", { event: "message" }, (message) => handleRealtimeEvent(message.payload))
        .subscribe((status) => {
          if (status === "SUBSCRIBED") {
            console.log(`[RealtimeStore] ✅ Canal do usuário conectado`);
          } else if (status === "CHANNEL_ERROR") {
            console.error(`[RealtimeStore] Erro ao conectar no canal do usuário.`);
          }
        });
      set({ userChannel: newUserChannel });
    }

    if (organizationId && (!orgChannel || orgChannel.state === 'closed')) {
      console.log("[RealtimeStore] Criando canal da organização...");
      const newOrgChannel = supabase.channel(`org-updates-${organizationId}`);
      newOrgChannel
        .on("broadcast", { event: "message" }, (message) => handleRealtimeEvent(message.payload))
        .subscribe((status) => {
          if (status === "SUBSCRIBED") {
            console.log(`[RealtimeStore] ✅ Canal da organização conectado`);
          } else if (status === "CHANNEL_ERROR") {
            console.error(`[RealtimeStore] Erro ao conectar no canal da organização.`);
          }
        });
      set({ orgChannel: newOrgChannel });
    }

    const newHeartbeatInterval = setInterval(() => {
      if (!supabase.realtime.isConnected()) {
        console.warn("[Realtime] Conexão principal perdida. Tentando reconectar...");
        supabase.realtime.connect();
      }
    }, 30000);
    set({ heartbeatInterval: newHeartbeatInterval });
  },

  disconnect: () => {
    console.log("[RealtimeStore] 🔌 Desconectando do realtime...");
    const { userChannel, orgChannel, heartbeatInterval } = get();

    if (heartbeatInterval) {
      clearInterval(heartbeatInterval);
    }

    const channelsToRemove = [userChannel, orgChannel].filter(Boolean) as RealtimeChannel[];
    channelsToRemove.forEach(channel => {
      supabase.removeChannel(channel);
    });
    
    set({ userChannel: null, orgChannel: null, heartbeatInterval: null });
  },
}));