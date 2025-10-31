import { Button } from "./ui/button";
import { prepareContractCall } from "thirdweb";
import { useSendAndConfirmTransaction } from "thirdweb/react";
import { contract } from "@/constants/contract";

interface MarketResolvedProps {
  marketId: number;
  outcome: number | bigint; // can be bigint from RPC
  optionA: string;
  optionB: string;
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
}: MarketResolvedProps) {
  const { mutateAsync: mutateTransaction } = useSendAndConfirmTransaction();

  const o = Number(outcome); // normalize

  const winnerLabel =
    o === OUTCOMES.OPTION_A
      ? optionA
      : o === OUTCOMES.OPTION_B
      ? optionB
      : "Pending";

  const isResolved = o === OUTCOMES.OPTION_A || o === OUTCOMES.OPTION_B;

  const handleClaimRewards = async () => {
    try {
      const tx = await prepareContractCall({
        contract,
        method: "function claimWinnings(uint256 _marketId)",
        params: [BigInt(marketId)],
      });
      await mutateTransaction(tx);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div
        className={`mb-2 p-2 rounded-md text-center text-xs ${
          isResolved ? "bg-green-200" : "bg-yellow-200"
        }`}
      >
        {isResolved ? "Resolved" : "Not resolved"}: {winnerLabel}
      </div>

      <Button
        variant="outline"
        className="w-full"
        onClick={handleClaimRewards}
        disabled={!isResolved}
      >
        Claim Rewards
      </Button>
    </div>
  );
}
