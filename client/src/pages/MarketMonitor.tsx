import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TrendingUp, BookOpen, Users, Zap } from "lucide-react";
import { Layout } from "@/components/Layout";
import { NewsFeed } from "@/components/NewsFeed";

export default function MarketMonitor() {
  const [magicStocks, setMagicStocks] = useState([
    { symbol: "TATASTEEL", score: "98/100", reason: "Breakout Volume + News" },
    { symbol: "ADANIENT", score: "95/100", reason: "Institutional Accumulation" },
    { symbol: "HDFCBANK", score: "92/100", reason: "Active Trader Interest" },
    { symbol: "ZOMATO", score: "89/100", reason: "Earnings Surprise Alert" },
  ]);

  const [highVolumeStocks, setHighVolumeStocks] = useState([
    { symbol: "RELIANCE", volume: "12.4M", change: "+1.2%" },
    { symbol: "HDFCBANK", volume: "8.1M", change: "-0.5%" },
    { symbol: "TCS", volume: "5.2M", change: "+0.8%" },
    { symbol: "ICICIBANK", volume: "10.5M", change: "+2.1%" },
    { symbol: "INFY", volume: "7.8M", change: "-1.1%" },
  ]);

  const [orderBook, setOrderBook] = useState([
    { price: "2450.50", qty: "1,200", type: "Bid" },
    { price: "2450.45", qty: "850", type: "Bid" },
    { price: "2451.00", qty: "500", type: "Ask" },
    { price: "2451.10", qty: "1,100", type: "Ask" },
  ]);

  const [activeTraders, setActiveTraders] = useState([
    { id: "TRD_882", activity: "High", tradeCount: 142 },
    { id: "TRD_119", activity: "Medium", tradeCount: 89 },
    { id: "TRD_454", activity: "High", tradeCount: 215 },
  ]);


  useEffect(() => {
    const interval = setInterval(() => {
      // Dynamically update Magic Stocks based on other signals
      setMagicStocks(prev => {
        const topVolume = highVolumeStocks[0]?.symbol || "N/A";
        const bestBid = orderBook.find(o => o.type === 'Bid')?.price || "N/A";

        return [
          { symbol: topVolume, score: "99/100", reason: "Volume Peak + Price Action" },
          { symbol: prev[1].symbol, score: "96/100", reason: "News Sentiment Analysis" },
          { symbol: prev[2].symbol, score: "94/100", reason: `Order Flow Support at ₹${bestBid}` },
          { symbol: prev[3].symbol, score: "91/100", reason: "Institutional Buy Signal" },
        ];
      });

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

      // Simulate order book changes
      setOrderBook(prev => prev.map(order => {
        const priceChange = (Math.random() * 0.10 - 0.05).toFixed(2);
        const newPrice = (parseFloat(order.price) + parseFloat(priceChange)).toFixed(2);
        const newQty = Math.floor(parseInt(order.qty.replace(/,/g, '')) + (Math.random() * 100 - 50));
        return {
          ...order,
          price: newPrice,
          qty: Math.max(100, newQty).toLocaleString()
        };
      }));

      // Update trader activity
      setActiveTraders(prev => prev.map(trader => ({
        ...trader,
        tradeCount: trader.tradeCount + Math.floor(Math.random() * 3)
      })));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-black tracking-tighter uppercase italic text-foreground">
            Market Monitor
          </h1>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Live Connection Active</span>
          </div>
        </div>

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

        {/* Market News - AI Sentiment */}
        <NewsFeed compact />

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
                    <TableCell className={`text-xs font-mono py-1 ${order.type === 'Bid' ? 'text-emerald-600' : 'text-red-600'}`}>
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
    </Layout>
  );
}
