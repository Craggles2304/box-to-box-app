import test from 'node:test';
import assert from 'node:assert/strict';
import {cleanParentCode,normaliseParentHome,mountParentOnboarding,mountCoachGuardianSetup} from './parent-onboarding.js';
const player='11111111-1111-4111-a111-111111111111';
class Root{
 constructor(){this.html='';this.listeners={};this.classList={add(){},remove(){}}}
 set innerHTML(s){this.html=s} get innerHTML(){return this.html}
 addEventListener(k,fn){this.listeners[k]=fn}removeEventListener(k){delete this.listeners[k]}
 replaceChildren(){this.html=''}
 contains(){return true}
 querySelector(){return null}
}
globalThis.Element=Root;
const spin=()=>new Promise(r=>setTimeout(r,30));
const profile=()=>({data:{user:{id:'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa'}},error:null});
function fakeClient(data,override={}){
 const calls=[];return {calls,auth:{getUser:async()=>profile()},
 from:()=>({select:()=>({eq:()=>({single:async()=>({data:{},error:null})})})}),
 rpc:async(name,args)=>{calls.push({name,args});return {data:name==='parent_onboarding_home'?data:name==='coach_guardian_invite_queue'?[]:null,error:null}},...override};
}
test('normalises code to capital letters and ignores separator spaces',()=>assert.equal(cleanParentCode(' abcd-2345 '),'ABCD2345'));
test('rejects empty code',()=>assert.throws(()=>cleanParentCode(''),/8-character/));
test('rejects short code',()=>assert.throws(()=>cleanParentCode('abc'),/8-character/));
test('rejects long suspicious code',()=>assert.throws(()=>cleanParentCode('a'.repeat(80)),/8-character/));
test('parent home cannot become connected just because the server supplies a status string',()=>{
 const x=normaliseParentHome({signed_in:true,parent_role:'parent',status:'connected',children:[]});assert.equal(x.status,'enter_parent_code');
});
test('rejects data without verified parent role',()=>assert.throws(()=>normaliseParentHome({signed_in:true,parent_role:'coach',children:[{id:player,name:'A'}]}),/parent account/));
test('ignores unsafe child IDs',()=>{
 const home=normaliseParentHome({signed_in:true,parent_role:'parent',children:[{id:'javascript:alert(1)',name:'fake'},{id:player,name:'A'}]});assert.equal(home.children.length,1);
});
test('never accepts public status payload without signed in marker',()=>assert.throws(()=>normaliseParentHome({parent_role:'parent',children:[]}),/parent account/));
test('first login has a simple input and explicit consent checkbox',async()=>{
 const c=fakeClient({signed_in:true,parent_role:'parent',children:[]}),root=new Root();const dispose=mountParentOnboarding({root,supabase:c});await spin();
 assert.match(root.html,/Connect my child/);assert.match(root.html,/name="agree"/);assert.match(root.html,/private parent code/);
 assert.deepEqual(c.calls.map(x=>x.name),['parent_onboarding_home']);dispose();
});
test('insecure/signed-out session is rejected before loading family link',async()=>{
 const c=fakeClient(null,{auth:{getUser:async()=>({data:{user:null},error:null})}}),root=new Root();const dispose=mountParentOnboarding({root,supabase:c});await spin();
 assert.match(root.html,/sign in/i);assert.deepEqual(c.calls,[]);dispose();
});
test('only an authorised coach sees the private link queue; code is not auto requested',async()=>{
 const root=new Root(),c=fakeClient({});const dispose=mountCoachGuardianSetup({root,supabase:c,groupId:'U13'});await spin();
 assert.match(root.html,/already have a linked guardian/);assert.deepEqual(c.calls.map(x=>x.name),['coach_guardian_invite_queue']);dispose();
});
test('rejects dangerous group strings',()=>assert.throws(()=>mountCoachGuardianSetup({root:new Root(),supabase:fakeClient({}),groupId:'<script>'}),/assigned coaching group/));
test('invalid client refused without network activity',()=>assert.throws(()=>mountParentOnboarding({root:new Root(),supabase:{}}),/signed-in Supabase/));