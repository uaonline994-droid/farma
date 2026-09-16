import React from "react";
import { useGameStore } from "../../store/gameStore";
import { Award, CheckCircle2, Coins, Send, Trophy, Sprout } from "lucide-react";
import { triggerHaptic, isTelegramEnv } from "../../services/telegram";

export const ProfileView: React.FC = () => {
  const { gameState, userId, userName } = useGameStore();
  const botUsername = "agronom11_bot";
  const inTelegram = isTelegramEnv();

  if (!gameState) return null;

  const level = gameState.level;
  const tag = gameState.tag;
  const economy = gameState.economy;
  const wheat = gameState.wheat;
  const business = gameState.business;
  const farm = gameState.farm;

  const totalAnimals =
    farm.chickens.count +
    farm.chickens.chicks +
    farm.chickens.roosters +
    farm.pigs.count +
    farm.cows.count +
    farm.ostriches.count;

  const fulfilledContractsCount = business.contracts.filter((c) => c.fulfilled).length;

  return (
    <div className="flex flex-col gap-4 pb-24 max-w-xl mx-auto px-3">
      {/* Profile ID Card */}
      <div className="bg-gradient-to-b from-[#244828] to-[#17301a] rounded-3xl p-5 border-2 border-amber-400/80 shadow-2xl text-amber-50 flex flex-col items-center text-center relative overflow-hidden">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 p-1 shadow-xl flex items-center justify-center font-black text-3xl text-amber-950 border-2 border-yellow-200 mb-2">
          {userName ? userName.charAt(0).toUpperCase() : "👨‍🌾"}
        </div>

        <h2 className="font-['Fredoka'] font-bold text-xl text-yellow-200">
          {userName || "Фермер"}
        </h2>

        <div className="inline-flex items-center gap-1.5 bg-amber-950/80 text-yellow-300 text-xs px-3 py-1 rounded-full border border-amber-500/60 font-semibold my-1 shadow-inner">
          <Award className="w-3.5 h-3.5 text-amber-400" />
          {tag || "Агроном 🌾"}
        </div>

        <div className="text-[11px] text-emerald-200/90 font-mono mt-1 flex items-center gap-1.5">
          <span>Telegram ID:</span>
          <span className="font-bold text-amber-300 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-700">
            {userId || 1001}
          </span>
          {inTelegram && (
            <span className="text-[10px] text-emerald-400 font-sans font-bold bg-emerald-900/80 px-1.5 py-0.5 rounded">
              ✓ Синхронізовано з ботом
            </span>
          )}
        </div>

        {/* Level Progression */}
        <div className="w-full bg-[#122414] rounded-2xl p-3 border border-emerald-800/80 mt-4">
          <div className="flex items-center justify-between text-xs mb-1.5 font-['Fredoka']">
            <span className="text-amber-200 font-bold">Рівень {level.current}: {level.title}</span>
            <span className="text-emerald-300 font-bold">{level.xp} / {level.next_level_xp} XP</span>
          </div>

          <div className="h-2.5 bg-emerald-950 rounded-full overflow-hidden border border-emerald-700/60 p-[1px]">
            <div
              className="h-full bg-gradient-to-r from-yellow-400 to-emerald-400 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, Math.round((level.xp / level.next_level_xp) * 100))}%` }}
            />
          </div>
        </div>
      </div>

      {/* 📊 Farmer Statistics Grid */}
      <div className="bg-[#244527] rounded-3xl p-4 border-2 border-[#3d7a44] shadow-xl flex flex-col gap-3">
        <h3 className="font-['Fredoka'] font-bold text-base text-amber-200 flex items-center gap-2">
          <Trophy className="w-4 h-4 text-amber-400" />
          Досягнення та показники ферми
        </h3>

        <div className="grid grid-cols-2 gap-2.5 text-xs">
          <div className="bg-[#18311a] p-3 rounded-2xl border border-emerald-800 flex flex-col justify-between">
            <span className="text-emerald-300 text-[11px]">Поточний капітал:</span>
            <div className="font-['Fredoka'] font-bold text-base text-yellow-300 mt-1 flex items-center gap-1">
              <Coins className="w-4 h-4 text-amber-400" />
              {economy.balance.toLocaleString()}
            </div>
          </div>

          <div className="bg-[#18311a] p-3 rounded-2xl border border-emerald-800 flex flex-col justify-between">
            <span className="text-emerald-300 text-[11px]">Зібрано пшениці:</span>
            <div className="font-['Fredoka'] font-bold text-base text-yellow-200 mt-1 flex items-center gap-1">
              <Sprout className="w-4 h-4 text-amber-300" />
              {wheat.total_harvested} т
            </div>
          </div>

          <div className="bg-[#18311a] p-3 rounded-2xl border border-emerald-800 flex flex-col justify-between">
            <span className="text-emerald-300 text-[11px]">Тварин на фермі:</span>
            <div className="font-['Fredoka'] font-bold text-base text-amber-200 mt-1">
              🐾 {totalAnimals} голів
            </div>
          </div>

          <div className="bg-[#18311a] p-3 rounded-2xl border border-emerald-800 flex flex-col justify-between">
            <span className="text-emerald-300 text-[11px]">Виконано контрактів:</span>
            <div className="font-['Fredoka'] font-bold text-base text-emerald-300 mt-1 flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              {fulfilledContractsCount} угод
            </div>
          </div>
        </div>
      </div>

      {/* Official Bot Card */}
      <div className="bg-gradient-to-r from-[#1b3d1f] to-[#142d17] rounded-3xl p-4 border-2 border-emerald-700 shadow-xl text-center flex flex-col items-center gap-2">
        <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-400 flex items-center justify-center text-2xl shadow-inner">
          🌾
        </div>
        <div>
          <h4 className="font-['Fredoka'] font-bold text-base text-yellow-300">
            Ферма А-11 • Офіційний Бот
          </h4>
          <p className="text-xs text-emerald-200/80 mt-0.5">
            Грайте в групі або особистих повідомленнях у Telegram
          </p>
        </div>

        <a
          href={`https://t.me/${botUsername}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => triggerHaptic("light")}
          className="mt-1 px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 active:scale-95 text-amber-950 font-['Fredoka'] font-bold text-xs rounded-xl shadow-md border border-amber-300 flex items-center gap-1.5 transition-all"
        >
          <Send className="w-4 h-4" /> Відкрити @{botUsername}
        </a>
      </div>
    </div>
  );
};
