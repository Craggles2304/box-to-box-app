import test from 'node:test';
import assert from 'node:assert/strict';
import {pickCoachPriority,mountCoachHome} from './coach-home.js';
class FakeElement {
 constructor(){this.html='';this.eventHandlers={};this.activeNode=null;this.classList={add(){},remove(){}}}
 set innerHTML(v){this.html=v}get innerHTML(){return this.html}
 addEventListener(t,h){this.eventHandlers[t]=h}removeEventListener(t){delete this.eventHandlers[t]}
 contains(el){return el===this.activeNode}replaceChildren(){this.html=''}
}
globalThis.Element=FakeElement;
const uuid='00000000-0000-4000-8000-000000000001';
const group={id:uuid,group_id:'U13',title:'Scan then play',week_of:'2026-10-26',status:'draft',evidence_basis:'baseline_discovery',roster_size:5};
const tasks=[{action_key:'foo',player_id:uuid,priority:'next',heading:'Set Four Corners',next_step:'Choose a development target',first_seen_at:'2026-10-26T17:00:00Z'},{action_key:'bar',player_id:uuid,priority:'now',heading:'Check evidence',next_step:'Review current coach note',first_seen_at:'2026-10-26T16:00:00Z'}];
class Query{
 constructor(name,role,seen){this.name=name;this.role=role;this.seen=seen}
 select(){return this}eq(){return this}order(){return this}limit(){return this}in(){return this}
 single(){return Promise.resolve({data:{role:this.role,groups:['U13']},error:null})}
 then(ok,bad){this.seen.push(this.name);return Promise.resolve({data:({academy_coach_actions:tasks,academy_group_session_briefs:[group],players:[{id:uuid,name:'Example <img src=x onerror=alert(1)>'}]})[this.name]||[],error:null}).then(ok,bad)}
}
function client(role){const seen=[];return {seen,auth:{getUser:async()=>({data:{user:{id:uuid}},error:null})},from:name=>new Query(name,role,seen)}}
const tick=()=>new Promise(resolve=>setTimeout(resolve,20));
test('puts urgent work before optional coaching tasks',()=>{
 const selected=pickCoachPriority(tasks,[group]);assert.equal(selected.first.priority,'now');assert.equal(selected.more.length,1);
});
test('coach home has one highlighted action and collapses the rest',async()=>{
 const el=new FakeElement(),sb=client('coach');const close=mountCoachHome({root:el,supabase:sb,onOpenPlayer(){},onOpenGroup(){}});
 await tick();assert.match(el.html,/1 · START HERE/);assert.match(el.html,/2 · YOUR TEAM PLAN/);assert.match(el.html,/Other coaching actions \(1\)/);assert.match(el.html,/<details class="btb-home-more">/);close();
});
test('parent cannot fetch coach-only data',async()=>{
 const el=new FakeElement(),sb=client('parent');const close=mountCoachHome({root:el,supabase:sb,onOpenPlayer(){},onOpenGroup(){}});
 await tick();assert.match(el.html,/restricted to authorised academy staff|authorised academy staff/i);assert.ok(!sb.seen.includes('academy_coach_actions'));close();
});
test('escapes untrusted player names',async()=>{
 const el=new FakeElement(),sb=client('coach');const close=mountCoachHome({root:el,supabase:sb,onOpenPlayer(){},onOpenGroup(){}});
 await tick();assert.doesNotMatch(el.html,/<img src=x onerror/);assert.match(el.html,/&lt;img src=x onerror/);close();
});
test('calls host app navigation callbacks rather than inventing a route',async()=>{
 const el=new FakeElement(),sb=client('coach'),opened=[];
 const close=mountCoachHome({root:el,supabase:sb,onOpenPlayer:id=>opened.push(id),onOpenGroup:id=>opened.push(id)});await tick();
 const p={dataset:{btbOpenPlayer:uuid}},g={dataset:{btbOpenGroup:'U13'}};
 el.activeNode=p;el.eventHandlers.click({target:{closest:selector=>selector==='[data-btb-open-player]'?p:null}});
 el.activeNode=g;el.eventHandlers.click({target:{closest:selector=>selector==='[data-btb-open-group]'?g:null}});
 assert.deepEqual(opened,[uuid,'U13']);close();
});
test('rejects a missing signed-in Supabase client',()=>assert.throws(()=>mountCoachHome({root:new FakeElement(),supabase:{},onOpenPlayer(){},onOpenGroup(){}}),/signed-in Supabase/));
test('one-tap tactics and genuine parent updates use assigned group callbacks', async()=>{
 const el=new FakeElement(),sb=client('coach'),calls=[];
 const stop=mountCoachHome({root:el,supabase:sb,onOpenPlayer(){},onOpenGroup(){},onOpenTactics:g=>calls.push(['tactics',g]),onOpenFamilyUpdates:g=>calls.push(['family',g])});
 await tick();
 assert.match(el.html,/QUICK COACH ACTIONS/);
 assert.match(el.html,/Tactics board/);
 assert.match(el.html,/Parent update/);
 const target={dataset:{btbQuick:'tactics'}};el.activeNode=target;
 el.eventHandlers.click({target:{closest:selector=>selector==='[data-btb-quick]'?target:null}});
 const next={dataset:{btbQuick:'parents'}};el.activeNode=next;
 el.eventHandlers.click({target:{closest:selector=>selector==='[data-btb-quick]'?next:null}});
 assert.deepEqual(calls,[['tactics','U13'],['family','U13']]);
 stop();
});

test('quick learning moment keeps coach inside their assigned group',async()=>{
 const el=new FakeElement(),sb=client('coach'),calls=[];
 const stop=mountCoachHome({root:el,supabase:sb,onOpenPlayer(){},onOpenGroup(){},onOpenQuickMoment:g=>calls.push(g)});
 await tick();assert.match(el.html,/One learning moment/);
 const btn={dataset:{btbQuick:'moment'}};el.activeNode=btn;
 el.eventHandlers.click({target:{closest:selector=>selector==='[data-btb-quick]'?btn:null}});
 assert.deepEqual(calls,['U13']);stop();
});


test('only callback-based guardian setup shortcut is added and scoped to assigned team',async()=>{
 const el=new FakeElement(),sb=client('coach'),calls=[];
 const stop=mountCoachHome({root:el,supabase:sb,onOpenPlayer(){},onOpenGroup(){},onOpenGuardianLinks:g=>calls.push(g)});
 await tick();assert.match(el.html,/Help parents connect/);
 const button={dataset:{btbQuick:'family-links'}};el.activeNode=button;
 el.eventHandlers.click({target:{closest:selector=>selector==='[data-btb-quick]'?button:null}});
 assert.deepEqual(calls,['U13']);stop();
});