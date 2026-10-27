/**
 * Box to Box V8 — ONE COACH MOMENT, NOT ANOTHER FORM.
 * RLS-authenticated coach-only module for embedding in the EXISTING app.
 * A note is PRIVATE on save; a separate explicit approval publishes family COPY.
 * This is not a deployable Netlify site.
 */
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const isUuid = v => typeof v==='string' && /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(v);
const validGroup = v => typeof v==='string' && v.length>=2 && v.length<=60 && !/[<>\x00-\x1f]/.test(v);
const corners = Object.freeze({technical:'Technical',physical:'Physical',psychological:'Psychological',social:'Social'});
const stages = Object.freeze({practising:'Practising',observed:'Saw it in action',demonstrated:'Demonstrated confidently'});

export function validateMoment(input={}) {
  const corner=String(input.corner??'').trim();
  const stage=String(input.stage??'').trim();
  const observation=String(input.observation??'').trim().replace(/\s+/g,' ');
  const nextFocus=String(input.nextFocus??'').trim().replace(/\s+/g,' ');
  if(!Object.hasOwn(corners,corner)) throw new Error('Choose one Four Corner development area.');
  if(!Object.hasOwn(stages,stage)) throw new Error('Choose what you genuinely noticed.');
  if(observation.length<15||observation.length>420)throw new Error('Write one genuine observation of 15–420 characters.');
  if(nextFocus && (nextFocus.length<8 || nextFocus.length>220))throw new Error('Keep the optional next focus between 8 and 220 characters.');
  return {corner,stage,observation,nextFocus:nextFocus||null};
}

export function proposedFamilyCopy(input) {
  const {corner,observation,nextFocus}=validateMoment(input);
  // Strictly a REVIEWABLE suggestion assembled from the coach's words, not new claims.
  const label={technical:'technical skills',physical:'movement',psychological:'decision-making',social:'teamwork'}[corner];
  return `A coaching moment in ${label}: ${observation}${nextFocus?' Our next focus is: '+nextFocus+'.':''}`.slice(0,800);
}

export function mountCoachQuickMoment({root,supabase,groupId,onOpenPlayer}) {
  if(!(root instanceof Element))throw new TypeError('Provide a valid coach-only page element.');
  if(!supabase?.auth?.getUser || !supabase?.from || !supabase?.rpc)throw new TypeError('Use the existing signed-in Supabase client.');
  if(!validGroup(groupId))throw new TypeError('Choose a valid assigned group.');
  let disposed=false, players=[], pending=null, saved=null, requestToken=null, busy=false;
  root.classList.add('btb-moment');
  root.innerHTML='<p role="status" class="btb-moment-loading">Loading your players…</p>';
  const status=(message,error=false)=>{
    const el=root.querySelector?.('[data-moment-status]');
    if(el){el.textContent=String(message||'').slice(0,300);el.setAttribute?.('data-error',error?'true':'false');}
    else if(error&&!disposed)root.innerHTML=`<p role="alert" class="btb-moment-error">${esc(message)}</p>`;
  };
  const read=async query=>{const r=await query;if(r.error)throw r.error;return r.data;};
  async function init(){
    const a=await supabase.auth.getUser();
    const userId=a.data?.user?.id;
    if(a.error||!isUuid(userId))throw new Error('Please sign in as a coach.');
    const prof=await read(supabase.from('profiles').select('role,groups').eq('id',userId).single());
    if(!['coach','admin'].includes(prof?.role))throw new Error('Only academy coaches can record development moments.');
    if(prof.role!=='admin'&&!(Array.isArray(prof.groups)&&prof.groups.includes(groupId)))throw new Error('This team is not assigned to your coaching account.');
    const result=await read(supabase.from('players').select('id,name').contains('groups',[groupId]).order('name').limit(100));
    if(disposed)return;
    players=(Array.isArray(result)?result:[]).filter(p=>isUuid(p.id));
    root.innerHTML=`<section class="btb-moment-card"><div class="btb-moment-kicker">BOX TO BOX · ${esc(groupId)}</div>
      <h2>One moment worth sharing.</h2><p>Choose a player, record what you genuinely noticed. That's it.</p>
      ${players.length?`<form data-moment-form>
        <label>Player<select name="player_id" required>${players.map(p=>`<option value="${esc(p.id)}">${esc(p.name||'Player')}</option>`).join('')}</select></label>
        <label>Four Corner area<select name="corner">${Object.entries(corners).map(([k,v])=>`<option value="${k}">${esc(v)}</option>`).join('')}</select></label>
        <label>What you saw<select name="stage">${Object.entries(stages).map(([k,v])=>`<option value="${k}">${esc(v)}</option>`).join('')}</select></label>
        <label>One real observation <span class="btb-moment-small">(15–420 characters)</span><textarea name="observation" rows="3" minlength="15" maxlength="420" required placeholder="Example: Checked both shoulders before receiving and moved into space to offer a passing option."></textarea></label>
        <details><summary>Optional: next focus</summary><label>What's the next coaching target?<textarea name="nextFocus" rows="2" maxlength="220" placeholder="Continue finding a useful support angle before the ball arrives."></textarea></label></details>
        <button type="submit" class="btb-moment-main">Save coaching moment</button>
      </form>`:'<p role="status">No players are assigned to this group yet. Check academy player records first.</p>'}
      <div data-moment-review></div><p role="status" aria-live="polite" data-moment-status></p>
      <small class="btb-moment-safe">Nothing goes to parents until a coach explicitly approves their copy.</small>
    </section>`;
  }
  async function submitMoment(form){
    if(busy) return;
    const f=Object.fromEntries(new FormData(form));
    if(!players.some(p=>p.id===f.player_id))throw new Error('Choose a player from your assigned group.');
    const input=validateMoment(f);
    busy=true;
    status('Saving your coaching note privately…');
    try{
      if(!requestToken && typeof crypto!=='undefined' && typeof crypto.randomUUID==='function')requestToken=crypto.randomUUID();
      const resp=await supabase.rpc('capture_academy_coach_moment',{
        p_player:f.player_id,p_corner:input.corner,p_stage:input.stage,
        p_observation:input.observation,p_next_focus:input.nextFocus,p_client_action_id:requestToken
      });
      if(resp.error)throw resp.error;
      const id=resp.data;
      if(!isUuid(id))throw new Error('Moment was not confirmed by the server. Please review before retrying.');
      if(disposed)return;
      pending={id,input};saved={id,input,playerId:f.player_id,focusSaved:false,shared:false};requestToken=null;
      const proposed=proposedFamilyCopy(input);
      root.querySelector('[data-moment-review]').innerHTML=`<section class="btb-moment-review"><h3>Coaching moment saved</h3><p>Review your words before sharing with family, or keep this note private.</p>
        <form data-moment-publish><label>Review exactly what the family will see<textarea name="parentText" rows="4" minlength="30" maxlength="800">${esc(proposed)}</textarea></label>
        <button type="submit" class="btb-moment-main">Approve family update</button>
        <button type="button" data-moment-private>Keep private</button></form></section>`;
      renderNextSteps('Saved privately. Next training focus is optional.');
      form.hidden=true;
      status('Coaching note saved. Not published to parents.');
    } finally {busy=false;}
  }
  async function publish(form){
    if(busy || !pending)return;
    const content=String(new FormData(form).get('parentText')||'').trim();
    if(content.length<30||content.length>800)throw new Error('Please review the family update (30–800 characters).');
    busy=true;status('Publishing your approved words in the parent app…');
    try{
      const r=await supabase.rpc('publish_academy_coach_moment',{p_moment:pending.id,p_family_copy:content});
      if(r.error)throw r.error;
      if(!isUuid(r.data))throw new Error('The server has not confirmed publication. Please check before retrying.');
      pending=null;
      if(saved)saved.shared=true;
      root.querySelector('[data-moment-review]').innerHTML='<div class="btb-moment-complete">Family update approved. Visible only to authorised linked family accounts; no email or push message was sent.</div>';
      renderNextSteps('Coach-approved family update is available to linked accounts.');
      status('Family update approved.');
    }finally{busy=false;}
  }
  // The coach decides whether this observation changes the NEXT target. Never
  // infer a target or silently replace an existing one.
  function nextStepsHtml(message){
    if(!saved)return '';
    const hasFocus=Boolean(saved.input.nextFocus);
    return `<section class="btb-moment-continuity" aria-label="After this coaching moment">
      <div class="btb-moment-continuity-kicker">CONNECTED PLAYER JOURNEY</div>
      <h3>One note. A clear next step.</h3><p>${esc(message)}</p>
      <div class="btb-moment-steps"><span>1. Coaching evidence saved</span><span>2. Family copy ${saved.shared?'approved':'private'}</span><span>3. Next focus ${saved.focusSaved?'set':hasFocus?'ready to set':'not added'}</span></div>
      <div class="btb-moment-buttons">
        ${hasFocus?`<button type="button" data-moment-focus ${saved.focusSaved?'disabled':''}>${saved.focusSaved?'Next target saved':'Set as next training focus'}</button>`:''}
        ${typeof onOpenPlayer==='function'?'<button type="button" data-moment-passport>Open Player Passport</button>':''}
        <button type="button" data-moment-new>Record another moment</button>
      </div><small>Next focus is coach-approved. Training plans can use this Four Corner target; automated n8n plan generation is not switched on.</small>
    </section>`;
  }
  function renderNextSteps(message){
    const old=root.querySelector('[data-moment-continuity]');if(old)old.remove();
    const area=root.querySelector('[data-moment-review]');if(!area||!saved||disposed)return;
    area.insertAdjacentHTML('afterend',`<div data-moment-continuity>${nextStepsHtml(message)}</div>`);
  }
  async function setNextFocus(){
    if(!saved||!saved.input.nextFocus||busy||saved.focusSaved)return;
    const {playerId,input}=saved;
    busy=true;status('Checking this player’s existing Four Corner target…');
    try{
      const identity=await supabase.auth.getUser();
      if(identity.error||!isUuid(identity.data?.user?.id))throw new Error('Coach session has expired. Please sign in again.');
      const previous=await supabase.from('player_corner_focus').select('target_text').eq('player_id',playerId).eq('corner',input.corner).maybeSingle();
      if(previous.error)throw previous.error;
      const old=String(previous.data?.target_text||'').trim();
      if(old===input.nextFocus){saved.focusSaved=true;renderNextSteps('This target is already set for the next session.');status('Existing target confirmed.');return;}
      if(old && !window.confirm(`Replace the current ${input.corner} target with the next focus you just recorded?\n\nCurrent: ${old.slice(0,160)}\n\nNext: ${input.nextFocus.slice(0,160)}`)){
        status('Existing target kept. Your coaching note is still saved.');return;
      }
      const result=await supabase.from('player_corner_focus').upsert({
        player_id:playerId,corner:input.corner,target_text:input.nextFocus,
        evidence_status:'focus_set',coach_observation:null,last_observed_at:null,
        updated_by:identity.data.user.id,updated_at:new Date().toISOString()
      },{onConflict:'player_id,corner'});
      if(result.error)throw result.error;
      if(disposed)return;
      saved.focusSaved=true;
      renderNextSteps('Your next training focus is saved on the Player Passport.');
      status('Next Four Corner focus saved. It is ready for session planning.');
    }finally{busy=false;}
  }
  const handler=async e=>{
    const form=e.target;
    if(!(form?.matches?.('[data-moment-form]')||form?.matches?.('[data-moment-publish]')))return;
    e.preventDefault();
    try{if(form.matches('[data-moment-form]'))await submitMoment(form);else await publish(form);}
    catch(error){status(error?.message||'Save failed. Please try again.',true);}
  };
  const click=async e=>{
    if(!root.contains(e.target))return;
    if(e.target.closest?.('[data-moment-passport]')&&saved){onOpenPlayer?.(saved.playerId);return;}
    if(e.target.closest?.('[data-moment-focus]')){
      try{await setNextFocus();}catch(error){status(error?.message||'Unable to set next focus.',true)}return;
    }
    if(e.target.closest?.('[data-moment-new]')){
      saved=null;pending=null;requestToken=null;
      const original=root.querySelector('[data-moment-form]');
      if(original){original.hidden=false;original.reset();}
      root.querySelector('[data-moment-review]')?.replaceChildren();
      root.querySelector('[data-moment-continuity]')?.remove();
      status('Ready for the next observation.');return;
    }
    const x=e.target.closest?.('[data-moment-private]');
    if(x&&root.contains(x)){
      pending=null;
      root.querySelector('[data-moment-review]').innerHTML='<div class="btb-moment-complete">Coaching note remains private. No parent update published.</div>';
      renderNextSteps('Your private observation remains in the coaching record.');
      status('Saved privately.');
    }
  };
  root.addEventListener('submit',handler);root.addEventListener('click',click);
  init().catch(e=>{if(!disposed)status(e.message,true)});
  return ()=>{disposed=true;root.removeEventListener('submit',handler);root.removeEventListener('click',click);root.replaceChildren();root.classList.remove('btb-moment');};
}
