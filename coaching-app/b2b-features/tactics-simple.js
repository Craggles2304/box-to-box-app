/** Box to Box V6 — simple match tactics on top of the EXISTING match_plans table.
 * Requires host Coaching App's signed-in Supabase v2 client. No private keys.
 * Changes only `formation` and `tactics.coach_simple`, preserving all legacy tactics,
 * lineup, set pieces, player selection and published state.
 */
const clean = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const okGroup = s => typeof s === 'string' && s.length >= 2 && s.length <= 60 && !/[<>\x00-\x1f]/.test(s);
const choices = Object.freeze({
  5:['1-2-1','2-2','2-1-1'],
  7:['2-3-1','3-2-1','2-1-2-1'],
  9:['3-3-2','3-2-3','2-3-2-1','4-1-2-1'],
  11:['4-3-3','4-2-3-1','4-1-4-1','3-5-2']
});
export const formationChoices = choices;
export function getFormat(formation) {
  if(typeof formation!=='string')return 9;
  const parts=formation.split('-').map(Number);
  const n=parts.reduce((a,b)=>a+b,0)+1;
  return parts.length && parts.every(x=>Number.isInteger(x)&&x>=1&&x<=5) && [5,7,9,11].includes(n)?n:9;
}
export function buildPitch(formation) {
 const lines=String(formation||'').split('-').map(Number);
 if(!lines.length||lines.some(n=>!Number.isInteger(n)||n<1||n>5)||lines.reduce((a,b)=>a+b,0)>10)return '';
 const points=[{x:50,y:90,label:'GK'}];let number=2;
 lines.forEach((count,i)=>{for(let j=0;j<count;j++)points.push({x:100*(j+1)/(count+1),y:72-i*(57/Math.max(1,lines.length-1)),label:String(number++)});});
 return `<svg viewBox="0 0 400 510" role="img" aria-label="${clean(formation)} team shape, attacking towards the top"><defs><pattern id="tac-grass" width="400" height="85" patternUnits="userSpaceOnUse"><rect width="400" height="85" fill="#14332a"/><rect width="400" height="42.5" fill="#193b30"/></pattern><marker id="tac-arrow" markerWidth="7" markerHeight="7" refX="5" refY="3" orient="auto"><path d="M0 0L6 3L0 6" fill="#d8ff00"/></marker></defs><rect width="400" height="510" rx="12" fill="url(#tac-grass)"/><g stroke="#a4bcaa" stroke-opacity=".5" fill="none" stroke-width="1.5"><rect x="20" y="20" width="360" height="470"/><path d="M20 255H380M105 20V99H295V20M145 20V52H255V20M105 490V411H295V490M145 490V458H255V490"/><circle cx="200" cy="255" r="51"/><circle cx="200" cy="255" r="2"/></g><path d="M60 355L60 188M340 355L340 188" stroke="#d8ff00" stroke-opacity=".4" stroke-width="2" stroke-dasharray="7 6" marker-end="url(#tac-arrow)"/>${points.map(pt=>`<g class="${pt.label==='GK'?'btb-tactic-keeper':'btb-tactic-dot'}" transform="translate(${20+pt.x*3.6} ${20+pt.y*4.7})"><circle r="16" fill="#d8ff00" stroke="#101b0f" stroke-width="3"/><text text-anchor="middle" dy="4" fill="#121b0c" font-size="12" font-family="Arial" font-weight="800">${pt.label}</text></g>`).join('')}<text x="200" y="12" fill="#cbd5cc" text-anchor="middle" font-size="9" letter-spacing="3">ATTACK ↑</text></svg>`;
}
export function safeTacticPatch(plan,form) {
  const format=Number(form.format);
  if(![5,7,9,11].includes(format) || !choices[format].includes(form.formation))throw new Error('Choose a valid formation for this match format.');
  const old=plan?.tactics && typeof plan.tactics==='object'&&!Array.isArray(plan.tactics)?plan.tactics:{};
  const allowed=['with_ball','without_ball','transition','set_pieces'];
  const concise={};
  for(const key of allowed){const value=String(form[key]??'').trim();if(value.length>180)throw new Error('Please use one short instruction per tactical moment.');concise[key]=value;}
  if(!concise.with_ball&&!concise.without_ball&&!concise.transition&&!phases.some(([key])=>String(form[key+'_principle']||'').trim()))throw new Error('Choose at least one coaching instruction.');
  const details={};for(const key of ['build','progress','finish','defend','win','lose','restart']){details[key]={};for(const field of ['principle','trigger','action','evidence']){const value=String(form[key+'_'+field]??old.coach_principles?.[key]?.[field]??'').trim();if(value.length>400)throw Error('Keep tactical details to 400 characters per field.');details[key][field]=value;}}return {formation:form.formation,tactics:{...old,coach_simple:{...concise,format,version:6},coach_principles:details}};
}
const phases=[['build','Build','Create a spare player. Use the goalkeeper, width and supporting angles to play beyond the first line.'],['progress','Progress','Connect units through, around or over pressure. Occupy different lines and protect central balance.'],['finish','Create & finish','Coordinate depth, width and box occupation. Separate the chance-creation principle from the final action.'],['defend','Defend','Pressure, cover and balance. Define the pressing cue, distances between units and protection of the goal.'],['win','On regain','First scan: forward opportunity or secure possession? Connect the next two actions before committing numbers.'],['lose','On loss','Nearest player delays; supporting players protect central space. Decide when to counter-press and when to recover.'],['restart','Restarts','Assign delivery, first contact, second ball and rest defence. Include the opposition threat and recovery roles.']];
const template = {
  with_ball:['Scan before receiving','Create width and support','Pass and move to find space'],
  without_ball:['Protect the middle','Defend together','Press only with support'],
  transition:['Win it: look forward. Lose it: recover shape.','React quickly and find your nearest teammate.']
};
export function mountCoachTactics({root,supabase,groupId,onOpenMatch}) {
  if(!(root instanceof Element)||!supabase?.auth?.getUser||!supabase?.from||!okGroup(groupId))throw new TypeError('Valid coach area, signed-in Supabase client and group are required.');
  let closed=false,editable=false,plan=null,plans=[],fixtures=[],format=9;
  root.classList.add('btb-tactics');
  root.innerHTML='<section class="btb-tactics-shell" role="status">Opening your tactics board…</section>';
  const fetchRows=async query=>{const {data,error}=await query;if(error)throw error;return data||[];};
  const fail=e=>{if(!closed){const box=root.querySelector('[data-status]');if(box)box.textContent=String(e?.message||'Unable to save your tactics.');else root.innerHTML=`<p role="alert">${clean(e.message)}</p>`;}};
  const datestr=d=>{if(!d)return '';const v=new Date(d);return Number.isNaN(v.valueOf())?'':v.toLocaleDateString('en-GB',{day:'numeric',month:'short'});};
  async function load() {
    const {data:auth,error:authError}=await supabase.auth.getUser();
    if(authError||!auth?.user?.id)throw new Error('Please sign in as a coach.');
    const {data:profile,error:profileError}=await supabase.from('profiles').select('role,groups').eq('id',auth.user.id).single();
    if(profileError)throw profileError;
    if(!['admin','coach'].includes(profile?.role)||profile.role==='coach'&&!profile.groups?.includes(groupId))throw new Error('This team is not on your coaching dashboard.');
    const {data:lead,error:leadError}=await supabase.rpc('is_lead',{g:groupId});
    if(leadError)throw leadError;
    editable=!!lead;
    [plans,fixtures]=await Promise.all([
      fetchRows(supabase.from('match_plans').select('id,group_id,match_key,title,kickoff,formation,tactics,published,updated_at').eq('group_id',groupId).order('updated_at',{ascending:false}).limit(20)),
      fetchRows(supabase.from('fixtures').select('id,group_id,kickoff,opponent').eq('group_id',groupId).gte('kickoff',new Date().toISOString()).order('kickoff',{ascending:true}).limit(5))
    ]);
    if(closed)return;
    plan=plans[0]||null;
    format=plan?getFormat(plan.formation):9;
    draw();
  }
  function draw(){
    const selected=plan?.formation&&choices[format].includes(plan.formation)?plan.formation:choices[format][0];
    const quick=plan?.tactics?.coach_simple||{};
    const btn=editable?'<button type="submit" class="btb-tac-primary">Save tactical instructions</button>':'<p class="btb-tac-muted">View only: the team lead or director can edit these tactics.</p>';
    const existing=plans.length>1?`<label for="btb-plan-pick">Match plan</label><select id="btb-plan-pick" name="planId">${plans.map(p=>`<option value="${clean(p.id)}"${plan&&p.id===plan.id?' selected':''}>${clean(p.title||p.match_key||'Match plan')} · ${clean(datestr(p.kickoff))}</option>`).join('')}</select>`:'';
    const create=editable?`<details class="btb-tac-more"><summary>Need a new match tactics sheet?</summary><button type="button" data-create-plan>New private tactical draft${fixtures[0]?' for next scheduled fixture':''}</button><p>Does not overwrite an existing match plan or notify parents.</p></details>`:'';
    root.innerHTML=`<div class="btb-tactics-shell"><header><small>BOX TO BOX · ${clean(groupId)}</small><h2>Own the next phase.</h2><p>A clear team shape. A shared principle. One observable player action.</p></header>
    ${plan?`<div class="btb-tac-current"><strong>${clean(plan.title||'Tactical focus')}</strong><span>${clean(datestr(plan.kickoff))}${plan.published?' · Existing match plan is published':' · Private match plan'}</span></div>${existing}`:'<p class="btb-tac-muted">No match plan yet. Create a private tactics sheet below.</p>'}
    ${plan?`<form data-tactics-form><div class="btb-tac-choose"><label>Format <select name="format">${Object.keys(choices).map(n=>`<option value="${n}"${+n===format?' selected':''}>${n}v${n}</option>`).join('')}</select></label><label>Formation <select name="formation">${choices[format].map(n=>`<option value="${n}"${selected===n?' selected':''}>${n}</option>`).join('')}</select></label></div>
    <div class="btb-tac-pitch" role="img" aria-label="Formation ${clean(selected)}: goalkeeper at the back; outfield lines shown from defence toward attack">${buildPitch(selected)}</div>
    <div class="tactics-phase-tabs" role="tablist" aria-label="Principles of play">${phases.map(([key,label],i)=>`<button type="button" role="tab" data-tactic-phase="${key}" aria-selected="${i===0}">${label}</button>`).join('')}</div><div class="tactics-principles">${phases.map(([key,label,hint],i)=>`<section data-phase-panel="${key}" ${i?'hidden':''}><h3>${label}</h3><p>${hint}</p>${[['principle','Team principle','What is our collective intention?'],['trigger','Decision trigger','What cue tells the players to act?'],['action','Player & unit actions','Who moves, where, when and why?'],['evidence','Observe & review','What will tell us that the principle worked?']].map(([field,title,placeholder])=>`<label>${title}<textarea name="${key}_${field}" rows="2" maxlength="400" placeholder="${clean(placeholder)}">${clean(plan?.tactics?.coach_principles?.[key]?.[field]||'')}</textarea></label>`).join('')}</section>`).join('')}</div><details class="btb-tac-more"><summary>Player-facing match cues</summary><div class="btb-tac-prompts">${[['with_ball','With the ball'],['without_ball','Without the ball'],['transition','When possession changes']].map(([k,label])=>`<label>${label}<textarea rows="2" maxlength="180" name="${k}" placeholder="One clear coaching point…">${clean(quick[k]||'')}</textarea></label><div class="btb-tac-chips">${(template[k]||[]).map(t=>`<button type="button" data-key="${k}" data-cue="${clean(t)}">${clean(t)}</button>`).join('')}</div>`).join('')}
    <details class="btb-tac-more"><summary>Set-piece reminder (optional)</summary><label>One simple instruction<textarea maxlength="180" rows="2" name="set_pieces">${clean(quick.set_pieces||'')}</textarea></label></details></div></details>${btn}</form>`:''}
    ${create}<p role="status" data-status class="btb-tac-status" aria-live="polite"></p></div>`;
  }
  async function save(form){
    if(!editable||!plan)return;
    const d=new FormData(form);const patch=safeTacticPatch(plan,Object.fromEntries(d));
    const {data,error}=await supabase.from('match_plans').update(patch).eq('id',plan.id).eq('group_id',groupId).select('id,tactics,formation,published').single();
    if(error)throw error;
    if(!data)throw new Error('No authorised record was updated.');
    plan={...plan,...data};
    const index=plans.findIndex(p=>p.id===plan.id);if(index>=0)plans[index]=plan;
    root.querySelector('[data-status]').textContent='Tactics saved. Existing lineup, matchday plans and published status are unchanged.';
  }
  async function newPlan(){
    if(!editable)throw new Error('Only the lead coach can create a tactics sheet.');
    const fixture=fixtures[0];
    const title=fixture?`Match tactics · ${String(fixture.opponent||'Next match').slice(0,75)}`:'Training tactical focus';
    const matchKey=fixture?'tactics-simple:'+fixture.id:'tactics-simple:'+groupId+':'+new Date().toISOString().slice(0,10);
    const existing=plans.find(p=>p.match_key===matchKey);
    if(existing){plan=existing;format=getFormat(plan.formation);draw();return;}
    const payload={group_id:groupId,match_key:matchKey,title,kickoff:fixture?.kickoff||null,formation:choices[9][0],lineup:[],subs:[],keys:[],tactics:{},published:false};
    const {data,error}=await supabase.from('match_plans').insert(payload).select('id,group_id,match_key,title,kickoff,formation,tactics,published,updated_at').single();
    if(error)throw error;
    plans.unshift(data);plan=data;format=9;draw();
    root.querySelector('[data-status]').textContent='Private tactical draft created. Choose a formation and save your coaching points.';
  }
  function clicked(ev){const phase=ev.target.closest?.('[data-tactic-phase]');if(phase&&root.contains(phase)){root.querySelectorAll('[data-tactic-phase]').forEach(b=>b.setAttribute('aria-selected',String(b===phase)));root.querySelectorAll('[data-phase-panel]').forEach(p=>p.hidden=p.dataset.phasePanel!==phase.dataset.tacticPhase);return;}const el=ev.target.closest?.('button');if(!el||!root.contains(el))return;
    if(el.dataset.key&&el.dataset.cue){const ta=root.querySelector(`textarea[name="${el.dataset.key}"]`);if(ta){ta.value=el.dataset.cue;ta.focus();}}
    if(el.hasAttribute('data-create-plan')){el.disabled=true;newPlan().catch(fail).finally(()=>{if(el.isConnected)el.disabled=false;});}
  }
  function changed(ev){if(ev.target.name==='format'){
    const fd=new FormData(root.querySelector('form'));const form=Object.fromEntries(fd);
    const n=Number(ev.target.value);if(!choices[n])return;
    format=n;const v=choices[n][0];const selector=root.querySelector('select[name="formation"]');
    selector.innerHTML=choices[n].map(x=>`<option value="${x}">${x}</option>`).join('');selector.value=v;
    root.querySelector('.btb-tac-pitch').innerHTML=buildPitch(v);
  } else if(ev.target.name==='formation'){
    const e=root.querySelector('.btb-tac-pitch');e.innerHTML=buildPitch(ev.target.value);e.setAttribute('aria-label','Formation '+ev.target.value);
  }else if(ev.target.name==='planId'){
    const p=plans.find(x=>x.id===ev.target.value);if(p){plan=p;format=getFormat(plan.formation);draw();}
  }}
  function submitted(ev){if(!ev.target.matches('form[data-tactics-form]'))return;ev.preventDefault();
    const btn=ev.target.querySelector('button[type="submit"]');btn.disabled=true;
    save(ev.target).catch(fail).finally(()=>{if(btn.isConnected)btn.disabled=false;});
  }
  root.addEventListener('click',clicked);root.addEventListener('change',changed);root.addEventListener('submit',submitted);
  load().catch(fail);
  return ()=>{closed=true;root.removeEventListener('click',clicked);root.removeEventListener('change',changed);root.removeEventListener('submit',submitted);root.replaceChildren();root.classList.remove('btb-tactics');};
}
