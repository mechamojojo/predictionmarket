"use client";

import {
  ConnectButton,
  lightTheme,
  useActiveAccount,
  useActiveWallet,
  useReadContract,
  useDisconnect,
} from "thirdweb/react";
import { client } from "@/app/client";
import { baseSepolia } from "thirdweb/chains";
import { inAppWallet } from "thirdweb/wallets";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Wallet, Search, LogOut } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { FundingModal } from "@/components/funding-modal";
import { WithdrawalModal } from "@/components/withdrawal-modal";
import { tokenContract } from "@/constants/contract";
import { toEther } from "thirdweb";
import { formatCurrencyBRCompact } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import Link from "next/link";

interface NavbarProps {
  searchQuery?: string;
  setSearchQuery?: (query: string) => void;
}

export function Navbar({ searchQuery = "", setSearchQuery }: NavbarProps) {
  const account = useActiveAccount();
  const wallet = useActiveWallet();
  const { disconnect } = useDisconnect();
  const [isClaimLoading, setIsClaimLoading] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [showDisconnectConfirm, setShowDisconnectConfirm] = useState(false);
  const { toast } = useToast();

  // Get user's token balance
  const { data: tokenBalance, isLoading: isLoadingBalance } = useReadContract({
    contract: tokenContract,
    method: "function balanceOf(address owner) view returns (uint256)",
    params: [account?.address as string],
    queryOptions: {
      enabled: !!account?.address,
      refetchInterval: 5000, // Refetch every 5 seconds
    },
  });

  const balanceInReais = tokenBalance
    ? formatCurrencyBRCompact(Number(toEther(tokenBalance)))
    : "R$ 0,00";

  const handleClaimTokens = async () => {
    setIsClaimLoading(true);
    try {
      const resp = await fetch("/api/claimToken", {
        method: "POST",
        body: JSON.stringify({ address: account?.address }),
      });
      if (!resp.ok) throw new Error("Failed to claim tokens");

      toast({
        title: "Créditos Recebidos!",
        description: "Seus créditos foram adicionados com sucesso.",
        duration: 5000,
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "Falha ao Receber",
        description:
          "Ocorreu um erro ao receber seus créditos. Por favor, tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsClaimLoading(false);
    }
  };

  const handleDisconnectClick = () => {
    setShowDisconnectConfirm(true);
  };

  const handleCancelDisconnect = () => {
    setShowDisconnectConfirm(false);
  };

  const handleConfirmDisconnect = async () => {
    setIsDisconnecting(true);
    setShowDisconnectConfirm(false);
    try {
      if (wallet) {
        disconnect(wallet);
        toast({
          title: "Desconectado",
          description: "Você foi desconectado com sucesso.",
          duration: 3000,
        });
      }
    } catch (error) {
      console.error(error);
      toast({
        title: "Erro ao Desconectar",
        description:
          "Ocorreu um erro ao desconectar. Por favor, tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsDisconnecting(false);
    }
  };

  return (
    <div className="flex items-center gap-4">
      {/* Logo à esquerda */}
      <Link
        href="/"
        className="flex items-center gap-3 flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
      >
        <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center">
          <span className="text-white font-bold text-lg">M</span>
        </div>
        <h1 className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
          megabolsa
        </h1>
      </Link>

      {/* Barra de Pesquisa no meio */}
      {setSearchQuery && (
        <div className="flex-1 max-w-md mx-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-foreground/70 z-10" />
            <Input
              type="text"
              placeholder="Buscar bolões..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 h-10 text-sm bg-background border-2 border-foreground/20 shadow-md focus-visible:border-primary focus-visible:shadow-lg text-foreground placeholder:text-foreground/60 font-normal"
            />
          </div>
        </div>
      )}

      {/* Botões à direita */}
      <div className="items-center flex gap-3 flex-shrink-0">
        {account && (
          <>
            {/* Ordem: Receber tokens, Saldo, Depositar */}
            <Button
              onClick={handleClaimTokens}
              disabled={isClaimLoading}
              variant="outline"
            >
              {isClaimLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Recebendo...
                </>
              ) : (
                "Receber Tokens"
              )}
            </Button>

            {/* Carteira em R$ - Layout vertical - Clicável para perfil */}
            <Link href="/profile">
              <div className="flex items-center gap-2 px-3 py-2 h-10 bg-gradient-to-r from-primary via-primary/90 to-primary/80 border-2 border-primary/30 rounded-md shadow-md shadow-primary/20 transition-all hover:shadow-lg hover:shadow-primary/30 cursor-pointer">
                <Wallet className="h-4 w-4 text-white" />
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-white/90 uppercase tracking-wide leading-tight">
                    Carteira
                  </span>
                  <span className="text-sm font-bold text-white leading-tight">
                    {isLoadingBalance ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      balanceInReais
                    )}
                  </span>
                </div>
              </div>
            </Link>

            {/* Depositar - Modal de funding */}
            <FundingModal />

            {/* Sacar - Modal de saque */}
            <WithdrawalModal />

            {/* Botão de Desconectar - Com confirmação inline */}
            {!showDisconnectConfirm ? (
              <Button
                onClick={handleDisconnectClick}
                disabled={isDisconnecting}
                variant="outline"
                className="h-10 px-3"
                title="Desconectar"
              >
                {isDisconnecting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </>
                ) : (
                  <LogOut className="h-4 w-4" />
                )}
              </Button>
            ) : (
              <div className="flex items-center gap-2 h-10 px-3 py-2 bg-background border border-border rounded-md shadow-sm">
                <span className="text-xs font-medium text-foreground whitespace-nowrap">
                  Deseja sair?
                </span>
                <div className="flex items-center gap-1.5">
                  <Button
                    onClick={handleConfirmDisconnect}
                    disabled={isDisconnecting}
                    size="sm"
                    className="h-7 px-2.5 text-xs bg-primary hover:bg-primary/90 text-white"
                  >
                    {isDisconnecting ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      "Sim"
                    )}
                  </Button>
                  <Button
                    onClick={handleCancelDisconnect}
                    disabled={isDisconnecting}
                    size="sm"
                    variant="outline"
                    className="h-7 px-2.5 text-xs"
                  >
                    Não
                  </Button>
                </div>
              </div>
            )}
          </>
        )}

        {/* ConnectButton - Apenas quando não conectado */}
        {!account && (
          <ConnectButton
            client={client}
            theme={lightTheme({
              colors: {
                primaryButtonBg: "hsl(142, 75%, 42%)",
                primaryButtonText: "#ffffff",
                secondaryButtonBg: "#ffffff",
                secondaryButtonText: "hsl(0, 0%, 31%)",
                accentButtonBg: "hsl(142, 75%, 42%)",
                accentButtonText: "#ffffff",
                modalBg: "#ffffff",
                borderColor: "hsl(0, 0%, 90%)",
                separatorLine: "hsl(0, 0%, 90%)",
                success: "hsl(142, 75%, 42%)",
                danger: "hsl(0, 84%, 60%)",
              },
            })}
            chain={baseSepolia}
            connectButton={{
              style: {
                fontSize: "0.875rem",
                fontWeight: "600",
                height: "2.5rem",
                padding: "0 1.5rem",
                borderRadius: "0.5rem",
                background:
                  "linear-gradient(135deg, hsl(142, 75%, 47%) 0%, hsl(142, 75%, 42%) 50%, hsl(142, 75%, 37%) 100%)",
                color: "#ffffff",
                border: "none",
                boxShadow:
                  "0 4px 14px rgba(34, 197, 94, 0.35), 0 2px 6px rgba(34, 197, 94, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.1)",
                transition: "all 0.2s ease",
                cursor: "pointer",
                position: "relative",
                overflow: "hidden",
              },
              label: "Entrar",
            }}
            wallets={[
              inAppWallet({
                metadata: {
                  name: "Megabolsa",
                },
              }),
            ]}
            accountAbstraction={{ chain: baseSepolia, sponsorGas: true }}
          />
        )}
      </div>
    </div>
  );
}
