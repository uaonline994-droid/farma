import React, { useEffect, useState } from "react";
import { fetchLeaderboard, getBaseUrl } from "../../services/api";
import { LeaderboardEntry } from "../../types";
import { Trophy, Medal, Crown, Coins, RefreshCw, User, AlertCircle } from "lucide-react";
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
      setError(err.message || "Не вдалося отримати дані рейтингу з бази бота");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLeaderboard();
  }, []);

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
                Топ Фермерів з Бази Бота
              </h2>
              <span className="text-xs text-amber-200/80">
                Реальний баланс та ранги учасників вашої групи
              </span>
            </div>
          </div>

          <button
            onClick={() => {
              triggerHaptic("light");
              loadLeaderboard();
            }}
            disabled={isLoading}
            className="p-2 rounded-xl bg-amber-900/60 hover:bg-amber-800 text-amber-200 border border-amber-600/50 active:scale-95 transition-all flex items-center gap-1 text-xs font-bold"
            title="Оновити"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="bg-red-950/80 border border-red-500/80 rounded-2xl p-4 text-center flex flex-col items-center gap-2">
          <AlertCircle className="w-6 h-6 text-red-400" />
          <p className="text-xs text-red-200">{error}</p>
          <button
            onClick={loadLeaderboard}
            className="px-3 py-1.5 bg-red-800 hover:bg-red-700 text-white rounded-xl text-xs font-bold"
          >
            Повторити запит
          </button>
        </div>
      )}

      {/* Full Real Leaderboard List */}
      <div className="bg-[#244527] rounded-3xl p-4 border-2 border-[#3d7a44] shadow-xl flex flex-col gap-2">
        <div className="flex items-center justify-between px-1 pb-1">
          <h3 className="font-['Fredoka'] font-bold text-sm text-amber-200">
            Учасники рейтингу ({leaderboard.length})
          </h3>
          <span className="text-[10px] text-emerald-300 font-mono">
            БД: a11_bot.db
          </span>
        </div>

        {isLoading ? (
          <div className="flex flex-col gap-2 py-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-14 bg-emerald-900/40 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : leaderboard.length === 0 ? (
          <div className="text-center py-8 text-xs text-amber-200/80 bg-[#18311a] rounded-2xl p-4 border border-emerald-800">
            <p className="font-bold text-yellow-300 mb-1">У базі даних бота ще немає активних гравців</p>
            <p className="text-[11px] text-emerald-300/80">
              Гравці з'являться тут автоматично, щойно напишуть <code>Гусь бонус</code> або <code>Гусь ферма</code> в групі.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {leaderboard.map((entry, idx) => {
              const rank = idx + 1;
              let badgeColor = "bg-emerald-900 text-emerald-200 border-emerald-700";
              let rankIcon = `#${rank}`;
              if (rank === 1) {
                badgeColor = "bg-gradient-to-br from-yellow-400 to-amber-600 text-amber-950 font-black border-yellow-200 shadow";
                rankIcon = "👑 1";
              } else if (rank === 2) {
                badgeColor = "bg-gray-300 text-gray-950 font-black border-white shadow";
                rankIcon = "🥈 2";
              } else if (rank === 3) {
                badgeColor = "bg-amber-700 text-amber-100 font-black border-amber-300 shadow";
                rankIcon = "🥉 3";
              }

              return (
                <div
                  key={entry.user_id}
                  className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${
                    entry.isSelf
                      ? "bg-amber-950/90 border-yellow-400 text-yellow-100 shadow-md ring-2 ring-yellow-400/50"
                      : "bg-[#18311a] border-emerald-800/80 text-amber-50"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-8 h-8 rounded-full border flex items-center justify-center text-xs shrink-0 ${badgeColor}`}>
                      {rankIcon}
                    </div>

                    <div className="min-w-0">
                      <h5 className="font-['Fredoka'] font-bold text-sm truncate text-amber-100 flex items-center gap-1.5">
                        {entry.name}
                        {entry.isSelf && (
                          <span className="text-[10px] bg-yellow-400 text-amber-950 px-1.5 py-0.2 rounded-full font-black">
                            ВИ
                          </span>
                        )}
                      </h5>
                      <span className="text-[11px] text-emerald-300/90 truncate block">
                        {entry.tag || `ID: ${entry.user_id}`}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 font-['Fredoka'] font-bold text-sm text-yellow-300 shrink-0 bg-black/30 px-2.5 py-1 rounded-xl border border-yellow-500/30">
                    <Coins className="w-4 h-4 text-amber-400" />
                    {Number(entry.balance || 0).toLocaleString()}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
