import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchCryptoNews, NewsItem } from "@/lib/news";
import { useQuery } from "@tanstack/react-query";
import { Newspaper } from "lucide-react";

interface Props {
  symbol: string;
  date: Date;
}

export function NewsFeeds({ symbol, date }: Props) {
  const { data: news } = useQuery({
    queryKey: ['news', symbol, date.toISOString()],
    queryFn: () => fetchCryptoNews(symbol, date)
  });

  if (!news) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Newspaper className="h-5 w-5" />
          News & Social Updates
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {news.map((item: NewsItem) => (
            <a 
              key={item.id}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block hover:bg-accent p-2 rounded-lg"
            >
              <div className="font-medium">{item.title}</div>
              <div className="text-sm text-muted-foreground">
                {item.source} • {new Date(item.publishedAt).toLocaleDateString()}
              </div>
            </a>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
