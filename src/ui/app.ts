import type { Inventory, Product, PublicProduct } from '../domain/product';
import { mergeProducts } from '../domain/product';
import type { SessionUser, Unsubscribe } from '../domain/ports';
import type { UseCases } from '../application/useCases';
import { adminShellHtml, categoriesListHtml, kpisHtml, loginHtml, tableHtml } from './admin';
import { esc, q, toast } from './format';
import { resizeImage } from './image';
import { initLightbox, renderStorefront } from './storefront';

interface State {
  catalog: PublicProduct[]; inventory: Record<string, Inventory>; categories: string[]; phone: string;
  user: SessionUser | null; category: string; error: string;
}

export function startApp(uc: UseCases): void {
  const st: State = { catalog: [], inventory: {}, categories: [], phone: '', user: null, category: 'Todo', error: '' };
  const products = (): Product[] => mergeProducts(st.catalog, st.inventory);
  const msg = (e: unknown): string => (e instanceof Error ? e.message : 'Algo salió mal');
  const isAdminRoute = (): boolean => location.hash === '#admin';
  let stopInventory: Unsubscribe | null = null;

  const resetForm = (): void => {
    q<HTMLFormElement>('#f').reset(); q<HTMLInputElement>('#fid').value = ''; q<HTMLInputElement>('#fi').value = '';
    q('#ft').textContent = 'Nuevo producto'; q('#cancel').hidden = true; setPreview('');
  };
  const setPreview = (url: string): void => {
    q('#pv').innerHTML = url ? `<img src="${esc(url)}" alt="">` : '✦'; q('#rmimg').hidden = !url;
  };
  const buildShell = (root: HTMLElement): void => {
    root.innerHTML = adminShellHtml(); root.dataset.shell = '1';
    q('#out').onclick = () => { void uc.logout(); };
    q<HTMLFormElement>('#f').onsubmit = onSave;
    q('#cancel').onclick = resetForm;
    q<HTMLFormElement>('#cf').onsubmit = async e => {
      e.preventDefault();
      try { await uc.addCategory(q<HTMLInputElement>('#cn').value, st.categories); q<HTMLInputElement>('#cn').value = ''; toast('Categoría creada'); }
      catch (err) { toast(msg(err)); }
    };
    q('#rmimg').onclick = () => { q<HTMLInputElement>('#fi').value = ''; q<HTMLInputElement>('#ff').value = ''; setPreview(''); };
    q<HTMLInputElement>('#ff').onchange = e => {
      const f = (e.target as HTMLInputElement).files?.[0];
      if (f) { setPreview(URL.createObjectURL(f)); }
    };
    q<HTMLFormElement>('#wf').onsubmit = async e => {
      e.preventDefault(); await uc.saveWhatsapp(q<HTMLInputElement>('#wa').value); toast('Número guardado');
    };
  };

  const render = (): void => {
    const admin = isAdminRoute();
    q('#pub').hidden = admin; q('#admin').hidden = !admin;
    if (!admin) return renderStorefront(uc, st.catalog, st.phone, st.category, st.categories);
    const root = q('#admin');
    if (!st.user) {
      root.dataset.shell = '';
      root.innerHTML = loginHtml();
      q<HTMLFormElement>('#lg').onsubmit = async e => {
        e.preventDefault();
        try { await uc.login(q<HTMLInputElement>('#em').value, q<HTMLInputElement>('#pw').value); }
        catch { q('#le').textContent = 'Correo o contraseña incorrectos'; }
      };
      return;
    }
    if (!root.dataset.shell) buildShell(root);
    // Solo se actualizan los datos; el formulario NO se toca
    const list = products();
    q('#aerr').textContent = st.error;
    q('#kpis').innerHTML = kpisHtml(list);
    q('#clist').innerHTML = categoriesListHtml(st.categories, list);
    const names = [...new Set([...st.categories, ...list.map(p => p.category)])];
    const sel = q<HTMLSelectElement>('#fc'), sig = names.join('\u0001');
    if (sel.dataset.sig !== sig) { // solo se redibuja si cambió la lista (así no se cierra el desplegable)
      const cur = sel.value;
      sel.innerHTML = '<option value="">Elige una categoría</option>' + names.map(n => `<option value="${esc(n)}">${esc(n)}</option>`).join('');
      sel.value = cur; sel.dataset.sig = sig;
    }
    const focused = document.activeElement as HTMLElement | null;
    if (!(focused && q('#tbl').contains(focused) && focused.dataset.keep)) q('#tbl').innerHTML = tableHtml(list);
    const wa = q<HTMLInputElement>('#wa');
    if (document.activeElement !== wa) wa.value = st.phone;
  };

  const onSave = async (e: Event): Promise<void> => {
    e.preventDefault();
    const v = (id: string): string => q<HTMLInputElement>(id).value;
    const id = v('#fid') || undefined, btn = q<HTMLButtonElement>('#save');
    btn.disabled = true; btn.textContent = 'Guardando…';
    try {
      const file = q<HTMLInputElement>('#ff').files?.[0];
      await uc.saveProduct({
        id, name: v('#fn'), category: v('#fc'), cost: +v('#fco'), price: +v('#fp'), units: +v('#fu'),
        sold: +v('#fs') || 0, description: v('#fd'), imageUrl: v('#fi'), image: file ? await resizeImage(file) : undefined,
      }, products().find(p => p.id === id));
      toast('Producto guardado'); resetForm();
    } catch (err) { toast(err instanceof Error ? err.message : 'No se pudo guardar'); }
    finally { btn.disabled = false; btn.textContent = 'Guardar producto'; }
  };

  q('#chips').onclick = e => {
    const b = (e.target as HTMLElement).closest<HTMLElement>('.chip');
    if (b) { st.category = b.dataset.c ?? 'Todo'; render(); }
  };

  q('#admin').addEventListener('click', async e => {
    const b = (e.target as HTMLElement).closest<HTMLElement>('button');
    if (!b) return;
    const d = b.dataset, find = (id?: string) => products().find(p => p.id === id);
    if (d.a || d.m) { const p = find(d.a ?? d.m); if (p) await uc.registerSold(p, p.sold + (d.a ? 1 : -1)); }
    if (d.d && confirm('¿Borrar este producto?')) await uc.deleteProduct(d.d);
    if (d.cr) {
      const nn = prompt('Nuevo nombre de la categoría', d.cr);
      if (nn !== null && nn.trim() !== d.cr) {
        try { await uc.renameCategory(d.cr, nn, st.categories); toast('Categoría actualizada'); } catch (err) { toast(msg(err)); }
      }
    }
    if (d.cd && confirm(`¿Borrar la categoría "${d.cd}"?`)) {
      try { await uc.deleteCategory(d.cd, products()); toast('Categoría borrada'); } catch (err) { toast(msg(err)); }
    }
    if (d.e) {
      const p = find(d.e); if (!p) return;
      q('#ft').textContent = 'Editar producto';
      const set = (id: string, val: string | number) => { q<HTMLInputElement>(id).value = String(val); };
      set('#fid', p.id); set('#fn', p.name); set('#fc', p.category); set('#fco', p.cost); set('#fp', p.price);
      set('#fu', p.units); set('#fs', p.sold); set('#fd', p.description); set('#fi', p.imageUrl);
      q<HTMLInputElement>('#ff').value = ''; setPreview(p.imageUrl);
      q('#cancel').hidden = false; q('#f').scrollIntoView({ behavior: 'smooth' });
    }
  });
  q('#admin').addEventListener('change', e => {
    const i = e.target as HTMLInputElement;
    const p = products().find(x => x.id === i.dataset.s);
    if (p) void uc.registerSold(p, +i.value || 0);
  });

  initLightbox();
  uc.watchCatalog(list => { st.catalog = list; render(); });
  uc.watchCategories(names => { st.categories = names; render(); });
  uc.watchWhatsapp(phone => { st.phone = phone; render(); });
  uc.watchSession(user => {
    st.user = user; st.error = ''; stopInventory?.(); stopInventory = null;
    if (user) stopInventory = uc.watchInventory(
      inv => { st.inventory = inv; render(); },
      () => { st.error = 'Esta cuenta no tiene permiso de administradora. Revisa el correo en supabase/schema.sql.'; render(); });
    render();
  });
  addEventListener('hashchange', render);
  render();
}
