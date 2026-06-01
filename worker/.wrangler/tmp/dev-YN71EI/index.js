var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// src/index.js
var PLAYERS = [
  { name: "Grant", tracker: "Eh_Grant" },
  { name: "Peej", tracker: "Eh_Peej" },
  { name: "Hound", tracker: "Eh_Hound" },
  { name: "Smigs", tracker: "Eh_tooten" },
  { name: "Sarge", tracker: "Eh_SiegeyBodeez" }
];
var HISTORY_START_SEASON = 21;
var API_BASE = "https://r6data.com/api/stats";
var COMMON_Q = "platformType=uplay&platform_families=pc";
var SMALL_SAMPLE = 10;
function seasonNumToStr(n) {
  return `Y${Math.ceil(n / 4)}S${(n - 1) % 4 + 1}`;
}
__name(seasonNumToStr, "seasonNumToStr");
function pastSeasons(currentSeason) {
  const seasons = [];
  for (let n = HISTORY_START_SEASON; n < currentSeason; n++) {
    seasons.push({ num: n, str: seasonNumToStr(n) });
  }
  return seasons;
}
__name(pastSeasons, "pastSeasons");
function normalizeRank(rank) {
  if (!rank) return null;
  return rank.replace(/ 1$/, " I").replace(/ 2$/, " II").replace(/ 3$/, " III").replace(/ 4$/, " IV").replace(/ 5$/, " V");
}
__name(normalizeRank, "normalizeRank");
var RIS_MIN_MATCHES = 30;
var RIS_MIN_CLUTCH_TRIES = 8;
var RIS_NEUTRAL_CWR = 20;
function normRIS(x, lo, hi) {
  return Math.min(1, Math.max(0, (x - lo) / (hi - lo)));
}
__name(normRIS, "normRIS");
function computeRIS(matches, kda, esr, wr, clutchWR, clutchAttempts, hs) {
  if (!matches || matches < RIS_MIN_MATCHES) return null;
  const cwrVal = clutchAttempts >= RIS_MIN_CLUTCH_TRIES ? clutchWR : RIS_NEUTRAL_CWR;
  const composite = 0.3 * normRIS(kda, 0.7, 2) + 0.3 * normRIS(esr, 0.25, 0.7) + 0.2 * normRIS(wr, 35, 60) + 0.1 * normRIS(cwrVal, 5, 35) + 0.1 * normRIS(hs, 20, 60);
  return Math.round((25 + 50 * composite) * 10) / 10;
}
__name(computeRIS, "computeRIS");
function computeFlag(rounds, winRate) {
  if (rounds < SMALL_SAMPLE) return "";
  if (winRate >= 60) return "\u2B50";
  if (winRate >= 50) return "\u2705";
  if (winRate < 38) return "\u26A0\uFE0F";
  return "";
}
__name(computeFlag, "computeFlag");
function pct(n, d) {
  return d > 0 ? parseFloat((n / d * 100).toFixed(1)) : 0;
}
__name(pct, "pct");
function aggregateOps(ops) {
  let kills = 0, deaths = 0, assists = 0, headshots = 0;
  let clutches = 0, clutchesLost = 0, fb = 0, fd = 0, aces = 0;
  ops.forEach((o) => {
    kills += o.kills ?? 0;
    deaths += o.deaths ?? 0;
    assists += o.assists ?? 0;
    headshots += o.headshots ?? 0;
    clutches += o.clutches ?? 0;
    clutchesLost += o.clutchesLost ?? 0;
    fb += o.firstBloods ?? 0;
    fd += o.firstDeaths ?? 0;
    aces += o.aces ?? 0;
  });
  const clutchAttempts = clutches + clutchesLost;
  return {
    hs: kills > 0 ? parseFloat((headshots / kills * 100).toFixed(1)) : null,
    kda: deaths > 0 ? parseFloat(((kills + assists) / deaths).toFixed(2)) : null,
    esr: fb + fd > 0 ? parseFloat((fb / (fb + fd)).toFixed(2)) : null,
    clutches,
    clutchAttempts,
    clutchWR: clutchAttempts > 0 ? parseFloat((clutches / clutchAttempts * 100).toFixed(1)) : null,
    aces
  };
}
__name(aggregateOps, "aggregateOps");
function buildOpList(ops, side) {
  return ops.filter((o) => o.side === side).sort((a, b) => b.roundsPlayed - a.roundsPlayed).map((o) => ({
    name: o.operator,
    rounds: o.roundsPlayed,
    winRate: o.winPercent,
    kd: o.kd,
    hs: o.headshotPercent ?? null,
    clutches: o.clutches ?? 0,
    clutchWR: o.clutches + o.clutchesLost > 0 ? pct(o.clutches, o.clutches + o.clutchesLost) : 0,
    firstBloods: o.firstBloods ?? 0,
    firstDeaths: o.firstDeaths ?? 0,
    assists: o.assists ?? 0,
    flag: computeFlag(o.roundsPlayed, o.winPercent),
    smallSample: o.roundsPlayed < SMALL_SAMPLE
  }));
}
__name(buildOpList, "buildOpList");
async function fetchSeasonsStats(tracker, apiKey) {
  const r = await fetch(
    `${API_BASE}?type=seasonsStats&nameOnPlatform=${encodeURIComponent(tracker)}&${COMMON_Q}`,
    { headers: { "api-key": apiKey } }
  );
  if (!r.ok) throw new Error(`seasonsStats ${r.status}`);
  return r.json();
}
__name(fetchSeasonsStats, "fetchSeasonsStats");
async function fetchSeasonalStats(tracker, apiKey) {
  const r = await fetch(
    `${API_BASE}?type=seasonalStats&nameOnPlatform=${encodeURIComponent(tracker)}&${COMMON_Q}`,
    { headers: { "api-key": apiKey } }
  );
  if (!r.ok) throw new Error(`seasonalStats ${r.status}`);
  return r.json();
}
__name(fetchSeasonalStats, "fetchSeasonalStats");
async function fetchOperatorStats(tracker, seasonYear, apiKey) {
  const r = await fetch(
    `${API_BASE}?type=operatorStats&nameOnPlatform=${encodeURIComponent(tracker)}&${COMMON_Q}&seasonYear=${seasonYear}&modes=ranked`,
    { headers: { "api-key": apiKey } }
  );
  if (!r.ok) throw new Error(`operatorStats ${r.status}`);
  return r.json();
}
__name(fetchOperatorStats, "fetchOperatorStats");
function transformCurrentSeason(rawSeasons, rawSeasonal, rawOperators) {
  const meta = rawSeasons?.data?.metadata ?? {};
  const currentSeason = meta.currentSeason;
  const level = meta.clearanceLevel ?? null;
  const segments = rawSeasons?.data?.segments ?? [];
  const currentSeg = segments.find(
    (s) => s.attributes?.season === currentSeason && s.attributes?.gamemode === "pvp_ranked"
  );
  const cs = currentSeg?.stats ?? {};
  const kills = cs.kills?.value ?? null;
  const deaths = cs.deaths?.value ?? null;
  const wins = cs.matchesWon?.value ?? null;
  const matches = cs.matchesPlayed?.value ?? null;
  const rp = cs.rankPoints?.value ?? null;
  const maxRp = cs.maxRankPoints?.value ?? null;
  const kd = cs.kdRatio?.value != null ? parseFloat(cs.kdRatio.value.toFixed(2)) : null;
  const winRate = matches > 0 ? parseFloat((wins / matches * 100).toFixed(1)) : null;
  const history = rawSeasonal?.data?.history?.data ?? [];
  const rank = normalizeRank(history.at(-1)?.[1]?.metadata?.rank ?? null);
  const ops = rawOperators?.operators ?? [];
  const agg = aggregateOps(ops);
  const ris = computeRIS(
    matches,
    agg.kda ?? 0,
    agg.esr ?? 0,
    winRate ?? 0,
    agg.clutchWR ?? RIS_NEUTRAL_CWR,
    agg.clutchAttempts,
    agg.hs ?? 0
  );
  const careerHistory = segments.filter((s) => s.attributes?.gamemode === "pvp_ranked" && s.metadata?.shortName).map((s) => {
    const st = s.stats ?? {};
    const m = st.matchesPlayed?.value ?? 0;
    const w = st.matchesWon?.value ?? 0;
    return {
      season: s.metadata.shortName,
      kd: st.kdRatio?.value != null ? parseFloat(st.kdRatio.value.toFixed(2)) : null,
      wr: m > 0 ? parseFloat((w / m * 100).toFixed(1)) : null,
      matches: m,
      rp: st.rankPoints?.value ?? null,
      maxRp: st.maxRankPoints?.value ?? null,
      kills: st.kills?.value ?? null,
      deaths: st.deaths?.value ?? null
    };
  });
  return {
    stats: {
      ...rank != null && { rank },
      ...rp != null && { rp: String(rp) },
      ...maxRp != null && { maxRp: String(maxRp) },
      ...kd != null && { kd: String(kd) },
      ...agg.kda != null && { kda: String(agg.kda) },
      ...kills != null && { kills: String(kills) },
      ...deaths != null && { deaths: String(deaths) },
      ...winRate != null && { winRate: winRate + "%" },
      ...matches != null && { matches: String(matches) },
      ...agg.hs != null && { hs: String(agg.hs) },
      ...agg.esr != null && { esr: String(agg.esr) },
      ...agg.clutches > 0 && { clutches: String(agg.clutches) },
      ...agg.clutchWR != null && { clutchWR: String(agg.clutchWR) },
      ...level != null && { level: String(level) },
      ...agg.aces > 0 && { aces: String(agg.aces) },
      ...ris != null && { ris: String(ris) }
    },
    operators: { atk: buildOpList(ops, "Attacker"), def: buildOpList(ops, "Defender") },
    careerHistory,
    updatedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
}
__name(transformCurrentSeason, "transformCurrentSeason");
function transformHistoricalSeason(seasonYear, rawOperators, careerEntry) {
  const ops = rawOperators?.operators ?? [];
  if (ops.length === 0) return { season: seasonYear, empty: true };
  const agg = aggregateOps(ops);
  const matches = careerEntry?.matches ?? 0;
  const ris = computeRIS(
    matches,
    agg.kda ?? 0,
    agg.esr ?? 0,
    careerEntry?.wr ?? 0,
    agg.clutchWR ?? RIS_NEUTRAL_CWR,
    agg.clutchAttempts,
    agg.hs ?? 0
  );
  return {
    season: seasonYear,
    // Aggregate stats pulled from careerHistory (already have them)
    kd: careerEntry?.kd ?? null,
    wr: careerEntry?.wr ?? null,
    matches: careerEntry?.matches ?? null,
    rp: careerEntry?.rp ?? null,
    maxRp: careerEntry?.maxRp ?? null,
    kills: careerEntry?.kills ?? null,
    deaths: careerEntry?.deaths ?? null,
    // Computed from operator aggregates
    hs: agg.hs,
    kda: agg.kda,
    esr: agg.esr,
    clutches: agg.clutches,
    clutchWR: agg.clutchWR,
    aces: agg.aces,
    ris,
    // Full operator breakdown
    operators: { atk: buildOpList(ops, "Attacker"), def: buildOpList(ops, "Defender") },
    fetchedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
}
__name(transformHistoricalSeason, "transformHistoricalSeason");
var MAX_BACKFILL_PER_RUN = 3;
async function backfillHistory(player, currentSeason, careerHistory, env) {
  const allSeasons = pastSeasons(currentSeason);
  const { keys: existingKeys } = await env.R6_STATS.list({ prefix: `season:${player.tracker}:` });
  const existingSet = new Set(existingKeys.map((k) => k.name));
  const missing = allSeasons.filter((s) => !existingSet.has(`season:${player.tracker}:${s.str}`));
  if (missing.length === 0) return;
  const batch = missing.slice(0, MAX_BACKFILL_PER_RUN);
  console.log(`  ${player.name}: backfilling ${batch.length} of ${missing.length} missing seasons`);
  const results = await Promise.allSettled(
    batch.map(async (s) => {
      try {
        const raw = await fetchOperatorStats(player.tracker, s.str, env.R6DATA_API_KEY);
        const careerEntry = careerHistory.find((c) => c.season === s.str) ?? null;
        const data = transformHistoricalSeason(s.str, raw, careerEntry);
        await env.R6_STATS.put(`season:${player.tracker}:${s.str}`, JSON.stringify(data));
        return s.str;
      } catch (err) {
        await env.R6_STATS.put(
          `season:${player.tracker}:${s.str}`,
          JSON.stringify({ season: s.str, empty: true })
        );
        throw err;
      }
    })
  );
  const stored = results.filter((r) => r.status === "fulfilled").map((r) => r.value);
  const errored = results.filter((r) => r.status === "rejected").length;
  console.log(`  ${player.name}: stored ${stored.length}${errored ? `, ${errored} stubbed (no API data)` : ""}`);
}
__name(backfillHistory, "backfillHistory");
var src_default = {
  async scheduled(_event, env) {
    console.log("Stats update started:", (/* @__PURE__ */ new Date()).toISOString());
    const failed = [];
    for (const player of PLAYERS) {
      try {
        const rawSeasons = await fetchSeasonsStats(player.tracker, env.R6DATA_API_KEY);
        const currentSeason = rawSeasons?.data?.metadata?.currentSeason;
        if (!currentSeason) throw new Error("could not detect current season");
        const seasonYear = seasonNumToStr(currentSeason);
        const [rawSeasonal, rawOperators] = await Promise.all([
          fetchSeasonalStats(player.tracker, env.R6DATA_API_KEY),
          fetchOperatorStats(player.tracker, seasonYear, env.R6DATA_API_KEY)
        ]);
        const data = transformCurrentSeason(rawSeasons, rawSeasonal, rawOperators);
        await env.R6_STATS.put(`player:${player.tracker}`, JSON.stringify(data));
        console.log(
          `\u2713 ${player.name} \u2014 ${data.stats.rank ?? "unranked"} | KD ${data.stats.kd} | WR ${data.stats.winRate} | KDA ${data.stats.kda} | ESR ${data.stats.esr} | RIS ${data.stats.ris ?? "\u2014"}`
        );
        await backfillHistory(player, currentSeason, data.careerHistory, env);
      } catch (err) {
        console.error(`\u2717 ${player.name} failed:`, err.message);
        failed.push(player.name);
      }
    }
    if (failed.length) console.error("Failed:", failed.join(", "));
    console.log("Stats update complete:", (/* @__PURE__ */ new Date()).toISOString());
  }
};

// node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// node_modules/wrangler/templates/middleware/middleware-scheduled.ts
var scheduled = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  const url = new URL(request.url);
  if (url.pathname === "/__scheduled") {
    const cron = url.searchParams.get("cron") ?? "";
    await middlewareCtx.dispatch("scheduled", { cron });
    return new Response("Ran scheduled event");
  }
  const resp = await middlewareCtx.next(request, env);
  if (request.headers.get("referer")?.endsWith("/__scheduled") && url.pathname === "/favicon.ico" && resp.status === 500) {
    return new Response(null, { status: 404 });
  }
  return resp;
}, "scheduled");
var middleware_scheduled_default = scheduled;

// .wrangler/tmp/bundle-zMuuYu/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_scheduled_default
];
var middleware_insertion_facade_default = src_default;

// node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// .wrangler/tmp/bundle-zMuuYu/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  static {
    __name(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=index.js.map
