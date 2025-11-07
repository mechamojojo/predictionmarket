"use client";

import { useState, useEffect } from "react";
import { useActiveAccount } from "thirdweb/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Copy, Check, QrCode } from "lucide-react";
import { cn } from "@/lib/utils";

interface PixPaymentProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

/**
 * Componente para pagamento via PIX
 * 
 * Fluxo:
 * 1. Usuário insere valor em BRL
 * 2. Gera QR Code PIX
 * 3. Usuário paga via PIX
 * 4. Sistema verifica pagamento e envia créditos automaticamente
 */
export function PixPayment({ onSuccess, onCancel }: PixPaymentProps) {
  const account = useActiveAccount();
  const { toast } = useToast();
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [qrCodeBase64, setQrCodeBase64] = useState<string | null>(null);
  const [preferenceId, setPreferenceId] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<"pending" | "approved" | "error">("pending");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Polling para verificar status do pagamento
    if (preferenceId && paymentStatus === "pending") {
      const interval = setInterval(async () => {
        try {
          const response = await fetch(`/api/pix/create-payment?preferenceId=${preferenceId}`);
          const data = await response.json();
          
          if (data.status === "approved") {
            setPaymentStatus("approved");
            toast({
              title: "Pagamento Aprovado!",
              description: "Seus créditos estão sendo adicionados à sua conta.",
            });
            if (onSuccess) {
              setTimeout(onSuccess, 2000);
            }
            clearInterval(interval);
          }
        } catch (error) {
          console.error("Erro ao verificar status:", error);
        }
      }, 3000); // Verificar a cada 3 segundos

      return () => clearInterval(interval);
    }
  }, [preferenceId, paymentStatus, toast, onSuccess]);

  const handleCreatePayment = async () => {
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

    setLoading(true);
    try {
      const response = await fetch("/api/pix/create-payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: amountNum,
          recipientAddress: account.address,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        // Mensagem de erro mais detalhada
        let errorMessage = error.error || "Erro ao criar pedido PIX";
        
        // Se houver detalhes adicionais, adicionar ao erro
        if (error.details) {
          if (typeof error.details === "string") {
            errorMessage = `${errorMessage}: ${error.details}`;
          } else if (error.details.message) {
            errorMessage = `${errorMessage}: ${error.details.message}`;
          }
        }
        
        console.error("[PIX] Erro detalhado:", error);
        throw new Error(errorMessage);
      }

      const data = await response.json();
      setQrCode(data.qrCode);
      setQrCodeBase64(data.qrCodeBase64);
      setPreferenceId(data.preferenceId);
      setPaymentStatus("pending");

      toast({
        title: "QR Code PIX Gerado!",
        description: "Escaneie o QR Code ou copie o código PIX para pagar.",
      });
    } catch (error) {
      console.error("Erro ao criar pagamento:", error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao criar pedido PIX",
        variant: "destructive",
      });
      setPaymentStatus("error");
    } finally {
      setLoading(false);
    }
  };

  const copyPixCode = () => {
    if (qrCode) {
      navigator.clipboard.writeText(qrCode);
      setCopied(true);
      toast({
        title: "Código PIX copiado!",
        description: "Cole no app do seu banco para pagar.",
      });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!account) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-600">Conecte sua carteira para adicionar créditos via PIX</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      {!qrCode ? (
        // Formulário inicial
        <div className="space-y-4">
          <div className="text-center mb-4">
            <p className="text-sm text-gray-600">
              Deposite na sua carteira via PIX. O valor será creditado automaticamente.
            </p>
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">
              Valor em BRL (R$)
            </label>
            <div className="flex gap-2">
              <Input
                type="number"
                min="1"
                step="0.01"
                placeholder="Ex: 50.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="flex-1"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Valor mínimo: R$ 1,00
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleCreatePayment}
              disabled={loading || !amount}
              className="flex-1"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Gerando QR Code...
                </>
              ) : (
                <>
                  <QrCode className="mr-2 h-4 w-4" />
                  Gerar QR Code PIX
                </>
              )}
            </Button>
            {onCancel && (
              <Button onClick={onCancel} variant="outline">
                Cancelar
              </Button>
            )}
          </div>
        </div>
      ) : (
        // Exibir QR Code e status
        <div className="space-y-4">
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-2">Pague com PIX</h3>
            <p className="text-sm text-gray-600">
              Escaneie o QR Code ou copie o código PIX
            </p>
          </div>

          {/* QR Code */}
          {qrCodeBase64 ? (
            <div className="flex justify-center">
              <div className="p-4 bg-card rounded-lg border-2 border-border">
                <img
                  src={qrCodeBase64}
                  alt="QR Code PIX"
                  className="w-64 h-64"
                />
              </div>
            </div>
          ) : qrCode ? (
            <div className="flex justify-center">
              <div className="p-4 bg-card rounded-lg border-2 border-border">
                {/* Fallback: mostrar código PIX se não houver imagem */}
                <div className="w-64 h-64 flex items-center justify-center text-xs text-gray-500">
                  Use o código PIX abaixo
                </div>
              </div>
            </div>
          ) : null}

          {/* Código PIX para copiar */}
          {qrCode && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Código PIX:</label>
              <div className="flex gap-2">
                <div className="flex-1 p-3 bg-muted rounded-lg font-mono text-xs break-all">
                  {qrCode}
                </div>
                <Button onClick={copyPixCode} variant="outline" size="sm">
                  {copied ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Status do pagamento */}
          <div
            className={cn(
              "p-4 rounded-lg",
              paymentStatus === "pending" && "bg-chart-3/10 border border-chart-3/20",
              paymentStatus === "approved" && "bg-primary/10 border border-primary/20",
              paymentStatus === "error" && "bg-destructive/10 border border-destructive/20"
            )}
          >
            {paymentStatus === "pending" && (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-chart-3" />
                <p className="text-sm text-chart-3">
                  Aguardando confirmação do pagamento...
                </p>
              </div>
            )}
            {paymentStatus === "approved" && (
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary" />
                <p className="text-sm text-primary">
                  Pagamento aprovado! Créditos sendo adicionados...
                </p>
              </div>
            )}
            {paymentStatus === "error" && (
              <div>
                <p className="text-sm text-destructive">
                  Erro ao processar pagamento. Tente novamente.
                </p>
              </div>
            )}
          </div>

          {/* Informações */}
          <div className="p-4 bg-chart-3/10 rounded-lg border border-chart-3/20">
            <p className="text-sm text-chart-3 mb-2">
              <strong>💰 Depósito:</strong> O valor será creditado automaticamente na sua carteira.
            </p>
            <p className="text-sm text-chart-3">
              <strong>Como pagar:</strong>
            </p>
            <ul className="text-sm text-chart-3/90 mt-2 space-y-1 list-disc list-inside">
              <li>Abra o app do seu banco</li>
              <li>Escaneie o QR Code ou cole o código PIX</li>
              <li>Confirme o pagamento</li>
              <li>Os créditos serão adicionados automaticamente após confirmação</li>
            </ul>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={() => {
                setQrCode(null);
                setQrCodeBase64(null);
                setPreferenceId(null);
                setAmount("");
                setPaymentStatus("pending");
              }}
              variant="outline"
              className="flex-1"
            >
              Novo Pagamento
            </Button>
            {onCancel && (
              <Button onClick={onCancel} variant="outline">
                Cancelar
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

