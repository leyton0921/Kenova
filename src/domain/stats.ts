import type { Inventory, Product } from './product';
import { clampSold } from './product';

export interface ProductStats {
  sold: number; left: number; profitPerUnit: number; realized: number; inventoryValue: number;
  potential: number; margin: number; invested: number; revenue: number; costOfSold: number;
}

export function productStats(p: Inventory & { price: number }): ProductStats {
  const sold = clampSold(p.sold, p.units), left = p.units - sold, profitPerUnit = p.price - p.cost;
  return {
    sold, left, profitPerUnit,
    realized: sold * profitPerUnit, inventoryValue: left * p.price, potential: left * profitPerUnit,
    margin: p.cost ? profitPerUnit / p.cost : 0,
    invested: p.units * p.cost, revenue: sold * p.price, costOfSold: sold * p.cost,
  };
}

export interface Dashboard {
  realized: number; potential: number; revenue: number; invested: number; cash: number;
  inventoryValue: number; sold: number; left: number; bestSeller: Product | null;
}

export function buildDashboard(products: Product[]): Dashboard {
  const d: Dashboard = { realized: 0, potential: 0, revenue: 0, invested: 0, cash: 0, inventoryValue: 0, sold: 0, left: 0, bestSeller: null };
  for (const p of products) {
    const s = productStats(p);
    d.realized += s.realized; d.potential += s.potential; d.revenue += s.revenue; d.invested += s.invested;
    d.inventoryValue += s.inventoryValue; d.sold += s.sold; d.left += s.left;
    if (s.sold > 0 && (!d.bestSeller || s.sold > productStats(d.bestSeller).sold)) d.bestSeller = p;
  }
  d.cash = d.revenue - d.invested;
  return d;
}
