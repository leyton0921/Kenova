import type { Product } from '../domain/product';
import { productStats, buildDashboard } from '../domain/stats';
import { esc, money } from './format';

export function loginHtml(): string {
  return `<form class="form login" id="lg"><h3 class="brand">Entrar</h3>
  <label class="wide">Correo<input id="em" type="email" autocomplete="username" required></label>
  <label class="wide">Contraseña<input id="pw" type="password" autocomplete="current-password" required></label>
  <div class="wide"><button class="btn rose">Entrar</button> <span class="err" id="le"></span></div></form>`;
}

/** Estructura fija del panel: se dibuja UNA vez, así el formulario nunca se borra mientras escribes. */
export function adminShellHtml(): string {
  return `<div class="bar"><h2 class="brand">Panel de Kenova</h2><div><a class="btn ghost sm" href="#">Ver tienda</a> <button class="btn sm" id="out">Salir</button></div></div>
  <p class="err" id="aerr"></p><div class="kpis" id="kpis"></div>
  <form class="form" id="cf"><h3 class="brand">Mis categorías</h3>
  <label>Nueva categoría<input id="cn" placeholder="Ej: Vestidos" maxlength="40"></label>
  <div class="cbtn"><button class="btn rose">Agregar categoría</button></div>
  <div class="wide catlist" id="clist"></div></form>
  <form class="form" id="f"><h3 class="brand" id="ft">Nuevo producto</h3><input type="hidden" id="fid"><input type="hidden" id="fi">
  <label>Nombre<input id="fn" required></label>
  <label>Categoría<select id="fc" required><option value="">Elige una categoría</option></select></label>
  <label>Costo por unidad<input id="fco" type="number" min="0" required></label><label>Precio de venta<input id="fp" type="number" min="0" required></label>
  <label>Unidades totales<input id="fu" type="number" min="0" required></label><label>Unidades vendidas<input id="fs" type="number" min="0" value="0"></label>
  <label class="wide">Descripción (tallas, color…)<textarea id="fd" rows="2"></textarea></label>
  <div class="wide photo"><div class="thumb" id="pv">✦</div><div><label>Foto del producto (desde tu galería)<input id="ff" type="file" accept="image/*"></label><button class="btn ghost sm" type="button" id="rmimg" hidden>Quitar foto</button></div></div>
  <div class="wide"><button class="btn rose" id="save">Guardar producto</button> <button class="btn ghost sm" type="button" id="cancel" hidden>Cancelar edición</button></div></form>
  <div class="tw" id="tbl"></div>
  <form class="form" style="margin-top:20px" id="wf"><h3 class="brand">Tu WhatsApp</h3><input id="wa"></label><div class="wide"><button class="btn sm">Guardar número</button></div></form>`;
}

export function kpisHtml(products: Product[]): string {
  const dash = buildDashboard(products), best = dash.bestSeller;
  const kpi = (v: string, label: string) => `<div class="k"><b>${v}</b><span>${label}</span></div>`;
  return kpi(money(dash.realized), 'Ganancia realizada') + kpi(money(dash.potential), 'Ganancia potencial restante') + kpi(money(dash.revenue), 'Ventas totales')
    + kpi(money(dash.invested), 'Inversión total') + kpi(money(dash.cash), 'Caja (ventas − inversión)') + kpi(money(dash.inventoryValue), 'Valor del inventario disponible')
    + kpi(`${dash.sold} / ${dash.left}`, 'Vendidas / disponibles')
    + kpi(best ? esc(best.name) : '—', best ? `Más vendido (${productStats(best).sold} uds)` : 'Más vendido');
}

export function categoriesListHtml(names: string[], products: Product[]): string {
  if (!names.length) return '<span class="note">Aún no tienes categorías. Crea la primera aquí arriba ✦</span>';
  return names.map(n => `<span class="cchip">${esc(n)} <small>(${products.filter(p => p.category === n).length})</small>
    <button type="button" data-cr="${esc(n)}" aria-label="Renombrar ${esc(n)}">✎</button><button type="button" data-cd="${esc(n)}" aria-label="Borrar ${esc(n)}">×</button></span>`).join('');
}

export function tableHtml(products: Product[]): string {
  const best = buildDashboard(products).bestSeller;
  const rows = products.map(p => {
    const s = productStats(p);
    return `<tr class="${best?.id === p.id ? 'top' : ''}"><td>${p.imageUrl ? `<img class="mini" src="${esc(p.imageUrl)}" alt="">` : ''}${esc(p.name)}</td><td>${esc(p.category)}</td><td>${money(p.cost)}</td><td>${money(p.price)}</td><td>${p.units}</td>
    <td><button class="btn ghost sm" data-m="${p.id}">−</button> <input type="number" min="0" max="${p.units}" value="${s.sold}" data-keep="1" data-s="${p.id}"> <button class="btn ghost sm" data-a="${p.id}">+</button></td>
    <td>${s.left}</td><td>${money(s.invested)}</td><td>${money(s.revenue)}</td><td>${money(s.costOfSold)}</td><td>${money(s.profitPerUnit)}</td><td>${money(s.realized)}</td><td>${money(s.inventoryValue)}</td><td>${money(s.potential)}</td><td>${Math.round(s.margin * 100)}%</td>
    <td><button class="btn ghost sm" data-e="${p.id}">Editar</button> <button class="btn ghost sm" data-d="${p.id}">Borrar</button></td></tr>`;
  }).join('') || '<tr><td colspan="16" class="note">Aún no hay productos. Crea el primero arriba.</td></tr>';
  return `<table><thead><tr><th>Producto</th><th>Categoría</th><th>Costo</th><th>Precio</th><th>Uds. totales</th><th>Vendidas</th><th>Disponibles</th><th>Inversión total</th><th>Ventas realizadas</th><th>Costo de lo vendido</th><th>Ganancia/ud</th><th>Ganancia realizada</th><th>Valor inventario</th><th>Ganancia potencial</th><th>% ganancia</th><th></th></tr></thead><tbody>${rows}</tbody></table>`;
}
