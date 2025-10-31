"use client";

import { useReadContract } from "thirdweb/react";
import { contract } from "@/constants/contract";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MarketCard } from "./marketCard";
import { Navbar } from "./navbar";
import { MarketCardSkeleton } from "./market-card-skeleton";
import { Footer } from "./footer";
import { useState, useEffect } from "react";

export function EnhancedPredictionMarketDashboard() {
  const [isMounted, setIsMounted] = useState(false);

  const { data: marketCount, isLoading: isLoadingMarketCount } =
    useReadContract({
      contract,
      method: "function marketCount() view returns (uint256)",
      params: [],
    });

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Show 6 skeleton cards while loading
  const skeletonCards = Array.from({ length: 6 }, (_, i) => (
    <MarketCardSkeleton key={`skeleton-${i}`} />
  ));

  // Prevent hydration issues by not rendering until mounted
  if (!isMounted) {
    return (
      <div className="min-h-screen flex flex-col">
        <div className="flex-grow container mx-auto p-4">
          <div className="animate-pulse">
            <div className="h-16 bg-gray-200 rounded mb-4"></div>
            <div className="h-8 bg-gray-200 rounded mb-4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {skeletonCards}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-grow container mx-auto p-4">
        <Navbar />
        <div className="mb-4 flex justify-center">
          <img
            src="https://i.ibb.co/Y44pQJ0q/Chat-GPT-Image-Oct-28-2025-10-56-20-PM.png"
            alt="Logo Megabolsa"
            className="w-1/4 h-auto rounded-lg"
          />
        </div>
        <Tabs defaultValue="active" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="active">Bolões Ativos</TabsTrigger>
            <TabsTrigger value="pending">Bolões Pendentes</TabsTrigger>
            <TabsTrigger value="resolved">Finalizados</TabsTrigger>
          </TabsList>

          {isLoadingMarketCount ? (
            <TabsContent value="active" className="mt-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {skeletonCards}
              </div>
            </TabsContent>
          ) : (
            <>
              <TabsContent value="active">
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  {Array.from({ length: Number(marketCount) }, (_, index) => (
                    <MarketCard key={index} index={index} filter="active" />
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="pending">
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  {Array.from({ length: Number(marketCount) }, (_, index) => (
                    <MarketCard key={index} index={index} filter="pending" />
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="resolved">
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  {Array.from({ length: Number(marketCount) }, (_, index) => (
                    <MarketCard key={index} index={index} filter="resolved" />
                  ))}
                </div>
              </TabsContent>
            </>
          )}
        </Tabs>
      </div>
      <Footer />
    </div>
  );
}
