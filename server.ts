import express, { Request, Response } from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;
const PYTHON_BACKEND_URL = "https://artemfurry.pythonanywhere.com";

app.use(express.json({ limit: "5mb" }));

// Allow CORS for Telegram WebApp from any origin
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, X-Telegram-Init-Data, X-Init-Data, X-Telegram-User-Id, X-Telegram-User-Name");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

// In-memory persistent database for preview / fallback mode
interface UserSessionData {
  userId: number;
  chatId: number;
  name: string;
  tag: string;
  level: {
    current: number;
    xp: number;
    next_level_xp: number;
    title: string;
  };
  farm: {
    potato: {
      planted_at: number;
      growth_duration: number;
      count: number;
      max_count: number;
    };
    chickens: {
      count: number;
      chicks: number;
      roosters: number;
      eggs: number;
      max_capacity: number;
      feed_level: number;
      last_feed_time: number;
    };
    pigs: {
      count: number;
      piglets: number;
      meat: number;
      feed_level: number;
      last_feed_time: number;
    };
    cows: {
      count: number;
      milk: number;
      cheese: number;
      feed_level: number;
      last_feed_time: number;
    };
    ostriches: {
      count: number;
      feathers: number;
      eggs: number;
      feed_level: number;
      last_feed_time: number;
    };
  };
  economy: {
    balance: number;
    gems: number;
    storage: {
      used: number;
      max: number;
    };
    prices: {
      potato: number;
      egg: number;
      milk: number;
      cheese: number;
      meat: number;
      ostrich_feather: number;
      ostrich_egg: number;
      wheat: number;
    };
    feed_stock: {
      grain: number;
      hay: number;
      premium: number;
    };
    seed_stock: {
      potato: number;
      wheat: number;
    };
  };
  wheat: {
    plots: Array<{
      id: number;
      planted_at: number;
      duration: number;
    }>;
    granary_used: number;
    granary_max: number;
    total_harvested: number;
  };
  workers: {
    hired: number;
    speed_boost: number;
    auto_collector: boolean;
    slots: number;
    cost_per_hour: number;
  };
  business: {
    level_name: string;
    contracts: Array<{
      id: string;
      title: string;
      description: string;
      req_item: string;
      req_count: number;
      reward_coins: number;
      reward_xp: number;
      fulfilled: boolean;
    }>;
    upgrades: {
      sprinkler: number;
      auto_feeder: number;
      tractor: number;
    };
  };
}

const sessions: Map<string, UserSessionData> = new Map();

function createDefaultState(userId = 1001, name = "Фермер"): UserSessionData {
  return {
    userId,
    chatId: userId,
    name,
    tag: "Агроном 🌾",
    level: {
      current: 1,
      xp: 40,
      next_level_xp: 500,
      title: "Фермер-початківець",
    },
    farm: {
      potato: {
        planted_at: 0,
        growth_duration: 30,
        count: 0,
        max_count: 5000,
      },
      chickens: {
        count: 5,
        chicks: 2,
        roosters: 1,
        eggs: 6,
        max_capacity: 5000,
        feed_level: 100,
        last_feed_time: Date.now(),
      },
      pigs: {
        count: 2,
        piglets: 0,
        meat: 4,
        feed_level: 100,
        last_feed_time: Date.now(),
      },
      cows: {
        count: 1,
        milk: 12,
        cheese: 2,
        feed_level: 100,
        last_feed_time: Date.now(),
      },
      ostriches: {
        count: 1,
        feathers: 3,
        eggs: 1,
        feed_level: 100,
        last_feed_time: Date.now(),
      },
    },
    economy: {
      balance: 1500,
      gems: 0,
      storage: {
        used: 28,
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
        grain: 120,
        hay: 80,
        premium: 20,
      },
      seed_stock: {
        potato: 50,
        wheat: 40,
      },
    },
    wheat: {
      plots: [
        { id: 1, planted_at: 0, duration: 45 },
        { id: 2, planted_at: 0, duration: 45 },
        { id: 3, planted_at: 0, duration: 45 },
        { id: 4, planted_at: 0, duration: 45 },
        { id: 5, planted_at: 0, duration: 45 },
        { id: 6, planted_at: 0, duration: 45 },
        { id: 7, planted_at: 0, duration: 45 },
        { id: 8, planted_at: 0, duration: 45 },
        { id: 9, planted_at: 0, duration: 45 },
        { id: 10, planted_at: 0, duration: 45 },
        { id: 11, planted_at: 0, duration: 45 },
        { id: 12, planted_at: 0, duration: 45 },
        { id: 13, planted_at: 0, duration: 45 },
        { id: 14, planted_at: 0, duration: 45 },
        { id: 15, planted_at: 0, duration: 45 },
        { id: 16, planted_at: 0, duration: 45 },
      ],
      granary_used: 15,
      granary_max: 500,
      total_harvested: 15,
    },
    workers: {
      hired: 0,
      speed_boost: 0,
      auto_collector: false,
      slots: 4,
      cost_per_hour: 40,
    },
    business: {
      level_name: "Ферма А-11",
      contracts: [
        {
          id: "c1",
          title: "Постачання в пекарню 'Колосок'",
          description: "Потрібно 10 снопів пшениці для свіжого хліба",
          req_item: "wheat",
          req_count: 10,
          reward_coins: 500,
          reward_xp: 120,
          fulfilled: false,
        },
        {
          id: "c2",
          title: "Сніданки для кафе 'Затишок'",
          description: "Замовлення на 8 свіжих фермерських яєць",
          req_item: "egg",
          req_count: 8,
          reward_coins: 300,
          reward_xp: 80,
          fulfilled: false,
        },
      ],
      upgrades: {
        sprinkler: 0,
        auto_feeder: 0,
        tractor: 0,
      },
    },
  };
}

function parseTelegramUser(initData: string) {
  if (!initData) return null;
  try {
    const params = new URLSearchParams(initData);
    const userJson = params.get("user");
    if (userJson) {
      return JSON.parse(userJson);
    }
  } catch (e) {
    console.error("Failed to parse telegram initData", e);
  }
  return null;
}

function getSessionKey(req: Request): string {
  const initData = (req.headers["x-telegram-init-data"] as string) || (req.headers["x-init-data"] as string) || "";
  const user = parseTelegramUser(initData);
  if (user && user.id) {
    return `tg_${user.id}`;
  }
  const customId = req.headers["x-telegram-user-id"] as string;
  if (customId && !isNaN(Number(customId))) {
    return `tg_${customId}`;
  }
  return "farmer_session";
}

function getOrCreateSession(req: Request): UserSessionData {
  const key = getSessionKey(req);
  if (!sessions.has(key)) {
    const initData = (req.headers["x-telegram-init-data"] as string) || (req.headers["x-init-data"] as string) || "";
    const user = parseTelegramUser(initData);
    const customId = req.headers["x-telegram-user-id"] as string;
    const customName = req.headers["x-telegram-user-name"] as string;

    let userId = 1001;
    let name = "Фермер";

    if (user && user.id) {
      userId = user.id;
      name = `${user.first_name || ""} ${user.last_name || ""}`.trim() || user.username || "Фермер";
    } else if (customId && !isNaN(Number(customId))) {
      userId = Number(customId);
      name = customName ? decodeURIComponent(customName) : `Фермер #${customId}`;
    }

    sessions.set(key, createDefaultState(userId, name));
  }
  return sessions.get(key)!;
}

// Helper to proxy requests directly to PythonAnywhere bot backend
async function forwardToPythonBackend(endpoint: string, method: string, req: Request, res: Response): Promise<boolean> {
  const initData = (req.headers["x-telegram-init-data"] as string) || (req.headers["x-init-data"] as string);
  
  // If there's no initData at all (e.g. web browser preview), fallback to local mock server
  if (!initData) {
    return false;
  }

  try {
    const forwardHeaders: Record<string, string> = {
      "Content-Type": "application/json",
      "X-Telegram-Init-Data": initData,
      "X-Init-Data": initData,
    };

    const targetUrl = `${PYTHON_BACKEND_URL}${endpoint}`;
    const options: RequestInit = {
      method,
      headers: forwardHeaders,
    };

    if (method !== "GET" && method !== "HEAD") {
      options.body = JSON.stringify(req.body || {});
    }

    const remoteRes = await fetch(targetUrl, options);
    const responseData = await remoteRes.json().catch(() => null);

    if (remoteRes.ok && responseData) {
      res.status(remoteRes.status).json(responseData);
      return true;
    }

    if (remoteRes.status === 401 || remoteRes.status === 400 || remoteRes.status === 503) {
      // Backend returned auth error or action error
      res.status(remoteRes.status).json(responseData || { ok: false, error: "Backend error" });
      return true;
    }
  } catch (err) {
    console.error(`Error forwarding request to ${endpoint}:`, err);
  }
  return false;
}

// Health check endpoint
app.get(["/health", "/api/health"], async (_req: Request, res: Response) => {
  try {
    const ping = await fetch(`${PYTHON_BACKEND_URL}/health`, { method: "GET" }).catch(() => null);
    const isRemoteAlive = ping?.ok ?? false;
    res.json({
      ok: true,
      status: "healthy",
      backend: "https://artemfurry.pythonanywhere.com",
      remote_alive: isRemoteAlive,
    });
  } catch {
    res.json({ ok: true, status: "healthy", backend_offline: true });
  }
});

// 1. POST /api/auth
app.post("/api/auth", async (req: Request, res: Response) => {
  const forwarded = await forwardToPythonBackend("/api/auth", "POST", req, res);
  if (forwarded) return;

  const { initData, customUserId, customUserName } = req.body || {};
  const user = parseTelegramUser(initData);

  if (user && user.id) {
    const userId = user.id;
    const key = `tg_${userId}`;
    const name = `${user.first_name || ""} ${user.last_name || ""}`.trim() || user.username || "Фермер";
    if (!sessions.has(key)) {
      sessions.set(key, createDefaultState(userId, name));
    }
    return res.json({
      ok: true,
      chat_id: userId,
      user_id: userId,
      name,
    });
  }

  const customId = customUserId || (req.headers["x-telegram-user-id"] as string);
  const customName = customUserName || (req.headers["x-telegram-user-name"] as string);
  if (customId && !isNaN(Number(customId))) {
    const userId = Number(customId);
    const key = `tg_${userId}`;
    const name = customName ? String(customName) : `Фермер #${userId}`;
    if (!sessions.has(key)) {
      sessions.set(key, createDefaultState(userId, name));
    }
    return res.json({
      ok: true,
      chat_id: userId,
      user_id: userId,
      name,
    });
  }

  return res.json({
    ok: true,
    chat_id: 1001,
    user_id: 1001,
    name: "Фермер",
  });
});

// 2. GET and POST /api/state
app.all("/api/state", async (req: Request, res: Response) => {
  const forwarded = await forwardToPythonBackend("/api/state", req.method === "GET" ? "GET" : "POST", req, res);
  if (forwarded) return;

  const session = getOrCreateSession(req);
  const now = Date.now();

  const potato = session.farm.potato;
  const potatoElapsed = (now - potato.planted_at) / 1000;
  const potatoReady = potato.planted_at > 0 && potatoElapsed >= potato.growth_duration;
  const potatoProgress = potato.planted_at > 0 ? Math.min(100, Math.round((potatoElapsed / potato.growth_duration) * 100)) : 0;

  const computedWheatPlots = session.wheat.plots.map((plot) => {
    if (plot.planted_at === 0) {
      return { ...plot, stage: 0, ready: false, progress: 0 };
    }
    const elapsed = (now - plot.planted_at) / 1000;
    const progress = Math.min(100, Math.round((elapsed / plot.duration) * 100));
    let stage = 1;
    if (progress >= 100) stage = 4;
    else if (progress >= 66) stage = 3;
    else if (progress >= 33) stage = 2;

    return {
      ...plot,
      stage,
      ready: progress >= 100,
      progress,
    };
  });

  return res.json({
    ok: true,
    user: {
      id: session.userId,
      name: session.name,
    },
    state: {
      farm: {
        ...session.farm,
        potato: {
          ...potato,
          ready: potatoReady,
          growth_progress: potatoProgress,
          seconds_left: Math.max(0, Math.round(potato.growth_duration - potatoElapsed)),
        },
      },
      economy: session.economy,
      wheat: {
        ...session.wheat,
        plots: computedWheatPlots,
      },
      workers: session.workers,
      business: session.business,
      tag: session.tag,
      level: session.level,
      prices: session.economy.prices,
    },
  });
});

// 3. POST /api/action
app.post("/api/action", async (req: Request, res: Response) => {
  const forwarded = await forwardToPythonBackend("/api/action", "POST", req, res);
  if (forwarded) return;

  const session = getOrCreateSession(req);
  const { action, count, item } = req.body || {};
  const amount = Number(count) || 1;
  const now = Date.now();

  switch (action) {
    case "plant_potato": {
      const neededSeeds = amount;
      if (session.economy.seed_stock.potato < neededSeeds) {
        return res.status(400).json({ ok: false, error: "Не вистачає насіння картоплі в коморі!" });
      }
      session.economy.seed_stock.potato -= neededSeeds;
      session.farm.potato.planted_at = now;
      session.farm.potato.count = neededSeeds;
      return res.json({ ok: true, result: `🥔 Посаджено ${neededSeeds} кущів картоплі!` });
    }

    case "collect_farm":
    case "collect":
    case "collect_all": {
      let collectedItems: string[] = [];

      const potatoElapsed = (now - session.farm.potato.planted_at) / 1000;
      if (session.farm.potato.planted_at > 0 && potatoElapsed >= session.farm.potato.growth_duration) {
        const yieldAmount = session.farm.potato.count * 3;
        session.farm.potato.count = 0;
        session.farm.potato.planted_at = 0;
        session.economy.storage.used += yieldAmount;
        collectedItems.push(`🥔 ${yieldAmount} картоплі`);
      }

      if (session.farm.chickens.eggs > 0) {
        const eggs = session.farm.chickens.eggs;
        session.economy.storage.used += eggs;
        collectedItems.push(`🥚 ${eggs} яєць`);
        session.farm.chickens.eggs = 0;
      }

      if (session.farm.cows.milk > 0) {
        const milk = session.farm.cows.milk;
        session.economy.storage.used += milk;
        collectedItems.push(`🥛 ${milk} л молока`);
        session.farm.cows.milk = 0;
      }

      if (session.farm.ostriches.feathers > 0) {
        const feathers = session.farm.ostriches.feathers;
        session.economy.storage.used += feathers;
        collectedItems.push(`🪶 ${feathers} пір'їн`);
        session.farm.ostriches.feathers = 0;
      }

      if (collectedItems.length === 0) {
        return res.json({ ok: true, result: "Наразі немає готової продукції для збору." });
      }

      return res.json({
        ok: true,
        result: `🌾 Успішно зібрано: ${collectedItems.join(", ")}!`,
      });
    }

    case "slaughter": {
      if (session.farm.pigs.count < amount) {
        return res.status(400).json({ ok: false, error: "Немає стільки свиней для забою!" });
      }
      session.farm.pigs.count -= amount;
      const meatYield = amount * 18;
      session.farm.pigs.meat += meatYield;
      return res.json({
        ok: true,
        result: `🥩 Отримано ${meatYield} кг свіжого м'яса свинини!`,
      });
    }

    case "cheese": {
      const milkNeeded = 10;
      if (session.farm.cows.milk < milkNeeded) {
        return res.status(400).json({ ok: false, error: "Потрібно 10 л молока для виготовлення сиру!" });
      }
      session.farm.cows.milk -= milkNeeded;
      session.farm.cows.cheese += 1;
      return res.json({
        ok: true,
        result: `🧀 Приготовлено 1 головку свіжого сиру!`,
      });
    }

    case "breed": {
      if (session.farm.chickens.count >= 2 && session.farm.chickens.roosters >= 1) {
        session.farm.chickens.chicks += 2;
        return res.json({ ok: true, result: "🐣 У курнику вилупилося 2 курчат!" });
      }
      return res.status(400).json({ ok: false, error: "Потрібно щонайменше 2 курки та 1 півень!" });
    }

    case "raise_chicks":
    case "raise": {
      if (session.farm.chickens.chicks > 0) {
        const chicksCount = session.farm.chickens.chicks;
        session.farm.chickens.chicks = 0;
        session.farm.chickens.count += chicksCount;
        return res.json({ ok: true, result: `🐓 ${chicksCount} курчат виросли у дорослих курей!` });
      }
      return res.json({ ok: true, result: "Усі птахи вже дорослі." });
    }

    case "shop_buy": {
      const shopPrices: Record<string, number> = {
        seed: 8,
        potato_seed: 8,
        wheat_seed: 10,
        grain: 5,
        hay: 8,
        mix: 25,
        chicken: 45,
        rooster: 120,
        pig: 180,
        cow: 450,
        ostrich: 650,
      };

      const pricePerUnit = shopPrices[item] || 50;
      const totalCost = pricePerUnit * amount;

      if (session.economy.balance < totalCost) {
        return res.status(400).json({ ok: false, error: `Не вистачає монет! Потрібно 🪙 ${totalCost}, у вас 🪙 ${session.economy.balance}` });
      }

      session.economy.balance -= totalCost;

      if (item === "seed" || item === "potato_seed") session.economy.seed_stock.potato += amount;
      else if (item === "wheat_seed") session.economy.seed_stock.wheat += amount;
      else if (item === "grain") session.economy.feed_stock.grain += amount;
      else if (item === "hay") session.economy.feed_stock.hay += amount;
      else if (item === "mix") session.economy.feed_stock.premium += amount;
      else if (item === "chicken") session.farm.chickens.count += amount;
      else if (item === "rooster") session.farm.chickens.roosters += amount;
      else if (item === "pig") session.farm.pigs.count += amount;
      else if (item === "cow") session.farm.cows.count += amount;
      else if (item === "ostrich") session.farm.ostriches.count += amount;

      return res.json({
        ok: true,
        result: `🛒 Куплено ${amount} од. товару! Витрачено 🪙 ${totalCost}.`,
      });
    }

    case "sell_product":
    case "market_sell": {
      const itemToSell = req.body.item;
      const sellAmount = Number(req.body.count) || 1;
      const prices = session.economy.prices;

      let itemPrice = 10;
      if (itemToSell === "potato") {
        itemPrice = prices.potato;
        session.farm.potato.count = Math.max(0, session.farm.potato.count - sellAmount);
      } else if (itemToSell === "eggs" || itemToSell === "egg") {
        itemPrice = prices.egg;
        session.farm.chickens.eggs = Math.max(0, session.farm.chickens.eggs - sellAmount);
      } else if (itemToSell === "milk") {
        itemPrice = prices.milk;
        session.farm.cows.milk = Math.max(0, session.farm.cows.milk - sellAmount);
      } else if (itemToSell === "cheese") {
        itemPrice = prices.cheese;
        session.farm.cows.cheese = Math.max(0, session.farm.cows.cheese - sellAmount);
      } else if (itemToSell === "meat") {
        itemPrice = prices.meat;
        session.farm.pigs.meat = Math.max(0, session.farm.pigs.meat - sellAmount);
      } else if (itemToSell === "feather" || itemToSell === "feathers") {
        itemPrice = prices.ostrich_feather;
        session.farm.ostriches.feathers = Math.max(0, session.farm.ostriches.feathers - sellAmount);
      } else if (itemToSell === "ostrich_egg" || itemToSell === "ostrich_eggs") {
        itemPrice = prices.ostrich_egg;
        session.farm.ostriches.eggs = Math.max(0, session.farm.ostriches.eggs - sellAmount);
      }

      const earnings = itemPrice * sellAmount;
      session.economy.balance += earnings;

      return res.json({
        ok: true,
        result: `💰 Продано ${sellAmount} од. за 🪙 ${earnings}!`,
      });
    }

    case "wheat_plant":
    case "plant_wheat_all": {
      let plantedCount = 0;
      session.wheat.plots.forEach((plot) => {
        if (plot.planted_at === 0 && session.economy.seed_stock.wheat > 0) {
          plot.planted_at = now;
          session.economy.seed_stock.wheat -= 1;
          plantedCount++;
        }
      });
      return res.json({ ok: true, result: `🌾 Засіяно ${plantedCount} ділянок пшениці!` });
    }

    case "wheat_collect":
    case "harvest_wheat_all": {
      let harvestedCount = 0;
      let totalYield = 0;
      session.wheat.plots.forEach((plot) => {
        const elapsed = (now - plot.planted_at) / 1000;
        if (plot.planted_at > 0 && elapsed >= plot.duration) {
          totalYield += 6;
          plot.planted_at = 0;
          harvestedCount++;
        }
      });
      session.wheat.granary_used = Math.min(session.wheat.granary_max, session.wheat.granary_used + totalYield);
      return res.json({
        ok: true,
        result: `✨ Зібрано ${harvestedCount} ділянок! Отримано 🌾 ${totalYield} пшениці.`,
      });
    }

    case "wheat_sell_local": {
      const amountToSell = Number(req.body.count) || session.wheat.granary_used;
      const actualSell = Math.min(session.wheat.granary_used, amountToSell);
      const earned = actualSell * session.economy.prices.wheat;
      session.wheat.granary_used -= actualSell;
      session.economy.balance += earned;
      return res.json({
        ok: true,
        result: `🌾 Продано ${actualSell} пшениці за 🪙 ${earned}!`,
      });
    }

    default:
      return res.json({ ok: true, result: "Дію успішно виконано!" });
  }
});

// 4. GET & POST /api/leaderboard
app.all("/api/leaderboard", async (req: Request, res: Response) => {
  const forwarded = await forwardToPythonBackend("/api/leaderboard", "GET", req, res);
  if (forwarded) return;

  const session = getOrCreateSession(req);
  const mockLeaderboard = [
    { user_id: 101, name: "Олександр 'Трактор' 🇺🇦", balance: 148500, rank: 1, tag: "Агро-Олігарх" },
    { user_id: 102, name: "Марія Степанівна", balance: 94200, rank: 2, tag: "Королева Сиру 🧀" },
    { user_id: 103, name: "Богдан Подільський", balance: 78100, rank: 3, tag: "Майстер Пшениці 🌾" },
    { user_id: 104, name: "Андрій Квітучий", balance: 52400, rank: 4, tag: "Агроном Полісся" },
    { user_id: session.userId, name: `${session.name} (Ви)`, balance: session.economy.balance, rank: 5, tag: session.tag, isSelf: true },
  ];

  return res.json({ ok: true, leaderboard: mockLeaderboard });
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🌾 Ферма А-11 Сервер успішно запущено на http://0.0.0.0:${PORT} з проксі на ${PYTHON_BACKEND_URL}`);
  });
}

startServer();

