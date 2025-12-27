import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import Plot from "react-plotly.js";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, TrendingDown, Calendar, Activity, Newspaper, Building, Zap, RefreshCw } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

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

export function HistoricalChart({ symbol: initialSymbol = "RELIANCE", onSymbolChange }: HistoricalChartProps) {
  const [selectedSymbol, setSelectedSymbol] = useState(initialSymbol);
  const [selectedTimeframe, setSelectedTimeframe] = useState("1M");
  const [chartType, setChartType] = useState<"candlestick" | "line">("candlestick");
  const [showEvents, setShowEvents] = useState(true);
  const [showVolume, setShowVolume] = useState(true);

  const { data, isLoading, refetch, isFetching } = useQuery<HistoricalData>({
    queryKey: ["/api/historical", selectedSymbol, selectedTimeframe],
    queryFn: async () => {
      const res = await fetch(`/api/historical/${selectedSymbol}?timeframe=${selectedTimeframe}`);
      if (!res.ok) throw new Error("Failed to fetch historical data");
      return res.json();
    },
    refetchInterval: 60000,
  });

  useEffect(() => {
    if (onSymbolChange) {
      onSymbolChange(selectedSymbol);
    }
  }, [selectedSymbol, onSymbolChange]);

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
      domain: [0, 0.2],
      gridcolor: "rgba(255,255,255,0.05)",
      linecolor: "rgba(255,255,255,0.1)",
      tickfont: { size: 10 },
      title: { text: "Volume", font: { size: 10 } },
    },
    yaxis2: {
      domain: [0.25, 1],
      gridcolor: "rgba(255,255,255,0.05)",
      linecolor: "rgba(255,255,255,0.1)",
      tickfont: { size: 10 },
      tickprefix: "",
      title: { text: "Price", font: { size: 10 } },
    },
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

  return (
    <Card className="w-full bg-card/50 border-primary/20">
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
            <Button
              variant="ghost"
              size="icon"
              onClick={() => refetch()}
              disabled={isFetching}
              data-testid="button-refresh-chart"
            >
              <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
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

      <CardContent className="p-0">
        <div className="w-full h-[400px]">
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
}
