import express, { Request, Response } from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// In-memory persistent database for state if no external backend is connected
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
      growth_duration: number; // in seconds
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
      planted_at: number; // 0 if empty
      duration: number; // seconds to full growth
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
      xp: 0,
      next_level_xp: 100,
      title: "Фермер-початківець",
    },
    farm: {
      potato: {
        planted_at: 0,
        growth_duration: 30, // 30s
        count: 0,
        max_count: 50,
      },
      chickens: {
        count: 0,
        chicks: 0,
        roosters: 0,
        eggs: 0,
        max_capacity: 20,
        feed_level: 100,
        last_feed_time: Date.now(),
      },
      pigs: {
        count: 0,
        piglets: 0,
        meat: 0,
        feed_level: 100,
        last_feed_time: Date.now(),
      },
      cows: {
        count: 0,
        milk: 0,
        cheese: 0,
        feed_level: 100,
        last_feed_time: Date.now(),
      },
      ostriches: {
        count: 0,
        feathers: 0,
        eggs: 0,
        feed_level: 100,
        last_feed_time: Date.now(),
      },
    },
    economy: {
      balance: 150,
      gems: 0,
      storage: {
        used: 0,
        max: 100,
      },
      prices: {
        potato: 12,
        egg: 8,
        milk: 22,
        cheese: 65,
        meat: 55,
        ostrich_feather: 140,
        ostrich_egg: 190,
        wheat: 16,
      },
      feed_stock: {
        grain: 0,
        hay: 0,
        premium: 0,
      },
      seed_stock: {
        potato: 5,
        wheat: 5,
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
      granary_used: 0,
      granary_max: 100,
      total_harvested: 0,
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
          reward_coins: 250,
          reward_xp: 80,
          fulfilled: false,
        },
        {
          id: "c2",
          title: "Сніданки для кафе 'Затишок'",
          description: "Замовлення на 8 свіжих фермерських яєць",
          req_item: "egg",
          req_count: 8,
          reward_coins: 140,
          reward_xp: 60,
          fulfilled: false,
        },
        {
          id: "c3",
          title: "Крафтова сироварня",
          description: "Партія з 2 головок витриманого сиру",
          req_item: "cheese",
          req_count: 2,
          reward_coins: 260,
          reward_xp: 100,
          fulfilled: false,
        },
        {
          id: "c4",
          title: "Екзотичний ресторан 'Оазис'",
          description: "Потрібно 2 страусині яйця для фірмового омлету",
          req_item: "ostrich_egg",
          req_count: 2,
          reward_coins: 600,
          reward_xp: 200,
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
  const initData = (req.headers["x-telegram-init-data"] as string) || "";
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
    const initData = (req.headers["x-telegram-init-data"] as string) || "";
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

// 1. POST /api/auth
app.post("/api/auth", (req: Request, res: Response) => {
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
      user_name: name,
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
      user_name: name,
    });
  }

  const defaultKey = "farmer_session";
  if (!sessions.has(defaultKey)) {
    sessions.set(defaultKey, createDefaultState(1001, "Фермер"));
  }
  return res.json({
    ok: true,
    chat_id: 1001,
    user_id: 1001,
    user_name: "Фермер",
  });
});

// 2. GET /api/state
app.get("/api/state", (req: Request, res: Response) => {
  const session = getOrCreateSession(req);
  const now = Date.now();

  // Dynamic calculations for potato
  const potato = session.farm.potato;
  const potatoElapsed = (now - potato.planted_at) / 1000;
  const potatoReady = potato.planted_at > 0 && potatoElapsed >= potato.growth_duration;
  const potatoProgress = potato.planted_at > 0 ? Math.min(100, Math.round((potatoElapsed / potato.growth_duration) * 100)) : 0;

  // Dynamic calculations for wheat plots
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
      harvest_yield: 5 + (session.business.upgrades.tractor || 0) * 2,
    };
  });

  return res.json({
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
  });
});

// Add XP helper
function addXp(session: UserSessionData, xpGain: number): { leveledUp: boolean; newLevel: number } {
  session.level.xp += xpGain;
  let leveledUp = false;
  while (session.level.xp >= session.level.next_level_xp) {
    session.level.xp -= session.level.next_level_xp;
    session.level.current += 1;
    session.level.next_level_xp = Math.round(session.level.next_level_xp * 1.35);
    leveledUp = true;
  }
  return { leveledUp, newLevel: session.level.current };
}

// 3. POST /api/action
app.post("/api/action", (req: Request, res: Response) => {
  const session = getOrCreateSession(req);
  const { action, count, item, plot_id, contract_id } = req.body || {};
  const amount = Number(count) || 1;
  const now = Date.now();

  switch (action) {
    case "plant_potato": {
      const neededSeeds = amount;
      if (session.economy.seed_stock.potato < neededSeeds) {
        return res.status(400).json({ ok: false, message: "Не вистачає насіння картоплі в коморі!" });
      }
      session.economy.seed_stock.potato -= neededSeeds;
      session.farm.potato.planted_at = now;
      session.farm.potato.count = neededSeeds;
      return res.json({ ok: true, message: `🥔 Посаджено ${neededSeeds} кущів картоплі! Полив завершено.` });
    }

    case "collect": {
      // Collect all ready harvests: potato + eggs + milk + wheat ready
      let collectedItems: string[] = [];
      let totalXp = 0;

      // 1. Potato
      const potatoElapsed = (now - session.farm.potato.planted_at) / 1000;
      if (session.farm.potato.planted_at > 0 && potatoElapsed >= session.farm.potato.growth_duration) {
        const yieldAmount = session.farm.potato.count * 3;
        session.economy.storage.used += yieldAmount;
        collectedItems.push(`🥔 ${yieldAmount} шт. картоплі`);
        totalXp += 40;
        session.farm.potato.planted_at = 0;
        session.farm.potato.count = 0;
      }

      // 2. Chickens (eggs)
      if (session.farm.chickens.eggs > 0) {
        const eggs = session.farm.chickens.eggs;
        session.economy.storage.used += eggs;
        collectedItems.push(`🥚 ${eggs} яєць`);
        totalXp += eggs * 2;
        session.farm.chickens.eggs = 0;
      }

      // 3. Cows (milk)
      if (session.farm.cows.milk > 0) {
        const milk = session.farm.cows.milk;
        session.economy.storage.used += milk;
        collectedItems.push(`🥛 ${milk} л молока`);
        totalXp += milk * 4;
        session.farm.cows.milk = 0;
      }

      // 4. Ostriches (feathers)
      if (session.farm.ostriches.feathers > 0) {
        const feathers = session.farm.ostriches.feathers;
        session.economy.storage.used += feathers;
        collectedItems.push(`🪶 ${feathers} пір'їн`);
        totalXp += feathers * 8;
        session.farm.ostriches.feathers = 0;
      }

      if (collectedItems.length === 0) {
        return res.json({ ok: true, message: "Наразі немає готової продукції для збору. Зачекайте трохи!" });
      }

      addXp(session, totalXp);
      return res.json({
        ok: true,
        message: `🌾 Успішно зібрано: ${collectedItems.join(", ")}! (+${totalXp} XP)`,
      });
    }

    case "slaughter": {
      if (session.farm.pigs.count < amount) {
        return res.status(400).json({ ok: false, message: "Немає стільки свиней для забою!" });
      }
      session.farm.pigs.count -= amount;
      const meatYield = amount * 18;
      session.farm.pigs.meat += meatYield;
      session.economy.storage.used += meatYield;
      addXp(session, amount * 35);
      return res.json({
        ok: true,
        message: `🥩 Отримано ${meatYield} кг відбірного м'яса свинини!`,
      });
    }

    case "cheese": {
      const milkNeeded = amount * 3;
      if (session.farm.cows.milk < milkNeeded) {
        return res.status(400).json({ ok: false, message: `Потрібно ${milkNeeded} л молока для виготовлення ${amount} головок сиру!` });
      }
      session.farm.cows.milk -= milkNeeded;
      session.farm.cows.cheese += amount;
      addXp(session, amount * 25);
      return res.json({
        ok: true,
        message: `🧀 Приготовлено ${amount} головок витриманого фермерського сиру!`,
      });
    }

    case "breed": {
      // Breed animals
      if (session.farm.chickens.count >= 2 && session.farm.chickens.roosters >= 1) {
        session.farm.chickens.chicks += 2;
        addXp(session, 30);
        return res.json({ ok: true, message: "🐣 У курнику вилупилося 2 нових курчат!" });
      }
      return res.status(400).json({ ok: false, message: "Для розведення потрібні щонайменше 2 курки та 1 півень!" });
    }

    case "raise": {
      // Grow young animals
      if (session.farm.chickens.chicks > 0) {
        const chicksCount = session.farm.chickens.chicks;
        session.farm.chickens.chicks = 0;
        session.farm.chickens.count += chicksCount;
        return res.json({ ok: true, message: `🐓 ${chicksCount} курчат виросли у дорослих курей!` });
      }
      if (session.farm.pigs.piglets > 0) {
        const count = session.farm.pigs.piglets;
        session.farm.pigs.piglets = 0;
        session.farm.pigs.count += count;
        return res.json({ ok: true, message: `🐖 ${count} поросят підросли!` });
      }
      return res.json({ ok: true, message: "Всі молоді тварини вже доглянуті та ростуть згідно графіка." });
    }

    case "feed_animals": {
      const target = req.body.target || "all";
      if (session.economy.feed_stock.grain < 10) {
        return res.status(400).json({ ok: false, message: "Не вистачає зерна в коморі! Купіть у Магазині." });
      }
      session.economy.feed_stock.grain -= 10;
      session.farm.chickens.feed_level = 100;
      session.farm.chickens.eggs += Math.min(12, session.farm.chickens.count * 2);
      session.farm.cows.feed_level = 100;
      session.farm.cows.milk += session.farm.cows.count * 3;
      addXp(session, 25);
      return res.json({ ok: true, message: "🥣 Тварин ситно нагодовано! Продуктивність ферми зросла." });
    }

    case "shop_buy": {
      const shopPrices: Record<string, number> = {
        seed_potato: 8,
        seed_wheat: 10,
        grain_feed: 5,
        hay_feed: 8,
        chick: 45,
        rooster: 120,
        piglet: 180,
        cow: 450,
        ostrich_chick: 650,
        title_legend: 2500,
      };

      const pricePerUnit = shopPrices[item] || 50;
      const totalCost = pricePerUnit * amount;

      if (session.economy.balance < totalCost) {
        return res.status(400).json({ ok: false, message: `Не вистачає монет! Потрібно 🪙 ${totalCost}, у вас 🪙 ${session.economy.balance}` });
      }

      session.economy.balance -= totalCost;

      if (item === "seed_potato") session.economy.seed_stock.potato += amount * 10;
      else if (item === "seed_wheat") session.economy.seed_stock.wheat += amount * 10;
      else if (item === "grain_feed") session.economy.feed_stock.grain += amount * 20;
      else if (item === "hay_feed") session.economy.feed_stock.hay += amount * 15;
      else if (item === "chick") session.farm.chickens.chicks += amount;
      else if (item === "rooster") session.farm.chickens.roosters += amount;
      else if (item === "piglet") session.farm.pigs.piglets += amount;
      else if (item === "cow") session.farm.cows.count += amount;
      else if (item === "ostrich_chick") session.farm.ostriches.count += amount;
      else if (item === "title_legend") session.tag = "Легендарний Агробарон 👑";

      addXp(session, Math.round(totalCost * 0.08));
      return res.json({
        ok: true,
        message: `🛒 Куплено успішно! Витрачено 🪙 ${totalCost}.`,
      });
    }

    case "market_sell": {
      const itemToSell = req.body.item;
      const sellAmount = Number(req.body.count) || 1;
      const prices = session.economy.prices;

      let itemPrice = 10;
      let available = 0;

      if (itemToSell === "potato") {
        itemPrice = prices.potato;
        available = session.farm.potato.count;
        if (available < sellAmount) return res.status(400).json({ ok: false, message: "Не вистачає картоплі для продажу!" });
        session.farm.potato.count -= sellAmount;
      } else if (itemToSell === "egg") {
        itemPrice = prices.egg;
        available = session.farm.chickens.eggs;
        if (available < sellAmount) return res.status(400).json({ ok: false, message: "Не вистачає яєць!" });
        session.farm.chickens.eggs -= sellAmount;
      } else if (itemToSell === "milk") {
        itemPrice = prices.milk;
        available = session.farm.cows.milk;
        if (available < sellAmount) return res.status(400).json({ ok: false, message: "Не вистачає молока!" });
        session.farm.cows.milk -= sellAmount;
      } else if (itemToSell === "cheese") {
        itemPrice = prices.cheese;
        available = session.farm.cows.cheese;
        if (available < sellAmount) return res.status(400).json({ ok: false, message: "Не вистачає сиру!" });
        session.farm.cows.cheese -= sellAmount;
      } else if (itemToSell === "meat") {
        itemPrice = prices.meat;
        available = session.farm.pigs.meat;
        if (available < sellAmount) return res.status(400).json({ ok: false, message: "Не вистачає м'яса!" });
        session.farm.pigs.meat -= sellAmount;
      } else if (itemToSell === "wheat") {
        itemPrice = prices.wheat;
        available = session.wheat.granary_used;
        if (available < sellAmount) return res.status(400).json({ ok: false, message: "Не вистачає пшениці у сховищі!" });
        session.wheat.granary_used -= sellAmount;
      }

      const earnings = itemPrice * sellAmount;
      session.economy.balance += earnings;
      addXp(session, Math.round(earnings * 0.05));

      return res.json({
        ok: true,
        message: `💰 Продано ${sellAmount} од. на ринку за 🪙 ${earnings}!`,
      });
    }

    case "plant_wheat_all": {
      let plantedCount = 0;
      session.wheat.plots.forEach((plot) => {
        if (plot.planted_at === 0 && session.economy.seed_stock.wheat > 0) {
          plot.planted_at = now;
          session.economy.seed_stock.wheat -= 1;
          plantedCount++;
        }
      });
      if (plantedCount === 0) {
        return res.status(400).json({ ok: false, message: "Немає вільних ділянок або закінчилося насіння пшениці!" });
      }
      return res.json({ ok: true, message: `🌾 Засіяно ${plantedCount} ділянок пшениці!` });
    }

    case "harvest_wheat_all": {
      let harvestedCount = 0;
      let totalYield = 0;
      session.wheat.plots.forEach((plot) => {
        const elapsed = (now - plot.planted_at) / 1000;
        if (plot.planted_at > 0 && elapsed >= plot.duration) {
          const plotYield = 6 + (session.business.upgrades.tractor || 0) * 2;
          totalYield += plotYield;
          plot.planted_at = 0;
          harvestedCount++;
        }
      });
      if (harvestedCount === 0) {
        return res.json({ ok: true, message: "Пшениця ще дозріває на ділянках!" });
      }
      session.wheat.granary_used = Math.min(session.wheat.granary_max, session.wheat.granary_used + totalYield);
      session.wheat.total_harvested += totalYield;
      addXp(session, harvestedCount * 15);
      return res.json({
        ok: true,
        message: `✨ Зібрано ${harvestedCount} ділянок! Отримано 🌾 ${totalYield} снопів пшениці у сховище.`,
      });
    }

    case "fulfill_contract": {
      const contract = session.business.contracts.find((c) => c.id === contract_id);
      if (!contract) {
        return res.status(404).json({ ok: false, message: "Контракт не знайдено!" });
      }
      if (contract.fulfilled) {
        return res.status(400).json({ ok: false, message: "Цей контракт вже виконано!" });
      }

      // Check item
      if (contract.req_item === "wheat" && session.wheat.granary_used >= contract.req_count) {
        session.wheat.granary_used -= contract.req_count;
      } else if (contract.req_item === "egg" && session.farm.chickens.eggs >= contract.req_count) {
        session.farm.chickens.eggs -= contract.req_count;
      } else if (contract.req_item === "cheese" && session.farm.cows.cheese >= contract.req_count) {
        session.farm.cows.cheese -= contract.req_count;
      } else if (contract.req_item === "ostrich_egg" && session.farm.ostriches.eggs >= contract.req_count) {
        session.farm.ostriches.eggs -= contract.req_count;
      } else {
        return res.status(400).json({ ok: false, message: `Не вистачає продукції для виконання контракту (${contract.req_count} шт.)!` });
      }

      contract.fulfilled = true;
      session.economy.balance += contract.reward_coins;
      addXp(session, contract.reward_xp);

      return res.json({
        ok: true,
        message: `🤝 Контракт "${contract.title}" виконано! Отримано 🪙 ${contract.reward_coins} та +${contract.reward_xp} XP!`,
      });
    }

    case "hire_worker": {
      const cost = 500;
      if (session.economy.balance < cost) {
        return res.status(400).json({ ok: false, message: "Потрібно 🪙 500 для найму нового помічника!" });
      }
      session.economy.balance -= cost;
      session.workers.hired += 1;
      session.workers.speed_boost += 10;
      addXp(session, 100);
      return res.json({ ok: true, message: `👨‍🌾 Найнято помічника! Швидкість роботи ферми зросла на +10%.` });
    }

    case "buy_business":
    case "business_buy": {
      const bizPrices: Record<string, { price: number; name: string }> = {
        kiosk: { price: 30000, name: "Кіоск" },
        cafe: { price: 200000, name: "Кафе" },
        shop: { price: 1200000, name: "Магазин" },
        restaurant: { price: 7000000, name: "Ресторан" },
        factory: { price: 40000000, name: "Завод" },
        corporation: { price: 250000000, name: "Корпорація" },
        monopoly: { price: 1500000000, name: "Монополія" },
      };
      const bizKey = String(item || "kiosk");
      const info = bizPrices[bizKey] || { price: 50000, name: bizKey };
      if (session.economy.balance < info.price) {
        return res.status(400).json({ ok: false, message: `Не вистачає коштів на купівлю ${info.name}! Потрібно 🪙 ${info.price.toLocaleString()}` });
      }
      session.economy.balance -= info.price;
      if (bizKey === "kiosk") session.business.upgrades.sprinkler += 1;
      else if (bizKey === "cafe") session.business.upgrades.auto_feeder += 1;
      else if (bizKey === "shop") session.business.upgrades.tractor += 1;
      addXp(session, Math.round(info.price * 0.02));
      return res.json({ ok: true, message: `🏢 Придбано підприємство «${info.name}»! Пасивний дохід зріс.` });
    }

    case "sell_animal": {
      const animalPrices: Record<string, number> = {
        chick: 40,
        chicken: 60,
        rooster: 180,
        pig: 280,
        cow: 600,
        ostrich: 4000,
      };
      const animalKey = String(item || "");
      const unitPrice = animalPrices[animalKey] || 50;
      const countToSell = amount;
      let availableCount = 0;

      if (animalKey === "chick") availableCount = session.farm.chickens.chicks;
      else if (animalKey === "chicken") availableCount = session.farm.chickens.count;
      else if (animalKey === "rooster") availableCount = session.farm.chickens.roosters;
      else if (animalKey === "pig") availableCount = session.farm.pigs.count;
      else if (animalKey === "cow") availableCount = session.farm.cows.count;
      else if (animalKey === "ostrich") availableCount = session.farm.ostriches.count;

      if (availableCount < countToSell) {
        return res.status(400).json({ ok: false, message: "Немає стільки тварин для продажу!" });
      }

      if (animalKey === "chick") session.farm.chickens.chicks -= countToSell;
      else if (animalKey === "chicken") session.farm.chickens.count -= countToSell;
      else if (animalKey === "rooster") session.farm.chickens.roosters -= countToSell;
      else if (animalKey === "pig") session.farm.pigs.count -= countToSell;
      else if (animalKey === "cow") session.farm.cows.count -= countToSell;
      else if (animalKey === "ostrich") session.farm.ostriches.count -= countToSell;

      const animalEarnings = unitPrice * countToSell;
      session.economy.balance += animalEarnings;
      addXp(session, Math.round(animalEarnings * 0.05));
      return res.json({ ok: true, message: `🐾 Продано ${countToSell} тварин за 🪙 ${animalEarnings.toLocaleString()}!` });
    }

    case "wheat_sell_local": {
      const amountToSell = amount || session.wheat.granary_used;
      const actualSell = Math.min(session.wheat.granary_used, amountToSell);
      if (actualSell <= 0) {
        return res.status(400).json({ ok: false, message: "Немає пшениці для продажу!" });
      }
      const earned = actualSell * (session.economy.prices.wheat || 45);
      session.wheat.granary_used -= actualSell;
      session.economy.balance += earned;
      addXp(session, Math.round(earned * 0.05));
      return res.json({
        ok: true,
        message: `🌾 Продано ${actualSell} снопів пшениці за 🪙 ${earned.toLocaleString()}!`,
      });
    }

    case "collect_farm":
    case "collect_all":
    case "harvest_potato":
    case "collect_eggs":
    case "collect_milk":
    case "collect_ostrich": {
      // Collect all ready harvests
      let collectedItems: string[] = [];
      let totalXp = 0;

      const potatoElapsed = (now - session.farm.potato.planted_at) / 1000;
      if (session.farm.potato.planted_at > 0 && potatoElapsed >= session.farm.potato.growth_duration) {
        const yieldAmount = (session.farm.potato.count || 1) * 3;
        session.farm.potato.count = 0;
        session.farm.potato.planted_at = 0;
        session.economy.storage.used += yieldAmount;
        collectedItems.push(`🥔 ${yieldAmount} шт. картоплі`);
        totalXp += 40;
      }

      if (session.farm.chickens.eggs > 0) {
        const eggs = session.farm.chickens.eggs;
        session.economy.storage.used += eggs;
        collectedItems.push(`🥚 ${eggs} яєць`);
        totalXp += eggs * 2;
        session.farm.chickens.eggs = 0;
      }

      if (session.farm.cows.milk > 0) {
        const milk = session.farm.cows.milk;
        session.economy.storage.used += milk;
        collectedItems.push(`🥛 ${milk} л молока`);
        totalXp += milk * 4;
        session.farm.cows.milk = 0;
      }

      if (session.farm.ostriches.feathers > 0) {
        const feathers = session.farm.ostriches.feathers;
        session.economy.storage.used += feathers;
        collectedItems.push(`🪶 ${feathers} пір'їн`);
        totalXp += feathers * 8;
        session.farm.ostriches.feathers = 0;
      }

      if (collectedItems.length === 0) {
        return res.json({ ok: true, message: "Наразі немає готової продукції для збору. Зачекайте трохи!" });
      }

      addXp(session, totalXp);
      return res.json({
        ok: true,
        message: `🌾 Успішно зібрано: ${collectedItems.join(", ")}! (+${totalXp} XP)`,
      });
    }

    case "wheat_plant": {
      let plantedCount = 0;
      session.wheat.plots.forEach((plot) => {
        if (plot.planted_at === 0 && session.economy.seed_stock.wheat > 0) {
          plot.planted_at = now;
          session.economy.seed_stock.wheat -= 1;
          plantedCount++;
        }
      });
      if (plantedCount === 0) {
        return res.status(400).json({ ok: false, message: "Немає вільних ділянок або закінчилося насіння пшениці!" });
      }
      return res.json({ ok: true, message: `🌾 Засіяно ${plantedCount} ділянок пшениці!` });
    }

    case "wheat_collect": {
      let harvestedCount = 0;
      let totalYield = 0;
      session.wheat.plots.forEach((plot) => {
        const elapsed = (now - plot.planted_at) / 1000;
        if (plot.planted_at > 0 && elapsed >= plot.duration) {
          const plotYield = 6 + (session.business.upgrades.tractor || 0) * 2;
          totalYield += plotYield;
          plot.planted_at = 0;
          harvestedCount++;
        }
      });
      if (harvestedCount === 0) {
        return res.json({ ok: true, message: "Пшениця ще дозріває на ділянках!" });
      }
      session.wheat.granary_used = Math.min(session.wheat.granary_max, session.wheat.granary_used + totalYield);
      session.wheat.total_harvested += totalYield;
      addXp(session, harvestedCount * 15);
      return res.json({
        ok: true,
        message: `✨ Зібрано ${harvestedCount} ділянок! Отримано 🌾 ${totalYield} снопів пшениці у сховище.`,
      });
    }

    case "sell_product": {
      const itemToSell = req.body.item;
      const sellAmount = Number(req.body.count) || 1;
      const prices = session.economy.prices;

      let itemPrice = 10;
      let available = 0;

      if (itemToSell === "potato") {
        itemPrice = prices.potato;
        available = session.farm.potato.count;
        if (available < sellAmount) return res.status(400).json({ ok: false, message: "Не вистачає картоплі для продажу!" });
        session.farm.potato.count -= sellAmount;
      } else if (itemToSell === "egg" || itemToSell === "eggs") {
        itemPrice = prices.egg;
        available = session.farm.chickens.eggs;
        if (available < sellAmount) return res.status(400).json({ ok: false, message: "Не вистачає яєць!" });
        session.farm.chickens.eggs -= sellAmount;
      } else if (itemToSell === "milk") {
        itemPrice = prices.milk;
        available = session.farm.cows.milk;
        if (available < sellAmount) return res.status(400).json({ ok: false, message: "Не вистачає молока!" });
        session.farm.cows.milk -= sellAmount;
      } else if (itemToSell === "cheese") {
        itemPrice = prices.cheese;
        available = session.farm.cows.cheese;
        if (available < sellAmount) return res.status(400).json({ ok: false, message: "Не вистачає сиру!" });
        session.farm.cows.cheese -= sellAmount;
      } else if (itemToSell === "meat") {
        itemPrice = prices.meat;
        available = session.farm.pigs.meat;
        if (available < sellAmount) return res.status(400).json({ ok: false, message: "Не вистачає м'яса!" });
        session.farm.pigs.meat -= sellAmount;
      } else if (itemToSell === "feather" || itemToSell === "feathers") {
        itemPrice = prices.ostrich_feather;
        available = session.farm.ostriches.feathers;
        if (available < sellAmount) return res.status(400).json({ ok: false, message: "Не вистачає пір'я!" });
        session.farm.ostriches.feathers -= sellAmount;
      } else if (itemToSell === "ostrich_egg" || itemToSell === "ostrich_eggs") {
        itemPrice = prices.ostrich_egg;
        available = session.farm.ostriches.eggs;
        if (available < sellAmount) return res.status(400).json({ ok: false, message: "Не вистачає страусиних яєць!" });
        session.farm.ostriches.eggs -= sellAmount;
      } else if (itemToSell === "wheat") {
        itemPrice = prices.wheat;
        available = session.wheat.granary_used;
        if (available < sellAmount) return res.status(400).json({ ok: false, message: "Не вистачає пшениці у сховищі!" });
        session.wheat.granary_used -= sellAmount;
      }

      const earnings = itemPrice * sellAmount;
      session.economy.balance += earnings;
      addXp(session, Math.round(earnings * 0.05));

      return res.json({
        ok: true,
        message: `💰 Продано ${sellAmount} од. на ринку за 🪙 ${earnings.toLocaleString()}!`,
      });
    }

    default:
      return res.json({ ok: true, message: "Дію успішно виконано!" });
  }
});

// 4. GET /api/leaderboard
app.get("/api/leaderboard", (req: Request, res: Response) => {
  const session = getOrCreateSession(req);

  const mockLeaderboard = [
    { user_id: 101, name: "Олександр 'Трактор' 🇺🇦", balance: 148500, rank: 1, tag: "Агро-Олігарх" },
    { user_id: 102, name: "Марія Степанівна", balance: 94200, rank: 2, tag: "Королева Сиру 🧀" },
    { user_id: 103, name: "Богдан Подільський", balance: 78100, rank: 3, tag: "Майстер Пшениці 🌾" },
    { user_id: 104, name: "Андрій Квітучий", balance: 52400, rank: 4, tag: "Агроном Полісся" },
    { user_id: 105, name: "Катерина Садова", balance: 41800, rank: 5, tag: "Птаховод Року 🪶" },
    { user_id: 106, name: "Ярослав Мудрий Фермер", balance: 32900, rank: 6, tag: "Тваринник" },
    { user_id: 107, name: "Іван Карпатський", balance: 24700, rank: 7, tag: "Досвідчений" },
    { user_id: 108, name: "Олена Сонячна", balance: 18500, rank: 8, tag: "Господиня" },
    { user_id: session.userId, name: `${session.name} (Ви)`, balance: session.economy.balance, rank: 9, tag: session.tag, isSelf: true },
    { user_id: 109, name: "Віталій Полігон", balance: 9600, rank: 10, tag: "Новачок" },
  ];

  // Re-sort in case user balance changes
  mockLeaderboard.sort((a, b) => b.balance - a.balance);
  mockLeaderboard.forEach((item, index) => {
    item.rank = index + 1;
  });

  return res.json({ leaderboard: mockLeaderboard });
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
    console.log(`🌾 Ферма А-11 Сервер успішно запущено на http://0.0.0.0:${PORT}`);
  });
}

startServer();
