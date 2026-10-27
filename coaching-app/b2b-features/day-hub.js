import {sportGraphic} from './sport-visuals.js';
import {labels,escape as e,groupsFor,weeklyCompletions} from './day-core.js';
import {mountPlayerJourney} from './journey.js?v=47';
import {mountTacticsHub} from './tactics-hub.js';
import {mountCoachQuickMoment} from './quick-moment.js';
import {mountCoachFamilyUpdate,mountParentLive} from './parent-live.js';
import {mountCoachGuardianSetup,mountParentOnboarding} from './parent-onboarding.js?v=47';
import {mountTeamSessionDNA} from './team-session-dna.js';
import {mountCoachMatchday} from './matchday-quick.js';
import {mountKeepUpRoutine} from './keepup-routine.js';
import {mountExpectations} from './expectations.js';

export function mountDayHub({root,supabase,mode='home',bridge}){
 let closed=false,leave=()=>{},profile,groups=[],group='',players=[],selected='',tool=bridge.tool||'';
 const read=async q=>{const r=await q;if(r.error)throw r.error;return r.data;};
 const route=x=>bridge.route(x);
 function go(next,id){leave();leave=()=>{};tool=next;bridge.remember?.(next);if(id)group=id;draw();}
 async function load(){
  const auth=await read(supabase.auth.getUser());if(!auth?.user)throw Error('Sign in to open your coaching day.');
  profile=await read(supabase.from('profiles').select('role,groups,name').eq('id',auth.user.id).single());
  groups=groupsFor(profile);if(!groups.length)throw Error('No coaching groups are assigned to this account.');
  group=groups.includes(bridge.group)?bridge.group:groups[0];
  players=await read(supabase.from('players').select('id,name,groups').overlaps('groups',groups).order('name'))||[];
  if(!closed)draw();
 }
 function header(title,kicker='YOUR COACHING DAY'){
  return `<header class="day-head"><span class="day-kicker">${kicker}</span><h1>${title}</h1><div class="day-team"><span>${e(labels[group]||group)}</span>${groups.length>1?`<select aria-label="Your assigned team" data-day-group>${groups.map(g=>`<option value="${e(g)}" ${g===group?'selected':''}>${e(labels[g]||g)}</option>`).join('')}</select>`:''}</div></header>`;
 }
 const card=(key,num,title,detail)=>`<button type="button" class="day-action" data-day-open="${key}"><span class="day-number" aria-hidden="true">${num}</span>${sportGraphic(key)}<span><strong>${title}</strong><small>${detail}</small></span><b aria-hidden="true">↗</b></button>`;
 function draw(){
  leave();leave=()=>{};if(closed||!root.isConnected)return;
  const isDevelopment=['D47','D812','TD5','TD','BM'].includes(group);
  const groupPlayers=players.filter(p=>p.groups?.includes(group));
  if(!groupPlayers.some(p=>p.id===selected))selected=groupPlayers[0]?.id||'';
  if(mode==='home'&&!tool){
   const done=weeklyCompletions(bridge.cpd());
   root.innerHTML=`<section class="day-hub">${header('YOUR<br>COACHING <em>DAY.</em>','BOX TO BOX · COACH WORKSPACE')}<p class="day-intro">${e((profile.name||'Coach').split(' ')[0])}, your team. Your standards. Make today count.</p><div class="day-actions">${card('training','01',isDevelopment?'Development session':'Training session','Check in. Get prepared. Take the pitch.')}${card('matchday','02','Matchday','Your team. Your plan. Ready for kick-off.')}${card('develop','03','Develop as a coach',`${Math.min(done,2)} / 2 completed this week`)}</div><div class="day-tools-label">YOUR WORKSPACE</div><div class="day-shortcuts"><button data-day-open="players">Player Passports <span>→</span></button><button data-day-open="family">Parent Hub <span>→</span></button><button data-day-open="tactics">Tactics Hub <span>→</span></button>${profile.role==='admin'?'<button data-day-open="director">Director overview <span>→</span></button>':''}</div></section>`;
  }else{
   const screen=tool||mode;
   const titles={training:isDevelopment?'Development session':'Training session',matchday:'Matchday',players:'Player Passports',family:'Parent Hub',tactics:'Tactics Hub',moment:'One learning moment',plan:'Team session',update:'Coach feedback',links:'Connect families',expectations:'Training & game focus',routine:'Football routine'};
   root.innerHTML=`<section class="day-hub day-sub"><button class="day-back" data-day-back>← Coaching day</button>${header(titles[screen]||'Your day',isDevelopment?'DEVELOPMENT COACH':'TEAM COACH')}<div data-day-checkin></div><div data-day-body></div></section>`;
   const body=root.querySelector('[data-day-body]'),checkin=root.querySelector('[data-day-checkin]');
   const base={root:body,supabase,groupId:group,playerId:selected,onOpenPlayer:id=>{selected=id;go('players');},onConnectParent:()=>go('links')};
   if(screen==='training'||screen==='matchday'){
    checkin.innerHTML=`<div class="day-checkins"><button data-day-coach-in><span>COACH</span><b>Check in / out</b><small>Work log for your statement</small></button><button data-day-player-in><span>PLAYERS</span><b>Take attendance</b><small>${e(labels[group]||group)} register</small></button></div><div data-day-gps></div><div data-day-register></div>`;
    checkin.querySelector('[data-day-coach-in]').onclick=()=>bridge.coachCheckin(checkin.querySelector('[data-day-gps]'),screen);
    checkin.querySelector('[data-day-player-in]').onclick=()=>bridge.attendance(group,checkin.querySelector('[data-day-register]'),screen);
   }
   if(screen==='training'){
    body.innerHTML=`<div class="day-section-title"><h2>Prepare. Coach. Reflect.</h2></div><div data-day-prep></div><div class="day-shortcuts">${card('plan','A','Session plan','One focused training pack')}${card('moment','B','Record learning','One player · One observation')}${card('update','C','Share coach feedback','Review before parents see it')}</div>`;
    bridge.prep(body.querySelector('[data-day-prep]'),group);
   }
   if(screen==='matchday'){
    body.innerHTML=`<div class="day-actions">${card('tactics','01','Tactics Hub','Shape · Principles · Match plan')}${card('moment','02','Player learning','Observe one game target')}</div><div data-day-match></div>`;
    leave=mountCoachMatchday({...base,root:body.querySelector('[data-day-match]'),onOpenTactics:()=>go('tactics')});
   }
   if(screen==='tactics')leave=mountTacticsHub({...base,onOpenMatch:()=>bridge.matchroom?.(group),onOpenChat:()=>bridge.chat(group)});
   if(screen==='plan')leave=mountTeamSessionDNA(base);
   if(screen==='moment')leave=mountCoachQuickMoment(base);
   if(screen==='update')leave=mountCoachFamilyUpdate(base);
   if(screen==='links')leave=mountCoachGuardianSetup(base);
   if(screen==='routine')leave=mountKeepUpRoutine({root:body,playerId:'director-preview'});
   if(screen==='players'||screen==='expectations'||screen==='family'){
    body.innerHTML=`${screen==='family'?'<p class="day-intro">Preview the published training focus, game focus and coach feedback for this player. Families see only their own linked children.</p>':''}<label class="day-select-label">${screen==='family'?'Preview player':'Your players'}<select data-day-player>${groupPlayers.map(p=>`<option value="${e(p.id)}" ${p.id===selected?'selected':''}>${e(p.name)}</option>`).join('')}</select></label><div class="day-segments">${screen==='players'?'<button data-day-open="expectations">Training & game focus</button><button data-full-passport>Full Player Passport →</button>':''}${screen==='family'?'<button data-day-open="links">Connect a parent</button><button data-day-open="routine">Football routine</button>':''}</div><div data-player-content></div>`;
    const select=body.querySelector('[data-day-player]');select.onchange=()=>{selected=select.value;draw();};
    const full=body.querySelector('[data-full-passport]');if(full)full.onclick=()=>bridge.passport?.(selected);
    const slot=body.querySelector('[data-player-content]');
    if(!selected)slot.innerHTML='<p>No players are assigned to this group yet.</p>';
    else if(screen==='players')leave=mountPlayerJourney({...base,root:slot});
    else if(screen==='expectations')leave=mountExpectations({...base,root:slot,staff:true});
    else leave=mountParentLive({...base,root:slot,onOpenPassport:()=>go('players')});
   }
  }
  root.querySelectorAll('[data-day-open]').forEach(b=>b.onclick=()=>{
   const key=b.dataset.dayOpen;
   if(key==='matchday'&&bridge.matchroom)return bridge.matchroom(group);
   if(key==='develop')return route('develop');if(key==='director')return route('operations');
   go(key);
  });
  const selector=root.querySelector('[data-day-group]');if(selector)selector.onchange=()=>{group=selector.value;bridge.selectGroup(group);draw();};
  const back=root.querySelector('[data-day-back]');if(back)back.onclick=()=>{if(mode==='home'){tool='';bridge.remember?.('');draw();}else route('home');};
 }
 root.innerHTML='<section class="day-hub"><p role="status">Opening your coaching day…</p></section>';
 load().catch(err=>{if(!closed)root.innerHTML=`<section class="day-hub"><h1>Your coaching day</h1><p role="alert">${e(err.message)}</p></section>`;});
 return ()=>{closed=true;leave();root.replaceChildren();};
}
