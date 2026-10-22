import type { CategoryRepository, Unsubscribe } from '../domain/ports';
import { refreshAll, watchPolling } from './polling';
import { supabase } from './supabase';

const fail = (e: { message: string } | null): void => { if (e) throw new Error(e.message); };

export class SupabaseCategoryRepository implements CategoryRepository {
  watch(on: (names: string[]) => void): Unsubscribe {
    return watchPolling(async () => {
      const { data, error } = await supabase.from('categories').select('name').order('created_at', { ascending: true });
      if (!error && data) on(data.map(r => String(r.name)));
    });
  }
  async add(name: string): Promise<void> {
    fail((await supabase.from('categories').insert({ name })).error); refreshAll();
  }
  async rename(oldName: string, newName: string): Promise<void> {
    fail((await supabase.from('categories').update({ name: newName }).eq('name', oldName)).error);
    fail((await supabase.from('products').update({ category: newName }).eq('category', oldName)).error);
    refreshAll();
  }
  async remove(name: string): Promise<void> {
    fail((await supabase.from('categories').delete().eq('name', name)).error); refreshAll();
  }
}
