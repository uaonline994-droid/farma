import React, { useState } from "react";
import { useGameStore } from "../../store/gameStore";
import { triggerHaptic } from "../../services/telegram";
import { Coins, TrendingUp, DollarSign, Store, Sparkles } from "lucide-react";
import confetti from "canvas-confetti";

interface MarketProductItem {
  id: string;
  type: "product" | "animal" | "wheat";
  name: string;
  icon: string;
  unit: string;
  desc: string;
  getStock: (state: any) => number;
  price: number;
}

const MARKET_ITEMS: MarketProductItem[] = [
  // 🧺 Продукція
  {
    id: "eggs",
    type: "product",
    name: "Курячі яйця",
    icon: "🥚",
    unit: "шт.",
    desc: "Свіжі яйця з курника",
    getStock: (s) => s.farm.chickens.eggs,
    price: 30,
  },
  {
    id: "potato",
    type: "product",
    name: "Картопля",
    icon: "🥔",
    unit: "кг",
    desc: "Викопаний врожай з поля",
    getStock: (s) => s.farm.potato.count,
    price: 70,
  },
  {
    id: "milk",
    type: "product",
    name: "Свіже молоко",
    icon: "🥛",
    unit: "л",
    desc: "Натуральне коров'яче молоко",
    getStock: (s) => s.farm.cows.milk,
    price: 200,
  },
  {
    id: "meat",
    type: "product",
    name: "Свіже м'ясо",
    icon: "🥩",
    unit: "кг",
    desc: "Відбірна свинина з ферми",
    getStock: (s) => s.farm.pigs.meat,
    price: 150,
  },
  {
    id: "cheese",
    type: "product",
    name: "Домашній сир",
    icon: "🧀",
    unit: "шт.",
    desc: "Крафтовий витриманий сир",
    getStock: (s) => s.farm.cows.cheese,
    price: 1200,
  },
  {
    id: "feather",
    type: "product",
    name: "Страусине пір'я",
    icon: "🪶",
    unit: "шт.",
    desc: "Цінне декоративне пір'я",
    getStock: (s) => s.farm.ostriches.feathers,
    price: 550,
  },
  {
    id: "ostrich_egg",
    type: "product",
    name: "Страусине яйце",
    icon: "🥚",
    unit: "шт.",
    desc: "Рідкісне велетенське яйце",
    getStock: (s) => s.farm.ostriches.eggs,
    price: 2200,
  },
  {
    id: "wheat",
    type: "wheat",
    name: "Снопи пшениці",
    icon: "🌾",
    unit: "т",
    desc: "Зерно з елеватора",
    getStock: (s) => s.wheat.granary_used,
    price: 45,
  },

  // 🐾 Тварини
  {
    id: "chick",
    type: "animal",
    name: "Продати курчат",
    icon: "🐤",
    unit: "голів",
    desc: "Молодняк курчат",
    getStock: (s) => s.farm.chickens.chicks,
    price: 40,
  },
  {
    id: "chicken",
    type: "animal",
    name: "Продати курей",
    icon: "🐔",
    unit: "голів",
    desc: "Дорослі кури-несучки",
    getStock: (s) => s.farm.chickens.count,
    price: 60,
  },
  {
    id: "rooster",
    type: "animal",
    name: "Продати півнів",
    icon: "🐓",
    unit: "голів",
    desc: "Півні з курника",
    getStock: (s) => s.farm.chickens.roosters,
    price: 180,
  },
  {
    id: "pig",
    type: "animal",
    name: "Продати свиней",
    icon: "🐖",
    unit: "голів",
    desc: "Дорослі свині",
    getStock: (s) => s.farm.pigs.count,
    price: 280,
  },
  {
    id: "cow",
    type: "animal",
    name: "Продати корів",
    icon: "🐄",
    unit: "голів",
    desc: "Дійні корови",
    getStock: (s) => s.farm.cows.count,
    price: 600,
  },
  {
    id: "ostrich",
    type: "animal",
    name: "Продати страусів",
    icon: "🦤",
    unit: "голів",
    desc: "Страуси з вольєра",
    getStock: (s) => s.farm.ostriches.count,
    price: 4000,
  },
];

export const MarketView: React.FC<{
  onAction: (actionName: string, params?: Record<string, unknown>) => Promise<void>;
  isLoading?: boolean;
}> = ({ onAction, isLoading = false }) => {
  const { gameState } = useGameStore();
  const [selectedFilter, setSelectedFilter] = useState<"all" | "product" | "animal">("all");
  const [sellInputs, setSellInputs] = useState<Record<string, string>>({});

  if (!gameState) return null;

  const handleSell = async (item: MarketProductItem) => {
    const rawVal = sellInputs[item.id];
    const available = item.getStock(gameState);
    const count = parseInt(rawVal || String(available), 10) || 0;
    if (count <= 0 || count > available) return;

    triggerHaptic("heavy");
    try {
      confetti({
        particleCount: 30,
        spread: 50,
        origin: { y: 0.65 },
        colors: ["#ffd700", "#10b981", "#f59e0b"],
      });
    } catch {}

    if (item.type === "wheat") {
      await onAction("wheat_sell_local", { count });
    } else if (item.type === "animal") {
      await onAction("sell_animal", { item: item.id, count });
    } else {
      await onAction("sell_product", { item: item.id, count });
    }
  };

  const filteredItems = MARKET_ITEMS.filter((item) => {
    if (selectedFilter === "all") return true;
    if (selectedFilter === "product") return item.type === "product" || item.type === "wheat";
    return item.type === "animal";
  });

  return (
    <div className="flex flex-col gap-4 pb-24 max-w-xl mx-auto px-3 font-['Nunito']">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-[#1c3820] to-[#122414] rounded-3xl p-4 border-2 border-amber-500/70 shadow-xl text-amber-50">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-400 flex items-center justify-center text-2xl shadow-inner">
            💱
          </div>
          <div>
            <h2 className="font-['Fredoka'] font-bold text-lg text-yellow-300 leading-tight">
              Оптовий Ринок А-11
            </h2>
            <p className="text-xs text-emerald-200">
              Миттєвий продаж врожаю, продукції та тварин
            </p>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 pt-3 mt-2 border-t border-emerald-800/80">
          {[
            { id: "all", label: "Усе" },
            { id: "product", label: "Продукти та зерно 📦" },
            { id: "animal", label: "Тварини 🐾" },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => {
                triggerHaptic("light");
                setSelectedFilter(f.id as any);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-['Fredoka'] font-bold transition-all ${
                selectedFilter === f.id
                  ? "bg-amber-500 text-amber-950 shadow-md border border-yellow-200"
                  : "bg-[#18311a] text-emerald-200 hover:text-amber-100 border border-emerald-800"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Items List */}
      <div className="flex flex-col gap-3">
        {filteredItems.map((item) => {
          const available = item.getStock(gameState);
          const rawInput = sellInputs[item.id] ?? String(available > 0 ? available : 1);
          const count = parseInt(rawInput, 10) || 0;
          const totalEarn = item.price * count;
          const canSell = available > 0 && count > 0 && count <= available;

          return (
            <div
              key={item.id}
              className="bg-[#244527] rounded-2xl p-3.5 border border-emerald-700/80 shadow-md flex flex-col gap-2.5"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-[#18311a] border border-emerald-600/70 flex items-center justify-center text-2xl shrink-0 shadow-inner">
                    {item.icon}
                  </div>
                  <div>
                    <h4 className="font-['Fredoka'] font-bold text-sm text-amber-100">
                      {item.name}
                    </h4>
                    <p className="text-[11px] text-emerald-300/90">{item.desc}</p>
                    <div className="font-['Fredoka'] font-bold text-xs text-yellow-300 mt-0.5">
                      Ціна: {item.price.toLocaleString()} 🪙 / {item.unit}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-emerald-300 font-medium">На складі:</span>
                  <div className="font-['Fredoka'] font-bold text-sm text-amber-200">
                    {available.toLocaleString()} {item.unit}
                  </div>
                </div>
              </div>

              {/* Direct Count Input & Sell All Preset */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-2 border-t border-emerald-800/80">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[11px] text-emerald-200 font-semibold">Скільки продати:</span>
                  <input
                    type="number"
                    min="1"
                    max={available || 1}
                    value={sellInputs[item.id] ?? (available > 0 ? String(available) : "1")}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSellInputs((prev) => ({ ...prev, [item.id]: val }));
                    }}
                    className="w-20 bg-[#162e18] border border-amber-500/50 text-yellow-300 font-['Fredoka'] font-bold text-center px-1.5 py-1 rounded-lg text-xs focus:outline-none focus:border-yellow-400"
                    placeholder="1"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic("light");
                      setSellInputs((prev) => ({ ...prev, [item.id]: String(available) }));
                    }}
                    disabled={available <= 0}
                    className="px-2 py-1 bg-[#18351a] hover:bg-emerald-800 text-yellow-300 text-[10px] font-bold rounded border border-emerald-700/60"
                  >
                    Все ({available})
                  </button>
                </div>

                <button
                  onClick={() => handleSell(item)}
                  disabled={isLoading || !canSell}
                  className={`py-2 px-4 rounded-xl font-['Fredoka'] font-bold text-xs shadow-md border flex items-center justify-center gap-1.5 transition-all ${
                    canSell
                      ? "bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 active:scale-95 text-white border-emerald-300"
                      : "bg-gray-800 text-gray-500 border-gray-700 cursor-not-allowed"
                  }`}
                >
                  <Coins className="w-3.5 h-3.5 text-yellow-300" />
                  Продати за +{totalEarn.toLocaleString()} 🪙
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
