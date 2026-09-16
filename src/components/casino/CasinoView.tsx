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
  Sparkles,
  Volume2,
  VolumeX,
  Trophy,
  Info,
  Flame,
  Play,
  Square,
  Crown,
  Zap,
} from "lucide-react";
import confetti from "canvas-confetti";
import { motion, AnimatePresence } from "motion/react";

// Classic Vintage Casino Symbols
export interface SlotSymbol {
  id: string;
  name: string;
  icon: string;
  payout3: number; // 3 in a line multiplier
  payout4: number; // 4 in a line multiplier
  color: string;
  weight: number;
}

export const CLASSIC_SYMBOLS: SlotSymbol[] = [
  { id: "seven", name: "Три Сімки 777", icon: "7️⃣", payout3: 15, payout4: 50, color: "#ef4444", weight: 8 },
  { id: "diamond", name: "Діамант", icon: "💎", payout3: 10, payout4: 30, color: "#38bdf8", weight: 12 },
  { id: "crown", name: "Золота Корона", icon: "👑", payout3: 8, payout4: 20, color: "#eab308", weight: 15 },
  { id: "bell", name: "Золотий Дзвін", icon: "🔔", payout3: 5, payout4: 12, color: "#facc15", weight: 20 },
  { id: "clover", name: "Конюшина Удачі", icon: "🍀", payout3: 4, payout4: 8, color: "#22c55e", weight: 25 },
  { id: "cherry", name: "Вишні", icon: "🍒", payout3: 3, payout4: 6, color: "#f43f5e", weight: 30 },
  { id: "grape", name: "Виноград", icon: "🍇", payout3: 2, payout4: 5, color: "#a855f7", weight: 35 },
  { id: "lemon", name: "Лимон", icon: "🍋", payout3: 1.5, payout4: 4, color: "#fde047", weight: 40 },
];

export interface MultiplierDrop {
  index: number; // slot 0-11
  multiplier: number; // x2, x3, x5, x10, x25, x50, x100
}

// 3x4 Grid (3 Rows, 4 Columns)
// Row 0: 0, 1, 2, 3
// Row 1: 4, 5, 6, 7
// Row 2: 8, 9, 10, 11
const PAYLINES = [
  // 3 Horizontal lines (4-reels)
  [0, 1, 2, 3],
  [4, 5, 6, 7],
  [8, 9, 10, 11],
  // Diagonals & V-shapes
  [0, 5, 10, 7],
  [8, 5, 2, 7],
  [4, 1, 2, 7],
  [4, 9, 10, 7],
  [0, 5, 6, 3],
  [8, 5, 6, 11],
];

const MULTIPLIERS_POOL = [2, 2, 2, 3, 3, 5, 5, 10, 25, 50, 100];

// Helper to pick random symbol based on weight
const getRandomSymbol = (): string => {
  const totalWeight = CLASSIC_SYMBOLS.reduce((sum, s) => sum + s.weight, 0);
  let rand = Math.random() * totalWeight;
  for (const sym of CLASSIC_SYMBOLS) {
    if (rand < sym.weight) return sym.icon;
    rand -= sym.weight;
  }
  return CLASSIC_SYMBOLS[CLASSIC_SYMBOLS.length - 1].icon;
};

// Generate an authentic physics reel strip
const generateReelStrip = (target3: string[], count = 24): string[] => {
  const intermediate: string[] = [];
  for (let i = 0; i < count; i++) {
    intermediate.push(getRandomSymbol());
  }
  return [...intermediate, ...target3];
};

interface ReelColumnProps {
  colIndex: number;
  currentSymbols: string[]; // 3 symbols [row0, row1, row2]
  isSpinning: boolean;
  targetSymbols: string[];
  winningRowIndexes: number[];
  multiplierDrops: { row: number; multiplier: number }[];
  duration: number; // in ms
  onStop: () => void;
}

const ReelColumn: React.FC<ReelColumnProps> = ({
  colIndex,
  currentSymbols,
  isSpinning,
  targetSymbols,
  winningRowIndexes,
  multiplierDrops,
  duration,
  onStop,
}) => {
  const [strip, setStrip] = useState<string[]>(currentSymbols);
  const [offsetY, setOffsetY] = useState<number>(0);
  const [isAnimating, setIsAnimating] = useState<boolean>(false);
  const cellHeight = 76; // px per row cell

  useEffect(() => {
    if (isSpinning) {
      // Build a strip of random symbols ending with the target 3
      const newStrip = generateReelStrip(targetSymbols, 22 + colIndex * 4);
      setStrip(newStrip);
      setOffsetY(0);
      setIsAnimating(true);

      // Target travel distance
      const totalSymbols = newStrip.length;
      const targetOffset = (totalSymbols - 3) * cellHeight;

      // Start anticipation then full momentum spin
      const timer = setTimeout(() => {
        setOffsetY(-targetOffset);
      }, 50);

      // Animation complete handler
      const stopTimer = setTimeout(() => {
        setIsAnimating(false);
        setStrip(targetSymbols);
        setOffsetY(0);
        onStop();
      }, duration);

      return () => {
        clearTimeout(timer);
        clearTimeout(stopTimer);
      };
    } else {
      setStrip(currentSymbols);
      setOffsetY(0);
      setIsAnimating(false);
    }
  }, [isSpinning, targetSymbols, duration, colIndex]);

  return (
    <div
      className="relative flex-1 h-[228px] overflow-hidden rounded-2xl bg-[#140505] border border-yellow-900/60 shadow-inner select-none"
      style={{ minWidth: 0 }}
    >
      {/* Top & Bottom Glass Reflection / Shading Overlays */}
      <div className="absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-black/80 via-black/40 to-transparent z-20 pointer-events-none" />
      <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-black/80 via-black/40 to-transparent z-20 pointer-events-none" />

      {/* Subtle Horizontal Payline Dividers */}
      <div className="absolute top-[76px] inset-x-0 h-[1px] bg-yellow-500/15 z-10 pointer-events-none" />
      <div className="absolute top-[152px] inset-x-0 h-[1px] bg-yellow-500/15 z-10 pointer-events-none" />

      {/* Physics Animated Vertical Strip */}
      <motion.div
        className="flex flex-col w-full"
        animate={{ y: offsetY }}
        transition={
          isAnimating
            ? {
                duration: duration / 1000,
                // Authentic Slot Machine Easing: fast anticipation, high momentum, elastic spring bounce at landing
                ease: [0.15, 0.9, 0.25, 1.08],
              }
            : { duration: 0 }
        }
      >
        {strip.map((symbol, sIdx) => {
          // If stopped, check if this row is a winning row
          const isTargetRow = !isAnimating && sIdx < 3;
          const isWinner = isTargetRow && winningRowIndexes.includes(sIdx);
          const drop = isTargetRow ? multiplierDrops.find((m) => m.row === sIdx) : null;

          return (
            <div
              key={sIdx}
              className={`h-[76px] w-full flex items-center justify-center relative transition-all duration-300 ${
                isWinner
                  ? "bg-gradient-to-b from-yellow-400/30 via-amber-500/40 to-yellow-600/30 shadow-[inset_0_0_15px_rgba(250,204,21,0.6)]"
                  : ""
              }`}
            >
              {/* Symbol Icon with Motion Blur during High Speed */}
              <motion.span
                animate={
                  isWinner
                    ? {
                        scale: [1, 1.15, 1],
                        rotate: [0, -4, 4, 0],
                      }
                    : {}
                }
                transition={{
                  repeat: isWinner ? Infinity : 0,
                  duration: 0.6,
                }}
                className={`text-3xl sm:text-4xl filter drop-shadow-md select-none ${
                  isAnimating ? "blur-[0.8px] opacity-80" : ""
                }`}
              >
                {symbol}
              </motion.span>

              {/* Multiplier Drop Badge with Spring Pop */}
              {drop && (
                <motion.div
                  initial={{ scale: 0, rotate: -25 }}
                  animate={{ scale: [0, 1.3, 0.95, 1], rotate: 0 }}
                  transition={{ type: "spring", stiffness: 350, damping: 15 }}
                  className="absolute top-1 right-1 bg-gradient-to-r from-red-600 via-amber-500 to-yellow-400 text-yellow-950 font-['Fredoka'] font-black text-[10px] sm:text-[11px] px-1.5 py-0.5 rounded-lg border border-yellow-200 shadow-[0_0_10px_rgba(234,179,8,0.8)] z-30"
                >
                  ×{drop.multiplier}
                </motion.div>
              )}

              {/* Glowing Winner Frame */}
              {isWinner && (
                <div className="absolute inset-1 rounded-xl border-2 border-yellow-300 shadow-[0_0_15px_rgba(250,204,21,0.9)] animate-pulse pointer-events-none" />
              )}
            </div>
          );
        })}
      </motion.div>
    </div>
  );
};

export const CasinoView: React.FC<{
  onAction: (actionName: string, params?: Record<string, unknown>) => Promise<void>;
  isLoading?: boolean;
}> = ({ onAction, isLoading = false }) => {
  const { gameState } = useGameStore();

  const balance = gameState?.economy.balance ?? 0;

  // 3x4 Grid State: 12 cells
  // Layout:
  // Col 0: [0, 4, 8]
  // Col 1: [1, 5, 9]
  // Col 2: [2, 6, 10]
  // Col 3: [3, 7, 11]
  const [grid, setGrid] = useState<string[]>(() => [
    "7️⃣", "💎", "👑", "🔔",
    "🍒", "7️⃣", "🍀", "🍇",
    "🔔", "💎", "7️⃣", "🍋",
  ]);

  const [targetGrid, setTargetGrid] = useState<string[]>(grid);
  const [activeMultipliers, setActiveMultipliers] = useState<MultiplierDrop[]>([]);
  const [totalMultiplier, setTotalMultiplier] = useState<number>(1);
  const [winningLines, setWinningLines] = useState<number[][]>([]);
  const [winningCells, setWinningCells] = useState<number[]>([]);

  const [bet, setBet] = useState<number>(500);
  const [customBetInput, setCustomBetInput] = useState<string>("500");
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [spinningColumns, setSpinningColumns] = useState<boolean[]>([false, false, false, false]);

  const [lastWin, setLastWin] = useState<number>(0);
  const [winMessage, setWinMessage] = useState<string | null>(null);
  const [showJackpotCelebration, setShowJackpotCelebration] = useState<boolean>(false);
  const [showPaytable, setShowPaytable] = useState<boolean>(false);
  const [autoSpinActive, setAutoSpinActive] = useState<boolean>(false);
  const [autoSpinCount, setAutoSpinCount] = useState<number>(0);

  const autoSpinRef = useRef<boolean>(false);
  autoSpinRef.current = autoSpinActive;

  // Sound toggle
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  const handleBetSelect = (amount: number) => {
    if (isSpinning) return;
    triggerHaptic("light");
    if (soundEnabled) playChipSound();
    setBet(amount);
    setCustomBetInput(String(amount));
  };

  const handleCustomBetChange = (val: string) => {
    setCustomBetInput(val);
    const num = parseInt(val, 10);
    if (!isNaN(num) && num > 0) {
      setBet(num);
    }
  };

  // Perform Physics-Driven Spin
  const spinReels = async () => {
    if (isSpinning || isLoading) return;
    if (balance < bet) {
      triggerHaptic("warning");
      if (soundEnabled) playLoseSound();
      setWinMessage("❌ Недостатньо коштів на балансі!");
      setAutoSpinActive(false);
      return;
    }

    setIsSpinning(true);
    setWinningLines([]);
    setWinningCells([]);
    setActiveMultipliers([]);
    setTotalMultiplier(1);
    setWinMessage(null);
    setShowJackpotCelebration(false);

    triggerHaptic("heavy");
    if (soundEnabled) playLeverPullSound();

    // 1. Generate final target 12 cells
    const nextGrid: string[] = Array.from({ length: 12 }, () => getRandomSymbol());
    setTargetGrid(nextGrid);

    // 2. Multiplier drops chance (35% chance)
    const multipliers: MultiplierDrop[] = [];
    if (Math.random() < 0.35) {
      const dropCount = Math.random() < 0.25 ? 2 : 1;
      const chosenIndexes = new Set<number>();
      for (let d = 0; d < dropCount; d++) {
        const cellIdx = Math.floor(Math.random() * 12);
        if (!chosenIndexes.has(cellIdx)) {
          chosenIndexes.add(cellIdx);
          const multVal = MULTIPLIERS_POOL[Math.floor(Math.random() * MULTIPLIERS_POOL.length)];
          multipliers.push({ index: cellIdx, multiplier: multVal });
        }
      }
    }

    let combinedMultiplier = 1;
    multipliers.forEach((m) => {
      combinedMultiplier *= m.multiplier;
    });

    // Start all 4 columns spinning with physics
    setSpinningColumns([true, true, true, true]);

    // Play spinning ticks during motion
    const spinInterval = setInterval(() => {
      if (soundEnabled) playSpinTick();
    }, 180);

    // Reel durations: staggered stops for authentic cascading physics
    // Col 0: 1600ms, Col 1: 2000ms, Col 2: 2400ms, Col 3: 2800ms
    const totalSpinTime = 2850;

    setTimeout(() => {
      clearInterval(spinInterval);
    }, totalSpinTime);

    // Wait until all reels have completed their spring bounce landing
    await new Promise((resolve) => setTimeout(resolve, totalSpinTime + 100));

    // Update state to final grid
    setGrid(nextGrid);
    setSpinningColumns([false, false, false, false]);

    if (multipliers.length > 0) {
      setActiveMultipliers(multipliers);
      setTotalMultiplier(combinedMultiplier);
      triggerHaptic("medium");
    }

    // 3. Evaluate Wins across paylines
    let baseWin = 0;
    const hitLines: number[][] = [];
    const hitCells = new Set<number>();

    PAYLINES.forEach((line) => {
      const sym0 = nextGrid[line[0]];
      const sym1 = nextGrid[line[1]];
      const sym2 = nextGrid[line[2]];
      const sym3 = nextGrid[line[3]];

      // Check 4 of a kind
      if (sym0 === sym1 && sym1 === sym2 && sym2 === sym3) {
        const item = CLASSIC_SYMBOLS.find((s) => s.icon === sym0);
        if (item) {
          const payout = bet * item.payout4;
          baseWin += payout;
          hitLines.push(line);
          line.forEach((idx) => hitCells.add(idx));
        }
      }
      // Check 3 of a kind (first 3 or last 3)
      else if (sym0 === sym1 && sym1 === sym2) {
        const item = CLASSIC_SYMBOLS.find((s) => s.icon === sym0);
        if (item) {
          const payout = bet * item.payout3;
          baseWin += payout;
          hitLines.push([line[0], line[1], line[2]]);
          hitCells.add(line[0]);
          hitCells.add(line[1]);
          hitCells.add(line[2]);
        }
      } else if (sym1 === sym2 && sym2 === sym3) {
        const item = CLASSIC_SYMBOLS.find((s) => s.icon === sym1);
        if (item) {
          const payout = bet * item.payout3;
          baseWin += payout;
          hitLines.push([line[1], line[2], line[3]]);
          hitCells.add(line[1]);
          hitCells.add(line[2]);
          hitCells.add(line[3]);
        }
      }
    });

    const finalWin = Math.round(baseWin * combinedMultiplier);
    setWinningLines(hitLines);
    setWinningCells(Array.from(hitCells));
    setLastWin(finalWin);

    // Call server action to sync state securely
    try {
      await onAction("casino", { bet, win: finalWin });
    } catch (err) {
      console.error(err);
    }

    // Win feedback
    if (finalWin > 0) {
      if (combinedMultiplier > 1) {
        setWinMessage(`💥 МНОЖНИК ×${combinedMultiplier}! ВИГРАШ: +${finalWin.toLocaleString()} 🪙!`);
      } else {
        setWinMessage(`🎉 ВИГРАШ: +${finalWin.toLocaleString()} 🪙!`);
      }

      if (finalWin >= bet * 10) {
        setShowJackpotCelebration(true);
        triggerHaptic("heavy");
        if (soundEnabled) playJackpotFanfare();
        try {
          confetti({
            particleCount: 120,
            spread: 90,
            origin: { y: 0.6 },
            colors: ["#ffd700", "#ff0000", "#00ffcc", "#ffffff"],
          });
        } catch {}
      } else if (finalWin >= bet * 3) {
        triggerHaptic("success");
        if (soundEnabled) playWinBigSound();
        try {
          confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
        } catch {}
      } else {
        triggerHaptic("medium");
        if (soundEnabled) playWinSmallSound();
      }
    } else {
      triggerHaptic("light");
      if (soundEnabled) playLoseSound();
      setWinMessage("Спробуйте ще раз! Удача поруч 🍀");
    }

    setIsSpinning(false);

    // Auto-spin next tick
    if (autoSpinRef.current) {
      setAutoSpinCount((prev) => {
        const next = prev - 1;
        if (next <= 0) {
          setAutoSpinActive(false);
          return 0;
        }
        setTimeout(() => {
          if (autoSpinRef.current) spinReels();
        }, 900);
        return next;
      });
    }
  };

  const startAutoSpin = (count: number) => {
    if (isSpinning) return;
    triggerHaptic("medium");
    setAutoSpinCount(count);
    setAutoSpinActive(true);
    setTimeout(() => spinReels(), 100);
  };

  const stopAutoSpin = () => {
    triggerHaptic("light");
    setAutoSpinActive(false);
    setAutoSpinCount(0);
  };

  // Helper to extract winning row indexes for a column
  const getColWinningRows = (colIdx: number) => {
    const rows: number[] = [];
    [0, 1, 2].forEach((r) => {
      const cellIdx = r * 4 + colIdx;
      if (winningCells.includes(cellIdx)) {
        rows.push(r);
      }
    });
    return rows;
  };

  // Helper to extract multiplier drops for a column
  const getColMultiplierDrops = (colIdx: number) => {
    const drops: { row: number; multiplier: number }[] = [];
    [0, 1, 2].forEach((r) => {
      const cellIdx = r * 4 + colIdx;
      const found = activeMultipliers.find((m) => m.index === cellIdx);
      if (found) {
        drops.push({ row: r, multiplier: found.multiplier });
      }
    });
    return drops;
  };

  return (
    <div className="flex flex-col gap-4 pb-24 max-w-xl mx-auto px-3">
      {/* 🎰 Classic Casino Header */}
      <div className="bg-gradient-to-r from-red-950 via-amber-950 to-red-950 rounded-3xl p-4 border-2 border-yellow-500/70 shadow-2xl relative overflow-hidden text-white flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-b from-yellow-400 to-amber-600 border-2 border-yellow-200 flex items-center justify-center text-2xl shadow-lg shrink-0">
            🎰
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-['Fredoka'] font-black text-xl text-yellow-300 tracking-wide drop-shadow">
                GRAND CASINO 777
              </h1>
              <span className="bg-red-600/80 text-yellow-200 text-[10px] font-bold px-2 py-0.5 rounded-full border border-yellow-400">
                КЛАСИЧНИЙ
              </span>
            </div>
            <p className="text-[11px] text-amber-200/90 font-medium">
              3×4 Ретро-автомат з фізикою барабанів та іксами 💥
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-2 rounded-xl bg-amber-900/60 hover:bg-amber-800/80 border border-yellow-500/40 text-yellow-300 transition-all cursor-pointer"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-gray-400" />}
          </button>
          <button
            onClick={() => setShowPaytable(!showPaytable)}
            className="p-2 rounded-xl bg-amber-900/60 hover:bg-amber-800/80 border border-yellow-500/40 text-yellow-300 transition-all cursor-pointer"
          >
            <Info className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 🏆 Jackpot / Win Status Screen */}
      <div className="bg-gradient-to-r from-[#1c0808] via-[#2c0f0f] to-[#1c0808] rounded-2xl p-3 border-2 border-yellow-500/50 shadow-inner flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-400 animate-pulse" />
          <div>
            <span className="text-[10px] text-amber-300 uppercase font-bold tracking-wider block">
              Останній результат
            </span>
            <span
              className={`font-['Fredoka'] font-black text-sm ${
                lastWin > 0 ? "text-yellow-300" : "text-gray-300"
              }`}
            >
              {winMessage || "Зробіть ставку та крутіть барабани!"}
            </span>
          </div>
        </div>

        {totalMultiplier > 1 && (
          <div className="bg-gradient-to-r from-amber-500 to-red-600 text-yellow-100 font-['Fredoka'] font-black text-sm px-3 py-1 rounded-xl border border-yellow-300 shadow animate-bounce">
            🔥 Множник ×{totalMultiplier}!
          </div>
        )}
      </div>

      {/* 🎰 THE 3x4 SLOT MACHINE CABINET WITH PHYSICAL REEL COLUMNS */}
      <div className="bg-gradient-to-b from-[#3a0d0d] via-[#250808] to-[#140303] rounded-3xl p-4 sm:p-5 border-4 border-yellow-500/80 shadow-[0_0_40px_rgba(234,179,8,0.3)] relative">
        {/* Top Cabinet Marquee Lights */}
        <div className="flex justify-between items-center mb-3 px-2">
          <div className="flex gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 animate-pulse" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
          </div>
          <div className="text-xs font-['Fredoka'] font-black tracking-widest text-yellow-300 uppercase drop-shadow flex items-center gap-1.5">
            <Crown className="w-3.5 h-3.5 text-yellow-400" />
            4 БАРАБАНИ · 3 РЯДИ
            <Crown className="w-3.5 h-3.5 text-yellow-400" />
          </div>
          <div className="flex gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 animate-pulse" />
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
          </div>
        </div>

        {/* 4 Physical Reel Columns */}
        <div className="grid grid-cols-4 gap-2 bg-[#0a0202] p-3 rounded-2xl border-2 border-yellow-600/60 shadow-inner relative">
          {[0, 1, 2, 3].map((colIdx) => {
            const current3 = [grid[colIdx], grid[colIdx + 4], grid[colIdx + 8]];
            const target3 = [targetGrid[colIdx], targetGrid[colIdx + 4], targetGrid[colIdx + 8]];
            const colDuration = 1600 + colIdx * 400; // Staggered: 1.6s, 2.0s, 2.4s, 2.8s

            return (
              <ReelColumn
                key={colIdx}
                colIndex={colIdx}
                currentSymbols={current3}
                isSpinning={spinningColumns[colIdx]}
                targetSymbols={target3}
                winningRowIndexes={getColWinningRows(colIdx)}
                multiplierDrops={getColMultiplierDrops(colIdx)}
                duration={colDuration}
                onStop={() => {
                  if (soundEnabled) playReelStop(colIdx);
                  triggerHaptic("light");
                }}
              />
            );
          })}
        </div>

        {/* Win lines indicator */}
        {winningLines.length > 0 && (
          <div className="mt-3 text-center text-xs font-['Fredoka'] font-bold text-yellow-300 animate-pulse">
            ✨ Зіграло ліній: {winningLines.length} | Виграш: {lastWin.toLocaleString()} 🪙
          </div>
        )}
      </div>

      {/* 💰 Bet Control Panel */}
      <div className="bg-[#1c0a0a] rounded-3xl p-4 border-2 border-yellow-600/50 shadow-xl flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="font-['Fredoka'] font-bold text-xs text-amber-200 uppercase tracking-wider">
            Розмір ставки
          </span>
          <span className="text-xs text-emerald-300 font-semibold">
            Баланс: <b>{balance.toLocaleString()} 🪙</b>
          </span>
        </div>

        {/* Preset Chips */}
        <div className="grid grid-cols-5 gap-1.5">
          {[100, 500, 1000, 5000, 25000].map((amt) => (
            <button
              key={amt}
              id={`btn-bet-${amt}`}
              onClick={() => handleBetSelect(amt)}
              disabled={isSpinning}
              className={`py-1.5 px-1 rounded-xl font-['Fredoka'] font-bold text-xs border transition-all cursor-pointer ${
                bet === amt
                  ? "bg-gradient-to-b from-yellow-400 to-amber-500 text-amber-950 border-yellow-200 shadow-md scale-105"
                  : "bg-[#2c1010] text-amber-200 border-yellow-900/60 hover:bg-[#3d1818]"
              }`}
            >
              {amt >= 1000 ? `${amt / 1000}k` : amt} 🪙
            </button>
          ))}
        </div>

        {/* Custom Bet Input + Max */}
        <div className="flex items-center gap-2">
          <input
            type="number"
            min="10"
            max={balance}
            value={customBetInput}
            onChange={(e) => handleCustomBetChange(e.target.value)}
            disabled={isSpinning}
            className="flex-1 bg-[#0e0404] border border-yellow-600/60 text-yellow-300 font-bold px-3 py-2 rounded-xl text-sm focus:outline-none focus:border-yellow-400"
            placeholder="Введіть ставку"
          />
          <button
            type="button"
            onClick={() => handleBetSelect(Math.max(100, Math.min(balance, 100000)))}
            disabled={isSpinning || balance <= 0}
            className="px-3 py-2 bg-red-800/40 hover:bg-red-800/60 text-yellow-300 text-xs font-bold rounded-xl border border-yellow-500/40 transition-all cursor-pointer"
          >
            Макс ({Math.min(balance, 100000).toLocaleString()} 🪙)
          </button>
        </div>

        {/* Big Spin Action Buttons */}
        <div className="flex gap-2 mt-1">
          {autoSpinActive ? (
            <button
              id="btn-stop-autospin"
              onClick={stopAutoSpin}
              className="flex-1 py-3.5 bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 text-white font-['Fredoka'] font-black text-sm rounded-2xl border-2 border-red-300 shadow-lg flex items-center justify-center gap-2 cursor-pointer active:scale-95 animate-pulse"
            >
              <Square className="w-5 h-5 fill-white" />
              Зупинити авто-спін ({autoSpinCount})
            </button>
          ) : (
            <>
              <button
                id="btn-casino-spin"
                onClick={spinReels}
                disabled={isSpinning || isLoading || balance < bet}
                className={`flex-2 py-3.5 rounded-2xl font-['Fredoka'] font-black text-base shadow-2xl border-2 flex items-center justify-center gap-2 transition-all ${
                  balance >= bet && !isSpinning
                    ? "bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500 hover:from-yellow-300 hover:to-amber-400 text-amber-950 border-yellow-100 shadow-[0_0_25px_rgba(234,179,8,0.5)] cursor-pointer active:scale-95 animate-pulse"
                    : "bg-gray-800 text-gray-500 border-gray-700 cursor-not-allowed"
                }`}
              >
                <Sparkles className="w-5 h-5 text-amber-950" />
                КРУТИТИ ({bet.toLocaleString()} 🪙)
              </button>

              <button
                id="btn-start-autospin"
                onClick={() => startAutoSpin(10)}
                disabled={isSpinning || isLoading || balance < bet}
                className={`flex-1 py-3.5 rounded-2xl font-['Fredoka'] font-bold text-xs border flex items-center justify-center gap-1.5 transition-all ${
                  balance >= bet && !isSpinning
                    ? "bg-[#2d1212] hover:bg-[#3d1818] text-yellow-300 border-yellow-600/60 cursor-pointer active:scale-95"
                    : "bg-gray-800 text-gray-500 border-gray-700 cursor-not-allowed"
                }`}
              >
                <Play className="w-4 h-4 fill-yellow-300" />
                Авто ×10
              </button>
            </>
          )}
        </div>
      </div>

      {/* 📜 Paytable Modal */}
      {showPaytable && (
        <div className="bg-[#1c0a0a] rounded-3xl p-4 border-2 border-yellow-500/60 shadow-2xl text-white flex flex-col gap-3">
          <div className="flex items-center justify-between border-b border-yellow-900/60 pb-2">
            <h3 className="font-['Fredoka'] font-bold text-base text-yellow-300">
              Таблиця виплат та множників (3×4)
            </h3>
            <button
              onClick={() => setShowPaytable(false)}
              className="text-xs text-gray-400 hover:text-white px-2 py-1 bg-gray-800 rounded-lg"
            >
              Закрити ✕
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            {CLASSIC_SYMBOLS.map((s) => (
              <div
                key={s.id}
                className="bg-[#2a0e0e] p-2 rounded-xl border border-yellow-900/40 flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <span className="text-xl">{s.icon}</span>
                  <span className="font-semibold text-amber-100">{s.name}</span>
                </div>
                <div className="text-right font-['Fredoka'] text-yellow-300">
                  <div>3 в ряд: ×{s.payout3}</div>
                  <div>4 в ряд: ×{s.payout4}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-gradient-to-r from-red-950 to-amber-950 p-2.5 rounded-xl border border-yellow-500/40 text-[11px] text-amber-200">
            💥 <b>Випадкові ікси:</b> під час спіну на полі можуть випадково впасти бонуси <b>×2, ×3, ×5, ×10, ×25, ×50, ×100</b>, які множать будь-який лінійний виграш!
          </div>
        </div>
      )}
    </div>
  );
};
