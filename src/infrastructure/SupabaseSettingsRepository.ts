import type { SettingsRepository, Unsubscribe } from '../domain/ports';
import { refreshAll, watchPolling } from './polling';
import { supabase } from './supabase';

export class SupabaseSettingsRepository implements SettingsRepository {
  watchWhatsapp(on: (phone: string) => void): Unsubscribe {
    return watchPolling(async () => {
      const { data } = await supabase.from('settings').select('value').eq('key', 'wa').maybeSingle();
      on(String(data?.value ?? ''));
    }, 60000);
  }
  async saveWhatsapp(phone: string): Promise<void> {
    const { error } = await supabase.from('settings').upsert({ key: 'wa', value: phone });
    if (error) throw new Error(error.message);
    refreshAll();
  }
}
