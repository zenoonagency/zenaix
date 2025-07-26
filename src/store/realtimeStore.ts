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

export const useRealtimeStore = create<RealtimeState>()((set, get) => ({
  userChannel: null,
  orgChannel: null,
  heartbeatInterval: null,

  connect: async (userId, organizationId) => {
    console.log("[RealtimeStore] 🔌 Iniciando conexão realtime...");
    
    const { userChannel, orgChannel } = get();

    if (!supabase) {
      console.error("[RealtimeStore] Supabase client não está configurado!");
      return;
    }

    // Limpar intervalos anteriores
    const { heartbeatInterval } = get();
    if (heartbeatInterval) clearInterval(heartbeatInterval);

    // Conectar ao realtime se não estiver conectado
    if (!supabase.realtime.isConnected()) {
      supabase.realtime.connect();
    }

    // Aguardar conexão inicial
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Criar canal do usuário se não existir
    if (!userChannel) {
      console.log("[RealtimeStore] Criando canal do usuário...");
      const newUserChannel = supabase.channel(`user-updates-${userId}`, {
        config: {
          presence: {
            key: userId,
          },
        },
      });
      
      newUserChannel
        .on("broadcast", { event: "message" }, (message) => {
          const eventData = message.payload as RealtimeEventPayload;
          console.log("📢 [Realtime] Evento pessoal recebido:", eventData.event);

          switch (eventData.event) {
            case "USER_UPDATED_IN_ORGANIZATION":
            case "USER_PROFILE_UPDATED":
            case "USER_REMOVED_FROM_ORG":
              useAuthStore.getState().fetchAndSyncUser();
              break;
          }
        })
        .subscribe((status) => {
          if (status === "CHANNEL_ERROR") {
            console.error(`[RealtimeStore] Erro no canal do usuário`);
          } else if (status === "SUBSCRIBED") {
            console.log(`[RealtimeStore] ✅ Canal do usuário conectado`);
          }
        });
      set({ userChannel: newUserChannel });
    }

    // Criar canal da organização se não existir
    if (organizationId && !orgChannel) {
      console.log("[RealtimeStore] Criando canal da organização...");
      const newOrgChannel = supabase.channel(`org-updates-${organizationId}`, {
        config: {
          presence: {
            key: organizationId,
          },
        },
      });
      
      newOrgChannel
        .on("broadcast", { event: "message" }, (message) => {
          const eventData = message.payload as RealtimeEventPayload;
          console.log("📢 [Realtime] Evento da organização recebido:", eventData.event);

          const refreshSummaryForDate = (dateString: string) => {};

          switch (eventData.event) {
            case "ORGANIZATION_UPDATED":
              useAuthStore.getState().setOrganization(eventData.data);
              break;
            case "TAG_CREATED":
              useTagStore.getState().addTag(eventData.data);
              break;
            case "TAG_UPDATED":
              useTagStore.getState().updateTag(eventData.data);
              break;
            case "TAG_DELETED":
              useTagStore.getState().deleteTag(eventData.data.id);
              break;
            case "CONTRACT_CREATED":
              useContractStore.getState().addContract(eventData.data);
              break;
            case "CONTRACT_UPDATE":
            case "CONTRACT_FILE_UPDATE":
            case "CONTRACT_FILE_DELETED":
              useContractStore.getState().updateContract(eventData.data);
              break;
            case "CONTRACT_DELETED":
              useContractStore.getState().deleteContract(eventData.data.id);
              break;
            case "EMBED_PAGE_CREATED":
              useEmbedPagesStore.getState().addPage(eventData.data);
              break;
            case "EMBED_PAGE_UPDATED":
              useEmbedPagesStore.getState().updatePage(eventData.data);
              break;
            case "EMBED_PAGE_DELETED":
              useEmbedPagesStore.getState().deletePage(eventData.data.id);
              break;
            case "TRANSACTION_CREATED":
              useTransactionStore.getState().addTransaction(eventData.data);
              refreshSummaryForDate(eventData.data.date);
              break;
            case "TRANSACTION_UPDATED":
              useTransactionStore.getState().updateTransaction(eventData.data);
              refreshSummaryForDate(eventData.data.date);
              break;
            case "TRANSACTION_DELETED":
              useTransactionStore.getState().deleteTransaction(eventData.data.id);
              refreshSummaryForDate(eventData.data.date);
              break;
            case "TRANSACTIONS_DELETED_ALL":
              useTransactionStore.getState().setTransactions(eventData.data.transactions);
              if (eventData.data.filters) {
                useTransactionStore.getState().setSummary({ income: 0, expenses: 0, balance: 0 });
              }
              break;
            case "INVITATION_ACCEPTED":
              useTeamMembersStore.getState().addMember(eventData.data.user);
              useInviteStore.getState().updateInvite(eventData.data.invitation);
              break;
            case "INVITATION_SENT":
              useInviteStore.getState().addInvite(eventData.data);
              break;
            case "INVITATION_REVOKED":
              useInviteStore.getState().deleteInvite(eventData.data.id);
              break;
            case "TEAM_MEMBER_REMOVED":
              useTeamMembersStore.getState().removeMember(eventData.data.user_id);
              break;
            case "TEAM_MEMBER_UPDATED":
              useTeamMembersStore.getState().updateMember(eventData.data);
              break;
            case "PERMISSIONS_GRANTED":
            case "PERMISSIONS_REVOKED": {
              const { token, organization } = useAuthStore.getState();
              const memberId = eventData.data.id;
              if (token && organization.id && memberId) {
                usePermissionsStore.getState().fetchPermissions(token, organization.id, memberId);
              }
              break;
            }
            case "CALENDAR_CREATED":
              useCalendarStore.getState().addEvent(eventData.data);
              break;
            case "CALENDAR_UPDATED":
              useCalendarStore.getState().updateEvent(eventData.data);
              break;
            case "CALENDAR_DELETED":
              useCalendarStore.getState().removeEvent(eventData.data.id);
              break;
            case "CALENDAR_EVENTS_DELETED":
              useCalendarStore.getState().removeEventsByFilter(eventData.data.filters);
              break;
            case "CALENDAR_ALL_EVENTS_DELETED":
              useCalendarStore.getState().removeAllEvents();
              break;
            case "BOARD_CREATED":
              useBoardStore.getState().addBoard(eventData.data);
              break;
            case "BOARD_UPDATED":
              useBoardStore.getState().updateBoard(eventData.data);
              break;
            case "BOARD_DELETED":
              useBoardStore.getState().removeBoard(eventData.data.id);
              break;
            case "LIST_CREATED":
              useBoardStore.getState().addListToActiveBoard(eventData.data);
              break;
            case "LIST_UPDATED":
              useBoardStore.getState().updateListInActiveBoard(eventData.data);
              break;
            case "LIST_DELETED":
              useBoardStore.getState().removeListFromActiveBoard(eventData.data.id);
              break;
            case "CARD_CREATED":
              useBoardStore.getState().addCardToActiveBoard(eventData.data);
              break;
            case "CARD_UPDATED":
              useBoardStore.getState().updateCardInActiveBoard(eventData.data);
              break;
            case "CARD_DELETED":
              useBoardStore.getState().removeCardFromActiveBoard(eventData.data.id, eventData.data.list_id);
              break;
            case "SUBTASK_CREATED":
              useBoardStore.getState().addSubtaskToCard(eventData.data);
              break;
            case "SUBTASK_UPDATED":
              useBoardStore.getState().updateSubtaskInCard(eventData.data);
              break;
            case "SUBTASK_DELETED":
              useBoardStore.getState().removeSubtaskFromCard(eventData.data);
              break;
            case "CARD_FILE_CREATED":
              useBoardStore.getState().addAttachmentToCard(eventData.data);
              break;
            case "CARD_FILE_UPDATED":
              useBoardStore.getState().updateAttachmentInCard(eventData.data);
              break;
            case "CARD_FILE_DELETED":
              useBoardStore.getState().removeAttachmentFromCard(eventData.data);
              break;
          }
        })
        .subscribe((status) => {
          if (status === "CHANNEL_ERROR") {
            console.error(`[RealtimeStore] Erro no canal da organização`);
          } else if (status === "SUBSCRIBED") {
            console.log(`[RealtimeStore] ✅ Canal da organização conectado`);
          }
        });
      set({ orgChannel: newOrgChannel });
    }

    // Heartbeat otimizado - verificar a cada 30 segundos
    const newHeartbeatInterval = setInterval(() => {
      const { userChannel, orgChannel } = get();
      
      // Só logar se houver problemas
      const channels = [userChannel, orgChannel].filter(Boolean);
      const disconnectedChannels = channels.filter(channel => channel && channel.state !== "joined");
      
      if (disconnectedChannels.length > 0) {
        console.warn(`[Realtime] ${disconnectedChannels.length} canal(is) desconectado(s). Tentando reconectar...`);
        
        disconnectedChannels.forEach((channel) => {
          if (channel) {
            try {
              // Remover canal antigo primeiro
              supabase.removeChannel(channel);
              
              // Recriar canal com mesmo nome
              const newChannel = supabase.channel(channel.topic, {
                config: {
                  presence: {
                    key: channel.topic.includes('user-updates') ? channel.topic.split('-')[2] : channel.topic.split('-')[2],
                  },
                },
              });
              
              // Replicar os event listeners
              newChannel
                .on("broadcast", { event: "message" }, (message) => {
                  const eventData = message.payload as RealtimeEventPayload;
                  console.log("📢 [Realtime] Evento recebido:", eventData.event);
                  
                  // Replicar toda a lógica de eventos aqui
                  if (channel.topic.includes('user-updates')) {
                    switch (eventData.event) {
                      case "USER_UPDATED_IN_ORGANIZATION":
                      case "USER_PROFILE_UPDATED":
                      case "USER_REMOVED_FROM_ORG":
                        useAuthStore.getState().fetchAndSyncUser();
                        break;
                    }
                  } else {
                    // Lógica para canal da organização
                    const refreshSummaryForDate = (dateString: string) => {};
                    switch (eventData.event) {
                      case "ORGANIZATION_UPDATED":
                        useAuthStore.getState().setOrganization(eventData.data);
                        break;
                      case "TAG_CREATED":
                        useTagStore.getState().addTag(eventData.data);
                        break;
                      case "TAG_UPDATED":
                        useTagStore.getState().updateTag(eventData.data);
                        break;
                      case "TAG_DELETED":
                        useTagStore.getState().deleteTag(eventData.data.id);
                        break;
                      case "CONTRACT_CREATED":
                        useContractStore.getState().addContract(eventData.data);
                        break;
                      case "CONTRACT_UPDATE":
                      case "CONTRACT_FILE_UPDATE":
                      case "CONTRACT_FILE_DELETED":
                        useContractStore.getState().updateContract(eventData.data);
                        break;
                      case "CONTRACT_DELETED":
                        useContractStore.getState().deleteContract(eventData.data.id);
                        break;
                      case "EMBED_PAGE_CREATED":
                        useEmbedPagesStore.getState().addPage(eventData.data);
                        break;
                      case "EMBED_PAGE_UPDATED":
                        useEmbedPagesStore.getState().updatePage(eventData.data);
                        break;
                      case "EMBED_PAGE_DELETED":
                        useEmbedPagesStore.getState().deletePage(eventData.data.id);
                        break;
                      case "TRANSACTION_CREATED":
                        useTransactionStore.getState().addTransaction(eventData.data);
                        refreshSummaryForDate(eventData.data.date);
                        break;
                      case "TRANSACTION_UPDATED":
                        useTransactionStore.getState().updateTransaction(eventData.data);
                        refreshSummaryForDate(eventData.data.date);
                        break;
                      case "TRANSACTION_DELETED":
                        useTransactionStore.getState().deleteTransaction(eventData.data.id);
                        refreshSummaryForDate(eventData.data.date);
                        break;
                      case "TRANSACTIONS_DELETED_ALL":
                        useTransactionStore.getState().setTransactions(eventData.data.transactions);
                        if (eventData.data.filters) {
                          useTransactionStore.getState().setSummary({ income: 0, expenses: 0, balance: 0 });
                        }
                        break;
                      case "INVITATION_ACCEPTED":
                        useTeamMembersStore.getState().addMember(eventData.data.user);
                        useInviteStore.getState().updateInvite(eventData.data.invitation);
                        break;
                      case "INVITATION_SENT":
                        useInviteStore.getState().addInvite(eventData.data);
                        break;
                      case "INVITATION_REVOKED":
                        useInviteStore.getState().deleteInvite(eventData.data.id);
                        break;
                      case "TEAM_MEMBER_REMOVED":
                        useTeamMembersStore.getState().removeMember(eventData.data.user_id);
                        break;
                      case "TEAM_MEMBER_UPDATED":
                        useTeamMembersStore.getState().updateMember(eventData.data);
                        break;
                      case "PERMISSIONS_GRANTED":
                      case "PERMISSIONS_REVOKED": {
                        const { token, organization } = useAuthStore.getState();
                        const memberId = eventData.data.id;
                        if (token && organization.id && memberId) {
                          usePermissionsStore.getState().fetchPermissions(token, organization.id, memberId);
                        }
                        break;
                      }
                      case "CALENDAR_CREATED":
                        useCalendarStore.getState().addEvent(eventData.data);
                        break;
                      case "CALENDAR_UPDATED":
                        useCalendarStore.getState().updateEvent(eventData.data);
                        break;
                      case "CALENDAR_DELETED":
                        useCalendarStore.getState().removeEvent(eventData.data.id);
                        break;
                      case "CALENDAR_EVENTS_DELETED":
                        useCalendarStore.getState().removeEventsByFilter(eventData.data.filters);
                        break;
                      case "CALENDAR_ALL_EVENTS_DELETED":
                        useCalendarStore.getState().removeAllEvents();
                        break;
                      case "BOARD_CREATED":
                        useBoardStore.getState().addBoard(eventData.data);
                        break;
                      case "BOARD_UPDATED":
                        useBoardStore.getState().updateBoard(eventData.data);
                        break;
                      case "BOARD_DELETED":
                        useBoardStore.getState().removeBoard(eventData.data.id);
                        break;
                      case "LIST_CREATED":
                        useBoardStore.getState().addListToActiveBoard(eventData.data);
                        break;
                      case "LIST_UPDATED":
                        useBoardStore.getState().updateListInActiveBoard(eventData.data);
                        break;
                      case "LIST_DELETED":
                        useBoardStore.getState().removeListFromActiveBoard(eventData.data.id);
                        break;
                      case "CARD_CREATED":
                        useBoardStore.getState().addCardToActiveBoard(eventData.data);
                        break;
                      case "CARD_UPDATED":
                        useBoardStore.getState().updateCardInActiveBoard(eventData.data);
                        break;
                      case "CARD_DELETED":
                        useBoardStore.getState().removeCardFromActiveBoard(eventData.data.id, eventData.data.list_id);
                        break;
                      case "SUBTASK_CREATED":
                        useBoardStore.getState().addSubtaskToCard(eventData.data);
                        break;
                      case "SUBTASK_UPDATED":
                        useBoardStore.getState().updateSubtaskInCard(eventData.data);
                        break;
                      case "SUBTASK_DELETED":
                        useBoardStore.getState().removeSubtaskFromCard(eventData.data);
                        break;
                      case "CARD_FILE_CREATED":
                        useBoardStore.getState().addAttachmentToCard(eventData.data);
                        break;
                      case "CARD_FILE_UPDATED":
                        useBoardStore.getState().updateAttachmentInCard(eventData.data);
                        break;
                      case "CARD_FILE_DELETED":
                        useBoardStore.getState().removeAttachmentFromCard(eventData.data);
                        break;
                      case "WHATSAPP_INSTANCE_CREATED":
                        // useBoardStore.getState().removeAttachmentFromCard(eventData.data);
                        break;
                      case "WHATSAPP_QR_CODE":
                        useWhatsAppInstanceStore.getState().updateQrCode(eventData.data.instanceId, eventData.data.qrCode )
                        break;
                    }
                  }
                })
                .subscribe((status) => {
                  if (status === "SUBSCRIBED") {
                    console.log(`[Realtime] Canal ${newChannel.topic} reconectado com sucesso`);
                    // Atualizar o store com o novo canal
                    if (channel.topic.includes('user-updates')) {
                      set({ userChannel: newChannel });
                    } else {
                      set({ orgChannel: newChannel });
                    }
                  } else if (status === "CHANNEL_ERROR") {
                    console.error(`[Realtime] Falha ao reconectar canal ${newChannel.topic}`);
                  }
                });
            } catch (error) {
              console.error(`[Realtime] Erro ao tentar reconectar canal ${channel.topic}:`, error);
            }
          }
        });
      }
    }, 30000); // Aumentado para 30 segundos

    set({ heartbeatInterval: newHeartbeatInterval });
  },

  disconnect: () => {
    const { userChannel, orgChannel, heartbeatInterval } = get();

    if (heartbeatInterval) {
      clearInterval(heartbeatInterval);
    }

    if (userChannel) {
      supabase.removeChannel(userChannel);
    }
    if (orgChannel) {
      supabase.removeChannel(orgChannel);
    }
    set({ userChannel: null, orgChannel: null, heartbeatInterval: null });
  },
}));
