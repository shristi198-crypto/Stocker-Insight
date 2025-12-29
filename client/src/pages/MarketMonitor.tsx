import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TrendingUp, Zap, Building2, FileText, BarChart3, Newspaper, Activity, Building, TrendingDown, RefreshCw, Clock } from "lucide-react";
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

interface BidAskLevel {
  price: number;
  bidQty: number;
  askQty: number;
}

interface IndexBidData {
  name: string;
  basePrice: number;
  levels: BidAskLevel[];
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

export default function MarketMonitor() {
  const [magicStocks, setMagicStocks] = useState<MagicStock[]>([
    { symbol: "TATASTEEL", score: 100, signals: ["News", "Volume", "Corporate", "Price"], hasNews: true, hasVolume: true, hasCorporate: true, hasPrice: true },
    { symbol: "L&T", score: 75, signals: ["Corporate", "Volume", "Price"], hasNews: false, hasVolume: true, hasCorporate: true, hasPrice: true },
    { symbol: "RELIANCE", score: 75, signals: ["News", "Volume", "Price"], hasNews: true, hasVolume: true, hasCorporate: false, hasPrice: true },
    { symbol: "HDFCBANK", score: 50, signals: ["Volume", "Price"], hasNews: false, hasVolume: true, hasCorporate: false, hasPrice: true },
  ]);
  
  const [nextRefresh, setNextRefresh] = useState(30);
  const [lastRefreshTime, setLastRefreshTime] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch live Indian indices
  const { data: indicesData, refetch: refetchIndices, isFetching: isFetchingIndices } = useQuery<{ indices: IndexData[], lastUpdated: string }>({
    queryKey: ['/api/nse/indices'],
    refetchInterval: 1800000,
    staleTime: 1800000,
  });

  const [highVolumeStocks, setHighVolumeStocks] = useState([
    { symbol: "RELIANCE", volume: "12.4M", change: "+1.2%" },
    { symbol: "HDFCBANK", volume: "8.1M", change: "-0.5%" },
    { symbol: "TCS", volume: "5.2M", change: "+0.8%" },
    { symbol: "ICICIBANK", volume: "10.5M", change: "+2.1%" },
    { symbol: "INFY", volume: "7.8M", change: "-1.1%" },
  ]);

  const [corporateEvents, setCorporateEvents] = useState([
    { company: "TATASTEEL", type: "Award of Order", details: "Received order worth Rs. 450 Cr", time: "10:30 AM" },
    { company: "L&T", type: "Receipt of Order", details: "Infrastructure project Rs. 1,200 Cr", time: "10:15 AM" },
    { company: "BHEL", type: "Award of Order", details: "Power equipment order Rs. 890 Cr", time: "09:45 AM" },
    { company: "RVNL", type: "Receipt of Order", details: "Railway project Rs. 567 Cr", time: "09:30 AM" },
    { company: "HCC", type: "Award of Order", details: "Construction contract Rs. 234 Cr", time: "09:15 AM" },
  ]);

  const [allIndexBidData, setAllIndexBidData] = useState<IndexBidData[]>([
    {
      name: "SENSEX",
      basePrice: 72500,
      levels: [
        { price: 72520, bidQty: 5200, askQty: 3800 },
        { price: 72510, bidQty: 7100, askQty: 2500 },
        { price: 72500, bidQty: 8500, askQty: 1800 },
        { price: 72490, bidQty: 6200, askQty: 5100 },
      ]
    },
    {
      name: "NIFTY 50",
      basePrice: 22000,
      levels: [
        { price: 22015, bidQty: 4500, askQty: 3200 },
        { price: 22010, bidQty: 6800, askQty: 2100 },
        { price: 22005, bidQty: 8200, askQty: 1500 },
        { price: 22000, bidQty: 5600, askQty: 4800 },
      ]
    },
    {
      name: "NIFTY BANK",
      basePrice: 48000,
      levels: [
        { price: 48030, bidQty: 3800, askQty: 4200 },
        { price: 48020, bidQty: 5500, askQty: 3100 },
        { price: 48010, bidQty: 7200, askQty: 2400 },
        { price: 48000, bidQty: 4900, askQty: 5800 },
      ]
    },
    {
      name: "NIFTY IT",
      basePrice: 35000,
      levels: [
        { price: 35025, bidQty: 2900, askQty: 3500 },
        { price: 35020, bidQty: 4200, askQty: 2800 },
        { price: 35015, bidQty: 5800, askQty: 1900 },
        { price: 35010, bidQty: 3600, askQty: 4400 },
      ]
    },
  ]);


  const companies = ["TATASTEEL", "L&T", "BHEL", "RVNL", "HCC", "IRCON", "NCC", "KEC", "KALPATPOWR", "PNC"];
  const orderTypes = ["Award of Order", "Receipt of Order"];
  const projects = [
    "Infrastructure project", "Power equipment order", "Railway project", 
    "Construction contract", "Transmission line order", "Road project",
    "Metro rail order", "Bridge construction", "Industrial order"
  ];

  const [newsStocks] = useState([
    { symbol: "TATASTEEL", sentiment: "bullish" },
    { symbol: "RELIANCE", sentiment: "bullish" },
    { symbol: "ADANIENT", sentiment: "bullish" },
    { symbol: "ICICIBANK", sentiment: "neutral" },
    { symbol: "BHARTIARTL", sentiment: "bullish" },
  ]);

  const [priceMovers] = useState([
    { symbol: "TATASTEEL", change: 3.2 },
    { symbol: "RELIANCE", change: 1.8 },
    { symbol: "L&T", change: 2.1 },
    { symbol: "HDFCBANK", change: 1.5 },
    { symbol: "ADANIENT", change: 2.8 },
  ]);

  // 30-minute auto-refresh timer
  useEffect(() => {
    const countdownInterval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - lastRefreshTime.getTime()) / 60000);
      const remaining = Math.max(0, 30 - elapsed);
      setNextRefresh(remaining);
      
      if (remaining === 0) {
        handleRefresh();
      }
    }, 60000);
    return () => clearInterval(countdownInterval);
  }, [lastRefreshTime]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    
    // Refresh all data including live indices
    queryClient.invalidateQueries({ queryKey: ['/api/nse/indices'] });
    refetchIndices();
    setMagicStocks(computeMagicList());
    
    // Simulate refreshing high volume stocks with new data
    setHighVolumeStocks(prev => prev.map(stock => ({
      ...stock,
      volume: `${(Math.random() * 15 + 5).toFixed(1)}M`,
      change: `${Math.random() > 0.5 ? '+' : '-'}${(Math.random() * 3).toFixed(1)}%`
    })));
    
    // Refresh corporate events
    setCorporateEvents(prev => {
      const newEvents = companies.slice(0, 5).map((company, i) => ({
        company,
        type: orderTypes[Math.floor(Math.random() * orderTypes.length)],
        details: `${projects[Math.floor(Math.random() * projects.length)]} Rs. ${Math.floor(Math.random() * 2000 + 100)} Cr`,
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
      }));
      return newEvents;
    });
    
    setLastRefreshTime(new Date());
    setNextRefresh(30);
    
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const computeMagicList = () => {
    const stockScores: { [key: string]: MagicStock } = {};

    highVolumeStocks.forEach(stock => {
      if (!stockScores[stock.symbol]) {
        stockScores[stock.symbol] = { symbol: stock.symbol, score: 0, signals: [], hasNews: false, hasVolume: false, hasCorporate: false, hasPrice: false };
      }
      stockScores[stock.symbol].hasVolume = true;
      stockScores[stock.symbol].signals.push("Volume");
      stockScores[stock.symbol].score += 25;
    });

    corporateEvents.forEach(event => {
      if (!stockScores[event.company]) {
        stockScores[event.company] = { symbol: event.company, score: 0, signals: [], hasNews: false, hasVolume: false, hasCorporate: false, hasPrice: false };
      }
      if (!stockScores[event.company].hasCorporate) {
        stockScores[event.company].hasCorporate = true;
        stockScores[event.company].signals.push("Corporate");
        stockScores[event.company].score += 25;
      }
    });

    newsStocks.forEach(news => {
      if (!stockScores[news.symbol]) {
        stockScores[news.symbol] = { symbol: news.symbol, score: 0, signals: [], hasNews: false, hasVolume: false, hasCorporate: false, hasPrice: false };
      }
      if (!stockScores[news.symbol].hasNews && news.sentiment === "bullish") {
        stockScores[news.symbol].hasNews = true;
        stockScores[news.symbol].signals.push("News");
        stockScores[news.symbol].score += 25;
      }
    });

    priceMovers.forEach(mover => {
      if (!stockScores[mover.symbol]) {
        stockScores[mover.symbol] = { symbol: mover.symbol, score: 0, signals: [], hasNews: false, hasVolume: false, hasCorporate: false, hasPrice: false };
      }
      if (!stockScores[mover.symbol].hasPrice && mover.change > 1) {
        stockScores[mover.symbol].hasPrice = true;
        stockScores[mover.symbol].signals.push("Price");
        stockScores[mover.symbol].score += 25;
      }
    });

    const sorted = Object.values(stockScores)
      .filter(s => s.score >= 50)
      .sort((a, b) => b.score - a.score)
      .slice(0, 4);

    return sorted;
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setMagicStocks(computeMagicList());

      // Simulate price changes in high volume stocks
      setHighVolumeStocks(prev => prev.map(stock => {
        const changeVal = (Math.random() * 0.4 - 0.2);
        const currentChange = parseFloat(stock.change);
        const newChangeNumeric = currentChange + changeVal;
        const newChangeStr = newChangeNumeric.toFixed(2);
        return {
          ...stock,
          change: (newChangeNumeric >= 0 ? "+" : "") + newChangeStr + "%"
        };
      }));

      // Simulate new corporate events
      setCorporateEvents(prev => {
        const newEvent = {
          company: companies[Math.floor(Math.random() * companies.length)],
          type: orderTypes[Math.floor(Math.random() * orderTypes.length)],
          details: `${projects[Math.floor(Math.random() * projects.length)]} Rs. ${Math.floor(Math.random() * 2000 + 100)} Cr`,
          time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
        };
        return [newEvent, ...prev.slice(0, 4)];
      });

      // Update bid/ask data for all indices
      setAllIndexBidData(prev => prev.map(index => ({
        ...index,
        levels: index.levels.map(level => ({
          price: level.price + (Math.random() - 0.5) * 2,
          bidQty: Math.max(1000, level.bidQty + Math.floor((Math.random() - 0.5) * 1000)),
          askQty: Math.max(1000, level.askQty + Math.floor((Math.random() - 0.5) * 1000)),
        }))
      })));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tighter uppercase italic text-foreground">
              Market Monitor
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Live Connection Active</span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-muted/50 border border-border rounded-md px-3 py-2">
              <Clock className="w-4 h-4 text-primary" />
              <span className="text-xs text-muted-foreground">Next refresh:</span>
              <span className="font-mono font-bold text-sm" data-testid="text-next-refresh-monitor">{nextRefresh} min</span>
            </div>
            <Button 
              variant="default" 
              onClick={handleRefresh}
              disabled={isRefreshing}
              data-testid="button-refresh-monitor"
              className="gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Refreshing...' : 'Refresh Now'}
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
            <Badge variant="outline" className="text-[10px]">Combined Signals</Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            {magicStocks.map((stock, idx) => (
              <div key={stock.symbol} className="space-y-2 pb-3 border-b border-primary/10 last:border-0 last:pb-0" data-testid={`magic-stock-${idx}`}>
                <div className="flex justify-between items-center">
                  <p className="text-sm font-black">{stock.symbol}</p>
                  <Badge variant="default" className="text-[10px] bg-primary/20 text-primary border-primary/30">{stock.score}/100</Badge>
                </div>
                <div className="flex flex-wrap gap-1">
                  <Badge 
                    variant="outline" 
                    className={`text-[9px] ${stock.hasNews ? 'bg-blue-500/20 border-blue-500/40 text-blue-400' : 'bg-muted/30 border-muted text-muted-foreground opacity-40'}`}
                  >
                    <Newspaper className="w-2.5 h-2.5 mr-1" />
                    News
                  </Badge>
                  <Badge 
                    variant="outline" 
                    className={`text-[9px] ${stock.hasVolume ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400' : 'bg-muted/30 border-muted text-muted-foreground opacity-40'}`}
                  >
                    <Activity className="w-2.5 h-2.5 mr-1" />
                    Volume
                  </Badge>
                  <Badge 
                    variant="outline" 
                    className={`text-[9px] ${stock.hasCorporate ? 'bg-purple-500/20 border-purple-500/40 text-purple-400' : 'bg-muted/30 border-muted text-muted-foreground opacity-40'}`}
                  >
                    <Building className="w-2.5 h-2.5 mr-1" />
                    Corporate
                  </Badge>
                  <Badge 
                    variant="outline" 
                    className={`text-[9px] ${stock.hasPrice ? 'bg-orange-500/20 border-orange-500/40 text-orange-400' : 'bg-muted/30 border-muted text-muted-foreground opacity-40'}`}
                  >
                    <TrendingUp className="w-2.5 h-2.5 mr-1" />
                    Price
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* High Volume */}
        <Card className="hover-elevate">
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              HIGH VOLUME
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {highVolumeStocks.map((stock) => (
                <div key={stock.symbol} className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-bold">{stock.symbol}</p>
                    <p className="text-xs text-muted-foreground">Vol: {stock.volume}</p>
                  </div>
                  <Badge variant={stock.change.startsWith("+") ? "default" : "destructive"}>
                    {stock.change}
                  </Badge>
                </div>
              ))}
            </div>
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
                  {isFetchingIndices ? 'Updating...' : 'LIVE'}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-center">
                  <p className="text-2xl font-black font-mono text-yellow-400" style={{ textShadow: '0 0 10px rgba(234, 179, 8, 0.5)' }}>
                    {index.lastPrice?.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                  </p>
                  <div className={`flex items-center justify-center gap-2 mt-1 ${index.pChange >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {index.pChange >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                    <span className="font-mono font-bold">
                      {index.change >= 0 ? '+' : ''}{index.change?.toFixed(2)} ({index.pChange >= 0 ? '+' : ''}{index.pChange?.toFixed(2)}%)
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-yellow-500/20">
                  <div className="text-center">
                    <p className="text-[10px] text-muted-foreground">DAY HIGH</p>
                    <p className="text-xs font-bold font-mono text-yellow-400">{index.high?.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] text-muted-foreground">DAY LOW</p>
                    <p className="text-xs font-bold font-mono text-yellow-400">{index.low?.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] text-muted-foreground">OPEN</p>
                    <p className="text-xs font-bold font-mono">{index.open?.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] text-muted-foreground">PREV CLOSE</p>
                    <p className="text-xs font-bold font-mono">{index.previousClose?.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          // Fallback to simulated data
          allIndexBidData.map((indexData, idx) => {
            const maxQty = Math.max(...indexData.levels.map(l => Math.max(l.bidQty, l.askQty)));
            const totalBid = indexData.levels.reduce((sum, l) => sum + l.bidQty, 0);
            const totalAsk = indexData.levels.reduce((sum, l) => sum + l.askQty, 0);
            
            return (
              <Card key={indexData.name} className="hover-elevate border-2 border-yellow-500/30" data-testid={`bid-chart-${idx}`}>
                <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-yellow-500" />
                    {indexData.name}
                  </CardTitle>
                  <Badge variant="outline" className="text-[10px] text-yellow-500 border-yellow-500/40">Simulated</Badge>
                </CardHeader>
                <CardContent className="space-y-1">
                  <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                    <span>BID</span>
                    <span>PRICE</span>
                    <span>ASK</span>
                  </div>
                  {indexData.levels.map((level, i) => {
                    const bidWidth = (level.bidQty / maxQty) * 100;
                    const askWidth = (level.askQty / maxQty) * 100;
                    
                    return (
                      <div key={i} className="flex items-center gap-1">
                        <div className="w-1/3 flex justify-end">
                          <div 
                            className="h-4 bg-emerald-500/40 rounded-l flex items-center justify-end pr-1"
                            style={{ width: `${bidWidth}%` }}
                          >
                            <span className="text-[9px] font-mono text-emerald-400">{(level.bidQty / 1000).toFixed(1)}K</span>
                          </div>
                        </div>
                        <div className="w-1/3 text-center">
                          <span className="text-[10px] font-mono font-bold text-yellow-400">{level.price.toFixed(0)}</span>
                        </div>
                        <div className="w-1/3 flex justify-start">
                          <div 
                            className="h-4 bg-red-500/40 rounded-r flex items-center pl-1"
                            style={{ width: `${askWidth}%` }}
                          >
                            <span className="text-[9px] font-mono text-red-400">{(level.askQty / 1000).toFixed(1)}K</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div className="flex justify-between mt-2 pt-2 border-t border-yellow-500/20">
                    <div className="text-center">
                      <p className="text-[9px] text-muted-foreground">Total Bid</p>
                      <p className="text-xs font-bold text-emerald-400 font-mono">{(totalBid / 1000).toFixed(1)}K</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[9px] text-muted-foreground">Total Ask</p>
                      <p className="text-xs font-bold text-red-400 font-mono">{(totalAsk / 1000).toFixed(1)}K</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
        </div>
      </div>
    </Layout>
  );
}
