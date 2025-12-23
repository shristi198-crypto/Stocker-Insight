import { useRoute } from "wouter";
import { useAnalysis } from "@/hooks/use-analysis";
import { Layout } from "@/components/Layout";
import { AnalysisReport } from "@/components/AnalysisReport";
import { Loader2, AlertTriangle, ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function AnalysisPage() {
  const [, params] = useRoute("/analysis/:id");
  const id = parseInt(params?.id || "0");
  const { data: analysis, isLoading, error } = useAnalysis(id);

  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-pulse"></div>
            <Loader2 className="w-12 h-12 text-primary animate-spin relative z-10" />
          </div>
          <p className="text-lg font-medium text-muted-foreground animate-pulse">
            Loading analysis data...
          </p>
        </div>
      </Layout>
    );
  }

  if (error || !analysis) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex flex-col items-center justify-center gap-6 text-center max-w-md mx-auto">
          <div className="w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="w-10 h-10 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold">Analysis Not Found</h1>
          <p className="text-muted-foreground">
            We couldn't find the analysis report you're looking for. It may have been deleted or the ID is incorrect.
          </p>
          <Link href="/">
            <Button variant="default" size="lg" className="mt-4 gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Button>
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mb-8">
        <Link href="/" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Link>
      </div>
      <AnalysisReport analysis={analysis} />
    </Layout>
  );
}
