import { Layout } from "@/components/Layout";
import { StockSearch } from "@/components/StockSearch";
import { RecentAnalyses } from "@/components/RecentAnalyses";
import { useAnalyses } from "@/hooks/use-analysis";
import { Loader2, Newspaper, ArrowRight, TrendingUp, TrendingDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { useNews } from "@/hooks/use-news";

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
  const { data: analyses, isLoading } = useAnalyses();

  return (
    <Layout>
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-16">
        {/* Hero Section */}
        <div className="text-center space-y-6 w-full max-w-3xl animate-in fade-in zoom-in duration-500">
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-foreground">
            Smarter Investing with <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-amber-400 to-yellow-300">
              AI Insights
            </span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Experience the power of <span className="text-primary font-bold italic">Stocker-Insight</span>. 
            Instant fundamental & technical analysis for any Indian stock. 
          </p>
        </div>

        {/* Search Component */}
        <div className="w-full animate-in slide-in-from-bottom-8 duration-700 delay-150">
          <StockSearch />
        </div>

        {/* Recent Analyses and News Teaser */}
        <div className="w-full grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in slide-in-from-bottom-8 duration-700 delay-300">
          <div className="lg:col-span-2">
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
              </div>
            ) : (
              <RecentAnalyses analyses={analyses || []} />
            )}
          </div>
          <div className="lg:col-span-1">
            <NewsSummaryCard />
          </div>
        </div>
      </div>
    </Layout>
  );
}
