import { create } from "zustand";
import { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "../lib/supabaseClient";
import { useAuthStore } from "./authStore";
import { useEmbedPagesStore } from "./embedPagesStore";
import { RealtimeEventPayload } from "../types/realtime.types";
import { EmbedOutput } from "../types/embed";
import { useTagStore } from "./tagStore";
import { useContractStore } from "./contractStore";
import { useTransactionStore } from "./transactionStore";
import { TransactionType } from "../types/transaction";
import { useTeamMembersStore } from "./teamMembersStore";
import { useInviteStore } from "./inviteStore";
import { usePermissionsStore } from "./permissionsStore";
import { useCalendarStore } from "./calendarStore";

interface RealtimeState {
  userChannel: RealtimeChannel | null;
  orgChannel: RealtimeChannel | null;
  connect: (userId: string, organizationId?: string | null) => void;
  disconnect: () => void;
}

export const useRealtimeStore = create<RealtimeState>()((set, get) => ({
  userChannel: null,
  orgChannel: null,

  connect: (userId, organizationId) => {
    const { userChannel, orgChannel } = get();

    if (!userChannel) {
      const newUserChannel = supabase.channel(`user-updates-${userId}`);
      newUserChannel
        .on("broadcast", { event: "message" }, (message) => {
          const eventData = message.payload as RealtimeEventPayload;
          console.log("📢 Mensagem de Broadcast PESSOAL recebida!", eventData);

          switch (eventData.event) {
            case "USER_UPDATED_IN_ORGANIZATION":
            case "USER_PROFILE_UPDATED":
            case "USER_REMOVED_FROM_ORG":
              useAuthStore.getState().fetchAndSyncUser();
              break;
          }
        })
        .subscribe((status) => {
          if (status === "SUBSCRIBED") {
            console.log(
              `[RealtimeStore] ✅ Inscrito com sucesso no canal PESSOAL.`
            );
          }
        });
      set({ userChannel: newUserChannel });
    }

    if (organizationId && !orgChannel) {
      const newOrgChannel = supabase.channel(`org-updates-${organizationId}`);
      newOrgChannel
        .on("broadcast", { event: "message" }, (message) => {
          const eventData = message.payload as RealtimeEventPayload;
          console.log(
            "📢 Mensagem de Broadcast da ORGANIZAÇÃO recebida!",
            eventData
          );

          const refreshSummaryForDate = (dateString: string) => {
            const { token, organization } = useAuthStore.getState();
            if (token && organization.id && dateString) {
              const transactionDate = new Date(dateString);
              const year = transactionDate.getFullYear();
              const month = transactionDate.getMonth() + 1; // getMonth() é 0-11

              console.log(
                `[RealtimeStore] A acionar uma nova busca do resumo para`,
                { year, month }
              );
              useTransactionStore
                .getState()
                .fetchSummary(token, organization.id, { year, month });
            }
          };

          switch (eventData.event) {
            case "ORGANIZATION_UPDATED":
              useAuthStore.getState().setOrganization(eventData.data);
              break;
            case "TEAM_MEMBER_REMOVED":
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
              console.log(eventData.data);
              refreshSummaryForDate(eventData.data.date);
              break;
            case "TRANSACTION_UPDATED":
              useTransactionStore.getState().updateTransaction(eventData.data);

              refreshSummaryForDate(eventData.data.date);
              break;
            case "TRANSACTION_DELETED":
              useTransactionStore
                .getState()
                .deleteTransaction(eventData.data.id);

              refreshSummaryForDate(eventData.data.date);
              break;
            case "TRANSACTIONS_DELETED_ALL":
              useTransactionStore
                .getState()
                .setTransactions(eventData.data.transactions);

              if (eventData.data.filters) {
                useTransactionStore
                  .getState()
                  .setSummary({ income: 0, expenses: 0, balance: 0 });
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
              useTeamMembersStore
                .getState()
                .removeMember(eventData.data.user_id);
              break;
            case "TEAM_MEMBER_UPDATED":
              useTeamMembersStore.getState().updateMember(eventData.data);
              break;
            case "PERMISSIONS_GRANTED":
            case "PERMISSIONS_REVOKED": {
              const { token, organization } = useAuthStore.getState();
              const memberId = eventData.data.id;

              if (token && organization.id && memberId) {
                usePermissionsStore
                  .getState()
                  .fetchPermissions(token, organization.id, memberId);
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
              useCalendarStore
                .getState()
                .removeEventsByFilter(eventData.data.filters);
              break;
          }
        })
        .subscribe((status) => {
          if (status === "SUBSCRIBED") {
            console.log(
              `[RealtimeStore] ✅ Inscrito com sucesso no canal da ORGANIZAÇÃO.`
            );
          }
        });
      set({ orgChannel: newOrgChannel });
    }
  },

  disconnect: () => {
    const { userChannel, orgChannel } = get();
    if (userChannel) {
      supabase.removeChannel(userChannel);
    }
    if (orgChannel) {
      supabase.removeChannel(orgChannel);
    }
    set({ userChannel: null, orgChannel: null });
  },
}));
