import { useEffect } from "react";
import { RouterProvider } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { ToastContainer } from "react-toastify";
import { NetworkStatus } from "./components/NetworkStatus";
import { Notification } from "./components/Notification";
import { router } from "./routes";
import "react-toastify/dist/ReactToastify.css";
import { useAuthStore } from "./store/authStore";
import { usePlanStore } from "./store/planStore";
import { useEmbedPagesStore } from "./store/embedPagesStore";
import { useRealtimeStore } from "./store/realtimeStore";
import { useTagStore } from "./store/tagStore";
import { useContractStore } from "./store/contractStore";
import { useTransactionStore } from "./store/transactionStore";
import { supabase } from "./lib/supabaseClient";

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

  const connectToRealtime = useRealtimeStore((state) => state.connect);
  const disconnectFromRealtime = useRealtimeStore((state) => state.disconnect);

  useEffect(() => {
    if (isAuthenticated && _hasHydrated && token) {
      console.log("✅ Efeito Principal: Sincronizando dados e conexões...");

      fetchAndSyncUser();
      fetchAllPlans(token);

      if (organizationId) {
        fetchAllEmbedPages(token, organizationId);
        fetchAllTags(token, organizationId);
        fetchAllContracts(token, organizationId);
        fetchAllTransactions(token, organizationId);
      }

      if (userId) {
        connectToRealtime(userId, organizationId);
      }

      return () => {
        console.log("🧹 Limpando conexões de Realtime...");
        disconnectFromRealtime();
      };
    }
  }, [
    isAuthenticated,
    _hasHydrated,
    token,
    userId,
    organizationId,
    fetchAndSyncUser,
    fetchAllPlans,
    fetchAllTags,
    fetchAllEmbedPages,
    connectToRealtime,
    disconnectFromRealtime,
  ]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log(
          "👀 Aba tornou-se visível. A verificar o estado do Realtime..."
        );
        supabase.realtime.connect();
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
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
      <AnimatePresence mode="wait">
        <RouterProvider router={router} />
      </AnimatePresence>
    </>
  );
}
