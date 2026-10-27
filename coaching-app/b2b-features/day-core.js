export const labels={U10:'U10 Vipers','U12/U13':'U12 Titans',U13:'U13 Elite',U15:'U15 Falcons',BM:'Ball Mastery',D47:'Development 4–7',D812:'Development 8–12',TD5:'Technical 4–7',TD:'Technical 10–14'};
export const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function groupsFor(profile){return profile?.role==='admin'?['U13',...Object.keys(labels).filter(g=>g!=='U13')]:profile?.role==='coach'?(profile.groups||[]).filter(g=>Object.hasOwn(labels,g)):[];}
export function ready(record){return !!record?.learned_at&&Number(record.n)>0&&Number(record.best??record.score)/Number(record.n)>=.7;}
export function inPrepWindow(days){return days>=0&&days<=1;}
export function firstAndLatest(rows){const ordered=[...rows].sort((a,b)=>Number(a.attempt)-Number(b.attempt));return {first:ordered[0]||null,latest:ordered.at(-1)||null,attempts:ordered.length};}
export function weeklyCompletions(records,now=new Date()){
 const date=now.toLocaleDateString('en-CA',{timeZone:'Europe/London'});const start=new Date(date+'T00:00:00Z');start.setUTCDate(start.getUTCDate()-(start.getUTCDay()+6)%7);
 return Object.values(records||{}).filter(r=>r.kind==='step'&&r.done&&r.doneAt&&new Date(r.doneAt)>=start&&new Date(r.doneAt)<=now).length;
}
