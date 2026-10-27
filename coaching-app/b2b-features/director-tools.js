import {mountKeepUpRoutine} from './keepup-routine.js';
import {mountCoachHome} from './coach-home.js';
import {mountPlayerJourney} from './journey.js';
import {mountTeamSessionDNA} from './team-session-dna.js';
import {mountCoachTactics} from './tactics-simple.js';
import {mountCoachMatchday} from './matchday-quick.js';
import {mountCoachQuickMoment} from './quick-moment.js';
import {mountParentLive,mountCoachFamilyUpdate} from './parent-live.js';
import {mountParentOnboarding,mountCoachGuardianSetup} from './parent-onboarding.js';

export const DIRECTOR='508cad67-0dcd-4d02-8fb2-e08d34fd6854';
export const allowed=(user,profile)=>user?.id===DIRECTOR&&profile?.role==='admin';
const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const tools=[['home','Coaching day'],['moment','Learning moment'],['journey','Player journey'],['session','Team session'],['tactics','Tactics'],['matchday','Matchday'],['updates','Team update'],['links','Connect families'],['family','Approved family feed'],['onboarding','Parent onboarding'],['routine','Football routine']];

/** Private director release. Wider role rollout requires authenticated role tests. */
export async function mountDirectorTools({root,supabase}){
 let disposed=false,leave=()=>{},panel='home',group='',player='',players=[],groups=[];
 const read=async q=>{const r=await q;if(r.error)throw r.error;return r.data;};
 const close=()=>{disposed=true;leave();root.replaceChildren();};
 const active=()=>!disposed&&root.isConnected;
 root.innerHTML='<p role="status">Checking your director login…</p>';
 const identity=await read(supabase.auth.getUser());
 if(identity?.user?.id!==DIRECTOR){root.textContent='This area is private to the director account.';return close;}
 const profile=await read(supabase.from('profiles').select('role,groups').eq('id',identity.user.id).single());
 if(!allowed(identity.user,profile)){root.textContent='Director access required.';return close;}
 if(!active())return close;
 players=await read(supabase.from('players').select('id,name,groups').order('name').limit(500))||[];
 groups=[...new Set([...(profile.groups||[]),...players.flatMap(p=>p.groups||[])])].filter(g=>typeof g==='string'&&g.length>1).sort();
 group=groups[0]||'';player=players[0]?.id||'';
 if(!active())return close;
 // Read-only director pulse: counts from real approved/pending records, never invented.
 let journeyPulse=null;
 try{journeyPulse=await read(supabase.rpc('passport_parent_journey_status',{}));}
 catch{journeyPulse=null;}
 if(!active())return close;
 const pulseCount=(key)=>{const v=journeyPulse?.counts?.[key];return Number.isSafeInteger(v)&&v>=0?String(v):'—';};
 const pulseHtml=()=>`<section class="btb-director-pulse" aria-label="Player journey overview"><header><div><small>ACADEMY CONTROL · VERIFIED RECORDS</small><h3>YOUR PLAYER JOURNEY PULSE</h3></div><p>Current database counts · never automated player grades.</p></header><div class="btb-pulse-grid">
   <article><strong>${pulseCount('waiting_to_prepare')}</strong><span>Updates to prepare</span></article>
   <article><strong>${pulseCount('awaiting_coach_approval')}</strong><span>Coach reviews waiting</span></article>
   <article><strong>${pulseCount('published_parent_updates')}</strong><span>Approved family updates</span></article>
   <article><strong>${pulseCount('approved_drafts')}</strong><span>Approved Passport drafts</span></article>
 </div><small class="btb-director-pulse-note">These are records, not a count of parents who have read updates. Parent account verification remains required.</small></section>`;
 const go=(key,id)=>{if(!active())return;if(key==='journey'||key==='family')player=id||player;else group=id||group;panel=key;render();};
 const openPlayer=id=>go('journey',id);
 function render(){
  leave();leave=()=>{};if(!active())return;
  const needsPlayer=['journey','family'].includes(panel),needsGroup=['moment','session','tactics','matchday','updates','links'].includes(panel);
  root.innerHTML=`<section class="academy-tools"><header><p class="eyebrow">PRIVATE DIRECTOR PREVIEW · ALL TOOLS</p><h2>One academy. One learning journey.</h2><p>These new tools are visible only in your director login. Coaches and families retain their existing screens while role testing is completed.</p><p class="muted">Saving a private observation and sharing an approved family update are separate actions. Scheduled workflows remain off.</p></header>${panel==='home'?pulseHtml():''}<nav class="ops-row" aria-label="Development tools">${tools.map(([key,label])=>`<button type="button" data-academy-tool="${key}" class="${panel===key?'':'secondary'}" aria-pressed="${panel===key}">${label}</button>`).join('')}</nav>${needsGroup?`<label>Team <select data-academy-group>${groups.map(g=>`<option ${g===group?'selected':''} value="${escape(g)}">${escape(g)}</option>`).join('')}</select></label>`:''}${needsPlayer?`<label>Player <select data-academy-player>${players.map(p=>`<option ${p.id===player?'selected':''} value="${escape(p.id)}">${escape(p.name)}</option>`).join('')}</select></label>`:''}<div data-academy-mount></div></section>`;
  root.querySelectorAll('[data-academy-tool]').forEach(b=>b.onclick=()=>go(b.dataset.academyTool));
  const groupSelect=root.querySelector('[data-academy-group]');if(groupSelect)groupSelect.onchange=()=>go(panel,groupSelect.value);
  const playerSelect=root.querySelector('[data-academy-player]');if(playerSelect)playerSelect.onchange=()=>go(panel,playerSelect.value);
  const slot=root.querySelector('[data-academy-mount]');
  if((needsPlayer&&!player)||(needsGroup&&!group)){slot.textContent='No authorised roster records are available.';return;}
  const base={root:slot,supabase,groupId:group,playerId:player,onOpenPlayer:openPlayer,onOpenPassport:openPlayer};
  try{
   if(panel==='home')leave=mountCoachHome({...base,onOpenGroup:id=>go('session',id),onOpenTactics:id=>go('tactics',id),onOpenFamilyUpdates:id=>go('updates',id),onOpenMatchday:id=>go('matchday',id),onOpenQuickMoment:id=>go('moment',id),onOpenGuardianLinks:id=>go('links',id)});
   if(panel==='moment')leave=mountCoachQuickMoment(base);
   if(panel==='journey')leave=mountPlayerJourney(base);
   if(panel==='session')leave=mountTeamSessionDNA(base);
   if(panel==='tactics')leave=mountCoachTactics({...base,onOpenMatch:id=>go('matchday',id)});
   if(panel==='matchday')leave=mountCoachMatchday({...base,onOpenTactics:id=>go('tactics',id)});
   if(panel==='updates')leave=mountCoachFamilyUpdate(base);
   if(panel==='links')leave=mountCoachGuardianSetup(base);
   if(panel==='family')leave=mountParentLive(base);
   if(panel==='routine')leave=mountKeepUpRoutine({root:slot,playerId:'director-preview'});
   if(panel==='onboarding'){
    leave=mountParentOnboarding(base);
    const notice=document.createElement('details');notice.innerHTML='<summary>Academy privacy notice</summary>'+(window.B2B_PRIVACY_FN?.('the academy safeguarding lead')||'<p>Contact the academy for its privacy notice.</p>');slot.before(notice);
   }
  }catch(e){slot.textContent=e.message||'This tool could not be opened.';}
 }
 render();return close;
}
