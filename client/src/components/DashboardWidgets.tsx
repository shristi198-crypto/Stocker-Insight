import { useState, useEffect } from "react";
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
  EyeOff
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

interface Stock {
  symbol: string;
  price: string;
  change: number;
}

interface SectorData {
  name: string;
  change: number;
}

interface IndexData {
  name: string;
  value: string;
  change: number;
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
  const [prices, setPrices] = useState<Record<string, Stock>>({});

  useEffect(() => {
    const generatePrices = () => {
      const newPrices: Record<string, Stock> = {};
      watchlist.forEach(symbol => {
        const basePrice = Math.random() * 3000 + 500;
        const change = (Math.random() - 0.5) * 5;
        newPrices[symbol] = {
          symbol,
          price: basePrice.toFixed(2),
          change: parseFloat(change.toFixed(2))
        };
      });
      setPrices(newPrices);
    };
    
    generatePrices();
    const interval = setInterval(generatePrices, 5000);
    return () => clearInterval(interval);
  }, [watchlist]);

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
        ) : (
          <div className="space-y-2">
            {watchlist.map((symbol) => {
              const stock = prices[symbol];
              return (
                <div 
                  key={symbol} 
                  className="flex items-center justify-between p-2 rounded-md bg-muted/30 hover-elevate"
                  data-testid={`watchlist-item-${symbol}`}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-sm">{symbol}</span>
                    {stock && (
                      <span className="text-xs text-muted-foreground font-mono">
                        ₹{stock.price}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {stock && (
                      <Badge 
                        variant={stock.change >= 0 ? "default" : "destructive"}
                        className="text-[10px] font-mono"
                      >
                        {stock.change >= 0 ? "+" : ""}{stock.change}%
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
      </CardContent>
    </Card>
  );
}

export function TopMoversWidget({ type }: { type: "gainers" | "losers" }) {
  const [stocks, setStocks] = useState<Stock[]>([]);

  useEffect(() => {
    const symbols = type === "gainers" 
      ? ["ADANIPORTS", "TATASTEEL", "HINDALCO", "COALINDIA", "ONGC"]
      : ["TECHM", "WIPRO", "HCLTECH", "INFY", "TCS"];
    
    const generateData = () => {
      setStocks(symbols.map(symbol => ({
        symbol,
        price: (Math.random() * 2000 + 200).toFixed(2),
        change: type === "gainers" 
          ? parseFloat((Math.random() * 5 + 1).toFixed(2))
          : parseFloat((-Math.random() * 5 - 0.5).toFixed(2))
      })));
    };
    
    generateData();
    const interval = setInterval(generateData, 5000);
    return () => clearInterval(interval);
  }, [type]);

  const Icon = type === "gainers" ? TrendingUp : TrendingDown;
  const color = type === "gainers" ? "text-emerald-400" : "text-red-400";

  return (
    <Card className="border-2 border-primary/30" data-testid={`widget-top-${type}`}>
      <CardHeader className="pb-2">
        <CardTitle className={`text-sm font-bold flex items-center gap-2 ${color}`}>
          <Icon className="w-4 h-4" />
          TOP {type.toUpperCase()}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {stocks.map((stock, index) => (
            <div 
              key={stock.symbol} 
              className="flex items-center justify-between"
              data-testid={`${type}-item-${index}`}
            >
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground w-4">{index + 1}</span>
                <span className="font-mono text-sm font-medium">{stock.symbol}</span>
              </div>
              <Badge 
                variant={type === "gainers" ? "default" : "destructive"}
                className="text-[10px] font-mono"
              >
                {stock.change >= 0 ? "+" : ""}{stock.change}%
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function SectorPerformanceWidget() {
  const [sectors, setSectors] = useState<SectorData[]>([]);

  useEffect(() => {
    const sectorNames = ["IT", "Banking", "Pharma", "Auto", "Energy", "FMCG", "Metal", "Realty"];
    
    const generateData = () => {
      setSectors(sectorNames.map(name => ({
        name,
        change: parseFloat((Math.random() * 6 - 3).toFixed(2))
      })));
    };
    
    generateData();
    const interval = setInterval(generateData, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Card className="border-2 border-primary/30" data-testid="widget-sectors">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-bold flex items-center gap-2">
          <PieChart className="w-4 h-4 text-primary" />
          SECTOR PERFORMANCE
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-2">
          {sectors.map((sector) => (
            <div 
              key={sector.name} 
              className="flex items-center justify-between p-2 rounded-md bg-muted/30"
              data-testid={`sector-${sector.name}`}
            >
              <span className="text-xs font-medium">{sector.name}</span>
              <span className={`text-xs font-mono font-bold ${sector.change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {sector.change >= 0 ? "+" : ""}{sector.change}%
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function MarketIndicesWidget() {
  const [indices, setIndices] = useState<IndexData[]>([]);

  useEffect(() => {
    const generateData = () => {
      setIndices([
        { name: "SENSEX", value: (72500 + Math.random() * 500).toFixed(0), change: parseFloat((Math.random() * 2 - 1).toFixed(2)) },
        { name: "NIFTY 50", value: (22000 + Math.random() * 100).toFixed(0), change: parseFloat((Math.random() * 2 - 1).toFixed(2)) },
        { name: "NIFTY BANK", value: (48000 + Math.random() * 200).toFixed(0), change: parseFloat((Math.random() * 2.5 - 1.25).toFixed(2)) },
        { name: "NIFTY IT", value: (35000 + Math.random() * 300).toFixed(0), change: parseFloat((Math.random() * 3 - 1.5).toFixed(2)) },
      ]);
    };
    
    generateData();
    const interval = setInterval(generateData, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Card className="border-2 border-primary/30" data-testid="widget-indices">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-bold flex items-center gap-2">
          <Activity className="w-4 h-4 text-primary" />
          MARKET INDICES
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {indices.map((index) => (
            <div 
              key={index.name} 
              className="flex items-center justify-between"
              data-testid={`index-${index.name.replace(/\s/g, '-')}`}
            >
              <div>
                <p className="text-xs font-medium">{index.name}</p>
                <p className="text-lg font-black font-mono">{parseFloat(index.value).toLocaleString('en-IN')}</p>
              </div>
              <Badge 
                variant={index.change >= 0 ? "default" : "destructive"}
                className="text-xs font-mono"
              >
                {index.change >= 0 ? "+" : ""}{index.change}%
              </Badge>
            </div>
          ))}
        </div>
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
