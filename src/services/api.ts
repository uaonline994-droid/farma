import { getTelegramInitData, getTelegramUser } from "./telegram";
import { AuthResponse, GameState, ActionResponse, LeaderboardResponse } from "../types";

export const PERMANENT_BACKEND_URL = "https://artemfurry.pythonanywhere.com";

export function getBaseUrl(): string {
  return PERMANENT_BACKEND_URL;
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = "ApiError";
  }
}

function getHeaders(): HeadersInit {
  const initData = getTelegramInitData();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (initData) {
    headers["X-Telegram-Init-Data"] = initData;
    headers["X-Init-Data"] = initData; // бот проверяет оба варианта
  }
  return headers;
}

// ================= TRANSFORM =================
export function transformPythonResponseToGameState(data: any): GameState {
  // бот возвращает { ok, user, state }
  const state = data?.state || data || {};
  const rawFarm = state.farm || {};
  const rawEcon = state.economy || {};
  const rawWheat = state.wheat || {};
  const rawPrices = state.prices || {};
  const rawContract = state.contract;

  const now = Date.now();

  // ---- Potato ----
  let potatoPlantedAt = 0;
  if (rawFarm.planted_at) {
    const t = new Date(rawFarm.planted_at).getTime();
    if (!isNaN(t)) potatoPlantedAt = t;
  }
  const potatoCount = rawFarm.planted_count || 0;
  const potatoDuration = 7200;
  let potatoProgress = 0, potatoReady = false, potatoSecondsLeft = 0;
  if (potatoCount > 0 && potatoPlantedAt > 0) {
    const elapsed = (now - potatoPlantedAt) / 1000;
    potatoProgress = Math.min(100, Math.round((elapsed / potatoDuration) * 100));
    potatoReady = elapsed >= potatoDuration;
    potatoSecondsLeft = Math.max(0, Math.round(potatoDuration - elapsed));
  }

  // ---- Wheat ----
  const plotCount = rawWheat.plots || 0;
  let wheatPlantedAt = 0;
  if (rawWheat.planted_at) {
    const t = new Date(rawWheat.planted_at).getTime();
    if (!isNaN(t)) wheatPlantedAt = t;
  }
  const wheatCount = rawWheat.planted_count || 0;
  const wheatDuration = 14400; // 4 години

  const wheatPlots = Array.from({ length: 16 }, (_, i) => {
    const id = i + 1;
    const unlocked = id <= plotCount;
    const planted = unlocked && id <= wheatCount && wheatPlantedAt > 0;
    let progress = 0, ready = false, stage = 0;
    if (planted) {
      const elapsed = (now - wheatPlantedAt) / 1000;
      progress = Math.min(100, Math.round((elapsed / wheatDuration) * 100));
      ready = progress >= 100;
      stage = progress >= 100 ? 4 : progress >= 70 ? 3 : progress >= 30 ? 2 : 1;
    }
    return { id, planted_at: planted ? wheatPlantedAt : 0, duration: 14400, stage, ready, progress };
  });

  // ---- Contract ----
  const contracts = [];
  if (rawContract) {
    contracts.push({
      id: String(rawContract.id || "c1"),
      title: rawContract.text || "Контракт на поставку",
      description: `Потрібно ${rawContract.need}× продукції`,
      req_item: rawContract.product,
      req_count: rawContract.need || 1,
      reward_coins: rawContract.reward || 100,
      reward_xp: 100,
      fulfilled: false,
    });
  }

  // ---- Level ----
  const xp = rawFarm.farm_xp || 0;
  const levelNum = typeof state.level === "number" ? state.level : 1;
  const thresholds = [0, 500, 1500, 4000, 9000, 20000, 50000];
  const nextXp = thresholds[levelNum] || levelNum * 2500;

  return {
    tag: state.tag || "Агроном 🌾",
    level: { current: levelNum, xp, next_level_xp: nextXp, title: state.level_name || "Фермер" },
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
        max_capacity: 5000, feed_level: 100, last_feed_time: now,
      },
      pigs: {
        count: rawFarm.pigs || 0, piglets: 0,
        meat: rawFarm.meat || 0, feed_level: 100, last_feed_time: now,
      },
      cows: {
        count: rawFarm.cows || 0, milk: rawFarm.milk || 0,
        cheese: rawFarm.cheese || 0, feed_level: 100, last_feed_time: now,
      },
      ostriches: {
        count: rawFarm.ostriches || 0,
        feathers: rawFarm.feathers || 0,
        eggs: rawFarm.ostrich_eggs || 0,
        feed_level: 100, last_feed_time: now,
      },
    },
    economy: {
      balance: typeof rawEcon.balance === "number" ? rawEcon.balance : 0,
      gems: 0,
      storage: {
        used:
          (rawFarm.eggs || 0) + (rawFarm.milk || 0) + (rawFarm.meat || 0) +
          (rawFarm.potato || 0) + (rawFarm.lard || 0) + (rawFarm.cheese || 0) +
          (rawFarm.feathers || 0) + (rawFarm.ostrich_eggs || 0),
        max: 10000,
      },
      prices: {
        potato:         rawPrices.potato         ?? 70,
        egg:            rawPrices.eggs           ?? 30,
        milk:           rawPrices.milk           ?? 200,
        cheese:         rawPrices.cheese         ?? 1200,
        meat:           rawPrices.meat           ?? 150,
        ostrich_feather:rawPrices.feather        ?? 550,
        ostrich_egg:    rawPrices.ostrich_egg    ?? 2200,
        wheat:          rawPrices.wheat_local    ?? 45,
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
      hired: Array.isArray(state.workers) ? state.workers.length : 0,
      speed_boost: 0, auto_collector: false, slots: 4,
      cost_per_hour: state.worker_wage_per_hour || 0,
    },
    business: {
      level_name: "Ферма А-11",
      contracts,
      upgrades: { sprinkler: 0, auto_feeder: 0, tractor: 0 },
    },
  };
}

// ================= API =================
export async function fetchGameState(): Promise<{ state: GameState; user: any }> {
  const res = await fetch(`${getBaseUrl()}/api/state`, {
    method: "POST",
    headers: getHeaders(),
    body: "{}",
  });
  if (res.status === 401) throw new ApiError("Недійсний initData Telegram", 401);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new ApiError(err.error || `HTTP ${res.status}`, res.status);
  }
  const data = await res.json();
  return { state: transformPythonResponseToGameState(data), user: data.user || null };
}

export async function executeAction(
  actionName: string,
  params: Record<string, unknown> = {},
): Promise<ActionResponse> {
  let pythonAction = actionName;
  const payload: Record<string, unknown> = { ...params };

  if (["collect", "harvest_potato", "collect_eggs", "collect_milk", "collect_ostrich"].includes(actionName)) {
    pythonAction = "collect_farm";
  } else if (actionName === "plant_potato") {
    pythonAction = "plant_potato"; payload.count = Number(params.count) || 1;
  } else if (actionName === "slaughter") {
    pythonAction = "slaughter"; payload.count = Number(params.count) || 1;
  } else if (actionName === "raise" || actionName === "raise_chicks") {
    pythonAction = "raise_chicks";
  } else if (["plant_wheat", "plant_all_wheat", "wheat_plant"].includes(actionName)) {
    pythonAction = "wheat_plant";
  } else if (["harvest_wheat", "harvest_all_wheat", "wheat_collect"].includes(actionName)) {
    pythonAction = "wheat_collect";
  } else if (["sell_wheat", "wheat_sell_local"].includes(actionName)) {
    pythonAction = "wheat_sell_local";
  } else if (["shop_buy", "buy_shop_item"].includes(actionName)) {
    pythonAction = "shop_buy";
    const rawItem = String(params.item || params.item_id || "");
    const mapShop: Record<string, string> = {
      seed_potato: "seed", potato_seed: "seed",
      grain_feed: "grain", hay_feed: "hay", premium_feed: "mix",
      chick: "chicken", ostrich_chick: "ostrich", piglet: "pig",
    };
    payload.item = mapShop[rawItem] || rawItem;
    payload.count = Number(params.count || params.amount) || 1;
  } else if (["sell_product", "market_sell"].includes(actionName)) {
    pythonAction = "sell_product";
    const rawItem = String(params.item || params.product || "");
    const mapProd: Record<string, string> = {
      egg: "eggs", eggs: "eggs", milk: "milk", meat: "meat",
      lard: "lard", cheese: "cheese", potato: "potato",
      ostrich_feather: "feather", feather: "feather", ostrich_egg: "ostrich_egg",
    };
    payload.item = mapProd[rawItem] || rawItem;
    payload.count = Number(params.count || params.amount) || 1;
  } else if (actionName === "sell_animal") {
    payload.item = String(params.item || "");
    payload.count = Number(params.count) || 1;
  } else if (actionName === "hire_worker") {
    payload.worker = String(params.worker || "");
  }

  const res = await fetch(`${getBaseUrl()}/api/action`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({ action: pythonAction, ...payload }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new ApiError(err.error || err.message || `HTTP ${res.status}`, res.status);
  }
  const data = await res.json();
  return {
    ok: true,
    message: data.result || data.message || "Дію виконано",
    state: data.state,
  };
}

export async function fetchLeaderboard(): Promise<LeaderboardResponse> {
  const res = await fetch(`${getBaseUrl()}/api/leaderboard`, {
    method: "POST",
    headers: getHeaders(),
    body: "{}",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new ApiError(err.error || `HTTP ${res.status}`, res.status);
  }
  const data = await res.json();
  const currentId = getTelegramUser()?.id || 0;
  return {
    leaderboard: (Array.isArray(data.leaderboard) ? data.leaderboard : []).map((item: any, idx: number) => ({
      user_id: item.user_id,
      name: item.name || `Гравець ${item.user_id}`,
      balance: item.balance || 0,
      rank: idx + 1,
      tag: item.level_name || (item.level ? `Рівень ${item.level}` : undefined),
      isSelf: currentId > 0 && item.user_id === currentId,
    })),
  };
}
