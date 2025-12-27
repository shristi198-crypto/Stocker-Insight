import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TrendingUp, TrendingDown, RefreshCw, Clock, BarChart3, Calendar } from "lucide-react";

interface Stock {
  symbol: string;
  price: string;
  change: number;
  volume: string;
  signal: string;
}

export default function StockLists() {
  const [bullishStocks, setBullishStocks] = useState<Stock[]>([]);
  const [bearishStocks, setBearishStocks] = useState<Stock[]>([]);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const bullishSymbols = ["TATASTEEL", "ADANIENT", "HINDALCO", "COALINDIA", "ONGC", "NTPC", "POWERGRID", "BPCL", "IOC", "GAIL"];
  const bearishSymbols = ["TECHM", "WIPRO", "HCLTECH", "INFY", "TCS", "LTIM", "MPHASIS", "COFORGE", "PERSISTENT", "TATAELXSI"];
  const bullishSignals = ["Breakout Pattern", "Golden Cross", "RSI Oversold Bounce", "MACD Bullish", "Volume Surge", "Support Bounce", "Cup & Handle", "Bull Flag", "Ascending Triangle", "Double Bottom"];
  const bearishSignals = ["Breakdown Pattern", "Death Cross", "RSI Overbought", "MACD Bearish", "Volume Drop", "Resistance Rejection", "Head & Shoulders", "Bear Flag", "Descending Triangle", "Double Top"];

  const generateData = () => {
    setBullishStocks(bullishSymbols.map((symbol, i) => ({
      symbol,
      price: (Math.random() * 2000 + 200).toFixed(2),
      change: parseFloat((Math.random() * 8 + 1).toFixed(2)),
      volume: `${(Math.random() * 20 + 5).toFixed(1)}M`,
      signal: bullishSignals[i % bullishSignals.length]
    })));

    setBearishStocks(bearishSymbols.map((symbol, i) => ({
      symbol,
      price: (Math.random() * 3000 + 500).toFixed(2),
      change: parseFloat((-Math.random() * 8 - 0.5).toFixed(2)),
      volume: `${(Math.random() * 15 + 3).toFixed(1)}M`,
      signal: bearishSignals[i % bearishSignals.length]
    })));

    setLastUpdated(new Date());
  };

  useEffect(() => {
    generateData();
    const interval = setInterval(generateData, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    generateData();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight flex items-center gap-3" data-testid="text-stocks-title">
              <BarChart3 className="w-8 h-8 text-primary" />
              STOCK SIGNALS
            </h1>
            <p className="text-muted-foreground mt-1">
              AI-detected bullish and bearish stock patterns
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-primary/10 border border-primary/30 rounded-md px-3 py-2">
              <Calendar className="w-4 h-4 text-primary" />
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  generateData();
                }}
                className="border-0 bg-transparent p-0 h-auto text-sm font-mono focus-visible:ring-0"
                data-testid="input-date"
              />
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="w-4 h-4" />
              Updated: {lastUpdated.toLocaleTimeString()}
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRefresh}
              disabled={isRefreshing}
              data-testid="button-refresh-stocks"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border-2 border-emerald-500/30">
            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
              <CardTitle className="text-lg font-bold flex items-center gap-2 text-emerald-400">
                <TrendingUp className="w-5 h-5" />
                BULLISH STOCKS
              </CardTitle>
              <Badge variant="default" className="text-xs">{bullishStocks.length} Stocks</Badge>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">SYMBOL</TableHead>
                    <TableHead className="text-xs">PRICE</TableHead>
                    <TableHead className="text-xs">SIGNAL</TableHead>
                    <TableHead className="text-xs text-right">CHANGE</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bullishStocks.map((stock, idx) => (
                    <TableRow key={stock.symbol} data-testid={`bullish-stock-${idx}`}>
                      <TableCell className="font-bold">{stock.symbol}</TableCell>
                      <TableCell className="font-mono">₹{stock.price}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px] bg-emerald-500/10 border-emerald-500/30 text-emerald-400">
                          {stock.signal}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="font-mono font-bold text-emerald-400">+{stock.change}%</span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card className="border-2 border-red-500/30">
            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
              <CardTitle className="text-lg font-bold flex items-center gap-2 text-red-400">
                <TrendingDown className="w-5 h-5" />
                BEARISH STOCKS
              </CardTitle>
              <Badge variant="destructive" className="text-xs">{bearishStocks.length} Stocks</Badge>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">SYMBOL</TableHead>
                    <TableHead className="text-xs">PRICE</TableHead>
                    <TableHead className="text-xs">SIGNAL</TableHead>
                    <TableHead className="text-xs text-right">CHANGE</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bearishStocks.map((stock, idx) => (
                    <TableRow key={stock.symbol} data-testid={`bearish-stock-${idx}`}>
                      <TableCell className="font-bold">{stock.symbol}</TableCell>
                      <TableCell className="font-mono">₹{stock.price}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px] bg-red-500/10 border-red-500/30 text-red-400">
                          {stock.signal}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="font-mono font-bold text-red-400">{stock.change}%</span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
