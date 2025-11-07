"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrencyBRCompact } from "@/lib/utils";
import { toEther } from "thirdweb";
import Link from "next/link";
import { Clock, CheckCircle2, XCircle, ArrowRight, TrendingUp, TrendingDown } from "lucide-react";

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

interface UserMarketData {
  marketId: number;
  market: Market;
  sharesBalance: SharesBalance;
  totalInvested: number;
  potentialWinnings: number;
  isWinner: boolean | null;
}

interface ActivityTimelineProps {
  userMarkets: UserMarketData[];
}

export function ActivityTimeline({ userMarkets }: ActivityTimelineProps) {
  // Ordenar mercados por data (mais recentes primeiro)
  const sortedMarkets = [...userMarkets].sort((a, b) => {
    const timeA = Number(a.market.endTime);
    const timeB = Number(b.market.endTime);
    return timeB - timeA; // Mais recentes primeiro
  });

  if (sortedMarkets.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-2">Nenhuma atividade encontrada</p>
        <p className="text-sm text-muted-foreground">
          Suas ações na plataforma aparecerão aqui
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {sortedMarkets.map((data) => {
        const isResolved = data.market.resolved;
        const isWinner = data.isWinner === true;
        const endDate = new Date(Number(data.market.endTime) * 1000);
        const now = new Date();
        const isExpired = endDate < now;

        return (
          <div
            key={data.marketId}
            className="flex items-start gap-4 p-4 border border-border rounded-lg hover:bg-muted/30 transition-colors"
          >
            <div className="flex-shrink-0 mt-1">
              {isResolved ? (
                isWinner ? (
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                ) : (
                  <XCircle className="h-5 w-5 text-destructive" />
                )
              ) : (
                <Clock className="h-5 w-5 text-muted-foreground" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-4 mb-2">
                <div className="flex-1 min-w-0">
                  <Link href={`/evento/${data.marketId}`}>
                    <h4 className="font-semibold text-foreground hover:text-primary transition-colors cursor-pointer line-clamp-2">
                      {data.market.question}
                    </h4>
                  </Link>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    {Number(toEther(data.sharesBalance.optionAShares)) > 0 && (
                      <Badge variant="outline" className="text-xs">
                        {data.market.optionA}: {formatCurrencyBRCompact(Number(toEther(data.sharesBalance.optionAShares)))}
                      </Badge>
                    )}
                    {Number(toEther(data.sharesBalance.optionBShares)) > 0 && (
                      <Badge variant="outline" className="text-xs">
                        {data.market.optionB}: {formatCurrencyBRCompact(Number(toEther(data.sharesBalance.optionBShares)))}
                      </Badge>
                    )}
                  </div>
                </div>
                <Link href={`/evento/${data.marketId}`}>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 flex-shrink-0">
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>

              <div className="flex items-center gap-4 text-sm mt-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Investido:</span>
                  <span className="font-semibold text-foreground">
                    {formatCurrencyBRCompact(data.totalInvested)}
                  </span>
                </div>

                {isResolved ? (
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Resultado:</span>
                    {isWinner ? (
                      <span className="font-semibold text-primary flex items-center gap-1">
                        <TrendingUp className="h-3.5 w-3.5" />
                        Ganhou {formatCurrencyBRCompact(data.potentialWinnings)}
                      </span>
                    ) : (
                      <span className="font-semibold text-destructive flex items-center gap-1">
                        <TrendingDown className="h-3.5 w-3.5" />
                        Perdeu
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Ganhos Potenciais:</span>
                    <span className="font-semibold text-primary">
                      {formatCurrencyBRCompact(data.potentialWinnings)}
                    </span>
                  </div>
                )}

                <div className="flex items-center gap-2 ml-auto">
                  <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">
                    {isExpired
                      ? `Terminou em ${endDate.toLocaleDateString("pt-BR", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}`
                      : `Termina em ${endDate.toLocaleDateString("pt-BR", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}`}
                  </span>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

