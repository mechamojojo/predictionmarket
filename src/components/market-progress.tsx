import { Progress } from "@/components/ui/progress";
import { toEther } from "thirdweb";
import { formatCurrencyBRCompact } from "@/lib/utils";

interface MarketProgressProps {
    optionA: string;
    optionB: string;
    totalOptionAShares: bigint;
    totalOptionBShares: bigint;
}

export function MarketProgress({ 
    optionA, 
    optionB, 
    totalOptionAShares, 
    totalOptionBShares 
}: MarketProgressProps) {
    const totalShares = Number(totalOptionAShares) + Number(totalOptionBShares);
    const yesPercentage = totalShares > 0 
        ? (Number(totalOptionAShares) / totalShares) * 100 
        : 50;

    return (
        <div className="mb-6 space-y-3">
            <div className="flex justify-between items-center mb-3">
                <div className="flex flex-col">
                    <span className="font-semibold text-sm text-foreground">
                        {optionA}
                    </span>
                    <span className="text-xs text-muted-foreground">
                        {formatCurrencyBRCompact(Number(toEther(totalOptionAShares)))}
                        {totalShares > 0 && (
                            <span className="ml-1 font-medium text-chart-1"> {Math.floor(yesPercentage)}%</span>
                        )}
                    </span>
                </div>
                <div className="flex flex-col text-right">
                    <span className="font-semibold text-sm text-foreground">
                        {optionB}
                    </span>
                    <span className="text-xs text-muted-foreground">
                        {formatCurrencyBRCompact(Number(toEther(totalOptionBShares)))}
                        {totalShares > 0 && (
                            <span className="ml-1 font-medium text-chart-2"> {Math.floor(100 - yesPercentage)}%</span>
                        )}
                    </span>
                </div>
            </div>
            <div className="relative h-3 rounded-full bg-secondary/50 overflow-hidden">
              <div 
                className="absolute left-0 top-0 h-full bg-gradient-to-r from-chart-1 to-chart-1/80 transition-all duration-500 ease-out rounded-l-full"
                style={{ width: `${yesPercentage}%` }}
              />
              <div 
                className="absolute right-0 top-0 h-full bg-gradient-to-l from-chart-2 to-chart-2/80 transition-all duration-500 ease-out rounded-r-full"
                style={{ width: `${100 - yesPercentage}%` }}
              />
            </div>
        </div>
    );
}