import React from "react";
import { useGameStore } from "../../store/gameStore";
import { triggerHaptic } from "../../services/telegram";
import { BusinessContract } from "../../types";
import { Briefcase, CheckCircle, Users, Award, Zap, Coins, Sparkles, Truck } from "lucide-react";
import confetti from "canvas-confetti";

export const BusinessView: React.FC<{
  onAction: (actionName: string, params?: Record<string, unknown>) => Promise<void>;
  isLoading?: boolean;
}> = ({ onAction, isLoading = false }) => {
  const { gameState } = useGameStore();

  if (!gameState) return null;

  const business = gameState.business;
  const workers = gameState.workers;
  const balance = gameState.economy.balance;

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

  const handleHireWorker = async () => {
    triggerHaptic("medium");
    await onAction("hire_worker");
  };

  // Helper to check if player has enough resources to fulfill contract
  const canFulfill = (contract: BusinessContract): { available: boolean; current: number } => {
    if (contract.fulfilled) return { available: false, current: 0 };
    if (contract.req_item === "wheat") {
      const current = gameState.wheat.granary_used;
      return { available: current >= contract.req_count, current };
    }
    if (contract.req_item === "egg") {
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
    return { available: false, current: 0 };
  };

  return (
    <div className="flex flex-col gap-4 pb-24 max-w-xl mx-auto px-3">
      {/* Business Header Banner */}
      <div className="bg-gradient-to-r from-[#1c3848] to-[#12242e] rounded-3xl p-4 border-2 border-cyan-500/70 shadow-xl text-cyan-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-400 flex items-center justify-center text-2xl shadow-inner">
              💼
            </div>
            <div>
              <h2 className="font-['Fredoka'] font-bold text-lg text-cyan-200 leading-tight">
                Агро-Контракти та Бізнес
              </h2>
              <span className="text-xs text-cyan-100/80">
                Укладайте великі угоди з ресторанами та пекарнями
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 📜 Active Commercial Contracts */}
      <section className="bg-[#244527] rounded-3xl p-4 border-2 border-[#3d7a44] shadow-xl flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">📜</span>
            <h3 className="font-['Fredoka'] font-bold text-base text-amber-200">
              Комерційні замовлення
            </h3>
          </div>
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

                  {/* Rewards Badge */}
                  <div className="flex flex-col items-end shrink-0">
                    <div className="flex items-center gap-1 text-xs font-['Fredoka'] font-bold text-yellow-300">
                      <Coins className="w-3.5 h-3.5 text-amber-400" /> +{contract.reward_coins}
                    </div>
                    <span className="text-[10px] text-cyan-300 font-bold">+{contract.reward_xp} XP</span>
                  </div>
                </div>

                {/* Progress Requirements */}
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

      {/* 👨‍🌾 Workers & Machinery Section */}
      <section className="bg-[#244527] rounded-3xl p-4 border-2 border-[#3d7a44] shadow-xl flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-amber-400" />
            <h3 className="font-['Fredoka'] font-bold text-base text-amber-200">
              Бригада помічників
            </h3>
          </div>
          <span className="text-xs text-amber-300 font-bold bg-[#142916] px-2.5 py-1 rounded-xl border border-amber-600/40">
            {workers.hired} робітників
          </span>
        </div>

        <div className="bg-[#1b3a1e] rounded-2xl p-3.5 border border-emerald-900 flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-2 text-center text-xs">
            <div className="bg-[#142817] p-2.5 rounded-xl border border-emerald-800">
              <span className="text-emerald-300 text-[11px]">Бонус швидкості:</span>
              <div className="font-['Fredoka'] font-bold text-base text-yellow-300 mt-0.5">
                +{workers.speed_boost}%
              </div>
            </div>
            <div className="bg-[#142817] p-2.5 rounded-xl border border-emerald-800">
              <span className="text-emerald-300 text-[11px]">Автозбір:</span>
              <div className="font-['Fredoka'] font-bold text-base text-emerald-400 mt-0.5">
                {workers.auto_collector ? "Увімкнено ⚡" : "Вимкнено"}
              </div>
            </div>
          </div>

          <button
            id="btn-hire-worker"
            onClick={handleHireWorker}
            disabled={isLoading || balance < 500}
            className={`w-full py-2.5 px-3 rounded-xl font-['Fredoka'] font-bold text-xs shadow-md border flex items-center justify-center gap-1.5 transition-all ${
              balance >= 500
                ? "bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 active:scale-95 text-amber-950 border-amber-300 shadow-amber-900/40"
                : "bg-gray-800/40 text-gray-500 border-gray-700 cursor-not-allowed"
            }`}
          >
            <Users className="w-4 h-4" />
            Наймати нового помічника (🪙 500)
          </button>
        </div>
      </section>
    </div>
  );
};
