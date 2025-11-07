"use client";

import { useReadContract } from "thirdweb/react";
import { contract } from "@/constants/contract";
import { useActiveAccount } from "thirdweb/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toEther } from "thirdweb";
import { formatCurrencyBRCompact } from "@/lib/utils";
import Link from "next/link";
import { ArrowRight, TrendingUp, TrendingDown } from "lucide-react";
import { useEffect, useRef } from "react";

interface UserMarketItemProps {
  marketId: number;
  onDataLoaded?: (data: {
    marketId: number;
    market: {
      question: string;
      optionA: string;
      optionB: string;
      endTime: bigint;
      outcome: number;
      totalOptionAShares: bigint;
      totalOptionBShares: bigint;
      resolved: boolean;
    };
    sharesBalance: {
      optionAShares: bigint;
      optionBShares: bigint;
    };
    totalInvested: number;
    potentialWinnings: number;
    isWinner: boolean | null;
  }) => void;
}

export function UserMarketItem({
  marketId,
  onDataLoaded,
}: UserMarketItemProps) {
  const account = useActiveAccount();

  const { data: marketData } = useReadContract({
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
      enabled: !!account?.address && !!marketData,
    },
  });

  if (!marketData || !sharesBalanceData) {
    return null;
  }

  const market = {
    question: marketData[0],
    optionA: marketData[1],
    optionB: marketData[2],
    endTime: marketData[3],
    outcome: marketData[4],
    totalOptionAShares: marketData[5],
    totalOptionBShares: marketData[6],
    resolved: marketData[7],
  };

  const sharesBalance = {
    optionAShares: sharesBalanceData[0],
    optionBShares: sharesBalanceData[1],
  };

  // Verificar se usuário tem cotas
  const hasShares =
    Number(sharesBalance.optionAShares) > 0 ||
    Number(sharesBalance.optionBShares) > 0;

  if (!hasShares) {
    return null;
  }

  const hasLoadedRef = useRef(false);

  // Calcular métricas
  const totalInvested =
    Number(toEther(sharesBalance.optionAShares)) +
    Number(toEther(sharesBalance.optionBShares));

  const totalShares =
    Number(toEther(market.totalOptionAShares)) +
    Number(toEther(market.totalOptionBShares));

  let potentialWinnings = 0;
  let isWinner: boolean | null = null;

  if (market.resolved) {
    if (totalShares > 0) {
      if (market.outcome === 0) {
        // Option A ganhou
        const winningShares = Number(toEther(sharesBalance.optionAShares));
        if (winningShares > 0) {
          const totalWinningShares = Number(toEther(market.totalOptionAShares));
          potentialWinnings = (totalShares * winningShares) / totalWinningShares;
          isWinner = true;
        } else {
          isWinner = false;
        }
      } else {
        // Option B ganhou
        const winningShares = Number(toEther(sharesBalance.optionBShares));
        if (winningShares > 0) {
          const totalWinningShares = Number(toEther(market.totalOptionBShares));
          potentialWinnings = (totalShares * winningShares) / totalWinningShares;
          isWinner = true;
        } else {
          isWinner = false;
        }
      }
    }
  } else {
    // Mercado ainda ativo - calcular ganhos potenciais
    if (totalShares > 0) {
      const sharesA = Number(toEther(sharesBalance.optionAShares));
      const sharesB = Number(toEther(sharesBalance.optionBShares));

      if (sharesA > 0) {
        const totalA = Number(toEther(market.totalOptionAShares));
        if (totalA > 0) {
          potentialWinnings = Math.max(
            potentialWinnings,
            (totalShares * sharesA) / totalA
          );
        }
      }

      if (sharesB > 0) {
        const totalB = Number(toEther(market.totalOptionBShares));
        if (totalB > 0) {
          potentialWinnings = Math.max(
            potentialWinnings,
            (totalShares * sharesB) / totalB
          );
        }
      }
    }
  }

  // Notificar componente pai apenas uma vez
  useEffect(() => {
    if (onDataLoaded && !hasLoadedRef.current) {
      onDataLoaded({
        marketId,
        market,
        sharesBalance,
        totalInvested,
        potentialWinnings,
        isWinner,
      });
      hasLoadedRef.current = true;
    }
  }, [onDataLoaded, marketId, market, sharesBalance, totalInvested, potentialWinnings, isWinner]);

  const sharesA = Number(toEther(sharesBalance.optionAShares));
  const sharesB = Number(toEther(sharesBalance.optionBShares));

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-sm leading-4 line-clamp-2 flex-1">
            {market.question}
          </CardTitle>
          <Link href={`/evento/${marketId}`}>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          {sharesA > 0 && (
            <Badge variant="outline" className="text-xs py-0.5 px-1.5">
              {market.optionA}: {formatCurrencyBRCompact(sharesA)}
            </Badge>
          )}
          {sharesB > 0 && (
            <Badge variant="outline" className="text-xs py-0.5 px-1.5">
              {market.optionB}: {formatCurrencyBRCompact(sharesB)}
            </Badge>
          )}
        </div>

        <div className="space-y-0.5 text-xs">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Investido:</span>
            <span className="font-semibold">
              {formatCurrencyBRCompact(totalInvested)}
            </span>
          </div>
          {market.resolved ? (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Resultado:</span>
              <span
                className={`font-semibold flex items-center gap-1 ${
                  isWinner ? "text-primary" : "text-destructive"
                }`}
              >
                {isWinner ? (
                  <>
                    <TrendingUp className="h-2.5 w-2.5" />
                    Ganhou {formatCurrencyBRCompact(potentialWinnings)}
                  </>
                ) : (
                  <>
                    <TrendingDown className="h-2.5 w-2.5" />
                    Perdeu
                  </>
                )}
              </span>
            </div>
          ) : (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Ganhos Potenciais:</span>
              <span className="font-semibold text-primary">
                {formatCurrencyBRCompact(potentialWinnings)}
              </span>
            </div>
          )}
        </div>

        <Link href={`/evento/${marketId}`}>
          <Button variant="outline" className="w-full text-xs h-8">
            Ver Detalhes
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}

