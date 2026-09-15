import { getTelegramInitData, getTelegramUser } from "./telegram";
import { AuthResponse, GameState, ActionResponse, LeaderboardResponse } from "../types";
import { getLocalState, executeLocalAction, saveLocalState, createInitialLocalState } from "./localEngine";

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

export function getCustomBackendUrl(): string {
  if (typeof window !== "undefined") {
    const saved = localStorage.getItem("farmer_custom_backend_url");
    if (saved) return saved.replace(/\/$/, "");
  }
  return "";
}

export function setCustomBackendUrl(url: string) {
  if (typeof window !== "undefined") {
    if (url.trim()) {
      localStorage.setItem("farmer_custom_backend_url", url.trim());
    } else {
      localStorage.removeItem("farmer_custom_backend_url");
    }
  }
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

function getBaseUrl(): string {
  const custom = getCustomBackendUrl();
  if (custom) return custom;
  return "";
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
  const tgUser = getTelegramUser();
  const savedId = customUserId || getSavedTelegramId() || (tgUser ? tgUser.id : 1001);
  const savedName =
    customUserName ||
    getSavedTelegramName() ||
    (tgUser ? `${tgUser.first_name || ""} ${tgUser.last_name || ""}`.trim() || tgUser.username : "Фермер");

  try {
    const res = await fetch(`${getBaseUrl()}/api/auth`, {
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

    if (res.ok) {
      const data = await res.json();
      return data;
    }
  } catch (e) {
    console.warn("Backend auth offline, using local session:", e);
  }

  // Fallback to local session
  return {
    ok: true,
    user_id: Number(savedId) || 1001,
    chat_id: Number(savedId) || 1001,
    user_name: String(savedName),
  };
}

export async function fetchGameState(): Promise<GameState> {
  try {
    const res = await fetch(`${getBaseUrl()}/api/state`, {
      method: "GET",
      headers: getHeaders(),
    });

    if (res.ok) {
      const data = await res.json();
      if (data && data.level && data.farm) {
        saveLocalState(data);
        return data;
      }
    }
  } catch (e) {
    console.warn("Backend /api/state not reachable, loading local state:", e);
  }

  // Fallback: return working local state so the app never hangs
  return getLocalState();
}

export async function executeAction(actionName: string, params: Record<string, unknown> = {}): Promise<ActionResponse> {
  try {
    const res = await fetch(`${getBaseUrl()}/api/action`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({
        action: actionName,
        ...params,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      return data;
    }
  } catch (e) {
    console.warn("Backend /api/action offline, executing in local engine:", e);
  }

  // Fallback: execute locally and save
  return executeLocalAction(actionName, params);
}

export async function fetchLeaderboard(): Promise<LeaderboardResponse> {
  try {
    const res = await fetch(`${getBaseUrl()}/api/leaderboard`, {
      method: "GET",
      headers: getHeaders(),
    });

    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.warn("Backend /api/leaderboard offline, using local mock leaderboard:", e);
  }

  const localState = getLocalState();
  const currentId = Number(getSavedTelegramId()) || 1001;
  const currentName = getSavedTelegramName() || "Фермер";

  return {
    leaderboard: [
      { user_id: 101, name: "Олександр 'Трактор' 🇺🇦", balance: 148500, rank: 1, tag: "Агро-Олігарх" },
      { user_id: 102, name: "Марія Степанівна", balance: 94200, rank: 2, tag: "Королева Сиру 🧀" },
      { user_id: 103, name: "Богдан Подільський", balance: 78100, rank: 3, tag: "Майстер Пшениці 🌾" },
      { user_id: 104, name: "Андрій Квітучий", balance: 52400, rank: 4, tag: "Агроном Полісся" },
      { user_id: 105, name: "Катерина Садова", balance: 41800, rank: 5, tag: "Птаховод Року 🪶" },
      { user_id: currentId, name: `${currentName} (Ви)`, balance: localState.economy.balance, rank: 6, tag: localState.tag, isSelf: true },
      { user_id: 106, name: "Ярослав Мудрий Фермер", balance: 32900, rank: 7, tag: "Тваринник" },
      { user_id: 107, name: "Іван Карпатський", balance: 24700, rank: 8, tag: "Досвідчений" },
      { user_id: 108, name: "Олена Сонячна", balance: 18500, rank: 9, tag: "Господиня" },
      { user_id: 109, name: "Віталій Полігон", balance: 9600, rank: 10, tag: "Новачок" },
    ],
  };
}
