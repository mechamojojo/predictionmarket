"use client";

import { useActiveAccount, useReadContract } from "thirdweb/react";
import { contract, tokenContract } from "@/constants/contract";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { FundingModal } from "@/components/funding-modal";
import { WithdrawalModal } from "@/components/withdrawal-modal";
import { MarketFavoriteButton } from "@/components/market-favorite-button";
import { UserMarketItem } from "@/components/user-market-item";
import { ActivityTimeline } from "@/components/activity-timeline";
import { AvatarSelector } from "@/components/avatar-selector";
import { TrendingUp, TrendingDown, Trophy, Activity, Heart, Share2, Pencil, Info, Clock, CheckCircle2, XCircle, ArrowRight } from "lucide-react";
import { getAvatarUrl } from "@/lib/avatar";
import { formatCurrencyBRCompact } from "@/lib/utils";
import { toEther } from "thirdweb";
import { getFavorites } from "@/lib/favorites";
import { getDisplayName, getUserName, setUserName } from "@/lib/user-name";
import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Market {
  question: string;
  optionA: string;
  optionB: string;
  endTime: bigint;
  outcome: number;
  totalOptionAShares: bigint;
  totalOptionBShares: bigint;
  resolved: boolean;
}

interface SharesBalance {
  optionAShares: bigint;
  optionBShares: bigint;
}

interface UserMarketData {
  marketId: number;
  market: Market;
  sharesBalance: SharesBalance;
  totalInvested: number;
  potentialWinnings: number;
  isWinner: boolean | null;
}

export default function ProfilePage() {
  const account = useActiveAccount();
  const router = useRouter();
  const [marketCount, setMarketCount] = useState<number>(0);
  const [userMarkets, setUserMarkets] = useState<UserMarketData[]>([]);
  const [favorites, setFavorites] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedTab, setSelectedTab] = useState<"positions" | "activity">("positions");
  const [selectedSubTab, setSelectedSubTab] = useState<"active" | "closed">("active");
  const [profitLossPeriod, setProfitLossPeriod] = useState<"1D" | "1S" | "1M" | "Geral">("1M");
  const [showTooltip, setShowTooltip] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string>("");
  const [userName, setUserNameState] = useState<string>("");
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState<string>("");

  // Get market count
  const { data: marketCountData } = useReadContract({
    contract,
    method: "function marketCount() view returns (uint256)",
    params: [],
  });

  // Get user's token balance
  const { data: tokenBalance, isLoading: isLoadingBalance } = useReadContract({
    contract: tokenContract,
    method: "function balanceOf(address owner) view returns (uint256)",
    params: [account?.address as string],
    queryOptions: {
      enabled: !!account?.address,
      refetchInterval: 5000,
    },
  });

  useEffect(() => {
    if (marketCountData) {
      setMarketCount(Number(marketCountData));
    }
  }, [marketCountData]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setFavorites(getFavorites());
    }
  }, []);

  // Redirect if not connected
  useEffect(() => {
    if (!account) {
      router.push("/");
    }
  }, [account, router]);

  // Calculate statistics
  const stats = useMemo(() => {
    let totalInvested = 0;
    let totalPotentialWinnings = 0;
    let activeMarkets = 0;
    let resolvedMarkets = 0;
    let wonMarkets = 0;
    let lostMarkets = 0;
    let biggestWin = 0;
    let totalGains = 0;
    let totalLosses = 0;

    userMarkets.forEach((data) => {
      totalInvested += data.totalInvested;
      totalPotentialWinnings += data.potentialWinnings;

      if (data.market.resolved) {
        resolvedMarkets++;
        if (data.isWinner === true) {
          wonMarkets++;
          totalGains += data.potentialWinnings;
          if (data.potentialWinnings > biggestWin) {
            biggestWin = data.potentialWinnings;
          }
        }
        if (data.isWinner === false) {
          lostMarkets++;
          totalLosses += data.totalInvested;
        }
      } else {
        activeMarkets++;
      }
    });

    const winRate =
      resolvedMarkets > 0 ? (wonMarkets / resolvedMarkets) * 100 : 0;
    const roi =
      totalInvested > 0
        ? ((totalPotentialWinnings - totalInvested) / totalInvested) * 100
        : 0;

    return {
      totalInvested,
      totalPotentialWinnings,
      activeMarkets,
      resolvedMarkets,
      wonMarkets,
      lostMarkets,
      winRate,
      roi,
      biggestWin,
      totalGains,
      totalLosses,
    };
  }, [userMarkets]);

  // Get avatar URL
  useEffect(() => {
    if (account?.address) {
      setAvatarUrl(getAvatarUrl(account.address));
    }
  }, [account?.address]);

  // Get user name
  useEffect(() => {
    if (account?.address) {
      const savedName = getUserName(account.address);
      setUserNameState(savedName || "");
    }
  }, [account?.address]);

  const handleSaveName = () => {
    if (account?.address) {
      setUserName(account.address, tempName);
      setUserNameState(tempName);
      setIsEditingName(false);
    }
  };

  const handleCancelEditName = () => {
    setTempName(userName || "");
    setIsEditingName(false);
  };

  const handleStartEditName = () => {
    setTempName(userName || "");
    setIsEditingName(true);
  };

  const balanceInReais = tokenBalance
    ? formatCurrencyBRCompact(Number(toEther(tokenBalance)))
    : "R$ 0,00";

  if (!account) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="fixed top-0 left-0 right-0 z-50 w-full bg-background/95 backdrop-blur-sm border-b-2 border-border/60 shadow-sm">
        <div className="w-full max-w-[1430px] mx-auto px-8 py-6">
          <Navbar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
        </div>
      </div>

      <div className="flex-grow w-full max-w-[1430px] mx-auto px-8 py-4 mt-[120px]">
        {/* Top Cards - Profile and Profit/Loss */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          {/* Profile Card */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                {/* Avatar */}
                <div className="flex-shrink-0">
                  {!isEditingName ? (
                    <AvatarSelector
                      address={account.address}
                      currentAvatarUrl={avatarUrl || getAvatarUrl(account.address)}
                      onAvatarChange={setAvatarUrl}
                    >
                      <button
                        type="button"
                        className="relative group cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-full"
                        title="Alterar avatar"
                      >
                        <img
                          src={avatarUrl || getAvatarUrl(account.address)}
                          alt="Avatar"
                          className="w-16 h-16 rounded-full transition-all group-hover:opacity-80 group-hover:ring-2 group-hover:ring-primary group-hover:ring-offset-2"
                        />
                        <div className="absolute inset-0 rounded-full bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Pencil className="h-4 w-4 text-white" />
                        </div>
                      </button>
                    </AvatarSelector>
                  ) : (
                    <img
                      src={avatarUrl || getAvatarUrl(account.address)}
                      alt="Avatar"
                      className="w-16 h-16 rounded-full"
                    />
                  )}
                </div>
                
                {/* User Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {isEditingName ? (
                        <div className="flex items-center gap-2 flex-1">
                          <input
                            type="text"
                            value={tempName}
                            onChange={(e) => setTempName(e.target.value)}
                            placeholder="Digite seu nome"
                            className="flex-1 h-8 px-2 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                            autoFocus
                            maxLength={30}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                handleSaveName();
                              } else if (e.key === "Escape") {
                                handleCancelEditName();
                              }
                            }}
                          />
                          <Button
                            size="sm"
                            onClick={handleSaveName}
                            className="h-8 px-3 text-xs"
                          >
                            Salvar
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={handleCancelEditName}
                            className="h-8 px-3 text-xs"
                          >
                            Cancelar
                          </Button>
                        </div>
                      ) : (
                        <>
                          <h3 className="text-lg font-bold text-foreground">
                            {getDisplayName(account.address)}
                          </h3>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={handleStartEditName}
                            title="Alterar nome de usuário"
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button variant="outline" size="sm" className="h-6 px-2 text-xs">
                            Conectar X
                          </Button>
                        </>
                      )}
                    </div>
                    {!isEditingName && (
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <Share2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                  
                  <p className="text-xs text-muted-foreground mb-4">
                    Entrou em {new Date().toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })} • {stats.resolvedMarkets + stats.activeMarkets} visualizações
                  </p>
                  
                  {/* Stats */}
                  <div className="flex items-center gap-4 border-t border-border pt-4">
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground mb-1">Valor das Posições</p>
                      <p className="text-lg font-bold text-foreground">
                        {formatCurrencyBRCompact(stats.totalInvested)}
                      </p>
                    </div>
                    <div className="w-px h-12 bg-border"></div>
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground mb-1">Maior Vitória</p>
                      <p className="text-lg font-bold text-foreground">
                        {stats.biggestWin > 0 ? formatCurrencyBRCompact(stats.biggestWin) : "—"}
                      </p>
                    </div>
                    <div className="w-px h-12 bg-border"></div>
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground mb-1">Previsões</p>
                      <p className="text-lg font-bold text-foreground">
                        {stats.resolvedMarkets + stats.activeMarkets}
                      </p>
                    </div>
                  </div>
                  
                  {/* Saldo e Botões de ação */}
                  <div className="mt-4 pt-4 border-t border-border">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Saldo Disponível</p>
                        <p className="text-lg font-bold text-foreground">
                          {isLoadingBalance ? (
                            <span className="text-muted-foreground">Carregando...</span>
                          ) : (
                            balanceInReais
                          )}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <FundingModal />
                        <WithdrawalModal />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Profit/Loss Card */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  <h3 className="text-base font-semibold text-foreground">Ganhos/Perdas</h3>
                </div>
                <div className="flex items-center gap-1">
                  {([
                    { value: "1D", label: "1D" },
                    { value: "1S", label: "1S" },
                    { value: "1M", label: "1M" },
                    { value: "Geral", label: "Geral" },
                  ] as const).map((period) => (
                    <Button
                      key={period.value}
                      variant={profitLossPeriod === period.value ? "default" : "ghost"}
                      size="sm"
                      className={`h-7 px-2 text-xs ${
                        profitLossPeriod === period.value
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                      onClick={() => setProfitLossPeriod(period.value)}
                    >
                      {period.label}
                    </Button>
                  ))}
                </div>
              </div>
              
              <div className="mb-3">
                <div className="flex items-center gap-2">
                  <p className="text-2xl font-bold text-foreground">
                    {formatCurrencyBRCompact(stats.totalGains - stats.totalLosses)}
                  </p>
                  <div 
                    className="relative"
                    onMouseEnter={() => setShowTooltip(true)}
                    onMouseLeave={() => setShowTooltip(false)}
                  >
                    <Info 
                      className="h-4 w-4 text-muted-foreground cursor-help" 
                    />
                    {showTooltip && (
                      <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 z-50 pointer-events-none">
                        <div className="bg-popover border border-border rounded-lg shadow-lg p-3 min-w-[200px] pointer-events-auto">
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between items-center gap-4">
                              <span className="text-muted-foreground">Ganhos:</span>
                              <span className="font-semibold text-primary">
                                {formatCurrencyBRCompact(stats.totalGains)}
                              </span>
                            </div>
                            <div className="flex justify-between items-center gap-4">
                              <span className="text-muted-foreground">Perdas:</span>
                              <span className="font-semibold text-destructive">
                                {formatCurrencyBRCompact(stats.totalLosses)}
                              </span>
                            </div>
                            <div className="border-t border-border pt-2 mt-2">
                              <div className="flex justify-between items-center gap-4">
                                <span className="text-muted-foreground font-medium">Total líquido:</span>
                                <span className="font-bold text-foreground">
                                  {formatCurrencyBRCompact(stats.totalGains - stats.totalLosses)}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-border"></div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Último Mês</p>
              </div>
              
              {/* Graph Placeholder */}
              <div className="h-24 bg-primary/10 rounded-lg flex items-center justify-center">
                <div className="w-full h-2 bg-primary/20 rounded-full"></div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Positions/Activity Section */}
        <Card>
          <CardContent className="p-0">
            {/* Tabs */}
            <div className="border-b border-border">
              <div className="flex items-center gap-6 px-4">
                <button
                  onClick={() => setSelectedTab("positions")}
                  className={`py-3 px-1 border-b-2 transition-colors ${
                    selectedTab === "positions"
                      ? "border-primary text-foreground font-medium"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Posições
                </button>
                <button
                  onClick={() => setSelectedTab("activity")}
                  className={`py-3 px-1 border-b-2 transition-colors ${
                    selectedTab === "activity"
                      ? "border-primary text-foreground font-medium"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Atividade
                </button>
              </div>
            </div>

            {/* Sub-tabs and Search */}
            {selectedTab === "positions" && (
              <div className="px-4 py-3 border-b border-border flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <Button
                    variant={selectedSubTab === "active" ? "default" : "outline"}
                    size="sm"
                    className="h-8 text-xs"
                    onClick={() => setSelectedSubTab("active")}
                  >
                    Ativos
                  </Button>
                  <Button
                    variant={selectedSubTab === "closed" ? "default" : "outline"}
                    size="sm"
                    className="h-8 text-xs"
                    onClick={() => setSelectedSubTab("closed")}
                  >
                    Finalizados
                  </Button>
                </div>
                
                <div className="flex items-center gap-2 flex-1 max-w-md">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      placeholder="Buscar posições"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full h-8 pl-8 pr-3 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                    <div className="absolute left-2 top-1/2 -translate-y-1/2">
                      <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="h-8 text-xs">
                    Valor
                  </Button>
                </div>
              </div>
            )}

            {/* Content */}
            <div className="p-4">
              {selectedTab === "positions" ? (
                <UserMarketsList
                  marketCount={marketCount}
                  userAddress={account.address}
                  onMarketsLoaded={setUserMarkets}
                  filter={selectedSubTab}
                />
              ) : (
                <ActivityTimeline userMarkets={userMarkets} />
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      <Footer />
    </div>
  );
}

// Componente para buscar e listar mercados do usuário
function UserMarketsList({
  marketCount,
  userAddress,
  onMarketsLoaded,
  filter = "active",
}: {
  marketCount: number;
  userAddress: string;
  onMarketsLoaded: (markets: UserMarketData[]) => void;
  filter?: "active" | "closed";
}) {
  const [marketsData, setMarketsData] = useState<UserMarketData[]>([]);

  const handleMarketDataLoaded = useCallback(
    (data: {
      marketId: number;
      market: Market;
      sharesBalance: SharesBalance;
      totalInvested: number;
      potentialWinnings: number;
      isWinner: boolean | null;
    }) => {
      setMarketsData((prev) => {
        const existing = prev.find((m) => m.marketId === data.marketId);
        if (existing) return prev;
        
        const newData: UserMarketData = {
          marketId: data.marketId,
          market: data.market,
          sharesBalance: data.sharesBalance,
          totalInvested: data.totalInvested,
          potentialWinnings: data.potentialWinnings,
          isWinner: data.isWinner,
        };
        
        const updated = [...prev, newData];
        onMarketsLoaded(updated);
        return updated;
      });
    },
    [onMarketsLoaded]
  );

  // Renderizar componentes para todos os mercados para buscar dados
  // Cada componente verifica se o usuário tem cotas e retorna null se não tiver
  useEffect(() => {
    if (marketCount > 0) {
      // Criar componentes para buscar dados de todos os mercados
      for (let i = 0; i < marketCount; i++) {
        // Os componentes UserMarketItem serão renderizados abaixo
      }
    }
  }, [marketCount]);

  // Filtrar mercados por active/closed
  const filteredMarkets = marketsData.filter((data) => {
    if (filter === "active") {
      return !data.market.resolved;
    } else {
      return data.market.resolved;
    }
  });

  if (marketsData.length === 0 && marketCount > 0) {
    // Ainda carregando - renderizar componentes para buscar dados
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {Array.from({ length: marketCount }, (_, i) => (
          <UserMarketItem
            key={i}
            marketId={i}
            onDataLoaded={handleMarketDataLoaded}
          />
        ))}
        <div className="col-span-full text-center py-8">
          <p className="text-muted-foreground">Carregando seus mercados...</p>
        </div>
      </div>
    );
  }

  if (filteredMarkets.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-2">
          {filter === "active" 
            ? "Você não possui posições ativas no momento."
            : "Você não possui posições finalizadas."}
        </p>
        <Link href="/">
          <Button size="sm" className="mt-3">Explorar Mercados</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {filteredMarkets.map((data) => (
        <UserMarketItem
          key={data.marketId}
          marketId={data.marketId}
          onDataLoaded={handleMarketDataLoaded}
        />
      ))}
      {/* Renderizar componentes para buscar novos mercados */}
      {Array.from({ length: marketCount }, (_, i) => {
        // Só renderizar se ainda não estiver nos dados
        if (!marketsData.find((m) => m.marketId === i)) {
          return (
            <UserMarketItem
              key={i}
              marketId={i}
              onDataLoaded={handleMarketDataLoaded}
            />
          );
        }
        return null;
      })}
    </div>
  );
}

