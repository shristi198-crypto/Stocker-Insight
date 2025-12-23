import { useState } from "react";
import { Search, Loader2, ArrowRight } from "lucide-react";
import { useCreateAnalysis } from "@/hooks/use-analysis";
import { useToast } from "@/hooks/use-toast";

export function StockSearch() {
  const [symbol, setSymbol] = useState("");
  const { mutate, isPending } = useCreateAnalysis();
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!symbol.trim()) return;

    if (symbol.trim().length > 20) {
      toast({
        title: "Invalid Symbol",
        description: "Please enter a valid stock symbol (max 20 chars).",
        variant: "destructive",
      });
      return;
    }

    mutate(symbol.trim(), {
      onError: (error) => {
        toast({
          title: "Analysis Failed",
          description: error.message,
          variant: "destructive",
        });
      },
    });
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-primary/30 via-primary/10 to-transparent rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
        <div className="relative flex items-center bg-card border border-border rounded-xl shadow-2xl overflow-hidden focus-within:ring-2 focus-within:ring-primary/20 transition-all">
          <Search className="w-6 h-6 ml-6 text-muted-foreground" />
          <input
            type="text"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value.toUpperCase())}
            placeholder="Enter Stock Symbol (e.g., RELIANCE, TCS, INFY)"
            className="w-full bg-transparent border-none px-6 py-5 text-lg font-medium placeholder:text-muted-foreground/50 focus:outline-none focus:ring-0 uppercase tracking-wider"
            disabled={isPending}
          />
          <button
            type="submit"
            disabled={isPending || !symbol}
            className="mr-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground font-semibold flex items-center gap-2 hover:brightness-110 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {isPending ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                Analyze
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </div>
      </form>
      <p className="mt-3 text-center text-sm text-muted-foreground">
        AI-Powered fundamental & technical analysis for Indian Equities (NSE/BSE).
      </p>
    </div>
  );
}
