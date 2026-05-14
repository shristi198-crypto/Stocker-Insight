import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  TrendingUp, 
  TrendingDown, 
  Star, 
  Plus, 
  X, 
  BarChart3,
  PieChart,
  Activity,
  Settings,
  Eye,
  EyeOff,
  Loader2,
  Wifi,
  WifiOff
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface StockQuote {
  symbol: string;
  price: number;
  change: number;
  pChange: number;
  companyName: string;
  isLive: boolean;
}

interface GainerLoser {
  symbol: string;
  companyName: string;
  lastPrice: number;
  change: number;
  pChange: number;
  totalTradedVolume: number;
}

interface SectorData {
  name: string;
  change: number;
  isLive: boolean;
}

interface IndexData {
  name: string;
  lastPrice: number;
  change: number;
  pChange: number;
  open: number;
  high: number;
  low: number;
  previousClose: number;
}

const STORAGE_KEY = "stocker-dashboard-config";

interface DashboardConfig {
  watchlist: string[];
  visibleWidgets: {
    watchlist: boolean;
    topGainers: boolean;
    topLosers: boolean;
    sectorPerformance: boolean;
    marketIndices: boolean;
  };
}

const defaultConfig: DashboardConfig = {
  watchlist: ["RELIANCE", "TCS", "INFY"],
  visibleWidgets: {
    watchlist: true,
    topGainers: true,
    topLosers: true,
    sectorPerformance: true,
    marketIndices: true,
  },
};

function loadConfig(): DashboardConfig {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return { ...defaultConfig, ...JSON.parse(saved) };
    }
  } catch (e) {
    console.error("Failed to load dashboard config", e);
  }
  return defaultConfig;
}

function saveConfig(config: DashboardConfig) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch (e) {
    console.error("Failed to save dashboard config", e);
  }
}

export function WatchlistWidget({ watchlist, onAdd, onRemove }: { 
  watchlist: string[]; 
  onAdd: (symbol: string) => void; 
  onRemove: (symbol: string) => void;
}) {
  const [newSymbol, setNewSymbol] = useState("");

  const symbolsParam = watchlist.join(",");

  const { data, isLoading, isFetching } = useQuery<{ stocks: StockQuote[]; lastUpdated: string }>({
    queryKey: ["/api/nse/watchlist", symbolsParam],
    queryFn: async () => {
      const res = await fetch(`/api/nse/watchlist?symbols=${encodeURIComponent(symbolsParam)}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch watchlist");
      return res.json();
    },
    enabled: watchlist.length > 0,
    refetchInterval: 15000,
    staleTime: 10000,
  });

  const stockMap: Record<string, StockQuote> = {};
  if (data?.stocks) {
    data.stocks.forEach(s => { stockMap[s.symbol] = s; });
  }

  const handleAdd = () => {
    const symbol = newSymbol.trim().toUpperCase();
    if (symbol && !watchlist.includes(symbol)) {
      onAdd(symbol);
      setNewSymbol("");
    }
  };

  return (
    <Card className="border-2 border-primary/30" data-testid="widget-watchlist">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-bold flex items-center gap-2">
          <Star className="w-4 h-4 text-primary" />
          MY WATCHLIST
          {isFetching && <Loader2 className="w-3 h-3 animate-spin text-muted-foreground ml-auto" />}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex gap-2">
          <Input
            placeholder="Add symbol..."
            value={newSymbol}
            onChange={(e) => setNewSymbol(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            className="text-xs"
            data-testid="input-watchlist-add"
          />
          <Button size="icon" variant="outline" onClick={handleAdd} data-testid="button-watchlist-add">
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        {watchlist.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">
            Add stocks to your watchlist
          </p>
        ) : isLoading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-2">
            {watchlist.map((symbol) => {
              const stock = stockMap[symbol];
              return (
                <div 
                  key={symbol} 
                  className="flex items-center justify-between p-2 rounded-md bg-muted/30 hover-elevate"
                  data-testid={`watchlist-item-${symbol}`}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-sm">{symbol}</span>
                    {stock && stock.price > 0 && (
                      <span className="text-xs text-muted-foreground font-mono">
                        ₹{stock.price.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                      </span>
                    )}
                    {stock && !stock.isLive && (
                      <WifiOff className="w-3 h-3 text-muted-foreground opacity-50" />
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {stock && stock.price > 0 && (
                      <Badge 
                        variant={stock.pChange >= 0 ? "default" : "destructive"}
                        className="text-[10px] font-mono"
                      >
                        {stock.pChange >= 0 ? "+" : ""}{stock.pChange.toFixed(2)}%
                      </Badge>
                    )}
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      className="h-6 w-6"
                      onClick={() => onRemove(symbol)}
                      data-testid={`button-remove-${symbol}`}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        {data?.lastUpdated && (
          <p className="text-[10px] text-muted-foreground text-right">
            <Wifi className="w-2.5 h-2.5 inline mr-1 text-emerald-400" />
            {data.lastUpdated}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export function TopMoversWidget({ type }: { type: "gainers" | "losers" }) {
  const { data, isLoading, isFetching } = useQuery<{ gainers: GainerLoser[]; losers: GainerLoser[]; lastUpdated: string }>({
    queryKey: ["/api/nse/gainers-losers"],
    refetchInterval: 15000,
    staleTime: 10000,
  });

  const stocks = type === "gainers"
    ? (data?.gainers || []).slice(0, 5)
    : (data?.losers || []).slice(0, 5);

  const Icon = type === "gainers" ? TrendingUp : TrendingDown;
  const color = type === "gainers" ? "text-emerald-400" : "text-red-400";

  return (
    <Card className="border-2 border-primary/30" data-testid={`widget-top-${type}`}>
      <CardHeader className="pb-2">
        <CardTitle className={`text-sm font-bold flex items-center gap-2 ${color}`}>
          <Icon className="w-4 h-4" />
          TOP {type.toUpperCase()}
          {isFetching && <Loader2 className="w-3 h-3 animate-spin text-muted-foreground ml-auto" />}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-2">
            {stocks.map((stock, index) => (
              <div 
                key={stock.symbol} 
                className="flex items-center justify-between"
                data-testid={`${type}-item-${index}`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground w-4">{index + 1}</span>
                  <div>
                    <p className="font-mono text-sm font-medium">{stock.symbol}</p>
                    <p className="text-[10px] text-muted-foreground font-mono">₹{stock.lastPrice?.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</p>
                  </div>
                </div>
                <Badge 
                  variant={type === "gainers" ? "default" : "destructive"}
                  className="text-[10px] font-mono"
                >
                  {stock.pChange >= 0 ? "+" : ""}{stock.pChange?.toFixed(2)}%
                </Badge>
              </div>
            ))}
            {data?.lastUpdated && (
              <p className="text-[10px] text-muted-foreground text-right pt-1">
                <Wifi className="w-2.5 h-2.5 inline mr-1 text-emerald-400" />
                Live NSE
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function SectorPerformanceWidget() {
  const { data, isLoading, isFetching } = useQuery<{ sectors: SectorData[]; lastUpdated: string }>({
    queryKey: ["/api/nse/sector-performance"],
    refetchInterval: 30000,
    staleTime: 25000,
  });

  return (
    <Card className="border-2 border-primary/30" data-testid="widget-sectors">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-bold flex items-center gap-2">
          <PieChart className="w-4 h-4 text-primary" />
          SECTOR PERFORMANCE
          {isFetching && <Loader2 className="w-3 h-3 animate-spin text-muted-foreground ml-auto" />}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-2">
              {(data?.sectors || []).map((sector) => (
                <div 
                  key={sector.name} 
                  className="flex items-center justify-between p-2 rounded-md bg-muted/30"
                  data-testid={`sector-${sector.name}`}
                >
                  <div className="flex items-center gap-1">
                    {sector.isLive ? (
                      <Wifi className="w-2.5 h-2.5 text-emerald-400 flex-shrink-0" />
                    ) : (
                      <WifiOff className="w-2.5 h-2.5 text-muted-foreground flex-shrink-0" />
                    )}
                    <span className="text-xs font-medium">{sector.name}</span>
                  </div>
                  <span className={`text-xs font-mono font-bold ${sector.change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {sector.change >= 0 ? "+" : ""}{sector.change}%
                  </span>
                </div>
              ))}
            </div>
            {data?.lastUpdated && (
              <p className="text-[10px] text-muted-foreground text-right pt-2">
                <Wifi className="w-2.5 h-2.5 inline mr-1 text-emerald-400" />
                {data.lastUpdated}
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

export function MarketIndicesWidget() {
  const { data, isLoading, isFetching } = useQuery<{ indices: IndexData[]; lastUpdated: string }>({
    queryKey: ["/api/nse/indices"],
    refetchInterval: 10000,
    staleTime: 8000,
  });

  return (
    <Card className="border-2 border-primary/30" data-testid="widget-indices">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-bold flex items-center gap-2">
          <Activity className="w-4 h-4 text-primary" />
          MARKET INDICES
          {isFetching && <Loader2 className="w-3 h-3 animate-spin text-muted-foreground ml-auto" />}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-3">
            {(data?.indices || []).map((index) => (
              <div 
                key={index.name} 
                className="flex items-center justify-between"
                data-testid={`index-${index.name.replace(/\s/g, '-')}`}
              >
                <div>
                  <p className="text-xs font-medium flex items-center gap-1">
                    <Wifi className="w-2.5 h-2.5 text-emerald-400" />
                    {index.name}
                  </p>
                  <p className="text-lg font-black font-mono">
                    {index.lastPrice?.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                  </p>
                </div>
                <Badge 
                  variant={index.pChange >= 0 ? "default" : "destructive"}
                  className="text-xs font-mono"
                >
                  {index.pChange >= 0 ? "+" : ""}{index.pChange?.toFixed(2)}%
                </Badge>
              </div>
            ))}
            {data?.lastUpdated && (
              <p className="text-[10px] text-muted-foreground text-right">
                {data.lastUpdated}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function WidgetSettings({ 
  config, 
  onConfigChange 
}: { 
  config: DashboardConfig; 
  onConfigChange: (config: DashboardConfig) => void;
}) {
  const widgets = [
    { key: "watchlist", label: "My Watchlist", icon: Star },
    { key: "topGainers", label: "Top Gainers", icon: TrendingUp },
    { key: "topLosers", label: "Top Losers", icon: TrendingDown },
    { key: "sectorPerformance", label: "Sector Performance", icon: PieChart },
    { key: "marketIndices", label: "Market Indices", icon: Activity },
  ] as const;

  const toggleWidget = (key: keyof DashboardConfig["visibleWidgets"]) => {
    const newConfig = {
      ...config,
      visibleWidgets: {
        ...config.visibleWidgets,
        [key]: !config.visibleWidgets[key],
      },
    };
    onConfigChange(newConfig);
    saveConfig(newConfig);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" data-testid="button-widget-settings">
          <Settings className="w-4 h-4 mr-2" />
          Customize Dashboard
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-background border-primary/30">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            Dashboard Widgets
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          {widgets.map(({ key, label, icon: Icon }) => (
            <div key={key} className="flex items-center justify-between">
              <Label className="flex items-center gap-2 cursor-pointer">
                <Icon className="w-4 h-4 text-primary" />
                {label}
              </Label>
              <div className="flex items-center gap-2">
                {config.visibleWidgets[key] ? (
                  <Eye className="w-4 h-4 text-emerald-400" />
                ) : (
                  <EyeOff className="w-4 h-4 text-muted-foreground" />
                )}
                <Switch
                  checked={config.visibleWidgets[key]}
                  onCheckedChange={() => toggleWidget(key)}
                  data-testid={`switch-${key}`}
                />
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function CustomizableDashboard() {
  const [config, setConfig] = useState<DashboardConfig>(loadConfig);

  const addToWatchlist = (symbol: string) => {
    const newConfig = {
      ...config,
      watchlist: [...config.watchlist, symbol],
    };
    setConfig(newConfig);
    saveConfig(newConfig);
  };

  const removeFromWatchlist = (symbol: string) => {
    const newConfig = {
      ...config,
      watchlist: config.watchlist.filter(s => s !== symbol),
    };
    setConfig(newConfig);
    saveConfig(newConfig);
  };

  const { visibleWidgets } = config;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold flex items-center gap-2" data-testid="text-dashboard-title">
          <BarChart3 className="w-5 h-5 text-primary" />
          Your Market Overview
        </h2>
        <WidgetSettings config={config} onConfigChange={setConfig} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {visibleWidgets.marketIndices && <MarketIndicesWidget />}
        {visibleWidgets.watchlist && (
          <WatchlistWidget 
            watchlist={config.watchlist} 
            onAdd={addToWatchlist} 
            onRemove={removeFromWatchlist} 
          />
        )}
        {visibleWidgets.topGainers && <TopMoversWidget type="gainers" />}
        {visibleWidgets.topLosers && <TopMoversWidget type="losers" />}
      </div>

      {visibleWidgets.sectorPerformance && (
        <SectorPerformanceWidget />
      )}
    </div>
  );
}
