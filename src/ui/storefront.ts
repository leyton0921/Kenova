import type { PublicProduct } from '../domain/product';
import type { UseCases } from '../application/useCases';
import { esc, money, q } from './format';

function card(uc: UseCases, p: PublicProduct, phone: string): string {
  const out = p.stock <= 0;
  const media = p.imageUrl
    ? `<button class="ph zoom" data-z="${esc(p.imageUrl)}" data-n="${esc(p.name)}" data-p="${money(p.price)}" aria-label="Ampliar foto de ${esc(p.name)}"><img src="${esc(p.imageUrl)}" alt="${esc(p.name)}" loading="lazy"></button>`
    : '<div class="ph">✦</div>';
  return `<article class="p ${out ? 'out' : ''}">${media}
  <div class="pb"><div class="pc">${esc(p.category)}</div><div class="pn">${esc(p.name)}</div><div class="pd">${esc(p.description)}</div><div class="pr">${money(p.price)}</div>
  <a class="btn rose" target="_blank" rel="noopener" href="${uc.interestLink(phone, p, money(p.price))}">${out ? 'Agotado' : 'Me interesa'}</a></div></article>`;
}

export function renderStorefront(uc: UseCases, products: PublicProduct[], phone: string, category: string, order: string[]): void {
  const rank = (c: string): number => { const i = order.indexOf(c); return i < 0 ? 999 : i; };
  const cats = [...new Set(products.map(p => p.category).filter(Boolean))].sort((a, b) => rank(a) - rank(b)); // en el orden en que creaste las categorías
  q('#chips').innerHTML = cats.length > 1
    ? ['Todo', ...cats].map(c => `<button class="chip ${c === category ? 'on' : ''}" data-c="${esc(c)}">${esc(c)}</button>`).join('') : '';
  if (!products.length) { q('#grid').innerHTML = '<div class="empty">Muy pronto nuevas piezas ✦</div>'; return; }
  const show = category === 'Todo' ? cats : cats.filter(c => c === category);
  // Cada categoría con su propio título; "Todo" las muestra todas, una debajo de otra
  q('#grid').innerHTML = show.map(c =>
    `<h2 class="cat-t brand">${esc(c)}</h2>${products.filter(p => p.category === c).map(p => card(uc, p, phone)).join('')}`).join('');
}

/** Ventana para ver la foto en grande: se cierra tocando fuera, con la × o con Esc. */
export function initLightbox(): void {
  const lb = q('#lb'), img = q<HTMLImageElement>('#lbi'), cap = q('#lbc');
  const close = (): void => { lb.hidden = true; img.removeAttribute('src'); };
  q('#grid').addEventListener('click', e => {
    const b = (e.target as HTMLElement).closest<HTMLElement>('[data-z]');
    if (!b) return;
    img.src = b.dataset.z ?? ''; img.alt = b.dataset.n ?? '';
    cap.textContent = `${b.dataset.n ?? ''} · ${b.dataset.p ?? ''}`; lb.hidden = false;
  });
  lb.addEventListener('click', e => { if (e.target !== img) close(); });
  addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
}
