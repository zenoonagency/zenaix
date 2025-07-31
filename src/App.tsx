import { useEffect, useRef, useState } from "react";
import { RouterProvider } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { Toaster } from "react-hot-toast";
import { NetworkStatus } from "./components/NetworkStatus";
import { Notification } from "./components/Notification";
import { router } from "./routes";
import { supabase } from "./lib/supabaseClient";

// Stores
import { useAuthStore } from "./store/authStore";
import { useRealtimeStore } from "./store/realtimeStore";
import { usePlanStore } from "./store/planStore";
import { useTransactionStore } from "./store/transactionStore";
import { useEmbedPagesStore } from "./store/embedPagesStore";
import { useTagStore } from "./store/tagStore";
import { useContractStore } from "./store/contractStore";
import { useTeamMembersStore } from "./store/teamMembersStore";
import { useBoardStore } from "./store/boardStore";
import { useCalendarStore } from "./store/calendarStore";
import { useWhatsAppInstanceStore } from "./store/whatsAppInstanceStore";
import { useSystemPermissionsStore } from "./store/systemPermissionsStore";

export function App() {
  const hasInitialized = useRef(false);
  const hasFetchedGlobals = useRef(false);

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        const { connect, disconnect } = useRealtimeStore.getState();
        const { setSession, clearAuth, fetchAndSetDeepUserData } =
          useAuthStore.getState();

        console.log(
          "[App] Auth state change:",
          event,
          session?.access_token ? "Token presente" : "Sem token"
        );

        if (session) {
          setSession(session);

          const { user, organization, permissions } = useAuthStore.getState();
          const needsFetch =
            !user &&
            !organization &&
            (!permissions || permissions.length === 0);

          if (needsFetch) {
            try {
              await fetchAndSetDeepUserData();
              hasFetchedGlobals.current = false; // Permite fetch global após reload/login
              console.log(
                "[App] fetchAndSetDeepUserData executado por reload de página"
              );
            } catch (error) {
              console.error("[App] Erro ao buscar dados completos:", error);
            }
          } else {
            console.log(
              "[App] Dados já presentes na store, não faz fetchAndSetDeepUserData"
            );
          }

          if (!hasFetchedGlobals.current) {
            hasFetchedGlobals.current = true;

            // Usar organization_id do Supabase user_metadata se disponível
            const organizationId = session.user?.user_metadata?.organization_id;
            const organizationData = session.user?.user_metadata?.organization;

            if (session.access_token && session.user) {
              usePlanStore.getState().fetchAllPlans(session.access_token);

              if (organizationId && organizationData) {
                useSystemPermissionsStore
                  .getState()
                  .fetchAllSystemPermissions(session.access_token);
                useEmbedPagesStore
                  .getState()
                  .fetchAllEmbedPages(session.access_token, organizationId);
                useTagStore
                  .getState()
                  .fetchAllTags(session.access_token, organizationId);
                useContractStore
                  .getState()
                  .fetchAllContracts(session.access_token, organizationId);
                useTeamMembersStore
                  .getState()
                  .fetchAllMembers(session.access_token, organizationId);
                useBoardStore
                  .getState()
                  .fetchAllBoards(session.access_token, organizationId);
                useWhatsAppInstanceStore
                  .getState()
                  .fetchAllInstances(session.access_token, organizationId);
                useCalendarStore.getState().fetchEvents();
                connect(session.user.id, organizationId);
              } else {
                connect(session.user.id, undefined);
              }
            } else {
              console.warn("[App] Session ou access_token ausentes");
            }
          }
        } else if (event === "SIGNED_OUT") {
          hasFetchedGlobals.current = false;
          hasInitialized.current = false;

          disconnect();
          clearAuth();

          localStorage.removeItem("auth-storage");
        }
      }
    );

    return () => {
      console.log(
        "[App] Desmontando componente. Removendo listener de autenticação."
      );
      authListener.subscription.unsubscribe();
    };
  }, []);

  return (
    <>
      <NetworkStatus />
      <Notification />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: "#363636",
            color: "#fff",
          },
        }}
      />
      <AnimatePresence mode="wait">
        <RouterProvider router={router} />
      </AnimatePresence>
    </>
  );
}
