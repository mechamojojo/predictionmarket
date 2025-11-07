// Utility functions for tracking odds history and trends

const ODDS_HISTORY_KEY = "megabolsa_odds_history";

interface OddsSnapshot {
  marketId: number;
  oddsA: number;
  oddsB: number;
  timestamp: number;
}

interface OddsHistory {
  [marketId: number]: OddsSnapshot[];
}

// Get odds history from localStorage
export function getOddsHistory(): OddsHistory {
  if (typeof window === "undefined") return {};
  try {
    const stored = localStorage.getItem(ODDS_HISTORY_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

// Save odds snapshot (only if odds changed significantly or enough time passed)
export function saveOddsSnapshot(
  marketId: number,
  oddsA: number | null,
  oddsB: number | null
): void {
  if (typeof window === "undefined") return;
  try {
    const history = getOddsHistory();
    const now = Date.now();

    if (!history[marketId]) {
      history[marketId] = [];
    }

    // Only save if odds are valid
    if (oddsA !== null && oddsB !== null) {
      const lastSnapshot = history[marketId][history[marketId].length - 1];
      const minTimeBetweenSnapshots = 30 * 1000; // 30 seconds minimum
      const minOddsChange = 0.01; // 1% minimum change

      // Check if we should save this snapshot
      let shouldSave = false;

      if (!lastSnapshot) {
        // First snapshot, always save
        shouldSave = true;
      } else {
        const timeSinceLastSnapshot = now - lastSnapshot.timestamp;
        const oddsAChanged = Math.abs(oddsA - lastSnapshot.oddsA) >= minOddsChange;
        const oddsBChanged = Math.abs(oddsB - lastSnapshot.oddsB) >= minOddsChange;

        // Save if enough time passed OR if odds changed significantly
        if (timeSinceLastSnapshot >= minTimeBetweenSnapshots || oddsAChanged || oddsBChanged) {
          shouldSave = true;
        }
      }

      if (shouldSave) {
        history[marketId].push({
          marketId,
          oddsA,
          oddsB,
          timestamp: now,
        });

        // Keep only last 100 snapshots per market (increased for better history)
        if (history[marketId].length > 100) {
          history[marketId] = history[marketId].slice(-100);
        }

        localStorage.setItem(ODDS_HISTORY_KEY, JSON.stringify(history));
      }
    }
  } catch {
    // Ignore errors
  }
}

// Get latest odds for a market
export function getLatestOdds(marketId: number): {
  oddsA: number | null;
  oddsB: number | null;
} | null {
  const history = getOddsHistory();
  const marketHistory = history[marketId];
  if (!marketHistory || marketHistory.length === 0) return null;

  const latest = marketHistory[marketHistory.length - 1];
  return {
    oddsA: latest.oddsA,
    oddsB: latest.oddsB,
  };
}

// Get previous odds (from 5 minutes ago or latest if less than 5 min)
export function getPreviousOdds(marketId: number): {
  oddsA: number | null;
  oddsB: number | null;
} | null {
  const history = getOddsHistory();
  const marketHistory = history[marketId];
  if (!marketHistory || marketHistory.length === 0) return null;

  const now = Date.now();
  const fiveMinutesAgo = now - 5 * 60 * 1000;

  // Find snapshot from 5 minutes ago or closest to it
  let previousSnapshot = marketHistory[0];
  for (let i = marketHistory.length - 1; i >= 0; i--) {
    if (marketHistory[i].timestamp <= fiveMinutesAgo) {
      previousSnapshot = marketHistory[i];
      break;
    }
    previousSnapshot = marketHistory[i];
  }

  // If we only have one snapshot, return null (no comparison)
  if (marketHistory.length === 1) return null;

  return {
    oddsA: previousSnapshot.oddsA,
    oddsB: previousSnapshot.oddsB,
  };
}

// Calculate trend (up, down, or stable)
export type TrendDirection = "up" | "down" | "stable";

export function calculateTrend(
  currentOdds: number | null,
  previousOdds: number | null
): TrendDirection {
  if (currentOdds === null || previousOdds === null) return "stable";

  const threshold = 0.05; // 5% change threshold
  const change = (currentOdds - previousOdds) / previousOdds;

  if (change > threshold) return "up";
  if (change < -threshold) return "down";
  return "stable";
}

// Get all odds history for a market (for charts)
export function getMarketOddsHistory(marketId: number): OddsSnapshot[] {
  const history = getOddsHistory();
  return history[marketId] || [];
}

