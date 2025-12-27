import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TrendingUp, Zap, Building2, FileText, BarChart3 } from "lucide-react";
import { Layout } from "@/components/Layout";

interface BidAskLevel {
  price: number;
  bidQty: number;
  askQty: number;
}

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

  const [corporateEvents, setCorporateEvents] = useState([
    { company: "TATASTEEL", type: "Award of Order", details: "Received order worth Rs. 450 Cr", time: "10:30 AM" },
    { company: "L&T", type: "Receipt of Order", details: "Infrastructure project Rs. 1,200 Cr", time: "10:15 AM" },
    { company: "BHEL", type: "Award of Order", details: "Power equipment order Rs. 890 Cr", time: "09:45 AM" },
    { company: "RVNL", type: "Receipt of Order", details: "Railway project Rs. 567 Cr", time: "09:30 AM" },
    { company: "HCC", type: "Award of Order", details: "Construction contract Rs. 234 Cr", time: "09:15 AM" },
  ]);

  const [bidAskData, setBidAskData] = useState<BidAskLevel[]>([
    { price: 22150, bidQty: 4500, askQty: 3200 },
    { price: 22145, bidQty: 6800, askQty: 2100 },
    { price: 22140, bidQty: 8200, askQty: 1500 },
    { price: 22135, bidQty: 5600, askQty: 4800 },
    { price: 22130, bidQty: 3200, askQty: 7200 },
    { price: 22125, bidQty: 2100, askQty: 9500 },
  ]);


  const companies = ["TATASTEEL", "L&T", "BHEL", "RVNL", "HCC", "IRCON", "NCC", "KEC", "KALPATPOWR", "PNC"];
  const orderTypes = ["Award of Order", "Receipt of Order"];
  const projects = [
    "Infrastructure project", "Power equipment order", "Railway project", 
    "Construction contract", "Transmission line order", "Road project",
    "Metro rail order", "Bridge construction", "Industrial order"
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      // Dynamically update Magic Stocks based on other signals
      setMagicStocks(prev => {
        const topVolume = highVolumeStocks[0]?.symbol || "N/A";

        return [
          { symbol: topVolume, score: "99/100", reason: "Volume Peak + Price Action" },
          { symbol: prev[1].symbol, score: "96/100", reason: "News Sentiment Analysis" },
          { symbol: prev[2].symbol, score: "94/100", reason: "Corporate Order Flow" },
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

      // Update bid/ask data
      setBidAskData(prev => prev.map(level => ({
        price: level.price + (Math.random() - 0.5) * 2,
        bidQty: Math.max(1000, level.bidQty + Math.floor((Math.random() - 0.5) * 1000)),
        askQty: Math.max(1000, level.askQty + Math.floor((Math.random() - 0.5) * 1000)),
      })));
    }, 5000);

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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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

        {/* Bid Chart */}
        <Card className="hover-elevate">
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-primary" />
              NIFTY 50 BID CHART
            </CardTitle>
            <Badge variant="outline" className="text-[10px]">Live</Badge>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-[10px] text-muted-foreground mb-2">
              <span>BID QTY</span>
              <span>PRICE</span>
              <span>ASK QTY</span>
            </div>
            {bidAskData.map((level, i) => {
              const maxQty = Math.max(...bidAskData.map(l => Math.max(l.bidQty, l.askQty)));
              const bidWidth = (level.bidQty / maxQty) * 100;
              const askWidth = (level.askQty / maxQty) * 100;
              
              return (
                <div key={i} className="flex items-center gap-1" data-testid={`bid-level-${i}`}>
                  <div className="w-1/3 flex justify-end">
                    <div 
                      className="h-5 bg-emerald-500/40 rounded-l flex items-center justify-end pr-1"
                      style={{ width: `${bidWidth}%` }}
                    >
                      <span className="text-[10px] font-mono text-emerald-400">{(level.bidQty / 1000).toFixed(1)}K</span>
                    </div>
                  </div>
                  <div className="w-1/3 text-center">
                    <span className="text-xs font-mono font-bold">{level.price.toFixed(2)}</span>
                  </div>
                  <div className="w-1/3 flex justify-start">
                    <div 
                      className="h-5 bg-red-500/40 rounded-r flex items-center pl-1"
                      style={{ width: `${askWidth}%` }}
                    >
                      <span className="text-[10px] font-mono text-red-400">{(level.askQty / 1000).toFixed(1)}K</span>
                    </div>
                  </div>
                </div>
              );
            })}
            <div className="flex justify-between mt-3 pt-2 border-t border-primary/20">
              <div className="text-center">
                <p className="text-[10px] text-muted-foreground">Total Bid</p>
                <p className="text-sm font-bold text-emerald-400 font-mono">
                  {(bidAskData.reduce((sum, l) => sum + l.bidQty, 0) / 1000).toFixed(1)}K
                </p>
              </div>
              <div className="text-center">
                <p className="text-[10px] text-muted-foreground">Total Ask</p>
                <p className="text-sm font-bold text-red-400 font-mono">
                  {(bidAskData.reduce((sum, l) => sum + l.askQty, 0) / 1000).toFixed(1)}K
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        </div>
      </div>
    </Layout>
  );
}
