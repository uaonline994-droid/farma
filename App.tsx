import React, { useEffect, useState } from "react";
import { useQuery, useMutation, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { initTelegramApp, getTelegramInitData, getTelegramUser } from "./services/telegram";
import { fetchGameStateWithUser, executeAction, authenticateTelegramUser, keepBackendAwake, fetchBankRollbacks, applyBankRollback, BankRollbackCandidate } from "./services/api";
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
import { BankView } from "./components/bank/BankView";
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

function AdminRollbackPanel() {
  const [items, setItems] = useState<BankRollbackCandidate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      setItems(await fetchBankRollbacks());
    } catch (err: any) {
      setError(err.message || "Не вдалося завантажити відкат");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const rollback = async (userId: number) => {
    if (!window.confirm("Відкотити баланс до стану після першого зняття депозиту?")) return;
    setLoading(true);
    try {
      await applyBankRollback(userId);
      await load();
    } catch (err: any) {
      setError(err.message || "Не вдалося виконати відкат");
      setLoading(false);
    }
  };

  return (
    <section className="mb-4 rounded-2xl border-2 border-red-400/60 bg-red-950/40 p-4 text-red-50">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="font-bold text-red-200">Адмін: відкат балансів</h2>
        <button type="button" onClick={load} disabled={loading} className="rounded-lg border border-red-300 px-3 py-1 text-xs disabled:opacity-50">Оновити</button>
      </div>
      {error && <p className="mb-2 text-xs text-red-300">{error}</p>}
      {items.length === 0 && !loading && <p className="text-xs text-red-200">Безпечних кандидатів для відкату не знайдено.</p>}
      <div className="flex flex-col gap-2">
        {items.map((item) => (
          <div key={item.user_id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-red-300/30 bg-black/20 p-3 text-xs">
            <div>
              <strong>{item.name}</strong> <span className="text-red-300">({item.user_id})</span>
              <div className="text-red-200">{item.current_balance.toLocaleString()} → {item.target_balance.toLocaleString()} 🪙</div>
              <div className="text-red-300">Корекція: {item.correction.toLocaleString()} 🪙 · депозит: {Number((item as any).deposit || 0).toLocaleString()} 🪙</div>
              <div className="text-red-300">Перше зняття #{item.first_withdrawal_id}</div>
            </div>
            <button type="button" onClick={() => rollback(item.user_id)} disabled={loading || item.already_applied || item.correction >= 0} className="rounded-lg bg-red-500 px-3 py-2 font-bold text-white disabled:opacity-40">
              {item.already_applied ? "Вже виконано" : "Відкотити"}
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}

function FarmGame() {
  const {
    activeTab,
    setAuthData,
    setAuthLoading,
    setAuthError,
    setGameState,
    addToast,
    gameState,
    userId,
  } = useGameStore();

  useEffect(() => {
    keepBackendAwake();
    const intervalId = window.setInterval(keepBackendAwake, 4 * 60 * 1000);
    return () => window.clearInterval(intervalId);
  }, []);

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

  // 2. Explicit Telegram authorization — verifies signed initData on the backend
  // BEFORE any game data is requested. This is what guarantees the user, balance
  // and farm are tied to the correct, server-verified Telegram identity the moment
  // the Mini App opens (not just whatever the client-side WebApp object claims).
  const {
    data: authResult,
    isLoading: isAuthLoading,
    error: authError2,
    refetch: refetchAuth,
  } = useQuery({
    queryKey: ["telegramAuth"],
    queryFn: authenticateTelegramUser,
    retry: 1,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });

  const isAdmin = Number(userId || authResult?.user_id || getTelegramUser()?.id || 0) === 7883597300;

  useEffect(() => {
    if (authResult) {
      setAuthData(authResult.chat_id, authResult.user_id, authResult.name);
    }
  }, [authResult, setAuthData]);

  // 3. Fetch Game State & User Sync via TanStack Query — only once authorized
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
    enabled: !!authResult,
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

  const blockingError = authError2 || stateError;
  const isBlockingLoading = isAuthLoading || (isStateLoading && !!authResult);

  // 4. Action Mutation (POST /api/action)
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
        {isAdmin && activeTab === "admin" && <AdminRollbackPanel />}
        {isBlockingLoading && !gameState ? (
          <SkeletonLoader />
        ) : blockingError && !gameState ? (
          <ErrorState
            error={blockingError as Error}
            onRetry={() => {
              refetchAuth();
              refetchState();
            }}
            isRetrying={isFetching || isAuthLoading}
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
              {activeTab === "bank" && (
                <BankView onAction={handleAction} isLoading={actionMutation.isPending} />
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
      <BottomNav isAdmin={isAdmin} />
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
