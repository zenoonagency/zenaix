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
  const fetchAllEmbedPages = useEmbedPagesStore(
    (state) => state.fetchAllEmbedPages
  );

  const fetchAllTags = useTagStore((state) => state.fetchAllTags);
  const fetchAllContracts = useContractStore((state) => state.fetchAllContracts);

  const { connect: connectToRealtime, disconnect: disconnectFromRealtime } =
    useRealtimeStore((state) => ({
      connect: state.connect,
      disconnect: state.disconnect,
    }));

  useEffect(() => {
    if (isAuthenticated && _hasHydrated && token) {
      console.log("✅ Efeito Principal: Sincronizando dados e conexões...");

      fetchAndSyncUser();
      fetchAllPlans(token);

      if (organizationId) {
        fetchAllEmbedPages(token, organizationId);
        fetchAllTags(token, organizationId);
        fetchAllContracts(token, organizationId);
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
