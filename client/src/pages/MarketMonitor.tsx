import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Newspaper, TrendingUp, BookOpen, Users, Zap } from "lucide-react";

export default function MarketMonitor() {
  const magicStocks = [
    { symbol: "TATASTEEL", score: "98/100", reason: "Breakout Volume + News" },
    { symbol: "ADANIENT", score: "95/100", reason: "Institutional Accumulation" },
    { symbol: "HDFCBANK", score: "92/100", reason: "Active Trader Interest" },
    { symbol: "ZOMATO", score: "89/100", reason: "Earnings Surprise Alert" },
  ];

  const highVolumeStocks = [
    { symbol: "RELIANCE", volume: "12.4M", change: "+1.2%" },
    { symbol: "HDFCBANK", volume: "8.1M", change: "-0.5%" },
    { symbol: "TCS", volume: "5.2M", change: "+0.8%" },
    { symbol: "ICICIBANK", volume: "10.5M", change: "+2.1%" },
    { symbol: "INFY", volume: "7.8M", change: "-1.1%" },
  ];

  const orderBook = [
    { price: "2450.50", qty: "1,200", type: "Bid" },
    { price: "2450.45", qty: "850", type: "Bid" },
    { price: "2451.00", qty: "500", type: "Ask" },
    { price: "2451.10", qty: "1,100", type: "Ask" },
  ];

  const activeTraders = [
    { id: "TRD_882", activity: "High", tradeCount: 142 },
    { id: "TRD_119", activity: "Medium", tradeCount: 89 },
    { id: "TRD_454", activity: "High", tradeCount: 215 },
  ];

  const marketNews = [
    { title: "Sensex hits all-time high amid global rally", time: "10 mins ago" },
    { title: "RBI maintains repo rate at 6.5%", time: "1 hour ago" },
    { title: "IT stocks lead market gains today", time: "2 hours ago" },
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-black tracking-tighter uppercase italic text-foreground mb-8">
        Market Monitor
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {/* 4-Magic List */}
        <Card className="hover-elevate bg-primary/5 border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Zap className="w-4 h-4 text-primary" />
              4-MAGIC LIST
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {magicStocks.map((stock) => (
              <div key={stock.symbol} className="space-y-1">
                <div className="flex justify-between items-center">
                  <p className="text-sm font-black">{stock.symbol}</p>
                  <Badge variant="outline" className="text-[10px] bg-primary/10 border-primary/20">{stock.score}</Badge>
                </div>
                <p className="text-[10px] text-muted-foreground uppercase">{stock.reason}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Market News */}
        <Card className="hover-elevate">
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Newspaper className="w-4 h-4 text-primary" />
              LATEST NEWS
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {marketNews.map((news, i) => (
              <div key={i} className="space-y-1">
                <p className="text-sm font-medium leading-tight">{news.title}</p>
                <p className="text-xs text-muted-foreground">{news.time}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* High Volume */}
        <Card className="hover-elevate">
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
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

        {/* Order Book */}
        <Card className="hover-elevate">
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-primary" />
              LIVE ORDER BOOK
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-[10px] h-auto py-1">PRICE</TableHead>
                  <TableHead className="text-[10px] h-auto py-1 text-right">QTY</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orderBook.map((order, i) => (
                  <TableRow key={i}>
                    <TableCell className={`text-xs font-mono py-1 ${order.type === 'Bid' ? 'text-emerald-500' : 'text-rose-500'}`}>
                      {order.price}
                    </TableCell>
                    <TableCell className="text-xs font-mono py-1 text-right">{order.qty}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Active Traders */}
        <Card className="hover-elevate">
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              ACTIVE TRADERS
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {activeTraders.map((trader) => (
              <div key={trader.id} className="flex justify-between items-center">
                <p className="text-xs font-mono">{trader.id}</p>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">{trader.tradeCount} trades</span>
                  <Badge variant="outline" className="text-[10px]">
                    {trader.activity}
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
