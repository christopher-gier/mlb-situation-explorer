/* MLB TeamRankings Situation Explorer */
(function () {
  "use strict";

  const CAT_LABEL = { win: "Win%", ats: "Cover%", ou: "Over%" };
  const CAT_KEY = { win: "win", ats: "ats", ou: "ou" };

  const state = {
    data: null,
    category: "win",
    situations: new Set(),
    minN: 20,
    minPct: 0,
    vsBaseline: false,
    minWinStreak: 0,
    minLoseStreak: 0,
    includeW: true,
    includeL: true,
    minL10Wins: 0,
    maxL10Wins: 10,
    search: "",
    tab: "bet",
    scatterMode: "situations", // situations | win_cover
    scatterX: "is_home_dog",
    scatterY: "is_away_dog",
    scatterSit: "is_home_dog",
    sortCol: "edge_pp",
    sortDir: -1,
    pinned: null,
    todayOnly: false,
    yearLo: 2021,
    yearHi: 2026,
    rdSurplusDog: false,
    poffClinched: false,
    poffMustChase: false,
    poffDeadMoney: false,
    confirmedIl: false,
    wxIndoor: false,
    wxHot: false,
    wxPrecip: false,
    starterAdjGap: false,
    edgeStackOn: true,
    layerTr: true,
    layerInjury: true,
    layerLate: true,
    layerFatigue: true,
    layerSteam: true,
    minEdge: -20,
    betLayerTrends: true,
    betLayerChart: true,
    betLayerNewbot: true,
    betLayerMiles: true,
    bluffMode: "bluff",
    bluffAway: false,
    bluffHome: false,
    bluffDkFav: true,
    bluffDkDog: false,
    bluffInjHeavy: false,
    bluffInjAny: false,
    bluffFatigue: false,
    bluffSteam: false,
    bluffChartLr: false,
    bluffClinched: false,
    bluffMustChase: false,
    bluffDeadMoney: false,
  };

  const $ = (sel, el = document) => el.querySelector(sel);
  const $$ = (sel, el = document) => [...el.querySelectorAll(sel)];

  function loadStateFromHash() {
    try {
      const h = location.hash.replace(/^#/, "");
      if (!h) return;
      const o = JSON.parse(decodeURIComponent(h));
      if (o.category) state.category = o.category;
      if (Array.isArray(o.situations)) state.situations = new Set(o.situations);
      if (typeof o.minN === "number") state.minN = o.minN;
      if (typeof o.minPct === "number") state.minPct = o.minPct;
      if (typeof o.vsBaseline === "boolean") state.vsBaseline = o.vsBaseline;
      if (typeof o.minWinStreak === "number") state.minWinStreak = o.minWinStreak;
      if (typeof o.minLoseStreak === "number") state.minLoseStreak = o.minLoseStreak;
      if (typeof o.includeW === "boolean") state.includeW = o.includeW;
      if (typeof o.includeL === "boolean") state.includeL = o.includeL;
      if (typeof o.minL10Wins === "number") state.minL10Wins = o.minL10Wins;
      if (typeof o.maxL10Wins === "number") state.maxL10Wins = o.maxL10Wins;
      if (o.tab) state.tab = o.tab;
      if (o.scatterX) state.scatterX = o.scatterX;
      if (o.scatterY) state.scatterY = o.scatterY;
      if (o.scatterSit) state.scatterSit = o.scatterSit;
      if (o.scatterMode) state.scatterMode = o.scatterMode;
      if (typeof o.todayOnly === "boolean") state.todayOnly = o.todayOnly;
      if (typeof o.rdSurplusDog === "boolean") state.rdSurplusDog = o.rdSurplusDog;
      if (typeof o.poffClinched === "boolean") state.poffClinched = o.poffClinched;
      if (typeof o.poffMustChase === "boolean") state.poffMustChase = o.poffMustChase;
      if (typeof o.poffDeadMoney === "boolean") state.poffDeadMoney = o.poffDeadMoney;
      if (typeof o.confirmedIl === "boolean") state.confirmedIl = o.confirmedIl;
      if (typeof o.wxIndoor === "boolean") state.wxIndoor = o.wxIndoor;
      if (typeof o.wxHot === "boolean") state.wxHot = o.wxHot;
      if (typeof o.wxPrecip === "boolean") state.wxPrecip = o.wxPrecip;
      if (typeof o.starterAdjGap === "boolean") state.starterAdjGap = o.starterAdjGap;
      if (typeof o.edgeStackOn === "boolean") state.edgeStackOn = o.edgeStackOn;
      if (typeof o.layerTr === "boolean") state.layerTr = o.layerTr;
      if (typeof o.layerInjury === "boolean") state.layerInjury = o.layerInjury;
      if (typeof o.layerLate === "boolean") state.layerLate = o.layerLate;
      if (typeof o.layerFatigue === "boolean") state.layerFatigue = o.layerFatigue;
      if (typeof o.layerSteam === "boolean") state.layerSteam = o.layerSteam;
      if (typeof o.minEdge === "number") state.minEdge = o.minEdge;
      if (o.bluffMode === "bluff" || o.bluffMode === "dog") state.bluffMode = o.bluffMode;
      if (typeof o.bluffAway === "boolean") state.bluffAway = o.bluffAway;
      if (typeof o.bluffHome === "boolean") state.bluffHome = o.bluffHome;
      if (typeof o.bluffDkFav === "boolean") state.bluffDkFav = o.bluffDkFav;
      if (typeof o.bluffDkDog === "boolean") state.bluffDkDog = o.bluffDkDog;
      if (typeof o.bluffInjHeavy === "boolean") state.bluffInjHeavy = o.bluffInjHeavy;
      if (typeof o.bluffInjAny === "boolean") state.bluffInjAny = o.bluffInjAny;
      if (typeof o.bluffFatigue === "boolean") state.bluffFatigue = o.bluffFatigue;
      if (typeof o.bluffSteam === "boolean") state.bluffSteam = o.bluffSteam;
      if (typeof o.bluffChartLr === "boolean") state.bluffChartLr = o.bluffChartLr;
      if (typeof o.bluffClinched === "boolean") state.bluffClinched = o.bluffClinched;
      if (typeof o.bluffMustChase === "boolean") state.bluffMustChase = o.bluffMustChase;
      if (typeof o.bluffDeadMoney === "boolean") state.bluffDeadMoney = o.bluffDeadMoney;
      if (typeof o.yearLo === "number") state.yearLo = o.yearLo;
      if (typeof o.yearHi === "number") state.yearHi = o.yearHi;
      if (o.baselineWindow && typeof o.yearLo !== "number") {
        const m = String(o.baselineWindow).match(/^(\d{4})-(\d{4})$/);
        if (m) { state.yearLo = +m[1]; state.yearHi = +m[2]; }
      }
    } catch (_) {}
  }

  function saveState() {
    const o = {
      category: state.category,
      situations: [...state.situations],
      minN: state.minN,
      minPct: state.minPct,
      vsBaseline: state.vsBaseline,
      minWinStreak: state.minWinStreak,
      minLoseStreak: state.minLoseStreak,
      includeW: state.includeW,
      includeL: state.includeL,
      minL10Wins: state.minL10Wins,
      maxL10Wins: state.maxL10Wins,
      tab: state.tab,
      scatterX: state.scatterX,
      scatterY: state.scatterY,
      scatterSit: state.scatterSit,
      scatterMode: state.scatterMode,
      todayOnly: state.todayOnly,
      rdSurplusDog: state.rdSurplusDog,
      poffClinched: state.poffClinched,
      poffMustChase: state.poffMustChase,
      poffDeadMoney: state.poffDeadMoney,
      confirmedIl: state.confirmedIl,
      wxIndoor: state.wxIndoor,
      wxHot: state.wxHot,
      wxPrecip: state.wxPrecip,
      starterAdjGap: state.starterAdjGap,
      edgeStackOn: state.edgeStackOn,
      layerTr: state.layerTr,
      layerInjury: state.layerInjury,
      layerLate: state.layerLate,
      layerFatigue: state.layerFatigue,
      layerSteam: state.layerSteam,
      minEdge: state.minEdge,
      yearLo: state.yearLo,
      yearHi: state.yearHi,
      bluffMode: state.bluffMode,
      bluffAway: state.bluffAway,
      bluffHome: state.bluffHome,
      bluffDkFav: state.bluffDkFav,
      bluffDkDog: state.bluffDkDog,
      bluffInjHeavy: state.bluffInjHeavy,
      bluffInjAny: state.bluffInjAny,
      bluffFatigue: state.bluffFatigue,
      bluffSteam: state.bluffSteam,
      bluffChartLr: state.bluffChartLr,
      bluffClinched: state.bluffClinched,
      bluffMustChase: state.bluffMustChase,
      bluffDeadMoney: state.bluffDeadMoney,
    };
    try {
      localStorage.setItem("mlb-tr-explorer", JSON.stringify(o));
      // Keep the public URL short — filters live in localStorage, not the hash.
      // Still *read* a hash on load so old shared links work.
      if (location.hash) {
        history.replaceState(null, "", location.pathname + location.search);
      }
    } catch (_) {}
  }

  function yearRange() {
    const pack = state.data.baseline_years || {};
    let lo = state.yearLo;
    let hi = state.yearHi;
    const minY = pack.min || 2007;
    const maxY = pack.max || 2026;
    if (lo > hi) { const t = lo; lo = hi; hi = t; }
    lo = Math.max(minY, Math.min(maxY, lo || minY));
    hi = Math.max(minY, Math.min(maxY, hi || maxY));
    return { lo, hi, minY, maxY };
  }

  function pooledBaseline(sc, cat) {
    const pack = state.data.baseline_years;
    const series = pack?.by_sc?.[sc]?.[cat];
    if (!series) {
      const b = state.data.baselines?.[sc]?.[cat];
      return b && typeof b.pct === "number" ? { pct: b.pct, n: b.n || 0 } : null;
    }
    const { lo, hi } = yearRange();
    let n = 0;
    let w = 0;
    for (let y = lo; y <= hi; y++) {
      const c = series[String(y)] || series[y];
      if (!c || !c.n) continue;
      n += c.n;
      w += c.pct * c.n;
    }
    if (!n) return null;
    return { pct: +((w / n).toFixed(3)), n };
  }

  function baseline(sc, cat) {
    const b = pooledBaseline(sc, cat);
    return b ? b.pct : null;
  }

  function baselineMeta(sc, cat) {
    return pooledBaseline(sc, cat);
  }

  // ----- V2 Edge stack -----
  const MIRROR_PAIRS = [
    ["is_dog", "is_fav"],
    ["is_home", "is_away"],
    ["is_away_dog", "is_home_fav"],
    ["is_home_dog", "is_away_fav"],
    ["is_after_win", "is_after_loss"],
    ["rest_advantage", "rest_disadvantage"],
    ["is_division", "non_division"],
    ["is_league", "non_league"],
    ["no_rest", "one_day_off"], // soft: rest family still user-managed
  ];
  const PRICED_SITUATIONS = new Set([
    "is_fav", "is_dog", "is_home_fav", "is_home_dog", "is_away_fav", "is_away_dog",
  ]);
  const DEFAULT_OFF_SITUATIONS = new Set([
    "is_after_win", "is_after_loss",
    "no_rest", "one_day_off", "two_three_days_off", "four_plus_days_off",
    "is_doubleheader", "rest_advantage", "rest_disadvantage", "equal_rest",
    "is_division", "non_division",
    "is_league", "non_league", "is_neutral", "is_playoff",
  ]);

  function mirrorOf(sc) {
    for (const [a, b] of MIRROR_PAIRS) {
      if (sc === a) return b;
      if (sc === b) return a;
    }
    return null;
  }

  function edgeMarket() {
    // O/U out of stack — fall back to win for edge math if ou selected
    if (state.category === "ats") return "ats";
    return "win";
  }

  function edgeMarketLabel() {
    return edgeMarket() === "ats" ? "ATS" : "WIN";
  }

  function contextSituationsForTeam(abbr) {
    const out = todaysSituationsForTeam(abbr);
    const t = state.data.teams.find((x) => x.abbr === abbr);
    const fat = t?.edge_fatigue;
    if (fat?.is_dh_g2_today) out.add("is_doubleheader");
    if (fat?.rest_disadvantage) out.add("rest_disadvantage");
    else if (fat && fat.rest_days != null && fat.opp_rest_days != null) {
      if (fat.rest_days > fat.opp_rest_days) out.add("rest_advantage");
      else if (fat.rest_days === fat.opp_rest_days) out.add("equal_rest");
    }
    return out;
  }

  function clampDelta(d) {
    if (d == null || Number.isNaN(d)) return 0;
    return Math.max(-8, Math.min(8, +d));
  }

  function clampTrSum(s) {
    if (s == null || Number.isNaN(s)) return 0;
    return Math.max(-10, Math.min(10, +s));
  }

  // Role exclusivity (LOCKED): at most ONE role Δ — prefer most specific
  const ROLE_SPECIFIC = ["is_home_dog", "is_away_dog", "is_home_fav", "is_away_fav"];
  const ROLE_SIDE = ["is_dog", "is_fav"];
  const ROLE_VENUE = ["is_home", "is_away"];
  const ROLE_SET = new Set([...ROLE_SPECIFIC, ...ROLE_SIDE, ...ROLE_VENUE]);
  const AFTER_SET = new Set(["is_after_win", "is_after_loss"]);
  const REST_SET = new Set([
    "no_rest", "one_day_off", "two_three_days_off", "four_plus_days_off",
    "is_doubleheader", "rest_advantage", "rest_disadvantage", "equal_rest",
  ]);
  const REST_PREF = [
    "rest_disadvantage", "rest_advantage", "equal_rest", "is_doubleheader",
    "no_rest", "one_day_off", "two_three_days_off", "four_plus_days_off",
  ];
  const DIV_LEAGUE_SET = new Set([
    "is_division", "non_division", "is_league", "non_league",
  ]);
  const DIV_LEAGUE_PREF = ["is_division", "non_division", "is_league", "non_league"];

  function pickFirst(order, matching) {
    for (const sc of order) {
      if (matching.has(sc)) return sc;
    }
    return null;
  }

  function computeTrLayer(abbr, market) {
    if (!state.layerTr) return { pp: 0, chips: [] };
    const ctx = contextSituationsForTeam(abbr);
    const chips = [];
    let sum = 0;
    // Enabled + matching today's context (mirrors still help skip opposite side)
    const matching = new Set();
    for (const sc of state.situations) {
      if (!ctx.has(sc)) continue;
      if (sc === "all_games" || sc === "is_regular_season") continue;
      matching.add(sc);
    }
    // Mirror dedupe: if both of a pair enabled+matching, keep context side only
    for (const [a, b] of MIRROR_PAIRS) {
      if (matching.has(a) && matching.has(b)) {
        // Prefer the one that is truly the context side; if both, drop second
        matching.delete(b);
      }
    }

    // Family exclusivity (LOCKED Miles Calder V2)
    const chosen = new Set();
    // Role: home_dog/away_dog/home_fav/away_fav > dog/fav > home/away
    const role = pickFirst([...ROLE_SPECIFIC, ...ROLE_SIDE, ...ROLE_VENUE], matching);
    if (role) chosen.add(role);
    // After W/L: at most one
    const after = pickFirst(["is_after_win", "is_after_loss"], matching);
    if (after) chosen.add(after);
    // Rest: at most one
    const rest = pickFirst(REST_PREF, matching);
    if (rest) chosen.add(rest);
    // Division/league: at most one
    const divL = pickFirst(DIV_LEAGUE_PREF, matching);
    if (divL) chosen.add(divL);
    // Other matching situations outside exclusive families
    for (const sc of matching) {
      if (ROLE_SET.has(sc) || AFTER_SET.has(sc) || REST_SET.has(sc) || DIV_LEAGUE_SET.has(sc)) continue;
      chosen.add(sc);
    }

    for (const sc of chosen) {
      const c = cell(abbr, sc, market);
      if (!c || c.pct == null) continue;
      const b = baseline(sc, market);
      if (b == null) continue;
      const raw = +(c.pct - b).toFixed(2);
      const d = clampDelta(raw);
      if (d === 0 && raw === 0) continue;
      sum += d;
      const sit = state.data.situations.find((s) => s.sc === sc);
      chips.push({
        id: "tr:" + sc,
        label: (sit?.label || sc).replace(/^As /, ""),
        pp: d,
        priced: PRICED_SITUATIONS.has(sc),
        group: "tr",
      });
    }
    const capped = clampTrSum(sum);
    if (capped !== +sum.toFixed(2) && Math.abs(sum) > 10) {
      chips.push({
        id: "tr:sum_cap",
        label: `TR Σ cap (${sum >= 0 ? "+" : ""}${sum.toFixed(1)}→${capped >= 0 ? "+" : ""}${capped.toFixed(1)})`,
        pp: +(capped - sum).toFixed(2),
        priced: false,
        group: "tr",
        title: "Σ TR Δ clamped to [-10,+10]",
      });
    }
    return { pp: +capped.toFixed(2), chips };
  }

  function computeInjuryLayer(t, market) {
    if (!state.layerInjury) return { pp: 0, chips: [] };
    const inj = t.edge_injury;
    if (!inj) return { pp: 0, chips: [] };
    const pp = market === "ats" ? +inj.ats_pp || 0 : +inj.win_pp || 0;
    if (!pp) {
      // still show chronic badge-only via zero chip? skip
      return { pp: 0, chips: [] };
    }
    const bits = (inj.parts || []).map((p) => p.label).join("; ") || "injury/suspension";
    return {
      pp,
      chips: [{
        id: "injury",
        label: bits.length > 48 ? "Injury/susp −" : bits,
        pp,
        priced: false,
        group: "injury",
        title: inj.source || "",
      }],
    };
  }

  function computeLateLayer(t, market) {
    if (!state.layerLate) return { pp: 0, chips: [] };
    const late = t.edge_late;
    if (!late || !late.gate_ok || !late.tag) return { pp: 0, chips: [] };
    const pp = market === "ats" ? +late.ats_pp || 0 : +late.win_pp || 0;
    if (!pp && late.tag !== "clinched") {
      // clinched ATS is 0 by design — still show chip when WIN market uses it; for ATS skip if 0
      if (market === "ats" && late.tag === "clinched") {
        return {
          pp: 0,
          chips: [{
            id: "late",
            label: "clinched (0 ATS)",
            pp: 0,
            priced: true,
            group: "late",
            title: late.label,
          }],
        };
      }
    }
    if (!pp && late.tag === "dead_money" && market === "ats" && !late.is_dk_dog) {
      return {
        pp: 0,
        chips: [{
          id: "late",
          label: "dead_money (0 ATS, not dog)",
          pp: 0,
          priced: true,
          group: "late",
          title: late.label,
        }],
      };
    }
    if (!pp) return { pp: 0, chips: [] };
    return {
      pp,
      chips: [{
        id: "late",
        label: `${late.tag}`,
        pp,
        priced: true,
        group: "late",
        title: late.label + " — " + (late.source || ""),
      }],
    };
  }

  function computeFatigueLayer(t, market) {
    if (!state.layerFatigue) return { pp: 0, chips: [] };
    const fat = t.edge_fatigue;
    if (!fat) return { pp: 0, chips: [] };
    if (fat.error) {
      return {
        pp: 0,
        chips: [{
          id: "fatigue",
          label: "fatigue error→0",
          pp: 0,
          priced: false,
          group: "fatigue",
          title: String(fat.error),
        }],
      };
    }
    if (!fat.trigger) return { pp: 0, chips: [] };
    const pp = market === "ats" ? +fat.ats_pp || 0 : +fat.win_pp || 0;
    return {
      pp,
      chips: [{
        id: "fatigue",
        label: "fatigue (" + (fat.reasons || []).join(", ") + ")",
        pp,
        priced: false,
        group: "fatigue",
        title: fat.source || "",
      }],
    };
  }

  function computeSteamLayer(t, market) {
    if (!state.layerSteam) return { pp: 0, chips: [] };
    const st = t.edge_steam;
    if (!st || !st.trigger) return { pp: 0, chips: [] };
    const pp = market === "ats" ? +st.ats_pp || 0 : +st.win_pp || 0;
    return {
      pp,
      chips: [{
        id: "steam",
        label: "interim steam RD/G>0",
        pp,
        priced: false,
        group: "steam",
        title: (st.label || "") + " — " + (st.source || ""),
      }],
    };
  }

  function computeEdge(t) {
    const market = edgeMarket();
    const { lo, hi } = yearRange();
    const layers = [];
    const tr = computeTrLayer(t.abbr, market);
    const inj = computeInjuryLayer(t, market);
    const late = computeLateLayer(t, market);
    const fat = computeFatigueLayer(t, market);
    const steam = computeSteamLayer(t, market);
    for (const L of [tr, inj, late, fat, steam]) {
      layers.push(...L.chips);
    }
    const edge_pp = +(tr.pp + inj.pp + late.pp + fat.pp + steam.pp).toFixed(2);
    const layerSummary = layers
      .filter((c) => c.pp !== 0)
      .map((c) => `${c.label} ${c.pp >= 0 ? "+" : ""}${c.pp.toFixed(1)}`)
      .join("; ");
    const copy = `Edge vs ${lo}–${hi} baseline: ${edge_pp >= 0 ? "+" : ""}${edge_pp.toFixed(1)} pp (${edgeMarketLabel()}). Layers: ${layerSummary || "none"}`;
    return {
      edge_pp,
      market,
      lo,
      hi,
      chips: layers,
      copy,
      parts: { tr: tr.pp, injury: inj.pp, late: late.pp, fatigue: fat.pp, steam: steam.pp },
    };
  }

  function fmtPp(pp) {
    if (pp == null) return "—";
    const n = +pp;
    return (n >= 0 ? "+" : "") + n.toFixed(1);
  }

  function chipHtml(c) {
    const cls = c.pp > 0 ? "pos" : c.pp < 0 ? "neg" : "zero";
    const priced = c.priced ? '<span class="priced" title="Partly priced into the number">priced</span>' : "";
    const title = (c.title || c.label || "").replace(/"/g, "&quot;");
    return `<span class="edge-chip ${cls}" title="${title}"><span class="layer-name">${c.label}</span> <strong>${fmtPp(c.pp)}</strong>${priced}</span>`;
  }



  function updateYearSpanLabel() {
    const el = $("#year-span");
    if (!el) return;
    const { lo, hi } = yearRange();
    const seasons = hi - lo + 1;
    el.textContent = `Baseline ${lo}–${hi} · ${seasons} season${seasons === 1 ? "" : "s"}. Edge = this year’s situation % minus that pooled rate.`;
  }

  function cell(abbr, sc, cat) {
    return state.data.matrix?.[abbr]?.[sc]?.[cat] || null;
  }

  function metricValue(c, sc) {
    if (!c || c.pct == null) return null;
    if (!state.vsBaseline) return c.pct;
    const b = baseline(sc, state.category);
    if (b == null) return c.pct;
    return +(c.pct - b).toFixed(2);
  }

  function teamPassesStreak(t) {
    const s = t.STRK || 0;
    if (s > 0 && !state.includeW) return false;
    if (s < 0 && !state.includeL) return false;
    const needW = state.minWinStreak > 0;
    const needL = state.minLoseStreak > 0;
    if (!needW && !needL) return true;
    if (needW && needL) {
      return s >= state.minWinStreak || s <= -state.minLoseStreak;
    }
    if (needW) return s >= state.minWinStreak;
    return s <= -state.minLoseStreak;
  }

  function l10Wins(t) {
    const m = String(t.L10 || "").match(/^(\d+)\s*-\s*(\d+)/);
    return m ? +m[1] : null;
  }

  function teamPassesL10(t) {
    const w = l10Wins(t);
    if (w == null) return state.minL10Wins === 0 && state.maxL10Wins === 10;
    if (w < state.minL10Wins) return false;
    if (w > state.maxL10Wins) return false;
    return true;
  }

  function teamPassesSearch(t) {
    const q = state.search.trim().toLowerCase();
    if (!q) return true;
    return (
      t.name.toLowerCase().includes(q) ||
      t.abbr.toLowerCase().includes(q)
    );
  }

  function gamesPlayed(t) {
    const w = t.W || 0, l = t.L || 0;
    return w + l;
  }

  function rdPerGame(t) {
    const gp = gamesPlayed(t);
    if (!gp || t.DIFF == null) return null;
    return t.DIFF / gp;
  }

  function isRdSurplusDog(t) {
    const rd = rdPerGame(t);
    if (rd == null || rd <= 0) return false;
    const g = slateForTeam(t.abbr);
    if (g) return g.dog_abbr === t.abbr && g.home_abbr === t.abbr;
    return false;
  }

  function anyPoffFilter() {
    return state.poffClinched || state.poffMustChase || state.poffDeadMoney;
  }

  function teamPassesPlayoff(t) {
    if (!anyPoffFilter()) return true;
    const tag = t.playoff_tag || "";
    if (state.poffClinched && tag === "clinched") return true;
    if (state.poffMustChase && tag === "must_chase") return true;
    if (state.poffDeadMoney && tag === "dead_money") return true;
    return false;
  }

  function gameHasConfirmedIl(g) {
    const inj = g?.injury;
    if (!inj) return false;
    // Locked: use toggle_match only — NOT any IL length > 0
    return !!inj.toggle_match;
  }

  function gamePassesWeather(g) {
    const any = state.wxIndoor || state.wxHot || state.wxPrecip;
    if (!any) return true;
    const w = g?.weather;
    if (!w) return false;
    if (state.wxIndoor && w.indoor) return true;
    if (state.wxHot && w.hot_outdoor) return true;
    if (state.wxPrecip && w.precip_risk) return true;
    return false;
  }

  function gamePassesStarterAdj(g) {
    if (!state.starterAdjGap) return true;
    const gap = g?.starter_adjustment?.starter_adj_gap;
    return gap != null && Math.abs(gap) >= 2;
  }

  function gamePassesSlateScreens(g) {
    if (!g) return false;
    if (state.confirmedIl && !gameHasConfirmedIl(g)) return false;
    if (!gamePassesWeather(g)) return false;
    if (!gamePassesStarterAdj(g)) return false;
    return true;
  }

  function anyGameSlateFilter() {
    return state.confirmedIl || state.wxIndoor || state.wxHot || state.wxPrecip || state.starterAdjGap;
  }

  function filteredTeams() {
    return state.data.teams.filter((t) => {
      if (!(teamPassesStreak(t) && teamPassesL10(t) && teamPassesSearch(t))) return false;
      if (state.todayOnly && !slateForTeam(t.abbr)) return false;
      // Steam ON dedupe: RD-surplus-dog remains a FILTER only (no second + in stack)
      if (state.rdSurplusDog && !isRdSurplusDog(t)) return false;
      if (!teamPassesPlayoff(t)) return false;
      if (anyGameSlateFilter()) {
        const g = slateForTeam(t.abbr);
        if (!gamePassesSlateScreens(g)) return false;
      }
      if (state.edgeStackOn && state.minEdge > -20) {
        if (computeEdge(t).edge_pp < state.minEdge) return false;
      }
      return true;
    });
  }

  function filteredSlateGames() {
    const games = state.data.slate?.games || [];
    return games.filter((g) => {
      if (anyPoffFilter()) {
        const home = state.data.teams.find((t) => t.abbr === g.home_abbr);
        const away = state.data.teams.find((t) => t.abbr === g.away_abbr);
        if (!((home && teamPassesPlayoff(home)) || (away && teamPassesPlayoff(away)))) return false;
      }
      if (state.rdSurplusDog) {
        const home = state.data.teams.find((t) => t.abbr === g.home_abbr);
        if (!home || !isRdSurplusDog(home)) return false;
      }
      if (anyGameSlateFilter() && !gamePassesSlateScreens(g)) return false;
      return true;
    });
  }

  function enabledSituations() {
    return state.data.situations.filter((s) => state.situations.has(s.sc));
  }

  /** Rows for list / heat: team × situation that pass N and pct filters */
  function matchingRows() {
    const teams = filteredTeams();
    const sits = enabledSituations();
    const cat = state.category;
    const rows = [];
    for (const t of teams) {
      for (const sit of sits) {
        if (!situationTrueToday(t.abbr, sit.sc)) continue;
        const c = cell(t.abbr, sit.sc, cat);
        if (!c || c.pct == null) continue;
        if ((c.n || 0) < state.minN) continue;
        const val = metricValue(c, sit.sc);
        const b = baseline(sit.sc, cat);
        const edge = b != null ? +(c.pct - b).toFixed(2) : null;
        const cmp = state.vsBaseline ? val : c.pct;
        if (cmp < state.minPct) continue;
        rows.push({
          team: t,
          sit,
          cell: c,
          val,
          edge,
          baseline: b,
        });
      }
    }
    return rows;
  }

  function streakBadge(strk) {
    if (!strk) return '<span class="badge">—</span>';
    const cls = strk > 0 ? "w" : "l";
    const txt = strk > 0 ? `W${strk}` : `L${-strk}`;
    return `<span class="badge ${cls}">${txt}</span>`;
  }

  function colorScale(v, vsBase) {
    // Plotly colorscale endpoints
    if (vsBase) {
      // edge -15..+15
      return [
        [0, "#3a1520"],
        [0.45, "#1a2332"],
        [0.5, "#1e2a3c"],
        [0.55, "#1a2332"],
        [1, "#0f3d2e"],
      ];
    }
    return [
      [0, "#2a1520"],
      [0.4, "#1a2332"],
      [0.5, "#243044"],
      [0.6, "#1a3a32"],
      [1, "#1a5c45"],
    ];
  }

  function renderHeat() {
    const el = $("#heat-chart");
    const teams = filteredTeams();
    const sits = enabledSituations();
    const cat = state.category;

    if (!teams.length || !sits.length) {
      el.innerHTML = '<div class="empty">No teams/situations match current filters.</div>';
      return;
    }

    const z = [];
    const text = [];
    const custom = [];
    const yLabels = teams.map((t) => `${t.abbr}`);
    const xLabels = sits.map((s) => s.label.replace(/^As /, ""));

    let any = false;
    for (const t of teams) {
      const rowZ = [];
      const rowT = [];
      const rowC = [];
      for (const sit of sits) {
        if (!situationTrueToday(t.abbr, sit.sc)) {
          rowZ.push(null);
          rowT.push("");
          rowC.push(null);
          continue;
        }
        const c = cell(t.abbr, sit.sc, cat);
        if (!c || c.pct == null || (c.n || 0) < state.minN) {
          rowZ.push(null);
          rowT.push("");
          rowC.push(null);
          continue;
        }
        const val = metricValue(c, sit.sc);
        const b = baseline(sit.sc, cat);
        const edge = b != null ? +(c.pct - b).toFixed(2) : null;
        const cmp = state.vsBaseline ? val : c.pct;
        if (cmp < state.minPct) {
          rowZ.push(null);
          rowT.push("");
          rowC.push(null);
          continue;
        }
        any = true;
        rowZ.push(val);
        const edgeStr = edge == null ? "—" : (edge >= 0 ? "+" : "") + edge;
        rowT.push(
          `${t.name}<br>${sit.label}<br>${CAT_LABEL[cat]}: ${c.pct}% (${c.record}, n=${c.n})` +
            (b != null ? `<br>Baseline: ${b}% · Edge: ${edgeStr}` : "")
        );
        rowC.push({ abbr: t.abbr, sc: sit.sc });
      }
      z.push(rowZ);
      text.push(rowT);
      custom.push(rowC);
    }

    if (!any) {
      el.innerHTML = '<div class="empty">No cells meet min N / threshold. Loosen filters.</div>';
      return;
    }

    const zflat = z.flat().filter((v) => v != null);
    let zmin, zmax;
    if (state.vsBaseline) {
      const m = Math.max(8, ...zflat.map(Math.abs));
      zmin = -m;
      zmax = m;
    } else {
      zmin = Math.min(...zflat);
      zmax = Math.max(...zflat);
      if (zmax - zmin < 5) {
        zmin = Math.max(0, zmin - 5);
        zmax = Math.min(100, zmax + 5);
      }
    }

    const mid = state.vsBaseline ? 0 : 50;
    const colorscale = state.vsBaseline
      ? [
          [0, "#ff5c7a"],
          [0.5, "#1e2a3c"],
          [1, "#3ecf8e"],
        ]
      : [
          [0, "#ff5c7a"],
          [0.5, "#1e2a3c"],
          [1, "#3dd6c6"],
        ];

    const data = [
      {
        type: "heatmap",
        z,
        x: xLabels,
        y: yLabels,
        text,
        hoverinfo: "text",
        colorscale,
        zmid: mid,
        zmin,
        zmax,
        colorbar: {
          title: state.vsBaseline ? "Edge pp" : CAT_LABEL[cat],
          thickness: 12,
          tickfont: { color: "#8b9bb4", size: 10 },
          titlefont: { color: "#8b9bb4", size: 11 },
        },
        xgap: 2,
        ygap: 2,
      },
    ];

    const layout = {
      paper_bgcolor: "rgba(0,0,0,0)",
      plot_bgcolor: "rgba(0,0,0,0)",
      margin: { t: 20, r: 20, b: 90, l: 55 },
      xaxis: {
        tickangle: -35,
        tickfont: { size: 10, color: "#8b9bb4" },
        side: "bottom",
      },
      yaxis: {
        tickfont: { size: 11, color: "#e8eef7" },
        autorange: "reversed",
      },
      height: Math.max(420, teams.length * 22 + 120),
      font: { family: "IBM Plex Sans, sans-serif", color: "#e8eef7" },
    };

    Plotly.newPlot(el, data, layout, { responsive: true, displayModeBar: false }).then(() => {
      el.on("plotly_click", (ev) => {
        const pt = ev.points?.[0];
        if (!pt) return;
        const ti = yLabels.indexOf(pt.y);
        if (ti >= 0) pinTeam(teams[ti].abbr);
      });
    });
  }

  function renderScatter() {
    const el = $("#scatter-chart");
    const teams = filteredTeams();
    const cat = state.category;

    const xs = [];
    const ys = [];
    const texts = [];
    const sizes = [];
    const colors = [];
    const custom = [];

    if (state.scatterMode === "win_cover") {
      const sc = state.scatterSit;
      for (const t of teams) {
        if (!situationTrueToday(t.abbr, sc)) continue;
        const w = cell(t.abbr, sc, "win");
        const a = cell(t.abbr, sc, "ats");
        if (!w || !a || w.pct == null || a.pct == null) continue;
        const n = Math.min(w.n || 0, a.n || 0);
        if (n < state.minN) continue;
        if (state.vsBaseline) {
          const bw = baseline(sc, "win");
          const ba = baseline(sc, "ats");
          const vx = bw != null ? w.pct - bw : w.pct;
          const vy = ba != null ? a.pct - ba : a.pct;
          if (vx < state.minPct && vy < state.minPct) {
            /* still show if either interesting — filter by neither below if both raw? keep loose */
          }
          xs.push(+vx.toFixed(2));
          ys.push(+vy.toFixed(2));
        } else {
          if (w.pct < state.minPct && a.pct < state.minPct) continue;
          xs.push(w.pct);
          ys.push(a.pct);
        }
        texts.push(
          `${t.name} (${t.abbr})<br>${sc}<br>Win ${w.pct}% (${w.record}) · Cover ${a.pct}% (${a.record})<br>n≈${n} · DIFF ${t.DIFF} · ${t.STRK_raw}`
        );
        sizes.push(Math.max(8, Math.min(28, Math.sqrt(n) * 2.2)));
        colors.push(t.STRK);
        custom.push(t.abbr);
      }
    } else {
      const scX = state.scatterX;
      const scY = state.scatterY;
      for (const t of teams) {
        if (!situationTrueToday(t.abbr, scX) || !situationTrueToday(t.abbr, scY)) continue;
        const cx = cell(t.abbr, scX, cat);
        const cy = cell(t.abbr, scY, cat);
        if (!cx || !cy || cx.pct == null || cy.pct == null) continue;
        const n = Math.min(cx.n || 0, cy.n || 0);
        if (n < state.minN) continue;
        let vx = cx.pct;
        let vy = cy.pct;
        if (state.vsBaseline) {
          const bx = baseline(scX, cat);
          const by = baseline(scY, cat);
          vx = bx != null ? +(cx.pct - bx).toFixed(2) : cx.pct;
          vy = by != null ? +(cy.pct - by).toFixed(2) : cy.pct;
        }
        if (!state.vsBaseline && vx < state.minPct && vy < state.minPct) continue;
        xs.push(vx);
        ys.push(vy);
        texts.push(
          `${t.name}<br>X ${scX}: ${cx.pct}% (${cx.record}, n=${cx.n})<br>Y ${scY}: ${cy.pct}% (${cy.record}, n=${cy.n})`
        );
        sizes.push(Math.max(8, Math.min(28, Math.sqrt(n) * 2.2)));
        colors.push(t.DIFF);
        custom.push(t.abbr);
      }
    }

    if (!xs.length) {
      el.innerHTML = '<div class="empty">No points match filters for this scatter.</div>';
      return;
    }

    const xlab =
      state.scatterMode === "win_cover"
        ? (state.vsBaseline ? "Win% edge" : "Win%") + ` · ${state.scatterSit}`
        : (state.vsBaseline ? "Edge · " : "") + state.scatterX + ` (${CAT_LABEL[cat]})`;
    const ylab =
      state.scatterMode === "win_cover"
        ? (state.vsBaseline ? "Cover% edge" : "Cover%") + ` · ${state.scatterSit}`
        : (state.vsBaseline ? "Edge · " : "") + state.scatterY + ` (${CAT_LABEL[cat]})`;

    const data = [
      {
        type: "scatter",
        mode: "markers+text",
        x: xs,
        y: ys,
        text: custom,
        textposition: "top center",
        textfont: { size: 9, color: "#8b9bb4" },
        marker: {
          size: sizes,
          color: colors,
          colorscale: [
            [0, "#ff5c7a"],
            [0.5, "#5b8cff"],
            [1, "#3ecf8e"],
          ],
          colorbar: {
            title: state.scatterMode === "win_cover" ? "Streak" : "DIFF",
            thickness: 12,
            tickfont: { color: "#8b9bb4", size: 10 },
            titlefont: { color: "#8b9bb4", size: 11 },
          },
          line: { width: 1, color: "rgba(255,255,255,0.25)" },
          opacity: 0.9,
        },
        hovertext: texts,
        hoverinfo: "text",
        customdata: custom,
      },
    ];

    // reference lines at 0 if vs baseline, else baseline 50 or situation baselines
    const shapes = [];
    if (state.vsBaseline) {
      shapes.push(
        { type: "line", x0: 0, x1: 0, y0: Math.min(...ys) - 2, y1: Math.max(...ys) + 2, line: { color: "#243044", dash: "dot" } },
        { type: "line", y0: 0, y1: 0, x0: Math.min(...xs) - 2, x1: Math.max(...xs) + 2, line: { color: "#243044", dash: "dot" } }
      );
    }

    const layout = {
      paper_bgcolor: "rgba(0,0,0,0)",
      plot_bgcolor: "#0f141c",
      margin: { t: 24, r: 20, b: 56, l: 56 },
      xaxis: {
        title: { text: xlab, font: { size: 11, color: "#8b9bb4" } },
        gridcolor: "#1a2332",
        zerolinecolor: "#243044",
        tickfont: { color: "#8b9bb4", size: 10 },
      },
      yaxis: {
        title: { text: ylab, font: { size: 11, color: "#8b9bb4" } },
        gridcolor: "#1a2332",
        zerolinecolor: "#243044",
        tickfont: { color: "#8b9bb4", size: 10 },
      },
      height: 520,
      shapes,
      font: { family: "IBM Plex Sans, sans-serif", color: "#e8eef7" },
    };

    Plotly.newPlot(el, data, layout, { responsive: true, displayModeBar: false }).then(() => {
      el.on("plotly_click", (ev) => {
        const abbr = ev.points?.[0]?.customdata;
        if (abbr) pinTeam(abbr);
      });
    });
  }

  function slateForTeam(abbr) {
    const slate = state.data.slate;
    if (!slate?.games) return null;
    return slate.games.find((g) => g.home_abbr === abbr || g.away_abbr === abbr) || null;
  }


  /** Situation codes that are actually true for this team on today's slate. */
  function todaysSituationsForTeam(abbr) {
    const g = slateForTeam(abbr);
    if (!g) return new Set();
    const out = new Set(["all_games", "is_regular_season"]);
    const isHome = g.home_abbr === abbr;
    const isAway = g.away_abbr === abbr;
    if (isHome) out.add("is_home");
    if (isAway) out.add("is_away");
    const isDog = g.dog_abbr === abbr;
    const isFav = g.fav_abbr === abbr;
    if (isDog) out.add("is_dog");
    if (isFav) out.add("is_fav");
    if (isHome && isFav) out.add("is_home_fav");
    if (isHome && isDog) out.add("is_home_dog");
    if (isAway && isFav) out.add("is_away_fav");
    if (isAway && isDog) out.add("is_away_dog");
    const team = state.data.teams.find((t) => t.abbr === abbr);
    if (team && typeof team.STRK === "number") {
      if (team.STRK > 0) out.add("is_after_win");
      else if (team.STRK < 0) out.add("is_after_loss");
    }
    return out;
  }

  function situationTrueToday(abbr, sc) {
    if (!state.todayOnly) return true;
    return todaysSituationsForTeam(abbr).has(sc);
  }


  function rowFilterTag(r) {
    const tags = [];
    const sc = r.sit.sc;
    if (state.category === "ats" && (sc === "is_away_dog" || sc === "is_home_dog" || sc === "is_dog")) {
      tags.push("ATS dog");
    }
    if (state.rdSurplusDog && isRdSurplusDog(r.team)) tags.push("home dog + RD>0 (2026 snapshot)");
    if (state.poffClinched && r.team.playoff_tag === "clinched") tags.push("clinched (2026 ESPN snapshot / look-ahead)");
    if (state.poffMustChase && r.team.playoff_tag === "must_chase") tags.push("must-chase (2026 ESPN snapshot / look-ahead)");
    if (state.poffDeadMoney && r.team.playoff_tag === "dead_money") tags.push("dead money (2026 ESPN snapshot / look-ahead)");
    if (state.confirmedIl) tags.push("recent IL / SP on IL (official, 40-man)");
    if (state.wxIndoor || state.wxHot || state.wxPrecip) tags.push("ESPN weather screen");
    if (state.starterAdjGap) tags.push("starter-adj gap (ESPN predictor — not a backtested trend)");
    if (!tags.length) return "";
    return ` <span style="color:var(--muted);font-size:0.7rem">according to ${tags.join(" + ")}</span>`;
  }

  function accordingToLine() {
    const cat = CAT_LABEL[state.category] || state.category;
    const sits = enabledSituations().map((s) => s.label.replace(/^As /, ""));
    const { lo, hi } = yearRange();
    const bits = [];
    if (sits.length && sits.length <= 6) bits.push(sits.join(", "));
    else if (sits.length) bits.push(`${sits.length} situations`);
    bits.push(cat);
    bits.push(`baseline ${lo}–${hi}`);
    if (state.todayOnly) bits.push("today’s slate only");
    if (state.rdSurplusDog) bits.push("home ATS dog AND RD/G>0 (2026 ESPN snapshot, look-ahead)");
    if (state.poffClinched) bits.push("clinched / locked (2026 ESPN snapshot / look-ahead)");
    if (state.poffMustChase) bits.push("must-chase (2026 ESPN snapshot / look-ahead)");
    if (state.poffDeadMoney) bits.push("dead money (2026 ESPN snapshot / look-ahead)");
    if (state.confirmedIl) bits.push("recent IL / SP on IL (official, 40-man — 7d placed-on-IL txs or probable SP on IL; dialed from 14d)");
    if (state.wxIndoor) bits.push("dome/indoor (ESPN)");
    if (state.wxHot) bits.push("hot outdoor ≥90° (ESPN)");
    if (state.wxPrecip) bits.push("precip/storm risk (ESPN)");
    if (state.starterAdjGap) bits.push("starter-adj |Δ|≥2 (ESPN predictor — not a backtested trend)");
    if (state.vsBaseline) bits.push("vs baseline");
    return "According to " + bits.join(" · ");
  }

  function renderList() {
    const wrap = $("#list-table");
    const acc = $("#according-to");
    if (acc) acc.textContent = accordingToLine();
    let rows = matchingRows();

    const colAccessors = {
      team: (r) => r.team.abbr,
      streak: (r) => r.team.STRK,
      l10: (r) => r.team.L10,
      situation: (r) => r.sit.label,
      record: (r) => r.cell.record || "",
      pct: (r) => r.cell.pct,
      n: (r) => r.cell.n || 0,
      edge: (r) => (r.edge == null ? -999 : r.edge),
      edge_pp: (r) => computeEdge(r.team).edge_pp,
      slate: (r) => (slateForTeam(r.team.abbr)?.name || ""),
    };

    rows.sort((a, b) => {
      const av = colAccessors[state.sortCol]?.(a);
      const bv = colAccessors[state.sortCol]?.(b);
      if (av < bv) return -1 * state.sortDir;
      if (av > bv) return 1 * state.sortDir;
      return 0;
    });

    $("#list-count").textContent = `${rows.length} rows`;

    if (!rows.length) {
      wrap.innerHTML = '<div class="empty">No rows match. Loosen min N, threshold, streak/L10 filters, or turn off Today only.</div>';
      return;
    }

    const hasSlate = !!state.data.slate?.games?.length;
    let html = `<div class="table-wrap"><table><thead><tr>
      <th data-col="team">Team</th>
      <th data-col="streak">Streak</th>
      <th data-col="l10">L10</th>
      <th data-col="situation">Situation</th>
      <th class="num" data-col="record">Record</th>
      <th class="num" data-col="pct">Pct</th>
      <th class="num" data-col="n">N</th>
      <th class="num" data-col="edge">vs Baseline</th>
      <th class="num" data-col="edge_pp">edge_pp</th>
      ${hasSlate ? '<th data-col="slate">Today</th>' : ""}
    </tr></thead><tbody>`;

    for (const r of rows) {
      const edgeCls = r.edge == null ? "" : r.edge >= 0 ? "edge-pos" : "edge-neg";
      const edgeTxt = r.edge == null ? "—" : (r.edge >= 0 ? "+" : "") + r.edge;
      const g = hasSlate ? slateForTeam(r.team.abbr) : null;
      let slateCell = "";
      if (hasSlate) {
        if (!g) slateCell = "—";
        else {
          const role =
            g.dog_abbr === r.team.abbr
              ? `DOG ${g.dog_side}`
              : g.home_abbr === r.team.abbr
              ? "HOME"
              : "AWAY";
          const ml =
            g.home_abbr === r.team.abbr ? g.dk_ml_home : g.dk_ml_away;
          const wp =
            g.home_abbr === r.team.abbr ? g.espn_home_wp : g.espn_away_wp;
          const trip = g.triple ? ' <span class="badge triple">TRIPLE</span>' : "";
          const v12 = v12Badges(g);
          slateCell = `${g.name} · ${role} ${ml || ""} · ESPN ${wp != null ? wp.toFixed(1) + "%" : "—"}${trip}${v12 ? " " + v12 : ""}`;
        }
      }
      const pin = state.pinned === r.team.abbr ? "pinned" : "";
      html += `<tr class="${pin}" data-abbr="${r.team.abbr}">
        <td><strong>${r.team.abbr}</strong> <span style="color:var(--muted)">${r.team.name}</span></td>
        <td>${streakBadge(r.team.STRK)}</td>
        <td class="num">${r.team.L10}</td>
        <td>${r.sit.label}${rowFilterTag(r)}</td>
        <td class="num">${r.cell.record || "—"}</td>
        <td class="num">${r.cell.pct}%</td>
        <td class="num">${r.cell.n ?? "—"}</td>
        <td class="num ${edgeCls}">${edgeTxt}${r.baseline != null ? ` <span style="color:var(--muted);font-size:0.7rem">(${r.baseline}%)</span>` : ""}</td>
        <td class="num ${computeEdge(r.team).edge_pp >= 0 ? "edge-pos" : "edge-neg"}">${fmtPp(computeEdge(r.team).edge_pp)}</td>
        ${hasSlate ? `<td>${slateCell}</td>` : ""}
      </tr>`;
    }
    html += "</tbody></table></div>";
    wrap.innerHTML = html;

    $$("th[data-col]", wrap).forEach((th) => {
      th.addEventListener("click", () => {
        const col = th.dataset.col;
        if (state.sortCol === col) state.sortDir *= -1;
        else {
          state.sortCol = col;
          state.sortDir = col === "team" || col === "situation" ? 1 : -1;
        }
        renderList();
        saveState();
      });
    });
    $$("tbody tr", wrap).forEach((tr) => {
      tr.addEventListener("click", () => pinTeam(tr.dataset.abbr));
    });
  }

  function formatNotedIl(list, side) {
    if (!list?.length) return "";
    const names = list
      .slice(0, 4)
      .map((e) => `${e.name}${e.code ? " (" + e.code + ")" : ""}`)
      .join(", ");
    const more = list.length > 4 ? ` +${list.length - 4}` : "";
    return `<span class="badge il" title="${list
      .map((e) => `${e.name} ${e.code}: ${e.note || ""}`)
      .join(" | ")
      .replace(/"/g, "&quot;")}">${side} IL noted: ${names}${more}</span>`;
  }

  function v12Badges(g) {
    const bits = [];
    const inj = g.injury;
    if (inj) {
      // Badge: 40-man IL with notes (non-screening). Chronic D60 included here.
      const hn = formatNotedIl(inj.home_il_noted || [], g.home_abbr || "HOME");
      const an = formatNotedIl(inj.away_il_noted || [], g.away_abbr || "AWAY");
      if (an) bits.push(an);
      if (hn) bits.push(hn);
      if (inj.home_sp_on_il || inj.away_sp_on_il) {
        const who = [
          inj.away_sp_on_il ? inj.away_sp_name : null,
          inj.home_sp_on_il ? inj.home_sp_name : null,
        ]
          .filter(Boolean)
          .join(" / ");
        bits.push(`<span class="badge il">SP IL${who ? ": " + who : ""}</span>`);
      }
      if (inj.toggle_match && (inj.recent_il_placements?.length || 0) > 0) {
        const n = inj.recent_il_placements.length;
        bits.push(`<span class="badge il" title="7d placed-on-IL (dialed from 14d)">Recent IL×${n}</span>`);
      }
    }
    const w = g.weather;
    if (w) {
      if (w.indoor) bits.push(`<span class="badge wx">Dome</span>`);
      if (w.hot_outdoor) bits.push(`<span class="badge wx">Hot ≥90°</span>`);
      if (w.precip_risk) bits.push(`<span class="badge wx">Precip</span>`);
      else if (!w.indoor && w.temp_f != null) bits.push(`<span class="badge wx">${Math.round(w.temp_f)}°</span>`);
    }
    const sa = g.starter_adjustment;
    if (sa && sa.starter_adj_gap != null) {
      const d = sa.starter_adj_gap;
      const sign = d > 0 ? "+" : "";
      bits.push(`<span class="badge sa" title="ESPN predictor — not a backtested trend">starter adj Δ${sign}${d.toFixed(1)} (ESPN predictor — not a backtested trend)</span>`);
    }
    const home = state.data.teams.find((t) => t.abbr === g.home_abbr);
    const away = state.data.teams.find((t) => t.abbr === g.away_abbr);
    for (const t of [away, home]) {
      if (!t?.playoff_tag) continue;
      const label = t.playoff_tag === "clinched" ? "Clinched" : t.playoff_tag === "must_chase" ? "Must-chase" : "Dead $";
      bits.push(`<span class="badge poff">${t.abbr} ${label}</span>`);
    }
    return bits.join(" ");
  }


  function renderEdgeBoard() {
    const host = $("#edge-board");
    const summary = $("#edge-summary");
    if (!host) return;
    const market = edgeMarket();
    const { lo, hi } = yearRange();
    if (state.category === "ou") {
      if (summary) {
        summary.innerHTML = "O/U is out of the edge stack — switch Category to Win% or Cover% (ATS). Heat/list still work for Over%.";
      }
      host.innerHTML = '<div class="empty">Edge stack uses WIN or ATS only.</div>';
      return;
    }
    let teams = filteredTeams().filter((t) => slateForTeam(t.abbr)); // slate-focused board
    // If no slate filter desire — still show slate teams primarily; if todayOnly off and no slate, show all
    if (!teams.length) {
      teams = filteredTeams();
    }
    const rows = teams.map((t) => ({ t, edge: computeEdge(t) }));
    rows.sort((a, b) => b.edge.edge_pp - a.edge.edge_pp);
    const filtered = rows.filter((r) => r.edge.edge_pp >= state.minEdge);
    if (summary) {
      const steamNote = state.layerSteam
        ? " Interim Steam ON → RD-surplus-dog checkbox is not double-counted as a +. Real rolling-RD steam deferred."
        : "";
      summary.innerHTML =
        `Market <strong>${edgeMarketLabel()}</strong> · baseline <strong>${lo}–${hi}</strong> · ${filtered.length} teams` +
        (state.edgeStackOn ? "" : " · stack mode off (board still shows scores)") +
        `. News &amp; Coaching scored layers parked.` + steamNote;
    }
    if (!filtered.length) {
      host.innerHTML = '<div class="empty">No teams meet min edge_pp / filters.</div>';
      return;
    }
    host.innerHTML = `<div class="edge-board">${filtered
      .map(({ t, edge }) => {
        const g = slateForTeam(t.abbr);
        const role = g
          ? g.dog_abbr === t.abbr
            ? "DOG"
            : g.home_abbr === t.abbr
            ? "HOME"
            : "AWAY"
          : "";
        const ppCls = edge.edge_pp >= 0 ? "edge-pos" : "edge-neg";
        const chips = edge.chips.filter((c) => c.pp !== 0 || c.group === "late").map(chipHtml).join("");
        const v12 = g ? v12Badges(g) : "";
        const fat = t.edge_fatigue?.trigger
          ? `<span class="badge fatigue" title="schedule density / DH / rest — not L10">Fatigue</span>`
          : "";
        const steam = t.edge_steam?.trigger
          ? `<span class="badge steam" title="interim season RD/G>0">Steam*</span>`
          : "";
        return `<div class="edge-row" data-abbr="${t.abbr}">
          <div class="edge-row-head">
            <div class="team-line">${t.abbr} <span style="color:var(--muted);font-weight:500">${t.name}</span>
              ${streakBadge(t.STRK)} <span style="color:var(--muted);font-size:0.75rem">L10 ${t.L10}</span>
              ${role ? `<span class="badge">${role}</span>` : ""}
              ${g ? `<span style="color:var(--muted);font-size:0.75rem">${g.name}</span>` : ""}
              ${fat}${steam}
            </div>
            <div class="edge-pp ${ppCls}">${fmtPp(edge.edge_pp)} <span style="font-size:0.75rem;color:var(--muted)">pp ${edgeMarketLabel()}</span></div>
          </div>
          <div class="edge-copy">${edge.copy}</div>
          <div class="edge-chips">${chips || '<span class="edge-chip zero">no active layer pp</span>'}</div>
          ${v12 ? `<div class="badge-row" style="margin-top:6px">${v12}</div>` : ""}
        </div>`;
      })
      .join("")}</div>`;
    $$(".edge-row", host).forEach((row) => {
      row.addEventListener("click", () => pinTeam(row.dataset.abbr));
    });
  }



  function edgeMiniForGame(g) {
    if (!state.edgeStackOn) return "";
    const bits = [];
    for (const abbr of [g.away_abbr, g.home_abbr]) {
      if (!abbr) continue;
      const t = state.data.teams.find((x) => x.abbr === abbr);
      if (!t) continue;
      const edge = computeEdge(t);
      const cls = edge.edge_pp >= 0 ? "edge-pos" : "edge-neg";
      bits.push(`<div><strong>${abbr}</strong> <span class="${cls}">${fmtPp(edge.edge_pp)} pp ${edgeMarketLabel()}</span>
        <span style="color:var(--muted)">· ${edge.chips.filter((c)=>c.pp!==0).slice(0,4).map((c)=>`${c.label} ${fmtPp(c.pp)}`).join(", ") || "flat"}</span></div>`);
    }
    if (!bits.length) return "";
    return `<div class="edge-mini">${bits.join("")}</div>`;
  }


  // ----- V3 Bet board -----
  const ABBR_NORM = { TBR: "TB", TB: "TB", CWS: "CHW", CHW: "CHW", AZ: "ARI", ARI: "ARI", WAS: "WSH", WSH: "WSH", OAK: "ATH", ATH: "ATH", SFG: "SF", SF: "SF" };
  function normAbbr(a) {
    if (!a) return "";
    const u = String(a).toUpperCase();
    return ABBR_NORM[u] || u;
  }
  function parseAmerican(ml) {
    if (ml == null || ml === "" || ml === "—") return null;
    const n = parseInt(String(ml).replace("+", ""), 10);
    return Number.isFinite(n) ? n : null;
  }
  function impliedPct(ml) {
    const x = parseAmerican(ml);
    if (x == null) return null;
    if (x < 0) return (Math.abs(x) / (Math.abs(x) + 100)) * 100;
    return (100 / (x + 100)) * 100;
  }
  function sidesMatch(a, b) {
    if (a == null || b == null || a === "" || b === "") return false;
    return normAbbr(a) === normAbbr(b) || String(a).toLowerCase() === String(b).toLowerCase();
  }
  function marketMatch(a, b) {
    if (!a || !b || a === "none" || b === "none") return false;
    return String(a).toUpperCase() === String(b).toUpperCase();
  }

  /** Chart UL climate side from away/home objects with quadrant === "UL". */
  function chartUlSide(chart, g) {
    const c = chart || {};
    if (c.awaiting) return null;
    const aw = (c.away && typeof c.away === "object") ? c.away : null;
    const ho = (c.home && typeof c.home === "object") ? c.home : null;
    const hits = [];
    if (aw && aw.quadrant === "UL") hits.push(normAbbr(aw.abbr || g?.away_abbr));
    if (ho && ho.quadrant === "UL") hits.push(normAbbr(ho.abbr || g?.home_abbr));
    const uniq = [...new Set(hits.filter(Boolean))];
    if (uniq.length === 1) return uniq[0];
    if (uniq.length > 1) {
      // Prefer side matching top-level climate note / quadrant team
      const topAbbr = normAbbr(c.abbr || "");
      if (topAbbr && uniq.includes(topAbbr)) return topAbbr;
      return uniq[0];
    }
    return null;
  }


  /** Face label for Chart chip: UL/LR + team — never bare "green" (reads like a buy). */
  function chartFaceLabel(g, chart) {
    const c = chart || chartOf(g) || {};
    if (c.awaiting || !c.screen) return c.awaiting ? "awaiting" : "—";
    const aw = (c.away && typeof c.away === "object") ? c.away : null;
    const ho = (c.home && typeof c.home === "object") ? c.home : null;
    const sides = [];
    for (const s of [aw, ho]) {
      if (!s) continue;
      const q = s.quadrant || "";
      const abbr = normAbbr(s.abbr || "");
      if (!abbr) continue;
      if (q === "UL" || q === "LR") sides.push({ q, abbr });
    }
    // Prefer UL over LR when both (climate screen priority)
    const ul = sides.filter((x) => x.q === "UL");
    const lr = sides.filter((x) => x.q === "LR");
    if (ul.length === 1) return `UL ${ul[0].abbr}`;
    if (ul.length > 1) return `UL ${ul.map((x) => x.abbr).join("/")}`;
    if (lr.length === 1) return `LR ${lr[0].abbr}`;
    if (lr.length > 1) return `LR ${lr.map((x) => x.abbr).join("/")}`;
    // Fallback: top-level quadrant if present
    if (c.quadrant === "UL" || c.quadrant === "LR") {
      const ab = normAbbr(c.abbr || "") || "";
      return ab ? `${c.quadrant} ${ab}` : c.quadrant;
    }
    // Non UL/LR screens: keep color word but tag as screen so it isn't a buy
    const scr = c.screen || "red";
    if (scr === "green") return "screen";
    if (scr === "amber") return "amber";
    if (scr === "red") return "red";
    return String(scr);
  }

  /** New Bot lean side from mark.side when present. */
  function newbotLeanSide(nb) {
    if (!nb || !nb.present) return null;
    const s = nb.side;
    if (s == null || s === "" || s === "—") return null;
    return normAbbr(s);
  }

  /** Chart UL points one side, New Bot lean the other → conflict / no-side (Kane: 0u). */
  function chartNbConflict(g, chart, newbot) {
    const ul = chartUlSide(chart, g);
    const lean = newbotLeanSide(newbot);
    if (!ul || !lean) return null;
    if (sidesMatch(ul, lean)) return null;
    return {
      conflict: true,
      chartUl: ul,
      newbotLean: lean,
      why: "Chart UL ≠ New Bot lean — no-side",
      branch: "chart_nb_conflict",
    };
  }

  /** Trends disagreement lean — flags assist OR compute TR% vs DK implied (≥~8pp ML; ATS dog / home-fav-won't-cover). O/U off. */
  function computeTrendsLean(g) {
    const leans = [];
    const flags = g.trends_flags || [];
    for (const f of flags) {
      const gapMl = f.gap_ml;
      const gapAts = f.gap_ats;
      const wn = f.wn || 0;
      const an = f.an || 0;
      const abbr = f.espn_abbr || null;
      if (gapMl != null && wn >= 15 && gapMl >= 8) {
        leans.push({
          market: "ML",
          side: abbr,
          sideLabel: f.team || abbr,
          gap: +gapMl.toFixed(1),
          reason: `ML value ${gapMl >= 0 ? "+" : ""}${gapMl.toFixed(1)}pp vs DK (${f.combo})`,
          source: "analyze_flags",
          priced: true,
          recency: "situation TR vs DK implied",
        });
      }
      if (gapAts != null && an >= 15) {
        if (!f.is_fav && gapAts >= 5) {
          leans.push({
            market: "RL",
            side: abbr,
            sideLabel: f.team || abbr,
            gap: +gapAts.toFixed(1),
            reason: `ATS dog +${gapAts.toFixed(1)}pp vs base (${f.combo})`,
            source: "analyze_flags",
            priced: true,
            recency: "durable ATS-dog shape",
          });
        }
        if (f.is_fav && gapAts <= -5) {
          // home-fav / fav won't cover → lean opponent RL
          const opp = f.is_home ? g.away_abbr : g.home_abbr;
          leans.push({
            market: "RL",
            side: opp,
            sideLabel: opp,
            gap: +gapAts.toFixed(1),
            reason: `Fav won't cover ATS ${gapAts.toFixed(1)}pp vs base (${f.combo})`,
            source: "analyze_flags",
            priced: true,
            recency: "home-fav-won't-cover / fav ATS soft",
          });
        }
      }
      // fav overpriced ML → dog lean context
      if (f.is_fav && gapMl != null && wn >= 15 && gapMl <= -8) {
        const opp = f.is_home ? g.away_abbr : g.home_abbr;
        leans.push({
          market: "ML",
          side: opp,
          sideLabel: opp,
          gap: +(-gapMl).toFixed(1),
          reason: `Fav overpriced ${gapMl.toFixed(1)}pp — dog lean context`,
          source: "analyze_flags",
          priced: true,
          recency: "priced disagreement",
        });
      }
    }

    // Compute from slate TR vs DK if no flag lean yet
    if (!leans.length) {
      for (const side of ["away", "home"]) {
        const abbr = side === "away" ? g.away_abbr : g.home_abbr;
        const ml = side === "away" ? g.dk_ml_away : g.dk_ml_home;
        const imp = impliedPct(ml);
        const isHome = side === "home";
        const favNum = parseAmerican(g.dk_ml_home);
        const dogNum = parseAmerican(g.dk_ml_away);
        let isFav = null;
        if (favNum != null && dogNum != null) {
          // lower American = favorite
          const homeIsFav = favNum < dogNum;
          isFav = isHome ? homeIsFav : !homeIsFav;
        }
        if (isFav == null) continue;
        const sc = isHome ? (isFav ? "is_home_fav" : "is_home_dog") : (isFav ? "is_away_fav" : "is_away_dog");
        const winC = cell(abbr, sc, "win");
        const atsC = cell(abbr, sc, "ats");
        const baseAts = baseline(sc, "ats");
        if (winC && (winC.n || 0) >= 15 && imp != null) {
          const gap = +(winC.pct - imp).toFixed(1);
          if (gap >= 8) {
            leans.push({
              market: "ML",
              side: abbr,
              sideLabel: abbr,
              gap,
              reason: `TR ${sc} ${winC.pct}% vs DK imp ${imp.toFixed(1)}% (${gap >= 0 ? "+" : ""}${gap}pp)`,
              source: "slate_compute",
              priced: true,
              recency: "TR% vs DK implied",
            });
          }
          if (isFav && gap <= -8) {
            const opp = isHome ? g.away_abbr : g.home_abbr;
            leans.push({
              market: "ML",
              side: opp,
              sideLabel: opp,
              gap: +(-gap).toFixed(1),
              reason: `Fav overpriced TR ${winC.pct}% vs imp ${imp.toFixed(1)}%`,
              source: "slate_compute",
              priced: true,
              recency: "priced disagreement",
            });
          }
        }
        if (atsC && (atsC.n || 0) >= 15 && baseAts != null) {
          const gapA = +(atsC.pct - baseAts).toFixed(1);
          if (!isFav && gapA >= 5) {
            leans.push({
              market: "RL",
              side: abbr,
              sideLabel: abbr,
              gap: gapA,
              reason: `ATS dog ${atsC.pct}% vs base ${baseAts}% (+${gapA}pp)`,
              source: "slate_compute",
              priced: true,
              recency: "durable ATS-dog",
            });
          }
          if (isFav && gapA <= -5) {
            const opp = isHome ? g.away_abbr : g.home_abbr;
            leans.push({
              market: "RL",
              side: opp,
              sideLabel: opp,
              gap: gapA,
              reason: `Fav ATS soft ${atsC.pct}% vs base ${baseAts}% (${gapA}pp)`,
              source: "slate_compute",
              priced: true,
              recency: "home-fav-won't-cover shape",
            });
          }
        }
      }
    }

    // Prefer strongest ML then RL; dedupe by market+side
    const seen = new Set();
    const uniq = [];
    leans.sort((a, b) => (b.gap || 0) - (a.gap || 0) || (a.market === "ML" ? -1 : 1));
    for (const L of leans) {
      const k = `${L.market}|${normAbbr(L.side)}`;
      if (seen.has(k)) continue;
      seen.add(k);
      uniq.push(L);
    }
    const primary = uniq[0] || null;
    return {
      hasLean: !!primary,
      lean: primary,
      all: uniq,
      ou: null, // O/U last / none by default
    };
  }

  function milesOf(g) {
    const m = g.miles || {};
    return {
      status: m.status || "stand_down",
      true: m.true || "",
      likely: m.likely || "",
      kill: m.kill || "",
      market: m.market || "none",
      side: m.side == null ? null : m.side,
    };
  }

  /** Locked overall tint rules — Miles last gate: clear→green path only; kill|stand_down→PASS gray; watch→WATCH amber. */
  function overallVisual(trends, miles) {
    const st = miles.status || "stand_down";
    if (st === "kill") {
      const killTxt = (miles.kill || "").trim();
      return {
        tint: "gray",
        label: "pass",
        why: killTxt ? `Miles kill: ${killTxt}` : "Miles kill",
        branch: "miles_kill",
      };
    }
    if (st === "stand_down") {
      return {
        tint: "gray",
        label: "pass",
        why: "Miles stand_down (no path around Miles to green)",
        branch: "miles_stand_down",
      };
    }
    if (!trends.hasLean) return { tint: "gray", label: "pass", why: "No Trends lean", branch: "no_trends" };
    const lean = trends.lean;
    if (st === "clear") {
      const sideOk = sidesMatch(lean.side, miles.side);
      const mktOk = !miles.market || miles.market === "none" || marketMatch(lean.market, miles.market);
      if (sideOk && mktOk) return { tint: "green", label: "green", why: "Miles clear + Trends agree", branch: "clear_agree" };
      return { tint: "gray", label: "pass", why: "Trends↔Miles conflict", branch: "side_conflict" };
    }
    // watch only → amber WATCH end
    if (st === "watch") return { tint: "amber", label: "watch", why: "Trends lean · Miles watch", branch: "miles_watch" };
    return { tint: "gray", label: "pass", why: `Miles ${st}`, branch: "miles_other" };
  }

  function milesChipTint(miles) {
    if (miles.status === "clear") return "green";
    if (miles.status === "watch") return "amber";
    return "gray"; // kill or stand_down
  }

  function chartOf(g) {
    const c = g.chart || {};
    if (c.awaiting || !c.screen) {
      return { awaiting: true, screen: null, note: c.note || "Chart: awaiting feed" };
    }
    return c;
  }

  function newbotOf(g) {
    const n = g.newbot || {};
    if (!n.present) return { present: false, note: n.note || "New Bot: no mark" };
    return n;
  }

  function renderTrendsLayer(g, trends) {
    const lean = trends.lean;
    let chip = "gray";
    let chipLabel = "pass";
    let body = '<div class="muted">No actionable ML/RL disagreement (≥~8pp ML or durable ATS shapes). O/U off.</div>';
    if (lean) {
      chip = "amber";
      chipLabel = `${lean.market} ${normAbbr(lean.side)}`;
      body = `<div><strong>${lean.market} ${escapeHtml(lean.sideLabel || lean.side)}</strong> · ${escapeHtml(lean.reason)}</div>
        <div class="muted" style="margin-top:4px">${lean.priced ? "priced" : "unpriced"} · ${escapeHtml(lean.recency || "")} · ${escapeHtml(lean.source || "")}</div>`;
    }
    // V2 edge_pp chips
    let edgeHtml = "";
    try {
      const bits = [];
      for (const abbr of [g.away_abbr, g.home_abbr]) {
        const t = state.data.teams.find((x) => x.abbr === abbr);
        if (!t) continue;
        const edge = computeEdge(t);
        bits.push(`<span class="edge-chip ${edge.edge_pp >= 0 ? "pos" : "neg"}"><span class="layer-name">${abbr}</span> ${fmtPp(edge.edge_pp)}</span>`);
      }
      if (bits.length) edgeHtml = `<div class="edge-chips">${bits.join("")}<span class="muted" style="font-size:0.68rem;margin-left:4px">V2 edge_pp</span></div>`;
    } catch (_) {}
    return layerHtml("Trends", chip, chipLabel, body + edgeHtml);
  }

  function renderChartLayer(g) {
    // Thin Bet face: tint stays green/amber/red; label is UL/LR + team (never bare "green" buy).
    const c = chartOf(g);
    if (c.awaiting) {
      return layerHtml("Chart", "amber", "awaiting",
        '<div class="muted">awaiting feed</div><details class="chart-memo"><summary>Win% / RD/G / quadrant</summary><div class="muted">Chart: awaiting feed</div></details>');
    }
    const scr = c.screen || "red";
    const chip = scr === "green" ? "green" : scr === "amber" ? "amber" : scr === "red" ? "red" : "gray";
    const away = c.away || {};
    const home = c.home || {};
    const aw = typeof away === "object" ? away : {};
    const ho = typeof home === "object" ? home : {};
    const lines = [];
    if (aw.abbr) lines.push(`${aw.abbr} Win% ${aw.win_pct != null ? (aw.win_pct * 100).toFixed(1) : "—"} · RD/G ${aw.rd_per_game != null ? Number(aw.rd_per_game).toFixed(2) : "—"} · ${aw.quadrant || "—"}`);
    if (ho.abbr) lines.push(`${ho.abbr} Win% ${ho.win_pct != null ? (ho.win_pct * 100).toFixed(1) : "—"} · RD/G ${ho.rd_per_game != null ? Number(ho.rd_per_game).toFixed(2) : "—"} · ${ho.quadrant || "—"}`);
    if (!lines.length && c.quadrant) lines.push(`quadrant ${c.quadrant} · RD/G ${c.rd_per_game != null ? Number(c.rd_per_game).toFixed(2) : "—"} · Win% ${c.win_pct != null ? (c.win_pct * 100).toFixed(1) : "—"}`);
    // Face: chip only (+ red caution already on card kill line). Detail behind tap.
    const face = scr === "red"
      ? '<div class="chart-caution-face">red · caution, not auto-kill</div>'
      : "";
    const detailBody = (lines.length ? `<div class="mono">${lines.map(escapeHtml).join("<br>")}</div>` : '<div class="muted">—</div>')
      + (c.note ? `<div class="muted" style="margin-top:4px">${escapeHtml(c.note)}</div>` : "");
    const memo = `<details class="chart-memo"><summary>Win% / RD/G / quadrant</summary>${detailBody}</details>`;
    const faceLab = chartFaceLabel(g, c);
    return layerHtml("Chart", chip, faceLab, face + memo);
  }

  function renderNewbotLayer(g) {
    const n = newbotOf(g);
    if (!n.present) {
      return layerHtml("New Bot", "gray", "none", '<div class="muted">New Bot: no mark</div>');
    }
    const st = n.status || "pass";
    const chip = st === "watch" ? "amber" : "gray";
    const kill = Array.isArray(n.kill) ? n.kill : (n.kill ? [n.kill] : []);
    const kv = [
      ["status", st],
      ["market", n.market || "—"],
      ["side", n.side || "—"],
      ["model_p", n.model_p != null ? Number(n.model_p).toFixed(4) : "—"],
      ["implied", n.implied != null ? Number(n.implied).toFixed(4) : "—"],
      ["edge_pts", n.edge_pts != null ? Number(n.edge_pts).toFixed(2) : "—"],
      ["kill", kill.length ? kill.join("; ") : "—"],
    ];
    const body = `<div class="bet-kv">${kv.map(([k,v]) => `<span>${k}</span><span>${escapeHtml(String(v))}</span>`).join("")}</div>` +
      (n.note ? `<div class="muted" style="margin-top:4px">${escapeHtml(n.note)}</div>` : "");
    return layerHtml("New Bot", chip, st, body);
  }

  function renderMilesLayer(g, miles) {
    // Face rule (thin Bet): status chip + kill only; true/likely behind expand (this layer lives in collapsed detail).
    const chip = milesChipTint(miles);
    const killTxt = (miles.kill || "").trim();
    const face = killTxt
      ? `<div class="miles-kill-face">kill · ${escapeHtml(killTxt)}</div>`
      : `<div class="muted">status · ${escapeHtml(miles.status || "stand_down")}</div>`;
    const memo = `<details class="miles-memo"><summary>true / likely</summary>
      <div class="bet-kv">
        <span>true</span><span>${escapeHtml(miles.true || "—")}</span>
        <span>likely</span><span>${escapeHtml(miles.likely || "—")}</span>
        <span>market</span><span>${escapeHtml(miles.market || "none")}</span>
        <span>side</span><span>${escapeHtml(miles.side == null ? "—" : String(miles.side))}</span>
      </div>
    </details>`;
    return layerHtml("Miles", chip, miles.status, face + memo);
  }

  function layerHtml(name, chip, chipLabel, body) {
    return `<div class="bet-layer" data-layer="${name.toLowerCase().replace(" ", "")}">
      <div class="bet-layer-head">
        <span class="bet-layer-name">${name}</span>
        <span class="bet-layer-chip ${chip}">${escapeHtml(chipLabel)}</span>
      </div>
      <div class="body">${body}</div>
    </div>`;
  }

  function escapeHtml(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function decisionSteps(r) {
    const trends = r.trends;
    const miles = r.miles;
    const chart = r.chart;
    const nb = r.newbot;
    const lean = trends.lean;
    const trendsStep = lean
      ? { key: "Trends", value: `${lean.market} ${normAbbr(lean.side)}`, tint: "amber", fired: true }
      : { key: "Trends", value: "pass", tint: "gray", fired: false };
    let chartTint = "gray";
    let chartVal = "awaiting";
    if (chart && !chart.awaiting && chart.screen) {
      chartVal = chartFaceLabel(r.g || null, chart);
      chartTint = chart.screen === "green" ? "green" : chart.screen === "amber" ? "amber" : chart.screen === "red" ? "red" : "gray";
    }
    const chartStep = { key: "Chart", value: chartVal, tint: chartTint, fired: !!(chart && !chart.awaiting && chart.screen), caution: chart.screen === "red" };
    let nbTint = "gray";
    let nbVal = "none";
    if (nb && nb.present) {
      nbVal = nb.status || "pass";
      nbTint = nbVal === "watch" ? "amber" : "gray";
    }
    const killArr = (nb && nb.present)
      ? (Array.isArray(nb.kill) ? nb.kill : (nb.kill ? [nb.kill] : []))
      : [];
    const nbStep = { key: "New Bot", value: nbVal, tint: nbTint, fired: !!(nb && nb.present), killText: killArr.filter(Boolean).join("; ") };
    const mSt = miles.status || "stand_down";
    let mTint = "gray";
    if (mSt === "clear") mTint = "green";
    else if (mSt === "watch") mTint = "amber";
    else if (mSt === "kill") mTint = "red";
    const milesStep = {
      key: "Miles",
      value: mSt,
      tint: mTint,
      fired: true,
      killText: mSt === "kill" ? ((miles.kill || "").trim()) : "",
    };
    const overallMap = { green: "GREEN", amber: "WATCH", gray: "PASS" };
    let overallVal = overallMap[r.overall.tint] || String(r.overall.label || "").toUpperCase();
    if (r.overall.branch === "chart_nb_conflict" || r.overall.label === "no-side" || r.conflict) {
      overallVal = "NO-SIDE";
    }
    const overallStep = {
      key: "Overall",
      value: overallVal,
      tint: r.overall.tint,
      fired: true,
      overall: true,
    };
    return { trendsStep, chartStep, nbStep, milesStep, overallStep, why: r.overall.why || "", branch: r.overall.branch || "" };
  }

  function killCautionLine(r) {
    const s = decisionSteps(r);
    // One visible line: prefer Miles kill, then conflict, then stand_down, then NB kill, then chart caution, else overall why
    if (s.milesStep.killText) {
      return { cls: "bet-kill-note", text: `Miles kill · ${s.milesStep.killText}` };
    }
    if (s.branch === "chart_nb_conflict" || (r.overall && r.overall.branch === "chart_nb_conflict") || r.conflict) {
      return { cls: "bet-kill-note", text: (r.overall && r.overall.why) || s.why || "Chart UL ≠ New Bot lean — no-side" };
    }
    if (s.branch === "side_conflict") {
      return { cls: "bet-kill-note", text: s.why || "Trends↔Miles conflict" };
    }
    if (s.branch === "miles_stand_down") {
      return { cls: "bet-caution-note", text: "Miles stand_down · PASS (no path around Miles to green)" };
    }
    if (s.nbStep.killText) {
      return { cls: "bet-kill-note", text: `New Bot kill · ${s.nbStep.killText}` };
    }
    if (s.chartStep.caution) {
      return { cls: "bet-caution-note", text: "Chart red · caution, not auto-kill" };
    }
    if (r.overall && r.overall.why) {
      return { cls: "bet-why-line", text: r.overall.why };
    }
    return null;
  }

  function renderDecisionStrip(r) {
    const s = decisionSteps(r);
    const steps = [s.trendsStep, s.chartStep, s.nbStep, s.milesStep, s.overallStep];
    const nodes = steps.map((st, i) => {
      const arrow = i ? '<span class="bet-step-arrow" aria-hidden="true">→</span>' : "";
      const cls = `bet-step ${st.tint}${st.overall ? " overall" : ""}`;
      return `${arrow}<div class="${cls}" title="${escapeHtml(st.key + ": " + st.value)}"><span class="step-k">${escapeHtml(st.key)}</span><span class="step-v">${escapeHtml(st.value)}</span></div>`;
    }).join("");
    const line = killCautionLine(r);
    const note = line
      ? `<div class="${line.cls} flat">${escapeHtml(line.text)}</div>`
      : "";
    return `<div class="bet-decision-strip" aria-label="Decision path">${nodes}</div>${note}`;
  }

  function dkLineHtml(g) {
    const ml = `ML ${g.away_abbr} ${g.dk_ml_away || "—"} / ${g.home_abbr} ${g.dk_ml_home || "—"}`;
    const rlAway = g.dk_rl_away || g.rl_away || g.away_rl;
    const rlHome = g.dk_rl_home || g.rl_home || g.home_rl;
    const rl = (rlAway || rlHome)
      ? `RL ${g.away_abbr} ${rlAway || "—"} / ${g.home_abbr} ${rlHome || "—"}`
      : "RL —";
    const tot = `O/U ${g.total != null ? g.total : "—"}`;
    return `DK ${ml} · ${rl} · ${tot}`;
  }

  function renderLayerChipsRow(r, showT, showC, showN, showM) {
    const chips = [];
    if (showT) {
      const lean = r.trends.lean;
      const tint = lean ? "amber" : "gray";
      const lab = lean ? `${lean.market} ${normAbbr(lean.side)}` : "pass";
      chips.push(`<span class="bet-layer-chip ${tint}" title="Trends">T · ${escapeHtml(lab)}</span>`);
    }
    if (showC) {
      const c = r.chart;
      let tint = "gray", lab = "awaiting";
      if (c && !c.awaiting && c.screen) {
        lab = chartFaceLabel(r.g, c);
        tint = c.screen === "green" ? "green" : c.screen === "amber" ? "amber" : c.screen === "red" ? "red" : "gray";
      }
      chips.push(`<span class="bet-layer-chip ${tint}" title="Chart climate — not a buy">C · ${escapeHtml(lab)}</span>`);
    }
    if (showN) {
      const n = r.newbot;
      const present = n && n.present;
      const st = present ? (n.status || "pass") : "none";
      const tint = st === "watch" ? "amber" : "gray";
      chips.push(`<span class="bet-layer-chip ${tint}" title="New Bot">NB · ${escapeHtml(st)}</span>`);
    }
    if (showM) {
      const miles = r.miles;
      const tint = milesChipTint(miles);
      chips.push(`<span class="bet-layer-chip ${tint}" title="Miles">M · ${escapeHtml(miles.status || "stand_down")}</span>`);
    }
    if (r.conflict || (r.overall && r.overall.branch === "chart_nb_conflict")) {
      const ul = r.conflict?.chartUl || "";
      const nb = r.conflict?.newbotLean || "";
      const tip = ul && nb ? `Chart UL ${ul} ≠ New Bot ${nb}` : "Chart UL ≠ New Bot lean — no-side";
      chips.push(`<span class="bet-layer-chip gray bet-face-chip-conflict" title="${escapeHtml(tip)}">conflict / no-side</span>`);
    }
    return `<div class="bet-chip-row">${chips.join("")}</div>`;
  }

  function renderCollapsedLayers(g, r, showT, showC, showN, showM) {
    const layers = [];
    if (showT) layers.push(renderTrendsLayer(g, r.trends));
    if (showC) layers.push(renderChartLayer(g));
    if (showN) layers.push(renderNewbotLayer(g));
    if (showM) layers.push(renderMilesLayer(g, r.miles));
    if (!layers.length) return "";
    return `<details class="bet-advanced-layers"><summary>Layer detail</summary><div class="bet-layers">${layers.join("")}</div></details>`;
  }


  // ----- Bluff scan (quality filter → fade-candidates; desk tree still gates) -----
  // Miles/Kane locks: injury = official IL tiers only (never 0–100);
  // fatigue = schedule/rest; steam = interim RD/G snapshot labeled;
  // late playoff_tag hits (clinched / must_chase / dead_money) = team.playoff_tag from data.json only;
  // bluff = DK still ML-fav despite selected hits (fog tease); not auto-bet;
  // Miles kill/stand_down → gray; New Bot edge must clear before size; Kane sizes fades smaller.

  function teamByAbbr(abbr) {
    const n = normAbbr(abbr);
    const teams = state.data?.teams || [];
    return teams.find((t) => normAbbr(t.abbr) === n) || null;
  }

  function edgePackForSide(g, abbr) {
    const n = normAbbr(abbr);
    const eba = g.edge_by_abbr || {};
    let pack = null;
    for (const [k, v] of Object.entries(eba)) {
      if (normAbbr(k) === n) { pack = v; break; }
    }
    const t = teamByAbbr(abbr);
    return {
      injury: (pack && (pack.injury || pack.edge_injury)) || t?.edge_injury || {},
      fatigue: (pack && (pack.fatigue || pack.edge_fatigue)) || t?.edge_fatigue || {},
      steam: (pack && (pack.steam || pack.edge_steam)) || t?.edge_steam || {},
    };
  }

  /** Official IL severity only: none | light (recent non-SP) | heavy (SP on IL/susp or near injury cap). Never a 0–100 score. */
  function injuryTierForSide(g, abbr, side) {
    const pack = edgePackForSide(g, abbr);
    const ei = pack.injury || {};
    const inj = g.injury || {};
    const spGame = side === "home" ? !!inj.home_sp_on_il : !!inj.away_sp_on_il;
    const spEdge = !!ei.sp_on_il_or_susp;
    const capped = !!ei.capped; // near injury-magnitude cap — not a health %
    const heavy = spGame || spEdge || capped;
    const recent = Array.isArray(ei.recent_non_sp) ? ei.recent_non_sp : [];
    const parts = Array.isArray(ei.parts) ? ei.parts : [];
    const placements = Array.isArray(inj.recent_il_placements) ? inj.recent_il_placements : [];
    const teamHit = placements.some((p) => normAbbr(p.team_abbr) === normAbbr(abbr));
    const light = !heavy && (recent.length > 0 || parts.length > 0 || (!!inj.toggle_match && teamHit));
    if (heavy) {
      const who = ei.sp_name || (side === "home" ? inj.home_sp_name : inj.away_sp_name) || null;
      return {
        tier: "heavy",
        anyHit: true,
        label: who ? `injury heavy (SP IL: ${who})` : (capped ? "injury heavy (near IL cap)" : "injury heavy (SP on IL)"),
      };
    }
    if (light) {
      const name = recent[0]?.name || parts[0]?.label || "recent IL";
      return { tier: "light", anyHit: true, label: `injury light (${name})` };
    }
    return { tier: "none", anyHit: false, label: "injury none" };
  }

  function fatigueOnForSide(g, abbr) {
    const ef = edgePackForSide(g, abbr).fatigue || {};
    if (!ef.trigger) return { on: false, label: null };
    const reasons = Array.isArray(ef.reasons) ? ef.reasons.filter(Boolean) : [];
    return { on: true, label: reasons.length ? `fatigue (${reasons.join(", ")})` : "fatigue (schedule/rest)" };
  }

  function steamOnForSide(g, abbr) {
    const es = edgePackForSide(g, abbr).steam || {};
    if (!es.trigger) return { on: false, label: null, rd: es.rd_per_game };
    const rd = es.rd_per_game;
    const rdTxt = rd != null && Number.isFinite(+rd) ? ` RD/G ${(+rd).toFixed(2)}` : "";
    return {
      on: true,
      rd,
      label: `steam interim${rdTxt} (snapshot; not rolling)`,
    };
  }

  function chartSideOf(g, abbr, side) {
    const c = g.chart || {};
    if (c.awaiting || !c.screen) return null;
    const direct = c[side];
    if (direct && typeof direct === "object" && direct.abbr) return direct;
    for (const sk of ["away", "home"]) {
      const s = c[sk];
      if (s && typeof s === "object" && normAbbr(s.abbr) === normAbbr(abbr)) return s;
    }
    return null;
  }

  function chartLrOrDeficit(g, abbr, side) {
    const s = chartSideOf(g, abbr, side);
    if (!s) return { on: false, available: !!(g.chart && !g.chart.awaiting && g.chart.screen), label: null };
    const q = s.quadrant || "";
    const rd = s.rd_per_game;
    const lr = q === "LR";
    const deficit = rd != null && Number.isFinite(+rd) && +rd < 0;
    if (!lr && !deficit) return { on: false, available: true, label: null };
    const bits = [];
    if (lr) bits.push("LR");
    if (deficit) bits.push(`RD deficit ${(+rd).toFixed(2)}`);
    return { on: true, available: true, label: `chart ${bits.join(" · ")}` };
  }

  function dkRoles(g) {
    const favAbbr = g.fav_abbr ? normAbbr(g.fav_abbr) : null;
    const dogAbbr = g.dog_abbr ? normAbbr(g.dog_abbr) : null;
    let homeIsFav = null;
    const h = parseAmerican(g.dk_ml_home);
    const a = parseAmerican(g.dk_ml_away);
    if (h != null && a != null) {
      if (h < a) homeIsFav = true;
      else if (a < h) homeIsFav = false;
      else homeIsFav = null; // pick'em
    }
    return { favAbbr, dogAbbr, homeIsFav };
  }

  function sideQualities(g, side) {
    const abbr = side === "home" ? g.home_abbr : g.away_abbr;
    const roles = dkRoles(g);
    const n = normAbbr(abbr);
    let isFav = false;
    let isDog = false;
    if (roles.favAbbr && roles.favAbbr === n) isFav = true;
    if (roles.dogAbbr && roles.dogAbbr === n) isDog = true;
    if (!isFav && !isDog && roles.homeIsFav != null) {
      isFav = side === "home" ? roles.homeIsFav : !roles.homeIsFav;
      isDog = !isFav;
    }
    // pick'em: neither strictly fav/dog unless fav_abbr set
    const inj = injuryTierForSide(g, abbr, side);
    const fat = fatigueOnForSide(g, abbr);
    const steam = steamOnForSide(g, abbr);
    const chart = chartLrOrDeficit(g, abbr, side);
    const t = teamByAbbr(abbr);
    const playoffTag = t?.playoff_tag || "";
    return {
      side,
      abbr,
      isAway: side === "away",
      isHome: side === "home",
      isFav,
      isDog,
      injury: inj,
      fatigue: fat,
      steam,
      chart,
      playoffTag,
    };
  }

  function bluffHitFiltersActive() {
    // Need at least one hit quality — bare DK-fav alone is not a bluff scan
    return !!(
      state.bluffInjHeavy || state.bluffInjAny ||
      state.bluffFatigue || state.bluffSteam || state.bluffChartLr ||
      state.bluffClinched || state.bluffMustChase || state.bluffDeadMoney
    );
  }
  function bluffFiltersActive() {
    return bluffHitFiltersActive();
  }

  /** Selected qualities must all match this side. Mode gates fav vs dog pricing. */
  function sideMatchesBluffFilters(q) {
    const mode = state.bluffMode === "dog" ? "dog" : "bluff";
    // Mode lock: bluff = DK still ML-fav; dog mode = qualities on dog
    if (mode === "bluff" && !q.isFav) return false;
    if (mode === "dog" && !q.isDog) return false;

    const roleChecked = state.bluffAway || state.bluffHome;
    if (roleChecked) {
      const ok = (state.bluffAway && q.isAway) || (state.bluffHome && q.isHome);
      if (!ok) return false;
    }
    const priceChecked = state.bluffDkFav || state.bluffDkDog;
    if (priceChecked) {
      const ok = (state.bluffDkFav && q.isFav) || (state.bluffDkDog && q.isDog);
      if (!ok) return false;
    }
    if (state.bluffInjHeavy && q.injury.tier !== "heavy") return false;
    if (state.bluffInjAny && !q.injury.anyHit) return false;
    if (state.bluffFatigue && !q.fatigue.on) return false;
    if (state.bluffSteam && !q.steam.on) return false;
    if (state.bluffChartLr && !q.chart.on) return false;
    const poffChecked = state.bluffClinched || state.bluffMustChase || state.bluffDeadMoney;
    if (poffChecked) {
      const tag = q.playoffTag || "";
      const ok =
        (state.bluffClinched && tag === "clinched") ||
        (state.bluffMustChase && tag === "must_chase") ||
        (state.bluffDeadMoney && tag === "dead_money");
      if (!ok) return false;
    }
    return true;
  }

  function playoffTagLabel(tag) {
    if (tag === "clinched") return "clinched";
    if (tag === "must_chase") return "must-chase";
    if (tag === "dead_money") return "dead money";
    return null;
  }

  function firedQualityLabels(q) {
    const out = [];
    out.push(q.isAway ? "away" : "home");
    out.push(q.isFav ? "DK fav" : (q.isDog ? "DK dog" : "DK even"));
    const poff = playoffTagLabel(q.playoffTag);
    if (poff) out.push(poff);
    if (q.injury.anyHit) out.push(q.injury.label);
    if (q.fatigue.on) out.push(q.fatigue.label);
    if (q.steam.on) out.push(q.steam.label);
    if (q.chart.on) out.push(q.chart.label);
    return out;
  }

  function bluffOneLiner(q) {
    const hits = [];
    const poff = playoffTagLabel(q.playoffTag);
    if (poff) hits.push(poff);
    if (q.injury.anyHit) hits.push(q.injury.tier === "heavy" ? "injury heavy" : "injury hit");
    if (q.fatigue.on) hits.push("fatigue");
    if (q.steam.on) hits.push("steam");
    if (q.chart.on) hits.push("chart LR/deficit");
    const hitTxt = hits.length ? hits.join(" + ") : "selected role";
    if (q.isFav) return `DK still fav despite ${hitTxt} — fade-candidate (not a lock)`;
    return `DK dog with ${hitTxt} — quality match (not a lock)`;
  }

  /** Desk tint for candidate row: Miles kill/stand_down → gray; overall from tree. */
  function bluffDeskTint(enriched) {
    if (!enriched) return { tint: "gray", label: "pass" };
    if (enriched.conflict || enriched.overall?.branch === "chart_nb_conflict") {
      return { tint: "gray", label: "no-side · Chart≠NB" };
    }
    const miles = enriched.miles || {};
    const st = miles.status || "stand_down";
    if (st === "kill" || st === "stand_down") {
      return { tint: "gray", label: st === "kill" ? "pass · Miles kill" : "pass · Miles stand_down" };
    }
    const t = enriched.overall?.tint || "gray";
    const lab = t === "green" ? "green" : t === "amber" ? "watch" : "pass";
    return { tint: t, label: lab };
  }

  function newbotClearsForSize(enriched) {
    // Kane: Chart UL ≠ New Bot conflict → 0 units
    if (enriched?.conflict || enriched?.overall?.branch === "chart_nb_conflict") return false;
    const n = enriched?.newbot;
    if (!n || !n.present) return false;
    // Kane: New Bot edge must clear before any size — treat watch/clear-ish with edge as cleared; kill/none = no
    const st = (n.status || "").toLowerCase();
    if (st === "kill" || st === "pass" || st === "none") return false;
    if (Array.isArray(n.kill) && n.kill.filter(Boolean).length) return false;
    if (n.kill && !Array.isArray(n.kill) && String(n.kill).trim()) return false;
    // edge_pts present and positive, or status watch
    if (n.edge_pts != null && Number(n.edge_pts) > 0) return true;
    return st === "watch" || st === "clear" || st === "play";
  }

  function collectBluffMatches(enrichedRows) {
    const out = [];
    if (!bluffFiltersActive()) return out;
    for (const r of enrichedRows) {
      const g = r.g;
      for (const side of ["away", "home"]) {
        const q = sideQualities(g, side);
        if (!sideMatchesBluffFilters(q)) continue;
        const desk = bluffDeskTint(r);
        const nbOk = newbotClearsForSize(r);
        out.push({
          g,
          q,
          enriched: r,
          desk,
          nbOk,
          quals: firedQualityLabels(q),
          line: bluffOneLiner(q),
        });
      }
    }
    return out;
  }

  function chartFeedOffered() {
    const games = state.data?.slate?.games || [];
    return games.some((g) => g.chart && !g.chart.awaiting && g.chart.screen);
  }

  function renderBluffScan(enrichedRows) {
    const host = document.getElementById("bluff-results");
    const wrap = document.getElementById("bluff-scan");
    const chartWrap = document.getElementById("bluff-chart-wrap");
    if (!host || !wrap) return;
    const offered = chartFeedOffered();
    if (chartWrap) chartWrap.style.display = offered ? "" : "none";
    if (!offered && state.bluffChartLr) state.bluffChartLr = false;

    if (!bluffFiltersActive()) {
      host.innerHTML = '<div class="bluff-results-empty">Select at least one hit (clinched / injury / fatigue / steam / chart) — Bluff lists sides DK still prices as ML fav despite those hits. Fade-candidates only (Kane: smaller size); Miles kill/stand_down stays gray; New Bot edge must clear before any size. Not auto-bet.</div>';
      return;
    }
    const matches = collectBluffMatches(enrichedRows);
    if (!matches.length) {
      const mode = state.bluffMode === "dog" ? "dog" : "fav";
      host.innerHTML = `<div class="bluff-results-empty">No ${mode} sides on this slate match the selected qualities. Honest zero — not a missing feed.</div>`;
      return;
    }
    const modeLab = state.bluffMode === "dog" ? "dog quality matches" : "bluff fade-candidates";
    host.innerHTML = `<div class="bluff-results-count">${matches.length} ${modeLab}</div>` + matches.map((m) => {
      const g = m.g;
      const q = m.q;
      const ml = `ML ${g.away_abbr} ${g.dk_ml_away || "—"} / ${g.home_abbr} ${g.dk_ml_home || "—"}`;
      const sizeNote = m.nbOk
        ? (m.desk.tint === "gray" ? " · Kane: NB edge ok but Miles gray — no size" : " · Kane: NB edge clear · fade size smaller")
        : " · Kane: New Bot edge not clear — no size yet";
      const qHtml = m.quals.map((lab) => {
        const hit = /injury|fatigue|steam|chart|clinched|must-chase|dead money/i.test(lab);
        return `<span class="q${hit ? " hit" : ""}">${escapeHtml(lab)}</span>`;
      }).join("");
      return `<div class="bluff-row tint-${m.desk.tint}">
        <div class="bluff-row-top">
          <span class="match">${escapeHtml(g.name)}</span>
          <span class="side-pill">${escapeHtml(normAbbr(q.abbr))} ${q.isFav ? "fav" : "dog"}</span>
          <span class="odds">${escapeHtml(ml)}</span>
          <span class="desk-pill ${m.desk.tint}" title="Desk tree tint">${escapeHtml(m.desk.label)}</span>
        </div>
        <div class="bluff-quals">${qHtml}</div>
        <div class="bluff-line">${escapeHtml(m.line)}${escapeHtml(sizeNote)}</div>
      </div>`;
    }).join("");
  }


    function enrichBetGame(g) {
    const trends = computeTrendsLean(g);
    const miles = milesOf(g);
    const chart = chartOf(g);
    const newbot = newbotOf(g);
    let overall = overallVisual(trends, miles);
    const conflict = chartNbConflict(g, chart, newbot);
    // Kane: Chart UL ≠ New Bot lean → gray no-side, 0 units — never invent green
    if (conflict) {
      overall = {
        tint: "gray",
        label: "no-side",
        why: conflict.why,
        branch: conflict.branch,
        conflict: true,
        kaneUnits: 0,
      };
    }
    return { g, trends, miles, overall, chart, newbot, conflict };
  }

  function renderBetBoard() {
    const host = document.getElementById("bet-grid");
    const singles = document.getElementById("singles-strip");
    const dateEl = document.getElementById("bet-date");
    if (!host) return;
    const slate = state.data.slate;
    if (!slate?.games?.length) {
      host.innerHTML = '<div class="empty">No slate loaded.</div>';
      if (singles) singles.innerHTML = "";
      const br = document.getElementById("bluff-results");
      if (br) br.innerHTML = '<div class="bluff-results-empty">No slate loaded.</div>';
      return;
    }
    if (dateEl) dateEl.textContent = slate.date || "";
    const rows = (filteredSlateGames()).map(enrichBetGame);
    try { renderBluffScan(rows); } catch (err) { console.warn("bluff scan", err); }
    // Singles: green then amber
    const consider = rows.filter((r) => r.overall.tint === "green" || r.overall.tint === "amber");
    consider.sort((a, b) => (a.overall.tint === "green" ? 0 : 1) - (b.overall.tint === "green" ? 0 : 1));
    if (singles) {
      if (!consider.length) {
        singles.className = "singles-strip empty-singles";
        singles.innerHTML = "<h3>Singles</h3><div class=\"muted\">no green today</div>";
      } else {
        singles.className = "singles-strip";
        singles.innerHTML = `<h3>Singles</h3><div class="singles-list">${consider.map((r) => {
          const L = r.trends.lean;
          return `<div class="single-row">
            <span class="single-pill ${r.overall.tint}">${r.overall.label}</span>
            <span class="match">${escapeHtml(r.g.name)}</span>
            <span class="lean">${L ? `${L.market} ${normAbbr(L.side)}` : "—"}</span>
            <span class="why">${escapeHtml(r.overall.why)}</span>
          </div>`;
        }).join("")}</div>`;
      }
    }

    const showT = state.betLayerTrends !== false;
    const showC = state.betLayerChart !== false;
    const showN = state.betLayerNewbot !== false;
    const showM = state.betLayerMiles !== false;

    host.innerHTML = rows.map((r) => {
      const g = r.g;
      const isConflict = !!(r.conflict || (r.overall && r.overall.branch === "chart_nb_conflict"));
      const overallLabel = isConflict
        ? "no-side"
        : r.overall.tint === "green" ? "green" : r.overall.tint === "amber" ? "watch" : "pass";
      const faceConflict = isConflict
        ? `<span class="bet-face-chip gray" title="Chart UL ≠ New Bot lean — Kane 0u">conflict / no-side</span>`
        : "";
      return `<article class="bet-card overall-${r.overall.tint}${isConflict ? " bet-conflict-noside" : ""}">
        <div class="bet-card-head">
          <div>
            <div class="matchup">${escapeHtml(g.name)}</div>
            <div class="odds">${escapeHtml(dkLineHtml(g))}</div>
          </div>
          <div class="bet-card-head-right">${faceConflict}<span class="bet-overall-badge ${r.overall.tint}">${overallLabel}</span></div>
        </div>
        ${renderDecisionStrip(r)}
        ${renderLayerChipsRow(r, showT, showC, showN, showM)}
        ${renderCollapsedLayers(g, r, showT, showC, showN, showM)}
      </article>`;
    }).join("");
  }

    function renderToday() {
    const panel = $("#today-panel");
    const el = $("#today-grid");
    const slate = state.data.slate;
    if (!slate?.games?.length) {
      if (panel) panel.classList.add("hidden");
      return;
    }
    // Duplicate #today-panel only when Today tab is active (Bet board stays clean)
    if (panel) {
      if (state.tab === "today") panel.classList.remove("hidden");
      else panel.classList.add("hidden");
    }
    $("#today-date").textContent = slate.date || "latest";

    const games = filteredSlateGames();

    // Highlight games where dog matches strong TR home/away dog cell
    const strong = [];
    const others = [];
    for (const g of games) {
      const sc = g.sc || (g.dog_side === "home" ? "is_home_dog" : "is_away_dog");
      const abbr = g.dog_abbr;
      const winC = abbr ? cell(abbr, sc, "win") : null;
      const atsC = abbr ? cell(abbr, sc, "ats") : null;
      const bw = baseline(sc, "win");
      const ba = baseline(sc, "ats");
      const winEdge = winC && bw != null ? +(winC.pct - bw).toFixed(2) : null;
      const coverEdge = atsC && ba != null ? +(atsC.pct - ba).toFixed(2) : null;
      const isStrong =
        g.triple ||
        (winC && (winC.n || 0) >= state.minN && winEdge != null && winEdge >= 5) ||
        (atsC && (atsC.n || 0) >= state.minN && coverEdge != null && coverEdge >= 5) ||
        (winC && winC.pct >= 50 && (winC.n || 0) >= state.minN);
      const item = { g, sc, winC, atsC, winEdge, coverEdge, isStrong };
      (isStrong ? strong : others).push(item);
    }

    const renderCard = ({ g, sc, winC, atsC, winEdge, coverEdge, isStrong }) => {
      const trip = g.triple ? '<span class="badge triple">TRIPLE</span>' : "";
      const we =
        winEdge == null ? "" : `<span class="${winEdge >= 0 ? "edge-pos" : "edge-neg"}">${winEdge >= 0 ? "+" : ""}${winEdge}pp win</span>`;
      const ce =
        coverEdge == null ? "" : `<span class="${coverEdge >= 0 ? "edge-pos" : "edge-neg"}">${coverEdge >= 0 ? "+" : ""}${coverEdge}pp cover</span>`;
      const badges = v12Badges(g);
      return `<div class="game-card ${isStrong || g.triple ? "hit" : ""}">
        <div class="matchup"><span>${g.name}</span>${trip}</div>
        <div class="meta">
          DK ${g.away_abbr} ${g.dk_ml_away || "—"} / ${g.home_abbr} ${g.dk_ml_home || "—"}<br>
          ESPN WP ${g.away_abbr} ${g.espn_away_wp != null ? g.espn_away_wp.toFixed(1) : "—"}% · ${g.home_abbr} ${g.espn_home_wp != null ? g.espn_home_wp.toFixed(1) : "—"}%<br>
          Dog: <strong>${g.dog_abbr || "—"}</strong> (${g.dog_side || "—"}) ${g.dog_ml || ""} · sit ${sc || "—"}
        </div>
        ${badges ? `<div class="badge-row">${badges}</div>` : ""}
        <div class="tr-line">
          TR ${g.dog_abbr || ""} ${sc || ""}:<br>
          Win ${winC ? `${winC.pct}% (${winC.record}, n=${winC.n})` : "—"} ${we}<br>
          Cover ${atsC ? `${atsC.pct}% (${atsC.record}, n=${atsC.n})` : "—"} ${ce}
        </div>
        ${edgeMiniForGame(g)}
      </div>`;
    };

    if (!games.length) {
      el.innerHTML = '<div class="empty" style="grid-column:1/-1">No slate games match the V1.2 look-ahead / official screens.</div>';
    } else {
      el.innerHTML =
        (strong.length
          ? `<div style="grid-column:1/-1;color:var(--warn);font-size:0.8rem;margin-bottom:4px;">Strong / triple matches (${strong.length})</div>` +
            strong.map(renderCard).join("")
          : "") +
        (others.length
          ? `<div style="grid-column:1/-1;color:var(--muted);font-size:0.8rem;margin:8px 0 4px;">Rest of slate (${others.length})</div>` +
            others.map(renderCard).join("")
          : "");
    }
    const tabHost = $("#today-tab-grid");
    if (tabHost) tabHost.innerHTML = el.innerHTML;
  }

  function pinTeam(abbr) {
    state.pinned = abbr;
    const t = state.data.teams.find((x) => x.abbr === abbr);
    const bar = $("#detail-bar");
    if (!t) {
      bar.classList.remove("visible");
      return;
    }
    const g = slateForTeam(abbr);
    bar.classList.add("visible");
    const edge = computeEdge(t);
    $("#detail-text").innerHTML = `<strong>${t.name} (${t.abbr})</strong> · ${t.W}-${t.L} · ${streakBadge(t.STRK)} · L10 ${t.L10} · DIFF ${t.DIFF >= 0 ? "+" : ""}${t.DIFF}` +
      (g
        ? ` · Today: ${g.name} · DK ${g.home_abbr === abbr ? g.dk_ml_home : g.dk_ml_away} · ESPN ${(g.home_abbr === abbr ? g.espn_home_wp : g.espn_away_wp)?.toFixed?.(1) ?? "—"}%`
        : "") +
      `<div class="edge-copy" style="margin-top:6px">${edge.copy}</div><div class="edge-chips">${edge.chips.filter((c)=>c.pp!==0).map(chipHtml).join("")}</div>`;
    renderList();
  }

  function updateStats() {
    const rows = matchingRows();
    const teams = new Set(rows.map((r) => r.team.abbr));
    $("#stat-teams").textContent = `${teams.size} teams`;
    $("#stat-rows").textContent = `${rows.length} cells`;
    $("#stat-cat").textContent = CAT_LABEL[state.category];
    $("#stat-n").textContent = `min N ${state.minN}`;
  }

  function renderAll() {
    updateStats();
    const tab = state.tab;
    $$(".tabs button").forEach((b) => b.classList.toggle("active", b.dataset.tab === tab));
    $$(".view-panel").forEach((p) => p.classList.toggle("hidden", p.dataset.view !== tab));
    const app = document.querySelector(".app");
    if (app) {
      app.classList.toggle("bet-mode", tab === "bet");
      if (tab !== "bet") app.classList.remove("bet-advanced-open");
    }
    const hint = document.getElementById("bet-advanced-hint");
    if (hint) hint.hidden = tab !== "bet";
    if (tab === "heat") renderHeat();
    if (tab === "scatter") renderScatter();
    if (tab === "list") renderList();
    if (tab === "edge") renderEdgeBoard();
    if (tab === "today") renderToday();
    else {
      const panel = document.getElementById("today-panel");
      if (panel) panel.classList.add("hidden");
    }
    if (tab === "bet") renderBetBoard();
    else {
      try { renderBetBoard(); } catch (_) {}
    }
    if (tab === "floor" && window.DeskFloor) {
      try { window.DeskFloor.activate(); } catch (_) {}
    }
    if (app) app.classList.toggle("floor-mode", tab === "floor");
    if (tab === "edgeglass" && window.EdgeGlass) {
      try { window.EdgeGlass.activate(); } catch (_) {}
    }
    if (app) app.classList.toggle("edgeglass-mode", tab === "edgeglass");
    saveState();
  }

  function buildSituationChecks() {
    const box = $("#sit-list");
    box.innerHTML = "";
    for (const s of state.data.situations) {
      const id = "sit-" + s.sc;
      const lab = document.createElement("label");
      const priced = PRICED_SITUATIONS.has(s.sc)
        ? '<span class="priced-tag" title="Fav/dog Δs are priced into the number">priced</span>'
        : "";
      lab.innerHTML = `<input type="checkbox" id="${id}" data-sc="${s.sc}" ${state.situations.has(s.sc) ? "checked" : ""}> <span>${s.label}</span>${priced}`;
      box.appendChild(lab);
    }
    box.addEventListener("change", (e) => {
      const t = e.target;
      if (t.dataset.sc) {
        if (t.checked) {
          state.situations.add(t.dataset.sc);
          // Mirror dedupe: selecting one disables mirror
          const m = mirrorOf(t.dataset.sc);
          if (m && state.situations.has(m)) {
            state.situations.delete(m);
            const other = box.querySelector(`input[data-sc="${m}"]`);
            if (other) other.checked = false;
          }
        } else {
          state.situations.delete(t.dataset.sc);
        }
        renderAll();
      }
    });
  }

  function setSituationPreset(kind) {
    const all = state.data.situations.map((s) => s.sc);
    const groups = state.data.situation_groups || {};
    let next = [];
    if (kind === "all") next = all;
    else if (kind === "none") next = [];
    else if (kind === "dogs") next = groups.dogs || [];
    else if (kind === "favs") next = groups.favs || [];
    else if (kind === "location") next = groups.location || [];
    else if (kind === "rest") next = groups.rest || [];
    state.situations = new Set(next);
    $$("#sit-list input").forEach((inp) => {
      inp.checked = state.situations.has(inp.dataset.sc);
    });
    renderAll();
  }


  function fillYearSelects() {
    const pack = state.data.baseline_years || {};
    const years = pack.years || [];
    const opts = years.map((y) => `<option value="${y}">${y}</option>`).join("");
    const loEl = $("#year-lo");
    const hiEl = $("#year-hi");
    if (!loEl || !hiEl) return;
    loEl.innerHTML = opts;
    hiEl.innerHTML = opts;
    const { lo, hi } = yearRange();
    state.yearLo = lo;
    state.yearHi = hi;
    loEl.value = String(lo);
    hiEl.value = String(hi);
    updateYearSpanLabel();
  }

  function setYearRange(lo, hi, render) {
    if (lo > hi) { const t = lo; lo = hi; hi = t; }
    state.yearLo = lo;
    state.yearHi = hi;
    const loEl = $("#year-lo");
    const hiEl = $("#year-hi");
    if (loEl) loEl.value = String(lo);
    if (hiEl) hiEl.value = String(hi);
    updateYearSpanLabel();
    if (render !== false) renderAll();
  }

  function fillScatterSelects() {
    const opts = state.data.situations
      .map((s) => `<option value="${s.sc}">${s.label}</option>`)
      .join("");
    $("#scatter-x").innerHTML = opts;
    $("#scatter-y").innerHTML = opts;
    $("#scatter-sit").innerHTML = opts;
    $("#scatter-x").value = state.scatterX;
    $("#scatter-y").value = state.scatterY;
    $("#scatter-sit").value = state.scatterSit;
  }

  function bindControls() {
    $$(".seg button").forEach((b) => {
      b.addEventListener("click", () => {
        state.category = b.dataset.cat;
        $$(".seg button").forEach((x) => x.classList.toggle("active", x === b));
        renderAll();
      });
    });
    $$(".preset-row button").forEach((b) => {
      b.addEventListener("click", () => setSituationPreset(b.dataset.preset));
    });
    $("#min-n").addEventListener("input", (e) => {
      state.minN = +e.target.value;
      $("#min-n-val").textContent = state.minN;
      renderAll();
    });
    $("#min-pct").addEventListener("input", (e) => {
      state.minPct = +e.target.value;
      $("#min-pct-val").textContent = state.minPct;
      renderAll();
    });
    $("#vs-baseline").addEventListener("change", (e) => {
      state.vsBaseline = e.target.checked;
      renderAll();
    });
    const onYearChange = () => {
      let lo = +$("#year-lo").value;
      let hi = +$("#year-hi").value;
      setYearRange(lo, hi);
    };
    $("#year-lo").addEventListener("change", onYearChange);
    $("#year-hi").addEventListener("change", onYearChange);
    $$("[data-years]").forEach((b) => {
      b.addEventListener("click", () => {
        const pack = state.data.baseline_years || {};
        const minY = pack.min || 2007;
        const maxY = pack.max || 2026;
        const p = b.dataset.years;
        if (p === "last5") setYearRange(maxY - 4, maxY);
        else if (p === "last10") setYearRange(maxY - 9, maxY);
        else setYearRange(minY, maxY);
      });
    });
    $("#min-w-streak").addEventListener("input", (e) => {
      state.minWinStreak = +e.target.value;
      $("#min-w-val").textContent = state.minWinStreak === 0 ? "any" : state.minWinStreak;
      renderAll();
    });
    $("#min-l-streak").addEventListener("input", (e) => {
      state.minLoseStreak = +e.target.value;
      $("#min-l-val").textContent = state.minLoseStreak === 0 ? "any" : state.minLoseStreak;
      renderAll();
    });
    $("#include-w").addEventListener("change", (e) => {
      state.includeW = e.target.checked;
      renderAll();
    });
    $("#include-l").addEventListener("change", (e) => {
      state.includeL = e.target.checked;
      renderAll();
    });
    function syncL10Labels() {
      $("#min-l10-val").textContent = state.minL10Wins === 0 ? "any" : state.minL10Wins;
      $("#max-l10-val").textContent = state.maxL10Wins === 10 ? "any" : state.maxL10Wins;
    }
    $("#min-l10").addEventListener("input", (e) => {
      state.minL10Wins = +e.target.value;
      if (state.minL10Wins > state.maxL10Wins) {
        state.maxL10Wins = state.minL10Wins;
        $("#max-l10").value = state.maxL10Wins;
      }
      syncL10Labels();
      renderAll();
    });
    $("#max-l10").addEventListener("input", (e) => {
      state.maxL10Wins = +e.target.value;
      if (state.maxL10Wins < state.minL10Wins) {
        state.minL10Wins = state.maxL10Wins;
        $("#min-l10").value = state.minL10Wins;
      }
      syncL10Labels();
      renderAll();
    });
    $$("[data-l10]").forEach((b) => {
      b.addEventListener("click", () => {
        const p = b.dataset.l10;
        if (p === "any") { state.minL10Wins = 0; state.maxL10Wins = 10; }
        else if (p === "hot") { state.minL10Wins = 7; state.maxL10Wins = 10; }
        else if (p === "even") { state.minL10Wins = 4; state.maxL10Wins = 6; }
        else if (p === "cold") { state.minL10Wins = 0; state.maxL10Wins = 3; }
        $("#min-l10").value = state.minL10Wins;
        $("#max-l10").value = state.maxL10Wins;
        syncL10Labels();
        renderAll();
      });
    });
    $("#today-only").addEventListener("change", (e) => {
      state.todayOnly = e.target.checked;
      renderAll();
    });
    $("#rd-surplus-dog").addEventListener("change", (e) => {
      state.rdSurplusDog = e.target.checked;
      renderAll();
    });
    const bindToggle = (id, key) => {
      const el = $("#" + id);
      if (!el) return;
      el.addEventListener("change", (e) => {
        state[key] = e.target.checked;
        renderAll();
      });
    };
    bindToggle("poff-clinched", "poffClinched");
    bindToggle("poff-must-chase", "poffMustChase");
    bindToggle("poff-dead-money", "poffDeadMoney");
    bindToggle("confirmed-il", "confirmedIl");
    bindToggle("wx-indoor", "wxIndoor");
    bindToggle("wx-hot", "wxHot");
    bindToggle("wx-precip", "wxPrecip");
    bindToggle("starter-adj-gap", "starterAdjGap");
    bindToggle("edge-stack-on", "edgeStackOn");
    bindToggle("layer-tr", "layerTr");
    bindToggle("layer-injury", "layerInjury");
    bindToggle("layer-late", "layerLate");
    bindToggle("layer-fatigue", "layerFatigue");
    bindToggle("layer-steam", "layerSteam");
    const minEdgeEl = $("#min-edge");
    if (minEdgeEl) {
      minEdgeEl.addEventListener("input", (e) => {
        state.minEdge = +e.target.value;
        const v = $("#min-edge-val");
        if (v) v.textContent = state.minEdge <= -20 ? "any" : String(state.minEdge);
        renderAll();
      });
    }
    $("#search").addEventListener("input", (e) => {
      state.search = e.target.value;
      renderAll();
    });
    $$(".tabs button").forEach((b) => {
      b.addEventListener("click", () => {
        state.tab = b.dataset.tab;
        renderAll();
      });
    });
    $("#scatter-mode").addEventListener("change", (e) => {
      state.scatterMode = e.target.value;
      $("#scatter-sit-wrap").style.display = state.scatterMode === "win_cover" ? "" : "none";
      $("#scatter-xy-wrap").style.display = state.scatterMode === "situations" ? "" : "none";
      renderAll();
    });
    $("#scatter-x").addEventListener("change", (e) => {
      state.scatterX = e.target.value;
      renderAll();
    });
    $("#scatter-y").addEventListener("change", (e) => {
      state.scatterY = e.target.value;
      renderAll();
    });
    $("#scatter-sit").addEventListener("change", (e) => {
      state.scatterSit = e.target.value;
      renderAll();
    });
    $("#unpin").addEventListener("click", () => {
      state.pinned = null;
      $("#detail-bar").classList.remove("visible");
      renderList();
    });

    const betToggle = (id, key) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.checked = state[key] !== false;
      el.addEventListener("change", () => { state[key] = el.checked; renderBetBoard(); saveState(); });
    };
    betToggle("bet-layer-trends", "betLayerTrends");
    betToggle("bet-layer-chart", "betLayerChart");
    betToggle("bet-layer-newbot", "betLayerNewbot");
    betToggle("bet-layer-miles", "betLayerMiles");
    // Bluff scan quality filters
    const bluffToggle = (id, key) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.checked = !!state[key];
      el.addEventListener("change", () => {
        state[key] = el.checked;
        // Bluff mode defaults price gate to DK fav; dog mode to DK dog — keep checkboxes honest
        if (key === "bluffMode") return;
        renderBetBoard();
        saveState();
      });
    };
    bluffToggle("bluff-away", "bluffAway");
    bluffToggle("bluff-home", "bluffHome");
    bluffToggle("bluff-dk-fav", "bluffDkFav");
    bluffToggle("bluff-dk-dog", "bluffDkDog");
    bluffToggle("bluff-inj-heavy", "bluffInjHeavy");
    bluffToggle("bluff-inj-any", "bluffInjAny");
    bluffToggle("bluff-fatigue", "bluffFatigue");
    bluffToggle("bluff-steam", "bluffSteam");
    bluffToggle("bluff-chart-lr", "bluffChartLr");
    bluffToggle("bluff-clinched", "bluffClinched");
    bluffToggle("bluff-must-chase", "bluffMustChase");
    bluffToggle("bluff-dead-money", "bluffDeadMoney");
    const modeBluff = document.getElementById("bluff-mode-bluff");
    const modeDog = document.getElementById("bluff-mode-dog");
    const syncModeRadios = () => {
      if (modeBluff) modeBluff.checked = state.bluffMode !== "dog";
      if (modeDog) modeDog.checked = state.bluffMode === "dog";
    };
    syncModeRadios();
    const onMode = (mode) => {
      state.bluffMode = mode;
      if (mode === "bluff") {
        state.bluffDkFav = true;
        state.bluffDkDog = false;
        const f = document.getElementById("bluff-dk-fav");
        const d = document.getElementById("bluff-dk-dog");
        if (f) f.checked = true;
        if (d) d.checked = false;
      } else {
        state.bluffDkDog = true;
        state.bluffDkFav = false;
        const f = document.getElementById("bluff-dk-fav");
        const d = document.getElementById("bluff-dk-dog");
        if (f) f.checked = false;
        if (d) d.checked = true;
      }
      syncModeRadios();
      renderBetBoard();
      saveState();
    };
    if (modeBluff) modeBluff.addEventListener("change", () => { if (modeBluff.checked) onMode("bluff"); });
    if (modeDog) modeDog.addEventListener("change", () => { if (modeDog.checked) onMode("dog"); });
    const presetDkFavLr = document.getElementById("bluff-preset-dk-fav-lr");
    if (presetDkFavLr) {
      presetDkFavLr.addEventListener("click", () => {
        state.bluffMode = "bluff";
        state.bluffDkFav = true;
        state.bluffDkDog = false;
        state.bluffChartLr = true;
        syncModeRadios();
        const f = document.getElementById("bluff-dk-fav");
        const d = document.getElementById("bluff-dk-dog");
        const lr = document.getElementById("bluff-chart-lr");
        if (f) f.checked = true;
        if (d) d.checked = false;
        if (lr) lr.checked = true;
        renderBetBoard();
        saveState();
      });
    }
    const adv = document.getElementById("advanced-filters");
    if (adv) {
      adv.addEventListener("toggle", () => {
        const app = document.querySelector(".app");
        if (!app) return;
        app.classList.toggle("bet-advanced-open", adv.open);
      });
      // Keep class in sync if details was restored open
      const app0 = document.querySelector(".app");
      if (app0) app0.classList.toggle("bet-advanced-open", adv.open);
    }
  }

  function applyInitialControlValues() {
    $$(".seg button").forEach((b) => b.classList.toggle("active", b.dataset.cat === state.category));
    $("#min-n").value = state.minN;
    $("#min-n-val").textContent = state.minN;
    $("#min-pct").value = state.minPct;
    $("#min-pct-val").textContent = state.minPct;
    $("#vs-baseline").checked = state.vsBaseline;
    const loEl = $("#year-lo");
    const hiEl = $("#year-hi");
    if (loEl) loEl.value = String(state.yearLo);
    if (hiEl) hiEl.value = String(state.yearHi);
    updateYearSpanLabel();
    $("#min-w-streak").value = state.minWinStreak;
    $("#min-w-val").textContent = state.minWinStreak === 0 ? "any" : state.minWinStreak;
    $("#min-l-streak").value = state.minLoseStreak;
    $("#min-l-val").textContent = state.minLoseStreak === 0 ? "any" : state.minLoseStreak;
    $("#include-w").checked = state.includeW;
    $("#include-l").checked = state.includeL;
    $("#min-l10").value = state.minL10Wins;
    $("#max-l10").value = state.maxL10Wins;
    $("#min-l10-val").textContent = state.minL10Wins === 0 ? "any" : state.minL10Wins;
    $("#max-l10-val").textContent = state.maxL10Wins === 10 ? "any" : state.maxL10Wins;
    $("#today-only").checked = state.todayOnly;
    $("#rd-surplus-dog").checked = state.rdSurplusDog;
    const setChk = (id, v) => { const el = $("#" + id); if (el) el.checked = v; };
    setChk("poff-clinched", state.poffClinched);
    setChk("poff-must-chase", state.poffMustChase);
    setChk("poff-dead-money", state.poffDeadMoney);
    setChk("confirmed-il", state.confirmedIl);
    setChk("wx-indoor", state.wxIndoor);
    setChk("wx-hot", state.wxHot);
    setChk("wx-precip", state.wxPrecip);
    setChk("starter-adj-gap", state.starterAdjGap);
    setChk("edge-stack-on", state.edgeStackOn);
    setChk("layer-tr", state.layerTr);
    setChk("layer-injury", state.layerInjury);
    setChk("layer-late", state.layerLate);
    setChk("layer-fatigue", state.layerFatigue);
    setChk("layer-steam", state.layerSteam);
    setChk("bluff-away", state.bluffAway);
    setChk("bluff-home", state.bluffHome);
    setChk("bluff-dk-fav", state.bluffDkFav);
    setChk("bluff-dk-dog", state.bluffDkDog);
    setChk("bluff-inj-heavy", state.bluffInjHeavy);
    setChk("bluff-inj-any", state.bluffInjAny);
    setChk("bluff-fatigue", state.bluffFatigue);
    setChk("bluff-steam", state.bluffSteam);
    setChk("bluff-chart-lr", state.bluffChartLr);
    setChk("bluff-clinched", state.bluffClinched);
    setChk("bluff-must-chase", state.bluffMustChase);
    setChk("bluff-dead-money", state.bluffDeadMoney);
    const mb = document.getElementById("bluff-mode-bluff");
    const md = document.getElementById("bluff-mode-dog");
    if (mb) mb.checked = state.bluffMode !== "dog";
    if (md) md.checked = state.bluffMode === "dog";
    const minEdgeEl2 = $("#min-edge");
    if (minEdgeEl2) {
      minEdgeEl2.value = state.minEdge;
      const v = $("#min-edge-val");
      if (v) v.textContent = state.minEdge <= -20 ? "any" : String(state.minEdge);
    }
    $("#scatter-mode").value = state.scatterMode;
    $("#scatter-sit-wrap").style.display = state.scatterMode === "win_cover" ? "" : "none";
    $("#scatter-xy-wrap").style.display = state.scatterMode === "situations" ? "" : "none";
  }

  async function init() {
    loadStateFromHash();
    if (!state.situations.size) {
      try {
        const saved = localStorage.getItem("mlb-tr-explorer");
        if (saved && !location.hash) {
          const o = JSON.parse(saved);
          Object.assign(state, {
            ...o,
            situations: new Set(o.situations || []),
          });
        }
      } catch (_) {}
    }

    const res = await fetch("data.json");
    state.data = await res.json();

    if (!state.situations.size) {
      // After W/L, rest, division default OFF (recency); mirrors left to user
      state.situations = new Set(
        state.data.situations.map((s) => s.sc).filter((sc) => !DEFAULT_OFF_SITUATIONS.has(sc))
      );
    } else if (!localStorage.getItem("mlb-tr-explorer-v2-edge")) {
      // One-time migrate: drop after W/L, rest, division from prior V1.2 "all" saves
      for (const sc of [...state.situations]) {
        if (DEFAULT_OFF_SITUATIONS.has(sc)) state.situations.delete(sc);
      }
      try { localStorage.setItem("mlb-tr-explorer-v2-edge", "1"); } catch (_) {}
    }
    fillYearSelects();

    const todayEl = $("#today-only");
    const hasSlate = !!(state.data.slate?.games?.length);
    todayEl.disabled = !hasSlate;
    if (!hasSlate) {
      state.todayOnly = false;
      todayEl.checked = false;
    }
    todayEl.title = hasSlate
      ? "Only keep situations that apply to each team on today's slate (home/away, fav/dog, after win/loss, all games)."
      : "No today's slate loaded.";

    buildSituationChecks();
    fillScatterSelects();
    bindControls();
    applyInitialControlValues();

    // How-to: expanded once (first visit), then starts collapsed
    const howto = $("#bet-howto");
    if (howto) {
      try {
        if (localStorage.getItem("mlb-bet-howto-seen") === "1") howto.open = false;
      } catch (_) {}
      howto.addEventListener("toggle", () => {
        if (!howto.open) {
          try { localStorage.setItem("mlb-bet-howto-seen", "1"); } catch (_) {}
        }
      });
    }


    const slateNote = state.data.slate?.date
      ? `Slate: ${state.data.slate.date} (${state.data.slate.games.length} games)`
      : "No slate files found";
    $("#meta-line").textContent = `Generated ${state.data.generated_at} · ${state.data.meta.n_teams} teams · ${state.data.meta.n_situations} situations · ${slateNote} · V3 Bet board + V2 edge stack`;

    if (!state.data.slate?.games?.length) {
      const tb = $('.tabs button[data-tab="today"]');
      if (tb) tb.style.display = "none";
      const bb = $('.tabs button[data-tab="bet"]');
      if (bb) bb.style.display = "none";
    }

    renderAll();
  }

  document.addEventListener("DOMContentLoaded", init);
})();
