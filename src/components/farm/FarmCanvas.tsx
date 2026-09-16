import React, { useState } from "react";
import { useGameStore } from "../../store/gameStore";
import { triggerHaptic } from "../../services/telegram";
import { RoosterSprite, HenSprite, ChickSprite, CowSprite, PigSprite, OstrichSprite, PotatoPlotSprite } from "./sprites/FarmSprites";
import { Sparkles, Utensils, Egg, Plus, Scissors, Milk, Award, Zap, PackageOpen, ArrowRight } from "lucide-react";
import confetti from "canvas-confetti";
import { motion } from "motion/react";
import { StorageModal } from "../ui/StorageModal";

export const FarmCanvas: React.FC<{
  onAction: (actionName: string, params?: Record<string, unknown>) => Promise<void>;
  isLoading?: boolean;
}> = ({ onAction, isLoading = false }) => {
  const { gameState } = useGameStore();

  const [potatoPlantInput, setPotatoPlantInput] = useState<string>("10");
  const [selectedAnimalTab, setSelectedAnimalTab] = useState<"chickens" | "pigs" | "cows" | "ostriches">("chickens");
  const [isStorageModalOpen, setIsStorageModalOpen] = useState(false);

  if (!gameState) return null;

  const farm = gameState.farm;
  const potato = farm.potato;
  const potatoProgress = potato.growth_progress ?? 0;
  const potatoReady = potato.ready ?? false;
  const potatoSeedsAvailable = gameState.economy.seed_stock.potato;
  const grainFeed = gameState.economy.feed_stock.grain;

  const handleMasterCollect = async () => {
    triggerHaptic("heavy");
    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 },
        colors: ["#f59e0b", "#10b981", "#3b82f6", "#ec4899"],
      });
    } catch {}
    await onAction("collect_all");
  };

  const parsedPlantCount = parseInt(potatoPlantInput, 10) || 0;

  return (
    <div className="flex flex-col gap-4 pb-24 max-w-xl mx-auto px-3">
      {/* 🌟 Master Quick Harvest Bar */}
      <div className="bg-gradient-to-r from-amber-700 via-amber-600 to-emerald-700 p-3 rounded-2xl border-2 border-amber-300/60 shadow-lg flex items-center justify-between gap-3 text-white">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-amber-950/40 border border-amber-300/40 flex items-center justify-center text-xl shrink-0 shadow-inner">
            🧺
          </div>
          <div>
            <h3 className="font-['Fredoka'] font-bold text-sm leading-tight text-yellow-100">
              Швидкий збір продукції
            </h3>
            <p className="text-[11px] text-amber-100/90 truncate">
              {potatoReady || farm.chickens.eggs > 0 || farm.cows.milk > 0
                ? "Є готовий врожай та продукти!"
                : "Зібрати всі доступні яйця, молоко та картоплю"}
            </p>
          </div>
        </div>

        <button
          id="btn-master-collect"
          onClick={handleMasterCollect}
          disabled={isLoading}
          className="px-4 py-2 bg-gradient-to-b from-yellow-300 to-amber-400 hover:from-yellow-200 hover:to-amber-300 active:scale-95 text-amber-950 font-['Fredoka'] font-bold text-xs rounded-xl shadow-md border border-yellow-100 transition-all flex items-center gap-1.5 shrink-0"
        >
          <Sparkles className="w-4 h-4 text-amber-900" />
          Зібрати все
        </button>
      </div>

      {/* 📦 Barn Quick View Bar */}
      <div className="bg-[#18361b] rounded-2xl p-3 border border-emerald-700/70 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-2">
          <PackageOpen className="w-5 h-5 text-amber-400" />
          <div>
            <span className="font-['Fredoka'] font-bold text-xs text-yellow-200 block">
              Запаси та Комори
            </span>
            <span className="text-[10px] text-emerald-300">
              🌾 Зерно: <b>{gameState.economy.feed_stock.grain}</b> · 🌿 Сіно: <b>{gameState.economy.feed_stock.hay}</b> · 🥔 Насіння: <b>{potatoSeedsAvailable}</b>
            </span>
          </div>
        </div>
        <button
          onClick={() => setIsStorageModalOpen(true)}
          className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 text-xs font-bold rounded-lg border border-amber-400/50 flex items-center gap-1 transition-all"
        >
          Весь склад <ArrowRight className="w-3 h-3" />
        </button>
      </div>

      {/* 🥔 1. POTATO FIELD SECTION */}
      <section className="bg-[#244527] rounded-3xl p-4 border-2 border-[#3d7a44] shadow-xl relative overflow-hidden">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">🥔</span>
            <div>
              <h2 className="font-['Fredoka'] font-bold text-base text-amber-200">
                Картопляне поле
              </h2>
              <span className="text-[11px] text-emerald-200/80">
                Посаджено: {potato.count} кущів • Насіння в коморі: {potatoSeedsAvailable} шт.
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 bg-[#173019] px-2.5 py-1 rounded-full border border-emerald-600/50 text-xs">
            {potatoReady ? (
              <span className="text-emerald-300 font-bold flex items-center gap-1 animate-pulse">
                <Sparkles className="w-3 h-3" /> Дозріло!
              </span>
            ) : potato.count > 0 ? (
              <span className="text-amber-300 font-semibold text-[11px]">
                {potato.seconds_left ? `Залишилось ${potato.seconds_left}с` : "Росте..."} ({potatoProgress}%)
              </span>
            ) : (
              <span className="text-gray-300 text-[11px]">Поле пусте</span>
            )}
          </div>
        </div>

        {/* Visual Scene for Potato */}
        <div className="relative bg-gradient-to-b from-[#1b3d1f] to-[#142d17] rounded-2xl p-4 border border-emerald-900/80 flex flex-col items-center justify-center my-2 shadow-inner min-h-[140px]">
          <PotatoPlotSprite progress={potatoProgress} ready={potatoReady} />

          {potato.count > 0 && (
            <div className="w-full max-w-xs mt-2">
              <div className="h-2.5 bg-emerald-950 rounded-full overflow-hidden border border-emerald-700/60 p-[1px]">
                <motion.div
                  className={`h-full rounded-full transition-all duration-300 ${
                    potatoReady
                      ? "bg-gradient-to-r from-yellow-400 to-amber-500"
                      : "bg-gradient-to-r from-emerald-500 to-yellow-400"
                  }`}
                  animate={{ width: `${potatoProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Controls for Potato (Direct Input + Max + Action) */}
        <div className="mt-3 flex flex-col gap-2">
          {potatoReady ? (
            <button
              id="btn-harvest-potato"
              onClick={() => {
                triggerHaptic("success");
                onAction("collect_all");
              }}
              disabled={isLoading}
              className="w-full py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 active:scale-95 text-white font-['Fredoka'] font-bold text-sm rounded-2xl shadow-lg border border-emerald-300 flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              Викопати картоплю (+{potato.count * 3} шт.)
            </button>
          ) : (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-[#173019] p-2.5 rounded-2xl border border-emerald-700/60">
              <div className="flex items-center gap-1.5 flex-1">
                <span className="text-xs text-amber-200 font-semibold whitespace-nowrap">
                  Скільки посадити:
                </span>
                <input
                  type="number"
                  min="1"
                  max={potatoSeedsAvailable || 1}
                  value={potatoPlantInput}
                  onChange={(e) => setPotatoPlantInput(e.target.value)}
                  className="w-24 bg-[#0f2111] border border-amber-500/60 text-yellow-300 font-['Fredoka'] font-bold text-center px-2 py-1.5 rounded-xl text-sm focus:outline-none focus:border-yellow-400"
                  placeholder="Кількість"
                />
                <button
                  type="button"
                  onClick={() => setPotatoPlantInput(String(potatoSeedsAvailable))}
                  disabled={potatoSeedsAvailable <= 0}
                  className="px-2 py-1.5 bg-amber-600/30 hover:bg-amber-600/50 text-yellow-300 text-xs font-bold rounded-lg border border-amber-500/50 transition-all"
                >
                  Все ({potatoSeedsAvailable})
                </button>
              </div>

              <button
                id="btn-plant-potato"
                onClick={() => {
                  triggerHaptic("medium");
                  onAction("plant_potato", { count: parsedPlantCount });
                }}
                disabled={isLoading || potatoSeedsAvailable <= 0 || parsedPlantCount <= 0 || potato.count > 0}
                className={`py-2 px-4 rounded-xl font-['Fredoka'] font-bold text-xs shadow-md border flex items-center justify-center gap-1.5 transition-all ${
                  potatoSeedsAvailable > 0 && parsedPlantCount > 0 && potato.count === 0
                    ? "bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 active:scale-95 text-amber-950 border-amber-300"
                    : "bg-gray-800 text-gray-500 border-gray-700 cursor-not-allowed"
                }`}
              >
                🌱 Посадити {parsedPlantCount > 0 ? parsedPlantCount : ""} шт.
              </button>
            </div>
          )}
        </div>
      </section>

      {/* 🐾 2. ANIMALS & LIVESTOCK SECTION */}
      <section className="bg-[#244527] rounded-3xl p-4 border-2 border-[#3d7a44] shadow-xl">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">🐾</span>
            <h2 className="font-['Fredoka'] font-bold text-base text-amber-200">
              Тваринницька ферма
            </h2>
          </div>

          {/* Tab Selector */}
          <div className="flex bg-[#18311a] p-1 rounded-xl border border-emerald-700/60 gap-1">
            {(["chickens", "pigs", "cows", "ostriches"] as const).map((tab) => (
              <button
                key={tab}
                id={`tab-animal-${tab}`}
                onClick={() => {
                  triggerHaptic("light");
                  setSelectedAnimalTab(tab);
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-['Fredoka'] font-bold transition-all ${
                  selectedAnimalTab === tab
                    ? "bg-amber-500 text-amber-950 shadow"
                    : "text-emerald-200 hover:text-amber-100"
                }`}
              >
                {tab === "chickens" && "🐔"}
                {tab === "pigs" && "🐷"}
                {tab === "cows" && "🐄"}
                {tab === "ostriches" && "🦤"}
              </button>
            ))}
          </div>
        </div>

        {/* Active Animal Details */}
        {selectedAnimalTab === "chickens" && (
          <div className="flex flex-col gap-3">
            <div className="bg-[#1b3a1e] rounded-2xl p-3 border border-emerald-800 flex items-center justify-around min-h-[120px]">
              <div className="flex flex-col items-center">
                <HenSprite />
                <span className="text-[11px] text-amber-200 mt-1 font-bold">
                  {farm.chickens.count} курей
                </span>
              </div>
              <div className="flex flex-col items-center">
                <RoosterSprite />
                <span className="text-[11px] text-amber-200 mt-1 font-bold">
                  {farm.chickens.roosters} півнів
                </span>
              </div>
              <div className="flex flex-col items-center">
                <ChickSprite />
                <span className="text-[11px] text-amber-200 mt-1 font-bold">
                  {farm.chickens.chicks} курчат
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                id="btn-breed-chickens"
                onClick={() => {
                  triggerHaptic("medium");
                  onAction("breed");
                }}
                disabled={isLoading || farm.chickens.roosters === 0 || farm.chickens.count === 0}
                className={`py-2 px-3 rounded-xl font-['Fredoka'] font-bold text-xs border flex items-center justify-center gap-1.5 transition-all ${
                  farm.chickens.roosters > 0 && farm.chickens.count > 0
                    ? "bg-[#18311a] hover:bg-[#204323] text-amber-200 border-emerald-600 active:scale-95"
                    : "bg-gray-800/40 text-gray-500 border-gray-700 cursor-not-allowed"
                }`}
              >
                🐓 Розмноження
              </button>

              <button
                id="btn-raise-chicks"
                onClick={() => {
                  triggerHaptic("medium");
                  onAction("raise_chicks");
                }}
                disabled={isLoading || farm.chickens.chicks === 0 || grainFeed < 20}
                className={`py-2 px-3 rounded-xl font-['Fredoka'] font-bold text-xs border flex items-center justify-center gap-1.5 transition-all ${
                  farm.chickens.chicks > 0 && grainFeed >= 20
                    ? "bg-gradient-to-r from-yellow-500 to-amber-500 text-amber-950 border-yellow-300 active:scale-95"
                    : "bg-gray-800/40 text-gray-500 border-gray-700 cursor-not-allowed"
                }`}
              >
                🐤 Виростити ({farm.chickens.chicks})
              </button>
            </div>
          </div>
        )}

        {selectedAnimalTab === "pigs" && (
          <div className="flex flex-col gap-3">
            <div className="bg-[#1b3a1e] rounded-2xl p-4 border border-emerald-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <PigSprite />
                <div>
                  <h4 className="font-['Fredoka'] font-bold text-sm text-amber-100">
                    Свинарник ({farm.pigs.count} голів)
                  </h4>
                  <p className="text-[11px] text-emerald-200">
                    Дають свіже м'ясо та фермерське сало
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-amber-300 font-bold">🥩 {farm.pigs.meat} кг</div>
              </div>
            </div>

            <button
              id="btn-slaughter-pig"
              onClick={() => {
                triggerHaptic("heavy");
                onAction("slaughter", { count: 1 });
              }}
              disabled={isLoading || farm.pigs.count === 0}
              className={`w-full py-2.5 px-3 rounded-xl font-['Fredoka'] font-bold text-xs border flex items-center justify-center gap-1.5 transition-all ${
                farm.pigs.count > 0
                  ? "bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 text-white border-red-400 active:scale-95"
                  : "bg-gray-800/40 text-gray-500 border-gray-700 cursor-not-allowed"
              }`}
            >
              <Scissors className="w-4 h-4" />
              Забій 1 свині (отримати 1 м'ясо + 1 сало)
            </button>
          </div>
        )}

        {selectedAnimalTab === "cows" && (
          <div className="flex flex-col gap-3">
            <div className="bg-[#1b3a1e] rounded-2xl p-4 border border-emerald-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CowSprite />
                <div>
                  <h4 className="font-['Fredoka'] font-bold text-sm text-amber-100">
                    Корівник ({farm.cows.count} корів)
                  </h4>
                  <p className="text-[11px] text-emerald-200">
                    Дають молоко для виробництва сиру
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-amber-300 font-bold">🥛 {farm.cows.milk} л</div>
                <div className="text-xs text-yellow-300 font-bold">🧀 {farm.cows.cheese} шт.</div>
              </div>
            </div>

            <button
              id="btn-make-cheese"
              onClick={() => {
                triggerHaptic("medium");
                onAction("cheese");
              }}
              disabled={isLoading || farm.cows.milk < 10}
              className={`w-full py-2.5 px-3 rounded-xl font-['Fredoka'] font-bold text-xs border flex items-center justify-center gap-1.5 transition-all ${
                farm.cows.milk >= 10
                  ? "bg-gradient-to-r from-amber-500 to-yellow-500 text-amber-950 border-yellow-300 active:scale-95"
                  : "bg-gray-800/40 text-gray-500 border-gray-700 cursor-not-allowed"
              }`}
            >
              🧀 Сироварня (зварити сир із 10 л молока)
            </button>
          </div>
        )}

        {selectedAnimalTab === "ostriches" && (
          <div className="flex flex-col gap-3">
            <div className="bg-[#1b3a1e] rounded-2xl p-4 border border-emerald-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <OstrichSprite />
                <div>
                  <h4 className="font-['Fredoka'] font-bold text-sm text-amber-100">
                    Страусине ранчо ({farm.ostriches.count} голів)
                  </h4>
                  <p className="text-[11px] text-emerald-200">
                    Рідкісні велетенські яйця та цінне пір'я
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-amber-300 font-bold">🪶 {farm.ostriches.feathers} шт.</div>
                <div className="text-xs text-yellow-300 font-bold">🥚 {farm.ostriches.eggs} шт.</div>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Storage Inspector Modal */}
      <StorageModal isOpen={isStorageModalOpen} onClose={() => setIsStorageModalOpen(false)} />
    </div>
  );
};
