import test from 'node:test';
import assert from 'node:assert/strict';
import { FOUR_CORNERS, mountPlayerJourney } from './journey.js';

class FakeElement {
  constructor() { this.html='';this.classList={add(){}};this.listeners=new Map();this.attrs=new Map(); }
  get innerHTML(){return this.html;}
  set innerHTML(value){this.html=value;}
  addEventListener(k,fn){this.listeners.set(k,fn);}
  removeEventListener(k){this.listeners.delete(k);}
  querySelector(){return null;}
  contains(){return false;}
  setAttribute(k,v){this.attrs.set(k,v);}
  removeAttribute(k){this.attrs.delete(k);}
  replaceChildren(){this.html='';}
}
global.Element=FakeElement;
const playerId='00000000-0000-4000-8000-000000000001';
class Query {
  constructor(table,role) {this.table=table;this.role=role;this.params={};}
  select(){return this;}
  eq(k,v){this.params[k]=v;return this;}
  in(){return this;}
  limit(){return this;}
  order(){return this;}
  single(){return Promise.resolve({data:{role:this.role},error:null});}
  maybeSingle(){return Promise.resolve({data:{id:playerId,name:'Alice <script>alert(1)</script>'},error:null});}
  then(ok,bad){return Promise.resolve({data:[],error:null}).then(ok,bad);}
}
function client(role){return {
  auth:{getUser:async()=>({data:{user:{id:'00000000-0000-4000-8000-000000000002'}},error:null})},
  from:table=>new Query(table,role),rpc:async()=>({data:null,error:null}),
};}
const tick=()=>new Promise(r=>setTimeout(r,15));

test('Four Corner taxonomy covers one target per corner',()=>{
  assert.deepEqual(FOUR_CORNERS,['technical','physical','psychological','social']);
});
test('Coach journey mounts and protects HTML in player name',async()=>{
  const root=new FakeElement();
  const dispose=mountPlayerJourney({root,supabase:client('coach'),playerId});
  await tick();
  assert.match(root.html,/COACH VIEW/);
  assert.match(root.html,/The Four Corner Model/);
  assert.match(root.html,/Coach approval/);
  assert.doesNotMatch(root.html,/<script>alert/);
  assert.match(root.html,/&lt;script&gt;/);
  dispose();assert.equal(root.html,'');
});
test('Parent journey does not show coach approval or target editing',async()=>{
  const root=new FakeElement();
  const dispose=mountPlayerJourney({root,supabase:client('parent'),playerId});
  await tick();
  assert.match(root.html,/FAMILY VIEW/);
  assert.match(root.html,/Approved coach updates/);
  assert.doesNotMatch(root.html,/Approve & publish/);
  assert.doesNotMatch(root.html,/Current target<textarea/);
  dispose();
});
test('Rejects invalid player reference',()=>{
  assert.throws(()=>mountPlayerJourney({root:new FakeElement(),supabase:client('coach'),playerId:'invalid'}),/Valid playerId/);
});