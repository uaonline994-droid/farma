import React from "react";
import { RefreshCw, AlertTriangle, Send } from "lucide-react";
import { isTelegramEnv } from "../../services/telegram";

export const ErrorState: React.FC<{
  error: Error | null;
  onRetry: () => void;
  isRetrying?: boolean;
}> = ({ error, onRetry, isRetrying = false }) => {
  const isTg = isTelegramEnv();
  const errorMessage = error?.message || "Не вдалося отримати дані з сервера";

  return (
    <div className="flex flex-col items-center justify-center p-6 text-center max-w-sm mx-auto my-12 bg-[#244527] rounded-3xl border-2 border-amber-500/60 shadow-2xl">
      <div className="w-16 h-16 rounded-full bg-amber-950/80 border-2 border-amber-400 flex items-center justify-center mb-4 text-amber-400 shadow-inner">
        <AlertTriangle className="w-8 h-8" />
      </div>

      <h3 className="font-['Fredoka'] font-bold text-lg text-yellow-200 mb-1">
        Помилка зв'язку з ботом
      </h3>

      <p className="text-xs text-amber-100/90 mb-5 leading-relaxed">
        {errorMessage}
      </p>

      <div className="flex flex-col gap-2.5 w-full">
        <button
          id="btn-error-retry"
          onClick={onRetry}
          disabled={isRetrying}
          className="w-full py-2.5 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 active:scale-95 text-amber-950 font-['Fredoka'] font-bold text-xs rounded-xl shadow-lg border border-yellow-200 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isRetrying ? "animate-spin" : ""}`} />
          {isRetrying ? "Спроба підключення..." : "Спробувати знову"}
        </button>

        {!isTg && (
          <a
            href="https://t.me/agronom11_bot"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-2 px-4 bg-[#18311a] hover:bg-[#1f3f22] active:scale-95 text-emerald-300 font-['Fredoka'] font-semibold text-xs rounded-xl border border-emerald-700/60 flex items-center justify-center gap-1.5 transition-all"
          >
            <Send className="w-3.5 h-3.5" /> Відкрити в Telegram @agronom11_bot
          </a>
        )}
      </div>
    </div>
  );
};
