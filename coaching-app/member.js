
/* =====================================================================
   Box to Box: announcements, availability, group chat and notifications.
   Shared by the coaches' app and the parents & players app.
   ===================================================================== */
/* Shared Passport and communications implementation loaded from comms.js */


/* =====================================================================
   Box to Box: parents & players app (Home, Calendar, Chat, Me)
   ===================================================================== */
(function () {
  const A = window.B2B_ACCESS, sb = window.B2B_SB, esc = Comms.esc;
  const $ = s => document.querySelector(s);
  const ls = { get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } }, set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} } };
  const pad2 = n => String(n).padStart(2, "0");
  const isoOf = d => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
  const today0 = () => { const t = new Date(); return new Date(t.getFullYear(), t.getMonth(), t.getDate()); };
  const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
  const dayOf = s => { const [y, m, d] = String(s).slice(0, 10).split("-"); return new Date(+y, +m - 1, +d); };
  const mondayOf = d => addDays(d, -((d.getDay() + 6) % 7));
  const fmtDay = (d, o) => d.toLocaleDateString("en-GB", o);
  const fmtTime = d => d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  const S = { tab: "home", week: 0, day: null, chatGroup: null, events: ls.get("b2b.mevents", null), eventsAt: 0 };
  let toastT;
  window.toast = msg => { const t = $("#toast"); if (!t) return; t.textContent = msg; t.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => t.hidden = true, 2600); };

  /* shell: our own bottom bar */
  const NAV = [["home", "Home", '<path d="M4 11l8-7 8 7v9h-5v-6H9v6H4z"/>'], ["calendar", "Calendar", '<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 10h16M9 3v4M15 3v4"/>'],
    ["dev", "Passport", '<rect x="4" y="3" width="16" height="18" rx="2"/><circle cx="12" cy="10" r="3"/><path d="M8 17c.7-1.8 2.2-2.8 4-2.8s3.3 1 4 2.8"/>'],
    ["chat", "Chat", '<path d="M4 5h16v11H9l-5 4z"/>'], ["news", "News", '<path d="M5 5h11v14H7a2 2 0 0 1-2-2zM16 9h3v8a2 2 0 0 1-2 2"/><path d="M8 9h5M8 13h5"/>'], ["me", "Me", '<circle cx="12" cy="8" r="3.5"/><path d="M5 20c.8-4 3.6-6 7-6s6.2 2 7 6"/>']];
  const nav = document.querySelector("nav.tabs .wrap");
  nav.innerHTML = NAV.filter(([key]) => key !== "news").map(([k, l, svg]) => `<a href="#${k}" data-tab="${k}"><svg viewBox="0 0 24 24" aria-hidden="true">${svg}</svg>${l}${k === "chat" ? '<i class="nav-dot" id="nav-dot" hidden></i>' : ""}</a>`).join("");
  const chip = $("#grpchip"); if (chip) chip.hidden = true;
  const meb = $("#me-btn"); if (meb) meb.hidden = true;
  const sub = document.querySelector("header .sub"); if (sub) sub.textContent = A.role === "player" ? "Player hub" : "Parent hub";

  /* events (timetable) */
  async function loadEvents(force) {
    if (!navigator.onLine || (!force && S.events && Date.now() - S.eventsAt < 60000)) return;
    S.eventsAt = Date.now();
    const { data, error } = await sb.from("events").select("*").order("starts_at");
    if (error) return;
    const fx = await Comms.loadFixtures();
    if (fx) data.push(...fx); else (S.events || []).filter(e => e.fixture).forEach(e => data.push(e));
    const changed = JSON.stringify(data) !== JSON.stringify(S.events);
    S.events = data || []; ls.set("b2b.mevents", S.events);
    if (changed) soft();
  }
  function occurrences(from, to) {
    const out = [];
    (S.events || []).forEach(e => {
      const s = new Date(e.starts_at), dur = new Date(e.ends_at) - s, until = e.repeat_until ? addDays(dayOf(e.repeat_until), 1) : null;
      for (let k = 0; k < 400; k++) {
        const d = new Date(s); d.setDate(d.getDate() + 7 * k);
        if (k > 0 && (!until || d >= until)) break; if (d >= to) break;
        if (d >= from) out.push({ e, start: d, end: new Date(d.getTime() + dur), key: Comms.rsvpKey(e.id, isoOf(d)) });
      }
    });
    return out.sort((a, b) => a.start - b.start);
  }
  function eventCard(o, showDay) {
    const e = o.e;
    return `<div class="cal-item k-${esc(e.kind)} m-event">
      ${showDay ? `<span class="cal-time">${esc(fmtDay(o.start, { weekday: "long", day: "numeric", month: "short" }))}</span>` : ""}
      ${e.kind === "match" ? `<span class="cal-time">Arrive ${esc(fmtTime(Comms.arriveOf(o.start)))} · Kick-off ${esc(fmtTime(o.start))}</span>` : `<span class="cal-time">${esc(fmtTime(o.start))}–${esc(fmtTime(o.end))}</span>`}<b>${esc(e.title)}</b>
      ${e.group_id ? `<span class="cal-sub">${esc(Comms.gname(e.group_id))}</span>` : ""}${Comms.venueLine(e.location)}${e.notes ? `<span class="cal-sub">${esc(e.notes)}</span>` : ""}
      ${e.kind === "session" ? Comms.sylAim(e.group_id, isoOf(o.start)) : ""}
      ${Comms.rsvpBar(o.key, e.group_id)}</div>`;
  }

  /* views */
  function careDue() {
    if (A.role === "player") return [];
    return Comms.familyPlayers().filter(p => { const P = Comms.st.pp[p.id]; if (!P) { setTimeout(() => Comms.loadPassport(p.id)); return false; } return !P.error && Comms.careNeedsReview(P.care); });
  }
  document.addEventListener("click", e => { if (e.target.closest("[data-careopen]")) Comms.st.ppOpen = "care"; }, true);

  // Session-day check-in prompt: opens once per session, from an hour before kick-off until it ends.
  function maybeCheckinPopup() {
    if (document.getElementById("ci-sheet")) return;
    const now = Date.now();
    const live = occurrences(today0(), addDays(today0(), 1)).filter(o => o.e.kind !== "meeting" && now >= o.start.getTime() - 3600e3 && now <= o.end.getTime());
    if (!live.length) return;
    const o = live[0], key = "b2b.ciPrompt", stamp = (o.e.id || o.e.title) + "@" + o.start.toISOString();
    let seen = {}; try { seen = JSON.parse(localStorage.getItem(key) || "{}"); } catch (e) {}
    if (seen[stamp]) return;
    try { const day = new Date().toLocaleDateString("en-CA"), done = JSON.parse(localStorage.getItem("b2b.ciDone") || "{}")[day]; if (done && done.length) return; } catch (e) {}
    seen = { [stamp]: 1 }; try { localStorage.setItem(key, JSON.stringify(seen)); } catch (e) {}
    let tries = 0;
    const open = () => {
      if (S.tab !== "home" || document.getElementById("ci-sheet")) return;
      if (document.querySelector(".welcome") && tries++ < 180) return setTimeout(open, 1000); // wait for the welcome tour to close
      Comms.checkinSheet(o.e.group_id || "", o.start.toISOString(), false);
    };
    setTimeout(open, 1500);
  }
  function homeView() {
    const first = (A.name || "").split(" ")[0] || "there";
    const next = occurrences(today0(), addDays(today0(), 21)).filter(o => o.end > new Date()).slice(0, 20);
    Comms.loadRsvps(next.slice(0, 1).map(o => o.key));
    const unread = Comms.unreadCount();
    const now = new Date(), today = occurrences(today0(), addDays(today0(), 1)).filter(o => o.e.kind !== "meeting" && o.end.getTime() + 3600e3 > now.getTime()).map(o => ({ title: o.e.title, start: o.start, group_id: o.e.group_id }));
    return `<section class="view home2">
      <div class="hero2"><span class="hero2-k">${esc(fmtDay(today0(), { weekday: "long", day: "numeric", month: "long" }))} · ${esc(Comms.myGroups().map(Comms.gname).join(", "))}</span><h1>${A.role==='parent'?'Parent Hub':'Your football day'}</h1><p>Hi, ${esc(first)}. Training focus, game focus and your coach’s feedback.</p></div>
      ${Comms.checkinCard(today)}
      ${A.role === "parent" ? '<div id="btb-parent-first" role="region" aria-label="Your child’s learning journey"><p>Loading your family journey…</p></div>' : ''}
      <details class="family-routine-toggle"><summary>Football practice at home</summary><div id="btb-keepup-home" aria-label="Optional football practice routine"></div></details>
      ${A.role !== "player" && savedClaim() ? `<a class="care-due claim-due" href="#dev"><span class="care-ic" aria-hidden="true">${ic("id")}</span><span><b>Link your child's Player Passport</b><small>You scanned a code from the coach. Tap to finish linking.</small></span><i aria-hidden="true">›</i></a>` : ""}
      ${A.role !== "player" && Comms.st.players && !Comms.familyPlayers().length ? `<a class="care-due passport-prompt" href="#me"><span class="care-ic" aria-hidden="true">${ic("id")}</span><span><b>Create your child's Player Passport</b><small>Add your child to see attendance, skills and progress in the app.</small></span><i aria-hidden="true">›</i></a>` : ""}
      ${Comms.spotlightHtml({ coach: false })}
      ${careDue().map(k => { const P = Comms.st.pp[k.id], missing = Comms.careMissing(P && P.care); return `<a class="care-due" href="#passport/${esc(k.id)}" data-careopen><span class="care-ic" aria-hidden="true">${ic("shield")}</span><span><b>${missing.length ? `Complete ${esc(k.name.split(" ")[0])}'s Player Passport` : `Review ${esc(k.name.split(" ")[0])}'s Player Passport`}</b><small>${missing.length ? `Still to confirm: ${esc(missing.join(", "))}` : `Please check and confirm these details for ${esc(Comms.currentSeason())}. Last reviewed ${P.care.reviewed_at ? esc(new Date(P.care.reviewed_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })) : "not yet"}.`}</small></span><i aria-hidden="true">›</i></a>`; }).join("")}
      ${(Comms.st.plans || []).filter(p => p.published && new Date(p.kickoff) < addDays(today0(), 8)).slice(0, 2).map(p => Comms.planCard(p, "#match/" + p.id)).join("")}
      ${A.role === "player" && Comms.myPlayer() ? Comms.passportView(Comms.myPlayer().id, { compact: true }) : ""}
      ${A.role !== "player" && Comms.familyPlayers().length ? `<div class="ct-grid home-grid">${Comms.familyPlayers().map(p => `<a class="ct pp-kid" href="#passport/${esc(p.id)}"><span class="ct-ico" aria-hidden="true">${ic("id")}</span><b>${esc(p.name.split(" ")[0])}</b><small>Player Passport</small></a>`).join("")}</div>` : ""}
      ${Comms.nudgeCard()}
      ${S.events === null ? `<div class="card empty">Loading…</div>` : next.length ? `<div class="m-next"><div class="sec2"><h2>Next up</h2></div>${eventCard(next[0], true)}</div>` : ""}
      <div class="ct-grid home-grid">
        <a class="ct" href="#calendar"><span class="ct-ico" aria-hidden="true">${ic("calendar")}</span>${next.length > 1 ? `<span class="ct-n soft">${next.length - 1}</span>` : ""}<b>Calendar</b><small>${next.length > 1 ? `${next.length - 1} more coming up` : "Sessions and matches"}</small></a>
        <a class="ct${unread ? " hot" : ""}" href="#chat"><span class="ct-ico" aria-hidden="true">${ic("chat")}</span>${unread ? `<span class="ct-n">${unread}</span>` : ""}<b>Chat</b><small>${unread ? `${unread} new` : "Your team's group chat"}</small></a>
        ${teamGroups().length ? `<a class="ct" href="#matchroom"><span class="ct-ico" aria-hidden="true">${ic("ball")}</span><b>Match Room</b><small>Fixtures, results and stats</small></a>` : ""}
        <a class="ct" href="#news"><span class="ct-ico" aria-hidden="true">${ic("megaphone")}</span><b>News</b><small>${esc(((Comms.st.ann || [])[0] || {}).title || "Club news")}</small></a>
        <a class="ct" href="#operations"><span class="ct-ico" aria-hidden="true">${ic("check")}</span><b>Attendance</b><small>Your family attendance records</small></a>
        <a class="ct" href="#me"><span class="ct-ico" aria-hidden="true">${ic("user")}</span><b>Me</b><small>Alerts, check in, app</small></a>
      </div>
    </section>`;
  }
  function calendarView() {
    const t0 = today0(), from = new Date(t0.getFullYear(), t0.getMonth() + S.week, 1), to = new Date(from.getFullYear(), from.getMonth() + 1, 1);
    const occ = occurrences(from, to), byDay = {};
    occ.forEach(o => (byDay[isoOf(o.start)] = byDay[isoOf(o.start)] || []).push(o));
    const todayIso = isoOf(t0), sel = S.day && S.day >= isoOf(from) && S.day < isoOf(to) ? S.day : (todayIso >= isoOf(from) && todayIso < isoOf(to) ? todayIso : isoOf(from));
    const dayList = byDay[sel] || [];
    Comms.loadRsvps(dayList.map(o => o.key));
    const cells = [];
    for (let d = mondayOf(from); d < to || cells.length % 7; d = addDays(d, 1)) cells.push(d);
    const kind = o => o.e.kind === "match" ? "match" : o.e.kind === "event" ? "meeting" : "session";
    return `<section class="view">
      <h1 class="sec-title" style="font-size:34px">Calendar</h1>
      <div class="cal-nav"><button class="btn small ghost" data-week="-1" aria-label="Previous month">←</button><b>${esc(from.toLocaleDateString("en-GB", { month: "long", year: "numeric" }))}</b><button class="btn small ghost" data-week="1" aria-label="Next month">→</button></div>
      ${S.week ? `<div><button class="chip" data-week="0">Back to today</button></div>` : ""}
      <div class="card cal-month"><div class="cal-grid">${["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(x => `<span class="cal-wd">${x}</span>`).join("")}${cells.map(d => {
        const iso = isoOf(d), list = byDay[iso] || [], inM = d.getMonth() === from.getMonth();
        return `<button type="button" class="cal-cell${inM ? "" : " out"}${iso === todayIso ? " today" : ""}${iso === sel ? " sel" : ""}${list.length ? " has" : ""}" data-mday="${iso}" ${inM ? "" : "disabled tabindex='-1'"} aria-label="${esc(fmtDay(d, { weekday: "long", day: "numeric", month: "long" }))}${list.length ? ", " + list.length + " on" : ", nothing on"}"><span>${d.getDate()}</span><i>${[...new Set(list.map(kind))].slice(0, 3).map(k => `<em class="d-${k}"></em>`).join("")}</i></button>`;
      }).join("")}</div>
      <p class="cal-legend"><span><em class="d-session"></em>Training</span><span><em class="d-match"></em>Match</span><span><em class="d-meeting"></em>Club event</span></p></div>
      <div class="cal-dayhead"><h2>${esc(fmtDay(dayOf(sel), { weekday: "long", day: "numeric", month: "long" }))}</h2></div>
      ${dayList.length ? `<div class="cal-items day-list">${dayList.map(o => dayList.length > 1 ? Comms.fold(o.key, Comms.foldHead(o.e.kind === "match" ? fmtTime(Comms.arriveOf(o.start)) : fmtTime(o.start), o.e.title, [o.e.kind === "match" ? "Arrive · KO " + fmtTime(o.start) : "", (o.e.location || "").split(",")[0]].filter(Boolean).join(" · "), o.e.kind), eventCard(o)) : eventCard(o)).join("")}</div>` : `<div class="card empty">Nothing on this day.</div>`}
    </section>`;
  }
  function newsView() {
    return `<section class="view"><h1 class="sec-title" style="font-size:34px">News</h1>${Comms.annList()}</section>`;
  }
  function chatViewM() {
    const groups = Comms.myGroups();
    if (groups.length > 1 && !groups.includes(S.chatGroup)) return `<section class="view"><h1 class="page-h">Chat</h1>${Comms.inboxView()}</section>`;
    return `<section class="view chat-view">${Comms.chatView(S.chatGroup || groups[0], { head: true, back: groups.length > 1 ? `data-chatopen=""` : "" })}</section>`;
  }
  /* ---------- Player Passport (parents add children; children get their own login) ---------- */
  function savedClaim() { try { return localStorage.getItem("b2b.claim") || ""; } catch (e) { return ""; } }
  function myPlayersCard() {
    const kids = Comms.familyPlayers();
    return `<div class="card m-me"><h3 class="cpd-h">My players</h3>
      ${kids.length ? `<div class="pp-kids">${kids.map(k => `<a class="pp-kidrow" href="#passport/${esc(k.id)}"><span class="pp-av sm">${esc(k.name.split(/\s+/).slice(0, 2).map(w => w[0] || "").join("").toUpperCase())}</span><span><b>${esc(k.name)}</b><small>${esc((k.groups || []).map(Comms.gname).join(" · "))}${k.user_id ? " · has own login" : ""}</small></span><i aria-hidden="true">›</i></a>`).join("")}</div>` : `<p style="margin:0">Add your child to give them a Player Passport: attendance, skills, targets and goals. They can have their own login on their phone too.</p>`}
      <details class="pp-addkid"${kids.length ? "" : " open"}><summary class="btn">＋ Add my child</summary>
        <form id="kid-form" class="pp-kidform">
          <div class="field"><label for="kid-name">Child's name</label><input id="kid-name" maxlength="60" required placeholder="First and last name"></div>
          <div class="field"><label for="kid-year">Year born</label><select id="kid-year"><option value="">Choose…</option>${Array.from({ length: 16 }, (_, i) => 2023 - i).map(y => `<option>${y}</option>`).join("")}</select></div>
          <div class="field"><span class="lbl">Team</span><div class="pp-kidg">${Comms.myGroups().map((g, i) => `<label class="chipcheck"><input type="checkbox" value="${esc(g)}" ${Comms.myGroups().length === 1 ? "checked" : ""}><span>${esc(Comms.gname(g))}</span></label>`).join("")}</div></div>
          <label class="ci-ready pp-agree"><input type="checkbox" id="kid-agree" required><span>I've read the <a href="#" data-privacy>privacy notice</a> and agree to Box to Box keeping this information about my child.</span></label>
          <p class="gmsg" id="kid-msg"></p><button class="btn primary" type="submit">Add</button></form></details>
      <details class="pp-addkid"${savedClaim() ? " open" : ""}><summary class="btn ghost">Join with your code</summary>
        <form id="claim-form" class="pp-kidform"><p class="muted" style="margin:0;font-size:14px">If the coach has already made your child's passport, they'll give you an 8-letter code. Enter it to link it to your account.</p>
          <div class="field"><label for="claim-code">Code</label><input id="claim-code" maxlength="12" required value="${esc(savedClaim())}" autocomplete="off" autocapitalize="characters" placeholder="e.g. ABCD 2345" style="text-transform:uppercase;letter-spacing:.1em"></div>
          <label class="ci-ready pp-agree"><input type="checkbox" id="claim-agree" required><span>I've read the <a href="#" data-privacy>privacy notice</a> and agree to Box to Box keeping this information about my child.</span></label>
          <p class="gmsg" id="claim-msg"></p><button class="btn primary" type="submit">Link my child</button></form></details>
      <p class="muted" style="margin:6px 0 0;font-size:13px">${ic("lock")} <a href="#" data-privacy>Privacy notice</a> · what we keep and who can see it</p></div>`;
  }
  function devView() {
    if (!Comms.st.players) return `<section class="view"><div class="card empty">Loading…</div></section>`;
    if (A.role === "player") {
      const me = Comms.myPlayer();
      if (me) return `<section class="view dev-view"><h1 class="sec-title" style="font-size:34px">Passport</h1>${Comms.passportView(me.id)}</section>`;
      return `<section class="view dev-view"><h1 class="sec-title" style="font-size:34px">Passport</h1>
        <div class="card dev-start"><span class="dev-ic" aria-hidden="true">${ic("id")}</span><h2>Create your Player Passport</h2>
          <p>Track your sessions, unlock skills each week, do the weekly quiz and see your match stats. Your coaches add your stats and sign off your skills.</p>
          <form id="self-form" class="pp-kidform">
            <div class="field"><label for="self-name">Your name</label><input id="self-name" maxlength="60" required value="${esc(A.name || "")}"></div>
            <div class="field"><label for="self-year">Year born</label><select id="self-year" required><option value="">Choose…</option>${Array.from({ length: 16 }, (_, i) => new Date().getFullYear() - 4 - i).map(y => `<option>${y}</option>`).join("")}</select></div>
            <p class="muted" style="margin:0;font-size:13px">Teams: ${esc(Comms.myGroups().map(Comms.gname).join(", ") || "none yet, ask your coach")}</p>
            <label class="ci-ready pp-agree"><input type="checkbox" id="self-agree" required><span>My parent or guardian knows I'm using this app. <a href="#" data-privacy>Privacy notice</a></span></label>
            <p class="gmsg" id="self-msg"></p><button class="btn primary big" type="submit">Create my passport</button></form></div></section>`;
    }
    const kids = Comms.familyPlayers().filter(p => p.parent_id === A.uid);
    const cur = kids.find(k => k.id === S.devKid) || kids[0];
    if (!kids.length) return `<section class="view dev-view"><h1 class="sec-title" style="font-size:34px">Passport</h1>
      <div class="card dev-start"><span class="dev-ic" aria-hidden="true">${ic("id")}</span><h2>Create your child's Player Passport</h2>
        <p>Your coaches use it for the register, weekly skill sign-offs, awards and match stats. Your child can have their own login too.</p></div>${myPlayersCard()}</section>`;
    return `<section class="view dev-view"><h1 class="sec-title" style="font-size:34px">Passport</h1>
      ${kids.length > 1 ? `<div class="pfilt">${kids.map(k => `<button type="button" class="chip" data-devkid="${esc(k.id)}" aria-pressed="${k.id === cur.id}">${esc(k.name.split(" ")[0])}</button>`).join("")}</div>` : ""}
      ${Comms.passportView(cur.id)}
      <a class="card m-me me-dev" href="#passport/${esc(cur.id)}"><span class="ct-ico" aria-hidden="true">${ic("edit")}</span><span><b>${esc(cur.name.split(" ")[0])}'s login &amp; details</b><small>Own login code, edit details, delete</small></span><i aria-hidden="true">›</i></a>
      ${myPlayersCard()}</section>`;
  }
  function passportPage() {
    const pl = (Comms.st.players || []).find(p => p.id === S.pid);
    if (!Comms.st.players) return `<section class="view"><div class="card empty">Loading…</div></section>`;
    if (!pl) return `<section class="view"><div class="card empty">Passport not found.</div><a class="btn" href="#me">Back</a></section>`;
    const first = pl.name.split(" ")[0], inv = S.invite && S.invite.pid === pl.id ? S.invite : null, parent = pl.parent_id === A.uid;
    const login = !parent ? "" : pl.user_id ? `<div class="card m-me"><h3 class="cpd-h">${esc(first)}'s login</h3><p style="margin:0">✓ ${esc(first)} signs in on their own phone with the username <b>${esc(pl.username || "")}</b>.</p>
        <div class="glinks" style="justify-content:flex-start;gap:14px"><button type="button" class="btn small" data-kidreset="${esc(pl.id)}">Reset password</button><button type="button" class="linkbtn" data-kidinvite="${esc(pl.id)}">New phone? Make a new code</button></div></div>`
      : inv ? `<div class="card pp-code"><h3 class="cpd-h">${esc(first)}'s code</h3><div class="pp-codebig">${esc(inv.code.slice(0, 4))} ${esc(inv.code.slice(4))}</div>
        <ol><li>On ${esc(first)}'s phone, open <b>${esc(location.host)}</b></li><li>Tap <b>I'm a player with a code</b></li><li>Type the code, then pick a username and password</li></ol>
        <p class="muted" style="margin:0;font-size:13px">Works once, for 7 days.</p>${navigator.share ? `<button type="button" class="btn" data-kidshare>Send to ${esc(first)}'s phone</button>` : ""}</div>`
      : `<div class="card m-me"><h3 class="cpd-h">${esc(first)}'s own login</h3><p style="margin:0">Give ${esc(first)} their own login on their phone. No email needed. You stay linked and can reset their password.</p><div><button type="button" class="btn primary" data-kidinvite="${esc(pl.id)}">Get a code for ${esc(first)}</button></div></div>`;
    const edit = !parent ? "" : `<details class="card m-me pp-edit"><summary><b>Edit details</b></summary><form id="kid-edit" class="pp-kidform" data-kid="${esc(pl.id)}">
        <div class="field"><label for="ke-name">Name</label><input id="ke-name" maxlength="60" required value="${esc(pl.name)}"></div>
        <div class="field"><label for="ke-year">Year born</label><select id="ke-year"><option value="">—</option>${Array.from({ length: 16 }, (_, i) => 2023 - i).map(y => `<option${pl.birth_year === y ? " selected" : ""}>${y}</option>`).join("")}</select></div>
        <div class="field"><span class="lbl">Team</span><div class="pp-kidg">${Comms.myGroups().map(g => `<label class="chipcheck"><input type="checkbox" value="${esc(g)}" ${(pl.groups || []).includes(g) ? "checked" : ""}><span>${esc(Comms.gname(g))}</span></label>`).join("")}</div></div>
        <p class="gmsg" id="ke-msg"></p><div class="glinks" style="justify-content:flex-start;gap:14px"><button class="btn primary small" type="submit">Save</button><button type="button" class="linkbtn" data-kiddel="${esc(pl.id)}">Delete passport and all data</button></div></form></details>`;
    return `<section class="view"><div class="chat-head"><a class="chat-back" href="#me" aria-label="Back"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg></a><div><small>${parent ? "My players" : "Passport"}</small><b>${esc(pl.name)}</b></div></div>
      ${Comms.passportView(pl.id)}${login}${edit}</section>`;
  }
  function matchPage() {
    const p = (Comms.st.plans || []).find(x => x.id === S.mid);
    if (!Comms.st.plans) return `<section class="view"><div class="card empty">Loading…</div></section>`;
    if (!p) return `<section class="view"><div class="card empty">This team sheet isn't available.</div><a class="btn" href="#home">Back</a></section>`;
    const me = A.role === "player" && Comms.myPlayer() ? Comms.myPlayer().id : null;
    return `<section class="view"><div class="chat-head"><a class="chat-back" href="#home" aria-label="Back"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg></a><div><small>Match day</small><b>${esc(p.title || "Match")}</b></div></div>${Comms.planView(p, { me })}</section>`;
  }
  const teamGroups = () => Comms.myGroups().filter(g => Comms.SIDE[g]);
  function matchRoomPage() {
    const gs = teamGroups(); if (!gs.length) return `<section class="view"><div class="card empty">No match team yet.</div></section>`;
    const gid = gs.includes(S.mrg) ? S.mrg : gs[0];
    const ev = occurrences(addDays(today0(), -70), addDays(today0(), 90)).filter(o => o.e.kind === "match" && o.e.group_id === gid).map(o => ({ e: o.e, start: o.start, key: Comms.matchKey(o.e, o.start) }));
    const kids = A.role === "player" ? [Comms.myPlayer()].filter(p => p && (p.groups || []).includes(gid)) : Comms.familyPlayers().filter(p => (p.groups || []).includes(gid));
    return `<section class="view"><div class="mr-headline"><span class="eyebrow">${esc(Comms.gname(gid))}</span><h1 class="page-h">Match Room</h1></div>
      ${Comms.spotlightHtml({ group: gid, coach: false })}
      ${gs.length > 1 ? `<div class="pfilt">${gs.map(g => `<a class="chip" aria-pressed="${g === gid}" href="#matchroom/${encodeURIComponent(g)}">${esc(Comms.gname(g))}</a>`).join("")}</div>` : ""}
      ${S.events === null ? `<div class="card empty">Loading…</div>` : Comms.matchRoomView(gid, { events: ev, kids, me: A.role === "player" && Comms.myPlayer() ? Comms.myPlayer().id : null })}</section>`;
  }
  function bindFamily(m) {
    const cf = m.querySelector("#claim-form"); if (cf) cf.onsubmit = async e => { e.preventDefault(); const msg = m.querySelector("#claim-msg");
      const info = await window.B2B_SB.rpc("code_info", { p_code: m.querySelector("#claim-code").value });
      if (info.data && info.data.ok && info.data.kind === "child") { msg.textContent = "That's a player login code. Use it on your child's phone: open the app, tap Join with your code, and type it there."; msg.className = "gmsg bad"; return; }
      const { data, error } = await window.B2B_SB.rpc("claim_player", { p_code: m.querySelector("#claim-code").value, p_agree: m.querySelector("#claim-agree").checked });
      if (error) { msg.textContent = error.message; msg.className = "gmsg bad"; return; }
      try { localStorage.removeItem("b2b.claim"); } catch (e2) {} toast(`${String(data.name).split(" ")[0]}'s passport is linked`); await Comms.loadPlayers(true); S.devKid = data.id; location.hash = "#dev"; if (S.tab === "dev") render(); };
    const sf = m.querySelector("#self-form"); if (sf) sf.onsubmit = async e => { e.preventDefault(); const msg = m.querySelector("#self-msg"), name = m.querySelector("#self-name").value.trim();
      if (name.length < 2) { msg.textContent = "Add your name."; msg.className = "gmsg bad"; return; }
      if (!m.querySelector("#self-agree").checked) { msg.textContent = "Please tick the box first."; msg.className = "gmsg bad"; return; }
      const { error } = await sb.from("players").insert({ user_id: A.uid, parent_id: null, name, birth_year: +m.querySelector("#self-year").value || null, groups: Comms.myGroups() });
      if (error) { msg.textContent = error.message; msg.className = "gmsg bad"; return; }
      toast("Your passport is ready"); await Comms.loadPlayers(true); render(); window.scrollTo(0, 0); };
    m.querySelectorAll("[data-mstat]").forEach(b => b.onclick = () => { const gs = teamGroups(), gid = gs.includes(S.mrg) ? S.mrg : gs[0];
      const o = occurrences(addDays(today0(), -70), addDays(today0(), 90)).find(x => x.e.kind === "match" && Comms.matchKey(x.e, x.start) === b.dataset.mstat); if (!o) return;
      const kids = A.role === "player" ? [Comms.myPlayer()].filter(Boolean) : Comms.familyPlayers().filter(p => (p.groups || []).includes(gid));
      Comms.statsSheet(gid, { e: o.e, start: o.start, key: b.dataset.mstat }, kids, false); });
    const kf = m.querySelector("#kid-form");
    if (kf) kf.onsubmit = async e => { e.preventDefault(); const name = m.querySelector("#kid-name").value.trim(), year = +m.querySelector("#kid-year").value || null, groups = [...kf.querySelectorAll(".pp-kidg input:checked")].map(i => i.value), msg = m.querySelector("#kid-msg");
      if (name.length < 2) { msg.textContent = "Add your child's name."; msg.className = "gmsg bad"; return; }
      if (!groups.length) { msg.textContent = "Tick their team."; msg.className = "gmsg bad"; return; }
      if (!m.querySelector("#kid-agree").checked) { msg.textContent = "Please read and agree to the privacy notice."; msg.className = "gmsg bad"; return; }
      const { data, error } = await sb.from("players").insert({ parent_id: A.uid, name, birth_year: year, groups }).select().single();
      if (error) { msg.textContent = error.message; msg.className = "gmsg bad"; return; }
      const list = await Comms.loadPlayers(true), kid = (data && data.id) ? data : list.filter(p => p.parent_id === A.uid && p.name === name).pop();
      if (kid && S.tab === "dev") { S.devKid = kid.id; render(); window.scrollTo(0, 0); } else if (kid) location.hash = "#passport/" + kid.id; else render(); };
    const ke = m.querySelector("#kid-edit");
    if (ke) ke.onsubmit = async e => { e.preventDefault(); const msg = m.querySelector("#ke-msg"), groups = [...ke.querySelectorAll(".pp-kidg input:checked")].map(i => i.value);
      if (!groups.length) { msg.textContent = "Tick at least one team."; msg.className = "gmsg bad"; return; }
      const { error } = await sb.from("players").update({ name: m.querySelector("#ke-name").value.trim(), birth_year: +m.querySelector("#ke-year").value || null, groups }).eq("id", ke.dataset.kid);
      msg.textContent = error ? error.message : "Saved"; msg.className = "gmsg " + (error ? "bad" : "good"); if (!error) { await Comms.loadPlayers(true); Comms.loadPassport(ke.dataset.kid, true); } };
    m.querySelectorAll("[data-kiddel]").forEach(b => b.onclick = async () => { if (!(await Comms.yes("Delete this passport?", "Attendance, progress, awards, medical details and stats are deleted for good, and their own login stops working.", "Delete for good"))) return;
      const { error } = await sb.from("players").delete().eq("id", b.dataset.kiddel); if (error) return toast(error.message); await Comms.loadPlayers(true); location.hash = "#me"; });
    m.querySelectorAll("[data-kidinvite]").forEach(b => b.onclick = async () => { b.disabled = true; const { data, error } = await sb.rpc("create_player_invite", { p_player: b.dataset.kidinvite }); b.disabled = false;
      if (error) return toast("Couldn't make a code: " + error.message); S.invite = { pid: b.dataset.kidinvite, code: data }; render(); });
    const sh = m.querySelector("[data-kidshare]"); if (sh) sh.onclick = () => navigator.share({ title: "Box to Box player login", text: `Your Box to Box code is ${S.invite.code}. Open ${location.origin} and tap "I'm a player with a code".` }).catch(() => {});
    m.querySelectorAll("[data-kidreset]").forEach(b => b.onclick = async () => { const p = await Comms.ask({ title: "New password", label: "New password for their login", type: "text", max: 72, ok: "Set password", danger: false, check: v => v.length < 8 ? "Use at least 8 characters." : "" }); if (p === null) return;
      const { data, error } = await sb.functions.invoke("players", { body: { action: "reset", player: b.dataset.kidreset, password: p } });
      const err = error ? (((await error.context?.json?.().catch(() => null)) || {}).error || error.message) : data && data.error; toast(err ? "Couldn't reset: " + err : "Password changed"); });
  }
  function meView() {
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent), standalone = window.matchMedia("(display-mode: standalone)").matches || navigator.standalone;
    return `<section class="view">
      <h1 class="sec-title" style="font-size:34px">${esc(A.name || "Me")}</h1>
      <div class="card m-me"><p style="margin:0"><b>${esc(A.role === "player" ? "Player" : "Parent")}</b> · ${esc(/@players\.boxtoboxacademy\.co\.uk$/.test(A.email || "") ? "Username: " + A.email.split("@")[0] : (A.email || ""))}</p><p class="muted" style="margin:0">Groups: ${esc(Comms.myGroups().map(Comms.gname).join(", "))}</p>
        <p class="muted" style="margin:0;font-size:14px">Need a change? Message the head coach.</p></div>
      <div class="card m-me"><h3 class="cpd-h">Check in</h3><p style="margin:0">For a trial or a session that isn't in your calendar.</p><div><button type="button" class="btn" data-ciopen>${ic("pin")} Check in a child</button></div></div>
      <a class="card m-me me-dev" href="#help"><span class="ct-ico" aria-hidden="true">${ic("bulb")}</span><span><b>Help</b><small>Quick answers: linking your child, check-in, logins</small></span><i aria-hidden="true">›</i></a>
      ${A.role !== "player" ? `<a class="card m-me me-dev" href="#dev"><span class="ct-ico" aria-hidden="true">${ic("id")}</span><span><b>Passport</b><small>Your child's Player Passport, medical &amp; consent, and adding a child</small></span><i aria-hidden="true">›</i></a>` : ""}
      ${Comms.alertsCard()}
      ${standalone ? "" : `<div class="card m-me"><h3 class="cpd-h">Add to your home screen</h3><p style="margin:0">${ios ? "In Safari, tap <b>Share</b> then <b>Add to Home Screen</b>." : "In Chrome, tap ⋮ then <b>Add to Home screen</b> or <b>Install app</b>."} It then opens like an app.</p></div>`}
      <div><button class="btn" id="m-out">Sign out</button></div>
    </section>`;
  }

  let btbParentDispose=null,btbRoutineDispose=null;
  function openKeepUp(slot){
    import('./b2b-features/keepup-routine.js?v=42').then(m=>{
      if(!slot.isConnected||S.tab!=='home')return;
      btbRoutineDispose=m.mountKeepUpRoutine({root:slot,playerId:A.role==='player' ? (Comms.myPlayer()?.id||A.id||'player') : (A.id||'parent')});
    }).catch(()=>{if(slot.isConnected)slot.textContent='Practice routine unavailable.';});
  }
  function openNewParentJourney(slot){
    import('./b2b-features/host.js?v=47').then(mod=>{
      if(!slot.isConnected||S.tab!=='home'||A.role!=='parent')return;
      btbParentDispose=mod.mountParentFirst({root:slot,supabase:sb,
        onOpenPassport:id=>{if(/^[0-9a-f-]{36}$/i.test(id))location.hash='#passport/'+id;}});
    }).catch(e=>{if(slot.isConnected)slot.innerHTML='<p role="alert">Family learning could not load. Try again when connected.</p>';});
  }
  function render() {
    if(btbParentDispose){try{btbParentDispose();}catch(e){}btbParentDispose=null;}
    if(btbRoutineDispose){try{btbRoutineDispose();}catch(e){}btbRoutineDispose=null;}
    const m = $("#main");
    document.querySelectorAll("nav.tabs a").forEach(a => a.setAttribute("aria-current", a.dataset.tab === S.tab ? "page" : "false"));
    if (S.tab !== "chat") Comms.stopChat();
    if (S.tab === "operations") window.B2B_OPERATIONS.mount(m);
    else if (S.tab === "passport") m.innerHTML = passportPage();
    else if (S.tab === "match") m.innerHTML = matchPage();
    else if (S.tab === "matchroom") m.innerHTML = matchRoomPage();
    else if (S.tab === "calendar") m.innerHTML = calendarView();
    else if (S.tab === "chat") m.innerHTML = chatViewM();
    else if (S.tab === "news") m.innerHTML = newsView();
    else if (S.tab === "me") m.innerHTML = meView();
    else if (S.tab === "dev") m.innerHTML = devView();
    else if (S.tab === "help") m.innerHTML = `<section class="view"><div class="chat-head"><a class="chat-back" href="#me" aria-label="Back"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg></a><div><small>Me</small><b>Help</b></div></div>${Comms.helpHtml(A.role === "player" ? "player" : "parent")}</section>`;
    else m.innerHTML = homeView();
    if (S.tab==='home') { const slot=m.querySelector('#btb-keepup-home');if(slot)openKeepUp(slot); }
    if (S.tab==='home' && A.role==='parent'){
      const slot=m.querySelector('#btb-parent-first');if(slot)openNewParentJourney(slot);
    }
    Comms.bindRsvp(m); Comms.bindAnn(m); Comms.bindCheckin(m); Comms.bindPassport(m); bindFamily(m);
    if (S.tab === "home") maybeCheckinPopup();
    m.querySelectorAll("[data-week]").forEach(b => b.onclick = () => { const v = +b.dataset.week; S.week = v ? S.week + v : 0; S.day = null; render(); });
    m.querySelectorAll("[data-mday]").forEach(b => b.onclick = () => { S.day = b.dataset.mday; render(); const h = document.querySelector(".cal-dayhead"); if (h && window.innerWidth < 700) h.scrollIntoView({ behavior: "smooth", block: "start" }); });
    if (S.tab === "chat") { m.querySelectorAll("[data-chatopen]").forEach(b => b.onclick = () => { S.chatGroup = b.dataset.chatopen || null; Comms.stopChat(); render(); window.scrollTo(0, 0); });
      if (m.querySelector(".chat")) Comms.bindChat(m); else Comms.loadUnread(); }
    if (S.tab === "me" || S.tab === "home" || S.tab === "dev") { if (!Comms.st.players) Comms.loadPlayers(); }
    if (S.tab === "dev") m.querySelectorAll("[data-devkid]").forEach(b => b.onclick = () => { S.devKid = b.dataset.devkid; Comms.st.ppOpen = ""; render(); });
    if (S.tab === "me") { Comms.paintAlerts(); $("#m-out").onclick = () => window.B2B_AUTH.signOut(); }
    if (S.tab === "news") Comms.loadAnn(true);
    if (S.tab === "home") Comms.paintNudge();
    paintDot();
  }
  function soft() {
    const ae = document.activeElement;
    if (ae && /^(INPUT|TEXTAREA|SELECT)$/.test(ae.tagName)) return;
    if (document.querySelector(".rsvp-who[open]")) { document.querySelectorAll(".rsvp[data-rkey]").forEach(box => { const tmp = document.createElement("div"); tmp.innerHTML = Comms.rsvpBar(box.dataset.rkey, box.dataset.rgroup); const open = box.querySelector(".rsvp-who[open]"); box.replaceWith(tmp.firstElementChild); }); Comms.bindRsvp(); return; }
    if (S.tab === "chat") { paintDot(); if (!document.querySelector(".chat")) render(); return; }
    render();
  }
  document.addEventListener("click", e => { const a = e.target.closest('nav.tabs a[data-tab="chat"]'); if (!a) return; const was = S.chatGroup; S.chatGroup = null; if (was && S.tab === "chat") { Comms.stopChat(); render(); } }, true);
  function paintDot() { const d = $("#nav-dot"); if (d) d.hidden = !Comms.unreadCount(); }
  Comms.st.onChange = what => { if (what === "rules") { if (S.tab === "chat" && !(document.activeElement && document.activeElement.id === "chat-text")) render(); return; } if (what === "checkin") { if (S.tab === "home") render(); return; } if (["players", "passport", "plans", "mstats"].includes(what)) { if (["home", "me", "passport", "match", "matchroom", "dev"].includes(S.tab)) soft(); return; } if (what === "unread") { paintDot(); if (S.tab === "home") soft(); return; } soft(); };

  function go() { const cm = location.hash.match(/claim=([A-Za-z0-9]{8})/); if (cm) { try { localStorage.setItem("b2b.claim", cm[1].toUpperCase()); } catch (e) {} location.replace("#dev"); return; }
    const t = location.hash.slice(1); if (/^passport\//.test(t)) { S.tab = "passport"; S.pid = t.slice(9); } else if (/^match\//.test(t)) { S.tab = "match"; S.mid = t.slice(6); } else if (/^matchroom/.test(t)) { S.tab = "matchroom"; S.mrg = decodeURIComponent(t.slice(10)) || S.mrg || null; } else S.tab = NAV.some(n => n[0] === t) || t === "help" || t === "operations" ? t : "home"; render(); window.scrollTo(0, 0); }
  window.addEventListener("hashchange", go);
  go();
  setTimeout(() => Comms.maybeWelcome(A.role === "player" ? "player" : "parent"), 800);
  loadEvents(true); Comms.loadAnn(true); Comms.loadUnread(); Comms.loadPlayers(); Comms.loadPlans();
  setTimeout(() => Comms.startPush(), 1200);
  setInterval(() => { if (document.hidden) return; loadEvents(); Comms.loadAnn(); Comms.loadUnread(); }, 60000);
  document.addEventListener("visibilitychange", () => { if (!document.hidden) { loadEvents(); Comms.loadAnn(); Comms.loadUnread(); } });
  if ("serviceWorker" in navigator && location.protocol.startsWith("http")) navigator.serviceWorker.register("sw.js").catch(() => {});
})();
