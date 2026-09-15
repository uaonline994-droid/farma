import React from "react";
import { useGameStore } from "../../store/gameStore";
import { TabType } from "../../types";
import { triggerHaptic } from "../../services/telegram";
import { Tractor, Wheat, Store, ShoppingBag, Briefcase, Trophy, User } from "lucide-react";
import { motion } from "motion/react";

interface NavTabItem {
  id: TabType;
  label: string;
  icon: React.ReactNode;
  badge?: number | boolean;
}

export const BottomNav: React.FC = () => {
  const { activeTab, setActiveTab, gameState } = useGameStore();

  // Check if wheat is ready
  const readyWheatPlots = gameState?.wheat.plots.filter((p) => (p.stage ?? 0) >= 4).length ?? 0;
  const potatoReady = gameState?.farm.potato.ready ?? false;
  const pendingContracts = gameState?.business.contracts.filter((c) => !c.fulfilled).length ?? 0;

  const tabs: NavTabItem[] = [
    {
      id: "farm",
      label: "Ферма",
      icon: <Tractor className="w-5 h-5" />,
      badge: potatoReady,
    },
    {
      id: "wheat",
      label: "Поле",
      icon: <Wheat className="w-5 h-5" />,
      badge: readyWheatPlots > 0 ? readyWheatPlots : undefined,
    },
    {
      id: "market",
      label: "Ринок",
      icon: <Store className="w-5 h-5" />,
    },
    {
      id: "shop",
      label: "Крамниця",
      icon: <ShoppingBag className="w-5 h-5" />,
    },
    {
      id: "business",
      label: "Бізнес",
      icon: <Briefcase className="w-5 h-5" />,
      badge: pendingContracts > 0 ? pendingContracts : undefined,
    },
    {
      id: "leaderboard",
      label: "Топ",
      icon: <Trophy className="w-5 h-5" />,
    },
    {
      id: "profile",
      label: "Профіль",
      icon: <User className="w-5 h-5" />,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#1e3d21]/95 backdrop-blur-lg border-t-2 border-[#3d7a44] pb-[env(safe-area-inset-bottom,10px)] shadow-[0_-8px_20px_rgba(0,0,0,0.4)]">
      <div className="max-w-xl mx-auto flex items-center justify-around px-1 py-1.5">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              id={`nav-tab-${tab.id}`}
              onClick={() => {
                triggerHaptic("medium");
                setActiveTab(tab.id);
              }}
              className={`relative flex flex-col items-center justify-center flex-1 py-1 px-0.5 rounded-xl transition-all ${
                isActive
                  ? "text-amber-300 font-bold"
                  : "text-emerald-200/80 hover:text-amber-100 hover:bg-emerald-800/30"
              }`}
            >
              {/* Active glow pill */}
              {isActive && (
                <motion.div
                  layoutId="activeNavIndicator"
                  className="absolute inset-0 bg-gradient-to-b from-amber-500/20 to-emerald-500/10 rounded-xl border border-amber-400/40 shadow-inner"
                  transition={{ type: "spring", stiffness: 450, damping: 30 }}
                />
              )}

              {/* Icon Container with Badge */}
              <div className="relative">
                <div
                  className={`transition-transform duration-200 ${
                    isActive ? "scale-110 drop-shadow-[0_2px_6px_rgba(245,158,11,0.6)]" : ""
                  }`}
                >
                  {tab.icon}
                </div>

                {/* Badge alert */}
                {tab.badge !== undefined && tab.badge !== 0 && (
                  <span className="absolute -top-1.5 -right-2 bg-gradient-to-r from-red-500 to-amber-500 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center border border-white/80 shadow-md animate-pulse">
                    {typeof tab.badge === "number" ? tab.badge : "!"}
                  </span>
                )}
              </div>

              {/* Label */}
              <span
                className={`text-[10px] tracking-tight mt-0.5 transition-colors font-['Fredoka'] whitespace-nowrap ${
                  isActive ? "text-amber-300 drop-shadow" : "text-emerald-200/90"
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
