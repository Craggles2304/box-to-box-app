import test from 'node:test';
import assert from 'node:assert/strict';
import {selectMatchdayFocus,extractActualTacticalCues,validateCoachMatchReview} from './matchday-quick.js';
const now=new Date('2026-10-26T20:00:00Z');
const date=day=>new Date(now.getTime()+day*86400000).toISOString();
const card=(id,days,extra={})=>({fixture_id:id,kickoff:date(days),match_focus:'Coach-observed focus only',...extra});
test('upcoming match picks earliest scheduled fixture',()=>{
 const x=selectMatchdayFocus([card('3',10),card('1',3),card('2',5)],now);
 assert.equal(x.card.fixture_id,'1');assert.equal(x.mode,'prepare');
});
test('coach reflection gets priority after the match',()=>{
 const x=selectMatchdayFocus([card('a',-1),card('b',2)],now);
 assert.equal(x.card.fixture_id,'a');assert.equal(x.mode,'reflect');
});
test('do not ask reflection before enough time after kickoff',()=>{
 const x=selectMatchdayFocus([{fixture_id:'a',kickoff:new Date(now.getTime()-20*60000).toISOString()}],now);
 assert.equal(x.mode,'prepare');
});
test('already reviewed match cannot generate duplicate prompt',()=>{
 const x=selectMatchdayFocus([card('a',-1,{reviewed_at:date(-1)})],now);
 assert.equal(x.mode,'complete');
});
test('a very old match does not prompt coach after 14 days',()=>{
 assert.equal(selectMatchdayFocus([card('a',-15)],now).mode,'empty');
});
test('do not invent tactic cues from a match without published plan',()=>{
 assert.deepEqual(extractActualTacticalCues({published:false,tactics:{coach_simple:{with_ball:'Attack wide'}}}),[]);
});
test('only actual published tactical instructions are shown',()=>{
 const cues=extractActualTacticalCues({published:true,tactics:{coach_simple:{with_ball:'Scan before receiving',without_ball:'Protect central area',transition:'React quickly'}}});
 assert.equal(cues.length,3);assert.equal(cues[2].title,'Transitions');
});
test('review cannot be saved with invented blank evidence',()=>{
 assert.throws(()=>validateCoachMatchReview({phase:'with_ball',observation:'',nextFocus:'Improve passing'}),/genuine observation/i);
});
test('review requires a next training focus',()=>{
 assert.throws(()=>validateCoachMatchReview({phase:'transition',observation:'Players worked on scanning under pressure',nextFocus:''}),/next coaching focus/i);
});
test('review phase must belong to a named tactical phase',()=>{
 assert.throws(()=>validateCoachMatchReview({phase:'score',observation:'Players worked on scanning under pressure',nextFocus:'Improve scanning'}),/part of the match/i);
});
test('valid review trims fields',()=>{
 const x=validateCoachMatchReview({phase:'set_piece',observation:'  We tracked runners at corners.  ',nextFocus:'  Make one clear call.  '});
 assert.equal(x.observation,'We tracked runners at corners.');assert.equal(x.nextFocus,'Make one clear call.');
});