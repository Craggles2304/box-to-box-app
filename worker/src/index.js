// Box to Box accounts API (Cloudflare Worker + D1)
// Routes: /api/health, /api/auth/request, /api/auth/verify, /api/auth/logout, /api/me, /api/players

const enc = new TextEncoder();
const SESSION_DAYS = 30;
const LINK_MINUTES = 15;
const MAX_PLAYERS = 5;

const hex = (buf) => [...new Uint8Array(buf)].map((x) => x.toString(16).padStart(2, "0")).join("");
const randomToken = () => { const a = new Uint8Array(32); crypto.getRandomValues(a); return hex(a); };
const sha256 = async (s) => hex(await crypto.subtle.digest("SHA-256", enc.encode(s)));
const nowIso = () => new Date().toISOString();
const inMinutes = (m) => new Date(Date.now() + m * 60000).toISOString();
const inDays = (d) => new Date(Date.now() + d * 86400000).toISOString();
const uid = () => randomToken().slice(0, 24);

function corsHeaders(env) {
  return {
    "Access-Control-Allow-Origin": env.APP_ORIGIN,
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Vary": "Origin",
  };
}

function json(env, body, status = 200, extra = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders(env), ...extra },
  });
}

function getCookie(request, name) {
  const raw = request.headers.get("Cookie") || "";
  for (const part of raw.split(";")) {
    const [k, ...v] = part.trim().split("=");
    if (k === name) return decodeURIComponent(v.join("="));
  }
  return null;
}

function sessionCookie(token, maxAgeSeconds) {
  return `b2b_session=${encodeURIComponent(token)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAgeSeconds}`;
}

// Returns the parent row for the request's session, or null.
async function currentParent(env, request) {
  const auth = request.headers.get("Authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : getCookie(request, "b2b_session");
  if (!token) return null;
  const hash = await sha256(token);
  const row = await env.DB.prepare(
    `SELECT p.id, p.email FROM sessions s JOIN parents p ON p.id = s.parent_id
     WHERE s.token_hash = ? AND s.expires_at > ?`
  ).bind(hash, nowIso()).first();
  return row || null;
}

async function sendSignInEmail(env, to, link) {
  if (!env.RESEND_API_KEY || !env.MAIL_FROM) return false;
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: env.MAIL_FROM,
      to: [to],
      subject: "Your Box to Box sign-in link",
      html: `<p>Tap to sign in to Box to Box. This link works once and expires in ${LINK_MINUTES} minutes.</p><p><a href="${link}">Sign in</a></p><p>If you didn't ask for this, you can ignore this email.</p>`,
    }),
  });
  return res.ok;
}

async function handleAuthRequest(env, request) {
  let body;
  try { body = await request.json(); } catch { return json(env, { error: "bad_json" }, 400); }
  const email = String(body.email || "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    return json(env, { error: "invalid_email" }, 400);
  }
  const token = randomToken();
  await env.DB.prepare(
    `INSERT INTO magic_links (token_hash, email, expires_at, used_at) VALUES (?, ?, ?, NULL)`
  ).bind(await sha256(token), email, inMinutes(LINK_MINUTES)).run();

  const link = `${env.API_BASE}/api/auth/verify?token=${token}`;
  const sent = await sendSignInEmail(env, email, link);
  // Always answer the same way so the endpoint can't be used to check who has an account.
  return json(env, { sent: true, emailConfigured: sent });
}

async function handleAuthVerify(env, request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token") || "";
  if (!token) return new Response("Missing token", { status: 400 });
  const hash = await sha256(token);
  const link = await env.DB.prepare(
    `SELECT email, expires_at, used_at FROM magic_links WHERE token_hash = ?`
  ).bind(hash).first();
  if (!link || link.used_at || link.expires_at < nowIso()) {
    return new Response("This sign-in link has expired or was already used. Ask for a new one.", { status: 400 });
  }
  await env.DB.prepare(`UPDATE magic_links SET used_at = ? WHERE token_hash = ?`).bind(nowIso(), hash).run();

  let parent = await env.DB.prepare(`SELECT id FROM parents WHERE email = ?`).bind(link.email).first();
  if (!parent) {
    const id = uid();
    await env.DB.prepare(
      `INSERT INTO parents (id, email, created_at, consent_version, consent_at) VALUES (?, ?, ?, NULL, NULL)`
    ).bind(id, link.email, nowIso()).run();
    parent = { id };
  }

  const session = randomToken();
  await env.DB.prepare(
    `INSERT INTO sessions (token_hash, parent_id, expires_at, created_at) VALUES (?, ?, ?, ?)`
  ).bind(await sha256(session), parent.id, inDays(SESSION_DAYS), nowIso()).run();

  return new Response(null, {
    status: 302,
    headers: { Location: `${env.APP_URL}#session=${session}` },
  });
}

async function handleLogout(env, request) {
  const token = getCookie(request, "b2b_session");
  if (token) {
    await env.DB.prepare(`DELETE FROM sessions WHERE token_hash = ?`).bind(await sha256(token)).run();
  }
  return json(env, { ok: true }, 200, { "Set-Cookie": sessionCookie("", 0) });
}

async function handleMe(env, request) {
  const parent = await currentParent(env, request);
  if (!parent) return json(env, { signedIn: false }, 401);
  const players = await env.DB.prepare(
    `SELECT id, nickname, age FROM players WHERE parent_id = ? ORDER BY created_at`
  ).bind(parent.id).all();
  const ent = await env.DB.prepare(
    `SELECT product, status, current_period_end FROM entitlements WHERE parent_id = ?`
  ).bind(parent.id).all();
  const entitlements = {};
  for (const e of ent.results || []) entitlements[e.product] = { status: e.status, currentPeriodEnd: e.current_period_end };
  return json(env, {
    signedIn: true,
    parent: { email: parent.email },
    players: players.results || [],
    entitlements,
  });
}

async function handleAddPlayer(env, request) {
  const parent = await currentParent(env, request);
  if (!parent) return json(env, { error: "not_signed_in" }, 401);
  let body;
  try { body = await request.json(); } catch { return json(env, { error: "bad_json" }, 400); }
  const nickname = String(body.nickname || "").replace(/[^\p{L}\p{N} ._-]/gu, "").trim().slice(0, 16);
  const age = Number(body.age);
  if (!nickname) return json(env, { error: "nickname_required" }, 400);
  if (!Number.isInteger(age) || age < 5 || age > 18) return json(env, { error: "age_out_of_range" }, 400);
  const count = await env.DB.prepare(`SELECT COUNT(*) AS n FROM players WHERE parent_id = ?`).bind(parent.id).first();
  if (count && count.n >= MAX_PLAYERS) return json(env, { error: "too_many_players" }, 400);
  const id = uid();
  await env.DB.prepare(
    `INSERT INTO players (id, parent_id, nickname, age, created_at) VALUES (?, ?, ?, ?, ?)`
  ).bind(id, parent.id, nickname, age, nowIso()).run();
  return json(env, { id, nickname, age }, 201);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders(env) });

    try {
      const p = url.pathname;
      if (p === "/api/health" && request.method === "GET") return json(env, { ok: true });
      if (p === "/api/auth/request" && request.method === "POST") return handleAuthRequest(env, request);
      if (p === "/api/auth/verify" && request.method === "GET") return handleAuthVerify(env, request);
      if (p === "/api/auth/logout" && request.method === "POST") return handleLogout(env, request);
      if (p === "/api/me" && request.method === "GET") return handleMe(env, request);
      if (p === "/api/players" && request.method === "POST") return handleAddPlayer(env, request);
      return json(env, { error: "not_found" }, 404);
    } catch (err) {
      return json(env, { error: "server_error" }, 500);
    }
  },
};
