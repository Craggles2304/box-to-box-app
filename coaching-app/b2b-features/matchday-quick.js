/**
 * Box to Box V7 — matchday in under a minute.
 * Embed in the existing authenticated COACH app. This does NOT publish anything.
 * Supabase RLS and the server-side RPC own every access decision.
 */
const html = value => String(value ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const validGroup = x => typeof x==='string' && x.length>=2 && x.length<=60 && !/[\x00-\x1f<>]/.test(x);
const validFixture = x => typeof x==='string' && x.length>=1 && x.length<=250 && !/[\x00-\x1f<>]/.test(x);
const phases = Object.freeze({with_ball:'With the ball',without_ball:'Without the ball',transition:'Changing possession',set_piece:'Set pieces'});
const getRows = async query => {const res=await query;if(res.error)throw res.error;return res.data??[];};

export function selectMatchdayFocus(cards, now=new Date()) {
  const ts=now.getTime();if(!Number.isFinite(ts))throw new RangeError('Invalid current time');
  const entries=(Array.isArray(cards)?cards:[]).filter(x=>validFixture(x.fixture_id)&&Number.isFinite(new Date(x.kickoff).getTime()));
  const post=entries.filter(x=>Date.parse(x.kickoff)<=ts-45*60*1000 && !x.reviewed_at && Date.parse(x.kickoff)>ts-14*86400000)
    .sort((a,b)=>Date.parse(b.kickoff)-Date.parse(a.kickoff));
  if(post.length)return {mode:'reflect',card:post[0]};
  const upcoming=entries.filter(x=>Date.parse(x.kickoff)>ts-45*60*1000).sort((a,b)=>Date.parse(a.kickoff)-Date.parse(b.kickoff));
  if(upcoming.length)return {mode:'prepare',card:upcoming[0]};
  const reviewed=entries.filter(x=>x.reviewed_at).sort((a,b)=>Date.parse(b.kickoff)-Date.parse(a.kickoff));
  if(reviewed.length)return {mode:'complete',card:reviewed[0]};
  return {mode:'empty',card:null};
}

export function extractActualTacticalCues(matchPlan){
  const x=matchPlan?.tactics?.coach_simple;
  if(!matchPlan?.published||!x||typeof x!=='object')return [];
  return [['With the ball',x.with_ball],['Without the ball',x.without_ball],['Transitions',x.transition]]
    .filter(([,v])=>typeof v==='string'&&v.trim().length>0).map(([title,value])=>({title,text:value.trim().slice(0,280)}));
}

export function validateCoachMatchReview({phase,observation,nextFocus}) {
  const ob=String(observation||'').trim();const nx=String(nextFocus||'').trim();
  if(!Object.hasOwn(phases,phase))throw new Error('Choose which part of the match you observed.');
  if(ob.length<15 || ob.length>500)throw new Error('Write a genuine observation (15–500 characters).');
  if(nx.length<10 || nx.length>300)throw new Error('Choose one next coaching focus (10–300 characters).');
  return {phase,observation:ob,nextFocus:nx};
}

export function mountCoachMatchday({root,supabase,groupId,onOpenTactics}){
  if(!(root instanceof Element)||!supabase?.auth?.getUser||!supabase?.from||!supabase?.rpc||!validGroup(groupId))
    throw new TypeError('An authorised coach, team and existing Supabase client are required.');
  let destroyed=false,focused=null,matchPlan=null,lead=false,reporting=false;
  root.classList.add('btb-matchday-quick');
  root.innerHTML='<p role="status">Loading your team’s matchday...</p>';
  async function load(){
    const a=await supabase.auth.getUser();if(a.error||!a.data?.user?.id)throw new Error('Sign in as a coach.');
    const p=await supabase.from('profiles').select('role,groups').eq('id',a.data.user.id).single();
    if(p.error)throw p.error;
    if(!['admin','coach'].includes(p.data?.role) || (p.data.role!=='admin'&&!p.data.groups?.includes(groupId)))
      throw new Error('This team is not assigned to your coaching account.');
    const [cards,canLead]=await Promise.all([
      getRows(supabase.from('academy_matchday_coach_cards').select('fixture_id,group_id,kickoff,match_plan_id,formation,match_focus,reviewed_at,drafted_parent_update_id').eq('group_id',groupId).order('kickoff',{ascending:false}).limit(20)),
      supabase.rpc('is_lead',{g:groupId})
    ]);
    if(canLead.error)throw canLead.error;
    lead=!!canLead.data;
    focused=selectMatchdayFocus(cards);matchPlan=null;
    if(focused.card?.match_plan_id){
      const q=await supabase.from('match_plans').select('id,formation,published,tactics').eq('id',focused.card.match_plan_id).maybeSingle();
      if(q.error)throw q.error;matchPlan=q.data;
    }
    if(!destroyed)draw();
  }
  function draw(message=''){
    if(!focused)return;
    const {mode,card}=focused;
    const date=card&&new Date(card.kickoff);
    const dateText=date&&!Number.isNaN(date.getTime())?date.toLocaleString('en-GB',{timeZone:'Europe/London',weekday:'short',day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}):'';
    const cues=extractActualTacticalCues(matchPlan);
    const noPlan=!matchPlan?.published;
    const content=mode==='empty'?'<p>No upcoming fixtures in your team’s matchday queue yet.</p>':
      `<div class="btb-mq-meta"><span>${html(groupId)}</span><span>${html(dateText)} (UK)</span><span>${mode==='reflect'?'Match review due':mode==='complete'?'Review saved':'Upcoming fixture'}</span></div>
       <h3>${mode==='prepare'?'Your next match':mode==='reflect'?'What did we learn?':'Match learning recorded'}</h3>
       <p class="btb-mq-focus">${html(card.match_focus||'Your next team development focus will appear here.')}</p>
       <div class="btb-mq-tactics"><div><strong>${html(matchPlan?.formation||card.formation||'Formation not confirmed')}</strong><small>Current approved tactical plan ${noPlan?'not found':'available'}</small></div>
        ${typeof onOpenTactics==='function'?'<button type="button" data-action="tactics">Open tactics →</button>':''}</div>
       ${cues.length?`<details><summary>3 key tactical cues (${cues.length} available)</summary>${cues.map(c=>`<p><b>${html(c.title)}:</b> ${html(c.text)}</p>`).join('')}</details>`:''}
       ${mode==='reflect'?(lead?`<form data-review>
        <label>1 · What did you focus on?<select name="phase" required>${Object.entries(phases).map(([k,v])=>`<option value="${k}">${html(v)}</option>`).join('')}</select></label>
        <label>2 · One thing we genuinely observed<textarea name="observation" maxlength="500" minlength="15" required placeholder="Example: We scanned before receiving more often in the second half."></textarea></label>
        <label>3 · One focus for next training<textarea name="nextFocus" maxlength="300" minlength="10" required placeholder="Example: First touch away from pressure before passing."></textarea></label>
        <label class="btb-mq-check"><input name="parentDraft" type="checkbox" checked> Prepare a private parent update draft (not published)</label>
        <button class="btb-mq-primary" type="submit">Save coaching reflection →</button></form>`:'<p>Only the group lead or director can record the final match reflection.</p>'):''}
       ${mode==='prepare'?'<p class="btb-mq-tip">Before kickoff: check your formation and one useful coaching focus. After the game: record what really happened.</p>':''}
       ${mode==='complete'?'<p class="btb-mq-tip">Coach review saved. Parent communication requires a separate approval inside the team page.</p>':''}`;
    root.innerHTML=`<section class="btb-mq-shell"><header><small>BOX TO BOX · MATCHDAY SIMPLE MODE</small><h2>Coach the game. Two notes afterwards.</h2></header>${content}<p data-status role="status" aria-live="polite">${html(message)}</p></section>`;
  }
  function click(e){const b=e.target.closest?.('[data-action="tactics"]');if(b&&root.contains(b)&&typeof onOpenTactics==='function')onOpenTactics(groupId);}
  async function submit(e){const form=e.target;if(!form.matches('form[data-review]')||!root.contains(form))return;
    e.preventDefault();if(reporting||focused?.mode!=='reflect'||!lead)return;
    const data=new FormData(form);const status=root.querySelector('[data-status]');
    let v;try{v=validateCoachMatchReview({phase:data.get('phase'),observation:data.get('observation'),nextFocus:data.get('nextFocus')});}
    catch(err){if(status)status.textContent=err.message;return;}
    reporting=true;const button=form.querySelector('button[type="submit"]');button.disabled=true;
    try{
      const result=await supabase.rpc('record_academy_matchday_learning',{
        p_fixture:focused.card.fixture_id,p_phase:v.phase,p_observation:v.observation,
        p_next_focus:v.nextFocus,p_make_parent_draft:data.get('parentDraft')==='on'
      });
      if(result.error)throw result.error;
      await load();
      if(!destroyed){const s=root.querySelector('[data-status]');if(s)s.textContent=result.data?.private_parent_draft_prepared?'Review saved. Parent draft ready for lead approval.':'Review saved. No parent update published.';}
    }catch(err){if(!destroyed){const s=root.querySelector('[data-status]');if(s)s.textContent=String(err.message||err).slice(0,240);}}
    finally{reporting=false;if(button.isConnected)button.disabled=false;}
  }
  root.addEventListener('click',click);root.addEventListener('submit',submit);load().catch(err=>{if(!destroyed)root.innerHTML=`<p class="btb-mq-error" role="alert">${html(err.message||err)}</p>`;});
  return ()=>{destroyed=true;root.removeEventListener('click',click);root.removeEventListener('submit',submit);root.replaceChildren();root.classList.remove('btb-matchday-quick');};
}
