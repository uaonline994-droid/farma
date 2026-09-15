import React, { useState } from "react";
import { useGameStore } from "../../store/gameStore";
import { triggerHaptic } from "../../services/telegram";
import { ShoppingBag, Coins, Plus, Minus, Sparkles } from "lucide-react";
import confetti from "canvas-confetti";

interface ShopItem {
  id: string;
  category: "animals" | "seeds" | "feed" | "titles";
  name: string;
  icon: string;
  price: number;
  unit: string;
  description: string;
}

const SHOP_ITEMS: ShopItem[] = [
  // 🐾 Тварини (ціни та ідентифікатори 1:1 з Python-бота)
  {
    id: "chicken",
    category: "animals",
    name: "Курка-несучка",
    icon: "🐔",
    price: 100,
    unit: "шт.",
    description: "Несе свіжі фермерські яйця у гнізда",
  },
  {
    id: "rooster",
    category: "animals",
    name: "Півень-захисник",
    icon: "🐓",
    price: 300,
    unit: "шт.",
    description: "Необхідний для висиджування курчат із яєць",
  },
  {
    id: "pig",
    category: "animals",
    name: "Свиня на відгодівлю",
    icon: "🐖",
    price: 450,
    unit: "шт.",
    description: "Швидко росте та дає смачне м'ясо",
  },
  {
    id: "cow",
    category: "animals",
    name: "Дійна Корова",
    icon: "🐄",
    price: 1000,
    unit: "шт.",
    description: "Щодня дає свіже натуральне молоко",
  },
  {
    id: "ostrich",
    category: "animals",
    name: "Екзотичний Страус",
    icon: "🦤",
    price: 7500,
    unit: "шт.",
    description: "Дає рідкісне пір'я та гігантські яйця-велетні",
  },

  // 🌱 Насіння
  {
    id: "seed",
    category: "seeds",
    name: "Насіння картоплі",
    icon: "🥔",
    price: 20,
    unit: "шт.",
    description: "Посадковий матеріал для вашого картопляного поля",
  },

  // 🥣 Корми
  {
    id: "grain",
    category: "feed",
    name: "Фуражне зерно",
    icon: "🌾",
    price: 15,
    unit: "порція",
    description: "Корм для курей та вирощування курчат",
  },
  {
    id: "hay",
    category: "feed",
    name: "Лугове сіно",
    icon: "🌿",
    price: 25,
    unit: "порція",
    description: "Корм для свиней та дійних корів",
  },
  {
    id: "mix",
    category: "feed",
    name: "Преміум комбікорм",
    icon: "🥣",
    price: 45,
    unit: "порція",
    description: "Збагачений мікс для годування страусів",
  },

  // 👑 Титули
  {
    id: "kucher",
    category: "titles",
    name: "Титул: Кучер 🚜",
    icon: "🚜",
    price: 3000,
    unit: "ексклюзив",
    description: "Початковий почесний ранг господаря",
  },
  {
    id: "agronom",
    category: "titles",
    name: "Титул: Агроном 🌾",
    icon: "🌾",
    price: 4000,
    unit: "ексклюзив",
    description: "Статус досвідченого польового знавця",
  },
  {
    id: "fermer",
    category: "titles",
    name: "Титул: Фермер 👨‍🌾",
    icon: "👨‍🌾",
    price: 8000,
    unit: "ексклюзив",
    description: "Поважний статус власника великого ранчо",
  },
  {
    id: "baron",
    category: "titles",
    name: "Титул: Агро-Барон 🎩",
    icon: "🎩",
    price: 12000,
    unit: "ексклюзив",
    description: "Елітний титул з високим рейтингом",
  },
  {
    id: "korol",
    category: "titles",
    name: "Титул: Король Полів 👑",
    icon: "👑",
    price: 15000,
    unit: "ексклюзив",
    description: "Королівський статус у турнірній таблиці бота",
  },
];

export const ShopView: React.FC<{
  onAction: (actionName: string, params?: Record<string, unknown>) => Promise<void>;
  isLoading?: boolean;
}> = ({ onAction, isLoading = false }) => {
  const { gameState } = useGameStore();
  const [selectedCategory, setSelectedCategory] = useState<"all" | "animals" | "seeds" | "feed" | "titles">("all");
  const [itemCounts, setItemCounts] = useState<Record<string, number>>({});

  if (!gameState) return null;
  const balance = gameState.economy.balance;

  const handleCountChange = (id: string, delta: number) => {
    triggerHaptic("light");
    setItemCounts((prev) => {
      const current = prev[id] || 1;
      const next = Math.max(1, Math.min(100, current + delta));
      return { ...prev, [id]: next };
    });
  };

  const handleBuy = async (item: ShopItem) => {
    const count = item.category === "titles" ? 1 : itemCounts[item.id] || 1;
    const totalCost = item.price * count;
    if (balance < totalCost) return;

    triggerHaptic("heavy");
    try {
      confetti({
        particleCount: 40,
        spread: 55,
        origin: { y: 0.6 },
        colors: ["#f59e0b", "#3b82f6", "#10b981"],
      });
    } catch {}

    await onAction("shop_buy", { item: item.id, count });
  };

  const filteredItems =
    selectedCategory === "all" ? SHOP_ITEMS : SHOP_ITEMS.filter((item) => item.category === selectedCategory);

  return (
    <div className="flex flex-col gap-4 pb-24 max-w-xl mx-auto px-3">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-[#442c16] to-[#2d1b0b] rounded-3xl p-4 border-2 border-amber-500/70 shadow-xl text-amber-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-400 flex items-center justify-center text-2xl shadow-inner">
              🛍️
            </div>
            <div>
              <h2 className="font-['Fredoka'] font-bold text-lg text-yellow-300 leading-tight">
                Крамниця Агронома
              </h2>
              <span className="text-xs text-amber-200/80">
                Офіційні товари та тварини @agronom11_bot
              </span>
            </div>
          </div>

          <div className="bg-[#180e05] px-3 py-1.5 rounded-2xl border border-amber-600/50 flex items-center gap-1.5">
            <Coins className="w-4 h-4 text-amber-400 fill-amber-400" />
            <span className="font-['Fredoka'] font-bold text-sm text-yellow-300">
              {balance.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Category Filters */}
        <div className="grid grid-cols-5 gap-1 mt-3 bg-[#170e05] p-1 rounded-2xl border border-amber-800/80">
          {[
            { id: "all", label: "Все", icon: "✨" },
            { id: "animals", label: "Тварини", icon: "🐾" },
            { id: "seeds", label: "Насіння", icon: "🌱" },
            { id: "feed", label: "Корми", icon: "🥣" },
            { id: "titles", label: "Титули", icon: "👑" },
          ].map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => {
                  triggerHaptic("light");
                  setSelectedCategory(cat.id as any);
                }}
                className={`py-1.5 px-1 rounded-xl text-xs font-['Fredoka'] font-bold flex flex-col items-center gap-0.5 transition-all ${
                  isSelected
                    ? "bg-gradient-to-b from-amber-500 to-amber-600 text-amber-950 shadow-md border border-amber-300"
                    : "text-amber-200/70 hover:bg-amber-900/40"
                }`}
              >
                <span className="text-sm leading-none">{cat.icon}</span>
                <span className="text-[10px] tracking-tight truncate w-full text-center">
                  {cat.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Items Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {filteredItems.map((item) => {
          const count = item.category === "titles" ? 1 : itemCounts[item.id] || 1;
          const totalCost = item.price * count;
          const canAfford = balance >= totalCost;

          return (
            <div
              key={item.id}
              className="bg-[#244527] rounded-3xl p-4 border-2 border-[#3d7a44] shadow-lg flex flex-col justify-between gap-3"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="w-12 h-12 rounded-2xl bg-[#18311a] border border-emerald-700/60 flex items-center justify-center text-3xl shadow-inner shrink-0">
                    {item.icon}
                  </div>

                  <div className="flex items-center gap-1 bg-[#142916] px-2.5 py-1 rounded-xl border border-amber-500/40">
                    <Coins className="w-3.5 h-3.5 text-amber-400" />
                    <span className="font-['Fredoka'] font-bold text-xs text-yellow-300">
                      {item.price}
                    </span>
                    <span className="text-[10px] text-amber-200/70">/{item.unit}</span>
                  </div>
                </div>

                <h3 className="font-['Fredoka'] font-bold text-base text-amber-100 mt-2 leading-snug">
                  {item.name}
                </h3>
                <p className="text-[11px] text-emerald-200/80 mt-0.5 leading-relaxed">
                  {item.description}
                </p>
              </div>

              {/* Quantity Counter & Buy Button */}
              <div className="flex flex-col gap-2 pt-2 border-t border-emerald-800/60">
                {item.category !== "titles" && (
                  <div className="flex items-center justify-between bg-[#162f18] px-2 py-1 rounded-xl border border-emerald-800">
                    <span className="text-[11px] text-emerald-200 font-semibold">Кількість:</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleCountChange(item.id, -1)}
                        className="w-6 h-6 bg-emerald-800 hover:bg-emerald-700 active:scale-90 rounded-lg text-white font-bold text-xs flex items-center justify-center"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="font-['Fredoka'] font-bold text-sm text-yellow-300 min-w-[20px] text-center">
                        {count}
                      </span>
                      <button
                        onClick={() => handleCountChange(item.id, 1)}
                        className="w-6 h-6 bg-emerald-800 hover:bg-emerald-700 active:scale-90 rounded-lg text-white font-bold text-xs flex items-center justify-center"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                )}

                <button
                  id={`btn-buy-${item.id}`}
                  onClick={() => handleBuy(item)}
                  disabled={isLoading || !canAfford}
                  className={`w-full py-2 px-3 rounded-xl font-['Fredoka'] font-bold text-xs shadow-md border flex items-center justify-center gap-1.5 transition-all ${
                    canAfford
                      ? "bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 active:scale-95 text-amber-950 border-amber-300 shadow-amber-900/40"
                      : "bg-gray-800/40 text-gray-500 border-gray-700 cursor-not-allowed"
                  }`}
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  Купити {count > 1 ? `(${count} шт.) ` : ""}за 🪙 {totalCost}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
