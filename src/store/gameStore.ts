import { create } from "zustand";
import { GameState, TabType, ToastItem } from "../types";

interface GameStore {
  // Auth
  chatId: number | null;
  userId: number | null;
  userName: string;
  isAuthenticated: boolean;
  isAuthLoading: boolean;
  authError: string | null;

  // Navigation
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;

  // Cached Game State
  gameState: GameState | null;
  setGameState: (state: GameState) => void;

  // Toasts
  toasts: ToastItem[];
  addToast: (message: string, type?: "success" | "info" | "warning" | "level_up") => void;
  removeToast: (id: string) => void;

  // UI / Animations
  lastBalance: number;
  floatingCoins: Array<{ id: number; amount: number; x?: number; y?: number }>;
  triggerCoinAnimation: (amount: number) => void;
  clearFloatingCoin: (id: number) => void;

  // Settings
  soundEnabled: boolean;
  toggleSound: () => void;

  // Session
  setAuthData: (chatId: number, userId: number, userName?: string) => void;
  setAuthLoading: (loading: boolean) => void;
  setAuthError: (error: string | null) => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  chatId: null,
  userId: null,
  userName: "Фермер",
  isAuthenticated: false,
  isAuthLoading: true,
  authError: null,

  activeTab: "farm",
  setActiveTab: (tab: TabType) => set({ activeTab: tab }),

  gameState: null,
  lastBalance: 0,
  setGameState: (newState: GameState) => {
    const current = get().gameState;
    if (current && newState.economy.balance > current.economy.balance) {
      const diff = newState.economy.balance - current.economy.balance;
      get().triggerCoinAnimation(diff);
    }
    set({
      gameState: newState,
      lastBalance: newState.economy.balance,
    });
  },

  toasts: [],
  addToast: (message, type = "success") => {
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newToast: ToastItem = { id, message, type, timestamp: Date.now() };
    set((state) => ({
      toasts: [...state.toasts.slice(-4), newToast],
    }));

    setTimeout(() => {
      get().removeToast(id);
    }, 4200);
  },
  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },

  floatingCoins: [],
  triggerCoinAnimation: (amount) => {
    const id = Date.now() + Math.random();
    set((state) => ({
      floatingCoins: [...state.floatingCoins, { id, amount }],
    }));
  },
  clearFloatingCoin: (id) => {
    set((state) => ({
      floatingCoins: state.floatingCoins.filter((c) => c.id !== id),
    }));
  },

  soundEnabled: true,
  toggleSound: () => set((s) => ({ soundEnabled: !s.soundEnabled })),

  setAuthData: (chatId, userId, userName = "Фермер") =>
    set({
      chatId,
      userId,
      userName,
      isAuthenticated: true,
      isAuthLoading: false,
      authError: null,
    }),
  setAuthLoading: (loading) => set({ isAuthLoading: loading }),
  setAuthError: (error) => set({ authError: error, isAuthLoading: false }),
}));
