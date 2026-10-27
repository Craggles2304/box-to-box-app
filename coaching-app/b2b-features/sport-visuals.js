// Decorative diagrams use the native pitch visual language.
export function sportGraphic(kind='training') {
 const marks=kind==='develop'||kind==='players'
  ? '<path d="M25 88 58 62 86 73 126 25"/><path d="m111 26 16-2-2 16"/><circle cx="25" cy="88" r="5"/><circle cx="58" cy="62" r="5"/><circle cx="86" cy="73" r="5"/>'
  : kind==='roles'
  ? '<circle cx="80" cy="55" r="19"/><circle cx="32" cy="80" r="7"/><circle cx="128" cy="80" r="7"/><path d="m40 75 20-11m40 0 20 11M80 34V13m-5 7 5-7 5 7"/>'
  : '<rect x="12" y="10" width="136" height="96" rx="2"/><path d="M80 10v96M12 33h23v50H12m136-50h-23v50h23"/><circle cx="80" cy="58" r="18"/><path d="m48 83 22-32 33-14m-14 0h14v14"/><circle cx="48" cy="83" r="5"/><circle cx="103" cy="37" r="5"/>';
 return `<svg class="sport-graphic" viewBox="0 0 160 116" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true" focusable="false">${marks}</svg>`;
}
