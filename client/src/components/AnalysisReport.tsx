import ReactMarkdown from "react-markdown";
import { Analysis } from "@shared/schema";
import { format } from "date-fns";
import { Share2, Activity, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import Plot from 'react-plotly.js';

export function AnalysisReport({ analysis }: { analysis: Analysis }) {
  const { toast } = useToast();

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast({
      title: "Link Copied",
      description: "Analysis link copied to clipboard.",
    });
  };

  // Extract JSON data for Plotly
  const jsonMatch = analysis.report.match(/```json\n([\s\S]*?)\n```/);
  let chartData: any = null;
  if (jsonMatch) {
    try {
      chartData = JSON.parse(jsonMatch[1]);
    } catch (e) {
      console.error("Failed to parse chart data", e);
    }
  }

  const cleanReport = analysis.report.replace(/```json\n[\s\S]*?\n```/, '');

  return (
    <div className="w-full max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-700 space-y-6">
      <div className="bg-card border-2 border-primary/30 rounded-2xl p-8 md:p-10 relative overflow-hidden shadow-sm">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider border border-primary/20">
                AI Financial Intelligence
              </span>
              <span className="text-muted-foreground text-sm font-mono">
                {format(new Date(analysis.createdAt || Date.now()), "MMM d, yyyy")}
              </span>
            </div>
            <h1 className="text-4xl md:text-6xl font-black tracking-tighter mb-2 text-foreground uppercase italic">
              {analysis.symbol}
            </h1>
            <p className="text-muted-foreground flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary" />
              Screener & MoneyControl Insights
            </p>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleShare} className="hover-elevate">
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
          </div>
        </div>
      </div>

      {chartData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-card border-2 border-primary/30 rounded-2xl p-4 shadow-sm overflow-hidden min-h-[350px]">
            <Plot
              data={[
                {
                  x: chartData.revenue_years || [],
                  y: chartData.revenue_values || [],
                  type: 'bar',
                  name: 'Revenue',
                  marker: { color: '#D4AF37' }
                },
                {
                  x: chartData.revenue_years || [],
                  y: chartData.profit_values || [],
                  type: 'scatter',
                  mode: 'lines+markers',
                  name: 'Profit',
                  line: { color: '#16a34a' }
                }
              ]}
              layout={{
                title: { text: 'Financial Performance' },
                autosize: true,
                margin: { l: 40, r: 20, t: 40, b: 60 },
                paper_bgcolor: 'rgba(0,0,0,0)',
                plot_bgcolor: 'rgba(0,0,0,0)',
                font: { family: 'Inter, sans-serif' },
                showlegend: true,
                legend: { orientation: 'h', y: -0.2 }
              }}
              useResizeHandler={true}
              style={{ width: "100%", height: "100%" }}
            />
          </div>

          <div className="bg-card border-2 border-primary/30 rounded-2xl p-4 shadow-sm overflow-hidden min-h-[350px]">
            <Plot
              data={[
                {
                  y: chartData.price_history || [],
                  type: 'scatter',
                  mode: 'lines',
                  fill: 'tozeroy',
                  name: 'Price',
                  line: { color: '#D4AF37' }
                }
              ]}
              layout={{
                title: { text: 'Recent Price Action' },
                autosize: true,
                margin: { l: 40, r: 20, t: 40, b: 40 },
                paper_bgcolor: 'rgba(0,0,0,0)',
                plot_bgcolor: 'rgba(0,0,0,0)',
                font: { family: 'Inter, sans-serif' }
              }}
              useResizeHandler={true}
              style={{ width: "100%", height: "100%" }}
            />
          </div>

          <div className="bg-card border-2 border-primary/30 rounded-2xl p-6 shadow-sm overflow-hidden min-h-[350px] flex flex-col justify-center">
            <h3 className="text-lg font-bold mb-4 text-center">Fundamental Metrics</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-secondary/20 rounded-xl border border-border/50 text-center">
                <p className="text-[10px] text-muted-foreground uppercase">PE Ratio</p>
                <p className="text-lg font-bold text-primary">{chartData.technical_indicators?.PE_Ratio || 'N/A'}</p>
              </div>
              <div className="p-3 bg-secondary/20 rounded-xl border border-border/50 text-center">
                <p className="text-[10px] text-muted-foreground uppercase">ROE</p>
                <p className="text-lg font-bold text-primary">{chartData.technical_indicators?.ROE ? `${chartData.technical_indicators.ROE}%` : 'N/A'}</p>
              </div>
              <div className="p-3 bg-secondary/20 rounded-xl border border-border/50 text-center">
                <p className="text-[10px] text-muted-foreground uppercase">D/E Ratio</p>
                <p className="text-lg font-bold text-primary">{chartData.technical_indicators?.Debt_to_Equity || 'N/A'}</p>
              </div>
              <div className="p-3 bg-secondary/20 rounded-xl border border-border/50 text-center">
                <p className="text-[10px] text-muted-foreground uppercase">Promoter</p>
                <p className="text-lg font-bold text-primary">{chartData.technical_indicators?.Promoter_holding ? `${chartData.technical_indicators.Promoter_holding}%` : 'N/A'}</p>
              </div>
              <div className="p-3 bg-secondary/20 rounded-xl border border-border/50 text-center col-span-2">
                <p className="text-[10px] text-muted-foreground uppercase">FII / DII Holding</p>
                <p className="text-sm font-bold text-primary">{chartData.technical_indicators?.FII_holding || '0'}% / {chartData.technical_indicators?.DII_holding || '0'}%</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-card border-2 border-primary/30 rounded-2xl p-8 md:p-12 shadow-sm relative">
        <div className="prose prose-lg max-w-none prose-headings:text-primary prose-strong:text-primary">
          <ReactMarkdown>{cleanReport}</ReactMarkdown>
        </div>
        
        <div className="mt-12 pt-8 border-t border-border/50 flex items-start gap-4 text-sm text-muted-foreground bg-secondary/30 p-6 rounded-xl">
          <AlertCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong>Disclaimer:</strong> This report is AI-generated for informational purposes using data inspired by Screener and MoneyControl. Always consult a professional advisor.
          </p>
        </div>
      </div>
    </div>
  );
}
