import test from 'node:test';
import assert from 'node:assert/strict';
import {currentWeekLondon,mergeFamilyMoments,buildCoachFamilyCopy,verifiedFamilyTimeline,safeParentFourCorner} from './parent-live.js';

test('London week starts on a Monday in GMT',()=>{
 assert.equal(currentWeekLondon(new Date('2026-10-26T20:03:00Z')),'2026-10-26');
});
test('London week start handles summer clock and Sunday midnight',()=>{
 assert.equal(currentWeekLondon(new Date('2026-06-28T23:30:00Z')),'2026-06-29');
});
test('parents never receive unpublished team drafts',()=>{
 const rows=[{id:'1',status:'draft',title:'internal idea',published_at:'2026-10-26T10:00:00Z'},
             {id:'2',status:'published',title:'real verified goal',body:'Upcoming focus',published_at:'2026-10-26T10:00:00Z'}];
 const feed=mergeFamilyMoments(rows,[]);
 assert.equal(feed.length,1);
 assert.equal(feed[0].title,'real verified goal');
});
test('parents never receive unapproved passport events',()=>{
 const feed=mergeFamilyMoments([],[{approved_text:'verified',published_at:null},{approved_text:'coach reviewed skill',published_at:'2026-10-26T10:00:00Z'}]);
 assert.equal(feed.length,1);
 assert.equal(feed[0].body,'coach reviewed skill');
});
test('feed sorts individual and group updates by actual publish time',()=>{
 const feed=mergeFamilyMoments([{status:'published',title:'Team session',body:'Good practice',published_at:'2026-10-25T12:00:00Z'}],
 [{approved_text:'Player progress',published_at:'2026-10-26T12:00:00Z'}]);
 assert.equal(feed[0].type,'child');assert.equal(feed[1].type,'team');
});
test('upcoming weekly plan copy is clearly marked PLANNED not delivered',()=>{
 const x=buildCoachFamilyCopy({kind:'upcoming_focus',groupId:'U13',plan:{status:'approved',title:'Scanning and movement',coach_objective:'Encourage scanning and movement before receiving.'}});
 assert.match(x.body,/next planned coaching focus/i);
 assert.doesNotMatch(x.body,/we observed|our players achieved/i);
});
test('unapproved plan cannot fabricate an upcoming parent message',()=>{
 assert.throws(()=>buildCoachFamilyCopy({kind:'upcoming_focus',groupId:'U13',plan:{status:'draft',title:'Private'},observation:''}),/genuine coaching observation/);
});
test('retrospective message requires coach-authored factual learning detail',()=>{
 assert.throws(()=>buildCoachFamilyCopy({kind:'session_learning',groupId:'U13',plan:{status:'approved',coach_objective:'Plan'},observation:''}),/genuine coaching observation/);
});
test('retrospective note remains under maximum length',()=>{
 const x=buildCoachFamilyCopy({kind:'session_learning',groupId:'U13',observation:'We tried overlapping runs before shooting today. '.repeat(30)});
 assert.equal(x.body.length<=900,true);
});
test('only up to 12 approved events appear',()=>{
 const rows=Array.from({length:50},(_,i)=>({status:'published',title:String(i),body:'update',published_at:new Date(Date.UTC(2026,9,26,0,0,i)).toISOString()}));
 assert.equal(mergeFamilyMoments(rows,[]).length,12);
});

test('quick coaching moment appears with individual family label',()=>{
 const x=verifiedFamilyTimeline([{entry_scope:'individual',entry_kind:'coach_moment',entry_id:'test',heading:'A technical learning moment',body:'Coach verified a specific scanning example.',published_at:'2026-10-26T20:00:00Z'}]);
 assert.equal(x.length,1);assert.equal(x[0].type,'child');assert.match(x[0].title,/technical/);
});
test('unsigned or incomplete family feed records never appear',()=>{
 const x=verifiedFamilyTimeline([{entry_scope:'individual',body:'unapproved',published_at:null},{entry_scope:'private',body:'coach note',published_at:'2026-10-26T20:00:00Z'}]);
 assert.equal(x.length,0);
});
test('verified family feed merges Passport, group news and micro moments newest first',()=>{
 const rows=[{entry_scope:'team',body:'Upcoming focus',published_at:'2026-10-24T00:00:00Z'},
  {entry_scope:'individual',entry_kind:'coach_moment',body:'Coach observed helpful scanning.',published_at:'2026-10-26T00:00:00Z'},
  {entry_scope:'individual',entry_kind:'passport_progress',body:'Coach approved the target.',published_at:'2026-10-25T00:00:00Z'}];
 const items=verifiedFamilyTimeline(rows);
 assert.equal(items.length,3);assert.equal(items[0].kind,'coach_moment');assert.equal(items[2].type,'team');
});


test('parents see safe Four Corner targets rather than private coaching evidence',()=>{
 const rows=[{corner:'technical',target_text:'Scan before receiving',evidence_status:'practising',coach_observation:'PRIVATE: sensitive staff-only note'}];
 const x=safeParentFourCorner(rows);
 assert.deepEqual(x,[{corner:'Technical',target:'Scan before receiving',status:'Practising'}]);
 assert.doesNotMatch(JSON.stringify(x),/PRIVATE/);
});
test('parent Four Corner view does not invent player scores or display unrecognised statuses',()=>{
 const x=safeParentFourCorner([{corner:'physical',target_text:'Movement into space',evidence_status:'focus_set'},{corner:'special',target_text:'Unknown',evidence_status:'awarded'}]);
 assert.equal(x.length,1);assert.equal(x[0].status,'Target set');
});