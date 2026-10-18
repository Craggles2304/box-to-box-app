const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {JSDOM,VirtualConsole}=require('jsdom');
const root=path.resolve(__dirname,'..');
const auth=fs.readFileSync(path.join(root,'account-flow.js'),'utf8');
const ui=fs.readFileSync(path.join(root,'development-ui.js'),'utf8');
const training=fs.readFileSync(path.join(root,'training.js'),'utf8');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8')
  .replace(/<script src="\.\/account-flow\.js[^\"]*"><\/script>/,()=>'<script>'+auth+'</script>')
  .replace(/<script src="\.\/development-ui\.js[^\"]*"><\/script>/,()=>'<script>'+ui+'</script>')
  .replace(/<script src="\.\/training\.js[^\"]*"><\/script>/,()=>'<script>'+training+'</script>');
const pause=()=>new Promise(r=>setTimeout(r,25));
const profile={id:'player-a',nickname:'Rocket',age:10};
function start({stored={},fetcher}={}){
  const errors=[],calls=[];
  const vc=new VirtualConsole();vc.on('jsdomError',e=>{if(e.type!=='css-parsing')errors.push(e.message)});
  const dom=new JSDOM(html,{url:'https://boxtoboxdevelopment.co.uk/',runScripts:'dangerously',virtualConsole:vc,beforeParse(w){
    w.scrollTo=()=>{};w.HTMLElement.prototype.scrollIntoView=()=>{};
    for(const [k,v] of Object.entries(stored))w.localStorage.setItem(k,v);
    w.fetch=async(url,options={})=>{
      const p=new URL(url).pathname;calls.push({path:p,method:options.method||'GET',body:options.body&&JSON.parse(options.body),authorization:options.headers?.Authorization});
      const result=fetcher?await fetcher(p,options):{status:401,body:{signedIn:false}};
      return {ok:result.status>=200&&result.status<300,status:result.status,json:async()=>result.body};
    };
  }});
  return {dom,w:dom.window,calls,errors,close(){dom.window.close()}};
}
function click(ctx,selector){const b=ctx.w.document.querySelector(selector);assert.ok(b,'Missing control: '+selector);b.click()}
function submit(ctx,email='parent@example.invalid',password='test-account-password'){
  const f=ctx.w.document.querySelector('#account-form');f.elements.email.value=email;
  if(f.elements.password)f.elements.password.value=password;
  if(f.elements.confirm)f.elements.confirm.value=password;
  f.dispatchEvent(new ctx.w.Event('submit',{bubbles:true,cancelable:true}));
}
function signedInApi(p,o){
  if(p==='/api/me')return {status:200,body:{signedIn:true,parent:{email:'parent@example.invalid',hasPassword:true},players:[profile]}};
  if(p.endsWith('/state'))return {status:200,body:o.method==='PUT'?{ok:true}:{data:{nick:'Rocket',age:10,stage:'d',xp:250}}};
  throw new Error('Unexpected endpoint '+p);
}
test('cached guest profile cannot bypass email authentication; legacy progress is preserved',async()=>{
  const legacy=JSON.stringify({nick:'Old guest',age:10,xp:850});
  const c=start({stored:{'b2b.player.v1':legacy}});
  await pause();assert.ok(c.w.document.querySelector('#account-form'));assert.equal(c.w.document.querySelector('#tabs').hidden,true);
  assert.equal(c.w.localStorage.getItem('b2b.player.v1'),legacy);assert.equal(c.calls.length,0);assert.deepEqual(c.errors,[]);c.close();
});
test('expired session returns to usable email login',async()=>{
  const c=start({stored:{'b2b.session':'expired','b2b.kind':'parent','b2b.player.v1':JSON.stringify({nick:'Old guest'})}});
  await pause();assert.equal(c.w.localStorage.getItem('b2b.session'),null);assert.match(c.w.document.body.textContent,/expired/);assert.ok(c.w.document.querySelector('#account-form'));assert.deepEqual(c.errors,[]);c.close();
});
test('validated session replaces another device profile and opens functional navigation',async()=>{
  const c=start({stored:{'b2b.session':'valid','b2b.kind':'parent','b2b.playerId':'unowned','b2b.player.v1':JSON.stringify({nick:'Wrong player',xp:9999})},fetcher:signedInApi});
  await pause();assert.equal(c.w.eval('S.nick'),'Rocket');assert.equal(c.w.eval('S.xp'),250);assert.equal(c.w.localStorage.getItem('b2b.playerId'),'player-a');assert.equal(c.w.document.querySelector('#tabs').hidden,false);
  for(const name of ['challenges','me','parents','home']){click(c,`#tabs [data-v="${name}"]`);assert.equal(c.w.eval('view'),name)}
  click(c,'[data-act="gate-signout"]');await pause();assert.ok(c.w.document.querySelector('#account-form'));assert.equal(c.w.localStorage.getItem('b2b.session'),null);assert.equal(c.w.eval('S.nick'),'');assert.deepEqual(c.errors,[]);c.close();
});
test('email signup persists a single player before opening dashboard',async()=>{
  let created=false;
  const c=start({fetcher:(p,o)=>{
    if(p==='/api/auth/register')return {status:201,body:{token:'new-parent-session'}};
    if(p==='/api/me')return {status:200,body:{signedIn:true,parent:{email:'parent@example.invalid'},players:created?[profile]:[]}};
    if(p==='/api/players'&&o.method==='POST'){created=true;return {status:201,body:profile}}
    if(p.endsWith('/state')&&o.method==='PUT')return {status:200,body:{ok:true}};
    throw new Error('Unexpected endpoint '+p);
  }});
  await pause();click(c,'[data-act="gate-register"]');submit(c);await pause();assert.ok(c.w.document.querySelector('#nick'));
  c.w.document.querySelector('#nick').value='Rocket';c.w.document.querySelector('#age').value='10';c.w.document.querySelector('#consent').checked=true;
  click(c,'[data-act="start"]');await pause();assert.equal(c.calls.filter(x=>x.path==='/api/players').length,1);assert.equal(c.calls.filter(x=>x.method==='PUT').length,1);assert.equal(c.w.document.querySelector('#tabs').hidden,false);assert.equal(c.w.eval('gateOpen'),false);assert.deepEqual(c.errors,[]);c.close();
});
test('failed profile creation keeps setup usable and never opens a local-only dashboard',async()=>{
  const c=start({stored:{'b2b.session':'valid','b2b.kind':'parent'},fetcher:(p)=>p==='/api/me'?{status:200,body:{signedIn:true,parent:{email:'parent@example.invalid'},players:[]}}:{status:500,body:{error:'unavailable'}}});
  await pause();c.w.document.querySelector('#nick').value='Rocket';c.w.document.querySelector('#consent').checked=true;click(c,'[data-act="start"]');await pause();assert.equal(c.w.document.querySelector('#tabs').hidden,true);assert.equal(c.w.document.querySelector('[data-act="start"]').disabled,false);assert.equal(c.w.eval('S.nick'),'');assert.deepEqual(c.errors,[]);c.close();
});
test('forgotten-password flow does not claim an unsent email was sent',async()=>{
  const c=start({fetcher:()=>({status:200,body:{sent:true,emailConfigured:false}})});await pause();click(c,'[data-act="gate-link"]');submit(c);await pause();assert.match(c.w.document.querySelector('#app').textContent,/couldn't send the sign-in email/);assert.doesNotMatch(c.w.document.querySelector('#app').textContent,/Check your inbox/);assert.deepEqual(c.errors,[]);c.close();
});
test('signing out while account check is pending prevents late response reopening it',async()=>{
  let resolve;const c=start({stored:{'b2b.session':'valid','b2b.kind':'parent'},fetcher:()=>new Promise(r=>resolve=r)});
  click(c,'[data-act="gate-signout"]');resolve({status:200,body:{signedIn:true,parent:{email:'parent@example.invalid'},players:[profile]}});await pause();assert.equal(c.w.eval('ACCT'),null);assert.ok(c.w.document.querySelector('#account-form'));assert.equal(c.w.document.querySelector('#tabs').hidden,true);assert.deepEqual(c.errors,[]);c.close();
});
test('email login loads server profile and bad credentials leave a usable form',async()=>{
  let correct=false;
  const c=start({fetcher:(p,o)=>p==='/api/auth/login'?(correct?{status:200,body:{token:'parent-token'}}:{status:401,body:{error:'wrong_details'}}):signedInApi(p,o)});
  await pause();submit(c);await pause();assert.match(c.w.document.querySelector('#app').textContent,/email or password isn't right/);assert.equal(c.w.document.querySelector('button[type="submit"]').disabled,false);
  correct=true;submit(c);await pause();assert.equal(c.w.eval('S.nick'),'Rocket');assert.equal(c.w.document.querySelector('#tabs').hidden,false);assert.deepEqual(c.errors,[]);c.close();
});
test('unsynced progress is restored only for a server-owned player and synced on retry',async()=>{
  const c=start({stored:{'b2b.session':'valid','b2b.kind':'parent','b2b.pending.player-a':JSON.stringify({nick:'Rocket',age:10,stage:'d',xp:400}),'b2b.pending.other':JSON.stringify({nick:'Other',xp:1000})},fetcher:signedInApi});
  await pause();assert.equal(c.w.eval('S.xp'),400);await c.w.eval('pushState()');assert.equal(c.w.localStorage.getItem('b2b.pending.player-a'),null);assert.ok(c.w.localStorage.getItem('b2b.pending.other'));assert.deepEqual(c.errors,[]);c.close();
});
test('switching players loads the selected account profile, without reusing the first player state',async()=>{
  const other={id:'player-b',nickname:'Blaze',age:8};
  const c=start({stored:{'b2b.session':'valid','b2b.kind':'parent'},fetcher:(p,o)=>{
    if(p==='/api/me')return {status:200,body:{signedIn:true,parent:{email:'parent@example.invalid'},players:[profile,other]}};
    if(p==='/api/players/player-b/state')return {status:200,body:{data:null}};
    return signedInApi(p,o);
  }});
  await pause();click(c,'#tabs [data-v="parents"]');click(c,'[data-act="account-player"][data-id="player-b"]');await pause();assert.equal(c.w.eval('S.nick'),'Blaze');assert.equal(c.w.eval('S.xp'),0);assert.equal(c.w.eval('S.stage'),'g');assert.equal(c.w.localStorage.getItem('b2b.playerId'),'player-b');assert.deepEqual(c.errors,[]);c.close();
});
test('refreshed Today screen opens every pillar and an unlocked training session',async()=>{
  const c=start({stored:{'b2b.session':'valid','b2b.kind':'parent'},fetcher:signedInApi});await pause();
  assert.match(c.w.document.querySelector('main').textContent,/Your next level/);
  assert.ok(c.w.document.querySelector('.brand-logo'));
  for(const p of ['move','mind','ment']){
    click(c,`[data-act="dashboard-pillar"][data-v="${p}"]`);assert.equal(c.w.eval('view'),'challenges');assert.equal(c.w.eval('trainTab'),p);
    assert.ok(c.w.document.querySelector('main button[data-act="open"]'));
    click(c,'#tabs [data-v="home"]');
  }
  click(c,'.development-home .hero [data-act="open"]');assert.equal(c.w.eval('view'),'play');assert.ok(c.w.document.querySelector('main').textContent.length>300);
  assert.deepEqual(c.errors,[]);c.close();
});
test('old malformed progress loads as a usable player profile',async()=>{
  const c=start({stored:{'b2b.session':'valid','b2b.kind':'parent'},fetcher:(p,o)=>p.endsWith('/state')&&o.method!=='PUT'?{status:200,body:{data:{log:null,badges:{},done:null,ever:null,stage:'missing',week:null,xp:'bad'}}}:signedInApi(p,o)});
  await pause();assert.equal(c.w.eval('accountReady()'),true);assert.equal(c.w.eval('S.xp'),0);assert.ok(c.w.document.querySelector('.development-home'));assert.deepEqual(c.errors,[]);c.close();
});
test('saved profile edits survive signing in again',async()=>{
  const c=start({stored:{'b2b.session':'valid','b2b.kind':'parent'},fetcher:(p,o)=>p.endsWith('/state')&&o.method!=='PUT'?{status:200,body:{data:{nick:'Rocket R',age:11,stage:'y',xp:350}}}:signedInApi(p,o)});
  await pause();assert.equal(c.w.eval('S.nick'),'Rocket R');assert.equal(c.w.eval('S.age'),11);assert.equal(c.w.eval('S.stage'),'y');assert.ok(c.w.document.querySelector('.development-home'));assert.deepEqual(c.errors,[]);c.close();
});
test('password visibility and mismatch validation keep a usable form',async()=>{
  const c=start();await pause();click(c,'[data-act="gate-register"]');
  const form=c.w.document.querySelector('#account-form');form.elements.email.value='parent@example.invalid';form.elements.password.value='password-one';form.elements.confirm.value='password-two';
  click(c,'[data-act="gate-password-visibility"]');assert.equal(form.elements.password.type,'text');
  form.dispatchEvent(new c.w.Event('submit',{bubbles:true,cancelable:true}));
  assert.match(c.w.document.querySelector('#account-status').textContent,/don't match/);assert.equal(form.elements.email.value,'parent@example.invalid');assert.equal(form.elements.password.value,'password-one');assert.equal(c.calls.length,0);assert.deepEqual(c.errors,[]);c.close();
});
test('failed saves preserve local progress and reconnect retries it',async()=>{
  let offline=true;
  const c=start({stored:{'b2b.session':'valid','b2b.kind':'parent'},fetcher:(p,o)=>p.endsWith('/state')&&o.method==='PUT'&&offline?{status:503,body:{error:'unavailable'}}:signedInApi(p,o)});
  await pause();c.w.eval('S.xp=500;save()');await c.w.eval('pushState()');
  assert.equal(c.w.eval('syncState'),'offline');assert.match(c.w.localStorage.getItem('b2b.pending.player-a'),/500/);
  offline=false;c.w.dispatchEvent(new c.w.Event('online'));await pause();
  assert.equal(c.w.eval('syncState'),'saved');assert.equal(c.w.localStorage.getItem('b2b.pending.player-a'),null);assert.deepEqual(c.errors,[]);c.close();
});
test('state writes stay ordered and an older save cannot erase newer pending work',async()=>{
  let resolveFirst,writes=0;
  const c=start({stored:{'b2b.session':'valid','b2b.kind':'parent'},fetcher:(p,o)=>{
    if(p.endsWith('/state')&&o.method==='PUT'){
      writes++;if(writes===1)return new Promise(r=>resolveFirst=r);
      return {status:200,body:{ok:true}};
    }return signedInApi(p,o);
  }});
  await pause();c.w.eval('S.xp=400;save()');const first=c.w.eval('pushState()');await pause();
  c.w.eval('S.xp=600;save()');const second=c.w.eval('pushState()');await pause();assert.equal(writes,1);
  resolveFirst({status:200,body:{ok:true}});await first;await second;
  assert.equal(writes,2);assert.deepEqual(c.calls.filter(x=>x.method==='PUT').map(x=>x.body.data.xp),[400,600]);assert.equal(c.w.localStorage.getItem('b2b.pending.player-a'),null);assert.deepEqual(c.errors,[]);c.close();
});
test('a signed-in player can finish a session, earn XP and save the result',async()=>{
  const c=start({stored:{'b2b.session':'valid','b2b.kind':'parent'},fetcher:signedInApi});await pause();
  const id=c.w.eval('planInfo("mind").nextId'),steps=c.w.eval(`byId[${JSON.stringify(id)}].steps.length`);
  click(c,'[data-act="dashboard-pillar"][data-v="mind"]');click(c,`[data-act="open"][data-id="${id}"]`);
  click(c,'[data-act="step"][data-d="1"]');assert.ok(c.w.document.querySelector('.stepwrap'),'The first training step must render after account loading');
  for(let i=0;i<steps;i++)click(c,'[data-act="step"][data-d="1"]');
  click(c,'[data-act="feel"][data-v="great"]');click(c,'[data-act="complete"]');
  assert.equal(c.w.eval('view'),'done');assert.ok(c.w.eval('S.xp')>250);assert.equal(c.w.eval(`S.ever[${JSON.stringify(id)}]`),true);
  await c.w.eval('pushState()');const write=c.calls.filter(x=>x.method==='PUT').at(-1);assert.ok(write.body.data.log.some(x=>x.id===id));assert.deepEqual(c.errors,[]);c.close();
});

test('simple player view exposes every required Movement session and opens ball drill scoring',async()=>{
 const c=start({stored:{'b2b.session':'valid','b2b.kind':'parent'},fetcher:signedInApi});await pause();
 click(c,'[data-act="dashboard-pillar"][data-v="move"]');
 const ids=c.w.eval('PLAN.move[S.stage]');
 for(const id of ids)assert.ok(c.w.document.querySelector(`[data-act="open"][data-id="${id}"]`),'Missing required session '+id);
 click(c,'#tabs [data-v="home"]');click(c,'[data-act="godrill"][data-t="basics"]');
 assert.ok(c.w.document.querySelector('[data-act="logscore"]'));
 const input=c.w.document.querySelector('input[id^="sc-"]');input.value='12';
 const id=input.id.slice(3);click(c,`[data-act="logscore"][data-id="${id}"]`);
 assert.equal(c.w.eval(`S.scores[${JSON.stringify(id)}][0].v`),12);
 click(c,'#tabs [data-v="me"]');assert.match(c.w.document.body.textContent,/Baseline recorded/);
 assert.deepEqual(c.errors,[]);c.close();
});
test('weekly preferences persist and club days are kept free from home sessions',async()=>{
 const c=start({stored:{'b2b.session':'valid','b2b.kind':'parent'},fetcher:signedInApi});await pause();
 const f=c.w.document.querySelector('#training-preferences');f.elements.focus.value='mind';f.elements.days.value='2';
 f.querySelector('[name="clubDays"][value="0"]').checked=true;
 f.dispatchEvent(new c.w.Event('submit',{bubbles:true,cancelable:true}));
 assert.equal(c.w.eval('trainingWeek()[0].club'),true);assert.equal(c.w.eval('trainingWeek()[0].focus'),null);
 assert.equal(c.w.eval('trainingWeek().filter(x=>x.focus).length'),2);
 assert.equal(c.w.eval('S.trainingPrefs.focus'),'mind');await c.w.eval('pushState()');
 assert.equal(c.calls.filter(x=>x.method==='PUT').at(-1).body.data.trainingPrefs.focus,'mind');assert.deepEqual(c.errors,[]);c.close();
});
test('session draft resumes after returning home and completion clears resume without duplicate XP',async()=>{
 const c=start({stored:{'b2b.session':'valid','b2b.kind':'parent'},fetcher:signedInApi});await pause();
 const id=c.w.eval('planInfo("mind").nextId');click(c,'[data-act="dashboard-pillar"][data-v="mind"]');click(c,`[data-act="open"][data-id="${id}"]`);
 click(c,'[data-act="step"][data-d="1"]');click(c,'[data-act="exit"]');click(c,'#tabs [data-v="home"]');
 assert.ok(c.w.document.querySelector('[data-act="training-resume"]'));click(c,'[data-act="training-resume"]');assert.equal(c.w.eval('play.i'),1);
 while(c.w.eval('play.i<lastIdx(byId[play.id])'))click(c,'[data-act="step"][data-d="1"]');
 click(c,'[data-act="feel"][data-v="great"]');click(c,'[data-act="complete"]');
 assert.equal(c.w.eval('S.activeTraining'),undefined);const xp=c.w.eval('S.xp');c.w.eval(`complete(${JSON.stringify(id)})`);assert.equal(c.w.eval('S.xp'),xp);
 assert.deepEqual(c.errors,[]);c.close();
});
test('every training session renders every step at every stage',async()=>{
 const c=start({stored:{'b2b.session':'valid','b2b.kind':'parent'},fetcher:signedInApi});await pause();
 const stages=c.w.eval('STAGE_ORDER');
 for(const stage of stages){
  c.w.eval(`S.stage=${JSON.stringify(stage)};filterS=S.stage;applyAgeContent()`);
  const ids=c.w.eval('C.filter(x=>x.s===S.stage).map(x=>x.id)');
  for(const id of ids){
   c.w.eval(`play={id:${JSON.stringify(id)},i:0};view="play"`);
   const last=c.w.eval(`lastIdx(byId[${JSON.stringify(id)}])`);
   for(let i=0;i<=last;i++){c.w.eval(`play.i=${i};render()`);assert.ok(c.w.document.querySelector('main').textContent.trim().length>30,`${id} step ${i}`)}
  }
 }
 assert.deepEqual(c.errors,[]);c.close();
});
test('resetting player progress preserves email account, usable profile and sync',async()=>{
 const c=start({stored:{'b2b.session':'valid','b2b.kind':'parent'},fetcher:signedInApi});await pause();
 click(c,'#tabs [data-v="parents"]');click(c,'[data-act="reset"]');click(c,'[data-act="doreset"]');
 assert.equal(c.w.eval('S.nick'),'Rocket');assert.equal(c.w.eval('S.xp'),0);assert.equal(c.w.eval('accountReady()'),true);
 assert.ok(c.w.document.querySelector('.development-home'));await c.w.eval('pushState()');assert.equal(c.calls.filter(x=>x.method==='PUT').at(-1).body.data.xp,0);assert.deepEqual(c.errors,[]);c.close();
});

test('saved session and answers survive a fresh account load',async()=>{
 const c=start({stored:{'b2b.session':'valid','b2b.kind':'parent'},fetcher:signedInApi});await pause();
 const id=c.w.eval('planInfo("mind").nextId');click(c,'[data-act="dashboard-pillar"][data-v="mind"]');click(c,`[data-act="open"][data-id="${id}"]`);click(c,'[data-act="step"][data-d="1"]');
 c.w.eval(`draft.w[${JSON.stringify(id)}]={0:'Look before receiving'};saveTrainingDraft()`);await c.w.eval('pushState()');
 const data=c.calls.filter(x=>x.method==='PUT').at(-1).body.data;c.close();
 const r=start({stored:{'b2b.session':'valid','b2b.kind':'parent'},fetcher:(p,o)=>p.endsWith('/state')&&o.method!=='PUT'?{status:200,body:{data}}:signedInApi(p,o)});await pause();
 click(r,'[data-act="training-resume"]');assert.equal(r.w.eval('play.i'),1);assert.equal(r.w.eval(`draft.w[${JSON.stringify(id)}][0]`),'Look before receiving');assert.deepEqual(r.errors,[]);r.close();
});
test('training libraries, position choices and mind tools render for all player levels',async()=>{
 const c=start({stored:{'b2b.session':'valid','b2b.kind':'parent'},fetcher:signedInApi});await pause();
 for(const stage of c.w.eval('STAGE_ORDER')){
  c.w.eval(`S.stage=${JSON.stringify(stage)};filterS=S.stage;view='challenges';render()`);
  for(const lib of ['basics','pos','workouts','tools','plan']){click(c,`[data-act="training-library"][data-v="${lib}"]`);assert.ok(c.w.document.querySelector('main').textContent.trim().length>100)}
  click(c,'[data-act="training-library"][data-v="pos"]');const key=c.w.eval('Object.keys(POS)[0]');click(c,`[data-act="pos"][data-v="${key}"]`);if(c.w.document.querySelector(`[data-act="setpos"][data-v="${key}"]`))click(c,`[data-act="setpos"][data-v="${key}"]`);assert.equal(c.w.eval('S.pos'),key);
  click(c,'[data-act="training-library"][data-v="tools"]');click(c,'[data-act="gomind"][data-v="conf"]');assert.equal(c.w.eval('view'),'mind');
  click(c,'#tabs [data-v="home"]');
 }
 assert.deepEqual(c.errors,[]);c.close();
});
