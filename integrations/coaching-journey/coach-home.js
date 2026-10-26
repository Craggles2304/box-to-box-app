/**
 * Box to Box | Coach Home: one task first, everything else is optional.
 * Mount only inside the existing signed-in Coaching App.
 * All data is constrained by Supabase RLS, even if a group/player ID is tampered with.
 * Navigation is delegated to host app, never assumed or invented.
 */
const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const order = Object.freeze({ now:0, next:1, later:2 });
const safeGroup = value => typeof value==='string' && value.length>=2 && value.length<=60 && !/[\x00-\x1f<>]/.test(value);
const safeUuid = value => typeof value==='string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);

export function pickCoachPriority(actions, groupPlans) {
  const tasks=[...(Array.isArray(actions)?actions:[])].filter(a=>safeUuid(a.player_id) && ['now','next','later'].includes(a.priority));
  tasks.sort((a,b)=>(order[a.priority]-order[b.priority]) || String(a.first_seen_at||'').localeCompare(String(b.first_seen_at||'')));
  const plans=[...(Array.isArray(groupPlans)?groupPlans:[])].filter(p=>safeGroup(p.group_id) && ['draft','approved'].includes(p.status));
  // The coach's next action is an actual existing task, not an AI-inferred rating.
  // A current week's session plan remains easy to find in the dedicated group section.
  return { first:tasks[0]??null, more:tasks.slice(1), plans };
}

export function mountCoachHome({root,supabase,onOpenPlayer,onOpenGroup,onOpenTactics,onOpenFamilyUpdates,onOpenMatchday}) {
  if(!(root instanceof Element))throw new TypeError('A valid coach dashboard element is required.');
  if(!supabase?.auth?.getUser || !supabase?.from)throw new TypeError('Use the existing signed-in Supabase client.');
  if(typeof onOpenPlayer !== 'function' || typeof onOpenGroup !== 'function')throw new TypeError('Connect player and team navigation from the existing app.');
  let disposed=false;
  let coachGroups=[];
  root.classList.add('btb-coach-home');
  root.innerHTML='<section class="btb-home-panel" role="status">Loading your coaching day…</section>';
  const q = async query => {const r=await query;if(r.error)throw r.error;return r.data||[];};
  const when = x => {if(!x)return '';const t=new Date(x);return Number.isNaN(t.valueOf())?'':t.toLocaleDateString('en-GB',{weekday:'short',day:'numeric',month:'short'});};
  const alertMessage = error => {
    if(!disposed)root.innerHTML=`<section role="alert" class="btb-home-panel btb-home-error">${escapeHtml(String(error?.message||'Your coach dashboard could not be loaded.').slice(0,220))}</section>`;
  };
  async function load() {
    const auth=await supabase.auth.getUser();
    if(auth.error || !auth.data?.user?.id)throw new Error('Please sign in to your coaching account.');
    const profile=await supabase.from('profiles').select('role,groups').eq('id',auth.data.user.id).single();
    if(profile.error)throw profile.error;
    if(!['coach','admin'].includes(profile.data?.role))throw new Error('Coach dashboard is for authorised academy staff only.');
    const groups=(Array.isArray(profile.data?.groups)?profile.data.groups:[]).filter(safeGroup).slice(0,30);
    const [actions,allPlans]=await Promise.all([
      q(supabase.from('academy_coach_actions').select('action_key,player_id,action_type,priority,heading,next_step,first_seen_at').eq('status','open').order('first_seen_at',{ascending:true}).limit(40)),
      q(supabase.from('academy_group_session_briefs').select('id,group_id,week_of,title,evidence_basis,status,roster_size').order('week_of',{ascending:false}).limit(30)),
    ]);
    if(disposed)return;
    const allowedPlans=profile.data.role==='admin'?allPlans:allPlans.filter(p=>groups.includes(p.group_id));
    const latest=new Map();
    for(const p of allowedPlans)if(safeGroup(p.group_id)&&!latest.has(p.group_id))latest.set(p.group_id,p);
    const plans=[...latest.values()].sort((a,b)=>a.group_id.localeCompare(b.group_id));
    coachGroups=[...new Set([...groups,...plans.map(p=>p.group_id)].filter(safeGroup))];
    const work=pickCoachPriority(actions,plans);
    const ids=[...new Set(actions.map(a=>a.player_id).filter(safeUuid))];
    const names = new Map();
    if(ids.length){
      const playerRows=await q(supabase.from('players').select('id,name').in('id',ids).limit(40));
      if(disposed)return;
      for(const p of playerRows)if(safeUuid(p.id))names.set(p.id,String(p.name||'Player').slice(0,80));
    }
    const countUrgent=actions.filter(a=>a.priority==='now').length;
    const moreCount=actions.length>1?actions.length-1:0;
    function task(row){
      const playerName=names.get(row.player_id)||'Your player';
      return `<article class="btb-home-task"><div class="btb-home-task-head"><strong>${escapeHtml(playerName)}</strong><span class="btb-home-pill">${escapeHtml(row.priority==='now'?'Now':row.priority==='next'?'Next':'Later')}</span></div><h3>${escapeHtml(row.heading)}</h3><p>${escapeHtml(row.next_step)}</p><button type="button" class="btb-home-go" data-btb-open-player="${escapeHtml(row.player_id)}">Open Player Passport <span aria-hidden="true">→</span></button></article>`;
    }
    const first=work.first?task(work.first):'<div class="btb-home-empty">No urgent player actions. You are up to date with recorded tasks.</div>';
    const teams=work.plans.length?work.plans.map(p=>`<article class="btb-home-team"><div><b>${escapeHtml(p.group_id)} · ${escapeHtml(p.title)}</b><small>${escapeHtml(when(p.week_of))} · ${p.status==='draft'?'Needs lead approval':'Approved'}${p.evidence_basis==='baseline_discovery'?' · Baseline exploration':''}</small></div><button type="button" data-btb-open-group="${escapeHtml(p.group_id)}">View training plan →</button></article>`).join(''):'<p class="btb-home-empty">Training plans will appear here after the academy prepares them.</p>';
    const quick = coachGroups.length&&(typeof onOpenTactics==='function'||typeof onOpenFamilyUpdates==='function'||typeof onOpenMatchday==='function')?
      `<section class="btb-home-panel btb-home-shortcuts" aria-label="Quick coaching tools"><div class="btb-home-kicker">3 · QUICK COACH ACTIONS</div><div class="btb-home-shortcut-grid">${coachGroups.length>1?`<label>My team<select data-btb-team-select>${coachGroups.map(g=>`<option value="${escapeHtml(g)}">${escapeHtml(g)}</option>`).join('')}</select></label>`:''}${typeof onOpenMatchday==='function'?'<button type="button" data-btb-quick="matchday">🏟️ Matchday — 60 sec</button>':''}${typeof onOpenTactics==='function'?'<button type="button" data-btb-quick="tactics">⚽ Tactics board</button>':''}${typeof onOpenFamilyUpdates==='function'?'<button type="button" data-btb-quick="parents">💚 Parent update</button>':''}</div><p>One training idea. One genuine family update. No extra logins.</p></section>`:'';
    root.innerHTML=`<header class="btb-home-heading"><span>BOX TO BOX · COACH MODE</span><h2>Everything for your session. Nothing extra.</h2><p>Do one useful thing, then get back to coaching.</p><div class="btb-home-counter"><strong>${actions.length}</strong> coaching follow-ups <span>·</span> <strong>${countUrgent}</strong> urgent</div></header>
     <section class="btb-home-panel" aria-label="Your next coaching action"><div class="btb-home-kicker">1 · START HERE</div>${first}</section>
     <section class="btb-home-panel" aria-label="Your group training plans"><div class="btb-home-kicker">2 · YOUR TEAM PLAN</div>${teams}</section>
     ${quick}
     ${moreCount?`<details class="btb-home-more"><summary>Other coaching actions (${moreCount}) <small>Only if you have time</small></summary>${work.more.map(task).join('')}</details>`:''}
     <p class="btb-home-note">No separate n8n login. No duplicate data entry. Parent messages still require coach approval.</p>`;
  }
  function clicked(ev){
    const quickBtn=ev.target.closest?.('[data-btb-quick]');
    if(quickBtn && root.contains(quickBtn)){
      const choice=root.querySelector?.('[data-btb-team-select]')?.value||coachGroups[0];
      if(!safeGroup(choice)||!coachGroups.includes(choice))return;
      if(quickBtn.dataset.btbQuick==='matchday' && typeof onOpenMatchday==='function')onOpenMatchday(choice);
      if(quickBtn.dataset.btbQuick==='tactics' && typeof onOpenTactics==='function')onOpenTactics(choice);
      if(quickBtn.dataset.btbQuick==='parents' && typeof onOpenFamilyUpdates==='function')onOpenFamilyUpdates(choice);
      return;
    }
    const playerBtn=ev.target.closest?.('[data-btb-open-player]');
    if(playerBtn && root.contains(playerBtn) && safeUuid(playerBtn.dataset.btbOpenPlayer)){
      onOpenPlayer(playerBtn.dataset.btbOpenPlayer);return;
    }
    const groupBtn=ev.target.closest?.('[data-btb-open-group]');
    if(groupBtn && root.contains(groupBtn) && safeGroup(groupBtn.dataset.btbOpenGroup)){
      onOpenGroup(groupBtn.dataset.btbOpenGroup);
    }
  }
  root.addEventListener('click',clicked);
  load().catch(alertMessage);
  return ()=>{disposed=true;root.removeEventListener('click',clicked);root.replaceChildren();root.classList.remove('btb-coach-home');};
}