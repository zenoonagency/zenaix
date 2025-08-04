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
import { useEmbedPagesStore } from "./embedPagesStore";
import { useCalendarStore } from "./calendarStore";
import { useDashboardStore } from "./dashboardStore";

interface RealtimeState {
  userChannel: RealtimeChannel | null;
  orgChannel: RealtimeChannel | null;
  connect: (userId: string, organizationId?: string | null) => void;
  disconnect: () => void;
  heartbeatInterval: NodeJS.Timeout | null;
  testConnection: () => void;
}

const handleRealtimeEvent = (payload: RealtimeEventPayload) => {
  console.log(
    "[RealtimeStore] 📨 Evento recebido:",
    payload.event,
    payload.data
  );

  switch (payload.event) {
    case "USER_UPDATED_IN_ORGANIZATION":
    case "USER_PROFILE_UPDATED":
    case "USER_REMOVED_FROM_ORG":
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
    case "BOARD_UPDATED": {
      const { user, token } = useAuthStore.getState();
      const organizationId = user?.organization_id;
      useBoardStore.getState().fetchAllBoards(token, organizationId);
      break;
    }
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
      const dashboardStore = useDashboardStore.getState();

      break;
    case "CARD_UPDATED":
      useBoardStore.getState().updateCardInActiveBoard(payload.data);
      break;
    case "CARD_DELETED":
      useBoardStore
        .getState()
        .removeCardFromActiveBoard(payload.data.id, payload.data.list_id);
      break;
    case "SUBTASK_CREATED":
      useBoardStore.getState().addSubtaskToCard(payload.data);
      break;
    case "SUBTASK_UPDATED":
      useBoardStore.getState().updateSubtaskInCard(payload.data);
      break;
    case "SUBTASK_DELETED":
      useBoardStore.getState().removeSubtaskFromCard(payload.data);
      break;
    case "CUSTOM_FIELD_CREATED":
      useBoardStore.getState().addCustomFieldToCard(payload.data);
      break;
    case "CUSTOM_FIELD_UPDATED":
      useBoardStore.getState().updateCardInActiveBoard(payload.data);
      break;
    case "CUSTOM_FIELD_DELETED":
      useBoardStore.getState().removeCustomFieldFromCard(payload.data);
      break;
    case "WHATSAPP_INSTANCE_CREATED":
      useWhatsAppInstanceStore.getState().addInstance(payload.data);
      break;
    case "WHATSAPP_INSTANCE_UPDATED":
      useWhatsAppInstanceStore.getState().updateInstance(payload.data);
      break;
    case "WHATSAPP_INSTANCE_DELETED":
      useWhatsAppInstanceStore
        .getState()
        .deleteInstance(payload.data.instance_id);
      break;
    case "WHATSAPP_QR_CODE":
      useWhatsAppInstanceStore.getState().updateInstance(payload.data);
      break;
    case "WHATSAPP_INSTANCE_CONNECTED": {
      const store = useWhatsAppInstanceStore.getState();
      const oldInstance = store.instances.find(
        (i) => i.id === payload.data.instance_id
      );
      if (oldInstance) {
        store.updateInstance({
          ...oldInstance,
          phone_number: payload.data.phoneNumber, // corrigido para snake_case
          status: payload.data.status,
        });
      }
      break;
    }
    case "WHATSAPP_CONTACT_UPDATED": {
      console.log(
        "[RealtimeStore] 👤 Contato WhatsApp atualizado:",
        payload.data
      );

      const contactStore = useWhatsappContactStore.getState();
      const { whatsapp_instance_id, id } = payload.data;

      // Atualizar o contato na store
      contactStore.updateContactInStore(whatsapp_instance_id, id, payload.data);
      break;
    }
    case "WHATSAPP_CONTACT_CREATED":
      useWhatsappContactStore
        .getState()
        .addContact(payload.data.whatsapp_instance_id, payload.data);
      break;
    case "NEW_WHATSAPP_MESSAGE": {
      const messageStore = useWhatsappMessageStore.getState();
      const contactStore = useWhatsappContactStore.getState();
      const {
        id,
        body,
        from,
        to,
        timestamp,
        media_url,
        media_type,
        message_type,
        file_name,
        file_size_bytes,
        media_duration_sec,
        whatsapp_instance_id,
        organization_id,
        whatsapp_contact_id,
        created_at,
        read,
        ack,
        wa_message_id,
      } = payload.data;
      const instance = useWhatsAppInstanceStore
        .getState()
        .instances.find((i) => i.id === whatsapp_instance_id);
      const instanceNumber = instance?.phone_number;
      const direction: "INCOMING" | "OUTGOING" =
        from === `${instanceNumber}@c.us` ? "OUTGOING" : "INCOMING";
      const message = {
        id,
        wa_message_id,
        from,
        to,
        body,
        media_url,
        media_type,
        message_type,
        timestamp,
        read,
        ack,
        file_name,
        file_size_bytes,
        media_duration_sec,
        whatsapp_instance_id,
        organization_id,
        whatsapp_contact_id,
        created_at,
        direction,
      };

      if (whatsapp_contact_id) {
        const existingMessages =
          messageStore.messages[whatsapp_instance_id]?.[whatsapp_contact_id] ||
          [];

        // Para mensagens OUTGOING, procurar pela mensagem temporária mais recente que corresponda
        if (direction === "OUTGOING") {
          const tempMessages = existingMessages.filter(
            (msg) =>
              msg.id.startsWith("temp_") &&
              msg.body === body &&
              msg.direction === "OUTGOING"
          );

          if (tempMessages.length > 0) {
            // Pegar a mensagem temporária mais recente (última da lista)
            const tempMessage = tempMessages[tempMessages.length - 1];

            // Substituir apenas a mensagem temporária específica, mantendo a ordem
            const updatedMessages = existingMessages.map((msg) =>
              msg.id === tempMessage.id
                ? { ...message, status: "sent" as const }
                : msg
            );

            messageStore.setMessages(
              whatsapp_instance_id,
              whatsapp_contact_id,
              updatedMessages
            );
          } else {
            // Se não encontrou mensagem temporária, adicionar normalmente
            messageStore.addMessage(whatsapp_instance_id, whatsapp_contact_id, {
              ...message,
              status: "delivered",
            });
          }
        } else {
          // Para mensagens INCOMING, adicionar normalmente
          messageStore.addMessage(whatsapp_instance_id, whatsapp_contact_id, {
            ...message,
            status: "delivered",
          });
        }
      } else {
        const contacts = contactStore.contacts[whatsapp_instance_id] || [];
        const contactNumber =
          direction === "INCOMING"
            ? from.replace("@c.us", "")
            : to.replace("@c.us", "");

        const contact = contacts.find((c) => c.phone === contactNumber);
        if (contact) {
          const existingMessages =
            messageStore.messages[whatsapp_instance_id]?.[contact.id] || [];

          // Para mensagens OUTGOING, procurar pela mensagem temporária mais recente que corresponda
          if (direction === "OUTGOING") {
            const tempMessages = existingMessages.filter(
              (msg) =>
                msg.id.startsWith("temp_") &&
                msg.body === body &&
                msg.direction === "OUTGOING"
            );

            if (tempMessages.length > 0) {
              // Pegar a mensagem temporária mais recente (última da lista)
              const tempMessage = tempMessages[tempMessages.length - 1];

              // Substituir apenas a mensagem temporária específica, mantendo a ordem
              const updatedMessages = existingMessages.map((msg) =>
                msg.id === tempMessage.id
                  ? { ...message, status: "sent" as const }
                  : msg
              );

              messageStore.setMessages(
                whatsapp_instance_id,
                contact.id,
                updatedMessages
              );
            } else {
              // Se não encontrou mensagem temporária, adicionar normalmente
              messageStore.addMessage(whatsapp_instance_id, contact.id, {
                ...message,
                status: "delivered",
              });
            }
          } else {
            // Para mensagens INCOMING, adicionar normalmente
            messageStore.addMessage(whatsapp_instance_id, contact.id, {
              ...message,
              status: "delivered",
            });
          }
        } else {
          console.log(
            "[RealtimeStore] ⚠️ Contato não encontrado para mensagem:",
            contactNumber
          );
        }
      }
      break;
    }
    case "WHATSAPP_MESSAGE_ACK_UPDATED": {
      const { ack, contact_phone, wa_message_id } = payload.data;
      const messageStore = useWhatsappMessageStore.getState();
      const contactStore = useWhatsappContactStore.getState();

      const instances = useWhatsAppInstanceStore.getState().instances;

      for (const instance of instances) {
        const contacts = contactStore.contacts[instance.id] || [];
        const contact = contacts.find((c) => c.phone === contact_phone);

        if (contact) {
          messageStore.updateMessageAck(
            instance.id,
            contact.id,
            wa_message_id,
            ack
          );
          console.log(
            `[RealtimeStore] ✅ ACK atualizado para mensagem ${wa_message_id} no contato ${contact_phone}`
          );
          break;
        }
      }
      break;
    }
    case "INVITATION_ACCEPTED": {
      if (payload.data?.user) {
        useTeamMembersStore.getState().addMember(payload.data.user);
      }
      break;
    }
    case "EMBED_PAGE_CREATED":
      useEmbedPagesStore.getState().addPage(payload.data);
      break;
    case "EMBED_PAGE_UPDATED":
      useEmbedPagesStore.getState().updatePage(payload.data);
      break;
    case "EMBED_PAGE_DELETED":
      useEmbedPagesStore.getState().deletePage(payload.data.id);
      break;
    case "CALENDAR_CREATED":
      useCalendarStore.getState().addEvent(payload.data);
      break;
    case "CALENDAR_UPDATED":
      useCalendarStore.getState().updateEvent(payload.data);
      break;
    case "CALENDAR_DELETED":
      useCalendarStore.getState().removeEvent(payload.data.id);
      break;
    case "CALENDAR_EVENTS_DELETED":
      useCalendarStore.getState().removeEventsByFilter(payload.data);
      break;
    case "CALENDAR_ALL_EVENTS_DELETED":
      useCalendarStore.getState().removeAllEvents();
      break;
    case "PERMISSIONS_GRANTED": {
      const { id } = payload.data;
      const { user } = useAuthStore.getState();
      if (user?.id === id) {
        useAuthStore.getState().fetchAndSyncUser();
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
    if (!supabase) return console.error("Supabase client não configurado!");

    if (!supabase.realtime.isConnected()) {
      supabase.realtime.connect();
    }

    const handleSubscription = (status: string, channelName: string) => {
      if (status === "CHANNEL_ERROR") {
        setTimeout(() => {
          const { user } = useAuthStore.getState();
          const orgId = user?.organization_id;
          if (user?.id) get().connect(user.id, orgId);
        }, 2000);
      }
    };

    const userChannelName = `user-updates-${userId}`;
    const newUserChannel = supabase.channel(userChannelName);
    newUserChannel
      .on("broadcast", { event: "message" }, (message) =>
        handleRealtimeEvent(message.payload)
      )
      .subscribe((status) => handleSubscription(status, userChannelName));

    let newOrgChannel: RealtimeChannel | null = null;
    if (organizationId) {
      const orgChannelName = `org-updates-${organizationId}`;
      newOrgChannel = supabase.channel(orgChannelName);
      newOrgChannel
        .on("broadcast", { event: "message" }, (message) =>
          handleRealtimeEvent(message.payload)
        )
        .subscribe((status) => handleSubscription(status, orgChannelName));
    }

    const newHeartbeatInterval = setInterval(() => {
      const isConnected = supabase.realtime.isConnected();

      if (!isConnected) {
        supabase.realtime.connect();
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

    const channelsToRemove = [userChannel, orgChannel].filter(
      Boolean
    ) as RealtimeChannel[];
    if (channelsToRemove.length > 0) {
      channelsToRemove.forEach((ch) => supabase.removeChannel(ch));
    }

    set({ userChannel: null, orgChannel: null, heartbeatInterval: null });
  },

  testConnection: () => {
    const { userChannel } = get();
    if (userChannel && userChannel.state === "joined") {
      userChannel.send({
        type: "broadcast",
        event: "test",
        payload: {
          message: "Teste de conexão realtime",
          timestamp: new Date().toISOString(),
        },
      });
    }
  },
}));
