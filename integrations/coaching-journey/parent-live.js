/** Box to Box V6 — a truthful parent journey feed and a 30-second coach approval.
 * No notifications, invented claims, private tactics or unapproved stories.
 * Works alongside existing Player Journey/Passport, never replaces it.
 */
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const uuid=v=>typeof v==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
const group=v=>typeof v==='string'&&v.length>=2&&v.length<=60&&!/[<>\x00-\x1f]/.test(v);
const kinds=Object.freeze({upcoming_focus:'Coming up',session_learning:'This week in training',match_learning:'Learning from matchday'});
export function currentWeekLondon(now=new Date()) {
  const parts=new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/London',year:'numeric',month:'2-digit',day:'2-digit',weekday:'short'}).formatToParts(now);
  const m=Object.fromEntries(parts.map(p=>[p.type,p.value]));
  const d=new Date(Date.UTC(Number(m.year),Number(m.month)-1,Number(m.day)));
  const offset=(d.getUTCDay()+6)%7;d.setUTCDate(d.getUTCDate()-offset);
  return d.toISOString().slice(0,10);
}
export function mergeFamilyMoments(teamRows,passportRows) {
  const team=(Array.isArray(teamRows)?teamRows:[]).filter(x=>x.status==='published'&&x.published_at).map(x=>({type:'team',id:x.id||'',title:x.title||'Team update',body:x.body||'',date:x.published_at,kind:kinds[x.kind]||'Team news'}));
  const personal=(Array.isArray(passportRows)?passportRows:[]).filter(x=>x.published_at&&x.approved_text).map(x=>({type:'child',id:x.id||'',title:'Your child’s development',body:x.approved_text,date:x.published_at,kind:'Coach-approved Passport update',home:x.home_activity||''}));
  return [...team,...personal].sort((a,b)=>String(b.date).localeCompare(String(a.date))).slice(0,12);
}
export function buildCoachFamilyCopy({kind,plan,observation,groupId}) {
  if(!group(groupId)||!kinds[kind])throw new Error('Choose a valid group and update type.');
  const note=String(observation||'').trim();
  if(kind==='upcoming_focus'&&plan?.status==='approved'&&plan.coach_objective){
    return {title:'Coming up: '+String(plan.title||'Next training focus').slice(0,105),body:'Our next planned coaching focus is: '+String(plan.coach_objective).slice(0,750)};
  }
  if(note.length<25)throw new Error('Add one genuine coaching observation (at least 25 characters).');
  const heading={upcoming_focus:'Our upcoming focus',session_learning:'What we practised this week',match_learning:'What we learned from matchday'};
  return {title:heading[kind],body:note.slice(0,900)};
}
const dateText=s=>{if(!s)return '';const d=new Date(s);return Number.isNaN(d.getTime())?'':d.toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'});};
const read=async query=>{const {data,error}=await query;if(error)throw error;return data||[];};

/** Parent-side: team progress plus individual *approved* Passport progress. */
/** Only the authenticated, RLS-enforced database union determines family visibility. */
export function verifiedFamilyTimeline(rows) {
  return (Array.isArray(rows)?rows:[])
    .filter(x=>x && ['individual','team'].includes(x.entry_scope) && x.published_at && typeof x.body==='string' && x.body.trim().length>0)
    .map(x=>({
      type:x.entry_scope==='individual'?'child':'team',
      id:String(x.entry_id||''),title:String(x.heading||'Coach-approved update').slice(0,160),
      body:String(x.body).slice(0,1200),date:x.published_at,
      kind:String(x.entry_kind||'coach_update').slice(0,50)
    }))
    .sort((a,b)=>String(b.date).localeCompare(String(a.date))).slice(0,12);
}


/** Family-safe Four Corner summary; never expose raw coach observations. */
export function safeParentFourCorner(rows) {
 const label={technical:'Technical',physical:'Physical',psychological:'Psychological',social:'Social'};
 const stage={focus_set:'Target set',practising:'Practising',observed:'Coach observed',demonstrated:'Demonstrated'};
 return (Array.isArray(rows)?rows:[]).filter(r=>r&&Object.hasOwn(label,r.corner)&&Object.hasOwn(stage,r.evidence_status)&&typeof r.target_text==='string'&&r.target_text.trim())
  .slice(0,4).map(r=>({corner:label[r.corner],target:r.target_text.trim().slice(0,240),status:stage[r.evidence_status]}));
}

export function mountParentLive({root,supabase,playerId,onOpenPassport}) {
  if(!(root instanceof Element)||!supabase?.auth?.getUser||!supabase?.from||!supabase?.rpc||!uuid(playerId))throw new TypeError('Signed-in parent, child ID and a valid view are required.');
  let disposed=false;
  root.classList.add('btb-parent-live');root.innerHTML='<p role="status">Loading your child’s updates…</p>';
  async function load(){
    const {data:a,error:e}=await supabase.auth.getUser();if(e||!a?.user?.id)throw new Error('Please sign in to your family account.');
    const p=await supabase.from('players').select('id,name,groups').eq('id',playerId).single();
    if(p.error||!p.data?.id)throw new Error('This child is not linked to your authorised account.');
    const child=p.data;
    // The server unions Passport, team and quick-coach moments using the existing
    // signed-in guardian relationship and RLS. Never read private moment records.
    const [verified,homeRows,focusRows]=await Promise.all([
      read(supabase.rpc('family_player_learning_feed',{p_player:playerId,p_limit:30})),
      read(supabase.from('passport_parent_updates').select('home_activity,published_at').eq('player_id',playerId).order('published_at',{ascending:false}).limit(8)),
      read(supabase.rpc('family_four_corner_focus',{p_player:playerId})).catch(()=>[])
    ]);
    if(disposed)return;
    const moments=verifiedFamilyTimeline(verified);
    const focuses=safeParentFourCorner(focusRows);
    const activity=homeRows.find(x=>typeof x.home_activity==='string'&&x.home_activity.trim().length)?.home_activity||'';
    root.innerHTML=`<div class="btb-family-frame"><header><small>BOX TO BOX · FAMILY JOURNEY</small><h2>${esc(child.name||'Your child')}’s learning journey</h2><p>Real progress, shared by your coaching team.</p></header>
       ${focuses.length?`<section class="btb-family-focus"><h3>What we are working on</h3><div class="btb-family-focus-grid">${focuses.map(f=>`<article><small>${esc(f.corner)} · ${esc(f.status)}</small><p>${esc(f.target)}</p></article>`).join('')}</div><p>These are current learning focuses, not player grades.</p></section>`:'<p class="btb-family-placeholder">Your coach will add Four Corner development focuses as they assess your child.</p>'}
       <section class="btb-family-news"><div class="btb-family-section"><h3>Latest from the academy</h3><span>${moments.length} approved ${moments.length===1?'update':'updates'}</span></div>
       ${moments.length?moments.map(m=>`<article class="btb-family-card"><div class="btb-family-meta"><span>${m.type==='child'?'⭐ YOUR CHILD':'⚽ TEAM'}</span><time>${esc(dateText(m.date))}</time></div><h4>${esc(m.title)}</h4><p>${esc(m.body)}</p>${m.type==='child'&&m.home?`<div class="btb-family-at-home"><strong>Try at home</strong><p>${esc(m.home)}</p></div>`:''}</article>`).join(''):'<div class="btb-family-empty"><strong>There are no approved updates yet.</strong><p>When your coach records a genuine training focus or progress note and approves it, it will appear here. We won’t post fictional achievements just to make the feed look busy.</p></div>'}</section>
       ${activity?`<aside class="btb-family-activity"><strong>One small thing you can do together</strong><p>${esc(activity)}</p></aside>`:''}
       ${typeof onOpenPassport==='function'?'<button type="button" data-open-passport>View the full Player Passport →</button>':''}
       <p class="btb-family-note">Updates are dated when coaches approve them. Your child’s private development remains visible only to authorised family members and staff.</p></div>`;
  }
  function click(e){if(root.contains(e.target)&&e.target.matches('[data-open-passport]'))onOpenPassport?.(playerId);}
  root.addEventListener('click',click);
  load().catch(e=>{if(!disposed)root.innerHTML=`<p role="alert" class="btb-family-error">${esc(e.message||'Unable to show family updates.')}</p>`;});
  return ()=>{disposed=true;root.removeEventListener('click',click);root.replaceChildren();root.classList.remove('btb-parent-live');};
}

/** Coach-side: one short real update; choose Draft or Approve & share in-app. */
export function mountCoachFamilyUpdate({root,supabase,groupId}) {
  if(!(root instanceof Element)||!supabase?.auth?.getUser||!supabase?.from||!supabase?.rpc||!group(groupId))throw new TypeError('Valid authorised coach and team view required.');
  root.classList.add('btb-family-coach');root.innerHTML='<p role="status">Opening team family update…</p>';
  let disposed=false,lead=false,latest=[],plans=[];
  const week=currentWeekLondon();
  async function load(){
    const {data:a,error:ae}=await supabase.auth.getUser();if(ae||!a?.user?.id)throw new Error('Coach sign-in is required.');
    const profile=await supabase.from('profiles').select('role,groups').eq('id',a.user.id).single();if(profile.error)throw profile.error;
    const role=profile.data?.role;if(!['admin','coach'].includes(role)||role==='coach'&&!profile.data.groups?.includes(groupId))throw new Error('Team not assigned to your account.');
    const approved=await supabase.rpc('is_lead',{g:groupId});if(approved.error)throw approved.error;lead=!!approved.data;
    [latest,plans]=await Promise.all([
      read(supabase.from('academy_parent_team_updates').select('id,kind,title,body,status,published_at,week_of').eq('group_id',groupId).order('created_at',{ascending:false}).limit(15)),
      read(supabase.from('academy_group_session_briefs').select('id,status,title,coach_objective,week_of').eq('group_id',groupId).eq('status','approved').order('week_of',{ascending:false}).limit(5))
    ]);
    if(!disposed)draw();
  }
  function draw(){
    const published=latest.filter(x=>x.status==='published');const pending=latest.filter(x=>x.status==='draft');const plan=plans.find(x=>x.week_of===week)||null;
    root.innerHTML=`<section class="btb-family-coach-shell"><header><small>COACH → FAMILY CONNECTION · ${esc(groupId)}</small><h2>Keep parents in the loop.</h2><p>One genuine coaching update is better than ten generic messages.</p></header>
      <div class="btb-family-coach-state"><b>${published[0]?`Last shared ${esc(dateText(published[0].published_at))}`:'No team update shared yet'}</b><span>${pending.length} draft${pending.length===1?'':'s'} to review</span></div>
      ${lead?`<form data-family-form><label>What's this about?<select name="kind">${Object.entries(kinds).map(([key,value])=>`<option value="${key}">${esc(value)}</option>`).join('')}</select></label>
      <label>One genuine observation or intended focus<textarea rows="3" maxlength="900" name="observation" placeholder="For example: Today we practised checking both shoulders before receiving. I saw players finding space to help their teammates."></textarea></label>
      ${plan?'<p class="btb-family-hint">An approved training plan is available. Select <b>Coming up</b> to use its approved objective automatically, or write your own.</p>':''}
      <div class="btb-family-coach-actions"><button type="submit" data-share="draft">Save draft</button><button type="submit" data-share="published" class="btb-family-coach-main">Approve & share in app</button></div>
      <p class="btb-family-hint">Parents only see approved updates. No automatic emails, WhatsApp or push messages.</p></form>`:'<p class="btb-family-empty">You can view team progress, but only the lead coach or director can publish updates.</p>'}
      ${pending.length?`<details><summary>Existing drafts (${pending.length})</summary>${pending.map(x=>`<article class="btb-family-draft"><b>${esc(x.title)}</b><p>${esc(x.body)}</p>${lead?`<button type="button" data-edit-kind="${esc(x.kind)}">Load draft into editor</button>`:''}</article>`).join('')}</details>`:''}
      <p role="status" class="btb-family-status" data-msg aria-live="polite"></p></section>`;
  }
  async function save(form,publish){
    if(!lead)throw new Error('Only your lead coach can share updates.');
    const v=Object.fromEntries(new FormData(form));
    const plan=plans.find(x=>x.week_of===week);
    // Approved plan wording is allowed only for UPCOMING focus. A retrospective
    // update requires coach-typed evidence; never invent attendance or achievements.
    let copy;
    if(v.kind==='upcoming_focus'&&v.observation.trim().length>=25){copy={title:'Our upcoming training focus',body:v.observation.trim()};}
    else copy=buildCoachFamilyCopy({kind:v.kind,plan,observation:v.observation,groupId});
    const r=await supabase.rpc('save_academy_parent_team_update',{
      p_group:groupId,p_week:week,p_kind:v.kind,p_title:copy.title,p_body:copy.body,p_publish:publish
    });
    if(r.error)throw r.error;
    const success=publish?'Approved — parents can see this update in their app.':'Saved as draft — not visible to parents yet.';
    latest=await read(supabase.from('academy_parent_team_updates').select('id,kind,title,body,status,published_at,week_of').eq('group_id',groupId).order('created_at',{ascending:false}).limit(15));
    if(!disposed){draw();root.querySelector('[data-msg]').textContent=success;}
  }
  let clickedPublish=false;
  function click(e){const btn=e.target.closest?.('button[data-edit-kind]');if(btn&&root.contains(btn)){
    const d=latest.find(x=>x.kind===btn.dataset.editKind&&x.status==='draft');
    if(d){const f=root.querySelector('form');f.elements.kind.value=d.kind;f.elements.observation.value=d.body;f.elements.observation.focus();}
  }else if(e.target.closest?.('button[data-share]'))clickedPublish=e.target.closest('button').dataset.share==='published';}
  function submit(e){if(!e.target.matches('form[data-family-form]'))return;e.preventDefault();const f=e.target;
    const buttons=[...f.querySelectorAll('button[type="submit"]')];buttons.forEach(x=>x.disabled=true);
    const publish=e.submitter?.dataset.share==='published'||(!e.submitter&&clickedPublish);
    save(f,publish).catch(error=>{const msg=root.querySelector('[data-msg]');if(msg)msg.textContent=String(error.message||error);}).finally(()=>buttons.forEach(x=>{if(x.isConnected)x.disabled=false;}));clickedPublish=false;
  }
  root.addEventListener('click',click);root.addEventListener('submit',submit);
  load().catch(e=>{if(!disposed)root.innerHTML=`<p role="alert">${esc(e.message||'Unable to load the team family updates.')}</p>`;});
  return ()=>{disposed=true;root.removeEventListener('click',click);root.removeEventListener('submit',submit);root.replaceChildren();root.classList.remove('btb-family-coach');};
}