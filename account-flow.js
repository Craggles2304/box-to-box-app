/* Account access is checked by the API. A local nickname is never a session. */
const API_BASE="https://box-to-box-api.craiigbrown2304.workers.dev";
let gateMode="parent",gateMsg="",ACCT=null,authChecking=true,authBusy=false,authEpoch=0;
let pushTimer=null,CHILD_INFO=null;
const PLAYER_KEY="b2b.playerId";
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
    return j;
  }finally{clearTimeout(timer)}
}
function authMessage(e){
  if(e.status===401)return "That email or password isn't right. Try again, or request an email sign-in link.";
  if(e.status===429)return "Too many attempts. Please wait a few minutes and try again.";
  if(e.message==="exists")return "An account with this email already exists. Choose Sign in below.";
  if(e.message==="password_length")return "Use a password between 8 and 200 characters.";
  if(e.message==="too_many_players")return "Your account already has five players. Choose an existing player from Account.";
  return "We couldn't connect to your account. Please try again. Your saved progress has not been deleted.";
}
function resetActivePlayer(){
  clearTimeout(pushTimer);stopTimer();S=fresh();ensure();play=null;draft={steps:{},feel:{},note:{}};
  FQ={...FUEL_DEF};FPLAN=null;view="home";filterS=S.stage;
}
function clearAccount(message=""){
  authEpoch++;clearTimeout(pushTimer);sessSet(null);setKind("");setPlayerId(null);
  ACCT=null;CHILD_INFO=null;authChecking=false;authBusy=false;gateOpen=true;gateMode="parent";gateMsg=message;
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
  if(!S.nick)S.nick=p.nickname;
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
async function pushState(){
  const token=sessGet(),id=playerId(),epoch=authEpoch;
  if(!accountReady()||!id||!S.nick||!ACCT.players.some(p=>p.id===id))return;
  const data=JSON.parse(JSON.stringify(S));
  let pendingBefore=null;try{pendingBefore=localStorage.getItem("b2b.pending."+id)}catch{}
  try{
    await accountApi("/api/players/"+encodeURIComponent(id)+"/state",{method:"PUT",body:{data},token});
    try{if(localStorage.getItem("b2b.pending."+id)===pendingBefore)localStorage.removeItem("b2b.pending."+id)}catch{}
  }
  catch(e){if(epoch!==authEpoch)return;if(e.status===401||e.status===404){clearAccount("Please sign in again to save your progress.");render()}else toast("Progress saved on this device. Reconnect and try again to save it to your account.")}
}
function schedulePush(){if(!accountReady()||!S.nick||!playerId())return;clearTimeout(pushTimer);pushTimer=setTimeout(pushState,1200)}
function markPending(){if(!ACCT||!playerId())return;try{localStorage.setItem("b2b.pending."+playerId(),JSON.stringify(S))}catch{}}
save=function(){_saveLocal();markPending();schedulePush()};
function viewGate(){
  const status=gateMsg?`<p role="status" style="max-width:40rem">${esc(gateMsg)}</p>`:"";
  let inner;
  if(authChecking){inner=`<p class="lead" role="status">Loading your account…</p><button class="more" data-act="gate-signout">Use a different account</button>`}
  else if(accountReady()){
    inner=`<p class="lead">Signed in as <strong>${esc(ACCT.parent.email)}</strong>.</p>${status}<div class="row"><button class="btn" data-act="gate-retry">Continue to my account ${ARROW}</button><button class="more" data-act="gate-player">Add a player</button><button class="more" data-act="gate-signout">Sign out</button></div>`;
  }else{
    const register=gateMode==="register",link=gateMode==="link";
    inner=`<p class="lead">${register?"Create your account to save your player's training and progress.":link?"Enter your account email and we'll request a sign-in link.":"Sign in to your Box to Box development account."}</p>
      <p class="small">Under 18? Ask your parent or guardian to use their email address.</p>
      <form id="account-form" class="stack" style="gap:14px;max-width:440px" data-mode="${register?"register":link?"link":"login"}">
      <label for="account-email">Email address</label><input id="account-email" name="email" type="email" autocomplete="email" required maxlength="254" style="padding:14px;font:inherit">
      ${link?"":`<label for="account-password">Password</label><input id="account-password" name="password" type="password" autocomplete="${register?"new-password":"current-password"}" required ${register?'minlength="8"':""} maxlength="200" style="padding:14px;font:inherit">`}
      ${register?`<label for="account-confirm">Confirm password</label><input id="account-confirm" name="confirm" type="password" autocomplete="new-password" required minlength="8" maxlength="200" style="padding:14px;font:inherit"><p class="small">Use at least 8 characters.</p>`:""}
      <button class="btn" type="submit" ${authBusy?"disabled":""}>${authBusy?"Please wait…":register?"Create account":link?"Email me a sign-in link":"Sign in"} ${ARROW}</button>${status}</form>
      <div class="row">${register||link?`<button class="more" data-act="gate-parent">Sign in</button>`:`<button class="more" data-act="gate-register">New here? Create an account</button><button class="more" data-act="gate-link">Forgotten your password?</button>`}${sessGet()?`<button class="more" data-act="gate-retry">Retry loading my account</button>`:""}</div>`;
  }
  return `<section class="hero"><div class="bgword" aria-hidden="true">Box to box</div><div class="wrap"><div class="stack" style="gap:22px"><span class="eyebrow">Train. Develop. Keep your progress.</span><h1>${gateMode==="register"?"Create your":"Your"} <em class="v">account.</em></h1>${inner}</div></div></section>`;
}
document.addEventListener("submit",async e=>{
  if(e.target.id!=="account-form")return;e.preventDefault();if(authBusy)return;
  const form=e.target,email=form.elements.email.value.trim().toLowerCase(),password=form.elements.password?.value||"",mode=form.dataset.mode;
  if(mode==="register"&&password!==form.elements.confirm.value){gateMsg="The passwords don't match. Please enter them again.";render();return}
  const epoch=authEpoch;authBusy=true;gateMsg="";form.querySelector('button[type="submit"]').disabled=true;
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
