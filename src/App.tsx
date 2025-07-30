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
          // Sempre definir a sessão primeiro (dados básicos do Supabase)
          setSession(session);

          // Se é a primeira inicialização, buscar dados completos
          if (!hasInitialized.current) {
            hasInitialized.current = true;

            try {
              console.log(
                "[App] Primeira inicialização - buscando dados completos"
              );
              await fetchAndSetDeepUserData();

              const { token, user, organization } = useAuthStore.getState();
              const organizationId = user?.organization_id;

              if (token && user && organization) {
                console.log(
                  "[App] Dados completos carregados, buscando dados da aplicação"
                );

                // Buscar dados básicos da aplicação
                usePlanStore.getState().fetchAllPlans(session.access_token);
                useSystemPermissionsStore
                  .getState()
                  .fetchAllSystemPermissions(session.access_token);

                if (organizationId) {
                  // Buscar dados específicos da organização
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
                }
                connect(user.id, organizationId);
              }
            } catch (error) {
              console.error("[App] Erro ao carregar dados completos:", error);
            }
          } else {
            // Se não é primeira inicialização, apenas atualizar em segundo plano
            console.log("[App] Atualização em segundo plano");
            fetchAndSetDeepUserData().catch((error) => {
              console.warn(
                "[App] Erro ao atualizar dados em segundo plano:",
                error
              );
            });
          }
        } else if (event === "SIGNED_OUT") {
          hasInitialized.current = false;

          // Primeiro desconectar do realtime
          disconnect();

          // Limpar auth de forma síncrona para evitar piscadas
          clearAuth();

          // Limpar localStorage para garantir limpeza completa
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
  }, []); // O array vazio [] garante que isso rode apenas uma vez na vida do componente.

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
