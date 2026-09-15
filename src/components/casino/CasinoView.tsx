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
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import confetti from "canvas-confetti";
import { motion, AnimatePresence } from "motion/react";

// 🍒 Berry & Harvest Slot Symbols Definition
export interface SlotSymbol {
  id: string;
  name: string;
  icon: string;
  payout3: number; // Multiplier for 3-match
  payout2?: number; // Multiplier for 2-match
  color: string;
  glow: string;
  isJackpot?: boolean;
  isWild?: boolean;
}

export const SYMBOLS: SlotSymbol[] = [
  {
    id: "cherry",
    name: "Вишня",
    icon: "🍒",
    payout3: 5,
    payout2: 2,
    color: "#ef4444",
    glow: "rgba(239, 68, 68, 0.6)",
  },
  {
    id: "strawberry",
    name: "Полуниця",
    icon: "🍓",
    payout3: 8,
    color: "#f43f5e",
    glow: "rgba(244, 63, 94, 0.6)",
  },
  {
    id: "grapes",
    name: "Виноград",
    icon: "🍇",
    payout3: 12,
    color: "#a855f7",
    glow: "rgba(168, 85, 247, 0.6)",
  },
  {
    id: "blueberry",
    name: "Чорниця",
    icon: "🫐",
    payout3: 18,
    color: "#3b82f6",
    glow: "rgba(59, 130, 246, 0.6)",
  },
  {
    id: "watermelon",
    name: "Кавун",
    icon: "🍉",
    payout3: 25,
    color: "#10b981",
    glow: "rgba(16, 185, 129, 0.6)",
  },
  {
    id: "corn",
    name: "Кукурудза",
    icon: "🌽",
    payout3: 50,
    color: "#eab308",
    glow: "rgba(234, 179, 8, 0.7)",
  },
  {
    id: "diamond",
    name: "777 Діамант",
    icon: "💎",
    payout3: 100,
    color: "#06b6d4",
    glow: "rgba(6, 182, 212, 0.9)",
    isJackpot: true,
  },
  {
    id: "wild",
    name: "Золотий Колос",
    icon: "🌾",
    payout3: 75,
    color: "#f59e0b",
    glow: "rgba(245, 158, 11, 0.9)",
    isWild: true,
  },
];

// Weighted reel distribution (more cherries/strawberries, rarer diamonds/wilds)
const WEIGHTED_STRIP: string[] = [
  "cherry", "cherry", "cherry", "cherry",
  "strawberry", "strawberry", "strawberry",
  "grapes", "grapes", "grapes",
  "blueberry", "blueberry",
  "watermelon", "watermelon",
  "corn",
  "wild",
  "diamond",
  "cherry", "strawberry", "grapes", "blueberry",
];

const QUICK_BETS = [50, 100, 250, 500, 1000, 2500, 5000];

export const CasinoView: React.FC<{
  onAction?: (actionName: string, params?: Record<string, unknown>) => Promise<void>;
  isLoading?: boolean;
}> = ({ onAction }) => {
  const { gameState, setGameState, soundEnabled, toggleSound, triggerCoinAnimation, addToast } = useGameStore();

  const balance = gameState?.economy.balance ?? 0;

  const [bet, setBet] = useState<number>(100);
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [reels, setReels] = useState<[SlotSymbol, SlotSymbol, SlotSymbol]>([
    SYMBOLS[0], // Cherry
    SYMBOLS[1], // Strawberry
    SYMBOLS[2], // Grapes
  ]);

  const [reelSpinning, setReelSpinning] = useState<[boolean, boolean, boolean]>([false, false, false]);
  const [lastWin, setLastWin] = useState<number | null>(null);
  const [lastMultiplier, setLastMultiplier] = useState<number | null>(null);
  const [winMessage, setWinMessage] = useState<string | null>(null);
  const [winningIndices, setWinningIndices] = useState<number[]>([]);
  const [leverPulled, setLeverPulled] = useState<boolean>(false);
  const [showPaytable, setShowPaytable] = useState<boolean>(false);
  const [autoSpinCount, setAutoSpinCount] = useState<number>(0);
  const [isAutoSpinning, setIsAutoSpinning] = useState<boolean>(false);

  // Progressive Agro Jackpot counter
  const [jackpotPool, setJackpotPool] = useState<number>(88500);

  // Spin History
  const [spinHistory, setSpinHistory] = useState<
    Array<{ id: number; icons: string[]; win: number; bet: number; time: string }>
  >([]);

  // Sounds active ref
  const soundRef = useRef(soundEnabled);
  soundRef.current = soundEnabled;

  const isAutoSpinningRef = useRef(isAutoSpinning);
  isAutoSpinningRef.current = isAutoSpinning;

  const autoSpinCountRef = useRef(autoSpinCount);
  autoSpinCountRef.current = autoSpinCount;

  // Slowly increment progressive jackpot for thrill
  useEffect(() => {
    const timer = setInterval(() => {
      setJackpotPool((prev) => prev + Math.floor(Math.random() * 5) + 1);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  const getRandomSymbol = (): SlotSymbol => {
    const randomId = WEIGHTED_STRIP[Math.floor(Math.random() * WEIGHTED_STRIP.length)];
    return SYMBOLS.find((s) => s.id === randomId) || SYMBOLS[0];
  };

  const handleBetChange = (newBet: number) => {
    if (isSpinning) return;
    triggerHaptic("light");
    if (soundRef.current) playChipSound();
    const safeBet = Math.max(10, Math.min(balance || 100000, newBet));
    setBet(safeBet);
  };

  const calculateOutcome = (r1: SlotSymbol, r2: SlotSymbol, r3: SlotSymbol, currentBet: number) => {
    // Check Wild substitutions
    const isWild1 = r1.isWild;
    const isWild2 = r2.isWild;
    const isWild3 = r3.isWild;

    // 1. Triple Wild (Jackpot Special)
    if (isWild1 && isWild2 && isWild3) {
      return {
        multiplier: 75,
        winAmount: currentBet * 75,
        msg: "🌾 ПОТРІЙНИЙ КОЛОС! СУПЕР-ВРОЖАЙ! 🌾",
        winningReels: [0, 1, 2],
        isJackpot: true,
      };
    }

    // 2. Triple Diamond (777 MEGA JACKPOT)
    if (r1.id === "diamond" && r2.id === "diamond" && r3.id === "diamond") {
      return {
        multiplier: 100,
        winAmount: currentBet * 100 + jackpotPool,
        msg: "💎 777 ДЖЕКПОТ! МЕГА-ВИГРАШ! 💎",
        winningReels: [0, 1, 2],
        isJackpot: true,
      };
    }

    // 3. Exact 3-of-a-kind (any matching symbol)
    if (r1.id === r2.id && r2.id === r3.id) {
      return {
        multiplier: r1.payout3,
        winAmount: currentBet * r1.payout3,
        msg: `✨ 3× ${r1.name}! +${(currentBet * r1.payout3).toLocaleString()} 🪙`,
        winningReels: [0, 1, 2],
        isJackpot: r1.isJackpot || r1.payout3 >= 50,
      };
    }

    // 4. Wild matching (2 identical + 1 wild or 1 symbol + 2 wilds)
    const nonWilds = [r1, r2, r3].filter((s) => !s.isWild);
    if (nonWilds.length > 0) {
      const target = nonWilds[0];
      const allMatchWithWild = [r1, r2, r3].every((s) => s.id === target.id || s.isWild);
      if (allMatchWithWild) {
        return {
          multiplier: target.payout3,
          winAmount: currentBet * target.payout3,
          msg: `🌾 КОЛОСОК ДОПОМІГ: 3× ${target.name}! +${(currentBet * target.payout3).toLocaleString()} 🪙`,
          winningReels: [0, 1, 2],
          isJackpot: target.isJackpot || target.payout3 >= 50,
        };
      }
    }

    // 5. 2-of-a-kind Cherries (First 2 or any 2)
    const cherryCount = [r1, r2, r3].filter((s) => s.id === "cherry" || s.isWild).length;
    if (cherryCount === 2) {
      const winReels = [
        r1.id === "cherry" || r1.isWild ? 0 : -1,
        r2.id === "cherry" || r2.isWild ? 1 : -1,
        r3.id === "cherry" || r3.isWild ? 2 : -1,
      ].filter((idx) => idx !== -1);

      return {
        multiplier: 2,
        winAmount: currentBet * 2,
        msg: `🍒 2× Вишеньки! +${(currentBet * 2).toLocaleString()} 🪙`,
        winningReels: winReels,
        isJackpot: false,
      };
    }

    // Loss
    return {
      multiplier: 0,
      winAmount: 0,
      msg: null,
      winningReels: [],
      isJackpot: false,
    };
  };

  const handleSpin = async () => {
    if (isSpinning) return;
    if (balance < bet) {
      triggerHaptic("warning");
      addToast("Недостатньо монет для ставки!", "warning");
      setIsAutoSpinning(false);
      return;
    }

    setIsSpinning(true);
    setWinningIndices([]);
    setLastWin(null);
    setLastMultiplier(null);
    setWinMessage(null);
    setLeverPulled(true);

    triggerHaptic("heavy");
    if (soundRef.current) playLeverPullSound();

    setTimeout(() => setLeverPulled(false), 400);

    // Deduct bet immediately from local state
    if (gameState) {
      setGameState({
        ...gameState,
        economy: {
          ...gameState.economy,
          balance: gameState.economy.balance - bet,
        },
      });
    }

    // Start spinning all 3 reels
    setReelSpinning([true, true, true]);

    // Rhythmic spin clicks sound
    let tickCount = 0;
    const tickInterval = setInterval(() => {
      if (soundRef.current && tickCount < 16) {
        playSpinTick();
      }
      tickCount++;
    }, 90);

    // Pick final symbols in advance
    const outcome1 = getRandomSymbol();
    const outcome2 = getRandomSymbol();
    const outcome3 = getRandomSymbol();

    // Reel 1 Stops (1.2s)
    setTimeout(() => {
      setReels((prev) => [outcome1, prev[1], prev[2]]);
      setReelSpinning([false, true, true]);
      triggerHaptic("medium");
      if (soundRef.current) playReelStop(0);
    }, 1200);

    // Reel 2 Stops (1.7s)
    setTimeout(() => {
      setReels((prev) => [outcome1, outcome2, prev[2]]);
      setReelSpinning([false, false, true]);
      triggerHaptic("medium");
      if (soundRef.current) playReelStop(1);
    }, 1700);

    // Reel 3 Stops (2.2s)
    setTimeout(() => {
      clearInterval(tickInterval);
      setReels([outcome1, outcome2, outcome3]);
      setReelSpinning([false, false, false]);
      triggerHaptic("heavy");
      if (soundRef.current) playReelStop(2);

      // Evaluate Win
      const result = calculateOutcome(outcome1, outcome2, outcome3, bet);

      if (result.winAmount > 0) {
        setLastWin(result.winAmount);
        setLastMultiplier(result.multiplier);
        setWinMessage(result.msg);
        setWinningIndices(result.winningReels);

        // Update balance
        if (gameState) {
          setGameState({
            ...gameState,
            economy: {
              ...gameState.economy,
              balance: gameState.economy.balance - bet + result.winAmount,
            },
          });
        }

        triggerCoinAnimation(result.winAmount);

        // Sound & FX
        if (result.isJackpot) {
          triggerHaptic("success");
          if (soundRef.current) playJackpotFanfare();
          try {
            confetti({
              particleCount: 100,
              spread: 80,
              origin: { y: 0.5 },
              colors: ["#ffd700", "#ff007f", "#00ffff", "#ffffff", "#10b981"],
            });
          } catch {}
        } else if (result.multiplier >= 10) {
          triggerHaptic("success");
          if (soundRef.current) playWinBigSound();
          try {
            confetti({
              particleCount: 50,
              spread: 60,
              origin: { y: 0.6 },
              colors: ["#ffd700", "#ff6b6b", "#48dbfb"],
            });
          } catch {}
        } else {
          triggerHaptic("medium");
          if (soundRef.current) playWinSmallSound();
          try {
            confetti({
              particleCount: 25,
              spread: 45,
              origin: { y: 0.65 },
              colors: ["#f59e0b", "#fbbf24"],
            });
          } catch {}
        }

        // Add to history
        setSpinHistory((prev) => [
          {
            id: Date.now(),
            icons: [outcome1.icon, outcome2.icon, outcome3.icon],
            win: result.winAmount,
            bet: bet,
            time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
          },
          ...prev.slice(0, 7),
        ]);
      } else {
        if (soundRef.current) playLoseSound();
        setSpinHistory((prev) => [
          {
            id: Date.now(),
            icons: [outcome1.icon, outcome2.icon, outcome3.icon],
            win: 0,
            bet: bet,
            time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
          },
          ...prev.slice(0, 7),
        ]);
      }

      setIsSpinning(false);

      // Handle Auto-Spin loop
      if (isAutoSpinningRef.current && autoSpinCountRef.current > 1) {
        setAutoSpinCount((c) => c - 1);
        setTimeout(() => {
          handleSpin();
        }, 800);
      } else if (isAutoSpinningRef.current && autoSpinCountRef.current <= 1) {
        setIsAutoSpinning(false);
        setAutoSpinCount(0);
      }
    }, 2200);
  };

  const startAutoSpins = (count: number) => {
    if (isSpinning) return;
    if (balance < bet) {
      addToast("Недостатньо монет для ставки!", "warning");
      return;
    }
    triggerHaptic("medium");
    setAutoSpinCount(count);
    setIsAutoSpinning(true);
    handleSpin();
  };

  const stopAutoSpins = () => {
    triggerHaptic("light");
    setIsAutoSpinning(false);
    setAutoSpinCount(0);
  };

  return (
    <div className="flex flex-col gap-3 pb-24 max-w-xl mx-auto px-3">
      {/* 🎰 Casino Header Banner */}
      <div className="bg-gradient-to-r from-[#3d1a24] via-[#541f30] to-[#2e121b] rounded-3xl p-3.5 border-2 border-amber-400/80 shadow-2xl text-amber-50 relative overflow-hidden">
        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-400 to-red-500 p-0.5 shadow-lg flex items-center justify-center text-2xl">
              <div className="w-full h-full bg-[#3d1420] rounded-[14px] flex items-center justify-center">
                🍒
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="font-['Fredoka'] font-black text-lg text-yellow-300 leading-tight tracking-wide drop-shadow">
                  Ягідне Казино "А-11"
                </h2>
                <span className="text-[10px] bg-red-600 text-white font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider animate-pulse">
                  HOT 777
                </span>
              </div>
              <span className="text-[11px] text-pink-200/80">
                Крути ягідні слоти та зривай Джекпот
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Sound Toggle */}
            <button
              onClick={() => {
                triggerHaptic("light");
                toggleSound();
              }}
              className={`w-8 h-8 rounded-xl flex items-center justify-center border transition-all ${
                soundEnabled
                  ? "bg-amber-500/20 border-amber-400 text-yellow-300"
                  : "bg-gray-800/60 border-gray-600 text-gray-400"
              }`}
              title={soundEnabled ? "Вимкнути звук" : "Увімкнути звук"}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Paytable info button */}
            <button
              onClick={() => {
                triggerHaptic("light");
                setShowPaytable(!showPaytable);
              }}
              className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-400 text-yellow-300 flex items-center justify-center hover:bg-amber-500/30 transition-all"
              title="Таблиця виплат"
            >
              <Info className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Progressive Jackpot Ticker */}
        <div className="mt-3 bg-gradient-to-r from-[#1f0b12] to-[#2d0f1a] rounded-2xl p-2.5 border border-amber-500/60 shadow-inner flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs">
            <Flame className="w-4 h-4 text-amber-400 fill-amber-400 animate-bounce" />
            <span className="font-['Fredoka'] font-black uppercase tracking-wider text-yellow-300 text-[11px]">
              Прогресивний Джекпот:
            </span>
          </div>

          <div className="font-['Fredoka'] font-black text-base text-yellow-300 tracking-wider flex items-center gap-1 bg-[#120509] px-2.5 py-0.5 rounded-xl border border-yellow-500/40">
            <Coins className="w-4 h-4 text-amber-400 fill-amber-400" />
            {jackpotPool.toLocaleString()}
          </div>
        </div>
      </div>

      {/* 🎰 THE SLOT MACHINE CASINO CABINET */}
      <div className="relative bg-gradient-to-b from-[#4a1b2a] via-[#35131d] to-[#220b13] rounded-3xl p-4 border-4 border-yellow-500/80 shadow-[0_12px_40px_rgba(0,0,0,0.6)]">
        {/* Machine Top Crown Lights */}
        <div className="flex items-center justify-between px-3 py-1 mb-3 bg-[#1e0a11] rounded-2xl border border-amber-600/60">
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_8px_#ef4444] animate-ping" />
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 shadow-[0_0_8px_#facc15]" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#10b981]" />
          </div>
          <span className="font-['Fredoka'] font-bold text-xs tracking-widest text-amber-200 uppercase">
            3-REEL BERRY CLASSIC
          </span>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#10b981]" />
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 shadow-[0_0_8px_#facc15]" />
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_8px_#ef4444] animate-ping" />
          </div>
        </div>

        {/* 3 REEL SLOTS DISPLAY WITH LEVER */}
        <div className="flex items-center gap-2">
          {/* Main Reels Window */}
          <div className="flex-1 bg-gradient-to-b from-[#14060b] via-[#0f0408] to-[#14060b] rounded-2xl p-3 border-4 border-[#612739] shadow-[inset_0_8px_20px_rgba(0,0,0,0.8)] relative overflow-hidden">
            {/* Payline Golden Guide Center Line */}
            <div className="absolute left-2 right-2 top-1/2 -translate-y-1/2 h-[2px] bg-gradient-to-r from-transparent via-amber-400/80 to-transparent pointer-events-none z-20 shadow-[0_0_8px_rgba(251,191,36,0.8)]" />

            {/* Payline Markers */}
            <div className="absolute left-0.5 top-1/2 -translate-y-1/2 text-[10px] text-amber-400 font-black z-20">
              ▶
            </div>
            <div className="absolute right-0.5 top-1/2 -translate-y-1/2 text-[10px] text-amber-400 font-black z-20">
              ◀
            </div>

            {/* The 3 Reel Columns */}
            <div className="grid grid-cols-3 gap-2.5 relative z-10">
              {[0, 1, 2].map((reelIdx) => {
                const isThisReelSpinning = reelSpinning[reelIdx];
                const symbol = reels[reelIdx];
                const isWinning = winningIndices.includes(reelIdx);

                return (
                  <div
                    key={`reel-${reelIdx}`}
                    className={`h-28 rounded-xl bg-gradient-to-b from-[#2a1019] via-[#3a1824] to-[#2a1019] border-2 flex flex-col items-center justify-center relative overflow-hidden transition-all duration-300 ${
                      isWinning
                        ? "border-yellow-300 shadow-[0_0_18px_rgba(253,224,71,0.9)] scale-105 bg-gradient-to-b from-[#4e1d2f] to-[#381320]"
                        : "border-[#522131] shadow-inner"
                    }`}
                  >
                    {isThisReelSpinning ? (
                      /* Animated Reel Strip Blur during spin */
                      <motion.div
                        className="flex flex-col items-center gap-4 filter blur-[1.5px]"
                        animate={{ y: [-120, 120] }}
                        transition={{ repeat: Infinity, duration: 0.16, ease: "linear" }}
                      >
                        <span className="text-3xl opacity-80">🍓</span>
                        <span className="text-3xl opacity-90">🍒</span>
                        <span className="text-3xl opacity-90">🍇</span>
                        <span className="text-3xl opacity-80">🫐</span>
                        <span className="text-3xl opacity-90">🍉</span>
                        <span className="text-3xl opacity-90">💎</span>
                      </motion.div>
                    ) : (
                      /* Settled Symbol */
                      <motion.div
                        initial={{ scale: 0.8, y: -20 }}
                        animate={{ scale: isWinning ? [1, 1.2, 1] : 1, y: 0 }}
                        transition={{
                          type: "spring",
                          stiffness: 400,
                          damping: 18,
                          scale: isWinning ? { repeat: Infinity, duration: 0.6 } : undefined,
                        }}
                        className="flex flex-col items-center justify-center"
                      >
                        <span className="text-4xl filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.5)] select-none">
                          {symbol.icon}
                        </span>
                        <span
                          className="text-[10px] font-['Fredoka'] font-bold tracking-tight mt-1"
                          style={{ color: symbol.color }}
                        >
                          {symbol.name}
                        </span>
                      </motion.div>
                    )}

                    {/* Gloss highlight over glass */}
                    <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-black/30 pointer-events-none" />
                  </div>
                );
              })}
            </div>
          </div>

          {/* 🕹️ Mechanical Lever Arm on Right */}
          <div className="flex flex-col items-center justify-center pr-1">
            <button
              onClick={handleSpin}
              disabled={isSpinning || balance < bet}
              className="group relative cursor-pointer active:scale-95 transition-transform"
              title="Потягнути важіль"
            >
              <div className="w-5 h-28 bg-[#18080d] rounded-full border-2 border-[#541f30] flex flex-col items-center justify-between p-1 relative shadow-lg">
                {/* Lever Ball Knob */}
                <motion.div
                  animate={{
                    y: leverPulled ? 60 : 0,
                    scale: leverPulled ? 0.9 : 1,
                  }}
                  transition={{ type: "spring", stiffness: 350, damping: 20 }}
                  className="w-8 h-8 rounded-full bg-gradient-to-br from-red-500 via-red-600 to-amber-600 border-2 border-yellow-300 shadow-[0_4px_12px_rgba(239,68,68,0.7)] flex items-center justify-center text-xs absolute -left-1.5 top-0 z-30"
                >
                  <Sparkles className="w-3.5 h-3.5 text-yellow-200" />
                </motion.div>

                {/* Lever Slot Track */}
                <div className="w-1.5 h-full bg-[#0d0306] rounded-full shadow-inner" />
              </div>
            </button>
          </div>
        </div>

        {/* Win Status Display */}
        <div className="min-h-[38px] mt-3 flex items-center justify-center">
          <AnimatePresence mode="wait">
            {winMessage ? (
              <motion.div
                key="win-msg"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="w-full py-1.5 px-3 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-amber-950 font-['Fredoka'] font-black text-center text-sm rounded-xl shadow-[0_0_15px_rgba(245,158,11,0.8)] border border-yellow-200 animate-pulse"
              >
                {winMessage}
              </motion.div>
            ) : isSpinning ? (
              <motion.div
                key="spinning-msg"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-xs text-amber-200 font-bold tracking-wider animate-pulse flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-yellow-300 animate-spin" />
                Барабани крутяться... Хай пощастить! 🍀
              </motion.div>
            ) : (
              <div className="text-xs text-pink-200/70 text-center font-medium">
                Оберіть ставку та натисніть "КРУТИТИ"
              </div>
            )}
          </AnimatePresence>
        </div>

        {/* 🪙 BET CONTROLS & CHIPS */}
        <div className="bg-[#240b13] rounded-2xl p-3 border border-amber-600/50 mt-2 flex flex-col gap-2.5">
          {/* Bet Amount Row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs text-amber-200 font-semibold">
              <span>Ставка:</span>
              <div className="bg-[#120509] px-3 py-1 rounded-xl border border-amber-500/60 font-['Fredoka'] font-bold text-yellow-300 text-sm flex items-center gap-1 shadow-inner">
                <Coins className="w-3.5 h-3.5 text-amber-400" />
                {bet.toLocaleString()}
              </div>
            </div>

            {/* Quick Step Buttons */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => handleBetChange(bet - 50)}
                disabled={isSpinning || bet <= 10}
                className="px-2 py-1 bg-[#3a131e] hover:bg-[#4d1a29] text-amber-200 rounded-lg text-xs font-bold border border-amber-800 disabled:opacity-40"
              >
                -50
              </button>
              <button
                onClick={() => handleBetChange(bet + 50)}
                disabled={isSpinning || bet >= balance}
                className="px-2 py-1 bg-[#3a131e] hover:bg-[#4d1a29] text-amber-200 rounded-lg text-xs font-bold border border-amber-800 disabled:opacity-40"
              >
                +50
              </button>
              <button
                onClick={() => handleBetChange(balance)}
                disabled={isSpinning || balance <= 0}
                className="px-2 py-1 bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white rounded-lg text-xs font-['Fredoka'] font-bold border border-yellow-300 shadow-sm"
              >
                МАКС
              </button>
            </div>
          </div>

          {/* Quick Bet Chips Scrollable */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {QUICK_BETS.map((chip) => {
              const isSelected = bet === chip;
              return (
                <button
                  key={`chip-${chip}`}
                  onClick={() => handleBetChange(chip)}
                  disabled={isSpinning}
                  className={`px-2.5 py-1 rounded-xl text-xs font-['Fredoka'] font-bold shrink-0 border transition-all ${
                    isSelected
                      ? "bg-gradient-to-b from-amber-400 to-amber-600 text-amber-950 border-yellow-200 shadow-md scale-105"
                      : "bg-[#1d080f] text-amber-200/80 border-amber-900/60 hover:bg-[#2d0f19]"
                  }`}
                >
                  🪙 {chip >= 1000 ? `${chip / 1000}k` : chip}
                </button>
              );
            })}
          </div>
        </div>

        {/* 🚀 MAIN SPIN & AUTO-SPIN CONTROLS */}
        <div className="grid grid-cols-4 gap-2 mt-3">
          {/* Big Spin Button (Takes 3 columns) */}
          <button
            id="btn-casino-spin"
            onClick={handleSpin}
            disabled={isSpinning || balance < bet}
            className={`col-span-3 py-3 rounded-2xl font-['Fredoka'] font-black text-base shadow-[0_6px_20px_rgba(245,158,11,0.4)] border-2 flex items-center justify-center gap-2 transition-all ${
              balance >= bet && !isSpinning
                ? "bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-400 hover:from-yellow-300 hover:to-amber-400 active:scale-95 text-amber-950 border-yellow-100"
                : "bg-gray-800/60 text-gray-500 border-gray-700 cursor-not-allowed"
            }`}
          >
            <Sparkles className="w-5 h-5 text-amber-950" />
            {isSpinning ? "КРУТИТЬСЯ..." : `КРУТИТИ (🪙 ${bet})`}
          </button>

          {/* Auto-Spin Toggle Button */}
          {isAutoSpinning ? (
            <button
              onClick={stopAutoSpins}
              className="py-3 px-2 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 text-white rounded-2xl font-['Fredoka'] font-bold text-xs border border-red-300 flex flex-col items-center justify-center gap-0.5 shadow-lg animate-pulse"
            >
              <Square className="w-4 h-4 fill-white" />
              <span>СТОП ({autoSpinCount})</span>
            </button>
          ) : (
            <button
              onClick={() => startAutoSpins(10)}
              disabled={isSpinning || balance < bet}
              className="py-3 px-2 bg-[#31111b] hover:bg-[#471826] active:scale-95 text-amber-200 rounded-2xl font-['Fredoka'] font-bold text-xs border border-amber-700/60 flex flex-col items-center justify-center gap-0.5 shadow transition-all disabled:opacity-40"
            >
              <Zap className="w-4 h-4 text-yellow-400" />
              <span>АВТО 10×</span>
            </button>
          )}
        </div>
      </div>

      {/* 📜 PAYTABLE ACCORDION / DRAWER */}
      <div className="bg-[#244527] rounded-3xl p-4 border-2 border-[#3d7a44] shadow-xl">
        <button
          onClick={() => {
            triggerHaptic("light");
            setShowPaytable(!showPaytable);
          }}
          className="w-full flex items-center justify-between text-amber-200 font-['Fredoka'] font-bold text-sm"
        >
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-400" />
            Таблиця ягідних коефіцієнтів
          </div>
          {showPaytable ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {showPaytable && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3 pt-3 border-t border-emerald-800">
            {SYMBOLS.map((item) => (
              <div
                key={item.id}
                className="bg-[#18311a] p-2.5 rounded-2xl border border-emerald-800 flex items-center gap-2"
              >
                <span className="text-2xl">{item.icon}</span>
                <div>
                  <div className="font-['Fredoka'] font-bold text-xs text-amber-100">
                    {item.name}
                  </div>
                  <div className="text-[11px] font-bold text-yellow-300">
                    3× = {item.payout3}× ставка
                  </div>
                  {item.payout2 && (
                    <div className="text-[10px] text-emerald-300">2× = {item.payout2}×</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 🕒 SPIN HISTORY LOG */}
      {spinHistory.length > 0 && (
        <div className="bg-[#244527] rounded-3xl p-4 border-2 border-[#3d7a44] shadow-xl flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs font-['Fredoka'] text-amber-200 font-bold">
            <span className="flex items-center gap-1.5">
              <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
              Останні обертання
            </span>
            <span className="text-[11px] text-emerald-300">Всього: {spinHistory.length}</span>
          </div>

          <div className="flex flex-col gap-1.5 mt-1">
            {spinHistory.map((item) => (
              <div
                key={item.id}
                className="bg-[#18311a] px-3 py-2 rounded-xl border border-emerald-800 flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2">
                  <span className="text-base tracking-widest">{item.icons.join(" ")}</span>
                  <span className="text-[10px] text-emerald-300/80">{item.time}</span>
                </div>

                <div className="text-right font-['Fredoka']">
                  {item.win > 0 ? (
                    <span className="font-bold text-yellow-300 bg-emerald-950/80 px-2 py-0.5 rounded-md border border-emerald-700">
                      +🪙 {item.win.toLocaleString()}
                    </span>
                  ) : (
                    <span className="text-gray-400 text-[11px]">-🪙 {item.bet}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
