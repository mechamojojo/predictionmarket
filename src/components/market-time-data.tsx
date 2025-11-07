"use client";

import { useReadContract } from "thirdweb/react";
import { contract } from "@/constants/contract";
import { useEffect, useRef } from "react";

interface MarketTimeDataProps {
  marketId: number;
  onDataLoaded: (marketId: number, endTime: bigint) => void;
}

export function MarketTimeData({
  marketId,
  onDataLoaded,
}: MarketTimeDataProps) {
  const { data: marketData } = useReadContract({
    contract,
    method:
      "function getMarketInfo(uint256 _marketId) view returns (string question, string optionA, string optionB, uint256 endTime, uint8 outcome, uint256 totalOptionAShares, uint256 totalOptionBShares, bool resolved)",
    params: [BigInt(marketId)],
  });

  const hasLoadedRef = useRef(false);

  useEffect(() => {
    if (marketData && !hasLoadedRef.current) {
      const endTime = marketData[3];
      onDataLoaded(marketId, endTime);
      hasLoadedRef.current = true;
    }
  }, [marketData, marketId, onDataLoaded]);

  return null;
}

