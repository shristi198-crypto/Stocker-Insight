import { Layout } from "@/components/Layout";
import { RecentAnalyses } from "@/components/RecentAnalyses";
import { CustomizableDashboard } from "@/components/DashboardWidgets";
import { useAnalyses } from "@/hooks/use-analysis";
import { Loader2, Newspaper, ArrowRight, TrendingUp, TrendingDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { useNews } from "@/hooks/use-news";
import bullBearImage from "@assets/generated_images/bull_and_bear_market_battle.png";

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
      <div className="space-y-12">
        {/* Hero Section with Bull & Bear Image */}
        <div className="text-center space-y-6 w-full animate-in fade-in zoom-in duration-500 pt-4">
          <h1 className="text-3xl md:text-5xl tracking-tight text-foreground">
            NEW VISION OF STOCK MARKET WITH{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-amber-400 to-yellow-300">
              STOCKERSS
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

        {/* Customizable Dashboard Widgets */}
        <div className="w-full animate-in slide-in-from-bottom-8 duration-700 delay-200">
          <CustomizableDashboard />
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
