/**
 * Sistema de avatar do usuário usando localStorage
 */

const AVATAR_KEY = "megabolsa_avatar";

export type AvatarStyle = 
  | "avataaars"
  | "bottts"
  | "identicon"
  | "initials"
  | "micah"
  | "personas"
  | "pixel-art"
  | "shapes"
  | "thumbs";

export interface AvatarOption {
  value: AvatarStyle;
  label: string;
  preview: string;
}

export const AVATAR_OPTIONS: AvatarOption[] = [
  {
    value: "avataaars",
    label: "Avatares",
    preview: "https://api.dicebear.com/7.x/avataaars/svg?seed=preview",
  },
  {
    value: "bottts",
    label: "Robôs",
    preview: "https://api.dicebear.com/7.x/bottts/svg?seed=preview",
  },
  {
    value: "identicon",
    label: "Ícones",
    preview: "https://api.dicebear.com/7.x/identicon/svg?seed=preview",
  },
  {
    value: "initials",
    label: "Iniciais",
    preview: "https://api.dicebear.com/7.x/initials/svg?seed=preview",
  },
  {
    value: "micah",
    label: "Micah",
    preview: "https://api.dicebear.com/7.x/micah/svg?seed=preview",
  },
  {
    value: "personas",
    label: "Personagens",
    preview: "https://api.dicebear.com/7.x/personas/svg?seed=preview",
  },
  {
    value: "pixel-art",
    label: "Pixel",
    preview: "https://api.dicebear.com/7.x/pixel-art/svg?seed=preview",
  },
  {
    value: "shapes",
    label: "Formas",
    preview: "https://api.dicebear.com/7.x/shapes/svg?seed=preview",
  },
  {
    value: "thumbs",
    label: "Polegares",
    preview: "https://api.dicebear.com/7.x/thumbs/svg?seed=preview",
  },
];

export function getAvatarStyle(address: string): AvatarStyle {
  if (typeof window === "undefined") return "avataaars";
  
  try {
    const saved = localStorage.getItem(`${AVATAR_KEY}_${address}`);
    if (saved) {
      // Se for apenas o estilo (formato antigo)
      if (AVATAR_OPTIONS.some(opt => opt.value === saved)) {
        return saved as AvatarStyle;
      }
      // Se for um objeto JSON com style e seed
      try {
        const parsed = JSON.parse(saved);
        if (parsed.style && AVATAR_OPTIONS.some(opt => opt.value === parsed.style)) {
          return parsed.style as AvatarStyle;
        }
      } catch {
        // Ignore JSON parse errors
      }
    }
  } catch {
    // Ignore errors
  }
  
  return "avataaars"; // Default
}

export function getAvatarSeed(address: string): string | null {
  if (typeof window === "undefined") return null;
  
  try {
    const saved = localStorage.getItem(`${AVATAR_KEY}_${address}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.seed) {
          return parsed.seed;
        }
      } catch {
        // Se não for JSON, retorna null (usa o address como seed)
        return null;
      }
    }
  } catch {
    // Ignore errors
  }
  
  return null;
}

export function setAvatarStyle(address: string, style: AvatarStyle, seed?: string): void {
  if (typeof window === "undefined") return;
  
  try {
    const data = seed ? JSON.stringify({ style, seed }) : style;
    localStorage.setItem(`${AVATAR_KEY}_${address}`, data);
  } catch {
    // Ignore errors
  }
}

export function getAvatarUrl(address: string, style?: AvatarStyle, seed?: string): string {
  const avatarStyle = style || getAvatarStyle(address);
  const savedSeed = getAvatarSeed(address);
  const avatarSeed = seed || savedSeed || address;
  return `https://api.dicebear.com/7.x/${avatarStyle}/svg?seed=${avatarSeed}`;
}

// Gerar variações de avatar para um estilo específico
export function getAvatarVariations(style: AvatarStyle, baseSeed: string, count: number = 6): string[] {
  const variations: string[] = [];
  for (let i = 0; i < count; i++) {
    const seed = `${baseSeed}_${i}`;
    variations.push(getAvatarUrl(baseSeed, style, seed));
  }
  return variations;
}

