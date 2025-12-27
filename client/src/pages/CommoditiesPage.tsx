import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  TrendingUp, 
  TrendingDown, 
  Flame, 
  Droplets, 
  Gem, 
  Wheat, 
  RefreshCw,
  Clock,
  BarChart3,
  Globe,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";

interface Commodity {
  name: string;
  symbol: string;
  price: number;
  change: number;
  high: number;
  low: number;
  volume: string;
  icon: typeof Gem;
  color: string;
  unit: string;
}

interface MCXContract {
  name: string;
  expiry: string;
  price: number;
  change: number;
  open: number;
  high: number;
  low: number;
  volume: string;
}

export default function CommoditiesPage() {
  const [commodities, setCommodities] = useState<Commodity[]>([]);
  const [mcxContracts, setMcxContracts] = useState<MCXContract[]>([]);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  const generateCommodityData = () => {
    return [
      { 
        name: "Gold", 
        symbol: "GOLD", 
        price: 62500 + Math.random() * 500, 
        change: (Math.random() - 0.5) * 2,
        high: 63000 + Math.random() * 200,
        low: 62000 + Math.random() * 200,
        volume: `${(Math.random() * 50 + 20).toFixed(1)}K`,
        icon: Gem, 
        color: "text-yellow-500",
        unit: "per 10g"
      },
      { 
        name: "Silver", 
        symbol: "SILVER", 
        price: 74500 + Math.random() * 1000, 
        change: (Math.random() - 0.5) * 3,
        high: 75500 + Math.random() * 300,
        low: 73500 + Math.random() * 300,
        volume: `${(Math.random() * 30 + 10).toFixed(1)}K`,
        icon: Droplets, 
        color: "text-slate-400",
        unit: "per Kg"
      },
      { 
        name: "Crude Oil", 
        symbol: "CRUDEOIL", 
        price: 6200 + Math.random() * 200, 
        change: (Math.random() - 0.5) * 4,
        high: 6400 + Math.random() * 50,
        low: 6100 + Math.random() * 50,
        volume: `${(Math.random() * 80 + 40).toFixed(1)}K`,
        icon: Flame, 
        color: "text-orange-500",
        unit: "per barrel"
      },
      { 
        name: "Natural Gas", 
        symbol: "NATURALGAS", 
        price: 195 + Math.random() * 20, 
        change: (Math.random() - 0.5) * 5,
        high: 210 + Math.random() * 10,
        low: 185 + Math.random() * 10,
        volume: `${(Math.random() * 60 + 30).toFixed(1)}K`,
        icon: Flame, 
        color: "text-blue-400",
        unit: "per mmBtu"
      },
      { 
        name: "Copper", 
        symbol: "COPPER", 
        price: 725 + Math.random() * 30, 
        change: (Math.random() - 0.5) * 2.5,
        high: 750 + Math.random() * 10,
        low: 710 + Math.random() * 10,
        volume: `${(Math.random() * 25 + 15).toFixed(1)}K`,
        icon: Gem, 
        color: "text-amber-600",
        unit: "per Kg"
      },
      { 
        name: "Aluminium", 
        symbol: "ALUMINIUM", 
        price: 205 + Math.random() * 10, 
        change: (Math.random() - 0.5) * 2,
        high: 212 + Math.random() * 5,
        low: 200 + Math.random() * 5,
        volume: `${(Math.random() * 20 + 10).toFixed(1)}K`,
        icon: Gem, 
        color: "text-gray-400",
        unit: "per Kg"
      },
      { 
        name: "Cotton", 
        symbol: "COTTON", 
        price: 56000 + Math.random() * 2000, 
        change: (Math.random() - 0.5) * 3,
        high: 58000 + Math.random() * 500,
        low: 54000 + Math.random() * 500,
        volume: `${(Math.random() * 15 + 5).toFixed(1)}K`,
        icon: Wheat, 
        color: "text-emerald-500",
        unit: "per bale"
      },
      { 
        name: "Zinc", 
        symbol: "ZINC", 
        price: 245 + Math.random() * 15, 
        change: (Math.random() - 0.5) * 2.5,
        high: 258 + Math.random() * 5,
        low: 238 + Math.random() * 5,
        volume: `${(Math.random() * 18 + 8).toFixed(1)}K`,
        icon: Gem, 
        color: "text-zinc-400",
        unit: "per Kg"
      },
    ];
  };

  const generateMCXContracts = () => {
    const months = ["JAN", "FEB", "MAR"];
    return [
      ...months.map(m => ({
        name: "GOLD",
        expiry: `${m} 2025`,
        price: 62500 + Math.random() * 500,
        change: (Math.random() - 0.5) * 2,
        open: 62400 + Math.random() * 200,
        high: 63000 + Math.random() * 200,
        low: 62000 + Math.random() * 200,
        volume: `${(Math.random() * 50 + 20).toFixed(1)}K`,
      })),
      ...months.map(m => ({
        name: "SILVER",
        expiry: `${m} 2025`,
        price: 74500 + Math.random() * 1000,
        change: (Math.random() - 0.5) * 3,
        open: 74000 + Math.random() * 500,
        high: 75500 + Math.random() * 300,
        low: 73500 + Math.random() * 300,
        volume: `${(Math.random() * 30 + 10).toFixed(1)}K`,
      })),
      ...months.map(m => ({
        name: "CRUDEOIL",
        expiry: `${m} 2025`,
        price: 6200 + Math.random() * 200,
        change: (Math.random() - 0.5) * 4,
        open: 6150 + Math.random() * 100,
        high: 6400 + Math.random() * 50,
        low: 6100 + Math.random() * 50,
        volume: `${(Math.random() * 80 + 40).toFixed(1)}K`,
      })),
    ];
  };

  useEffect(() => {
    setCommodities(generateCommodityData());
    setMcxContracts(generateMCXContracts());
    
    const interval = setInterval(() => {
      setCommodities(generateCommodityData());
      setMcxContracts(generateMCXContracts());
      setLastUpdated(new Date());
    }, 10000);
    
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setCommodities(generateCommodityData());
    setMcxContracts(generateMCXContracts());
    setLastUpdated(new Date());
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const topGainers = [...commodities].sort((a, b) => b.change - a.change).slice(0, 3);
  const topLosers = [...commodities].sort((a, b) => a.change - b.change).slice(0, 3);

  return (
    <Layout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight flex items-center gap-3" data-testid="text-commodities-title">
              <BarChart3 className="w-8 h-8 text-primary" />
              COMMODITIES CENTER
            </h1>
            <p className="text-muted-foreground mt-1">
              Live MCX commodity prices and market data
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="w-4 h-4" />
              Updated: {lastUpdated.toLocaleTimeString()}
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRefresh}
              disabled={isRefreshing}
              data-testid="button-refresh-commodities"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-2 border-primary/30" data-testid="stat-gold">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Gem className="w-5 h-5 text-yellow-500" />
                  <span className="text-sm font-bold">GOLD</span>
                </div>
                <Badge variant={commodities[0]?.change >= 0 ? "default" : "destructive"} className="text-[10px]">
                  {commodities[0]?.change >= 0 ? '+' : ''}{commodities[0]?.change.toFixed(2)}%
                </Badge>
              </div>
              <p className="text-2xl font-black font-mono mt-2">
                ₹{commodities[0]?.price.toFixed(0).toLocaleString()}
              </p>
              <p className="text-[10px] text-muted-foreground">per 10g</p>
            </CardContent>
          </Card>

          <Card className="border-2 border-primary/30" data-testid="stat-silver">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Droplets className="w-5 h-5 text-slate-400" />
                  <span className="text-sm font-bold">SILVER</span>
                </div>
                <Badge variant={commodities[1]?.change >= 0 ? "default" : "destructive"} className="text-[10px]">
                  {commodities[1]?.change >= 0 ? '+' : ''}{commodities[1]?.change.toFixed(2)}%
                </Badge>
              </div>
              <p className="text-2xl font-black font-mono mt-2">
                ₹{commodities[1]?.price.toFixed(0).toLocaleString()}
              </p>
              <p className="text-[10px] text-muted-foreground">per Kg</p>
            </CardContent>
          </Card>

          <Card className="border-2 border-primary/30" data-testid="stat-crude">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Flame className="w-5 h-5 text-orange-500" />
                  <span className="text-sm font-bold">CRUDE OIL</span>
                </div>
                <Badge variant={commodities[2]?.change >= 0 ? "default" : "destructive"} className="text-[10px]">
                  {commodities[2]?.change >= 0 ? '+' : ''}{commodities[2]?.change.toFixed(2)}%
                </Badge>
              </div>
              <p className="text-2xl font-black font-mono mt-2">
                ₹{commodities[2]?.price.toFixed(0).toLocaleString()}
              </p>
              <p className="text-[10px] text-muted-foreground">per barrel</p>
            </CardContent>
          </Card>

          <Card className="border-2 border-primary/30" data-testid="stat-natgas">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Flame className="w-5 h-5 text-blue-400" />
                  <span className="text-sm font-bold">NAT GAS</span>
                </div>
                <Badge variant={commodities[3]?.change >= 0 ? "default" : "destructive"} className="text-[10px]">
                  {commodities[3]?.change >= 0 ? '+' : ''}{commodities[3]?.change.toFixed(2)}%
                </Badge>
              </div>
              <p className="text-2xl font-black font-mono mt-2">
                ₹{commodities[3]?.price.toFixed(0).toLocaleString()}
              </p>
              <p className="text-[10px] text-muted-foreground">per mmBtu</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
            <TabsTrigger value="mcx" data-testid="tab-mcx">MCX Contracts</TabsTrigger>
            <TabsTrigger value="movers" data-testid="tab-movers">Top Movers</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <Card className="border-2 border-primary/30">
              <CardHeader>
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Globe className="w-4 h-4 text-primary" />
                  ALL COMMODITIES
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>COMMODITY</TableHead>
                      <TableHead className="text-right">PRICE (₹)</TableHead>
                      <TableHead className="text-right">CHANGE</TableHead>
                      <TableHead className="text-right hidden md:table-cell">HIGH</TableHead>
                      <TableHead className="text-right hidden md:table-cell">LOW</TableHead>
                      <TableHead className="text-right">VOLUME</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {commodities.map((c) => (
                      <TableRow key={c.symbol} data-testid={`row-${c.symbol}`}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <c.icon className={`w-4 h-4 ${c.color}`} />
                            <div>
                              <p className="font-bold">{c.name}</p>
                              <p className="text-[10px] text-muted-foreground">{c.unit}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-mono font-bold">
                          {c.price.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className={`flex items-center justify-end gap-1 ${c.change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {c.change >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                            <span className="font-mono text-sm">{c.change >= 0 ? '+' : ''}{c.change.toFixed(2)}%</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm hidden md:table-cell text-emerald-400">
                          {c.high.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm hidden md:table-cell text-red-400">
                          {c.low.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm">{c.volume}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="mcx" className="mt-6">
            <Card className="border-2 border-primary/30">
              <CardHeader>
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-primary" />
                  MCX FUTURES CONTRACTS
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>CONTRACT</TableHead>
                      <TableHead>EXPIRY</TableHead>
                      <TableHead className="text-right">LTP (₹)</TableHead>
                      <TableHead className="text-right">CHANGE</TableHead>
                      <TableHead className="text-right hidden md:table-cell">OPEN</TableHead>
                      <TableHead className="text-right hidden md:table-cell">HIGH</TableHead>
                      <TableHead className="text-right hidden md:table-cell">LOW</TableHead>
                      <TableHead className="text-right">VOL</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mcxContracts.map((c, idx) => (
                      <TableRow key={`${c.name}-${c.expiry}`} data-testid={`mcx-row-${idx}`}>
                        <TableCell className="font-bold">{c.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[10px]">{c.expiry}</Badge>
                        </TableCell>
                        <TableCell className="text-right font-mono font-bold">
                          {c.price.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right">
                          <span className={`font-mono text-sm ${c.change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {c.change >= 0 ? '+' : ''}{c.change.toFixed(2)}%
                          </span>
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm hidden md:table-cell">
                          {c.open.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm hidden md:table-cell text-emerald-400">
                          {c.high.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm hidden md:table-cell text-red-400">
                          {c.low.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm">{c.volume}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="movers" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="border-2 border-emerald-500/30">
                <CardHeader>
                  <CardTitle className="text-sm font-bold flex items-center gap-2 text-emerald-400">
                    <TrendingUp className="w-4 h-4" />
                    TOP GAINERS
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {topGainers.map((c, idx) => (
                    <div 
                      key={c.symbol} 
                      className="flex items-center justify-between p-3 rounded-md bg-emerald-500/10"
                      data-testid={`gainer-${idx}`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-black text-emerald-400">{idx + 1}</span>
                        <div>
                          <p className="font-bold">{c.name}</p>
                          <p className="text-xs text-muted-foreground font-mono">₹{c.price.toFixed(2)}</p>
                        </div>
                      </div>
                      <Badge variant="default" className="text-sm font-mono">
                        +{c.change.toFixed(2)}%
                      </Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="border-2 border-red-500/30">
                <CardHeader>
                  <CardTitle className="text-sm font-bold flex items-center gap-2 text-red-400">
                    <TrendingDown className="w-4 h-4" />
                    TOP LOSERS
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {topLosers.map((c, idx) => (
                    <div 
                      key={c.symbol} 
                      className="flex items-center justify-between p-3 rounded-md bg-red-500/10"
                      data-testid={`loser-${idx}`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-black text-red-400">{idx + 1}</span>
                        <div>
                          <p className="font-bold">{c.name}</p>
                          <p className="text-xs text-muted-foreground font-mono">₹{c.price.toFixed(2)}</p>
                        </div>
                      </div>
                      <Badge variant="destructive" className="text-sm font-mono">
                        {c.change.toFixed(2)}%
                      </Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
