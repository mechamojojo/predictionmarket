"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";
import { isFavorite, toggleFavorite } from "@/lib/favorites";
import { cn } from "@/lib/utils";

interface MarketFavoriteButtonProps {
  marketId: number;
  className?: string;
}

export function MarketFavoriteButton({ marketId, className }: MarketFavoriteButtonProps) {
  const [favorited, setFavorited] = useState(false);

  useEffect(() => {
    setFavorited(isFavorite(marketId));
  }, [marketId]);

  const handleToggle = () => {
    const newState = toggleFavorite(marketId);
    setFavorited(newState);
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleToggle}
      className={cn("h-8 w-8 p-0", className)}
      aria-label={favorited ? "Remover dos favoritos" : "Adicionar aos favoritos"}
    >
      <Heart
        className={cn(
          "h-4 w-4 transition-colors",
          favorited ? "fill-red-500 text-red-500" : "text-muted-foreground"
        )}
      />
    </Button>
  );
}

