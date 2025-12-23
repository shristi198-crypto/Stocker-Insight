import { Link } from "wouter";
import { formatDistanceToNow } from "date-fns";
import { TrendingUp, Clock, ArrowUpRight } from "lucide-react";
import type { Analysis } from "@shared/schema";

export function RecentAnalyses({ analyses }: { analyses: Analysis[] }) {
  if (analyses.length === 0) return null;

  return (
    <div className="mt-16 w-full max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Clock className="w-6 h-6 text-primary" />
          Recent Analyses
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {analyses.map((analysis) => (
          <Link key={analysis.id} href={`/analysis/${analysis.id}`} className="block group">
            <div className="h-full bg-card hover:bg-card/80 border border-border/50 hover:border-primary/50 rounded-xl p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/5 cursor-pointer relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <ArrowUpRight className="w-5 h-5 text-primary" />
              </div>
              
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center font-bold text-primary border border-border/50">
                  {analysis.symbol.substring(0, 1)}
                </div>
                <div>
                  <h3 className="text-lg font-bold tracking-tight">{analysis.symbol}</h3>
                  <span className="text-xs text-muted-foreground font-mono">
                    NSE / BSE
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-auto pt-4 border-t border-border/40">
                <TrendingUp className="w-3 h-3" />
                <span>
                  Analyzed {formatDistanceToNow(new Date(analysis.createdAt || Date.now()), { addSuffix: true })}
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
