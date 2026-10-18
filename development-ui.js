/* Shared academy branding, with player-focused navigation and existing training state. */
brand=function(){return `<button class="brand" data-act="tab" data-v="home" aria-label="Box to Box home"><img class="brand-logo" src="./assets/logo.png" alt="" width="52" height="47"><span>BOX TO BOX<small>PLAYER DEVELOPMENT</small></span></button><span class="brand-context">The work between<br>the sessions.</span>`};

const accountHeader=header;
header=function(){
  const html=accountHeader();
  if(!accountReady())return html;
  return html.replace('<div class="right">',`<div class="right"><span class="sync-badge" data-sync-status data-state="${syncState}">${syncLabel()}</span>`);
};

viewToday=function(){
  const hit=PILLAR.map(p=>({p,n:planInfo(p.k).nextId})).find(x=>x.n&&sessState(x.n)==="next");
  const W=WEEK[S.stage],days=weekDays().filter(trainedOn).length,L=lvl(S.xp);
  const date=new Date().toLocaleDateString('en-GB',{weekday:'long',day:'numeric',month:'long',timeZone:'Europe/London'});
  return `<div class="development-home"><section class="hero"><div class="wrap">
    <div class="stack" style="gap:22px"><span class="eyebrow mission-kicker">${esc(date)} · Your development hub</span>
      <h1>Your next level.<br><em class="v">Starts here.</em></h1>
      <p class="lead">Ready, ${esc(S.nick)}? One session. One small improvement. Your ${esc(STAGES[S.stage].name)} plan is waiting.</p>
      <div class="row">${hit?`<button class="btn" data-act="open" data-id="${hit.n}">Start my next session ${ARROW}</button>`:`<button class="btn" data-act="tab" data-v="challenges">Open my training ${ARROW}</button>`}<button class="more" data-act="tab" data-v="me">My progress ${ARROW}</button></div>
    </div>
    <div><div class="stadium"><div class="pitchwrap">${pitchSVG(S.xp)}</div></div><div class="hero-caption"><span>Your journey · Level ${L.i+1}</span><span>${esc(L.name)}</span></div></div>
  </div></section>
  <div class="wrap"><div class="home-stats" aria-label="Your training progress">
    <div><span class="eyebrow">Your level</span><b style="color:var(--volt)">${esc(STAGES[S.stage].name)}</b></div>
    <div><span class="eyebrow">This week</span><b>${days}<small> / ${W.days} days</small></b></div>
    <div><span class="eyebrow">Your streak</span><b>${liveStreak()}<small> days</small></b></div>
    <div><span class="eyebrow">Total earned</span><b>${S.xp.toLocaleString()}<small> XP</small></b></div>
  </div>
  <div class="home-columns"><div>${todayBlock()}</div><aside class="home-aside" aria-label="Your training tools">
    ${nextBadgeCard()}
    <a href="https://boxtobox-coaching.netlify.app/" target="_blank" rel="noopener"><span class="eyebrow">Box to Box Coaching</span><h3>From the session.<br>Into your game.</h3><p class="small muted">Open the academy coaching app for your group's session content. Your coaching app account is separate.</p><span class="more">Open coaching app ${ARROW}</span></a>
    <button data-act="tab" data-v="journal"><span>Reflect on your last game</span>${ARROW}</button>
    <button data-act="ics"><span>Add a 5pm training reminder</span>${ARROW}</button>
    ${syncState==='offline'?`<button data-act="retry-sync"><span>Retry saving your progress</span>${ARROW}</button>`:''}
  </aside></div>
  <section class="sec" style="border-top:1px solid var(--line)"><span class="eyebrow">Build the complete player</span><h2 style="margin-top:10px">Three parts. <em class="v">One player.</em></h2>
    <div class="home-pillars">${PILLAR.map((p,i)=>{const I=planInfo(p.k);return `<button class="pillar-link" style="--c:${p.col}" data-act="dashboard-pillar" data-v="${p.k}"><span class="eyebrow" style="color:${p.col}">0${i+1} · ${esc(PILLARS[p.k].verb)}</span><b>${esc(p.n)}</b><span class="small muted">${esc(PILLARS[p.k].line)}</span><span class="pillar-meta">${I.done} of ${I.ids.length} sessions complete</span>${ARROW}</button>`}).join('')}</div>
  </section>
  <footer class="development-footer"><span>Box to Box Football Academy · Better players. Better people.</span><a href="mailto:admin@boxtoboxacademy.co.uk">Need a hand? Contact the academy</a></footer></div></div>`;
};

document.addEventListener('click',e=>{
  const button=e.target.closest('[data-act]');if(!button)return;
  if(button.dataset.act==='dashboard-pillar'){
    trainTab=button.dataset.v;filterS=S.stage;msub='plan';trainRoute='off';view='challenges';stopTimer();render();window.scrollTo(0,0);
  }
  if(button.dataset.act==='retry-sync')pushState().then(()=>render());
});

window.addEventListener('online',()=>{if(accountReady())pushState().then(()=>render())});
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&accountReady())pushState()});
