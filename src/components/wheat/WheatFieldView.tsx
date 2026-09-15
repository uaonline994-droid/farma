import React from "react";
import { useGameStore } from "../../store/gameStore";
import { triggerHaptic } from "../../services/telegram";
import { WheatTileSprite } from "../farm/sprites/FarmSprites";
import { Wheat, Sparkles, Sprout, Warehouse, Zap, RefreshCw } from "lucide-react";
import confetti from "canvas-confetti";
import { motion } from "motion/react";

export const WheatFieldView: React.FC<{
  onAction: (actionName: string, params?: Record<string, unknown>) => Promise<void>;
  isLoading?: boolean;
}> = ({ onAction, isLoading = false }) => {
  const { gameState } = useGameStore();

  if (!gameState) return null;

  const wheat = gameState.wheat;
  const plots = wheat.plots;
  const wheatSeeds = gameState.economy.seed_stock.wheat;
  const granaryUsed = wheat.granary_used;
  const granaryMax = wheat.granary_max;
  const granaryPercent = Math.min(100, Math.round((granaryUsed / granaryMax) * 100));

  const readyPlotsCount = plots.filter((p) => (p.stage ?? 0) >= 4).length;
  const emptyPlotsCount = plots.filter((p) => p.planted_at === 0).length;

  const handleHarvestAll = async () => {
    triggerHaptic("heavy");
    if (readyPlotsCount > 0) {
      try {
        confetti({
          particleCount: 60,
          spread: 70,
          origin: { y: 0.5 },
          colors: ["#fbbf24", "#f59e0b", "#d97706", "#84cc16"],
        });
      } catch {}
    }
    await onAction("harvest_wheat_all");
  };

  const handlePlantAll = async () => {
    triggerHaptic("medium");
    await onAction("plant_wheat_all");
  };

  return (
    <div className="flex flex-col gap-4 pb-24 max-w-xl mx-auto px-3">
      {/* Top Banner: Granary & Stats */}
      <div className="bg-gradient-to-r from-[#6b471c] to-[#452c11] rounded-3xl p-4 border-2 border-amber-500/70 shadow-xl text-amber-50">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-amber-900/80 border border-amber-400 flex items-center justify-center text-lg shadow-inner">
              🌾
            </div>
            <div>
              <h2 className="font-['Fredoka'] font-bold text-base text-yellow-300 leading-tight">
                Золоті Ниви (Пшеничні поля)
              </h2>
              <span className="text-[11px] text-amber-200/80 font-medium">
                Насіння пшениці в запасі: <strong className="text-yellow-300">{wheatSeeds} шт.</strong>
              </span>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-amber-300 uppercase tracking-wider font-bold">Всього зібрано</span>
            <div className="font-['Fredoka'] font-bold text-sm text-yellow-200">
              🌾 {wheat.total_harvested} снопів
            </div>
          </div>
        </div>

        {/* Granary Storage Bar */}
        <div className="bg-[#24170b] p-3 rounded-2xl border border-amber-700/60 mt-2">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="flex items-center gap-1.5 text-amber-200 font-semibold">
              <Warehouse className="w-4 h-4 text-amber-400" />
              Зерносховище (Елеватор):
            </span>
            <span className="font-['Fredoka'] font-bold text-yellow-300">
              {granaryUsed} / {granaryMax} од. ({granaryPercent}%)
            </span>
          </div>

          <div className="h-3 bg-[#170e06] rounded-full overflow-hidden border border-amber-800 p-[1px]">
            <motion.div
              className={`h-full rounded-full transition-all duration-300 ${
                granaryPercent > 90
                  ? "bg-gradient-to-r from-amber-500 to-red-500"
                  : "bg-gradient-to-r from-amber-500 to-yellow-400"
              }`}
              animate={{ width: `${granaryPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Isometric 4x4 Wheat Field Canvas */}
      <div className="bg-[#1c381f] rounded-3xl p-4 border-2 border-[#3d7a44] shadow-2xl relative overflow-hidden">
        {/* Field Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-['Fredoka'] font-bold text-amber-200">
              Ділянки поля (16 клітинок)
            </span>
          </div>

          <div className="flex items-center gap-2 text-[11px]">
            <span className="bg-emerald-950/80 text-emerald-300 px-2 py-0.5 rounded-lg border border-emerald-700/50">
              🌱 Вільних: {emptyPlotsCount}
            </span>
            <span className="bg-amber-950/80 text-yellow-300 px-2 py-0.5 rounded-lg border border-amber-600/50 font-bold animate-pulse">
              ✨ Готово: {readyPlotsCount}
            </span>
          </div>
        </div>

        {/* 4x4 Grid in cozy Isometric layout */}
        <div className="bg-gradient-to-b from-[#162f18] to-[#0f2111] p-3 rounded-2xl border border-emerald-900/90 shadow-inner">
          <div className="grid grid-cols-4 gap-2 sm:gap-3 py-2">
            {plots.map((plot) => {
              const stage = plot.stage ?? (plot.planted_at === 0 ? 0 : 1);
              return (
                <div key={plot.id} className="flex flex-col items-center">
                  <WheatTileSprite
                    stage={stage}
                    onClick={() => {
                      if (stage >= 4) {
                        triggerHaptic("success");
                        onAction("harvest_wheat_all");
                      } else if (stage === 0 && wheatSeeds > 0) {
                        triggerHaptic("medium");
                        onAction("plant_wheat_all");
                      }
                    }}
                  />
                  <div className="text-[10px] text-amber-200/70 font-mono mt-0.5">
                    {stage === 0 ? (
                      <span className="text-gray-400">Пусто</span>
                    ) : stage >= 4 ? (
                      <span className="text-yellow-300 font-bold">Готово!</span>
                    ) : (
                      <span>{stage}/4</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Buttons: Plant All & Harvest All */}
        <div className="grid grid-cols-2 gap-3 mt-4">
          <button
            id="btn-plant-wheat-all"
            onClick={handlePlantAll}
            disabled={isLoading || emptyPlotsCount === 0 || wheatSeeds === 0}
            className={`py-3 px-3 rounded-2xl font-['Fredoka'] font-bold text-xs shadow-lg border flex items-center justify-center gap-1.5 transition-all ${
              emptyPlotsCount > 0 && wheatSeeds > 0
                ? "bg-gradient-to-r from-amber-700 to-amber-800 hover:from-amber-600 active:scale-95 text-amber-100 border-amber-500/70 shadow-amber-950/50"
                : "bg-gray-800/40 text-gray-500 border-gray-700 cursor-not-allowed"
            }`}
          >
            <Sprout className="w-4 h-4 text-emerald-300" />
            Посадити все ({Math.min(emptyPlotsCount, wheatSeeds)} шт.)
          </button>

          <button
            id="btn-harvest-wheat-all"
            onClick={handleHarvestAll}
            disabled={isLoading || readyPlotsCount === 0}
            className={`py-3 px-3 rounded-2xl font-['Fredoka'] font-bold text-xs shadow-lg border flex items-center justify-center gap-1.5 transition-all ${
              readyPlotsCount > 0
                ? "bg-gradient-to-r from-yellow-400 via-amber-400 to-amber-500 hover:from-yellow-300 active:scale-95 text-amber-950 border-yellow-200 shadow-amber-900/40 animate-pulse"
                : "bg-gray-800/40 text-gray-500 border-gray-700 cursor-not-allowed"
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-900" />
            Зібрати все ({readyPlotsCount})
          </button>
        </div>
      </div>
    </div>
  );
};
