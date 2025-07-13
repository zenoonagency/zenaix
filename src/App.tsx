import React, { useEffect, useRef, useState } from "react";
import { RouterProvider } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { ToastContainer } from "react-toastify";
import { NetworkStatus } from "./components/NetworkStatus";
import { Notification } from "./components/Notification";
import { useThemeStore } from "./store/themeStore";
import { router } from "./routes";
import "react-toastify/dist/ReactToastify.css";
import { useAuthStore } from "./store/authStore";
import { usePlanStore } from "./store/planStore";

export function App() {
  const initialFetchHasBeenMade = useRef(false); // 2. Crie a ref

  const { token, isAuthenticated, _hasHydrated, fetchAndSyncUser } =
    useAuthStore((state) => ({
      token: state.token,
      isAuthenticated: state.isAuthenticated,
      _hasHydrated: state._hasHydrated,
      fetchAndSyncUser: state.fetchAndSyncUser,
    }));

  const fetchAllPlans = usePlanStore((state) => state.fetchAllPlans);

  useEffect(() => {
    if (!_hasHydrated) {
      return;
    }

    if (isAuthenticated && token) {
      if (initialFetchHasBeenMade.current) {
        return;
      }

      initialFetchHasBeenMade.current = true;

      console.log(
        "✅ Reidratação completa. Iniciando sincronização ÚNICA de usuário e planos..."
      );
      fetchAndSyncUser();
      fetchAllPlans(token);
    }
  }, [isAuthenticated, token, _hasHydrated, fetchAndSyncUser, fetchAllPlans]);

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
