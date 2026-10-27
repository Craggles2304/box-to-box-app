/* Box to Box V49 mobile navigation. Uses existing routes; creates no accounts or data. */
(()=>{
 const nav=document.querySelector('nav.tabs .wrap');if(!nav)return;
 document.body.classList.add('btb-v49');
 let trigger=null,drawer=null,veil=null,lastFocused=null,updatePending=false;
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','"':'&quot;'}[c]));
 const primary=new Set(['home','today','team','coaches','chat']);
 const visibleRoutes=()=>Array.from(nav.querySelectorAll('a[data-tab]')).filter(a=>!a.hidden&&a.hasAttribute('href')&&a.getAttribute('href')?.startsWith('#'));
 function close(){if(drawer)drawer.hidden=true;if(veil)veil.hidden=true;trigger?.setAttribute('aria-expanded','false');document.body.classList.remove('btb-drawer-open');lastFocused?.focus?.();lastFocused=null;}
 function populate(){if(!drawer)return;
  const links=visibleRoutes().filter(a=>!primary.has(a.dataset.tab));
  const container=drawer.querySelector('[data-btb-drawer-links]');
  container.replaceChildren();
  const seen=new Set();
  for(const a of links){const href=a.getAttribute('href');if(seen.has(href))continue;seen.add(href);
   const clone=document.createElement('a');clone.href=href;clone.textContent=a.textContent.trim();clone.dataset.btbRoute=a.dataset.tab;
   if(location.hash===href)clone.setAttribute('aria-current','page');container.append(clone);
  }
  if(!links.length)close();
 }
 function init(){
  const coach=Boolean(nav.querySelector('a[data-tab="today"]'));
  document.body.classList.toggle('btb-mobile-nav',coach);
  if(!coach){close();trigger?.remove();trigger=null;return;}
  if(!trigger){trigger=document.createElement('button');trigger.type='button';trigger.className='btb-v49-more';trigger.setAttribute('aria-controls','btb-v49-drawer');trigger.setAttribute('aria-expanded','false');trigger.setAttribute('aria-label','More app sections');trigger.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="5" cy="7" r="1"/><circle cx="12" cy="7" r="1"/><circle cx="19" cy="7" r="1"/><circle cx="5" cy="17" r="1"/><circle cx="12" cy="17" r="1"/><circle cx="19" cy="17" r="1"/></svg>More';}
  if(trigger.parentNode!==nav)nav.appendChild(trigger);
  if(!drawer){
   veil=document.createElement('div');veil.className='btb-v49-overlay';veil.hidden=true;
   drawer=document.createElement('section');drawer.id='btb-v49-drawer';drawer.className='btb-v49-drawer';drawer.hidden=true;
   drawer.setAttribute('role','dialog');drawer.setAttribute('aria-modal','true');drawer.setAttribute('aria-label','More app sections');
   drawer.innerHTML='<header><h2>Explore Box to Box</h2><button data-btb-close type="button" aria-label="Close menu">Close</button></header><nav class="btb-v49-links" data-btb-drawer-links aria-label="Additional sections"></nav>';
   document.body.append(veil,drawer);veil.addEventListener('click',close);
   drawer.addEventListener('click',e=>{if(e.target.closest('[data-btb-close]')){close();return;}if(e.target.closest('a[data-btb-route]'))close();});
  }
  populate();
 }
 function schedule(){if(updatePending)return;updatePending=true;queueMicrotask(()=>{updatePending=false;init();});}
 nav.addEventListener('click',e=>{if(e.target.closest('button.btb-v49-more')){if(!drawer)return;
  if(!drawer.hidden){close();return;}lastFocused=document.activeElement;populate();veil.hidden=false;drawer.hidden=false;trigger.setAttribute('aria-expanded','true');document.body.classList.add('btb-drawer-open');drawer.querySelector('[data-btb-close]')?.focus();
 }});
 const observer=new MutationObserver(records=>{if(records.some(r=>Array.from(r.addedNodes).some(n=>n.nodeType===1&&n.matches?.('a[data-tab]'))||Array.from(r.removedNodes).some(n=>n.nodeType===1&&n.matches?.('a[data-tab]'))))schedule();});
 observer.observe(nav,{childList:true});
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&drawer&&!drawer.hidden)close();});
 window.addEventListener('hashchange',()=>{if(drawer&&!drawer.hidden)close();});
 init();
})();
