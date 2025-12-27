import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { CustomizableDashboard } from "@/components/DashboardWidgets";
import { HistoricalChart } from "@/components/HistoricalChart";
import { Newspaper, ArrowRight, TrendingUp, TrendingDown, Building2, Globe } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { useNews } from "@/hooks/use-news";
import bullBearImage from "@assets/generated_images/bull_and_bear_market_battle.png";

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
  return (
    <Layout>
      <div className="space-y-12">
        {/* Hero Section with Bull & Bear Image */}
        <div className="text-center space-y-6 w-full animate-in fade-in zoom-in duration-500 pt-4">
          <h1 className="text-3xl md:text-5xl tracking-tight text-foreground">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-amber-400 to-yellow-300">
              NEW VISION OF STOCK MARKET
            </span>
          </h1>
          <div className="w-full max-w-5xl mx-auto overflow-hidden rounded-lg">
            <img 
              src={bullBearImage} 
              alt="Bull and Bear Market Battle" 
              className="w-full h-auto object-cover"
              data-testid="img-bull-bear"
            />
          </div>
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
