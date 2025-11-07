"use client";

import { Badge } from "@/components/ui/badge";
import { detectMarketCategory, getCategoryConfig, MarketCategory } from "@/lib/market-categories";

interface MarketCategoryBadgeProps {
  question: string;
  className?: string;
}

export function MarketCategoryBadge({ question, className }: MarketCategoryBadgeProps) {
  const category = detectMarketCategory(question);
  const config = getCategoryConfig(category);

  return (
    <Badge
      variant="outline"
      className={`text-xs font-medium ${config.bgColor} ${config.color} border ${className || ""}`}
    >
      {config.label}
    </Badge>
  );
}

