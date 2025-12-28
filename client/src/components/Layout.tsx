import { Link, useLocation } from "wouter";
import { ArrowLeft, Search, TrendingUp, TrendingDown, BarChart3, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { useCreateAnalysis } from "@/hooks/use-analysis";
import { useToast } from "@/hooks/use-toast";

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
  showBack?: boolean;
}

interface CommodityData {
  name: string;
  price: string;
  change: number;
}

export function Layout({ children, title, showBack = false }: LayoutProps) {
  const [location, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const { mutate: analyzeStock, isPending } = useCreateAnalysis();
  const { toast } = useToast();
  const [commodities, setCommodities] = useState<CommodityData[]>([
    { name: "Gold", price: "62,450", change: 0.45 },
    { name: "Silver", price: "74,890", change: -0.32 },
    { name: "Crude", price: "6,720", change: 1.12 },
    { name: "NatGas", price: "245", change: -0.89 },
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCommodities(prev => prev.map(c => ({
        ...c,
        price: (parseFloat(c.price.replace(/,/g, '')) * (1 + (Math.random() - 0.5) * 0.002)).toLocaleString('en-IN', { maximumFractionDigits: 0 }),
        change: parseFloat((c.change + (Math.random() - 0.5) * 0.1).toFixed(2))
      })));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const symbol = searchQuery.trim().toUpperCase();
    if (!symbol) return;
    
    if (symbol.length > 20) {
      toast({
        title: "Invalid Symbol",
        description: "Please enter a valid stock symbol (max 20 chars).",
        variant: "destructive",
      });
      return;
    }

    analyzeStock(symbol, {
      onSuccess: () => {
        setSearchQuery("");
      },
      onError: (error) => {
        toast({
          title: "Analysis Failed",
          description: error.message,
          variant: "destructive",
        });
      },
    });
  };

  const isDetailPage = location !== "/" && location !== "/stocks" && location !== "/monitor" && location !== "/commodities" && location !== "/news";

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b-2 border-primary/50">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="flex items-center justify-between h-16 gap-4">
            <div className="flex items-center gap-3">
              {isDetailPage && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setLocation("/")}
                  className="text-primary hover:bg-primary/10"
                  data-testid="button-back"
                >
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              )}
              <Link href="/" className="flex items-center gap-2 group">
                <span className="font-black text-xl text-transparent bg-clip-text bg-gradient-to-r from-primary via-amber-400 to-yellow-300 uppercase tracking-tight">STOCKERSS</span>
              </Link>
            </div>

            <nav className="hidden md:flex items-center gap-4">
              <Link href="/" className={`text-sm font-medium transition-colors ${location === '/' ? 'text-primary' : 'text-muted-foreground hover:text-primary'}`}>
                Dashboard
              </Link>
              <Link href="/monitor" className={`text-sm font-medium transition-colors ${location === '/monitor' ? 'text-primary' : 'text-muted-foreground hover:text-primary'}`}>
                Monitor
              </Link>
              <Link href="/news" className={`text-sm font-medium transition-colors ${location === '/news' ? 'text-primary' : 'text-muted-foreground hover:text-primary'}`}>
                News
              </Link>
              <Link href="/stocks" className={`text-sm font-medium transition-colors ${location === '/stocks' ? 'text-primary' : 'text-muted-foreground hover:text-primary'}`}>
                Stocks
              </Link>
              <Link href="/commodities" className={`text-sm font-medium transition-colors ${location === '/commodities' ? 'text-primary' : 'text-muted-foreground hover:text-primary'}`}>
                Commodities
              </Link>
            </nav>

            <form onSubmit={handleSearch} className="flex-1 max-w-xs">
              <div className="relative">
                {isPending ? (
                  <Loader2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary animate-spin" />
                ) : (
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                )}
                <Input
                  type="text"
                  placeholder="Analyze stock (e.g. TCS)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value.toUpperCase())}
                  className="pl-10 bg-secondary border-primary/30 focus:border-primary text-foreground placeholder:text-muted-foreground uppercase"
                  disabled={isPending}
                  data-testid="input-search"
                />
              </div>
            </form>
          </div>
        </div>

        <div className="border-t border-primary/20 overflow-x-auto bg-secondary/30">
          <div className="flex items-center justify-center gap-6 px-4 py-2 min-w-max max-w-7xl mx-auto">
            <span className="text-xs text-primary font-semibold uppercase tracking-wider">Live:</span>
            {commodities.map((commodity) => (
              <div key={commodity.name} className="flex items-center gap-2 text-xs whitespace-nowrap">
                <span className="text-muted-foreground">{commodity.name}</span>
                <span className="font-mono text-foreground">{commodity.price}</span>
                <span className={`flex items-center gap-0.5 font-mono ${commodity.change >= 0 ? 'text-bullish' : 'text-bearish'}`}>
                  {commodity.change >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {commodity.change >= 0 ? '+' : ''}{commodity.change}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </header>

      <main className="flex-1 container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        {children}
      </main>

      <footer className="border-t-2 border-primary/50 mt-12 bg-secondary/20">
        <div className="container max-w-7xl mx-auto px-4 py-6 flex flex-col md:flex-row justify-between items-center text-sm text-muted-foreground gap-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-primary" />
            <span>2025 STOCKERSS. Financial data for educational purposes.</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-bullish animate-pulse"></span>
            <span className="text-xs">Market Open</span>
          </div>
          <p className="text-primary/70">Powered by OpenAI & Replit</p>
        </div>
      </footer>
    </div>
  );
}
