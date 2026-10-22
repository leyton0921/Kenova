const nf = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
export const money = (n: number): string => nf.format(+n || 0);
export const esc = (s: unknown): string =>
  String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] as string));
export const q = <T extends HTMLElement>(sel: string): T => document.querySelector(sel) as T;
export function toast(text: string): void {
  const d = document.createElement('div');
  d.className = 'toast'; d.textContent = text; document.body.append(d);
  setTimeout(() => d.remove(), 2500);
}
