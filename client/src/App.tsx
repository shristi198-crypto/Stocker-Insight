import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "./pages/Home";
import AnalysisPage from "./pages/AnalysisPage";
import StockLists from "./pages/StockLists";
import NewsPage from "./pages/NewsPage";
import News from "./pages/News";
import MarketMonitor from "./pages/MarketMonitor";
import CommoditiesPage from "./pages/CommoditiesPage";
import CapStocks from "./pages/CapStocks";
import Minhi from "./pages/Minhi";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/analysis/:id" component={AnalysisPage} />
      <Route path="/stocks" component={StockLists} />
      <Route path="/news" component={News} />
      <Route path="/news/:id" component={NewsPage} />
      <Route path="/monitor" component={MarketMonitor} />
      <Route path="/commodities" component={CommoditiesPage} />
      <Route path="/cap-stocks/:type" component={CapStocks} />
      <Route path="/minhi" component={Minhi} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
