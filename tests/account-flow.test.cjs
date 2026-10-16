const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {JSDOM,VirtualConsole}=require('jsdom');
const root=path.resolve(__dirname,'..');
const auth=fs.readFileSync(path.join(root,'account-flow.js'),'utf8');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8').replace(/<script src="\.\/account-flow\.js[^\"]*"><\/script>/,()=>'<script>'+auth+'</script>');
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
