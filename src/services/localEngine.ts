import { GameState, ActionResponse } from "../types";

const LOCAL_STORAGE_KEY = "farmer_a11_local_state";

export function createInitialLocalState(): GameState {
  return {
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
        growth_duration: 30,
        count: 0,
        planted: 0,
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
      plots: Array.from({ length: 16 }, (_, i) => ({
        id: i + 1,
        planted_at: 0,
        duration: 45,
        stage: 0,
        ready: false,
        progress: 0,
      })),
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

export function getLocalState(): GameState {
  if (typeof window === "undefined") {
    return createInitialLocalState();
  }
  const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (!raw) {
    const fresh = createInitialLocalState();
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(fresh));
    return fresh;
  }
  try {
    const parsed = JSON.parse(raw);
    const now = Date.now();

    // Recalculate dynamic wheat plots
    if (parsed.wheat && Array.isArray(parsed.wheat.plots)) {
      parsed.wheat.plots = parsed.wheat.plots.map((plot: any) => {
        if (!plot.planted_at || plot.planted_at === 0) {
          return { ...plot, stage: 0, ready: false, progress: 0 };
        }
        const elapsed = (now - plot.planted_at) / 1000;
        const progress = Math.min(100, Math.round((elapsed / plot.duration) * 100));
        let stage = 1;
        if (progress >= 30) stage = 2;
        if (progress >= 70) stage = 3;
        if (progress >= 100) stage = 4;
        return {
          ...plot,
          stage,
          ready: progress >= 100,
          progress,
        };
      });
    }

    return parsed;
  } catch (e) {
    const fresh = createInitialLocalState();
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(fresh));
    return fresh;
  }
}

export function saveLocalState(state: GameState) {
  if (typeof window !== "undefined") {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state));
  }
}

function addXP(state: GameState, xpAmount: number) {
  state.level.xp += xpAmount;
  while (state.level.xp >= state.level.next_level_xp) {
    state.level.xp -= state.level.next_level_xp;
    state.level.current += 1;
    state.level.next_level_xp = Math.round(state.level.next_level_xp * 1.5);
    state.economy.balance += state.level.current * 100;
  }
}

export function executeLocalAction(action: string, params: Record<string, any> = {}): ActionResponse {
  const state = getLocalState();
  const now = Date.now();

  switch (action) {
    case "plant_potato": {
      if (state.farm.potato.planted_at > 0 && (state.farm.potato.planted ?? 0) > 0) {
        return { ok: false, message: "Картопля вже росте на полі!" };
      }
      const count = Math.max(1, Math.min(Number(params.count) || 1, state.economy.seed_stock.potato));
      if (state.economy.seed_stock.potato < count || count <= 0) {
        return { ok: false, message: "Немає достатньо насіння картоплі! Купіть у магазині." };
      }
      state.economy.seed_stock.potato -= count;
      state.farm.potato.planted_at = now;
      state.farm.potato.planted = count;
      saveLocalState(state);
      return { ok: true, message: `🥔 Посаджено ${count} кущів картоплі!` };
    }

    case "harvest_potato": {
      if (state.farm.potato.planted_at === 0) {
        return { ok: false, message: "На полі нічого не росте." };
      }
      const elapsed = (now - state.farm.potato.planted_at) / 1000;
      if (elapsed < state.farm.potato.growth_duration) {
        return { ok: false, message: "Картопля ще дозріває!" };
      }
      const planted = state.farm.potato.planted || 1;
      const harvested = planted * 3;
      state.farm.potato.planted_at = 0;
      state.farm.potato.planted = 0;
      state.farm.potato.count += harvested;
      state.economy.storage.used += harvested;
      addXP(state, 20);
      saveLocalState(state);
      return { ok: true, message: `✨ Зібрано +${harvested} картоплі! (+20 XP)` };
    }

    case "plant_wheat": {
      const plotId = Number(params.plot_id);
      const plot = state.wheat.plots.find((p) => p.id === plotId);
      if (!plot) return { ok: false, message: "Ділянку не знайдено." };
      if (plot.planted_at > 0) return { ok: false, message: "Ділянка вже засіяна!" };
      if (state.economy.seed_stock.wheat <= 0) {
        return { ok: false, message: "Немає насіння пшениці! Придбайте в магазині." };
      }
      state.economy.seed_stock.wheat -= 1;
      plot.planted_at = now;
      saveLocalState(state);
      return { ok: true, message: `🌾 Ділянку #${plotId} успішно засіяно!` };
    }

    case "plant_all_wheat": {
      let plantedCount = 0;
      for (const plot of state.wheat.plots) {
        if (plot.planted_at === 0 && state.economy.seed_stock.wheat > 0) {
          plot.planted_at = now;
          state.economy.seed_stock.wheat -= 1;
          plantedCount++;
        }
      }
      if (plantedCount === 0) {
        return { ok: false, message: "Немає вільних ділянок або насіння пшениці!" };
      }
      saveLocalState(state);
      return { ok: true, message: `🌾 Засіяно ${plantedCount} ділянок пшениці!` };
    }

    case "harvest_wheat": {
      const plotId = Number(params.plot_id);
      const plot = state.wheat.plots.find((p) => p.id === plotId);
      if (!plot || plot.planted_at === 0) return { ok: false, message: "Ділянка пуста." };
      const elapsed = (now - plot.planted_at) / 1000;
      if (elapsed < plot.duration) return { ok: false, message: "Пшениця ще не дозріла!" };
      plot.planted_at = 0;
      state.wheat.granary_used += 1;
      state.wheat.total_harvested += 1;
      addXP(state, 12);
      saveLocalState(state);
      return { ok: true, message: `🌾 Зібрано сніп пшениці! (+12 XP)` };
    }

    case "harvest_all_wheat": {
      let harvestedCount = 0;
      for (const plot of state.wheat.plots) {
        if (plot.planted_at > 0) {
          const elapsed = (now - plot.planted_at) / 1000;
          if (elapsed >= plot.duration) {
            plot.planted_at = 0;
            harvestedCount++;
          }
        }
      }
      if (harvestedCount === 0) {
        return { ok: false, message: "Немає дозрілої пшениці для збору." };
      }
      state.wheat.granary_used += harvestedCount;
      state.wheat.total_harvested += harvestedCount;
      addXP(state, harvestedCount * 12);
      saveLocalState(state);
      return { ok: true, message: `🌾 Зібрано ${harvestedCount} снопів пшениці! (+${harvestedCount * 12} XP)` };
    }

    case "sell_wheat": {
      const count = Number(params.count) || state.wheat.granary_used;
      if (count <= 0 || state.wheat.granary_used < count) {
        return { ok: false, message: "Недостатньо пшениці в елеваторі." };
      }
      const earned = count * state.economy.prices.wheat;
      state.wheat.granary_used -= count;
      state.economy.balance += earned;
      addXP(state, Math.round(count * 5));
      saveLocalState(state);
      return { ok: true, message: `💰 Продано ${count} снопів за +${earned} монет!` };
    }

    case "buy_shop_item": {
      const { item_id, amount = 1 } = params;
      const count = Number(amount) || 1;
      const prices: Record<string, { price: number; type: string }> = {
        potato_seed: { price: 5, type: "seed_potato" },
        wheat_seed: { price: 6, type: "seed_wheat" },
        grain_feed: { price: 8, type: "feed_grain" },
        hay_feed: { price: 12, type: "feed_hay" },
        premium_feed: { price: 25, type: "feed_premium" },
        chicken: { price: 45, type: "animal_chicken" },
        pig: { price: 120, type: "animal_pig" },
        cow: { price: 280, type: "animal_cow" },
        ostrich: { price: 650, type: "animal_ostrich" },
      };
      const def = prices[item_id];
      if (!def) return { ok: false, message: "Товар не знайдено." };
      const totalCost = def.price * count;
      if (state.economy.balance < totalCost) {
        return { ok: false, message: `Недостатньо монет! Потрібно ${totalCost} 🪙` };
      }
      state.economy.balance -= totalCost;

      if (def.type === "seed_potato") state.economy.seed_stock.potato += count;
      if (def.type === "seed_wheat") state.economy.seed_stock.wheat += count;
      if (def.type === "feed_grain") state.economy.feed_stock.grain += count;
      if (def.type === "feed_hay") state.economy.feed_stock.hay += count;
      if (def.type === "feed_premium") state.economy.feed_stock.premium += count;
      if (def.type === "animal_chicken") state.farm.chickens.count += count;
      if (def.type === "animal_pig") state.farm.pigs.count += count;
      if (def.type === "animal_cow") state.farm.cows.count += count;
      if (def.type === "animal_ostrich") state.farm.ostriches.count += count;

      addXP(state, Math.round(totalCost / 4));
      saveLocalState(state);
      return { ok: true, message: `🛒 Придбано x${count} за ${totalCost} монет!` };
    }

    case "sell_product": {
      const { product, count: reqCount } = params;
      const count = Number(reqCount) || 1;
      let unitPrice = 10;
      if (product === "potato" && state.farm.potato.count >= count) {
        unitPrice = state.economy.prices.potato;
        state.farm.potato.count -= count;
        state.economy.storage.used = Math.max(0, state.economy.storage.used - count);
      } else if (product === "egg" && state.farm.chickens.eggs >= count) {
        unitPrice = state.economy.prices.egg;
        state.farm.chickens.eggs -= count;
        state.economy.storage.used = Math.max(0, state.economy.storage.used - count);
      } else if (product === "milk" && state.farm.cows.milk >= count) {
        unitPrice = state.economy.prices.milk;
        state.farm.cows.milk -= count;
        state.economy.storage.used = Math.max(0, state.economy.storage.used - count);
      } else if (product === "meat" && state.farm.pigs.meat >= count) {
        unitPrice = state.economy.prices.meat;
        state.farm.pigs.meat -= count;
        state.economy.storage.used = Math.max(0, state.economy.storage.used - count);
      } else if (product === "cheese" && state.farm.cows.cheese >= count) {
        unitPrice = state.economy.prices.cheese;
        state.farm.cows.cheese -= count;
        state.economy.storage.used = Math.max(0, state.economy.storage.used - count);
      } else if (product === "ostrich_egg" && state.farm.ostriches.eggs >= count) {
        unitPrice = state.economy.prices.ostrich_egg;
        state.farm.ostriches.eggs -= count;
        state.economy.storage.used = Math.max(0, state.economy.storage.used - count);
      } else if (product === "ostrich_feather" && state.farm.ostriches.feathers >= count) {
        unitPrice = state.economy.prices.ostrich_feather;
        state.farm.ostriches.feathers -= count;
        state.economy.storage.used = Math.max(0, state.economy.storage.used - count);
      } else {
        return { ok: false, message: "Недостатньо товару на складі для продажу." };
      }

      const totalEarned = unitPrice * count;
      state.economy.balance += totalEarned;
      addXP(state, Math.round(totalEarned / 3));
      saveLocalState(state);
      return { ok: true, message: `💵 Продано x${count} за +${totalEarned} 🪙!` };
    }

    case "fulfill_contract": {
      const contractId = String(params.contract_id);
      const contract = state.business.contracts.find((c) => c.id === contractId);
      if (!contract || contract.fulfilled) return { ok: false, message: "Контракт вже виконано або не знайдено." };

      if (contract.req_item === "wheat" && state.wheat.granary_used >= contract.req_count) {
        state.wheat.granary_used -= contract.req_count;
      } else if (contract.req_item === "egg" && state.farm.chickens.eggs >= contract.req_count) {
        state.farm.chickens.eggs -= contract.req_count;
      } else if (contract.req_item === "cheese" && state.farm.cows.cheese >= contract.req_count) {
        state.farm.cows.cheese -= contract.req_count;
      } else if (contract.req_item === "ostrich_egg" && state.farm.ostriches.eggs >= contract.req_count) {
        state.farm.ostriches.eggs -= contract.req_count;
      } else {
        return { ok: false, message: "Недостатньо продукції для виконання контракту." };
      }

      contract.fulfilled = true;
      state.economy.balance += contract.reward_coins;
      addXP(state, contract.reward_xp);
      saveLocalState(state);
      return { ok: true, message: `📜 Контракт виконано! +${contract.reward_coins} 🪙, +${contract.reward_xp} XP` };
    }

    case "bank_deposit": {
      const amount = Number(params.amount) || 0;
      if (amount <= 0 || state.economy.balance < amount) {
        return { ok: false, message: "Недостатньо коштів для внесення на депозит." };
      }
      if (!state.economy.bank) {
        state.economy.bank = { deposit: 0, deposit_rate: 8, loan: 0, loan_limit: 50000, safe_balance: 0, bonds: 0 };
      }
      state.economy.balance -= amount;
      state.economy.bank.deposit += amount;
      saveLocalState(state);
      return { ok: true, message: `🏦 Внесено ${amount.toLocaleString()} ₴ на депозит під 8%!` };
    }

    case "bank_withdraw": {
      const amount = Number(params.amount) || 0;
      if (!state.economy.bank || amount <= 0 || state.economy.bank.deposit < amount) {
        return { ok: false, message: "Недостатньо коштів на депозиті." };
      }
      state.economy.bank.deposit -= amount;
      state.economy.balance += amount;
      saveLocalState(state);
      return { ok: true, message: `🏦 Знято ${amount.toLocaleString()} ₴ з депозиту на баланс!` };
    }

    case "take_loan": {
      const amount = Number(params.amount) || 0;
      if (!state.economy.bank) {
        state.economy.bank = { deposit: 0, deposit_rate: 8, loan: 0, loan_limit: 50000, safe_balance: 0, bonds: 0 };
      }
      const maxAvailable = Math.max(0, state.economy.bank.loan_limit - state.economy.bank.loan);
      if (amount <= 0 || amount > maxAvailable) {
        return { ok: false, message: "Перевищено кредитно-фінансовий ліміт Банку А-11." };
      }
      state.economy.bank.loan += amount;
      state.economy.balance += amount;
      saveLocalState(state);
      return { ok: true, message: `💳 Отримано кредит ${amount.toLocaleString()} ₴ від Банку А-11!` };
    }

    case "repay_loan": {
      const amount = Number(params.amount) || 0;
      if (!state.economy.bank || amount <= 0 || state.economy.balance < amount || state.economy.bank.loan <= 0) {
        return { ok: false, message: "Некоректна сума або недостатньо балансу." };
      }
      const actualRepay = Math.min(amount, state.economy.bank.loan);
      state.economy.bank.loan -= actualRepay;
      state.economy.balance -= actualRepay;
      saveLocalState(state);
      return { ok: true, message: `✅ Погашено ${actualRepay.toLocaleString()} ₴ кредиту!` };
    }

    case "safe_deposit": {
      const amount = Number(params.amount) || 0;
      if (amount <= 0 || state.economy.balance < amount) {
        return { ok: false, message: "Недостатньо балансу для сейфу." };
      }
      if (!state.economy.bank) {
        state.economy.bank = { deposit: 0, deposit_rate: 8, loan: 0, loan_limit: 50000, safe_balance: 0, bonds: 0 };
      }
      state.economy.balance -= amount;
      state.economy.bank.safe_balance += amount;
      saveLocalState(state);
      return { ok: true, message: `🔒 Заховано ${amount.toLocaleString()} ₴ у сейф А-11!` };
    }

    case "safe_withdraw": {
      const amount = Number(params.amount) || 0;
      if (!state.economy.bank || amount <= 0 || state.economy.bank.safe_balance < amount) {
        return { ok: false, message: "Недостатньо коштів у сейфі." };
      }
      state.economy.bank.safe_balance -= amount;
      state.economy.balance += amount;
      saveLocalState(state);
      return { ok: true, message: `🔓 Вилучено ${amount.toLocaleString()} ₴ із сейфу на баланс!` };
    }

    default:
      saveLocalState(state);
      return { ok: true, message: "Дію збережено успішно!" };
  }
}
