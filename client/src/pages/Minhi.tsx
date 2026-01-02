import { useQuery } from "@tanstack/react-query";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  TrendingUp, 
  TrendingDown, 
  Zap, 
  Shield, 
  BookOpen, 
  Users,
  RefreshCw,
  Sparkles,
  Target,
  Filter,
  AlertCircle,
  SearchX
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface MinhiStock {
  symbol: string;
  name: string;
  price: number;
  threeYearSalesGrowth: number;
  growthPotential: string;
  debtToEquity: number;
  bookValue: number;
  promoterHolding: number;
  sector: string;
  marketCap: string;
  pe: number;
  recommendation: string;
  dayChange: number;
  dayChangePercent: number;
}

interface MinhiResponse {
  stocks: MinhiStock[];
  criteria: {
    maxPrice: number;
    minSalesGrowth: number;
    maxDebtToEquity: number;
    minPromoterHolding: number;
    bookValueAbovePrice: boolean;
  };
  lastUpdated: string;
  count: number;
}

export default function Minhi() {
  const { data, isLoading, error, refetch, isFetching } = useQuery<MinhiResponse>({
    queryKey: ["/api/minhi"],
    refetchInterval: 5000,
  });

  const getRecommendationColor = (rec: string) => {
    if (rec.includes("STRONG BUY")) return "bg-emerald-500/20 text-emerald-400 border-emerald-500/40";
    if (rec.includes("BUY")) return "bg-green-500/20 text-green-400 border-green-500/40";
    if (rec.includes("HOLD")) return "bg-yellow-500/20 text-yellow-400 border-yellow-500/40";
    return "bg-red-500/20 text-red-400 border-red-500/40";
  };

  const getGrowthPotentialColor = (potential: string) => {
    if (potential === "Very High") return "text-emerald-400";
    if (potential === "High") return "text-green-400";
    if (potential === "Medium") return "text-yellow-400";
    return "text-red-400";
  };

  return (
    <Layout title="MINHI - Penny Stocks" showBack>
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div>
              <h1 className="text-3xl font-black tracking-tight text-primary mb-1" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
                <Sparkles className="inline w-8 h-8 mr-2" />
                MINHI PENNY STOCKS
              </h1>
              <p className="text-muted-foreground text-sm">
                Hidden gems under Rs 150 with strong fundamentals
              </p>
            </div>
            <Button 
              variant="outline" 
              onClick={() => refetch()} 
              disabled={isFetching}
              className="border-primary/30"
              data-testid="button-refresh-minhi"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          <Card className="bg-card/50 border-primary/20 mb-6">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Filter className="w-4 h-4 text-primary" />
                Selection Criteria
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                <div className="flex items-center gap-2 text-sm">
                  <Badge variant="outline" className="text-xs border-primary/40 bg-primary/10">
                    Price
                  </Badge>
                  <span className="text-muted-foreground">&lt; Rs 150</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Badge variant="outline" className="text-xs border-green-500/40 bg-green-500/10 text-green-400">
                    3Y Growth
                  </Badge>
                  <span className="text-muted-foreground">&gt; 30%</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Badge variant="outline" className="text-xs border-blue-500/40 bg-blue-500/10 text-blue-400">
                    Debt/Eq
                  </Badge>
                  <span className="text-muted-foreground">&lt; 0.10</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Badge variant="outline" className="text-xs border-purple-500/40 bg-purple-500/10 text-purple-400">
                    Book Value
                  </Badge>
                  <span className="text-muted-foreground">&gt; Price</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Badge variant="outline" className="text-xs border-amber-500/40 bg-amber-500/10 text-amber-400">
                    Promoters
                  </Badge>
                  <span className="text-muted-foreground">&gt; 30%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {isLoading ? (
          <div className="grid gap-4">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        ) : error ? (
          <Alert variant="destructive" className="border-red-500/50 bg-red-500/10">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Failed to load penny stocks</AlertTitle>
            <AlertDescription className="flex items-center justify-between">
              <span>Unable to fetch data. Please try again.</span>
              <Button variant="outline" size="sm" onClick={() => refetch()} className="ml-4">
                <RefreshCw className="w-3 h-3 mr-2" />
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        ) : !data?.stocks?.length ? (
          <Card className="bg-card/50 border-primary/20 p-8">
            <div className="flex flex-col items-center justify-center text-center">
              <SearchX className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-bold mb-2">No Stocks Found</h3>
              <p className="text-muted-foreground text-sm mb-4">
                No penny stocks currently match all the selection criteria.
              </p>
              <Button variant="outline" onClick={() => refetch()}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh Data
              </Button>
            </div>
          </Card>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Found <span className="text-primary font-bold">{data?.count}</span> stocks matching criteria
              </span>
              <span className="text-xs text-muted-foreground">
                Auto-refresh: 5s
              </span>
            </div>

            <div className="grid gap-4">
              {data?.stocks.map((stock) => (
                <Card 
                  key={stock.symbol} 
                  className="bg-card/50 border-primary/20 hover-elevate cursor-pointer"
                  data-testid={`card-stock-${stock.symbol}`}
                >
                  <CardContent className="p-4">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                      <div className="lg:col-span-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="text-foreground" style={{ fontFamily: 'Calibri, sans-serif', fontSize: '20px' }}>{stock.symbol}</h3>
                            <p className="text-muted-foreground truncate max-w-[180px]" style={{ fontFamily: 'Calibri, sans-serif', fontSize: '20px' }}>{stock.name}</p>
                            <Badge variant="outline" className="text-[10px] mt-1 border-secondary/40">
                              {stock.sector}
                            </Badge>
                          </div>
                          <Badge variant="outline" className={`text-xs ${getRecommendationColor(stock.recommendation)}`}>
                            {stock.recommendation}
                          </Badge>
                        </div>
                      </div>

                      <div className="lg:col-span-2">
                        <div className="text-center lg:text-left">
                          <span className="text-2xl font-black font-mono text-foreground">
                            Rs {stock.price.toFixed(2)}
                          </span>
                          <div className={`flex items-center justify-center lg:justify-start gap-1 text-sm ${stock.dayChange >= 0 ? 'text-bullish' : 'text-bearish'}`}>
                            {stock.dayChange >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                            <span className="font-mono">
                              {stock.dayChange >= 0 ? '+' : ''}{stock.dayChange.toFixed(2)} ({stock.dayChangePercent >= 0 ? '+' : ''}{stock.dayChangePercent.toFixed(2)}%)
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="lg:col-span-7">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="bg-secondary/30 rounded-md p-2">
                                <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                                  <TrendingUp className="w-3 h-3 text-green-400" />
                                  3Y Growth
                                </div>
                                <span className="font-bold text-green-400 font-mono">{stock.threeYearSalesGrowth}%</span>
                                <Progress value={Math.min(stock.threeYearSalesGrowth, 100)} className="h-1 mt-1" />
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>3 Year Sales CAGR: {stock.threeYearSalesGrowth}%</p>
                            </TooltipContent>
                          </Tooltip>

                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="bg-secondary/30 rounded-md p-2">
                                <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                                  <Shield className="w-3 h-3 text-blue-400" />
                                  Debt/Eq
                                </div>
                                <span className="font-bold text-blue-400 font-mono">{stock.debtToEquity.toFixed(2)}</span>
                                <Progress value={(1 - stock.debtToEquity) * 100} className="h-1 mt-1" />
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Debt to Equity Ratio: {stock.debtToEquity} (Lower is better)</p>
                            </TooltipContent>
                          </Tooltip>

                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="bg-secondary/30 rounded-md p-2">
                                <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                                  <BookOpen className="w-3 h-3 text-purple-400" />
                                  Book Value
                                </div>
                                <span className="font-bold text-purple-400 font-mono">Rs {stock.bookValue.toFixed(0)}</span>
                                <div className="text-[10px] text-muted-foreground mt-1">
                                  {((stock.bookValue / stock.price - 1) * 100).toFixed(0)}% above CMP
                                </div>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Book Value per Share: Rs {stock.bookValue}</p>
                              <p>Trading at {((stock.price / stock.bookValue) * 100).toFixed(0)}% of book value</p>
                            </TooltipContent>
                          </Tooltip>

                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="bg-secondary/30 rounded-md p-2">
                                <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                                  <Users className="w-3 h-3 text-amber-400" />
                                  Promoters
                                </div>
                                <span className="font-bold text-amber-400 font-mono">{stock.promoterHolding}%</span>
                                <Progress value={stock.promoterHolding} className="h-1 mt-1" />
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Promoter Holding: {stock.promoterHolding}%</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>

                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/30">
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span>MCap: <span className="text-foreground">{stock.marketCap}</span></span>
                            <span>PE: <span className="text-foreground">{stock.pe}</span></span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Zap className={`w-4 h-4 ${getGrowthPotentialColor(stock.growthPotential)}`} />
                            <span className={`text-xs font-bold ${getGrowthPotentialColor(stock.growthPotential)}`}>
                              {stock.growthPotential} Potential
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        <div className="mt-6 p-4 bg-secondary/20 rounded-md border border-border/30">
          <p className="text-xs text-muted-foreground text-center">
            <Target className="inline w-3 h-3 mr-1" />
            Disclaimer: These are fundamentally screened stocks for educational purposes. Always do your own research before investing. Past performance is not indicative of future results.
          </p>
        </div>
      </div>
    </Layout>
  );
}
