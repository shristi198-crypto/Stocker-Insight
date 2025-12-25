import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRoute } from "wouter";

const newsItems = [
  {
    id: "1",
    title: "Market Rally Continues: Sensex Reaches New High",
    content: "The Indian stock market indices, Sensex and Nifty, continued their bullish momentum today, driven by strong quarterly earnings from tech giants and positive global cues. Investors are showing increased confidence in the domestic recovery story.",
    date: "Dec 25, 2025",
    source: "MoneyControl"
  },
  {
    id: "2",
    title: "RBI Keeps Interest Rates Unchanged",
    content: "In its latest MPC meeting, the Reserve Bank of India decided to maintain the status quo on interest rates. This move aims to balance inflation management with growth support, a decision that has been welcomed by the banking sector.",
    date: "Dec 24, 2025",
    source: "MoneyControl"
  },
  {
    id: "3",
    title: "EV Sector Sees Massive Investment Surge",
    content: "The Electric Vehicle ecosystem in India is witnessing an unprecedented influx of capital. Both domestic majors and international players are announcing mega-factories, signaling a rapid shift towards green mobility in the subcontinent.",
    date: "Dec 23, 2025",
    source: "MoneyControl"
  }
];

export default function NewsPage() {
  const [, params] = useRoute("/news/:id");
  const news = newsItems.find(n => n.id === params?.id) || newsItems[0];

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="bg-[#f8f9fa] dark:bg-muted/30 p-8 rounded-xl border border-border/40 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <span className="bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded">NEWS</span>
            <span className="text-sm text-muted-foreground">{news.source} | {news.date}</span>
          </div>
          <h1 className="text-4xl font-extrabold text-[#212529] dark:text-foreground mb-6 leading-tight">
            {news.title}
          </h1>
          <div className="prose prose-lg dark:prose-invert max-w-none text-[#495057] dark:text-muted-foreground">
            {news.content.split('\n').map((paragraph, i) => (
              <p key={i} className="mb-4">{paragraph}</p>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {newsItems.map((item) => (
            <Card key={item.id} className="hover-elevate cursor-pointer overflow-hidden border-none shadow-md bg-white dark:bg-card">
              <CardHeader className="p-0">
                <div className="h-32 bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center p-4">
                  <span className="text-white font-bold text-center text-sm">{item.title}</span>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <div className="flex justify-between items-center text-xs text-muted-foreground mb-2">
                  <span>{item.source}</span>
                  <span>{item.date}</span>
                </div>
                <a href={`/news/${item.id}`} className="text-blue-600 hover:underline text-sm font-semibold">Read more →</a>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </Layout>
  );
}