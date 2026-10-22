import type { Session } from '@supabase/supabase-js';
import type { AuthService, SessionUser, Unsubscribe } from '../domain/ports';
import { supabase } from './supabase';

const toUser = (s: Session | null): SessionUser | null => (s?.user.email ? { email: s.user.email } : null);

export class SupabaseAuthService implements AuthService {
  watch(on: (u: SessionUser | null) => void): Unsubscribe {
    void supabase.auth.getSession().then(({ data }) => on(toUser(data.session)));
    const { data } = supabase.auth.onAuthStateChange((_e, s) => on(toUser(s)));
    return () => data.subscription.unsubscribe();
  }
  async login(email: string, password: string): Promise<void> {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);
  }
  async logout(): Promise<void> { await supabase.auth.signOut(); }
}
