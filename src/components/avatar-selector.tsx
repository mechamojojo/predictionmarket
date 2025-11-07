"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AVATAR_OPTIONS, setAvatarStyle, getAvatarUrl, AvatarStyle, getAvatarStyle, getAvatarSeed } from "@/lib/avatar";
import { Pencil } from "lucide-react";
import { cn } from "@/lib/utils";

interface AvatarSelectorProps {
  address: string;
  currentAvatarUrl: string;
  onAvatarChange?: (newUrl: string) => void;
  children?: React.ReactNode;
}

export function AvatarSelector({
  address,
  currentAvatarUrl,
  onAvatarChange,
  children,
}: AvatarSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStyle, setCurrentStyle] = useState<AvatarStyle>("avataaars");
  const [selectedStyle, setSelectedStyle] = useState<AvatarStyle>("avataaars");
  const [currentSeed, setCurrentSeed] = useState<string | null>(null);

  useEffect(() => {
    if (address) {
      const style = getAvatarStyle(address);
      const seed = getAvatarSeed(address);
      setCurrentStyle(style);
      setSelectedStyle(style);
      setCurrentSeed(seed);
    }
  }, [address]);

  const handleSelectAvatar = (style: AvatarStyle, seed?: string) => {
    const selectedSeed = seed || address;
    setAvatarStyle(address, style, selectedSeed);
    const newUrl = getAvatarUrl(address, style, selectedSeed);
    setCurrentStyle(style);
    setCurrentSeed(selectedSeed);
    if (onAvatarChange) {
      onAvatarChange(newUrl);
    }
    setIsOpen(false);
  };

  // Gerar variações para cada estilo
  const getVariationsForStyle = (style: AvatarStyle) => {
    const variations: string[] = [];
    // Gerar 8 variações diferentes usando diferentes seeds
    for (let i = 0; i < 8; i++) {
      const seed = `${address}_${i}_${style}`;
      variations.push(getAvatarUrl(address, style, seed));
    }
    return variations;
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            title="Alterar avatar"
          >
            <Pencil className="h-4 w-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[70vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-3">
          <DialogTitle className="text-base font-semibold">Escolher Avatar</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Selecione um estilo e escolha uma variação
          </DialogDescription>
        </DialogHeader>
        <Tabs value={selectedStyle} onValueChange={(value) => setSelectedStyle(value as AvatarStyle)} className="flex-1 overflow-hidden flex flex-col px-6 pb-6">
          <TabsList className="grid grid-cols-3 sm:grid-cols-5 gap-1 h-auto p-1 mb-3 overflow-x-auto">
            {AVATAR_OPTIONS.map((option) => (
              <TabsTrigger
                key={option.value}
                value={option.value}
                className={cn(
                  "text-xs py-1.5 px-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm rounded-md",
                  currentStyle === option.value && !currentSeed && "ring-2 ring-primary"
                )}
              >
                {option.label}
              </TabsTrigger>
            ))}
          </TabsList>
          {AVATAR_OPTIONS.map((option) => {
            const variations = getVariationsForStyle(option.value);
            return (
              <TabsContent
                key={option.value}
                value={option.value}
                className="flex-1 overflow-y-auto mt-0 pr-1"
              >
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                  {variations.map((variationUrl, index) => {
                    const seed = `${address}_${index}_${option.value}`;
                    // Verificar se é o avatar selecionado
                    const isSelected = currentStyle === option.value && (
                      currentSeed === seed || 
                      (!currentSeed && index === 0) ||
                      (currentSeed === address && index === 0)
                    );
                    return (
                      <button
                        key={index}
                        onClick={() => handleSelectAvatar(option.value, seed)}
                        className={cn(
                          "flex flex-col items-center justify-center gap-1 p-2 rounded-lg border-2 transition-all hover:border-primary hover:bg-primary/5 hover:shadow-sm",
                          isSelected
                            ? "border-primary bg-primary/10 shadow-sm"
                            : "border-border"
                        )}
                      >
                        <img
                          src={variationUrl}
                          alt={`${option.label} ${index + 1}`}
                          className="w-10 h-10 rounded-full"
                        />
                      </button>
                    );
                  })}
                </div>
              </TabsContent>
            );
          })}
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

