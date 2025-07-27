import { create } from "zustand";
import { WhatsAppInstanceOutput, WhatsAppInstanceState } from "../types/whatsappInstance";
import { whatsappInstanceService } from "../services/whatsappInstance.service";
import { APIError } from "../services/errors/api.errors";

const CACHE_DURATION = 60 * 60 * 1000;

export const useWhatsAppInstanceStore = create<WhatsAppInstanceState>()((set, get) => ({
  instances: [],
  isLoading: false,
  error: null,
  lastFetched: null,

  setInstances: (instances) => set({ instances }),

  addInstance: (newInstance) =>
    set((state) => ({
      instances: [...state.instances, newInstance],
    })),

  updateInstance: (updatedInstance) =>
    set((state) => ({
      instances: state.instances.map((instance) =>
        instance.id === updatedInstance.id ? updatedInstance : instance
      ),
    })),

  deleteInstance: (instanceId) =>
    set((state) => ({
      instances: state.instances.filter((instance) => instance.id !== instanceId),
    })),

  updateQrCode: (instanceId: string, qrCode: string) => {
    console.log("[WhatsAppInstanceStore] Atualizando QR Code para instância:", instanceId, "qrCode:", qrCode);
    set((state) => ({
      instances: state.instances.map((instance) =>
        instance.id === instanceId ? { ...instance, qr_code: qrCode } : instance
      ),
    }));
  },

  fetchAllInstances: async (token: string, organizationId: string) => {
    const { instances, isLoading } = get();
    if (instances.length === 0) {
      set({ isLoading: true });
    }
    if (isLoading) return;
    try {
      const fetchedInstances = await whatsappInstanceService.findAll(
        token,
        organizationId
      );
      set({
        instances: fetchedInstances,
        isLoading: false,
        lastFetched: Date.now(),
      });
    } catch (err: any) {
      console.error("WhatsAppInstanceStore: Erro ao buscar instâncias:", err);
      const errorMessage =
        err instanceof APIError ? err.message : "Falha ao carregar instâncias.";
      set({ error: errorMessage, isLoading: false });
    }
  },
  cleanUserData: () => {
    set({
      instances: [],
      isLoading: false,
      error: null,
      lastFetched: null,
    });
  },
})); 