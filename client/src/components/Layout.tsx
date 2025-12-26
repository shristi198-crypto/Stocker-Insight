import { Link } from "wouter";
import { BarChart3, TrendingUp } from "lucide-react";

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
      <header className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2 group">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
              <TrendingUp className="w-5 h-5 text-primary" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              Stocker-Insight
            </span>
          </Link>
          
          <nav className="flex items-center gap-6">
            <Link href="/" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
              Dashboard
            </Link>
            <Link href="/monitor" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
              Monitor
            </Link>
            <Link href="/stocks" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
              Stocks
            </Link>
            <Link href="/commodities" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
              Commodities
            </Link>
            <Link href="/news/1" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
              News
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1 container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        {children}
      </main>

      <footer className="border-t border-border/40 py-8 mt-12">
        <div className="container max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center text-sm text-muted-foreground">
          <div className="flex items-center gap-2 mb-4 md:mb-0">
            <BarChart3 className="w-4 h-4 opacity-50" />
            <span>© 2025 Stocker-Insight. Financial data for educational purposes.</span>
          </div>
          <p className="opacity-60">Powered by OpenAI & Replit</p>
        </div>
      </footer>
    </div>
  );
}
