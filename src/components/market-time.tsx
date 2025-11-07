import { cn } from "@/lib/utils";

interface MarketTimeProps {
  endTime: bigint;
  className?: string;
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

export function MarketTime({ endTime, className }: MarketTimeProps) {
  const isEnded = new Date(Number(endTime) * 1000) < new Date();
  const formattedDate = formatDate(
    new Date(Number(endTime) * 1000).toISOString()
  );

  return (
    <span
      className={cn(
        "text-sm font-medium transition-colors",
        isEnded ? "text-destructive" : "text-muted-foreground",
        className
      )}
    >
      {isEnded ? "Finalizado: " : ""}
      {formattedDate}
    </span>
  );
}
