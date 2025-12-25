import ReactMarkdown from "react-markdown";
import { Analysis } from "@shared/schema";
import { format } from "date-fns";
import { Download, Share2, AlertCircle, BarChart, PieChart, TrendingUp, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { 
  BarChart as ReBarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  Cell,
  PieChart as RePieChart,
  Pie
} from 'recharts';

export function AnalysisReport({ analysis }: { analysis: Analysis }) {
  const { toast } = useToast();

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast({
      title: "Link Copied",
      description: "Analysis link copied to clipboard.",
    });
  };

  // Extract JSON data if present in the report
  const jsonMatch = analysis.report.match(/```json\n([\s\S]*?)\n```/);
  let chartData = null;
  if (jsonMatch) {
    try {
      chartData = JSON.parse(jsonMatch[1]);
    } catch (e) {
      console.error("Failed to parse chart data", e);
    }
  }

  // Sample data preparation
  const revenueData = chartData?.Revenue && Array.isArray(chartData.Revenue) 
    ? chartData.Revenue.map((val: number, i: number) => ({ year: `Y${i+1}`, value: val }))
    : [];

  const profitData = chartData?.Profits && Array.isArray(chartData.Profits)
    ? chartData.Profits.map((val: number, i: number) => ({ year: `Y${i+1}`, value: val }))
    : [];

  const priceTrendData = chartData?.['Price Trend'] && Array.isArray(chartData['Price Trend'])
    ? chartData['Price Trend'].map((val: number, i: number) => ({ time: `T${i+1}`, value: val }))
    : [];

  const holdingData = chartData ? [
    { name: 'Promoter', value: parseFloat(chartData['Promoter holding']) || 0 },
    { name: 'FII', value: parseFloat(chartData['FII holding']) || 0 },
    { name: 'DII', value: parseFloat(chartData['DII holding']) || 0 },
    { name: 'Public', value: 100 - ((parseFloat(chartData['Promoter holding']) || 0) + (parseFloat(chartData['FII holding']) || 0) + (parseFloat(chartData['DII holding']) || 0)) }
  ].filter(d => d.value > 0) : [];

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'];

  return (
    <div className="w-full max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-700 space-y-6">
      {/* Report Header */}
      <div className="bg-card border border-border rounded-2xl p-8 md:p-10 relative overflow-hidden shadow-lg">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider border border-primary/20">
                Visual Market Analysis
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
              Dynamic Market Intelligence Report
            </p>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleShare} className="hover-elevate">
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
            <Button variant="outline" size="sm" disabled>
              <Download className="w-4 h-4 mr-2" />
              PDF
            </Button>
          </div>
        </div>
      </div>

      {/* Graphical Data Section */}
      {chartData && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-card border border-border rounded-2xl p-6 shadow-md">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <BarChart className="w-5 h-5 text-primary" />
              Profit Growth (Last 3 Years)
            </h3>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ReBarChart data={profitData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" />
                  <XAxis dataKey="year" stroke="#888" fontSize={12} />
                  <YAxis stroke="#888" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: '8px' }}
                    itemStyle={{ color: '#10b981' }}
                  />
                  <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} />
                </ReBarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-card border border-border rounded-2xl p-6 shadow-md">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Price Trend (Line Chart)
            </h3>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={priceTrendData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" />
                  <XAxis dataKey="time" stroke="#888" fontSize={12} />
                  <YAxis stroke="#888" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: '8px' }}
                    itemStyle={{ color: '#3b82f6' }}
                  />
                  <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-card border border-border rounded-2xl p-6 shadow-md">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <PieChart className="w-5 h-5 text-primary" />
              Shareholding Structure (%)
            </h3>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RePieChart>
                  <Pie
                    data={holdingData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {holdingData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: '8px' }}
                  />
                </RePieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center flex-wrap gap-4 mt-2">
              {holdingData.map((entry, index) => (
                <div key={entry.name} className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                  <span className="text-xs text-muted-foreground">{entry.name}: {entry.value}%</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-card border border-border rounded-2xl p-6 shadow-md flex flex-col justify-center">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              Key Fundamentals
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-secondary/20 rounded-lg border border-border/50">
                <p className="text-xs text-muted-foreground uppercase">Debt to Equity</p>
                <p className="text-xl font-mono font-bold text-primary">{chartData?.['Debt to Equity ratio'] || 'N/A'}</p>
              </div>
              <div className="p-3 bg-secondary/20 rounded-lg border border-border/50">
                <p className="text-xs text-muted-foreground uppercase">ROE</p>
                <p className="text-xl font-mono font-bold text-primary">{chartData?.ROE || 'N/A'}</p>
              </div>
              <div className="p-3 bg-secondary/20 rounded-lg border border-border/50">
                <p className="text-xs text-muted-foreground uppercase">EPS</p>
                <p className="text-xl font-mono font-bold text-primary">{chartData?.EPS || 'N/A'}</p>
              </div>
              <div className="p-3 bg-secondary/20 rounded-lg border border-border/50">
                <p className="text-xs text-muted-foreground uppercase">Market Cap</p>
                <p className="text-sm font-mono font-bold text-primary truncate">{chartData?.['Market Capitalization'] || 'N/A'}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Markdown Content */}
      <div className="bg-background border border-border rounded-2xl p-8 md:p-12 shadow-inner relative">
        <div className="prose prose-invert prose-lg max-w-none prose-headings:text-primary prose-strong:text-emerald-400">
          <ReactMarkdown>{analysis.report.replace(/```json\n[\s\S]*?\n```/, '')}</ReactMarkdown>
        </div>
        
        <div className="mt-12 pt-8 border-t border-border/50 flex items-start gap-4 text-sm text-muted-foreground bg-secondary/10 p-6 rounded-xl">
          <AlertCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong>Disclaimer:</strong> This graphical report is generated by AI for informational purposes only. 
            It is not financial advice. Technical indicators and fundamental patterns are based on available historical data. 
            Always conduct your own research or consult a certified financial advisor before trading.
          </p>
        </div>
      </div>
    </div>
  );
}
