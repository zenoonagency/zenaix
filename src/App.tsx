import { useEffect, useRef, useState } from "react";
import { RouterProvider, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { Toaster } from "react-hot-toast";
import { NetworkStatus } from "./components/NetworkStatus";
import { Notification } from "./components/Notification";
import { router } from "./routes";
import { supabase } from "./lib/supabaseClient";
import { Loader2 } from "lucide-react";

// Stores
import { useAuthStore } from "./store/authStore";
import { useRealtimeStore } from "./store/realtimeStore";
// Importe todas as outras stores que você precisa inicializar
import { usePlanStore } from "./store/planStore";
import { useTagStore } from "./store/tagStore";
import { useContractStore } from "./store/contractStore";
import { useTeamMembersStore } from "./store/teamMembersStore";
import { useEmbedPagesStore } from "./store/embedPagesStore";
import { useBoardStore } from "./store/boardStore";
import { useWhatsAppInstanceStore } from "./store/whatsAppInstanceStore";
import { useCalendarStore } from "./store/calendarStore";
import { useSystemPermissionsStore } from "./store/systemPermissionsStore";

import { userService } from "./services/user/user.service";

// NOVO: Componente de carregamento em tela cheia
function FullScreenLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-dark-900">
      <Loader2 className="w-8 h-8 animate-spin text-[#7f00ff]" />
    </div>
  );
}

export function App() {
  const hasFetchedGlobals = useRef(false);
  // NOVO: Estado para controlar o carregamento inicial da aplicação.
  const [isInitializing, setIsInitializing] = useState(true);
  // Removido: const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  // Removido: const location = useLocation();

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        const {
          setSession,
          updateUserDataSilently,
          setLoading,
          logout,
          clearAuth,
        } = useAuthStore.getState();
        const { connect, disconnect } = useRealtimeStore.getState();

        try {
          console.log(`[App] Auth event: ${event}`);

          if (session && session.access_token) {
            setSession(session);
            const freshUserData = await userService.getMe(session.access_token);
            updateUserDataSilently(freshUserData);

            const organizationId = freshUserData.organization?.id;
            connect(session.user.id, organizationId);

            if (event === "SIGNED_IN" && !hasFetchedGlobals.current) {
              hasFetchedGlobals.current = true;
              console.log(
                "[App] First sign-in detected. Fetching all global data..."
              );
              if (organizationId) {
                usePlanStore.getState().fetchAllPlans(session.access_token);
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
              }
            }
          } else if (event === "SIGNED_OUT") {
            hasFetchedGlobals.current = false;
            disconnect();
            clearAuth();
          }
        } catch (error) {
          console.error(
            "[App] Critical error during session processing. Logging out.",
            error
          );
          await logout();
        } finally {
          // MODIFICADO: Garante que a aplicação seja exibida após a primeira verificação.
          setIsInitializing(false);
        }
      }
    );

    return () => {
      console.log("[App] Unmounting. Unsubscribing from auth listener.");
      authListener.subscription.unsubscribe();
    };
  }, []);

  // NOVO: Renderiza o loader enquanto a verificação inicial não termina.
  if (isInitializing) {
    return <FullScreenLoader />;
  }
  // Removido: redirecionamento global para /login
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
