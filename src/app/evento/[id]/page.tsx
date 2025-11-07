"use client";

import { useParams } from "next/navigation";
import { useReadContract, useActiveAccount } from "thirdweb/react";
import { contract } from "@/constants/contract";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MarketProgress } from "@/components/market-progress";
import { MarketTime } from "@/components/market-time";
import { MarketBuyInterface } from "@/components/market-buy-interface";
import { MarketOptionButtons } from "@/components/market-option-buttons";
import { MarketResolved } from "@/components/market-resolved";
import { MarketPending } from "@/components/market-pending";
import { MarketSharesDisplay } from "@/components/market-shares-display";
import { MarketFavoriteButton } from "@/components/market-favorite-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, TrendingUp, Users, Share2, Clock, BarChart3 } from "lucide-react";
import { formatCurrencyBRCompact } from "@/lib/utils";
import { toEther } from "thirdweb";
import Link from "next/link";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { RelatedMarkets } from "@/components/related-markets";
import { ProbabilityChart } from "@/components/probability-chart";
import { saveOddsSnapshot } from "@/lib/odds-history";
import { useState, useEffect, useMemo, useRef } from "react";

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

interface SharesBalance {
  optionAShares: bigint;
  optionBShares: bigint;
}

export default function MarketDetailPage() {
  const params = useParams();
  const marketId = Number(params.id);
  const account = useActiveAccount();
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedOption, setSelectedOption] = useState<"A" | "B" | null>(null);

  // Get market count for related markets
  const { data: marketCountData } = useReadContract({
    contract,
    method: "function marketCount() view returns (uint256)",
    params: [],
  });

  const { data: marketData, isLoading: isLoadingMarketData } = useReadContract({
    contract,
    method:
      "function getMarketInfo(uint256 _marketId) view returns (string question, string optionA, string optionB, uint256 endTime, uint8 outcome, uint256 totalOptionAShares, uint256 totalOptionBShares, bool resolved)",
    params: [BigInt(marketId)],
  });

  const { data: sharesBalanceData } = useReadContract({
    contract,
    method:
      "function getSharesBalance(uint256 _marketId, address _user) view returns (uint256 optionAShares, uint256 optionBShares)",
    params: [BigInt(marketId), account?.address as string],
    queryOptions: {
      enabled: !!account?.address,
    },
  });

  const market: Market | undefined = marketData
    ? {
        question: marketData[0],
        optionA: marketData[1],
        optionB: marketData[2],
        endTime: marketData[3],
        outcome: marketData[4],
        totalOptionAShares: marketData[5],
        totalOptionBShares: marketData[6],
        resolved: marketData[7],
      }
    : undefined;

  const sharesBalance: SharesBalance | undefined = sharesBalanceData
    ? {
        optionAShares: sharesBalanceData[0],
        optionBShares: sharesBalanceData[1],
      }
    : undefined;

  const metrics = useMemo(() => {
    if (!market) return null;

    const totalOptionASharesNum = Number(market.totalOptionAShares);
    const totalOptionBSharesNum = Number(market.totalOptionBShares);
    const totalShares = totalOptionASharesNum + totalOptionBSharesNum;
    const totalVolume = Math.floor(
      parseInt(toEther(market.totalOptionAShares + market.totalOptionBShares))
    );

    if (totalShares === 0) {
      return {
        oddsA: null,
        oddsB: null,
        probA: 50,
        probB: 50,
        totalVolume: 0,
        estimatedParticipants: 0,
      };
    }

    const probADecimal = totalOptionASharesNum / totalShares;
    const probBDecimal = totalOptionBSharesNum / totalShares;
    const probA = probADecimal * 100;
    const probB = probBDecimal * 100;
    const oddsA = probADecimal > 0 ? (1 / probADecimal).toFixed(2) : null;
    const oddsB = probBDecimal > 0 ? (1 / probBDecimal).toFixed(2) : null;
    const estimatedParticipants = Math.max(1, Math.floor(totalVolume / 10));

    return {
      oddsA,
      oddsB,
      probA,
      probB,
      totalVolume,
      estimatedParticipants,
    };
  }, [market?.totalOptionAShares, market?.totalOptionBShares]);
  const isExpired = market
    ? new Date(Number(market.endTime) * 1000) < new Date()
    : false;

  // Save odds snapshot for chart (with ref to prevent infinite loops)
  const lastSavedOddsRef = useRef<{ oddsA: number; oddsB: number } | null>(null);
  
  useEffect(() => {
    if (metrics && metrics.oddsA && metrics.oddsB) {
      const oddsA = parseFloat(metrics.oddsA);
      const oddsB = parseFloat(metrics.oddsB);
      
      // Only save if odds actually changed
      if (
        !lastSavedOddsRef.current ||
        lastSavedOddsRef.current.oddsA !== oddsA ||
        lastSavedOddsRef.current.oddsB !== oddsB
      ) {
        saveOddsSnapshot(marketId, oddsA, oddsB);
        lastSavedOddsRef.current = { oddsA, oddsB };
      }
    }
  }, [metrics?.oddsA, metrics?.oddsB, marketId]);

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: market?.question,
        text: `Confira este bolão: ${market?.question}`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  if (isLoadingMarketData) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <div className="fixed top-0 left-0 right-0 z-50 w-full bg-background/95 backdrop-blur-sm border-b-2 border-border/60 shadow-sm">
          <div className="w-full max-w-[1430px] mx-auto px-8 py-6">
            <Navbar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
          </div>
        </div>
        <div className="flex-grow w-full max-w-[1430px] mx-auto px-8 py-4 mt-[120px]">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded mb-4 w-32"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!market) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <div className="fixed top-0 left-0 right-0 z-50 w-full bg-background/95 backdrop-blur-sm border-b-2 border-border/60 shadow-sm">
          <div className="w-full max-w-[1430px] mx-auto px-8 py-6">
            <Navbar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
          </div>
        </div>
        <div className="flex-grow w-full max-w-[1430px] mx-auto px-8 py-4 mt-[120px]">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold text-foreground mb-4">
              Mercado não encontrado
            </h1>
            <Link href="/">
              <Button variant="outline">Voltar para a página inicial</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="fixed top-0 left-0 right-0 z-50 w-full bg-background/95 backdrop-blur-sm border-b-2 border-border/60 shadow-sm">
        <div className="w-full max-w-[1430px] mx-auto px-8 py-6">
          <Navbar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
        </div>
      </div>

      <div className="flex-grow w-full max-w-[1430px] mx-auto px-8 py-4 mt-[120px]">
        {/* Header do Evento */}
        <div className="mb-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <MarketFavoriteButton marketId={marketId} />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleShare}
                  className="h-8"
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  Compartilhar
                </Button>
              </div>
              <h1 className="text-2xl font-bold text-foreground mb-3">
                {market.question}
              </h1>
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  <span className="font-medium">{formatCurrencyBRCompact(metrics?.totalVolume || 0)} Vol.</span>
                </div>
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <MarketTime endTime={market.endTime} className="mb-0" />
                </div>
              </div>
              {metrics && metrics.probA !== undefined && metrics.probB !== undefined && (
                <div className="mt-3 flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-chart-1">
                      {metrics.probA.toFixed(1)}%
                    </span>
                    <span className="text-sm text-muted-foreground">chance</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Layout de Duas Colunas: Gráfico à Esquerda, Compra à Direita */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Coluna Esquerda: Gráfico (2/3) */}
          <div className="lg:col-span-2">
            {market && metrics && metrics.probA !== undefined && metrics.probB !== undefined && (
              <ProbabilityChart
                marketId={marketId}
                optionA={market.optionA}
                optionB={market.optionB}
                currentProbA={metrics.probA}
                currentProbB={metrics.probB}
              />
            )}
          </div>

          {/* Coluna Direita: Card de Compra (1/3) */}
          <div className="lg:col-span-1">
            <Card className="sticky top-[140px]">
              <CardContent className="p-6 space-y-6">
                {/* Informações do Mercado */}
                {metrics && (
                  <div className="space-y-3 pb-4 border-b border-border">
                    <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Estatísticas do Mercado
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
                        <div className="flex items-center gap-1.5 mb-1">
                          <TrendingUp className="h-3.5 w-3.5 text-primary" />
                          <div className="text-xs text-muted-foreground">Volume</div>
                        </div>
                        <div className="text-sm font-semibold text-foreground">
                          {formatCurrencyBRCompact(metrics.totalVolume)}
                        </div>
                      </div>
                      <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
                        <div className="flex items-center gap-1.5 mb-1">
                          <Users className="h-3.5 w-3.5 text-primary" />
                          <div className="text-xs text-muted-foreground">Participantes</div>
                        </div>
                        <div className="text-sm font-semibold text-foreground">
                          ~{metrics.estimatedParticipants}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {isExpired ? (
                  market.resolved ? (
                    <MarketResolved
                      marketId={marketId}
                      outcome={market.outcome}
                      optionA={market.optionA}
                      optionB={market.optionB}
                      sharesBalance={sharesBalance}
                    />
                  ) : (
                    <MarketPending />
                  )
                ) : (
                  <>
                    {/* Botões Sim/Não */}
                    <MarketOptionButtons
                      optionA={market.optionA}
                      optionB={market.optionB}
                      onSelectOption={(option) => setSelectedOption(option)}
                    />

                    {/* Interface de Compra */}
                  <MarketBuyInterface
                    marketId={marketId}
                    market={market}
                    selectedOption={selectedOption}
                    onCancel={() => setSelectedOption(null)}
                    currentProbA={metrics?.probA}
                    currentProbB={metrics?.probB}
                  />
                  </>
                )}

                {/* Suas Cotas e Ganhos Potenciais */}
                {sharesBalance && (
                  <MarketSharesDisplay
                    market={market}
                    sharesBalance={sharesBalance}
                  />
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Mercados Relacionados */}
        {market && marketCountData && Number(marketCountData) > 1 && (
          <RelatedMarkets
            currentMarketId={marketId}
            currentQuestion={market.question}
            marketCount={Number(marketCountData)}
          />
        )}
      </div>
      <Footer />
    </div>
  );
}
