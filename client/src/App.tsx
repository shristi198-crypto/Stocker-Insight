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
import { PinLock } from "./components/PinLock";

function LockedStockLists() {
  return (
    <PinLock featureName="Stocks">
      <StockLists />
    </PinLock>
  );
}

function LockedNews() {
  return (
    <PinLock featureName="News">
      <News />
    </PinLock>
  );
}

function LockedNewsPage() {
  return (
    <PinLock featureName="News">
      <NewsPage />
    </PinLock>
  );
}

function LockedMarketMonitor() {
  return (
    <PinLock featureName="Monitor">
      <MarketMonitor />
    </PinLock>
  );
}

function LockedCommoditiesPage() {
  return (
    <PinLock featureName="Commodities">
      <CommoditiesPage />
    </PinLock>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/analysis/:id" component={AnalysisPage} />
      <Route path="/stocks" component={LockedStockLists} />
      <Route path="/news" component={LockedNews} />
      <Route path="/news/:id" component={LockedNewsPage} />
      <Route path="/monitor" component={LockedMarketMonitor} />
      <Route path="/commodities" component={LockedCommoditiesPage} />
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
