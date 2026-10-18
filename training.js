/* Training journeys use the authenticated player's existing saved progress. */
const TRAINING_FOCUS={move:'Ball skills and movement',mind:'Focus and confidence',ment:'Habits and decisions'};
let trainingLibrary='plan';
const originalRouteIds=routeIds;
routeIds=function(pk,s,ids){return view==='challenges'&&trainingLibrary==='plan'?ids:originalRouteIds(pk,s,ids)};
function trainingSettings(){
  const q=S.trainingPrefs||{};
  return `<details class="drill training-settings"><summary><h3>Make the week yours</h3><span class="plus">+</span></summary><div class="dbody"><form id="training-preferences"><label class="field">This week's focus<select name="focus">${Object.entries(TRAINING_FOCUS).map(([k,v])=>`<option value="${k}" ${q.focus===k?'selected':''}>${v}</option>`).join('')}</select></label><label class="field">Home training days each week<select name="days">${[2,3,4].map(n=>`<option value="${n}" ${(q.days||3)===n?'selected':''}>${n} days</option>`).join('')}</select></label><label class="field">Football training or match days to keep free<span class="small">These are recovery / club days in your home plan.</span><span class="training-day-options">${['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map((d,i)=>`<label><input name="clubDays" type="checkbox" value="${i}" ${(q.clubDays||[]).includes(i)?'checked':''}>${d}</label>`).join('')}</span></label><button class="btn" type="submit">Save my week</button><p class="small">Short home sessions complement your club football. You can change this any time.</p></form></div></details>`;
}
function trainingWeek(){
  const q=S.trainingPrefs||{},days=weekDays(),available=[0,2,4,1,3,5,6].filter(i=>!(q.clubDays||[]).includes(i)),selected=new Set(available.slice(0,q.days||3));
  const first=TRAINING_FOCUS[q.focus]?q.focus:'move',rotation=[first,...PILLAR.map(p=>p.k).filter(k=>k!==first)];
  let slot=0;
  return days.map((d,i)=>({day:d,label:['Mon','Tue','Wed','Thu','Fri','Sat','Sun'][i],club:(q.clubDays||[]).includes(i),focus:selected.has(i)?rotation[slot++%3]:null,done:trainedOn(d)}));
}
function trainingWeekCard(){
  const rows=trainingWeek(),q=S.trainingPrefs||{},focus=TRAINING_FOCUS[q.focus]||TRAINING_FOCUS.move;
  return `<section class="sec training-week"><span class="eyebrow">Your home training week</span><h2>Small sessions.<br><em class="v">Real habits.</em></h2><p class="muted">Your focus: ${focus}. Your pathway stays in order; the weekly plan suggests when to practise.</p><div class="training-week-grid">${rows.map(r=>`<div class="training-day ${r.day===dayKey()?'today':''}"><b>${r.label}</b><span>${r.done?'Activity recorded':r.club?'Club / match':r.focus?TRAINING_FOCUS[r.focus]:'Rest / free play'}</span>${r.focus?`<button class="more" data-act="dashboard-pillar" data-v="${r.focus}">Open plan ${ARROW}</button>`:''}</div>`).join('')}</div>${trainingSettings()}</section>`;
}
function resumableTraining(){const a=S.activeTraining,c=a&&byId[a.id];return c&&c.s===S.stage&&['next','done','open'].includes(sessState(c.id))?a:null}
const trainingHome=viewToday;
viewToday=function(){
  let h=trainingHome(),a=resumableTraining();
  if(a)h=h.replace('<div class="home-stats"',`<section class="sec resume-training"><span class="eyebrow">Pick up where you left off</span><h2>${esc(byId[a.id].t)}</h2><p class="small">Step ${a.i} · Your answers are saved with this player.</p><button class="btn" data-act="training-resume">Resume session ${ARROW}</button></section><div class="home-stats"`);
  return h.replace('<div class="home-columns">',trainingWeekCard()+'<div class="home-columns">');
};
viewList=function(){
  if(['basics','pos','workouts'].includes(trainTab)){trainingLibrary=trainTab;trainTab='move'}
  if(!PK[trainTab])trainTab='move';
  const P=PK[trainTab],lib=trainingLibrary;
  const tabs=`<div class="ptabs" role="group" aria-label="Training section" style="grid-template-columns:repeat(3,1fr)">${PILLAR.map(p=>`<button data-act="training-pillar" data-v="${p.k}" aria-pressed="${P.k===p.k}" style="--c:${p.col}"><b>${p.n}</b></button>`).join('')}</div>`;
  const tools=`<div class="training-tools" role="group" aria-label="Training tools">${[['plan','Learning plan'],['basics','Ball drills'],['pos','Position drills'],['workouts','Physical practice'],['tools','Mind tools']].map(([k,n])=>`<button class="more" data-act="training-library" data-v="${k}" aria-pressed="${lib===k}">${n}</button>`).join('')}</div>`;
  let body='';
  if(lib==='basics')body=`<h2>Ball skills</h2><p class="muted">Follow the setup diagram, practise, then record your score. Compare against your own previous attempts.</p><div class="drills">${BASICS.map(d=>drillCard(d)).join('')}</div>`;
  else if(lib==='workouts')body=`<h2>Physical practice</h2><p class="muted">Choose one activity to complement your football. Follow your age-level instructions and allow recovery between demanding sessions.</p><div class="drills">${WK.map(d=>drillCard(d)).join('')}</div>`;
  else if(lib==='pos'){
    const pk=POS[posView||S.pos]?posView||S.pos:null;
    body=`<h2>Train your position</h2><div class="pills" role="group" aria-label="Position">${Object.entries(POS).map(([k,p])=>`<button data-act="pos" data-v="${k}" aria-pressed="${pk===k}">${p.n}</button>`).join('')}</div>${pk?`<p class="muted">${esc(POS[pk].profile)}</p>${S.pos!==pk?`<button class="btn small" data-act="setpos" data-v="${pk}">Save ${esc(POS[pk].n)} as my position</button>`:''}<div class="drills">${POS[pk].drills.map(d=>drillCard(d)).join('')}</div>`:'<p class="notice">Choose a position to see your drills.</p>'}`;
  }else if(lib==='tools')body=`<h2>Train your mind</h2><div class="training-tools">${[['rep','Daily mental rep'],['reset','Mistake reset'],['conf','Confidence builder'],['journal','Match journal'],['scen','Match decisions']].map(([k,n])=>`<button class="btn ghost" data-act="gomind" data-v="${k}">${n}</button>`).join('')}</div>`;
  else{trainingLibrary='plan';body=planBlock(P)}
  return `<div class="wrap">${tabs}${pillarHead(P)}${tools}<section class="sec">${body}</section></div>`;
};
function trainingReport(){
  const end=dayKey(),since=dayKey(new Date(Date.now()-27*864e5)),logs=S.log.filter(l=>l.day>=since&&l.day<=end);
  const days=new Set([...logs.map(l=>l.day),...Object.keys(S.days||{}).filter(d=>d>=since&&d<=end)]);
  const scoreRows=Object.entries(S.scores||{}).map(([id,all])=>{
    const b=BM[id],L=all.filter(x=>x&&Number.isFinite(x.v)&&x.d>=since&&x.d<=end);if(!b||!L.length||!ALLDRILLS[id])return '';
    const a=L[0].v,z=L[L.length-1].v,improved=b.lower?z<a:z>a;
    return `<tr><th scope="row">${esc(ALLDRILLS[id].t)}</th><td>${a} → ${z} ${esc(b.unit)}</td><td>${L.length<2?'Baseline recorded':z===a?'Same score':improved?'Improved':'Keep practising'}</td></tr>`;
  }).filter(Boolean);
  const focus=TRAINING_FOCUS[S.trainingPrefs?.focus]||TRAINING_FOCUS.move;
  return `<section class="sec training-report"><span class="eyebrow">Last 28 days · ${since} to ${end}</span><h2>${esc(S.nick)}'s development</h2><p class="muted">Recorded activity and self-reported scores. XP rewards participation; it is not a measure of football ability.</p><div class="home-stats"><div><span>Sessions completed</span><b>${logs.length}</b></div><div><span>Active days</span><b>${days.size}</b></div><div><span>Personal bests</span><b>${(S.pbs||[]).filter(x=>x.d>=since&&x.d<=end).length}</b></div></div><div class="training-tools">${PILLAR.map(p=>`<span class="chip">${p.n}: ${logs.filter(l=>pillarOf(l.id)===p.k).length} sessions</span>`).join('')}</div><h3>Skill scores over time</h3>${scoreRows.length?`<div class="training-table"><table><thead><tr><th>Skill</th><th>First → latest</th><th>Progress</th></tr></thead><tbody>${scoreRows.join('')}</tbody></table></div>`:'<p class="notice">No skill scores recorded in this period. Start with a ball drill and log a baseline; repeat the same test to compare fairly.</p>'}<p><strong>Next focus:</strong> ${focus}.</p><button class="btn ghost" data-act="training-library" data-v="basics">Record a skill score ${ARROW}</button></section>`;
}
const trainingParents=viewParentsAcct;
viewParentsAcct=function(){return trainingParents()+`<div class="wrap">${trainingReport()}</div>`};
const trainingProgress=viewMe;
viewMe=function(){return `<div class="wrap">${trainingReport()}</div>`+trainingProgress()};
function saveTrainingDraft(){
  if(!accountReady()||view!=='play'||!play)return;
  S.activeTraining={id:play.id,i:play.i,draft:JSON.parse(JSON.stringify(draft))};save();
}
const trainingComplete=complete;
complete=function(id){
  if(!accountReady()||!play||play.id!==id||play.i!==lastIdx(byId[id])||!draft.feel[id])return;
  if(!['next','done','open'].includes(sessState(id)))return;
  delete S.activeTraining;trainingComplete(id);
};
document.addEventListener('submit',e=>{
  if(e.target.id!=='training-preferences')return;e.preventDefault();
  const f=e.target;S.trainingPrefs={focus:f.elements.focus.value,days:Number(f.elements.days.value),clubDays:[...f.querySelectorAll('[name="clubDays"]:checked')].map(x=>Number(x.value))};save();render();toast('Your training week is saved');
});
document.addEventListener('click',e=>{
  const b=e.target.closest('[data-act]');if(!b||!accountReady())return;const a=b.dataset.act;
  if(a==='training-library'){trainingLibrary=b.dataset.v;view='challenges';trainTab='move';filterS=S.stage;stopTimer();render();window.scrollTo(0,0)}
  else if(a==='training-pillar'){trainingLibrary='plan';trainTab=b.dataset.v;render();window.scrollTo(0,0)}
  else if(a==='dashboard-pillar'||a==='ttab'){trainingLibrary='plan';render()}
  else if(a==='godrill'){trainingLibrary=b.dataset.t||'basics';render()}
  else if(a==='training-resume'){
    const r=resumableTraining();if(!r){toast('That session is no longer available. Choose your next session.');return}
    draft={steps:{},feel:{},note:{},w:{},...r.draft};play={id:r.id,i:Math.min(lastIdx(byId[r.id]),Math.max(0,r.i))};view='play';render();window.scrollTo(0,0);
  }
  if(['open','step','feel','fself'].includes(a))saveTrainingDraft();
});
document.addEventListener('input',e=>{if(e.target.matches('[data-w],[data-note]'))saveTrainingDraft()});
// Reset this player's progress while keeping the account and profile usable.
document.addEventListener('click',e=>{
  const b=e.target.closest('[data-act="doreset"]');if(!b||!accountReady())return;
  e.preventDefault();e.stopImmediatePropagation();
  const profile={nick:S.nick,age:S.age,stage:S.age<=9?'g':'d',kit:S.kit,consent:S.consent,trainingPrefs:S.trainingPrefs,pos:S.pos};
  resetActivePlayer();Object.assign(S,profile);ensure();filterS=S.stage;applyAgeContent();applyCalib();save();view='home';render();toast('Player progress reset');
},true);
