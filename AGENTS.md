# Tech News Telegram Agent

## Purpose
This project sends a curated digest of AI, backend, infrastructure, and general technology news to a Telegram chat. The goal is to surface the most relevant 4–5 stories in a concise, readable format without spamming the chat.

## Primary workflow
1. Read configured RSS feeds from the environment or the default fallback list.
2. Filter out low-signal or irrelevant results.
3. Deduplicate items by URL/title.
4. Rank stories by AI/backend/tech relevance and recency.
5. Select the best 5 stories.
6. Compose a Telegram-ready digest with summaries and links.
7. Send the digest to the configured chat.
8. Log success or failure for monitoring.

## Default sources
Use a curated set of feeds such as:
- TechCrunch
- The Verge
- Wired
- Ars Technica
- TechRadar
- Engadget
- Gizmodo
- CNET
- Digital Trends
- Mashable

Some feeds may occasionally be blocked or unavailable. The app should continue with the remaining sources and log warnings instead of failing the whole run.

## Environment variables
- `TELEGRAM_BOT_TOKEN`: Telegram bot token
- `TELEGRAM_CHAT_ID`: target chat or user ID
- `NEWS_FEEDS`: comma-separated RSS feeds (optional)
- `FETCH_LIMIT`: number of items to pull per feed
- `MAX_ITEMS`: number of stories in the final digest
- `LOG_LEVEL`: log verbosity

## Execution
- Local dry run: `npm run dry-run`
- Local send: `npm run dev`
- Build check: `npm run build`

## Output style
The Telegram digest should:
- focus on AI, backend, infra, developer tooling, and adjacent tech themes
- keep the final list to 4–5 top stories
- prefer compact but insightful summaries over raw titles
- include links to allow quick checking
- use readable formatting with bold labels and concise copy

## Cloud deployment note
This application is designed to run as a scheduled cloud job. A practical deployment is a serverless container or function triggered by a cron schedule, with the Telegram bot token and chat ID stored in environment variables or a secrets manager.

## Maintenance notes
- If a feed becomes unreliable, remove or replace it in the source list.
- If the digest starts drifting away from your ideal signal, increase relevance scoring for AI/backend keywords.
- Keep the final output style polished but concise; Telegram users prefer short and scannable summaries.
