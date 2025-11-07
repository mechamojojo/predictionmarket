/**
 * Sistema de favoritos usando localStorage
 */

const FAVORITES_KEY = "megabolsa_favorites";

export function getFavorites(): number[] {
  if (typeof window === "undefined") return [];
  
  try {
    const favorites = localStorage.getItem(FAVORITES_KEY);
    return favorites ? JSON.parse(favorites) : [];
  } catch {
    return [];
  }
}

export function addFavorite(marketId: number): void {
  if (typeof window === "undefined") return;
  
  const favorites = getFavorites();
  if (!favorites.includes(marketId)) {
    favorites.push(marketId);
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
  }
}

export function removeFavorite(marketId: number): void {
  if (typeof window === "undefined") return;
  
  const favorites = getFavorites();
  const updated = favorites.filter((id) => id !== marketId);
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(updated));
}

export function isFavorite(marketId: number): boolean {
  const favorites = getFavorites();
  return favorites.includes(marketId);
}

export function toggleFavorite(marketId: number): boolean {
  if (isFavorite(marketId)) {
    removeFavorite(marketId);
    return false;
  } else {
    addFavorite(marketId);
    return true;
  }
}

