"use client";

import { useState, useEffect, useMemo } from "react";
import { useReadContract } from "thirdweb/react";
import { contract } from "@/constants/contract";
import { MarketCard } from "./marketCard";
import { MarketCardSkeleton } from "./market-card-skeleton";
import { MarketVolumeData } from "./market-volume-data";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { TrendingUp, Flame } from "lucide-react";

interface TrendingMarketsProps {
  marketCount: number;
  searchQuery?: string;
  selectedCategory?: string;
}

export function TrendingMarkets({
  marketCount,
  searchQuery = "",
  selectedCategory = "all",
}: TrendingMarketsProps) {
  const [marketVolumes, setMarketVolumes] = useState<Map<number, number>>(
    new Map()
  );

  // Função para atualizar o volume de um mercado
  const handleVolumeLoaded = (marketId: number, totalVolume: number) => {
    setMarketVolumes((prev) => {
      const newMap = new Map(prev);
      newMap.set(marketId, totalVolume);
      return newMap;
    });
  };

  // Ordenar mercados por volume (maior para menor)
  const trendingMarketIds = useMemo(() => {
    const indices = Array.from({ length: marketCount }, (_, i) => i);
    
    // Filtrar apenas mercados com volume
    const marketsWithVolume = indices
      .map((id) => ({
        id,
        volume: marketVolumes.get(id) || 0,
      }))
      .filter((m) => m.volume > 0)
      .sort((a, b) => b.volume - a.volume);

    // Retornar top 4 mercados
    return marketsWithVolume.slice(0, 4).map((m) => m.id);
  }, [marketCount, marketVolumes]);

  if (marketCount === 0 || trendingMarketIds.length === 0) {
    return null;
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Flame className="h-5 w-5 text-primary" />
          <CardTitle className="text-xl font-bold">Mercados em Destaque</CardTitle>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Os bolões mais populares do momento
        </p>
      </CardHeader>
      <CardContent>
        {/* Componentes invisíveis para buscar volumes */}
        {Array.from({ length: marketCount }, (_, i) => (
          <MarketVolumeData
            key={`volume-${i}`}
            marketId={i}
            onDataLoaded={handleVolumeLoaded}
          />
        ))}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {trendingMarketIds.length > 0 ? (
            trendingMarketIds.map((marketId) => (
              <MarketCard
                key={marketId}
                index={marketId}
                filter="active"
                searchQuery={searchQuery}
                selectedCategory={selectedCategory as any}
              />
            ))
          ) : (
            // Skeleton enquanto carrega
            Array.from({ length: 4 }, (_, i) => (
              <MarketCardSkeleton key={`skeleton-${i}`} />
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}

