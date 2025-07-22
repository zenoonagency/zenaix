import { useEffect, useState, useRef } from "react";
import { RouterProvider } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { Toaster } from "react-hot-toast";
import { NetworkStatus } from "./components/NetworkStatus";
import { Notification } from "./components/Notification";
import { router } from "./routes";
import { useAuthStore } from "./store/authStore";
import { usePlanStore } from "./store/planStore";
import { useEmbedPagesStore } from "./store/embedPagesStore";
import { useRealtimeStore } from "./store/realtimeStore";
import { useTagStore } from "./store/tagStore";
import { useContractStore } from "./store/contractStore";
import { useTransactionStore } from "./store/transactionStore";
import { supabase } from "./lib/supabaseClient";
import { useTeamMembersStore } from "./store/teamMembersStore";
import { useBoardStore } from "./store/boardStore";
import { useCalendarStore } from "./store/calendarStore";

export function App() {
  const { isAuthenticated, _hasHydrated, token, userId, organizationId } =
    useAuthStore((state) => ({
      isAuthenticated: state.isAuthenticated,
      _hasHydrated: state._hasHydrated,
      token: state.token,
      userId: state.user?.id,
      organizationId: state.user?.organization_id,
    }));

  // State para controlar o delay de reconexão
  const [lastVisibilityChange, setLastVisibilityChange] = useState<number>(0);

  // Ref para controlar se já foi inicializado
  const hasInitialized = useRef(false);

  useEffect(() => {
    if (isAuthenticated && _hasHydrated && token && !hasInitialized.current) {
      console.log("[App] Inicializando aplicação...");
      hasInitialized.current = true;

      // Usar getState() para evitar dependências das funções
      const { fetchAndSyncUser } = useAuthStore.getState();
      const { fetchAllPlans } = usePlanStore.getState();
      const { fetchAllTransactions } = useTransactionStore.getState();
      const { fetchAllEmbedPages } = useEmbedPagesStore.getState();
      const { fetchAllTags } = useTagStore.getState();
      const { fetchAllContracts } = useContractStore.getState();
      const { fetchAllMembers } = useTeamMembersStore.getState();
      const { fetchAllBoards } = useBoardStore.getState();
      const { fetchEvents } = useCalendarStore.getState();
      const { connect: connectToRealtime, disconnect: disconnectFromRealtime } =
        useRealtimeStore.getState();

      fetchAndSyncUser();
      fetchAllPlans(token);

      if (organizationId) {
        fetchAllEmbedPages(token, organizationId);
        fetchAllTags(token, organizationId);
        fetchAllContracts(token, organizationId);
        fetchAllTransactions(token, organizationId);
        fetchAllMembers(token, organizationId);
        fetchAllBoards(token, organizationId);
        fetchEvents();
      }

      if (userId) {
        connectToRealtime(userId, organizationId);
      }

      return () => {
        disconnectFromRealtime();
      };
    }
  }, [isAuthenticated, _hasHydrated, token]); // Removidas funções e IDs das dependências

  // Reset do flag quando usuário desloga
  useEffect(() => {
    if (!isAuthenticated) {
      hasInitialized.current = false;
    }
  }, [isAuthenticated]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        const now = Date.now();
        const timeSinceLastChange = now - lastVisibilityChange;

        // Só atualizar se passaram pelo menos 30 segundos desde a última mudança
        if (timeSinceLastChange >= 30000) {
          console.log(
            "👀 Aba tornou-se visível. A verificar a sessão e o estado do Realtime..."
          );

          supabase.realtime.connect();
          useAuthStore.getState().fetchAndSyncUser();
          setLastVisibilityChange(now);
        } else {
          console.log(
            `⏳ Aguardando ${Math.ceil(
              (30000 - timeSinceLastChange) / 1000
            )}s antes de reconectar...`
          );
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [lastVisibilityChange]);

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
