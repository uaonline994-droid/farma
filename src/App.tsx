import React, { useEffect } from "react";
import { useQuery, useMutation, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { initTelegramApp, getTelegramInitData, getTelegramUser } from "./services/telegram";
import { fetchGameStateWithUser, executeAction } from "./services/api";
import { useGameStore } from "./store/gameStore";
import { Header } from "./components/ui/Header";
import { BottomNav } from "./components/ui/BottomNav";
import { ToastContainer } from "./components/ui/ToastContainer";
import { SkeletonLoader } from "./components/ui/SkeletonLoader";
import { ErrorState } from "./components/ui/ErrorState";
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

  // 1. Telegram App Initialization & Local InitData / User Setup
  useEffect(() => {
    initTelegramApp();

    const initData = getTelegramInitData();
    const tgUser = getTelegramUser();

    if (tgUser) {
      const name = `${tgUser.first_name || ""} ${tgUser.last_name || ""}`.trim() || tgUser.username || "Фермер";
      setAuthData(tgUser.id, tgUser.id, name);
    } else if (initData) {
      setAuthLoading(false);
    } else {
      setAuthLoading(false);
      setAuthError(null);
    }
  }, [setAuthData, setAuthLoading, setAuthError]);

  // 2. Fetch Game State & User Sync via TanStack Query
  const {
    data: fetchedResult,
    isLoading: isStateLoading,
    isFetching,
    error: stateError,
    refetch: refetchState,
  } = useQuery({
    queryKey: ["gameState"],
    queryFn: fetchGameStateWithUser,
    refetchInterval: 5000,
  });

  // Sync state and server user info to Zustand store
  useEffect(() => {
    if (fetchedResult?.gameState) {
      setGameState(fetchedResult.gameState);
    }
    if (fetchedResult?.user) {
      setAuthData(fetchedResult.user.id, fetchedResult.user.id, fetchedResult.user.name);
    }
  }, [fetchedResult, setGameState, setAuthData]);

  // 3. Action Mutation (POST /api/action)
  const actionMutation = useMutation({
    mutationFn: async ({ actionName, params }: { actionName: string; params?: Record<string, unknown> }) => {
      return executeAction(actionName, params);
    },
    onSuccess: (data) => {
      if (data.message) {
        addToast(data.message, "success");
      }
      if (data.state) {
        setGameState(data.state);
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
        ) : stateError && !gameState ? (
          <ErrorState
            error={stateError as Error}
            onRetry={() => refetchState()}
            isRetrying={isFetching}
          />
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
