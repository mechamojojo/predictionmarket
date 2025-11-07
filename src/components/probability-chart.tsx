"use client";

import { useMemo, useState, useEffect } from "react";
import { Card, CardContent } from "./ui/card";
import { getMarketOddsHistory } from "@/lib/odds-history";
import { Button } from "./ui/button";

interface ProbabilityChartProps {
  marketId: number;
  optionA: string;
  optionB: string;
  currentProbA: number;
  currentProbB: number;
}

type TimeRange = "1H" | "6H" | "1D" | "1W" | "1M" | "ALL";

export function ProbabilityChart({
  marketId,
  optionA,
  optionB,
  currentProbA,
  currentProbB,
}: ProbabilityChartProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>("ALL");
  const [refreshKey, setRefreshKey] = useState(0);

  // Force refresh when timeRange changes
  useEffect(() => {
    setRefreshKey((prev) => prev + 1);
  }, [timeRange]);

  // Prepare data for chart
  const chartData = useMemo(() => {
    // Get fresh history data each time (this will be called when refreshKey changes)
    const history = getMarketOddsHistory(marketId);
    const now = Date.now();
    const timeRanges: Record<TimeRange, number> = {
      "1H": 60 * 60 * 1000,
      "6H": 6 * 60 * 60 * 1000,
      "1D": 24 * 60 * 60 * 1000,
      "1W": 7 * 24 * 60 * 60 * 1000,
      "1M": 30 * 24 * 60 * 60 * 1000,
      "ALL": Infinity,
    };

    // Filter data based on time range
    const cutoffTime = timeRange === "ALL" ? 0 : now - timeRanges[timeRange];
    let filteredHistory = history.filter((snapshot) => {
      if (timeRange === "ALL") return true;
      return snapshot.timestamp >= cutoffTime;
    });
    
    // Sort by timestamp to ensure chronological order
    filteredHistory.sort((a, b) => a.timestamp - b.timestamp);
    
    // Debug log
    console.log(`TimeRange: ${timeRange}, History: ${history.length}, Filtered: ${filteredHistory.length}, Cutoff: ${new Date(cutoffTime).toLocaleTimeString()}`);

    // If no history in the selected range, try to use the closest available point
    if (filteredHistory.length === 0) {
      if (history.length > 0) {
        // Find the most recent point before the cutoff time
        const pointsBeforeCutoff = history.filter(s => s.timestamp < cutoffTime);
        if (pointsBeforeCutoff.length > 0) {
          // Use the most recent point before cutoff as starting point
          const mostRecentBefore = pointsBeforeCutoff[pointsBeforeCutoff.length - 1];
          filteredHistory = [{
            marketId,
            timestamp: cutoffTime,
            oddsA: mostRecentBefore.oddsA,
            oddsB: mostRecentBefore.oddsB,
          }];
        } else {
          // Use the oldest point available as a starting reference
          const oldestPoint = history[0];
          filteredHistory = [{
            marketId,
            timestamp: cutoffTime,
            oddsA: oldestPoint.oddsA,
            oddsB: oldestPoint.oddsB,
          }];
        }
      } else {
        // No history at all, create a starting point with current probabilities
        const currentOddsA = currentProbA > 0 ? 100 / currentProbA : 2;
        const currentOddsB = currentProbB > 0 ? 100 / currentProbB : 2;
        filteredHistory = [{
          marketId,
          timestamp: cutoffTime,
          oddsA: currentOddsA,
          oddsB: currentOddsB,
        }];
      }
    }

    // Convert odds to probabilities
    let data = filteredHistory.map((snapshot) => {
      const probA = snapshot.oddsA > 0 ? (1 / snapshot.oddsA) * 100 : 50;
      const probB = snapshot.oddsB > 0 ? (1 / snapshot.oddsB) * 100 : 50;
      return {
        timestamp: snapshot.timestamp,
        probA,
        probB,
      };
    });

    // Add current point only if it's different from the last point or if we have no data
    const lastDataPoint = data.length > 0 ? data[data.length - 1] : null;
    if (!lastDataPoint || 
        Math.abs(lastDataPoint.probA - currentProbA) > 0.1 || 
        Math.abs(lastDataPoint.probB - currentProbB) > 0.1 ||
        (now - lastDataPoint.timestamp) > 1000) { // At least 1 second difference
      data.push({
        timestamp: now,
        probA: currentProbA,
        probB: currentProbB,
      });
    }

    // If we have too many points, sample them to show more variation
    // Keep first point, last point, and sample evenly in between
    if (data.length > 20) {
      const sampled: typeof data = [];
      const step = Math.ceil(data.length / 20);
      
      // Always include first point
      sampled.push(data[0]);
      
      // Sample points in between
      for (let i = step; i < data.length - 1; i += step) {
        sampled.push(data[i]);
      }
      
      // Always include last point
      if (sampled[sampled.length - 1] !== data[data.length - 1]) {
        sampled.push(data[data.length - 1]);
      }
      
      data = sampled;
    }

    // Don't interpolate if we have enough real data points
    // Only interpolate if we have very few points (less than 5) to show some movement
    if (data.length < 5 && data.length > 1) {
      const interpolated: typeof data = [];
      const totalPoints = Math.min(20, Math.max(5, data.length * 2));
      
      for (let i = 0; i < totalPoints; i++) {
        const ratio = i / (totalPoints - 1);
        const index = ratio * (data.length - 1);
        const lowerIndex = Math.floor(index);
        const upperIndex = Math.min(Math.ceil(index), data.length - 1);
        const t = index - lowerIndex;
        
        if (lowerIndex === upperIndex) {
          interpolated.push(data[lowerIndex]);
        } else {
          const lower = data[lowerIndex];
          const upper = data[upperIndex];
          // Use smooth interpolation (ease-in-out) to make transitions more gradual
          const smoothT = t * t * (3 - 2 * t);
          interpolated.push({
            timestamp: lower.timestamp + (upper.timestamp - lower.timestamp) * smoothT,
            probA: lower.probA + (upper.probA - lower.probA) * smoothT,
            probB: lower.probB + (upper.probB - lower.probB) * smoothT,
          });
        }
      }
      
      data = interpolated;
    }

    return data;
  }, [timeRange, currentProbA, currentProbB, marketId, refreshKey]);

  // Always show chart, even if no data (will show current point)
  if (!chartData || chartData.length === 0) {
    // Fallback: show at least current point
    const fallbackData = [{
      timestamp: Date.now(),
      probA: currentProbA,
      probB: currentProbB,
    }];
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-1">
              {(["1H", "6H", "1D", "1W", "1M", "ALL"] as TimeRange[]).map((range) => (
                <Button
                  key={range}
                  variant={timeRange === range ? "default" : "ghost"}
                  size="sm"
                  className={`h-7 px-3 text-xs ${
                    timeRange === range
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  onClick={() => setTimeRange(range)}
                >
                  {range}
                </Button>
              ))}
            </div>
          </div>
          <div className="text-center py-8 text-muted-foreground text-sm">
            Aguardando dados do histórico...
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate min and max for Y axis (0-100% range)
  const minProb = 0;
  const maxProb = 100;
  const probRange = 100;

  // Chart dimensions
  const chartHeight = 200;
  const chartWidth = 100;
  const paddingTop = 20;
  const paddingBottom = 30;
  const paddingLeft = 12;
  const paddingRight = 8;
  const innerHeight = chartHeight - paddingTop - paddingBottom;
  const innerWidth = chartWidth - paddingLeft - paddingRight;

  // Convert to chart coordinates
  const getY = (prob: number) => {
    const normalized = Math.max(0, Math.min(100, prob)) / 100;
    return paddingTop + innerHeight - normalized * innerHeight;
  };

  const getX = (index: number) => {
    if (chartData.length === 1) return paddingLeft + innerWidth / 2;
    
    // Use actual timestamps for X-axis positioning to show real time distribution
    const firstTimestamp = chartData[0].timestamp;
    const lastTimestamp = chartData[chartData.length - 1].timestamp;
    const timeRange = lastTimestamp - firstTimestamp;
    
    if (timeRange === 0) {
      // All points at same time, use linear distribution
      return paddingLeft + (index / (chartData.length - 1)) * innerWidth;
    }
    
    // Position based on actual timestamp
    const pointTimestamp = chartData[index].timestamp;
    const timeRatio = (pointTimestamp - firstTimestamp) / timeRange;
    return paddingLeft + timeRatio * innerWidth;
  };

  // Generate smooth paths (simple line, no curves)
  const pathA = chartData
    .map((d, i) => `${i === 0 ? "M" : "L"} ${getX(i)} ${getY(d.probA)}`)
    .join(" ");

  const pathB = chartData
    .map((d, i) => `${i === 0 ? "M" : "L"} ${getX(i)} ${getY(d.probB)}`)
    .join(" ");

  // Y-axis values (10% intervals from 0 to 100)
  const yAxisValues = [0, 20, 40, 60, 80, 100];

  // Calculate change
  const firstProbA = chartData[0]?.probA || currentProbA;
  const lastProbA = currentProbA;
  const changeA = lastProbA - firstProbA;
  const changePercentA = firstProbA > 0 ? ((changeA / firstProbA) * 100).toFixed(1) : "0";

  const firstProbB = chartData[0]?.probB || currentProbB;
  const lastProbB = currentProbB;
  const changeB = lastProbB - firstProbB;
  const changePercentB = firstProbB > 0 ? ((changeB / firstProbB) * 100).toFixed(1) : "0";

  return (
    <Card>
      <CardContent className="pt-6">
        {/* Time range buttons */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-1">
            {(["1H", "6H", "1D", "1W", "1M", "ALL"] as TimeRange[]).map((range) => (
              <Button
                key={range}
                variant={timeRange === range ? "default" : "ghost"}
                size="sm"
                className={`h-7 px-3 text-xs ${
                  timeRange === range
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                onClick={() => setTimeRange(range)}
              >
                {range}
              </Button>
            ))}
          </div>
        </div>

        {/* Chart */}
        <div className="relative w-full" style={{ height: "260px" }}>
          <svg
            viewBox={`0 0 ${chartWidth} ${chartHeight}`}
            className="w-full h-full"
            preserveAspectRatio="xMidYMid meet"
          >
            {/* Grid lines */}
            {yAxisValues.map((value, index) => {
              const y = getY(value);
              return (
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
                  <text
                    x={paddingLeft - 6}
                    y={y + 3}
                    textAnchor="end"
                    fontSize="10"
                    fill="hsl(var(--muted-foreground))"
                    className="font-medium"
                  >
                    {value}%
                  </text>
                </g>
              );
            })}

            {/* Lines - Option A (Sim) */}
            <path
              d={pathA}
              fill="none"
              stroke="hsl(var(--chart-1))"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            
            {/* Lines - Option B (Não) */}
            <path
              d={pathB}
              fill="none"
              stroke="hsl(var(--chart-2))"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Current point for Option A */}
            {chartData.length > 0 && (
              <>
                <circle
                  cx={getX(chartData.length - 1)}
                  cy={getY(lastProbA)}
                  r="3.5"
                  fill="hsl(var(--chart-1))"
                  stroke="hsl(var(--background))"
                  strokeWidth="2"
                />
                <circle
                  cx={getX(chartData.length - 1)}
                  cy={getY(lastProbB)}
                  r="3.5"
                  fill="hsl(var(--chart-2))"
                  stroke="hsl(var(--background))"
                  strokeWidth="2"
                />
              </>
            )}

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
        </div>

        {/* Current probabilities with change */}
        <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1">{optionA}</p>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-chart-1">
                  {currentProbA.toFixed(1)}%
                </span>
                {Math.abs(changeA) > 0.1 && (
                  <span
                    className={`text-xs font-medium ${
                      changeA > 0 ? "text-primary" : "text-destructive"
                    }`}
                  >
                    {changeA > 0 ? "▲" : "▼"} {Math.abs(changeA).toFixed(1)}%
                  </span>
                )}
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">{optionB}</p>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-chart-2">
                  {currentProbB.toFixed(1)}%
                </span>
                {Math.abs(changeB) > 0.1 && (
                  <span
                    className={`text-xs font-medium ${
                      changeB > 0 ? "text-primary" : "text-destructive"
                    }`}
                  >
                    {changeB > 0 ? "▲" : "▼"} {Math.abs(changeB).toFixed(1)}%
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

