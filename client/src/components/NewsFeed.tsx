import { useNews, useRefreshNews, type NewsItem } from "@/hooks/use-news";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw, TrendingUp, TrendingDown, Minus, Newspaper, Loader2, Clock } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { useState, useEffect } from "react";

function SentimentBadge({ sentiment, score, newsId }: { sentiment: string; score: string; newsId?: number }) {
  const config = {
    bullish: { 
      icon: TrendingUp, 
      className: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" 
    },
    bearish: { 
      icon: TrendingDown, 
      className: "bg-red-500/20 text-red-400 border-red-500/30" 
    },
    neutral: { 
      icon: Minus, 
      className: "bg-primary/20 text-primary border-primary/30" 
    },
  };

  const { icon: Icon, className } = config[sentiment as keyof typeof config] || config.neutral;

  return (
    <Badge 
      variant="outline" 
      className={`text-xs font-mono ${className}`}
      data-testid={newsId ? `badge-news-sentiment-${newsId}` : undefined}
    >
      <Icon className="w-3 h-3 mr-1" />
      {score}
    </Badge>
  );
}

function NewsCard({ item }: { item: NewsItem }) {
  const timeAgo = item.createdAt 
    ? formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })
    : "Just now";

  return (
    <div 
      className="p-4 border-b border-primary/10 last:border-b-0 hover-elevate"
      data-testid={`card-news-${item.id}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <Badge 
              variant="outline" 
              className="text-[10px] bg-primary/10 border-primary/20"
              data-testid={`badge-news-category-${item.id}`}
            >
              {item.category}
            </Badge>
            <span className="text-[10px] text-muted-foreground" data-testid={`text-news-source-${item.id}`}>{item.source}</span>
            <span className="text-[10px] text-muted-foreground" data-testid={`text-news-time-${item.id}`}>{timeAgo}</span>
          </div>
          <h4 
            className="text-sm text-foreground leading-tight mb-1"
            style={{ fontFamily: 'Calibri, sans-serif' }}
            data-testid={`text-news-title-${item.id}`}
          >
            {item.title}
          </h4>
          <p 
            className="text-xs text-muted-foreground line-clamp-2"
            style={{ fontFamily: 'Calibri, sans-serif' }}
            data-testid={`text-news-summary-${item.id}`}
          >
            {item.summary}
          </p>
          {item.relatedStocks && item.relatedStocks.length > 0 && (
            <div className="flex items-center gap-1 mt-2 flex-wrap">
              {item.relatedStocks.map((stock, index) => (
                <Badge 
                  key={stock} 
                  variant="secondary" 
                  className="text-[10px] font-mono"
                  data-testid={`badge-news-stock-${item.id}-${index}`}
                >
                  {stock}
                </Badge>
              ))}
            </div>
          )}
        </div>
        <SentimentBadge sentiment={item.sentiment} score={item.sentimentScore} newsId={item.id} />
      </div>
    </div>
  );
}

export function NewsFeed({ compact = false }: { compact?: boolean }) {
  const { data: news, isLoading, dataUpdatedAt } = useNews();
  const { mutate: refreshNews, isPending: isRefreshing } = useRefreshNews();
  const [lastUpdated, setLastUpdated] = useState<string>("");

  useEffect(() => {
    if (dataUpdatedAt) {
      setLastUpdated(format(new Date(dataUpdatedAt), "HH:mm:ss"));
    }
  }, [dataUpdatedAt]);

  const displayNews = compact ? news?.slice(0, 5) : news;

  return (
    <Card className="border-2 border-primary/30">
      <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
        <div className="flex items-center gap-3">
          <CardTitle className="text-sm flex items-center gap-2" style={{ fontFamily: 'Calibri, sans-serif' }}>
            <Newspaper className="w-4 h-4 text-primary" />
            LIVE NEWS FEED
          </CardTitle>
          {lastUpdated && (
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground" data-testid="text-last-updated">
              <Clock className="w-3 h-3" />
              <span>Updated: {lastUpdated}</span>
            </div>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => refreshNews()}
          disabled={isRefreshing}
          className="text-primary"
          data-testid="button-refresh-news"
        >
          {isRefreshing ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="flex items-center justify-center py-8" data-testid="status-news-loading">
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
          </div>
        ) : !news || news.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground" data-testid="status-news-empty">
            <p className="text-sm mb-3">No news available</p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => refreshNews()}
              disabled={isRefreshing}
              data-testid="button-load-news"
            >
              {isRefreshing ? "Loading..." : "Load News"}
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-primary/10" data-testid="list-news-items">
            {displayNews?.map((item) => (
              <NewsCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
