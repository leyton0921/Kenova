import type { PublicProduct } from './product';

export const interestMessage = (p: PublicProduct, priceText: string): string =>
  `Hola Kenova ✦ Me interesa este producto:\n${p.name}\nCategoría: ${p.category}\nPrecio: ${priceText}\n¿Lo tienen disponible?`;

export const whatsappUrl = (phone: string, text: string): string =>
  `https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(text)}`;
