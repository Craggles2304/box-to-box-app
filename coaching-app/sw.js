const CACHE='b3b-2026-10-28-pro-v51';
const FILES=['./','index.html','app.js','operations.js','auth.js','member.js','supabase.js','config.js','manifest.webmanifest','jspdf.umd.min.js','icons/logo.png','icons/icon-192.png','icons/icon-512.png','icons/apple-touch-icon.png','icons/favicon.png','b2b-features/journey.js','b2b-features/journey.css','b2b-features/team-session-dna.js','b2b-features/team-session-dna.css','b2b-features/tactics-simple.js','b2b-features/tactics-simple.css','b2b-features/matchday-quick.js','b2b-features/matchday-quick.css','b2b-features/coach-home.js','b2b-features/coach-home.css','b2b-features/quick-moment.js','b2b-features/quick-moment.css','b2b-features/parent-live.js','b2b-features/parent-live.css','b2b-features/parent-onboarding.js','b2b-features/parent-onboarding.css','b2b-features/host.js','b2b-features/host.css','b2b-features/keepup-routine.js','b2b-features/keepup-routine.css','b2b-features/day-hub.js','b2b-features/day-hub.css','b2b-features/day-core.js','b2b-features/expectations.js','b2b-features/tactics-hub.js','b2b-features/tactical-fit.js','b2b-features/sport-visuals.js','b2b-features/performance.css','b2b-features/academy-system.css','b2b-features/premium-v49.css','b2b-features/pro.css','b2b-features/premium-v49.js','b2b-features/tactics-hub.css'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET')return;
  const u=new URL(e.request.url); if(u.origin!==location.origin)return; // Supabase and other sites go straight to the network
  const key=e.request.mode==='navigate'?'index.html':u.pathname.replace(/^\//,'')||'index.html';
  const fresh=/\.(js|html)$/.test(key)||e.request.mode==='navigate';
  if(fresh){ // network first so updates arrive; cached copy when offline
    e.respondWith(fetch(e.request).then(r=>{if(r.ok){const c=r.clone();caches.open(CACHE).then(x=>x.put(key,c))}return r}).catch(()=>caches.match(key,{ignoreSearch:true})));
    return;
  }
  e.respondWith(caches.match(e.request,{ignoreSearch:true}).then(r=>r||fetch(e.request)));
});

/* phone notifications */
self.addEventListener('push',e=>{
  let d={}; try{d=e.data?e.data.json():{}}catch(x){d={body:e.data&&e.data.text()}}
  e.waitUntil(self.registration.showNotification(d.title||'Box to Box',{body:d.body||'',icon:'icons/icon-192.png',badge:'icons/favicon.png',tag:d.tag||undefined,renotify:!!d.tag,data:{url:d.url||'./'}}));
});
self.addEventListener('notificationclick',e=>{
  e.notification.close();
  const url=new URL(e.notification.data&&e.notification.data.url||'./',self.registration.scope).href;
  e.waitUntil(self.clients.matchAll({type:'window',includeUncontrolled:true}).then(cs=>{
    for(const c of cs){ if(c.url.startsWith(self.registration.scope)){ c.focus(); return c.navigate?c.navigate(url):null; } }
    return self.clients.openWindow(url);
  }));
});
