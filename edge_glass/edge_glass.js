/* Edge Glass — Phase 1 (self-contained). No Bet / Drift / DeskFloor / TR imports. */
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
    feedSource: null, // 'live' | 'sample' | null
    sportFilter: "ALL", // ALL | MLB | NFL | NBA
  };

  function sampleFeedUrl() {
    return state.baseUrl + "feeds/edge_glass_sample.json";
  }

  function liveFeedUrl() {
    return state.baseUrl + "feeds/edge_glass_live.json";
  }

  function resolveFeedUrl() {
    // Explicit override wins; otherwise prefer live then sample (handled in loadFeed).
    return state.feedUrl || liveFeedUrl();
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

  function filteredEvents() {
    const events = (state.slate && state.slate.events) || [];
    if (state.sportFilter === "ALL") return events;
    return events.filter((row) => (row.event && row.event.sport) === state.sportFilter);
  }

  function panelMarkup() {
    return (
      '<div class="eg-root" id="eg-root">' +
        '<div class="panel-title eg-panel-title">' +
          '<h2>Edge Glass <span class="eg-exp-title">PRICE DIAGNOSTICS</span></h2>' +
          '<span class="hint eg-hint-top">Live SI shells · experimental · not wired to Bet</span>' +
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
          '<span class="eg-feed-meta" id="eg-feed-meta"></span>' +
        '</div>' +
        '<div id="eg-master-table"></div>' +
        '<div class="eg-spectrum-panel" id="eg-spectrum"></div>' +
      '</div>'
    );
  }

  /** Mount Glass UI into a host element (explorer tab shell or standalone body). */
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
    if (n == null || Number.isNaN(Number(n))) return "—";
    const v = Math.round(Number(n));
    return v > 0 ? `+${v}` : String(v);
  }

  function fmtPp(n, digits = 1) {
    if (n == null || Number.isNaN(Number(n))) return "—";
    const v = Number(n);
    const sign = v > 0 ? "+" : "";
    return `${sign}${v.toFixed(digits)}`;
  }

  function fmtPct(p, digits = 1) {
    if (p == null || Number.isNaN(Number(p))) return "—";
    return `${(Number(p) * 100).toFixed(digits)}%`;
  }

  function fmtEv(n) {
    if (n == null || Number.isNaN(Number(n))) return "—";
    return Number(n).toFixed(3);
  }

  /** Hard gate: never BUY/LEAN if stops, load-bearing C/D, or |div|>12 w/o investigation note. */
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

  function marketFavorite(row) {
    const m = row.market;
    if (!m || m.away_odds == null || m.home_odds == null) return "—";
    // Lower American (more negative) = favorite
    if (Number(m.home_odds) < Number(m.away_odds)) return row.event.home;
    if (Number(m.away_odds) < Number(m.home_odds)) return row.event.away;
    return "PICK";
  }

  function modelFavorite(row) {
    const f = row.fundamental;
    if (!f || f.status === "STOPPED" || f.away_p == null || f.home_p == null) return null;
    if (f.home_p > 0.5) return { side: "HOME", team: row.event.home, p: f.home_p };
    if (f.away_p > 0.5) return { side: "AWAY", team: row.event.away, p: f.away_p };
    return null;
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


  function renderBanner() {
    const el = document.getElementById("eg-banner");
    if (!el) return;
    const s = state.slate;
    const warn = (s && s._warning) || "not real odds";
    const isExample = !!(s && s._example);
    const isLiveSi = !!(s && s._live_si) || state.feedSource === "live";
    const noPrices = boardHasMissingMarkets(s);
    const pills = [];
    if (isLiveSi) pills.push('<span class="eg-pill eg-pill-live">live SI</span>');
    if (isExample) pills.push('<span class="eg-pill">_example: true</span>');
    if (noPrices) pills.push('<span class="eg-pill eg-pill-warn">no prices yet</span>');
    pills.push('<span class="eg-pill">no stake / no Kelly</span>');
    if (s && s.model_version) pills.push(`<span class="eg-pill">${esc(s.model_version)}</span>`);
    if (s && s.slate_date) pills.push(`<span class="eg-pill">slate ${esc(s.slate_date)}</span>`);
    else if (s && Array.isArray(s.slate_dates) && s.slate_dates.length) {
      pills.push(`<span class="eg-pill">slates ${esc(s.slate_dates.join(", "))}</span>`);
    }
    if (s && s.feed_status) pills.push(`<span class="eg-pill">feed ${esc(s.feed_status)}</span>`);

    const liveLine = noPrices
      ? '<strong>Live SI / no prices yet</strong>'
      : '<strong>Experimental / not validated edge</strong>';
    const extra = noPrices
      ? '<span class="eg-banner-extra">Market odds omitted — EventPayload display only. SI C/D / stops → STOPPED/UNVERIFIED.</span>'
      : "";

    el.classList.toggle("eg-banner-live", isLiveSi && noPrices);
    el.innerHTML = `
      ${liveLine}
      <span>${esc(warn)}</span>
      ${extra}
      ${pills.join("")}
    `;

    const meta = document.getElementById("eg-feed-meta");
    if (meta) {
      const n = ((s && s.events) || []).length;
      const src = state.feedSource || (isExample ? "sample" : "—");
      meta.textContent = `${n} event${n === 1 ? "" : "s"} · feed: ${src}`;
    }

    const sel = document.getElementById("eg-sport-select");
    if (sel && !sel._egBound) {
      sel._egBound = true;
      sel.addEventListener("change", () => {
        state.sportFilter = sel.value || "ALL";
        renderTable();
        renderSpectrum();
      });
    }
    if (sel) {
      const sports = availableSports(s);
      // Keep ALL/MLB/NFL/NBA; disable absent sports except ALL
      Array.from(sel.options).forEach((opt) => {
        if (opt.value === "ALL") {
          opt.disabled = false;
          return;
        }
        opt.disabled = sports.length > 0 && sports.indexOf(opt.value) === -1;
      });
      sel.value = state.sportFilter;
    }
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
        ? `No events for sport filter ${esc(state.sportFilter)}.`
        : (state.feedSource === "live"
            ? "Live SI board empty — waiting for si_verify feeds / no prices yet."
            : "No events in sample feed.");
      host.innerHTML = `<div class="eg-empty">${msg}</div>`;
      return;
    }

    const rows = events
      .map((row) => {
        const gate = applyHardGate(row);
        const ev = row.event || {};
        const val = row.value || {};
        const mkt = row.market || {};
        const fund = row.fundamental || {};
        const mf = modelFavorite(row);
        const stops = ((row.provenance && row.provenance.stops) || []).join(", ") || "—";
        const id = ev.event_id || "";
        const selected = id === state.selectedId ? " selected" : "";
        const dqBits = [];
        if (fund.status) dqBits.push(fund.status);
        if (mkt.quote_source_label) dqBits.push(mkt.quote_source_label);
        if (row.provenance && row.provenance.si_action) dqBits.push(`SI:${row.provenance.si_action}`);
        if ((row.provenance && row.provenance.stops || []).length) dqBits.push("STOP");

        return `<tr class="eg-row${selected}" data-eg-id="${esc(id)}" tabindex="0">
          <td class="eg-game">
            <div class="eg-matchup"><span class="eg-sport-tag">${esc(ev.sport || "")}</span> ${esc(ev.away || "—")} @ ${esc(ev.home || "—")}</div>
            <div class="eg-meta">${esc(ev.start_time || ev.date || "")} · ${esc(ev.event_id || "")}${!row.market ? " · <span class='eg-pill eg-pill-warn'>no market</span>" : ""}</div>
          </td>
          <td>${esc(marketFavorite(row))}</td>
          <td>${mf ? esc(mf.team) : "<span class='eg-muted'>—</span>"}</td>
          <td title="experimental">${mf ? esc(fmtPct(mf.p)) + ' <span class="eg-exp">exp</span>' : "—"}</td>
          <td class="mono">${esc(fmtOdds(val.fair_odds_away))} / ${esc(fmtOdds(val.fair_odds_home))}</td>
          <td class="mono" title="${esc(mkt.fetched_at || "")}">${esc(fmtOdds(mkt.away_odds))} / ${esc(fmtOdds(mkt.home_odds))}</td>
          <td class="mono">${esc(fmtPct(mkt.away_no_vig_p))} / ${esc(fmtPct(mkt.home_no_vig_p))}</td>
          <td>${val.best_side ? esc(val.best_side) : "<span class='eg-muted'>PASS</span>"}</td>
          <td class="mono">${esc(fmtPp(val.divergence_pp))}</td>
          <td class="mono">${esc(fmtPp(val.executable_edge_pp))}</td>
          <td class="mono">${esc(fmtEv(val.ev))}</td>
          <td>${fund.consensus != null ? esc(fund.consensus) : "—"}</td>
          <td><span class="eg-flag">${esc(val.classification || "—")}</span></td>
          <td>
            <span class="eg-decision ${decisionClass(gate.decision)}" title="${gate.gated ? "hard-gated from " + esc(gate.raw) + ": " + esc(gate.reasons.join("; ")) : ""}">${esc(gate.decision)}</span>
            ${gate.gated ? '<span class="eg-gate-badge" title="hard gate applied">gated</span>' : ""}
          </td>
          <td class="eg-dq">${esc(dqBits.join(" · ") || "—")}<div class="eg-meta">stops: ${esc(stops)}</div></td>
          <td class="mono">${val.price_trigger != null ? esc(fmtOdds(val.price_trigger)) : "—"}</td>
        </tr>`;
      })
      .join("");

    host.innerHTML = `
      <div class="eg-table-wrap">
        <table class="eg-table">
          <thead>
            <tr>
              <th>Sport / Game</th>
              <th>Mkt fav</th>
              <th>Model fav</th>
              <th>Win p <span class="eg-exp">exp</span></th>
              <th>Fair ML A/H</th>
              <th>DK ML A/H</th>
              <th>No-vig A/H</th>
              <th>Best value</th>
              <th>Div pp</th>
              <th>Edge pp</th>
              <th>EV</th>
              <th>Consensus</th>
              <th>Flag</th>
              <th>Decision</th>
              <th>Data quality</th>
              <th>Buy-to (p_low−0.02)</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
      <p class="eg-hint">Click a row for spectrum detail. Decisions are diagnostic only — never stake advice.</p>
    `;

    host.querySelectorAll(".eg-row").forEach((tr) => {
      tr.addEventListener("click", () => {
        state.selectedId = tr.getAttribute("data-eg-id");
        renderTable();
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
    const filters = (fund.filters || []).filter((f) => f && f.active);

    // Spectrum axis: away win probability 0..1 (left = away, right = home)
    const marketAway = mkt.away_no_vig_p;
    const modelAway = fund.away_p;
    const range = fund.range; // around home or away? sample uses away-ish for AAA; treat as model-side interval on away_p when away is model fav
    let lo = null;
    let hi = null;
    if (Array.isArray(range) && range.length === 2 && modelAway != null) {
      // sample range is around away_p for event1; around home_p for event2 — use as absolute p band on the side that owns consensus
      if (fund.away_p != null && fund.home_p != null) {
        if (fund.away_p >= fund.home_p) {
          lo = range[0];
          hi = range[1];
        } else {
          // home favorite: convert home range → away = 1-p
          lo = 1 - range[1];
          hi = 1 - range[0];
        }
      }
    }

    function marker(pct, cls, label, title) {
      if (pct == null || Number.isNaN(Number(pct))) return "";
      const left = Math.max(0, Math.min(100, Number(pct) * 100));
      return `<div class="eg-marker ${cls}" style="left:${left}%" title="${esc(title || label)}"><span>${esc(label)}</span></div>`;
    }

    const filterMarks = filters
      .map((f, i) => {
        // Approximate factor nudge on away axis using logit contribution sign only (visual)
        const base = modelAway != null ? modelAway : 0.5;
        const nudge = (f.logit_contribution || 0) * 0.05;
        const p = Math.max(0.02, Math.min(0.98, base + nudge));
        return marker(
          p,
          "eg-mark-filter",
          f.label || f.id || `F${i}`,
          `${f.label || f.id}: z=${f.z} w=${f.w} contrib=${f.logit_contribution} grade=${f.evidence_grade} as_of=${f.as_of || "—"}`
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
        ${fund.experimental || true ? '<span class="eg-exp">experimental</span>' : ""}
        <span class="eg-meta">${esc(ev.event_id || "")}</span>
      </div>
      <div class="eg-spectrum-axis" aria-label="Away win probability spectrum">
        <div class="eg-axis-label left">${esc(ev.away)} away</div>
        <div class="eg-axis-track">
          ${band}
          ${marker(marketAway, "eg-mark-market", "Mkt", `Market no-vig away ${fmtPct(marketAway)}`)}
          ${marker(modelAway, "eg-mark-fund", "Fund", `Fundamental away ${fmtPct(modelAway)} (independent, before book)`)}
          ${filterMarks}
        </div>
        <div class="eg-axis-label right">${esc(ev.home)} home</div>
      </div>
      <div class="eg-spectrum-legend">
        <span><i class="eg-swatch market"></i> Market (de-vig)</span>
        <span><i class="eg-swatch fund"></i> Fundamental</span>
        <span><i class="eg-swatch filter"></i> Active filters</span>
        <span><i class="eg-swatch band"></i> Uncertainty band</span>
        <span class="mono">gap ${esc(fmtPp(gap))} pp</span>
      </div>
      <div class="eg-spectrum-grid">
        <div>
          <h4>Pricing</h4>
          <ul class="eg-kv">
            <li><span>DK</span><b class="mono">${esc(fmtOdds(mkt.away_odds))} / ${esc(fmtOdds(mkt.home_odds))}</b></li>
            <li><span>Fair</span><b class="mono">${esc(fmtOdds(val.fair_odds_away))} / ${esc(fmtOdds(val.fair_odds_home))}</b></li>
            <li><span>Edge / EV</span><b class="mono">${esc(fmtPp(val.executable_edge_pp))} pp · ${esc(fmtEv(val.ev))}</b></li>
            <li><span>Quote</span><b>${esc(mkt.quote_source_label || "—")} · dk_direct=${esc(String(!!mkt.is_dk_direct))}</b></li>
          </ul>
        </div>
        <div>
          <h4>Flags / gates</h4>
          <ul class="eg-kv">
            <li><span>Flag</span><b>${esc(val.classification || "—")}</b></li>
            <li><span>Raw decision</span><b>${esc(gate.raw)}</b></li>
            <li><span>Hard gate</span><b>${gate.gated ? esc(gate.reasons.join("; ")) : "clear"}</b></li>
            <li><span>Stops</span><b>${esc(((row.provenance && row.provenance.stops) || []).join(", ") || "none")}</b></li>
          </ul>
        </div>
        <div>
          <h4>Explanation</h4>
          ${positives ? `<div class="eg-tiny">+</div><ul>${positives}</ul>` : ""}
          ${negatives ? `<div class="eg-tiny">−</div><ul>${negatives}</ul>` : ""}
          ${invalidators ? `<div class="eg-tiny">invalidators</div><ul>${invalidators}</ul>` : "<p class='eg-muted'>No invalidators listed.</p>"}
        </div>
        <div>
          <h4>Filters ${filters.length ? "" : "(none active)"}</h4>
          <ul class="eg-filter-list">
            ${(fund.filters || [])
              .map(
                (f) =>
                  `<li class="${f.active ? "on" : "off"}"><code>${esc(f.id)}</code> ${esc(f.label || "")}
                    · z=${esc(f.z)} w=${esc(f.w)} · ${esc(f.evidence_grade || "—")}
                    ${f.unverified_reason ? ` · <em>${esc(f.unverified_reason)}</em>` : ""}</li>`
              )
              .join("") || "<li class='eg-muted'>—</li>"}
          </ul>
          ${(fund.tags || []).length ? `<div class="eg-tags">${fund.tags.map((t) => `<span class="eg-pill">${esc(t)}</span>`).join("")}</div>` : ""}
        </div>
      </div>
    `;
  }

  function render() {
    renderBanner();
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
        state.feedSource = state.feedUrl.indexOf("edge_glass_live") !== -1 ? "live" : "override";
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
      if (opts.baseUrl) state.baseUrl = opts.baseUrl.endsWith("/") ? opts.baseUrl : opts.baseUrl + "/";
      if (opts.feedUrl) state.feedUrl = opts.feedUrl;
    }
    if (!state.loaded) await loadFeed();
    else render();
  }

  /** Boot standalone page: call after DOM ready. Zero explorer imports. */
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
  };
})(window);
