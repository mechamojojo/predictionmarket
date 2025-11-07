import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// Combine classes with tailwind-merge
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

// Format number to fixed decimals
export function toFixed(value: number, decimals: number) {
    return value.toFixed(decimals);
}

// Format date to readable string
export function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

// Format value to Brazilian Real (R$)
// 1 crédito = 1 real, so we just format the number as currency
export function formatCurrencyBR(value: number | string | bigint): string {
    const numValue = typeof value === 'bigint' ? Number(value) : typeof value === 'string' ? parseFloat(value) : value;
    
    // Format as Brazilian Real
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(numValue);
}

// Format value to Brazilian Real without decimals if it's a whole number
// But if there are decimals, always show 2 decimal places
export function formatCurrencyBRCompact(value: number | string | bigint): string {
    const numValue = typeof value === 'bigint' ? Number(value) : typeof value === 'string' ? parseFloat(value) : value;
    
    // Check if the number has decimal places
    const hasDecimals = numValue % 1 !== 0;
    
    // If it has decimals, always show 2 decimal places
    // If it's a whole number, show without decimals
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: hasDecimals ? 2 : 0,
        maximumFractionDigits: 2,
    }).format(numValue);
}

// Add any other utility functions here...
