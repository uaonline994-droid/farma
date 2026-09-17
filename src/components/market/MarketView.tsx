import React, { useEffect, useState } from "react";
import { useGameStore } from "../../store/gameStore";
import { fetchMarketplace } from "../../services/api";
import { triggerHaptic } from "../../services/telegram";
import {
  Coins,
  TrendingUp,
  Store,
  Sparkles,
  ShoppingBag,
  Tag,
  PlusCircle,
  CheckCircle2,
  XCircle,
  Users,
} from "lucide-react";
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

// Available player marketplace listings (P2P Market)
interface PlayerListing {
  id: number;
  seller: string;
  sellerId: number;
  itemKey: string;
  itemName: string;
  icon: string;
  qty: number;
  price: number;
  isSelf: boolean;
}

export const MarketView: React.FC<{
  onAction: (actionName: string, params?: Record<string, unknown>) => Promise<void>;
  isLoading?: boolean;
}> = ({ onAction, isLoading = false }) => {
  const { gameState, userId } = useGameStore();
  const [mainMode, setMainMode] = useState<"wholesale" | "p2p">("wholesale");
  const [selectedFilter, setSelectedFilter] = useState<"all" | "product" | "animal">("all");
  const [sellInputs, setSellInputs] = useState<Record<string, string>>({});

  // P2P State
  const [p2pItem, setP2pItem] = useState<string>("wheat");
  const [p2pQty, setP2pQty] = useState<string>("10");
  const [p2pPrice, setP2pPrice] = useState<string>("100");
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);

  const [listings, setListings] = useState<PlayerListing[]>([]);

  const loadListings = async () => {
    const remoteListings = await fetchMarketplace();
    setListings(remoteListings.map((listing: any) => {
      const item = MARKET_ITEMS.find((candidate) => candidate.id === listing.item_key);
      return {
        id: listing.id,
        seller: listing.seller,
        sellerId: listing.seller_id,
        itemKey: listing.item_key,
        itemName: item?.name || listing.item_key,
        icon: item?.icon || "📦",
        qty: Number(listing.qty) || 0,
        price: Number(listing.price) || 0,
        isSelf: listing.seller_id === userId,
      };
    }));
  };

  useEffect(() => {
    loadListings().catch(() => setListings([]));
  }, [userId]);

  if (!gameState) return null;
  const balance = gameState.economy.balance;

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

  const handleCreateListing = async () => {
    const qty = parseInt(p2pQty, 10);
    const price = parseInt(p2pPrice, 10);
    if (!qty || qty <= 0 || !price || price <= 0) return;

    const matchedItem = MARKET_ITEMS.find((m) => m.id === p2pItem);
    const available = matchedItem ? matchedItem.getStock(gameState) : 0;
    if (qty > available) {
      triggerHaptic("warning");
      return;
    }

    triggerHaptic("heavy");
    const newL: PlayerListing = {
      id: Math.floor(100 + Math.random() * 900),
      seller: "Ви (Мій лот)",
      sellerId: userId || 1001,
      itemKey: p2pItem,
      itemName: matchedItem?.name || p2pItem,
      icon: matchedItem?.icon || "📦",
      qty,
      price,
      isSelf: true,
    };
    setListings((prev) => [newL, ...prev]);
    setShowCreateModal(false);

    try {
      await onAction("mkt_create", { item: p2pItem, qty, price });
    } catch {} finally {
      await loadListings().catch(() => undefined);
    }
  };

  const handleBuyP2P = async (listing: PlayerListing) => {
    const total = listing.qty * listing.price;
    if (balance < total) {
      triggerHaptic("warning");
      return;
    }
    triggerHaptic("heavy");
    try {
      confetti({ particleCount: 40, spread: 60, origin: { y: 0.6 } });
    } catch {}
    setListings((prev) => prev.filter((l) => l.id !== listing.id));
    try {
      await onAction("mkt_buy", { listing_id: listing.id, item: listing.itemKey, qty: listing.qty, price: listing.price });
    } finally {
      await loadListings().catch(() => undefined);
    }
  };

  const handleCancelP2P = async (listing: PlayerListing) => {
    triggerHaptic("light");
    setListings((prev) => prev.filter((l) => l.id !== listing.id));
    try {
      await onAction("mkt_cancel", { listing_id: listing.id });
    } finally {
      await loadListings().catch(() => undefined);
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
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-400 flex items-center justify-center text-2xl shadow-inner">
              💱
            </div>
            <div>
              <h2 className="font-['Fredoka'] font-bold text-lg text-yellow-300 leading-tight">
                Торговий Дім А-11
              </h2>
              <p className="text-xs text-emerald-200">
                Оптовий ринок та маркетплейс між гравцями
              </p>
            </div>
          </div>
        </div>

        {/* Mode Switcher: Оптовий Ринок vs Маркетплейс Гравців */}
        <div className="grid grid-cols-2 gap-1.5 mt-3 pt-3 border-t border-emerald-800/80">
          <button
            type="button"
            id="tab-market-wholesale"
            onClick={() => {
              triggerHaptic("light");
              setMainMode("wholesale");
            }}
            className={`py-2 rounded-xl text-xs font-['Fredoka'] font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              mainMode === "wholesale"
                ? "bg-amber-500 text-amber-950 shadow-md border border-yellow-200"
                : "bg-[#18311a] text-emerald-200 hover:text-amber-100 border border-emerald-800"
            }`}
          >
            <Store className="w-4 h-4" />
            Оптовий Ринок (Державний)
          </button>
          <button
            type="button"
            id="tab-market-p2p"
            onClick={() => {
              triggerHaptic("light");
              setMainMode("p2p");
            }}
            className={`py-2 rounded-xl text-xs font-['Fredoka'] font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              mainMode === "p2p"
                ? "bg-gradient-to-r from-teal-500 to-emerald-500 text-slate-950 shadow-md border border-teal-200"
                : "bg-[#18311a] text-emerald-200 hover:text-amber-100 border border-emerald-800"
            }`}
          >
            <Users className="w-4 h-4" />
            Ринок Гравців (Маркетплейс)
          </button>
        </div>
      </div>

      {/* 🏬 MODE 1: Оптовий ринок */}
      {mainMode === "wholesale" && (
        <>
          {/* Sub Filters */}
          <div className="flex items-center gap-2 px-1">
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
                      <span className="text-[11px] text-emerald-200 font-semibold">Скільки:</span>
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
        </>
      )}

      {/* 🛍️ MODE 2: Маркетплейс між гравцями */}
      {mainMode === "p2p" && (
        <div className="flex flex-col gap-3">
          {/* Marketplace header & Create Listing Button */}
          <div className="bg-[#18361e] p-3.5 rounded-2xl border border-emerald-700/80 flex items-center justify-between shadow-md">
            <div>
              <span className="font-['Fredoka'] font-bold text-sm text-yellow-300 block">
                🛍️ Оголошення гравців групи А-11
              </span>
              <span className="text-[11px] text-emerald-200">
                Купуйте вигідно або продавайте за власною ціною
              </span>
            </div>

            <button
              type="button"
              id="btn-create-listing"
              onClick={() => {
                triggerHaptic("medium");
                setShowCreateModal(true);
              }}
              className="px-3 py-2 bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 text-amber-950 font-['Fredoka'] font-bold text-xs rounded-xl shadow-md border border-yellow-200 flex items-center gap-1 cursor-pointer active:scale-95"
            >
              <PlusCircle className="w-4 h-4" />
              Створити лот
            </button>
          </div>

          {/* Modal / Form for creating a new listing */}
          {showCreateModal && (
            <div className="bg-[#122817] p-4 rounded-3xl border-2 border-amber-400/80 shadow-2xl flex flex-col gap-3">
              <div className="flex items-center justify-between border-b border-emerald-800 pb-2">
                <span className="font-['Fredoka'] font-bold text-sm text-yellow-300">
                  ✨ Виставити товар на маркетплейс
                </span>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] text-emerald-300 font-bold block mb-1">
                    Товар зі складу:
                  </label>
                  <select
                    value={p2pItem}
                    onChange={(e) => setP2pItem(e.target.value)}
                    className="w-full bg-[#0d1f11] border border-emerald-700 text-yellow-300 text-xs font-bold p-2 rounded-xl focus:outline-none focus:border-yellow-400"
                  >
                    {MARKET_ITEMS.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.icon} {m.name} ({m.getStock(gameState)} на складі)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] text-emerald-300 font-bold block mb-1">
                    Кількість:
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={p2pQty}
                    onChange={(e) => setP2pQty(e.target.value)}
                    className="w-full bg-[#0d1f11] border border-emerald-700 text-yellow-300 text-xs font-bold p-2 rounded-xl focus:outline-none focus:border-yellow-400"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-emerald-300 font-bold block mb-1">
                    Ціна за 1 шт (🪙):
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={p2pPrice}
                    onChange={(e) => setP2pPrice(e.target.value)}
                    className="w-full bg-[#0d1f11] border border-emerald-700 text-yellow-300 text-xs font-bold p-2 rounded-xl focus:outline-none focus:border-yellow-400"
                  />
                </div>
              </div>

              <button
                type="button"
                id="btn-submit-listing"
                onClick={handleCreateListing}
                className="w-full py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-['Fredoka'] font-black text-xs rounded-xl shadow-lg border border-emerald-200 cursor-pointer active:scale-95"
              >
                Опублікувати на маркетплейсі
              </button>
            </div>
          )}

          {/* Listings List */}
          <div className="flex flex-col gap-2.5">
            {listings.map((l) => {
              const totalCost = l.qty * l.price;
              const canAfford = balance >= totalCost;

              return (
                <div
                  key={l.id}
                  className="bg-[#244527] rounded-2xl p-3.5 border border-emerald-700/80 shadow-md flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-[#18311a] border border-emerald-600/70 flex items-center justify-center text-2xl shrink-0 shadow-inner">
                      {l.icon}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-['Fredoka'] font-bold text-sm text-yellow-200">
                          {l.itemName} ×{l.qty}
                        </span>
                        <span className="text-[10px] text-emerald-300 bg-emerald-950/80 px-1.5 py-0.2 rounded border border-emerald-800">
                          #{l.id}
                        </span>
                      </div>
                      <div className="text-[11px] text-emerald-300/90 mt-0.5">
                        👤 Продавець: <b className="text-white">{l.seller}</b>
                      </div>
                      <div className="font-['Fredoka'] font-bold text-xs text-amber-300">
                        {l.price.toLocaleString()} 🪙 / шт • Разом: <b>{totalCost.toLocaleString()} 🪙</b>
                      </div>
                    </div>
                  </div>

                  <div>
                    {l.isSelf ? (
                      <button
                        type="button"
                        onClick={() => handleCancelP2P(l)}
                        className="px-3 py-2 bg-red-900/50 hover:bg-red-800/70 text-red-200 text-xs font-['Fredoka'] font-bold rounded-xl border border-red-600/50 transition cursor-pointer"
                      >
                        Зняти лот
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleBuyP2P(l)}
                        disabled={isLoading || !canAfford}
                        className={`px-3 py-2 rounded-xl text-xs font-['Fredoka'] font-bold border flex items-center gap-1 transition ${
                          canAfford
                            ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 border-emerald-200 shadow cursor-pointer active:scale-95"
                            : "bg-gray-800 text-gray-500 border-gray-700 cursor-not-allowed"
                        }`}
                      >
                        <Coins className="w-3.5 h-3.5" />
                        Купити ({totalCost.toLocaleString()} 🪙)
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="bg-[#18311a]/80 p-3 rounded-2xl border border-emerald-800/60 text-center text-xs text-emerald-200/90">
            💡 У боті виставити товар можна командою:{" "}
            <code>Гусь продати 5 пшеницю 100</code>
          </div>
        </div>
      )}
    </div>
  );
};
