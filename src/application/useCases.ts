import { clampSold, validateProduct } from '../domain/product';
import type { Inventory, Product, PublicProduct } from '../domain/product';
import { CategoryError, validateCategoryName } from '../domain/category';
import type { AuthService, CategoryRepository, ImageStorage, ProductRepository, SessionUser, SettingsRepository, Unsubscribe } from '../domain/ports';
import { interestMessage, whatsappUrl } from '../domain/whatsapp';

export interface Dependencies { products: ProductRepository; settings: SettingsRepository; auth: AuthService; images: ImageStorage; categories: CategoryRepository }

export interface ProductInput {
  id?: string; name: string; category: string; price: number; cost: number;
  units: number; sold: number; description: string; imageUrl: string;
  image?: Blob; // foto nueva elegida desde la galería
}

export function createUseCases(d: Dependencies) {
  return {
    // Tienda
    watchCatalog: (on: (p: PublicProduct[]) => void): Unsubscribe =>
      d.products.watchCatalog(list => on([...list].sort((a, b) => b.createdAt - a.createdAt))),
    watchWhatsapp: (on: (phone: string) => void): Unsubscribe => d.settings.watchWhatsapp(on),
    interestLink: (phone: string, p: PublicProduct, priceText: string): string =>
      whatsappUrl(phone, interestMessage(p, priceText)),

    // Administración
    watchInventory: (on: (i: Record<string, Inventory>) => void, onError: (e: Error) => void): Unsubscribe =>
      d.products.watchInventory(on, onError),
    saveProduct: async (input: ProductInput, existing?: Product): Promise<void> => {
      const imageUrl = input.image ? await d.images.upload(input.image) : input.imageUrl;
      const product = validateProduct({
        id: input.id ?? d.products.newId(), name: input.name, category: input.category, price: input.price,
        description: input.description, imageUrl, cost: input.cost, units: input.units,
        sold: input.sold, createdAt: existing?.createdAt ?? Date.now(),
      });
      await d.products.save(product);
    },
    registerSold: (p: Product, sold: number): Promise<void> => d.products.updateSold(p, clampSold(sold, p.units)),
    deleteProduct: (id: string): Promise<void> => d.products.remove(id),
    saveWhatsapp: (phone: string): Promise<void> => d.settings.saveWhatsapp(phone.replace(/\D/g, '')),

    // Categorías
    watchCategories: (on: (names: string[]) => void): Unsubscribe => d.categories.watch(on),
    addCategory: (name: string, existing: string[]): Promise<void> =>
      d.categories.add(validateCategoryName(name, existing)),
    renameCategory: (oldName: string, newName: string, existing: string[]): Promise<void> =>
      d.categories.rename(oldName, validateCategoryName(newName, existing.filter(e => e !== oldName))),
    deleteCategory: (name: string, products: Product[]): Promise<void> => {
      if (products.some(p => p.category === name))
        throw new CategoryError('No puedes borrar una categoría que tiene productos. Cámbialos de categoría o bórralos primero.');
      return d.categories.remove(name);
    },

    // Sesión
    watchSession: (on: (u: SessionUser | null) => void): Unsubscribe => d.auth.watch(on),
    login: (email: string, password: string): Promise<void> => d.auth.login(email, password),
    logout: (): Promise<void> => d.auth.logout(),
  };
}
export type UseCases = ReturnType<typeof createUseCases>;
