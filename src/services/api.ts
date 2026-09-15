import { getTelegramInitData } from "./telegram";
import { AuthResponse, GameState, ActionResponse, LeaderboardResponse } from "../types";

export function getSavedTelegramId(): string | null {
  if (typeof window !== "undefined") {
    return localStorage.getItem("farmer_custom_tg_id");
  }
  return null;
}

export function getSavedTelegramName(): string | null {
  if (typeof window !== "undefined") {
    return localStorage.getItem("farmer_custom_tg_name");
  }
  return null;
}

export function saveTelegramCredentials(userId: number | string, name?: string) {
  if (typeof window !== "undefined") {
    localStorage.setItem("farmer_custom_tg_id", String(userId));
    if (name) {
      localStorage.setItem("farmer_custom_tg_name", name);
    }
  }
}

export function clearTelegramCredentials() {
  if (typeof window !== "undefined") {
    localStorage.removeItem("farmer_custom_tg_id");
    localStorage.removeItem("farmer_custom_tg_name");
  }
}

function getHeaders(): HeadersInit {
  const initData = getTelegramInitData();
  const savedId = getSavedTelegramId();
  const savedName = getSavedTelegramName();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (initData) {
    headers["X-Telegram-Init-Data"] = initData;
  }
  if (savedId) {
    headers["X-Telegram-User-Id"] = savedId;
  }
  if (savedName) {
    headers["X-Telegram-User-Name"] = encodeURIComponent(savedName);
  }
  return headers;
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = "ApiError";
  }
}

export async function authApi(
  initDataOverride?: string,
  customUserId?: string | number,
  customUserName?: string
): Promise<AuthResponse> {
  const initData = initDataOverride !== undefined ? initDataOverride : getTelegramInitData();
  const savedId = customUserId || getSavedTelegramId();
  const savedName = customUserName || getSavedTelegramName();

  const res = await fetch("/api/auth", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(initData ? { "X-Telegram-Init-Data": initData } : {}),
      ...(savedId ? { "X-Telegram-User-Id": String(savedId) } : {}),
      ...(savedName ? { "X-Telegram-User-Name": encodeURIComponent(savedName) } : {}),
    },
    body: JSON.stringify({
      initData,
      customUserId: savedId,
      customUserName: savedName,
    }),
  });

  if (!res.ok) {
    throw new ApiError("Помилка авторизації", res.status);
  }
  return res.json();
}

export async function fetchGameState(): Promise<GameState> {
  const res = await fetch("/api/state", {
    method: "GET",
    headers: getHeaders(),
  });

  if (res.status === 401) {
    throw new ApiError("Сесія недійсна, перезапустіть гру", 401);
  }

  if (!res.ok) {
    throw new ApiError("Помилка завантаження даних ферми", res.status);
  }

  return res.json();
}

export async function executeAction(actionName: string, params: Record<string, unknown> = {}): Promise<ActionResponse> {
  const res = await fetch("/api/action", {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({
      action: actionName,
      ...params,
    }),
  });

  const data = await res.json().catch(() => ({}));

  if (res.status === 401) {
    throw new ApiError("Сесія недійсна, перезапустіть гру", 401);
  }

  if (!res.ok) {
    throw new ApiError(data.message || "Не вдалося виконати дію", res.status);
  }

  return data;
}

export async function fetchLeaderboard(): Promise<LeaderboardResponse> {
  const res = await fetch("/api/leaderboard", {
    method: "GET",
    headers: getHeaders(),
  });

  if (res.status === 401) {
    throw new ApiError("Сесія недійсна", 401);
  }

  if (!res.ok) {
    throw new ApiError("Помилка завантаження рейтингу", res.status);
  }

  return res.json();
}
