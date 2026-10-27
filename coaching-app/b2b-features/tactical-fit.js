export const technicalOptions={passing:'Passing range',receiving:'Receiving under pressure',dribbling:'Carrying & 1v1',finishing:'Finishing',pace:'Acceleration',duels:'Defending duels',aerial:'Aerial play',stamina:'Repeated support runs',goalkeeping:'Goalkeeping'};
export const behaviourOptions={scanning:'Scans early',decisions:'Recognises options',communication:'Communicates clearly',composure:'Stays composed on the ball',initiative:'Takes attacking initiative',recovery:'Responds after a mistake',discipline:'Maintains team responsibilities',support:'Supports teammates'};
const demands={GK:['goalkeeping','passing','communication','composure'],CB:['duels','aerial','passing','scanning','discipline'],FB:['pace','stamina','receiving','support','recovery'],DM:['passing','receiving','scanning','composure','discipline'],CM:['passing','receiving','stamina','scanning','decisions'],AM:['receiving','dribbling','passing','scanning','initiative'],W:['pace','dribbling','receiving','initiative','support'],ST:['finishing','receiving','aerial','decisions','initiative']};
export function roleType(pos){const s=String(pos).toUpperCase();if(s==='GK')return'GK';if(/CB/.test(s))return'CB';if(/WB|LB|RB/.test(s))return'FB';if(/DM/.test(s))return'DM';if(/AM/.test(s))return'AM';if(/CM/.test(s)||s==='MID')return'CM';if(/LW|RW|LM|RM/.test(s))return'W';return'ST';}
export function suggestFits(attributes,slots){
 const technical=(attributes?.technical||[]).filter(k=>Object.hasOwn(technicalOptions,k)),behaviours=(attributes?.behaviours||[]).filter(k=>Object.hasOwn(behaviourOptions,k));
 if(!technical.length||!behaviours.length)return[];
 const tags=new Set([...technical,...behaviours]);
 return slots.map((slot,index)=>{const role=roleType(slot.pos),matched=demands[role].filter(k=>tags.has(k));let weight=matched.length;if((attributes.preferred_foot==='left'&&/^L/.test(slot.pos))||(attributes.preferred_foot==='right'&&/^R/.test(slot.pos)))weight+=.25;return{index,pos:slot.pos,role,matched,weight};}).filter(x=>x.matched.length>=2&&(x.role!=='GK'||tags.has('goalkeeping'))).sort((a,b)=>b.weight-a.weight||a.index-b.index).slice(0,3);
}
const prompts={GK:['Offer a return pass behind the ball; scan for the free player.','Protect the space behind your defensive line and organise teammates.'],CB:['Create a passing lane to the goalkeeper and holding midfielder.','Protect the centre; coordinate pressure, cover and defensive depth.'],FB:['Provide width or move inside when the team plan requires it.','Recover to protect the inside channel before chasing wide pressure.'],DM:['Show outside the cover shadow and connect both sides of the pitch.','Keep central protection behind the attack; screen passes into the striker.'],CM:['Receive on a different line and connect forward with support around you.','Recognise the nearest pressing cue and protect the next passing lane.'],AM:['Find space between units and receive with a view of the next action.','Screen the opposition pivot and support a coordinated press.'],W:['Stretch the pitch, then time a run inside when a teammate can find you.','Recover into the team block and press with cover behind you.'],ST:['Pin or move a defender to create space for the next runner.','Curve the press to guide play towards the team’s agreed trap.']};
export function expectationsFor(plan,pos){
 const role=roleType(pos),model=plan?.tactics?.coach_principles||{};
 const selected=Object.entries(model).filter(([,v])=>v&&Object.values(v).some(x=>typeof x==='string'&&x.trim()));
 if(!selected.length)return null;
 return{role,pos,withBall:prompts[role][0],withoutBall:prompts[role][1],phases:selected.map(([phase,v])=>({phase,principle:v.principle||'',trigger:v.trigger||'',teamAction:v.action||'',evidence:v.evidence||''}))};
}
export function repositionDraft(plan,player,index,slots){
 if(!player?.id||!Number.isInteger(index)||!slots[index])throw Error('Choose a player and valid position.');
 const lineup=slots.map((s,i)=>({...s,...(plan.lineup?.[i]||{})}));
 const source=lineup.findIndex(p=>p.player_id===player.id),occupant=lineup[index],sourceRecord=source>=0?{...lineup[source]}:{};
 let subs=(plan.subs||[]).filter(p=>p.player_id!==player.id).map(p=>({...p}));
 if(source===index)return{lineup,subs,published:!!plan.published};
 if(source>=0)lineup[source]=occupant?.player_id?{...occupant,...slots[source]}:{...slots[source]};
 else if(occupant?.player_id&&!subs.some(p=>p.player_id===occupant.player_id))subs.push({...occupant});
 lineup[index]={...sourceRecord,...slots[index],player_id:player.id,name:player.name};
 return{lineup,subs,published:false};
}
