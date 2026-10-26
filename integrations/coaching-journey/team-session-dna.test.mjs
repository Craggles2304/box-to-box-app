import test from 'node:test';
import assert from 'node:assert/strict';
import {validateTeamSessionDraft,mountTeamSessionDNA} from './team-session-dna.js';
const blocks=[{minutes:8,activity:'Active ball mastery',coach_cue:'No standing queues, each player is active.'},{minutes:15,activity:'Decision rondos',coach_cue:'Look up and find new supporting angles.'},{minutes:17,activity:'Directional passing',coach_cue:'Scan before receiving, then move after passing.'},{minutes:20,activity:'Small sided practice',coach_cue:'Coach decisions and support positions.'}];
class FakeElement{
 constructor(){this.html='';this.listening={};this.classList={add(){},remove(){}};this.status={textContent:'',setAttribute(){},classList:{toggle(){}}};this.attrs={};}
 set innerHTML(s){this.html=s}get innerHTML(){return this.html}addEventListener(k,fn){this.listening[k]=fn}removeEventListener(k){delete this.listening[k]}
 querySelector(sel){return sel==='[data-team-dna-status]'?this.status:null}
 contains(el){return el===this.form}
 setAttribute(k,v){this.attrs[k]=v}removeAttribute(k){delete this.attrs[k]}
}
globalThis.Element=FakeElement;
const user='00000000-0000-4000-8000-000000000002';
class Query{
 constructor(t,role,rows){this.t=t;this.role=role;this.rows=rows;this.params={}}
 select(){return this}eq(k,v){this.params[k]=v;return this}order(){return this}limit(){return this}
 single(){return Promise.resolve({data:{role:this.role},error:null})}
 then(ok,bad){return Promise.resolve({data:this.t==='academy_group_session_briefs'?this.rows:[],error:null}).then(ok,bad)}
}
function app(role,rows){const calls=[];return {calls,auth:{getUser:async()=>({data:{user:{id:user}},error:null})},from:t=>{calls.push('read:'+t);return new Query(t,role,rows)},rpc:async(name,args)=>{calls.push({name,args});return {data:null,error:null}}}}
const tick=()=>new Promise(done=>setTimeout(done,20));
const sample={id:'00000000-0000-4000-8000-000000000001',group_id:'U13',week_of:'2026-10-26',roster_size:5,four_corner_targets:0,evidence_basis:'baseline_discovery',focus_corner:'technical',title:'Technical scanning <script>hello</script>',coach_objective:'Explore useful scanning and support angles.',segments:blocks,observation_prompt:'Did players scan and move after passing?',status:'draft',match_context:{}};

test('validates useful 60-minute active session',()=>assert.equal(validateTeamSessionDraft({objective:sample.coach_objective,segments:blocks,observationPrompt:sample.observation_prompt}),60));
test('rejects sessions shorter than 30 minutes',()=>assert.throws(()=>validateTeamSessionDraft({objective:sample.coach_objective,segments:[{...blocks[0],minutes:2},blocks[1]],observationPrompt:sample.observation_prompt}),/30–120/));
test('rejects incomplete coach instruction',()=>assert.throws(()=>validateTeamSessionDraft({objective:sample.coach_objective,segments:[{...blocks[0],coach_cue:'none'},...blocks.slice(1)],observationPrompt:sample.observation_prompt}),/coach/i));
test('rejects rendering for unauthenticated family role',async()=>{const root=new FakeElement();const stop=mountTeamSessionDNA({root,supabase:app('parent',[sample]),groupId:'U13'});await tick();assert.match(root.status.textContent,/restricted/i);assert.doesNotMatch(root.html,/Technical scanning/);stop()});
test('escapes untrusted coach-generated HTML',async()=>{const root=new FakeElement();const stop=mountTeamSessionDNA({root,supabase:app('coach',[sample]),groupId:'U13'});await tick();assert.match(root.html,/&lt;script&gt;hello&lt;\/script&gt;/);assert.doesNotMatch(root.html,/<script>/);assert.match(root.html,/Approve training plan/);stop()});
test('rejects HTML injection in group ID',()=>assert.throws(()=>mountTeamSessionDNA({root:new FakeElement(),supabase:app('coach',[]),groupId:'<script>alert(1)</script>'}),/group code/));
test('uses the signed-in app client and reads only this group',async()=>{const root=new FakeElement();const sb=app('coach',[sample]);const stop=mountTeamSessionDNA({root,supabase:sb,groupId:'U13'});await tick();assert.ok(sb.calls.includes('read:academy_group_session_briefs'));stop();});

test('leader approval calls only the guarded RPC, never direct table updates',async()=>{
  const root=new FakeElement(),sb=app('coach',[sample]);
  const stop=mountTeamSessionDNA({root,supabase:sb,groupId:'U13'});await tick();
  const vals={objective:sample.coach_objective,observation:sample.observation_prompt};
  blocks.forEach((b,i)=>{vals['minutes_'+i]=String(b.minutes);vals['activity_'+i]=b.activity;vals['cue_'+i]=b.coach_cue});
  const form={dataset:{teamForm:sample.id},elements:{namedItem:(name)=>({value:vals[name]})}};
  root.form=form;
  await root.listening.submit({target:{closest:()=>form},submitter:{value:'approve'},preventDefault(){}});
  const calls=sb.calls.filter(x=>typeof x==='object');
  assert.equal(calls.length,1);
  assert.equal(calls[0].name,'review_academy_group_session_brief');
  assert.equal(calls[0].args.p_approve,true);
  assert.equal(calls[0].args.p_segments.reduce((a,s)=>a+s.minutes,0),60);
  assert.match(root.status.textContent,/Approved 60-minute/);
  stop();
});