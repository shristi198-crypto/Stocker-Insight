import { useState, useEffect, useMemo } from "react";
import { Layout } from "@/components/Layout";
import { CustomizableDashboard } from "@/components/DashboardWidgets";
import { HistoricalChart } from "@/components/HistoricalChart";
import { Newspaper, ArrowRight, TrendingUp, TrendingDown, Building2, Globe, Sparkles, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { useNews } from "@/hooks/use-news";
import { useQuery } from "@tanstack/react-query";
import bullBearImage from "@assets/generated_images/bull_and_bear_market_battle.png";
import bullImage from "@assets/stock_images/bull_statue_stock_ma_e52666b1.jpg";
import bearImage from "@assets/stock_images/bear_stock_market_re_e13a2200.jpg";

type MarketMood = "bullish" | "bearish" | "neutral";

const moodConfig = {
  bullish: {
    image: bullImage,
    alt: "Bullish Market - Bull Statue",
    label: "BULLISH",
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/20 border-emerald-500/30",
  },
  bearish: {
    image: bearImage,
    alt: "Bearish Market - Bear",
    label: "BEARISH",
    color: "text-red-400",
    bgColor: "bg-red-500/20 border-red-500/30",
  },
  neutral: {
    image: bullBearImage,
    alt: "Neutral Market - Bull and Bear Battle",
    label: "NEUTRAL",
    color: "text-primary",
    bgColor: "bg-primary/20 border-primary/30",
  },
};

interface FIIDIIData {
  date: string;
  fii: { buy: number; sell: number; net: number };
  dii: { buy: number; sell: number; net: number };
}

function FIIDIIWidget() {
  const [data, setData] = useState<FIIDIIData[]>([]);

  useEffect(() => {
    const generateData = () => {
      const dates = ["27 Dec", "26 Dec", "24 Dec", "23 Dec", "20 Dec"];
      setData(dates.map(date => {
        const fiiBuy = Math.random() * 15000 + 5000;
        const fiiSell = Math.random() * 15000 + 5000;
        const diiBuy = Math.random() * 12000 + 4000;
        const diiSell = Math.random() * 12000 + 4000;
        return {
          date,
          fii: { buy: fiiBuy, sell: fiiSell, net: fiiBuy - fiiSell },
          dii: { buy: diiBuy, sell: diiSell, net: diiBuy - diiSell },
        };
      }));
    };
    
    generateData();
    const interval = setInterval(generateData, 30000);
    return () => clearInterval(interval);
  }, []);

  const latestFII = data[0]?.fii.net || 0;
  const latestDII = data[0]?.dii.net || 0;

  return (
    <Card className="border-2 border-primary/30" data-testid="card-fii-dii">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-bold flex items-center gap-2">
          <Globe className="w-4 h-4 text-primary" />
          FII / DII ACTIVITY
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2 p-3 rounded-md bg-muted/30">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-blue-400" />
              <span className="text-xs font-bold">FII (Foreign)</span>
            </div>
            <p className={`text-xl font-black font-mono ${latestFII >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {latestFII >= 0 ? '+' : ''}{(latestFII / 100).toFixed(0)} Cr
            </p>
            <Badge variant={latestFII >= 0 ? "default" : "destructive"} className="text-[10px]">
              {latestFII >= 0 ? 'Net Buyer' : 'Net Seller'}
            </Badge>
          </div>
          <div className="space-y-2 p-3 rounded-md bg-muted/30">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-bold">DII (Domestic)</span>
            </div>
            <p className={`text-xl font-black font-mono ${latestDII >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {latestDII >= 0 ? '+' : ''}{(latestDII / 100).toFixed(0)} Cr
            </p>
            <Badge variant={latestDII >= 0 ? "default" : "destructive"} className="text-[10px]">
              {latestDII >= 0 ? 'Net Buyer' : 'Net Seller'}
            </Badge>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-bold text-muted-foreground">RECENT ACTIVITY (in Cr)</p>
          <div className="space-y-1">
            {data.slice(0, 5).map((item) => (
              <div key={item.date} className="flex items-center justify-between text-xs" data-testid={`fii-dii-row-${item.date}`}>
                <span className="text-muted-foreground w-16">{item.date}</span>
                <span className={`font-mono w-20 text-right ${item.fii.net >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {item.fii.net >= 0 ? '+' : ''}{(item.fii.net / 100).toFixed(0)}
                </span>
                <span className={`font-mono w-20 text-right ${item.dii.net >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {item.dii.net >= 0 ? '+' : ''}{(item.dii.net / 100).toFixed(0)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface CapStock {
  symbol: string;
  name: string;
  price: number;
  change: number;
  returns: string;
}

function MarketCapStocksWidget() {
  const { data: stocksData, refetch, isFetching } = useQuery<{
    smallCap: CapStock[];
    midCap: CapStock[];
    largeCap: CapStock[];
  }>({
    queryKey: ['/api/nse/cap-stocks'],
    refetchInterval: 5000,
    staleTime: 5000,
  });

  const defaultSmallCap: CapStock[] = [
    { symbol: "DEEPAKNTR", name: "Deepak Nitrite", price: 2245.50, change: 4.2, returns: "+42%" },
    { symbol: "POLYCAB", name: "Polycab India", price: 5890.25, change: 3.8, returns: "+38%" },
    { symbol: "AFFLE", name: "Affle India", price: 1156.80, change: 5.1, returns: "+51%" },
    { symbol: "TANLA", name: "Tanla Platforms", price: 892.40, change: 2.9, returns: "+35%" },
  ];

  const defaultMidCap: CapStock[] = [
    { symbol: "PERSISTENT", name: "Persistent Sys", price: 4520.15, change: 3.5, returns: "+35%" },
    { symbol: "COFORGE", name: "Coforge Ltd", price: 6780.90, change: 2.8, returns: "+32%" },
    { symbol: "MPHASIS", name: "Mphasis Ltd", price: 2456.75, change: 3.2, returns: "+28%" },
    { symbol: "ASTRAL", name: "Astral Ltd", price: 1890.60, change: 4.1, returns: "+31%" },
  ];

  const defaultLargeCap: CapStock[] = [
    { symbol: "TCS", name: "TCS Ltd", price: 3845.20, change: 1.8, returns: "+18%" },
    { symbol: "RELIANCE", name: "Reliance Ind", price: 2456.75, change: 2.1, returns: "+21%" },
    { symbol: "HDFCBANK", name: "HDFC Bank", price: 1678.30, change: 1.5, returns: "+15%" },
    { symbol: "INFY", name: "Infosys Ltd", price: 1542.85, change: 2.4, returns: "+24%" },
  ];

  const smallCap = stocksData?.smallCap || defaultSmallCap;
  const midCap = stocksData?.midCap || defaultMidCap;
  const largeCap = stocksData?.largeCap || defaultLargeCap;

  const capTypeMap: Record<string, string> = {
    "Small Cap": "small",
    "Mid Cap": "mid",
    "Large Cap": "large"
  };

  const renderStockList = (stocks: CapStock[], capType: string, bgColor: string, textColor: string) => (
    <Link href={`/cap-stocks/${capTypeMap[capType]}`}>
      <Card className="border-2 border-primary/30 cursor-pointer hover-elevate" data-testid={`card-${capType}-stocks`}>
        <CardHeader className="pb-2 flex flex-row items-center justify-between gap-2">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Sparkles className={`w-4 h-4 ${textColor}`} />
            {capType.toUpperCase()} HIGH RETURNS
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={`text-[10px] ${textColor} border-current bg-current/10`}>
              {isFetching ? 'Updating...' : 'LIVE'}
            </Badge>
            <ArrowRight className={`w-4 h-4 ${textColor}`} />
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {stocks.map((stock) => (
            <div 
              key={stock.symbol} 
              className="flex items-center justify-between p-2 rounded-md bg-muted/30"
              data-testid={`stock-${capType}-${stock.symbol}`}
            >
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm truncate">{stock.symbol}</p>
                <p className="text-xs text-muted-foreground truncate">{stock.name}</p>
              </div>
              <div className="text-right flex items-center gap-3">
                <div>
                  <p className="font-mono text-sm font-bold">{stock.price.toLocaleString('en-IN')}</p>
                  <p className={`text-xs font-mono flex items-center justify-end gap-1 ${stock.change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {stock.change >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {stock.change >= 0 ? '+' : ''}{stock.change}%
                  </p>
                </div>
                <Badge className={`${bgColor} text-white font-bold text-xs`}>
                  {stock.returns}
                </Badge>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </Link>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-600 via-red-500 to-red-400" style={{fontFamily: 'Bebas Neue'}}>
          TOP PERFORMING STOCKS BY MARKET CAP
        </h2>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => refetch()}
          disabled={isFetching}
          className="text-primary border-primary/30"
          data-testid="button-refresh-cap-stocks"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {renderStockList(smallCap, "Small Cap", "bg-purple-600", "text-purple-400")}
        {renderStockList(midCap, "Mid Cap", "bg-blue-600", "text-blue-400")}
        {renderStockList(largeCap, "Large Cap", "bg-amber-600", "text-amber-400")}
      </div>
    </div>
  );
}

function NewsSummaryCard() {
  const { data: news } = useNews();
  
  const bullishCount = news?.filter(n => n.sentiment === "bullish").length || 0;
  const bearishCount = news?.filter(n => n.sentiment === "bearish").length || 0;
  const total = news?.length || 0;

  return (
    <Card className="border-2 border-primary/30" data-testid="card-news-summary">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-bold flex items-center gap-2">
          <Newspaper className="w-4 h-4 text-primary" />
          MARKET SENTIMENT
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
            <span className="text-sm font-bold text-emerald-400">{bullishCount} Bullish</span>
          </div>
          <div className="flex items-center gap-2">
            <TrendingDown className="w-5 h-5 text-red-400" />
            <span className="text-sm font-bold text-red-400">{bearishCount} Bearish</span>
          </div>
        </div>
        {total > 0 && (
          <Badge variant="outline" className="w-full justify-center text-xs bg-primary/10 border-primary/20">
            {total} news articles with AI sentiment
          </Badge>
        )}
        <Link href="/news">
          <Button variant="default" className="w-full" data-testid="link-news-page">
            View Full News Feed
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}

export default function Home() {
  const { data: news } = useNews();
  
  const marketMood = useMemo<MarketMood>(() => {
    if (!news || news.length === 0) return "neutral";
    
    const bullishCount = news.filter(n => n.sentiment === "bullish").length;
    const bearishCount = news.filter(n => n.sentiment === "bearish").length;
    const total = news.length;
    
    const bullishRatio = bullishCount / total;
    const bearishRatio = bearishCount / total;
    
    if (bullishRatio > 0.5) return "bullish";
    if (bearishRatio > 0.5) return "bearish";
    if (bullishRatio > bearishRatio + 0.15) return "bullish";
    if (bearishRatio > bullishRatio + 0.15) return "bearish";
    
    return "neutral";
  }, [news]);

  const currentMoodConfig = moodConfig[marketMood];

  return (
    <Layout>
      <div className="space-y-12">
        {/* Hero Section with Market Mood Image */}
        <div className="text-center space-y-6 w-full animate-in fade-in zoom-in duration-500 pt-4">
          <h1 className="text-3xl md:text-5xl tracking-tight text-foreground">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 via-red-500 to-red-400" style={{fontFamily: 'Bebas Neue', textShadow: '0 0 20px rgba(226, 27, 27, 0.8), 0 0 40px rgba(226, 27, 27, 0.5)'}}>
              NEW VISION OF STOCK MARKET WITH STOCKERSS
            </span>
          </h1>
          <div className="flex items-center justify-center gap-2 mb-2">
            <Badge className={`${currentMoodConfig.bgColor} ${currentMoodConfig.color} text-sm px-4 py-1`} data-testid="badge-market-mood">
              {marketMood === "bullish" && <TrendingUp className="w-4 h-4 mr-2" />}
              {marketMood === "bearish" && <TrendingDown className="w-4 h-4 mr-2" />}
              MARKET MOOD: {currentMoodConfig.label}
            </Badge>
          </div>
          <div className="w-full max-w-4xl mx-auto overflow-hidden rounded-lg relative">
            <img 
              src={currentMoodConfig.image} 
              alt={currentMoodConfig.alt} 
              className="w-full h-[260px] md:h-[300px] object-cover transition-all duration-500"
              data-testid="img-market-mood"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent pointer-events-none" />
          </div>
        </div>

        {/* Market Cap Stocks - Small, Mid, Large Cap */}
        <div className="w-full animate-in slide-in-from-bottom-8 duration-700 delay-100">
          <MarketCapStocksWidget />
        </div>

        {/* Historical Chart with Timeframes */}
        <div className="w-full animate-in slide-in-from-bottom-8 duration-700 delay-150">
          <HistoricalChart />
        </div>

        {/* Customizable Dashboard Widgets */}
        <div className="w-full animate-in slide-in-from-bottom-8 duration-700 delay-200">
          <CustomizableDashboard />
        </div>

        {/* FII/DII Data and News Teaser */}
        <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in slide-in-from-bottom-8 duration-700 delay-300">
          <FIIDIIWidget />
          <NewsSummaryCard />
        </div>
      </div>
    </Layout>
  );
}
