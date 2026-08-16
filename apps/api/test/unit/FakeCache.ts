import type { Cache } from '../../src/infrastructure/cache/Cache.js';

/** Fake do cache, em memória — usado apenas em testes, sem Redis de verdade. */
export class FakeCache implements Cache {
  private readonly store = new Map<string, unknown>();

  async get<T>(key: string): Promise<T | null> {
    return this.store.has(key) ? (this.store.get(key) as T) : null;
  }

  async set(key: string, value: unknown): Promise<void> {
    this.store.set(key, value);
  }

  async delByPrefix(prefix: string): Promise<void> {
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) {
        this.store.delete(key);
      }
    }
  }

  /** Só para os testes inspecionarem o estado interno sem expor o Map de verdade. */
  has(key: string): boolean {
    return this.store.has(key);
  }
}
