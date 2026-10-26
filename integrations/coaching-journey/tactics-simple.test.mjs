import test from 'node:test';
import assert from 'node:assert/strict';
import {formationChoices,getFormat,buildPitch,safeTacticPatch} from './tactics-simple.js';

test('formation options match outfield player count plus goalkeeper',()=>{
  for(const [format,formations] of Object.entries(formationChoices))for(const f of formations){
    assert.equal(f.split('-').map(Number).reduce((a,b)=>a+b,0)+1,Number(format));
    assert.equal(getFormat(f),Number(format));
  }
});
test('pitch renders a player for every number in a formation including GK',()=>{
 const out=buildPitch('4-2-3-1');
 assert.equal((out.match(/class="btb-tactic-dot"/g)||[]).length,10);
 assert.match(out,/>GK</);
});
test('malformed formation cannot inject HTML into pitch',()=>{
 assert.equal(buildPitch('<script>alert(1)</script>'),'');
 assert.equal(buildPitch('9-9'),'');
});
test('existing matchday tactics, set pieces and other keys preserved',()=>{
 const old={tactics:{with:{attack:'old approach'},without:{defend:'old approach'},set:{corner:'mark'}},formation:'4-1-2-1',published:true};
 const form={format:'9',formation:'3-3-2',with_ball:'Scan early',without_ball:'Protect central space',transition:'Quick recovery',set_pieces:'Mark tightly'};
 const x=safeTacticPatch(old,form);
 assert.deepEqual(x.tactics.with,old.tactics.with);
 assert.deepEqual(x.tactics.without,old.tactics.without);
 assert.deepEqual(x.tactics.set,old.tactics.set);
 assert.equal(x.tactics.coach_simple.format,9);
 assert.equal(x.formation,'3-3-2');
 assert.equal('published' in x,false);
});
test('rejects formations mismatched to selected format',()=>{
 assert.throws(()=>safeTacticPatch({}, {format:7,formation:'4-3-3',with_ball:'Scan'}),/valid formation/);
});
test('rejects empty tactical cues',()=>{
 assert.throws(()=>safeTacticPatch({}, {format:7,formation:'2-3-1'}),/one coaching instruction/);
});
test('rejects essay tactics to keep coach interface simple',()=>{
 assert.throws(()=>safeTacticPatch({}, {format:7,formation:'2-3-1',with_ball:'x'.repeat(181)}),/short instruction/);
});
test('retains unknown payload keys to avoid breaking existing full tactics module',()=>{
 const original={tactics:{custom:{foo:{bar:1}},coach_simple:{foo:1}}};
 const result=safeTacticPatch(original,{format:5,formation:'2-2',with_ball:'Width'});
 assert.deepEqual(result.tactics.custom,original.tactics.custom);
});