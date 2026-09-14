/* Edge Glass — Research Desk UI (self-contained). No Bet / Drift / DeskFloor / TR imports. */
(function (global) {
  "use strict";

  const DECISIONS = new Set([
    "BUY_CANDIDATE",
    "LEAN_CANDIDATE",
    "WAIT_PRICE_DEPENDENT",
    "BAD_PRICE",
    "PASS_THE_BOARD",
    "UNVERIFIED",
  ]);

  const ICO = {
    today:
      '<svg class="eg-nav-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>',
    mlb:
      '<svg class="eg-nav-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a15 15 0 010 18M12 3a15 15 0 000 18"/></svg>',
    nfl:
      '<svg class="eg-nav-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><ellipse cx="12" cy="12" rx="9" ry="6"/><path d="M12 6v12M5 9l14 6M5 15l14-6"/></svg>',
    nba:
      '<svg class="eg-nav-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18M3 12h18"/></svg>',
    star:
      '<svg class="eg-nav-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3l2.8 5.7L21 9.8l-4.5 4.4L17.6 21 12 18.1 6.4 21l1.1-6.8L3 9.8l6.2-1.1L12 3z"/></svg>',
    book:
      '<svg class="eg-nav-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg>',
    chart:
      '<svg class="eg-nav-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19V5M10 19V9M16 19v-6M22 19V7"/></svg>',
    shield:
      '<svg class="eg-nav-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3l8 4v5c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V7l8-4z"/></svg>',
    search:
      '<svg class="eg-nav-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3-3"/></svg>',
    info:
      '<svg class="eg-banner-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 8h.01M11 12h1v5h1"/></svg>',
  };

  function detectBaseUrl() {
    try {
      const scripts = document.getElementsByTagName("script");
      for (let i = scripts.length - 1; i >= 0; i--) {
        const src = scripts[i].src || "";
        if (src.indexOf("edge_glass.js") !== -1) {
          return src.replace(/[^/]*$/, "");
        }
      }
    } catch (_) {}
    return "./";
  }

  const state = {
    loaded: false,
    loading: false,
    error: null,
    slate: null,
    selectedId: null,
    host: null,
    standalone: false,
    baseUrl: detectBaseUrl(),
    feedUrl: null,
    feedSource: null,
    sportFilter: "NFL",
    dateFilter: "ALL",
    teamQuery: "",
  };

  function sampleFeedUrl() {
    return state.baseUrl + "feeds/edge_glass_sample.json";
  }

  function liveFeedUrl() {
    return state.baseUrl + "feeds/edge_glass_live.json";
  }

  function boardHasMissingMarkets(slate) {
    const events = (slate && slate.events) || [];
    if (!events.length) return true;
    return events.every((row) => !row.market || row.market.away_odds == null);
  }

  function availableSports(slate) {
    const set = new Set();
    ((slate && slate.events) || []).forEach((row) => {
      const sp = row.event && row.event.sport;
      if (sp) set.add(sp);
    });
    ((slate && slate.sports) || []).forEach((sp) => set.add(sp));
    return Array.from(set);
  }

  function availableDates(slate) {
    const set = new Set();
    ((slate && slate.events) || []).forEach((row) => {
      const d = row.event && row.event.date;
      if (d) set.add(d);
    });
    ((slate && slate.slate_dates) || []).forEach((d) => set.add(d));
    return Array.from(set).sort();
  }

  function filteredEvents() {
    let events = (state.slate && state.slate.events) || [];
    if (state.sportFilter !== "ALL") {
      events = events.filter((row) => (row.event && row.event.sport) === state.sportFilter);
    }
    if (state.dateFilter !== "ALL") {
      events = events.filter((row) => (row.event && row.event.date) === state.dateFilter);
    }
    const q = (state.teamQuery || "").trim().toLowerCase();
    if (q) {
      events = events.filter((row) => {
        const ev = row.event || {};
        return (
          String(ev.away || "").toLowerCase().indexOf(q) !== -1 ||
          String(ev.home || "").toLowerCase().indexOf(q) !== -1 ||
          String(ev.event_id || "").toLowerCase().indexOf(q) !== -1
        );
      });
    }
    return events;
  }

  function deskTitle() {
    if (state.sportFilter === "MLB") return "MLB research desk";
    if (state.sportFilter === "NFL") return "NFL research desk";
    if (state.sportFilter === "NBA") return "NBA research desk";
    return "Research desk";
  }

  function crumbSport() {
    if (state.sportFilter === "ALL") return "Today";
    return state.sportFilter;
  }

  function archiveLabel() {
    const s = state.slate;
    const dates = availableDates(s).filter((d) => {
      if (state.sportFilter === "ALL") return true;
      return ((s && s.events) || []).some(
        (r) => r.event && r.event.date === d && r.event.sport === state.sportFilter
      );
    });
    const sport =
      state.sportFilter === "ALL" ? "MULTI" : state.sportFilter;
    if (!dates.length) return { label: `SUPPLIED ${sport} ARCHIVE`, date: "—", hint: "Report date · not game date" };
    const shown = dates.length <= 2 ? dates.join(" · ") : `${dates[0]} … ${dates[dates.length - 1]}`;
    return {
      label: `SUPPLIED ${sport} ARCHIVE`,
      date: shown,
      hint: "Report date · not game date",
    };
  }

  function panelMarkup() {
    return (
      '<div class="eg-root eg-desk" id="eg-root">' +
        '<aside class="eg-sidebar" aria-label="Edge Glass navigation">' +
          '<div class="eg-brand">' +
            '<div class="eg-brand-mark">EDGE GLASS</div>' +
            '<div class="eg-brand-sub">The Research Desk</div>' +
          "</div>" +
          '<nav class="eg-nav">' +
            '<div class="eg-nav-group">' +
              '<div class="eg-nav-label">Workspace</div>' +
              `<button type="button" class="eg-nav-item" data-eg-sport="ALL">${ICO.today}<span class="label">Today</span></button>` +
              `<button type="button" class="eg-nav-item" data-eg-sport="MLB">${ICO.mlb}<span class="label">MLB</span></button>` +
              `<button type="button" class="eg-nav-item" data-eg-sport="NFL">${ICO.nfl}<span class="label">NFL</span><span class="eg-nav-badge" id="eg-nfl-badge" hidden>Archive</span></button>` +
              `<button type="button" class="eg-nav-item is-disabled" data-eg-sport="NBA" disabled title="Coming later">${ICO.nba}<span class="label">NBA</span></button>` +
            "</div>" +
            '<div class="eg-nav-group">' +
              `<button type="button" class="eg-nav-item is-disabled" disabled>${ICO.star}<span class="label">Watchlist</span><span class="eg-nav-badge count">0</span></button>` +
              `<button type="button" class="eg-nav-item is-disabled" disabled>${ICO.book}<span class="label">Journal</span></button>` +
              `<button type="button" class="eg-nav-item is-disabled" disabled>${ICO.chart}<span class="label">Performance</span></button>` +
              `<button type="button" class="eg-nav-item is-disabled" disabled>${ICO.shield}<span class="label">Data Quality</span></button>` +
              `<button type="button" class="eg-nav-item is-disabled" disabled>${ICO.search}<span class="label">Research</span></button>` +
            "</div>" +
          "</nav>" +
          '<div class="eg-sidebar-foot">' +
            '<div class="eg-sidebar-doctrine">' +
              "<strong>PHASE 01 RESEARCH.</strong>" +
              "Build the number. Then look at the price." +
            "</div>" +
            '<div class="eg-sidebar-profile">' +
              '<div class="eg-avatar" aria-hidden="true">CG</div>' +
              "<div>" +
                '<div class="eg-profile-name">Christopher\u2019s desk</div>' +
                '<div class="eg-profile-sub">Phase 01 · research only</div>' +
              "</div>" +
            "</div>" +
          "</div>" +
        "</aside>" +
        '<main class="eg-main">' +
          '<div class="eg-topbar">' +
            '<div class="eg-crumbs">Workspace / <b id="eg-crumb-sport">Sport</b></div>' +
            '<div class="eg-top-actions">' +
              '<span class="eg-feed-status" id="eg-feed-status"><span class="eg-dot" id="eg-feed-dot"></span> <span id="eg-feed-label">Feeds…</span></span>' +
              '<button type="button" class="eg-btn" id="eg-import-btn" title="Research import is manual for now">+ Import research</button>' +
            "</div>" +
          "</div>" +
          '<div class="eg-title-row">' +
            "<div>" +
              '<div class="eg-kicker">Probability / price / perspective</div>' +
              '<h1 class="eg-title" id="eg-desk-title">Research desk</h1>' +
              '<p class="eg-subtitle">Independent estimates and market comparisons in one place. Experimental · not a validated edge.</p>' +
            "</div>" +
            '<div class="eg-archive-box" id="eg-archive-box"></div>' +
          "</div>" +
          '<div class="eg-banner" id="eg-banner" role="status"></div>' +
          '<div class="eg-metrics" id="eg-metrics"></div>' +
          '<section class="eg-section" id="eg-radar-section">' +
            '<div class="eg-section-head">' +
              '<h2 class="eg-section-title">On the radar</h2>' +
              '<span class="eg-count-pill" id="eg-radar-count">0</span>' +
              '<div class="eg-filters">' +
                '<button type="button" class="eg-chip" data-eg-chip="ALL">All sports</button>' +
                '<button type="button" class="eg-chip" data-eg-chip="MLB">MLB</button>' +
                '<button type="button" class="eg-chip" data-eg-chip="NFL">NFL</button>' +
                '<button type="button" class="eg-chip" data-eg-chip="NBA" disabled>NBA</button>' +
                '<input class="eg-search" id="eg-team-search" type="search" placeholder="Find a team" aria-label="Find a team" />' +
                '<select class="eg-date-select" id="eg-date-select" aria-label="Filter by date"><option value="ALL">All dates</option></select>' +
              "</div>" +
            "</div>" +
            '<div class="eg-radar" id="eg-radar"></div>' +
          "</section>" +
          '<section class="eg-section">' +
            '<div class="eg-section-head">' +
              '<h2 class="eg-section-title">The research board</h2>' +
              '<span class="eg-count-pill" id="eg-board-count">0</span>' +
            "</div>" +
            '<div id="eg-master-table"></div>' +
          "</section>" +
          '<div class="eg-spectrum-panel" id="eg-spectrum"></div>' +
        "</main>" +
      "</div>"
    );
  }

  function mount(host, opts) {
    opts = opts || {};
    if (!host) return null;
    state.host = host;
    state.standalone = !!opts.standalone;
    if (opts.baseUrl) {
      state.baseUrl = opts.baseUrl.endsWith("/") ? opts.baseUrl : opts.baseUrl + "/";
    }
    if (opts.feedUrl) state.feedUrl = opts.feedUrl;
    if (!host.querySelector("#eg-root")) {
      host.innerHTML = panelMarkup();
    }
    host.classList.add("eg-host");
    if (state.standalone) host.classList.add("eg-standalone");
    return host;
  }

  /* —— minimal odds helpers (from edge_glass/core/odds.py) —— */
  function americanToImplied(american) {
    const o = Number(american);
    if (!o) throw new Error("American odds cannot be 0");
    return o > 0 ? 100 / (o + 100) : Math.abs(o) / (Math.abs(o) + 100);
  }

  function decimalFromAmerican(american) {
    const o = Number(american);
    if (!o) throw new Error("American odds cannot be 0");
    return o > 0 ? 1 + o / 100 : 1 + 100 / Math.abs(o);
  }

  function twoSidedDevig(oddsA, oddsB) {
    const qa = americanToImplied(oddsA);
    const qb = americanToImplied(oddsB);
    const total = qa + qb;
    if (total <= 0) throw new Error("Implied probabilities must be positive");
    return [qa / total, qb / total];
  }

  function fairAmericanFromP(p) {
    if (!(p > 0 && p < 1)) throw new Error("Probability must be strictly between 0 and 1");
    return p >= 0.5 ? (-100 * p) / (1 - p) : (100 * (1 - p)) / p;
  }

  function divergencePp(pModel, pMarketNoVig) {
    return 100 * (pModel - pMarketNoVig);
  }

  function executableEdgePp(pModel, americanOffered) {
    return 100 * (pModel - americanToImplied(americanOffered));
  }

  function expectedValue(pModel, americanOffered) {
    return pModel * decimalFromAmerican(americanOffered) - 1;
  }

  function esc(s) {
    return String(s ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function fmtOdds(n) {
    if (n == null || Number.isNaN(Number(n))) return null;
    const v = Math.round(Number(n));
    return v > 0 ? `+${v}` : String(v);
  }

  function fmtPp(n, digits = 1) {
    if (n == null || Number.isNaN(Number(n))) return null;
    const v = Number(n);
    const sign = v > 0 ? "+" : "";
    return `${sign}${v.toFixed(digits)}`;
  }

  function fmtPct(p, digits = 1) {
    if (p == null || Number.isNaN(Number(p))) return null;
    return `${(Number(p) * 100).toFixed(digits)}%`;
  }

  function pad2(n) {
    const s = String(Math.max(0, Math.round(Number(n) || 0)));
    return s.length >= 2 ? s : s.padStart(2, "0");
  }

  function applyHardGate(row) {
    const raw = (row.value && row.value.decision) || "UNVERIFIED";
    const decision = DECISIONS.has(raw) ? raw : "UNVERIFIED";
    const stops = (row.provenance && row.provenance.stops) || [];
    const fundStatus = row.fundamental && row.fundamental.status;
    const stopFields = (row.fundamental && row.fundamental.stop_fields) || [];
    const hasStops = stops.length > 0 || stopFields.length > 0 || fundStatus === "STOPPED";

    const grades = [];
    if (row.provenance && row.provenance.overall) grades.push(row.provenance.overall);
    if (row.market && row.market.provenance && row.market.provenance.evidence_grade) {
      grades.push(row.market.provenance.evidence_grade);
    }
    ((row.provenance && row.provenance.facts) || []).forEach((f) => {
      if (f && f.evidence_grade) grades.push(f.evidence_grade);
    });
    ((row.fundamental && row.fundamental.filters) || []).forEach((f) => {
      if (f && f.active && f.evidence_grade) grades.push(f.evidence_grade);
    });
    const loadBearingCD = grades.some((g) => g === "C" || g === "D");

    const div = row.value && row.value.divergence_pp;
    const extremeDiv = div != null && Math.abs(Number(div)) > 12 && !row.investigation_note;

    const reasons = [];
    if (hasStops) reasons.push("STOP/unverified inputs");
    if (loadBearingCD) reasons.push("load-bearing C/D");
    if (extremeDiv) reasons.push("|divergence_pp|>12 without investigation note");

    const isBuyLean = decision === "BUY_CANDIDATE" || decision === "LEAN_CANDIDATE";
    if (reasons.length && isBuyLean) {
      const forced = hasStops || fundStatus === "STOPPED" ? "UNVERIFIED" : "PASS_THE_BOARD";
      return { decision: forced, gated: true, reasons, raw };
    }
    if (hasStops || fundStatus === "STOPPED") {
      return { decision: "UNVERIFIED", gated: decision !== "UNVERIFIED", reasons, raw };
    }
    return { decision, gated: false, reasons, raw };
  }

  function decisionClass(d) {
    switch (d) {
      case "BUY_CANDIDATE":
        return "eg-dec-buy";
      case "LEAN_CANDIDATE":
        return "eg-dec-lean";
      case "WAIT_PRICE_DEPENDENT":
        return "eg-dec-wait";
      case "BAD_PRICE":
        return "eg-dec-bad";
      case "PASS_THE_BOARD":
        return "eg-dec-pass";
      case "UNVERIFIED":
        return "eg-dec-unverified";
      default:
        return "";
    }
  }

  /** Status badge taxonomy for Research Desk pills. */
  function statusInfo(v) {
    if (v.status === "STOPPED" || v.flashReason === "STOP") {
      return { key: "stop", label: "STOP", cls: "eg-status-stop" };
    }
    if (v.divNum != null && Math.abs(v.divNum) >= 7.5) {
      return { key: "strong", label: "Strong disagreement", cls: "eg-status-strong" };
    }
    if (v.divNum != null && Math.abs(v.divNum) >= 5) {
      return { key: "interesting", label: "Interesting", cls: "eg-status-interesting" };
    }
    if (v.status === "INSUFFICIENT") {
      return { key: "watch", label: "Watch", cls: "eg-status-watch" };
    }
    if (v.divNum != null && Math.abs(v.divNum) >= 3) {
      return { key: "watch", label: "Watch", cls: "eg-status-watch" };
    }
    return { key: "pass", label: "Aligned", cls: "eg-status-pass" };
  }

  function statusPill(v) {
    const s = statusInfo(v);
    return `<span class="eg-status ${s.cls}">${esc(s.label)}</span>`;
  }

  /** Pass #1 row view-model — never invent odds. */
  function boardRow(row) {
    const ev = row.event || {};
    const fund = row.fundamental || {};
    const mkt = row.market || {};
    const val = row.value || {};
    const status = fund.status || "INSUFFICIENT";
    const stops = (row.provenance && row.provenance.stops) || fund.stop_fields || [];
    const awayOdds = mkt.away_odds != null ? mkt.away_odds : val.board_ml_away;
    const homeOdds = mkt.home_odds != null ? mkt.home_odds : val.board_ml_home;
    const hasDk = awayOdds != null && homeOdds != null;

    let mostLikelyLabel = null;
    let mostLikelyKind = "ok";
    let fundPctLabel = null;
    let fairMlLabel = null;
    let valueSideLabel = null;
    let divLabel = null;
    let divNum = null;
    let researchP = null;
    let marketNoVigP = null;
    let valueOdds = null;

    if (status === "STOPPED") {
      mostLikelyLabel = "STOPPED";
      mostLikelyKind = "stop";
      fundPctLabel = stops.length ? stops.join(", ") : "STOP";
      fairMlLabel = null;
      valueSideLabel = "HOLD";
      divLabel = null;
    } else if (status === "INSUFFICIENT") {
      mostLikelyLabel = "HOLD";
      mostLikelyKind = "hold";
      fundPctLabel = "Conditional";
      fairMlLabel = null;
      valueSideLabel = "TBD";
      divLabel = null;
    } else if (status === "OK" && fund.away_p != null && fund.home_p != null) {
      const homeFav = Number(fund.home_p) >= Number(fund.away_p);
      const mlTeam = homeFav ? ev.home : ev.away;
      const mlP = homeFav ? fund.home_p : fund.away_p;
      mostLikelyLabel = val.most_likely_team || mlTeam;
      fundPctLabel =
        val.fundamental_pct != null
          ? `${Number(val.fundamental_pct).toFixed(0)}%`
          : fmtPct(mlP, 0);
      const fair =
        val.fair_odds != null
          ? val.fair_odds
          : homeFav
            ? val.fair_odds_home
            : val.fair_odds_away;
      fairMlLabel = fmtOdds(fair);

      let vTeam = val.value_side_team;
      let div = val.divergence_pp;
      let pAway = mkt.away_no_vig_p;
      let pHome = mkt.home_no_vig_p;
      if (hasDk && (pAway == null || pHome == null)) {
        try {
          const d = twoSidedDevig(awayOdds, homeOdds);
          pAway = d[0];
          pHome = d[1];
        } catch (_) {}
      }
      if (vTeam == null && hasDk && pAway != null && pHome != null) {
        try {
          const eA = executableEdgePp(Number(fund.away_p), awayOdds);
          const eH = executableEdgePp(Number(fund.home_p), homeOdds);
          if (eA >= eH && eA >= 0.5) {
            vTeam = ev.away;
            div = divergencePp(Number(fund.away_p), Number(pAway));
          } else if (eH > eA && eH >= 0.5) {
            vTeam = ev.home;
            div = divergencePp(Number(fund.home_p), Number(pHome));
          } else {
            vTeam = null;
            div = homeFav
              ? divergencePp(Number(fund.home_p), Number(pHome))
              : divergencePp(Number(fund.away_p), Number(pAway));
          }
        } catch (_) {}
      }
      valueSideLabel = vTeam || "None";
      divNum = div != null ? Number(div) : null;
      divLabel = divNum != null ? fmtPp(divNum) : null;

      if (vTeam === ev.away) {
        researchP = Number(fund.away_p);
        marketNoVigP = pAway != null ? Number(pAway) : null;
        valueOdds = awayOdds;
      } else if (vTeam === ev.home) {
        researchP = Number(fund.home_p);
        marketNoVigP = pHome != null ? Number(pHome) : null;
        valueOdds = homeOdds;
      } else if (homeFav) {
        researchP = Number(fund.home_p);
        marketNoVigP = pHome != null ? Number(pHome) : null;
      } else {
        researchP = Number(fund.away_p);
        marketNoVigP = pAway != null ? Number(pAway) : null;
      }
    } else {
      mostLikelyLabel = "HOLD";
      mostLikelyKind = "hold";
      fundPctLabel = status;
      valueSideLabel = "TBD";
    }

    const story = val.story || null;
    const flash =
      !!val.flash || status === "STOPPED" || (divNum != null && Math.abs(divNum) >= 5);

    return {
      id: ev.event_id || "",
      sport: ev.sport || "",
      date: ev.date || "",
      away: ev.away || "—",
      home: ev.home || "—",
      start: ev.start_time || ev.date || "",
      status,
      mostLikelyLabel,
      mostLikelyKind,
      fundPctLabel,
      fairMlLabel,
      awayOdds,
      homeOdds,
      hasDk,
      quoteLabel: mkt.quote_source_label || val.quote_source || (hasDk ? "AN_mirror" : null),
      isDkDirect: !!(mkt.is_dk_direct || val.is_dk_direct),
      valueSideLabel,
      divLabel,
      divNum,
      researchP,
      marketNoVigP,
      valueOdds,
      flash,
      flashReason:
        val.flash_reason ||
        (status === "STOPPED"
          ? "STOP"
          : divNum != null && Math.abs(divNum) >= 5
            ? "DIVERGENCE"
            : null),
      story,
      stops,
      row,
    };
  }

  async function fetchJson(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`${url} → ${res.status}`);
    return res.json();
  }

  function findHost() {
    return (
      state.host ||
      document.getElementById("edgeglass-root") ||
      document.getElementById("edgeglass-panel") ||
      document.querySelector('[data-view="edgeglass"]') ||
      document.getElementById("eg-standalone-root")
    );
  }

  function ensureDom() {
    const host = findHost();
    if (!host) return false;
    mount(host, {
      standalone: !!host.closest(".eg-standalone") || host.id === "eg-standalone-root",
    });
    return true;
  }

  function bindChrome() {
    document.querySelectorAll("[data-eg-sport]").forEach((btn) => {
      if (btn._egBound) return;
      btn._egBound = true;
      btn.addEventListener("click", () => {
        if (btn.disabled) return;
        const sp = btn.getAttribute("data-eg-sport") || "ALL";
        state.sportFilter = sp;
        render();
      });
    });
    document.querySelectorAll("[data-eg-chip]").forEach((btn) => {
      if (btn._egBound) return;
      btn._egBound = true;
      btn.addEventListener("click", () => {
        if (btn.disabled) return;
        state.sportFilter = btn.getAttribute("data-eg-chip") || "ALL";
        render();
      });
    });
    const dateSel = document.getElementById("eg-date-select");
    if (dateSel && !dateSel._egBound) {
      dateSel._egBound = true;
      dateSel.addEventListener("change", () => {
        state.dateFilter = dateSel.value || "ALL";
        render();
      });
    }
    const search = document.getElementById("eg-team-search");
    if (search && !search._egBound) {
      search._egBound = true;
      search.addEventListener("input", () => {
        state.teamQuery = search.value || "";
        render();
      });
    }
    const importBtn = document.getElementById("eg-import-btn");
    if (importBtn && !importBtn._egBound) {
      importBtn._egBound = true;
      importBtn.addEventListener("click", () => {
        const el = document.getElementById("eg-spectrum");
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }
  }

  function renderChrome() {
    const crumb = document.getElementById("eg-crumb-sport");
    if (crumb) crumb.textContent = crumbSport();
    const title = document.getElementById("eg-desk-title");
    if (title) title.textContent = deskTitle();
    const arch = archiveLabel();
    const box = document.getElementById("eg-archive-box");
    if (box) {
      box.innerHTML = `
        <div class="eg-archive-label">${esc(arch.label)}</div>
        <div class="eg-archive-date">${esc(arch.date)}</div>
        <div class="eg-archive-hint">${esc(arch.hint)}</div>
      `;
    }

    const sports = availableSports(state.slate);
    document.querySelectorAll("[data-eg-sport]").forEach((btn) => {
      const sp = btn.getAttribute("data-eg-sport");
      btn.classList.toggle("active", sp === state.sportFilter);
      if (sp === "NBA") return;
      if (sp === "ALL") {
        btn.disabled = false;
        btn.classList.remove("is-disabled");
        return;
      }
      const has = sports.indexOf(sp) !== -1;
      btn.disabled = sports.length > 0 && !has;
      btn.classList.toggle("is-disabled", btn.disabled);
    });
    document.querySelectorAll("[data-eg-chip]").forEach((btn) => {
      const sp = btn.getAttribute("data-eg-chip");
      btn.classList.toggle("active", sp === state.sportFilter);
      if (sp === "NBA") return;
      if (sp === "ALL") {
        btn.disabled = false;
        return;
      }
      btn.disabled = sports.length > 0 && sports.indexOf(sp) === -1;
    });

    const nflBadge = document.getElementById("eg-nfl-badge");
    if (nflBadge) {
      const show =
        state.sportFilter === "NFL" ||
        ((state.slate && state.slate.events) || []).some(
          (r) => r.event && r.event.sport === "NFL"
        );
      nflBadge.hidden = !show;
    }

    const dateSel = document.getElementById("eg-date-select");
    if (dateSel) {
      const dates = availableDates(state.slate);
      const cur = state.dateFilter;
      dateSel.innerHTML =
        '<option value="ALL">All dates</option>' +
        dates.map((d) => `<option value="${esc(d)}">${esc(d)}</option>`).join("");
      dateSel.value = dates.indexOf(cur) !== -1 || cur === "ALL" ? cur : "ALL";
      if (dateSel.value !== cur) state.dateFilter = dateSel.value;
    }

    const search = document.getElementById("eg-team-search");
    if (search && search.value !== state.teamQuery) search.value = state.teamQuery;

    const s = state.slate;
    const filled = ((s && s.events) || []).filter(
      (r) => r.market && r.market.away_odds != null
    ).length;
    const verified = ((s && s.events) || []).filter(
      (r) => r.market && (r.market.is_dk_direct || (r.value && r.value.is_dk_direct))
    ).length;
    const label = document.getElementById("eg-feed-label");
    const dot = document.getElementById("eg-feed-dot");
    if (label) {
      if (state.loading) label.textContent = "Loading feeds…";
      else if (state.error) label.textContent = "Feed error";
      else if (state.feedSource === "live") {
        label.textContent =
          verified > 0 ? `Feeds live · ${verified} verified` : "Feeds connected · AN_mirror";
      } else if (state.feedSource === "sample") label.textContent = "Sample feed";
      else label.textContent = "Feeds not connected";
    }
    if (dot) {
      const ok = state.feedSource === "live" || state.feedSource === "sample";
      dot.classList.toggle("ok", ok && !state.error);
    }

    bindChrome();
  }

  function renderBanner() {
    const el = document.getElementById("eg-banner");
    if (!el) return;
    const s = state.slate;
    const warn =
      (s && s._warning) ||
      "Experimental model — wagering action disabled. Archived / unverified research until DK-direct quotes are verified.";
    el.innerHTML = `
      ${ICO.info}
      <strong>Experimental model — wagering action disabled.</strong>
      <span>${esc(warn)}</span>
      <a href="#eg-spectrum" id="eg-data-status-link">View data status →</a>
    `;
  }

  function renderMetrics() {
    const host = document.getElementById("eg-metrics");
    if (!host) return;
    const views = filteredEvents().map(boardRow);
    const n = views.length;
    const worth = views.filter(
      (v) => v.divNum != null && Math.abs(v.divNum) >= 5
    ).length;
    const verified = views.filter((v) => v.isDkDirect).length;
    host.innerHTML = `
      <div class="eg-metric">
        <div class="eg-metric-label">Research games</div>
        <div class="eg-metric-value">${esc(pad2(n))}</div>
        <div class="eg-metric-foot">Games on this desk filter</div>
      </div>
      <div class="eg-metric">
        <div class="eg-metric-label">Worth investigating</div>
        <div class="eg-metric-value green">${esc(pad2(worth))} <span class="eg-pill-mini">≥5 pp</span></div>
        <div class="eg-metric-foot">Disagreement, not a recommendation</div>
      </div>
      <div class="eg-metric">
        <div class="eg-metric-label">Verified live quotes</div>
        <div class="eg-metric-value">${esc(pad2(verified))} / ${esc(pad2(n))}</div>
        <div class="eg-metric-foot">${
          verified ? "DK-direct verified" : "AN_mirror · not DK-direct yet"
        }</div>
      </div>
      <div class="eg-metric">
        <div class="eg-metric-label">Execution status</div>
        <div class="eg-metric-value sm">Research only</div>
        <div class="eg-metric-foot">No tickets · no Kelly · Phase 01</div>
      </div>
    `;
  }

  function miniSpectrum(v) {
    if (v.researchP == null || v.marketNoVigP == null) {
      return `<div class="eg-mini-spectrum"><div class="eg-mini-track"></div><div class="eg-mini-scale"><span>0%</span><span>50%</span><span>100%</span></div></div>
        <div class="eg-mini-legend"><span class="eg-muted">Spectrum pending (no model/market pair)</span></div>`;
    }
    const r = Math.max(0, Math.min(100, Number(v.researchP) * 100));
    const m = Math.max(0, Math.min(100, Number(v.marketNoVigP) * 100));
    return `
      <div class="eg-mini-spectrum" aria-hidden="true">
        <div class="eg-mini-track"></div>
        <div class="eg-mini-diamond" style="left:${m}%" title="Market no-vig ${esc(
          fmtPct(v.marketNoVigP)
        )}"></div>
        <div class="eg-mini-dot" style="left:${r}%" title="Research ${esc(fmtPct(v.researchP))}"></div>
        <div class="eg-mini-scale"><span>0%</span><span>50%</span><span>100%</span></div>
      </div>
      <div class="eg-mini-legend">
        <span><i class="dot"></i>Research ${esc(fmtPct(v.researchP, 1))}</span>
        <span><i class="dia"></i>Market ${esc(fmtPct(v.marketNoVigP, 1))}</span>
      </div>`;
  }

  function renderRadar() {
    const host = document.getElementById("eg-radar");
    const countEl = document.getElementById("eg-radar-count");
    if (!host) return;
    const views = filteredEvents()
      .map(boardRow)
      .filter(
        (v) =>
          v.status === "STOPPED" ||
          v.flashReason === "STOP" ||
          (v.divNum != null && Math.abs(v.divNum) >= 5)
      )
      .sort((a, b) => {
        if (a.status === "STOPPED" && b.status !== "STOPPED") return -1;
        if (b.status === "STOPPED" && a.status !== "STOPPED") return 1;
        return Math.abs(b.divNum || 0) - Math.abs(a.divNum || 0);
      });
    if (countEl) countEl.textContent = String(views.length);
    if (!views.length) {
      host.innerHTML =
        '<div class="eg-radar-empty">Nothing on the radar for this filter — no ≥5 pp divergences or STOP stories.</div>';
      return;
    }
    host.innerHTML = views
      .map((v) => {
        const isStop = v.status === "STOPPED" || v.flashReason === "STOP";
        const headline = isStop
          ? "STOP"
          : v.divLabel
            ? `${esc(v.divLabel)} pp`
            : "—";
        const sub = isStop
          ? esc((v.story || "STOP story").replace(/^STOP ·\s*/, "").slice(0, 90))
          : "model–market divergence";
        const focusTeam =
          v.valueSideLabel && v.valueSideLabel !== "None" && v.valueSideLabel !== "HOLD" && v.valueSideLabel !== "TBD"
            ? v.valueSideLabel
            : v.home;
        const dk =
          v.valueOdds != null
            ? `DK ${esc(fmtOdds(v.valueOdds))}`
            : v.hasDk
              ? `DK ${esc(fmtOdds(v.awayOdds))} / ${esc(fmtOdds(v.homeOdds))}`
              : "no quote";
        return `<button type="button" class="eg-radar-card${
          v.id === state.selectedId ? " selected" : ""
        }${isStop ? " is-stop" : ""}" data-eg-id="${esc(v.id)}">
          <div class="eg-radar-top">
            <div>
              <div class="eg-radar-team">${esc(focusTeam)}</div>
              <div class="eg-radar-meta">${esc(v.away)} @ ${esc(v.home)}</div>
            </div>
            <span class="eg-radar-tag">${esc(v.sport)}${isStop ? " · STOP" : " · ARCHIVED"}</span>
          </div>
          <div class="eg-radar-div${isStop ? " stop" : ""}">${headline}</div>
          <div class="eg-radar-div-label">${sub}</div>
          ${isStop ? "" : miniSpectrum(v)}
          <div class="eg-radar-foot">
            ${statusPill(v)}
            <span class="eg-dk-price">${dk}</span>
          </div>
        </button>`;
      })
      .join("");
    host.querySelectorAll(".eg-radar-card").forEach((btn) => {
      btn.addEventListener("click", () => {
        state.selectedId = btn.getAttribute("data-eg-id");
        render();
        const spec = document.getElementById("eg-spectrum");
        if (spec) spec.scrollIntoView({ behavior: "smooth", block: "nearest" });
      });
    });
  }

  function renderTable() {
    const host = document.getElementById("eg-master-table");
    const countEl = document.getElementById("eg-board-count");
    if (!host) return;
    if (state.error) {
      host.innerHTML = `<div class="eg-empty">Feed error: ${esc(state.error)}</div>`;
      if (countEl) countEl.textContent = "0";
      return;
    }
    if (state.loading && !state.slate) {
      host.innerHTML = `<div class="eg-empty">Loading Edge Glass live / sample…</div>`;
      return;
    }
    const events = filteredEvents();
    if (countEl) countEl.textContent = String(events.length);
    if (!events.length) {
      const total = ((state.slate && state.slate.events) || []).length;
      const msg = total
        ? "No events for current sport/date/team filter."
        : state.feedSource === "live"
          ? "Live SI board empty — waiting for feeds."
          : "No events in sample feed.";
      host.innerHTML = `<div class="eg-empty">${msg}</div>`;
      return;
    }

    const rows = events
      .map((row) => {
        const v = boardRow(row);
        const selected = v.id === state.selectedId ? " selected" : "";
        const flashCls = v.flash ? " eg-row-flash" : "";
        const mlCls =
          v.mostLikelyKind === "stop"
            ? "eg-status-stop"
            : v.mostLikelyKind === "hold"
              ? "eg-status-hold"
              : "";
        const dkCell = v.hasDk
          ? `<span class="mono">${esc(fmtOdds(v.awayOdds))} / ${esc(fmtOdds(v.homeOdds))}</span>${
              v.quoteLabel
                ? `<span class="eg-badge-mirror" title="Not DK-direct until verified">${esc(
                    v.quoteLabel
                  )}</span>`
                : ""
            }`
          : `<span class="eg-status-hold">no quote</span>`;
        const fundCell =
          v.mostLikelyKind === "ok"
            ? `<span title="experimental">${esc(v.fundPctLabel)} <span class="eg-exp">exp</span></span>`
            : `<span class="eg-status-hold" title="${esc(v.story || v.fundPctLabel || "")}">${esc(
                v.fundPctLabel || "—"
              )}</span>`;
        const divCell = v.divLabel
          ? `<span class="mono${
              v.divNum != null && Math.abs(v.divNum) >= 5 ? " eg-div-hot" : ""
            }">${esc(v.divLabel)} pp</span>`
          : `<span class="eg-muted">—</span>`;
        const valueCell =
          v.valueSideLabel &&
          v.valueSideLabel !== "None" &&
          v.valueSideLabel !== "HOLD" &&
          v.valueSideLabel !== "TBD"
            ? `<span class="eg-value-side">${esc(v.valueSideLabel)}</span>`
            : `<span class="eg-muted">${esc(v.valueSideLabel || "—")}</span>`;

        return `<tr class="eg-row${selected}${flashCls}" data-eg-id="${esc(v.id)}" tabindex="0">
          <td class="eg-game">
            <div class="eg-matchup"><span class="eg-sport-tag">${esc(v.sport)}</span>${esc(
              v.away
            )} @ ${esc(v.home)}</div>
            <div class="eg-meta">${esc(v.date || v.start)}</div>
          </td>
          <td><span class="${mlCls}">${esc(v.mostLikelyLabel)}</span></td>
          <td>${fundCell}</td>
          <td>${valueCell}</td>
          <td class="eg-dk">${dkCell}</td>
          <td>${divCell}</td>
          <td>${statusPill(v)}</td>
        </tr>`;
      })
      .join("");

    host.innerHTML = `
      <div class="eg-table-wrap">
        <table class="eg-table eg-table-pass1">
          <thead>
            <tr>
              <th>Matchup</th>
              <th>Most likely winner</th>
              <th>Win estimate</th>
              <th>Relative value side</th>
              <th>DK archive</th>
              <th>Divergence</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
      <p class="eg-hint">Divergence = fundamental − de-vigged DK (value side). AN_mirror quotes are display-only. Click a row for detail. No tickets.</p>
    `;

    host.querySelectorAll(".eg-row").forEach((tr) => {
      tr.addEventListener("click", () => {
        state.selectedId = tr.getAttribute("data-eg-id");
        render();
      });
      tr.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          tr.click();
        }
      });
    });
  }

  function selectedRow() {
    const events = (state.slate && state.slate.events) || [];
    if (!state.selectedId) return null;
    return events.find((r) => r.event && r.event.event_id === state.selectedId) || null;
  }

  function renderSpectrum() {
    const host = document.getElementById("eg-spectrum");
    if (!host) return;
    const row = selectedRow();
    if (!row) {
      host.innerHTML = `<div class="eg-empty">Select a game to inspect market vs research spectrum.</div>`;
      return;
    }
    const ev = row.event || {};
    const fund = row.fundamental || {};
    const mkt = row.market || {};
    const val = row.value || {};
    const gate = applyHardGate(row);
    const view = boardRow(row);
    const filters = (fund.filters || []).filter((f) => f && f.active);
    const status = fund.status || "";

    if (status === "STOPPED" || status === "INSUFFICIENT") {
      const facts = ((row.provenance && row.provenance.facts) || [])
        .map((f) => {
          const raw = (f && f.raw_value) || "";
          const fn = (f && f.field_name) || "";
          if (!raw) return "";
          return `<li><code>${esc(fn)}</code> ${esc(raw)}</li>`;
        })
        .filter(Boolean)
        .join("");
      const storyLead =
        view.story ||
        (status === "STOPPED"
          ? `STOP · ${(view.stops || []).join(", ") || "unverified inputs"}`
          : "INSUFFICIENT · fundamentals not ready");
      host.innerHTML = `
        <div class="eg-spectrum-head">
          <h3>${esc(ev.away)} @ ${esc(ev.home)}</h3>
          ${statusPill(view)}
          <span class="eg-decision ${decisionClass(gate.decision)}">${esc(gate.decision)}</span>
          <span class="eg-meta">${esc(ev.event_id || "")}</span>
        </div>
        <div class="eg-story-card ${status === "STOPPED" ? "eg-story-stop" : "eg-story-hold"}" role="status">
          <div class="eg-story-label">${status === "STOPPED" ? "STOP story" : "Status"}</div>
          <div class="eg-story-body">${esc(storyLead)}</div>
          <p class="eg-hint" style="margin:8px 0 0">No fundamental price card — SI reason leads. DK archive shown only as context (${esc(
            view.quoteLabel || "no quote"
          )}).</p>
        </div>
        <div class="eg-spectrum-grid">
          <div>
            <h4>DK archive (context)</h4>
            <ul class="eg-kv">
              <li><span>Board</span><b class="mono">${
                view.hasDk
                  ? `${esc(fmtOdds(view.awayOdds))} / ${esc(fmtOdds(view.homeOdds))}`
                  : "—"
              }</b></li>
              <li><span>Quote</span><b>${esc(view.quoteLabel || "—")} · dk_direct=${esc(
                String(!!view.isDkDirect)
              )}</b></li>
              <li><span>Fair / Div</span><b>not computed (${esc(status)})</b></li>
            </ul>
          </div>
          <div>
            <h4>SI / provenance</h4>
            <ul class="eg-kv">
              <li><span>Stops</span><b>${esc((view.stops || []).join(", ") || "none")}</b></li>
              <li><span>SI action</span><b>${esc(
                (row.provenance && row.provenance.si_action) || "—"
              )}</b></li>
              <li><span>Grade</span><b>${esc((row.provenance && row.provenance.overall) || "—")}</b></li>
              <li><span>Feed</span><b>${esc(state.feedSource || "—")} · ${esc(
                (state.slate && state.slate.model_version) || ""
              )}</b></li>
            </ul>
            ${facts ? `<ul class="eg-fact-list">${facts}</ul>` : ""}
          </div>
        </div>
      `;
      return;
    }

    const marketAway = mkt.away_no_vig_p;
    const modelAway = fund.away_p;
    const range = fund.range;
    let lo = null;
    let hi = null;
    if (Array.isArray(range) && range.length === 2 && modelAway != null) {
      if (fund.away_p != null && fund.home_p != null) {
        if (fund.away_p >= fund.home_p) {
          lo = range[0];
          hi = range[1];
        } else {
          lo = 1 - range[1];
          hi = 1 - range[0];
        }
      }
    }

    function marker(pct, cls, label, title) {
      if (pct == null || Number.isNaN(Number(pct))) return "";
      const left = Math.max(0, Math.min(100, Number(pct) * 100));
      return `<div class="eg-marker ${cls}" style="left:${left}%" title="${esc(
        title || label
      )}"><span>${esc(label)}</span></div>`;
    }

    const filterMarks = filters
      .map((f, i) => {
        const base = modelAway != null ? modelAway : 0.5;
        const nudge = (f.logit_contribution || 0) * 0.05;
        const p = Math.max(0.02, Math.min(0.98, base + nudge));
        return marker(
          p,
          "eg-mark-filter",
          f.label || f.id || `F${i}`,
          `${f.label || f.id}: z=${f.z} w=${f.w} contrib=${f.logit_contribution}`
        );
      })
      .join("");

    let band = "";
    if (lo != null && hi != null) {
      const left = Math.max(0, Math.min(100, lo * 100));
      const width = Math.max(0, Math.min(100 - left, (hi - lo) * 100));
      band = `<div class="eg-band" style="left:${left}%;width:${width}%" title="Fundamental range (experimental)"></div>`;
    }

    const gap =
      modelAway != null && marketAway != null
        ? divergencePp(modelAway, marketAway)
        : val.divergence_pp;

    const expl = row.explanation || {};
    const invalidators = (expl.invalidators || []).map((x) => `<li>${esc(x)}</li>`).join("");
    const positives = (expl.positive || []).map((x) => `<li>${esc(x)}</li>`).join("");
    const negatives = (expl.negative || []).map((x) => `<li>${esc(x)}</li>`).join("");

    host.innerHTML = `
      <div class="eg-spectrum-head">
        <h3>${esc(ev.away)} @ ${esc(ev.home)}</h3>
        ${statusPill(view)}
        <span class="eg-decision ${decisionClass(gate.decision)}">${esc(gate.decision)}</span>
        <span class="eg-exp">experimental</span>
        <span class="eg-meta">${esc(ev.event_id || "")}</span>
      </div>
      <div class="eg-spectrum-axis" aria-label="Away win probability spectrum">
        <div class="eg-axis-label left">${esc(ev.away)} away</div>
        <div class="eg-axis-track">
          ${band}
          ${marker(marketAway, "eg-mark-market", "Mkt", `Market no-vig away ${fmtPct(marketAway)}`)}
          ${marker(modelAway, "eg-mark-fund", "Fund", `Fundamental away ${fmtPct(modelAway)}`)}
          ${filterMarks}
        </div>
        <div class="eg-axis-label right">${esc(ev.home)} home</div>
      </div>
      <div class="eg-spectrum-legend">
        <span><i class="eg-swatch market"></i> Market (de-vig)</span>
        <span><i class="eg-swatch fund"></i> Research estimate</span>
        <span><i class="eg-swatch filter"></i> Active filters</span>
        <span><i class="eg-swatch band"></i> Uncertainty band</span>
        <span class="mono">gap ${esc(fmtPp(gap) || "—")} pp</span>
      </div>
      <div class="eg-spectrum-grid">
        <div>
          <h4>Pass #1 pricing</h4>
          <ul class="eg-kv">
            <li><span>Most likely</span><b>${esc(view.mostLikelyLabel)} · ${esc(
              view.fundPctLabel || "—"
            )}</b></li>
            <li><span>Fair ML</span><b class="mono">${esc(view.fairMlLabel || "—")}</b></li>
            <li><span>DK archive</span><b class="mono">${
              view.hasDk
                ? `${esc(fmtOdds(view.awayOdds))} / ${esc(fmtOdds(view.homeOdds))}`
                : "—"
            }</b>
              ${
                view.quoteLabel
                  ? `<span class="eg-badge-mirror">${esc(view.quoteLabel)}</span>`
                  : ""
              }</li>
            <li><span>Value / Div</span><b>${esc(view.valueSideLabel || "None")} · ${esc(
              view.divLabel || "—"
            )} pp</b></li>
          </ul>
        </div>
        <div>
          <h4>Flags / gates</h4>
          <ul class="eg-kv">
            <li><span>Raw decision</span><b>${esc(gate.raw)}</b></li>
            <li><span>Hard gate</span><b>${
              gate.gated ? esc(gate.reasons.join("; ")) : "clear"
            }</b></li>
            <li><span>Stops</span><b>${esc(
              ((row.provenance && row.provenance.stops) || []).join(", ") || "none"
            )}</b></li>
            <li><span>Quote</span><b>dk_direct=${esc(String(!!view.isDkDirect))}</b></li>
          </ul>
        </div>
        <div>
          <h4>Explanation</h4>
          ${positives ? `<div class="eg-tiny">+</div><ul>${positives}</ul>` : ""}
          ${negatives ? `<div class="eg-tiny">−</div><ul>${negatives}</ul>` : ""}
          ${
            invalidators
              ? `<div class="eg-tiny">invalidators</div><ul>${invalidators}</ul>`
              : "<p class='eg-muted'>No invalidators listed.</p>"
          }
        </div>
        <div>
          <h4>Filters ${filters.length ? "" : "(none active)"}</h4>
          <ul class="eg-filter-list">
            ${(fund.filters || [])
              .map(
                (f) =>
                  `<li class="${f.active ? "on" : "off"}"><code>${esc(f.id)}</code> ${esc(
                    f.label || ""
                  )}
                    · z=${esc(f.z)} w=${esc(f.w)} · ${esc(f.evidence_grade || "—")}
                    ${
                      f.unverified_reason
                        ? ` · <em>${esc(f.unverified_reason)}</em>`
                        : ""
                    }</li>`
              )
              .join("") || "<li class='eg-muted'>none</li>"}
          </ul>
        </div>
      </div>
    `;
  }

  function render() {
    renderChrome();
    renderBanner();
    renderMetrics();
    renderRadar();
    renderTable();
    renderSpectrum();
  }

  async function loadFeed() {
    if (state.loading) return;
    state.loading = true;
    state.error = null;
    state.feedSource = null;
    renderChrome();
    try {
      let data = null;
      if (state.feedUrl) {
        data = await fetchJson(state.feedUrl);
        state.feedSource =
          state.feedUrl.indexOf("edge_glass_live") !== -1 ? "live" : "override";
      } else {
        try {
          data = await fetchJson(liveFeedUrl());
          state.feedSource = "live";
        } catch (liveErr) {
          data = await fetchJson(sampleFeedUrl());
          state.feedSource = "sample";
        }
      }
      state.slate = data;
      const sports = availableSports(data);
      if (state.sportFilter !== "ALL" && sports.length && sports.indexOf(state.sportFilter) === -1) {
        state.sportFilter = sports.indexOf("NFL") !== -1 ? "NFL" : sports[0] || "ALL";
      }
      const events = filteredEvents();
      const all = (data && data.events) || [];
      if (!state.selectedId && events[0]) {
        state.selectedId = events[0].event.event_id;
      } else if (!state.selectedId && all[0]) {
        state.selectedId = all[0].event.event_id;
      }
    } catch (e) {
      state.error = e.message || String(e);
      state.slate = null;
      state.feedSource = null;
    }
    state.loading = false;
    state.loaded = true;
    render();
  }

  async function activate(opts) {
    opts = opts || {};
    if (opts.host) mount(opts.host, opts);
    else if (opts.standalone) {
      const host = document.getElementById("eg-standalone-root") || document.body;
      mount(host, Object.assign({ standalone: true }, opts));
    }
    if (!ensureDom()) return;
    if (opts.baseUrl || opts.feedUrl) {
      if (opts.baseUrl)
        state.baseUrl = opts.baseUrl.endsWith("/") ? opts.baseUrl : opts.baseUrl + "/";
      if (opts.feedUrl) state.feedUrl = opts.feedUrl;
    }
    if (!state.loaded) await loadFeed();
    else render();
  }

  async function bootStandalone(opts) {
    opts = opts || {};
    const host = document.getElementById("eg-standalone-root");
    if (!host) throw new Error("Missing #eg-standalone-root");
    await activate(Object.assign({ host: host, standalone: true }, opts));
  }

  global.EdgeGlass = {
    activate,
    bootStandalone,
    mount,
    render,
    loadFeed,
    odds: {
      americanToImplied,
      twoSidedDevig,
      fairAmericanFromP,
      divergencePp,
      executableEdgePp,
      expectedValue,
    },
    applyHardGate,
    boardRow,
    statusInfo,
  };
})(window);
