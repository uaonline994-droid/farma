import React, { useEffect, useState } from "react";
import { useGameStore } from "../../store/gameStore";
import { Sparkles, Coins, Gem, Volume2, VolumeX, RefreshCw, Package } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { triggerHaptic } from "../../services/telegram";
import { StorageModal } from "./StorageModal";

export const Header: React.FC<{ onRefresh: () => void; isRefreshing?: boolean }> = ({
  onRefresh,
  isRefreshing = false,
}) => {
  const { gameState, userName, soundEnabled, toggleSound, floatingCoins, clearFloatingCoin } = useGameStore();

  const [isStorageOpen, setIsStorageOpen] = useState(false);

  const balance = gameState?.economy.balance ?? 0;
  const gems = gameState?.economy.gems ?? 0;
  const level = gameState?.level.current ?? 1;
  const xp = gameState?.level.xp ?? 0;
  const nextXp = gameState?.level.next_level_xp ?? 100;
  const xpPercentage = Math.min(100, Math.round((xp / nextXp) * 100));
  const storageUsed = gameState?.economy.storage.used ?? 0;
  const storageMax = gameState?.economy.storage.max ?? 200;
  const storagePercent = Math.min(100, Math.round((storageUsed / storageMax) * 100));

  // Rolling balance animation display
  const [displayBalance, setDisplayBalance] = useState(balance);

  useEffect(() => {
    let start = displayBalance;
    const end = balance;
    if (start === end) return;

    const diff = end - start;
    const duration = 600; // ms
    const startTime = performance.now();

    const animateNumber = (now: number) => {
      const progress = Math.min(1, (now - startTime) / duration);
      // ease-out cubic
      const ease = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(start + diff * ease);
      setDisplayBalance(current);

      if (progress < 1) {
        requestAnimationFrame(animateNumber);
      } else {
        setDisplayBalance(end);
      }
    };

    requestAnimationFrame(animateNumber);
  }, [balance]);

  return (
    <>
      <header className="sticky top-0 z-30 bg-[#244828]/95 backdrop-blur-md border-b border-[#3b7340] text-amber-50 px-3 py-2.5 shadow-lg font-['Nunito']">
        <div className="max-w-xl mx-auto flex flex-col gap-2">
          {/* Row 1: Profile & Currencies */}
          <div className="flex items-center justify-between gap-2">
            {/* Farmer Profile Badge */}
            <div className="flex items-center gap-2 min-w-0">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 p-0.5 shadow-md flex items-center justify-center font-bold text-lg text-amber-950 border border-amber-300">
                  {userName ? userName.charAt(0).toUpperCase() : "👨‍🌾"}
                </div>
                <div className="absolute -bottom-1 -right-1 bg-emerald-600 text-[10px] font-black px-1.5 py-0.2 rounded-full border border-emerald-300 text-white shadow">
                  L{level}
                </div>
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-1">
                  <span className="font-['Fredoka'] font-semibold text-sm truncate max-w-[120px] text-amber-100">
                    {userName}
                  </span>
                  <span className="text-[10px] bg-amber-900/60 text-amber-300 px-1.5 py-0.5 rounded font-medium border border-amber-700/50 hidden sm:inline-block">
                    {gameState?.tag || "Агроном"}
                  </span>
                </div>

                {/* XP Progress Bar */}
                <div className="flex items-center gap-1.5 mt-0.5">
                  <div className="w-24 h-2 bg-emerald-950/80 rounded-full overflow-hidden border border-emerald-700/60 p-[1px]">
                    <motion.div
                      className="h-full bg-gradient-to-r from-yellow-400 to-emerald-400 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${xpPercentage}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                  <span className="text-[10px] text-emerald-200 font-bold">
                    {xp}/{nextXp} XP
                  </span>
                </div>
              </div>
            </div>

            {/* Currencies & Controls */}
            <div className="flex items-center gap-2">
              {/* Coins Counter with Animated Floating Floaters */}
              <div className="relative flex items-center gap-1 bg-[#1a351d] px-2.5 py-1 rounded-xl border border-amber-500/40 shadow-inner">
                <Coins className="w-4 h-4 text-amber-400 fill-amber-400 animate-pulse" />
                <span className="font-['Fredoka'] font-bold text-sm text-amber-300 tracking-wide">
                  {displayBalance.toLocaleString()}
                </span>

                {/* Floating coin increases */}
                <AnimatePresence>
                  {floatingCoins.map((coin) => (
                    <motion.div
                      key={coin.id}
                      initial={{ opacity: 1, y: 0, scale: 0.9 }}
                      animate={{ opacity: 0, y: -24, scale: 1.2 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 1.2, ease: "easeOut" }}
                      onAnimationComplete={() => clearFloatingCoin(coin.id)}
                      className="absolute -top-3 right-0 font-['Fredoka'] font-extrabold text-xs text-yellow-300 bg-amber-950/90 px-1.5 py-0.5 rounded-full border border-yellow-400 pointer-events-none shadow-lg whitespace-nowrap z-50 flex items-center gap-0.5"
                    >
                      +🪙 {coin.amount}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              {/* Gems */}
              <div className="flex items-center gap-1 bg-[#1a351d] px-2 py-1 rounded-xl border border-cyan-500/40 shadow-inner">
                <Gem className="w-3.5 h-3.5 text-cyan-400 fill-cyan-400" />
                <span className="font-['Fredoka'] font-bold text-xs text-cyan-200">{gems}</span>
              </div>

              {/* Quick Actions (Audio / Refresh) */}
              <div className="flex items-center gap-1">
                <button
                  id="btn-toggle-sound"
                  onClick={() => {
                    triggerHaptic("light");
                    toggleSound();
                  }}
                  className="p-1.5 rounded-lg bg-emerald-900/60 hover:bg-emerald-800/80 active:scale-95 text-amber-200 border border-emerald-700/50 transition-all"
                  title={soundEnabled ? "Вимкнути звук" : "Увімкнути звук"}
                >
                  {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5 text-red-300" />}
                </button>

                <button
                  id="btn-refresh-state"
                  onClick={() => {
                    triggerHaptic("light");
                    onRefresh();
                  }}
                  disabled={isRefreshing}
                  className={`p-1.5 rounded-lg bg-emerald-900/60 hover:bg-emerald-800/80 active:scale-95 text-amber-200 border border-emerald-700/50 transition-all ${
                    isRefreshing ? "opacity-50 animate-spin" : ""
                  }`}
                  title="Оновити дані"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Row 2: Secondary Quick Status Bar (Interactive Storage & Tag) */}
          <div className="flex items-center justify-between text-[11px] bg-[#1a331c]/90 px-2.5 py-1 rounded-lg border border-emerald-800/60">
            <button
              id="btn-open-storage"
              onClick={() => {
                triggerHaptic("light");
                setIsStorageOpen(true);
              }}
              className="flex items-center gap-1.5 text-emerald-200 hover:text-amber-200 transition-colors group cursor-pointer"
            >
              <Package className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform" />
              <span className="font-semibold underline decoration-dashed">Склад:</span>
              <span className="font-bold text-amber-200 group-hover:text-yellow-300">
                {storageUsed}/{storageMax} од.
              </span>
              <span className="text-[10px] bg-amber-500/20 text-yellow-300 px-1.5 py-0.2 rounded border border-amber-500/40 ml-1">
                Відкрити 📦
              </span>
            </button>

            <div className="flex items-center gap-1 text-amber-300 font-medium">
              <Sparkles className="w-3 h-3 text-amber-400 animate-spin-slow" />
              <span className="truncate">{gameState?.business.level_name || "Ферма А-11"}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Storage & Barn Inspector Modal */}
      <StorageModal isOpen={isStorageOpen} onClose={() => setIsStorageOpen(false)} />
    </>
  );
};
