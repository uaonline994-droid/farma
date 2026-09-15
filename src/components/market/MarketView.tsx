import React, { useState } from "react";
import { useGameStore } from "../../store/gameStore";
import { triggerHaptic } from "../../services/telegram";
import { Coins, TrendingUp, DollarSign, Store } from "lucide-react";
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
  // 🧺 Продукція (акція: sell_product)
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

  // 🐾 Тварини на продаж (акція: sell_animal)
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
    icon: "🪶",
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
  const [activeTab, setActiveTab] = useState<"products" | "animals">("products");
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  if (!gameState) return null;

  const handleSliderChange = (id: string, value: number) => {
    setQuantities((prev) => ({ ...prev, [id]: value }));
  };

  const handleSell = async (item: MarketProductItem, countToSell: number) => {
    if (countToSell <= 0) return;
    triggerHaptic("heavy");
    try {
      confetti({
        particleCount: 35,
        spread: 50,
        origin: { y: 0.6 },
        colors: ["#f59e0b", "#fbbf24", "#10b981"],
      });
    } catch {}

    if (item.type === "animal") {
      await onAction("sell_animal", { item: item.id, count: countToSell });
    } else if (item.type === "wheat") {
      await onAction("wheat_sell_local", { count: countToSell });
    } else {
      await onAction("sell_product", { item: item.id, count: countToSell });
    }

    setQuantities((prev) => ({ ...prev, [item.id]: 1 }));
  };

  let totalInventoryValue = 0;
  MARKET_ITEMS.filter((i) => i.type === "product" || i.type === "wheat").forEach((item) => {
    const stock = item.getStock(gameState);
    totalInventoryValue += stock * item.price;
  });

  const displayedItems = MARKET_ITEMS.filter((item) =>
    activeTab === "products" ? item.type === "product" || item.type === "wheat" : item.type === "animal"
  );

  return (
    <div className="flex flex-col gap-4 pb-24 max-w-xl mx-auto px-3">
      {/* Market Header Banner */}
      <div className="bg-gradient-to-r from-[#1c4826] to-[#13351a] rounded-3xl p-4 border-2 border-emerald-500/70 shadow-xl text-amber-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-400/80 flex items-center justify-center text-2xl shadow-inner">
              🏪
            </div>
            <div>
              <h2 className="font-['Fredoka'] font-bold text-lg text-amber-200 leading-tight">
                Агро-Ярмарок (Ринок)
              </h2>
              <span className="text-xs text-emerald-200/80">
                Офіційні ціни скупки продукції та тварин
              </span>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-emerald-300 font-bold uppercase tracking-wider">
              Вартість складу
            </span>
            <div className="font-['Fredoka'] font-bold text-base text-yellow-300 flex items-center justify-end gap-1">
              <Coins className="w-4 h-4 text-amber-400" />
              {totalInventoryValue.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Tab switchers */}
        <div className="grid grid-cols-2 gap-2 mt-3 bg-[#0c1d10] p-1 rounded-2xl border border-emerald-800">
          <button
            onClick={() => {
              triggerHaptic("light");
              setActiveTab("products");
            }}
            className={`py-2 rounded-xl text-xs font-['Fredoka'] font-bold transition-all ${
              activeTab === "products"
                ? "bg-gradient-to-b from-amber-500 to-amber-600 text-amber-950 shadow-md border border-amber-300"
                : "text-emerald-200/80 hover:bg-emerald-900/40"
            }`}
          >
            🧺 Продукція та врожай
          </button>
          <button
            onClick={() => {
              triggerHaptic("light");
              setActiveTab("animals");
            }}
            className={`py-2 rounded-xl text-xs font-['Fredoka'] font-bold transition-all ${
              activeTab === "animals"
                ? "bg-gradient-to-b from-amber-500 to-amber-600 text-amber-950 shadow-md border border-amber-300"
                : "text-emerald-200/80 hover:bg-emerald-900/40"
            }`}
          >
            🐾 Продаж тварин
          </button>
        </div>
      </div>

      {/* Produce Items List */}
      <div className="flex flex-col gap-3">
        {displayedItems.map((item) => {
          const stock = item.getStock(gameState);
          const currentCount = Math.min(stock, quantities[item.id] ?? (stock > 0 ? 1 : 0));
          const totalEarn = currentCount * item.price;

          return (
            <div
              key={item.id}
              className="bg-[#224426] rounded-3xl p-4 border-2 border-[#386e3e] shadow-lg flex flex-col gap-3"
            >
              {/* Top row: Icon, Name, Price ticker */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-[#163119] border border-emerald-700/60 flex items-center justify-center text-2xl shadow-inner">
                    {item.icon}
                  </div>
                  <div>
                    <h3 className="font-['Fredoka'] font-bold text-base text-amber-100 leading-snug">
                      {item.name}
                    </h3>
                    <p className="text-[11px] text-emerald-200/80">{item.desc}</p>
                  </div>
                </div>

                <div className="text-right">
                  <div className="flex items-center justify-end gap-1 bg-[#132c16] px-2.5 py-1 rounded-xl border border-amber-600/40">
                    <span className="font-['Fredoka'] font-bold text-sm text-yellow-300">
                      🪙 {item.price}
                    </span>
                    <span className="text-[10px] text-amber-200/70">/{item.unit}</span>
                  </div>
                  <div className="text-[10px] text-emerald-300 font-semibold mt-0.5">
                    У наявності: <strong className="text-amber-200">{stock} {item.unit}</strong>
                  </div>
                </div>
              </div>

              {/* Slider & Sell Controls if stock > 0 */}
              {stock > 0 ? (
                <div className="bg-[#18351c] rounded-2xl p-3 border border-emerald-800/80 flex flex-col gap-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-amber-200 font-semibold">
                      Кількість до продажу: <strong className="text-yellow-300 font-['Fredoka'] text-sm">{currentCount} {item.unit}</strong>
                    </span>
                    <span className="text-emerald-300 font-bold font-['Fredoka']">
                      Отримаєте: +🪙 {totalEarn.toLocaleString()}
                    </span>
                  </div>

                  {/* Quantity Range Slider */}
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min={1}
                      max={stock}
                      value={currentCount}
                      onChange={(e) => handleSliderChange(item.id, Number(e.target.value))}
                      className="flex-1 accent-amber-400 h-2 bg-emerald-950 rounded-lg cursor-pointer"
                    />
                    <button
                      onClick={() => handleSliderChange(item.id, stock)}
                      className="text-[10px] bg-emerald-800 hover:bg-emerald-700 active:scale-95 text-amber-200 font-bold px-2.5 py-1 rounded-lg border border-emerald-600"
                    >
                      Макс ({stock})
                    </button>
                  </div>

                  {/* Sell Button */}
                  <button
                    id={`btn-sell-${item.id}`}
                    onClick={() => handleSell(item, currentCount)}
                    disabled={isLoading || currentCount <= 0}
                    className="w-full mt-1 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 active:scale-95 text-amber-950 font-['Fredoka'] font-bold text-xs rounded-xl shadow-md border border-amber-300 flex items-center justify-center gap-1.5 transition-all"
                  >
                    <DollarSign className="w-4 h-4 text-amber-950" />
                    Продати {currentCount} {item.unit} за 🪙 {totalEarn.toLocaleString()}
                  </button>
                </div>
              ) : (
                <div className="text-center py-2 text-xs text-gray-400 bg-[#162e19] rounded-xl border border-emerald-900/50">
                  Немає у наявності для продажу
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
