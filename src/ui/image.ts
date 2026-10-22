/** Reduce la foto de la galería (máx. 1200 px, JPG) para que cargue rápido y ocupe poco. */
export async function resizeImage(file: File, max = 1200): Promise<Blob> {
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, max / Math.max(bmp.width, bmp.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bmp.width * scale); canvas.height = Math.round(bmp.height * scale);
  canvas.getContext('2d')!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
  return new Promise((ok, fail) => canvas.toBlob(b => (b ? ok(b) : fail(new Error('No se pudo leer la imagen'))), 'image/jpeg', 0.85));
}
