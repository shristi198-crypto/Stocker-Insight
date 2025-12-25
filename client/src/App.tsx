import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import AnalysisPage from "@/pages/AnalysisPage";
import StockLists from "@/pages/StockLists";
import NewsPage from "@/pages/NewsPage";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/analysis/:id" component={AnalysisPage} />
      <Route path="/stocks" component={StockLists} />
      <Route path="/news/:id" component={NewsPage} />
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
