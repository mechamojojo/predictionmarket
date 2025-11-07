"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { TrendingUp } from "lucide-react";
import { getMarketOddsHistory } from "@/lib/odds-history";

interface OddsHistoryChartProps {
  marketId: number;
  optionA: string;
  optionB: string;
}

export function OddsHistoryChart({
  marketId,
  optionA,
  optionB,
}: OddsHistoryChartProps) {
  const history = getMarketOddsHistory(marketId);

  // Prepare data for chart
  const chartData = useMemo(() => {
    if (history.length === 0) return null;

    // Get last 20 data points for display
    const recentHistory = history.slice(-20);
    
    return {
      labels: recentHistory.map((_, i) => i),
      oddsA: recentHistory.map((snapshot) => snapshot.oddsA),
      oddsB: recentHistory.map((snapshot) => snapshot.oddsB),
      timestamps: recentHistory.map((snapshot) => snapshot.timestamp),
    };
  }, [history]);

  if (!chartData || chartData.oddsA.length === 0) {
    return (
      <Card className="mt-6">
        <CardHeader>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            <CardTitle className="text-xl font-bold">Histórico de Odds</CardTitle>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            O histórico de odds aparecerá aqui conforme os dados forem coletados
          </p>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center bg-muted/30 rounded-lg border border-border">
            <p className="text-sm text-muted-foreground">
              Ainda não há histórico suficiente para exibir o gráfico
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate min and max for Y axis
  const allOdds = [...chartData.oddsA, ...chartData.oddsB];
  const minOdds = Math.min(...allOdds);
  const maxOdds = Math.max(...allOdds);
  const yRange = maxOdds - minOdds;
  const yPadding = yRange * 0.15; // 15% padding

  // Chart dimensions with padding
  const chartHeight = 200;
  const chartWidth = 100;
  const paddingTop = 20;
  const paddingBottom = 50; // Mais espaço para a legenda
  const paddingLeft = 12;
  const paddingRight = 8;
  const innerHeight = chartHeight - paddingTop - paddingBottom;
  const innerWidth = chartWidth - paddingLeft - paddingRight;
  const lineWidth = 2.5;

  // Convert odds to chart coordinates
  const getY = (odds: number) => {
    const normalized = (odds - minOdds + yPadding) / (yRange + yPadding * 2);
    return paddingTop + innerHeight - normalized * innerHeight;
  };

  const getX = (index: number) => {
    if (chartData.labels.length === 1) return paddingLeft + innerWidth / 2;
    return paddingLeft + (index / (chartData.labels.length - 1)) * innerWidth;
  };

  // Generate simple line path for Option A
  const pathA = chartData.oddsA
    .map((odds, i) => `${i === 0 ? "M" : "L"} ${getX(i)} ${getY(odds)}`)
    .join(" ");

  // Generate simple line path for Option B
  const pathB = chartData.oddsB
    .map((odds, i) => `${i === 0 ? "M" : "L"} ${getX(i)} ${getY(odds)}`)
    .join(" ");

  // Y-axis values
  const yAxisValues = [0, 0.25, 0.5, 0.75, 1].map((ratio) => {
    const value = minOdds + (maxOdds - minOdds) * (1 - ratio);
    const y = paddingTop + innerHeight * (1 - ratio);
    return { value, y };
  });

  return (
    <Card className="mt-6">
      <CardHeader>
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          <CardTitle className="text-xl font-bold">Histórico de Odds</CardTitle>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Evolução das odds ao longo do tempo
        </p>
      </CardHeader>
      <CardContent className="pb-4">
        <div className="relative w-full" style={{ height: "280px" }}>
          <svg
            viewBox={`0 0 ${chartWidth} ${chartHeight}`}
            className="w-full h-full"
            preserveAspectRatio="none"
          >
            {/* Grid lines */}
            {yAxisValues.map(({ value, y }, index) => (
              <g key={index}>
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={paddingLeft + innerWidth}
                  y2={y}
                  stroke="hsl(var(--border))"
                  strokeWidth="0.5"
                  strokeDasharray="2,2"
                  opacity="0.2"
                />
              </g>
            ))}

            {/* Lines */}
            <path
              d={pathA}
              fill="none"
              stroke="hsl(var(--chart-1))"
              strokeWidth={lineWidth}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d={pathB}
              fill="none"
              stroke="hsl(var(--chart-2))"
              strokeWidth={lineWidth}
              strokeLinecap="round"
              strokeLinejoin="round"
            />


            {/* Y-axis labels */}
            {yAxisValues.map(({ value, y }, index) => (
              <text
                key={index}
                x={paddingLeft - 6}
                y={y + 4}
                textAnchor="end"
                fontSize="9"
                fill="hsl(var(--muted-foreground))"
                className="font-medium"
              >
                {value.toFixed(2)}x
              </text>
            ))}

            {/* Y-axis line */}
            <line
              x1={paddingLeft}
              y1={paddingTop}
              x2={paddingLeft}
              y2={paddingTop + innerHeight}
              stroke="hsl(var(--border))"
              strokeWidth="1"
            />

            {/* X-axis line */}
            <line
              x1={paddingLeft}
              y1={paddingTop + innerHeight}
              x2={paddingLeft + innerWidth}
              y2={paddingTop + innerHeight}
              stroke="hsl(var(--border))"
              strokeWidth="1"
            />
          </svg>

          {/* Legend */}
          <div className="absolute bottom-6 left-0 right-0 flex items-center justify-center gap-4">
            <div className="flex items-center gap-2 px-2.5 py-1 bg-chart-1/10 rounded-md border border-chart-1/20">
              <div className="w-2.5 h-2.5 rounded-full bg-chart-1"></div>
              <span className="text-xs font-semibold text-chart-1">{optionA}</span>
            </div>
            <div className="flex items-center gap-2 px-2.5 py-1 bg-chart-2/10 rounded-md border border-chart-2/20">
              <div className="w-2.5 h-2.5 rounded-full bg-chart-2"></div>
              <span className="text-xs font-semibold text-chart-2">{optionB}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

