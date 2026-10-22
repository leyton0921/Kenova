import type { Unsubscribe } from '../domain/ports';

const active = new Set<() => void>();

/** Consulta ahora, cada `ms` milisegundos y cada vez que se llame refreshAll(). */
export function watchPolling(run: () => Promise<void>, ms = 20000): Unsubscribe {
  const tick = (): void => { void run(); };
  active.add(tick); tick();
  const timer = setInterval(tick, ms);
  return () => { active.delete(tick); clearInterval(timer); };
}
export const refreshAll = (): void => active.forEach(f => f());
