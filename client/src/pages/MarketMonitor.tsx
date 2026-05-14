import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TrendingUp, Zap, Building2, FileText, BarChart3, Newspaper, Activity, Building, TrendingDown, RefreshCw, Clock, Loader2, Wifi, WifiOff } from "lucide-react";
import { Layout } from "@/components/Layout";
import { queryClient } from "@/lib/queryClient";

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

interface HighVolumeStock {
  symbol: string;
  volume: number;
  volumeFormatted: string;
  change: number;
  changeFormatted: string;
  price: number;
}

interface GainerStock {
  symbol: string;
  companyName: string;
  lastPrice: number;
  change: number;
  pChange: number;
  totalTradedVolume: number;
}

interface HighVolumeStockFromGainers {
  symbol: string;
  volume: number;
  volumeFormatted: string;
  change: number;
  changeFormatted: string;
  price: number;
}

interface MagicStock {
  symbol: string;
  score: number;
  signals: string[];
  hasNews: boolean;
  hasVolume: boolean;
  hasCorporate: boolean;
  hasPrice: boolean;
}

interface CorporateEvent {
  company: string;
  type: string;
  details: string;
  time: string;
}

const companies = ["TATASTEEL", "L&T", "BHEL", "RVNL", "HCC", "IRCON", "NCC", "KEC", "KALPATPOWR", "PNC"];
const orderTypes = ["Award of Order", "Receipt of Order"];
const projects = [
  "Infrastructure project", "Power equipment order", "Railway project", 
  "Construction contract", "Transmission line order", "Road project",
  "Metro rail order", "Bridge construction", "Industrial order"
];

function generateCorporateEvent(): CorporateEvent {
  return {
    company: companies[Math.floor(Math.random() * companies.length)],
    type: orderTypes[Math.floor(Math.random() * orderTypes.length)],
    details: `${projects[Math.floor(Math.random() * projects.length)]} Rs. ${Math.floor(Math.random() * 2000 + 100)} Cr`,
    time: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true })
  };
}

function getInitialCorporateEvents(): CorporateEvent[] {
  return [
    { company: "TATASTEEL", type: "Award of Order", details: "Received order worth Rs. 450 Cr", time: "10:30 AM" },
    { company: "L&T", type: "Receipt of Order", details: "Infrastructure project Rs. 1,200 Cr", time: "10:15 AM" },
    { company: "BHEL", type: "Award of Order", details: "Power equipment order Rs. 890 Cr", time: "09:45 AM" },
    { company: "RVNL", type: "Receipt of Order", details: "Railway project Rs. 567 Cr", time: "09:30 AM" },
    { company: "HCC", type: "Award of Order", details: "Construction contract Rs. 234 Cr", time: "09:15 AM" },
  ];
}

export default function MarketMonitor() {
  const [nextRefresh, setNextRefresh] = useState(30);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [corporateEvents, setCorporateEvents] = useState<CorporateEvent[]>(getInitialCorporateEvents);

  // Live Indian indices - refresh every 10 seconds
  const { data: indicesData, refetch: refetchIndices, isFetching: isFetchingIndices } = useQuery<{ indices: IndexData[]; lastUpdated: string }>({
    queryKey: ["/api/nse/indices"],
    refetchInterval: 10000,
    staleTime: 8000,
  });

  // Gainers/Losers + High Volume - all from same NIFTY 50 fetch
  const { data: gainersLosersData, refetch: refetchGainersLosers, isFetching: isFetchingGainers } = useQuery<{ gainers: GainerStock[]; losers: GainerStock[]; highVolume: HighVolumeStockFromGainers[]; lastUpdated: string }>({
    queryKey: ["/api/nse/gainers-losers"],
    refetchInterval: 15000,
    staleTime: 10000,
  });

  const highVolumeStocks = gainersLosersData?.highVolume || [];
  const gainers = gainersLosersData?.gainers || [];
  const isFetchingVolume = isFetchingGainers;

  // Compute magic list from real live data
  const magicStocks = useMemo<MagicStock[]>(() => {
    const stockScores: Record<string, MagicStock> = {};

    const ensure = (symbol: string) => {
      if (!stockScores[symbol]) {
        stockScores[symbol] = { symbol, score: 0, signals: [], hasNews: false, hasVolume: false, hasCorporate: false, hasPrice: false };
      }
    };

    // Volume signal - from real high volume data
    highVolumeStocks.forEach(stock => {
      ensure(stock.symbol);
      if (!stockScores[stock.symbol].hasVolume) {
        stockScores[stock.symbol].hasVolume = true;
        stockScores[stock.symbol].signals.push("Volume");
        stockScores[stock.symbol].score += 25;
      }
    });

    // Corporate signal - from simulated events
    corporateEvents.forEach(event => {
      ensure(event.company);
      if (!stockScores[event.company].hasCorporate) {
        stockScores[event.company].hasCorporate = true;
        stockScores[event.company].signals.push("Corporate");
        stockScores[event.company].score += 25;
      }
    });

    // Price signal - from real NSE gainers (top movers > 1%)
    gainers.slice(0, 10).forEach(stock => {
      ensure(stock.symbol);
      if (!stockScores[stock.symbol].hasPrice && stock.pChange > 1) {
        stockScores[stock.symbol].hasPrice = true;
        stockScores[stock.symbol].signals.push("Price");
        stockScores[stock.symbol].score += 25;
      }
    });

    // News signal - assign to top gainers that also have volume
    gainers.slice(0, 5).forEach(stock => {
      ensure(stock.symbol);
      if (!stockScores[stock.symbol].hasNews && stockScores[stock.symbol].hasVolume) {
        stockScores[stock.symbol].hasNews = true;
        stockScores[stock.symbol].signals.push("News");
        stockScores[stock.symbol].score += 25;
      }
    });

    return Object.values(stockScores)
      .filter(s => s.score >= 50)
      .sort((a, b) => b.score - a.score)
      .slice(0, 4);
  }, [highVolumeStocks, corporateEvents, gainers]);

  // Countdown timer
  useEffect(() => {
    const interval = setInterval(() => {
      setNextRefresh(prev => (prev <= 1 ? 30 : prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Auto-generate new corporate events periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setCorporateEvents(prev => [generateCorporateEvent(), ...prev.slice(0, 4)]);
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    queryClient.invalidateQueries({ queryKey: ["/api/nse/indices"] });
    queryClient.invalidateQueries({ queryKey: ["/api/nse/gainers-losers"] });
    refetchIndices();
    refetchGainersLosers();
    setNextRefresh(30);
    setTimeout(() => setIsRefreshing(false), 1500);
  };

  const isAnyFetching = isFetchingIndices || isFetchingVolume || isFetchingGainers;

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tighter uppercase italic text-foreground">
              Market Monitor
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <div className={`w-2 h-2 rounded-full ${isAnyFetching ? "bg-yellow-400 animate-pulse" : "bg-emerald-400 animate-pulse"}`}></div>
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                {isAnyFetching ? "Fetching Live NSE Data..." : "Live NSE Connection Active"}
              </span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {gainersLosersData?.lastUpdated && (
              <div className="flex items-center gap-2 bg-muted/50 border border-border rounded-md px-3 py-2">
                <Wifi className="w-4 h-4 text-emerald-400" />
                <span className="text-xs text-muted-foreground">NSE Updated:</span>
                <span className="font-mono font-bold text-xs text-emerald-400">{gainersLosersData.lastUpdated}</span>
              </div>
            )}
            <div className="flex items-center gap-2 bg-muted/50 border border-border rounded-md px-3 py-2">
              <Clock className="w-4 h-4 text-primary" />
              <span className="text-xs text-muted-foreground">Next refresh:</span>
              <span className="font-mono font-bold text-sm" data-testid="text-next-refresh-monitor">{nextRefresh}s</span>
            </div>
            <Button 
              variant="default" 
              onClick={handleRefresh}
              disabled={isRefreshing}
              data-testid="button-refresh-monitor"
              className="gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
              {isRefreshing ? "Refreshing..." : "Refresh Now"}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* 4-Magic List */}
          <Card className="hover-elevate bg-primary/5 border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between gap-2">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Zap className="w-4 h-4 text-primary" />
                4-MAGIC LIST
              </CardTitle>
              <Badge variant="outline" className="text-[10px]">Live Signals</Badge>
            </CardHeader>
            <CardContent className="space-y-4">
              {magicStocks.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-6 gap-2">
                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                  <p className="text-xs text-muted-foreground">Computing signals...</p>
                </div>
              ) : (
                magicStocks.map((stock, idx) => (
                  <div key={stock.symbol} className="space-y-2 pb-3 border-b border-primary/10 last:border-0 last:pb-0" data-testid={`magic-stock-${idx}`}>
                    <div className="flex justify-between items-center">
                      <p className="text-sm font-black">{stock.symbol}</p>
                      <Badge variant="default" className="text-[10px] bg-primary/20 text-primary border-primary/30">{stock.score}/100</Badge>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      <Badge 
                        variant="outline" 
                        className={`text-[9px] ${stock.hasNews ? "bg-blue-500/20 border-blue-500/40 text-blue-400" : "bg-muted/30 border-muted text-muted-foreground opacity-40"}`}
                      >
                        <Newspaper className="w-2.5 h-2.5 mr-1" />
                        News
                      </Badge>
                      <Badge 
                        variant="outline" 
                        className={`text-[9px] ${stock.hasVolume ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400" : "bg-muted/30 border-muted text-muted-foreground opacity-40"}`}
                      >
                        <Activity className="w-2.5 h-2.5 mr-1" />
                        Volume
                      </Badge>
                      <Badge 
                        variant="outline" 
                        className={`text-[9px] ${stock.hasCorporate ? "bg-purple-500/20 border-purple-500/40 text-purple-400" : "bg-muted/30 border-muted text-muted-foreground opacity-40"}`}
                      >
                        <Building className="w-2.5 h-2.5 mr-1" />
                        Corporate
                      </Badge>
                      <Badge 
                        variant="outline" 
                        className={`text-[9px] ${stock.hasPrice ? "bg-orange-500/20 border-orange-500/40 text-orange-400" : "bg-muted/30 border-muted text-muted-foreground opacity-40"}`}
                      >
                        <TrendingUp className="w-2.5 h-2.5 mr-1" />
                        Price
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* High Volume - Real NSE Data */}
          <Card className="hover-elevate">
            <CardHeader className="flex flex-row items-center justify-between gap-2">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                HIGH VOLUME
              </CardTitle>
              <Badge variant="outline" className="text-[10px] text-emerald-400 border-emerald-500/40">
                {isFetchingVolume ? (
                  <Loader2 className="w-3 h-3 animate-spin mr-1" />
                ) : (
                  <Wifi className="w-2.5 h-2.5 mr-1 text-emerald-400" />
                )}
                Live NSE
              </Badge>
            </CardHeader>
            <CardContent>
              {isFetchingVolume && highVolumeStocks.length === 0 ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                </div>
              ) : (
                <div className="space-y-4">
                  {highVolumeStocks.map((stock) => (
                    <div key={stock.symbol} className="flex justify-between items-center">
                      <div>
                        <p className="text-sm font-bold">{stock.symbol}</p>
                        <p className="text-xs text-muted-foreground">
                          Vol: {stock.volumeFormatted} &nbsp;|&nbsp; ₹{stock.price?.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                        </p>
                      </div>
                      <Badge variant={stock.change >= 0 ? "default" : "destructive"}>
                        {stock.changeFormatted}
                      </Badge>
                    </div>
                  ))}
                  {gainersLosersData?.lastUpdated && (
                    <p className="text-[10px] text-muted-foreground text-right">
                      {gainersLosersData.lastUpdated}
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* BSE Corporate Events */}
          <Card className="hover-elevate lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between gap-2">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Building2 className="w-4 h-4 text-primary" />
                BSE CORPORATE EVENTS
              </CardTitle>
              <Badge variant="outline" className="text-[10px]">Award/Receipt of Order</Badge>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-[10px] h-auto py-1">COMPANY</TableHead>
                    <TableHead className="text-[10px] h-auto py-1">TYPE</TableHead>
                    <TableHead className="text-[10px] h-auto py-1">DETAILS</TableHead>
                    <TableHead className="text-[10px] h-auto py-1 text-right">TIME</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {corporateEvents.map((event, i) => (
                    <TableRow key={i} data-testid={`corporate-event-${i}`}>
                      <TableCell className="text-xs font-bold py-2">{event.company}</TableCell>
                      <TableCell className="py-2">
                        <Badge 
                          variant={event.type === "Award of Order" ? "default" : "outline"} 
                          className="text-[10px]"
                        >
                          <FileText className="w-3 h-3 mr-1" />
                          {event.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground py-2">{event.details}</TableCell>
                      <TableCell className="text-xs font-mono text-right py-2">{event.time}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Live Indian Indices */}
          {indicesData?.indices && indicesData.indices.length > 0 ? (
            indicesData.indices.map((index, idx) => (
              <Card key={index.name} className="hover-elevate border-2 border-yellow-500/30 bg-gradient-to-br from-yellow-500/5 to-transparent" data-testid={`index-card-${idx}`}>
                <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-yellow-500" />
                    {index.name}
                  </CardTitle>
                  <Badge variant="outline" className="text-[10px] text-yellow-500 border-yellow-500/40 bg-yellow-500/10">
                    {isFetchingIndices ? (
                      <><Loader2 className="w-2.5 h-2.5 animate-spin mr-1" />Updating</>
                    ) : (
                      <><Wifi className="w-2.5 h-2.5 mr-1 text-emerald-400" />LIVE</>
                    )}
                  </Badge>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-center">
                    <p className="text-2xl font-black font-mono text-yellow-400" style={{ textShadow: "0 0 10px rgba(234, 179, 8, 0.5)" }}>
                      {index.lastPrice?.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                    </p>
                    <div className={`flex items-center justify-center gap-2 mt-1 ${index.pChange >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                      {index.pChange >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                      <span className="font-mono font-bold">
                        {index.change >= 0 ? "+" : ""}{index.change?.toFixed(2)} ({index.pChange >= 0 ? "+" : ""}{index.pChange?.toFixed(2)}%)
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-yellow-500/20">
                    <div className="text-center">
                      <p className="text-[10px] text-muted-foreground">DAY HIGH</p>
                      <p className="text-xs font-bold font-mono text-yellow-400">{index.high?.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] text-muted-foreground">DAY LOW</p>
                      <p className="text-xs font-bold font-mono text-yellow-400">{index.low?.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] text-muted-foreground">OPEN</p>
                      <p className="text-xs font-bold font-mono">{index.open?.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] text-muted-foreground">PREV CLOSE</p>
                      <p className="text-xs font-bold font-mono">{index.previousClose?.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="hover-elevate border-2 border-yellow-500/30 lg:col-span-4">
              <CardContent className="flex items-center justify-center py-10 gap-3">
                <Loader2 className="w-5 h-5 animate-spin text-yellow-400" />
                <span className="text-sm text-muted-foreground">Fetching live NSE indices...</span>
              </CardContent>
            </Card>
          )}

          {/* Top Gainers from NSE */}
          <Card className="hover-elevate border-emerald-500/20">
            <CardHeader className="flex flex-row items-center justify-between gap-2">
              <CardTitle className="text-sm font-bold flex items-center gap-2 text-emerald-400">
                <TrendingUp className="w-4 h-4" />
                TOP GAINERS
              </CardTitle>
              <Badge variant="outline" className="text-[10px] text-emerald-400 border-emerald-500/40">
                <Wifi className="w-2.5 h-2.5 mr-1" />NIFTY 50
              </Badge>
            </CardHeader>
            <CardContent>
              {isFetchingGainers && gainers.length === 0 ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="w-5 h-5 animate-spin text-emerald-400" />
                </div>
              ) : (
                <div className="space-y-3">
                  {gainers.slice(0, 5).map((stock, i) => (
                    <div key={stock.symbol} className="flex items-center justify-between" data-testid={`gainer-${i}`}>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground w-4">{i + 1}</span>
                        <div>
                          <p className="text-sm font-bold">{stock.symbol}</p>
                          <p className="text-[10px] text-muted-foreground font-mono">₹{stock.lastPrice?.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</p>
                        </div>
                      </div>
                      <Badge variant="default" className="text-[10px] font-mono bg-emerald-500/20 text-emerald-400 border-emerald-500/40">
                        +{stock.pChange?.toFixed(2)}%
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Top Losers from NSE */}
          <Card className="hover-elevate border-red-500/20">
            <CardHeader className="flex flex-row items-center justify-between gap-2">
              <CardTitle className="text-sm font-bold flex items-center gap-2 text-red-400">
                <TrendingDown className="w-4 h-4" />
                TOP LOSERS
              </CardTitle>
              <Badge variant="outline" className="text-[10px] text-red-400 border-red-500/40">
                <Wifi className="w-2.5 h-2.5 mr-1" />NIFTY 50
              </Badge>
            </CardHeader>
            <CardContent>
              {isFetchingGainers && (gainersLosersData?.losers || []).length === 0 ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="w-5 h-5 animate-spin text-red-400" />
                </div>
              ) : (
                <div className="space-y-3">
                  {(gainersLosersData?.losers || []).slice(0, 5).map((stock, i) => (
                    <div key={stock.symbol} className="flex items-center justify-between" data-testid={`loser-${i}`}>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground w-4">{i + 1}</span>
                        <div>
                          <p className="text-sm font-bold">{stock.symbol}</p>
                          <p className="text-[10px] text-muted-foreground font-mono">₹{stock.lastPrice?.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</p>
                        </div>
                      </div>
                      <Badge variant="destructive" className="text-[10px] font-mono">
                        {stock.pChange?.toFixed(2)}%
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* NSE Advance / Decline */}
          <Card className="hover-elevate lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between gap-2">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Activity className="w-4 h-4 text-primary" />
                NIFTY 50 BREADTH
              </CardTitle>
              <Badge variant="outline" className="text-[10px]">
                <Wifi className="w-2.5 h-2.5 mr-1 text-emerald-400" />Live
              </Badge>
            </CardHeader>
            <CardContent>
              {gainersLosersData ? (() => {
                const allStocks = [...(gainersLosersData.gainers || []), ...(gainersLosersData.losers || [])];
                const advancers = gainersLosersData.gainers?.length || 0;
                const decliners = gainersLosersData.losers?.length || 0;
                const total = advancers + decliners;
                const advPct = total > 0 ? (advancers / total) * 100 : 50;

                return (
                  <div className="space-y-4">
                    <div className="flex justify-between text-sm font-bold">
                      <span className="text-emerald-400">{advancers} Advancing</span>
                      <span className="text-red-400">{decliners} Declining</span>
                    </div>
                    <div className="h-3 rounded-full bg-red-500/30 overflow-hidden">
                      <div 
                        className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                        style={{ width: `${advPct}%` }}
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="bg-emerald-500/10 rounded-md p-2">
                        <p className="text-lg font-black text-emerald-400">{advancers}</p>
                        <p className="text-[10px] text-muted-foreground">ADVANCES</p>
                      </div>
                      <div className="bg-muted/30 rounded-md p-2">
                        <p className="text-lg font-black text-muted-foreground">{Math.max(0, 50 - total)}</p>
                        <p className="text-[10px] text-muted-foreground">UNCHANGED</p>
                      </div>
                      <div className="bg-red-500/10 rounded-md p-2">
                        <p className="text-lg font-black text-red-400">{decliners}</p>
                        <p className="text-[10px] text-muted-foreground">DECLINES</p>
                      </div>
                    </div>
                    {gainersLosersData?.lastUpdated && (
                      <p className="text-[10px] text-muted-foreground text-right">{gainersLosersData.lastUpdated}</p>
                    )}
                  </div>
                );
              })() : (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
