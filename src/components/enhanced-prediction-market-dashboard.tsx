"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useReadContract } from "thirdweb/react";
import { contract } from "@/constants/contract";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MarketCard } from "./marketCard";
import { Navbar } from "./navbar";
import { MarketCardSkeleton } from "./market-card-skeleton";
import { Footer } from "./footer";
import { MarketSortFilter, SortOption } from "./market-sort-filter";
import { MarketVolumeData } from "./market-volume-data";
import { MarketTimeData } from "./market-time-data";
import { CategoryFilter } from "./category-filter";
import { MarketCategory } from "@/lib/market-categories";
import { TrendingMarkets } from "./trending-markets";

// Interface para dados do mercado para ordenação
interface MarketData {
  index: number;
  totalVolume: number;
}

// Componente auxiliar para renderizar grid com mensagem de "sem resultados"
function MarketGrid({
  marketCount,
  filter,
  searchQuery,
  sortBy,
  selectedCategory,
}: {
  marketCount: number;
  filter: "active" | "pending" | "resolved";
  searchQuery: string;
  sortBy: SortOption;
  selectedCategory: MarketCategory | "all";
}) {
  const [marketVolumes, setMarketVolumes] = useState<Map<number, number>>(
    new Map()
  );
  const [marketEndTimes, setMarketEndTimes] = useState<Map<number, bigint>>(
    new Map()
  );

  // Função para atualizar o volume de um mercado
  const handleVolumeLoaded = useCallback(
    (marketId: number, totalVolume: number) => {
      setMarketVolumes((prev) => {
        const newMap = new Map(prev);
        newMap.set(marketId, totalVolume);
        return newMap;
      });
    },
    []
  );

  // Função para atualizar o endTime de um mercado
  const handleTimeLoaded = useCallback((marketId: number, endTime: bigint) => {
    setMarketEndTimes((prev) => {
      const newMap = new Map(prev);
      newMap.set(marketId, endTime);
      return newMap;
    });
  }, []);

  // Ordenar índices baseado no sortBy
  const sortedIndices = useMemo(() => {
    const indices = Array.from({ length: marketCount }, (_, i) => i);

    // Se ainda não temos todos os dados, retornar ordem padrão
    const hasAllVolumes = marketVolumes.size >= marketCount;
    const hasAllTimes = marketEndTimes.size >= marketCount;

    // Ordenar baseado no sortBy
    return [...indices].sort((a, b) => {
      switch (sortBy) {
        case "volume-desc":
          if (!hasAllVolumes) return 0;
          const volumeA = marketVolumes.get(a) || 0;
          const volumeB = marketVolumes.get(b) || 0;
          return volumeB - volumeA;
        case "volume-asc":
          if (!hasAllVolumes) return 0;
          const volumeAAsc = marketVolumes.get(a) || 0;
          const volumeBAsc = marketVolumes.get(b) || 0;
          return volumeAAsc - volumeBAsc;
        case "ending-soon":
          if (!hasAllTimes) return 0;
          const endTimeA = marketEndTimes.get(a) || BigInt(0);
          const endTimeB = marketEndTimes.get(b) || BigInt(0);
          // Ordenar por tempo de término: menor tempo primeiro (terminando em breve)
          return Number(endTimeA) - Number(endTimeB);
        case "oldest-first":
          return a - b;
        case "newest-first":
          return b - a;
        default:
          if (!hasAllVolumes) return 0;
          const volumeADef = marketVolumes.get(a) || 0;
          const volumeBDef = marketVolumes.get(b) || 0;
          return volumeBDef - volumeADef;
      }
    });
  }, [marketCount, marketVolumes, marketEndTimes, sortBy]);

  // Renderizar mercados ordenados
  const markets = sortedIndices.map((index) => (
    <MarketCard
      key={index}
      index={index}
      filter={filter}
      searchQuery={searchQuery}
      selectedCategory={selectedCategory}
    />
  ));

  // Contar quantos cards são renderizados (não null)
  const visibleMarkets = markets.filter((card) => card !== null);

  return (
    <>
      {/* Componentes invisíveis para buscar volumes e tempos */}
      {Array.from({ length: marketCount }, (_, index) => (
        <React.Fragment key={index}>
          <MarketVolumeData
            marketId={index}
            onDataLoaded={handleVolumeLoaded}
          />
          <MarketTimeData marketId={index} onDataLoaded={handleTimeLoaded} />
        </React.Fragment>
      ))}
      {visibleMarkets.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {markets}
        </div>
      ) : searchQuery.trim() ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground text-lg">
            Nenhum bolão encontrado para "{searchQuery}"
          </p>
          <p className="text-muted-foreground text-sm mt-2">
            Tente buscar por outras palavras-chave
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {markets}
        </div>
      )}
    </>
  );
}

export function EnhancedPredictionMarketDashboard() {
  const [isMounted, setIsMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("volume-desc");
  const [selectedCategory, setSelectedCategory] = useState<
    MarketCategory | "all"
  >("all");

  const { data: marketCount, isLoading: isLoadingMarketCount } =
    useReadContract({
      contract,
      method: "function marketCount() view returns (uint256)",
      params: [],
    });

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Show 6 skeleton cards while loading
  const skeletonCards = Array.from({ length: 6 }, (_, i) => (
    <MarketCardSkeleton key={`skeleton-${i}`} />
  ));

  // Prevent hydration issues by not rendering until mounted
  if (!isMounted) {
    return (
      <div className="min-h-screen flex flex-col">
        <div className="flex-grow w-full max-w-[1400px] mx-auto px-8 py-6">
          <div className="animate-pulse">
            <div className="h-16 bg-gray-200 rounded mb-4"></div>
            <div className="h-8 bg-gray-200 rounded mb-4"></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {skeletonCards}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Navbar fixa com barra que atravessa toda a tela */}
      <div className="fixed top-0 left-0 right-0 z-50 w-full bg-background/95 backdrop-blur-sm border-b-2 border-border/60 shadow-sm">
        <div className="w-full max-w-[1430px] mx-auto px-8 py-6">
          <Navbar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
        </div>
      </div>

      <div className="flex-grow w-full max-w-[1430px] mx-auto px-8 py-4 mt-[120px]">
        <div className="mb-6 flex flex-col items-center gap-2">
          <h2 className="text-2xl font-bold text-foreground">
            Maior bolsa de opiniões do Brasil
          </h2>
          <p className="text-foreground text-center max-w-2xl text-sm font-medium leading-relaxed">
            Opine sobre tudo que está acontecendo no país, notícias, cultura,
            política, fofoca, esportes, tecnologia e mais.
          </p>
        </div>

        {/* Mercados em Destaque */}
        {!isLoadingMarketCount && marketCount && Number(marketCount) > 0 && (
          <TrendingMarkets
            marketCount={Number(marketCount)}
            searchQuery={searchQuery}
            selectedCategory={selectedCategory}
          />
        )}

        <Tabs defaultValue="active" className="w-full">
          <div className="flex items-center justify-between mb-4">
            <TabsList className="flex bg-muted/30 rounded-xl p-2 h-auto gap-3">
              <TabsTrigger
                value="active"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm data-[state=inactive]:bg-muted/30 data-[state=inactive]:text-foreground/80 data-[state=inactive]:hover:bg-muted/50 data-[state=inactive]:hover:text-foreground rounded-lg py-2.5 px-4 font-medium cursor-pointer border-0 data-[state=active]:border-2 data-[state=active]:border-primary focus-visible:outline-none focus-visible:ring-0 data-[state=active]:transition-none data-[state=active]:duration-0"
              >
                Bolões Ativos
              </TabsTrigger>
              <TabsTrigger
                value="pending"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm data-[state=inactive]:bg-muted/30 data-[state=inactive]:text-foreground/80 data-[state=inactive]:hover:bg-muted/50 data-[state=inactive]:hover:text-foreground rounded-lg py-2.5 px-4 font-medium cursor-pointer border-0 data-[state=active]:border-2 data-[state=active]:border-primary focus-visible:outline-none focus-visible:ring-0 data-[state=active]:transition-none data-[state=active]:duration-0"
              >
                Bolões Pendentes
              </TabsTrigger>
              <TabsTrigger
                value="resolved"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm data-[state=inactive]:bg-muted/30 data-[state=inactive]:text-foreground/80 data-[state=inactive]:hover:bg-muted/50 data-[state=inactive]:hover:text-foreground rounded-lg py-2.5 px-4 font-medium cursor-pointer border-0 data-[state=active]:border-2 data-[state=active]:border-primary focus-visible:outline-none focus-visible:ring-0 data-[state=active]:transition-none data-[state=active]:duration-0"
              >
                Finalizados
              </TabsTrigger>
            </TabsList>
            <div className="flex items-center gap-3">
              <CategoryFilter
                selectedCategory={selectedCategory}
                onCategoryChange={setSelectedCategory}
              />
              <MarketSortFilter sortBy={sortBy} onSortChange={setSortBy} />
            </div>
          </div>

          {isLoadingMarketCount ? (
            <TabsContent value="active" className="mt-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {skeletonCards}
              </div>
            </TabsContent>
          ) : (
            <>
              <TabsContent value="active" className="mt-6">
                <MarketGrid
                  marketCount={Number(marketCount)}
                  filter="active"
                  searchQuery={searchQuery}
                  sortBy={sortBy}
                  selectedCategory={selectedCategory}
                />
              </TabsContent>

              <TabsContent value="pending" className="mt-6">
                <MarketGrid
                  marketCount={Number(marketCount)}
                  filter="pending"
                  searchQuery={searchQuery}
                  sortBy={sortBy}
                  selectedCategory={selectedCategory}
                />
              </TabsContent>

              <TabsContent value="resolved" className="mt-6">
                <MarketGrid
                  marketCount={Number(marketCount)}
                  filter="resolved"
                  searchQuery={searchQuery}
                  sortBy={sortBy}
                  selectedCategory={selectedCategory}
                />
              </TabsContent>
            </>
          )}
        </Tabs>
      </div>
      <Footer />
    </div>
  );
}
