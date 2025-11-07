"use client";

import { useActiveAccount } from "thirdweb/react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PixWithdrawal } from "@/components/pix-withdrawal";

/**
 * Modal de Saque - Apenas PIX
 * 
 * Única forma de sacar créditos da conta:
 * - Saque via PIX
 * - Conversão automática: 1 Crédito = 1 BRL
 * - Créditos removidos (queimados) e enviados via PIX automaticamente
 */
export function WithdrawalModal() {
  const account = useActiveAccount();
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const { toast } = useToast();

  if (!account) {
    return null;
  }

  return (
    <Dialog open={withdrawOpen} onOpenChange={setWithdrawOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline"
          className="bg-chart-2/10 hover:bg-chart-2/20 text-chart-2 border-chart-2/30 hover:border-chart-2/50"
        >
          Sacar
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-[600px] p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle>Sacar via PIX</DialogTitle>
        </DialogHeader>

        <PixWithdrawal
          onSuccess={() => {
            toast({
              title: "Sucesso!",
              description: "Saque processado com sucesso! 🎉",
            });
            setWithdrawOpen(false);
          }}
          onCancel={() => setWithdrawOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

