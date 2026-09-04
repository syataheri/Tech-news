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

const DEVELOPER_SIGNALS = [
  'model',
  'models',
  'inference',
  'training',
  'embedding',
  'embeddings',
  'vector database',
  'retrieval augmented generation',
  'rag',
  'fine-tuning',
  'fine tuning',
  'sdk',
  'api',
  'framework',
  'runtime',
  'container',
  'kubernetes',
  'observability',
  'latency',
  'scaling',
  'database',
  'distributed systems',
  'open source',
  'vulnerability',
  'zero-day',
];

const EXCLUDED_PATTERNS = [
  /\b(acqui(?:re|red|res|ring)|acquisition|buying|bought|merger|merges|takeover)\b/i,
  /\b(raises?|raised|funding|fundraise|series [a-z]|venture capital|valuation|investors?)\b/i,
  /\b(earnings|revenue|quarterly results|financial results|stock|shares|ipo)\b/i,
  /\b(ifa|smartphone|phone review|headphones?|speakers?|television|tv review|laptop review|gaming console|wearable|smart home)\b/i,
  /\b(preorder|buying guide|best .* to buy|hands-on review|review:|reviews)\b/i,
];

const isExcluded = (title: string) =>
  EXCLUDED_PATTERNS.some((pattern) => pattern.test(title));

const containsKeyword = (text: string, keyword: string) => {
  const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`\\b${escapedKeyword}\\b`, 'i').test(text);
};

const getScore = (title: string, summary: string = '') => {
  const text = `${title} ${summary}`.toLowerCase();
  let score = 0;

  for (const word of KEYWORDS) {
    if (containsKeyword(text, word)) score += 2;
  }

  if (/\b(ai|llm|ml|machine learning|generative|agent|agents)\b/i.test(text)) score += 4;
  if (/\b(backend|api|cloud|database|kubernetes|infra|security|platform|distributed systems)\b/i.test(text)) score += 6;
  if (DEVELOPER_SIGNALS.some((signal) => containsKeyword(text, signal))) score += 5;
  if (/\b(startup|venture|developer tools|open source|performance|software engineering)\b/i.test(text)) score += 2;

  if (/\b(launch|release|update|new|announces)\b/i.test(title.toLowerCase())) score += 1;

  return score;
};

const normalizeText = (value?: string) =>
  (value || '').replace(/\s+/g, ' ').trim();

const DEVELOPER_FEEDS = [
  'https://aws.amazon.com/blogs/architecture/feed/',
  'https://blog.cloudflare.com/rss/',
  'https://github.blog/feed/',
  'https://kubernetes.io/feed.xml',
  'https://netflixtechblog.com/feed',
  'https://openai.com/blog/rss.xml',
];

export async function fetchArticles(): Promise<Article[]> {
  const generalFeeds = config.newsFeeds.length ? config.newsFeeds : [
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
  const feeds = [...new Set([...generalFeeds, ...DEVELOPER_FEEDS])];

  const seen = new Set<string>();
  const articles: Article[] = [];

  const feedResults = await Promise.allSettled(feeds.map(async (feedUrl) => {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);
      const response = await fetch(feedUrl, {
        signal: controller.signal,
        headers: { 'User-Agent': 'TechNewsTelegramAgent/1.0' },
      });
      clearTimeout(timeout);

      if (!response.ok) {
        throw new Error(`Status code ${response.status}`);
      }

      const feed = await parser.parseString(await response.text());
      const items = feed.items || [];
      const feedArticles: Article[] = [];

      for (const item of items.slice(0, config.fetchLimit)) {
        const title = normalizeText(item.title);
        const summary = normalizeText(item.contentSnippet || item.summary || '');
        const link = item.link || '';
        const source = feed.title || 'Unknown source';

        if (!title || !link) continue;
        if (isExcluded(title)) continue;

        const score = getScore(title, summary);

        if (score < 4) continue;

        feedArticles.push({
          title,
          link,
          summary,
          pubDate: item.pubDate,
          source,
          score,
          keywords: KEYWORDS.filter((word) => containsKeyword(`${title} ${summary}`, word)),
        });
      }

      return feedArticles;
    } catch (error) {
      console.warn(`Failed to fetch feed ${feedUrl}:`, error instanceof Error ? error.message : error);
      return [];
    }
  }));

  for (const result of feedResults) {
    if (result.status !== 'fulfilled') continue;
    for (const article of result.value) {
      const uniqueKey = article.link || article.title.toLowerCase();
      if (seen.has(uniqueKey)) continue;
      seen.add(uniqueKey);
      articles.push(article);
    }
  }

  const rankedArticles = articles.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      const aTime = a.pubDate ? new Date(a.pubDate).getTime() : 0;
      const bTime = b.pubDate ? new Date(b.pubDate).getTime() : 0;
      return bTime - aTime;
    });

  const maxItems = Math.max(1, config.maxItems || 5);
  const maxPerSource = Math.max(1, Math.ceil(maxItems / 3));
  const selected: Article[] = [];
  const sourceCounts = new Map<string, number>();

  for (const article of rankedArticles) {
    if (selected.length >= maxItems) break;
    if (sourceCounts.has(article.source)) continue;

    selected.push(article);
    sourceCounts.set(article.source, 1);
  }

  for (const article of rankedArticles) {
    if (selected.length >= maxItems) break;
    const count = sourceCounts.get(article.source) || 0;
    if (count >= maxPerSource || selected.includes(article)) continue;

    selected.push(article);
    sourceCounts.set(article.source, count + 1);
  }

  return selected;
}
