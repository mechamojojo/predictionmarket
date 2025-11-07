"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ArrowUpDown, TrendingUp, TrendingDown, Calendar, CalendarDays, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

export type SortOption = 
  | "volume-desc" 
  | "volume-asc" 
  | "oldest-first" 
  | "newest-first"
  | "ending-soon";

interface MarketSortFilterProps {
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
}

const sortOptions: { value: SortOption; label: string; icon: React.ReactNode }[] = [
  {
    value: "volume-desc",
    label: "Volume: Maior → Menor",
    icon: <TrendingUp className="h-4 w-4" />,
  },
  {
    value: "volume-asc",
    label: "Volume: Menor → Maior",
    icon: <TrendingDown className="h-4 w-4" />,
  },
  {
    value: "oldest-first",
    label: "Mais Antigo Primeiro",
    icon: <Calendar className="h-4 w-4" />,
  },
  {
    value: "newest-first",
    label: "Mais Novo Primeiro",
    icon: <CalendarDays className="h-4 w-4" />,
  },
  {
    value: "ending-soon",
    label: "Terminando em Breve",
    icon: <Clock className="h-4 w-4" />,
  },
];

export function MarketSortFilter({
  sortBy,
  onSortChange,
}: MarketSortFilterProps) {
  const currentOption = sortOptions.find((opt) => opt.value === sortBy);

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="h-9 px-3 text-sm font-medium bg-background hover:bg-muted/50 border-border whitespace-nowrap min-w-[200px]"
        >
          <ArrowUpDown className="h-4 w-4 mr-2 flex-shrink-0" />
          <span className="truncate">{currentOption?.label || "Ordenar"}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {sortOptions.map((option) => (
          <DropdownMenuItem
            key={option.value}
            onClick={() => onSortChange(option.value)}
            className={cn(
              "cursor-pointer flex items-center gap-2",
              sortBy === option.value && "bg-primary/10 text-primary font-medium"
            )}
          >
            {option.icon}
            {option.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

