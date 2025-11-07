"use client";

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { useActiveAccount, useReadContract } from "thirdweb/react";
import { contract } from "@/constants/contract";
import { MarketProgress } from "./market-progress";
import { MarketCardSkeleton } from "./market-card-skeleton";
import { MarketResolved } from "./market-resolved";
import { MarketPending } from "./market-pending";
import { MarketBuyInterface } from "./market-buy-interface";
import { MarketOptionButtons } from "./market-option-buttons";
import { MarketSharesDisplay } from "./market-shares-display";
import { MarketFavoriteButton } from "./market-favorite-button";
import { detectMarketCategory, MarketCategory } from "@/lib/market-categories";
import { formatCurrencyBRCompact } from "@/lib/utils";
import { toEther } from "thirdweb";
import { TrendingUp } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

// Props for the MarketCard component
// index is the market id
// filter is the filter to apply to the market
interface MarketCardProps {
  index: number;
  filter: "active" | "pending" | "resolved";
  searchQuery?: string;
  selectedCategory?: MarketCategory | "all";
}

// Interface for the market data
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

// Interface for the shares balance
interface SharesBalance {
  optionAShares: bigint;
  optionBShares: bigint;
}

export function MarketCard({
  index,
  filter,
  searchQuery = "",
  selectedCategory,
}: MarketCardProps) {
  // Get the active account
  const account = useActiveAccount();
  const [selectedOption, setSelectedOption] = useState<"A" | "B" | null>(null);

  // Get the market data
  const { data: marketData, isLoading: isLoadingMarketData } = useReadContract({
    contract,
    method:
      "function getMarketInfo(uint256 _marketId) view returns (string question, string optionA, string optionB, uint256 endTime, uint8 outcome, uint256 totalOptionAShares, uint256 totalOptionBShares, bool resolved)",
    params: [BigInt(index)],
  });

  // Parse the market data
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

  // Get the shares balance
  const { data: sharesBalanceData } = useReadContract({
    contract,
    method:
      "function getSharesBalance(uint256 _marketId, address _user) view returns (uint256 optionAShares, uint256 optionBShares)",
    params: [BigInt(index), account?.address as string],
  });

  // Parse the shares balance
  const sharesBalance: SharesBalance | undefined = sharesBalanceData
    ? {
        optionAShares: sharesBalanceData[0],
        optionBShares: sharesBalanceData[1],
      }
    : undefined;

  // Check if the market should be shown
  const shouldShow = () => {
    if (!market) return false;

    // Check if the market is expired
    const isExpired = new Date(Number(market.endTime) * 1000) < new Date();
    // Check if the market is resolved
    const isResolved = market.resolved ?? false;

    // Filtro por status (active, pending, resolved)
    let matchesFilter = false;
    switch (filter) {
      case "active":
        matchesFilter = !isExpired;
        break;
      case "pending":
        matchesFilter = isExpired && !isResolved;
        break;
      case "resolved":
        matchesFilter = isExpired && isResolved;
        break;
      default:
        matchesFilter = true;
    }

    if (!matchesFilter) return false;

    // Filtro por categoria
    if (selectedCategory && selectedCategory !== "all") {
      const marketCategory = detectMarketCategory(market.question);
      if (marketCategory !== selectedCategory) {
        return false;
      }
    }

    // Filtro por busca
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      const searchText =
        `${market.question} ${market.optionA} ${market.optionB}`.toLowerCase();
      return searchText.includes(query);
    }

    return true;
  };

  // If the market should not be shown, return null
  if (!shouldShow()) {
    return null;
  }

  // Calcular probabilidades para o MarketBuyInterface
  const calculateProbabilities = () => {
    if (!market) return { probA: 50, probB: 50 };

    const totalOptionASharesNum = Number(market.totalOptionAShares);
    const totalOptionBSharesNum = Number(market.totalOptionBShares);
    const totalShares = totalOptionASharesNum + totalOptionBSharesNum;

    if (totalShares === 0) {
      return { probA: 50, probB: 50 };
    }

    // Calcular probabilidades em decimal (0 a 1)
    const probADecimal = totalOptionASharesNum / totalShares;
    const probBDecimal = totalOptionBSharesNum / totalShares;

    // Converter para porcentagem para exibição
    const probA = probADecimal * 100;
    const probB = probBDecimal * 100;

    return { probA, probB };
  };

  const probabilities = calculateProbabilities();

  // Calcular volume total
  const totalVolume = market
    ? Math.floor(
        parseInt(toEther(market.totalOptionAShares + market.totalOptionBShares))
      )
    : 0;

  return (
    <Card key={index} className="flex flex-col card-hover transition-none">
      {isLoadingMarketData ? (
        <MarketCardSkeleton />
      ) : (
        <>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <Link href={`/evento/${index}`}>
                  <CardTitle className="text-lg leading-6 hover:text-primary transition-colors cursor-pointer">
                    {market?.question}
                  </CardTitle>
                </Link>
                {totalVolume > 0 && (
                  <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground">
                    <TrendingUp className="h-3.5 w-3.5 text-primary" />
                    <span className="font-medium text-primary">
                      {formatCurrencyBRCompact(totalVolume)} Vol.
                    </span>
                  </div>
                )}
              </div>
              {market && <MarketFavoriteButton marketId={index} />}
            </div>
          </CardHeader>
          <CardContent className="transition-none">
            {market && (
              <MarketProgress
                optionA={market.optionA}
                optionB={market.optionB}
                totalOptionAShares={market.totalOptionAShares}
                totalOptionBShares={market.totalOptionBShares}
              />
            )}
            <div className="transition-none space-y-3">
              {new Date(Number(market?.endTime) * 1000) < new Date() ? (
                market?.resolved ? (
                  <MarketResolved
                    marketId={index}
                    outcome={market.outcome}
                    optionA={market.optionA}
                    optionB={market.optionB}
                    sharesBalance={sharesBalance}
                  />
                ) : (
                  <MarketPending />
                )
              ) : (
                market && (
                  <>
                    {/* Botões Sim/Não */}
                    <MarketOptionButtons
                      optionA={market.optionA}
                      optionB={market.optionB}
                      onSelectOption={(option) => setSelectedOption(option)}
                    />
                    
                    {/* Interface de Compra */}
                    <MarketBuyInterface
                      marketId={index}
                      market={market}
                      selectedOption={selectedOption}
                      onCancel={() => setSelectedOption(null)}
                      currentProbA={probabilities.probA}
                      currentProbB={probabilities.probB}
                    />
                  </>
                )
              )}
            </div>
          </CardContent>
          <CardFooter>
            {market && sharesBalance && (
              <MarketSharesDisplay
                market={market}
                sharesBalance={sharesBalance}
                showPotentialGains={false}
                showPotentialOnly={true}
                currentProbA={probabilities.probA}
                currentProbB={probabilities.probB}
              />
            )}
          </CardFooter>
        </>
      )}
    </Card>
  );
}
