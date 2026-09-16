import React, { useState, useEffect, useRef } from "react";
import { useGameStore } from "../../store/gameStore";
import { triggerHaptic } from "../../services/telegram";
import {
  playLeverPullSound,
  playSpinTick,
  playReelStop,
  playWinSmallSound,
  playWinBigSound,
  playJackpotFanfare,
  playLoseSound,
  playChipSound,
} from "../../services/sound";
import {
  Coins,
  Sparkles,
  Volume2,
  VolumeX,
  RotateCcw,
  Trophy,
  Info,
  Flame,
  Zap,
  Play,
  Square,
  Bomb,
  Stars,
  Sparkle,
} from "lucide-react";
import confetti from "canvas-confetti";
import { motion, AnimatePresence } from "motion/react";

// 🍬 Candy Utopia (Sweet Bonanza Style) Cascading 6x5 Grid Slot Symbols
export interface CandySymbol {
  id: string;
  name: string;
  icon: string;
  type: "low" | "high" | "scatter" | "multiplier";
  payout8_9: number; // 8-9 matching symbols anywhere on grid
  payout10_11: number; // 10-11 matching symbols
  payout12_plus: number; // 12+ matching symbols
  color: string;
  glow: string;
  multiplierVal?: number;
}

export const CANDY_SYMBOLS: CandySymbol[] = [
  // Низькі символи (Фрукти в сиропі)
  {
    id: "banana",
    name: "Банан у карамелі",
    icon: "🍌",
    type: "low",
    payout8_9: 0.5,
    payout10_11: 1.0,
    payout12_plus: 2.0,
    color: "#facc15",
    glow: "rgba(250, 204, 21, 0.6)",
  },
  {
    id: "grapes",
    name: "Желейний виноград",
    icon: "🍇",
    type: "low",
    payout8_9: 0.8,
    payout10_11: 1.5,
    payout12_plus: 4.0,
    color: "#c084fc",
    glow: "rgba(192, 132, 252, 0.6)",
  },
  {
    id: "watermelon",
    name: "Цукровий кавун",
    icon: "🍉",
    type: "low",
    payout8_9: 1.0,
    payout10_11: 2.0,
    payout12_plus: 5.0,
    color: "#4ade80",
    glow: "rgba(74, 222, 128, 0.6)",
  },
  {
    id: "plum",
    name: "Глянцева слива",
    icon: "🫐",
    type: "low",
    payout8_9: 1.5,
    payout10_11: 3.0,
    payout12_plus: 8.0,
    color: "#60a5fa",
    glow: "rgba(96, 165, 250, 0.6)",
  },
  {
    id: "apple",
    name: "Карамельне яблуко",
    icon: "🍏",
    type: "low",
    payout8_9: 2.0,
    payout10_11: 5.0,
    payout12_plus: 10.0,
    color: "#a3e635",
    glow: "rgba(163, 230, 53, 0.6)",
  },

  // Високі символи (Коштовні льодяники-самоцвіти)
  {
    id: "blue_square",
    name: "Синій квадрат",
    icon: "🔷",
    type: "high",
    payout8_9: 3.0,
    payout10_11: 8.0,
    payout12_plus: 15.0,
    color: "#38bdf8",
    glow: "rgba(56, 189, 248, 0.8)",
  },
  {
    id: "green_hex",
    name: "Смарагдовий шестигранник",
    icon: "🟢",
    type: "high",
    payout8_9: 4.0,
    payout10_11: 10.0,
    payout12_plus: 20.0,
    color: "#34d399",
    glow: "rgba(52, 211, 153, 0.8)",
  },
  {
    id: "purple_diamond",
    name: "Фіолетовий діамант",
    icon: "🔮",
    type: "high",
    payout8_9: 5.0,
    payout10_11: 15.0,
    payout12_plus: 30.0,
    color: "#e879f9",
    glow: "rgba(232, 121, 249, 0.8)",
  },
  {
    id: "red_heart",
    name: "Рубінове серце",
    icon: "❤️",
    type: "high",
    payout8_9: 10.0,
    payout10_11: 25.0,
    payout12_plus: 50.0,
    color: "#f43f5e",
    glow: "rgba(244, 63, 94, 0.9)",
  },

  // Спеціальні символи
  {
    id: "scatter_lollipop",
    name: "Скаттер Льодяник",
    icon: "🍭",
    type: "scatter",
    payout8_9: 3.0,
    payout10_11: 5.0,
    payout12_plus: 100.0,
    color: "#fb7185",
    glow: "rgba(251, 113, 133, 1)",
  },
  {
    id: "multiplier_bomb",
    name: "Цукрова Бомба",
    icon: "💣",
    type: "multiplier",
    payout8_9: 0,
    payout10_11: 0,
    payout12_plus: 0,
    color: "#f59e0b",
    glow: "rgba(245, 158, 11, 1)",
    multiplierVal: 10,
  },
];

const WEIGHTED_CANDIES = [
  "banana", "banana", "banana", "banana",
  "grapes", "grapes", "grapes",
  "watermelon", "watermelon", "watermelon",
  "plum", "plum",
  "apple", "apple",
  "blue_square", "blue_square",
  "green_hex", "green_hex",
  "purple_diamond",
  "red_heart",
  "scatter_lollipop",
  "multiplier_bomb",
];

const QUICK_BETS = [50, 100, 250, 500, 1000, 2500, 5000];

// Grid dimensions: 6 columns x 5 rows = 30 cells
const COLS = 6;
const ROWS = 5;
const TOTAL_CELLS = COLS * ROWS;

export const CasinoView: React.FC<{
  onAction?: (actionName: string, params?: Record<string, unknown>) => Promise<void>;
  isLoading?: boolean;
}> = ({ onAction }) => {
  const { gameState, setGameState, soundEnabled, toggleSound, triggerCoinAnimation, addToast } = useGameStore();

  const balance = gameState?.economy.balance ?? 0;

  const [bet, setBet] = useState<number>(100);
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [grid, setGrid] = useState<CandySymbol[]>(() =>
    Array.from({ length: TOTAL_CELLS }, () => {
      const randomId = WEIGHTED_CANDIES[Math.floor(Math.random() * WEIGHTED_CANDIES.length)];
      return CANDY_SYMBOLS.find((s) => s.id === randomId) || CANDY_SYMBOLS[0];
    })
  );

  const [winningCellIndices, setWinningCellIndices] = useState<number[]>([]);
  const [activeBombs, setActiveBombs] = useState<number[]>([]);
  const [totalMultiplier, setTotalMultiplier] = useState<number>(1);
  const [roundWin, setRoundWin] = useState<number>(0);
  const [tumbleStep, setTumbleStep] = useState<number>(0);
  const [isFreeSpinsMode, setIsFreeSpinsMode] = useState<boolean>(false);
  const [freeSpinsLeft, setFreeSpinsLeft] = useState<number>(0);
  const [winTitle, setWinTitle] = useState<string | null>(null);
  const [showPaytable, setShowPaytable] = useState<boolean>(false);

  // Progressive Agro Jackpot pool
  const [jackpotPool, setJackpotPool] = useState<number>(92500);

  const soundRef = useRef(soundEnabled);
  soundRef.current = soundEnabled;

  // Slowly increment progressive pool
  useEffect(() => {
    const timer = setInterval(() => {
      setJackpotPool((prev) => prev + Math.floor(Math.random() * 6) + 1);
    }, 2800);
    return () => clearInterval(timer);
  }, []);

  const getRandomCandy = (): CandySymbol => {
    const randomId = WEIGHTED_CANDIES[Math.floor(Math.random() * WEIGHTED_CANDIES.length)];
    const symbol = CANDY_SYMBOLS.find((s) => s.id === randomId) || CANDY_SYMBOLS[0];
    if (symbol.id === "multiplier_bomb") {
      const multOptions = [2, 3, 5, 10, 25, 50, 100];
      const val = multOptions[Math.floor(Math.random() * multOptions.length)];
      return { ...symbol, multiplierVal: val };
    }
    return symbol;
  };

  const handleBetChange = (newBet: number) => {
    if (isSpinning) return;
    triggerHaptic("light");
    if (soundRef.current) playChipSound();
    const safeBet = Math.max(10, Math.min(balance || 100000, newBet));
    setBet(safeBet);
  };

  // Evaluate cascading win on any 6x5 grid (Scatter-Pays mechanism: 8+ matching anywhere)
  const evaluateGrid = (currentGrid: CandySymbol[], currentBet: number) => {
    const counts: Record<string, number> = {};
    currentGrid.forEach((item) => {
      counts[item.id] = (counts[item.id] || 0) + 1;
    });

    let baseWin = 0;
    const winningIds: string[] = [];
    let scatterCount = counts["scatter_lollipop"] || 0;
    let multiplierBombsSum = 0;

    // Multiplier bombs on field
    currentGrid.forEach((item) => {
      if (item.id === "multiplier_bomb" && item.multiplierVal) {
        multiplierBombsSum += item.multiplierVal;
      }
    });

    Object.entries(counts).forEach(([id, count]) => {
      const sym = CANDY_SYMBOLS.find((s) => s.id === id);
      if (!sym) return;

      if (sym.type === "scatter" && count >= 4) {
        winningIds.push(id);
        if (count >= 6) baseWin += currentBet * 100;
        else if (count === 5) baseWin += currentBet * 5;
        else baseWin += currentBet * 3;
      } else if (sym.type !== "scatter" && sym.type !== "multiplier" && count >= 8) {
        winningIds.push(id);
        if (count >= 12) {
          baseWin += currentBet * sym.payout12_plus;
        } else if (count >= 10) {
          baseWin += currentBet * sym.payout10_11;
        } else {
          baseWin += currentBet * sym.payout8_9;
        }
      }
    });

    const winningIndices: number[] = [];
    currentGrid.forEach((item, index) => {
      if (winningIds.includes(item.id)) {
        winningIndices.push(index);
      }
    });

    return {
      baseWin,
      multiplier: multiplierBombsSum > 0 ? multiplierBombsSum : 1,
      totalWin: Math.round(baseWin * (multiplierBombsSum > 0 ? multiplierBombsSum : 1)),
      winningIndices,
      hasScatters: scatterCount >= 4,
      scatterCount,
    };
  };

  // Main Spin & Cascade Routine
  const handleSpin = async () => {
    if (isSpinning) return;
    if (balance < bet && !isFreeSpinsMode) {
      triggerHaptic("warning");
      addToast("Недостатньо монет для ставки в Candy Utopia!", "warning");
      return;
    }

    setIsSpinning(true);
    setWinningCellIndices([]);
    setRoundWin(0);
    setWinTitle(null);
    setTumbleStep(0);

    triggerHaptic("heavy");
    if (soundRef.current) playLeverPullSound();

    // 1. Deduct bet from local state
    if (!isFreeSpinsMode && gameState) {
      setGameState({
        ...gameState,
        economy: {
          ...gameState.economy,
          balance: gameState.economy.balance - bet,
        },
      });
    }

    // 2. Initial Drop of new symbols (6x5)
    let newGrid = Array.from({ length: TOTAL_CELLS }, () => getRandomCandy());

    // Play tick sound while tumbling
    let tickCount = 0;
    const tickInterval = setInterval(() => {
      if (soundRef.current && tickCount < 10) {
        playSpinTick();
      }
      tickCount++;
    }, 70);

    await new Promise((r) => setTimeout(r, 800));
    clearInterval(tickInterval);
    setGrid(newGrid);
    if (soundRef.current) playReelStop(0);

    // 3. Evaluate and run Cascade (Tumble) loop
    let currentRoundWin = 0;
    let evalResult = evaluateGrid(newGrid, bet);

    if (evalResult.winningIndices.length > 0) {
      setWinningCellIndices(evalResult.winningIndices);
      currentRoundWin += evalResult.totalWin;
      setRoundWin(currentRoundWin);
      setTotalMultiplier(evalResult.multiplier);

      triggerHaptic("success");
      if (soundRef.current) playWinSmallSound();

      // Show win explosion effect
      try {
        confetti({
          particleCount: 40,
          spread: 70,
          origin: { y: 0.6 },
          colors: ["#f43f5e", "#38bdf8", "#fbbf24", "#e879f9"],
        });
      } catch {}

      // Tumble step 1: replace winning with new falling candies
      await new Promise((r) => setTimeout(r, 1000));

      const tumbledGrid = newGrid.map((cell, idx) =>
        evalResult.winningIndices.includes(idx) ? getRandomCandy() : cell
      );
      setGrid(tumbledGrid);
      setWinningCellIndices([]);
      setTumbleStep(1);

      // Check secondary tumble win
      const secondaryEval = evaluateGrid(tumbledGrid, bet);
      if (secondaryEval.winningIndices.length > 0) {
        setWinningCellIndices(secondaryEval.winningIndices);
        currentRoundWin += secondaryEval.totalWin;
        setRoundWin(currentRoundWin);
        if (soundRef.current) playWinBigSound();

        await new Promise((r) => setTimeout(r, 900));
        const thirdGrid = tumbledGrid.map((cell, idx) =>
          secondaryEval.winningIndices.includes(idx) ? getRandomCandy() : cell
        );
        setGrid(thirdGrid);
        setWinningCellIndices([]);
      }
    }

    // 4. Bonus Free Spins trigger check (4+ Scatters)
    if (evalResult.hasScatters) {
      setIsFreeSpinsMode(true);
      setFreeSpinsLeft((prev) => prev + 10);
      setWinTitle("🍭 БОНУСНА ГРА: 10 БЕЗКОШТОВНИХ ОБЕРТАНЬ! 🍭");
      triggerHaptic("success");
      if (soundRef.current) playJackpotFanfare();

      try {
        confetti({
          particleCount: 100,
          spread: 90,
          origin: { y: 0.5 },
          colors: ["#ff007f", "#00ffff", "#ffd700", "#a855f7"],
        });
      } catch {}
    } else if (currentRoundWin > 0) {
      if (currentRoundWin >= bet * 10) {
        setWinTitle(`🎉 ВЕЛИКИЙ СОЛОДКИЙ ВИГРАШ: +${currentRoundWin.toLocaleString()} 🪙`);
        if (soundRef.current) playWinBigSound();
      } else {
        setWinTitle(`✨ Смачний виграш: +${currentRoundWin.toLocaleString()} 🪙`);
      }
    } else {
      if (soundRef.current) playLoseSound();
    }

    // 5. Finalize balance in store (Preserves balance changes correctly!)
    if (currentRoundWin > 0 && gameState) {
      setGameState({
        ...gameState,
        economy: {
          ...gameState.economy,
          balance: gameState.economy.balance - (!isFreeSpinsMode ? bet : 0) + currentRoundWin,
        },
      });
      triggerCoinAnimation(currentRoundWin);
    }

    setIsSpinning(false);
  };

  return (
    <div className="flex flex-col gap-3 pb-24 max-w-xl mx-auto px-2 font-['Nunito']">
      {/* 🍭 CANDY UTOPIA VIBRANT BANNER */}
      <div
        className={`rounded-3xl p-4 border-2 shadow-2xl transition-all duration-700 relative overflow-hidden ${
          isFreeSpinsMode
            ? "bg-gradient-to-b from-[#2e1065] via-[#4c1d95] to-[#1e1b4b] border-pink-400 shadow-pink-900/60"
            : "bg-gradient-to-b from-[#f472b6]/90 via-[#c084fc]/90 to-[#60a5fa]/90 border-yellow-300 shadow-purple-900/40"
        }`}
      >
        {/* Sparkles background fx */}
        <div className="absolute top-2 right-3 flex items-center gap-2">
          <span className="text-xs bg-pink-950/80 text-pink-200 px-2.5 py-1 rounded-full border border-pink-400/50 font-['Fredoka'] font-bold flex items-center gap-1 shadow-inner">
            <Sparkles className="w-3.5 h-3.5 text-yellow-300 animate-spin-slow" />
            6×5 Каскадний слот
          </span>
          <button
            onClick={() => setShowPaytable(!showPaytable)}
            className="p-1.5 rounded-xl bg-pink-900/60 hover:bg-pink-800 text-yellow-200 border border-yellow-300/40 transition-all text-xs font-bold"
          >
            Таблиця ℹ️
          </button>
        </div>

        <div className="text-center pt-2">
          <h1 className="font-['Fredoka'] font-black text-2xl sm:text-3xl text-yellow-200 drop-shadow-[0_2px_10px_rgba(0,0,0,0.7)] tracking-wide">
            CANDY UTOPIA
          </h1>
          <p className="text-xs text-white font-bold drop-shadow">
            {isFreeSpinsMode ? "✨ НІЧНА БОНУСНА ГРА (МНОЖНИКИ АКТИВНІ) ✨" : "Солодка країна цукерок та каскадних вибухів"}
          </p>
        </div>

        {/* Progressive Jackpot Bar */}
        <div className="mt-3 bg-pink-950/85 backdrop-blur-md rounded-2xl p-2.5 border-2 border-yellow-300 flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-yellow-400 border border-yellow-100 flex items-center justify-center text-lg shadow">
              🍭
            </div>
            <div>
              <span className="text-[10px] text-pink-200 font-bold uppercase tracking-wider block">
                Цукровий Джекпот
              </span>
              <div className="font-['Fredoka'] font-extrabold text-base text-yellow-300">
                {jackpotPool.toLocaleString()} 🪙
              </div>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-pink-300 block font-semibold">Твій баланс</span>
            <div className="font-['Fredoka'] font-bold text-sm text-yellow-200">
              {balance.toLocaleString()} 🪙
            </div>
          </div>
        </div>
      </div>

      {/* 🍬 6x5 GAME GRID (Semi-transparent candy frame encrusted with edible gold) */}
      <div
        className={`rounded-3xl p-3 border-4 shadow-2xl relative transition-all duration-500 ${
          isFreeSpinsMode
            ? "bg-purple-950/90 border-pink-400 shadow-[0_0_30px_rgba(244,63,94,0.4)]"
            : "bg-pink-950/80 border-amber-300 shadow-[0_0_25px_rgba(245,158,11,0.3)]"
        }`}
      >
        <div className="grid grid-cols-6 gap-1.5 sm:gap-2">
          {grid.map((cell, index) => {
            const isWinner = winningCellIndices.includes(index);

            return (
              <motion.div
                key={index}
                initial={false}
                animate={
                  isWinner
                    ? { scale: [1, 1.25, 0.9, 1.15], rotate: [0, -8, 8, 0] }
                    : { scale: 1, rotate: 0 }
                }
                transition={{ duration: 0.4 }}
                className={`h-12 sm:h-14 rounded-2xl flex flex-col items-center justify-center relative select-none border transition-all ${
                  isWinner
                    ? "bg-gradient-to-b from-yellow-300 to-amber-500 border-white shadow-[0_0_15px_#fde047] z-10"
                    : "bg-pink-900/60 hover:bg-pink-900/80 border-pink-500/40 shadow-inner"
                }`}
              >
                <span className="text-2xl sm:text-3xl filter drop-shadow-md">{cell.icon}</span>

                {/* Multiplier badge for bomb */}
                {cell.id === "multiplier_bomb" && cell.multiplierVal && (
                  <span className="absolute -top-1 -right-1 bg-yellow-400 text-pink-950 text-[9px] font-black px-1 rounded-full border border-white shadow animate-pulse">
                    x{cell.multiplierVal}
                  </span>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Win Notification Banner */}
        {winTitle && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="mt-2.5 p-2 bg-gradient-to-r from-amber-400 via-pink-500 to-purple-600 text-white font-['Fredoka'] font-black text-center text-xs sm:text-sm rounded-xl border border-yellow-200 shadow-xl"
          >
            {winTitle}
          </motion.div>
        )}
      </div>

      {/* 🎮 3D Hard-Candy Controls & Bet Adjusters */}
      <div className="bg-[#1f162e] rounded-3xl p-3 border-2 border-pink-500/60 shadow-xl flex flex-col gap-2.5">
        {/* Quick Bet Buttons */}
        <div className="flex items-center justify-between gap-1 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-[11px] text-pink-300 font-bold pl-1 shrink-0">Ставка:</span>
          {QUICK_BETS.map((amt) => (
            <button
              key={amt}
              onClick={() => handleBetChange(amt)}
              disabled={isSpinning}
              className={`px-2.5 py-1 rounded-xl text-xs font-['Fredoka'] font-bold shrink-0 transition-all ${
                bet === amt
                  ? "bg-gradient-to-r from-yellow-300 to-amber-400 text-pink-950 shadow-md border border-white scale-105"
                  : "bg-pink-950/80 text-pink-200 hover:text-white border border-pink-800"
              }`}
            >
              {amt}
            </button>
          ))}
        </div>

        {/* Spin Action Section */}
        <div className="flex items-center gap-2">
          {/* Bet Stepper Input */}
          <div className="flex items-center bg-[#130b1c] rounded-2xl border border-pink-500/50 p-1 flex-1">
            <button
              onClick={() => handleBetChange(Math.max(10, bet - 50))}
              disabled={isSpinning}
              className="w-8 h-8 rounded-xl bg-pink-900/60 hover:bg-pink-800 text-yellow-300 font-bold text-sm"
            >
              -
            </button>
            <div className="flex-1 text-center font-['Fredoka'] font-black text-yellow-300 text-sm">
              🪙 {bet.toLocaleString()}
            </div>
            <button
              onClick={() => handleBetChange(bet + 50)}
              disabled={isSpinning}
              className="w-8 h-8 rounded-xl bg-pink-900/60 hover:bg-pink-800 text-yellow-300 font-bold text-sm"
            >
              +
            </button>
          </div>

          {/* Main 3D Candy Spin Button */}
          <button
            id="btn-spin-candy"
            onClick={handleSpin}
            disabled={isSpinning}
            className={`flex-2 py-3 px-6 rounded-2xl font-['Fredoka'] font-black text-sm uppercase tracking-wider shadow-2xl border-2 flex items-center justify-center gap-2 transition-all active:scale-95 ${
              isSpinning
                ? "bg-gray-800 text-gray-500 border-gray-700 cursor-not-allowed"
                : "bg-gradient-to-r from-pink-500 via-rose-500 to-yellow-400 hover:from-pink-400 hover:to-yellow-300 text-white border-yellow-200 shadow-pink-600/50 animate-pulse"
            }`}
          >
            <Sparkles className="w-5 h-5 text-yellow-200" />
            {isSpinning ? "Крутимо..." : `КРУТИТИ (${bet} 🪙)`}
          </button>
        </div>
      </div>

      {/* Paytable & Rules Drawer */}
      {showPaytable && (
        <div className="bg-[#1b1227] rounded-3xl p-4 border border-pink-500/50 shadow-xl flex flex-col gap-2 text-xs">
          <div className="flex items-center justify-between border-b border-pink-800 pb-1.5">
            <h4 className="font-['Fredoka'] font-bold text-sm text-yellow-300">
              🍬 Candy Utopia: Правила та Виплати (8+ однакових)
            </h4>
            <button
              onClick={() => setShowPaytable(false)}
              className="text-pink-300 font-bold text-xs"
            >
              ✕
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {CANDY_SYMBOLS.filter((s) => s.type !== "multiplier").map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between p-2 rounded-xl bg-pink-950/60 border border-pink-800/60"
              >
                <div className="flex items-center gap-1.5">
                  <span className="text-xl">{s.icon}</span>
                  <span className="text-[11px] text-pink-100 font-semibold">{s.name}</span>
                </div>
                <div className="text-right text-[10px] text-yellow-300 font-bold">
                  8+: x{s.payout8_9} | 12+: x{s.payout12_plus}
                </div>
              </div>
            ))}
          </div>

          <p className="text-[11px] text-pink-300 mt-1">
            🍭 <b>4+ Скаттери (Леденці):</b> Запускають 10 Безкоштовних Обертань (Free Spins).<br />
            💣 <b>Цукрові Бомби (x2-x100):</b> Множать суму всіх виграшів у поточному каскаді!
          </p>
        </div>
      )}
    </div>
  );
};
