import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, RefreshCw, Clock, BarChart3, Calendar, Wifi, WifiOff } from "lucide-react";
import { queryClient } from "@/lib/queryClient";

interface NseStock {
  symbol: string;
  companyName: string;
  lastPrice: number;
  change: number;
  pChange: number;
  open: number;
  dayHigh: number;
  dayLow: number;
  previousClose: number;
  totalTradedVolume: number;
  totalTradedValue: number;
  yearHigh: number;
  yearLow: number;
}

interface NseData {
  gainers: NseStock[];
  losers: NseStock[];
  lastUpdated: string;
}

export default function StockLists() {
  const [currentTime, setCurrentTime] = useState(new Date());

  const { data, isLoading, isError, refetch, isFetching } = useQuery<NseData>({
    queryKey: ['/api/nse/gainers-losers'],
    refetchInterval: 60000,
    staleTime: 30000,
  });

  useEffect(() => {
    const timeInterval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timeInterval);
  }, []);

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['/api/nse/gainers-losers'] });
    refetch();
  };

  const formatVolume = (vol: number) => {
    if (vol >= 10000000) return `${(vol / 10000000).toFixed(2)} Cr`;
    if (vol >= 100000) return `${(vol / 100000).toFixed(2)} L`;
    if (vol >= 1000) return `${(vol / 1000).toFixed(1)}K`;
    return vol?.toString() || '-';
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight flex items-center gap-3" data-testid="text-stocks-title">
              <BarChart3 className="w-8 h-8 text-primary" />
              NSE TOP GAINERS & LOSERS
            </h1>
            <p className="text-muted-foreground mt-1 flex items-center gap-2">
              Live data from NSE India - NIFTY 50 Stocks
              {isError ? (
                <Badge variant="destructive" className="text-[10px]">
                  <WifiOff className="w-3 h-3 mr-1" /> Offline
                </Badge>
              ) : (
                <Badge variant="outline" className="text-[10px] text-emerald-400 border-emerald-500/30">
                  <Wifi className="w-3 h-3 mr-1" /> Live
                </Badge>
              )}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-primary/10 border border-primary/30 rounded-md px-3 py-2">
              <Calendar className="w-4 h-4 text-primary" />
              <span className="text-sm font-mono">
                {currentTime.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
              </span>
            </div>
            <div className="flex items-center gap-2 bg-muted/50 border border-border rounded-md px-3 py-2">
              <Clock className="w-4 h-4 text-primary" />
              <span className="text-sm font-mono font-bold" data-testid="text-current-time">
                {currentTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
              </span>
              <Badge variant="outline" className="text-[10px] ml-1">IST</Badge>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRefresh}
              disabled={isFetching}
              data-testid="button-refresh-stocks"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[1, 2].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader className="pb-2">
                  <div className="h-6 bg-muted rounded w-40"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[1,2,3,4,5].map((j) => (
                      <div key={j} className="h-10 bg-muted rounded"></div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : isError ? (
          <Card className="border-destructive/50">
            <CardContent className="py-10 text-center">
              <WifiOff className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-bold mb-2">Unable to fetch NSE data</h3>
              <p className="text-muted-foreground mb-4">
                Please check your connection or try again later.
              </p>
              <Button onClick={handleRefresh}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Retry
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-2 border-emerald-500/30">
              <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
                <CardTitle className="text-lg font-bold flex items-center gap-2 text-emerald-400">
                  <TrendingUp className="w-5 h-5" />
                  TOP GAINERS
                </CardTitle>
                <Badge variant="default" className="text-xs">{data?.gainers?.length || 0} Stocks</Badge>
              </CardHeader>
              <CardContent>
                <div className="max-h-[500px] overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs sticky top-0 bg-card">#</TableHead>
                        <TableHead className="text-xs sticky top-0 bg-card">SYMBOL</TableHead>
                        <TableHead className="text-xs sticky top-0 bg-card">PRICE</TableHead>
                        <TableHead className="text-xs sticky top-0 bg-card">VOLUME</TableHead>
                        <TableHead className="text-xs text-right sticky top-0 bg-card">CHANGE</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data?.gainers?.map((stock, idx) => (
                        <TableRow key={stock.symbol} data-testid={`gainer-stock-${idx}`}>
                          <TableCell className="font-mono text-muted-foreground">{idx + 1}</TableCell>
                          <TableCell>
                            <div>
                              <span className="font-bold">{stock.symbol}</span>
                            </div>
                          </TableCell>
                          <TableCell className="font-mono">₹{stock.lastPrice?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                          <TableCell className="text-muted-foreground text-xs">
                            {formatVolume(stock.totalTradedVolume)}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex flex-col items-end">
                              <span className="font-mono font-bold text-emerald-400">
                                +{stock.pChange?.toFixed(2)}%
                              </span>
                              <span className="text-[10px] text-muted-foreground">
                                +₹{stock.change?.toFixed(2)}
                              </span>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-red-500/30">
              <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
                <CardTitle className="text-lg font-bold flex items-center gap-2 text-red-400">
                  <TrendingDown className="w-5 h-5" />
                  TOP LOSERS
                </CardTitle>
                <Badge variant="destructive" className="text-xs">{data?.losers?.length || 0} Stocks</Badge>
              </CardHeader>
              <CardContent>
                <div className="max-h-[500px] overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs sticky top-0 bg-card">#</TableHead>
                        <TableHead className="text-xs sticky top-0 bg-card">SYMBOL</TableHead>
                        <TableHead className="text-xs sticky top-0 bg-card">PRICE</TableHead>
                        <TableHead className="text-xs sticky top-0 bg-card">VOLUME</TableHead>
                        <TableHead className="text-xs text-right sticky top-0 bg-card">CHANGE</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data?.losers?.map((stock, idx) => (
                        <TableRow key={stock.symbol} data-testid={`loser-stock-${idx}`}>
                          <TableCell className="font-mono text-muted-foreground">{idx + 1}</TableCell>
                          <TableCell>
                            <div>
                              <span className="font-bold">{stock.symbol}</span>
                            </div>
                          </TableCell>
                          <TableCell className="font-mono">₹{stock.lastPrice?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                          <TableCell className="text-muted-foreground text-xs">
                            {formatVolume(stock.totalTradedVolume)}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex flex-col items-end">
                              <span className="font-mono font-bold text-red-400">
                                {stock.pChange?.toFixed(2)}%
                              </span>
                              <span className="text-[10px] text-muted-foreground">
                                ₹{stock.change?.toFixed(2)}
                              </span>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {data?.lastUpdated && (
          <p className="text-xs text-center text-muted-foreground">
            Data source: NSE India | Last updated: {new Date(data.lastUpdated).toLocaleString('en-IN')}
          </p>
        )}
      </div>
    </Layout>
  );
}
