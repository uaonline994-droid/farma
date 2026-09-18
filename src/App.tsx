import React, { useEffect, useState } from "react";
import { useQuery, useMutation, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { initTelegramApp, getTelegramInitData, getTelegramUser } from "./services/telegram";
import {
  fetchGameStateWithUser,
  executeAction,
  authenticateTelegramUser,
  keepBackendAwake,
  fetchBankRollbacks,
  applyBankRollback,
  BankRollbackCandidate,
  searchAdminUsers,
  fetchAdminUser,
  adminUserAction,
  AdminUserDetail,
  AdminUserSummary,
} from "./services/api";
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
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<AdminUserSummary[]>([]);
  const [selected, setSelected] = useState<AdminUserDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [balanceInput, setBalanceInput] = useState("0");
  const [depositInput, setDepositInput] = useState("0");
  const [bizKey, setBizKey] = useState("");

  const loadRollbacks = async () => {
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

  const doUserSearch = async (query = search) => {
    const value = query.trim();
    if (!value) {
      setResults([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const rows = await searchAdminUsers(value);
      setResults(rows);
      if (rows.length > 0) {
        const first = await fetchAdminUser(rows[0].user_id);
        setSelected(first);
        setBalanceInput(String(first.balance));
        setDepositInput(String(first.deposit));
      } else {
        setSelected(null);
      }
    } catch (err: any) {
      setError(err.message || "Не вдалося знайти користувача");
    } finally {
      setLoading(false);
    }
  };

  const loadUser = async (userId: number) => {
    setLoading(true);
    setError(null);
    try {
      const user = await fetchAdminUser(userId);
      setSelected(user);
      setBalanceInput(String(user.balance));
      setDepositInput(String(user.deposit));
      setBizKey("");
    } catch (err: any) {
      setError(err.message || "Не вдалося завантажити профіль користувача");
    } finally {
      setLoading(false);
    }
  };

  const runAdminAction = async (action: string, payload: Record<string, unknown> = {}) => {
    if (!selected) return;
    setLoading(true);
    setError(null);
    try {
      await adminUserAction(selected.user_id, action, payload);
      await loadUser(selected.user_id);
      if (search.trim()) {
        await doUserSearch(search);
      }
    } catch (err: any) {
      setError(err.message || "Не вдалося виконати дію");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRollbacks();
  }, []);

  const rollback = async (userId: number) => {
    if (!window.confirm("Відкотити баланс до стану після першого зняття депозиту?")) return;
    setLoading(true);
    try {
      await applyBankRollback(userId);
      await loadRollbacks();
    } catch (err: any) {
      setError(err.message || "Не вдалося виконати відкат");
      setLoading(false);
    }
  };

  return (
    <section className="mb-4 rounded-2xl border-2 border-red-400/60 bg-red-950/40 p-4 text-red-50">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="font-bold text-red-200">Адмін: керування гравцями</h2>
        <button type="button" onClick={loadRollbacks} disabled={loading} className="rounded-lg border border-red-300 px-3 py-1 text-xs disabled:opacity-50">Оновити</button>
      </div>

      <div className="mb-4 flex gap-2">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") doUserSearch();
          }}
          placeholder="ID або username"
          className="flex-1 rounded-lg border border-red-300/40 bg-black/20 px-3 py-2 text-sm text-red-50 outline-none placeholder:text-red-200/60"
        />
        <button type="button" onClick={() => doUserSearch()} disabled={loading} className="rounded-lg bg-red-500 px-3 py-2 text-sm font-bold text-white disabled:opacity-40">Пошук</button>
      </div>

      {error && <p className="mb-3 text-xs text-red-200">{error}</p>}

      {results.length > 0 && (
        <div className="mb-4 flex flex-col gap-2">
          {results.map((user) => (
            <button
              key={user.user_id}
              type="button"
              onClick={() => loadUser(user.user_id)}
              className={`flex w-full items-center justify-between rounded-xl border px-3 py-2 text-left text-xs ${selected?.user_id === user.user_id ? "border-red-200 bg-red-500/20" : "border-red-300/20 bg-black/10"}`}
            >
              <span>
                <strong>{user.name}</strong> <span className="text-red-200">({user.user_id})</span>
                {user.username ? <span className="ml-2 text-red-300">@{user.username}</span> : null}
              </span>
              <span className="text-red-100">{user.balance.toLocaleString()} 🪙</span>
            </button>
          ))}
        </div>
      )}

      {selected && (
        <div className="mb-4 rounded-xl border border-red-300/40 bg-black/15 p-3 text-xs">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="font-bold text-red-100">{selected.name}</div>
              <div className="text-red-200">ID: {selected.user_id} {selected.username ? `• @${selected.username}` : ""}</div>
            </div>
            <div className="text-right text-red-100">
              <div>Баланс: {selected.balance.toLocaleString()} 🪙</div>
              <div>Депозит: {selected.deposit.toLocaleString()} 🪙</div>
            </div>
          </div>

          <div className="mb-3 grid grid-cols-2 gap-2">
            <label className="text-red-200">
              Баланс
              <input value={balanceInput} onChange={(e) => setBalanceInput(e.target.value)} className="mt-1 w-full rounded-lg border border-red-300/40 bg-black/20 px-2 py-2 text-red-50" />
            </label>
            <label className="text-red-200">
              Депозит
              <input value={depositInput} onChange={(e) => setDepositInput(e.target.value)} className="mt-1 w-full rounded-lg border border-red-300/40 bg-black/20 px-2 py-2 text-red-50" />
            </label>
          </div>

          <div className="mb-3 flex flex-wrap gap-2">
            <button type="button" onClick={() => runAdminAction("set_balance", { value: Number(balanceInput) })} className="rounded-lg bg-red-500 px-3 py-2 font-bold text-white">Зберегти баланс</button>
            <button type="button" onClick={() => runAdminAction("set_deposit", { value: Number(depositInput) })} className="rounded-lg border border-red-300 px-3 py-2 font-bold text-red-50">Зберегти депозит</button>
            <button type="button" onClick={() => runAdminAction("clear_deposit")} className="rounded-lg border border-red-300 px-3 py-2 font-bold text-red-50">Обнулити депозит</button>
            <button type="button" onClick={() => runAdminAction("reset_user")} className="rounded-lg border border-orange-300 px-3 py-2 font-bold text-orange-100">Скинути профіль</button>
          </div>

          <div className="mb-3 flex gap-2">
            <input
              value={bizKey}
              onChange={(e) => setBizKey(e.target.value)}
              placeholder="biz_key або ключ бізнеса"
              className="flex-1 rounded-lg border border-red-300/40 bg-black/20 px-3 py-2 text-red-50 outline-none placeholder:text-red-200/60"
            />
            <button type="button" onClick={() => runAdminAction("delete_business", { business: bizKey })} className="rounded-lg bg-red-500 px-3 py-2 font-bold text-white">Видалити бізнес</button>
          </div>

          <button type="button" onClick={() => runAdminAction("clear_businesses")} className="mb-3 rounded-lg border border-red-300 px-3 py-2 font-bold text-red-50">Видалити всі бізнеси</button>

          {selected.businesses && Object.keys(selected.businesses).length > 0 && (
            <div className="rounded-lg border border-red-300/30 bg-black/10 p-2">
              <div className="mb-2 font-bold text-red-100">Бізнеси:</div>
              <div className="flex flex-col gap-2">
                {Object.entries(selected.businesses).map(([key, item]) => (
                  <div key={key} className="flex items-center justify-between gap-2 text-red-100">
                    <span>{key} ×{item.qty}</span>
                    <button type="button" onClick={() => runAdminAction("delete_business", { business: key })} className="rounded-lg border border-red-300 px-2 py-1 text-[10px] font-bold text-red-50">Delete</button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="mt-4 border-t border-red-300/30 pt-4">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h3 className="font-bold text-red-200">Відкат балансів</h3>
          <button type="button" onClick={loadRollbacks} disabled={loading} className="rounded-lg border border-red-300 px-3 py-1 text-xs disabled:opacity-50">Оновити</button>
        </div>
        {items.length === 0 && !loading && <p className="text-xs text-red-200">Безпечних кандидатів для відкату не знайдено.</p>}
        <div className="flex flex-col gap-2">
          {items.map((item) => (
            <div key={item.user_id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-red-300/30 bg-black/20 p-3 text-xs">
              <div>
                <strong>{item.name}</strong> <span className="text-red-300">({item.user_id})</span>
                <div className="text-red-200">{item.current_balance.toLocaleString()} → {item.target_balance == null ? "невідомо" : item.target_balance.toLocaleString()} 🪙</div>
                <div className="text-red-300">Корекція: {item.correction.toLocaleString()} 🪙 · депозит: {Number((item as any).deposit || 0).toLocaleString()} 🪙</div>
                <div className="text-red-300">{item.baseline_available ? `Перше зняття #${item.first_withdrawal_id}` : "Немає балансу до першого зняття в старому логу"}</div>
              </div>
              <button type="button" onClick={() => rollback(item.user_id)} disabled={loading || item.already_applied || !item.baseline_available || item.correction >= 0} className="rounded-lg bg-red-500 px-3 py-2 font-bold text-white disabled:opacity-40">
                {item.already_applied ? "Вже виконано" : "Відкотити"}
              </button>
            </div>
          ))}
        </div>
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
