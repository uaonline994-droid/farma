import { getTelegramInitData, getTelegramUser } from "./telegram";
import { AuthResponse, GameState, ActionResponse, LeaderboardResponse, LeaderboardEntry } from "../types";
import { getLocalState, executeLocalAction, saveLocalState, createInitialLocalState } from "./localEngine";

export function checkAndExtractQueryBackendUrl(): string | null {
  if (typeof window !== "undefined") {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const apiParam = urlParams.get("api") || urlParams.get("backend") || urlParams.get("server");
      if (apiParam && apiParam.trim()) {
        const clean = apiParam.trim().replace(/\/$/, "");
        localStorage.setItem("farmer_custom_backend_url", clean);
        return clean;
      }
    } catch (e) {
      console.warn("Failed to parse query backend url", e);
    }
  }
  return null;
}

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
    checkAndExtractQueryBackendUrl();
    const saved = localStorage.getItem("farmer_custom_backend_url");
    if (saved) return saved.replace(/\/$/, "");
  }
  return "";
}

export function setCustomBackendUrl(url: string) {
  if (typeof window !== "undefined") {
    if (url.trim()) {
      localStorage.setItem("farmer_custom_backend_url", url.trim().replace(/\/$/, ""));
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

export function getBaseUrl(): string {
  const custom = getCustomBackendUrl();
  if (custom) return custom;
  if (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL.replace(/\/$/, "");
  }
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

// Adapts Python bot's _serialize_farm_state directly to React GameState
export function transformPythonResponseToGameState(data: any): GameState {
  if (!data || typeof data !== "object") {
    return getLocalState();
  }

  const rawFarm = data.farm || {};
  const rawEcon = data.economy || {};
  const rawWheat = data.wheat || {};
  const rawLevel = data.level;
  const rawLevelName = data.level_name || "Фермер";
  const rawContract = data.contract;

  const now = Date.now();

  // 1. Potato calculation from Python SQLite
  let potatoPlantedAt = 0;
  if (rawFarm.planted_at) {
    const pDate = new Date(rawFarm.planted_at).getTime();
    if (!isNaN(pDate)) potatoPlantedAt = pDate;
  }
  const potatoPlantedCount = rawFarm.planted_count || 0;
  const potatoDuration = 7200; // 2 hours
  let potatoProgress = 0;
  let potatoReady = false;
  let potatoSecondsLeft = 0;
  if (potatoPlantedCount > 0 && potatoPlantedAt > 0) {
    const elapsed = (now - potatoPlantedAt) / 1000;
    potatoProgress = Math.min(100, Math.round((elapsed / potatoDuration) * 100));
    potatoReady = elapsed >= potatoDuration;
    potatoSecondsLeft = Math.max(0, Math.round(potatoDuration - elapsed));
  }

  // 2. Wheat plots from Python SQLite
  const plotCount = rawWheat.plots || 0;
  let wheatPlantedAt = 0;
  if (rawWheat.planted_at) {
    const wDate = new Date(rawWheat.planted_at).getTime();
    if (!isNaN(wDate)) wheatPlantedAt = wDate;
  }
  const wheatPlantedCount = rawWheat.planted_count || 0;
  const wheatDuration = 14400; // 4 hours

  const wheatPlots = Array.from({ length: 16 }, (_, i) => {
    const id = i + 1;
    const isSlotUnlocked = id <= plotCount;
    const isPlanted = isSlotUnlocked && id <= wheatPlantedCount && wheatPlantedAt > 0;
    let progress = 0;
    let ready = false;
    let stage = 0;
    if (isPlanted) {
      const elapsed = (now - wheatPlantedAt) / 1000;
      progress = Math.min(100, Math.round((elapsed / wheatDuration) * 100));
      ready = progress >= 100;
      stage = 1;
      if (progress >= 30) stage = 2;
      if (progress >= 70) stage = 3;
      if (progress >= 100) stage = 4;
    }
    return {
      id,
      planted_at: isPlanted ? wheatPlantedAt : 0,
      duration: 45,
      stage,
      ready,
      progress,
    };
  });

  // 3. Contracts from Python SQLite
  const contracts = [];
  if (rawContract) {
    contracts.push({
      id: String(rawContract.id || "c1"),
      title: rawContract.text || "Контракт на поставку",
      description: `Потрібно ${rawContract.need}× продукції`,
      req_item: rawContract.product === "eggs" ? "egg" : rawContract.product,
      req_count: rawContract.need || 1,
      reward_coins: rawContract.reward || 100,
      reward_xp: 100,
      fulfilled: false,
    });
  }

  // 4. XP Calculation
  const xp = rawFarm.farm_xp || 0;
  const levelNum = typeof rawLevel === "number" ? rawLevel : 1;
  const levelThresholds = [0, 500, 1500, 4000, 9000, 20000, 50000];
  const nextXp = levelThresholds[levelNum] || levelNum * 2500;

  return {
    tag: data.tag || "Агроном 🌾",
    level: {
      current: levelNum,
      xp,
      next_level_xp: nextXp,
      title: rawLevelName,
    },
    farm: {
      potato: {
        planted_at: potatoPlantedAt,
        growth_duration: potatoDuration,
        count: rawFarm.potato || 0,
        max_count: 5000,
        ready: potatoReady,
        growth_progress: potatoProgress,
        seconds_left: potatoSecondsLeft,
      },
      chickens: {
        count: rawFarm.chickens || 0,
        chicks: rawFarm.chicks || 0,
        roosters: rawFarm.roosters || 0,
        eggs: rawFarm.eggs || 0,
        max_capacity: 5000,
        feed_level: 100,
        last_feed_time: now,
      },
      pigs: {
        count: rawFarm.pigs || 0,
        piglets: 0,
        meat: rawFarm.meat || 0,
        feed_level: 100,
        last_feed_time: now,
      },
      cows: {
        count: rawFarm.cows || 0,
        milk: rawFarm.milk || 0,
        cheese: rawFarm.cheese || 0,
        feed_level: 100,
        last_feed_time: now,
      },
      ostriches: {
        count: rawFarm.ostriches || 0,
        feathers: rawFarm.feathers || 0,
        eggs: rawFarm.ostrich_eggs || 0,
        feed_level: 100,
        last_feed_time: now,
      },
    },
    economy: {
      balance: typeof rawEcon.balance === "number" ? rawEcon.balance : 0,
      gems: 0,
      storage: {
        used: (rawFarm.eggs || 0) + (rawFarm.milk || 0) + (rawFarm.meat || 0) + (rawFarm.potato || 0) + (rawFarm.lard || 0) + (rawFarm.cheese || 0),
        max: 10000,
      },
      prices: {
        potato: 70,
        egg: 30,
        milk: 200,
        cheese: 1200,
        meat: 150,
        ostrich_feather: 550,
        ostrich_egg: 2200,
        wheat: 45,
      },
      feed_stock: {
        grain: rawFarm.grain || 0,
        hay: rawFarm.hay || 0,
        premium: rawFarm.mix || 0,
      },
      seed_stock: {
        potato: rawFarm.potato_seed || 0,
        wheat: rawWheat.wheat_seed || 0,
      },
    },
    wheat: {
      plots: wheatPlots,
      granary_used: rawWheat.wheat || 0,
      granary_max: rawWheat.capacity || (plotCount * 100 + (rawWheat.silos || 0) * 500),
      total_harvested: rawWheat.wheat || 0,
    },
    workers: {
      hired: Array.isArray(data.workers) ? data.workers.length : 0,
      speed_boost: 0,
      auto_collector: false,
      slots: 4,
      cost_per_hour: data.worker_wage_per_hour || 0,
    },
    business: {
      level_name: "Ферма А-11",
      contracts,
      upgrades: {
        sprinkler: 0,
        auto_feeder: 0,
        tractor: 0,
      },
    },
  };
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
    const baseUrl = getBaseUrl();
    const res = await fetch(`${baseUrl}/api/auth`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(initData ? { "X-Telegram-Init-Data": initData } : {}),
      },
      body: JSON.stringify({
        initData: initData || `user=${encodeURIComponent(JSON.stringify({ id: savedId, first_name: savedName }))}`,
        customUserId: savedId,
        customUserName: savedName,
      }),
    });

    const contentType = res.headers.get("content-type") || "";
    if (contentType.includes("text/html")) {
      throw new ApiError("Бекенд не знайдено за цією адресою (повернуто HTML замість JSON API)", 404);
    }

    if (res.ok) {
      const data = await res.json();
      return {
        ok: true,
        user_id: data.user_id || Number(savedId),
        chat_id: data.chat_id || Number(savedId),
        user_name: data.name || String(savedName),
      };
    } else {
      const errData = await res.json().catch(() => ({}));
      throw new ApiError(errData.error || `Помилка сервера: HTTP ${res.status}`, res.status);
    }
  } catch (e: any) {
    console.warn("Backend auth error:", e);
    throw e;
  }
}

export async function fetchGameState(): Promise<GameState> {
  const baseUrl = getBaseUrl();
  const res = await fetch(`${baseUrl}/api/state`, {
    method: "GET",
    headers: getHeaders(),
  });

  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("text/html")) {
    throw new ApiError(
      "Запит на /api/state повернув веб-сторінку замість JSON. Вкажіть URL вашого Python API у вкладці 'Профіль' або параметром ?api=http://IP:8080",
      404
    );
  }

  if (res.status === 401) {
    throw new ApiError("Помилка авторизації Telegram (недійсний initData)", 401);
  }

  if (res.status === 503) {
    throw new ApiError("Бот ще не налаштований у групі (напишіть /settopic у групі)", 503);
  }

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new ApiError(errData.error || `Помилка отримання даних: HTTP ${res.status}`, res.status);
  }

  const data = await res.json();
  const transformed = transformPythonResponseToGameState(data);
  saveLocalState(transformed);
  return transformed;
}

export async function executeAction(actionName: string, params: Record<string, unknown> = {}): Promise<ActionResponse> {
  // Normalize action name for Python aiohttp bot
  let pythonAction = actionName;
  const pythonPayload: Record<string, unknown> = { ...params };

  if (actionName === "collect") {
    pythonAction = "collect_farm";
  } else if (actionName === "harvest_potato") {
    pythonAction = "collect_farm";
  } else if (actionName === "plant_wheat" || actionName === "plant_all_wheat") {
    pythonAction = "wheat_plant";
  } else if (actionName === "harvest_wheat" || actionName === "harvest_all_wheat") {
    pythonAction = "wheat_collect";
  } else if (actionName === "sell_wheat") {
    pythonAction = "wheat_sell_local";
  } else if (actionName === "raise") {
    pythonAction = "raise_chicks";
  } else if (actionName === "buy_shop_item") {
    pythonAction = "shop_buy";
    const itemId = String(params.item_id || "");
    const mapItems: Record<string, string> = {
      potato_seed: "seed",
      wheat_seed: "wheat_seed",
      grain_feed: "grain",
      hay_feed: "hay",
      premium_feed: "mix",
      chicken: "chicken",
      pig: "pig",
      cow: "cow",
      ostrich: "ostrich",
    };
    pythonPayload.item = mapItems[itemId] || itemId;
    pythonPayload.count = Number(params.amount) || 1;
  } else if (actionName === "sell_product") {
    const prod = String(params.product || "");
    const mapProd: Record<string, string> = {
      egg: "eggs",
      potato: "potato",
      milk: "milk",
      meat: "meat",
      cheese: "cheese",
      ostrich_feather: "feather",
      ostrich_egg: "ostrich_egg",
    };
    pythonPayload.item = mapProd[prod] || prod;
    pythonPayload.count = Number(params.count) || 1;
  }

  const baseUrl = getBaseUrl();
  const res = await fetch(`${baseUrl}/api/action`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({
      action: pythonAction,
      ...pythonPayload,
    }),
  });

  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("text/html")) {
    throw new ApiError("Бекенд не відповідає на дію (отримано HTML замість API)", 404);
  }

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new ApiError(errData.error || errData.message || `Помилка дії: HTTP ${res.status}`, res.status);
  }

  const data = await res.json();
  return {
    ok: true,
    message: data.message || "Дію успішно виконано!",
  };
}

export async function fetchLeaderboard(): Promise<LeaderboardResponse> {
  const baseUrl = getBaseUrl();
  const res = await fetch(`${baseUrl}/api/leaderboard`, {
    method: "GET",
    headers: getHeaders(),
  });

  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("text/html")) {
    throw new ApiError("Не вдалося завантажити рейтинг з сервера бота (отримано HTML)", 404);
  }

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new ApiError(errData.error || `Помилка рейтингу: HTTP ${res.status}`, res.status);
  }

  const data = await res.json();
  if (data && Array.isArray(data.leaderboard)) {
    const currentId = Number(getSavedTelegramId()) || (getTelegramUser() ? getTelegramUser()?.id : 0);
    return {
      leaderboard: data.leaderboard.map((item: any, idx: number) => ({
        user_id: item.user_id,
        name: item.name || `Гравець ${item.user_id}`,
        balance: item.balance || 0,
        rank: idx + 1,
        tag: item.level_name || (item.level ? `Рівень ${item.level}` : undefined),
        isSelf: currentId > 0 && item.user_id === currentId,
      })),
    };
  }

  return { leaderboard: [] };
}
