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
import { PixPayment } from "@/components/pix-payment";

/**
 * Modal de Créditos - Apenas PIX
 * 
 * Única forma de adicionar créditos à conta:
 * - Pagamento via PIX
 * - Conversão automática: 1 BRL = 1 Crédito
 * - Créditos adicionados automaticamente após confirmação do pagamento
 */
export function FundingModal() {
  const account = useActiveAccount();
  const [fundOpen, setFundOpen] = useState(false);
  const { toast } = useToast();

  if (!account) {
    return null;
  }

  return (
    <Dialog open={fundOpen} onOpenChange={setFundOpen}>
      <DialogTrigger asChild>
        <Button variant="default">
          Depositar
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-[600px] p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle>Depositar via PIX</DialogTitle>
        </DialogHeader>

        <PixPayment
          onSuccess={() => {
            toast({
              title: "Sucesso!",
              description: "Créditos adicionados com sucesso! 🎉",
            });
            setFundOpen(false);
          }}
          onCancel={() => setFundOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

