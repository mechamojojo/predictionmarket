/**
 * Sistema de nome do usuário usando localStorage
 */

const USER_NAME_KEY = "megabolsa_username";

export function getUserName(address: string): string | null {
  if (typeof window === "undefined") return null;
  
  try {
    const saved = localStorage.getItem(`${USER_NAME_KEY}_${address}`);
    return saved || null;
  } catch {
    return null;
  }
}

export function setUserName(address: string, name: string): void {
  if (typeof window === "undefined") return;
  
  try {
    if (name.trim()) {
      localStorage.setItem(`${USER_NAME_KEY}_${address}`, name.trim());
    } else {
      localStorage.removeItem(`${USER_NAME_KEY}_${address}`);
    }
  } catch {
    // Ignore errors
  }
}

export function formatAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function getDisplayName(address: string): string {
  const userName = getUserName(address);
  return userName || formatAddress(address);
}

