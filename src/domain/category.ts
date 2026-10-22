export class CategoryError extends Error {}

/** Normaliza el nombre y evita vacíos, nombres larguísimos y duplicados (sin distinguir mayúsculas). */
export function validateCategoryName(name: string, existing: string[]): string {
  const n = name.trim().replace(/\s+/g, ' ');
  if (!n) throw new CategoryError('Escribe el nombre de la categoría');
  if (n.length > 40) throw new CategoryError('El nombre es muy largo (máximo 40 letras)');
  if (existing.some(e => e.toLowerCase() === n.toLowerCase())) throw new CategoryError('Esa categoría ya existe');
  return n;
}
