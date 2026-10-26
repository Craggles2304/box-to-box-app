import test from 'node:test';
import assert from 'node:assert/strict';
import {validateMoment,proposedFamilyCopy,mountCoachQuickMoment} from './quick-moment.js';
const input={corner:'technical',stage:'observed',observation:'Looked over both shoulders before receiving the ball.',nextFocus:'Move to support after playing the pass.'};
const id='00000000-0000-4000-8000-000000000001';
class FakeElement{
 constructor(){this.html='';this.activeNode=null;this.handlers={};this.classList={add(){},remove(){}}}
 set innerHTML(x){this.html=x} get innerHTML(){return this.html}
 addEventListener(t,f){this.handlers[t]=f}removeEventListener(t){delete this.handlers[t]}
 replaceChildren(){this.html=''}querySelector(){return null}contains(x){return x===this.activeNode}
}
globalThis.Element=FakeElement;
class Query{
 constructor(name,role,seen){this.name=name;this.role=role;this.seen=seen}
 select(){return this}eq(){return this}contains(){return this}order(){return this}limit(){return this}
 single(){return Promise.resolve({data:{role:this.role,groups:['U13']},error:null})}
 then(ok,bad){this.seen.push(this.name);return Promise.resolve({data:this.name==='players'?[{id,name:'<img onerror=alert(1)> Player'}]:[],error:null}).then(ok,bad)}
}
function client(role){const seen=[];return {seen,auth:{getUser:async()=>({data:{user:{id}},error:null})},from:name=>new Query(name,role,seen),rpc(){throw Error('Should not write from initial render')}}}
const tick=()=>new Promise(r=>setTimeout(r,35));
test('one real observation is enough to prepare a private note',()=>{
 assert.deepEqual(validateMoment(input),input);
});
test('does not score or claim achievement without coach marking',()=>{
 assert.throws(()=>validateMoment({...input,stage:'graded:5'}),/genuinely noticed/);
});
test('rejects an empty performance claim',()=>assert.throws(()=>validateMoment({...input,observation:'Good job'}),/genuine observation/));
test('preserves next coaching focus',()=>assert.match(proposedFamilyCopy(input),/next focus is/i));
test('text assembled from coach observation only',()=>{
 const text=proposedFamilyCopy(input);
 assert.match(text,/Looked over both shoulders/);
 assert.doesNotMatch(text,/scored|improved by|attended/);
});
test('prevents excessive optional focus',()=>assert.throws(()=>validateMoment({...input,nextFocus:'x'.repeat(230)}),/next focus/));
test('rejects an unknown Four Corner',()=>assert.throws(()=>validateMoment({...input,corner:'magic'}),/Four Corner/));
test('assigned coach sees one player form',async()=>{
 const root=new FakeElement(),sb=client('coach');const dispose=mountCoachQuickMoment({root,supabase:sb,groupId:'U13'});
 await tick();assert.match(root.html,/One moment worth sharing/);assert.match(root.html,/Save privately/);
 assert.doesNotMatch(root.html,/<img onerror=alert/);dispose();
});
test('parent role never queries player list',async()=>{
 const root=new FakeElement(),sb=client('parent');const dispose=mountCoachQuickMoment({root,supabase:sb,groupId:'U13'});
 await tick();assert.ok(!sb.seen.includes('players'));assert.match(root.html,/Only academy coaches/);dispose();
});
test('rejects unsafe team parameter',()=>assert.throws(()=>mountCoachQuickMoment({root:new FakeElement(),supabase:client('coach'),groupId:'<script>'}),/valid assigned group/));
test('requires a signed-in database client',()=>assert.throws(()=>mountCoachQuickMoment({root:new FakeElement(),supabase:{},groupId:'U13'}),/signed-in/));