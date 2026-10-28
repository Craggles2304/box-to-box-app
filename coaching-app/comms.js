var Comms = (function () {
  const GROUP_NAMES = { D47: "Development 4–7", D812: "Development 8–12", TD5: "Technical 4–7", TD: "Technical 10–14", BM: "Ball Mastery 7–12", U10: "U10 Vipers", "U12/U13": "U12 Titans", U15: "U15 Falcons", U13: "U13 Elite" };
  const sb = () => window.B2B_SB, A = () => window.B2B_ACCESS || {};
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const q = (s, el) => (el || document).querySelector(s);
  const ls = { get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } }, set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} } };
  const gname = id => GROUP_NAMES[id] || id;
  const myGroups = () => A().admin ? Object.keys(GROUP_NAMES) : (A().groups || []).filter(g => GROUP_NAMES[g]);
  const isStaff = () => !!(A().admin || A().role === "coach" || (!A().role && !A().member));
  const roleTag = r => r === "admin" ? "Head coach" : r === "coach" ? "Coach" : r === "parent" ? "Parent" : r === "player" ? "Player" : "";
  const uuid = () => (crypto.randomUUID ? crypto.randomUUID() : "10000000-1000-4000-8000-100000000000".replace(/[018]/g, c => (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)));
  const linkify = t => esc(t).replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>');
  function when(iso) {
    const d = new Date(iso), now = new Date(), m = Math.round((now - d) / 60000);
    if (m < 1) return "just now"; if (m < 60) return m + " min ago";
    const sameDay = d.toDateString() === now.toDateString(), t = d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
    if (sameDay) return "Today " + t;
    if (new Date(now - 864e5).toDateString() === d.toDateString()) return "Yesterday " + t;
    return d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" }) + " " + t;
  }
  const st = { ann: ls.get("b2b.ann", null), annAt: 0, rsvp: {}, chat: {}, latest: ls.get("b2b.chatLatest", {}), last: ls.get("b2b.chatLast", {}), seen: ls.get("b2b.chatSeen", {}), open: null, timer: null, onChange: () => {} };
  function notify(type, id) { try { sb().functions.invoke("notify", { body: { type, id } }).catch(() => {}); } catch (e) {} }
  function toastC(t) { if (typeof window.toast === "function") window.toast(t); }

  /* ---------- compact folds: one line each, tap to open ---------- */
  st.folds = {}; st.annN = 5; st.chatN = {};
  document.addEventListener("toggle", e => { const d = e.target; if (d && d.dataset && d.dataset.fold) st.folds[d.dataset.fold] = d.open; }, true);
  function myRsvp(key) { const r = (st.rsvp[key] || []).find(x => x.user_id === A().uid); return r ? r.status : ""; }
  function fold(key, head, body, openDefault) {
    const open = st.folds[key] != null ? st.folds[key] : !!openDefault, me = myRsvp(key);
    const mark = me === "yes" ? `<span class="fd-mark y" aria-label="You're going">✓</span>` : me === "no" ? `<span class="fd-mark n" aria-label="You can't go">✗</span>` : "";
    return `<details class="fold" data-fold="${esc(key)}"${open ? " open" : ""}><summary>${head}${mark}<i class="fd-chev" aria-hidden="true"></i></summary><div class="fold-body">${body}</div></details>`;
  }
  function foldHead(time, title, sub, kind) { return `<span class="fd-bar k-${esc(kind || "")}"></span><span class="fd-time">${esc(time)}</span><span class="fd-mid"><b>${esc(title)}</b>${sub ? `<small>${esc(sub)}</small>` : ""}</span>`; }
  document.addEventListener("click", e => {
    const a = e.target.closest("[data-annmore]"); if (a) { st.annN += 10; st.onChange("ann"); return; }
    const n = e.target.closest(".news-item.clamp"); if (n && !e.target.closest("a,button")) { n.classList.toggle("open"); return; }
    const c = e.target.closest("[data-chatmore]"); if (c) { const g = c.dataset.chatmore, box = q("#chat-list"), h = document.documentElement.scrollHeight, y = window.scrollY;
      st.chatN[g] = (st.chatN[g] || 40) + 40; if (box) { box.innerHTML = listHtml(g); bindDeletes(box); window.scrollTo(0, y + document.documentElement.scrollHeight - h); } }
  });

  /* ---------- in-app panels instead of browser pop-ups ---------- */
  function ask(o) {
    o = o || {}; return new Promise(res => {
      const el = document.createElement("div"); el.className = "ci-sheet ask-sheet";
      const input = o.input === false ? "" : o.multiline ? `<textarea id="ask-in" rows="3" maxlength="${o.max || 400}" placeholder="${esc(o.placeholder || "")}">${esc(o.value || "")}</textarea>` : `<input id="ask-in" type="${o.type || "text"}" maxlength="${o.max || 200}" placeholder="${esc(o.placeholder || "")}" value="${esc(o.value || "")}" autocomplete="off">`;
      el.innerHTML = `<div class="ci-back" data-ax></div><form class="ci-panel" id="ask-form"><div class="ci-grab"></div><h2>${esc(o.title || "")}</h2>${o.text ? `<p class="ask-t">${esc(o.text)}</p>` : ""}
        ${o.input === false ? "" : `<div class="field">${o.label ? `<label for="ask-in">${esc(o.label)}</label>` : ""}${input}</div>`}<p class="ci-msg bad" id="ask-msg"></p>
        <div class="ask-acts"><button type="button" class="btn" data-ax>${esc(o.cancel || "Cancel")}</button><button class="btn ${o.danger ? "danger" : "primary"}" type="submit">${esc(o.ok || "OK")}</button></div></form>`;
      const done = v => { el.remove(); document.body.classList.remove("ci-open"); res(v); };
      el.querySelectorAll("[data-ax]").forEach(b => b.onclick = () => done(o.input === false ? false : null));
      el.querySelector("#ask-form").onsubmit = e => { e.preventDefault(); if (o.input === false) return done(true); const v = el.querySelector("#ask-in").value;
        const bad = o.check && o.check(v); if (bad) { el.querySelector("#ask-msg").textContent = bad; return; } done(v); };
      document.body.appendChild(el); document.body.classList.add("ci-open"); setTimeout(() => { const i = el.querySelector("#ask-in"); if (i) i.focus(); }, 60);
    });
  }
  const yes = (title, text, okText, danger) => ask({ title, text, ok: okText || "Yes", input: false, danger: danger !== false });
  window.B2B_ask = ask; window.B2B_yes = yes;

  /* ---------- first-time welcome + help ---------- */
  const WELCOME = {
    parent: [["home", "Welcome to Box to Box", "Sessions, match days, team chat and club news for your child, all in one place."],
      ["check", "Coming or not coming?", "Every session and match has two buttons: tap one so the coaches can plan. Check in when you arrive and it goes straight on the register."],
      ["id", "Your child's Passport", "This week's skill, a home challenge, a quick quiz and awards from the coach. Add their medical & consent details there too."]],
    player: [["home", "Welcome to Box to Box", "Your sessions, matches and team news in one place."],
      ["star", "Level up your Passport", "Come to sessions, do the home challenge and the weekly quiz, and get your skill signed off by the coach. Every step earns XP."],
      ["ball", "Match Room", "See the team sheet and game plan before each match, and add your goals and assists after."]],
    coach: [["home", "Welcome, coach", "Home shows your next session plan. On the pitch, tap Coach mode for big, simple steps."],
      ["check", "Register and sign-off", "Team → Squad → This week: tap Here for the register, Got it when a child has the skill, and ⭐ or 🏆 for awards."],
      ["clipboard", "Match days", "Team → Match Room: pick the team sheet, set the game plan, and check the stats after the game."]]
  };
  function maybeWelcome(role) {
    const key = "b2b.welcomed." + role; try { if (localStorage.getItem(key)) return; } catch (e) { return; }
    const S = WELCOME[role]; if (!S) return; let i = 0;
    const el = document.createElement("div"); el.className = "welcome";
    const done = () => { try { localStorage.setItem(key, "1"); } catch (e) {} el.remove(); document.body.classList.remove("ci-open"); };
    const draw = () => { const [icn, t, d] = S[i];
      el.innerHTML = `<div class="wel-card"><div class="wel-dots">${S.map((_, k) => `<i class="${k === i ? "on" : ""}"></i>`).join("")}</div>
        <span class="wel-ic">${ic(icn)}</span><h2>${esc(t)}</h2><p>${esc(d)}</p>
        <div class="wel-acts">${i < S.length - 1 ? `<button type="button" class="linkbtn" data-wskip>Skip</button><button type="button" class="btn primary" data-wnext>Next</button>` : `<button type="button" class="btn primary big" data-wnext>Let's go</button>`}</div>
        ${i === S.length - 1 ? `<p class="wel-help">Questions? There's a Help page under ${role === "coach" ? "Coaches → More" : "Me"}.</p>` : ""}</div>`;
      el.querySelector("[data-wnext]").onclick = () => { if (i < S.length - 1) { i++; draw(); } else done(); };
      const sk = el.querySelector("[data-wskip]"); if (sk) sk.onclick = done; };
    document.body.appendChild(el); document.body.classList.add("ci-open"); draw();
  }
  const HELP = {
    parent: [["How do I link my child?", "Go to Passport. If the coach gave you a code, tap Join with your code. Otherwise tap Add my child."],
      ["How do I check in?", "When you arrive, tap Check in now on Home and pick your child. It goes to the club's Google register. If your child has a linked Player Passport, coaches can also see them under Coaches → Attendance."],
      ["How do I say we can't come?", "Tap Not coming on the session or match, on Home or in Calendar. You can change it any time."],
      ["How does my child get their own login?", "Passport → your child's login & details → Get a code. On their phone, open the app, tap Join with your code and type it."],
      ["Who can see my child's details?", "Only their coaches and the head coach see medical details. Other families can't see your child's passport. The privacy notice is in Passport."]],
    player: [["How do I level up?", "Come to sessions, do the home challenge and the quiz each week, and get your skill signed off by your coach."],
      ["How do I add my match stats?", "Open Match Room after a game and tap My stats next to the result."],
      ["Why can't I post in the team chat?", "Players can read team chats. If something worries you, tap the flag on a message to tell the welfare officer."],
      ["I forgot my password", "Ask your parent. They can set a new one in their app under Passport → your login & details."],
      ["What's Player of the Week?", "Each week your coach picks a player who did something brilliant. It shows in the Player Spotlight on Home."]],
    coach: [["How do I take the register?", "Team → Squad → This week → Register & sign off. Tap Here for each player. Families who check in appear automatically."],
      ["How do I pick Player of the Week?", "In the same register, tap 🏆 next to the player and write why. Add a session photo on the Spotlight card on Home (only if the parent agreed to photos)."],
      ["How do I do the team sheet?", "Team → Match Room → open the match. Pick a formation (or Custom), tap shirts to type names or rename positions, and Move positions to drag them."],
      ["How do I get families linked?", "Team → Squad → Print parent codes. Parents scan the QR, create an account and they're straight in with their child linked."],
      ["What's Compliance?", "Coaches → More → Compliance. Add your DBS, safeguarding, first aid and badge dates. You'll get a reminder before anything runs out."]]
  };
  function helpHtml(role) {
    return `<div class="help">${(HELP[role] || HELP.parent).map(([q2, a]) => `<details class="card help-q"><summary><b>${esc(q2)}</b><i class="fd-chev" aria-hidden="true"></i></summary><p>${esc(a)}</p></details>`).join("")}
      <div class="card help-more"><b>Something else?</b><p>${role === "coach" ? "Message the head coach, or ask in the coaches' chat." : "Ask in your team chat, or message the head coach."}</p>
      <button type="button" class="btn small" data-rewelcome="${esc(role)}">Show the welcome again</button> <a href="#" class="linkbtn" data-privacy>Privacy notice</a></div></div>`;
  }
  document.addEventListener("click", e => { const b = e.target.closest("[data-rewelcome]"); if (b) { try { localStorage.removeItem("b2b.welcomed." + b.dataset.rewelcome); } catch (er) {} maybeWelcome(b.dataset.rewelcome); } });

  /* ---------- safeguarding: club rules, reporting a message ---------- */
  st.rules = null;
  async function loadRules(force) { if (!sb() || (st.rules && !force)) return st.rules; const { data } = await sb().rpc("club_rules"); st.rules = data || { players_post: false, welfare: [] }; st.onChange("rules"); return st.rules; }
  const canPost = () => A().role !== "player" || !!(st.rules && st.rules.players_post);
  document.addEventListener("click", e => { const b = e.target.closest(".chat-bubble"); if (b && !e.target.closest("a,button")) { document.querySelectorAll(".chat-bubble.show").forEach(x => x !== b && x.classList.remove("show")); b.classList.toggle("show"); } });
  const REASONS = ["Unkind or bullying", "Not appropriate for children", "Worried about a child's safety", "Something else"];
  function reportSheet(mid) {
    const el = document.createElement("div"); el.className = "ci-sheet"; el.id = "rep-sheet";
    const close = () => { el.remove(); document.body.classList.remove("ci-open"); };
    const who = (st.rules && st.rules.welfare && st.rules.welfare.length) ? st.rules.welfare.join(" and ") : "the club's welfare officer";
    el.innerHTML = `<div class="ci-back" data-x></div><form class="ci-panel" id="rep-form"><div class="ci-grab"></div><h2>Report this message</h2>
      <p class="muted" style="margin:0;font-size:14px">It goes privately to ${esc(who)}. The person who wrote it isn't told who reported it.</p>
      <div class="rep-why">${REASONS.map((r, i) => `<label class="chipcheck"><input type="radio" name="rep-r" value="${esc(r)}" ${i === 0 ? "" : ""}><span>${esc(r)}</span></label>`).join("")}</div>
      <div class="field"><label for="rep-d">Anything else? (optional)</label><textarea id="rep-d" rows="3" maxlength="600"></textarea></div>
      <p class="muted" style="margin:0;font-size:13px">If a child is in danger right now, call 999.</p>
      <button class="btn primary big" type="submit">Send report</button><p class="ci-msg" id="rep-msg"></p></form>`;
    el.querySelectorAll("[data-x]").forEach(b => b.onclick = close);
    q("#rep-form", el).onsubmit = async e => { e.preventDefault(); const r = el.querySelector('input[name="rep-r"]:checked'), msg = q("#rep-msg", el);
      if (!r) { msg.textContent = "Choose a reason."; msg.className = "ci-msg bad"; return; }
      const { data, error } = await sb().from("message_reports").insert({ message_id: mid, reason: r.value, details: q("#rep-d", el).value.trim() || null, reporter_id: A().uid }).select("id").single();
      if (error) { msg.textContent = "Couldn't send: " + error.message; msg.className = "ci-msg bad"; return; }
      if (data && data.id) notify("report", data.id); close(); toastC("Sent to the welfare officer. Thank you for telling us."); };
    document.body.appendChild(el); document.body.classList.add("ci-open");
  }

  /* ---------- Player Spotlight: player of the week with a session photo, for the whole club ---------- */
  st.spot = null; st.spotAt = 0;
  async function loadSpotlight(force) {
    if (!sb() || st.spotBusy || (st.spot && !force && Date.now() - st.spotAt < 120000)) return st.spot;
    st.spotBusy = true; const { data, error } = await sb().rpc("spotlight_feed"); st.spotBusy = false;
    st.spotAt = Date.now(); st.spot = error ? [] : (data || []); st.onChange("spot"); return st.spot;
  }
  function spotlightHtml(o) {
    o = o || {}; if (!st.spot) { setTimeout(() => loadSpotlight()); return ""; }
    const list = st.spot.filter(x => !o.group || x.group === o.group);
    if (!list.length) return o.group && o.coach ? `<div class="spot-empty">${ic("trophy")} <span>No Player Spotlight for this team this week. Pick a player of the week in Squad → This week.</span></div>` : "";
    const wk = new Date(weekStart(new Date())).toLocaleDateString("en-CA");
    const card = x => `<article class="spot-card${x.photo ? " has-photo" : ""}">
      <div class="spot-pic">${x.photo ? `<img src="${x.photo}" alt="${esc(x.name)} at training" loading="lazy">` : `<span class="spot-tro" aria-hidden="true">${ic("trophy")}</span>`}
        <span class="spot-badge">${ic("star")} Player of the week${x.week < wk ? " · last week" : ""}</span></div>
      <div class="spot-body"><small>${esc(gname(x.group))}</small><b>${esc(x.name)}</b>
        ${x.highlight || x.reason ? `<p>${esc(x.highlight || x.reason)}</p>` : ""}${x.coach ? `<span class="spot-coach">${esc(x.coach)}</span>` : ""}
        ${x.can_edit && o.coach !== false ? `<div class="spot-acts">${["yes", "club"].includes(x.consent) ? `<label class="btn small spot-up">${ic("video")} ${x.photo ? "Change photo" : "Add session photo"}<input type="file" accept="image/*" data-spotphoto="${esc(x.id)}" hidden></label>` : `<span class="spot-noc">${ic("lock")} ${x.consent === "no" ? "Parent said no photos" : "No photo consent yet"}</span>`}${x.photo ? `<button type="button" class="linkbtn" data-spotdel="${esc(x.id)}">Remove photo</button>` : ""}<button type="button" class="linkbtn" data-spotedit="${esc(x.id)}">Edit highlight</button></div>` : ""}</div></article>`;
    return `<section class="spot${list.length > 1 ? " many" : ""}"><div class="spot-h"><h3 class="cpd-h">${ic("trophy")} Player Spotlight</h3>${list.length > 1 ? `<span class="muted">${list.length} teams · swipe</span>` : ""}</div><div class="spot-row">${list.map(card).join("")}</div></section>`;
  }
  function shrinkPhoto(file) {
    return new Promise((res, rej) => { const img = new Image(), url = URL.createObjectURL(file);
      img.onload = () => { let w = img.naturalWidth, h = img.naturalHeight, max = 1000; if (w > h && w > max) { h = Math.round(h * max / w); w = max; } else if (h > max) { w = Math.round(w * max / h); h = max; }
        const c = document.createElement("canvas"); c.width = w; c.height = h; c.getContext("2d").drawImage(img, 0, 0, w, h); URL.revokeObjectURL(url);
        let q = 0.8, d = c.toDataURL("image/jpeg", q); while (d.length > 560000 && q > 0.35) { q -= 0.1; d = c.toDataURL("image/jpeg", q); } d.length > 590000 ? rej(new Error("Photo too large")) : res(d); };
      img.onerror = () => rej(new Error("Couldn't read that photo")); img.src = url; });
  }
  document.addEventListener("change", async e => { const i = e.target.closest("[data-spotphoto]"); if (!i || !i.files[0]) return;
    toastC("Uploading photo…");
    try { const d = await shrinkPhoto(i.files[0]); const { error } = await sb().from("player_awards").update({ photo: d }).eq("id", i.dataset.spotphoto);
      if (error) return toastC(error.message); toastC("Photo added to the Player Spotlight"); loadSpotlight(true); } catch (err) { toastC(err.message); } });
  document.addEventListener("click", async e => {
    const d = e.target.closest("[data-spotdel]"); if (d) { if (!(await yes("Remove this photo?", "It comes off the Player Spotlight for everyone.", "Remove"))) return; const { error } = await sb().from("player_awards").update({ photo: null }).eq("id", d.dataset.spotdel); if (error) return toastC(error.message); loadSpotlight(true); return; }
    const h = e.target.closest("[data-spotedit]"); if (h) { const x = (st.spot || []).find(y => y.id === h.dataset.spotedit); const t = await ask({ title: "Spotlight highlight", label: "One line everyone will see", value: (x && (x.highlight || x.reason)) || "", max: 240, ok: "Save" }); if (t === null) return;
      const { error } = await sb().from("player_awards").update({ highlight: t.trim().slice(0, 240) || null }).eq("id", h.dataset.spotedit); if (error) return toastC(error.message); loadSpotlight(true); }
  });

  /* ---------- syllabus aims for upcoming training ---------- */
  st.syl = null; st.sylAt = 0;
  async function loadSyllabus(force) {
    if (!sb() || (st.syl && !force && Date.now() - st.sylAt < 10 * 60000) || st.sylBusy) return st.syl;
    st.sylBusy = true; const { data, error } = await sb().rpc("syllabus_upcoming", { p_days: 28 }); st.sylBusy = false;
    st.sylAt = Date.now(); st.syl = error ? [] : (data || []); st.onChange("syl"); return st.syl;
  }
  function sylFor(gid, iso) { if (!st.syl) { setTimeout(() => loadSyllabus()); return null; } const wk = d => weekStart(d + "T12:00:00");
    return st.syl.find(x => x.group === gid && x.date === iso) || st.syl.find(x => x.group === gid && wk(x.date) === wk(iso)) || null; }
  function sylAim(gid, iso, o) {
    const x = gid && sylFor(gid, iso); if (!x) return "";
    o = o || {}; const mini = /^(D47|TD5)$/.test(gid);
    const obj = String(x.objective || "").replace(/^By the end,?\s*/i, "").replace(/^players can\s*/i, "");
    return `<div class="syl-aim"><span class="syl-k">${ic("book")} Session focus</span><b>${esc(x.skill || "")}${x.title ? ` <small>${esc(x.title)}</small>` : ""}</b>
      ${obj ? `<p><b>Aim:</b> ${esc(obj.charAt(0).toUpperCase() + obj.slice(1))}</p>` : ""}
      ${mini && x.word ? `<p><b>Magic word:</b> “${esc(x.word)}”</p>` : ""}
      ${!o.short && (x.points || []).length ? `<div class="pm-pts">${x.points.map(p => `<span>${esc(p)}</span>`).join("")}</div>` : ""}
      ${!o.short && o.home !== false && x.home ? `<p class="syl-home">${ic("home")} <span><b>Practise at home:</b> ${esc(x.home)}</span></p>` : ""}</div>`;
  }

  /* ---------- medical and consent (parents fill in; only that child's coaches and the head coach see it) ---------- */
  const PHOTO = { yes: "Yes, including the club's website and social media", club: "Only inside the club (app and team chats), never public", no: "No photos or videos of my child" };
  const PHOTO_SHORT = { yes: "Photos OK", club: "Club-only photos", no: "No photos" };
  function currentSeason() {
    const parts = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/London", year: "numeric", month: "numeric" }).formatToParts(new Date());
    const year = +parts.find(p => p.type === "year").value, month = +parts.find(p => p.type === "month").value;
    return month >= 9 ? `${year}-${String(year + 1).slice(-2)}` : `${year - 1}-${String(year).slice(-2)}`;
  }
  function careMissing(c) {
    if (!c) return ["medical & consent details"];
    const missing = [];
    if (!String(c.allergies || "").trim() && !c.allergies_none) missing.push("allergy status");
    if (!String(c.medical || "").trim() && !c.medical_none) missing.push("medical needs");
    if (!String(c.emergency_name || "").trim() || !String(c.emergency_relation || "").trim() || !String(c.emergency_phone || "").trim()) missing.push("emergency contact");
    if (!c.photo_consent) missing.push("photo choice");
    return missing;
  }
  const careComplete = c => careMissing(c).length === 0;
  function careNeedsReview(c) {
    if (!careComplete(c) || !c.reviewed_at || c.reviewed_season !== currentSeason()) return true;
    return c.updated_at && new Date(c.updated_at) > new Date(c.reviewed_at);
  }
  function careView(c, name) {
    if (!c) return `<p class="muted" style="margin:0">No medical or consent details yet.</p>`;
    const row = (l, v, cls) => v ? `<div class="care-row${cls ? " " + cls : ""}"><small>${l}</small><b>${v}</b></div>` : "";
    return `${row("Allergies", esc(c.allergies || (c.allergies_none ? "None reported" : "Not confirmed")), c.allergies || !c.allergies_none ? "warn" : "")}
      ${row("Medical needs", esc(c.medical || (c.medical_none ? "None reported" : "Not confirmed")), c.medical || !c.medical_none ? "warn" : "")}
      ${row("Emergency contact", c.emergency_name ? `${esc(c.emergency_name)}${c.emergency_relation ? ` (${esc(c.emergency_relation)})` : ""}${c.emergency_phone ? ` · <a href="tel:${esc(String(c.emergency_phone).replace(/[^0-9+]/g, ""))}">${esc(c.emergency_phone)}</a>` : ""}` : "Not recorded", !c.emergency_name || !c.emergency_relation || !c.emergency_phone ? "warn" : "")}
      ${row("Photos and videos", esc(PHOTO_SHORT[c.photo_consent] || "Not answered"), c.photo_consent === "no" ? "warn" : "")}
      ${c.reviewed_at ? `<p class="muted" style="margin:0;font-size:12px">Confirmed for ${esc(c.reviewed_season || "a previous season")} on ${esc(new Date(c.reviewed_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }))}</p>` : ""}
      ${c.updated_at ? `<p class="muted" style="margin:0;font-size:12px">Last changed ${esc(new Date(c.updated_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }))}${c.updated_by ? " by " + esc(c.updated_by) : ""}</p>` : ""}`;
  }
  function careForm(c, first) {
    c = c || {};
    return `<form class="pp-kidform care-form" id="care-form">
      <div class="field"><label for="cf-all">Allergies</label><textarea id="cf-all" rows="2" maxlength="400" placeholder="Add only what the coaches need to know.">${esc(c.allergies || "")}</textarea><label class="care-none"><input id="cf-allnone" type="checkbox" ${c.allergies_none ? "checked" : ""}><span>No allergies to report</span></label></div>
      <div class="field"><label for="cf-med">Medical needs coaches should know</label><textarea id="cf-med" rows="3" maxlength="800" placeholder="Add only what the coaches need to know.">${esc(c.medical || "")}</textarea><label class="care-none"><input id="cf-mednone" type="checkbox" ${c.medical_none ? "checked" : ""}><span>No other medical needs to report</span></label></div>
      <div class="row3" style="grid-template-columns:1fr 1fr"><div class="field"><label for="cf-en">Emergency contact</label><input id="cf-en" maxlength="80" value="${esc(c.emergency_name || "")}" placeholder="Name"></div>
        <div class="field"><label for="cf-er">Relationship</label><input id="cf-er" maxlength="40" value="${esc(c.emergency_relation || "")}" placeholder="e.g. Mum"></div></div>
      <div class="field"><label for="cf-ep">Emergency phone</label><input id="cf-ep" type="tel" maxlength="30" value="${esc(c.emergency_phone || "")}" placeholder="07…"></div>
      <div class="field"><span class="lbl">Photos and videos of ${esc(first)}</span><div class="care-photo">${Object.entries(PHOTO).map(([k, l]) => `<label class="care-opt"><input type="radio" name="cf-ph" value="${k}" ${c.photo_consent === k ? "checked" : ""}><span>${esc(l)}</span></label>`).join("")}</div></div>
      <p class="muted" style="margin:0;font-size:13px">${ic("lock")} Only your family, the coaches of ${esc(first)}'s sessions and the head coach can see medical and emergency details. Other families cannot. Add only information the coaches need for your child's care.</p>
      <p class="gmsg" id="cf-msg"></p><div><button class="btn primary" type="submit">Save</button></div></form>`;
  }
  async function careSheet(pid, name) {
    const { data } = await sb().from("player_care").select("*").eq("player_id", pid).maybeSingle();
    const el = document.createElement("div"); el.className = "ci-sheet"; el.id = "care-sheet";
    const close = () => { el.remove(); document.body.classList.remove("ci-open"); };
    el.innerHTML = `<div class="ci-back" data-x></div><div class="ci-panel"><div class="ci-grab"></div><span class="eyebrow">Medical &amp; consent</span><h2>${esc(name || "")}</h2>${careView(data, name)}<button type="button" class="btn big" data-x>Close</button></div>`;
    el.querySelectorAll("[data-x]").forEach(b => b.onclick = close);
    document.body.appendChild(el); document.body.classList.add("ci-open");
  }

  /* ---------- privacy notice ---------- */
  function privacyHtml() {
    const welfare = (st.rules && st.rules.welfare && st.rules.welfare.length) ? st.rules.welfare.join(", ") : "our welfare officer";
    return window.B2B_PRIVACY_FN(welfare);
  }
  function privacySheet() {
    const el = document.createElement("div"); el.className = "ci-sheet"; el.id = "privacy-sheet";
    const close = () => { el.remove(); document.body.classList.remove("ci-open"); };
    el.innerHTML = `<div class="ci-back" data-x></div><div class="ci-panel"><div class="ci-grab"></div><h2>Privacy notice</h2>${privacyHtml()}<button type="button" class="btn big" data-x>Close</button></div>`;
    el.querySelectorAll("[data-x]").forEach(b => b.onclick = close);
    document.body.appendChild(el); document.body.classList.add("ci-open");
  }
  document.addEventListener("click", e => { const a = e.target.closest("[data-privacy]"); if (a) { e.preventDefault(); privacySheet(); } });

  /* ---------- announcements ---------- */
  async function loadAnn(force) {
    if (!sb() || !navigator.onLine || (!force && st.ann && Date.now() - st.annAt < 30000)) return;
    st.annAt = Date.now();
    const { data, error } = await sb().from("announcements").select("*").order("created_at", { ascending: false }).limit(40);
    if (error) return;
    const changed = JSON.stringify(data) !== JSON.stringify(st.ann);
    st.ann = data || []; ls.set("b2b.ann", st.ann);
    if (changed) st.onChange("ann");
  }
  function annItem(a) {
    const mine = a.author_id === A().uid, del = A().admin || mine;
    const to = !a.group_ids || !a.group_ids.length ? "Everyone" : a.group_ids.map(gname).join(", ");
    const long = a.body && (a.body.length > 140 || (a.body.match(/\n/g) || []).length > 2);
    return `<article class="card news-item${a.pinned ? " pinned" : ""}${long ? " clamp" : ""}">
      <div class="news-meta"><span class="pill news-to">${esc(to)}</span><span>${esc(a.author_name || "Box to Box")} · ${esc(when(a.created_at))}</span>${del ? `<button type="button" class="news-del" data-anndel="${a.id}" aria-label="Delete post">×</button>` : ""}</div>
      <h3 class="news-title">${esc(a.title)}</h3>
      ${a.body ? `<p class="news-body">${linkify(a.body)}</p>` : ""}${long ? `<span class="news-more" aria-hidden="true"></span>` : ""}
    </article>`;
  }
  function annList(limit) {
    if (st.ann === null) return `<div class="card empty">Loading news…</div>`;
    const all = limit ? st.ann.slice(0, limit) : st.ann, list = all.slice(0, st.annN);
    if (!list.length) return `<div class="card empty">No announcements yet.</div>`;
    return `<div class="news-list">${list.map(annItem).join("")}</div>${all.length > list.length ? `<button type="button" class="btn ghost more-btn" data-annmore>Show older posts</button>` : ""}`;
  }
  function annListFor(gid, limit) {
    if (st.ann === null) return `<div class="card empty">Loading news…</div>`;
    const all = st.ann.filter(a => !a.group_ids || !a.group_ids.length || a.group_ids.includes(gid)).slice(0, limit || 50), list = all.slice(0, st.annN);
    if (!list.length) return `<div class="card empty">No news for this team yet.</div>`;
    return `<div class="news-list">${list.map(annItem).join("")}</div>${all.length > list.length ? `<button type="button" class="btn ghost more-btn" data-annmore>Show older posts</button>` : ""}`;
  }
  function annComposer(pre) {
    if (!isStaff()) return "";
    const groups = myGroups();
    return `<details class="news-compose"><summary class="btn primary" id="ann-open">+ New post</summary><form class="card form news-form" id="ann-form">
      <div class="field"><span class="lbl">Send to</span><div class="news-to-pick">
        ${A().admin ? `<label class="chipcheck"><input type="checkbox" value="" id="ann-all" ${pre ? "" : "checked"}><span>Everyone</span></label>` : ""}
        ${groups.map(g => `<label class="chipcheck"><input type="checkbox" value="${esc(g)}" data-anng ${(pre ? g === pre : !A().admin && groups.length === 1) ? "checked" : ""}><span>${esc(gname(g))}</span></label>`).join("")}</div></div>
      <div class="field"><label for="ann-title">Title</label><input type="text" id="ann-title" maxlength="120" placeholder="Headline" required></div>
      <div class="field"><label for="ann-body">Message</label><textarea id="ann-body" maxlength="4000" placeholder="Details (optional)"></textarea></div>
      <div class="actions"><button class="btn primary" type="submit" id="ann-send">Post</button></div>
      <p class="muted" id="ann-msg" aria-live="polite" style="margin:0;font-size:14px"></p>
    </form></details>`;
  }
  function bindAnn(root) {
    root = root || document;
    const f = q("#ann-form", root);
    if (f) {
      const all = q("#ann-all", f);
      if (all) { all.onchange = () => { if (all.checked) f.querySelectorAll("[data-anng]").forEach(x => x.checked = false); }; f.querySelectorAll("[data-anng]").forEach(x => x.onchange = () => { if (x.checked) all.checked = false; }); }
      f.onsubmit = async e => {
        e.preventDefault();
        const title = q("#ann-title", f).value.trim(), body = q("#ann-body", f).value.trim();
        const group_ids = all && all.checked ? [] : [...f.querySelectorAll("[data-anng]:checked")].map(x => x.value);
        const m = q("#ann-msg", f);
        if (!title) { m.textContent = "Add a title."; m.className = "bad"; return; }
        if (!(all && all.checked) && !group_ids.length) { m.textContent = "Choose who it's for."; m.className = "bad"; return; }
        const id = uuid(), btn = q("#ann-send", f); btn.disabled = true; m.textContent = "Posting…"; m.className = "muted";
        const { error } = await sb().from("announcements").insert({ id, title, body, group_ids, author_id: A().uid });
        btn.disabled = false;
        if (error) { m.textContent = "Couldn't post: " + error.message; m.className = "bad"; return; }
        notify("announcement", id);
        q("#ann-title", f).value = ""; q("#ann-body", f).value = "";
        toastC("Posted. Everyone in those groups will be notified.");
        await loadAnn(true);
      };
    }
    (root.querySelectorAll ? root : document).querySelectorAll("[data-anndel]").forEach(b => b.onclick = async () => {
      if (!(await yes("Delete this post?", "It's removed for everyone.", "Delete"))) return;
      const { error } = await sb().from("announcements").delete().eq("id", b.dataset.anndel);
      if (error) return toastC("Couldn't delete: " + error.message);
      await loadAnn(true);
    });
  }

  /* ---------- availability ---------- */
  const rsvpKey = (eventId, iso) => `e:${eventId}:${iso}`;
  let rsvpLoading = null;
  async function loadRsvps(keys, force) {
    const need = force ? keys : keys.filter(k => st.rsvp[k] === undefined);
    if (!need.length || !sb() || !navigator.onLine) return;
    const { data, error } = await sb().from("rsvps").select("*").in("item_key", need);
    if (error) return;
    need.forEach(k => st.rsvp[k] = []);
    (data || []).forEach(r => st.rsvp[r.item_key].push(r));
    st.onChange("rsvp");
  }
  function rsvpBar(key, groupId) {
    const rows = st.rsvp[key];
    if (rows === undefined) return `<div class="rsvp" data-rkey="${esc(key)}"><span class="muted rsvp-load">Checking who's coming…</span></div>`;
    const me = rows.find(r => r.user_id === A().uid), yes = rows.filter(r => r.status === "yes"), no = rows.filter(r => r.status === "no");
    const who = list => list.map(r => `<li>${esc(r.user_name || "Member")}${r.user_role ? ` <span class="muted">${esc(roleTag(r.user_role))}</span>` : ""}</li>`).join("");
    const label = A().role === "parent" ? "Coming?" : "Coming?";
    return `<div class="rsvp" data-rkey="${esc(key)}" data-rgroup="${esc(groupId || "")}">
      <div class="rsvp-row"><span class="rsvp-q">${label}</span>
        <button type="button" class="rsvp-btn yes" data-rset="yes" aria-pressed="${me && me.status === "yes"}">Going</button>
        <button type="button" class="rsvp-btn no" data-rset="no" aria-pressed="${me && me.status === "no"}">Can't go</button></div>
      ${rows.length ? `<details class="rsvp-who"><summary>${yes.length} going · ${no.length} can't go</summary>
        ${yes.length ? `<h5>Going</h5><ul>${who(yes)}</ul>` : ""}${no.length ? `<h5>Can't go</h5><ul>${who(no)}</ul>` : ""}</details>` : `<span class="muted rsvp-none">No replies yet</span>`}
    </div>`;
  }
  function bindRsvp(root) {
    (root || document).querySelectorAll(".rsvp [data-rset]").forEach(b => b.onclick = async () => {
      const box = b.closest(".rsvp"), key = box.dataset.rkey, group_id = box.dataset.rgroup || null, status = b.dataset.rset;
      if (!navigator.onLine) return toastC("You're offline. Try again when you have signal.");
      const prev = st.rsvp[key] || [];
      const mine = { item_key: key, user_id: A().uid, group_id, status, user_name: A().name || "You", user_role: A().role };
      st.rsvp[key] = prev.filter(r => r.user_id !== A().uid).concat([mine]); st.onChange("rsvp");
      const { error } = await sb().from("rsvps").upsert({ item_key: key, user_id: A().uid, group_id, status }, { onConflict: "item_key,user_id" });
      if (error) { st.rsvp[key] = prev; st.onChange("rsvp"); return toastC("Couldn't save: " + error.message); }
      toastC(status === "yes" ? "Marked as going" : "Marked as can't go");
      if (status === "no" && isStaff() && !A().admin) notify("cantmake", key);
    });
  }

  /* ---------- group chat ---------- */
  function setLast(gid) { const l = st.chat[gid]; if (l && l.length) { const m = l[l.length - 1]; st.last[gid] = { created_at: m.created_at, user_id: m.user_id, user_name: m.user_name, body: (m.body || "").slice(0, 140), deleted: m.deleted }; ls.set("b2b.chatLast", st.last); } }
  function markSeen(gid) { const l = st.chat[gid]; if (l && l.length) { st.seen[gid] = l[l.length - 1].created_at; ls.set("b2b.chatSeen", st.seen); } }
  async function loadChat(gid) {
    const { data, error } = await sb().from("messages").select("*").eq("group_id", gid).order("created_at", { ascending: false }).limit(80);
    if (error) return;
    st.chat[gid] = (data || []).reverse(); setLast(gid);
    if (st.chat[gid].length) { st.latest[gid] = st.chat[gid][st.chat[gid].length - 1].created_at; ls.set("b2b.chatLatest", st.latest); }
    markSeen(gid); paintChat(gid);
  }
  async function pollChat(gid) {
    if (!navigator.onLine || document.hidden) return;
    const list = st.chat[gid] || [], last = list.length ? list[list.length - 1].created_at : "1970-01-01T00:00:00Z";
    const { data, error } = await sb().from("messages").select("*").eq("group_id", gid).gt("created_at", last).order("created_at", { ascending: true }).limit(50);
    if (error || !data || !data.length) return;
    st.chat[gid] = list.concat(data.filter(m => !list.some(x => x.id === m.id))); setLast(gid);
    st.latest[gid] = st.chat[gid][st.chat[gid].length - 1].created_at; ls.set("b2b.chatLatest", st.latest);
    markSeen(gid); paintChat(gid);
  }
  async function loadUnread() {
    if (!sb() || !navigator.onLine) return;
    const groups = myGroups(); let changed = false;
    await Promise.all(groups.map(async g => {
      const { data } = await sb().from("messages").select("created_at,user_id,user_name,body,deleted").eq("group_id", g).order("created_at", { ascending: false }).limit(1);
      const top = data && data[0];
      if (top && (!st.last[g] || st.last[g].created_at !== top.created_at || st.last[g].deleted !== top.deleted)) { st.last[g] = Object.assign({}, top, { body: (top.body || "").slice(0, 140) }); changed = true; }
      if (top && top.user_id === A().uid && (!st.seen[g] || st.seen[g] < top.created_at)) { st.seen[g] = top.created_at; ls.set("b2b.chatSeen", st.seen); }
      if (top && st.latest[g] !== top.created_at) { st.latest[g] = top.created_at; changed = true; }
    }));
    ls.set("b2b.chatLatest", st.latest); ls.set("b2b.chatLast", st.last);
    if (changed) st.onChange("unread");
  }
  const unread = g => !!(st.latest[g] && (!st.seen[g] || st.seen[g] < st.latest[g]) && st.open !== g);
  const unreadCount = () => myGroups().filter(unread).length;
  const initials = n => String(n || "?").trim().split(/\s+/).slice(0, 2).map(w => w[0] || "").join("").toUpperCase() || "?";
  const roleCls = r => r === "admin" || r === "coach" ? "r-coach" : r === "player" ? "r-player" : "r-parent";
  const GABBR = { D47: "DEV", D812: "DEV", TD5: "TEC", TD: "TEC", BM: "BM" };
  const gabbr = g => GABBR[g] || String(g).split("/")[0];
  function dayLabel(d) {
    const t = new Date(); t.setHours(0, 0, 0, 0); const x = new Date(d); x.setHours(0, 0, 0, 0); const n = Math.round((t - x) / 864e5);
    return n === 0 ? "Today" : n === 1 ? "Yesterday" : n < 7 ? x.toLocaleDateString("en-GB", { weekday: "long" }) : x.toLocaleDateString("en-GB", { day: "numeric", month: "long" });
  }
  function whenShort(iso) {
    const d = new Date(iso), n = Math.round((new Date().setHours(0, 0, 0, 0) - new Date(iso).setHours(0, 0, 0, 0)) / 864e5);
    return n === 0 ? d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) : n === 1 ? "Yesterday" : n < 7 ? d.toLocaleDateString("en-GB", { weekday: "short" }) : d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  }
  const runWith = (a, b) => a && b && a.user_id === b.user_id && new Date(a.created_at).toDateString() === new Date(b.created_at).toDateString() && Math.abs(new Date(b.created_at) - new Date(a.created_at)) < 300000;
  function msgHtml(m, prev, next) {
    const mine = m.user_id === A().uid, d = new Date(m.created_at);
    const day = d.toDateString() !== (prev ? new Date(prev.created_at).toDateString() : "") ? `<div class="chat-day"><span>${esc(dayLabel(d))}</span></div>` : "";
    const first = !runWith(prev, m), last = !runWith(m, next), rc = roleCls(m.user_role);
    const del = !m.deleted && (A().admin || mine) ? `<button type="button" class="chat-del" data-msgdel="${m.id}" aria-label="Delete message">×</button>` : !m.deleted && !mine ? `<button type="button" class="chat-rep" data-msgrep="${m.id}" aria-label="Report this message">${ic("flag")}</button>` : "";
    const bubble = `<div class="chat-bubble">${m.deleted ? `<i class="muted">Message removed</i>` : linkify(m.body)}<span class="chat-time">${esc(d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }))}</span>${del}</div>`;
    if (mine) return `${day}<div class="cm mine${first ? "" : " cont"}${last ? " last" : ""}">${bubble}</div>`;
    return `${day}<div class="cm${first ? "" : " cont"}${last ? " last" : ""}"><span class="cm-av ${rc}" aria-hidden="true">${last ? esc(initials(m.user_name)) : ""}</span><div class="cm-body">
      ${first ? `<div class="chat-who"><b class="${rc}">${esc(m.user_name || "Member")}</b>${roleTag(m.user_role) ? `<span>${esc(roleTag(m.user_role))}</span>` : ""}</div>` : ""}${bubble}</div></div>`;
  }
  function listHtml(gid) {
    const l = st.chat[gid];
    if (!l) return `<div class="empty">Loading messages…</div>`;
    if (!l.length) return `<div class="chat-empty"><span>${ic("wave")}</span><b>No messages yet</b><small>Say hello to ${esc(gname(gid))}.</small></div>`;
    const n = st.chatN[gid] || 40, from = Math.max(0, l.length - n);
    return (from ? `<button type="button" class="chat-more" data-chatmore="${esc(gid)}">Show earlier messages</button>` : "") + l.slice(from).map((m, i) => msgHtml(m, l[from + i - 1], l[from + i + 1])).join("");
  }
  const nearBottom = () => window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 160;
  const toBottom = () => requestAnimationFrame(() => window.scrollTo(0, document.documentElement.scrollHeight));
  function paintChat(gid) {
    const box = q("#chat-list"); if (!box || st.open !== gid) return;
    const atBottom = nearBottom();
    box.innerHTML = listHtml(gid); bindDeletes(box);
    if (atBottom || box.dataset.first !== "0") { toBottom(); box.dataset.first = "0"; }
  }
  function chatHead(gid, back) {
    return `<div class="chat-head">${back ? `<button type="button" class="chat-back" ${back} aria-label="Back to chats"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg></button>` : ""}<span class="ib-av">${esc(gabbr(gid))}</span><div><b>${esc(gname(gid))}</b><small>${ic("lock")} Group chat · everyone in the group sees it</small></div></div>`;
  }
  function chatView(gid, o) {
    o = o || {};
    const groups = myGroups();
    if (!groups.length) return `<div class="card empty">You're not in a group yet.</div>`;
    gid = groups.includes(gid) ? gid : groups[0];
    return `<div class="chat" data-gid="${esc(gid)}">
      ${o.head ? chatHead(gid, o.back) : `<p class="chat-note">${ic("lock")} Everyone in ${esc(gname(gid))} sees these messages.</p>`}
      <div class="chat-list" id="chat-list" data-first="1" aria-live="polite">${listHtml(gid)}</div>
      ${canPost() ? `<form class="chat-send" id="chat-form"><textarea id="chat-text" rows="1" maxlength="2000" placeholder="Message" aria-label="Message ${esc(gname(gid))}"></textarea><button class="chat-go" type="submit" aria-label="Send"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12l16-8-6 16-2.5-6.5z"/></svg></button></form>` : `<p class="chat-ro">${ic("lock")} <span>Team chats are read-only for players. You can read everything, and tap ${ic("flag")} on any message that worries you.</span></p>`}
    </div>`;
  }
  function inboxView(o) {
    o = o || {};
    const groups = myGroups().slice().sort((a, b) => ((st.last[b] || {}).created_at || "").localeCompare((st.last[a] || {}).created_at || ""));
    const row = g => { const l = st.last[g], u = unread(g);
      const prev = l ? (l.deleted ? "Message removed" : `${l.user_id === A().uid ? "You" : String(l.user_name || "Member").split(" ")[0]}: ${String(l.body || "").replace(/\s+/g, " ")}`) : "No messages yet";
      return `<button type="button" class="ib-row${u ? " unread" : ""}" data-chatopen="${esc(g)}"><span class="ib-av">${esc(gabbr(g))}</span><span class="ib-mid"><b>${esc(gname(g))}</b><small>${esc(prev)}</small></span><span class="ib-r">${l ? `<time>${esc(whenShort(l.created_at))}</time>` : ""}${u ? `<i class="ib-dot" aria-label="New messages"></i>` : ""}</span></button>`; };
    const top = (st.ann || [])[0];
    const news = o.news ? `<button type="button" class="ib-row" data-chatopen="news"><span class="ib-av news">${ic("megaphone")}</span><span class="ib-mid"><b>News</b><small>${esc(top ? top.title : "Club news and updates")}</small></span><span class="ib-r">${top ? `<time>${esc(whenShort(top.created_at))}</time>` : ""}</span></button>` : "";
    return `<div class="inbox">${news}${groups.map(row).join("")}</div><p class="chat-note" style="text-align:center">${ic("lock")} Group chats only. No private messages.</p>`;
  }
  function bindDeletes(root) {
    root.querySelectorAll("[data-msgrep]").forEach(b => b.onclick = e => { e.stopPropagation(); reportSheet(b.dataset.msgrep); });
    root.querySelectorAll("[data-msgdel]").forEach(b => b.onclick = async () => {
      if (!(await yes("Remove this message?", "It's removed for everyone in the chat.", "Remove"))) return;
      const { error } = await sb().from("messages").update({ deleted: true }).eq("id", b.dataset.msgdel);
      if (error) return toastC("Couldn't remove: " + error.message);
      const l = st.chat[st.open] || []; const m = l.find(x => x.id === b.dataset.msgdel); if (m) { m.deleted = true; m.body = ""; }
      paintChat(st.open);
    });
  }
  function bindChat(root, onGroup) {
    root = root || document;
    const c = q(".chat", root); if (!c) return;
    const gid = c.dataset.gid;
    root.querySelectorAll("[data-chatg]").forEach(b => b.onclick = () => onGroup && onGroup(b.dataset.chatg));
    startChat(gid);
    const box = q("#chat-list", root); if (box) { toBottom(); bindDeletes(box); }
    const f = q("#chat-form", root), t = q("#chat-text", root);
    if (!st.rules) setTimeout(() => loadRules());
    if (!f) return;
    const grow = () => { t.style.height = "auto"; t.style.height = Math.min(t.scrollHeight, 140) + "px"; };
    t.addEventListener("input", grow);
    t.addEventListener("keydown", e => { if (e.key === "Enter" && !e.shiftKey && !/iphone|ipad|android/i.test(navigator.userAgent)) { e.preventDefault(); f.requestSubmit(); } });
    f.onsubmit = async e => {
      e.preventDefault();
      const body = t.value.trim(); if (!body) return;
      if (!navigator.onLine) return toastC("You're offline. Your message wasn't sent.");
      const id = uuid(), now = new Date().toISOString();
      const temp = { id, group_id: gid, user_id: A().uid, user_name: A().name, user_role: A().role, body, created_at: now, deleted: false };
      st.chat[gid] = (st.chat[gid] || []).concat([temp]); t.value = ""; grow(); paintChat(gid); toBottom();
      const { error } = await sb().from("messages").insert({ id, group_id: gid, body, user_id: A().uid });
      if (error) { st.chat[gid] = st.chat[gid].filter(m => m.id !== id); paintChat(gid); t.value = body; return toastC("Couldn't send: " + error.message); }
      notify("message", id);
    };
  }
  function startChat(gid) {
    if (st.open !== gid) { st.open = gid; }
    clearInterval(st.timer);
    if (!st.chat[gid]) loadChat(gid); else { markSeen(gid); pollChat(gid); }
    st.timer = setInterval(() => pollChat(gid), 6000);
    st.onChange("unread");
  }
  function stopChat() { clearInterval(st.timer); st.timer = null; st.open = null; }

  /* ---------- check in: sends straight to the club's Google Form (same CHECK IN ATTENDANCE LIST sheet) ---------- */
  const CI = { url: "https://docs.google.com/forms/d/e/1FAIpQLSePn6IS8dJchbhvDbiBPhhJvfktjnm8gzS3Lx_84NzNjYfIjw",
    name: "entry.934163", session: "entry.448787249", phone: "entry.1921906014", notes: "entry.1611735832", ready: "entry.250421692",
    options: ["SATURDAY FALCONS U15 (11.30 -1pm)", "SATURDAY ACADEMY Under 9s  (9.30 -10.30)", "SATURDAY VIPERS U10  ( 10.30 - 11.30 )", "SATURDAY TITANS U12 (10.30 - 11.30 )", "SATURDAY ELITE U13 (09:00-11:00)", "SUNDAYS  (10.30 - 11.30)", "SUNDAYs  (11.40 - 12.40)", "SUNDAY GIRLS ONLY (11.40 - 12.4)", "TUESDAY (17.00 - 18.00)", "TRIAL SESSION SUNDAY (13.30 - 14.30)", "TRIAL SESSION SUNDAY (14.30 - 15.30)", "TRIAL SESSION GIRLS ONLY (14.30 - 15.30)", "TRIAL SESSION TUESDAY (17.00 - 18.00)", "GOALKEEPER ACADEMY SATURDAY"],
    labels: ["U15 Falcons · Sat 11:30–13:30", "Saturday Academy U9 · 9:30–10:30", "U10 Vipers · Sat 10:30–11:30", "U12 Titans · Sat 10:30–11:30", "U13 Elite · Sat 9:00–11:00", "Sunday · 10:30–11:30", "Sunday · 11:40–12:40", "Sunday Girls Only · 11:40–12:40", "Tuesday · 17:00–18:00", "Trial · Sunday 13:30–14:30", "Trial · Sunday 14:30–15:30", "Trial · Girls Only 14:30–15:30", "Trial · Tuesday 17:00–18:00", "Goalkeeper Academy · Sat"] };
  function ciGuess(gid, start) {
    const by = { U15: 0, U10: 2, "U12/U13": 3, U13: 4, BM: 8 };
    if (gid in by) return by[gid];
    const d = start ? new Date(start) : new Date(), day = d.getDay(), h = d.getHours() + d.getMinutes() / 60;
    if (day === 0) return h < 11.2 ? 5 : 6;
    if (day === 2) return 8;
    if (day === 6 && h < 10.2) return 1;
    return -1;
  }
  const ciDay = () => new Date().toLocaleDateString("en-CA");
  const ciDone = () => (ls.get("b2b.ciDone", {})[ciDay()] || []);
  function checkinCard(today) {
    if (!today || !today.length) return "";
    const done = ciDone(), o = today[0];
    const when = new Date(o.start).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
    return `<div class="ci-card${done.length ? " done" : ""}"><div class="ci-top"><span class="ci-ico" aria-hidden="true">${done.length ? ic("check") : ic("pin")}</span><div><b>${done.length ? "Checked in" : "Check in"}</b><small>${esc(o.title)} · ${esc(when)}${today.length > 1 ? ` · +${today.length - 1} more` : ""}</small></div></div>
      ${done.length ? `<p class="ci-who">${done.map(x => `${esc(x.name)} at ${esc(x.at)}`).join(" · ")}</p>` : `<p class="ci-who">Tap when you arrive. It goes straight to the coaches' register.</p>`}
      <button type="button" class="btn ${done.length ? "" : "primary "}big" data-ciopen data-cig="${esc(o.group_id || "")}" data-cit="${esc(new Date(o.start).toISOString())}">${done.length ? "Check in another child" : "Check in now"}</button></div>`;
  }
  function checkinSheet(gid, start, staff) {
    const me = ls.get("b2b.ciMe", {}), names = me.names || [], gi = ciGuess(gid, start);
    const kids = staff ? (st.players || []).filter(p => !gid || (p.groups || []).includes(gid)) : familyPlayers();
    const self = !staff && A().role === "player" ? myPlayer() : null;
    const defKid = self || (!staff && kids.length === 1 ? kids[0] : null);
    const defName = defKid ? defKid.name : staff ? "" : (A().role === "player" ? (A().name || "") : (names[0] || ""));
    const el = document.createElement("div"); el.className = "ci-sheet"; el.id = "ci-sheet";
    el.innerHTML = `<div class="ci-back" data-ciclose></div><form class="ci-panel" id="ci-form" role="dialog" aria-modal="true" aria-labelledby="ci-h">
      <div class="ci-grab"></div><h2 id="ci-h">Check in</h2>
      ${kids.length > 1 || (staff && kids.length) ? `<div class="ci-kids" role="group" aria-label="Pick a player">${kids.slice(0, 40).map(k => `<button type="button" class="chip" data-cikid="${esc(k.id)}" aria-pressed="${defKid && defKid.id === k.id}">${esc(k.name)}</button>`).join("")}</div>` : ""}
      <input type="hidden" id="ci-pid" value="${esc(defKid ? defKid.id : "")}">
      <div class="field"><label for="ci-name">Child's name</label><input id="ci-name" required maxlength="80" autocomplete="off" list="ci-names" value="${esc(defName)}" placeholder="First and last name"><datalist id="ci-names">${names.map(n => `<option value="${esc(n)}">`).join("")}</datalist></div>
      <div class="field"><label for="ci-sess">Session</label><select id="ci-sess" required><option value="">Choose a session</option>${CI.options.map((v, i) => `<option value="${i}"${i === gi ? " selected" : ""}>${esc(CI.labels[i])}</option>`).join("")}</select></div>
      <div class="field"><label for="ci-phone">Emergency contact number</label><input id="ci-phone" type="tel" required maxlength="20" autocomplete="tel" value="${esc(staff ? "" : (me.phone || ""))}" placeholder="07…"></div>
      <div class="field"><label for="ci-notes">Anything we should know today? <span class="muted">(optional)</span></label><input id="ci-notes" maxlength="300" placeholder="e.g. Had a knock on Tuesday"></div>
      <label class="ci-ready"><input type="checkbox" id="ci-ready" required checked><span>Arrived and ready to train</span></label>
      <button class="btn primary big" type="submit" id="ci-go">Check in ✓</button>
      <p class="ci-msg muted" id="ci-msg" aria-live="polite">Goes to the club's check-in register. <a href="${CI.url}/viewform" target="_blank" rel="noopener">Open the form instead</a></p>
      <iframe name="ci-frame" title="Check-in sender" hidden></iframe></form>`;
    document.body.appendChild(el); document.body.classList.add("ci-open");
    const close = () => { el.remove(); document.body.classList.remove("ci-open"); };
    el.querySelectorAll("[data-ciclose]").forEach(b => b.onclick = close);
    el.querySelectorAll("[data-cikid]").forEach(b => b.onclick = () => { el.querySelectorAll("[data-cikid]").forEach(x => x.setAttribute("aria-pressed", x === b)); const k = kids.find(x => x.id === b.dataset.cikid); q("#ci-pid", el).value = k.id; q("#ci-name", el).value = k.name; });
    q("#ci-name", el).addEventListener("input", () => { const k = kids.find(x => x.name.toLowerCase() === q("#ci-name", el).value.trim().toLowerCase()); q("#ci-pid", el).value = k ? k.id : ""; el.querySelectorAll("[data-cikid]").forEach(x => x.setAttribute("aria-pressed", !!k && x.dataset.cikid === k.id)); });
    document.addEventListener("keydown", function esc1(e) { if (e.key === "Escape") { close(); document.removeEventListener("keydown", esc1); } });
    setTimeout(() => { const f = el.querySelector(defName ? "#ci-phone" : "#ci-name"); if (f && !f.value) f.focus(); }, 50);
    el.querySelector("#ci-form").onsubmit = e => {
      e.preventDefault();
      const name = q("#ci-name", el).value.trim(), si = q("#ci-sess", el).value, phone = q("#ci-phone", el).value.trim(), notes = q("#ci-notes", el).value.trim();
      const msg = q("#ci-msg", el);
      if (!name || si === "" || !phone) { msg.textContent = "Fill in the name, session and number."; msg.className = "ci-msg bad"; return; }
      if (!/^[0-9 +()-]{7,20}$/.test(phone)) { msg.textContent = "Check the phone number."; msg.className = "ci-msg bad"; return; }
      if (!navigator.onLine) { msg.textContent = "You're offline. Try again when you have signal."; msg.className = "ci-msg bad"; return; }
      const post = document.createElement("form"); post.method = "POST"; post.action = CI.url + "/formResponse"; post.target = "ci-frame"; post.hidden = true;
      [[CI.name, name], [CI.session, CI.options[+si]], [CI.phone, phone], [CI.notes, notes], [CI.ready, "YES"]].forEach(([k, v]) => { const i = document.createElement("input"); i.type = "hidden"; i.name = k; i.value = v; post.appendChild(i); });
      el.appendChild(post);
      const btn = q("#ci-go", el); btn.disabled = true; btn.textContent = "Checking in…";
      const pid = q("#ci-pid", el).value, attendanceWrite = pid ? recordAttendance(pid, gid || null, CI.labels[+si]) : Promise.resolve("");
      let ok = false; const finish = async () => { if (ok) return; ok = true;
        const attendanceError = await attendanceWrite;
        if (!el.isConnected) return;
        if (!staff) ls.set("b2b.ciMe", { phone, names: [name].concat(names.filter(n => n !== name)).slice(0, 4) });
        const all = ls.get("b2b.ciDone", {}), day = ciDay(); all[day] = (all[day] || []).concat([{ name, at: new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }), s: CI.labels[+si] }]);
        Object.keys(all).filter(k => k < day).forEach(k => delete all[k]); ls.set("b2b.ciDone", all);
        el.querySelector(".ci-panel").innerHTML = `<div class="ci-grab"></div><div class="ci-ok"><span>✓</span><h2>${esc(name.split(" ")[0])} is checked in</h2><p class="muted">${esc(CI.labels[+si])} · ${esc(new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }))}</p>
          ${attendanceError ? `<p class="ci-msg bad">The Google register was submitted, but in-app attendance could not be saved: ${esc(attendanceError)}</p>` : !pid ? `<p class="ci-msg muted">To also appear under Coaches → Attendance, link a Player Passport.</p>` : ""}
          <button type="button" class="btn primary big" data-ciclose>Done</button><button type="button" class="btn big" data-ciagain>Check in another child</button></div>`;
        el.querySelectorAll("[data-ciclose]").forEach(b => b.onclick = () => { close(); st.onChange("checkin"); });
        el.querySelector("[data-ciagain]").onclick = () => { close(); checkinSheet(gid, start, staff); };
      };
      el.querySelector('iframe[name="ci-frame"]').onload = finish;
      setTimeout(finish, 4000);
      post.submit();
    };
  }
  function bindCheckin(root, staff) { (root || document).querySelectorAll("[data-ciopen]").forEach(b => b.onclick = () => checkinSheet(b.dataset.cig, b.dataset.cit || null, staff)); }

  /* ---------- Player Passport ---------- */
  const PTESTS = { mastery: [{id:"sole",name:"Sole rolls in 30 s (each foot)",lv:[30,45,60]},{id:"taps",name:"Foundation taps in 30 s",lv:[40,60,80]},{id:"slalom",name:"Slalom, 8 cones, both feet (seconds)",lower:true,lv:[null,15,12]},{id:"keepups",name:"Keep-ups (best of three)",lv:[10,30,75]},{id:"moves",name:"Moves to beat a player",pick:true},{id:"turns",name:"Turns on both feet",pick:true},{id:"touch",name:"Directional touches into target (out of 10)",lv:[5,7,9]},{id:"pass",name:"Passes through 2 m gate at 10 m (out of 10 each foot)",lv:[5,7,9]}],
    tech: [{id:"t-sole",name:"Sole rolls in 30 s (each foot)",tg:{"10–12":50,"13–14":65}},{id:"t-slalom",name:"Slalom dribble, 10 cones (seconds)",lower:true,tg:{"10–12":14,"13–14":11}},{id:"t-touch",name:"Directional first touch into 1 m gate (out of 10 each foot)",tg:{"10–12":7,"13–14":9}},{id:"t-side",name:"Side-foot pass through 2 m gate at 15 m (out of 10 each foot)",tg:{"10–12":7,"13–14":9}},{id:"t-driven",name:"Driven pass into 5×5 m zone at 25 m (out of 10)",tg:{"10–12":5,"13–14":8}},{id:"t-lofted",name:"Lofted switch into 5×5 m zone at 30 m (out of 10)",tg:{"10–12":4,"13–14":7}},{id:"t-run30",name:"30 m running with the ball (seconds)",lower:true,tg:{"10–12":6.5,"13–14":5.5}},{id:"t-finish",name:"Finishing into corner targets (out of 10)",tg:{"10–12":5,"13–14":7}},{id:"t-juggle",name:"Juggling, alternating feet",tg:{"10–12":30,"13–14":75}}],
    tech5: [{"id": "k-taps", "name": "Toe taps in 30 s", "lower": false, "tg": {"4–5": 30, "6–7": 45}}, {"id": "k-slalom", "name": "Slalom dribble, 6 cones (seconds)", "lower": true, "tg": {"4–5": 20, "6–7": 15}}, {"id": "k-stop", "name": "Stops on command with the sole (out of 5)", "lower": false, "tg": {"4–5": 3, "6–7": 5}}, {"id": "k-receive", "name": "Receives and controls a rolled pass (out of 10)", "lower": false, "tg": {"4–5": 5, "6–7": 8}}, {"id": "k-pass", "name": "Passes through a 2 m gate at 5 m (out of 10, each foot)", "lower": false, "tg": {"4–5": 5, "6–7": 7}}, {"id": "k-beat", "name": "Beats a walking defender to the end line (out of 5)", "lower": false, "tg": {"4–5": 2, "6–7": 4}}, {"id": "k-shoot", "name": "Shots into a mini goal from 6 m (out of 10)", "lower": false, "tg": {"4–5": 4, "6–7": 6}}, {"id": "k-weak", "name": "Weaker-foot touches in 30 s", "lower": false, "tg": {"4–5": 15, "6–7": 25}}] };
  const PLEVEL = ["", "Bronze", "Silver", "Gold"], PROG_TXT = ["Not started", "Started", "Getting there", "Nearly", "Done"];
  st.players = null; st.pp = {};
  async function loadPlayers(force) {
    if (!sb() || (st.players && !force)) return st.players;
    const { data, error } = await sb().from("players").select("*").order("created_at");
    st.players = error ? [] : (data || []); st.onChange("players"); return st.players;
  }
  const familyPlayers = () => (st.players || []).filter(p => p.parent_id === A().uid || p.user_id === A().uid);
  const myPlayer = () => (st.players || []).find(p => p.user_id === A().uid) || null;
  async function loadPassport(pid, force) {
    if (!force && st.pp[pid] && Date.now() - st.pp[pid].t < 20000) return st.pp[pid];
    const { data, error } = await sb().rpc("passport", { p_player: pid });
    if (!error && data) {
      const extra = await sb().rpc("passport_development", {p_player:pid});
      if (!extra.error && extra.data) data.development = extra.data;
      else data.development_error = extra.error?.message || "Development records unavailable";
    }
    st.pp[pid] = error ? { t: Date.now(), error: error.message } : Object.assign({ t: Date.now() }, data); st.onChange("passport"); return st.pp[pid];
  }
  function weekStart(d) { const x = new Date(d); x.setHours(0, 0, 0, 0); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); return x.getTime(); }
  function spark(vals, lower) {
    if (vals.length < 2) return "";
    const mn = Math.min(...vals), mx = Math.max(...vals), w = 90, h = 26, pts = vals.slice(-8).map((v, i, a) => [Math.round(i * w / (a.length - 1)), Math.round(mx === mn ? h / 2 : (lower ? (v - mn) / (mx - mn) : (mx - v) / (mx - mn)) * (h - 4) + 2)]);
    return `<svg class="pp-spark" viewBox="0 0 ${w} ${h}" aria-hidden="true"><polyline points="${pts.map(p => p.join(",")).join(" ")}"/><circle cx="${pts[pts.length - 1][0]}" cy="${pts[pts.length - 1][1]}" r="3"/></svg>`;
  }
  /* ---------- Player Passport v2: age tiers, XP levels, weekly syllabus missions, quiz, stickers, awards ---------- */
  const MINI_G = ["D47", "TD5"], SENIOR_G = ["U13", "U15", "U12/U13"];
  function ppTier(pl) {
    const yr = new Date().getFullYear() - (new Date().getMonth() < 8 ? 1 : 0); // season year (Sept start)
    if (pl.birth_year) { const age = yr - pl.birth_year; return age <= 7 ? "mini" : age <= 12 ? "junior" : "senior"; }
    const g = pl.groups || []; return g.some(x => MINI_G.includes(x)) ? "mini" : g.some(x => SENIOR_G.includes(x)) ? "senior" : "junior";
  }
  const FOOTBALL_RANKS = ["Street Baller","Game Changer","Rising Star","Playmaker","Wonderkid","Elite Baller","Superstar","Football Icon","GOAT Status","Box to Box Legend"];
  const LEVELS = {
    mini: [[0,"Street Baller","⚽"],[60,"Game Changer","🔥"],[150,"Rising Star","⚡"],[300,"Playmaker","🎯"],[500,"Wonderkid","💎"],[800,"Elite Baller","🏆"],[1200,"Box to Box Legend","🌟"]],
    junior: [[0,"Street Baller","⚽"],[100,"Game Changer","🔥"],[250,"Rising Star","⚡"],[450,"Playmaker","🎯"],[700,"Wonderkid","💎"],[1000,"Elite Baller","🏆"],[1400,"Box to Box Legend","🌟"]],
    senior: [[0,"Street Baller","⚽"],[80,"Game Changer","🔥"],[180,"Rising Star","⚡"],[320,"Playmaker","🎯"],[500,"Wonderkid","💎"],[720,"Elite Baller","🏆"],[980,"Superstar","👑"],[1280,"Football Icon","🌟"],[1620,"GOAT Status","🐐"],[2000,"Box to Box Legend","🏅"]]
  };
  const POSITION_OPTIONS = ["Goalkeeper","Centre Back","Full Back","Wing Back","Defensive Midfielder","Central Midfielder","Attacking Midfielder","Winger","Striker","Defender","Midfielder","Forward","Not sure"];
  const POSITION_CHOICES = (selected) => `<option value="">Not set</option>${POSITION_OPTIONS.map(x=>`<option value="${x}"${selected===x?" selected":""}>${x}</option>`).join("")}`;
  const FORMATS = ["5v5","7v7","9v9","11v11"];
  const FORMAT_CHOICES = (selected) => FORMATS.map(x=>`<option value="${x}"${selected===x?" selected":""}>${x}</option>`).join("");
  const CORNER_CRITERIA = {
    "Technical / Tactical": ["First touch","Passing & receiving","Scanning & decisions","1v1 attacking","1v1 defending","Movement & positioning","Finishing","Ball carrying","Defensive positioning","Pressing & cover","Goalkeeper handling","Goalkeeper distribution","Goalkeeper positioning","Goalkeeper 1v1s","Goalkeeper crosses"],
    "Physical": ["Balance & coordination","Acceleration & deceleration","Agility & change of direction","Movement efficiency","Recovery movement","Explosive footwork"],
    "Psychological": ["Confidence","Resilience after mistakes","Concentration","Decision-making under pressure","Coachability","Composure"],
    "Social": ["Communication","Teamwork","Leadership","Responsibility","Respect & support","Organisation of teammates"]
  };
  const SKILL_AREAS = Object.values(CORNER_CRITERIA).flat();
  const cornerForSkill = skill => { const entry=Object.entries(CORNER_CRITERIA).find(([,skills])=>skills.includes(skill)); return entry?Object.keys(CORNER_CRITERIA).indexOf(entry[0]): /effort|resilien|confidence|composure/i.test(skill)?2:/communication|teamwork|leadership/i.test(skill)?3:/balance|agility|acceleration|physical/i.test(skill)?1:0; };
  const positionCriteria = pos => {
    const p=String(pos||'').toLowerCase();
    if(p.includes('goalkeeper')) return ['Goalkeeper handling','Goalkeeper distribution','Goalkeeper positioning','Goalkeeper 1v1s','Goalkeeper crosses','Explosive footwork','Communication','Composure'];
    if(p.includes('centre back')||p==='defender') return ['Defensive positioning','1v1 defending','Scanning & decisions','Passing & receiving','Recovery movement','Communication'];
    if(p.includes('full back')||p.includes('wing back')) return ['1v1 defending','Passing & receiving','Movement & positioning','Acceleration & deceleration','Teamwork'];
    if(p.includes('defensive midfielder')) return ['Scanning & decisions','Pressing & cover','Passing & receiving','Defensive positioning','Composure'];
    if(p.includes('central midfielder')||p==='midfielder') return ['Scanning & decisions','Passing & receiving','First touch','Movement & positioning','Decision-making under pressure'];
    if(p.includes('attacking midfielder')) return ['Scanning & decisions','First touch','Finishing','Passing & receiving','Confidence'];
    if(p.includes('winger')) return ['1v1 attacking','Ball carrying','Finishing','Acceleration & deceleration','Confidence'];
    if(p.includes('striker')||p==='forward') return ['Finishing','Movement & positioning','First touch','Decision-making under pressure','Resilience after mistakes'];
    return ['First touch','Scanning & decisions','Balance & coordination','Confidence','Teamwork'];
  };
  function suggestedTargets(pos, age, format) {
    const simple = age != null && age <= 10;
    const role = {
      "Goalkeeper": ["Set your feet before each shot and make a balanced save","Choose a safe pass or throw to start an attack"],
      "Centre Back": ["Scan for runners and stay goal-side when defending","Receive side-on and find a forward passing option"],
      "Full Back": ["Show your winger outside and recover goal-side","Offer width and choose when to overlap"],
      "Wing Back": ["Recover into your defensive position when possession changes","Make a timed forward run to support the attack"],
      "Defensive Midfielder": ["Scan before receiving and play away from pressure","Protect central space when the ball is lost"],
      "Central Midfielder": ["Check both shoulders before receiving","Support the ball with a new passing angle after each pass"],
      "Attacking Midfielder": ["Find space between defenders to receive facing forward","Create a shooting or passing chance near the box"],
      "Winger": ["Look up before choosing to dribble, pass or cross","Recover to support your defender when the ball is lost"],
      "Striker": ["Time a run away from your marker into scoring space","Press the nearest defender and block a passing lane"]
    };
    const base = role[pos] || ["Scan before receiving and choose your next action","Move into space to help your team in attack and defence"];
    const young = simple ? ["Look up and find a teammate before passing","Try a skill, then get back to help your team"] : base;
    return [
      {category:"training",text:young[0]},
      {category:"training",text:young[1]},
      {category:"training",text:format==="11v11"?"Recognise when to press, cover and recover with your unit":format==="9v9"?"Use width and depth to support teammates": "Find space, ask for the ball and try different decisions"},
      {category:"match",text:young[0]},
      {category:"match",text:format==="11v11"?"Stay connected to your unit during attacking and defensive transitions":format==="9v9"?"React quickly when possession changes and recover into shape":"Help attack and defend whenever possession changes"}
    ];
  }
  const XP = { att: 10, home: 15, quiz: 10, ok: 25, star: 20, potw: 50, target: 30, goal: 10, match: 15 };
  const SKILL_EMO = [[/dribbl|driv|car/i, "🚗"], [/turn|rocket/i, "🚀"], [/shoot|finish|goal/i, "🎯"], [/pass/i, "🎁"], [/sole/i, "👟"], [/receiv|control|first touch/i, "🧲"], [/defend|tackl|recover|press/i, "🛡️"], [/juggl|keep/i, "🤹"], [/speed|run|agil/i, "⚡"], [/move|space|scan/i, "👀"], [/1v1|beat|fake|feint/i, "🌀"], [/head/i, "🧠"]];
  const skillEmo = s => { const t = String(s || ""); const f = SKILL_EMO.find(([r]) => r.test(t)); return f ? f[1] : "⚽"; };
  function levelOf(tier, xp) {
    const L = LEVELS[tier]; let i = 0; while (i + 1 < L.length && xp >= L[i + 1][0]) i++;
    const cur = L[i], nxt = L[i + 1];
    return { i, n: i + 1, name: cur[1], mark: cur[2] || "", next: nxt ? nxt[1] : null, nextMark: nxt ? (nxt[2] || "") : "", need: nxt ? nxt[0] - xp : 0, pct: nxt ? Math.round((xp - cur[0]) * 100 / (nxt[0] - cur[0])) : 100 };
  }
  function ppStats(P) {
    const days = [...new Set((P.attendance || []).map(a => a.d))].sort().reverse();
    const weeks = new Set(days.map(d => weekStart(d + "T12:00:00")));
    let streak = 0, w = weekStart(new Date()); if (!weeks.has(w)) w -= 7 * 864e5;
    while (weeks.has(w)) { streak++; w -= 7 * 864e5; }
    const now = new Date(), seasonYear = now.getFullYear() - (now.getMonth() < 8 ? 1 : 0);
    const season = days.filter(d => d >= `${seasonYear}-09-01` && d < `${seasonYear + 1}-09-01`).length;
    const byWeek = {}; (P.attendance || []).forEach(a => { const k = weekStart(a.d + "T12:00:00"); (byWeek[k] = byWeek[k] || new Set()).add(a.d); });
    const busiest = Math.max(0, ...Object.values(byWeek).map(s => s.size));
    const tests = {};
    (P.scores || []).forEach(r => { (tests[r.test] = tests[r.test] || { name: r.name, prog: r.prog, rows: [] }).rows.push(r); });
    const defs = Object.values(PTESTS).flat(), band = P.band;
    const skill = Object.entries(tests).map(([id, t]) => { const def = defs.find(x => x.id === id) || { name: t.name }, vals = t.rows.map(r => +r.v);
      const best = def.lower ? Math.min(...vals) : Math.max(...vals), last = vals[vals.length - 1], first = vals[0];
      let level = 0; if (def.lv) def.lv.forEach((th, i) => { if (th != null && (def.lower ? best <= th : best >= th)) level = i + 1; });
      const target = def.tg && band && def.tg[band] != null ? def.tg[band] : null, hit = target != null && (def.lower ? best <= target : best >= target);
      return { id, name: def.name || t.name, best, last, first, n: vals.length, vals, level, target, hit, lower: !!def.lower, pick: !!def.pick }; });
    const W = P.weeks || [], A = P.awards || [];
    const homes = W.filter(x => x.home).length, quizzes = W.filter(x => (x.quiz || 0) >= 2).length, oks = W.filter(x => x.ok);
    const stars = A.filter(a => a.kind === "star").length, potw = A.filter(a => a.kind === "potw");
    const tdone = (P.targets || []).filter(t => t.done).length, gdone = (P.goals || []).filter(g => g.done).length;
    const M = P.matches || [], confirmedMatches = M.filter(m => m.ok === true), sum = k => confirmedMatches.reduce((a, m) => a + (+m[k] || 0), 0), rated = confirmedMatches.filter(m => m.rating);
    const mt = { games: confirmedMatches.filter(m => m.minutes == null || Number(m.minutes) > 0).length, minutes: sum("minutes"), goals: sum("goals"), assists: sum("assists"), saves: sum("saves"), checked: M.filter(m => m.ok).length, rating: rated.length ? Math.round(rated.reduce((a, m) => a + m.rating, 0) / rated.length * 10) / 10 : null };
    const xp = days.length * XP.att + homes * XP.home + quizzes * XP.quiz + oks.length * XP.ok + stars * XP.star + potw.length * XP.potw + tdone * XP.target + gdone * XP.goal + mt.checked * XP.match;
    const tier = ppTier(P.player), lvl = levelOf(tier, xp);
    // unlocks: [label, emoji (little ones), icon, unlocked, how to unlock]
    const B = [];
    const add = (t, e, i, on, how, k) => B.push({ t, e, i, on: !!on, how, k: k || "" });
    add("First session", "🎉", "ball", days.length >= 1, "Come to a session");
    add("5 sessions", "⭐", "medal b", days.length >= 5, "Come to 5 sessions");
    add("10 sessions", "🌈", "medal s", days.length >= 10, "Come to 10 sessions");
    add("25 sessions", "🏅", "medal g", days.length >= 25, "Come to 25 sessions");
    add("50 sessions", "👑", "trophy g", days.length >= 50, "Come to 50 sessions");
    add("3-week streak", "🔥", "flame", streak >= 3, "Train 3 weeks in a row");
    add("8-week streak", "🌋", "flame g", streak >= 8, "Train 8 weeks in a row");
    add("Double week", "✌️", "repeat", busiest >= 2, "Two sessions in one week");
    add("Every-day baller", "💪", "bolt", busiest >= 3, "Three sessions in one week");
    add("Home hero", "🏠", "home", homes >= 1, "Do a home challenge");
    add("Home legend", "🏡", "home g", homes >= 5, "Do 5 home challenges");
    add("Quiz whizz", "🧠", "brain", quizzes >= 1, "Pass a weekly quiz");
    add("Brain box", "🎓", "cap", quizzes >= 5, "Pass 5 weekly quizzes");
    add("Skill unlocked", "🔓", "check", oks.length >= 1, "Coach signs off a weekly skill");
    add("Star of the session", "🌟", "star", stars >= 1, "Coach gives you a star");
    add("Player of the week", "🏆", "trophy", potw.length >= 1, "Be named player of the week");
    if (skill.length) { add("Bronze skill", "🥉", "medal b", skill.some(x => x.level >= 1 || x.hit), "Reach bronze in a skills test"); add("Gold skill", "🥇", "medal g", skill.some(x => x.level >= 3), "Reach gold in a skills test"); }
    add("First match", "👕", "ball", mt.games >= 1, "Play in a match and have the appearance confirmed by your coach");
    // Position-specific rewards: goalkeepers earn keeping milestones, not striker goals.
    const primaryRole = String(P.player?.position || P.development?.primary_position || "").toLowerCase();
    const isKeeper = primaryRole === "goalkeeper";
    if (isKeeper) {
      const gkMatches = confirmedMatches.filter(m => m.minutes == null || Number(m.minutes) > 0);
      const matchSaves = gkMatches.map(m => Number(m.saves || 0));
      add("First save", "🧤", "shield", mt.saves >= 1, "Record your first coach-checked match save");
      add("Safe hands", "🧤", "shield", mt.saves >= 10, "Make 10 coach-checked saves across matches");
      add("Shot stopper", "🛑", "shield", matchSaves.some(n => n >= 5), "Record 5 saves in one coach-checked match");
      add("Wall of the match", "🧱", "medal g", matchSaves.some(n => n >= 8), "Record 8 saves in one coach-checked match");
      add("25-save club", "🥇", "trophy g", mt.saves >= 25, "Record 25 coach-checked saves across matches");
      // A clean sheet cannot be inferred from saves or goals scored. Add only when explicitly recorded.
      const cleanSheets = gkMatches.filter(m => m.clean_sheet === true || m.clean_sheet === 1 || m.clean_sheet === "true").length;
      add("Clean sheet", "🔒", "shield", cleanSheets >= 1, "Keep a coach-checked clean sheet");
    } else {
      const defender = /defender|back/.test(primaryRole);
      const midfield = /midfield/.test(primaryRole);
      const attacker = /striker|winger|forward/.test(primaryRole);
      if (defender) {
        add("Defensive debut", "🛡️", "shield", mt.games >= 1, "Have your first appearance checked by a coach");
        add("Reliable defender", "🧱", "shield", mt.games >= 5, "Have 5 appearances checked by a coach");
        add("Defensive consistency", "🏅", "medal g", mt.games >= 10, "Have 10 appearances checked by a coach");
      } else if (midfield) {
        add("First assist", "🎯", "target", mt.assists >= 1, "Record your first coach-checked assist");
        add("Playmaker", "🅰️", "star", mt.assists >= 5, "Record 5 coach-checked assists");
        add("Midfield regular", "🏅", "medal g", mt.games >= 5, "Have 5 appearances checked by a coach");
      } else if (attacker) {
        add("First goal", "⚽", "target", mt.goals >= 1, "Score in a coach-checked match");
        add("Hat-trick", "🎩", "star g", confirmedMatches.some(m => (m.goals || 0) >= 3), "Score 3 in one coach-checked match");
        add("Goal contributor", "⚡", "star", mt.goals + mt.assists >= 5, "Record 5 combined goals and assists");
      } else {
        add("First goal", "⚽", "target", mt.goals >= 1, "Score in a coach-checked match");
        add("First assist", "🅰️", "star", mt.assists >= 1, "Record an assist");
      }
    }
    add("Coach-checked x5", "✅", "check", mt.checked >= 5, "5 games checked by a coach");
    add("Target smashed", "🎯", "target", tdone >= 1, "Finish a coach target");
    add("Goal reached", "🚩", "flag", gdone >= 1, "Tick off one of your goals");
    // skill cards: every week the coach signed off
    const cards = []; oks.forEach(x => { if (!cards.some(c => c.skill === x.skill)) cards.push({ skill: x.skill || x.title, title: x.title, date: x.date, prog: x.prog }); });
    const wkStart = new Date(weekStart(new Date())).toLocaleDateString("en-CA");
    return { total: days.length, season, streak, days, skill, badges: B, earned: B.filter(b => b.on).length, xp, tier, lvl, cards, stars, potw, potwNow: potw.find(a => a.week >= wkStart), homes, quizzes, busiest, mt };
  }
  const weekRow = (P, m) => (P.weeks || []).find(w => w.prog === m.prog && w.date === m.date) || {};
  const fmtShort = d => new Date(d + "T12:00:00").toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
  function missionCard(P, m, tier, o) {
    const w = weekRow(P, m), fam = P.player.is_parent || P.player.is_me, coach = !!o.coach, mini = tier === "mini";
    const when = m.done ? `${fmtShort(m.date)}` : `Coming up ${fmtShort(m.date)}`;
    const head = mini ? `<div class="pm-hero"><span class="pm-emo" aria-hidden="true">${skillEmo((m.theme || "") + " " + m.skill)}</span><div><b>${esc(m.theme || m.skill || m.title)}</b><small>We're learning: ${esc(m.skill || "")}</small></div></div>`
      : `<div class="pm-top"><b>${esc(m.skill || m.title)}</b><small>${esc(m.title || "")}</small></div>`;
    const word = mini && m.word ? `<div class="pm-word"><small>Magic word</small><b>“${esc(m.word)}”</b></div>` : "";
    const obj = !mini && m.objective ? `<p class="pm-obj">${esc("Aim: " + String(m.objective).replace(/^By the end,?\s*/i, "").replace(/^players can/i, "you can"))}</p>` : "";
    const pts = !mini && (m.points || []).length ? `<div class="pm-pts">${m.points.slice(0, tier === "senior" ? 3 : 2).map(p => `<span>${esc(p)}</span>`).join("")}</div>` : "";
    const step = (k, ico, emo, label, done, btn) => `<div class="pm-step${done ? " on" : ""}"><span class="pm-si" aria-hidden="true">${done ? (mini ? "✅" : ic("check")) : mini ? emo : ic(ico)}</span><span class="pm-sl"><b>${label}</b>${btn || ""}</span></div>`;
    const homeBtn = m.home ? `<small>${esc(m.home)}</small>${(fam || coach) && m.done !== undefined ? `<button type="button" class="chip pm-btn" data-mhome="${esc(m.prog)}|${esc(m.date)}|${w.home ? 0 : 1}">${w.home ? "Undo" : mini ? "We did it!" : "I did it"}</button>` : ""}` : `<small>No home challenge this week</small>`;
    const qn = (w.quiz || 0), n = (w.home ? 1 : 0) + (qn >= 2 ? 1 : 0) + (w.ok ? 1 : 0), quizBtn = `<small>${qn >= 2 ? `Passed · ${qn} right` : mini ? "Two quick questions with a grown-up" : "3 quick questions on this week"}</small>${fam || coach ? `<button type="button" class="chip pm-btn" data-mquiz="${esc(m.prog)}|${esc(m.date)}">${qn >= 2 ? "Try again" : "Start"}</button>` : ""}`;
    const okBtn = `<small>${w.ok ? `Signed off${w.coach ? " by " + esc(w.coach) : ""}` : m.done ? (mini ? "Your coach gives you this sticker" : "Your coach signs this off") : "After the session"}</small>${coach && m.done ? `<button type="button" class="chip pm-btn${w.ok ? "" : " go"}" data-mok="${esc(m.prog)}|${esc(m.date)}|${w.ok ? 0 : 1}">${w.ok ? "Undo" : "Got it ✓"}</button>` : ""}`;
    const key = "pm:" + P.player.id + ":" + m.prog + ":" + m.date, isOpen = st.folds[key] != null ? st.folds[key] : !!o.first && !o.compact;
    return `<details class="pm pm-${tier}" data-fold="${esc(key)}"${isOpen ? " open" : ""}><summary class="pm-sum"><span class="pm-se" aria-hidden="true">${mini ? skillEmo((m.theme || "") + " " + m.skill) : ic(n === 3 ? "check" : "ball")}</span><span class="pm-sm"><small>${esc(gname(m.group))} · ${esc(when)}</small><b>${esc(mini ? (m.theme || m.skill) : (m.skill || m.title))}</b></span><span class="pm-sn${n === 3 ? " on" : ""}">${n}/3</span><i class="fd-chev" aria-hidden="true"></i></summary>
      ${m.block_name ? `<div class="pm-k"><span class="muted">${esc(m.block_name)}${m.week ? ` · week ${esc(m.week)}` : ""}</span></div>` : ""}
      ${head}${word}${obj}${pts}
      <div class="pm-steps">${step("home", "home", "🏠", mini ? "Practise at home" : "Home challenge", w.home, homeBtn)}${step("quiz", "brain", "🧠", mini ? "Magic quiz" : "Weekly quiz", qn >= 2, quizBtn)}${step("ok", "medal", "🎖️", mini ? "Coach sticker" : "Coach sign-off", w.ok, okBtn)}</div>
      <div class="pm-bar" aria-label="${n} of 3 done"><i style="width:${Math.round(n * 100 / 3)}%"></i><span>${n === 3 ? (mini ? "All done! 🎉" : "Week complete") : `${n} of 3 done`}</span></div>
    </details>`;
  }
  function passportView(pid, o) {
    o = o || {};
    const P = st.pp[pid];
    if (!P) { loadPassport(pid); return `<div class="card empty">Loading passport…</div>`; }
    if (P.error) return `<div class="card empty">Couldn't load this passport: ${esc(P.error)}</div>`;
    if (Date.now() - P.t > 20000) setTimeout(() => loadPassport(pid));
    const pl = P.player, S = ppStats(P), open = st.ppOpen || "", coach = !!o.coach, fam = pl.is_parent || pl.is_me, tier = S.tier, mini = tier === "mini", L = S.lvl;
    const displayName = pl.preferred_name || pl.name;
    const age = pl.birth_year ? `Born ${pl.birth_year}` : "";
    const tile = (k, ico, title, line, hot) => `<button type="button" class="ct pp-t${hot ? " hot" : ""}${open === k ? " sel" : ""}" data-ppopen="${k}" aria-expanded="${open === k}"><span class="ct-ico" aria-hidden="true">${ic(ico)}</span><b>${title}</b><small>${line}</small></button>`;
    const playerAge = pl.birth_year ? new Date().getFullYear() - Number(pl.birth_year) : null;
    const D = P.development || {}, matchFormat = D.match_format || (playerAge == null ? "9v9" : playerAge >= 13 ? "11v11" : playerAge >= 11 ? "9v9" : playerAge >= 9 ? "7v7" : "5v5");
    const ageBand = playerAge == null ? 1 : playerAge <= 11 ? 0 : playerAge <= 14 ? 1 : 2;
    const roleGuidance = {
      "Goalkeeper": [["Get ready on your toes and watch the ball", "Use your hands safely and protect the goal", "Look for a teammate before throwing or passing"],["Adjust your starting position as the ball moves", "Communicate early with your defenders", "Choose when to play short or clear danger"],["Organise the defensive line and cover space behind it", "Recognise pressing triggers before distributing", "Control the box, crosses and 1v1 situations"]],
      "Centre Back": [["Stay goal-side of your opponent", "Look over your shoulder before receiving", "Pass into space for a teammate"],["Protect the middle and cover your defensive partner", "Scan for runners behind the line", "Step in to intercept when you have cover"],["Manage the defensive line and communicate distances", "Break opposition lines with purposeful passes", "Decide when to hold, step or recover against counterattacks"]],
      "Full Back": [["Stay wide to give your team a passing option", "Track the winger when your team loses the ball", "Pass forwards when it is safe"],["Choose when to overlap or stay to protect", "Show opponents away from goal", "Support your winger with passing angles"],["Recognise underlap and overlap opportunities", "Defend the far post when play is opposite", "Balance attacking support with rest-defence"]],
      "Wing Back": [["Use the touchline to make the pitch wide", "Run back quickly when possession is lost", "Look up before crossing or passing"],["Time forward runs when the ball is secure", "Recover into the defensive line quickly", "Create 2v1s with the wide midfielder"],["Control high and low positioning with the back line", "Attack space behind the opposing full back", "Recognise pressing and recovery triggers"]],
      "Defensive Midfielder": [["Find space between your defenders and attackers", "Check your shoulders before the ball arrives", "Help protect the middle when defending"],["Receive side-on and play away from pressure", "Screen passes into the opposition striker", "Support both sides to help your team switch play"],["Control tempo and identify line-breaking passes", "Protect central spaces during attacking transitions", "Communicate pressing cover and midfield balance"]],
      "Central Midfielder": [["Move to help a teammate on the ball", "Check over both shoulders before receiving", "Pass and move to find a new space"],["Receive on the half-turn when possible", "Support play ahead of and behind the ball", "React quickly to win back possession"],["Set the tempo and switch play when one side is crowded", "Make third-player runs to break lines", "Recognise when to press, screen or recover"]],
      "Attacking Midfielder": [["Find space between opponents", "Look forward before passing", "Support the striker when attacking"],["Receive between the opposition lines", "Turn or combine quickly under pressure", "Arrive near the box for cut-backs"],["Scan before entering pockets of space", "Create chances with disguise and final-third decisions", "Lead counter-pressing after losing the ball"]],
      "Winger": [["Stay wide to make room for teammates", "Try to beat your defender or combine with a pass", "Run back to help defend"],["Choose when to attack outside or cut inside", "Make runs behind the defence", "Press the full back and protect your own side"],["Time runs to exploit space behind the back line", "Select the right cross, cut-back or shot", "Coordinate pressing with the striker and full back"]],
      "Striker": [["Move into space where you can score", "Look at the goal before shooting", "Try to win the ball back when it is lost"],["Move across defenders and time runs in behind", "Hold the ball up to bring teammates into play", "Attack the near or far post with purpose"],["Use double movements to lose markers", "Link attacks with one-touch combinations", "Lead the press and recognise when to block passing lanes"]],
      "Defender": [["Stay between the attacker and your goal", "Watch the ball and the player", "Pass to a teammate when you win it"],["Defend space as well as your opponent", "Scan for runners and support cover", "Start attacks with controlled passes"],["Organise distances and defend transitions", "Recognise when to press or delay", "Play through pressure when safe"]],
      "Midfielder": [["Find space and ask for the ball", "Look around before receiving", "Help both attack and defence"],["Receive on the half-turn and support angles", "Switch play when one side is crowded", "React to changes of possession"],["Control tempo and connect the units", "Break lines through movement and passing", "Balance pressing with defensive cover"]],
      "Forward": [["Find space near the opposition goal", "Look up before shooting or passing", "Help press when the other team has the ball"],["Time runs behind the defence", "Combine with teammates to create chances", "Make good decisions around the box"],["Disrupt defenders with varied movements", "Create and finish high-quality chances", "Lead pressing and counter-pressing"]],
      "Not sure": [["Try different positions and enjoy learning", "Look for space when your team has the ball", "Help win it back when your team loses it"],["Scan before receiving", "Support teammates with passing angles", "Understand your role in attack and defence"],["Recognise spaces and passing options", "Communicate and help organise teammates", "Adapt your decisions to different roles"]]
    };
    const learningPosition = roleGuidance[pl.position] ? pl.position : "Not sure";
    const positionAreas = roleGuidance[learningPosition][ageBand];
    const suggested = suggestedTargets(learningPosition,playerAge,matchFormat);
    const formatTips = matchFormat === "11v11" ? ["Keep your shape within your unit and the full team", "Check distances to teammates across the bigger pitch", "Recognise when to press, cover or recover in transition"] : matchFormat === "9v9" ? ["Stay connected to teammates as the pitch gets bigger", "Use width and depth to create passing options", "React quickly when your team wins or loses possession"] : matchFormat === "7v7" ? ["Find width and depth to help your team", "Look for a passing option before dribbling", "Recover quickly when possession changes"] : ["Get lots of touches and try different positions", "Find space and help teammates", "Attack and defend together"];
    const ageGuidance = playerAge == null ? "Add a birth year for age-specific guidance" : `Age ${playerAge} · ${matchFormat}`;
    const positionBullets = (arr) => `<ul style="margin:10px 0 0;padding-left:20px;line-height:1.7">${arr.map(t=>`<li>${esc(t)}</li>`).join("")}</ul>`;
    const activeT = (P.targets || []).filter(t => !t.done);
    const trainingT = activeT.filter(t => (t.category || "training") === "training");
    const matchT = activeT.filter(t => t.category === "match");
    const ppTab = st.ppTab || "progress";
    const missions = (P.missions || []).slice().sort((a, b) => (b.done - a.done) || (a.done ? String(b.date).localeCompare(String(a.date)) : String(a.date).localeCompare(String(b.date))));
    let panel = "";
    if (open === "att") panel = `<div class="card pp-panel"><h3 class="cpd-h">Attendance</h3>
      <div class="pp-weeks">${Array.from({ length: 12 }, (_, i) => { const w = weekStart(new Date()) - (11 - i) * 7 * 864e5, n = S.days.filter(d => weekStart(d + "T12:00:00") === w).length; return `<i class="${n ? "on" : ""}${n > 1 ? " x" + Math.min(n, 3) : ""}" title="${new Date(w).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}: ${n} session${n === 1 ? "" : "s"}"></i>`; }).join("")}</div>
      <p class="muted" style="margin:0;font-size:13px">Last 12 weeks · darker squares mean more than one session that week.</p>
      ${S.days.slice(0, 8).map(d => { const a = P.attendance.filter(x => x.d === d); return `<div class="pp-row"><span>${esc(fmtShort(d))}</span><small>${esc(a.map(x => x.l || gname(x.g) || "").filter(Boolean).join(", "))}</small></div>`; }).join("") || `<p class="muted" style="margin:0">No sessions yet.</p>`}</div>`;
    else if (open === "skills") panel = `<div class="card pp-panel"><h3 class="cpd-h">${mini ? "Skill cards" : "Skills"}</h3>
      ${S.cards.length ? `<div class="pp-cards">${S.cards.map(c => `<div class="pp-scard"><span aria-hidden="true">${mini ? skillEmo(c.skill + " " + c.title) : ic("check")}</span><b>${esc(c.skill)}</b><small>${esc(fmtShort(c.date))}</small></div>`).join("")}</div>` : `<p class="muted" style="margin:0">${mini ? "When your coach gives you a sticker for this week's skill, the card goes here." : "Each week your coach signs off a skill, it's unlocked here."}</p>`}
      ${S.skill.length ? `<h3 class="cpd-h" style="margin-top:6px">Skills tests</h3>${S.skill.map(x => `<div class="pp-skill"><div><b>${esc(x.name)}</b><small>${x.pick ? `${x.best} learned` : `Best ${x.best}${x.n > 1 ? ` · started ${x.first}` : ""}`}${x.target != null ? ` · target ${x.target}` : ""}</small></div>${spark(x.vals, x.lower)}<span class="pp-lv l${x.level}${x.hit ? " hit" : ""}">${x.level ? PLEVEL[x.level] : x.hit ? "Target ✓" : x.target != null ? "Working on it" : "—"}</span></div>`).join("")}` : coach && !pl.squad_id ? `<p class="muted" style="margin:0;font-size:13px">Link this passport to the squad list below to show test scores.</p>` : ""}</div>`;
    else if (open === "targets") panel = `<div class="card pp-panel"><h3 class="cpd-h">Coach targets</h3><p class="muted" style="font-size:13px">Set training and match goals separately, tailored to this player.</p>${(P.targets || []).map(t => `<div class="pp-target${t.done ? " done" : ""}"><div class="pp-tt"><b>${esc(t.text)}</b><small>${t.category === "match" ? "MATCH" : "TRAINING"}</small>${t.coach ? `<small>Set by ${esc(t.coach)}</small>` : ""}</div>
        <div class="pp-dots" aria-label="${PROG_TXT[t.done ? 4 : t.progress]}">${[1, 2, 3].map(n => coach ? `<button type="button" class="${(t.done || t.progress >= n) ? "on" : ""}" data-tprog="${t.id}:${n}" aria-label="Set progress ${PROG_TXT[n]}"></button>` : `<i class="${(t.done || t.progress >= n) ? "on" : ""}"></i>`).join("")}<span>${PROG_TXT[t.done ? 4 : t.progress]}</span></div>
        ${t.note ? `<p class="pp-note">${ic("chat")} ${esc(t.note)}</p>` : ""}
        ${coach ? `<div class="pp-tact">${t.done ? `<button type="button" class="linkbtn" data-tdone="${t.id}:0">Reopen</button>` : `<button type="button" class="btn small" data-tdone="${t.id}:1">✓ Done</button>`}<button type="button" class="linkbtn" data-tnote="${t.id}">Feedback</button><button type="button" class="linkbtn" data-tdel="${t.id}">Remove</button></div>` : ""}</div>`).join("") || `<p class="muted" style="margin:0">${coach ? "Set 1–3 targets for this player." : "Your coach will set targets here."}</p>`}
      ${coach ? `<form class="pp-add" id="pp-tform"><select id="pp-tcategory" aria-label="Goal type"><option value="training">Training goal</option><option value="match">Match goal</option></select><textarea id="pp-tnew" rows="3" maxlength="200" aria-label="Describe the individual goal" placeholder="${mini ? "e.g. Use both feet" : "e.g. Scan before receiving, then play forwards"}" required></textarea><button type="submit" class="btn primary">Add target</button></form>` : ""}</div>`;
    else if (open === "reflection") panel = `<div class="card pp-panel"><h3 class="cpd-h">My football reflection</h3><p class="muted">After training or a match, tell your coach what you learned.</p>${fam?`<form id="pp-reflection" class="pp-kidform"><div class="field"><label>Session</label><select id="pd-ref-type"><option value="training">Training</option><option value="match">Match</option></select></div><div class="field"><label>What went well?</label><textarea id="pd-ref-good" rows="3" maxlength="300" required></textarea></div><div class="field"><label>What will I improve next?</label><textarea id="pd-ref-next" rows="3" maxlength="300" required></textarea></div><button type="submit" class="btn primary">Save reflection</button></form>`:""}${(D.reflections||[]).slice(0,8).map(r=>`<div class="pp22-goal"><div><b>${esc(r.kind)} · ${esc(String(r.created_at||"").slice(0,10))}</b><small>Went well: ${esc(r.went_well)}</small><small>Next: ${esc(r.improve_next)}</small></div></div>`).join("")}</div>`;
    else if (open === "development") panel = `<div class="card pp-panel"><h3 class="cpd-h">Player development controls</h3>
      ${coach ? `<form id="pp-development-form" class="pp-kidform">
      <div class="field"><label>Primary position</label><select id="pd-primary">${POSITION_CHOICES(pl.position)}</select></div>
      <div class="field"><label>Secondary position</label><select id="pd-secondary">${POSITION_CHOICES(D.secondary_position)}</select></div>
      <div class="field"><label>Match format</label><select id="pd-format">${FORMAT_CHOICES(matchFormat)}</select></div>
      <button type="submit" class="btn primary">Save football profile</button><p id="pd-msg" class="gmsg"></p></form>` : `<p>Primary: ${esc(learningPosition)} · Secondary: ${esc(D.secondary_position||"None")} · ${esc(matchFormat)}</p>`}
      <h4>Suggested individual targets</h4><p class="muted">Coach reviews and adds suitable goals. Suggestions do not automatically award XP.</p>
      ${suggested.map((g,i)=>`<div class="pp22-goal"><div><b>${esc(g.text)}</b><small>${g.category.toUpperCase()} · ${esc(learningPosition)}</small></div>${coach?`<button type="button" class="btn small" data-pd-suggest="${i}">Add goal</button>`:""}</div>`).join("")}
      <h4>Four Corner coach assessment</h4>${coach ? `<form id="pp-assess-form" class="pp-kidform"><div class="field"><label>Skill area</label><select id="pd-skill">${[...new Set([...positionCriteria(learningPosition),...SKILL_AREAS])].map(x=>`<option>${esc(x)}</option>`).join("")}</select></div><div class="field"><label>Rating (1 developing – 5 consistently demonstrated)</label><select id="pd-rating">${[1,2,3,4,5].map(n=>`<option value="${n}">${n} / 5</option>`).join("")}</select></div><div class="field"><label>Evidence / coaching note</label><textarea id="pd-assess-note" maxlength="400" rows="3" placeholder="What did you observe?"></textarea></div><button class="btn primary" type="submit">Save assessment</button></form>`:""}
      ${(D.assessments||[]).slice(0,12).map(a=>`<div class="pp22-goal"><div><b>${esc(a.skill)} · ${a.rating}/5</b><small>${esc(String(a.created_at||"").slice(0,10))} · ${esc(a.note||"No note")}</small></div></div>`).join("")}
      <h4>Match objective review</h4>${coach?`<form id="pp-match-review" class="pp-kidform"><div class="field"><label>Match / date</label><input id="pd-match" maxlength="100" placeholder="e.g. Sunday vs opposition" required></div><div class="field"><label>Match objective</label><select id="pd-review-target"><option value="">General match review</option>${(P.targets||[]).filter(t=>(t.category||"training")==="match").map(t=>`<option value="${esc(t.id)}">${esc(t.text)}</option>`).join("")}</select></div><div class="field"><label>Review</label><select id="pd-result"><option value="achieved">Objective achieved</option><option value="developing">Still developing</option><option value="not_observed">Not observed</option></select></div><div class="field"><label>Coach feedback</label><textarea id="pd-review-note" maxlength="400" rows="3" required></textarea></div><button class="btn primary">Save match review</button></form>`:""}
      ${(D.reviews||[]).slice(0,8).map(r=>`<div class="pp22-goal"><div><b>${esc(r.match_label)} · ${esc(r.target_text||"General review")} · ${esc(r.outcome.replaceAll("_"," "))}</b><small>${esc(r.note||"")}</small></div></div>`).join("")}
      </div>`;
    else if (open === "home") panel = `<div class="card pp-panel"><h3 class="cpd-h">My goals</h3>${(P.goals || []).map(g => `<label class="pp-goal${g.done ? " done" : ""}"><input type="checkbox" data-gdone="${g.id}" ${g.done ? "checked" : ""} ${fam ? "" : "disabled"}><span>${esc(g.text)}</span>${fam ? `<button type="button" class="linkbtn" data-gdel="${g.id}" aria-label="Remove goal">×</button>` : ""}</label>`).join("") || `<p class="muted" style="margin:0">${fam ? "Add a goal you want to reach this season." : "No goals yet."}</p>`}
      ${fam ? `<form class="pp-add" id="pp-gform"><input id="pp-gnew" maxlength="140" placeholder="${mini ? "e.g. 10 toe taps in a row" : "e.g. 50 keep-ups by Christmas"}" required><button class="btn primary small">Add goal</button></form>` : ""}</div>`;
    else if (open === "badges") panel = `<div class="card pp-panel"><h3 class="cpd-h">${mini ? "Sticker book" : "Unlocks"}</h3><p class="muted" style="margin:0;font-size:13px">${S.earned} of ${S.badges.length} unlocked. Tap a locked one to see how to get it. ${String(pl.position||"").toLowerCase()==="goalkeeper" ? "Goalkeeper rewards focus on saves and protecting the goal." : "Rewards match your playing position."}</p>
      <div class="pp-badges${mini ? " stickers" : ""}">${S.badges.map(b => `<button type="button" class="pp-badge${b.on ? " on" : ""}" data-how="${esc(b.on ? b.t + " ✓" : b.how)}"><span class="pp-bi ${b.i.split(" ")[1] || ""}">${mini ? (b.on ? b.e : "❔") : b.on ? ic(b.i.split(" ")[0]) : ic("lock")}</span><small>${esc(b.t)}</small></button>`).join("")}</div>
      <h3 class="cpd-h" style="margin-top:6px">${mini ? "How I grow" : "Levels"}</h3><div class="pp-ladder">${LEVELS[tier].map((l, i) => `<span class="${i <= L.i ? "on" : ""}${i === L.i ? " cur" : ""}">${tier === "mini" ? `<em>${l[2]}</em>` : tier === "junior" ? `<em>${l[2]}</em>` : `<em>${i + 1}</em>`}<small>${esc(l[1])}</small></span>`).join("")}</div>
      <p class="muted" style="margin:0;font-size:12px">${mini ? "Get stars by coming to sessions, practising at home, the magic quiz and coach stickers." : `XP: session +${XP.att} · home challenge +${XP.home} · quiz +${XP.quiz} · coach sign-off +${XP.ok} · star +${XP.star} · player of the week +${XP.potw} · target +${XP.target}`}</p></div>`;
    else if (open === "matches") { const T = S.mt, M = P.matches || [];
      panel = `<div class="card pp-panel"><h3 class="cpd-h">Matches</h3>
      <div class="pp-mgrid">${[["Games", T.games], ["Minutes", T.minutes], ["Goals", T.goals], ["Assists", T.assists], ["Saves", T.saves], ["Avg rating", T.rating == null ? "–" : T.rating + "/5"]].map(([l, v]) => `<div><b>${v}</b><small>${l}</small></div>`).join("")}</div>
      <p class="muted" style="margin:0;font-size:13px">${ic("check")} ${T.checked} of ${M.length} checked by a coach · each checked game +${XP.match} XP</p>
      ${M.slice(0, 8).map(m => `<div class="pp-match"><div><b>${esc(m.title || "Match")}</b><small>${m.at ? esc(new Date(m.at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })) : ""}${m.group ? " · " + esc(gname(m.group)) : ""}${m.minutes != null ? ` · ${m.minutes ? "up to " + m.minutes + " min" : "didn't play"}` : ""}</small>${m.note ? `<small class="pp-mnote">“${esc(m.note)}”</small>` : ""}</div>
        <span class="pp-mnum">${m.goals ? `<i>⚽${m.goals}</i>` : ""}${m.assists ? `<i>🅰️${m.assists}</i>` : ""}${m.saves ? `<i>🧤${m.saves}</i>` : ""}${m.rating ? `<i>★${m.rating}</i>` : ""}${m.ok ? `<i class="ok" title="Checked by a coach">${ic("check")}</i>` : ""}</span></div>`).join("") || `<p class="muted" style="margin:0">No match stats yet. ${coach ? "Add them in Match Room → Results → Stats." : "After a game, add them in the Match Room."}</p>`}
      ${!coach && fam && M.length < 50 ? `<a class="btn small" href="#matchroom">${ic("ball")} Open Match Room</a>` : ""}</div>`; }
    else if (open === "awards") panel = `<div class="card pp-panel"><h3 class="cpd-h">Awards</h3>${(P.awards || []).map(a => `<div class="pp-award ${a.kind}"><span aria-hidden="true">${a.kind === "potw" ? (mini ? "🏆" : ic("trophy")) : (mini ? "🌟" : ic("star"))}</span><div><b>${a.kind === "potw" ? "Player of the week" : "Star of the session"}</b><small>${esc(gname(a.group) || "")}${a.group ? " · " : ""}${esc(fmtShort(String(a.at).slice(0, 10)))}${a.coach ? " · " + esc(a.coach) : ""}</small>${a.reason ? `<p>${esc(a.reason)}</p>` : ""}</div>${coach ? `<button type="button" class="linkbtn" data-awdel="${a.id}" aria-label="Remove award">×</button>` : ""}</div>`).join("") || `<p class="muted" style="margin:0">No awards yet.</p>`}
      ${coach ? `<div class="pp-tact"><button type="button" class="btn small" data-award="star">${ic("star")} Give a star</button><button type="button" class="btn small primary" data-award="potw">${ic("trophy")} Player of the week</button></div>` : ""}</div>`;
    else if (open === "position") panel = `<div class="card pp-panel"><h3 class="cpd-h">My position & football learning</h3>
      ${coach ? `<form id="pp-development-form" class="pp-kidform"><div class="field"><label for="pd-primary">Primary playing position</label><select id="pd-primary">${POSITION_CHOICES(pl.position || D.primary_position)}</select></div><div class="field"><label for="pd-secondary">Secondary playing position</label><select id="pd-secondary">${POSITION_CHOICES(D.secondary_position)}</select></div><div class="field"><label for="pd-format">Match format</label><select id="pd-format">${FORMAT_CHOICES(matchFormat)}</select></div><button type="submit" class="btn primary">Save playing positions</button><p class="muted" style="font-size:13px">Goalkeeper selection changes learning targets and goalkeeper achievements. Match format is chosen by the coach.</p></form>` : `<p class="muted">Your coach manages your playing positions.</p>`}
      <p><b>${esc(learningPosition === "Not sure" ? "Exploring positions" : learningPosition)}</b>${D.secondary_position?` · Secondary: ${esc(D.secondary_position)}`:""} · ${esc(ageGuidance)}</p>
      <p class="muted" style="font-size:13px">Position-based learning focus, linked to Technical/Tactical, Physical, Psychological and Social development. These are learning suggestions, not coach assessment scores.</p>
      <h4>YOUR ROLE</h4>${positionBullets(positionAreas)}<h4>PLAYING ${esc(matchFormat.toUpperCase())}</h4>${positionBullets(formatTips)}
      ${fam ? `<p class="muted" style="font-size:13px">Change the position under About me. Your coach chooses your position and can set individual targets.</p>` : ""}
      </div>`;
    else if (open === "profile" && fam) panel = `<div class="card pp-panel"><h3 class="cpd-h">About me</h3>
      <p class="muted" style="margin:0;font-size:13px">Optional player details help coaches get to know ${esc(String(displayName).split(" ")[0])}. Your family and coaches in ${esc((pl.groups || []).map(gname).join(", ") || "their sessions")} can see them; other families cannot. Keep medical details in Medical &amp; consent.</p>
      <form class="pp-kidform" id="pp-profile"><div class="field"><label for="pp-preferred">Preferred name</label><input id="pp-preferred" maxlength="60" value="${esc(pl.preferred_name || "")}" placeholder="${esc(pl.name)}"></div>
        <p class="muted">Playing position: ${esc(learningPosition)}. Your coach manages this.</p>
        <div class="field"><label for="pp-strengths">What I enjoy or do well</label><textarea id="pp-strengths" rows="3" maxlength="240" placeholder="A few words about what you enjoy or feel proud of">${esc(pl.strengths || "")}</textarea></div>
        <p class="gmsg" id="pp-profile-msg"></p><button class="btn primary small" type="submit">Save player details</button></form></div>`;
    else if (open === "care" && pl.care_view) {
      const missing = careMissing(P.care), reviewed = !careNeedsReview(P.care);
      panel = `<div class="card pp-panel"><h3 class="cpd-h">Medical &amp; consent</h3>${pl.care_edit ? careForm(P.care, String(pl.name).split(" ")[0]) : careView(P.care, pl.name)}
        ${pl.is_parent ? `<div class="pp-review"><p class="muted" style="margin:0;font-size:13px">At the start of each season, check that these details are still right. This is a family reminder, not a replacement for the academy's formal safeguarding forms.</p>
          ${missing.length ? `<p class="muted" style="margin:0;font-size:13px"><b>Still to confirm:</b> ${esc(missing.join(", "))}</p>` : ""}
          <button type="button" class="btn small${reviewed ? "" : " primary"}" data-care-review ${!careComplete(P.care) || reviewed ? "disabled" : ""}>${reviewed ? `Confirmed for ${esc(currentSeason())}` : `Confirm details for ${esc(currentSeason())}`}</button><p class="gmsg" data-care-review-msg></p></div>` : ""}
      </div>`;
    }
    else if (open === "coach" && coach) panel = `<div class="card pp-panel"><h3 class="cpd-h">Manage passport</h3>
      ${!pl.has_parent ? `<div class="pp-code"><b>Parent link code</b><p class="muted" style="margin:0;font-size:13px">Give this to the parent. They enter it in the app under Me to link their child.</p><div id="pp-pcode">${st.pcode && st.pcode.pid === pid ? `<span class="pp-codev">${esc(st.pcode.code)}</span>` : `<button type="button" class="btn small" data-pcode>Get parent code</button>`}</div></div>` : `<p class="muted" style="margin:0">Parent: <b>${esc(pl.parent_name || "linked")}</b></p>`}
      ${!pl.has_parent && !pl.linked ? `<div class="pp-code"><b>Player login code</b><p class="muted" style="margin:0;font-size:13px">For a child with no parent on the app: on their phone, open the app, tap <b>I'm a player with a code</b> and type this. Works once, for 7 days.</p><div>${st.ccode && st.ccode.pid === pid ? `<span class="pp-codev">${esc(st.ccode.code)}</span>` : `<button type="button" class="btn small" data-ccode>Get player login code</button>`}</div></div>` : pl.linked ? `<p class="muted" style="margin:0;font-size:13px">${ic("check")} Has their own login${pl.username ? ` (username <b>${esc(pl.username)}</b>)` : ""}.</p>` : ""}
      ${!pl.has_parent || o.admin ? `<form class="pp-kidform" id="pp-cedit"><div class="field"><label for="pc-name">Name</label><input id="pc-name" maxlength="60" required value="${esc(pl.name)}"></div>
        <div class="field"><label for="pc-position">Primary playing position</label><select id="pc-position">${POSITION_CHOICES(pl.position)}</select><small class="muted">This position controls the player\u2019s learning focus in their passport.</small></div>
        <div class="field"><label for="pc-year">Year born</label><select id="pc-year"><option value="">—</option>${Array.from({ length: 18 }, (_, i) => new Date().getFullYear() - 3 - i).map(y => `<option${pl.birth_year === y ? " selected" : ""}>${y}</option>`).join("")}</select></div>
        <div class="field"><span class="lbl">Sessions</span><div class="pp-kidg">${myGroups().map(g => `<label class="chipcheck"><input type="checkbox" value="${esc(g)}" ${(pl.groups || []).includes(g) ? "checked" : ""}><span>${esc(gname(g))}</span></label>`).join("")}</div></div>
        <p class="gmsg" id="pc-msg"></p><div class="glinks" style="justify-content:flex-start;gap:14px"><button class="btn primary small" type="submit">Save</button>${!pl.has_parent && !pl.linked ? `<button type="button" class="linkbtn" data-ppdel>Remove passport</button>` : ""}</div></form>` : `<p class="muted" style="margin:0;font-size:13px">The parent manages name, age and sessions.</p><form id="pp-coach-position" class="pp-kidform"><div class="field"><label for="pc-position-only">Primary playing position</label><select id="pc-position-only">${POSITION_CHOICES(pl.position)}</select></div><button class="btn primary small" type="submit">Save position</button><p class="gmsg" id="pc-position-msg"></p></form>`}</div>`;
    const pw = S.potwNow;
    const passportTabs = [["progress","chart","Progress"],["training","target","Training"],["matches","ball","Matches"],["rewards","trophy","Rewards"]];
    const cornerNames = [["Technical / Tactical","ball"],["Physical","zap"],["Psychological","brain"],["Social","users"]];
    
    const cornerStats = cornerNames.map((_,i)=>{
      const a=(D.assessments||[]).filter(x=>cornerForSkill(x.skill||"")===i).slice().reverse();
      const first=a[0], latest=a[a.length-1];
      return {latest:latest?Number(latest.rating):null, change:first&&latest&&a.length>1?Number(latest.rating)-Number(first.rating):null, count:a.length};
    });
    const assessed=(D.assessments||[]).slice(0,6);
    const positives=assessed.filter(x=>Number(x.rating)>=4).map(x=>x.skill);
    const priorities=assessed.filter(x=>Number(x.rating)<=3).map(x=>x.skill);
    const reportStrength=positives.length?positives.slice(0,3).join(", "):"Strengths will appear as the coach completes assessments";
    const reportFocus=priorities.length?priorities.slice(0,3).join(", "):(D.assessments?.length?"No low-rated area recorded yet":"Awaiting evidence from a coach assessment");
    const nextAction=activeT[0]?.text || (priorities.length?`Practise ${priorities[0].toLowerCase()} in the next session and review with your coach`:"Ask your coach to set an individual development target");
    const targetList = (items, empty) => items.length ? items.map(t => `<div class="pp22-goal"><span class="pp22-goal-icon">${ic("target")}</span><div><b>${esc(t.text)}</b><small>${t.coach ? `Coach: ${esc(t.coach)} · ` : ""}${t.done ? "Completed" : "In progress"}</small></div></div>`).join("") : `<p class="pp22-empty">${empty}</p>`;
    const stat = (n,label) => `<div class="pp22-stat"><small>${label}</small><strong>${esc(String(n))}</strong></div>`;
    const coachTile = coach ? tile("targets","target","Manage ILP goals","Set training and match goals") + tile("coach","edit","Player details","Coach controls") : "";
    const tabBody = ppTab === "progress" ? `<section class="pp22-section"><div class="pp22-head"><h3>OVERVIEW</h3><small>YOUR SEASON SO FAR</small></div><div class="pp22-stats">${stat(S.total,"ATTENDANCE")}${stat(S.mt.goals,"GOALS")}${stat(S.mt.games,"APPEARANCES")}${stat(S.earned,"UNLOCKS")}</div><p class="pp22-hint">${esc(learningPosition)}${D.secondary_position?` / ${esc(D.secondary_position)}`:""} · ${esc(matchFormat)}</p></section>
      <section class="pp22-section"><div class="pp22-head"><h3>CURRENT TARGETS</h3><small>PERSONALISED GOALS FROM YOUR COACH</small></div>${targetList(activeT.slice(0,3),"Your coach hasn't set a target yet.")}</section>
      <section class="pp40-section" aria-label="Four corners development"><div class="pp40-heading"><div><span class="pp40-eyebrow">YOUR DEVELOPMENT</span><h3>FOUR CORNERS</h3></div><span class="pp40-chip">${esc(learningPosition)} · ${esc(matchFormat)}</span></div><div class="pp40-corners">${cornerNames.map(([n,i],j)=>{const cs=cornerStats[j];const val=cs.latest;const all=(D.assessments||[]).filter(a=>cornerForSkill(a.skill||"")===j);return `<details class="pp40-corner"><summary><span class="pp40-corner-title">${ic(i)}<b>${esc(n)}</b></span><span class="pp40-ring" style="--pct:${val===null?0:Math.max(0,Math.min(100,val*20))}%"><strong>${val===null?'—':val+'<small>/5</small>'}</strong></span><span class="pp40-meta">${val===null?'NOT ASSESSED':`${cs.count} COACH ${cs.count===1?'RATING':'RATINGS'}`}</span><span class="pp40-open">VIEW SKILLS ${ic('chevron-right')}</span></summary><div class="pp40-details">${all.length?all.slice(0,8).map(a=>`<div class="pp40-skill"><span>${esc(a.skill||'Skill')}</span><b>${esc(a.rating)}/5</b><small>${esc(a.created_at?new Date(a.created_at).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'}):'')}</small></div>`).join(''):'<p>Your coach has not assessed this corner yet.</p>'}<p class="pp40-note">${Object.values(CORNER_CRITERIA)[j].filter(x=>positionCriteria(learningPosition).includes(x)).slice(0,5).map(esc).join(' · ')}</p></div></details>`}).join('')}</div><p class="pp40-disclaimer">Scores are coach observations, not professional academy benchmarks. Unassessed skills stay blank.</p></section>
      <section class="pp40-section"><div class="pp40-heading"><div><span class="pp40-eyebrow">COACH FEEDBACK</span><h3>YOUR GAME PLAN</h3></div></div><div class="pp40-feedback"><div class="pp40-feedback-item"><span class="pp40-feedback-icon">${ic('star')}</span><div><small>WHAT'S WORKING</small><b>${esc(reportStrength)}</b></div></div><div class="pp40-feedback-item"><span class="pp40-feedback-icon">${ic('target')}</span><div><small>LEVEL UP NEXT</small><b>${esc(reportFocus)}</b></div></div><div class="pp40-feedback-item pp40-feature"><span class="pp40-feedback-icon">${ic('zap')}</span><div><small>YOUR NEXT CHALLENGE</small><b>${esc(nextAction)}</b></div></div></div></section>
      <section class="pp40-section"><div class="pp40-heading"><div><span class="pp40-eyebrow">LATEST ACTIVITY</span><h3>COACH CHECK-INS</h3></div></div><div class="pp40-activity">${(D.assessments||[]).slice(0,4).map(a=>`<div class="pp40-activity-row"><span class="pp40-rating">${esc(a.rating)}/5</span><div><b>${esc(a.skill||'Assessment')}</b><small>${esc(a.created_at?new Date(a.created_at).toLocaleDateString('en-GB',{day:'numeric',month:'short'}):'')} · Coach assessment</small></div></div>`).join('')||'<p>No coach assessments yet. Your journey starts with your first check-in.</p>'}</div></section>
      <div class="ct-grid pp-grid">${tile("skills","chart","Skills",S.skill.length ? `${S.skill.length} tests` : "Coach assessments")}${tile("att","calendar","Attendance",`${S.total} sessions · ${S.streak}-wk streak`)}${tile("position","ball",coach?"Set playing position":"My position",learningPosition)}${coach?tile("development","chart","Development tools","Position, assessment & reviews"):""}${coachTile}</div>` :
      ppTab === "training" ? `<section class="pp22-section"><div class="pp22-head"><h3>TRAINING PLAN</h3><small>COACH-SET DEVELOPMENT TARGETS</small></div>${targetList(trainingT,"Your coach will add individual training goals here.")}<p class="pp22-hint">Coach suggested focus: ${esc(suggested[0].text)}</p></section><section class="pp22-section"><div class="pp22-head"><h3>POSITION FOCUS</h3><small>${esc(learningPosition.toUpperCase())} · AGE-SPECIFIC LEARNING</small></div><div class="pp22-focus">${positionBullets(positionAreas)}</div><p class="pp22-hint">${esc(ageGuidance)}</p><h4>YOUR TEAM SHAPE · ${esc(matchFormat.toUpperCase())}</h4>${positionBullets(formatTips)}</section><div class="ct-grid pp-grid">${tile("targets","target","Coach feedback","View targets and notes")}${tile("skills","chart","Skills","Training assessments")}${tile("reflection","edit","My reflection","What went well and what is next")}${coach?tile("development","chart","Coach assessment","Rate skills and suggest goals"):""}${coachTile}</div>` :
      ppTab === "matches" ? `<section class="pp22-section"><div class="pp22-head"><h3>MATCHDAY</h3><small>PERFORMANCE AND REVIEW</small></div><div class="pp22-stats">${stat(S.mt.games,"APPEARANCES")}${stat(S.mt.goals,"GOALS")}</div></section><section class="pp22-section"><div class="pp22-head"><h3>MATCH TARGETS</h3><small>COACH-SET GOALS FOR MATCHES</small></div>${targetList(matchT,"Your coach will add individual match goals here.")}${(D.reviews||[]).slice(0,3).map(r=>`<div class="pp22-goal"><b>${esc(r.match_label)} · ${esc(r.target_text||"General review")} · ${esc(r.outcome.replaceAll("_"," "))}</b><small>${esc(r.note)}</small></div>`).join("")}</section><div class="ct-grid pp-grid">${tile("matches","ball","Match records","Stats and match history")}${tile("reflection","edit","My reflection","Review your match")}${coach?tile("development","chart","Coach review","Review match objectives"):""}${coachTile}</div>` :
      `<section class="pp22-section"><div class="pp22-head"><h3>MY ACHIEVEMENTS</h3><small>WHAT YOU'VE COMPLETED</small></div><div class="pp22-stats">${stat((P.targets||[]).filter(t=>t.done).length,"TARGETS MET")}${stat(S.earned,"UNLOCKS")}${stat((P.awards||[]).length,"AWARDS")}</div>${targetList((P.targets||[]).filter(t=>t.done),"Completed goals will appear here.")}<p class="pp22-hint">${esc(S.lvl.name)} · ${S.xp} XP · ${S.lvl.next?`${S.lvl.need} XP until ${esc(S.lvl.next)}`:"Top rank"}</p></section><div class="ct-grid pp-grid">${tile("badges","medal","Unlocks",`${S.earned} of ${S.badges.length}`)}${tile("awards","trophy","Awards",`${(P.awards||[]).length} awards`)}${coachTile}</div>`;
    const xpPct = S.lvl.next?Math.max(3,Math.min(100,100-S.lvl.need/Math.max(1,S.xp+S.lvl.need)*100)):100;
    return `<div class="pp pp-${tier} pp22 pro-pp" data-pp="${esc(pid)}">
      ${P.development_error?`<p class="gmsg" role="alert">Development data unavailable: ${esc(P.development_error)}. Ask the academy administrator to check the database migration.</p>`:""}<header class="pro-athlete" aria-label="Player passport">
        <div class="pro-athlete-top"><span class="pro-eyebrow">Player passport</span><span class="pro-rank">${ic('trophy')} ${esc(S.lvl.name)}</span></div>
        <div class="pro-athlete-id"><span class="pro-avatar" aria-hidden="true">${esc(String(displayName).split(/\s+/).slice(0,2).map(w=>w[0]||"").join("").toUpperCase())}</span><div><h2>${esc(displayName)}</h2><p>${esc(learningPosition === "Not sure" ? "Exploring positions" : learningPosition)}${pl.groups?.length ? " · "+esc(pl.groups.map(gname).join(", ")) : ""}</p></div></div>
        <div class="pro-xp"><div class="pro-xp-row"><strong>${S.xp} XP</strong><small>${S.lvl.next?`${S.lvl.need} XP to ${esc(S.lvl.next)}`:'Top rank reached'}</small></div><div class="pro-xp-track" role="progressbar" aria-label="Progress to next rank" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(xpPct)}"><i style="width:${xpPct}%"></i></div></div>
      </header>
      <nav class="pp22-tabs pro-tabs" aria-label="Player passport sections">${passportTabs.map(([id,icon,label])=>`<button type="button" data-pptab="${id}" class="${ppTab===id?"active":""}" aria-pressed="${ppTab===id}">${ic(icon)}<span>${label}</span></button>`).join("")}</nav>
      ${tabBody}
      ${missions.length && ppTab === "training" ? `<section class="pp22-section"><div class="pp22-head"><h3>THIS WEEK</h3><small>SESSION LEARNING</small></div><div class="pm-list">${missions.slice(0,2).map((m,i)=>missionCard(P,m,tier,Object.assign({},o,{first:i===0}))).join("")}</div></section>` : ""}
      ${pw && ppTab === "rewards" ? `<div class="pp-potw">${ic("trophy")}<div><small>Player of the week</small><b>${esc(pw.reason||"Well done!")}</b></div></div>` : ""}
      ${fam ? `<div class="pp22-settings">${tile("profile","user","Player details","Position and profile")}${pl.care_view ? tile("care","shield","Medical & consent","Private details") : ""}</div>` : ""}
      ${panel}
    </div>`;
  }
  // quiz built from this week's syllabus session
  function hashN(s) { let h = 7; for (const c of String(s)) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h; }
  function shuffle(arr, seed) { const a = arr.slice(); let s = seed || 1; for (let i = a.length - 1; i > 0; i--) { s = (s * 1103515245 + 12345) >>> 0; const j = s % (i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; }
  function quizFor(m, tier) {
    const O = (m.others || []).filter(Boolean), Q = [], uniq = l => [...new Set(l.filter(x => x && String(x).trim()))];
    const mk = (q, right, wrong) => { const opts = uniq([right].concat(wrong)).slice(0, 3); if (opts.length < 2 || !right) return; Q.push({ q, right, opts: shuffle(opts, hashN(q + right)) }); };
    if (tier === "mini") {
      if (m.word) mk("What's this week's magic word?", m.word, O.map(x => x.word));
      mk("What are we learning this week?", m.skill, O.map(x => x.skill));
      if (Q.length < 2 && m.theme) mk("What's this week's game called?", m.theme, O.map(x => x.theme));
      if (Q.length < 2 && (m.points || [])[0]) mk("Which tip is from this week?", m.points[0], O.map(x => x.point));
    } else {
      mk("What's this week's skill?", m.skill, O.map(x => x.skill));
      const pts = (m.points || []).filter(Boolean);
      if (pts[0]) mk("Which coaching tip is from this week's session?", pts[0], O.map(x => x.point));
      if (pts[1]) mk("And which one of these is also from this week?", pts[1], O.map(x => x.point).reverse());
      if (Q.length < 3 && m.home) mk("What's your home challenge this week?", m.home.length > 90 ? m.home.slice(0, 88) + "…" : m.home, ["Rest and watch football", "Run 5 km every day"]);
    }
    return Q;
  }
  function quizSheet(pid, prog, date) {
    const P = st.pp[pid]; if (!P) return; const m = (P.missions || []).find(x => x.prog === prog && x.date === date); if (!m) return;
    const tier = ppTier(P.player), Q = quizFor(m, tier), mini = tier === "mini";
    if (!Q.length) return toastC("No quiz for this week.");
    let i = 0, right = 0, picked = null;
    const el = document.createElement("div"); el.className = "ci-sheet"; el.id = "pq-sheet";
    const close = () => { el.remove(); document.body.classList.remove("ci-open"); };
    const draw = () => {
      if (i >= Q.length) {
        const pass = right >= Math.min(2, Q.length);
        el.innerHTML = `<div class="ci-back" data-qclose></div><div class="ci-panel pq-done"><div class="ci-grab"></div><span class="pq-big" aria-hidden="true">${pass ? (mini ? "🎉" : ic("trophy")) : (mini ? "💪" : ic("repeat"))}</span>
          <h2>${pass ? (mini ? "Super star!" : "Quiz passed") : "Nearly!"}</h2><p>${right} out of ${Q.length} right.${pass ? ` +${XP.quiz} ${mini ? "stars" : "XP"}` : " Have another go after a look at this week's session."}</p>
          <button type="button" class="btn primary big" data-qclose>${pass ? "Done" : "Close"}</button></div>`;
        el.querySelectorAll("[data-qclose]").forEach(b => b.onclick = close);
        sb().rpc("set_week", { p_player: pid, p_prog: prog, p_date: date, p_field: "quiz", p_val: right }).then(r => { if (r.error) toastC("Couldn't save: " + r.error.message); else loadPassport(pid, true); });
        return;
      }
      const q = Q[i];
      el.innerHTML = `<div class="ci-back" data-qclose></div><div class="ci-panel pq pq-${tier}"><div class="ci-grab"></div>
        <div class="pq-prog">${Q.map((_, k) => `<i class="${k < i ? "on" : k === i ? "cur" : ""}"></i>`).join("")}</div>
        <span class="eyebrow">${esc(gname(m.group))} · question ${i + 1} of ${Q.length}</span><h2>${esc(q.q)}</h2>
        <div class="pq-opts">${q.opts.map((t, k) => `<button type="button" class="pq-opt${picked != null ? (t === q.right ? " right" : k === picked ? " wrong" : "") : ""}" data-qo="${k}" ${picked != null ? "disabled" : ""}>${mini ? `<span aria-hidden="true">${["🔴", "🔵", "🟢"][k]}</span>` : ""}${esc(t)}</button>`).join("")}</div>
        ${picked != null ? `<p class="pq-fb">${q.opts[picked] === q.right ? (mini ? "Yes! Well done 🌟" : "Correct.") : `It's “${esc(q.right)}”.`}</p><button type="button" class="btn primary big" data-qnext>${i + 1 < Q.length ? "Next" : "Finish"}</button>` : ""}</div>`;
      el.querySelectorAll("[data-qclose]").forEach(b => b.onclick = close);
      el.querySelectorAll("[data-qo]").forEach(b => b.onclick = () => { picked = +b.dataset.qo; if (q.opts[picked] === q.right) right++; draw(); });
      const nx = q && el.querySelector("[data-qnext]"); if (nx) nx.onclick = () => { i++; picked = null; draw(); };
    };
    document.body.appendChild(el); document.body.classList.add("ci-open"); draw();
  }
  async function ppAct(pid, fn) { const r = await fn(); if (r && r.error) { toastC("Couldn't save: " + r.error.message); return false; } await loadPassport(pid, true); return true; }
  function bindPassport(root, coachName) {
    root = root || document; const box = q(".pp", root); if (!box) return; const pid = box.dataset.pp;
    root.querySelectorAll("[data-pptab]").forEach(b => b.onclick = () => { st.ppTab = b.dataset.pptab; st.ppOpen = ""; st.onChange("passport"); });
    root.querySelectorAll("[data-ppopen]").forEach(b => b.onclick = () => { st.ppOpen = st.ppOpen === b.dataset.ppopen ? "" : b.dataset.ppopen; st.onChange("passport"); setTimeout(() => { const p = q(".pp-panel"); if (p) p.scrollIntoView({ behavior: "smooth", block: "nearest" }); }, 60); });
    root.querySelectorAll("[data-tprog]").forEach(b => b.onclick = () => { const [id, n] = b.dataset.tprog.split(":"); ppAct(pid, () => sb().from("player_targets").update({ progress: +n, updated_at: new Date().toISOString() }).eq("id", id)); });
    root.querySelectorAll("[data-tdone]").forEach(b => b.onclick = () => { const [id, v] = b.dataset.tdone.split(":"); ppAct(pid, () => sb().from("player_targets").update({ done: v === "1", progress: v === "1" ? 3 : 2, updated_at: new Date().toISOString() }).eq("id", id)); });
    root.querySelectorAll("[data-tdel]").forEach(b => b.onclick = async () => { if (await yes("Remove this target?", "", "Remove")) ppAct(pid, () => sb().from("player_targets").delete().eq("id", b.dataset.tdel)); });
    root.querySelectorAll("[data-tnote]").forEach(b => b.onclick = async () => { const t = ((st.pp[pid] || {}).targets || []).find(x => x.id === b.dataset.tnote); const n = await ask({ title: "Feedback", text: t ? t.text : "", label: "For the player and their parent", value: (t && t.note) || "", multiline: true, ok: "Save" }); if (n !== null) ppAct(pid, () => sb().from("player_targets").update({ note: n.trim().slice(0, 400) || null, updated_at: new Date().toISOString() }).eq("id", b.dataset.tnote)); });
    const develop = q("#pp-development-form",root); if(develop) develop.onsubmit=async e=>{e.preventDefault();const primary=q("#pd-primary",root).value||null,secondary=q("#pd-secondary",root).value||null;if(primary && secondary && primary===secondary)return toastC("Choose a different secondary position");const r=await sb().rpc("save_passport_development",{p_player:pid,p_primary:primary,p_secondary:secondary,p_format:q("#pd-format",root).value});if(r.error)return toastC("Could not save football profile: "+r.error.message);toastC("Football profile saved");st.ppOpen="position";await loadPassport(pid,true);};
    root.querySelectorAll("[data-pd-suggest]").forEach(b=>b.onclick=async()=>{const P=st.pp[pid],pl=P.player,D=P.development||{},age=pl.birth_year?new Date().getFullYear()-pl.birth_year:null;const goals=suggestedTargets(pl.position,age,D.match_format||"9v9");const g=goals[+b.dataset.pdSuggest];if(g)await ppAct(pid,()=>sb().from("player_targets").insert({player_id:pid,text:g.text,category:g.category,coach_name:coachName||A().name}));});
    const assess=q("#pp-assess-form",root);if(assess)assess.onsubmit=async e=>{e.preventDefault();const r=await sb().rpc("save_passport_development_event",{p_player:pid,p_kind:"assessment",p_data:{skill:q("#pd-skill",root).value,rating:+q("#pd-rating",root).value,note:q("#pd-assess-note",root).value}});if(r.error)return toastC(r.error.message);toastC("Assessment saved");await loadPassport(pid,true);};
    const matchReview=q("#pp-match-review",root);if(matchReview)matchReview.onsubmit=async e=>{e.preventDefault();const r=await sb().rpc("save_passport_development_event",{p_player:pid,p_kind:"review",p_data:{match_label:q("#pd-match",root).value,target_id:q("#pd-review-target",root).value||null,target_text:q("#pd-review-target",root).selectedOptions[0]?.textContent||"General match review",outcome:q("#pd-result",root).value,note:q("#pd-review-note",root).value}});if(r.error)return toastC(r.error.message);toastC("Match review saved");await loadPassport(pid,true);};
    const reflection=q("#pp-reflection",root);if(reflection)reflection.onsubmit=async e=>{e.preventDefault();const r=await sb().rpc("save_passport_development_event",{p_player:pid,p_kind:"reflection",p_data:{kind:q("#pd-ref-type",root).value,went_well:q("#pd-ref-good",root).value,improve_next:q("#pd-ref-next",root).value}});if(r.error)return toastC(r.error.message);toastC("Reflection saved");await loadPassport(pid,true);};
    const tf = q("#pp-tform", root); if (tf) tf.onsubmit = e => { e.preventDefault(); const v = q("#pp-tnew", root).value.trim(); if (v) ppAct(pid, () => sb().from("player_targets").insert({ player_id: pid, text: v, category: q("#pp-tcategory", root).value, coach_name: coachName || A().name })); };
    root.querySelectorAll("[data-gdone]").forEach(b => b.onchange = () => ppAct(pid, () => sb().from("player_goals").update({ done: b.checked }).eq("id", b.dataset.gdone)));
    root.querySelectorAll("[data-gdel]").forEach(b => b.onclick = async e => { e.preventDefault(); if (await yes("Remove this goal?", "", "Remove")) ppAct(pid, () => sb().from("player_goals").delete().eq("id", b.dataset.gdel)); });
    const gf = q("#pp-gform", root); if (gf) gf.onsubmit = e => { e.preventDefault(); const v = q("#pp-gnew", root).value.trim(); if (v) ppAct(pid, () => sb().from("player_goals").insert({ player_id: pid, text: v })); };
    // weekly missions
    root.querySelectorAll("[data-mhome]").forEach(b => b.onclick = async () => { const [prog, date, v] = b.dataset.mhome.split("|"); b.disabled = true;
      if (await ppAct(pid, () => sb().rpc("set_week", { p_player: pid, p_prog: prog, p_date: date, p_field: "home", p_val: +v })) && v === "1") toastC(`Home challenge done · +${XP.home}`); });
    root.querySelectorAll("[data-mquiz]").forEach(b => b.onclick = () => { const [prog, date] = b.dataset.mquiz.split("|"); quizSheet(pid, prog, date); });
    root.querySelectorAll("[data-mok]").forEach(b => b.onclick = async () => { const [prog, date, v] = b.dataset.mok.split("|"); b.disabled = true;
      if (await ppAct(pid, () => sb().rpc("set_week", { p_player: pid, p_prog: prog, p_date: date, p_field: "coach", p_val: +v })) && v === "1") { toastC("Skill signed off"); notify("signoff", `${pid}|${prog}|${date}`); } });
    root.querySelectorAll("[data-how]").forEach(b => b.onclick = () => toastC(b.dataset.how));
    // awards
    root.querySelectorAll("[data-award]").forEach(b => b.onclick = () => giveAward(pid, b.dataset.award, coachName));
    root.querySelectorAll("[data-awdel]").forEach(b => b.onclick = async () => { if (await yes("Remove this award?", "", "Remove")) ppAct(pid, () => sb().from("player_awards").delete().eq("id", b.dataset.awdel)); });
    // coach: parent code, edit, remove
    const pc = q("[data-pcode]", root); if (pc) pc.onclick = async () => { pc.disabled = true; const { data, error } = await sb().rpc("create_parent_code", { p_player: pid }); if (error) { pc.disabled = false; return toastC(error.message); } st.pcode = { pid, code: data }; st.onChange("passport"); };
    const cc = q("[data-ccode]", root); if (cc) cc.onclick = async () => { cc.disabled = true; const { data, error } = await sb().rpc("create_player_invite", { p_player: pid }); if (error) { cc.disabled = false; return toastC(error.message); } st.ccode = { pid, code: data }; st.onChange("passport"); };
    const ce = q("#pp-cedit", root); if (ce) ce.onsubmit = async e => { e.preventDefault(); const msg = q("#pc-msg", root), gs = [...ce.querySelectorAll(".pp-kidg input:checked")].map(i => i.value);
      if (!gs.length) { msg.textContent = "Pick at least one session."; msg.className = "gmsg bad"; return; }
      const { error } = await sb().from("players").update({ name: q("#pc-name", root).value.trim(), birth_year: +q("#pc-year", root).value || null, groups: gs }).eq("id", pid);
      if (error) { msg.textContent = "Couldn't save: " + error.message; msg.className = "gmsg bad"; return; }
      const pos = q("#pc-position", root);
      if (pos) { const saved = await sb().rpc("set_player_position", {p_player:pid,p_position:pos.value || null}); if (saved.error) {msg.textContent = "Player saved, but position could not be saved: " + saved.error.message; msg.className="gmsg bad"; return;} }
      toastC("Saved"); await loadPlayers(true); loadPassport(pid, true); };
    const cp = q("#pp-coach-position",root); if (cp) cp.onsubmit = async e => {e.preventDefault(); const msg=q("#pc-position-msg",root);const {error}=await sb().rpc("set_player_position",{p_player:pid,p_position:q("#pc-position-only",root).value || null});if(error){msg.textContent="Could not save position: "+error.message;msg.className="gmsg bad";return;}toastC("Position saved");await loadPassport(pid,true);};
    const pf = q("#pp-profile", root); if (pf) pf.onsubmit = async e => { e.preventDefault(); const msg = q("#pp-profile-msg", root);
      const { error } = await sb().rpc("update_player_profile", { p_player: pid, p_preferred_name: q("#pp-preferred", root).value.trim() || null,
        p_position: pl.position || null, p_strengths: q("#pp-strengths", root).value.trim() || null });
      if (error) { msg.textContent = "Couldn't save: " + error.message; msg.className = "gmsg bad"; return; }
      toastC("Player details saved"); await loadPlayers(true); await loadPassport(pid, true); };
    const cf = q("#care-form", root); if (cf) cf.onsubmit = async e => { e.preventDefault(); const v = id => q(id, root).value.trim() || null, ph = cf.querySelector('input[name="cf-ph"]:checked'), msg = q("#cf-msg", root);
      if (!ph) { msg.textContent = "Please choose an option for photos and videos."; msg.className = "gmsg bad"; return; }
      const allergies = v("#cf-all"), medical = v("#cf-med");
      const { error } = await sb().from("player_care").upsert({ player_id: pid, allergies, medical, allergies_none: !allergies && q("#cf-allnone", root).checked,
        medical_none: !medical && q("#cf-mednone", root).checked, emergency_name: v("#cf-en"), emergency_relation: v("#cf-er"),
        emergency_phone: v("#cf-ep"), photo_consent: ph.value }, { onConflict: "player_id" });
      if (error) { msg.textContent = "Couldn't save: " + error.message; msg.className = "gmsg bad"; return; }
      toastC("Saved"); await loadPassport(pid, true); };
    const review = q("[data-care-review]", root); if (review) review.onclick = async () => {
      review.disabled = true;
      const msg = q("[data-care-review-msg]", root), { error } = await sb().rpc("review_player_passport", { p_player: pid });
      if (error) { msg.textContent = "Couldn't confirm: " + error.message; msg.className = "gmsg bad"; review.disabled = false; return; }
      toastC(`Passport confirmed for ${currentSeason()}`); await loadPassport(pid, true);
    };
    const pd = q("[data-ppdel]", root); if (pd) pd.onclick = async () => { if (!(await yes("Remove this passport?", "All its progress, awards and medical details are deleted for good.", "Delete"))) return; const { error } = await sb().from("players").delete().eq("id", pid); if (error) return toastC("Couldn't remove: " + error.message); toastC("Passport removed"); st.ppOpen = ""; await loadPlayers(true); if (st.onPassportGone) st.onPassportGone(); };
  }
  async function giveAward(pid, kind, coachName, group, reason0, after) {
    const P = st.pp[pid], pl = (P && P.player) || (st.players || []).find(p => p.id === pid) || {};
    const gs = (pl.groups || []).filter(g => isStaff() && (A().admin || myGroups().includes(g)));
    const g = group || (gs.length === 1 ? gs[0] : gs.find(x => x === st.teamGroup) || gs[0]) || null;
    const first = String(pl.name || "they").split(" ")[0];
    const reason = reason0 != null ? reason0 : await ask(kind === "potw" ? { title: "Player of the week", text: `${pl.name || ""}${g ? " · " + gname(g) : ""}`, label: `What did ${first} do brilliantly?`, placeholder: "e.g. Never stopped running and helped everyone", max: 200, ok: "Give award", check: v => v.trim() ? "" : "Add a reason. Everyone will see it in the Player Spotlight." } : { title: "Star of the session", text: pl.name || "", label: "What for? (optional)", max: 200, ok: "Give star" });
    if (reason === null) return;
    const wk = new Date(weekStart(new Date())).toLocaleDateString("en-CA");
    if (kind === "potw" && g) await sb().from("player_awards").delete().eq("kind", "potw").eq("group_id", g).eq("week_of", wk);
    const { data: aw, error } = await sb().from("player_awards").insert({ player_id: pid, kind, group_id: g, week_of: wk, reason: reason.trim().slice(0, 200) || null, coach_name: coachName || A().name, coach_id: A().uid }).select("id").single();
    if (error) return toastC("Couldn't save: " + error.message);
    if (aw && aw.id) notify("award", aw.id);
    if (kind === "potw") loadSpotlight(true);
    toastC(kind === "potw" ? "Player of the week given" : "Star given");
    if (st.pp[pid]) loadPassport(pid, true); if (after) after();
  }
  async function recordAttendance(pid, gid, label) {
    if (!pid) return "";
    const client = sb();
    if (!client) return "The attendance service isn't available right now.";
    try {
      const { error } = await client.from("attendance").insert({ player_id: pid, session_date: new Date().toLocaleDateString("en-CA"), group_id: gid || null, label: label || null, by_user: A().uid });
      if (error && !/duplicate|unique/i.test(error.message)) { console.warn("attendance", error.message); return error.message; }
      if (st.pp[pid]) loadPassport(pid, true);
      return "";
    } catch (error) {
      const message = error && error.message ? error.message : "The attendance request failed.";
      console.warn("attendance", message);
      return message;
    }
  }

  /* ---------- match plans: team sheet + tactics (lead coach writes, team sees once published) ---------- */
  const SIDE = { U10: 7, "U12/U13": 9, U13: 9, U15: 11 };
  const FORMS = { 7: ["2-3-1", "3-2-1", "2-1-2-1"], 9: ["4-1-2-1", "3-3-2", "3-2-3", "2-3-2-1"], 11: ["4-3-3", "4-4-2", "4-2-3-1", "3-5-2"] };
  const LINE_NAMES = { 1: [["CB"], ["CDM"], ["CAM"], ["ST"]], 2: [["LCB", "RCB"], ["LCM", "RCM"], ["LS", "RS"]], 3: [["LCB", "CB", "RCB"], ["LM", "CM", "RM"], ["LW", "ST", "RW"]], 4: [["LB", "LCB", "RCB", "RB"], ["LM", "LCM", "RCM", "RM"], ["LW", "LS", "RS", "RW"]], 5: [["LWB", "LCB", "CB", "RCB", "RWB"], ["LWB", "LCM", "CM", "RCM", "RWB"]] };
  function slotsFor(form) {
    const lines = String(form || "").split("-").map(Number).filter(n => n > 0), out = [{ pos: "GK", x: 50, y: 90 }];
    lines.forEach((n, li) => {
      const y = lines.length === 1 ? 50 : 72 - li * (56 / (lines.length - 1));
      const isBack = li === 0, isFront = li === lines.length - 1 && lines.length > 1;
      const names = (LINE_NAMES[n] || [])[isBack ? 0 : isFront ? Math.min(2, (LINE_NAMES[n] || []).length - 1) : Math.min(1, (LINE_NAMES[n] || []).length - 1)] || [];
      const one = isBack ? "CB" : isFront ? "ST" : li === 1 ? "CDM" : "CAM";
      for (let i = 0; i < n; i++) out.push({ pos: n === 1 ? one : (names[i] || "P" + out.length), x: Math.round((i + 1) * 100 / (n + 1)), y: Math.round(y) });
    });
    return out;
  }
  st.plans = null; st.leads = null;
  async function loadPlans(force) {
    if (!sb() || (st.plans && !force && Date.now() - st.plansAt < 30000)) return st.plans;
    st.plansAt = Date.now();
    const { data, error } = await sb().from("match_plans").select("*").gte("kickoff", new Date(Date.now() - 6 * 3600e3).toISOString()).order("kickoff");
    st.plans = error ? [] : (data || []); st.onChange("plans"); return st.plans;
  }
  async function loadLeads() { const { data } = await sb().from("team_leads").select("*"); st.leads = data || []; st.onChange("plans"); return st.leads; }
  const shortName = n => { const p = String(n || "").trim().split(/\s+/); return p.length > 1 ? `${p[0]} ${p[p.length - 1][0]}.` : p[0] || ""; };
  function pitchHtml(plan, o) {
    o = o || {}; const slots = slotsFor(plan.formation), L = plan.lineup || [];
    return `<div class="mp-pitch${o.edit ? " edit" : ""}"><i class="mp-box t"></i><i class="mp-box b"></i><i class="mp-mid"></i><i class="mp-circle"></i>
      ${slots.map((sl0, i) => { const p = L[i] || {}, sl = { pos: p.pos || sl0.pos, x: p.x != null ? p.x : sl0.x, y: p.y != null ? p.y : sl0.y }, me = o.me && p.player_id && p.player_id === o.me, nm = p.name ? shortName(p.name) : "";
        return `<${o.edit ? `button type="button" data-mpslot="${i}"` : "div"} class="mp-slot${nm ? " on" : ""}${me ? " me" : ""}" style="left:${sl.x}%;top:${sl.y}%"><span class="mp-dot">${esc(sl.pos)}</span><span class="mp-nm">${nm ? esc(nm) : o.edit ? "Pick" : "—"}</span></${o.edit ? "button" : "div"}>`; }).join("")}
    </div>`;
  }
  function planWhen(plan) { return plan.kickoff ? new Date(plan.kickoff).toLocaleString("en-GB", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : ""; }
  function planView(plan, o) {
    o = o || {}; const me = o.me || null, L = plan.lineup || [], slots = slotsFor(plan.formation);
    const mine = me && L.findIndex(p => p && p.player_id === me), isSub = me && (plan.subs || []).some(p => p.player_id === me);
    return `<div class="mp-view">
      <div class="mp-head"><span class="eyebrow">${esc(gname(plan.group_id))} · ${esc(planWhen(plan))}</span><h2>${esc(plan.title || "Match")}</h2></div>
      ${plan.kickoff ? matchTimes(plan.kickoff, "light") : ""}
      ${plan.objective ? `<div class="mp-obj"><span>${ic("target")} Main objective</span><b>${esc(plan.objective)}</b></div>` : ""}
      ${mine != null && mine >= 0 ? `<div class="mp-you">${ic("star")} You're starting at <b>${esc((L[mine] && L[mine].pos) || (slots[mine] ? slots[mine].pos : ""))}</b></div>` : isSub ? `<div class="mp-you">${ic("star")} You're on the bench, ready to come on</div>` : ""}
      <div class="mp-sec"><div class="mp-sech"><h3 class="cpd-h">Team sheet</h3><span class="pill">${esc(plan.formation || "")}</span></div>${pitchHtml(plan, { me })}
        ${(plan.subs || []).length ? `<div class="mp-subs"><b>Subs</b>${plan.subs.map(p => `<span class="${me && p.player_id === me ? "me" : ""}">${esc(shortName(p.name))}</span>`).join("")}</div>` : ""}</div>
      ${gamePlanHtml(plan, true)}
      ${plan.venue ? `<div class="mp-sec"><h3 class="cpd-h">Getting there</h3>${venueMap(plan.venue)}</div>` : ""}
    </div>`;
  }
  const TAC = [["with", "ball", "With the ball"], ["without", "shield", "Without the ball"], ["set", "flag", "Set pieces"]];
  function gamePlanHtml(plan, noObj) {
    const T = plan.tactics || {}, keys = (plan.keys || []).filter(Boolean);
    if (!keys.length && !TAC.some(([k]) => T[k]) && (noObj || !plan.objective)) return "";
    return `<div class="mp-sec mp-plan"><h3 class="cpd-h">Game plan</h3>
      ${!noObj && plan.objective ? `<div class="mp-obj"><span>${ic("target")} Main objective</span><b>${esc(plan.objective)}</b></div>` : ""}
      ${keys.length ? `<ol class="mp-keys">${keys.map(k => `<li>${esc(k)}</li>`).join("")}</ol>` : ""}
      ${TAC.some(([k]) => T[k]) ? `<div class="mp-tac">${TAC.filter(([k]) => T[k]).map(([k, i, l]) => `<div><b>${ic(i)} ${l}</b><p>${esc(T[k])}</p></div>`).join("")}</div>` : ""}</div>`;
  }
  function planCard(plan, href) {
    return `<a class="mp-card" href="${href}"><span class="mp-card-k">Match day · ${esc(fmtD(plan.kickoff))} · Arrive ${esc(hm(arriveOf(plan.kickoff)))} · KO ${esc(hm(plan.kickoff))}</span><b>${esc(plan.title || "Match")}</b>${plan.objective ? `<span class="mp-card-o">${ic("target")} ${esc(plan.objective)}</span>` : ""}<span class="mp-card-b">Team sheet &amp; tactics ›</span></a>`;
  }

  /* ---------- Match Room: next match (arrive 30 min before kick-off), map, fixtures, results, player stats ---------- */
  const matchKey = (e, start) => String(e.id).startsWith("fx:") ? e.id : `${e.id}:${new Date(start).toLocaleDateString("en-CA")}`;
  const hm = d => new Date(d).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  const arriveOf = start => new Date(new Date(start).getTime() - 30 * 60000);
  function matchTimes(start, cls) { return `<div class="mr-times${cls ? " " + cls : ""}"><div><small>Arrive</small><b>${hm(arriveOf(start))}</b></div><div><small>Kick-off</small><b>${hm(start)}</b></div></div>`; }
  function venueMap(loc) {
    if (!loc) return "";
    const qy = encodeURIComponent(mapQuery(loc));
    return `<a class="vmap" href="https://www.google.com/maps/dir/?api=1&destination=${qy}" target="_blank" rel="noopener" aria-label="Directions to ${esc(loc)}">
      <iframe src="https://www.google.com/maps?q=${qy}&z=15&output=embed" loading="lazy" tabindex="-1" title="Map of ${esc(loc)}" referrerpolicy="no-referrer-when-downgrade"></iframe>
      <span class="vmap-bar"><span>${ic("pin")} ${esc(loc)}</span><b>Directions ›</b></span></a>`;
  }
  const isHome = e => e.home != null ? e.home : !/^away\b/i.test(e.title || "");
  const oppOf = e => e.opponent || String(e.title || "").replace(/^(home vs|away at|vs|at)\s+/i, "");
  st.mstats = null; st.tstats = {};
  async function loadMyStats(force) { if (st.mstats && !force) return st.mstats; const { data } = await sb().from("match_stats").select("*").order("kickoff", { ascending: false }); st.mstats = data || []; st.onChange("mstats"); return st.mstats; }
  async function loadTeamStats(gid, force) { if (st.tstats[gid] && !force) return st.tstats[gid]; const { data } = await sb().rpc("team_stats", { p_group: gid }); st.tstats[gid] = data || []; st.onChange("mstats"); return st.tstats[gid]; }
  function resultPill(e) { if (!e.played && !e.result) return ""; const r = String(e.result || ""); const k = /^won/i.test(r) ? "w" : /^lost/i.test(r) ? "l" : "d"; return `<span class="mr-res ${k}">${k.toUpperCase()} ${esc(r.replace(/^(won|lost|drew)\s*/i, ""))}</span>`; }
  function matchRoomView(gid, o) {
    o = o || {}; if (!st.mstats) setTimeout(() => loadMyStats()); if (!st.tstats[gid]) setTimeout(() => loadTeamStats(gid));
    const now = Date.now(), list = (o.events || []).slice().sort((a, b) => a.start - b.start);
    const up = list.filter(x => x.start.getTime() + 2 * 3600e3 > now), past = list.filter(x => x.start.getTime() + 2 * 3600e3 <= now).reverse().slice(0, 6);
    const plans = st.plans || [], planOf = x => plans.find(p => p.group_id === gid && p.match_key === x.key);
    const kids = o.kids || [], next = up[0];
    const planBtn = x => { const p = planOf(x); if (o.coach && !p && !o.lead) return `<span class="muted mr-wait">No team sheet yet · the lead coach picks it</span>`; if (o.coach) return `<button type="button" class="btn${p && p.published ? "" : " primary"}" data-mpopen="${esc(x.key)}">${ic("clipboard")} ${p ? (p.published ? "Team sheet & tactics" : "Team sheet (draft)") : o.lead ? "Pick the team" : "No team sheet yet"}</button>`;
      return p && p.published ? `<a class="btn primary" href="#match/${esc(p.id)}">${ic("clipboard")} Team sheet &amp; tactics</a>` : `<span class="muted mr-wait">Team sheet coming soon</span>`; };
    const rk = x => rsvpKey(x.e.id, x.start.toLocaleDateString("en-CA")), upKeys = up.slice(0, 7).map(rk);
    if (upKeys.some(k => st.rsvp[k] === undefined)) setTimeout(() => loadRsvps(upKeys));
    const fam = r => r.user_role === "parent" || r.user_role === "player";
    const tally = x => { const rows = st.rsvp[rk(x)] || []; return { rows, yes: rows.filter(r => r.status === "yes"), no: rows.filter(r => r.status === "no") }; };
    const myAns = x => { const r = (st.rsvp[rk(x)] || []).find(r => r.user_id === A().uid); return r ? r.status : ""; };
    const yn = (x, big) => `<div class="rsvp mr-rsvp${big ? "" : " mini"}" data-rkey="${esc(rk(x))}" data-rgroup="${esc(gid)}"><div class="rsvp-row">${big ? `<span class="rsvp-q">${o.coach ? "Are you there?" : "Are you coming?"}</span>` : ""}
      <button type="button" class="rsvp-btn yes" data-rset="yes" aria-pressed="${myAns(x) === "yes"}" aria-label="Coming">${big ? `${ic("check")} Coming` : "✓"}</button><button type="button" class="rsvp-btn no" data-rset="no" aria-pressed="${myAns(x) === "no"}" aria-label="Not coming">${big ? "✗ Not coming" : "✗"}</button></div></div>`;
    const np = next && planOf(next), show = np && (np.published || o.coach);
    const subs = p => (p.subs || []).length ? `<div class="mp-subs"><b>Subs</b>${p.subs.map(x => `<span class="${o.me && x.player_id === o.me ? "me" : ""}">${esc(shortName(x.name))}</span>`).join("")}</div>` : "";
    const sheet = !next ? "" : show
      ? `<section class="mr-sec mr-sheet"><div class="mp-sech"><h3 class="cpd-h">Team sheet</h3><span class="pill">${esc(np.formation || "")}</span>${!np.published ? `<span class="pill">Draft</span>` : ""}</div>
          ${pitchHtml(np, { me: o.me })}${subs(np)}</section>
         ${gamePlanHtml(np, true) || (np.objective ? "" : `<section class="mr-sec mp-plan"><h3 class="cpd-h">Game plan</h3><p class="muted" style="margin:0">No game plan added yet.</p></section>`)}`
      : `<section class="mr-sec mr-sheet"><div class="mp-sech"><h3 class="cpd-h">Team sheet</h3></div>
          <div class="mr-ghost">${pitchHtml({ formation: (FORMS[SIDE[gid]] || [])[0], lineup: [] })}<div class="mr-ghost-msg">${ic("clipboard")}<b>${o.coach ? (o.lead ? "Pick the team for this match" : "The lead coach picks the team") : "Team sheet coming soon"}</b><span>${o.coach ? "Line-up, game plan and tactics" : "Your coach will post the line-up and game plan here"}</span></div></div></section>`;
    const hero = next ? `<article class="mr-next"><div class="mr-next-top"><span class="mr-k">Next match · ${esc(fmtD(next.start))}</span><span class="mr-ha ${isHome(next.e) ? "h" : "a"}">${isHome(next.e) ? "Home" : "Away"}</span></div>
        <h2>${esc(oppOf(next.e))}</h2>${matchTimes(next.start)}
        ${np && np.objective && show ? `<div class="mr-obj">${ic("target")} ${esc(np.objective)}</div>` : ""}
        ${yn(next, true)}
        ${o.coach && (o.lead || np) ? `<div class="mr-acts">${planBtn(next)}</div>` : ""}</article>` : `<div class="card empty">No matches coming up.</div>`;
    const who = next ? (() => { if (st.rsvp[rk(next)] === undefined) return `<section class="mr-sec"><h3 class="cpd-h">Who's coming</h3><p class="muted" style="margin:0">Checking…</p></section>`;
      const t = tally(next), fy = t.yes.filter(fam), fn = t.no.filter(fam), staff = t.yes.filter(r => !fam(r));
      const wait = o.squad != null ? Math.max(0, o.squad - t.rows.filter(fam).length) : null;
      const names = (l, cls) => l.length ? `<div class="mr-names ${cls}">${l.map(r => `<span>${esc(shortName(r.user_name || "Member"))}</span>`).join("")}</div>` : "";
      return `<section class="mr-sec mr-who"><h3 class="cpd-h">Who's coming</h3>
        <div class="mr-tally"><div class="y"><b>${fy.length}</b><small>Coming</small></div><div class="n"><b>${fn.length}</b><small>Not coming</small></div>${wait != null ? `<div class="q"><b>${wait}</b><small>No reply</small></div>` : ""}</div>
        ${fy.length ? `<h5>Coming</h5>${names(fy, "y")}` : ""}${fn.length ? `<h5>Not coming</h5>${names(fn, "n")}` : ""}${staff.length ? `<h5>Coaches</h5>${names(staff, "c")}` : ""}
        ${!t.rows.length ? `<p class="muted" style="margin:0;font-size:14px">No replies yet.</p>` : ""}</section>`; })() : "";
    const map = next && next.e.location ? `<section class="mr-sec"><h3 class="cpd-h">Getting there</h3>${venueMap(next.e.location)}</section>` : "";
    const row = (x, isPast) => { const p = planOf(x), mine = (st.mstats || []).filter(r => r.match_key === x.key);
      return `<div class="mr-row"><span class="mp-date"><b>${esc(String(x.start.getDate()))}</b><small>${esc(x.start.toLocaleDateString("en-GB", { month: "short" }))}</small></span>
        <span class="mp-mid"><b>${isHome(x.e) ? "vs" : "at"} ${esc(oppOf(x.e))}</b><small>${isPast ? esc(x.e.location || "") : `Arrive ${hm(arriveOf(x.start))} · KO ${hm(x.start)}${st.rsvp[rk(x)] ? ` · ✓${tally(x).yes.filter(fam).length} ✗${tally(x).no.filter(fam).length}` : ""}`}</small>${!isPast && !o.coach && p && p.published ? `<a class="mr-out" href="#match/${esc(p.id)}">Team out ›</a>` : ""}</span>
        ${isPast ? `<span class="mr-rr">${resultPill(x.e)}${kids.length || o.coach ? `<button type="button" class="chip mr-stat" data-mstat="${esc(x.key)}">${o.coach ? `Stats${mine.length ? " " + mine.length : ""}` : mine.length ? `${ic("check")} Stats` : "+ My stats"}</button>` : ""}</span>`
          : o.coach ? `<button type="button" class="pill ${p && p.published ? "cpd-ok" : ""}" data-mpopen="${esc(x.key)}">${p && p.published ? "Team out" : p ? "Draft" : o.lead ? "Pick team" : isHome(x.e) ? "Home" : "Away"}</button>`
          : yn(x, false)}</div>`; };
    const T = (st.tstats[gid] || []).slice(), top = (k, n) => T.filter(r => r[k] > 0).sort((a, b) => b[k] - a[k] || b.apps - a.apps).slice(0, n);
    const board = (k, label) => { const l = top(k, 5); return `<div class="mr-board"><h4>${label}</h4>${l.length ? l.map((r, i) => `<div><span class="mr-pos">${i + 1}</span><span>${esc(shortName(r.name))}</span><b>${r[k]}</b></div>`).join("") : `<p class="muted" style="margin:0;font-size:13px">None yet</p>`}</div>`; };
    return `<div class="mr">
      ${hero}${who}${sheet}${map}
      ${up.length > 1 ? `<details class="mr-sec mr-more"><summary><h3 class="cpd-h">Later fixtures <span class="muted">${Math.min(up.length - 1, 6)}</span></h3></summary><div class="mr-list">${up.slice(1, 7).map(x => row(x, false)).join("")}</div></details>` : ""}
      ${past.length ? `<section class="mr-sec"><h3 class="cpd-h">Results</h3><div class="mr-list">${past.map(x => row(x, true)).join("")}</div>${kids.length ? `<p class="muted" style="margin:0;font-size:13px">Played? Add your goals, assists and how it went.</p>` : ""}</section>` : ""}
      <section class="mr-sec"><h3 class="cpd-h">Season stats</h3><div class="mr-boards">${board("goals", "Goals")}${board("assists", "Assists")}${board("apps", "Games")}</div></section>
    </div>`;
  }
  const fmtD = d => new Date(d).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
  function statsSheet(gid, x, kids, coach) {
    if (!kids.length) return toastC(coach ? "No Player Passports in this team yet. Families create them in the app under Passport, or add players in Squad." : "Create your Player Passport first in Passport.");
    let pi = 0;
    const el = document.createElement("div"); el.className = "ci-sheet"; el.id = "st-sheet";
    const draw = () => { const k = kids[pi], r = (st.mstats || []).find(m => m.match_key === x.key && m.player_id === k.id) || { goals: 0, assists: 0, saves: 0, minutes: null, rating: null, note: "" };
      const step = (f, l) => `<div class="st-step"><span>${l}</span><button type="button" data-stm="${f}:-1" aria-label="Less">−</button><b id="st-${f}">${r[f] || 0}</b><button type="button" data-stm="${f}:1" aria-label="More">+</button></div>`;
      el.innerHTML = `<div class="ci-back" data-sclose></div><form class="ci-panel" id="st-form"><div class="ci-grab"></div>
        <span class="eyebrow">${esc(fmtD(x.start))} · ${isHome(x.e) ? "vs" : "at"} ${esc(oppOf(x.e))}</span><h2>Match stats</h2>
        ${kids.length > 1 ? `<div class="ci-kids">${kids.map((c, i) => `<button type="button" class="chip" data-stk="${i}" aria-pressed="${i === pi}">${esc(c.name)}</button>`).join("")}</div>` : `<b>${esc(k.name)}</b>`}
        ${r.verified ? `<p class="muted" style="margin:0;font-size:13px">${ic("check")} Checked by a coach</p>` : ""}
        <div class="field"><label for="st-min">Time played</label><select id="st-min"><option value="">Choose…</option>${[[0, "Didn't play"], [15, "Up to 15 min"], [30, "Up to 30 min"], [45, "Up to 45 min"], [60, "Up to 60 min"], [90, "The whole game"]].map(([v, l]) => `<option value="${v}"${r.minutes === v ? " selected" : ""}>${l}</option>`).join("")}</select></div>
        ${step("goals", "Goals")}${step("assists", "Assists")}${step("saves", "Saves")}
        <div class="field"><span class="lbl">How did ${coach ? "they" : "you"} play?</span><div class="st-rate">${[1, 2, 3, 4, 5].map(n => `<button type="button" data-str="${n}" aria-pressed="${r.rating === n}">${n}</button>`).join("")}</div></div>
        <div class="field"><label for="st-note">What went well?</label><input id="st-note" maxlength="300" value="${esc(r.note || "")}" placeholder="e.g. Won lots of headers"></div>
        ${coach ? `<label class="ci-ready"><input type="checkbox" id="st-clean" ${r.clean_sheet === true ? "checked" : ""}><span>Goalkeeper clean sheet (no goals conceded while playing)</span></label>` : (r.clean_sheet === true ? `<p class="muted">🧤 Clean sheet recorded by coach</p>` : "")}
        ${coach ? `<label class="ci-ready"><input type="checkbox" id="st-ver" ${r.verified ? "checked" : ""}><span>Checked by coach</span></label>` : ""}
        <button class="btn primary big" type="submit">Save stats</button><p class="ci-msg" id="st-msg"></p></form>`;
      el.querySelectorAll("[data-sclose]").forEach(b => b.onclick = close);
      el.querySelectorAll("[data-stk]").forEach(b => b.onclick = () => { pi = +b.dataset.stk; draw(); });
      el.querySelectorAll("[data-stm]").forEach(b => b.onclick = () => { const [f, d] = b.dataset.stm.split(":"), o = q("#st-" + f, el); o.textContent = Math.max(0, Math.min(f === "saves" ? 60 : 20, +o.textContent + +d)); });
      el.querySelectorAll("[data-str]").forEach(b => b.onclick = () => el.querySelectorAll("[data-str]").forEach(x2 => x2.setAttribute("aria-pressed", x2 === b)));
      q("#st-form", el).onsubmit = async e => { e.preventDefault(); const msg = q("#st-msg", el), mv = q("#st-min", el).value;
        if (mv === "") { msg.textContent = "Choose how long " + (coach ? "they" : "you") + " played."; msg.className = "ci-msg bad"; return; }
        const rt = el.querySelector('[data-str][aria-pressed="true"]');
        const row = { match_key: x.key, group_id: gid, player_id: k.id, match_title: `${isHome(x.e) ? "vs" : "at"} ${oppOf(x.e)}`, kickoff: x.start.toISOString(),
          goals: +q("#st-goals", el).textContent, assists: +q("#st-assists", el).textContent, saves: +q("#st-saves", el).textContent, minutes: +mv, rating: rt ? +rt.dataset.str : null, note: q("#st-note", el).value.trim() || null };
        if (coach) { row.verified = !!(q("#st-ver", el) || {}).checked; row.clean_sheet = row.verified && !!(q("#st-clean", el) || {}).checked; }
        const { error } = await sb().from("match_stats").upsert(row, { onConflict: "match_key,player_id" });
        if (error) { msg.textContent = "Couldn't save: " + error.message; msg.className = "ci-msg bad"; return; }
        toastC("Stats saved"); await loadMyStats(true); loadTeamStats(gid, true); if (kids.length > 1 && pi < kids.length - 1) { pi++; draw(); } else close(); };
    };
    const close = () => { el.remove(); document.body.classList.remove("ci-open"); };
    document.body.appendChild(el); document.body.classList.add("ci-open"); draw();
  }

  /* ---------- notifications ---------- */
  const pushSupported = () => "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
  const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent);
  const standalone = () => window.matchMedia("(display-mode: standalone)").matches || navigator.standalone;
  function b64ToBytes(b64) { const p = "=".repeat((4 - b64.length % 4) % 4), s = atob((b64 + p).replace(/-/g, "+").replace(/_/g, "/")); return Uint8Array.from([...s].map(c => c.charCodeAt(0))); }
  async function currentSub() { try { const reg = await navigator.serviceWorker.ready; return await reg.pushManager.getSubscription(); } catch (e) { return null; } }
  const optKey = "b2b.pushOff";
  function optedOut() { try { return localStorage.getItem(optKey) === "1"; } catch (e) { return false; } }
  function setOptOut(v) { try { v ? localStorage.setItem(optKey, "1") : localStorage.removeItem(optKey); } catch (e) {} }
  async function pushOn() {
    setOptOut(false);
    const perm = await Notification.requestPermission();
    if (perm !== "granted") throw new Error(perm === "denied" ? "Notifications are blocked for this app. Allow them in your phone or browser settings, then try again." : "Notifications weren't allowed.");
    const { data, error } = await sb().functions.invoke("notify", { body: { action: "vapid" } });
    if (error || !data || !data.publicKey) throw new Error("Couldn't reach the notification service. Try again shortly.");
    const reg = await navigator.serviceWorker.ready;
    let sub = await reg.pushManager.getSubscription();
    if (!sub) sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64ToBytes(data.publicKey) });
    const j = sub.toJSON();
    const r = await sb().from("push_subscriptions").upsert({ user_id: A().uid, endpoint: j.endpoint, p256dh: j.keys.p256dh, auth: j.keys.auth }, { onConflict: "endpoint" });
    if (r.error) throw r.error;
  }
  async function pushOff() {
    setOptOut(true);
    const sub = await currentSub(); if (!sub) return;
    await sb().from("push_subscriptions").delete().eq("endpoint", sub.endpoint);
    await sub.unsubscribe();
  }
  function alertsCard() {
    return `<div class="card alerts-card" id="alerts-card"><h3 class="cpd-h">Notifications</h3><div id="alerts-body"><p class="muted" style="margin:0">Checking…</p></div></div>`;
  }
  async function paintAlerts() {
    const el = q("#alerts-body"); if (!el) return;
    const emailOn = A().emailAlerts !== false;
    let push;
    if (!pushSupported()) push = isIOS() && !standalone()
      ? `<p style="margin:0">To get notifications on iPhone, add this app to your Home Screen first: tap <b>Share</b>, then <b>Add to Home Screen</b>, then open it from there.</p>`
      : `<p style="margin:0">This browser can't show notifications. Try Chrome or Safari, or rely on email.</p>`;
    else {
      const sub = await currentSub();
      push = sub ? `<p style="margin:0">Phone notifications are <b>on</b> for this device.</p><div class="actions"><button class="btn small ghost" type="button" id="push-off">Turn off</button></div>`
        : `<p style="margin:0">${optedOut() ? "Notifications are <b>off</b> on this phone." : "News and messages, straight to your phone."}</p><div class="actions"><button class="btn small primary" type="button" id="push-on">Turn on notifications</button></div>`;
    }
    el.innerHTML = `${push}<label class="gcheck alerts-email"><input type="checkbox" id="email-alerts" ${emailOn ? "checked" : ""}> Also email me announcements</label><p class="muted" id="alerts-msg" style="margin:0;font-size:14px"></p>`;
    const msg = (t, bad) => { const m = q("#alerts-msg"); if (m) { m.textContent = t; m.className = bad ? "bad" : "muted"; } };
    const on = q("#push-on"), off = q("#push-off"), em = q("#email-alerts");
    if (on) on.onclick = async () => { on.disabled = true; msg("Turning on…"); try { await pushOn(); msg(""); toastC("Notifications on"); } catch (e) { msg(e.message || String(e), true); } paintAlerts(); };
    if (off) off.onclick = async () => { await pushOff(); toastC("Notifications off"); paintAlerts(); };
    if (em) em.onchange = async () => { const { error } = await sb().rpc("set_email_alerts", { on_off: em.checked }); if (error) { em.checked = !em.checked; return msg("Couldn't save: " + error.message, true); } A().emailAlerts = em.checked; toastC(em.checked ? "Email alerts on" : "Email alerts off"); };
  }

  /* notifications are on by default: keep this device subscribed unless the person turned them off,
     and ask straight away on first open (phones only allow the system prompt after a tap) */
  async function ensurePush() {
    if (optedOut() || !pushSupported() || typeof Notification === "undefined" || Notification.permission !== "granted") return;
    try { await pushOn(); } catch (e) { /* stays quiet; the Account page shows the state */ }
  }
  let promptShown = false;
  async function startPush() {
    await ensurePush();
    if (promptShown || optedOut() || document.getElementById("push-sheet")) return;
    const iosInstall = !pushSupported() && isIOS() && !standalone();
    const ask = pushSupported() && typeof Notification !== "undefined" && Notification.permission === "default";
    if (!iosInstall && !ask) return;
    promptShown = true;
    const d = document.createElement("div");
    d.id = "push-sheet"; d.className = "push-sheet"; d.setAttribute("role", "dialog"); d.setAttribute("aria-modal", "true");
    d.innerHTML = `<div class="push-sheet-in"><div class="push-bell" aria-hidden="true">${ic("bell")}</div>
      <h2>Stay in the loop</h2>
      <p>${A().member ? "Session changes, club news and team messages, straight to your phone." : "Cover requests, club news, team messages and your Sunday reminder, straight to your phone."}</p>
      ${iosInstall ? `<ol class="push-steps"><li>Tap <b>Share</b> at the bottom of Safari</li><li>Tap <b>Add to Home Screen</b></li><li>Open Box to Box from the new icon</li></ol>
        <button type="button" class="btn primary big" id="ps-ok">Got it</button>`
      : `<button type="button" class="btn primary big" id="ps-on">Turn on notifications</button><p class="push-small">Your phone will ask once. Tap <b>Allow</b>.</p>`}
      <button type="button" class="linkbtn" id="ps-no">${iosInstall ? "Later" : "No thanks, keep them off"}</button></div>`;
    document.body.appendChild(d);
    const close = () => d.remove();
    const on = d.querySelector("#ps-on"), ok = d.querySelector("#ps-ok"), no = d.querySelector("#ps-no");
    if (on) on.onclick = async () => { on.disabled = true; on.textContent = "Turning on…"; try { await pushOn(); toastC("Notifications on"); } catch (e) { toastC(e.message || String(e)); } close(); paintAlerts(); paintNudge(); };
    if (ok) ok.onclick = close;
    no.onclick = () => { if (!iosInstall) setOptOut(true); close(); paintAlerts(); paintNudge(); };
  }

  /* home nudge: shown until notifications are on for this device */
  function nudgeCard() { return `<div id="push-nudge"></div>`; }
  function nudgeLater() { try { return +localStorage.getItem("b2b.nudgeLater") > Date.now(); } catch (e) { return false; } }
  async function paintNudge() {
    const el = q("#push-nudge"); if (!el) return;
    if (nudgeLater() || optedOut()) { el.innerHTML = ""; return; }
    const card = (title, body, btn) => `<div class="todo hot nudge"><span class="todo-k">Alerts</span><b>${title}</b><small>${body}</small>${btn ? `<div class="nudge-btns">${btn}<button type="button" class="btn small ghost" id="nudge-later">Not now</button></div>` : `<div class="nudge-btns"><button type="button" class="btn small ghost" id="nudge-later">Not now</button></div>`}</div>`;
    let html = "";
    if (!pushSupported()) {
      if (isIOS() && !standalone()) html = card("Get notifications", "Tap <b>Share</b> → <b>Add to Home Screen</b>, then open the app from the new icon.", "");
    } else if (typeof Notification !== "undefined" && Notification.permission === "denied") {
      html = card("Notifications are blocked", isIOS() ? "Settings → Notifications → Box to Box → Allow." : "Allow notifications for this site in your browser settings.", "");
    } else if (!(await currentSub())) {
      html = card("Turn on notifications", A().member ? "Session changes, news and messages, straight to your phone." : "Cover requests, news and your Sunday reminder.", `<button type="button" class="btn small primary" id="nudge-on">Turn on</button>`);
    }
    el.innerHTML = html;
    const on = q("#nudge-on"), later = q("#nudge-later");
    if (on) on.onclick = async () => { on.disabled = true; try { await pushOn(); toastC("Notifications on"); } catch (e) { toastC(e.message || String(e)); } paintNudge(); paintAlerts(); };
    if (later) later.onclick = () => { try { localStorage.setItem("b2b.nudgeLater", String(Date.now() + 3 * 864e5)); } catch (e) {} el.innerHTML = ""; };
  }

  /* venue name + a Google Maps directions link */
  const KNOWN_VENUES = [[/fowlers/i, "Fowlers Park, 107 Nine Elms Lane, Wolverhampton WV10 9AW"],
    [/silverdale football club/i, "Silverdale football pitch, Walstead Road, Walsall"],
    [/tactica/i, "Darlaston Town FC, Bentley Road North, Darlaston"],
    [/pelsall edc/i, "Education Development Centre, Pelsall Lane, Walsall WS4 1NG"],
    [/hawkins sports/i, "Hawkins Football & Cricket Club, Coppice Lane, Cheslyn Hay WS6 7EY"]];
  function mapQuery(loc) {
    const k = KNOWN_VENUES.find(([re]) => re.test(loc)); if (k) return k[1];
    const base = String(loc).replace(/\s*(pitch|pitches|field)\s*\d+\s*$/i, "").replace(/\s+\d+v\d+\s*$/i, "").trim();
    return /\b(wolverhampton|walsall|west midlands|WV\d|WS\d|B\d)\b/i.test(base) ? base : base + ", West Midlands";
  }
  function venueLine(loc, cls) {
    if (!loc) return "";
    const url = "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(mapQuery(loc));
    return `<span class="${cls || "cal-sub"} venue"><span>${ic("pin")} ${esc(loc)}</span> <a class="map-link" href="${url}" target="_blank" rel="noopener">Directions</a></span>`;
  }

  /* FA Full-Time fixtures, shaped like timetable events so every view (calendar, team page, parents' app) can use them */
  const shortTeam = n => String(n || "").replace(/\s+U\d{1,2}s?$/i, "").trim();
  function fixtureEvents(rows) {
    return (rows || []).map(f => {
      const start = new Date(f.kickoff), played = f.home_score != null && f.away_score != null;
      const us = f.is_home ? f.home_score : f.away_score, them = f.is_home ? f.away_score : f.home_score;
      const result = played ? `${us > them ? "Won" : us < them ? "Lost" : "Drew"} ${us}–${them}` : "";
      return { id: "fx:" + f.id, fixture: true, kind: "match", group_id: f.group_id, title: `${f.is_home === false ? "Away at" : "Home vs"} ${shortTeam(f.opponent)}`,
        starts_at: start.toISOString(), ends_at: new Date(start.getTime() + 90 * 60000).toISOString(), repeat_until: null, location: f.venue || "",
        notes: [f.comp && f.comp !== "Cup" ? "League" : f.comp, result].filter(Boolean).join(" · "), result, played, home: f.is_home !== false, opponent: shortTeam(f.opponent), us, them };
    });
  }
  async function loadFixtures() {
    if (!sb() || !navigator.onLine) return null;
    const from = new Date(Date.now() - 60 * 864e5).toISOString(), to = new Date(Date.now() + 150 * 864e5).toISOString();
    const { data, error } = await sb().from("fixtures").select("*").gte("kickoff", from).lte("kickoff", to).order("kickoff");
    return error ? null : fixtureEvents(data);
  }

  return { st, gname, myGroups, isStaff, when, esc, loadAnn, annList, annListFor, annComposer, fixtureEvents, loadFixtures, venueLine, bindAnn, rsvpKey, loadRsvps, rsvpBar, bindRsvp, fold, foldHead,
    chatView, inboxView, chatHead, bindChat, checkinCard, checkinSheet, bindCheckin,
    matchKey, matchTimes, arriveOf, venueMap, matchRoomView, statsSheet, loadMyStats, loadTeamStats, isHome, oppOf,
    SIDE, FORMS, slotsFor, loadPlans, loadLeads, pitchHtml, planView, planCard, gamePlanHtml, planWhen, shortName,
    loadPlayers, familyPlayers, myPlayer, loadPassport, passportView, bindPassport, ask, yes, maybeWelcome, helpHtml, loadSpotlight, spotlightHtml, loadSyllabus, sylFor, sylAim, ppTier, giveAward, quizSheet, loadRules, canPost, careSheet, privacyHtml, privacySheet, PHOTO_SHORT, currentSeason, careMissing, careComplete, careNeedsReview, recordAttendance, ppStats, startChat, stopChat, loadUnread, unread, unreadCount, alertsCard, paintAlerts, nudgeCard, paintNudge, startPush, notify };
})();
