/* Edge Glass — Phase 1 Pass #1 board (self-contained). No Bet / Drift / DeskFloor / TR imports. */
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
    sportFilter: "ALL",
    dateFilter: "ALL",
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
    (slate && slate.sports || []).forEach((sp) => set.add(sp));
    return Array.from(set);
  }

  function availableDates(slate) {
    const set = new Set();
    ((slate && slate.events) || []).forEach((row) => {
      const d = row.event && row.event.date;
      if (d) set.add(d);
    });
    (slate && slate.slate_dates || []).forEach((d) => set.add(d));
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
    return events;
  }

  function panelMarkup() {
    return (
      '<div class="eg-root" id="eg-root">' +
        '<div class="panel-title eg-panel-title">' +
          '<h2>Edge Glass <span class="eg-exp-title">PRICE DIAGNOSTICS</span></h2>' +
          '<span class="hint eg-hint-top">Pass #1 board · experimental · not wired to Bet</span>' +
        '</div>' +
        '<div class="eg-banner" id="eg-banner" role="status"></div>' +
        '<div class="eg-toolbar" id="eg-toolbar">' +
          '<label class="eg-sport-filter">Sport ' +
            '<select id="eg-sport-select" aria-label="Filter by sport">' +
              '<option value="ALL">All</option>' +
              '<option value="MLB">MLB</option>' +
              '<option value="NFL">NFL</option>' +
              '<option value="NBA">NBA</option>' +
            '</select>' +
          '</label>' +
          '<label class="eg-sport-filter">Date ' +
            '<select id="eg-date-select" aria-label="Filter by date">' +
              '<option value="ALL">All</option>' +
            '</select>' +
          '</label>' +
          '<span class="eg-feed-meta" id="eg-feed-meta"></span>' +
        '</div>' +
        '<div class="eg-flash-strip" id="eg-flash-strip"></div>' +
        '<div id="eg-master-table"></div>' +
        '<div class="eg-spectrum-panel" id="eg-spectrum"></div>' +
      '</div>'
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
    if (!host.querySelector("#eg-banner")) {
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
    return p >= 0.5 ? -100 * p / (1 - p) : 100 * (1 - p) / p;
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
    const extremeDiv =
      div != null && Math.abs(Number(div)) > 12 && !row.investigation_note;

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
      fundPctLabel = val.fundamental_pct != null
        ? `${Number(val.fundamental_pct).toFixed(0)}%`
        : fmtPct(mlP, 0);
      const fair = val.fair_odds != null
        ? val.fair_odds
        : (homeFav ? val.fair_odds_home : val.fair_odds_away);
      fairMlLabel = fmtOdds(fair);

      // Value side from payload or recompute
      let vTeam = val.value_side_team;
      let div = val.divergence_pp;
      if (vTeam == null && hasDk) {
        try {
          let pAway = mkt.away_no_vig_p;
          let pHome = mkt.home_no_vig_p;
          if (pAway == null || pHome == null) {
            const d = twoSidedDevig(awayOdds, homeOdds);
            pAway = d[0];
            pHome = d[1];
          }
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
      if (vTeam && divNum != null && Math.abs(divNum) >= 0.05) {
        // Pass #1 often shows value-side team beside div when small
      }
    } else {
      mostLikelyLabel = "HOLD";
      mostLikelyKind = "hold";
      fundPctLabel = status;
      valueSideLabel = "TBD";
    }

    const story = val.story || null;
    const flash =
      !!val.flash ||
      status === "STOPPED" ||
      (divNum != null && Math.abs(divNum) >= 5);

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
      flash,
      flashReason: val.flash_reason || (status === "STOPPED" ? "STOP" : (divNum != null && Math.abs(divNum) >= 5 ? "DIVERGENCE" : null)),
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
    mount(host, { standalone: !!host.closest(".eg-standalone") || host.id === "eg-standalone-root" });
    return true;
  }

  function bindFilters() {
    const sportSel = document.getElementById("eg-sport-select");
    if (sportSel && !sportSel._egBound) {
      sportSel._egBound = true;
      sportSel.addEventListener("change", () => {
        state.sportFilter = sportSel.value || "ALL";
        render();
      });
    }
    const dateSel = document.getElementById("eg-date-select");
    if (dateSel && !dateSel._egBound) {
      dateSel._egBound = true;
      dateSel.addEventListener("change", () => {
        state.dateFilter = dateSel.value || "ALL";
        render();
      });
    }
  }

  function renderBanner() {
    const el = document.getElementById("eg-banner");
    if (!el) return;
    const s = state.slate;
    const warn =
      (s && s._warning) ||
      "PRICE DIAGNOSTICS · experimental · AN_mirror ≠ live DK until verified";
    const isLiveSi = !!(s && s._live_si) || state.feedSource === "live";
    const noPrices = boardHasMissingMarkets(s);
    const pills = [];
    pills.push('<span class="eg-pill eg-pill-warn">PRICE DIAGNOSTICS</span>');
    pills.push('<span class="eg-pill">experimental</span>');
    pills.push('<span class="eg-pill eg-pill-mirror">AN_mirror ≠ live DK until verified</span>');
    if (isLiveSi) pills.push('<span class="eg-pill eg-pill-live">live SI</span>');
    if (noPrices) pills.push('<span class="eg-pill eg-pill-warn">no prices yet</span>');
    pills.push('<span class="eg-pill">no tickets</span>');
    if (s && s.model_version) pills.push(`<span class="eg-pill">${esc(s.model_version)}</span>`);
    if (s && Array.isArray(s.slate_dates) && s.slate_dates.length) {
      pills.push(`<span class="eg-pill">slates ${esc(s.slate_dates.join(", "))}</span>`);
    }

    el.classList.toggle("eg-banner-live", isLiveSi && noPrices);
    el.innerHTML = `
      <strong>PRICE DIAGNOSTICS · experimental · AN_mirror ≠ live DK until verified</strong>
      <span>${esc(warn)}</span>
      ${pills.join("")}
    `;

    const meta = document.getElementById("eg-feed-meta");
    if (meta) {
      const n = ((s && s.events) || []).length;
      const filled = ((s && s.events) || []).filter(
        (r) => r.market && r.market.away_odds != null
      ).length;
      const src = state.feedSource || "—";
      meta.textContent = `${n} events · ${filled} w/ DK current · feed: ${src}`;
    }

    bindFilters();
    const sportSel = document.getElementById("eg-sport-select");
    if (sportSel) {
      const sports = availableSports(s);
      Array.from(sportSel.options).forEach((opt) => {
        if (opt.value === "ALL") {
          opt.disabled = false;
          return;
        }
        opt.disabled = sports.length > 0 && sports.indexOf(opt.value) === -1;
      });
      sportSel.value = state.sportFilter;
    }
    const dateSel = document.getElementById("eg-date-select");
    if (dateSel) {
      const dates = availableDates(s);
      const cur = state.dateFilter;
      dateSel.innerHTML =
        '<option value="ALL">All</option>' +
        dates.map((d) => `<option value="${esc(d)}">${esc(d)}</option>`).join("");
      dateSel.value = dates.indexOf(cur) !== -1 || cur === "ALL" ? cur : "ALL";
      if (dateSel.value !== cur) state.dateFilter = dateSel.value;
    }
  }

  function renderFlashStrip() {
    const host = document.getElementById("eg-flash-strip");
    if (!host) return;
    const views = filteredEvents().map(boardRow).filter((v) => v.flash);
    if (!views.length) {
      host.innerHTML = "";
      host.hidden = true;
      return;
    }
    host.hidden = false;
    const cards = views
      .map((v) => {
        const reason =
          v.flashReason === "STOP"
            ? "STOP"
            : v.divLabel
              ? `|div| ${esc(v.divLabel)} pp`
              : "flash";
        const sub =
          v.flashReason === "STOP" && v.story
            ? esc(v.story.replace(/^STOP ·\s*/, "").slice(0, 72))
            : v.valueSideLabel && v.valueSideLabel !== "None"
              ? `value ${esc(v.valueSideLabel)}`
              : esc(v.fundPctLabel || "");
        return `<button type="button" class="eg-flash-card${
          v.id === state.selectedId ? " selected" : ""
        }${v.flashReason === "STOP" ? " eg-flash-stop" : ""}" data-eg-id="${esc(v.id)}">
          <div class="eg-flash-matchup">${esc(v.away)} @ ${esc(v.home)}</div>
          <div class="eg-flash-reason">${esc(reason)}</div>
          <div class="eg-flash-sub">${sub}</div>
        </button>`;
      })
      .join("");
    host.innerHTML = `
      <div class="eg-flash-head">Where the Glass is flashing</div>
      <div class="eg-flash-row">${cards}</div>
    `;
    host.querySelectorAll(".eg-flash-card").forEach((btn) => {
      btn.addEventListener("click", () => {
        state.selectedId = btn.getAttribute("data-eg-id");
        render();
      });
    });
  }

  function renderTable() {
    const host = document.getElementById("eg-master-table");
    if (!host) return;
    if (state.error) {
      host.innerHTML = `<div class="eg-empty">Feed error: ${esc(state.error)}</div>`;
      return;
    }
    if (state.loading && !state.slate) {
      host.innerHTML = `<div class="eg-empty">Loading Edge Glass live / sample…</div>`;
      return;
    }
    const events = filteredEvents();
    if (!events.length) {
      const total = ((state.slate && state.slate.events) || []).length;
      const msg = total
        ? `No events for current sport/date filter.`
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
          ? `<span class="mono">${esc(fmtOdds(v.awayOdds))} / ${esc(fmtOdds(v.homeOdds))}</span>
             ${
               v.quoteLabel
                 ? `<span class="eg-badge-mirror" title="Not DK-direct until verified">${esc(
                     v.quoteLabel
                   )}</span>`
                 : ""
             }`
          : `<span class="eg-status-hold">no quote</span>`;
        const fairCell = v.fairMlLabel
          ? `<span class="mono">${esc(v.fairMlLabel)}</span>`
          : `<span class="eg-muted">—</span>`;
        const fundCell =
          v.mostLikelyKind === "ok"
            ? `<span title="experimental">${esc(v.fundPctLabel)} <span class="eg-exp">exp</span></span>`
            : `<span class="eg-status-hold" title="${esc(v.story || v.fundPctLabel || "")}">${esc(
                v.fundPctLabel || "—"
              )}</span>`;
        const divCell = v.divLabel
          ? `<span class="mono${
              v.divNum != null && Math.abs(v.divNum) >= 5 ? " eg-div-hot" : ""
            }">${esc(v.divLabel)}</span>`
          : `<span class="eg-muted">—</span>`;

        return `<tr class="eg-row${selected}${flashCls}" data-eg-id="${esc(v.id)}" tabindex="0">
          <td class="eg-game">
            <div class="eg-matchup"><span class="eg-sport-tag">${esc(v.sport)}</span> ${esc(
          v.away
        )} @ ${esc(v.home)}</div>
            <div class="eg-meta">${esc(v.start)}${v.flash ? " · flashing" : ""}</div>
          </td>
          <td><span class="${mlCls}">${esc(v.mostLikelyLabel)}</span></td>
          <td>${fundCell}</td>
          <td>${fairCell}</td>
          <td class="eg-dk">${dkCell}</td>
          <td>${esc(v.valueSideLabel || "—")}</td>
          <td>${divCell}</td>
        </tr>`;
      })
      .join("");

    host.innerHTML = `
      <div class="eg-table-wrap">
        <table class="eg-table eg-table-pass1">
          <thead>
            <tr>
              <th>Matchup</th>
              <th>Most likely</th>
              <th>Fundamental %</th>
              <th>Fair ML</th>
              <th>DK current</th>
              <th>Value side</th>
              <th>Divergence</th>
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
        renderTable();
        renderFlashStrip();
        renderSpectrum();
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
      host.innerHTML = `<div class="eg-empty">Select a game to inspect market vs fundamental spectrum.</div>`;
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

    // STOP / INSUFFICIENT: lead with story, not empty price card
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
          <span class="eg-decision ${decisionClass(gate.decision)}">${esc(gate.decision)}</span>
          <span class="eg-status-stop">${esc(status)}</span>
          <span class="eg-meta">${esc(ev.event_id || "")}</span>
        </div>
        <div class="eg-story-card ${status === "STOPPED" ? "eg-story-stop" : "eg-story-hold"}" role="status">
          <div class="eg-story-label">${status === "STOPPED" ? "STOP story" : "Status"}</div>
          <div class="eg-story-body">${esc(storyLead)}</div>
          <p class="eg-hint" style="margin:8px 0 0">No fundamental price card — SI reason leads. DK current shown only as context (${esc(
            view.quoteLabel || "no quote"
          )}).</p>
        </div>
        <div class="eg-spectrum-grid">
          <div>
            <h4>DK current (context)</h4>
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
        <span><i class="eg-swatch fund"></i> Fundamental</span>
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
            <li><span>DK current</span><b class="mono">${
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
    renderBanner();
    renderFlashStrip();
    renderTable();
    renderSpectrum();
  }

  async function loadFeed() {
    if (state.loading) return;
    state.loading = true;
    state.error = null;
    state.feedSource = null;
    renderBanner();
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
  };
})(window);
