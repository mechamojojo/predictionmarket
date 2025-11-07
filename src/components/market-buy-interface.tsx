import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { useState, useRef, useEffect } from "react";
import { useActiveAccount, useSendAndConfirmTransaction } from "thirdweb/react";
import { prepareContractCall, readContract, toWei } from "thirdweb";
import { contract, tokenContract } from "@/constants/contract";
import { approve } from "thirdweb/extensions/erc20";
import { Loader2 } from "lucide-react";
import { cn, formatCurrencyBRCompact } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

// Types for the component props
interface MarketBuyInterfaceProps {
  marketId: number;
  market: {
    optionA: string;
    optionB: string;
    question: string;
  };
  selectedOption: "A" | "B" | null;
  onCancel: () => void;
  currentProbA?: number;
  currentProbB?: number;
}

// Type aliases for better readability
type BuyingStep = "initial" | "allowance" | "confirm";
type Option = "A" | "B" | null;

export function MarketBuyInterface({
  marketId,
  market,
  selectedOption,
  onCancel,
  currentProbA,
  currentProbB,
}: MarketBuyInterfaceProps) {
  // Blockchain interactions
  const account = useActiveAccount();
  const { mutateAsync: mutateTransaction } = useSendAndConfirmTransaction();
  const { toast } = useToast();

  // UI state management
  const [isVisible, setIsVisible] = useState(true);
  const [containerHeight, setContainerHeight] = useState("auto");
  const contentRef = useRef<HTMLDivElement>(null);

  // Transaction state
  const [amount, setAmount] = useState(0);
  const [buyingStep, setBuyingStep] = useState<BuyingStep>("initial");
  const [isApproving, setIsApproving] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);

  // Add to state variables
  const [error, setError] = useState<string | null>(null);

  // Update container height when content changes
  useEffect(() => {
    if (contentRef.current) {
      setTimeout(() => {
        setContainerHeight(`${contentRef.current?.offsetHeight || 0}px`);
      }, 0);
    }
  }, [buyingStep, isVisible, error, selectedOption, amount]);

  const handleCancel = () => {
    setIsVisible(false);
    setTimeout(() => {
      setBuyingStep("initial");
      setAmount(0);
      setError(null);
      setIsVisible(true);
      onCancel();
    }, 200);
  };

  // Check if user needs to approve token spending and go directly to confirmation
  const checkApproval = async () => {
    if (amount <= 0) {
      setError("Amount must be greater than 0");
      return;
    }
    setError(null);

    // Go directly to confirmation step
    setBuyingStep("confirm");
  };

  // Handle share purchase transaction
  const handleConfirm = async () => {
    if (!selectedOption || amount <= 0) {
      setError("Must select an option and enter an amount greater than 0");
      return;
    }

    setIsConfirming(true);
    try {
      // Check if approval is needed and handle it automatically
      const userAllowance = await readContract({
        contract: tokenContract,
        method:
          "function allowance(address owner, address spender) view returns (uint256)",
        params: [account?.address as string, contract.address],
      });

      const requiredAmount = BigInt(toWei(amount.toString()));

      // If approval is needed, do it automatically
      if (userAllowance < requiredAmount) {
        setIsApproving(true);
        const approvalTx = await approve({
          contract: tokenContract,
          spender: contract.address,
          amount: amount,
        });
        await mutateTransaction(approvalTx);
        setIsApproving(false);
      }

      // Now execute the purchase
      const tx = await prepareContractCall({
        contract,
        method:
          "function buyShares(uint256 _marketId, bool _isOptionA, uint256 _amount)",
        params: [
          BigInt(marketId),
          selectedOption === "A",
          BigInt(toWei(amount.toString())),
        ],
      });
      await mutateTransaction(tx);

      // Show success toast
      toast({
        title: "Compra Realizada!",
        description: `Você comprou ${formatCurrencyBRCompact(
          amount
        )} em cotas de ${
          selectedOption === "A" ? market.optionA : market.optionB
        }`,
        duration: 5000,
      });

      handleCancel();
    } catch (error) {
      console.error(error);
      // Optionally show error toast
      toast({
        title: "Compra Falhou",
        description: "Ocorreu um erro ao processar sua compra",
        variant: "destructive",
      });
    } finally {
      setIsConfirming(false);
      setIsApproving(false);
    }
  };

  // Don't render if no option is selected
  if (!selectedOption) {
    return null;
  }

  // Render the component
  return (
    <div
      className="relative transition-[height] duration-200 ease-in-out"
      style={{ minHeight: containerHeight }}
    >
      <div
        ref={contentRef}
        className={cn(
          "w-full transition-all duration-200 ease-in-out",
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        )}
      >
        {/* Buy interface with different steps */}
        <div className="flex flex-col mb-4">
          {buyingStep === "confirm" ? (
            // Single confirmation step
            <div className="flex flex-col border-2 border-border rounded-xl p-5 bg-card/50 overflow-hidden">
              <p className="mb-4 text-sm font-medium text-foreground">
                Aplicar{" "}
                <span className="font-semibold text-chart-1">
                  {new Intl.NumberFormat("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  }).format(amount)}{" "}
                </span>
                em{" "}
                <span className="font-semibold text-chart-1">
                  "{selectedOption === "A" ? market.optionA : market.optionB}"
                </span>
                ?
              </p>
              <div className="flex justify-end gap-2 flex-wrap">
                <Button
                  onClick={handleConfirm}
                  disabled={isConfirming || isApproving}
                  className="font-semibold whitespace-nowrap"
                >
                  {isConfirming || isApproving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {isApproving ? "Aprovando..." : "Confirmando..."}
                    </>
                  ) : (
                    "Confirmar"
                  )}
                </Button>
                <Button
                  onClick={handleCancel}
                  variant="outline"
                  disabled={isConfirming || isApproving}
                  className="whitespace-nowrap"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          ) : (
            // Amount input step
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground mb-2 font-medium">
                {`1 ${
                  selectedOption === "A" ? market.optionA : market.optionB
                } = ${formatCurrencyBRCompact(1)}`}
              </span>
              <div className="flex flex-col gap-1 mb-4">
                <div className="flex items-center gap-2 overflow-visible">
                  <div className="flex-grow relative">
                    <Input
                      type="number"
                      min="0"
                      step="1"
                      placeholder="Digite a quantidade"
                      value={amount}
                      onChange={(e) => {
                        const value = Math.max(0, Number(e.target.value));
                        setAmount(value);
                        setError(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "-" || e.key === "e") {
                          e.preventDefault();
                        }
                      }}
                      className={cn(
                        "w-full",
                        error && "border-red-500 focus-visible:ring-red-500"
                      )}
                    />
                  </div>
                  <span className="font-bold whitespace-nowrap">
                    {selectedOption === "A" ? market.optionA : market.optionB}
                  </span>
                </div>
                <div className="min-h-[20px]">
                  {error && (
                    <span className="text-sm text-red-500">{error}</span>
                  )}
                </div>
              </div>

              {/* Ganho Potencial */}
              {amount > 0 && selectedOption && (
                <div className="mb-4 p-3 rounded-lg bg-primary/5 border border-primary/10">
                  <div className="text-xs text-muted-foreground mb-1">
                    Ganho potencial:
                  </div>
                  <div className="text-lg font-bold text-primary">
                    {(() => {
                      const prob =
                        selectedOption === "A"
                          ? currentProbA || 50
                          : currentProbB || 50;
                      const probDecimal = prob / 100;
                      // Cálculo: valor total que será recebido se ganhar
                      // Valor total = investimento / probabilidade
                      // Exemplo: R$ 10 investidos com 55.9% de probabilidade = R$ 10 / 0.559 = R$ 17.89
                      const totalPayout =
                        amount > 0 && probDecimal > 0
                          ? amount / probDecimal
                          : 0;
                      return new Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      }).format(totalPayout);
                    })()}
                  </div>
                </div>
              )}

              <div className="flex justify-between gap-3">
                <Button onClick={checkApproval} className="flex-1">
                  Confirmar
                </Button>
                <Button
                  onClick={handleCancel}
                  variant="outline"
                  className="flex-1"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
