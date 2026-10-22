import type { Inventory, Product, PublicProduct } from './product';

export type Unsubscribe = () => void;
export interface SessionUser { email: string }

/** Puertos: el dominio los define, la infraestructura los implementa. */
export interface ProductRepository {
  newId(): string;
  watchCatalog(on: (products: PublicProduct[]) => void): Unsubscribe;
  watchInventory(on: (inv: Record<string, Inventory>) => void, onError: (e: Error) => void): Unsubscribe;
  save(product: Product): Promise<void>;
  updateSold(product: Product, sold: number): Promise<void>;
  remove(id: string): Promise<void>;
}
export interface SettingsRepository {
  watchWhatsapp(on: (phone: string) => void): Unsubscribe;
  saveWhatsapp(phone: string): Promise<void>;
}
export interface AuthService {
  watch(on: (user: SessionUser | null) => void): Unsubscribe;
  login(email: string, password: string): Promise<void>;
  logout(): Promise<void>;
}

export interface ImageStorage {
  /** Sube una imagen y devuelve su URL pública. */
  upload(image: Blob): Promise<string>;
}

export interface CategoryRepository {
  watch(on: (names: string[]) => void): Unsubscribe;
  add(name: string): Promise<void>;
  /** Renombra la categoría y todos los productos que la usan. */
  rename(oldName: string, newName: string): Promise<void>;
  remove(name: string): Promise<void>;
}
