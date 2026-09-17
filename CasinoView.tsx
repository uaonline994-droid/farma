import React, { useState, useRef } from "react";
import { useGameStore } from "../../store/gameStore";
import { triggerHaptic } from "../../services/telegram";
import {
  playLeverPullSound,
  playSpinTick,
  playWinSmallSound,
  playWinBigSound,
  playLoseSound,
  playChipSound,
} from "../../services/sound";
import { Sparkles, Trophy, Info } from "lucide-react";
import confetti from "canvas-confetti";
import { motion } from "motion/react";

// Classic Mini 3-Reel Slot Symbols (Rebalanced Economy)
// 3 reels: [ Reel 1 | Reel 2 | Reel 3 ]
export interface MiniSymbol {
  icon: string;
  name: string;
  multiplier3: number; // payout for 3 identical symbols
  weight: number;      // realistic weight for balanced economy
}

export const MINI_SYMBOLS: MiniSymbol[] = [
  { icon: "7️⃣", name: "Три Сімки 777", multiplier3: 15, weight: 6 },
  { icon: "💎", name: "Діамант", multiplier3: 10, weight: 10 },
  { icon: "👑", name: "Корона", multiplier3: 6, weight: 16 },
  { icon: "🔔", name: "Дзвіночок", multiplier3: 4, weight: 24 },
  { icon: "🍀", name: "Конюшина", multiplier3: 3, weight: 32 },
  { icon: "🍒", name: "Вишеньки", multiplier3: 2, weight: 45 },
  { icon: "🍋", name: "Лимон", multiplier3: 1.5, weight: 55 },
];

const PRESET_BETS = [50, 100, 250, 500, 1000, 2500];

export const CasinoView: React.FC<{
  onAction: (actionName: string, params?: Record<string, unknown>) => Promise<void>;
  isLoading?: boolean;
}> = ({ onAction, isLoading = false }) => {
  const { gameState } = useGameStore();
  const balance = gameState?.economy.balance ?? 0;

  // Classic 3-reel single payline slot
  const [reels, setReels] = useState<string[]>(["7️⃣", "🍒", "7️⃣"]);
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [spinningReel, setSpinningReel] = useState<boolean[]>([false, false, false]);
  const [bet, setBet] = useState<number>(100);
  const [customBetInput, setCustomBetInput] = useState<string>("100");
  const [lastResult, setLastResult] = useState<{
    win: number;
    message: string;
    isWin: boolean;
  } | null>(null);
  const [showPaytable, setShowPaytable] = useState<boolean>(false);

  const getRandomSymbol = (): MiniSymbol => {
    const totalWeight = MINI_SYMBOLS.reduce((sum, s) => sum + s.weight, 0);
    let rand = Math.random() * totalWeight;
    for (const sym of MINI_SYMBOLS) {
      if (rand < sym.weight) return sym;
      rand -= sym.weight;
    }
    return MINI_SYMBOLS[MINI_SYMBOLS.length - 1];
  };

  const handleBetSelect = (amount: number) => {
    if (isSpinning) return;
    triggerHaptic("light");
    playChipSound();
    setBet(amount);
    setCustomBetInput(String(amount));
  };

  const handleCustomBet = (val: string) => {
    setCustomBetInput(val);
    const num = parseInt(val, 10);
    if (!isNaN(num) && num > 0) {
      // Max bet cap 5,000 to protect economy
      setBet(Math.min(5000, num));
    }
  };

  const spin = async () => {
    if (isSpinning || isLoading) return;

    if (balance < bet) {
      triggerHaptic("warning");
      playLoseSound();
      setLastResult({
        win: 0,
        message: "❌ Недостатньо 🪙 на балансі!",
        isWin: false,
      });
      return;
    }

    setIsSpinning(true);
    setLastResult(null);
    triggerHaptic("heavy");
    playLeverPullSound();

    // Pick 3 random symbols according to probability weights
    const sym1 = getRandomSymbol();
    const sym2 = getRandomSymbol();
    const sym3 = getRandomSymbol();
    const finalReels = [sym1.icon, sym2.icon, sym3.icon];

    // Start reel animations
    setSpinningReel([true, true, true]);

    const tickInterval = setInterval(() => {
      playSpinTick();
    }, 150);

    // Staggered reel stops (800ms, 1200ms, 1600ms)
    setTimeout(() => {
      setReels((prev) => [finalReels[0], prev[1], prev[2]]);
      setSpinningReel([false, true, true]);
      triggerHaptic("medium");
    }, 750);

    setTimeout(() => {
      setReels((prev) => [prev[0], finalReels[1], prev[2]]);
      setSpinningReel([false, false, true]);
      triggerHaptic("medium");
    }, 1200);

    setTimeout(async () => {
      clearInterval(tickInterval);
      setReels(finalReels);
      setSpinningReel([false, false, false]);
      setIsSpinning(false);

      // Payout evaluation (Balanced Economy)
      let win = 0;
      let msg = "";

      // 3 identical symbols
      if (sym1.icon === sym2.icon && sym2.icon === sym3.icon) {
        win = Math.round(bet * sym1.multiplier3);
        msg = `🎉 ДЖЕКПОТ 3× [${sym1.name}]! +${win.toLocaleString()} 🪙!`;
      }
      // 2 identical symbols (small consolation prize 0.5x bet)
      else if (sym1.icon === sym2.icon || sym2.icon === sym3.icon || sym1.icon === sym3.icon) {
        const matchIcon = sym1.icon === sym2.icon ? sym1.icon : sym3.icon;
        if (matchIcon === "🍒" || matchIcon === "7️⃣") {
          win = Math.round(bet * 0.5);
          msg = `✨ Пара [${matchIcon}]! Повернення +${win.toLocaleString()} 🪙`;
        } else {
          msg = `Спробуйте ще! Ставка: ${bet.toLocaleString()} 🪙`;
        }
      } else {
        msg = `Спробуйте ще! Ставка: ${bet.toLocaleString()} 🪙`;
      }

      if (win > 0) {
        triggerHaptic("heavy");
        if (win >= bet * 5) {
          playWinBigSound();
          try {
            confetti({
              particleCount: 60,
              spread: 60,
              origin: { y: 0.6 },
            });
          } catch {}
        } else {
          playWinSmallSound();
        }
      } else {
        playLoseSound();
      }

      setLastResult({
        win,
        message: msg,
        isWin: win > 0,
      });

      // Send action to server/bot backend
      try {
        await onAction("casino", { bet, win });
      } catch (err) {
        console.error("Casino sync error:", err);
      }
    }, 1650);
  };

  return (
    <div className="flex flex-col gap-4 pb-24 max-w-md mx-auto px-3 font-['Nunito'] select-none">
      {/* Mini Casino Header */}
      <div className="bg-gradient-to-r from-[#240b0b] to-[#140606] rounded-3xl p-4 border-2 border-yellow-600/60 shadow-xl text-yellow-100 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-yellow-400 to-amber-600 flex items-center justify-center text-xl shadow-md border border-yellow-200 text-yellow-950 font-black">
            🎰
          </div>
          <div>
            <h2 className="font-['Fredoka'] font-black text-lg text-yellow-300 leading-tight">
              Класичний Слот 777
            </h2>
            <span className="text-xs text-yellow-200/70">
              Баланс: <strong className="text-emerald-400">{balance.toLocaleString()} 🪙</strong>
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowPaytable(!showPaytable)}
          className="p-2 bg-yellow-900/40 hover:bg-yellow-800/60 text-yellow-300 border border-yellow-600/50 rounded-xl transition cursor-pointer text-xs flex items-center gap-1 font-bold"
        >
          <Info className="w-3.5 h-3.5" />
          {showPaytable ? "Приховати" : "Виплати"}
        </button>
      </div>

      {/* 🎰 Classic 3-Reel Machine Display */}
      <div className="bg-[#1b0707] rounded-3xl p-5 border-3 border-yellow-500/70 shadow-[0_0_30px_rgba(234,179,8,0.25)] flex flex-col items-center relative overflow-hidden">
        {/* Top Lights Bar */}
        <div className="flex items-center justify-between w-full mb-3 px-2">
          <div className="flex gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 animate-pulse" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          </div>
          <div className="font-['Fredoka'] font-black text-xs text-yellow-400 tracking-wider">
            ★ MINI SLOTS ★
          </div>
          <div className="flex gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 animate-pulse" />
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
          </div>
        </div>

        {/* The 3 Slot Windows */}
        <div className="grid grid-cols-3 gap-3 w-full bg-[#0d0303] p-3 rounded-2xl border-2 border-yellow-600/60 shadow-inner">
          {reels.map((symbol, idx) => (
            <div
              key={idx}
              className="h-24 sm:h-28 bg-gradient-to-b from-[#1f0909] via-[#2f1010] to-[#1a0707] rounded-xl border border-yellow-500/50 flex items-center justify-center overflow-hidden relative shadow-md"
            >
              {/* Glass glare effect */}
              <div className="absolute inset-x-0 top-0 h-6 bg-gradient-to-b from-white/15 to-transparent pointer-events-none" />

              <motion.div
                animate={
                  spinningReel[idx]
                    ? {
                        y: [-20, 20, -20],
                        filter: ["blur(2px)", "blur(4px)", "blur(2px)"],
                      }
                    : { y: 0, filter: "blur(0px)" }
                }
                transition={
                  spinningReel[idx]
                    ? { repeat: Infinity, duration: 0.12 }
                    : { type: "spring", stiffness: 400, damping: 20 }
                }
                className="text-4xl sm:text-5xl select-none"
              >
                {spinningReel[idx] ? "🎲" : symbol}
              </motion.div>
            </div>
          ))}
        </div>

        {/* Win / Status Display */}
        <div className="w-full mt-3 py-2 px-3 bg-[#0a0202] rounded-xl border border-yellow-700/40 text-center min-h-[42px] flex items-center justify-center">
          {lastResult ? (
            <span
              className={`font-['Fredoka'] font-bold text-xs sm:text-sm ${
                lastResult.isWin ? "text-yellow-300 animate-bounce" : "text-gray-400"
              }`}
            >
              {lastResult.message}
            </span>
          ) : (
            <span className="font-['Fredoka'] text-xs text-yellow-200/60">
              Натисніть «КРУТИТИ» для гри
            </span>
          )}
        </div>
      </div>

      {/* 💰 Bet Controls */}
      <div className="bg-[#1a0707] rounded-3xl p-4 border-2 border-yellow-600/50 shadow-lg flex flex-col gap-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-['Fredoka'] font-bold text-yellow-200 uppercase">
            Ставка (макс 5,000 🪙)
          </span>
          <span className="text-amber-300 font-bold">
            Вибрано: <b>{bet.toLocaleString()} 🪙</b>
          </span>
        </div>

        {/* Preset Chips */}
        <div className="grid grid-cols-6 gap-1.5">
          {PRESET_BETS.map((amt) => (
            <button
              key={amt}
              type="button"
              onClick={() => handleBetSelect(amt)}
              disabled={isSpinning}
              className={`py-2 rounded-xl font-['Fredoka'] font-bold text-xs border transition cursor-pointer ${
                bet === amt
                  ? "bg-gradient-to-b from-yellow-400 to-amber-500 text-yellow-950 border-yellow-200 shadow-md scale-105"
                  : "bg-[#2c0e0e] text-yellow-200/80 border-yellow-900/60 hover:bg-[#3d1515]"
              }`}
            >
              {amt >= 1000 ? `${amt / 1000}k` : amt}
            </button>
          ))}
        </div>

        {/* Custom Input */}
        <div className="flex items-center gap-2">
          <input
            type="number"
            min="10"
            max="5000"
            value={customBetInput}
            onChange={(e) => handleCustomBet(e.target.value)}
            disabled={isSpinning}
            className="flex-1 bg-[#0b0303] border border-yellow-600/50 text-yellow-300 font-bold px-3 py-2 rounded-xl text-xs focus:outline-none focus:border-yellow-400"
            placeholder="Введіть ставку"
          />
          <button
            type="button"
            onClick={() => handleBetSelect(Math.min(5000, Math.max(10, balance)))}
            disabled={isSpinning || balance <= 0}
            className="px-3 py-2 bg-yellow-900/40 hover:bg-yellow-800/60 text-yellow-300 text-xs font-bold rounded-xl border border-yellow-600/50 cursor-pointer"
          >
            Макс (5k)
          </button>
        </div>

        {/* Spin Button */}
        <button
          type="button"
          id="btn-mini-casino-spin"
          onClick={spin}
          disabled={isSpinning || isLoading || balance < bet}
          className={`w-full py-3.5 rounded-2xl font-['Fredoka'] font-black text-base shadow-xl border-2 flex items-center justify-center gap-2 transition-all ${
            balance >= bet && !isSpinning
              ? "bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500 hover:from-yellow-300 text-amber-950 border-yellow-200 shadow-[0_0_20px_rgba(234,179,8,0.4)] cursor-pointer active:scale-95"
              : "bg-gray-800 text-gray-500 border-gray-700 cursor-not-allowed"
          }`}
        >
          <Sparkles className="w-5 h-5 text-amber-950" />
          {isSpinning ? "КРУТИТЬСЯ..." : `КРУТИТИ (${bet.toLocaleString()} 🪙)`}
        </button>
      </div>

      {/* Paytable Modal / Dropdown */}
      {showPaytable && (
        <div className="bg-[#1a0707] rounded-3xl p-4 border-2 border-yellow-600/50 shadow-xl text-xs text-yellow-100 flex flex-col gap-2.5">
          <div className="flex items-center justify-between border-b border-yellow-900/50 pb-2">
            <span className="font-['Fredoka'] font-bold text-sm text-yellow-300">
              Таблиця виплат (3 в ряд)
            </span>
            <span className="text-[10px] text-yellow-400/70">Збалансована економіка</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {MINI_SYMBOLS.map((s) => (
              <div
                key={s.icon}
                className="bg-[#0e0303] p-2 rounded-xl border border-yellow-900/40 flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <span className="text-xl">{s.icon}</span>
                  <span className="font-semibold text-yellow-200">{s.name}</span>
                </div>
                <span className="font-['Fredoka'] font-bold text-amber-300">
                  ×{s.multiplier3}
                </span>
              </div>
            ))}
          </div>

          <div className="text-[11px] text-yellow-300/70 bg-yellow-950/30 p-2 rounded-xl border border-yellow-700/30 text-center">
            💡 Ставки та виплати оптимізовані, щоб не ламати економіку бота та ферми.
          </div>
        </div>
      )}
    </div>
  );
};
