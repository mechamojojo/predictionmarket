"use client";

import { useState } from "react";
import { useActiveAccount, useReadContract, useSendAndConfirmTransaction } from "thirdweb/react";
import { prepareContractCall, toWei } from "thirdweb";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { tokenContract } from "@/constants/contract";
import { toEther } from "thirdweb";
import { formatCurrencyBRCompact } from "@/lib/utils";

interface PixWithdrawalProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

/**
 * Componente para saque via PIX
 * 
 * Fluxo:
 * 1. Usuário insere valor em BRL e chave PIX
 * 2. Sistema verifica saldo
 * 3. Sistema queima tokens do usuário
 * 4. Sistema envia PIX ao usuário
 */
export function PixWithdrawal({ onSuccess, onCancel }: PixWithdrawalProps) {
  const account = useActiveAccount();
  const { mutateAsync: mutateTransaction } = useSendAndConfirmTransaction();
  const { toast } = useToast();
  const [amount, setAmount] = useState("");
  const [pixKey, setPixKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [burningTokens, setBurningTokens] = useState(false);
  const [withdrawalStatus, setWithdrawalStatus] = useState<"pending" | "processing" | "burning" | "success" | "error">("pending");

  // Get user's token balance
  const { data: tokenBalance, isLoading: isLoadingBalance } = useReadContract({
    contract: tokenContract,
    method: "function balanceOf(address owner) view returns (uint256)",
    params: [account?.address as string],
    queryOptions: {
      enabled: !!account?.address,
      refetchInterval: 2000,
    },
  });

  const balanceInReais = tokenBalance
    ? formatCurrencyBRCompact(Number(toEther(tokenBalance)))
    : "R$ 0,00";
  const numericBalance = tokenBalance
    ? Number(toEther(tokenBalance))
    : 0;

  const handleWithdraw = async () => {
    if (!account) {
      toast({
        title: "Erro",
        description: "Conecte sua carteira primeiro",
        variant: "destructive",
      });
      return;
    }

    const amountNum = parseFloat(amount);
    if (!amount || isNaN(amountNum) || amountNum <= 0) {
      toast({
        title: "Valor inválido",
        description: "Digite um valor válido em BRL",
        variant: "destructive",
      });
      return;
    }

    if (amountNum > numericBalance) {
      toast({
        title: "Saldo insuficiente",
        description: `Você não possui créditos suficientes. Saldo atual: ${balanceInReais}`,
        variant: "destructive",
      });
      return;
    }

    if (!pixKey || pixKey.trim().length === 0) {
      toast({
        title: "Chave PIX obrigatória",
        description: "Digite uma chave PIX válida (CPF, CNPJ, email, telefone ou chave aleatória)",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setWithdrawalStatus("burning");

    try {
      // 1. Primeiro, queimar os tokens do usuário (transfer para endereço zero)
      // Isso remove os tokens permanentemente do saldo do usuário
      setBurningTokens(true);
      const burnAddress = "0x0000000000000000000000000000000000000000";
      const tokenAmount = BigInt(toWei(amountNum.toString()));

      const burnTx = await prepareContractCall({
        contract: tokenContract,
        method: "function transfer(address to, uint256 amount) returns (bool)",
        params: [burnAddress, tokenAmount],
      });

      await mutateTransaction(burnTx);
      setBurningTokens(false);

      // 2. Depois que os tokens foram queimados, chamar a API para processar o PIX
      setWithdrawalStatus("processing");
      
      const response = await fetch("/api/withdraw", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: amountNum,
          userAddress: account.address,
          pixKey: pixKey.trim(),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        let errorMessage = error.error || "Erro ao processar saque";
        
        if (error.details) {
          if (typeof error.details === "string") {
            errorMessage = `${errorMessage}: ${error.details}`;
          } else if (error.details.message) {
            errorMessage = `${errorMessage}: ${error.details.message}`;
          }
        }
        
        console.error("[SAQUE] Erro detalhado:", error);
        throw new Error(errorMessage);
      }

      const data = await response.json();
      
      if (data.success) {
        setWithdrawalStatus("success");
        toast({
          title: "Saque Processado!",
          description: `Seus ${formatCurrencyBRCompact(amountNum)} estão sendo enviados via PIX.`,
          duration: 5000,
        });
        
        if (onSuccess) {
          setTimeout(onSuccess, 2000);
        }
      } else {
        throw new Error(data.error || "Erro ao processar saque");
      }
    } catch (error) {
      console.error("Erro ao processar saque:", error);
      setBurningTokens(false);
      setWithdrawalStatus("error");
      toast({
        title: "Erro ao Processar Saque",
        description: error instanceof Error ? error.message : "Ocorreu um erro ao processar seu saque. Por favor, tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMaxAmount = () => {
    if (numericBalance > 0) {
      setAmount(numericBalance.toFixed(2));
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Saldo atual */}
      <div className="bg-muted/50 rounded-lg p-4 border border-border">
        <div className="text-sm text-muted-foreground mb-1">Saldo Disponível</div>
        <div className="text-2xl font-bold text-foreground">
          {isLoadingBalance ? (
            <Loader2 className="h-6 w-6 animate-spin" />
          ) : (
            balanceInReais
          )}
        </div>
      </div>

      {/* Formulário de saque */}
      {withdrawalStatus === "success" ? (
        <div className="text-center space-y-4 py-8">
          <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
            <ArrowDown className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Saque Processado!
            </h3>
            <p className="text-sm text-muted-foreground">
              Seus {formatCurrencyBRCompact(parseFloat(amount))} estão sendo enviados via PIX.
              <br />
              Você receberá o pagamento em alguns minutos.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Valor */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Valor do Saque (R$)
            </label>
            <div className="flex gap-2">
              <Input
                type="number"
                step="0.01"
                min="0.01"
                max={numericBalance}
                placeholder="0,00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={loading || isLoadingBalance}
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleMaxAmount}
                disabled={loading || isLoadingBalance || numericBalance <= 0}
                className="shrink-0"
              >
                Máximo
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Valor mínimo: R$ 0,01
            </p>
          </div>

          {/* Chave PIX */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Chave PIX
            </label>
            <Input
              type="text"
              placeholder="CPF, CNPJ, email, telefone ou chave aleatória"
              value={pixKey}
              onChange={(e) => setPixKey(e.target.value)}
              disabled={loading}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              Digite a chave PIX que receberá o pagamento
            </p>
          </div>

          {/* Aviso importante */}
          <div className="bg-primary/10 border border-primary/20 rounded-lg p-3">
            <p className="text-xs text-primary font-medium">
              ⚠️ Atenção: Ao confirmar, os créditos serão removidos permanentemente da sua conta e enviados via PIX.
            </p>
          </div>

          {/* Botões */}
          <div className="flex gap-3 pt-2">
            {onCancel && (
              <Button
                variant="outline"
                onClick={onCancel}
                disabled={loading}
                className="flex-1"
              >
                Cancelar
              </Button>
            )}
            <Button
              onClick={handleWithdraw}
              disabled={loading || isLoadingBalance || !amount || !pixKey || parseFloat(amount) <= 0 || parseFloat(amount) > numericBalance}
              className={cn(
                "flex-1 bg-primary hover:bg-primary/90 text-white",
                loading && "opacity-50 cursor-not-allowed"
              )}
            >
              {burningTokens ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Queimando tokens...
                </>
              ) : loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processando PIX...
                </>
              ) : (
                "Confirmar Saque"
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

