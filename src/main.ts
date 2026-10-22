import './ui/styles.css';
import { createUseCases } from './application/useCases';
import { SupabaseAuthService } from './infrastructure/SupabaseAuthService';
import { SupabaseCategoryRepository } from './infrastructure/SupabaseCategoryRepository';
import { SupabaseImageStorage } from './infrastructure/SupabaseImageStorage';
import { SupabaseProductRepository } from './infrastructure/SupabaseProductRepository';
import { SupabaseSettingsRepository } from './infrastructure/SupabaseSettingsRepository';
import { startApp } from './ui/app';

// Único lugar donde se conectan las capas: UI → Aplicación → Dominio ← Infraestructura
const useCases = createUseCases({
  products: new SupabaseProductRepository(),
  settings: new SupabaseSettingsRepository(),
  auth: new SupabaseAuthService(),
  images: new SupabaseImageStorage(),
  categories: new SupabaseCategoryRepository(),
});
startApp(useCases);
