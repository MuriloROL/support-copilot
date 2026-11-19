# Support Copilot

AI copilot that triages customer support tickets for **Bazar Orion**, a fictional Brazilian e-commerce store. It answers from the help center with cited sources and hands the ticket to a human, with a case summary, when it should not answer.

## How it works

1. **Retrieval** — BM25 keyword search over the help center articles (`src/lib/search.ts`). Each article carries curated synonyms that customers actually type.
2. **Generation** — the top 3 articles plus the ticket go to an LLM through OpenRouter. The model must return validated JSON: decision, answer, cited article ids, confidence and a handoff summary (`src/lib/copilot.ts`).
3. **Guardrails in code** — the decision is overridden to "human" when:
   - a business rule matches (legal threats, billing disputes or fraud, LGPD data deletion);
   - the answer cites an article that was not retrieved, or cites nothing;
   - confidence is below 0.6;
   - the model output is not valid JSON.

   Customer text is treated as data, never as instructions.

## Evaluation

`src/data/tickets.ts` holds labeled tickets: which ones must be answered (and from which article) and which ones need a human. `npm run eval` runs the copilot against them and writes the metrics shown at `/eval`:

- decision accuracy;
- missed escalations (the most expensive error);
- unnecessary escalations;
- retrieval hit rate;
- citation accuracy;
- latency and cost per ticket.

`npm test` runs offline checks (retrieval against every labeled ticket, policy rules, the JSON parser and the guardrails) without calling the model.

## Marketplace integration (worker)

The same copilot can answer customers where they actually ask: questions on Mercado Livre listings. Each cycle of `npm run worker`:

1. Polls the channel for unanswered questions (`GET /questions/search?seller_id=…&api_version=4`).
2. Skips questions it already handled, using the processed store in `data/processed.json`.
3. Runs each question through the copilot with the channel's rules in the prompt.
4. Publishes the answer (`POST /answers`), or leaves the question pending and sends the handoff to a Slack-compatible webhook.

Channel rules are also enforced in code. Mercado Livre answers are public, so a reply containing a link, e-mail, phone number or WhatsApp is handed off instead of published.

If one question fails (model timeout, API error), the rest of the cycle still runs, and the failed question is retried in the next cycle.

```bash
npm run worker               # loop every SYNC_INTERVAL_MINUTES (default 5)
npm run worker -- --once     # one cycle, for system cron or a Kubernetes CronJob
CHANNEL=mercadolivre npm run worker   # real API: needs ML_ACCESS_TOKEN and ML_SELLER_ID
```

Without credentials, the worker uses a simulated marketplace in the Mercado Livre format (`src/lib/channels/simulated.ts`). The `/marketplace` page runs one cycle of it live.

Adding Shopee or a helpdesk means implementing the `Channel` interface in `src/lib/channels/types.ts`: `fetchPending`, `reply` and `checkReply`.

## Run locally

```bash
npm install
cp .env.example .env.local   # add your OPENROUTER_API_KEY
npm run dev                  # http://localhost:3000
npm test
npm run eval
```

## Stack

Next.js 16 (App Router, Route Handlers), TypeScript, Tailwind CSS 4, OpenRouter (default model `anthropic/claude-haiku-5.5`). There is no database: the help center and the eval set are TypeScript modules, so the same code runs in Next.js and in the Node eval script.

## Known limits

- Keyword search with prefix stemming fits a small help center. Past a few hundred articles, move to embeddings (pgvector).
- Rate limiting is in memory per serverless instance. Use Vercel KV or Upstash for real traffic.
- The Mercado Livre connector reads `ML_ACCESS_TOKEN` from the environment and does not rotate it. Access tokens last 6 hours and refresh tokens are single use, so running unattended needs a persisted token store.
- The processed store is a JSON file for a single worker. Use Postgres when running several workers.
