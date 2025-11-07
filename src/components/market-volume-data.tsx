"use client";

import { useReadContract } from "thirdweb/react";
import { contract } from "@/constants/contract";
import { useEffect, useRef } from "react";

interface MarketVolumeDataProps {
  marketId: number;
  onDataLoaded: (marketId: number, totalVolume: number) => void;
}

export function MarketVolumeData({
  marketId,
  onDataLoaded,
}: MarketVolumeDataProps) {
  const { data: marketData } = useReadContract({
    contract,
    method:
      "function getMarketInfo(uint256 _marketId) view returns (string question, string optionA, string optionB, uint256 endTime, uint8 outcome, uint256 totalOptionAShares, uint256 totalOptionBShares, bool resolved)",
    params: [BigInt(marketId)],
  });

  const hasLoadedRef = useRef(false);

  useEffect(() => {
    if (marketData && !hasLoadedRef.current) {
      const totalOptionAShares = marketData[5];
      const totalOptionBShares = marketData[6];
      const totalVolume = Number(totalOptionAShares) + Number(totalOptionBShares);
      onDataLoaded(marketId, totalVolume);
      hasLoadedRef.current = true;
    }
  }, [marketData, marketId, onDataLoaded]);

  return null;
}

