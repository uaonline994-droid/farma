import React, { useState } from "react";
import { useGameStore } from "../../store/gameStore";
import { triggerHaptic } from "../../services/telegram";
import { BusinessContract } from "../../types";
import { Briefcase, CheckCircle, Users, Award, Zap, Coins, Sparkles, Building2, Landmark, ShieldCheck } from "lucide-react";
import confetti from "canvas-confetti";

// Exact Russian/Ukrainian Businesses definition matching Python SQLite
const BOT_BUSINESSES = [
  { id: "kiosk", name: "Кіоск", price: 30000, hourly: 80, emoji: "🏪", desc: "Насіння, вода та дрібниці" },
  { id: "cafe", name: "Кафе", price: 200000, hourly: 500, emoji: "☕", desc: "Кава для студентів" },
  { id: "shop", name: "Магазин", price: 1200000, hourly: 2800, emoji: "🏬", desc: "Продукти з села" },
  { id: "restaurant", name: "Ресторан", price: 7000000, hourly: 15000, emoji: "🍽️", desc: "Елітне ресторанне місце" },
  { id: "factory", name: "Завод", price: 40000000, hourly: 80000, emoji: "🏭", desc: "Агропромисловий гігант" },
  { id: "corporation", name: "Корпорація", price: 250000000, hourly: 450000, emoji: "🏢", desc: "Транснаціональна мережа" },
  { id: "monopoly", name: "Монополія", price: 1500000000, hourly: 2400000, emoji: "💼", desc: "Повний контроль агроринку" },
];

const WORKER_TYPES = [
  { id: "tractor", name: "Тракторист", emoji: "🚜", price: 10000, wage: 100, desc: "+50% до збору картоплі" },
  { id: "combine", name: "Комбайнер", emoji: "🌾", price: 25000, wage: 200, desc: "Необхідний для ділянок пшениці" },
  { id: "shepherd", name: "Пастух", emoji: "🐕", price: 4000, wage: 40, desc: "+25% до яєць" },
  { id: "milkmaid", name: "Доярка", emoji: "🥛", price: 6000, wage: 60, desc: "+25% до молока" },
];

export const BusinessView: React.FC<{
  onAction: (actionName: string, params?: Record<string, unknown>) => Promise<void>;
  isLoading?: boolean;
}> = ({ onAction, isLoading = false }) => {
  const { gameState } = useGameStore();
  const [activeTab, setActiveTab] = useState<"contracts" | "enterprises" | "workers" | "bank">("enterprises");

  if (!gameState) return null;

  const business = gameState.business;
  const workers = gameState.workers;
  const balance = gameState.economy.balance;
  const bizOwned = business.businesses || {
    kiosk: business.upgrades?.sprinkler || 0,
    cafe: business.upgrades?.auto_feeder || 0,
    shop: business.upgrades?.tractor || 0,
    restaurant: 0,
    factory: 0,
    corporation: 0,
    monopoly: 0,
  };

  const handleFulfillContract = async (contract: BusinessContract) => {
    triggerHaptic("heavy");
    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.55 },
        colors: ["#3b82f6", "#f59e0b", "#10b981"],
      });
    } catch {}
    await onAction("fulfill_contract", { contract_id: contract.id });
  };

  const handleHireWorker = async (workerId: string) => {
    triggerHaptic("medium");
    await onAction("hire_worker", { worker: workerId });
  };

  // Helper to check if player has enough resources to fulfill contract
  const canFulfill = (contract: BusinessContract): { available: boolean; current: number } => {
    if (contract.fulfilled) return { available: false, current: 0 };
    if (contract.req_item === "wheat") {
      const current = gameState.wheat.granary_used;
      return { available: current >= contract.req_count, current };
    }
    if (contract.req_item === "eggs" || contract.req_item === "egg") {
      const current = gameState.farm.chickens.eggs;
      return { available: current >= contract.req_count, current };
    }
    if (contract.req_item === "cheese") {
      const current = gameState.farm.cows.cheese;
      return { available: current >= contract.req_count, current };
    }
    if (contract.req_item === "ostrich_egg") {
      const current = gameState.farm.ostriches.eggs;
      return { available: current >= contract.req_count, current };
    }
    if (contract.req_item === "milk") {
      const current = gameState.farm.cows.milk;
      return { available: current >= contract.req_count, current };
    }
    if (contract.req_item === "meat") {
      const current = gameState.farm.pigs.meat;
      return { available: current >= contract.req_count, current };
    }
    if (contract.req_item === "potato") {
      const current = gameState.farm.potato.count;
      return { available: current >= contract.req_count, current };
    }
    return { available: false, current: 0 };
  };

  // Calculate total hourly business income
  const totalHourlyIncome = BOT_BUSINESSES.reduce((sum, b) => {
    const qty = (bizOwned as any)[b.id] || 0;
    return sum + qty * b.hourly;
  }, 0);

  return (
    <div className="flex flex-col gap-4 pb-24 max-w-xl mx-auto px-3 font-['Nunito']">
      {/* Business Header Banner */}
      <div className="bg-gradient-to-r from-[#1c3848] to-[#12242e] rounded-3xl p-4 border-2 border-cyan-500/70 shadow-xl text-cyan-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-400 flex items-center justify-center text-2xl shadow-inner">
              💼
            </div>
            <div>
              <h2 className="font-['Fredoka'] font-bold text-lg text-cyan-200 leading-tight">
                Бізнес-Імперія та Підприємства
              </h2>
              <span className="text-xs text-cyan-100/80">
                Пасивний дохід: <strong className="text-yellow-300">+{totalHourlyIncome.toLocaleString()} 🪙/год</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Section Navigation Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-3 mt-2 border-t border-cyan-800/80 scrollbar-none">
          {[
            { id: "enterprises", label: "Підприємства", icon: "🏢" },
            { id: "workers", label: "Робітники", icon: "👷" },
            { id: "contracts", label: "Контракти", icon: "📜" },
            { id: "bank", label: "Банк А-11", icon: "🏦" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                triggerHaptic("light");
                setActiveTab(tab.id as any);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-['Fredoka'] font-bold whitespace-nowrap transition-all flex items-center gap-1 shrink-0 ${
                activeTab === tab.id
                  ? "bg-cyan-500 text-cyan-950 shadow-md border border-cyan-300"
                  : "bg-[#11242f] text-cyan-200 hover:text-cyan-100 border border-cyan-800"
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 🏢 1. ENTERPRISES (Кіоски, Кафе, Заводи) */}
      {activeTab === "enterprises" && (
        <section className="bg-[#244527] rounded-3xl p-4 border-2 border-[#3d7a44] shadow-xl flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h3 className="font-['Fredoka'] font-bold text-base text-amber-200 flex items-center gap-1.5">
              <Building2 className="w-5 h-5 text-amber-400" />
              Міські Підприємства
            </h3>
            <span className="text-[11px] text-emerald-200 bg-emerald-950/80 px-2 py-0.5 rounded-lg border border-emerald-700/60">
              Генерують монети автоматично
            </span>
          </div>

          <div className="flex flex-col gap-2.5">
            {BOT_BUSINESSES.map((b) => {
              const count = (bizOwned as any)[b.id] || 0;
              const canAfford = balance >= b.price;

              return (
                <div
                  key={b.id}
                  className="bg-[#1b3a1e] rounded-2xl p-3.5 border border-emerald-700/80 flex flex-col gap-2 shadow-md"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl bg-[#142817] border border-emerald-600/60 flex items-center justify-center text-xl shadow-inner">
                        {b.emoji}
                      </div>
                      <div>
                        <div className="font-['Fredoka'] font-bold text-sm text-amber-100 flex items-center gap-1.5">
                          {b.name}
                          {count > 0 && (
                            <span className="text-[10px] bg-amber-500/20 text-yellow-300 px-1.5 py-0.2 rounded border border-amber-400/40">
                              В наявності: ×{count}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-emerald-300/90">{b.desc}</p>
                        <div className="text-xs text-yellow-300 font-semibold mt-0.5">
                          +{b.hourly.toLocaleString()} 🪙/год
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="font-['Fredoka'] font-bold text-sm text-yellow-300">
                        {b.price.toLocaleString()} 🪙
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-emerald-800/60 text-xs">
                    <span className="text-[11px] text-emerald-300">
                      Команда в боті: <code>Гусь бізнес</code>
                    </span>
                    <button
                      onClick={() => {
                        triggerHaptic("medium");
                        onAction("shop_buy", { item: b.id, count: 1 }).catch(() => {});
                      }}
                      disabled={isLoading || !canAfford}
                      className={`px-3 py-1.5 rounded-xl font-['Fredoka'] font-bold text-xs shadow-md border flex items-center gap-1 transition-all ${
                        canAfford
                          ? "bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-amber-950 border-amber-300 active:scale-95"
                          : "bg-gray-800 text-gray-500 border-gray-700 cursor-not-allowed"
                      }`}
                    >
                      <Coins className="w-3.5 h-3.5" />
                      Придбати (🪙 {b.price.toLocaleString()})
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* 👷 2. WORKERS (Тракторист, Комбайнер, Пастух, Доярка) */}
      {activeTab === "workers" && (
        <section className="bg-[#244527] rounded-3xl p-4 border-2 border-[#3d7a44] shadow-xl flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h3 className="font-['Fredoka'] font-bold text-base text-amber-200 flex items-center gap-1.5">
              <Users className="w-5 h-5 text-amber-400" />
              Бригада Робітників
            </h3>
            <span className="text-xs text-amber-300 font-bold bg-[#142916] px-2.5 py-1 rounded-xl border border-amber-600/40">
              {workers.hired} найнято
            </span>
          </div>

          <div className="flex flex-col gap-2.5">
            {WORKER_TYPES.map((w) => {
              const canAfford = balance >= w.price;

              return (
                <div
                  key={w.id}
                  className="bg-[#1b3a1e] rounded-2xl p-3.5 border border-emerald-700/80 flex items-center justify-between shadow-md"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-[#142817] border border-emerald-600/60 flex items-center justify-center text-xl shadow-inner">
                      {w.emoji}
                    </div>
                    <div>
                      <div className="font-['Fredoka'] font-bold text-sm text-amber-100">
                        {w.name}
                      </div>
                      <p className="text-[11px] text-emerald-300">{w.desc}</p>
                      <div className="text-[10px] text-amber-300">
                        Зарплата: <b>-{w.wage} 🪙/год</b> при зборі врожаю
                      </div>
                    </div>
                  </div>

                  <button
                    id={`btn-hire-${w.id}`}
                    onClick={() => handleHireWorker(w.id)}
                    disabled={isLoading || !canAfford}
                    className={`py-2 px-3 rounded-xl font-['Fredoka'] font-bold text-xs shadow-md border flex items-center gap-1 transition-all ${
                      canAfford
                        ? "bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 active:scale-95 text-amber-950 border-amber-300"
                        : "bg-gray-800 text-gray-500 border-gray-700 cursor-not-allowed"
                    }`}
                  >
                    Найняти ({w.price.toLocaleString()} 🪙)
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* 📜 3. CONTRACTS */}
      {activeTab === "contracts" && (
        <section className="bg-[#244527] rounded-3xl p-4 border-2 border-[#3d7a44] shadow-xl flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h3 className="font-['Fredoka'] font-bold text-base text-amber-200">
              Комерційні замовлення
            </h3>
            <span className="text-xs text-emerald-200 font-semibold bg-emerald-950/80 px-2.5 py-1 rounded-xl border border-emerald-700/50">
              {business.contracts.filter((c) => !c.fulfilled).length} доступно
            </span>
          </div>

          <div className="flex flex-col gap-2.5">
            {business.contracts.map((contract) => {
              const { available, current } = canFulfill(contract);

              return (
                <div
                  key={contract.id}
                  className={`rounded-2xl p-3.5 border-2 transition-all flex flex-col gap-2.5 ${
                    contract.fulfilled
                      ? "bg-[#142817]/60 border-emerald-900/60 opacity-60"
                      : "bg-[#1b3a1e] border-emerald-700/80 shadow-md"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-['Fredoka'] font-bold text-sm text-amber-100 flex items-center gap-1.5">
                        {contract.fulfilled && <CheckCircle className="w-4 h-4 text-emerald-400 inline" />}
                        {contract.title}
                      </h4>
                      <p className="text-[11px] text-emerald-200/90 mt-0.5">{contract.description}</p>
                    </div>

                    <div className="flex flex-col items-end shrink-0">
                      <div className="flex items-center gap-1 text-xs font-['Fredoka'] font-bold text-yellow-300">
                        <Coins className="w-3.5 h-3.5 text-amber-400" /> +{contract.reward_coins.toLocaleString()}
                      </div>
                      <span className="text-[10px] text-cyan-300 font-bold">+{contract.reward_xp} XP</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1 border-t border-emerald-800/60">
                    <span className="text-amber-200 font-medium text-[11px]">
                      Вимога: <strong className="text-yellow-300">{contract.req_count} шт.</strong> (На складі: {current} шт.)
                    </span>

                    {contract.fulfilled ? (
                      <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5" /> Виконано
                      </span>
                    ) : (
                      <button
                        id={`btn-contract-${contract.id}`}
                        onClick={() => handleFulfillContract(contract)}
                        disabled={isLoading || !available}
                        className={`px-3 py-1.5 rounded-xl font-['Fredoka'] font-bold text-xs shadow-md border flex items-center gap-1 transition-all ${
                          available
                            ? "bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 text-white border-emerald-300 active:scale-95 animate-pulse"
                            : "bg-gray-800/40 text-gray-500 border-gray-700 cursor-not-allowed"
                        }`}
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        Відвантажити
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* 🏦 4. BANK А-11 */}
      {activeTab === "bank" && (
        <section className="bg-[#244527] rounded-3xl p-4 border-2 border-[#3d7a44] shadow-xl flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Landmark className="w-6 h-6 text-amber-400" />
            <div>
              <h3 className="font-['Fredoka'] font-bold text-base text-amber-200">
                Банк Агроном А-11
              </h3>
              <p className="text-[11px] text-emerald-200">
                Депозити з фіксованою ставкою 1%/год (до 24 год)
              </p>
            </div>
          </div>

          <div className="bg-[#1b3a1e] rounded-2xl p-4 border border-emerald-800 text-center flex flex-col gap-2">
            <span className="text-xs text-amber-200">
              Повна інтеграція з банківським сейфом бота
            </span>
            <p className="text-xs text-emerald-300 leading-relaxed">
              Ви можете робити вклади в групі за допомогою команди <code>Гусь банк</code> або переглядати свої накопичення в реальному часі.
            </p>
          </div>
        </section>
      )}
    </div>
  );
};
