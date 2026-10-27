/** Box to Box V9: parent first-login and secure coach-controlled linking.
 * An INTEGRATION module for the existing signed-in Coaching App, not a site.
 * No client-side service role key, no guessing guardian identity, no messages sent.
 */
import {mountParentLive} from './parent-live.js';

const escapeHtml=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const UUID=/^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/i;
export function cleanParentCode(value){
  const code=String(value??'').toUpperCase().replace(/[^A-Z0-9]/g,'');
  if(!/^[A-Z0-9]{8,16}$/.test(code))throw new Error('Enter the 8-character parent code given to you by the coach.');
  return code;
}
export function normaliseParentHome(home){
  const kids=Array.isArray(home?.children)?home.children.filter(c=>UUID.test(String(c?.id||'')) && typeof c.name==='string'):[];
  if(!home || home.signed_in!==true || !['parent','admin'].includes(home.parent_role))throw new Error('A parent account is required.');
  return {children:kids.slice(0,100),status:kids.length?'connected':'enter_parent_code'};
}
const checkClient=c=>!!(c?.auth?.getUser&&c?.rpc);
const read=async promise=>{const {data,error}=await promise;if(error)throw error;return data;};

/** Parent-facing view. Already-linked families go STRAIGHT to the approved learning feed. */
export function mountParentOnboarding({root,supabase,onOpenPassport}={}){
 if(!(root instanceof Element)||!checkClient(supabase)||!supabase.from)throw new TypeError('Provide a parent view and existing signed-in Supabase client.');
 let disposed=false,childCleanup=null,view=null,children=[],busy=false;
 root.classList.add('btb-parent-onboarding');
 root.innerHTML='<p role="status">Opening your family journey…</p>';
 const resetChild=()=>{if(childCleanup){childCleanup();childCleanup=null;}};
 const message=err=>String(err?.message||'Could not complete that action. Please try again.').slice(0,280);
 function displayError(err){const status=root.querySelector('[data-parent-status]');if(status)status.textContent=message(err);else root.innerHTML=`<p role="alert">${escapeHtml(message(err))}</p>`;}
 function render(){
   resetChild();if(disposed)return;
   if(!children.length){
     root.innerHTML=`<section class="btb-parent-welcome"><header><small>BOX TO BOX · YOUR FAMILY</small><h2>Welcome to your child's journey</h2><p>Connect once using the private parent code from your child's coach.</p></header>
      <form data-parent-link-form><label for="btb-parent-link-code">Your parent code</label><input id="btb-parent-link-code" name="parent_code" required autocomplete="off" autocorrect="off" spellcheck="false" inputmode="text" maxlength="20" placeholder="Example: ABCD 2345" />
      <details class="btb-parent-privacy"><summary>How is my child's information used?</summary><p>Only your linked child's approved learning updates are shown to you. Private coaching notes are not shared. <a href="https://boxtoboxacademy.co.uk/privacy-policy/" target="_blank" rel="noopener noreferrer">Read the full Box to Box privacy notice</a> before confirming.</p></details>
      <label class="btb-parent-consent"><input type="checkbox" name="agree" required /> I am an authorised parent or guardian. I have read the <a href="https://boxtoboxacademy.co.uk/privacy-policy/" target="_blank" rel="noopener noreferrer">Box to Box privacy notice</a> and agree to link this child's development record.</label>
      <button type="submit">Connect my child →</button><p role="status" data-parent-status aria-live="polite"></p></form>
      <p class="btb-parent-help">No code? Ask your child's coach. Codes are shared privately, never in a group chat.</p></section>`;
     return;
   }
   const chosen=children.find(x=>x.id===view)||children[0];view=chosen.id;
   const chips=children.length>1?`<nav class="btb-child-pills" aria-label="Choose child">${children.map(c=>`<button type="button" data-open-child="${escapeHtml(c.id)}" ${c.id===view?'aria-current="true"':''}>${escapeHtml(c.name)}</button>`).join('')}</nav>`:'';
   root.innerHTML=`<section class="btb-parent-welcome"><header><small>BOX TO BOX · CONNECTED</small><h2>Your family's football journey</h2><p>${children.length} ${children.length===1?'child':'children'} connected. Your coach-approved updates are shown below.</p></header>${chips}
    <div class="btb-child-summary"><strong>${escapeHtml(chosen.name)}</strong><span>${Number(chosen.approved_updates)||0} approved updates · ${Number(chosen.four_corner_targets)||0} Four Corner targets</span></div>
    <div data-parent-child-feed aria-live="polite"></div>
    <details class="btb-add-another"><summary>Link another child</summary><form data-parent-link-form><label>Parent code<input name="parent_code" required maxlength="20" autocomplete="off" autocorrect="off" spellcheck="false" placeholder="Code from coach" /></label><label class="btb-parent-consent"><input type="checkbox" name="agree" required /> I'm an authorised guardian and agree to connect another child under the <a href="https://boxtoboxacademy.co.uk/privacy-policy/" target="_blank" rel="noopener noreferrer">Box to Box privacy notice</a>.</label><button type="submit">Connect another child</button><p role="status" data-parent-status></p></form></details>
   </section>`;
   const slot=root.querySelector('[data-parent-child-feed]');
   if(slot)childCleanup=mountParentLive({root:slot,supabase,playerId:chosen.id,onOpenPassport});
 }
 async function load(){
   const identity=await read(supabase.auth.getUser());if(!identity?.user?.id)throw new Error('Please sign in with your parent account.');
   const summary=normaliseParentHome(await read(supabase.rpc('parent_onboarding_home',{})));
   if(disposed)return;children=summary.children;
   if(children.length && !children.some(x=>x.id===view))view=children[0].id;
   render();
 }
 async function submit(e){
   const form=e.target.closest?.('[data-parent-link-form]');if(!form||!root.contains(form))return;
   e.preventDefault();if(busy)return;
   const codeEl=form.elements?.namedItem?.('parent_code');const agree=form.elements?.namedItem?.('agree');
   if(!agree?.checked){displayError(new Error('Please confirm you are authorised to link this child.'));return;}
   let code;try{code=cleanParentCode(codeEl?.value);}catch(err){displayError(err);return;}
   busy=true;const button=form.querySelector('button[type=submit]');if(button)button.disabled=true;
   try{
     await read(supabase.rpc('claim_player',{p_code:code,p_agree:true}));
     if(codeEl)codeEl.value='';
     await load();
   }catch(err){if(!disposed)displayError(err);}finally{busy=false;if(button?.isConnected)button.disabled=false;}
 }
 function click(e){const target=e.target.closest?.('[data-open-child]');if(!target||!root.contains(target))return;
   if(children.some(c=>c.id===target.dataset.openChild)){view=target.dataset.openChild;render();}}
 root.addEventListener('submit',submit);root.addEventListener('click',click);
 load().catch(e=>{if(!disposed)displayError(e)});
 return ()=>{disposed=true;resetChild();root.removeEventListener('submit',submit);root.removeEventListener('click',click);root.replaceChildren();root.classList.remove('btb-parent-onboarding');};
}

/** Staff tool: only assigned players without a verified guardian link. Codes are
 * returned by an existing checked RPC and shown to one verified adult at a time.
 */
export function mountCoachGuardianSetup({root,supabase,groupId}={}){
 if(!(root instanceof Element)||!checkClient(supabase)||!supabase.from||!/^[A-Za-z0-9/ -]{2,60}$/.test(String(groupId||'')))throw new TypeError('Provide an assigned coaching group and signed-in client.');
 let disposed=false,rows=[],busy=false;
 root.classList.add('btb-guardian-setup');root.innerHTML='<p role="status">Checking family connections…</p>';
 const errorText=err=>String(err?.message||'Unable to generate a code right now.').slice(0,240);
 async function load(){
   const identity=await read(supabase.auth.getUser());if(!identity?.user?.id)throw Error('Please sign in as an academy coach.');
   // The database RPC enforces group assignment and returns no codes.
   const items=await read(supabase.rpc('coach_guardian_invite_queue',{p_group:groupId}));
   if(disposed)return;rows=(Array.isArray(items)?items:[]).filter(x=>UUID.test(String(x.player_id||'')));
   root.innerHTML=`<section class="btb-coach-guardian"><header><small>BOX TO BOX · FAMILY CONNECTIONS · ${escapeHtml(groupId)}</small><h2>Help parents join in</h2><p>${rows.length} ${rows.length===1?'family':'families'} to connect. Only share a code with a verified parent or guardian.</p></header>
    ${rows.length?`<ul class="btb-link-queue">${rows.map(x=>`<li><div><strong>${escapeHtml(x.player_name)}</strong><small>${x.active_invitation?'Code already issued · re-show privately':'Parent link not yet created'}</small></div><button type="button" data-link-player="${escapeHtml(x.player_id)}">Get code</button></li>`).join('')}</ul>`:'<div class="btb-guardian-good">All players in this group already have a linked guardian.</div>'}
    <section class="btb-code-output" data-code-output hidden aria-live="polite"></section>
    <p role="status" data-guardian-status></p><p class="btb-guardian-note">Codes are private, single-use and expire. Parents sign in, enter the code and see only authorised child updates. No codes or details are sent automatically.</p></section>`;
 }
 async function click(e){
   const hide=e.target.closest?.('[data-hide-code]');if(hide&&root.contains(hide)){const slot=root.querySelector('[data-code-output]');if(slot){slot.hidden=true;slot.replaceChildren();}return;}
   const target=e.target.closest?.('[data-link-player]');if(!target||!root.contains(target)||busy)return;
   const id=target.dataset.linkPlayer;if(!rows.some(x=>x.player_id===id))return;
   const output=root.querySelector('[data-code-output]'),status=root.querySelector('[data-guardian-status]');
   busy=true;target.disabled=true;if(status)status.textContent='Generating a private parent link…';
   try{
     const code=await read(supabase.rpc('create_parent_code',{p_player:id}));
     if(typeof code!=='string'||!/^[A-Z0-9]{8,16}$/.test(code))throw Error('The database did not return a valid parent code.');
     if(disposed)return;
     if(output){output.hidden=false;output.innerHTML=`<p>Share privately with the verified parent of <strong>${escapeHtml(rows.find(x=>x.player_id===id)?.player_name||'this child')}</strong>:</p><strong class="btb-code-value">${escapeHtml(code)}</strong><p>Parent signs into the Box to Box app and enters this code. Do not post it in a group chat.</p><button type="button" data-hide-code>Hide code</button>`;}
     if(status)status.textContent='Private code ready. It has not been sent to anyone.';
   }catch(err){if(!disposed&&status)status.textContent=errorText(err);}finally{busy=false;if(target.isConnected)target.disabled=false;}
 }
 root.addEventListener('click',click);
 load().catch(err=>{if(!disposed)root.innerHTML=`<p role="alert">${escapeHtml(errorText(err))}</p>`;});
 return ()=>{disposed=true;root.removeEventListener('click',click);root.replaceChildren();root.classList.remove('btb-guardian-setup');};
}
