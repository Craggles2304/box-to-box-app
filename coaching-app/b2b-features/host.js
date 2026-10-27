/** V41: Thin adapter for the existing V40 signed-in single-page app. No independent auth/keys. */
import {mountCoachHome} from './coach-home.js';
import {mountPlayerJourney} from './journey.js';
import {mountTeamSessionDNA} from './team-session-dna.js';
import {mountCoachTactics} from './tactics-simple.js';
import {mountCoachMatchday} from './matchday-quick.js';
import {mountCoachQuickMoment} from './quick-moment.js';
import {mountCoachFamilyUpdate} from './parent-live.js';
import {mountCoachGuardianSetup,mountParentOnboarding} from './parent-onboarding.js?v=47';
const esc = s => String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const idCheck = s => /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(String(s||''));
const groupCheck = s => /^[A-Za-z0-9/ -]{2,60}$/.test(String(s||''));
export function mountCoachWorkspace({root,supabase}={}){
 if (!(root instanceof Element) || !supabase?.rpc || !supabase?.auth?.getUser) throw new TypeError('Sign in to your existing coaching account.');
 let closed=false, cleanup=null, current='home', selectedGroup=null;
 const sections={home:'Your coaching day',player:'Player learning',plan:'Team training plan',tactics:'Tactics board',matchday:'Matchday',moment:'One learning moment',parents:'Family update',links:'Connect parents'};
 function open(kind,arg,playerGroup){
   if(closed) return;
   if(!Object.hasOwn(sections,kind))return;
   if(kind==='player'&&!idCheck(arg))return;
   if(kind!=='home'&&kind!=='player'&&!groupCheck(arg))return;
   try{cleanup?.()}catch(e){}
   cleanup=null;current=kind;
   if(kind!=='home'&&kind!=='player')selectedGroup=arg;
   if(kind==='player'&&groupCheck(playerGroup))selectedGroup=playerGroup;
   root.innerHTML=`<div class="btb-workspace">${kind==='home'?'':`<nav class="btb-workspace-back" aria-label="Coach workspace"><button type="button" data-back-home>← Back to Coach Home</button><span>${esc(sections[kind])}${kind!=='player'?' · '+esc(arg):''}</span></nav>`}<div data-workspace-panel role="region" aria-label="${esc(sections[kind])}"></div></div>`;
   const slot=root.querySelector('[data-workspace-panel]');
   try{
     if(kind==='home')cleanup=mountCoachHome({root:slot,supabase,
       onOpenPlayer:(id,g)=>open('player',id,g),onOpenGroup:g=>open('plan',g),
       onOpenTactics:g=>open('tactics',g),onOpenFamilyUpdates:g=>open('parents',g),
       onOpenMatchday:g=>open('matchday',g),onOpenQuickMoment:g=>open('moment',g),
       onOpenGuardianLinks:g=>open('links',g)});
     if(kind==='player')cleanup=mountPlayerJourney({root:slot,supabase,
       playerId:arg,groupId:selectedGroup,
       onConnectParent:groupCheck(selectedGroup)?()=>open('links',selectedGroup):undefined});
     if(kind==='plan')cleanup=mountTeamSessionDNA({root:slot,supabase,groupId:arg});
     if(kind==='tactics')cleanup=mountCoachTactics({root:slot,supabase,groupId:arg,onOpenMatch:()=>open('matchday',arg)});
     if(kind==='matchday')cleanup=mountCoachMatchday({root:slot,supabase,groupId:arg,onOpenTactics:()=>open('tactics',arg)});
     if(kind==='moment')cleanup=mountCoachQuickMoment({root:slot,supabase,groupId:arg,onOpenPlayer:id=>open('player',id)});
     if(kind==='parents')cleanup=mountCoachFamilyUpdate({root:slot,supabase,groupId:arg});
     if(kind==='links')cleanup=mountCoachGuardianSetup({root:slot,supabase,groupId:arg});
   }catch(e){slot.innerHTML=`<div role="alert" class="btb-workspace-error">${esc(e.message||'Unable to open this coaching tool.')}</div>`;}
 }
 function back(e){if(e.target.closest?.('[data-back-home]')&&root.contains(e.target))open('home')}
 root.addEventListener('click',back);
 open('home');
 return ()=>{closed=true;root.removeEventListener('click',back);try{cleanup?.()}catch(e){}root.replaceChildren();};
}
export function mountParentFirst({root,supabase,onOpenPassport}={}){
 if(!(root instanceof Element))throw new TypeError('Parent home requires a valid place to render.');
 return mountParentOnboarding({root,supabase,onOpenPassport});
}
