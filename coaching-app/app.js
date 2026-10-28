const DATA = window.B2B_DATA;
const ACCESS = window.B2B_ACCESS || {admin:false,groups:[]};
const BLOCK_WORD = ["","One","Two","Three","Four","Five","Six"];
const MONTHS = {Jan:0,Feb:1,Mar:2,Apr:3,May:4,Jun:5,Jul:6,Aug:7,Sep:8,Oct:9,Nov:10,Dec:11};

const PROGS = {
  u13:{name:"U13 Elite 4-1-2-1",short:"U13",day:"Saturdays",hours:"2 hours",sessions:DATA.u13,blocks:DATA.u13Blocks},
  team:{name:"Team Syllabus",short:"Team",day:"Saturdays",hours:"2 hours",sessions:DATA.team,
    blocks:[
      {n:1,name:"Foundations & Team Basics",dates:"3 Oct – 21 Nov 2026",aim:"Players build the core techniques and meet the first principle of each moment of the game.",
       c:[["Technical","Receiving with both feet, side-foot passing, close control, basic turns, shooting technique."],["Tactical","Create options to play out, support the ball, find and attack space, protect the goal."],["Physical","Agility, balance and coordination (ABCs); change of direction."],["Psych / social","Confidence on the ball, learning names, encouraging teammates."]]},
      {n:2,name:"Attacking & Defensive Principles",dates:"28 Nov 2026 – 16 Jan 2027",aim:"Players learn the principles of play: width, depth, penetration and support in attack; pressure, cover, compactness and delay in defence.",
       c:[["Technical","Dribbling to beat a player, finishing, passing under pressure, defending stance."],["Tactical","Create and finish chances; press as a team; stay compact; keep the ball and build safely."],["Physical","Acceleration and deceleration; repeated short sprints."],["Psych / social","Bravery to take players on; resilience after mistakes; talking to teammates."]]},
      {n:3,name:"Developing Team Play",dates:"23 Jan – 13 Mar 2027",aim:"Players combine in small units: creating angles, covering teammates and progressing the ball together.",
       c:[["Technical","Receiving on the move, combination play (wall pass, overlap), defending and passing out."],["Tactical","Create angles, progress forward, keep control, cover teammates, find the free player, force mistakes."],["Physical","Speed endurance; agility with the ball."],["Psych / social","Communication in pairs and units; taking responsibility."]]},
      {n:4,name:"Team Understanding",dates:"20 Mar – 8 May 2027",aim:"Players begin to understand and explain the game model, organising themselves and each other on the pitch.",
       c:[["Technical","Defending 1v1, passing under pressure, combination play, dribbling to finish."],["Tactical","Press together, react first, break pressure, support angles, create chances, stay connected."],["Physical","Repeated sprint ability; robustness through movement quality."],["Psych / social","Leadership: players organise and encourage each other; player-led reviews."]]},
      {n:5,name:"Performance Development",dates:"15 May – 3 Jul 2027",aim:"Players perform their skills at match speed, under fatigue and pressure, with higher standards of quality.",
       c:[["Technical","Quality at speed: first touch, passing range, finishing, defending duels."],["Tactical","Play forward, improve end product, keep composure, win it back, defend together."],["Physical","Match-intensity work; recovery and hydration in warmer weather."],["Psych / social","Composure, concentration, resilience; setting personal targets."]]},
      {n:6,name:"Consolidation & Application",dates:"10 Jul – 28 Aug 2027",aim:"Players consolidate the season's learning and apply it with confidence, finishing with a final review and celebration.",
       c:[["Technical","Confident use of all techniques with both feet in games."],["Tactical","Build with confidence, retain, attack and protect space, press as one, stay connected."],["Physical","Maintain fitness through the summer; heat management and hydration."],["Psych / social","Self-belief; reflecting on progress; celebrating as a group."]]}
    ]},
  dev:{name:"Development 4–7",short:"Development 4–7",day:"Sundays",hours:"60 minutes",sessions:DATA.dev,
    blocks:DATA.devBlocks.map(b=>({...b,dates:b.dates.replace(/^(Saturday|Sunday|Tuesday) /,"").replace(/ to (Saturday|Sunday|Tuesday) /," – ").replace(/ \(8 weeks\)/,"")}))},
  dev812:{name:"Development 8–12",short:"Development 8–12",day:"Sundays",hours:"60 minutes",sessions:DATA.dev812,
    blocks:DATA.dev812Blocks.map(b=>({...b,dates:b.dates.replace(/^(Saturday|Sunday|Tuesday) /,"").replace(/ to (Saturday|Sunday|Tuesday) /," – ").replace(/ \(8 weeks\)/,"")}))},
  mastery:{name:"Tuesday Ball Mastery",short:"Ball Mastery",day:"Tuesdays",hours:"60 minutes",sessions:DATA.mastery,
    blocks:DATA.masteryBlocks.map(b=>({...b,dates:b.dates.replace(/^(Saturday|Sunday|Tuesday) /,"").replace(/ to (Saturday|Sunday|Tuesday) /," – ").replace(/ \(8 weeks\)/,"")}))},
  tech5:{name:"Technical Development 4–7",short:"Technical 4–7",day:"Saturdays",hours:"60 minutes",sessions:DATA.tech5,
    blocks:DATA.tech5Blocks.map(b=>({...b,dates:b.dates.replace(/^(Saturday|Sunday|Tuesday) /,"").replace(/ to (Saturday|Sunday|Tuesday) /," – ").replace(/ \(8 weeks\)/,"")}))},
  tech:{name:"Technical Development 10–14",short:"Technical 10–14",day:"Saturdays",hours:"60 minutes",sessions:DATA.tech,
    blocks:DATA.techBlocks.map(b=>({...b,dates:b.dates.replace(/^(Saturday|Sunday|Tuesday) /,"").replace(/ to (Saturday|Sunday|Tuesday) /," – ").replace(/ \(8 weeks\)/,"")}))}
};
const PROG_ORDER=["dev","dev812","tech5","tech","mastery","team","u13"];
const TEAMY=p=>p==="team"||p==="u13";
const TECHY=p=>p==="tech"||p==="tech5";
const PROG_INFO={
  dev:{title:"Sunday Development 4–7",sub:"Ages 4–7 · Sundays · one class",kicker:"Ages 4–7 in one class. Every child has a ball, every game has a story, and each block ends with a festival in week 8."},
  dev812:{title:"Sunday Development 8–12",sub:"Ages 8–12 · Sundays · one class",kicker:"Ages 8–12 in one class. All-round development across the four corners: technique, game understanding, physical and social. Every block ends with a festival in week 8."},
  mastery:{title:"Tuesday Ball Mastery 7–12",sub:"Ages 7–12 · Tuesdays · one class",kicker:"Ages 7–12 in one class. A ball each and thousands of touches. Week 8 of every block is a mastery check where players record their personal bests."},
  tech5:{title:"Saturday Technical 4–7",sub:"Ages 4–7 · Saturdays · one class",kicker:"Ages 4–7 in one class. A simple technical model, lots of repetitions, then friendly pressure. Weekly benchmarks and a skills check in week 8."},
  tech:{title:"Saturday Technical 10–14",sub:"Ages 10–14 · Saturdays · one class",kicker:"Ages 10–14 in one class. Technical model, closed reps, variable practice, then opposed. Weekly benchmarks and full testing in week 8."},
  u13:{title:"U13 Elite",sub:"4-1-2-1 · 9-a-side · Saturdays",kicker:"Our own game model: Be brave. Be smart. Attack together. Block One follows the eight sections of the U13 game model; every session uses the 4-1-2-1 and the five match-day rules."},
  team:{title:"Team",sub:"Match-playing teams · Saturdays",kicker:"Weeks 1–2 introduce, 3–6 develop under more pressure, 7 applies at match intensity and 8 tests and reviews."}
};
const GROUPS = [
  {id:"D47",key:null,chip:"Dev 4–7",short:"Ages 4–7",long:"Development 4–7",prog:"dev",fmt:"Sunday",bands:["4–5","6–7"]},
  {id:"BM",key:null,chip:"Ball Mastery 7–12",short:"Ages 7–12",long:"Ball Mastery 7–12",prog:"mastery",fmt:"Tuesday",bands:["7–9","10–12"]},
  {id:"TD5",key:null,chip:"Tech 4–7",short:"Ages 4–7",long:"Technical 4–7",prog:"tech5",fmt:"Saturday",bands:["4–5","6–7"]},
  {id:"D812",key:null,chip:"Dev 8–12",short:"Ages 8–12",long:"Development 8–12",prog:"dev812",fmt:"Sunday",bands:["8–10","11–12"]},
  {id:"TD",key:null,chip:"Tech 10–14",short:"Ages 10–14",long:"Technical 10–14",prog:"tech",fmt:"Saturday",bands:["10–12","13–14"]},
  {id:"U10",key:"U10",short:"U10",long:"U10 Vipers",prog:"team",fmt:"7-a-side"},
  {id:"U12/U13",key:"U12/U13",short:"U12",long:"U12 Titans",prog:"team",fmt:"9-a-side"},
  {id:"U15",key:"U15",short:"U15",long:"U15 Falcons",prog:"team",fmt:"11-a-side"},
  {id:"U13",key:"U13",short:"U13",long:"U13 Elite",prog:"u13",fmt:"9-a-side · 4-1-2-1"}
];
const ALL_GROUPS=GROUPS.slice();
(function(){const ok=ACCESS.admin?null:new Set(ACCESS.groups),has=new Set(ACCESS.loaded||[]);for(let i=GROUPS.length-1;i>=0;i--)if((ok&&!ok.has(GROUPS[i].id))||!has.has(GROUPS[i].prog))GROUPS.splice(i,1);const pr=new Set(GROUPS.map(g=>g.prog));for(let i=PROG_ORDER.length-1;i>=0;i--)if(!pr.has(PROG_ORDER[i]))PROG_ORDER.splice(i,1);})();
const idsOf=prog=>GROUPS.filter(g=>g.prog===prog).map(g=>g.id);
const G = id => GROUPS.find(g=>g.id===id)||((id==="4–5"||id==="6–7")&&GROUPS.find(g=>g.id==="D47"))||(/^BM/.test(id||"")&&GROUPS.find(g=>g.id==="BM"))||(/^TD/.test(id||"")&&GROUPS.find(g=>g.id==="TD"))||GROUPS.find(g=>g.id==="U10")||GROUPS[0];
const KEYP={u13:"u",team:"b",dev:"d",dev812:"e",mastery:"m",tech:"t",tech5:"k"};

for(const prog of PROG_ORDER){
  PROGS[prog].sessions.forEach((s,i)=>{
    const [d,m] = s.date.split(" "); const mo = MONTHS[m];
    s.prog=prog; s.idx=i; s.key=KEYP[prog]+s.block+"w"+s.week;
    s.dt=new Date(s.year||(mo>=9?2026:2027),mo,+d);
    s.iso=s.dt.getFullYear()+"-"+String(mo+1).padStart(2,"0")+"-"+String(+d).padStart(2,"0");
    s.long=s.dt.toLocaleDateString("en-GB",{weekday:"short",day:"numeric",month:"short",year:"numeric"});
  });
}
const ALL_BY_KEY = Object.fromEntries(PROG_ORDER.flatMap(p=>PROGS[p].sessions).map(s=>[s.key,s]));

const $ = (s,el=document)=>el.querySelector(s);
const esc = s => String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const store = {get(k,d){try{const v=localStorage.getItem(k);return v==null?d:JSON.parse(v)}catch(e){return d}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}};

const state = {
  team: G(store.get("b2b.team","U10")).id,
  tab:"today", open:null, players:12,
  logs:[], logsReady:false, dbOk:null, dlOk:false, myId:ACCESS.uid||null, profiles:ACCESS.profiles||{}, logFilter:"all", confirmDel:null
};
const grp = ()=>G(state.team);
const P = ()=>PROGS[grp().prog];
const isDev = ()=>grp().prog==="dev";
function defaultPlayers(){return TEAMY(grp().prog)?12:10}
state.players=defaultPlayers();
/* ---------- coach identity ---------- */
state.coachName = ACCESS.name||store.get("b2b.coachName","");
state.scores=[]; state.squads=[]; state.notes=[]; state.feedback=[];
state.scoring=null; state.player=null; state.fbOpen=false;
function coachId(){return state.myId||store.get("b2b.device",null)||(()=>{const d="d"+Math.random().toString(36).slice(2,10);store.set("b2b.device",d);return d})()}
function setCoachName(n){n=(n||"").trim();if(n){state.coachName=n;store.set("b2b.coachName",n)}}
function nameField(id){return state.coachName?"":`<div class="field"><label for="${id}">Your name</label><input type="text" id="${id}" autocomplete="name" placeholder="So other coaches know who added this"></div>`}
function takeName(id){const el=document.getElementById(id);if(el)setCoachName(el.value)}

/* ---------- tests ---------- */
const LEVELS=["Working towards","Bronze","Silver","Gold"];
const TESTS={
  mastery:[
    {id:"sole",name:"Sole rolls in 30 s (each foot)",lv:[30,45,60],blk:1},
    {id:"taps",name:"Foundation taps in 30 s",lv:[40,60,80],blk:1},
    {id:"slalom",name:"Slalom, 8 cones, both feet (seconds)",lower:true,lv:[null,15,12],blk:1},
    {id:"keepups",name:"Keep-ups (best of three)",lv:[10,30,75],blk:1},
    {id:"moves",name:"Moves to beat a player",pick:true,blk:2},
    {id:"turns",name:"Turns on both feet",pick:true,blk:3},
    {id:"touch",name:"Directional touches into target (out of 10)",lv:[5,7,9],blk:4},
    {id:"pass",name:"Passes through 2 m gate at 10 m (out of 10 each foot)",lv:[5,7,9],blk:5}],
  tech:[
    {id:"t-sole",name:"Sole rolls in 30 s (each foot)",tg:{"10–12":50,"13–14":65}},
    {id:"t-slalom",name:"Slalom dribble, 10 cones (seconds)",lower:true,tg:{"10–12":14,"13–14":11}},
    {id:"t-touch",name:"Directional first touch into 1 m gate (out of 10 each foot)",tg:{"10–12":7,"13–14":9}},
    {id:"t-side",name:"Side-foot pass through 2 m gate at 15 m (out of 10 each foot)",tg:{"10–12":7,"13–14":9}},
    {id:"t-driven",name:"Driven pass into 5×5 m zone at 25 m (out of 10)",tg:{"10–12":5,"13–14":8}},
    {id:"t-lofted",name:"Lofted switch into 5×5 m zone at 30 m (out of 10)",tg:{"10–12":4,"13–14":7}},
    {id:"t-run30",name:"30 m running with the ball (seconds)",lower:true,tg:{"10–12":6.5,"13–14":5.5}},
    {id:"t-finish",name:"Finishing into corner targets (out of 10)",tg:{"10–12":5,"13–14":7}},
    {id:"t-juggle",name:"Juggling, alternating feet",tg:{"10–12":30,"13–14":75}}]
};
TESTS.tech5=DATA.tech5Tests;
const MASTERY_TARGET={"7–9":2,"10–12":3};
function bandOf(pl,g=grp()){return (pl&&pl.band&&g.bands&&g.bands.includes(pl.band))?pl.band:(g.bands?g.bands[0]:g.key)}
const hasScores=prog=>prog==="mastery"||prog==="tech"||prog==="tech5";
function weekTest(s){
  if(!s||!TECHY(s.prog)||!s.benchmark||s.week===8) return null;
  const bn=s.benchmark.split(";")[0].toLowerCase();
  const hit=TESTS[s.prog].find(t=>bn.startsWith(t.name.toLowerCase().replace(/\s*\(.*$/,"")));
  if(hit) return hit;
  return {id:"wk-"+s.key,name:s.benchmark.split(";")[0].replace(/\.$/,""),week:true,session:s.key};
}
function testById(id){
  for(const p of ["mastery","tech","tech5"]){const t=TESTS[p].find(x=>x.id===id);if(t)return t}
  if(id.startsWith("wk-")){const s=ALL_BY_KEY[id.slice(3)];return weekTest(s)||{id,name:"Weekly benchmark",week:true}}
  return {id,name:id};
}
function testsForSession(s){
  if(!s) return [];
  if(s.prog==="mastery"){
    if(s.week!==8) return [];
    return TESTS.mastery.filter(t=>s.block===6||t.blk===s.block);
  }
  if(s.prog==="tech"){ if(s.week===8) return TESTS.tech; const w=weekTest(s); return w?[w]:[]; }
  if(s.prog==="tech5"){ if(s.week===8) return (DATA.tech5BlockTests[s.block]||[]).map(testById); const w=weekTest(s); return w?[w]:[]; }
  return [];
}
function better(t,a,b){return t.lower?a<b:a>b}
function levelOf(t,v){
  if(v==null||v==="") return -1;
  v=+v;
  if(t.pick) return Math.max(0,Math.min(3,v));
  if(!t.lv) return -1;
  if(t.lower){ if(v<t.lv[2])return 3; if(v<t.lv[1])return 2; return 1; }
  let l=0; t.lv.forEach((x,i)=>{if(x!=null&&v>=x)l=i+1}); return l;
}
function targetMet(t,v,ageKey){const tg=t.tg&&t.tg[ageKey];if(tg==null||v==null)return null;return t.lower?(+v<tg):(+v>=tg)}
function fmtV(t,v){if(t.pick)return LEVELS[+v]||"–";return (t.lower?(+v).toFixed(1).replace(/\.0$/,"")+" s":String(v))}

function squad(gid=state.team){return state.squads.filter(p=>p.group===gid).sort((a,b)=>a.name.localeCompare(b.name))}
function scoresFor(pid,testId){return state.scores.filter(x=>x.player===pid&&(!testId||x.test===testId)).sort((a,b)=>(a.date||"").localeCompare(b.date||""))}
function bestOf(t,list){let b=null;for(const x of list){if(x.value==null||x.value==="")continue;if(b==null||better(t,+x.value,+b.value))b=x}return b}

/* ---------- players view ---------- */
function playersView(){
  const g=grp();
  if(!hasScores(g.prog)) return `<section class="view"><div class="card empty">Player scores are used in Tuesday Ball Mastery and the two Technical Development classes. Pick one of those groups on the home page.</div></section>`;
  if(state.scoring) return scoringView();
  if(state.player) return playerView(state.player);
  const sq=squad(), tests=TESTS[g.prog];
  const rows=sq.map(p=>{const band=bandOf(p,g);
    const all=scoresFor(p.id);
    let badge="";
    if(g.prog==="mastery"){
      const lv=tests.map(t=>levelOf(t,(bestOf(t,scoresFor(p.id,t.id))||{}).value)).filter(x=>x>=0);
      const counts=[1,2,3].map(n=>lv.filter(x=>x>=n).length);
      badge=`<span class="band">${esc(band)}</span>`+(lv.length?`<span class="lvl l${Math.min(...lv)}">${LEVELS[Math.min(...lv)]}</span><span class="muted" style="font-size:13px">${lv.length} test${lv.length>1?"s":""}</span>`:`<span class="muted" style="font-size:13px">No scores yet</span>`);
    }else{
      const met=tests.map(t=>targetMet(t,(bestOf(t,scoresFor(p.id,t.id))||{}).value,band)).filter(x=>x!=null);
      badge=`<span class="band">${esc(band)}</span>`+(met.length?`<span class="lvl ${met.every(Boolean)?"l3":"l1"}">${met.filter(Boolean).length}/${met.length} targets</span>`:`<span class="muted" style="font-size:13px">${all.length?all.length+" benchmark"+(all.length>1?"s":""):"No scores yet"}</span>`);
    }
    return `<li><button type="button" data-player="${esc(p.id)}"><span class="pname">${esc(p.name)}</span><span class="pbadges">${badge}</span><span aria-hidden="true">›</span></button></li>`;
  }).join("");
  return `<section class="view">
    <div style="display:flex;flex-direction:column;gap:6px">
      <div class="eyebrow">${esc(g.long)} · ${sq.length} player${sq.length===1?"":"s"}</div>
      <h1 class="sec-title" style="font-size:34px">Players</h1>
      <p class="muted" style="margin:0">${g.prog==="mastery"?`Mastery levels from each player's best score. Targets: ages 7–9 Silver, ages 10–12 Gold.`:`Targets by age band (${g.bands.join(" or ")}), plus weekly benchmarks.`}</p>
    </div>
    <div class="actions"><button class="btn primary big" id="rec-scores" ${sq.length?"":"disabled"}>Record scores</button>${state.scores.some(x=>x.group===g.id)?`<button class="btn big ghost" id="exp-scores">Export</button>`:""}</div>
    ${sq.length?`<ul class="card plist">${rows}</ul>`:`<div class="card empty">No players yet. Add your squad below, using first name and initial (for example Sam T).</div>`}
    <form class="card form" id="addp">
      <div class="field"><label for="np">Add a player</label><span class="hint">First name and initial only. Add several at once by separating with commas.</span>
      <div style="display:flex;gap:8px"><input type="text" id="np" autocomplete="off" placeholder="Sam T, Ava M"><button class="btn" type="submit">Add</button></div></div>
      ${g.bands?`<div class="field"><span class="lbl" id="nb-l">Age band</span><div class="seg" role="radiogroup" aria-labelledby="nb-l">${g.bands.map((b,i)=>`<label><input type="radio" name="nb" value="${b}" ${i===0?"checked":""}><span>Ages ${b}</span></label>`).join("")}</div></div>`:""}
    </form>
  </section>`;
}
function playerView(pid){
  const g=grp(), p=state.squads.find(x=>x.id===pid);
  if(!p){state.player=null;return playersView()}
  const tests=TESTS[g.prog], band=bandOf(p,g);
  const rows=tests.map(t=>{
    const list=scoresFor(pid,t.id), b=bestOf(t,list), last=list[list.length-1];
    let tag="";
    if(b){ if(g.prog==="mastery"){const l=levelOf(t,b.value);tag=`<span class="lvl l${l}">${LEVELS[l]}</span>`}
           else {const m=targetMet(t,b.value,band);tag=m==null?"":`<span class="lvl ${m?"l3":"l0"}">${m?"Target met":"Target "+(t.lower?"under ":"")+fmtV(t,t.tg[band])}</span>`}}
    return `<tr><td>${esc(t.name)}${list.length>1?`<div class="muted" style="font-size:12.5px">${list.map(x=>esc(fmtV(t,x.value))).join(" → ")}</div>`:""}</td><td class="num">${b?esc(fmtV(t,b.value)):"–"}</td><td>${tag}</td></tr>`;
  }).join("");
  const wk=state.scores.filter(x=>x.player===pid&&x.test.startsWith("wk-")).sort((a,b)=>(a.date||"").localeCompare(b.date||""));
  return `<section class="view">
    <button class="btn small ghost back" id="pback">← Players</button>
    <div><div class="eyebrow">${esc(g.long)}</div><h1 class="sec-title" style="font-size:34px">${esc(p.name)}</h1></div>
    ${g.bands?`<div class="field"><span class="lbl" id="pb-l">Age band${g.prog==="mastery"?` · target ${LEVELS[MASTERY_TARGET[band]]}`:""}</span><div class="seg" role="radiogroup" aria-labelledby="pb-l">${g.bands.map(b=>`<label><input type="radio" name="pband" value="${b}" ${b===band?"checked":""}><span>Ages ${b}</span></label>`).join("")}</div></div>`:""}
    <div class="card tbl-wrap"><table><thead><tr><th>Test</th><th>Best</th><th>${g.prog==="mastery"?"Level":"Target"}</th></tr></thead><tbody>${rows}</tbody></table></div>
    ${wk.length?`<h2 class="sec-title" style="font-size:22px">Weekly benchmarks</h2><div class="card tbl-wrap"><table><tbody>${wk.map(x=>{const s=ALL_BY_KEY[x.test.slice(3)];return `<tr><td>${s?`Wk ${s.week} · B${s.block}<div class="muted" style="font-size:12.5px">${esc(testById(x.test).name)}</div>`:esc(x.testName||"")}</td><td class="num">${esc(x.value)}</td></tr>`}).join("")}</tbody></table></div>`:""}
    <div class="actions"><button class="btn" id="rec-one">Record a score</button>
    ${state.confirmDel==="p:"+pid?`<span class="confirm">Remove ${esc(p.name)} from the squad? <button class="btn small" id="pdel-yes">Remove</button><button class="btn small ghost" id="pdel-no">Keep</button></span>`:`<button class="btn ghost" id="pdel">Remove player</button>`}</div>
  </section>`;
}
function scoringView(){
  const g=grp(), sc=state.scoring, s=sc.session?ALL_BY_KEY[sc.session]:null;
  const opts=[...(s?testsForSession(s):[]),...TESTS[g.prog]].filter((t,i,a)=>a.findIndex(x=>x.id===t.id)===i);
  if(!sc.test) sc.test=opts[0].id;
  const t=testById(sc.test), sq=squad();
  const today=new Date().toISOString().slice(0,10);
  return `<section class="view">
    <button class="btn small ghost back" id="sback">← Cancel</button>
    <div><div class="eyebrow">${esc(g.long)}${s?` · Wk ${s.week} · ${esc(s.date)}`:""}</div><h1 class="sec-title" style="font-size:30px">Record scores</h1></div>
    <form class="card form" id="scoreform">
      <div class="field"><label for="sc-test">Test</label><select id="sc-test">${opts.map(o=>`<option value="${esc(o.id)}" ${o.id===sc.test?"selected":""}>${esc(o.week?"This week: "+o.name:o.name)}</option>`).join("")}</select>
        ${TECHY(g.prog)&&t.tg?`<span class="hint">Targets: ${g.bands.map(b=>`ages ${b} ${t.lower?"under ":""}${esc(fmtV(t,t.tg[b]))}`).join(" · ")}</span>`:""}
        ${g.prog==="mastery"&&t.lv?`<span class="hint">Bronze ${t.lower?"completes":t.lv[0]} · Silver ${t.lower?"under "+t.lv[1]+" s":t.lv[1]} · Gold ${t.lower?"under "+t.lv[2]+" s":t.lv[2]}</span>`:""}</div>
      <div class="field"><label for="sc-date">Date</label><input type="date" id="sc-date" value="${s&&s.iso<=today?s.iso:today}"></div>
      ${nameField("sc-coach")}
      <ul class="scorelist">${sq.map(p=>`<li><span class="pname">${esc(p.name)}${g.bands?` <span class="band">${esc(bandOf(p,g))}</span>`:""}</span>${t.pick?`<span class="seg">${[1,2,3].map(n=>`<label><input type="radio" name="v-${esc(p.id)}" value="${n}"><span>${LEVELS[n]}</span></label>`).join("")}</span>`:`<input type="number" inputmode="decimal" step="any" min="0" class="scin" data-p="${esc(p.id)}" aria-label="${esc(p.name)} score" placeholder="–">`}</li>`).join("")}</ul>
      <p class="hint" style="margin:0">Leave blank for anyone absent.</p>
      <div><button class="btn primary big" type="submit" id="sc-save">Save scores</button></div>
    </form>
  </section>`;
}
function bindPlayers(){
  const g=grp();
  const f=$("#addp"); if(f) f.onsubmit=async e=>{e.preventDefault();const names=$("#np").value.split(",").map(x=>x.trim()).filter(Boolean);if(!names.length)return;
    try{for(const n of names) await window._db.collection("squads").add({group:g.id,groupName:g.long,band:((document.querySelector('input[name=nb]:checked')||{}).value)||null,name:n.slice(0,40),coach:coachId(),coachName:state.coachName||"",createdAt:new Date().toISOString()});toast(names.length>1?names.length+" players added":"Player added")}catch(e){toast("Couldn't add the player.")}};
  document.querySelectorAll("[data-player]").forEach(b=>b.onclick=()=>{state.player=b.dataset.player;render();window.scrollTo(0,0)});
  const rs=$("#rec-scores"); if(rs) rs.onclick=()=>{state.scoring={};render();window.scrollTo(0,0)};
  const ex=$("#exp-scores"); if(ex) ex.onclick=()=>exportScores(ex);
  const pb=$("#pback"); if(pb) pb.onclick=()=>{state.player=null;state.confirmDel=null;render()};
  const ro=$("#rec-one"); if(ro) ro.onclick=()=>{state.scoring={};state.player=null;render();window.scrollTo(0,0)};
  document.querySelectorAll('input[name=pband]').forEach(r=>r.onchange=async()=>{const pl=state.squads.find(x=>x.id===state.player);if(!pl)return;const {id,...rest}=pl;try{await window._db.collection("squads").doc(id).set({...rest,band:r.value});r.blur();render();toast("Age band updated")}catch(e){toast("Couldn't update.")}});
  const pd=$("#pdel"); if(pd) pd.onclick=()=>{state.confirmDel="p:"+state.player;render()};
  const pn=$("#pdel-no"); if(pn) pn.onclick=()=>{state.confirmDel=null;render()};
  const py=$("#pdel-yes"); if(py) py.onclick=async()=>{try{await window._db.collection("squads").doc(state.player).delete();state.player=null;state.confirmDel=null;toast("Player removed");render()}catch(e){toast("Couldn't remove the player.")}};
  const sb=$("#sback"); if(sb) sb.onclick=()=>{const back=state.scoring&&state.scoring.session;state.scoring=null;if(back&&state.scoring===null&&state._fromSession){state._fromSession=false;openSession(back)}else render()};
  const st=$("#sc-test"); if(st) st.onchange=()=>{state.scoring.test=st.value;render()};
  const sf=$("#scoreform"); if(sf) sf.onsubmit=async e=>{e.preventDefault();takeName("sc-coach");
    const t=testById(state.scoring.test), date=$("#sc-date").value||new Date().toISOString().slice(0,10);
    const recs=[];
    for(const p of squad()){
      let v=null;
      if(t.pick){const r=document.querySelector(`input[name="v-${CSS.escape(p.id)}"]:checked`);if(r)v=+r.value}
      else{const i=document.querySelector(`.scin[data-p="${CSS.escape(p.id)}"]`);if(i&&i.value!=="")v=+i.value}
      if(v!=null&&!isNaN(v)) recs.push({group:g.id,groupName:g.long,prog:g.prog,player:p.id,playerName:p.name,test:t.id,testName:t.name,value:v,date,session:state.scoring.session||null,coach:coachId(),coachName:state.coachName||"",createdAt:new Date().toISOString()});
    }
    if(!recs.length){toast("Enter at least one score.");return}
    const btn=$("#sc-save");btn.disabled=true;btn.textContent="Saving…";
    try{for(const r of recs) await window._db.collection("scores").add(r);toast(recs.length+" score"+(recs.length>1?"s":"")+" saved");state.scoring=null;render();window.scrollTo(0,0)}
    catch(e){btn.disabled=false;btn.textContent="Save scores";toast("Couldn't save. Try again.")}
  };
}
async function exportScores(btn){
  const g=grp(), q=v=>'"'+String(v??"").replace(/"/g,'""')+'"';
  const rows=state.scores.filter(x=>x.group===g.id).sort((a,b)=>(a.date||"").localeCompare(b.date||""));
  const csv="﻿"+["Date","Group","Player","Test","Score","Level / target","Coach"].map(q).join(",")+"\n"+rows.map(x=>{const t=testById(x.test);
    const lt=g.prog==="mastery"?(levelOf(t,x.value)>=0?LEVELS[levelOf(t,x.value)]:""):(()=>{const pl=state.squads.find(y=>y.id===x.player);const m=targetMet(t,x.value,bandOf(pl,g));return m==null?"":m?"Met":"Not yet"})();
    return [x.date,g.long,x.playerName,x.testName||t.name,t.pick?LEVELS[x.value]:x.value,lt,x.coachName].map(q).join(",")}).join("\n");
  if(!window._dl){toast("Downloads aren't available in this view.");return}
  try{await window._dl.save({filename:`Box to Box scores ${g.long} ${new Date().toISOString().slice(0,10)}.csv`,data:csv});toast("Scores exported")}catch(e){}
}

/* ---------- notes & feedback (session page) ---------- */
function notesCard(s){
  const mine=state.notes.find(n=>n.session===s.key&&n.coach===coachId());
  const others=state.notes.filter(n=>n.session===s.key&&n.coach!==coachId()&&n.text);
  return `<div class="card box" id="notes">
    <h2>Coach notes</h2>
    ${others.map(n=>`<div class="note-o"><b>${esc(n.coachName||"A coach")}</b>${esc(n.text)}</div>`).join("")}
    <div class="field"><label for="my-note">${others.length?"Your note":"Your note for this session"}</label><textarea id="my-note" placeholder="What worked, what you changed, kit you needed…">${esc(mine?mine.text:"")}</textarea></div>
    ${nameField("note-coach")}
    <div class="actions"><button class="btn small" id="save-note">Save note</button></div>
  </div>`;
}
function feedbackCard(s){
  if(!state.fbOpen) return `<div class="fb-link"><button type="button" class="linkbtn" id="fb-open">Send feedback</button></div>`;
  return `<form class="card form" id="fbform">
    <h2 class="sec-title" style="font-size:20px">Feedback</h2>
    <div class="seg" role="radiogroup" aria-label="Type">${["Problem","Idea","Question"].map((v,i)=>`<label><input type="radio" name="fbt" value="${v}" ${i===0?"checked":""}><span>${v}</span></label>`).join("")}</div>
    <div class="field"><label for="fb-text">What's on your mind?</label><textarea id="fb-text" placeholder="${s?"e.g. The rondo area is too small for 14 players.":"e.g. Could coach mode show the low-numbers plan?"}"></textarea></div>
    ${nameField("fb-coach")}
    <div class="actions"><button class="btn primary" type="submit">Send</button><button class="btn ghost" type="button" id="fb-cancel">Cancel</button></div>
  </form>`;
}
function bindNotesFeedback(s){
  const sn=$("#save-note"); if(sn) sn.onclick=async()=>{takeName("note-coach");const text=$("#my-note").value.trim();
    try{await window._db.collection("notes").doc(coachId()+"_"+s.key).set({session:s.key,sessionTitle:s.title,group:state.team,groupName:grp().long,coach:coachId(),coachName:state.coachName||"",text,updatedAt:new Date().toISOString()});toast("Note saved")}catch(e){toast("Couldn't save the note.")}};
  const fo=$("#fb-open"); if(fo) fo.onclick=()=>{state.fbOpen=true;rerenderKeep("#fbform")};
  const fc=$("#fb-cancel"); if(fc) fc.onclick=()=>{state.fbOpen=false;rerenderKeep(".fb-link")};
  const ff=$("#fbform"); if(ff) ff.onsubmit=async e=>{e.preventDefault();takeName("fb-coach");const text=$("#fb-text").value.trim();if(!text){toast("Write a few words first.");return}
    const type=(document.querySelector('input[name=fbt]:checked')||{}).value||"Idea";
    try{await window._db.collection("feedback").add({type,text,session:s?s.key:null,sessionTitle:s?s.title:"General",group:state.team,groupName:grp().long,coach:coachId(),coachName:state.coachName||"",createdAt:new Date().toISOString()});state.fbOpen=false;toast("Sent. Thank you");rerenderKeep(".fb-link")}catch(e){toast("Couldn't send. Try again.")}};
}
function rerenderKeep(sel){const y=window.scrollY;render();window.scrollTo(0,y);const el=$(sel);if(el)el.scrollIntoView({block:"nearest"})}
function feedbackList(){
  if(!state.feedback.length) return "";
  const fb=state.feedback.slice().sort((a,b)=>(b.createdAt||"").localeCompare(a.createdAt||""));
  return `<h2 class="sec-title" style="font-size:24px">Coach feedback</h2><div class="entries">${fb.map(f=>{const s=f.session&&ALL_BY_KEY[f.session];return `<article class="card entry">
    <div class="entry-top"><span class="tm">${esc(f.type||"Note")}</span><h3>${s?`<button type="button" class="linkbtn" data-open="${s.key}">${esc(s.title)}</button>`:"General"}</h3></div>
    <p style="margin:0">${esc(f.text)}</p>
    <div class="meta"><span>${esc(f.coachName||"A coach")}</span><span>${esc(G(f.group).long)}</span><span>${esc((f.createdAt||"").slice(0,10))}</span></div></article>`}).join("")}</div>`;
}


function today0(){const t=new Date();return new Date(t.getFullYear(),t.getMonth(),t.getDate())}
function nextIdx(list=P().sessions){const t=today0();return list.findIndex(s=>s.dt>=t)}
function loggedSet(team){return new Set(state.logs.filter(l=>l.team===team).map(l=>l.session))}

/* ---------- header ---------- */
function renderTeams(){
  const c=$("#grpchip"); c.innerHTML=`${esc(grp().chip||grp().long)} <span>Change</span>`; c.hidden=state.tab==="home"&&!state.open;
  const mb=$("#me-btn"); if(mb){mb.textContent=String(ACCESS.name||"Me").trim().split(/\s+/).map(w=>w[0]).slice(0,2).join("").toUpperCase();mb.setAttribute("aria-current",state.tab==="me"?"page":"false")}
  const pt=$("#tab-players"); if(pt) pt.hidden=!hasScores(grp().prog);
}
document.addEventListener("click",e=>{if(e.target.closest("#grpchip")){location.hash="#home"}});
function setGroup(id){const was=grp().prog;state.team=id;store.set("b2b.team",id);state.player=null;state.scoring=null;
  if(grp().prog!==was){state.open=null;state.players=defaultPlayers()}
  renderTeams();render();}
document.addEventListener("change",e=>{if(e.target.id==="teams")setGroup(e.target.value)});
document.addEventListener("click",e=>{
  const tb=e.target.closest("[data-team]");
  if(tb){const was=grp().prog;state.team=tb.dataset.team;store.set("b2b.team",state.team);
    if(grp().prog!==was){state.open=null;state.players=defaultPlayers()}
    renderTeams();render();return}
  const op=e.target.closest("[data-open]"); if(op){openSession(op.dataset.open);return}
});
function setTab(t){state.tab=t;document.querySelectorAll("nav.tabs a").forEach(a=>a.setAttribute("aria-current",a.dataset.tab===t?"page":"false"))}
const academyToolsTab=document.querySelector("#tab-academy-tools");if(academyToolsTab)academyToolsTab.hidden=!window.B2B_OPERATIONS.isDirector(ACCESS);
const directorTab=document.querySelector("#tab-director");if(directorTab)directorTab.hidden=!window.B2B_OPERATIONS.isDirector(ACCESS);
const TABS=["training-day","match-day","tactics-hub","passports","learning","operations","home","today","syllabus","players","log","develop","calendar","chat","guide","me","coaches","team"];
window.addEventListener("hashchange",()=>{const t=location.hash.slice(1);if(TABS.includes(t)){if(state.coach)closeCoach();state.open=null;state.player=null;if(!(t==="players"&&state.scoring&&state.scoring.session))state.scoring=null;setTab(t);renderTeams();render();window.scrollTo(0,0)}});
function openSession(key){
  const s=ALL_BY_KEY[key]; if(!s) return;
  if(s.prog!==grp().prog){state.team=idsOf(s.prog)[0];store.set("b2b.team",state.team);state.players=defaultPlayers();renderTeams()}
  state.open=key;state.showLog=false;render();window.scrollTo(0,0)
}

/* ---------- views ---------- */
let btbJourneyDispose=null;
function mountCoachLearning(slot){
  import('./b2b-features/director-tools.js?v=42.1').then(async m=>{
    if(!slot.isConnected||state.tab!=='learning')return;
    const stop=await m.mountDirectorTools({root:slot,supabase:window.B2B_SB});if(slot.isConnected&&state.tab==='learning')btbJourneyDispose=stop;else stop();
  }).catch(e=>{if(slot.isConnected)slot.innerHTML='<p role="alert">Learning tools could not load. Please reconnect and try again.</p>';});
}
function render(){
  if(btbJourneyDispose){try{btbJourneyDispose();}catch(e){}btbJourneyDispose=null;}
  const m=$("#main");
  if(state.open){m.innerHTML=sessionView(ALL_BY_KEY[state.open]);bindSession();return}
  if(state.tab==="learning"){
    m.innerHTML='<section class="view"><div id="btb-coach-workspace">Opening your coaching tools…</div></section>';
    mountCoachLearning(m.querySelector('#btb-coach-workspace'));
  }
  else if(state.tab==="operations"){window.B2B_OPERATIONS.mount(m);}
  else if(state.tab==="home"){m.innerHTML=(window.B2B_OPERATIONS.isDirector(ACCESS)?`<section class="view"><a class="card" href="#learning" style="display:block;border:2px solid #d8ff00;padding:20px;text-decoration:none;color:inherit"><p class="eyebrow">PRIVATE DIRECTOR PREVIEW</p><h2>Academy tools →</h2><p>Learning moments · Player journeys · Tactics · Matchday · Family updates · Football routines</p></a></section>`:"")+homeView();bindSyncCard();const hi=$("#hide-install");if(hi)hi.onclick=()=>{store.set("b2b.hideInstall",true);render()};bindNotesFeedback(null);Comms.paintAlerts();Comms.paintNudge();Comms.bindAnn($("#main"));bindWeekAhead();document.querySelectorAll("[data-pick]").forEach(b=>b.onclick=()=>{setGroup(b.dataset.pick);location.hash="#today"})}
  else if(state.tab==="today"){m.innerHTML=todayView();bindToday()}
  else if(state.tab==="syllabus"){m.innerHTML=syllabusView();bindSyllabus()}
  else if(state.tab==="log"){m.innerHTML=logView();bindLog()}
  else if(state.tab==="players"){m.innerHTML=playersView();bindPlayers()}
  else if(state.tab==="coaches"){m.innerHTML=coachesView();bindCoaches()}
  else if(state.tab==="team"){m.innerHTML=teamView();bindTeam()}
  else if(state.tab==="me"){m.innerHTML=meView();bindSyncCard();Comms.paintAlerts();bindNotesFeedback(null)}
  else if(state.tab==="develop"){m.innerHTML=developView();bindDevelop()}
  else if(state.tab==="calendar"){m.innerHTML=calendarView();bindCalendar()}
  else if(state.tab==="chat"){m.innerHTML=chatTabView();bindChatTab()}
  else {m.innerHTML=guideView();document.querySelectorAll("[data-guide]").forEach(b=>b.onclick=()=>{state.guide=b.dataset.guide;render()})}
}

function installHint(){
  const standalone=window.matchMedia("(display-mode: standalone)").matches||navigator.standalone;
  if(standalone||store.get("b2b.hideInstall",false)) return "";
  const ios=/iphone|ipad|ipod/i.test(navigator.userAgent);
  return `<div class="card install"><div><b>Add to your home screen</b><p>${ios?"In Safari, tap the Share button, then <b style='display:inline;font:inherit;text-transform:none;letter-spacing:0'>Add to Home Screen</b>.":"In Chrome, tap ⋮ then <b style='display:inline;font:inherit;text-transform:none;letter-spacing:0'>Add to Home screen</b> or <b style='display:inline;font:inherit;text-transform:none;letter-spacing:0'>Install app</b>."} It then opens like an app and works without signal.</p></div><button class="x" id="hide-install" aria-label="Hide this tip">✕</button></div>`;
}
function homeView(){
  const t=today0(), first=String(ACCESS.name||"Coach").trim().split(/\s+/)[0];
  const row=g=>{const list=PROGS[g.prog].sessions, ni=nextIdx(list), s=ni>=0?list[ni]:null, lbl=g.long.replace(g.short,"").trim()||PROGS[g.prog].name;
    return `<button type="button" class="grow" data-pick="${g.id}" aria-label="Coach ${esc(g.long)}">
      <span class="grow-t"><b>${esc(g.short)}</b><small>${esc(lbl)}${s?` · ${+s.dt===+t?"<em>Today</em>":esc(s.date)}`:""}</small>${s?`<span class="grow-s">${esc(s.title)}</span>`:""}</span>
      <i aria-hidden="true">›</i></button>`};
  return `<section class="view home2">
    <div class="hero2"><span class="hero2-k">${t.toLocaleDateString("en-GB",{weekday:"long",day:"numeric",month:"long"})}</span><h1>Let's go, ${esc(first)}</h1></div>
    ${Comms.nudgeCard()}
    ${homeTiles()}
    ${groupScroller()}
    ${installHint()}
  </section>`;
}
function meView(){
  return `<section class="view">
    <h1 class="page-h">Account</h1>
    ${syncCard()}
    ${Comms.alertsCard()}
    <div class="card mlist">
      <a href="#log">Session log<i aria-hidden="true">›</i></a>
      <a href="#guide">Coaching guide<i aria-hidden="true">›</i></a>
    </div>
    ${feedbackCard(null)}
  </section>`;
}
function seasonBar(){
  const list=P().sessions, ni=nextIdx(list), done=loggedSet(state.team);
  return `<div class="season-bar" aria-hidden="true">${list.map((s,i)=>`<span class="${done.has(s.key)?"done":i===ni?"next":(ni===-1||i<ni)?"past":""}"></span>`).join("")}</div>`;
}
function tagRow(s){
  if(s.prog==="u13") return `<span class="tag">Match-day rules <b>${esc(s.technique)}</b></span><span class="tag">Moment <b>${esc(s.phase)}</b></span><span class="tag">Focus <b>${esc(s.outcome)}</b></span>`;
  if(s.prog==="mastery"||TECHY(s.prog)) return `<span class="tag">Technique <b>${esc(s.technique)}</b></span><span class="tag">Focus <b>${esc(s.focus)}</b></span>`;
  if(s.prog==="dev812") return `<span class="tag">Skill <b>${esc(s.skill)}</b></span><span class="tag">Moment <b>${esc(s.moment)}</b></span><span class="tag">Corner <b>${esc(s.corner)}</b></span>`;
  return s.prog==="dev"
    ? `<span class="tag">Basic <b>${esc(s.skill)}</b></span><span class="tag">Theme <b>${esc(s.theme)}</b></span><span class="tag">Game word <b>${esc(s.word)}</b></span>`
    : `<span class="tag">Technique <b>${esc(s.technique)}</b></span><span class="tag">Phase <b>${esc(s.phase)}</b></span><span class="tag">Outcome <b>${esc(s.outcome)}</b></span>`;
}
function ageRows(s){return Object.entries(s.ages||{}).map(([k,v])=>["Ages "+k,v])}
function adaptFor(s,gid){const g=G(gid);if(TEAMY(g.prog))return s.adapt[g.key];if(g.key)return s.ages[g.key];return ageRows(s).map(([k,v])=>k+": "+v).join("  ·  ")}
function adaptHtml(s,gid){const g=G(gid);if(g.key||TEAMY(g.prog))return `<p>${esc(adaptFor(s,gid))}</p>`;return `<dl class="adapt">${ageRows(s).map(([k,v])=>`<dt>${esc(k.replace("Ages ",""))}</dt><dd>${esc(v)}</dd>`).join("")}</dl>`}
const homeLabel=s=>s.prog==="mastery"||TECHY(s.prog)?"Home practice":"Home challenge";
const PFX={u13:"U13 ",team:"",dev:"Dev 4-7 ",dev812:"Dev 8-12 ",mastery:"Mastery ",tech:"Technical 10-14 ",tech5:"Technical 4-7 "};
function dlName(s){return `Box to Box ${PFX[s.prog]}B${s.block}W${s.week} ${s.date} ${state.team.replace(/\//g,"-")}.pdf`}

function todayView(){
  const list=P().sessions, ni=nextIdx(list), g=grp();
  if(ni===-1) return `<section class="view"><div class="hero"><div class="when">Season complete</div><h1>That's a wrap on 2026–27</h1><p>All 48 sessions are done. The syllabus and log stay here for the review.</p></div></section>`;
  const s=list[ni];
  const isToday=+s.dt===+today0(), days=Math.round((s.dt-today0())/864e5);
  const done=loggedSet(state.team).size, last=ni>0?list[ni-1]:null, lastLogged=last&&loggedSet(state.team).has(last.key);
  return `<section class="view">
    <div class="hero">
      <div class="when">${isToday?"Today":days===1?"Tomorrow":"Next "+s.dt.toLocaleDateString("en-GB",{weekday:"long"})+" · in "+days+" days"} · ${esc(s.long)}</div>
      <div class="eyebrow" style="color:var(--on-bar);opacity:.7">${P().short} · Block ${BLOCK_WORD[s.block]} · Week ${s.week} of 8 · ${P().hours}</div>
      <h1>${esc(s.title)}</h1>
      <div class="tags">${tagRow(s)}</div>
      <div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn primary" data-open="${s.key}">Open session plan</button><button class="btn" id="coach-hero">▶ Coach mode</button>${state.dlOk?`<button class="btn" style="border-color:var(--lime);color:var(--lime)" id="dl-hero">Download PDF</button>`:""}</div>
    </div>
    <div class="card box"><div class="eyebrow">Session objective</div><p style="margin:0;font-weight:600">${esc(s.objective)}</p></div>
    <div class="card box">
      <h2>${esc(g.long)} this week <span class="muted" style="font-weight:600">· ${esc(g.fmt)}</span></h2>
      <div style="margin:0">${adaptHtml(s,g.id)}</div>
      <div class="home" style="padding:0"><span class="ic">H</span><div><div class="eyebrow">${homeLabel(s)}</div>${esc(s.home)}</div></div>
    </div>
    ${last?`<div class="card box">
      <h2>Last session</h2>
      <p style="margin:0"><button type="button" class="linkbtn" data-open="${last.key}">${esc(last.date)} · ${esc(last.title)}</button></p>
      ${lastLogged?`<p class="muted" style="margin:0">Logged for ${esc(g.long)}.</p>`:`<p class="muted" style="margin:0">Not logged for ${esc(g.long)} yet.</p><div><button class="btn small" data-logfor="${last.key}">Log it now</button></div>`}
    </div>`:""}
    <div class="card box">
      <div style="display:flex;justify-content:space-between;align-items:baseline;gap:10px;flex-wrap:wrap"><h2>Season so far</h2><span class="muted">${done} of 48 logged for ${esc(g.long)}</span></div>
      ${seasonBar()}
    </div>
  </section>`;
}
function bindToday(){
  document.querySelectorAll("[data-logfor]").forEach(b=>b.onclick=()=>{openSession(b.dataset.logfor);state.showLog=true;render();setTimeout(()=>$("#logform")?.scrollIntoView({block:"start"}),0)});
  const ch=$("#coach-hero"); if(ch) ch.onclick=()=>openCoach(P().sessions[nextIdx()]);
  const h=$("#dl-hero"); if(h){const s=P().sessions[nextIdx()];h.onclick=()=>downloadPdf([s],dlName(s),h)}
}

const NUM_TEAM=[[12,"ok","12 or more · run as written","Use the full session plan above."],[8,"mid","8 to 11 players","Reduce team practices by one player per side, shrink areas by about a quarter, and use one neutral player to keep overloads."],[4,"low","Fewer than 8 · this week's low-numbers plan",null],[0,"low","Fewer than 4 players","Join an adjacent age group for the opposed parts, or run a technical clinic with high repetitions, 1v1 challenges and shooting."]];
const NUM_DEV=[[10,"ok","10 or more · run as written","Run the session as written, with two mini-match pitches."],[6,"mid","6 to 9 children","Reduce the area, use one mini-match pitch and make the coach a helper or chaser."],[3,"low","Fewer than 6 · this week's low-numbers plan",null],[0,"low","Fewer than 3 children","Run a fun skills clinic: lots of repetitions, races and shooting, with parents invited to join in."]];
const NUM_MASTERY=[[10,"ok","10 or more · run as written","Run the session as written."],[6,"mid","6 to 9 players","One mastery game pitch; smaller areas; rotate defenders more often."],[3,"low","Fewer than 6 · this week's low-numbers plan",null],[0,"low","Fewer than 3 players","Run an individual mastery clinic: extended routine, technique reps, testing and personal coaching."]];
const NUM_TECH=[[10,"ok","10 or more · run as written","Run the session as written."],[6,"mid","6 to 9 players","Combine variable and opposed practices; one area; coach as a neutral."],[3,"low","Fewer than 6 · this week's low-numbers plan",null],[0,"low","Fewer than 3 players","Individual technical clinic: extra closed repetitions, video feedback and full benchmark testing."]];
const NUM_D812=[[10,"ok","10 or more · run as written","Run the session as written, with two small-sided pitches if you have 12 or more."],[6,"mid","6 to 9 players","One area for each practice; coach joins as a neutral to keep numbers even."],[3,"low","Fewer than 6 · this week's low-numbers plan",null],[0,"low","Fewer than 3 players","Run a skills clinic: extra technical reps, 1v1s with the coach and shooting."]];
const NUMS={u13:NUM_TEAM,team:NUM_TEAM,dev:NUM_DEV,dev812:NUM_D812,mastery:NUM_MASTERY,tech:NUM_TECH,tech5:NUM_TECH};
function numbersPlan(n,s){
  const r=NUMS[s.prog].find(x=>n>=x[0]);
  return `<div class="plan-note ${r[1]}"><b>${r[2]}</b>${esc(r[3]??s.low)}</div>`;
}

function splitPts(t){return String(t||"").split(/;\s*|\.\s+(?=[A-Z])/).map(x=>x.trim().replace(/\.$/,"")).filter(Boolean).map(x=>x[0].toUpperCase()+x.slice(1))}
function ptsOf(p){return p.detail&&p.detail.points&&p.detail.points.length?p.detail.points:splitPts(p.points)}
function partCard(p,fmt){
  const d=p.detail;
  return `<li class="card part">
    <div class="part-top"><span class="pn">${p.i+1}</span><div class="ph"><h3>${esc(p.name)}</h3><div class="pmeta">${fmt(p.start)} · ${p.mins} min${d&&d.type?` · <b>${esc(d.type)}</b>`:""}</div></div></div>
    <p class="ptext">${esc(p.practice)}</p>
    ${d&&d.svg?`<div class="dia">${d.svg}</div>`:""}
    <div class="cp"><h4>Coaching points</h4><ul>${ptsOf(p).map(x=>`<li>${esc(x)}</li>`).join("")}</ul></div>
    ${d&&d.area?`<details class="pd"><summary>Set-up, progress and key questions</summary><div class="more">
      <dl class="org"><dt>Area</dt><dd>${esc(d.area)}</dd><dt>Players</dt><dd>${esc(d.players)}</dd><dt>Kit</dt><dd>${esc(d.equipment)}</dd><dt>Harder</dt><dd>${esc(d.progress)}</dd><dt>Easier</dt><dd>${esc(d.regress)}</dd><dt>Ask</dt><dd>${esc(d.questions)}</dd></dl>
    </div></details>`:""}
  </li>`;
}
function practiceDetail(d){
  if(!d) return "";
  return `<details class="pd"><summary>Diagram, set-up and progressions</summary><div class="more">
    ${d.svg?`<div class="dia" role="img" aria-label="Practice diagram">${d.svg}</div>`:""}
    <dl class="org"><dt>Area</dt><dd>${esc(d.area)}</dd><dt>Players</dt><dd>${esc(d.players)}</dd><dt>Equipment</dt><dd>${esc(d.equipment)}</dd></dl>
    <div class="pcols">
      <div><h4>Coaching points</h4><ul>${d.points.map(p=>`<li>${esc(p)}</li>`).join("")}</ul></div>
      <div><div><h4>Progress</h4><p>${esc(d.progress)}</p></div><div><h4>Regress</h4><p>${esc(d.regress)}</p></div></div>
      <div><h4>Key questions</h4><p>${esc(d.questions)}</p></div>
    </div></div></details>`;
}

function sessionView(s){
  if(!ACCESS.admin&&!dayPrepReady(prepRec(s.key)))return dayLockedSession(s);
  const list=PROGS[s.prog].sessions, ids=idsOf(s.prog);
  let t=0; const fmt=m=>`${Math.floor(m/60)}:${String(m%60).padStart(2,"0")}`;
  const parts=s.plan.map((p,i)=>{const start=t;t+=p.mins||0;return {...p,start,i}});
  const done=state.logs.filter(l=>l.session===s.key);
  return `<section class="view">
    <button class="btn small ghost back" id="back">← Back</button>
    <div class="sess-head">
      <div class="eyebrow">${PROGS[s.prog].short} · Block ${BLOCK_WORD[s.block]} · Week ${s.week} of 8 · ${esc(s.long)} · ${PROGS[s.prog].hours}</div>
      <h1>${esc(s.title)}</h1>
      <div class="tags">${tagRow(s)}</div>
    </div>
    <div class="objective"><div class="eyebrow">Session objective</div>${esc(s.objective)}</div>
    ${s.model?`<div class="card box"><div class="eyebrow">Technical model</div><p style="margin:0">${esc(s.model)}</p></div>`:""}
    <div class="mygrp"><div class="eyebrow">${esc(grp().long)} · ${esc(grp().fmt)}${grp().key||TEAMY(grp().prog)?"":" · adapting for age"}</div>${adaptHtml(s,state.team)}</div>
    <div class="actions"><button class="btn primary big" id="coach-start">▶ Start coach mode</button>${state.dlOk?`<button class="btn big ghost" id="dl-one">Download PDF</button>`:""}</div>
    <div class="clock" aria-label="Session timeline, ${t} minutes">${parts.map(p=>`<div style="flex:${p.mins}" title="${esc(p.name)} ${p.mins} min">${p.mins}′</div>`).join("")}</div>
    <ol class="parts">${parts.map(p=>partCard(p,fmt)).join("")}</ol>
    <div class="grid2">
      ${ids.length>1?`<div class="card box">
        <h2>${TEAMY(s.prog)?"Other teams":"Other age group"}</h2>
        <dl class="adapt">${ids.filter(id=>id!==state.team).map(id=>`<dt>${esc(TEAMY(s.prog)?G(id).short:G(id).key)}</dt><dd>${esc(adaptFor(s,id))}</dd>`).join("")}</dl>
      </div>`:""}
      <div class="card box numbers">
        <h2>${s.prog==="dev"?"Children":"Players"} present</h2>
        <div class="stepper"><button type="button" id="pm" aria-label="One fewer">−</button><output id="pn" aria-live="polite">${state.players}</output><button type="button" id="pp" aria-label="One more">+</button></div>
        <div id="pnote">${numbersPlan(state.players,s)}</div>
      </div>
    </div>
    <div class="card home"><span class="ic">H</span><div><div class="eyebrow">${homeLabel(s)}</div>${esc(s.home)}</div></div>
    ${s.benchmark?`<div class="card home"><span class="ic">B</span><div><div class="eyebrow">This week's benchmark</div>${esc(s.benchmark)}</div></div>`:""}
    ${s.review?`<div class="card home"><span class="ic">R</span><div><div class="eyebrow">Block review</div>${esc(s.review.replace(/^(Block|Season) review:\s*/,""))}</div></div>`:""}
    ${hasScores(s.prog)?`<div class="card box"><h2>Player scores</h2><p class="muted" style="margin:0">${testsForSession(s).length?(TECHY(s.prog)&&s.week!==8?"Record this week's benchmark: "+esc(s.benchmark.split(";")[0]):"Mastery check this week: "+esc(testsForSession(s).map(t=>t.name).join(", "))):"Record any test score for your players."}</p><div><button class="btn" data-recfor="${s.key}">Record scores</button></div></div>`:""}
    ${notesCard(s)}
    <div class="card form" id="logform">
      <div style="display:flex;justify-content:space-between;align-items:baseline;gap:10px;flex-wrap:wrap">
        <h2 class="sec-title" style="font-size:22px">Log this session</h2>
        <span class="muted" style="font-size:14px">${done.length?`Logged for ${[...new Set(done.map(l=>G(l.team).long))].join(", ")}`:"Not logged yet"}</span>
      </div>
      ${state.showLog?logForm(s):`<div><button class="btn" id="log-open">Log this session</button></div>`}
    </div>
    ${feedbackCard(s)}
    <div class="pager">
      ${s.idx>0?`<button class="btn small ghost" data-open="${list[s.idx-1].key}">← Wk ${list[s.idx-1].week} · ${esc(list[s.idx-1].date)}</button>`:"<span></span>"}
      ${s.idx<47?`<button class="btn small ghost" data-open="${list[s.idx+1].key}">Wk ${list[s.idx+1].week} · ${esc(list[s.idx+1].date)} →</button>`:""}
    </div>
  </section>`;
}

function logForm(s){
  
  const dev=s.prog==="dev", ids=idsOf(s.prog);
  const existing=state.logs.find(l=>l.session===s.key&&l.team===state.team&&l.coach&&l.coach===coachId());
  return `<form id="lf" class="form" style="padding:0">
    <div class="row3">
      <div class="field"><label for="lf-team">Group</label><select id="lf-team">${ids.map(id=>`<option value="${id}" ${id===state.team?"selected":""}>${esc(G(id).long)}</option>`).join("")}</select></div>
      <div class="field"><label for="lf-date">Date</label><input type="date" id="lf-date" value="${s.iso}"></div>
      <div class="field"><label for="lf-n">${dev?"Children":"Players"}</label><input type="number" id="lf-n" min="0" max="40" inputmode="numeric" value="${state.players}"></div>
    </div>
    <div class="field"><label for="lf-coach">Coach</label><input type="text" id="lf-coach" autocomplete="name" placeholder="Your name" value="${esc(state.coachName)}"></div>
    <div class="field"><span class="lbl" id="lf-ach-l">Objective achieved?</span>
      <div class="seg" role="radiogroup" aria-labelledby="lf-ach-l">${["Yes","Partly","No"].map(v=>`<label><input type="radio" name="ach" value="${v}" ${v==="Yes"?"checked":""}><span>${v}</span></label>`).join("")}</div></div>
    <div class="field"><label for="lf-ev">${dev?"Did every child have a ball, stay active and smile?":"What evidence did you see?"}</label><textarea id="lf-ev" placeholder="${dev?"e.g. Everyone had a ball; two children needed a hand joining the traffic jam game.":"e.g. Most players received on the back foot in the rondo; GK found the free player in the game."}"></textarea></div>
    <div class="row3" style="grid-template-columns:1fr 1fr">
      <div class="field"><label for="lf-keep">One thing to keep</label><input type="text" id="lf-keep"></div>
      <div class="field"><label for="lf-change">One thing to change</label><input type="text" id="lf-change"></div>
    </div>
    <div class="field"><label for="lf-players">${dev?"Children who need it easier or harder":"Players needing a different challenge"}</label><span class="hint">Use first names or initials only.</span><input type="text" id="lf-players"></div>
    <div class="field"><label for="lf-int">${dev?"Was the week's basic clear in every game?":"Interventions that worked"}</label><input type="text" id="lf-int"></div>
    ${existing?`<div class="notice">You've already logged this session for ${esc(grp().long)}. Saving adds another entry.</div>`:""}
    <div><button class="btn primary" type="submit" id="lf-save" ${state.dbOk===null?"disabled":""}>${state.dbOk===null?"Connecting…":"Save to log"}</button></div>
  </form>`;
}

function bindSession(){
  const s=ALL_BY_KEY[state.open];
  $("#back").onclick=()=>{state.open=null;render();window.scrollTo(0,0)};
  const upd=d=>{state.players=Math.max(0,Math.min(30,state.players+d));$("#pn").textContent=state.players;$("#pnote").innerHTML=numbersPlan(state.players,s);const n=$("#lf-n");if(n)n.value=state.players};
  $("#pm").onclick=()=>upd(-1); $("#pp").onclick=()=>upd(1);
  const f=$("#lf"); if(f) f.onsubmit=e=>{e.preventDefault();saveLog(s)};
  const d1=$("#dl-one"); if(d1) d1.onclick=()=>downloadPdf([s],dlName(s),d1);
  const lo=$("#log-open"); if(lo) lo.onclick=()=>{state.showLog=true;render();setTimeout(()=>$("#logform")?.scrollIntoView({block:"start"}),0)};
  $("#coach-start").onclick=()=>openCoach(s);
  bindNotesFeedback(s);
  document.querySelectorAll("[data-recfor]").forEach(b=>b.onclick=()=>startScoring(b.dataset.recfor));
}

/* ---------- coach mode ---------- */
let wake=null;
function startScoring(key){const s=ALL_BY_KEY[key];if(s&&s.prog!==grp().prog)return;state.open=null;state.player=null;state.scoring={session:key};state._fromSession=true;if(location.hash!=="#players")location.hash="#players";setTab("players");renderTeams();render();window.scrollTo(0,0)}
function openCoach(s){
 if(!ACCESS.admin&&!dayPrepReady(prepRec(s.key))){toast("Complete Learn it and score 70% first.");return;}
  state.coach={key:s.key,i:0,left:s.plan[0].mins*60,run:false};
  document.body.classList.add("locked"); $("#coach").hidden=false;
  try{navigator.wakeLock&&navigator.wakeLock.request("screen").then(w=>wake=w).catch(()=>{})}catch(e){}
  drawCoach();
}
function closeCoach(){clearInterval(state.tick);state.coach=null;$("#coach").hidden=true;document.body.classList.remove("locked");try{wake&&wake.release()}catch(e){}wake=null}
function mmss(n){const a=Math.abs(n);return (n<0?"+":"")+Math.floor(a/60)+":"+String(a%60).padStart(2,"0")}
function drawCoach(){
  const c=state.coach, s=ALL_BY_KEY[c.key], n=s.plan.length;
  const fin=c.i>=n;
  const p=fin?null:s.plan[c.i], d=p&&p.detail;
  $("#coach").innerHTML=`<div class="coach-top"><button class="x" id="cx" aria-label="Close coach mode">✕</button>
    <div class="dots">${s.plan.map((_,k)=>`<span class="${k===c.i?"on":k<c.i?"done":""}"></span>`).join("")}</div></div>
    <div class="coach-body">${fin?`
      <div class="kick">Session complete</div><h2>Nice work, coach</h2>
      <div class="cp"><h4>2-minute review</h4><ul><li>Was the objective achieved?</li><li>One thing to keep, one thing to change</li><li>Who needs a different challenge next week?</li></ul></div>
      <div class="actions"><button class="btn primary big" id="c-log">Log this session</button>${hasScores(s.prog)&&testsForSession(s).length?`<button class="btn big" style="border-color:var(--lime);color:var(--lime)" id="c-scores">Record scores</button>`:""}</div>
      <div class="ks"><h4>${homeLabel(s)}</h4><p>${esc(s.home)}</p></div>${s.benchmark?`<div class="ks"><h4>Record the benchmark</h4><p>${esc(s.benchmark)}</p></div>`:""}`:`
      <div class="kick">Part ${c.i+1} of ${n}${d&&d.type?" · "+esc(d.type):""}</div>
      <h2>${esc(p.name)}</h2>
      <div class="timer"><output id="c-t" class="${c.left<=0?"up":""}">${mmss(c.left)}</output>
        <button class="btn ${c.run?"":"primary"}" id="c-go">${c.run?"Pause":c.left===p.mins*60?"Start "+p.mins+" min":"Resume"}</button>
        <button class="btn small ghost" id="c-reset" style="border-color:#ffffff40;color:var(--on-bar)">Reset</button></div>
      <p class="ptext">${esc(p.practice)}</p>
      ${d&&d.svg?`<div class="dia">${d.svg}</div>`:""}
      <div class="cp"><h4>Coaching points</h4><ul>${ptsOf(p).map(x=>`<li>${esc(x)}</li>`).join("")}</ul></div>
      ${d&&d.questions?`<div class="ks"><h4>Ask the players</h4><p>${esc(d.questions)}</p></div>`:""}
      ${c.i===n-1||c.i===2?`<div class="mine"><b>${esc(grp().long)}</b>${adaptHtml(s,state.team)}</div>`:""}
      ${d&&d.progress?`<div class="ks"><h4>Too easy / too hard?</h4><p><b>Harder:</b> ${esc(d.progress)}<br><b>Easier:</b> ${esc(d.regress)}</p></div>`:""}`}
    </div>
    <div class="coach-nav"><button class="btn" id="c-prev" ${c.i===0?"disabled":""}>← Back</button>${fin?`<button class="btn primary" id="c-done">Finish</button>`:`<button class="btn primary" id="c-next">${c.i===n-1?"Finish":"Next →"}</button>`}</div>`;
  $("#cx").onclick=closeCoach;
  const go=(i)=>{clearInterval(state.tick);c.i=i;c.run=false;c.left=i<n?s.plan[i].mins*60:0;drawCoach();$(".coach-body").scrollTop=0};
  $("#c-prev").onclick=()=>go(c.i-1);
  if($("#c-next")) $("#c-next").onclick=()=>go(c.i+1);
  if($("#c-done")) $("#c-done").onclick=closeCoach;
  if($("#c-scores")) $("#c-scores").onclick=()=>{closeCoach();startScoring(s.key)};
  if($("#c-log")) $("#c-log").onclick=()=>{closeCoach();state.showLog=true;render();setTimeout(()=>$("#logform")?.scrollIntoView({block:"start"}),0)};
  if($("#c-reset")) $("#c-reset").onclick=()=>{clearInterval(state.tick);c.run=false;c.left=p.mins*60;drawCoach()};
  if($("#c-go")) $("#c-go").onclick=()=>{
    if(c.run){clearInterval(state.tick);c.run=false;drawCoach();return}
    c.run=true;drawCoach();
    state.tick=setInterval(()=>{c.left--;const o=$("#c-t");if(o){o.textContent=mmss(c.left);o.classList.toggle("up",c.left<=0)}
      if(c.left===0){try{navigator.vibrate&&navigator.vibrate([300,150,300])}catch(e){}}},1000);
  };
}

async function saveLog(s){
  const db=window._db; if(!db) return;
  const btn=$("#lf-save"); btn.disabled=true; btn.textContent="Saving…";
  const rec={session:s.key,sessionTitle:s.title,prog:s.prog,programme:PROGS[s.prog].name,teamName:G($("#lf-team").value).long,team:$("#lf-team").value,date:$("#lf-date").value||s.iso,players:Math.max(0,parseInt($("#lf-n").value)||0),
    achieved:(document.querySelector('input[name=ach]:checked')||{}).value||"Yes",
    evidence:$("#lf-ev").value.trim(),keep:$("#lf-keep").value.trim(),change:$("#lf-change").value.trim(),
    challenge:$("#lf-players").value.trim(),interventions:$("#lf-int").value.trim(),
    coach:coachId(),coachName:($("#lf-coach")&&$("#lf-coach").value.trim())||state.coachName||"",createdAt:new Date().toISOString()};
  setCoachName(rec.coachName);
  try{
    await db.collection("logs").add(rec);
    toast("Saved to log");
    state.open=null; location.hash="#log"; setTab("log"); render(); window.scrollTo(0,0);
  }catch(err){
    btn.disabled=false; btn.textContent="Save to log";
    toast(err&&err.code==="quota_exceeded"?"The log is full. Delete old entries, then save again.":err&&err.code==="invalid_argument"?"You don't have permission to save logs on this page.":"Couldn't save. Check your connection and try again.");
  }
}

function syllabusView(){
  const current=prepList().find(x=>x.s.prog===grp().prog);if(!ACCESS.admin&&current&&!dayPrepReady(prepRec(current.s.key)))return `<section class="view"><h1 class="page-h">Your session prep</h1><p>Complete Learn it and score 70% to unlock this week’s full syllabus.</p></section>`+prepView();
  const pr=P(), list=pr.sessions, ni=nextIdx(list), done=loggedSet(state.team), g=grp();
  return `<section class="view">
    <div style="display:flex;flex-direction:column;gap:6px">
      <div class="eyebrow">${pr.name} · 48 ${pr.day}</div>
      <h1 class="sec-title" style="font-size:34px">${esc(PROG_INFO[g.prog].title)} 2026–27</h1>
      ${seasonBar()}
    </div>
    ${sylTabs(pr,list,ni)}
    ${pr.blocks.filter(b=>b.n===sylBlock(pr,list,ni)).map(b=>`<article class="card block">
      <div class="block-head">
        <div class="num">Block ${BLOCK_WORD[b.n]} · ${esc(b.dates)}</div>
        <h2>${esc(b.name)}</h2>
        <p class="muted">${esc(b.aim)}</p>
        ${state.dlOk?`<div><button class="btn small ghost" data-dlblock="${b.n}">Download block PDF · ${esc(g.long)}</button></div>`:""}
        <details class="corners"><summary>Four-corner targets</summary><dl>${b.c.map(c=>`<dt>${esc(c[0])}</dt><dd>${esc(c[1])}</dd>`).join("")}</dl></details>
      </div>
      <ul class="weeks">${list.filter(s=>s.block===b.n).map(s=>{
        const st=done.has(s.key)?'<span class="state done">✓ Logged</span>':s.idx===ni?'<span class="state next">Next</span>':(ni===-1||s.idx<ni)?'<span class="state past">Past</span>':'';
        return `<li class="${s.idx===ni?"is-next":""}"><button type="button" data-open="${s.key}">
          <span class="wk">${s.week}<small>${esc(s.date)}</small></span>
          <span class="wt"><div>${esc(s.title)}</div><div>${s.prog==="dev"?esc(s.skill)+" · “"+esc(s.word)+"”":s.prog==="u13"?esc(s.technique)+" · "+esc(s.phase):TEAMY(s.prog)?esc(s.technique)+" · "+esc(s.phase):esc(s.technique)+" · "+esc(s.focus)}</div></span>
          ${st||"<span></span>"}</button></li>`}).join("")}</ul>
    </article>`).join("")}
  </section>`;
}
function bindSyllabus(){
  document.querySelectorAll("[data-sylb]").forEach(b=>b.onclick=()=>{state.sylB=state.sylB||{};state.sylB[grp().prog]=+b.dataset.sylb;render();});
  document.querySelectorAll("[data-dlblock]").forEach(b=>b.onclick=()=>{const n=+b.dataset.dlblock;downloadPdf(P().sessions.filter(s=>s.block===n),`Box to Box ${PFX[grp().prog]}Block ${BLOCK_WORD[n]} ${state.team.replace(/\//g,"-")}.pdf`,b)});
}

function logView(){
  let list=state.logs.slice(); const f=state.logFilter;
  if(GROUPS.some(g=>g.id===f)) list=list.filter(l=>l.team===f);
  if(f==="mine") list=list.filter(l=>l.coach&&l.coach===coachId());
  list.sort((a,b)=>(b.date||"").localeCompare(a.date||"")||(b.createdAt||"").localeCompare(a.createdAt||""));
  const chips=[["all","All groups"],...GROUPS.map(g=>[g.id,g.long]),["mine","My entries"]];
  const fmtD=iso=>{if(!iso)return"";const [y,m,d]=iso.split("-");return new Date(+y,+m-1,+d).toLocaleDateString("en-GB",{day:"numeric",month:"short",year:"numeric"})};
  let body;
  if(false) body=`<div class="card empty">The shared log isn't available in this view. Open the page signed in to claude.ai with access from the Box to Box admin.</div>`;
  else if(!state.logsReady) body=`<div class="card empty">Loading the coaches' log…</div>`;
  else if(!list.length) body=`<div class="card empty">${state.logs.length?"No entries match this filter.":"No sessions logged yet. Open a session and use <b>Log this session</b> at the bottom of the plan."}</div>`;
  else body=`<div class="entries">${list.map(l=>{const s=ALL_BY_KEY[l.session];const p=state.profiles[l.coach];const mine=l.coach&&l.coach===coachId();const name=l.coachName||(p&&p.name)||(mine?"You":"A coach");
    const notes=[["Evidence",l.evidence],["Keep",l.keep],["Change",l.change],["Challenge",l.challenge],[s&&s.prog==="dev"?"Basic clear":"Worked",l.interventions]].filter(x=>x[1]);
    return `<article class="card entry">
      <div class="entry-top"><span class="tm">${esc(G(l.team).long)}</span><h3>${s?`<button type="button" class="linkbtn" data-open="${s.key}">${esc(s.title)}</button>`:esc(l.session)}</h3><span class="pill ${esc(l.achieved)}">${esc(l.achieved)}</span></div>
      <div class="meta"><span>${esc(fmtD(l.date))}</span>${s?`<span>${PROGS[s.prog].short} · Block ${s.block} · Wk ${s.week}</span>`:""}<span><b>${+l.players||0}</b> ${s&&s.prog==="dev"?"children":"players"}</span><span>${esc(name)}</span></div>
      ${notes.length?`<dl class="notes">${notes.map(([k,v])=>`<dt>${k}</dt><dd>${esc(v)}</dd>`).join("")}</dl>`:""}
      ${mine?(state.confirmDel===l.id?`<div class="confirm">Delete this entry? <button class="btn small" data-del="${l.id}">Delete</button><button class="btn small ghost" data-cancel>Keep</button></div>`:`<div><button class="btn small ghost" data-askdel="${l.id}">Delete</button></div>`):""}
    </article>`}).join("")}</div>`;
  const att=list.length?Math.round(list.reduce((a,l)=>a+(+l.players||0),0)/list.length):0, ach=list.filter(l=>l.achieved==="Yes").length;
  return `<section class="view">
    <div style="display:flex;flex-direction:column;gap:6px">
      <div class="eyebrow syncline">${esc(syncText())}</div>
      <h1 class="sec-title" style="font-size:34px">Session log</h1>
      ${list.length?`<p class="muted" style="margin:0">${list.length} ${list.length===1?"entry":"entries"} · average ${att} attending · objective met in ${ach} of ${list.length}</p>`:""}
    </div>
    ${state.logs.length&&!Sync.on()?`<div class="actions"><button class="btn" id="log-share">Send log to head coach</button></div><p class="muted" style="margin:0;font-size:14px">Creates a spreadsheet file (CSV) you can send by WhatsApp or email.</p>`:""}
    <div class="filters" role="group" aria-label="Filter log">${chips.map(([k,v])=>`<button class="chip" aria-pressed="${f===k}" data-filter="${k}">${esc(v)}</button>`).join("")}</div>
    ${body}
    ${feedbackList()}
  </section>`;
}
function logCsv(){
  const cols=[["Date","date"],["Group","team"],["Programme","prog"],["Block","b"],["Week","w"],["Session","t"],["Coach","coachName"],["Attending","players"],["Objective achieved","achieved"],["Evidence","evidence"],["Keep","keep"],["Change","change"],["Players to note","challenge"],["Interventions / basic clear","interventions"]];
  const q=v=>'"'+String(v??"").replace(/"/g,'""')+'"';
  const rows=state.logs.slice().sort((a,b)=>(a.date||"").localeCompare(b.date||"")).map(l=>{const s=ALL_BY_KEY[l.session]||{};const r={...l,b:s.block,w:s.week,t:s.title,prog:s.prog?PROGS[s.prog].name:"",team:G(l.team).long};return cols.map(c=>q(r[c[1]])).join(",")});
  return "\ufeff"+cols.map(c=>q(c[0])).join(",")+"\n"+rows.join("\n");
}
function bindLog(){
  const ls=$("#log-share"); if(ls) ls.onclick=async()=>{try{const nm=(state.coachName||"coach").replace(/[^\w -]/g,"");await window._dl.save({filename:`Box to Box log ${nm} ${new Date().toISOString().slice(0,10)}.csv`,data:logCsv()})}catch(e){}};
  document.querySelectorAll("[data-filter]").forEach(b=>b.onclick=()=>{state.logFilter=b.dataset.filter;render()});
  document.querySelectorAll("[data-askdel]").forEach(b=>b.onclick=()=>{state.confirmDel=b.dataset.askdel;render()});
  document.querySelectorAll("[data-cancel]").forEach(b=>b.onclick=()=>{state.confirmDel=null;render()});
  document.querySelectorAll("[data-del]").forEach(b=>b.onclick=async()=>{b.disabled=true;try{await window._db.collection("logs").doc(b.dataset.del).delete();state.confirmDel=null;toast("Entry deleted")}catch(e){toast("Couldn't delete that entry.");b.disabled=false}});
}

/* ---------- guide ---------- */
function guideView(){
  const which=(state.guide&&PROG_ORDER.includes(state.guide))?state.guide:grp().prog;
  const sw=`<div class="switch" role="group" aria-label="Which syllabus">${[["dev","Development 4–7"],["dev812","Development 8–12"],["tech5","Technical 4–7"],["tech","Technical 10–14"],["mastery","Ball Mastery 7–12"],["team","Team"],["u13","U13 Elite"]].filter(([k])=>PROG_ORDER.includes(k)).map(([k,v])=>`<button class="chip" aria-pressed="${which===k}" data-guide="${k}">${v}</button>`).join("")}</div>`;
  return which==="dev"?devGuide(sw):which==="dev812"?dev812Guide(sw):which==="mastery"?masteryGuide(sw):which==="tech"?techGuide(sw):which==="tech5"?tech5Guide(sw):which==="u13"?u13Guide(sw):teamGuide(sw);
}
function table(head,rows,numCol){return `<div class="card tbl-wrap"><table><thead><tr>${head.map(h=>`<th>${h}</th>`).join("")}</tr></thead><tbody>${rows.map(r=>`<tr>${r.map((c,i)=>`<td${i===0&&numCol?' class="n"':""}>${c}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`}

function masteryGuide(sw){
  return `<section class="view">
    <div><div class="eyebrow">Coaching guide · Tuesday Ball Mastery · Ages 7–12</div><h1 class="sec-title" style="font-size:34px">Master the ball</h1></div>${sw}
    <p style="margin:0;max-width:62ch">One aim: make every player excellent with the ball at their feet, on both feet, at speed. Mastery comes from thousands of quality touches, so every player has a ball and as many repetitions as possible, then tests the skill against opponents and in games.</p>
    <h2 class="sec-title">Season overview</h2>
    ${table(["Block","Theme","Mastery focus"],[["One","<b>Foundation Mastery</b>","Sole, inside and outside control, both feet, head up"],["Two","<b>Moves to Beat a Player</b>","Feint, step-over, scissors, Matthews, chop, croqueta"],["Three","<b>Turns and Escapes</b>","Hooks, drag-back, Cruyff, step-over turn, shielding"],["Four","<b>First Touch and Receiving</b>","Every surface, directional touch, one-touch play"],["Five","<b>Striking the Ball</b>","Passing range, shooting, volleys"],["Six","<b>Mastery in the Game</b>","1v1s, disguise, freestyle, Gold mastery"]])}
    <p class="muted" style="margin:0">Week 8 of every block is a mastery check where players test and record their personal bests.</p>
    <h2 class="sec-title">Every session · 60 minutes</h2>
    ${table(["Min","Part","Purpose"],[[10,"<b>Ball mastery routine</b><br><span class='muted'>Ball each: a set routine of touches building through the season.</span>","Thousands of touches; the same routine shows progress."],[15,"<b>Technique focus</b><br><span class='muted'>Unopposed, high-repetition practice on both feet.</span>","Learn the correct technique."],[15,"<b>Application (opposed)</b><br><span class='muted'>1v1 or small groups against a defender.</span>","Use the technique under pressure."],[15,"<b>Mastery game</b><br><span class='muted'>2v2 to 4v4 with a rule that rewards the technique.</span>","Use the skill in a game."],[5,"<b>Review and home practice</b><br><span class='muted'>Best rep shown, scores recorded, home practice set.</span>","Reflect and keep practising at home."]],true)}
    <div class="card box"><h2>How we coach ball mastery</h2><ul class="tight">
      <li><b>Ball each, maximum touches.</b> No queues; every player active all session.</li>
      <li><b>Both feet, every week.</b> Every technique on the weaker foot too.</li>
      <li><b>Quality, then speed.</b> Master the movement slowly, then add speed, then pressure.</li>
      <li><b>Demonstrate and go.</b> Under a minute, then practise.</li>
      <li><b>Count and compete.</b> Timed challenges and personal bests.</li>
      <li><b>Praise effort and creativity.</b> Try new moves without fear of mistakes.</li></ul></div>
    <h2 class="sec-title">Adapting for age</h2>
    ${table(["Age","How the session changes"],[["<b>7–9</b>","Slower pace, bigger areas, passive defenders, more games and stories."],["<b>10–12</b>","Faster tests, smaller areas, active defenders, weaker-foot targets."]])}
    <h2 class="sec-title">Low numbers</h2>
    ${table(["Players","Plan"],[["10+","Run as written."],["6–9","One mastery game pitch; smaller areas; rotate defenders more often."],["&lt;6","Use that week's low-numbers plan: coach defends; games become 1v1 or 2v2."],["&lt;3","Individual mastery clinic: extended routine, technique reps, testing and personal coaching."]],true)}
    <h2 class="sec-title">Mastery levels</h2>
    ${table(["Test","Bronze","Silver","Gold"],[["Sole rolls in 30 s (each foot)","30","45","60"],["Foundation taps in 30 s","40","60","80"],["Slalom, 8 cones, both feet","Completes","Under 15 s","Under 12 s"],["Keep-ups (best of three)","10","30","75"],["Moves (6 from Block Two)","2 strong foot","4 both feet","All 6 at speed past a defender"],["Turns (6 from Block Three)","2","4 both feet","All 6 with acceleration"],["Directional touches into target (10)","5","7","9"],["Passes through 2 m gate at 10 m (10 each foot)","5","7","9"]])}
    <p class="muted" style="margin:0">Ages 7–9 work towards Silver, ages 10–12 towards Gold. In the one class, give younger players the 7–9 version of each practice and older players the 10–12 version.</p>
    <div class="card box"><h2>After every session (2 minutes)</h2><ol class="tight"><li>Did every player have a ball and maximum touches?</li><li>Was the technique practised on both feet?</li><li>Did the application and game reward the week's technique?</li><li>Which players need it easier or harder next week?</li></ol></div>
  </section>`;
}
function techGuide(sw){
  return `<section class="view">
    <div><div class="eyebrow">Coaching guide · Technical Development · Ages 10–14</div><h1 class="sec-title" style="font-size:34px">Technique first</h1></div>${sw}
    <p style="margin:0;max-width:62ch">A highly technical programme to accelerate each player's level so they can progress into higher-level football. Each technique has a clear technical model, built through high-repetition closed practice, then variability, decisions and opposition so it transfers into the game.</p>
    <h2 class="sec-title">Season overview</h2>
    ${table(["Block","Theme","Technical focus"],[["One","<b>Elite Close Control and Ball Manipulation</b>","Sole work, combinations, scanning, shielding, weaker foot"],["Two","<b>Receiving, Scanning and Body Orientation</b>","Back-foot receiving, scanning, half-turn, aerial control"],["Three","<b>Passing Technique and Range</b>","Side-foot, weighted, driven, lofted, disguised, combinations"],["Four","<b>1v1 Attacking and Running with the Ball</b>","Touch frequency, feints, 1v1 front-on, wide and back to goal"],["Five","<b>Finishing Technique</b>","Instep, placed, first-time, volleys, 1v1 v goalkeeper"],["Six","<b>Speed of Play</b>","Two-touch, one-touch, scanning, positional technique"]])}
    <h2 class="sec-title">Every session · 60 minutes</h2>
    ${table(["Min","Part","Purpose"],[[10,"<b>Technical activation</b><br><span class='muted'>Ball each: manipulation and movement at increasing tempo.</span>","Prepare body and touch."],[15,"<b>Technical block (closed)</b><br><span class='muted'>High repetition against the technical model.</span>","Build the correct movement pattern."],[10,"<b>Variable practice</b><br><span class='muted'>Changing distances, angles, signals and decisions.</span>","Adapt the technique."],[20,"<b>Opposed application</b><br><span class='muted'>1v1 to 4v4 where the technique decides success.</span>","Transfer under pressure."],[5,"<b>Review and benchmark</b><br><span class='muted'>Benchmark recorded; players rate themselves against the model.</span>","Measure progress; set targets."]],true)}
    <div class="card box"><h2>Coaching methodology</h2><ul class="tight">
      <li><b>Technical model.</b> Body position, standing foot, contact point, follow-through. Demonstrate and check it.</li>
      <li><b>Blocked to random.</b> Closed reps, then variable, then opposed.</li>
      <li><b>High repetition.</b> Target 300+ quality touches of the week's technique.</li>
      <li><b>Both feet.</b> The weaker foot has its own target.</li>
      <li><b>Feedback.</b> One detail at a time; video on phones where consent is given.</li>
      <li><b>Measure everything.</b> Weekly benchmarks and block testing feed each player's technical profile.</li></ul></div>
    <h2 class="sec-title">Adapting for age</h2>
    ${table(["Age","How the session changes"],[["<b>10–12</b>","Shorter distances, more closed repetition, passive pressure first."],["<b>13–14</b>","Longer distances, touch limits, active pressure, decisions and positional detail."]])}
    <h2 class="sec-title">Low numbers</h2>
    ${table(["Players","Plan"],[["10+","Run as written."],["6–9","Combine variable and opposed practices; one area; coach as a neutral."],["&lt;6","Use that week's low-numbers plan: 1v1 or 2v1 with the coach as defender or server."],["&lt;3","Individual technical clinic: extra closed reps, video feedback and full benchmark testing."]],true)}
    <h2 class="sec-title">Testing targets</h2>
    ${table(["Test","Ages 10–12","Ages 13–14"],[["Sole rolls in 30 s (each foot)","50","65"],["Slalom dribble, 10 cones, both feet","Under 14 s","Under 11 s"],["Directional first touch into 1 m gate (10 each foot)","7","9"],["Side-foot pass through 2 m gate at 15 m (10 each foot)","7","9"],["Driven pass into 5×5 m zone at 25 m (10)","5","8"],["Lofted switch into 5×5 m zone at 30 m (10)","4","7"],["30 m running with the ball","Under 6.5 s","Under 5.5 s"],["Finishing into corner targets (10)","5","7"],["Juggling, alternating feet","30","75"]])}
    <p class="muted" style="margin:0">Each test is also scored 1–5 for technique quality against the model. At the end of each block every player agrees two technical targets: one strength, one area to improve.</p>
    <div class="card box"><h2>After every session (2 minutes)</h2><ol class="tight"><li>Did every player hit the repetition target?</li><li>Was the technical model clear and checked for every player?</li><li>Did the practice move from closed to variable to opposed?</li><li>Which players need adjusting next week, and what is their next technical detail?</li></ol></div>
  </section>`;
}
function tech5Guide(sw){
  const T=DATA.tech5Tests;
  return `<section class="view">
    <div><div class="eyebrow">Coaching guide · Saturday Technical · Ages 4–7</div><h1 class="sec-title" style="font-size:34px">Good habits early</h1></div>${sw}
    <p style="margin:0;max-width:62ch">The same method as the 10–14 programme, pitched for 4–7 year olds: a simple technical model for each skill, lots of repetitions with a ball each, then the skill with choices and friendly pressure. Every week has a benchmark and every block ends with a skills check.</p>
    <h2 class="sec-title">Season overview</h2>
    ${table(["Block","Theme","Focus"],PROGS.tech5.blocks.map(b=>[BLOCK_WORD[b.n],"<b>"+esc(b.name)+"</b>",esc(b.c[0][1])]))}
    <h2 class="sec-title">Every session · 60 minutes</h2>
    ${table(["Min","Part","Purpose"],[[10,"<b>Technical activation</b><br><span class='muted'>Ball each: touches and movement linked to the skill.</span>","Lots of touches; warm up."],[15,"<b>Technical block (closed)</b><br><span class='muted'>The skill with no pressure, against the simple technical model.</span>","Learn the right movement."],[10,"<b>Variable practice</b><br><span class='muted'>Same skill with calls, colours and directions to react to.</span>","Use the skill with choices."],[20,"<b>Opposed application</b><br><span class='muted'>1v1, 2v1 or small games with a friendly defender.</span>","Use the skill under pressure."],[5,"<b>Review and benchmark</b><br><span class='muted'>One question, the weekly benchmark, home practice.</span>","See progress; take it home."]],true)}
    <div class="card box"><h2>How we coach 4–7 year olds</h2><ul class="tight">
      <li><b>Ball each.</b> No queues; maximum touches.</li>
      <li><b>One detail at a time.</b> Show the technical model in under 30 seconds, then let them practise.</li>
      <li><b>Quality, then speed.</b> Get it right slowly first.</li>
      <li><b>Both feet every week.</b> Weaker foot has its own target.</li>
      <li><b>Count and celebrate.</b> Benchmarks are personal bests, not competitions between children.</li>
      <li><b>Short and fun.</b> Change the game every 5–8 minutes.</li></ul></div>
    <h2 class="sec-title">Adapting for age</h2>
    ${table(["Age","How the session changes"],[["<b>4–5</b>","Walking pace, bigger areas, coach demonstrates, lots of stories and praise, defenders walk."],["<b>6–7</b>","Jogging pace, smaller areas, weaker foot, active defenders."]])}
    <h2 class="sec-title">Low numbers</h2>
    ${table(["Players","Plan"],[["10+","Run as written."],["6–9","Combine variable and opposed practices; one area; coach as a neutral."],["&lt;6","Use that week's low-numbers plan: 1v1 or 2v1 with the coach."],["&lt;3","Individual clinic: extra repetitions and benchmark testing."]],true)}
    <h2 class="sec-title">Skills check targets</h2>
    ${table(["Test","Ages 4–5","Ages 6–7"],T.map(t=>[esc(t.name),(t.lower?"Under ":"")+t.tg["4–5"],(t.lower?"Under ":"")+t.tg["6–7"]]))}
    <div class="card box"><h2>After every session (2 minutes)</h2><ol class="tight"><li>Did every player have a ball and lots of touches?</li><li>Was the technical model shown and checked?</li><li>Did the practice move from no pressure to friendly pressure?</li><li>Which players need it easier or harder next week?</li></ol></div>
  </section>`;
}
function dev812Guide(sw){
  return `<section class="view">
    <div><div class="eyebrow">Coaching guide · Sunday Development · Ages 8–12</div><h1 class="sec-title" style="font-size:34px">The all-round player</h1></div>${sw}
    <p style="margin:0;max-width:62ch">One class for ages 8–12 that develops the whole player across the four corners: technique, game understanding, physical literacy and the psychological and social side. Each week has a skill, a game moment and a corner focus, and every block ends with a festival in week 8.</p>
    <h2 class="sec-title">Season overview</h2>
    ${table(["Block","Theme","Dates"],PROGS.dev812.blocks.map(b=>[BLOCK_WORD[b.n],"<b>"+esc(b.name)+"</b><br><span class='muted'>"+esc(b.aim)+"</span>",esc(b.dates)]))}
    <h2 class="sec-title">Every session · 60 minutes</h2>
    ${table(["Min","Part","Purpose"],[[10,"<b>Warm-up and movement</b><br><span class='muted'>A ball game plus agility, balance and coordination.</span>","Get moving; early touches."],[15,"<b>Technical practice</b><br><span class='muted'>The week's skill with lots of repetitions.</span>","Quality and both feet."],[15,"<b>Skill practice</b><br><span class='muted'>The skill against opponents, with a direction.</span>","Decisions under pressure."],[15,"<b>Small-sided game</b><br><span class='muted'>3v3 to 5v5 with a condition linked to the skill.</span>","Use it in the game."],[5,"<b>Review</b><br><span class='muted'>One question, one example, the home challenge.</span>","Players explain what they learned."]],true)}
    <div class="card box"><h2>How we coach 8–12 year olds</h2><ul class="tight">
      <li><b>Lots of the ball.</b> Small groups, no long queues.</li>
      <li><b>Ask, then tell.</b> Use questions so players work out the answer.</li>
      <li><b>Challenge each player.</b> Use the 8–10 and 11–12 versions side by side.</li>
      <li><b>The game teaches.</b> Finish every session with a real game.</li>
      <li><b>Praise effort and bravery.</b> Mistakes are part of learning.</li>
      <li><b>Give players a voice.</b> Let them lead warm-ups and set rules, especially in Block Six.</li></ul></div>
    <h2 class="sec-title">Adapting for age</h2>
    ${table(["Age","How the session changes"],[["<b>8–10</b>","Bigger areas, more time, passive then active defenders, clear simple rules."],["<b>11–12</b>","Smaller areas, time limits, fully active defenders, weaker-foot and scanning targets."]])}
    <h2 class="sec-title">Low numbers</h2>
    ${table(["Players","Plan"],[["10+","Run as written."],["6–9","One area per practice; coach joins as a neutral."],["&lt;6","Use that week's low-numbers plan."],["&lt;3","Skills clinic: technique reps, 1v1s with the coach and shooting."]],true)}
    <div class="card box"><h2>After every session (2 minutes)</h2><ol class="tight"><li>Did every player get lots of touches?</li><li>Did the skill show up in the game?</li><li>Which corner did we develop today, and who stood out?</li><li>Which players need it easier or harder next week?</li></ol></div>
  </section>`;
}
function u13Guide(sw){return (DATA.u13GuideHtml||"").replace("%%SW%%",sw)}
function teamGuide(sw){
  return `<section class="view">
    <div><div class="eyebrow">Coaching guide · Team Syllabus</div><h1 class="sec-title" style="font-size:34px">How we coach</h1></div>${sw}
    <p style="margin:0;max-width:62ch">We develop brave, technically confident players who enjoy the game, make their own decisions and play for each other. Results matter less than progress; every player gets equal time on the ball and equal coaching attention.</p>
    <h2 class="sec-title">Game model</h2>
    <div class="gm">
      <div class="card"><h3>In possession</h3><div class="kw">Open up, support, play forward</div><p style="margin:0" class="muted">Play out from the back with purpose, keep the ball through support angles, then progress forward and create chances.</p></div>
      <div class="card"><h3>Out of possession</h3><div class="kw">Compact, press as one, protect</div><p style="margin:0" class="muted">Stay compact, press together with clear triggers, protect the goal.</p></div>
      <div class="card"><h3>Attack to defence</h3><div class="kw">React, recover</div><p style="margin:0" class="muted">Nearest player presses within 5 seconds, others recover goal-side.</p></div>
      <div class="card"><h3>Defence to attack</h3><div class="kw">Look forward, secure</div><p style="margin:0" class="muted">Counter quickly when on, keep the ball safely when not.</p></div>
    </div>
    <h2 class="sec-title">Every session · 2 hours</h2>
    ${table(["Min","Part","Purpose"],[[15,"<b>Arrival and ball mastery</b><br><span class='muted'>Ball each on arrival: ball mastery, dynamic movement and a warm-up game linked to the theme.</span>","Maximum touches, ready to learn."],[20,"<b>Individual technical practice</b><br><span class='muted'>Unopposed then lightly opposed work on the week's technique.</span>","Improve each player's technique, linked to the team theme."],[20,"<b>Skill practice (opposed)</b><br><span class='muted'>Small-sided 1v1 to 3v3 using the technique against real opponents.</span>","Use the technique under pressure and make decisions."],[25,"<b>Team theme</b><br><span class='muted'>Larger opposed practice on the tactical focus.</span>","Apply the technique within the team's way of playing."],[30,"<b>Game</b><br><span class='muted'>Small-sided game with one condition linked to the theme.</span>","Transfer learning; play and enjoy."],[10,"<b>Cool-down and review</b><br><span class='muted'>Light jog, stretches, water, group questions; home challenge set.</span>","Reflect, recover and take learning home."]],true)}
    <div class="card box"><h2>Before, during and after</h2><ul class="tight">
      <li><b>Before:</b> read the objective and set up all areas before players arrive. Check pitch, first aid kit, emergency contacts and water. Take the register.</li>
      <li><b>During:</b> demonstrate in under a minute, then let players play. Question and guide first; stop the whole group at most three times per practice. Use STEP (Space, Task, Equipment, People) to progress or regress.</li>
      <li><b>After:</b> complete the 2-minute review in the Log and note players for IDP updates.</li></ul></div>
    <h2 class="sec-title">Teams and formats</h2>
    ${table(["Team","Format","How the session is used"],[["<b>U10</b>","7-a-side<br><span class='muted'>~60×40 yd</span>","Technique is most of the session. Tactical theme introduced through questions and small-sided games (up to 4v4)."],["<b>U12</b>","9-a-side<br><span class='muted'>~80×50 yd</span>","Technical detail at speed plus unit work in the 9-a-side shape (e.g. 3-2-3 or 3-3-2). U13s follow their own U13 Elite programme."],["<b>U15</b>","11-a-side<br><span class='muted'>~100×60 yd</span>","Full team tactics in 11-a-side shape (e.g. 4-3-3), with positional roles, units and phases of play."]])}
    <h2 class="sec-title">Low numbers</h2>
    ${table(["Players","Plan"],[["12+","Run the session as written."],["8–11","Reduce team practices by one per side, shrink areas by about a quarter, one neutral to keep overloads."],["&lt;8","Use that week's low-numbers plan: 1v1 to 3v3, coach as neutral or target, game becomes 3v3 or 4v4."],["&lt;4","Join an adjacent age group for opposed parts, or run a technical clinic."]],true)}
    <div class="card box"><ul class="tight"><li>Keep the theme: only the size of the practice changes.</li><li>Keep roughly 100–150 m² per player in possession practices.</li><li>Rotate the goalkeeper so every outfield player takes a turn.</li><li>Smaller games are harder: 1–2 minute break every 4 minutes of play.</li><li>Players who miss a session get the home challenge.</li></ul></div>
    <h2 class="sec-title">Reviews</h2>
    <div class="card box"><h2>After every session (2 minutes)</h2><ol class="tight"><li>Was the objective achieved? What evidence did I see?</li><li>Did every player get maximum touches and active time?</li><li>Was the technical practice clearly linked to the team theme?</li><li>Which interventions worked, and which players need a different challenge next week?</li><li>One thing to keep, one thing to change.</li></ol></div>
    <div class="card box"><h2>Player review · week 8 of every block</h2><p style="margin:0">Rate each corner <b>Working towards</b>, <b>Achieved</b> or <b>Exceeding</b>. Ratings feed each player's IDP (one technical, tactical, physical and psych/social target, set in Block One weeks 1–2), shared with parents. Players self-rate too.</p><p class="muted" style="margin:0">Coaches peer-observe one session per block.</p></div>
  </section>`;
}
function devGuide(sw){
  return `<section class="view">
    <div><div class="eyebrow">Coaching guide · Development Syllabus · Ages 4–7</div><h1 class="sec-title" style="font-size:34px">Fun first</h1></div>${sw}
    <p style="margin:0;max-width:62ch">At this age every child should have a ball, be moving and be smiling. We teach through games and stories, not drills, lines or laps. Tactics are not coached: one simple game word in the mini-match, such as "spread out" or "help a friend", is the only team idea introduced.</p>
    <h2 class="sec-title">The eight basics</h2>
    ${table(["Basic","What it looks like at 4–7"],[["<b>Passing</b>","Side-foot pass to a friend or through a gate."],["<b>Dribbling</b>","Keeping the ball close with small touches and both feet."],["<b>Running with the ball</b>","Pushing the ball forward into space and running after it."],["<b>Shooting</b>","Hitting a target with the laces."],["<b>Turning</b>","Sole turn, inside and outside hook turns."],["<b>Movement</b>","Agility, balance and coordination (ABCs) with and without the ball."],["<b>Communication</b>","Calling names, saying \"mine\", listening to the coach."],["<b>Fun</b>","Every activity is a game children want to play again."]])}
    <h2 class="sec-title">Every session · 60 minutes</h2>
    ${table(["Min","Part","Purpose"],[[10,"<b>Arrival game</b><br><span class='muted'>Ball each from the moment children arrive; a story-based game linked to the week's basic.</span>","Lots of touches; settle in and have fun."],[15,"<b>Skill game</b><br><span class='muted'>A simple, mostly unopposed game focused on the week's basic.</span>","Learn and repeat the skill."],[15,"<b>Challenge game</b><br><span class='muted'>The same skill with a friendly challenge: a chasing coach, a race or a 1v1.</span>","Use the skill with some pressure."],[15,"<b>Mini-match</b><br><span class='muted'>2v2 to 4v4 on small pitches with small goals; one game word as the only reminder.</span>","Play the game; first simple team idea."],[5,"<b>Cool-down and star of the day</b><br><span class='muted'>Slow walk with the ball, stretches, one question and a star of the day sticker.</span>","Reflect, celebrate, take the home challenge home."]],true)}
    <p class="muted" style="margin:0">Water break between each part.</p>
    <div class="card box"><h2>How we coach young children</h2><ul class="tight">
      <li><b>Ball each, no queues.</b> Every child is active; no lines, laps or long waits.</li>
      <li><b>Stories and characters.</b> Every game has a theme children can picture.</li>
      <li><b>Show, don't talk.</b> Demonstrate in under 30 seconds, then get them playing.</li>
      <li><b>Short activities.</b> Change or progress the game every 5–8 minutes.</li>
      <li><b>Praise effort and bravery,</b> not just what they get right.</li>
      <li><b>Adapt for every child.</b> Easier for ages 4–5, harder for ages 6–7.</li>
      <li><b>Safety and welfare.</b> Pitch checked, water breaks, emergency info and first aid kit on site; parents stay on site.</li></ul></div>
    <h2 class="sec-title">Low numbers</h2>
    ${table(["Children","Plan"],[["10+","Run as written, with two mini-match pitches."],["6–9","Reduce the area, use one mini-match pitch and make the coach a helper or chaser."],["&lt;6","Use that week's low-numbers plan: the coach joins in as partner, chaser or defender; games become 1v1 or 2v2."],["&lt;3","Run a fun skills clinic: repetitions, races and shooting, with parents invited to join in."]],true)}
    <h2 class="sec-title">Skills passport</h2>
    <p style="margin:0" class="muted">Progress is celebrated, not graded. Each block, every child gets a skills badge and parents get a short note on what their child can now do.</p>
    ${table(["Basic","Bronze","Silver","Gold"],[["<b>Dribbling</b>","Keeps the ball close while walking.","Dribbles round cones with both feet.","Dribbles past a defender."],["<b>Passing</b>","Passes to a partner close by.","Passes through a gate.","Passes to a moving friend."],["<b>Running with the ball</b>","Pushes the ball forward and follows it.","Runs with the ball at speed.","Runs with the ball and shoots."],["<b>Shooting</b>","Hits a big target.","Shoots with the laces.","Scores with both feet."],["<b>Turning</b>","Stops the ball with the sole.","Does a sole turn.","Does three different turns."],["<b>Movement</b>","Balances on one leg.","Changes direction quickly.","Moves with balance while dribbling."],["<b>Communication</b>","Says their own name in the group.","Calls a friend's name.","Calls \"mine\" and helps a friend."],["<b>Fun</b>","Joins in every game.","Encourages others.","Helps lead a game."]])}
    <div class="card box"><h2>After every session (2 minutes)</h2><ol class="tight"><li>Did every child have a ball and stay active?</li><li>Did every child smile and want to come back?</li><li>Was the week's basic clear in every game?</li><li>Which children need the game easier or harder next week?</li></ol></div>
    <div class="card box"><h2>Moving into the Team Syllabus</h2><p style="margin:0">Children are ready to move up when they can dribble with both feet, pass to a friend, shoot at a target and enjoy small-sided games.</p></div>
  </section>`;
}

/* ---------- PDF export ---------- */
function pdfText(t){return String(t??"").replace(/[‘’]/g,"'").replace(/[“”]/g,'"').replace(/′/g,"'").replace(/−/g,"-").replace(/–|—/g,"-").replace(/×/g,"x")}
const LIME=[195,240,0], INK=[12,13,10], MUTED=[91,96,86], LINE=[217,220,209], SOFT=[60,64,56];
function svgPng(svg){
  return new Promise(res=>{
    const img=new Image();
    img.onload=()=>{try{const c=document.createElement("canvas");c.width=800;c.height=520;const x=c.getContext("2d");x.fillStyle="#3f8a3c";x.fillRect(0,0,800,520);x.drawImage(img,0,0,800,520);res(c.toDataURL("image/jpeg",0.8))}catch(e){res(null)}};
    img.onerror=()=>res(null);
    img.src="data:image/svg+xml;charset=utf-8,"+encodeURIComponent(svg.replace("<svg ",'<svg width="800" height="520" '));
  });
}
function pdfHeader(doc,s,g,sub){
  const W=210,M=14,CW=W-2*M;
  doc.setFillColor(...INK);doc.rect(0,0,W,40,"F");doc.setFillColor(...LIME);doc.rect(0,40,W,2.2,"F");
  doc.setDrawColor(...LIME);doc.setLineWidth(0.7);doc.rect(M,8,30,9);
  doc.setTextColor(...LIME);doc.setFont("helvetica","bold");doc.setFontSize(11);doc.text("BOX TO BOX",M+15,14.2,{align:"center"});
  doc.setTextColor(235,238,228);doc.setFont("helvetica","normal");doc.setFontSize(8.5);
  doc.text(pdfText(`${PROGS[s.prog].short} - Block ${BLOCK_WORD[s.block]} - Week ${s.week} of 8   |   ${s.long}   |   ${PROGS[s.prog].hours}   |   ${g.long}${TEAMY(s.prog)?" ("+g.fmt+")":""}`),M+34,14);
  doc.setTextColor(255,255,255);doc.setFont("helvetica","bold");doc.setFontSize(14.5);
  doc.text(doc.splitTextToSize(pdfText((sub||s.title).toUpperCase()),CW).slice(0,2),M,25);
  doc.setFont("helvetica","normal");doc.setFontSize(8);doc.setTextColor(...LIME);
  doc.text(pdfText(s.prog==="dev"?`Basic skill: ${s.skill}    Theme: ${s.theme}    Game word: ${s.word}`:s.prog==="dev812"?`Skill: ${s.skill}    Moment: ${s.moment}    Corner: ${s.corner}`:s.prog==="u13"?`Match-day rules: ${s.technique}    Moment: ${s.phase}    Focus: ${s.outcome}`:TEAMY(s.prog)?`Technique: ${s.technique}    Phase: ${s.phase}    Outcome: ${s.outcome}`:`Technique: ${s.technique}    Focus: ${s.focus}`),M,36.5);
}
async function drawSession(doc,s,g){
  const W=210,M=14,CW=W-2*M; let y=0;
  const need=h=>{if(y+h>285){doc.addPage();y=16}};
  pdfHeader(doc,s,g); y=48;
  doc.setFont("helvetica","bold");doc.setFontSize(9.5);doc.setTextColor(...INK);
  const ol=doc.splitTextToSize(pdfText("Objective: "+s.objective),CW-6);
  doc.setFillColor(...LIME);doc.rect(M,y,CW,ol.length*4.4+4,"F");doc.text(ol,M+3,y+5);y+=ol.length*4.4+8;
  if(s.model){doc.setFont("helvetica","normal");doc.setFontSize(8.6);const ml=doc.splitTextToSize(pdfText("Technical model: "+s.model),CW);doc.setTextColor(...SOFT);doc.text(ml,M,y);y+=ml.length*3.8+4}
  const c1=34,c2=78,c3=CW-c1-c2; let t=0;
  doc.setFontSize(7.5);doc.setTextColor(...MUTED);doc.setFont("helvetica","bold");
  doc.text("PART",M,y);doc.text("PRACTICE AND ORGANISATION",M+c1,y);doc.text("COACHING POINTS",M+c1+c2,y);y+=1.8;
  doc.setDrawColor(...INK);doc.setLineWidth(0.5);doc.line(M,y,M+CW,y);y+=4;
  s.plan.forEach(p=>{
    doc.setFontSize(8.6);doc.setFont("helvetica","normal");
    const a=doc.splitTextToSize(pdfText(p.practice),c2-3), b=doc.splitTextToSize(pdfText(p.points),c3);
    doc.setFont("helvetica","bold");const n=doc.splitTextToSize(pdfText(p.name),c1-3);
    const h=Math.max(a.length,b.length,n.length+1)*3.8+2.5;need(h);
    const mm=`${Math.floor(t/60)}:${String(t%60).padStart(2,"0")} - ${p.mins} min`;t+=p.mins||0;
    doc.setTextColor(...INK);doc.text(n,M,y);doc.setFont("helvetica","normal");doc.setTextColor(...MUTED);doc.setFontSize(7.5);doc.text(mm,M,y+n.length*3.8);
    doc.setFontSize(8.6);doc.setTextColor(...INK);doc.text(a,M+c1,y);doc.setTextColor(...SOFT);doc.text(b,M+c1+c2,y);
    y+=h;doc.setDrawColor(...LINE);doc.setLineWidth(0.25);doc.line(M,y-2.5,M+CW,y-2.5);y+=1.5;
  });
  y+=2;need(26);
  const ids=idsOf(s.prog);
  doc.setFont("helvetica","bold");doc.setFontSize(10);doc.setTextColor(...INK);doc.text(TEAMY(s.prog)?"TEAM ADAPTATIONS":"ADAPTING FOR AGE",M,y);y+=5;
  const prow=(TEAMY(s.prog)||G(ids[0]).key)?ids.map(id=>({id,lab:TEAMY(s.prog)?G(id).short:"Ages "+G(id).key,txt:adaptFor(s,id)})):ageRows(s).map(([k,v])=>({id:null,lab:k,txt:v}));
  prow.forEach(({id,lab,txt})=>{
    const mine=id!=null&&id===g.id;
    doc.setFontSize(8.6);doc.setFont("helvetica",mine?"bold":"normal");
    const l=doc.splitTextToSize(pdfText(txt),CW-26);need(l.length*3.8+2);
    if(mine){doc.setFillColor(...LIME);doc.rect(M,y-3.3,22,4.8,"F")}
    doc.setFont("helvetica","bold");doc.setTextColor(...INK);doc.text(pdfText(lab),M+1.5,y);
    doc.setFont("helvetica",mine?"bold":"normal");doc.setTextColor(...(mine?INK:SOFT));doc.text(l,M+26,y);
    y+=l.length*3.8+2;
  });
  const box=(label,txt)=>{doc.setFont("helvetica","normal");doc.setFontSize(8.6);const l=doc.splitTextToSize(pdfText(txt),CW-6);const h=l.length*3.8+9;need(h+2);
    doc.setDrawColor(...LINE);doc.setLineWidth(0.3);doc.rect(M,y,CW,h);doc.setFont("helvetica","bold");doc.setFontSize(7.5);doc.setTextColor(...MUTED);doc.text(label,M+3,y+4.5);
    doc.setFont("helvetica","normal");doc.setFontSize(8.6);doc.setTextColor(...INK);doc.text(l,M+3,y+8.8);y+=h+3};
  y+=2;
  box(s.prog==="dev"?"LOW NUMBERS (FEWER THAN 6 CHILDREN)":TEAMY(s.prog)?"LOW NUMBERS (FEWER THAN 8 PLAYERS)":"LOW NUMBERS (FEWER THAN 6 PLAYERS)",s.low);
  box(homeLabel(s).toUpperCase(),s.home);
  if(s.benchmark) box("BENCHMARK",s.benchmark);
  if(s.review) box("BLOCK REVIEW",s.review.replace(/^(Block|Season) review:\s*/,""));
  need(30);
  doc.setFont("helvetica","bold");doc.setFontSize(7.5);doc.setTextColor(...MUTED);doc.text("2-MINUTE REVIEW",M,y+3);y+=7;
  doc.setFont("helvetica","normal");doc.setFontSize(8.6);doc.setTextColor(...INK);
  [(s.prog==="dev"?"Children":"Players")+" present:          Objective achieved?   Yes  /  Partly  /  No",s.prog==="dev"?"Every child active and smiling?":"Evidence:","Keep:                                                            Change:"].forEach(r=>{need(8);doc.text(r,M,y);doc.setDrawColor(...LINE);doc.line(M,y+2,M+CW,y+2);y+=8});

  // page 2: practice diagrams (team session plans)
  const prs=s.plan.map((p,i)=>({p,i})).filter(x=>x.p.detail);
  if(!prs.length) return;
  doc.addPage(); pdfHeader(doc,s,g,"Practices: "+s.title); y=48;
  const colW=(CW-6)/2, imgH=colW*0.65;
  for(let k=0;k<prs.length;k++){
    const {p,i}=prs[k], d=p.detail, x=M+(k%2)*(colW+6);
    if(k%2===0 && k>0) y=yRowEnd+4;
    const top=y;
    doc.setFont("helvetica","bold");doc.setFontSize(9.5);doc.setTextColor(...INK);
    doc.text(pdfText(`${i+1}. ${p.name} - ${p.mins} min${d.type?" - "+d.type:""}`),x,top+3);
    let yy=top+5.5;
    const png=d.svg?await svgPng(d.svg):null;
    if(png){doc.addImage(png,"JPEG",x,yy,colW,imgH);yy+=imgH+3.5}
    doc.setFontSize(7.6);
    const line=(lab,txt)=>{if(!txt)return;doc.setFont("helvetica","bold");doc.setTextColor(...MUTED);doc.text(lab,x,yy);const l=doc.splitTextToSize(pdfText(txt),colW-22);doc.setFont("helvetica","normal");doc.setTextColor(...INK);doc.text(l,x+22,yy);yy+=l.length*3.3+0.8};
    line("AREA",d.area);line("PLAYERS",d.players);line("PROGRESS",d.progress);line("REGRESS",d.regress);line("QUESTIONS",d.questions);
    if(k%2===0) var yRowEnd=yy; else yRowEnd=Math.max(yRowEnd,yy);
  }
}
async function downloadPdf(list,filename,btn){
 if(!ACCESS.admin&&list.some(s=>!dayPrepReady(prepRec(s.key)))){toast("Complete the session preparation before downloading the full plan.");return;}
  const dl=window._dl;
  if(!dl){toast("Downloads aren't available in this view.");return}
  if(!window.jspdf){toast("The PDF tool didn't load. Check your connection and reload.");return}
  const old=btn.textContent;btn.disabled=true;btn.textContent="Preparing…";
  try{
    const doc=new window.jspdf.jsPDF({unit:"mm",format:"a4"});
    for(let i=0;i<list.length;i++){if(i)doc.addPage();await drawSession(doc,list[i],grp())}
    await dl.save({filename,data:doc.output("arraybuffer")});
    toast("PDF saved");
  }catch(e){ if(!(e&&e.code==="declined")) toast(e&&e.code==="rate_limited"?"A save is already waiting for you.":"Couldn't create the PDF."); }
  btn.disabled=false;btn.textContent=old;
}

let toastT;
function toast(msg){const t=$("#toast");t.textContent=msg;t.hidden=false;clearTimeout(toastT);toastT=setTimeout(()=>t.hidden=true,2600)}


/* =====================================================================
   Box to Box: announcements, availability, group chat and notifications.
   Shared by the coaches' app and the parents & players app.
   ===================================================================== */
/* Shared Passport and communications implementation loaded from comms.js */


/* =====================================================================
   Coach development (weekly CPD) + Calendar (weekly timetable, holidays)
   ===================================================================== */
const CPD = (DATA && DATA.cpd && DATA.cpd.version === 2 && DATA.cpd.steps) ? DATA.cpd : null;
const pad2 = n => String(n).padStart(2, "0");
const isoOf = d => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
const dayOf = s => { const [y, m, d] = String(s).slice(0, 10).split("-"); return new Date(+y, +m - 1, +d); };
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const fmtDay = (d, o) => d.toLocaleDateString("en-GB", o || { weekday: "short", day: "numeric", month: "short" });
const fmtTime = d => d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
const mondayOf = d => addDays(d, -((d.getDay() + 6) % 7));
const personName = id => { const p = state.profiles[id]; return (p && p.name) || (id === ACCESS.uid ? (ACCESS.name || "You") : "A coach"); };
const groupLabel = id => { const g = (typeof ALL_GROUPS !== "undefined" ? ALL_GROUPS : GROUPS).find(x => x.id === id); return g ? g.long : (id || ""); };
const approvedCoaches = () => Object.entries(state.profiles)
  .filter(([, p]) => p && (p.role === "admin" || (p.groups && p.groups.length)))
  .map(([id, p]) => ({ id, name: p.name || "Coach", role: p.role }))
  .sort((a, b) => a.name.localeCompare(b.name));

/* ---------- coach development pathway (each coach sees only their own) ---------- */
const cpdId = (uid, sid) => `cpd_${uid}_${sid}`;
const cpdRec = (uid, sid) => ((typeof Local !== "undefined" && Local && Local.cache && Local.cache.cpd) || {})[cpdId(uid, sid)] || null;
const cpdMy = sid => cpdRec(ACCESS.uid, sid) || {};
const cpdStep = sid => CPD.steps[sid];
const cpdStartStage = () => +(cpdMy("start").stage || 0);
const cpdStage = n => CPD.stages.find(st => st.n === n);
const cpdStageSteps = n => cpdStage(n).modules.flatMap(m => m.steps);
const cpdModuleOf = sid => { for (const st of CPD.stages) for (const m of st.modules) if (m.steps.includes(sid)) return m; return null; };
const cpdPath = () => { const s0 = cpdStartStage(); return s0 ? CPD.stages.filter(st => st.n >= s0).flatMap(st => cpdStageSteps(st.n)) : []; };
const cpdNext = () => cpdPath().find(id => !cpdMy(id).done) || null;
const cpdDoneCount = ids => ids.filter(id => cpdMy(id).done).length;
function cpdSave(sid, data) { window._db.collection("cpd").doc(cpdId(ACCESS.uid, sid)).set(Object.assign({ step: sid, coach: ACCESS.uid, updatedAt: new Date().toISOString() }, data)); }

function developView(bare) {
  if (!CPD) return `<section class="view"><div class="card empty">Coach development hasn't been set up yet. ${ACCESS.admin ? "Upload the latest <b>programmes.json</b> in People." : "Check back soon."}</div></section>`;
  if (!cpdStartStage() || state.cpdPick) return `<section class="view">${cpdPicker()}</section>`;
  if (!cpdStyle() || state.cpdQuiz) return `<section class="view">${cpdQuizView()}</section>`;
  if (state.cpdRun) return `<section class="view">${cpdRunView()}</section>`;
  const list = [["next", "Next step"], ["path", "My pathway"], ["port", "Portfolio"]];
  const tab = list.some(t => t[0] === state.cpdTab) ? state.cpdTab : "next";
  return `<section class="view">${calTabs(list, tab, "data-cpdtab")}${tab === "path" ? cpdPathView() : tab === "port" ? cpdPortfolio() : cpdStepView()}</section>`;
}

function cpdPicker() {
  const cur = cpdStartStage();
  return `<div class="cpd-pick"><h2 class="cpd-title">Where are you starting?</h2>
    <p class="muted" style="margin:0">Pick the stage that fits you best. You can change it later. Only you can see your pathway.</p>
    ${CPD.stages.map(st => `<button type="button" class="cpd-stage-btn${cur === st.n ? " sel" : ""}" data-cpdstart="${st.n}">
      <span class="cpd-stage-n">${st.n}</span><span><b>${esc(st.title)}</b><small>${esc(st.who)}</small></span><i aria-hidden="true">›</i></button>`).join("")}
    ${cur ? `<div><button type="button" class="linkbtn" data-cpdpickclose>Keep stage ${cur}</button></div>` : ""}</div>`;
}

/* ---------- diagrams (pitch, flow, grid, cycle, bar) drawn as SVG ---------- */
function cpdDiagram(d) {
  if (!d) return "";
  const cap = d.cap ? `<figcaption>${esc(d.cap)}</figcaption>` : "";
  if (d.t === "pitch") {
    const X = x => 10 + x * 3, Y = y => 10 + y * 3, W = 320, H = 212;
    const dot = ([x, y, t]) => `<circle cx="${X(x)}" cy="${Y(y)}" r="7" class="dg-${t === "b" ? "them" : t === "k" ? "keep" : "us"}"/>`;
    const arr = ([x1, y1, x2, y2, k]) => `<line x1="${X(x1)}" y1="${Y(y1)}" x2="${X(x2)}" y2="${Y(y2)}" class="dg-${k}" marker-end="url(#dgh-${k})"/>`;
    const head = k => `<marker id="dgh-${k}" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0,0 L10,5 L0,10z" class="dgm-${k}"/></marker>`;
    return `<figure class="dg"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(d.cap || "Pitch diagram")}"><defs>${["pass", "run", "press"].map(head).join("")}</defs>
      <rect x="10" y="10" width="300" height="192" rx="6" class="dg-pitch"/><line x1="160" y1="10" x2="160" y2="202" class="dg-line"/><circle cx="160" cy="106" r="24" class="dg-line"/>
      ${d.goals ? `<rect x="4" y="88" width="6" height="36" class="dg-goal"/><rect x="310" y="88" width="6" height="36" class="dg-goal"/><rect x="10" y="66" width="36" height="80" class="dg-line"/><rect x="274" y="66" width="36" height="80" class="dg-line"/>` : ""}
      ${(d.zone || []).map(([x, y, w, h]) => `<rect x="${X(x)}" y="${Y(y)}" width="${w * 3}" height="${h * 3}" rx="8" class="dg-zone"/>`).join("")}
      ${(d.arr || []).map(arr).join("")}${(d.p || []).map(dot).join("")}
      ${d.look ? `<path d="M${X(d.look[0]) - 4},${Y(d.look[1]) - 9} q-14,-10 -24,-2 M${X(d.look[0]) + 4},${Y(d.look[1]) - 9} q14,-10 24,-2" class="dg-look"/>` : ""}
      ${d.ball ? `<circle cx="${X(d.ball[0]) + 6}" cy="${Y(d.ball[1]) + 6}" r="3.5" class="dg-ball"/>` : ""}
      <text x="300" y="24" text-anchor="end" class="dg-dir">ATTACK →</text></svg>${cap}
      <div class="dg-key"><span><i class="k-us"></i>Us</span><span><i class="k-them"></i>Them</span>${(d.arr || []).some(a => a[4] === "pass") ? `<span><i class="k-pass"></i>Pass</span>` : ""}${(d.arr || []).some(a => a[4] === "run") ? `<span><i class="k-run"></i>Run</span>` : ""}${(d.arr || []).some(a => a[4] === "press") ? `<span><i class="k-press"></i>Press</span>` : ""}</div></figure>`;
  }
  if (d.t === "flow") return `<figure class="dg"><div class="dg-flow">${d.items.map((t, i) => `<div class="dg-box"><b>${esc(t)}</b>${d.sub ? `<small>${esc(d.sub[i] || "")}</small>` : ""}</div>${i < d.items.length - 1 ? `<span class="dg-arrow">→</span>` : ""}`).join("")}</div>${cap}</figure>`;
  if (d.t === "grid") return `<figure class="dg"><div class="dg-grid">${d.items.map(([k, v]) => `<div class="dg-cell"><b>${window.B2B_ICONS[k] ? ic(k) : esc(k)}</b><small>${esc(v)}</small></div>`).join("")}</div>${cap}</figure>`;
  if (d.t === "cycle") return `<figure class="dg"><div class="dg-cycle">${d.items.map((t, i) => `<div class="dg-c dg-c${i}"><b>${i + 1}</b><span>${esc(t)}</span></div>`).join("")}<div class="dg-c-mid">↻</div></div>${cap}</figure>`;
  if (d.t === "bar") return `<figure class="dg"><div class="dg-bar"><span style="width:${d.v}%">${d.v}%</span></div>${d.label ? `<figcaption>${esc(d.label)}</figcaption>` : ""}</figure>`;
  return "";
}
const CPD_ICON = { "Reflect": "brain", "Read & think": "book", "Try it": "ball", "Plan it": "clipboard", "Observe": "eye", "Film it": "video" };
const firstSentence = t => { const m = String(t).match(/^.*?[.!?](\s|$)/); return m ? m[0].trim() : t; };

function cpdStepView() {
  const next = cpdNext(), sid = state.cpdOpen && CPD.steps[state.cpdOpen] ? state.cpdOpen : next;
  if (!sid) return `<div class="card cpd-done-all"><div class="cpd-big-ico">${ic("trophy")}</div><h2 class="cpd-title">Pathway complete</h2><p style="margin:0">Keep adding to your portfolio, or revisit any step in <button type="button" class="linkbtn" data-cpdtab="path">My pathway</button>.</p></div>`;
  const w = cpdStep(sid), st = cpdStage(w.stage), m = cpdModuleOf(sid), rec = cpdMy(sid), answers = rec.answers || [], ticks = rec.ticks || [];
  const modIds = m.steps, posInMod = modIds.indexOf(sid);
  const why1 = firstSentence(w.why), whyRest = w.why.slice(why1.length).trim();
  const rate = rec.rating || 0;
  const style = cpdStyle() || "see", S = CPD_STYLES[style];
  const whyHtml = style === "read" ? esc(w.why) : `${esc(why1)}${whyRest ? ` <button type="button" class="cpd-more" data-cpdmore>More</button><span class="cpd-why-rest" hidden> ${esc(whyRest)}</span>` : ""}`;
  const B = {
    diagram: cpdDiagram(w.diagram),
    terms: w.terms ? `<div class="cpd-terms">${w.terms.map(([k, v]) => `<div><b>${esc(k)}</b><span>${esc(v)}</span></div>`).join("")}</div>` : "",
    tasks: `<section class="cpd-do"><h3 class="cpd-h">Do this</h3>
      ${w.task.map((t, i) => `<button type="button" class="cpd-task${ticks.includes(i) ? " on" : ""}" data-cpdtick="${i}" aria-pressed="${ticks.includes(i)}"><span class="cpd-box">${ticks.includes(i) ? "✓" : i + 1}</span><span>${esc(t)}</span></button>`).join("")}</section>`,
    session: `<div class="cpd-callout${style === "do" ? " big" : ""}"><span>${ic("ball")}</span><div><b>${style === "do" ? "Try this first" : "In your session"}</b><p>${esc(w.session)}</p></div></div>`,
    talk: `<div class="cpd-talk"><span>${ic("chat")}</span><div><b>Talk it through</b><p>Grab another coach for five minutes before or after training and ask each other:</p><ul>${w.reflect.slice(0, 2).map(q => `<li>${esc(q)}</li>`).join("")}</ul></div></div>`,
  };
  return `${sid === next ? cpdMomentum() : ""}<div class="cpd-crumb"><span>Stage ${st.n} · ${esc(m.title)}</span>
      <span class="cpd-mdots">${modIds.map((id, i) => `<i class="${cpdMy(id).done ? "d" : ""}${i === posInMod ? " c" : ""}"></i>`).join("")}</span></div>
    <article class="cpd-hero">
      <div class="cpd-hero-top"><span class="cpd-ico">${ic(CPD_ICON[w.type] || "ball")}</span><span class="cpd-hero-meta">${esc(w.type)} · ${w.mins} min${rec.done ? " · ✓ Done" : ""}</span>
        <button type="button" class="cpd-style-chip" data-cpdquiz title="Change how steps are shown">${ic(S.icon)} ${esc(S.name)}</button></div>
      <h2 class="cpd-title">${esc(w.title)}</h2>
      <p class="cpd-why">${whyHtml}</p>
    </article>
    ${S.order.map(k => B[k] || "").join("")}
    <form class="cpd-form2" id="cpd-form" data-step="${sid}">
      <h3 class="cpd-h">How did it go?</h3>
      <div class="cpd-rate" role="radiogroup" aria-label="How did it go">${[["1", "Tough"], ["2", "OK"], ["3", "Good"], ["4", "Great"]].map(([e, l], i) => `<button type="button" role="radio" class="cpd-rate-b${rate === i + 1 ? " on" : ""}" data-cpdrate="${i + 1}" aria-checked="${rate === i + 1}"><span>${e}</span><small>${l}</small></button>`).join("")}</div>
      <input type="hidden" id="cpd-rating" value="${rate}">
      <div class="field"><label for="cpd-next">Next session I'll…</label><input type="text" id="cpd-next" maxlength="160" placeholder="One thing, in a few words" value="${esc(rec.next || "")}"></div>
      ${w.evidence ? `<div class="field cpd-ev"><label for="cpd-ev">${ic("folder")} Portfolio: ${esc(w.evidence)}</label><textarea id="cpd-ev" placeholder="Paste a link to a photo, doc or video, or write a few lines">${esc(rec.evidence || "")}</textarea></div>` : ""}
      <details class="cpd-notes" ${answers.some(Boolean) || style === "read" ? "open" : ""}><summary>${style === "read" ? "Your notes" : "Add notes (optional)"}</summary>
        ${w.reflect.map((q, i) => `<div class="field"><label for="cpd-a${i}">${esc(q)}</label><textarea id="cpd-a${i}" data-cpdq="${i}" rows="2">${esc(answers[i] || "")}</textarea></div>`).join("")}</details>
      <p class="muted" style="margin:0;font-size:13px">${ic("lock")} Only you can see this.</p>
      <div class="actions"><button type="submit" class="btn primary big" id="cpd-done">${rec.done ? "Save" : "Done ✓"}</button></div>
      <p class="cpd-msg muted" id="cpd-msg" aria-live="polite" style="margin:0;font-size:14px"></p>
    </form>
    ${sid !== next && next ? `<div><button type="button" class="linkbtn" data-cpdgo="${next}">Back to your next step →</button></div>` : ""}`;
}

/* ---------- how you like to learn (sets the order and emphasis of each step) ---------- */
const CPD_STYLES = {
  see: { name: "Visual", icon: "eye", line: "You take things in best from pictures, diagrams and demos.", change: "Diagrams and key words come first, with short text.", order: ["diagram", "terms", "session", "tasks"] },
  read: { name: "Reader", icon: "book", line: "You like the full explanation, written down, and to note your own thoughts.", change: "You get the full explanation, and your notes are open.", order: ["terms", "tasks", "diagram", "session"] },
  do: { name: "Hands-on", icon: "ball", line: "You learn by trying it on the grass and adjusting as you go.", change: "\"Try this first\" leads, then the tasks and diagrams.", order: ["session", "tasks", "diagram", "terms"] },
  talk: { name: "Talker", icon: "chat", line: "You learn by talking ideas through with other coaches.", change: "Each step starts with questions to talk through with another coach.", order: ["talk", "diagram", "terms", "tasks", "session"] },
};
const CPD_QUIZ = [
  ["Learning a new practice, you'd rather…", [["see", "Watch a demo or see a diagram"], ["read", "Read the session plan"], ["do", "Set it up and try it"], ["talk", "Talk it through with a coach"]]],
  ["Finding a new away ground, you'd…", [["see", "Look at the map"], ["read", "Read the written directions"], ["do", "Head off and find it"], ["talk", "Ask someone who's been"]]],
  ["To remember a coaching point, you…", [["see", "Picture it on the pitch"], ["read", "Write it down"], ["do", "Use it in a session straight away"], ["talk", "Explain it to someone"]]],
  ["Your favourite way to learn about coaching is…", [["see", "Videos and clips"], ["read", "Articles and books"], ["do", "Trying ideas in training"], ["talk", "Chats and workshops"]]],
  ["Using a new app, you'd…", [["see", "Look at screenshots"], ["read", "Read the instructions"], ["do", "Tap around until it makes sense"], ["talk", "Ask someone to show you"]]],
  ["After a session, you think it over best by…", [["see", "Picturing the key moments"], ["read", "Writing a few notes"], ["do", "Planning what to try next time"], ["talk", "Talking it over"]]],
];
const cpdStyle = () => (cpdMy("style").style || "");
function cpdQuizView() {
  const a = state.cpdQuizAns || [], i = a.length;
  if (i >= CPD_QUIZ.length) {
    const sc = { see: 0, read: 0, do: 0, talk: 0 }; a.forEach(k => sc[k]++);
    const top = Object.keys(sc).sort((x, y) => sc[y] - sc[x])[0], S = CPD_STYLES[top];
    return `<div class="cpd-quiz-res"><div class="cpd-res-ico">${ic(S.icon)}</div><span class="eyebrow">You're mostly</span><h2 class="cpd-title">${esc(S.name)}</h2>
      <p>${esc(S.line)}</p>
      <div class="cpd-res-bars">${Object.keys(CPD_STYLES).map(k => `<div><span>${ic(CPD_STYLES[k].icon)} ${esc(CPD_STYLES[k].name)}</span><i><b style="width:${Math.round(100 * sc[k] / CPD_QUIZ.length)}%"></b></i></div>`).join("")}</div>
      <div class="cpd-callout"><span>${ic("sparkle")}</span><div><b>What changes</b><p>${esc(S.change)} Everything is still there; you can switch any time.</p></div></div>
      <button type="button" class="btn primary big" data-cpdstyle="${top}">Start my pathway</button>
      <div class="cpd-other-styles">${Object.keys(CPD_STYLES).filter(k => k !== top).map(k => `<button type="button" class="chip" data-cpdstyle="${k}">${ic(CPD_STYLES[k].icon)} Use ${esc(CPD_STYLES[k].name)}</button>`).join("")}</div></div>`;
  }
  const [q, opts] = CPD_QUIZ[i];
  return `<div class="cpd-quiz"><div class="cpd-quiz-top"><span class="eyebrow">How do you like to learn? · ${i + 1} of ${CPD_QUIZ.length}</span>
      <div class="cpd-bar"><span style="width:${Math.round(100 * i / CPD_QUIZ.length)}%"></span></div></div>
    <h2 class="cpd-title">${esc(q)}</h2>
    <div class="cpd-quiz-opts">${opts.map(([k, t]) => `<button type="button" class="cpd-quiz-o" data-cpdans="${k}">${esc(t)}</button>`).join("")}</div>
    ${i ? `<button type="button" class="linkbtn" data-cpdback>Back</button>` : `<p class="muted" style="margin:0;font-size:14px">Six quick taps. It changes how each step is laid out for you.</p>`}</div>`;
}

/* ---------- fast progress: spaced recall, test-out, weekly goal and pace ---------- */
const DAY = 864e5, CPD_GAPS = [1, 3, 7, 21, 60];
const cpdMine = () => Object.values((Local.cache && Local.cache.cpd) || {}).filter(r => r && r.coach === ACCESS.uid);
const cpdGoal = () => 2;
const cpdWeek0 = (off = 0) => { const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - ((d.getDay() + 6) % 7) - 7 * off); return d.getTime(); };
const cpdDoneIn = off => { const a = cpdWeek0(off), b = cpdWeek0(off - 1); return cpdMine().filter(r => r.step && CPD.steps[r.step] && r.done && !r.known && r.doneAt && +new Date(r.doneAt) >= a && +new Date(r.doneAt) < b).length; };
function cpdStreak() { const g = cpdGoal(); let n = cpdDoneIn(0) >= g ? 1 : 0; for (let o = 1; o < 104 && cpdDoneIn(o) >= g; o++) n++; return n; }
const cpdDueAt = r => r.rdue ? +new Date(r.rdue) : +new Date(r.doneAt || r.updatedAt) + (r.known ? 7 : 1) * DAY;
const cpdDue = () => cpdMine().filter(r => r.step && r.done && CPD.steps[r.step] && CPD.steps[r.step].check && cpdDueAt(r) <= Date.now()).sort((a, b) => cpdDueAt(a) - cpdDueAt(b));
const cpdModKey = m => { for (const st of CPD.stages) { const i = st.modules.indexOf(m); if (i >= 0) return `${st.n}.${i}`; } return ""; };
const cpdModByKey = k => { const [n, i] = k.split("."), st = cpdStage(+n); return st && st.modules[+i]; };
const cpdTestable = m => m.steps.filter(id => !cpdMy(id).done && cpdStep(id).check && !cpdStep(id).evidence);
function cpdOpts(sid) {
  const c = cpdStep(sid).check, P = [[0, 1, 2], [1, 0, 2], [1, 2, 0], [2, 0, 1], [0, 2, 1], [2, 1, 0]];
  let h = 0; for (const ch of sid) h = (h * 31 + ch.charCodeAt(0)) % 997;
  return P[h % 6].map(i => ({ t: c[i + 1], ok: i === 0 }));
}
function cpdStartRun(o) { state.cpdRun = Object.assign({ i: 0, right: 0, picked: null, res: [] }, o); render(); window.scrollTo(0, 0); }
function cpdAnswer(i) {
  const R = state.cpdRun; if (!R || R.picked != null) return;
  const sid = R.ids[R.i], ok = cpdOpts(sid)[i].ok;
  R.picked = i; R.res.push(ok); if (ok) R.right++;
  if (R.mode !== "test") { // spaced recall: right pushes it further away, wrong brings it back tomorrow
    const prev = cpdMy(sid), box = ok ? (prev.rbox == null ? 0 : Math.min(prev.rbox + 1, CPD_GAPS.length - 1)) : 0;
    cpdSave(sid, Object.assign({}, prev, { rbox: box, rdue: new Date(Date.now() + CPD_GAPS[box] * DAY).toISOString(), rlast: ok, updatedAt: new Date().toISOString() }));
  }
  render();
}
const cpdPassMark = n => Math.ceil(n * 0.7);
function cpdFinishRun() {
  const R = state.cpdRun; if (R.mode !== "test" || R.saved) return; R.saved = true;
  if (R.right < cpdPassMark(R.ids.length)) return;
  const now = new Date();
  R.ids.forEach((id, k) => { if (R.res[k]) cpdSave(id, Object.assign({}, cpdMy(id), { kind: "step", done: true, known: true, doneAt: now.toISOString(), rbox: 1, rdue: new Date(+now + 7 * DAY).toISOString() })); });
}
function cpdRunView() {
  const R = state.cpdRun, n = R.ids.length;
  if (R.i >= n) {
    if (R.mode === "check") { const ok = R.res[0], nx = cpdNext();
      return `<div class="cpd-quiz-res"><div class="cpd-res-ico">${ok ? ic("lock") : ic("repeat")}</div><span class="eyebrow">${ok ? "Locked in" : "Nearly"}</span><h2 class="cpd-title">${ok ? "Step done" : "Step done, we'll revisit"}</h2>
        <p>${ok ? "It'll pop up again tomorrow as a quick recall, then less and less often. That's what makes it stick." : "It'll come back tomorrow as a quick recall. Getting it wrong now actually helps you remember it."}</p>
        ${cpdMomentum(true)}
        <button type="button" class="btn primary big" data-cpdquit>${nx ? `Next: ${esc(cpdStep(nx).title)} →` : "See my pathway"}</button></div>`; }
    if (R.mode === "recall") return `<div class="cpd-quiz-res"><div class="cpd-res-ico">${ic("brain")}</div><span class="eyebrow">Recall done</span><h2 class="cpd-title">${R.right} of ${n}</h2>
        <p>${R.right === n ? "Every one. These won't come back for a while." : "The ones you missed come back tomorrow. The ones you got come back less often."}</p>
        <button type="button" class="btn primary big" data-cpdquit>Back to my next step</button></div>`;
    const need = cpdPassMark(n), pass = R.right >= need, got = R.res.filter(Boolean).length, m = cpdModuleOf(R.ids[0]);
    return `<div class="cpd-quiz-res"><div class="cpd-res-ico">${pass ? ic("bolt") : ic("book")}</div><span class="eyebrow">${esc(R.title)}</span><h2 class="cpd-title">${pass ? `${got} step${got > 1 ? "s" : ""} cleared` : `${R.right} of ${n}`}</h2>
      <p>${pass ? `You tested out${got < n ? `; the ${n - got} you missed stay on your pathway` : ""}. ${m && m.steps.some(id => !cpdMy(id).done && cpdStep(id).evidence) ? "Portfolio steps still need doing on the grass." : ""}` : `You needed ${need}. Work through the steps; they're quick when you already know most of it.`}</p>
      <button type="button" class="btn primary big" data-cpdquit="path">Back to my pathway</button></div>`;
  }
  const sid = R.ids[R.i], w = cpdStep(sid), opts = cpdOpts(sid), pk = R.picked;
  const label = R.mode === "recall" ? `${ic("brain")} Recall` : R.mode === "test" ? `${ic("bolt")} Test out · ${esc(R.title)}` : `${ic("lock")} Lock it in`;
  return `<div class="cpd-run cpd-quiz"><div class="cpd-quiz-top"><span class="eyebrow">${label}${n > 1 ? ` · ${R.i + 1} of ${n}` : ""}</span>${n > 1 ? `<div class="cpd-bar"><span style="width:${Math.round(100 * R.i / n)}%"></span></div>` : ""}</div>
    <small class="cpd-run-from">${ic(CPD_ICON[w.type] || "ball")} ${esc(w.title)}</small>
    <h2 class="cpd-title">${esc(w.check[0])}</h2>
    <div class="cpd-quiz-opts">${opts.map((o, i) => `<button type="button" class="cpd-quiz-o${pk != null ? (o.ok ? " ok" : pk === i ? " no" : " dim") : ""}" data-cpdopt="${i}"${pk != null ? " disabled" : ""}>${esc(o.t)}</button>`).join("")}</div>
    ${pk != null ? `<div class="cpd-callout${opts[pk].ok ? "" : " warn"}"><span>${opts[pk].ok ? ic("check") : ic("bulb")}</span><div><b>${opts[pk].ok ? "Right" : `It's "${esc(w.check[1])}"`}</b><p>${esc(firstSentence(w.why))}</p></div></div>
      <button type="button" class="btn primary big" data-cpdnext>${R.i + 1 < n ? "Next" : "Finish"}</button>` : (R.mode === "check" ? "" : `<div><button type="button" class="linkbtn" data-cpdquit>Stop</button></div>`)}</div>`;
}
function cpdMomentum(compact) {
  const g = cpdGoal(), wk = cpdDoneIn(0), due = cpdDue().length, streak = cpdStreak(), nx = cpdNext();
  const stn = nx ? cpdStep(nx).stage : 0, left = stn ? cpdStageSteps(stn).filter(id => !cpdMy(id).done).length : 0;
  const recent = [1, 2, 3, 4].reduce((a, o) => a + cpdDoneIn(o), 0) / 4, rate = Math.max(recent, g);
  const by = left ? new Date(Date.now() + Math.ceil(left / rate) * 7 * DAY) : null;
  const r = 19, c = 2 * Math.PI * r, p = Math.min(1, wk / g);
  const m = nx ? cpdModuleOf(nx) : null, canTest = m && cpdTestable(m).length > 1;
  return `<div class="cpd-mo">
    <div class="cpd-mo-row">
      <button type="button" class="cpd-mo-b" data-cpdgoal aria-expanded="${!!state.cpdGoalOpen}"><svg viewBox="0 0 48 48" class="cpd-ring sm"><circle cx="24" cy="24" r="${r}" class="r0"/><circle cx="24" cy="24" r="${r}" class="r1" stroke-dasharray="${(c * p).toFixed(1)} ${c.toFixed(1)}" transform="rotate(-90 24 24)"/><text x="24" y="28" text-anchor="middle">${wk}/${g}</text></svg><span><b>This week</b><small>${wk >= g ? "Goal hit ✓" : `${g - wk} to go`}</small></span></button>
      <div class="cpd-mo-b"><span class="cpd-mo-n">${ic("flame")}${streak}</span><span><b>Streak</b><small>week${streak === 1 ? "" : "s"}</small></span></div>
      ${compact ? "" : `<button type="button" class="cpd-mo-b${due ? " hot" : ""}" data-cpdrun="recall"${due ? "" : " disabled"}><span class="cpd-mo-n">${ic("brain")}${Math.min(due, 5)}</span><span><b>Recall</b><small>${due ? "1 min" : "All fresh"}</small></span></button>`}
    </div>
    ${state.cpdGoalOpen && !compact ? `<div class="cpd-goal-pick"><span>Steps a week</span>${[1, 2, 3, 5].map(n => `<button type="button" class="chip" aria-pressed="${n === g}" data-cpdsetgoal="${n}">${n}</button>`).join("")}</div>` : ""}
    ${by ? `<p class="cpd-pace">At ${Math.round(rate * 10) / 10} a week, stage ${stn} done by <b>${esc(fmtDay(by, { day: "numeric", month: "short" }))}</b>.${!compact && canTest ? ` <button type="button" class="linkbtn" data-cpdtest="${cpdModKey(m)}">${ic("bolt")} Already know ${esc(m.title.toLowerCase())}? Test out</button>` : ""}</p>` : ""}
  </div>`;
}

function cpdPathView() {
  const s0 = cpdStartStage(), next = cpdNext(), all = cpdPath(), done = cpdDoneCount(all);
  const ring = (d, t) => { const p = t ? d / t : 0, r = 22, c = 2 * Math.PI * r; return `<svg viewBox="0 0 54 54" class="cpd-ring"><circle cx="27" cy="27" r="${r}" class="r0"/><circle cx="27" cy="27" r="${r}" class="r1" stroke-dasharray="${(c * p).toFixed(1)} ${c.toFixed(1)}" transform="rotate(-90 27 27)"/><text x="27" y="31" text-anchor="middle">${Math.round(p * 100)}%</text></svg>`; };
  const stepRow = id => { const w = cpdStep(id), r = cpdMy(id), cls = r.done ? "done" : id === next ? "now" : "";
    return `<button type="button" class="cpd-row ${cls}" data-cpdgo="${id}"><span class="cpd-tick" aria-hidden="true">${r.done ? (r.known ? ic("bolt") : "✓") : id === next ? "▶" : ""}</span><span class="cpd-row-t">${esc(w.title)}</span><small>${CPD_ICON[w.type] ? ic(CPD_ICON[w.type]) : ""}${w.evidence ? " " + ic("folder") : ""}</small></button>`; };
  const modCard = mm => { const d = cpdDoneCount(mm.steps), open = mm.steps.includes(next);
    return `<details class="cpd-modc" ${open ? "open" : ""}><summary><span class="cpd-mod-t">${esc(mm.title)}</span><span class="cpd-mini"><i style="width:${Math.round(100 * d / mm.steps.length)}%"></i></span><small>${d}/${mm.steps.length}</small></summary>${mm.steps.map(stepRow).join("")}${cpdTestable(mm).length > 1 ? `<button type="button" class="cpd-testout" data-cpdtest="${cpdModKey(mm)}">${ic("bolt")} Know this already? Test out</button>` : ""}</details>`; };
  const stage = st => { const ids = cpdStageSteps(st.n), d = cpdDoneCount(ids);
    return `<section class="cpd-stage2"><div class="cpd-stage-h">${ring(d, ids.length)}<div><b>Stage ${st.n} · ${esc(st.title)}</b><small>${esc(st.aim)}</small></div></div>${st.modules.map(modCard).join("")}</section>`; };
  const mine = CPD.stages.filter(st => st.n >= s0), earlier = CPD.stages.filter(st => st.n < s0);
  return `<div class="cpd-sum"><div><b>${done}</b><small>steps done</small></div><div><b>${all.length - done}</b><small>to go</small></div><div><b>${Object.values((Local.cache && Local.cache.cpd) || {}).filter(r => r && r.coach === ACCESS.uid && (r.evidence || "").trim()).length}</b><small>portfolio</small></div></div>
    ${mine.map(stage).join("")}
    ${earlier.length ? `<details class="cpd-earlier"><summary>Earlier stages (optional)</summary>${earlier.map(stage).join("")}</details>` : ""}
    <div class="cpd-links"><button type="button" class="linkbtn" data-cpdpick>Change starting stage</button><button type="button" class="linkbtn" data-cpdquiz>${(CPD_STYLES[cpdStyle()] || {}).icon || ""} Retake the learning quiz</button></div>`;
}

function cpdPortfolio() {
  const items = Object.values((Local.cache && Local.cache.cpd) || {}).filter(r => r && r.coach === ACCESS.uid);
  const stepEv = CPD.stages.flatMap(st => cpdStageSteps(st.n)).filter(id => cpdStep(id).evidence);
  const have = stepEv.filter(id => (cpdMy(id).evidence || "").trim()), want = stepEv.filter(id => cpdPath().includes(id) && !(cpdMy(id).evidence || "").trim());
  const notes = items.filter(r => r.kind === "note").sort((a, b) => (b.updatedAt || "").localeCompare(a.updatedAt || ""));
  const ev = t => esc(t).replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>').replace(/\n/g, "<br>");
  return `<div class="cpd-head"><div class="eyebrow">${ic("lock")} Only you can see your portfolio</div><h2 class="cpd-title" style="margin:0">Portfolio</h2>
      <p class="muted" style="margin:0">${have.length} piece${have.length === 1 ? "" : "s"} of evidence${want.length ? ` · ${want.length} still to add on your pathway` : ""}</p></div>
    ${have.length ? have.map(id => { const w = cpdStep(id), r = cpdMy(id); return `<article class="card cpd-port"><div class="eyebrow">Stage ${w.stage} · ${esc(w.title)}${r.doneAt ? ` · ${esc(fmtDay(new Date(r.doneAt), { day: "numeric", month: "short", year: "numeric" }))}` : ""}</div>
      <b>${esc(w.evidence)}</b><p class="cpd-ev-text">${ev(r.evidence)}</p><div><button type="button" class="linkbtn" data-cpdgo="${id}">Open step</button></div></article>`; }).join("")
      : `<div class="card empty">Your evidence appears here as you complete steps marked ${ic("folder")}.</div>`}
    <form class="card form" id="cpd-note-form"><h3 class="cpd-h">Add your own</h3>
      <div class="field"><label for="cpd-note-t">Title</label><input type="text" id="cpd-note-t" maxlength="120" placeholder="e.g. Safeguarding course, observed a pro academy session"></div>
      <div class="field"><label for="cpd-note-b">Details or link</label><textarea id="cpd-note-b" maxlength="3000"></textarea></div>
      <div class="actions"><button type="submit" class="btn primary">Add to portfolio</button></div></form>
    ${notes.map(r => `<article class="card cpd-port"><div class="eyebrow">Your note · ${esc(fmtDay(new Date(r.updatedAt), { day: "numeric", month: "short", year: "numeric" }))}</div><b>${esc(r.title)}</b>${r.text ? `<p class="cpd-ev-text">${ev(r.text)}</p>` : ""}<div><button type="button" class="linkbtn" data-cpdnotedel="${esc(r.step)}">Remove</button></div></article>`).join("")}`;
}

function bindDevelop() {
  const leave = () => !cpdDirty() || confirm("You have unsaved changes to your reflection. Leave without saving?");
  document.querySelectorAll("[data-cpdtab]").forEach(b => b.onclick = () => { if (!leave()) return; state.cpdDirty = false; state.cpdTab = b.dataset.cpdtab; if (b.dataset.cpdtab === "next") state.cpdOpen = null; render(); window.scrollTo(0, 0); });
  document.querySelectorAll("[data-cpdgo]").forEach(b => b.onclick = () => { if (!leave()) return; state.cpdDirty = false; state.cpdOpen = b.dataset.cpdgo; state.cpdTab = "next"; render(); window.scrollTo(0, 0); });
  document.querySelectorAll("[data-cpdstart]").forEach(b => b.onclick = () => { cpdSave("start", { kind: "start", stage: +b.dataset.cpdstart }); state.cpdPick = false; state.cpdOpen = null; state.cpdTab = "next"; toast(`Starting at stage ${b.dataset.cpdstart}`); render(); window.scrollTo(0, 0); });
  document.querySelectorAll("[data-cpdans]").forEach(b => b.onclick = () => { state.cpdQuizAns = (state.cpdQuizAns || []).concat(b.dataset.cpdans); render(); window.scrollTo(0, 0); });
  const qb = $("[data-cpdback]"); if (qb) qb.onclick = () => { state.cpdQuizAns = (state.cpdQuizAns || []).slice(0, -1); render(); };
  document.querySelectorAll("[data-cpdstyle]").forEach(b => b.onclick = () => { cpdSave("style", { kind: "style", style: b.dataset.cpdstyle, answers: state.cpdQuizAns || [] }); state.cpdQuiz = false; state.cpdQuizAns = []; toast(`${CPD_STYLES[b.dataset.cpdstyle].name} layout on`); render(); window.scrollTo(0, 0); });
  document.querySelectorAll("[data-cpdquiz]").forEach(b => b.onclick = () => { state.cpdQuiz = true; state.cpdQuizAns = []; render(); window.scrollTo(0, 0); });
  document.querySelectorAll("[data-cpdrun]").forEach(b => b.onclick = () => { const ids = cpdDue().slice(0, 5).map(r => r.step); if (ids.length) cpdStartRun({ mode: "recall", ids }); });
  document.querySelectorAll("[data-cpdtest]").forEach(b => b.onclick = () => { const m = cpdModByKey(b.dataset.cpdtest); if (m) cpdStartRun({ mode: "test", ids: cpdTestable(m), title: m.title }); });
  document.querySelectorAll("[data-cpdopt]").forEach(b => b.onclick = () => cpdAnswer(+b.dataset.cpdopt));
  const rn = $("[data-cpdnext]"); if (rn) rn.onclick = () => { const R = state.cpdRun; R.i++; R.picked = null; if (R.i >= R.ids.length) cpdFinishRun(); render(); window.scrollTo(0, 0); };
  document.querySelectorAll("[data-cpdquit]").forEach(b => b.onclick = () => { const go = b.dataset.cpdquit; state.cpdRun = null; state.cpdOpen = null; state.cpdTab = go || "next"; render(); window.scrollTo(0, 0); });
  const gl = $("[data-cpdgoal]"); if (gl) gl.onclick = () => { state.cpdGoalOpen = !state.cpdGoalOpen; render(); };
  document.querySelectorAll("[data-cpdsetgoal]").forEach(b => b.onclick = () => { cpdSave("goal", { kind: "goal", perWeek: +b.dataset.cpdsetgoal }); state.cpdGoalOpen = false; toast(`Goal: ${b.dataset.cpdsetgoal} step${b.dataset.cpdsetgoal > 1 ? "s" : ""} a week`); render(); });
  const pk = $("[data-cpdpick]"); if (pk) pk.onclick = () => { state.cpdPick = true; render(); window.scrollTo(0, 0); };
  const pc = $("[data-cpdpickclose]"); if (pc) pc.onclick = () => { state.cpdPick = false; render(); };
  const nf = $("#cpd-note-form");
  if (nf) nf.onsubmit = e => { e.preventDefault(); const t = $("#cpd-note-t").value.trim(), x = $("#cpd-note-b").value.trim(); if (!t) return toast("Add a title first.");
    cpdSave("p" + Date.now().toString(36), { kind: "note", title: t, text: x }); toast("Added to your portfolio"); render(); };
  document.querySelectorAll("[data-cpdnotedel]").forEach(b => b.onclick = async () => { if (!(await Comms.yes("Remove this from your portfolio?", "", "Remove"))) return; window._db.collection("cpd").doc(cpdId(ACCESS.uid, b.dataset.cpdnotedel)).delete(); render(); });
  const more = $("[data-cpdmore]"); if (more) more.onclick = () => { more.hidden = true; $(".cpd-why-rest").hidden = false; };
  document.querySelectorAll("[data-cpdtick]").forEach(b => b.onclick = () => {
    const f0 = $("#cpd-form"); if (!f0) return; const sid = f0.dataset.step, prev = cpdMy(sid), i = +b.dataset.cpdtick;
    const ticks = (prev.ticks || []).includes(i) ? prev.ticks.filter(x => x !== i) : (prev.ticks || []).concat(i);
    cpdSave(sid, Object.assign({}, prev, { kind: "step", ticks })); b.classList.toggle("on"); b.setAttribute("aria-pressed", b.classList.contains("on")); b.querySelector(".cpd-box").textContent = b.classList.contains("on") ? "✓" : i + 1;
  });
  document.querySelectorAll("[data-cpdrate]").forEach(b => b.onclick = () => { document.querySelectorAll("[data-cpdrate]").forEach(x => { x.classList.toggle("on", x === b); x.setAttribute("aria-checked", x === b); }); $("#cpd-rating").value = b.dataset.cpdrate; state.cpdDirty = true; });
  const f = $("#cpd-form"); if (!f) return;
  f.addEventListener("input", () => { state.cpdDirty = true; });
  f.onsubmit = e => {
    e.preventDefault();
    const sid = f.dataset.step, prev = cpdMy(sid), rating = +$("#cpd-rating").value;
    if (!rating) { $("#cpd-msg").textContent = "Tap how it went first."; $("#cpd-msg").className = "cpd-msg bad"; return; }
    const answers = [...f.querySelectorAll("[data-cpdq]")].map(t => t.value.trim());
    const evEl = $("#cpd-ev"), evidence = evEl ? evEl.value.trim() : (prev.evidence || "");
    cpdSave(sid, Object.assign({}, prev, { kind: "step", rating, answers, next: $("#cpd-next").value.trim(), evidence, done: true, doneAt: prev.doneAt || new Date().toISOString() }));
    state.cpdDirty = false;
    if (!prev.done && cpdStep(sid).check) { state.cpdOpen = null; toast("Done ✓ One quick question to lock it in"); return cpdStartRun({ mode: "check", ids: [sid] }); }
    if (!prev.done) { state.cpdOpen = null; const nx = cpdNext(); toast(nx ? `Nice. Next: ${cpdStep(nx).title}` : "Pathway complete. Brilliant work."); window.scrollTo(0, 0); }
    else toast("Saved");
    render();
  };
}
function cpdDirty() { return (state.tab === "develop" || (state.tab === "coaches" && state.coachSub === "develop")) && !!state.cpdDirty && !!$("#cpd-form"); }

function homeExtras() {
  const rows = [], row = (href, k, title, sub, hot) => `<a class="todo${hot ? " hot" : ""}" href="${href}"><span class="todo-k">${k}</span><b>${title}</b>${sub ? `<small>${sub}</small>` : ""}<i aria-hidden="true">›</i></a>`;
  const openCov = state.cal ? (state.cal.covers || []).filter(x => x.status === "open" && x.needed_for !== ACCESS.uid).length : 0;
  if (openCov) rows.push(row("#cover", "Cover", `${openCov} session${openCov > 1 ? "s" : ""} need${openCov > 1 ? "" : "s"} a coach`, "", true));
  const pend = ACCESS.admin && state.cal ? (state.cal.holidays || []).filter(h => h.status === "pending").length : 0;
  if (pend) rows.push(row("#approvals", "Approve", `${pend} time-off request${pend > 1 ? "s" : ""}`, "", true));
  if (CPD && Comms.isStaff()) {
    const nx = cpdStartStage() ? cpdNext() : null;
    if (!cpdStartStage()) rows.push(row("#develop", "Develop", "Start your coaching pathway", "Pick your stage · 1 min", false));
    else if (nx) rows.push(row("#develop", "Develop", esc(cpdStep(nx).title), `Stage ${cpdStep(nx).stage} · ${cpdStep(nx).mins} min`, false));
    const ciT = ciToday(); if (ciT.length) rows.push(`<button type="button" class="todo ci-todo" data-ciopen data-cig="${esc(ciT[0].group_id || "")}" data-cit="${esc(ciT[0].start.toISOString())}"><span class="todo-k">Check in</span><b>Check a player in</b><small>${esc(ciT[0].title)} · goes to the check-in register</small><i aria-hidden="true">›</i></button>`);
    prepDue().filter(x => !prepRec(x.s.key).pass).forEach(x => rows.push(row("#prep", "Prep", `${esc(prepDay(x.s))}: ${esc(x.s.title)}`, `Learn it + ${prepQs(x.s).length} questions · 5 min`, true)));
    const due = cpdStartStage() ? cpdDue().length : 0;
    if (due) rows.push(row("#develop", "Recall", `${Math.min(due, 5)} quick question${due > 1 ? "s" : ""}`, "1 min · keeps it in your head", false));
  }
  return rows.length ? `<div class="todos">${rows.join("")}</div>` : "";
}

let peopleAt = 0;
async function refreshPeople(force) {
  const sb = window.B2B_SB; if (!sb || !navigator.onLine || (!force && Date.now() - peopleAt < 60000)) return false;
  peopleAt = Date.now();
  const { data, error } = await sb.from("profiles").select("id,name,role,groups");
  if (error || !data) return false;
  const next = Object.fromEntries(data.map(p => [p.id, { name: p.name, role: p.role, groups: p.groups || [] }]));
  const changed = JSON.stringify(next) !== JSON.stringify(state.profiles);
  if (changed) { state.profiles = next; ACCESS.profiles = next; }
  return changed;
}
/* ---------- calendar ---------- */
state.cal = store.get("b2b.cal", null);
state.calOffset = 0; state.calTab = store.get("b2b.calTab", "cal");
let calLoading = null;
async function calLoad(force) {
  const sb = window.B2B_SB; if (!sb || !navigator.onLine) return;
  if (calLoading && !force) return calLoading;
  calLoading = (async () => {
    try {
      const [ev, ho] = await Promise.all([sb.from("events").select("*").order("starts_at"), sb.from("holidays").select("*").order("start_date"), refreshPeople()]);
      if (ev.error) throw ev.error; if (ho.error) throw ho.error;
      const cv = Comms.isStaff() ? await sb.from("covers").select("*").gte("ends_at", new Date().toISOString()).order("starts_at") : { data: [] };
      const fx = await Comms.loadFixtures();
      state.cal = { events: (ev.data || []).concat(fx || (state.cal && state.cal.events || []).filter(e => e.fixture)), holidays: ho.data || [], covers: cv.data || [], token: null, at: new Date().toISOString() };
      state.calErr = null; state.calFresh = Date.now(); setTimeout(paintCoachDot);
      store.set("b2b.cal", { ...state.cal, token: null });
    } catch (e) { state.calErr = String(e && e.message || e); state.calFresh = Date.now(); }
    calLoading = null;
    if (state.tab === "calendar" || state.tab === "coaches" || state.tab === "home" || state.tab === "team") rerenderSoft();
  })();
  return calLoading;
}
function occurrences(e, from, to) {
  const s = new Date(e.starts_at), dur = new Date(e.ends_at) - s, out = [];
  const until = e.repeat_until ? addDays(dayOf(e.repeat_until), 1) : null;
  for (let k = 0; k < 400; k++) {
    const d = new Date(s); d.setDate(d.getDate() + 7 * k);
    if (k > 0 && (!until || d >= until)) break;
    if (d >= to) break;
    if (d >= from) out.push({ e, start: d, end: new Date(d.getTime() + dur) });
  }
  return out;
}
/* what this person sees: coaches only their own groups (+ club-wide entries); the head coach sees everything */
function calItems(from, to) {
  const c = state.cal, admin = ACCESS.admin, mine = new Set(ACCESS.groups || []);
  const showGroup = gid => admin || mine.has(gid);
  const items = [], slot = {};
  if (c) {
    (c.events || []).filter(e => e.group_id ? showGroup(e.group_id) : (admin || e.kind === "event"))
      .forEach(e => occurrences(e, from, to).forEach(o => { const it = { day: isoOf(o.start), t: o.start, kind: "event", o, sess: [] }; items.push(it); if (e.group_id) slot[e.group_id + "|" + it.day] = it; }));
    (c.holidays || []).filter(h => h.status === "approved" || (h.status === "pending" && (admin || h.coach_id === ACCESS.uid))).forEach(h => {
      for (let d = dayOf(h.start_date); d <= dayOf(h.end_date); d = addDays(d, 1)) if (d >= from && d < to) items.push({ day: isoOf(d), t: d, kind: "off", h });
    });
  }
  GROUPS.filter(g => showGroup(g.id)).forEach(g => (PROGS[g.prog].sessions || []).forEach(sx => {
    if (!(sx.dt >= from && sx.dt < to)) return;
    const day = isoOf(sx.dt), linked = slot[g.id + "|" + day];
    if (linked) linked.sess.push({ g, s: sx });
    else items.push({ day, t: sx.dt, kind: "sess", g, s: sx });
  }));
  items.sort((x, y) => x.day.localeCompare(y.day) || (x.kind === "off" ? -1 : 1) - (y.kind === "off" ? -1 : 1) || x.t - y.t);
  return items;
}
const dotKind = i => i.kind === "off" ? "off" : i.kind === "sess" ? "sess" : (i.o.e.kind === "match" ? "match" : i.o.e.kind === "meeting" ? "meeting" : "session");
function calItemHtml(i, many) {
  if (i.kind === "off") return `<div class="cal-item k-off${i.h.status === "pending" ? " pending" : ""}"><b>${esc(personName(i.h.coach_id))} off</b>${i.h.status === "pending" ? `<span class="cal-sub">Waiting for approval</span>` : ""}</div>`;
  if (i.kind === "sess") return `<button type="button" class="cal-item k-sess" data-calsess="${esc(i.g.id)}|${esc(i.s.key)}"><span class="cal-time">${esc(i.g.long)}</span><b>${esc(i.s.title)}</b><span class="cal-open">Open session plan →</span></button>`;
  const e = i.o.e;
  if (many) { const key = Comms.rsvpKey(e.id, i.day);
    return Comms.fold(key, Comms.foldHead(fmtTime(i.o.start), e.title, [e.group_id ? Comms.gname(e.group_id) : "", (e.location || "").split(",")[0]].filter(Boolean).join(" · "), e.kind), calItemHtml(i, false)); }
  return `<div class="cal-item k-${esc(e.kind)}">
    <span class="cal-time">${esc(fmtTime(i.o.start))}–${esc(fmtTime(i.o.end))}</span><b>${esc(e.title)}</b>
    ${Comms.venueLine(e.location)}${e.notes ? `<span class="cal-sub">${esc(e.notes)}</span>` : ""}
    ${e.kind === "session" ? Comms.sylAim(e.group_id, i.day, { short: true }) : ""}
    ${(i.sess || []).map(x => `<button type="button" class="cal-link" data-calsess="${esc(x.g.id)}|${esc(x.s.key)}">${esc(x.s.title)} →</button>`).join("")}
    ${Comms.rsvpBar(Comms.rsvpKey(e.id, i.day), e.group_id)}</div>`;
}
function monthGrid(byDay, from, to, sel) {
  const todayIso = isoOf(today0()), cells = [];
  for (let d = mondayOf(from); d < to || cells.length % 7; d = addDays(d, 1)) cells.push(d);
  return `<div class="card cal-month"><div class="cal-grid">${["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(x => `<span class="cal-wd">${x}</span>`).join("")}${cells.map(d => {
    const iso = isoOf(d), list = byDay[iso] || [], inM = d.getMonth() === from.getMonth();
    const kinds = [...new Set(list.map(dotKind))];
    return `<button type="button" class="cal-cell${inM ? "" : " out"}${iso === todayIso ? " today" : ""}${iso === sel ? " sel" : ""}${list.length ? " has" : ""}" data-calday="${iso}" ${inM ? "" : "disabled tabindex='-1'"} aria-label="${esc(fmtDay(d, { weekday: "long", day: "numeric", month: "long" }))}${list.length ? `, ${list.length} thing${list.length > 1 ? "s" : ""} on` : ", nothing on"}"><span>${d.getDate()}</span><i>${kinds.slice(0, 3).map(k => `<em class="d-${k}"></em>`).join("")}</i></button>`;
  }).join("")}</div>
  <p class="cal-legend"><span><em class="d-sess"></em>Session</span><span><em class="d-session"></em>Training time</span><span><em class="d-match"></em>Match</span><span><em class="d-off"></em>Coach off</span></p></div>`;
}
function calTabs(tabs, cur, attr) {
  return `<div class="subtabs" role="tablist">${tabs.map(([k, l, n]) => `<button type="button" role="tab" class="subtab" ${attr}="${k}" aria-selected="${cur === k}">${esc(l)}${n ? ` <span class="subtab-n">${n}</span>` : ""}</button>`).join("")}</div>`;
}
function calendarView(forced) {
  const c = state.cal, admin = ACCESS.admin;
  const pending = admin && c ? (c.holidays || []).filter(h => h.status === "pending").sort((a, b) => a.start_date.localeCompare(b.start_date)) : [];
  const openCovers = c ? (c.covers || []).filter(x => x.status === "open" && x.needed_for !== ACCESS.uid) : [];
  const tabs = [["cal", "Calendar"], ["off", "Time off"], ["cover", "Cover", openCovers.length]];
  if (admin) tabs.push(["admin", "Admin", pending.length]);
  const tab = forced || "cal";
  const head = forced ? "" : `<div><h1 class="sec-title" style="font-size:34px">Calendar</h1></div>`;
  let body = "";
  if (tab === "cal") {
    const t0 = today0(), from = new Date(t0.getFullYear(), t0.getMonth() + state.calOffset, 1), to = new Date(from.getFullYear(), from.getMonth() + 1, 1);
    const items = calItems(from, to), byDay = {};
    items.forEach(i => (byDay[i.day] = byDay[i.day] || []).push(i));
    const todayIso = isoOf(t0), sel = state.calDay && state.calDay >= isoOf(from) && state.calDay < isoOf(to) ? state.calDay : (todayIso >= isoOf(from) && todayIso < isoOf(to) ? todayIso : isoOf(from));
    const dayItems = byDay[sel] || [];
    Comms.loadRsvps(dayItems.filter(i => i.kind === "event").map(i => Comms.rsvpKey(i.o.e.id, i.day)));
    body = `<div class="cal-nav">
        <button class="btn small ghost" data-calmove="-1" aria-label="Previous month">←</button>
        <b>${esc(from.toLocaleDateString("en-GB", { month: "long", year: "numeric" }))}</b>
        <button class="btn small ghost" data-calmove="1" aria-label="Next month">→</button>
      </div>
      ${state.calOffset ? `<div><button class="chip" data-calmove="0">Back to today</button></div>` : ""}
      ${!c && !items.length ? `<div class="card empty">${navigator.onLine ? "Loading the calendar…" : "Connect to the internet once to load the calendar."}</div>` : monthGrid(byDay, from, to, sel)}
      <div class="cal-dayhead"><h2>${esc(fmtDay(dayOf(sel), { weekday: "long", day: "numeric", month: "long" }))}</h2></div>
      ${dayItems.length ? `<div class="cal-items day-list">${dayItems.map(i => calItemHtml(i, dayItems.filter(x => x.kind === "event").length > 1)).join("")}</div>` : `<div class="card empty">Nothing on this day.</div>`}`;
  } else if (tab === "off") {
    const myReq = c ? (c.holidays || []).filter(h => h.coach_id === ACCESS.uid).sort((a, b) => b.start_date.localeCompare(a.start_date)) : [];
    const upcoming = c ? (c.holidays || []).filter(h => h.status === "approved" && h.end_date >= isoOf(today0()) && h.coach_id !== ACCESS.uid).sort((a, b) => a.start_date.localeCompare(b.start_date)) : [];
    const tomorrow = isoOf(addDays(today0(), 1));
    body = `<form class="card form" id="hol-form">
        <h3 class="cpd-h">Book time off</h3>
        <div class="row3" style="grid-template-columns:1fr 1fr">
          <div class="field"><label for="hol-from">From</label><input type="date" id="hol-from" min="${isoOf(today0())}" value="${tomorrow}" required></div>
          <div class="field"><label for="hol-to">To</label><input type="date" id="hol-to" min="${isoOf(today0())}" value="${tomorrow}" required></div>
        </div>
        <div class="field"><label for="hol-why">Reason (optional)</label><input type="text" id="hol-why" maxlength="300" placeholder="e.g. Family holiday"></div>
        <div class="actions"><button class="btn primary" type="submit">${admin ? "Add time off" : "Send request"}</button></div>
        <p class="muted" id="hol-msg" aria-live="polite" style="margin:0;font-size:14px">${admin ? "Your own time off is approved straight away." : "The head coach approves or declines it."}</p>
      </form>
      <div class="card cal-list"><h3 class="cpd-h">Your requests</h3>${myReq.length ? myReq.map(h => `<div class="cal-req row"><span>${esc(holRange(h))}</span><span class="pill st-${h.status}">${h.status === "pending" ? "Waiting" : h.status === "approved" ? "Approved" : "Declined"}</span>${h.admin_note ? `<span class="muted">“${esc(h.admin_note)}”</span>` : ""}${h.status !== "approved" || admin ? `<button type="button" class="btn small ghost" data-hdel="${h.id}">${h.status === "pending" ? "Cancel" : "Remove"}</button>` : ""}</div>`).join("") : `<p class="muted" style="margin:0">None yet.</p>`}</div>
      ${upcoming.length ? `<div class="card cal-list"><h3 class="cpd-h">Other coaches off</h3>${upcoming.map(h => `<div class="cal-req row"><span><b>${esc(personName(h.coach_id))}</b></span><span class="muted">${esc(holRange(h))}</span></div>`).join("")}</div>` : ""}`;
  } else if (tab === "cover") {
    body = coverView();
  } else {
    const overlap = h => (c.holidays || []).filter(o => o.id !== h.id && o.status === "approved" && o.start_date <= h.end_date && o.end_date >= h.start_date);
    const approvals = pending.length ? `<div class="card cal-approve">${pending.map(h => { const ov = overlap(h), n = holDays(h); return `<div class="cal-req">
        <div><b>${esc(personName(h.coach_id))}</b> · ${esc(holRange(h))} <span class="muted">(${n} day${n > 1 ? "s" : ""})</span></div>
        ${h.reason ? `<div class="muted">${esc(h.reason)}</div>` : ""}
        ${ov.length ? `<div class="cal-warn">Also off then: ${ov.map(o => esc(personName(o.coach_id))).join(", ")}</div>` : ""}
        <input type="text" placeholder="Note to coach (optional)" data-hnote="${h.id}" aria-label="Note to coach">
        <div class="actions"><button class="btn small primary" data-hdecide="${h.id}|approved">Approve</button><button class="btn small ghost" data-hdecide="${h.id}|declined">Decline</button></div></div>`; }).join("")}
        <p class="muted" style="margin:0;font-size:13px">Approving asks free coaches to cover.</p></div>`
      : `<div class="card empty">No time-off requests waiting.</div>`;
    body = `<h2 class="sec-sub">Time off to approve</h2>${approvals}
      <h2 class="sec-sub">Coaches this week</h2>${availabilityView()}
      <h2 class="sec-sub">Weekly timetable</h2>${calAdminCards()}`;
  }
  return `<section class="view">${head}${body}</section>`;
}
const holDays = h => Math.round((dayOf(h.end_date) - dayOf(h.start_date)) / 864e5) + 1;
const holRange = h => h.start_date === h.end_date ? fmtDay(dayOf(h.start_date), { weekday: "short", day: "numeric", month: "short" })
  : `${fmtDay(dayOf(h.start_date), { day: "numeric", month: "short" })} – ${fmtDay(dayOf(h.end_date), { day: "numeric", month: "short", year: "numeric" })}`;
function calAdminCards() {
  const c = state.cal || { events: [] };
  const day = new Date(), d0 = isoOf(addDays(day, (9 - day.getDay()) % 7 || 7));
  const evs = (c.events || []).filter(e => !e.fixture).slice().sort((a, b) => (a.starts_at > b.starts_at ? 1 : -1));
  const wd = s => new Date(s).toLocaleDateString("en-GB", { weekday: "long" });
  return `

    ${evs.length ? `<div class="card cal-list"><h3 class="cpd-h">Weekly timetable</h3>${evs.map(e => `<div class="cal-req row"><span><b>${esc(e.title)}</b><br><span class="muted">${e.repeat_until ? `Every ${esc(wd(e.starts_at))} ${esc(fmtTime(new Date(e.starts_at)))} until ${esc(fmtDay(dayOf(e.repeat_until), { day: "numeric", month: "short", year: "numeric" }))}` : `${esc(fmtDay(new Date(e.starts_at), { weekday: "short", day: "numeric", month: "short", year: "numeric" }))} ${esc(fmtTime(new Date(e.starts_at)))}`}${e.group_id ? " · " + esc(groupLabel(e.group_id)) : ""}</span></span>${state.evDel === e.id ? `<span class="actions"><button class="btn small" data-evdel="${e.id}">Delete</button><button class="btn small ghost" data-evkeep>Keep</button></span>` : `<button class="btn small ghost" data-evask="${e.id}">Delete</button>`}</div>`).join("")}</div>` : `<div class="card empty">Nothing on the timetable.</div>`}
`;
}
function calMsg(id, text, bad) { const m = $(id); if (m) { m.textContent = text; m.className = bad ? "bad" : "muted"; m.style.fontSize = "14px"; m.style.margin = "0"; } }
function bindCalendar() {
  const sb = window.B2B_SB;
  if (!state.cal || !state.calFresh) calLoad();
  Comms.bindRsvp($("#main")); bindCover();
  document.querySelectorAll("[data-calmove]").forEach(b => b.onclick = () => { const v = +b.dataset.calmove; state.calOffset = v ? state.calOffset + v : 0; state.calDay = null; render(); });
  document.querySelectorAll("[data-caltab]").forEach(b => b.onclick = () => { state.calTab = b.dataset.caltab; store.set("b2b.calTab", state.calTab); render(); });
  document.querySelectorAll("[data-calday]").forEach(b => b.onclick = () => { state.calDay = b.dataset.calday; render(); const h = $(".cal-dayhead"); if (h && window.innerWidth < 700) h.scrollIntoView({ behavior: "smooth", block: "start" }); });
  document.querySelectorAll("[data-calsess]").forEach(b => b.onclick = () => { const [gid, key] = b.dataset.calsess.split("|"); state.team = gid; store.set("b2b.team", gid); state.players = defaultPlayers(); renderTeams(); openSession(key); });
  const hf = $("#hol-form");
  if (hf) {
    $("#hol-from").onchange = () => { if ($("#hol-to").value < $("#hol-from").value) $("#hol-to").value = $("#hol-from").value; };
    hf.onsubmit = async e => {
      e.preventDefault();
      const s = $("#hol-from").value, t = $("#hol-to").value, reason = $("#hol-why").value.trim() || null;
      if (!s || !t || t < s) return calMsg("#hol-msg", "Check the dates: the end can't be before the start.", true);
      if (!navigator.onLine) return calMsg("#hol-msg", "You're offline. Send the request when you have signal.", true);
      const hid = crypto.randomUUID ? crypto.randomUUID() : undefined;
      const row = ACCESS.admin ? { id: hid, start_date: s, end_date: t, reason, status: "approved", decided_at: new Date().toISOString() } : { start_date: s, end_date: t, reason };
      calMsg("#hol-msg", "Sending…");
      const { error } = await sb.from("holidays").insert(row);
      if (error) return calMsg("#hol-msg", "Couldn't send: " + error.message, true);
      toast(ACCESS.admin ? "Time off added" : "Request sent to the head coach");
      if (ACCESS.admin && hid) Comms.notify("cover", hid);
      await calLoad(true); render();
    };
  }
  document.querySelectorAll("[data-hdel]").forEach(b => b.onclick = async () => {
    if (!(await Comms.yes("Remove this time-off request?", "", "Remove"))) return;
    const { error } = await sb.from("holidays").delete().eq("id", b.dataset.hdel);
    if (error) return toast("Couldn't remove: " + error.message);
    await calLoad(true); render();
  });
  document.querySelectorAll("[data-hdecide]").forEach(b => b.onclick = async () => {
    const [id, status] = b.dataset.hdecide.split("|"); const note = (document.querySelector(`[data-hnote="${id}"]`) || {}).value || null;
    b.disabled = true;
    const { error } = await sb.from("holidays").update({ status, admin_note: note && note.trim() || null, decided_at: new Date().toISOString() }).eq("id", id);
    if (error) { b.disabled = false; return toast("Couldn't save: " + error.message); }
    toast(status === "approved" ? "Approved. Free coaches are being asked to cover." : "Declined");
    if (status === "approved") Comms.notify("cover", id);
    await calLoad(true); render();
  });
  const ef = $("#ev-form");
  if (ef) ef.onsubmit = async e => {
    e.preventDefault();
    const d = $("#ev-date").value, st = $("#ev-start").value, en = $("#ev-end").value, until = $("#ev-until").value || null;
    const start = new Date(`${d}T${st}`), end = new Date(`${d}T${en}`);
    if (!(end > start)) return calMsg("#ev-msg", "The end time must be after the start time.", true);
    if (until && until < d) return calMsg("#ev-msg", "The repeat date must be after the first date.", true);
    const row = { title: $("#ev-title").value.trim(), kind: (ef.querySelector("[name=ev-kind]:checked") || {}).value || "session", group_id: $("#ev-group").value || null,
      starts_at: start.toISOString(), ends_at: end.toISOString(), repeat_until: until, location: $("#ev-loc").value.trim() || null, notes: $("#ev-notes").value.trim() || null };
    calMsg("#ev-msg", "Saving…");
    const { error } = await sb.from("events").insert(row);
    if (error) return calMsg("#ev-msg", "Couldn't save: " + error.message, true);
    toast("Added to the calendar");
    await calLoad(true); render();
  };
  document.querySelectorAll("[data-evask]").forEach(b => b.onclick = () => { state.evDel = b.dataset.evask; render(); });
  const ek = $("[data-evkeep]"); if (ek) ek.onclick = () => { state.evDel = null; render(); };
  document.querySelectorAll("[data-evdel]").forEach(b => b.onclick = async () => {
    const { error } = await sb.from("events").delete().eq("id", b.dataset.evdel);
    if (error) return toast("Couldn't delete: " + error.message);
    state.evDel = null; toast("Deleted"); await calLoad(true); render();
  });
}
function calDirty() {
  if (state.tab !== "calendar" && state.tab !== "coaches") return false;
  const f = ["#ev-title", "#ev-loc", "#ev-notes", "#hol-why"].some(s => { const el = $(s); return el && el.value; });
  const notes = [...document.querySelectorAll("[data-hnote]")].some(x => x.value);
  return f || notes || !!state.evDel;
}
window.B2B_HOLD = () => !!document.querySelector("#ops-one-form:focus-within") || cpdDirty() || calDirty() || !!document.querySelector(".rsvp-who[open]") || (state.tab === "chat" && !!document.querySelector("#ann-title,#ann-body") && !!(($("#ann-title") || {}).value || ($("#ann-body") || {}).value));
window.addEventListener("hashchange", () => {
  const t = location.hash.slice(1);
  if (t === "calendar" || t === "coaches") calLoad(true);
  if ((t === "develop" || t === "coaches") && ACCESS.admin) refreshPeople().then(ch => { if (ch) rerenderSoft(); });
});
if (ACCESS.admin || (ACCESS.groups || []).length) calLoad();
setInterval(() => { if (!document.hidden && (state.tab === "calendar" || state.tab === "coaches" || state.tab === "home")) calLoad(); }, 300000);


/* ---------- Team page: one place per team (upcoming + who's coming, chat, news, squad) ---------- */
state.teamTab = store.get("b2b.teamTab2", "");
function teamMembers(gid) {
  return Object.entries(state.profiles || {}).filter(([, p]) => p && (p.groups || []).includes(gid)).map(([id, p]) => ({ id, name: p.name || "Member", role: p.role || "coach" }))
    .sort((a, b) => a.name.localeCompare(b.name));
}
function teamUpcoming(gid, days) {
  const from = today0(), to = addDays(from, days || 35), out = [];
  ((state.cal && state.cal.events) || []).filter(e => (e.group_id === gid || (!e.group_id && e.kind === "event")) && !(Comms.SIDE[gid] && e.kind === "match"))
    .forEach(e => occurrences(e, from, to).forEach(o => { if (o.end > new Date()) out.push({ e, o, key: Comms.rsvpKey(e.id, isoOf(o.start)) }); }));
  return out.sort((a, b) => a.o.start - b.o.start);
}
function teamView() {
  const g = grp(), gid = g.id, mine = GROUPS;
  const tabs = [["up", Comms.SIDE[gid] ? "Training" : "This week"], ["chat", "Chat", Comms.unread(gid) ? "•" : 0], ["news", "News"], ["squad", "Squad"]];
  if (Comms.SIDE[gid]) tabs.unshift(["match", "Match Room"]);
  const tab = tabs.some(t => t[0] === state.teamTab) ? state.teamTab : tabs[0][0];
  state.teamTabNow = tab; Comms.st.teamGroup = gid;
  const sess = ((state.cal && state.cal.events) || []).find(e => e.group_id === gid && e.kind === "session" && e.repeat_until);
  const when = sess ? `${dayOf(isoOf(new Date(sess.starts_at))).toLocaleDateString("en-GB", { weekday: "long" })}s ${fmtTime(new Date(sess.starts_at))}–${fmtTime(new Date(sess.ends_at))}${sess.location ? " · " + esc(sess.location) : ""}` : "";
  const switcher = mine.length > 1 ? `<div class="filters team-switch" role="group" aria-label="Choose team">${mine.map(x => `<button type="button" class="chip" data-teampick="${esc(x.id)}" aria-pressed="${x.id === gid}">${esc(x.chip || x.long)}</button>`).join("")}</div>` : "";
  let body = "";
  const members = teamMembers(gid), fam = members.filter(m => m.role === "parent" || m.role === "player");
  if (tab === "up") {
    const list = teamUpcoming(gid, 7);
    const last = ((state.cal && state.cal.events) || []).filter(e => e.fixture && e.group_id === gid && e.played).sort((a, b) => b.starts_at.localeCompare(a.starts_at))[0];
    const lastHtml = last ? `<div class="team-last"><span class="eyebrow">Last result · ${esc(fmtDay(new Date(last.starts_at), { day: "numeric", month: "short" }))}</span><b>${esc(last.result)} ${esc(last.title.replace(/^Home vs /, "vs ").replace(/^Away at /, "at "))}</b></div>` : "";
    Comms.loadRsvps(list.map(x => x.key));
    body = lastHtml + (!state.cal ? `<div class="card empty">Loading…</div>` : list.length ? `<div class="team-list">${list.map(x => {
      const rows = Comms.st.rsvp[x.key] || [], yes = rows.filter(r => r.status === "yes").length, no = rows.filter(r => r.status === "no").length;
      const waiting = Math.max(0, fam.length - rows.filter(r => r.user_role === "parent" || r.user_role === "player").length);
      return `<article class="card team-ev"><div class="team-ev-top"><span class="cal-time">${esc(fmtDay(x.o.start, { weekday: "short", day: "numeric", month: "short" }))} · ${esc(fmtTime(x.o.start))}–${esc(fmtTime(x.o.end))}</span>${x.e.kind === "match" ? `<span class="pill team-match">Match</span>` : ""}</div>
        <b class="team-ev-t">${esc(x.e.title)}</b>${Comms.venueLine(x.e.location, "muted team-ev-l")}
        ${x.e.kind === "session" ? Comms.sylAim(x.e.group_id || gid, isoOf(x.o.start), { home: false }) : ""}
        ${Comms.st.rsvp[x.key] !== undefined ? `<div class="team-count"><span class="tc yes">✓ ${yes} going</span><span class="tc no">✗ ${no} can't</span>${fam.length ? `<span class="tc q">? ${waiting} not replied</span>` : ""}</div>` : ""}
        ${x.e.fixture && x.e.notes ? `<span class="muted team-ev-l">${esc(x.e.notes)} · from FA Full-Time</span>` : ""}
        ${Comms.rsvpBar(x.key, x.e.group_id || gid)}${isoOf(x.o.start) === isoOf(today0()) && x.e.kind !== "meeting" ? `<div><button type="button" class="btn small" data-ciopen data-cig="${esc(x.e.group_id || gid)}" data-cit="${esc(x.o.start.toISOString())}">${ic("pin")} Check a player in</button></div>` : ""}</article>`; }).join("")}</div>` : `<div class="card empty">Nothing on for this team in the next 7 days.</div>`);
  } else if (tab === "match") {
    body = matchTabView(gid);
  } else if (tab === "chat") {
    body = Comms.chatView(gid).replace(/<div class="filters chat-groups"[\s\S]*?<\/div>/, "").replace(/<h2 class="chat-title">[\s\S]*?<\/h2>/, "");
  } else if (tab === "news") {
    body = `${Comms.annComposer(gid)}${Comms.annListFor(gid)}`;
  } else {
    const sec = (t, l) => l.length ? `<div class="card team-sq"><h3 class="cpd-h">${t} <span class="muted">${l.length}</span></h3><ul>${l.map(m => `<li>${esc(m.name)}</li>`).join("")}</ul></div>` : "";
    const coaches = members.filter(m => m.role === "coach" || m.role === "admin"), players = members.filter(m => m.role === "player"), parents = members.filter(m => m.role === "parent");
    if (!Comms.st.players) setTimeout(() => Comms.loadPlayers());
    const pps = (Comms.st.players || []).filter(p => (p.groups || []).includes(gid)).sort((a, b) => a.name.localeCompare(b.name));
    const ppOpen = state.teamPP && pps.find(p => p.id === state.teamPP);
    if (ppOpen) {
      const sq = (state.squads || []).filter(x => x.group === gid).sort((a, b) => a.name.localeCompare(b.name)), cur = ppOpen.squad_id;
      const guess = !cur && sq.find(x => x.name.trim().toLowerCase() === ppOpen.name.trim().toLowerCase());
      body = `<div class="chat-head"><button type="button" class="chat-back" data-teampp="" aria-label="Back to squad"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg></button><div><small>${esc(g.long)} · Passport</small><b>${esc(ppOpen.name)}</b></div></div>
        ${Comms.passportView(ppOpen.id, { coach: true, admin: ACCESS.admin })}
        <div class="card m-me pp-link"><h3 class="cpd-h">Test scores link</h3><p class="muted" style="margin:0;font-size:14px">Match this passport to the player in your squad list so their test scores show in Skills.</p>
          <select id="pp-sq" data-pp="${esc(ppOpen.id)}"><option value="">Not linked</option>${sq.map(x => `<option value="${esc(x.id)}"${cur === x.id || (guess && guess.id === x.id) ? " selected" : ""}>${esc(x.name)}${x.band ? ` (${esc(x.band)})` : ""}</option>`).join("")}</select>
          ${guess ? `<p class="muted" style="margin:0;font-size:13px">Suggested by name. Tap Save to link.</p>` : ""}<div><button type="button" class="btn small primary" id="pp-sq-save">Save link</button></div></div>`;
    } else {
      body = squadHome(gid, g, pps, members, coaches, players, parents, sec);
    }
  }
  return `<section class="view team-page"><div class="team-head"><h1 class="page-h">${esc(g.long)}</h1>${when ? `<div class="muted">${when}</div>` : ""}</div>${switcher}${state.teamPP ? "" : Comms.spotlightHtml({ group: gid })}${calTabs(tabs.map(t => [t[0], t[1], t[2] || 0]), tab, "data-teamtab")}${body}</section>`;
}
/* ---------- coach compliance: DBS, safeguarding, first aid, coaching badge ---------- */
const CITEMS = [["dbs", "DBS check", "Enhanced DBS for working with children", true], ["safeguarding", "Safeguarding course", "e.g. Safeguarding Children", true], ["first_aid", "First aid", "e.g. Emergency First Aid in Football", true], ["badge", "Coaching badge", "e.g. Introduction to Coaching Football", false]];
state.comply = null; state.complyCoach = null;
async function loadComply() { const { data } = await window.B2B_SB.from("coach_compliance").select("*"); state.comply = data || []; rerenderSoft(); }
function cstatus(r, needsExpiry) {
  const today = isoOf(today0()), soon = isoOf(addDays(today0(), 30));
  if (!r || (!r.issued && !r.expires && !r.detail)) return ["missing", "Not added"];
  if (needsExpiry && !r.expires) return ["warn", "No expiry date"];
  if (r.expires && r.expires < today) return ["bad", "Expired " + fmtDay(dayOf(r.expires), { day: "numeric", month: "short", year: "numeric" })];
  if (r.expires && r.expires <= soon) return ["warn", "Expires " + fmtDay(dayOf(r.expires), { day: "numeric", month: "short" })];
  return ["ok", r.expires ? "Valid to " + fmtDay(dayOf(r.expires), { day: "numeric", month: "short", year: "numeric" }) : "Added"];
}
function complyDue() { if (state.comply === null) { state.comply = undefined; setTimeout(loadComply); return 0; } const rows = (state.comply || []).filter(r => r.coach_id === ACCESS.uid); return CITEMS.filter(([k, , , ex]) => ex && ["bad", "warn", "missing"].includes(cstatus(rows.find(r => r.item === k), ex)[0])).length; }
function complyView() {
  if (!state.comply) { if (state.comply === null) setTimeout(loadComply); return `<div class="card empty">Loading…</div>`; }
  const who = state.complyCoach || ACCESS.uid, isMe = who === ACCESS.uid, rows = state.comply.filter(r => r.coach_id === who);
  const name = isMe ? "Your checks" : ((state.profiles || {})[who] || {}).name || "Coach";
  const form = ([k, label, hint, ex]) => { const r = rows.find(x => x.item === k) || {}, [cls, txt] = cstatus(r.item ? r : null, ex);
    return `<details class="card cp-item"><summary><span class="cp-dot ${cls}"></span><span class="cp-mid"><b>${label}</b><small>${esc(txt)}${r.detail ? " · " + esc(r.detail) : ""}</small></span><i class="fd-chev" aria-hidden="true"></i></summary>
      <form class="cp-form" data-cpform="${k}"><div class="field"><label>${k === "badge" ? "Badge / level" : "Type or course"}</label><input name="detail" maxlength="80" value="${esc(r.detail || "")}" placeholder="${esc(hint)}"></div>
      <div class="row3" style="grid-template-columns:1fr 1fr"><div class="field"><label>Date done</label><input type="date" name="issued" value="${esc(r.issued || "")}"></div><div class="field"><label>Expires${ex ? "" : " (if any)"}</label><input type="date" name="expires" value="${esc(r.expires || "")}"></div></div>
      ${ex ? `<button type="button" class="linkbtn" data-cp3="${k}">Set expiry to 3 years after the date done</button>` : ""}
      <div class="glinks" style="justify-content:flex-start;gap:12px"><button class="btn small primary">Save</button>${r.item ? `<button type="button" class="linkbtn" data-cpdel="${k}">Clear</button>` : ""}</div></form></details>`; };
  const staff = Object.entries(state.profiles || {}).filter(([, p]) => p.role === "coach" || p.role === "admin").sort((a, b) => String(a[1].name).localeCompare(String(b[1].name)));
  const grid = ACCESS.admin ? `<div class="card cp-grid"><h3 class="cpd-h">All coaches</h3><div class="cp-head"><span></span>${["DBS", "Safe", "Aid", "Badge"].map(l => `<span>${l}</span>`).join("")}</div>
      ${staff.map(([id, p]) => `<button type="button" class="cp-row${id === who ? " sel" : ""}" data-cpcoach="${esc(id)}"><span class="cp-n">${esc(p.name || "Coach")}</span>${CITEMS.map(([k, , , ex]) => { const r = state.comply.find(x => x.coach_id === id && x.item === k); const [c, t] = cstatus(r, ex); return `<span class="cp-dot ${c}" title="${esc(t)}"></span>`; }).join("")}</button>`).join("")}
      <p class="muted" style="margin:0;font-size:12px"><span class="cp-dot ok"></span> in date <span class="cp-dot warn"></span> due within 30 days <span class="cp-dot bad"></span> expired <span class="cp-dot missing"></span> not added · tap a coach to update their dates</p></div>` : "";
  return `<div class="cp">${grid}<h3 class="cpd-h">${esc(name)}</h3>${CITEMS.map(form).join("")}
    <p class="muted" style="margin:0;font-size:13px">${ic("lock")} Only you and the head coach can see these. Dates only, no certificate numbers. You'll get a reminder on Mondays when something is due within 30 days.</p></div>`;
}
function bindComply() {
  const m = $("#main"), sb = window.B2B_SB, who = state.complyCoach || ACCESS.uid;
  m.querySelectorAll("[data-cpcoach]").forEach(b => b.onclick = () => { state.complyCoach = b.dataset.cpcoach; render(); });
  m.querySelectorAll("[data-cp3]").forEach(b => b.onclick = () => { const f = b.closest("form"), d = f.issued.value; if (!d) return toast("Add the date done first."); const x = new Date(d + "T12:00:00"); x.setFullYear(x.getFullYear() + 3); f.expires.value = isoOf(x); });
  m.querySelectorAll("[data-cpform]").forEach(f => f.onsubmit = async e => { e.preventDefault();
    const row = { coach_id: who, item: f.dataset.cpform, detail: f.detail.value.trim() || null, issued: f.issued.value || null, expires: f.expires.value || null };
    const { error } = await sb.from("coach_compliance").upsert(row, { onConflict: "coach_id,item" }); if (error) return toast("Couldn't save: " + error.message); toast("Saved"); loadComply(); });
  m.querySelectorAll("[data-cpdel]").forEach(b => b.onclick = async () => { const { error } = await sb.from("coach_compliance").delete().eq("coach_id", who).eq("item", b.dataset.cpdel); if (error) return toast(error.message); loadComply(); });
}

/* ---------- player attendance ---------- */
state.playerAttendance = state.playerAttendance || null;
state.paBrief = state.paBrief || null;
async function loadPlayerAttendance(force) {
  const sb = window.B2B_SB;
  if (!sb) {
    state.playerAttendance = { t: Date.now(), rows: [], players: [], error: "The attendance service isn't available right now." };
    if (state.tab === "coaches") rerenderSoft();
    return;
  }
  if (!force && state.playerAttendance && Date.now() - state.playerAttendance.t < 30000) return;
  const day = isoOf(today0());
  const [a, p] = await Promise.all([
    sb.from("attendance").select("player_id,session_date,group_id,label").eq("session_date", day).order("group_id").limit(2000),
    sb.from("players").select("id,name,groups").order("name").limit(2000)
  ]);
  const error = a.error || p.error;
  state.playerAttendance = { t: Date.now(), rows: a.data || [], players: p.data || [], error: error ? error.message : "" };
  if (state.tab === "coaches") rerenderSoft();
}
function playerAttendanceView() {
  if (!state.playerAttendance) { setTimeout(() => loadPlayerAttendance()); return `<div class="card empty">Loading today's player attendance…</div>`; }
  if (state.playerAttendance.error) return `<div class="card empty">Couldn't load attendance: ${esc(state.playerAttendance.error)}<p><button type="button" class="btn small" data-pa-refresh>Try again</button></p></div>`;
  const pmap = Object.fromEntries(state.playerAttendance.players.map(p => [p.id, p]));
  const rows = state.playerAttendance.rows.filter(a => pmap[a.player_id]);
  const brief = state.paBrief;
  return `<div class="pr-block">
    <div class="pr-head"><div><b>Players checked in today</b><small>${rows.length} player${rows.length === 1 ? "" : "s"} · ${esc(fmtDay(today0(), { weekday: "long", day: "numeric", month: "long" }))}</small></div>
      <div class="actions"><button type="button" class="btn small" data-pa-refresh>Refresh</button><button type="button" class="btn small" data-pa-export>Export</button></div></div>
    ${rows.length ? rows.map(a => { const p = pmap[a.player_id], initials = String(p.name || "?").split(/\s+/).slice(0, 2).map(w => w[0] || "").join("").toUpperCase();
      const open = brief && brief.id === p.id, P = open && brief.data, care = P && P.care, pl = P && P.player;
      return `<div class="pr-row"><span class="pav sm">${esc(initials)}</span><span><b>${esc(p.name)}</b><small>${esc(a.label || Comms.gname(a.group_id) || "Session")}</small></span><span class="pill cpd-ok">Here</span>
        <button type="button" class="linkbtn pr-details-btn" data-pa-brief="${esc(p.id)}" aria-expanded="${!!open}">${open ? "Hide details" : "Player details"}</button></div>
        ${open ? `<div class="pr-brief">${brief.loading ? `<p class="muted">Loading player details…</p>` : brief.error ? `<p class="gmsg bad">${esc(brief.error)}</p>` : `<div class="pr-brief-head"><b>${esc((pl && pl.preferred_name) || p.name)}</b><small>${esc((pl && pl.groups || p.groups || []).map(Comms.gname).join(" · ") || a.label || "Player")}${pl && pl.position ? ` · ${esc(pl.position)}` : ""}</small></div>
          ${pl && pl.strengths ? `<p class="muted">${esc(pl.strengths)}</p>` : ""}
          ${care ? `<div class="pr-care"><b>Care &amp; emergency details</b><p><small>Emergency contact</small><br>${care.emergency_name ? `${esc(care.emergency_name)}${care.emergency_relation ? ` · ${esc(care.emergency_relation)}` : ""}${care.emergency_phone ? ` · <a href="tel:${esc(String(care.emergency_phone).replace(/[^0-9+]/g, ""))}">${esc(care.emergency_phone)}</a>` : ""}` : "No contact recorded"}</p>
            <p><small>Allergies</small><br>${esc(care.allergies || (care.allergies_none ? "None reported" : "Not confirmed"))}</p><p><small>Medical needs</small><br>${esc(care.medical || (care.medical_none ? "None reported" : "Not confirmed"))}</p>
            <p><small>Photos and videos</small><br>${esc(Comms.PHOTO_SHORT[care.photo_consent] || "Not answered")}</p>
            ${care.reviewed_at ? `<small>Family confirmed ${esc(care.reviewed_season || "previous season")} on ${esc(new Date(care.reviewed_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }))}</small>` : `<small>Family review not recorded yet</small>`}</div>` : `<p class="muted">Care details are not available for this player.</p>`}
          <p class="muted pr-privacy">${ic("lock")} Visible only to coaches for this player's sessions and the head coach. Other families cannot see this.</p>`}</div>` : ""}`; }).join("")
      : `<p class="muted" style="margin:0;padding:12px 14px">No linked-player check-ins recorded today. Check-ins still go to the club's Google register; link a Player Passport to show attendance here.</p>`}
  </div>`;
}
function bindPlayerAttendance() {
  document.querySelectorAll("[data-pa-refresh]").forEach(b => b.onclick = () => loadPlayerAttendance(true));
  document.querySelectorAll("[data-pa-export]").forEach(b => b.onclick = exportSheet);
  document.querySelectorAll("[data-pa-brief]").forEach(b => b.onclick = async () => {
    const id = b.dataset.paBrief;
    if (state.paBrief && state.paBrief.id === id && !state.paBrief.loading) { state.paBrief = null; rerenderSoft(); return; }
    state.paBrief = { id, loading: true }; rerenderSoft();
    try {
      const data = await Comms.loadPassport(id, true);
      if (!state.paBrief || state.paBrief.id !== id) return;
      state.paBrief = data && !data.error ? { id, data } : { id, error: data && data.error || "Couldn't load this player's details." };
    } catch (error) {
      if (state.paBrief && state.paBrief.id === id) state.paBrief = { id, error: error && error.message ? error.message : "The player details request failed." };
    }
    rerenderSoft();
  });
}

/* ---------- register export (CSV opens in Excel / Google Sheets) ---------- */
function exportSheet() {
  const gs = GROUPS.filter(x => ACCESS.admin || (ACCESS.groups || []).includes(x.id)), t = today0();
  const el = document.createElement("div"); el.className = "ci-sheet"; el.id = "exp-sheet";
  el.innerHTML = `<div class="ci-back" data-x></div><form class="ci-panel" id="exp-form"><div class="ci-grab"></div><h2>Export register</h2>
    <div class="field"><label for="ex-g">Group</label><select id="ex-g">${ACCESS.admin ? `<option value="">All groups</option>` : ""}${gs.map(x => `<option value="${esc(x.id)}">${esc(x.long)}</option>`).join("")}</select></div>
    <div class="field"><label for="ex-r">Dates</label><select id="ex-r"><option value="month">This month</option><option value="last">Last month</option><option value="3m">Last 3 months</option><option value="season" selected>Season so far (from 1 Sept)</option><option value="custom">Choose dates…</option></select></div>
    <div class="row3 ex-custom" style="grid-template-columns:1fr 1fr" hidden><div class="field"><label for="ex-f">From</label><input type="date" id="ex-f" value="${isoOf(new Date(t.getFullYear(), t.getMonth(), 1))}"></div><div class="field"><label for="ex-t">To</label><input type="date" id="ex-t" value="${isoOf(t)}"></div></div>
    <div class="field"><span class="lbl">Layout</span><div class="care-photo"><label class="care-opt"><input type="radio" name="ex-k" value="grid" checked><span><b>Register grid</b> · one row per player, a column per session date, totals at the end</span></label><label class="care-opt"><input type="radio" name="ex-k" value="list"><span><b>List</b> · one row per attendance (player, date, group, session)</span></label></div></div>
    <button class="btn primary big" type="submit">Download spreadsheet</button><p class="ci-msg muted" style="font-size:13px">Opens in Excel, Numbers or Google Sheets.</p></form>`;
  const close = () => { el.remove(); document.body.classList.remove("ci-open"); };
  el.querySelectorAll("[data-x]").forEach(b => b.onclick = close);
  el.querySelector("#ex-r").onchange = e => el.querySelector(".ex-custom").hidden = e.target.value !== "custom";
  el.querySelector("#exp-form").onsubmit = async e => { e.preventDefault();
    const g = el.querySelector("#ex-g").value, r = el.querySelector("#ex-r").value, kind = el.querySelector('input[name="ex-k"]:checked').value;
    let from, to = t;
    if (r === "month") from = new Date(t.getFullYear(), t.getMonth(), 1); else if (r === "last") { from = new Date(t.getFullYear(), t.getMonth() - 1, 1); to = new Date(t.getFullYear(), t.getMonth(), 0); }
    else if (r === "3m") from = new Date(t.getFullYear(), t.getMonth() - 2, 1); else if (r === "season") from = new Date(t.getMonth() >= 8 ? t.getFullYear() : t.getFullYear() - 1, 8, 1);
    else { from = dayOf(el.querySelector("#ex-f").value); to = dayOf(el.querySelector("#ex-t").value); }
    let q = window.B2B_SB.from("attendance").select("player_id,session_date,group_id,label").gte("session_date", isoOf(from)).lte("session_date", isoOf(to)).order("session_date").limit(20000);
    if (g) q = q.eq("group_id", g);
    const { data, error } = await q; if (error) return toast("Couldn't export: " + error.message);
    const players = await Comms.loadPlayers(true), pmap = Object.fromEntries((players || []).map(p => [p.id, p]));
    const rows = (data || []).filter(a => pmap[a.player_id]);
    const cell = v => { const x = String(v == null ? "" : v); return /[",\n]/.test(x) ? '"' + x.replace(/"/g, '""') + '"' : x; };
    const line = a => a.map(cell).join(",");
    let csv = [];
    if (kind === "list") { csv.push(line(["Player", "Born", "Date", "Day", "Group", "Session"])); rows.forEach(a => { const p = pmap[a.player_id]; csv.push(line([p.name, p.birth_year || "", a.session_date, dayOf(a.session_date).toLocaleDateString("en-GB", { weekday: "short" }), groupLabel(a.group_id), a.label || ""])); }); }
    else { const dates = [...new Set(rows.map(a => a.session_date))].sort(), roster = (players || []).filter(p => !g || (p.groups || []).includes(g)).sort((a, b) => a.name.localeCompare(b.name));
      csv.push(line(["Player", "Born", ...dates.map(d => dayOf(d).toLocaleDateString("en-GB", { day: "numeric", month: "short" })), "Sessions", "Attendance %"]));
      roster.forEach(p => { const mine = new Set(rows.filter(a => a.player_id === p.id).map(a => a.session_date)); csv.push(line([p.name, p.birth_year || "", ...dates.map(d => mine.has(d) ? "✓" : ""), mine.size, dates.length ? Math.round(mine.size * 100 / dates.length) + "%" : ""])); });
      csv.push(line(["Total", "", ...dates.map(d => rows.filter(a => a.session_date === d).length), rows.length, ""])); }
    const name = `register-${(g ? groupLabel(g) : "all-groups").replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-${isoOf(from)}-to-${isoOf(to)}.csv`;
    const blob = new Blob(["\ufeff" + csv.join("\r\n")], { type: "text/csv;charset=utf-8" }), a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
    toast(`Downloaded: ${rows.length} attendance${rows.length === 1 ? "" : "s"}`); close(); };
  document.body.appendChild(el); document.body.classList.add("ci-open");
}

/* ---------- Player development: every passport in one place ---------- */
state.devQ = ""; state.devG = ""; state.devPP = null; state.devAs = "coach";
function playersHub() {
  if (!Comms.st.players) { setTimeout(() => Comms.loadPlayers()); return `<div class="card empty">Loading…</div>`; }
  const all = Comms.st.players.slice().sort((a, b) => a.name.localeCompare(b.name));
  const open = state.devPP && all.find(p => p.id === state.devPP);
  if (open) {
    const asParent = state.devAs === "parent";
    return `<div class="chat-head"><button type="button" class="chat-back" data-devback aria-label="Back to players"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg></button><div><small>Player development</small><b>${esc(open.name)}</b></div></div>
      <div class="seg dev-as" role="group" aria-label="View"><button type="button" class="chip" data-devas="coach" aria-pressed="${!asParent}">Coach view</button><button type="button" class="chip" data-devas="parent" aria-pressed="${asParent}">What families see</button></div>
      ${asParent ? `<p class="muted" style="margin:0;font-size:13px">${ic("eye")} This is how ${esc(open.name.split(" ")[0])} and their parent see the passport (no coach buttons).</p>` : ""}
      <div class="${asParent ? "dev-preview" : ""}">${Comms.passportView(open.id, asParent ? {} : { coach: true, admin: ACCESS.admin })}</div>`;
  }
  const gs = [...new Set(all.flatMap(p => p.groups || []))].filter(g => ACCESS.admin || (ACCESS.groups || []).includes(g));
  const q = state.devQ.trim().toLowerCase();
  const list = all.filter(p => (!state.devG || (p.groups || []).includes(state.devG)) && (!q || p.name.toLowerCase().includes(q)));
  const tag = p => ({ mini: "4–7", junior: "8–12", senior: "13+" })[Comms.ppTier(p)];
  return `<div class="dev-hub">
    <button type="button" class="btn dev-export" data-devexport>${ic("chart")} Export register (spreadsheet)</button>
    <div class="dev-stats"><div><b>${all.length}</b><small>passports</small></div><div><b>${all.filter(p => p.parent_id).length}</b><small>parent linked</small></div><div><b>${all.filter(p => p.user_id).length}</b><small>own login</small></div></div>
    <input type="search" class="psearch" id="dev-q" placeholder="Search ${all.length} players" value="${esc(state.devQ)}" aria-label="Search players">
    <div class="pfilt"><button type="button" class="chip" data-devg="" aria-pressed="${!state.devG}">All</button>${gs.map(g => `<button type="button" class="chip" data-devg="${esc(g)}" aria-pressed="${state.devG === g}">${esc(groupLabel(g).replace("Development", "Dev").replace("Technical", "Tech").replace("Ball Mastery", "BM"))} <span>${all.filter(p => (p.groups || []).includes(g)).length}</span></button>`).join("")}</div>
    ${list.length ? `<div class="pp-kids dev-list">${list.map(p => `<button type="button" class="pp-kidrow" data-devpp="${esc(p.id)}"><span class="pp-av sm">${ppInit(p.name)}</span><span><b>${esc(p.name)}</b><small>${tag(p)} · ${esc((p.groups || []).map(g => groupLabel(g)).join(", "))}${p.parent_id ? "" : " · no parent yet"}</small></span><i aria-hidden="true">›</i></button>`).join("")}</div>`
      : `<div class="card empty">${all.length ? "No one matches." : "No Player Passports yet. Families create them in the app under Passport, or add players in a team's Squad tab."}</div>`}
  </div>`;
}
function bindPlayersHub() {
  const m = $("#main");
  const qi = m.querySelector("#dev-q"); if (qi) qi.oninput = () => { state.devQ = qi.value; const pos = qi.selectionStart; render(); const n = $("#dev-q"); if (n) { n.focus(); n.setSelectionRange(pos, pos); } };
  const dx = m.querySelector("[data-devexport]"); if (dx) dx.onclick = exportSheet;
  m.querySelectorAll("[data-devg]").forEach(b => b.onclick = () => { state.devG = b.dataset.devg; render(); });
  m.querySelectorAll("[data-devpp]").forEach(b => b.onclick = () => { state.devPP = b.dataset.devpp; state.devAs = "coach"; Comms.st.ppOpen = ""; render(); window.scrollTo(0, 0); });
  m.querySelectorAll("[data-devback]").forEach(b => b.onclick = () => { state.devPP = null; render(); window.scrollTo(0, 0); });
  m.querySelectorAll("[data-devas]").forEach(b => b.onclick = () => { state.devAs = b.dataset.devas; Comms.st.ppOpen = ""; render(); });
  Comms.bindPassport(m, ACCESS.name);
}

/* ---------- safeguarding: who can post, welfare officers, reported messages ---------- */
state.reports = null;
async function loadReports() { const { data } = await window.B2B_SB.from("message_reports").select("*").order("created_at", { ascending: false }).limit(100); state.reports = data || []; rerenderSoft(); }
function safeView() {
  const r = Comms.st.rules || {}, admin = ACCESS.admin;
  if (state.reports === null) { state.reports = undefined; setTimeout(loadReports); }
  const staff = Object.entries(state.profiles || {}).filter(([, p]) => p.role === "coach" || p.role === "admin").sort((a, b) => String(a[1].name).localeCompare(String(b[1].name)));
  const ids = r.welfare_ids || [], list = state.reports || [], open = list.filter(x => x.status === "open");
  const card = x => `<article class="card rep-card${x.status === "open" ? " open" : ""}"><div class="rep-top"><span class="pill${x.status === "open" ? " rep-open" : " cpd-ok"}">${x.status === "open" ? "Open" : "Resolved"}</span><small>${esc(groupLabel(x.group_id))} · ${esc(new Date(x.created_at).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }))}</small></div>
      <b>${esc(x.reason)}</b>${x.details ? `<p class="rep-d">${esc(x.details)}</p>` : ""}
      <blockquote class="rep-q"><small>${esc(x.msg_author || "Member")}${x.msg_author_role ? ` · ${esc(x.msg_author_role)}` : ""}${x.msg_at ? ` · ${esc(new Date(x.msg_at).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }))}` : ""}</small>${x.msg_body ? esc(x.msg_body) : "<i>Message already removed</i>"}</blockquote>
      <small class="muted">Reported by ${esc(x.reporter_name || "a member")}</small>
      ${x.status === "resolved" ? `<p class="rep-out">${ic("check")} ${esc(x.outcome || "Resolved")}${x.resolved_by ? ` · ${esc(x.resolved_by)}` : ""}</p>` : `<div class="rep-acts">${x.message_id && x.msg_body ? `<button type="button" class="btn small" data-rephide="${esc(x.message_id)}">Hide message</button>` : ""}<button type="button" class="btn small primary" data-repdone="${esc(x.id)}">Mark resolved</button></div>`}</article>`;
  return `<div class="safe">
    ${admin ? `<div class="card safe-set"><div class="safe-row"><div><b>Players can post in team chats</b><small>${r.players_post ? "On: players with their own login can write messages." : "Off: players can read team chats and report messages, but can't post."}</small></div><button type="button" class="tgl${r.players_post ? " on" : ""}" data-safepost aria-pressed="${!!r.players_post}" aria-label="Players can post"><i></i></button></div></div>
    <div class="card safe-set"><b>Welfare officers</b><small class="muted">They get a notification for every report and can review reports here. ${ids.length ? "" : "Until you pick someone, reports come to you."}</small>
      <div class="agroups">${staff.map(([id, p]) => `<label class="chipcheck"><input type="checkbox" value="${esc(id)}" data-wo ${ids.includes(id) ? "checked" : ""}><span>${esc(p.name || "Coach")}</span></label>`).join("")}</div>
      <div><button type="button" class="btn small primary" data-wosave>Save welfare officers</button></div></div>` : ""}
    <h3 class="cpd-h">Reported messages ${open.length ? `<span class="muted">${open.length} open</span>` : ""}</h3>
    ${state.reports === undefined ? `<div class="card empty">Loading…</div>` : list.length ? `<div class="rep-list">${open.map(card).join("")}${list.filter(x => x.status !== "open").slice(0, 10).map(card).join("")}</div>` : `<div class="card empty">${ic("check")} No reports. Anyone can report a message by tapping the flag on it in chat.</div>`}
    <p class="muted" style="font-size:13px"><a href="#" data-privacy>Privacy notice</a> parents agree to when they add a child.</p></div>`;
}
function bindSafe() {
  const sb = window.B2B_SB, m = $("#main");
  const pt = m.querySelector("[data-safepost]"); if (pt) pt.onclick = async () => { const on = !(Comms.st.rules || {}).players_post;
    const { error } = await sb.from("app_settings").upsert({ key: "players_can_post", value: on ? "true" : "false" }, { onConflict: "key" });
    if (error) return toast("Couldn't save: " + error.message); toast(on ? "Players can now post" : "Team chats are read-only for players"); Comms.loadRules(true); };
  const ws = m.querySelector("[data-wosave]"); if (ws) ws.onclick = async () => { const ids = [...m.querySelectorAll("[data-wo]:checked")].map(i => i.value);
    const { error } = await sb.from("app_settings").upsert({ key: "welfare_officers", value: JSON.stringify(ids) }, { onConflict: "key" });
    if (error) return toast("Couldn't save: " + error.message); toast("Welfare officers saved"); Comms.loadRules(true); };
  m.querySelectorAll("[data-rephide]").forEach(b => b.onclick = async () => { if (!(await Comms.yes("Hide this message?", "It's removed from the chat for everyone. The report keeps a copy.", "Hide"))) return;
    const { error } = await sb.from("messages").update({ deleted: true }).eq("id", b.dataset.rephide); if (error) return toast("Couldn't hide: " + error.message); toast("Message hidden"); });
  m.querySelectorAll("[data-repdone]").forEach(b => b.onclick = async () => { const o = await Comms.ask({ title: "Resolve report", label: "What was done? (kept with the report)", value: "Spoke to the people involved", multiline: true, max: 600, ok: "Mark resolved", danger: false }); if (o === null) return;
    const { error } = await sb.from("message_reports").update({ status: "resolved", outcome: o.trim().slice(0, 600) || "Resolved" }).eq("id", b.dataset.repdone);
    if (error) return toast("Couldn't save: " + error.message); toast("Report resolved"); await loadReports(); Comms.loadRules(true); });
}

/* ---------- passports for every player: this week's sign-off, add players, import the squad list ---------- */
state.gw = {};
async function loadGroupWeek(gid) { const { data, error } = await window.B2B_SB.rpc("group_week", { p_group: gid }); state.gw[gid] = error ? { error: error.message } : data; rerenderSoft(); return state.gw[gid]; }
const ppInit = n => esc(String(n).split(/\s+/).slice(0, 2).map(w => w[0] || "").join("").toUpperCase());
function squadHome(gid, g, pps, members, coaches, players, parents, sec) {
  const W = state.gw[gid]; if (W === undefined) { state.gw[gid] = null; setTimeout(() => loadGroupWeek(gid)); }
  const ses = W && W.session, P = (W && W.players) || [], done = P.filter(x => x.ok).length, here = P.filter(x => x.here).length;
  const potw = W && W.potw && pps.find(p => p.id === W.potw.player);
  const sq = (state.squads || []).filter(x => x.group === gid && !pps.some(p => p.squad_id === x.id || p.name.trim().toLowerCase() === x.name.trim().toLowerCase()));
  const tier = p => Comms.ppTier(p), tag = p => ({ mini: "4–7", junior: "8–12", senior: "13+" })[tier(p)];
  const weekCard = ses ? `<button type="button" class="card sq-week" data-sqweek><span class="eyebrow">This week · ${esc(new Date(ses.date + "T12:00:00").toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" }))}</span>
      <b>${esc(ses.skill || ses.title)}</b><small>${esc(ses.title || "")}</small>
      <span class="sq-wstats"><span><b>${here}</b> here</span><span><b>${done}</b> signed off</span><span><b>${P.filter(x => x.home).length}</b> home</span><span><b>${P.filter(x => (x.quiz || 0) >= 2).length}</b> quiz</span></span>
      <span class="sq-wgo">${ic("check")} Register &amp; sign off ›</span></button>` : W && W.error ? "" : W === null || W === undefined ? `<div class="card empty">Loading this week…</div>` : "";
  return `${weekCard}
    ${potw ? `<div class="pp-potw"><span aria-hidden="true">${ic("trophy")}</span><div><small>Player of the week</small><b>${esc(potw.name)}</b>${W.potw.reason ? `<small style="text-transform:none;letter-spacing:0;font-weight:500">${esc(W.potw.reason)}</small>` : ""}</div></div>` : ""}
    <div class="card team-sq"><div class="sq-h"><h3 class="cpd-h">Player Passports <span class="muted">${pps.length}</span></h3><button type="button" class="btn small primary" data-sqadd>${ic("user")} Add player</button></div>
      ${pps.some(p => !p.parent_id) ? `<button type="button" class="sq-print" data-sqprint>${ic("note")} Print parent codes for ${pps.filter(p => !p.parent_id).length} player${pps.filter(p => !p.parent_id).length > 1 ? "s" : ""} with no parent linked ›</button>` : ""}
      ${sq.length ? `<button type="button" class="sq-import" data-sqimport>${ic("users")} Create passports for ${sq.length} player${sq.length > 1 ? "s" : ""} from your squad list ›</button>` : ""}
      ${pps.length ? `<div class="pp-kids">${pps.map(p => { const w = P.find(x => x.id === p.id) || {};
        return `<button type="button" class="pp-kidrow" data-teampp="${esc(p.id)}"><span class="pp-av sm">${ppInit(p.name)}</span><span><b>${esc(p.name)}${w.med ? ` <i class="sq-medi" title="Medical needs noted">⚕</i>` : ""}${w.ok ? ` <i class="sq-ok" title="Signed off this week">${ic("check")}</i>` : ""}</b><small>${tag(p)} · ${p.user_id ? "Own login" : p.parent_id ? "Parent linked" : "No parent yet"}${(p.groups || []).length > 1 ? ` · ${p.groups.length} sessions` : ""}</small></span><i aria-hidden="true">›</i></button>`; }).join("")}</div>`
        : `<p class="muted" style="margin:0">No passports yet. Add players here, or parents add their child under Me.</p>`}</div>
    ${members.length ? `<details class="card team-sq sq-members"><summary><h3 class="cpd-h">Team members <span class="muted">${members.length}</span></h3></summary>${sec("Coaches", coaches)}${sec("Players", players)}${sec("Parents", parents)}</details>` : ""}`;
}
function loadScript(src) { return new Promise((res, rej) => { if (document.querySelector(`script[data-src="${src}"]`)) return res(); const sc = document.createElement("script"); sc.src = src; sc.dataset.src = src; sc.onload = res; sc.onerror = rej; document.head.appendChild(sc); }); }
async function printCodes(gid, btn) {
  const kids = (Comms.st.players || []).filter(p => (p.groups || []).includes(gid) && !p.parent_id).sort((a, b) => a.name.localeCompare(b.name));
  if (!kids.length) return toast("Every player here already has a parent linked.");
  if (btn) { btn.disabled = true; btn.textContent = "Making codes…"; }
  try { await loadScript("qrcode.js"); } catch (e) { if (btn) btn.disabled = false; return toast("Couldn't load the QR maker. Check your signal."); }
  const out = [];
  for (const k of kids) { const { data, error } = await window.B2B_SB.rpc("create_parent_code", { p_player: k.id }); if (!error && data) out.push({ k, code: data }); }
  if (btn) btn.disabled = false; render();
  const base = location.origin + location.pathname.replace(/[^/]*$/, ""), g = groupLabel(gid);
  const qr = url => { const q = window.qrcode(0, "M"); q.addData(url); q.make(); return q.createSvgTag({ cellSize: 3, margin: 0, scalable: true }); };
  const el = document.createElement("div"); el.id = "print-sheet";
  el.innerHTML = `<div class="ps-bar"><b>${esc(g)} · ${out.length} parent code${out.length > 1 ? "s" : ""}</b><span><button type="button" class="btn small primary" data-psprint>Print or save PDF</button><button type="button" class="btn small" data-psclose>Close</button></span></div>
    <div class="ps-cards">${out.map(({ k, code }) => `<div class="ps-card"><div class="ps-qr">${qr(base + "#claim=" + code)}</div><div class="ps-txt"><small>Box to Box · ${esc(g)}</small><b>${esc(k.name)}</b>
      <span class="ps-code">${esc(code.slice(0, 4))} ${esc(code.slice(4))}</span>
      <ol><li>Scan the code, or open <b>${esc(location.host)}</b></li><li>Tap <b>Join with your code</b> and type the code</li><li>Create your account. You're straight in, no waiting</li></ol><small>Code lasts 60 days · one child only</small></div></div>`).join("")}</div>`;
  el.querySelector("[data-psclose]").onclick = () => { el.remove(); document.body.classList.remove("printing"); };
  el.querySelector("[data-psprint]").onclick = () => window.print();
  document.body.appendChild(el); document.body.classList.add("printing"); window.scrollTo(0, 0);
}
function sqAddSheet(gid) {
  const el = document.createElement("div"); el.className = "ci-sheet"; el.id = "sq-add";
  const yr = new Date().getFullYear();
  el.innerHTML = `<div class="ci-back" data-x></div><form class="ci-panel" id="sq-form"><div class="ci-grab"></div><h2>Add a player</h2>
    <p class="muted" style="margin:0;font-size:14px">Creates their Player Passport. You'll get a code to give the parent so they can link it.</p>
    <div class="field"><label for="sq-name">Name</label><input id="sq-name" maxlength="60" required placeholder="First and last name" autocomplete="off"></div>
    <div class="field"><label for="sq-year">Year born</label><select id="sq-year"><option value="">—</option>${Array.from({ length: 18 }, (_, i) => yr - 3 - i).map(y => `<option>${y}</option>`).join("")}</select></div>
    <div class="field"><span class="lbl">Sessions they come to</span><div class="pp-kidg">${GROUPS.filter(x => ACCESS.admin || (ACCESS.groups || []).includes(x.id)).map(x => `<label class="chipcheck"><input type="checkbox" value="${esc(x.id)}" ${x.id === gid ? "checked" : ""}><span>${esc(x.long)}</span></label>`).join("")}</div></div>
    <button class="btn primary big" type="submit">Create passport</button><p class="ci-msg" id="sq-msg"></p></form>`;
  const close = () => { el.remove(); document.body.classList.remove("ci-open"); };
  el.querySelectorAll("[data-x]").forEach(b => b.onclick = close);
  el.querySelector("#sq-form").onsubmit = async e => { e.preventDefault(); const msg = el.querySelector("#sq-msg"), gs = [...el.querySelectorAll(".pp-kidg input:checked")].map(i => i.value), name = el.querySelector("#sq-name").value.trim();
    if (name.length < 2) { msg.textContent = "Add their name."; msg.className = "ci-msg bad"; return; }
    if (!gs.length) { msg.textContent = "Pick at least one session."; msg.className = "ci-msg bad"; return; }
    const { error } = await window.B2B_SB.from("players").insert({ name, birth_year: +el.querySelector("#sq-year").value || null, groups: gs, parent_id: null });
    if (error) { msg.textContent = "Couldn't save: " + error.message; msg.className = "ci-msg bad"; return; }
    toast(name.split(" ")[0] + "'s passport created"); close(); await Comms.loadPlayers(true); loadGroupWeek(gid); };
  document.body.appendChild(el); document.body.classList.add("ci-open"); setTimeout(() => el.querySelector("#sq-name").focus(), 50);
}
async function sqImport(gid) {
  const pps = (Comms.st.players || []).filter(p => (p.groups || []).includes(gid));
  const sq = (state.squads || []).filter(x => x.group === gid && !pps.some(p => p.squad_id === x.id || p.name.trim().toLowerCase() === x.name.trim().toLowerCase()));
  if (!sq.length || !(await Comms.yes(`Create ${sq.length} Player Passport${sq.length > 1 ? "s" : ""}?`, `For ${grp().long}. Players who also come to other sessions can be added to them from their passport.`, "Create", false))) return;
  const all = Comms.st.players || [], rows = [];
  for (const x of sq) { const same = all.find(p => !p.parent_id && p.name.trim().toLowerCase() === x.name.trim().toLowerCase());
    if (same) { await window.B2B_SB.from("players").update({ groups: [...new Set((same.groups || []).concat([gid]))] }).eq("id", same.id); continue; }
    rows.push({ name: x.name.trim(), groups: [gid], squad_id: x.id, parent_id: null }); }
  const { error } = rows.length ? await window.B2B_SB.from("players").insert(rows) : { error: null };
  if (error) return toast("Couldn't create: " + error.message);
  toast(`${sq.length} passport${sq.length > 1 ? "s" : ""} ready`); await Comms.loadPlayers(true); loadGroupWeek(gid);
}
function sqWeekSheet(gid) {
  const W = state.gw[gid]; if (!W || !W.session) return;
  const ses = W.session, sb = window.B2B_SB;
  const el = document.createElement("div"); el.className = "ci-sheet sq-sheet"; el.id = "sq-week";
  const close = () => { el.remove(); document.body.classList.remove("ci-open"); rerenderSoft(); };
  const draw = () => { const P = (state.gw[gid] || {}).players || [], pw = (state.gw[gid] || {}).potw;
    el.innerHTML = `<div class="ci-back" data-x></div><div class="ci-panel"><div class="ci-grab"></div>
      <span class="eyebrow">${esc(grp().long)} · ${esc(new Date(ses.date + "T12:00:00").toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "short" }))}</span><h2>${esc(ses.skill || ses.title)}</h2>
      <p class="muted" style="margin:0;font-size:13px">Tap <b>Here</b> for the register, <b>Got it</b> when they've learned this week's skill, ${ic("star")} for a star of the session and ${ic("trophy")} for player of the week.</p>
      ${ses.done ? "" : `<p class="ci-msg">This session hasn't happened yet. Sign-off opens on the day.</p>`}
      <div class="sq-rows">${P.map(x => `<div class="sq-row"><span class="pp-av sm">${ppInit(x.name)}</span><span class="sq-n"><b>${esc(x.name)}</b><small>${x.med ? `<button type="button" class="sq-med" data-smed="${esc(x.id)}">⚕ Medical</button> ` : ""}${x.photo === "no" ? `<span class="sq-noph">No photos</span> ` : ""}${x.home ? "🏠 home ✓ " : ""}${(x.quiz || 0) >= 2 ? `🧠 quiz ${x.quiz} ` : ""}${x.stars ? `⭐×${x.stars}` : ""}</small></span>
        <button type="button" class="sq-tg${x.here ? " on" : ""}" data-sh="${esc(x.id)}" ${ses.done ? "" : "disabled"}>Here</button>
        <button type="button" class="sq-tg${x.ok ? " on" : ""}" data-so="${esc(x.id)}" ${ses.done ? "" : "disabled"}>Got it</button>
        <button type="button" class="sq-ic" data-ss="${esc(x.id)}" aria-label="Star for ${esc(x.name)}">${ic("star")}</button>
        <button type="button" class="sq-ic${pw && pw.player === x.id ? " gold" : ""}" data-sp="${esc(x.id)}" aria-label="Player of the week: ${esc(x.name)}">${ic("trophy")}</button></div>`).join("") || `<p class="muted">No passports in this group yet.</p>`}</div>
      <button type="button" class="btn big" data-x>Done</button></div>`;
    el.querySelectorAll("[data-x]").forEach(b => b.onclick = close);
    const after = () => loadGroupWeek(gid).then(draw);
    el.querySelectorAll("[data-sh]").forEach(b => b.onclick = async () => { b.disabled = true; const x = P.find(p => p.id === b.dataset.sh);
      const r = x.here ? await sb.from("attendance").delete().eq("player_id", x.id).eq("session_date", ses.date)
        : await sb.from("attendance").insert({ player_id: x.id, session_date: ses.date, group_id: gid, label: grp().long, by_user: ACCESS.uid });
      if (r.error && !/duplicate|unique/i.test(r.error.message)) toast("Couldn't save: " + r.error.message); after(); });
    el.querySelectorAll("[data-so]").forEach(b => b.onclick = async () => { b.disabled = true; const x = P.find(p => p.id === b.dataset.so);
      const r = await sb.rpc("set_week", { p_player: x.id, p_prog: W.prog, p_date: ses.date, p_field: "coach", p_val: x.ok ? 0 : 1 });
      if (r.error) toast("Couldn't save: " + r.error.message); else if (!x.ok) Comms.notify("signoff", `${x.id}|${W.prog}|${ses.date}`); after(); });
    el.querySelectorAll("[data-smed]").forEach(b => b.onclick = () => { const x = P.find(p => p.id === b.dataset.smed); Comms.careSheet(x.id, x.name); });
    el.querySelectorAll("[data-ss]").forEach(b => b.onclick = () => Comms.giveAward(b.dataset.ss, "star", ACCESS.name, gid, null, after));
    el.querySelectorAll("[data-sp]").forEach(b => b.onclick = () => Comms.giveAward(b.dataset.sp, "potw", ACCESS.name, gid, null, after));
  };
  document.body.appendChild(el); document.body.classList.add("ci-open"); draw();
}
Comms.st.onPassportGone = () => { state.teamPP = null; state.devPP = null; render(); };
function bindTeam() {
  if (!state.cal || !state.calFresh) calLoad();
  const m = $("#main");
  m.querySelectorAll("[data-teamtab]").forEach(b => b.onclick = () => { state.teamTab = b.dataset.teamtab; store.set("b2b.teamTab2", state.teamTab); if (state.teamTab !== "chat") Comms.stopChat(); render(); });
  m.querySelectorAll("[data-teampick]").forEach(b => b.onclick = () => { Comms.stopChat(); setGroup(b.dataset.teampick); });
  Comms.bindRsvp(m); Comms.bindAnn(m); Comms.bindPassport(m, ACCESS.name); if (state.teamTabNow === "match") bindMatch(m);
  const swk = m.querySelector("[data-sqweek]"); if (swk) swk.onclick = () => sqWeekSheet(state.team);
  const sad = m.querySelector("[data-sqadd]"); if (sad) sad.onclick = () => sqAddSheet(state.team);
  const spr = m.querySelector("[data-sqprint]"); if (spr) spr.onclick = () => printCodes(state.team, spr);
  const sim = m.querySelector("[data-sqimport]"); if (sim) sim.onclick = () => sqImport(state.team);
  m.querySelectorAll("[data-teampp]").forEach(b => b.onclick = () => { state.teamPP = b.dataset.teampp || null; Comms.st.ppOpen = ""; render(); window.scrollTo(0, 0); });
  const sqs = $("#pp-sq-save"); if (sqs) sqs.onclick = async () => { const sel = $("#pp-sq"), { error } = await window.B2B_SB.from("players").update({ squad_id: sel.value || null }).eq("id", sel.dataset.pp);
    if (error) return toast("Couldn't save: " + error.message); toast(sel.value ? "Linked. Test scores now show in Skills." : "Link removed"); await Comms.loadPlayers(true); Comms.loadPassport(sel.dataset.pp, true); };
  if (state.teamTabNow === "chat") Comms.bindChat(m); else if (state.teamTabNow === "news") Comms.loadAnn(true);
}
/* ---------- chat, news and notifications (coaches' app) ---------- */
state.chatSeg = "";
function chatTabView() {
  const groups = Comms.myGroups(); let seg = state.chatSeg || "";
  if (seg && seg !== "news" && !groups.includes(seg)) seg = state.chatSeg = "";
  const back = `data-chatopen=""`;
  if (seg === "news") return `<section class="view chat-view"><div class="chat-head"><button type="button" class="chat-back" ${back} aria-label="Back to chats"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg></button><span class="ib-av news">${ic("megaphone")}</span><div><b>News</b><small>Posts for the club, a group or a team</small></div></div>${Comms.annComposer()}${Comms.annList()}</section>`;
  if (seg) return `<section class="view chat-view">${Comms.chatView(seg, { head: true, back })}</section>`;
  return `<section class="view"><h1 class="page-h">Chat</h1>${Comms.inboxView({ news: true })}</section>`;
}
function bindChatTab() {
  const m = $("#main");
  m.querySelectorAll("[data-chatopen]").forEach(b => b.onclick = () => { state.chatSeg = b.dataset.chatopen; Comms.stopChat(); render(); window.scrollTo(0, 0); });
  Comms.bindAnn(m);
  if (state.chatSeg && state.chatSeg !== "news" && Comms.myGroups().includes(state.chatSeg)) Comms.bindChat(m);
  else { Comms.loadAnn(true); if (!state.chatSeg) Comms.loadUnread(); }
}
document.addEventListener("click", e => { const a = e.target.closest('nav.tabs a[data-tab="chat"]'); if (a && state.tab === "chat" && state.chatSeg) { state.chatSeg = ""; Comms.stopChat(); render(); } else if (a) state.chatSeg = ""; }, true);
function homeNews() {
  const list = Comms.st.ann || [];
  if (!list.length && !Comms.isStaff()) return "";
  return `<div class="home-news"><div class="sec2"><h2>News</h2><a href="#chat" data-gonews>See all</a></div>${list.length ? Comms.annList(1) : `<div class="card empty">No news yet.</div>`}</div>`;
}
function paintChatDot() { const d = document.getElementById("nav-dot"); if (d) d.hidden = !Comms.unreadCount(); }
Comms.st.onChange = what => { if (what === "unread") { paintChatDot(); if (state.tab === "chat" && !state.chatSeg && !document.activeElement.matches("input,textarea")) render(); return; } rerenderSoft(); };
window.addEventListener("hashchange", () => { if (location.hash.slice(1) !== "chat") Comms.stopChat(); });
document.addEventListener("click", e => { if (e.target.closest("[data-gonews]")) state.chatSeg = "news"; });
Comms.loadAnn(true); Comms.loadUnread();
setTimeout(() => Comms.startPush(), 1200);
setInterval(() => { if (document.hidden) return; Comms.loadAnn(); Comms.loadUnread(); }, 60000);
document.addEventListener("visibilitychange", () => { if (!document.hidden) { Comms.loadAnn(); Comms.loadUnread(); } });
/* links from notifications: #news opens the News tab */
function newsLink() { if (location.hash === "#news") { state.chatSeg = "news"; location.replace("#chat"); } }
window.addEventListener("hashchange", newsLink); newsLink();
/* syllabus: one block at a time, with block tabs */
function sylBlock(pr, list, ni) {
  const cur = ni >= 0 ? list[ni].block : pr.blocks[pr.blocks.length - 1].n;
  return ((state.sylB || {})[grp().prog]) || cur;
}
function sylTabs(pr, list, ni) {
  const sel = sylBlock(pr, list, ni), cur = ni >= 0 ? list[ni].block : null;
  return `<div class="subtabs syl-tabs" role="tablist" aria-label="Blocks">${pr.blocks.map(b => `<button type="button" role="tab" class="subtab" data-sylb="${b.n}" aria-selected="${b.n === sel}" aria-label="Block ${b.n}"><span class="wide-only">Block </span>${b.n}${b.n === cur ? `<span class="subtab-now">Now</span>` : ""}</button>`).join("")}</div>`;
}

/* ---------- cover requests ---------- */
const coverWhen = c => `${fmtDay(new Date(c.starts_at), { weekday: "short", day: "numeric", month: "short" })} · ${fmtTime(new Date(c.starts_at))}–${fmtTime(new Date(c.ends_at))}`;
function coverView() {
  const list = (state.cal && state.cal.covers) || [];
  if (!list.length) return `<div class="card empty">No cover needed right now. When a coach's time off is approved, their sessions appear here.</div>`;
  const open = list.filter(c => c.status === "open"), done = list.filter(c => c.status === "covered");
  const card = c => {
    const mineOff = c.needed_for === ACCESS.uid, mineCover = c.cover_coach === ACCESS.uid;
    const action = c.status === "open"
      ? (mineOff ? `<span class="muted">You're off. Waiting for a coach.</span>` : `<button class="btn small primary" data-claim="${c.id}">I can cover</button>`)
      : `<span class="pill st-approved">Covered by ${esc(mineCover ? "you" : c.cover_name || "a coach")}</span>${mineCover || ACCESS.admin ? `<button class="btn small ghost" data-release="${c.id}">${mineCover ? "I can't now" : "Reopen"}</button>` : ""}`;
    return `<div class="cover-card card${c.status === "open" ? " is-open" : ""}">
      <span class="cal-time">${esc(coverWhen(c))}</span><b>${esc(c.title)}</b>
      <span class="cal-sub">${esc(c.group_id ? groupLabel(c.group_id) : "")}${c.location ? " · " + esc(c.location.split(",")[0]) : ""} · ${esc(c.needed_name || "A coach")} is off</span>
      <div class="actions cover-actions">${action}${ACCESS.admin ? `<button class="btn small ghost" data-coverdel="${c.id}" aria-label="Remove this cover request">Remove</button>` : ""}</div></div>`;
  };
  return `${open.length ? `<h2 class="sec-sub">Needs a coach</h2><div class="cover-list">${open.map(card).join("")}</div>` : `<div class="card empty">Every session is covered. Thank you!</div>`}
    ${done.length ? `<h2 class="sec-sub">Covered</h2><div class="cover-list">${done.map(card).join("")}</div>` : ""}`;
}
function bindCover() {
  const sb = window.B2B_SB;
  document.querySelectorAll("[data-claim]").forEach(b => b.onclick = async () => {
    b.disabled = true;
    const { data, error } = await sb.rpc("claim_cover", { cid: b.dataset.claim });
    if (error || !data) { toast(error ? "Couldn't save: " + error.message : "Someone has just covered this one."); await calLoad(true); return render(); }
    Comms.notify("covered", b.dataset.claim); toast("Thanks! You're covering this session.");
    await calLoad(true); render();
  });
  document.querySelectorAll("[data-release]").forEach(b => b.onclick = async () => {
    if (!(await Comms.yes("Give this session back?", "Another coach can then cover it.", "Give back"))) return;
    const { data, error } = await sb.rpc("release_cover", { cid: b.dataset.release });
    if (error || !data) return toast("Couldn't change it: " + (error ? error.message : "not allowed"));
    Comms.notify("cover_one", b.dataset.release); await calLoad(true); render();
  });
  document.querySelectorAll("[data-coverdel]").forEach(b => b.onclick = async () => {
    if (!(await Comms.yes("Remove this cover request?", "", "Remove"))) return;
    const { error } = await sb.from("covers").delete().eq("id", b.dataset.coverdel);
    if (error) return toast("Couldn't remove: " + error.message);
    await calLoad(true); render();
  });
  document.querySelectorAll("[data-askcover]").forEach(b => b.onclick = async () => {
    const [eid, iso, uid] = b.dataset.askcover.split("|");
    const e = (state.cal.events || []).find(x => x.id === eid); if (!e) return;
    const occ = occurrences(e, dayOf(iso), addDays(dayOf(iso), 1))[0]; if (!occ) return;
    const id = crypto.randomUUID();
    const { error } = await sb.from("covers").insert({ id, event_id: e.id, starts_at: occ.start.toISOString(), ends_at: occ.end.toISOString(), group_id: e.group_id, title: e.title, location: e.location, needed_for: uid, needed_name: personName(uid), reason: "Unavailable" });
    if (error) return toast(/duplicate|unique/i.test(error.message) ? "Cover has already been asked for." : "Couldn't ask: " + error.message);
    Comms.notify("cover_one", id); toast("Free coaches have been asked to cover."); await calLoad(true); render();
  });
}

/* ---------- the week ahead: each coach confirms their sessions ---------- */
function weekAhead(uid, groups) {
  const from = today0(), to = addDays(from, 8), out = [];
  ((state.cal && state.cal.events) || []).filter(e => e.group_id && groups.includes(e.group_id))
    .forEach(e => occurrences(e, from, to).forEach(o => { if (o.end > new Date()) out.push({ e, o, key: Comms.rsvpKey(e.id, isoOf(o.start)),
      cover: ((state.cal && state.cal.covers) || []).find(v => v.event_id === e.id && v.needed_for === uid && isoOf(new Date(v.starts_at)) === isoOf(o.start)) }); }));
  return out.sort((a, b) => a.o.start - b.o.start);
}
function weekAheadCard() {
  if (!Comms.isStaff() || !(ACCESS.groups || []).length) return "";
  const list = weekAhead(ACCESS.uid, ACCESS.groups);
  if (!list.length) return "";
  Comms.loadRsvps(list.map(x => x.key));
  const mine = k => ((Comms.st.rsvp[k] || []).find(r => r.user_id === ACCESS.uid) || {}).status;
  const left = list.filter(x => !x.cover && !mine(x.key)).length;
  return `<section class="card week-ahead">
    <div class="wa-head"><h2>Your week</h2><span class="${left ? "pill cpd-late" : "pill cpd-ok"}">${left ? `${left} to confirm` : "All confirmed"}</span></div>
    <div class="wa-list">${list.map(x => { const st = mine(x.key); return `<div class="wa-row" data-rkey="${esc(x.key)}">
      <div><span class="cal-time">${esc(fmtDay(x.o.start, { weekday: "short", day: "numeric", month: "short" }))} · ${esc(fmtTime(x.o.start))}</span><b>${esc(x.e.title)}</b></div>
      ${x.cover ? `<span class="pill ${x.cover.status === "covered" ? "st-approved" : "st-pending"}">Off · ${x.cover.status === "covered" ? "covered by " + esc(x.cover.cover_name || "a coach") : "cover asked"}</span>` : `<div class="wa-btns"><button type="button" class="rsvp-btn yes" data-wa="${esc(x.key)}|${esc(x.e.group_id)}|yes" aria-pressed="${st === "yes"}" aria-label="Coaching ${esc(x.e.title)}">✓</button><button type="button" class="rsvp-btn no" data-wa="${esc(x.key)}|${esc(x.e.group_id)}|no" aria-pressed="${st === "no"}" aria-label="Can't make ${esc(x.e.title)}">✗</button></div>`}</div>`; }).join("")}</div>
    ${left > 1 ? `<div><button type="button" class="btn small primary" data-waall>Confirm all</button></div>` : ""}
  </section>`;
}
async function waSet(key, group_id, status) {
  const sb = window.B2B_SB, prev = Comms.st.rsvp[key] || [];
  Comms.st.rsvp[key] = prev.filter(r => r.user_id !== ACCESS.uid).concat([{ item_key: key, user_id: ACCESS.uid, group_id, status, user_name: ACCESS.name, user_role: ACCESS.role || "coach" }]);
  const { error } = await sb.from("rsvps").upsert({ item_key: key, user_id: ACCESS.uid, group_id, status }, { onConflict: "item_key,user_id" });
  if (error) { Comms.st.rsvp[key] = prev; toast("Couldn't save: " + error.message); return false; }
  if (status === "no") Comms.notify("cantmake", key);
  return true;
}
function bindWeekAhead() {
  document.querySelectorAll("[data-wa]").forEach(b => b.onclick = async () => {
    const [key, g, status] = b.dataset.wa.split("|");
    if (await waSet(key, g, status)) { toast(status === "yes" ? "Confirmed" : "Thanks. The head coach has been told."); render(); }
  });
  const all = $("[data-waall]");
  if (all) all.onclick = async () => {
    all.disabled = true;
    for (const x of weekAhead(ACCESS.uid, ACCESS.groups).filter(x => !x.cover)) { const st = ((Comms.st.rsvp[x.key] || []).find(r => r.user_id === ACCESS.uid) || {}).status; if (!st) await waSet(x.key, x.e.group_id, "yes"); }
    toast("All confirmed. Thanks!"); render();
  };
}

/* ---------- head coach: who's coaching what this week ---------- */
function availabilityView() {
  const from = today0(), to = addDays(from, 8), list = [];
  ((state.cal && state.cal.events) || []).filter(e => e.group_id).forEach(e => occurrences(e, from, to).forEach(o => { if (o.end > new Date()) list.push({ e, o, key: Comms.rsvpKey(e.id, isoOf(o.start)) }); }));
  list.sort((a, b) => a.o.start - b.o.start);
  if (!list.length) return `<div class="card empty">No sessions in the next 7 days.</div>`;
  Comms.loadRsvps(list.map(x => x.key));
  const coachesFor = g => Object.entries(state.profiles).filter(([, p]) => p && p.role === "coach" && (p.groups || []).includes(g)).map(([id, p]) => ({ id, name: p.name || "Coach" }));
  const covers = (state.cal && state.cal.covers) || [];
  return `<div class="card avail">${list.map(x => {
    const rs = Comms.st.rsvp[x.key] || [], cs = coachesFor(x.e.group_id);
    const iso = isoOf(x.o.start);
    return `<div class="avail-row"><div class="avail-when"><span class="cal-time">${esc(fmtDay(x.o.start, { weekday: "short", day: "numeric", month: "short" }))} · ${esc(fmtTime(x.o.start))}</span><b>${esc(x.e.title)}</b></div>
      <div class="avail-coaches">${cs.length ? cs.map(c => { const st = (rs.find(r => r.user_id === c.id) || {}).status; const cov = covers.find(v => v.event_id === x.e.id && isoOf(new Date(v.starts_at)) === iso && v.needed_for === c.id);
        if (cov) return `<span class="avail-c ${cov.status === "covered" ? "yes" : "no"}">${esc(c.name)} off · <em>${cov.status === "covered" ? "covered by " + esc(cov.cover_name || "a coach") : "cover asked"}</em></span>`;
        return `<span class="avail-c ${st || "none"}">${st === "yes" ? "✓" : st === "no" ? "✗" : "?"} ${esc(c.name)}${st === "no" ? ` <button type="button" class="linkbtn" data-askcover="${x.e.id}|${iso}|${c.id}">Ask for cover</button>` : ""}</span>`; }).join("") : `<span class="muted">No coach assigned</span>`}</div></div>`;
  }).join("")}<p class="muted" style="margin:0;font-size:13px">✓ in · ✗ out · ? no reply</p></div>`;
}
/* #cover links (from notifications) open the Cover tab */
/* short links (#syllabus, #develop, #timeoff, #cover, #approvals) open that part of the Coaches page */
const COACH_LINKS = { checkin: "checkin", prep: "prep", syllabus: "syllabus", develop: "develop", timeoff: "off", cover: "cover", approvals: "admin" };
function coverLink() { const k = COACH_LINKS[location.hash.slice(1)]; if (k) { state.coachSub = k; location.replace("#coaches"); } }
window.addEventListener("hashchange", coverLink); coverLink();

/* ---------- the Coaches page: syllabus, development, time off, cover, approvals ---------- */
state.coachSub = COACH_LINKS[location.hash.slice(1)] || "";
const COACH_TILES = { attendance: ["Player attendance", "check"], statements: ["My statements", "clipboard"], checkin: ["GPS check-in / out", "pin"], prep: ["My Session Plans", "target"], develop: ["Coach Learning", "cap"], syllabus: ["My Syllabus", "book"], off: ["Time off", "sun"], cover: ["Cover", "swap"], admin: ["Approvals", "check"], safe: ["Safeguarding", "shield"], players: ["Player development", "id"], comply: ["Compliance", "clipboard"], more: ["More", "sparkle"], help: ["Help", "bulb"] };
function coachSubs() {
  const c = state.cal, admin = ACCESS.admin;
  const pend = admin && c ? (c.holidays || []).filter(h => h.status === "pending").length : 0;
  const cov = c ? (c.covers || []).filter(x => x.status === "open" && x.needed_for !== ACCESS.uid).length : 0;
  const subs = [["attendance", "Player attendance"], ["statements", "My statements"], ["players", "Players"], ["checkin", "GPS check-in / out"], ["prep", "Prep", prepDue().filter(x => !prepRec(x.s.key).pass).length], ["develop", "Development"], ["syllabus", "Syllabus"], ["off", "Time off"], ["cover", "Cover", cov]];
  if (admin) subs.push(["admin", "Approvals", pend]);
  if (!Comms.st.rules) setTimeout(() => Comms.loadRules());
  subs.push(["comply", "Compliance", complyDue()]);
  if (admin || (Comms.st.rules && Comms.st.rules.welfare_me)) subs.push(["safe", "Safeguarding", (Comms.st.rules && Comms.st.rules.open_reports) || 0]);
  subs.push(["help", "Help"]);
  const rest = subs.filter(x => !MAIN_TILES.includes(x[0]));
  subs.push(["more", "More", rest.reduce((a, x) => a + (x[2] || 0), 0)]);
  return subs;
}
function coachTile(k, n) {
  const c = state.cal || {}, fd = d => fmtDay(dayOf(d), { day: "numeric", month: "short" });
  let line = "", hot = !!n;
  if (k === "checkin") {
    const ts = (ACCESS.groups || []).length ? todaySessions(ACCESS.groups) : [], done = ts.filter(x => myCin(x)).length;
    if (!state.cin) setTimeout(loadCin);
    if (ACCESS.admin) { const all = todaySessions(null), n = ((state.cin && state.cin.rows) || []).length; line = all.length ? `${n} coach check-in${n === 1 ? "" : "s"} today` : "No sessions today"; }
    else line = !ts.length ? "No sessions today" : done === ts.length ? "✓ You're checked in" : "Tap when you arrive";
    hot = !ACCESS.admin && ts.length > done && ts.some(x => Date.now() >= x.start.getTime() - 90 * 60e3 && Date.now() <= x.end.getTime());
  } else if (k === "prep") {
    const due = prepDue(), todo = due.filter(x => !prepRec(x.s.key).pass), nx = prepList()[0];
    line = todo.length ? `${prepDay(todo[0].s)}: ${todo[0].s.title}` : due.length ? `Ready for ${prepDay(due[0].s).toLowerCase()} ✓` : nx ? `Next: ${nx.s.dt.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "short" })}` : "No sessions coming up";
  } else if (k === "develop") {
    const nx = cpdStartStage() ? cpdNext() : null, due = cpdStartStage() ? cpdDue().length : 0;
    line = !cpdStartStage() ? "Start your coaching pathway" : nx ? `Next: ${cpdStep(nx).title}` : "Pathway complete";
    if (due) line += ` · ${Math.min(due, 5)} to recall`;
  } else if (k === "syllabus") {
    const l = P().sessions, i = nextIdx(l), x = l[i];
    line = x ? `${P().short} · Block ${BLOCK_WORD[x.block]} · Week ${x.week}` : "Season complete";
  } else if (k === "off") {
    const mine = (c.holidays || []).filter(h => h.coach_id === ACCESS.uid && h.end_date >= isoOf(today0()));
    const wait = mine.filter(h => h.status === "pending"), ok = mine.filter(h => h.status === "approved").sort((a, b) => a.start_date.localeCompare(b.start_date));
    line = wait.length ? `${wait.length} waiting for approval` : ok.length ? `You're off ${fd(ok[0].start_date)} – ${fd(ok[0].end_date)}` : "Book time off";
  } else if (k === "cover") line = n ? `${n} session${n > 1 ? "s" : ""} need${n > 1 ? "" : "s"} a coach` : "No cover needed";
  else if (k === "admin") line = n ? `${n} request${n > 1 ? "s" : ""} to approve` : "Nothing waiting";
  if (k === "more") line = "Compliance, time off, cover and help";
  if (k === "help") line = "How things work";
  if (k === "comply") { const mine = (state.comply || []).filter(r => r.coach_id === ACCESS.uid); line = state.comply === null ? "DBS, safeguarding, first aid" : n ? `${n} to sort` : mine.length ? "All in date" : "Add your dates"; }
  if (k === "players") { const n = (Comms.st.players || []).length; if (!Comms.st.players) setTimeout(() => Comms.loadPlayers()); line = Comms.st.players ? `${n} Player Passport${n === 1 ? "" : "s"}` : "Every player's passport"; }
  if (k === "attendance") line = "Your team’s training register";
  if (k === "statements") line = "Work logs, mileage and monthly statements";
  if (k === "safe") { const r = Comms.st.rules || {}; line = n ? `${n} report${n > 1 ? "s" : ""} to look at` : r.players_post ? "Players can post" : "Players read-only"; }
  const [title, ico] = COACH_TILES[k];
  return `<button type="button" class="ct ct-${k}${hot ? " hot" : ""}" data-csub="${k}"><span class="ct-ico" aria-hidden="true">${ic(ico)}</span>${n ? `<span class="ct-n">${n}</span>` : ""}<b>${esc(title)}</b><small>${esc(line)}</small></button>`;
}
const MAIN_TILES = ["checkin", "prep", "players", "develop", "attendance", "statements", "syllabus", "more"];
function coachesView() {
  // Coaches without assigned groups must not see generic team syllabuses or session tools.
  // Director access remains unaffected; server-side RLS still governs data access.
  if (!ACCESS.admin && !(ACCESS.groups || []).length) {
    state.coachSub = "";
    return `<section class="view coach-hub"><h1 class="page-h">My Coaching Hub</h1><div class="card box"><h2>No coaching sessions assigned</h2><p class="muted">You currently have no assigned teams or training sessions. Contact the academy director if you think this is incorrect.</p></div></section>`;
  }
  // Keep the Coaching Hub on an assigned team, not a previously selected unrelated group.
  // This is a UI safeguard; database RLS remains the source of authorization.
  const assigned = ACCESS.groups || [];
  if (!ACCESS.admin && assigned.length && !assigned.includes(state.team)) {
    const next = GROUPS.find(g => assigned.includes(g.id));
    if (next) { state.team = next.id; store.set("b2b.team", next.id); }
  }
  const subs = coachSubs(), sub = subs.some(x => x[0] === state.coachSub) ? state.coachSub : "";
  if (!sub) { setTimeout(() => Comms.maybeWelcome("coach"), 600); return `<section class="view coach-hub"><header class="coach-command"><p class="eyebrow">BOX TO BOX · COACH WORKSPACE</p><h1 class="page-h">COACHES<span>READY FOR THE PITCH.</span></h1><p>Check in. Prepare your session. Develop your players.</p></header><div class="ct-grid">${MAIN_TILES.map(k => subs.find(x => x[0] === k)).filter(Boolean).map(([k, , n]) => coachTile(k, n || 0)).join("")}</div><h2 class="workspace-label">TEAM & FAMILY</h2><div class="coach-links"><a href="#tactics-hub">Tactics Hub <span>Game model & player roles ↗</span></a><a href="#team" data-hub-matchroom>Match Room <span>Availability, map & match focus ↗</span></a><a href="#calendar">Calendar <span>Training, matches & events ↗</span></a><button data-coach-family>Parent Hub <span>Training focus & coach feedback ↗</span></button></div></section>`; }
  if (sub === "more") return `<section class="view coach-sub"><div class="chat-head ct-head"><button type="button" class="chat-back" data-csub="" aria-label="Back to Coaches"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg></button><span class="ct-ico sm" aria-hidden="true">${ic("sparkle")}</span><div><small>Coaches</small><b>More</b></div></div><div class="ct-grid">${subs.filter(x => !MAIN_TILES.includes(x[0])).map(([k, , n]) => coachTile(k, n || 0)).join("")}</div></section>`;
  const body = sub === "attendance" ? '<section class="view"><div id="coach-register-root"></div></section>' : sub === "statements" ? '<section class="view"><div id="coach-statements-root"></div></section>' : sub === "checkin" ? checkinHubView() : sub === "prep" ? prepView() : sub === "syllabus" ? syllabusView() : sub === "develop" ? developView(true) : sub === "safe" ? safeView() : sub === "players" ? playersHub() : sub === "comply" ? complyView() : sub === "help" ? Comms.helpHtml("coach") : calendarView(sub);
  return `<section class="view coach-sub"><div class="chat-head ct-head"><button type="button" class="chat-back" data-csub="${MAIN_TILES.includes(sub) ? "" : "more"}" aria-label="Back"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg></button><span class="ct-ico sm" aria-hidden="true">${ic(COACH_TILES[sub][1])}</span><div><small>Coaches</small><b>${esc(COACH_TILES[sub][0])}</b></div></div></section>${body}`;
}
document.addEventListener("click", e => { const a = e.target.closest('nav.tabs a[data-tab="coaches"]'); if (!a) return; if (cpdDirty() && !confirm("You have unsaved changes to your reflection. Leave without saving?")) { e.preventDefault(); e.stopPropagation(); return; } const was = state.coachSub; state.coachSub = ""; state.cpdDirty = false; if (was && state.tab === "coaches") { render(); window.scrollTo(0, 0); } }, true);
function paintCoachDot() { const d = document.getElementById("coach-dot"); if (d) d.hidden = !coachSubs().some(x => x[2]); }
function bindCoaches() {
  paintCoachDot();
  document.querySelector("[data-coach-family]")?.addEventListener("click",()=>{dayRemember="family";location.hash="#home";});
  document.querySelector("[data-hub-matchroom]")?.addEventListener("click",()=>{state.teamTab="match";state.mp=null;});
  document.querySelectorAll("[data-csub]").forEach(b => b.onclick = () => { if (!b.dataset.csub && cpdDirty() && !confirm("You have unsaved changes to your reflection. Leave without saving?")) return; state.cpdDirty = false; state.coachSub = b.dataset.csub; state.prepRun = state.prepLearn = null; render(); window.scrollTo(0, 0); });
  const sub = coachSubs().some(x => x[0] === state.coachSub) ? state.coachSub : "";
  if (!sub) { if (!state.cal || !state.calFresh) calLoad(); return; }
  if (sub === "attendance") { dayBridge.attendance(state.team,$("#coach-register-root"),"training"); return; }
  if (sub === "statements") { window.B2B_OPERATIONS.mount($("#coach-statements-root"),{coach:true,initialView:"statements"}); return; }
  if (sub === "checkin") { window.B2B_OPERATIONS.mountTraining($("#coach-gps-root")); if (!state.cal || !state.calFresh) calLoad(); } else if (sub === "prep") bindPrep(); else if (sub === "syllabus") bindSyllabus(); else if (sub === "develop") bindDevelop(); else if (sub === "safe") bindSafe(); else if (sub === "players") bindPlayersHub(); else if (sub === "comply") bindComply(); else if (sub === "more" || sub === "help") { } else bindCalendar();
}


/* ---------- session prep: learn the next session, then test yourself (day before, e.g. Friday for Saturday) ---------- */
function prepGroups() { const mine = (ACCESS.groups || []).length ? ACCESS.groups : ACCESS.admin ? GROUPS.map(g => g.id) : []; return GROUPS.filter(g => mine.includes(g.id)); }
function prepList() {
  const byProg = {};
  prepGroups().forEach(g => { (byProg[g.prog] = byProg[g.prog] || []).push(g); });
  return Object.keys(byProg).map(prog => { const list = PROGS[prog] && PROGS[prog].sessions; if (!list) return null; const i = nextIdx(list); if (i < 0) return null;
    const s = list[i]; return { s, groups: byProg[prog], days: Math.round((s.dt - today0()) / 864e5) }; }).filter(Boolean).sort((a, b) => a.s.dt - b.s.dt);
}
const prepDue = () => (typeof PROGS === "undefined" || !Comms.isStaff()) ? [] : prepList().filter(x => x.days <= 1);
const prepRec = key => cpdMy("prep_" + key);
const prepDay = s => { const d = Math.round((s.dt - today0()) / 864e5); return d === 0 ? "Today" : d === 1 ? "Tomorrow" : s.dt.toLocaleDateString("en-GB", { weekday: "long" }); };
const prepNorm = t => String(t || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const prepShort = t => { t = String(t || "").trim(); if (t.length <= 120) return t; const c = t.slice(0, 117); return c.slice(0, c.lastIndexOf(" ")) + "…"; };
const prepObj = t => String(t || "").replace(/^By the end,? (of the session,? )?players (can|will( be able to)?) /i, "").replace(/^\w/, c => c.toUpperCase());
const prepHash = t => { let h = 0; for (const ch of String(t)) h = (h * 31 + ch.charCodeAt(0)) % 9973; return h; };
function prepQs(s) {
  if (s._qs) return s._qs;
  const near = PROGS[s.prog].sessions.filter(o => o.key !== s.key).sort((a, b) => Math.abs(a.idx - s.idx) - Math.abs(b.idx - s.idx));
  const qs = [], wrongs = (right, pool) => { const seen = new Set([prepNorm(right)]), out = [];
    for (const v of pool) { const n = prepNorm(v); if (v && n && !seen.has(n)) { seen.add(n); out.push(v); if (out.length === 2) break; } } return out; };
  const add = (q, right, pool, part, i) => { if (!right) return null; const w = wrongs(right, pool); if (w.length < 2) return null;
    const a = [right, w[0], w[1]]; let cp = 0; while (cp < a[0].length && a.every(x => x[cp] === a[0][cp])) cp++; if (cp > 30) return null;
    const o = { q, a, part, i }; qs.push(o); return o; };
  add("By the end, players should…", prepObj(s.objective), near.map(o => prepObj(o.objective)), "Objective", -1);
  if (s.technique || s.skill) add("What's the technique focus?", s.technique || s.skill, near.map(o => o.technique || o.skill), "Focus", -1);
  if (s.word) add("What's the game word?", s.word, near.map(o => o.word), "Game word", -1);
  const parts = s.plan.map((p, i) => ({ p, i, same: near.flatMap(o => o.plan.filter(x => x.name === p.name)) }));
  const main = parts.filter(x => x.i > 0 && x.i < s.plan.length - 1);
  main.forEach(({ p, i, same }) => add(`${p.name}: what are the coaching points?`, p.points, same.map(x => x.points), p.name, i));
  const big = main.slice().sort((a, b) => b.p.mins - a.p.mins);
  for (const { p, i, same } of big) if (add(`Which practice is the ${p.name.toLowerCase()} (${p.mins} min)?`, prepShort(p.practice), same.map(x => prepShort(x.practice)), p.name, i)) break;
  for (const { p, i, same } of big) { const d = p.detail || {}; if (d.progress && d.regress && add(`${p.name}: how do you make it harder?`, d.progress, [d.regress].concat(same.map(x => x.detail && x.detail.progress)), p.name, i)) break; }
  add("Low numbers on the day. What's the plan?", s.low, near.map(o => o.low), "Low numbers", -1);
  add("What's the home challenge to give players?", s.home, near.map(o => o.home), "Home challenge", -1);
  return (s._qs = qs.slice(0, 9));
}
const prepOpts = q => { const P = [[0, 1, 2], [1, 0, 2], [1, 2, 0], [2, 0, 1], [0, 2, 1], [2, 1, 0]]; return P[prepHash(q.q + q.a[0]) % 6].map(i => ({ t: q.a[i], ok: i === 0 })); };
const prepItem = key => prepList().find(x => x.s.key === key);
function prepPoints(p) { const d = p.detail || {}; return (d.points && d.points.length ? d.points : String(p.points || "").split(/;\s*|\.\s+/)).map(x => x.replace(/\.$/, "").trim()).filter(Boolean); }

function prepView() {
  if (state.prepRun) return `<section class="view">${prepRunView()}</section>`;
  if (state.prepLearn) return `<section class="view">${prepLearnView()}</section>`;
  const list = prepList();
  if (!list.length) return `<section class="view"><div class="card empty">No sessions coming up for your groups.</div></section>`;
  const first = list[0];
  return `<section class="view">
    <div class="prep-hero"><p>The day before each session: learn the plan, then test yourself. Five minutes.</p></div>
    ${ACCESS.admin ? prepReadyHtml() : ""}${ACCESS.admin ? `<h3 class="cpd-h" style="margin:6px 0 0">Your sessions</h3>` : ""}
    ${list.map(({ s, groups, days }) => { const r = prepRec(s.key), n = prepQs(s).length, due = days <= 1;
      return `<article class="prep-card${due ? " due" : ""}">
        <div class="prep-top"><span class="prep-day">${esc(prepDay(s))}${days > 1 ? ` · ${esc(s.dt.toLocaleDateString("en-GB", { day: "numeric", month: "short" }))}` : ""}</span>
          ${r.pass ? `<span class="pill cpd-ok">Ready ✓ ${r.score}/${r.n}</span>` : r.n ? `<span class="pill cpd-late">${r.score}/${r.n} · retake</span>` : due ? `<span class="pill cpd-late">Prep now</span>` : `<span class="pill">Opens the day before</span>`}</div>
        <small class="prep-groups">${groups.map(g => esc(g.long)).join(" · ")} · ${esc(PROGS[s.prog].hours)}</small>
        <h3>${esc(s.title)}</h3>
        <div class="prep-time">${s.plan.map(p => `<i style="flex:${p.mins}" title="${esc(p.name)} · ${p.mins} min"></i>`).join("")}</div>
        <div class="prep-btns"><button type="button" class="btn${r.pass ? "" : " primary"}" data-preplearn="${s.key}">${ic("book")} Learn it</button><button type="button" class="btn" data-preptest="${s.key}">${ic("target")} Test me · ${n}</button></div>
      </article>`; }).join("")}
    <p class="muted" style="margin:0;font-size:13px">${ic("lock")} Your scores are private to you.${ACCESS.admin ? " Other coaches see only their own; you see just whether each coach is ready." : ""}</p>
  </section>`;
}
function prepLearnView() {
  const L = state.prepLearn, it = prepItem(L.key); if (!it) { state.prepLearn = null; return prepView(); }
  const s = it.s, g = it.groups[0], cards = s.plan.length + 1, i = Math.min(L.i, cards - 1);
  const dots = `<div class="prep-dots">${Array.from({ length: cards }, (_, k) => `<i class="${k < i ? "d" : k === i ? "c" : ""}"></i>`).join("")}</div>`;
  let body;
  if (i === 0) {
    const focus = s.technique || s.skill;
    body = `<span class="eyebrow">${esc(prepDay(s))} · ${esc(it.groups.map(x => x.long).join(" · "))}</span>
      <h2 class="cpd-title">${esc(s.title)}</h2>
      <div class="prep-facts">${focus ? `<div><small>Focus</small><b>${esc(focus)}</b></div>` : ""}${s.word ? `<div><small>Game word</small><b>${esc(s.word)}</b></div>` : ""}${s.phase ? `<div><small>Phase</small><b>${esc(s.phase)}</b></div>` : ""}<div><small>Time</small><b>${s.plan.reduce((a, p) => a + p.mins, 0)} min</b></div></div>
      <div class="cpd-callout"><span>${ic("target")}</span><div><b>Objective</b><p>${esc(prepObj(s.objective))}</p></div></div>
      <div class="prep-flow">${s.plan.map((p, k) => `<div><span>${k + 1}</span><b>${esc(p.name)}</b><small>${p.mins}′</small></div>`).join("")}</div>
      <div class="prep-note"><b>${esc(g.long)}</b>${adaptHtml(s, g.id)}</div>
      ${s.low ? `<div class="prep-note"><b>Low numbers</b><p>${esc(s.low)}</p></div>` : ""}`;
  } else {
    const p = s.plan[i - 1], d = p.detail || {};
    body = `<span class="eyebrow">Part ${i} of ${s.plan.length} · ${p.mins} min</span>
      <h2 class="cpd-title">${esc(p.name)}</h2>
      ${d.svg ? `<div class="dia prep-dia" role="img" aria-label="Practice diagram">${d.svg}</div>` : ""}
      <p class="prep-practice">${esc(p.practice)}</p>
      ${d.area || d.players ? `<div class="prep-facts">${d.area ? `<div><small>Area</small><b>${esc(d.area)}</b></div>` : ""}${d.players ? `<div><small>Players</small><b>${esc(d.players)}</b></div>` : ""}</div>` : ""}
      <div class="prep-pts"><h3 class="cpd-h">Coaching points</h3>${prepPoints(p).map(t => `<span>${esc(t)}</span>`).join("")}</div>
      ${d.progress || d.regress ? `<div class="prep-pr">${d.progress ? `<div><b>⬆ Harder</b><p>${esc(d.progress)}</p></div>` : ""}${d.regress ? `<div><b>⬇ Easier</b><p>${esc(d.regress)}</p></div>` : ""}</div>` : ""}
      ${d.questions ? `<div class="prep-note"><b>Ask them</b><p>${esc(d.questions)}</p></div>` : ""}`;
  }
  const last = i === cards - 1;
  return `<div class="prep-learn">${dots}${body}
    <div class="prep-nav">${i ? `<button type="button" class="btn" data-prepstep="${i - 1}">Back</button>` : `<button type="button" class="btn" data-prepclose>Close</button>`}
      ${last ? `<button type="button" class="btn primary" data-preptest="${s.key}">${ic("target")} Test me</button>` : `<button type="button" class="btn primary" data-prepstep="${i + 1}">Next</button>`}</div></div>`;
}
function prepRunView() {
  const R = state.prepRun, it = prepItem(R.key); if (!it) { state.prepRun = null; return prepView(); }
  const s = it.s, qs = prepQs(s), n = qs.length;
  if (R.i >= n) {
    const pass = R.right >= Math.ceil(n * 0.7), missed = qs.filter((q, k) => !R.res[k]);
    return `<div class="cpd-quiz-res"><div class="cpd-res-ico">${pass ? ic("check") : ic("book")}</div><span class="eyebrow">${esc(prepDay(s))} · ${esc(s.title)}</span>
      <h2 class="cpd-title">${pass ? "You're ready" : `${R.right} of ${n}`}</h2>
      <p>${pass ? `${R.right} of ${n}. Walk in knowing the plan.` : `Aim for ${Math.ceil(n * 0.7)}. Have another look at the parts below, then try again.`}</p>
      ${missed.length ? `<div class="prep-miss"><h3 class="cpd-h">${pass ? "Worth a look" : "Go over these"}</h3>${missed.map(q => `<div><small>${esc(q.part)}</small><b>${esc(q.a[0])}</b></div>`).join("")}</div>` : ""}
      <div class="prep-btns">${pass ? `<button type="button" class="btn primary big" data-prepdone>Done</button>` : `<button type="button" class="btn primary" data-preplearn="${s.key}">${ic("book")} Learn it</button><button type="button" class="btn" data-preptest="${s.key}">Try again</button>`}</div></div>`;
  }
  const q = qs[R.i], opts = prepOpts(q), pk = R.picked;
  return `<div class="cpd-run cpd-quiz"><div class="cpd-quiz-top"><span class="eyebrow">${ic("target")} ${esc(prepDay(s))}'s session · ${R.i + 1} of ${n}</span><div class="cpd-bar"><span style="width:${Math.round(100 * R.i / n)}%"></span></div></div>
    <small class="cpd-run-from">${esc(q.part)}</small>
    <h2 class="cpd-title prep-q">${esc(q.q)}</h2>
    <div class="cpd-quiz-opts">${opts.map((o, k) => `<button type="button" class="cpd-quiz-o prep-o${pk != null ? (o.ok ? " ok" : pk === k ? " no" : " dim") : ""}" data-prepopt="${k}"${pk != null ? " disabled" : ""}>${esc(o.t)}</button>`).join("")}</div>
    ${pk != null ? `<button type="button" class="btn primary big" data-prepnext>${R.i + 1 < n ? "Next" : "See result"}</button>` : `<div><button type="button" class="linkbtn" data-prepclose>Stop</button></div>`}</div>`;
}
function bindPrep() {
  const go = () => { render(); window.scrollTo(0, 0); };
  document.querySelectorAll("[data-preplearn]").forEach(b => b.onclick = () => { state.prepRun = null; state.prepLearn = { key: b.dataset.preplearn, i: 0 }; go(); });
  document.querySelectorAll("[data-preptest]").forEach(b => b.onclick = () => { state.prepLearn = null; state.prepRun = { key: b.dataset.preptest, i: 0, right: 0, res: [], picked: null }; go(); });
  document.querySelectorAll("[data-prepstep]").forEach(b => b.onclick = () => { state.prepLearn.i = +b.dataset.prepstep; go(); });
  document.querySelectorAll("[data-prepclose],[data-prepdone]").forEach(b => b.onclick = () => { state.prepLearn = null; state.prepRun = null; go(); });
  document.querySelectorAll("[data-prepopt]").forEach(b => b.onclick = () => {
    const R = state.prepRun; if (R.picked != null) return; const it = prepItem(R.key), q = prepQs(it.s)[R.i], ok = prepOpts(q)[+b.dataset.prepopt].ok;
    R.picked = +b.dataset.prepopt; R.res.push(ok); if (ok) R.right++; render(); });
  const nx = $("[data-prepnext]"); if (nx) nx.onclick = () => {
    const R = state.prepRun; R.i++; R.picked = null;
    const it = prepItem(R.key), n = prepQs(it.s).length;
    if (R.i >= n) { const prev = prepRec(R.key), pass = !!prev.learned_at && R.right >= Math.ceil(n * 0.7);
      cpdSave("prep_" + R.key, { ...prev, attempt_id:crypto.randomUUID(), first_score:prev.first_score??R.right, first_n:prev.first_n??n, feedback:prepQs(it.s).map((q,k)=>({section:q.part,question:q.q,correct:R.res[k],answer:q.a[0]})), kind: "prep", key: R.key, prog: it.s.prog, title: it.s.title, date: it.s.iso, score: R.right, n, pass: pass || !!prev.pass, best: Math.max(R.right, prev.best || 0), tries: (prev.tries || 0) + 1, at: new Date().toISOString() });
      if (pass) toast("Ready for " + prepDay(it.s).toLowerCase() + " ✓"); }
    go(); };
}

/* ---------- check in (coaches can check a player in at the pitch) ---------- */
function ciToday() {
  if (!state.cal || !Comms.isStaff()) return [];
  const from = today0(), to = addDays(from, 1), mine = ACCESS.admin && !(ACCESS.groups || []).length ? null : (ACCESS.groups || []), now = Date.now();
  const out = [];
  (state.cal.events || []).filter(e => e.kind !== "meeting" && e.group_id && (!mine || mine.includes(e.group_id))).forEach(e => occurrences(e, from, to).forEach(o => { if (o.end.getTime() + 3600e3 > now) out.push({ title: e.title, start: o.start, group_id: e.group_id }); }));
  return out.sort((a, b) => a.start - b.start);
}
document.addEventListener("click", e => { const b = e.target.closest("[data-ciopen]"); if (!b || b.closest("#ci-sheet")) return; e.preventDefault(); Comms.checkinSheet(b.dataset.cig, b.dataset.cit || null, true); });

/* ---------- head coach: which coaches are ready for their next session (prep result only) ---------- */
function prepReadyList() {
  const byProg = {};
  GROUPS.forEach(g => { (byProg[g.prog] = byProg[g.prog] || []).push(g); });
  return Object.keys(byProg).map(prog => { const l = PROGS[prog] && PROGS[prog].sessions; if (!l) return null; const i = nextIdx(l); if (i < 0) return null;
    const s = l[i], days = Math.round((s.dt - today0()) / 864e5); return days >= 0 && days <= 1 ? { s, groups: byProg[prog], days } : null; }).filter(Boolean).sort((a, b) => a.s.dt - b.s.dt);
}
async function loadPrepReady() {
  const keys = prepReadyList().map(x => x.s.key), sig = keys.join(",");
  if (!keys.length || state.prepReadySig === sig && Date.now() - (state.prepReadyAt || 0) < 60000) return;
  state.prepReadySig = sig; state.prepReadyAt = Date.now();
  const { data, error } = await window.B2B_SB.rpc("prep_readiness", { p_keys: keys });
  state.prepReady = error ? { error: error.message } : Object.fromEntries(keys.map(k => [k, Object.fromEntries((data || []).filter(r => r.key === k).map(r => [r.coach_id, r]))]));
  if (state.tab === "coaches" && state.coachSub === "prep" && !state.prepRun && !state.prepLearn) rerenderSoft();
}
function prepReadyHtml() {
  const list = prepReadyList(), R = state.prepReady;
  if (!list.length) return "";
  if (!R) { setTimeout(loadPrepReady); return `<section class="prep-ready"><h3 class="cpd-h">Coaches ready</h3><p class="muted" style="margin:0">Loading…</p></section>`; }
  if (R.error) return `<section class="prep-ready"><h3 class="cpd-h">Coaches ready</h3><p class="muted" style="margin:0">Couldn't load: ${esc(R.error)}</p></section>`;
  setTimeout(loadPrepReady);
  const people = Object.entries(state.profiles || {});
  const blocks = list.map(({ s, groups }) => {
    const gids = groups.map(g => g.id), coaches = people.filter(([id, p]) => (p.role === "coach" || p.role === "admin") && (p.groups || []).some(g => gids.includes(g))).sort((a, b) => (a[1].name || "").localeCompare(b[1].name || ""));
    if (!coaches.length) return "";
    const res = R[s.key] || {}, ready = coaches.filter(([id]) => res[id] && res[id].pass).length;
    return `<div class="pr-block"><div class="pr-head"><div><b>${esc(prepDay(s))}${Math.round((s.dt - today0()) / 864e5) > 1 ? ` · ${esc(s.dt.toLocaleDateString("en-GB", { day: "numeric", month: "short" }))}` : ""}</b><small>${esc(groups.map(g => g.long).join(" · "))}</small></div><span class="pill ${ready === coaches.length ? "cpd-ok" : "cpd-late"}">${ready}/${coaches.length} ready</span></div>
      ${coaches.map(([id, p]) => { const r = res[id];
        return `<div class="pr-row"><span class="pav sm r-${esc(p.role)}">${esc(String(p.name || "?").split(/\s+/).slice(0, 2).map(w => w[0] || "").join("").toUpperCase())}</span><span>${esc(p.name || "Coach")}</span>${r && r.pass ? `<span class="pr-ok">✓ Ready</span>` : r ? `<span class="pr-try">Tried · ${r.score}/${r.n}</span>` : `<span class="pr-no">Not yet</span>`}</div>`; }).join("")}</div>`; }).join("");
  return blocks ? `<section class="prep-ready"><h3 class="cpd-h">Coaches ready</h3>${blocks}</section>` : "";
}

/* ---------- tile layouts: Home and Session pages (less scrolling) ---------- */
function homeTiles() {
  const T = [], tile = (o) => `<${o.href ? `a href="${o.href}"` : `button type="button"`} class="ct ct-${o.k}${o.hot ? " hot" : ""}${o.wide ? " wide" : ""}"${o.attrs || ""}><span class="ct-ico" aria-hidden="true">${ic(o.ico)}</span>${o.n ? `<span class="ct-n">${o.n}</span>` : ""}<b>${esc(o.title)}</b><small>${o.line}</small></${o.href ? "a" : "button"}>`;
  const staff = Comms.isStaff();
  if (window.B2B_OPERATIONS.isDirector(ACCESS)) T.push({ k: "operations", ico: ACCESS.admin ? "chart" : "clipboard", title: ACCESS.admin ? "Director Dashboard" : "My operations", line: ACCESS.admin ? "Payments, attendance and academy overview" : "Check-ins, mileage and statements", href: "#operations" });
  // next session across my groups
  const nexts = GROUPS.map(g => { const l = PROGS[g.prog].sessions, i = nextIdx(l); return i >= 0 ? { g, s: l[i] } : null; }).filter(Boolean).sort((a, b) => a.s.dt - b.s.dt);
  const ns = nexts.find(x => x.g.id === state.team) && +nexts.find(x => x.g.id === state.team).s.dt === +nexts[0].s.dt ? nexts.find(x => x.g.id === state.team) : nexts[0];
  if (ns) T.push({ k: "next", wide: true, hot: true, ico: "ball", title: `${prepDay(ns.s)} · ${ns.g.long}`, line: esc(ns.s.title), attrs: ` data-pick="${esc(ns.g.id)}"` });
  if (staff && CPD) {
    const due = prepDue(), todo = due.filter(x => !prepRec(x.s.key).pass);
    if (due.length) T.push({ k: "prep", hot: !!todo.length, n: todo.length, ico: "target", title: "Prep", line: todo.length ? `${todo.length} session${todo.length > 1 ? "s" : ""} to learn` : "Ready ✓", href: "#prep" });
  }
  const ciT = typeof ciToday === "function" ? ciToday() : [];
  if (ciT.length) { if (!state.cin) setTimeout(loadCin); const done = ciT.some(x => ((state.cin && state.cin.rows) || []).some(r => r.coach_id === ACCESS.uid && r.event_id === (todaySessions(null).find(s => +s.start === +x.start && s.e.group_id === x.group_id) || { e: {} }).e.id));
    T.push({ k: "ci", hot: !done, ico: "pin", title: "Check in", line: done ? "✓ You're checked in · players" : "I'm here + check players in", href: "#checkin" }); }
  const openCov = state.cal ? (state.cal.covers || []).filter(x => x.status === "open" && x.needed_for !== ACCESS.uid).length : 0;
  if (openCov) T.push({ k: "cover", hot: true, n: openCov, ico: "swap", title: "Cover", line: `${openCov} session${openCov > 1 ? "s" : ""} need${openCov > 1 ? "" : "s"} a coach`, href: "#cover" });
  const pend = ACCESS.admin && state.cal ? (state.cal.holidays || []).filter(h => h.status === "pending").length : 0;
  if (pend) T.push({ k: "admin", hot: true, n: pend, ico: "check", title: "Approve", line: `${pend} time-off request${pend > 1 ? "s" : ""}`, href: "#approvals" });
  if (staff && (ACCESS.groups || []).length) {
    const list = weekAhead(ACCESS.uid, ACCESS.groups);
    if (list.length) { Comms.loadRsvps(list.map(x => x.key));
      const mine = k => ((Comms.st.rsvp[k] || []).find(r => r.user_id === ACCESS.uid) || {}).status, left = list.filter(x => !x.cover && !mine(x.key)).length;
      T.push({ k: "week", hot: !!left, n: left, ico: "calendar", title: "Your week", line: left ? `${left} to confirm` : `${list.length} session${list.length > 1 ? "s" : ""} · all confirmed`, attrs: ` data-hwk aria-expanded="${!!state.homeWeek}"` }); }
  }
  if (staff && CPD) {
    const nx = cpdStartStage() ? cpdNext() : null, rc = cpdStartStage() ? cpdDue().length : 0;
    T.push({ k: "dev", ico: "cap", title: "Develop", line: !cpdStartStage() ? "Start your pathway" : rc ? `${Math.min(rc, 5)} to recall` : nx ? esc(cpdStep(nx).title) : "Pathway complete", href: "#develop" });
  }
  const un = Comms.unreadCount();
  T.push({ k: "chat", hot: !!un, n: un, ico: "chat", title: "Chat", line: un ? `${un} group${un > 1 ? "s" : ""} with new messages` : "Group chats", href: "#chat" });
  const top = (Comms.st.ann || [])[0];
  T.push({ k: "news", ico: "megaphone", title: "News", line: top ? esc(top.title) : "Club news", href: "#news" });
  const wide = T.filter(t => t.wide), rest = T.filter(t => !t.wide).sort((a, b) => (b.hot ? 1 : 0) - (a.hot ? 1 : 0));
  return `<div class="ct-grid home-grid">${wide.concat(rest).map(tile).join("")}</div>${state.homeWeek ? weekAheadCard() : ""}`;
}
function groupScroller() {
  const t = today0();
  return `<div class="sec2"><h2>Your groups</h2></div><div class="gscroll">${PROG_ORDER.map(p => GROUPS.filter(g => g.prog === p).map(g => { const l = PROGS[g.prog].sessions, i = nextIdx(l), s = i >= 0 ? l[i] : null;
    return `<button type="button" class="gcard${g.id === state.team ? " on" : ""}" data-pick="${esc(g.id)}"><b>${esc(g.short)}</b><small>${esc(g.long.replace(g.short, "").trim() || PROGS[g.prog].short)}</small>${s ? `<em class="${+s.dt === +t ? "today" : ""}">${+s.dt === +t ? "Today" : esc(s.date)}</em>` : ""}</button>`; }).join("")).join("")}</div>`;
}
document.addEventListener("click", e => { const b = e.target.closest("[data-hwk]"); if (!b) return; state.homeWeek = !state.homeWeek; render(); if (state.homeWeek) setTimeout(() => { const w = document.querySelector(".week-ahead"); if (w) w.scrollIntoView({ behavior: "smooth", block: "nearest" }); }, 50); });

/* Session page as tiles */
function todayView() {
  const list = P().sessions, ni = nextIdx(list), g = grp();
  if (ni === -1) return `<section class="view"><div class="hero"><div class="when">Season complete</div><h1>That's a wrap on 2026–27</h1><p>All 48 sessions are done. The syllabus and log stay here for the review.</p></div></section>`;
  const s = list[ni], isToday = +s.dt === +today0(), days = Math.round((s.dt - today0()) / 864e5);
  const done = loggedSet(state.team).size, last = ni > 0 ? list[ni - 1] : null, lastLogged = last && loggedSet(state.team).has(last.key);
  const mins = s.plan.reduce((a, p) => a + p.mins, 0), open = state.todayOpen || "";
  const tile = (k, ico, title, line, hot) => `<button type="button" class="ct ct-${k}${hot ? " hot" : ""}${open === k ? " sel" : ""}" data-topen="${k}" aria-expanded="${open === k}"><span class="ct-ico" aria-hidden="true">${ic(ico)}</span><b>${esc(title)}</b><small>${line}</small></button>`;
  const panel = {
    group: `<div class="card box tpanel"><h2>${esc(g.long)} this week <span class="muted" style="font-weight:600">· ${esc(g.fmt)}</span></h2><div>${adaptHtml(s, g.id)}</div>${s.low ? `<p style="margin:0"><b>Low numbers:</b> ${esc(s.low)}</p>` : ""}</div>`,
    home: `<div class="card box tpanel"><div class="eyebrow">${homeLabel(s)}</div><p style="margin:0">${esc(s.home)}</p></div>`,
    last: last ? `<div class="card box tpanel"><p style="margin:0"><button type="button" class="linkbtn" data-open="${last.key}">${esc(last.date)} · ${esc(last.title)}</button></p>${lastLogged ? `<p class="muted" style="margin:0">Logged for ${esc(g.long)}.</p>` : `<div><button class="btn small" data-logfor="${last.key}">Log it now</button></div>`}</div>` : "",
    season: `<div class="card box tpanel"><div style="display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap"><b>Season so far</b><span class="muted">${done} of 48 logged</span></div>${seasonBar()}</div>`,
  };
  return `<section class="view">
    <div class="hero">
      <div class="when">${isToday ? "Today" : days === 1 ? "Tomorrow" : "Next " + s.dt.toLocaleDateString("en-GB", { weekday: "long" }) + " · in " + days + " days"} · ${esc(s.long)}</div>
      <div class="eyebrow" style="color:var(--on-bar);opacity:.7">${P().short} · Block ${BLOCK_WORD[s.block]} · Week ${s.week} of 8 · ${mins} min</div>
      <h1>${esc(s.title)}</h1>
      <p class="hero-obj">${ic("target")} ${esc(s.objective)}</p>
      <div class="tags">${tagRow(s)}</div>
      <div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn primary" data-open="${s.key}">Open session plan</button><button class="btn" id="coach-hero">▶ Coach mode</button>${state.dlOk ? `<button class="btn" style="border-color:var(--lime);color:var(--lime)" id="dl-hero">Download PDF</button>` : ""}</div>
    </div>
    ${Comms.spotlightHtml({})}
    <div class="ct-grid t-grid">
      ${tile("group", "users", g.short + " this week", esc(g.fmt) + " · what's different", false)}
      ${tile("home", "home", "Home challenge", esc(String(s.home || "").slice(0, 60)) + (String(s.home || "").length > 60 ? "…" : ""), false)}
      ${last ? tile("last", lastLogged ? "check" : "note", "Last session", lastLogged ? "Logged" : "Not logged yet", !lastLogged) : ""}
      ${tile("season", "chart", "Season", `${done} of 48 logged`, false)}
    </div>
    ${open && panel[open] ? panel[open] : ""}
  </section>`;
}
document.addEventListener("click", e => { const b = e.target.closest("[data-topen]"); if (!b) return; state.todayOpen = state.todayOpen === b.dataset.topen ? "" : b.dataset.topen; render(); if (state.todayOpen) setTimeout(() => { const p = document.querySelector(".tpanel"); if (p) p.scrollIntoView({ behavior: "smooth", block: "nearest" }); }, 50); });

/* ---------- coach check-in with location (head coach sees who's at the venue) ---------- */
const VENUE_KEYS = [["fowlers", /fowlers/i], ["silverdale", /silverdale/i], ["tactica", /tactica|darlaston/i], ["pelsall", /pelsall/i], ["hawkins", /hawkins/i]];
const venueKey = loc => { const v = VENUE_KEYS.find(([, re]) => re.test(loc || "")); return v ? v[0] : ""; };
function metres(a, b, c, d) { const R = 6371000, r = x => x * Math.PI / 180, dl = r(c - a), dn = r(d - b), h = Math.sin(dl / 2) ** 2 + Math.cos(r(a)) * Math.cos(r(c)) * Math.sin(dn / 2) ** 2; return Math.round(2 * R * Math.asin(Math.sqrt(h))); }
const kmTxt = m => m < 1000 ? `${m} m` : `${(m / 1000).toFixed(1)} km`;
state.cin = state.cin || null;
async function loadCin(force) {
  const sb = window.B2B_SB; if (!sb || (!force && state.cin && Date.now() - state.cin.t < 30000)) return;
  const day = isoOf(today0());
  const [c, v] = await Promise.all([sb.from("coach_checkins").select("*").eq("session_date", day), sb.from("venues").select("*")]);
  state.cin = { t: Date.now(), rows: c.error ? [] : (c.data || []), venues: v.error ? [] : (v.data || []), err: c.error && c.error.message };
  if (state.tab === "coaches" || state.tab === "home") rerenderSoft();
}
function todaySessions(groups) {
  const from = today0(), to = addDays(from, 1), out = [];
  ((state.cal && state.cal.events) || []).filter(e => e.kind !== "meeting" && e.group_id && (!groups || groups.includes(e.group_id))).forEach(e => occurrences(e, from, to).forEach(o => out.push({ e, start: o.start, end: o.end })));
  return out.sort((a, b) => a.start - b.start);
}
function myCin(x) { return ((state.cin && state.cin.rows) || []).find(r => r.coach_id === ACCESS.uid && r.event_id === x.e.id); }
function cinBadge(r, venueName) {
  if (!r) return `<span class="cin-b no">Not checked in</span>`;
  const t = new Date(r.at).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  const map = r.lat != null ? ` <a class="cin-map" href="https://www.google.com/maps/search/?api=1&query=${r.lat},${r.lng}" target="_blank" rel="noopener">Map</a>` : "";
  if (r.status === "at") return `<span class="cin-b ok">✓ ${t} · at ${esc(venueName || "venue")}</span>${map}`;
  if (r.status === "away") return `<span class="cin-b away">${ic("alert")} ${t} · ${kmTxt(r.distance_m)} from ${esc(venueName || "venue")}</span>${map}`;
  if (r.status === "unknown") return `<span class="cin-b ok2">✓ ${t} · venue spot not set</span>${map}`;
  return `<span class="cin-b away">✓ ${t} · location off</span>`;
}
function checkinHubView() {
  if (!state.cin) setTimeout(loadCin); else setTimeout(() => loadCin());
  const V = Object.fromEntries(((state.cin && state.cin.venues) || []).map(v => [v.key, v]));
  const mine = (ACCESS.groups || []).length ? todaySessions(ACCESS.groups) : [], now = Date.now();
  const card = x => { const r = myCin(x), vk = venueKey(x.e.location), v = V[vk], open = now >= x.start.getTime() - 90 * 60e3 && now <= x.end.getTime();
    return `<article class="cin-card${r ? " done" : ""}"><div class="cin-top"><b>${esc(x.e.title)}</b><small>${esc(fmtTime(x.start))}–${esc(fmtTime(x.end))}${x.e.location ? ` · ${esc(v ? v.name : x.e.location)}` : ""}</small></div>
      ${r ? `<div>${cinBadge(r, v && v.name)}</div>` : ""}
      ${!r && open ? `<button type="button" class="btn primary big" data-cin="${esc(x.e.id)}">${ic("pin")} I'm here</button>` : !r ? `<p class="muted" style="margin:0;font-size:13px">Opens 90 minutes before the start.</p>` : ""}
      </article>`; };
  let adminHtml = "";
  if (ACCESS.admin) {
    const all = todaySessions(null), hol = ((state.cal && state.cal.holidays) || []).filter(h => h.status === "approved" && h.start_date <= isoOf(today0()) && h.end_date >= isoOf(today0())).map(h => h.coach_id);
    const people = Object.entries(state.profiles || {});
    const rows = all.map(x => { const vk = venueKey(x.e.location), v = V[vk];
      const coaches = people.filter(([id, p]) => (p.role === "coach" || p.role === "admin") && (p.groups || []).includes(x.e.group_id) && !hol.includes(id));
      const cins = ((state.cin && state.cin.rows) || []).filter(r => r.event_id === x.e.id), ids = new Set(coaches.map(c => c[0]).concat(cins.map(r => r.coach_id)));
      const nIn = cins.length;
      return `<div class="pr-block"><div class="pr-head"><div><b>${esc(fmtTime(x.start))} · ${esc(x.e.title)}</b><small>${esc(v ? v.name : (x.e.location || "No venue set"))}</small></div><span class="pill ${nIn >= ids.size && ids.size ? "cpd-ok" : "cpd-late"}">${nIn}/${ids.size} in</span></div>
        ${[...ids].map(id => { const p = (state.profiles || {})[id] || { name: "Coach", role: "coach" }, r = cins.find(c => c.coach_id === id);
          return `<div class="pr-row cin-row"><span class="pav sm r-${esc(p.role)}">${esc(String(p.name || "?").split(/\s+/).slice(0, 2).map(w => w[0] || "").join("").toUpperCase())}</span><span class="cin-who"><b>${esc(p.name || "Coach")}</b><span>${cinBadge(r, v && v.name)}</span></span></div>`; }).join("") || `<p class="muted" style="margin:0;padding:10px 14px">No coaches on this group.</p>`}</div>`; }).join("");
    const venues = ((state.cin && state.cin.venues) || []).map(v => `<div class="cin-ven"><div><b>${esc(v.name)}</b><small>${v.lat == null ? "Not set" : v.approx ? `Approximate (postcode) · within ${kmTxt(v.radius_m)}` : `Set at the pitch · within ${kmTxt(v.radius_m)}`}</small></div><button type="button" class="btn small" data-venset="${esc(v.key)}">${ic("pin")} Set to where I am</button></div>`).join("");
    adminHtml = `<section class="prep-ready"><h3 class="cpd-h">Coaches at today's sessions</h3>${rows || `<p class="muted" style="margin:0">No sessions in the timetable today.</p>`}</section>
      <details class="card cin-venues"><summary><b>Venue spots</b><small>Stand on the pitch and tap Set, so check-ins are measured from the right place.</small></summary>${venues}</details>`;
  }
  return `<section class="view"><div id="coach-gps-root"></div>${adminHtml}</section>`;
}
window.B2B_GPS_SAVED=()=>{state.cin=null;loadCin(true);calLoad(true)};
function getPos() { return new Promise(res => { if (!navigator.geolocation) return res(null); navigator.geolocation.getCurrentPosition(p => res(p.coords), () => res(null), { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }); }); }
async function coachCheckin(eventId, btn) {
  const x = todaySessions(null).find(s => s.e.id === eventId); if (!x) return;
  btn.disabled = true; btn.textContent = "Finding your location…";
  const c = await getPos(), V = Object.fromEntries(((state.cin && state.cin.venues) || []).map(v => [v.key, v])), vk = venueKey(x.e.location), v = V[vk];
  let status = "nolocation", dist = null;
  if (c) { if (v && v.lat != null) { dist = metres(c.latitude, c.longitude, v.lat, v.lng); status = dist <= v.radius_m + Math.min(c.accuracy || 0, 300) ? "at" : "away"; } else status = "unknown"; }
  const row = { coach_id: ACCESS.uid, event_id: x.e.id, session_date: isoOf(today0()), group_id: x.e.group_id, title: x.e.title, venue: vk || x.e.location || null, at: new Date().toISOString(),
    lat: c ? +c.latitude.toFixed(5) : null, lng: c ? +c.longitude.toFixed(5) : null, accuracy_m: c ? Math.round(c.accuracy) : null, distance_m: dist, status };
  const { error } = await window.B2B_SB.from("coach_checkins").upsert(row, { onConflict: "coach_id,event_id,session_date" });
  if (error) { btn.disabled = false; btn.innerHTML = ic("pin") + " I'm here"; return toast("Couldn't check in: " + error.message); }
  toast(status === "at" ? "✓ Checked in at the venue" : status === "away" ? `Checked in · ${kmTxt(dist)} from the venue` : status === "nolocation" ? "Checked in · location was off" : "✓ Checked in");
  await loadCin(true); render();
}
async function setVenueHere(key, btn) {
  btn.disabled = true; btn.textContent = "Finding you…";
  const c = await getPos(); if (!c) { btn.disabled = false; btn.innerHTML = ic("pin") + " Set to where I am"; return toast("Couldn't get your location. Allow location for this app."); }
  const { error } = await window.B2B_SB.from("venues").update({ lat: +c.latitude.toFixed(5), lng: +c.longitude.toFixed(5), approx: false, radius_m: 400, updated_at: new Date().toISOString() }).eq("key", key);
  if (error) { btn.disabled = false; return toast("Couldn't save: " + error.message); }
  toast("Venue spot saved"); await loadCin(true); render();
}
document.addEventListener("click", e => {
  const b = e.target.closest("[data-cin]"); if (b) { coachCheckin(b.dataset.cin, b); return; }
  const v = e.target.closest("[data-venset]"); if (v) { Comms.yes("Set this venue here?", "Uses where you're standing now. Do this on the pitch.", "Set venue", false).then(ok => { if (ok) setVenueHere(v.dataset.venset, v); }); }
});

/* passports: load for check-in chips and the squad tab */
if (Comms.isStaff()) setTimeout(() => Comms.loadPlayers(), 1500);

/* ---------- Match tab: lead coach builds the team sheet and tactics; the team sees it once published ---------- */
state.mp = null;
const mpKey = (e, start) => String(e.id).startsWith("fx:") ? e.id : `${e.id}:${isoOf(start)}`;
const isLead = gid => ACCESS.admin || ((ACCESS.groups || []).includes(gid) && ((Comms.st.leads || []).some(l => l.group_id === gid && l.coach_id === ACCESS.uid) || (Comms.st.leads !== null && !(Comms.st.leads || []).some(l => l.group_id === gid))));
function teamMatches(gid) {
  const from = addDays(today0(), -1), to = addDays(today0(), 22), out = [];
  ((state.cal && state.cal.events) || []).filter(e => e.kind === "match" && e.group_id === gid).forEach(e => occurrences(e, from, to).forEach(o => { if (o.end > new Date(Date.now() - 3 * 3600e3)) out.push({ e, start: o.start, key: mpKey(e, o.start) }); }));
  return out.sort((a, b) => a.start - b.start);
}
function allTeamMatches(gid) {
  const from = addDays(today0(), -70), to = addDays(today0(), 90), out = [];
  ((state.cal && state.cal.events) || []).filter(e => e.kind === "match" && e.group_id === gid).forEach(e => occurrences(e, from, to).forEach(o => out.push({ e, start: o.start, key: mpKey(e, o.start) })));
  return out.sort((a, b) => a.start - b.start);
}
function matchTabView(gid) {
  if (!Comms.st.plans) setTimeout(() => Comms.loadPlans()); if (!Comms.st.leads) setTimeout(() => Comms.loadLeads());
  const leads = (Comms.st.leads || []).filter(l => l.group_id === gid).map(l => personName(l.coach_id)), lead = isLead(gid);
  if (state.mp && state.mp.gid === gid) return lead ? matchEditor(gid) : `<div class="chat-head"><button type="button" class="chat-back" data-mpclose aria-label="Back"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg></button><div><small>Match</small><b>${esc(state.mp.d.title || "")}</b></div></div>${Comms.planView(state.mp.d)}`;
  const kids = (Comms.st.players || []).filter(p => (p.groups || []).includes(gid));
  return `<div class="mp-leads">${ic("star")} Lead coach: <b>${leads.length ? esc(leads.join(", ")) : "not set"}</b>${!leads.length ? ` · <span class="muted">any coach of this team can do the team sheet</span>` : ""}</div>
    ${Comms.matchRoomView(gid, { events: allTeamMatches(gid), coach: true, lead, kids, squad: teamMembers(gid).filter(m => m.role === "parent" || m.role === "player").length })}`;
}
function matchEditor(gid) {
  const D = state.mp.d, side = Comms.SIDE[gid], forms = Comms.FORMS[side] || [], slots = Comms.slotsFor(D.formation), T = D.tactics || {}, keys = D.keys || [];
  return `<div class="chat-head"><button type="button" class="chat-back" data-mpclose aria-label="Back"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg></button><div><small>${esc(Comms.planWhen(D))}</small><b>${esc(D.title || "Match")}</b></div>${D.published ? `<span class="pill cpd-ok">Published</span>` : `<span class="pill">Draft</span>`}</div>
    <div class="mp-ed">
      <div class="field"><label for="mp-obj">${ic("target")} Main objective for the game</label><input id="mp-obj" maxlength="200" value="${esc(D.objective || "")}" placeholder="e.g. Win the ball back within 5 seconds"></div>
      <div class="mp-sec"><div class="mp-sech"><h3 class="cpd-h">Team sheet</h3><select id="mp-form" aria-label="Formation">${[...new Set(forms.concat(teamForms(gid), D.formation ? [D.formation] : []))].map(f => `<option${f === D.formation ? " selected" : ""}>${esc(f)}</option>`).join("")}<option value="__custom">Custom formation…</option></select></div>
        <div class="mp-tools"><button type="button" class="chip" data-mpmove aria-pressed="${!!state.mpMove}">${ic("swap")} ${state.mpMove ? "Done moving" : "Move positions"}</button>${(D.lineup || []).some(p => p && (p.x != null || p.pos)) ? `<button type="button" class="linkbtn" data-mpreset>Reset positions</button>` : ""}</div>
        <div class="${state.mpMove ? "mp-moving" : ""}" id="mp-pitchwrap">${Comms.pitchHtml(D, { edit: true })}</div>
        <div class="mp-subs edit"><b>Subs</b>${(D.subs || []).map((p, i) => `<button type="button" class="chip" data-mpsubdel="${i}" title="Remove">${esc(Comms.shortName(p.name))} ×</button>`).join("")}<button type="button" class="chip" data-mpslot="sub">＋ Add sub</button></div>
        <p class="muted" style="margin:0;font-size:12px">${state.mpMove ? "Drag the shirts to where you want them. Tap Done moving when finished." : `Tap a position to type a name or rename the position. ${slots.length} on the pitch (${side}-a-side).`}</p></div>
      <div class="mp-sec"><h3 class="cpd-h">Key points</h3>${[0, 1, 2].map(i => `<input class="mp-key" data-mpk="${i}" maxlength="120" value="${esc(keys[i] || "")}" placeholder="${["e.g. Scan before you receive", "e.g. Full-backs push high", "e.g. Stay compact when we lose it"][i]}">`).join("")}</div>
      <div class="mp-sec"><h3 class="cpd-h">Tactics</h3>${[["with", "ball", "With the ball"], ["without", "shield", "Without the ball"], ["set", "flag", "Set pieces"]].map(([k, i, l]) => `<div class="field"><label for="mp-t-${k}">${ic(i)} ${l}</label><textarea id="mp-t-${k}" rows="2" maxlength="400">${esc(T[k] || "")}</textarea></div>`).join("")}</div>
      <label class="ci-ready"><input type="checkbox" id="mp-news" ${D.published ? "" : "checked"}><span>Tell the team in News when I publish</span></label>
      <div class="mp-actions"><button type="button" class="btn" data-mpsave="0">Save draft</button><button type="button" class="btn primary" data-mpsave="1">${D.published ? "Update" : "Publish to team"}</button></div>
      ${D.published ? `<div><button type="button" class="linkbtn" data-mpsave="unpub">Hide from players</button></div>` : ""}
      <p class="ci-msg muted" id="mp-msg" aria-live="polite"></p>
    </div>`;
}
function mpCollect() {
  const D = state.mp.d, v = id => ($("#" + id) || {}).value;
  D.objective = (v("mp-obj") || "").trim(); D.keys = [...document.querySelectorAll(".mp-key")].map(i => i.value.trim()).filter(Boolean);
  D.tactics = { with: (v("mp-t-with") || "").trim(), without: (v("mp-t-without") || "").trim(), set: (v("mp-t-set") || "").trim() };
}
function teamForms(gid) { const side = Comms.SIDE[gid], std = Comms.FORMS[side] || []; return [...new Set((Comms.st.plans || []).filter(p => p.group_id === gid && p.formation && !std.includes(p.formation)).map(p => p.formation))]; }
function teamNames(gid) {
  const pps = (Comms.st.players || []).filter(p => (p.groups || []).includes(gid)).map(p => ({ name: p.name, player_id: p.id }));
  const sq = (state.squads || []).filter(x => x.group === gid).map(x => ({ name: x.name, squad_id: x.id }));
  const used = (Comms.st.plans || []).filter(p => p.group_id === gid).flatMap(p => (p.lineup || []).concat(p.subs || [])).filter(p => p && p.name).map(p => ({ name: p.name, player_id: p.player_id }));
  const out = []; pps.concat(sq, used).forEach(p => { if (!out.some(x => x.name.toLowerCase() === p.name.toLowerCase())) out.push(p); });
  return out.sort((a, b) => a.name.localeCompare(b.name));
}
function mpPicker(gid, slot) {
  const D = state.mp.d, isSub = slot === "sub", cur = isSub ? {} : (D.lineup || [])[+slot] || {}, base = isSub ? null : Comms.slotsFor(D.formation)[+slot];
  const used = new Set((D.lineup || []).concat(D.subs || []).filter(p => p && p.name).map(p => p.name.toLowerCase()));
  const all = teamNames(gid);
  const el = document.createElement("div"); el.className = "ci-sheet"; el.id = "mp-pick";
  el.innerHTML = `<div class="ci-back" data-pclose></div><form class="ci-panel" id="mp-slotform"><div class="ci-grab"></div><h2>${isSub ? "Add a sub" : esc(cur.pos || base.pos)}</h2>
    ${isSub ? "" : `<div class="field"><label for="mp-pos">Position name</label><input id="mp-pos" maxlength="6" value="${esc(cur.pos || base.pos)}" placeholder="${esc(base.pos)}" autocapitalize="characters" style="text-transform:uppercase"></div>`}
    <div class="field"><label for="mp-freein">Player name</label><input id="mp-freein" maxlength="40" value="${esc(cur.name || "")}" placeholder="Type any name" autocomplete="off"></div>
    ${all.length ? `<div class="mp-plist">${all.map((p, i) => `<button type="button" class="mp-pbtn${used.has(p.name.toLowerCase()) ? " used" : ""}" data-pi="${i}">${esc(p.name)}${used.has(p.name.toLowerCase()) ? " <small>picked</small>" : ""}</button>`).join("")}</div>` : ""}
    <button class="btn primary big" type="submit">Save</button>
    ${!isSub && (cur.name || cur.pos) ? `<button type="button" class="btn" data-pclear>Clear name</button>` : ""}</form>`;
  document.body.appendChild(el); document.body.classList.add("ci-open");
  const close = () => { el.remove(); document.body.classList.remove("ci-open"); };
  let chosen = null;
  const put = () => { mpCollect(); D.lineup = D.lineup || [];
    const name = el.querySelector("#mp-freein").value.trim(), posIn = el.querySelector("#mp-pos"), pos = posIn ? posIn.value.trim().toUpperCase().slice(0, 6) : "";
    const link = chosen && chosen.name.toLowerCase() === name.toLowerCase() ? chosen : (all.find(p => p.name.toLowerCase() === name.toLowerCase()) || {});
    const p = name ? { name, ...(link.player_id ? { player_id: link.player_id } : {}), ...(link.squad_id ? { squad_id: link.squad_id } : {}) } : {};
    if (isSub) { if (name) { D.subs = (D.subs || []).filter(x => x.name.toLowerCase() !== name.toLowerCase()).concat([p]); D.lineup = D.lineup.map(x => x && x.name && x.name.toLowerCase() === name.toLowerCase() ? { pos: x.pos, x: x.x, y: x.y } : x); } }
    else { if (name) { D.lineup = D.lineup.map((x, i) => i !== +slot && x && x.name && x.name.toLowerCase() === name.toLowerCase() ? { pos: x.pos, x: x.x, y: x.y } : x); D.subs = (D.subs || []).filter(x => x.name.toLowerCase() !== name.toLowerCase()); }
      const keep = { x: cur.x, y: cur.y }; D.lineup[+slot] = Object.assign({}, p, pos && pos !== base.pos ? { pos } : {}, keep.x != null ? keep : {}); for (let i = 0; i < +slot; i++) if (!D.lineup[i]) D.lineup[i] = {}; }
    close(); render(); };
  el.querySelectorAll("[data-pclose]").forEach(b => b.onclick = close);
  el.querySelectorAll("[data-pi]").forEach(b => b.onclick = () => { chosen = all[+b.dataset.pi]; el.querySelector("#mp-freein").value = chosen.name; put(); });
  const pc = el.querySelector("[data-pclear]"); if (pc) pc.onclick = () => { mpCollect(); D.lineup[+slot] = { pos: cur.pos, x: cur.x, y: cur.y }; close(); render(); };
  el.querySelector("#mp-slotform").onsubmit = e => { e.preventDefault(); put(); };
  setTimeout(() => { const i = el.querySelector("#mp-freein"); if (i && !cur.name) i.focus(); }, 60);
}
function bindMovePitch(m) {
  const wrap = m.querySelector("#mp-pitchwrap"); if (!wrap || !state.mpMove) return;
  const pitch = wrap.querySelector(".mp-pitch"), D = state.mp.d;
  wrap.querySelectorAll("[data-mpslot]").forEach(b => {
    b.onclick = e => e.preventDefault();
    b.onpointerdown = e => { e.preventDefault(); b.setPointerCapture(e.pointerId); const i = +b.dataset.mpslot, r = pitch.getBoundingClientRect(); b.classList.add("drag");
      const mv = ev => { const x = Math.max(4, Math.min(96, (ev.clientX - r.left) * 100 / r.width)), y = Math.max(4, Math.min(96, (ev.clientY - r.top) * 100 / r.height)); b.style.left = x + "%"; b.style.top = y + "%"; b.dataset.nx = Math.round(x); b.dataset.ny = Math.round(y); };
      const up = () => { b.removeEventListener("pointermove", mv); b.removeEventListener("pointerup", up); b.classList.remove("drag");
        if (b.dataset.nx) { D.lineup = D.lineup || []; for (let k = 0; k <= i; k++) if (!D.lineup[k]) D.lineup[k] = {}; D.lineup[i] = Object.assign({}, D.lineup[i], { x: +b.dataset.nx, y: +b.dataset.ny }); } };
      b.addEventListener("pointermove", mv); b.addEventListener("pointerup", up); };
  });
}
async function mpSave(gid, mode) {
  mpCollect(); const D = state.mp.d, msg = $("#mp-msg");
  const publish = mode === "1" ? true : mode === "unpub" ? false : D.published;
  if (mode === "1" && !D.objective) { msg.textContent = "Add the main objective before publishing."; msg.className = "ci-msg bad"; return; }
  const row = { group_id: gid, match_key: D.match_key, title: D.title, kickoff: D.kickoff, venue: D.venue, formation: D.formation, lineup: D.lineup || [], subs: D.subs || [], objective: D.objective || null, keys: D.keys || [], tactics: D.tactics || {}, published: publish, updated_by: ACCESS.uid, updated_by_name: ACCESS.name, updated_at: new Date().toISOString() };
  msg.textContent = "Saving…"; msg.className = "ci-msg muted";
  const { error } = await window.B2B_SB.from("match_plans").upsert(row, { onConflict: "group_id,match_key" });
  if (error) { msg.textContent = "Couldn't save: " + error.message; msg.className = "ci-msg bad"; return; }
  const tell = mode === "1" && !D.published && $("#mp-news") && $("#mp-news").checked;
  D.published = publish;
  if (tell) { const id = crypto.randomUUID ? crypto.randomUUID() : String(Date.now());
    const { error: e2 } = await window.B2B_SB.from("announcements").insert({ id, title: `Team sheet: ${D.title}`, body: `Objective: ${D.objective}\n\nThe team sheet and tactics are in the app. ${Comms.planWhen(D)}.`, group_ids: [gid], author_id: ACCESS.uid });
    if (!e2) Comms.notify("announcement", id); }
  toast(mode === "1" ? "Published to the team" : mode === "unpub" ? "Hidden from players" : "Draft saved");
  await Comms.loadPlans(true); render();
}
function bindMatch(m) {
  const gid = state.team;
  m.querySelectorAll("[data-mstat]").forEach(b => b.onclick = () => { const x = allTeamMatches(gid).find(t => t.key === b.dataset.mstat); if (x) Comms.statsSheet(gid, x, (Comms.st.players || []).filter(p => (p.groups || []).includes(gid)), true); });
  m.querySelectorAll("[data-mpopen]").forEach(b => b.onclick = () => { const x = allTeamMatches(gid).find(t => t.key === b.dataset.mpopen); if (!x) return;
    const p = (Comms.st.plans || []).find(pl => pl.group_id === gid && pl.match_key === x.key), side = Comms.SIDE[gid];
    if (!p && !isLead(gid)) return toast("No plan for this match yet.");
    const last = !p && (Comms.st.plans || []).filter(pl => pl.group_id === gid).sort((a, b) => String(b.kickoff).localeCompare(String(a.kickoff)))[0];
    state.mpMove = false;
    state.mp = { gid, d: p ? JSON.parse(JSON.stringify(p)) : { group_id: gid, match_key: x.key, title: x.e.title, kickoff: x.start.toISOString(), venue: x.e.location || "", formation: last ? last.formation : gid === "U13" ? "4-1-2-1" : (Comms.FORMS[side] || [])[0], lineup: last ? JSON.parse(JSON.stringify(last.lineup || [])) : [], subs: last ? JSON.parse(JSON.stringify(last.subs || [])) : [], keys: [], tactics: {}, published: false } };
    if (last) toast("Started from your last team sheet. Change anything you like.");
    render(); window.scrollTo(0, 0); });
  m.querySelectorAll("[data-mpclose]").forEach(b => b.onclick = () => { state.mp = null; render(); window.scrollTo(0, 0); });
  const mvb = m.querySelector("[data-mpmove]"); if (mvb) mvb.onclick = () => { mpCollect(); state.mpMove = !state.mpMove; render(); };
  const rsb = m.querySelector("[data-mpreset]"); if (rsb) rsb.onclick = () => { mpCollect(); state.mp.d.lineup = (state.mp.d.lineup || []).map(p => { const q = Object.assign({}, p); delete q.x; delete q.y; delete q.pos; return q; }); render(); };
  bindMovePitch(m);
  const fm = $("#mp-form"); if (fm) fm.onchange = async () => { mpCollect(); let nf = fm.value;
    if (nf === "__custom") { const want = Comms.SIDE[gid] - 1;
      const f = await Comms.ask({ title: "Custom formation", text: `From the back, numbers with dashes. ${want} outfield players.`, label: "Formation", placeholder: want === 6 ? "e.g. 2-3-1" : want === 8 ? "e.g. 3-2-3" : "e.g. 4-3-3", max: 15, ok: "Use formation", danger: false });
      nf = String(f || "").trim().replace(/[^0-9]+/g, "-").replace(/^-|-$/g, ""); const total = nf ? nf.split("-").reduce((x, n) => x + +n, 0) : 0;
      if (!nf || nf.split("-").some(n => +n < 1 || +n > 6) || (total !== want && !(await Comms.yes("Use it anyway?", `That's ${total} outfield players, not ${want}.`, "Use it", false)))) { render(); return; } }
    const old = (state.mp.d.lineup || []).map(p => { const q = Object.assign({}, p); delete q.x; delete q.y; delete q.pos; return q; });
    state.mp.d.formation = nf; state.mpMove = false;
    const n = Comms.slotsFor(nf).length; state.mp.d.lineup = old.slice(0, n); state.mp.d.subs = (state.mp.d.subs || []).concat(old.slice(n).filter(p => p && p.name)); render(); };
  m.querySelectorAll("[data-mpslot]").forEach(b => b.onclick = e => { if (state.mpMove && b.dataset.mpslot !== "sub") { e.preventDefault(); return; } mpPicker(gid, b.dataset.mpslot); });
  m.querySelectorAll("[data-mpsubdel]").forEach(b => b.onclick = () => { mpCollect(); state.mp.d.subs.splice(+b.dataset.mpsubdel, 1); render(); });
  m.querySelectorAll("[data-mpsave]").forEach(b => b.onclick = () => mpSave(gid, b.dataset.mpsave));
}

/* ---------- boot ---------- */
(function(){const h=location.hash.slice(1);setTab(TABS.includes(h)?h:"home");renderTeams();render()})();
/* ---------- storage: on this phone, synced to Google Sheet when connected (standalone build) ---------- */
window._dl={save:async({filename,data})=>{
  const blob=new Blob([data],{type:filename.endsWith(".pdf")?"application/pdf":"text/csv"});
  try{const f=new File([blob],filename,{type:blob.type});
    if(navigator.canShare&&navigator.canShare({files:[f]})&&/iphone|ipad|ipod|android/i.test(navigator.userAgent)){await navigator.share({files:[f],title:filename});return {status:"saved"}}}catch(e){if(e&&e.name==="AbortError")throw {code:"declined"}}
  const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=filename;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},4000);return {status:"saved"};
}};
state.dlOk=true;
var SYNC_DEFAULT=null;
var KINDS=["logs","scores","squads","notes","feedback","cpd"];
var Local={
  cache:store.get("b2b.cache",null)||{}, queue:store.get("b2b.queue",[]), listeners:{},
  save(){store.set("b2b.cache",this.cache);store.set("b2b.queue",this.queue)},
  snap(kind){return {docs:Object.entries(this.cache[kind]||{}).map(([id,d])=>({id,data:()=>d}))}},
  emit(kind){(this.listeners[kind]||[]).forEach(cb=>{try{cb(this.snap(kind))}catch(e){}})},
  apply(op){const c=this.cache[op.kind]=this.cache[op.kind]||{};if(op.op==="delete")delete c[op.id];else c[op.id]=op.data},
  write(op){this.apply(op);this.queue.push(op);this.save();this.emit(op.kind);Sync.soon()}
};
const newId=()=>"x"+Date.now().toString(36)+Math.random().toString(36).slice(2,7);
window._db={collection:kind=>({
  add:async data=>{const id=newId();Local.write({op:"set",kind,id,data});return {id}},
  doc:id=>({set:async data=>Local.write({op:"set",kind,id,data}),delete:async()=>Local.write({op:"delete",kind,id})}),
  onSnapshot:cb=>{(Local.listeners[kind]=Local.listeners[kind]||[]).push(cb);setTimeout(()=>cb(Local.snap(kind)),0);return ()=>{}}
})};
var Sync={
  t:null,busy:false,last:store.get("b2b.lastSync",null),err:null,
  cfg(){return {supabase:true}}, on(){return true},
  soon(ms=1500){clearTimeout(this.t);this.t=setTimeout(()=>this.run(),ms)},
  async run(){
    const sb=window.B2B_SB; if(!sb||this.busy) return;
    if(!navigator.onLine){this.err="offline";renderSync();return}
    this.busy=true;renderSync();
    try{
      while(Local.queue.length){
        const op=Local.queue[0];
        let res;
        if(op.op==="delete") res=await sb.from("records").delete().eq("id",op.id);
        else{const d=op.data||{};res=await sb.from("records").upsert({id:op.id,kind:op.kind,group_id:d.group||d.team||null,data:d,updated_at:new Date().toISOString()})}
        if(res.error&&!/row-level security|42501|violates/i.test(res.error.message+" "+res.error.code))throw res.error;
        Local.queue.shift(); Local.save();
      }
      const fresh={};KINDS.forEach(k=>fresh[k]={});
      for(let from=0;;from+=1000){
        const {data,error}=await sb.from("records").select("id,kind,data").order("id").range(from,from+999);
        if(error)throw error;
        (data||[]).forEach(r=>{if(fresh[r.kind])fresh[r.kind][r.id]=r.data});
        if(!data||data.length<1000)break;
      }
      Local.cache=fresh; Local.queue.forEach(op=>Local.apply(op)); Local.save();
      this.last=new Date().toISOString(); store.set("b2b.lastSync",this.last); this.err=null;
      KINDS.forEach(k=>Local.emit(k));
    }catch(e){this.err=String(e&&e.message||e);if(/JWT|auth|401/i.test(this.err))this.err="Please sign out and sign in again"}
    this.busy=false; renderSync();
  }
};
(function migrate(){const old=store.get("b2b.logs",null);if(old&&old.length){old.forEach(l=>{const {id,...d}=l;Local.write({op:"set",kind:"logs",id,data:d})});store.set("b2b.logs",[])}})();
function syncText(){
  if(!window.Sync) return "";
  const q=Local.queue.length;
  if(Sync.busy) return "Syncing…";
  if(Sync.err==="offline") return q?`Offline · ${q} change${q>1?"s":""} will sync when you have signal`:"Offline · club copy from "+ago(Sync.last);
  if(Sync.err) return "Sync problem: "+Sync.err;
  return q?`${q} change${q>1?"s":""} waiting to sync`:"Saved to the club · synced "+ago(Sync.last);
}
function ago(iso){if(!iso)return "never";const m=Math.round((Date.now()-new Date(iso))/60000);return m<1?"just now":m<60?m+" min ago":m<1440?Math.round(m/60)+" h ago":new Date(iso).toLocaleDateString("en-GB")}
function renderSync(){if(!window.Sync)return;document.querySelectorAll(".syncline").forEach(el=>{el.textContent=syncText();el.classList.toggle("bad",!!Sync.err&&Sync.err!=="offline")})}
function syncCard(){
  return `<div class="card box" id="synccard">
    <p style="margin:0"><b>${esc(ACCESS.name||"Coach")}</b> <span class="muted">· ${esc(ACCESS.email||"")}${ACCESS.admin?" · Admin":""}</span></p>
    <p class="syncline muted" style="margin:0">${esc(syncText())}</p>
    <div class="actions"><button class="btn small" id="sync-now">Sync now</button>${ACCESS.admin?`<button class="btn small primary" id="acct-admin">People and access</button>`:""}<button class="btn small" id="acct-out">Sign out</button></div>
  </div>`;
}
function bindSyncCard(){
  const n=$("#sync-now"); if(n) n.onclick=()=>Sync.run();
  const o=$("#acct-out"); if(o) o.onclick=()=>{if(Local.queue.length&&!confirm("Some changes haven't synced yet and will be lost if you sign out. Sign out anyway?"))return;window.B2B_AUTH.signOut()};
  const ad=$("#acct-admin"); if(ad) ad.onclick=()=>window.B2B_AUTH.openAdmin();
}
state.dbOk=true; state.logsReady=true;
for(const [kind,key] of [["logs","logs"],["scores","scores"],["squads","squads"],["notes","notes"],["feedback","feedback"],["cpd","cpdRecs"]]){
  window._db.collection(kind).onSnapshot(snap=>{state[key]=snap.docs.map(d=>({id:d.id,...d.data()}));rerenderSoft()});
}
window.addEventListener("online",()=>Sync.soon(500));
document.addEventListener("visibilitychange",()=>{if(!document.hidden)Sync.soon(300)});
setInterval(()=>{if(!document.hidden)Sync.run()},120000);
Sync.soon(800);
if("serviceWorker" in navigator&&location.protocol.startsWith("http")) navigator.serviceWorker.register("sw.js?v=40",{updateViaCache:"none"}).catch(()=>{});
render();

function rerenderSoft(){
  if(window.B2B_HOLD&&window.B2B_HOLD()) return;
  const ae=document.activeElement; if(ae&&/^(INPUT|TEXTAREA|SELECT)$/.test(ae.tagName)) return;
  if(state.scoring&&[...document.querySelectorAll(".scin")].some(x=>x.value)) return;
  if(state.coach) { if(!state.open) return; }
  if(state.open){
    const f=$("#lf");const typing=f&&[...f.querySelectorAll("textarea,input[type=text]")].some(x=>x.value);
    const openDetails=[...document.querySelectorAll("details.pd[open]")].length;
    if(typing||openDetails){const b=$("#lf-save");if(b&&state.dbOk){b.disabled=false;b.textContent="Save to log"}return}
  }
  render();
}


window.toast=window.toast||(typeof toast==="function"?toast:null);
/* Host app adapters: the original Passport, check-in, CPD and session tools remain. */
function dayPrepReady(r){return !!r.learned_at&&r.n>0&&(r.best??r.score)/r.n>=.7;}
function dayLockedSession(s){const days=Math.round((s.dt-today0())/864e5);return `<section class="view"><p class="eyebrow">Session preparation</p><h1 class="page-h">${esc(s.title)}</h1><p>${days>1?'Learn it opens the day before this session.':'Complete Learn it, then pass Test me at 70% to unlock the full plan.'}</p><button class="btn primary" data-open-prep>Open session prep</button></section>`;}
let dayHubCleanup=()=>{},dayRemember='',dayReview={},dayReviewBusy=false;
const dayBaseRender=render,dayBasePrep=prepView,dayBaseBindPrep=bindPrep,dayBaseDevelop=developView,dayBaseBindDevelop=bindDevelop;
const dayBridge={
 get group(){return state.team;},get tool(){return dayRemember;},remember:x=>dayRemember=x,
 route:x=>{dayRemember='';location.hash='#'+x;},
 cpd:()=>Object.fromEntries(Object.entries(Local.cache.cpd||{}).filter(([,r])=>r.coach===ACCESS.uid)),
 selectGroup:g=>{state.team=g;store.set('b2b.team',g);renderTeams();},
 coachCheckin:(slot,mode)=>{window.B2B_OPERATIONS.mount(slot,{coach:true});if(mode==='matchday')slot.querySelector('[data-ops-tab="match"]')?.click();},
 attendance:async(g,slot,mode)=>{
  slot.innerHTML='<p role="status">Opening player register…</p>';
  try{
   const day=new Date().toLocaleDateString('en-CA',{timeZone:'Europe/London'});
   const [p,a]=await Promise.all([window.B2B_SB.from('players').select('id,name').contains('groups',[g]).order('name'),window.B2B_SB.from('attendance').select('player_id').eq('group_id',g).eq('session_date',day)]);
   if(p.error||a.error)throw p.error||a.error;if(!slot.isConnected)return;const here=new Set((a.data||[]).map(r=>r.player_id));
   slot.innerHTML=`<section class="day-register"><h2>Player attendance</h2><p>${here.size} checked in · ${esc(day)}</p>${(p.data||[]).map(r=>`<div><strong>${esc(r.name)}</strong><button data-register-player="${r.id}" ${here.has(r.id)?'disabled':''}>${here.has(r.id)?'Here ✓':'Mark here'}</button></div>`).join('')||'<p>No players assigned to this group.</p>'}<p data-register-status role="status"></p></section>`;
   slot.querySelectorAll('[data-register-player]').forEach(b=>b.onclick=async()=>{b.disabled=true;const error=await Comms.recordAttendance(b.dataset.registerPlayer,g,mode==='matchday'?'Matchday':'Training');if(!b.isConnected)return;if(error){b.disabled=false;slot.querySelector('[data-register-status]').textContent=error;}else{b.textContent='Here ✓';slot.querySelector('[data-register-status]').textContent='Attendance saved.';}});
  }catch(e){if(slot.isConnected)slot.textContent=e.message;}
 },
 chat:g=>{state.chatSeg=g;location.hash='#chat';},
 matchroom:g=>{state.team=g;store.set('b2b.team',g);state.teamTab='match';state.mp=null;dayRemember='';location.hash='#team';},
 passport:id=>{state.devPP=id;state.coachSub='players';location.hash='#coaches';},
 prep:(slot,g)=>{
  const items=prepList().filter(x=>x.groups.some(v=>v.id===g)&&x.days>=0&&x.days<=1).slice(0,2);
  slot.innerHTML=items.length?items.map(x=>dayPrepCard(x,false)).join(''):'<div class="card"><h3>Prep opens the day before</h3><p class="muted">Your next session will appear here the day before and on the day.</p></div>';
  slot.querySelectorAll('[data-preplearn],[data-preptest]').forEach(b=>b.onclick=()=>{
   const key=b.dataset.preplearn||b.dataset.preptest;
   if(b.dataset.preptest&&!prepRec(key).learned_at){toast('Finish Learn it first.');return;}
   state.prepLearn=b.dataset.preplearn?{key,i:0}:null;state.prepRun=b.dataset.preptest?{key,i:0,right:0,res:[],picked:null}:null;state.coachSub='prep';location.hash='#coaches';
  });
 }
};
function dayPrepCard({s,groups},review=true){
 const r=prepRec(s.key),ready=dayPrepReady(r),n=prepQs(s).length;
 const staff=Object.entries(state.profiles||{}).filter(([,p])=>['coach','admin'].includes(p.role)&&(p.groups||[]).some(g=>groups.some(v=>v.id===g)));
 return `<article class="prep-card"><div class="prep-top"><span class="prep-day">${esc(prepDay(s))}</span><span class="pill ${ready?'cpd-ok':'cpd-late'}">${ready?'Ready ✓':r.learned_at?'Test me':'Learn it first'}</span></div><small class="prep-groups">${esc(groups.map(g=>g.long).join(' · '))}</small><h3>${esc(s.title)}</h3><div class="prep-btns"><button class="btn primary" data-preplearn="${s.key}">Learn it ${r.learned_at?'✓':''}</button><button class="btn" data-preptest="${s.key}" ${!r.learned_at?'disabled':''}>Test me · ${n}</button></div>${ACCESS.admin&&review?`<div class="prep-coach-row" aria-label="Coach completion">${staff.map(([id,p])=>{const rows=(dayReview[s.key]||[]).filter(x=>x.coach_id===id),last=rows.at(-1);return `<button data-prep-review="${s.key}" data-coach="${id}">${esc(p.name)} · ${last?.pass?'Quiz passed ✓':last?.learned&&last.score===null?'Learn it ✓ · Test due':rows.length?'Quiz in progress':'Not yet'}</button>`;}).join('')||'<span class="muted">No assigned coaches</span>'}</div><div data-prep-results="${s.key}"></div>`:''}</article>`;
}
prepView=function(){
 if(state.prepRun||state.prepLearn)return dayBasePrep();
 const list=(ACCESS.admin?prepReadyList():prepList().filter(x=>x.days>=0&&x.days<=1)).slice(0,ACCESS.admin?12:2);
 if(ACCESS.admin&&!dayReviewBusy)loadDayReview(list.map(x=>x.s.key));
 return `<section class="view"><p class="eyebrow">SESSION PREP · TODAY & TOMORROW</p><h1 class="page-h">Your sessions</h1>${ACCESS.admin?'<button class="btn" data-refresh-prep>Refresh coach completion</button>':''}<p class="muted">Learn the plan. Score 70%. Unlock the syllabus.</p>${list.map(x=>dayPrepCard(x)).join('')||'<div class="card"><h3>No prep due today</h3><p>The next session opens here the day before.</p></div>'}</section>`;
};
let dayReviewLoaded='';
async function loadDayReview(keys){
 const sig=keys.join(',');if(!keys.length||sig===dayReviewLoaded)return;dayReviewBusy=true;
 const {data,error}=await window.B2B_SB.rpc('academy_prep_review',{p_keys:keys});
 dayReviewBusy=false;if(error){toast('Prep review could not sync: '+error.message);return;}
 dayReview=Object.fromEntries(keys.map(k=>[k,(data||[]).filter(r=>r.key===k)]));dayReviewLoaded=sig;if(state.tab==='coaches'&&state.coachSub==='prep'&&!state.prepRun&&!state.prepLearn)render();
}
bindPrep=function(){
 dayBaseBindPrep();
 const refreshPrep=document.querySelector("[data-refresh-prep]");if(refreshPrep)refreshPrep.onclick=()=>{dayReviewLoaded="";render();};
 document.querySelectorAll('[data-preptest]').forEach(b=>{const old=b.onclick;b.onclick=()=>{
  const key=b.dataset.preptest,learn=state.prepLearn,it=prepItem(key);
  if(learn?.key===key&&learn.i>=(it?.s.plan.length||0)){
   cpdSave('prep_'+key,{...prepRec(key),kind:'prep',key,learned_at:prepRec(key).learned_at||new Date().toISOString()});
  }
  if(!prepRec(key).learned_at){toast('Complete all Learn it cards first.');return;}old?.();
 };});
 document.querySelectorAll('[data-prep-review]').forEach(b=>b.onclick=()=>{
  const rows=(dayReview[b.dataset.prepReview]||[]).filter(r=>r.coach_id===b.dataset.coach&&r.score!==null).sort((a,b)=>a.attempt-b.attempt),first=rows[0],last=rows.at(-1),slot=document.querySelector(`[data-prep-results="${b.dataset.prepReview}"]`);
  slot.innerHTML=first?`<div class="prep-review-box"><b>First recorded attempt: ${first.score}/${first.n} · ${Math.round(100*first.score/first.n)}%</b><p>Latest: ${last.score}/${last.n} · ${rows.length} attempt${rows.length===1?'':'s'} · ${last.pass?'Ready':'Still learning'}</p><h4>First-attempt feedback</h4><ul>${(first.feedback||[]).map(f=>`<li>${esc(f.section)} · ${f.correct?'Correct':'Review'}${!f.correct?' — '+esc(f.answer):''}</li>`).join('')}</ul></div>`:'<div class="prep-review-box">No recorded quiz attempt yet. Earlier overwritten attempts cannot be reconstructed.</div>';
 });
};
developView=function(bare){
 const start=new Date();start.setHours(0,0,0,0);start.setDate(start.getDate()-(start.getDay()+6)%7);
 const count=Object.values(Local.cache.cpd||{}).filter(r=>r.coach===ACCESS.uid&&r.kind==='step'&&r.done&&r.doneAt&&new Date(r.doneAt)>=start).length;
 return `<section class="view"><header class="pro-learn-head"><p class="eyebrow">Coach development</p><h1 class="page-h">Better every week.</h1><div class="pro-learn-row"><b>${Math.min(count,2)} / 2</b><small>development steps completed this week</small></div><div class="cpd-bar" role="progressbar" aria-label="Development steps this week" aria-valuemin="0" aria-valuemax="2" aria-valuenow="${Math.min(count,2)}"><span style="width:${Math.min(count,2)*50}%"></span></div></header></section>`+dayBaseDevelop(bare);
};
bindDevelop=function(){dayBaseBindDevelop();document.querySelectorAll('[data-cpdsetgoal]').forEach(b=>{b.hidden=true;});};
render=function(){
 dayHubCleanup();dayHubCleanup=()=>{};
 if(['home','training-day','match-day','tactics-hub','passports','learning'].includes(state.tab)){
  const root=document.createElement('div');$('#main').replaceChildren(root);
  const modes={home:'home','training-day':'training','match-day':'matchday','tactics-hub':'tactics',passports:'players',learning:'home'};
  import('./b2b-features/day-hub.js?v=47').then(m=>{if(root.isConnected)dayHubCleanup=m.mountDayHub({root,supabase:window.B2B_SB,mode:modes[state.tab],bridge:dayBridge});}).catch(e=>{if(root.isConnected)root.textContent='Your coaching day could not load: '+e.message;});
 }else{dayBaseRender();if(state.tab==='syllabus')bindPrep();}
 const openPrep=document.querySelector('[data-open-prep]');if(openPrep)openPrep.onclick=()=>{state.coachSub='prep';location.hash='#coaches';};
};
const dayNav=document.querySelector('nav.tabs .wrap');
if(dayNav)dayNav.innerHTML=[['home','Home','home'],['training-day','Session','calendar'],['team','Team','shirt'],['chat','Chat','chat'],['coaches','Coaches','users']].map(([id,label,icon])=>`<a href="#${id}" data-tab="${id}" aria-current="${state.tab===id?'page':'false'}">${ic(icon)}${label}</a>`).join('');
render();
document.addEventListener('click',ev=>{if(ev.target.closest('nav.tabs [data-tab="home"]')){dayRemember='';if(state.tab==='home'){ev.preventDefault();render();}}});

// Original Team and Match Room retain their complete rendering and event bindings.
const originalMatchRoomView=matchTabView,originalTeamBinding=bindTeam;
matchTabView=function(gid){const original=originalMatchRoomView(gid);if(state.mp?.gid===gid)return original;return `<div class="matchroom-coach-tools"><div class="day-checkins"><button data-original-coach-checkin><span>COACH</span><b>Check in / out</b><small>Match work log</small></button><button data-original-player-attendance><span>PLAYERS</span><b>Take attendance</b><small>Match register</small></button></div><div data-original-gps></div><div data-original-register></div><button class="btn" data-original-tactics-hub>${ic('target')} Tactics Hub</button></div>`+original;};
bindTeam=function(){originalTeamBinding();const m=$('#main');m.querySelector('[data-original-coach-checkin]')?.addEventListener('click',()=>dayBridge.coachCheckin(m.querySelector('[data-original-gps]'),'matchday'));m.querySelector('[data-original-player-attendance]')?.addEventListener('click',()=>dayBridge.attendance(state.team,m.querySelector('[data-original-register]'),'matchday'));m.querySelector('[data-original-tactics-hub]')?.addEventListener('click',()=>{dayRemember='';location.hash='#tactics-hub';});};
render();
