/* Account access is checked by the API. A local nickname is never a session. */
const API_BASE="https://box-to-box-api.craiigbrown2304.workers.dev";
let gateMode="parent",gateMsg="",ACCT=null,authChecking=true,authBusy=false,authEpoch=0;
let pushTimer=null,CHILD_INFO=null;
let syncState="saved",pushQueue=Promise.resolve(),gateEmail="";
const PLAYER_KEY="b2b.playerId";
function syncLabel(){return syncState==="saving"?"Saving…":syncState==="offline"?"Saved on device":"Progress saved"}
function setSyncState(value){syncState=value;document.querySelectorAll('[data-sync-status]').forEach(el=>{el.dataset.state=value;el.textContent=syncLabel()})}
function sessGet(){try{return localStorage.getItem("b2b.session")}catch{return null}}
function sessSet(t){try{if(t)localStorage.setItem("b2b.session",t);else localStorage.removeItem("b2b.session")}catch{}}
function sessKind(){try{return localStorage.getItem("b2b.kind")}catch{return null}}
function setKind(k){try{localStorage.setItem("b2b.kind",k)}catch{}}
function playerId(){try{return localStorage.getItem(PLAYER_KEY)}catch{return null}}
function setPlayerId(id){try{if(id)localStorage.setItem(PLAYER_KEY,id);else localStorage.removeItem(PLAYER_KEY)}catch{}}
function accountReady(){return !authChecking&&!!ACCT?.signedIn&&!!sessGet()}
function captureSession(){const m=location.hash.match(/^#session=([0-9a-f]{64})$/);if(m){sessSet(m[1]);setKind("parent");history.replaceState(null,"",location.pathname+location.search)}}
async function accountApi(path,{method="GET",body,token=sessGet()}={}){
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),15000);
  try{
    const headers={};if(token)headers.Authorization="Bearer "+token;
    if(body!==undefined)headers["Content-Type"]="application/json";
    const r=await fetch(API_BASE+path,{method,headers,body:body===undefined?undefined:JSON.stringify(body),signal:controller.signal});
    const j=await r.json().catch(()=>({}));
    if(!r.ok){const e=new Error(j.error||"service_error");e.status=r.status;throw e}
    if(!j||typeof j!=="object"||Array.isArray(j))throw new Error("invalid_response");
    return j;
  }finally{clearTimeout(timer)}
}
function authMessage(e){
  if(e.status===401)return "That email or password isn't right. Try again, or request an email sign-in link.";
  if(e.status===429)return "Too many attempts. Please wait a few minutes and try again.";
  if(e.message==="exists")return "An account with this email already exists. Choose Sign in below.";
  if(e.message==="password_length")return "Use a password between 8 and 200 characters.";
  if(e.message==="too_many_players")return "Your account already has five players. Choose an existing player from Account.";
  if(e.name==="AbortError")return "Your account is taking too long to respond. Please try again, or contact the academy below.";
  if(e.status===403)return "The account service couldn't accept this connection. Please contact the academy so we can check your access.";
  if(e.message==="invalid_email")return "Please enter a valid email address.";
  return "We couldn't connect to your account. Please try again. Your saved progress has not been deleted.";
}
function resetActivePlayer(){
  clearTimeout(pushTimer);stopTimer();clearForm();S=fresh();ensure();play=null;result=null;
  draft={steps:{},feel:{},note:{},w:{}};editOpen=false;confirmReset=false;jdraft={};parentOpen=null;
  FQ={...FUEL_DEF};FPLAN=null;view="home";filterS=S.stage;
}
function clearAccount(message=""){
  authEpoch++;clearTimeout(pushTimer);sessSet(null);setKind("");setPlayerId(null);
  ACCT=null;CHILD_INFO=null;authChecking=false;authBusy=false;gateOpen=true;gateMode="parent";gateMsg=message;
  setSyncState("saved");
  resetActivePlayer();
}
async function signOutAccount(){
  // Keep the per-player cache, but never show it without a checked session.
  clearAccount("You're signed out. Sign in with your email to continue.");render();window.scrollTo(0,0);
}
async function loadAccount(){
  const token=sessGet();if(!token)return null;
  const j=await accountApi("/api/me",{token});
  if(j.signedIn!==true||!j.parent?.email||!Array.isArray(j.players))throw new Error("invalid_account");
  return j;
}
async function pullState(id=playerId(),epoch=authEpoch){
  const p=ACCT?.players.find(p=>p.id===id);if(!p)throw new Error("player_not_owned");
  const j=await accountApi("/api/players/"+encodeURIComponent(id)+"/state");
  if(epoch!==authEpoch)return false;
  let data=j.data&&typeof j.data==="object"&&!Array.isArray(j.data)?j.data:{};
  // Only restore unsynced device progress after the server confirms ownership.
  try{const pending=JSON.parse(localStorage.getItem("b2b.pending."+id)||"null");if(pending&&typeof pending==="object"&&!Array.isArray(pending))data=pending}catch{}
  resetActivePlayer();setPlayerId(id);
  S=Object.assign(fresh(),{nick:p.nickname,age:p.age,stage:p.age<=9?"g":"d",kit:1},data);
  // A malformed old backup must not leave a valid account stuck on a blank screen.
  S.nick=cleanNick(S.nick)||p.nickname;
  if(!Number.isInteger(S.age)||S.age<5||S.age>18)S.age=p.age;
  if(!STAGES[S.stage])S.stage=S.age<=9?"g":"d";
  for(const key of ["log","badges"])if(!Array.isArray(S[key]))S[key]=[];
  S.log=S.log.filter(x=>x&&typeof x==="object"&&typeof x.id==="string");
  for(const key of ["done","ever"])if(!S[key]||typeof S[key]!=="object"||Array.isArray(S[key]))S[key]={};
  for(const key of ["xp","streak","best","hats"])if(!Number.isFinite(S[key])||S[key]<0)S[key]=0;
  if(!S.week||typeof S.week!=="object"||!Number.isFinite(S.week.xp))S.week={key:weekKey(),xp:0};
  ensure();filterS=S.stage;applyAgeContent();applyCalib();_saveLocal();return true;
}
async function afterSignIn(){
  const epoch=++authEpoch;authChecking=true;ACCT=null;resetActivePlayer();gateOpen=true;gateMsg="";render();
  try{
    if(!sessGet()){resetActivePlayer();return}
    // Older child-code sessions must now use the parent/guardian email account.
    if(sessKind()==="child"){clearAccount("Please sign in with your parent or guardian's email account.");return}
    const account=await loadAccount();if(epoch!==authEpoch)return;
    ACCT=account;setKind("parent");
    const selected=ACCT.players.find(p=>p.id===playerId())||ACCT.players[0];
    if(selected){await pullState(selected.id,epoch);if(epoch!==authEpoch)return;gateMode=null;gateOpen=false}
    else{resetActivePlayer();setPlayerId(null);gateMode="player";ob={nick:"",age:10,kit:1,level:"d"}}
  }catch(e){
    if(epoch!==authEpoch)return;
    if(e.status===401){clearAccount("Your sign-in has expired. Please sign in again.")}
    else{gateMode="parent";gateMsg=authMessage(e);gateOpen=true}
  }finally{if(epoch===authEpoch){authChecking=false;render();if(accountReady())schedulePush()}else if(!authChecking)render()}
}
async function loadAfterBoot(){await afterSignIn()}
const _saveLocal=function(){
  if(!ACCT||!playerId())return;
  try{localStorage.setItem("b2b.progress."+playerId(),JSON.stringify(S))}catch{}
};
function pushState(){
  const token=sessGet(),id=playerId(),epoch=authEpoch;
  if(!accountReady()||!id||!S.nick||!ACCT.players.some(p=>p.id===id))return Promise.resolve(false);
  const data=JSON.parse(JSON.stringify(S));
  let pendingBefore=null;try{pendingBefore=localStorage.getItem("b2b.pending."+id)}catch{}
  const run=async()=>{
    if(epoch!==authEpoch)return false;
    setSyncState("saving");
    try{
      await accountApi("/api/players/"+encodeURIComponent(id)+"/state",{method:"PUT",body:{data},token});
      if(epoch!==authEpoch)return false;
      let pending=false;
      try{if(localStorage.getItem("b2b.pending."+id)===pendingBefore)localStorage.removeItem("b2b.pending."+id);pending=!!localStorage.getItem("b2b.pending."+id)}catch{}
      setSyncState(pending?"saving":"saved");return true;
    }catch(e){
      if(epoch!==authEpoch)return false;
      if(e.status===401||e.status===404){clearAccount("Please sign in again to save your progress.");render()}
      else{setSyncState("offline");toast("Progress saved on this device. Reconnect and try again to save it to your account.")}
      return false;
    }
  };
  // Keep writes in order so a slow earlier request cannot overwrite newer training.
  pushQueue=pushQueue.then(run,run);return pushQueue;
}
function schedulePush(){if(!accountReady()||!S.nick||!playerId())return;clearTimeout(pushTimer);pushTimer=setTimeout(pushState,1200)}
function markPending(){if(!ACCT||!playerId())return;try{localStorage.setItem("b2b.pending."+playerId(),JSON.stringify(S))}catch{}}
save=function(){_saveLocal();markPending();if(accountReady())setSyncState("saving");schedulePush()};
function viewGate(){
  const status=`<p class="auth-status" id="account-status" role="status" aria-live="polite">${esc(gateMsg)}</p>`;
  let inner;
  if(authChecking){inner=`<div><span class="eyebrow">Your player development hub</span><h2>Welcome back.</h2></div><div class="auth-progress" role="status"><span class="auth-spinner" aria-hidden="true"></span>Loading your account…</div><button class="more" data-act="gate-signout">Use a different account</button>`}
  else if(accountReady()){
    inner=`<h2>Your account.</h2><p class="auth-intro">Signed in as <strong>${esc(ACCT.parent.email)}</strong>.</p>${status}<div class="row"><button class="btn" data-act="gate-retry">Continue to my account ${ARROW}</button><button class="more" data-act="gate-player">Add a player</button><button class="more" data-act="gate-signout">Sign out</button></div>`;
  }else{
    const register=gateMode==="register",link=gateMode==="link";
    inner=`<div><span class="eyebrow">Player development</span><h2>${register?"Join the journey.":link?"Get back in.":"Welcome back."}</h2><p class="auth-intro">${register?"Create a parent or guardian account, add your player and start training.":link?"Enter your account email to request a sign-in link.":"Sign in to pick up where you left off."}</p></div>
      ${link?'':`<div class="auth-tabs" role="tablist" aria-label="Account access"><button type="button" data-act="gate-parent" role="tab" aria-selected="${!register}">Sign in</button><button type="button" data-act="gate-register" role="tab" aria-selected="${register}">Create account</button></div>`}
      <form id="account-form" class="auth-form" data-mode="${register?"register":link?"link":"login"}">
      <div class="auth-field"><label for="account-email">Parent / guardian email</label><input id="account-email" name="email" type="email" autocomplete="email" autocapitalize="none" spellcheck="false" placeholder="you@example.com" required maxlength="254" value="${esc(gateEmail)}" aria-describedby="account-help"></div>
      ${link?'':`<div class="auth-field"><label for="account-password">Password</label><div class="password-field"><input id="account-password" name="password" type="password" autocomplete="${register?'new-password':'current-password'}" required ${register?'minlength="8"':''} maxlength="200" placeholder="${register?'At least 8 characters':'Your password'}"><button type="button" data-act="gate-password-visibility" aria-controls="account-password" aria-label="Show password" aria-pressed="false">Show</button></div></div>`}
      ${register?`<div class="auth-field"><label for="account-confirm">Confirm password</label><input id="account-confirm" name="confirm" type="password" autocomplete="new-password" required minlength="8" maxlength="200" placeholder="Enter your password again"></div>`:''}
      ${status}<button class="btn" type="submit" ${authBusy?'disabled':''}>${authBusy?'Please wait…':register?'Create my account':link?'Request sign-in link':'Sign in & train'} ${ARROW}</button></form>
      <div class="auth-links">${register||link?`<button class="more" data-act="gate-parent">Back to sign in</button>`:`<button class="more" data-act="gate-link">Forgotten your password?</button>`}${sessGet()?`<button class="more" data-act="gate-retry">Retry loading my account</button>`:''}</div>
      <div class="auth-foot" id="account-help">Under 18? Ask your parent or guardian to use their email.<br>This is your Development account. Coaching app logins are separate.<br>Need help? <a href="mailto:admin@boxtoboxacademy.co.uk">Contact the academy</a></div>`;
  }
  return `<section class="auth-shell"><div class="auth-story"><span class="eyebrow mission-kicker">Box to Box Football Academy</span><h1>The work<br>between<br><em>the sessions.</em></h1><p class="lead">Better habits. Better decisions. A better player. Your own training journey, wherever you play.</p><div class="auth-points"><div><b>Movement</b><span>Move with purpose.</span></div><div><b>Mindset</b><span>Think a step ahead.</span></div><div><b>Mentality</b><span>Come back stronger.</span></div></div><a class="more" href="https://boxtobox-coaching.netlify.app/" target="_blank" rel="noopener" style="align-self:flex-start">Looking for the coaching app? ${ARROW}</a></div><div class="auth-panel">${inner}</div></section>`;
}
document.addEventListener("submit",async e=>{
  if(e.target.id!=="account-form")return;e.preventDefault();if(authBusy)return;
  const form=e.target,email=form.elements.email.value.trim().toLowerCase(),password=form.elements.password?.value||"",mode=form.dataset.mode;
  gateEmail=email;
  if(mode==="register"&&password!==form.elements.confirm.value){gateMsg="The passwords don't match. Please enter them again.";const status=document.getElementById("account-status");if(status)status.textContent=gateMsg;form.elements.confirm.focus();return}
  const epoch=authEpoch;authBusy=true;gateMsg="";form.querySelector('button[type="submit"]').disabled=true;
  form.querySelector('button[type="submit"]').textContent=mode==="register"?"Creating account…":mode==="link"?"Requesting link…":"Signing in…";
  const message=document.getElementById("account-status");if(message)message.textContent="";
  try{
    const j=await accountApi(mode==="link"?"/api/auth/request":mode==="register"?"/api/auth/register":"/api/auth/login",{method:"POST",body:mode==="link"?{email}:{email,password},token:null});
    if(epoch!==authEpoch)return;
    if(mode==="link")gateMsg=j.emailConfigured===true?"Check your inbox and spam folder for your sign-in link.":"We couldn't send the sign-in email. Please contact Box to Box for help, or sign in with your password.";
    else{
      if(!j.token)throw new Error("invalid_session");
      clearTimeout(pushTimer);sessSet(j.token);setKind("parent");setPlayerId(null);resetActivePlayer();authBusy=false;
      await afterSignIn();return;
    }
  }catch(err){if(epoch===authEpoch)gateMsg=authMessage(err)}
  finally{if(epoch===authEpoch){authBusy=false;render();const el=document.getElementById("account-email");if(el)el.value=email}}
});
async function createAccountPlayer(){
  if(!accountReady()){gateMode="register";gateOpen=true;render();return}if(authBusy)return;
  const n=cleanNick(document.getElementById("nick")?.value),age=Number(document.getElementById("age")?.value);
  if(!n){toast("Pick a nickname first");return}
  if(!Number.isInteger(age)||age<5||age>18){toast("Choose an age between 5 and 18");return}
  if(!document.getElementById("consent")?.checked){toast("A parent or guardian needs to tick the consent box first");return}
  const epoch=authEpoch;authBusy=true;const button=document.querySelector('[data-act="start"]');if(button){button.disabled=true;button.textContent="Saving player…"}
  try{
    const p=await accountApi("/api/players",{method:"POST",body:{nickname:n,age}});
    if(epoch!==authEpoch)return;if(!p.id)throw new Error("invalid_player");
    ACCT.players.push(p);resetActivePlayer();setPlayerId(p.id);
    Object.assign(S,{nick:n,age,stage:age<=9?"g":(ob.level||"d"),kit:ob.kit,consent:{at:dayKey(),v:"draft-1"}});
    ensure();filterS=S.stage;applyAgeContent();applyCalib();_saveLocal();markPending();await pushState();
    if(epoch!==authEpoch)return;gateOpen=false;gateMode=null;gateMsg="";view="home";render();window.scrollTo(0,0);
  }catch(err){if(epoch===authEpoch){toast(authMessage(err));if(button){button.disabled=false;button.textContent="Save player and start"}}}
  finally{if(epoch===authEpoch)authBusy=false}
}
document.addEventListener("click",async e=>{
  const b=e.target.closest("[data-act]");if(!b)return;const a=b.dataset.act;
  if(a==="gate-password-visibility"){const input=document.getElementById("account-password"),show=input?.type==="password";if(input){input.type=show?"text":"password";b.textContent=show?"Hide":"Show";b.setAttribute("aria-label",show?"Hide password":"Show password");b.setAttribute("aria-pressed",String(show))}return}
  if(["gate-parent","gate-register","gate-link"].includes(a)){if(authBusy)return;gateMode=a==="gate-register"?"register":a==="gate-link"?"link":"parent";gateMsg="";gateOpen=true;render()}
  else if(a==="gate-signout"||a==="child-signout"){await signOutAccount()}
  else if(a==="gate-retry"){await afterSignIn()}
  else if(a==="gate-player"){
    if(!accountReady()){gateMode="register"}else{gateMode="player";ob={nick:"",age:10,kit:1,level:"d"}}
    gateOpen=true;gateMsg="";render();
  }
  else if(a==="gate-open"){gateOpen=true;gateMode="parent";gateMsg="";render()}
  else if(a==="gate-close"){if(accountReady()&&playerId()){gateOpen=false;gateMode=null;render()}}
  else if(a==="start"){await createAccountPlayer()}
  else if(a==="account-player"&&accountReady()){
    if(authBusy)return;authBusy=true;clearTimeout(pushTimer);await pushState();
    if(!accountReady()){authBusy=false;return}
    const epoch=++authEpoch;authChecking=true;gateOpen=true;render();
    try{await pullState(b.dataset.id,epoch);if(epoch!==authEpoch)return;gateOpen=false;gateMode=null;gateMsg=""}
    catch(err){if(epoch===authEpoch){gateMsg=authMessage(err);gateOpen=true}}
    finally{if(epoch===authEpoch){authChecking=false;authBusy=false;render()}}
  }
});
document.addEventListener("input",e=>{if(e.target.id==="account-email")gateEmail=e.target.value});
