/**
 * Box to Box — Team Session DNA
 * Embeds into the existing *authenticated* Coaching App; no API keys embedded.
 * Sessions are private draft suggestions built from recorded Four Corner data.
 * Team leads/director edit and approve through an authorised Supabase RPC.
 */
const esc=(value)=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const tidy=(value,max)=>String(value??'').trim().slice(0,max);
const isGroup=(value)=>typeof value==='string' && value.length>=2 && value.length<=60 && !/[\u0000-\u001f<>]/.test(value);
export function validateTeamSessionDraft({objective,segments,observationPrompt}){
  if(objective.length<20||objective.length>500)throw new Error('Provide a clear 20–500 character coaching objective.');
  if(observationPrompt.length<15||observationPrompt.length>400)throw new Error('Provide a 15–400 character learning observation question.');
  if(!Array.isArray(segments)||segments.length<2||segments.length>8)throw new Error('Include 2–8 active practice blocks.');
  let total=0;
  for(const s of segments){
    if(!Number.isInteger(s.minutes)||s.minutes<1||s.minutes>45)throw new Error('Each activity requires 1–45 minutes.');
    if(s.activity.length<5||s.activity.length>160||s.coach_cue.length<10||s.coach_cue.length>350)throw new Error('Each activity needs a descriptive title and coaching cue.');
    total+=s.minutes;
  }
  if(total<30||total>120)throw new Error('Total session length must be 30–120 minutes.');
  return total;
}
export function mountTeamSessionDNA({root,supabase,groupId}){
  if(!(root instanceof Element))throw new TypeError('Supply a valid mount element.');
  if(!supabase?.auth?.getUser||!supabase?.from||!supabase?.rpc)throw new TypeError('Use the existing signed-in Supabase client.');
  if(!isGroup(groupId))throw new Error('A valid academy group code is required.');
  let disposed=false,waiting=false,records=[];
  root.classList.add('btb-team-dna');
  root.innerHTML='<section class="btb-team-card">Loading your group training plans…</section>';
  const notify=(message,isError=false)=>{
    const el=root.querySelector('[data-team-dna-status]');
    if(el){el.textContent=message;el.setAttribute('role',isError?'alert':'status');el.classList.toggle('btb-team-error',isError);}
  };
  async function refresh(){
    const auth=await supabase.auth.getUser();
    if(auth.error||!auth.data?.user?.id)throw new Error('Sign in to see group coaching plans.');
    const profile=await supabase.from('profiles').select('role').eq('id',auth.data.user.id).single();
    if(profile.error)throw profile.error;
    if(!['coach','admin'].includes(profile.data?.role))throw new Error('Group coaching plans are restricted to coaching staff.');
    const res=await supabase.from('academy_group_session_briefs')
      .select('id,group_id,week_of,roster_size,four_corner_targets,evidence_basis,focus_corner,title,coach_objective,segments,observation_prompt,status,match_context')
      .eq('group_id',groupId).order('week_of',{ascending:false}).limit(4);
    if(res.error)throw res.error;
    records=res.data||[];
    if(!disposed)paint();
  }
  function segmentFields(segments){
    return (Array.isArray(segments)?segments:[]).map((segment,i)=>`<fieldset class="btb-team-block">
       <legend>Practice ${i+1}</legend>
       <label>Minutes<input type="number" min="1" max="45" step="1" name="minutes_${i}" value="${esc(segment.minutes)}" required></label>
       <label>Activity<input name="activity_${i}" maxlength="160" minlength="5" value="${esc(segment.activity)}" required></label>
       <label>Coach's cue<textarea rows="2" name="cue_${i}" maxlength="350" minlength="10" required>${esc(segment.coach_cue)}</textarea></label>
    </fieldset>`).join('');
  }
  function card(row){
    const blocks=Array.isArray(row.segments)?row.segments:[];
    const basis=row.evidence_basis==='baseline_discovery'
      ? 'Baseline discovery — not an assessment of ability'
      : 'Based on recorded coaching priorities';
    const fixtures=row.match_context?.kickoff
      ? `<p class="btb-team-muted">Upcoming fixture context: ${esc(new Date(row.match_context.kickoff).toLocaleString('en-GB',{dateStyle:'medium',timeStyle:'short'}))}. Confirm with the league.</p>`
      : '';
    return `<article class="btb-team-card"><div class="btb-team-head"><div><span class="btb-team-kicker">WEEK OF ${esc(row.week_of)}</span><h3>${esc(row.title)}</h3></div><span class="btb-team-pill">${esc(row.status)}</span></div>
      <p class="btb-team-muted">${esc(basis)} · ${esc(row.focus_corner)} · ${esc(row.roster_size)} players on the group roster · ${esc(row.four_corner_targets)} recorded Four Corner targets. Roster count is not confirmed attendance.</p>
      ${fixtures}
      ${row.status==='draft'?`<div class="btb-team-simple"><p class="btb-team-focus"><strong>Today's focus:</strong> ${esc(row.coach_objective)}</p><ol class="btb-team-preview">${blocks.map(b=>`<li><b>${esc(b.minutes)} min</b> — ${esc(b.activity)}</li>`).join('')}</ol></div>
      <details class="btb-team-edit"><summary>Review & approve this plan <small>Edit only if needed</small></summary>
      <form data-team-form="${esc(row.id)}"><label>Development objective<textarea name="objective" minlength="20" maxlength="500" required>${esc(row.coach_objective)}</textarea></label>
      <div class="btb-team-blocks">${segmentFields(blocks)}</div>
      <label>What will we observe?<textarea name="observation" minlength="15" maxlength="400" required>${esc(row.observation_prompt)}</textarea></label>
      <p class="btb-team-muted">Lead coach or director approval required. Training plans stay private until approved.</p>
      <div class="btb-team-actions"><button type="submit" name="intent" value="save">Save draft</button><button type="submit" name="intent" value="approve">Approve training plan</button></div></form></details>`:
      `<p>${esc(row.coach_objective)}</p><ol>${blocks.map(b=>`<li>${esc(b.minutes)} min — ${esc(b.activity)}. ${esc(b.coach_cue)}</li>`).join('')}</ol><p><strong>Coaching evidence prompt:</strong> ${esc(row.observation_prompt)}</p>`}
     </article>`;
  }
  function paint(){
    root.innerHTML=`<header class="btb-team-header"><span>BOX TO BOX · TEAM SESSION DNA</span><h2>${esc(groupId)} Coaching Intelligence</h2><p>Coaching-first session suggestions from real Four Corner priorities. Every plan needs a human review.</p></header>
      <div data-team-dna-status aria-live="polite"></div>
      ${records.length?card(records[0])+(records.length>1?`<details class="btb-team-history"><summary>Older training plans <small>${records.length-1} previous</small></summary>${records.slice(1).map(card).join('')}</details>`:''):'<section class="btb-team-card"><p>No group sessions have been drafted yet. Your director can prepare a session plan; you do not need to open n8n.</p></section>'}`;
  }
  async function submit(event){
    const form=event.target.closest?.('[data-team-form]');
    if(!form||!root.contains(form)||disposed)return;
    event.preventDefault();if(waiting)return;
    const brief=records.find(row=>row.id===form.dataset.teamForm&&row.status==='draft');
    if(!brief){notify('This training plan is not editable.',true);return;}
    const get=name=>tidy(form.elements.namedItem(name)?.value,600);
    const segments=(Array.isArray(brief.segments)?brief.segments:[]).map((_,i)=>({
       minutes:Number(get('minutes_'+i)),activity:get('activity_'+i),coach_cue:get('cue_'+i)}));
    const objective=get('objective'),observationPrompt=get('observation');
    let total;
    try{total=validateTeamSessionDraft({objective,segments,observationPrompt});}
    catch(error){notify(error.message,true);return;}
    const approve=event.submitter?.value==='approve';
    waiting=true;root.setAttribute('aria-busy','true');
    try{
      const res=await supabase.rpc('review_academy_group_session_brief',{
       p_brief:brief.id,p_objective:objective,p_segments:segments,
       p_observation_prompt:observationPrompt,p_approve:approve});
      if(res.error)throw res.error;
      if(disposed)return;
      await refresh();notify(approve?`Approved ${total}-minute group session. Coaches can now use the plan.`:'Private coaching draft saved.');
    }catch(error){if(!disposed)notify(tidy(error.message||'Could not save this group plan.',280),true);}
    finally{waiting=false;root.removeAttribute('aria-busy');}
  }
  root.addEventListener('submit',submit);
  refresh().catch(err=>{if(!disposed){root.innerHTML='<section class="btb-team-card"><div data-team-dna-status role="alert"></div></section>';notify(tidy(err.message||'Unable to load team plans',220),true);}});
  return ()=>{disposed=true;root.removeEventListener('submit',submit);root.innerHTML='';root.classList.remove('btb-team-dna');};
}
