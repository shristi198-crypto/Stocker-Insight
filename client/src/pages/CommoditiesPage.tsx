import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Newspaper, TrendingUp, BookOpen, Zap, Droplets, Landmark, Flame } from "lucide-react";

export default function CommoditiesPage() {
  const commodities = [
    { name: "Gold", symbol: "GC=F", price: "2,050.40", change: "+0.45%", icon: Zap, color: "text-yellow-500" },
    { name: "Silver", symbol: "SI=F", price: "23.15", change: "-0.20%", icon: Droplets, color: "text-slate-400" },
    { name: "Crude Oil", symbol: "CL=F", price: "72.45", change: "+1.15%", icon: Flame, color: "text-orange-500" },
    { name: "Natural Gas", symbol: "NG=F", price: "2.54", change: "-3.40%", icon: Landmark, color: "text-blue-500" },
  ];

  const bidActivities = [
    { commodity: "Gold", bid: "2,050.35", ask: "2,050.45", volume: "12.4k" },
    { commodity: "Silver", bid: "23.12", ask: "23.18", volume: "8.1k" },
    { commodity: "Crude Oil", bid: "72.42", ask: "72.48", volume: "10.5k" },
    { commodity: "Natural Gas", bid: "2.52", ask: "2.56", volume: "15.2k" },
  ];

  const currentUpdates = [
    { title: "Gold prices steady ahead of Fed meeting", time: "5 mins ago" },
    { title: "Oil gains on supply disruption fears", time: "15 mins ago" },
    { title: "Natural gas plunges due to warm weather", time: "45 mins ago" },
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-black tracking-tighter uppercase italic text-foreground mb-8">
        Commodities Center
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Market Overview */}
        <div className="md:col-span-2 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {commodities.map((c) => (
              <Card key={c.name} className="hover-elevate">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div className="flex items-center gap-2">
                    <c.icon className={`w-5 h-5 ${c.color}`} />
                    <CardTitle className="text-sm font-bold">{c.name}</CardTitle>
                  </div>
                  <Badge variant={c.change.startsWith("+") ? "default" : "destructive"} className="text-[10px]">
                    {c.change}
                  </Badge>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-black font-mono">{c.price}</div>
                  <p className="text-xs text-muted-foreground">{c.symbol}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="hover-elevate">
            <CardHeader>
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                BID ACTIVITIES
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>COMMODITY</TableHead>
                    <TableHead>BID</TableHead>
                    <TableHead>ASK</TableHead>
                    <TableHead className="text-right">VOL</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bidActivities.map((activity) => (
                    <TableRow key={activity.commodity}>
                      <TableCell className="font-bold">{activity.commodity}</TableCell>
                      <TableCell className="font-mono text-emerald-600">{activity.bid}</TableCell>
                      <TableCell className="font-mono text-red-600">{activity.ask}</TableCell>
                      <TableCell className="text-right font-mono">{activity.volume}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* Real-time Updates Sidebar */}
        <Card className="hover-elevate border-primary/20 bg-primary/5 h-fit sticky top-6">
          <CardHeader>
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Newspaper className="w-4 h-4 text-primary" />
              CURRENT UPDATES
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {currentUpdates.map((update, i) => (
              <div key={i} className="space-y-1 group">
                <p className="text-sm font-bold leading-tight group-hover:text-primary transition-colors cursor-pointer">
                  {update.title}
                </p>
                <p className="text-[10px] text-muted-foreground uppercase">{update.time}</p>
                {i < currentUpdates.length - 1 && <div className="h-px bg-border mt-4" />}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
