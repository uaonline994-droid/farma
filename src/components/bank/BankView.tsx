import React, { useState } from "react";
import { useGameStore } from "../../store/gameStore";
import { triggerHaptic } from "../../services/telegram";
import {
  Landmark,
  PiggyBank,
  ShieldCheck,
  CreditCard,
  TrendingUp,
  ArrowDownRight,
  ArrowUpRight,
  Lock,
  Coins,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import confetti from "canvas-confetti";

export const BankView: React.FC<{
  onAction: (actionName: string, params?: Record<string, unknown>) => Promise<void>;
  isLoading?: boolean;
}> = ({ onAction, isLoading = false }) => {
  const { gameState } = useGameStore();

  const [activeTab, setActiveTab] = useState<"deposit" | "loan" | "safe">("deposit");
  const [depositAmount, setDepositAmount] = useState<string>("1000");
  const [withdrawAmount, setWithdrawAmount] = useState<string>("1000");
  const [loanAmount, setLoanAmount] = useState<string>("5000");
  const [repayAmount, setRepayAmount] = useState<string>("5000");
  const [safeDepositAmount, setSafeDepositAmount] = useState<string>("1000");
  const [safeWithdrawAmount, setSafeWithdrawAmount] = useState<string>("1000");

  if (!gameState) return null;

  const balance = gameState.economy.balance;
  const bank = gameState.economy.bank || {
    deposit: 0,
    deposit_rate: 8,
    loan: 0,
    loan_limit: (gameState.level.current * 20000) + 10000,
    safe_balance: 0,
    bonds: 0,
  };

  const maxLoanAvailable = Math.max(0, bank.loan_limit - bank.loan);

  const handleDeposit = async () => {
    const amt = parseInt(depositAmount, 10);
    if (!amt || amt <= 0 || amt > balance) return;
    triggerHaptic("medium");
    await onAction("bank_deposit", { amount: amt });
  };

  const handleWithdraw = async () => {
    const amt = parseInt(withdrawAmount, 10);
    if (!amt || amt <= 0 || amt > bank.deposit) return;
    triggerHaptic("medium");
    await onAction("bank_withdraw", { amount: amt });
  };

  const handleTakeLoan = async () => {
    const amt = parseInt(loanAmount, 10);
    if (!amt || amt <= 0 || amt > maxLoanAvailable) return;
    triggerHaptic("heavy");
    try {
      confetti({ particleCount: 40, spread: 60, origin: { y: 0.6 } });
    } catch {}
    await onAction("take_loan", { amount: amt });
  };

  const handleRepayLoan = async () => {
    const amt = parseInt(repayAmount, 10);
    if (!amt || amt <= 0 || amt > balance || amt > bank.loan) return;
    triggerHaptic("medium");
    await onAction("repay_loan", { amount: amt });
  };

  const handleSafeDeposit = async () => {
    const amt = parseInt(safeDepositAmount, 10);
    if (!amt || amt <= 0 || amt > balance) return;
    triggerHaptic("medium");
    await onAction("safe_deposit", { amount: amt });
  };

  const handleSafeWithdraw = async () => {
    const amt = parseInt(safeWithdrawAmount, 10);
    if (!amt || amt <= 0 || amt > bank.safe_balance) return;
    triggerHaptic("medium");
    await onAction("safe_withdraw", { amount: amt });
  };

  return (
    <div className="flex flex-col gap-4 pb-24 max-w-xl mx-auto px-3">
      {/* 🏦 Bank Header Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-3xl p-4 border-2 border-cyan-400/50 shadow-2xl relative overflow-hidden text-white">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border-2 border-cyan-300 flex items-center justify-center text-2xl shadow-inner">
              🏦
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-['Fredoka'] font-black text-xl text-cyan-200">
                  БАНК А-11
                </h1>
                <span className="bg-cyan-500/20 text-cyan-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-cyan-400/50">
                  ОФІЦІЙНИЙ
                </span>
              </div>
              <p className="text-xs text-cyan-100/80">
                Синхронізована фінансова система ферми
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-cyan-300 block uppercase font-bold tracking-wider">
              Готівка на руках
            </span>
            <span className="font-['Fredoka'] font-black text-lg text-yellow-300">
              {balance.toLocaleString()} ₴
            </span>
          </div>
        </div>

        {/* 📊 Summary Badges */}
        <div className="grid grid-cols-3 gap-2 mt-2 pt-2 border-t border-cyan-500/20 text-center">
          <div className="bg-blue-950/60 p-2 rounded-xl border border-cyan-500/30">
            <span className="text-[10px] text-cyan-300 font-semibold block">Депозит (+8%)</span>
            <span className="text-xs font-bold text-emerald-300">
              {bank.deposit.toLocaleString()} ₴
            </span>
          </div>
          <div className="bg-blue-950/60 p-2 rounded-xl border border-cyan-500/30">
            <span className="text-[10px] text-cyan-300 font-semibold block">Кредит</span>
            <span className="text-xs font-bold text-rose-300">
              {bank.loan.toLocaleString()} ₴
            </span>
          </div>
          <div className="bg-blue-950/60 p-2 rounded-xl border border-cyan-500/30">
            <span className="text-[10px] text-cyan-300 font-semibold block">Сейф А-11</span>
            <span className="text-xs font-bold text-amber-300">
              {bank.safe_balance.toLocaleString()} ₴
            </span>
          </div>
        </div>
      </div>

      {/* 🔘 Navigation Tabs */}
      <div className="flex bg-[#12232e] p-1.5 rounded-2xl border border-cyan-700/60 gap-1.5 shadow-lg">
        <button
          id="btn-tab-bank-deposit"
          onClick={() => {
            triggerHaptic("light");
            setActiveTab("deposit");
          }}
          className={`flex-1 py-2 rounded-xl font-['Fredoka'] font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeTab === "deposit"
              ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md border border-emerald-400"
              : "text-cyan-200 hover:text-white"
          }`}
        >
          <PiggyBank className="w-4 h-4" />
          Депозити (+8%)
        </button>

        <button
          id="btn-tab-bank-loan"
          onClick={() => {
            triggerHaptic("light");
            setActiveTab("loan");
          }}
          className={`flex-1 py-2 rounded-xl font-['Fredoka'] font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeTab === "loan"
              ? "bg-gradient-to-r from-rose-600 to-pink-600 text-white shadow-md border border-rose-400"
              : "text-cyan-200 hover:text-white"
          }`}
        >
          <CreditCard className="w-4 h-4" />
          Позики / Кредит
        </button>

        <button
          id="btn-tab-bank-safe"
          onClick={() => {
            triggerHaptic("light");
            setActiveTab("safe");
          }}
          className={`flex-1 py-2 rounded-xl font-['Fredoka'] font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeTab === "safe"
              ? "bg-gradient-to-r from-amber-500 to-yellow-500 text-amber-950 shadow-md border border-yellow-300"
              : "text-cyan-200 hover:text-white"
          }`}
        >
          <Lock className="w-4 h-4" />
          Сейф
        </button>
      </div>

      {/* 📈 TAB 1: DEPOSITS */}
      {activeTab === "deposit" && (
        <div className="bg-[#122433] rounded-3xl p-4 border-2 border-teal-600/50 shadow-xl text-white flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <TrendingUp className="w-6 h-6 text-emerald-400" />
              <div>
                <h3 className="font-['Fredoka'] font-bold text-base text-emerald-200">
                  Депозитний вклад "А-11 Інвест"
                </h3>
                <p className="text-[11px] text-teal-200/80">
                  Отримуйте +8% річного або щоденного доходу на залишок
                </p>
              </div>
            </div>
            <div className="bg-emerald-950/80 px-2.5 py-1 rounded-xl border border-emerald-500/50 text-right">
              <span className="text-[10px] text-emerald-300 block font-bold">Ставка</span>
              <span className="text-xs font-black text-yellow-300">8.0% / день</span>
            </div>
          </div>

          <div className="bg-[#0b1721] p-3.5 rounded-2xl border border-teal-800/60 flex items-center justify-between">
            <div>
              <span className="text-xs text-gray-400 block">Поточний депозит у банку:</span>
              <span className="font-['Fredoka'] font-black text-xl text-emerald-300">
                {bank.deposit.toLocaleString()} ₴
              </span>
            </div>
            <div className="text-right">
              <span className="text-[11px] text-teal-300 font-semibold block">
                +{(Math.round(bank.deposit * 0.08)).toLocaleString()} ₴
              </span>
              <span className="text-[10px] text-gray-400">прибуток щодня</span>
            </div>
          </div>

          {/* Deposit Form */}
          <div className="flex flex-col gap-3 pt-2 border-t border-teal-800/50">
            <h4 className="font-['Fredoka'] font-bold text-xs text-emerald-300 uppercase tracking-wider">
              Поповнення депозиту
            </h4>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="100"
                max={balance}
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                className="flex-1 bg-[#0b1721] border border-emerald-500/50 text-yellow-300 font-bold px-3 py-2 rounded-xl text-sm focus:outline-none focus:border-emerald-300"
                placeholder="Сума поповнення"
              />
              <button
                type="button"
                onClick={() => setDepositAmount(String(balance))}
                disabled={balance <= 0}
                className="px-3 py-2 bg-emerald-700/30 hover:bg-emerald-700/50 text-emerald-200 text-xs font-bold rounded-xl border border-emerald-500/50 transition-all cursor-pointer"
              >
                Все ({balance.toLocaleString()} ₴)
              </button>
            </div>

            <button
              id="btn-bank-deposit-confirm"
              onClick={handleDeposit}
              disabled={isLoading || balance <= 0 || parseInt(depositAmount, 10) <= 0 || parseInt(depositAmount, 10) > balance}
              className={`w-full py-2.5 rounded-xl font-['Fredoka'] font-bold text-xs shadow-md border flex items-center justify-center gap-1.5 transition-all ${
                balance > 0 && parseInt(depositAmount, 10) > 0 && parseInt(depositAmount, 10) <= balance
                  ? "bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 text-slate-950 border-emerald-200 cursor-pointer active:scale-95"
                  : "bg-gray-800 text-gray-500 border-gray-700 cursor-not-allowed"
              }`}
            >
              <ArrowDownRight className="w-4 h-4" />
              Покласти на депозит ({depositAmount} ₴)
            </button>
          </div>

          {/* Withdraw Form */}
          {bank.deposit > 0 && (
            <div className="flex flex-col gap-3 pt-2 border-t border-teal-800/50">
              <h4 className="font-['Fredoka'] font-bold text-xs text-amber-300 uppercase tracking-wider">
                Зняття з депозиту
              </h4>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  max={bank.deposit}
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  className="flex-1 bg-[#0b1721] border border-amber-500/50 text-yellow-300 font-bold px-3 py-2 rounded-xl text-sm focus:outline-none focus:border-amber-300"
                  placeholder="Сума зняття"
                />
                <button
                  type="button"
                  onClick={() => setWithdrawAmount(String(bank.deposit))}
                  className="px-3 py-2 bg-amber-700/30 hover:bg-amber-700/50 text-amber-200 text-xs font-bold rounded-xl border border-amber-500/50 transition-all cursor-pointer"
                >
                  Все ({bank.deposit.toLocaleString()} ₴)
                </button>
              </div>

              <button
                id="btn-bank-withdraw-confirm"
                onClick={handleWithdraw}
                disabled={isLoading || bank.deposit <= 0 || parseInt(withdrawAmount, 10) <= 0 || parseInt(withdrawAmount, 10) > bank.deposit}
                className={`w-full py-2.5 rounded-xl font-['Fredoka'] font-bold text-xs shadow-md border flex items-center justify-center gap-1.5 transition-all ${
                  bank.deposit > 0 && parseInt(withdrawAmount, 10) > 0 && parseInt(withdrawAmount, 10) <= bank.deposit
                    ? "bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 text-amber-950 border-yellow-200 cursor-pointer active:scale-95"
                    : "bg-gray-800 text-gray-500 border-gray-700 cursor-not-allowed"
                }`}
              >
                <ArrowUpRight className="w-4 h-4" />
                Зняти гроші на баланс ({withdrawAmount} ₴)
              </button>
            </div>
          )}
        </div>
      )}

      {/* 💳 TAB 2: LOANS & CREDIT */}
      {activeTab === "loan" && (
        <div className="bg-[#1e1526] rounded-3xl p-4 border-2 border-rose-600/50 shadow-xl text-white flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <CreditCard className="w-6 h-6 text-rose-400" />
              <div>
                <h3 className="font-['Fredoka'] font-bold text-base text-rose-200">
                  Кредитна лінія А-11
                </h3>
                <p className="text-[11px] text-rose-200/80">
                  Отримайте капітал для миттєвої закупівлі насіння чи тварин
                </p>
              </div>
            </div>
            <div className="bg-rose-950/80 px-2.5 py-1 rounded-xl border border-rose-500/50 text-right">
              <span className="text-[10px] text-rose-300 block font-bold">Ліміт кредиту</span>
              <span className="text-xs font-black text-rose-200">{bank.loan_limit.toLocaleString()} ₴</span>
            </div>
          </div>

          <div className="bg-[#120a17] p-3.5 rounded-2xl border border-rose-900/60 flex items-center justify-between">
            <div>
              <span className="text-xs text-gray-400 block">Поточний борг банку:</span>
              <span className="font-['Fredoka'] font-black text-xl text-rose-400">
                {bank.loan.toLocaleString()} ₴
              </span>
            </div>
            <div className="text-right">
              <span className="text-xs text-emerald-300 font-bold block">
                {maxLoanAvailable.toLocaleString()} ₴
              </span>
              <span className="text-[10px] text-gray-400">доступно для взяття</span>
            </div>
          </div>

          {/* Take Loan Form */}
          <div className="flex flex-col gap-3 pt-2 border-t border-rose-800/50">
            <h4 className="font-['Fredoka'] font-bold text-xs text-rose-300 uppercase tracking-wider">
              Взяти кредит
            </h4>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="500"
                max={maxLoanAvailable}
                value={loanAmount}
                onChange={(e) => setLoanAmount(e.target.value)}
                className="flex-1 bg-[#120a17] border border-rose-500/50 text-rose-200 font-bold px-3 py-2 rounded-xl text-sm focus:outline-none focus:border-rose-300"
                placeholder="Сума кредиту"
              />
              <button
                type="button"
                onClick={() => setLoanAmount(String(maxLoanAvailable))}
                disabled={maxLoanAvailable <= 0}
                className="px-3 py-2 bg-rose-700/30 hover:bg-rose-700/50 text-rose-200 text-xs font-bold rounded-xl border border-rose-500/50 transition-all cursor-pointer"
              >
                Макс ({maxLoanAvailable.toLocaleString()} ₴)
              </button>
            </div>

            <button
              id="btn-take-loan-confirm"
              onClick={handleTakeLoan}
              disabled={isLoading || maxLoanAvailable <= 0 || parseInt(loanAmount, 10) <= 0 || parseInt(loanAmount, 10) > maxLoanAvailable}
              className={`w-full py-2.5 rounded-xl font-['Fredoka'] font-bold text-xs shadow-md border flex items-center justify-center gap-1.5 transition-all ${
                maxLoanAvailable > 0 && parseInt(loanAmount, 10) > 0 && parseInt(loanAmount, 10) <= maxLoanAvailable
                  ? "bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 text-white border-rose-300 cursor-pointer active:scale-95"
                  : "bg-gray-800 text-gray-500 border-gray-700 cursor-not-allowed"
              }`}
            >
              <Coins className="w-4 h-4 text-yellow-300" />
              Отримати кредит на баланс (+{loanAmount} ₴)
            </button>
          </div>

          {/* Repay Loan Form */}
          {bank.loan > 0 && (
            <div className="flex flex-col gap-3 pt-2 border-t border-rose-800/50">
              <h4 className="font-['Fredoka'] font-bold text-xs text-emerald-300 uppercase tracking-wider">
                Погасити кредит
              </h4>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  max={Math.min(balance, bank.loan)}
                  value={repayAmount}
                  onChange={(e) => setRepayAmount(e.target.value)}
                  className="flex-1 bg-[#120a17] border border-emerald-500/50 text-emerald-200 font-bold px-3 py-2 rounded-xl text-sm focus:outline-none focus:border-emerald-300"
                  placeholder="Сума погашення"
                />
                <button
                  type="button"
                  onClick={() => setRepayAmount(String(Math.min(balance, bank.loan)))}
                  className="px-3 py-2 bg-emerald-700/30 hover:bg-emerald-700/50 text-emerald-200 text-xs font-bold rounded-xl border border-emerald-500/50 transition-all cursor-pointer"
                >
                  Все ({Math.min(balance, bank.loan).toLocaleString()} ₴)
                </button>
              </div>

              <button
                id="btn-repay-loan-confirm"
                onClick={handleRepayLoan}
                disabled={isLoading || balance <= 0 || parseInt(repayAmount, 10) <= 0 || parseInt(repayAmount, 10) > balance}
                className={`w-full py-2.5 rounded-xl font-['Fredoka'] font-bold text-xs shadow-md border flex items-center justify-center gap-1.5 transition-all ${
                  balance > 0 && parseInt(repayAmount, 10) > 0 && parseInt(repayAmount, 10) <= balance
                    ? "bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 text-slate-950 border-emerald-300 cursor-pointer active:scale-95"
                    : "bg-gray-800 text-gray-500 border-gray-700 cursor-not-allowed"
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                Погасити борг (-{repayAmount} ₴)
              </button>
            </div>
          )}
        </div>
      )}

      {/* 🔒 TAB 3: SAFE */}
      {activeTab === "safe" && (
        <div className="bg-[#1f2015] rounded-3xl p-4 border-2 border-yellow-500/50 shadow-xl text-white flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-6 h-6 text-yellow-400" />
              <div>
                <h3 className="font-['Fredoka'] font-bold text-base text-yellow-200">
                  Броньований Сейф А-11
                </h3>
                <p className="text-[11px] text-amber-200/80">
                  Захищене сховище: гроші в сейфі неможливо програти в казино
                </p>
              </div>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-yellow-500/20 border border-yellow-400/50 flex items-center justify-center text-xl">
              🔐
            </div>
          </div>

          <div className="bg-[#12140a] p-3.5 rounded-2xl border border-yellow-800/60 flex items-center justify-between">
            <div>
              <span className="text-xs text-gray-400 block">Залишок у сейфі:</span>
              <span className="font-['Fredoka'] font-black text-2xl text-yellow-300">
                {bank.safe_balance.toLocaleString()} ₴
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-yellow-400 font-bold bg-yellow-950/80 px-2 py-1 rounded-lg border border-yellow-700/60">
                100% Захист
              </span>
            </div>
          </div>

          {/* Safe Deposit */}
          <div className="flex flex-col gap-3 pt-2 border-t border-yellow-800/50">
            <h4 className="font-['Fredoka'] font-bold text-xs text-yellow-300 uppercase tracking-wider">
              Заховати гроші в сейф
            </h4>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="100"
                max={balance}
                value={safeDepositAmount}
                onChange={(e) => setSafeDepositAmount(e.target.value)}
                className="flex-1 bg-[#12140a] border border-yellow-500/50 text-yellow-200 font-bold px-3 py-2 rounded-xl text-sm focus:outline-none focus:border-yellow-300"
                placeholder="Сума"
              />
              <button
                type="button"
                onClick={() => setSafeDepositAmount(String(balance))}
                disabled={balance <= 0}
                className="px-3 py-2 bg-yellow-700/30 hover:bg-yellow-700/50 text-yellow-200 text-xs font-bold rounded-xl border border-yellow-500/50 transition-all cursor-pointer"
              >
                Все ({balance.toLocaleString()} ₴)
              </button>
            </div>

            <button
              id="btn-safe-deposit-confirm"
              onClick={handleSafeDeposit}
              disabled={isLoading || balance <= 0 || parseInt(safeDepositAmount, 10) <= 0 || parseInt(safeDepositAmount, 10) > balance}
              className={`w-full py-2.5 rounded-xl font-['Fredoka'] font-bold text-xs shadow-md border flex items-center justify-center gap-1.5 transition-all ${
                balance > 0 && parseInt(safeDepositAmount, 10) > 0 && parseInt(safeDepositAmount, 10) <= balance
                  ? "bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 text-amber-950 border-yellow-200 cursor-pointer active:scale-95"
                  : "bg-gray-800 text-gray-500 border-gray-700 cursor-not-allowed"
              }`}
            >
              <Lock className="w-4 h-4" />
              Покласти в сейф ({safeDepositAmount} ₴)
            </button>
          </div>

          {/* Safe Withdraw */}
          {bank.safe_balance > 0 && (
            <div className="flex flex-col gap-3 pt-2 border-t border-yellow-800/50">
              <h4 className="font-['Fredoka'] font-bold text-xs text-emerald-300 uppercase tracking-wider">
                Забрати гроші із сейфу
              </h4>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  max={bank.safe_balance}
                  value={safeWithdrawAmount}
                  onChange={(e) => setSafeWithdrawAmount(e.target.value)}
                  className="flex-1 bg-[#12140a] border border-emerald-500/50 text-yellow-300 font-bold px-3 py-2 rounded-xl text-sm focus:outline-none focus:border-emerald-300"
                  placeholder="Сума"
                />
                <button
                  type="button"
                  onClick={() => setSafeWithdrawAmount(String(bank.safe_balance))}
                  className="px-3 py-2 bg-emerald-700/30 hover:bg-emerald-700/50 text-emerald-200 text-xs font-bold rounded-xl border border-emerald-500/50 transition-all cursor-pointer"
                >
                  Все ({bank.safe_balance.toLocaleString()} ₴)
                </button>
              </div>

              <button
                id="btn-safe-withdraw-confirm"
                onClick={handleSafeWithdraw}
                disabled={isLoading || bank.safe_balance <= 0 || parseInt(safeWithdrawAmount, 10) <= 0 || parseInt(safeWithdrawAmount, 10) > bank.safe_balance}
                className={`w-full py-2.5 rounded-xl font-['Fredoka'] font-bold text-xs shadow-md border flex items-center justify-center gap-1.5 transition-all ${
                  bank.safe_balance > 0 && parseInt(safeWithdrawAmount, 10) > 0 && parseInt(safeWithdrawAmount, 10) <= bank.safe_balance
                    ? "bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 text-slate-950 border-emerald-200 cursor-pointer active:scale-95"
                    : "bg-gray-800 text-gray-500 border-gray-700 cursor-not-allowed"
                }`}
              >
                <ArrowUpRight className="w-4 h-4" />
                Витягнути із сейфу на баланс ({safeWithdrawAmount} ₴)
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
