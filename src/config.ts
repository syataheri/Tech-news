import dotenv from 'dotenv';

dotenv.config();

export const config = {
  telegramBotToken: process.env.TELEGRAM_BOT_TOKEN || '',
  telegramChatId: process.env.TELEGRAM_CHAT_ID || '',
  newsFeeds: (process.env.NEWS_FEEDS || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean),
  fetchLimit: Number(process.env.FETCH_LIMIT || 15),
  maxItems: Number(process.env.MAX_ITEMS || 5),
  logLevel: process.env.LOG_LEVEL || 'info',
};
