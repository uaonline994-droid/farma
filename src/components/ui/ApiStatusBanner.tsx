import React, { useState } from "react";
import { getCustomBackendUrl, setCustomBackendUrl, getBaseUrl } from "../../services/api";
import { Server, Check, AlertTriangle, RefreshCw, ChevronDown, ChevronUp } from "lucide-react";
import { triggerHaptic } from "../../services/telegram";

interface ApiStatusBannerProps {
  isError: boolean;
  errorMessage?: string | null;
  onRetry: () => void;
  isLoading: boolean;
}

export const ApiStatusBanner: React.FC<ApiStatusBannerProps> = ({
  isError,
  errorMessage,
  onRetry,
  isLoading,
}) => {
  const [isOpen, setIsOpen] = useState(isError);
  const [urlInput, setUrlInput] = useState(getCustomBackendUrl());
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = () => {
    triggerHaptic("success");
    setCustomBackendUrl(urlInput.trim());
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onRetry();
    }, 400);
  };

  const currentBase = getBaseUrl();

  if (!isError) {
    return null;
  }

  return (
    <div className="w-full bg-gradient-to-r from-red-950/90 to-amber-950/90 border-2 border-red-500/80 rounded-2xl p-3 mb-3 text-amber-50 shadow-xl transition-all">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 animate-pulse" />
          <div className="min-w-0">
            <h4 className="font-['Fredoka'] font-bold text-xs text-yellow-300">
              Немає з'єднання з Python-ботом
            </h4>
            <p className="text-[11px] text-amber-200/90 truncate">
              {errorMessage || "Перевірте адресу вашого aiohttp сервера"}
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-1.5 bg-black/40 hover:bg-black/60 rounded-xl text-amber-200 shrink-0 text-xs flex items-center gap-1 font-bold"
        >
          {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          {isOpen ? "Сховати" : "Налаштувати API"}
        </button>
      </div>

      {isOpen && (
        <div className="mt-3 pt-2.5 border-t border-amber-500/30 flex flex-col gap-2 text-xs">
          <p className="text-[11px] text-amber-100/90 leading-relaxed">
            Вкажіть пряму адресу де запущено ваш Python-бот (aiohttp на порті <code>8080</code>):
          </p>

          <div className="flex gap-2">
            <input
              type="text"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="наприклад: http://123.45.67.89:8080"
              className="flex-1 bg-black/60 border border-amber-500/60 rounded-xl px-2.5 py-1.5 text-xs text-yellow-200 placeholder:text-amber-500/50 focus:outline-none focus:border-amber-300"
            />
            <button
              onClick={handleSave}
              disabled={isLoading}
              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-amber-950 font-bold text-xs rounded-xl shadow transition-all shrink-0 flex items-center gap-1"
            >
              {savedSuccess ? <Check className="w-3.5 h-3.5" /> : <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />}
              {savedSuccess ? "Збережено" : "Підключити"}
            </button>
          </div>

          <div className="text-[10px] text-amber-300/80 bg-black/30 p-2 rounded-lg mt-1 font-mono">
            Поточний URL: {currentBase || "(відносний /api на цьому ж хості)"}
          </div>
        </div>
      )}
    </div>
  );
};
