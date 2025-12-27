import { Layout } from "@/components/Layout";
import { NewsFeed } from "@/components/NewsFeed";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus, BarChart3 } from "lucide-react";
import { useNews } from "@/hooks/use-news";

function SentimentSummary() {
  const { data: news } = useNews();
  
  if (!news || news.length === 0) {
    return null;
  }

  const bullishCount = news.filter(n => n.sentiment === "bullish").length;
  const bearishCount = news.filter(n => n.sentiment === "bearish").length;
  const neutralCount = news.filter(n => n.sentiment === "neutral").length;
  const total = news.length;

  const bullishPct = Math.round((bullishCount / total) * 100);
  const bearishPct = Math.round((bearishCount / total) * 100);
  const neutralPct = Math.round((neutralCount / total) * 100);

  return (
    <Card className="border-2 border-primary/30" data-testid="card-sentiment-summary">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-bold flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-primary" />
          MARKET SENTIMENT ANALYSIS
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 rounded-md bg-emerald-500/10 border border-emerald-500/20" data-testid="stat-bullish">
            <TrendingUp className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
            <p className="text-2xl font-black text-emerald-400">{bullishPct}%</p>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Bullish</p>
            <Badge variant="outline" className="mt-2 text-[10px] bg-emerald-500/10 border-emerald-500/20 text-emerald-400">
              {bullishCount} articles
            </Badge>
          </div>
          <div className="text-center p-4 rounded-md bg-primary/10 border border-primary/20" data-testid="stat-neutral">
            <Minus className="w-6 h-6 text-primary mx-auto mb-2" />
            <p className="text-2xl font-black text-primary">{neutralPct}%</p>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Neutral</p>
            <Badge variant="outline" className="mt-2 text-[10px] bg-primary/10 border-primary/20">
              {neutralCount} articles
            </Badge>
          </div>
          <div className="text-center p-4 rounded-md bg-red-500/10 border border-red-500/20" data-testid="stat-bearish">
            <TrendingDown className="w-6 h-6 text-red-400 mx-auto mb-2" />
            <p className="text-2xl font-black text-red-400">{bearishPct}%</p>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Bearish</p>
            <Badge variant="outline" className="mt-2 text-[10px] bg-red-500/10 border-red-500/20 text-red-400">
              {bearishCount} articles
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function News() {
  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-black tracking-tighter uppercase italic text-foreground" data-testid="text-page-title">
            News & Sentiment
          </h1>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">AI-Powered Analysis</span>
          </div>
        </div>

        <SentimentSummary />

        <NewsFeed />
      </div>
    </Layout>
  );
}
