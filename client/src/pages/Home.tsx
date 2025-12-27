import { Layout } from "@/components/Layout";
import { StockSearch } from "@/components/StockSearch";
import { RecentAnalyses } from "@/components/RecentAnalyses";
import { NewsFeed } from "@/components/NewsFeed";
import { useAnalyses } from "@/hooks/use-analysis";
import { Loader2 } from "lucide-react";

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

        {/* News and Recent Analyses */}
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
            <NewsFeed compact />
          </div>
        </div>
      </div>
    </Layout>
  );
}
