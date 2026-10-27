import {sportGraphic} from './sport-visuals.js';
import {escape as e} from './day-core.js';
import {mountCoachTactics} from './tactics-simple.js';
import {technicalOptions,behaviourOptions,suggestFits,expectationsFor,repositionDraft} from './tactical-fit.js';
const phases={build:'Build-up',progress:'Progression',finish:'Creating & finishing',defend:'Defensive organisation',win:'Attacking transition',lose:'Defensive transition',restart:'Restarts'};
export function mountTacticsHub({root,supabase,groupId,onOpenMatch,onOpenChat}){
 let closed=false,leave=()=>{},section='overview',plans=[],players=[],plan=null,playerId='',attributes={},roleIndex=0,editable=false,uid='',fits=[];
 const read=async q=>{const r=await q;if(r.error)throw r.error;return r.data;};
 const live=()=>!closed&&root.isConnected;
 const slots=()=>window.Comms?.slotsFor(plan?.formation||'4-1-2-1')||[];
 async function load(){
  const auth=await read(supabase.auth.getUser());uid=auth?.user?.id;if(!uid)throw Error('Please sign in.');
  const p=await read(supabase.from('profiles').select('role,groups').eq('id',uid).single());
  if(!['admin','coach'].includes(p?.role)||(p.role==='coach'&&!p.groups?.includes(groupId)))throw Error('This team is not assigned to your account.');
  editable=!!await read(supabase.rpc('is_lead',{g:groupId}));
  [plans,players]=await Promise.all([read(supabase.from('match_plans').select('id,group_id,match_key,title,kickoff,formation,lineup,subs,tactics,published,updated_at').eq('group_id',groupId).order('updated_at',{ascending:false}).limit(30)),read(supabase.from('players').select('id,name,groups').contains('groups',[groupId]).order('name'))]);
  plan=plans.find(p=>p.id===plan?.id)||plans[0]||null;playerId=players.some(p=>p.id===playerId)?playerId:players[0]?.id||'';
  if(live())draw();
 }
 async function loadAttributes(){
  attributes=playerId?await read(supabase.from('academy_tactical_player_attributes').select('technical,behaviours,preferred_foot').eq('player_id',playerId).maybeSingle())||{}:{};fits=[];
 }
 function open(key){leave();leave=()=>{};section=key;if(key==='players')load().then(loadAttributes).then(()=>{if(live())draw();}).catch(fail);else if(key==='roles'||key==='overview')load().catch(fail);else draw();}
 function fail(err){if(!live())return;const slot=root.querySelector('[data-hub-status]');if(slot)slot.textContent=err.message;else root.textContent=err.message;}
 function draw(){
  leave();leave=()=>{};if(!live())return;
  root.innerHTML=`<section class="tactics-hub"><div class="hub-title"><p class="eyebrow">${e(groupId)} · Coach workspace</p><h2 class="page-h">Tactics Hub</h2><p class="muted">Your game model. Your players. A shared understanding.</p></div><nav class="hub-nav" aria-label="Tactics Hub">${[['overview','Overview'],['model','Game model'],['roles','Player roles'],['players','Player fit']].map(([key,label])=>`<button class="btn ${section===key?'primary':''}" data-hub-section="${key}" aria-pressed="${section===key}">${label}</button>`).join('')}</nav><div data-hub-body></div><p role="status" data-hub-status></p></section>`;
  const body=root.querySelector('[data-hub-body]');
  if(section==='overview')body.innerHTML=`<div class="hub-grid">${[['model','01','Game model','Build-up, progression, finishing, defending, transitions and restarts.'],['roles','02','Player expectations','Turn your saved principles into clear positional responsibilities.'],['players','03','Get the most from a player','Choose observed attributes, explore a role, then review a position change.']].map(([key,n,title,text])=>`<button class="card hub-card" data-hub-section="${key}"><span class="eyebrow">${n}</span>${sportGraphic(key)}<h3>${title}</h3><p class="muted">${text}</p><span>Open →</span></button>`).join('')}</div><div class="hub-links"><button class="btn" data-hub-match>Open Match Room</button><button class="btn" data-hub-chat>Team chat</button></div>`;
  if(section==='model')leave=mountCoachTactics({root:body,supabase,groupId,onOpenMatch});
  if(section==='roles'||section==='players'){
   if(!plan){body.innerHTML='<div class="card"><h3>Start with your game model</h3><p>Create and save a tactical draft first.</p><button class="btn primary" data-hub-section="model">Open game model</button></div>';}
   else{
    body.innerHTML=`<div class="field"><label>Match plan<select data-hub-plan>${plans.map(p=>`<option value="${p.id}" ${p.id===plan.id?'selected':''}>${e(p.title||p.match_key)} · ${p.published?'Published':'Draft'}</option>`).join('')}</select></label></div><div data-hub-content></div>`;
    const out=body.querySelector('[data-hub-content]');
    if(section==='roles')drawRoles(out);else drawFit(out);
    body.querySelector('[data-hub-plan]').onchange=ev=>{plan=plans.find(p=>p.id===ev.target.value);roleIndex=0;fits=[];draw();};
   }
  }
  root.querySelectorAll('[data-hub-section]').forEach(b=>b.onclick=()=>open(b.dataset.hubSection));
  root.querySelector('[data-hub-match]')?.addEventListener('click',()=>onOpenMatch?.(groupId));root.querySelector('[data-hub-chat]')?.addEventListener('click',()=>onOpenChat?.(groupId));
 }
 function drawRoles(out){
  const positions=slots();if(!positions.length){out.textContent='Choose a formation in the game model first.';return;}
  const current=positions[Math.min(roleIndex,positions.length-1)],exp=expectationsFor(plan,current.pos);
  out.innerHTML=`<label class="field">Position<select data-hub-role>${positions.map((p,i)=>`<option value="${i}" ${i===roleIndex?'selected':''}>${e(p.pos)}${plan.lineup?.[i]?.name?' · '+e(plan.lineup[i].name):''}</option>`).join('')}</select></label>${exp?`<div class="card"><h3>${e(current.pos)} · Role briefing</h3><div class="hub-role-pair"><div><b>With the ball</b><p>${e(exp.withBall)}</p></div><div><b>Without the ball</b><p>${e(exp.withoutBall)}</p></div></div><p class="muted">Use these positional prompts with the team instructions you saved below.</p></div>${exp.phases.map(p=>`<details class="card hub-phase"><summary>${e(phases[p.phase]||p.phase)}</summary>${[['Team principle',p.principle],['Trigger',p.trigger],['Team action',p.teamAction],['What to observe',p.evidence]].filter(([,value])=>value).map(([title,value])=>`<h4>${title}</h4><p>${e(value)}</p>`).join('')}</details>`).join('')}`:'<div class="card"><h3>Add your principles first</h3><p>Role briefings become available after you save at least one game-model section.</p><button class="btn primary" data-hub-section="model">Open game model</button></div>'}`;
  out.querySelector('[data-hub-role]').onchange=ev=>{roleIndex=Number(ev.target.value);draw();};
 }
 function drawFit(out){
  const chosen=players.find(p=>p.id===playerId),options=(name,list,selected)=>Object.entries(list).map(([key,label])=>`<label class="hub-check"><input type="checkbox" name="${name}" value="${key}" ${selected?.includes(key)?'checked':''}>${label}</label>`).join('');
  out.innerHTML=`<label class="field">Your player<select data-hub-player>${players.map(p=>`<option value="${p.id}" ${p.id===playerId?'selected':''}>${e(p.name)}</option>`).join('')}</select></label>${!chosen?'<p>No players are assigned to this team.</p>':`<form data-fit-form><fieldset><legend>Football attributes you have observed</legend><div class="hub-check-grid">${options('technical',technicalOptions,attributes.technical)}</div></fieldset><fieldset><legend>Football behaviours · mental attributes</legend><p class="muted">Choose behaviours you have observed in football. These are coaching notes, not psychological assessments.</p><div class="hub-check-grid">${options('behaviours',behaviourOptions,attributes.behaviours)}</div></fieldset><label class="field">Preferred foot<select name="preferred_foot">${[['unknown','Not recorded'],['left','Left'],['right','Right'],['both','Either foot']].map(([key,label])=>`<option value="${key}" ${attributes.preferred_foot===key?'selected':''}>${label}</option>`).join('')}</select></label><div class="actions"><button class="btn" type="submit" value="save">Save coach notes</button><button class="btn primary" type="submit" value="suggest">Suggest roles</button></div></form><div data-fit-results>${fits.length?renderFits(chosen):''}</div><p class="muted">Suggestions use the attributes you select and positions in ${e(plan.formation)}. Test them in practice. You decide whether to change the team sheet.</p>`}`;
  out.querySelector('[data-hub-player]')?.addEventListener('change',ev=>{playerId=ev.target.value;loadAttributes().then(()=>{if(live())draw();}).catch(fail);});
  out.querySelector('[data-fit-form]')?.addEventListener('submit',async ev=>{ev.preventDefault();const form=new FormData(ev.target);attributes={technical:form.getAll('technical'),behaviours:form.getAll('behaviours'),preferred_foot:form.get('preferred_foot')};
   if(ev.submitter?.value==='suggest'){fits=suggestFits(attributes,slots());const results=out.querySelector('[data-fit-results]');results.innerHTML=fits.length?renderFits(chosen):'<p role="status">Select at least one football attribute and one behaviour. If nothing matches, explore a role in practice before making a change.</p>';bindMoves(results);return;}
   const buttons=ev.target.querySelectorAll('button');buttons.forEach(b=>b.disabled=true);try{await read(supabase.from('academy_tactical_player_attributes').upsert({player_id:playerId,...attributes,updated_by:uid,updated_at:new Date().toISOString()}));root.querySelector('[data-hub-status]').textContent='Coach notes saved privately. Families cannot read these attribute notes.';}catch(err){fail(err);}finally{buttons.forEach(b=>b.disabled=false);}
  });bindMoves(out);
 }
 function renderFits(player){return `<h3>Roles to explore with ${e(player.name)}</h3>${fits.map((fit,i)=>`<article class="card hub-fit"><p class="eyebrow">${i===0?'Strongest match to your selected attributes':'Alternative to explore'}</p><h3>${e(fit.pos)}</h3><p>${fit.matched.map(k=>e(technicalOptions[k]||behaviourOptions[k])).join(' · ')}</p><p>${e(expectationsFor(plan,fit.pos)?.withBall||'Review this role in your game model before applying it.')}</p>${editable?`<button class="btn" data-fit-move="${fit.index}">Review position change</button>`:'<p class="muted">The team lead can change the lineup.</p>'}</article>`).join('')}`;}
 function bindMoves(slot){slot.querySelectorAll('[data-fit-move]').forEach(b=>b.onclick=async()=>{
  if(!editable)return;const player=players.find(p=>p.id===playerId),index=Number(b.dataset.fitMove),position=slots()[index];
  if(!player||!position)return;if(plan.lineup?.[index]?.player_id===player.id){root.querySelector('[data-hub-status]').textContent='This player already occupies that position.';return;}const prior=plan.lineup?.[index];const message=`Place ${player.name} at ${position.pos}? ${prior?.player_id&&prior.player_id!==player.id?'The existing player will be swapped or moved to substitutes. ':''}${plan.published?'The plan will become a private draft until you publish it again in Match Room.':'This changes only the private draft.'}`;
  if(!confirm(message))return;b.disabled=true;try{const patch=repositionDraft(plan,player,index,slots());const updated=await read(supabase.from('match_plans').update(patch).eq('id',plan.id).eq('group_id',groupId).select('id,lineup,subs,published').single());plan={...plan,...updated};plans=plans.map(p=>p.id===plan.id?plan:p);window.Comms?.loadPlans(true);root.querySelector('[data-hub-status]').textContent='Position saved to the private draft. Review and publish from the original Match Room.';}catch(err){fail(err);}finally{b.disabled=false;}
 });}
 root.innerHTML='<p role="status">Opening Tactics Hub…</p>';load().catch(fail);
 return()=>{closed=true;leave();root.replaceChildren();};
}
