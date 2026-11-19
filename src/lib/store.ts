import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';

// Remembers which channel questions were already handled, so a cycle never answers or escalates twice.
export type ProcessedRecord = { key: string; outcome: 'answered' | 'escalated'; at: string };
export type ProcessedStore = { has(key: string): boolean; add(record: ProcessedRecord): void };

export function createMemoryStore(): ProcessedStore {
  const records = new Map<string, ProcessedRecord>();
  return { has: (key) => records.has(key), add: (record) => void records.set(record.key, record) };
}

// shortcut: JSON file for a single worker process; move to Postgres (e.g. Supabase) for several workers or serverless.
export function createFileStore(path: string): ProcessedStore {
  const saved: ProcessedRecord[] = existsSync(path) ? JSON.parse(readFileSync(path, 'utf8')) : [];
  const records = new Map(saved.map((record) => [record.key, record]));
  return {
    has: (key) => records.has(key),
    add(record) {
      records.set(record.key, record);
      mkdirSync(dirname(path), { recursive: true });
      writeFileSync(path, JSON.stringify([...records.values()], null, 2) + '\n');
    },
  };
}
