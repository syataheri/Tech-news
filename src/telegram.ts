import { config } from './config.js';
import { Article } from './types.js';

const TELEGRAM_API = 'https://api.telegram.org';

const decodeHtmlEntities = (value: string) =>
  value
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#039;/gi, "'")
    .replace(/&#8217;/gi, "'")
    .replace(/&rsquo;/gi, "'")
    .replace(/&lsquo;/gi, "'")
    .replace(/&#8216;/gi, "'")
    .replace(/&#8220;/gi, '"')
    .replace(/&#8221;/gi, '"')
    .replace(/&ldquo;/gi, '"')
    .replace(/&rdquo;/gi, '"');

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const summarize = (article: Article) => {
  const raw = article.summary || article.title || '';
  const clean = decodeHtmlEntities(raw)
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!clean) {
    return 'A notable update worth watching.';
  }

  return clean.length > 220 ? `${clean.slice(0, 217).trim()}...` : clean;
};

const normalizeSource = (source?: string) =>
  (source || 'Tech news').replace(/^Latest from\s+/i, '').trim();

const getSignalTag = (article: Article) => {
  const labels = article.keywords || [];
  if (labels.some((keyword) => /ai|llm|generative|ml|agent/i.test(keyword))) return '🤖 AI';
  if (labels.some((keyword) => /backend|infra|cloud|database|kubernetes|api/i.test(keyword))) return '⚙️ Infra';
  if (labels.some((keyword) => /security|platform|performance/i.test(keyword))) return '🛡️ Security';
  return '💡 Tech';
};

export function buildDigestText(articles: Article[]) {
  const intro = '<b>⚡ Tech Pulse</b> — five signals worth your time today';

  const body = articles.map((article, index) => {
    const title = escapeHtml(decodeHtmlEntities(article.title || 'Untitled'));
    const summary = escapeHtml(summarize(article));
    const source = escapeHtml(normalizeSource(article.source));
    const tag = escapeHtml(getSignalTag(article));
    const link = article.link
      ? `\n🔗 <a href="${escapeHtml(article.link)}">Read more</a>`
      : '';

    return `<b>${index + 1}.</b> <b>${tag}</b> <b>${title}</b>\n<i>${source}</i>\n${summary}${link}`;
  }).join('\n\n');

  return `${intro}\n\n${body}`;
}

export async function sendTelegramDigest(articles: Article[]) {
  if (!config.telegramBotToken || !config.telegramChatId) {
    throw new Error('TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID must be set.');
  }

  const text = buildDigestText(articles);

  const url = `${TELEGRAM_API}/bot${config.telegramBotToken}/sendMessage`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      chat_id: config.telegramChatId,
      text,
      parse_mode: 'HTML',
      disable_web_page_preview: true,
    }),
  });

  const payload = await response.json();
  if (!response.ok || !payload.ok) {
    throw new Error(JSON.stringify(payload));
  }

  return payload;
}
