import { useEffect, useRef, useState } from "react";
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

export function App() {
  const {
    isAuthenticated,
    _hasHydrated,
    token,
    organizationId,
    fetchAndSyncUser,
    connectToOrgChanges,
    disconnectFromOrgChanges,
  } = useAuthStore((state) => ({
    isAuthenticated: state.isAuthenticated,
    _hasHydrated: state._hasHydrated,
    token: state.token,
    organizationId: state.user?.organization_id,
    fetchAndSyncUser: state.fetchAndSyncUser,
    connectToOrgChanges: state.connectToOrgChanges,
    disconnectFromOrgChanges: state.disconnectFromOrgChanges,
  }));

  const fetchAllPlans = usePlanStore((state) => state.fetchAllPlans);
  const {
    fetchAllEmbedPages,
    connectToEmbedChanges,
    disconnectFromEmbedChanges,
  } = useEmbedPagesStore((state) => ({
    fetchAllEmbedPages: state.fetchAllEmbedPages,
    connectToEmbedChanges: state.connectToEmbedChanges,
    disconnectFromEmbedChanges: state.disconnectFromEmbedChanges,
  }));

  useEffect(() => {
    if (isAuthenticated && _hasHydrated && token) {
      console.log("✅ Iniciando busca de dados e conexões de Realtime...");

      fetchAndSyncUser();
      fetchAllPlans(token);

      connectToOrgChanges();

      if (organizationId) {
        connectToEmbedChanges(organizationId);
        fetchAllEmbedPages(token, organizationId);
      }

      return () => {
        console.log("🧹 Limpando conexões de Realtime...");
        disconnectFromOrgChanges();
        disconnectFromEmbedChanges();
      };
    }
  }, [
    isAuthenticated,
    _hasHydrated,
    token,
    organizationId,
    fetchAndSyncUser,
    fetchAllPlans,
    fetchAllEmbedPages,
    connectToOrgChanges,
    disconnectFromOrgChanges,
    connectToEmbedChanges,
    disconnectFromEmbedChanges,
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
