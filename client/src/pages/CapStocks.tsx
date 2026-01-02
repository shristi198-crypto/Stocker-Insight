import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { TrendingUp, TrendingDown, Sparkles, RefreshCw, ArrowLeft, BarChart3, Activity, Target } from "lucide-react";

interface CapStock {
  symbol: string;
  name: string;
  price: number;
  change: number;
  returns: string;
  volume?: number;
  dayHigh?: number;
  dayLow?: number;
  weekHigh?: number;
  weekLow?: number;
}

interface CapStocksData {
  stocks: CapStock[];
  lastUpdated: string;
}

const capConfig: Record<string, { title: string; color: string; bgColor: string; description: string }> = {
  small: {
    title: "SMALL CAP",
    color: "text-purple-400",
    bgColor: "bg-purple-600",
    description: "Market Cap < Rs 5,000 Cr - High growth potential with higher volatility"
  },
  mid: {
    title: "MID CAP",
    color: "text-blue-400",
    bgColor: "bg-blue-600",
    description: "Market Cap Rs 5,000 - 20,000 Cr - Balance of growth and stability"
  },
  large: {
    title: "LARGE CAP",
    color: "text-amber-400",
    bgColor: "bg-amber-600",
    description: "Market Cap > Rs 20,000 Cr - Stable blue-chip companies with consistent returns"
  }
};

export default function CapStocks() {
  const [, params] = useRoute("/cap-stocks/:type");
  const capType = params?.type || "large";
  const config = capConfig[capType] || capConfig.large;
  const [nextRefresh, setNextRefresh] = useState(5);

  const { data, refetch, isFetching } = useQuery<CapStocksData>({
    queryKey: ['/api/nse/cap-stocks-detail', capType],
    refetchInterval: 5000,
    staleTime: 5000,
  });

  useEffect(() => {
    const countdownInterval = setInterval(() => {
      setNextRefresh(prev => {
        if (prev <= 1) {
          return 5;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(countdownInterval);
  }, []);

  const stocks = data?.stocks || [];

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="icon" className="text-primary" data-testid="button-back-home">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className={`text-2xl md:text-3xl font-black ${config.color}`} style={{fontFamily: 'Bebas Neue'}}>
                {config.title} HIGH RETURNS
              </h1>
              <p className="text-sm text-muted-foreground mt-1">{config.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className={`${config.color} border-current`}>
              Next: {nextRefresh}s
            </Badge>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => refetch()}
              disabled={isFetching}
              className={`${config.color} border-current`}
              data-testid="button-refresh-stocks"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        <div className="flex gap-2">
          {Object.entries(capConfig).map(([key, value]) => (
            <Link href={`/cap-stocks/${key}`} key={key}>
              <Button 
                variant={capType === key ? "default" : "outline"} 
                size="sm"
                className={capType === key ? value.bgColor : `${value.color} border-current`}
                data-testid={`tab-${key}-cap`}
              >
                {value.title}
              </Button>
            </Link>
          ))}
        </div>

        <div className="grid gap-4">
          {stocks.length === 0 ? (
            <Card className="border-2 border-primary/30">
              <CardContent className="py-12 text-center">
                <Activity className={`w-12 h-12 mx-auto mb-4 ${config.color}`} />
                <p className="text-muted-foreground">Loading {config.title} stocks...</p>
              </CardContent>
            </Card>
          ) : (
            stocks.map((stock, index) => (
              <Card 
                key={stock.symbol} 
                className="border-2 border-primary/30 hover-elevate"
                data-testid={`card-stock-${stock.symbol}`}
              >
                <CardContent className="p-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-md ${config.bgColor} flex items-center justify-center text-white font-bold`}>
                        {index + 1}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-lg">{stock.symbol}</h3>
                          <Badge className={`${config.bgColor} text-white text-xs`}>
                            {stock.returns}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{stock.name}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="text-center p-2 bg-muted/30 rounded-md">
                        <p className="text-xs text-muted-foreground mb-1">Current Price</p>
                        <p className="font-mono font-bold text-lg">
                          {stock.price.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                        </p>
                      </div>
                      <div className="text-center p-2 bg-muted/30 rounded-md">
                        <p className="text-xs text-muted-foreground mb-1">Day Change</p>
                        <p className={`font-mono font-bold text-lg flex items-center justify-center gap-1 ${stock.change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {stock.change >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                          {stock.change >= 0 ? '+' : ''}{stock.change.toFixed(2)}%
                        </p>
                      </div>
                      <div className="text-center p-2 bg-muted/30 rounded-md">
                        <p className="text-xs text-muted-foreground mb-1">Day Range</p>
                        <p className="font-mono text-sm">
                          {stock.dayLow?.toLocaleString('en-IN')} - {stock.dayHigh?.toLocaleString('en-IN')}
                        </p>
                      </div>
                      <div className="text-center p-2 bg-muted/30 rounded-md">
                        <p className="text-xs text-muted-foreground mb-1">52W Range</p>
                        <p className="font-mono text-sm">
                          {stock.weekLow?.toLocaleString('en-IN')} - {stock.weekHigh?.toLocaleString('en-IN')}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </Layout>
  );
}
