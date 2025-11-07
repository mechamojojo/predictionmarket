"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Filter, X } from "lucide-react";
import { MarketCategory, CATEGORIES } from "@/lib/market-categories";
import { cn } from "@/lib/utils";

interface CategoryFilterProps {
  selectedCategory: MarketCategory | "all";
  onCategoryChange: (category: MarketCategory | "all") => void;
}

export function CategoryFilter({
  selectedCategory,
  onCategoryChange,
}: CategoryFilterProps) {
  const categories = Object.keys(CATEGORIES) as MarketCategory[];

  return (
    <div className="flex items-center gap-2">
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className="h-9 px-3 text-sm font-medium bg-background hover:bg-muted/50 border-border"
          >
            <Filter className="h-4 w-4 mr-2" />
            {selectedCategory === "all"
              ? "Todas as Categorias"
              : CATEGORIES[selectedCategory].label}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          <DropdownMenuItem
            onClick={() => onCategoryChange("all")}
            className={cn(
              "cursor-pointer",
              selectedCategory === "all" && "bg-primary/10 text-primary font-medium"
            )}
          >
            Todas as Categorias
          </DropdownMenuItem>
          {categories.map((category) => (
            <DropdownMenuItem
              key={category}
              onClick={() => onCategoryChange(category)}
              className={cn(
                "cursor-pointer",
                selectedCategory === category &&
                  "bg-primary/10 text-primary font-medium"
              )}
            >
              {CATEGORIES[category].label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      {selectedCategory !== "all" && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onCategoryChange("all")}
          className="h-9 px-2"
          aria-label="Limpar filtro"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}

