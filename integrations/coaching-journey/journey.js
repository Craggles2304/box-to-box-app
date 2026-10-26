/**
 * Box to Box — Coach-Approved Player Journey
 * Dependency: a pre-existing, authenticated supabase-js v2 client passed by host app.
 * No keys, credentials, auth sessions or student records are stored locally.
 *
 * Use: import { mountPlayerJourney } from './journey.js';
 *      const dispose = mountPlayerJourney({ root, supabase: existingClient, playerId });
 *      // call dispose() when leaving player screen.
 */
const CORNERS = Object.freeze({
  technical: ['Technical', 'Ball mastery, scanning and football decisions'],
  physical: ['Physical', 'Age-appropriate movement and coordination'],
  psychological: ['Psychological', 'Confidence, resilience and concentration'],
  social: ['Social', 'Communication, teamwork and leadership'],
});
export const FOUR_CORNERS = Object.freeze(Object.keys(CORNERS));
const esc = (x) => String(x ?? '').replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const date = (x) => x ? new Date(x).toLocaleDateString('en-GB', {day:'numeric',month:'short',year:'numeric'}) : 'Not yet';
const errText = (err) => err?.message ? String(err.message).slice(0,240) : 'Could not complete that action.';
const neat = (x, max) => String(x ?? '').trim().slice(0,max);
const $ = (el,sel) => el.querySelector(sel);
function list(res) {
  if (res.error) throw res.error;
  return res.data ?? [];
}
async function who(sb) {
  const auth = await sb.auth.getUser();
  if (auth.error || !auth.data?.user?.id) throw new Error('Please sign in to the Box to Box Coaching App.');
  const user = auth.data.user;
  const result = await sb.from('profiles').select('role').eq('id',user.id).single();
  if (result.error) throw result.error;
  return { id:user.id, role:result.data?.role };
}
function empty(label) { return `<p class="btb-empty">${esc(label)}</p>`; }
function badge(value) {return `<span class="btb-badge">${esc(value)}</span>`;}

export function mountPlayerJourney({root,supabase,playerId}) {
  if (!(root instanceof Element)) throw new TypeError('root must be a DOM element');
  if (!supabase?.auth?.getUser || !supabase?.from || !supabase?.rpc) throw new TypeError('Provide your existing supabase-js v2 client');
  if (typeof playerId !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(playerId)) throw new Error('Valid playerId required');
  let closed=false, busy=false, current=null, name='', focused=null;
  root.classList.add('btb-journey');
  root.innerHTML='<div class="btb-panel" role="status">Loading Player Journey…</div>';
  const status = (text,problem=false)=>{
    const s=$(root,'[data-journey-status]');
    if(s){s.textContent=text;s.setAttribute('role',problem?'alert':'status');s.classList.toggle('btb-error',problem);}
  };
  const run=async (fn,success='Changes saved.')=>{
    if(closed||busy) return;
    busy=true;root.setAttribute('aria-busy','true');
    try{await fn(); if(!closed){await draw();status(success);}}
    catch(e){if(!closed)status(errText(e),true)}
    finally{busy=false;root.removeAttribute('aria-busy')}
  };
  async function player() {
    const r=await supabase.from('players').select('id,name').eq('id',playerId).maybeSingle();
    if(r.error)throw r.error;
    if(!r.data)throw new Error('This player is not available to your account.');
    name=neat(r.data.name,60);
  }
  async function get(table,cols,extras) {
    let query=supabase.from(table).select(cols).eq('player_id',playerId);
    if(extras)query=extras(query);
    return list(await query);
  }
  const heading=(text,body)=>`<section class="btb-panel"><h3>${esc(text)}</h3>${body}</section>`;
  function cornersForm(rows) {
    const found=Object.fromEntries(rows.map(r=>[r.corner,r]));
    return heading('The Four Corner Model',`<p class="btb-intro">One current target in each corner. Coaches choose what to work on; AI does not grade children.</p><div class="btb-grid">${FOUR_CORNERS.map(key=>{
      const row=found[key];return `<form class="btb-corner" data-form="corner" data-corner="${key}">
        <div class="btb-top"><b>${CORNERS[key][0]}</b>${row?badge(row.evidence_status.replaceAll('_',' ')):badge('Set focus')}</div>
        <small>${CORNERS[key][1]}</small>
        <label>Current target<textarea name="target" required minlength="5" maxlength="240" rows="2">${esc(row?.target_text)}</textarea></label>
        <label>Coach evidence<textarea name="evidence" maxlength="500" rows="2">${esc(row?.coach_observation)}</textarea></label>
        <label>Learning stage<select name="stage">${['focus_set','practising','observed','demonstrated'].map(x=>`<option value="${x}" ${row?.evidence_status===x?'selected':''}>${x.replaceAll('_',' ')}</option>`).join('')}</select></label>
        <button type="submit" class="btb-btn">Save ${CORNERS[key][0]}</button>
      </form>`;}).join('')}</div>`);
  }
  function draftsForm(rows) {
    return heading('Coach approval · Parent progress',`<p class="btb-intro">Only you or an authorised coach can publish a parent-facing update. Nothing goes live until approval.</p>${rows.length?rows.map(d=>
      `<form class="btb-review" data-form="approve" data-draft="${esc(d.id)}">
        <div class="btb-top"><b>Draft created ${date(d.created_at)}</b>${badge(d.status)}</div>
        <label>What parents will read<textarea name="text" required minlength="20" maxlength="1200" rows="4">${esc(d.draft_text)}</textarea></label>
        <label>At-home activity<textarea name="home" required minlength="10" maxlength="300" rows="2">${esc(d.suggested_home_activity)}</textarea></label>
        <div class="btb-actions"><button class="btb-btn" type="submit">Approve & publish</button><button class="btb-btn btb-outline" type="button" data-action="reject" data-draft="${esc(d.id)}">Reject draft</button></div>
      </form>`).join(''):empty('No parent updates awaiting coach approval.')}`);
  }
  function plansForm(rows) {
    return heading('Personalised session plans',`<p class="btb-intro">Suggestions reflect the Four Corner focus. Check suitability and adapt coaching detail before sharing.</p>${rows.length?rows.map(p=>`<article class="btb-review">
      <div class="btb-top"><b>${esc(p.plan_title)}</b>${badge(p.corner)}</div><p><strong>Player focus:</strong> ${esc(p.player_goal)}</p>
      <ol>${(Array.isArray(p.session_structure)?p.session_structure:[]).map(st=>`<li>${esc(st.minutes)} min — ${esc(st.task)}</li>`).join('')}</ol>
      <small>${esc((p.coach_cues||[]).join(' · '))}</small>
      ${p.status==='draft'?`<button class="btb-btn" data-action="approve-plan" data-plan="${esc(p.id)}" data-owner="${esc(p.coach_id)}">Approve coaching plan</button>`:''}
    </article>`).join(''):empty('No training recommendations yet. Set or update a Four Corner target first.')}`);
  }
  function missionReview(suggestions,missions,catalog) {
    const map=new Map(catalog.map(c=>[c.code,c]));
    return heading('Missions & evidence',`<p class="btb-intro">Suggestions need a coach to accept them. Only coach-verified missions count towards personal XP.</p>
    <div class="btb-grid">${suggestions.map(s=>`<article class="btb-review"><b>${esc(map.get(s.mission_code)?.title||s.mission_code)}</b><p>${esc(map.get(s.mission_code)?.task||'')}</p><button class="btb-btn" data-action="accept-mission" data-id="${esc(s.id)}">Assign mission</button></article>`).join('')||empty('No suggested missions.')}</div>
    ${missions.filter(m=>m.status!=='coach_verified').map(m=>`<form class="btb-review" data-form="verify-mission" data-id="${esc(m.id)}"><b>${esc(map.get(m.mission_code)?.title||m.mission_code)}</b><label>Coach observation / evidence<textarea required minlength="10" maxlength="420" name="evidence" rows="2"></textarea></label><button class="btb-btn">Verify mission evidence</button></form>`).join('')}`);
  }
  function parentView(updates,home,missions,catalog,groups,existingInterest,targets,plans,reflections) {
    const map=new Map(catalog.map(c=>[c.code,c]));const interested=new Set(existingInterest.map(x=>x.group_id));
    const reflectionDates=new Map((reflections||[]).map(x=>[x.challenge_id,x.created_at]));
    const xp=missions.filter(m=>m.status==='coach_verified').reduce((sum,m)=>sum+(Number(map.get(m.mission_code)?.xp_points)||0),0);
    const corners=heading('Your child’s development',`<p class="btb-intro">Progress is based on your child's coaching journey, not comparisons with other children.</p><div class="btb-grid">${FOUR_CORNERS.map(c=>{
      const row=targets.find(r=>r.corner===c);return `<div class="btb-corner"><b>${CORNERS[c][0]}</b><p>${esc(row?.target_text||'Coach target to be agreed')}</p>${badge(row?.evidence_status?.replaceAll('_',' ')||'Not set')}</div>`;}).join('')}</div>`);
    const feed=heading('Approved coach updates',updates.length?updates.map(u=>`<article class="btb-review"><small>${date(u.published_at)}</small><p>${esc(u.approved_text)}</p><div class="btb-home">🏠 <b>Try at home:</b> ${esc(u.home_activity)}</div></article>`).join(''):empty('Your coach has not approved an update yet.'));
    const challenges=heading('Home challenges',home.length?home.map(c=>`<article class="btb-review"><p>${esc(c.challenge_text)}</p>${reflectionDates.has(c.id)?`<div class="btb-done">✓ Reflection shared ${date(reflectionDates.get(c.id))}</div>`:`<form data-form="reflection" data-challenge="${esc(c.id)}"><label>How did it go? (Optional)<textarea maxlength="320" minlength="2" rows="2" name="reflection" required></textarea></label><button class="btb-btn btb-outline">Share reflection</button></form>`}</article>`).join(''):empty('Your next optional challenge will appear after an approved coach update.'));
    const missionPanel=heading('My football missions',`<p class="btb-intro">${xp} personal XP earned through coach-verified learning.</p>${missions.length?missions.map(m=>`<article class="btb-review"><div class="btb-top"><b>${esc(map.get(m.mission_code)?.title||m.mission_code)}</b>${badge(m.status.replaceAll('_',' '))}</div><p>${esc(map.get(m.mission_code)?.task||'')}</p></article>`).join(''):empty('Your coach has not assigned a mission yet.')}`);
    const plansPanel=heading('Your coaching plan',plans.length?plans.map(p=>`<article class="btb-review"><b>${esc(p.plan_title)}</b><p>${esc(p.player_goal)}</p></article>`).join(''):empty('Your coach will share a plan when it is ready.'));
    const performance=heading('Performance Hub · Optional small groups',`<p class="btb-intro">Five-player groups, matched to development needs. Express interest only if your family would like details.</p>${groups.length?groups.map(g=>`<article class="btb-review"><b>${esc(g.group_name)}</b><p>${esc(g.session_notes||'Small-group development coaching')} · Maximum ${esc(g.capacity)} players.</p><button class="btb-btn btb-outline" data-action="interest" data-group="${esc(g.id)}" ${interested.has(g.id)?'disabled':''}>${interested.has(g.id)?'Interest registered':'Request information'}</button></article>`).join(''):empty('No Performance Hub groups are currently open.')}`);
    return [corners,feed,challenges,missionPanel,plansPanel,performance].join('');
  }
  async function draw(){
    if(closed) return;
    current=await who(supabase);
    await player();
    const staff=['admin','coach'].includes(current.role);
    const requests=staff?
      [get('player_corner_focus','corner,target_text,evidence_status,coach_observation,updated_at'),
       get('passport_update_drafts','id,status,draft_text,suggested_home_activity,created_at',q=>q.eq('status','draft').order('created_at',{ascending:false}).limit(15)),
       get('player_training_recommendations','id,plan_title,corner,player_goal,coach_id,session_structure,coach_cues,status,created_at',q=>q.in('status',['draft','approved']).order('created_at',{ascending:false}).limit(12)),
       get('player_mission_suggestions','id,mission_code,status',q=>q.eq('status','suggested')),
       get('player_missions','id,mission_code,status'),
       Promise.resolve(supabase.from('academy_mission_catalog').select('code,title,task,xp_points').eq('active',true)).then(list)]
     : [get('passport_parent_updates','id,approved_text,home_activity,published_at',q=>q.order('published_at',{ascending:false}).limit(20)),
        get('player_home_challenges','id,challenge_text,created_at',q=>q.order('created_at',{ascending:false}).limit(12)),
        get('player_missions','id,mission_code,status'),
        Promise.resolve(supabase.from('academy_mission_catalog').select('code,title,task,xp_points').eq('active',true)).then(list),
        Promise.resolve(supabase.from('performance_hub_groups').select('id,group_name,session_notes,capacity,status').eq('status','open')).then(list),
        get('performance_hub_interest','group_id',q=>q.eq('requested_by',current.id)),
        Promise.resolve(supabase.rpc('family_four_corner_focus',{p_player:playerId})).then(list),
        get('player_training_recommendations','plan_title,player_goal,corner,status',q=>q.eq('status','approved').limit(10)),
        get('player_home_challenge_reflections','challenge_id,created_at',q=>q.eq('submitted_by',current.id).order('created_at',{ascending:false}).limit(100))];
    const data=await Promise.all(requests);
    if(closed) return;
    const body=staff?
      [cornersForm(data[0]),draftsForm(data[1]),plansForm(data[2]),missionReview(data[3],data[4],data[5])].join('')
      : parentView(...data);
    root.innerHTML=`<div class="btb-header"><div><small>BOX TO BOX ACADEMY · PLAYER JOURNEY</small><h2>${esc(name)}</h2></div><span class="btb-role">${staff?'COACH VIEW':'FAMILY VIEW'}</span></div><div class="btb-flash" data-journey-status role="status" aria-live="polite"></div>${body}`;
    if(focused) {const node=$(root,focused);if(node)node.focus();focused=null;}
  }
  const submit=async(ev)=>{
    const form=ev.target.closest('form[data-form]');if(!form||!root.contains(form))return;
    ev.preventDefault();const type=form.dataset.form;
    if(type==='approve' && typeof window!=='undefined' && !window.confirm('Publish this coach-reviewed progress update to the child’s authorised family?'))return;
    await run(async()=>{
      if(['corner','approve','verify-mission'].includes(type)&&!['admin','coach'].includes(current?.role))throw new Error('Coach access required.');
      if(type==='corner'){
        const corner=form.dataset.corner;
        if(!FOUR_CORNERS.includes(corner))throw new Error('Invalid development corner.');
        const target=neat(form.elements.target.value,240),observation=neat(form.elements.evidence.value,500),stage=form.elements.stage.value;
        if(target.length<5)throw new Error('Please enter a coaching target.');
        if(!['focus_set','practising','observed','demonstrated'].includes(stage))throw new Error('Invalid coaching stage.');
        if(['observed','demonstrated'].includes(stage)&&observation.length<10)throw new Error('Add a specific coach observation before marking progress.');
        const value={player_id:playerId,corner,target_text:target,coach_observation:observation||null,evidence_status:stage,
          last_observed_at:['observed','demonstrated'].includes(stage)?new Date().toISOString():null,
          updated_by:current.id,updated_at:new Date().toISOString()};
        const r=await supabase.from('player_corner_focus').upsert(value,{onConflict:'player_id,corner'});if(r.error)throw r.error;
      }else if(type==='approve'){
        const t=neat(form.elements.text.value,1200),h=neat(form.elements.home.value,300);
        if(t.length<20||h.length<10)throw new Error('Review the summary and home activity before approval.');
        const r=await supabase.rpc('approve_passport_parent_draft',{p_draft:form.dataset.draft,p_approved_text:t,p_home_activity:h});if(r.error)throw r.error;
      }else if(type==='verify-mission'){
        const evidence=neat(form.elements.evidence.value,420);
        if(evidence.length<10)throw new Error('Add coach-observed evidence.');
        const r=await supabase.rpc('verify_player_mission',{p_mission:form.dataset.id,p_evidence:evidence});if(r.error)throw r.error;
      }else if(type==='reflection'){
        const reflection=neat(form.elements.reflection.value,320);
        if(reflection.length<2)throw new Error('Please enter a short reflection.');
        const r=await supabase.from('player_home_challenge_reflections').insert({challenge_id:form.dataset.challenge,player_id:playerId,submitted_by:current.id,reflection});if(r.error)throw r.error;
      }
    },type==='corner'?'Four Corner focus saved.':type==='approve'?'Approved progress update published.':type==='verify-mission'?'Mission evidence verified.':'Reflection shared.');
  };
  const click=async(ev)=>{
    const button=ev.target.closest('[data-action]');if(!button||!root.contains(button))return;
    const action=button.dataset.action;
    if(action==='interest' && !window.confirm('Do you want to register interest in this optional small-group session? This does not book or charge anything.'))return;
    if(action==='reject' && !window.confirm('Reject this parent progress draft?'))return;
    await run(async()=>{
      if(['reject','approve-plan','accept-mission'].includes(action)&&!['admin','coach'].includes(current?.role))throw new Error('Coach access required.');
      if(action==='reject'){
        const r=await supabase.rpc('reject_passport_parent_draft',{p_draft:button.dataset.draft});if(r.error)throw r.error;
      }else if(action==='approve-plan'){
        if(button.dataset.owner!==current.id && current.role!=='admin')throw new Error('The coach who created this plan must approve it.');
        let query=supabase.from('player_training_recommendations').update({status:'approved',approved_at:new Date().toISOString()})
          .eq('id',button.dataset.plan).eq('player_id',playerId).eq('status','draft');
        if(current.role!=='admin')query=query.eq('coach_id',current.id);
        const r=await query.select('id');
        if(r.error)throw r.error;if(r.data?.length!==1)throw new Error('Plan was not approved; please refresh and check permissions.');
      }else if(action==='accept-mission'){
        const r=await supabase.rpc('accept_player_mission_suggestion',{p_suggestion:button.dataset.id});if(r.error)throw r.error;
      }else if(action==='interest'){
        if(!['parent'].includes(current?.role))throw new Error('A guardian account is required to request information.');
        const r=await supabase.from('performance_hub_interest').insert({player_id:playerId,group_id:button.dataset.group,requested_by:current.id,parent_opt_in:true,status:'interested'});
        if(r.error)throw r.error;
      }
    },action==='reject'?'Parent draft rejected.':action==='approve-plan'?'Training plan approved.':action==='accept-mission'?'Mission assigned.':'Interest registered without booking or payment.');
  };
  root.addEventListener('submit',submit);
  root.addEventListener('click',click);
  draw().catch(e=>{if(!closed)root.innerHTML=`<div class="btb-panel btb-error" role="alert">${esc(errText(e))}</div>`;});
  return ()=>{closed=true;root.removeEventListener('submit',submit);root.removeEventListener('click',click);root.replaceChildren();};
}