"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useReadContract } from "thirdweb/react";
import { contract } from "@/constants/contract";
import { MarketCard } from "./marketCard";
import { MarketCardSkeleton } from "./market-card-skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Link2 } from "lucide-react";
import { detectMarketCategory, MarketCategory } from "@/lib/market-categories";

interface RelatedMarketsProps {
  currentMarketId: number;
  currentQuestion: string;
  marketCount: number;
}

interface Market {
  question: string;
  optionA: string;
  optionB: string;
  endTime: bigint;
  outcome: number;
  totalOptionAShares: bigint;
  totalOptionBShares: bigint;
  resolved: boolean;
}

// Component to fetch and check a single market's category
function MarketCategoryChecker({
  marketId,
  currentCategory,
  onMatch,
}: {
  marketId: number;
  currentCategory: MarketCategory;
  onMatch: (id: number) => void;
}) {
  const { data: marketData } = useReadContract({
    contract,
    method:
      "function getMarketInfo(uint256 _marketId) view returns (string question, string optionA, string optionB, uint256 endTime, uint8 outcome, uint256 totalOptionAShares, uint256 totalOptionBShares, bool resolved)",
    params: [BigInt(marketId)],
  });

  // Use ref to track if we've already called onMatch for this market
  const hasCalledRef = useRef(false);

  useEffect(() => {
    if (!marketData || hasCalledRef.current) return;
    
    const question = marketData[0];
    const category = detectMarketCategory(question);
    
    // Check if market is active (not expired)
    const endTime = marketData[3];
    const isExpired = new Date(Number(endTime) * 1000) < new Date();
    
    if (category === currentCategory && !isExpired) {
      hasCalledRef.current = true;
      onMatch(marketId);
    }
  }, [marketData, currentCategory, marketId, onMatch]);

  // Reset ref when category or marketId changes
  useEffect(() => {
    hasCalledRef.current = false;
  }, [currentCategory, marketId]);

  return null;
}

export function RelatedMarkets({
  currentMarketId,
  currentQuestion,
  marketCount,
}: RelatedMarketsProps) {
  const [relatedMarkets, setRelatedMarkets] = useState<Set<number>>(new Set());
  const [currentCategory, setCurrentCategory] = useState<MarketCategory | null>(null);
  const maxRelated = 4;

  // Detect category of current market
  useEffect(() => {
    const category = detectMarketCategory(currentQuestion);
    setCurrentCategory(category);
  }, [currentQuestion]);

  // Handle when a market matches (memoized to prevent infinite loops)
  const handleMatch = useCallback((marketId: number) => {
    setRelatedMarkets((prev) => {
      if (prev.size >= maxRelated) return prev;
      if (prev.has(marketId)) return prev; // Already added
      const newSet = new Set(prev);
      newSet.add(marketId);
      return newSet;
    });
  }, []);

  if (!currentCategory || marketCount <= 1) {
    return null;
  }

  const relatedArray = Array.from(relatedMarkets).slice(0, maxRelated);

  return (
    <>
      {/* Invisible components to check market categories */}
      {Array.from({ length: marketCount }, (_, i) => {
        if (i === currentMarketId) return null;
        if (relatedArray.length >= maxRelated) return null;
        return (
          <MarketCategoryChecker
            key={i}
            marketId={i}
            currentCategory={currentCategory}
            onMatch={handleMatch}
          />
        );
      })}

      {relatedArray.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Link2 className="h-5 w-5 text-primary" />
              <CardTitle className="text-xl font-bold">Mercados Relacionados</CardTitle>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Outros bolões que podem te interessar
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {relatedArray.map((marketId) => (
                <MarketCard
                  key={marketId}
                  index={marketId}
                  filter="active"
                  searchQuery=""
                  selectedCategory={currentCategory}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}

