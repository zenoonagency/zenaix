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

export function App() {
  // --- Seletores das Stores ---
  // Seleciona cada valor/função individualmente para garantir referências estáveis.
  const {
    isAuthenticated,
    _hasHydrated,
    token,
    userId,
    organizationId,
    fetchAndSyncUser,
    connectToUserChanges,
    disconnectFromUserChanges,
    connectToOrgChanges,
    disconnectFromOrgChanges,
  } = useAuthStore((state) => ({
    isAuthenticated: state.isAuthenticated,
    _hasHydrated: state._hasHydrated,
    token: state.token,
    userId: state.user?.id,
    organizationId: state.user?.organization_id,
    fetchAndSyncUser: state.fetchAndSyncUser,
    connectToUserChanges: state.connectToUserChanges,
    disconnectFromUserChanges: state.disconnectFromUserChanges,
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

  // --- EFEITO 1: Sincronização Inicial do Utilizador e Planos ---
  // Responsabilidade: Buscar dados que só dependem do token.
  useEffect(() => {
    if (isAuthenticated && _hasHydrated && token) {
      console.log("✅ Efeito 1: Sincronizando utilizador e planos...");
      fetchAndSyncUser();
      fetchAllPlans(token);
    }
  }, [isAuthenticated, _hasHydrated, token, fetchAndSyncUser, fetchAllPlans]);

  // --- EFEITO 2: Listener de Mudanças no Utilizador ---
  // Responsabilidade: Ouvir o próprio registo do utilizador para detetar quando uma organização é atribuída.
  useEffect(() => {
    // Só conecta se tivermos um ID de utilizador.
    if (userId) {
      console.log(
        `✅ Efeito 2: Conectando ao canal do utilizador ${userId}...`
      );
      connectToUserChanges(userId);
      // A limpeza é feita quando o utilizador desloga e o userId se torna nulo.
      return () => {
        console.log("🧹 Limpando conexão do canal do utilizador...");
        disconnectFromUserChanges();
      };
    }
  }, [userId, connectToUserChanges, disconnectFromUserChanges]);

  // --- EFEITO 3: Sincronização da Organização ---
  // Responsabilidade: Reagir à existência de um organizationId.
  useEffect(() => {
    // Só executa se tivermos um token E um organizationId.
    if (token && organizationId) {
      console.log(
        `✅ Efeito 3: Buscando dados e conectando ao Realtime para a organização ${organizationId}...`
      );

      // Busca os dados que dependem da organização.
      fetchAllEmbedPages(token, organizationId);

      // Conecta aos canais de Realtime da organização.
      connectToOrgChanges();
      connectToEmbedChanges(organizationId);

      // A limpeza é feita quando o utilizador desloga e o organizationId se torna nulo.
      return () => {
        console.log("🧹 Limpando conexões da Organização...");
        disconnectFromOrgChanges();
        disconnectFromEmbedChanges();
      };
    }
  }, [
    token,
    organizationId, // A dependência chave que orquestra este efeito.
    fetchAllEmbedPages,
    connectToOrgChanges,
    connectToEmbedChanges,
    disconnectFromOrgChanges,
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
