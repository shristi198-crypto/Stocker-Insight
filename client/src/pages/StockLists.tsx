import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown } from "lucide-react";

const highVolume = [
  { symbol: "RELIANCE", price: "2,985.40", volume: "15.2M", change: "+1.2%" },
  { symbol: "HDFCBANK", price: "1,642.15", volume: "12.8M", change: "-0.5%" },
  { symbol: "ICICIBANK", price: "1,120.30", volume: "10.5M", change: "+0.8%" },
  { symbol: "INFY", price: "1,530.45", volume: "8.9M", change: "+2.1%" },
  { symbol: "TCS", price: "3,845.00", volume: "7.2M", change: "-1.1%" },
  { symbol: "AXISBANK", price: "1,085.60", volume: "6.8M", change: "+1.5%" },
  { symbol: "SBIN", price: "742.10", volume: "5.9M", change: "+0.3%" },
  { symbol: "BHARTIARTL", price: "1,245.30", volume: "5.1M", change: "+1.9%" },
  { symbol: "WIPRO", price: "485.20", volume: "4.8M", change: "-0.2%" },
  { symbol: "KOTAKBANK", price: "1,745.00", volume: "4.2M", change: "+0.6%" },
];

const lowVolume = [
  { symbol: "ZODIAC", price: "124.50", volume: "1.2K", change: "-2.1%" },
  { symbol: "MUKANDLTD", price: "165.30", volume: "2.5K", change: "+0.5%" },
  { symbol: "ORICON", price: "32.40", volume: "3.1K", change: "+1.2%" },
  { symbol: "ARVIND", price: "285.40", volume: "4.2K", change: "-0.8%" },
  { symbol: "RAMCOIND", price: "245.10", volume: "5.1K", change: "+0.2%" },
  { symbol: "SURYALAXMI", price: "85.30", volume: "6.2K", change: "-1.5%" },
  { symbol: "SURYAROSNI", price: "642.10", volume: "7.1K", change: "+1.1%" },
  { symbol: "SICAL", price: "45.20", volume: "8.2K", change: "+0.9%" },
  { symbol: "SINCLAIR", price: "210.40", volume: "9.1K", change: "-0.4%" },
  { symbol: "STEELXIND", price: "12.30", volume: "9.8K", change: "+0.1%" },
];

export default function StockLists() {
  return (
    <Layout>
      <div className="space-y-8">
        <h1 className="text-3xl font-bold">Stock Market Lists</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xl font-bold flex items-center gap-2">
                <TrendingUp className="text-emerald-600" />
                High Volume Stocks
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Symbol</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Volume</TableHead>
                    <TableHead className="text-right">Change</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {highVolume.map((stock) => (
                    <TableRow key={stock.symbol}>
                      <TableCell className="font-medium">{stock.symbol}</TableCell>
                      <TableCell>₹{stock.price}</TableCell>
                      <TableCell>{stock.volume}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant={stock.change.startsWith("+") ? "default" : "destructive"}>
                          {stock.change}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xl font-bold flex items-center gap-2">
                <TrendingDown className="text-red-500" />
                Low Volume Stocks
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Symbol</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Volume</TableHead>
                    <TableHead className="text-right">Change</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lowVolume.map((stock) => (
                    <TableRow key={stock.symbol}>
                      <TableCell className="font-medium">{stock.symbol}</TableCell>
                      <TableCell>₹{stock.price}</TableCell>
                      <TableCell>{stock.volume}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant={stock.change.startsWith("+") ? "default" : "destructive"}>
                          {stock.change}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}