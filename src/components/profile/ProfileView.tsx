import React, { useState } from "react";
import { useGameStore } from "../../store/gameStore";
import { Award, CheckCircle2, Coins, Send, KeyRound, Check, Copy } from "lucide-react";
import { triggerHaptic, isTelegramEnv } from "../../services/telegram";
import { saveTelegramCredentials, clearTelegramCredentials, getSavedTelegramId, getSavedTelegramName } from "../../services/api";

export const ProfileView: React.FC = () => {
  const { gameState, userId, userName } = useGameStore();
  const botUsername = import.meta.env.VITE_BOT_USERNAME || "ferma_a11_bot";
  const inTelegram = isTelegramEnv();

  const [customIdInput, setCustomIdInput] = useState(getSavedTelegramId() || (userId ? String(userId) : ""));
  const [customNameInput, setCustomNameInput] = useState(getSavedTelegramName() || userName || "");
  const [isEditingAccount, setIsEditingAccount] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

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
    farm.pigs.piglets +
    farm.cows.count +
    farm.ostriches.count;

  const fulfilledContractsCount = business.contracts.filter((c) => c.fulfilled).length;

  const handleSaveAccount = () => {
    if (!customIdInput.trim()) return;
    triggerHaptic("success");
    saveTelegramCredentials(customIdInput.trim(), customNameInput.trim());
    window.location.reload();
  };

  const handleResetAccount = () => {
    triggerHaptic("warning");
    clearTelegramCredentials();
    window.location.reload();
  };

  const handleCopyAppUrl = () => {
    triggerHaptic("light");
    navigator.clipboard.writeText(window.location.origin);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="flex flex-col gap-4 pb-24 max-w-xl mx-auto px-3">
      {/* Profile ID Card */}
      <div className="bg-gradient-to-b from-[#244828] to-[#17301a] rounded-3xl p-5 border-2 border-amber-400/80 shadow-2xl text-amber-50 flex flex-col items-center text-center relative overflow-hidden">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 p-1 shadow-xl flex items-center justify-center font-black text-3xl text-amber-950 border-2 border-yellow-200 mb-2">
          {userName ? userName.charAt(0).toUpperCase() : "👨‍🌾"}
        </div>

        <h2 className="font-['Fredoka'] font-bold text-xl text-yellow-200">
          {userName}
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
          {inTelegram ? (
            <span className="text-[10px] text-emerald-400 font-sans font-bold bg-emerald-900/80 px-1.5 py-0.5 rounded">
              ✓ Telegram WebApp
            </span>
          ) : (
            <button
              onClick={() => setIsEditingAccount(!isEditingAccount)}
              className="text-[10px] text-amber-300 underline hover:text-amber-100 ml-1"
            >
              {isEditingAccount ? "Сховати" : "Змінити ID"}
            </button>
          )}
        </div>

        {/* Manual Account Login / Switcher (for browser usage or testing specific Telegram ID) */}
        {isEditingAccount && !inTelegram && (
          <div className="w-full bg-[#122414] rounded-2xl p-3 border border-amber-500/60 mt-3 text-left">
            <h4 className="font-['Fredoka'] text-xs font-bold text-amber-300 mb-2 flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-amber-400" />
              Вхід за Telegram ID (для тестування поза ботом):
            </h4>
            <div className="flex flex-col gap-2">
              <div>
                <label className="text-[10px] text-emerald-300 font-bold block mb-1">
                  Ваш числовий Telegram ID:
                </label>
                <input
                  type="number"
                  value={customIdInput}
                  onChange={(e) => setCustomIdInput(e.target.value)}
                  placeholder="наприклад: 123456789"
                  className="w-full bg-[#1a331c] border border-emerald-700 rounded-xl px-2.5 py-1.5 text-xs text-amber-100 focus:outline-none focus:border-amber-400"
                />
              </div>
              <div>
                <label className="text-[10px] text-emerald-300 font-bold block mb-1">
                  Ім'я фермера:
                </label>
                <input
                  type="text"
                  value={customNameInput}
                  onChange={(e) => setCustomNameInput(e.target.value)}
                  placeholder="наприклад: Іван"
                  className="w-full bg-[#1a331c] border border-emerald-700 rounded-xl px-2.5 py-1.5 text-xs text-amber-100 focus:outline-none focus:border-amber-400"
                />
              </div>
              <div className="flex gap-2 mt-1">
                <button
                  onClick={handleSaveAccount}
                  className="flex-1 py-1.5 px-3 bg-amber-500 hover:bg-amber-400 active:scale-95 text-amber-950 font-bold text-xs rounded-xl shadow transition-all"
                >
                  Зберегти і увійти
                </button>
                <button
                  onClick={handleResetAccount}
                  className="py-1.5 px-3 bg-emerald-900/60 hover:bg-emerald-800 active:scale-95 text-emerald-200 text-xs rounded-xl border border-emerald-700 transition-all"
                >
                  Скинути
                </button>
              </div>
            </div>
          </div>
        )}

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
        <h3 className="font-['Fredoka'] font-bold text-base text-amber-200">
          Досягнення та статистика
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
            <div className="font-['Fredoka'] font-bold text-base text-yellow-200 mt-1">
              🌾 {wheat.total_harvested} снопів
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

      {/* How to open in Telegram Instructions */}
      <div className="bg-[#18311a] rounded-3xl p-4 border-2 border-emerald-800 flex flex-col gap-2.5 text-xs text-emerald-200">
        <h3 className="font-['Fredoka'] font-bold text-sm text-amber-300 flex items-center gap-1.5">
          <Send className="w-4 h-4 text-sky-400" />
          Як відкрити у своєму Telegram боті:
        </h3>
        <p className="leading-relaxed text-[11px]">
          В Telegram Mini App вхід відбувається <b>100% автоматично</b> через сам додаток Telegram без реєстрацій. Щоб підключити вашу гру до бота:
        </p>
        <div className="bg-[#102212] p-2.5 rounded-xl border border-emerald-900 font-mono text-[11px] text-amber-200 flex items-center justify-between gap-2">
          <span className="truncate">{window.location.origin}</span>
          <button
            onClick={handleCopyAppUrl}
            className="px-2 py-1 bg-emerald-800 hover:bg-emerald-700 text-amber-200 rounded-lg shrink-0 flex items-center gap-1 font-sans text-[10px]"
          >
            {copiedLink ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            {copiedLink ? "Скопійовано" : "Копіювати URL"}
          </button>
        </div>
        <div className="text-[11px] text-emerald-300/90 leading-relaxed bg-[#142817] p-2.5 rounded-xl border border-emerald-800/60 flex flex-col gap-1">
          <div><b>Спосіб 1 (Через @BotFather):</b></div>
          <div>Напишіть <code>/setmenubutton</code> у @BotFather → виберіть вашого бота → надішліть скопійований URL вище. Тепер у боті з'явиться кнопка меню для запуску!</div>
          <div className="mt-1"><b>Спосіб 2 (Кнопка в коді aiogram):</b></div>
          <div className="font-mono text-[10px] text-amber-200 bg-[#0c180e] p-1.5 rounded">
            InlineKeyboardButton(text="🌾 Відкрити ферму", web_app=WebAppInfo(url="{window.location.origin}"))
          </div>
        </div>
      </div>

      {/* Bot Info Footer */}
      <div className="bg-[#18311a] rounded-2xl p-3 border border-emerald-800/80 text-center text-xs text-emerald-200/80 flex flex-col items-center gap-1">
        <span>Офіційний Telegram Mini App "Ферма А-11"</span>
        <a
          href={`https://t.me/${botUsername.replace("@", "")}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => triggerHaptic("light")}
          className="text-amber-300 font-bold hover:underline flex items-center gap-1"
        >
          <Send className="w-3 h-3" /> @{botUsername.replace("@", "")}
        </a>
      </div>
    </div>
  );
};
