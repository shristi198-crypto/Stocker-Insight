import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import Plot from "react-plotly.js";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, TrendingDown, Calendar, Activity, Newspaper, Building, Zap, RefreshCw, Maximize2, Minimize2, BarChart2, LineChart, Layers, Target, Settings } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";

interface OHLCData {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface ChartEvent {
  date: string;
  type: string;
  title: string;
  price: number;
}

interface HistoricalData {
  symbol: string;
  timeframe: string;
  data: OHLCData[];
  events: ChartEvent[];
  lastUpdated: string;
}

interface HistoricalChartProps {
  symbol?: string;
  onSymbolChange?: (symbol: string) => void;
}

const TIMEFRAMES = [
  { value: "1D", label: "1D" },
  { value: "1W", label: "1W" },
  { value: "1M", label: "1M" },
  { value: "3M", label: "3M" },
  { value: "6M", label: "6M" },
  { value: "1Y", label: "1Y" },
  { value: "ALL", label: "ALL" },
];

const POPULAR_STOCKS = [
  "RELIANCE", "TCS", "HDFCBANK", "INFY", "ICICIBANK", 
  "BHARTIARTL", "ITC", "SBIN", "LT", "TATASTEEL"
];

// Calculate Simple Moving Average
function calculateSMA(data: number[], period: number): (number | null)[] {
  const result: (number | null)[] = [];
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      result.push(null);
    } else {
      const sum = data.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
      result.push(sum / period);
    }
  }
  return result;
}

// Calculate Exponential Moving Average
function calculateEMA(data: number[], period: number): (number | null)[] {
  const result: (number | null)[] = [];
  const multiplier = 2 / (period + 1);
  let ema: number | null = null;
  
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      result.push(null);
    } else if (i === period - 1) {
      ema = data.slice(0, period).reduce((a, b) => a + b, 0) / period;
      result.push(ema);
    } else {
      ema = (data[i] - ema!) * multiplier + ema!;
      result.push(ema);
    }
  }
  return result;
}

// Calculate Bollinger Bands
function calculateBollingerBands(data: number[], period: number = 20, stdDev: number = 2): { upper: (number | null)[]; middle: (number | null)[]; lower: (number | null)[] } {
  const sma = calculateSMA(data, period);
  const upper: (number | null)[] = [];
  const lower: (number | null)[] = [];
  
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1 || sma[i] === null) {
      upper.push(null);
      lower.push(null);
    } else {
      const slice = data.slice(i - period + 1, i + 1);
      const mean = sma[i]!;
      const variance = slice.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / period;
      const std = Math.sqrt(variance);
      upper.push(mean + stdDev * std);
      lower.push(mean - stdDev * std);
    }
  }
  
  return { upper, middle: sma, lower };
}

// Calculate RSI
function calculateRSI(data: number[], period: number = 14): (number | null)[] {
  const result: (number | null)[] = [];
  const gains: number[] = [];
  const losses: number[] = [];
  
  for (let i = 1; i < data.length; i++) {
    const change = data[i] - data[i - 1];
    gains.push(change > 0 ? change : 0);
    losses.push(change < 0 ? Math.abs(change) : 0);
  }
  
  for (let i = 0; i < data.length; i++) {
    if (i < period) {
      result.push(null);
    } else {
      const avgGain = gains.slice(i - period, i).reduce((a, b) => a + b, 0) / period;
      const avgLoss = losses.slice(i - period, i).reduce((a, b) => a + b, 0) / period;
      const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
      const rsi = 100 - (100 / (1 + rs));
      result.push(rsi);
    }
  }
  
  return result;
}

// Calculate MACD
function calculateMACD(data: number[]): { macd: (number | null)[]; signal: (number | null)[]; histogram: (number | null)[] } {
  const ema12 = calculateEMA(data, 12);
  const ema26 = calculateEMA(data, 26);
  const macd: (number | null)[] = [];
  
  for (let i = 0; i < data.length; i++) {
    if (ema12[i] === null || ema26[i] === null) {
      macd.push(null);
    } else {
      macd.push(ema12[i]! - ema26[i]!);
    }
  }
  
  const signal = calculateEMA(macd.filter(v => v !== null) as number[], 9);
  const paddedSignal: (number | null)[] = new Array(data.length - signal.length).fill(null).concat(signal);
  
  const histogram: (number | null)[] = [];
  for (let i = 0; i < data.length; i++) {
    if (macd[i] === null || paddedSignal[i] === null) {
      histogram.push(null);
    } else {
      histogram.push(macd[i]! - paddedSignal[i]!);
    }
  }
  
  return { macd, signal: paddedSignal, histogram };
}

// Generate Algo Trading Buy/Sell Signals
interface TradeSignal {
  index: number;
  date: Date;
  price: number;
  type: 'BUY' | 'SELL';
  strength: number; // 1-3 (weak, medium, strong)
  reason: string;
}

function generateAlgoSignals(
  dates: Date[],
  closes: number[],
  highs: number[],
  lows: number[]
): TradeSignal[] {
  const signals: TradeSignal[] = [];
  
  // Calculate indicators
  const sma20 = calculateSMA(closes, 20);
  const sma50 = calculateSMA(closes, 50);
  const ema12 = calculateEMA(closes, 12);
  const ema26 = calculateEMA(closes, 26);
  const rsi = calculateRSI(closes, 14);
  const bb = calculateBollingerBands(closes, 20, 2);
  
  for (let i = 50; i < closes.length; i++) {
    let buyScore = 0;
    let sellScore = 0;
    const reasons: string[] = [];
    
    // Golden Cross / Death Cross (SMA 20 vs SMA 50)
    if (sma20[i] !== null && sma50[i] !== null && sma20[i-1] !== null && sma50[i-1] !== null) {
      if (sma20[i-1]! < sma50[i-1]! && sma20[i]! > sma50[i]!) {
        buyScore += 2;
        reasons.push("Golden Cross");
      } else if (sma20[i-1]! > sma50[i-1]! && sma20[i]! < sma50[i]!) {
        sellScore += 2;
        reasons.push("Death Cross");
      }
    }
    
    // EMA Crossover
    if (ema12[i] !== null && ema26[i] !== null && ema12[i-1] !== null && ema26[i-1] !== null) {
      if (ema12[i-1]! < ema26[i-1]! && ema12[i]! > ema26[i]!) {
        buyScore += 1;
        reasons.push("EMA Bullish");
      } else if (ema12[i-1]! > ema26[i-1]! && ema12[i]! < ema26[i]!) {
        sellScore += 1;
        reasons.push("EMA Bearish");
      }
    }
    
    // RSI Oversold/Overbought
    if (rsi[i] !== null && rsi[i-1] !== null) {
      if (rsi[i-1]! < 30 && rsi[i]! > 30) {
        buyScore += 1;
        reasons.push("RSI Oversold Recovery");
      } else if (rsi[i-1]! > 70 && rsi[i]! < 70) {
        sellScore += 1;
        reasons.push("RSI Overbought Reversal");
      }
    }
    
    // Bollinger Band Breakout
    if (bb.lower[i] !== null && bb.upper[i] !== null) {
      if (closes[i-1] < bb.lower[i-1]! && closes[i] > bb.lower[i]!) {
        buyScore += 1;
        reasons.push("BB Lower Bounce");
      } else if (closes[i-1] > bb.upper[i-1]! && closes[i] < bb.upper[i]!) {
        sellScore += 1;
        reasons.push("BB Upper Rejection");
      }
    }
    
    // Price above/below moving averages
    if (sma20[i] !== null && closes[i-1] < sma20[i-1]! && closes[i] > sma20[i]!) {
      buyScore += 0.5;
    } else if (sma20[i] !== null && closes[i-1] > sma20[i-1]! && closes[i] < sma20[i]!) {
      sellScore += 0.5;
    }
    
    // Generate signal if score is significant
    if (buyScore >= 2 && sellScore < 1) {
      signals.push({
        index: i,
        date: dates[i],
        price: closes[i],
        type: 'BUY',
        strength: buyScore >= 3 ? 3 : buyScore >= 2.5 ? 2 : 1,
        reason: reasons.join(" + ")
      });
    } else if (sellScore >= 2 && buyScore < 1) {
      signals.push({
        index: i,
        date: dates[i],
        price: closes[i],
        type: 'SELL',
        strength: sellScore >= 3 ? 3 : sellScore >= 2.5 ? 2 : 1,
        reason: reasons.join(" + ")
      });
    }
  }
  
  // Limit to most recent signals to avoid clutter
  return signals.slice(-10);
}

export function HistoricalChart({ symbol: initialSymbol = "RELIANCE", onSymbolChange }: HistoricalChartProps) {
  const [selectedSymbol, setSelectedSymbol] = useState(initialSymbol);
  const [selectedTimeframe, setSelectedTimeframe] = useState("1M");
  const [chartType, setChartType] = useState<"candlestick" | "line">("candlestick");
  const [showEvents, setShowEvents] = useState(true);
  const [showVolume, setShowVolume] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Technical Indicators
  const [showSMA20, setShowSMA20] = useState(false);
  const [showSMA50, setShowSMA50] = useState(false);
  const [showEMA20, setShowEMA20] = useState(false);
  const [showBollingerBands, setShowBollingerBands] = useState(false);
  const [showRSI, setShowRSI] = useState(false);
  
  // Comparison
  const [compareSymbol, setCompareSymbol] = useState<string | null>(null);
  
  // Price levels
  const [showSupportResistance, setShowSupportResistance] = useState(false);
  
  // Algo Trading Signals
  const [showAlgoSignals, setShowAlgoSignals] = useState(false);

  const { data, isLoading, refetch, isFetching } = useQuery<HistoricalData>({
    queryKey: ["/api/historical", selectedSymbol, selectedTimeframe],
    queryFn: async () => {
      const res = await fetch(`/api/historical/${selectedSymbol}?timeframe=${selectedTimeframe}`);
      if (!res.ok) throw new Error("Failed to fetch historical data");
      return res.json();
    },
    refetchInterval: 60000,
  });

  // Comparison stock data
  const { data: compareData } = useQuery<HistoricalData>({
    queryKey: ["/api/historical", compareSymbol, selectedTimeframe],
    queryFn: async () => {
      if (!compareSymbol) return null;
      const res = await fetch(`/api/historical/${compareSymbol}?timeframe=${selectedTimeframe}`);
      if (!res.ok) throw new Error("Failed to fetch comparison data");
      return res.json();
    },
    enabled: !!compareSymbol,
    refetchInterval: 60000,
  });

  useEffect(() => {
    if (onSymbolChange) {
      onSymbolChange(selectedSymbol);
    }
  }, [selectedSymbol, onSymbolChange]);

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const handleSymbolChange = (newSymbol: string) => {
    setSelectedSymbol(newSymbol);
  };

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[400px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!data || !data.data || data.data.length === 0) {
    return (
      <Card className="w-full">
        <CardContent className="flex items-center justify-center h-[400px]">
          <p className="text-muted-foreground">No data available</p>
        </CardContent>
      </Card>
    );
  }

  const ohlcData = data.data;
  const events = data.events || [];
  
  const dates = ohlcData.map(d => new Date(d.date));
  const opens = ohlcData.map(d => d.open);
  const highs = ohlcData.map(d => d.high);
  const lows = ohlcData.map(d => d.low);
  const closes = ohlcData.map(d => d.close);
  const volumes = ohlcData.map(d => d.volume);

  const latestPrice = closes[closes.length - 1];
  const previousPrice = closes[0];
  const priceChange = latestPrice - previousPrice;
  const percentChange = ((priceChange / previousPrice) * 100).toFixed(2);
  const isPositive = priceChange >= 0;

  const traces: any[] = [];

  if (chartType === "candlestick") {
    traces.push({
      type: "candlestick",
      x: dates,
      open: opens,
      high: highs,
      low: lows,
      close: closes,
      increasing: { line: { color: "#10B981" }, fillcolor: "#10B981" },
      decreasing: { line: { color: "#EF4444" }, fillcolor: "#EF4444" },
      name: selectedSymbol,
      yaxis: "y2",
    });
  } else {
    traces.push({
      type: "scatter",
      mode: "lines",
      x: dates,
      y: closes,
      line: { color: "#D4AF37", width: 2 },
      fill: "tozeroy",
      fillcolor: "rgba(212, 175, 55, 0.1)",
      name: selectedSymbol,
      yaxis: "y2",
    });
  }

  if (showVolume) {
    const volumeColors = closes.map((close, i) => 
      i > 0 && close >= closes[i - 1] ? "rgba(16, 185, 129, 0.5)" : "rgba(239, 68, 68, 0.5)"
    );
    traces.push({
      type: "bar",
      x: dates,
      y: volumes,
      marker: { color: volumeColors },
      name: "Volume",
      yaxis: "y",
      opacity: 0.6,
    });
  }

  // Add Technical Indicators
  if (showSMA20) {
    const sma20 = calculateSMA(closes, 20);
    traces.push({
      type: "scatter",
      mode: "lines",
      x: dates,
      y: sma20,
      line: { color: "#F59E0B", width: 1.5, dash: "solid" },
      name: "SMA 20",
      yaxis: "y2",
      hovertemplate: "SMA20: %{y:.2f}<extra></extra>",
    });
  }

  if (showSMA50) {
    const sma50 = calculateSMA(closes, 50);
    traces.push({
      type: "scatter",
      mode: "lines",
      x: dates,
      y: sma50,
      line: { color: "#8B5CF6", width: 1.5, dash: "solid" },
      name: "SMA 50",
      yaxis: "y2",
      hovertemplate: "SMA50: %{y:.2f}<extra></extra>",
    });
  }

  if (showEMA20) {
    const ema20 = calculateEMA(closes, 20);
    traces.push({
      type: "scatter",
      mode: "lines",
      x: dates,
      y: ema20,
      line: { color: "#06B6D4", width: 1.5, dash: "dot" },
      name: "EMA 20",
      yaxis: "y2",
      hovertemplate: "EMA20: %{y:.2f}<extra></extra>",
    });
  }

  if (showBollingerBands) {
    const bb = calculateBollingerBands(closes, 20, 2);
    traces.push({
      type: "scatter",
      mode: "lines",
      x: dates,
      y: bb.upper,
      line: { color: "#EC4899", width: 1, dash: "dash" },
      name: "BB Upper",
      yaxis: "y2",
      hovertemplate: "BB Upper: %{y:.2f}<extra></extra>",
    });
    traces.push({
      type: "scatter",
      mode: "lines",
      x: dates,
      y: bb.lower,
      line: { color: "#EC4899", width: 1, dash: "dash" },
      name: "BB Lower",
      yaxis: "y2",
      fill: "tonexty",
      fillcolor: "rgba(236, 72, 153, 0.1)",
      hovertemplate: "BB Lower: %{y:.2f}<extra></extra>",
    });
  }

  // Add comparison stock
  if (compareSymbol && compareData?.data) {
    const compareDates = compareData.data.map(d => new Date(d.date));
    const compareCloses = compareData.data.map(d => d.close);
    const basePrice = compareCloses[0];
    const normalizedCompare = compareCloses.map(c => (c / basePrice) * closes[0]);
    
    traces.push({
      type: "scatter",
      mode: "lines",
      x: compareDates,
      y: normalizedCompare,
      line: { color: "#3B82F6", width: 2, dash: "dot" },
      name: compareSymbol,
      yaxis: "y2",
      hovertemplate: `${compareSymbol}: %{y:.2f}<extra></extra>`,
    });
  }

  // Add support/resistance levels
  if (showSupportResistance) {
    const maxPrice = Math.max(...highs);
    const minPrice = Math.min(...lows);
    const avgPrice = (maxPrice + minPrice) / 2;
    
    traces.push({
      type: "scatter",
      mode: "lines",
      x: [dates[0], dates[dates.length - 1]],
      y: [maxPrice, maxPrice],
      line: { color: "#EF4444", width: 1, dash: "dash" },
      name: "Resistance",
      yaxis: "y2",
      hovertemplate: `Resistance: ${maxPrice.toFixed(2)}<extra></extra>`,
    });
    traces.push({
      type: "scatter",
      mode: "lines",
      x: [dates[0], dates[dates.length - 1]],
      y: [minPrice, minPrice],
      line: { color: "#10B981", width: 1, dash: "dash" },
      name: "Support",
      yaxis: "y2",
      hovertemplate: `Support: ${minPrice.toFixed(2)}<extra></extra>`,
    });
  }

  // Add Algo Trading Buy/Sell Signals
  if (showAlgoSignals && dates.length > 50) {
    const algoSignals = generateAlgoSignals(dates, closes, highs, lows);
    
    const buySignals = algoSignals.filter(s => s.type === 'BUY');
    const sellSignals = algoSignals.filter(s => s.type === 'SELL');
    
    if (buySignals.length > 0) {
      traces.push({
        type: "scatter",
        mode: "markers+text",
        x: buySignals.map(s => s.date),
        y: buySignals.map(s => s.price * 0.97), // Below price
        marker: {
          symbol: "triangle-up",
          size: buySignals.map(s => 10 + s.strength * 4),
          color: "#10B981",
          line: { color: "#ffffff", width: 1 }
        },
        text: buySignals.map(() => "BUY"),
        textposition: "bottom center",
        textfont: { color: "#10B981", size: 9, family: "JetBrains Mono" },
        name: "Buy Signal",
        yaxis: "y2",
        hovertemplate: buySignals.map(s => 
          `<b>BUY SIGNAL</b><br>Price: ${s.price.toFixed(2)}<br>Strength: ${"*".repeat(s.strength)}<br>Reason: ${s.reason}<extra></extra>`
        ),
      });
    }
    
    if (sellSignals.length > 0) {
      traces.push({
        type: "scatter",
        mode: "markers+text",
        x: sellSignals.map(s => s.date),
        y: sellSignals.map(s => s.price * 1.03), // Above price
        marker: {
          symbol: "triangle-down",
          size: sellSignals.map(s => 10 + s.strength * 4),
          color: "#EF4444",
          line: { color: "#ffffff", width: 1 }
        },
        text: sellSignals.map(() => "SELL"),
        textposition: "top center",
        textfont: { color: "#EF4444", size: 9, family: "JetBrains Mono" },
        name: "Sell Signal",
        yaxis: "y2",
        hovertemplate: sellSignals.map(s => 
          `<b>SELL SIGNAL</b><br>Price: ${s.price.toFixed(2)}<br>Strength: ${"*".repeat(s.strength)}<br>Reason: ${s.reason}<extra></extra>`
        ),
      });
    }
  }

  if (showEvents && events.length > 0) {
    const eventColors: { [key: string]: string } = {
      "Corporate": "#A855F7",
      "News": "#3B82F6",
      "Volume Spike": "#10B981",
      "Dividend": "#F59E0B"
    };

    events.forEach(event => {
      traces.push({
        type: "scatter",
        mode: "markers+text",
        x: [new Date(event.date)],
        y: [event.price],
        marker: {
          size: 14,
          color: eventColors[event.type] || "#D4AF37",
          symbol: "diamond",
          line: { color: "#fff", width: 1 }
        },
        text: [event.type.charAt(0)],
        textposition: "middle center",
        textfont: { color: "#fff", size: 8, family: "Inter" },
        name: event.title,
        yaxis: "y2",
        hovertemplate: `<b>${event.title}</b><br>${event.type}<br>Price: ${event.price.toFixed(2)}<extra></extra>`,
      });
    });
  }

  // Calculate chart height based on RSI display
  const chartHeight = isFullscreen ? "calc(100vh - 200px)" : (showRSI ? "500px" : "400px");
  const priceYAxisDomain = showRSI ? [0.35, 1] : [0.25, 1];
  const volumeYAxisDomain = showRSI ? [0.15, 0.3] : [0, 0.2];

  // Add RSI indicator if enabled
  if (showRSI) {
    const rsi = calculateRSI(closes, 14);
    traces.push({
      type: "scatter",
      mode: "lines",
      x: dates,
      y: rsi,
      line: { color: "#8B5CF6", width: 1.5 },
      name: "RSI (14)",
      yaxis: "y3",
      hovertemplate: "RSI: %{y:.1f}<extra></extra>",
    });
    // Add RSI overbought/oversold lines
    traces.push({
      type: "scatter",
      mode: "lines",
      x: [dates[0], dates[dates.length - 1]],
      y: [70, 70],
      line: { color: "#EF4444", width: 1, dash: "dot" },
      name: "Overbought",
      yaxis: "y3",
      showlegend: false,
    });
    traces.push({
      type: "scatter",
      mode: "lines",
      x: [dates[0], dates[dates.length - 1]],
      y: [30, 30],
      line: { color: "#10B981", width: 1, dash: "dot" },
      name: "Oversold",
      yaxis: "y3",
      showlegend: false,
    });
  }

  const layout: any = {
    paper_bgcolor: "transparent",
    plot_bgcolor: "transparent",
    font: { family: "Inter, sans-serif", color: "#888" },
    margin: { l: 50, r: 20, t: 10, b: 40 },
    xaxis: {
      type: "date",
      gridcolor: "rgba(255,255,255,0.05)",
      linecolor: "rgba(255,255,255,0.1)",
      tickfont: { size: 10 },
      rangeslider: { visible: false },
    },
    yaxis: {
      domain: volumeYAxisDomain,
      gridcolor: "rgba(255,255,255,0.05)",
      linecolor: "rgba(255,255,255,0.1)",
      tickfont: { size: 10 },
      title: { text: "Volume", font: { size: 10 } },
    },
    yaxis2: {
      domain: priceYAxisDomain,
      gridcolor: "rgba(255,255,255,0.05)",
      linecolor: "rgba(255,255,255,0.1)",
      tickfont: { size: 10 },
      tickprefix: "",
      title: { text: "Price", font: { size: 10 } },
    },
    ...(showRSI && {
      yaxis3: {
        domain: [0, 0.12],
        gridcolor: "rgba(255,255,255,0.05)",
        linecolor: "rgba(255,255,255,0.1)",
        tickfont: { size: 10 },
        title: { text: "RSI", font: { size: 10 } },
        range: [0, 100],
      },
    }),
    showlegend: false,
    hovermode: "x unified",
    dragmode: "zoom",
  };

  const config: Partial<Plotly.Config> = {
    displayModeBar: true,
    modeBarButtonsToRemove: ["lasso2d", "select2d"] as any,
    displaylogo: false,
    responsive: true,
  };

  const chartContent = (
    <Card className={`w-full bg-card/50 border-primary/20 ${isFullscreen ? 'h-full' : ''}`}>
      <CardHeader className="pb-2">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3 flex-wrap">
            <Select value={selectedSymbol} onValueChange={handleSymbolChange}>
              <SelectTrigger className="w-[140px] border-primary/30" data-testid="select-symbol">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {POPULAR_STOCKS.map(stock => (
                  <SelectItem key={stock} value={stock}>{stock}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <div className="flex items-center gap-2">
              <span className="text-2xl font-black font-mono text-foreground">
                {latestPrice.toFixed(2)}
              </span>
              <div className={`flex items-center gap-1 ${isPositive ? 'text-bullish' : 'text-bearish'}`}>
                {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                <span className="text-sm font-bold font-mono">
                  {isPositive ? "+" : ""}{priceChange.toFixed(2)} ({isPositive ? "+" : ""}{percentChange}%)
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1 text-xs" data-testid="button-indicators">
                  <Layers className="w-3 h-3" />
                  Indicators
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64" align="end">
                <div className="space-y-4">
                  <h4 className="font-bold text-sm">Technical Indicators</h4>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox id="sma20" checked={showSMA20} onCheckedChange={(c) => setShowSMA20(!!c)} />
                      <Label htmlFor="sma20" className="text-sm flex items-center gap-2">
                        <div className="w-3 h-0.5 bg-amber-500" />
                        SMA 20
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="sma50" checked={showSMA50} onCheckedChange={(c) => setShowSMA50(!!c)} />
                      <Label htmlFor="sma50" className="text-sm flex items-center gap-2">
                        <div className="w-3 h-0.5 bg-purple-500" />
                        SMA 50
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="ema20" checked={showEMA20} onCheckedChange={(c) => setShowEMA20(!!c)} />
                      <Label htmlFor="ema20" className="text-sm flex items-center gap-2">
                        <div className="w-3 h-0.5 bg-cyan-500 border-dashed" />
                        EMA 20
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="bb" checked={showBollingerBands} onCheckedChange={(c) => setShowBollingerBands(!!c)} />
                      <Label htmlFor="bb" className="text-sm flex items-center gap-2">
                        <div className="w-3 h-0.5 bg-pink-500" />
                        Bollinger Bands
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="rsi" checked={showRSI} onCheckedChange={(c) => setShowRSI(!!c)} />
                      <Label htmlFor="rsi" className="text-sm flex items-center gap-2">
                        <div className="w-3 h-0.5 bg-violet-500" />
                        RSI (14)
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="sr" checked={showSupportResistance} onCheckedChange={(c) => setShowSupportResistance(!!c)} />
                      <Label htmlFor="sr" className="text-sm flex items-center gap-2">
                        <Target className="w-3 h-3" />
                        Support/Resistance
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="algo" checked={showAlgoSignals} onCheckedChange={(c) => setShowAlgoSignals(!!c)} />
                      <Label htmlFor="algo" className="text-sm flex items-center gap-2">
                        <Zap className="w-3 h-3 text-yellow-500" />
                        Algo Buy/Sell Signals
                      </Label>
                    </div>
                  </div>
                  <div className="border-t pt-3">
                    <h4 className="font-bold text-sm mb-2">Compare With</h4>
                    <Select value={compareSymbol || "none"} onValueChange={(v) => setCompareSymbol(v === "none" ? null : v)}>
                      <SelectTrigger className="w-full" data-testid="select-compare">
                        <SelectValue placeholder="Select stock..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {POPULAR_STOCKS.filter(s => s !== selectedSymbol).map(stock => (
                          <SelectItem key={stock} value={stock}>{stock}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => refetch()}
              disabled={isFetching}
              data-testid="button-refresh-chart"
            >
              <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleFullscreen}
              data-testid="button-fullscreen"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mt-3">
          <div className="flex gap-1 p-1 bg-secondary/50 rounded-md">
            {TIMEFRAMES.map(tf => (
              <Button
                key={tf.value}
                variant={selectedTimeframe === tf.value ? "default" : "ghost"}
                size="sm"
                className={`text-xs px-2 py-1 h-7 ${selectedTimeframe === tf.value ? 'bg-primary text-primary-foreground' : ''}`}
                onClick={() => setSelectedTimeframe(tf.value)}
                data-testid={`button-timeframe-${tf.value}`}
              >
                {tf.label}
              </Button>
            ))}
          </div>

          <div className="flex gap-1 p-1 bg-secondary/50 rounded-md">
            <Button
              variant={chartType === "candlestick" ? "default" : "ghost"}
              size="sm"
              className={`text-xs px-2 py-1 h-7 ${chartType === "candlestick" ? 'bg-primary text-primary-foreground' : ''}`}
              onClick={() => setChartType("candlestick")}
              data-testid="button-chart-candlestick"
            >
              Candles
            </Button>
            <Button
              variant={chartType === "line" ? "default" : "ghost"}
              size="sm"
              className={`text-xs px-2 py-1 h-7 ${chartType === "line" ? 'bg-primary text-primary-foreground' : ''}`}
              onClick={() => setChartType("line")}
              data-testid="button-chart-line"
            >
              Line
            </Button>
          </div>

          <div className="flex gap-1 p-1 bg-secondary/50 rounded-md">
            <Button
              variant={showVolume ? "default" : "ghost"}
              size="sm"
              className={`text-xs px-2 py-1 h-7 gap-1 ${showVolume ? 'bg-primary text-primary-foreground' : ''}`}
              onClick={() => setShowVolume(!showVolume)}
              data-testid="button-toggle-volume"
            >
              <Activity className="w-3 h-3" />
              Vol
            </Button>
            <Button
              variant={showEvents ? "default" : "ghost"}
              size="sm"
              className={`text-xs px-2 py-1 h-7 gap-1 ${showEvents ? 'bg-primary text-primary-foreground' : ''}`}
              onClick={() => setShowEvents(!showEvents)}
              data-testid="button-toggle-events"
            >
              <Calendar className="w-3 h-3" />
              Events
            </Button>
          </div>
        </div>

        {showEvents && events.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            <span className="text-xs text-muted-foreground">Events:</span>
            {events.map((event, idx) => {
              const icons: { [key: string]: any } = {
                "Corporate": <Building className="w-3 h-3" />,
                "News": <Newspaper className="w-3 h-3" />,
                "Volume Spike": <Zap className="w-3 h-3" />,
                "Dividend": <TrendingUp className="w-3 h-3" />
              };
              const colors: { [key: string]: string } = {
                "Corporate": "bg-purple-500/20 border-purple-500/40 text-purple-400",
                "News": "bg-blue-500/20 border-blue-500/40 text-blue-400",
                "Volume Spike": "bg-emerald-500/20 border-emerald-500/40 text-emerald-400",
                "Dividend": "bg-amber-500/20 border-amber-500/40 text-amber-400"
              };
              return (
                <Badge 
                  key={idx} 
                  variant="outline" 
                  className={`text-[10px] ${colors[event.type] || ''}`}
                  data-testid={`badge-event-${idx}`}
                >
                  {icons[event.type]}
                  <span className="ml-1">{event.title}</span>
                </Badge>
              );
            })}
          </div>
        )}
      </CardHeader>

      {/* Active Indicators Legend */}
      {(showSMA20 || showSMA50 || showEMA20 || showBollingerBands || showRSI || compareSymbol || showAlgoSignals) && (
        <div className="px-4 pb-2 flex flex-wrap gap-2">
          {showSMA20 && (
            <Badge variant="outline" className="text-[10px] text-amber-500 border-amber-500/40 bg-amber-500/10">
              SMA 20
            </Badge>
          )}
          {showSMA50 && (
            <Badge variant="outline" className="text-[10px] text-purple-500 border-purple-500/40 bg-purple-500/10">
              SMA 50
            </Badge>
          )}
          {showEMA20 && (
            <Badge variant="outline" className="text-[10px] text-cyan-500 border-cyan-500/40 bg-cyan-500/10">
              EMA 20
            </Badge>
          )}
          {showBollingerBands && (
            <Badge variant="outline" className="text-[10px] text-pink-500 border-pink-500/40 bg-pink-500/10">
              BB (20,2)
            </Badge>
          )}
          {showRSI && (
            <Badge variant="outline" className="text-[10px] text-violet-500 border-violet-500/40 bg-violet-500/10">
              RSI 14
            </Badge>
          )}
          {compareSymbol && (
            <Badge variant="outline" className="text-[10px] text-blue-500 border-blue-500/40 bg-blue-500/10">
              vs {compareSymbol}
            </Badge>
          )}
          {showSupportResistance && (
            <Badge variant="outline" className="text-[10px] text-emerald-500 border-emerald-500/40 bg-emerald-500/10">
              S/R Levels
            </Badge>
          )}
          {showAlgoSignals && (
            <Badge variant="outline" className="text-[10px] text-yellow-500 border-yellow-500/40 bg-yellow-500/10">
              <Zap className="w-2 h-2 mr-1" />
              Algo Signals
            </Badge>
          )}
        </div>
      )}

      <CardContent className="p-0">
        <div className="w-full" style={{ height: chartHeight }}>
          <Plot
            data={traces}
            layout={layout}
            config={config}
            style={{ width: "100%", height: "100%" }}
            useResizeHandler
          />
        </div>
      </CardContent>
    </Card>
  );

  // Wrap in fullscreen overlay if needed
  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm p-4 overflow-auto" data-testid="chart-fullscreen">
        {chartContent}
      </div>
    );
  }

  return chartContent;
}
