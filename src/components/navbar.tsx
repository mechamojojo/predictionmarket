"use client";

import {
  ConnectButton,
  lightTheme,
  useActiveAccount,
  BuyWidget,
} from "thirdweb/react";
import { client } from "@/app/client";
import { baseSepolia } from "thirdweb/chains";
import { inAppWallet } from "thirdweb/wallets";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { defineChain } from "thirdweb";

// shadcn/ui dialog (or use your own modal)
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function Navbar() {
  const account = useActiveAccount();
  const [isClaimLoading, setIsClaimLoading] = useState(false);
  const [fundOpen, setFundOpen] = useState(false);
  const { toast } = useToast();

  const handleClaimTokens = async () => {
    setIsClaimLoading(true);
    try {
      const resp = await fetch("/api/claimToken", {
        method: "POST",
        body: JSON.stringify({ address: account?.address }),
      });
      if (!resp.ok) throw new Error("Failed to claim tokens");

      toast({
        title: "Tokens Claimed!",
        description: "Your tokens have been successfully claimed.",
        duration: 5000,
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "Claim Failed",
        description:
          "There was an error claiming your tokens. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsClaimLoading(false);
    }
  };

  return (
    <div className="flex justify-between items-center mb-6">
      <h1 className="text-2xl font-bold">megabolsa</h1>

      <div className="items-center flex gap-2">
        {account && (
          <>
            <Button
              onClick={handleClaimTokens}
              disabled={isClaimLoading}
              variant="outline"
            >
              {isClaimLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Claiming...
                </>
              ) : (
                "Claim Tokens"
              )}
            </Button>

            {/* Fund button opens the modal */}
            <Dialog open={fundOpen} onOpenChange={setFundOpen}>
              <DialogTrigger asChild>
                <Button variant="default">Add funds</Button>
              </DialogTrigger>

              <DialogContent className="max-w-[520px] p-0 overflow-hidden">
                <DialogHeader className="px-6 pt-6">
                  <DialogTitle>Get funds</DialogTitle>
                </DialogHeader>

                {/* Give the widget some room */}
                <div className="p-6">
                  <BuyWidget
                    theme={"light"}
                    client={client}
                    paymentMethods={["card"]}
                    currency={"BRL"}
                    chain={defineChain(8453)} // use baseSepolia for test; switch to base for prod
                    amount="10" // string
                    showThirdwebBranding={false}
                    title="Get funds"
                    tokenAddress={"0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"}
                    onSuccess={(tx) => {
                      toast({
                        title: "Success",
                        description: "Funds are on the way. 🎉",
                      });
                      setFundOpen(false);
                    }}
                    onError={(err) => {
                      console.error(err);
                      toast({
                        title: "Funding failed",
                        description: "Try again in a moment.",
                        variant: "destructive",
                      });
                    }}
                  />
                </div>
              </DialogContent>
            </Dialog>
          </>
        )}

        <ConnectButton
          client={client}
          theme={lightTheme()}
          chain={baseSepolia}
          connectButton={{
            style: {
              fontSize: "0.75rem !important",
              height: "2.5rem !important",
            },
            label: "Log In",
          }}
          detailsButton={{
            displayBalanceToken: {
              [baseSepolia.id]: "0xDA6EB77e8999Fd07D0E8443621C90ac1EDc7C259",
            },
          }}
          wallets={[inAppWallet()]}
          accountAbstraction={{ chain: baseSepolia, sponsorGas: true }}
        />
      </div>
    </div>
  );
}
