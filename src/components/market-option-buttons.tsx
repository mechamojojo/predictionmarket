"use client";

import { Button } from "./ui/button";
import { useActiveAccount } from "thirdweb/react";

interface MarketOptionButtonsProps {
  optionA: string;
  optionB: string;
  onSelectOption: (option: "A" | "B") => void;
}

export function MarketOptionButtons({
  optionA,
  optionB,
  onSelectOption,
}: MarketOptionButtonsProps) {
  const account = useActiveAccount();

  return (
    <div className="flex gap-3">
      <Button
        className="flex-1 bg-gradient-to-r from-chart-1 to-chart-1/90 hover:from-chart-1/90 hover:to-chart-1 font-semibold py-3 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
        style={{ color: "hsl(var(--chart-1-text))" }}
        onClick={() => onSelectOption("A")}
        disabled={!account}
      >
        {optionA}
      </Button>
      <Button
        className="flex-1 bg-gradient-to-r from-chart-2 to-chart-2/90 hover:from-chart-2/90 hover:to-chart-2 font-semibold py-3 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
        style={{ color: "hsl(var(--chart-2-text))" }}
        onClick={() => onSelectOption("B")}
        disabled={!account}
      >
        {optionB}
      </Button>
    </div>
  );
}

