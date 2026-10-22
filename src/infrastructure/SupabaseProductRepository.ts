import type { Inventory, Product, PublicProduct } from '../domain/product';
import type { ProductRepository, Unsubscribe } from '../domain/ports';
import { refreshAll, watchPolling } from './polling';
import { supabase } from './supabase';

interface CatalogRow {
  id: string; name: string; category: string; price: number; description: string;
  image_url: string; stock: number; created_at: string;
}

const fail = (e: { message: string } | null): void => { if (e) throw new Error(e.message); };

export class SupabaseProductRepository implements ProductRepository {
  newId(): string { return crypto.randomUUID(); }

  watchCatalog(on: (p: PublicProduct[]) => void): Unsubscribe {
    return watchPolling(async () => {
      const { data, error } = await supabase.from('catalog').select('*').order('created_at', { ascending: false });
      if (error || !data) return;
      on((data as CatalogRow[]).map(r => ({
        id: r.id, name: r.name, category: r.category, price: Number(r.price), description: r.description,
        imageUrl: r.image_url, stock: Number(r.stock), createdAt: new Date(r.created_at).getTime(),
      })));
    });
  }

  watchInventory(on: (i: Record<string, Inventory>) => void, onError: (e: Error) => void): Unsubscribe {
    return watchPolling(async () => {
      const { data, error } = await supabase.from('products').select('id,cost,units,sold');
      if (error) return onError(new Error(error.message));
      const inv: Record<string, Inventory> = {};
      for (const r of data ?? []) inv[r.id] = { cost: Number(r.cost), units: Number(r.units), sold: Number(r.sold) };
      on(inv);
    });
  }

  async save(p: Product): Promise<void> {
    const { error } = await supabase.from('products').upsert({
      id: p.id, name: p.name, category: p.category, price: p.price, cost: p.cost, units: p.units, sold: p.sold,
      description: p.description, image_url: p.imageUrl, created_at: new Date(p.createdAt).toISOString(),
    });
    fail(error); refreshAll();
  }

  async updateSold(p: Product, sold: number): Promise<void> {
    const { error } = await supabase.from('products').update({ sold }).eq('id', p.id);
    fail(error); refreshAll();
  }

  async remove(id: string): Promise<void> {
    const { error } = await supabase.from('products').delete().eq('id', id);
    fail(error); refreshAll();
  }
}
