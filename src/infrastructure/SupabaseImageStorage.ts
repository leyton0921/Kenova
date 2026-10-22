import type { ImageStorage } from '../domain/ports';
import { supabase } from './supabase';

const BUCKET = 'product-images';

export class SupabaseImageStorage implements ImageStorage {
  async upload(image: Blob): Promise<string> {
    const path = `${crypto.randomUUID()}.jpg`;
    const { error } = await supabase.storage.from(BUCKET).upload(path, image, { contentType: 'image/jpeg', cacheControl: '31536000' });
    if (error) throw new Error(`No se pudo subir la foto: ${error.message}`);
    return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
  }
}
