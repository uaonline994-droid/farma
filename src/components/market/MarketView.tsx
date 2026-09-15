import React, { useState } from "react";
import { useGameStore } from "../../store/gameStore";
import { triggerHaptic } from "../../services/telegram";
import { Coins, TrendingUp, Store, DollarSign, Sparkles } from "lucide-react";
import confetti from "canvas-confetti";

interface MarketItemConfig {
  id: string;
  name: string;
  icon: string;
  unit: string;
  desc: string;
  getStock: (state: any) => number;
  getPrice: (state: any) => number;
}

const MARKET_ITEMS: MarketItemConfig[] = [
  {
    id: "potato",
    name: "Відбірна картопля",
    icon: "🥔",
    unit: "кг",
    desc: "Свіжий врожай з власного поля",
    getStock: (s) => s.farm.potato.count,
    getPrice: (s) => s.economy.prices.potato,
  },
  {
    id: "egg",
    name: "Фермерські яйця",
    icon: "🥚",
    unit: "шт.",
    desc: "Свіжі яйця домашніх курей",
    getStock: (s) => s.farm.chickens.eggs,
    getPrice: (s) => s.economy.prices.egg,
  },
  {
    id: "milk",
    name: "Незбиране молоко",
    icon: "🥛",
    unit: "л",
    desc: "Натуральне молоко відгодованих корів",
    getStock: (s) => s.farm.cows.milk,
    getPrice: (s) => s.economy.prices.milk,
  },
  {
    id: "cheese",
    name: "Витриманий сир",
    icon: "🧀",
    unit: "головок",
    desc: "Крафтовий сир найвищого ґатунку",
    getStock: (s) => s.farm.cows.cheese,
    getPrice: (s) => s.economy.prices.cheese,
  },
  {
    id: "meat",
    name: "Свіжа свинина",
    icon: "🥩",
    unit: "кг",
    desc: "Відбірне м'ясо з власного свинарника",
    getStock: (s) => s.farm.pigs.meat,
    getPrice: (s) => s.economy.prices.meat,
  },
  {
    id: "wheat",
    name: "Золота пшениця",
    icon: "🌾",
    unit: "снопів",
    desc: "Зерно з елеватора для пекарень",
    getStock: (s) => s.wheat.granary_used,
    getPrice: (s) => s.economy.prices.wheat,
  },
  {
    id: "ostrich_feather",
    name: "Страусине пір'я",
    icon: "🪶",
    unit: "шт.",
    desc: "Екзотична прикраса для кутюр'є",
    getStock: (s) => s.farm.ostriches.feathers,
    getPrice: (s) => s.economy.prices.ostrich_feather,
  },
];

export const MarketView: React.FC<{
  onAction: (actionName: string, params?: Record<string, unknown>) => Promise<void>;
  isLoading?: boolean;
}> = ({ onAction, isLoading = false }) => {
  const { gameState } = useGameStore();
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  if (!gameState) return null;

  const handleSliderChange = (id: string, value: number) => {
    setQuantities((prev) => ({ ...prev, [id]: value }));
  };

  const handleSell = async (item: MarketItemConfig, countToSell: number) => {
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
    await onAction("market_sell", { item: item.id, count: countToSell });
    // Reset quantity slider
    setQuantities((prev) => ({ ...prev, [item.id]: 1 }));
  };

  // Calculate total inventory value
  let totalInventoryValue = 0;
  MARKET_ITEMS.forEach((item) => {
    const stock = item.getStock(gameState);
    const price = item.getPrice(gameState);
    totalInventoryValue += stock * price;
  });

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
                Продавайте свою продукцію оптом та вроздріб
              </span>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-emerald-300 font-bold uppercase tracking-wider">
              Вартість запасів
            </span>
            <div className="font-['Fredoka'] font-bold text-base text-yellow-300 flex items-center justify-end gap-1">
              <Coins className="w-4 h-4 text-amber-400" />
              {totalInventoryValue.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Live Market Trend Ticker */}
        <div className="mt-3 bg-[#0d2212]/90 rounded-2xl px-3 py-2 border border-emerald-700/50 flex items-center justify-between text-xs">
          <span className="flex items-center gap-1.5 text-emerald-300 font-semibold">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            Котирування біржі:
          </span>
          <span className="text-yellow-300 font-medium truncate text-[11px]">
            🔥 Високий попит на 🧀 Сир (+15%) та 🌾 Пшеницю
          </span>
        </div>
      </div>

      {/* Produce Items List */}
      <div className="flex flex-col gap-3">
        {MARKET_ITEMS.map((item) => {
          const stock = item.getStock(gameState);
          const price = item.getPrice(gameState);
          const currentCount = Math.min(stock, quantities[item.id] ?? (stock > 0 ? 1 : 0));
          const totalEarn = currentCount * price;

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
                      🪙 {price}
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
                      Отримаєте: +🪙 {totalEarn}
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
                      className="text-[10px] bg-emerald-800 hover:bg-emerald-700 active:scale-95 text-amber-200 font-bold px-2 py-1 rounded-lg border border-emerald-600"
                    >
                      Макс
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
                    Продати {currentCount} {item.unit} за 🪙 {totalEarn}
                  </button>
                </div>
              ) : (
                <div className="text-center py-2 text-xs text-gray-400 bg-[#162e19] rounded-xl border border-emerald-900/50">
                  Немає готової продукції на складі. Виростіть або збережіть на фермі!
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
