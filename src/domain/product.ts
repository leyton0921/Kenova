export interface Inventory { cost: number; units: number; sold: number }

/** Lo que ve cualquier visitante de la tienda. */
export interface PublicProduct {
  id: string; name: string; category: string; price: number;
  description: string; imageUrl: string; stock: number; createdAt: number;
}

/** Agregado completo (solo lo maneja la administradora). */
export type Product = Omit<PublicProduct, 'stock'> & Inventory;

export class ProductError extends Error {}

export const clampSold = (sold: number, units: number): number =>
  Math.max(0, Math.min(Math.floor(sold) || 0, units));

export const stockOf = (i: Inventory): number => i.units - clampSold(i.sold, i.units);

export function toPublic(p: Product): PublicProduct {
  const { cost, units, sold, ...rest } = p;
  return { ...rest, stock: stockOf({ cost, units, sold }) };
}

export function validateProduct(p: Product): Product {
  if (!p.name.trim()) throw new ProductError('El producto necesita un nombre');
  if (!p.category.trim()) throw new ProductError('El producto necesita una categoría');
  const nums: [string, number][] = [['costo', p.cost], ['precio', p.price], ['unidades', p.units]];
  for (const [label, v] of nums) {
    if (!Number.isFinite(v) || v < 0) throw new ProductError(`El valor de ${label} no es válido`);
  }
  return { ...p, name: p.name.trim(), category: p.category.trim(), sold: clampSold(p.sold, p.units) };
}

export function mergeProducts(pubs: PublicProduct[], inv: Record<string, Inventory>): Product[] {
  return pubs.map(({ stock, ...p }) => ({ ...p, ...(inv[p.id] ?? { cost: 0, units: 0, sold: 0 }) }));
}
