import React, { useState } from "react";
import { useGameStore } from "../../store/gameStore";
import { triggerHaptic } from "../../services/telegram";
import {
  Landmark,
  PiggyBank,
  TrendingUp,
  ArrowDownRight,
  ArrowUpRight,
  ShieldCheck,
  Clock,
  Coins,
  Sparkles,
  Info,
} from "lucide-react";
import confetti from "canvas-confetti";

export const BankView: React.FC<{
  onAction: (actionName: string, params?: Record<string, unknown>) => Promise<void>;
  isLoading?: boolean;
}> = ({ onAction, isLoading = false }) => {
  const { gameState } = useGameStore();

  const [depositAmount, setDepositAmount] = useState<string>("10000");

  if (!gameState) return null;

  const balance = gameState.economy.balance;
  const bank = gameState.economy.bank || {
    deposit: 0,
    deposit_rate: 1,
    loan: 0,
    loan_limit: 50000,
    safe_balance: 0,
    profit_accrued: 0,
    hours_elapsed: 0,
    deposited_at: null,
  };

  const depositValue = bank.deposit || 0;
  const accruedProfit = bank.profit_accrued ?? Math.round(depositValue * 0.01 * Math.min(24, bank.hours_elapsed || 1));
  const BANK_MIN_DEPOSIT = 10000;

  const handleDeposit = async (amt: number) => {
    if (amt < BANK_MIN_DEPOSIT || amt > balance) return;
    triggerHaptic("medium");
    try {
      confetti({ particleCount: 35, spread: 60, origin: { y: 0.6 } });
    } catch {}
    await onAction("bank_deposit", { amount: amt });
  };

  const handleWithdraw = async () => {
    if (depositValue <= 0) return;
    triggerHaptic("heavy");
    try {
      confetti({ particleCount: 50, spread: 70, origin: { y: 0.6 } });
    } catch {}
    await onAction("bank_withdraw");
  };

  return (
    <div className="flex flex-col gap-4 pb-24 max-w-xl mx-auto px-3 font-['Nunito']">
      {/* 🏦 Bank Header Banner */}
      <div className="bg-gradient-to-r from-[#0d233a] via-[#10304f] to-[#0a1828] rounded-3xl p-4 sm:p-5 border-2 border-cyan-400/60 shadow-2xl relative overflow-hidden text-white">
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border-2 border-cyan-300 flex items-center justify-center text-2xl shadow-inner shrink-0">
              🏦
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-['Fredoka'] font-black text-xl text-cyan-200">
                  БАНК А-11
                </h1>
                <span className="bg-cyan-500/20 text-cyan-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-cyan-400/50">
                  1:1 З БОТОМ
                </span>
              </div>
              <p className="text-xs text-cyan-100/80">
                Єдина база даних вкладів та нарахувань
              </p>
            </div>
          </div>

          <div className="text-right shrink-0">
            <span className="text-[10px] text-cyan-300 block uppercase font-bold tracking-wider">
              Готівка
            </span>
            <span className="font-['Fredoka'] font-black text-lg text-yellow-300">
              {balance.toLocaleString()} 🪙
            </span>
          </div>
        </div>

        {/* 📊 Summary Badges */}
        <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-cyan-500/20 text-center">
          <div className="bg-[#081522]/80 p-3 rounded-2xl border border-cyan-500/30">
            <span className="text-[11px] text-cyan-300 font-semibold block flex items-center justify-center gap-1">
              <PiggyBank className="w-3.5 h-3.5" /> Твій вклад
            </span>
            <span className="text-base sm:text-lg font-black text-emerald-300 font-['Fredoka'] mt-0.5 block">
              {depositValue.toLocaleString()} 🪙
            </span>
          </div>

          <div className="bg-[#081522]/80 p-3 rounded-2xl border border-cyan-500/30">
            <span className="text-[11px] text-cyan-300 font-semibold block flex items-center justify-center gap-1">
              <TrendingUp className="w-3.5 h-3.5 text-yellow-400" /> Накопичений %
            </span>
            <span className="text-base sm:text-lg font-black text-yellow-300 font-['Fredoka'] mt-0.5 block">
              +{accruedProfit.toLocaleString()} 🪙
            </span>
          </div>
        </div>
      </div>

      {/* 📈 Deposit Conditions & Rules Info */}
      <div className="bg-[#0e2133] rounded-3xl p-4 border border-cyan-700/60 shadow-lg text-xs text-cyan-100 flex flex-col gap-2.5">
        <div className="flex items-center gap-2 text-cyan-300 font-['Fredoka'] font-bold text-sm border-b border-cyan-800/60 pb-2">
          <Info className="w-4 h-4 text-cyan-400" />
          Умови банківського вкладу в боті та вебі:
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <div className="bg-[#081522] p-2.5 rounded-xl border border-cyan-900/60">
            <span className="text-gray-400 block text-[10px]">Відсоткова ставка:</span>
            <strong className="text-yellow-300 text-xs font-['Fredoka']">+1% за кожну годину</strong>
          </div>
          <div className="bg-[#081522] p-2.5 rounded-xl border border-cyan-900/60">
            <span className="text-gray-400 block text-[10px]">Максимальний термін:</span>
            <strong className="text-cyan-200 text-xs font-['Fredoka']">до 24 годин (до +24%)</strong>
          </div>
          <div className="bg-[#081522] p-2.5 rounded-xl border border-cyan-900/60">
            <span className="text-gray-400 block text-[10px]">Мінімальний вклад:</span>
            <strong className="text-emerald-300 text-xs font-['Fredoka']">10,000 🪙</strong>
          </div>
        </div>
      </div>

      {/* 💵 Action Section 1: Поповнення вкладу */}
      <div className="bg-[#0e2133] rounded-3xl p-4 sm:p-5 border-2 border-teal-600/50 shadow-xl text-white flex flex-col gap-3.5">
        <div className="flex items-center justify-between">
          <h3 className="font-['Fredoka'] font-bold text-base text-emerald-200 flex items-center gap-2">
            <ArrowDownRight className="w-5 h-5 text-emerald-400" />
            Покласти гроші на вклад
          </h3>
          <span className="text-[11px] text-teal-300 font-semibold">
            Мін: 10,000 🪙
          </span>
        </div>

        {/* Quick Amount Buttons */}
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => handleDeposit(10000)}
            disabled={isLoading || balance < 10000}
            className={`py-2 px-2 rounded-xl text-xs font-['Fredoka'] font-bold border transition cursor-pointer ${
              balance >= 10000
                ? "bg-[#14324f] hover:bg-teal-700/50 text-teal-200 border-teal-500/50"
                : "bg-gray-800/40 text-gray-500 border-gray-700 cursor-not-allowed"
            }`}
          >
            +10,000 🪙
          </button>
          <button
            type="button"
            onClick={() => handleDeposit(100000)}
            disabled={isLoading || balance < 100000}
            className={`py-2 px-2 rounded-xl text-xs font-['Fredoka'] font-bold border transition cursor-pointer ${
              balance >= 100000
                ? "bg-[#14324f] hover:bg-teal-700/50 text-teal-200 border-teal-500/50"
                : "bg-gray-800/40 text-gray-500 border-gray-700 cursor-not-allowed"
            }`}
          >
            +100,000 🪙
          </button>
          <button
            type="button"
            onClick={() => handleDeposit(balance)}
            disabled={isLoading || balance < 10000}
            className={`py-2 px-2 rounded-xl text-xs font-['Fredoka'] font-bold border transition cursor-pointer ${
              balance >= 10000
                ? "bg-gradient-to-r from-teal-600 to-emerald-600 text-white border-teal-300 shadow"
                : "bg-gray-800/40 text-gray-500 border-gray-700 cursor-not-allowed"
            }`}
          >
            Покласти ВСЕ
          </button>
        </div>

        {/* Custom Input */}
        <div className="flex items-center gap-2">
          <input
            type="number"
            min="10000"
            max={balance}
            value={depositAmount}
            onChange={(e) => setDepositAmount(e.target.value)}
            className="flex-1 bg-[#081522] border border-teal-500/50 text-yellow-300 font-bold px-3.5 py-2.5 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-teal-300"
            placeholder="Сума від 10,000"
          />
          <button
            type="button"
            id="btn-bank-deposit-custom"
            onClick={() => handleDeposit(parseInt(depositAmount, 10) || 0)}
            disabled={isLoading || balance < 10000 || (parseInt(depositAmount, 10) || 0) < 10000 || (parseInt(depositAmount, 10) || 0) > balance}
            className={`px-4 py-2.5 rounded-xl font-['Fredoka'] font-bold text-xs shadow-md border flex items-center gap-1.5 transition-all ${
              balance >= 10000 && (parseInt(depositAmount, 10) || 0) >= 10000 && (parseInt(depositAmount, 10) || 0) <= balance
                ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 border-emerald-200 cursor-pointer active:scale-95"
                : "bg-gray-800 text-gray-500 border-gray-700 cursor-not-allowed"
            }`}
          >
            Внести
          </button>
        </div>
      </div>

      {/* 🏧 Action Section 2: Зняття вкладу з відсотками */}
      <div className="bg-[#0e2133] rounded-3xl p-4 sm:p-5 border-2 border-amber-600/50 shadow-xl text-white flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h3 className="font-['Fredoka'] font-bold text-base text-yellow-300 flex items-center gap-2">
            <ArrowUpRight className="w-5 h-5 text-amber-400" />
            Зняти вклад разом із прибутком (%)
          </h3>
          <span className="text-[10px] text-amber-300 font-bold bg-amber-950/80 px-2 py-0.5 rounded-lg border border-amber-700">
            Виплата на баланс
          </span>
        </div>

        <div className="bg-[#081522] p-3 rounded-2xl border border-amber-800/60 flex items-center justify-between">
          <div>
            <span className="text-xs text-gray-400 block">Разом до виплати:</span>
            <span className="font-['Fredoka'] font-black text-xl text-emerald-300">
              {(depositValue + accruedProfit).toLocaleString()} 🪙
            </span>
          </div>
          <div className="text-right">
            <span className="text-xs text-amber-300 font-semibold block">
              Тіло: {depositValue.toLocaleString()} 🪙
            </span>
            <span className="text-[10px] text-emerald-400 font-bold">
              +% прибутку: +{accruedProfit.toLocaleString()} 🪙
            </span>
          </div>
        </div>

        <button
          type="button"
          id="btn-bank-withdraw-full"
          onClick={handleWithdraw}
          disabled={isLoading || depositValue <= 0}
          className={`w-full py-3.5 rounded-2xl font-['Fredoka'] font-black text-sm shadow-xl border-2 flex items-center justify-center gap-2 transition-all ${
            depositValue > 0
              ? "bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-yellow-300 text-amber-950 border-yellow-200 cursor-pointer active:scale-95 shadow-[0_0_20px_rgba(234,179,8,0.3)]"
              : "bg-gray-800 text-gray-500 border-gray-700 cursor-not-allowed"
          }`}
        >
          <Coins className="w-4 h-4 text-amber-950" />
          {depositValue > 0
            ? `ЗНЯТИ ВСЕ (+${(depositValue + accruedProfit).toLocaleString()} 🪙)`
            : "ВКЛАД ПОРОЖНІЙ"}
        </button>
      </div>

      {/* 🔐 Bot Command Tip */}
      <div className="bg-[#081522]/90 rounded-2xl p-3 border border-cyan-900/60 text-center text-[11px] text-cyan-200/80">
        💡 У боті працюють ті самі команди: <code>Гусь банк</code> або <code>Гусь вклад</code>.
        Гроші, покладені тут чи в Telegram, миттєво синхронізуються!
      </div>
    </div>
  );
};
