import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CachedQuery } from '../../src/infrastructure/cache/CachedQuery.js';
import { FakeCache } from './FakeCache.js';

describe('CachedQuery (decorator de cache-aside, sem input)', () => {
  let cache: FakeCache;

  beforeEach(() => {
    cache = new FakeCache();
  });

  it('na primeira chamada (cache miss), executa a query real e guarda o resultado', async () => {
    const query = { execute: vi.fn().mockResolvedValue(['a', 'b']) };
    const cachedQuery = new CachedQuery(query, cache, 'a-chave', 60);

    const result = await cachedQuery.execute();

    expect(result).toEqual(['a', 'b']);
    expect(query.execute).toHaveBeenCalledTimes(1);
    expect(await cache.get('a-chave')).toEqual(['a', 'b']);
  });

  it('na segunda chamada (cache hit), não executa a query real de novo', async () => {
    const query = { execute: vi.fn().mockResolvedValue(['a', 'b']) };
    const cachedQuery = new CachedQuery(query, cache, 'a-chave', 60);

    await cachedQuery.execute();
    const result = await cachedQuery.execute();

    expect(result).toEqual(['a', 'b']);
    expect(query.execute).toHaveBeenCalledTimes(1);
  });
});
