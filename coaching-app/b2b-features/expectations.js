import {escape as e} from './day-core.js';
export function mountExpectations({root,supabase,playerId,staff=false}){
 let closed=false,userId='';
 async function load(){
  const {data:auth,error:ae}=await supabase.auth.getUser();if(ae||!auth?.user)throw Error('Sign in to open player expectations.');userId=auth.user.id;
  if(staff){const {data:p,error}=await supabase.from('profiles').select('role').eq('id',userId).single();if(error||!['coach','admin'].includes(p?.role))throw Error('Coach access required.');}
  let q=supabase.from('academy_player_expectations').select('training_focus,match_focus,coach_feedback,published,updated_at').eq('player_id',playerId);if(!staff)q=q.eq('published',true);
  const {data,error}=await q.maybeSingle();if(error)throw error;if(closed)return;
  const fields=[['training_focus','Training','What to work on in training'],['match_focus','Games','What to practise in the game'],['coach_feedback','Coach feedback','A genuine observation and next step']];
  root.innerHTML=`<section class="family-expectations">${staff?'<h2>One clear focus.<br>Shared with the family.</h2><p>Write only what you want the parent and player to see.</p>':''}${staff?'<form data-expectation-form>':''}${fields.map(([key,label,hint])=>`<article class="family-focus-card"><span class="day-kicker">${label}</span>${staff?`<label>${hint}<textarea name="${key}" maxlength="${key==='coach_feedback'?1600:1200}" rows="3">${e(data?.[key]||'')}</textarea></label>`:`<h3>${e(data?.[key]||'Your coach has not shared this focus yet.')}</h3>`}</article>`).join('')}${staff?'<div class="day-segments"><button type="submit" name="intent" value="draft">Save privately</button><button type="submit" name="intent" value="publish" class="day-primary">Approve & share in Parent Hub</button></div></form>':''}<p role="status" data-expectation-status>${staff?(data?.published?'Published in the linked family’s Parent Hub.':'Private draft · not visible to families.'):(data?'Last shared '+new Date(data.updated_at).toLocaleDateString('en-GB'):'')}</p></section>`;
 }
 async function save(ev){ev.preventDefault();const status=root.querySelector('[data-expectation-status]');const publish=ev.submitter?.value==='publish';if(publish&&!confirm('Share these training and game focuses with this player’s linked family in the app?'))return;
  const values=Object.fromEntries(new FormData(ev.target));const payload={player_id:playerId,training_focus:String(values.training_focus||'').trim(),match_focus:String(values.match_focus||'').trim(),coach_feedback:String(values.coach_feedback||'').trim(),published:publish,updated_by:userId,updated_at:new Date().toISOString()};
  if(publish&&!payload.training_focus&&!payload.match_focus&&!payload.coach_feedback){status.textContent='Add at least one genuine focus or observation.';return;}
  ev.target.querySelectorAll('button').forEach(b=>b.disabled=true);status.textContent='Saving…';
  const {error}=await supabase.from('academy_player_expectations').upsert(payload);if(closed)return;
  if(error){status.textContent=error.message;ev.target.querySelectorAll('button').forEach(b=>b.disabled=false);}else await load();
 }
 root.innerHTML='<p role="status">Opening training & game focus…</p>';
 const listener=ev=>{if(ev.target.matches('[data-expectation-form]'))save(ev).catch(err=>{if(!closed)root.querySelector('[data-expectation-status]').textContent=err.message;});};root.addEventListener('submit',listener);
 load().catch(err=>{if(!closed)root.innerHTML=`<p role="alert">${e(err.message)}</p>`;});
 return ()=>{closed=true;root.removeEventListener('submit',listener);root.replaceChildren();};
}
