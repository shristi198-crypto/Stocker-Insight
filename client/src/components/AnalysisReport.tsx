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
  const revenueData = chartData?.Revenue_Growth && Array.isArray(chartData.Revenue_Growth) 
    ? chartData.Revenue_Growth.map((val: number, i: number) => ({ year: `Y${i+1}`, value: val }))
    : [];

  const profitData = chartData?.Profit_Growth && Array.isArray(chartData.Profit_Growth)
    ? chartData.Profit_Growth.map((val: number, i: number) => ({ year: `Y${i+1}`, value: val }))
    : [];

  const priceTrendData = chartData?.Price_Trend && Array.isArray(chartData.Price_Trend)
    ? chartData.Price_Trend.map((val: number, i: number) => ({ time: `T${i+1}`, value: val }))
    : [];

  const volumeData = chartData?.Volume && Array.isArray(chartData.Volume)
    ? chartData.Volume.map((val: number, i: number) => ({ time: `V${i+1}`, value: val }))
    : [];

  const holdingData = chartData ? [
    { name: 'Promoter', value: parseFloat(chartData.Promoter_holding) || 0 },
    { name: 'FII', value: parseFloat(chartData.FII_holding) || 0 },
    { name: 'DII', value: parseFloat(chartData.DII_holding) || 0 },
    { name: 'Public', value: 100 - ((parseFloat(chartData.Promoter_holding) || 0) + (parseFloat(chartData.FII_holding) || 0) + (parseFloat(chartData.DII_holding) || 0)) }
  ].filter(d => d.value > 0) : [];

  const COLORS = ['#9333ea', '#3b82f6', '#f59e0b', '#ef4444'];

  return (
    <div className="w-full max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-700 space-y-6">
      {/* Report Header */}
      <div className="bg-card border border-border rounded-2xl p-8 md:p-10 relative overflow-hidden shadow-sm">
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

      {/* Market Snapshot Card */}
      {chartData && (
        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
            <p className="text-xs text-muted-foreground uppercase mb-1">CMP</p>
            <p className="text-2xl font-black text-primary">₹{chartData.CMP || 'N/A'}</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
            <p className="text-xs text-muted-foreground uppercase mb-1">EPS</p>
            <p className="text-2xl font-black text-primary">₹{chartData.EPS || 'N/A'}</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
            <p className="text-xs text-muted-foreground uppercase mb-1">ROE</p>
            <p className="text-2xl font-black text-primary">{chartData.ROE ? `${chartData.ROE}%` : 'N/A'}</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
            <p className="text-xs text-muted-foreground uppercase mb-1">D/E Ratio</p>
            <p className="text-2xl font-black text-primary">{chartData.Debt_to_Equity || 'N/A'}</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
            <p className="text-xs text-muted-foreground uppercase mb-1">52W High</p>
            <p className="text-2xl font-black text-emerald-600">₹{chartData.High_52 || 'N/A'}</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
            <p className="text-xs text-muted-foreground uppercase mb-1">52W Low</p>
            <p className="text-2xl font-black text-red-600">₹{chartData.Low_52 || 'N/A'}</p>
          </div>
        </div>
      )}

      {/* Graphical Data Section */}
      {chartData && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <BarChart className="w-5 h-5 text-primary" />
              Revenue Growth (Last 3-5 Years)
            </h3>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ReBarChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                  <XAxis dataKey="year" stroke="#888" fontSize={12} />
                  <YAxis stroke="#888" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #ddd', borderRadius: '8px' }}
                    itemStyle={{ color: '#9333ea' }}
                  />
                  <Bar dataKey="value" fill="#9333ea" radius={[4, 4, 0, 0]} />
                </ReBarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <BarChart className="w-5 h-5 text-primary" />
              Profit Growth (Last 3-5 Years)
            </h3>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ReBarChart data={profitData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                  <XAxis dataKey="year" stroke="#888" fontSize={12} />
                  <YAxis stroke="#888" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #ddd', borderRadius: '8px' }}
                    itemStyle={{ color: '#16a34a' }}
                  />
                  <Bar dataKey="value" fill="#16a34a" radius={[4, 4, 0, 0]} />
                </ReBarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Price Trend & Support/Resistance
            </h3>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={priceTrendData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                  <XAxis dataKey="time" stroke="#888" fontSize={12} />
                  <YAxis stroke="#888" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #ddd', borderRadius: '8px' }}
                    itemStyle={{ color: '#9333ea' }}
                  />
                  <Line type="monotone" dataKey="value" stroke="#9333ea" strokeWidth={3} dot={{ r: 4, fill: '#9333ea' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
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
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #ddd', borderRadius: '8px' }}
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

          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              Technical Indicators
            </h3>
            <div className="grid grid-cols-2 gap-4 h-full pb-4">
              <div className="p-4 bg-secondary/20 rounded-xl border border-border/50 flex flex-col justify-center text-center">
                <p className="text-xs text-muted-foreground uppercase mb-1">RSI (14)</p>
                <p className={`text-2xl font-black ${chartData.RSI > 70 ? 'text-red-600' : chartData.RSI < 30 ? 'text-emerald-600' : 'text-primary'}`}>
                  {chartData.RSI || 'N/A'}
                </p>
                <p className="text-[10px] text-muted-foreground">{chartData.RSI > 70 ? 'Overbought' : chartData.RSI < 30 ? 'Oversold' : 'Neutral'}</p>
              </div>
              <div className="p-4 bg-secondary/20 rounded-xl border border-border/50 flex flex-col justify-center text-center">
                <p className="text-xs text-muted-foreground uppercase mb-1">MACD</p>
                <p className="text-sm font-bold text-primary truncate px-1">{chartData.MACD || 'N/A'}</p>
              </div>
              <div className="p-4 bg-secondary/20 rounded-xl border border-border/50 flex flex-col justify-center text-center">
                <p className="text-xs text-muted-foreground uppercase mb-1">50-Day MA</p>
                <p className="text-xl font-mono font-bold text-primary">₹{chartData.MA_50 || 'N/A'}</p>
              </div>
              <div className="p-4 bg-secondary/20 rounded-xl border border-border/50 flex flex-col justify-center text-center">
                <p className="text-xs text-muted-foreground uppercase mb-1">200-Day MA</p>
                <p className="text-xl font-mono font-bold text-primary">₹{chartData.MA_200 || 'N/A'}</p>
              </div>
            </div>
          </div>
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Fundamental Metrics
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-secondary/20 rounded-xl border border-border/50">
                <p className="text-[10px] text-muted-foreground uppercase">EPS</p>
                <p className="text-lg font-bold text-primary">₹{chartData.EPS || 'N/A'}</p>
              </div>
              <div className="p-3 bg-secondary/20 rounded-xl border border-border/50">
                <p className="text-[10px] text-muted-foreground uppercase">ROE</p>
                <p className="text-lg font-bold text-primary">{chartData.ROE ? `${chartData.ROE}%` : 'N/A'}</p>
              </div>
              <div className="p-3 bg-secondary/20 rounded-xl border border-border/50">
                <p className="text-[10px] text-muted-foreground uppercase">D/E Ratio</p>
                <p className="text-lg font-bold text-primary">{chartData.Debt_to_Equity || 'N/A'}</p>
              </div>
              <div className="p-3 bg-secondary/20 rounded-xl border border-border/50">
                <p className="text-[10px] text-muted-foreground uppercase">Holdings (P/F/D)</p>
                <p className="text-sm font-bold text-primary">{chartData.Promoter_holding}% / {chartData.FII_holding}% / {chartData.DII_holding}%</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Volume Chart */}
      {chartData && (
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" />
            Volume Analysis
          </h3>
          <div className="h-[150px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ReBarChart data={volumeData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                <XAxis dataKey="time" hide />
                <YAxis hide />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #ddd', borderRadius: '8px' }}
                />
                <Bar dataKey="value" fill="#9333ea" radius={[2, 2, 0, 0]} />
              </ReBarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Markdown Content */}
      <div className="bg-white border border-border rounded-2xl p-8 md:p-12 shadow-sm relative">
        <div className="prose prose-lg max-w-none prose-headings:text-primary prose-strong:text-emerald-600">
          <ReactMarkdown>{analysis.report.replace(/```json\n[\s\S]*?\n```/, '')}</ReactMarkdown>
        </div>
        
        <div className="mt-12 pt-8 border-t border-border/50 flex items-start gap-4 text-sm text-muted-foreground bg-secondary/30 p-6 rounded-xl">
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
