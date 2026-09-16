import React from "react";
import { useGameStore } from "../../store/gameStore";
import { triggerHaptic } from "../../services/telegram";
import { X, Package, Warehouse, Wheat, Egg, Milk, Beef, ShieldAlert, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export const StorageModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
}) => {
  const { gameState, setActiveTab } = useGameStore();

  if (!isOpen || !gameState) return null;

  const farm = gameState.farm;
  const wheat = gameState.wheat;
  const feed = gameState.economy.feed_stock;
  const seeds = gameState.economy.seed_stock;
  const storage = gameState.economy.storage;

  // Farm products
  const products = [
    { name: "Курячі яйця", icon: "🥚", count: farm.chickens.eggs, unit: "шт." },
    { name: "Свіже молоко", icon: "🥛", count: farm.cows.milk, unit: "л" },
    { name: "Крафтовий сир", icon: "🧀", count: farm.cows.cheese, unit: "шт." },
    { name: "Свіже м'ясо", icon: "🥩", count: farm.pigs.meat, unit: "кг" },
    { name: "Фермерське сало", icon: "🥓", count: (farm as any).lard ?? 0, unit: "кг" },
    { name: "Картопля", icon: "🥔", count: farm.potato.count, unit: "кг" },
    { name: "Страусине пір'я", icon: "🪶", count: farm.ostriches.feathers, unit: "шт." },
    { name: "Страусині яйця", icon: "🥚", count: farm.ostriches.eggs, unit: "шт." },
  ];

  // Feed & Seeds
  const stocks = [
    { name: "Фуражне зерно", icon: "🌾", count: feed.grain, unit: "порцій", desc: "Для курей та курчат" },
    { name: "Лугове сіно", icon: "🌿", count: feed.hay, unit: "порцій", desc: "Для корів та свиней" },
    { name: "Преміум комбікорм", icon: "🥣", count: feed.premium, unit: "порцій", desc: "Для страусів" },
    { name: "Насіння картоплі", icon: "🥔", count: seeds.potato, unit: "шт.", desc: "Для картопляного поля" },
    { name: "Насіння пшениці", icon: "🌱", count: seeds.wheat, unit: "шт.", desc: "Для посіву 16 ділянок" },
  ];

  // Animals count
  const animals = [
    { name: "Кури-несучки", icon: "🐔", count: farm.chickens.count },
    { name: "Півні", icon: "🐓", count: farm.chickens.roosters },
    { name: "Курчата", icon: "🐤", count: farm.chickens.chicks },
    { name: "Свині", icon: "🐷", count: farm.pigs.count },
    { name: "Дійні корови", icon: "🐄", count: farm.cows.count },
    { name: "Страуси", icon: "🦤", count: farm.ostriches.count },
  ];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/75 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 15 }}
          className="bg-[#1f3f22] border-2 border-amber-500/80 rounded-3xl w-full max-w-lg max-h-[85vh] flex flex-col shadow-2xl overflow-hidden text-amber-50 font-['Nunito']"
        >
          {/* Modal Header */}
          <div className="p-4 bg-gradient-to-r from-[#2a552e] to-[#1a381c] border-b border-emerald-700/60 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-400 flex items-center justify-center text-2xl shadow-inner">
                📦
              </div>
              <div>
                <h3 className="font-['Fredoka'] font-bold text-lg text-yellow-300 leading-tight">
                  Склад та Комори Ферми
                </h3>
                <p className="text-xs text-emerald-200">
                  Повний облік вашої продукції, кормів та насіння
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                triggerHaptic("light");
                onClose();
              }}
              className="p-1.5 rounded-xl bg-emerald-900/60 hover:bg-emerald-800 text-amber-200 border border-emerald-600 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="p-4 overflow-y-auto flex flex-col gap-4">
            {/* 🌾 Granary / Elevator Quick Card */}
            <div className="bg-[#152e17] rounded-2xl p-3.5 border border-amber-600/50 shadow-md">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <Warehouse className="w-5 h-5 text-amber-400" />
                  <span className="font-['Fredoka'] font-bold text-sm text-yellow-200">
                    Елеватор пшениці
                  </span>
                </div>
                <span className="font-['Fredoka'] font-bold text-sm text-amber-300">
                  {wheat.granary_used.toLocaleString()} / {wheat.granary_max.toLocaleString()} т
                </span>
              </div>
              <div className="w-full h-2.5 bg-emerald-950 rounded-full overflow-hidden border border-amber-700/40">
                <div
                  className="h-full bg-gradient-to-r from-yellow-400 to-amber-500 rounded-full transition-all"
                  style={{
                    width: `${Math.min(100, Math.round((wheat.granary_used / (wheat.granary_max || 1)) * 100))}%`,
                  }}
                />
              </div>
            </div>

            {/* 📦 Ready Farm Products */}
            <div className="bg-[#18351a] rounded-2xl p-3.5 border border-emerald-700/60 flex flex-col gap-2.5">
              <div className="flex items-center justify-between border-b border-emerald-800 pb-1.5">
                <h4 className="font-['Fredoka'] font-bold text-sm text-amber-200 flex items-center gap-1.5">
                  <Package className="w-4 h-4 text-amber-400" /> Готова продукція для ринку
                </h4>
                <button
                  onClick={() => {
                    triggerHaptic("medium");
                    onClose();
                    setActiveTab("market");
                  }}
                  className="text-[11px] font-bold text-amber-300 hover:text-yellow-200 underline"
                >
                  Перейти на ринок →
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {products.map((item, idx) => (
                  <div
                    key={idx}
                    className={`p-2.5 rounded-xl border flex flex-col items-center text-center transition-all ${
                      item.count > 0
                        ? "bg-[#204323] border-amber-400/50 shadow-sm"
                        : "bg-[#142817]/60 border-emerald-950 opacity-60"
                    }`}
                  >
                    <span className="text-2xl mb-0.5">{item.icon}</span>
                    <span className="text-[11px] text-emerald-100 font-semibold truncate w-full">
                      {item.name}
                    </span>
                    <span className="font-['Fredoka'] font-bold text-sm text-yellow-300 mt-0.5">
                      {item.count.toLocaleString()} <span className="text-[10px] text-emerald-300 font-normal">{item.unit}</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* 🥣 Feeds & Seeds Stock */}
            <div className="bg-[#18351a] rounded-2xl p-3.5 border border-emerald-700/60 flex flex-col gap-2.5">
              <div className="flex items-center justify-between border-b border-emerald-800 pb-1.5">
                <h4 className="font-['Fredoka'] font-bold text-sm text-amber-200 flex items-center gap-1.5">
                  🥣 Корми та Посівний фонд
                </h4>
                <button
                  onClick={() => {
                    triggerHaptic("medium");
                    onClose();
                    setActiveTab("shop");
                  }}
                  className="text-[11px] font-bold text-amber-300 hover:text-yellow-200 underline"
                >
                  Поповнити в крамниці →
                </button>
              </div>

              <div className="flex flex-col gap-2">
                {stocks.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-[#204323] border border-emerald-700/60"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-2xl">{item.icon}</span>
                      <div>
                        <div className="font-['Fredoka'] font-bold text-xs text-amber-100">
                          {item.name}
                        </div>
                        <div className="text-[10px] text-emerald-300">{item.desc}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-['Fredoka'] font-bold text-sm text-yellow-300">
                        {item.count.toLocaleString()}
                      </span>
                      <span className="text-[10px] text-emerald-300 ml-1">{item.unit}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 🐾 Livestock Summary */}
            <div className="bg-[#18351a] rounded-2xl p-3.5 border border-emerald-700/60 flex flex-col gap-2">
              <h4 className="font-['Fredoka'] font-bold text-sm text-amber-200 flex items-center gap-1.5 border-b border-emerald-800 pb-1.5">
                🐾 Поголів'я на фермі
              </h4>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {animals.map((a, idx) => (
                  <div
                    key={idx}
                    className="p-2 rounded-xl bg-[#204323] border border-emerald-700/50 flex flex-col items-center text-center"
                  >
                    <span className="text-xl">{a.icon}</span>
                    <span className="text-[10px] text-emerald-200 font-medium truncate w-full">{a.name}</span>
                    <span className="font-['Fredoka'] font-bold text-xs text-yellow-300">{a.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="p-3 bg-[#173319] border-t border-emerald-800/80 flex items-center justify-end">
            <button
              onClick={() => {
                triggerHaptic("light");
                onClose();
              }}
              className="px-5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-amber-950 font-['Fredoka'] font-bold text-xs rounded-xl shadow border border-yellow-200"
            >
              Зрозуміло
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
