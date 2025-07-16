import { create } from "zustand";
import { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "../lib/supabaseClient";
import { useAuthStore } from "./authStore";
import { useEmbedPagesStore } from "./embedPagesStore";
import { RealtimeEventPayload } from "../types/realtime.types";
import { EmbedOutput } from "../types/embed";
import { useTagStore } from "./tagStore";

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

          switch (eventData.event) {
            case "EMBED_PAGE_CREATED":
              useEmbedPagesStore
                .getState()
                .addPage(eventData.data as EmbedOutput);
              break;
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
