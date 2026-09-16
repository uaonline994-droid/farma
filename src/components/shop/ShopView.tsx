import React, { useState } from "react";
import { useGameStore } from "../../store/gameStore";
import { triggerHaptic } from "../../services/telegram";
import { ShoppingBag, Coins, Sparkles, Check, ChevronRight } from "lucide-react";
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
  // 🐾 Тварини
  {
    id: "chicken",
    category: "animals",
    name: "Курка-несучка",
    icon: "🐔",
    price: 100,
    unit: "шт.",
    description: "Несе свіжі фермерські яйця",
  },
  {
    id: "rooster",
    category: "animals",
    name: "Півень-захисник",
    icon: "🐓",
    price: 300,
    unit: "шт.",
    description: "Потрібен для висиджування курчат",
  },
  {
    id: "pig",
    category: "animals",
    name: "Свиня на відгодівлю",
    icon: "🐖",
    price: 450,
    unit: "шт.",
    description: "Дає свіже м'ясо та сало при забої",
  },
  {
    id: "cow",
    category: "animals",
    name: "Дійна Корова",
    icon: "🐄",
    price: 1000,
    unit: "шт.",
    description: "Щодня дає свіже молоко для сироварні",
  },
  {
    id: "ostrich",
    category: "animals",
    name: "Екзотичний Страус",
    icon: "🦤",
    price: 7500,
    unit: "шт.",
    description: "Дає рідкісне пір'я та великі яйця",
  },

  // 🌱 Насіння
  {
    id: "seed",
    category: "seeds",
    name: "Насіння картоплі",
    icon: "🥔",
    price: 20,
    unit: "шт.",
    description: "Для посадки на картопляному полі",
  },
  {
    id: "wheat_seed",
    category: "seeds",
    name: "Насіння пшениці (×10)",
    icon: "🌱",
    price: 300,
    unit: "пакет (10 шт)",
    description: "Для засіву золотих пшеничних полів",
  },

  // 🥣 Корми
  {
    id: "grain",
    category: "feed",
    name: "Фуражне зерно",
    icon: "🌾",
    price: 15,
    unit: "порція",
    description: "Корм для курей та півнів",
  },
  {
    id: "hay",
    category: "feed",
    name: "Лугове сіно",
    icon: "🌿",
    price: 25,
    unit: "порція",
    description: "Корм для корів та свиней",
  },
  {
    id: "mix",
    category: "feed",
    name: "Преміум комбікорм",
    icon: "🥣",
    price: 45,
    unit: "порція",
    description: "Збагачений корм для страусів",
  },

  // 👑 Титули та Престиж
  {
    id: "kucher",
    category: "titles",
    name: "Титул: Кучер 🚜",
    icon: "🚜",
    price: 3000,
    unit: "титул",
    description: "Початковий ранг господаря",
  },
  {
    id: "agronom",
    category: "titles",
    name: "Титул: Агроном 🌾",
    icon: "🌾",
    price: 4000,
    unit: "титул",
    description: "Статус досвідченого польового знавця",
  },
  {
    id: "fermer",
    category: "titles",
    name: "Титул: Фермер 👨‍🌾",
    icon: "👨‍🌾",
    price: 8000,
    unit: "титул",
    description: "Поважний статус власника ранчо",
  },
  {
    id: "baron",
    category: "titles",
    name: "Титул: Агро-Барон 🎩",
    icon: "🎩",
    price: 12000,
    unit: "титул",
    description: "Елітний титул із високим престижем",
  },
  {
    id: "korol",
    category: "titles",
    name: "Титул: Король Полів 👑",
    icon: "👑",
    price: 15000,
    unit: "титул",
    description: "Королівський статус у турнірній таблиці",
  },
  {
    id: "oligarch",
    category: "titles",
    name: "Титул: Агро-Олігарх 💎",
    icon: "💎",
    price: 1000000,
    unit: "титул",
    description: "Найвищий статус у загальному рейтингу",
  },
  {
    id: "billionaire",
    category: "titles",
    name: "Титул: Мільярдер Полів 🏛️",
    icon: "🏛️",
    price: 25000000,
    unit: "титул",
    description: "Статус фінансового гегемона",
  },
  {
    id: "ruler",
    category: "titles",
    name: "Титул: Володар Землі 🌟",
    icon: "🌟",
    price: 100000000,
    unit: "титул",
    description: "Абсолютна верхівка агрономічного світу",
  },
  {
    id: "gold_tractor",
    category: "titles",
    name: "Золотий Комбайн 'Gold Edition' 🚜",
    icon: "✨",
    price: 5000000,
    unit: "екземпляр",
    description: "Ексклюзивний позолочений комбайн преміум-класу",
  },
  {
    id: "drone_fleet",
    category: "titles",
    name: "Агро-Дронний Флот 🛰️",
    icon: "🛰️",
    price: 15000000,
    unit: "флот",
    description: "Автоматизований супутниковий контроль полів",
  },
  {
    id: "heli_hub",
    category: "titles",
    name: "Вертолітний Логістичний Хаб 🚁",
    icon: "🚁",
    price: 200000000,
    unit: "комплекс",
    description: "Миттєва авіадоставка продукції по всьому світу",
  },
];

export const ShopView: React.FC<{
  onAction: (actionName: string, params?: Record<string, unknown>) => Promise<void>;
  isLoading?: boolean;
}> = ({ onAction, isLoading = false }) => {
  const { gameState } = useGameStore();
  const [selectedCategory, setSelectedCategory] = useState<"all" | "animals" | "seeds" | "feed" | "titles">("all");
  const [itemInputs, setItemInputs] = useState<Record<string, string>>({});

  if (!gameState) return null;

  const balance = gameState.economy.balance;

  const handleBuy = async (item: ShopItem) => {
    const rawVal = itemInputs[item.id];
    const count = parseInt(rawVal || "1", 10) || 1;
    if (count <= 0) return;

    triggerHaptic("medium");
    try {
      confetti({
        particleCount: 25,
        spread: 45,
        origin: { y: 0.65 },
        colors: ["#f59e0b", "#10b981", "#fbbf24"],
      });
    } catch {}

    await onAction("shop_buy", {
      item: item.id,
      count,
    });
  };

  const filteredItems = SHOP_ITEMS.filter(
    (item) => selectedCategory === "all" || item.category === selectedCategory
  );

  return (
    <div className="flex flex-col gap-4 pb-24 max-w-xl mx-auto px-3 font-['Nunito']">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-[#204925] to-[#142d17] rounded-3xl p-4 border-2 border-amber-500/70 shadow-xl text-amber-50">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-400 flex items-center justify-center text-2xl shadow-inner">
            🛒
          </div>
          <div>
            <h2 className="font-['Fredoka'] font-bold text-lg text-yellow-300 leading-tight">
              Сільгосп-Крамниця «Агроном»
            </h2>
            <p className="text-xs text-emerald-200">
              Вказуйте будь-яку кількість та купуйте в 1 клік
            </p>
          </div>
        </div>

        {/* Categories Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-3 mt-2 border-t border-emerald-800/80 scrollbar-none">
          {[
            { id: "all", label: "Усе", icon: "✨" },
            { id: "animals", label: "Тварини", icon: "🐾" },
            { id: "seeds", label: "Насіння", icon: "🌱" },
            { id: "feed", label: "Корми", icon: "🥣" },
            { id: "titles", label: "Титули", icon: "👑" },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                triggerHaptic("light");
                setSelectedCategory(cat.id as any);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-['Fredoka'] font-bold whitespace-nowrap transition-all flex items-center gap-1 shrink-0 ${
                selectedCategory === cat.id
                  ? "bg-gradient-to-r from-amber-400 to-amber-500 text-amber-950 shadow-md border border-yellow-200"
                  : "bg-[#18311a] text-emerald-200 hover:text-amber-100 border border-emerald-800"
              }`}
            >
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Items List */}
      <div className="flex flex-col gap-3">
        {filteredItems.map((item) => {
          const count = parseInt(itemInputs[item.id] || "1", 10) || 1;
          const totalPrice = item.price * count;
          const canAfford = balance >= totalPrice;

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
                    <p className="text-[11px] text-emerald-300/90">{item.description}</p>
                    <div className="font-['Fredoka'] font-bold text-xs text-yellow-300 mt-0.5">
                      {item.price.toLocaleString()} 🪙 / {item.unit}
                    </div>
                  </div>
                </div>
              </div>

              {/* Direct Count Input & Quick Preset Buttons */}
              {item.category !== "titles" ? (
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-2 border-t border-emerald-800/80">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[11px] text-emerald-200 font-semibold">Кількість:</span>
                    <input
                      type="number"
                      min="1"
                      max="100000"
                      value={itemInputs[item.id] ?? "1"}
                      onChange={(e) => {
                        const val = e.target.value;
                        setItemInputs((prev) => ({ ...prev, [item.id]: val }));
                      }}
                      className="w-20 bg-[#162e18] border border-amber-500/50 text-yellow-300 font-['Fredoka'] font-bold text-center px-1.5 py-1 rounded-lg text-xs focus:outline-none focus:border-yellow-400"
                      placeholder="1"
                    />
                    {[5, 10, 50, 100].map((preset) => (
                      <button
                        key={preset}
                        onClick={() => {
                          triggerHaptic("light");
                          setItemInputs((prev) => ({ ...prev, [item.id]: String(preset) }));
                        }}
                        className="px-2 py-0.8 bg-[#18351a] hover:bg-emerald-800 text-emerald-200 hover:text-amber-100 text-[10px] font-bold rounded border border-emerald-700/60"
                      >
                        +{preset}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => handleBuy(item)}
                    disabled={isLoading || !canAfford || count <= 0}
                    className={`py-2 px-4 rounded-xl font-['Fredoka'] font-bold text-xs shadow-md border flex items-center justify-center gap-1.5 transition-all ${
                      canAfford && count > 0
                        ? "bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 active:scale-95 text-amber-950 border-amber-300"
                        : "bg-gray-800 text-gray-500 border-gray-700 cursor-not-allowed"
                    }`}
                  >
                    <Coins className="w-3.5 h-3.5" />
                    Купити за {totalPrice.toLocaleString()} 🪙
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between pt-2 border-t border-emerald-800/80">
                  <span className="text-xs text-amber-200">Одноразовий титул</span>
                  <button
                    onClick={() => handleBuy(item)}
                    disabled={isLoading || !canAfford}
                    className={`py-2 px-4 rounded-xl font-['Fredoka'] font-bold text-xs shadow-md border flex items-center justify-center gap-1.5 transition-all ${
                      canAfford
                        ? "bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 active:scale-95 text-amber-950 border-amber-300"
                        : "bg-gray-800 text-gray-500 border-gray-700 cursor-not-allowed"
                    }`}
                  >
                    <Coins className="w-3.5 h-3.5" />
                    Придбати ({item.price.toLocaleString()} 🪙)
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
