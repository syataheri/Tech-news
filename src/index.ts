import { fetchArticles } from './news.js';
import { sendTelegramDigest } from './telegram.js';

const isDryRun = process.argv.includes('--dry-run');

async function main() {
  try {
    const articles = await fetchArticles();

    if (!articles.length) {
      console.log('No relevant articles found.');
      return;
    }

    if (isDryRun) {
      console.log('Dry run: top articles selected for digest');
      for (const article of articles) {
        console.log(`- ${article.title} | score=${article.score} | source=${article.source}`);
      }
      return;
    }

    console.log('Sending digest to Telegram...');
    const result = await sendTelegramDigest(articles);
    console.log('Telegram send success:', result?.ok ? 'OK' : 'FAILED');
  } catch (error) {
    console.error('Failed to send news digest:', error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}

main();
