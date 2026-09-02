import Parser from 'rss-parser';
import { Article } from './types.js';
import { config } from './config.js';

const parser = new Parser();

const KEYWORDS = [
  'ai',
  'artificial intelligence',
  'machine learning',
  'llm',
  'generative ai',
  'backend',
  'infra',
  'infrastructure',
  'cloud',
  'database',
  'distributed systems',
  'developer tools',
  'security',
  'platform',
  'api',
  'microservices',
  'kubernetes',
  'data engineering',
  'systems',
  'performance',
  'software engineering',
  'mlops',
  'agents',
  'quantum',
  'gpu',
  'edge',
  'open source',
];

const getScore = (title: string, summary: string = '') => {
  const text = `${title} ${summary}`.toLowerCase();
  let score = 0;

  for (const word of KEYWORDS) {
    if (text.includes(word.toLowerCase())) score += 2;
  }

  if (/\b(ai|llm|ml|machine learning|generative|agent|agents)\b/i.test(text)) score += 5;
  if (/\b(backend|api|cloud|database|kubernetes|infra|security|platform|distributed systems)\b/i.test(text)) score += 4;
  if (/\b(startup|venture|developer tools|open source|performance|software engineering)\b/i.test(text)) score += 2;

  if (/\b(launch|release|update|new|announces)\b/i.test(title.toLowerCase())) score += 1;

  return score;
};

const normalizeText = (value?: string) =>
  (value || '').replace(/\s+/g, ' ').trim();

export async function fetchArticles(): Promise<Article[]> {
  const feeds = config.newsFeeds.length ? config.newsFeeds : [
    'https://techcrunch.com/feed/',
    'https://www.theverge.com/rss/index.xml',
    'https://www.wired.com/feed/rss',
    'https://feeds.arstechnica.com/arstechnica/index',
    'https://www.engadget.com/rss.xml',
    'https://gizmodo.com/rss',
    'https://www.cnet.com/rss/all/',
    'https://www.techradar.com/rss',
    'https://www.digitaltrends.com/feed/',
    'https://mashable.com/rss',
  ];

  const seen = new Set<string>();
  const articles: Article[] = [];

  for (const feedUrl of feeds) {
    try {
      const feed = await parser.parseURL(feedUrl);
      const items = feed.items || [];

      for (const item of items.slice(0, config.fetchLimit)) {
        const title = normalizeText(item.title);
        const summary = normalizeText(item.contentSnippet || item.summary || '');
        const link = item.link || '';
        const source = feed.title || 'Unknown source';

        if (!title || !link) continue;

        const uniqueKey = link || title.toLowerCase();
        if (seen.has(uniqueKey)) continue;
        seen.add(uniqueKey);

        const score = getScore(title, summary);

        if (score < 4) continue;

        articles.push({
          title,
          link,
          summary,
          pubDate: item.pubDate,
          source,
          score,
          keywords: KEYWORDS.filter((word) => `${title} ${summary}`.toLowerCase().includes(word.toLowerCase())),
        });
      }
    } catch (error) {
      console.warn(`Failed to fetch feed ${feedUrl}:`, error instanceof Error ? error.message : error);
    }
  }

  return articles
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      const aTime = a.pubDate ? new Date(a.pubDate).getTime() : 0;
      const bTime = b.pubDate ? new Date(b.pubDate).getTime() : 0;
      return bTime - aTime;
    })
    .slice(0, Math.max(1, config.maxItems || 5));
}
