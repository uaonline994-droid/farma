import React, { useEffect } from "react";
import { useQuery, useMutation, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { initTelegramApp, getTelegramInitData, getTelegramUser } from "./services/telegram";
import { authApi, fetchGameState, executeAction } from "./services/api";
import { useGameStore } from "./store/gameStore";
import { Header } from "./components/ui/Header";
import { BottomNav } from "./components/ui/BottomNav";
import { ToastContainer } from "./components/ui/ToastContainer";
import { SkeletonLoader } from "./components/ui/SkeletonLoader";
import { FarmCanvas } from "./components/farm/FarmCanvas";
import { WheatFieldView } from "./components/wheat/WheatFieldView";
import { MarketView } from "./components/market/MarketView";
import { ShopView } from "./components/shop/ShopView";
import { BusinessView } from "./components/business/BusinessView";
import { CasinoView } from "./components/casino/CasinoView";
import { LeaderboardView } from "./components/leaderboard/LeaderboardView";
import { ProfileView } from "./components/profile/ProfileView";
import { motion, AnimatePresence } from "motion/react";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: true,
      retry: 2,
      staleTime: 2000,
    },
  },
});

function FarmGame() {
  const {
    activeTab,
    setAuthData,
    setAuthLoading,
    setAuthError,
    setGameState,
    addToast,
    gameState,
  } = useGameStore();

  // 1. Telegram App Initialization & Auth
  useEffect(() => {
  initTelegramApp();

  async function initializeAuth() {
    setAuthLoading(true);
    // Авторизації через /api/auth немає — user приходить разом зі state
    // Тому тут ми просто читаємо з Telegram WebApp
    const tgUser = getTelegramUser();
    const initData = getTelegramInitData();

    if (!initData) {
      setAuthError("Відкрий через Telegram WebApp (кнопка «🎮 Грати» в боті)");
      return;
    }

    // chat_id/user_id ми все одно знаємо від Telegram — ставимо їх одразу
    if (tgUser) {
      const name = `${tgUser.first_name || ""} ${tgUser.last_name || ""}`.trim() || tgUser.username || "Фермер";
      // chat_id в БД — глобальний, але для UI ми підставляємо user_id; chat_id отримаємо зі state
      setAuthData(0, tgUser.id, name);
    }
  }

  initializeAuth();
}, []);

  // 2. Fetch Game State via TanStack Query (synced with https://vogi.onrender.com)
  const {
    data: fetchedState,
    isLoading: isStateLoading,
    isFetching,
    refetch: refetchState,
  } = useQuery({
    queryKey: ["gameState"],
    queryFn: fetchGameState,
    refetchInterval: 5000, // Background sync every 5s for smooth state & timers
  });

  // Sync state to Zustand store
  useEffect(() => {
    if (fetchedState) {
      setGameState(fetchedState);
    }
  }, [fetchedState, setGameState]);

  // 3. Action Mutation
  const actionMutation = useMutation({
    mutationFn: async ({ actionName, params }: { actionName: string; params?: Record<string, unknown> }) => {
      return executeAction(actionName, params);
    },
    onSuccess: (data) => {
      if (data.message) {
        addToast(data.message, "success");
      }
      refetchState();
    },
    onError: (err: any) => {
      addToast(err.message || "Помилка при виконанні дії", "warning");
    },
  });

  const handleAction = async (actionName: string, params?: Record<string, unknown>) => {
    await actionMutation.mutateAsync({ actionName, params });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1c381f] via-[#244527] to-[#172c19] text-amber-50 flex flex-col justify-between selection:bg-amber-400 selection:text-amber-950 font-['Nunito']">
      {/* Top Header */}
      <Header onRefresh={() => refetchState()} isRefreshing={isFetching} />

      {/* Floating Action Toasts */}
      <ToastContainer />

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-xl mx-auto pt-3 px-2">
        {isStateLoading && !gameState ? (
          <SkeletonLoader />
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
            >
              {activeTab === "farm" && (
                <FarmCanvas onAction={handleAction} isLoading={actionMutation.isPending} />
              )}
              {activeTab === "wheat" && (
                <WheatFieldView onAction={handleAction} isLoading={actionMutation.isPending} />
              )}
              {activeTab === "market" && (
                <MarketView onAction={handleAction} isLoading={actionMutation.isPending} />
              )}
              {activeTab === "shop" && (
                <ShopView onAction={handleAction} isLoading={actionMutation.isPending} />
              )}
              {activeTab === "casino" && (
                <CasinoView onAction={handleAction} isLoading={actionMutation.isPending} />
              )}
              {activeTab === "business" && (
                <BusinessView onAction={handleAction} isLoading={actionMutation.isPending} />
              )}
              {activeTab === "leaderboard" && <LeaderboardView />}
              {activeTab === "profile" && <ProfileView />}
            </motion.div>
          </AnimatePresence>
        )}
      </main>

      {/* Bottom Sticky Navigation */}
      <BottomNav />
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <FarmGame />
    </QueryClientProvider>
  );
}
