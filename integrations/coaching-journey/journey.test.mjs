import test from 'node:test';
import assert from 'node:assert/strict';
import { FOUR_CORNERS, mountPlayerJourney } from './journey.js';

class FakeElement {
  constructor() { this.html='';this.classList={add(){}};this.listeners=new Map();this.attrs=new Map();this.status={textContent:'',role:'status',setAttribute(k,v){this[k]=v},classList:{toggle(){}}};this.allowedForm=null; }
  get innerHTML(){return this.html;}
  set innerHTML(value){this.html=value;}
  addEventListener(k,fn){this.listeners.set(k,fn);}
  removeEventListener(k){this.listeners.delete(k);}
  querySelector(sel){return sel==='[data-journey-status]'?this.status:null;}
  contains(node){return node===this.allowedForm;}
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


test('Parent only reads safe Four Corner RPC, not private coach observation table',async()=>{
  const c=client('parent'),seenTables=[],seenRpc=[];
  c.from=(table)=>{seenTables.push(table);return new Query(table,'parent')};
  c.rpc=async(name,args)=>{seenRpc.push({name,args});return {data:[],error:null}};
  const root=new FakeElement(); const stop=mountPlayerJourney({root,supabase:c,playerId});
  await tick();
  assert.ok(seenRpc.some(r=>r.name==='family_four_corner_focus' && r.args.p_player===playerId));
  assert.ok(!seenTables.includes('player_corner_focus'));
  stop();
});

test('Rejects UUID-shaped garbage with correct character count',()=>{
  const root=new FakeElement();
  assert.throws(()=>mountPlayerJourney({root,supabase:client('coach'),playerId:'------------------------------------'}),/Valid playerId/);
});

test('Coach saves one corner through authenticated Supabase and gets confirmation',async()=>{
  const root=new FakeElement(),c=client('coach'),writes=[];
  c.from=(table)=>{const q=new Query(table,'coach');if(table==='player_corner_focus')q.upsert=async(data,opts)=>{writes.push({data,opts});return {error:null}};return q};
  const stop=mountPlayerJourney({root,supabase:c,playerId});await tick();
  const form={dataset:{form:'corner',corner:'technical'},elements:{target:{value:'Scan before receiving the ball'},evidence:{value:'Looked over both shoulders before passing'},stage:{value:'observed'}}};
  root.allowedForm=form;
  await root.listeners.get('submit')({target:{closest:()=>form},preventDefault(){}});
  assert.equal(writes.length,1);
  assert.equal(writes[0].data.corner,'technical');
  assert.equal(writes[0].data.evidence_status,'observed');
  assert.equal(writes[0].opts.onConflict,'player_id,corner');
  assert.match(root.status.textContent,/Four Corner focus saved/);
  stop();
});

test('Parent cannot submit staff-only Four Corner changes',async()=>{
  const root=new FakeElement(),c=client('parent'),writes=[];
  c.from=(table)=>{if(table==='player_corner_focus')return {upsert:async(data)=>{writes.push(data);return {error:null}}};return new Query(table,'parent')};
  const stop=mountPlayerJourney({root,supabase:c,playerId});await tick();
  const form={dataset:{form:'corner',corner:'technical'},elements:{target:{value:'Some target'},evidence:{value:'No observation'},stage:{value:'focus_set'}}};
  root.allowedForm=form;
  await root.listeners.get('submit')({target:{closest:()=>form},preventDefault(){}});
  assert.equal(writes.length,0);
  assert.match(root.status.textContent,/Coach access required/);
  stop();
});

test('A coach must confirm before publishing a parent update',async()=>{
  const root=new FakeElement(),c=client('coach'),calls=[];
  c.rpc=async(name,args)=>{calls.push({name,args});return {data:null,error:null}};
  const stop=mountPlayerJourney({root,supabase:c,playerId});await tick();
  const form={dataset:{form:'approve',draft:'00000000-0000-4000-8000-000000000080'},elements:{text:{value:'The player demonstrated greater awareness before receiving during the session.'},home:{value:'Try a safe two-minute shoulder check and gentle pass.'}}};
  root.allowedForm=form;
  const previous=global.window;global.window={confirm:()=>false};
  try{await root.listeners.get('submit')({target:{closest:()=>form},preventDefault(){}});}finally{global.window=previous;}
  assert.ok(!calls.some(c=>c.name==='approve_passport_parent_draft'));
  stop();
});