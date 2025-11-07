import { Button } from "./ui/button";
import { prepareContractCall } from "thirdweb";
import { useSendAndConfirmTransaction } from "thirdweb/react";
import { contract } from "@/constants/contract";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

interface MarketResolvedProps {
  marketId: number;
  outcome: number | bigint; // can be bigint from RPC
  optionA: string;
  optionB: string;
  sharesBalance?: {
    optionAShares: bigint;
    optionBShares: bigint;
  };
}

const OUTCOMES = {
  UNRESOLVED: 0,
  OPTION_A: 1,
  OPTION_B: 2,
} as const;

export function MarketResolved({
  marketId,
  outcome,
  optionA,
  optionB,
  sharesBalance,
}: MarketResolvedProps) {
  const { mutateAsync: mutateTransaction } = useSendAndConfirmTransaction();
  const { toast } = useToast();
  const [isClaiming, setIsClaiming] = useState(false);

  const o = Number(outcome); // normalize

  const winnerLabel =
    o === OUTCOMES.OPTION_A
      ? optionA
      : o === OUTCOMES.OPTION_B
      ? optionB
      : "Pending";

  const isResolved = o === OUTCOMES.OPTION_A || o === OUTCOMES.OPTION_B;

  // Verificar se o usuário tem prêmios para resgatar
  const hasWinningsToClaim = () => {
    if (!isResolved || !sharesBalance) return false;
    
    // Se a opção A ganhou e o usuário tem shares na opção A
    if (o === OUTCOMES.OPTION_A && sharesBalance.optionAShares > 0) {
      return true;
    }
    
    // Se a opção B ganhou e o usuário tem shares na opção B
    if (o === OUTCOMES.OPTION_B && sharesBalance.optionBShares > 0) {
      return true;
    }
    
    return false;
  };

  const hasWinnings = hasWinningsToClaim();

  const handleClaimRewards = async () => {
    if (!hasWinnings) {
      toast({
        title: "Sem prêmios para resgatar",
        description: "Você não possui cotas vencedoras neste bolão para resgatar.",
        variant: "destructive",
      });
      return;
    }

    setIsClaiming(true);
    try {
      const tx = await prepareContractCall({
        contract,
        method: "function claimWinnings(uint256 _marketId)",
        params: [BigInt(marketId)],
      });
      await mutateTransaction(tx);
      
      toast({
        title: "Prêmios Resgatados!",
        description: "Seus créditos foram adicionados com sucesso.",
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "Erro ao Resgatar",
        description: "Ocorreu um erro ao resgatar seus prêmios. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsClaiming(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div
        className={`p-3 rounded-lg text-center text-sm font-medium border transition-none ${
          isResolved 
            ? "bg-primary/10 text-primary border-primary/20" 
            : "bg-chart-3/10 text-chart-3 border-chart-3/20"
        }`}
      >
        {isResolved ? "✅ Resolvido" : "⏳ Aguardando resolução"}: <span className="font-semibold">{winnerLabel}</span>
      </div>

      <Button
        variant={hasWinnings ? "default" : "outline"}
        className={`w-full ${
          hasWinnings
            ? "bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-md"
            : "bg-muted/50 text-muted-foreground border-muted-foreground/30 opacity-60 hover:opacity-70"
        }`}
        onClick={handleClaimRewards}
        disabled={!isResolved || isClaiming}
      >
        {isClaiming
          ? "Resgatando..."
          : isResolved
          ? hasWinnings
            ? "💰 Reivindicar Prêmios"
            : "Sem Prêmios para Resgatar"
          : "Aguardando Resolução"}
      </Button>
    </div>
  );
}
