/* Desk Floor — phase-1 wireframe (Paper OS sports desk). Never invents clears / greens / units. */
(function (global) {
  "use strict";

  const FEED_DATE = "20260912";
  const FEEDS = {
    miles: `feeds/miles_marks_${FEED_DATE}.json`,
    newbot: `feeds/newbot_marks_${FEED_DATE}.json`,
    chart: `feeds/chart_screen_${FEED_DATE}.json`,
  };

  const STATIONS = [
    {
      id: "nick",
      name: "Nick",
      role: "DK/TR sieves + board feed",
      bay: "sieve",
      notes:
        "Sieve desk: DraftKings lines + TeamRankings situations into the board feed. Screens land here first — not tickets.",
    },
    {
      id: "myron",
      name: "Myron",
      role: "climate / UL-LR + Drift",
      bay: "climate",
      notes:
        "Climate desk: Chart UL/LR screens + League Drift. Green/amber chips are climate only — never Bet greens.",
    },
    {
      id: "matt",
      name: "Matt",
      role: "price gate / fair ML / paper marks",
      bay: "price",
      notes:
        "Price gate: fair ML vs DK, New Bot paper marks. Paper only — edge without Miles clear stays 0u.",
    },
    {
      id: "kane",
      name: "Kane",
      role: "size / VaR / fills (0u until Miles clear)",
      bay: "size",
      notes:
        "Size desk: units / VaR / fills. Hard rule — 0u until Miles clear. No size from screens or bluff knobs alone.",
    },
    {
      id: "miles",
      name: "Miles",
      role: "last gate · clear / watch / kill / stand_down",
      bay: "owner",
      owner: true,
      notes:
        "Owner Gate: Miles last word. Layer green only if status=clear. kill / stand_down force gray. Model edge alone ≠ clear.",
    },
    {
      id: "lottery",
      name: "Lottery Bot",
      role: "sum / Bollinger · lottery bay",
      bay: "lottery",
      lottery: true,
      notes:
        "Separate lottery bay (sum/Bollinger). Visually OFF Bet greens — not wired into Bet ML chips.",
    },
  ];

  const state = {
    loaded: false,
    loading: false,
    error: null,
    miles: null,
    newbot: null,
    chart: null,
    selected: "miles",
    events: [],
  };

  function esc(s) {
    return String(s ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function fmtStamp(iso) {
    if (!iso) return "—";
    try {
      const d = new Date(iso);
      if (Number.isNaN(d.getTime())) return String(iso);
      return d.toISOString().replace("T", " ").replace(/\.\d+Z$/, "Z");
    } catch (_) {
      return String(iso);
    }
  }

  async function fetchJson(url) {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error(`${url} → ${res.status}`);
    return res.json();
  }

  function milesSummary() {
    const marks = state.miles?.marks || [];
    const counts = { clear: 0, watch: 0, kill: 0, stand_down: 0, other: 0 };
    for (const m of marks) {
      const st = (m.miles?.status || "other").toLowerCase();
      if (st in counts) counts[st] += 1;
      else counts.other += 1;
    }
    return {
      n: marks.length,
      clear_count: counts.clear,
      watch: counts.watch,
      kill: counts.kill,
      stand_down: counts.stand_down,
      other: counts.other,
      slate: state.miles?.slate_date || state.chart?.slate_date || state.newbot?.date || FEED_DATE,
      generated: state.miles?.generated_at_utc || state.chart?.generated_at_utc || null,
      source: state.miles?.source || null,
      rules: state.miles?.rules || null,
      feedOk: !!state.miles,
    };
  }

  function buildEvents() {
    const events = [];
    const sum = milesSummary();

    // stamp
    events.push({
      phase: "stamp",
      t: sum.generated || `${sum.slate}T00:00:00Z`,
      title: "Slate stamp",
      body: state.miles
        ? `Miles feed · ${sum.slate} · ${sum.n} marks · source: ${sum.source || "—"}`
        : state.error
          ? `Feeds unavailable — ${state.error}`
          : "No Miles feed loaded (paper placeholder)",
    });

    // watches from Miles (honest)
    const marks = state.miles?.marks || [];
    for (const m of marks) {
      const st = (m.miles?.status || "").toLowerCase();
      if (st === "watch") {
        events.push({
          phase: "watch",
          t: sum.generated || sum.slate,
          title: `${m.game} · watch`,
          body: m.miles?.true || m.miles?.likely || "watch",
        });
      }
    }

    // clears — only real clears; expect 0
    const clears = marks.filter((m) => (m.miles?.status || "").toLowerCase() === "clear");
    if (clears.length === 0) {
      events.push({
        phase: "clear",
        t: sum.generated || sum.slate,
        title: "Clear count · 0",
        body: state.miles
          ? "No Miles clears on this slate. Kane stays 0u. Floor will not invent greens."
          : "Clear phase idle — Miles feed missing.",
      });
    } else {
      for (const m of clears) {
        events.push({
          phase: "clear",
          t: sum.generated || sum.slate,
          title: `${m.game} · CLEAR`,
          body: m.miles?.true || m.miles?.likely || "clear",
        });
      }
    }

    // autopsy: stand_down / kill + chart finals when present
    for (const m of marks) {
      const st = (m.miles?.status || "").toLowerCase();
      if (st === "stand_down" || st === "kill") {
        events.push({
          phase: "autopsy",
          t: sum.generated || sum.slate,
          title: `${m.game} · ${st}`,
          body: m.miles?.true || m.miles?.kill || m.miles?.likely || st,
        });
      }
    }

    // New Bot paper marks (watch only — not Bet greens)
    if (state.newbot?.marks) {
      const nbWatch = state.newbot.marks.filter((m) => (m.status || "").toLowerCase() === "watch");
      if (nbWatch.length) {
        events.push({
          phase: "watch",
          t: state.newbot.date || sum.slate,
          title: `New Bot paper · ${nbWatch.length} watch`,
          body: nbWatch
            .slice(0, 6)
            .map((m) => `${m.game}${m.edge_pts != null ? ` edge=${m.edge_pts}` : ""}`)
            .join(" · ") + (nbWatch.length > 6 ? " …" : ""),
        });
      }
    }

    // Chart screen summary (climate, not tickets)
    if (state.chart?.games) {
      const g = state.chart.games;
      const green = g.filter((x) => x.screen === "green").length;
      const amber = g.filter((x) => x.screen === "amber").length;
      const red = g.filter((x) => x.screen === "red").length;
      events.push({
        phase: "autopsy",
        t: state.chart.generated_at_utc || sum.slate,
        title: "Chart climate autopsy",
        body: `UL(green)=${green} · LR(amber)=${amber} · none(red)=${red} · screens ≠ tickets`,
      });
    }

    // If nothing loaded, honest placeholders
    if (!state.miles && !state.newbot && !state.chart) {
      events.length = 0;
      events.push({
        phase: "stamp",
        t: new Date().toISOString(),
        title: "Paper placeholder",
        body: "Could not load feeds/miles_marks / newbot_marks / chart_screen. Empty floor — no invented clears.",
      });
      events.push({
        phase: "watch",
        t: "—",
        title: "Watch · empty",
        body: "Waiting on real Miles marks.",
      });
      events.push({
        phase: "clear",
        t: "—",
        title: "Clear count · 0",
        body: "Honest empty — Floor never invents greens/units.",
      });
      events.push({
        phase: "autopsy",
        t: "—",
        title: "Autopsy · idle",
        body: "No stand_down / kill / chart rows until feeds resolve.",
      });
    }

    state.events = events;
  }

  function stationStatusLine(st) {
    const sum = milesSummary();
    if (st.id === "miles") {
      if (!sum.feedOk) return "feed · offline";
      return `clear ${sum.clear_count} · watch ${sum.watch} · stand_down ${sum.stand_down}` +
        (sum.kill ? ` · kill ${sum.kill}` : "");
    }
    if (st.id === "matt") {
      if (!state.newbot) return "paper · offline";
      const marks = state.newbot.marks || [];
      const watch = marks.filter((m) => (m.status || "").toLowerCase() === "watch").length;
      const pass = marks.filter((m) => (m.status || "").toLowerCase() === "pass").length;
      return `newbot · watch ${watch} · pass ${pass} · paper`;
    }
    if (st.id === "myron") {
      if (!state.chart) return "climate · offline";
      const g = state.chart.games || [];
      const ul = g.filter((x) => x.screen === "green").length;
      const lr = g.filter((x) => x.screen === "amber").length;
      return `chart · UL ${ul} · LR ${lr} · ≠ tickets`;
    }
    if (st.id === "kane") {
      return sum.clear_count > 0 ? `fills pending · clears ${sum.clear_count}` : "0u · awaiting Miles clear";
    }
    if (st.id === "nick") {
      return sum.feedOk || state.chart ? "board feed · live files" : "board feed · placeholder";
    }
    if (st.id === "lottery") {
      return "lottery bay · OFF Bet greens";
    }
    return "desk";
  }

  function renderStations() {
    const grid = document.getElementById("floor-grid");
    if (!grid) return;
    const sum = milesSummary();
    grid.innerHTML = STATIONS.map((st) => {
      const sel = state.selected === st.id ? " is-selected" : "";
      const owner = st.owner ? " owner-gate" : "";
      const lotto = st.lottery ? " lottery-bay" : "";
      const pulse = st.owner && sum.feedOk && sum.clear_count === 0 ? " gate-locked" : "";
      return `<button type="button" class="desk-station${owner}${lotto}${sel}${pulse}" data-station="${esc(st.id)}" aria-pressed="${state.selected === st.id}">
        <div class="desk-station-top">
          <span class="desk-name">${esc(st.name)}</span>
          ${st.owner ? '<span class="desk-badge owner">Owner Gate</span>' : ""}
          ${st.lottery ? '<span class="desk-badge lotto">Lottery</span>' : ""}
        </div>
        <div class="desk-role">${esc(st.role)}</div>
        <div class="desk-status">${esc(stationStatusLine(st))}</div>
      </button>`;
    }).join("");

    grid.querySelectorAll("[data-station]").forEach((btn) => {
      btn.addEventListener("click", () => {
        state.selected = btn.dataset.station;
        renderStations();
        renderNotes();
      });
    });
  }

  function renderOwnerGate() {
    const el = document.getElementById("floor-owner-summary");
    if (!el) return;
    const sum = milesSummary();
    if (!sum.feedOk) {
      el.innerHTML = `<strong>Miles · Owner Gate</strong>
        <div class="floor-owner-stats">Feed not loaded — clear_count unknown (treat as 0u).</div>
        <div class="floor-owner-rules">Layer green only if status=clear. Floor will not invent clears.</div>`;
      return;
    }
    el.innerHTML = `<strong>Miles · Owner Gate</strong>
      <div class="floor-owner-stats">
        <span class="og-pill clear">clear <b>${sum.clear_count}</b></span>
        <span class="og-pill watch">watch <b>${sum.watch}</b></span>
        <span class="og-pill stand">stand_down <b>${sum.stand_down}</b></span>
        ${sum.kill ? `<span class="og-pill kill">kill <b>${sum.kill}</b></span>` : ""}
        <span class="og-pill muted">${esc(sum.slate)} · ${sum.n} marks</span>
      </div>
      <div class="floor-owner-rules">${esc(sum.rules || "clear required · 0u until Miles clear")}</div>`;
  }

  function renderNotes() {
    const el = document.getElementById("floor-notes");
    if (!el) return;
    const st = STATIONS.find((s) => s.id === state.selected) || STATIONS[3];
    const sum = milesSummary();
    let extra = "";
    if (st.id === "miles" && state.miles?.marks) {
      const rows = state.miles.marks
        .map((m) => {
          const stt = (m.miles?.status || "—").toLowerCase();
          return `<li><code>${esc(m.game)}</code> <span class="st-${esc(stt)}">${esc(stt)}</span> — ${esc((m.miles?.true || "").slice(0, 90))}</li>`;
        })
        .join("");
      extra = `<ul class="floor-mark-list">${rows}</ul>`;
    } else if (st.id === "matt" && state.newbot?.marks) {
      const rows = state.newbot.marks
        .slice(0, 12)
        .map(
          (m) =>
            `<li><code>${esc(m.game)}</code> <span class="st-${esc((m.status || "").toLowerCase())}">${esc(m.status)}</span>${
              m.edge_pts != null ? ` · edge ${esc(m.edge_pts)}` : ""
            } — ${esc((m.note || "").slice(0, 70))}</li>`
        )
        .join("");
      extra = `<ul class="floor-mark-list">${rows}</ul>`;
    } else if (st.id === "myron" && state.chart?.games) {
      const rows = state.chart.games
        .filter((g) => g.screen === "green" || g.screen === "amber")
        .map(
          (g) =>
            `<li><code>${esc(g.matchup)}</code> <span class="st-${esc(g.screen)}">${esc(g.screen)}</span> — ${esc(g.note || "")}</li>`
        )
        .join("");
      extra = `<p class="sub" style="margin:8px 0 4px">UL/LR climate only:</p><ul class="floor-mark-list">${rows || "<li>No UL/LR on slate</li>"}</ul>`;
    } else if (st.id === "kane") {
      extra = `<p class="sub" style="margin:8px 0">clear_count = <b>${sum.clear_count}</b> → units allowed = <b>0</b> until Miles clear.</p>`;
    } else if (st.id === "lottery") {
      extra = `<p class="sub" style="margin:8px 0">Lottery bay is visually separated and <strong>not</strong> wired into Bet ML chips.</p>`;
    }
    el.innerHTML = `<div class="floor-notes-head"><strong>${esc(st.name)}</strong><span>${esc(st.role)}</span></div>
      <p>${esc(st.notes)}</p>${extra}`;
  }

  function renderEventLog() {
    const el = document.getElementById("floor-event-log");
    if (!el) return;
    const order = { stamp: 0, watch: 1, clear: 2, autopsy: 3 };
    const sorted = [...state.events].sort((a, b) => (order[a.phase] ?? 9) - (order[b.phase] ?? 9));
    el.innerHTML = sorted
      .map(
        (ev) => `<div class="floor-event phase-${esc(ev.phase)}">
        <div class="fe-phase">${esc(ev.phase)}</div>
        <div class="fe-body">
          <div class="fe-title">${esc(ev.title)}</div>
          <div class="fe-text">${esc(ev.body)}</div>
        </div>
        <div class="fe-time">${esc(fmtStamp(ev.t))}</div>
      </div>`
      )
      .join("");
  }

  function renderShellMeta() {
    const loadEl = document.getElementById("floor-load-status");
    if (!loadEl) return;
    if (state.loading) {
      loadEl.textContent = "Loading feeds…";
      return;
    }
    const bits = [];
    bits.push(state.miles ? "miles✓" : "miles✗");
    bits.push(state.newbot ? "newbot✓" : "newbot✗");
    bits.push(state.chart ? "chart✓" : "chart✗");
    const sum = milesSummary();
    loadEl.textContent = `${bits.join(" · ")} · clear_count=${sum.clear_count}`;
  }

  function render() {
    renderShellMeta();
    renderOwnerGate();
    renderStations();
    renderNotes();
    renderEventLog();
  }

  async function loadFeeds() {
    if (state.loading) return;
    state.loading = true;
    state.error = null;
    renderShellMeta();
    const results = await Promise.allSettled([
      fetchJson(FEEDS.miles),
      fetchJson(FEEDS.newbot),
      fetchJson(FEEDS.chart),
    ]);
    state.miles = results[0].status === "fulfilled" ? results[0].value : null;
    state.newbot = results[1].status === "fulfilled" ? results[1].value : null;
    state.chart = results[2].status === "fulfilled" ? results[2].value : null;
    const fails = results
      .map((r, i) => (r.status === "rejected" ? ["miles", "newbot", "chart"][i] : null))
      .filter(Boolean);
    if (fails.length) state.error = `missing: ${fails.join(", ")}`;
    state.loading = false;
    state.loaded = true;
    buildEvents();
    render();
  }

  function ensureDom() {
    return !!document.querySelector('[data-view="floor"]');
  }

  async function activate() {
    if (!ensureDom()) return;
    render();
    if (!state.loaded) await loadFeeds();
    else render();
  }

  global.DeskFloor = { activate, render, loadFeeds, milesSummary, STATIONS };
})(window);
