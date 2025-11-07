import { Badge } from "./ui/badge";
import { toEther } from "thirdweb";
import { useEffect, useState } from "react";
import { formatCurrencyBRCompact } from "@/lib/utils";

interface MarketSharesDisplayProps {
  market: {
    optionA: string;
    optionB: string;
    totalOptionAShares: bigint;
    totalOptionBShares: bigint;
  };
  sharesBalance: {
    optionAShares: bigint;
    optionBShares: bigint;
  };
  showPotentialGains?: boolean;
  showPotentialOnly?: boolean;
  currentProbA?: number;
  currentProbB?: number;
}

export function MarketSharesDisplay({
  market,
  sharesBalance,
  showPotentialGains = true,
  showPotentialOnly = false,
  currentProbA,
  currentProbB,
}: MarketSharesDisplayProps) {
  const [winnings, setWinnings] = useState<{ A: bigint; B: bigint }>({
    A: BigInt(0),
    B: BigInt(0),
  });

  const calculateWinnings = (option: "A" | "B") => {
    if (!sharesBalance || !market) return BigInt(0);

    const userShares =
      option === "A"
        ? sharesBalance.optionAShares
        : sharesBalance.optionBShares;
    const totalSharesForOption =
      option === "A" ? market.totalOptionAShares : market.totalOptionBShares;
    const totalLosingShares =
      option === "A" ? market.totalOptionBShares : market.totalOptionAShares;

    if (totalSharesForOption === BigInt(0)) return BigInt(0);

    // Calculate user's proportion of the winning side
    const userProportion =
      (userShares * BigInt(1000000)) / totalSharesForOption; // Multiply by 1M for precision

    // Calculate their share of the losing side's shares
    const winningsFromLosingShares =
      (totalLosingShares * userProportion) / BigInt(1000000);

    // Total winnings is their original shares plus their proportion of losing shares
    return userShares + winningsFromLosingShares;
  };

  useEffect(() => {
    if (!sharesBalance || !market) return;

    const newWinnings = {
      A: calculateWinnings("A"),
      B: calculateWinnings("B"),
    };

    // Only update if values actually changed
    if (newWinnings.A !== winnings.A || newWinnings.B !== winnings.B) {
      setWinnings(newWinnings);
    }
  }, [sharesBalance, market.totalOptionAShares, market.totalOptionBShares]);

  const displayWinningsA = formatCurrencyBRCompact(Number(toEther(winnings.A)));
  const displayWinningsB = formatCurrencyBRCompact(Number(toEther(winnings.B)));
  const displaySharesA = formatCurrencyBRCompact(
    Number(toEther(sharesBalance?.optionAShares || BigInt(0)))
  );
  const displaySharesB = formatCurrencyBRCompact(
    Number(toEther(sharesBalance?.optionBShares || BigInt(0)))
  );

  // Calcular potencial de ganho baseado nas probabilidades atuais
  const calculatePotentialGain = (shares: bigint, prob: number | undefined) => {
    if (!shares || shares === BigInt(0) || !prob || prob === 0) return 0;
    const sharesNum = Number(toEther(shares));
    const probDecimal = prob / 100;
    return sharesNum / probDecimal;
  };

  const potentialGainA = currentProbA
    ? calculatePotentialGain(
        sharesBalance?.optionAShares || BigInt(0),
        currentProbA
      )
    : 0;
  const potentialGainB = currentProbB
    ? calculatePotentialGain(
        sharesBalance?.optionBShares || BigInt(0),
        currentProbB
      )
    : 0;

  const displayPotentialA = formatCurrencyBRCompact(potentialGainA);
  const displayPotentialB = formatCurrencyBRCompact(potentialGainB);

  // Se showPotentialOnly, mostrar apenas o potencial
  if (showPotentialOnly) {
    const hasAnyShares = potentialGainA > 0 || potentialGainB > 0;
    if (!hasAnyShares) return null;

    return (
      <div className="flex flex-col gap-2 pt-3 border-t border-border">
        <div className="text-xs font-semibold text-foreground/80">
          Potencial:
        </div>
        <div className="flex gap-2 flex-wrap">
          {potentialGainA > 0 && (
            <Badge
              variant="secondary"
              className="bg-chart-1/10 text-chart-1 border-chart-1/20 font-semibold"
            >
              {market.optionA}: {displayPotentialA}
            </Badge>
          )}
          {potentialGainB > 0 && (
            <Badge
              variant="secondary"
              className="bg-chart-2/10 text-chart-2 border-chart-2/20 font-semibold"
            >
              {market.optionB}: {displayPotentialB}
            </Badge>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 pt-3 border-t border-border">
      <div className="w-full text-sm text-foreground font-medium">
        <span className="text-foreground/80">Suas cotas:</span>{" "}
        <span className="font-semibold text-chart-1">{market.optionA}</span>:{" "}
        <span className="font-semibold text-foreground">{displaySharesA}</span>{" "}
        | <span className="font-semibold text-chart-2">{market.optionB}</span>:{" "}
        <span className="font-semibold text-foreground">{displaySharesB}</span>
      </div>
      {showPotentialGains && (winnings.A > 0 || winnings.B > 0) && (
        <div className="flex flex-col gap-2">
          <div className="text-xs font-semibold text-foreground/80">
            Ganhos potenciais:
          </div>
          <div className="flex gap-2 flex-wrap">
            <Badge
              variant="secondary"
              className="bg-chart-1/10 text-chart-1 border-chart-1/20 font-semibold"
            >
              {market.optionA}: {displayWinningsA}
            </Badge>
            <Badge
              variant="secondary"
              className="bg-chart-2/10 text-chart-2 border-chart-2/20 font-semibold"
            >
              {market.optionB}: {displayWinningsB}
            </Badge>
          </div>
        </div>
      )}
    </div>
  );
}
