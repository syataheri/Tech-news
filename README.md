# Tech News Telegram Agent

A small Node.js app that fetches recent AI, backend, and general tech stories from RSS feeds and sends a compact digest to Telegram.

## Features
- Collects recent tech and AI headlines from multiple RSS feeds
- Uses a curated list of sources including TechCrunch, The Verge, Wired, Ars Technica, Engadget, Gizmodo, CNET, TechRadar, Digital Trends, and Mashable
- Filters by relevant keywords and deduplicates articles
- Selects the best 4–5 items for a digest
- Sends the digest to Telegram
- Works locally and can be deployed to a cloud scheduler/serverless runtime

## Quick start

1. Install dependencies:
   ```bash
   npm install
   ```

2. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

3. Fill in your Telegram details in `.env`.

4. Run a dry test:
   ```bash
   npm run dry-run
   ```

5. Send the digest for real:
   ```bash
   npm run dev
   ```

## Environment variables
- `TELEGRAM_BOT_TOKEN`: Telegram bot token
- `TELEGRAM_CHAT_ID`: ID of the chat where the digest should be sent
- `NEWS_FEEDS`: comma-separated list of RSS feed URLs
- `FETCH_LIMIT`: number of feed items to collect before ranking
- `MAX_ITEMS`: maximum number of items in the final digest

## Cloud deployment
This app is designed to be cloud-friendly. It can run as a scheduled task in Cloud Run, Azure Container Apps, or another serverless environment. The entry point is `src/index.ts`.

## Notes
The app focuses on AI, backend engineering, developer tooling, infra, and adjacent technology topics. It intentionally avoids low-quality general gossip.
