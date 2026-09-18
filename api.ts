import { getTelegramInitData, getTelegramUser } from "./telegram";
import { GameState, ActionResponse, LeaderboardResponse, EconomyPrices } from "../types";

export const PERMANENT_BACKEND_URL = "https://artemfurry.pythonanywhere.com";

export function getBaseUrl(): string {
  return PERMANENT_BACKEND_URL;
}

export function getCustomBackendUrl(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("farmer_custom_backend_url") || getBaseUrl();
}

export function setCustomBackendUrl(url: string) {
  if (typeof window === "undefined") return;
  const normalized = url.replace(/\/$/, "");
  if (normalized) localStorage.setItem("farmer_custom_backend_url", normalized);
  else localStorage.removeItem("farmer_custom_backend_url");
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

export async function keepBackendAwake(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 8000);
    const response = await fetch(`${PERMANENT_BACKEND_URL}/health`, {
      method: "GET",
      cache: "no-store",
      signal: controller.signal,
    });
    window.clearTimeout(timeout);
    return response.ok;
  } catch {
    return false;
  }
}

function getHeaders(): HeadersInit {
  const initData = getTelegramInitData();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (initData) {
    headers["X-Telegram-Init-Data"] = initData;
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

export interface TelegramAuthResult {
  ok: boolean;
  chat_id: number;
  user_id: number;
  name: string;
  username?: string | null;
  is_new_player: boolean;
}

// Явно авторизує користувача Telegram Mini App на бекенді за підписаним initData.
// Викликається одразу при відкритті веб-апки, до будь-яких інших запитів — це
// гарантує, що бекенд зареєстрував гравця (і видав стартовий набір, якщо він новий)
// ще до першого рендера ферми.
export async function authenticateTelegramUser(): Promise<TelegramAuthResult> {
  const initData = getTelegramInitData();
  if (!initData) {
    throw new ApiError(
      "Цей застосунок потрібно відкривати кнопкою «Натисніть кнопку грати» в Telegram, а не напряму в браузері.",
      401
    );
  }

  const baseUrl = getBaseUrl();
  const res = await fetch(`${baseUrl}/api/auth`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ initData }),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new ApiError(errData.error || `Помилка авторизації: HTTP ${res.status}`, res.status);
  }

  const data = await res.json();
  if (data?.user_id) {
    // Кешуємо підтверджені бекендом дані — корисно як фолбек для заголовків
    // подальших запитів (наприклад, якщо initData стане недоступним).
    saveTelegramCredentials(data.user_id, data.name);
  }
  return data;
}

// Adapts Python bot state to React GameState
export function transformPythonResponseToGameState(rawState: any): GameState {
  const state = rawState || {};
  const rawFarm = state?.farm || {};
  const rawEcon = state?.economy || {};
  const rawWheat = state?.wheat || {};
  const rawPrices = state?.prices || {};
  const rawLevel = state?.level;
  const rawLevelName = state?.level_name || "🚜 Фермер";
  const rawContract = state?.contract;

  const now = Date.now();

  // Clear legacy corrupt delta if present
  if (typeof window !== "undefined") {
    try {
      localStorage.removeItem("farmer_balance_delta");
    } catch {}
  }

  // 1. Potato calculation from Python SQLite
  let localPotatoPlot: { planted: number; planted_at: number } | null = null;
  if (typeof window !== "undefined") {
    try {
      const saved = localStorage.getItem("farmer_potato_plot");
      if (saved) localPotatoPlot = JSON.parse(saved);
    } catch {}
  }

  let potatoPlantedAt = 0;
  const rawPlantedAt = rawFarm.planted_at || rawFarm.potato_planted_at || rawFarm.planted_time;
  if (rawPlantedAt) {
    const pDate = new Date(rawPlantedAt).getTime();
    if (!isNaN(pDate)) {
      potatoPlantedAt = pDate;
    } else if (typeof rawPlantedAt === "number") {
      potatoPlantedAt = rawPlantedAt > 1e11 ? rawPlantedAt : rawPlantedAt * 1000;
    }
  } else if (localPotatoPlot?.planted_at) {
    potatoPlantedAt = localPotatoPlot.planted_at;
  }

  let potatoPlantedCount =
    Number(
      rawFarm.planted_count ??
        rawFarm.planted_potato ??
        rawFarm.potato_planted ??
        rawFarm.planted ??
        rawFarm.potato_count_planted
    ) || 0;

  if (potatoPlantedCount === 0 && localPotatoPlot && localPotatoPlot.planted > 0 && potatoPlantedAt > 0) {
    potatoPlantedCount = localPotatoPlot.planted;
  }

  const potatoDuration = Number(rawFarm.potato_duration) || 7200; // 2 hours in seconds
  let potatoProgress = 0;
  let potatoReady = false;
  let potatoSecondsLeft = 0;
  if (potatoPlantedCount > 0 && potatoPlantedAt > 0) {
    const elapsed = Math.max(0, (now - potatoPlantedAt) / 1000);
    potatoProgress = Math.min(100, Math.round((elapsed / potatoDuration) * 100));
    potatoReady = elapsed >= potatoDuration;
    potatoSecondsLeft = Math.max(0, Math.round(potatoDuration - elapsed));
  }

  // 2. Wheat plots from Python SQLite
  const plotCount = Number(rawWheat.plots) || 0;
  let wheatPlantedAt = 0;
  if (rawWheat.planted_at) {
    const wDate = new Date(rawWheat.planted_at).getTime();
    if (!isNaN(wDate)) wheatPlantedAt = wDate;
    else if (typeof rawWheat.planted_at === "number") {
      wheatPlantedAt = rawWheat.planted_at > 1e11 ? rawWheat.planted_at : rawWheat.planted_at * 1000;
    }
  }
  const wheatPlantedCount = Number(rawWheat.planted_count) || 0;
  const wheatDuration = 14400; // 4 hours

  const totalPlotSlots = Math.max(16, plotCount);
  const wheatPlots = Array.from({ length: totalPlotSlots }, (_, i) => {
    const id = i + 1;
    const isSlotUnlocked = id <= plotCount;
    const isPlanted = isSlotUnlocked && id <= wheatPlantedCount && wheatPlantedAt > 0;
    let progress = 0;
    let ready = false;
    let stage = 0;
    if (isPlanted) {
      const elapsed = Math.max(0, (now - wheatPlantedAt) / 1000);
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
      duration: wheatDuration,
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
      description: `Потрібно ${rawContract.need}× ${rawContract.product || "продукції"}`,
      req_item: rawContract.product || "",
      req_count: Number(rawContract.need) || 1,
      reward_coins: Number(rawContract.reward) || 100,
      reward_xp: 100,
      fulfilled: false,
    });
  }

  // 4. Level & XP
  const xp = Number(rawFarm.farm_xp) || 0;
  const levelNum = typeof rawLevel === "number" ? rawLevel : 1;
  const levelThresholds = [0, 500, 1500, 4000, 9000, 20000, 50000];
  const nextXp = levelThresholds[levelNum] || levelNum * 2500;

  // 5. Prices from state.prices
  const prices: EconomyPrices = {
    potato: Number(rawPrices.potato) || 70,
    egg: Number(rawPrices.eggs ?? rawPrices.egg) || 30,
    milk: Number(rawPrices.milk) || 200,
    cheese: Number(rawPrices.cheese) || 1200,
    meat: Number(rawPrices.meat) || 150,
    ostrich_feather: Number(rawPrices.feather ?? rawPrices.feathers) || 550,
    ostrich_egg: Number(rawPrices.ostrich_egg ?? rawPrices.ostrich_eggs) || 2200,
    wheat: Number(rawPrices.wheat_local ?? rawPrices.wheat) || 45,
  };

  // 6. Bank A-11 & Bot Deposits Sync
  const rawBank = state?.bank || rawEcon.bank || rawFarm.bank || {};
  const bankDeposit = Number(rawBank.deposit) || 0;

  const bankLoan =
    Number(
      rawBank.loan ?? state.loan ?? state.bank_loan
    ) || 0;

  const bankSafe =
    Number(
      rawBank.safe_balance ?? rawBank.safe ?? state.safe ?? state.safe_balance
    ) || 0;

  const bankBonds = Number(rawBank.bonds ?? rawEcon.bonds) || 0;
  const loanLimit = levelNum * 20000 + 10000;

  // Active deposits list from bot response (if any) or merge with records
  const rawDepositsArr =
    state.deposits ||
    rawBank.deposits ||
    rawFarm.deposits ||
    state.active_deposits ||
    state.all_deposits ||
    state.group_deposits ||
    [];

  const activeDeposits: any[] = [];
  if (Array.isArray(rawDepositsArr) && rawDepositsArr.length > 0) {
    rawDepositsArr.forEach((d: any, idx: number) => {
      activeDeposits.push({
        id: String(d.id || `bot-dep-${idx}`),
        user_id: d.user_id || d.userId,
        user_name: d.user_name || d.name || d.username || "Гравець бота",
        amount: Number(d.amount || d.deposit || d.sum) || 0,
        rate: Number(d.rate || d.percent) || 1, // 1% per hour in bot
        created_at: d.created_at || d.date || d.deposited_at || "Активний у боті",
        profit: Number(d.profit || d.earned) || 0,
      });
    });
  }

  // If there is a bank deposit but list is empty, create the summary item
  if (activeDeposits.length === 0 && bankDeposit > 0) {
    const profitEst = Number(rawBank.profit) || Math.round(bankDeposit * 0.01 * 12);
    activeDeposits.push({
      id: "personal-dep-main",
      user_name: state.name || "Мій основний вклад",
      amount: bankDeposit,
      rate: 1, // 1% per hour in bot
      created_at: rawBank.deposited_at ? new Date(rawBank.deposited_at).toLocaleString("uk-UA") : "Активний (синхронізовано з ботом)",
      profit: profitEst,
    });
  }

  // STRICT REAL BALANCE from Python backend without any local artificial delta
  const finalBalance = typeof rawEcon.balance === "number" ? rawEcon.balance : (Number(state.balance) || 0);

  // Parse owned businesses from Python SQLite
  // In Python bot: state.business is a dict { "kiosk": 0, "cafe": 0, "shop": 0, ... }
  const rawBiz = state.business || state.businesses || rawFarm.businesses || {};
  const bizOwned: Record<string, number> = {
    kiosk: Number(rawBiz.kiosk) || 0,
    cafe: Number(rawBiz.cafe) || 0,
    shop: Number(rawBiz.shop) || 0,
    restaurant: Number(rawBiz.restaurant) || 0,
    factory: Number(rawBiz.factory) || 0,
    corporation: Number(rawBiz.corporation) || 0,
    monopoly: Number(rawBiz.monopoly) || 0,
  };

  return {
    tag: state.tag || "Агроном 🌾",
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
        count: Number(rawFarm.potato) || 0, // harvested in storage
        planted: potatoPlantedCount, // planted bushes in ground
        max_count: 5000,
        ready: potatoReady,
        growth_progress: potatoProgress,
        seconds_left: potatoSecondsLeft,
      },
      chickens: {
        count: Number(rawFarm.chickens) || 0,
        chicks: Number(rawFarm.chicks) || 0,
        roosters: Number(rawFarm.roosters) || 0,
        eggs: Number(rawFarm.eggs) || 0,
        max_capacity: 5000,
        feed_level: 100,
        last_feed_time: now,
      },
      pigs: {
        count: Number(rawFarm.pigs) || 0,
        piglets: 0,
        meat: Number(rawFarm.meat) || 0,
        feed_level: 100,
        last_feed_time: now,
      },
      cows: {
        count: Number(rawFarm.cows) || 0,
        milk: Number(rawFarm.milk) || 0,
        cheese: Number(rawFarm.cheese) || 0,
        feed_level: 100,
        last_feed_time: now,
      },
      ostriches: {
        count: Number(rawFarm.ostriches) || 0,
        feathers: Number(rawFarm.feathers) || 0,
        eggs: Number(rawFarm.ostrich_eggs) || 0,
        feed_level: 100,
        last_feed_time: now,
      },
    },
    economy: {
      balance: finalBalance,
      gems: 0,
      bank: {
        deposit: bankDeposit,
        deposit_rate: 1, // 1% per hour in bot
        loan: bankLoan,
        loan_limit: loanLimit,
        safe_balance: bankSafe,
        bonds: bankBonds,
        active_deposits: activeDeposits,
      },
      storage: {
        used:
          (Number(rawFarm.eggs) || 0) +
          (Number(rawFarm.milk) || 0) +
          (Number(rawFarm.meat) || 0) +
          (Number(rawFarm.potato) || 0) +
          (Number(rawFarm.lard) || 0) +
          (Number(rawFarm.cheese) || 0) +
          (Number(rawFarm.feathers) || 0) +
          (Number(rawFarm.ostrich_eggs) || 0),
        max: 10000,
      },
      prices,
      feed_stock: {
        grain: Number(rawFarm.grain) || 0,
        hay: Number(rawFarm.hay) || 0,
        premium: Number(rawFarm.mix) || 0,
      },
      seed_stock: {
        potato: Number(rawFarm.potato_seed) || 0,
        wheat: Number(rawWheat.wheat_seed) || 0,
      },
    },
    wheat: {
      plots: wheatPlots,
      plot_count: plotCount,
      plots_unlocked: plotCount,
      granary_used: Number(rawWheat.wheat) || 0,
      granary_max: Number(rawWheat.capacity) || (plotCount * 100 + (Number(rawWheat.silos) || 0) * 500) || 500,
      total_harvested: Number(rawWheat.wheat) || 0,
    },
    workers: {
      hired: Array.isArray(state.workers) ? state.workers.length : 0,
      speed_boost: 0,
      auto_collector: false,
      slots: 4,
      cost_per_hour: Number(state.worker_wage_per_hour) || 0,
    },
    business: {
      level_name: rawLevelName,
      contracts,
      upgrades: {
        sprinkler: bizOwned.kiosk || 0,
        auto_feeder: bizOwned.cafe || 0,
        tractor: bizOwned.shop || 0,
      },
      businesses: bizOwned,
    },
  };
}

export interface FetchGameStateResult {
  gameState: GameState;
  user?: {
    id: number;
    name: string;
  };
}

async function requestState(): Promise<any> {
  const baseUrl = getBaseUrl();
  const headers = getHeaders();

  // Try POST /api/state first (if server supports POST)
  let res = await fetch(`${baseUrl}/api/state`, {
    method: "POST",
    headers,
    body: JSON.stringify({}),
  }).catch(() => null);

  // If 405 Method Not Allowed or network failure, fallback to GET /api/state
  if (!res || res.status === 405) {
    res = await fetch(`${baseUrl}/api/state`, {
      method: "GET",
      headers,
    });
  }

  if (res.status === 401) {
    throw new ApiError("Помилка авторизації Telegram (недійсний initData)", 401);
  }

  if (res.status === 503) {
    throw new ApiError("Бот ще не налаштований у групі", 503);
  }

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new ApiError(errData.error || `Помилка отримання даних: HTTP ${res.status}`, res.status);
  }

  return res.json();
}

export async function fetchGameState(): Promise<GameState> {
  const data = await requestState();
  const rawState = data?.state || data;
  return transformPythonResponseToGameState(rawState);
}

export async function fetchGameStateWithUser(): Promise<FetchGameStateResult> {
  const data = await requestState();
  const rawState = data?.state || data;
  return {
    gameState: transformPythonResponseToGameState(rawState),
    user: data?.user,
  };
}

export async function executeAction(
  actionName: string,
  params: Record<string, unknown> = {}
): Promise<ActionResponse> {
  let pythonAction = actionName;
  const pythonPayload: Record<string, unknown> = { ...params };

  if (
    actionName === "collect" ||
    actionName === "harvest_potato" ||
    actionName === "collect_eggs" ||
    actionName === "collect_milk" ||
    actionName === "collect_ostrich" ||
    actionName === "collect_all" ||
    actionName === "collect_farm"
  ) {
    pythonAction = "collect_farm";
    if (typeof window !== "undefined") {
      // Clear potato plot if harvested
      localStorage.removeItem("farmer_potato_plot");
    }
  } else if (actionName === "plant_potato") {
    pythonAction = "plant_potato";
    const count = Number(params.count) || 1;
    pythonPayload.count = count;
    if (typeof window !== "undefined") {
      localStorage.setItem(
        "farmer_potato_plot",
        JSON.stringify({
          planted: count,
          planted_at: Date.now(),
        })
      );
    }
  } else if (actionName === "slaughter") {
    pythonAction = "slaughter";
    pythonPayload.count = Number(params.count) || 1;
  } else if (actionName === "cheese") {
    pythonAction = "cheese";
  } else if (actionName === "breed") {
    pythonAction = "breed";
  } else if (actionName === "raise" || actionName === "raise_chicks") {
    pythonAction = "raise_chicks";
  } else if (actionName === "plant_wheat" || actionName === "plant_all_wheat" || actionName === "wheat_plant") {
    pythonAction = "wheat_plant";
  } else if (actionName === "harvest_wheat" || actionName === "harvest_all_wheat" || actionName === "wheat_collect") {
    pythonAction = "wheat_collect";
  } else if (actionName === "sell_wheat" || actionName === "wheat_sell_local") {
    pythonAction = "wheat_sell_local";
  } else if (actionName === "shop_buy" || actionName === "buy_shop_item") {
    pythonAction = "shop_buy";
    let rawItem = String(params.item || params.item_id || "");
    const mapShop: Record<string, string> = {
      seed_potato: "seed",
      potato_seed: "seed",
      grain_feed: "grain",
      hay_feed: "hay",
      premium_feed: "mix",
      chick: "chicken",
      ostrich_chick: "ostrich",
      piglet: "pig",
    };
    pythonPayload.item = mapShop[rawItem] || rawItem;
    pythonPayload.count = Number(params.count || params.amount) || 1;
  } else if (actionName === "sell_product" || actionName === "market_sell") {
    pythonAction = "sell_product";
    let rawItem = String(params.item || params.product || "");
    const mapProduct: Record<string, string> = {
      egg: "eggs",
      eggs: "eggs",
      potato: "potato",
      milk: "milk",
      meat: "meat",
      lard: "lard",
      cheese: "cheese",
      ostrich_feather: "feather",
      feather: "feather",
      ostrich_egg: "ostrich_egg",
    };
    pythonPayload.item = mapProduct[rawItem] || rawItem;
    pythonPayload.count = Number(params.count || params.amount) || 1;
  } else if (actionName === "sell_animal") {
    pythonAction = "sell_animal";
    pythonPayload.item = String(params.item || "");
    pythonPayload.count = Number(params.count) || 1;
  } else if (actionName === "hire_worker") {
    pythonAction = "hire_worker";
    pythonPayload.worker = String(params.worker || "");
  } else if (actionName === "fulfill_contract") {
    pythonAction = "fulfill_contract";
  } else if (actionName === "new_contract") {
    pythonAction = "new_contract";
  } else if (actionName === "buy_business" || actionName === "business_buy") {
    const rawBizKey = String(params.item || params.business || params.type || "kiosk");
    pythonAction = "buy_business";
    pythonPayload.item = rawBizKey;
    pythonPayload.business = rawBizKey;
    pythonPayload.type = rawBizKey;
    pythonPayload.name = rawBizKey;
  } else if (actionName === "bank_deposit" || actionName === "deposit") {
    const amt = Number(params.amount) || 0;
    pythonAction = "bank_deposit";
    pythonPayload.amount = amt;
    pythonPayload.deposit = amt;
  } else if (actionName === "bank_withdraw" || actionName === "withdraw") {
    const amt = Number(params.amount) || 0;
    pythonAction = "bank_withdraw";
    pythonPayload.amount = amt;
  } else if (actionName === "bank_renew") {
    pythonAction = "bank_renew";
  } else if (actionName === "collect_business" || actionName === "business_collect") {
    pythonAction = "collect_business";
  } else if (actionName === "buy_wheat_plot") {
    pythonAction = "buy_wheat_plot";
  } else if (actionName === "take_loan" || actionName === "bank_loan") {
    const amt = Number(params.amount) || 0;
    pythonAction = "take_loan";
    pythonPayload.amount = amt;
  } else if (actionName === "repay_loan" || actionName === "pay_loan") {
    const amt = Number(params.amount) || 0;
    pythonAction = "repay_loan";
    pythonPayload.amount = amt;
  } else if (actionName === "safe_deposit") {
    const amt = Number(params.amount) || 0;
    pythonAction = "safe_deposit";
    pythonPayload.amount = amt;
  } else if (actionName === "safe_withdraw") {
    const amt = Number(params.amount) || 0;
    pythonAction = "safe_withdraw";
    pythonPayload.amount = amt;
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

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new ApiError(errData.error || errData.message || `Помилка дії: HTTP ${res.status}`, res.status);
  }

  const data = await res.json();
  return {
    ok: data.ok !== false,
    message: data.result || data.message || "Дію успішно виконано!",
    state: data.state ? transformPythonResponseToGameState(data.state) : undefined,
  };
}

export async function fetchLeaderboard(): Promise<LeaderboardResponse> {
  const baseUrl = getBaseUrl();
  const headers = getHeaders();

  // Try POST /api/leaderboard then fallback to GET if 405
  let res = await fetch(`${baseUrl}/api/leaderboard`, {
    method: "POST",
    headers,
    body: JSON.stringify({}),
  }).catch(() => null);

  if (!res || res.status === 405) {
    res = await fetch(`${baseUrl}/api/leaderboard`, {
      method: "GET",
      headers,
    });
  }

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new ApiError(errData.error || `Помилка рейтингу: HTTP ${res.status}`, res.status);
  }

  const data = await res.json();
  if (data && Array.isArray(data.leaderboard)) {
    const currentId: number = Number(getSavedTelegramId()) || Number(getTelegramUser()?.id || 0);

    const items = data.leaderboard.map((item: any) => {
      const isSelf = currentId > 0 && item.user_id === currentId;
      const actualBalance = Number(item.balance) || 0;
      return {
        user_id: item.user_id,
        name: item.name || `Гравець ${item.user_id}`,
        balance: actualBalance,
        rank: item.rank || 1,
        tag: item.level_name || (item.level ? `Рівень ${item.level}` : undefined),
        isSelf,
      };
    });

    // If player not present in array, add self
    if (currentId > 0 && !items.some((i: any) => i.isSelf)) {
      const tgUser = getTelegramUser();
      const savedName = getSavedTelegramName() || (tgUser ? `${tgUser.first_name || ""} ${tgUser.last_name || ""}`.trim() : "Я (Фермер)");
      items.push({
        user_id: currentId,
        name: `${savedName} (Ви)`,
        balance: 0,
        rank: items.length + 1,
        tag: "Фермер 🚜",
        isSelf: true,
      });
    }

    // Dynamic sorting so player's rank reflects true wealth
    items.sort((a: any, b: any) => b.balance - a.balance);
    items.forEach((item: any, idx: number) => {
      item.rank = idx + 1;
    });

    return {
      leaderboard: items,
    };
  }

  return { leaderboard: [] };
}

export async function fetchMarketplace(): Promise<any[]> {
  const res = await fetch(`${getBaseUrl()}/api/marketplace`, {
    method: "GET",
    headers: getHeaders(),
    cache: "no-store",
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new ApiError(errData.error || `Помилка маркетплейсу: HTTP ${res.status}`, res.status);
  }
  const data = await res.json();
  return Array.isArray(data?.listings) ? data.listings : [];
}

export interface BankRollbackCandidate {
  user_id: number;
  name: string;
  current_balance: number;
  target_balance: number;
  correction: number;
  first_withdrawal_id: number;
  first_withdrawal_at: string;
  already_applied: boolean;
}

export async function fetchBankRollbacks(): Promise<BankRollbackCandidate[]> {
  const res = await fetch(`${getBaseUrl()}/api/admin/bank-rollbacks`, {
    headers: getHeaders(),
    cache: "no-store",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(data.error || "Помилка адмін-панелі", res.status);
  return Array.isArray(data.rollbacks) ? data.rollbacks : [];
}

export async function applyBankRollback(userId: number): Promise<BankRollbackCandidate> {
  const res = await fetch(`${getBaseUrl()}/api/admin/bank-rollbacks/${userId}`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({}),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(data.error || "Помилка відкату", res.status);
  return data.rollback;
}
