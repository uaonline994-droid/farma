import React, { useEffect, useState } from "react";
import { fetchLeaderboard } from "../../services/api";
import { LeaderboardEntry } from "../../types";
import { Trophy, Medal, Crown, Coins, RefreshCw, Sparkles, User } from "lucide-react";
import { triggerHaptic } from "../../services/telegram";

export const LeaderboardView: React.FC = () => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadLeaderboard = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchLeaderboard();
      setLeaderboard(data.leaderboard || []);
    } catch (err: any) {
      setError(err.message || "Не вдалося завантажити таблицю лідерів");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const top3 = leaderboard.slice(0, 3);
  const remaining = leaderboard.slice(3);

  return (
    <div className="flex flex-col gap-4 pb-24 max-w-xl mx-auto px-3">
      {/* Leaderboard Header Banner */}
      <div className="bg-gradient-to-r from-[#5a3818] to-[#38210c] rounded-3xl p-4 border-2 border-yellow-500/70 shadow-xl text-amber-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-yellow-500/20 border border-yellow-400 flex items-center justify-center text-2xl shadow-inner">
              🏆
            </div>
            <div>
              <h2 className="font-['Fredoka'] font-bold text-lg text-yellow-300 leading-tight">
                Топ Найкращих Фермерів
              </h2>
              <span className="text-xs text-amber-200/80">
                Змагайтеся за першість та цінні призи сезону
              </span>
            </div>
          </div>

          <button
            onClick={() => {
              triggerHaptic("light");
              loadLeaderboard();
            }}
            disabled={isLoading}
            className="p-2 rounded-xl bg-amber-900/60 hover:bg-amber-800 text-amber-200 border border-amber-600/50 active:scale-95 transition-all"
            title="Оновити"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Top 3 Podium Cards */}
      {top3.length >= 3 && (
        <div className="grid grid-cols-3 gap-2 items-end pt-4 pb-2">
          {/* 2nd Place (Silver) */}
          <div className="bg-[#1e3820] rounded-2xl p-2.5 border-2 border-gray-300/80 shadow-lg flex flex-col items-center text-center relative pt-4">
            <div className="absolute -top-3 w-7 h-7 rounded-full bg-gray-300 text-gray-950 font-black text-xs flex items-center justify-center border border-white shadow">
              🥈 2
            </div>
            <div className="w-10 h-10 rounded-full bg-gray-700 border-2 border-gray-300 flex items-center justify-center text-lg font-bold text-gray-200 mb-1">
              {top3[1]?.name?.charAt(0) || "🥈"}
            </div>
            <h4 className="font-['Fredoka'] font-bold text-xs text-amber-100 truncate w-full">
              {top3[1]?.name}
            </h4>
            <div className="font-['Fredoka'] font-bold text-[11px] text-yellow-300 mt-0.5 flex items-center gap-0.5">
              🪙 {top3[1]?.balance?.toLocaleString()}
            </div>
          </div>

          {/* 1st Place (Gold / King) */}
          <div className="bg-gradient-to-b from-[#2e4d25] to-[#1c3817] rounded-3xl p-3 border-2 border-yellow-400 shadow-2xl flex flex-col items-center text-center relative pt-6 -mt-3 scale-105">
            <div className="absolute -top-4 w-9 h-9 rounded-full bg-gradient-to-r from-yellow-300 to-amber-500 text-amber-950 font-black text-sm flex items-center justify-center border-2 border-white shadow-lg animate-bounce-subtle">
              👑 1
            </div>
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-400 to-amber-600 border-2 border-yellow-200 flex items-center justify-center text-xl font-black text-amber-950 mb-1 shadow">
              {top3[0]?.name?.charAt(0) || "🥇"}
            </div>
            <h4 className="font-['Fredoka'] font-bold text-sm text-yellow-200 truncate w-full">
              {top3[0]?.name}
            </h4>
            <span className="text-[9px] bg-amber-950/80 text-yellow-300 px-1.5 py-0.2 rounded font-semibold border border-amber-600/60 my-0.5">
              {top3[0]?.tag || "Агро-Магнат"}
            </span>
            <div className="font-['Fredoka'] font-black text-xs text-yellow-300 flex items-center gap-1">
              🪙 {top3[0]?.balance?.toLocaleString()}
            </div>
          </div>

          {/* 3rd Place (Bronze) */}
          <div className="bg-[#1e3820] rounded-2xl p-2.5 border-2 border-amber-600/80 shadow-lg flex flex-col items-center text-center relative pt-4">
            <div className="absolute -top-3 w-7 h-7 rounded-full bg-amber-700 text-amber-100 font-black text-xs flex items-center justify-center border border-amber-300 shadow">
              🥉 3
            </div>
            <div className="w-10 h-10 rounded-full bg-amber-900 border-2 border-amber-500 flex items-center justify-center text-lg font-bold text-amber-200 mb-1">
              {top3[2]?.name?.charAt(0) || "🥉"}
            </div>
            <h4 className="font-['Fredoka'] font-bold text-xs text-amber-100 truncate w-full">
              {top3[2]?.name}
            </h4>
            <div className="font-['Fredoka'] font-bold text-[11px] text-yellow-300 mt-0.5 flex items-center gap-0.5">
              🪙 {top3[2]?.balance?.toLocaleString()}
            </div>
          </div>
        </div>
      )}

      {/* Full Leaderboard List */}
      <div className="bg-[#244527] rounded-3xl p-3 border-2 border-[#3d7a44] shadow-xl flex flex-col gap-2">
        <h3 className="font-['Fredoka'] font-bold text-sm text-amber-200 px-2 py-1">
          Загальний рейтинг фермерів
        </h3>

        {isLoading ? (
          <div className="flex flex-col gap-2 py-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-12 bg-emerald-900/40 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-6 text-xs text-red-300">{error}</div>
        ) : (
          <div className="flex flex-col gap-1.5">
            {remaining.map((entry) => (
              <div
                key={entry.user_id}
                className={`flex items-center justify-between p-2.5 rounded-2xl border transition-all ${
                  entry.isSelf
                    ? "bg-amber-950/80 border-yellow-400 text-yellow-100 shadow-md ring-2 ring-yellow-400/40"
                    : "bg-[#18311a] border-emerald-800/80 text-amber-50"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="font-['Fredoka'] font-bold text-xs text-emerald-300 w-6 text-center">
                    #{entry.rank}
                  </span>

                  <div className="w-8 h-8 rounded-full bg-emerald-900 border border-emerald-600 flex items-center justify-center text-xs font-bold text-amber-200 shrink-0">
                    {entry.name ? entry.name.charAt(0) : "👤"}
                  </div>

                  <div className="min-w-0">
                    <h5 className="font-['Fredoka'] font-bold text-xs truncate text-amber-100">
                      {entry.name} {entry.isSelf && <span className="text-yellow-300">(Ви)</span>}
                    </h5>
                    {entry.tag && (
                      <span className="text-[10px] text-emerald-300/80 truncate block">
                        {entry.tag}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1 font-['Fredoka'] font-bold text-xs text-yellow-300 shrink-0">
                  <Coins className="w-3.5 h-3.5 text-amber-400" />
                  {entry.balance.toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
