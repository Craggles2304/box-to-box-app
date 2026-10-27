/** Box to Box V42 — opt-in practice routines. Runs only while page is open. */
const activities=[
 {id:'ball',title:'Ball mastery',instruction:'Complete 20 controlled touches using both feet.',seconds:45},
 {id:'scan',title:'Scan and receive',instruction:'Before each of 10 touches, look left and right.',seconds:45},
 {id:'move',title:'Move into space',instruction:'Practise 8 check-away-and-receive movements safely.',seconds:45},
 {id:'reflect',title:'Coach your brain',instruction:'Explain one thing you practised and what you will try next.',seconds:30}
];
const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const today=()=>new Date().toLocaleDateString('en-CA');
const key=id=>'btb.keepup.v42.'+id;
const fmt=n=>String(Math.floor(n/60)).padStart(2,'0')+':'+String(n%60).padStart(2,'0');
const validTime=t=>/^([01]\d|2[0-3]):[0-5]\d$/.test(t);
export function mountKeepUpRoutine({root,playerId='me'}={}){
 if(!(root instanceof Element))throw new TypeError('Missing routine mount');
 const k=key(String(playerId).replace(/[^\w-]/g,'').slice(0,60));
 let cfg={time:'17:00',enabled:false,done:null};
 try{const data=JSON.parse(localStorage.getItem(k)||'{}');if(validTime(data.time))cfg.time=data.time;cfg.enabled=data.enabled===true;cfg.done=typeof data.done==='string'?data.done:null;}catch{}
 let active=false,elapsed=0,timer=null,watch=null,lastAlert='';
 const store=()=>{try{localStorage.setItem(k,JSON.stringify(cfg))}catch{}};
 const stop=()=>{clearInterval(timer);timer=null;active=false};
 function update(){
  if(!root.isConnected)return;
  const done=cfg.done===today();
  root.innerHTML=`<section class="btb-routine" aria-label="Football practice routine">
  <div class="btb-routine-head"><span aria-hidden="true">⚽</span><div><strong>Keep Up · Football Routine</strong><p>Show up, practise one small skill, grow every day.</p></div></div>
  <div class="btb-routine-status">${done?'✅ You showed up today!':active?'Practice in progress':'A small challenge you can complete safely at home'}</div>
  <label class="btb-routine-field">Daily reminder time <input data-routine-time type="time" value="${escape(cfg.time)}"></label>
  <label class="btb-routine-toggle"><input data-routine-enable type="checkbox" ${cfg.enabled?'checked':''}> Remind me while this app is open</label>
  <p class="btb-routine-disclaimer">Reminders work only while the app is open. This is not a phone alarm and cannot make you complete an exercise.</p>
  <div class="btb-routine-activities">${activities.map((a,i)=>`<div class="btb-routine-task"><span class="btb-routine-num">${i+1}</span><div><b>${escape(a.title)}</b><p>${escape(a.instruction)}</p></div></div>`).join('')}</div>
  <div class="btb-routine-actions">${done?'<button type="button" data-routine-reset>Practise again</button>':`<button type="button" data-routine-start>${active?'Restart practice':'Start my challenge'}</button>`}${active?'<button type="button" data-routine-stop>Stop</button>':''}</div>
  <div class="btb-routine-clock" data-routine-clock role="status" aria-live="polite">${active?fmt(Math.max(0,elapsed)):''}</div>
  <p class="btb-routine-feedback" role="status">${done?'Well done for making time to practise.':'When you finish, you can mark the routine complete yourself.'}</p>
  ${active?'<button type="button" data-routine-finish>Finished — mark as done</button>':''}
  </section>`;
 }
 function onClick(e){const el=e.target.closest('button');if(!el||!root.contains(el))return;
  if(el.matches('[data-routine-start]')){stop();active=true;elapsed=activities.reduce((s,a)=>s+a.seconds,0);update();timer=setInterval(()=>{if(!root.isConnected){stop();return}elapsed=Math.max(0,elapsed-1);const c=root.querySelector('[data-routine-clock]');if(c)c.textContent=fmt(elapsed);if(elapsed===0)stop();},1000)}
  if(el.matches('[data-routine-stop]')){stop();update()}
  if(el.matches('[data-routine-finish]')){cfg.done=today();store();stop();update()}
  if(el.matches('[data-routine-reset]')){cfg.done=null;store();update()}
 }
 function onChange(e){const el=e.target;if(el.matches('[data-routine-time]')&&validTime(el.value)){cfg.time=el.value;store()}if(el.matches('[data-routine-enable]')){cfg.enabled=el.checked;store()}}
 root.addEventListener('click',onClick);root.addEventListener('change',onChange);update();
 watch=setInterval(()=>{if(!root.isConnected){clearInterval(watch);return}if(!cfg.enabled||cfg.done===today())return;
  const now=new Date(),hhmm=String(now.getHours()).padStart(2,'0')+':'+String(now.getMinutes()).padStart(2,'0');
  if(hhmm===cfg.time&&lastAlert!==today()+hhmm){lastAlert=today()+hhmm;const text=root.querySelector('.btb-routine-feedback');if(text)text.textContent='It’s practice time! Choose Start my challenge when you are ready.';}
 },20000);
 return()=>{stop();clearInterval(watch);root.removeEventListener('click',onClick);root.removeEventListener('change',onChange);root.replaceChildren()};
}
