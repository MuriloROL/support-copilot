import type { Article } from '../data/kb.ts';

export type SearchHit = { article: Article; score: number };

const STOPWORDS = new Set(
  ('para pra com que uma umas uns por mas nao sim meu minha meus minhas seu sua seus suas voce voces ' +
    'como qual quais quando onde esta estou ainda isso esse essa este esta dos das nos nas pelo pela ' +
    'foi ser tem ter fazer faco ja mais muito vez vezes ate sem sobre').split(' '),
);

// shortcut: prefix stemming (first 5 chars) instead of a real Portuguese stemmer or embeddings;
// upgrade to pgvector embeddings once the help center grows past a few hundred articles.
export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length > 2 && !STOPWORDS.has(token))
    .map((token) => token.slice(0, 5));
}

/** BM25 index over whole articles; titles count twice so they weigh more than keywords and body. */
export function createIndex(articles: Article[]) {
  const k1 = 1.5;
  const b = 0.75;
  const docs = articles.map((article) => {
    const tokens = tokenize(`${article.title} ${article.title} ${article.keywords} ${article.body}`);
    const termFreq = new Map<string, number>();
    for (const token of tokens) termFreq.set(token, (termFreq.get(token) ?? 0) + 1);
    return { article, length: tokens.length, termFreq };
  });
  const avgLength = docs.reduce((sum, doc) => sum + doc.length, 0) / docs.length;
  const docFreq = new Map<string, number>();
  for (const doc of docs) for (const token of doc.termFreq.keys()) docFreq.set(token, (docFreq.get(token) ?? 0) + 1);

  return function search(query: string, limit = 3): SearchHit[] {
    const queryTokens = [...new Set(tokenize(query))];
    return docs
      .map((doc) => {
        let score = 0;
        for (const token of queryTokens) {
          const freq = doc.termFreq.get(token);
          if (!freq) continue;
          const df = docFreq.get(token) ?? 0;
          const idf = Math.log(1 + (docs.length - df + 0.5) / (df + 0.5));
          score += (idf * freq * (k1 + 1)) / (freq + k1 * (1 - b + (b * doc.length) / avgLength));
        }
        return { article: doc.article, score };
      })
      .filter((hit) => hit.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  };
}
