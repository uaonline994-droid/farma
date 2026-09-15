import React, { useState } from "react";
import { useGameStore } from "../../store/gameStore";
import { triggerHaptic } from "../../services/telegram";
import { RoosterSprite, HenSprite, ChickSprite, CowSprite, PigSprite, OstrichSprite, PotatoPlotSprite } from "./sprites/FarmSprites";
import { Sparkles, Utensils, Egg, Plus, Scissors, Milk, Award, Zap } from "lucide-react";
import confetti from "canvas-confetti";
import { motion } from "motion/react";

export const FarmCanvas: React.FC<{
  onAction: (actionName: string, params?: Record<string, unknown>) => Promise<void>;
  isLoading?: boolean;
}> = ({ onAction, isLoading = false }) => {
  const { gameState } = useGameStore();

  const [potatoPlantCount, setPotatoPlantCount] = useState(10);
  const [selectedAnimalTab, setSelectedAnimalTab] = useState<"chickens" | "pigs" | "cows" | "ostriches">("chickens");

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
    await onAction("collect");
  };

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

        {/* Controls for Potato */}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          {potatoReady ? (
            <button
              id="btn-harvest-potato"
              onClick={() => {
                triggerHaptic("success");
                onAction("collect");
              }}
              disabled={isLoading}
              className="w-full py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 active:scale-95 text-white font-['Fredoka'] font-bold text-sm rounded-2xl shadow-lg border border-emerald-300 flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              Викопати картоплю (+{potato.count * 3} шт.)
            </button>
          ) : (
            <div className="w-full flex items-center gap-2">
              <div className="flex items-center bg-[#18311a] rounded-xl border border-emerald-700/60 p-1">
                <button
                  onClick={() => setPotatoPlantCount(Math.max(5, potatoPlantCount - 5))}
                  className="w-7 h-7 bg-emerald-800 hover:bg-emerald-700 active:scale-95 rounded-lg text-white font-bold text-xs"
                >
                  -
                </button>
                <span className="font-['Fredoka'] font-bold text-amber-200 text-xs px-2.5">
                  {potatoPlantCount}
                </span>
                <button
                  onClick={() => setPotatoPlantCount(Math.min(potatoSeedsAvailable, potatoPlantCount + 5))}
                  className="w-7 h-7 bg-emerald-800 hover:bg-emerald-700 active:scale-95 rounded-lg text-white font-bold text-xs"
                >
                  +
                </button>
              </div>

              <button
                id="btn-plant-potato"
                onClick={() => {
                  triggerHaptic("medium");
                  onAction("plant_potato", { count: potatoPlantCount });
                }}
                disabled={isLoading || potatoSeedsAvailable < potatoPlantCount}
                className={`flex-1 py-2.5 px-3 rounded-2xl font-['Fredoka'] font-bold text-xs shadow-md border flex items-center justify-center gap-1.5 transition-all ${
                  potatoSeedsAvailable >= potatoPlantCount
                    ? "bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 active:scale-95 text-amber-50 border-amber-400/60"
                    : "bg-gray-700/50 text-gray-400 border-gray-600 cursor-not-allowed"
                }`}
              >
                <Plus className="w-4 h-4 text-amber-300" />
                Посадити картоплю ({potatoPlantCount} шт.)
              </button>
            </div>
          )}
        </div>
      </section>

      {/* 🐾 2. ANIMAL RANCH SECTION */}
      <section className="bg-[#244527] rounded-3xl p-4 border-2 border-[#3d7a44] shadow-xl">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">🏡</span>
            <h2 className="font-['Fredoka'] font-bold text-base text-amber-200">
              Тваринницька ферма
            </h2>
          </div>
        </div>

        {/* Animal Category Tabs */}
        <div className="grid grid-cols-4 gap-1.5 p-1 bg-[#18311a] rounded-2xl border border-emerald-800/80 mb-3">
          {[
            {
              id: "chickens",
              label: "Кури",
              icon: "🐔",
              count: farm.chickens.count + farm.chickens.roosters + farm.chickens.chicks,
            },
            { id: "pigs", label: "Свині", icon: "🐖", count: farm.pigs.count },
            { id: "cows", label: "Корови", icon: "🐄", count: farm.cows.count },
            { id: "ostriches", label: "Страуси", icon: "🦤", count: farm.ostriches.count },
          ].map((cat) => {
            const isSelected = selectedAnimalTab === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => {
                  triggerHaptic("light");
                  setSelectedAnimalTab(cat.id as any);
                }}
                className={`py-1.5 px-1 rounded-xl text-xs font-['Fredoka'] font-bold flex flex-col items-center gap-0.5 transition-all ${
                  isSelected
                    ? "bg-gradient-to-b from-amber-500 to-amber-600 text-amber-950 shadow-md border border-amber-300"
                    : "text-emerald-200/80 hover:bg-emerald-800/40"
                }`}
              >
                <span className="text-base leading-none">{cat.icon}</span>
                <span className="text-[10px] tracking-tight">{cat.label} ({cat.count})</span>
              </button>
            );
          })}
        </div>

        {/* ACTIVE ANIMAL PEN VIEW */}
        <div className="bg-[#1b3a1e] rounded-2xl p-4 border border-emerald-900/90 shadow-inner">
          {/* TAB 1: CHICKENS */}
          {selectedAnimalTab === "chickens" && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between text-xs text-amber-100">
                <span className="font-semibold">Курник "Ряба"</span>
                <span className="text-amber-300 font-bold bg-amber-950/60 px-2 py-0.5 rounded-md border border-amber-700/40">
                  Яєць у гніздах: 🥚 {farm.chickens.eggs} шт.
                </span>
              </div>

              {/* Dynamic Visual Scene displaying actual animal counts */}
              <div className="min-h-[140px] bg-gradient-to-b from-[#214a26] to-[#19381c] rounded-xl border border-emerald-700/40 relative overflow-hidden flex items-end justify-around px-2 pb-2 gap-1 flex-wrap">
                {farm.chickens.count === 0 && farm.chickens.roosters === 0 && farm.chickens.chicks === 0 ? (
                  <div className="w-full text-center py-6 text-xs text-amber-200/70">
                    <p className="font-bold text-yellow-300">Курник пустий 🌾</p>
                    <p className="text-[11px] text-emerald-300/80 mt-0.5">
                      Купіть курей та півня у вкладці <b>Крамниця</b>!
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Render Roosters */}
                    {Array.from({ length: Math.min(2, farm.chickens.roosters) }).map((_, i) => (
                      <RoosterSprite key={`rooster-${i}`} className="w-18 h-18" />
                    ))}
                    {/* Render Hens */}
                    {Array.from({ length: Math.min(3, farm.chickens.count) }).map((_, i) => (
                      <HenSprite key={`hen-${i}`} className="w-16 h-16" />
                    ))}
                    {/* Render Chicks (Yellow fluffy) */}
                    {Array.from({ length: Math.min(3, farm.chickens.chicks) }).map((_, i) => (
                      <ChickSprite key={`chick-${i}`} className="w-12 h-12" />
                    ))}
                  </>
                )}
              </div>

              {/* Stats badges */}
              <div className="grid grid-cols-3 gap-2 text-center text-[11px] bg-[#142b17] p-2 rounded-xl border border-emerald-800/50">
                <div className="flex flex-col items-center">
                  <div className="text-emerald-300 flex items-center gap-1">🐔 Кури-несучки</div>
                  <div className="font-bold text-amber-200 font-['Fredoka'] text-sm">{farm.chickens.count}</div>
                </div>
                <div className="flex flex-col items-center">
                  <div className="text-emerald-300 flex items-center gap-1">🐓 Півні</div>
                  <div className="font-bold text-amber-200 font-['Fredoka'] text-sm">{farm.chickens.roosters}</div>
                </div>
                <div className="flex flex-col items-center">
                  <div className="text-emerald-300 flex items-center gap-1">🐤 Курчата</div>
                  <div className="font-bold text-yellow-300 font-['Fredoka'] text-sm">{farm.chickens.chicks}</div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  id="btn-breed-chickens"
                  onClick={() => {
                    triggerHaptic("medium");
                    onAction("breed");
                  }}
                  disabled={isLoading || farm.chickens.roosters === 0 || farm.chickens.count === 0}
                  className={`py-2 px-2 rounded-xl text-xs font-['Fredoka'] font-semibold border flex items-center justify-center gap-1 transition-all ${
                    farm.chickens.roosters > 0 && farm.chickens.count > 0
                      ? "bg-amber-800/80 hover:bg-amber-700 text-amber-100 border-amber-600/50 active:scale-95"
                      : "bg-gray-800/40 text-gray-500 border-gray-700 cursor-not-allowed"
                  }`}
                >
                  <Egg className="w-3.5 h-3.5 text-amber-300" />
                  Висидіти курчат
                </button>

                {farm.chickens.chicks > 0 ? (
                  <button
                    id="btn-raise-chicks"
                    onClick={() => {
                      triggerHaptic("success");
                      onAction("raise_chicks");
                    }}
                    disabled={isLoading}
                    className="py-2 px-2 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 text-white rounded-xl text-xs font-['Fredoka'] font-bold border border-emerald-400 active:scale-95 flex items-center justify-center gap-1 shadow"
                  >
                    <Zap className="w-3.5 h-3.5 text-yellow-300" />
                    Виростити ({farm.chickens.chicks} курчат)
                  </button>
                ) : (
                  <button
                    id="btn-collect-eggs"
                    onClick={() => {
                      triggerHaptic("success");
                      onAction("collect");
                    }}
                    disabled={isLoading || farm.chickens.eggs === 0}
                    className={`py-2 px-2 rounded-xl text-xs font-['Fredoka'] font-bold border flex items-center justify-center gap-1 transition-all ${
                      farm.chickens.eggs > 0
                        ? "bg-gradient-to-r from-yellow-400 to-amber-500 text-amber-950 border-yellow-200 active:scale-95 shadow"
                        : "bg-gray-800/40 text-gray-500 border-gray-700 cursor-not-allowed"
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Зібрати яйця ({farm.chickens.eggs})
                  </button>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: PIGS */}
          {selectedAnimalTab === "pigs" && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between text-xs text-amber-100">
                <span className="font-semibold">Свинарник "Веселий П'ятачок"</span>
                <span className="text-pink-300 font-bold bg-pink-950/60 px-2 py-0.5 rounded-md border border-pink-700/40">
                  М'ясо в коморі: 🥩 {farm.pigs.meat} кг
                </span>
              </div>

              <div className="min-h-[140px] bg-gradient-to-b from-[#214a26] to-[#19381c] rounded-xl border border-emerald-700/40 relative overflow-hidden flex items-end justify-around px-2 pb-2">
                {farm.pigs.count === 0 ? (
                  <div className="w-full text-center py-6 text-xs text-amber-200/70">
                    <p className="font-bold text-yellow-300">Свинарник пустий 🌾</p>
                    <p className="text-[11px] text-emerald-300/80 mt-0.5">
                      Купіть свиней у вкладці <b>Крамниця</b>!
                    </p>
                  </div>
                ) : (
                  Array.from({ length: Math.min(3, farm.pigs.count) }).map((_, i) => (
                    <PigSprite key={`pig-${i}`} className="w-24 h-24" />
                  ))
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 text-center text-[11px] bg-[#142b17] p-2 rounded-xl border border-emerald-800/50">
                <div>
                  <div className="text-emerald-300">Свиней на фермі</div>
                  <div className="font-bold text-amber-200 font-['Fredoka'] text-sm">{farm.pigs.count}</div>
                </div>
                <div>
                  <div className="text-emerald-300">Запаси м'яса</div>
                  <div className="font-bold text-pink-300 font-['Fredoka'] text-sm">{farm.pigs.meat} кг</div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-2">
                <button
                  id="btn-slaughter-pig"
                  onClick={() => {
                    triggerHaptic("heavy");
                    onAction("slaughter", { count: 1 });
                  }}
                  disabled={isLoading || farm.pigs.count <= 0}
                  className={`py-2 px-2 rounded-xl text-xs font-['Fredoka'] font-bold border flex items-center justify-center gap-1 transition-all ${
                    farm.pigs.count > 0
                      ? "bg-red-800/80 hover:bg-red-700 text-red-100 border-red-500/60 active:scale-95"
                      : "bg-gray-800/40 text-gray-500 border-gray-700 cursor-not-allowed"
                  }`}
                >
                  <Scissors className="w-3.5 h-3.5 text-red-300" />
                  Забій 1 свині (+18 кг м'яса)
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: COWS */}
          {selectedAnimalTab === "cows" && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between text-xs text-amber-100">
                <span className="font-semibold">Корівник "Зорька"</span>
                <div className="flex items-center gap-2">
                  <span className="text-cyan-300 font-bold bg-cyan-950/60 px-2 py-0.5 rounded-md border border-cyan-700/40">
                    🥛 {farm.cows.milk} л
                  </span>
                  <span className="text-yellow-300 font-bold bg-amber-950/60 px-2 py-0.5 rounded-md border border-amber-700/40">
                    🧀 {farm.cows.cheese} шт.
                  </span>
                </div>
              </div>

              <div className="min-h-[140px] bg-gradient-to-b from-[#214a26] to-[#19381c] rounded-xl border border-emerald-700/40 relative overflow-hidden flex items-end justify-center px-2 pb-2">
                {farm.cows.count === 0 ? (
                  <div className="w-full text-center py-6 text-xs text-amber-200/70">
                    <p className="font-bold text-yellow-300">Корівник пустий 🌾</p>
                    <p className="text-[11px] text-emerald-300/80 mt-0.5">
                      Купіть дійних корів у вкладці <b>Крамниця</b>!
                    </p>
                  </div>
                ) : (
                  Array.from({ length: Math.min(2, farm.cows.count) }).map((_, i) => (
                    <CowSprite key={`cow-${i}`} className="w-28 h-28" />
                  ))
                )}
              </div>

              <div className="grid grid-cols-3 gap-2 text-center text-[11px] bg-[#142b17] p-2 rounded-xl border border-emerald-800/50">
                <div>
                  <div className="text-emerald-300">Дійні корови</div>
                  <div className="font-bold text-amber-200 font-['Fredoka'] text-sm">{farm.cows.count}</div>
                </div>
                <div>
                  <div className="text-emerald-300">Молоко</div>
                  <div className="font-bold text-cyan-200 font-['Fredoka'] text-sm">{farm.cows.milk} л</div>
                </div>
                <div>
                  <div className="text-emerald-300">Сир готовий</div>
                  <div className="font-bold text-yellow-300 font-['Fredoka'] text-sm">{farm.cows.cheese}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  id="btn-make-cheese"
                  onClick={() => {
                    triggerHaptic("success");
                    onAction("cheese", { count: 1 });
                  }}
                  disabled={isLoading || farm.cows.milk < 3}
                  className={`py-2 px-2 rounded-xl text-xs font-['Fredoka'] font-bold border flex items-center justify-center gap-1 transition-all ${
                    farm.cows.milk >= 3
                      ? "bg-gradient-to-r from-amber-500 to-yellow-500 text-amber-950 border-yellow-200 active:scale-95 shadow"
                      : "bg-gray-800/40 text-gray-500 border-gray-700 cursor-not-allowed"
                  }`}
                >
                  <Award className="w-3.5 h-3.5" />
                  Зварити сир (3 л)
                </button>

                <button
                  id="btn-collect-milk"
                  onClick={() => {
                    triggerHaptic("medium");
                    onAction("collect");
                  }}
                  disabled={isLoading || farm.cows.milk === 0}
                  className={`py-2 px-2 rounded-xl text-xs font-['Fredoka'] font-bold border flex items-center justify-center gap-1 transition-all ${
                    farm.cows.milk > 0
                      ? "bg-cyan-800/80 hover:bg-cyan-700 text-cyan-100 border-cyan-500/60 active:scale-95"
                      : "bg-gray-800/40 text-gray-500 border-gray-700 cursor-not-allowed"
                  }`}
                >
                  <Milk className="w-3.5 h-3.5 text-cyan-300" />
                  Зібрати в комору
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: OSTRICHES */}
          {selectedAnimalTab === "ostriches" && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between text-xs text-amber-100">
                <span className="font-semibold">Вольєр страусів "Сафарі"</span>
                <span className="text-amber-300 font-bold bg-amber-950/60 px-2 py-0.5 rounded-md border border-amber-700/40">
                  🪶 {farm.ostriches.feathers} пір'їн • 🥚 {farm.ostriches.eggs} яєць
                </span>
              </div>

              <div className="min-h-[140px] bg-gradient-to-b from-[#214a26] to-[#19381c] rounded-xl border border-emerald-700/40 relative overflow-hidden flex items-end justify-center px-2 pb-2">
                {farm.ostriches.count === 0 ? (
                  <div className="w-full text-center py-6 text-xs text-amber-200/70">
                    <p className="font-bold text-yellow-300">Вольєр пустий 🌾</p>
                    <p className="text-[11px] text-emerald-300/80 mt-0.5">
                      Купіть страусів у вкладці <b>Крамниця</b>!
                    </p>
                  </div>
                ) : (
                  Array.from({ length: Math.min(2, farm.ostriches.count) }).map((_, i) => (
                    <OstrichSprite key={`ostrich-${i}`} className="w-28 h-32" />
                  ))
                )}
              </div>

              <div className="grid grid-cols-3 gap-2 text-center text-[11px] bg-[#142b17] p-2 rounded-xl border border-emerald-800/50">
                <div>
                  <div className="text-emerald-300">Страуси</div>
                  <div className="font-bold text-amber-200 font-['Fredoka'] text-sm">{farm.ostriches.count}</div>
                </div>
                <div>
                  <div className="text-emerald-300">Пір'я</div>
                  <div className="font-bold text-amber-200 font-['Fredoka'] text-sm">{farm.ostriches.feathers}</div>
                </div>
                <div>
                  <div className="text-emerald-300">Яйця (велетні)</div>
                  <div className="font-bold text-amber-200 font-['Fredoka'] text-sm">{farm.ostriches.eggs}</div>
                </div>
              </div>

              <button
                id="btn-collect-ostrich"
                onClick={() => {
                  triggerHaptic("success");
                  onAction("collect");
                }}
                disabled={isLoading || (farm.ostriches.feathers === 0 && farm.ostriches.eggs === 0)}
                className={`w-full py-2.5 rounded-xl text-xs font-['Fredoka'] font-bold border flex items-center justify-center gap-1.5 transition-all ${
                  farm.ostriches.feathers > 0 || farm.ostriches.eggs > 0
                    ? "bg-gradient-to-r from-amber-600 to-orange-600 text-white border-amber-300 active:scale-95 shadow"
                    : "bg-gray-800/40 text-gray-500 border-gray-700 cursor-not-allowed"
                }`}
              >
                <Sparkles className="w-4 h-4 text-yellow-300" />
                Зібрати продукцію страусів
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
