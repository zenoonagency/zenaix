import { useEffect } from "react";
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

export function App() {
  const {
    isAuthenticated,
    _hasHydrated,
    token,
    userId,
    organizationId,
    fetchAndSyncUser,
  } = useAuthStore((state) => ({
    isAuthenticated: state.isAuthenticated,
    _hasHydrated: state._hasHydrated,
    token: state.token,
    userId: state.user?.id,
    organizationId: state.user?.organization_id,
    fetchAndSyncUser: state.fetchAndSyncUser,
  }));

  const fetchAllPlans = usePlanStore((state) => state.fetchAllPlans);
  const fetchAllTransactions = useTransactionStore(
    (state) => state.fetchAllTransactions
  );
  const fetchAllEmbedPages = useEmbedPagesStore(
    (state) => state.fetchAllEmbedPages
  );

  const fetchAllTags = useTagStore((state) => state.fetchAllTags);
  const fetchAllContracts = useContractStore(
    (state) => state.fetchAllContracts
  );
  const fetchAllMembers = useTeamMembersStore((state) => state.fetchAllMembers);
  const fetchAllBoards = useBoardStore((state) => state.fetchAllBoards);

  const connectToRealtime = useRealtimeStore((state) => state.connect);
  const disconnectFromRealtime = useRealtimeStore((state) => state.disconnect);

  useEffect(() => {
    if (isAuthenticated && _hasHydrated && token) {
      fetchAndSyncUser();
      fetchAllPlans(token);

      if (organizationId) {
        fetchAllEmbedPages(token, organizationId);
        fetchAllTags(token, organizationId);
        fetchAllContracts(token, organizationId);
        fetchAllTransactions(token, organizationId);
        fetchAllMembers(token, organizationId);
        fetchAllBoards(token, organizationId);
      }

      if (userId) {
        connectToRealtime(userId, organizationId);
      }

      return () => {
        disconnectFromRealtime();
      };
    }
  }, [isAuthenticated, _hasHydrated, token, userId, organizationId]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log(
          "👀 Aba tornou-se visível. A verificar a sessão e o estado do Realtime..."
        );

        supabase.realtime.connect();
        useAuthStore.getState().fetchAndSyncUser();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
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
